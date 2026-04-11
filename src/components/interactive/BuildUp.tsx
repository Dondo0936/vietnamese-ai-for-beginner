"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, RotateCcw } from "lucide-react";

interface BuildUpProps {
  children: React.ReactNode[];
  labels?: string[];
  addLabel?: string;
}

export default function BuildUp({
  children,
  labels,
  addLabel = "Thêm",
}: BuildUpProps) {
  const [visible, setVisible] = useState(1);

  const total = children.length;
  const canAdd = visible < total;

  function handleAdd() {
    setVisible((prev) => Math.min(prev + 1, total));
  }

  function handleReset() {
    setVisible(1);
  }

  return (
    <div className="space-y-4">
      {/* Pieces */}
      <div className="space-y-3">
        {children.map((child, index) =>
          index < visible ? (
            <motion.div
              key={index}
              initial={index === visible - 1 ? { opacity: 0, scale: 0.95 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {labels?.[index] != null ? (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                  {labels[index]}
                </p>
              ) : null}
              {child}
            </motion.div>
          ) : null
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3">
        {/* Counter */}
        <span className="text-xs font-medium text-muted">
          {visible}/{total}
        </span>

        <div className="flex items-center gap-2">
          {/* Reset — only shown when more than initial visible */}
          {visible > 1 ? (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Bắt đầu lại
            </button>
          ) : null}

          {/* Add button */}
          {canAdd ? (
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Plus className="h-4 w-4" />
              {addLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
