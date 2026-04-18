import type { ReactNode } from "react";

/**
 * Pixel-faithful scaffold of the Claude Desktop app.
 * **UI snapshot pinned to 2026-04-18.** If Claude Desktop re-skins,
 * update this comment + the snapshot date, ideally quarterly.
 *
 * Pure presentational. Never fetches. Never calls a real API.
 * Layout tokens match the real app:
 *   - Top bar height: 44px
 *   - Left rail width: 248px (collapsible in the real app; fixed here)
 *   - Artifacts panel width: 42% of shell, min 360px
 *   - Paper surface: --paper (light) / #1A1919 (dark, matches claude.ai)
 *
 * Exports: ClaudeDesktopShell (default slot layout) +
 *          ShellMessage, ShellComposerStub for common message UI.
 */

export interface ClaudeDesktopShellProps {
  topBar: ReactNode;
  leftRail: ReactNode;
  main: ReactNode;
  artifactsPanel?: ReactNode;
  /** Override shell height (default 620px). */
  height?: number | string;
  className?: string;
}

export function ClaudeDesktopShell({
  topBar,
  leftRail,
  main,
  artifactsPanel,
  height = 620,
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
      {/* Top bar */}
      <div
        className="flex items-center border-b border-border px-3"
        style={{ height: 44 }}
      >
        {topBar}
      </div>

      <div className="flex" style={{ height: "calc(100% - 44px)" }}>
        {/* Left rail */}
        <aside
          className="flex shrink-0 flex-col border-r border-border"
          style={{ width: 248, background: "var(--paper-2, #F3F2EE)" }}
        >
          {leftRail}
        </aside>

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
