import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, Download } from 'lucide-react';
import { 
  SiYoutube, 
  SiInstagram, 
  SiFacebook, 
  SiX, 
  SiPinterest, 
  SiReddit, 
  SiSnapchat,
  SiThreads
} from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa';

const quickPlatforms = [
  { name: 'YouTube', path: '/youtube-video-downloader', Icon: SiYoutube, color: 'text-red-500' },
  { name: 'Instagram', path: '/instagram-reel-downloader', Icon: SiInstagram, color: 'text-pink-500' },
  { name: 'Facebook', path: '/facebook-video-downloader', Icon: SiFacebook, color: 'text-blue-600' },
  { name: 'X / Twitter', path: '/twitter-video-downloader', Icon: SiX, color: 'text-black' },
  { name: 'Pinterest', path: '/pinterest-video-downloader', Icon: SiPinterest, color: 'text-red-600' },
  { name: 'Reddit', path: '/reddit-video-downloader', Icon: SiReddit, color: 'text-orange-500' },
  { name: 'LinkedIn', path: '/linkedin-video-downloader', Icon: FaLinkedin, color: 'text-blue-500' },
  { name: 'Snapchat', path: '/snapchat-video-downloader', Icon: SiSnapchat, color: 'text-yellow-500' },
  { name: 'Threads', path: '/threads-video-downloader', Icon: SiThreads, color: 'text-black' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlatformsOpen, setIsPlatformsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsPlatformsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPlatformsOpen(false);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsPlatformsOpen(false);
  }, [location.pathname]);

  const handleScrollTo = (targetId, shouldFocusInput = false) => {
    setIsMenuOpen(false);
    setIsPlatformsOpen(false);

    const performScroll = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (shouldFocusInput) {
          setTimeout(() => el.focus(), 400);
        }
      }
    };

    if (location.pathname === '/') {
      performScroll();
    } else {
      navigate(`/#${targetId}`);
      setTimeout(performScroll, 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-base/90 border-b border-border transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" aria-label="URL2Vid Home">
          <div className="h-8 md:h-9 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="URL2Vid Logo" 
              width="140" 
              height="36" 
              className="h-full w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium">
          <button
            onClick={() => handleScrollTo('how-it-works')}
            className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          >
            How It Works
          </button>

          <button
            onClick={() => handleScrollTo('features')}
            className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          >
            Features
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsPlatformsOpen(!isPlatformsOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
              aria-expanded={isPlatformsOpen}
              aria-haspopup="true"
            >
              <span>Platforms</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isPlatformsOpen ? 'rotate-180 text-accent' : ''}`} />
            </button>

            {isPlatformsOpen && (
              <div className="absolute top-full mt-2 -left-12 w-80 bg-surface border border-border shadow-xl rounded-2xl p-3 grid grid-cols-2 gap-1 animate-fade-in z-50">
                {quickPlatforms.map((p) => {
                  const Icon = p.Icon;
                  return (
                    <Link
                      key={p.path}
                      to={p.path}
                      onClick={() => setIsPlatformsOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${p.color}`} />
                      <span className="truncate">{p.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => handleScrollTo('supported-platforms')}
            className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          >
            Supported Sites
          </button>

          <button
            onClick={() => handleScrollTo('faq')}
            className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleScrollTo('video-url-input', true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Paste URL</span>
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-base/95 backdrop-blur-md px-4 py-4 flex flex-col gap-2 animate-slide-down">
          <button
            onClick={() => handleScrollTo('video-url-input', true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 mb-2 rounded-lg bg-accent text-white text-sm font-semibold shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Paste & Download Video</span>
          </button>

          <button
            onClick={() => handleScrollTo('how-it-works')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface"
          >
            How It Works
          </button>

          <button
            onClick={() => handleScrollTo('features')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface"
          >
            Features
          </button>

          <div className="py-2 border-t border-b border-border/60 my-1">
            <span className="text-xs font-semibold text-text-secondary px-3 uppercase tracking-wider block mb-2">
              Popular Platforms
            </span>
            <div className="grid grid-cols-2 gap-1 px-1">
              {quickPlatforms.map((p) => {
                const Icon = p.Icon;
                return (
                  <Link
                    key={p.path}
                    to={p.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface"
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${p.color}`} />
                    <span className="truncate">{p.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => handleScrollTo('supported-platforms')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface"
          >
            Supported Sites
          </button>

          <button
            onClick={() => handleScrollTo('faq')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface"
          >
            FAQ
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
