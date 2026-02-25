import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API Route Handler
 *
 * This catch-all route handles all authentication endpoints:
 * - POST /api/auth/sign-in/email - Email/password sign in
 * - POST /api/auth/sign-up/email - Email/password sign up
 * - GET  /api/auth/sign-in/social?provider=google - Google OAuth
 * - POST /api/auth/sign-out - Sign out
 * - GET  /api/auth/session - Get current session
 *
 * Better Auth handles all the routing internally.
 */
export const { GET, POST } = toNextJsHandler(auth);
