/**
 * Threads (threads.com / threads.net) video extractor.
 * Meta does not expose og:video in standard HTML for Threads posts.
 * However, using a Googlebot User-Agent causes Meta's servers to
 * return a server-rendered HTML page containing the media JSON payload.
 * This service parses that JSON to extract the MP4 URL.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

// Googlebot UA causes Meta to serve fully-rendered HTML with embedded media data
const GOOGLEBOT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Fallback: regular browser UA for og: tags
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const extractFromHtml = (html) => {
  // Strategy 1: Look for video_url in embedded JSON (Googlebot path)
  const jsonMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
  if (jsonMatch) {
    return jsonMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
  }

  // Strategy 2: og:video meta tag (browser path)
  const ogVideoMatch =
    html.match(/<meta[^>]*property="og:video:secure_url"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*property="og:video:url"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*property="og:video"[^>]*content="([^"]+)"/);
  if (ogVideoMatch) {
    return ogVideoMatch[1].replace(/&amp;/g, '&');
  }

  return null;
};

export const fetchVideoInfo = async (url) => {
  // Normalize URL: threads.com and threads.net both work
  const normalizedUrl = url.replace('threads.net', 'threads.com');

  // Try Googlebot UA first (gets server-rendered JSON)
  let html = '';
  try {
    const res = await fetch(normalizedUrl, { headers: GOOGLEBOT_HEADERS, redirect: 'follow' });
    html = await res.text();
  } catch {
    // Fallback to browser UA
    const res = await fetch(normalizedUrl, { headers: BROWSER_HEADERS, redirect: 'follow' });
    html = await res.text();
  }

  const videoUrl = extractFromHtml(html);

  // Title
  const titleMatch =
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/) ||
    html.match(/"text"\s*:\s*"([^"]{5,150})"/);
  const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'") : 'Threads Video';

  // Thumbnail
  const thumbnailMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
  const thumbnail = thumbnailMatch ? thumbnailMatch[1].replace(/&amp;/g, '&') : null;

  if (!videoUrl) {
    throw new Error("Couldn't extract this Threads video. The post may not contain a video, or it may be private.");
  }

  return {
    title,
    thumbnail,
    duration: null,
    formats: [
      {
        format_id: 'best',
        ext: 'mp4',
        url: videoUrl,
        acodec: 'mp4a.40.2',
        vcodec: 'avc1',
        resolution: 'best',
      },
    ],
  };
};

export const downloadVideo = (url) => {
  return new Promise(async (resolve, reject) => {
    try {
      const info = await fetchVideoInfo(url);
      const rawMp4Url = info.formats[0].url;

      const tmpDir = path.resolve('tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const filePath = path.join(tmpDir, `threads_${crypto.randomUUID()}.mp4`);
      const fileStream = fs.createWriteStream(filePath);

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
    } catch (err) {
      reject(err);
    }
  });
};
