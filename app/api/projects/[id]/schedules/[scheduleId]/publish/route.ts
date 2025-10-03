/**
 * Manual Publish API Route
 *
 * POST - Trigger manual publish for scheduled content
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { QueueStatus } from "@prisma/client";

/**
 * POST - Manually trigger publish
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, scheduleId } = await params;

    // Verify project ownership and schedule exists
    const schedule = await prisma.scheduledContent.findFirst({
      where: {
        id: scheduleId,
        projectId,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Check if already completed
    if (schedule.queueStatus === QueueStatus.COMPLETED) {
      return NextResponse.json(
        { error: "Schedule already completed" },
        { status: 400 }
      );
    }

    // Check if currently processing
    if (schedule.queueStatus === QueueStatus.PROCESSING) {
      return NextResponse.json(
        { error: "Schedule is currently processing" },
        { status: 400 }
      );
    }

    // Trigger manual publish event
    await inngest.send({
      name: "scheduled/publish.manual",
      data: {
        scheduleId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Manual publish triggered",
      scheduleId,
    });
  } catch (error) {
    console.error("Error triggering manual publish:", error);
    return NextResponse.json(
      { error: "Failed to trigger manual publish" },
      { status: 500 }
    );
  }
}
