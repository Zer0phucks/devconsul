/**
 * Schedules API Routes
 *
 * GET - List scheduled content for project
 * POST - Create new schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { enqueue } from "@/lib/scheduling/queue";
import { detectConflicts, validateSchedule } from "@/lib/scheduling/conflicts";
import { z } from "zod";

/**
 * Schedule creation schema
 */
const createScheduleSchema = z.object({
  contentId: z.string().cuid(),
  scheduledFor: z.string().datetime(),
  timezone: z.string().default("UTC"),
  platforms: z.array(z.string().cuid()).min(1, "At least one platform required"),
  priority: z.number().int().min(1).max(10).default(5),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
  recurringConfig: z.any().optional(),
  recurringUntil: z.string().datetime().optional(),
  publishDelay: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  autoResolveConflicts: z.boolean().default(false),
});

/**
 * Schedule query schema
 */
const scheduleQuerySchema = z.object({
  status: z.enum(["PENDING", "QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "PAUSED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  platform: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["scheduledFor", "createdAt", "priority"]).default("scheduledFor"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * GET - List scheduled content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
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

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = scheduleQuerySchema.parse(searchParams);

    // Build where clause
    const where: any = {
      projectId,
    };

    if (query.status) {
      where.queueStatus = query.status;
    }

    if (query.startDate || query.endDate) {
      where.scheduledFor = {};
      if (query.startDate) {
        where.scheduledFor.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.scheduledFor.lte = new Date(query.endDate);
      }
    }

    if (query.platform) {
      where.platforms = {
        has: query.platform,
      };
    }

    // Count total items
    const total = await prisma.scheduledContent.count({ where });

    // Fetch schedules with content
    const schedules = await prisma.scheduledContent.findMany({
      where,
      include: {
        content: {
          select: {
            id: true,
            title: true,
            excerpt: true,
            status: true,
          },
        },
      },
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return NextResponse.json({
      items: schedules,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new schedule
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
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
    const data = createScheduleSchema.parse(body);

    // Verify content belongs to project
    const content = await prisma.content.findFirst({
      where: {
        id: data.contentId,
        projectId,
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

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

    const scheduledFor = new Date(data.scheduledFor);
    const recurringUntil = data.recurringUntil
      ? new Date(data.recurringUntil)
      : undefined;

    // Validate schedule (check for conflicts)
    const validation = await validateSchedule(
      projectId,
      null,
      scheduledFor,
      data.platforms,
      {
        timezone: data.timezone,
        autoResolve: data.autoResolveConflicts,
      }
    );

    if (!validation.valid) {
      // If auto-resolve is enabled and there's a suggested time, use it
      if (data.autoResolveConflicts && validation.suggestedTime) {
        const schedule = await enqueue(data.contentId, projectId, validation.suggestedTime, {
          timezone: data.timezone,
          platforms: data.platforms,
          priority: data.priority,
          isRecurring: data.isRecurring,
          recurringPattern: data.recurringPattern,
          recurringConfig: data.recurringConfig,
          recurringUntil,
          publishDelay: data.publishDelay,
          notes: data.notes,
          metadata: {
            conflicts: validation.conflicts,
            autoResolved: true,
            originalSchedule: scheduledFor,
          },
        });

        return NextResponse.json({
          schedule,
          warning: "Schedule time adjusted to avoid conflicts",
          originalTime: scheduledFor,
          adjustedTime: validation.suggestedTime,
          conflicts: validation.conflicts,
        });
      }

      // Return conflicts without creating schedule
      return NextResponse.json(
        {
          error: "Schedule conflicts detected",
          conflicts: validation.conflicts,
        },
        { status: 409 }
      );
    }

    // Create schedule
    const schedule = await enqueue(data.contentId, projectId, scheduledFor, {
      timezone: data.timezone,
      platforms: data.platforms,
      priority: data.priority,
      isRecurring: data.isRecurring,
      recurringPattern: data.recurringPattern,
      recurringConfig: data.recurringConfig,
      recurringUntil,
      publishDelay: data.publishDelay,
      notes: data.notes,
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating schedule:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
