/**
 * Templates API - List and Create
 * GET /api/templates - List templates
 * POST /api/templates - Create template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { createTemplateSchema, queryTemplatesSchema } from '@/lib/validations/template';
import { validateTemplateContent } from '@/lib/validations/template';
import { extractVariableNames } from '@/lib/templates/engine';

/**
 * GET /api/templates
 * List templates with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      projectId: searchParams.get('projectId') || undefined,
      platform: searchParams.get('platform') || undefined,
      category: searchParams.get('category') || undefined,
      isDefault: searchParams.get('isDefault') === 'true' ? true : undefined,
      isPublic: searchParams.get('isPublic') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') || 'createdAt') as 'name' | 'createdAt' | 'updatedAt' | 'usageCount',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    const validated = queryTemplatesSchema.parse(queryParams);

    // Build query
    const where: any = {
      OR: [
        { userId: user.id }, // User's own templates
        { isDefault: true }, // System default templates
        { isPublic: true }, // Public templates
      ],
    };

    if (validated.projectId) {
      where.projectId = validated.projectId;
    }

    if (validated.platform) {
      where.platform = validated.platform;
    }

    if (validated.category) {
      where.category = validated.category;
    }

    if (validated.isDefault !== undefined) {
      where.isDefault = validated.isDefault;
    }

    if (validated.isPublic !== undefined) {
      where.isPublic = validated.isPublic;
    }

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: 'insensitive' } },
        { description: { contains: validated.search, mode: 'insensitive' } },
        { tags: { has: validated.search } },
      ];
    }

    // Fetch templates
    const [templates, total] = await Promise.all([
      db.template.findMany({
        where,
        take: validated.limit,
        skip: validated.offset,
        orderBy: { [validated.sortBy]: validated.sortOrder },
        include: {
          promptLibrary: {
            take: 3,
            select: { id: true, name: true },
          },
        },
      }),
      db.template.count({ where }),
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        total,
        limit: validated.limit,
        offset: validated.offset,
        hasMore: validated.offset + validated.limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Create new template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = createTemplateSchema.parse(body);

    // Validate template content
    const contentValidation = validateTemplateContent(validated.content);
    if (!contentValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid template content',
          details: contentValidation.errors,
        },
        { status: 400 }
      );
    }

    // Extract variables from template
    const detectedVariables = extractVariableNames(validated.content);

    // Create template
    const template = await db.template.create({
      data: {
        name: validated.name,
        description: validated.description,
        platform: validated.platform,
        category: validated.category,
        content: validated.content,
        subject: validated.subject,
        variables: validated.variables.length > 0 ? validated.variables : detectedVariables,
        tags: validated.tags,
        isDefault: validated.isDefault,
        isPublic: validated.isPublic,
        projectId: validated.projectId,
        userId: user.id,
        version: 1,
      },
    });

    return NextResponse.json(
      {
        template,
        warnings: contentValidation.warnings,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating template:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
