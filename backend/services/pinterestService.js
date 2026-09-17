import https from 'https';
import http from 'http';
import { REQUEST_HEADERS, DUMMY_FORMAT, fetchContentLength } from '../utils/constants.js';
import { videoInfoCache } from '../utils/cache.js';

const normalizePinterestUrl = (url) => {
  const ideasMatch = url.match(/pinterest\.com\/ideas\/[^/]+\/(\d{10,})\/?/);
  if (ideasMatch) {
    return `https://www.pinterest.com/pin/${ideasMatch[1]}/`;
  }
  return url;
};

export const fetchVideoInfo = async (url) => {
  const cached = videoInfoCache.get(url);
  if (cached) {
    return cached;
  }
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
  const thumbnailMatch = 
    html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*name="og:image"[^>]*content="([^"]+)"/) ||
    html.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/) ||
    html.match(/"image"\s*:\s*"([^"]+)"/);

  if (!videoUrlMatch) {
    throw new Error(
      "Couldn't extract this Pinterest video. This pin may be an image pin (not a video), " +
      "or a board/category page. Try using a direct video pin URL like pinterest.com/pin/ID/"
    );
  }

  const videoUrl = videoUrlMatch[1].replace(/&amp;/g, '&');
  const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'") : 'Pinterest Video';
  const thumbnail = thumbnailMatch ? thumbnailMatch[1].replace(/&amp;/g, '&') : null;

  const durMatch = html.match(/"duration"\s*:\s*(\d+)/i);
  const duration = durMatch ? Math.round(parseInt(durMatch[1], 10) / 1000) : null;
  const filesize = await fetchContentLength(videoUrl, REQUEST_HEADERS);

  const result = {
    title,
    thumbnail,
    duration,
    formats: [{ ...DUMMY_FORMAT, url: videoUrl, filesize }],
  };

  videoInfoCache.set(url, result);
  return result;
};

export const downloadVideo = async (url) => {
  const info = await fetchVideoInfo(url);
  const rawMp4Url = info.formats[0].url;

  return new Promise((resolve, reject) => {
    const get = rawMp4Url.startsWith('https') ? https.get : http.get;
    const req = get(rawMp4Url, { headers: REQUEST_HEADERS, timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectGet = res.headers.location.startsWith('https') ? https.get : http.get;
        const req2 = redirectGet(res.headers.location, { headers: REQUEST_HEADERS, timeout: 30000 }, (res2) => {
          resolve(res2);
        }).on('error', reject).on('timeout', () => req2.destroy(new Error('Timeout')));
      } else {
        resolve(res);
      }
    }).on('error', reject).on('timeout', () => req.destroy(new Error('Timeout')));
  });
};
