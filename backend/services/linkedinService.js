import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

const DUMMY_FORMAT = {
  format_id: 'best',
  ext: 'mp4',
  acodec: 'mp4a.40.2',
  vcodec: 'avc1',
  resolution: 'best',
};

const CRAWLER_USER_AGENTS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
];

const makeHeaders = (ua) => ({
  'User-Agent': ua,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
});

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
  const patterns = [
    /"streamingLocations"\s*:\s*\[([^\]]+)\]/,
    null,
  ];

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

      return {
        title: titleMatch ? titleMatch[1].replace(/&amp;/g, '&') : 'LinkedIn Video',
        thumbnail: thumbnailMatch ? thumbnailMatch[1].replace(/&amp;/g, '&') : null,
        duration: null,
        formats: [{ ...DUMMY_FORMAT, url: videoUrl }],
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

  const tmpDir = path.resolve('tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, `linkedin_${crypto.randomUUID()}.mp4`);
  const fileStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    https.get(rawMp4Url, { headers: makeHeaders(CRAWLER_USER_AGENTS[0]) }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, { headers: makeHeaders(CRAWLER_USER_AGENTS[0]) }, (res2) => {
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
