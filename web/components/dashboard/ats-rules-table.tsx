import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { ATSRuleResult } from "@/types/analysis";

const STATUS_ICON = {
  pass: { icon: CheckCircle2, className: "text-[var(--status-pass)]" },
  warning: { icon: AlertTriangle, className: "text-[var(--status-warning)]" },
  critical: { icon: XCircle, className: "text-[var(--status-critical)]" },
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
    <div className="space-y-2">
      {sorted.map((rule) => {
        const { icon: Icon, className } = STATUS_ICON[rule.status];

        return (
          <div
            key={rule.ruleId}
            className="rounded-lg border border-border px-4 py-3 transition-colors hover:bg-accent/20"
          >
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 size-4 shrink-0 ${className}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{rule.ruleName}</p>
                {rule.finding && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rule.finding}
                  </p>
                )}
                {rule.suggestion && (
                  <p className="mt-1 text-xs text-[var(--score-ats)]">
                    💡 {rule.suggestion}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  rule.status === "pass"
                    ? "bg-[var(--status-pass)]/10 text-[var(--status-pass)]"
                    : rule.status === "warning"
                      ? "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                      : "bg-[var(--status-critical)]/10 text-[var(--status-critical)]"
                }`}
              >
                {rule.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
