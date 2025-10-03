/**
 * Facebook OAuth Callback API
 * GET /api/platforms/social/facebook/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/platforms/encryption';
import axios from 'axios';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/social/facebook/callback`;

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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=facebook_${error}`);
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const [stateToken, projectId] = state.split(':');

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      },
    });

    const { access_token } = tokenResponse.data;

    // Get user's pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token },
    });

    const pages = pagesResponse.data.data;
    const primaryPage = pages[0]; // Use first page

    // Create or update platform connection
    await prisma.platform.upsert({
      where: {
        projectId_type: {
          projectId,
          type: 'FACEBOOK',
        },
      },
      create: {
        projectId,
        type: 'FACEBOOK',
        name: `Facebook - ${primaryPage?.name || 'Page'}`,
        accessToken: encrypt(primaryPage?.access_token || access_token),
        isConnected: true,
        lastConnectedAt: new Date(),
        config: {
          pageId: primaryPage?.id,
          pageName: primaryPage?.name,
          pages: pages.map((p: any) => ({ id: p.id, name: p.name, accessToken: p.access_token })),
        },
      },
      update: {
        accessToken: encrypt(primaryPage?.access_token || access_token),
        isConnected: true,
        lastConnectedAt: new Date(),
        config: {
          pageId: primaryPage?.id,
          pageName: primaryPage?.name,
          pages: pages.map((p: any) => ({ id: p.id, name: p.name, accessToken: p.access_token })),
        },
      },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?connected=facebook`);
  } catch (error: any) {
    console.error('Facebook callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/platforms?error=facebook_connection_failed`);
  }
}
