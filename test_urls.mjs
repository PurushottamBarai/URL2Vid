const BASE_URL = 'https://url2vid.onrender.com/api/info';

const urls = [
  'https://www.reddit.com/r/videos/s/WW09LYXOWH',
  'https://www.youtube.com/live/0UU1jhI09U0?si=yVV7jBlYMdIJ9u0E',
  'https://www.facebook.com/reel/1003241892104097',
  'https://www.facebook.com/watch/?v=953159404450924',
  'https://x.com/Quantum_143/status/2099373636935377322?s=20',
  'https://www.pinterest.com/ideas/men-outfits-video/940752983327/',
  'https://www.reddit.com/r/videos/s/bkBKdPKFyb',
  'https://lnkd.in/p/dMjbb6Ai',
  'https://lnkd.in/p/dRdF4C4V',
  'https://www.snapchat.com/@duplex_2007/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYZWF4c3hzaGpiAaAvpLpWAaAvpLo9AAAAAQ',
  'https://www.threads.com/@meta/post/Dc1MS3pkhKN/media',
];

async function testUrl(url, index) {
  const label = `[${index + 1}/${urls.length}]`;
  process.stdout.write(`${label} Testing: ${url.substring(0, 60)}...\n`);
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json();

    if (res.ok && (data.title || data.formats || data.videoInfo)) {
      const title = data.title || data.videoInfo?.title || '(no title)';
      console.log(`  SUCCESS - "${title}"\n`);
      return { url, status: 'SUCCESS', detail: title };
    } else {
      const err = data.error || data.message || JSON.stringify(data).substring(0, 100);
      console.log(`  FAIL - ${err}\n`);
      return { url, status: 'FAIL', detail: err };
    }
  } catch (err) {
    const msg = err.name === 'TimeoutError' ? 'Request timed out (30s)' : err.message;
    console.log(`  FAIL - ${msg}\n`);
    return { url, status: 'FAIL', detail: msg };
  }
}

async function main() {
  console.log('\nURL2Vid Production Test - https://url2vid.onrender.com\n');
  console.log('='.repeat(65) + '\n');

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    results.push(await testUrl(urls[i], i));
  }

  console.log('\n' + '='.repeat(65));
  console.log('SUMMARY REPORT\n');

  const passed = results.filter(r => r.status === 'SUCCESS');
  const failed = results.filter(r => r.status === 'FAIL');

  results.forEach((r, i) => {
    const icon = r.status === 'SUCCESS' ? '[PASS]' : '[FAIL]';
    const platform = new URL(r.url).hostname.replace('www.', '');
    console.log(`${icon} ${i + 1}. ${platform}`);
    console.log(`   ${r.detail}`);
  });

  console.log(`\nPassed: ${passed.length}/${urls.length}`);
  console.log(`Failed: ${failed.length}/${urls.length}`);
}

main();
