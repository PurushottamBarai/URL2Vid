import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

const GOOGLEBOT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const DUMMY_FORMAT = {
  format_id: 'best',
  ext: 'mp4',
  acodec: 'mp4a.40.2',
  vcodec: 'avc1',
  resolution: 'best',
};

const normalizeThreadsUrl = (url) => {
  return url
    .replace('threads.net', 'threads.com')
    .replace(/\/media\/?$/, '');
};

const extractFromScriptTags = (html) => {
  const scriptMatches = [...html.matchAll(/<script[^>]*type="application\/json"[^>]*data-sjs[^>]*>([\s\S]*?)<\/script>/g)];

  for (const match of scriptMatches) {
    try {
      const jsonStr = JSON.stringify(JSON.parse(match[1]));
      const videoVersionsMatch = jsonStr.match(/"video_versions"\s*:\s*\[([^\]]+)\]/);
      if (videoVersionsMatch) {
        const firstUrl = videoVersionsMatch[1].match(/"url"\s*:\s*"([^"]+)"/);
        if (firstUrl) return firstUrl[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
      }
      const mp4Match = jsonStr.match(/"(https:[^"]+\.mp4[^"]*)"/);
      if (mp4Match) return mp4Match[1].replace(/\\u0026/g, '&');
    } catch {
      continue;
    }
  }
  return null;
};

const extractVideoFromHtml = (html) => {
  const fromScripts = extractFromScriptTags(html);
  if (fromScripts) return fromScripts;

  const jsonVideoUrl = html.match(/"video_url"\s*:\s*"([^"]+)"/);
  if (jsonVideoUrl) return jsonVideoUrl[1].replace(/\\u0026/g, '&').replace(/\\/g, '');

  const ogVideo =
    html.match(/<meta[^>]*property="og:video:secure_url"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*property="og:video:url"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*property="og:video"[^>]*content="([^"]+)"/);
  if (ogVideo) return ogVideo[1].replace(/&amp;/g, '&');

  return null;
};

const extractTitleFromHtml = (html) => {
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
  if (ogTitle) return ogTitle[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'");

  const postText = html.match(/"text"\s*:\s*"([^"]{5,200})"/);
  if (postText) return postText[1].replace(/\\n/g, ' ').replace(/\\"/g, '"');

  return 'Threads Video';
};

export const fetchVideoInfo = async (url) => {
  const normalizedUrl = normalizeThreadsUrl(url);
  let html = '';

  try {
    const res = await fetch(normalizedUrl, {
      headers: GOOGLEBOT_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    html = await res.text();
  } catch {
    const res = await fetch(normalizedUrl, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    html = await res.text();
  }

  const videoUrl = extractVideoFromHtml(html);
  const title = extractTitleFromHtml(html);
  const thumbnailMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
  const thumbnail = thumbnailMatch ? thumbnailMatch[1].replace(/&amp;/g, '&') : null;

  if (!videoUrl) {
    throw new Error(
      "Couldn't extract this Threads video. The post may be private, login-gated, " +
      "or may not contain a video. Only public Threads video posts are supported."
    );
  }

  return {
    title,
    thumbnail,
    duration: null,
    formats: [{ ...DUMMY_FORMAT, url: videoUrl }],
  };
};

export const downloadVideo = async (url) => {
  const info = await fetchVideoInfo(url);
  const rawMp4Url = info.formats[0].url;

  const tmpDir = path.resolve('tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, `threads_${crypto.randomUUID()}.mp4`);
  const fileStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    https.get(rawMp4Url, { headers: BROWSER_HEADERS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, { headers: BROWSER_HEADERS }, (res2) => {
          res2.pipe(fileStream);
          fileStream.on('finish', () => resolve(filePath));
          fileStream.on('error', reject);
        }).on('error', reject);
      } else {
        res.pipe(fileStream);
        fileStream.on('finish', () => resolve(filePath));
        fileStream.on('error', reject);
      }
    }).on('error', reject);
  });
};
