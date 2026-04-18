"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { TopicMeta } from "@/lib/types";
import { markTopicRead } from "@/lib/database";
import { topicList, topicMap } from "@/topics/registry";
import {
  getPathNeighbors,
  isAdultPathId,
  type AdultPathId,
  type PathNeighbors,
} from "@/lib/paths";
import Tag from "@/components/ui/Tag";
import BookmarkButton from "./BookmarkButton";
import RelatedTopics from "./RelatedTopics";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import TopicTOC, { DEFAULT_TOC_SECTIONS } from "./TopicTOC";
import { SectionDuplicateGuard } from "./SectionDuplicateGuard";

interface TopicLayoutProps {
  meta: TopicMeta;
  children: React.ReactNode;
}

// ─── Category-based neighbors (fallback when ?path= is absent or invalid) ───
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

type NeighborDisplay = {
  slug: string;
  title: string;
  titleVi: string;
};

type ResolvedNav =
  | {
      kind: "path";
      path: PathNeighbors;
      prev: NeighborDisplay | null;
      next: NeighborDisplay | null;
    }
  | {
      kind: "category";
      category: string;
      prev: NeighborDisplay | null;
      next: NeighborDisplay | null;
      current: number;
      total: number;
    };

function toDisplay(slug: string): NeighborDisplay | null {
  const topic = topicMap[slug];
  if (!topic) return null;
  return { slug, title: topic.title, titleVi: topic.titleVi };
}

export default function TopicLayout({ meta, children }: TopicLayoutProps) {
  // Read ?path= from the URL *after* hydration so this component doesn't
  // suspend during SSR/SSG. Using useSearchParams() here would trigger a
  // client-side bailout (BAILOUT_TO_CLIENT_SIDE_RENDERING) on every statically
  // prerendered topic page, causing the skeleton fallback to be shipped as
  // the initial HTML and leaving crawlers/SEO with no Vietnamese prose.
  const [pathId, setPathId] = useState<AdultPathId | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("path");
    setPathId(isAdultPathId(raw) ? raw : null);
  }, []);
  const reduceMotion = useReducedMotion();

  const hasMarkedRead = useRef(false);
  const [manuallyMarked, setManuallyMarked] = useState(false);

  // Mark read after 70% scroll (unchanged from previous behavior)
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
        setManuallyMarked(true);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [meta.slug]);

  // Resolve navigation context — path-aware when a valid ?path= is set and
  // this slug exists in that path; otherwise fall back to category.
  const nav: ResolvedNav = useMemo(() => {
    const pathNeighbors = pathId ? getPathNeighbors(pathId, meta.slug) : null;
    if (pathNeighbors) {
      return {
        kind: "path",
        path: pathNeighbors,
        prev: pathNeighbors.prev ? toDisplay(pathNeighbors.prev.slug) : null,
        next: pathNeighbors.next ? toDisplay(pathNeighbors.next.slug) : null,
      };
    }
    const catNeighbors = getCategoryNeighbors(meta.slug, meta.category);
    return {
      kind: "category",
      category: meta.category,
      prev: catNeighbors.prev
        ? { slug: catNeighbors.prev.slug, title: catNeighbors.prev.title, titleVi: catNeighbors.prev.titleVi }
        : null,
      next: catNeighbors.next
        ? { slug: catNeighbors.next.slug, title: catNeighbors.next.title, titleVi: catNeighbors.next.titleVi }
        : null,
      current: catNeighbors.current,
      total: catNeighbors.total,
    };
  }, [pathId, meta.slug, meta.category]);

  // Build the href for a neighbor topic — when on a path, preserve ?path=
  function neighborHref(slug: string): string {
    if (nav.kind === "path") {
      return `/topics/${slug}?path=${nav.path.pathId}`;
    }
    return `/topics/${slug}`;
  }

  // Back destination — path page when on path, home otherwise
  const backHref = nav.kind === "path" ? `/paths/${nav.path.pathId}` : "/";
  const backLabel =
    nav.kind === "path" ? `Quay lại lộ trình ${nav.path.nameVi}` : "Quay lại trang chủ";

  const applicationTopic = useMemo(() => {
    if (meta.applicationOf) return null;
    return topicList.find((t) => t.applicationOf === meta.slug) ?? null;
  }, [meta.slug, meta.applicationOf]);

  const tocSections = meta.tocSections ?? DEFAULT_TOC_SECTIONS;

  return (
    <>
      <ReadingProgressBar />
      <TopicTOC sections={tocSections} />

      <motion.article
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
        className="content-width px-5 sm:px-8 py-10"
      >
        {/* Back + position indicator */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent min-w-0"
          >
            <ArrowLeft size={16} className="shrink-0" />
            <span className="truncate">{backLabel}</span>
          </Link>
          <span className="text-[11px] text-tertiary shrink-0 text-right">
            {nav.kind === "path" ? (
              <>
                Bài {nav.path.current}/{nav.path.total}
                <span className="hidden sm:inline"> — {nav.path.currentStageTitle}</span>
              </>
            ) : (
              <>
                {nav.current}/{nav.total} trong danh mục
              </>
            )}
          </span>
        </div>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-display text-[40px] font-medium tracking-[-0.035em] leading-[1.05] text-foreground">
                {meta.title}
              </h1>
              <p className="text-lg text-muted tracking-[-0.01em]">{meta.titleVi}</p>
            </div>
            <BookmarkButton slug={meta.slug} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Tag label={meta.difficulty} variant="difficulty" />
            <Tag label={meta.category} />
            {nav.kind === "path" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/5 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                Lộ trình: {nav.path.nameVi}
              </span>
            )}
          </div>
        </header>

        {/* Forward link to application topic */}
        {applicationTopic?.featuredApp && (
          <nav
            aria-label="Liên kết với bài ứng dụng"
            className="mb-8 rounded-md border border-accent/20 bg-accent/5 px-4 py-3 text-sm"
          >
            <Link
              href={neighborHref(applicationTopic.slug)}
              className="text-link hover:underline"
            >
              Xem ứng dụng thực tế: cách{" "}
              <strong>{applicationTopic.featuredApp.name}</strong> dùng{" "}
              {meta.titleVi} →
            </Link>
          </nav>
        )}

        {/* Content */}
        <SectionDuplicateGuard>
          <div>{children}</div>
        </SectionDuplicateGuard>

        {/* Mark as complete */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            aria-label="Đánh dấu đã đọc"
            disabled={manuallyMarked}
            onClick={() => {
              if (hasMarkedRead.current) {
                setManuallyMarked(true);
                return;
              }
              markTopicRead(meta.slug);
              hasMarkedRead.current = true;
              setManuallyMarked(true);
            }}
            className={`inline-flex items-center gap-2 rounded-[var(--r-pill)] border px-5 py-2.5 text-sm font-medium transition-all ${
              manuallyMarked
                ? "border-accent/30 bg-accent/10 text-accent cursor-default"
                : "border-border bg-card/50 text-muted hover:text-foreground hover:bg-card hover:shadow-sm"
            }`}
          >
            <CheckCircle2 size={16} />
            {manuallyMarked ? "Đã đánh dấu hoàn thành" : "Đánh dấu đã đọc"}
          </button>
        </div>

        {/* Related Topics */}
        <RelatedTopics slugs={meta.relatedSlugs} />

        {/* Next/Previous topic navigation */}
        <nav className="mt-12 border-t border-border pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nav.prev ? (
              <Link
                href={neighborHref(nav.prev.slug)}
                className="group flex items-start gap-3 rounded-[var(--r-lg)] border border-border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-sm"
              >
                <ChevronLeft size={16} className="mt-0.5 text-tertiary group-hover:text-accent shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-tertiary uppercase tracking-wider">Bài trước</span>
                  <p className="text-sm font-medium text-foreground mt-0.5 break-words leading-snug">{nav.prev.title}</p>
                  <p className="text-[11px] text-muted break-words leading-snug">{nav.prev.titleVi}</p>
                </div>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}

            {nav.next ? (
              <Link
                href={neighborHref(nav.next.slug)}
                className="group flex items-start gap-3 rounded-[var(--r-lg)] border border-border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-sm text-right"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-tertiary uppercase tracking-wider">Bài tiếp theo</span>
                  <p className="text-sm font-medium text-foreground mt-0.5 break-words leading-snug">{nav.next.title}</p>
                  <p className="text-[11px] text-muted break-words leading-snug">{nav.next.titleVi}</p>
                </div>
                <ChevronRight size={16} className="mt-0.5 text-tertiary group-hover:text-accent shrink-0" />
              </Link>
            ) : (
              <Link
                href={backHref}
                className="group flex items-center justify-center gap-2 rounded-[var(--r-lg)] border border-border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-sm"
              >
                <span className="text-sm font-medium text-muted group-hover:text-foreground">
                  {nav.kind === "path" ? `Hoàn thành lộ trình ${nav.path.nameVi}!` : "Hoàn thành danh mục!"}
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
