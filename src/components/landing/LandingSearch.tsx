"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { initSearch, searchTopics } from "@/lib/search";
import type { TopicMeta } from "@/lib/types";

/**
 * Landing search — same typeahead behavior as the in-app SearchBar, in
 * the landing's visual chrome (big centered box + ⌘K hint + chips).
 *
 * Behavior matches `src/components/layout/SearchBar.tsx`:
 * - ⌘K / Ctrl+K focuses the input globally
 * - Typing ≥2 chars opens a listbox of topic results from the Fuse.js
 *   index (`/lib/search.ts` — shared with the in-app search)
 * - Arrow Up/Down navigates results; Enter selects; Esc closes
 * - Clicking a result routes to `/topics/<slug>`
 *
 * Suggestion chips below the input still deep-link to specific topics
 * so a curious learner can skip typing and jump straight in.
 */

type Chip = { label: string; href: string };

const CHIPS: Chip[] = [
  { label: "attention", href: "/topics/attention-mechanism" },
  { label: "RAG", href: "/topics/rag" },
  { label: "fine-tuning", href: "/topics/fine-tuning" },
  { label: "bias-variance", href: "/topics/bias-variance" },
  { label: "LoRA", href: "/topics/lora" },
  { label: "reasoning models", href: "/topics/reasoning-models" },
  { label: "MoE", href: "/topics/moe" },
  { label: "KV cache", href: "/topics/kv-cache" },
  { label: "constitutional AI", href: "/topics/constitutional-ai" },
  { label: "diffusion", href: "/topics/diffusion-models" },
  { label: "MLOps", href: "/topics/mlops" },
];

interface LandingSearchProps {
  topics: TopicMeta[];
}

export function LandingSearch({ topics }: LandingSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TopicMeta[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
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

  const navigate = useCallback(
    (slug: string) => {
      setIsOpen(false);
      setQuery("");
      router.push(`/topics/${slug}`);
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter" && query.trim().length >= 2) {
        // Fallback: no hits but user hit Enter — send them to the
        // catalog with their query so the browse-side filter picks up.
        e.preventDefault();
        router.push(`/browse?q=${encodeURIComponent(query.trim())}`);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = activeIndex >= 0 ? activeIndex : 0;
      navigate(results[idx].slug);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <section className="ld-search" id="search">
      <div className="ld-search__eyebrow">
        ✳ 260 chủ đề · 4 lộ trình · tiếng Việt · mã nguồn mở
      </div>
      <h2 className="ld-search__h">
        Hỏi bất cứ gì<br />về <em>AI.</em>
      </h2>

      <div ref={containerRef} className="ld-search__wrap">
        <div className="ld-search__box">
          <Search size={20} strokeWidth={1.8} className="ld-search__icon" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Tìm chủ đề"
            aria-expanded={isOpen}
            aria-controls="ld-search-results"
            aria-activedescendant={
              activeIndex >= 0 ? `ld-search-result-${activeIndex}` : undefined
            }
            autoComplete="off"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="ld-search__input"
            placeholder="Tìm chủ đề — RAG, transformer, gradient descent…"
          />
          <span className="ld-search__kbd" aria-hidden="true">
            ⌘ K
          </span>
        </div>

        {isOpen && (
          <div className="ld-search__dropdown">
            {results.length > 0 ? (
              <ul
                id="ld-search-results"
                role="listbox"
                className="ld-search__results"
              >
                {results.map((topic, i) => (
                  <li
                    key={topic.slug}
                    id={`ld-search-result-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(topic.slug)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`ld-search__result${
                        i === activeIndex ? " ld-search__result--active" : ""
                      }`}
                    >
                      <span className="ld-search__result-title">
                        {topic.titleVi || topic.title}
                      </span>
                      <span className="ld-search__result-sub">
                        {topic.title}
                        {topic.category ? ` · ${topic.category}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="ld-search__empty">
                Không tìm thấy chủ đề khớp.{" "}
                <Link
                  href={`/browse?q=${encodeURIComponent(query)}`}
                  className="ld-search__empty-link"
                >
                  Xem tất cả ở /browse →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ld-search__chips" data-testid="landing-search-chips">
        <span className="ld-chip-label">Gợi ý:</span>
        {CHIPS.map((c) => (
          <Link key={c.label} href={c.href} className="ld-chip" data-chip>
            {c.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
