# Design critique — udemi.tech (Vietnamese AI for Beginner)

Snapshot review of the site as of branch `claude/design-critique-feedback-EOfaZ`. Findings are ordered by impact, not severity. Each item links the file(s) most worth opening if you want to act on it.

---

## What's working

1. **Pedagogical structure is the product.** The 8-step topic template (`src/topics/_template.tsx`) — PredictionGate → analogy → visualization → AhaMoment → InlineChallenge → explanation → MiniSummary → QuizSection — is genuinely good learning design. It is also the reason the 47-component `src/components/interactive/` library pays off: contributors compose, they don't reinvent.

2. **Vietnamese-first typography is meticulous.** `src/app/globals.css` ships Inter Tight at 15px / 1.65 line-height with Vietnamese subsets across all four font families. Diacritics breathe. Most Vietnamese sites don't bother.

3. **Borrowing tokens from Perplexity × MoMo was the right call.** The palette, spacing scale, and shadow ramps in `globals.css` (`--paper`, `--turquoise-*`, `--space-*`) look polished without bikeshedding. Remotion mirrors them in `remotion/tokens.ts` — rare discipline for marketing assets.

4. **Anonymous-auth + gesture-gated writes** (`src/lib/database.ts`, `/api/ensure-session`) is the right UX/abuse trade-off for a public learning site. Supabase RLS + BotID is more security hygiene than most edtech ships.

5. **Path-aware next/prev** (`src/lib/paths.ts`): when a learner enters a topic via `?path=student`, navigation respects the curated sequence rather than the topic's category graph. Small detail, large UX win.

---

## Highest-impact issues

### 1. Reduced-motion support is half-finished
`prefers-reduced-motion` is referenced in comments but Framer Motion animations fire regardless of the user preference. For a site whose value prop is *interactive visualization*, this is the most defensible accessibility gap to close first. Suggested: a `useReducedMotion()` hook (Framer ships one) wired into the shared `interactive/` primitives so authors get correct behavior for free.

### 2. Design-token debt across the topic surface
The home page uses the new DS tokens (`--paper`, `--space-*`); most topic pages still reference the older `--r-*` / `--bg-*` set. Both render correctly, but new contributors are picking whichever they see first, and the inconsistency will compound. Either finish the migration in one pass or codemod the legacy tokens — leaving both alive is the worst option.

### 3. 260 topics hardcoded in JSX has a ceiling
`src/topics/*.tsx` is fast to author *today* and impossible to bulk-edit *tomorrow*. A single typo across a category requires a code push. You don't need a CMS yet, but you do need:
   - a lint rule that enforces the `TopicMeta` shape and required fields,
   - a script that validates `relatedSlugs` against the registry (broken links silently exist today),
   - an extraction plan for the prose body so future translators / editors aren't editing TSX.

### 4. Title/metadata language asymmetry
Slugs and `title` are English; `titleVi`, descriptions, and body are Vietnamese. SEO benefits from this, but Open Graph cards, share previews, and `<title>` tags risk mixing languages depending on which field is read. Audit `src/app/topics/[slug]/page.tsx` and any `generateMetadata` to confirm the public-facing string is always `titleVi`.

---

## Medium-impact

5. **Dual-nav on mobile.** Navbar + BottomNav coexist; on narrow viewports the redundancy reads as clutter. Pick one as the primary on `<sm` and demote the other to overflow.

6. **No bundle/perf budget.** The topic registry imports all 260 metadata at build time. That's fine for metadata, but verify topic *components* are route-split (they should be via the `[slug]` dynamic import — confirm in a `next build` output). No Lighthouse numbers in the README means regressions land silently.

7. **Test coverage is opaque.** Vitest is configured; only a handful of test files exist. The interactive primitives (`DragDrop`, `MatchPairs`, `QuizSection`) are exactly the kind of stateful UI that benefits most from regression tests. Pick the 5 most-reused primitives and require tests on PRs that touch them.

8. **No i18n scaffolding.** Vietnamese-only is a deliberate product decision and that's fine. But if English ever ships, retrofitting `next-intl` across 260 hardcoded TSX files will be painful. At minimum, route Vietnamese strings through a `t()` helper now, even if it's the identity function — it costs nothing today and saves a rewrite later.

---

## Small but worth fixing

9. `lib/database.ts` is marked `"use client"` because the Supabase JS client is browser-only. Reads that don't need auth (e.g. public progress counts, if any exist) could move to a server route and skip shipping the Supabase SDK to the client.

10. The `/claude` vertical is well-scoped but discoverable only through the navbar. Consider cross-linking from the Office Worker path's intro — it's the natural funnel.

11. Skip-link target (`#main-content`) is wired, but verify it actually receives focus on activation; many App Router setups break this when the layout re-mounts.

---

## What I'd do this week vs. this quarter

**This week** (low-effort, high-trust):
- Wire `useReducedMotion()` into `interactive/` primitives.
- Add a `validate-topics.ts` script: required fields + `relatedSlugs` resolve.
- Audit `generateMetadata` to ensure `titleVi` is the canonical public title.

**This quarter** (structural):
- Finish the design-token migration; delete the legacy `--r-*` / `--bg-*` set.
- Decide on the dual-nav pattern (one wins on mobile).
- Establish a perf budget + Lighthouse CI on PRs.
- Extract topic prose from TSX into something diff-friendly (MDX is the obvious fit and keeps interactive components inline).

---

*Critique scope: code, content structure, and architecture only. A visual design audit (spacing rhythm, type scale in production, hover/focus states, dark-mode parity) needs eyes on the live site and is best done as a separate pass.*
