import React from 'react';
import { Link } from 'react-router-dom';
import { SiYoutube, SiInstagram, SiFacebook, SiX, SiPinterest, SiReddit, SiSnapchat, SiThreads, SiVimeo, SiTwitch } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa';

const platformIcons = [
  { name: 'YouTube', text: 'YouTube (Videos & Shorts)', path: '/youtube-video-downloader', Icon: SiYoutube, activeColor: 'group-hover:text-[#FF0000]' },
  { name: 'Instagram', text: 'Instagram (Posts & Reels)', path: '/instagram-reel-downloader', Icon: SiInstagram, activeColor: 'group-hover:text-[#E1306C]' },
  { name: 'Facebook', text: 'Facebook (Videos & Reels)', path: '/facebook-video-downloader', Icon: SiFacebook, activeColor: 'group-hover:text-[#1877F2]' },
  { name: 'X', text: 'X/Twitter', path: '/twitter-video-downloader', Icon: SiX, activeColor: 'group-hover:text-[#000000]' },
  { name: 'Pinterest', text: 'Pinterest', path: '/pinterest-video-downloader', Icon: SiPinterest, activeColor: 'group-hover:text-[#E60023]' },
  { name: 'Reddit', text: 'Reddit', path: '/reddit-video-downloader', Icon: SiReddit, activeColor: 'group-hover:text-[#FF4500]' },
  { name: 'LinkedIn', text: 'LinkedIn', path: '/linkedin-video-downloader', Icon: FaLinkedin, activeColor: 'group-hover:text-[#0A66C2]' },
  { name: 'Snapchat', text: 'Snapchat Spotlight', path: '/snapchat-video-downloader', Icon: SiSnapchat, activeColor: 'group-hover:text-[#FFFC00]' },
  { name: 'Threads', text: 'Threads', path: '/threads-video-downloader', Icon: SiThreads, activeColor: 'group-hover:text-[#000000]' },
  { name: 'Vimeo', text: 'Vimeo', path: '/vimeo-video-downloader', Icon: SiVimeo, activeColor: 'group-hover:text-[#1AB7EA]' },
  { name: 'Twitch', text: 'Twitch (Clips)', path: '/twitch-clip-downloader', Icon: SiTwitch, activeColor: 'group-hover:text-[#9146FF]' },
  { name: 'Dailymotion', text: 'Dailymotion', path: '/dailymotion-video-downloader', isText: true, activeColor: 'group-hover:text-[#0066DC]' },
];

const SupportedPlatforms = () => {
  const handlePlatformClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    setTimeout(() => {
      const input = document.getElementById('video-url-input');
      if (input) input.focus();
    }, 200);
  };

  return (
    <section id="supported-platforms" className="w-full max-w-4xl mx-auto py-12 px-4 border-t border-border">
      <h2 className="text-3xl font-bold text-text-primary text-center mb-10">Supported Platforms</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {platformIcons.map((platform) => (
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
    </section>
  );
};

export default SupportedPlatforms;
