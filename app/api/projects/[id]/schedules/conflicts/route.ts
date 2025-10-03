/**
 * Schedule Conflict Check API Route
 *
 * POST - Check for scheduling conflicts before creating/updating schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { detectConflicts } from "@/lib/scheduling/conflicts";
import { z } from "zod";

/**
 * Conflict check schema
 */
const conflictCheckSchema = z.object({
  scheduleId: z.string().cuid().optional(),
  scheduledFor: z.string().datetime(),
  timezone: z.string().default("UTC"),
  platforms: z.array(z.string().cuid()).min(1, "At least one platform required"),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
});

/**
 * POST - Check for conflicts
 */
export async function POST(
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

    // Parse request body
    const body = await request.json();
    const data = conflictCheckSchema.parse(body);

    const scheduledFor = new Date(data.scheduledFor);

    // Detect conflicts
    const result = await detectConflicts(
      projectId,
      data.scheduleId || null,
      scheduledFor,
      data.platforms,
      {
        timezone: data.timezone,
        isRecurring: data.isRecurring,
        recurringPattern: data.recurringPattern,
      }
    );

    return NextResponse.json({
      hasConflict: result.hasConflict,
      conflicts: result.conflicts,
      scheduledFor: scheduledFor.toISOString(),
      platforms: data.platforms,
    });
  } catch (error: any) {
    console.error("Error checking conflicts:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to check conflicts" },
      { status: 500 }
    );
  }
}
