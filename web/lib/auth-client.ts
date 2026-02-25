import { createAuthClient } from "better-auth/react";

/**
 * Better Auth Client
 *
 * This creates client-side hooks for authentication.
 * Use these hooks in your React components.
 *
 * Available hooks:
 * - useSession() - Get current session and user data
 * - signIn - Sign in methods (email, google, etc.)
 * - signUp - Sign up with email/password
 * - signOut() - Sign out the current user
 */
export const authClient = createAuthClient({
    // Base URL of your app - Better Auth will append /api/auth automatically
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export individual hooks and methods for convenience
export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
} = authClient;
