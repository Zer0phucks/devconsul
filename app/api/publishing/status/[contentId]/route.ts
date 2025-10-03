/**
 * GET /api/publishing/status/[contentId]
 *
 * Get publication status for content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { getPublicationStatus } from '@/lib/publishing';

export async function GET(
  req: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getPublicationStatus(params.contentId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Status error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    );
  }
}
