import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { contentQuerySchema } from "@/lib/validations/content";
import { ContentStatus } from "@prisma/client";

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

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = contentQuerySchema.parse(searchParams);

    // Build where clause
    const where: any = {
      projectId,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { body: { contains: query.search, mode: "insensitive" } },
        { excerpt: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Filter by platform (via publications)
    if (query.platform) {
      where.publications = {
        some: {
          platform: {
            type: query.platform,
          },
        },
      };
    }

    // Count total items
    const total = await prisma.content.count({ where });

    // Fetch content with publications
    const content = await prisma.content.findMany({
      where,
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
        [query.sortBy]: query.sortOrder,
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    // Transform data
    const items = content.map((item) => ({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      body: item.body.substring(0, 300), // Truncate for list view
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

    return NextResponse.json({
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
