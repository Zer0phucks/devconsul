/**
 * Prompt Library Detail API
 * GET /api/prompts/[id] - Get prompt by ID
 * PATCH /api/prompts/[id] - Update prompt
 * DELETE /api/prompts/[id] - Delete prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { updatePromptSchema } from '@/lib/validations/prompt';
import { validatePromptQuality } from '@/lib/validations/prompt';

/**
 * GET /api/prompts/[id]
 * Get a specific prompt with version history and usage stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Fetch prompt with relationships
    const prompt = await db.promptLibrary.findUnique({
      where: { id: params.id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            platform: true,
            content: true,
          },
        },
        versions: {
          select: {
            id: true,
            version: true,
            createdAt: true,
            name: true,
          },
          orderBy: { version: 'desc' },
        },
        parent: {
          select: {
            id: true,
            version: true,
            name: true,
          },
        },
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess =
      prompt.userId === user.id ||
      prompt.isDefault ||
      prompt.isPublic;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate quality score
    const qualityCheck = validatePromptQuality(prompt.systemPrompt, prompt.userPrompt);

    return NextResponse.json({
      prompt,
      qualityScore: qualityCheck.score,
      qualitySuggestions: qualityCheck.suggestions,
    });
  } catch (error: any) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/prompts/[id]
 * Update a prompt
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Fetch existing prompt
    const existingPrompt = await db.promptLibrary.findUnique({
      where: { id: params.id },
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Check ownership
    if (existingPrompt.userId !== user.id) {
      return NextResponse.json(
        { error: 'Only prompt owner can update' },
        { status: 403 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validated = updatePromptSchema.parse(body);

    // Check if content changed (for versioning)
    const contentChanged =
      (validated.systemPrompt && validated.systemPrompt !== existingPrompt.systemPrompt) ||
      (validated.userPrompt && validated.userPrompt !== existingPrompt.userPrompt);

    // Validate quality if prompts changed
    let qualityCheck;
    const warnings: string[] = [];
    if (contentChanged) {
      const systemPrompt = validated.systemPrompt || existingPrompt.systemPrompt;
      const userPrompt = validated.userPrompt || existingPrompt.userPrompt;
      qualityCheck = validatePromptQuality(systemPrompt, userPrompt);

      if (qualityCheck.score < 50) {
        warnings.push(`Prompt quality score is low (${qualityCheck.score}/100)`);
        warnings.push(...qualityCheck.suggestions);
      }
    }

    // Update prompt
    const updatedPrompt = await db.promptLibrary.update({
      where: { id: params.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.category && { category: validated.category }),
        ...(validated.systemPrompt && { systemPrompt: validated.systemPrompt }),
        ...(validated.userPrompt && { userPrompt: validated.userPrompt }),
        ...(validated.templateId !== undefined && { templateId: validated.templateId }),
        ...(validated.variables && { variables: validated.variables }),
        ...(validated.platform && { platform: validated.platform }),
        ...(validated.contentType !== undefined && { contentType: validated.contentType }),
        ...(validated.tone !== undefined && { tone: validated.tone }),
        ...(validated.targetLength !== undefined && { targetLength: validated.targetLength }),
        ...(validated.tags && { tags: validated.tags }),
        ...(validated.isPublic !== undefined && { isPublic: validated.isPublic }),
        ...(contentChanged && { version: existingPrompt.version + 1 }),
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

    return NextResponse.json({
      prompt: updatedPrompt,
      qualityScore: qualityCheck?.score,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error: any) {
    console.error('Error updating prompt:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/prompts/[id]
 * Delete a prompt
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Fetch existing prompt
    const existingPrompt = await db.promptLibrary.findUnique({
      where: { id: params.id },
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Check ownership
    if (existingPrompt.userId !== user.id) {
      return NextResponse.json(
        { error: 'Only prompt owner can delete' },
        { status: 403 }
      );
    }

    // Prevent deletion of default prompts
    if (existingPrompt.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default prompts' },
        { status: 403 }
      );
    }

    // Delete prompt
    await db.promptLibrary.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Prompt deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
