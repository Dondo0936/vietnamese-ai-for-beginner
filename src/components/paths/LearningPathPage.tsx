"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useProgress } from "@/lib/progress-context";
import { topicMap } from "@/topics/registry";
import type { TopicMeta, Difficulty } from "@/lib/types";
import "./path-page.css";

/* ─── Types ─── */

export interface Stage {
  title: string;
  slugs: string[];
}

export interface PathEditor {
  name: string;
  role: string;
  initials: string;
}

export interface PathFaqItem {
  q: string;
  a: string;
}

export interface PathExtras {
  editor?: PathEditor;
  faq?: PathFaqItem[];
  eyebrowVi?: string;
}

interface LearningPathPageProps {
  pathId: string;
  nameVi: string;
  descriptionVi: string;
  icon: React.ElementType;
  stages: Stage[];
  headerExtra?: React.ReactNode;
  /** Optional per-path content (instructor, FAQ, eyebrow). Omit to hide. */
  extras?: PathExtras;
}

/* ─── Helpers ─── */

const difficultyLabel: Record<Difficulty, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};

const difficultyModifier: Record<Difficulty, string> = {
  beginner: "lp-lesson__diff--beginner",
  intermediate: "lp-lesson__diff--intermediate",
  advanced: "lp-lesson__diff--advanced",
};

/* ─── Component ─── */

export default function LearningPathPage(props: LearningPathPageProps) {
  return (
    <AppShell>
      <LearningPathContent {...props} />
    </AppShell>
  );
}

function LearningPathContent({
  pathId,
  nameVi,
  descriptionVi,
  stages,
  headerExtra,
  extras,
}: LearningPathPageProps) {
  const { readTopics, loading } = useProgress();

  if (loading) {
    return (
      <div className="lp-page">
        <div className="lp-container">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  const allSlugs = stages.flatMap((s) => s.slugs);
  const totalTopics = allSlugs.length;
  const readCount = allSlugs.filter((s) => readTopics.includes(s)).length;
  const pct = totalTopics > 0 ? Math.round((readCount / totalTopics) * 100) : 0;

  // ─── Resolve current stage + next unread lesson (powers Resume card) ───
  type StageCtx = {
    stage: Stage;
    idx: number;
    firstUnreadSlug: string | null;
  };
  let currentStage: StageCtx | null = null;
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const firstUnread = stage.slugs.find((s) => !readTopics.includes(s));
    if (firstUnread !== undefined) {
      currentStage = { stage, idx: i, firstUnreadSlug: firstUnread };
      break;
    }
  }
  // If all lessons read, currentStage is null — show "completed" state
  const nextUnreadTopic: TopicMeta | null = currentStage?.firstUnreadSlug
    ? (topicMap[currentStage.firstUnreadSlug] ?? null)
    : null;
  const isFirstLesson = readCount === 0;
  const ctaLabel = isFirstLesson
    ? "Bắt đầu học →"
    : nextUnreadTopic
      ? "Tiếp tục học →"
      : "Xem lại lộ trình →";

  const eyebrowText = extras?.eyebrowVi ?? `Lộ trình ${pathId}`;

  return (
    <div className="lp-page">
      <div className="lp-container">
        <Link href="/" className="lp-back">
          <ArrowLeft size={14} />
          Trang chủ
        </Link>

        {/* ─── Hero (split) ─── */}
        <section className="lp-hero">
          <div className="lp-hero__left">
            <div className="lp-eyebrow">
              <span className="lp-dot" />
              {eyebrowText}
            </div>
            <h1 className="lp-h1">{nameVi}</h1>
            <p className="lp-tagline">{descriptionVi}</p>
            {headerExtra && <div className="mb-6">{headerExtra}</div>}
            <div className="lp-meta">
              <div>
                <b>{totalTopics}</b>
                <span>bài</span>
              </div>
              <div>
                <b>{stages.length}</b>
                <span>chương</span>
              </div>
              <div>
                <b>{readCount}</b>
                <span>đã đọc</span>
              </div>
              <div>
                <b>{pct}%</b>
                <span>hoàn thành</span>
              </div>
            </div>
          </div>

          <aside className="lp-resume">
            <div className="lp-resume__head">
              <span className="lp-resume__tag">
                {nextUnreadTopic ? "Tiếp tục ở đây" : "Đã hoàn thành"}
              </span>
              <span className="lp-resume__pct">{pct}%</span>
            </div>
            <div className="lp-resume__ch">
              {currentStage?.stage.title ?? "Toàn bộ lộ trình"}
            </div>
            <h3 className="lp-resume__t">
              {nextUnreadTopic?.titleVi ?? "Bạn đã học hết các bài trong lộ trình này."}
            </h3>
            <div className="lp-resume__bar">
              <div
                className="lp-resume__bar-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="lp-resume__bar-meta">
              <span>
                <b>{readCount}</b> / {totalTopics} bài
              </span>
              <span>{pct}%</span>
            </div>
            {nextUnreadTopic ? (
              <Link
                href={`/topics/${nextUnreadTopic.slug}?path=${pathId}`}
                className="lp-btn lp-btn--primary lp-btn--xl"
              >
                {ctaLabel}
              </Link>
            ) : (
              <Link
                href={`/topics/${allSlugs[0]}?path=${pathId}`}
                className="lp-btn lp-btn--xl"
              >
                Xem lại từ đầu →
              </Link>
            )}
            <div className="lp-resume__foot">
              <span>lưu ẩn danh</span>
              <span>· không cần email</span>
            </div>
          </aside>
        </section>

        {/* ─── Body: accordion chapters + stats/editor rail ─── */}
        <div className="lp-body">
          <section className="lp-chapters">
            <h2 className="lp-chapters__h">Nội dung</h2>
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
              const isCurrentStage = currentStage?.idx === stageIdx;
              const defaultOpen = isCurrentStage || stageIdx < 2;

              return (
                <details
                  key={stage.title}
                  className="lp-ch"
                  open={defaultOpen}
                >
                  <summary className="lp-ch__sum">
                    <div className="lp-ch__left">
                      <span className="lp-ch__n">
                        {String(stageIdx + 1).padStart(2, "0")}
                      </span>
                      <div className="lp-ch__title">
                        <span className="lp-ch__unit">
                          Chương {stageIdx + 1}
                        </span>
                        <h3>{stage.title}</h3>
                      </div>
                    </div>
                    <div className="lp-ch__right">
                      <div className="lp-ch__progress">
                        <div className="lp-ch__bar">
                          <div
                            className="lp-ch__bar-f"
                            style={{ width: `${stagePct}%` }}
                          />
                        </div>
                        <span>
                          {stageRead}/{stageTotal}
                        </span>
                      </div>
                      <span className="lp-ch__chev" aria-hidden>
                        ⌄
                      </span>
                    </div>
                  </summary>

                  <div className="lp-ch__lessons">
                    {stageTopics.map((topic, j) => {
                      const isRead = readTopics.includes(topic.slug);
                      const isNext =
                        isCurrentStage &&
                        currentStage?.firstUnreadSlug === topic.slug;
                      let markClass = "lp-mark lp-mark--queue";
                      let markContent: React.ReactNode = null;
                      if (isRead) {
                        markClass = "lp-mark lp-mark--done";
                        markContent = <Check size={12} />;
                      } else if (isNext) {
                        markClass = "lp-mark lp-mark--next";
                        markContent = <ArrowRight size={12} />;
                      }
                      const rowClass = isRead
                        ? "lp-lesson is-done"
                        : isNext
                          ? "lp-lesson is-next"
                          : "lp-lesson";
                      return (
                        <Link
                          key={topic.slug}
                          href={`/topics/${topic.slug}?path=${pathId}`}
                          className={rowClass}
                        >
                          <span className="lp-lesson__n">
                            {String(stageIdx + 1).padStart(2, "0")}.
                            {String(j + 1).padStart(2, "0")}
                          </span>
                          <span className={markClass}>{markContent}</span>
                          <div>
                            <div className="lp-lesson__t">
                              <span>
                                {topic.titleVi}
                                {topic.applicationOf && (
                                  <span className="lp-lesson__sub">
                                    {" · Ứng dụng"}
                                  </span>
                                )}
                              </span>
                              {topic.applicationOf && (
                                <span className="lp-lesson__app">ứng dụng</span>
                              )}
                            </div>
                            <span className="lp-lesson__sub">{topic.title}</span>
                          </div>
                          <span
                            className={`lp-lesson__diff ${difficultyModifier[topic.difficulty]}`}
                          >
                            {difficultyLabel[topic.difficulty]}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </section>

          <aside className="lp-rail">
            <div className="lp-rail__block">
              <h4>Tiến độ</h4>
              <div className="lp-stats">
                <div className="lp-stat">
                  <div className="lp-stat__v">
                    {readCount}/{totalTopics}
                  </div>
                  <div className="lp-stat__l">bài đã đọc</div>
                </div>
                <div className="lp-stat">
                  <div className="lp-stat__v">{pct}%</div>
                  <div className="lp-stat__l">hoàn thành</div>
                </div>
                <div className="lp-stat">
                  <div className="lp-stat__v">{stages.length}</div>
                  <div className="lp-stat__l">chương</div>
                </div>
                <div className="lp-stat">
                  <div className="lp-stat__v">
                    {totalTopics - readCount}
                  </div>
                  <div className="lp-stat__l">còn lại</div>
                </div>
              </div>
            </div>

            {extras?.editor && (
              <div className="lp-rail__block">
                <h4>Biên tập</h4>
                <div className="lp-editor">
                  <div className="lp-editor__av">
                    {extras.editor.initials}
                  </div>
                  <div className="lp-editor__info">
                    <b>{extras.editor.name}</b>
                    <span>{extras.editor.role}</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ─── FAQ ─── */}
        {extras?.faq && extras.faq.length > 0 && (
          <section className="lp-faq">
            <h2>Câu hỏi thường gặp</h2>
            <div className="lp-faq__list">
              {extras.faq.map((item, i) => (
                <details key={i} className="lp-faq__item">
                  <summary>
                    {item.q}
                    <span>+</span>
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ─── Mobile sticky "Tiếp →" CTA (hidden ≥ lg) ─── */}
      {nextUnreadTopic && (
        <div className="mlp-cta">
          <div className="mlp-cta__info">
            <div className="mlp-cta__n">
              {currentStage?.stage.title ?? ""}
            </div>
            <div className="mlp-cta__t">{nextUnreadTopic.titleVi}</div>
          </div>
          <Link
            href={`/topics/${nextUnreadTopic.slug}?path=${pathId}`}
            className="mlp-cta__btn"
          >
            Tiếp →
          </Link>
        </div>
      )}
    </div>
  );
}
