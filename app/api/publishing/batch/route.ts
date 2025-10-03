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
