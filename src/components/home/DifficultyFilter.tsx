"use client";

import type { Difficulty } from "@/lib/types";

const filters: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "beginner", label: "Cơ bản" },
  { value: "intermediate", label: "Trung bình" },
  { value: "advanced", label: "Nâng cao" },
];

interface DifficultyFilterProps {
  selected: Difficulty | "all";
  onChange: (value: Difficulty | "all") => void;
  counts: Record<string, number>;
}

/**
 * DS pill chip group. No colour flash on press (DS rule); active state is
 * an ink fill (not turquoise — turquoise is reserved for the hero mark).
 */
export default function DifficultyFilter({
  selected,
  onChange,
  counts,
}: DifficultyFilterProps) {
  return (
    <div
      role="group"
      aria-label="Lọc theo độ khó"
      className="flex flex-wrap items-center justify-center gap-1"
    >
      {filters.map((f) => {
        const isActive = selected === f.value;
        const count = f.value === "all" ? counts.all : counts[f.value] ?? 0;

        return (
          <button
            key={f.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(f.value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-[6px] text-[13px] font-medium transition-colors duration-150 ${
              isActive
                ? "bg-foreground text-background"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
            style={
              isActive
                ? {
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(17,17,17,0.08)",
                  }
                : undefined
            }
          >
            {f.label}
            <span className={`font-mono text-[11px] ${isActive ? "opacity-60" : "text-tertiary"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
