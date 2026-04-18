import {
  ClaudeDesktopShell,
  type ClaudeDesktopShellProps,
} from "./ClaudeDesktopShell";
import { AnnotationLayer } from "./AnnotationLayer";
import type { Annotation } from "@/features/claude/types";

export interface StillFrameProps {
  /** Frozen 0..1 playhead for this frame. */
  playhead: number;
  /** Vietnamese short title shown under the frame. */
  title: string;
  /** One-to-two sentence Vietnamese caption. */
  caption: string;
  /** Annotations to pre-filter on the tile side. Pass the subset that should show at this moment. */
  annotations: Annotation[];
  /** Slot builder — returns the shell slots given the frozen playhead. */
  slots: (playhead: number) => Pick<
    ClaudeDesktopShellProps,
    "topBar" | "leftRail" | "main" | "artifactsPanel"
  >;
  /** Optional shell height override (default 280). */
  shellHeight?: number;
}

/**
 * Shared card for the "Cách nó hoạt động" 3-up grid under each tile's hero demo.
 * Scales down a ClaudeDesktopShell, freezes the playhead, paints annotations
 * in staticMode, and captions the whole thing. Every Shelf-1 tile uses this.
 */
export function StillFrame({
  playhead,
  title,
  caption,
  annotations,
  slots,
  shellHeight = 280,
}: StillFrameProps) {
  const built = slots(playhead);
  return (
    <figure className="flex flex-col gap-3">
      <div className="relative">
        <ClaudeDesktopShell height={shellHeight} {...built} />
        <AnnotationLayer annotations={annotations} playhead={playhead} staticMode />
      </div>
      <figcaption>
        <p className="ds-eyebrow mb-1.5">{title}</p>
        <p className="text-[14px] leading-[1.55] text-muted">{caption}</p>
      </figcaption>
    </figure>
  );
}
