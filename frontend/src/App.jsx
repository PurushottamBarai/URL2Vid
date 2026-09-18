import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import LoadingSkeleton from './components/LoadingSkeleton';
import { platformsData } from './data/platforms';
import { LanguageProvider } from './context/LanguageContext';

const Home = lazy(() => import('./pages/Home'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PlatformLanding = lazy(() => import('./pages/PlatformLanding'));
const UserGuide = lazy(() => import('./pages/UserGuide'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      const input = document.getElementById('video-url-input');
      if (input) input.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <LanguageProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col font-sans">
          <Navbar />
          
          <Suspense fallback={<div className="flex-1 flex items-center justify-center pt-14"><LoadingSkeleton /></div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              
              {platformsData.map((platform) => (
                <Route 
                  key={platform.path} 
                  path={platform.path} 
                  element={<PlatformLanding {...platform} />} 
                />
              ))}
              
              <Route path="/user-guide" element={<UserGuide />} />
              <Route path="/guide" element={<Navigate to="/user-guide" replace />} />
              <Route path="/x-video-downloader" element={<Navigate to="/twitter-video-downloader" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          <footer className="w-full border-t border-border mt-auto bg-surface/50">
            <div className="max-w-5xl mx-auto px-4 py-10">
              {/* Platform links grid */}
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary text-center mb-5">Supported Platforms</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2.5 text-center">
                  {/* Video platforms */}
                  {[
                    { label: 'YouTube Downloader', to: '/youtube-video-downloader' },
                    { label: 'Instagram Downloader', to: '/instagram-reel-downloader' },
                    { label: 'Facebook Downloader', to: '/facebook-video-downloader' },
                    { label: 'X / Twitter Downloader', to: '/twitter-video-downloader' },
                    { label: 'Pinterest Downloader', to: '/pinterest-video-downloader' },
                    { label: 'Reddit Downloader', to: '/reddit-video-downloader' },
                    { label: 'LinkedIn Downloader', to: '/linkedin-video-downloader' },
                    { label: 'Snapchat Downloader', to: '/snapchat-video-downloader' },
                    { label: 'Threads Downloader', to: '/threads-video-downloader' },
                    { label: 'Vimeo Downloader', to: '/vimeo-video-downloader' },
                    { label: 'Twitch Downloader', to: '/twitch-clip-downloader' },
                    { label: 'Dailymotion Downloader', to: '/dailymotion-video-downloader' },
                  ].map(({ label, to }) => (
                    <a
                      key={to}
                      href={to}
                      className="text-sm text-text-secondary hover:text-accent hover:underline transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                  {/* Music platforms — scroll to search */}
                  {[
                    'Spotify Downloader',
                    'YouTube Music Downloader',
                    'SoundCloud Downloader',
                    'Apple Music Downloader',
                  ].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setTimeout(() => {
                          const el = document.getElementById('video-url-input');
                          if (el) el.focus();
                        }, 300);
                      }}
                      className="text-sm text-text-secondary hover:text-accent hover:underline transition-colors cursor-pointer text-center"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom bar */}
              <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary opacity-75">
                <p>© {new Date().getFullYear()} URL2Vid. All rights reserved.</p>
                <p>For personal and educational use only.</p>
              </div>
            </div>
          </footer>

        </div>
      </Router>
    </LanguageProvider>
  );
};

export default App;
