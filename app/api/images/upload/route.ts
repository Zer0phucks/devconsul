/**
 * API Route: Upload Image
 * POST /api/images/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/storage/image-storage';
import { getImageInfo } from '@/lib/image-processing/processor';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string | null;
    const alt = formData.get('alt') as string | null;
    const title = formData.get('title') as string | null;
    const tags = formData.get('tags') as string | null;
    const folder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Get image info
    const buffer = Buffer.from(await file.arrayBuffer());
    const info = await getImageInfo(buffer);

    // Upload to storage
    const uploadResult = await uploadImage(
      file,
      file.name,
      folder || 'uploads'
    );

    if ('error' in uploadResult) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }

    // Parse tags
    const tagsArray = tags
      ? tags.split(',').map((t) => t.trim())
      : [];

    // Save to database
    const image = await prisma.image.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        filename: uploadResult.pathname.split('/').pop()!,
        originalName: file.name,
        mimeType: file.type,
        size: uploadResult.size,
        width: info.width,
        height: info.height,
        aspectRatio: info.aspectRatio,
        storageUrl: uploadResult.url,
        storagePath: uploadResult.pathname,
        storageProvider: 'vercel-blob',
        alt: alt || null,
        title: title || null,
        tags: tagsArray,
        isAIGenerated: false,
      },
    });

    return NextResponse.json({
      success: true,
      image: {
        id: image.id,
        url: image.storageUrl,
        filename: image.filename,
        originalName: image.originalName,
        width: image.width,
        height: image.height,
        size: image.size,
        mimeType: image.mimeType,
        alt: image.alt,
        title: image.title,
        tags: image.tags,
      },
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
