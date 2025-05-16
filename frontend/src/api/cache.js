/**
 * Simple in-memory cache system for API responses
 */

// Cache configuration
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 100; // Maximum number of items to store in cache

// Main cache store
const cache = {
  items: new Map(),
  keys: []
};

/**
 * Get an item from cache
 * @param {string} key - Cache key
 * @returns {Object|null} Cached value or null if not found/expired
 */
export const getCacheItem = (key) => {
  if (!cache.items.has(key)) {
    return null;
  }
  
  const item = cache.items.get(key);
  const now = Date.now();
  
  // Check if item has expired
  if (now > item.expiresAt) {
    cache.items.delete(key);
    cache.keys = cache.keys.filter(k => k !== key);
    return null;
  }
  
  return item.value;
};

/**
 * Set an item in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export const setCacheItem = (key, value, ttl = DEFAULT_CACHE_TTL) => {
  // Manage cache size - remove oldest items if needed
  if (cache.keys.length >= MAX_CACHE_SIZE && !cache.items.has(key)) {
    const oldestKey = cache.keys.shift();
    cache.items.delete(oldestKey);
  }
  
  // Add or update the item
  const expiresAt = Date.now() + ttl;
  cache.items.set(key, { value, expiresAt });
  
  // Track key for LRU eviction
  if (cache.keys.includes(key)) {
    cache.keys = cache.keys.filter(k => k !== key);
  }
  cache.keys.push(key);
};

/**
 * Clear the entire cache or specific items
 * @param {string|string[]|null} keys - Specific key(s) to clear, or null for all
 */
export const clearCache = (keys = null) => {
  if (keys === null) {
    cache.items.clear();
    cache.keys = [];
  } else if (Array.isArray(keys)) {
    keys.forEach(key => {
      cache.items.delete(key);
    });
    cache.keys = cache.keys.filter(k => !keys.includes(k));
  } else {
    cache.items.delete(keys);
    cache.keys = cache.keys.filter(k => k !== keys);
  }
};

/**
 * Generate a cache key from API function name and parameters
 * @param {string} functionName - API function name
 * @param {Array} args - Function arguments
 * @returns {string} Cache key
 */
export const generateCacheKey = (functionName, args = []) => {
  return `${functionName}:${JSON.stringify(args)}`;
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  return {
    size: cache.items.size,
    maxSize: MAX_CACHE_SIZE,
    keys: [...cache.keys]
  };
}; 