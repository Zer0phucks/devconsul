/**
 * Cron Schedule Management API
 *
 * POST /api/cron/schedule - Create/update cron schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createCronJob,
  updateCronJob,
  getProjectCronJobs,
} from "@/lib/cron/scheduler";
import { createCronJobSchema, updateCronJobSchema } from "@/lib/validations/cron";
import { prisma } from "@/lib/db";

/**
 * Create new cron schedule
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = createCronJobSchema.parse(body);

    // Verify user owns project
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create cron job
    const cronJob = await createCronJob(validatedData);

    return NextResponse.json({
      success: true,
      data: cronJob,
    });
  } catch (error: any) {
    console.error("Cron schedule creation error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create cron schedule" },
      { status: 500 }
    );
  }
}

/**
 * Update existing cron schedule
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, ...updates } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // Validate updates
    const validatedUpdates = updateCronJobSchema.parse(updates);

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

    // Update job
    const updatedJob = await updateCronJob(jobId, validatedUpdates);

    return NextResponse.json({
      success: true,
      data: updatedJob,
    });
  } catch (error: any) {
    console.error("Cron schedule update error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update cron schedule" },
      { status: 500 }
    );
  }
}
