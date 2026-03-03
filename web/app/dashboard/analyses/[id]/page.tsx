"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { ATSRulesTable } from "@/components/dashboard/ats-rules-table";
import { BulletAuditCard } from "@/components/dashboard/bullet-audit-card";
import { GapSection } from "@/components/dashboard/gap-section";
import type {
  AnalysisResponse,
  ATSAuditResult,
  ImpactAuditResult,
  GapAnalysisResult,
} from "@/types/analysis";

type Tab = "ats" | "impact" | "gap";

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("ats");

  const fetchAnalysis = async () => {
    try {
      const res = await fetch(`/api/analyses/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAnalysis(data);
      setError(null);
    } catch {
      setError("Failed to load analysis");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  // Poll while processing
  useEffect(() => {
    if (
      !analysis ||
      analysis.status === "completed" ||
      analysis.status === "failed"
    )
      return;

    const interval = setInterval(fetchAnalysis, 3000);
    return () => clearInterval(interval);
  }, [analysis?.status]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !analysis) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error || "Analysis not found"}
        </div>
      </div>
    );
  }

  // Processing state
  if (analysis.status === "pending" || analysis.status === "processing") {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-4">
              <div className="size-12 animate-spin rounded-full border-3 border-muted border-t-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Analyzing your resume...</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Our AI agents are reviewing your resume against the job
              description. This usually takes 30-60 seconds.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              {analysis.status === "pending"
                ? "Queued for processing..."
                : "Processing..."}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Failed state
  if (analysis.status === "failed") {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4 cursor-pointer" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="mb-4 size-10 text-[var(--status-critical)]" />
            <h2 className="text-lg font-semibold">Analysis Failed</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Something went wrong during the analysis. This can happen if the
              resume format is unsupported or the service is temporarily
              unavailable. Please try again.
            </p>
            <Button
              className="mt-6"
              onClick={() => router.push("/dashboard")}
            >
              Start New Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed — show results
  const results = analysis.results!;
  const ats = results.atsAudit as ATSAuditResult;
  const impact = results.impactAudit as ImpactAuditResult;
  const gap = results.gapAnalysis as GapAnalysisResult | null;

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: "ats", label: "ATS Audit" },
    { key: "impact", label: "Impact Audit" },
    { key: "gap", label: "Gap Analysis", disabled: !gap },
  ];

  return (
    <div className="space-y-8">
      {/* Back + Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/analyses")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 size-4" />
          All Analyses
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {analysis.resumeFileName || "Analysis Results"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(analysis.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Score Rings */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <ScoreRing
              value={results.scores.overall}
              label="Overall"
              color="var(--score-overall)"
              size={110}
            />
            <ScoreRing
              value={results.scores.ats}
              label="ATS Score"
              color="var(--score-ats)"
            />
            <ScoreRing
              value={results.scores.impact}
              label="Impact"
              color="var(--score-impact)"
            />
            {results.scores.match != null && (
              <ScoreRing
                value={results.scores.match}
                label="JD Match"
                color="var(--score-match)"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {results.summary}
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                tab.disabled
                  ? "cursor-not-allowed text-muted-foreground/30"
                  : activeTab === tab.key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === "ats" && ats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {ats.rules.filter((r) => r.status === "pass").length} of{" "}
                  {ats.rules.length} rules passed
                </p>
              </div>
              <ATSRulesTable rules={ats.rules} />
            </div>
          )}

          {activeTab === "impact" && impact && (
            <div className="space-y-6">
              {/* Quantification rate */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Quantification Rate:
                </span>
                <span className="text-sm font-medium">
                  {Math.round(impact.overallQuantificationRate * 100)}%
                </span>
              </div>

              {/* Career progression notes */}
              {impact.careerProgressionNotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Career Progression
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {impact.careerProgressionNotes.map((note, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <div
                          className={`mt-1 size-1.5 shrink-0 rounded-full ${
                            note.severity === "positive"
                              ? "bg-[var(--status-pass)]"
                              : note.severity === "warning"
                                ? "bg-[var(--status-warning)]"
                                : "bg-muted-foreground"
                          }`}
                        />
                        <span className="text-muted-foreground">
                          {note.observation}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Bullet audits */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  Bullet Analysis ({impact.bulletAudits.length} bullets)
                </h3>
                {impact.bulletAudits.map((bullet, i) => (
                  <BulletAuditCard key={i} bullet={bullet} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "gap" && gap && (
            <GapSection
              skillMatches={gap.skillMatches}
              responsibilityCoverage={gap.responsibilityCoverage}
              seniorityMatch={gap.seniorityMatch}
              seniorityNote={gap.seniorityNote}
              keywordsToAdd={gap.keywordsToAdd}
              matchedSkills={results.matchedSkills}
              missingSkills={results.missingSkills}
            />
          )}

          {activeTab === "gap" && !gap && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Gap Analysis is only available when a Job Description is
                  provided.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Additional findings from Critic */}
      {results.additionalFindings && results.additionalFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Insights</CardTitle>
            <CardDescription>
              Extra observations from our quality review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.additionalFindings.map((finding, i) => (
              <div
                key={i}
                className="rounded-lg border border-border px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`size-1.5 rounded-full ${
                      finding.severity === "critical"
                        ? "bg-[var(--status-critical)]"
                        : finding.severity === "warning"
                          ? "bg-[var(--status-warning)]"
                          : "bg-[var(--score-ats)]"
                    }`}
                  />
                  <span className="text-sm font-medium">{finding.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {finding.description}
                </p>
                {finding.suggestion && (
                  <p className="mt-1 text-xs text-[var(--score-ats)]">
                    💡 {finding.suggestion}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
