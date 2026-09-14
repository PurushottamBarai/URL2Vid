import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

const DUMMY_FORMAT = {
  format_id: 'best',
  ext: 'mp4',
  acodec: 'mp4a.40.2',
  vcodec: 'avc1.4d401e',
  resolution: '720p',
};

const fetchPageHtml = async (url) => {
  const response = await fetch(url, { headers: REQUEST_HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch Snapchat page: ${response.statusText}`);
  }
  return response.text();
};

export const fetchVideoInfo = async (url) => {
  const html = await fetchPageHtml(url);

  const videoUrlMatch = html.match(/<meta[^>]*property="og:video(:secure_url)?"[^>]*content="([^"]+)"/);
  const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
  const thumbnailMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);

  if (!videoUrlMatch) {
    throw new Error("Couldn't extract this Snapchat video — the platform may have changed its page structure.");
  }

  const videoUrl = videoUrlMatch[2].replace(/&amp;/g, '&');
  const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'") : 'Snapchat Spotlight Video';
  const thumbnail = thumbnailMatch ? thumbnailMatch[1].replace(/&amp;/g, '&') : null;

  return {
    title,
    thumbnail,
    duration: null,
    formats: [{ ...DUMMY_FORMAT, url: videoUrl }],
  };
};

export const downloadVideo = async (url, _type) => {
  const info = await fetchVideoInfo(url);
  const rawMp4Url = info.formats[0].url;

  const tmpDir = path.resolve('tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const filePath = path.join(tmpDir, `snapchat_${crypto.randomUUID()}.mp4`);
  const fileStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    https.get(rawMp4Url, { headers: REQUEST_HEADERS }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, { headers: REQUEST_HEADERS }, (res2) => {
          res2.pipe(fileStream);
          fileStream.on('finish', () => resolve(filePath));
          fileStream.on('error', reject);
        }).on('error', reject);
      } else {
        response.pipe(fileStream);
        fileStream.on('finish', () => resolve(filePath));
        fileStream.on('error', reject);
      }
    }).on('error', reject);
  });
};
