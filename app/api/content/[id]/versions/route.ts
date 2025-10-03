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

    // Fetch all versions
    const versions = await prisma.content.findMany({
      where: {
        OR: [
          { id: contentId },
          { parentId: contentId },
          {
            parent: {
              OR: [
                { id: contentId },
                { parentId: contentId },
              ],
            },
          },
        ],
        project: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        version: true,
        title: true,
        body: true,
        rawContent: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        version: "desc",
      },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}
