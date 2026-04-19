import type { ReactNode } from "react";
import { ChevronDown, Star } from "lucide-react";
import { MockBadge } from "./MockBadge";

/**
 * Pixel-faithful scaffold of a **Chrome browser window with an embedded
 * Claude side panel** — the surface the "Claude for Chrome" extension
 * renders into. This is the third shell primitive in the feature
 * (joining `ClaudeDesktopShell` and `ClaudeLabsShell`).
 *
 * Why a new shell primitive (not a re-skin of ClaudeDesktopShell)?
 *   - Claude for Chrome is NOT the Claude Desktop app — it's a browser
 *     extension that lives inside Chrome chrome (tab strip + address
 *     bar + toolbar) and opens Claude in a Chrome side panel. Rendering
 *     it inside `ClaudeDesktopShell` (44px top + 248px left rail) would
 *     misrepresent the product entirely.
 *   - Future browser-extension surfaces (e.g. DevTools integrations)
 *     can reuse this primitive instead of re-inventing the chrome.
 *
 * **UI snapshot pinned to 2026-04-19.** Update `CHROME_SNAPSHOT_DATE`
 * + this comment when Chrome itself re-skins or when the extension's
 * side panel chrome changes visibly.
 *
 * Honest note (2026-04-19): Anthropic does NOT publish exact pixel
 * dimensions for the Chrome-extension side panel — width, side (left
 * vs right), and internal chrome heights are reconstructions. Modern
 * Chrome side panels default to the right; the 38% width + 32px mini
 * top bar below are designer choices. The visible `MockBadge` + the
 * paired `<ViewRealUI>` disclosure below the shell cover this gap.
 *
 * Pure presentational. Never fetches. Never calls a real API.
 *
 * Layout tokens:
 *   - Tab-strip height: 36px (active tab + one inactive tab + "+" button)
 *   - Address-bar row height: 40px (nav glyphs + URL input + toolbar
 *     glyphs including puzzle-piece + pinned Claude icon)
 *   - Side-panel mini top bar: 32px (Claude label + permission-mode chip)
 *   - Body split: 62% mainContent / 38% sidePanel by default
 *   - Side panel sits on the RIGHT, matching Chrome's default side-panel
 *     position
 *   - Paper surface: `--paper` for the address-bar row, `--paper-2` for
 *     the inactive tab, `--pure-white` for the active tab + page
 *     background + side-panel chrome
 *   - Subtle shadow on the side panel's left edge to separate it from
 *     the page content
 *
 * Mock disclosure: a visible "Mô phỏng" badge is rendered top-right by
 * default so sighted users can tell this isn't a screen recording. Pair
 * with `<ViewRealUI href="...">` below the shell to link to Anthropic's
 * real Claude-for-Chrome announcement post. Opt out via
 * `showMockBadge={false}` when the shell is itself a decorative inset.
 */

/** Date the Chrome shell layout was last reconciled. */
export const CHROME_SNAPSHOT_DATE = "2026-04-19";

export interface ClaudeChromeShellProps {
  /** URL shown in the address bar. */
  url: string;
  /**
   * Tab-strip labels. The first label is the active tab; the rest are
   * inactive tabs rendered after it. Defaults to a two-tab setup:
   * VnExpress (active) + Gmail (inactive).
   */
  tabLabels?: string[];
  /** The webpage body rendered inside the main (non-side-panel) area. */
  mainContent: ReactNode;
  /**
   * Optional override for the side-panel mini top bar. When omitted,
   * the shell renders a default that reads "Claude" + the
   * `AskBeforeActingChip` + a small settings glyph. Pass your own bar
   * if a tile needs a custom arrangement.
   */
  sidePanelTopBar?: ReactNode;
  /** Chat history / content slot inside the side panel. */
  sidePanelBody: ReactNode;
  /** Composer slot at the bottom of the side panel. Optional. */
  sidePanelComposer?: ReactNode;
  /** Override shell height (default 580px). */
  height?: number | string;
  /**
   * Show the "Mô phỏng" badge top-right (default `true`). Disable only
   * when the shell is a decorative inset under another disclosure.
   */
  showMockBadge?: boolean;
  /** Override the date stamped on the mock-badge tooltip. */
  mockBadgeDate?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Inline glyph strip — nav + toolbar icons for the address-bar row.
// Kept as a plain SVG so we don't over-pull lucide icons into the shell
// primitive; tiles can compose on top.
// ---------------------------------------------------------------------------

function NavGlyph({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--tertiary, #75736E)" }}
    >
      <path d={d} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ClaudeChromeShell — the third Phase-2 shell primitive
// ---------------------------------------------------------------------------

export function ClaudeChromeShell({
  url,
  tabLabels = ["VnExpress — Kinh doanh", "Gmail"],
  mainContent,
  sidePanelTopBar,
  sidePanelBody,
  sidePanelComposer,
  height = 580,
  showMockBadge = true,
  mockBadgeDate = CHROME_SNAPSHOT_DATE,
  className = "",
}: ClaudeChromeShellProps) {
  const [activeTab, ...inactiveTabs] = tabLabels;

  // Default side-panel top bar — "Claude" label + Ask-before-acting chip
  // + small settings glyph. Tiles can override via the prop.
  const defaultSidePanelTopBar = (
    <div className="flex w-full items-center gap-2">
      <span className="text-[11px] font-semibold text-foreground">Claude</span>
      <AskBeforeActingChip />
      <span
        aria-label="Cài đặt panel"
        role="img"
        className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-[var(--pure-white,#FFFFFF)] text-tertiary"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width={11}
          height={11}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="3.5" cy="8" r="1" />
          <circle cx="8" cy="8" r="1" />
          <circle cx="12.5" cy="8" r="1" />
        </svg>
      </span>
    </div>
  );

  return (
    <div
      data-claude-chrome-shell
      role="figure"
      aria-label="Bản mô phỏng trình duyệt Chrome với Claude side panel"
      className={`relative overflow-hidden border border-border ${className}`}
      style={{
        height,
        borderRadius: 14,
        background: "var(--paper-2, #F3F2EE)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Mock disclosure — visible counterpart to aria-label. */}
      {showMockBadge ? <MockBadge snapshotDate={mockBadgeDate} /> : null}

      {/* Tab strip — 36px. Active tab reads pure-white against paper-2. */}
      <div
        className="flex items-end gap-1 border-b border-border px-2"
        style={{
          height: 36,
          background: "var(--paper-2, #F3F2EE)",
        }}
      >
        {/* Active tab */}
        <div
          className="flex items-center gap-1.5 rounded-t-[8px] border border-b-0 border-border px-3 pt-1 text-[11px] text-foreground"
          style={{
            height: 28,
            background: "var(--pure-white, #FFFFFF)",
            maxWidth: 200,
          }}
        >
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ background: "rgba(19,52,59,0.25)" }}
          />
          <span className="truncate">{activeTab}</span>
          <span
            aria-hidden="true"
            className="ml-1 text-[10px] text-tertiary"
          >
            ×
          </span>
        </div>
        {/* Inactive tabs */}
        {inactiveTabs.map((label) => (
          <div
            key={label}
            className="flex items-center gap-1.5 rounded-t-[8px] border border-b-0 border-border px-3 pt-1 text-[11px] text-tertiary"
            style={{
              height: 26,
              background: "var(--paper-2, #F3F2EE)",
              maxWidth: 160,
              opacity: 0.9,
            }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: "rgba(19,52,59,0.15)" }}
            />
            <span className="truncate">{label}</span>
          </div>
        ))}
        {/* "+" new-tab button */}
        <span
          aria-hidden="true"
          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded text-tertiary hover:bg-[var(--paper,#FBFAF7)]"
          style={{ fontSize: 14, lineHeight: 1 }}
        >
          +
        </span>
      </div>

      {/* Address-bar row — 40px. Nav glyphs + URL input + toolbar glyphs
          (puzzle-piece + pinned Claude icon). */}
      <div
        className="flex items-center gap-2 border-b border-border px-3"
        style={{ height: 40, background: "var(--paper, #FBFAF7)" }}
      >
        {/* Back / forward / reload */}
        <span className="flex items-center gap-1">
          <NavGlyph d="M10 3 L5 8 L10 13" />
          <NavGlyph d="M6 3 L11 8 L6 13" />
          <NavGlyph d="M3 8 A5 5 0 1 0 5.5 3.5 M3 3 L3 6 L6 6" />
        </span>

        {/* URL input — pill-shaped pure-white surface with a small lock
            glyph + the URL text. Star icon at the far right of the input. */}
        <div
          className="flex flex-1 items-center gap-2 rounded-full border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-1 text-[11px] text-foreground"
          style={{ boxShadow: "var(--shadow-sm)", minWidth: 0 }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width={11}
            height={11}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            style={{ color: "var(--tertiary, #75736E)" }}
          >
            <rect x="3.5" y="7" width="9" height="6" rx="1.2" />
            <path d="M5 7 V5 a3 3 0 0 1 6 0 V7" strokeLinecap="round" />
          </svg>
          <span className="truncate">{url}</span>
          <Star
            size={12}
            strokeWidth={1.6}
            aria-hidden="true"
            className="ml-auto text-tertiary"
          />
        </div>

        {/* Toolbar — puzzle-piece (extensions) + pinned Claude icon */}
        <span
          aria-label="Tiện ích mở rộng"
          role="img"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-tertiary hover:bg-[var(--paper-2,#F3F2EE)]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width={13}
            height={13}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          >
            <path d="M4 4 h3 V3 a1 1 0 0 1 2 0 v1 h3 v3 h1 a1 1 0 0 1 0 2 h-1 v3 H9 v-1 a1 1 0 0 0 -2 0 v1 H4 v-3 H3 a1 1 0 0 1 0 -2 h1 z" />
          </svg>
        </span>
        <span
          aria-label="Biểu tượng Claude được ghim"
          role="img"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-foreground"
          style={{
            background: "var(--pure-white, #FFFFFF)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          C
        </span>
        {/* Profile circle */}
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-background"
          style={{ background: "var(--turquoise-ink, #13343B)" }}
        >
          N
        </span>
      </div>

      {/* Body split — main page on the left (62%), side panel on the right
          (38%). Heights sum to height - 36 - 40. */}
      <div
        className="flex min-w-0"
        style={{ height: `calc(100% - 36px - 40px)` }}
      >
        {/* Main content — the webpage area. */}
        <div
          className="flex min-w-0 flex-1 flex-col overflow-hidden"
          style={{ background: "var(--pure-white, #FFFFFF)" }}
        >
          {mainContent}
        </div>

        {/* Side panel — 38% wide, right-hand side. Subtle left-edge
            shadow separates it from the page. */}
        <aside
          aria-label="Panel Claude trong Chrome"
          className="flex shrink-0 flex-col border-l border-border"
          style={{
            width: "38%",
            minWidth: 260,
            background: "var(--paper, #FBFAF7)",
            boxShadow: "inset 4px 0 8px -6px rgba(0,0,0,0.10)",
          }}
        >
          {/* Side-panel mini top bar — 32px. */}
          <div
            className="flex items-center border-b border-border px-3"
            style={{ height: 32, background: "var(--pure-white, #FFFFFF)" }}
          >
            {sidePanelTopBar ?? defaultSidePanelTopBar}
          </div>
          {/* Side-panel body — scroll container for the chat history. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {sidePanelBody}
          </div>
          {/* Optional composer slot at the bottom. */}
          {sidePanelComposer ? (
            <div className="border-t border-border px-2 py-2">
              {sidePanelComposer}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AskBeforeActingChip — the safety-first mode chip
// ---------------------------------------------------------------------------

/**
 * Small "Ask before acting" chip — the default permission-mode for
 * Claude for Chrome, surfaced as a first-class primitive so every tile
 * that renders the Chrome shell shows the same safety label.
 *
 * The text is intentionally English — it mirrors Anthropic's own
 * product label. Do not translate; that would misrepresent the UI.
 * The chip renders with a small downward caret to hint that it's a
 * dropdown trigger in the real product.
 */
export function AskBeforeActingChip({
  label = "Ask before acting",
}: {
  label?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-border bg-[var(--paper-2,#F3F2EE)] px-2 py-0.5 text-[10px] font-medium text-foreground"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--turquoise-500, #20B8B0)" }}
      />
      {label}
      <ChevronDown
        size={10}
        strokeWidth={2}
        aria-hidden="true"
        className="text-tertiary"
      />
    </span>
  );
}
