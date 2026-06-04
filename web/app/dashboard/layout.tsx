import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { getRecruiterSession } from "@/lib/recruiter-session";
import { DashboardLayoutClient } from "./layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check — check Better Auth first, then recruiter session
  const session = await getServerSession();
  const recruiterSession = !session ? await getRecruiterSession() : null;

  if (!session && !recruiterSession) {
    redirect("/sign-in");
  }

  const isRecruiterMode = !session && !!recruiterSession;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardLayoutClient isRecruiterMode={isRecruiterMode} />
      <main className="flex-1 overflow-y-auto">
        {/* pt-16 on mobile for hamburger button clearance, normal on desktop */}
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-8 md:px-6 md:pt-8 md:pb-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
