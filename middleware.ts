import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAuditLog } from "@/lib/monitoring/audit";
import { AuditResource } from "@prisma/client";

/**
 * Determine audit resource type from request path
 */
function getResourceFromPath(pathname: string): {
  resource: AuditResource;
  action: string;
} | null {
  // Skip non-auditable paths
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return null;
  }

  // Project operations
  if (pathname.includes("/api/projects")) {
    return { resource: AuditResource.PROJECT, action: "api_access" };
  }

  // Content operations
  if (pathname.includes("/api/content")) {
    return { resource: AuditResource.CONTENT, action: "api_access" };
  }

  // Platform operations
  if (pathname.includes("/api/platforms")) {
    return { resource: AuditResource.PLATFORM, action: "api_access" };
  }

  // Settings operations
  if (pathname.includes("/api/settings")) {
    return { resource: AuditResource.SETTINGS, action: "api_access" };
  }

  // Cron job operations
  if (pathname.includes("/api/cron")) {
    return { resource: AuditResource.CRON_JOB, action: "api_access" };
  }

  // Email campaign operations
  if (pathname.includes("/api/email")) {
    return { resource: AuditResource.EMAIL_CAMPAIGN, action: "api_access" };
  }

  // User operations
  if (pathname.includes("/api/user")) {
    return { resource: AuditResource.USER, action: "api_access" };
  }

  return null;
}

/**
 * Extract resource ID from request
 */
function extractResourceId(req: NextRequest): string {
  const pathname = req.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);

  // Look for UUID-like segment (resource ID)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const cuidPattern = /^c[0-9a-z]{24}$/i;

  for (const segment of segments) {
    if (uuidPattern.test(segment) || cuidPattern.test(segment)) {
      return segment;
    }
  }

  // Fallback to pathname
  return pathname;
}

/**
 * Audit logging middleware
 */
async function auditRequest(req: NextRequest, userId?: string, userEmail?: string) {
  try {
    const resourceInfo = getResourceFromPath(req.nextUrl.pathname);

    if (!resourceInfo) {
      return; // Skip non-auditable paths
    }

    const { resource, action } = resourceInfo;
    const resourceId = extractResourceId(req);

    // Create audit log entry (fire and forget - don't block request)
    createAuditLog({
      userId,
      userEmail,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      action: `${req.method}_${action}`,
      resource,
      resourceId,
      metadata: {
        method: req.method,
        path: req.nextUrl.pathname,
        query: Object.fromEntries(req.nextUrl.searchParams),
      },
    }).catch((error) => {
      // Log audit failures but don't interrupt request flow
      console.error("Audit logging failed:", error);
    });
  } catch (error) {
    console.error("Audit middleware error:", error);
  }
}

export default withAuth(
  async function middleware(req) {
    // Get user info from token
    const token = req.nextauth.token;
    const userId = token?.sub;
    const userEmail = token?.email as string | undefined;

    // Audit the request
    await auditRequest(req, userId, userEmail);

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protected routes configuration
export const config = {
  matcher: [
    "/admin/:path*",
    "/settings/:path*",
    "/dashboard/:path*",
    "/api/projects/:path*",
    "/api/content/:path*",
    "/api/platforms/:path*",
    "/api/settings/:path*",
    "/api/cron/:path*",
    "/api/email/:path*",
    "/api/user/:path*",
  ],
};
