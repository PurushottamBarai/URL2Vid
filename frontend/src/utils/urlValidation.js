const urlPatterns = [
  { name: 'YouTube', regex: /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)/ },
  { name: 'Instagram', regex: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|reels)\// },
  { name: 'Facebook', regex: /^(?:https?:\/\/)?(?:www\.)?(?:facebook\.com\/(?:.*\/videos\/|reel\/|reels\/|watch)|fb\.watch\/)/ },
  { name: 'X', regex: /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/.*\/status\// },
  { name: 'TikTok', regex: /^(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@.*\/video\/|vm\.tiktok\.com\/)/ },
  { name: 'Vimeo', regex: /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/\d+/ },
  { name: 'Dailymotion', regex: /^(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\// },
  { name: 'Twitch', regex: /^(?:https?:\/\/)?(?:clips\.twitch\.tv\/|(?:www\.)?twitch\.tv\/.*\/clip\/)/ },
  { name: 'Reddit', regex: /^(?:https?:\/\/)?(?:www\.)?reddit\.com\/r\/[^\/]+\/(?:comments|s)\// },
  { name: 'LinkedIn', regex: /^(?:https?:\/\/)?(?:(?:www\.)?linkedin\.com\/(?:posts|feed\/update)\/|lnkd\.in\/)/ },
  { name: 'Threads', regex: /^(?:https?:\/\/)?(?:www\.)?threads\.(?:com|net)\/.*\/post\// },
  { name: 'Snapchat', regex: /^(?:https?:\/\/)?(?:www\.)?snapchat\.com\/(?:@[^\/]+\/)?spotlight\// },
  { name: 'Pinterest', regex: /^(?:https?:\/\/)?(?:(?:www\.|[\w-]+\.)?pinterest\.com\/(?:pin\/|ideas\/|[^\/]+\/[^\/]+\/)|pin\.it\/)/ },
  { name: 'Rumble', regex: /^(?:https?:\/\/)?(?:www\.)?rumble\.com\/.*\.html/ }
];

export const checkUrlStatus = (urlString) => {
  try {
    const url = new URL(urlString);
    
    if (url.hostname.includes('spotify.com')) {
      return { isValid: false, error: 'Spotify links are not supported. We only extract from video platforms.', platform: null };
    }

    const match = urlPatterns.find(p => p.regex.test(url.href));
    if (match) {
      return { isValid: true, error: '', platform: match.name };
    }
    
    return { 
      isValid: false, 
      error: 'Please enter a valid, supported video URL.',
      platform: null
    };
  } catch (e) {
    return { isValid: false, error: 'Please enter a valid URL.', platform: null };
  }
};
