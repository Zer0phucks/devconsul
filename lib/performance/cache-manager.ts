/**
 * Cache Manager
 *
 * Provides high-level caching abstraction with:
 * - Automatic cache key generation
 * - TTL management
 * - Hit/miss tracking
 * - Automatic fallback to database
 * - Type-safe cache operations
 */

import { redis, generateCacheKey, CACHE_TTL, type CacheKeyPrefix } from './redis.config';

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  errors: number;
  hitRate: number;
}

const stats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  errors: 0,
  hitRate: 0,
};

/**
 * Get from cache with automatic fallback
 */
export async function getCached<T>(
  prefix: CacheKeyPrefix,
  identifier: string | string[],
  fallback: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const key = generateCacheKey(prefix, identifier);

  try {
    // Try to get from cache
    const cached = await redis.get<T>(key);

    if (cached !== null) {
      stats.hits++;
      updateHitRate();
      return cached;
    }

    // Cache miss - execute fallback
    stats.misses++;
    updateHitRate();

    const result = await fallback();

    // Store in cache with TTL
    const cacheTTL = ttl || CACHE_TTL[prefix.toUpperCase() as keyof typeof CACHE_TTL] || 300;
    await setCached(prefix, identifier, result, cacheTTL);

    return result;
  } catch (error) {
    stats.errors++;
    console.error(`Cache error for key ${key}:`, error);

    // On error, execute fallback without caching
    return fallback();
  }
}

/**
 * Set value in cache
 */
export async function setCached<T>(
  prefix: CacheKeyPrefix,
  identifier: string | string[],
  value: T,
  ttl?: number
): Promise<boolean> {
  const key = generateCacheKey(prefix, identifier);

  try {
    const cacheTTL = ttl || CACHE_TTL[prefix.toUpperCase() as keyof typeof CACHE_TTL] || 300;
    await redis.set(key, JSON.stringify(value), { ex: cacheTTL });

    stats.sets++;
    return true;
  } catch (error) {
    stats.errors++;
    console.error(`Failed to set cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete from cache
 */
export async function deleteCached(
  prefix: CacheKeyPrefix,
  identifier: string | string[]
): Promise<boolean> {
  const key = generateCacheKey(prefix, identifier);

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    stats.errors++;
    console.error(`Failed to delete cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Invalidate multiple cache entries by pattern
 */
export async function invalidatePattern(
  prefix: CacheKeyPrefix,
  pattern?: string
): Promise<number> {
  try {
    const searchPattern = pattern
      ? generateCacheKey(prefix, pattern)
      : `${generateCacheKey(prefix, '')}*`;

    const keys = await redis.keys(searchPattern);
    if (keys.length === 0) return 0;

    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    stats.errors++;
    console.error(`Failed to invalidate pattern for prefix ${prefix}:`, error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return { ...stats };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats(): void {
  stats.hits = 0;
  stats.misses = 0;
  stats.sets = 0;
  stats.errors = 0;
  stats.hitRate = 0;
}

/**
 * Update hit rate calculation
 */
function updateHitRate(): void {
  const total = stats.hits + stats.misses;
  stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0;
}

/**
 * Cache warming function
 * Pre-populate cache with common queries
 */
export async function warmCache(
  entries: Array<{
    prefix: CacheKeyPrefix;
    identifier: string | string[];
    value: any;
    ttl?: number;
  }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const entry of entries) {
    const result = await setCached(
      entry.prefix,
      entry.identifier,
      entry.value,
      entry.ttl
    );

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Batch get from cache
 */
export async function getBatchCached<T>(
  prefix: CacheKeyPrefix,
  identifiers: string[]
): Promise<Map<string, T | null>> {
  const results = new Map<string, T | null>();

  for (const id of identifiers) {
    const key = generateCacheKey(prefix, id);
    try {
      const value = await redis.get<T>(key);
      results.set(id, value);

      if (value !== null) {
        stats.hits++;
      } else {
        stats.misses++;
      }
    } catch (error) {
      stats.errors++;
      console.error(`Failed to get cached value for ${id}:`, error);
      results.set(id, null);
    }
  }

  updateHitRate();
  return results;
}

/**
 * Check if cache entry exists
 */
export async function cacheExists(
  prefix: CacheKeyPrefix,
  identifier: string | string[]
): Promise<boolean> {
  const key = generateCacheKey(prefix, identifier);

  try {
    const value = await redis.get(key);
    return value !== null;
  } catch (error) {
    stats.errors++;
    return false;
  }
}

/**
 * Get TTL for cache entry
 */
export async function getCacheTTL(
  prefix: CacheKeyPrefix,
  identifier: string | string[]
): Promise<number | null> {
  const key = generateCacheKey(prefix, identifier);

  try {
    return await redis.ttl(key);
  } catch (error) {
    stats.errors++;
    return null;
  }
}

/**
 * Extend cache TTL
 */
export async function extendCacheTTL(
  prefix: CacheKeyPrefix,
  identifier: string | string[],
  additionalSeconds: number
): Promise<boolean> {
  const key = generateCacheKey(prefix, identifier);

  try {
    const currentTTL = await redis.ttl(key);
    if (currentTTL === null || currentTTL < 0) return false;

    await redis.expire(key, currentTTL + additionalSeconds);
    return true;
  } catch (error) {
    stats.errors++;
    console.error(`Failed to extend TTL for key ${key}:`, error);
    return false;
  }
}
