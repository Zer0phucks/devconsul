/**
 * Twitter OAuth Connection API
 * POST /api/platforms/social/twitter/connect - Initiate OAuth
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import crypto from 'crypto';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/social/twitter/callback`;

function base64URLEncode(str: Buffer): string {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sha256(buffer: string): Buffer {
  return crypto.createHash('sha256').update(buffer).digest();
}

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

    // Generate PKCE code verifier and challenge
    const codeVerifier = base64URLEncode(crypto.randomBytes(32));
    const codeChallenge = base64URLEncode(sha256(codeVerifier));

    // Generate state for CSRF protection
    const state = base64URLEncode(crypto.randomBytes(32));

    // Store code verifier and state in session (you may want to use a more persistent storage)
    // For now, we'll return them to the client to send back in callback
    const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];

    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', TWITTER_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state,
      codeVerifier,
    });
  } catch (error: any) {
    console.error('Twitter connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Twitter OAuth' },
      { status: 500 }
    );
  }
}
