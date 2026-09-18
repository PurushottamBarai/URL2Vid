import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchVideoInfoAPI } from '../services/api';

export const useVideoExtraction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [lastUrl, setLastUrl] = useState('');
  const [initialFormat, setInitialFormat] = useState('best');

  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

      const serverError = err.response?.data?.error;
      const rawErrorText = `${serverError || ''} ${err.message || ''}`;
      const isYouTube = /youtube\.com|youtu\.be/i.test(url);


      if (
        isYouTube &&
        (serverError || /Command failed|exit code|yt-dlp|bot|sign in/i.test(rawErrorText) || (err.response && err.response.status >= 400))
      ) {
        setError(
          'We are unable to fulfill the request for YouTube right now. Please retry after some time, or try our other supported platforms.'
        );
      } else if (/Command failed|exit code|\/tmp\/|yt-dlp|spawn/i.test(rawErrorText)) {
        setError('Unable to process this video URL at the moment. Please check the link and retry, or try another video.');
      } else if (serverError) {
        setError(serverError);
      } else if (err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the extraction server. Please check your internet connection and try again.');
      } else {
        setError('Failed to fetch video. Please check the URL and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    videoData,
    lastUrl,
    initialFormat,
    handleFetchInfo,
  };
};

export default useVideoExtraction;
