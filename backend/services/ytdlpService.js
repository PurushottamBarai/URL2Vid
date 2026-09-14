import ytdlp from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FACEBOOK_DOMAINS = ['facebook.com', 'fb.watch'];

const isFacebookUrl = (url) => FACEBOOK_DOMAINS.some(d => url.includes(d));

const fetchVideoInfo = async (url) => {
  const flags = {
    dumpJson: true,
    noWarnings: true,
    noCheckCertificate: true,
    socketTimeout: 20,
    retries: 1,
    extractorArgs: 'youtube:player_client=default',
  };

  if (isFacebookUrl(url)) {
    flags.addHeader = [
      'referer:https://www.facebook.com/',
      'accept-language:en-US,en;q=0.9',
    ];
  }

  return await ytdlp(url, flags);
};

const downloadVideo = async (url, formatId, type) => {
  let formatArg = formatId ? `${formatId}+bestaudio/best` : 'best';

  if (type === 'mute') {
    formatArg = formatId ? `${formatId}` : 'bestvideo';
  }

  const fileName = `video_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`;
  const tempDir = path.join(__dirname, '..', 'tmp');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, fileName);

  await ytdlp(url, {
    output: filePath,
    format: formatArg,
    mergeOutputFormat: 'mp4',
    noWarnings: true,
    socketTimeout: 30,
    retries: 1,
    extractorArgs: 'youtube:player_client=default',
  });

  return filePath;
};

const getAudioStream = (url) => {
  return ytdlp.exec(url, {
    output: '-',
    format: 'bestaudio',
    noWarnings: true,
    extractorArgs: 'youtube:player_client=default',
  }, { stdio: ['ignore', 'pipe', 'ignore'] });
};

export { fetchVideoInfo, downloadVideo, getAudioStream };
