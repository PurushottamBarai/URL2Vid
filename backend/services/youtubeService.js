import http from 'http';
import https from 'https';
import { URL } from 'url';
import * as ytdlpService from './ytdlpService.js';
import { videoInfoCache } from '../utils/cache.js';

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
      signal: AbortSignal.timeout(6000),
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
        process.stdout.write(`[youtubeService] Refreshed Invidious pool with ${online.length} live instances\n`);
      }
    }
  } catch {}
};

// Initial background pool refresh
refreshInvidiousPool().catch(() => {});

export const extractYouTubeId = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return null;
  const match = urlString.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
};

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

const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.ducks.party',
  'https://pipedapi.reallyaweso.me',
  'https://pipedapi.kavin.rocks'
];

const fetchFromCloudflareRelay = async (videoId) => {
  const relayUrl = process.env.CF_YOUTUBE_RELAY_URL || process.env.CLOUDFLARE_WORKER_URL;
  if (!relayUrl) return null;

  try {
    const url = new URL(relayUrl);
    url.searchParams.set('id', videoId);
    url.searchParams.set('url', `https://www.youtube.com/watch?v=${videoId}`);
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'URL2Vid-Server' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.title && Array.isArray(data.formats) && data.formats.length > 0) {
      process.stdout.write(`[youtubeService] Cloudflare Worker Relay resolved video ${videoId}\n`);
      return data;
    }
  } catch (err) {
    process.stderr.write(`[youtubeService] Cloudflare Worker Relay error: ${err.message}\n`);
  }
  return null;
};

const fetchFromPiped = async (videoId) => {
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/streams/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data || !data.title) continue;

      const mp4Streams = (data.videoStreams || [])
        .filter((s) => s.format === 'MP4' && s.url)
        .map((s) => ({
          format_id: String(s.itag || 'best'),
          ext: 'mp4',
          resolution: s.quality || '720p',
          vcodec: s.codec || 'h264',
          acodec: s.videoOnly ? 'none' : 'mp4a',
          url: s.url,
          filesize: s.contentLength > 0 ? s.contentLength : null,
        }));

      if (mp4Streams.length === 0) continue;

      const audioUrl = (data.audioStreams || []).find((s) => s.url)?.url || null;

      return {
        title: data.title,
        thumbnail: data.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: data.duration,
        formats: mp4Streams,
        audioUrl,
      };
    } catch {}
  }
  throw new Error('All Piped alternative relay instances failed');
};

export const fetchVideoInfo = async (url) => {
  const cached = videoInfoCache.get(url);
  if (cached) {
    return cached;
  }

  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return ytdlpService.fetchVideoInfo(url);
  }

  // Tier 0: Optional Cloudflare Edge Relay (if configured)
  const cfResult = await fetchFromCloudflareRelay(videoId);
  if (cfResult) {
    videoInfoCache.set(url, cfResult);
    return cfResult;
  }

  // Tier 1: Dynamic Invidious Multi-Instance Pool
  try {
    await refreshInvidiousPool();
    const candidatePool = dynamicInvidiousPool.slice(0, 6);
    const promises = candidatePool.map((base) => fetchFromInstance(base, videoId));
    const data = await Promise.any(promises);

    const formatStreams = Array.isArray(data.formatStreams) ? data.formatStreams : [];
    const adaptiveFormats = Array.isArray(data.adaptiveFormats) ? data.adaptiveFormats : [];

    // Map muxed streams (itag 18, 22, etc.)
    const formats = formatStreams.map((s) => ({
      format_id: String(s.itag || '18'),
      ext: s.container || 'mp4',
      resolution: s.size || s.resolution || s.qualityLabel || '640x360',
      vcodec: s.encoding || 'h264',
      acodec: 'mp4a.40.2',
      url: s.url,
      filesize: s.clen
        ? parseInt(s.clen, 10)
        : s.bitrate && data.lengthSeconds
          ? Math.round((parseInt(s.bitrate, 10) * data.lengthSeconds) / 8)
          : null,
    }));

    // For YouTube Shorts, formatStreams is usually empty. Extract MP4 video streams from adaptiveFormats
    if (formats.length === 0 && adaptiveFormats.length > 0) {
      const mp4Videos = adaptiveFormats
        .filter((f) => (f.type || '').startsWith('video/mp4') || f.container === 'mp4')
        .sort((a, b) => (parseInt(b.bitrate, 10) || 0) - (parseInt(a.bitrate, 10) || 0));

      for (const v of mp4Videos) {
        formats.push({
          format_id: String(v.itag),
          ext: 'mp4',
          resolution: v.qualityLabel || v.resolution || '720p',
          vcodec: v.encoding || 'h264',
          acodec: 'none',
          url: v.url,
          filesize: v.clen
            ? parseInt(v.clen, 10)
            : v.bitrate && data.lengthSeconds
              ? Math.round((parseInt(v.bitrate, 10) * data.lengthSeconds) / 8)
              : null,
        });
      }
    }

    // Audio stream (itag 140 or AAC/M4A)
    const audioStream = adaptiveFormats.find(
      (f) => String(f.itag) === '140' || (f.type || '').startsWith('audio/mp4') || f.container === 'm4a'
    );

    const result = {
      title: data.title,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: data.lengthSeconds,
      formats,
      adaptiveFormats,
      audioUrl: audioStream?.url || null,
    };

    videoInfoCache.set(url, result);
    return result;
  } catch (err) {
    process.stdout.write(`[youtubeService] Tier 1 Invidious pool failed: ${err.message}\n`);
  }

  // Tier 2: Piped Alternative Relay Pool
  try {
    const pipedResult = await fetchFromPiped(videoId);
    videoInfoCache.set(url, pipedResult);
    process.stdout.write(`[youtubeService] Tier 2 Piped relay succeeded for ${videoId}\n`);
    return pipedResult;
  } catch (err) {
    process.stdout.write(`[youtubeService] Tier 2 Piped relay failed, falling back to Tier 3 yt-dlp: ${err.message}\n`);
  }

  // Tier 3: yt-dlp with unblocked Android client
  return ytdlpService.fetchVideoInfo(url);
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

export const downloadVideo = async (url, formatId, type) => {
  try {
    const info = await fetchVideoInfo(url);
    let streamUrl = null;

    const videoFormats = Array.isArray(info.formats)
      ? info.formats.filter((f) => f.vcodec !== 'none' && f.format_note !== 'storyboard' && !f.format_id?.startsWith('sb'))
      : [];

    if (type === 'audio') {
      streamUrl =
        info.audioUrl ||
        info.formats?.find((f) => f.acodec !== 'none')?.url ||
        info.formats?.[0]?.url;
    } else {
      const matchedFormat = formatId
        ? info.formats?.find((f) => f.format_id === String(formatId))
        : null;
      streamUrl = matchedFormat?.url || videoFormats[0]?.url || info.formats?.[0]?.url;
    }

    if (streamUrl && !streamUrl.includes('/storyboard')) {
      return await getStreamWithRedirects(streamUrl);
    }
  } catch (err) {
    process.stdout.write(`[youtubeService] Invidious stream failed, falling back to yt-dlp: ${err.message}\n`);
  }

  return ytdlpService.downloadVideo(url, formatId, type);
};
