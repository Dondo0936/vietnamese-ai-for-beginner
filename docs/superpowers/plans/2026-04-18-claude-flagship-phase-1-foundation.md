# Claude Flagship Guide — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the `/claude` flagship guide — primitives, route tree, hub, and homepage teaser — so phases 2–4 can drop tile demos into a working frame.

**Architecture:** A new `src/features/claude/` module owns the guide. Four pure presentational primitives (`ClaudeDesktopShell`, `AnnotationLayer`, `DemoCanvas`, `DeepLinkCTA`) form the shared vocabulary every tile will use. A single `registry.ts` lists 24 tiles in shelf order; the hub page (`/claude`) reads that registry and renders 3 shelves, and a dynamic route (`/claude/[feature]`) dispatches to per-tile sub-pages. Phase 1 ships the registry + hub + dispatcher + an `Đang xây dựng` placeholder tile, so the URL tree is complete before any real demos exist. Homepage gets two small changes: `AccentHueSweep` on the hero's "hình ảnh và ví dụ" clause (replacing the removed ✳ mark) and a `ClaudeHeroCard` CTA under the ask bar.

**Tech Stack:** Next.js 16.2.3 App Router, React 19, TypeScript, Tailwind 4, framer-motion, Vitest + Testing Library. Perplexity × Momo DS tokens already in `src/app/globals.css`.

---

## Scope notes

- **Phase 1 only.** Phases 2–4 (the 24 tile demos) will each get their own plan.
- **LOC budget:** ~1500. If a file grows past 250 LOC in Phase 1, split it.
- **No Context7 for plan writing**, but the executor MUST query Context7 for `framer-motion` and Next.js 16 `generateStaticParams` / `generateMetadata` / `dynamic` APIs before writing any file that uses them. See `AGENTS.md`.
- **Pre-existing test failure:** `src/__tests__/topic-section-uniqueness.test.ts` has 2 failing tests from the section-uniqueness batch landed on `main`. Do not "fix" them here — they're tracked separately. Every new test you add must pass; the counter on that file stays at 2 failing.

## File structure

**New files (all created, none modify unrelated code):**

```
src/features/claude/
  registry.ts                      # 24-tile data (shelf/slug/title/subtitle/status)
  types.ts                         # TileMeta, Shelf, Annotation, etc.
  components/
    ClaudeDesktopShell.tsx         # UI scaffold of Claude Desktop
    AnnotationLayer.tsx            # numbered pin overlay with showAt scrubbing
    DemoCanvas.tsx                 # reduced-motion + keyboard controls wrapper
    DeepLinkCTA.tsx                # "Thử trong Claude" button → claude.ai/new?q=...
    ShelfGrid.tsx                  # hub renderer (shelf title + tile grid)
    TilePlaceholder.tsx            # "Đang xây dựng" body for phase 1 routes
  AccentHueSweep.tsx               # animated gradient clip for hero text
src/components/home/
  ClaudeHeroCard.tsx               # one-line CTA card under ask bar
src/app/claude/
  page.tsx                         # hub — renders 3 shelves from registry
  layout.tsx                       # shared metadata + structured breadcrumbs
  [feature]/
    page.tsx                       # dispatcher — looks up tile, renders body
```

**Existing files modified:**

- `src/components/home/HeroSearch.tsx` — remove ✳ span, wrap "hình ảnh và ví dụ" in `<AccentHueSweep>`.
- `src/components/home/HomeContent.tsx` — insert `<ClaudeHeroCard>` after the stats strip, before `AuthWarningBanner`.
- `src/components/layout/Navbar.tsx` — add "Cẩm nang Claude" link between ⌘K button and `/progress` icon.
- `src/app/sitemap.ts` — include `/claude` and 24 feature URLs.

**New test files:**

```
src/__tests__/
  claude-registry.test.ts
  claude-accent-hue-sweep.test.tsx
  claude-hero-card.test.tsx
  claude-navbar-link.test.tsx
  claude-desktop-shell.test.tsx
  claude-annotation-layer.test.tsx
  claude-demo-canvas.test.tsx
  claude-deep-link-cta.test.tsx
  claude-hub-page.test.tsx
  claude-feature-dispatcher.test.tsx
```

---

## Task 1: Seed directory + TypeScript types

**Files:**
- Create: `src/features/claude/types.ts`
- Create: `src/features/claude/registry.ts`
- Test: `src/__tests__/claude-registry.test.ts`

- [ ] **Step 1: Write the failing registry test**

Write `src/__tests__/claude-registry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { tiles, shelves, SHELF_ORDER } from "@/features/claude/registry";

describe("claude registry", () => {
  it("has exactly 24 tiles", () => {
    expect(tiles).toHaveLength(24);
  });

  it("assigns 8 tiles to each of the 3 shelves", () => {
    const counts = SHELF_ORDER.map(
      (s) => tiles.filter((t) => t.shelf === s).length
    );
    expect(counts).toEqual([8, 8, 8]);
  });

  it("has unique slugs", () => {
    const slugs = tiles.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("builds shelves map in SHELF_ORDER order", () => {
    expect(Object.keys(shelves)).toEqual([...SHELF_ORDER]);
    for (const key of SHELF_ORDER) {
      expect(shelves[key].tiles.length).toBe(8);
    }
  });

  it("marks every tile as status=planned in Phase 1", () => {
    expect(tiles.every((t) => t.status === "planned")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it — expect module-not-found**

Run: `pnpm test -- --run src/__tests__/claude-registry.test.ts`
Expected: FAIL — cannot find module `@/features/claude/registry`.

- [ ] **Step 3: Create `src/features/claude/types.ts`**

```ts
export type ShelfKey = "starter" | "power" | "developer";

export interface ShelfMeta {
  key: ShelfKey;
  viTitle: string;       // Vietnamese shelf label shown on /claude
  viSubtitle: string;    // one-line description
  enTitle: string;       // fallback used for a11y + structured data
}

export interface TileMeta {
  slug: string;          // URL segment under /claude/
  shelf: ShelfKey;
  viTitle: string;       // Vietnamese tile label
  viTagline: string;     // one-line Vietnamese hook
  status: "planned" | "ready";  // "planned" = renders TilePlaceholder
  badge?: "new" | null;  // optional flag (e.g. Claude Design = new)
}

export interface Annotation {
  id: string;
  /** 1-based pin number shown in the overlay circle. */
  pin: number;
  /** Short Vietnamese label rendered next to the pin. */
  label: string;
  /** Longer description read by screen readers. */
  description: string;
  /** [start, end] on the DemoCanvas playhead (0..1). */
  showAt: [number, number];
  /** Anchor point in the shell — CSS selector or named slot. */
  anchor: { x: number; y: number }; // percent of shell width/height
}
```

- [ ] **Step 4: Create `src/features/claude/registry.ts`**

```ts
import type { ShelfKey, ShelfMeta, TileMeta } from "./types";

export const SHELF_ORDER = ["starter", "power", "developer"] as const;

export const SHELF_META: Record<ShelfKey, ShelfMeta> = {
  starter: {
    key: "starter",
    viTitle: "Khởi đầu",
    viSubtitle: "Những gì bạn thấy trong giờ đầu dùng Claude Desktop.",
    enTitle: "Starter",
  },
  power: {
    key: "power",
    viTitle: "Nâng cao",
    viSubtitle: "Các tính năng mở rộng cho công việc nhiều bước, nhiều nguồn.",
    enTitle: "Power user",
  },
  developer: {
    key: "developer",
    viTitle: "Dành cho nhà phát triển",
    viSubtitle: "Claude Code, API, agent SDK và hạ tầng tự động.",
    enTitle: "Developer",
  },
};

// Keep the order stable — it's the on-page order shown under each shelf.
export const tiles: TileMeta[] = [
  // Shelf 1 — Khởi đầu (8)
  { slug: "chat",          shelf: "starter",   viTitle: "Chat + phản hồi trực tiếp", viTagline: "Token chảy từng chữ một.",                status: "planned" },
  { slug: "projects",      shelf: "starter",   viTitle: "Projects",                  viTagline: "Không gian làm việc dài hạn.",              status: "planned" },
  { slug: "artifacts",     shelf: "starter",   viTitle: "Artifacts",                 viTagline: "Panel bên phải cho mã, tài liệu, app.",      status: "planned" },
  { slug: "files-vision",  shelf: "starter",   viTitle: "Files & Vision",            viTagline: "Đọc PDF, ảnh, Excel.",                       status: "planned" },
  { slug: "voice",         shelf: "starter",   viTitle: "Voice Mode",                viTagline: "Nói chuyện với Claude.",                     status: "planned" },
  { slug: "web-search",    shelf: "starter",   viTitle: "Web Search",                viTagline: "Thông tin mới nhất, có trích dẫn.",          status: "planned" },
  { slug: "claude-design", shelf: "starter",   viTitle: "Claude Design",             viTagline: "Slide, prototype, one-pager.",               status: "planned", badge: "new" },
  { slug: "chrome",        shelf: "starter",   viTitle: "Claude for Chrome",         viTagline: "Claude đọc trang web bạn đang xem.",         status: "planned" },

  // Shelf 2 — Nâng cao (8)
  { slug: "thinking",      shelf: "power",     viTitle: "Extended thinking",         viTagline: "Xem Claude suy luận, điều chỉnh độ sâu.",    status: "planned" },
  { slug: "skills",        shelf: "power",     viTitle: "Skills",                    viTagline: "Lệnh /skill và skill do bạn viết.",          status: "planned" },
  { slug: "workspace",     shelf: "power",     viTitle: "Workspace",                 viTagline: "Gmail, Drive, Slack, Office trực tiếp.",     status: "planned" },
  { slug: "mcp",           shelf: "power",     viTitle: "MCP connectors",            viTagline: "Cắm thêm nguồn dữ liệu riêng.",              status: "planned" },
  { slug: "cowork",        shelf: "power",     viTitle: "Cowork",                    viTagline: "Claude tạm dừng chờ bạn duyệt.",             status: "planned" },
  { slug: "memory",        shelf: "power",     viTitle: "Memory",                    viTagline: "Ghi nhớ xuyên phiên, xây tri thức.",         status: "planned" },
  { slug: "routines",      shelf: "power",     viTitle: "Routines",                  viTagline: "Tác vụ chạy định kỳ trên hạ tầng Anthropic.", status: "planned" },
  { slug: "dispatch",      shelf: "power",     viTitle: "Dispatch + Remote",         viTagline: "Bắt đầu trên điện thoại, tiếp ở desktop.",   status: "planned" },

  // Shelf 3 — Dành cho nhà phát triển (8)
  { slug: "claude-code",   shelf: "developer", viTitle: "Claude Code",               viTagline: "Terminal, IDE, Desktop, Web.",               status: "planned" },
  { slug: "tool-use",      shelf: "developer", viTitle: "Tool use",                  viTagline: "Function call, Bash, Computer use.",         status: "planned" },
  { slug: "prompt-caching",shelf: "developer", viTitle: "Prompt caching",            viTagline: "Cache hệ thống + ngữ cảnh lớn.",             status: "planned" },
  { slug: "batch",         shelf: "developer", viTitle: "Batch API",                 viTagline: "50% chi phí cho yêu cầu hàng loạt.",         status: "planned" },
  { slug: "context",       shelf: "developer", viTitle: "Context management",        viTagline: "1M token, compaction, trim.",                status: "planned" },
  { slug: "subagents",     shelf: "developer", viTitle: "Sub-agents + Agent SDK",    viTagline: "Sinh agent song song.",                      status: "planned" },
  { slug: "structured",    shelf: "developer", viTitle: "Structured outputs",        viTagline: "JSON schema đảm bảo, citation.",             status: "planned" },
  { slug: "cicd",          shelf: "developer", viTitle: "Claude in CI/CD",           viTagline: "GitHub Actions, review PR, triage issue.",    status: "planned" },
];

export const shelves: Record<ShelfKey, { meta: ShelfMeta; tiles: TileMeta[] }> =
  Object.fromEntries(
    SHELF_ORDER.map((key) => [
      key,
      { meta: SHELF_META[key], tiles: tiles.filter((t) => t.shelf === key) },
    ])
  ) as Record<ShelfKey, { meta: ShelfMeta; tiles: TileMeta[] }>;

export function findTile(slug: string): TileMeta | undefined {
  return tiles.find((t) => t.slug === slug);
}
```

- [ ] **Step 5: Run the test again**

Run: `pnpm test -- --run src/__tests__/claude-registry.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/features/claude/types.ts src/features/claude/registry.ts src/__tests__/claude-registry.test.ts
git commit -m "feat(claude): seed types + 24-tile registry for Phase 1"
```

---

## Task 2: `AccentHueSweep` — animated gradient clip on hero text

**Files:**
- Create: `src/features/claude/AccentHueSweep.tsx`
- Test: `src/__tests__/claude-accent-hue-sweep.test.tsx`

- [ ] **Step 1: Context7 check**

Run before writing the component:
```
mcp__claude_ai_Context7__resolve-library-id → "framer-motion"
mcp__claude_ai_Context7__query-docs → topics: "useReducedMotion"
```
Confirm `useReducedMotion()` returns `boolean | null` and is safe inside `"use client"` components.

- [ ] **Step 2: Write the failing test**

Write `src/__tests__/claude-accent-hue-sweep.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as fm from "framer-motion";
import AccentHueSweep from "@/features/claude/AccentHueSweep";

describe("AccentHueSweep", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children inline with lang attr when provided", () => {
    render(<AccentHueSweep lang="vi">hình ảnh và ví dụ</AccentHueSweep>);
    const el = screen.getByText("hình ảnh và ví dụ");
    expect(el.tagName).toBe("SPAN");
    expect(el.getAttribute("lang")).toBe("vi");
  });

  it("applies animated gradient when reduced motion is off", () => {
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(false);
    render(<AccentHueSweep>hi</AccentHueSweep>);
    const el = screen.getByText("hi");
    expect(el.className).toContain("animate-[hue-sweep");
  });

  it("applies static gradient when reduced motion is on", () => {
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(true);
    render(<AccentHueSweep>hi</AccentHueSweep>);
    const el = screen.getByText("hi");
    expect(el.className).not.toContain("animate-");
  });
});
```

- [ ] **Step 3: Verify the test fails**

Run: `pnpm test -- --run src/__tests__/claude-accent-hue-sweep.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Create `src/features/claude/AccentHueSweep.tsx`**

```tsx
"use client";

import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface AccentHueSweepProps {
  children: ReactNode;
  lang?: string;
  className?: string;
}

/**
 * Clips an animated conic-gradient to text on the hero headline.
 * Reduced motion → static warm gradient (no animation).
 *
 * Gradient uses existing DS tokens (--turquoise-500, --peach-500, --clay)
 * so we don't introduce new colors.
 */
export default function AccentHueSweep({
  children,
  lang,
  className = "",
}: AccentHueSweepProps) {
  const reduce = useReducedMotion();

  const base: React.CSSProperties = {
    backgroundImage: reduce
      ? "linear-gradient(90deg, var(--turquoise-500) 0%, var(--peach-500) 55%, var(--clay) 100%)"
      : "conic-gradient(from var(--hue-sweep-angle, 0deg) at 50% 50%, var(--turquoise-500), var(--peach-500), var(--clay), var(--turquoise-500))",
    backgroundSize: reduce ? "100% 100%" : "300% 300%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };

  return (
    <span
      lang={lang}
      className={
        reduce
          ? className
          : `${className} animate-[hue-sweep_7s_linear_infinite]`
      }
      style={base}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Add the keyframes to `src/app/globals.css`**

Append at the end of the file:

```css
@keyframes hue-sweep {
  0%   { background-position:   0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position:   0% 50%; }
}
```

- [ ] **Step 6: Run tests**

Run: `pnpm test -- --run src/__tests__/claude-accent-hue-sweep.test.tsx`
Expected: PASS — 3 tests green.

- [ ] **Step 7: Commit**

```bash
git add src/features/claude/AccentHueSweep.tsx src/app/globals.css src/__tests__/claude-accent-hue-sweep.test.tsx
git commit -m "feat(claude): add AccentHueSweep gradient-clip component"
```

---

## Task 3: Remove ✳, wrap "hình ảnh và ví dụ" in `AccentHueSweep`

**Files:**
- Modify: `src/components/home/HeroSearch.tsx:61-100`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/claude-hero-accent.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/home/DifficultyFilter", () => ({
  default: () => <div data-testid="diff-filter" />,
}));

import HeroSearch from "@/components/home/HeroSearch";

describe("HeroSearch hero", () => {
  it("does not render the ✳ mark anymore", () => {
    render(
      <HeroSearch
        topics={[]}
        selectedDifficulty="all"
        onDifficultyChange={() => {}}
        counts={{ all: 0 }}
      />
    );
    expect(screen.queryByText("✳")).toBeNull();
  });

  it("renders the gradient-clipped 'hình ảnh và ví dụ' phrase", () => {
    render(
      <HeroSearch
        topics={[]}
        selectedDifficulty="all"
        onDifficultyChange={() => {}}
        counts={{ all: 0 }}
      />
    );
    expect(screen.getByText("hình ảnh và ví dụ")).toBeInTheDocument();
  });

  it("keeps the full headline text accessible", () => {
    render(
      <HeroSearch
        topics={[]}
        selectedDifficulty="all"
        onDifficultyChange={() => {}}
        counts={{ all: 0 }}
      />
    );
    expect(
      screen.getByRole("heading", { level: 1 }).textContent
    ).toContain("Hiểu AI qua hình ảnh và ví dụ.");
  });
});
```

- [ ] **Step 2: Confirm it fails**

Run: `pnpm test -- --run src/__tests__/claude-hero-accent.test.tsx`
Expected: FAIL — the ✳ mark still renders; "hình ảnh và ví dụ" isn't its own span yet.

- [ ] **Step 3: Edit `src/components/home/HeroSearch.tsx`**

Remove lines 62–70 (the `<motion.span … ✳</motion.span>` block).

Replace the H1 body (line 99) from:

```tsx
Hiểu AI qua hình ảnh và ví dụ.
```

with:

```tsx
Hiểu AI qua{" "}
<AccentHueSweep lang="vi">hình ảnh và ví dụ</AccentHueSweep>
.
```

Add the import at top of file:

```tsx
import AccentHueSweep from "@/features/claude/AccentHueSweep";
```

Also adjust the doc comment at line 28 — replace "One DS asterisk mark (✳) in turquoise-ink, counted as the surface's single turquoise use." with:

```
 *    Hero headline accents "hình ảnh và ví dụ" via <AccentHueSweep>
 *    (animated conic gradient clipped to text), replacing the prior ✳.
```

- [ ] **Step 4: Tests pass**

Run: `pnpm test -- --run src/__tests__/claude-hero-accent.test.tsx`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/HeroSearch.tsx src/__tests__/claude-hero-accent.test.tsx
git commit -m "feat(home): swap ✳ mark for AccentHueSweep on hero phrase"
```

---

## Task 4: `ClaudeHeroCard` CTA + integrate in `HomeContent`

**Files:**
- Create: `src/components/home/ClaudeHeroCard.tsx`
- Modify: `src/components/home/HomeContent.tsx:88` (insert between stats strip and `AuthWarningBanner`)
- Test: `src/__tests__/claude-hero-card.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClaudeHeroCard from "@/components/home/ClaudeHeroCard";

describe("ClaudeHeroCard", () => {
  it("links to /claude", () => {
    render(<ClaudeHeroCard />);
    const link = screen.getByRole("link", { name: /Cẩm nang Claude/i });
    expect(link.getAttribute("href")).toBe("/claude");
  });

  it("shows the Vietnamese hook copy", () => {
    render(<ClaudeHeroCard />);
    expect(
      screen.getByText(/Chưa dùng Claude\? Bắt đầu ở đây/)
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect fail**

Run: `pnpm test -- --run src/__tests__/claude-hero-card.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/home/ClaudeHeroCard.tsx`**

```tsx
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Single-line CTA card under the ask bar. Teases the /claude flagship
 * guide without taking the full width of a proper hero section.
 */
export default function ClaudeHeroCard() {
  return (
    <section className="mx-auto max-w-[720px] px-4 pb-4 sm:pb-6">
      <Link
        href="/claude"
        aria-label="Cẩm nang Claude — Chưa dùng Claude? Bắt đầu ở đây"
        className="group flex items-center justify-between gap-4 border border-border bg-card px-5 py-3 text-[14px] text-foreground transition-[border-color,box-shadow] duration-200 hover:border-[color:var(--border-strong)]"
        style={{ borderRadius: 12, boxShadow: "var(--shadow-sm)" }}
      >
        <span className="flex items-center gap-3">
          <Sparkles size={16} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
          <span>
            <span className="font-medium">Cẩm nang Claude.</span>{" "}
            <span className="text-muted">Chưa dùng Claude? Bắt đầu ở đây.</span>
          </span>
        </span>
        <ArrowRight
          size={15}
          strokeWidth={1.75}
          className="shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}
```

- [ ] **Step 4: Run unit test**

Run: `pnpm test -- --run src/__tests__/claude-hero-card.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Insert into `HomeContent.tsx`**

Open `src/components/home/HomeContent.tsx`. Find the stats strip closing `</section>` on line 86. After it (before `<AuthWarningBanner />` on line 88), insert:

```tsx
      <ClaudeHeroCard />
```

Add import at top:

```tsx
import ClaudeHeroCard from "./ClaudeHeroCard";
```

- [ ] **Step 6: Smoke test — homepage still renders**

Run: `pnpm test -- --run` (full suite, expect pre-existing 2 failures unchanged, everything else green).

- [ ] **Step 7: Commit**

```bash
git add src/components/home/ClaudeHeroCard.tsx src/components/home/HomeContent.tsx src/__tests__/claude-hero-card.test.tsx
git commit -m "feat(home): add ClaudeHeroCard CTA under ask bar"
```

---

## Task 5: Navbar link to `/claude`

**Files:**
- Modify: `src/components/layout/Navbar.tsx:29-60`
- Test: `src/__tests__/claude-navbar-link.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/ui/ThemeToggle", () => ({
  default: () => <div data-testid="theme-toggle" />,
}));
vi.mock("@/components/auth/AuthButton", () => ({
  default: () => <div data-testid="auth-button" />,
}));

import Navbar from "@/components/layout/Navbar";

describe("Navbar", () => {
  it("links to the Claude guide", () => {
    render(<Navbar />);
    const link = screen.getByRole("link", { name: /Cẩm nang Claude/i });
    expect(link.getAttribute("href")).toBe("/claude");
  });
});
```

- [ ] **Step 2: Run — expect fail**

Run: `pnpm test -- --run src/__tests__/claude-navbar-link.test.tsx`
Expected: FAIL — no link with that name.

- [ ] **Step 3: Edit `Navbar.tsx`**

Add this `<Link>` after the ⌘K button (line 40's closing `</button>`), before the `/progress` link:

```tsx
          <Link
            href="/claude"
            className="hidden md:inline-flex items-center rounded-[var(--r-md)] px-2.5 py-1.5 text-[13px] font-medium text-tertiary transition-colors hover:text-foreground hover:bg-surface"
            aria-label="Cẩm nang Claude"
          >
            Cẩm nang Claude
          </Link>
```

- [ ] **Step 4: Test passes**

Run: `pnpm test -- --run src/__tests__/claude-navbar-link.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Navbar.tsx src/__tests__/claude-navbar-link.test.tsx
git commit -m "feat(nav): add 'Cẩm nang Claude' link to desktop navbar"
```

---

## Task 6: `ClaudeDesktopShell` primitive

**Files:**
- Create: `src/features/claude/components/ClaudeDesktopShell.tsx`
- Test: `src/__tests__/claude-desktop-shell.test.tsx`

**Design notes:** Pure presentational scaffold. Claude Desktop snapshot pinned to **2026-04-18** — any later change must update the component's doc comment date. Four slots: `topBar`, `leftRail`, `main`, `artifactsPanel`. Slot children are caller-provided.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClaudeDesktopShell } from "@/features/claude/components/ClaudeDesktopShell";

describe("ClaudeDesktopShell", () => {
  it("renders all slots when provided", () => {
    render(
      <ClaudeDesktopShell
        topBar={<div data-testid="tb">tb</div>}
        leftRail={<div data-testid="lr">lr</div>}
        main={<div data-testid="main">main</div>}
        artifactsPanel={<div data-testid="ap">ap</div>}
      />
    );
    expect(screen.getByTestId("tb")).toBeInTheDocument();
    expect(screen.getByTestId("lr")).toBeInTheDocument();
    expect(screen.getByTestId("main")).toBeInTheDocument();
    expect(screen.getByTestId("ap")).toBeInTheDocument();
  });

  it("omits the artifacts panel when not provided", () => {
    render(
      <ClaudeDesktopShell
        topBar={<div>tb</div>}
        leftRail={<div>lr</div>}
        main={<div>main</div>}
      />
    );
    expect(screen.queryByRole("complementary", { name: /artifacts/i })).toBeNull();
  });

  it("exposes a shell container with data-claude-shell for testing", () => {
    const { container } = render(
      <ClaudeDesktopShell topBar={<div />} leftRail={<div />} main={<div />} />
    );
    expect(container.querySelector("[data-claude-shell]")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Fail**

Run: `pnpm test -- --run src/__tests__/claude-desktop-shell.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the component**

`src/features/claude/components/ClaudeDesktopShell.tsx`:

```tsx
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
 *          Shell.Message, Shell.ComposerStub for common message UI.
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
            aria-label="Artifacts panel"
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

/** Pre-styled bubbles for common message UI inside Shell.main. */
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
```

- [ ] **Step 4: Tests pass**

Run: `pnpm test -- --run src/__tests__/claude-desktop-shell.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/claude/components/ClaudeDesktopShell.tsx src/__tests__/claude-desktop-shell.test.tsx
git commit -m "feat(claude): add ClaudeDesktopShell primitive (pinned 2026-04-18)"
```

---

## Task 7: `AnnotationLayer` primitive

**Files:**
- Create: `src/features/claude/components/AnnotationLayer.tsx`
- Test: `src/__tests__/claude-annotation-layer.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Annotation } from "@/features/claude/types";
import { AnnotationLayer } from "@/features/claude/components/AnnotationLayer";

const fixture: Annotation[] = [
  {
    id: "a",
    pin: 1,
    label: "Token đầu",
    description: "Token đầu tiên xuất hiện ngay sau khi Enter.",
    showAt: [0, 0.3],
    anchor: { x: 50, y: 50 },
  },
  {
    id: "b",
    pin: 2,
    label: "Token cuối",
    description: "Token cuối cùng trước khi Claude dừng.",
    showAt: [0.7, 1],
    anchor: { x: 60, y: 40 },
  },
];

describe("AnnotationLayer", () => {
  it("shows only annotations whose showAt contains the playhead", () => {
    render(<AnnotationLayer annotations={fixture} playhead={0.1} />);
    expect(screen.getByText("Token đầu")).toBeInTheDocument();
    expect(screen.queryByText("Token cuối")).toBeNull();
  });

  it("supports multiple simultaneous annotations", () => {
    render(
      <AnnotationLayer
        annotations={[
          { ...fixture[0], showAt: [0, 1] },
          { ...fixture[1], showAt: [0, 1] },
        ]}
        playhead={0.5}
      />
    );
    expect(screen.getByText("Token đầu")).toBeInTheDocument();
    expect(screen.getByText("Token cuối")).toBeInTheDocument();
  });

  it("renders pin numbers with aria-label = description for SR users", () => {
    render(<AnnotationLayer annotations={fixture} playhead={0.1} />);
    const pin = screen.getByLabelText(fixture[0].description);
    expect(pin.textContent).toBe("1");
  });

  it("shows all annotations when staticMode is true regardless of playhead", () => {
    render(
      <AnnotationLayer annotations={fixture} playhead={0} staticMode />
    );
    expect(screen.getByText("Token đầu")).toBeInTheDocument();
    expect(screen.getByText("Token cuối")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Fail**

Run: `pnpm test -- --run src/__tests__/claude-annotation-layer.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Create the component**

`src/features/claude/components/AnnotationLayer.tsx`:

```tsx
import type { Annotation } from "@/features/claude/types";

export interface AnnotationLayerProps {
  annotations: Annotation[];
  /** 0..1 position of the demo's playhead. */
  playhead: number;
  /** When true, show every annotation ignoring showAt (used by reduced-motion). */
  staticMode?: boolean;
  className?: string;
}

export function AnnotationLayer({
  annotations,
  playhead,
  staticMode = false,
  className = "",
}: AnnotationLayerProps) {
  const visible = staticMode
    ? annotations
    : annotations.filter(
        ({ showAt: [s, e] }) => playhead >= s && playhead <= e
      );

  return (
    <div
      aria-hidden={visible.length === 0}
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      {visible.map((a) => (
        <div
          key={a.id}
          className="absolute flex items-center gap-2"
          style={{
            left: `${a.anchor.x}%`,
            top: `${a.anchor.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span
            aria-label={a.description}
            role="img"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-foreground bg-[var(--paper,#FBFAF7)] text-[11px] font-semibold text-foreground"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            {a.pin}
          </span>
          <span className="rounded-[6px] border border-border bg-[var(--paper,#FBFAF7)] px-2 py-0.5 text-[12px] text-foreground">
            {a.label}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Pass**

Run: `pnpm test -- --run src/__tests__/claude-annotation-layer.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/claude/components/AnnotationLayer.tsx src/__tests__/claude-annotation-layer.test.tsx
git commit -m "feat(claude): add AnnotationLayer with showAt scrubbing"
```

---

## Task 8: `DemoCanvas` primitive (reduced-motion + keyboard)

**Files:**
- Create: `src/features/claude/components/DemoCanvas.tsx`
- Test: `src/__tests__/claude-demo-canvas.test.tsx`

- [ ] **Step 1: Context7 check**

`mcp__claude_ai_Context7__query-docs` on framer-motion: topic `useReducedMotion` (confirm SSR-safety — it returns `null` on server, boolean after hydrate).

- [ ] **Step 2: Write failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as fm from "framer-motion";
import { DemoCanvas } from "@/features/claude/components/DemoCanvas";

describe("DemoCanvas", () => {
  it("calls onPlay when space is pressed", () => {
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(false);
    const onPlay = vi.fn();
    render(
      <DemoCanvas title="t" onPlay={onPlay} onReset={() => {}}>
        <div>body</div>
      </DemoCanvas>
    );
    const region = screen.getByRole("region", { name: /t/i });
    region.focus();
    fireEvent.keyDown(region, { key: " " });
    expect(onPlay).toHaveBeenCalled();
  });

  it("renders a 'Xem tĩnh' skip button in reduced-motion mode", () => {
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(true);
    render(
      <DemoCanvas title="t" onPlay={() => {}} onReset={() => {}}>
        <div>body</div>
      </DemoCanvas>
    );
    expect(screen.getByRole("button", { name: /Xem tĩnh/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Fail**

Run: `pnpm test -- --run src/__tests__/claude-demo-canvas.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Create the component**

`src/features/claude/components/DemoCanvas.tsx`:

```tsx
"use client";

import { useReducedMotion } from "framer-motion";
import type { KeyboardEvent, ReactNode } from "react";

interface DemoCanvasProps {
  title: string;
  children: ReactNode;
  onPlay: () => void;
  onReset: () => void;
  onStep?: () => void;
  /** When true, the demo is currently running. */
  playing?: boolean;
  className?: string;
}

/**
 * Container for each feature demo.
 * - Owns keyboard controls: Space = play, → = step, R = reset.
 * - Emits a "Xem tĩnh" skip button when prefers-reduced-motion is on.
 * - Focusable region so screen-reader users can see its title.
 */
export function DemoCanvas({
  title,
  children,
  onPlay,
  onReset,
  onStep,
  playing,
  className = "",
}: DemoCanvasProps) {
  const reduce = useReducedMotion();

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " ") {
      e.preventDefault();
      onPlay();
    } else if (e.key === "ArrowRight" && onStep) {
      e.preventDefault();
      onStep();
    } else if (e.key === "r" || e.key === "R") {
      onReset();
    }
  };

  return (
    <section
      role="region"
      aria-label={title}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={`relative rounded-[14px] border border-border bg-[var(--paper-2,#F3F2EE)] p-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--turquoise-500,#20B8B0)] ${className}`}
    >
      <header className="mb-3 flex items-center justify-between gap-4 text-[12px]">
        <span className="font-mono uppercase tracking-[0.06em] text-tertiary">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {reduce ? (
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-foreground hover:bg-surface"
            >
              Xem tĩnh
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onPlay}
                aria-pressed={!!playing}
                className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-foreground hover:bg-surface"
              >
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-foreground hover:bg-surface"
              >
                ↻ Reset
              </button>
            </>
          )}
        </div>
      </header>
      <div className="relative">{children}</div>
    </section>
  );
}
```

- [ ] **Step 5: Tests pass**

Run: `pnpm test -- --run src/__tests__/claude-demo-canvas.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/claude/components/DemoCanvas.tsx src/__tests__/claude-demo-canvas.test.tsx
git commit -m "feat(claude): add DemoCanvas (reduced-motion + keyboard)"
```

---

## Task 9: `DeepLinkCTA` — "Thử trong Claude"

**Files:**
- Create: `src/features/claude/components/DeepLinkCTA.tsx`
- Test: `src/__tests__/claude-deep-link-cta.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeepLinkCTA } from "@/features/claude/components/DeepLinkCTA";

describe("DeepLinkCTA", () => {
  it("URL-encodes the prompt into claude.ai/new?q=", () => {
    render(<DeepLinkCTA prompt="Viết email xin lỗi sếp vì đi trễ" />);
    const link = screen.getByRole("link", { name: /Thử trong Claude/i });
    expect(link.getAttribute("href")).toBe(
      "https://claude.ai/new?q=" +
        encodeURIComponent("Viết email xin lỗi sếp vì đi trễ")
    );
  });

  it("opens in a new tab with safe rel", () => {
    render(<DeepLinkCTA prompt="hi" />);
    const link = screen.getByRole("link", { name: /Thử trong Claude/i });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("supports a doc-link variant for non-deep-linkable features", () => {
    render(<DeepLinkCTA docHref="https://docs.claude.com/skills" label="Mở tài liệu Skills" />);
    const link = screen.getByRole("link", { name: /Mở tài liệu Skills/ });
    expect(link.getAttribute("href")).toBe("https://docs.claude.com/skills");
  });
});
```

- [ ] **Step 2: Fail**

Run: `pnpm test -- --run src/__tests__/claude-deep-link-cta.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Create the component**

`src/features/claude/components/DeepLinkCTA.tsx`:

```tsx
import { ArrowUpRight } from "lucide-react";

type Props =
  | {
      prompt: string;
      docHref?: never;
      label?: string;
      className?: string;
    }
  | {
      prompt?: never;
      docHref: string;
      label: string;
      className?: string;
    };

/**
 * CTA that either:
 *  1. deep-links a seeded prompt into claude.ai/new?q=...
 *  2. or opens an Anthropic doc page for non-deep-linkable features (Skills, MCP).
 */
export function DeepLinkCTA(props: Props) {
  const href = props.prompt
    ? `https://claude.ai/new?q=${encodeURIComponent(props.prompt)}`
    : props.docHref;
  const label = props.label ?? "Thử trong Claude";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full border border-foreground bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-transform hover:translate-y-[-1px] ${props.className ?? ""}`}
    >
      {label}
      <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
    </a>
  );
}
```

- [ ] **Step 4: Pass**

Run: `pnpm test -- --run src/__tests__/claude-deep-link-cta.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/claude/components/DeepLinkCTA.tsx src/__tests__/claude-deep-link-cta.test.tsx
git commit -m "feat(claude): add DeepLinkCTA (prompt + doc variants)"
```

---

## Task 10: `ShelfGrid` + `TilePlaceholder`

**Files:**
- Create: `src/features/claude/components/ShelfGrid.tsx`
- Create: `src/features/claude/components/TilePlaceholder.tsx`

- [ ] **Step 1: Create `TilePlaceholder.tsx`**

```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DeepLinkCTA } from "./DeepLinkCTA";
import type { TileMeta } from "@/features/claude/types";

/**
 * Phase 1 body for every tile page. Later phases swap this out with a
 * real DemoCanvas per tile.
 */
export function TilePlaceholder({ tile }: { tile: TileMeta }) {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16">
      <p className="ds-eyebrow mb-3">
        Cẩm nang Claude · {shelfVi(tile.shelf)}
      </p>
      <h1
        className="font-display text-foreground"
        style={{
          fontWeight: 500,
          fontSize: "clamp(32px, 5vw, 48px)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        {tile.viTitle}
      </h1>
      <p className="mt-4 text-[17px] leading-[1.55] text-muted">
        {tile.viTagline}
      </p>

      <section
        className="mt-10 rounded-[14px] border border-border bg-card p-6"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <p className="ds-eyebrow mb-2">Đang xây dựng</p>
        <p className="text-[15px] leading-[1.6] text-foreground">
          Bài hướng dẫn tương tác cho tính năng này đang được soạn. Tạm thời
          bạn có thể mở Claude và thử ngay — tài liệu chính thức của Anthropic
          sẽ hiện ở nút bên dưới.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <DeepLinkCTA prompt={defaultPromptFor(tile.slug)} />
          <Link
            href="/claude"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface"
          >
            ← Xem toàn bộ cẩm nang
          </Link>
        </div>
      </section>
    </div>
  );
}

function shelfVi(shelf: TileMeta["shelf"]) {
  return shelf === "starter"
    ? "Khởi đầu"
    : shelf === "power"
    ? "Nâng cao"
    : "Dành cho nhà phát triển";
}

function defaultPromptFor(slug: string): string {
  // Seed prompt keyed to the tile; phases 2-4 can override per-tile.
  return `Tôi muốn học cách dùng tính năng "${slug}" trong Claude. Bạn có thể giới thiệu ngắn và hướng dẫn tôi thử một ví dụ?`;
}
```

- [ ] **Step 2: Create `ShelfGrid.tsx`**

```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ShelfMeta, TileMeta } from "@/features/claude/types";

interface ShelfGridProps {
  shelf: ShelfMeta;
  tiles: TileMeta[];
  index: number; // 1-based shelf position for the eyebrow
}

export function ShelfGrid({ shelf, tiles, index }: ShelfGridProps) {
  return (
    <section
      id={shelf.key}
      aria-labelledby={`shelf-${shelf.key}-title`}
      className="mx-auto max-w-[1100px] px-4 pb-16 sm:px-6"
    >
      <header className="mb-6 border-b border-border pb-3">
        <p className="ds-eyebrow mb-1.5">
          Kệ {index} · {shelf.enTitle}
        </p>
        <h2
          id={`shelf-${shelf.key}-title`}
          className="font-display text-foreground"
          style={{
            fontWeight: 500,
            fontSize: 26,
            lineHeight: 1.15,
            letterSpacing: "-0.015em",
            margin: 0,
          }}
        >
          {shelf.viTitle}
        </h2>
        <p className="mt-1.5 text-[14px] text-muted">{shelf.viSubtitle}</p>
      </header>

      <ul
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {tiles.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/claude/${t.slug}`}
              className="group flex h-full flex-col justify-between gap-3 rounded-[12px] border border-border bg-card p-4 transition-[border-color,box-shadow] duration-150 hover:border-[color:var(--border-strong)] hover:shadow-[var(--shadow-sm)]"
            >
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[14px] font-medium text-foreground">
                    {t.viTitle}
                  </span>
                  {t.badge === "new" && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background: "var(--peach-200)",
                        color: "var(--clay)",
                      }}
                    >
                      Mới
                    </span>
                  )}
                </div>
                <p className="text-[13px] leading-[1.5] text-muted">
                  {t.viTagline}
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.06em] text-tertiary transition-colors group-hover:text-foreground"
              >
                {t.status === "planned" ? "Đang xây dựng" : "Mở demo"}
                <ArrowUpRight size={12} strokeWidth={1.75} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/claude/components/ShelfGrid.tsx src/features/claude/components/TilePlaceholder.tsx
git commit -m "feat(claude): add ShelfGrid + TilePlaceholder renderers"
```

---

## Task 11: `/claude` hub route

**Files:**
- Create: `src/app/claude/layout.tsx`
- Create: `src/app/claude/page.tsx`
- Test: `src/__tests__/claude-hub-page.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClaudeHub from "@/app/claude/page";

describe("/claude hub", () => {
  it("renders all 24 tile links", () => {
    render(<ClaudeHub />);
    const links = screen.getAllByRole("link");
    const tileLinks = links.filter((l) =>
      /^\/claude\/[a-z-]+$/.test(l.getAttribute("href") ?? "")
    );
    expect(tileLinks.length).toBe(24);
  });

  it("renders the 3 shelf headings", () => {
    render(<ClaudeHub />);
    expect(screen.getByRole("heading", { name: /Khởi đầu/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Nâng cao/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Dành cho nhà phát triển/ })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Fail**

Run: `pnpm test -- --run src/__tests__/claude-hub-page.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/app/claude/layout.tsx`**

```tsx
import type { Metadata, ReactNode } from "next";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Cẩm nang Claude · AI Cho Mọi Người",
  description:
    "Hướng dẫn trực quan, tiếng Việt cho mọi tính năng của Claude — từ Chat đến Claude Code.",
};

export default function ClaudeLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 4: Create `src/app/claude/page.tsx`**

```tsx
import { SHELF_ORDER, shelves } from "@/features/claude/registry";
import { ShelfGrid } from "@/features/claude/components/ShelfGrid";

export default function ClaudeHub() {
  return (
    <main>
      <header className="mx-auto max-w-[720px] px-4 pt-16 pb-10 text-center">
        <p className="ds-eyebrow mb-3">Cẩm nang Claude · Tiếng Việt</p>
        <h1
          className="font-display text-foreground"
          style={{
            fontWeight: 500,
            fontSize: "clamp(40px, 6.4vw, 64px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Mọi tính năng Claude, dạy bằng ví dụ.
        </h1>
        <p className="mt-5 text-[17px] leading-[1.55] text-muted">
          24 bài hướng dẫn trực quan. Mỗi bài là một mô phỏng giao diện Claude
          Desktop, có chú thích tiếng Việt, đọc xong là dùng được ngay.
        </p>
      </header>

      {SHELF_ORDER.map((key, i) => (
        <ShelfGrid
          key={key}
          shelf={shelves[key].meta}
          tiles={shelves[key].tiles}
          index={i + 1}
        />
      ))}
    </main>
  );
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test -- --run src/__tests__/claude-hub-page.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 6: Commit**

```bash
git add src/app/claude/layout.tsx src/app/claude/page.tsx src/__tests__/claude-hub-page.test.tsx
git commit -m "feat(claude): add /claude hub with 3 shelves × 24 tiles"
```

---

## Task 12: `/claude/[feature]` dispatcher

**Files:**
- Create: `src/app/claude/[feature]/page.tsx`
- Test: `src/__tests__/claude-feature-dispatcher.test.tsx`

- [ ] **Step 1: Context7 check**

`mcp__claude_ai_Context7__query-docs` on `next`: topics `generateStaticParams`, `generateMetadata`, and dynamic route segment params in Next.js 16. Confirm params shape is `Promise<{ feature: string }>` in Next 16.

- [ ] **Step 2: Write failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClaudeFeaturePage, {
  generateStaticParams,
} from "@/app/claude/[feature]/page";
import { notFound } from "next/navigation";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("/claude/[feature] dispatcher", () => {
  it("generateStaticParams returns 24 slugs", async () => {
    const params = await generateStaticParams();
    expect(params).toHaveLength(24);
    expect(params[0]).toHaveProperty("feature");
  });

  it("renders the tile's title for a known slug", async () => {
    const node = await ClaudeFeaturePage({
      params: Promise.resolve({ feature: "chat" }),
    });
    render(node);
    expect(
      screen.getByRole("heading", { name: /Chat \+ phản hồi trực tiếp/ })
    ).toBeInTheDocument();
  });

  it("calls notFound for an unknown slug", async () => {
    await expect(
      ClaudeFeaturePage({ params: Promise.resolve({ feature: "ghost" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Fail**

Run: `pnpm test -- --run src/__tests__/claude-feature-dispatcher.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Create `src/app/claude/[feature]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tiles, findTile } from "@/features/claude/registry";
import { TilePlaceholder } from "@/features/claude/components/TilePlaceholder";

type Params = { feature: string };

export async function generateStaticParams(): Promise<Params[]> {
  return tiles.map((t) => ({ feature: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { feature } = await params;
  const tile = findTile(feature);
  if (!tile) return {};
  return {
    title: `${tile.viTitle} · Cẩm nang Claude`,
    description: tile.viTagline,
  };
}

export default async function ClaudeFeaturePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { feature } = await params;
  const tile = findTile(feature);
  if (!tile) notFound();
  // Phase 1: every tile is "planned" and renders the placeholder.
  // Phases 2-4 will introduce per-slug bodies gated on tile.status.
  return <TilePlaceholder tile={tile} />;
}
```

- [ ] **Step 5: Tests pass**

Run: `pnpm test -- --run src/__tests__/claude-feature-dispatcher.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/app/claude/[feature]/page.tsx src/__tests__/claude-feature-dispatcher.test.tsx
git commit -m "feat(claude): add /claude/[feature] dispatcher (24 static params)"
```

---

## Task 13: Sitemap + full-suite verification

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Read the current sitemap**

```bash
cat src/app/sitemap.ts
```

- [ ] **Step 2: Add /claude + 24 feature URLs**

Find the array of URLs returned and append, grounded on the existing pattern (if it uses `topics` to emit `/topics/[slug]`, mirror that):

```ts
// inside the default export, add:
import { tiles } from "@/features/claude/registry";

// where `urls: MetadataRoute.Sitemap` is being built, push:
urls.push({
  url: `${baseUrl}/claude`,
  lastModified: new Date(),
  changeFrequency: "weekly",
  priority: 0.8,
});
for (const t of tiles) {
  urls.push({
    url: `${baseUrl}/claude/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  });
}
```

> If the existing sitemap returns a literal array (no intermediate `urls` variable), adapt by spreading the two lists inline using the same shape as neighbors.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck` (or `pnpm exec tsc --noEmit` if `typecheck` isn't a script).
Expected: 0 errors.

- [ ] **Step 4: Full test suite**

Run: `pnpm test -- --run`
Expected: Pre-existing 2 failures in `topic-section-uniqueness.test.ts` remain. Every other test — including the 10 new claude-* tests — passes.

- [ ] **Step 5: Production build**

Run: `pnpm build`
Expected: build succeeds; log shows `/claude` and 24 static `/claude/<slug>` routes emitted. No client-side bailouts on those routes.

- [ ] **Step 6: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): add /claude hub + 24 tile URLs to sitemap"
```

---

## Task 14: Final manual sanity sweep

No code changes; this is a review checkpoint for the executing agent before handing back.

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

Wait until the console prints `Ready`.

- [ ] **Step 2: Check these URLs manually (or via a subagent with Chrome MCP)**

  - `http://localhost:3000/` — ✳ is gone, hero phrase "hình ảnh và ví dụ" shows gradient clip, `ClaudeHeroCard` visible under the ask bar, navbar shows "Cẩm nang Claude".
  - `http://localhost:3000/claude` — hub loads, 3 shelves, 24 tile cards, each tile's link goes to `/claude/<slug>`.
  - `http://localhost:3000/claude/chat` — placeholder page renders the Vietnamese "Đang xây dựng" state with two buttons.
  - `http://localhost:3000/claude/ghost` — 404.
  - Dark mode toggled: both hub and placeholder look correct (no half-converted surfaces).

- [ ] **Step 3: Reduced-motion test**

In Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", then reload:
  - Hero phrase renders the **static** gradient (no animation loop).
  - Any DemoCanvas you render ad-hoc shows the "Xem tĩnh" button.

- [ ] **Step 4: Stop the dev server**

Ctrl-C.

- [ ] **Step 5: Summary comment on the plan file**

Append to this plan's end:

```md
---

## Phase 1 completion notes

Filled in by the executing agent:
- Commits landed: N
- LOC delta: +XXXX −XX
- Test count delta: +YY
- Known follow-ups for Phase 2: (any tile-specific decisions discovered)
```

- [ ] **Step 6: Commit the note**

```bash
git add docs/superpowers/plans/2026-04-18-claude-flagship-phase-1-foundation.md
git commit -m "docs(plan): record Phase 1 completion notes"
```

Phase 1 complete. Hand back to the user with: "Phase 1 foundation ready on branch `worktree-claude-flagship-guide`. Phases 2–4 (shelf tile content) each need their own plan."

---

## Self-review summary

**Spec coverage check:**
- §2 homepage changes → Tasks 3, 4, 5 ✓
- §3 route map → Tasks 11, 12, 13 ✓
- §4 four primitives → Tasks 6, 7, 8, 9 ✓
- §5 per-tile template → deferred to phases 2-4 (Task 10 lays the placeholder groundwork)
- §6 AccentHueSweep + visual identity → Task 2 ✓
- §7 dark mode → Task 14 step 2 manual check + each component uses DS tokens that already theme correctly
- §8 a11y → baked into Task 6 (role=figure), Task 7 (aria-label on pins), Task 8 (region + keyboard), Task 9 (rel noopener)
- §9 testing → 10 new test files across Tasks 1–12
- §10 phase 1 scope → this entire plan ✓
- §12 micro-decisions → shelves use anchor links (see `id={shelf.key}` in ShelfGrid); Claude Desktop UI snapshot date pinned in ClaudeDesktopShell doc comment; `claude-design` gets the "Mới" badge via `badge: "new"` in the registry
- §14 success criteria → final test + build + manual sweep all guard these

**Scope:** Phase 1 only. Phases 2, 3, 4 each get their own plan.

**Placeholder scan:** none — every task has complete code.

**Type consistency:** `TileMeta`, `ShelfKey`, `Annotation` defined once in `types.ts` and imported consistently. `findTile` / `tiles` / `shelves` exports used identically in all downstream files.
