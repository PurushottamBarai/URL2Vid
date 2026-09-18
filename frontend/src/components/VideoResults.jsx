import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Download } from 'lucide-react';
import { API_BASE_URL } from '../config';

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
  if (mb < 0.1) {
    return `${prefix}${Math.round(bytes / 1024)} KB`;
  }
  return `${prefix}${mb.toFixed(1)} MB`;
};

const AUDIO_TIERS = [
  { id: '192k', label: 'Best Audio (192 kbps MP3)', kbps: 192 },
  { id: '320k', label: 'High Quality (320 kbps MP3)', kbps: 320 },
  { id: '128k', label: 'Standard Quality (128 kbps MP3)', kbps: 128 },
  { id: '96k', label: 'Compact Quality (96 kbps MP3)', kbps: 96 },
];

const getAudioTierSize = (tier, duration, fallbackVideoSize) => {
  if (duration && duration > 0) {
    return Math.round((duration * tier.kbps * 1000) / 8);
  }
  if (fallbackVideoSize && fallbackVideoSize > 0) {
    return Math.round(fallbackVideoSize * 0.16 * (tier.kbps / 192));
  }
  return null;
};

const formatLabel = (fmt, durationSec, topFilesize) => {
  if (fmt.sizeLabel) {
    return `${fmt.resolution || 'Unknown'} ${fmt.ext ? `(.${fmt.ext})` : ''} • ${fmt.sizeLabel}`;
  }
  let sizeBytes = fmt.filesize;
  if (!sizeBytes && durationSec && fmt.tbr) {
    sizeBytes = Math.round((fmt.tbr * 1000 * durationSec) / 8);
  }
  if (!sizeBytes && topFilesize) {
    sizeBytes = topFilesize;
  }
  const isEstimated = Boolean(fmt.isEstimated || (!fmt.filesize && sizeBytes));
  const sizeStr = formatBytes(sizeBytes, isEstimated);
  return `${fmt.resolution || 'Unknown'} ${fmt.ext ? `(.${fmt.ext})` : ''}${sizeStr ? ` • ${sizeStr}` : ''}`;
};

const VideoResults = React.memo(({ data, originalUrl, initialFormat = 'video' }) => {
  const isAudio = initialFormat === 'audio';
  const [selectedFormat, setSelectedFormat] = useState(isAudio ? '192k' : 'best');
  const [isDownloading, setIsDownloading] = useState(false);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    setSelectedFormat(isAudio ? '192k' : 'best');
  }, [isAudio]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  if (!data) return null;

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
      return {
        ...tier,
        bytes,
        sizeStr,
        displayLabel: `${tier.label}${sizeStr ? ` • ${sizeStr}` : ''}`,
      };
    });
  }, [data.duration, topVideoFormat]);

  const defaultVideoOptionLabel = useMemo(() => {
    const topSize = topVideoFormat?.filesize;
    const isEstimated = Boolean(topVideoFormat?.isEstimated);
    const sizeStr = topVideoFormat?.sizeLabel || (topSize ? formatBytes(topSize, isEstimated) : '');
    const metaStr = sizeStr ? ` • ${sizeStr}` : '';

    if (initialFormat === 'mute') {
      return `Best Video (No Sound)${metaStr}`;
    }
    return `Best Video (MP4)${metaStr}`;
  }, [initialFormat, topVideoFormat]);

  const handleDownload = () => {
    if (isDownloading) return;
    setIsDownloading(true);

    const downloadId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const url = new URL(`${API_BASE_URL}/download`, window.location.origin);
    url.searchParams.set('url', originalUrl);
    url.searchParams.set('type', initialFormat || 'video');
    url.searchParams.set('downloadId', downloadId);

    if (isAudio) {
      const bitrate = selectedFormat === 'best' ? '192k' : selectedFormat;
      url.searchParams.set('bitrate', bitrate);
    } else {
      const targetFormatId = selectedFormat === 'best' ? topVideoFormat?.formatId : selectedFormat;
      if (targetFormatId && targetFormatId !== 'video' && targetFormatId !== 'mute' && targetFormatId !== 'best') {
        url.searchParams.set('formatId', targetFormatId);
      }
    }

    const link = document.createElement('a');
    link.href = url.toString();
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    const startTime = Date.now();
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/download/status?downloadId=${downloadId}`);
        const statusData = await res.json();
        if (statusData.status === 'started' || statusData.status === 'error' || Date.now() - startTime > 12000) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          setIsDownloading(false);
        }
      } catch {
        if (Date.now() - startTime > 4000) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          setIsDownloading(false);
        }
      }
    }, 300);
  };

  return (
    <div className="w-full mt-4 animate-slide-up">
      <div className="card p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
        {data.thumbnail && (
          <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 relative overflow-hidden rounded-md bg-border/50">
            <img
              src={data.thumbnail}
              alt={data.title || 'Video thumbnail'}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 w-full flex flex-col gap-5 py-1">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-text-primary text-xl font-bold line-clamp-2 leading-tight">
              {data.title || 'Extracted Video'}
            </h2>
            <p className="text-text-secondary font-mono text-sm">
              {formattedDuration || 'Ready to download'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full appearance-none bg-surface border border-border text-text-primary rounded-md px-4 py-3 pr-10 focus:outline-none focus:border-accent font-mono text-sm cursor-pointer shadow-none"
                aria-label="Select quality and format"
              >
                {isAudio ? (
                  audioOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-surface">
                      {opt.displayLabel}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="best" className="bg-surface">
                      {defaultVideoOptionLabel}
                    </option>
                    {availableVideoFormats.map((fmt, idx) => (
                      <option
                        key={fmt.formatId || fmt.url || `${fmt.resolution}-${fmt.ext}-${idx}`}
                        value={fmt.formatId}
                        className="bg-surface"
                      >
                        {formatLabel(fmt, data.duration, topVideoFormat?.filesize)}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-4 text-lg rounded-md font-bold transition-colors border border-accent text-accent hover:bg-accent/10 focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-base outline-none active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              aria-label="Download file"
            >
              {isDownloading ? (
                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Download className="w-5 h-5" aria-hidden="true" />
                  <span>Download file</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoResults.displayName = 'VideoResults';

VideoResults.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string,
    duration: PropTypes.number,
    thumbnail: PropTypes.string,
    formats: PropTypes.arrayOf(PropTypes.object),
  }),
  originalUrl: PropTypes.string.isRequired,
  initialFormat: PropTypes.string,
};

export default VideoResults;
