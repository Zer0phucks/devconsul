/**
 * Manual Cron Job Trigger API
 *
 * POST /api/cron/trigger - Manually trigger job execution
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { triggerJobManually } from "@/lib/cron/scheduler";
import { triggerJobSchema } from "@/lib/validations/cron";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const { jobId } = triggerJobSchema.parse(body);

    // Trigger job
    const result = await triggerJobManually(jobId, session.user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Cron job trigger error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: error.message || "Failed to trigger cron job" },
      { status: 500 }
    );
  }
}
