/**
 * Processes raw formats returned by yt-dlp to extract, map, and filter relevant media options.
 * yt-dlp often returns redundant DASH manifests, storyboards, or internal streams.
 * We filter for media streams, map them to a clean object, and sort by resolution.
 */
export const processVideoFormats = (rawFormats) => {
  if (!rawFormats || !Array.isArray(rawFormats)) {
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
    .filter(f => f.hasVideo)
    .sort((a, b) => {
      const getRes = (resStr) => {
        if (!resStr || resStr === 'Audio Only') return 0;
        const match = resStr.match(/(\d+)x(\d+)/);
        if (match) return parseInt(match[1]) * parseInt(match[2]);
        return 0;
      };
      return getRes(b.resolution) - getRes(a.resolution);
    });

  // Remove duplicate resolutions to present a clean, concise list to the user
  formats = formats.filter((v, i, a) => a.findIndex(v2 => v2.resolution === v.resolution) === i);

  return formats;
};
