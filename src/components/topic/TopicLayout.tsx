"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { TopicMeta } from "@/lib/types";
import { markTopicRead } from "@/lib/database";
import Tag from "@/components/ui/Tag";
import BookmarkButton from "./BookmarkButton";
import RelatedTopics from "./RelatedTopics";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import TopicTOC from "./TopicTOC";

interface TopicLayoutProps {
  meta: TopicMeta;
  children: React.ReactNode;
}

function estimateReadingTime(difficulty: string): string {
  switch (difficulty) {
    case "beginner": return "2-3";
    case "intermediate": return "4-5";
    case "advanced": return "6-8";
    default: return "3-5";
  }
}

export default function TopicLayout({ meta, children }: TopicLayoutProps) {
  useEffect(() => {
    markTopicRead(meta.slug);
  }, [meta.slug]);

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
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>

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
              ~{estimateReadingTime(meta.difficulty)} phút
            </span>
          </div>
        </header>

        {/* Content */}
        <div>{children}</div>

        {/* Related Topics */}
        <RelatedTopics slugs={meta.relatedSlugs} />

        {/* Scroll to top */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            ↑ Về đầu trang
          </button>
        </div>
      </motion.article>
    </>
  );
}
