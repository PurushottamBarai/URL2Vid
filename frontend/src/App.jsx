import React, { useState } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import VideoResults from './components/VideoResults';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [lastUrl, setLastUrl] = useState('');

  const handleFetchInfo = async (url) => {
    setIsLoading(true);
    setError('');
    setVideoData(null);
    setLastUrl(url);

    try {
      const response = await axios.post('http://localhost:3001/api/info', { url });
      setVideoData(response.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to fetch video. Please check the URL and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start pt-8 md:pt-14 pb-24 px-4 w-full max-w-5xl mx-auto">
        <Hero onFetch={handleFetchInfo} isLoading={isLoading} />
        
        {/* Error State */}
        {error && (
          <div className="w-full max-w-4xl mt-6 p-4 rounded-xl bg-red-900/20 border border-red-800/50 text-red-400 text-center animate-slide-up shadow-sm">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="w-full max-w-4xl mt-8 card animate-pulse bg-[#121212] border-[#222]">
            <div className="flex flex-col sm:flex-row gap-6 p-2">
              <div className="w-full sm:w-48 h-28 bg-[#222] rounded-lg"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-[#222] rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#222] rounded"></div>
                  <div className="h-4 bg-[#222] rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && videoData && (
          <VideoResults data={videoData} originalUrl={lastUrl} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-gray-500 dark:text-gray-400 text-sm border-t border-gray-100 dark:border-gray-800 mt-auto">
        <p className="mb-2">Supported: YouTube, Instagram, Facebook, X, TikTok</p>
        <p className="max-w-xl mx-auto px-4 text-xs opacity-75">
          Disclaimer: This tool is for personal and educational use only. Do not download or distribute copyrighted content without explicit permission from the owner.
        </p>
      </footer>
    </div>
  );
}

export default App;
