import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Download } from 'lucide-react';
import { SiYoutube, SiInstagram, SiFacebook, SiX, SiTiktok, SiPinterest, SiReddit, SiSnapchat, SiThreads } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa';
import { checkUrlStatus } from '../utils/urlValidation.js';

const platformIcons = [
  { name: 'YouTube', Icon: SiYoutube, activeColor: 'text-[#FF0000]' },
  { name: 'Instagram', Icon: SiInstagram, activeColor: 'text-[#E1306C]' },
  { name: 'Facebook', Icon: SiFacebook, activeColor: 'text-[#1877F2]' },
  { name: 'X', Icon: SiX, activeColor: 'text-[#000000]' },
  { name: 'TikTok', Icon: SiTiktok, activeColor: 'text-[#000000]' },
  { name: 'Pinterest', Icon: SiPinterest, activeColor: 'text-[#E60023]' },
  { name: 'Reddit', Icon: SiReddit, activeColor: 'text-[#FF4500]' },
  { name: 'LinkedIn', Icon: FaLinkedin, activeColor: 'text-[#0A66C2]' },
  { name: 'Snapchat', Icon: SiSnapchat, activeColor: 'text-[#FFFC00]' },
  { name: 'Threads', Icon: SiThreads, activeColor: 'text-[#000000]' },
];

const Hero = React.memo(({ onFetch, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [format, setFormat] = useState('best');

  const activePlatform = checkUrlStatus(url).platform;

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
          Download Video From URL
        </h1>
        <p className="text-text-secondary max-w-2xl text-[15px]">
          Free online video downloader — paste any URL from your favorite platforms.
        </p>
      </div>
      
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <div className="w-full card p-8 flex flex-col justify-center overflow-hidden">
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

      <div id="supported-platforms" className="flex flex-col items-center mt-12 mb-8 gap-4">
        <span className="text-sm font-semibold text-text-secondary">Supported platforms:</span>
        <div className="flex flex-wrap items-center justify-center gap-6 w-full max-w-2xl">
          {platformIcons.map((platform) => {
            const isActive = activePlatform === platform.name;
            return (
              <div 
                key={platform.name} 
                className="flex items-center justify-center transition-colors" 
                title={platform.name}
                aria-label={`Supported platform: ${platform.name}`}
              >
                {platform.isText ? (
                  <span className={`text-xl font-bold ${isActive ? platform.activeColor : 'text-text-secondary/60'}`}>
                    {platform.text}
                  </span>
                ) : (
                  <platform.Icon className={`w-6 h-6 transition-colors duration-300 ${isActive ? platform.activeColor : 'text-text-secondary/60'}`} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

Hero.displayName = 'Hero';

Hero.propTypes = {
  onFetch: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default Hero;
