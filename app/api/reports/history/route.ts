/**
 * Report History API Endpoint
 * GET /api/reports/history - List report generation history
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

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

    // Build query
    const where: any = { projectId };
    if (status) {
      where.status = status;
    }

    // Fetch report history
    const history = await prisma.reportHistory.findMany({
      where,
      orderBy: {
        startedAt: "desc",
      },
      take: Math.min(limit, 100),
      include: {
        config: {
          select: {
            reportType: true,
            outputFormat: true,
            sections: true,
          },
        },
      },
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("Report history API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report history", details: error.message },
      { status: 500 }
    );
  }
}
