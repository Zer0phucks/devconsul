import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Simple password check (in production, use proper authentication like NextAuth)
    // Hash the password and compare with environment variable
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    const expectedHash = process.env.ADMIN_PASSWORD_HASH ||
      crypto.createHash('sha256').update('admin123').digest('hex');

    if (hashedPassword !== expectedHash) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Set auth cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}