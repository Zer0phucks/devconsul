/**
 * POST /api/publishing/approve
 *
 * Approve content from queue and publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { approveAndPublish } from '@/lib/publishing';
import { approveAndPublishSchema } from '@/lib/validations/publishing';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = approveAndPublishSchema.parse(body);

    const result = await approveAndPublish(
      validated.contentId,
      validated.platformIds,
      { immediate: validated.immediate }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Approve error:', error);

    if (error instanceof Error && error.message.includes('parse')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Approval failed' },
      { status: 500 }
    );
  }
}
