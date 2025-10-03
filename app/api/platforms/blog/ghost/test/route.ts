/**
 * Ghost connection test
 * POST /api/platforms/blog/ghost/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { testConnection, type GhostClient } from '@/lib/platforms/ghost';
import { decrypt } from '@/lib/platforms/encryption';

const testSchema = z.object({
  platformId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = testSchema.parse(body);

    // Get platform credentials
    const platform = await prisma.platform.findFirst({
      where: {
        id: validatedData.platformId,
        userId: session.user.id,
        type: 'GHOST',
        isActive: true,
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found or inactive' },
        { status: 404 }
      );
    }

    // Parse credentials
    const credentials = JSON.parse(platform.credentials);

    const client: GhostClient = {
      apiUrl: credentials.apiUrl,
      adminApiKey: decrypt(credentials.adminApiKey),
    };

    // Test connection
    const isValid = await testConnection(client);

    return NextResponse.json({
      success: isValid,
      message: isValid
        ? 'Connection successful'
        : 'Connection failed - please check your credentials',
    });
  } catch (error) {
    console.error('Ghost test error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to test Ghost connection' },
      { status: 500 }
    );
  }
}
