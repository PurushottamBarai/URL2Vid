export const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

export const GOOGLEBOT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

export const LINKEDIN_CRAWLER_AGENTS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
];

export const makeHeaders = (ua) => ({
  'User-Agent': ua,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
});

export const DUMMY_FORMAT = {
  format_id: 'best',
  ext: 'mp4',
  acodec: 'mp4a.40.2',
  vcodec: 'avc1.4d401e',
  resolution: 'best',
};

export const fetchContentLength = async (url, headers = {}) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers,
      signal: AbortSignal.timeout(3000),
    });
    const len = res.headers.get('content-length');
    if (len) {
      const parsed = parseInt(len, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  return null;
};

