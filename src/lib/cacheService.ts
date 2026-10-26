import { Provider } from '../types';

export interface CachedData {
  userLocation: { lat: number; lng: number; address: string };
  providers: Provider[];
  cachedAt: number; // timestamp ms
}

const CACHE_KEY_LOCATION = 'quickfix_cached_location';
const CACHE_KEY_PROVIDERS = 'quickfix_cached_providers';
const CACHE_KEY_TIMESTAMP = 'quickfix_cached_timestamp';

/**
 * Saves current location and nearby service list to LocalStorage for offline access
 */
export function saveCachedMapAndServices(
  userLocation: { lat: number; lng: number; address: string },
  providers: Provider[]
): void {
  try {
    if (!userLocation || !userLocation.lat || !userLocation.lng) return;
    const now = Date.now();
    localStorage.setItem(CACHE_KEY_LOCATION, JSON.stringify(userLocation));
    localStorage.setItem(CACHE_KEY_PROVIDERS, JSON.stringify(providers));
    localStorage.setItem(CACHE_KEY_TIMESTAMP, now.toString());
  } catch (err) {
    console.warn('LocalStorage save cache error:', err);
  }
}

/**
 * Loads last successful cached map view and service list from LocalStorage
 */
export function loadCachedMapAndServices(): CachedData | null {
  try {
    const locStr = localStorage.getItem(CACHE_KEY_LOCATION);
    const provStr = localStorage.getItem(CACHE_KEY_PROVIDERS);
    const tsStr = localStorage.getItem(CACHE_KEY_TIMESTAMP);

    if (locStr && provStr) {
      const userLocation = JSON.parse(locStr);
      const providers = JSON.parse(provStr);
      const cachedAt = tsStr ? parseInt(tsStr, 10) : Date.now();

      if (userLocation.lat && userLocation.lng && Array.isArray(providers)) {
        return {
          userLocation,
          providers,
          cachedAt,
        };
      }
    }
  } catch (err) {
    console.warn('LocalStorage load cache error:', err);
  }
  return null;
}

/**
 * Formats timestamp into a user-friendly offline cache time string
 */
export function formatCacheTime(timestamp: number): string {
  if (!timestamp) return 'Just now';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Clears cached roadside location and providers
 */
export function clearCachedMapData(): void {
  try {
    localStorage.removeItem(CACHE_KEY_LOCATION);
    localStorage.removeItem(CACHE_KEY_PROVIDERS);
    localStorage.removeItem(CACHE_KEY_TIMESTAMP);
  } catch (err) {
    console.warn('Error clearing cache:', err);
  }
}
