/**
 * Report Generation API Endpoint
 * POST /api/reports/generate - Trigger async report generation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { ReportType, ReportFormat } from "@prisma/client";

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
      outputFormat = "PDF",
      dateFrom,
      dateTo,
      sections,
      metrics,
      charts,
      branding,
    } = body;

    // Validate required fields
    if (!projectId || !reportType) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, reportType" },
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

    // Create report configuration
    const reportConfig = await prisma.reportConfig.create({
      data: {
        projectId,
        userId: session.user.id,
        reportType: reportType as ReportType,
        outputFormat: outputFormat as ReportFormat,
        sections: sections || [],
        metrics: metrics || [],
        charts: charts || [],
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        branding: branding || {},
        isScheduled: false,
      },
    });

    // Trigger Inngest job
    const job = await inngest.send({
      name: "report/generate",
      data: {
        reportConfigId: reportConfig.id,
        userId: session.user.id,
        triggeredBy: "manual",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Report generation started",
        reportConfigId: reportConfig.id,
        jobId: job.ids[0],
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("Report generation API error:", error);
    return NextResponse.json(
      { error: "Failed to start report generation", details: error.message },
      { status: 500 }
    );
  }
}
