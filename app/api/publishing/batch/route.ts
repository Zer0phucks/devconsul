/**
 * POST /api/publishing/batch
 *
 * Publish to multiple platforms or multiple content items
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { publishToMultiplePlatforms } from '@/lib/publishing';
import { publishToMultiplePlatformsSchema } from '@/lib/validations/publishing';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = publishToMultiplePlatformsSchema.parse(body);

    // Verify user owns the content
    const { prisma } = await import('@/lib/db');
    const content = await prisma.content.findFirst({
      where: {
        id: validated.contentId,
        project: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found or access denied' },
        { status: 404 }
      );
    }

    // Verify user owns all platform connections
    const platforms = await prisma.platform.findMany({
      where: {
        id: { in: validated.platformIds },
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (platforms.length !== validated.platformIds.length) {
      return NextResponse.json(
        { error: 'One or more platforms not found or access denied' },
        { status: 404 }
      );
    }

    const result = await publishToMultiplePlatforms(
      validated.contentId,
      validated.platformIds,
      {
        dryRun: validated.dryRun,
        metadata: validated.metadata,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Batch publishing error:', error);

    if (error instanceof Error && error.message.includes('parse')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch publishing failed' },
      { status: 500 }
    );
  }
}
