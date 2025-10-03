/**
 * API Route: Process Image for Platforms
 * POST /api/images/[id]/process
 *
 * Process an existing image for specific platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-helpers';
import { processImageForPlatform } from '@/lib/image-processing/platform-specs';
import { uploadImage } from '@/lib/storage/image-storage';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { platforms = [], types = {} } = body;

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Platforms array is required' },
        { status: 400 }
      );
    }

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

    // Download image
    const response = await fetch(image.storageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process for each platform
    const platformVersions: Record<string, any> =
      (image.platformVersions as Record<string, any>) || {};

    const processedVersions: Record<string, any> = {};

    for (const platform of platforms) {
      try {
        const type = types[platform] || 'post';

        const processed = await processImageForPlatform(
          buffer,
          platform,
          type
        );

        // Upload processed version
        const filename = `${image.filename.split('.')[0]}_${platform}_${type}.${processed.metadata.format}`;
        const uploadResult = await uploadImage(
          processed.buffer,
          filename,
          `processed/${platform}`
        );

        if ('error' in uploadResult) {
          console.error(`Failed to upload ${platform} version:`, uploadResult.error);
          continue;
        }

        processedVersions[`${platform}_${type}`] = {
          url: uploadResult.url,
          width: processed.metadata.width,
          height: processed.metadata.height,
          size: processed.metadata.size,
          format: processed.metadata.format,
        };

        platformVersions[`${platform}_${type}`] = processedVersions[`${platform}_${type}`];
      } catch (error) {
        console.error(`Failed to process for ${platform}:`, error);
      }
    }

    // Update image with platform versions
    const updatedImage = await prisma.image.update({
      where: { id },
      data: {
        platformVersions,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      image: {
        id: updatedImage.id,
        platformVersions: processedVersions,
      },
      processed: Object.keys(processedVersions),
    });
  } catch (error: any) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
