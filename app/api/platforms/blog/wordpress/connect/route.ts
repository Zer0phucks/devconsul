/**
 * WordPress OAuth connection initiation
 * POST /api/platforms/blog/wordpress/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getWordPressOAuthUrl } from '@/lib/platforms/wordpress';
import { encrypt } from '@/lib/platforms/encryption';

const connectSchema = z.object({
  platformName: z.string().min(1).max(100),
  wordpressSiteUrl: z.string().url().optional(), // For self-hosted WordPress
  apiKey: z.string().optional(), // For self-hosted WordPress
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = connectSchema.parse(body);

    // Self-hosted WordPress with API key
    if (validatedData.wordpressSiteUrl && validatedData.apiKey) {
      const encryptedApiKey = encrypt(validatedData.apiKey);

      const platform = await prisma.platform.create({
        data: {
          userId: session.user.id,
          name: validatedData.platformName,
          type: 'WORDPRESS',
          credentials: JSON.stringify({
            siteUrl: validatedData.wordpressSiteUrl,
            apiKey: encryptedApiKey,
            authType: 'api_key',
          }),
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        platformId: platform.id,
        authType: 'api_key',
      });
    }

    // WordPress.com OAuth
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/blog/wordpress/callback`;
    const state = `${session.user.id}:${Date.now()}`;

    // Store state temporarily for validation
    await prisma.platform.create({
      data: {
        userId: session.user.id,
        name: validatedData.platformName,
        type: 'WORDPRESS',
        credentials: JSON.stringify({
          state: encrypt(state),
          authType: 'oauth',
          status: 'pending',
        }),
        isActive: false,
      },
    });

    const oauthUrl = getWordPressOAuthUrl(redirectUri, state);

    return NextResponse.json({
      success: true,
      authType: 'oauth',
      authUrl: oauthUrl,
    });
  } catch (error) {
    console.error('WordPress connect error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to initiate WordPress connection' },
      { status: 500 }
    );
  }
}
