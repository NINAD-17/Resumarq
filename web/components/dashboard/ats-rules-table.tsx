import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { ATSRuleResult } from "@/types/analysis";

const STATUS_CONFIG = {
  critical: {
    icon: XCircle,
    iconClass: "text-status-critical",
    badgeClass: "bg-status-critical/10 text-status-critical",
    borderClass: "border-l-status-critical",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-status-warning",
    badgeClass: "bg-status-warning/10 text-status-warning",
    borderClass: "border-l-status-warning",
  },
  pass: {
    icon: CheckCircle2,
    iconClass: "text-status-pass",
    badgeClass: "bg-status-pass/10 text-status-pass",
    borderClass: "border-l-status-pass",
  },
};

interface ATSRulesTableProps {
  rules: ATSRuleResult[];
}

export function ATSRulesTable({ rules }: ATSRulesTableProps) {
  // Sort: critical first, then warning, then pass
  const sorted = [...rules].sort((a, b) => {
    const order = { critical: 0, warning: 1, pass: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="space-y-3">
      {sorted.map((rule) => {
        const config = STATUS_CONFIG[rule.status];
        const Icon = config.icon;

        return (
          <div
            key={rule.ruleId}
            className={`rounded-lg border border-border border-l-[3px] ${config.borderClass} bg-card px-5 py-4 transition-colors hover:bg-accent/30`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 size-[18px] shrink-0 ${config.iconClass}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-semibold leading-snug">{rule.ruleName}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${config.badgeClass}`}
                  >
                    {rule.status}
                  </span>
                </div>
                {rule.finding && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {rule.finding}
                  </p>
                )}
                {rule.suggestion && (
                  <div className="mt-2 flex items-start gap-2 rounded-md bg-score-ats/5 px-3 py-2">
                    <span className="text-sm">💡</span>
                    <p className="text-[13px] leading-relaxed text-score-ats">
                      {rule.suggestion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
