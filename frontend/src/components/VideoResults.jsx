import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../config';

const formatDuration = (sec) => {
  if (!sec) return 'Unknown length';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

const formatLabel = (fmt) => {
  const size = fmt.filesize ? ` — ${(fmt.filesize / 1048576).toFixed(1)}MB` : '';
  return `${fmt.resolution || 'Unknown'} ${fmt.ext ? `(.${fmt.ext})` : ''}${size}`;
};

const VideoResults = React.memo(({ data, originalUrl, initialFormat = 'video' }) => {
  const [selectedFormat, setSelectedFormat] = useState(initialFormat || 'best');

  if (!data) return null;

  const availableFormats = useMemo(() => {
    if (!data.formats) return [];
    return data.formats.filter((fmt) =>
      initialFormat === 'audio' ? !fmt.hasVideo : fmt.hasVideo
    );
  }, [data.formats, initialFormat]);

  const defaultOptionLabel = 
    initialFormat === 'audio' 
      ? 'Best Audio (MP3)' 
      : initialFormat === 'mute' 
        ? 'Best Video (No Sound)' 
        : 'Best Video (MP4)';

  const handleDownload = () => {
    const url = new URL(`${API_BASE_URL}/download`, window.location.origin);
    url.searchParams.set('url', originalUrl);
    url.searchParams.set('type', initialFormat || 'video');
    if (selectedFormat !== 'best') {
      url.searchParams.set('formatId', selectedFormat);
    }

    const link = document.createElement('a');
    link.href = url.toString();
    link.download = '';
    link.click();
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
              {formatDuration(data.duration)}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full appearance-none bg-surface border border-border text-text-primary rounded-md px-4 py-3 pr-10 focus:outline-none focus:border-accent font-mono text-sm cursor-pointer shadow-none"
                aria-label="Select format"
              >
                <option value={initialFormat || 'best'} className="bg-surface">
                  {defaultOptionLabel}
                </option>
                {availableFormats.map((fmt, idx) => (
                  <option
                    key={fmt.formatId || fmt.url || `${fmt.resolution}-${fmt.ext}-${idx}`}
                    value={fmt.formatId}
                    className="bg-surface"
                  >
                    {formatLabel(fmt)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-4 text-lg rounded-md font-bold transition-colors border border-accent text-accent hover:bg-accent/10 focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-base outline-none active:scale-[0.98] cursor-pointer"
            >
              Download file
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
