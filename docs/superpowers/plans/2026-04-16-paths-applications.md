# Paths · Applications Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 42 new application topics paired with theory topics across the Student and Office learning paths, using a new 6-section `ApplicationLayout` primitive and a four-stage Opus research/writer/review pipeline.

**Architecture:** Extend `TopicMeta` with three new fields (`applicationOf`, `featuredApp`, `sources`). Add 8 new React components under `src/components/application/` for the new page shape. Reuse the nav-ux-polish `SectionDuplicateGuard` machinery. Interleave application slugs directly into existing path stage arrays in `src/lib/paths.ts`. Produce 42 content files via a four-stage Opus subagent pipeline (research brief → writer → spec+fact review → code quality review), batched into 8 groups with a mandatory user review gate after the first (Pilot) batch.

**Tech Stack:** Next.js 16.2.3 App Router, React 19 / React Compiler, TypeScript 5.9, Tailwind v4, Vitest 4, existing topic + interactive primitives.

**Design spec:** `docs/superpowers/specs/2026-04-16-paths-applications-design.md` — every task references specific sections of the spec.

**Vietnamese diacritics protocol:** strict. All writer and reviewer subagents must run the grep checks in §6.4 of the spec before handoff.

**Model policy:** Never Haiku. Implementer subagents default to `sonnet`; content-producing subagents (research brief, topic writer, spec+fact reviewer, code quality reviewer) use `opus` per spec §2.4.

---

# Part A — Infrastructure (Tasks 1–9)

Each infrastructure task is one git commit on `feature/paths-applications`. Tests-first TDD.

---

## Task 1: Extend `TopicMeta` + `TocSectionId` with application fields

**Files:**
- Modify: `src/lib/types.ts` (currently lines 1–43)
- Test: `src/__tests__/topic-meta-application.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/topic-meta-application.test.ts`:

```ts
import { describe, it, expectTypeOf } from "vitest";
import type {
  TopicMeta,
  TocSectionId,
  FeaturedApp,
  SourceLink,
} from "@/lib/types";

describe("TopicMeta application extensions", () => {
  it("accepts application-topic shape with applicationOf, featuredApp, sources", () => {
    const meta: TopicMeta = {
      slug: "k-means-in-music-recs",
      title: "K-means in Music Recs",
      titleVi: "K-means trong gợi ý nhạc",
      description: "Spotify dùng K-means để gợi ý Discover Weekly.",
      category: "ai-applications",
      tags: ["application", "music", "recommendations"],
      difficulty: "beginner",
      relatedSlugs: ["k-means"],
      vizType: "interactive",
      applicationOf: "k-means",
      featuredApp: {
        name: "Spotify",
        productFeature: "Discover Weekly",
        company: "Spotify AB",
        countryOrigin: "SE",
      },
      sources: [
        {
          title: "How Discover Weekly Works",
          publisher: "Spotify Engineering",
          url: "https://engineering.atspotify.com/...",
          date: "2016-03",
          kind: "engineering-blog",
        },
        {
          title: "Recommender Systems at Spotify",
          publisher: "NeurIPS",
          url: "https://arxiv.org/abs/...",
          date: "2020",
          kind: "paper",
        },
      ],
    };
    expectTypeOf(meta).toMatchTypeOf<TopicMeta>();
  });

  it("accepts theory-topic shape without application fields", () => {
    const meta: TopicMeta = {
      slug: "k-means",
      title: "K-means",
      titleVi: "K-means",
      description: "Thuật toán phân cụm K-means.",
      category: "ml-fundamentals",
      tags: ["clustering"],
      difficulty: "intermediate",
      relatedSlugs: ["knn"],
      vizType: "interactive",
    };
    expectTypeOf(meta).toMatchTypeOf<TopicMeta>();
  });

  it("TocSectionId covers both theory and application IDs", () => {
    const ids: TocSectionId[] = [
      "visualization",
      "explanation",
      "hero",
      "problem",
      "mechanism",
      "metrics",
      "tryIt",
      "counterfactual",
    ];
    expectTypeOf(ids).toEqualTypeOf<TocSectionId[]>();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/topic-meta-application.test.ts`

Expected: TypeScript compile error because `FeaturedApp`, `SourceLink` are not exported and the new `TocSectionId` members don't exist.

- [ ] **Step 3: Extend `src/lib/types.ts`**

Replace the current `TocSectionId` line (line 4) and add the new interfaces. Final file state:

```ts
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type VizType = "interactive" | "static";

export type TocSectionId =
  | "visualization"
  | "explanation"
  | "hero"
  | "problem"
  | "mechanism"
  | "metrics"
  | "tryIt"
  | "counterfactual";

export interface TocSection {
  id: TocSectionId;
  labelVi: string;
}

export interface FeaturedApp {
  name: string;
  productFeature?: string;
  company: string;
  countryOrigin: string;
}

export interface SourceLink {
  title: string;
  publisher: string;
  url: string;
  date: string;
  kind:
    | "engineering-blog"
    | "paper"
    | "keynote"
    | "news"
    | "patent"
    | "documentation";
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
  tocSections?: TocSection[];
  applicationOf?: string;
  featuredApp?: FeaturedApp;
  sources?: SourceLink[];
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

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/topic-meta-application.test.ts`

Expected: 3/3 tests pass.

- [ ] **Step 5: Run the full suite — no regressions**

Run: `pnpm test`

Expected: 95/95 tests pass (92 prior + 3 new).

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/__tests__/topic-meta-application.test.ts
git commit -m "feat(types): add applicationOf, featuredApp, sources + extend TocSectionId

Extends TopicMeta with three optional fields required on application topics
and absent on theory topics. Extends TocSectionId with six application
section IDs (hero, problem, mechanism, metrics, tryIt, counterfactual).
Matches spec §5.1 and §5.2."
```

---

## Task 2: `ApplicationLayout` wrapper + ribbon + SourceCard footer auto-mount

**Files:**
- Create: `src/components/application/ApplicationLayout.tsx`
- Create: `src/components/application/SourceCard.tsx`
- Test: `src/__tests__/application-layout.test.tsx` (new)

Per spec §5.4. `ApplicationLayout` is the top-level wrapper a topic file imports. It renders an optional ribbon and auto-mounts `SourceCard` from metadata.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/application-layout.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import type { TopicMeta } from "@/lib/types";

const meta: TopicMeta = {
  slug: "k-means-in-music-recs",
  title: "K-means in Music Recs",
  titleVi: "K-means trong gợi ý nhạc",
  description: "Spotify dùng K-means.",
  category: "ai-applications",
  tags: ["application"],
  difficulty: "beginner",
  relatedSlugs: ["k-means"],
  vizType: "interactive",
  applicationOf: "k-means",
  featuredApp: {
    name: "Spotify",
    productFeature: "Discover Weekly",
    company: "Spotify AB",
    countryOrigin: "SE",
  },
  sources: [
    {
      title: "How Discover Weekly Works",
      publisher: "Spotify Engineering",
      url: "https://engineering.atspotify.com/foo",
      date: "2016-03",
      kind: "engineering-blog",
    },
    {
      title: "Recs at Spotify",
      publisher: "NeurIPS",
      url: "https://arxiv.org/abs/2020.00001",
      date: "2020",
      kind: "paper",
    },
  ],
};

describe("<ApplicationLayout>", () => {
  it("renders children in order", () => {
    render(
      <ApplicationLayout metadata={meta} parentTitleVi="K-means">
        <div data-testid="first">first</div>
        <div data-testid="second">second</div>
      </ApplicationLayout>
    );
    const first = screen.getByTestId("first");
    const second = screen.getByTestId("second");
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("auto-renders SourceCard from metadata.sources", () => {
    render(
      <ApplicationLayout metadata={meta} parentTitleVi="K-means">
        <div>body</div>
      </ApplicationLayout>
    );
    expect(screen.getByText("Tài liệu tham khảo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /How Discover Weekly Works/ })
    ).toHaveAttribute("href", "https://engineering.atspotify.com/foo");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/application-layout.test.tsx`

Expected: FAIL — module `@/components/application/ApplicationLayout` not found.

- [ ] **Step 3: Create `SourceCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { SourceLink } from "@/lib/types";

const KIND_LABELS_VI: Record<SourceLink["kind"], string> = {
  "engineering-blog": "Blog kỹ thuật",
  "paper": "Bài báo khoa học",
  "keynote": "Bài thuyết trình",
  "news": "Báo chí",
  "patent": "Bằng sáng chế",
  "documentation": "Tài liệu chính thức",
};

interface SourceCardProps {
  sources: SourceLink[];
}

export default function SourceCard({ sources }: SourceCardProps) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;

  const grouped = sources.reduce<Record<string, SourceLink[]>>((acc, s) => {
    (acc[s.kind] ??= []).push(s);
    return acc;
  }, {});

  return (
    <section
      aria-labelledby="source-card-heading"
      className="mt-12 rounded-lg border border-border bg-surface/30 p-4"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <h2
          id="source-card-heading"
          className="text-sm font-semibold text-muted"
        >
          Tài liệu tham khảo ({sources.length})
        </h2>
        <span aria-hidden className="text-xs text-muted">
          {open ? "Ẩn" : "Hiện"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {Object.entries(grouped).map(([kind, items]) => (
            <div key={kind}>
              <h3 className="text-xs uppercase tracking-wide text-muted/80">
                {KIND_LABELS_VI[kind as SourceLink["kind"]]}
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {items.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link hover:underline"
                    >
                      {s.title}
                    </a>{" "}
                    <span className="text-muted">
                      — {s.publisher}, {s.date}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Create `ApplicationLayout.tsx`**

```tsx
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { TopicMeta } from "@/lib/types";
import SourceCard from "./SourceCard";

interface ApplicationLayoutProps {
  metadata: TopicMeta;
  parentTitleVi: string;
  currentPath?: string;
  children: ReactNode;
}

export default function ApplicationLayout({
  metadata,
  parentTitleVi,
  currentPath,
  children,
}: ApplicationLayoutProps) {
  if (!metadata.applicationOf || !metadata.featuredApp) {
    throw new Error(
      `ApplicationLayout requires metadata.applicationOf and metadata.featuredApp; topic "${metadata.slug}" is missing one of them.`
    );
  }

  const ribbonHref = currentPath
    ? `/topics/${metadata.applicationOf}?path=${currentPath}`
    : `/topics/${metadata.applicationOf}`;

  return (
    <article>
      <nav
        aria-label="Liên kết với bài lý thuyết"
        className="mb-6 rounded-md border border-border/60 bg-surface/40 px-4 py-3 text-sm"
      >
        <Link href={ribbonHref} className="text-link hover:underline">
          ← Bạn vừa học {parentTitleVi}. Giờ xem cách{" "}
          <strong>{metadata.featuredApp.name}</strong> dùng nó.
        </Link>
      </nav>

      <div>{children}</div>

      {metadata.sources && metadata.sources.length > 0 && (
        <SourceCard sources={metadata.sources} />
      )}
    </article>
  );
}
```

- [ ] **Step 5: Run tests to verify passing**

Run: `pnpm vitest run src/__tests__/application-layout.test.tsx`

Expected: 2/2 tests pass.

- [ ] **Step 6: Run full suite**

Run: `pnpm test`

Expected: 97/97 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/application/ src/__tests__/application-layout.test.tsx
git commit -m "feat(application): ApplicationLayout wrapper + SourceCard footer

Top-level wrapper for application topics. Renders top ribbon linking
back to the parent theory topic (metadata.applicationOf) and auto-mounts
SourceCard from metadata.sources. Matches spec §5.4."
```

---

## Task 3: `ApplicationHero` — Section 1

**Files:**
- Create: `src/components/application/ApplicationHero.tsx`
- Test: `src/__tests__/application-hero.test.tsx` (new)

Per spec §3 Section 1. Fixed heading that interpolates the parent topic's titleVi. Reads `featuredApp` from metadata (passed via context or prop).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationHero from "@/components/application/ApplicationHero";

describe("<ApplicationHero>", () => {
  it("renders heading 'Công ty nào đang ứng dụng {Concept}?'", () => {
    render(
      <ApplicationHero parentTitleVi="K-means">
        <p>Mỗi thứ Hai khi bạn mở Spotify…</p>
      </ApplicationHero>
    );
    expect(
      screen.getByRole("heading", { name: "Công ty nào đang ứng dụng K-means?" })
    ).toBeInTheDocument();
  });

  it("registers section with id='hero' in SectionDuplicateGuard", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <>
        <ApplicationHero parentTitleVi="K-means">
          <p>A</p>
        </ApplicationHero>
        <ApplicationHero parentTitleVi="K-means">
          <p>B</p>
        </ApplicationHero>
      </>
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate "hero" section')
    );
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: Run to verify fail.** `pnpm vitest run src/__tests__/application-hero.test.tsx` — fails with module not found.

- [ ] **Step 3: Implement**

```tsx
"use client";

import type { ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";

interface ApplicationHeroProps {
  parentTitleVi: string;
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationHero({
  parentTitleVi,
  topicSlug = "unknown",
  children,
}: ApplicationHeroProps) {
  useSectionGuard("hero", topicSlug);

  return (
    <section className="mb-10" id="hero">
      <h1 className="text-2xl font-bold mb-4">
        Công ty nào đang ứng dụng {parentTitleVi}?
      </h1>
      <div className="prose prose-sm max-w-none">{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests.** Expected: 2/2 pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/application/ApplicationHero.tsx src/__tests__/application-hero.test.tsx
git commit -m "feat(application): ApplicationHero section 1 with duplicate-guard

Renders 'Công ty nào đang ứng dụng {parentTitleVi}?' heading.
Registers with SectionDuplicateGuard using id='hero'. Matches spec §3."
```

---

## Task 4: `ApplicationProblem` — Section 2

**Files:**
- Create: `src/components/application/ApplicationProblem.tsx`
- Test: `src/__tests__/application-problem.test.tsx` (new)

Same pattern as Task 3 — simple semantic wrapper with fixed heading.

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationProblem from "@/components/application/ApplicationProblem";

describe("<ApplicationProblem>", () => {
  it("renders heading 'Vấn đề công ty cần giải quyết'", () => {
    render(
      <ApplicationProblem>
        <p>Spotify phải đề xuất 30 bài mới mỗi tuần…</p>
      </ApplicationProblem>
    );
    expect(
      screen.getByRole("heading", { name: "Vấn đề công ty cần giải quyết" })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify fail.**

- [ ] **Step 3: Implement**

```tsx
"use client";

import type { ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";

interface Props {
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationProblem({
  topicSlug = "unknown",
  children,
}: Props) {
  useSectionGuard("problem", topicSlug);
  return (
    <section className="mb-10" id="problem">
      <h2 className="text-xl font-semibold mb-4">
        Vấn đề công ty cần giải quyết
      </h2>
      <div className="prose prose-sm max-w-none">{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests.** Expected pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(application): ApplicationProblem section 2"
```

---

## Task 5: `ApplicationMechanism` + `Beat` — Section 3

**Files:**
- Create: `src/components/application/ApplicationMechanism.tsx`
- Create: `src/components/application/Beat.tsx`
- Test: `src/__tests__/application-mechanism.test.tsx` (new)

Per spec §3 Section 3. Accepts numbered `<Beat>` children.

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";

describe("<ApplicationMechanism> + <Beat>", () => {
  it("interpolates concept name into heading", () => {
    render(
      <ApplicationMechanism parentTitleVi="K-means">
        <Beat step={1}>Bước một</Beat>
      </ApplicationMechanism>
    );
    expect(
      screen.getByRole("heading", {
        name: "Cách K-means giải quyết vấn đề",
      })
    ).toBeInTheDocument();
  });

  it("renders beats in numbered order", () => {
    render(
      <ApplicationMechanism parentTitleVi="K-means">
        <Beat step={1}>Alpha</Beat>
        <Beat step={2}>Beta</Beat>
        <Beat step={3}>Gamma</Beat>
      </ApplicationMechanism>
    );
    const list = screen.getByRole("list");
    const items = list.querySelectorAll("li");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("1");
    expect(items[0]).toHaveTextContent("Alpha");
    expect(items[2]).toHaveTextContent("Gamma");
  });
});
```

- [ ] **Step 2: Run to fail.**

- [ ] **Step 3: Implement `Beat.tsx`**

```tsx
import type { ReactNode } from "react";

interface BeatProps {
  step: number;
  children: ReactNode;
}

export default function Beat({ step, children }: BeatProps) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden
        className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold"
      >
        {step}
      </span>
      <div className="prose prose-sm max-w-none">{children}</div>
    </li>
  );
}
```

- [ ] **Step 4: Implement `ApplicationMechanism.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";

interface Props {
  parentTitleVi: string;
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationMechanism({
  parentTitleVi,
  topicSlug = "unknown",
  children,
}: Props) {
  useSectionGuard("mechanism", topicSlug);
  return (
    <section className="mb-10" id="mechanism">
      <h2 className="text-xl font-semibold mb-4">
        Cách {parentTitleVi} giải quyết vấn đề
      </h2>
      <ol className="space-y-4 list-none p-0">{children}</ol>
    </section>
  );
}
```

- [ ] **Step 5: Run tests.** Expected 2/2 pass.

- [ ] **Step 6: Commit**

```bash
git commit -am "feat(application): ApplicationMechanism + Beat for section 3"
```

---

## Task 6: `ApplicationMetrics` + `Metric` — Section 4

**Files:**
- Create: `src/components/application/ApplicationMetrics.tsx`
- Create: `src/components/application/Metric.tsx`
- Test: `src/__tests__/application-metrics.test.tsx` (new)

Per spec §3 Section 4. Each `<Metric>` cites one of `metadata.sources[]` by ref number (1-based).

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import type { SourceLink } from "@/lib/types";

const sources: SourceLink[] = [
  {
    title: "Spotify Engineering Blog",
    publisher: "Spotify Engineering",
    url: "https://e.example.com",
    date: "2016-03",
    kind: "engineering-blog",
  },
  {
    title: "NeurIPS Paper",
    publisher: "NeurIPS",
    url: "https://p.example.com",
    date: "2020",
    kind: "paper",
  },
];

describe("<ApplicationMetrics>", () => {
  it("renders heading 'Con số thật'", () => {
    render(
      <ApplicationMetrics sources={sources}>
        <Metric value="500 triệu người dùng" sourceRef={1} />
      </ApplicationMetrics>
    );
    expect(
      screen.getByRole("heading", { name: "Con số thật" })
    ).toBeInTheDocument();
  });

  it("links metrics to sources by ref number", () => {
    render(
      <ApplicationMetrics sources={sources}>
        <Metric value="500 triệu người dùng" sourceRef={1} />
        <Metric value="40% lượt nghe" sourceRef={2} />
      </ApplicationMetrics>
    );
    const firstMetric = screen.getByText(/500 triệu người dùng/);
    expect(firstMetric.querySelector("a")).toHaveAttribute(
      "href",
      "https://e.example.com"
    );
    const secondMetric = screen.getByText(/40% lượt nghe/);
    expect(secondMetric.querySelector("a")).toHaveAttribute(
      "href",
      "https://p.example.com"
    );
  });
});
```

- [ ] **Step 2: Run to fail.**

- [ ] **Step 3: Implement `Metric.tsx`**

`Metric` itself is purely declarative — it forwards its props to the parent. We use a render-context pattern.

```tsx
import type { SourceLink } from "@/lib/types";

export interface MetricData {
  value: string;
  sourceRef: number;
}

interface MetricProps extends MetricData {}

// Component is props-only; the parent reads children.props to render.
export default function Metric(_: MetricProps): null {
  return null;
}

export function renderMetric(data: MetricData, sources: SourceLink[]) {
  const source = sources[data.sourceRef - 1];
  return (
    <li>
      {data.value}{" "}
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-link hover:underline"
      >
        [{data.sourceRef}]
      </a>
    </li>
  );
}
```

- [ ] **Step 4: Implement `ApplicationMetrics.tsx`**

```tsx
"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";
import { renderMetric, type MetricData } from "./Metric";
import type { SourceLink } from "@/lib/types";

interface Props {
  sources: SourceLink[];
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationMetrics({
  sources,
  topicSlug = "unknown",
  children,
}: Props) {
  useSectionGuard("metrics", topicSlug);

  const metrics: MetricData[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as MetricData;
    if (typeof props.value === "string" && typeof props.sourceRef === "number") {
      metrics.push({ value: props.value, sourceRef: props.sourceRef });
    }
  });

  return (
    <section className="mb-10" id="metrics">
      <h2 className="text-xl font-semibold mb-4">Con số thật</h2>
      <ul className="space-y-2">
        {metrics.map((m, i) => (
          <span key={i}>{renderMetric(m, sources)}</span>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Run tests.** Expected 2/2 pass.

- [ ] **Step 6: Commit**

```bash
git commit -am "feat(application): ApplicationMetrics + Metric for section 4"
```

---

## Task 7: `ApplicationTryIt` + `ApplicationCounterfactual` — Sections 5 and 6

**Files:**
- Create: `src/components/application/ApplicationTryIt.tsx`
- Create: `src/components/application/ApplicationCounterfactual.tsx`
- Test: `src/__tests__/application-tryit-counterfactual.test.tsx` (new)

Both are simple semantic wrappers like Task 4. Section 5 is optional; Section 6 is required.

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";

describe("<ApplicationTryIt>", () => {
  it("renders heading 'Thử tự tay'", () => {
    render(
      <ApplicationTryIt>
        <div>slider</div>
      </ApplicationTryIt>
    );
    expect(
      screen.getByRole("heading", { name: "Thử tự tay" })
    ).toBeInTheDocument();
  });
});

describe("<ApplicationCounterfactual>", () => {
  it("renders heading 'Nếu không có {parentTitleVi}, app sẽ ra sao?'", () => {
    render(
      <ApplicationCounterfactual parentTitleVi="K-means">
        <p>Spotify sẽ phải…</p>
      </ApplicationCounterfactual>
    );
    expect(
      screen.getByRole("heading", {
        name: "Nếu không có K-means, app sẽ ra sao?",
      })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to fail.**

- [ ] **Step 3: Implement `ApplicationTryIt.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";

interface Props {
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationTryIt({
  topicSlug = "unknown",
  children,
}: Props) {
  useSectionGuard("tryIt", topicSlug);
  return (
    <section className="mb-10" id="tryIt">
      <h2 className="text-xl font-semibold mb-4">Thử tự tay</h2>
      <div>{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: Implement `ApplicationCounterfactual.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";

interface Props {
  parentTitleVi: string;
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationCounterfactual({
  parentTitleVi,
  topicSlug = "unknown",
  children,
}: Props) {
  useSectionGuard("counterfactual", topicSlug);
  return (
    <section className="mb-10" id="counterfactual">
      <h2 className="text-xl font-semibold mb-4">
        Nếu không có {parentTitleVi}, app sẽ ra sao?
      </h2>
      <div className="prose prose-sm max-w-none">{children}</div>
    </section>
  );
}
```

- [ ] **Step 5: Run tests.** Expected 2/2 pass.

- [ ] **Step 6: Commit**

```bash
git commit -am "feat(application): TryIt + Counterfactual sections 5 and 6"
```

---

## Task 8: Wire `TopicLayout` to render the ribbon + apply application TOC sections

**Files:**
- Modify: `src/components/topic/TopicLayout.tsx`
- Test: Extend `src/__tests__/topic-layout.test.tsx` (existing)

Per spec §4.3 and §5.5. `TopicLayout` currently calls `<TopicTOC sections={meta.tocSections ?? DEFAULT_TOC_SECTIONS} />`. We add ribbon rendering when `meta.applicationOf` is set.

Note: Ribbon rendering is ALSO done in `ApplicationLayout` (Task 2). But topics can choose to use either pattern:
- (a) Use `ApplicationLayout` as the outer wrapper — ribbon comes from ApplicationLayout
- (b) Use raw section primitives — TopicLayout needs to render the ribbon

Convention per spec §13 handoff: all application topics use `ApplicationLayout` as the outer wrapper. So `TopicLayout` does NOT need to render a ribbon; `ApplicationLayout` does.

However, TopicLayout's TOC must support application section IDs. Verify `TopicTOC` already handles arbitrary `sections` prop (it does — confirmed from Task 5 of nav-ux-polish).

- [ ] **Step 1: Write a failing test**

Append to `src/__tests__/topic-layout.test.tsx`:

```tsx
it("renders application TOC sections when metadata.tocSections has application IDs", () => {
  const meta: TopicMeta = {
    // ...base fields...
    slug: "k-means-in-music-recs",
    titleVi: "K-means trong gợi ý nhạc",
    // ...,
    applicationOf: "k-means",
    tocSections: [
      { id: "hero", labelVi: "Công ty nào?" },
      { id: "problem", labelVi: "Vấn đề" },
      { id: "mechanism", labelVi: "Cách giải quyết" },
      { id: "metrics", labelVi: "Con số thật" },
      { id: "counterfactual", labelVi: "Nếu không có" },
    ],
  };
  const { container } = render(
    <TopicLayout meta={meta}>
      <div>body</div>
    </TopicLayout>
  );
  const tocLabels = container.querySelectorAll("nav[aria-label='Mục lục bài học'] a");
  const labels = Array.from(tocLabels).map((a) => a.textContent);
  expect(labels).toEqual([
    "Công ty nào?",
    "Vấn đề",
    "Cách giải quyết",
    "Con số thật",
    "Nếu không có",
  ]);
});
```

- [ ] **Step 2: Run test.** Expected: this test should PASS immediately because TopicTOC is already generic and reads whatever `sections` prop it gets. If it FAILS, debug what's specific to application IDs that's rejected.

- [ ] **Step 3: If pass, commit the test as a regression guard**

```bash
git add src/__tests__/topic-layout.test.tsx
git commit -m "test(topic-layout): confirm TOC passes through application section IDs"
```

- [ ] **Step 4: Run full suite**

Run: `pnpm test`

Expected: all tests pass (existing 92 + new infrastructure tests added by Tasks 1–7 + 1 new).

---

## Task 9: Extend section-uniqueness test to cover application section IDs

**Files:**
- Modify: `src/__tests__/topic-section-uniqueness.test.ts`

The existing regression test scans topic files for duplicate `<VisualizationSection>` and `<ExplanationSection>`. Extend it to scan application-section components when topics start using them.

- [ ] **Step 1: Review current test structure**

Open `src/__tests__/topic-section-uniqueness.test.ts`. Note the regex pattern used for VisualizationSection and ExplanationSection.

- [ ] **Step 2: Add regex patterns for the six application section wrappers**

Add patterns for `ApplicationHero`, `ApplicationProblem`, `ApplicationMechanism`, `ApplicationMetrics`, `ApplicationTryIt`, `ApplicationCounterfactual`. Exclude topic-loader, _template, and any non-topic files.

Example addition (adapt to existing file style):

```ts
const APPLICATION_SECTION_PATTERNS: Record<string, RegExp> = {
  ApplicationHero: /<ApplicationHero[\s/>]/g,
  ApplicationProblem: /<ApplicationProblem[\s/>]/g,
  ApplicationMechanism: /<ApplicationMechanism[\s/>]/g,
  ApplicationMetrics: /<ApplicationMetrics[\s/>]/g,
  ApplicationTryIt: /<ApplicationTryIt[\s/>]/g,
  ApplicationCounterfactual: /<ApplicationCounterfactual[\s/>]/g,
};

// Each pattern must match ≤ 1 per topic file.
```

- [ ] **Step 3: Run test. Expected pass (zero application topics yet, so zero violations).**

- [ ] **Step 4: Commit**

```bash
git commit -am "test(uniqueness): extend to application section wrappers"
```

---

## Task 9a: Path sidebar `· Ứng dụng` suffix for application topics

**Files:**
- Modify: `src/components/paths/LearningPathPage.tsx` (line 202 renders `topic.titleVi`)
- Test: `src/__tests__/learning-path-application-badge.test.tsx` (new)

Per spec §4.3 item 2. Application topics (those with `metadata.applicationOf`) show a ` · Ứng dụng` suffix after their `titleVi` in the path's stage list. Subtle, one word, lowercase, no icon.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import type { Stage } from "@/components/paths/LearningPathPage";

// Mock registry to return an application topic for one slug
vi.mock("@/topics/registry", () => ({
  getTopicBySlug: (slug: string) => {
    if (slug === "k-means-in-music-recs") {
      return {
        slug,
        title: "K-means in Music Recs",
        titleVi: "K-means trong gợi ý nhạc",
        applicationOf: "k-means",
      };
    }
    if (slug === "k-means") {
      return {
        slug,
        title: "K-means",
        titleVi: "K-means",
      };
    }
    return null;
  },
}));

const stages: Stage[] = [
  {
    title: "ML cơ bản",
    slugs: ["k-means", "k-means-in-music-recs"],
  },
];

describe("<LearningPathPage> application badge", () => {
  it("renders ' · Ứng dụng' after application topic titles", () => {
    render(
      <LearningPathPage
        pathId="student"
        nameVi="Học sinh · Sinh viên"
        stages={stages}
      />
    );
    expect(
      screen.getByText(/K-means trong gợi ý nhạc · Ứng dụng/)
    ).toBeInTheDocument();
  });

  it("does NOT render badge on theory topics", () => {
    render(
      <LearningPathPage
        pathId="student"
        nameVi="Học sinh · Sinh viên"
        stages={stages}
      />
    );
    const theoryRow = screen.getByText("K-means", { exact: true });
    expect(theoryRow.textContent).not.toContain("Ứng dụng");
  });
});
```

- [ ] **Step 2: Run to verify fail.**

- [ ] **Step 3: Edit `LearningPathPage.tsx` line 202 area**

Around line 202 where `{topic.titleVi}` renders, change to:

```tsx
{topic.titleVi}
{topic.applicationOf && (
  <span className="ml-1 text-xs text-muted font-normal">
    · Ứng dụng
  </span>
)}
```

Ensure `topic` is typed as `TopicMeta` (which now has optional `applicationOf`).

- [ ] **Step 4: Run tests to verify passing.**

- [ ] **Step 5: Commit**

```bash
git add src/components/paths/LearningPathPage.tsx src/__tests__/learning-path-application-badge.test.tsx
git commit -m "feat(paths): show ' · Ứng dụng' badge on application topic entries

Per spec §4.3 item 2. Helps learners spot application topics in
the stage list at a glance. Theory topics render unchanged."
```

---

# Part B — Subagent prompt files (Tasks 10–13)

Each of the four pipeline stages gets a single reusable prompt template file. The controller reads these files and fills in per-topic slots when dispatching subagents.

Files live under `docs/superpowers/subagent-prompts/2026-04-16-paths-applications/`.

---

## Task 10: Research-brief subagent prompt

**File:** `docs/superpowers/subagent-prompts/2026-04-16-paths-applications/research-brief.md`

- [ ] **Step 1: Write the prompt file**

```markdown
# Research Brief — Application Topic

You are an Opus-class research subagent. Produce a factual research brief for ONE new application topic that pairs the given theory topic with one real-world app.

## Inputs you will receive

- **theory_slug**: slug of the theory topic (e.g., `k-means`)
- **theory_title_vi**: Vietnamese title of the theory topic (e.g., `K-means`)
- **theory_category**: category slug (e.g., `ml-fundamentals`)
- **application_slug**: slug for the new application topic (e.g., `k-means-in-music-recs`)
- **proposed_featured_app**: best-guess featured app (you may swap if sources are weak)

## Your job

1. Use `WebSearch` and `WebFetch` to find public sources documenting how the app uses the concept.
2. Produce a YAML brief matching the schema in §6.2 of `docs/superpowers/specs/2026-04-16-paths-applications-design.md`.
3. If the proposed featured app has <1 Tier-1 source or <2 total sources, swap to a better-sourced app. Record the swap in `risk_flags`.
4. Every metric must cite a source by `source_ref`. Every mechanism beat must cite a source.
5. All Vietnamese prose must use correct diacritics. Run the diacritics grep in §6.4 against your draft before outputting.
6. Proper nouns stay English with Vietnamese gloss on first mention (§6.5).

## Output format

Output ONLY the YAML brief, nothing else.

## Failure conditions (do NOT hand back if any are true)

- <2 sources
- <1 Tier-1 source
- Any metric without `source_ref`
- Any mechanism beat without `source_ref`
- Vietnamese framing hook missing from `hero_moment_vi`
- Diacritic errors in Vietnamese strings

## If you cannot complete

Respond with `STATUS: BLOCKED` followed by a one-paragraph explanation of what you tried and what's missing. The human will triage.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/subagent-prompts/2026-04-16-paths-applications/research-brief.md
git commit -m "docs(subagent-prompts): research-brief template for paths-applications"
```

---

## Task 11: Topic-writer subagent prompt

**File:** `docs/superpowers/subagent-prompts/2026-04-16-paths-applications/topic-writer.md`

- [ ] **Step 1: Write the prompt file**

```markdown
# Topic Writer — Application Topic

You are an Opus-class writer subagent. Given a validated research brief and the spec, you produce ONE `.tsx` topic file and the matching `registry.ts` entry.

## Inputs you will receive

- **brief**: YAML research brief from Stage 1 (the ONLY source of claims you may use)
- **spec**: `docs/superpowers/specs/2026-04-16-paths-applications-design.md` (read §3 anatomy, §5 primitives, §6.4–6.6 language rules)

## Hard rules

1. Every sentence must trace to a claim in the brief. You may NOT add facts, examples, or numbers that aren't in the brief.
2. Use ApplicationLayout as the outer wrapper. All six sections (or five if try-it is omitted) inside.
3. Follow the exact section primitives from spec §5.4: ApplicationHero, ApplicationProblem, ApplicationMechanism + Beat, ApplicationMetrics + Metric, ApplicationTryIt (optional), ApplicationCounterfactual.
4. Populate `metadata.applicationOf`, `metadata.featuredApp`, `metadata.sources` from the brief.
5. `metadata.tocSections` must match the sections you actually render (omit `tryIt` if you skip section 5).
6. Before handoff, run the diacritics grep commands in spec §6.4. Any match = fix and re-run.
7. Prose rules in spec §6.6: define every technical term on first mention; Vietnamese units on numbers; short sentences.
8. Proper nouns stay English (§6.5). First mention gets a Vietnamese gloss in parens.

## Output

Two files:
1. `src/topics/<application_slug>.tsx` — the topic file
2. Update `src/topics/registry.ts` — add one new entry mirroring the topic's metadata including `tocSections` override

## Failure conditions

- Any sentence not traceable to brief
- Any diacritic error (diacritics grep shows a hit)
- Missing required metadata field
- More than one of any section wrapper in the file

## If you cannot complete

Respond with `STATUS: BLOCKED` and explanation.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/subagent-prompts/2026-04-16-paths-applications/topic-writer.md
git commit -m "docs(subagent-prompts): topic-writer template for paths-applications"
```

---

## Task 12: Spec + fact reviewer subagent prompt

**File:** `docs/superpowers/subagent-prompts/2026-04-16-paths-applications/spec-fact-review.md`

- [ ] **Step 1: Write the prompt file**

```markdown
# Spec + Fact Reviewer — Application Topic

You are an Opus-class reviewer subagent. Verify a written application topic matches the design spec and every factual claim is traceable to the research brief.

## Inputs

- **topic_file_path**: `src/topics/<slug>.tsx`
- **brief**: the research brief from Stage 1
- **spec**: `docs/superpowers/specs/2026-04-16-paths-applications-design.md`

## Checklist

### Spec compliance
- [ ] Six section wrappers present (ApplicationHero, Problem, Mechanism, Metrics, Counterfactual) or five if `try_it_spec` is null in brief
- [ ] Wrapped in `<ApplicationLayout>` outer
- [ ] Each section wrapper appears exactly once
- [ ] Metadata: `applicationOf`, `featuredApp`, `sources` (≥2) all present
- [ ] `tocSections` declared and matches rendered sections
- [ ] Length in target range per spec §3

### Fact-check (via `WebFetch` to re-verify)
- [ ] Every metric in the file has `sourceRef` pointing at a valid source
- [ ] Every mechanism beat describes what the brief says it describes
- [ ] Visit at least ONE source URL per topic to confirm it still resolves (200 OK, expected content)

### Language
- [ ] Run diacritics grep commands (§6.4). Zero hits.
- [ ] English proper nouns kept English
- [ ] First-mention Vietnamese glosses present
- [ ] No marketing speak ("cải thiện trải nghiệm" banned)

### Prose
- [ ] Every technical term defined on first mention in this file
- [ ] Numbers use Vietnamese units
- [ ] Short sentences

## Output

One of:
- `PASS` — topic is ready for code-quality review
- `FAIL` — list every failed checklist item with line numbers and the required fix

## If you cannot complete

Respond with `STATUS: BLOCKED` and explanation.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/subagent-prompts/2026-04-16-paths-applications/spec-fact-review.md
git commit -m "docs(subagent-prompts): spec-fact-review template for paths-applications"
```

---

## Task 13: Code quality reviewer subagent prompt

**File:** `docs/superpowers/subagent-prompts/2026-04-16-paths-applications/code-quality-review.md`

- [ ] **Step 1: Write the prompt file**

```markdown
# Code Quality Reviewer — Application Topic

You are an Opus-class reviewer subagent. Verify the topic file meets project code quality standards.

## Inputs

- **topic_file_path**: `src/topics/<slug>.tsx`
- **git_sha**: SHA of the commit that introduced the file

## Checklist

### Correctness
- [ ] File compiles (TypeScript strict). Run: `pnpm exec tsc --noEmit src/topics/<slug>.tsx`
- [ ] No lint errors. Run: `pnpm lint src/topics/<slug>.tsx`
- [ ] No unused imports

### A11y
- [ ] Headings descend without skipping levels
- [ ] All links have accessible names
- [ ] Interactive elements (if used in Section 5) are keyboard-operable

### Reuse
- [ ] No duplication of content from the paired theory topic — application topic should NOT re-teach the concept
- [ ] Uses existing `@/components/interactive` primitives rather than inlining custom JSX

### Performance
- [ ] No large inline base64 assets
- [ ] No client-only heavy imports at module scope

## Output

One of:
- `APPROVED` — ready to commit
- `FIX` — list every failed checklist item with line numbers and required fix

## If you cannot complete

Respond with `STATUS: BLOCKED` and explanation.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/subagent-prompts/2026-04-16-paths-applications/code-quality-review.md
git commit -m "docs(subagent-prompts): code-quality-review template for paths-applications"
```

---

# Part C — Pilot batch (Task 14)

## Task 14: Pilot batch — 5 topics through full pipeline

**Topics (per spec §8):**
1. `k-means-in-music-recs` (Student ML basics)
2. `backpropagation-in-translation` (Student neural)
3. `hallucination-in-legal-research` (Office LLM concepts)
4. `bias-fairness-in-hiring` (Office safety)
5. `sentiment-analysis-in-brand-monitoring` (Office NLP applications)

**Each topic goes through Stages 1–4 (spec §6.1).**

- [ ] **Step 1: Dispatch 5 parallel Stage 1 (research brief) subagents**

For each topic, dispatch an Opus subagent (`model: "opus"`) with:
- Prompt: `docs/superpowers/subagent-prompts/2026-04-16-paths-applications/research-brief.md`
- Inputs: the topic's theory_slug, theory_title_vi, proposed_featured_app (from spec §7)

Collect all 5 YAML briefs.

- [ ] **Step 2: Human review of briefs**

Skim each brief for obvious problems before Stage 2. Check:
- Source URLs look legitimate
- Mechanisms map cleanly to the concept
- Vietnamese framing hooks are grounded

- [ ] **Step 3: Dispatch 5 sequential Stage 2 (writer) subagents**

One at a time to avoid `registry.ts` merge conflicts. Each writer subagent:
- Prompt: `docs/superpowers/subagent-prompts/2026-04-16-paths-applications/topic-writer.md`
- Inputs: the validated brief + pointer to spec

Commit after each successful write.

- [ ] **Step 4: Dispatch 5 parallel Stage 3 (spec + fact review) subagents**

Each verifies one written topic. If any topic returns `FAIL`, dispatch the writer for that topic again with the reviewer's feedback. Maximum 3 iterations per topic.

- [ ] **Step 5: Dispatch 5 parallel Stage 4 (code quality review) subagents**

Each verifies one written topic. If any returns `FIX`, dispatch writer again. Max 3 iterations.

- [ ] **Step 6: Interleave slugs in `src/lib/paths.ts`**

Update stage arrays to include the 5 pilot topics:

```ts
// Student Stage 3 ML cơ bản
slugs: ["..", "k-means", "k-means-in-music-recs", "..", ...]
// Student Stage 4 Mạng nơ-ron
slugs: ["..", "backpropagation", "backpropagation-in-translation", "..", ...]
// Office Stage 1 Bắt đầu với AI
slugs: ["..", "hallucination", "hallucination-in-legal-research", "..", ...]
// Office Stage 3 An toàn & Đạo đức
slugs: ["bias-fairness", "bias-fairness-in-hiring", "..", ...]
// Office Stage 4 Ứng dụng ngành
slugs: ["..", "sentiment-analysis", "sentiment-analysis-in-brand-monitoring", "..", ...]
```

Run `pnpm test src/__tests__/paths-lib.test.ts` — expected pass.

- [ ] **Step 7: Run full regression**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit the pilot batch**

```bash
git add src/topics/k-means-in-music-recs.tsx src/topics/backpropagation-in-translation.tsx src/topics/hallucination-in-legal-research.tsx src/topics/bias-fairness-in-hiring.tsx src/topics/sentiment-analysis-in-brand-monitoring.tsx src/topics/registry.ts src/lib/paths.ts
git commit -m "feat(paths): pilot batch — 5 application topics + path interleaving

Ships k-means-in-music-recs, backpropagation-in-translation,
hallucination-in-legal-research, bias-fairness-in-hiring, and
sentiment-analysis-in-brand-monitoring. All five passed research brief,
writer, spec+fact review, and code quality review stages."
```

- [ ] **Step 9: MANDATORY USER REVIEW GATE**

STOP here. User must read all 5 pilot topics end-to-end and either approve or request spec changes before Task 15.

---

# Part D — Scale batches (Tasks 15–21)

Each batch follows the same 8-step pattern as Task 14, adapted to its topic list. References the same four subagent prompt files. Each batch commits one git commit.

**The per-topic Opus pipeline is identical to Task 14; only the topic list and the `paths.ts` interleaving differs.**

---

## Task 15: Batch 2 — Student math foundations (3 topics)

**Topics:** `linear-algebra-for-ml-in-photo-search`, `probability-statistics-in-spam-filter`, `calculus-for-backprop-in-model-training`

**Proposed featured apps:** Google Photos face grouping / Gmail spam classifier / GPT-4 training

Follow Task 14 steps 1–8 with these 3 topics. Interleave into Student Stage 2 (Nền tảng toán).

- [ ] Research brief for all 3 topics
- [ ] Sequential writer runs (3 commits)
- [ ] Spec + fact review (parallel)
- [ ] Code quality review (parallel)
- [ ] Interleave slugs in Student Stage 2
- [ ] Full test regression
- [ ] Commit: `feat(paths): batch 2 — student math foundations applications (3 topics)`

---

## Task 16: Batch 3 — Student ML basics (12 topics)

**Topics (Stage 3 minus k-means):** `supervised-unsupervised-rl-in-netflix`, `linear-regression-in-housing`, `logistic-regression-in-spam-filter`, `information-theory-in-compression`, `decision-trees-in-loan-scoring`, `knn-in-symptom-checker`, `naive-bayes-in-email-classification`, `confusion-matrix-in-medical-testing`, `bias-variance-in-netflix-prize`, `overfitting-underfitting-in-compas`, `cross-validation-in-kaggle`, `train-val-test-in-youtube`

Follow Task 14 steps 1–8 with these 12 topics. Interleave into Student Stage 3.

- [ ] Research brief for all 12 (parallel)
- [ ] Sequential writer runs (12 commits)
- [ ] Spec + fact review (parallel)
- [ ] Code quality review (parallel)
- [ ] Interleave slugs in Student Stage 3
- [ ] Full test regression
- [ ] Commit: `feat(paths): batch 3 — student ML basics applications (12 topics)`

---

## Task 17: Batch 4 — Student neural networks (8 topics)

**Topics (Stage 4 minus backpropagation):** `neural-network-overview-in-voice-assistants`, `perceptron-in-image-classification`, `mlp-in-credit-scoring`, `activation-functions-in-alphago`, `forward-propagation-in-chat-response`, `gradient-descent-in-training`, `loss-functions-in-recommendation`, `epochs-batches-in-gpt-training`

Follow Task 14 steps 1–8. Interleave into Student Stage 4.

- [ ] Research brief for all 8 (parallel)
- [ ] Sequential writer runs (8 commits)
- [ ] Spec + fact review (parallel)
- [ ] Code quality review (parallel)
- [ ] Interleave slugs in Student Stage 4
- [ ] Full test regression
- [ ] Commit: `feat(paths): batch 4 — student neural-network applications (8 topics)`

---

## Task 18: Batch 5 — Student practical (3 topics)

**Topics:** `data-preprocessing-in-uber-eta`, `feature-engineering-in-fraud-detection`, `model-evaluation-selection-in-kaggle`

Follow Task 14 steps 1–8. Interleave into Student Stage 5.

- [ ] Research brief for all 3 (parallel)
- [ ] Sequential writer runs (3 commits)
- [ ] Spec + fact review (parallel)
- [ ] Code quality review (parallel)
- [ ] Interleave slugs in Student Stage 5
- [ ] Full test regression
- [ ] Commit: `feat(paths): batch 5 — student practical applications (3 topics)`

---

## Task 19: Batch 6 — Office LLM concepts (6 topics)

**Topics (Stage 1 minus hallucination):** `llm-overview-in-chat-assistants`, `prompt-engineering-in-writing-tools`, `chain-of-thought-in-reasoning-models`, `in-context-learning-in-chatbots`, `temperature-in-creative-writing`, `context-window-in-long-documents`

Follow Task 14 steps 1–8. Interleave into Office Stage 1.

- [ ] Research brief for all 6 (parallel)
- [ ] Sequential writer runs (6 commits)
- [ ] Spec + fact review (parallel)
- [ ] Code quality review (parallel)
- [ ] Interleave slugs in Office Stage 1
- [ ] Full test regression
- [ ] Commit: `feat(paths): batch 6 — office LLM applications (6 topics)`

---

## Task 20: Batch 7 — Office safety / ethics (3 topics)

**Topics (Stage 3 minus bias-fairness):** `ai-governance-in-enterprise`, `guardrails-in-chat-assistants`, `explainability-in-credit-decisions`

Follow Task 14 steps 1–8. Interleave into Office Stage 3.

- [ ] Research brief for all 3 (parallel)
- [ ] Sequential writer runs (3 commits)
- [ ] Spec + fact review (parallel)
- [ ] Code quality review (parallel)
- [ ] Interleave slugs in Office Stage 3
- [ ] Full test regression
- [ ] Commit: `feat(paths): batch 7 — office safety/ethics applications (3 topics)`

---

## Task 21: Batch 8 — Office NLP applications (2 topics)

**Topics (Stage 4 minus sentiment-analysis):** `recommendation-systems-in-shopping`, `text-classification-in-support-routing`

Follow Task 14 steps 1–8. Interleave into Office Stage 4.

- [ ] Research brief for all 2 (parallel)
- [ ] Sequential writer runs (2 commits)
- [ ] Spec + fact review (parallel)
- [ ] Code quality review (parallel)
- [ ] Interleave slugs in Office Stage 4
- [ ] Full test regression
- [ ] Commit: `feat(paths): batch 8 — office NLP applications (2 topics)`

---

# Part E — Finishing (Task 22)

## Task 22: Final regression + finishing-a-development-branch

- [ ] **Step 1: Full test regression**

```bash
pnpm test
```

Expected: all tests pass (original 92 + ~15 new infrastructure tests + per-topic guards = ~107+ tests).

- [ ] **Step 2: Diacritics-grep sweep across all 42 new topic files**

```bash
for pattern in "Cong ty nao" "Van de cong ty" "Cach.*giai quyet" "Con so that" "Thu tu tay" "Neu khong co" "Tai lieu tham khao" "Ban vua hoc"; do
  matches=$(grep -rn "$pattern" src/topics/*-in-*.tsx 2>/dev/null)
  if [ -n "$matches" ]; then
    echo "DIACRITIC FAIL for pattern '$pattern':"
    echo "$matches"
  fi
done
echo "diacritic sweep complete"
```

Expected output: `diacritic sweep complete` with no `DIACRITIC FAIL` lines.

- [ ] **Step 3: Production build**

```bash
pnpm build
```

Expected: build succeeds, ~250 pages prerendered (210 theory + 42 application + ~8 non-topic pages).

- [ ] **Step 4: Local dev smoke test**

```bash
pnpm dev
```

Visit http://localhost:3000/topics/k-means-in-music-recs?path=student and verify:
- Ribbon at top links back to `/topics/k-means?path=student`
- 6 sections render in order (or 5 if no try-it)
- SourceCard footer shows at least 2 sources
- TOC rail shows application section labels
- No console errors

Kill dev server.

- [ ] **Step 5: Invoke finishing-a-development-branch skill**

Announce: "I'm using the finishing-a-development-branch skill to complete this work."

Follow that skill. Present options:
1. Merge back to `main` locally
2. Push and create a Pull Request
3. Keep the branch as-is
4. Discard

Execute the user's chosen option.
