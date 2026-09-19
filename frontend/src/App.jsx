import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import LoadingSkeleton from './components/LoadingSkeleton';
import { platformsData } from './data/platforms';
import { LanguageProvider } from './context/LanguageContext';
import { trackEvent } from './utils/analytics';

const Home = lazy(() => import('./pages/Home'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PlatformLanding = lazy(() => import('./pages/PlatformLanding'));
const UserGuide = lazy(() => import('./pages/UserGuide'));
const Contact = lazy(() => import('./pages/Contact'));
const Feedback = lazy(() => import('./pages/Feedback'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    trackEvent('page_view', { page_path: pathname });
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
              <Route path="/contact" element={<Contact />} />
              <Route path="/feedback" element={<Feedback />} />
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
                  {/* Music platforms */}
                  {[
                    { label: 'Spotify Downloader', to: '/spotify-downloader' },
                    { label: 'Apple Music Downloader', to: '/apple-music-downloader' },
                    { label: 'YouTube Music Downloader', to: '/youtube-music-downloader' },
                    { label: 'SoundCloud Downloader', to: '/soundcloud-downloader' },
                  ].map(({ label, to }) => (
                    <a
                      key={to}
                      href={to}
                      className="text-sm text-text-secondary hover:text-accent hover:underline transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Bottom bar */}
              <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary opacity-75">
                <p>© {new Date().getFullYear()} URL2Vid. All rights reserved.</p>
                <div className="flex items-center gap-3">
                  <a href="/user-guide" className="hover:text-accent hover:underline">User Guide</a>
                  <span>•</span>
                  <a href="/contact" className="hover:text-accent hover:underline">Contact</a>
                  <span>•</span>
                  <a href="/feedback" className="hover:text-accent hover:underline">Feedback</a>
                  <span>•</span>
                  <p>For personal and educational use only.</p>
                </div>
              </div>
            </div>
          </footer>

        </div>
      </Router>
    </LanguageProvider>
  );
};

export default App;
