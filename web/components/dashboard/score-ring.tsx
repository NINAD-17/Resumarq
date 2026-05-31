"use client";

/**
 * ScoreRing — animated circular SVG progress indicator.
 *
 * Uses an SVG stroke-dashoffset animation for a smooth, reliable arc.
 * Works in both light and dark mode via CSS variables.
 */

import { useEffect, useState } from "react";

interface ScoreRingProps {
  value: number; // 0-100
  label?: string;
  size?: number; // px, default 120
  strokeWidth?: number; // default 8
  /** CSS color value or variable, e.g. "var(--score-ats)" */
  color?: string;
}

export function ScoreRing({
  value,
  label,
  size = 120,
  strokeWidth = 8,
  color = "currentColor",
}: ScoreRingProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = mounted ? (value / 100) * circumference : 0;
  const offset = circumference - progress;

  // Label based on score
  const grade =
    value >= 80 ? "Excellent" : value >= 60 ? "Good" : value >= 40 ? "Fair" : "Needs Work";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      {/* Center text (positioned absolutely over the SVG) */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color }}
        >
          {mounted ? value : 0}
        </span>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        )}
      </div>
      {/* Grade label below */}
      <span className="text-xs font-medium text-muted-foreground">{grade}</span>
    </div>
  );
}
