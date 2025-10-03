/**
 * Prompt Library API
 * GET /api/prompts - List prompts with filtering
 * POST /api/prompts - Create new prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { createPromptSchema, queryPromptsSchema } from '@/lib/validations/prompt';
import { validatePromptQuality } from '@/lib/validations/prompt';

/**
 * GET /api/prompts
 * List prompts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      platform: searchParams.get('platform') || undefined,
      category: searchParams.get('category') || undefined,
      templateId: searchParams.get('templateId') || undefined,
      isDefault: searchParams.get('isDefault') === 'true' ? true : searchParams.get('isDefault') === 'false' ? false : undefined,
      isPublic: searchParams.get('isPublic') === 'true' ? true : searchParams.get('isPublic') === 'false' ? false : undefined,
      projectId: searchParams.get('projectId') || undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: (searchParams.get('sortBy') as 'name' | 'createdAt' | 'usageCount' | 'averageRating') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const validated = queryPromptsSchema.parse(queryParams);

    // Build where clause with access control
    const where: any = {
      OR: [
        { userId: user.id }, // User's own prompts
        { isDefault: true }, // System default prompts
        { isPublic: true },  // Public prompts
      ],
    };

    // Apply filters
    if (validated.platform) where.platform = validated.platform;
    if (validated.category) where.category = validated.category;
    if (validated.templateId) where.templateId = validated.templateId;
    if (validated.projectId) where.projectId = validated.projectId;
    if (validated.isDefault !== undefined) {
      where.isDefault = validated.isDefault;
      delete where.OR; // Override access control for default filter
    }
    if (validated.isPublic !== undefined) {
      where.isPublic = validated.isPublic;
    }

    // Search in name and description
    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: 'insensitive' } },
        { description: { contains: validated.search, mode: 'insensitive' } },
      ];
    }

    // Filter by tags
    if (validated.tags && validated.tags.length > 0) {
      where.tags = { hasSome: validated.tags };
    }

    // Build orderBy
    const orderBy: any = {
      [validated.sortBy]: validated.sortOrder,
    };

    // Fetch prompts with pagination
    const [prompts, total] = await Promise.all([
      db.promptLibrary.findMany({
        where,
        orderBy,
        take: validated.limit,
        skip: validated.offset,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              platform: true,
            },
          },
        },
      }),
      db.promptLibrary.count({ where }),
    ]);

    return NextResponse.json({
      prompts,
      pagination: {
        total,
        limit: validated.limit,
        offset: validated.offset,
        hasMore: validated.offset + validated.limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error listing prompts:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to list prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompts
 * Create a new prompt
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request
    const body = await request.json();
    const validated = createPromptSchema.parse(body);

    // Validate prompt quality
    const qualityCheck = validatePromptQuality(validated.systemPrompt, validated.userPrompt);

    // If quality is very low, warn but don't block
    const warnings: string[] = [];
    if (qualityCheck.score < 50) {
      warnings.push(`Prompt quality score is low (${qualityCheck.score}/100)`);
      warnings.push(...qualityCheck.suggestions);
    }

    // Create prompt
    const prompt = await db.promptLibrary.create({
      data: {
        userId: user.id,
        projectId: validated.projectId,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        systemPrompt: validated.systemPrompt,
        userPrompt: validated.userPrompt,
        templateId: validated.templateId,
        variables: validated.variables || [],
        platform: validated.platform,
        contentType: validated.contentType,
        tone: validated.tone,
        targetLength: validated.targetLength,
        tags: validated.tags || [],
        isDefault: false, // Only system can create defaults
        isPublic: validated.isPublic || false,
        version: 1,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            platform: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        prompt,
        qualityScore: qualityCheck.score,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating prompt:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
