import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getAnalysisById, resetAnalysisForRetry } from "@/lib/db/analyses";
import { getResumeById } from "@/lib/db/resumes";
import { enqueueAnalysisJob } from "@/lib/redis";
import { toAnalysisResponse } from "@/types/analysis";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/analyses/[id]/retry — Re-enqueue a failed analysis for processing.
 *
 * Does not deduct extra quota since quota was already consumed for this analysis.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    let userId: string;

    try {
      const session = await requireSession();
      userId = session.user.id;
    } catch {
      // Recruiter session fallback
      const { getRecruiterSession } = await import("@/lib/recruiter-session");
      const recruiterSession = await getRecruiterSession();
      if (!recruiterSession) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = `recruiter-${recruiterSession.ip}`;
    }

    const { id } = await params;

    // Fetch existing analysis
    const analysis = await getAnalysisById(id, userId);
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    if (analysis.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed analyses can be retried" },
        { status: 400 }
      );
    }

    // Fetch resume to obtain s3Key
    const resume = await getResumeById(analysis.resumeId, userId);
    if (!resume) {
      return NextResponse.json({ error: "Associated resume not found" }, { status: 404 });
    }

    // Reset status in MongoDB to "pending"
    const resetSuccess = await resetAnalysisForRetry(id, userId);
    if (!resetSuccess) {
      return NextResponse.json(
        { error: "Failed to reset analysis for retry" },
        { status: 500 }
      );
    }

    // Re-enqueue job into Redis
    await enqueueAnalysisJob({
      analysisId: analysis._id.toHexString(),
      resumeS3Key: resume.s3Key,
      jdText: analysis.jdText || "",
    });

    const updatedAnalysis = {
      ...analysis,
      status: "pending" as const,
      error: undefined,
      results: undefined,
      completedAt: undefined,
      updatedAt: new Date(),
    };

    return NextResponse.json(
      toAnalysisResponse(updatedAnalysis, resume.fileName),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Retry analysis error:", error);
    return NextResponse.json(
      { error: "Failed to retry analysis" },
      { status: 500 }
    );
  }
}
