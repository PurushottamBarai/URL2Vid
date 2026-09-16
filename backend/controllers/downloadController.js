import fs from 'fs';
import * as ytdlpService from '../services/ytdlpService.js';
import * as snapchatService from '../services/snapchatService.js';
import * as pinterestService from '../services/pinterestService.js';
import * as threadsService from '../services/threadsService.js';
import * as linkedinService from '../services/linkedinService.js';
import * as ffmpegService from '../services/ffmpegService.js';
import { detectPlatform } from '../utils/platformDetector.js';

const FORMAT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const resolveMediaStream = async (platform, url, formatId, type) => {
  switch (platform) {
    case 'snapchat':
      return snapchatService.downloadVideo(url, type);
    case 'pinterest':
      return pinterestService.downloadVideo(url).catch(() => 
        ytdlpService.downloadVideo(url, formatId, type)
      );
    case 'threads':
      return threadsService.downloadVideo(url).catch(() => 
        ytdlpService.downloadVideo(url, formatId, type)
      );
    case 'linkedin':
      return ytdlpService.downloadVideo(url, formatId, type).catch(() => 
        linkedinService.downloadVideo(url)
      );
    default:
      return ytdlpService.downloadVideo(url, formatId, type);
  }
};

const downloadMedia = async (req, res, next) => {
  const { url, formatId, type } = req.query;

  if (formatId && !FORMAT_ID_PATTERN.test(formatId)) {
    return res.status(400).json({ error: 'Invalid formatId provided.' });
  }

  try {
    const platform = detectPlatform(url);
    const isAudio = type === 'audio';

    res.header('Content-Disposition', `attachment; filename="${isAudio ? 'audio.mp3' : 'video.mp4'}"`);
    res.header('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');
    res.flushHeaders();

    const mediaStream = await resolveMediaStream(platform, url, formatId, type);

    const cleanup = () => {
      if (mediaStream?.tempFilePath && fs.existsSync(mediaStream.tempFilePath)) {
        try { fs.unlinkSync(mediaStream.tempFilePath); } catch {}
      }
    };

    res.on('close', cleanup);
    res.on('finish', cleanup);

    if (isAudio) {
      const conversionSource = mediaStream.tempFilePath || mediaStream;
      ffmpegService.convertToMp3(conversionSource, res);
      res.on('error', cleanup);
      return;
    }

    mediaStream.pipe(res);
    mediaStream.on('error', (err) => {
      process.stderr.write(`[download] Stream error: ${err.message}\n`);
      cleanup();
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
