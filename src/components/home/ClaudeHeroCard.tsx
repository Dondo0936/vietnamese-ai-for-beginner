import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Single-line CTA card under the ask bar. Teases the /claude flagship
 * guide without taking the full width of a proper hero section.
 *
 * Visual treatment: subtle warm wash (peach-200 → paper) with the
 * Sparkles icon in a turquoise-tinted pill, so the card reads as a
 * "new / featured" CTA against the otherwise-neutral homepage chrome.
 */
export default function ClaudeHeroCard() {
  return (
    <section className="mx-auto max-w-[720px] px-4 pb-4 sm:pb-6">
      <Link
        href="/claude"
        className="group flex items-center justify-between gap-4 border px-5 py-4 text-[15px] text-foreground transition-[border-color,box-shadow,background] duration-200 hover:shadow-[0_4px_14px_rgba(19,52,59,0.08)]"
        style={{
          borderRadius: 14,
          borderColor: "var(--peach-200)",
          backgroundImage:
            "linear-gradient(135deg, var(--peach-200) 0%, var(--paper) 65%)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <span className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "var(--turquoise-100)",
              color: "var(--turquoise-700)",
            }}
            aria-hidden="true"
          >
            <Sparkles size={16} strokeWidth={1.75} />
          </span>
          <span className="leading-tight">
            <span className="font-medium">Cẩm nang Claude.</span>{" "}
            <span className="text-muted">Chưa dùng Claude? Bắt đầu ở đây.</span>
          </span>
        </span>
        <ArrowRight
          size={16}
          strokeWidth={1.75}
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: "var(--turquoise-700)" }}
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}
