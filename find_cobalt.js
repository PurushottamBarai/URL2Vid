process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
async function findCobaltInstance() {
  try {
    const res = await fetch('https://instances.cobalt.best/api/instances');
    const instances = await res.json();
    
    // Filter for instances with high trust, online, and API support
    const candidates = instances.filter(i => 
      i.trust >= 90 && 
      i.status === 'online' && 
      i.api_online === true &&
      i.services && 
      i.services.includes('youtube')
    );

    console.log(`Found ${candidates.length} candidates. Testing top 3...`);

    for (const i of candidates.slice(0, 5)) {
      console.log(`Testing ${i.api}...`);
      try {
        const testRes = await fetch(`https://${i.api}/`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: 'https://youtu.be/ViZukhRA_n8' }),
          signal: AbortSignal.timeout(10000)
        });
        const data = await testRes.json();
        if (data.status === 'redirect' || data.status === 'success' || data.url) {
          console.log(`SUCCESS! Use this API: https://${i.api}/`);
          return;
        }
      } catch (err) {
        console.log(`Failed ${i.api}: ${err.message}`);
      }
    }
    console.log('No working instances found.');
  } catch (err) {
    console.error('Error fetching instances:', err);
  }
}
findCobaltInstance();
