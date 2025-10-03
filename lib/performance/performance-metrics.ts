/**
 * Performance Metrics Collection & Reporting
 *
 * Tracks comprehensive performance metrics:
 * - Cache hit rates
 * - Query execution times
 * - Rate limit usage
 * - API response times
 * - Resource utilization
 */

import { getCacheStats } from './cache-manager';
import { getQueryStats } from './database-optimization';
import { queryMonitor, getOptimizationRecommendations } from './query-monitor';
import { checkRedisHealth, getCacheStats as getRedisStats } from './redis.config';

export interface PerformanceMetrics {
  timestamp: Date;
  cache: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    totalSets: number;
    errors: number;
    redisHealth: boolean;
    keyDistribution?: Record<string, number>;
  };
  database: {
    totalQueries: number;
    avgDuration: number;
    cacheHitRate: number;
    slowQueries: number;
  };
  system: {
    uptime: number;
    memory?: NodeJS.MemoryUsage;
    processUptime: number;
  };
}

/**
 * Collect all performance metrics
 */
export async function collectPerformanceMetrics(): Promise<PerformanceMetrics> {
  const [cacheStats, queryStats, redisHealth, redisKeyStats] = await Promise.all([
    Promise.resolve(getCacheStats()),
    Promise.resolve(getQueryStats()),
    checkRedisHealth(),
    getRedisStats(),
  ]);

  return {
    timestamp: new Date(),
    cache: {
      hitRate: cacheStats.hitRate,
      totalHits: cacheStats.hits,
      totalMisses: cacheStats.misses,
      totalSets: cacheStats.sets,
      errors: cacheStats.errors,
      redisHealth,
      keyDistribution: redisKeyStats.keysByPrefix,
    },
    database: {
      totalQueries: queryStats.totalQueries,
      avgDuration: queryStats.avgDuration,
      cacheHitRate: queryStats.cacheHitRate,
      slowQueries: queryStats.slowQueries,
    },
    system: {
      uptime: Date.now(),
      memory: process.memoryUsage(),
      processUptime: process.uptime(),
    },
  };
}

/**
 * Get performance summary
 */
export async function getPerformanceSummary(): Promise<{
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  metrics: PerformanceMetrics;
  recommendations: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
}> {
  const metrics = await collectPerformanceMetrics();
  const recommendations = getOptimizationRecommendations();

  // Calculate performance score (0-100)
  let score = 100;

  // Cache hit rate impact (30 points)
  const cacheHitRateScore = (metrics.cache.hitRate / 100) * 30;
  score = score - 30 + cacheHitRateScore;

  // Database performance impact (40 points)
  const dbScore = Math.max(
    0,
    40 -
      (metrics.database.avgDuration / 100) * 10 - // Penalize slow queries
      (metrics.database.slowQueries / metrics.database.totalQueries) * 100 * 30 // Penalize slow query ratio
  );
  score = score - 40 + dbScore;

  // Cache errors impact (10 points)
  if (metrics.cache.errors > 0) {
    score -= Math.min(10, metrics.cache.errors);
  }

  // Redis health impact (10 points)
  if (!metrics.cache.redisHealth) {
    score -= 10;
  }

  // System health impact (10 points)
  const memoryUsage = metrics.system.memory
    ? (metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100
    : 0;
  if (memoryUsage > 90) {
    score -= 10;
  } else if (memoryUsage > 80) {
    score -= 5;
  }

  // Determine overall rating
  let overall: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 90) {
    overall = 'excellent';
  } else if (score >= 75) {
    overall = 'good';
  } else if (score >= 60) {
    overall = 'fair';
  } else {
    overall = 'poor';
  }

  return {
    overall,
    score: Math.max(0, Math.min(100, score)),
    metrics,
    recommendations,
  };
}

/**
 * Generate performance report
 */
export async function generatePerformanceReport(): Promise<string> {
  const summary = await getPerformanceSummary();
  const { metrics } = summary;

  const report = [
    '=== PERFORMANCE REPORT ===',
    `Generated: ${metrics.timestamp.toISOString()}`,
    `Overall Rating: ${summary.overall.toUpperCase()} (${summary.score.toFixed(1)}/100)`,
    '',
    '--- CACHE PERFORMANCE ---',
    `Hit Rate: ${metrics.cache.hitRate.toFixed(2)}%`,
    `Total Hits: ${metrics.cache.totalHits}`,
    `Total Misses: ${metrics.cache.totalMisses}`,
    `Cache Sets: ${metrics.cache.totalSets}`,
    `Errors: ${metrics.cache.errors}`,
    `Redis Health: ${metrics.cache.redisHealth ? 'HEALTHY' : 'UNHEALTHY'}`,
    '',
    '--- DATABASE PERFORMANCE ---',
    `Total Queries: ${metrics.database.totalQueries}`,
    `Avg Query Duration: ${metrics.database.avgDuration.toFixed(2)}ms`,
    `Query Cache Hit Rate: ${metrics.database.cacheHitRate.toFixed(2)}%`,
    `Slow Queries: ${metrics.database.slowQueries}`,
    '',
    '--- SYSTEM METRICS ---',
    `Process Uptime: ${(metrics.system.processUptime / 60).toFixed(2)} minutes`,
    ...(metrics.system.memory
      ? [
          `Memory Usage: ${((metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100).toFixed(2)}%`,
          `Heap Used: ${(metrics.system.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          `Heap Total: ${(metrics.system.memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        ]
      : []),
    '',
    '--- OPTIMIZATION RECOMMENDATIONS ---',
    ...(summary.recommendations.length > 0
      ? summary.recommendations.map(
          (r, i) => `${i + 1}. [${r.severity.toUpperCase()}] ${r.message}`
        )
      : ['No recommendations at this time.']),
    '',
    '=== END REPORT ===',
  ].join('\n');

  return report;
}

/**
 * Export metrics for external monitoring
 */
export async function exportMetricsJSON(): Promise<string> {
  const summary = await getPerformanceSummary();
  return JSON.stringify(summary, null, 2);
}

/**
 * Check if performance is degraded
 */
export async function isPerformanceDegraded(): Promise<{
  degraded: boolean;
  reasons: string[];
}> {
  const summary = await getPerformanceSummary();
  const reasons: string[] = [];

  if (summary.score < 60) {
    reasons.push(`Overall performance score is low: ${summary.score.toFixed(1)}/100`);
  }

  if (summary.metrics.cache.hitRate < 50) {
    reasons.push(`Cache hit rate is below 50%: ${summary.metrics.cache.hitRate.toFixed(2)}%`);
  }

  if (summary.metrics.database.avgDuration > 200) {
    reasons.push(
      `Average query duration is high: ${summary.metrics.database.avgDuration.toFixed(2)}ms`
    );
  }

  if (!summary.metrics.cache.redisHealth) {
    reasons.push('Redis health check failed');
  }

  const slowQueryRatio =
    summary.metrics.database.slowQueries / summary.metrics.database.totalQueries;
  if (slowQueryRatio > 0.2) {
    reasons.push(
      `High slow query ratio: ${(slowQueryRatio * 100).toFixed(2)}% of queries are slow`
    );
  }

  return {
    degraded: reasons.length > 0,
    reasons,
  };
}

/**
 * Performance monitoring middleware (for API routes)
 */
export function performanceMonitoringMiddleware() {
  return async function (req: Request, handler: () => Promise<Response>): Promise<Response> {
    const start = performance.now();

    try {
      const response = await handler();
      const duration = performance.now() - start;

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);

      // Log slow API responses
      if (duration > 1000) {
        console.warn(`[SLOW API] ${req.url} took ${duration.toFixed(2)}ms`);
      }

      return response;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`[API ERROR] ${req.url} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  };
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring() {
  // Set up periodic health checks
  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      const degraded = await isPerformanceDegraded();

      if (degraded.degraded) {
        console.warn('[PERFORMANCE DEGRADATION DETECTED]', degraded.reasons);
        // In production, you might send alerts here
      }
    }, 60000); // Check every minute
  }

  console.log('[PERFORMANCE MONITORING] Initialized');
}

/**
 * Get real-time performance dashboard data
 */
export async function getPerformanceDashboard() {
  const summary = await getPerformanceSummary();
  const queryMonitorStats = queryMonitor.getStatistics();

  return {
    status: summary.overall,
    score: summary.score,
    cache: {
      hitRate: summary.metrics.cache.hitRate,
      health: summary.metrics.cache.redisHealth ? 'healthy' : 'unhealthy',
      totalOperations:
        summary.metrics.cache.totalHits +
        summary.metrics.cache.totalMisses +
        summary.metrics.cache.totalSets,
    },
    database: {
      avgQueryTime: summary.metrics.database.avgDuration,
      slowQueries: summary.metrics.database.slowQueries,
      totalQueries: summary.metrics.database.totalQueries,
      byModel: queryMonitorStats.byModel,
      byOperation: queryMonitorStats.byOperation,
    },
    recommendations: summary.recommendations,
    timestamp: summary.metrics.timestamp,
  };
}
