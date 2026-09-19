const urlPatterns = [
  { name: 'YouTube', regex: /^(?:https?:\/\/)?(?:(?:www\.|m\.)?youtube\.com\/(?:watch\?|shorts\/|live\/|embed\/)|youtu\.be\/)/ },
  { name: 'Instagram', regex: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[^/?#]+\/)?(?:p|reel|reels|tv)\// },
  { name: 'Facebook', regex: /^(?:https?:\/\/)?(?:(?:www\.|m\.)?facebook\.com\/(?:.*\/videos\/|reel\/|reels\/|watch|share\/v\/|story\.php)|fb\.watch\/)/ },
  { name: 'X', regex: /^(?:https?:\/\/)?(?:(?:www\.|mobile\.)?(?:twitter\.com|x\.com))\/.*\/status\// },
  { name: 'Vimeo', regex: /^(?:https?:\/\/)?(?:(?:www\.|player\.)?vimeo\.com\/)(?:(?:channels|album|groups)\/[^/]+\/)?(?:video\/)?\d+/ },
  { name: 'Dailymotion', regex: /^(?:https?:\/\/)?(?:(?:www\.)?dailymotion\.com\/(?:video\/|embed\/video\/)|dai\.ly\/)/ },
  { name: 'Twitch', regex: /^(?:https?:\/\/)?(?:clips\.twitch\.tv\/|(?:www\.|m\.)?twitch\.tv\/.*\/clip\/)/ },
  { name: 'Reddit', regex: /^(?:https?:\/\/)?(?:(?:www\.|old\.)?reddit\.com\/r\/[^/]+\/(?:comments|s)\/|v\.redd\.it\/|redd\.it\/)/ },
  { name: 'LinkedIn', regex: /^(?:https?:\/\/)?(?:(?:www\.)?linkedin\.com\/(?:posts\/|feed\/update\/|video\/live\/)|lnkd\.in\/)/ },
  { name: 'Threads', regex: /^(?:https?:\/\/)?(?:www\.)?threads\.(?:com|net)\/@[^/?#]+\/post\// },
  { name: 'Snapchat', regex: /^(?:https?:\/\/)?(?:(?:www\.|story\.)?snapchat\.com\/(?:@[^/]+\/)?spotlight\/)/ },
  { name: 'Pinterest', regex: /^(?:https?:\/\/)?(?:(?:[\w-]+\.)?pinterest\.[a-z]+(?:\.[a-z]+)?\/(?:pin\/|ideas\/|[^/?#]+\/[^/?#]+\/)|pin\.it\/)/ },
  { name: 'Rumble', regex: /^(?:https?:\/\/)?(?:www\.)?rumble\.com\/(?:v\w[^/?#]*\.html|embed\/)/ },
  { name: 'Spotify', regex: /^(?:https?:\/\/)?(?:open\.spotify\.com\/(?:track|playlist|album|artist)\/|spotify\.link\/)/ },
  { name: 'Apple Music', regex: /^(?:https?:\/\/)?(?:music\.apple\.com|itunes\.apple\.com)\// },
  { name: 'YouTube Music', regex: /^(?:https?:\/\/)?music\.youtube\.com\/(?:watch\?|playlist\?)/ },
  { name: 'SoundCloud', regex: /^(?:https?:\/\/)?(?:(?:www\.|m\.)?soundcloud\.com\/|on\.soundcloud\.com\/)/ },
];

export const checkUrlStatus = (urlString) => {
  try {
    const url = new URL(urlString);

    const match = urlPatterns.find(p => p.regex.test(url.href));
    if (match) {
      return { isValid: true, error: '', platform: match.name };
    }

    return { isValid: false, error: 'Please enter a valid, supported video URL.', platform: null };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL.', platform: null };
  }
};
