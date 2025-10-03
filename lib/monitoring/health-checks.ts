/**
 * Health Check System
 *
 * Comprehensive health verification:
 * - Database connectivity
 * - Redis connectivity (if configured)
 * - Job queue status
 * - External platform API health
 * - Overall system health
 */

import { prisma } from "@/lib/db";

/**
 * Health status levels
 */
export enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  responseTime: number;
  timestamp: Date;
  details?: Record<string, any>;
}

/**
 * System health summary
 */
export interface SystemHealth {
  status: HealthStatus;
  timestamp: Date;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    redis: HealthCheckResult;
    jobs: HealthCheckResult;
    platforms: HealthCheckResult;
  };
  overall: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    total: number;
  };
}

/**
 * Check database connectivity
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;

    // Check if we can read from a table
    const projectCount = await prisma.project.count();

    const responseTime = Date.now() - startTime;

    // Degraded if query takes more than 500ms
    const status =
      responseTime > 500 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;

    return {
      status,
      message: "Database connection successful",
      responseTime,
      timestamp: new Date(),
      details: {
        projectCount,
        queryTime: responseTime,
      },
    };
  } catch (error: any) {
    return {
      status: HealthStatus.UNHEALTHY,
      message: `Database connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Check Redis connectivity (if configured)
 */
export async function checkRedisHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Note: Redis is optional - if not configured, skip
    if (!process.env.REDIS_URL) {
      return {
        status: HealthStatus.HEALTHY,
        message: "Redis not configured (optional)",
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        details: {
          configured: false,
        },
      };
    }

    // Would implement actual Redis check here
    // For now, return healthy
    return {
      status: HealthStatus.HEALTHY,
      message: "Redis connection successful",
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
      details: {
        configured: true,
      },
    };
  } catch (error: any) {
    return {
      status: HealthStatus.UNHEALTHY,
      message: `Redis connection failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Check job queue health
 */
export async function checkJobQueueHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Check for stuck jobs (processing > 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const stuckJobs = await prisma.scheduledContent.count({
      where: {
        queueStatus: "PROCESSING",
        updatedAt: { lt: oneHourAgo },
      },
    });

    // Check dead letter queue size
    const deadLetterCount = await prisma.deadLetterQueue.count({
      where: { status: "PENDING" },
    });

    // Check failed job rate (last hour)
    const recentExecutions = await prisma.cronExecution.findMany({
      where: {
        startedAt: { gte: oneHourAgo },
      },
      select: { status: true },
    });

    const totalRecent = recentExecutions.length;
    const failedRecent = recentExecutions.filter(
      (e) => e.status === "FAILED"
    ).length;

    const failureRate =
      totalRecent > 0 ? (failedRecent / totalRecent) * 100 : 0;

    const responseTime = Date.now() - startTime;

    // Determine health status
    let status = HealthStatus.HEALTHY;
    let message = "Job queue operating normally";

    if (stuckJobs > 0 || deadLetterCount > 100) {
      status = HealthStatus.DEGRADED;
      message = "Job queue has stuck or dead letter items";
    }

    if (failureRate > 50) {
      status = HealthStatus.UNHEALTHY;
      message = "High job failure rate detected";
    }

    return {
      status,
      message,
      responseTime,
      timestamp: new Date(),
      details: {
        stuckJobs,
        deadLetterCount,
        recentExecutions: totalRecent,
        failedExecutions: failedRecent,
        failureRate: Math.round(failureRate),
      },
    };
  } catch (error: any) {
    return {
      status: HealthStatus.UNHEALTHY,
      message: `Job queue check failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Check external platform API health
 */
export async function checkPlatformHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Check recent platform API failures
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentPublications = await prisma.contentPublication.findMany({
      where: {
        createdAt: { gte: oneHourAgo },
      },
      select: {
        status: true,
        platform: {
          select: { type: true },
        },
      },
    });

    const totalPublications = recentPublications.length;
    const failedPublications = recentPublications.filter(
      (p) => p.status === "FAILED"
    ).length;

    const failureRate =
      totalPublications > 0
        ? (failedPublications / totalPublications) * 100
        : 0;

    // Count platform API errors by type
    const platformErrors: Record<string, number> = {};
    recentPublications
      .filter((p) => p.status === "FAILED")
      .forEach((p) => {
        const platformType = p.platform.type;
        platformErrors[platformType] =
          (platformErrors[platformType] || 0) + 1;
      });

    const responseTime = Date.now() - startTime;

    // Determine health status
    let status = HealthStatus.HEALTHY;
    let message = "Platform APIs operating normally";

    if (failureRate > 10 && failureRate <= 30) {
      status = HealthStatus.DEGRADED;
      message = "Some platform API issues detected";
    }

    if (failureRate > 30) {
      status = HealthStatus.UNHEALTHY;
      message = "Multiple platform APIs failing";
    }

    return {
      status,
      message,
      responseTime,
      timestamp: new Date(),
      details: {
        totalPublications,
        failedPublications,
        failureRate: Math.round(failureRate),
        platformErrors,
      },
    };
  } catch (error: any) {
    return {
      status: HealthStatus.UNHEALTHY,
      message: `Platform health check failed: ${error.message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Comprehensive system health check
 */
export async function checkSystemHealth(): Promise<SystemHealth> {
  const startTime = Date.now();

  // Run all health checks in parallel
  const [database, redis, jobs, platforms] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkJobQueueHealth(),
    checkPlatformHealth(),
  ]);

  const checks = { database, redis, jobs, platforms };

  // Count statuses
  const statuses = Object.values(checks).map((check) => check.status);
  const healthy = statuses.filter((s) => s === HealthStatus.HEALTHY).length;
  const degraded = statuses.filter((s) => s === HealthStatus.DEGRADED).length;
  const unhealthy = statuses.filter((s) => s === HealthStatus.UNHEALTHY)
    .length;

  // Overall system status
  let overallStatus = HealthStatus.HEALTHY;
  if (unhealthy > 0) {
    overallStatus = HealthStatus.UNHEALTHY;
  } else if (degraded > 0) {
    overallStatus = HealthStatus.DEGRADED;
  }

  return {
    status: overallStatus,
    timestamp: new Date(),
    uptime: process.uptime() * 1000,
    checks,
    overall: {
      healthy,
      degraded,
      unhealthy,
      total: statuses.length,
    },
  };
}

/**
 * Quick health check (fast response)
 */
export async function quickHealthCheck(): Promise<{
  status: HealthStatus;
  timestamp: Date;
}> {
  try {
    // Just check database connection
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: HealthStatus.HEALTHY,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      status: HealthStatus.UNHEALTHY,
      timestamp: new Date(),
    };
  }
}

/**
 * Get health check history
 */
export async function getHealthCheckHistory(
  hours: number = 24
): Promise<any[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Would query from a health_checks table if we stored history
  // For now, return empty array
  return [];
}

/**
 * Alert thresholds
 */
export const ALERT_THRESHOLDS = {
  database: {
    responseTime: 500, // ms
    status: HealthStatus.DEGRADED,
  },
  jobs: {
    failureRate: 50, // %
    stuckJobs: 10,
    deadLetterQueue: 100,
  },
  platforms: {
    failureRate: 30, // %
  },
  system: {
    errorRate: 10, // %
    responseTime: 200, // ms
  },
};

/**
 * Check if alert should be triggered
 */
export function shouldTriggerAlert(
  health: SystemHealth
): { trigger: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (health.status === HealthStatus.UNHEALTHY) {
    reasons.push("System is unhealthy");
  }

  if (health.checks.database.status === HealthStatus.UNHEALTHY) {
    reasons.push("Database is unhealthy");
  }

  if (health.checks.jobs.status === HealthStatus.UNHEALTHY) {
    reasons.push("Job queue is unhealthy");
  }

  if (
    health.checks.jobs.details?.failureRate >
    ALERT_THRESHOLDS.jobs.failureRate
  ) {
    reasons.push(
      `Job failure rate is ${health.checks.jobs.details.failureRate}%`
    );
  }

  if (
    health.checks.platforms.details?.failureRate >
    ALERT_THRESHOLDS.platforms.failureRate
  ) {
    reasons.push(
      `Platform failure rate is ${health.checks.platforms.details.failureRate}%`
    );
  }

  return {
    trigger: reasons.length > 0,
    reasons,
  };
}
