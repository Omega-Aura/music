// Simple in-memory cache for search results
class SearchCache {
  private cache = new Map<string, any>();
  private maxSize = 50; // Maximum number of cached searches

  get(key: string) {
    return this.cache.get(key.toLowerCase());
  }

  set(key: string, value: any) {
    const normalizedKey = key.toLowerCase();
    
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(normalizedKey, value);
  }

  clear() {
    this.cache.clear();
  }

  has(key: string) {
    return this.cache.has(key.toLowerCase());
  }
}

export const searchCache = new SearchCache();
