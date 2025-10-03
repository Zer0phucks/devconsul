import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

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

    // Fetch most recent content (last 6 items)
    const content = await prisma.content.findMany({
      where: {
        projectId,
      },
      include: {
        publications: {
          include: {
            platform: {
              select: {
                id: true,
                type: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    });

    // Transform data
    const items = content.map((item) => ({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      body: item.body.substring(0, 150), // Short preview
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
      scheduledFor: item.scheduledFor,
      isAIGenerated: item.isAIGenerated,
      aiModel: item.aiModel,
      version: item.version,
      publications: item.publications.map((pub) => ({
        id: pub.id,
        platformId: pub.platformId,
        platformType: pub.platform.type,
        platformName: pub.platform.name,
        status: pub.status,
        publishedAt: pub.publishedAt,
        platformUrl: pub.platformUrl,
      })),
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching recent content:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent content" },
      { status: 500 }
    );
  }
}
