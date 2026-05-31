import { ArrowRight, AlertTriangle } from "lucide-react";
import type { BulletAuditResult } from "@/types/analysis";

interface BulletAuditCardProps {
  bullet: BulletAuditResult;
  index: number;
}

export function BulletAuditCard({ bullet, index }: BulletAuditCardProps) {
  const scoreColor =
    bullet.bulletScore >= 70
      ? "text-status-pass"
      : bullet.bulletScore >= 40
        ? "text-status-warning"
        : "text-status-critical";

  const scoreBg =
    bullet.bulletScore >= 70
      ? "bg-status-pass/10"
      : bullet.bulletScore >= 40
        ? "bg-status-warning/10"
        : "bg-status-critical/10";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {index + 1}
          </span>
          <span className="text-[13px] font-medium text-muted-foreground">
            {bullet.experienceCompany}
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold tabular-nums ${scoreBg} ${scoreColor}`}
        >
          {bullet.bulletScore}/100
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Original text */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Original
          </p>
          <p className="text-[14px] leading-relaxed text-foreground/80">
            {bullet.originalText}
          </p>
        </div>

        {/* Issues */}
        {bullet.issues.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {bullet.issues.map((issue, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-md bg-status-warning/8 px-2.5 py-1 text-[12px] font-medium text-status-warning"
              >
                <AlertTriangle className="size-3" />
                {issue}
              </span>
            ))}
          </div>
        )}

        {/* Suggested rewrite — highlighted */}
        {bullet.suggestedRewrite && (
          <div className="rounded-lg border border-score-ats/20 bg-score-ats/5 px-4 py-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-score-ats/60">
              <ArrowRight className="mr-1 inline size-3" />
              Suggested Rewrite
            </p>
            <p className="text-[14px] leading-relaxed text-score-ats">
              {bullet.suggestedRewrite}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
