import React, { useState } from 'react';
import { Video, ChevronDown, MonitorPlay, Film, Image as ImageIcon, Smartphone, Download } from 'lucide-react';

const Hero = ({ onFetch, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onFetch(url.trim());
    }
  };

  const platformIcons = [
    { name: 'YouTube', icon: <MonitorPlay className="w-5 h-5 text-red-500" /> },
    { name: 'Facebook', icon: <Film className="w-5 h-5 text-blue-500" /> },
    { name: 'Twitch', icon: <Video className="w-5 h-5 text-purple-500" /> },
    { name: 'Reddit', icon: <ImageIcon className="w-5 h-5 text-orange-500" /> },
    { name: 'Instagram', icon: <ImageIcon className="w-5 h-5 text-pink-500" /> },
    { name: 'TikTok', icon: <Smartphone className="w-5 h-5 text-pink-500" /> },
    { name: 'VK', icon: <Video className="w-5 h-5 text-blue-400" /> },
    { name: 'X', icon: <span className="text-lg font-bold">X</span> },
  ];

  return (
    <div className="flex flex-col items-center w-full animate-slide-up">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Download Video From URL
        </h1>
        <p className="text-[#a0a0a0] max-w-2xl text-[15px]">
          Free online video downloader — paste any URL from your favorite platforms.
        </p>
      </div>
      
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* Main Card */}
        <div className="w-full card flex flex-col md:flex-row gap-8 !p-0 overflow-hidden">
          {/* Left Column */}
          <div className="flex-1 p-6 flex flex-col justify-center">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary-900/30 border border-primary-900/50 flex items-center justify-center text-primary-500 flex-shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white mb-1">Paste a URL to download</h2>
                <p className="text-[#888] text-sm">Paste a video/playlist URL using URL2Vid's extractor.</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="url"
                placeholder="Paste video or playlist URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="input-field"
              />
              <button
                type="submit"
                disabled={isLoading || !url}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          {/* Right Column */}
          <div className="w-full md:w-72 bg-[#0a0a0a] border-l border-[#222] p-6 flex flex-col gap-4">
            <label className="text-[11px] font-bold text-[#666] tracking-widest uppercase">
              Download Preferences
            </label>
            <div className="relative">
              <select className="w-full appearance-none bg-[#121212] border border-[#333] text-white rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-primary-500 cursor-pointer text-sm">
                <option>Video + Audio</option>
                <option>Video Only</option>
                <option>Audio Only</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <div className="flex flex-col gap-3 mt-2 border border-[#333] rounded-lg p-4 bg-[#121212]/50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded bg-[#222] border-[#444] text-primary-500 focus:ring-primary-500 focus:ring-offset-[#121212]" />
                <span className="text-[#888] text-sm">Include subtitles</span>
              </label>
              
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#666] text-xs">Language</span>
                <div className="relative flex-1">
                  <select className="w-full appearance-none bg-[#0a0a0a] border border-[#333] text-white rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-primary-500 cursor-pointer text-sm">
                    <option>English</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="supported-platforms" className="flex flex-col items-center mt-12 mb-8 gap-4">
        <span className="text-sm font-semibold text-[#a0a0a0]">Supported platforms:</span>
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-2xl">
          {platformIcons.map((platform, idx) => (
            <div key={idx} className="w-12 h-12 rounded-xl bg-[#121212] border border-[#222] hover:bg-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer hover:border-primary-500/50" title={platform.name}>
              {platform.icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
