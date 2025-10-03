/**
 * Medium OAuth callback handler
 * GET /api/platforms/blog/medium/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMediumAccessToken } from '@/lib/platforms/medium';
import { encrypt, decrypt } from '@/lib/platforms/encryption';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=missing_params`
      );
    }

    // Extract userId from state
    const [userId] = state.split(':');

    // Find pending platform connection
    const platforms = await prisma.platform.findMany({
      where: {
        userId,
        type: 'MEDIUM',
        isActive: false,
      },
    });

    let matchingPlatform = null;
    for (const platform of platforms) {
      const credentials = JSON.parse(platform.credentials);
      if (credentials.state) {
        try {
          const decryptedState = decrypt(credentials.state);
          if (decryptedState === state) {
            matchingPlatform = platform;
            break;
          }
        } catch {
          continue;
        }
      }
    }

    if (!matchingPlatform) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=invalid_state`
      );
    }

    // Exchange code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/blog/medium/callback`;
    const tokenData = await getMediumAccessToken(code, redirectUri);

    // Update platform with access token
    await prisma.platform.update({
      where: { id: matchingPlatform.id },
      data: {
        credentials: JSON.stringify({
          accessToken: encrypt(tokenData.accessToken),
          refreshToken: encrypt(tokenData.refreshToken),
          expiresAt: tokenData.expiresAt,
          scope: tokenData.scope,
        }),
        isActive: true,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?success=medium_connected`
    );
  } catch (error) {
    console.error('Medium callback error:', error);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=connection_failed`
    );
  }
}
