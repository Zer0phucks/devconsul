/**
 * Rate Limiter Middleware
 *
 * Implements multi-tier rate limiting:
 * - Per-user rate limits (based on subscription tier)
 * - Per-IP rate limits (for unauthenticated requests)
 * - GitHub API rate limit tracking
 * - Platform API rate limit management
 */

import { redis } from './redis.config';
import type { NextRequest } from 'next/server';

// Rate limit tiers (requests per minute)
export const RATE_LIMITS = {
  // User tiers
  FREE: 100,
  PRO: 1000,
  ENTERPRISE: 10000,

  // Anonymous/IP-based
  ANONYMOUS: 20,

  // External API limits
  GITHUB_API: 5000, // 5000 per hour = ~83 per minute
  OPENAI_API: 3500, // TPM limit varies by tier
  ANTHROPIC_API: 4000, // TPM limit varies by tier
} as const;

export type RateLimitTier = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // Seconds until retry
}

/**
 * Check rate limit for a user
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = 'FREE',
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const limit = RATE_LIMITS[tier];
  const key = `ratelimit:${tier.toLowerCase()}:${identifier}`;

  try {
    // Get current count
    const current = await redis.get<number>(key) || 0;
    const remaining = Math.max(0, limit - current - 1);
    const allowed = current < limit;

    if (allowed) {
      // Increment counter
      const newCount = await redis.incr(key);

      // Set expiry on first request
      if (newCount === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);
      const reset = Math.floor(Date.now() / 1000) + (ttl || windowSeconds);

      return {
        allowed: true,
        limit,
        remaining,
        reset,
      };
    }

    // Rate limit exceeded
    const ttl = await redis.ttl(key);
    const reset = Math.floor(Date.now() / 1000) + (ttl || windowSeconds);

    return {
      allowed: false,
      limit,
      remaining: 0,
      reset,
      retryAfter: ttl || windowSeconds,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);

    // On error, allow request (fail-open)
    return {
      allowed: true,
      limit,
      remaining: limit,
      reset: Math.floor(Date.now() / 1000) + windowSeconds,
    };
  }
}

/**
 * Check rate limit for IP address (unauthenticated requests)
 */
export async function checkIPRateLimit(
  ipAddress: string,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  return checkRateLimit(ipAddress, 'ANONYMOUS', windowSeconds);
}

/**
 * Track GitHub API usage
 */
export async function trackGitHubAPIUsage(
  userId: string
): Promise<{ remaining: number; reset: number }> {
  const key = `ratelimit:github:${userId}`;
  const limit = RATE_LIMITS.GITHUB_API;
  const windowSeconds = 3600; // 1 hour

  try {
    const current = await redis.get<number>(key) || 0;
    const newCount = await redis.incr(key);

    if (newCount === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);
    const reset = Math.floor(Date.now() / 1000) + (ttl || windowSeconds);
    const remaining = Math.max(0, limit - newCount);

    return { remaining, reset };
  } catch (error) {
    console.error('GitHub API tracking failed:', error);
    return { remaining: limit, reset: Math.floor(Date.now() / 1000) + windowSeconds };
  }
}

/**
 * Get rate limit headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    ...(result.retryAfter && {
      'Retry-After': result.retryAfter.toString(),
    }),
  };
}

/**
 * Extract identifier from request
 */
export function getRequestIdentifier(
  request: NextRequest,
  userId?: string
): { identifier: string; tier: RateLimitTier } {
  if (userId) {
    // TODO: Get user tier from database
    // For now, default to FREE
    return { identifier: userId, tier: 'FREE' };
  }

  // Use IP address for anonymous requests
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
    || request.headers.get('x-real-ip')
    || 'unknown';

  return { identifier: ip, tier: 'ANONYMOUS' };
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  userId?: string
): Promise<Response | null> {
  const { identifier, tier } = getRequestIdentifier(request, userId);
  const result = await checkRateLimit(identifier, tier);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
        limit: result.limit,
        reset: result.reset,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(result),
        },
      }
    );
  }

  // Request allowed - return null to continue
  return null;
}

/**
 * Platform-specific rate limit tracking
 */
export async function trackPlatformAPIUsage(
  platform: string,
  userId: string,
  requestsPerWindow: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `ratelimit:platform:${platform}:${userId}`;

  try {
    const current = await redis.get<number>(key) || 0;
    const remaining = Math.max(0, requestsPerWindow - current - 1);
    const allowed = current < requestsPerWindow;

    if (allowed) {
      const newCount = await redis.incr(key);

      if (newCount === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);
      const reset = Math.floor(Date.now() / 1000) + (ttl || windowSeconds);

      return {
        allowed: true,
        limit: requestsPerWindow,
        remaining,
        reset,
      };
    }

    const ttl = await redis.ttl(key);
    const reset = Math.floor(Date.now() / 1000) + (ttl || windowSeconds);

    return {
      allowed: false,
      limit: requestsPerWindow,
      remaining: 0,
      reset,
      retryAfter: ttl || windowSeconds,
    };
  } catch (error) {
    console.error('Platform API tracking failed:', error);

    return {
      allowed: true,
      limit: requestsPerWindow,
      remaining: requestsPerWindow,
      reset: Math.floor(Date.now() / 1000) + windowSeconds,
    };
  }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  tier: RateLimitTier = 'FREE'
): Promise<RateLimitResult> {
  const limit = RATE_LIMITS[tier];
  const key = `ratelimit:${tier.toLowerCase()}:${identifier}`;

  try {
    const current = await redis.get<number>(key) || 0;
    const ttl = await redis.ttl(key) || 60;
    const reset = Math.floor(Date.now() / 1000) + ttl;
    const remaining = Math.max(0, limit - current);

    return {
      allowed: current < limit,
      limit,
      remaining,
      reset,
      retryAfter: current >= limit ? ttl : undefined,
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return {
      allowed: true,
      limit,
      remaining: limit,
      reset: Math.floor(Date.now() / 1000) + 60,
    };
  }
}

/**
 * Reset rate limit for identifier
 */
export async function resetRateLimit(
  identifier: string,
  tier: RateLimitTier
): Promise<boolean> {
  const key = `ratelimit:${tier.toLowerCase()}:${identifier}`;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
    return false;
  }
}
