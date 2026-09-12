const ytdlp = require('yt-dlp-exec');

const fetchVideoInfo = async (url) => {
  return await ytdlp(url, {
    dumpJson: true,
    noWarnings: true,
    noCallHome: true,
    noCheckCertificate: true,
  });
};

const path = require('path');
const fs = require('fs');

const downloadVideo = async (url, formatId) => {
  const formatArg = formatId ? `${formatId}+bestaudio/best` : 'best';
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
  const ytDlpProcess = ytdlp.exec(url, {
    output: '-', // stdout
    format: 'bestaudio',
    noWarnings: true,
  }, { stdio: ['ignore', 'pipe', 'ignore'] });
  
  return ytDlpProcess;
}

module.exports = {
  fetchVideoInfo,
  downloadVideo,
  getAudioStream
};
