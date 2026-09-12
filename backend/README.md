# URL2Vid - Backend

A lightweight Express.js API for fetching video metadata and streaming media downloads using `yt-dlp`.

## How to run
1. `npm install`
2. `npm start` (or `npm run dev` if you add nodemon)

## Environment Variables
- `PORT`: Port to run the server on (default: `3001`)
- Rate limiting is configured by default to 10 requests per minute per IP.

## API Endpoints
- `POST /api/info`: Fetches video metadata (title, thumbnail, duration) and available formats for a given URL.
- `GET /api/download`: Streams the requested media file directly to the client as an attachment.
