import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Single-line CTA card under the ask bar. Teases the /claude flagship
 * guide without taking the full width of a proper hero section.
 */
export default function ClaudeHeroCard() {
  return (
    <section className="mx-auto max-w-[720px] px-4 pb-4 sm:pb-6">
      <Link
        href="/claude"
        aria-label="Cẩm nang Claude — Chưa dùng Claude? Bắt đầu ở đây"
        className="group flex items-center justify-between gap-4 border border-border bg-card px-5 py-3 text-[14px] text-foreground transition-[border-color,box-shadow] duration-200 hover:border-[color:var(--border-strong)]"
        style={{ borderRadius: 12, boxShadow: "var(--shadow-sm)" }}
      >
        <span className="flex items-center gap-3">
          <Sparkles size={16} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
          <span>
            <span className="font-medium">Cẩm nang Claude.</span>{" "}
            <span className="text-muted">Chưa dùng Claude? Bắt đầu ở đây.</span>
          </span>
        </span>
        <ArrowRight
          size={15}
          strokeWidth={1.75}
          className="shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}
