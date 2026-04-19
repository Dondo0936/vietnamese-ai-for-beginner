import Landing from "@/components/landing/Landing";

/**
 * Root route — renders the marketing landing page.
 *
 * Catalog browsing lives at `/browse` after the 2026-04-19 redesign
 * (see `docs/CONTRACTS.md` §11 and `src/components/landing/`).
 *
 * Intentionally bypasses `AppShell`; `Landing` ships its own nav and
 * footer so we don't double up chrome.
 */
export default function Home() {
  return <Landing />;
}
