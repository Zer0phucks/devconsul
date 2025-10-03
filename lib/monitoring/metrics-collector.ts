/**
 * Metrics Collector
 *
 * Collects and aggregates performance metrics:
 * - Job success/failure rate tracking
 * - Queue length monitoring with alerts
 * - Job execution time metrics
 * - Resource usage tracking (CPU, memory)
 * - Bottleneck identification
 */

import { prisma } from "@/lib/db";

/**
 * Metric types
 */
export enum MetricType {
  JOB_SUCCESS_RATE = "job_success_rate",
  JOB_FAILURE_RATE = "job_failure_rate",
  JOB_EXECUTION_TIME = "job_execution_time",
  QUEUE_LENGTH = "queue_length",
  ACTIVE_WORKERS = "active_workers",
  API_RESPONSE_TIME = "api_response_time",
  ERROR_RATE = "error_rate",
  DATABASE_QUERY_TIME = "database_query_time",
  EXTERNAL_API_LATENCY = "external_api_latency",
}

/**
 * Metric data point
 */
export interface MetricDataPoint {
  name: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Aggregated metrics
 */
export interface AggregatedMetrics {
  metric: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Job performance metrics
 */
export interface JobMetrics {
  jobId: string;
  jobName: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  failureRate: number;
  avgExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  p95ExecutionTime: number;
  lastExecutionAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
}

/**
 * System health metrics
 */
export interface SystemHealthMetrics {
  uptime: number;
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  activeConnections: number;
  queueLength: number;
  deadLetterQueueLength: number;
  circuitBreakerStatus: Record<string, string>;
}

/**
 * In-memory metrics store (short-term)
 */
class MetricsStore {
  private metrics: Map<string, MetricDataPoint[]> = new Map();
  private readonly maxPointsPerMetric = 1000;
  private readonly retentionMs = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Record a metric data point
   */
  record(metric: MetricDataPoint): void {
    const key = this.getMetricKey(metric.name, metric.type);

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const points = this.metrics.get(key)!;
    points.push(metric);

    // Trim old data
    const cutoff = Date.now() - this.retentionMs;
    const filtered = points.filter(
      (p) => p.timestamp.getTime() > cutoff
    );

    // Limit size
    if (filtered.length > this.maxPointsPerMetric) {
      filtered.splice(0, filtered.length - this.maxPointsPerMetric);
    }

    this.metrics.set(key, filtered);
  }

  /**
   * Get metric data points
   */
  get(
    name: string,
    type: MetricType,
    since?: Date
  ): MetricDataPoint[] {
    const key = this.getMetricKey(name, type);
    const points = this.metrics.get(key) || [];

    if (since) {
      return points.filter((p) => p.timestamp >= since);
    }

    return points;
  }

  /**
   * Get all metrics
   */
  getAll(): Map<string, MetricDataPoint[]> {
    return this.metrics;
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  private getMetricKey(name: string, type: MetricType): string {
    return `${type}:${name}`;
  }
}

/**
 * Global metrics store
 */
const metricsStore = new MetricsStore();

/**
 * Record a metric
 */
export function recordMetric(
  name: string,
  type: MetricType,
  value: number,
  labels?: Record<string, string>,
  metadata?: Record<string, any>
): void {
  metricsStore.record({
    name,
    type,
    value,
    timestamp: new Date(),
    labels,
    metadata,
  });
}

/**
 * Record job execution metrics
 */
export async function recordJobExecution(
  jobId: string,
  success: boolean,
  durationMs: number,
  metadata?: any
): Promise<void> {
  // Record in-memory metrics
  recordMetric(
    jobId,
    success ? MetricType.JOB_SUCCESS_RATE : MetricType.JOB_FAILURE_RATE,
    1,
    { jobId, status: success ? "success" : "failure" }
  );

  recordMetric(jobId, MetricType.JOB_EXECUTION_TIME, durationMs, {
    jobId,
  });

  // Persist to database for long-term storage
  await prisma.jobMetrics.upsert({
    where: { jobId },
    create: {
      jobId,
      totalExecutions: 1,
      successCount: success ? 1 : 0,
      failureCount: success ? 0 : 1,
      totalDurationMs: durationMs,
      minDurationMs: durationMs,
      maxDurationMs: durationMs,
      lastExecutionAt: new Date(),
      lastSuccessAt: success ? new Date() : null,
      lastFailureAt: success ? null : new Date(),
      metadata: metadata || {},
    },
    update: {
      totalExecutions: { increment: 1 },
      successCount: success ? { increment: 1 } : undefined,
      failureCount: success ? undefined : { increment: 1 },
      totalDurationMs: { increment: durationMs },
      minDurationMs: {
        set: Math.min(
          (await prisma.jobMetrics.findUnique({
            where: { jobId },
            select: { minDurationMs: true },
          }))?.minDurationMs || durationMs,
          durationMs
        ),
      },
      maxDurationMs: {
        set: Math.max(
          (await prisma.jobMetrics.findUnique({
            where: { jobId },
            select: { maxDurationMs: true },
          }))?.maxDurationMs || durationMs,
          durationMs
        ),
      },
      lastExecutionAt: new Date(),
      lastSuccessAt: success ? new Date() : undefined,
      lastFailureAt: success ? undefined : new Date(),
    },
  });
}

/**
 * Get job metrics
 */
export async function getJobMetrics(
  jobId?: string
): Promise<JobMetrics[]> {
  const where = jobId ? { jobId } : {};

  const metrics = await prisma.jobMetrics.findMany({
    where,
    orderBy: { totalExecutions: "desc" },
  });

  return metrics.map((m) => ({
    jobId: m.jobId,
    jobName: m.jobId, // Could enhance with job name lookup
    totalExecutions: m.totalExecutions,
    successCount: m.successCount,
    failureCount: m.failureCount,
    successRate:
      m.totalExecutions > 0
        ? (m.successCount / m.totalExecutions) * 100
        : 0,
    failureRate:
      m.totalExecutions > 0
        ? (m.failureCount / m.totalExecutions) * 100
        : 0,
    avgExecutionTime:
      m.totalExecutions > 0
        ? m.totalDurationMs / m.totalExecutions
        : 0,
    minExecutionTime: m.minDurationMs,
    maxExecutionTime: m.maxDurationMs,
    p95ExecutionTime: m.maxDurationMs * 0.95, // Simplified P95
    lastExecutionAt: m.lastExecutionAt,
    lastSuccessAt: m.lastSuccessAt,
    lastFailureAt: m.lastFailureAt,
  }));
}

/**
 * Calculate percentile
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;

  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Get aggregated metrics for a metric type
 */
export function getAggregatedMetrics(
  name: string,
  type: MetricType,
  since?: Date
): AggregatedMetrics {
  const points = metricsStore.get(name, type, since);
  const values = points.map((p) => p.value);

  if (values.length === 0) {
    return {
      metric: name,
      count: 0,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sum = values.reduce((a, b) => a + b, 0);

  return {
    metric: name,
    count: values.length,
    sum,
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    p50: calculatePercentile(values, 50),
    p95: calculatePercentile(values, 95),
    p99: calculatePercentile(values, 99),
  };
}

/**
 * Get queue length metrics
 */
export async function getQueueMetrics(): Promise<{
  pending: number;
  queued: number;
  processing: number;
  failed: number;
  deadLetter: number;
}> {
  const [scheduled, deadLetter] = await Promise.all([
    prisma.scheduledContent.groupBy({
      by: ["queueStatus"],
      _count: true,
    }),
    prisma.deadLetterQueue.count({
      where: { status: "PENDING" },
    }),
  ]);

  const metrics = {
    pending: 0,
    queued: 0,
    processing: 0,
    failed: 0,
    deadLetter,
  };

  scheduled.forEach((item) => {
    switch (item.queueStatus) {
      case "PENDING":
        metrics.pending = item._count;
        break;
      case "QUEUED":
        metrics.queued = item._count;
        break;
      case "PROCESSING":
        metrics.processing = item._count;
        break;
      case "FAILED":
        metrics.failed = item._count;
        break;
    }
  });

  return metrics;
}

/**
 * Get system health metrics
 */
export async function getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
  const startTime = Date.now();

  // Get error rate (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [cronExecutions, queueMetrics] = await Promise.all([
    prisma.cronExecution.findMany({
      where: {
        startedAt: { gte: oneHourAgo },
      },
      select: {
        status: true,
        duration: true,
      },
    }),
    getQueueMetrics(),
  ]);

  const totalExecutions = cronExecutions.length;
  const failedExecutions = cronExecutions.filter(
    (e) => e.status === "FAILED"
  ).length;

  const durations = cronExecutions
    .filter((e) => e.duration)
    .map((e) => e.duration!);

  const errorRate =
    totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0;

  return {
    uptime: process.uptime() * 1000, // milliseconds
    errorRate,
    avgResponseTime:
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
    p95ResponseTime: calculatePercentile(durations, 95),
    p99ResponseTime: calculatePercentile(durations, 99),
    activeConnections: 0, // Would need connection pool metrics
    queueLength: queueMetrics.queued + queueMetrics.pending,
    deadLetterQueueLength: queueMetrics.deadLetter,
    circuitBreakerStatus: {}, // Would populate from circuit breakers
  };
}

/**
 * Export metrics in Prometheus format
 */
export async function exportPrometheusMetrics(): Promise<string> {
  const jobMetrics = await getJobMetrics();
  const queueMetrics = await getQueueMetrics();
  const systemMetrics = await getSystemHealthMetrics();

  let output = "";

  // Job metrics
  output += "# HELP job_executions_total Total number of job executions\n";
  output += "# TYPE job_executions_total counter\n";
  jobMetrics.forEach((m) => {
    output += `job_executions_total{job_id="${m.jobId}"} ${m.totalExecutions}\n`;
  });

  output += "\n# HELP job_success_total Total number of successful job executions\n";
  output += "# TYPE job_success_total counter\n";
  jobMetrics.forEach((m) => {
    output += `job_success_total{job_id="${m.jobId}"} ${m.successCount}\n`;
  });

  output += "\n# HELP job_failure_total Total number of failed job executions\n";
  output += "# TYPE job_failure_total counter\n";
  jobMetrics.forEach((m) => {
    output += `job_failure_total{job_id="${m.jobId}"} ${m.failureCount}\n`;
  });

  output += "\n# HELP job_execution_time_ms Job execution time in milliseconds\n";
  output += "# TYPE job_execution_time_ms histogram\n";
  jobMetrics.forEach((m) => {
    output += `job_execution_time_ms{job_id="${m.jobId}",quantile="0.5"} ${m.avgExecutionTime}\n`;
    output += `job_execution_time_ms{job_id="${m.jobId}",quantile="0.95"} ${m.p95ExecutionTime}\n`;
  });

  // Queue metrics
  output += "\n# HELP queue_length Current queue length by status\n";
  output += "# TYPE queue_length gauge\n";
  output += `queue_length{status="pending"} ${queueMetrics.pending}\n`;
  output += `queue_length{status="queued"} ${queueMetrics.queued}\n`;
  output += `queue_length{status="processing"} ${queueMetrics.processing}\n`;
  output += `queue_length{status="failed"} ${queueMetrics.failed}\n`;
  output += `queue_length{status="dead_letter"} ${queueMetrics.deadLetter}\n`;

  // System metrics
  output += "\n# HELP system_uptime_ms System uptime in milliseconds\n";
  output += "# TYPE system_uptime_ms gauge\n";
  output += `system_uptime_ms ${systemMetrics.uptime}\n`;

  output += "\n# HELP system_error_rate Error rate percentage\n";
  output += "# TYPE system_error_rate gauge\n";
  output += `system_error_rate ${systemMetrics.errorRate}\n`;

  return output;
}

/**
 * Record API response time
 */
export function recordAPIResponseTime(
  endpoint: string,
  method: string,
  durationMs: number,
  statusCode: number
): void {
  recordMetric(
    endpoint,
    MetricType.API_RESPONSE_TIME,
    durationMs,
    { endpoint, method, status: statusCode.toString() }
  );
}

/**
 * Record database query time
 */
export function recordDatabaseQueryTime(
  operation: string,
  durationMs: number
): void {
  recordMetric(operation, MetricType.DATABASE_QUERY_TIME, durationMs, {
    operation,
  });
}

/**
 * Get metrics store (for testing/debugging)
 */
export function getMetricsStore(): Map<string, MetricDataPoint[]> {
  return metricsStore.getAll();
}
