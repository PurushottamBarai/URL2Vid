import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegStatic);

const convertToMp3 = (inputStream, responseStream) => {
  return ffmpeg(inputStream)
    .noVideo()
    .audioBitrate('192k')
    .format('mp3')
    .on('error', (err) => {
      console.error('ffmpeg conversion error:', err.message || err);
      if (!responseStream.headersSent) {
          responseStream.status(500).json({ error: 'Audio conversion failed.' });
      }
    })
    .pipe(responseStream, { end: true });
};

export {
  convertToMp3
};
