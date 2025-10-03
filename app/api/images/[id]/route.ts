/**
 * API Route: Single Image Operations
 * GET /api/images/[id] - Get single image
 * PUT /api/images/[id] - Update image metadata
 * DELETE /api/images/[id] - Delete image
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { deleteImage } from '@/lib/storage/image-storage';

export async function GET(
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

    // Get image
    const image = await prisma.image.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        contentImages: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                platform: true,
              },
            },
          },
        },
        emailImages: {
          include: {
            email: {
              select: {
                id: true,
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error: any) {
    console.error('Get image error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { alt, title, tags, caption, credits } = body;

    // Verify ownership
    const existing = await prisma.image.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Update image
    const image = await prisma.image.update({
      where: { id },
      data: {
        alt: alt !== undefined ? alt : existing.alt,
        title: title !== undefined ? title : existing.title,
        tags: tags !== undefined ? tags : existing.tags,
        caption: caption !== undefined ? caption : existing.caption,
        credits: credits !== undefined ? credits : existing.credits,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error: any) {
    console.error('Update image error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get image to verify ownership and get storage path
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

    // Delete from storage
    try {
      await deleteImage(image.storagePath);
    } catch (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database (cascade will handle junction tables)
    await prisma.image.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
