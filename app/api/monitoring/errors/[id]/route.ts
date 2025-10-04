/**
 * Single Error Log API Endpoint
 *
 * GET /api/monitoring/errors/:id - Get error details
 * PATCH /api/monitoring/errors/:id - Update error status/assignment
 * DELETE /api/monitoring/errors/:id - Delete error log
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { apiErrorHandler, createNotFoundError, AuthorizationError, ValidationError } from '@/lib/monitoring/error-handler';
import { createAuditLog } from '@/lib/monitoring/audit';
import { ErrorStatus } from '@prisma/client';

/**
 * GET /api/monitoring/errors/:id
 * Get detailed error information
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new AuthorizationError('Authentication required');
    }

    if (session.user.role !== 'ADMIN') {
      throw new AuthorizationError('Admin access required');
    }

    const { id } = await context.params;
    const error = await prisma.errorLog.findUnique({
      where: { id },
    });

    if (!error) {
      throw createNotFoundError('Error log', id);
    }

    return NextResponse.json({ error });
  } catch (error) {
    return apiErrorHandler(error as Error, request, {
      userId: (await getSession())?.user?.id,
    });
  }
}

/**
 * PATCH /api/monitoring/errors/:id
 * Update error status, assignment, or resolution
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new AuthorizationError('Authentication required');
    }

    if (session.user.role !== 'ADMIN') {
      throw new AuthorizationError('Admin access required');
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, assignedTo, resolution, relatedIssue } = body;

    // Validate status if provided
    if (status && !Object.values(ErrorStatus).includes(status)) {
      throw new ValidationError('Invalid error status', 'status');
    }

    // Get current error for audit trail
    const currentError = await prisma.errorLog.findUnique({
      where: { id },
    });

    if (!currentError) {
      throw createNotFoundError('Error log', id);
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status !== undefined) {
      updateData.status = status;
      if (status === ErrorStatus.RESOLVED) {
        updateData.resolvedAt = new Date();
      }
    }

    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (resolution !== undefined) updateData.resolution = resolution;
    if (relatedIssue !== undefined) updateData.relatedIssue = relatedIssue;

    // Update error log
    const updatedError = await prisma.errorLog.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      action: 'update',
      resource: 'ERROR_LOG' as any,
      resourceId: id,
      oldValues: {
        status: currentError.status,
        assignedTo: currentError.assignedTo,
        resolution: currentError.resolution,
        relatedIssue: currentError.relatedIssue,
      },
      newValues: updateData,
    });

    return NextResponse.json({ error: updatedError });
  } catch (error) {
    return apiErrorHandler(error as Error, request, {
      userId: (await getSession())?.user?.id,
    });
  }
}

/**
 * DELETE /api/monitoring/errors/:id
 * Delete error log (admin only)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new AuthorizationError('Authentication required');
    }

    if (session.user.role !== 'ADMIN') {
      throw new AuthorizationError('Admin access required');
    }

    const { id } = await context.params;
    // Get error before deletion for audit
    const error = await prisma.errorLog.findUnique({
      where: { id },
    });

    if (!error) {
      throw createNotFoundError('Error log', id);
    }

    // Delete error log
    await prisma.errorLog.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      action: 'delete',
      resource: 'ERROR_LOG' as any,
      resourceId: id,
      oldValues: {
        errorHash: error.errorHash,
        message: error.message,
        level: error.level,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorHandler(error as Error, request, {
      userId: (await getSession())?.user?.id,
    });
  }
}
