import { NextRequest, NextResponse } from 'next/server';
import { subscribeToNewsletter } from '@/lib/email/newsletter';
import { isValidEmail } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Subscribe to newsletter
    const subscriber = await subscribeToNewsletter(email, name);

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
      },
    });
  } catch (error: any) {
    console.error('Subscription error:', error);

    // Handle duplicate email
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This email is already subscribed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}