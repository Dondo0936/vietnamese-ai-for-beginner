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
        const readCount = topics.filter((t) => readTopics.includes(t.slug)).length;
        const isExpanded = expanded === cat.slug;

        return (
          <div
            key={cat.slug}
            className="rounded-[16px] border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all hover:bg-card hover:shadow-sm"
          >
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : cat.slug)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-muted">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-semibold text-foreground truncate leading-snug">
                  {cat.nameVi}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-tertiary">{topics.length} chủ đề</span>
                  {readCount > 0 && (
                    <span className="text-[11px] text-accent">{readCount} đã đọc</span>
                  )}
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp size={14} className="text-tertiary shrink-0" />
              ) : (
                <ChevronDown size={14} className="text-tertiary shrink-0" />
              )}
            </button>

            {/* Progress bar */}
            {readCount > 0 && (
              <div className="px-4 pb-2">
                <div className="h-[3px] w-full rounded-full bg-surface">
                  <div
                    className="h-[3px] rounded-full bg-accent transition-all"
                    style={{ width: `${(readCount / topics.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Expanded topic list */}
            {isExpanded && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {topics.map((topic) => {
                    const isRead = readTopics.includes(topic.slug);
                    return (
                      <Link
                        key={topic.slug}
                        href={`/topics/${topic.slug}`}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          isRead
                            ? "bg-accent/10 text-accent"
                            : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
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
