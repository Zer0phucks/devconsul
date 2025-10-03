/**
 * Webhook configuration
 * POST /api/platforms/blog/webhook/configure
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { webhookConfigSchema } from '@/lib/validations/blog-platforms';
import { testWebhook } from '@/lib/platforms/webhook';
import { encrypt } from '@/lib/platforms/encryption';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = webhookConfigSchema.parse(body);

    // Validate webhook configuration
    const validation = await testWebhook({
      url: validatedData.url,
      method: validatedData.method,
      headers: validatedData.headers,
      payloadTemplate: validatedData.payloadTemplate,
      signatureSecret: validatedData.signatureSecret,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid webhook configuration', details: validation.errors },
        { status: 400 }
      );
    }

    // Encrypt signature secret if provided
    const credentials: any = {
      url: validatedData.url,
      method: validatedData.method,
      headers: validatedData.headers || {},
      payloadTemplate: validatedData.payloadTemplate,
      retryAttempts: validatedData.retryAttempts || 3,
      retryDelay: validatedData.retryDelay || 60,
    };

    if (validatedData.signatureSecret) {
      credentials.signatureSecret = encrypt(validatedData.signatureSecret);
    }

    // Create or update platform
    const platform = await prisma.platform.upsert({
      where: {
        userId_name: {
          userId: session.user.id,
          name: validatedData.platformName,
        },
      },
      create: {
        userId: session.user.id,
        name: validatedData.platformName,
        type: 'WEBHOOK',
        credentials: JSON.stringify(credentials),
        isActive: true,
      },
      update: {
        credentials: JSON.stringify(credentials),
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      platformId: platform.id,
    });
  } catch (error) {
    console.error('Webhook configure error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to configure webhook' },
      { status: 500 }
    );
  }
}
