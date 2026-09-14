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

  // Start express server to serve the built static files
  const app = express();
  
  // Serve static files from dist
  // For any route, fallback to index.html so React Router can take over
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
    
    // Disable requests for external resources that might delay networkidle0 (like analytics or external images) if needed
    // But we want to capture standard hydration
    
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Give React a small extra buffer to finish any async effects (like meta tags update)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Extract the full HTML including doctype
    const html = await page.evaluate(() => {
      return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    });

    // Determine output path
    let outputPath;
    if (route === '/') {
      outputPath = path.join(DIST_DIR, 'index.html');
    } else if (route === '/404') {
      outputPath = path.join(DIST_DIR, '404.html'); // specifically for hosts that look for 404.html
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
