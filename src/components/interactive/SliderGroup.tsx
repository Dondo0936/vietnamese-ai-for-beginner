"use client";

import React, { useState } from "react";

export interface SliderConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  unit?: string;
}

interface SliderGroupProps {
  sliders: SliderConfig[];
  visualization: (values: Record<string, number>) => React.ReactNode;
  title?: string;
}

export default function SliderGroup({ sliders, visualization, title }: SliderGroupProps) {
  const [values, setValues] = useState<Record<string, number>>(
    () => Object.fromEntries(sliders.map((s) => [s.key, s.defaultValue]))
  );

  function handleChange(key: string, value: number) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      {title && (
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      )}

      {/* Visualization area */}
      <div className="rounded-lg bg-surface p-4 min-h-[120px] flex items-center justify-center">
        {visualization(values)}
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {sliders.map((slider) => {
          const val = values[slider.key];
          const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
          return (
            <div key={slider.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm text-foreground">{slider.label}</label>
                <span className="font-mono text-sm font-medium text-accent">
                  {val}
                  {slider.unit && <span className="ml-0.5 text-muted">{slider.unit}</span>}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step ?? 1}
                value={val}
                onChange={(e) => handleChange(slider.key, Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-surface-hover accent-accent"
                style={{
                  background: `linear-gradient(to right, var(--color-accent) ${pct}%, var(--bg-surface-hover, #E2E8F0) ${pct}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-tertiary">
                <span>{slider.min}{slider.unit ?? ""}</span>
                <span>{slider.max}{slider.unit ?? ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
