import type { ReactNode } from "react";
import { MockBadge } from "./MockBadge";

/**
 * Pixel-faithful scaffold of the Claude Desktop app.
 * **UI snapshot pinned to 2026-04-18.** If Claude Desktop re-skins,
 * update `SHELL_SNAPSHOT_DATE` + this comment, ideally quarterly.
 *
 * Pure presentational. Never fetches. Never calls a real API.
 * Layout tokens match the real app:
 *   - Top bar height: 44px
 *   - Left rail width: 248px when present; rail is optional (hide it by
 *     omitting the prop — used in narrow still-frame thumbnails).
 *   - Artifacts panel width: 42% of shell, min 360px
 *   - Paper surface: --paper (light) / #1A1919 (dark, matches claude.ai)
 *
 * Mock disclosure: a visible "Mô phỏng" badge is rendered top-right by
 * default so sighted users can tell this isn't a screen recording. Pair
 * with `<ViewRealUI href="...">` below the shell to link to Anthropic's
 * real product/docs page. Opt out via `showMockBadge={false}` when the
 * shell is itself a decorative inset (e.g. a hero preview card) and a
 * separate disclosure already applies.
 *
 * Exports: ClaudeDesktopShell (default slot layout) +
 *          ShellMessage, ShellComposerStub for common message UI.
 */

/** Date the shell layout was last reconciled against real Claude Desktop. */
export const SHELL_SNAPSHOT_DATE = "2026-04-18";

export interface ClaudeDesktopShellProps {
  topBar: ReactNode;
  /**
   * Left rail contents. Optional — when omitted (e.g. in still-frame
   * thumbnails where horizontal space is tight), the main column fills
   * the shell width and annotation anchors shift accordingly.
   */
  leftRail?: ReactNode;
  main: ReactNode;
  artifactsPanel?: ReactNode;
  /** Override shell height (default 620px). */
  height?: number | string;
  /**
   * Show the "Mô phỏng" badge top-right (default `true`). Disable only
   * when the shell is a decorative inset under another disclosure — see
   * the component-level JSDoc.
   */
  showMockBadge?: boolean;
  /**
   * Override the date stamped on the mock-badge tooltip. Defaults to
   * `SHELL_SNAPSHOT_DATE`. Useful if a specific tile was reconciled
   * against Claude Desktop on a different date.
   */
  mockBadgeDate?: string;
  className?: string;
}

export function ClaudeDesktopShell({
  topBar,
  leftRail,
  main,
  artifactsPanel,
  height = 620,
  showMockBadge = true,
  mockBadgeDate = SHELL_SNAPSHOT_DATE,
  className = "",
}: ClaudeDesktopShellProps) {
  return (
    <div
      data-claude-shell
      role="figure"
      aria-label="Bản mô phỏng giao diện Claude Desktop"
      className={`relative overflow-hidden border border-border ${className}`}
      style={{
        height,
        borderRadius: 14,
        background: "var(--paper, #FBFAF7)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Mock disclosure badge — visible counterpart to aria-label.
          Lives above the topbar in z-order so it's always legible. */}
      {showMockBadge ? <MockBadge snapshotDate={mockBadgeDate} /> : null}

      {/* Top bar */}
      <div
        className="flex items-center border-b border-border px-3"
        style={{ height: 44 }}
      >
        {topBar}
      </div>

      <div className="flex" style={{ height: "calc(100% - 44px)" }}>
        {/* Left rail — optional; omit in narrow still-frames */}
        {leftRail !== undefined && leftRail !== null ? (
          <aside
            className="flex shrink-0 flex-col border-r border-border"
            style={{ width: 248, background: "var(--paper-2, #F3F2EE)" }}
          >
            {leftRail}
          </aside>
        ) : null}

        {/* Main */}
        <section className="flex min-w-0 flex-1 flex-col">{main}</section>

        {/* Optional artifacts panel */}
        {artifactsPanel ? (
          <aside
            role="complementary"
            aria-label="Khung Artifacts"
            className="flex shrink-0 flex-col border-l border-border"
            style={{
              width: "42%",
              minWidth: 360,
              background: "var(--paper, #FBFAF7)",
            }}
          >
            {artifactsPanel}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Pre-styled bubbles for common message UI inside Shell.main.
 * Render inside a flex-column container; user bubbles use `ml-auto` to align right.
 */
export function ShellMessage({
  from,
  children,
}: {
  from: "user" | "claude";
  children: ReactNode;
}) {
  return (
    <div
      className={`mx-4 my-2 max-w-[85%] rounded-[12px] px-4 py-2 text-[14px] leading-[1.55] ${
        from === "user"
          ? "ml-auto bg-foreground text-background"
          : "bg-[var(--paper-2,#F3F2EE)] text-foreground"
      }`}
    >
      {children}
    </div>
  );
}

/**
 * Non-interactive visual placeholder for the Claude Desktop composer.
 * Pure div — no input, no submit. Use for tiles that need the composer
 * *look* without any real functionality.
 */
export function ShellComposerStub({ placeholder }: { placeholder?: string }) {
  return (
    <div
      className="mx-4 mb-4 border border-border bg-[var(--pure-white,#FFFFFF)]"
      style={{ borderRadius: 14, boxShadow: "var(--shadow-sm)" }}
    >
      <div className="px-4 py-3 text-[14px] text-tertiary">
        {placeholder ?? "Nhập câu hỏi của bạn..."}
      </div>
    </div>
  );
}
