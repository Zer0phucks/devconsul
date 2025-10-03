/**
 * List Cron Schedules API
 *
 * GET /api/cron/schedules - List all user's cron schedules
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { getUserCronJobs } from "@/lib/cron/scheduler";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user's cron jobs
    const cronJobs = await getUserCronJobs(session.user.id);

    return NextResponse.json({
      success: true,
      data: cronJobs,
      count: cronJobs.length,
    });
  } catch (error: any) {
    console.error("Fetch cron schedules error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to fetch cron schedules" },
      { status: 500 }
    );
  }
}
