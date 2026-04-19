import { ArrowUpRight } from "lucide-react";

/**
 * "Ground-truth" link that sends curious users to Anthropic's own
 * page or docs entry showing the real feature UI. Pairs with the
 * simulated `ClaudeDesktopShell` above it: demo stays interactive
 * (playhead, annotations), this link closes the honesty gap.
 *
 * Rendered as a plain external anchor — no lightbox, no hosted
 * screenshots — so the link stays evergreen when Anthropic updates
 * their product pages. Opens in a new tab; the user's place in the
 * guide is preserved.
 *
 * Usage:
 *   <ViewRealUI href="https://www.claude.com/claude" />
 *   <ViewRealUI
 *     href="https://docs.claude.com/en/docs/..."
 *     label="Xem tài liệu gốc từ Anthropic"
 *   />
 */

export interface ViewRealUIProps {
  /** Anthropic URL that shows the real feature UI or documents it. */
  href: string;
  /** Vietnamese link text. Defaults to a generic "real screenshot" phrasing. */
  label?: string;
  /** Optional caption rendered as small muted text under the link. */
  caption?: string;
  className?: string;
}

export function ViewRealUI({
  href,
  label = "Xem ảnh chụp thật từ Anthropic",
  caption,
  className = "",
}: ViewRealUIProps) {
  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-muted underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
      >
        {label}
        <ArrowUpRight
          size={14}
          strokeWidth={1.75}
          aria-hidden="true"
          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </a>
      {caption ? (
        <p className="text-[12px] leading-[1.45] text-tertiary">{caption}</p>
      ) : null}
    </div>
  );
}
