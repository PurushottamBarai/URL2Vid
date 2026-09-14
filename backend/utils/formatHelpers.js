export const processVideoFormats = (rawFormats) => {
  if (!Array.isArray(rawFormats)) {
    return [];
  }

  let formats = rawFormats
    .filter(f => f.vcodec !== 'none' || f.acodec !== 'none')
    .map(f => ({
      formatId: f.format_id,
      ext: f.ext,
      resolution: f.resolution || (f.width ? `${f.width}x${f.height}` : 'Audio Only'),
      filesize: f.filesize || f.filesize_approx || null,
      hasVideo: f.vcodec !== 'none',
      hasAudio: f.acodec !== 'none',
    }))
    .sort((a, b) => {
      const getRes = (resStr) => {
        if (!resStr || resStr === 'Audio Only') return 0;
        const match = resStr.match(/(\d+)x(\d+)/);
        if (match) return parseInt(match[1]) * parseInt(match[2]);
        return 0;
      };
      return getRes(b.resolution) - getRes(a.resolution);
    });

  formats = formats.filter((v, i, a) => a.findIndex(v2 => v2.resolution === v.resolution) === i);

  return formats;
};
