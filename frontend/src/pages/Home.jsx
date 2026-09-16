import React from 'react';
import { useVideoExtraction } from '../hooks/useVideoExtraction';

import Hero from '../components/Hero';
import VideoResults from '../components/VideoResults';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSkeleton from '../components/LoadingSkeleton';
import HowItWorks from '../components/HowItWorks';
import WhyChooseUs from '../components/WhyChooseUs';
import SupportedPlatforms from '../components/SupportedPlatforms';
import FAQ from '../components/FAQ';

const Home = () => {
  const {
    isLoading,
    error,
    videoData,
    lastUrl,
    initialFormat,
    handleFetchInfo,
  } = useVideoExtraction();

  return (
    <main className="flex-1 flex flex-col items-center justify-start pt-8 md:pt-14 px-4 w-full mx-auto">
      <div className="w-full max-w-2xl mx-auto">
        <Hero onFetch={handleFetchInfo} isLoading={isLoading} />
        <ErrorBanner message={error} />
        {isLoading && <LoadingSkeleton />}
        {!isLoading && videoData && (
          <VideoResults data={videoData} originalUrl={lastUrl} initialFormat={initialFormat} />
        )}
      </div>

      <HowItWorks />
      <WhyChooseUs />
      <SupportedPlatforms />
      <FAQ />
    </main>
  );
};

export default Home;
