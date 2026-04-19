import type { ReactNode } from "react";
import { Send, Square } from "lucide-react";

/**
 * Shared "crop" primitives for the "Cách nó hoạt động" sections of Claude
 * tiles. Extracted verbatim from `tiles/chat.tsx` + `tiles/projects.tsx`
 * (where they lived as local components) so subsequent tiles reuse the
 * same pixel-identical building blocks.
 *
 * Styling is intentionally kept load-bearing-identical to the inline
 * versions that existed before the extraction, including:
 *   - The layered halo box-shadow on `CropAnnotation` pins (matches the
 *     AnnotationLayer polish from the 00ac8ac commit).
 *   - The turquoise-left-accent + pure-white background on labels.
 *   - The paper-2 card background under `CropCard`.
 *
 * None of these primitives are interactive. They exist purely to compose
 * static, annotated fragments of the ClaudeDesktopShell at full card
 * width — sharper than cramming the whole shell into a thumbnail.
 */

// ---------------------------------------------------------------------------
// CropCard — figure wrapper with title + caption
// ---------------------------------------------------------------------------

export interface CropCardProps {
  title: string;
  caption: string;
  children: ReactNode;
}

/** Small card wrapper shared by the "how it works" crops. */
export function CropCard({ title, caption, children }: CropCardProps) {
  return (
    <figure className="flex flex-col gap-3">
      <div
        className="flex flex-col gap-3 rounded-[14px] border border-border bg-[var(--paper-2,#F3F2EE)] p-5"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        {children}
      </div>
      <figcaption className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-tertiary">
          {title}
        </span>
        <p className="text-[14px] leading-[1.55] text-muted">{caption}</p>
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// CropBubble — chat-message bubble rendered outside ShellMessage's flex ctx
// ---------------------------------------------------------------------------

export interface CropBubbleProps {
  from: "user" | "claude";
  children: ReactNode;
  muted?: boolean;
}

/** Message bubble styled like ShellMessage but without the shell's flex context. */
export function CropBubble({ from, children, muted }: CropBubbleProps) {
  const isUser = from === "user";
  return (
    <div
      className={`rounded-[12px] px-4 py-2 text-[13px] leading-[1.55] ${
        isUser
          ? "ml-auto bg-foreground text-background"
          : "bg-[var(--paper,#FBFAF7)] text-foreground"
      } ${muted ? "italic text-tertiary" : ""}`}
      style={{ maxWidth: "85%" }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CropComposer — a composer stub with a single icon (stop/send)
// ---------------------------------------------------------------------------

export interface CropComposerProps {
  icon: "stop" | "send";
}

/** Composer stub with a single icon button visible — stop or send. */
export function CropComposer({ icon }: CropComposerProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-[var(--pure-white,#FFFFFF)] px-4 py-2.5"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <span className="text-[13px] text-tertiary">Nhập tiếp theo...</span>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
        aria-hidden="true"
      >
        {icon === "stop" ? (
          <Square size={12} strokeWidth={2.5} />
        ) : (
          <Send size={12} strokeWidth={2.5} />
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CropAnnotation — inline pin + label for crop-card compositions
// ---------------------------------------------------------------------------

export interface CropAnnotationProps {
  pin: number;
  label: string;
  align?: "left" | "right";
}

/** Inline pin+label — matches the AnnotationLayer look but as a flow element. */
export function CropAnnotation({ pin, label, align = "left" }: CropAnnotationProps) {
  return (
    <div
      className={`flex items-start gap-2 ${align === "right" ? "ml-auto flex-row-reverse" : ""}`}
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-foreground bg-[var(--paper,#FBFAF7)] text-[11px] font-semibold text-foreground"
        style={{
          // Matches the AnnotationLayer polish — layered halo so pins lift
          // off the surrounding paper instead of blending into it.
          boxShadow:
            "0 2px 6px rgba(0,0,0,0.10), 0 0 0 3px var(--paper,#FBFAF7), 0 0 0 4px rgba(19,52,59,0.18)",
        }}
      >
        {pin}
      </span>
      <span
        className="rounded-[6px] border border-border bg-[var(--pure-white,#FFFFFF)] px-2 py-0.5 text-[12px] leading-[1.35] text-foreground"
        style={{
          borderLeft: "2px solid var(--turquoise-ink, #13343B)",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
