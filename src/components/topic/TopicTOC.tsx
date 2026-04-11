"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Eye, BookOpen, List } from "lucide-react";

const sections = [
  { id: "analogy", label: "Ví dụ", icon: Lightbulb },
  { id: "visualization", label: "Minh họa", icon: Eye },
  { id: "explanation", label: "Giải thích", icon: BookOpen },
];

export default function TopicTOC() {
  const [active, setActive] = useState("");
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    // Observe all section elements
    const elements = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    elements.forEach((el) => observer.observe(el!));

    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCollapsed(true);
    }
  }

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card/90 backdrop-blur-sm p-2 shadow-lg">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-accent-light text-accent"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                <Icon size={14} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: floating pill */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card/95 backdrop-blur-sm px-3 py-2 text-xs font-medium text-muted shadow-lg transition-all hover:text-foreground"
          >
            <List size={14} />
            Mục lục
          </button>
        ) : (
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card/95 backdrop-blur-sm p-2 shadow-lg">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-accent-light text-accent"
                      : "text-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  <Icon size={14} />
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
