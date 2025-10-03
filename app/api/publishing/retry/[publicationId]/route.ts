/**
 * POST /api/publishing/retry/[publicationId]
 *
 * Retry failed publication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { retryFailedPublication } from '@/lib/publishing';
import { z } from 'zod';

const retrySchema = z.object({
  resetRetryCount: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { publicationId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = retrySchema.parse(body);

    const result = await retryFailedPublication(params.publicationId, {
      resetRetryCount: validated.resetRetryCount,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Retry error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Retry failed' },
      { status: 500 }
    );
  }
}
