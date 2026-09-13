import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import VideoResults from './components/VideoResults';
import ErrorBanner from './components/ErrorBanner';
import LoadingSkeleton from './components/LoadingSkeleton';

const App = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [lastUrl, setLastUrl] = useState('');
  const [initialFormat, setInitialFormat] = useState('best'); // store format intent

  const handleFetchInfo = async (url, format) => {
    setIsLoading(true);
    setError('');
    setVideoData(null);
    setLastUrl(url);
    setInitialFormat(format);

    try {
      const response = await axios.post(`${API_BASE_URL}/info`, { url });
      setVideoData(response.data);
    } catch (err) {
      if (err.response?.data?.error) {
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
      <main className="flex-1 flex flex-col items-center justify-start pt-8 md:pt-14 pb-24 px-4 w-full max-w-2xl mx-auto">
        <Hero onFetch={handleFetchInfo} isLoading={isLoading} />
        
        <ErrorBanner message={error} />

        {isLoading && <LoadingSkeleton />}

        {!isLoading && videoData && (
          <VideoResults data={videoData} originalUrl={lastUrl} initialFormat={initialFormat} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-12 text-center text-text-secondary text-sm border-t border-border mt-auto">
        <p className="mb-2">Supported: YouTube, Instagram, Facebook, X, TikTok, Vimeo, Twitch, and more.</p>
        <p className="text-xs opacity-75">
          Disclaimer: This tool is for personal and educational use only.
        </p>
      </footer>
    </div>
  );
}

export default App;
