import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../config';

/**
 * VideoResults takes the data returned by the backend and displays the video information,
 * thumbnails, formats, and handles the actual download triggers.
 * It receives 'data' (the API response object) and 'originalUrl' as props from App.jsx.
 */
const VideoResults = React.memo(({ data, originalUrl, initialFormat }) => {
  // Keeps track of which format (video/audio quality) the user has selected from the dropdown
  const [selectedFormat, setSelectedFormat] = useState(initialFormat || 'best');

  // If there's no data yet, render nothing (conditional rendering)
  if (!data) return null;

  /**
   * handleDownload builds a unique URL pointing to our backend's /api/download route.
   */
  const handleDownload = () => {
    // Construct the backend download endpoint URL
    const url = new URL(`${API_BASE_URL}/download`, window.location.origin);
    url.searchParams.append('url', originalUrl);
    
    // Add specific parameters based on what the user selected in the UI dropdown
    if (initialFormat === 'audio') {
      url.searchParams.append('type', 'audio');
    } else if (initialFormat === 'mute') {
      url.searchParams.append('type', 'mute');
      if (selectedFormat !== 'best') {
        url.searchParams.append('formatId', selectedFormat);
      }
    } else {
      url.searchParams.append('type', 'video');
      if (selectedFormat !== 'best') {
        url.searchParams.append('formatId', selectedFormat);
      }
    }
    
    // Create a temporary link element to trigger the browser's native download behavior
    const a = document.createElement('a');
    a.href = url.toString();
    a.download = '';
    document.body.appendChild(a);
    a.click(); // Trigger download
    document.body.removeChild(a); // Clean up
  };

  const getFormatLabel = (fmt) => {
    return `${fmt.resolution || 'Unknown'} ${fmt.ext ? `(.${fmt.ext})` : ''} ${fmt.filesize ? `— ${(fmt.filesize/(1024*1024)).toFixed(1)}MB` : ''}`;
  };

  return (
    <div className="w-full mt-4 animate-slide-up">
      <div className="card p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
        
        {/* Left Side: Thumbnail */}
        {data.thumbnail && (
          <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 relative overflow-hidden rounded-md bg-border/50">
            <img 
              src={data.thumbnail} 
              alt={data.title} 
              className="absolute inset-0 w-full h-full object-cover" 
            />
          </div>
        )}

        {/* Right Side: Details & Actions */}
        <div className="flex-1 w-full flex flex-col gap-5 py-1">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-text-primary text-xl font-bold line-clamp-2 leading-tight">
              {data.title || 'Extracted Video'}
            </h2>
            <p className="text-text-secondary font-mono text-sm">
              {data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : 'Unknown length'}
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
                <option value="best" className="bg-surface">Best Video (MP4)</option>
                {data.formats && data.formats.map((fmt) => {
                  const uniqueKey = fmt.formatId || fmt.url || Math.random().toString();
                  return (
                    <option key={uniqueKey} value={fmt.formatId} className="bg-surface">
                      {getFormatLabel(fmt)}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-4 text-lg rounded-md font-bold transition-colors border border-accent text-accent hover:bg-accent/10 focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-base outline-none active:scale-[0.98]"
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
