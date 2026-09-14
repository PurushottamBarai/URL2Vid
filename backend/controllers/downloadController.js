import * as ytdlpService from '../services/ytdlpService.js';
import * as snapchatService from '../services/snapchatService.js';
import * as pinterestService from '../services/pinterestService.js';
import * as threadsService from '../services/threadsService.js';
import * as linkedinService from '../services/linkedinService.js';
import * as ffmpegService from '../services/ffmpegService.js';
import { detectPlatform } from '../utils/platformDetector.js';

import fs from 'fs';

const FORMAT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const downloadMedia = async (req, res, next) => {
  const { url, formatId, type } = req.query;

  if (formatId && !FORMAT_ID_PATTERN.test(formatId)) {
    return res.status(400).json({ error: 'Invalid formatId provided.' });
  }

  try {
    if (type === 'audio') {
      res.header('Content-Disposition', 'attachment; filename="audio.mp3"');
      res.header('Content-Type', 'audio/mpeg');
      const ytDlpProcess = ytdlpService.getAudioStream(url);
      ffmpegService.convertToMp3(ytDlpProcess.stdout, res);
      return;
    }

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
        try {
          filePath = await threadsService.downloadVideo(url);
        } catch {
          filePath = await ytdlpService.downloadVideo(url, formatId, type);
        }
        break;

      case 'linkedin':
        try {
          filePath = await ytdlpService.downloadVideo(url, formatId, type);
        } catch {
          filePath = await linkedinService.downloadVideo(url);
        }
        break;

      default:
        filePath = await ytdlpService.downloadVideo(url, formatId, type);
    }

    res.download(filePath, 'video.mp4', (err) => {
      if (err) {
        process.stderr.write(`[download] Stream error: ${err.message}\n`);
      }
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    next(error);
  }
};

export { downloadMedia };
