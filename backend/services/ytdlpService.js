import ytdlp from "yt-dlp-exec";
import path from "path";
import fs from "fs";
import os from "os";
import http from "http";
import https from "https";
import { URL } from "url";
import { execFileSync } from "child_process";
import { randomUUID } from "crypto";
import { videoInfoCache } from "../utils/cache.js";
const TEMP_DIR = path.join(os.tmpdir(), "video-downloads");

const FACEBOOK_DOMAINS = ["facebook.com", "fb.watch"];
const REDDIT_SHORT_LINK_REGEX =
  /^(?:https?:\/\/)?(?:www\.|old\.)?reddit\.com\/r\/[^/]+\/s\/[a-zA-Z0-9]+/i;

const isFacebookUrl = (url) =>
  typeof url === "string" && FACEBOOK_DOMAINS.some((d) => url.includes(d));

const normalizeYouTubeUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  const match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return `https://www.youtube.com/watch?v=${match[1]}`;
  }
  return url;
};

const getYtdlpInstance = () => {
  if (
    process.env.YTDLP_CUSTOM_BINARY &&
    fs.existsSync(process.env.YTDLP_CUSTOM_BINARY)
  ) {
    return ytdlp.create(process.env.YTDLP_CUSTOM_BINARY);
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
    const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";
    const args = ["-s", "-o", nullDevice, "-w", "%{url_effective}", "-L", urlString];
    const resolved = execFileSync("curl", args, {
      encoding: "utf8",
      timeout: 10000,
    }).trim();
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

const resolveRedditShortLinkSync = (urlString) => {
  if (
    !urlString ||
    typeof urlString !== "string" ||
    !REDDIT_SHORT_LINK_REGEX.test(urlString)
  ) {
    return urlString;
  }
  try {
    const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";
    const args = ["-s", "-o", nullDevice, "-w", "%{url_effective}", "-L", urlString];
    const resolved = execFileSync("curl", args, {
      encoding: "utf8",
      timeout: 10000,
    }).trim();
    if (resolved && resolved !== urlString) {
      process.stdout.write(
        `[reddit resolver sync] Resolved short-link ${urlString} → ${resolved}\n`,
      );
      return resolved;
    }
  } catch (err) {
    process.stderr.write(
      `[reddit resolver sync] Resolution failed for ${urlString}: ${err.message}\n`,
    );
  }
  return urlString;
};

const prepareTargetUrl = async (url) =>
  normalizeYouTubeUrl(await resolveRedditShortLink(url));

const prepareTargetUrlSync = (url) =>
  normalizeYouTubeUrl(resolveRedditShortLinkSync(url));

const applyCommonFlags = (targetUrl, baseFlags) => {
  return {
    extractorArgs: "youtube:player_client=android,ios,mweb",
    ...baseFlags,
  };
};

const formatAndLogStderr = (fnName, url, error) => {
  const stderrDetails = error.stderr
    ? error.stderr.trim()
    : error.shortMessage || error.message || String(error);
  const exitCode = error.exitCode ?? error.code ?? "N/A";

  // When a Reddit/third-party post embeds YouTube, don't spam stderr with a failure notice since it's handled gracefully
  if (/\[youtube\]\s+[a-zA-Z0-9_-]{11}/i.test(stderrDetails)) {
    process.stdout.write(
      `[yt-dlp info] Detected embedded YouTube video in ${url} - delegating to youtubeService\n`
    );
    return;
  }

  process.stderr.write(
    `[yt-dlp error] ${fnName} failed for URL: ${url} (ExitCode: ${exitCode})\n[yt-dlp stderr]: ${stderrDetails}\n`,
  );
};

const executeWithFallback = async (fnName, targetUrl, flags, execAction) => {
  try {
    return await execAction(flags);
  } catch (error) {
    formatAndLogStderr(fnName, targetUrl, error);
    throw error;
  }
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

  const result = await executeWithFallback("fetchVideoInfo", targetUrl, flags, (runFlags) => {
    const ytdlpExec = getYtdlpInstance();
    return ytdlpExec(targetUrl, runFlags);
  });

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
      }
    );

    req.on("error", reject);
    req.on("timeout", () =>
      req.destroy(new Error("Connection timed out while downloading video stream."))
    );
  });
};

const downloadVideo = async (url, formatId, type) => {
  const targetUrl = await prepareTargetUrl(url);

  // Fast-path: If a direct progressive MP4 stream (audio + video muxed) is cached, stream directly over HTTP
  if (type !== "mute" && type !== "audio") {
    const cached = videoInfoCache.get(url);
    if (cached && Array.isArray(cached.formats)) {
      const matched = formatId
        ? cached.formats.find(
            (f) =>
              String(f.format_id) === String(formatId) ||
              String(f.formatId) === String(formatId)
          )
        : null;

      const directCandidate =
        matched ||
        cached.formats.find(
          (f) => f.vcodec !== "none" && f.acodec !== "none" && f.url
        );

      if (
        directCandidate &&
        directCandidate.url &&
        directCandidate.vcodec !== "none" &&
        directCandidate.acodec !== "none"
      ) {
        try {
          process.stdout.write(
            `[ytdlpService] Fast-path direct stream for ${targetUrl}\n`
          );
          return await getHttpStream(directCandidate.url);
        } catch (err) {
          process.stdout.write(
            `[ytdlpService] Fast-path stream failed, falling back to disk buffer: ${err.message}\n`
          );
        }
      }
    }
  }

  let formatArg = formatId ? `${formatId}+bestaudio/best` : "best";

  if (type === "mute") {
    formatArg = formatId ? `${formatId}` : "bestvideo";
  }

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const fileName = `video_${randomUUID()}.mp4`;
  const filePath = path.join(TEMP_DIR, fileName);

  const flags = applyCommonFlags(targetUrl, {
    output: filePath,
    format: formatArg,
    mergeOutputFormat: "mp4",
    noWarnings: true,
    socketTimeout: 30,
    retries: 1,
  });

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

export { fetchVideoInfo, downloadVideo, getAudioStream };
