/**
 * API Route: POST /api/content/[id]/regenerate
 * Regenerate content with AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { regenerateSchema } from '@/lib/validations/content-editor';
import { generateContent } from '@/lib/ai/generate-content';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Validate request
    const validation = regenerateSchema.safeParse({
      ...body,
      contentId: id,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      refinementPrompt,
      keepPrevious,
      generateVariations,
      variationCount,
      aiModel,
    } = validation.data;

    // Fetch original content
    const originalContent = await prisma.generatedContent.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!originalContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check access
    if (originalContent.project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build regeneration prompt
    let prompt = `Regenerate the following content:\n\n${originalContent.content}`;
    if (refinementPrompt) {
      prompt += `\n\nAdditional instructions: ${refinementPrompt}`;
    }

    // Generate content variations
    const variations: string[] = [];
    const count = generateVariations ? variationCount : 1;

    for (let i = 0; i < count; i++) {
      const result = await generateContent(
        prompt,
        originalContent.platform || 'blog',
        aiModel
      );
      variations.push(result.content);
    }

    // Create new version if keepPrevious is true
    if (keepPrevious && variations.length > 0) {
      // Store as new version (implementation depends on your version schema)
      // For now, we'll just update the main content
      await prisma.generatedContent.update({
        where: { id },
        data: {
          content: variations[0],
          metadata: {
            ...(originalContent.metadata as object),
            aiModel,
            refinementPrompt,
            regeneratedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      });
    } else if (variations.length > 0) {
      // Replace content
      await prisma.generatedContent.update({
        where: { id },
        data: {
          content: variations[0],
          metadata: {
            ...(originalContent.metadata as object),
            aiModel,
            refinementPrompt,
          },
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      variations,
      cost: 0.003 * variations.length, // Placeholder cost
    });
  } catch (error) {
    console.error('Failed to regenerate content:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate content' },
      { status: 500 }
    );
  }
}
