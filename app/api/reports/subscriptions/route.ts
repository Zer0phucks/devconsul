/**
 * Email Report Subscriptions API Endpoint
 * GET /api/reports/subscriptions - List subscriptions
 * POST /api/reports/subscriptions - Create subscription
 * PATCH /api/reports/subscriptions - Update subscription
 * DELETE /api/reports/subscriptions - Delete subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmailReportType } from "@prisma/client";

/**
 * GET - List email report subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing required parameter: projectId" },
        { status: 400 }
      );
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch subscriptions
    const subscriptions = await prisma.emailReportSubscription.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error("Subscription list API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Create email report subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      reportType,
      frequency,
      recipients,
      scheduleConfig = {},
      thresholds = {},
    } = body;

    // Validate required fields
    if (!projectId || !reportType || !frequency || !recipients) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: projectId, reportType, frequency, recipients",
        },
        { status: 400 }
      );
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Calculate next scheduled time
    const nextScheduledAt = calculateNextScheduledTime(frequency, scheduleConfig);

    // Create subscription
    const subscription = await prisma.emailReportSubscription.create({
      data: {
        projectId,
        userId: session.user.id,
        reportType: reportType as EmailReportType,
        frequency,
        recipients,
        scheduleConfig,
        thresholds,
        isActive: true,
        nextScheduledAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        subscription,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Subscription creation API error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update email report subscription
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive, recipients, frequency, scheduleConfig, thresholds } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // Verify subscription access
    const subscription = await prisma.emailReportSubscription.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found or access denied" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (recipients) updateData.recipients = recipients;
    if (frequency) {
      updateData.frequency = frequency;
      updateData.nextScheduledAt = calculateNextScheduledTime(
        frequency,
        scheduleConfig || subscription.scheduleConfig
      );
    }
    if (scheduleConfig) updateData.scheduleConfig = scheduleConfig;
    if (thresholds) updateData.thresholds = thresholds;

    // Update subscription
    const updated = await prisma.emailReportSubscription.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      subscription: updated,
    });
  } catch (error: any) {
    console.error("Subscription update API error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete email report subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    // Verify subscription access
    const subscription = await prisma.emailReportSubscription.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found or access denied" },
        { status: 404 }
      );
    }

    // Delete subscription
    await prisma.emailReportSubscription.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription deleted",
    });
  } catch (error: any) {
    console.error("Subscription deletion API error:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Calculate next scheduled time
 */
function calculateNextScheduledTime(
  frequency: string,
  config: any
): Date {
  const now = new Date();

  switch (frequency) {
    case "daily":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);

    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    case "monthly":
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;

    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
