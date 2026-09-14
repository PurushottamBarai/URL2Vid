import puppeteer from 'puppeteer';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 54321;
const DIST_DIR = path.resolve(__dirname, 'dist');

const routes = [
  '/',
  '/404',
  '/youtube-video-downloader',
  '/instagram-reel-downloader',
  '/tiktok-video-downloader',
  '/facebook-video-downloader',
  '/twitter-video-downloader',
  '/pinterest-video-downloader'
];

async function prerender() {
  console.log('Starting prerendering...');

  const app = express();
  
  app.use(express.static(DIST_DIR));
  app.use((req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });

  const server = app.listen(PORT, () => {
    console.log(`Static server running on http://localhost:${PORT}`);
  });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const route of routes) {
    const page = await browser.newPage();
    console.log(`Prerendering ${route}...`);
    
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
    
    await new Promise(resolve => setTimeout(resolve, 500));

    const html = await page.evaluate(() => {
      return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    });

    let outputPath;
    if (route === '/') {
      outputPath = path.join(DIST_DIR, 'index.html');
    } else if (route === '/404') {
      outputPath = path.join(DIST_DIR, '404.html');
    } else {
      const dirPath = path.join(DIST_DIR, route.substring(1));
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      outputPath = path.join(dirPath, 'index.html');
    }

    fs.writeFileSync(outputPath, html);
    console.log(`Saved ${outputPath}`);
    await page.close();
  }

  await browser.close();
  
  server.close(() => {
    console.log('Server closed. Prerendering complete!');
  });
}

prerender().catch(err => {
  console.error('Prerendering failed:', err);
  process.exit(1);
});
