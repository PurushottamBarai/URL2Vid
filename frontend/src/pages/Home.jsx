import React, { useMemo } from 'react';
import { useVideoExtraction } from '../hooks/useVideoExtraction';

import Hero from '../components/Hero';
import VideoResults from '../components/VideoResults';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSkeleton from '../components/LoadingSkeleton';
import HowItWorks from '../components/HowItWorks';
import VideoGuide from '../components/VideoGuide';
import WhyChooseUs from '../components/WhyChooseUs';
import SupportedPlatforms from '../components/SupportedPlatforms';
import FAQ, { homeFaqs } from '../components/FAQ';

import SEO from '../components/SEO';

const HOME_TITLE = 'URL2Vid: Download Videos & Music from Any URL | Free Downloader';
const HOME_DESCRIPTION = 'Free online downloader for videos & music. Save from YouTube, Instagram, Facebook, Twitter (X), Spotify, Apple Music, SoundCloud & more — just paste a URL.';

const Home = () => {
  const {
    isLoading,
    error,
    videoData,
    lastUrl,
    initialFormat,
    handleFetchInfo,
  } = useVideoExtraction();

  const homeSchema = useMemo(() => {
    const webAppSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "URL2Vid",
      "description": HOME_DESCRIPTION,
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    };

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": homeFaqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    return [webAppSchema, faqSchema];
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center justify-start pt-8 md:pt-14 px-4 w-full mx-auto">
      <SEO 
        title={HOME_TITLE} 
        description={HOME_DESCRIPTION} 
        schema={homeSchema}
        canonicalPath="/" 
      />
      <div className="w-full max-w-2xl mx-auto">
        <Hero onFetch={handleFetchInfo} isLoading={isLoading} />
        <ErrorBanner message={error} />
        {isLoading && <LoadingSkeleton />}
        {!isLoading && videoData && (
          <VideoResults data={videoData} originalUrl={lastUrl} initialFormat={initialFormat} />
        )}
      </div>

      <HowItWorks />
      <VideoGuide />
      <WhyChooseUs />
      <SupportedPlatforms />
      <FAQ />
    </main>
  );
};

export default Home;
