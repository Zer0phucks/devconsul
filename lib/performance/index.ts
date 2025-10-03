/**
 * Performance Module - Main Export
 *
 * Centralized exports for all performance optimization features:
 * - Cache management
 * - Rate limiting
 * - Database optimization
 * - Query monitoring
 * - Performance metrics
 */

// Cache Management
export {
  getCached,
  setCached,
  deleteCached,
  invalidatePattern,
  getCacheStats,
  resetCacheStats,
  warmCache,
  getBatchCached,
  cacheExists,
  getCacheTTL,
  extendCacheTTL,
} from './cache-manager';

// Redis Configuration
export {
  redis,
  generateCacheKey,
  checkRedisHealth,
  clearCacheByPattern,
  CACHE_TTL,
  CACHE_KEYS,
  type CacheKeyPrefix,
  type CacheTTL,
} from './redis.config';

// Rate Limiting
export {
  checkRateLimit,
  checkIPRateLimit,
  trackGitHubAPIUsage,
  getRateLimitHeaders,
  getRequestIdentifier,
  rateLimitMiddleware,
  trackPlatformAPIUsage,
  getRateLimitStatus,
  resetRateLimit,
  RATE_LIMITS,
  type RateLimitTier,
} from './rate-limiter';

// Database Optimization
export {
  executeWithCache,
  getQueryStats,
  getSlowQueries,
  getUserWithProjects,
  getProjectWithStats,
  getContentWithPublications,
  getPlatformMetrics,
  getContentCursorPaginated,
  getCachedCount,
  clearQueryCache,
  resetQueryMetrics,
  enableQueryLogging,
} from './database-optimization';

// Connection Pool
export {
  createPrismaClient,
  checkConnectionPoolHealth,
  getPoolStats,
  createReadReplicaClient,
  shouldUseReadReplica,
  enableConnectionMonitoring,
  gracefulShutdown,
  connectWithRetry,
  connectionPoolExtension,
  CONNECTION_POOL_CONFIG,
  READ_REPLICA_CONFIG,
  type PoolStats,
} from './connection-pool';

// Query Monitoring
export {
  queryMonitor,
  enableQueryMonitoring,
  getOptimizationRecommendations,
  generatePerformanceReport as generateQueryPerformanceReport,
} from './query-monitor';

// Performance Metrics
export {
  collectPerformanceMetrics,
  getPerformanceSummary,
  generatePerformanceReport,
  exportMetricsJSON,
  isPerformanceDegraded,
  performanceMonitoringMiddleware,
  initializePerformanceMonitoring,
  getPerformanceDashboard,
  type PerformanceMetrics,
} from './performance-metrics';

/**
 * Quick Setup Guide
 *
 * 1. Initialize performance monitoring in your app:
 *    ```typescript
 *    import { initializePerformanceMonitoring, enableQueryMonitoring } from '@/lib/performance';
 *
 *    initializePerformanceMonitoring();
 *    enableQueryMonitoring();
 *    ```
 *
 * 2. Use caching in your API routes:
 *    ```typescript
 *    import { getCached } from '@/lib/performance';
 *
 *    const data = await getCached(
 *      'GITHUB_ACTIVITY',
 *      projectId,
 *      async () => fetchFromGitHub(projectId),
 *      900 // 15 minutes TTL
 *    );
 *    ```
 *
 * 3. Add rate limiting to API routes:
 *    ```typescript
 *    import { rateLimitMiddleware } from '@/lib/performance';
 *
 *    export async function GET(request: NextRequest) {
 *      const rateLimitResponse = await rateLimitMiddleware(request, userId);
 *      if (rateLimitResponse) return rateLimitResponse;
 *
 *      // Your API logic here
 *    }
 *    ```
 *
 * 4. Use optimized database queries:
 *    ```typescript
 *    import { executeWithCache } from '@/lib/performance';
 *
 *    const project = await executeWithCache(
 *      'QUERY_CACHE',
 *      ['project', projectId],
 *      async () => prisma.project.findUnique({ where: { id: projectId } }),
 *      { ttl: 300, queryName: 'getProject' }
 *    );
 *    ```
 *
 * 5. Monitor performance:
 *    ```typescript
 *    import { getPerformanceDashboard } from '@/lib/performance';
 *
 *    const dashboard = await getPerformanceDashboard();
 *    console.log(dashboard);
 *    ```
 */
