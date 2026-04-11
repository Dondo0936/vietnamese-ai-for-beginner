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
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {filters.map((f) => {
        const isActive = selected === f.value;
        const count = f.value === "all" ? counts.all : (counts[f.value] ?? 0);

        return (
          <button
            key={f.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(f.value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-accent text-white shadow-sm"
                : "bg-card border border-border text-muted hover:border-accent hover:text-accent"
            }`}
          >
            {f.label}
            <span
              className={`text-xs ${
                isActive ? "text-white/70" : "text-tertiary"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
