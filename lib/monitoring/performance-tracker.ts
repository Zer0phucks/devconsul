/**
 * Performance Tracker
 *
 * Tracks and analyzes performance metrics:
 * - Job execution time trends
 * - API response time percentiles
 * - Bottleneck identification
 * - Performance regression detection
 * - Resource usage patterns
 */

import { prisma } from "@/lib/db";
import { recordMetric, MetricType, getAggregatedMetrics } from "./metrics-collector";

/**
 * Performance snapshot
 */
export interface PerformanceSnapshot {
  timestamp: Date;
  metrics: {
    avgJobExecutionTime: number;
    p95JobExecutionTime: number;
    p99JobExecutionTime: number;
    avgApiResponseTime: number;
    p95ApiResponseTime: number;
    p99ApiResponseTime: number;
    jobThroughput: number;
    errorRate: number;
  };
  bottlenecks: Bottleneck[];
}

/**
 * Performance bottleneck
 */
export interface Bottleneck {
  type: "job" | "api" | "database" | "external";
  name: string;
  severity: "low" | "medium" | "high";
  impact: string;
  metrics: {
    avgTime: number;
    p95Time: number;
    occurrences: number;
  };
  recommendation: string;
}

/**
 * Performance trend
 */
export interface PerformanceTrend {
  metric: string;
  direction: "improving" | "stable" | "degrading";
  changePercent: number;
  currentValue: number;
  previousValue: number;
  threshold: number;
}

/**
 * Track job performance
 */
export async function trackJobPerformance(
  jobId: string,
  durationMs: number,
  success: boolean
): Promise<void> {
  // Record metric
  recordMetric(jobId, MetricType.JOB_EXECUTION_TIME, durationMs, {
    jobId,
    status: success ? "success" : "failure",
  });

  // Update performance baseline
  await updatePerformanceBaseline(jobId, durationMs);
}

/**
 * Track API performance
 */
export function trackAPIPerformance(
  endpoint: string,
  method: string,
  durationMs: number,
  statusCode: number
): void {
  recordMetric(endpoint, MetricType.API_RESPONSE_TIME, durationMs, {
    endpoint,
    method,
    status: statusCode.toString(),
  });
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  operation: string,
  durationMs: number
): void {
  recordMetric(operation, MetricType.DATABASE_QUERY_TIME, durationMs, {
    operation,
  });
}

/**
 * Get current performance snapshot
 */
export async function getPerformanceSnapshot(): Promise<PerformanceSnapshot> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Get job metrics
  const jobMetrics = await prisma.jobMetrics.findMany({
    where: {
      updatedAt: { gte: oneHourAgo },
    },
  });

  const totalJobs = jobMetrics.reduce((sum, m) => sum + m.totalExecutions, 0);
  const totalDuration = jobMetrics.reduce(
    (sum, m) => sum + m.totalDurationMs,
    0
  );
  const failedJobs = jobMetrics.reduce((sum, m) => sum + m.failureCount, 0);

  const avgJobExecutionTime = totalJobs > 0 ? totalDuration / totalJobs : 0;
  const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

  // Calculate P95/P99 from individual job metrics
  const allMaxDurations = jobMetrics.map((m) => m.maxDurationMs);
  const p95JobExecutionTime = calculatePercentile(allMaxDurations, 95);
  const p99JobExecutionTime = calculatePercentile(allMaxDurations, 99);

  // Get API metrics (would need to aggregate from metrics store)
  const apiMetrics = {
    avg: 0,
    p95: 0,
    p99: 0,
  };

  // Identify bottlenecks
  const bottlenecks = await identifyBottlenecks();

  return {
    timestamp: now,
    metrics: {
      avgJobExecutionTime,
      p95JobExecutionTime,
      p99JobExecutionTime,
      avgApiResponseTime: apiMetrics.avg,
      p95ApiResponseTime: apiMetrics.p95,
      p99ApiResponseTime: apiMetrics.p99,
      jobThroughput: totalJobs,
      errorRate,
    },
    bottlenecks,
  };
}

/**
 * Identify performance bottlenecks
 */
export async function identifyBottlenecks(): Promise<Bottleneck[]> {
  const bottlenecks: Bottleneck[] = [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Check slow jobs
  const slowJobs = await prisma.jobMetrics.findMany({
    where: {
      updatedAt: { gte: oneHourAgo },
      maxDurationMs: { gt: 60000 }, // > 1 minute
    },
    orderBy: { maxDurationMs: "desc" },
    take: 5,
  });

  slowJobs.forEach((job) => {
    const avgTime =
      job.totalExecutions > 0
        ? job.totalDurationMs / job.totalExecutions
        : 0;

    let severity: "low" | "medium" | "high" = "low";
    if (avgTime > 120000) severity = "high"; // > 2 minutes
    else if (avgTime > 60000) severity = "medium"; // > 1 minute

    bottlenecks.push({
      type: "job",
      name: job.jobId,
      severity,
      impact: `Job taking ${Math.round(avgTime / 1000)}s on average`,
      metrics: {
        avgTime,
        p95Time: job.maxDurationMs * 0.95,
        occurrences: job.totalExecutions,
      },
      recommendation: getJobOptimizationRecommendation(job.jobId, avgTime),
    });
  });

  // Check high-failure jobs
  const failingJobs = await prisma.jobMetrics.findMany({
    where: {
      updatedAt: { gte: oneHourAgo },
      failureCount: { gt: 0 },
    },
    orderBy: { failureCount: "desc" },
    take: 5,
  });

  failingJobs.forEach((job) => {
    const failureRate =
      job.totalExecutions > 0
        ? (job.failureCount / job.totalExecutions) * 100
        : 0;

    if (failureRate > 10) {
      let severity: "low" | "medium" | "high" = "low";
      if (failureRate > 50) severity = "high";
      else if (failureRate > 25) severity = "medium";

      bottlenecks.push({
        type: "job",
        name: job.jobId,
        severity,
        impact: `${Math.round(failureRate)}% failure rate`,
        metrics: {
          avgTime: job.totalDurationMs / Math.max(job.totalExecutions, 1),
          p95Time: job.maxDurationMs * 0.95,
          occurrences: job.failureCount,
        },
        recommendation: `Investigate and fix failures in ${job.jobId}`,
      });
    }
  });

  return bottlenecks;
}

/**
 * Get job optimization recommendation
 */
function getJobOptimizationRecommendation(
  jobId: string,
  avgTimeMs: number
): string {
  if (avgTimeMs > 120000) {
    return `Consider breaking ${jobId} into smaller tasks or implementing batch processing`;
  } else if (avgTimeMs > 60000) {
    return `Review ${jobId} for optimization opportunities (database queries, external API calls)`;
  } else {
    return `Monitor ${jobId} performance trends`;
  }
}

/**
 * Detect performance regression
 */
export async function detectPerformanceRegression(
  jobId: string
): Promise<PerformanceTrend | null> {
  const job = await prisma.jobMetrics.findUnique({
    where: { jobId },
  });

  if (!job || job.totalExecutions < 10) {
    return null; // Not enough data
  }

  const currentAvg =
    job.totalExecutions > 0
      ? job.totalDurationMs / job.totalExecutions
      : 0;

  // Get baseline from performance baselines table
  const baseline = await prisma.performanceBaseline.findUnique({
    where: { jobId },
  });

  if (!baseline) {
    // Create baseline
    await prisma.performanceBaseline.create({
      data: {
        jobId,
        baselineAvgMs: currentAvg,
        baselineP95Ms: job.maxDurationMs * 0.95,
        sampleSize: job.totalExecutions,
        updatedAt: new Date(),
      },
    });
    return null;
  }

  const previousAvg = baseline.baselineAvgMs;
  const changePercent =
    ((currentAvg - previousAvg) / previousAvg) * 100;

  // Determine threshold (10% degradation is concerning)
  const threshold = 10;

  let direction: "improving" | "stable" | "degrading" = "stable";
  if (Math.abs(changePercent) < 5) {
    direction = "stable";
  } else if (changePercent > 0) {
    direction = "degrading";
  } else {
    direction = "improving";
  }

  return {
    metric: jobId,
    direction,
    changePercent,
    currentValue: currentAvg,
    previousValue: previousAvg,
    threshold,
  };
}

/**
 * Update performance baseline
 */
async function updatePerformanceBaseline(
  jobId: string,
  durationMs: number
): Promise<void> {
  const job = await prisma.jobMetrics.findUnique({
    where: { jobId },
  });

  if (!job || job.totalExecutions < 10) {
    return; // Wait for more samples
  }

  const avgDuration =
    job.totalExecutions > 0
      ? job.totalDurationMs / job.totalExecutions
      : 0;

  await prisma.performanceBaseline.upsert({
    where: { jobId },
    create: {
      jobId,
      baselineAvgMs: avgDuration,
      baselineP95Ms: job.maxDurationMs * 0.95,
      sampleSize: job.totalExecutions,
      updatedAt: new Date(),
    },
    update: {
      baselineAvgMs: avgDuration,
      baselineP95Ms: job.maxDurationMs * 0.95,
      sampleSize: job.totalExecutions,
      updatedAt: new Date(),
    },
  });
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
 * Get performance trends
 */
export async function getPerformanceTrends(): Promise<PerformanceTrend[]> {
  const jobs = await prisma.jobMetrics.findMany({
    where: {
      totalExecutions: { gte: 10 },
    },
  });

  const trends: PerformanceTrend[] = [];

  for (const job of jobs) {
    const trend = await detectPerformanceRegression(job.jobId);
    if (trend) {
      trends.push(trend);
    }
  }

  return trends.filter((t) => t.direction !== "stable");
}

/**
 * Get slowest operations
 */
export async function getSlowestOperations(
  limit: number = 10
): Promise<
  Array<{
    name: string;
    type: string;
    avgTime: number;
    p95Time: number;
    count: number;
  }>
> {
  const jobs = await prisma.jobMetrics.findMany({
    orderBy: { maxDurationMs: "desc" },
    take: limit,
  });

  return jobs.map((job) => ({
    name: job.jobId,
    type: "job",
    avgTime:
      job.totalExecutions > 0
        ? job.totalDurationMs / job.totalExecutions
        : 0,
    p95Time: job.maxDurationMs * 0.95,
    count: job.totalExecutions,
  }));
}

/**
 * Get resource usage statistics
 */
export async function getResourceUsage(): Promise<{
  memory: { used: number; total: number; percentage: number };
  uptime: number;
  nodeVersion: string;
}> {
  const memoryUsage = process.memoryUsage();

  return {
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
    },
    uptime: process.uptime() * 1000, // milliseconds
    nodeVersion: process.version,
  };
}
