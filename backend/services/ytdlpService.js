import ytdlp from "yt-dlp-exec";
import path from "path";
import fs from "fs";
import os from "os";
import { execFileSync } from "child_process";
import { randomUUID } from "crypto";
import { getProxy, reportFailure, getPoolSize } from "./proxyManager.js";

const TEMP_DIR = path.join(os.tmpdir(), "video-downloads");

const FACEBOOK_DOMAINS = ["facebook.com", "fb.watch"];
const PROXIED_DOMAINS = ["youtube.com", "youtu.be", "reddit.com"];
const REDDIT_SHORT_LINK_REGEX =
  /^(?:https?:\/\/)?(?:www\.|old\.)?reddit\.com\/r\/[^/]+\/s\/[a-zA-Z0-9]+/i;

const isFacebookUrl = (url) =>
  typeof url === "string" && FACEBOOK_DOMAINS.some((d) => url.includes(d));

const shouldProxyUrl = (url) =>
  typeof url === "string" && PROXIED_DOMAINS.some((d) => url.includes(d));

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
    const proxy = getProxy();
    const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";
    const args = ["-s", "-o", nullDevice, "-w", "%{url_effective}", "-L"];
    if (proxy) {
      args.push("--proxy", proxy);
    }
    args.push(urlString);
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
    const proxy = getProxy();
    const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";
    const args = ["-s", "-o", nullDevice, "-w", "%{url_effective}", "-L"];
    if (proxy) {
      args.push("--proxy", proxy);
    }
    args.push(urlString);
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
  const flags = {
    extractorArgs: "youtube:player_client=ios,android,tv,web",
    ...baseFlags,
  };

  if (shouldProxyUrl(targetUrl)) {
    const proxy = getProxy();
    if (proxy) {
      flags.proxy = proxy;
      flags.socketTimeout = 45;
      flags.retries = 3;
    }
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

const executeWithFallback = async (fnName, targetUrl, initialFlags, execAction) => {
  let flags = { ...initialFlags };
  const needsProxy = shouldProxyUrl(targetUrl);
  const poolSize = getPoolSize();
  const maxProxyAttempts = needsProxy ? Math.max(1, Math.min(poolSize, 10)) : 1;
  let attempts = 0;

  while (attempts < maxProxyAttempts) {
    try {
      return await execAction(flags);
    } catch (error) {
      attempts++;
      if (flags.proxy) {
        const failedProxy = flags.proxy;
        const errSnippet =
          error.stderr || error.shortMessage || error.message || String(error);
        const nextProxy = reportFailure(failedProxy, errSnippet.slice(0, 100));

        if (
          nextProxy &&
          nextProxy !== failedProxy &&
          attempts < maxProxyAttempts
        ) {
          process.stdout.write(
            `[yt-dlp ${fnName}] Retrying ${targetUrl} with next rotated proxy (${attempts}/${maxProxyAttempts})...\n`,
          );
          flags.proxy = nextProxy;
          continue;
        }

        if (!needsProxy) {
          process.stdout.write(
            `[yt-dlp ${fnName}] Retrying ${targetUrl} without proxy...\n`,
          );
          const { proxy, ...flagsWithoutProxy } = flags;
          try {
            return await execAction(flagsWithoutProxy);
          } catch (retryErr) {
            formatAndLogStderr(fnName, targetUrl, retryErr);
            throw retryErr;
          }
        }
      }
      formatAndLogStderr(fnName, targetUrl, error);
      throw error;
    }
  }
};

const fetchVideoInfo = async (url) => {
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

  return executeWithFallback("fetchVideoInfo", targetUrl, flags, (runFlags) => {
    const ytdlpExec = getYtdlpInstance();
    return ytdlpExec(targetUrl, runFlags);
  });
};

const downloadVideo = async (url, formatId, type) => {
  const targetUrl = await prepareTargetUrl(url);
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
