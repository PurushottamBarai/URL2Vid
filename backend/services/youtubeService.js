import http from 'http';
import https from 'https';
import { URL } from 'url';
import * as ytdlpService from './ytdlpService.js';

const INVIDIOUS_INSTANCES = [
  'https://invidious.f5.si',
  'https://inv.nadeko.net',
  'https://yt.artemislena.eu',
  'https://invidious.nerdvpn.de',
  'https://invidious.tiekoetter.com',
  'https://yewtu.be',
  'https://invidious.privacydev.net'
];

export const extractYouTubeId = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return null;
  const match = urlString.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
};

const fetchFromInstance = async (baseUrl, videoId) => {
  const res = await fetch(`${baseUrl}/api/v1/videos/${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Instance ${baseUrl} returned status ${res.status}`);
  }

  const data = await res.json();
  if (!data || !data.title) {
    throw new Error(`Invalid response from ${baseUrl}`);
  }

  return data;
};

export const fetchVideoInfo = async (url) => {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return ytdlpService.fetchVideoInfo(url);
  }

  try {
    const promises = INVIDIOUS_INSTANCES.map((base) => fetchFromInstance(base, videoId));
    const data = await Promise.any(promises);

    const formatStreams = Array.isArray(data.formatStreams) ? data.formatStreams : [];

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

    if (formats.length === 0 && formatStreams.length > 0) {
      formats.push({
        format_id: '18',
        ext: 'mp4',
        resolution: '640x360',
        vcodec: 'h264',
        acodec: 'mp4a.40.2',
        url: formatStreams[0].url,
      });
    }

    return {
      title: data.title,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: data.lengthSeconds,
      formats,
    };
  } catch (err) {
    process.stdout.write(`[youtubeService] Multi-instance pool failed, falling back to yt-dlp: ${err.message}\n`);
    return ytdlpService.fetchVideoInfo(url);
  }
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
    const streamUrl = info.formats?.[0]?.url;

    if (streamUrl) {
      return await getStreamWithRedirects(streamUrl);
    }
  } catch (err) {
    process.stdout.write(`[youtubeService] Invidious stream failed, falling back to yt-dlp: ${err.message}\n`);
  }

  return ytdlpService.downloadVideo(url, formatId, type);
};
