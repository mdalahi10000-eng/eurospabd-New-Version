/**
 * Global Cache Service for Euro Spa Center
 * Provides immediate, synchronous local caching for all CMS-managed entities:
 * - Homepage content (Hero titles, badges, ratings, announcements, CTA buttons)
 * - Business info & opening hours & contact details
 * - Services & prices
 * - Gallery images
 * - Reviews & Google Business sync data
 * - About Us content
 * - FAQs
 * - Articles / Blog
 * - Service areas
 * 
 * Ensures that on page load / reload, the latest saved version is displayed
 * immediately on the very first frame, with zero flash of stale or hardcoded data.
 */

export const CACHE_KEYS = {
  HOMEPAGE: 'eurospa_cache_homepage_v2',
  BUSINESS: 'eurospa_cache_business_v2',
  SERVICES: 'eurospa_cache_services_v2',
  GALLERY: 'eurospa_cache_gallery_v2',
  REVIEWS: 'eurospa_cache_reviews_v2',
  GOOGLE_SYNC: 'eurospa_cache_google_sync_v2',
  ABOUT: 'eurospa_cache_about_v2',
  FAQS: 'eurospa_cache_faqs_v2',
  ARTICLES: 'eurospa_cache_articles_v2',
  SERVICE_AREAS: 'eurospa_cache_service_areas_v2'
} as const;

// In-memory fallback if storage is restricted
const memoryCache = new Map<string, any>();

export function getCachedData<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    
    // Check localStorage first
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        return parsed.data as T;
      }
      return parsed as T;
    }

    // Fallback to memory cache
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }
  } catch (err) {
    console.warn(`[CacheService] Error reading cache key "${key}":`, err);
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }
  }
  return null;
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    if (data === undefined || data === null) return;

    // Always update memory cache
    memoryCache.set(key, data);

    if (typeof window !== 'undefined') {
      const payload = JSON.stringify({
        data,
        timestamp: Date.now()
      });
      window.localStorage.setItem(key, payload);

      // Dispatch event to notify any listeners in the current window
      window.dispatchEvent(new CustomEvent('eurospa_cache_updated', {
        detail: { key, data }
      }));
    }
  } catch (err) {
    console.warn(`[CacheService] Error saving cache key "${key}":`, err);
  }
}

// Cross-tab synchronization: when another tab updates localStorage, sync memoryCache and dispatch local event
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        const data = (parsed && typeof parsed === 'object' && 'data' in parsed) ? parsed.data : parsed;
        memoryCache.set(event.key, data);
        window.dispatchEvent(new CustomEvent('eurospa_cache_updated', {
          detail: { key: event.key, data }
        }));
      } catch {
        // Ignore non-JSON storage events
      }
    }
  });
}

export function hasCachedData(key: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const val = (parsed && typeof parsed === 'object' && 'data' in parsed) ? parsed.data : parsed;
      if (Array.isArray(val)) {
        return val.length > 0;
      }
      return val !== null && val !== undefined;
    }
    return memoryCache.has(key);
  } catch {
    return memoryCache.has(key);
  }
}

export function clearCachedData(key: string): void {
  try {
    memoryCache.delete(key);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[CacheService] Error clearing cache key "${key}":`, err);
  }
}
