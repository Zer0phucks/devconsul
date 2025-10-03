/**
 * LinkedIn OAuth Connection API
 * POST /api/platforms/social/linkedin/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import crypto from 'crypto';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/social/linkedin/callback`;

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
    const scopes = ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'rw_organization_admin'];

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('state', `${state}:${projectId}`);
    authUrl.searchParams.set('scope', scopes.join(' '));

    return NextResponse.json({ authUrl: authUrl.toString(), state });
  } catch (error: any) {
    console.error('LinkedIn connect error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate LinkedIn OAuth' }, { status: 500 });
  }
}
