import * as ytdlpService from '../services/ytdlpService.js';
import * as snapchatService from '../services/snapchatService.js';
import { processVideoFormats } from '../utils/formatHelpers.js';

const getInfo = async (req, res, next) => {
  const { url } = req.body;

  try {
    let info;
    if (url.includes('snapchat.com')) {
      info = await snapchatService.fetchVideoInfo(url);
    } else {
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
    // Pass execution to the global errorHandler instead of manually sending a 500
    next(error);
  }
};

export {
  getInfo
};
