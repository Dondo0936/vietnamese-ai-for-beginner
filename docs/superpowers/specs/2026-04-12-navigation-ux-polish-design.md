# Navigation & UX Polish Design

**Status:** Draft for review
**Author:** assistant (reviewed by user)
**Date:** 2026-04-12
**Follows from:** `2026-04-12-kids-learning-path-design.md` (Phase 1 complete), A+B path-aware navigation (merged `7106df0`)

---

## Goal

Ship a focused bundle of audit fixes — remaining audit items C + D plus all 12 `TopicTOC` issues — in one phase. After this, the topic rail works on every topic, duplicate DOM IDs are gone, dead components are removed, and all Vietnamese strings read naturally.

## Non-goals

- Redesigning the TOC rail visuals
- Kids-path TOC (0 kids topics exist today — that's a Phase 3 decision)
- Adding a TOC to non-topic pages
- Path-aware navigation changes (A+B shipped in `7106df0`)

## Context / why now

The A+B fix made path-aware navigation work, but topic pages still have two structural problems surfaced by the audit:

1. **The in-topic TOC rail is dead.** Every topic ships `<TopicTOC>`, but it attaches its IntersectionObserver before `next/dynamic` resolves the topic body, so the targets it's looking for don't exist yet. All 196 topics have a silent dead rail.
2. **Section IDs duplicate inside a single topic.** 36 topics render more than one `<VisualizationSection>`, 24 render more than one `<ExplanationSection>`. Each sets a static `id="visualization"` / `id="explanation"`, so the DOM has duplicate IDs, which breaks anchor jumps and hash-state.

Plus smaller items: `AnalogyCard` is dead code (0 production uses across 196 files), 8 topics are missing a `<VisualizationSection>` entirely, the TOC mislabels a section ("Ví dụ" where topics actually use "Dự đoán"), no `useReducedMotion`, no a11y landmarks, and a handful of residual code-switch strings.

## Architecture — three decisions

### Decision 1: Lift TOC item list into `TopicMeta`

Topic metadata declares what sections exist via an optional field:

```ts
// src/lib/types.ts
export type TocSectionId = "visualization" | "explanation";
export interface TocSection {
  id: TocSectionId;
  labelVi: string; // "Trực quan", "Giải thích", etc.
}

export interface TopicMeta {
  // ...existing fields
  tocSections?: TocSection[]; // default applied by TopicLayout
}
```

`TopicLayout` resolves:
```ts
const DEFAULT_TOC_SECTIONS: TocSection[] = [
  { id: "visualization", labelVi: "Trực quan" },
  { id: "explanation", labelVi: "Giải thích" },
];
const sections = meta.tocSections ?? DEFAULT_TOC_SECTIONS;
```

This solves the hardcoded-3-sections issue (audit #4), handles the 8 viz-less topics (audit #2, override to `[{id:"explanation",...}]`), and fixes the "Ví dụ" mislabel (audit #6, labels live in metadata now).

**Why this over a MutationObserver-only fix:** topic metadata is the source of truth for what the page contains. Having the TOC derive its list from `querySelectorAll` is a code smell — it couples the TOC to rendering order and live DOM state. Declarative metadata is simpler and robust under SSR, dynamic imports, and lazy children alike.

### Decision 2: `TopicTOC` becomes a pure renderer

```ts
interface TopicTOCProps {
  sections: TocSection[];
}
```

Render list comes from the prop. Observer watches the section IDs from the prop. The hardcoded `[{ id: "analogy", label: "Ví dụ" }, ...]` inline array goes away.

Active-section highlighting still uses `IntersectionObserver`, but with one change: **bounded retry via `MutationObserver`**. On mount:

1. For each section ID, call `document.getElementById(id)`
2. For found elements, attach IntersectionObserver immediately
3. For missing elements, set up a `MutationObserver` on `document.body` (subtree) that re-queries on each mutation. When an ID appears, attach the observer.
4. Time-bound the retry: after 3 seconds, disconnect the mutation observer. If an ID still hasn't appeared, that TOC row stays un-highlighted (acceptable degradation; TOC link still scrolls correctly via anchor).

Also added:
- `useReducedMotion()` — skip pill-wiggle animations (audit #7)
- `role="navigation"` + `aria-label="Mục lục bài học"` + `aria-current="location"` on active section (audit #8)

### Decision 3: One-section-per-type refactor (60 topics)

For each of the 36 + 24 topics with duplicate sections:

- **If the duplicates share intent** (e.g., two viz demos for one concept) → merge into one `<VisualizationSection>` with both demos inside, or split-tab them
- **If the duplicates are progressive** (intro demo + deep demo) → merge into one section with a collapsible or tabbed inner layout
- **If one is actually an inline illustration that got wrapped in `VisualizationSection`** → swap it for `<InlineChallenge>` or raw JSX

The plan enumerates each of the 60 topics with a per-topic call. Content doesn't change — containers do.

This eliminates duplicate IDs at the source, preserves the topic-files-are-free-form principle (experts still write whatever they want inside the sections), and keeps the TOC's one-per-type mental model honest.

## Data flow

```
TopicMeta { tocSections?: TocSection[] }
   ↓
TopicLayout (resolves DEFAULT if meta.tocSections is undefined)
   ↓ passes sections={...} prop
TopicTOC (pure renderer, observer keyed on section IDs)
   ↓ observes DOM
<VisualizationSection id="visualization">…</VisualizationSection>
<ExplanationSection id="explanation">…</ExplanationSection>
```

## Error handling

| Failure | Behavior |
|---|---|
| `meta.tocSections` is `undefined` | Use `DEFAULT_TOC_SECTIONS` |
| `meta.tocSections` is `[]` | TOC rail doesn't render (topic opted out) |
| Target ID never mounts (e.g., typo in meta) | TOC entry renders, bounded retry fails, entry stays un-highlighted — anchor jump still works |
| Reduced motion | Skip pill-wiggle animations; progress dot static |
| Duplicate IDs post-refactor (shouldn't happen) | Dev-mode `console.warn` during render; TOC picks the first element; plan's regression test guards against recurrence |

## Components in scope

**Code changes:**
- `src/lib/types.ts` — add `TocSection`, `TocSectionId`, extend `TopicMeta`
- `src/components/topic/TopicTOC.tsx` — rewrite (sections prop, retry observer, reduced-motion, a11y)
- `src/components/topic/TopicLayout.tsx` — resolve `sections` and pass as prop
- `src/components/topic/AnalogyCard.tsx` — **DELETE**
- `src/topics/_template.tsx` — remove AnalogyCard import/example
- `src/components/interactive/index.ts` — drop AnalogyCard re-export (if any)

**Mechanical topic refactor (60 files):**
- 36 topics with >1 `<VisualizationSection>` → merge to one
- 24 topics with >1 `<ExplanationSection>` → merge to one
- 8 topics missing `<VisualizationSection>` → plan lists each, chooses "add viz" vs "override tocSections"

**String fixes (D):**
- Grep-pass for code-switch instances in Vietnamese topic titles/descriptions; fix any obvious English-in-Vietnamese or vice versa
- Verify `epochs-batches.titleVi` — currently `"Epoch và Batch"`, confirm audit's concern is addressed or document the exact remaining issue

**C (mobile truncation) residual:**
- Verified: A+B's `break-words` swap handles prev/next cards. Back-label `truncate` (line 155) is short Vietnamese ("Quay lại…") — no action unless user re-reports.

**Tests:**
- `src/__tests__/topic-toc.test.tsx` — TopicTOC unit tests (sections prop, retry observer, reduced motion, a11y)
- `src/__tests__/topic-layout-toc-resolution.test.tsx` — TopicLayout resolves default vs override
- `src/__tests__/topic-meta-toc-sections.test.ts` — type-level sanity for optional field
- Existing 78 tests must keep passing

## Testing strategy

**Unit (vitest + RTL):**
1. `TopicTOC` renders N rows from `sections` prop (not hardcoded)
2. When all target elements exist on mount, observer attaches and active row highlights
3. When target elements arrive late (simulated via MutationObserver), TOC retries and highlights
4. When target never arrives (3s timeout), TOC stops retrying; rows render but none active
5. Under `useReducedMotion() === true`, no animation classes applied
6. a11y landmarks present (`role="navigation"`, `aria-label`, `aria-current`)

**Integration:**
7. `TopicLayout` passes `DEFAULT_TOC_SECTIONS` when `meta.tocSections` undefined
8. `TopicLayout` passes `meta.tocSections` verbatim when provided
9. Topic smoke test: one topic per category, TOC renders + clicks scroll to sections

**Regression:**
10. All 78 existing tests pass

## YAGNI decisions

- No section-reordering via TOC drag
- No "jump to top" in TOC (back-to-top already exists)
- No per-section progress indicators
- No TOC customization per learning path
- No mobile TOC (current design hides `<lg`; unchanged)
- Custom TOC labels per section stay at topic-meta level — no per-path override

## Migration / rollout

- All changes ship in one phase.
- `tocSections` is optional → existing topics still render identically (default path).
- AnalogyCard deletion is hard-remove: grep-verified no consumers.
- Topic refactor is mechanical; each commit is one topic or one small batch.
- No feature flag.

## Risks

| Risk | Mitigation |
|---|---|
| Refactor merges break one topic's content meaning | Manual review per topic during refactor; smoke-test by visiting each topic post-merge |
| MutationObserver performance regression | Bound subtree watch to `document.body`, disconnect after 3s, detach after all IDs found |
| Some topic has 3+ duplicate sections (worse than audit counted) | Plan step re-runs the duplicate-ID counter as a pre-check; if count increased, investigate |
| Breaking change to `TopicMeta` public shape | Field is optional; no existing caller breaks |

## Self-review

- **Placeholders:** none — every change traces to a specific audit item
- **Internal consistency:** one `TopicMeta` field, one component rewrite, one mechanical refactor, all agree
- **Scope:** single phase, ~1-2 days of work. Plan will decompose into ~15-20 bite-sized tasks
- **Ambiguity:** per-topic refactor calls need case-by-case judgment — flagged in the plan as "read topic, pick merge strategy, apply, smoke-test"

## Links

- Audit for A+B + C + D: inline in prior session (commit `7106df0`)
- Audit for TopicTOC (12 items): verified in prior session, see summary
- User preferences:
  - Topic files are free-form for experts; color tokens + navbar carry identity
  - Kids path is visualization-first (doesn't apply to this adult-path phase)
