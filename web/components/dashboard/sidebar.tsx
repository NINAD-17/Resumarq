"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, ClipboardList, LogOut, Menu, X, Lock, LogIn, Sparkles, FileCheck, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "New Analysis",
    href: "/dashboard",
    icon: FilePlus2,
  },
  {
    label: "My Analyses",
    href: "/dashboard/analyses",
    icon: ClipboardList,
  },
];

interface SidebarProps {
  demoMode?: boolean;
  onActionClick?: (action: string) => void;
  recruiterAnalysisId?: string | null;
}

export function Sidebar({ demoMode = false, onActionClick, recruiterAnalysisId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const handleDemoSignIn = () => {
    if (onActionClick) {
      onActionClick("signin");
    } else {
      router.push("/sign-in");
    }
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-5">
        <Link href={demoMode ? "/demo" : "/dashboard"} className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Zap className="size-4 fill-current" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Resumarq
          </span>
        </Link>
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-accent cursor-pointer"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 pt-2">
        {navItems.map((item) => {
          const isActive = !demoMode && (
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
          );

          if (demoMode) {
            return (
              <button
                key={item.href}
                onClick={() => {
                  setMobileOpen(false);
                  onActionClick?.(item.href);
                }}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-muted-foreground/60 hover:bg-accent/50 hover:text-muted-foreground cursor-not-allowed group"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="size-[18px]" />
                  {item.label}
                </div>
                <Lock className="size-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </Link>
          );
        })}
        
        {demoMode && (
          <div className="pt-2 mt-2 border-t border-border/50">
            <Link
              href="/demo"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/demo" || pathname.startsWith("/demo/analyses")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Sparkles className="size-[18px]" />
              Demo Analysis
            </Link>

            {/* Show link to recruiter's own analysis when available */}
            {recruiterAnalysisId && (
              <Link
                href={`/dashboard/analyses/${recruiterAnalysisId}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === `/dashboard/analyses/${recruiterAnalysisId}`
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <FileCheck className="size-[18px]" />
                Your Analysis
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        {demoMode ? (
          <button
            onClick={handleDemoSignIn}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 cursor-pointer"
          >
            <LogIn className="size-[18px]" />
            Sign In
          </button>
        ) : (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground cursor-pointer"
          >
            <LogOut className="size-[18px]" />
            Sign Out
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* ─── Mobile hamburger button (fixed top-left) ──────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex size-10 items-center justify-center rounded-lg border border-border bg-card shadow-sm md:hidden cursor-pointer"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {/* ─── Mobile overlay ────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Mobile slide-out sidebar ──────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-sidebar transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      {/* ─── Desktop sidebar (always visible) ──────────────────────── */}
      <aside className="hidden md:flex h-screen w-[240px] shrink-0 flex-col border-r border-border bg-sidebar">
        {sidebarContent}
      </aside>
    </>
  );
}
