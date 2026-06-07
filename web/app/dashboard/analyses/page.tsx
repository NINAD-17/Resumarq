"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  FileSearch,
  GitCompareArrows,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisResponse } from "@/types/analysis";

type StatusInfo = {
  label: string;
  icon: typeof Clock;
  className: string;
  dotClass: string;
  animate?: boolean;
};

const STATUS_CONFIG: Record<string, StatusInfo> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "text-score-impact",
    dotClass: "bg-score-impact",
    animate: true,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-score-ats",
    dotClass: "bg-score-ats",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "text-status-critical",
    dotClass: "bg-status-critical",
  },
};

export default function AnalysesListPage() {
  const [analyses, setAnalyses] = useState<AnalysisResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = async () => {
    try {
      const res = await fetch("/api/analyses");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAnalyses(data);
      setError(null);
    } catch {
      setError("Failed to load analyses");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalyses();
  }, []);

  // Poll every 5s if any analysis is still processing
  useEffect(() => {
    const hasProcessing = analyses.some(
      (a) => ["pending", "processing", "extracting_data", "analyzing_ats", "evaluating_impact", "comparing_gap", "generating_feedback", "compiling_report"].includes(a.status),
    );
    if (!hasProcessing) return;

    const interval = setInterval(fetchAnalyses, 5000);
    return () => clearInterval(interval);
  }, [analyses]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            My Analyses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your past resume analyses
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-muted/50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Analyses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {analyses.length === 0
            ? "No analyses yet — start your first one!"
            : `${analyses.length} ${analyses.length === 1 ? "analysis" : "analyses"}`}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Empty state */}
      {analyses.length === 0 && !error && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 size-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No analyses yet.{" "}
              <Link
                href="/dashboard"
                className="font-medium text-foreground hover:underline"
              >
                Start your first analysis →
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Analysis cards */}
      <div className="space-y-3">
        {analyses.map((analysis) => {
          const status = STATUS_CONFIG[analysis.status];
          const StatusIcon = status.icon;
          const hasJD = !!analysis.jdText;
          const scores = analysis.status === "completed" ? analysis.results?.scores : null;

          return (
            <Link
              key={analysis.id}
              href={`/dashboard/analyses/${analysis.id}`}
              className="block group"
            >
              <Card className="transition-all hover:bg-accent/30 hover:border-border/80">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left — Info */}
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Title row */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`size-2 shrink-0 rounded-full ${status.dotClass} ${
                            status.animate ? "animate-pulse" : ""
                          }`}
                        />
                        <p className="truncate text-[15px] font-semibold">
                          {analysis.results?.title || analysis.resumeFileName || "Resume Analysis"}
                        </p>
                        {analysis.results?.title && analysis.resumeFileName && (
                          <p className="truncate text-xs text-muted-foreground mt-0.5">
                            {analysis.resumeFileName}
                          </p>
                        )}
                      </div>

                      {/* Meta row — date + type badge */}
                      <div className="flex items-center gap-3 pl-[18px]">
                        <span className="text-xs text-muted-foreground">
                          {new Date(analysis.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          hasJD
                            ? "bg-score-match/10 text-score-match"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {hasJD ? (
                            <><GitCompareArrows className="size-3" /> Resume + JD</>
                          ) : (
                            <><FileSearch className="size-3" /> Resume Only</>
                          )}
                        </span>
                      </div>

                      {/* Score pills — only for completed */}
                      {scores && (
                        <div className="flex flex-wrap items-center gap-2 pl-[18px]">
                          <ScorePill label="Overall" value={scores.overall} variant="overall" />
                          <ScorePill label="ATS" value={scores.ats} variant="ats" />
                          <ScorePill label="Impact" value={scores.impact} variant="impact" />
                          {scores.match != null && (
                            <ScorePill label="Match" value={scores.match} variant="match" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right — Status + Arrow */}
                    <div className="flex shrink-0 items-center gap-2">
                      <div
                        className={`flex items-center gap-1.5 text-xs font-medium ${status.className}`}
                      >
                        <StatusIcon
                          className={`size-3.5 ${status.animate ? "animate-spin" : ""}`}
                        />
                        <span className="hidden sm:inline">{status.label}</span>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Score pill sub-component ─────────────────────────────────── */

const VARIANT_STYLES = {
  overall: "bg-foreground/10 text-foreground font-bold",
  ats: "bg-score-ats/10 text-score-ats",
  impact: "bg-score-impact/10 text-score-impact",
  match: "bg-score-match/10 text-score-match",
};

function ScorePill({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: keyof typeof VARIANT_STYLES;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${VARIANT_STYLES[variant]}`}>
      {label} {value}
    </span>
  );
}
