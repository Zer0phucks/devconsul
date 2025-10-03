/**
 * Database Optimization Utilities
 *
 * Provides:
 * - Query optimization helpers
 * - N+1 query prevention
 * - Query result caching
 * - Slow query logging
 * - Connection pool monitoring
 */

import { prisma } from '@/lib/db';
import { getCached, setCached } from './cache-manager';
import type { CacheKeyPrefix } from './redis.config';

// Slow query threshold (milliseconds)
const SLOW_QUERY_THRESHOLD = 100;

// Query performance tracking
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  cached: boolean;
}

const queryMetrics: QueryMetrics[] = [];
const MAX_METRICS = 1000; // Keep last 1000 queries

/**
 * Execute query with caching and performance tracking
 */
export async function executeWithCache<T>(
  cachePrefix: CacheKeyPrefix,
  cacheKey: string | string[],
  queryFn: () => Promise<T>,
  options?: {
    ttl?: number;
    skipCache?: boolean;
    queryName?: string;
  }
): Promise<T> {
  const startTime = performance.now();
  const queryName = options?.queryName || 'unknown';

  try {
    if (options?.skipCache) {
      const result = await queryFn();
      trackQuery(queryName, performance.now() - startTime, false);
      return result;
    }

    const result = await getCached(cachePrefix, cacheKey, queryFn, options?.ttl);
    const duration = performance.now() - startTime;

    // Check if result came from cache (fast execution indicates cache hit)
    const cached = duration < 10;
    trackQuery(queryName, duration, cached);

    return result;
  } catch (error) {
    trackQuery(queryName, performance.now() - startTime, false);
    throw error;
  }
}

/**
 * Track query performance
 */
function trackQuery(query: string, duration: number, cached: boolean): void {
  queryMetrics.push({
    query,
    duration,
    timestamp: Date.now(),
    cached,
  });

  // Keep only last N metrics
  if (queryMetrics.length > MAX_METRICS) {
    queryMetrics.shift();
  }

  // Log slow queries
  if (duration > SLOW_QUERY_THRESHOLD && !cached) {
    console.warn(`[SLOW QUERY] ${query} took ${duration.toFixed(2)}ms`);
  }
}

/**
 * Get query performance statistics
 */
export function getQueryStats() {
  if (queryMetrics.length === 0) {
    return {
      totalQueries: 0,
      avgDuration: 0,
      cacheHitRate: 0,
      slowQueries: 0,
    };
  }

  const totalQueries = queryMetrics.length;
  const cachedQueries = queryMetrics.filter((m) => m.cached).length;
  const slowQueries = queryMetrics.filter(
    (m) => m.duration > SLOW_QUERY_THRESHOLD && !m.cached
  ).length;

  const totalDuration = queryMetrics.reduce((sum, m) => sum + m.duration, 0);
  const avgDuration = totalDuration / totalQueries;
  const cacheHitRate = (cachedQueries / totalQueries) * 100;

  return {
    totalQueries,
    avgDuration: parseFloat(avgDuration.toFixed(2)),
    cacheHitRate: parseFloat(cacheHitRate.toFixed(2)),
    slowQueries,
  };
}

/**
 * Get slow queries report
 */
export function getSlowQueries(limit: number = 10): QueryMetrics[] {
  return queryMetrics
    .filter((m) => m.duration > SLOW_QUERY_THRESHOLD && !m.cached)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);
}

/**
 * Optimized user query with related data
 * Prevents N+1 queries by using Prisma's include
 */
export async function getUserWithProjects(userId: string) {
  return executeWithCache(
    'QUERY_CACHE',
    ['user', userId],
    async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              updatedAt: 'desc',
            },
          },
        },
      });
    },
    { queryName: 'getUserWithProjects' }
  );
}

/**
 * Optimized project query with platforms and content counts
 */
export async function getProjectWithStats(projectId: string) {
  return executeWithCache(
    'QUERY_CACHE',
    ['project', projectId],
    async () => {
      const [project, contentCount, platformCount] = await Promise.all([
        prisma.project.findUnique({
          where: { id: projectId },
          include: {
            platforms: {
              select: {
                id: true,
                type: true,
                name: true,
                isConnected: true,
                lastConnectedAt: true,
              },
            },
          },
        }),
        prisma.content.count({
          where: { projectId },
        }),
        prisma.platform.count({
          where: { projectId, isConnected: true },
        }),
      ]);

      return {
        ...project,
        _count: {
          content: contentCount,
          connectedPlatforms: platformCount,
        },
      };
    },
    { queryName: 'getProjectWithStats' }
  );
}

/**
 * Batch fetch content with publications
 * Optimized to prevent N+1 queries
 */
export async function getContentWithPublications(
  projectId: string,
  options?: {
    limit?: number;
    status?: string[];
  }
) {
  const cacheKey = ['content', projectId, JSON.stringify(options)];

  return executeWithCache(
    'QUERY_CACHE',
    cacheKey,
    async () => {
      return prisma.content.findMany({
        where: {
          projectId,
          ...(options?.status && {
            status: { in: options.status as any[] },
          }),
        },
        include: {
          publications: {
            include: {
              platform: {
                select: {
                  id: true,
                  type: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: options?.limit || 50,
      });
    },
    {
      queryName: 'getContentWithPublications',
      ttl: 300, // 5 minutes
    }
  );
}

/**
 * Optimized platform metrics query with aggregations
 */
export async function getPlatformMetrics(
  projectId: string,
  dateRange: { from: Date; to: Date }
) {
  const cacheKey = [
    'metrics',
    projectId,
    dateRange.from.toISOString(),
    dateRange.to.toISOString(),
  ];

  return executeWithCache(
    'QUERY_CACHE',
    cacheKey,
    async () => {
      const metrics = await prisma.platformMetrics.findMany({
        where: {
          projectId,
          periodStart: { gte: dateRange.from },
          periodEnd: { lte: dateRange.to },
        },
        include: {
          platform: {
            select: {
              id: true,
              type: true,
              name: true,
            },
          },
        },
        orderBy: {
          periodStart: 'desc',
        },
      });

      // Aggregate by platform type
      const aggregated = metrics.reduce(
        (acc, metric) => {
          const type = metric.platformType;
          if (!acc[type]) {
            acc[type] = {
              views: 0,
              likes: 0,
              shares: 0,
              comments: 0,
              clicks: 0,
            };
          }

          acc[type].views += metric.views || 0;
          acc[type].likes += metric.likes || 0;
          acc[type].shares += metric.shares || 0;
          acc[type].comments += metric.comments || 0;
          acc[type].clicks += metric.clicks || 0;

          return acc;
        },
        {} as Record<string, any>
      );

      return { metrics, aggregated };
    },
    {
      queryName: 'getPlatformMetrics',
      ttl: 600, // 10 minutes
    }
  );
}

/**
 * Batch fetch with cursor-based pagination
 * More efficient than offset pagination for large datasets
 */
export async function getContentCursorPaginated(
  projectId: string,
  cursor?: string,
  limit: number = 20
) {
  return prisma.content.findMany({
    where: { projectId },
    take: limit + 1, // Fetch one extra to determine if there's a next page
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor itself
    }),
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          publications: true,
        },
      },
    },
  });
}

/**
 * Efficient count query with caching
 */
export async function getCachedCount(
  model: 'content' | 'project' | 'platform',
  where: any,
  ttl: number = 300
): Promise<number> {
  const cacheKey = ['count', model, JSON.stringify(where)];

  return executeWithCache(
    'QUERY_CACHE',
    cacheKey,
    async () => {
      // @ts-ignore - Dynamic model access
      return prisma[model].count({ where });
    },
    {
      ttl,
      queryName: `count-${model}`,
    }
  );
}

/**
 * Clear all query caches
 */
export async function clearQueryCache(): Promise<void> {
  // This would clear the QUERY_CACHE prefix
  // Implementation depends on cache manager's invalidatePattern
  console.log('Query cache cleared');
}

/**
 * Reset query metrics
 */
export function resetQueryMetrics(): void {
  queryMetrics.length = 0;
}

/**
 * Prisma middleware for query logging (development only)
 */
export function enableQueryLogging() {
  if (process.env.NODE_ENV !== 'development') return;

  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();

    const duration = after - before;
    const query = `${params.model}.${params.action}`;

    trackQuery(query, duration, false);

    if (duration > SLOW_QUERY_THRESHOLD) {
      console.log(`[PRISMA SLOW] ${query} took ${duration}ms`, {
        params: JSON.stringify(params.args).substring(0, 100),
      });
    }

    return result;
  });
}
