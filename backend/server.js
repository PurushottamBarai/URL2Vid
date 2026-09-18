import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

import rateLimiter from './middlewares/rateLimiter.js';
import errorHandler from './middlewares/errorHandler.js';
import infoRoutes from './routes/infoRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const updateYtDlpBinary = async () => {
  try {
    const isWin = process.platform === 'win32';
    const assetName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
    const targetPath = path.join(os.tmpdir(), assetName);
    const nightlyUrl = `https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/${assetName}`;
    const stableUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${assetName}`;

    process.stdout.write(`[yt-dlp] Downloading latest nightly binary to ${targetPath}...\n`);

    let binaryRes = await fetch(nightlyUrl, {
      headers: { 'User-Agent': 'URL2Vid/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(60000),
    });

    if (!binaryRes.ok) {
      process.stdout.write(`[yt-dlp] Nightly build download returned HTTP ${binaryRes.status}, falling back to stable...\n`);
      binaryRes = await fetch(stableUrl, {
        headers: { 'User-Agent': 'URL2Vid/1.0' },
        redirect: 'follow',
        signal: AbortSignal.timeout(60000),
      });
    }

    if (!binaryRes.ok) throw new Error(`Binary download failed: HTTP ${binaryRes.status}`);

    const buffer = await binaryRes.arrayBuffer();
    fs.writeFileSync(targetPath, Buffer.from(buffer));
    fs.chmodSync(targetPath, 0o755);

    process.env.YTDLP_CUSTOM_BINARY = targetPath;
    process.stdout.write(`[yt-dlp] Updated binary at ${targetPath} (${buffer.byteLength} bytes)\n`);
  } catch (err) {
    process.stderr.write(`[yt-dlp] Binary update failed (proceeding with default binary): ${err.message}\n`);
  }
};

await updateYtDlpBinary();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://url2vid.onrender.com',
  'https://url2vid.codedeck.me',
];

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
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
      'frame-src': [
        "'self'",
        'https://www.youtube.com',
        'https://www.youtube-nocookie.com',
        'https://v2.y2jar.cc',
        'https://challenges.cloudflare.com',
      ],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.set('trust proxy', 1);
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
