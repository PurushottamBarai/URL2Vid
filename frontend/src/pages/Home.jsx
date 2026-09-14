import React, { useState, useCallback, useRef } from 'react';
import { fetchVideoInfoAPI } from '../services/api';

import Hero from '../components/Hero';
import VideoResults from '../components/VideoResults';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSkeleton from '../components/LoadingSkeleton';

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [lastUrl, setLastUrl] = useState('');
  const [initialFormat, setInitialFormat] = useState('best');

  const abortControllerRef = useRef(null);

  const handleFetchInfo = useCallback(async (url, format) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError('');
    setVideoData(null);
    setLastUrl(url);
    setInitialFormat(format);

    try {
      const data = await fetchVideoInfoAPI(url, abortControllerRef.current.signal);
      setVideoData(data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return;
      }
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to fetch video. Please check the URL and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center justify-start pt-8 md:pt-14 pb-24 px-4 w-full max-w-2xl mx-auto">
      <Hero onFetch={handleFetchInfo} isLoading={isLoading} />
      
      <ErrorBanner message={error} />

      {isLoading && <LoadingSkeleton />}

      {!isLoading && videoData && (
        <VideoResults data={videoData} originalUrl={lastUrl} initialFormat={initialFormat} />
      )}
    </main>
  );
};

export default Home;
