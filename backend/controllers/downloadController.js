import * as ytdlpService from '../services/ytdlpService.js';
import * as snapchatService from '../services/snapchatService.js';
import * as pinterestService from '../services/pinterestService.js';
import * as threadsService from '../services/threadsService.js';
import * as linkedinService from '../services/linkedinService.js';
import * as ffmpegService from '../services/ffmpegService.js';
import rapidapiService from '../services/rapidapiService.js';
import { detectPlatform } from '../utils/platformDetector.js';

import fs from 'fs';

const FORMAT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const downloadMedia = async (req, res, next) => {
  const { url, formatId, type } = req.query;

  if (formatId && !FORMAT_ID_PATTERN.test(formatId)) {
    return res.status(400).json({ error: 'Invalid formatId provided.' });
  }

  try {
    const platform = detectPlatform(url);
    const useRapidAPI = (platform === 'youtube' || (platform === 'ytdlp' && url.includes('youtube.com'))) && process.env.RAPIDAPI_KEY;

    if (type === 'audio' && !useRapidAPI && ['youtube', 'facebook', 'twitter', 'reddit', 'tiktok'].includes(platform)) {
      res.header('Content-Disposition', 'attachment; filename="audio.mp3"');
      res.header('Content-Type', 'audio/mpeg');
      res.flushHeaders();
      const ytDlpProcess = ytdlpService.getAudioStream(url);
      ffmpegService.convertToMp3(ytDlpProcess.stdout, res);
      return;
    }

    if (type === 'audio') {
      res.header('Content-Disposition', 'attachment; filename="audio.mp3"');
      res.header('Content-Type', 'audio/mpeg');
    } else {
      res.header('Content-Disposition', 'attachment; filename="video.mp4"');
      res.header('Content-Type', 'video/mp4');
    }
    res.flushHeaders();

    let mediaStream;

    switch (platform) {
      case 'snapchat':
        mediaStream = await snapchatService.downloadVideo(url, type);
        break;

      case 'pinterest':
        mediaStream = await pinterestService.downloadVideo(url);
        break;

      case 'threads':
        try {
          mediaStream = await threadsService.downloadVideo(url);
        } catch {
          mediaStream = await ytdlpService.downloadVideo(url, formatId, type);
        }
        break;

      case 'linkedin':
        try {
          mediaStream = await ytdlpService.downloadVideo(url, formatId, type);
        } catch {
          mediaStream = await linkedinService.downloadVideo(url);
        }
        break;

      case 'youtube':
        if (useRapidAPI) {
          try {
            mediaStream = await rapidapiService.downloadVideo(url, formatId);
          } catch (err) {
            console.warn(`[download] RapidAPI failed for YouTube (${err.message}), falling back to yt-dlp...`);
            mediaStream = await ytdlpService.downloadVideo(url, formatId, type);
          }
        } else {
          mediaStream = await ytdlpService.downloadVideo(url, formatId, type);
        }
        break;

      default:
        if (useRapidAPI) {
          mediaStream = await rapidapiService.downloadVideo(url, formatId);
        } else {
          mediaStream = await ytdlpService.downloadVideo(url, formatId, type);
        }
    }

    if (type === 'audio') {
      const conversionProcess = ffmpegService.convertToMp3(mediaStream, res);
      
      const cleanup = () => {
        if (mediaStream.tempFilePath && fs.existsSync(mediaStream.tempFilePath)) {
          fs.unlinkSync(mediaStream.tempFilePath);
        }
      };

      res.on('finish', cleanup);
      res.on('close', cleanup);
      res.on('error', cleanup);
      return;
    }

    mediaStream.pipe(res);

    mediaStream.on('end', () => {
      if (mediaStream.tempFilePath && fs.existsSync(mediaStream.tempFilePath)) {
        fs.unlinkSync(mediaStream.tempFilePath);
      }
    });

    mediaStream.on('error', (err) => {
      process.stderr.write(`[download] Stream error: ${err.message}\n`);
      if (mediaStream.tempFilePath && fs.existsSync(mediaStream.tempFilePath)) {
        fs.unlinkSync(mediaStream.tempFilePath);
      }
      res.end();
    });

  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      process.stderr.write(`[download] Error after headers sent: ${error.message}\n`);
      res.end();
    }
  }
};

export { downloadMedia };
