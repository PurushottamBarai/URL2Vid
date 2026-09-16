let proxyPool = process.env.YTDLP_PROXY ? [process.env.YTDLP_PROXY] : [];
let currentIndex = 0;
let isInitialized = false;
let fetchPromise = null;

const WEBSHARE_API_URL =
  "https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page=1&page_size=25";

const fetchWebshareProxies = async () => {
  const apiKey = process.env.WEBSHARE_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(WEBSHARE_API_URL, {
      headers: { Authorization: `Token ${apiKey}` },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      process.stderr.write(
        `[proxyManager] Webshare API returned status ${res.status}\n`,
      );
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data.results)) return [];

    return data.results
      .filter((p) => p.valid && p.proxy_address && p.port)
      .map(
        (p) =>
          `http://${p.username}:${p.password}@${p.proxy_address}:${p.port}/`,
      );
  } catch (err) {
    process.stderr.write(
      `[proxyManager] Failed to fetch proxies from Webshare: ${err.message}\n`,
    );
    return [];
  }
};

const initProxyPool = async () => {
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const fetched = await fetchWebshareProxies();
      if (fetched.length > 0) {
        proxyPool = fetched;
        currentIndex = 0;
        process.stdout.write(
          `[proxyManager] Initialized pool with ${proxyPool.length} Webshare proxies\n`,
        );
      } else if (process.env.YTDLP_PROXY && proxyPool.length === 0) {
        proxyPool = [process.env.YTDLP_PROXY];
        currentIndex = 0;
        process.stdout.write(
          `[proxyManager] Initialized pool with fallback YTDLP_PROXY\n`,
        );
      }
    } finally {
      isInitialized = true;
      fetchPromise = null;
    }
  })();

  return fetchPromise;
};

if (process.env.WEBSHARE_API_KEY || process.env.YTDLP_PROXY) {
  initProxyPool();
  setInterval(() => {
    initProxyPool();
  }, 30 * 60 * 1000).unref();
}

const getProxy = () => {
  if (!isInitialized && proxyPool.length === 0) {
    initProxyPool();
  }

  if (proxyPool.length === 0) {
    return process.env.YTDLP_PROXY || null;
  }

  return proxyPool[currentIndex % proxyPool.length];
};

const reportFailure = (failedProxy, reason) => {
  if (proxyPool.length <= 1) return null;

  const current = proxyPool[currentIndex % proxyPool.length];
  if (failedProxy && failedProxy !== current) {
    return current;
  }

  const prev = current;
  currentIndex = (currentIndex + 1) % proxyPool.length;
  const next = proxyPool[currentIndex % proxyPool.length];

  process.stdout.write(
    `[proxyManager] Proxy ${prev} failed (${reason || "unspecified"}). Rotated to: ${next}\n`,
  );
  return next;
};

const getPoolSize = () => proxyPool.length;

export { getProxy, reportFailure, initProxyPool, getPoolSize };
