const supportedDomains = [
  'youtube.com', 'youtu.be',
  'instagram.com',
  'facebook.com', 'fb.watch',
  'twitter.com', 'x.com',
  'tiktok.com'
];

const isValidUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    return supportedDomains.some(domain => url.hostname.includes(domain));
  } catch (e) {
    return false;
  }
};

module.exports = {
  isValidUrl
};
