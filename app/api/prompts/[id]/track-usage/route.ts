/**
 * Prompt Usage Tracking API
 * POST /api/prompts/[id]/track-usage - Track prompt usage and effectiveness
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { z } from 'zod';

const trackUsageSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  tokenUsage: z.number().positive().optional(),
  wasSuccessful: z.boolean().optional(),
  generatedContentId: z.string().optional(),
  timeToGenerate: z.number().positive().optional(), // milliseconds
});

/**
 * POST /api/prompts/[id]/track-usage
 * Track usage statistics and effectiveness for a prompt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request
    const body = await request.json();
    const validated = trackUsageSchema.parse(body);

    // Fetch existing prompt
    const existingPrompt = await db.promptLibrary.findUnique({
      where: { id: params.id },
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Calculate new averages
    const currentUsageCount = existingPrompt.usageCount;
    const newUsageCount = currentUsageCount + 1;

    let updateData: any = {
      usageCount: newUsageCount,
      lastUsedAt: new Date(),
    };

    // Update average rating if provided
    if (validated.rating !== undefined) {
      const currentAvgRating = existingPrompt.averageRating || 0;
      const newAvgRating =
        (currentAvgRating * currentUsageCount + validated.rating) / newUsageCount;
      updateData.averageRating = newAvgRating;
    }

    // Update average token usage if provided
    if (validated.tokenUsage !== undefined) {
      const currentAvgTokens = existingPrompt.averageTokenUsage || 0;
      const newAvgTokens =
        (currentAvgTokens * currentUsageCount + validated.tokenUsage) / newUsageCount;
      updateData.averageTokenUsage = Math.round(newAvgTokens);
    }

    // Update success rate if provided
    if (validated.wasSuccessful !== undefined) {
      const currentSuccessRate = existingPrompt.successRate || 0;
      const currentSuccesses = currentSuccessRate * currentUsageCount;
      const newSuccesses = currentSuccesses + (validated.wasSuccessful ? 1 : 0);
      const newSuccessRate = newSuccesses / newUsageCount;
      updateData.successRate = newSuccessRate;
    }

    // Update prompt with new statistics
    const updatedPrompt = await db.promptLibrary.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        usageCount: true,
        averageRating: true,
        successRate: true,
        averageTokenUsage: true,
        lastUsedAt: true,
      },
    });

    return NextResponse.json({
      prompt: updatedPrompt,
      message: 'Usage tracked successfully',
    });
  } catch (error: any) {
    console.error('Error tracking prompt usage:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to track usage' },
      { status: 500 }
    );
  }
}
