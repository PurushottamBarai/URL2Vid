import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

/**
 * Dedicated fallback service for Snapchat Spotlight videos.
 * Snapchat's aggressive bot protection and dynamic DOM often breaks yt-dlp extraction.
 * This directly fetches the HTML and parses the OpenGraph metadata for the raw MP4 URL.
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

export const fetchVideoInfo = async (url) => {
  try {
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) {
      throw new Error(`Failed to fetch Snapchat page: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    const videoUrlMatch = html.match(/<meta[^>]*property="og:video(:secure_url)?"[^>]*content="([^"]+)"/);
    const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
    const thumbnailMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
    
    if (!videoUrlMatch) {
      throw new Error('Couldn\'t extract this Snapchat video — the platform may have changed its page structure.');
    }
    
    const videoUrl = videoUrlMatch[2].replace(/&amp;/g, '&');
    const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'") : 'Snapchat Spotlight Video';
    const thumbnail = thumbnailMatch ? thumbnailMatch[1].replace(/&amp;/g, '&') : null;
    
    // Match the payload shape of yt-dlp so infoController doesn't crash
    return {
      title,
      thumbnail,
      duration: null, // Snapchat OG tags don't expose duration easily
      formats: [
        {
          format_id: 'best',
          ext: 'mp4',
          url: videoUrl,
          acodec: 'mp4a.40.2', // Dummy values to pass validation
          vcodec: 'avc1.4d401e',
          resolution: '720p',
        }
      ]
    };
  } catch (error) {
    console.error('Snapchat Extraction Error:', error);
    throw new Error('Couldn\'t extract this Snapchat video — the platform may have changed its page structure.');
  }
};

export const downloadVideo = (url, type) => {
  return new Promise(async (resolve, reject) => {
    try {
      const info = await fetchVideoInfo(url);
      const rawMp4Url = info.formats[0].url;
      
      const tmpDir = path.resolve('tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      const filePath = path.join(tmpDir, `snapchat_${crypto.randomUUID()}.mp4`);
      const fileStream = fs.createWriteStream(filePath);
      
      https.get(rawMp4Url, { headers: HEADERS }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          https.get(response.headers.location, { headers: HEADERS }, (res2) => {
            res2.pipe(fileStream);
            fileStream.on('finish', () => resolve(filePath));
            fileStream.on('error', reject);
          }).on('error', reject);
        } else {
          response.pipe(fileStream);
          fileStream.on('finish', () => resolve(filePath));
          fileStream.on('error', reject);
        }
      }).on('error', reject);
      
    } catch (error) {
      console.error('Snapchat Download Error:', error);
      reject(error);
    }
  });
};
