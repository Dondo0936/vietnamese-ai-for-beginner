"use client";

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useProgress } from "@/lib/progress-context";
import { kidsTopicMap } from "@/topics/kids/kids-registry";
import type { KidsTopicMeta, KidTier } from "@/lib/kids/types";
import type { Stage } from "@/components/paths/LearningPathPage";

interface KidsPathPageProps {
  tier: KidTier;
  nameVi: string;
  descriptionVi: string;
  /** Emoji placeholder in v1; replaced with real art in Phase 6. */
  mascotEmoji: string;
  icon: React.ElementType;
  stages: Stage[];
}

/**
 * Kid-tier learning path page. Variant of LearningPathPage with:
 *   - mascot emoji slot in the header
 *   - tier-specific accent color (yellow for Nhí, purple for Teen)
 *   - larger touch targets on topic cards
 *   - graceful empty state for Phase 1 (when kidsTopicMap is empty)
 *
 * Spec §10.2 + §13.
 */
export default function KidsPathPage({
  tier,
  nameVi,
  descriptionVi,
  mascotEmoji,
  icon: Icon,
  stages,
}: KidsPathPageProps) {
  const { readTopics, loading } = useProgress();

  const allSlugs = stages.flatMap((s) => s.slugs);
  const totalTopics = allSlugs.length;
  const readCount = allSlugs.filter((s) => readTopics.includes(s)).length;

  const tierAccent =
    tier === "nhi"
      ? {
          border: "border-amber-300 dark:border-amber-500/40",
          bg: "bg-amber-50/70 dark:bg-amber-500/5",
          text: "text-amber-700 dark:text-amber-400",
        }
      : {
          border: "border-violet-300 dark:border-violet-500/40",
          bg: "bg-violet-50/70 dark:bg-violet-500/5",
          text: "text-violet-700 dark:text-violet-400",
        };

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
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Trang chủ
        </Link>

        {/* Header with mascot + tier accent */}
        <div className={`rounded-[20px] border-2 ${tierAccent.border} ${tierAccent.bg} p-6 mb-8`}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 text-5xl leading-none" aria-hidden="true">
              {mascotEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${tierAccent.text} mb-1`}>
                <Icon size={14} />
                <span>{tier === "nhi" ? "Lộ trình Nhí · 6–10 tuổi" : "Lộ trình Teen · 11–15 tuổi"}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">{nameVi}</h1>
              {descriptionVi && <p className="text-sm text-muted mt-2">{descriptionVi}</p>}
            </div>
          </div>

          {totalTopics > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted">
                  {readCount}/{totalTopics} bài đã xong
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    tier === "nhi" ? "bg-amber-400" : "bg-violet-400"
                  }`}
                  style={{
                    width: `${Math.round((readCount / totalTopics) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Empty state (Phase 1 ships here) */}
        {stages.length === 0 && (
          <div className="rounded-[16px] border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted">
              Các bài học đang được chuẩn bị.{" "}
              <span className="inline-block animate-pulse">📚</span>
            </p>
            <p className="text-xs text-tertiary mt-2">
              Quay lại sớm nhé!
            </p>
          </div>
        )}

        {/* Stages */}
        {stages.map((stage, stageIdx) => {
          const stageTopics = stage.slugs
            .map((s) => kidsTopicMap[s])
            .filter((t): t is KidsTopicMeta => t !== undefined);
          const isLast = stageIdx === stages.length - 1;

          return (
            <div key={stage.title} className="relative pb-8">
              {!isLast && (
                <div
                  className="absolute left-[19px] top-[44px] bottom-0 w-px bg-border"
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${tierAccent.bg} ${tierAccent.text} border ${tierAccent.border}`}
                >
                  {stageIdx + 1}
                </div>
                <h2 className="text-sm font-semibold text-foreground">{stage.title}</h2>
              </div>
              <div className="ml-[19px] pl-8">
                <div className="flex flex-wrap gap-2">
                  {stageTopics.map((topic) => {
                    const isRead = readTopics.includes(topic.slug);
                    return (
                      <Link
                        key={topic.slug}
                        href={`/kids/topics/${topic.slug}`}
                        className={`group relative flex items-center gap-2 rounded-[14px] border px-4 py-3 text-left transition-all min-h-[44px] ${
                          isRead
                            ? `${tierAccent.border} ${tierAccent.bg}`
                            : "border-border bg-card/50 hover:bg-card"
                        }`}
                      >
                        {isRead && <Check size={14} className={tierAccent.text} />}
                        <span className="text-[13px] font-medium text-foreground leading-snug">
                          {topic.titleVi}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
