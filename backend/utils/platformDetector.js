export const detectPlatform = (urlString) => {
  try {
    const hostname = new URL(urlString).hostname;
    if (hostname.includes('snapchat.com')) return 'snapchat';
    if (hostname.includes('pinterest.') || hostname.includes('pin.it')) return 'pinterest';
    if (hostname.includes('threads.net') || hostname.includes('threads.com')) return 'threads';
    if (hostname.includes('linkedin.com') || hostname.includes('lnkd.in')) return 'linkedin';
    return 'ytdlp';
  } catch {
    return 'ytdlp';
  }
};
