"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  Shield,
  Zap,
  Target,
  Lightbulb,
  Briefcase,
  RotateCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { ATSRulesTable } from "@/components/dashboard/ats-rules-table";
import { BulletAuditCard } from "@/components/dashboard/bullet-audit-card";
import { GapSection } from "@/components/dashboard/gap-section";
import { CompanyResearchSection } from "@/components/dashboard/company-research-section";
import { fetcher } from "@/lib/fetcher";
import type {
  AnalysisResponse,
  ATSAuditResult,
  ImpactAuditResult,
  GapAnalysisResult,
} from "@/types/analysis";

type Section = "summary" | "ats" | "impact" | "gap" | "insights" | "prep";

const SECTION_META: Record<
  Section,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  summary: { label: "Summary", icon: FileText },
  ats: { label: "ATS Audit", icon: Shield },
  impact: { label: "Impact Audit", icon: Zap },
  gap: { label: "Gap Analysis", icon: Target },
  insights: { label: "Insights", icon: Lightbulb },
  prep: { label: "Interview Prep", icon: Briefcase },
};

const activeProcessingStates = [
  "pending",
  "processing",
  "extracting_data",
  "analyzing_ats",
  "evaluating_impact",
  "comparing_gap",
  "generating_feedback",
  "compiling_report",
  "researching_company",
];

function formatErrorMessage(rawError?: string): string {
  if (!rawError) {
    return "Something went wrong during the analysis. Please click 'Retry Analysis' to run it again.";
  }

  const lower = rawError.toLowerCase();
  if (
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("rate limit") ||
    lower.includes("quota")
  ) {
    return "The AI model encountered a temporary high-traffic rate limit. Please click 'Retry Analysis' to run it again.";
  }
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("deadline") ||
    lower.includes("504") ||
    lower.includes("502")
  ) {
    return "The analysis timed out due to temporary network latency. Please click 'Retry Analysis' to try again.";
  }
  if (
    lower.includes("pdf") ||
    lower.includes("corrupt") ||
    lower.includes("parse") ||
    lower.includes("extract")
  ) {
    return "We had trouble reading this resume PDF. Please ensure the PDF is not password protected or corrupted, and try again.";
  }

  return "An unexpected error occurred while processing your resume. Please click 'Retry Analysis' to run it again.";
}

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [activeSection, setActiveSection] = useState<Section>("summary");
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOpeningResume, setIsOpeningResume] = useState(false);

  // SWR: Instant cache retrieval + smart background polling
  const {
    data: analysis,
    error: fetchError,
    isLoading,
    mutate,
  } = useSWR<AnalysisResponse>(
    id ? `/api/analyses/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000,
      refreshInterval: (latestData) => {
        if (!latestData) return 0;
        const isProcessing = activeProcessingStates.includes(latestData.status);
        return isProcessing ? 3000 : 0;
      },
    }
  );

  // Check recruiter status
  useEffect(() => {
    fetch("/api/recruiter/check")
      .then((res) => res.json())
      .then((data) => setIsRecruiter(!!data.isRecruiter))
      .catch(() => {});
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/analyses/${id}/retry`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to retry analysis");
      }
      const data = await res.json();
      mutate(data, false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to retry analysis");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleOpenResume = async () => {
    if (!analysis) return;

    if (analysis.resumeDownloadUrl) {
      window.open(analysis.resumeDownloadUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Dynamic fetch if not directly cached
    setIsOpeningResume(true);
    try {
      const res = await fetch(`/api/resumes/${analysis.resumeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
          return;
        }
      }
      throw new Error("Unable to get resume download link");
    } catch (err) {
      alert("Could not load resume. The file may have been removed.");
    } finally {
      setIsOpeningResume(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────
  if (isLoading && !analysis) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────
  if (fetchError || !analysis) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="cursor-pointer">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Analysis not found or could not be loaded.
        </div>
      </div>
    );
  }

  const isProcessing = activeProcessingStates.includes(analysis.status);

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Queued for processing...";
      case "processing": return "Starting AI Agents...";
      case "extracting_data": return "Extracting Resume Data...";
      case "analyzing_ats": return "Running ATS Audit...";
      case "evaluating_impact": return "Evaluating Impact...";
      case "comparing_gap": return "Performing Gap Analysis...";
      case "generating_feedback": return "Generating Feedback...";
      case "compiling_report": return "Compiling Report...";
      case "researching_company": return "Researching Company Insights...";
      default: return "Processing Analysis...";
    }
  };

  // ─── Processing State ───────────────────────────────────────────
  if (isProcessing) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="cursor-pointer">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="size-14 animate-spin rounded-full border-3 border-muted border-t-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Analyzing your resume...</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Our AI agents are reviewing your resume against the job
              description. This typically takes 1-3 minutes.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {getStatusText(analysis.status)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Failed State ───────────────────────────────────────────────
  if (analysis.status === "failed") {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="cursor-pointer">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <AlertTriangle className="size-8" />
            </div>
            <h2 className="text-2xl font-bold">Analysis Failed</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              {formatErrorMessage(analysis.error)}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="gap-2 cursor-pointer min-w-[160px]"
              >
                <RotateCw className={`size-4 ${isRetrying ? "animate-spin" : ""}`} />
                {isRetrying ? "Retrying..." : "Retry Analysis"}
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => router.push("/dashboard")}
              >
                {isRecruiter ? "Back to Dashboard" : "Start New Analysis"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Completed — 2-Column Report Layout ──────────────────────────
  const results = analysis.results!;
  const ats = results.atsAudit as ATSAuditResult;
  const impact = results.impactAudit as ImpactAuditResult;
  const gap = results.gapAnalysis as GapAnalysisResult | null;

  const hasInsights = (results.additionalFindings?.length ?? 0) > 0;
  const sections: Section[] = [
    "summary",
    "ats",
    "impact",
    ...(gap ? ["gap" as Section] : []),
    ...(hasInsights ? ["insights" as Section] : []),
    "prep",
  ];

  // Generate humanized section summaries from data
  const atsPassed = ats?.rules?.filter((r) => r.status === "pass").length ?? 0;
  const atsTotal = ats?.rules?.length ?? 0;
  const atsWarnings = ats?.rules?.filter((r) => r.status === "warning").length ?? 0;
  const atsCritical = ats?.rules?.filter((r) => r.status === "critical").length ?? 0;
  const quantRate = Math.round((impact?.overallQuantificationRate ?? 0) * 100);
  const bulletCount = impact?.bulletAudits?.length ?? 0;
  const strongBullets = impact?.bulletAudits?.filter((b) => b.bulletScore >= 70).length ?? 0;

  // Extract first name from the resume candidate name
  const firstName = results.candidateName?.split(" ")[0] || "";
  const greeting = firstName ? `${firstName}, ` : "";

  const matchedCount = results.matchedSkills?.length ?? 0;
  const missingCount = results.missingSkills?.length ?? 0;

  const sectionSummaries: Record<Section, string> = {
    summary: results.summary,

    ats: `${greeting}your resume was checked against ${atsTotal} ATS compatibility rules and passed ${atsPassed} of them. ${
      atsCritical > 0
        ? `We found ${atsCritical} critical ${atsCritical === 1 ? "issue" : "issues"} that could cause ATS systems to misparse or reject your resume entirely — ${atsCritical === 1 ? "this needs" : "these need"} to be your top fix priority.${atsWarnings > 0 ? ` There ${atsWarnings === 1 ? "is" : "are"} also ${atsWarnings} ${atsWarnings === 1 ? "warning" : "warnings"} worth addressing.` : ""}`
        : atsWarnings > 0
          ? `No critical issues were found — nice work! There ${atsWarnings === 1 ? "is" : "are"} ${atsWarnings} ${atsWarnings === 1 ? "warning" : "warnings"} to address. These won't block your resume but fixing them will boost your ATS score.`
          : "All rules passed — your resume is well-optimized for ATS systems. Great job keeping the formatting clean and the sections standard!"
    }`,

    impact: `${greeting}we analyzed ${bulletCount} bullet points from your experience section. ${strongBullets > 0 ? `${strongBullets} of them scored 70+ — those are strong, well-written bullets. ` : ""}Your quantification rate is ${quantRate}% — ${
      quantRate >= 60
        ? "that's excellent! You're consistently backing your achievements with real numbers, which is exactly what recruiters look for."
        : quantRate >= 40
          ? "that's decent, but there's room to improve. Try adding specific numbers to more of your bullets — percentages, team sizes, revenue impact, or time saved. Even rough estimates like \"~30%\" are better than nothing."
          : "which means most of your bullets are missing the numbers and metrics that make them stand out. Recruiters love seeing quantifiable impact — try adding specific stats like team size, percentage improvements, or revenue figures to at least half your bullets."
    }`,

    gap: gap
      ? `${greeting}we compared your resume against the job description and found ${matchedCount} matching skills and ${missingCount} gaps. ${
          missingCount > 0
            ? "There are several key requirements from the JD that your resume doesn't cover yet. Adding these missing skills and keywords will significantly improve your resume's ranking in ATS systems and help catch the recruiter's eye."
            : "Your resume covers all the key requirements from the job description — fantastic match!"
        }`
      : "Gap analysis is only available when a job description is provided.",

    insights: `${greeting ? `${greeting}here are ` : "Here are "}additional observations from our AI quality review — findings that go beyond the standard audit categories but are worth your attention.`,

    prep: `${greeting ? `${greeting}here is ` : "Here is "}personalized company research and interview coaching tailored specifically to your target company, role expectations, and resume highlights.`,
  };

  return (
    <div className="space-y-6">
      {/* Back + Title & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(isRecruiter ? "/dashboard" : "/dashboard/analyses")}
            className="mb-3 cursor-pointer"
          >
            <ArrowLeft className="mr-2 size-4" />
            {isRecruiter ? "Back to Dashboard" : "All Analyses"}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {results?.title || analysis.resumeFileName || "Analysis Results"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date(analysis.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* View Attached Resume Button (Always rendered if resume exists) */}
        {(analysis.resumeFileName || analysis.resumeId) && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              onClick={handleOpenResume}
              disabled={isOpeningResume}
              variant="outline"
              size="sm"
              className="gap-2 cursor-pointer border-border/80 bg-card hover:bg-accent hover:text-accent-foreground shadow-sm h-10 px-4"
            >
              {isOpeningResume ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <FileText className="size-4 text-primary" />
              )}
              <span className="font-medium text-xs sm:text-sm">
                {isOpeningResume
                  ? "Opening Resume..."
                  : analysis.resumeFileName
                  ? `View Resume (${analysis.resumeFileName})`
                  : "View Attached Resume"}
              </span>
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>

      {/* ─── Mobile Scores & Navigation Bar (< md screens) ────────── */}
      <div className="w-full md:hidden space-y-4">
        {/* Mobile scores strip */}
        <div className="flex items-center justify-around rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
          <MiniScore label="Overall" value={results.scores.overall} color="var(--score-overall)" />
          <MiniScore label="ATS" value={results.scores.ats} color="var(--score-ats)" />
          <MiniScore label="Impact" value={results.scores.impact} color="var(--score-impact)" />
          {results.scores.match != null && (
            <MiniScore label="Match" value={results.scores.match} color="var(--score-match)" />
          )}
        </div>

        {/* Scrollable tab bar — no visible scrollbar */}
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((sec) => {
            const { label, icon: Icon } = SECTION_META[sec];
            const isActive = activeSection === sec;
            return (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "border-b-2 border-primary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5 text-primary" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2-Column Layout ──────────────────────────────────────── */}
      <div className="flex gap-6 lg:gap-8">
        {/* ─── Left Sidebar (Sticky) ───────────────────────────────── */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-6 space-y-6">
            {/* Overall Score */}
            <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6">
              <ScoreRing
                value={results.scores.overall}
                label="Overall"
                size={130}
                strokeWidth={10}
                color="var(--score-overall)"
              />
            </div>

            {/* Sub-scores */}
            <div className="space-y-1.5 rounded-xl border border-border bg-card px-4 py-3">
              <ScoreRow label="ATS Score" value={results.scores.ats} color="var(--score-ats)" />
              <ScoreRow label="Impact" value={results.scores.impact} color="var(--score-impact)" />
              {results.scores.match != null && (
                <ScoreRow label="JD Match" value={results.scores.match} color="var(--score-match)" />
              )}
            </div>

            {/* Section Navigation */}
            <nav className="space-y-1">
              {sections.map((sec) => {
                const { label, icon: Icon } = SECTION_META[sec];
                const isActive = activeSection === sec;
                return (
                  <button
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ─── Right Content Area ──────────────────────────────────── */}
        <main className="min-w-0 flex-1 space-y-8">
          {/* Section Summary Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {(() => {
                const Icon = SECTION_META[activeSection].icon;
                return <Icon className="size-4 text-primary" />;
              })()}
              <span>{SECTION_META[activeSection].label}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {sectionSummaries[activeSection]}
            </p>
          </div>

          {/* Section Content */}
          {activeSection === "summary" && (
            <div className="space-y-6">
              {/* Quick stats grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MiniStat label="ATS Rules Passed" value={`${atsPassed}/${atsTotal}`} />
                <MiniStat label="Quantification" value={`${quantRate}%`} />
                <MiniStat label="Skills Matched" value={gap ? `${matchedCount}` : "N/A"} />
                <MiniStat label="Skill Gaps" value={gap ? `${missingCount}` : "N/A"} />
              </div>

              {/* Critical fixes callout */}
              {atsCritical > 0 && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertTriangle className="size-4" />
                    <span>Action Required: {atsCritical} Critical ATS {atsCritical === 1 ? "Issue" : "Issues"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Check the ATS Audit tab to fix these formatting issues before submitting your resume.
                  </p>
                </div>
              )}

              {/* Bullet rewrites preview */}
              {impact.bulletAudits.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Priority Bullet Rewrites</h3>
                  <div className="space-y-3">
                    {impact.bulletAudits
                      .filter((b) => b.suggestedRewrite && b.bulletScore < 70)
                      .slice(0, 3)
                      .map((bullet, i) => (
                        <BulletAuditCard key={i} bullet={bullet} index={i} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === "ats" && (
            <ATSRulesTable rules={ats.rules} />
          )}

          {activeSection === "impact" && (
            <div className="space-y-6">
              {/* Quantification bar */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Quantification Rate</span>
                  <span className="font-bold">{quantRate}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${quantRate}%`,
                      backgroundColor: "var(--score-impact)",
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {quantRate >= 60
                    ? "Great job! Most of your bullets include metrics."
                    : "Aim for at least 60% of bullets containing numbers or metrics."}
                </p>
              </div>

              {/* Career progression notes */}
              {impact.careerProgressionNotes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Career Progression</h3>
                  {impact.careerProgressionNotes.map((note, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-card px-4 py-3 text-xs leading-relaxed text-muted-foreground"
                    >
                      {note.observation}
                    </div>
                  ))}
                </div>
              )}

              {/* Employment gaps */}
              {impact.employmentGaps.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Employment Gaps</h3>
                  {impact.employmentGaps.map((gap, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-600 dark:text-amber-400"
                    >
                      {gap}
                    </div>
                  ))}
                </div>
              )}

              {/* Bullet audits */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">
                  Bullet-by-Bullet Analysis ({impact.bulletAudits.length})
                </h3>
                {impact.bulletAudits.map((bullet, i) => (
                  <BulletAuditCard key={i} bullet={bullet} index={i} />
                ))}
              </div>
            </div>
          )}

          {activeSection === "gap" && gap && (
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

          {activeSection === "insights" && hasInsights && (
            <div className="space-y-3">
              {results.additionalFindings.map((finding, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {finding.title}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        finding.severity === "critical"
                          ? "bg-destructive/10 text-destructive"
                          : finding.severity === "warning"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {finding.description}
                  </p>
                  {finding.suggestion && (
                    <div className="rounded-lg bg-accent/40 p-3 text-xs text-foreground mt-2 border border-border/40">
                      <span className="font-semibold text-primary">Recommendation: </span>
                      {finding.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeSection === "prep" && (
            <CompanyResearchSection data={results.companyResearch} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ─── Helper sub-components ──────────────────────────────────────── */

function ScoreRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function MiniScore({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl font-bold tabular-nums text-foreground" style={color ? { color } : undefined}>
        {value}
      </span>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

