import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./db";
import { sendEmail, getVerificationEmailHtml, getPasswordResetEmailHtml } from "./email";

export const auth = betterAuth({
  // Database adapter for storing users, sessions, accounts
  database: mongodbAdapter(client.db(), {
    client // providing the client enables database transactions
  }),

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    // Set to true to require email verification before sign in
    requireEmailVerification: false, // Toggle to true when ready for production

    // Send password reset email
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: getPasswordResetEmailHtml(url),
      });
    },
  },

  // Email verification handler
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: getVerificationEmailHtml(url),
      });
    },
    sendOnSignUp: true, // Automatically send verification email on sign up
  },

  // OAuth Providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache for 5 minutes
    },
  },

  // Security - CSRF protection
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],

  // Base URL for auth callbacks (from env)
  baseURL: process.env.BETTER_AUTH_URL,

  // Secret for signing tokens (from env - BETTER_AUTH_SECRET)
  secret: process.env.BETTER_AUTH_SECRET,
});

// Export types for use in API routes
export type Session = typeof auth.$Infer.Session;
