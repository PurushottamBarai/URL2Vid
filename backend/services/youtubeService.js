import http from 'http';
import https from 'https';
import { URL } from 'url';
import { videoInfoCache } from '../utils/cache.js';

// --- Tier 3: Invidious Pool Configuration ---
const FALLBACK_INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yt.chocolatemoo53.com',
  'https://invidious.tiekoetter.com',
  'https://invidious.f5.si',
  'https://inv.zzls.xyz',
  'https://invidious.perennialte.ch',
  'https://invidious.jing.rocks'
];

let dynamicInvidiousPool = [...FALLBACK_INVIDIOUS_INSTANCES];
let lastPoolRefreshTime = 0;

const refreshInvidiousPool = async () => {
  const now = Date.now();
  if (now - lastPoolRefreshTime < 30 * 60 * 1000 && dynamicInvidiousPool.length > 0) {
    return;
  }
  try {
    const res = await fetch('https://api.invidious.io/instances.json', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      const online = data
        .filter(([, info]) => info.type === 'https' && info.uri && info.monitor && !info.monitor.down)
        .map(([, info]) => info.uri.replace(/\/$/, ''));
      if (online.length > 0) {
        dynamicInvidiousPool = [...new Set([...online, ...FALLBACK_INVIDIOUS_INSTANCES])];
        lastPoolRefreshTime = now;
      }
    }
  } catch {}
};

refreshInvidiousPool().catch(() => {});

export const extractYouTubeId = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return null;
  const match = urlString.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{10,15})/i
  );
  if (match && match[1]) {
    return match[1].split('?')[0].split('&')[0];
  }
  return null;
};

// --- Tier 1: Y2Mate Direct Tunnel Streaming Engine (cnv.cx API) ---
export const fetchY2MateStream = async (videoId, quality = '720', format = 'mp4') => {
  try {
    const keyRes = await fetch(`https://cnv.cx/v2/sanity/key?id=${videoId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Referer': 'https://frame.y2meta-uk.com/',
        'Origin': 'https://frame.y2meta-uk.com',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!keyRes.ok) return null;
    const { key } = await keyRes.json();
    if (!key) return null;

    const params = new URLSearchParams({
      link: `https://youtu.be/${videoId}`,
      format: format === 'audio' || format === 'mp3' ? 'mp3' : 'mp4',
      audioBitrate: '128',
      videoQuality: quality || '720',
      filenameStyle: 'pretty',
      vCodec: 'h264',
    });

    const convRes = await fetch('https://cnv.cx/v2/converter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'key': key,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Referer': 'https://frame.y2meta-uk.com/',
        'Origin': 'https://frame.y2meta-uk.com',
        'accept': '*/*',
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });

    if (!convRes.ok) return null;
    const data = await convRes.json();
    if (data && data.url) {
      return data.url;
    }
  } catch (err) {
    process.stderr.write(`[youtubeService] Tier 1 Y2Mate engine error: ${err.message}\n`);
  }
  return null;
};

// --- Tier 3 Invidious Fetcher ---
const fetchFromInstance = async (baseUrl, videoId, maxRetries = 1) => {
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/api/v1/videos/${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(2500),
      });

      if (!res.ok) {
        throw new Error(`Instance ${baseUrl} returned status ${res.status}`);
      }

      const text = await res.text();
      if (!text || text.trim().length === 0) {
        throw new Error(`Empty response from ${baseUrl}`);
      }

      const data = JSON.parse(text);
      if (!data || !data.title) {
        throw new Error(`Invalid response structure from ${baseUrl}`);
      }

      return data;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

const getStreamWithRedirects = (streamUrl, maxRedirects = 5) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(streamUrl);
    const client = parsed.protocol === 'http:' ? http : https;

    const req = client.get(
      streamUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Connection': 'keep-alive',
        },
        timeout: 30000,
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          maxRedirects > 0
        ) {
          resolve(getStreamWithRedirects(res.headers.location, maxRedirects - 1));
        } else if (res.statusCode >= 400) {
          reject(new Error(`Stream HTTP Error ${res.statusCode}`));
        } else {
          resolve(res);
        }
      }
    );

    req.on('error', reject);
    req.on('timeout', () =>
      req.destroy(new Error('Connection timed out while downloading video stream.'))
    );
  });
};

export const fetchVideoInfo = async (url) => {
  const cached = videoInfoCache.get(url);
  if (cached && cached.duration) {
    return cached;
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL.');
  }

  // Tier 1: YouTube oEmbed + YouTubei Internal Player API
  try {
    let title = null;
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    let duration = null;

    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        {
          signal: AbortSignal.timeout(3500),
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        }
      );
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.title) title = oembedData.title;
        if (oembedData.thumbnail_url) thumbnail = oembedData.thumbnail_url;
      }
    } catch {}

    try {
      const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          context: { client: { clientName: 'WEB', clientVersion: '2.20240722.01.00', hl: 'en', gl: 'US' } }
        }),
        signal: AbortSignal.timeout(3000)
      });
      if (playerRes.ok) {
        const playerData = await playerRes.json();
        if (playerData.videoDetails?.lengthSeconds) {
          duration = parseInt(playerData.videoDetails.lengthSeconds, 10);
        }
        if (!title && playerData.videoDetails?.title) {
          title = playerData.videoDetails.title;
        }
      }
    } catch {}

    if (title) {
      const result = {
        title,
        thumbnail,
        duration,
        videoId,
        embedDownloadUrl: `https://v2.y2jar.cc/?id=${videoId}&appearance=dark`,
        y2mateUrl: `https://v38.www-y2mate.com/`,
        isEmbedFallback: true,
        formats: [
          {
            format_id: '137',
            ext: 'mp4',
            resolution: '1920x1080',
            vcodec: 'h264',
            acodec: 'mp4a',
            hasVideo: true,
            filesize: null,
          },
          {
            format_id: '22',
            ext: 'mp4',
            resolution: '1280x720',
            vcodec: 'h264',
            acodec: 'mp4a',
            hasVideo: true,
            filesize: null,
          },
          {
            format_id: '18',
            ext: 'mp4',
            resolution: '640x360',
            vcodec: 'h264',
            acodec: 'mp4a',
            hasVideo: true,
            filesize: null,
          },
        ],
      };

      videoInfoCache.set(url, result);
      return result;
    }
  } catch (err) {
    process.stdout.write(`[youtubeService] Tier 1 oEmbed/YouTubei failed: ${err.message}\n`);
  }

  // Tier 2: Invidious Dynamic Instance Pool
  try {
    await refreshInvidiousPool();
    const candidatePool = dynamicInvidiousPool.slice(0, 6);
    const promises = candidatePool.map((base) => fetchFromInstance(base, videoId));
    const data = await Promise.any(promises);

    const formatStreams = Array.isArray(data.formatStreams) ? data.formatStreams : [];

    const formats = formatStreams.map((s) => ({
      format_id: String(s.itag || '18'),
      ext: s.container || 'mp4',
      resolution: s.size || s.resolution || s.qualityLabel || '640x360',
      vcodec: s.encoding || 'h264',
      acodec: 'mp4a.40.2',
      url: s.url,
      filesize: s.clen ? parseInt(s.clen, 10) : null,
    }));

    const result = {
      title: data.title || 'YouTube Video',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: data.lengthSeconds,
      formats,
      embedDownloadUrl: `https://v2.y2jar.cc/?id=${videoId}&appearance=dark`,
      y2mateUrl: `https://v38.www-y2mate.com/`,
      isEmbedFallback: false,
    };

    videoInfoCache.set(url, result);
    return result;
  } catch (tier2Err) {
    const errorDetails = Array.isArray(tier2Err?.errors)
      ? tier2Err.errors.map((e) => e?.message || String(e)).join('; ')
      : tier2Err.message;
    process.stdout.write(`[youtubeService] Tier 2 Invidious pool failed: ${tier2Err.message} (reasons: ${errorDetails})\n`);
  }

  // Tier 3: Final Fallback / Error Handling
  throw new Error('We are unable to fulfill the request for YouTube right now. Please retry after some time, or try our other supported platforms.');
};

const resolveQualityFromFormat = (fmt) => {
  if (!fmt) return null;
  const h = fmt.height || (fmt.resolution?.match(/(\d+)x(\d+)/)?.[2]) || (fmt.resolution?.match(/(\d+)p/)?.[1]);
  const numH = parseInt(h, 10);
  if (numH >= 1080) return '1080';
  if (numH >= 720) return '720';
  if (numH >= 480) return '480';
  if (numH >= 360) return '360';
  if (numH >= 240) return '240';
  if (numH >= 144) return '144';
  return null;
};

const mapFormatIdToQuality = (formatId, cachedFormats = []) => {
  if (!formatId || formatId === 'best') {
    const topVideo = (cachedFormats || []).find((f) => f.vcodec !== 'none' || f.hasVideo);
    if (topVideo) {
      const q = resolveQualityFromFormat(topVideo);
      if (q) return q;
    }
    return '1080';
  }

  const itagMap = {
    '137': '1080', '248': '1080', '399': '1080',
    '22': '720', '136': '720', '247': '720', '398': '720',
    '135': '480', '244': '480', '397': '480',
    '18': '360', '134': '360', '243': '360', '396': '360',
    '133': '240', '242': '240',
    '160': '144',
  };
  if (itagMap[String(formatId)]) {
    return itagMap[String(formatId)];
  }

  const matched = (cachedFormats || []).find(
    (f) => String(f.format_id || f.formatId) === String(formatId)
  );
  if (matched) {
    const q = resolveQualityFromFormat(matched);
    if (q) return q;
  }

  const str = String(formatId);
  if (str.includes('1080')) return '1080';
  if (str.includes('720')) return '720';
  if (str.includes('480')) return '480';
  if (str.includes('360')) return '360';
  if (str.includes('240')) return '240';
  if (str.includes('144')) return '144';

  return '720';
};

export const downloadVideo = async (url, formatId, type) => {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL.');
  }

  const cached = videoInfoCache.get(url);
  const targetQuality = mapFormatIdToQuality(formatId, cached?.formats);

  // 1. Tier 1: Y2Mate / cnv.cx Direct Tunnel Streaming Engine
  try {
    process.stdout.write(`[youtubeService] Tier 1: Requesting Y2Mate stream for ${videoId} with quality ${targetQuality} (formatId: ${formatId || 'best'})\n`);
    let y2mateStreamUrl = await fetchY2MateStream(videoId, targetQuality, type);

    if (!y2mateStreamUrl && targetQuality !== '720') {
      process.stdout.write(`[youtubeService] Quality ${targetQuality} unavailable on Y2Mate for ${videoId}, falling back to 720\n`);
      y2mateStreamUrl = await fetchY2MateStream(videoId, '720', type);
    }

    if (y2mateStreamUrl) {
      return new Promise((resolve, reject) => {
        const parsed = new URL(y2mateStreamUrl);
        const client = parsed.protocol === 'http:' ? http : https;
        const req = client.get(
          y2mateStreamUrl,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
              'Referer': 'https://frame.y2meta-uk.com/',
              'Accept': '*/*',
            },
            timeout: 30000,
          },
          (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const contentLength = res.headers['content-length'];
              process.stdout.write(`[youtubeService] Y2Mate stream connected (quality: ${targetQuality}, size: ${contentLength ? `${Math.round(contentLength / 1048576)} MB` : 'unknown'})\n`);
              resolve(res);
            } else {
              reject(new Error(`Y2Mate stream failed with status ${res.statusCode}`));
            }
          }
        );
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('Y2Mate stream connection timeout')));
      });
    }
  } catch (err) {
    process.stdout.write(`[youtubeService] Tier 1 Y2Mate stream failed: ${err.message}\n`);
  }

  // 2. Tier 3: Invidious stream fallback
  try {
    const info = await fetchVideoInfo(url);
    const videoFormats = Array.isArray(info.formats)
      ? info.formats.filter((f) => f.vcodec !== 'none' && f.format_note !== 'storyboard' && !f.format_id?.startsWith('sb'))
      : [];

    let matchedFormat = null;
    if (formatId && formatId !== 'best') {
      matchedFormat = videoFormats.find((f) => String(f.format_id) === String(formatId) || String(f.formatId) === String(formatId));
      if (!matchedFormat && targetQuality) {
        matchedFormat = videoFormats.find((f) => (f.resolution || '').includes(targetQuality));
      }
    }

    const streamUrl = matchedFormat?.url || videoFormats[0]?.url || info.formats?.[0]?.url;
    if (streamUrl && !streamUrl.includes('/storyboard')) {
      process.stdout.write(`[youtubeService] Tier 3 Invidious streaming format ${matchedFormat?.format_id || videoFormats[0]?.format_id || 'first-available'}\n`);
      return await getStreamWithRedirects(streamUrl);
    }
  } catch (err) {
    process.stdout.write(`[youtubeService] Tier 3 Invidious stream failed: ${err.message}\n`);
  }

  // If all failed, throw friendly error
  throw new Error('We are unable to fulfill the request for YouTube right now. Please retry after some time, or try our other supported platforms.');
};
