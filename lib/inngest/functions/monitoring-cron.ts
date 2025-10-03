/**
 * Monitoring Cron Jobs
 *
 * Scheduled jobs for system monitoring:
 * - Dead letter queue processing (hourly)
 * - Health checks and alerting (every 5 minutes)
 * - Performance metrics aggregation (every 30 minutes)
 */

import { inngest } from "@/lib/inngest/client";
import { processDeadLetterQueue } from "@/lib/monitoring/job-optimizer";
import { checkSystemHealth } from "@/lib/monitoring/health-checks";
import { checkAndAlert } from "@/lib/monitoring/alerting";
import {
  getPerformanceSnapshot,
  detectPerformanceRegression,
  getJobMetrics,
} from "@/lib/monitoring/performance-tracker";

/**
 * Dead Letter Queue Processing Cron
 *
 * Runs every hour to retry failed jobs
 */
export const deadLetterQueueCron = inngest.createFunction(
  {
    id: "dead-letter-queue-cron",
    name: "Process Dead Letter Queue",
    retries: 0,
  },
  { cron: "0 * * * *" }, // Every hour
  async ({ step }) => {
    const result = await step.run("process-dead-letter-queue", async () => {
      return await processDeadLetterQueue();
    });

    console.log("Dead letter queue processed:", result);

    return result;
  }
);

/**
 * Health Check and Alerting Cron
 *
 * Runs every 5 minutes to check system health
 */
export const healthCheckCron = inngest.createFunction(
  {
    id: "health-check-cron",
    name: "System Health Check and Alerting",
    retries: 0,
  },
  { cron: "*/5 * * * *" }, // Every 5 minutes
  async ({ step }) => {
    // Check system health
    const health = await step.run("check-system-health", async () => {
      return await checkSystemHealth();
    });

    // Check and trigger alerts if needed
    const alerts = await step.run("check-and-alert", async () => {
      return await checkAndAlert(health);
    });

    console.log("Health check completed:", {
      status: health.status,
      alertsTriggered: alerts.length,
    });

    return {
      health,
      alertsTriggered: alerts,
    };
  }
);

/**
 * Performance Metrics Aggregation Cron
 *
 * Runs every 30 minutes to aggregate performance metrics
 */
export const performanceMetricsCron = inngest.createFunction(
  {
    id: "performance-metrics-cron",
    name: "Aggregate Performance Metrics",
    retries: 0,
  },
  { cron: "*/30 * * * *" }, // Every 30 minutes
  async ({ step }) => {
    // Get performance snapshot
    const snapshot = await step.run("get-performance-snapshot", async () => {
      return await getPerformanceSnapshot();
    });

    // Check for performance regressions
    const regressions = await step.run(
      "check-performance-regressions",
      async () => {
        const jobMetrics = await getJobMetrics();
        const regressionResults = [];

        for (const job of jobMetrics) {
          const regression = await detectPerformanceRegression(job.jobId);
          if (regression && regression.direction === "degrading") {
            regressionResults.push(regression);
          }
        }

        return regressionResults;
      }
    );

    console.log("Performance metrics aggregated:", {
      bottlenecks: snapshot.bottlenecks.length,
      regressions: regressions.length,
    });

    return {
      snapshot,
      regressions,
    };
  }
);

/**
 * Metrics Cleanup Cron
 *
 * Runs daily to clean up old metrics data
 */
export const metricsCleanupCron = inngest.createFunction(
  {
    id: "metrics-cleanup-cron",
    name: "Clean Up Old Metrics",
    retries: 0,
  },
  { cron: "0 2 * * *" }, // Daily at 2 AM
  async ({ step }) => {
    const result = await step.run("cleanup-old-metrics", async () => {
      const { prisma } = await import("@/lib/db");

      // Delete old dead letter queue items (>30 days and processed)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deletedDLQ = await prisma.deadLetterQueue.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          status: { in: ["SUCCEEDED", "FAILED"] },
        },
      });

      // Delete old resolved alerts (>30 days)
      const deletedAlerts = await prisma.alert.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          resolved: true,
        },
      });

      return {
        deletedDeadLetterQueue: deletedDLQ.count,
        deletedAlerts: deletedAlerts.count,
      };
    });

    console.log("Metrics cleanup completed:", result);

    return result;
  }
);
