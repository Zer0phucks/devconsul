/**
 * Individual Cron Schedule API
 *
 * DELETE /api/cron/schedules/[id] - Cancel cron schedule
 * PATCH /api/cron/schedules/[id] - Toggle cron schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { deleteCronJob, toggleCronJob } from "@/lib/cron/scheduler";
import { prisma } from "@/lib/db";

/**
 * Delete cron schedule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = params.id;

    // Verify ownership
    const job = await prisma.cronJob.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    if (job.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete job
    await deleteCronJob(jobId);

    return NextResponse.json({
      success: true,
      message: "Cron schedule deleted successfully",
    });
  } catch (error: any) {
    console.error("Cron schedule deletion error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to delete cron schedule" },
      { status: 500 }
    );
  }
}

/**
 * Toggle cron schedule (enable/disable)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = params.id;
    const body = await request.json();
    const { isEnabled } = body;

    if (typeof isEnabled !== "boolean") {
      return NextResponse.json(
        { error: "isEnabled must be a boolean" },
        { status: 400 }
      );
    }

    // Verify ownership
    const job = await prisma.cronJob.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
    }

    if (job.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Toggle job
    const updatedJob = await toggleCronJob(jobId, isEnabled);

    return NextResponse.json({
      success: true,
      data: updatedJob,
    });
  } catch (error: any) {
    console.error("Cron schedule toggle error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to toggle cron schedule" },
      { status: 500 }
    );
  }
}
