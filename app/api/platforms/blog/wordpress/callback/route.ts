/**
 * WordPress OAuth callback handler
 * GET /api/platforms/blog/wordpress/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getWordPressAccessToken } from '@/lib/platforms/wordpress';
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
        type: 'WORDPRESS',
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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/blog/wordpress/callback`;
    const tokenData = await getWordPressAccessToken(code, redirectUri);

    // Update platform with access token
    await prisma.platform.update({
      where: { id: matchingPlatform.id },
      data: {
        credentials: JSON.stringify({
          accessToken: encrypt(tokenData.accessToken),
          refreshToken: encrypt(tokenData.refreshToken),
          expiresIn: tokenData.expiresIn,
          authType: 'oauth',
          tokenReceivedAt: Date.now(),
        }),
        isActive: true,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?success=wordpress_connected`
    );
  } catch (error) {
    console.error('WordPress callback error:', error);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=connection_failed`
    );
  }
}
