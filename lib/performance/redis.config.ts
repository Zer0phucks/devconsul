/**
 * Redis Configuration for Vercel KV
 *
 * Provides Redis client setup and connection management
 * using Vercel's KV store (ioredis-compatible)
 */

import { kv } from '@vercel/kv';

// Redis TTL configurations (in seconds)
export const CACHE_TTL = {
  // Session data - 24 hours
  SESSION: 60 * 60 * 24,

  // GitHub API responses - 15 minutes
  GITHUB_API: 60 * 15,

  // Generated content - 1 hour
  GENERATED_CONTENT: 60 * 60,

  // Platform metadata - 24 hours
  PLATFORM_METADATA: 60 * 60 * 24,

  // User quotas - 1 hour
  USER_QUOTA: 60 * 60,

  // Rate limit counters - varies by endpoint
  RATE_LIMIT_WINDOW: 60, // 1 minute default

  // Query results - 5 minutes
  QUERY_RESULTS: 60 * 5,

  // Repository insights - 30 minutes
  REPOSITORY_INSIGHTS: 60 * 30,
} as const;

// Cache key prefixes for organization
export const CACHE_KEYS = {
  SESSION: 'session',
  GITHUB_ACTIVITY: 'github:activity',
  GITHUB_REPO: 'github:repo',
  GENERATED_CONTENT: 'content:generated',
  PLATFORM_META: 'platform:meta',
  USER_QUOTA: 'quota:user',
  RATE_LIMIT: 'ratelimit',
  QUERY_CACHE: 'query',
  REPO_INSIGHTS: 'insights:repo',
} as const;

/**
 * Generate cache key with prefix
 */
export function generateCacheKey(
  prefix: keyof typeof CACHE_KEYS,
  identifier: string | string[]
): string {
  const parts = Array.isArray(identifier) ? identifier : [identifier];
  return `${CACHE_KEYS[prefix]}:${parts.join(':')}`;
}

/**
 * Vercel KV client (ioredis-compatible)
 */
export const redis = kv;

/**
 * Redis connection health check
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    // Test with a simple ping operation
    await redis.set('health:check', '1', { ex: 5 });
    const result = await redis.get('health:check');
    return result === '1';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Clear cache by pattern
 */
export async function clearCacheByPattern(pattern: string): Promise<number> {
  try {
    // Note: Vercel KV doesn't support SCAN, so we use a limited approach
    // This is mainly for manual cache clearing
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;

    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.error('Failed to clear cache by pattern:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  keysByPrefix: Record<string, number>;
}> {
  try {
    const allKeys = await redis.keys('*');
    const totalKeys = allKeys.length;

    // Group by prefix
    const keysByPrefix: Record<string, number> = {};
    for (const key of allKeys) {
      const prefix = key.split(':')[0];
      keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1;
    }

    return { totalKeys, keysByPrefix };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return { totalKeys: 0, keysByPrefix: {} };
  }
}

export type CacheKeyPrefix = keyof typeof CACHE_KEYS;
export type CacheTTL = typeof CACHE_TTL[keyof typeof CACHE_TTL];
