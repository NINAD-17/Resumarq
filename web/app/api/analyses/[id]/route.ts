import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getAnalysisById } from "@/lib/db/analyses";
import { getResumeById } from "@/lib/db/resumes";
import { toAnalysisResponse } from "@/types/analysis";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/analyses/[id] — Get a single analysis with results.
 *
 * This is the endpoint the frontend polls to check if analysis is complete.
 * Supports both Better Auth sessions and recruiter sessions.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    let userId: string;

    try {
      const session = await requireSession();
      userId = session.user.id;
    } catch {
      // Check for recruiter session as fallback
      const { getRecruiterSession } = await import("@/lib/recruiter-session");
      const recruiterSession = await getRecruiterSession();
      if (!recruiterSession) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = `recruiter-${recruiterSession.ip}`;
    }

    const { id } = await params;

    const analysis = await getAnalysisById(id, userId);
    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 },
      );
    }

    // Fetch the resume name for display
    const resume = await getResumeById(analysis.resumeId, userId);

    return NextResponse.json(
      toAnalysisResponse(analysis, resume?.fileName),
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get analysis error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 },
    );
  }
}
