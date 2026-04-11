"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { TopicMeta } from "@/lib/types";
import { markTopicRead } from "@/lib/database";
import { topicList } from "@/topics/registry";
import Tag from "@/components/ui/Tag";
import BookmarkButton from "./BookmarkButton";
import RelatedTopics from "./RelatedTopics";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import TopicTOC from "./TopicTOC";

interface TopicLayoutProps {
  meta: TopicMeta;
  children: React.ReactNode;
}

// ─── Get prev/next topics in the same category ───
function getCategoryNeighbors(slug: string, category: string) {
  const categoryTopics = topicList.filter((t) => t.category === category);
  const idx = categoryTopics.findIndex((t) => t.slug === slug);
  return {
    prev: idx > 0 ? categoryTopics[idx - 1] : null,
    next: idx < categoryTopics.length - 1 ? categoryTopics[idx + 1] : null,
    current: idx + 1,
    total: categoryTopics.length,
  };
}

export default function TopicLayout({ meta, children }: TopicLayoutProps) {
  const router = useRouter();
  const hasMarkedRead = useRef(false);

  // ─── Fix #3: Mark read after 70% scroll, not on mount ───
  useEffect(() => {
    hasMarkedRead.current = false;

    function handleScroll() {
      if (hasMarkedRead.current) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = scrollTop / docHeight;
      if (pct >= 0.7) {
        markTopicRead(meta.slug);
        hasMarkedRead.current = true;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [meta.slug]);

  // ─── Fix #5: Smart back navigation ───
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  const { prev, next, current, total } = getCategoryNeighbors(meta.slug, meta.category);

  return (
    <>
      <ReadingProgressBar />
      <TopicTOC />

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="content-width px-5 py-10"
      >
        {/* Back + position indicator */}
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <span className="text-[11px] text-tertiary">
            {current}/{total} trong danh mục
          </span>
        </div>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {meta.title}
              </h1>
              <p className="text-lg text-muted">{meta.titleVi}</p>
            </div>
            <BookmarkButton slug={meta.slug} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Tag label={meta.difficulty} variant="difficulty" />
            <Tag label={meta.category} />
            <span className="flex items-center gap-1 text-xs text-tertiary">
              <Clock size={12} />
              ~3-5 phút
            </span>
          </div>
        </header>

        {/* Content */}
        <div>{children}</div>

        {/* Related Topics */}
        <RelatedTopics slugs={meta.relatedSlugs} />

        {/* ─── Fix #4: Next/Previous topic navigation ─── */}
        <nav className="mt-12 border-t border-border pt-8">
          <div className="grid grid-cols-2 gap-4">
            {prev ? (
              <Link
                href={`/topics/${prev.slug}`}
                className="group flex items-start gap-3 rounded-[16px] border border-border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-sm"
              >
                <ChevronLeft size={16} className="mt-0.5 text-tertiary group-hover:text-accent shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-tertiary uppercase tracking-wider">Bài trước</span>
                  <p className="text-sm font-medium text-foreground truncate mt-0.5">{prev.title}</p>
                  <p className="text-[11px] text-muted truncate">{prev.titleVi}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/topics/${next.slug}`}
                className="group flex items-start gap-3 rounded-[16px] border border-border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-sm text-right"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-tertiary uppercase tracking-wider">Bài tiếp theo</span>
                  <p className="text-sm font-medium text-foreground truncate mt-0.5">{next.title}</p>
                  <p className="text-[11px] text-muted truncate">{next.titleVi}</p>
                </div>
                <ChevronRight size={16} className="mt-0.5 text-tertiary group-hover:text-accent shrink-0" />
              </Link>
            ) : (
              <Link
                href="/"
                className="group flex items-center justify-center gap-2 rounded-[16px] border border-border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-sm"
              >
                <span className="text-sm font-medium text-muted group-hover:text-foreground">
                  Hoàn thành danh mục!
                </span>
                <ArrowRight size={14} className="text-tertiary group-hover:text-accent" />
              </Link>
            )}
          </div>
        </nav>

        {/* Scroll to top */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-xs text-tertiary hover:text-accent transition-colors"
          >
            ↑ Về đầu trang
          </button>
        </div>
      </motion.article>
    </>
  );
}
