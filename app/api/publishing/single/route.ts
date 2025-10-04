/**
 * POST /api/publishing/single
 *
 * Publish content to a single platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { publishToSinglePlatform } from '@/lib/publishing';
import { publishToSinglePlatformSchema } from '@/lib/validations/publishing';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = publishToSinglePlatformSchema.parse(body);

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
        projectId: true,
      },
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found or access denied' },
        { status: 404 }
      );
    }

    // Verify user owns the platform connection
    const platform = await prisma.platform.findFirst({
      where: {
        id: validated.platformId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found or access denied' },
        { status: 404 }
      );
    }

    const result = await publishToSinglePlatform(
      validated.contentId,
      validated.platformId,
      {
        dryRun: validated.dryRun,
        metadata: validated.metadata,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Publishing error:', error);

    if (error instanceof Error && error.message.includes('parse')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Publishing failed' },
      { status: 500 }
    );
  }
}
