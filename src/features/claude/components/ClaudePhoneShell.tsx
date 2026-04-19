import type { ReactNode } from "react";
import { MockBadge } from "./MockBadge";

/**
 * Phone-shaped scaffold for Claude mobile-app features (e.g. Voice Mode).
 *
 * Voice Mode is an iOS/Android-first feature of Claude, so rendering the
 * demo inside a desktop shell would misrepresent where the feature lives.
 * This primitive deliberately keeps the chrome minimal — a rounded phone
 * outline, a fake status bar at the top, and a home-indicator pill at
 * the bottom — so the tile body can focus on the voice UI itself.
 *
 * **UI snapshot pinned to 2026-04-19.** Update `PHONE_SHELL_SNAPSHOT_DATE`
 * + this comment when the real Claude iOS app's Voice Mode re-skins.
 *
 * Pure presentational. Never fetches. Never calls a real API.
 *
 * The dimensions (390×700) compromise between iPhone-ish aspect ratio
 * and legibility inside a 1100px-wide DemoCanvas — a true 9:16 phone
 * would waste horizontal space and force annotation labels to wrap
 * painfully.
 *
 * Mock disclosure: a visible "Mô phỏng" badge is rendered top-right by
 * default (inside the phone chrome, above the status bar) so sighted
 * users can tell this isn't a screencap of the real app.
 */

/** Date the phone layout was last reconciled against real Claude mobile. */
export const PHONE_SHELL_SNAPSHOT_DATE = "2026-04-19";

export interface ClaudePhoneShellProps {
  /** Vietnamese string shown top-center in the fake status bar as the app title. */
  appTitle?: string;
  /** Fake time string rendered top-left in the status bar. Default "9:41". */
  statusBarTime?: string;
  /** Main body of the phone screen — voice UI, transcript, buttons. */
  children: ReactNode;
  /** Override phone height in px (default 700). Width is fixed at 390. */
  height?: number;
  /** Show the "Mô phỏng" badge (default true). */
  showMockBadge?: boolean;
  /** Snapshot date for the mock-badge tooltip. */
  mockBadgeDate?: string;
  className?: string;
}

export function ClaudePhoneShell({
  appTitle = "Claude",
  statusBarTime = "9:41",
  children,
  height = 700,
  showMockBadge = true,
  mockBadgeDate = PHONE_SHELL_SNAPSHOT_DATE,
  className = "",
}: ClaudePhoneShellProps) {
  return (
    <div className="flex w-full items-center justify-center">
      <div
        data-claude-phone-shell
        role="figure"
        aria-label="Bản mô phỏng ứng dụng Claude trên điện thoại"
        className={`relative overflow-hidden border border-border ${className}`}
        style={{
          width: 390,
          height,
          borderRadius: 44,
          background: "var(--paper, #FBFAF7)",
          boxShadow: "var(--shadow-sm), 0 0 0 10px rgba(0,0,0,0.04)",
        }}
      >
        {showMockBadge ? <MockBadge snapshotDate={mockBadgeDate} /> : null}

        {/* Status bar — fake, non-interactive */}
        <div
          className="flex items-center justify-between px-6 text-[12px] font-medium text-foreground"
          style={{ height: 36 }}
        >
          <span className="font-mono tabular-nums">{statusBarTime}</span>
          <span className="text-tertiary">{appTitle}</span>
          <span aria-hidden="true" className="flex items-center gap-1 text-tertiary">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--turquoise-ink, #13343B)" }}
            />
            <span
              className="inline-block h-2 w-3 rounded-[1px] border border-current"
            />
          </span>
        </div>

        {/* Body */}
        <div
          className="flex flex-col"
          style={{ height: `calc(100% - 36px - 24px)` }}
        >
          {children}
        </div>

        {/* Home-indicator pill — purely decorative */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-foreground/30"
          style={{ bottom: 8, height: 4, width: 120 }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
