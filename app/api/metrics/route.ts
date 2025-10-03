/**
 * Metrics Collection API Endpoint
 *
 * GET /api/metrics
 *
 * Returns Prometheus-compatible metrics export
 */

import { NextRequest, NextResponse } from "next/server";
import {
  exportPrometheusMetrics,
  getJobMetrics,
  getQueueMetrics,
  getSystemHealthMetrics,
} from "@/lib/monitoring/metrics-collector";
import {
  getPerformanceSnapshot,
  getPerformanceTrends,
  getSlowestOperations,
  getResourceUsage,
} from "@/lib/monitoring/performance-tracker";
import { getActiveAlerts } from "@/lib/monitoring/alerting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/metrics
 *
 * Query params:
 * - format: 'prometheus' | 'json' (default: json)
 * - jobId: string (optional) - Filter by specific job
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "json";
  const jobId = searchParams.get("jobId") || undefined;

  try {
    if (format === "prometheus") {
      // Export Prometheus format
      const metrics = await exportPrometheusMetrics();

      return new NextResponse(metrics, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; version=0.0.4",
        },
      });
    }

    // JSON format (default)
    const [
      jobMetrics,
      queueMetrics,
      systemMetrics,
      performanceSnapshot,
      performanceTrends,
      slowestOps,
      resourceUsage,
      activeAlerts,
    ] = await Promise.all([
      getJobMetrics(jobId),
      getQueueMetrics(),
      getSystemHealthMetrics(),
      getPerformanceSnapshot(),
      getPerformanceTrends(),
      getSlowestOperations(10),
      getResourceUsage(),
      getActiveAlerts(),
    ]);

    return NextResponse.json({
      timestamp: new Date(),
      jobs: jobMetrics,
      queue: queueMetrics,
      system: systemMetrics,
      performance: {
        snapshot: performanceSnapshot,
        trends: performanceTrends,
        slowest: slowestOps,
        resource: resourceUsage,
      },
      alerts: {
        active: activeAlerts.length,
        items: activeAlerts.slice(0, 10), // Top 10 alerts
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to collect metrics",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
