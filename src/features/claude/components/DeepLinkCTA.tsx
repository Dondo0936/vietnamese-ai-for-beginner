import { ArrowUpRight } from "lucide-react";

export type DeepLinkCTAProps =
  | {
      prompt: string;
      docHref?: never;
      label?: string;
      className?: string;
    }
  | {
      prompt?: never;
      docHref: string;
      label: string;
      className?: string;
    };

/**
 * CTA that either:
 *  1. deep-links a seeded prompt into claude.ai/new?q=...
 *  2. or opens an Anthropic doc page for non-deep-linkable features (Skills, MCP).
 */
export function DeepLinkCTA(props: DeepLinkCTAProps) {
  const href = props.prompt
    ? `https://claude.ai/new?q=${encodeURIComponent(props.prompt)}`
    : props.docHref;
  const label = props.label ?? "Thử trong Claude";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full border border-foreground bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-transform hover:translate-y-[-1px] ${props.className ?? ""}`}
    >
      {label}
      <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
    </a>
  );
}
