import * as youtubeService from "../services/youtubeService.js";
import * as ytdlpService from "../services/ytdlpService.js";
import * as snapchatService from "../services/snapchatService.js";
import * as pinterestService from "../services/pinterestService.js";
import * as threadsService from "../services/threadsService.js";
import * as linkedinService from "../services/linkedinService.js";
import * as spotifyService from "../services/spotifyService.js";
import * as appleMusicService from "../services/appleMusicService.js";
import * as youtubeMusicService from "../services/youtubeMusicService.js";
import * as soundcloudService from "../services/soundcloudService.js";
import * as ffmpegService from "../services/ffmpegService.js";
import { processVideoFormats } from "../utils/formatHelpers.js";
import { detectPlatform } from "../utils/platformDetector.js";
import { videoInfoCache } from "../utils/cache.js";

const resolveVideoInfo = async (platform, url) => {
  const cached = videoInfoCache.get(url);
  if (cached) {
    return cached;
  }

  let info;
  switch (platform) {
    case "youtube":
      info = await youtubeService.fetchVideoInfo(url);
      break;
    case "spotify":
      info = await spotifyService.fetchSpotifyInfo(url);
      break;
    case "applemusic":
      info = await appleMusicService.fetchAppleMusicInfo(url);
      break;
    case "youtubemusic":
      info = await youtubeMusicService.fetchYouTubeMusicInfo(url);
      break;
    case "soundcloud":
      info = await soundcloudService.fetchSoundCloudInfo(url);
      break;
    case "snapchat":
      info = await snapchatService.fetchVideoInfo(url);
      break;
    case "pinterest":
      info = await pinterestService
        .fetchVideoInfo(url)
        .catch(() => ytdlpService.fetchVideoInfo(url));
      break;
    case "threads":
      info = await threadsService
        .fetchVideoInfo(url)
        .catch(() => ytdlpService.fetchVideoInfo(url));
      break;
    case "linkedin":
      info = await ytdlpService
        .fetchVideoInfo(url)
        .catch(() => linkedinService.fetchVideoInfo(url));
      break;
    default:
      info = await ytdlpService.fetchVideoInfo(url).catch((err) => {
        const fullErr = `${err.stderr || ""} ${err.message || ""} ${err.shortMessage || ""}`;
        const ytIdMatch = fullErr.match(/\[youtube\]\s+([a-zA-Z0-9_-]{11})/i);
        if (ytIdMatch && ytIdMatch[1]) {
          return youtubeService.fetchVideoInfo(
            `https://www.youtube.com/watch?v=${ytIdMatch[1]}`,
          );
        }
        throw err;
      });
      break;
  }

  if (info) {
    videoInfoCache.set(url, info);
  }
  return info;
};

const getInfo = async (req, res, next) => {
  const { url } = req.body;

  try {
    const platform = detectPlatform(url);
    const info = await resolveVideoInfo(platform, url);

    if (
      (info.duration === null ||
        info.duration === undefined ||
        info.duration <= 0) &&
      info.formats?.[0]?.url
    ) {
      try {
        const probed = await ffmpegService.probeDuration(info.formats[0].url);
        if (probed && probed > 0) {
          info.duration = probed;
          videoInfoCache.set(url, info);
        }
      } catch {}
    }

    const availableFormats = processVideoFormats(info.formats, info.duration);

    res.status(200).json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats: availableFormats,
      embedDownloadUrl: info.embedDownloadUrl || null,
      y2mateUrl: info.y2mateUrl || null,
      isEmbedFallback: Boolean(info.isEmbedFallback),
      videoId: info.videoId || null,
      platform: info.platform || platform,
      spotifyType: info.spotifyType || null,
      isCollection: Boolean(info.isCollection),
      trackCount: info.trackCount || null,
      tracks: info.tracks || null,
      audioAvailable:
        Boolean(info.audioAvailable) ||
        Boolean(info.isEmbedFallback) ||
        (Array.isArray(info.formats) &&
          info.formats.some((f) => f.acodec !== "none")) ||
        Boolean(info.audioUrl),
    });
  } catch (error) {
    next(error);
  }
};

export { getInfo };
