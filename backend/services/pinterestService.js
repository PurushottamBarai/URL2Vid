/**
 * Pinterest video extractor using OpenGraph metadata scraping.
 * Pinterest serves og:video in server-rendered HTML for public pins.
 * yt-dlp's Pinterest extractor frequently breaks due to site changes,
 * so we scrape the raw MP4 URL directly from the HTML head.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import crypto from 'crypto';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
};

const fetchWithRedirects = async (url, maxRedirects = 5) => {
  let currentUrl = url;
  for (let i = 0; i < maxRedirects; i++) {
    const res = await fetch(currentUrl, {
      headers: HEADERS,
      redirect: 'follow',
    });
    if (res.ok) return res;
    if (res.status >= 300 && res.status < 400) {
      currentUrl = res.headers.get('location') || currentUrl;
    } else {
      throw new Error(`HTTP ${res.status} from Pinterest`);
    }
  }
  throw new Error('Too many redirects from Pinterest');
};

export const fetchVideoInfo = async (url) => {
  // Pinterest short URLs (pin.it) need to be resolved first
  const resolvedUrl = url.includes('pin.it')
    ? await fetch(url, { method: 'HEAD', redirect: 'follow', headers: HEADERS }).then(r => r.url).catch(() => url)
    : url;

  const response = await fetchWithRedirects(resolvedUrl);
  const html = await response.text();

  // Pinterest embeds video URL in og:video or og:video:url
  const videoUrlMatch =
    html.match(/<meta[^>]*property="og:video:secure_url"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*property="og:video:url"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*property="og:video"[^>]*content="([^"]+)"/);

  const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
  const thumbnailMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);

  if (!videoUrlMatch) {
    throw new Error("Couldn't extract this Pinterest video. The pin may not contain a video, or Pinterest has changed its page structure.");
  }

  const videoUrl = videoUrlMatch[1].replace(/&amp;/g, '&');
  const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'") : 'Pinterest Video';
  const thumbnail = thumbnailMatch ? thumbnailMatch[1].replace(/&amp;/g, '&') : null;

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

      const filePath = path.join(tmpDir, `pinterest_${crypto.randomUUID()}.mp4`);
      const fileStream = fs.createWriteStream(filePath);

      const get = rawMp4Url.startsWith('https') ? https.get : http.get;
      get(rawMp4Url, { headers: HEADERS }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectGet = res.headers.location.startsWith('https') ? https.get : http.get;
          redirectGet(res.headers.location, { headers: HEADERS }, (res2) => {
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
