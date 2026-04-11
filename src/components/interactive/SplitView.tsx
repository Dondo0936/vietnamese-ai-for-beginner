import React from "react";

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftLabel?: string;
  rightLabel?: string;
}

export default function SplitView({ left, right, leftLabel, rightLabel }: SplitViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        {leftLabel && (
          <p className="text-xs text-muted font-medium uppercase tracking-wide">{leftLabel}</p>
        )}
        <div className="rounded-xl border border-border bg-card p-4">{left}</div>
      </div>

      <div className="space-y-1.5">
        {rightLabel && (
          <p className="text-xs text-muted font-medium uppercase tracking-wide">{rightLabel}</p>
        )}
        <div className="rounded-xl border border-border bg-card p-4">{right}</div>
      </div>
    </div>
  );
}
