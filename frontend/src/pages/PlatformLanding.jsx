import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useVideoExtraction } from '../hooks/useVideoExtraction';
import Hero from '../components/Hero';
import VideoResults from '../components/VideoResults';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSkeleton from '../components/LoadingSkeleton';
import SEO from '../components/SEO';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const PlatformLanding = ({ 
  path,
  platformName, 
  h1, 
  intro, 
  description,
  steps, 
  faqs, 
  metaTitle, 
  metaDescription,
  isMusic = false,
  defaultFormat,
}) => {
  const {
    isLoading,
    error,
    videoData,
    lastUrl,
    initialFormat,
    handleFetchInfo,
  } = useVideoExtraction();
  
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const combinedSchema = useMemo(() => {
    const webAppSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": `${platformName} Downloader - URL2Vid`,
      "description": metaDescription,
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
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    return [webAppSchema, faqSchema];
  }, [platformName, metaDescription, faqs]);

  return (
    <main className="flex-1 flex flex-col items-center justify-start pt-8 md:pt-14 px-4 w-full mx-auto">
      <SEO 
        title={metaTitle} 
        description={metaDescription} 
        schema={combinedSchema} 
        canonicalPath={path}
      />

      <div className="w-full max-w-2xl mx-auto">
        <Hero 
          onFetch={handleFetchInfo} 
          isLoading={isLoading} 
          customTitle={h1}
          customSubtitle={intro}
          defaultFormat={defaultFormat || (isMusic ? 'audio' : 'best')}
        />
        <ErrorBanner message={error} />
        {isLoading && <LoadingSkeleton />}
        {!isLoading && videoData && (
          <VideoResults data={videoData} originalUrl={lastUrl} initialFormat={initialFormat} />
        )}
      </div>

      <section className="w-full max-w-4xl mx-auto py-12 px-4 border-t border-border mt-8">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-6">How to download from {platformName}</h2>
        {description && (
          <div className="bg-surface border border-border rounded-xl p-6 sm:p-7 mb-10 text-text-secondary text-sm sm:text-base leading-relaxed shadow-sm">
            <p className="text-text-primary/90">{description}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-col items-center text-center p-6 bg-surface rounded-lg border border-border">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xl font-bold mb-4">{index + 1}</div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full max-w-4xl mx-auto py-12 px-4 border-t border-border mb-8">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-10">{platformName} Downloader FAQ</h2>
        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const panelId = `platform-faq-panel-${index}`;
            const btnId = `platform-faq-btn-${index}`;
            return (
              <div key={faq.question} className="border border-border rounded-lg bg-surface overflow-hidden transition-all">
                <button
                  id={btnId}
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaqIndex === index}
                  aria-controls={panelId}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:bg-base/50"
                >
                  <span className="font-semibold text-text-primary">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${openFaqIndex === index ? 'rotate-180' : ''}`} />
                </button>
                <div 
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className={`px-5 text-text-secondary text-sm overflow-hidden transition-all duration-200 ease-in-out ${openFaqIndex === index ? 'pb-5 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p>{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full max-w-4xl mx-auto py-8 px-4 border-t border-border text-center">
        <p className="text-sm text-text-secondary mb-4">Check out our other tools:</p>
        <div className="flex flex-wrap justify-center gap-4 text-accent text-sm font-medium">
          <Link to="/" className="hover:underline">All-in-One Downloader</Link>
          {platformName !== 'YouTube' && <Link to="/youtube-video-downloader" className="hover:underline">YouTube Downloader</Link>}
          {platformName !== 'Instagram' && <Link to="/instagram-reel-downloader" className="hover:underline">Instagram Downloader</Link>}
          {platformName !== 'Facebook' && <Link to="/facebook-video-downloader" className="hover:underline">Facebook Downloader</Link>}
        </div>
      </section>
    </main>
  );
};

PlatformLanding.propTypes = {
  platformName: PropTypes.string.isRequired,
  h1: PropTypes.string.isRequired,
  intro: PropTypes.string.isRequired,
  description: PropTypes.string,
  steps: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    desc: PropTypes.string.isRequired,
  })).isRequired,
  faqs: PropTypes.arrayOf(PropTypes.shape({
    question: PropTypes.string.isRequired,
    answer: PropTypes.string.isRequired,
  })).isRequired,
  metaTitle: PropTypes.string.isRequired,
  metaDescription: PropTypes.string.isRequired,
};

export default PlatformLanding;
