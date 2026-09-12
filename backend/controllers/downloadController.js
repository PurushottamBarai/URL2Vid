const ytdlpService = require('../services/ytdlpService');
const ffmpegService = require('../services/ffmpegService');

const fs = require('fs');

const downloadMedia = async (req, res) => {
  const { url, formatId, type } = req.query;

  try {
    if (type === 'audio') {
      res.header('Content-Disposition', 'attachment; filename="audio.mp3"');
      res.header('Content-Type', 'audio/mpeg');

      const ytDlpProcess = ytdlpService.getAudioStream(url);
      ffmpegService.convertToMp3(ytDlpProcess.stdout, res);

    } else {
      // type === 'video'
      const filePath = await ytdlpService.downloadVideo(url, formatId);
      
      res.download(filePath, 'video.mp4', (err) => {
        if (err) {
          console.error('Download stream error:', err);
        }
        // Delete the temp file after sending
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
  } catch (error) {
    console.error('downloadController setup error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to initiate download.' });
    }
  }
};

module.exports = {
  downloadMedia
};
