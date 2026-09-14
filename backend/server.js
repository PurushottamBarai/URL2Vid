import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import rateLimiter from './middlewares/rateLimiter.js';
import errorHandler from './middlewares/errorHandler.js';
import infoRoutes from './routes/infoRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const updateYtDlpBinary = async () => {
  try {
    const require = createRequire(import.meta.url);
    const { YOUTUBE_DL_PATH, YOUTUBE_DL_PLATFORM } = require('yt-dlp-exec/src/constants');

    if (!YOUTUBE_DL_PATH) {
      process.stderr.write('[yt-dlp] Binary path not found, skipping update\n');
      return;
    }

    if (YOUTUBE_DL_PLATFORM === 'win32') {
      process.stdout.write('[yt-dlp] Windows dev environment — skipping forced download\n');
      return;
    }

    process.stdout.write('[yt-dlp] Fetching latest nightly release info from GitHub...\n');
    const releaseRes = await fetch('https://api.github.com/repos/yt-dlp/yt-dlp-nightly-builds/releases/latest', {
      headers: { 'User-Agent': 'URL2Vid/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!releaseRes.ok) throw new Error(`GitHub API returned HTTP ${releaseRes.status}`);

    const release = await releaseRes.json();
    const asset = release.assets?.find(a => a.name === 'yt-dlp');

    if (!asset) throw new Error('yt-dlp Linux binary not found in release assets');

    process.stdout.write(`[yt-dlp] Downloading ${release.tag_name}...\n`);

    const binaryRes = await fetch(asset.browser_download_url, {
      headers: { 'User-Agent': 'URL2Vid/1.0' },
      signal: AbortSignal.timeout(60000),
    });

    if (!binaryRes.ok) throw new Error(`Binary download failed: HTTP ${binaryRes.status}`);

    const buffer = await binaryRes.arrayBuffer();
    fs.writeFileSync(YOUTUBE_DL_PATH, Buffer.from(buffer));
    fs.chmodSync(YOUTUBE_DL_PATH, 0o755);

    process.stdout.write(`[yt-dlp] Updated to ${release.tag_name}\n`);
  } catch (err) {
    process.stderr.write(`[yt-dlp] Update failed (proceeding with existing binary): ${err.message}\n`);
  }
};

await updateYtDlpBinary();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'https://url2vid.onrender.com'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'img-src': ["'self'", 'https:', 'data:', 'blob:'],
      'media-src': ["'self'", 'https:', 'data:', 'blob:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '10kb' }));
app.use(rateLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/info', infoRoutes);
app.use('/api/download', downloadRoutes);

const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));
app.use((_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  process.stdout.write(`[server] Running on port ${PORT}\n`);
});

const shutdown = (signal) => {
  process.stdout.write(`[server] ${signal} received — shutting down gracefully\n`);
  server.close(() => {
    process.stdout.write('[server] Closed all connections\n');
    process.exit(0);
  });
  setTimeout(() => {
    process.stderr.write('[server] Forced shutdown after timeout\n');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
