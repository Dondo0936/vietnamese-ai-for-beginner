"use client";

import { useState, useCallback, useEffect } from "react";
import {
  BookOpen,
  X,
  Clock,
  ArrowRight,
  Users,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

export interface PathObjectives {
  audience: string;
  prerequisites: string;
  stageObjectives: { stage: string; objectives: string[] }[];
  outcomes: string[];
  estimatedTime: { stage: string; hours: number }[];
  nextPath: { slug: string; label: string } | null;
}

interface LearningObjectivesModalProps {
  objectives: PathObjectives;
}

export default function LearningObjectivesModal({
  objectives,
}: LearningObjectivesModalProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const totalHours = objectives.estimatedTime.reduce(
    (sum, s) => sum + s.hours,
    0
  );

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:border-accent/30"
      >
        <BookOpen size={16} className="text-accent" />
        Mục tiêu học tập
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen size={20} className="text-accent" />
                Mục tiêu học tập
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-6">
              {/* Dành cho ai? */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Users size={15} className="text-accent" />
                  Dành cho ai?
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {objectives.audience}
                </p>
              </section>

              {/* Điều kiện tiên quyết */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <CheckCircle2 size={15} className="text-accent" />
                  Điều kiện tiên quyết
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {objectives.prerequisites}
                </p>
              </section>

              {/* Bạn sẽ học được gì? */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <GraduationCap size={15} className="text-accent" />
                  Bạn sẽ học được gì?
                </h3>
                <div className="space-y-3">
                  {objectives.stageObjectives.map((stage, i) => (
                    <div
                      key={stage.stage}
                      className="rounded-xl border border-border bg-surface/50 p-3"
                    >
                      <p className="text-xs font-semibold text-accent mb-1.5">
                        Giai đoạn {i + 1}: {stage.stage}
                      </p>
                      <ul className="space-y-1">
                        {stage.objectives.map((obj) => (
                          <li
                            key={obj}
                            className="flex items-start gap-2 text-sm text-muted leading-relaxed"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sau khi hoàn thành */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <CheckCircle2 size={15} className="text-accent" />
                  Sau khi hoàn thành
                </h3>
                <ul className="space-y-1.5">
                  {objectives.outcomes.map((outcome) => (
                    <li
                      key={outcome}
                      className="flex items-start gap-2 text-sm text-muted leading-relaxed"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Thời gian ước tính */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Clock size={15} className="text-accent" />
                  Thời gian ước tính
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {objectives.estimatedTime.map((s) => (
                    <div
                      key={s.stage}
                      className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-center"
                    >
                      <p className="text-xs text-muted">{s.stage}</p>
                      <p className="text-sm font-bold text-foreground">
                        {s.hours}h
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-accent font-medium mt-2 text-center">
                  Tổng: ~{totalHours} giờ
                </p>
              </section>

              {/* Lộ trình tiếp theo */}
              {objectives.nextPath && (
                <section className="border-t border-border pt-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                    <ArrowRight size={15} className="text-accent" />
                    Lộ trình tiếp theo
                  </h3>
                  <Link
                    href={`/paths/${objectives.nextPath.slug}`}
                    onClick={close}
                    className="inline-flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
                  >
                    {objectives.nextPath.label}
                    <ArrowRight size={14} />
                  </Link>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
