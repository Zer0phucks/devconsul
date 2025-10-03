/**
 * POST /api/publishing/all
 *
 * Publish content to all enabled platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
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
