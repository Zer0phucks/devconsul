/**
 * Template Render API
 * POST /api/templates/render - Render template with variables
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { renderTemplateSchema } from '@/lib/validations/template';
import { renderTemplate } from '@/lib/templates/engine';

/**
 * POST /api/templates/render
 * Render a template with provided variables
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validated = renderTemplateSchema.parse(body);

    let templateContent: string;

    // Get template content from ID or direct content
    if (validated.templateId) {
      const template = await db.template.findUnique({
        where: { id: validated.templateId },
        select: { content: true, subject: true },
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      templateContent = template.content;
    } else if (validated.templateContent) {
      templateContent = validated.templateContent;
    } else {
      return NextResponse.json(
        { error: 'Either templateId or templateContent must be provided' },
        { status: 400 }
      );
    }

    // Render template
    const rendered = renderTemplate(templateContent, validated.variables as any, {
      strict: validated.strict,
      escapeHtml: validated.escapeHtml,
    });

    return NextResponse.json({
      rendered,
      variables: validated.variables,
    });
  } catch (error: any) {
    console.error('Error rendering template:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to render template' },
      { status: 500 }
    );
  }
}
