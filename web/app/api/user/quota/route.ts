import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getOrCreateProfile } from "@/lib/db/user-profiles";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    
    // Fetch profile (which automatically creates it if missing and gives 1 free quota)
    const profile = await getOrCreateProfile(session.user.id);
    
    return NextResponse.json({
      quotaRemaining: profile.quotaRemaining,
      plan: profile.plan,
      subscriptionStatus: profile.subscriptionStatus,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Quota fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quota" },
      { status: 500 }
    );
  }
}
