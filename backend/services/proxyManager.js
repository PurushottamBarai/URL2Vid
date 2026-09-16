let proxyPool = [];
let currentIndex = 0;
let isInitialized = false;
let fetchPromise = null;

const WEBSHARE_API_URL =
  "https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page=1&page_size=25";

const parseExtraProxies = () => {
  const extra = process.env.EXTRA_PROXIES;
  if (!extra) return [];
  return extra
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
};

const getSeedProxies = () => {
  const seeds = [];
  if (process.env.YTDLP_PROXY) {
    seeds.push(process.env.YTDLP_PROXY.trim());
  }
  const extras = parseExtraProxies();
  extras.forEach((p) => {
    if (!seeds.includes(p)) seeds.push(p);
  });
  return seeds;
};

proxyPool = getSeedProxies();

const fetchFromWebshareKey = async (apiKey) => {
  try {
    const res = await fetch(WEBSHARE_API_URL, {
      headers: { Authorization: `Token ${apiKey.trim()}` },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      process.stderr.write(
        `[proxyManager] Webshare API key returned status ${res.status}\n`,
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

const fetchWebshareProxies = async () => {
  const apiKeysRaw = process.env.WEBSHARE_API_KEY;
  if (!apiKeysRaw) return [];

  const keys = apiKeysRaw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const results = await Promise.all(keys.map(fetchFromWebshareKey));
  const combined = [];
  results.flat().forEach((p) => {
    if (!combined.includes(p)) combined.push(p);
  });
  return combined;
};

const initProxyPool = async () => {
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const fetched = await fetchWebshareProxies();
      const extras = parseExtraProxies();
      const newPool = [];

      fetched.forEach((p) => {
        if (!newPool.includes(p)) newPool.push(p);
      });
      extras.forEach((p) => {
        if (!newPool.includes(p)) newPool.push(p);
      });
      if (process.env.YTDLP_PROXY && !newPool.includes(process.env.YTDLP_PROXY)) {
        newPool.push(process.env.YTDLP_PROXY);
      }

      if (newPool.length > 0) {
        proxyPool = newPool;
        process.stdout.write(
          `[proxyManager] Initialized unified pool with ${proxyPool.length} proxies\n`,
        );
      }
    } finally {
      isInitialized = true;
      fetchPromise = null;
    }
  })();

  return fetchPromise;
};

if (
  process.env.WEBSHARE_API_KEY ||
  process.env.EXTRA_PROXIES ||
  process.env.YTDLP_PROXY
) {
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
