import { CheckCircle2, XCircle, ArrowUpRight } from "lucide-react";
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
  return (
    <div className="space-y-6">
      {/* Skills overview — matched vs missing */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Matched Skills */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[var(--status-pass)]">
            Skills Found ({matchedSkills.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--status-pass)]/8 px-2.5 py-1 text-xs font-medium text-[var(--status-pass)]"
              >
                <CheckCircle2 className="size-3" />
                {skill}
              </span>
            ))}
            {matchedSkills.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No matched skills found
              </p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[var(--status-critical)]">
            Skills Missing ({missingSkills.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--status-critical)]/8 px-2.5 py-1 text-xs font-medium text-[var(--status-critical)]"
              >
                <XCircle className="size-3" />
                {skill}
              </span>
            ))}
            {missingSkills.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No missing skills — great match!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Semantic matches (skill equivalents) */}
      {skillMatches.filter((s) => s.matchType === "semantic").length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Semantic Matches</h4>
          <p className="text-xs text-muted-foreground">
            Your resume uses different terms that match JD requirements
          </p>
          <div className="space-y-1.5">
            {skillMatches
              .filter((s) => s.matchType === "semantic")
              .map((s) => (
                <div
                  key={s.skill}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="text-muted-foreground">{s.skill}</span>
                  <ArrowUpRight className="size-3 text-muted-foreground/50" />
                  <span className="font-medium">
                    {s.semanticEquivalent || "—"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Seniority note */}
      {seniorityNote && (
        <div className="rounded-lg bg-accent/50 px-4 py-3">
          <p className="text-xs font-medium">Seniority Match</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {seniorityNote}
          </p>
        </div>
      )}

      {/* Responsibility coverage */}
      {responsibilityCoverage.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Responsibility Coverage</h4>
          <div className="space-y-1.5">
            {responsibilityCoverage.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border px-3 py-2"
              >
                {r.covered ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[var(--status-pass)]" />
                ) : (
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-[var(--status-critical)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{r.responsibility}</p>
                  {r.evidence && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Evidence: {r.evidence}
                    </p>
                  )}
                  {r.gapNote && (
                    <p className="mt-0.5 text-[10px] text-[var(--status-warning)]">
                      {r.gapNote}
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
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Keywords to Add</h4>
          <p className="text-xs text-muted-foreground">
            Consider adding these keywords to improve your match score
          </p>
          <div className="flex flex-wrap gap-1.5">
            {keywordsToAdd.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-border bg-accent/30 px-2.5 py-1 text-xs font-medium"
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
