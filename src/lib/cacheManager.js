/**
 * Cache Manager Utility
 * Handles smart caching of API responses and data
 */

const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,        // 5 minutes
  MEDIUM: 30 * 60 * 1000,       // 30 minutes
  LONG: 2 * 60 * 60 * 1000,     // 2 hours
  DAY: 24 * 60 * 60 * 1000,     // 24 hours
};

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} duration - Duration in milliseconds
   */
  set(key, value, duration = CACHE_DURATION.MEDIUM) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set cache
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      duration,
    });

    // Set auto-cleanup timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, duration);

    this.timers.set(key, timer);
  }

  /**
   * Get cached value if not expired
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if expired/not found
   */
  get(key) {
    const cached = this.cache.get(key);

    if (!cached) return null;

    const { value, timestamp, duration } = cached;
    const now = Date.now();

    // Check if cache has expired
    if (now - timestamp > duration) {
      this.delete(key);
      return null;
    }

    return value;
  }

  /**
   * Check if key exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: Array.from(this.cache.values()).reduce(
        (acc, item) => acc + JSON.stringify(item.value).length,
        0
      ),
    };
  }
}

// Global cache instance
export const cacheManager = new CacheManager();

/**
 * Memoize async function with caching
 * @param {Function} fn - Async function to memoize
 * @param {string} cacheKey - Cache key prefix
 * @param {number} duration - Cache duration in ms
 * @returns {Function} - Memoized function
 */
export const memoizeAsync = (fn, cacheKey, duration = CACHE_DURATION.MEDIUM) => {
  return async (...args) => {
    const fullKey = `${cacheKey}:${JSON.stringify(args)}`;

    // Check cache first
    const cached = cacheManager.get(fullKey);
    if (cached) {
      return cached;
    }

    // Execute function
    const result = await fn(...args);

    // Cache result
    cacheManager.set(fullKey, result, duration);

    return result;
  };
};

/**
 * Local storage cache with expiration
 */
export const localStorageCache = {
  /**
   * Set value in localStorage with expiration
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} duration - Duration in milliseconds
   */
  set(key, value, duration = CACHE_DURATION.DAY) {
    try {
      const data = {
        value,
        expiry: Date.now() + duration,
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage cache set failed:', e);
    }
  },

  /**
   * Get value from localStorage
   * @param {string} key - Storage key
   * @returns {any|null} - Stored value or null
   */
  get(key) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      const { value, expiry } = JSON.parse(data);

      // Check if expired
      if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return value;
    } catch (e) {
      console.warn('LocalStorage cache get failed:', e);
      return null;
    }
  },

  /**
   * Remove from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('LocalStorage cache remove failed:', e);
    }
  },

  /**
   * Clear all cached items
   */
  clear() {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('LocalStorage cache clear failed:', e);
    }
  },
};

export {
  CACHE_DURATION,
  CacheManager,
};

export default {
  cacheManager,
  memoizeAsync,
  localStorageCache,
  CACHE_DURATION,
};
