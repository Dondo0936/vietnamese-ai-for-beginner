"use client";

import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  Code2,
  FlaskConical,
  ArrowUpRight,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import { PATHS, type AdultPathId } from "@/lib/paths";

function slugsForPath(id: AdultPathId): string[] {
  return PATHS[id].stages.flatMap((s) => s.slugs);
}

export interface Profession {
  id: string;
  nameVi: string;
  descriptionVi: string;
  icon: React.ElementType;
  topicSlugs: string[];
  href?: string;
}

export const professions: Profession[] = [
  {
    id: "student",
    nameVi: "Học sinh · Sinh viên",
    descriptionVi:
      "Nền tảng AI/ML từ con số 0 — toán, thuật toán cổ điển, mạng nơ-ron cơ bản",
    icon: GraduationCap,
    topicSlugs: slugsForPath("student"),
  },
  {
    id: "office",
    nameVi: "Nhân viên văn phòng",
    descriptionVi:
      "Hiểu AI để ứng dụng trong công việc — prompt, RAG, agent, an toàn AI",
    icon: Briefcase,
    topicSlugs: slugsForPath("office"),
  },
  {
    id: "ai-engineer",
    nameVi: "AI Engineer",
    descriptionVi:
      "Xây dựng & triển khai hệ thống AI — fine-tuning, RAG, serving, MLOps",
    icon: Code2,
    topicSlugs: slugsForPath("ai-engineer"),
  },
  {
    id: "ai-researcher",
    nameVi: "AI Researcher",
    descriptionVi:
      "Lý thuyết sâu & xu hướng mới — scaling laws, alignment, kiến trúc tiên tiến",
    icon: FlaskConical,
    topicSlugs: slugsForPath("ai-researcher"),
  },
];

interface ProfessionPathsProps {
  topics: TopicMeta[];
  readTopics?: string[];
}

/**
 * Profession-path cards — DS editorial card.
 *
 *  - Surface: pure white on paper (--bg-card on --bg-primary).
 *  - 1px hairline border (--border).
 *  - Radius-xl (16px) — DS "large feature card".
 *  - Resting shadow-sm, lifts 1px on hover, no colour flash.
 *  - Turquoise is absent from this surface; brand restraint is the point.
 *    Progress bar uses ink (--fg-2) at 40% opacity so it stays monochrome.
 */
export default function ProfessionPaths({
  topics,
  readTopics = [],
}: ProfessionPathsProps) {
  const topicMap = new Map(topics.map((t) => [t.slug, t]));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {professions.map((prof) => {
        const resolved = prof.topicSlugs
          .map((s) => topicMap.get(s))
          .filter((t): t is TopicMeta => t !== undefined);
        const readCount = resolved.filter((t) =>
          readTopics.includes(t.slug)
        ).length;
        const Icon = prof.icon;
        const pct =
          resolved.length > 0
            ? Math.round((readCount / resolved.length) * 100)
            : 0;

        return (
          <Link
            key={prof.id}
            href={prof.href ?? `/paths/${prof.id}`}
            className="group relative block overflow-hidden border border-border bg-card transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-[1px] hover:border-[color:var(--border-strong)]"
            style={{
              borderRadius: 16,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-start gap-4 p-5">
              {/* Icon tile — DS paper-2 surface, ink glyph */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center text-foreground"
                style={{
                  borderRadius: 10,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <h3
                  className="font-display text-foreground"
                  style={{
                    fontWeight: 500,
                    fontSize: 18,
                    lineHeight: 1.2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {prof.nameVi}
                </h3>
                <p
                  className="mt-1.5 text-muted"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    textWrap: "pretty",
                  }}
                >
                  {prof.descriptionVi}
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <span className="font-mono text-[11px] text-tertiary">
                    {resolved.length} chủ đề
                  </span>
                  {readCount > 0 && (
                    <>
                      <span className="h-3 w-px bg-border" aria-hidden="true" />
                      <span className="font-mono text-[11px] text-tertiary">
                        {readCount}/{resolved.length} đã đọc · {pct}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              <ArrowUpRight
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-tertiary transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </div>

            {/* Progress — monochrome hairline; only visible if any read */}
            {readCount > 0 && (
              <div
                className="mx-5 mb-4 h-[2px] overflow-hidden"
                style={{ background: "var(--bg-surface)", borderRadius: 999 }}
              >
                <div
                  className="h-full transition-[width] duration-300"
                  style={{
                    width: `${pct}%`,
                    background: "var(--text-secondary)",
                  }}
                />
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
