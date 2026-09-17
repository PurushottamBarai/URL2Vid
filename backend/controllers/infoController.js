import * as youtubeService from '../services/youtubeService.js';
import * as ytdlpService from '../services/ytdlpService.js';
import * as snapchatService from '../services/snapchatService.js';
import * as pinterestService from '../services/pinterestService.js';
import * as threadsService from '../services/threadsService.js';
import * as linkedinService from '../services/linkedinService.js';
import * as ffmpegService from '../services/ffmpegService.js';
import { processVideoFormats } from '../utils/formatHelpers.js';
import { detectPlatform } from '../utils/platformDetector.js';

const resolveVideoInfo = async (platform, url) => {
  switch (platform) {
    case 'youtube':
      return youtubeService.fetchVideoInfo(url);
    case 'snapchat':
      return snapchatService.fetchVideoInfo(url);
    case 'pinterest':
      return pinterestService.fetchVideoInfo(url).catch(() => 
        ytdlpService.fetchVideoInfo(url)
      );
    case 'threads':
      return threadsService.fetchVideoInfo(url).catch(() => 
        ytdlpService.fetchVideoInfo(url)
      );
    case 'linkedin':
      return ytdlpService.fetchVideoInfo(url).catch(() => 
        linkedinService.fetchVideoInfo(url)
      );
    default:
      return ytdlpService.fetchVideoInfo(url).catch((err) => {
        const fullErr = `${err.stderr || ''} ${err.message || ''} ${err.shortMessage || ''}`;
        const ytIdMatch = fullErr.match(/\[youtube\]\s+([a-zA-Z0-9_-]{11})/i);
        if (ytIdMatch && ytIdMatch[1]) {
          return youtubeService.fetchVideoInfo(`https://www.youtube.com/watch?v=${ytIdMatch[1]}`);
        }
        throw err;
      });
  }
};

const getInfo = async (req, res, next) => {
  const { url } = req.body;

  try {
    const platform = detectPlatform(url);
    const info = await resolveVideoInfo(platform, url);

    if ((info.duration === null || info.duration === undefined || info.duration <= 0) && info.formats?.[0]?.url) {
      try {
        const probed = await ffmpegService.probeDuration(info.formats[0].url);
        if (probed && probed > 0) {
          info.duration = probed;
        }
      } catch {}
    }

    const availableFormats = processVideoFormats(info.formats, info.duration);

    res.status(200).json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats: availableFormats,
      audioAvailable: Array.isArray(info.formats) && info.formats.some((f) => f.acodec !== 'none'),
    });
  } catch (error) {
    next(error);
  }
};

export { getInfo };
