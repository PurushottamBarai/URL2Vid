import { URL } from 'url';
import https from 'https';
import http from 'http';
import { videoInfoCache } from '../utils/cache.js';
import * as ytdlpService from './ytdlpService.js';
import { fetchY2MateStream } from './youtubeService.js';

// Parse ISO 8601 duration (e.g. PT3M36S, PT45S, PT1H2M10S)
const parseIsoDuration = (isoStr) => {
  if (!isoStr || typeof isoStr !== 'string') return null;
  const match = isoStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return null;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Parse an Apple Music URL and extract type + IDs.
 * Supports:
 *   /song/<slug>/<trackId>
 *   /album/<slug>/<albumId>?i=<trackId>  (single track from album)
 *   /album/<slug>/<albumId>              (full album)
 *   /playlist/<slug>/<playlistId>
 */
export const parseAppleMusicUrl = (urlString) => {
  try {
    if (!urlString || typeof urlString !== 'string') return null;
    const urlObj = new URL(urlString);
    if (!urlObj.hostname.includes('music.apple.com') && !urlObj.hostname.includes('itunes.apple.com')) {
      return null;
    }

    const trackParam = urlObj.searchParams.get('i');

    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const typeIdx = pathParts.findIndex(p => ['song', 'album', 'playlist'].includes(p.toLowerCase()));
    if (typeIdx === -1) {
      return null;
    }

    const rawType = pathParts[typeIdx].toLowerCase();
    const remainingParts = pathParts.slice(typeIdx + 1);
    const mainId = remainingParts[remainingParts.length - 1];

    if (!mainId) return null;

    if (rawType === 'song') {
      return { type: 'track', trackId: mainId };
    }

    if (rawType === 'album') {
      if (trackParam) {
        return { type: 'track', trackId: trackParam, albumId: mainId };
      }
      return { type: 'album', albumId: mainId };
    }

    if (rawType === 'playlist') {
      return { type: 'playlist', playlistId: mainId };
    }

    return null;
  } catch {
    return null;
  }
};

const audioFormats = [
  { format_id: '320k', resolution: '320 kbps (Best)', ext: 'mp3', acodec: 'mp3', vcodec: 'none', hasVideo: false },
  { format_id: '256k', resolution: '256 kbps (High)', ext: 'mp3', acodec: 'mp3', vcodec: 'none', hasVideo: false },
  { format_id: '192k', resolution: '192 kbps (Standard)', ext: 'mp3', acodec: 'mp3', vcodec: 'none', hasVideo: false },
  { format_id: '128k', resolution: '128 kbps (Compact)', ext: 'mp3', acodec: 'mp3', vcodec: 'none', hasVideo: false },
];

/**
 * Fallback to scraping Apple Music web page schema (JSON-LD)
 */
const fetchAppleMusicWebSchema = async (url) => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Apple Music returned HTTP ${res.status}`);
  const html = await res.text();

  // Find JSON-LD script tag
  const scriptMatch =
    html.match(/<script[^>]*id=["']schema:music-(?:playlist|album)["'][^>]*>([\s\S]*?)<\/script>/i) ||
    html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);

  if (!scriptMatch) {
    // Fallback: title from meta
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(' - Apple Music', '').trim() : 'Apple Music Audio';
    return {
      title,
      thumbnail: null,
      duration: null,
      platform: 'applemusic',
      spotifyType: 'track',
      formats: audioFormats,
      audioAvailable: true,
      searchQuery: `${title} Official Audio`,
    };
  }

  const schema = JSON.parse(scriptMatch[1]);
  const isPlaylist = schema['@type'] === 'MusicPlaylist' || Array.isArray(schema.track);

  if (isPlaylist && Array.isArray(schema.track) && schema.track.length > 0) {
    const tracks = schema.track.map((t, idx) => {
      const trackName = t.name || `Track ${idx + 1}`;
      const artistName = t.byArtist?.name || schema.byArtist?.name || '';
      const durationSec = parseIsoDuration(t.duration || t.audio?.duration);
      const trackUrl = t.url || t.audio?.potentialAction?.target?.actionPlatform || '';
      return {
        index: idx + 1,
        id: `apple_${idx + 1}`,
        title: trackName,
        artists: artistName,
        duration: durationSec,
        previewUrl: null,
        downloadUrl: trackUrl || url,
        searchQuery: `${artistName} ${trackName} Official Audio`.trim(),
      };
    });

    const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const thumbnail = schema.image || schema.track[0]?.audio?.thumbnailUrl || null;

    return {
      title: schema.name || 'Apple Music Playlist',
      thumbnail,
      duration: totalDuration > 0 ? totalDuration : null,
      platform: 'applemusic',
      spotifyType: 'playlist',
      isCollection: true,
      trackCount: tracks.length,
      tracks,
      formats: audioFormats,
      audioAvailable: true,
    };
  }

  // Single recording schema
  const title = schema.name || 'Apple Music Track';
  const artistName = schema.byArtist?.name || '';
  const duration = parseIsoDuration(schema.duration);
  const thumbnail = schema.image || null;

  return {
    title: artistName ? `${title} - ${artistName}` : title,
    thumbnail,
    duration,
    platform: 'applemusic',
    spotifyType: 'track',
    trackName: title,
    artists: artistName,
    formats: audioFormats,
    audioAvailable: true,
    searchQuery: `${artistName} ${title} Official Audio`.trim(),
  };
};

/**
 * Fetch metadata for a single track or an album/playlist using iTunes API + Web fallback.
 */
export const fetchAppleMusicInfo = async (url) => {
  const cached = videoInfoCache.get(url);
  if (cached) return cached;

  const parsed = parseAppleMusicUrl(url);
  if (!parsed) {
    throw new Error('Invalid Apple Music URL. Please enter a valid song, album, or playlist link.');
  }

  // ---- Single track ----
  if (parsed.type === 'track') {
    if (/^\d+$/.test(parsed.trackId)) {
      try {
        const lookupUrl = `https://itunes.apple.com/lookup?id=${parsed.trackId}&entity=song`;
        const res = await fetch(lookupUrl, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          const track = data.results?.find((r) => r.wrapperType === 'track');
          if (track) {
            const title = `${track.trackName} - ${track.artistName}`;
            const thumbnail = track.artworkUrl100
              ? track.artworkUrl100.replace('100x100bb', '600x600bb')
              : null;

            const result = {
              title,
              thumbnail,
              duration: track.trackTimeMillis ? Math.round(track.trackTimeMillis / 1000) : null,
              platform: 'applemusic',
              spotifyType: 'track',
              trackName: track.trackName,
              artists: track.artistName,
              formats: audioFormats,
              audioAvailable: true,
              previewUrl: track.previewUrl || null,
              searchQuery: `${track.artistName} ${track.trackName} Official Audio`,
            };

            videoInfoCache.set(url, result);
            return result;
          }
        }
      } catch {}
    }

    // Fallback to web schema
    const result = await fetchAppleMusicWebSchema(url);
    videoInfoCache.set(url, result);
    return result;
  }

  // ---- Album ----
  if (parsed.type === 'album' && /^\d+$/.test(parsed.albumId)) {
    try {
      const lookupUrl = `https://itunes.apple.com/lookup?id=${parsed.albumId}&entity=song&limit=200`;
      const res = await fetch(lookupUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const data = await res.json();
        const collectionItem = data.results?.find((r) => r.wrapperType === 'collection');
        const trackItems = data.results?.filter((r) => r.wrapperType === 'track') || [];

        if (trackItems.length > 0) {
          const containerTitle = collectionItem?.collectionName || 'Apple Music Album';
          const thumbnail = (collectionItem?.artworkUrl100 || trackItems[0]?.artworkUrl100 || '')
            .replace('100x100bb', '600x600bb');

          const tracks = trackItems.map((t, idx) => ({
            index: idx + 1,
            id: String(t.trackId),
            title: t.trackName || `Track ${idx + 1}`,
            artists: t.artistName || '',
            duration: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : null,
            previewUrl: t.previewUrl || null,
            downloadUrl: `https://music.apple.com/us/song/${(t.trackName || 'track').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${t.trackId}`,
            searchQuery: `${t.artistName} ${t.trackName} Official Audio`,
          }));

          const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);

          const result = {
            title: containerTitle,
            thumbnail,
            duration: totalDuration > 0 ? totalDuration : null,
            platform: 'applemusic',
            spotifyType: 'album',
            isCollection: true,
            trackCount: tracks.length,
            tracks,
            formats: audioFormats,
            audioAvailable: true,
          };

          videoInfoCache.set(url, result);
          return result;
        }
      }
    } catch {}
  }

  // ---- Playlist or Web Schema fallback ----
  const result = await fetchAppleMusicWebSchema(url);
  videoInfoCache.set(url, result);
  return result;
};

/**
 * Download an Apple Music track as MP3.
 * Tier 1: Resolve YouTube ID + Y2Mate CDN (fast, no ffmpeg)
 * Tier 2: yt-dlp ytsearch fallback (slower, uses ffmpeg)
 */
export const downloadAppleMusicTrack = async (url, formatId, type, bitrate) => {
  let searchQuery = null;

  // 1. If full Apple Music URL, resolve metadata to get a clean search query
  if (url.includes('music.apple.com') || url.includes('itunes.apple.com')) {
    try {
      const info = await fetchAppleMusicInfo(url);
      if (info.searchQuery) {
        searchQuery = info.searchQuery;
      } else if (info.title) {
        searchQuery = `${info.title} Official Audio`;
      }
    } catch {}
  }

  if (!searchQuery) {
    searchQuery = url.replace(/^https?:\/\//, '');
  }

  process.stdout.write(`[appleMusicService] Searching audio for: "${searchQuery}"\n`);

  // Tier 1: Fast CDN path
  try {
    const videoId = await ytdlpService.resolveSearchVideoId(searchQuery);
    if (videoId) {
      process.stdout.write(`[appleMusicService] Tier 1: Resolved videoId ${videoId}, fetching Y2Mate CDN stream...\n`);
      const cdnUrl = await fetchY2MateStream(videoId, '720', 'mp3');
      if (cdnUrl) {
        const stream = await new Promise((resolve, reject) => {
          const parsed = new URL(cdnUrl);
          const client = parsed.protocol === 'http:' ? http : https;
          const req = client.get(cdnUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
              Referer: 'https://frame.y2meta-uk.com/',
              Accept: '*/*',
            },
            timeout: 30000,
          }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              process.stdout.write(`[appleMusicService] Tier 1 CDN stream connected for ${videoId}\n`);
              resolve(res);
            } else {
              reject(new Error(`CDN stream HTTP ${res.statusCode}`));
            }
          });
          req.on('error', reject);
          req.on('timeout', () => req.destroy(new Error('CDN stream connection timeout')));
        });
        stream.isMp3Ready = true;
        return stream;
      }
    }
  } catch (tier1Err) {
    process.stdout.write(`[appleMusicService] Tier 1 CDN failed (${tier1Err.message}), falling back to yt-dlp...\n`);
  }

  // Tier 2 Fallback: yt-dlp download to temp file
  const targetSearch = `ytsearch1:${searchQuery}`;
  return ytdlpService.downloadVideo(targetSearch, 'bestaudio/best', 'audio');
};
