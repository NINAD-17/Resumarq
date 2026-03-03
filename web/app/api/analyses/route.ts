import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { insertAnalysis, getAnalysesByUser } from "@/lib/db/analyses";
import { getResumesByUser } from "@/lib/db/resumes";
import { getResumeById } from "@/lib/db/resumes";
import { toAnalysisResponse } from "@/types/analysis";
import { inngest } from "@/inngest/client";

const MAX_JD_LENGTH = 10_000; // Characters

/**
 * POST /api/analyses — Start a new analysis.
 *
 * Body (JSON): { resumeId: string, jdText: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const body = await request.json();
    const { resumeId, jdText } = body;

    // Validate inputs
    if (!resumeId || typeof resumeId !== "string") {
      return NextResponse.json(
        { error: "resumeId is required" },
        { status: 400 },
      );
    }

    if (!jdText || typeof jdText !== "string" || jdText.trim().length === 0) {
      return NextResponse.json(
        { error: "Job description text is required" },
        { status: 400 },
      );
    }

    if (jdText.length > MAX_JD_LENGTH) {
      return NextResponse.json(
        { error: `Job description must be under ${MAX_JD_LENGTH} characters` },
        { status: 400 },
      );
    }

    // Verify the resume exists and belongs to this user
    const resume = await getResumeById(resumeId, userId);
    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 },
      );
    }

    // Create the analysis record in "pending" status
    const now = new Date();
    const analysis = await insertAnalysis({
      userId,
      resumeId,
      jdText: jdText.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Fire Inngest event to start background processing
    await inngest.send({
      name: "analysis/created",
      data: {
        analysisId: analysis._id.toHexString(),
        resumeS3Key: resume.s3Key,
        jdText: jdText.trim(),
      },
    });

    return NextResponse.json(
      toAnalysisResponse(analysis, resume.fileName),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create analysis error:", error);
    return NextResponse.json(
      { error: "Failed to create analysis" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/analyses — List all analyses for the authenticated user.
 */
export async function GET() {
  try {
    const session = await requireSession();
    const [analyses, resumes] = await Promise.all([
      getAnalysesByUser(session.user.id),
      getResumesByUser(session.user.id),
    ]);

    // Build a map of resumeId → fileName for quick lookup
    const resumeNames = new Map(
      resumes.map((r) => [r._id.toHexString(), r.fileName]),
    );

    return NextResponse.json(
      analyses.map((a) => toAnalysisResponse(a, resumeNames.get(a.resumeId))),
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("List analyses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analyses" },
      { status: 500 },
    );
  }
}
