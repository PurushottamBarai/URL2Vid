/**
 * LinkedIn video extractor.
 * LinkedIn is heavily login-walled, but public posts occasionally expose
 * og:video tags in the server-rendered HTML when fetched with a crawler UA.
 * We try multiple strategies:
 *   1. Googlebot UA (causes LinkedIn to serve Lite HTML with og: tags)
 *   2. LinkedInBot UA (LinkedIn sometimes serves richer data to its own crawler)
 *   3. yt-dlp fallback (in case yt-dlp binary update made it work)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

const CRAWLER_HEADERS = [
  {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  },
  {
    'User-Agent': 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
  {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
];

const tryFetchHtml = async (url) => {
  for (const headers of CRAWLER_HEADERS) {
    try {
      const res = await fetch(url, { headers, redirect: 'follow' });
      if (res.ok) {
        const html = await res.text();
        if (html.length > 500) return html; // Valid page, not a 0-byte redirect
      }
    } catch {
      continue;
    }
  }
  throw new Error('All LinkedIn fetch attempts failed');
};

const extractVideoUrl = (html) => {
  // Try various patterns LinkedIn uses
  const patterns = [
    /<meta[^>]*property="og:video:secure_url"[^>]*content="([^"]+)"/,
    /<meta[^>]*property="og:video:url"[^>]*content="([^"]+)"/,
    /<meta[^>]*property="og:video"[^>]*content="([^"]+)"/,
    /"playbackUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/,
    /"progressiveUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/,
    /"streamingLocations"[^[]*\[[^\]]*"url"\s*:\s*"([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].replace(/&amp;/g, '&').replace(/\\/g, '');
  }
  return null;
};

export const fetchVideoInfo = async (url) => {
  // lnkd.in short URLs — resolve the redirect first
  let resolvedUrl = url;
  if (url.includes('lnkd.in')) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: CRAWLER_HEADERS[0] });
      resolvedUrl = res.url || url;
    } catch {
      resolvedUrl = url;
    }
  }

  const html = await tryFetchHtml(resolvedUrl);

  const videoUrl = extractVideoUrl(html);

  const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
  const thumbnailMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
  const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'") : 'LinkedIn Video';
  const thumbnail = thumbnailMatch ? thumbnailMatch[1].replace(/&amp;/g, '&') : null;

  if (!videoUrl) {
    throw new Error("Couldn't extract this LinkedIn video. LinkedIn requires login for most videos. Only public posts without login-walls are supported.");
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

      const filePath = path.join(tmpDir, `linkedin_${crypto.randomUUID()}.mp4`);
      const fileStream = fs.createWriteStream(filePath);

      https.get(rawMp4Url, { headers: CRAWLER_HEADERS[0] }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          https.get(res.headers.location, { headers: CRAWLER_HEADERS[0] }, (res2) => {
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
