import { NextResponse } from "next/server";
import { getRecruiterSession } from "@/lib/recruiter-session";
import { findDemoAccess } from "@/lib/db/demo-access";

/**
 * GET /api/recruiter/check
 *
 * Returns the current recruiter session status:
 * - isRecruiter: true if a valid recruiter cookie exists
 * - canAnalyze: true if the recruiter hasn't used their free analysis yet
 * - analysisId: the ID of their analysis (if they've already used it)
 */
export async function GET() {
  try {
    const session = await getRecruiterSession();

    if (!session) {
      return NextResponse.json({
        isRecruiter: false,
        canAnalyze: false,
      });
    }

    const record = await findDemoAccess(session.ip, session.token);
    const used = !!record?.usedAt;

    return NextResponse.json({
      isRecruiter: true,
      canAnalyze: !used,
      analysisId: record?.analysisId ?? null,
      ip: session.ip,
    });
  } catch (error) {
    console.error("Recruiter check error:", error);
    return NextResponse.json({
      isRecruiter: false,
      canAnalyze: false,
    });
  }
}
