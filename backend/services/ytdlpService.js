import ytdlp from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FACEBOOK_DOMAINS = ['facebook.com', 'fb.watch'];
const REDDIT_SHORT_LINK_REGEX = /^(?:https?:\/\/)?(?:www\.|old\.)?reddit\.com\/r\/[^/]+\/s\/[a-zA-Z0-9]+/i;

const isFacebookUrl = (url) => FACEBOOK_DOMAINS.some(d => url.includes(d));

const getYtdlpInstance = () => {
  if (process.env.YTDLP_CUSTOM_BINARY && fs.existsSync(process.env.YTDLP_CUSTOM_BINARY)) {
    return ytdlp.create(process.env.YTDLP_CUSTOM_BINARY);
  }
  return ytdlp;
};

const resolveRedditShortLink = async (urlString) => {
  if (!urlString || typeof urlString !== 'string' || !REDDIT_SHORT_LINK_REGEX.test(urlString)) {
    return urlString;
  }
  try {
    const res = await fetch(urlString, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (res.url && res.url !== urlString) {
      process.stdout.write(`[reddit resolver] Resolved short-link ${urlString} → ${res.url}\n`);
      return res.url;
    }
  } catch (err) {
    process.stderr.write(`[reddit resolver] Resolution failed for ${urlString}: ${err.message}\n`);
  }
  return urlString;
};

const resolveRedditShortLinkSync = (urlString) => {
  if (!urlString || typeof urlString !== 'string' || !REDDIT_SHORT_LINK_REGEX.test(urlString)) {
    return urlString;
  }
  try {
    const isWin = process.platform === 'win32';
    const nullDev = isWin ? 'NUL' : '/dev/null';
    const cmd = `curl -s -o ${nullDev} -w "%{url_effective}" -L "${urlString}"`;
    const resolved = execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
    if (resolved && resolved !== urlString) {
      process.stdout.write(`[reddit resolver sync] Resolved short-link ${urlString} → ${resolved}\n`);
      return resolved;
    }
  } catch (err) {
    process.stderr.write(`[reddit resolver sync] Resolution failed for ${urlString}: ${err.message}\n`);
  }
  return urlString;
};

const getProxyFlags = () => {
  if (!process.env.YTDLP_PROXY) return {};
  return {
    proxy: process.env.YTDLP_PROXY,
    socketTimeout: 45,
    retries: 3,
  };
};

const getCookiesFlags = () => {
  const possiblePaths = [
    '/etc/secrets/cookies.txt',
    path.join(__dirname, '..', 'cookies.txt'),
    path.join(__dirname, '..', '..', 'cookies.txt'),
    path.join(process.cwd(), 'cookies.txt'),
    path.join(process.cwd(), 'backend', 'cookies.txt'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      process.stdout.write(`[cookies] Found cookies file at: ${p}\n`);
      return { cookies: p };
    }
  }

  if (process.env.YTDLP_COOKIES && process.env.YTDLP_COOKIES.trim()) {
    const tmpCookiesPath = path.join(os.tmpdir(), 'render_cookies.txt');
    try {
      fs.writeFileSync(tmpCookiesPath, process.env.YTDLP_COOKIES.trim() + '\n');
      process.stdout.write(`[cookies] Found YTDLP_COOKIES env var, written to: ${tmpCookiesPath}\n`);
      return { cookies: tmpCookiesPath };
    } catch (err) {
      process.stderr.write(`[cookies] Failed to write YTDLP_COOKIES to tmp: ${err.message}\n`);
    }
  }

  process.stderr.write(`[cookies] No cookies file found in search paths or YTDLP_COOKIES env var\n`);
  return {};
};

const applyCommonFlags = (baseFlags) => {
  const flags = {
    ...baseFlags,
    ...getCookiesFlags(),
    ...getProxyFlags(),
  };
  return flags;
};

const formatAndLogStderr = (fnName, url, error) => {
  const stderrDetails = error.stderr ? error.stderr.trim() : (error.shortMessage || error.message || String(error));
  const exitCode = error.exitCode ?? error.code ?? 'N/A';
  process.stderr.write(`[yt-dlp error] ${fnName} failed for URL: ${url} (ExitCode: ${exitCode})\n[yt-dlp stderr]: ${stderrDetails}\n`);
};

const fetchVideoInfo = async (url) => {
  const targetUrl = await resolveRedditShortLink(url);
  const flags = applyCommonFlags({
    dumpJson: true,
    noWarnings: true,
    noCheckCertificate: true,
    socketTimeout: 20,
    retries: 1,
  });

  if (isFacebookUrl(targetUrl)) {
    flags.addHeader = [
      'referer:https://www.facebook.com/',
      'accept-language:en-US,en;q=0.9',
    ];
  }

  try {
    const ytdlpExec = getYtdlpInstance();
    return await ytdlpExec(targetUrl, flags);
  } catch (error) {
    formatAndLogStderr('fetchVideoInfo', targetUrl, error);
    throw error;
  }
};

const downloadVideo = async (url, formatId, type) => {
  const targetUrl = await resolveRedditShortLink(url);
  let formatArg = formatId ? `${formatId}+bestaudio/best` : 'best';

  if (type === 'mute') {
    formatArg = formatId ? `${formatId}` : 'bestvideo';
  }

  const fileName = `video_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`;
  const tempDir = path.join(__dirname, '..', 'tmp');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, fileName);
  
  const flags = applyCommonFlags({
    output: filePath,
    format: formatArg,
    mergeOutputFormat: 'mp4',
    noWarnings: true,
    socketTimeout: 30,
    retries: 1,
  });

  try {
    const ytdlpExec = getYtdlpInstance();
    await ytdlpExec(targetUrl, flags);
  } catch (error) {
    formatAndLogStderr('downloadVideo', targetUrl, error);
    throw error;
  }

  const stream = fs.createReadStream(filePath);
  stream.tempFilePath = filePath;
  return stream;
};

const getAudioStream = (url) => {
  const targetUrl = resolveRedditShortLinkSync(url);
  const flags = applyCommonFlags({
    output: '-',
    format: 'bestaudio',
    noWarnings: true,
    socketTimeout: 30,
    retries: 1,
  });

  const ytdlpExec = getYtdlpInstance();
  const proc = ytdlpExec.exec(targetUrl, flags, { stdio: ['ignore', 'pipe', 'pipe'] });
  
  let stderrBuffer = '';
  if (proc.stderr) {
    proc.stderr.on('data', (chunk) => {
      stderrBuffer += chunk.toString();
    });
  }

  proc.on('error', (err) => {
    process.stderr.write(`[yt-dlp error] getAudioStream process error for URL: ${targetUrl}\n[yt-dlp stderr]: ${stderrBuffer || err.message}\n`);
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      process.stderr.write(`[yt-dlp error] getAudioStream exited with code ${code} for URL: ${targetUrl}\n[yt-dlp stderr]: ${stderrBuffer || 'No stderr output'}\n`);
    }
  });

  return proc;
};

export { fetchVideoInfo, downloadVideo, getAudioStream };
