/**
 * Queue Statistics API Route
 *
 * GET - Get queue statistics and metrics for project
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getQueueStats } from "@/lib/scheduling/queue";

/**
 * GET - Get queue statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get queue statistics
    const stats = await getQueueStats(projectId);

    // Get recent queue metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await prisma.queueMetrics.findMany({
      where: {
        projectId,
        periodStart: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        periodStart: "asc",
      },
    });

    return NextResponse.json({
      stats,
      metrics,
    });
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue statistics" },
      { status: 500 }
    );
  }
}
