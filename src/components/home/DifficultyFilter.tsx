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

export default function DifficultyFilter({
  selected,
  onChange,
  counts,
}: DifficultyFilterProps) {
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {filters.map((f) => {
        const isActive = selected === f.value;
        const count = f.value === "all" ? counts.all : (counts[f.value] ?? 0);

        return (
          <button
            key={f.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(f.value)}
            // DS: pill chip with ink fill when active, transparent when not.
            // Resting ghost, hover darkens to ink — no colour flash (DS rule).
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-[7px] text-[13px] font-medium transition-all duration-[var(--dur-fast)] ${
              isActive
                ? "bg-foreground text-background"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
            style={
              isActive
                ? {
                    // DS button anatomy: inset highlight + 1px resting drop.
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(17,17,17,0.08)",
                  }
                : undefined
            }
          >
            {f.label}
            <span className={`text-[11px] ${isActive ? "opacity-60" : "text-tertiary"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
