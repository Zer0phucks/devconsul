/**
 * Ghost Admin API connection
 * POST /api/platforms/blog/ghost/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { testConnection, type GhostClient } from '@/lib/platforms/ghost';
import { encrypt } from '@/lib/platforms/encryption';

const connectSchema = z.object({
  platformName: z.string().min(1).max(100),
  apiUrl: z.string().url(),
  adminApiKey: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = connectSchema.parse(body);

    // Validate API key format (should be id:secret)
    const keyParts = validatedData.adminApiKey.split(':');
    if (keyParts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid API key format. Expected format: id:secret' },
        { status: 400 }
      );
    }

    // Test connection
    const client: GhostClient = {
      apiUrl: validatedData.apiUrl,
      adminApiKey: validatedData.adminApiKey,
    };

    const isValid = await testConnection(client);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Failed to connect to Ghost API. Please check your credentials.' },
        { status: 400 }
      );
    }

    // Encrypt and store credentials
    const encryptedApiKey = encrypt(validatedData.adminApiKey);

    const platform = await prisma.platform.create({
      data: {
        userId: session.user.id,
        name: validatedData.platformName,
        type: 'GHOST',
        credentials: JSON.stringify({
          apiUrl: validatedData.apiUrl,
          adminApiKey: encryptedApiKey,
        }),
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      platformId: platform.id,
    });
  } catch (error) {
    console.error('Ghost connect error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to connect to Ghost' },
      { status: 500 }
    );
  }
}
