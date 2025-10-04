/**
 * API Route: POST /api/content/[id]/draft
 * Save draft for auto-save functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { draftSaveSchema } from '@/lib/validations/content-editor';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate request
    const validation = draftSaveSchema.safeParse({
      ...body,
      contentId: id,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Check content access
    const existingContent = await prisma.generatedContent.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (existingContent.project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Save draft (update content with draft flag in metadata)
    await prisma.generatedContent.update({
      where: { id },
      data: {
        content,
        metadata: {
          ...(existingContent.metadata as object),
          isDraft: true,
          lastDraftSave: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to save draft:', error);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch draft
    const content = await prisma.generatedContent.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const metadata = content.metadata as any;
    const isDraft = metadata?.isDraft || false;

    return NextResponse.json({
      draft: isDraft ? content.content : null,
      lastSaved: metadata?.lastDraftSave || null,
    });
  } catch (error) {
    console.error('Failed to fetch draft:', error);
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 });
  }
}
