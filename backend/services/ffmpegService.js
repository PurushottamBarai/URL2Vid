const ffmpeg = require('fluent-ffmpeg');

const convertToMp3 = (inputStream, responseStream) => {
  return ffmpeg(inputStream)
    .noVideo()
    .audioBitrate('192k')
    .format('mp3')
    .on('error', (err) => {
      console.error('ffmpeg error:', err);
      if (!responseStream.headersSent) {
          responseStream.status(500).end();
      }
    })
    .pipe(responseStream, { end: true });
};

module.exports = {
  convertToMp3
};
