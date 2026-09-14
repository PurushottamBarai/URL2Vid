import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import crypto from 'crypto';

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

const DUMMY_FORMAT = {
  format_id: 'best',
  ext: 'mp4',
  acodec: 'mp4a.40.2',
  vcodec: 'avc1',
  resolution: 'best',
};

const normalizePinterestUrl = (url) => {
  const ideasMatch = url.match(/pinterest\.com\/ideas\/[^/]+\/(\d{10,})\/?/);
  if (ideasMatch) {
    return `https://www.pinterest.com/pin/${ideasMatch[1]}/`;
  }
  return url;
};

export const fetchVideoInfo = async (url) => {
  const fetchUrl = normalizePinterestUrl(url);

  let response;
  try {
    response = await fetch(fetchUrl, {
      headers: REQUEST_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    throw new Error(`Couldn't reach Pinterest: ${err.message}`);
  }

  if (!response.ok) {
    throw new Error(`Pinterest returned HTTP ${response.status}. The pin may be private or removed.`);
  }

  const html = await response.text();

  const videoUrlMatch =
    html.match(/<meta[^>]*property="og:video:secure_url"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*property="og:video:url"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*property="og:video"[^>]*content="([^"]+)"/) ||
    html.match(/"contentUrl"\s*:\s*"([^"]+\.(?:mp4|m3u8)[^"]*)"/) ||
    html.match(/"videoUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/);

  const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
  const thumbnailMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);

  if (!videoUrlMatch) {
    throw new Error(
      "Couldn't extract this Pinterest video. This pin may be an image pin (not a video), " +
      "or a board/category page. Try using a direct video pin URL like pinterest.com/pin/ID/"
    );
  }

  const videoUrl = videoUrlMatch[1].replace(/&amp;/g, '&');
  const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'") : 'Pinterest Video';
  const thumbnail = thumbnailMatch ? thumbnailMatch[1].replace(/&amp;/g, '&') : null;

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

  const filePath = path.join(tmpDir, `pinterest_${crypto.randomUUID()}.mp4`);
  const fileStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    const get = rawMp4Url.startsWith('https') ? https.get : http.get;
    get(rawMp4Url, { headers: REQUEST_HEADERS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectGet = res.headers.location.startsWith('https') ? https.get : http.get;
        redirectGet(res.headers.location, { headers: REQUEST_HEADERS }, (res2) => {
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
