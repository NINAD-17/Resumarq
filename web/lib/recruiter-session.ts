import { cookies } from "next/headers";
import { createHmac } from "crypto";

const COOKIE_NAME = "recruiter-session";
const SECRET = process.env.BETTER_AUTH_SECRET || "fallback-secret";

export interface RecruiterSessionData {
  ip: string;
  token: string;
  analysisId?: string;
}

/**
 * Sign a payload using HMAC-SHA256.
 * Returns "base64payload.base64signature"
 */
function sign(payload: string): string {
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sig}`;
}

/**
 * Verify and decode a signed cookie value.
 * Returns null if invalid.
 */
function verify(value: string): string | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;

  const [encoded, sig] = parts;
  const payload = Buffer.from(encoded, "base64url").toString("utf-8");
  const expectedSig = createHmac("sha256", SECRET).update(payload).digest("base64url");

  if (sig !== expectedSig) return null;
  return payload;
}

/**
 * Set the recruiter session cookie (server-side, in API routes / Server Actions).
 */
export async function setRecruiterSession(data: RecruiterSessionData): Promise<void> {
  const cookieStore = await cookies();
  const payload = JSON.stringify(data);
  const signed = sign(payload);

  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get the recruiter session from cookie (server-side).
 * Returns null if no valid cookie exists.
 */
export async function getRecruiterSession(): Promise<RecruiterSessionData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  const payload = verify(cookie.value);
  if (!payload) return null;

  try {
    return JSON.parse(payload) as RecruiterSessionData;
  } catch {
    return null;
  }
}

/**
 * Clear the recruiter session cookie.
 */
export async function clearRecruiterSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Extract client IP from a request.
 * Uses x-forwarded-for header (standard for reverse proxies).
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    return forwarded.split(",")[0].trim();
  }
  // Fallback for local development
  return "127.0.0.1";
}
