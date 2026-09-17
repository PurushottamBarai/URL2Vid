import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import VideoGuide from '../components/VideoGuide';
import HowItWorks from '../components/HowItWorks';
import FAQ from '../components/FAQ';

const USER_GUIDE_TITLE = 'User Guide: How to Download Videos with URL2Vid | Step-by-Step Tutorial';
const USER_GUIDE_DESCRIPTION = 'Watch our step-by-step video guide on how to download videos and audio from any supported social media platform with URL2Vid.';

export default function UserGuide() {
  return (
    <main className="flex-1 flex flex-col items-center justify-start pt-8 md:pt-14 px-4 w-full mx-auto">
      <SEO
        title={USER_GUIDE_TITLE}
        description={USER_GUIDE_DESCRIPTION}
        canonicalPath="/user-guide"
      />

      <div className="w-full max-w-3xl mx-auto text-center mb-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
          URL2Vid User Guide
        </h1>
        <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Learn how to extract and download high-quality videos and audio from YouTube, Instagram, Facebook, Reddit, and more in seconds.
        </p>
      </div>

      <VideoGuide />

      <div className="w-full max-w-3xl mx-auto my-6 text-center">
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold transition-colors shadow-sm cursor-pointer"
        >
          Go to Video Downloader
        </Link>
      </div>

      <HowItWorks />
      <FAQ />
    </main>
  );
}
