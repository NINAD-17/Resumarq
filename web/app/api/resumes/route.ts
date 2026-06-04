import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { uploadToS3 } from "@/lib/s3";
import { insertResume, getResumesByUser } from "@/lib/db/resumes";
import { toResumeResponse } from "@/types/resume";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["application/pdf"];

/**
 * POST /api/resumes — Upload a resume PDF to S3 and save metadata.
 *
 * Expects multipart/form-data with a "file" field.
 * Supports both Better Auth sessions and recruiter sessions.
 */
export async function POST(request: NextRequest) {
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
      // Check if recruiter hasn't already used their free analysis
      const { hasUsedFreeAnalysis } = await import("@/lib/db/demo-access");
      const used = await hasUsedFreeAnalysis(recruiterSession.ip, recruiterSession.token);
      if (used) {
        return NextResponse.json(
          { error: "Free analysis already used. Sign in for more." },
          { status: 403 },
        );
      }
      userId = `recruiter-${recruiterSession.ip}`;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 5 MB" },
        { status: 400 },
      );
    }

    // Convert File to Buffer for S3 upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const s3Key = await uploadToS3(buffer, userId, file.name, file.type);

    // Save metadata to MongoDB
    const resume = await insertResume({
      userId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      s3Key,
      uploadedAt: new Date(),
    });

    return NextResponse.json(toResumeResponse(resume), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/resumes — List all resumes for the authenticated user.
 */
export async function GET() {
  try {
    const session = await requireSession();
    const resumes = await getResumesByUser(session.user.id);

    return NextResponse.json(resumes.map(toResumeResponse));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Resume list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resumes" },
      { status: 500 },
    );
  }
}
