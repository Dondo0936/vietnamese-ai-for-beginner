# Contracts

**Read this before editing a topic file, a primitive, or `registry.ts`.**

Every invariant below is enforced by `src/__tests__/contracts.test.ts`.
`npm test` must be green before every ship. Codemods and audits come and
go — these contracts are the thing future agents can trust.

---

## 1. Metadata parity — `registry.ts` is the source of truth for SEO

**Rule.** For every `src/topics/<slug>.tsx`, the exported `metadata` object
**must match** the entry for that slug in `src/topics/registry.ts` on the
SEO-visible fields: `titleVi`, `description`, `difficulty`, `category`.

**Why.** `src/app/topics/[slug]/page.tsx`'s `generateMetadata` reads
`getTopicBySlug(slug)` which reads `registry.ts`. The per-file `metadata`
export is *useful local redundancy* (IDE completion, refactor-safe TopicMeta
typing) but is dead code at the HTML/SEO layer. When the two diverge, the
`<title>` tag and Open Graph card show the registry value — never the file
value. Discovered 2026-04-19 after 30 Opus agents rewrote Student-path
titleVi without touching registry.ts, producing ~60 ghosted titles.

**How to apply.**
- Editing a topic's `titleVi` or `description`? Update **both** the topic
  file's metadata export AND the matching entry in `registry.ts`.
- Changing `difficulty` or `category`? Same — both.
- Adding a new topic? Export metadata from the .tsx file AND push an entry
  into `registry.ts` AND wire the slug into the relevant `STAGES` array in
  `src/lib/paths.ts`. Three files, single atomic commit.

**Enforced by.** `contracts.test.ts` → `metadata parity with registry`.

---

## 2. Difficulty monotonicity within a stage

**Rule.** Within any path stage (`STUDENT_STAGES[i].slugs`, `OFFICE_STAGES`,
`AI_ENGINEER_STAGES`, `AI_RESEARCHER_STAGES`), the registry's `difficulty`
value must be **non-decreasing** slug-over-slug. `beginner` → `intermediate`
→ `advanced` is fine. `intermediate` → `beginner` is not.

**Why.** A learner walking a stage left-to-right should never drop down in
difficulty. Back-steps make the pacing feel arbitrary and confuse students
who track their own level. Found 2026-04-19: `gradient-descent` (beginner)
after `backpropagation` (intermediate).

**How to apply.**
- Before reordering a stage or bumping a topic's difficulty, check the
  neighbors.
- If a back-step is intentional (e.g., a remedial topic inside an advanced
  stage), split into a new stage.

**Enforced by.** `contracts.test.ts` → `difficulty monotonic per stage`.

---

## 3. Primitive invariants

### 3.1 `InlineChallenge` must have a retry

**Rule.** After a wrong answer, render a "Thử lại" button that clears
`selected` and re-enables all option buttons. After a correct answer, no
retry (celebrate and move on).

**Why.** Used 74+ times in Student path. Lock-after-first-click = a single
mis-tap bricks the widget with no recovery.

**Enforced by.** `contracts.test.ts` → `InlineChallenge retry flow`.

### 3.2 `SliderGroup` should expose a reset

**Rule.** When passed `showReset={true}` (or by default — see the component
docstring), render a reset button that restores every slider to its
`defaultValue`.

**Why.** Sliders seed once from `defaultValue` and had no way back. Affects
derivatives-intuition, knn, logistic-regression, decision-trees, etc.

**Enforced by.** `contracts.test.ts` → `SliderGroup reset restores defaults`.

### 3.3 Draggable SVG circles use `DraggableDot` (44×44 min hitbox)

**Rule.** Do not hand-write `<circle r={5-9} onPointerDown=...>` for
draggable SVG markers. Use `<DraggableDot />` from
`src/components/interactive/DraggableDot.tsx`. It renders a visible circle
at whatever radius you pass, overlaid with an invisible 18-radius hitbox
(36px = WCAG-adjacent). Also handles keyboard (arrow keys), aria-live value
announcements, and pointer/touch parity.

**Why.** Hand-rolled 5-9px radius draggable circles give a 10-18px touch
target — below WCAG 44×44. Hard to hit on phones, impossible for motor-
impaired users. Pattern repeats in linear-regression, logistic-regression,
knn, k-means, eigendecomposition-pca.

**Enforced by.** `contracts.test.ts` → `DraggableDot hitbox ≥ 44px`.

### 3.4 Metric readouts wrap in `MetricReadout` (aria-live)

**Rule.** Any number that updates live (MSE, slope, AUC, variance, loss)
must live inside `<MetricReadout label="..." value={...} />`, which renders
with `aria-live="polite"`. Don't stuff a bare `<span>{val.toFixed(2)}</span>`
next to a slider.

**Why.** Sliders updating MSE/slope/AUC silently change visual numbers —
screen reader users hear nothing. `aria-live="polite"` fixes it in one prop.

**Enforced by.** `contracts.test.ts` → `MetricReadout announces aria-live`.

### 3.5 Root layout wraps children in `<MotionConfig reducedMotion="user">`

**Rule.** `src/app/layout.tsx` renders `<MotionConfig reducedMotion="user">`
at the top of the body. This makes every framer-motion child — including
ones that forgot to call `useReducedMotion()` — respect the OS preference
automatically.

**Why.** 57/65 Student-path files use framer-motion without a reduced-motion
guard. Retrofitting each one is 57 PRs. Wrapping once at root is one PR.

**Enforced by.** `contracts.test.ts` → `root layout wraps MotionConfig`.

### 3.6 `DragDrop` supports pointer/touch events

**Rule.** `src/components/interactive/DragDrop.tsx` responds to pointerdown
/ pointermove / pointerup (not just HTML5 `draggable`), so iOS Safari and
Android Chrome users can complete it. Ported via `@dnd-kit/core` pointer
sensor OR a native pointer-event fallback.

**Why.** HTML5 `draggable` doesn't fire on touchscreens. Used in 7+ Student
topics — entire exercise bricked on phones without this.

**Enforced by.** `contracts.test.ts` → `DragDrop responds to pointer events`.

---

## 4. Content rules (audited, not yet test-enforced)

### 4.1 Color + icon pairing

**Rule.** Any state communicated with red/amber/green **must** also show an
icon: `<Check />` for success, `<AlertTriangle />` for warn, `<X />` or
`<AlertCircle />` for error. Icons live next to the colored text, same
line.

**Why.** ~5% of males have deuteranopia. Color-only is invisible to them.

**How to apply.** Searching for `text-green-` / `text-red-` / `text-amber-`
in a topic file? Check there's a lucide icon nearby in the same element.

### 4.2 Jargon gloss policy (Vietnamese-first)

**Rule.** First use of any English ML/AI term in a topic:
`Bias (độ lệch)` or `hàm mất mát (loss)` — Vietnamese primary, English in
parens, or English primary with Vietnamese in parens, but **consistent
within the topic**. After first use, English alone is fine.

**Why.** Audit 2026-04-19 found three styles across topics
(`gradient-descent` raw, `bias-variance` raw, `feature-engineering` glossed).
Inconsistency breaks reading flow for VN high-schoolers with weak English.

**Template.** `src/topics/feature-engineering.tsx` — copy that style.

### 4.3 `PredictionGate` discipline

**Rule.** Every PredictionGate must:
1. Sit **before** the concept it probes (pre-reveal intuition, not recall).
2. Offer **≥2 plausibly-wrong options** — options a smart but untrained VN
   high-schooler could reasonably pick. If all wrong options are obviously
   wrong, it's not a prediction, it's a checkbox.

**Why.** Audit 2026-04-19: `what-is-ml` and `gradient-intuition` gates
tested recall of the preceding hook. That's a quiz, not a prediction gate.

### 4.4 Mobile: conditional `touch-none` and wide-SVG hints

**Rule.**
- `touch-none` on a draggable element should only be set **during an active
  drag**, not always. Otherwise one-finger scroll breaks near the element.
- SVGs with `min-width > 640px` inside `overflow-x-auto` **must** show a
  scroll-hint gradient (right-edge fade) OR stack as rows below 640px.

**Why.** Users get "stuck" past tall SVGs on phones. No indicator that
content continues right of the viewport.

**Known offenders (fix these first).**
- `src/topics/data-and-datasets.tsx:164`
- `src/topics/llm-overview-in-chat-assistants.tsx:205`
- `src/topics/recommendation-systems.tsx:192`
- `src/topics/ensemble-methods.tsx:978`
- `src/topics/rlhf.tsx:426`

### 4.5 Hardcoded hex → CSS tokens

**Rule.** No `#3b82f6`, `#ef4444`, `#10b981`, `#f59e0b`, `#6b7280` in topic
files. Use `var(--color-accent)`, `var(--color-danger)`,
`var(--color-success)`, `var(--color-warning)`, `var(--color-muted)`. Other
hex values can stay if they're genuinely topic-specific (a chart palette,
a brand color).

**Why.** 620+ hex across 30+ files means theme changes require a sweep
rather than one edit.

### 4.6 SVG label `fontSize`

**Rule.** `fontSize` attribute on `<text>` inside an SVG should use `em`
(e.g. `fontSize="0.75em"`) rather than raw pixels, so labels scale with the
viewport on phones.

**Known offenders.** ~30 files use `fontSize="10"` or `fontSize="9"` —
these become illegible below 400px viewBox width.

---

## 4.7. Landing page (`/`) vs. catalog (`/browse`)

**Rule.** Since 2026-04-19 the root route `/` is the **marketing landing
page** (`src/components/landing/Landing.tsx`). The **topic catalog** —
filters, category chips, topic grid, load-more — lives at **`/browse`**
(`src/components/browse/BrowseContent.tsx`). The two MUST stay separate:
don't fold the catalog back into the landing, don't move marketing
sections into `/browse`.

**Why.** The landing page's only job is to convert — headline + hero
demo + search-prompt + paths + social proof + CTA. Mixing a 200-row
topic grid into that flow drowns the signal. The previous home tried
both at once and the page hit 8000px of vertical scroll; after the
redesign the landing is ~6 screens and `/browse` is a dedicated utility
surface. Discovered 2026-04-19 during the Landing Page.html redesign.

**How to apply.**
- New marketing copy → new section component in `src/components/landing/`.
- New catalog affordance (filter, sort, pagination) → `BrowseContent.tsx`.
- Footer on the landing **MUST NOT** carry "Built with Claude Opus 4.7"
  nor "Type: Space Grotesk · Inter Tight · Be Vietnam Pro" — those were
  explicitly removed. Keep only the © + MIT License line.
- Landing search input is a **plain catalog search** (placeholder starts
  with "Tìm chủ đề —"); it is NOT an AI-prompt box. On focus it routes
  to `/browse` where the real ⌘K palette lives.

**Contract enforcement.**
`src/__tests__/landing-page.test.tsx` (10 tests) +
`src/__tests__/browse-page.test.tsx` (4 tests).

---

## 5. Running the contract suite

```bash
npm test -- --reporter=verbose src/__tests__/contracts.test.ts
```

Every row above maps to one `describe` block. A failing test names the
contract and the offending file. Fix the file, not the test.

If you add a new contract: write the test first (RED), commit the
contract doc update, add the enforcement, verify GREEN.
