"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown } from "lucide-react";

interface PredictionGateProps {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  children?: React.ReactNode;
}

export default function PredictionGate({
  question,
  options,
  correct,
  explanation,
  children,
}: PredictionGateProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const isCorrect = selected === correct;

  function getOptionClass(index: number): string {
    const base =
      "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring";

    if (!revealed) {
      if (selected === index) {
        return `${base} border-accent bg-accent-light text-accent-dark`;
      }
      return `${base} border-border bg-card text-foreground hover:bg-surface hover:border-accent/50`;
    }

    // After reveal
    if (index === correct) {
      return `${base} border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-600`;
    }
    if (selected === index && index !== correct) {
      return `${base} border-red-500 bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100 dark:border-red-600`;
    }
    return `${base} border-border bg-card text-muted opacity-60`;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      {/* Question */}
      <div className="flex items-start gap-3">
        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <p className="text-foreground font-medium leading-snug">{question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            disabled={revealed}
            onClick={() => setSelected(index)}
            className={getOptionClass(index)}
          >
            <span className="mr-2 inline-block w-5 text-center text-muted">
              {String.fromCharCode(65 + index)}.
            </span>
            {option}
          </button>
        ))}
      </div>

      {/* Check button */}
      {revealed ? null : (
        <button
          type="button"
          disabled={selected === null}
          onClick={() => setRevealed(true)}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:enabled:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Kiểm tra
        </button>
      )}

      {/* Explanation */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className={`rounded-xl border p-4 text-sm leading-relaxed ${
                isCorrect
                  ? "border-emerald-600 bg-emerald-100 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-100"
                  : "border-amber-500 bg-amber-100 text-amber-900 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-100"
              }`}
            >
              <span className="font-semibold">
                {isCorrect ? "Chính xác! " : "Chưa đúng. "}
              </span>
              {explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gated children */}
      <AnimatePresence>
        {revealed && children != null ? (
          <motion.div
            key="children"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
          >
            <div className="flex justify-center py-1">
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              >
                <ChevronDown className="h-5 w-5 text-accent" />
              </motion.div>
            </div>
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
