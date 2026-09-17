import { execFile } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegStatic);

const ALLOWED_BITRATES = ['96k', '128k', '192k', '256k', '320k'];
const DEFAULT_AUDIO_BITRATE = '192k';

const convertToMp3 = (inputStream, responseStream, bitrate = DEFAULT_AUDIO_BITRATE) => {
  const targetBitrate = ALLOWED_BITRATES.includes(bitrate) ? bitrate : DEFAULT_AUDIO_BITRATE;

  return ffmpeg(inputStream)
    .noVideo()
    .audioBitrate(targetBitrate)
    .format('mp3')
    .on('error', (err) => {
      process.stderr.write(`[ffmpeg] Conversion error: ${err.message || err}\n`);
      if (!responseStream.headersSent) {
        responseStream.status(500).json({ error: 'Audio conversion failed.' });
      }
    })
    .pipe(responseStream, { end: true });
};

const probeDuration = (mediaUrl) => {
  return new Promise((resolve) => {
    if (!mediaUrl || typeof mediaUrl !== 'string') return resolve(null);
    execFile(
      ffmpegStatic,
      ['-i', mediaUrl],
      { timeout: 6000 },
      (err, stdout, stderr) => {
        const match = stderr?.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
        if (match) {
          const sec =
            parseFloat(match[1]) * 3600 +
            parseFloat(match[2]) * 60 +
            parseFloat(match[3]);
          if (!isNaN(sec) && sec > 0) {
            return resolve(Math.round(sec * 10) / 10);
          }
        }
        resolve(null);
      }
    );
  });
};

const muteVideo = (inputStream, responseStream) => {
  return ffmpeg(inputStream)
    .noAudio()
    .videoCodec('copy')
    .format('mp4')
    .outputOptions([
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof'
    ])
    .on('error', (err) => {
      process.stderr.write(`[ffmpeg] Mute error: ${err.message || err}\n`);
      if (!responseStream.headersSent) {
        responseStream.status(500).json({ error: 'Video muting failed.' });
      }
    })
    .pipe(responseStream, { end: true });
};

export { convertToMp3, probeDuration, muteVideo };

