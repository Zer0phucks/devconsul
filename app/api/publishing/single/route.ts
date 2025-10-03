/**
 * POST /api/publishing/single
 *
 * Publish content to a single platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { publishToSinglePlatform } from '@/lib/publishing';
import { publishToSinglePlatformSchema } from '@/lib/validations/publishing';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = publishToSinglePlatformSchema.parse(body);

    // TODO: Verify user owns the content/platform
    // This requires checking if content belongs to user's project

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
