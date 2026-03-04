import { CheckCircle2, XCircle, ArrowUpRight, Plus } from "lucide-react";
import type { SkillMatch, ResponsibilityCoverage } from "@/types/analysis";

interface GapSectionProps {
  skillMatches: SkillMatch[];
  responsibilityCoverage: ResponsibilityCoverage[];
  seniorityMatch: boolean;
  seniorityNote?: string;
  keywordsToAdd: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

export function GapSection({
  skillMatches,
  responsibilityCoverage,
  seniorityNote,
  keywordsToAdd,
  matchedSkills,
  missingSkills,
}: GapSectionProps) {
  const semanticMatches = skillMatches.filter((s) => s.matchType === "semantic");
  const coveredCount = responsibilityCoverage.filter((r) => r.covered).length;

  return (
    <div className="space-y-8">
      {/* Skills Grid — matched vs missing */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Matched Skills */}
        <div className="rounded-xl border border-status-pass/20 bg-status-pass/5 p-5">
          <h4 className="flex items-center gap-2 text-[15px] font-semibold text-status-pass">
            <CheckCircle2 className="size-4" />
            Skills Found ({matchedSkills.length})
          </h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {matchedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-status-pass/10 px-3 py-1.5 text-[13px] font-medium text-status-pass"
              >
                {skill}
              </span>
            ))}
            {matchedSkills.length === 0 && (
              <p className="text-[13px] text-muted-foreground">No matched skills found</p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="rounded-xl border border-status-critical/20 bg-status-critical/5 p-5">
          <h4 className="flex items-center gap-2 text-[15px] font-semibold text-status-critical">
            <XCircle className="size-4" />
            Skills Missing ({missingSkills.length})
          </h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {missingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-status-critical/10 px-3 py-1.5 text-[13px] font-medium text-status-critical"
              >
                {skill}
              </span>
            ))}
            {missingSkills.length === 0 && (
              <p className="text-[13px] text-muted-foreground">No missing skills — great match!</p>
            )}
          </div>
        </div>
      </div>

      {/* Semantic matches */}
      {semanticMatches.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="text-[15px] font-semibold">Semantic Matches</h4>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Your resume uses different terms that match JD requirements
          </p>
          <div className="mt-3 space-y-2">
            {semanticMatches.map((s) => (
              <div
                key={s.skill}
                className="flex items-center gap-3 rounded-lg bg-accent/30 px-4 py-2.5 text-[13px]"
              >
                <span className="text-muted-foreground">{s.skill}</span>
                <ArrowUpRight className="size-3.5 text-score-match" />
                <span className="font-semibold">{s.semanticEquivalent || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seniority note */}
      {seniorityNote && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="text-[15px] font-semibold">Seniority Match</h4>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {seniorityNote}
          </p>
        </div>
      )}

      {/* Responsibility coverage */}
      {responsibilityCoverage.length > 0 && (
        <div>
          <h4 className="text-[15px] font-semibold">
            Responsibility Coverage
            <span className="ml-2 text-[13px] font-normal text-muted-foreground">
              {coveredCount}/{responsibilityCoverage.length} covered
            </span>
          </h4>
          <div className="mt-3 space-y-2">
            {responsibilityCoverage.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border border-border px-4 py-3 ${
                  r.covered ? "border-l-[3px] border-l-status-pass" : "border-l-[3px] border-l-status-critical"
                }`}
              >
                {r.covered ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-pass" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-status-critical" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">{r.responsibility}</p>
                  {r.evidence && (
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Evidence: {r.evidence}
                    </p>
                  )}
                  {r.gapNote && (
                    <p className="mt-1 text-[12px] text-status-warning">
                      ⚠ {r.gapNote}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords to add */}
      {keywordsToAdd.length > 0 && (
        <div className="rounded-xl border border-score-match/20 bg-score-match/5 p-5">
          <h4 className="flex items-center gap-2 text-[15px] font-semibold text-score-match">
            <Plus className="size-4" />
            Keywords to Add
          </h4>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Consider adding these to improve your JD match
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {keywordsToAdd.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-score-match/30 bg-score-match/10 px-3 py-1.5 text-[13px] font-medium text-score-match"
              >
                + {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
