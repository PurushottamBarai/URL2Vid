import { URL } from 'url';
import https from 'https';
import http from 'http';
import ytdlp from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { videoInfoCache } from '../utils/cache.js';
import * as youtubeService from './youtubeService.js';
import * as ytdlpService from './ytdlpService.js';

const getYtdlpInstance = () => {
  const isWin = process.platform === 'win32';
  const assetName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  const tempPath = path.join(os.tmpdir(), assetName);
  const binaryPath =
    process.env.YTDLP_CUSTOM_BINARY || (fs.existsSync(tempPath) ? tempPath : null);

  if (binaryPath && fs.existsSync(binaryPath)) {
    return ytdlp.create(binaryPath);
  }
  return ytdlp;
};

export const parseYouTubeMusicUrl = (urlString) => {
  try {
    if (!urlString || typeof urlString !== 'string') return null;
    const urlObj = new URL(urlString);
    if (!urlObj.hostname.includes('music.youtube.com')) return null;

    const videoId = urlObj.searchParams.get('v');
    const listId = urlObj.searchParams.get('list');

    if (urlObj.pathname.includes('/playlist') && listId) {
      return { type: 'playlist', listId };
    }

    if (videoId) {
      return { type: 'track', videoId, listId: listId || null };
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

export const fetchYouTubeMusicInfo = async (url) => {
  const cached = videoInfoCache.get(url);
  if (cached) return cached;

  const parsed = parseYouTubeMusicUrl(url);
  if (!parsed) {
    throw new Error('Invalid YouTube Music URL. Please enter a valid song or playlist link.');
  }

  // --- 1. Single Track ---
  if (parsed.type === 'track') {
    const videoUrl = `https://www.youtube.com/watch?v=${parsed.videoId}`;
    let info;
    try {
      info = await youtubeService.fetchVideoInfo(videoUrl);
    } catch {
      info = await ytdlpService.fetchVideoInfo(videoUrl);
    }

    const result = {
      title: info.title || 'YouTube Music Audio',
      thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`,
      duration: info.duration || null,
      platform: 'youtubemusic',
      spotifyType: 'track',
      videoId: parsed.videoId,
      formats: audioFormats,
      audioAvailable: true,
      searchQuery: info.title || `${parsed.videoId}`,
    };

    videoInfoCache.set(url, result);
    return result;
  }

  // --- 2. Playlist ---
  if (parsed.type === 'playlist') {
    // Tier 1: YouTubei Internal Browse API (zero subprocess, never IP-blocked on Render datacenter IPs)
    try {
      const browseRes = await fetch('https://music.youtube.com/youtubei/v1/browse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Origin': 'https://music.youtube.com',
        },
        body: JSON.stringify({
          browseId: 'VL' + parsed.listId,
          context: {
            client: {
              clientName: 'WEB_REMIX',
              clientVersion: '1.20240722.01.00',
              hl: 'en',
              gl: 'US',
            },
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (browseRes.ok) {
        const d = await browseRes.json();
        const twoCol = d.contents?.twoColumnBrowseResultsRenderer;
        const playlistTitle =
          d.microformat?.microformatDataRenderer?.title ||
          d.header?.musicDetailHeaderRenderer?.title?.runs?.[0]?.text ||
          'YouTube Music Playlist';

        const section = twoCol?.secondaryContents?.sectionListRenderer?.contents?.[0];
        const shelf = section?.musicPlaylistShelfRenderer || section?.musicShelfRenderer;
        const items = shelf?.contents || [];

        if (items.length > 0) {
          const tracks = items
            .map((item, idx) => {
              const renderer = item.musicResponsiveListItemRenderer;
              if (!renderer) return null;

              const trackId =
                renderer.playlistItemData?.videoId ||
                renderer.overlay?.musicItemThumbnailOverlayRenderer?.content
                  ?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint
                  ?.videoId;

              if (!trackId) return null;

              const title =
                renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer
                  ?.text?.runs?.[0]?.text || `Track ${idx + 1}`;

              const artist =
                renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer
                  ?.text?.runs?.[0]?.text || '';

              const durationText =
                renderer.fixedColumns?.[0]
                  ?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]
                  ?.text || '';

              let durationSec = null;
              if (durationText) {
                const parts = durationText.split(':').map(Number);
                if (parts.length === 2) durationSec = parts[0] * 60 + parts[1];
                if (parts.length === 3)
                  durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
              }

              return {
                index: idx + 1,
                id: trackId,
                title,
                artists: artist,
                duration: durationSec,
                previewUrl: null,
                downloadUrl: `https://music.youtube.com/watch?v=${trackId}`,
                searchQuery: `${artist} ${title}`.trim(),
              };
            })
            .filter(Boolean);

          if (tracks.length > 0) {
            const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
            const thumbnail =
              d.microformat?.microformatDataRenderer?.thumbnail?.thumbnails?.[0]?.url ||
              `https://i.ytimg.com/vi/${tracks[0].id}/hqdefault.jpg`;

            const result = {
              title: playlistTitle,
              thumbnail,
              duration: totalDuration > 0 ? totalDuration : null,
              platform: 'youtubemusic',
              spotifyType: 'playlist',
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
      }
    } catch (tier1Err) {
      process.stdout.write(
        `[youtubeMusicService] Tier 1 YouTubei browse failed: ${tier1Err.message}, falling back to yt-dlp...\n`,
      );
    }

    // Tier 2: yt-dlp flat-playlist fallback
    const ytdlpExec = getYtdlpInstance();
    const playlistData = await ytdlpExec(url, {
      dumpSingleJson: true,
      flatPlaylist: true,
      playlistEnd: 100,
      noWarnings: true,
    });

    const entries = playlistData.entries || [];
    if (!entries.length) {
      throw new Error('No tracks found in YouTube Music playlist.');
    }

    const tracks = entries.map((e, idx) => {
      const trackId = e.id;
      const title = e.title || `Track ${idx + 1}`;
      const artist = e.uploader || e.channel || '';
      return {
        index: idx + 1,
        id: trackId || `yt_${idx + 1}`,
        title,
        artists: artist,
        duration: e.duration || null,
        previewUrl: null,
        downloadUrl: `https://music.youtube.com/watch?v=${trackId}`,
        searchQuery: `${artist} ${title}`.trim(),
      };
    });

    const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const thumbnail =
      playlistData.thumbnails?.[0]?.url ||
      (entries[0]?.id ? `https://i.ytimg.com/vi/${entries[0].id}/hqdefault.jpg` : null);

    const result = {
      title: playlistData.title || 'YouTube Music Playlist',
      thumbnail,
      duration: totalDuration > 0 ? totalDuration : null,
      platform: 'youtubemusic',
      spotifyType: 'playlist',
      isCollection: true,
      trackCount: tracks.length,
      tracks,
      formats: audioFormats,
      audioAvailable: true,
    };

    videoInfoCache.set(url, result);
    return result;
  }

  throw new Error('Unsupported YouTube Music URL.');
};

export const downloadYouTubeMusicTrack = async (url, formatId, type, bitrate) => {
  let videoId = null;

  // 1. Check if URL contains direct v= parameter
  if (url.includes('music.youtube.com') || url.includes('youtube.com') || url.includes('youtu.be')) {
    videoId = youtubeService.extractYouTubeId(url);
  }

  // 2. If it's a raw video ID (11 chars)
  if (!videoId && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
    videoId = url;
  }

  // 3. If no videoId, try resolving from metadata
  if (!videoId) {
    try {
      const info = await fetchYouTubeMusicInfo(url);
      videoId = info.videoId;
    } catch {}
  }

  // Tier 1: Fast CDN path if videoId is known
  if (videoId) {
    try {
      process.stdout.write(`[youtubeMusicService] Tier 1: Fetching Y2Mate CDN stream for ${videoId}...\n`);
      const cdnUrl = await youtubeService.fetchY2MateStream(videoId, '720', 'mp3');
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
                process.stdout.write(`[youtubeMusicService] Tier 1 CDN connected for ${videoId}\n`);
                resolve(res);
              } else {
                reject(new Error(`CDN stream HTTP ${res.statusCode}`));
              }
            }
          );
          req.on('error', reject);
          req.on('timeout', () => req.destroy(new Error('CDN stream connection timeout')));
        });
        stream.isMp3Ready = true;
        return stream;
      }
    } catch (cdnErr) {
      process.stdout.write(`[youtubeMusicService] Tier 1 CDN failed (${cdnErr.message}), falling back to yt-dlp...\n`);
    }
  }

  // Tier 2 Fallback: yt-dlp download to temp file
  const targetUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
  return ytdlpService.downloadVideo(targetUrl, 'bestaudio/best', 'audio');
};
