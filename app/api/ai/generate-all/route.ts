/**
 * AI Content Generation - All Platforms
 * POST /api/ai/generate-all - Generate content for all enabled platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateForAllPlatforms } from '@/lib/ai/generator';
import { generateAllPlatformsSchema } from '@/lib/validations/ai';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for multiple platforms

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = generateAllPlatformsSchema.safeParse(body);
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

    const { activities, enabledPlatforms, brandVoice, provider, projectId } =
      validation.data;

    // Generate content for all platforms
    const results = await generateForAllPlatforms(activities, enabledPlatforms, {
      brandVoice,
      provider,
      projectId,
    });

    // Separate successful and failed generations
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      success: successful.length > 0,
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results: results.map((r) => ({
          platform: r.platform,
          success: r.success,
          content: r.content,
          metadata: r.metadata,
          error: r.error,
        })),
      },
    });
  } catch (error) {
    console.error('Batch AI generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
