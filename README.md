# URL2Vid
> Download videos and audio from any supported social or media platform instantly.

URL2Vid is a high-performance, ad-free web application that takes any media link and provides direct, downloadable MP4 (video) or MP3 (audio) streams with exact file sizes and quality options.

## Tech Stack
- **Frontend:** React 18, JavaScript, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express
- **Core Libraries:** `yt-dlp-exec` (extraction), `fluent-ffmpeg` & `ffmpeg-static` (processing & conversion)

## Features
- **Multi-Platform Support:** Extract media from 12+ major platforms including YouTube, Instagram, Facebook, X (Twitter), Reddit, LinkedIn, Snapchat, Pinterest, Threads, Vimeo, Twitch, and Dailymotion.
- **Accurate File Sizes:** View estimated/exact file sizes directly beside each resolution and quality option in the dropdown before downloading.
- **Multiple Audio Bitrate Tiers:** Convert any video to MP3 in selectable bitrates (192 kbps, 320 kbps, 128 kbps, 96 kbps).
- **True Muted Video (No Sound):** Strips all audio tracks using fast FFmpeg stream-copy (`-an -c:v copy`) with zero re-encoding time or quality degradation.
- **Zero-Proxy Architecture:** High reliability without costly residential proxies, utilizing distributed multi-instance resolvers and specialized scrapers.
- **Embedded Media Resolution:** Automatically resolves shortlinks (e.g. Reddit `/s/` links, Pinterest short pins) and shared video embeds.
- **Modern, Ad-Free UI:** Clean, responsive dark-mode interface built with React and Tailwind CSS.

## Supported Platforms
- YouTube (Videos, Shorts, & Live)
- Instagram (Posts & Reels)
- Facebook (Videos & Reels)
- X (Twitter)
- Reddit (Native & Embedded)
- LinkedIn (Feed & Video Posts)
- Snapchat (Spotlight)
- Threads (Video Posts)
- Pinterest (Pins & Idea Pins)
- Vimeo
- Twitch (Clips)
- Dailymotion

## Installation / Setup

### Prerequisites
- Node.js (v18 or newer)
*(FFmpeg is automatically managed via `ffmpeg-static`—no manual system installation required).*

### 1. Clone the repository
```bash
git clone https://github.com/PurushottamBarai/URL2Vid.git
cd URL2Vid
```

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```

#### Environment Variables (Backend `.env` / Render Dashboard):
- `PORT` (default: `3001`): Backend server port.

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
API_URL=https://url2vid.codedeck.me node test_urls.mjs
```

## Usage
1. Ensure both your backend (`http://localhost:3001`) and frontend (`http://localhost:5173`) servers are running.
2. Open the frontend in your browser.
3. Paste a supported media URL into the input field.
4. Select your preferred format: **Video (MP4)**, **Audio (MP3)**, or **Video (No Sound)**.
5. Click **Extract** to inspect the video details, duration, and available qualities.
6. Choose your desired quality from the dropdown (with file sizes displayed).
7. Click **Download file** to save the media immediately.

## Folder Structure
- `/frontend` — React SPA built with Vite containing all UI components, prerender scripts, and styling.
- `/backend` — Express API responsible for parsing URLs, running `yt-dlp`, specialized scrapers, multi-instance YouTube resolution, FFmpeg audio conversion, and streaming.

## Disclaimer
This project is built strictly for personal, educational, and fair-use archiving purposes. Users are responsible for ensuring their downloads respect copyright laws and the Terms of Service of the respective platforms.

## Contributing
Contributions, bug reports, and pull requests are welcome.
