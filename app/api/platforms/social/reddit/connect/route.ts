/**
 * Reddit OAuth Connection API
 * POST /api/platforms/social/reddit/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/auth-helpers";
import crypto from 'crypto';

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/social/reddit/callback`;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const state = crypto.randomBytes(32).toString('hex');
    const scopes = ['identity', 'submit', 'edit', 'read', 'flair'];

    const authUrl = new URL('https://www.reddit.com/api/v1/authorize');
    authUrl.searchParams.set('client_id', REDDIT_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', `${state}:${projectId}`);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('duration', 'permanent');
    authUrl.searchParams.set('scope', scopes.join(' '));

    return NextResponse.json({ authUrl: authUrl.toString(), state });
  } catch (error: any) {
    console.error('Reddit connect error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate Reddit OAuth' }, { status: 500 });
  }
}
