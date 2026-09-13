# URL2Vid

> A powerful, fast, and free web application to extract and download videos from almost any URL.

URL2Vid takes a video URL and generates a direct, downloadable video or audio file. It dynamically extracts the media stream, processes it, and provides an instant way to save videos locally for offline viewing.

---

## ✨ Features

- **Universal Support**: Download videos from YouTube, Instagram, Facebook, TikTok, X (Twitter), Reddit, Pinterest, Snapchat Spotlight, Vimeo, Twitch, Rumble, Dailymotion, and more.
- **Smart Validation**: Instantly verifies URL format and platform before initiating downloads.
- **Format Options**: Choose between Video (MP4), Audio (MP3), or Muted Video (MP4).
- **Custom Scraping Fallbacks**: Built-in resilient scrapers (like a dedicated Snapchat Spotlight parser) for sites with heavy bot-protection.
- **Modern UI**: Clean, responsive, dark-mode optimized interface built with React, Tailwind CSS, and Lucide Icons.

---

## 🛠️ Tech Stack

- **Frontend**: React, JavaScript, Vite, Tailwind CSS, Lucide React, React Icons
- **Backend**: Node.js, Express, Axios
- **Core Libraries**: 
  - [`yt-dlp-exec`](https://github.com/przemyslawpluta/node-youtube-dl) (for core extraction)
  - [`fluent-ffmpeg`](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) (for audio extraction and video muting)

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **FFmpeg**: You MUST have FFmpeg installed on your system and available in your system's PATH.

### 1. Clone the repository
```bash
git clone https://github.com/PurushottamBarai/URL2Vid.git
cd URL2Vid
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
*Note: The backend runs on `http://localhost:3001`.*

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Note: The frontend runs on `http://localhost:5173`.*

---

## 🎮 Usage

1. Start both the frontend and backend development servers.
2. Open `http://localhost:5173` in your browser.
3. Paste a video URL (e.g., a YouTube video, Instagram Reel, or Facebook Reel) into the input field.
4. Select your desired format (Video, Audio, or Muted).
5. Click **Extract** and wait for the processing to finish.
6. Click the download button to save your file!

---

## 📁 Folder Structure

- `/frontend`: The React SPA (Single Page Application) built with Vite and Tailwind. Contains UI components, URL validation logic, and styling.
- `/backend`: The Express server. Contains extraction controllers, media processing services, format helpers, and custom fallback scrapers.

---

## 🤝 Contributing

Contributions, issues, and feature requests are always welcome! Feel free to check the [issues page](https://github.com/PurushottamBarai/URL2Vid/issues) if you want to contribute.

---

## ⚖️ Disclaimer
This tool is built for personal, educational, and fair-use archiving purposes only. Please respect the copyright of content creators.
