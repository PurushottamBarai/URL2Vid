import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync, execFileSync } from 'child_process';

import rateLimiter from './middlewares/rateLimiter.js';
import errorHandler from './middlewares/errorHandler.js';
import infoRoutes from './routes/infoRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const findImpersonateBinary = () => {
  try {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const pyScript = [
      'import sys, os, pathlib, shutil',
      'paths = [',
      '    shutil.which("yt-dlp"),',
      '    os.path.join(sys.prefix, "bin", "yt-dlp"),',
      '    os.path.join(sys.prefix, "Scripts", "yt-dlp.exe"),',
      '    os.path.join(str(pathlib.Path.home()), ".local", "bin", "yt-dlp")',
      ']',
      'found = [p for p in paths if p and os.path.exists(p)]',
      'print(found[0] if found else "")',
    ].join('\n');

    const binary = execFileSync(pythonCmd, ['-c', pyScript], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (binary && fs.existsSync(binary)) {
      const targets = execFileSync(binary, ['--list-impersonate-targets'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      if (targets && /chrome|firefox/i.test(targets)) {
        return binary;
      }
    }
  } catch {}
  return null;
};

const updateYtDlpBinary = async () => {
  try {
    const impersonateBinary = findImpersonateBinary();
    if (impersonateBinary) {
      process.env.YTDLP_CUSTOM_BINARY = impersonateBinary;
      process.stdout.write(`[yt-dlp] Impersonate-capable yt-dlp binary found at ${impersonateBinary}. Skipping binary download.\n`);
      return;
    }
  } catch {}

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
      'script-src': ["'self'", 'https://www.googletagmanager.com', "'unsafe-inline'"],
      'script-src-elem': ["'self'", 'https://www.googletagmanager.com', "'unsafe-inline'"],
      'connect-src': ["'self'", 'https://www.google-analytics.com', 'https://www.googletagmanager.com'],
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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    process.stderr.write(`[server] ERROR: Port ${PORT} is already in use. Kill the existing process first:\n`);
    process.stderr.write(`  netstat -ano | findstr :${PORT}   (find the PID)\n`);
    process.stderr.write(`  taskkill /PID <pid> /F             (Windows)\n`);
    process.stderr.write(`  kill -9 <pid>                      (Linux/Mac)\n`);
  } else {
    process.stderr.write(`[server] Fatal error: ${err.message}\n`);
  }
  process.exit(1);
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
