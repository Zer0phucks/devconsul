import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeByToken, resubscribeEmail } from '@/lib/platforms/unsubscribe';
import { unsubscribeSchema, resubscribeSchema } from '@/lib/validations/email-platforms';

// POST /api/unsubscribe - Unsubscribe from emails
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = unsubscribeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { token, reason } = validation.data;

    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token required' },
        { status: 400 }
      );
    }

    const result = await unsubscribeByToken(token, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to unsubscribe' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email: result.email,
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}

// PUT /api/unsubscribe - Resubscribe to emails
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = resubscribeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const result = await resubscribeEmail(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to resubscribe' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to process resubscribe request' },
      { status: 500 }
    );
  }
}
