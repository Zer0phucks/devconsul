/**
 * Job Queue Health Check Endpoint
 *
 * GET /api/health/jobs
 *
 * Checks job queue status and performance
 */

import { NextResponse } from "next/server";
import { checkJobQueueHealth } from "@/lib/monitoring/health-checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await checkJobQueueHealth();

    return NextResponse.json(health, {
      status: health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        message: "Job queue health check failed",
        error: error.message,
        responseTime: 0,
        timestamp: new Date(),
      },
      { status: 503 }
    );
  }
}
