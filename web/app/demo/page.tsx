"use client";

import { useState } from "react";
import {
  FileText,
  Shield,
  Zap,
  Target,
  Lightbulb,
} from "lucide-react";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { ATSRulesTable } from "@/components/dashboard/ats-rules-table";
import { BulletAuditCard } from "@/components/dashboard/bullet-audit-card";
import { GapSection } from "@/components/dashboard/gap-section";
import { demoAnalysisData } from "@/lib/demo-data";
import type {
  AnalysisResponse,
  ATSAuditResult,
  ImpactAuditResult,
  GapAnalysisResult,
} from "@/types/analysis";

type Section = "summary" | "ats" | "impact" | "gap" | "insights";

const SECTION_META: Record<
  Section,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  summary: { label: "Summary", icon: FileText },
  ats: { label: "ATS Audit", icon: Shield },
  impact: { label: "Impact Audit", icon: Zap },
  gap: { label: "Gap Analysis", icon: Target },
  insights: { label: "Insights", icon: Lightbulb },
};

export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<Section>("summary");
  const analysis = demoAnalysisData as unknown as AnalysisResponse;

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
      ? `${greeting}we compared your resume against the job description and found ${matchedCount} matching ${matchedCount === 1 ? "skill" : "skills"} and ${missingCount} ${missingCount === 1 ? "gap" : "gaps"}. ${
          missingCount > 3
            ? `There are several key requirements from the JD that your resume doesn't cover yet. Adding these missing skills and keywords will significantly improve your resume's ranking in ATS systems and help catch the recruiter's eye.`
            : missingCount > 0
              ? `You're mostly aligned with the job requirements, but there ${missingCount === 1 ? "is" : "are"} ${missingCount} ${missingCount === 1 ? "skill" : "skills"} the employer is looking for that ${missingCount === 1 ? "isn't" : "aren't"} mentioned in your resume. Consider weaving ${missingCount === 1 ? "it" : "them"} into your experience descriptions where relevant.`
              : "Excellent coverage! Your skills align very well with what the employer is looking for. Your resume should pass keyword filters with ease."
        }`
      : "Gap analysis is only available when a job description is provided.",
    insights: `${greeting ? `${greeting}here are ` : "Here are "}additional observations from our AI quality review — findings that go beyond the standard audit categories but are worth your attention.`,
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary flex items-center justify-between">
        <div>
          <strong>Demo Mode:</strong> You are viewing a sample analysis report.
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
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
          {/* Mobile scores row */}
          <div className="mb-4 flex items-center justify-around rounded-xl border border-border bg-card px-4 py-3">
            <MiniScore label="Overall" value={results.scores.overall} />
            <MiniScore label="ATS" value={results.scores.ats} />
            <MiniScore label="Impact" value={results.scores.impact} />
            {results.scores.match != null && (
              <MiniScore label="Match" value={results.scores.match} />
            )}
          </div>

          {/* Scrollable tab bar — no visible scrollbar */}
          <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((sec) => {
              const { label, icon: Icon } = SECTION_META[sec];
              const isActive = activeSection === sec;
              return (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={`flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors cursor-pointer ${
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

function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

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
      <div className="rounded-xl border border-border bg-card p-5 md:p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <Icon className="size-5 text-muted-foreground" />
          <h2 className="text-lg md:text-xl font-bold">{label}</h2>
        </div>
        <p className="text-[14px] md:text-[15px] leading-relaxed text-muted-foreground">
          {summaries[section]}
        </p>
      </div>

      {section === "summary" && null}

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

      {section === "insights" && (
        <InsightsSection results={results} />
      )}
    </div>
  );
}

function InsightsSection({ results }: { results: NonNullable<AnalysisResponse["results"]> }) {
  if (!results.additionalFindings || results.additionalFindings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-[14px] text-muted-foreground">No additional insights for this analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.additionalFindings.map((finding, i) => (
        <div
          key={i}
          className={`rounded-xl border border-border bg-card px-5 py-4 border-l-[3px] ${
            finding.severity === "critical"
              ? "border-l-status-critical"
              : finding.severity === "warning"
                ? "border-l-status-warning"
                : "border-l-score-ats"
          }`}
        >
          <p className="text-[15px] font-semibold">{finding.title}</p>
          <p className="mt-1.5 text-[13px] md:text-[14px] leading-relaxed text-muted-foreground">
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
  );
}

function ImpactSection({ impact }: { impact: ImpactAuditResult }) {
  const quantRate = Math.round(impact.overallQuantificationRate * 100);

  return (
    <div className="space-y-6">
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
