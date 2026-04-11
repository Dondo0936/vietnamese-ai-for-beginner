"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface LessonSectionProps {
  children: React.ReactNode;
  /** Optional section title shown as a small label */
  label?: string;
  /** Optional step number e.g. "1" → displays "Bước 1" */
  step?: number;
  /** Total steps — shows "Bước 1/8" */
  totalSteps?: number;
}

export default function LessonSection({
  children,
  label,
  step,
  totalSteps,
}: LessonSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="lesson-section scroll-mt-20 my-10 first:mt-0">
      {/* Step/label indicator */}
      {(step || label) && (
        <div className="flex items-center gap-2 mb-3">
          {step && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {step}
            </span>
          )}
          {label && (
            <span className="text-xs font-medium text-accent uppercase tracking-wider">
              {label}
            </span>
          )}
          {step && totalSteps && (
            <span className="text-[10px] text-tertiary ml-auto">
              {step}/{totalSteps}
            </span>
          )}
        </div>
      )}

      {/* Content with scroll-triggered animation */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {children}
      </motion.div>

      {/* Brilliance-style embossed divider */}
      <div className="mt-10 section-divider" />
    </div>
  );
}
