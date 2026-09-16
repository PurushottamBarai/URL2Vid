# URL2Vid
> Download videos and audio from any supported social or media platform instantly.

URL2Vid is a simple and efficient web application that takes a video URL and generates a direct, downloadable MP4 (video) or MP3 (audio) file, saving you from navigating spammy or ad-filled alternatives.

## Tech Stack
- **Frontend:** React, JavaScript, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express
- **Core Libraries:** `yt-dlp-exec` (extraction), `fluent-ffmpeg` (processing)

## Features
- **Multi-Platform Support:** Extract media from over a dozen major social and video networks.
- **Format Choices:** Download as a standard MP4 video, a muted MP4 video, or extract only the MP3 audio.
- **Fast Extraction:** Bypasses heavy browser automation by utilizing direct core extractors and smart fallbacks.
- **Modern, Ad-Free UI:** Clean, responsive interface built with React and Tailwind CSS.

## Supported Platforms
- YouTube (Videos & Shorts)
- Instagram (Posts & Reels)
- Facebook (Videos & Reels)
- X (Twitter)
- Reddit
- LinkedIn
- Snapchat Spotlight
- Threads
- Pinterest
- Vimeo
- Twitch (Clips)
- Dailymotion
- Rumble

## Installation / Setup

### Prerequisites
- Node.js installed
- **FFmpeg** installed and added to your system's PATH

### 1. Clone the repository
```bash
git clone https://github.com/PurushottamBarai/URL2Vid.git
cd URL2Vid
```

### 2. Backend Setup
```bash
cd backend
npm install
# (Optional) Create .env file if using proxy or custom port
npm start
```

#### Environment Variables (Backend `.env` / Render Dashboard):
- `PORT` (default: `3001`): Backend server port.
- `YTDLP_PROXY` (optional): HTTP/SOCKS5 proxy URL (e.g. `http://user:pass@host:port`) to route media extraction through residential/proxy servers.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Running Tests
Run the test suite against your local backend or production API:
```bash
# Test local backend (http://localhost:3001)
node test_urls.mjs

# Test production deployment
API_URL=https://url2vid.onrender.com node test_urls.mjs
```

## Usage
1. Make sure both your backend (`http://localhost:3001`) and frontend (`http://localhost:5173`) servers are running.
2. Open the frontend in your browser.
3. Paste a supported video URL into the input field.
4. Select your preferred format (Video MP4, Audio MP3, or Mute MP4).
5. Click **Extract** and wait a few seconds.
6. Click the generated download button to save the file.

## Folder Structure
- `/frontend` — React SPA built with Vite containing all UI components and styling.
- `/backend` — Node/Express API responsible for parsing URLs, running `yt-dlp`, processing with `ffmpeg`, and streaming the files.

## Disclaimer
This project is built strictly for personal, educational, and fair-use archiving purposes. Users are responsible for ensuring their downloads respect the copyright laws and Terms of Service of the respective platforms.

## Contributing
Contributions, bug reports, and pull requests are welcome.

