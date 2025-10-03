/**
 * LinkedIn OAuth Callback API
 * GET /api/platforms/social/linkedin/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/platforms/encryption';
import axios from 'axios';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/social/linkedin/callback`;

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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=linkedin_${error}`);
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const [stateToken, projectId] = state.split(':');

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, expires_in } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    const profile = profileResponse.data;

    // Create or update platform connection
    await prisma.platform.upsert({
      where: {
        projectId_type: {
          projectId,
          type: 'LINKEDIN',
        },
      },
      create: {
        projectId,
        type: 'LINKEDIN',
        name: `LinkedIn - ${profile.localizedFirstName} ${profile.localizedLastName}`,
        accessToken: encrypt(access_token),
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        isConnected: true,
        lastConnectedAt: new Date(),
        config: {
          personId: profile.id,
          firstName: profile.localizedFirstName,
          lastName: profile.localizedLastName,
        },
      },
      update: {
        accessToken: encrypt(access_token),
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        isConnected: true,
        lastConnectedAt: new Date(),
        config: {
          personId: profile.id,
          firstName: profile.localizedFirstName,
          lastName: profile.localizedLastName,
        },
      },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?connected=linkedin`);
  } catch (error: any) {
    console.error('LinkedIn callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=linkedin_connection_failed`);
  }
}
