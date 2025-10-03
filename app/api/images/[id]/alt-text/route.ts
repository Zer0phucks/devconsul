/**
 * API Route: Regenerate Alt Text
 * POST /api/images/[id]/alt-text
 *
 * Regenerate alt text for an existing image using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { generateAltText } from '@/lib/ai/alt-text';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      purpose = 'both',
      maxLength = 125,
      context,
    } = body;

    // Get image
    const image = await prisma.image.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Generate alt text
    const altResult = await generateAltText(image.storageUrl, {
      context: context || image.title || image.aiPrompt || '',
      purpose: purpose as 'accessibility' | 'seo' | 'both',
      maxLength,
    });

    if ('error' in altResult) {
      return NextResponse.json(
        { error: altResult.error, code: altResult.code },
        { status: 500 }
      );
    }

    // Update image with new alt text
    const updatedImage = await prisma.image.update({
      where: { id },
      data: {
        alt: altResult.altText,
        altTextDescription: altResult.description,
        altTextConfidence: altResult.confidence,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      image: {
        id: updatedImage.id,
        alt: updatedImage.alt,
        altTextDescription: updatedImage.altTextDescription,
        altTextConfidence: updatedImage.altTextConfidence,
      },
      analysis: {
        detectedText: altResult.detectedText,
        tags: altResult.tags,
        confidence: altResult.confidence,
      },
      cost: altResult.cost,
    });
  } catch (error: any) {
    console.error('Alt text generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
