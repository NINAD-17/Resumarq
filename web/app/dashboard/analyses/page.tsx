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
    className: "text-[var(--score-impact)]",
    dotClass: "bg-[var(--score-impact)]",
    animate: true,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-[var(--score-ats)]",
    dotClass: "bg-[var(--score-ats)]",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "text-[var(--status-critical)]",
    dotClass: "bg-[var(--status-critical)]",
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
      (a) => a.status === "pending" || a.status === "processing",
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
              className="h-20 animate-pulse rounded-xl bg-muted/50"
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

          return (
            <Link
              key={analysis.id}
              href={`/dashboard/analyses/${analysis.id}`}
              className="block"
            >
              <Card className="transition-colors hover:bg-accent/30">
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Status dot */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`size-2 rounded-full shrink-0 ${status.dotClass} ${
                        status.animate ? "animate-pulse" : ""
                      }`}
                    />

                    {/* Resume name + date */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {analysis.resumeFileName || "Resume"}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
                      </p>
                    </div>
                  </div>

                  {/* Scores (only for completed) */}
                  {analysis.status === "completed" && analysis.results && (
                    <div className="hidden sm:flex items-center gap-4">
                      <ScorePill
                        label="ATS"
                        value={analysis.results.scores.ats}
                        color="var(--score-ats)"
                      />
                      <ScorePill
                        label="Impact"
                        value={analysis.results.scores.impact}
                        color="var(--score-impact)"
                      />
                      {analysis.results.scores.match != null && (
                        <ScorePill
                          label="Match"
                          value={analysis.results.scores.match}
                          color="var(--score-match)"
                        />
                      )}
                    </div>
                  )}

                  {/* Status badge */}
                  <div
                    className={`flex items-center gap-1.5 text-xs font-medium ${status.className}`}
                  >
                    <StatusIcon
                      className={`size-3.5 ${status.animate ? "animate-spin" : ""}`}
                    />
                    <span className="hidden sm:inline">{status.label}</span>
                  </div>

                  <ArrowRight className="size-4 text-muted-foreground/30" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ScorePill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
