export const detectPlatform = (url) => {
  if (url.includes('snapchat.com')) return 'snapchat';
  if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
  if (url.includes('threads.com') || url.includes('threads.net')) return 'threads';
  if (url.includes('linkedin.com') || url.includes('lnkd.in')) return 'linkedin';
  return 'ytdlp';
};
