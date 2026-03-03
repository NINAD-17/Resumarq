import {
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import type { BulletAuditResult } from "@/types/analysis";

interface BulletAuditCardProps {
  bullet: BulletAuditResult;
}

export function BulletAuditCard({ bullet }: BulletAuditCardProps) {
  // Score color
  const scoreColor =
    bullet.bulletScore >= 70
      ? "var(--status-pass)"
      : bullet.bulletScore >= 40
        ? "var(--status-warning)"
        : "var(--status-critical)";

  return (
    <div className="rounded-lg border border-border px-4 py-3 space-y-2">
      {/* Header: company + score */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {bullet.experienceCompany}
        </span>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ color: scoreColor }}
        >
          {bullet.bulletScore}/100
        </span>
      </div>

      {/* Original text */}
      <p className="text-sm leading-relaxed">{bullet.originalText}</p>

      {/* Issues */}
      {bullet.issues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {bullet.issues.map((issue, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--status-warning)]/8 px-2 py-0.5 text-[10px] font-medium text-[var(--status-warning)]"
            >
              <AlertTriangle className="size-2.5" />
              {issue}
            </span>
          ))}
        </div>
      )}

      {/* Suggested rewrite */}
      {bullet.suggestedRewrite && (
        <div className="flex items-start gap-2 rounded-md bg-[var(--score-ats)]/5 px-3 py-2">
          <ArrowRight className="mt-0.5 size-3 shrink-0 text-[var(--score-ats)]" />
          <p className="text-xs leading-relaxed text-[var(--score-ats)]">
            {bullet.suggestedRewrite}
          </p>
        </div>
      )}
    </div>
  );
}
