import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contentId } = await params;

    // Fetch content with full details
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        project: {
          userId: session.user.id,
        },
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
        versions: {
          select: {
            id: true,
            version: true,
            createdAt: true,
            title: true,
          },
          orderBy: {
            version: "desc",
          },
        },
        parent: {
          select: {
            id: true,
            version: true,
            title: true,
          },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Transform data
    const result = {
      id: content.id,
      title: content.title,
      excerpt: content.excerpt,
      body: content.body,
      rawContent: content.rawContent,
      status: content.status,
      tags: content.tags,
      categories: content.categories,
      coverImage: content.coverImage,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      publishedAt: content.publishedAt,
      scheduledFor: content.scheduledFor,
      isAIGenerated: content.isAIGenerated,
      aiModel: content.aiModel,
      aiPrompt: content.aiPrompt,
      aiMetadata: content.aiMetadata,
      version: content.version,
      parentId: content.parentId,
      publications: content.publications.map((pub) => ({
        id: pub.id,
        platformId: pub.platformId,
        platformType: pub.platform.type,
        platformName: pub.platform.name,
        status: pub.status,
        publishedAt: pub.publishedAt,
        platformUrl: pub.platformUrl,
        error: pub.error,
      })),
      versions: content.versions,
      parent: content.parent,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contentId } = await params;

    // Verify ownership before delete
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Delete content (cascade will handle publications)
    await prisma.content.delete({
      where: { id: contentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
