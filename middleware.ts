import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
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
  ],
};
