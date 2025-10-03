import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Define protected routes
const protectedRoutes = [
  "/admin",
  "/settings",
  "/dashboard",
  "/api/projects",
  "/api/content",
  "/api/platforms",
  "/api/settings",
  "/api/cron",
  "/api/email",
  "/api/user",
];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

export async function middleware(req: NextRequest) {
  const { response, user } = await updateSession(req);

  // Protect routes that require authentication
  if (isProtectedRoute(req.nextUrl.pathname)) {
    if (!user) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Note: Audit logging removed from middleware as Prisma doesn't work on edge runtime
  // Audit logging should be done in API routes instead

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
