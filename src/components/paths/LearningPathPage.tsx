"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getUserProgress } from "@/lib/database";
import { topicMap } from "@/topics/registry";
import type { TopicMeta, Difficulty } from "@/lib/types";

/* ─── Types ─── */

export interface Stage {
  title: string;
  slugs: string[];
}

interface LearningPathPageProps {
  pathId: string;
  nameVi: string;
  descriptionVi: string;
  icon: React.ElementType;
  stages: Stage[];
}

/* ─── Helpers ─── */

const difficultyLabel: Record<Difficulty, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};

const difficultyColor: Record<Difficulty, string> = {
  beginner: "bg-green-500/15 text-green-600 dark:text-green-400",
  intermediate: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  advanced: "bg-red-500/15 text-red-600 dark:text-red-400",
};

/* ─── Component ─── */

export default function LearningPathPage({
  nameVi,
  descriptionVi,
  icon: Icon,
  stages,
}: LearningPathPageProps) {
  const [readTopics, setReadTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserProgress().then((progress) => {
      setReadTopics(progress.readTopics);
      setLoading(false);
    });
  }, []);

  // Resolve all slugs to TopicMeta
  const allSlugs = stages.flatMap((s) => s.slugs);
  const totalTopics = allSlugs.length;
  const readCount = allSlugs.filter((s) => readTopics.includes(s)).length;
  const pct = totalTopics > 0 ? Math.round((readCount / totalTopics) * 100) : 0;

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Đang tải...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Trang chủ
        </Link>

        {/* ─── Header ─── */}
        <div className="rounded-[16px] border border-border bg-card/50 backdrop-blur-sm p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground leading-tight">
                {nameVi}
              </h1>
              <p className="text-sm text-muted mt-1">{descriptionVi}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted">
                {readCount}/{totalTopics} chủ đề đã hoàn thành
              </span>
              <span className="text-xs font-bold text-accent">{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface">
              <div
                className="h-2 rounded-full bg-accent transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ─── Learning Journey ─── */}
        <div className="relative">
          {stages.map((stage, stageIdx) => {
            const stageTopics = stage.slugs
              .map((s) => topicMap[s])
              .filter((t): t is TopicMeta => t !== undefined);
            const stageRead = stageTopics.filter((t) =>
              readTopics.includes(t.slug)
            ).length;
            const stageTotal = stageTopics.length;
            const stagePct =
              stageTotal > 0
                ? Math.round((stageRead / stageTotal) * 100)
                : 0;
            const isLast = stageIdx === stages.length - 1;

            return (
              <div key={stage.title} className="relative pb-8">
                {/* Connecting line */}
                {!isLast && (
                  <div
                    className="absolute left-[19px] top-[44px] bottom-0 w-px bg-border"
                    aria-hidden="true"
                  />
                )}

                {/* Stage header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      stagePct === 100
                        ? "bg-accent text-white"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {stagePct === 100 ? (
                      <Check size={18} />
                    ) : (
                      stageIdx + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-foreground">
                      {stage.title}
                    </h2>
                    <span className="text-[11px] text-tertiary">
                      {stageRead}/{stageTotal} hoàn thành
                    </span>
                  </div>
                  {stagePct > 0 && stagePct < 100 && (
                    <div className="w-16 h-1.5 rounded-full bg-surface shrink-0">
                      <div
                        className="h-1.5 rounded-full bg-accent transition-all"
                        style={{ width: `${stagePct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Topic cards */}
                <div className="ml-[19px] pl-8 border-l border-transparent">
                  <div className="flex flex-wrap gap-2">
                    {stageTopics.map((topic) => {
                      const isRead = readTopics.includes(topic.slug);
                      return (
                        <Link
                          key={topic.slug}
                          href={`/topics/${topic.slug}`}
                          className={`group relative flex items-center gap-2 rounded-[12px] border px-3 py-2 text-left transition-all ${
                            isRead
                              ? "border-accent/30 bg-accent/5 hover:bg-accent/10"
                              : "border-border bg-card/50 hover:bg-card hover:border-border hover:shadow-sm"
                          }`}
                        >
                          {isRead && (
                            <Check
                              size={13}
                              className="text-accent shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <span
                              className={`block text-[12px] font-medium leading-snug ${
                                isRead ? "text-accent" : "text-foreground"
                              }`}
                            >
                              {topic.titleVi}
                            </span>
                            <span className="block text-[11px] text-tertiary leading-snug">
                              {topic.title}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                              difficultyColor[topic.difficulty]
                            }`}
                          >
                            {difficultyLabel[topic.difficulty]}
                          </span>
                          <ChevronRight
                            size={12}
                            className="text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
