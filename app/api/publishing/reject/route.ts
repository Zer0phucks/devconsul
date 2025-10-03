/**
 * POST /api/publishing/reject
 *
 * Reject content from approval queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rejectContent } from '@/lib/publishing';
import { rejectContentSchema } from '@/lib/validations/publishing';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = rejectContentSchema.parse(body);

    await rejectContent(validated.contentId, validated.reason, {
      notify: validated.notify,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject error:', error);

    if (error instanceof Error && error.message.includes('parse')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rejection failed' },
      { status: 500 }
    );
  }
}
