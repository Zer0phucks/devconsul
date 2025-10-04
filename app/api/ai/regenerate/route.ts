/**
 * AI Content Regeneration
 * POST /api/ai/regenerate - Regenerate content with optional refinement
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateContent, type Platform } from '@/lib/ai/generator';
import { regenerateContentSchema } from '@/lib/validations/ai';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = regenerateContentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { contentId, refinementPrompt, provider } = validation.data;

    // Fetch existing content
    const existingContent = await db.content.findUnique({
      where: { id: contentId },
      include: { project: true },
    });

    if (!existingContent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content not found',
        },
        { status: 404 }
      );
    }

    if (!existingContent.isAIGenerated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content was not AI-generated',
        },
        { status: 400 }
      );
    }

    // Extract metadata
    const metadata = existingContent.aiMetadata as Record<string, unknown> | null;
    const platform = ((metadata?.platform as string) || 'blog') as Platform;

    // Build custom prompt for regeneration
    let customPrompt = refinementPrompt;
    if (!customPrompt) {
      customPrompt = `Regenerate and improve the following content:\n\n${existingContent.rawContent}\n\nMake it more engaging and polished while maintaining the core message.`;
    } else {
      customPrompt = `${refinementPrompt}\n\nOriginal content:\n${existingContent.rawContent}`;
    }

    // Regenerate with empty activities (using custom prompt instead)
    const result = await generateContent({
      activities: [],
      platform,
      customPrompt,
      provider,
      projectId: existingContent.projectId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Content regeneration failed',
        },
        { status: 500 }
      );
    }

    // Update existing content
    const updatedContent = await db.content.update({
      where: { id: contentId },
      data: {
        body: result.content,
        rawContent: result.content,
        aiModel: result.metadata.model,
        aiMetadata: {
          ...metadata,
          provider: result.metadata.provider,
          tokensUsed: result.metadata.tokensUsed,
          cost: result.metadata.cost,
          finishReason: result.metadata.finishReason,
          regeneratedAt: new Date().toISOString(),
          refinementPrompt,
        },
        version: existingContent.version + 1,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        contentId: updatedContent.id,
        content: result.content,
        version: updatedContent.version,
        metadata: result.metadata,
      },
    });
  } catch (error) {
    console.error('AI regeneration error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
