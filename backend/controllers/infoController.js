import * as ytdlpService from '../services/ytdlpService.js';
import * as snapchatService from '../services/snapchatService.js';
import * as pinterestService from '../services/pinterestService.js';
import * as threadsService from '../services/threadsService.js';
import * as linkedinService from '../services/linkedinService.js';
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
        } catch (scrapeErr) {
          try {
            info = await ytdlpService.fetchVideoInfo(url);
          } catch {
            throw scrapeErr;
          }
        }
        break;

      case 'linkedin':
        try {
          info = await ytdlpService.fetchVideoInfo(url);
        } catch {
          info = await linkedinService.fetchVideoInfo(url);
        }
        break;

      default:
        info = await ytdlpService.fetchVideoInfo(url);
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
