"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { LoginModal } from "@/components/dashboard/login-modal";

interface DashboardLayoutClientProps {
  isRecruiterMode: boolean;
}

export function DashboardLayoutClient({ isRecruiterMode }: DashboardLayoutClientProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [recruiterAnalysisId, setRecruiterAnalysisId] = useState<string | null>(null);

  // Fetch recruiter status to get their analysisId for sidebar link
  useEffect(() => {
    if (!isRecruiterMode) return;
    fetch("/api/recruiter/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.analysisId) setRecruiterAnalysisId(data.analysisId);
      })
      .catch(() => {});
  }, [isRecruiterMode]);

  if (isRecruiterMode) {
    return (
      <>
        <Sidebar
          demoMode={true}
          onActionClick={() => setShowLoginModal(true)}
          recruiterAnalysisId={recruiterAnalysisId}
        />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </>
    );
  }

  // Regular authenticated user — normal sidebar, no modal
  return <Sidebar />;
}
