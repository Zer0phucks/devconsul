/**
 * AI Content Generation API Endpoints
 * POST /api/ai/generate - Generate content for specific platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateContent, validateContent } from '@/lib/ai/generator';
import { generateContentSchema } from '@/lib/validations/ai';
import { getSession } from '@/lib/auth-helpers';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for AI generation

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request
    const validation = generateContentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { activities, platform, brandVoice, customPrompt, provider, projectId } =
      validation.data;

    // Verify user owns the project
    if (projectId) {
      const { prisma } = await import('@/lib/db');
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!project) {
        return NextResponse.json(
          {
            success: false,
            error: 'Project not found or access denied',
          },
          { status: 404 }
        );
      }
    }

    // Generate content
    const result = await generateContent({
      activities,
      platform,
      brandVoice,
      customPrompt,
      provider,
      projectId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Content generation failed',
        },
        { status: 500 }
      );
    }

    // Validate generated content
    const contentValidation = validateContent(result.content!, platform);
    if (!contentValidation.valid) {
      console.warn('Generated content validation warnings:', contentValidation.errors);
    }

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        platform: result.platform,
        metadata: result.metadata,
        validation: contentValidation,
      },
    });
  } catch (error) {
    console.error('AI generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
