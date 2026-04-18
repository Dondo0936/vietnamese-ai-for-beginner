# Claude Flagship Guide + Homepage Refactor — Design

**Date:** 2026-04-18
**Status:** Draft, pending user review
**Owner:** Claude (brainstorm partner) + @tiendat0936

## 1. Purpose

Add a **flagship, visualization-heavy guide to Claude** as its own route (`/claude`) for Vietnamese learners, and refactor the homepage so it teases this guide without disturbing the four existing profession paths.

The guide must cover every user-visible feature in the current Claude product surface (claude.com/product, code.claude.com, platform.claude.com as of 2026-04-18) and teach them through annotated replicas of the actual Claude Desktop UI — so a learner who finishes a tile can open Claude Desktop and use the feature immediately without translation.

Explicitly **not** a 5th profession path. The existing paths (Student / Office / AI Engineer / AI Researcher) remain the primary site IA. This is a parallel, product-centric guide.

## 2. Scope

### In scope
- New route tree under `/claude`:
  - `/claude` — hub with 3 shelves × 24 tiles
  - `/claude/[feature]` — 24 per-feature demo pages
- New primitives for fidelity-first Claude-UI replicas and annotation overlays
- Homepage refactor:
  - Remove the ✳ mark above the H1
  - Animated hue-sweep on "hình ảnh và ví dụ" in the hero headline
  - Add a single "Cẩm nang Claude" CTA card under the ask bar
  - Add a navbar entry for the guide
- Deep-link CTAs into `claude.ai/new?q=...` on every tile

### Out of scope
- Touching the four profession paths (Student / Office / AI Engineer / AI Researcher)
- Replacing any existing topic file
- Shader backdrops (explicitly rejected in previous session)
- Token-cost optimizations (user opted in to maximum effort)

## 3. Information architecture

### Route map

```
/claude                    Hub page — 3 shelves, 24 tiles
/claude/chat               Shelf 1 tile 1 — response streaming demo
/claude/projects           Shelf 1 tile 2
/claude/artifacts          Shelf 1 tile 3
/claude/files-vision       Shelf 1 tile 4
/claude/voice              Shelf 1 tile 5
/claude/web-search         Shelf 1 tile 6
/claude/claude-design      Shelf 1 tile 7   (NEW product · Apr 17 2026)
/claude/chrome             Shelf 1 tile 8
/claude/thinking           Shelf 2 tile 1 — extended thinking
/claude/skills             Shelf 2 tile 2
/claude/workspace          Shelf 2 tile 3
/claude/mcp                Shelf 2 tile 4
/claude/cowork             Shelf 2 tile 5
/claude/memory             Shelf 2 tile 6
/claude/routines           Shelf 2 tile 7
/claude/dispatch           Shelf 2 tile 8
/claude/claude-code        Shelf 3 tile 1
/claude/tool-use           Shelf 3 tile 2
/claude/prompt-caching     Shelf 3 tile 3
/claude/batch              Shelf 3 tile 4
/claude/context            Shelf 3 tile 5
/claude/subagents          Shelf 3 tile 6
/claude/structured         Shelf 3 tile 7
/claude/cicd               Shelf 3 tile 8
```

All 24 routes are statically generated via `generateStaticParams`.

### Shelf taxonomy

- **Shelf 1 — Khởi đầu (Starter, 8 tiles):** what you notice in the first hour of using Claude Desktop.
- **Shelf 2 — Nâng cao (Power user, 8 tiles):** features that unlock multi-step, multi-source, multi-device work.
- **Shelf 3 — Dành cho nhà phát triển (Developer, 8 tiles):** Claude Code, the API platform, and agentic infra.

### Homepage integration

- Navbar adds **"Cẩm nang Claude"** link pointing at `/claude`.
- Below the ask bar, a single **`ClaudeHeroCard`** CTA — small, one-line, "Chưa dùng Claude? Bắt đầu ở đây →" — not another big visual section.
- Existing profession-path grid, featured topics, and footer stay intact.
- Hero headline: remove the ✳ mark span; wrap "hình ảnh và ví dụ" in `<AccentHueSweep>` (animated gradient text).

## 4. Core primitives

Four new components live under `src/features/claude/components/`:

### 4.1 `ClaudeDesktopShell`

A pixel-faithful scaffold of the real Claude Desktop UI — top bar (project switcher, model selector, thinking toggle), left rail (chat list, projects), main column (messages + composer), optional right artifacts panel.

- Pure presentational; accepts props for which chrome to render and what to put in each slot.
- Never talks to the real Claude API. Everything in it is scripted or slot-filled.
- Matches the real app's type sizes, spacing, rail widths, and colors (light + dark) so learners recognize the UI instantly.
- Exported variants: `Shell`, `Shell.TopBar`, `Shell.LeftRail`, `Shell.Main`, `Shell.ArtifactsPanel`.

### 4.2 `AnnotationLayer`

Absolutely-positioned overlay that paints numbered pins over the shell with side labels and optional leader lines. Supports timeline scrubbing — each annotation has a `showAt` range tied to the demo's playhead so pins appear and disappear in sync with the scripted run.

### 4.3 `DemoCanvas`

Container for each demo. Handles:
- Reduced-motion detection (`useReducedMotion` from framer-motion) — demos degrade to a static annotated frame.
- Keyboard controls (▶ space / → step / ↻ reset).
- Focus trapping when a demo owns the viewport.
- An escape hatch "Xem tĩnh" button that skips to the final state.

### 4.4 `DeepLinkCTA`

"Thử trong Claude" button that opens `claude.ai/new?q=<prompt>` in a new tab, with the exact prompt the demo scripted. Every tile has at least one.

## 5. Per-tile template

Each `/claude/[feature]` page uses the same vertical rhythm:

1. **Title + one-line answer** — what this is, in one Vietnamese sentence.
2. **Hero demo** — full-width `DemoCanvas` wrapping a `ClaudeDesktopShell` with `AnnotationLayer`. Runs automatically on intersect, looped with a 2s pause.
3. **"Cách nó hoạt động"** — 3–5 annotated still frames that freeze the demo at key moments, each with a Vietnamese explanation.
4. **"Thử ngay"** — `DeepLinkCTA` with a seeded prompt. For features that can't be deep-linked (e.g. Skills, MCP), link to the Anthropic doc instead.
5. **"Liên quan"** — 2–3 cross-links to sibling tiles.

Per-tile LOC budget: 250–500. Total guide LOC budget: ~8000.

## 6. Visual identity

- **Direction B (chosen):** DS chrome stays clean (Perplexity × MoMo tokens preserved). Demos unleash inside their `DemoCanvas` boxes with Anthropic-native Claude colors and textures, so the demos *look like Claude* while the surrounding page *looks like our DS*.
- Hero accent: `AccentHueSweep` component — animated conic gradient clipped to text on "hình ảnh và ví dụ". ~3s cycle, `prefers-reduced-motion` → static warm gradient.
- The ✳ mark above the H1 is removed.
- Shelf section on `/claude` uses a subtle warm wash (`--paper` → `--paper-warm`) to differentiate from homepage without introducing new colors.

## 7. Dark mode

Every shell, annotation layer, and demo script ships with a dark-mode token map that matches Claude Desktop's actual dark theme (verified against claude.ai dark mode on 2026-04-18). No half-converted surfaces.

## 8. Accessibility

- All demos are keyboard-operable; focus visible at all times.
- Reduced motion → static annotated final frame.
- All annotation pins have visible labels and ARIA descriptions (not just tooltip).
- Contrast: 4.5:1 for text, 3:1 for UI elements, in both themes.
- Every deep-link CTA is a real `<a>` with `target="_blank"` and `rel="noopener"`.

## 9. Testing

- Unit: `AccentHueSweep` respects reduced motion; `ClaudeDesktopShell` renders all slot variants; `AnnotationLayer` shows/hides pins on `showAt`; `DeepLinkCTA` URL-encodes correctly.
- Integration: hub page renders 24 tiles with 24 working links; each feature page statically pre-renders; navbar link works.
- Manual: spot-check 5 tiles against the real Claude Desktop UI for fidelity.

## 10. Build phasing

**Phase 0 — ship pending work** (before starting this project):
Ship the four landed-but-not-shipped batches (topic-page SSR fix, small UX bundle, interactive wave-1, section-uniqueness fix) so they don't entangle with the new tree.

**Phase 1 — foundation (~1500 LOC):**
- `ClaudeDesktopShell`, `AnnotationLayer`, `DemoCanvas`, `DeepLinkCTA`
- `AccentHueSweep` + hero changes on homepage
- `ClaudeHeroCard` + navbar link
- `/claude` hub shell with 24 placeholder tile cards (unimplemented tiles render a "Đang xây dựng" state, not a 404)

**Phase 2 — Shelf 1 (~2500 LOC):** 8 starter tiles, easiest to simulate (chat streaming, projects, artifacts, files-vision, voice, web-search, claude-design, chrome).

**Phase 3 — Shelf 2 (~2500 LOC):** 8 power-user tiles. MCP and workspace integrations are the hardest; schedule them last in this phase.

**Phase 4 — Shelf 3 (~2500 LOC):** 8 developer tiles. Claude Code and sub-agents need the richest demos.

Each phase lands as its own PR with tests. No mega-PR.

## 11. Non-goals / deferred

- Teaching the Anthropic API in depth — developer tiles show one representative demo each, with link-outs to `platform.claude.com/docs` for the full reference rather than full reimplementations.
- Replacing or retiring existing profession paths.
- Animated shader backgrounds (explicitly rejected).
- Real API calls from any demo (everything scripted).

## 12. Open micro-decisions deferred to implementation

- Whether shelves are anchor-linked (`/claude#starter`) or tabs (`?shelf=starter`) — pick during Phase 1 based on what looks clearer once the tiles are in.
- Exact Claude Desktop UI snapshot date — pin to 2026-04-18 and call out in the shell component's doc comment so future drift is visible.
- Whether `/claude/claude-design` shows the Apr 17 2026 product (just launched) — yes, but with a "Mới · Apr 17 2026" badge.

## 13. Risks

- **Fidelity drift:** Claude Desktop's UI evolves; our replica will go stale. Mitigation: one pinned snapshot date in the shell component, reviewed quarterly.
- **Scope creep from "every feature":** 24 tiles is the ceiling. New features go to a second session.
- **Reduced-motion regressions:** Every new demo must be tested with `prefers-reduced-motion: reduce`. Bake into the `DemoCanvas` contract so it can't be forgotten.

## 14. Success criteria

- A learner who reads Shelf 1 can open Claude Desktop and use chat, projects, artifacts, files, voice, web search, Claude Design, and Chrome extension without additional instructions.
- All 24 feature pages statically pre-render (no client-side bailout).
- Homepage Lighthouse (perf / a11y / best-practices) stays at or above current numbers.
- No change to existing profession-path flows.
