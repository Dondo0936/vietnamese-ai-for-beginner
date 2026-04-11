"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { initSearch, searchTopics } from "@/lib/search";
import type { TopicMeta } from "@/lib/types";

interface SearchBarProps {
  topics: TopicMeta[];
}

export default function SearchBar({ topics }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TopicMeta[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initSearch(topics);
  }, [topics]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const found = searchTopics(value);
    setResults(found.slice(0, 6));
    setIsOpen(true);
    setActiveIndex(-1);
  }, []);

  function navigate(slug: string) {
    setIsOpen(false);
    setQuery("");
    router.push(`/topics/${slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigate(results[activeIndex].slug);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Tìm kiếm chủ đề..."
          className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
        />
      </div>

      {isOpen && (
        results.length > 0 ? (
          <ul className="absolute z-40 mt-1.5 w-full rounded-lg border border-border bg-white shadow-lg overflow-hidden">
            {results.map((topic, i) => (
              <li key={topic.slug}>
                <button
                  type="button"
                  onClick={() => navigate(topic.slug)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 transition-colors ${
                    i === activeIndex ? "bg-accent-light" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">
                    {topic.title}
                  </span>
                  <span className="text-xs text-muted">{topic.titleVi}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="absolute z-40 mt-1.5 w-full rounded-lg border border-border bg-white shadow-lg px-4 py-3 text-sm text-muted">
            Không tìm thấy kết quả
          </div>
        )
      )}
    </div>
  );
}
