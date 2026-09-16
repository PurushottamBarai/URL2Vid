import https from 'https';
import { REQUEST_HEADERS, DUMMY_FORMAT } from '../utils/constants.js';

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
    throw new Error("Couldn't extract this Snapchat video - the platform may have changed its page structure.");
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

export const downloadVideo = async (url) => {
  const info = await fetchVideoInfo(url);
  const rawMp4Url = info.formats[0].url;

  return new Promise((resolve, reject) => {
    const req = https.get(rawMp4Url, { headers: REQUEST_HEADERS, timeout: 30000 }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const req2 = https.get(response.headers.location, { headers: REQUEST_HEADERS, timeout: 30000 }, (res2) => {
          resolve(res2);
        }).on('error', reject).on('timeout', () => req2.destroy(new Error('Timeout')));
      } else {
        resolve(response);
      }
    }).on('error', reject).on('timeout', () => req.destroy(new Error('Timeout')));
  });
};
