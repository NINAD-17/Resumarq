"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  Shield,
  Zap,
  Target,
  Lightbulb,
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
import type {
  AnalysisResponse,
  ATSAuditResult,
  ImpactAuditResult,
  GapAnalysisResult,
} from "@/types/analysis";

type Section = "summary" | "ats" | "impact" | "gap";

const SECTION_META: Record<
  Section,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  summary: { label: "Summary", icon: FileText },
  ats: { label: "ATS Audit", icon: Shield },
  impact: { label: "Impact Audit", icon: Zap },
  gap: { label: "Gap Analysis", icon: Target },
};

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("summary");

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

  // ─── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────
  if (error || !analysis) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="cursor-pointer">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error || "Analysis not found"}
        </div>
      </div>
    );
  }

  // ─── Processing ─────────────────────────────────────────────────
  if (analysis.status === "pending" || analysis.status === "processing") {
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
              {analysis.status === "pending"
                ? "Queued for processing..."
                : "Agents are working..."}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Failed ─────────────────────────────────────────────────────
  if (analysis.status === "failed") {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="cursor-pointer">
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="mb-4 size-12 text-status-critical" />
            <h2 className="text-xl font-semibold">Analysis Failed</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Something went wrong during the analysis. This can happen if the
              resume format is unsupported or the service is temporarily
              unavailable. Please try again.
            </p>
            <Button
              className="mt-8 cursor-pointer"
              onClick={() => router.push("/dashboard")}
            >
              Start New Analysis
            </Button>
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

  const sections: Section[] = ["summary", "ats", "impact", ...(gap ? ["gap" as Section] : [])];

  // Generate humanized section summaries from data
  const atsPassed = ats?.rules?.filter((r) => r.status === "pass").length ?? 0;
  const atsTotal = ats?.rules?.length ?? 0;
  const atsCritical = ats?.rules?.filter((r) => r.status === "critical").length ?? 0;
  const quantRate = Math.round((impact?.overallQuantificationRate ?? 0) * 100);
  const bulletCount = impact?.bulletAudits?.length ?? 0;

  const sectionSummaries: Record<Section, string> = {
    summary: results.summary,
    ats: `Your resume passed ${atsPassed} out of ${atsTotal} ATS compatibility rules. ${
      atsCritical > 0
        ? `There ${atsCritical === 1 ? "is" : "are"} ${atsCritical} critical ${atsCritical === 1 ? "issue" : "issues"} that could prevent your resume from being parsed correctly by Applicant Tracking Systems. Fixing ${atsCritical === 1 ? "this" : "these"} should be your top priority.`
        : "Great job — no critical issues found! Focus on the warnings to further improve your score."
    }`,
    impact: `We analyzed ${bulletCount} bullet points from your experience section. Your quantification rate is ${quantRate}% — ${
      quantRate >= 50
        ? "which shows you're backing your achievements with data. Keep it up!"
        : "which means most of your bullets lack specific numbers or metrics. Adding quantifiable results (e.g., percentages, team sizes, time saved) will significantly strengthen your resume."
    }`,
    gap: gap
      ? `We compared your resume against the job description and found ${results.matchedSkills?.length ?? 0} matching skills and ${results.missingSkills?.length ?? 0} gaps. ${
          (results.missingSkills?.length ?? 0) > 0
            ? "Adding the missing skills and keywords will help your resume rank higher in ATS systems and catch the recruiter's eye."
            : "Excellent coverage — your skills align well with what the employer is looking for!"
        }`
      : "Gap analysis is only available when a job description is provided.",
  };

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/analyses")}
          className="mb-3 cursor-pointer"
        >
          <ArrowLeft className="mr-2 size-4" />
          All Analyses
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {analysis.resumeFileName || "Analysis Results"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {new Date(analysis.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
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
                    <Icon className="size-4" />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ─── Mobile section tabs (visible on small screens) ──────── */}
        <div className="w-full md:hidden">
          <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border pb-0.5">
            {sections.map((sec) => {
              const { label, icon: Icon } = SECTION_META[sec];
              const isActive = activeSection === sec;
              return (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={`flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "border-b-2 border-foreground text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Mobile scores row */}
          <div className="mb-6 flex items-center justify-around rounded-xl border border-border bg-card px-4 py-4">
            <MiniScore label="Overall" value={results.scores.overall} />
            <MiniScore label="ATS" value={results.scores.ats} />
            <MiniScore label="Impact" value={results.scores.impact} />
            {results.scores.match != null && (
              <MiniScore label="Match" value={results.scores.match} />
            )}
          </div>

          {/* Mobile main content */}
          <SectionContent
            section={activeSection}
            summaries={sectionSummaries}
            ats={ats}
            impact={impact}
            gap={gap}
            results={results}
          />
        </div>

        {/* ─── Right Main Panel (desktop) ──────────────────────────── */}
        <main className="hidden min-w-0 flex-1 md:block">
          <SectionContent
            section={activeSection}
            summaries={sectionSummaries}
            ats={ats}
            impact={impact}
            gap={gap}
            results={results}
          />
        </main>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

/** Compact score row for the left sidebar */
function ScoreRow({ label, value, color }: { label: string; value: number; color: string }) {
  const percentage = value;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
        <span className="w-7 text-right text-[13px] font-semibold tabular-nums" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  );
}

/** Mini score for mobile view */
function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

/** Renders the right-panel content for a given section */
function SectionContent({
  section,
  summaries,
  ats,
  impact,
  gap,
  results,
}: {
  section: Section;
  summaries: Record<Section, string>;
  ats: ATSAuditResult;
  impact: ImpactAuditResult;
  gap: GapAnalysisResult | null;
  results: NonNullable<AnalysisResponse["results"]>;
}) {
  const { label, icon: Icon } = SECTION_META[section];

  return (
    <div className="space-y-6">
      {/* Section Header + Summary */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <Icon className="size-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">{label}</h2>
        </div>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {summaries[section]}
        </p>
      </div>

      {/* Section-specific content */}
      {section === "summary" && (
        <SummarySection results={results} />
      )}

      {section === "ats" && ats && (
        <ATSRulesTable rules={ats.rules} />
      )}

      {section === "impact" && impact && (
        <ImpactSection impact={impact} />
      )}

      {section === "gap" && gap && (
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
    </div>
  );
}

/** Summary section — additional findings from the Critic */
function SummarySection({ results }: { results: NonNullable<AnalysisResponse["results"]> }) {
  if (!results.additionalFindings || results.additionalFindings.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <Lightbulb className="size-5 text-score-impact" />
        <h3 className="text-lg font-bold">Additional Insights</h3>
      </div>
      <p className="mb-4 text-[13px] text-muted-foreground">
        Extra observations from our quality review
      </p>
      <div className="space-y-3">
        {results.additionalFindings.map((finding, i) => (
          <div
            key={i}
            className={`rounded-lg border border-border px-5 py-4 border-l-[3px] ${
              finding.severity === "critical"
                ? "border-l-status-critical"
                : finding.severity === "warning"
                  ? "border-l-status-warning"
                  : "border-l-score-ats"
            }`}
          >
            <p className="text-[15px] font-semibold">{finding.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {finding.description}
            </p>
            {finding.suggestion && (
              <div className="mt-2 flex items-start gap-2 rounded-md bg-score-ats/5 px-3 py-2">
                <span className="text-sm">💡</span>
                <p className="text-[13px] leading-relaxed text-score-ats">
                  {finding.suggestion}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Impact section — quantification + bullet cards */
function ImpactSection({ impact }: { impact: ImpactAuditResult }) {
  const quantRate = Math.round(impact.overallQuantificationRate * 100);

  return (
    <div className="space-y-6">
      {/* Quantification Rate bar */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold">Quantification Rate</span>
          <span className="text-lg font-bold tabular-nums">{quantRate}%</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-score-impact transition-all duration-700"
            style={{ width: `${quantRate}%` }}
          />
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground">
          {quantRate >= 50
            ? "Good — most of your bullets include measurable results."
            : "Consider adding more numbers, percentages, or metrics to your bullet points."}
        </p>
      </div>

      {/* Career progression notes */}
      {impact.careerProgressionNotes.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-[15px] font-semibold mb-3">Career Progression</h3>
          <div className="space-y-2">
            {impact.careerProgressionNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    note.severity === "positive"
                      ? "bg-status-pass"
                      : note.severity === "warning"
                        ? "bg-status-warning"
                        : "bg-muted-foreground"
                  }`}
                />
                <span className="text-[14px] leading-relaxed text-muted-foreground">
                  {note.observation}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bullet audits */}
      <div>
        <h3 className="mb-4 text-[15px] font-semibold">
          Bullet Analysis ({impact.bulletAudits.length} bullets)
        </h3>
        <div className="space-y-4">
          {impact.bulletAudits.map((bullet, i) => (
            <BulletAuditCard key={i} bullet={bullet} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
