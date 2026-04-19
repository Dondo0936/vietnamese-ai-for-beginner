"use client";

import React from "react";

export interface MetricReadoutProps {
  /** Screen-reader label, e.g. "Hệ số góc", "MSE". */
  label: string;
  /** The value to render. Numbers are passed through `format` if provided. */
  value: React.ReactNode;
  /** Optional formatter for number values; ignored for ReactNode values. */
  format?: (v: number) => string;
  /** Optional suffix/unit, e.g. "%", "px". */
  unit?: string;
  /** Tailwind-ish class override for the value span. */
  valueClassName?: string;
  /** Extra classes for the wrapping container. */
  className?: string;
}

/**
 * Live-updating metric display that announces changes to screen readers.
 *
 * Wraps any slider-driven metric (MSE, slope, AUC, variance, loss) so the
 * new value is read out via `aria-live="polite"` when it changes. Without
 * this wrapper, sighted users see the new number and SR users hear
 * nothing.
 *
 * Enforced by `docs/CONTRACTS.md` §3.4 + `src/__tests__/contracts.test.ts`.
 */
export function MetricReadout({
  label,
  value,
  format,
  unit,
  valueClassName,
  className,
}: MetricReadoutProps) {
  const shown =
    typeof value === "number" && format ? format(value) : String(value);
  return (
    <span
      className={className ?? "inline-flex items-baseline gap-1.5"}
      aria-live="polite"
    >
      <span className="text-xs text-muted">{label}</span>
      <span
        className={
          valueClassName ?? "font-mono text-sm font-semibold text-accent"
        }
      >
        {shown}
        {unit && <span className="ml-0.5 text-muted">{unit}</span>}
      </span>
    </span>
  );
}
