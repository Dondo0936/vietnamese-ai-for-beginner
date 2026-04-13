"use client";

import { useEffect, useState } from "react";
import { Eye, BookOpen, List } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { TocSection, TocSectionId } from "@/lib/types";

const ICONS: Record<TocSectionId, typeof Eye> = {
  visualization: Eye,
  explanation: BookOpen,
};

export const DEFAULT_TOC_SECTIONS: TocSection[] = [
  { id: "visualization", labelVi: "Minh họa" },
  { id: "explanation", labelVi: "Giải thích" },
];

interface TopicTOCProps {
  sections: TocSection[];
}

export default function TopicTOC({ sections }: TopicTOCProps) {
  const [active, setActive] = useState<string>("");
  const [collapsed, setCollapsed] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (sections.length === 0) return;

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
      setCollapsed(true);
    }
  }

  if (sections.length === 0) return null;

  const rows = sections.map((s) => {
    const Icon = ICONS[s.id];
    const isActive = active === s.id;
    return { ...s, Icon, isActive };
  });

  const listClasses = reduceMotion ? "" : "transition-all";

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <nav
        role="navigation"
        aria-label="Mục lục bài học"
        className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-40"
      >
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card/90 backdrop-blur-sm p-2 shadow-lg">
          {rows.map(({ id, labelVi, Icon, isActive }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={isActive ? "location" : undefined}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(id);
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${listClasses} ${
                isActive
                  ? "bg-accent-light text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              <Icon size={14} />
              {labelVi}
            </a>
          ))}
        </div>
      </nav>

      {/* Mobile: floating pill */}
      <nav
        role="navigation"
        aria-label="Mục lục bài học"
        className="lg:hidden fixed bottom-20 right-4 z-40"
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-expanded={false}
            className={`flex items-center gap-1.5 rounded-full border border-border bg-card/95 backdrop-blur-sm px-3 py-2 text-xs font-medium text-muted shadow-lg ${listClasses} hover:text-foreground`}
          >
            <List size={14} />
            Mục lục
          </button>
        ) : (
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card/95 backdrop-blur-sm p-2 shadow-lg">
            {rows.map(({ id, labelVi, Icon, isActive }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(id);
                }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${listClasses} ${
                  isActive
                    ? "bg-accent-light text-accent"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                <Icon size={14} />
                {labelVi}
              </a>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
