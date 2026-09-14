import * as ytdlpService from '../services/ytdlpService.js';
import * as snapchatService from '../services/snapchatService.js';
import * as pinterestService from '../services/pinterestService.js';
import * as threadsService from '../services/threadsService.js';
import * as linkedinService from '../services/linkedinService.js';
import * as ffmpegService from '../services/ffmpegService.js';

import fs from 'fs';

const detectPlatform = (url) => {
  if (url.includes('snapchat.com')) return 'snapchat';
  if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
  if (url.includes('threads.com') || url.includes('threads.net')) return 'threads';
  if (url.includes('linkedin.com') || url.includes('lnkd.in')) return 'linkedin';
  return 'ytdlp';
};

const downloadMedia = async (req, res, next) => {
  const { url, formatId, type } = req.query;

  // Validate formatId to prevent potential command injection in yt-dlp-exec
  if (formatId && !/^[a-zA-Z0-9_-]+$/.test(formatId)) {
    return res.status(400).json({ error: 'Invalid formatId provided.' });
  }

  try {
    if (type === 'audio') {
      res.header('Content-Disposition', 'attachment; filename="audio.mp3"');
      res.header('Content-Type', 'audio/mpeg');

      const ytDlpProcess = ytdlpService.getAudioStream(url);
      ffmpegService.convertToMp3(ytDlpProcess.stdout, res);

    } else {
      const platform = detectPlatform(url);
      let filePath;

      switch (platform) {
        case 'snapchat':
          filePath = await snapchatService.downloadVideo(url, type);
          break;
        case 'pinterest':
          filePath = await pinterestService.downloadVideo(url);
          break;
        case 'threads':
          filePath = await threadsService.downloadVideo(url);
          break;
        case 'linkedin':
          filePath = await linkedinService.downloadVideo(url);
          break;
        default:
          filePath = await ytdlpService.downloadVideo(url, formatId, type);
      }

      res.download(filePath, 'video.mp4', (err) => {
        if (err) {
          console.error('Download stream error:', err);
        }

        // Ensure file exists before attempting to delete it
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

export {
  downloadMedia
};
