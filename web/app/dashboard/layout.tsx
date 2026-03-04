import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check — redirect to sign-in if not authenticated
  const session = await getServerSession();
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* pt-16 on mobile for hamburger button clearance, normal on desktop */}
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-8 md:px-6 md:pt-8 md:pb-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

