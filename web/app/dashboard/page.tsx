"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  Upload,
  FileText,
  ArrowRight,
  X,
  FileSearch,
  GitCompareArrows,
  Info,
  ExternalLink,
  Trash2,
  Check,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { fetcher } from "@/lib/fetcher";
import type { ResumeResponse } from "@/types/resume";

type AnalysisMode = "resume-only" | "resume-jd";

export default function NewAnalysisPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSavedResume, setSelectedSavedResume] = useState<ResumeResponse | null>(null);
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);

  const [jdText, setJdText] = useState("");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("resume-jd");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step tracking — simple 2-step flow
  const [step, setStep] = useState<1 | 2>(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // SWR: Recruiter status
  const { data: recruiterStatus } = useSWR<{
    isRecruiter: boolean;
    canAnalyze: boolean;
    analysisId?: string | null;
  }>("/api/recruiter/check", fetcher, { revalidateOnFocus: false });

  // SWR: Quota
  const { data: quota, mutate: mutateQuota } = useSWR<{
    quotaRemaining: number;
    plan: string;
  }>("/api/user/quota", fetcher, { revalidateOnFocus: true });

  // SWR: Saved Resumes
  const {
    data: savedResumes = [],
    isLoading: isLoadingResumes,
    mutate: mutateSavedResumes,
  } = useSWR<ResumeResponse[]>(
    recruiterStatus?.isRecruiter ? null : "/api/resumes",
    fetcher,
    { revalidateOnFocus: true }
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB");
      return;
    }

    setSelectedFile(file);
    setSelectedSavedResume(null); // Deselect saved resume when new file is uploaded
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are accepted");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File must be under 5 MB");
        return;
      }
      setSelectedFile(file);
      setSelectedSavedResume(null);
      setError(null);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this saved resume?")) return;

    setDeletingResumeId(resumeId);
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete resume");
      }

      mutateSavedResumes(
        (prev) => (prev || []).filter((r) => r.id !== resumeId),
        false
      );
      if (selectedSavedResume?.id === resumeId) {
        setSelectedSavedResume(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete resume");
    } finally {
      setDeletingResumeId(null);
    }
  };

  const hasResumeSelected = !!selectedFile || !!selectedSavedResume;

  const canSubmit =
    hasResumeSelected &&
    (analysisMode === "resume-only" || jdText.trim().length > 0) &&
    !isSubmitting;

  const handleSubmit = async (overrideQuota?: any) => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    const qRemaining = typeof overrideQuota === "number" ? overrideQuota : (quota?.quotaRemaining ?? 0);

    // Guard: Check client-side quota before uploading or processing
    if (!recruiterStatus?.isRecruiter && quota && qRemaining <= 0) {
      setShowPaymentModal(true);
      setIsSubmitting(false);
      return;
    }

    try {
      let resumeId: string;

      if (selectedSavedResume) {
        // Reuse existing uploaded resume
        resumeId = selectedSavedResume.id;
      } else if (selectedFile) {
        // Step 1: Upload new resume to S3
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/resumes", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || "Failed to upload resume");
        }

        const resume = await uploadRes.json();
        resumeId = resume.id;
        mutateSavedResumes(); // Revalidate saved resumes in background
      } else {
        throw new Error("Please select or upload a resume");
      }

      // Step 2: Create analysis
      const analysisRes = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          ...(analysisMode === "resume-jd" ? { jdText: jdText.trim() } : {}),
        }),
      });

      if (!analysisRes.ok) {
        const data = await analysisRes.json();
        if (data.code === "QUOTA_EXHAUSTED") {
          setShowPaymentModal(true);
          setIsSubmitting(false);
          return;
        }
        throw new Error(data.error || "Failed to create analysis");
      }

      const analysis = await analysisRes.json();
      mutateQuota(); // Update quota in background

      // Navigate to the analysis detail page
      router.push(`/dashboard/analyses/${analysis.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Recruiter status banners */}
      {recruiterStatus?.isRecruiter && recruiterStatus.canAnalyze && (
        <div className="rounded-lg border border-score-ats/30 bg-score-ats/5 px-4 py-3 text-sm flex items-start gap-3">
          <Info className="size-5 shrink-0 text-score-ats mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Welcome, Recruiter!</p>
            <p className="text-muted-foreground mt-0.5">
              You have <strong>1 free analysis</strong> available. Upload a resume and paste a job description to see Resumarq in action.
            </p>
          </div>
        </div>
      )}

      {recruiterStatus?.isRecruiter && !recruiterStatus.canAnalyze && (
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="mb-3 size-10 text-primary/50" />
            <h2 className="text-xl font-semibold">Free Analysis Used</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              You&apos;ve used your complimentary analysis. Sign up for a full account to run unlimited analyses.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              {recruiterStatus.analysisId && (
                <Button
                  className="cursor-pointer gap-2"
                  onClick={() => router.push(`/dashboard/analyses/${recruiterStatus.analysisId}`)}
                >
                  <ExternalLink className="size-4" />
                  View Your Analysis
                </Button>
              )}
              <Link href="/sign-up?callbackUrl=/dashboard">
                <Button variant={recruiterStatus.analysisId ? "outline" : "default"} className="cursor-pointer">
                  Create an Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(newQuotaRemaining) => {
            setShowPaymentModal(false);
            if (newQuotaRemaining !== undefined) {
              mutateQuota(
                (prev) => prev ? { ...prev, quotaRemaining: newQuotaRemaining } : undefined,
                false
              );
            }
            handleSubmit(newQuotaRemaining); // Auto-retry with updated quota
          }}
        />
      )}

      {/* Page header — hidden when recruiter analysis is exhausted */}
      {!(recruiterStatus?.isRecruiter && !recruiterStatus.canAnalyze) && (
      <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            New Analysis
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your resume to get AI-powered insights and actionable feedback.
          </p>
        </div>
        {/* Quota Badge for regular users */}
        {!recruiterStatus?.isRecruiter && quota && (
          <div className="rounded-full bg-accent px-3 py-1 text-sm font-medium border border-border flex items-center gap-2">
            <span className={`size-2 rounded-full ${quota.quotaRemaining > 0 ? "bg-primary" : "bg-destructive"}`} />
            {quota.quotaRemaining} {quota.quotaRemaining === 1 ? "analysis" : "analyses"} remaining
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div
          className={`flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
            step === 1
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          }`}
        >
          1
        </div>
        <div className="h-px flex-1 bg-border" />
        <div
          className={`flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
            step === 2
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Upload or Select Resume */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select or Upload Resume</CardTitle>
            <CardDescription>
              Upload a new PDF resume (max 5 MB) or pick one of your saved resumes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                selectedFile
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30 hover:bg-accent/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(0)} KB • New Upload Ready
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="ml-2 rounded-full p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : selectedSavedResume ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{selectedSavedResume.fileName}</p>
                    <p className="text-xs text-primary font-medium">
                      Selected from Saved Resumes ({(selectedSavedResume.fileSize / 1024).toFixed(0)} KB)
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSavedResume(null);
                    }}
                    className="ml-2 rounded-full p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Drop your PDF here, or{" "}
                    <span className="font-medium text-foreground">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    PDF only, up to 5 MB
                  </p>
                </div>
              )}
            </div>

            {/* Saved Resumes Section (for authenticated users) */}
            {!recruiterStatus?.isRecruiter && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    Or Choose from Saved Resumes
                  </h3>
                  <span className="text-xs text-muted-foreground font-medium">
                    {savedResumes.length}/3 saved (auto-pruned on new upload)
                  </span>
                </div>

                {isLoadingResumes && savedResumes.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading saved resumes...
                  </div>
                ) : savedResumes.length === 0 ? (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                    No saved resumes yet. Uploaded resumes will appear here for fast reuse.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
                    {savedResumes.map((resume) => {
                      const isSelected = selectedSavedResume?.id === resume.id;
                      return (
                        <div
                          key={resume.id}
                          onClick={() => {
                            setSelectedSavedResume(resume);
                            setSelectedFile(null); // Clear manual file upload if selecting existing
                            setError(null);
                          }}
                          className={`relative flex flex-col justify-between rounded-xl border-2 p-3.5 transition-all cursor-pointer group ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                              : "border-border/70 hover:border-border hover:bg-accent/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              }`}>
                                <FileText className="size-4" />
                              </div>
                              <p className="text-xs font-semibold truncate text-foreground" title={resume.fileName}>
                                {resume.fileName}
                              </p>
                            </div>
                            {/* Delete Resume Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteResume(resume.id);
                              }}
                              disabled={deletingResumeId === resume.id}
                              title="Delete resume"
                              className="opacity-60 hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors cursor-pointer"
                            >
                              {deletingResumeId === resume.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                            <span>{(resume.fileSize / 1024).toFixed(0)} KB</span>
                            <div className="flex items-center gap-1">
                              <Clock className="size-3" />
                              <span>{new Date(resume.uploadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="mt-2.5 flex items-center justify-center gap-1 rounded-md bg-primary/10 py-1 text-[11px] font-semibold text-primary">
                              <Check className="size-3" /> Selected
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!hasResumeSelected}
                className="gap-2 cursor-pointer"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose analysis type + optional JD */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Analysis Mode Selector */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setAnalysisMode("resume-only")}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
                analysisMode === "resume-only"
                  ? "border-foreground bg-accent/50"
                  : "border-border hover:border-muted-foreground/30 hover:bg-accent/20"
              }`}
            >
              <FileSearch className={`mt-0.5 size-5 shrink-0 ${
                analysisMode === "resume-only" ? "text-foreground" : "text-muted-foreground"
              }`} />
              <div>
                <p className="text-sm font-semibold">Resume Audit</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Get ATS compatibility check, bullet impact analysis, and improvement suggestions.
                </p>
              </div>
            </button>

            <button
              onClick={() => setAnalysisMode("resume-jd")}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
                analysisMode === "resume-jd"
                  ? "border-foreground bg-accent/50"
                  : "border-border hover:border-muted-foreground/30 hover:bg-accent/20"
              }`}
            >
              <GitCompareArrows className={`mt-0.5 size-5 shrink-0 ${
                analysisMode === "resume-jd" ? "text-foreground" : "text-muted-foreground"
              }`} />
              <div>
                <p className="text-sm font-semibold">Resume + JD Match</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Everything in Resume Audit plus skill gap analysis, keyword matching, and JD fit score.
                </p>
              </div>
            </button>
          </div>

          {/* Job Description (only when resume-jd) */}
          {analysisMode === "resume-jd" && (
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
                <CardDescription>
                  Paste the job description you want to compare your resume against
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={10}
                  className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                <p className="text-xs text-muted-foreground">
                  {jdText.length.toLocaleString()} / 10,000 characters
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} className="cursor-pointer">
              Back
            </Button>
            <Button
              onClick={() => handleSubmit()}
              disabled={!canSubmit}
              className="gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  {analysisMode === "resume-only" ? "Audit Resume" : "Start Analysis"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
