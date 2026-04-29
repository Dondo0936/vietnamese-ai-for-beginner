"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";

export interface Blank {
  id: string;
  options: string[];
  correct: number;
}

interface FillBlankProps {
  template: string;
  blanks: Blank[];
}

export default function FillBlank({ template, blanks }: FillBlankProps) {
  const [selections, setSelections] = useState<Record<string, number | null>>(
    () => Object.fromEntries(blanks.map((b) => [b.id, null]))
  );
  const [checked, setChecked] = useState(false);

  const allFilled = blanks.every((b) => selections[b.id] !== null);
  const blankMap = Object.fromEntries(blanks.map((b) => [b.id, b]));

  // Parse template: split on {id} patterns
  function parseTemplate() {
    const parts: Array<{ type: "text"; value: string } | { type: "blank"; id: string }> = [];
    const regex = /\{([^}]+)\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", value: template.slice(lastIndex, match.index) });
      }
      parts.push({ type: "blank", id: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < template.length) {
      parts.push({ type: "text", value: template.slice(lastIndex) });
    }

    return parts;
  }

  function getSelectClass(blank: Blank): string {
    const base =
      "inline-block rounded-lg border px-2 py-1 text-sm font-medium bg-card focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors cursor-pointer";

    if (!checked) {
      const val = selections[blank.id];
      if (val === null) {
        return `${base} border-accent/50 text-foreground`;
      }
      return `${base} border-accent text-foreground`;
    }

    const val = selections[blank.id];
    if (val === null) return `${base} border-border text-muted`;
    const correct = val === blank.correct;
    return correct
      ? `${base} border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700`
      : `${base} border-red-500 bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700`;
  }

  const parts = parseTemplate();

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="text-sm text-foreground leading-loose">
        {parts.map((part, i) => {
          if (part.type === "text") {
            return <span key={i}>{part.value}</span>;
          }

          const blank = blankMap[part.id];
          if (!blank) return <span key={i} className="text-red-500">[?]</span>;

          const val = selections[blank.id];
          const isCorrect = checked && val === blank.correct;
          const isWrong = checked && val !== null && val !== blank.correct;

          return (
            <span key={i} className="inline-flex items-center gap-1 mx-1">
              <select
                disabled={checked}
                value={val ?? ""}
                onChange={(e) => {
                  const num = e.target.value === "" ? null : Number(e.target.value);
                  setSelections((prev) => ({ ...prev, [blank.id]: num }));
                }}
                className={getSelectClass(blank)}
              >
                <option value="">— chọn —</option>
                {blank.options.map((opt, oi) => (
                  <option key={oi} value={oi}>
                    {opt}
                  </option>
                ))}
              </select>
              {isCorrect && <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />}
              {isWrong && <X className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />}
            </span>
          );
        })}
      </div>

      <div className="flex justify-end">
        {checked ? (
          <button
            type="button"
            onClick={() => {
              setSelections(Object.fromEntries(blanks.map((b) => [b.id, null])));
              setChecked(false);
            }}
            className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted hover:bg-surface transition-colors"
          >
            Làm lại
          </button>
        ) : (
          <button
            type="button"
            disabled={!allFilled}
            onClick={() => setChecked(true)}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold transition-opacity disabled:opacity-40 hover:enabled:opacity-90"
          >
            Kiểm tra
          </button>
        )}
      </div>
    </div>
  );
}
