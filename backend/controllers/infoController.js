const ytdlpService = require('../services/ytdlpService');

const getInfo = async (req, res) => {
  const { url } = req.body;

  try {
    const info = await ytdlpService.fetchVideoInfo(url);
    
    // Filter formats: keep only formats with video or audio, avoid storyboards
    let availableFormats = [];
    if (info.formats) {
       availableFormats = info.formats
        .filter(f => f.vcodec !== 'none' || f.acodec !== 'none') // Ensure it's media
        .map(f => ({
          formatId: f.format_id,
          ext: f.ext,
          resolution: f.resolution || (f.width ? `${f.width}x${f.height}` : 'Audio Only'),
          filesize: f.filesize || f.filesize_approx || null,
          hasVideo: f.vcodec !== 'none',
          hasAudio: f.acodec !== 'none',
        }))
        // Try to filter out redundant/internal formats and keep the best ones
        .filter(f => f.hasVideo)
        .sort((a, b) => {
            const getRes = (resStr) => {
                if(!resStr || resStr === 'Audio Only') return 0;
                const match = resStr.match(/(\d+)x(\d+)/);
                if(match) return parseInt(match[1]) * parseInt(match[2]);
                return 0;
            };
            return getRes(b.resolution) - getRes(a.resolution);
        });
        
        // Remove duplicates based on resolution
        availableFormats = availableFormats.filter((v,i,a)=>a.findIndex(v2=>(v2.resolution===v.resolution))===i);
    }

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats: availableFormats,
      audioAvailable: info.formats?.some(f => f.acodec !== 'none') || false,
    });
  } catch (error) {
    console.error('infoController error:', error);
    res.status(500).json({ error: 'Failed to fetch video information. The video might be private or the platform is currently blocking requests.' });
  }
};

module.exports = {
  getInfo
};
