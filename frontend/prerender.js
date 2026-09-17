import puppeteer from 'puppeteer';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { platformsData } from './src/data/platforms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 54321;
const DIST_DIR = path.resolve(__dirname, 'dist');
const routes = ['/', '/404', '/user-guide', ...platformsData.map((p) => p.path)];

async function prerender() {
  console.log(`Starting prerendering for ${routes.length} routes...`);

  const app = express();
  app.use(express.static(DIST_DIR));
  app.use((req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));

  const server = app.listen(PORT);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    for (const route of routes) {
      console.log(`Prerendering ${route}...`);
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((resolve) => setTimeout(resolve, 300));

      let html = await page.evaluate(() => '<!DOCTYPE html>\n' + document.documentElement.outerHTML);
      const canonicalUrl = `https://url2vid.codedeck.me${route === '/' ? '/' : route}`;
      html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonicalUrl}"`);
      html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonicalUrl}"`);
      html = html.replaceAll('https://url2vid.onrender.com', 'https://url2vid.codedeck.me');

      const outputPath = route === '/'
        ? path.join(DIST_DIR, 'index.html')
        : route === '/404'
          ? path.join(DIST_DIR, '404.html')
          : path.join(DIST_DIR, route.slice(1), 'index.html');

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, html);
      console.log(`Saved ${outputPath}`);
    }
  } finally {
    await browser.close();
    server.close();
    console.log('Prerendering complete and server closed.');
  }
}

prerender().catch((err) => {
  console.error('Prerendering failed:', err);
  process.exit(1);
});
