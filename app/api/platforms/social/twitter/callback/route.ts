/**
 * Twitter OAuth Callback API
 * GET /api/platforms/social/twitter/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/auth-helpers";
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/platforms/encryption';
import axios from 'axios';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/social/twitter/callback`;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json({ error: `Twitter OAuth error: ${error}` }, { status: 400 });
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // In production, retrieve codeVerifier from session/database
    // For now, expect it to be sent as a query parameter (not ideal, but for demo)
    const codeVerifier = searchParams.get('code_verifier');
    if (!codeVerifier) {
      return NextResponse.json({ error: 'Missing code verifier' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
        client_id: TWITTER_CLIENT_ID,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const twitterUser = userResponse.data.data;

    // Get or create project (you'll need to pass projectId through state)
    const projectId = searchParams.get('project_id');
    if (!projectId) {
      return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });
    }

    // Create or update platform connection
    const platform = await prisma.platform.upsert({
      where: {
        projectId_type: {
          projectId,
          type: 'TWITTER',
        },
      },
      create: {
        projectId,
        type: 'TWITTER',
        name: `Twitter - @${twitterUser.username}`,
        accessToken: encrypt(access_token),
        refreshToken: encrypt(refresh_token),
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        isConnected: true,
        lastConnectedAt: new Date(),
        config: {
          username: twitterUser.username,
          userId: twitterUser.id,
          name: twitterUser.name,
        },
      },
      update: {
        accessToken: encrypt(access_token),
        refreshToken: encrypt(refresh_token),
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        isConnected: true,
        lastConnectedAt: new Date(),
        config: {
          username: twitterUser.username,
          userId: twitterUser.id,
          name: twitterUser.name,
        },
      },
    });

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?connected=twitter`);
  } catch (error: any) {
    console.error('Twitter callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=twitter_connection_failed`
    );
  }
}
