import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegStatic);

const AUDIO_BITRATE = '192k';

const convertToMp3 = (inputStream, responseStream) => {
  return ffmpeg(inputStream)
    .noVideo()
    .audioBitrate(AUDIO_BITRATE)
    .format('mp3')
    .on('error', (err) => {
      process.stderr.write(`[ffmpeg] Conversion error: ${err.message || err}\n`);
      if (!responseStream.headersSent) {
        responseStream.status(500).json({ error: 'Audio conversion failed.' });
      }
    })
    .pipe(responseStream, { end: true });
};

export { convertToMp3 };
