/**
 * Template API - Individual Operations
 * GET /api/templates/[id] - Get template by ID
 * PATCH /api/templates/[id] - Update template
 * DELETE /api/templates/[id] - Delete template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { updateTemplateSchema } from '@/lib/validations/template';
import { validateTemplateContent } from '@/lib/validations/template';
import { extractVariableNames } from '@/lib/templates/engine';

/**
 * GET /api/templates/[id]
 * Get template by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await context.params;
    // Fetch template
    const template = await db.template.findUnique({
      where: { id },
      include: {
        promptLibrary: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        versions: {
          select: {
            id: true,
            version: true,
            createdAt: true,
          },
          orderBy: { version: 'desc' },
        },
        contentHistory: {
          select: {
            id: true,
            createdAt: true,
            wasPublished: true,
            userRating: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check access - user owns it, or it's default/public
    const hasAccess =
      template.userId === user.id ||
      template.isDefault ||
      template.isPublic;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/templates/[id]
 * Update template
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await context.params;
    // Get existing template
    const existing = await db.template.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check ownership
    if (existing.userId !== user.id && !existing.isDefault) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = updateTemplateSchema.parse({ ...body, id });

    // Validate content if provided
    let contentValidation;
    if (validated.content) {
      contentValidation = validateTemplateContent(validated.content);
      if (!contentValidation.valid) {
        return NextResponse.json(
          {
            error: 'Invalid template content',
            details: contentValidation.errors,
          },
          { status: 400 }
        );
      }
    }

    // Extract variables if content changed
    const detectedVariables = validated.content
      ? extractVariableNames(validated.content)
      : undefined;

    // Update template
    const updated = await db.template.update({
      where: { id },
      data: {
        name: validated.name,
        description: validated.description,
        platform: validated.platform,
        category: validated.category,
        content: validated.content,
        subject: validated.subject,
        variables: validated.variables || detectedVariables,
        tags: validated.tags,
        isPublic: validated.isPublic,
        version: existing.version + 1,
      },
    });

    return NextResponse.json({
      template: updated,
      warnings: contentValidation?.warnings || [],
    });
  } catch (error: any) {
    console.error('Error updating template:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id]
 * Delete template
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await context.params;
    // Get existing template
    const existing = await db.template.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check ownership (can't delete default templates)
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 403 }
      );
    }

    // Delete template
    await db.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
