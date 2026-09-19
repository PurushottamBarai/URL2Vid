import React from 'react';
import { Link } from 'react-router-dom';
import { SiYoutube, SiInstagram, SiFacebook, SiX, SiPinterest, SiReddit, SiSnapchat, SiThreads, SiVimeo, SiTwitch, SiSpotify, SiApplemusic, SiYoutubemusic } from 'react-icons/si';
import { FaLinkedin, FaSoundcloud } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const videoPlatforms = [
  { name: 'YouTube', text: 'YouTube (Videos & Shorts)', path: '/youtube-video-downloader', Icon: SiYoutube, activeColor: 'group-hover:text-[#FF0000]' },
  { name: 'Instagram', text: 'Instagram (Posts & Reels)', path: '/instagram-reel-downloader', Icon: SiInstagram, activeColor: 'group-hover:text-[#E1306C]' },
  { name: 'Facebook', text: 'Facebook (Videos & Reels)', path: '/facebook-video-downloader', Icon: SiFacebook, activeColor: 'group-hover:text-[#1877F2]' },
  { name: 'X', text: 'X / Twitter', path: '/twitter-video-downloader', Icon: SiX, activeColor: 'group-hover:text-[#000000]' },
  { name: 'Pinterest', text: 'Pinterest', path: '/pinterest-video-downloader', Icon: SiPinterest, activeColor: 'group-hover:text-[#E60023]' },
  { name: 'Reddit', text: 'Reddit', path: '/reddit-video-downloader', Icon: SiReddit, activeColor: 'group-hover:text-[#FF4500]' },
  { name: 'LinkedIn', text: 'LinkedIn', path: '/linkedin-video-downloader', Icon: FaLinkedin, activeColor: 'group-hover:text-[#0A66C2]' },
  { name: 'Snapchat', text: 'Snapchat Spotlight', path: '/snapchat-video-downloader', Icon: SiSnapchat, activeColor: 'group-hover:text-[#FFFC00]' },
  { name: 'Threads', text: 'Threads', path: '/threads-video-downloader', Icon: SiThreads, activeColor: 'group-hover:text-[#000000]' },
  { name: 'Vimeo', text: 'Vimeo', path: '/vimeo-video-downloader', Icon: SiVimeo, activeColor: 'group-hover:text-[#1AB7EA]' },
  { name: 'Twitch', text: 'Twitch (Clips)', path: '/twitch-clip-downloader', Icon: SiTwitch, activeColor: 'group-hover:text-[#9146FF]' },
  { name: 'Dailymotion', text: 'Dailymotion', path: '/dailymotion-video-downloader', isText: true, activeColor: 'group-hover:text-[#0066DC]' },
];

const musicPlatforms = [
  { name: 'Spotify', text: 'Spotify', path: '/spotify-downloader', Icon: SiSpotify, activeColor: 'group-hover:text-[#1DB954]' },
  { name: 'Apple Music', text: 'Apple Music', path: '/apple-music-downloader', Icon: SiApplemusic, activeColor: 'group-hover:text-[#FC3C44]' },
  { name: 'YouTube Music', text: 'YouTube Music', path: '/youtube-music-downloader', Icon: SiYoutubemusic, activeColor: 'group-hover:text-[#FF0000]' },
  { name: 'SoundCloud', text: 'SoundCloud', path: '/soundcloud-downloader', Icon: FaSoundcloud, activeColor: 'group-hover:text-[#FF5500]' },
];

const SupportedPlatforms = () => {
  const { t } = useLanguage();

  const handlePlatformClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    setTimeout(() => {
      const input = document.getElementById('video-url-input');
      if (input) input.focus();
    }, 200);
  };

  return (
    <section id="supported-platforms" className="w-full max-w-4xl mx-auto py-12 px-4 border-t border-border">
      <h2 className="text-3xl font-bold text-text-primary text-center mb-10">{t('supportedPlatformsTitle', 'Supported Platforms')}</h2>
      
      {/* Video Platforms */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {videoPlatforms.map((platform) => (
          <Link 
            key={platform.name}
            to={platform.path}
            onClick={handlePlatformClick}
            className="group flex flex-col items-center justify-center gap-3 p-4 bg-surface border border-border rounded-xl transition-all hover:border-accent hover:shadow-sm"
          >
            {platform.isText ? (
              <span 
                aria-hidden="true" 
                className={`text-3xl font-bold text-text-secondary transition-colors ${platform.activeColor}`}
              >
                d
              </span>
            ) : (
              <platform.Icon 
                aria-hidden="true" 
                className={`w-8 h-8 text-text-secondary transition-colors ${platform.activeColor}`} 
              />
            )}
            <span className="text-sm font-medium text-text-primary text-center">
              {platform.text}
            </span>
          </Link>
        ))}
      </div>

      {/* Music Platforms */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-text-secondary text-center mb-6 flex items-center justify-center gap-3">
          <span className="h-px flex-1 bg-border max-w-24" />
          <span>{t('musicPlatformsTitle', 'Music Platforms')}</span>
          <span className="h-px flex-1 bg-border max-w-24" />
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {musicPlatforms.map((platform) => (
            <Link
              key={platform.name}
              to={platform.path}
              onClick={handlePlatformClick}
              className="group flex flex-col items-center justify-center gap-3 p-4 bg-surface border border-border rounded-xl transition-all hover:border-accent hover:shadow-sm cursor-pointer w-full"
            >
              <platform.Icon
                aria-hidden="true"
                className={`w-8 h-8 text-text-secondary transition-colors ${platform.activeColor}`}
              />
              <span className="text-sm font-medium text-text-primary text-center">
                {platform.text}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportedPlatforms;
