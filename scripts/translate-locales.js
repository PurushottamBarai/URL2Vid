const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '..', 'frontend', 'src', 'locales', 'en.json');
const LOCALES_DIR = path.join(__dirname, '..', 'frontend', 'src', 'locales');

const TARGET_LANGUAGES = [
  'es', 'pt', 'de', 'fr', 'tr', 'hi', 'id', 'it', 'ja', 'ru',
  'th', 'nl', 'ar', 'vi', 'ko', 'pl', 'fil', 'ms', 'zh', 'bn',
  'el', 'cs', 'ro', 'uk'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeHtmlEntities = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
};

const translateText = async (text, targetLang, retries = 2) => {
  if (!text || text.trim() === '' || text.startsWith('http') || /^[^a-zA-Z0-9]+$/.test(text)) {
    return text;
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) URL2Vid-Locale-Translator/1.0',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data && data.responseData && typeof data.responseData.translatedText === 'string') {
        const translated = decodeHtmlEntities(data.responseData.translatedText.trim());
        if (translated.toUpperCase().includes('MYMEMORY WARNING:')) {
          console.warn(`[warning] MyMemory quota warning for ${targetLang}: "${text}"`);
          return text;
        }
        return translated;
      }
      throw new Error('Invalid response structure');
    } catch (err) {
      if (attempt < retries) {
        await sleep(500 * (attempt + 1));
      } else {
        console.warn(`[fallback] Failed to translate "${text}" to ${targetLang} (${err.message}). Using English.`);
        return text;
      }
    }
  }
  return text;
};

async function main() {
  if (!fs.existsSync(SOURCE_PATH)) {
    console.error(`Source file not found at ${SOURCE_PATH}`);
    process.exit(1);
  }

  const sourceData = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf-8'));
  const keys = Object.keys(sourceData);

  console.log(`Loaded source en.json with ${keys.length} keys.`);
  console.log(`Translating into ${TARGET_LANGUAGES.length} languages...`);

  if (!fs.existsSync(LOCALES_DIR)) {
    fs.mkdirSync(LOCALES_DIR, { recursive: true });
  }

  for (const lang of TARGET_LANGUAGES) {
    console.log(`Translating [${lang}]...`);
    const translatedObj = {};

    for (const key of keys) {
      const originalText = sourceData[key];
      const translatedText = await translateText(originalText, lang);
      translatedObj[key] = translatedText;
      await sleep(150);
    }

    const targetFile = path.join(LOCALES_DIR, `${lang}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(translatedObj, null, 2) + '\n', 'utf-8');
    console.log(`Saved ${targetFile}`);
  }

  console.log('\nAll locale files translated successfully!');
}

main().catch((err) => {
  console.error('Fatal translation error:', err);
  process.exit(1);
});
