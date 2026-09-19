export const detectPlatform = (urlString) => {
  try {
    const hostname = new URL(urlString).hostname;
    if (hostname.includes('music.youtube.')) return 'youtubemusic';
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('snapchat.com')) return 'snapchat';
    if (hostname.includes('pinterest.') || hostname.includes('pin.it')) return 'pinterest';
    if (hostname.includes('threads.net') || hostname.includes('threads.com')) return 'threads';
    if (hostname.includes('linkedin.com') || hostname.includes('lnkd.in')) return 'linkedin';
    if (hostname.includes('spotify.com') || hostname.includes('spotify.link') || urlString.startsWith('spotify:')) return 'spotify';
    if (hostname.includes('music.apple.com') || hostname.includes('itunes.apple.com')) return 'applemusic';
    if (hostname.includes('soundcloud.com') || hostname === 'on.soundcloud.com') return 'soundcloud';
    return 'ytdlp';
  } catch {
    return 'ytdlp';
  }
};
