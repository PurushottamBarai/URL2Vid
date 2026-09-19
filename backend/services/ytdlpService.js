import ytdlp from "yt-dlp-exec";
import path from "path";
import fs from "fs";
import os from "os";
import http from "http";
import https from "https";
import { URL } from "url";
import { randomUUID } from "crypto";
import { videoInfoCache } from "../utils/cache.js";
const TEMP_DIR = path.join(os.tmpdir(), "video-downloads");

const FACEBOOK_DOMAINS = ["facebook.com", "fb.watch"];
const REDDIT_SHORT_LINK_REGEX =
  /^(?:https?:\/\/)?(?:www\.|old\.)?reddit\.com\/r\/[^/]+\/s\/[a-zA-Z0-9]+/i;

const isFacebookUrl = (url) =>
  typeof url === "string" && FACEBOOK_DOMAINS.some((d) => url.includes(d));

const normalizeUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  const ytWatchMatch = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/i);
  if (ytWatchMatch && ytWatchMatch[1]) {
    return `https://www.youtube.com/watch?v=${ytWatchMatch[1]}`;
  }
  const match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return `https://www.youtube.com/watch?v=${match[1]}`;
  }
  const vimeoMatch = url.match(
    /vimeo\.com\/(?:channels\/[^/]+\/|groups\/[^/]+\/videos\/|album\/[^/]+\/video\/|video\/)?(\d+)/i,
  );
  if (vimeoMatch && vimeoMatch[1] && !url.includes("player.vimeo.com")) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return url;
};

const getYtdlpInstance = () => {
  const isWin = process.platform === "win32";
  const assetName = isWin ? "yt-dlp.exe" : "yt-dlp";
  const tempPath = path.join(os.tmpdir(), assetName);
  const binaryPath =
    process.env.YTDLP_CUSTOM_BINARY || (fs.existsSync(tempPath) ? tempPath : null);

  if (binaryPath && fs.existsSync(binaryPath)) {
    return ytdlp.create(binaryPath);
  }
  return ytdlp;
};

const resolveRedditShortLink = async (urlString) => {
  if (
    !urlString ||
    typeof urlString !== "string" ||
    !REDDIT_SHORT_LINK_REGEX.test(urlString)
  ) {
    return urlString;
  }
  try {
    const res = await fetch(urlString, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });
    const resolved = res.url;
    if (resolved && resolved !== urlString) {
      process.stdout.write(
        `[reddit resolver] Resolved short-link ${urlString} → ${resolved}\n`,
      );
      return resolved;
    }
  } catch (err) {
    process.stderr.write(
      `[reddit resolver] Resolution failed for ${urlString}: ${err.message}\n`,
    );
  }
  return urlString;
};

const prepareTargetUrl = async (url) =>
  normalizeUrl(await resolveRedditShortLink(url));

const applyCommonFlags = (targetUrl, baseFlags) => {
  const flags = {
    noPlaylist: true,
    ...baseFlags,
  };
  if (typeof targetUrl === "string" && /youtube\.com|youtu\.be/i.test(targetUrl)) {
    flags.extractorArgs = "youtube:player_client=android;player_skip=webpage,configs";
  }
  return flags;
};

const formatAndLogStderr = (fnName, url, error) => {
  const stderrDetails = error.stderr
    ? error.stderr.trim()
    : error.shortMessage || error.message || String(error);
  const exitCode = error.exitCode ?? error.code ?? "N/A";
  process.stderr.write(
    `[yt-dlp error] ${fnName} failed for URL: ${url} (ExitCode: ${exitCode})\n[yt-dlp stderr]: ${stderrDetails}\n`,
  );
};

const parsedLimit = parseInt(process.env.MAX_CONCURRENT_JOBS, 10);
const MAX_CONCURRENT_JOBS =
  Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 3;

class ConcurrencyLimiter {
  constructor(max) {
    this.max = max;
    this.running = 0;
    this.queue = [];
  }

  async run(fn) {
    if (this.running >= this.max) {
      await new Promise((resolve) => this.queue.push(resolve));
    }
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }
}

const jobLimiter = new ConcurrencyLimiter(MAX_CONCURRENT_JOBS);

const executeWithFallback = async (fnName, targetUrl, flags, execAction) => {
  return jobLimiter.run(async () => {
    try {
      return await execAction(flags);
    } catch (error) {
      formatAndLogStderr(fnName, targetUrl, error);
      throw error;
    }
  });
};

const fetchVideoInfo = async (url) => {
  const cached = videoInfoCache.get(url);
  if (cached) {
    return cached;
  }

  const targetUrl = await prepareTargetUrl(url);
  const flags = applyCommonFlags(targetUrl, {
    dumpJson: true,
    noWarnings: true,
    noCheckCertificate: true,
    socketTimeout: 20,
    retries: 1,
  });

  if (isFacebookUrl(targetUrl)) {
    flags.addHeader = [
      "referer:https://www.facebook.com/",
      "accept-language:en-US,en;q=0.9",
    ];
  }

  const result = await executeWithFallback(
    "fetchVideoInfo",
    targetUrl,
    flags,
    async (runFlags) => {
      const ytdlpExec = getYtdlpInstance();
      const { stdout } = await ytdlpExec.exec(targetUrl, runFlags);
      const trimmed = (stdout || "").trim();
      try {
        return JSON.parse(trimmed);
      } catch (parseErr) {
        const lines = trimmed.split("\n");
        for (const line of lines) {
          const l = line.trim();
          if (l.startsWith("{")) {
            try {
              return JSON.parse(l);
            } catch {}
          }
        }
        throw parseErr;
      }
    },
  );

  videoInfoCache.set(url, result);
  return result;
};

const getHttpStream = (streamUrl, maxRedirects = 5) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(streamUrl);
    const client = parsed.protocol === "http:" ? http : https;

    const req = client.get(
      streamUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept: "*/*",
          Connection: "keep-alive",
        },
        timeout: 30000,
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          maxRedirects > 0
        ) {
          resolve(getHttpStream(res.headers.location, maxRedirects - 1));
        } else if (res.statusCode >= 400) {
          reject(new Error(`Stream HTTP Error ${res.statusCode}`));
        } else {
          resolve(res);
        }
      },
    );

    req.on("error", reject);
    req.on("timeout", () =>
      req.destroy(
        new Error("Connection timed out while downloading video stream."),
      ),
    );
  });
};

// Quickly resolve a YouTube video ID for a search query without downloading
// Tier 1: YouTubei Internal Search API (fast, ~200ms, not IP-blocked on Render)
// Tier 2: yt-dlp ytsearch1 fallback
const resolveSearchVideoId = async (searchQuery) => {
  if (!searchQuery || typeof searchQuery !== 'string') return null;

  // Tier 1: YouTubei Search API
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        query: searchQuery,
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240722.01.00',
            hl: 'en',
            gl: 'US',
          },
        },
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      const sections =
        data.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents;
      const items = sections?.[0]?.itemSectionRenderer?.contents;
      if (Array.isArray(items)) {
        const firstVideo = items.find((i) => i.videoRenderer)?.videoRenderer;
        if (firstVideo?.videoId && /^[a-zA-Z0-9_-]{10,12}$/.test(firstVideo.videoId)) {
          return firstVideo.videoId;
        }
      }
    }
  } catch {}

  // Tier 2: yt-dlp search fallback
  return new Promise((resolve) => {
    try {
      const ytdlpExec = getYtdlpInstance();
      const proc = ytdlpExec.exec(
        `ytsearch1:${searchQuery}`,
        {
          print: 'id',
          noPlaylist: true,
          noWarnings: true,
          socketTimeout: 15,
        },
        { stdio: ['ignore', 'pipe', 'ignore'] },
      );

      let output = '';
      if (proc.stdout) proc.stdout.on('data', (chunk) => { output += chunk.toString(); });

      const timer = setTimeout(() => resolve(null), 15000);

      proc.on('close', () => {
        clearTimeout(timer);
        const id = output.trim().split('\n')[0].trim();
        resolve(/^[a-zA-Z0-9_-]{10,12}$/.test(id) ? id : null);
      });
      proc.on('error', () => { clearTimeout(timer); resolve(null); });
    } catch {
      resolve(null);
    }
  });
};

const downloadVideo = async (url, formatId, type) => {
  const targetUrl = await prepareTargetUrl(url);

  // Fast-path: Only direct stream if the user's specific format has progressive muxed audio+video,
  // or if 'best' is requested and the top video format is ALREADY progressive (no separate higher-res streams exist)
  if (type !== "mute" && type !== "audio") {
    const cached = videoInfoCache.get(url);
    if (cached && Array.isArray(cached.formats)) {
      let candidate = null;

      if (formatId && formatId !== "best") {
        const matched = cached.formats.find(
          (f) =>
            String(f.format_id) === String(formatId) ||
            String(f.formatId) === String(formatId),
        );
        if (
          matched &&
          matched.url &&
          matched.vcodec !== "none" &&
          matched.acodec !== "none"
        ) {
          candidate = matched;
        }
      } else {
        const videoFormats = cached.formats.filter((f) => f.vcodec !== "none");
        const hasSeparateHigherRes = videoFormats.some(
          (f) => f.acodec === "none" && (f.height > 480 || (f.tbr && f.tbr > 1200)),
        );

        if (!hasSeparateHigherRes) {
          const topProgressive = videoFormats
            .filter((f) => f.acodec !== "none" && f.url)
            .sort(
              (a, b) =>
                (b.height || b.tbr || 0) - (a.height || a.tbr || 0),
            )[0];
          if (topProgressive) {
            candidate = topProgressive;
          }
        }
      }

      if (candidate && candidate.url) {
        try {
          process.stdout.write(
            `[ytdlpService] Fast-path direct stream for ${targetUrl} (format ${candidate.format_id || candidate.formatId})\n`,
          );
          return await getHttpStream(candidate.url);
        } catch (err) {
          process.stdout.write(
            `[ytdlpService] Fast-path stream failed, falling back to disk buffer: ${err.message}\n`,
          );
        }
      }
    }
  }

  const formatArg =
    formatId && formatId !== "best"
      ? `${formatId}+bestaudio/best`
      : "bestvideo+bestaudio/best";

  const finalFormat =
    type === "mute"
      ? formatId && formatId !== "best"
        ? `${formatId}`
        : "bestvideo/best"
      : formatArg;

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const fileName = `video_${randomUUID()}.mp4`;
  const filePath = path.join(TEMP_DIR, fileName);

  const flags = applyCommonFlags(targetUrl, {
    output: filePath,
    format: finalFormat,
    mergeOutputFormat: "mp4",
    noWarnings: true,
    socketTimeout: 30,
    retries: 1,
  });

  if (isFacebookUrl(targetUrl)) {
    flags.addHeader = [
      "referer:https://www.facebook.com/",
      "accept-language:en-US,en;q=0.9",
    ];
  }

  await executeWithFallback("downloadVideo", targetUrl, flags, (runFlags) => {
    const ytdlpExec = getYtdlpInstance();
    return ytdlpExec(targetUrl, runFlags);
  });

  const stream = fs.createReadStream(filePath);
  stream.tempFilePath = filePath;

  const cleanupVideoFile = () => fs.unlink(filePath, () => {});
  stream.once("close", cleanupVideoFile);
  stream.once("error", cleanupVideoFile);

  return stream;
};

const getAudioStream = async (url) => {
  const targetUrl = await prepareTargetUrl(url);
  const flags = applyCommonFlags(targetUrl, {
    output: "-",
    format: "bestaudio/best",
    noWarnings: true,
    socketTimeout: 30,
    retries: 1,
  });

  const ytdlpExec = getYtdlpInstance();
  const proc = ytdlpExec.exec(targetUrl, flags, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderrBuffer = "";
  if (proc.stderr) {
    proc.stderr.on("data", (chunk) => {
      stderrBuffer += chunk.toString();
    });
  }

  proc.on("error", (err) => {
    process.stderr.write(
      `[yt-dlp error] getAudioStream process error for URL: ${targetUrl}\n[yt-dlp stderr]: ${stderrBuffer || err.message}\n`,
    );
  });

  proc.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      process.stderr.write(
        `[yt-dlp error] getAudioStream exited with code ${code} for URL: ${targetUrl}\n[yt-dlp stderr]: ${stderrBuffer || "No stderr output"}\n`,
      );
    }
  });

  return proc;
};

export { fetchVideoInfo, downloadVideo, getAudioStream, resolveSearchVideoId };
