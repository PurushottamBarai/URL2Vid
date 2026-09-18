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
];

const isPrivateIp = (hostname) => {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '169.254.169.254'
  ) {
    return true;
  }

  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1, 5).map(Number);
    if (octets.some((o) => o > 255)) return true;
    if (octets[0] === 10) return true;
    if (octets[0] === 127) return true;
    if (octets[0] === 0) return true;
    if (octets[0] === 169 && octets[1] === 254) return true;
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    if (octets[0] === 192 && octets[1] === 168) return true;
  }

  if (hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80')) {
    return true;
  }

  return false;
};

export const checkUrlStatus = (urlString) => {
  try {
    const parsedUrl = new URL(urlString);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are supported.', platform: null };
    }

    if (isPrivateIp(parsedUrl.hostname)) {
      return { isValid: false, error: 'Access to private or local network addresses is forbidden.', platform: null };
    }

    if (parsedUrl.hostname.includes('spotify.com')) {
      return { isValid: false, error: 'Spotify links are not supported. We only extract from video platforms.', platform: null };
    }

    const match = urlPatterns.find((p) => p.regex.test(parsedUrl.href));
    if (match) {
      return { isValid: true, error: '', platform: match.name };
    }

    return { isValid: false, error: 'Please enter a valid, supported video URL.', platform: null };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL.', platform: null };
  }
};
