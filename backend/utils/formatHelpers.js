export const processVideoFormats = (rawFormats, duration) => {
  if (!Array.isArray(rawFormats)) {
    return [];
  }

  const estimateBitrateForRes = (width, height, resStr) => {
    const h = height || (resStr?.match(/(\d+)p/)?.[1] ? parseInt(resStr.match(/(\d+)p/)[1], 10) : 0);
    if (h >= 1080) return 4000;
    if (h >= 720) return 2200;
    if (h >= 480) return 1200;
    if (h >= 360) return 650;
    return 400;
  };

  // Find top audio track to account for audio size when video tracks are video-only
  const audioTrack = rawFormats.find(
    (f) => f.vcodec === 'none' && f.acodec !== 'none' && (f.filesize || f.tbr)
  );
  const audioBitrateKbps = audioTrack?.tbr || audioTrack?.abr || 128;
  const audioFilesize = audioTrack?.filesize || (duration && duration > 0 ? Math.round((audioBitrateKbps * 1000 * duration) / 8) : 0);

  let formats = rawFormats
    .filter((f) => f.vcodec !== 'none' || f.acodec !== 'none')
    .map((f) => {
      let filesize = f.filesize || f.filesize_approx || null;
      if (!filesize && duration && duration > 0) {
        const bitrateKbps =
          f.tbr || (f.vbr || 0) + (f.abr || 0) || estimateBitrateForRes(f.width, f.height, f.resolution);
        if (bitrateKbps && bitrateKbps > 0) {
          filesize = Math.round((bitrateKbps * 1000 * duration) / 8);
        }
      }

      const hasVideo = f.vcodec !== 'none';
      const hasAudio = f.acodec !== 'none';

      // If video format is video-only (needs audio muxed), add audio size so estimate matches downloaded file
      if (hasVideo && !hasAudio && filesize && audioFilesize > 0) {
        filesize += audioFilesize;
      }

      let resolution = f.resolution || (f.width ? `${f.width}x${f.height}` : null);
      if (!resolution) {
        if (hasVideo) {
          resolution =
            f.format_note ||
            (String(f.format_id).toLowerCase() === 'sd'
              ? 'Standard Quality (SD)'
              : String(f.format_id).toLowerCase() === 'hd'
                ? 'High Quality (HD)'
                : 'Standard Video');
        } else {
          resolution = 'Audio Only';
        }
      }

      return {
        formatId: f.format_id,
        ext: f.ext,
        resolution,
        filesize,
        hasVideo,
        hasAudio,
      };
    })
    .sort((a, b) => {
      const getRes = (resStr) => {
        if (!resStr || resStr === 'Audio Only') return 0;
        const match = resStr.match(/(\d+)x(\d+)/);
        if (match) return parseInt(match[1], 10) * parseInt(match[2], 10);
        const pMatch = resStr.match(/(\d+)p/);
        if (pMatch) return parseInt(pMatch[1], 10) * parseInt(pMatch[1], 10) * 1.77;
        if (/hd/i.test(resStr)) return 1280 * 720;
        if (/sd/i.test(resStr)) return 640 * 480;
        return 1;
      };
      return getRes(b.resolution) - getRes(a.resolution);
    });

  formats = formats.filter((v, i, a) => a.findIndex((v2) => v2.resolution === v.resolution) === i);

  // Proportional scaling for any format that still lacks filesize if at least one video format has it
  const refFormat = formats.find(f => f.filesize && f.hasVideo);
  if (refFormat && refFormat.filesize) {
    const refPixels = (resStr) => {
      const m = resStr?.match(/(\d+)x(\d+)/);
      if (m) return parseInt(m[1], 10) * parseInt(m[2], 10);
      const p = resStr?.match(/(\d+)p/);
      if (p) return parseInt(p[1], 10) * parseInt(p[1], 10) * 1.77;
      return 1;
    };
    const refP = refPixels(refFormat.resolution);
    formats.forEach(f => {
      if (!f.filesize && f.hasVideo) {
        const p = refPixels(f.resolution);
        if (p && refP) {
          const scaleFactor = Math.sqrt(p / refP);
          f.filesize = Math.round(refFormat.filesize * scaleFactor);
        }
      }
    });
  }

  return formats;
};

