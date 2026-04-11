"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

interface StepRevealProps {
  children: React.ReactNode[];
  labels?: string[];
}

export default function StepReveal({ children, labels }: StepRevealProps) {
  const [current, setCurrent] = useState(0);

  const total = children.length;
  const allRevealed = current === total - 1;

  function handleNext() {
    setCurrent((prev) => Math.min(prev + 1, total - 1));
  }

  function handleReset() {
    setCurrent(0);
  }

  const stepLabel = labels?.[current] ?? `Bước ${current + 1}/${total}`;

  return (
    <div className="space-y-4">
      {/* Progress dots + label row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {children.map((_, index) => (
            <motion.div
              key={index}
              animate={{
                width: index <= current ? 32 : 16,
                backgroundColor:
                  index <= current ? "var(--accent)" : "var(--bg-surface)",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-2 rounded-full"
            />
          ))}
        </div>
        <span className="shrink-0 text-xs font-medium text-muted">
          {stepLabel}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {children.map((child, index) =>
          index <= current ? (
            <AnimatePresence key={index} mode="wait">
              <motion.div
                key={`step-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {child}
              </motion.div>
            </AnimatePresence>
          ) : null
        )}
      </div>

      {/* Action button */}
      <div className="flex justify-end">
        {allRevealed ? (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <RotateCcw className="h-4 w-4" />
            Xem lại
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Tiếp tục
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
