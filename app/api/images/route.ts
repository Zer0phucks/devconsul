/**
 * API Route: List Images
 * GET /api/images
 *
 * List images with pagination, filtering, and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filters
    const projectId = searchParams.get('projectId');
    const isAIGenerated = searchParams.get('isAIGenerated');
    const tags = searchParams.get('tags')?.split(',');
    const search = searchParams.get('search');

    // Sort
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (isAIGenerated !== null && isAIGenerated !== undefined) {
      where.isAIGenerated = isAIGenerated === 'true';
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { alt: { contains: search, mode: 'insensitive' } },
        { aiPrompt: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.image.count({ where });

    // Get images
    const images = await prisma.image.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        width: true,
        height: true,
        aspectRatio: true,
        storageUrl: true,
        alt: true,
        title: true,
        tags: true,
        isAIGenerated: true,
        aiModel: true,
        aiPrompt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      images,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List images error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
