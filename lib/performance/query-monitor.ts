/**
 * Query Monitoring & Slow Query Logging
 *
 * Provides real-time query performance monitoring:
 * - Slow query detection and logging
 * - Query execution plan analysis (preparation)
 * - Performance bottleneck identification
 * - Query optimization recommendations
 */

import { prisma } from '@/lib/db';

// Slow query thresholds by operation type
const SLOW_QUERY_THRESHOLDS = {
  // Simple lookups (ms)
  findUnique: 50,
  findFirst: 50,

  // List queries
  findMany: 100,

  // Aggregations
  count: 75,
  aggregate: 150,
  groupBy: 200,

  // Write operations
  create: 75,
  update: 75,
  delete: 50,

  // Batch operations
  createMany: 200,
  updateMany: 200,
  deleteMany: 150,

  // Default for unknown operations
  default: 100,
} as const;

interface QueryLog {
  id: string;
  model: string;
  operation: string;
  duration: number;
  timestamp: Date;
  args?: any;
  error?: string;
  stack?: string;
}

class QueryMonitor {
  private logs: QueryLog[] = [];
  private maxLogs = 1000;
  private enabled = process.env.ENABLE_QUERY_MONITORING === 'true';

  /**
   * Log a query execution
   */
  logQuery(log: Omit<QueryLog, 'id' | 'timestamp'>): void {
    if (!this.enabled) return;

    const entry: QueryLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...log,
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Check if slow query
    const threshold = this.getThreshold(log.operation);
    if (log.duration > threshold) {
      this.logSlowQuery(entry);
    }
  }

  /**
   * Get threshold for operation
   */
  private getThreshold(operation: string): number {
    return (
      SLOW_QUERY_THRESHOLDS[operation as keyof typeof SLOW_QUERY_THRESHOLDS] ||
      SLOW_QUERY_THRESHOLDS.default
    );
  }

  /**
   * Log slow query with details
   */
  private logSlowQuery(log: QueryLog): void {
    console.warn('[SLOW QUERY DETECTED]', {
      model: log.model,
      operation: log.operation,
      duration: `${log.duration.toFixed(2)}ms`,
      threshold: `${this.getThreshold(log.operation)}ms`,
      timestamp: log.timestamp.toISOString(),
      // Only log first 100 chars of args to avoid huge logs
      args: JSON.stringify(log.args).substring(0, 100),
    });

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, DataDog, etc.
      // Sentry.captureMessage('Slow query detected', { extra: log });
    }
  }

  /**
   * Get all slow queries
   */
  getSlowQueries(limit: number = 50): QueryLog[] {
    return this.logs
      .filter((log) => log.duration > this.getThreshold(log.operation))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get query statistics
   */
  getStatistics() {
    if (this.logs.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        errorRate: 0,
        byModel: {},
        byOperation: {},
      };
    }

    const totalQueries = this.logs.length;
    const slowQueries = this.logs.filter(
      (log) => log.duration > this.getThreshold(log.operation)
    ).length;
    const errors = this.logs.filter((log) => log.error).length;

    const totalDuration = this.logs.reduce((sum, log) => sum + log.duration, 0);
    const averageDuration = totalDuration / totalQueries;

    // Group by model
    const byModel: Record<string, { count: number; avgDuration: number }> = {};
    this.logs.forEach((log) => {
      if (!byModel[log.model]) {
        byModel[log.model] = { count: 0, avgDuration: 0 };
      }
      byModel[log.model].count++;
    });

    // Calculate average duration per model
    Object.keys(byModel).forEach((model) => {
      const modelLogs = this.logs.filter((log) => log.model === model);
      const modelDuration = modelLogs.reduce((sum, log) => sum + log.duration, 0);
      byModel[model].avgDuration = modelDuration / modelLogs.length;
    });

    // Group by operation
    const byOperation: Record<string, { count: number; avgDuration: number }> = {};
    this.logs.forEach((log) => {
      if (!byOperation[log.operation]) {
        byOperation[log.operation] = { count: 0, avgDuration: 0 };
      }
      byOperation[log.operation].count++;
    });

    // Calculate average duration per operation
    Object.keys(byOperation).forEach((operation) => {
      const opLogs = this.logs.filter((log) => log.operation === operation);
      const opDuration = opLogs.reduce((sum, log) => sum + log.duration, 0);
      byOperation[operation].avgDuration = opDuration / opLogs.length;
    });

    return {
      totalQueries,
      averageDuration: parseFloat(averageDuration.toFixed(2)),
      slowQueries,
      errorRate: parseFloat(((errors / totalQueries) * 100).toFixed(2)),
      byModel,
      byOperation,
    };
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs for analysis
   */
  exportLogs(): QueryLog[] {
    return [...this.logs];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton instance
export const queryMonitor = new QueryMonitor();

/**
 * Prisma middleware for query monitoring
 */
export function enableQueryMonitoring() {
  prisma.$use(async (params, next) => {
    const start = performance.now();

    try {
      const result = await next(params);
      const duration = performance.now() - start;

      queryMonitor.logQuery({
        model: params.model || 'unknown',
        operation: params.action,
        duration,
        args: params.args,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      queryMonitor.logQuery({
        model: params.model || 'unknown',
        operation: params.action,
        duration,
        args: params.args,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  });
}

/**
 * Get query optimization recommendations
 */
export function getOptimizationRecommendations(): Array<{
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedQueries: number;
}> {
  const recommendations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    affectedQueries: number;
  }> = [];

  const stats = queryMonitor.getStatistics();
  const slowQueries = queryMonitor.getSlowQueries();

  // Check for high error rate
  if (stats.errorRate > 5) {
    recommendations.push({
      type: 'error-rate',
      severity: 'critical',
      message: `High error rate detected: ${stats.errorRate}%. Review failed queries.`,
      affectedQueries: Math.round((stats.errorRate / 100) * stats.totalQueries),
    });
  }

  // Check for slow queries
  if (slowQueries.length > stats.totalQueries * 0.1) {
    recommendations.push({
      type: 'slow-queries',
      severity: 'high',
      message: `${slowQueries.length} slow queries detected (${((slowQueries.length / stats.totalQueries) * 100).toFixed(1)}% of total). Consider adding indexes or optimizing queries.`,
      affectedQueries: slowQueries.length,
    });
  }

  // Check for models with high average duration
  Object.entries(stats.byModel).forEach(([model, { avgDuration, count }]) => {
    if (avgDuration > 150 && count > 10) {
      recommendations.push({
        type: 'slow-model',
        severity: 'medium',
        message: `Model "${model}" has high average query duration (${avgDuration.toFixed(2)}ms). Consider optimizing ${model} queries or adding indexes.`,
        affectedQueries: count,
      });
    }
  });

  // Check for operations with high average duration
  Object.entries(stats.byOperation).forEach(([operation, { avgDuration, count }]) => {
    const threshold = SLOW_QUERY_THRESHOLDS[operation as keyof typeof SLOW_QUERY_THRESHOLDS] || 100;
    if (avgDuration > threshold * 2 && count > 5) {
      recommendations.push({
        type: 'slow-operation',
        severity: 'medium',
        message: `Operation "${operation}" is consistently slow (avg ${avgDuration.toFixed(2)}ms, threshold ${threshold}ms). Review query patterns.`,
        affectedQueries: count,
      });
    }
  });

  return recommendations.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Generate query performance report
 */
export function generatePerformanceReport(): string {
  const stats = queryMonitor.getStatistics();
  const slowQueries = queryMonitor.getSlowQueries(10);
  const recommendations = getOptimizationRecommendations();

  const report = [
    '=== Query Performance Report ===\n',
    `Total Queries: ${stats.totalQueries}`,
    `Average Duration: ${stats.averageDuration}ms`,
    `Slow Queries: ${stats.slowQueries} (${((stats.slowQueries / stats.totalQueries) * 100).toFixed(1)}%)`,
    `Error Rate: ${stats.errorRate}%`,
    '\n=== Top 10 Slowest Queries ===',
    ...slowQueries.map((q, i) =>
      `${i + 1}. ${q.model}.${q.operation} - ${q.duration.toFixed(2)}ms`
    ),
    '\n=== Optimization Recommendations ===',
    ...recommendations.map((r, i) =>
      `${i + 1}. [${r.severity.toUpperCase()}] ${r.message}`
    ),
    '\n=== Query Count by Model ===',
    ...Object.entries(stats.byModel).map(
      ([model, { count, avgDuration }]) =>
        `${model}: ${count} queries (avg ${avgDuration.toFixed(2)}ms)`
    ),
  ].join('\n');

  return report;
}
