/**
 * Data Export API Endpoint
 * POST /api/reports/export - Trigger async data export (CSV/iCal/ZIP)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
;
import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { ExportType, ReportFormat } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      exportType,
      outputFormat = "CSV",
      dateFrom,
      dateTo,
      options = {},
    } = body;

    // Validate required fields
    if (!projectId || !exportType) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, exportType" },
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

    // Trigger Inngest export job
    const job = await inngest.send({
      name: "export/data",
      data: {
        projectId,
        exportType: exportType as ExportType,
        outputFormat: outputFormat as ReportFormat,
        userId: session.user.id,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        options,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Export started",
        jobId: job.ids[0],
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Failed to start export", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/export?projectId=xxx - List recent exports
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await getSession();
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

    // Fetch recent exports
    const exports = await prisma.exportJob.findMany({
      where: {
        projectId,
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({ exports });
  } catch (error: any) {
    console.error("Export list API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exports", details: error.message },
      { status: 500 }
    );
  }
}
