/**
 * POST /api/publishing/dry-run
 *
 * Test publish without actually publishing
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dryRunPublish } from '@/lib/publishing';
import { dryRunPublishSchema } from '@/lib/validations/publishing';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = dryRunPublishSchema.parse(body);

    const result = await dryRunPublish(
      validated.contentId,
      validated.platformIds
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Dry run error:', error);

    if (error instanceof Error && error.message.includes('parse')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dry run failed' },
      { status: 500 }
    );
  }
}
