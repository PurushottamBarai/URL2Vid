import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Download } from 'lucide-react';
import { checkUrlStatus } from '../utils/urlValidation.js';
import { useLanguage } from '../context/LanguageContext';

const STATUS_MESSAGES = [
  "Fetching...",
  "Retrieving...",
  "Receiving data...",
  "Preparing transfer...",
  "Finalizing...",
];

const Hero = React.memo(({ onFetch, isLoading, customTitle, customSubtitle }) => {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [format, setFormat] = useState('best');
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setStatusIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [isLoading]);

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
          {customTitle || t('heroTitle')}
        </h1>
        <p className="hero-subtitle text-text-secondary max-w-2xl text-sm md:text-[16px] leading-relaxed">
          {customSubtitle || t('heroSubtitle')}
        </p>
      </div>
      
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <div className="w-full card p-8 flex flex-col justify-center overflow-hidden mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label 
                htmlFor="video-url-input"
                className="text-xs font-bold text-text-secondary tracking-widest uppercase mb-2 block"
              >
                {t('pasteUrlLabel')}
              </label>
              <input
                id="video-url-input"
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
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.target.select()}
              />
              {error && (
                <p role="alert" aria-live="polite" className="text-error text-sm font-medium mt-1">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <label htmlFor="format-select" className="sr-only">Choose Format</label>
              <select
                id="format-select"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="input-field w-2/5 sm:w-1/3 font-mono text-sm cursor-pointer font-medium"
                aria-label="Format selection"
              >
                <option value="best">{t('formatVideo')}</option>
                <option value="audio">{t('formatAudio')}</option>
                <option value="mute">{t('formatMute')}</option>
              </select>
              
              <button
                type="submit"
                disabled={isLoading || !url}
                className="btn-primary flex-1 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
                aria-label="Extract video"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin"></div>
                    <span className="text-base font-medium">{STATUS_MESSAGES[statusIndex]}</span>
                  </div>
                ) : (
                  <>
                    <Download className="w-5 h-5" aria-hidden="true" />
                    <span>{t('extract')}</span>
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
