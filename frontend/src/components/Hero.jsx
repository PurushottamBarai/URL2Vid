import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Download } from 'lucide-react';
import { checkUrlStatus } from '../utils/urlValidation.js';

const Hero = React.memo(({ onFetch, isLoading, customTitle, customSubtitle }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [format, setFormat] = useState('best');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const trimmed = url.trim();
    if (trimmed) {
      const { isValid, error: validationError } = checkUrlStatus(trimmed);
      if (isValid) {
        onFetch(trimmed, format);
      } else {
        setError(validationError);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full animate-slide-up">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 tracking-tight">
          {customTitle || 'Download Video From URL'}
        </h1>
        <p className="text-text-secondary max-w-2xl text-[15px]">
          {customSubtitle || 'Free online video downloader — paste any URL from your favorite platforms.'}
        </p>
      </div>
      
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <div className="w-full card p-8 flex flex-col justify-center overflow-hidden mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-text-secondary tracking-widest uppercase mb-2 block">
                Paste Video URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                required
                className="input-field"
                aria-label="Video URL input"
              />
              {error && <p className="text-error text-sm font-medium mt-1">{error}</p>}
            </div>

            <div className="flex gap-3">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="input-field w-[35%] font-mono text-sm cursor-pointer font-medium"
                aria-label="Format selection"
              >
                <option value="best">Video (MP4)</option>
                <option value="audio">Audio (MP3)</option>
                <option value="mute">Mute Video (MP4)</option>
              </select>
              
              <button
                type="submit"
                disabled={isLoading || !url}
                className="btn-primary flex-1 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                aria-label="Extract video"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Extract</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

Hero.displayName = 'Hero';

Hero.propTypes = {
  onFetch: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  customTitle: PropTypes.string,
  customSubtitle: PropTypes.string,
};

export default Hero;
