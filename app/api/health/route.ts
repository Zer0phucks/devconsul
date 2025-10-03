/**
 * Main Health Check Endpoint
 *
 * GET /api/health
 *
 * Returns overall system health status with all component checks
 */

import { NextRequest, NextResponse } from "next/server";
import { checkSystemHealth, quickHealthCheck } from "@/lib/monitoring/health-checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Query params:
 * - quick: boolean - If true, returns fast health check only
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const quick = searchParams.get("quick") === "true";

  try {
    if (quick) {
      // Quick health check (fast response)
      const health = await quickHealthCheck();

      return NextResponse.json(health, {
        status: health.status === "healthy" ? 200 : 503,
      });
    }

    // Comprehensive health check
    const health = await checkSystemHealth();

    return NextResponse.json(health, {
      status: health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        message: "Health check failed",
        error: error.message,
      },
      { status: 503 }
    );
  }
}
