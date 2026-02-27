import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Get the authenticated session in a Next.js API route or server component.
 * Returns null if the user is not authenticated.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

/**
 * Same as getServerSession but throws if not authenticated.
 * Use in API routes where auth is required.
 */
export async function requireSession() {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}
