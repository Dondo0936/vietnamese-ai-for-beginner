import type { Annotation } from "@/features/claude/types";

export interface AnnotationLayerProps {
  annotations: Annotation[];
  /** 0..1 position of the demo's playhead. */
  playhead: number;
  /** When true, show every annotation ignoring showAt (used by reduced-motion). */
  staticMode?: boolean;
  className?: string;
}

/**
 * Absolutely-positioned overlay that paints numbered pins + side labels
 * over a ClaudeDesktopShell. Pin visibility is scrubbed by the demo's
 * playhead, unless `staticMode` is on (then every annotation shows).
 *
 * Anchors are percent-based, so the layer adapts to shell resizes.
 */
export function AnnotationLayer({
  annotations,
  playhead,
  staticMode = false,
  className = "",
}: AnnotationLayerProps) {
  const visible = staticMode
    ? annotations
    : annotations.filter(
        ({ showAt: [s, e] }) => playhead >= s && playhead <= e
      );

  return (
    <div
      aria-hidden={visible.length === 0}
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      {visible.map((a) => (
        <div
          key={a.id}
          className="absolute flex items-center gap-2"
          style={{
            left: `${a.anchor.x}%`,
            top: `${a.anchor.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span
            aria-label={a.description}
            role="img"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-foreground bg-[var(--paper,#FBFAF7)] text-[11px] font-semibold text-foreground"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            {a.pin}
          </span>
          <span className="rounded-[6px] border border-border bg-[var(--paper,#FBFAF7)] px-2 py-0.5 text-[12px] text-foreground">
            {a.label}
          </span>
        </div>
      ))}
    </div>
  );
}
