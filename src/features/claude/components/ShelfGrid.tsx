import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ShelfMeta, TileMeta } from "@/features/claude/types";

interface ShelfGridProps {
  shelf: ShelfMeta;
  tiles: TileMeta[];
  index: number; // 1-based shelf position for the eyebrow
}

export function ShelfGrid({ shelf, tiles, index }: ShelfGridProps) {
  return (
    <section
      id={shelf.key}
      aria-labelledby={`shelf-${shelf.key}-title`}
      className="mx-auto max-w-[1100px] px-4 pb-16 sm:px-6"
    >
      <header className="mb-6 border-b border-border pb-3">
        <p className="ds-eyebrow mb-1.5">
          Kệ {index} · {shelf.enTitle}
        </p>
        <h2
          id={`shelf-${shelf.key}-title`}
          className="font-display text-foreground"
          style={{
            fontWeight: 500,
            fontSize: 26,
            lineHeight: 1.15,
            letterSpacing: "-0.015em",
            margin: 0,
          }}
        >
          {shelf.viTitle}
        </h2>
        <p className="mt-1.5 text-[14px] text-muted">{shelf.viSubtitle}</p>
      </header>

      <ul
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {tiles.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/claude/${t.slug}`}
              className="group flex h-full flex-col justify-between gap-3 rounded-[12px] border border-border bg-card p-4 transition-[border-color,box-shadow] duration-150 hover:border-[color:var(--border-strong)] hover:shadow-[var(--shadow-sm)]"
            >
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[14px] font-medium text-foreground">
                    {t.viTitle}
                  </span>
                  {t.badge === "new" && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background: "var(--peach-200)",
                        color: "var(--clay)",
                      }}
                    >
                      Mới
                    </span>
                  )}
                </div>
                <p className="text-[13px] leading-[1.5] text-muted">
                  {t.viTagline}
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.06em] text-tertiary transition-colors group-hover:text-foreground"
              >
                {t.status === "planned" ? "Đang xây dựng" : "Mở demo"}
                <ArrowUpRight size={12} strokeWidth={1.75} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
