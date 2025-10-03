/**
 * Cron Execution History API
 *
 * GET /api/cron/executions - Fetch execution history
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import {
  getJobExecutionHistory,
  getJobStatistics,
} from "@/lib/cron/scheduler";
import { getExecutionsSchema } from "@/lib/validations/cron";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const includeStats = searchParams.get("stats") === "true";

    // Validate query
    const query = getExecutionsSchema.parse({
      jobId: jobId || undefined,
      limit,
    });

    let executions;
    let statistics;

    if (query.jobId) {
      // Verify ownership
      const job = await prisma.cronJob.findUnique({
        where: { id: query.jobId },
        include: { project: true },
      });

      if (!job) {
        return NextResponse.json({ error: "Cron job not found" }, { status: 404 });
      }

      if (job.project.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Fetch executions for specific job
      executions = await getJobExecutionHistory(query.jobId, query.limit);

      if (includeStats) {
        statistics = await getJobStatistics(query.jobId);
      }
    } else {
      // Fetch executions for all user's jobs
      const userJobs = await prisma.cronJob.findMany({
        where: {
          project: {
            userId: session.user.id,
          },
        },
        select: { id: true },
      });

      const jobIds = userJobs.map((j) => j.id);

      executions = await prisma.cronExecution.findMany({
        where: {
          jobId: { in: jobIds },
        },
        orderBy: { createdAt: "desc" },
        take: query.limit,
        include: {
          job: {
            select: {
              name: true,
              type: true,
              project: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: executions,
      statistics,
      count: executions.length,
    });
  } catch (error: any) {
    console.error("Fetch execution history error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to fetch execution history" },
      { status: 500 }
    );
  }
}
