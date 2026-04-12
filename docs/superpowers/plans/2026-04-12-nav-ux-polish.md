# Navigation & UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the dead `TopicTOC` rail, eliminate duplicate section IDs across 60 topics, delete dead `AnalogyCard`, cover 8 viz-less topics, and clean up residual code-switch strings — all in one focused phase.

**Architecture:** `TopicMeta` declares `tocSections` (default = visualization + explanation). `TopicTOC` becomes a pure renderer receiving the list as a prop, with a bounded `MutationObserver` retry so its `IntersectionObserver` survives the `next/dynamic` mount race. Section components (`VisualizationSection`, `ExplanationSection`) consume a `SectionDuplicateGuard` context and emit a dev-mode `console.warn` on second instance. The 60 duplicate-ID topics are refactored with a uniform mechanic: wrap each duplicate in a `<LessonSection label="…" step={N}>` under one outer section. `_template.tsx` carries the pattern so future contributors copy it by default.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5.9, Tailwind v4, vitest 4 + @testing-library/react 16, framer-motion.

---

## File Structure

**New files (3):**
- `src/components/topic/SectionDuplicateGuard.tsx` — React context + hook for detecting duplicate section instances per-topic
- `src/__tests__/section-duplicate-guard.test.tsx` — guard unit tests
- `src/__tests__/topic-toc.test.tsx` — TOC rewrite unit tests

**Modified files (7):**
- `src/lib/types.ts` — add `TocSectionId`, `TocSection`, extend `TopicMeta`
- `src/components/topic/TopicTOC.tsx` — complete rewrite
- `src/components/topic/TopicLayout.tsx` — resolve `sections`, pass prop, wrap body in guard
- `src/components/topic/VisualizationSection.tsx` — consume guard
- `src/components/topic/ExplanationSection.tsx` — consume guard
- `src/topics/_template.tsx` — remove AnalogyCard, add multi-demo pattern example
- `src/__tests__/topic-layout.test.tsx` — add mock for `meta.tocSections` default path
- `src/__tests__/topic-layout-path-aware.test.tsx` — same

**Deleted files (1):**
- `src/components/topic/AnalogyCard.tsx`

**Refactor-only files (60 topics, content preserved, containers reshaped):**
- 36 topics with >1 `<VisualizationSection>`: activation-functions, autoencoder, backpropagation, bag-of-words, bias-variance, cnn, confusion-matrix, context-window, convolution, diffusion-models, fine-tuning, flash-attention, gan, gru, kv-cache, llm-overview, lstm, multi-head-attention, nerf, overfitting-underfitting, pooling, positional-encoding, prompt-engineering, rag, residual-connections, rnn, scaling-laws, self-attention, sentiment-analysis, temperature, tf-idf, top-k-top-p, transfer-learning, u-net, vae, vision-transformer
- 24 topics with >1 `<ExplanationSection>`: adversarial-robustness, ai-for-data-analysis, ai-for-writing, ai-governance, ai-privacy-security, ai-tool-evaluation, ai-watermarking, alignment, bias-fairness, clip, constitutional-ai, deepfake-detection, explainability, getting-started-with-ai, guardrails, python-for-ml, red-teaming, speech-recognition, text-to-image, text-to-video, tlm, tts, unified-multimodal, vlm
- 8 viz-less topics (decide per-topic: add viz OR set `tocSections` to explanation-only): ai-in-agriculture, ai-in-education, ai-in-finance, calculus-for-backprop, information-theory, linear-algebra-for-ml, perceptron, probability-statistics

---

## Task 1: Extend `TopicMeta` with optional `tocSections`

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add types and extend `TopicMeta`**

Replace the existing types file content with:

```ts
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type VizType = "interactive" | "static";

export type TocSectionId = "visualization" | "explanation";

export interface TocSection {
  id: TocSectionId;
  labelVi: string;
}

export interface TopicMeta {
  slug: string;
  title: string;
  titleVi: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: Difficulty;
  relatedSlugs: string[];
  vizType: VizType;
  icon?: string;
  /**
   * Controls which entries the TopicTOC rail renders for this topic.
   * If omitted, TopicLayout falls back to DEFAULT_TOC_SECTIONS
   * (visualization + explanation). Topics without a VisualizationSection
   * should set this to `[{ id: "explanation", labelVi: "Giải thích" }]`.
   */
  tocSections?: TocSection[];
}

export interface Category {
  slug: string;
  nameVi: string;
  icon: string;
  description: string;
}

export interface UserProgress {
  readTopics: string[];
  bookmarks: string[];
  lastVisited: string | null;
}
```

- [ ] **Step 2: Typecheck passes**

Run: `npx tsc --noEmit`
Expected: exits 0, no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add TocSection to TopicMeta for per-topic TOC control"
```

---

## Task 2: Create `SectionDuplicateGuard` context + hook (TDD)

**Files:**
- Create: `src/components/topic/SectionDuplicateGuard.tsx`
- Create: `src/__tests__/section-duplicate-guard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/section-duplicate-guard.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import {
  SectionDuplicateGuard,
  useSectionGuard,
} from "@/components/topic/SectionDuplicateGuard";

// Minimal consumer that calls the hook and renders nothing visible.
function ProbeSection({ id }: { id: "visualization" | "explanation" }) {
  useSectionGuard(id, "test-topic-slug");
  return <div data-section-id={id} />;
}

describe("SectionDuplicateGuard", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("stays silent when a section id appears exactly once", () => {
    render(
      <SectionDuplicateGuard>
        <ProbeSection id="visualization" />
        <ProbeSection id="explanation" />
      </SectionDuplicateGuard>
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns on the second instance of the same section id", () => {
    render(
      <SectionDuplicateGuard>
        <ProbeSection id="visualization" />
        <ProbeSection id="visualization" />
      </SectionDuplicateGuard>
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const msg = String(warnSpy.mock.calls[0][0]);
    expect(msg).toContain("visualization");
    expect(msg).toContain("test-topic-slug");
  });

  it("tracks visualization and explanation independently", () => {
    render(
      <SectionDuplicateGuard>
        <ProbeSection id="visualization" />
        <ProbeSection id="explanation" />
        <ProbeSection id="visualization" />
        <ProbeSection id="explanation" />
      </SectionDuplicateGuard>
    );
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("is a no-op when used outside a provider (no warn, no crash)", () => {
    render(<ProbeSection id="visualization" />);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/section-duplicate-guard.test.tsx`
Expected: FAIL — "Cannot find module '@/components/topic/SectionDuplicateGuard'"

- [ ] **Step 3: Create the component**

Create `src/components/topic/SectionDuplicateGuard.tsx`:

```tsx
"use client";

import { createContext, useContext, useRef } from "react";
import type { TocSectionId } from "@/lib/types";

interface SectionGuardContextValue {
  recordSection: (id: TocSectionId, slug: string) => void;
}

const SectionGuardContext = createContext<SectionGuardContextValue | null>(null);

export function SectionDuplicateGuard({ children }: { children: React.ReactNode }) {
  const seen = useRef<Record<TocSectionId, number>>({ visualization: 0, explanation: 0 });

  const recordSection = (id: TocSectionId, slug: string) => {
    seen.current[id] += 1;
    if (seen.current[id] > 1 && process.env.NODE_ENV !== "production") {
      console.warn(
        `[SectionDuplicateGuard] Topic "${slug}" renders more than one <${id === "visualization" ? "VisualizationSection" : "ExplanationSection"}/>. ` +
        `Wrap duplicates in <LessonSection label="…" step={N}> inside a single outer section instead. ` +
        `See src/topics/_template.tsx for the pattern.`
      );
    }
  };

  return (
    <SectionGuardContext.Provider value={{ recordSection }}>
      {children}
    </SectionGuardContext.Provider>
  );
}

/**
 * Called by VisualizationSection / ExplanationSection on each render.
 * No-op when used outside a SectionDuplicateGuard provider.
 */
export function useSectionGuard(id: TocSectionId, slug: string) {
  const ctx = useContext(SectionGuardContext);
  // Record during render so the counter runs on every mount (incl. test cases
  // that render multiple sections in one tree).
  if (ctx) {
    ctx.recordSection(id, slug);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/section-duplicate-guard.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/topic/SectionDuplicateGuard.tsx src/__tests__/section-duplicate-guard.test.tsx
git commit -m "feat(topic): SectionDuplicateGuard context + hook for dev-mode dup warnings"
```

---

## Task 3: Wire `VisualizationSection` + `ExplanationSection` to the guard

**Files:**
- Modify: `src/components/topic/VisualizationSection.tsx`
- Modify: `src/components/topic/ExplanationSection.tsx`

- [ ] **Step 1: Update `VisualizationSection.tsx`**

Replace the file with:

```tsx
"use client";

import { Eye } from "lucide-react";
import { useSectionGuard } from "./SectionDuplicateGuard";

interface VisualizationSectionProps {
  children: React.ReactNode;
  /** Topic slug — used in dev-mode duplicate-section warnings. Optional for backwards compat. */
  topicSlug?: string;
}

export default function VisualizationSection({
  children,
  topicSlug = "unknown",
}: VisualizationSectionProps) {
  useSectionGuard("visualization", topicSlug);
  return (
    <section id="visualization" className="my-8 scroll-mt-20">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Eye size={20} className="text-accent" />
        Hình minh họa
      </h2>
      <div className="rounded-xl border border-border bg-card p-6">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `ExplanationSection.tsx`**

Replace the file with:

```tsx
"use client";

import { BookOpen } from "lucide-react";
import { useSectionGuard } from "./SectionDuplicateGuard";

interface ExplanationSectionProps {
  children: React.ReactNode;
  /** Topic slug — used in dev-mode duplicate-section warnings. Optional for backwards compat. */
  topicSlug?: string;
}

export default function ExplanationSection({
  children,
  topicSlug = "unknown",
}: ExplanationSectionProps) {
  useSectionGuard("explanation", topicSlug);
  return (
    <section id="explanation" className="my-8 scroll-mt-20">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <BookOpen size={20} className="text-accent" />
        Giải thích
      </h2>
      <div className="space-y-4 text-foreground/90 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: 82/82 passing (existing 78 + 4 new guard tests).

- [ ] **Step 4: Commit**

```bash
git add src/components/topic/VisualizationSection.tsx src/components/topic/ExplanationSection.tsx
git commit -m "feat(topic): VisualizationSection + ExplanationSection opt into dup guard"
```

---

## Task 4: Delete `AnalogyCard` + update `_template.tsx`

**Files:**
- Delete: `src/components/topic/AnalogyCard.tsx`
- Modify: `src/topics/_template.tsx`
- Modify: `src/components/interactive/index.ts` (if AnalogyCard is re-exported)

- [ ] **Step 1: Verify no import exists outside `_template.tsx`**

Run:
```bash
grep -rn "AnalogyCard" src/ --include="*.tsx" --include="*.ts"
```

Expected: hits only in `src/components/topic/AnalogyCard.tsx`, `src/topics/_template.tsx`, and possibly `src/components/interactive/index.ts`. No other consumers.

- [ ] **Step 2: Delete the component file**

Run: `rm src/components/topic/AnalogyCard.tsx`

- [ ] **Step 3: Clean up `_template.tsx`**

Read `src/topics/_template.tsx`, remove:
- any `import { AnalogyCard } from ...` line
- any `<AnalogyCard>...</AnalogyCard>` JSX usage

Then add (near the top-of-file JSDoc, or as a commented block above the `export default function` body) a documentation comment establishing the one-section-per-type rule:

```tsx
/**
 * TOPIC CONTRIBUTOR GUIDE
 *
 * 1. Each topic renders AT MOST ONE <VisualizationSection> and ONE <ExplanationSection>.
 *    Need multiple demos? Wrap them in <LessonSection label="…" step={N}> INSIDE
 *    the outer section:
 *
 *    <VisualizationSection topicSlug={metadata.slug}>
 *      <LessonSection label="Demo cơ bản" step={1}>
 *        <FirstDemo />
 *      </LessonSection>
 *      <LessonSection label="Demo nâng cao" step={2}>
 *        <SecondDemo />
 *      </LessonSection>
 *    </VisualizationSection>
 *
 *    A React context (SectionDuplicateGuard) warns in development if you
 *    accidentally render two of the same section type.
 *
 * 2. Topics without a visualization should set metadata.tocSections to:
 *      [{ id: "explanation", labelVi: "Giải thích" }]
 *    so the TOC rail doesn't show a dead "Minh họa" row.
 */
```

- [ ] **Step 4: Remove re-export from `interactive/index.ts` if present**

Read `src/components/interactive/index.ts`. If it contains a line re-exporting `AnalogyCard`, delete that line.

- [ ] **Step 5: Typecheck + test**

Run:
```bash
npx tsc --noEmit
npm test
```
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/topic/ src/topics/_template.tsx src/components/interactive/index.ts
git commit -m "refactor(topic): delete unused AnalogyCard; template documents one-per-type rule"
```

---

## Task 5: Rewrite `TopicTOC` — sections prop, a11y, reduced motion (TDD)

**Files:**
- Create: `src/__tests__/topic-toc.test.tsx`
- Modify: `src/components/topic/TopicTOC.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/topic-toc.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TopicTOC from "@/components/topic/TopicTOC";
import type { TocSection } from "@/lib/types";

const reduceMotionMock = vi.fn<() => boolean | null>(() => false);

vi.mock("framer-motion", () => ({
  useReducedMotion: () => reduceMotionMock(),
}));

// Deterministic IntersectionObserver stub — tests trigger entries manually.
let ioInstances: Array<{
  callback: IntersectionObserverCallback;
  observed: Element[];
  fire: (id: string) => void;
}> = [];

class StubIntersectionObserver {
  observed: Element[] = [];
  constructor(private readonly cb: IntersectionObserverCallback) {
    ioInstances.push({
      callback: cb,
      observed: this.observed,
      fire: (id: string) => {
        const target = this.observed.find((el) => (el as HTMLElement).id === id);
        if (!target) return;
        cb(
          [{ target, isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      },
    });
  }
  observe(el: Element) { this.observed.push(el); }
  disconnect() {}
  unobserve() {}
  takeRecords() { return []; }
  root = null;
  rootMargin = "";
  thresholds = [];
}

beforeEach(() => {
  ioInstances = [];
  reduceMotionMock.mockReset();
  reduceMotionMock.mockReturnValue(false);
  (globalThis as any).IntersectionObserver = StubIntersectionObserver;
  // JSDOM doesn't implement MutationObserver with disconnect; provide a basic one
  (globalThis as any).MutationObserver = class {
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
});
afterEach(() => { cleanup(); });

const SECTIONS: TocSection[] = [
  { id: "visualization", labelVi: "Minh họa" },
  { id: "explanation", labelVi: "Giải thích" },
];

function withSectionsInDOM(sections: TocSection[]) {
  sections.forEach((s) => {
    const el = document.createElement("section");
    el.id = s.id;
    document.body.appendChild(el);
  });
}

describe("TopicTOC", () => {
  it("renders the entries from the `sections` prop (not a hardcoded list)", () => {
    withSectionsInDOM(SECTIONS);
    render(<TopicTOC sections={SECTIONS} />);
    expect(screen.getAllByText("Minh họa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Giải thích").length).toBeGreaterThan(0);
    // The old hardcoded "Ví dụ" must NOT appear
    expect(screen.queryByText("Ví dụ")).toBeNull();
  });

  it("renders a single-section TOC when given one entry (viz-less topics)", () => {
    const onlyExp: TocSection[] = [{ id: "explanation", labelVi: "Giải thích" }];
    const el = document.createElement("section");
    el.id = "explanation";
    document.body.appendChild(el);
    render(<TopicTOC sections={onlyExp} />);
    expect(screen.queryByText("Minh họa")).toBeNull();
    expect(screen.getAllByText("Giải thích").length).toBeGreaterThan(0);
  });

  it("exposes a11y landmarks (nav role + aria-label)", () => {
    withSectionsInDOM(SECTIONS);
    render(<TopicTOC sections={SECTIONS} />);
    const navs = screen.getAllByRole("navigation", { name: /mục lục/i });
    expect(navs.length).toBeGreaterThan(0);
  });

  it("highlights the active section when observer fires", () => {
    withSectionsInDOM(SECTIONS);
    render(<TopicTOC sections={SECTIONS} />);
    ioInstances[0].fire("explanation");
    const active = screen.getAllByRole("link", { current: "location" });
    expect(active.length).toBeGreaterThan(0);
    expect(active[0].textContent).toContain("Giải thích");
  });

  it("scrolls to section when entry is clicked", () => {
    withSectionsInDOM(SECTIONS);
    const scrollSpy = vi.fn();
    const el = document.getElementById("visualization")!;
    el.scrollIntoView = scrollSpy;
    render(<TopicTOC sections={SECTIONS} />);
    fireEvent.click(screen.getAllByText("Minh họa")[0]);
    expect(scrollSpy).toHaveBeenCalled();
  });

  it("renders nothing when sections is empty (topic opted out)", () => {
    const { container } = render(<TopicTOC sections={[]} />);
    expect(container.querySelector('[role="navigation"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/topic-toc.test.tsx`
Expected: FAIL — current component doesn't accept `sections` prop; labels don't match; no `role="navigation"`.

- [ ] **Step 3: Rewrite `TopicTOC.tsx`**

Replace `src/components/topic/TopicTOC.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Eye, BookOpen, List } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { TocSection, TocSectionId } from "@/lib/types";

const ICONS: Record<TocSectionId, typeof Eye> = {
  visualization: Eye,
  explanation: BookOpen,
};

export const DEFAULT_TOC_SECTIONS: TocSection[] = [
  { id: "visualization", labelVi: "Minh họa" },
  { id: "explanation", labelVi: "Giải thích" },
];

interface TopicTOCProps {
  sections: TocSection[];
}

export default function TopicTOC({ sections }: TopicTOCProps) {
  const [active, setActive] = useState<string>("");
  const [collapsed, setCollapsed] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    const outstanding = new Set<string>(sections.map((s) => s.id));

    function attachFound() {
      for (const id of Array.from(outstanding)) {
        const el = document.getElementById(id);
        if (el) {
          observer.observe(el);
          outstanding.delete(id);
        }
      }
    }

    attachFound();

    let mo: MutationObserver | null = null;
    let giveUpTimer: ReturnType<typeof setTimeout> | null = null;
    if (outstanding.size > 0) {
      mo = new MutationObserver(() => {
        attachFound();
        if (outstanding.size === 0 && mo) {
          mo.disconnect();
          mo = null;
          if (giveUpTimer) clearTimeout(giveUpTimer);
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
      giveUpTimer = setTimeout(() => {
        if (mo) {
          mo.disconnect();
          mo = null;
        }
      }, 3000);
    }

    return () => {
      observer.disconnect();
      if (mo) mo.disconnect();
      if (giveUpTimer) clearTimeout(giveUpTimer);
    };
  }, [sections]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      setCollapsed(true);
    }
  }

  if (sections.length === 0) return null;

  const rows = sections.map((s) => {
    const Icon = ICONS[s.id];
    const isActive = active === s.id;
    return { ...s, Icon, isActive };
  });

  const listClasses = reduceMotion ? "" : "transition-all";

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <nav
        role="navigation"
        aria-label="Mục lục bài học"
        className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-40"
      >
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card/90 backdrop-blur-sm p-2 shadow-lg">
          {rows.map(({ id, labelVi, Icon, isActive }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={isActive ? "location" : undefined}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(id);
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${listClasses} ${
                isActive
                  ? "bg-accent-light text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              <Icon size={14} />
              {labelVi}
            </a>
          ))}
        </div>
      </nav>

      {/* Mobile: floating pill */}
      <nav
        role="navigation"
        aria-label="Mục lục bài học"
        className="lg:hidden fixed bottom-20 right-4 z-40"
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-expanded={false}
            className={`flex items-center gap-1.5 rounded-full border border-border bg-card/95 backdrop-blur-sm px-3 py-2 text-xs font-medium text-muted shadow-lg ${listClasses} hover:text-foreground`}
          >
            <List size={14} />
            Mục lục
          </button>
        ) : (
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card/95 backdrop-blur-sm p-2 shadow-lg">
            {rows.map(({ id, labelVi, Icon, isActive }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(id);
                }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${listClasses} ${
                  isActive
                    ? "bg-accent-light text-accent"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                <Icon size={14} />
                {labelVi}
              </a>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/topic-toc.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Full test run**

Run: `npm test`
Expected: 88/88 passing (existing 78 + 4 guard + 6 TOC).

Note: any old test that imported `TopicTOC` with no props may fail — fix by updating to pass `DEFAULT_TOC_SECTIONS` or a test-appropriate value.

- [ ] **Step 6: Commit**

```bash
git add src/components/topic/TopicTOC.tsx src/__tests__/topic-toc.test.tsx
git commit -m "feat(toc): rewrite TopicTOC with sections prop, retry observer, a11y, reduced motion"
```

---

## Task 6: Wire `TopicLayout` to resolve and pass `sections`, wrap body in guard

**Files:**
- Modify: `src/components/topic/TopicLayout.tsx`
- Modify: `src/__tests__/topic-layout.test.tsx`
- Modify: `src/__tests__/topic-layout-path-aware.test.tsx`

- [ ] **Step 1: Read current TopicLayout mount of `<TopicTOC />`**

Run: `grep -n "TopicTOC" src/components/topic/TopicLayout.tsx`
Expected: one or two lines — the import + the JSX usage.

- [ ] **Step 2: Update `TopicLayout.tsx`**

Near the top (where imports live), add:

```ts
import { SectionDuplicateGuard } from "./SectionDuplicateGuard";
import { DEFAULT_TOC_SECTIONS } from "./TopicTOC";
```

Inside the component body, compute `tocSections`:

```ts
const tocSections = meta.tocSections ?? DEFAULT_TOC_SECTIONS;
```

Change the existing `<TopicTOC />` call site to:

```tsx
<TopicTOC sections={tocSections} />
```

Wrap the topic body (the `children` prop's render region — the `<article>` or the inner `<div>` that holds children) in a `<SectionDuplicateGuard>`:

```tsx
<SectionDuplicateGuard>
  {/* existing content block that renders {children} */}
</SectionDuplicateGuard>
```

- [ ] **Step 3: Update `topic-layout.test.tsx` mocks**

If `TopicTOC` is mocked in that file, update the mock to accept `sections`. If not mocked, no change.

Quick check: `grep -n "TopicTOC" src/__tests__/topic-layout.test.tsx`

If the mock looks like:
```ts
vi.mock("@/components/topic/TopicTOC", () => ({
  default: () => <div>toc</div>,
}));
```

Leave it — the new component ignores the prop in that mock and returns the same placeholder.

If the mock tries to assert on `<TopicTOC />` calls, update to read the `sections` prop.

- [ ] **Step 4: Update `topic-layout-path-aware.test.tsx` mocks**

Same check: `grep -n "TopicTOC" src/__tests__/topic-layout-path-aware.test.tsx`

The existing mock `default: () => <div>toc</div>` is fine.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: 88/88 passing (same total).

- [ ] **Step 6: Commit**

```bash
git add src/components/topic/TopicLayout.tsx src/__tests__/topic-layout.test.tsx src/__tests__/topic-layout-path-aware.test.tsx
git commit -m "feat(topic): TopicLayout resolves tocSections default and mounts SectionDuplicateGuard"
```

---

## Task 7: Add regression test asserting zero duplicate sections across all topics

**Files:**
- Create: `src/__tests__/topic-section-uniqueness.test.ts`

- [ ] **Step 1: Write the test**

Create `src/__tests__/topic-section-uniqueness.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const TOPICS_DIR = new URL("../topics/", import.meta.url).pathname;

function readTopicFiles(): Array<{ slug: string; source: string }> {
  return readdirSync(TOPICS_DIR)
    .filter((f) => extname(f) === ".tsx")
    .filter((f) => f !== "_template.tsx")
    .filter((f) => f !== "topic-loader.tsx")
    .map((f) => ({
      slug: f.replace(/\.tsx$/, ""),
      source: readFileSync(join(TOPICS_DIR, f), "utf-8"),
    }));
}

function countOccurrences(source: string, pattern: RegExp): number {
  return (source.match(pattern) ?? []).length;
}

describe("topic files — section uniqueness", () => {
  const topics = readTopicFiles();

  it("discovers topic files", () => {
    expect(topics.length).toBeGreaterThan(100);
  });

  it("no topic renders more than one <VisualizationSection>", () => {
    const offenders = topics.filter(
      ({ source }) => countOccurrences(source, /<VisualizationSection[\s/>]/g) > 1
    );
    expect(offenders.map((o) => o.slug)).toEqual([]);
  });

  it("no topic renders more than one <ExplanationSection>", () => {
    const offenders = topics.filter(
      ({ source }) => countOccurrences(source, /<ExplanationSection[\s/>]/g) > 1
    );
    expect(offenders.map((o) => o.slug)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails with the known list**

Run: `npx vitest run src/__tests__/topic-section-uniqueness.test.ts`

Expected: FAIL. The two "no topic…" tests should print the 36 viz-dup offenders and 24 explanation-dup offenders respectively. This is the guardrail: tasks 8-11 make this test green by refactoring the listed topics.

- [ ] **Step 3: Commit the failing test as the guardrail**

```bash
git add src/__tests__/topic-section-uniqueness.test.ts
git commit -m "test(topic): add section-uniqueness guardrail (fails until refactor complete)"
```

---

## Task 8: Refactor Batch 1 — neural fundamentals (viz dups, 8 topics)

**Files:**
- Modify: `src/topics/activation-functions.tsx`
- Modify: `src/topics/backpropagation.tsx`
- Modify: `src/topics/bias-variance.tsx`
- Modify: `src/topics/cnn.tsx`
- Modify: `src/topics/convolution.tsx`
- Modify: `src/topics/pooling.tsx`
- Modify: `src/topics/residual-connections.tsx`
- Modify: `src/topics/overfitting-underfitting.tsx`

**Mechanic (apply uniformly to each file):**

For a topic that currently renders:

```tsx
<VisualizationSection>
  <ContentA />
</VisualizationSection>
...some prose or other JSX...
<VisualizationSection>
  <ContentB />
</VisualizationSection>
```

Change to:

```tsx
<VisualizationSection topicSlug={metadata.slug}>
  <LessonSection label="<describe ContentA>" step={1}>
    <ContentA />
  </LessonSection>
  <LessonSection label="<describe ContentB>" step={2}>
    {/* ...plus any prose that was between the two sections, if it's section-specific... */}
    <ContentB />
  </LessonSection>
</VisualizationSection>
```

If prose between the two original sections is NOT section-specific (general connective text), leave it between them — outside the new wrapper — by splitting into two `<VisualizationSection>` calls… wait, no, the whole point is ONE outer section. Instead, move the connective prose into a `<LessonSection label="…">` of its own, between the two demo LessonSections, or merge it into the trailing prose area of the first demo.

**Labels:**
- Read each original `<VisualizationSection>`'s first few lines of child JSX to find the natural label (existing heading, first prompt, or first `<Callout>` title).
- If no obvious label, use `"Demo 1"` / `"Demo 2"` / `"Demo nâng cao"`.
- Labels must be Vietnamese with correct diacritics.

**Per-topic steps:**

- [ ] **Step 1:** Open `src/topics/activation-functions.tsx`, locate both `<VisualizationSection>` blocks, apply the mechanic. Add `topicSlug={metadata.slug}` to the remaining outer section. Save.
- [ ] **Step 2:** Repeat for `backpropagation.tsx`.
- [ ] **Step 3:** Repeat for `bias-variance.tsx`.
- [ ] **Step 4:** Repeat for `cnn.tsx`.
- [ ] **Step 5:** Repeat for `convolution.tsx`.
- [ ] **Step 6:** Repeat for `pooling.tsx`.
- [ ] **Step 7:** Repeat for `residual-connections.tsx`.
- [ ] **Step 8:** Repeat for `overfitting-underfitting.tsx`.

- [ ] **Step 9: Verify batch**

Run:
```bash
npx vitest run src/__tests__/topic-section-uniqueness.test.ts
```
Expected: the "VisualizationSection" test's offenders list no longer contains the 8 topics from this batch.

Run: `npm test` — everything else still passing.

- [ ] **Step 10: Commit**

```bash
git add src/topics/activation-functions.tsx src/topics/backpropagation.tsx src/topics/bias-variance.tsx src/topics/cnn.tsx src/topics/convolution.tsx src/topics/pooling.tsx src/topics/residual-connections.tsx src/topics/overfitting-underfitting.tsx
git commit -m "refactor(topics): merge duplicate VisualizationSections — batch 1 (neural fundamentals)"
```

---

## Task 9: Refactor Batch 2 — sequence models + NLP classic (viz dups, 7 topics)

**Files:**
- `src/topics/rnn.tsx`
- `src/topics/lstm.tsx`
- `src/topics/gru.tsx`
- `src/topics/bag-of-words.tsx`
- `src/topics/tf-idf.tsx`
- `src/topics/sentiment-analysis.tsx`
- `src/topics/confusion-matrix.tsx`

Same mechanic as Task 8.

- [ ] **Step 1:** rnn.tsx
- [ ] **Step 2:** lstm.tsx
- [ ] **Step 3:** gru.tsx
- [ ] **Step 4:** bag-of-words.tsx
- [ ] **Step 5:** tf-idf.tsx
- [ ] **Step 6:** sentiment-analysis.tsx
- [ ] **Step 7:** confusion-matrix.tsx

- [ ] **Step 8: Verify + commit**

```bash
npx vitest run src/__tests__/topic-section-uniqueness.test.ts
git add src/topics/rnn.tsx src/topics/lstm.tsx src/topics/gru.tsx src/topics/bag-of-words.tsx src/topics/tf-idf.tsx src/topics/sentiment-analysis.tsx src/topics/confusion-matrix.tsx
git commit -m "refactor(topics): merge duplicate VisualizationSections — batch 2 (sequence + NLP classic)"
```

---

## Task 10: Refactor Batch 3 — generative models (viz dups, 6 topics)

**Files:**
- `src/topics/autoencoder.tsx`
- `src/topics/gan.tsx`
- `src/topics/vae.tsx`
- `src/topics/diffusion-models.tsx`
- `src/topics/nerf.tsx`
- `src/topics/u-net.tsx`

Same mechanic.

- [ ] **Step 1:** autoencoder.tsx
- [ ] **Step 2:** gan.tsx
- [ ] **Step 3:** vae.tsx
- [ ] **Step 4:** diffusion-models.tsx
- [ ] **Step 5:** nerf.tsx
- [ ] **Step 6:** u-net.tsx

- [ ] **Step 7: Verify + commit**

```bash
npx vitest run src/__tests__/topic-section-uniqueness.test.ts
git add src/topics/autoencoder.tsx src/topics/gan.tsx src/topics/vae.tsx src/topics/diffusion-models.tsx src/topics/nerf.tsx src/topics/u-net.tsx
git commit -m "refactor(topics): merge duplicate VisualizationSections — batch 3 (generative)"
```

---

## Task 11: Refactor Batch 4 — transformer & LLM internals (viz dups, 10 topics)

**Files:**
- `src/topics/self-attention.tsx`
- `src/topics/multi-head-attention.tsx`
- `src/topics/positional-encoding.tsx`
- `src/topics/context-window.tsx`
- `src/topics/flash-attention.tsx`
- `src/topics/kv-cache.tsx`
- `src/topics/scaling-laws.tsx`
- `src/topics/temperature.tsx`
- `src/topics/top-k-top-p.tsx`
- `src/topics/vision-transformer.tsx`

Same mechanic.

- [ ] **Step 1:** self-attention.tsx
- [ ] **Step 2:** multi-head-attention.tsx
- [ ] **Step 3:** positional-encoding.tsx
- [ ] **Step 4:** context-window.tsx
- [ ] **Step 5:** flash-attention.tsx
- [ ] **Step 6:** kv-cache.tsx
- [ ] **Step 7:** scaling-laws.tsx
- [ ] **Step 8:** temperature.tsx
- [ ] **Step 9:** top-k-top-p.tsx
- [ ] **Step 10:** vision-transformer.tsx

- [ ] **Step 11: Verify + commit**

```bash
npx vitest run src/__tests__/topic-section-uniqueness.test.ts
git add src/topics/self-attention.tsx src/topics/multi-head-attention.tsx src/topics/positional-encoding.tsx src/topics/context-window.tsx src/topics/flash-attention.tsx src/topics/kv-cache.tsx src/topics/scaling-laws.tsx src/topics/temperature.tsx src/topics/top-k-top-p.tsx src/topics/vision-transformer.tsx
git commit -m "refactor(topics): merge duplicate VisualizationSections — batch 4 (transformer + LLM internals)"
```

---

## Task 12: Refactor Batch 5 — training patterns + LLM ops (viz dups, 5 topics)

**Files:**
- `src/topics/transfer-learning.tsx`
- `src/topics/fine-tuning.tsx`
- `src/topics/prompt-engineering.tsx`
- `src/topics/rag.tsx`
- `src/topics/llm-overview.tsx` (has 3 VisualizationSections — two merges needed)

Same mechanic; `llm-overview` is special: merge all three into one outer section with three `<LessonSection>`s.

- [ ] **Step 1:** transfer-learning.tsx
- [ ] **Step 2:** fine-tuning.tsx
- [ ] **Step 3:** prompt-engineering.tsx
- [ ] **Step 4:** rag.tsx
- [ ] **Step 5:** llm-overview.tsx (three-way merge)

- [ ] **Step 6: Verify + commit**

```bash
npx vitest run src/__tests__/topic-section-uniqueness.test.ts
```
Expected: the viz-dup offenders list is now `[]`.

```bash
git add src/topics/transfer-learning.tsx src/topics/fine-tuning.tsx src/topics/prompt-engineering.tsx src/topics/rag.tsx src/topics/llm-overview.tsx
git commit -m "refactor(topics): merge duplicate VisualizationSections — batch 5 (training + LLM ops, incl llm-overview 3-way)"
```

---

## Task 13: Refactor Batch 6 — safety & ethics explanation dups (11 topics)

**Files:**
- `src/topics/adversarial-robustness.tsx`
- `src/topics/ai-governance.tsx`
- `src/topics/ai-privacy-security.tsx` (has 3 — 3-way merge)
- `src/topics/ai-watermarking.tsx`
- `src/topics/alignment.tsx`
- `src/topics/bias-fairness.tsx`
- `src/topics/constitutional-ai.tsx`
- `src/topics/deepfake-detection.tsx`
- `src/topics/explainability.tsx`
- `src/topics/guardrails.tsx`
- `src/topics/red-teaming.tsx`

**Mechanic (same shape, different component):**

```tsx
<ExplanationSection topicSlug={metadata.slug}>
  <LessonSection label="<describe section 1>" step={1}>
    <PartA />
  </LessonSection>
  <LessonSection label="<describe section 2>" step={2}>
    <PartB />
  </LessonSection>
</ExplanationSection>
```

- [ ] **Step 1:** adversarial-robustness.tsx
- [ ] **Step 2:** ai-governance.tsx
- [ ] **Step 3:** ai-privacy-security.tsx (3-way)
- [ ] **Step 4:** ai-watermarking.tsx
- [ ] **Step 5:** alignment.tsx
- [ ] **Step 6:** bias-fairness.tsx
- [ ] **Step 7:** constitutional-ai.tsx
- [ ] **Step 8:** deepfake-detection.tsx
- [ ] **Step 9:** explainability.tsx
- [ ] **Step 10:** guardrails.tsx
- [ ] **Step 11:** red-teaming.tsx

- [ ] **Step 12: Verify + commit**

```bash
npx vitest run src/__tests__/topic-section-uniqueness.test.ts
git add src/topics/adversarial-robustness.tsx src/topics/ai-governance.tsx src/topics/ai-privacy-security.tsx src/topics/ai-watermarking.tsx src/topics/alignment.tsx src/topics/bias-fairness.tsx src/topics/constitutional-ai.tsx src/topics/deepfake-detection.tsx src/topics/explainability.tsx src/topics/guardrails.tsx src/topics/red-teaming.tsx
git commit -m "refactor(topics): merge duplicate ExplanationSections — batch 6 (safety & ethics)"
```

---

## Task 14: Refactor Batch 7 — AI tools + applied explanation dups (5 topics)

**Files:**
- `src/topics/ai-for-data-analysis.tsx` (has 3 — 3-way merge)
- `src/topics/ai-for-writing.tsx`
- `src/topics/ai-tool-evaluation.tsx`
- `src/topics/getting-started-with-ai.tsx`
- `src/topics/python-for-ml.tsx`

- [ ] **Step 1:** ai-for-data-analysis.tsx (3-way)
- [ ] **Step 2:** ai-for-writing.tsx
- [ ] **Step 3:** ai-tool-evaluation.tsx
- [ ] **Step 4:** getting-started-with-ai.tsx
- [ ] **Step 5:** python-for-ml.tsx

- [ ] **Step 6: Verify + commit**

```bash
npx vitest run src/__tests__/topic-section-uniqueness.test.ts
git add src/topics/ai-for-data-analysis.tsx src/topics/ai-for-writing.tsx src/topics/ai-tool-evaluation.tsx src/topics/getting-started-with-ai.tsx src/topics/python-for-ml.tsx
git commit -m "refactor(topics): merge duplicate ExplanationSections — batch 7 (AI tools + applied)"
```

---

## Task 15: Refactor Batch 8 — multimodal explanation dups (8 topics)

**Files:**
- `src/topics/clip.tsx`
- `src/topics/text-to-image.tsx`
- `src/topics/text-to-video.tsx`
- `src/topics/tts.tsx`
- `src/topics/speech-recognition.tsx`
- `src/topics/tlm.tsx`
- `src/topics/unified-multimodal.tsx`
- `src/topics/vlm.tsx`

- [ ] **Step 1:** clip.tsx
- [ ] **Step 2:** text-to-image.tsx
- [ ] **Step 3:** text-to-video.tsx
- [ ] **Step 4:** tts.tsx
- [ ] **Step 5:** speech-recognition.tsx
- [ ] **Step 6:** tlm.tsx
- [ ] **Step 7:** unified-multimodal.tsx
- [ ] **Step 8:** vlm.tsx

- [ ] **Step 9: Verify + commit**

```bash
npx vitest run src/__tests__/topic-section-uniqueness.test.ts
```
Expected: both offenders lists are now `[]`.

```bash
git add src/topics/clip.tsx src/topics/text-to-image.tsx src/topics/text-to-video.tsx src/topics/tts.tsx src/topics/speech-recognition.tsx src/topics/tlm.tsx src/topics/unified-multimodal.tsx src/topics/vlm.tsx
git commit -m "refactor(topics): merge duplicate ExplanationSections — batch 8 (multimodal)"
```

---

## Task 16: Cover the 8 viz-less topics

**Files:**
- `src/topics/ai-in-agriculture.tsx`
- `src/topics/ai-in-education.tsx`
- `src/topics/ai-in-finance.tsx`
- `src/topics/calculus-for-backprop.tsx`
- `src/topics/information-theory.tsx`
- `src/topics/linear-algebra-for-ml.tsx`
- `src/topics/perceptron.tsx`
- `src/topics/probability-statistics.tsx`

**Per-topic decision rule:**

Open each file. Read its content quickly. Decide:

**(A)** If the topic has a natural visualization (e.g., `perceptron` should have one — it's the foundational model), **add** a `<VisualizationSection topicSlug={metadata.slug}>` wrapping an appropriate existing demo inside the topic (likely already present as raw JSX or inline `<InlineChallenge>`). Do not invent new demos.

**(B)** If the topic is explanation-heavy by nature (e.g., `ai-in-finance`, `ai-in-education`, `ai-in-agriculture`, `calculus-for-backprop`, `information-theory`, `linear-algebra-for-ml`, `probability-statistics` — applied / theory surveys), add `tocSections` override to the metadata:

```ts
export const metadata: TopicMeta = {
  // ...existing fields
  tocSections: [{ id: "explanation", labelVi: "Giải thích" }],
};
```

- [ ] **Step 1:** ai-in-agriculture.tsx → (B) override
- [ ] **Step 2:** ai-in-education.tsx → (B) override
- [ ] **Step 3:** ai-in-finance.tsx → (B) override
- [ ] **Step 4:** calculus-for-backprop.tsx → (A) if there's an existing math diagram component, wrap it; otherwise (B)
- [ ] **Step 5:** information-theory.tsx → (A) if existing entropy/info diagram; otherwise (B)
- [ ] **Step 6:** linear-algebra-for-ml.tsx → (A) if there's a matrix viz; otherwise (B)
- [ ] **Step 7:** perceptron.tsx → (A): find the perceptron demo JSX in the file, wrap it in `<VisualizationSection topicSlug={metadata.slug}>`
- [ ] **Step 8:** probability-statistics.tsx → (A) if existing distribution plot; otherwise (B)

- [ ] **Step 9: Verify + commit**

Run: `npm test`
Expected: all tests pass, including section-uniqueness.

```bash
git add src/topics/ai-in-agriculture.tsx src/topics/ai-in-education.tsx src/topics/ai-in-finance.tsx src/topics/calculus-for-backprop.tsx src/topics/information-theory.tsx src/topics/linear-algebra-for-ml.tsx src/topics/perceptron.tsx src/topics/probability-statistics.tsx
git commit -m "refactor(topics): cover 8 viz-less topics (override tocSections or add viz)"
```

---

## Task 17: Code-switch string pass (audit D)

**Files:**
- TBD based on grep results

- [ ] **Step 1: Grep for suspicious code-switch**

Run:
```bash
# English words inside Vietnamese titleVi / descriptions. Allowlist common loanwords.
# Common code-switch flags: bare English verbs, unnecessarily English technical terms
grep -rn "titleVi:.*\"[^\"]*[a-z][A-Z]" src/topics/ --include="*.tsx" | head -30
```

- [ ] **Step 2: Check `epochs-batches.tsx`**

Read the file. The audit flagged this — verify `titleVi` is `"Epoch và Batch"` (correct loanword usage) or some other field is the concern. Fix if any actual code-switch issue remains; note in commit if nothing to fix.

- [ ] **Step 3: Fix identified code-switch strings**

For each hit from step 1 that is genuine code-switch (not a correct technical loanword like "Transformer" or "GPU"):

- Apply targeted fix with `Edit` tool (shortest possible diff)
- Don't touch correct loanwords

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
# File list depends on what was found. If nothing was actually broken, skip this commit.
git add <files from step 3>
git commit -m "fix(i18n): remove remaining code-switch strings flagged by audit D"
```

If nothing to fix, document in the next commit's body or skip.

---

## Task 18: Smoke-test representative topics in dev browser

This task is manual verification — no code changes.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000`.

- [ ] **Step 2: Visit 5 representative topics + verify TOC rail**

For each, check in browser:
1. `/topics/cnn` — desktop ≥lg: TOC rail visible on right; both entries render; clicking scrolls and highlights active; mobile: floating pill shows same entries
2. `/topics/llm-overview` — previously 3 `<VisualizationSection>`s; confirm one outer section with 3 `<LessonSection>`s renders; TOC rail works
3. `/topics/perceptron` — viz-less topic you decided path A or B; if (A) TOC shows both, if (B) TOC shows only Giải thích
4. `/topics/ai-in-finance` — should show only Giải thích in TOC (override path)
5. `/topics/ai-privacy-security` — previously 3 `<ExplanationSection>`s; confirm merged
6. `/topics/linear-regression` — unchanged topic (control); confirm TOC still works normally

For each:
- [ ] TOC renders with correct labels
- [ ] Active-section highlight updates as you scroll
- [ ] Clicking a TOC row scrolls to the section smoothly (or jumps instantly under reduced motion if you toggle OS setting)
- [ ] No duplicate IDs in DOM (inspect elements with `id="visualization"` — should be one)

- [ ] **Step 3: Check dev console for the duplicate warn NOT firing**

During the sweep, open devtools console on each topic. Expected: no `[SectionDuplicateGuard]` warns anywhere.

- [ ] **Step 4: Mark complete**

If any page fails a check, fix in-place with a targeted edit and commit. If all pass, proceed.

---

## Task 19: Final regression run + handoff

- [ ] **Step 1: Run full test suite one more time**

Run: `npm test`
Expected: all tests pass (existing 78 + 4 guard + 6 TOC + 3 section-uniqueness = 91 minimum).

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: 0 new errors (pre-existing lint warnings from `TopicLayout.tsx:202` `hasMarkedRead.current` are carried from main and not in scope — don't fix).

- [ ] **Step 4: Handoff**

Announce: "I'm using the finishing-a-development-branch skill to complete this work."

Use `superpowers:finishing-a-development-branch`. Follow that skill to verify tests, present the 4 options, execute the user's choice.

---

## Self-review

- **Spec coverage:**
  - TOC rewrite (spec Decision 2) → Task 5
  - `tocSections` in TopicMeta (spec Decision 1) → Task 1
  - One-per-type rule (spec Decision 3) → Tasks 8-15 + Task 7 guardrail
  - SectionDuplicateGuard dev warn → Tasks 2-3
  - AnalogyCard deletion → Task 4
  - 8 viz-less coverage → Task 16
  - Code-switch strings (D) → Task 17
  - "Ví dụ" mislabel → fixed as a byproduct of Task 5 (hardcoded label list removed; `meta.tocSections` labels win)
  - `epochs-batches` → Task 17 step 2
  - C (mobile prev/next truncation) → already shipped by A+B (`7106df0`); spec notes no residual work

- **Placeholder scan:** none. Every Task step has concrete code, concrete commands, or concrete per-file action lists.

- **Type consistency:** `TocSection`, `TocSectionId`, `DEFAULT_TOC_SECTIONS` used consistently across Tasks 1, 5, 6. `useSectionGuard` signature matches between Tasks 2 and 3. `topicSlug` prop is optional to avoid breaking topic files that haven't been touched yet (refactor tasks add it to the files they modify).
