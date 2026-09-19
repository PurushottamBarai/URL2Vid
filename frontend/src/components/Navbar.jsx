import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, Download, Globe, Check } from 'lucide-react';
import { 
  SiYoutube, 
  SiInstagram, 
  SiFacebook, 
  SiX, 
  SiPinterest, 
  SiReddit, 
  SiSnapchat,
  SiThreads,
  SiSpotify,
  SiApplemusic,
  SiYoutubemusic,
} from 'react-icons/si';
import { FaLinkedin, FaSoundcloud } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

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

// Music platforms — dedicated landing pages
const musicPlatforms = [
  { name: 'Spotify', path: '/spotify-downloader', Icon: SiSpotify, color: 'text-[#1DB954]' },
  { name: 'Apple Music', path: '/apple-music-downloader', Icon: SiApplemusic, color: 'text-[#FC3C44]' },
  { name: 'YouTube Music', path: '/youtube-music-downloader', Icon: SiYoutubemusic, color: 'text-red-500' },
  { name: 'SoundCloud', path: '/soundcloud-downloader', Icon: FaSoundcloud, color: 'text-[#FF5500]' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlatformsOpen, setIsPlatformsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);
  const { t, currentLang, changeLanguage, languages } = useLanguage();
  const currentLangObj = languages.find((l) => l.code === currentLang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsPlatformsOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setIsLangOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPlatformsOpen(false);
        setIsLangOpen(false);
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
    setIsLangOpen(false);
  }, [location.pathname]);

  const handleScrollTo = (targetId, shouldFocusInput = false) => {
    setIsMenuOpen(false);
    setIsPlatformsOpen(false);
    setIsLangOpen(false);

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
          <Link
            to="/user-guide"
            className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          >
            {t('navVideoGuide')}
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsPlatformsOpen(!isPlatformsOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
              aria-expanded={isPlatformsOpen}
              aria-haspopup="true"
            >
              <span>{t('navPlatforms')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isPlatformsOpen ? 'rotate-180 text-accent' : ''}`} />
            </button>

            {isPlatformsOpen && (
              <div className="absolute top-full mt-2 -left-12 w-80 bg-surface border border-border shadow-xl rounded-2xl p-3 animate-fade-in z-50">
                {/* Video Platforms */}
                <div className="grid grid-cols-2 gap-1">
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

                {/* Music Platforms divider */}
                <div className="mt-2 pt-2 border-t border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-2 block mb-1.5">Music</span>
                  <div className="grid grid-cols-2 gap-1">
                    {musicPlatforms.map((p) => {
                      const Icon = p.Icon;
                      return (
                        <Link
                          key={p.name}
                          to={p.path}
                          onClick={() => setIsPlatformsOpen(false)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors w-full text-left"
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${p.color}`} />
                          <span className="truncate">{p.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => handleScrollTo('supported-platforms')}
            className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          >
            {t('navSupportedSites')}
          </button>

          <button
            onClick={() => handleScrollTo('faq')}
            className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          >
            {t('navFaq')}
          </button>

          <Link
            to="/contact"
            className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface border border-border/60 transition-colors cursor-pointer"
              aria-expanded={isLangOpen}
              aria-haspopup="true"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span>{currentLangObj?.short || 'EN'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isLangOpen ? 'rotate-180 text-accent' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 max-h-72 overflow-y-auto bg-surface border border-border shadow-xl rounded-xl p-1.5 flex flex-col gap-0.5 animate-fade-in z-50">
                {languages.map((lang) => {
                  const isSelected = lang.code === currentLang;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-accent/10 text-accent font-semibold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] opacity-60 w-5">{lang.short}</span>
                        <span>{lang.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => handleScrollTo('video-url-input', true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('navPasteUrl')}</span>
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
            <span>{t('navPasteDownload')}</span>
          </button>

          <Link
            to="/user-guide"
            onClick={() => setIsMenuOpen(false)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface block"
          >
            {t('navVideoGuide')}
          </Link>

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
            <div className="mt-2 pt-2 border-t border-border/60">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1 block mb-1">Music</span>
              <div className="grid grid-cols-2 gap-1">
                {musicPlatforms.map((p) => {
                  const Icon = p.Icon;
                  return (
                    <Link
                      key={p.name}
                      to={p.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface w-full text-left"
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${p.color}`} />
                      <span className="truncate">{p.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleScrollTo('supported-platforms')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface"
          >
            {t('navSupportedSites')}
          </button>

          <button
            onClick={() => handleScrollTo('faq')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface"
          >
            {t('navFaq')}
          </button>

          <Link
            to="/contact"
            onClick={() => setIsMenuOpen(false)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface block"
          >
            Contact
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
