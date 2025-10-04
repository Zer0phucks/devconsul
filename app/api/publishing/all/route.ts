/**
 * POST /api/publishing/all
 *
 * Publish content to all enabled platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { publishAllEnabled } from '@/lib/publishing';
import { z } from 'zod';

const publishAllSchema = z.object({
  contentId: z.string().cuid(),
  dryRun: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = publishAllSchema.parse(body);

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

    const result = await publishAllEnabled(validated.contentId, {
      dryRun: validated.dryRun,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Publish all error:', error);

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
