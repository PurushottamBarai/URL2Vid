import https from 'https';
import { DUMMY_FORMAT, LINKEDIN_CRAWLER_AGENTS as CRAWLER_USER_AGENTS, makeHeaders, fetchContentLength } from '../utils/constants.js';

const resolveShortUrl = async (url) => {
  if (!url.includes('lnkd.in')) return url;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: makeHeaders(CRAWLER_USER_AGENTS[0]),
      signal: AbortSignal.timeout(10000),
    });
    return res.url || url;
  } catch {
    return url;
  }
};

const extractVideoUrl = (html) => {
  const streamMatch = html.match(/"streamingLocations"\s*:\s*\[([^\]]+)\]/);
  if (streamMatch) {
    const urlMatch = streamMatch[1].match(/"url"\s*:\s*"([^"]+)"/);
    if (urlMatch) return urlMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
  }

  const progressiveUrl = html.match(/"progressiveUrl"\s*:\s*"([^"]+)"/);
  if (progressiveUrl) return progressiveUrl[1].replace(/\\u0026/g, '&').replace(/\\/g, '');

  const nativeVideoUrl = html.match(/"nativeVideoUrl"\s*:\s*"([^"]+)"/);
  if (nativeVideoUrl) return nativeVideoUrl[1].replace(/\\u0026/g, '&').replace(/\\/g, '');

  const mp4Match = html.match(/"(https:[^"]+\.mp4[^"]*)"/);
  if (mp4Match) return mp4Match[1].replace(/\\u0026/g, '&');

  const ogVideo =
    html.match(/<meta[^>]*property="og:video:secure_url"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*property="og:video:url"[^>]*content="([^"]+)"/) ||
    html.match(/<meta[^>]*property="og:video"[^>]*content="([^"]+)"/);
  if (ogVideo) return ogVideo[1].replace(/&amp;/g, '&');

  return null;
};

export const fetchVideoInfo = async (url) => {
  const resolvedUrl = await resolveShortUrl(url);

  for (const ua of CRAWLER_USER_AGENTS) {
    try {
      const res = await fetch(resolvedUrl, {
        headers: makeHeaders(ua),
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) continue;
      const html = await res.text();

      const videoUrl = extractVideoUrl(html);
      if (!videoUrl) continue;

      const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
      const thumbnailMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);

      const durMatch = html.match(/"duration"\s*:\s*([0-9.]+)/i);
      let duration = null;
      if (durMatch) {
        const val = parseFloat(durMatch[1]);
        duration = val > 100 ? Math.round(val / 1000) : Math.round(val);
      }
      const filesize = await fetchContentLength(videoUrl, makeHeaders(ua));

      return {
        title: titleMatch ? titleMatch[1].replace(/&amp;/g, '&') : 'LinkedIn Video',
        thumbnail: thumbnailMatch ? thumbnailMatch[1].replace(/&amp;/g, '&') : null,
        duration,
        formats: [{ ...DUMMY_FORMAT, url: videoUrl, filesize }],
      };
    } catch {
      continue;
    }
  }

  throw new Error(
    "Couldn't extract this LinkedIn video. LinkedIn's login wall prevents access to most videos without authentication. " +
    "Only fully public posts accessible without a LinkedIn account are supported."
  );
};

export const downloadVideo = async (url) => {
  const info = await fetchVideoInfo(url);
  const rawMp4Url = info.formats[0].url;

  return new Promise((resolve, reject) => {
    const req = https.get(rawMp4Url, { headers: makeHeaders(CRAWLER_USER_AGENTS[0]), timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const req2 = https.get(res.headers.location, { headers: makeHeaders(CRAWLER_USER_AGENTS[0]), timeout: 30000 }, (res2) => {
          resolve(res2);
        }).on('error', reject).on('timeout', () => req2.destroy(new Error('Timeout')));
      } else {
        resolve(res);
      }
    }).on('error', reject).on('timeout', () => req.destroy(new Error('Timeout')));
  });
};
