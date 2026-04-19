import type { ReactNode } from "react";
import { MockBadge } from "./MockBadge";

/**
 * Pixel-faithful scaffold for Anthropic's Labs / experimental surfaces
 * (currently "Claude Design by Anthropic Labs", announced 2026-04-17).
 *
 * Why a new shell primitive (not just a re-skin of ClaudeDesktopShell)?
 *   - Claude Design lives at claude.ai/design, not the main chat app,
 *     and reads visually distinct: no left-rail conversation history,
 *     a narrower top chrome, a visible "Labs" / "Beta" chip, and a
 *     soft turquoise beta-strip at the very top. Rendering a Labs
 *     feature inside ClaudeDesktopShell (44px top + 248px left rail)
 *     would misrepresent the product.
 *   - Future Labs features (the plan brief flags more coming) can
 *     reuse this primitive instead of each tile re-inventing the
 *     chrome.
 *
 * **UI snapshot pinned to 2026-04-19.** Update `LABS_SNAPSHOT_DATE`
 * + this comment when the Claude Design interface re-skins (or when
 * Anthropic ships the next Labs surface with different chrome).
 *
 * Pure presentational. Never fetches. Never calls a real API.
 *
 * Layout tokens:
 *   - Top bar height: 36px (narrower than ClaudeDesktopShell's 44px)
 *     so the Labs chrome reads lighter than the main chat app.
 *   - Beta strip: 3px tall, turquoise gradient, sits above the top bar.
 *   - No left rail. Body slot fills the full shell width — Claude
 *     Design's canvas-first UX wants horizontal room.
 *   - Paper surface: --paper-2 (slightly darker than --paper) so the
 *     Labs background reads "off-main-app" at a glance.
 *
 * Mock disclosure: a visible "Mô phỏng" badge is rendered top-right by
 * default so sighted users can tell this isn't a screen recording. Pair
 * with `<ViewRealUI href="...">` below the shell to link to Anthropic's
 * real announcement / product page. Opt out via `showMockBadge={false}`
 * when the shell is itself a decorative inset and a separate disclosure
 * already applies.
 */

/** Date the Labs shell layout was last reconciled against Claude Design. */
export const LABS_SNAPSHOT_DATE = "2026-04-19";

export interface ClaudeLabsShellProps {
  topBar: ReactNode;
  /**
   * Single body slot — Labs surfaces (Claude Design's canvas) are
   * typically one focused column. No rail, no artifacts panel.
   */
  body: ReactNode;
  /** Override shell height (default 560px — shorter than desktop's 620px). */
  height?: number | string;
  /**
   * Show the "Mô phỏng" badge top-right (default `true`). Disable only
   * when the shell is a decorative inset under another disclosure.
   */
  showMockBadge?: boolean;
  /**
   * Override the date stamped on the mock-badge tooltip. Defaults to
   * `LABS_SNAPSHOT_DATE`.
   */
  mockBadgeDate?: string;
  className?: string;
}

export function ClaudeLabsShell({
  topBar,
  body,
  height = 560,
  showMockBadge = true,
  mockBadgeDate = LABS_SNAPSHOT_DATE,
  className = "",
}: ClaudeLabsShellProps) {
  return (
    <div
      data-claude-labs-shell
      role="figure"
      aria-label="Bản mô phỏng giao diện Claude Labs"
      className={`relative overflow-hidden border border-border ${className}`}
      style={{
        height,
        borderRadius: 14,
        // --paper-2 (slightly darker than --paper) so the Labs surface
        // reads "off-main-app" — consistent with how Anthropic positions
        // Labs visually vs the core chat surface.
        background: "var(--paper-2, #F3F2EE)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Mock disclosure — visible counterpart to aria-label. Lives above
          all chrome in z-order so it's always legible. */}
      {showMockBadge ? <MockBadge snapshotDate={mockBadgeDate} /> : null}

      {/* Beta strip — thin turquoise gradient signalling "this is Labs /
          research preview". 3px is thin enough to not steal attention
          from the canvas but strong enough for sighted users to read
          "experimental product" on first glance. */}
      <div
        aria-hidden="true"
        style={{
          height: 3,
          background:
            "linear-gradient(90deg, var(--turquoise-ink, #13343B) 0%, var(--turquoise-500, #20B8B0) 50%, var(--turquoise-ink, #13343B) 100%)",
        }}
      />

      {/* Top bar — narrower than desktop's 44px; carries the Labs / Beta
          chip visibly so the preview doesn't pretend to be the main app. */}
      <div
        className="flex items-center border-b border-border px-3"
        style={{ height: 36, background: "var(--paper, #FBFAF7)" }}
      >
        {topBar}
      </div>

      {/* Body — full width, no rail. Height = shell - beta-strip - topbar. */}
      <div
        className="flex min-w-0 flex-col"
        style={{ height: "calc(100% - 36px - 3px)" }}
      >
        {body}
      </div>
    </div>
  );
}

/**
 * Small "Labs · Beta" chip for use inside a `ClaudeLabsShell` topBar.
 * Extracted here (rather than duplicated per tile) so every Labs tile
 * surfaces the same chip styling.
 */
export function LabsBetaChip({ label = "Labs · Beta" }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--paper-2,#F3F2EE)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-tertiary"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--turquoise-500, #20B8B0)" }}
      />
      {label}
    </span>
  );
}
