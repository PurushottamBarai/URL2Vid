import * as ytdlpService from '../services/ytdlpService.js';
import * as snapchatService from '../services/snapchatService.js';
import * as ffmpegService from '../services/ffmpegService.js';

import fs from 'fs';

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
      let filePath;
      if (url.includes('snapchat.com')) {
        filePath = await snapchatService.downloadVideo(url, type);
      } else {
        filePath = await ytdlpService.downloadVideo(url, formatId, type);
      }
      
      res.download(filePath, 'video.mp4', (err) => {
        if (err) {
          console.error('Download stream error:', err);
        }
        
        // Ensure file exists before attempting to delete it (e.g. if yt-dlp failed early)
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
