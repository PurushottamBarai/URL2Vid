import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Download, Play, Pause, Music } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';

const formatDuration = (sec) => {
  if (!sec || isNaN(sec) || sec <= 0) return null;
  const s = Math.round(sec);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatBytes = (bytes, isEstimated = false) => {
  if (!bytes || isNaN(bytes) || bytes <= 0) return null;
  const mb = bytes / 1048576;
  const prefix = isEstimated ? '~' : '';
  if (mb >= 1000) return `${prefix}${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 1) return `${prefix}${mb.toFixed(1)} MB`;
  return `${prefix}${Math.round(bytes / 1024)} KB`;
};

const AUDIO_TIERS = [
  { id: '320k', label: 'MP3 (320 kbps)', bps: 40000 },
  { id: '256k', label: 'MP3 (256 kbps)', bps: 32000 },
  { id: '192k', label: 'MP3 (192 kbps)', bps: 24000 },
  { id: '128k', label: 'MP3 (128 kbps)', bps: 16000 },
];

const getAudioTierSize = (tier, durationSec, fallbackSize) => {
  if (durationSec && !isNaN(durationSec) && durationSec > 0) return Math.round(tier.bps * durationSec);
  if (fallbackSize && !isNaN(fallbackSize) && fallbackSize > 0) {
    const ratioMap = { '320k': 0.35, '256k': 0.28, '192k': 0.22, '128k': 0.15 };
    return Math.round(fallbackSize * (ratioMap[tier.id] || 0.2));
  }
  return null;
};

const formatLabel = (fmt, durationSec, topFilesize) => {
  let sizeBytes = fmt.filesize;
  if (!sizeBytes && durationSec && fmt.tbr) sizeBytes = Math.round((fmt.tbr * 1000 * durationSec) / 8);
  if (!sizeBytes && topFilesize) sizeBytes = topFilesize;
  const isEstimated = Boolean(fmt.isEstimated || (!fmt.filesize && sizeBytes));
  const sizeStr = formatBytes(sizeBytes, isEstimated);
  return `${fmt.resolution || 'Unknown'} ${fmt.ext ? `(.${fmt.ext})` : ''}${sizeStr ? ` - ${sizeStr}` : ''}`;
};

const VideoResults = React.memo(({ data, originalUrl, initialFormat = 'video' }) => {
  const { t } = useLanguage();
  const isAudio = initialFormat === 'audio' || data?.platform === 'spotify' || data?.platform === 'applemusic' || data?.platform === 'youtubemusic' || data?.platform === 'soundcloud';
  const [selectedFormat, setSelectedFormat] = useState(isAudio ? '192k' : 'best');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingTrackId, setDownloadingTrackId] = useState(null);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [downloadAllProgress, setDownloadAllProgress] = useState(null);

  const pollTimerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const downloadAllCancelRef = useRef(false);
  const downloadAllActiveRef = useRef(false);

  useEffect(() => { setSelectedFormat(isAudio ? '192k' : 'best'); }, [isAudio]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
      downloadAllCancelRef.current = true;
    };
  }, []);

  if (!data) return null;

  const isCollection = Boolean(data.isCollection && Array.isArray(data.tracks) && data.tracks.length > 0);

  const topVideoFormat = useMemo(() => {
    if (!data.formats || !Array.isArray(data.formats)) return null;
    return data.formats.find((f) => f.filesize && f.hasVideo) || data.formats[0];
  }, [data.formats]);

  const availableVideoFormats = useMemo(() => {
    if (!data.formats || !Array.isArray(data.formats)) return [];
    return data.formats.filter((fmt) => fmt.hasVideo !== false);
  }, [data.formats]);

  const formattedDuration = useMemo(() => formatDuration(data.duration), [data.duration]);

  const audioOptions = useMemo(() => {
    const fallbackSize = topVideoFormat?.filesize || null;
    return AUDIO_TIERS.map((tier) => {
      const bytes = getAudioTierSize(tier, data.duration, fallbackSize);
      const sizeStr = formatBytes(bytes);
      return { ...tier, bytes, sizeStr, displayLabel: `${tier.label}${sizeStr ? ` - ${sizeStr}` : ''}` };
    });
  }, [data.duration, topVideoFormat]);

  const defaultVideoOptionLabel = useMemo(() => {
    const topSize = topVideoFormat?.filesize;
    const isEstimated = Boolean(topVideoFormat?.isEstimated);
    const sizeStr = topVideoFormat?.sizeLabel || (topSize ? formatBytes(topSize, isEstimated) : '');
    const metaStr = sizeStr ? ` - ${sizeStr}` : '';
    return initialFormat === 'mute' ? `Best Video (No Sound)${metaStr}` : `Best Video (MP4)${metaStr}`;
  }, [initialFormat, topVideoFormat]);

  const handleDownload = (trackItem = null) => {
    const isItem = Boolean(trackItem);
    if (isItem && downloadingTrackId) return;
    if (!isItem && isDownloading) return;
    if (isItem) setDownloadingTrackId(trackItem.id); else setIsDownloading(true);

    const downloadId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const url = new URL(`${API_BASE_URL}/download`, window.location.origin);
    const targetUrl = isItem ? (trackItem.downloadUrl || trackItem.searchQuery) : originalUrl;
    const targetTitle = isItem ? `${trackItem.artists} - ${trackItem.title}` : data.title;

    url.searchParams.set('url', targetUrl);
    url.searchParams.set('type', isAudio ? 'audio' : (initialFormat || 'video'));
    url.searchParams.set('downloadId', downloadId);
    if (targetTitle) url.searchParams.set('title', targetTitle);

    if (isAudio) {
      url.searchParams.set('bitrate', selectedFormat === 'best' ? '192k' : selectedFormat);
    } else {
      const targetFormatId = selectedFormat === 'best' ? topVideoFormat?.formatId : selectedFormat;
      if (targetFormatId && !['video', 'mute', 'best'].includes(targetFormatId)) {
        url.searchParams.set('formatId', targetFormatId);
      }
    }

    const link = document.createElement('a');
    link.href = url.toString(); link.download = '';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    const startTime = Date.now();
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/download/status?downloadId=${downloadId}`);
        const statusData = await res.json();
        if (statusData.status === 'started' || statusData.status === 'error' || Date.now() - startTime > 15000) {
          clearInterval(pollTimerRef.current); pollTimerRef.current = null;
          if (isItem) setDownloadingTrackId(null); else setIsDownloading(false);
        }
      } catch {
        if (Date.now() - startTime > 5000) {
          clearInterval(pollTimerRef.current); pollTimerRef.current = null;
          if (isItem) setDownloadingTrackId(null); else setIsDownloading(false);
        }
      }
    }, 400);
  };

  const handleDownloadAll = async () => {
    if (downloadAllActiveRef.current || !data.tracks?.length) return;
    downloadAllCancelRef.current = false;
    downloadAllActiveRef.current = true;
    const tracks = data.tracks;
    setDownloadAllProgress({ current: 0, total: tracks.length, cancelled: false });

    const fireDownload = (trackItem) => {
      const url = new URL(`${API_BASE_URL}/download`, window.location.origin);
      url.searchParams.set('url', trackItem.downloadUrl || trackItem.searchQuery);
      url.searchParams.set('type', 'audio');
      url.searchParams.set('title', `${trackItem.artists} - ${trackItem.title}`);
      url.searchParams.set('bitrate', selectedFormat === 'best' ? '192k' : selectedFormat);
      const link = document.createElement('a');
      link.href = url.toString(); link.download = '';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    for (let i = 0; i < tracks.length; i++) {
      if (downloadAllCancelRef.current) {
        setDownloadAllProgress((p) => ({ ...p, cancelled: true }));
        break;
      }
      setDownloadAllProgress({ current: i + 1, total: tracks.length, cancelled: false });
      fireDownload(tracks[i]);
      if (i < tracks.length - 1) await new Promise((res) => setTimeout(res, 1200));
    }

    downloadAllActiveRef.current = false;
    setTimeout(() => setDownloadAllProgress(null), 3000);
  };

  const handleCancelAll = () => { downloadAllCancelRef.current = true; };

  const handleTogglePreview = (trackItem) => {
    if (!trackItem.previewUrl) return;
    if (playingTrackId === trackItem.id) {
      if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
      setPlayingTrackId(null); return;
    }
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    const audio = new Audio(trackItem.previewUrl);
    audioPlayerRef.current = audio;
    setPlayingTrackId(trackItem.id);
    audio.play().catch(() => setPlayingTrackId(null));
    audio.onended = () => setPlayingTrackId(null);
  };

  return (
    <div className="w-full mt-4 animate-slide-up flex flex-col gap-4">
      <div className="card p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
        {data.thumbnail && (
          <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 relative overflow-hidden rounded-md bg-border/50">
            <img src={data.thumbnail} alt={data.title || 'Media thumbnail'} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 w-full flex flex-col justify-between gap-5 py-1">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {data.platform === 'spotify' && (
                <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Spotify {isCollection ? (data.spotifyType || 'Collection') : 'Audio'}
                </span>
              )}
              {data.platform === 'applemusic' && (
                <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Apple Music {isCollection ? (data.spotifyType || 'Collection') : 'Audio'}
                </span>
              )}
              {data.platform === 'youtubemusic' && (
                <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                  YouTube Music {isCollection ? (data.spotifyType || 'Collection') : 'Audio'}
                </span>
              )}
              {data.platform === 'soundcloud' && (
                <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  SoundCloud {isCollection ? (data.spotifyType || 'Collection') : 'Audio'}
                </span>
              )}
            </div>
            <h2 className="text-text-primary text-xl font-bold line-clamp-2 leading-tight">{data.title || 'Extracted Media'}</h2>
            <p className="text-text-secondary font-mono text-sm">
              {isCollection ? `${data.trackCount} tracks${formattedDuration ? ` - ${formattedDuration}` : ''}` : formattedDuration || t('readyToDownload', 'Ready to download')}
            </p>
          </div>
          {!isCollection && (
            <div className="flex flex-col gap-3">
              <div className="relative w-full">
                <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full appearance-none bg-surface border border-border text-text-primary rounded-md px-4 py-3 pr-10 focus:outline-none focus:border-accent font-mono text-sm cursor-pointer shadow-none"
                  aria-label="Select quality and format">
                  {isAudio ? audioOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-surface">{opt.displayLabel}</option>
                  )) : (
                    <>
                      <option value="best" className="bg-surface">{defaultVideoOptionLabel}</option>
                      {availableVideoFormats.map((fmt, idx) => (
                        <option key={fmt.formatId || fmt.url || `${fmt.resolution}-${fmt.ext}-${idx}`} value={fmt.formatId} className="bg-surface">
                          {formatLabel(fmt, data.duration, topVideoFormat?.filesize)}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
              <button onClick={() => handleDownload()} disabled={isDownloading}
                className="w-full py-4 text-lg rounded-md font-bold transition-colors border border-accent text-accent hover:bg-accent/10 focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-base outline-none active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                aria-label="Download file">
                {isDownloading ? <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div> : <><Download className="w-5 h-5" aria-hidden="true" /><span>{isAudio ? t('downloadMp3', 'Download MP3') : t('downloadVideo', 'Download Video')}</span></>}
              </button>
            </div>
          )}
        </div>
      </div>

      {isCollection && (
        <div className="card p-4 md:p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-border gap-3 flex-wrap">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <Music className="w-5 h-5 text-accent" />
              <span>{t('trackList', 'Track List')} ({data.tracks.length})</span>
            </h3>
            <div className="flex items-center gap-3">
              {downloadAllProgress ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {!downloadAllProgress.cancelled && downloadAllActiveRef.current && (
                      <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin flex-shrink-0" />
                    )}
                    <span className="text-xs font-mono text-text-secondary whitespace-nowrap">
                      {downloadAllProgress.cancelled
                        ? 'Cancelled'
                        : downloadAllActiveRef.current
                          ? `Downloading ${downloadAllProgress.current} / ${downloadAllProgress.total}`
                          : `Done — ${downloadAllProgress.total} tracks queued`}
                    </span>
                  </div>
                  {!downloadAllProgress.cancelled && downloadAllActiveRef.current && (
                    <button type="button" onClick={handleCancelAll}
                      className="px-2.5 py-1 rounded text-xs font-semibold border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <button type="button" id="download-all-btn" onClick={handleDownloadAll}
                  disabled={Boolean(downloadingTrackId) || isDownloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-accent text-accent hover:bg-accent/10 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Download all tracks sequentially">
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('downloadAll', 'Download All')}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col divide-y divide-border/60">
            {data.tracks.map((track) => {
              const isCurrentDownloading = downloadingTrackId === track.id;
              const isCurrentPlaying = playingTrackId === track.id;
              return (
                <div key={track.id || track.index} className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-surface-secondary/40 rounded transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-text-secondary font-mono text-sm w-6 text-right flex-shrink-0">{track.index}</span>
                    {track.previewUrl && (
                      <button type="button" onClick={() => handleTogglePreview(track)}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-primary hover:bg-accent/10 hover:border-accent transition-colors flex-shrink-0"
                        title={isCurrentPlaying ? 'Pause Preview' : 'Play 30s Preview'} aria-label={isCurrentPlaying ? 'Pause preview' : 'Play preview'}>
                        {isCurrentPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
                      </button>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-text-primary font-medium text-sm truncate">{track.title}</span>
                      {track.artists && <span className="text-text-secondary text-xs truncate">{track.artists}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {track.duration && <span className="text-text-secondary font-mono text-xs hidden sm:inline">{formatDuration(track.duration)}</span>}
                    <button type="button" onClick={() => handleDownload(track)}
                      disabled={Boolean(downloadingTrackId) || downloadAllActiveRef.current}
                      className="px-3 py-1.5 rounded text-xs font-semibold border border-accent text-accent hover:bg-accent/10 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Download ${track.title}`}>
                      {isCurrentDownloading
                        ? <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
                        : <><Download className="w-3.5 h-3.5" /><span>MP3</span></>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

VideoResults.displayName = 'VideoResults';

VideoResults.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string, duration: PropTypes.number, thumbnail: PropTypes.string,
    formats: PropTypes.arrayOf(PropTypes.object), platform: PropTypes.string,
    spotifyType: PropTypes.string, isCollection: PropTypes.bool,
    trackCount: PropTypes.number, tracks: PropTypes.arrayOf(PropTypes.object),
  }),
  originalUrl: PropTypes.string.isRequired,
  initialFormat: PropTypes.string,
};

export default VideoResults;
