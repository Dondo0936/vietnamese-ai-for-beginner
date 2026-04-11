"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain, BarChart3, Layers, MessageSquare, Eye, Search, Bot, Settings,
  Cpu, ImageIcon, Shield, Server, TrendingUp, BookOpen, Gamepad2,
  Briefcase, Calculator, ChevronDown, ChevronUp,
} from "lucide-react";
import type { TopicMeta, Category } from "@/lib/types";

const categoryIconMap: Record<string, React.ElementType> = {
  "neural-fundamentals": Brain,
  "classic-ml": BarChart3,
  "dl-architectures": Layers,
  "nlp": MessageSquare,
  "computer-vision": Eye,
  "search-retrieval": Search,
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

const categoryColorMap: Record<string, { bg: string; text: string; border: string }> = {
  "neural-fundamentals": { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800" },
  "classic-ml": { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  "dl-architectures": { bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-800" },
  "nlp": { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
  "computer-vision": { bg: "bg-cyan-50 dark:bg-cyan-950/30", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-800" },
  "search-retrieval": { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
  "llm-concepts": { bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-600 dark:text-pink-400", border: "border-pink-200 dark:border-pink-800" },
  "training-optimization": { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  "ai-agents": { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  "multimodal": { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800" },
  "ai-safety": { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
  "infrastructure": { bg: "bg-slate-50 dark:bg-slate-800/30", text: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-700" },
  "emerging": { bg: "bg-teal-50 dark:bg-teal-950/30", text: "text-teal-600 dark:text-teal-400", border: "border-teal-200 dark:border-teal-800" },
  "foundations": { bg: "bg-lime-50 dark:bg-lime-950/30", text: "text-lime-600 dark:text-lime-400", border: "border-lime-200 dark:border-lime-800" },
  "reinforcement-learning": { bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30", text: "text-fuchsia-600 dark:text-fuchsia-400", border: "border-fuchsia-200 dark:border-fuchsia-800" },
  "applied-ai": { bg: "bg-sky-50 dark:bg-sky-950/30", text: "text-sky-600 dark:text-sky-400", border: "border-sky-200 dark:border-sky-800" },
  "math-foundations": { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800" },
};

interface CategorySectionProps {
  categories: Category[];
  topicsByCategory: Record<string, TopicMeta[]>;
  readTopics?: string[];
}

export default function CategorySection({
  categories,
  topicsByCategory,
  readTopics = [],
}: CategorySectionProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {categories.map((cat) => {
        const topics = topicsByCategory[cat.slug];
        if (!topics || topics.length === 0) return null;

        const Icon = categoryIconMap[cat.slug] ?? BookOpen;
        const colors = categoryColorMap[cat.slug] ?? { bg: "bg-gray-50 dark:bg-gray-900/30", text: "text-gray-600 dark:text-gray-400", border: "border-gray-200 dark:border-gray-800" };
        const readCount = topics.filter((t) => readTopics.includes(t.slug)).length;
        const isExpanded = expanded === cat.slug;

        return (
          <div
            key={cat.slug}
            className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all`}
          >
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : cat.slug)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {cat.nameVi}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted">{topics.length} chủ đề</span>
                  {readCount > 0 && (
                    <span className="text-xs text-accent">{readCount} đã đọc</span>
                  )}
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp size={16} className="text-muted shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-muted shrink-0" />
              )}
            </button>

            {/* Progress bar */}
            {readCount > 0 && (
              <div className="px-4 pb-2">
                <div className="h-1 w-full rounded-full bg-border">
                  <div
                    className="h-1 rounded-full bg-accent transition-all"
                    style={{ width: `${(readCount / topics.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Expanded topic list */}
            {isExpanded && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {topics.map((topic) => {
                    const isRead = readTopics.includes(topic.slug);
                    return (
                      <Link
                        key={topic.slug}
                        href={`/topics/${topic.slug}`}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          isRead
                            ? "bg-accent/15 text-accent border border-accent/20"
                            : "bg-card border border-border text-muted hover:text-foreground hover:border-accent/40"
                        }`}
                      >
                        {topic.titleVi}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
