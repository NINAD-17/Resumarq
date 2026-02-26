import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getResumeById, deleteResumeById } from "@/lib/db/resumes";
import { deleteFromS3, getPresignedDownloadUrl } from "@/lib/s3";
import { toResumeResponse } from "@/types/resume";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/resumes/[id] — Get a single resume's metadata + download URL.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const resume = await getResumeById(id, session.user.id);
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Generate a temporary download URL
    const downloadUrl = await getPresignedDownloadUrl(resume.s3Key);

    return NextResponse.json({
      ...toResumeResponse(resume),
      downloadUrl,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Resume fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/resumes/[id] — Delete a resume from S3 and MongoDB.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id } = await params;

    // Find the resume first to get the S3 key
    const resume = await getResumeById(id, session.user.id);
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Delete DB record first, then S3.
    // Why this order? If S3 delete fails, we just have an orphaned file (costs pennies, invisible to user).
    // The reverse (S3 first, DB fail) would leave a DB record pointing to a deleted file — broken downloads.
    await deleteResumeById(id, session.user.id);

    try {
      await deleteFromS3(resume.s3Key);
    } catch (s3Error) {
      // Log but don't fail — the DB record is already gone, user sees it as deleted.
      // Orphaned S3 files can be cleaned up with a periodic job or S3 lifecycle rules.
      console.error("S3 cleanup failed (orphaned file):", resume.s3Key, s3Error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Resume delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete resume" },
      { status: 500 },
    );
  }
}
