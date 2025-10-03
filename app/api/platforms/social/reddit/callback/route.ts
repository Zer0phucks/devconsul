/**
 * Reddit OAuth Callback API
 * GET /api/platforms/social/reddit/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/platforms/encryption';
import axios from 'axios';

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID!;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET!;
const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT || 'FullSelfPublishing/1.0';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/social/reddit/callback`;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=reddit_${error}`);
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const [stateToken, projectId] = state.split(':');

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': REDDIT_USER_AGENT,
          Authorization: `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://oauth.reddit.com/api/v1/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'User-Agent': REDDIT_USER_AGENT,
      },
    });

    const user = userResponse.data;

    // Create or update platform connection
    await prisma.platform.upsert({
      where: {
        projectId_type: {
          projectId,
          type: 'REDDIT',
        },
      },
      create: {
        projectId,
        type: 'REDDIT',
        name: `Reddit - u/${user.name}`,
        accessToken: encrypt(access_token),
        refreshToken: encrypt(refresh_token),
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        isConnected: true,
        lastConnectedAt: new Date(),
        config: {
          username: user.name,
          userId: user.id,
          linkKarma: user.link_karma,
          commentKarma: user.comment_karma,
        },
      },
      update: {
        accessToken: encrypt(access_token),
        refreshToken: encrypt(refresh_token),
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        isConnected: true,
        lastConnectedAt: new Date(),
        config: {
          username: user.name,
          userId: user.id,
          linkKarma: user.link_karma,
          commentKarma: user.comment_karma,
        },
      },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?connected=reddit`);
  } catch (error: any) {
    console.error('Reddit callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=reddit_connection_failed`);
  }
}
