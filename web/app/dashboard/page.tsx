"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewAnalysisPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step tracking — simple 2-step flow
  const [step, setStep] = useState<1 | 2>(1);

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

  const handleSubmit = async () => {
    if (!selectedFile || !jdText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Upload resume
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

      // Step 2: Create analysis
      const analysisRes = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: resume.id,
          jdText: jdText.trim(),
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Analysis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your resume and paste the job description to get started.
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
                    className="ml-2 rounded-full p-1 hover:bg-accent"
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
                className="gap-2"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Paste Job Description */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>
              Paste the job description you want to compare your resume against
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={12}
              className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <p className="text-xs text-muted-foreground">
              {jdText.length.toLocaleString()} / 10,000 characters
            </p>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!jdText.trim() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Start Analysis
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
