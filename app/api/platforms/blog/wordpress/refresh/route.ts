/**
 * WordPress OAuth token refresh
 * POST /api/platforms/blog/wordpress/refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { refreshAccessToken } from '@/lib/platforms/wordpress';
import { encrypt, decrypt } from '@/lib/platforms/encryption';

const refreshSchema = z.object({
  platformId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = refreshSchema.parse(body);

    // Get platform credentials
    const platform = await prisma.platform.findFirst({
      where: {
        id: validatedData.platformId,
        userId: session.user.id,
        type: 'WORDPRESS',
        isActive: true,
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found or inactive' },
        { status: 404 }
      );
    }

    const credentials = JSON.parse(platform.credentials);

    if (credentials.authType !== 'oauth') {
      return NextResponse.json(
        { error: 'Token refresh only available for OAuth connections' },
        { status: 400 }
      );
    }

    // Refresh token
    const refreshToken = decrypt(credentials.refreshToken);
    const tokenData = await refreshAccessToken(refreshToken);

    // Update platform with new tokens
    await prisma.platform.update({
      where: { id: platform.id },
      data: {
        credentials: JSON.stringify({
          ...credentials,
          accessToken: encrypt(tokenData.accessToken),
          refreshToken: encrypt(tokenData.refreshToken),
          expiresIn: tokenData.expiresIn,
          tokenReceivedAt: Date.now(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      expiresIn: tokenData.expiresIn,
    });
  } catch (error) {
    console.error('WordPress token refresh error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to refresh access token' },
      { status: 500 }
    );
  }
}
