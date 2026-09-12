import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const VideoResults = ({ data, originalUrl }) => {
  const [selectedFormat, setSelectedFormat] = useState('best');

  if (!data) return null;

  const handleDownload = () => {
    const url = new URL('http://localhost:3001/api/download');
    url.searchParams.append('url', originalUrl);
    
    // If they picked an audio format or video format
    if (selectedFormat === 'audio') {
      url.searchParams.append('type', 'audio');
    } else {
      url.searchParams.append('type', 'video');
      if (selectedFormat !== 'best') {
        url.searchParams.append('formatId', selectedFormat);
      }
    }
    
    const a = document.createElement('a');
    a.href = url.toString();
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getFormatLabel = (fmt) => {
    return `${fmt.resolution || 'Unknown'} ${fmt.ext ? `(.${fmt.ext})` : ''} ${fmt.filesize ? `— ${(fmt.filesize/(1024*1024)).toFixed(1)}MB` : ''}`;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(originalUrl);
    alert('URL copied to clipboard!');
  };

  return (
    <div className="w-full mt-4 animate-slide-up">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Main Info & Download */}
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-900/50 bg-primary-900/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
            <span className="text-primary-400 text-xs font-bold tracking-widest">ANALYSIS COMPLETE</span>
          </div>

          <div className="mb-6">
            <h2 className="text-white text-xl font-bold line-clamp-2 mb-2 leading-snug">
              {data.title || 'Extracted Video'}
            </h2>
            <p className="text-[#a0a0a0] text-sm">{data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : 'Unknown length'}</p>
          </div>

          <div className="mb-8">
            <div className="w-full bg-[#121212] border border-[#222] rounded-lg px-4 py-3 text-sm text-[#666] truncate">
              {originalUrl}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[11px] font-bold text-[#666] tracking-widest uppercase mb-2 block">
              CHOOSE QUALITY
            </label>
            <div className="relative">
              <select 
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full appearance-none bg-[#0a0a0a] border border-[#333] text-white rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value="best" className="bg-[#1a1a1a]">Best available quality</option>
                {data.formats && data.formats.map((fmt, idx) => (
                  <option key={fmt.formatId || idx} value={fmt.formatId} className="bg-[#1a1a1a]">
                    {getFormatLabel(fmt)}
                  </option>
                ))}
                {data.audioAvailable && (
                  <option value="audio" className="bg-[#1a1a1a]">Audio Only (MP3)</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="btn-primary w-full py-4 text-lg mt-4"
          >
            Download file
          </button>
        </div>

        {/* Right Side: Quick Actions */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          
          <div>
            <label className="text-[11px] font-bold text-[#666] tracking-widest uppercase mb-3 block">
              YOUR SELECTION
            </label>
            <div className="bg-[#121212] border border-[#222] rounded-xl p-4">
              <h4 className="text-white font-bold text-sm mb-1">
                {selectedFormat === 'audio' ? 'Audio Only' : 'Video Media'}
              </h4>
              <p className="text-[#888] text-xs">
                {selectedFormat === 'audio' ? 'MP3 format' : 'MP4 format with sound'}
              </p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#666] tracking-widest uppercase mb-3 block">
              QUICK ACTIONS
            </label>
            <div className="flex flex-col gap-3">
              <button onClick={handleCopyUrl} className="w-full bg-[#121212] border border-[#222] hover:bg-[#1a1a1a] text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm text-left">
                Copy original URL
              </button>
              <button onClick={() => window.location.reload()} className="w-full bg-[#121212] border border-[#222] hover:bg-[#1a1a1a] text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm text-left text-primary-400">
                Download another video
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default VideoResults;
