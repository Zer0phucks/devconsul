/**
 * Facebook OAuth Connection API
 * POST /api/platforms/social/facebook/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import crypto from 'crypto';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/social/facebook/callback`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const state = crypto.randomBytes(32).toString('hex');
    const scopes = ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'publish_to_groups'];

    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('state', `${state}:${projectId}`);
    authUrl.searchParams.set('scope', scopes.join(','));

    return NextResponse.json({ authUrl: authUrl.toString(), state });
  } catch (error: any) {
    console.error('Facebook connect error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate Facebook OAuth' }, { status: 500 });
  }
}
