"use client";

import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  Code2,
  FlaskConical,
  Sparkles,
  Rocket,
  ArrowRight,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import { PATHS, type AdultPathId } from "@/lib/paths";

function slugsForPath(id: AdultPathId): string[] {
  return PATHS[id].stages.flatMap((s) => s.slugs);
}

/* ─── Profession definitions ─── */

export interface Profession {
  id: string;
  nameVi: string;
  descriptionVi: string;
  icon: React.ElementType;
  topicSlugs: string[];
  /** Override for the link target. Defaults to /paths/:id if not set. */
  href?: string;
}

export const professions: Profession[] = [
  {
    id: "student",
    nameVi: "Học sinh · Sinh viên",
    descriptionVi: "Nền tảng AI/ML từ con số 0 — toán, thuật toán cổ điển, mạng nơ-ron cơ bản",
    icon: GraduationCap,
    topicSlugs: slugsForPath("student"),
  },
  {
    id: "office",
    nameVi: "Nhân viên văn phòng",
    descriptionVi: "Hiểu AI để ứng dụng trong công việc — prompt, RAG, agent, an toàn AI",
    icon: Briefcase,
    topicSlugs: slugsForPath("office"),
  },
  {
    id: "ai-engineer",
    nameVi: "AI Engineer",
    descriptionVi: "Xây dựng & triển khai hệ thống AI — fine-tuning, RAG, serving, MLOps",
    icon: Code2,
    topicSlugs: slugsForPath("ai-engineer"),
  },
  {
    id: "ai-researcher",
    nameVi: "AI Researcher",
    descriptionVi: "Lý thuyết sâu & xu hướng mới — scaling laws, alignment, kiến trúc tiên tiến",
    icon: FlaskConical,
    topicSlugs: slugsForPath("ai-researcher"),
  },
  {
    id: "kids-nhi",
    nameVi: "Bé làm quen với AI (6–10 tuổi)",
    descriptionVi: "18 bài vui vẻ — hình ảnh, kéo thả, có audio. Không cần biết đọc nhiều.",
    icon: Sparkles,
    topicSlugs: [],
    href: "/kids/nhi",
  },
  {
    id: "kids-teen",
    nameVi: "Teen tự làm dự án AI (11–15 tuổi)",
    descriptionVi: "30 bài — train mô hình nhỏ, hiểu AI tạo sinh, sẵn sàng cho lộ trình Học sinh.",
    icon: Rocket,
    topicSlugs: [],
    href: "/kids/teen",
  },
];

/* ─── Component ─── */

interface ProfessionPathsProps {
  topics: TopicMeta[];
  readTopics?: string[];
}

export default function ProfessionPaths({
  topics,
  readTopics = [],
}: ProfessionPathsProps) {
  const topicMap = new Map(topics.map((t) => [t.slug, t]));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {professions.map((prof) => {
        const resolved = prof.topicSlugs
          .map((s) => topicMap.get(s))
          .filter((t): t is TopicMeta => t !== undefined);
        const readCount = resolved.filter((t) =>
          readTopics.includes(t.slug)
        ).length;
        const Icon = prof.icon;
        const pct = resolved.length > 0 ? Math.round((readCount / resolved.length) * 100) : 0;

        return (
          <Link
            key={prof.id}
            href={prof.href ?? `/paths/${prof.id}`}
            className="group rounded-[16px] border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all hover:bg-card hover:shadow-sm hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-muted group-hover:text-accent transition-colors">
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-semibold text-foreground truncate leading-snug group-hover:text-accent transition-colors">
                  {prof.nameVi}
                </h3>
                <p className="text-[11px] text-tertiary mt-0.5 line-clamp-1">
                  {prof.descriptionVi}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-tertiary">
                  {resolved.length} chủ đề
                </span>
                <ArrowRight size={14} className="text-tertiary group-hover:text-accent transition-colors" />
              </div>
            </div>

            {/* Progress */}
            {readCount > 0 && (
              <div className="px-4 pb-3">
                <div className="h-[3px] w-full rounded-full bg-surface">
                  <div
                    className="h-[3px] rounded-full bg-accent transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-tertiary mt-1">
                  {readCount}/{resolved.length} đã đọc ({pct}%)
                </p>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
