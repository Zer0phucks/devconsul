/**
 * Audit Logs API Endpoint
 *
 * GET /api/monitoring/audit - List audit logs with filters
 * POST /api/monitoring/audit/export - Export audit logs to CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helpers';
import { authOptions } from '@/lib/auth-helpers';
import { apiErrorHandler } from '@/lib/monitoring/error-handler';
import { AuthorizationError } from '@/lib/monitoring/sentry';
import { queryAuditLogs, exportAuditLogsToCSV } from '@/lib/monitoring/audit';
import { AuditResource } from '@prisma/client';

/**
 * GET /api/monitoring/audit
 * List audit logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new AuthorizationError('Authentication required');
    }

    // Only admins can view all audit logs
    // Regular users can only view their own audit logs
    const isAdmin = session.user.role === 'ADMIN';

    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const userId = isAdmin ? searchParams.get('userId') : session.user.id;
    const resource = searchParams.get('resource') as AuditResource | null;
    const resourceId = searchParams.get('resourceId');
    const action = searchParams.get('action');
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = (page - 1) * limit;

    // Query audit logs
    const { logs, total } = await queryAuditLogs({
      userId: userId || undefined,
      resource: resource || undefined,
      resourceId: resourceId || undefined,
      action: action || undefined,
      projectId: projectId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      logs,
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
      userId: (await getServerSession(authOptions))?.user?.id,
    });
  }
}

/**
 * POST /api/monitoring/audit/export
 * Export audit logs to CSV
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new AuthorizationError('Authentication required');
    }

    // Only admins can export audit logs
    if (session.user.role !== 'ADMIN') {
      throw new AuthorizationError('Admin access required');
    }

    const body = await request.json();
    const {
      userId,
      resource,
      resourceId,
      action,
      projectId,
      startDate,
      endDate,
    } = body;

    // Query audit logs (no limit for export)
    const { logs } = await queryAuditLogs({
      userId,
      resource,
      resourceId,
      action,
      projectId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    // Generate CSV
    const csv = exportAuditLogsToCSV(logs);

    // Return CSV file
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`,
      },
    });
  } catch (error) {
    return apiErrorHandler(error as Error, request, {
      userId: (await getServerSession(authOptions))?.user?.id,
    });
  }
}
