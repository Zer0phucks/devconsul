/**
 * Platform API Health Check Endpoint
 *
 * GET /api/health/platforms
 *
 * Checks external platform API health
 */

import { NextResponse } from "next/server";
import { checkPlatformHealth } from "@/lib/monitoring/health-checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await checkPlatformHealth();

    return NextResponse.json(health, {
      status: health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        message: "Platform health check failed",
        error: error.message,
        responseTime: 0,
        timestamp: new Date(),
      },
      { status: 503 }
    );
  }
}
