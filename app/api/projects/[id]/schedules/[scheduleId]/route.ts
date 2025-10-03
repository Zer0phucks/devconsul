/**
 * Individual Schedule API Routes
 *
 * GET - Get schedule details
 * PATCH - Update schedule
 * DELETE - Cancel schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  cancelSchedule,
  pauseSchedule,
  resumeSchedule,
} from "@/lib/scheduling/queue";
import { validateSchedule } from "@/lib/scheduling/conflicts";
import { inngest } from "@/lib/inngest/client";
import { z } from "zod";

/**
 * Schedule update schema
 */
const updateScheduleSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
  timezone: z.string().optional(),
  platforms: z.array(z.string().cuid()).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
  action: z.enum(["pause", "resume"]).optional(),
});

/**
 * GET - Get schedule details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const session = await auth();
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
      include: {
        content: {
          select: {
            id: true,
            title: true,
            excerpt: true,
            body: true,
            status: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update schedule
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const session = await auth();
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

    // Can't update completed or cancelled schedules
    if (["COMPLETED", "CANCELLED"].includes(schedule.queueStatus)) {
      return NextResponse.json(
        { error: `Cannot update ${schedule.queueStatus.toLowerCase()} schedule` },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const data = updateScheduleSchema.parse(body);

    // Handle pause/resume actions
    if (data.action === "pause") {
      await pauseSchedule(scheduleId);
      const updated = await prisma.scheduledContent.findUnique({
        where: { id: scheduleId },
      });
      return NextResponse.json({ schedule: updated });
    }

    if (data.action === "resume") {
      await resumeSchedule(scheduleId);
      const updated = await prisma.scheduledContent.findUnique({
        where: { id: scheduleId },
      });
      return NextResponse.json({ schedule: updated });
    }

    // Build update data
    const updateData: any = {};

    if (data.scheduledFor) {
      const newScheduleTime = new Date(data.scheduledFor);
      const platforms = data.platforms || schedule.platforms;

      // Validate new schedule time
      const validation = await validateSchedule(
        projectId,
        scheduleId,
        newScheduleTime,
        platforms,
        {
          timezone: data.timezone || schedule.timezone,
        }
      );

      if (!validation.valid) {
        return NextResponse.json(
          {
            error: "Schedule conflicts detected",
            conflicts: validation.conflicts,
          },
          { status: 409 }
        );
      }

      updateData.scheduledFor = newScheduleTime;

      // Trigger reschedule event
      await inngest.send({
        name: "scheduled/publish.reschedule",
        data: {
          scheduleId,
          newScheduleTime: newScheduleTime.toISOString(),
          userId: session.user.id,
        },
      });
    }

    if (data.timezone) {
      updateData.timezone = data.timezone;
    }

    if (data.platforms) {
      // Verify platforms are connected
      const platforms = await prisma.platform.findMany({
        where: {
          id: { in: data.platforms },
          projectId,
          isConnected: true,
        },
      });

      if (platforms.length !== data.platforms.length) {
        return NextResponse.json(
          { error: "Some platforms are not connected" },
          { status: 400 }
        );
      }

      updateData.platforms = data.platforms;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    // Update schedule
    const updated = await prisma.scheduledContent.update({
      where: { id: scheduleId },
      data: updateData,
    });

    return NextResponse.json({ schedule: updated });
  } catch (error: any) {
    console.error("Error updating schedule:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancel schedule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const session = await auth();
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

    // Can't cancel completed schedules
    if (schedule.queueStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot cancel completed schedule" },
        { status: 400 }
      );
    }

    // Cancel schedule
    await cancelSchedule(scheduleId);

    // Trigger cancel event
    await inngest.send({
      name: "scheduled/publish.cancel",
      data: {
        scheduleId,
        userId: session.user.id,
        reason: "User cancelled",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule cancelled",
    });
  } catch (error) {
    console.error("Error cancelling schedule:", error);
    return NextResponse.json(
      { error: "Failed to cancel schedule" },
      { status: 500 }
    );
  }
}
