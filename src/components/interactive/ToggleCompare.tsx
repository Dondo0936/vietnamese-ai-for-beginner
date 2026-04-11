"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ToggleCompareProps {
  labelA: string;
  labelB: string;
  childA: React.ReactNode;
  childB: React.ReactNode;
  description?: string;
}

export default function ToggleCompare({
  labelA,
  labelB,
  childA,
  childB,
  description,
}: ToggleCompareProps) {
  const [showB, setShowB] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Toggle buttons */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setShowB(false)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
            !showB
              ? "bg-accent text-white"
              : "bg-surface text-muted hover:bg-surface-hover"
          }`}
        >
          {labelA}
        </button>
        <button
          onClick={() => setShowB(true)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
            showB
              ? "bg-accent text-white"
              : "bg-surface text-muted hover:bg-surface-hover"
          }`}
        >
          {labelB}
        </button>
      </div>

      {/* Optional description */}
      {description && (
        <p className="text-sm text-center text-muted">{description}</p>
      )}

      {/* Content area with cross-fade */}
      <div className="relative min-h-[80px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={showB ? "B" : "A"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {showB ? childB : childA}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
