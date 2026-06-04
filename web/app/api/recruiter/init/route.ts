import { NextRequest, NextResponse } from "next/server";
import { getClientIP, setRecruiterSession } from "@/lib/recruiter-session";
import { findDemoAccess, createDemoAccess } from "@/lib/db/demo-access";

/**
 * GET /api/recruiter/init?token=<RECRUITER_TOKEN>
 *
 * Validates the recruiter token, checks IP usage, creates a session cookie,
 * and redirects the recruiter to the dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const recruiterToken = process.env.RECRUITER_TOKEN;

    // Validate token
    if (!token || !recruiterToken || token !== recruiterToken) {
      return NextResponse.redirect(new URL("/?error=invalid_token", request.url));
    }

    // Get client IP
    const ip = getClientIP(request);

    // Check if this IP has already been used
    const existing = await findDemoAccess(ip, token);

    if (existing?.usedAt) {
      // Already used their free analysis — set cookie so they can still view the result,
      // then redirect to dashboard which will show the "used" state
      await setRecruiterSession({ ip, token, analysisId: existing.analysisId });
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Create the demo access record if it doesn't exist yet
    if (!existing) {
      await createDemoAccess(ip, token);
    }

    // Set the recruiter session cookie
    await setRecruiterSession({ ip, token });

    // Redirect to the dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Recruiter init error:", error);
    return NextResponse.redirect(new URL("/?error=init_failed", request.url));
  }
}
