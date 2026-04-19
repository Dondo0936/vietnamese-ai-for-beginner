/**
 * Visible disclosure that the surrounding shell is a pixel-faithful
 * simulation, not a screen recording of the real Claude Desktop app.
 *
 * Design rationale: the aria-label on `ClaudeDesktopShell` already
 * declares "Bản mô phỏng" for assistive tech, but sighted users
 * see what looks like the real app. This badge makes the same
 * disclosure visible without dominating the demo.
 *
 * Positioning: caller places absolutely inside a `ClaudeDesktopShell`
 * (top-right offset). The badge itself is `pointer-events-none` for
 * the dot/text and a `<span>` for the tooltip trigger so hover works.
 */

export interface MockBadgeProps {
  /**
   * ISO date ("YYYY-MM-DD") the surrounding shell was last pinned to
   * the real Claude Desktop. Shown in the hover tooltip so the user
   * knows how fresh the simulation is.
   */
  snapshotDate?: string;
  className?: string;
}

export function MockBadge({
  snapshotDate = "2026-04-18",
  className = "",
}: MockBadgeProps) {
  return (
    <span
      role="note"
      aria-label={`Bản mô phỏng giao diện Claude (ảnh chụp chuẩn ngày ${snapshotDate})`}
      title={`Đây là bản mô phỏng, không phải ảnh chụp trực tiếp. Giao diện được đối chiếu với Claude Desktop ngày ${snapshotDate}.`}
      className={`pointer-events-auto absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--paper,#FBFAF7)] px-2 py-0.5 text-[10px] font-medium tracking-[0.04em] text-tertiary uppercase ${className}`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--turquoise-ink, #13343B)" }}
      />
      Mô phỏng
    </span>
  );
}
