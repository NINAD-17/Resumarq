"use client";

/**
 * ScoreRing — animated circular progress indicator.
 *
 * Uses CSS conic-gradient for the arc and a CSS transition for the animation.
 * The ring fills from 0 to `value` over 1 second after mounting.
 */

import { useEffect, useState } from "react";

interface ScoreRingProps {
  value: number; // 0-100
  label: string;
  color: string; // CSS variable, e.g. "var(--score-ats)"
  size?: number; // px, default 100
}

export function ScoreRing({
  value,
  label,
  color,
  size = 100,
}: ScoreRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animate from 0 to value on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 50);
    return () => clearTimeout(timer);
  }, [value]);

  const angle = (animatedValue / 100) * 360;
  const strokeWidth = 6;
  const trackColor = "var(--border)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} ${angle}deg, ${trackColor} ${angle}deg)`,
          transition: "background 1s ease-out",
        }}
      >
        {/* Inner circle to create the ring effect */}
        <div
          className="flex items-center justify-center rounded-full bg-card"
          style={{
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
          }}
        >
          <span
            className="text-xl font-semibold tabular-nums"
            style={{ color }}
          >
            {animatedValue}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
