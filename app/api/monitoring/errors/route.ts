/**
 * Error Logs API Endpoint
 *
 * GET /api/monitoring/errors - List error logs with filters
 * POST /api/monitoring/errors/:id/update - Update error status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { apiErrorHandler } from '@/lib/monitoring/error-handler';
import { AuthorizationError, ValidationError } from '@/lib/monitoring/sentry';
import { ErrorLevel, ErrorStatus } from '@prisma/client';

/**
 * GET /api/monitoring/errors
 * List error logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new AuthorizationError('Authentication required');
    }

    // Only admins can view error logs
    if (session.user.role !== 'ADMIN') {
      throw new AuthorizationError('Admin access required');
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const level = searchParams.get('level') as ErrorLevel | null;
    const status = searchParams.get('status') as ErrorStatus | null;
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const environment = searchParams.get('environment');
    const errorType = searchParams.get('errorType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
    const sortBy = searchParams.get('sortBy') || 'lastSeenAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: any = {};

    if (level) where.level = level;
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (projectId) where.projectId = projectId;
    if (environment) where.environment = environment;
    if (errorType) where.errorType = errorType;
    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { errorType: { contains: search, mode: 'insensitive' } },
        { errorCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query with pagination
    const [errors, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          sentryEventId: true,
          errorHash: true,
          level: true,
          message: true,
          errorType: true,
          errorCode: true,
          userId: true,
          projectId: true,
          environment: true,
          url: true,
          method: true,
          status: true,
          assignedTo: true,
          resolvedAt: true,
          occurrences: true,
          firstSeenAt: true,
          lastSeenAt: true,
          notified: true,
        },
      }),
      prisma.errorLog.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      errors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    return apiErrorHandler(error as Error, request, {
      userId: (await getSession())?.user?.id,
    });
  }
}
