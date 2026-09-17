class MemoryCache {
  constructor(ttlMs = 10 * 60 * 1000, maxSize = 300) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!key) return null;
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value) {
    if (!key || !value) return;
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs,
    });
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }
}

export const videoInfoCache = new MemoryCache(10 * 60 * 1000, 300);
