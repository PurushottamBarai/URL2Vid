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

          <footer className="w-full py-12 text-center text-text-secondary text-sm border-t border-border mt-auto">
            <p className="mb-2">Supported: YouTube, Instagram, Facebook, X, Vimeo, Twitch, and more.</p>
            <p className="text-xs opacity-75">
              Disclaimer: This tool is for personal and educational use only.
            </p>
          </footer>
        </div>
      </Router>
    </LanguageProvider>
  );
};

export default App;
