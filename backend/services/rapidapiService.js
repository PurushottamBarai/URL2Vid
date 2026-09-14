import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import stream from 'stream';

const pipeline = promisify(stream.pipeline);

const fetchVideoInfo = async (url) => {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY is missing from environment variables');
  }

  let normalizedUrl = url;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([^"&?\/\s]{11})/);
    if (match && match[1]) {
      normalizedUrl = `https://www.youtube.com/watch?v=${match[1]}`;
    }
  }

  const apiUrl = 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com',
      'x-rapidapi-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: normalizedUrl }),
    timeout: 30000
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RapidAPI returned HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`RapidAPI Error: API returned error flag true for url ${url}`);
  }

  const title = data.title || 'Video';
  const thumbnail = data.thumbnail || '';
  
  let duration = null;
  if (data.duration) {
    duration = data.duration > 1000 ? Math.floor(data.duration / 1000) : data.duration;
  }

  const rawMedias = data.medias || [];
  
  const formats = rawMedias.map((m, i) => {
    const isAudio = m.type === 'audio' || m.quality === 'audio';
    return {
      format_id: m.quality || `format-${i}`,
      format_note: m.quality || (isAudio ? 'Audio Only' : 'Video'),
      ext: m.extension || (isAudio ? 'mp3' : 'mp4'),
      url: m.url,
      vcodec: isAudio ? 'none' : 'h264',
      acodec: isAudio ? 'mp3' : 'aac',
      resolution: m.quality || (isAudio ? 'Audio Only' : 'Unknown'),
    };
  }).filter(f => f.url);

  if (formats.length === 0 && data.url) {
    formats.push({
      format_id: 'best',
      format_note: 'Best Video',
      ext: 'mp4',
      url: data.url,
      vcodec: 'h264',
      acodec: 'aac'
    });
  }

  return {
    title,
    thumbnail,
    duration,
    formats
  };
};

const downloadVideo = async (url, formatId) => {
  const info = await fetchVideoInfo(url);
  
  let downloadUrl;
  if (formatId) {
    const format = info.formats.find(f => f.format_id === formatId);
    if (format) downloadUrl = format.url;
  }
  
  if (!downloadUrl) {
    const videoFormats = info.formats.filter(f => f.vcodec !== 'none');
    const bestFormat = videoFormats.length > 0 ? videoFormats[0] : info.formats[0];
    downloadUrl = bestFormat.url;
  }

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video from RapidAPI URL: HTTP ${response.status}`);
  }

  return response.body;
};

export default {
  fetchVideoInfo,
  downloadVideo
};
