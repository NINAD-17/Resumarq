import { Sidebar } from "@/components/dashboard/sidebar";
import { DemoLayoutClient } from "./layout-client";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DemoLayoutClient />
      <main className="flex-1 overflow-y-auto">
        {/* pt-16 on mobile for hamburger button clearance, normal on desktop */}
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-8 md:px-6 md:pt-8 md:pb-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
