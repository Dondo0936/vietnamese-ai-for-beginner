"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Bookmark, BarChart3, Hash } from "lucide-react";
import { initSearch, searchTopics } from "@/lib/search";
import type { TopicMeta } from "@/lib/types";

interface CommandPaletteProps {
  topics: TopicMeta[];
}

const difficultyLabel: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};

export default function CommandPalette({ topics }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TopicMeta[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initSearch(topics);
  }, [topics]);

  // Global Cmd+K handler
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setActiveIndex(0);
    if (value.trim().length < 1) {
      setResults([]);
      return;
    }
    const found = searchTopics(value);
    setResults(found.slice(0, 8));
  }, []);

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const totalItems = results.length + quickActions.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex < results.length) {
        navigate(`/topics/${results[activeIndex].slug}`);
      } else {
        const actionIdx = activeIndex - results.length;
        navigate(quickActions[actionIdx].path);
      }
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const quickActions = [
    { label: "Trang chủ", path: "/", icon: Search },
    { label: "Đã lưu", path: "/bookmarks", icon: Bookmark },
    { label: "Tiến độ", path: "/progress", icon: BarChart3 },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] cmd-backdrop flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm chủ đề, danh mục..."
            className="flex-1 bg-transparent py-4 text-sm text-foreground placeholder:text-tertiary outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-tertiary">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length > 0 && (
            <div className="mb-2">
              <p className="px-2 py-1.5 text-[11px] font-medium text-tertiary uppercase tracking-wider">
                Chủ đề
              </p>
              {results.map((topic, i) => (
                <button
                  key={topic.slug}
                  data-index={i}
                  type="button"
                  onClick={() => navigate(`/topics/${topic.slug}`)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    i === activeIndex ? "bg-accent-light text-foreground" : "text-foreground hover:bg-surface"
                  }`}
                >
                  <Hash size={14} className="text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{topic.title}</span>
                    <span className="ml-2 text-xs text-muted">{topic.titleVi}</span>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    topic.difficulty === "beginner" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : topic.difficulty === "intermediate" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {difficultyLabel[topic.difficulty]}
                  </span>
                  <ArrowRight size={14} className="text-tertiary shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div>
            <p className="px-2 py-1.5 text-[11px] font-medium text-tertiary uppercase tracking-wider">
              Điều hướng
            </p>
            {quickActions.map((action, i) => {
              const idx = results.length + i;
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  data-index={idx}
                  type="button"
                  onClick={() => navigate(action.path)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    idx === activeIndex ? "bg-accent-light text-foreground" : "text-foreground hover:bg-surface"
                  }`}
                >
                  <Icon size={14} className="text-muted" />
                  <span className="text-sm">{action.label}</span>
                  <ArrowRight size={14} className="ml-auto text-tertiary" />
                </button>
              );
            })}
          </div>

          {/* No results */}
          {query.length > 0 && results.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted">
              Không tìm thấy &quot;{query}&quot;
            </p>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5">
          <span className="flex items-center gap-1 text-[11px] text-tertiary">
            <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono text-[10px]">↑↓</kbd> di chuyển
          </span>
          <span className="flex items-center gap-1 text-[11px] text-tertiary">
            <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono text-[10px]">↵</kbd> chọn
          </span>
          <span className="flex items-center gap-1 text-[11px] text-tertiary">
            <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono text-[10px]">esc</kbd> đóng
          </span>
        </div>
      </div>
    </div>
  );
}
