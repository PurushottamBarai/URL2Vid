import * as ytdlpService from '../services/ytdlpService.js';
import * as snapchatService from '../services/snapchatService.js';
import * as pinterestService from '../services/pinterestService.js';
import * as threadsService from '../services/threadsService.js';
import * as linkedinService from '../services/linkedinService.js';
import rapidapiService from '../services/rapidapiService.js';
import { processVideoFormats } from '../utils/formatHelpers.js';
import { detectPlatform } from '../utils/platformDetector.js';

const getInfo = async (req, res, next) => {
  const { url } = req.body;

  try {
    const platform = detectPlatform(url);
    let info;

    switch (platform) {
      case 'snapchat':
        info = await snapchatService.fetchVideoInfo(url);
        break;

      case 'pinterest':
        info = await pinterestService.fetchVideoInfo(url);
        break;

      case 'threads':
        try {
          info = await threadsService.fetchVideoInfo(url);
        } catch {
          info = await ytdlpService.fetchVideoInfo(url);
        }
        break;

      case 'linkedin':
        try {
          info = await ytdlpService.fetchVideoInfo(url);
        } catch {
          info = await linkedinService.fetchVideoInfo(url);
        }
        break;

      case 'youtube':
        if (process.env.RAPIDAPI_KEY) {
          try {
            info = await rapidapiService.fetchVideoInfo(url);
          } catch (err) {
            console.warn(`[info] RapidAPI failed for YouTube (${err.message}), falling back to yt-dlp...`);
            info = await ytdlpService.fetchVideoInfo(url);
          }
        } else {
          info = await ytdlpService.fetchVideoInfo(url);
        }
        break;

      default:
        if (platform === 'ytdlp' && url.includes('youtube.com') && process.env.RAPIDAPI_KEY) {
           info = await rapidapiService.fetchVideoInfo(url);
        } else {
           info = await ytdlpService.fetchVideoInfo(url);
        }
    }

    const availableFormats = processVideoFormats(info.formats);

    res.status(200).json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats: availableFormats,
      audioAvailable: Array.isArray(info.formats) && info.formats.some(f => f.acodec !== 'none'),
    });
  } catch (error) {
    next(error);
  }
};

export { getInfo };
