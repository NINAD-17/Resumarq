import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route Protection Proxy (formerly middleware)
 *
 * Uses cookie-based session check (NO DB calls - runs on Edge runtime).
 * Actual session validation happens in API routes/server components.
 */

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/settings",
  "/resume",
  "/analysis",
];

// Routes only for unauthenticated users (signed-in users get bounced to home)
const authRoutes = ["/sign-in", "/sign-up", "/forgot-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session token from cookie (Better Auth default cookie name)
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;
  // Also check for recruiter session cookie
  const recruiterToken = request.cookies.get("recruiter-session")?.value;

  // Check if it's the home page (exact match) or other protected routes
  const isHomePage = pathname === "/";
  const isProtectedRoute =
    // isHomePage || protectedRoutes.some((route) => pathname.startsWith(route));
    protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to sign-in if accessing protected route without any session cookie
  if (isProtectedRoute && !sessionToken && !recruiterToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to home if accessing auth routes with active session cookie
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configure which routes the proxy runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
