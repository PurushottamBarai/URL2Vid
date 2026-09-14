import * as ytdlpService from '../services/ytdlpService.js';
import * as snapchatService from '../services/snapchatService.js';
import * as pinterestService from '../services/pinterestService.js';
import * as threadsService from '../services/threadsService.js';
import * as linkedinService from '../services/linkedinService.js';
import { processVideoFormats } from '../utils/formatHelpers.js';

/**
 * Detect which platform the URL belongs to and route to the correct service.
 * Platforms with aggressive bot-protection or yt-dlp incompatibility get
 * dedicated scraping services; everything else falls through to yt-dlp.
 */
const detectPlatform = (url) => {
  if (url.includes('snapchat.com')) return 'snapchat';
  if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
  if (url.includes('threads.com') || url.includes('threads.net')) return 'threads';
  if (url.includes('linkedin.com') || url.includes('lnkd.in')) return 'linkedin';
  return 'ytdlp';
};

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
        info = await threadsService.fetchVideoInfo(url);
        break;
      case 'linkedin':
        info = await linkedinService.fetchVideoInfo(url);
        break;
      default:
        info = await ytdlpService.fetchVideoInfo(url);
    }

    const availableFormats = processVideoFormats(info.formats);

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats: availableFormats,
      audioAvailable: info.formats?.some(f => f.acodec !== 'none') || false,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getInfo
};
