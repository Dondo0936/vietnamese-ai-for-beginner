"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";

interface InlineChallengeProps {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export default function InlineChallenge({
  question,
  options,
  correct,
  explanation,
}: InlineChallengeProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const isWrong = selected !== null && selected !== correct;

  function getButtonClass(index: number): string {
    const base =
      "w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring";

    if (selected === null) {
      return `${base} border-border bg-card text-foreground hover:bg-surface hover:border-accent/50`;
    }

    if (index === correct) {
      return `${base} border-emerald-600 bg-emerald-100 text-foreground font-semibold dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-600`;
    }
    if (index === selected) {
      return `${base} border-red-500 bg-red-100 text-foreground font-semibold dark:bg-red-900/30 dark:text-red-100 dark:border-red-600`;
    }
    return `${base} border-border bg-card text-muted opacity-50`;
  }

  // Buttons stay enabled after a wrong guess so the learner can click
  // "Thử lại" and pick again. After a correct guess we lock to avoid
  // accidental re-entry.
  const locked = selected === correct;

  return (
    <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent-light p-5 space-y-3">
      <p className="text-sm font-medium text-foreground leading-snug">{question}</p>

      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            disabled={locked}
            onClick={() => setSelected(index)}
            className={getButtonClass(index)}
          >
            <span className="mr-2 inline-block w-5 text-center text-muted">
              {String.fromCharCode(65 + index)}.
            </span>
            {option}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected !== null && explanation && (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className={`rounded-xl border p-3 text-sm leading-relaxed mt-1 text-foreground ${
                selected === correct
                  ? "border-emerald-600 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20"
                  : "border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
              }`}
            >
              <span
                className={`font-semibold ${
                  selected === correct
                    ? "text-emerald-800 dark:text-emerald-200"
                    : "text-red-800 dark:text-red-200"
                }`}
              >
                {selected === correct ? "Chính xác! " : "Chưa đúng. "}
              </span>
              {explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isWrong && (
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Thử lại
        </button>
      )}
    </div>
  );
}
