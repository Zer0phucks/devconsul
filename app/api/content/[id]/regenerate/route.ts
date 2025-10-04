/**
 * API Route: POST /api/content/[id]/regenerate
 * Regenerate content with AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { regenerateSchema } from '@/lib/validations/content-editor';
import { generateContent } from '@/lib/ai/generate-content';
import type { Platform } from '@/lib/ai/generator';

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
    const validation = regenerateSchema.safeParse({
      ...body,
      contentId: id,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
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
    const originalContent = await prisma.content.findUnique({
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
    let prompt = `Regenerate the following content:\n\n${originalContent.rawContent}`;
    if (refinementPrompt) {
      prompt += `\n\nAdditional instructions: ${refinementPrompt}`;
    }

    // Generate content variations
    const variations: string[] = [];
    const count = generateVariations ? variationCount : 1;

    for (let i = 0; i < count; i++) {
      const metadata = originalContent.aiMetadata as any;
      const platform = (metadata?.platform as string) || 'blog';
      const result = await generateContent(
        prompt,
        platform as Platform,
        aiModel
      );
      variations.push(result.content);
    }

    // Create new version if keepPrevious is true
    if (keepPrevious && variations.length > 0) {
      // Store as new version (implementation depends on your version schema)
      // For now, we'll just update the main content
      await prisma.content.update({
        where: { id },
        data: {
          rawContent: variations[0],
          aiMetadata: {
            ...(originalContent.aiMetadata as object),
            aiModel,
            refinementPrompt,
            regeneratedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      });
    } else if (variations.length > 0) {
      // Replace content
      await prisma.content.update({
        where: { id },
        data: {
          rawContent: variations[0],
          aiMetadata: {
            ...(originalContent.aiMetadata as object),
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
