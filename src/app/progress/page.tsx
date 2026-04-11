"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3, BookOpen, Bookmark, Trophy, Clock, ArrowRight,
  Brain, BarChart2, Layers, MessageSquare, Eye, Search as SearchIcon,
  Bot, Settings, Cpu, ImageIcon, Shield, Server, TrendingUp,
  Gamepad2, Briefcase, Calculator,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getUserProgress } from "@/lib/database";
import { topicList, categories } from "@/topics/registry";
import type { TopicMeta } from "@/lib/types";

const categoryIcons: Record<string, React.ElementType> = {
  "neural-fundamentals": Brain,
  "classic-ml": BarChart2,
  "dl-architectures": Layers,
  "nlp": MessageSquare,
  "computer-vision": Eye,
  "search-retrieval": SearchIcon,
  "llm-concepts": Bot,
  "training-optimization": Settings,
  "ai-agents": Cpu,
  "multimodal": ImageIcon,
  "ai-safety": Shield,
  "infrastructure": Server,
  "emerging": TrendingUp,
  "foundations": BookOpen,
  "reinforcement-learning": Gamepad2,
  "applied-ai": Briefcase,
  "math-foundations": Calculator,
};

export default function ProgressPage() {
  const [readTopics, setReadTopics] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [lastVisited, setLastVisited] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserProgress().then((progress) => {
      setReadTopics(progress.readTopics);
      setBookmarks(progress.bookmarks);
      setLastVisited(progress.lastVisited);
      setLoading(false);
    });
  }, []);

  const totalTopics = topicList.length;
  const readCount = readTopics.length;
  const pct = totalTopics > 0 ? Math.round((readCount / totalTopics) * 100) : 0;

  const categoryStats = useMemo(() => {
    const stats: { cat: (typeof categories)[0]; total: number; read: number }[] = [];
    for (const cat of categories) {
      const catTopics = topicList.filter((t) => t.category === cat.slug);
      const catRead = catTopics.filter((t) => readTopics.includes(t.slug)).length;
      stats.push({ cat, total: catTopics.length, read: catRead });
    }
    return stats.sort((a, b) => {
      const aPct = a.total > 0 ? a.read / a.total : 0;
      const bPct = b.total > 0 ? b.read / b.total : 0;
      return bPct - aPct;
    });
  }, [readTopics]);

  const difficultyStats = useMemo(() => {
    const levels = ["beginner", "intermediate", "advanced"] as const;
    return levels.map((d) => {
      const total = topicList.filter((t) => t.difficulty === d).length;
      const read = topicList.filter((t) => t.difficulty === d && readTopics.includes(t.slug)).length;
      return { difficulty: d, total, read };
    });
  }, [readTopics]);

  const lastTopic = lastVisited ? topicList.find((t) => t.slug === lastVisited) : null;

  const recentlyRead = useMemo(() => {
    return readTopics
      .slice(-5)
      .reverse()
      .map((slug) => topicList.find((t) => t.slug === slug))
      .filter((t): t is TopicMeta => t !== undefined);
  }, [readTopics]);

  const difficultyLabel: Record<string, string> = {
    beginner: "Cơ bản",
    intermediate: "Trung bình",
    advanced: "Nâng cao",
  };

  const difficultyColor: Record<string, string> = {
    beginner: "bg-green-500",
    intermediate: "bg-amber-500",
    advanced: "bg-red-500",
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
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Tiến độ học tập</h1>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <BookOpen size={20} className="mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold text-foreground">{readCount}</div>
            <div className="text-xs text-muted">Đã đọc</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Trophy size={20} className="mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold text-foreground">{pct}%</div>
            <div className="text-xs text-muted">Hoàn thành</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Bookmark size={20} className="mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold text-foreground">{bookmarks.length}</div>
            <div className="text-xs text-muted">Đã lưu</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Clock size={20} className="mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold text-foreground">{totalTopics - readCount}</div>
            <div className="text-xs text-muted">Còn lại</div>
          </div>
        </div>

        {/* Overall progress */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Tổng tiến độ</span>
            <span className="text-sm font-bold text-accent">{pct}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-surface">
            <div className="h-3 rounded-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex items-center gap-4">
            {difficultyStats.map((d) => (
              <div key={d.difficulty} className="flex items-center gap-1.5 text-xs text-muted">
                <div className={`h-2 w-2 rounded-full ${difficultyColor[d.difficulty]}`} />
                {difficultyLabel[d.difficulty]}: {d.read}/{d.total}
              </div>
            ))}
          </div>
        </div>

        {/* Continue learning */}
        {lastTopic && (
          <div className="rounded-xl border border-accent/20 bg-accent-light p-4 mb-8">
            <span className="text-xs font-medium text-accent mb-2 block">Tiếp tục học</span>
            <Link href={`/topics/${lastTopic.slug}`} className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-foreground">{lastTopic.title}</span>
                <span className="ml-2 text-xs text-muted">{lastTopic.titleVi}</span>
              </div>
              <ArrowRight size={16} className="text-accent shrink-0" />
            </Link>
          </div>
        )}

        {/* Recently read */}
        {recentlyRead.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-foreground mb-3">Đọc gần đây</h2>
            <div className="space-y-2">
              {recentlyRead.map((topic) => (
                <Link key={topic.slug} href={`/topics/${topic.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-accent/30">
                  <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
                  <span className="text-sm text-foreground">{topic.title}</span>
                  <span className="text-xs text-muted">{topic.titleVi}</span>
                  <ArrowRight size={14} className="ml-auto text-muted shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Category breakdown */}
        <h2 className="text-base font-semibold text-foreground mb-3">Theo danh mục</h2>
        <div className="space-y-2">
          {categoryStats.map(({ cat, total, read }) => {
            const catPct = total > 0 ? Math.round((read / total) * 100) : 0;
            const Icon = categoryIcons[cat.slug] ?? BookOpen;
            return (
              <div key={cat.slug} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-muted shrink-0" />
                  <span className="flex-1 text-sm font-medium text-foreground truncate">{cat.nameVi}</span>
                  <span className="text-xs text-muted shrink-0">{read}/{total}</span>
                  <span className="text-xs font-medium text-accent shrink-0 w-10 text-right">{catPct}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-surface">
                  <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${catPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
