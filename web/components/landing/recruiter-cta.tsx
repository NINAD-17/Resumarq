"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface RecruiterCTAProps {
  token: string;
}

/**
 * Client-side recruiter button.
 * Uses onClick + router to navigate — so the API URL with token
 * is never exposed in the browser status bar on hover.
 */
export function RecruiterCTA({ token }: RecruiterCTAProps) {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to the init route — token is sent as a query param
    // but the URL is never visible on hover since this is a <button>
    router.push(`/api/recruiter/init?token=${encodeURIComponent(token)}`);
  };

  return (
    <div className="w-full sm:w-auto p-1 rounded-full bg-gradient-to-r from-score-ats via-score-match to-score-impact animate-pulse">
      <Button
        size="lg"
        onClick={handleClick}
        className="w-full sm:w-auto text-base h-12 px-8 bg-background text-foreground hover:bg-background/90 cursor-pointer rounded-full border-none"
      >
        Free for Recruiters – 1 Analysis
      </Button>
    </div>
  );
}
