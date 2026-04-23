"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { TopicMeta, TocSection } from "@/lib/types";
import { markTopicRead } from "@/lib/database";
import { topicList, topicMap } from "@/topics/registry";
import {
  getPathNeighbors,
  isAdultPathId,
  type AdultPathId,
  type PathNeighbors,
} from "@/lib/paths";
import BookmarkButton from "./BookmarkButton";
import RelatedTopics from "./RelatedTopics";
import ReadingProgressBar from "@/components/ui/ReadingProgressBar";
import TopicTOC, { DEFAULT_TOC_SECTIONS } from "./TopicTOC";
import { SectionDuplicateGuard } from "./SectionDuplicateGuard";
import "./topic-layout.css";

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

  // Mark read after 70% scroll — contract-enforced behavior, do not change.
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

  // Related topic objects (resolved + filtered) for the right-rail block.
  const relatedTopicObjects = useMemo(
    () => meta.relatedSlugs.map((s) => topicMap[s]).filter(Boolean).slice(0, 4),
    [meta.relatedSlugs]
  );

  return (
    <>
      <ReadingProgressBar />
      {/* Floating/mobile TOC stays for lg (1024–1279) + mobile.
          On xl (1280+), the inline left-rail TOC below takes over
          and TopicTOC's desktop variant is hidden via its own class. */}
      <TopicTOC sections={tocSections} />

      <div className="tp-page">
        <div className="tp-layout">
          {/* Left rail — xl+ only */}
          <aside className="tp-rail">
            <div className="tp-rail__sticky">
              <h4 className="tp-rail__head">Trong bài này</h4>
              <InlineToc sections={tocSections} reduceMotion={reduceMotion ?? false} />
              {nav.kind === "path" && (
                <div className="tp-rail__meta">
                  <div>
                    <span>Bài</span>
                    <b>
                      {nav.path.current}/{nav.path.total}
                    </b>
                  </div>
                  {nav.path.currentStageTitle && (
                    <div>
                      <span>Chương</span>
                      <b>{nav.path.currentStageTitle}</b>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Main column */}
          <motion.article
            className="tp-main"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
          >
            {/* Back + position */}
            <div className="tp-back">
              <Link href={backHref}>
                <ArrowLeft size={14} className="shrink-0" />
                <span>{backLabel}</span>
              </Link>
              <span className="tp-back__pos">
                {nav.kind === "path" ? (
                  <>
                    Bài {nav.path.current}/{nav.path.total}
                  </>
                ) : (
                  <>
                    {nav.current}/{nav.total} trong danh mục
                  </>
                )}
              </span>
            </div>

            {/* Hero */}
            <header className="tp-hero">
              <div className="tp-eyebrow">
                <span className="tp-dot" />
                <span>{meta.category}</span>
                {nav.kind === "path" && nav.path.currentStageTitle && (
                  <>
                    <span>·</span>
                    <span>{nav.path.currentStageTitle}</span>
                  </>
                )}
              </div>
              <div className="tp-hero__row">
                <h1 className="tp-h1">{meta.title}</h1>
                <BookmarkButton slug={meta.slug} />
              </div>
              <p className="tp-sub">{meta.titleVi}</p>
              <div className="tp-hero__meta">
                <div className="tp-hero__facts">
                  <div>
                    <span>Độ khó</span>
                    <b>{meta.difficulty}</b>
                  </div>
                  {nav.kind === "path" && (
                    <div>
                      <span>Lộ trình</span>
                      <b>{nav.path.nameVi}</b>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Body — unchanged */}
            <SectionDuplicateGuard>
              <div>{children}</div>
            </SectionDuplicateGuard>

            {/* Forward link to application topic — shown AFTER reading the concept */}
            {applicationTopic?.featuredApp && (
              <nav aria-label="Liên kết với bài ứng dụng" className="tp-app">
                <Link href={neighborHref(applicationTopic.slug)}>
                  Xem ứng dụng thực tế: cách{" "}
                  <strong>{applicationTopic.featuredApp.name}</strong> dùng{" "}
                  {meta.titleVi} →
                </Link>
              </nav>
            )}

            {/* Mark as complete */}
            <div className="tp-complete">
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
              >
                <CheckCircle2 size={16} />
                {manuallyMarked ? "Đã đánh dấu hoàn thành" : "Đánh dấu đã đọc"}
              </button>
            </div>

            {/* Related topics — existing flat chip list below main content */}
            <RelatedTopics slugs={meta.relatedSlugs} />

            {/* Pager — prev / chapter / next */}
            <nav className="tp-pager">
              {nav.prev ? (
                <Link href={neighborHref(nav.prev.slug)} className="tp-pager__prev">
                  <span>← Bài trước</span>
                  <b>{nav.prev.title}</b>
                  <p>{nav.prev.titleVi}</p>
                </Link>
              ) : (
                <div />
              )}

              {nav.kind === "path" && nav.path.currentStageTitle ? (
                <div className="tp-pager__ch">
                  <span>Chương</span>
                  <b>{nav.path.currentStageTitle}</b>
                </div>
              ) : (
                <div className="tp-pager__ch">
                  <span>Danh mục</span>
                  <b>{meta.category}</b>
                </div>
              )}

              {nav.next ? (
                <Link href={neighborHref(nav.next.slug)} className="tp-pager__next">
                  <span>Bài tiếp →</span>
                  <b>{nav.next.title}</b>
                  <p>{nav.next.titleVi}</p>
                </Link>
              ) : (
                <Link href={backHref} className="tp-pager__done">
                  <span>Hoàn thành</span>
                  <b>
                    {nav.kind === "path"
                      ? `Hoàn thành lộ trình ${nav.path.nameVi}!`
                      : "Hoàn thành danh mục!"}{" "}
                    <ArrowRight size={14} className="inline" />
                  </b>
                </Link>
              )}
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

          {/* Right rail — xl+ only */}
          <aside className="tp-side">
            <div className="tp-side__sticky">
              {relatedTopicObjects.length > 0 && (
                <div className="tp-side__block">
                  <h4>Bài liên quan</h4>
                  {relatedTopicObjects.map((topic) => (
                    <Link key={topic.slug} href={neighborHref(topic.slug)} className="tp-rel">
                      <span>#{topic.category}</span>
                      <b>{topic.titleVi}</b>
                      <span className="tp-rel__meta">{topic.difficulty}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

// ─── Inline TOC used inside the left rail on xl+ ───
function InlineToc({
  sections,
  reduceMotion,
}: {
  sections: TocSection[];
  reduceMotion: boolean;
}) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (sections.length === 0) return;
    // Guard for test / SSR environments that don't ship IntersectionObserver.
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    const outstanding = new Set<string>(sections.map((s) => s.id));
    function attachFound() {
      for (const id of Array.from(outstanding)) {
        const el = document.getElementById(id);
        if (el) {
          observer.observe(el);
          outstanding.delete(id);
        }
      }
    }
    attachFound();

    let mo: MutationObserver | null = null;
    let giveUpTimer: ReturnType<typeof setTimeout> | null = null;
    if (outstanding.size > 0) {
      mo = new MutationObserver(() => {
        attachFound();
        if (outstanding.size === 0 && mo) {
          mo.disconnect();
          mo = null;
          if (giveUpTimer) clearTimeout(giveUpTimer);
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
      giveUpTimer = setTimeout(() => {
        if (mo) {
          mo.disconnect();
          mo = null;
        }
      }, 3000);
    }

    return () => {
      observer.disconnect();
      if (mo) mo.disconnect();
      if (giveUpTimer) clearTimeout(giveUpTimer);
    };
  }, [sections]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${id}`);
      }
    }
  }

  if (sections.length === 0) return null;

  return (
    <ol className="tp-toc">
      {sections.map((s, i) => {
        const isActive = active === s.id;
        return (
          <li
            key={s.id}
            className={isActive ? "tp-toc__i is-current" : "tp-toc__i"}
          >
            <span className="tp-toc__n">{String(i + 1).padStart(2, "0")}</span>
            <button
              type="button"
              className="tp-toc__t"
              onClick={() => scrollTo(s.id)}
            >
              {s.labelVi}
            </button>
            {isActive && <span className="tp-toc__cur" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
