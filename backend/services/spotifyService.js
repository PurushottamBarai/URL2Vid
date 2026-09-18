import { URL } from 'url';
import https from 'https';
import http from 'http';
import { videoInfoCache } from '../utils/cache.js';
import * as ytdlpService from './ytdlpService.js';
import { fetchY2MateStream } from './youtubeService.js';

const SPOTIFY_REGEX = /(?:open\.spotify\.com\/|spotify:)(track|playlist|album|artist)[:/]([a-zA-Z0-9]+)/i;

export const parseSpotifyUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return null;
  const match = urlString.match(SPOTIFY_REGEX);
  if (match) {
    return {
      type: match[1].toLowerCase(),
      id: match[2],
    };
  }
  return null;
};

export const fetchSpotifyInfo = async (url) => {
  const cached = videoInfoCache.get(url);
  if (cached) {
    return cached;
  }

  // Handle spotify.link short URLs by following redirect
  let resolvedUrl = url;
  if (url.includes('spotify.link/')) {
    try {
      const headRes = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (headRes.url && headRes.url !== url) {
        resolvedUrl = headRes.url;
      }
    } catch {}
  }

  const parsed = parseSpotifyUrl(resolvedUrl);
  if (!parsed) {
    throw new Error('Invalid Spotify URL. Please enter a valid track, playlist, or album link.');
  }

  const { type, id } = parsed;

  // 1. Fetch official oEmbed for high-res thumbnail & fallback title
  let oembed = null;
  try {
    const oembedRes = await fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/${type}/${id}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (oembedRes.ok) {
      oembed = await oembedRes.json();
    }
  } catch {}

  // 2. Fetch Embed HTML to parse Next.js / initial-state metadata
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
  const embedRes = await fetch(embedUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!embedRes.ok) {
    throw new Error(`Failed to retrieve Spotify data (HTTP ${embedRes.status}).`);
  }

  const html = await embedRes.text();

  let entity = null;

  // Strategy A: <script id="__NEXT_DATA__">
  const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]+?)<\/script>/);
  if (nextMatch) {
    try {
      const parsedData = JSON.parse(nextMatch[1]);
      entity = parsedData?.props?.pageProps?.state?.data?.entity;
    } catch {}
  }

  // Strategy B: base64 encoded scripts (resource or initial-state)
  if (!entity) {
    const b64Match = html.match(
      /<script id="(?:initial-state|resource)"[^>]*>([\s\S]+?)<\/script>/
    );
    if (b64Match) {
      try {
        const decoded = Buffer.from(b64Match[1].trim(), 'base64').toString('utf8');
        const b64Json = JSON.parse(decoded);
        entity = b64Json?.data?.entity || b64Json?.entity || b64Json;
      } catch {}
    }
  }

  const thumbnail = oembed?.thumbnail_url || entity?.coverArt?.sources?.[0]?.url || null;

  // Standard audio formats for Spotify
  const audioFormats = [
    {
      format_id: '320k',
      resolution: '320 kbps (High Quality)',
      ext: 'mp3',
      acodec: 'mp3',
      vcodec: 'none',
      hasVideo: false,
      isEstimated: false,
    },
    {
      format_id: '256k',
      resolution: '256 kbps (Medium)',
      ext: 'mp3',
      acodec: 'mp3',
      vcodec: 'none',
      hasVideo: false,
      isEstimated: false,
    },
    {
      format_id: '192k',
      resolution: '192 kbps (Standard)',
      ext: 'mp3',
      acodec: 'mp3',
      vcodec: 'none',
      hasVideo: false,
      isEstimated: false,
    },
    {
      format_id: '128k',
      resolution: '128 kbps (Compact)',
      ext: 'mp3',
      acodec: 'mp3',
      vcodec: 'none',
      hasVideo: false,
      isEstimated: false,
    },
  ];

  // Case 1: Single Track
  if (type === 'track') {
    const rawName = entity?.name || oembed?.title || 'Spotify Track';
    const artistList = Array.isArray(entity?.artists)
      ? entity.artists.map((a) => (typeof a === 'string' ? a : a.name)).filter(Boolean)
      : [];
    const artists = artistList.join(', ');
    const title = artists ? `${rawName} - ${artists}` : rawName;
    const duration = entity?.duration ? Math.round(entity.duration / 1000) : null;

    const result = {
      title,
      thumbnail,
      duration,
      platform: 'spotify',
      spotifyType: 'track',
      trackName: rawName,
      artists,
      formats: audioFormats,
      audioAvailable: true,
      searchQuery: `${artists} - ${rawName} Official Audio`,
    };

    videoInfoCache.set(url, result);
    return result;
  }

  // Case 2: Playlist or Album
  const rawTrackList = entity?.trackList || [];
  const tracks = rawTrackList.map((t, idx) => {
    const tArtists =
      t.subtitle ||
      (Array.isArray(t.artists)
        ? t.artists.map((a) => (typeof a === 'string' ? a : a.name)).filter(Boolean).join(', ')
        : '');
    const tTitle = t.title || t.name || `Track ${idx + 1}`;
    const tId = t.uri ? t.uri.split(':').pop() : (t.id || String(idx));
    return {
      index: idx + 1,
      id: tId,
      title: tTitle,
      artists: tArtists,
      duration: t.duration ? Math.round(t.duration / 1000) : null,
      previewUrl: t.audioPreview?.url || null,
      downloadUrl: `https://open.spotify.com/track/${tId}`,
      searchQuery: `${tArtists} - ${tTitle} Official Audio`,
    };
  });

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const containerTitle = entity?.name || oembed?.title || (type === 'playlist' ? 'Spotify Playlist' : 'Spotify Album');

  const result = {
    title: containerTitle,
    thumbnail,
    duration: totalDuration > 0 ? totalDuration : null,
    platform: 'spotify',
    spotifyType: type, // 'playlist' or 'album'
    isCollection: true,
    trackCount: tracks.length,
    tracks,
    formats: audioFormats,
    audioAvailable: true,
  };

  videoInfoCache.set(url, result);
  return result;
};

export const downloadSpotifyTrack = async (url, formatId, type, bitrate) => {
  let searchQuery = null;

  // 1. If a full Spotify track URL is passed, resolve its track metadata first
  if (url.includes('spotify.com') || url.includes('spotify:')) {
    try {
      const info = await fetchSpotifyInfo(url);
      if (info.searchQuery) {
        searchQuery = info.searchQuery;
      } else if (info.title) {
        searchQuery = `${info.title} Official Audio`;
      }
    } catch {}
  }

  if (!searchQuery) {
    // If raw query or title was passed in url param
    searchQuery = url.replace(/^https?:\/\//, '');
  }

  process.stdout.write(`[spotifyService] Searching audio for: "${searchQuery}"\n`);

  // Tier 1: Fast CDN path — resolve YouTube ID (~2-5s) + Y2Mate CDN stream (~3-10s)
  // No temp file, no ffmpeg — just a direct pre-encoded MP3 from the CDN.
  try {
    const videoId = await ytdlpService.resolveSearchVideoId(searchQuery);
    if (videoId) {
      process.stdout.write(`[spotifyService] Tier 1: Resolved videoId ${videoId}, fetching Y2Mate CDN stream...\n`);
      const cdnUrl = await fetchY2MateStream(videoId, '720', 'mp3');
      if (cdnUrl) {
        const stream = await new Promise((resolve, reject) => {
          const parsed = new URL(cdnUrl);
          const client = parsed.protocol === 'http:' ? http : https;
          const req = client.get(
            cdnUrl,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                Referer: 'https://frame.y2meta-uk.com/',
                Accept: '*/*',
              },
              timeout: 30000,
            },
            (res) => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                process.stdout.write(
                  `[spotifyService] Tier 1 CDN stream connected for ${videoId}\n`,
                );
                resolve(res);
              } else {
                reject(new Error(`CDN stream HTTP ${res.statusCode}`));
              }
            },
          );
          req.on('error', reject);
          req.on('timeout', () =>
            req.destroy(new Error('CDN stream connection timeout')),
          );
        });
        // Flag: already MP3, controller skips ffmpeg and pipes directly
        stream.isMp3Ready = true;
        return stream;
      }
    }
  } catch (tier1Err) {
    process.stdout.write(
      `[spotifyService] Tier 1 CDN failed (${tier1Err.message}), falling back to yt-dlp...\n`,
    );
  }

  // Tier 2 Fallback: yt-dlp download to temp file — slower but always works
  const targetSearch = `ytsearch1:${searchQuery}`;
  return ytdlpService.downloadVideo(targetSearch, 'bestaudio/best', 'audio');
};
