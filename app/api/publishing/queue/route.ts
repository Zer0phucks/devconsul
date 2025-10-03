/**
 * GET /api/publishing/queue
 *
 * Get approval queue for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getApprovalQueue } from '@/lib/publishing';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queue = await getApprovalQueue(session.user.id);

    return NextResponse.json({ queue });
  } catch (error) {
    console.error('Queue error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get queue' },
      { status: 500 }
    );
  }
}
