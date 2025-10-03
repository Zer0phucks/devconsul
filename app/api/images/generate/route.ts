/**
 * API Route: Generate Image with DALL-E
 * POST /api/images/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/ai/image-generation';
import { generateAltText } from '@/lib/ai/alt-text';
import { uploadImageFromUrl } from '@/lib/storage/image-storage';
import { processImageForPlatform } from '@/lib/image-processing/platform-specs';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      prompt,
      quality = 'standard',
      size = '1024x1024',
      style = 'vivid',
      generateAlt = true,
      platforms = [],
      projectId,
      title,
      tags = [],
    } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // 1. Generate image with DALL-E
    const genResult = await generateImage(prompt, {
      quality: quality as 'standard' | 'hd',
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      style: style as 'vivid' | 'natural',
    });

    if ('error' in genResult) {
      return NextResponse.json(
        { error: genResult.error, code: genResult.code },
        { status: 500 }
      );
    }

    const imageUrl = genResult.images[0].url;
    const revisedPrompt = genResult.revisedPrompt;

    // 2. Generate alt text (optional)
    let altText = '';
    let altTextCost = 0;

    if (generateAlt) {
      const altResult = await generateAltText(imageUrl, {
        context: title || prompt,
        purpose: 'both',
        maxLength: 125,
      });

      if ('altText' in altResult) {
        altText = altResult.altText;
        altTextCost = altResult.cost;
      }
    }

    // 3. Download image for processing
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Get image dimensions
    const { getImageInfo } = await import('@/lib/image-processing/processor');
    const info = await getImageInfo(buffer);

    // 5. Process for platforms (if requested)
    const platformVersions: any = {};

    if (platforms.length > 0) {
      for (const platform of platforms) {
        try {
          const processed = await processImageForPlatform(
            buffer,
            platform,
            'post'
          );

          platformVersions[platform] = {
            width: processed.metadata.width,
            height: processed.metadata.height,
            size: processed.metadata.size,
            format: processed.metadata.format,
          };
        } catch (error) {
          console.error(`Failed to process for ${platform}:`, error);
        }
      }
    }

    // 6. Upload to storage
    const uploadResult = await uploadImageFromUrl(imageUrl, 'ai-generated');

    if ('error' in uploadResult) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }

    // 7. Save to database
    const image = await prisma.image.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        filename: uploadResult.pathname.split('/').pop()!,
        originalName: 'ai-generated-image.jpg',
        mimeType: uploadResult.contentType,
        size: uploadResult.size,
        width: info.width,
        height: info.height,
        aspectRatio: info.aspectRatio,
        storageUrl: uploadResult.url,
        storagePath: uploadResult.pathname,
        storageProvider: 'vercel-blob',
        alt: altText,
        title: title || null,
        tags: tags,
        isAIGenerated: true,
        aiModel: genResult.model,
        aiPrompt: prompt,
        aiRevisedPrompt: revisedPrompt,
        aiQuality: quality,
        aiStyle: style,
        generatedAt: new Date(),
        platformVersions: Object.keys(platformVersions).length > 0 ? platformVersions : null,
      },
    });

    // Calculate total cost
    const totalCost = genResult.cost + altTextCost;

    return NextResponse.json({
      success: true,
      image: {
        id: image.id,
        url: image.storageUrl,
        alt: image.alt,
        width: image.width,
        height: image.height,
        size: image.size,
      },
      generation: {
        prompt: prompt,
        revisedPrompt: revisedPrompt,
        model: genResult.model,
      },
      cost: {
        imageGeneration: genResult.cost,
        altTextGeneration: altTextCost,
        total: totalCost,
      },
      platforms: Object.keys(platformVersions),
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
