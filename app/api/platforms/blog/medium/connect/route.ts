/**
 * Medium OAuth connection initiation
 * POST /api/platforms/blog/medium/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getMediumOAuthUrl } from '@/lib/platforms/medium';
import { encrypt } from '@/lib/platforms/encryption';

const connectSchema = z.object({
  platformName: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = connectSchema.parse(body);

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/blog/medium/callback`;
    const state = `${session.user.id}:${Date.now()}`;

    // Store state temporarily for validation
    await prisma.platform.create({
      data: {
        userId: session.user.id,
        name: validatedData.platformName,
        type: 'MEDIUM',
        credentials: JSON.stringify({
          state: encrypt(state),
          status: 'pending',
        }),
        isActive: false,
      },
    });

    const oauthUrl = getMediumOAuthUrl(redirectUri, state);

    return NextResponse.json({
      success: true,
      authUrl: oauthUrl,
    });
  } catch (error) {
    console.error('Medium connect error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to initiate Medium connection' },
      { status: 500 }
    );
  }
}
