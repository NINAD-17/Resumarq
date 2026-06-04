"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileText, ArrowRight, X, FileSearch, GitCompareArrows, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AnalysisMode = "resume-only" | "resume-jd";

export default function NewAnalysisPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("resume-jd");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recruiter state
  const [recruiterStatus, setRecruiterStatus] = useState<{
    isRecruiter: boolean;
    canAnalyze: boolean;
    analysisId?: string | null;
  } | null>(null);

  // Step tracking — simple 2-step flow
  const [step, setStep] = useState<1 | 2>(1);

  // Check recruiter status on mount
  useEffect(() => {
    fetch("/api/recruiter/check")
      .then((res) => res.json())
      .then((data) => setRecruiterStatus(data))
      .catch(() => setRecruiterStatus({ isRecruiter: false, canAnalyze: false }));
  }, []);

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
      setError(null);
    }
  };

  const canSubmit =
    selectedFile &&
    (analysisMode === "resume-only" || jdText.trim().length > 0) &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Upload resume
      const formData = new FormData();
      formData.append("file", selectedFile!);

      const uploadRes = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || "Failed to upload resume");
      }

      const resume = await uploadRes.json();

      // Step 2: Create analysis
      const analysisRes = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: resume.id,
          ...(analysisMode === "resume-jd" ? { jdText: jdText.trim() } : {}),
        }),
      });

      if (!analysisRes.ok) {
        const data = await analysisRes.json();
        throw new Error(data.error || "Failed to create analysis");
      }

      const analysis = await analysisRes.json();

      // Navigate to the analysis detail page (which will poll for results)
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

      {/* Page header — hidden when recruiter analysis is exhausted */}
      {!(recruiterStatus?.isRecruiter && !recruiterStatus.canAnalyze) && (
      <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Analysis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your resume to get AI-powered insights and actionable feedback.
        </p>
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

      {/* Step 1: Upload Resume */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>
              Upload your resume as a PDF file (max 5 MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-muted-foreground/30 hover:bg-accent/30"
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
                  <FileText className="size-8 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="ml-2 rounded-full p-1 hover:bg-accent cursor-pointer"
                  >
                    <X className="size-4 text-muted-foreground" />
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

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedFile}
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
              onClick={handleSubmit}
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
