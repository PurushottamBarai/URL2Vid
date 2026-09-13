import ytdlp from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fetchVideoInfo = async (url) => {
  return await ytdlp(url, {
    dumpJson: true,
    noWarnings: true,
    noCheckCertificate: true,
  });
};

const downloadVideo = async (url, formatId, type) => {
  let formatArg = formatId ? `${formatId}+bestaudio/best` : 'best';
  
  if (type === 'mute') {
    formatArg = formatId ? `${formatId}` : 'bestvideo';
  }
  
  // Appending a random string and timestamp to prevent collisions during concurrent downloads
  const fileName = `video_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`;
  const tempDir = path.join(__dirname, '..', 'tmp');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const filePath = path.join(tempDir, fileName);

  await ytdlp(url, {
    output: filePath,
    format: formatArg,
    mergeOutputFormat: 'mp4',
    noWarnings: true,
  });

  return filePath;
};

const getAudioStream = (url) => {
  return ytdlp.exec(url, {
    output: '-', // stdout
    format: 'bestaudio',
    noWarnings: true,
  }, { stdio: ['ignore', 'pipe', 'ignore'] });
};

export {
  fetchVideoInfo,
  downloadVideo,
  getAudioStream
};
