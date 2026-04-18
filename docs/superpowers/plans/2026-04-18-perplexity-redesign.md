# Perplexity Design System Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ai-edu-v2's visual layer using the Perplexity design system (ink palette, teal accent, Space Grotesk / Inter Tight / JetBrains Mono typography), remove all kids content, default to light mode.

**Architecture:** Token-first cascade — update CSS variables and fonts in globals.css and layout.tsx, then sweep components that need manual touch-ups. ~90% of the visual change cascades automatically through existing Tailwind utility references.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (CSS-first config), next/font/google, framer-motion, lucide-react

**Worktree:** `.worktrees/perplexity-redesign` on branch `feature/perplexity-redesign`

---

### Task 1: Remove all kids content

**Files:**
- Delete: `src/components/kids/` (entire directory, 10 files)
- Delete: `src/topics/kids/` (entire directory, 8 files)
- Delete: `src/app/kids/` (entire directory, 6 files)
- Delete: `src/lib/kids/` (entire directory, 2 files)
- Delete: `src/components/paths/KidsPathPage.tsx`
- Delete: `src/__tests__/kids-landing.test.tsx`
- Delete: `src/__tests__/kids-mode-context.test.tsx`
- Delete: `src/__tests__/kids-nhi-infrastructure.test.tsx`
- Delete: `src/__tests__/kids-path-page.test.tsx`
- Delete: `src/__tests__/profession-paths-kids.test.tsx`
- Modify: `src/components/home/ProfessionPaths.tsx`
- Modify: `src/components/interactive/TopicLink.tsx`
- Modify: `src/lib/paths.ts`
- Modify: `src/app/globals.css`
- Modify: `src/__tests__/paths-lib.test.ts`
- Modify: `src/__tests__/topic-link-path-preserved.test.tsx`
- Modify: `src/__tests__/topic-link-dual-registry.test.tsx`

- [ ] **Step 1: Delete all kids directories and standalone files**

```bash
rm -rf src/components/kids/ src/topics/kids/ src/app/kids/ src/lib/kids/
rm src/components/paths/KidsPathPage.tsx
rm src/__tests__/kids-landing.test.tsx src/__tests__/kids-mode-context.test.tsx src/__tests__/kids-nhi-infrastructure.test.tsx src/__tests__/kids-path-page.test.tsx src/__tests__/profession-paths-kids.test.tsx
```

- [ ] **Step 2: Remove kids entries from ProfessionPaths.tsx**

Remove the two kids profession entries and the unused `Sparkles`, `Rocket` imports. The `professions` array should end after the `ai-researcher` entry:

```tsx
// In src/components/home/ProfessionPaths.tsx
// Remove these imports: Sparkles, Rocket
// Keep: GraduationCap, Briefcase, Code2, FlaskConical, ArrowRight

import {
  GraduationCap,
  Briefcase,
  Code2,
  FlaskConical,
  ArrowRight,
} from "lucide-react";

// Remove the last two entries from the professions array (kids-nhi and kids-teen).
// The array should end with:
  {
    id: "ai-researcher",
    nameVi: "AI Researcher",
    descriptionVi: "Lý thuyết sâu & xu hướng mới — scaling laws, alignment, kiến trúc tiên tiến",
    icon: FlaskConical,
    topicSlugs: slugsForPath("ai-researcher"),
  },
];
```

- [ ] **Step 3: Simplify TopicLink.tsx — remove kids routing**

Replace the entire file content with:

```tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { topicMap } from "@/topics/registry";
import { isAdultPathId } from "@/lib/paths";

interface TopicLinkProps {
  slug: string;
  children: React.ReactNode;
}

export default function TopicLink({ slug, children }: TopicLinkProps) {
  const searchParams = useSearchParams();

  if (process.env.NODE_ENV === "development") {
    if (!topicMap[slug]) {
      console.warn(`[TopicLink] slug "${slug}" not found in topicMap`);
    }
  }

  const rawPath = searchParams?.get("path") ?? null;
  const carryPath = isAdultPathId(rawPath) ? rawPath : null;
  const href = carryPath ? `/topics/${slug}?path=${carryPath}` : `/topics/${slug}`;

  return (
    <Link
      href={href}
      className="text-accent-dark dark:text-accent border-b border-dotted border-accent-dark/40 dark:border-accent/40 hover:border-accent-dark dark:hover:border-accent hover:opacity-80 transition-opacity"
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 4: Remove kids comment from paths.ts**

In `src/lib/paths.ts`, remove line 11: `* Kid paths (/kids/*) have their own namespace and are NOT included here.`

The JSDoc block should read:

```ts
/**
 * Path-aware navigation registry.
 *
 * Single source of truth for the four adult learning paths' stage structures.
 * TopicLayout reads ?path= from the URL and calls getPathNeighbors here to
 * derive prev/next links that follow the learner's current path rather than
 * the topic's category.
 */
```

- [ ] **Step 5: Remove kids CSS animations from globals.css**

Delete everything from line 238 to end of file (the `/* Kids — Nhí celebration animations */` block through `.animate-marble-appear`).

- [ ] **Step 6: Update test files**

In `src/__tests__/paths-lib.test.ts`, remove line 36:
```ts
    expect(isAdultPathId("kids-nhi")).toBe(false);
```

Replace `src/__tests__/topic-link-dual-registry.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const pathnameMock = vi.fn(() => "/topics/linear-regression");
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/topics/registry", () => ({
  topicMap: {
    "linear-regression": { slug: "linear-regression", title: "Linear Regression", titleVi: "Hồi quy tuyến tính" },
  },
}));

import TopicLink from "@/components/interactive/TopicLink";

describe("TopicLink registry awareness", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
  });

  it("links to /topics/:slug and validates against topicMap", () => {
    pathnameMock.mockReturnValue("/topics/linear-regression");
    render(<TopicLink slug="linear-regression">Hồi quy tuyến tính</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy tuyến tính" });
    expect(link).toHaveAttribute("href", "/topics/linear-regression");
  });
});
```

In `src/__tests__/topic-link-path-preserved.test.tsx`, remove the kids mock (lines 22-24):
```ts
vi.mock("@/topics/kids/kids-registry", () => ({
  kidsTopicMap: {},
}));
```

And remove the last test case (lines 63-69):
```ts
  it("on a /kids/* route, ignores ?path= entirely and routes to /kids/topics/:slug", () => {
    ...
  });
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: Zero type errors, all remaining tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: remove all kids content (components, routes, tests, CSS)"
```

---

### Task 2: Update fonts and typography

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace font imports**

Replace the entire `layout.tsx` content:

```tsx
import type { Metadata } from "next";
import { Space_Grotesk, Inter_Tight, JetBrains_Mono, Fraunces } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Cho Mọi Người — Hiểu AI qua hình ảnh và ví dụ đơn giản",
  description:
    "Khám phá 185+ chủ đề AI/ML qua hình minh họa tương tác và ví dụ thực tế bằng tiếng Việt. Từ Neural Network đến RAG, từ Transformer đến AI Agent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${spaceGrotesk.variable} ${interTight.variable} ${jetbrainsMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
          >
            Bỏ qua đến nội dung chính
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Key changes:
- Fonts: Geist → Space Grotesk (display), Inter Tight (sans), JetBrains Mono (mono), Fraunces (serif)
- Vietnamese subset added to all text fonts
- CSS variable names: `--font-display`, `--font-sans`, `--font-mono`, `--font-serif`
- Theme script: defaults to light (only adds dark class if `localStorage === 'dark'`, no `prefers-color-scheme` fallback)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: Clean (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: swap fonts to Space Grotesk / Inter Tight / JetBrains Mono / Fraunces + light default"
```

---

### Task 3: Update design tokens in globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css**

Replace the entire file with:

```css
@import "tailwindcss";

/* ─────────────────────────────────────────────── */
/* Light theme (default) — Perplexity paper tones  */
/* ─────────────────────────────────────────────── */
:root {
  --bg-primary: #FBF7F2;
  --bg-card: #FFFFFF;
  --bg-dark: #0A0A0B;
  --bg-surface: #F4EEE3;
  --bg-surface-hover: #E8DEC9;
  --bg-sunken: #F4EEE3;
  --text-primary: #0A0A0B;
  --text-secondary: #2A2A2F;
  --text-tertiary: #6C6C74;
  --text-muted: #9B9BA3;
  --accent: #0F8A83;
  --accent-light: rgba(15, 138, 131, 0.10);
  --accent-dark: #0E6F69;
  --border: rgba(10, 10, 11, 0.10);
  --border-subtle: rgba(10, 10, 11, 0.06);
  --border-strong: rgba(10, 10, 11, 0.18);
  --analogy-bg: rgba(15, 138, 131, 0.06);
  --ring: rgba(15, 138, 131, 0.35);
  --hero-gradient-from: #0F8A83;
  --hero-gradient-to: #20B8AE;
  --heat-400: #FF7A29;
  --heat-500: #F05A00;
  --sub-accent-soft: rgba(255, 122, 41, 0.14);
  --shadow-sm: 0 1px 2px rgba(10, 10, 11, 0.06), 0 0 0 1px rgba(10, 10, 11, 0.04);
  --shadow-md: 0 4px 14px rgba(10, 10, 11, 0.08), 0 0 0 1px rgba(10, 10, 11, 0.04);
  --shadow-lg: 0 20px 40px rgba(10, 10, 11, 0.12), 0 0 0 1px rgba(10, 10, 11, 0.05);
  --shadow-glow-accent: 0 0 0 1px rgba(15, 138, 131, 0.35), 0 8px 30px rgba(15, 138, 131, 0.18);
  --shadow-glow-heat: 0 0 0 1px rgba(255, 122, 41, 0.35), 0 8px 30px rgba(255, 122, 41, 0.2);
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-xl: 20px;
  --r-pill: 999px;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 120ms;
  --dur-base: 200ms;
  --dur-slow: 420ms;
  --success: #3DD68C;
  --warning: #F5B547;
  --danger: #F25C54;
  color-scheme: light;
}

/* ─────────────────────────────────────────────── */
/* Dark theme — Perplexity ink palette              */
/* ─────────────────────────────────────────────── */
.dark {
  --bg-primary: #0A0A0B;
  --bg-card: #121214;
  --bg-dark: #060607;
  --bg-surface: #18181B;
  --bg-surface-hover: #1F1F23;
  --bg-sunken: #060607;
  --text-primary: #F5F5F7;
  --text-secondary: #C4C4CC;
  --text-tertiary: #9B9BA3;
  --text-muted: #6C6C74;
  --accent: #20B8AE;
  --accent-light: rgba(19, 168, 158, 0.12);
  --accent-dark: #13A89E;
  --border: rgba(255, 255, 255, 0.10);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-strong: rgba(255, 255, 255, 0.18);
  --analogy-bg: rgba(32, 184, 174, 0.06);
  --ring: rgba(32, 184, 174, 0.35);
  --hero-gradient-from: #20B8AE;
  --hero-gradient-to: #5FD2CB;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04);
  --shadow-lg: 0 24px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05);
  --shadow-glow-accent: 0 0 0 1px rgba(32, 184, 174, 0.35), 0 8px 30px rgba(32, 184, 174, 0.18);
  --shadow-glow-heat: 0 0 0 1px rgba(255, 122, 41, 0.35), 0 8px 30px rgba(255, 122, 41, 0.2);
  color-scheme: dark;
}

@theme inline {
  --color-background: var(--bg-primary);
  --color-foreground: var(--text-primary);
  --color-accent: var(--accent);
  --color-accent-light: var(--accent-light);
  --color-accent-dark: var(--accent-dark);
  --color-card: var(--bg-card);
  --color-dark: var(--bg-dark);
  --color-muted: var(--text-secondary);
  --color-tertiary: var(--text-tertiary);
  --color-border: var(--border);
  --color-analogy: var(--analogy-bg);
  --color-surface: var(--bg-surface);
  --color-surface-hover: var(--bg-surface-hover);
  --color-ring: var(--ring);
  --color-heat: var(--heat-400);
  --color-heat-soft: var(--sub-accent-soft);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-display: var(--font-display);
  --font-serif: var(--font-serif);
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Vietnamese diacritics — generous line-height for readability */
p, li, span, label {
  line-height: 1.65;
}

.content-width {
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
}

/* ─────────────────────────────────────────────── */
/* Lesson section spacing                          */
/* ─────────────────────────────────────────────── */
.lesson-section + .lesson-section {
  padding-top: 0.5rem;
}

/* Hero gradient text */
.gradient-text {
  background: linear-gradient(135deg, var(--hero-gradient-from), var(--hero-gradient-to));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ─────────────────────────────────────────────── */
/* Cards — Perplexity soft shadow style            */
/* ─────────────────────────────────────────────── */
.card {
  background: var(--bg-card);
  border-radius: var(--r-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--dur-base) var(--ease-standard),
              transform var(--dur-base) var(--ease-standard),
              border-color var(--dur-base) var(--ease-standard);
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* ─────────────────────────────────────────────── */
/* Difficulty tags                                 */
/* ─────────────────────────────────────────────── */
.tag-beginner { background: #059669; color: #FFFFFF; }
.tag-intermediate { background: #D97706; color: #FFFFFF; }
.tag-advanced { background: #DC2626; color: #FFFFFF; }

/* ─────────────────────────────────────────────── */
/* Analogy card                                    */
/* ─────────────────────────────────────────────── */
.analogy-card {
  background: var(--analogy-bg);
  border-left: 3px solid var(--accent);
  padding: 1rem 1.25rem;
  border-radius: var(--r-sm);
}

/* Topic card read indicator */
.topic-card-read {
  border-left: 3px solid var(--accent);
}

/* Smooth scrolling */
html[data-scroll-behavior="smooth"] {
  scroll-behavior: smooth;
}

/* Section dividers */
.section-divider {
  border-top: 1px solid var(--border);
}

/* ─────────────────────────────────────────────── */
/* Reading progress bar                            */
/* ─────────────────────────────────────────────── */
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  z-index: 100;
  transition: width 50ms linear;
}

/* Command palette backdrop */
.cmd-backdrop {
  background: rgba(10, 10, 11, 0.3);
  backdrop-filter: blur(12px) saturate(140%);
}
.dark .cmd-backdrop {
  background: rgba(0, 0, 0, 0.5);
}

/* ─────────────────────────────────────────────── */
/* Scrollbar                                       */
/* ─────────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg-surface-hover); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

/* Bottom nav spacing */
@media (max-width: 768px) {
  .has-bottom-nav { padding-bottom: 4.5rem; }
}

/* ─────────────────────────────────────────────── */
/* Quiz                                            */
/* ─────────────────────────────────────────────── */
.quiz-option { transition: all var(--dur-base) var(--ease-standard); }
.quiz-option:hover:not(.quiz-selected):not(.quiz-disabled) {
  border-color: var(--accent);
  background: var(--accent-light);
}
.quiz-correct { border-color: var(--success) !important; background: rgba(61, 214, 140, 0.08) !important; }
.quiz-wrong { border-color: var(--danger) !important; background: rgba(242, 92, 84, 0.08) !important; }

/* Code block */
.code-block {
  font-family: var(--font-mono), 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
}

/* KaTeX overrides */
.katex-display { margin: 1rem 0 !important; overflow-x: auto; overflow-y: hidden; padding: 0.5rem 0; }
.katex { font-size: 1.05em !important; }
.katex-display > .katex { font-size: 1.15em !important; }

/* Skeleton loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-surface-hover) 50%, var(--bg-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--r-sm);
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: Clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: replace design tokens with Perplexity palette, shadows, radii, motion"
```

---

### Task 4: Update Navbar

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Update Navbar with glassy style and display font**

Replace the entire file:

```tsx
"use client";

import Link from "next/link";
import { Brain, Bookmark, BarChart3, Search } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthButton from "@/components/auth/AuthButton";

function triggerCmdK() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-[rgba(251,247,242,0.7)] backdrop-blur-[16px] backdrop-saturate-[140%] dark:bg-[rgba(10,10,11,0.7)]">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-8 h-14">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground"
        >
          <Brain className="h-5 w-5 text-accent" />
          <span className="hidden sm:inline font-display text-[17px] font-medium tracking-[-0.02em]">
            AI Cho Mọi Người
          </span>
          <span className="sm:hidden font-display text-[17px] font-medium tracking-[-0.02em]">
            ACMN
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={triggerCmdK}
            className="hidden sm:flex items-center gap-2 rounded-[var(--r-md)] border border-border bg-surface px-3 py-1.5 text-xs text-tertiary transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Search size={14} />
            <span>Tìm kiếm...</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-tertiary">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/progress"
            className="rounded-[var(--r-md)] p-2 text-tertiary transition-colors hover:text-foreground hover:bg-surface"
            aria-label="Tiến độ"
          >
            <BarChart3 size={18} />
          </Link>

          <Link
            href="/bookmarks"
            className="rounded-[var(--r-md)] p-2 text-tertiary transition-colors hover:text-foreground hover:bg-surface"
            aria-label="Đã lưu"
          >
            <Bookmark size={18} />
          </Link>

          <AuthButton />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Update ThemeToggle styling**

In `src/components/ui/ThemeToggle.tsx`, replace the className:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Chuyển sang sáng" : "Chuyển sang tối"}
      className="rounded-[var(--r-md)] p-2 text-tertiary transition-colors hover:text-foreground hover:bg-surface"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Navbar.tsx src/components/ui/ThemeToggle.tsx
git commit -m "feat: navbar with glassy backdrop and display typography"
```

---

### Task 5: Update Hero and homepage

**Files:**
- Modify: `src/components/home/HeroSearch.tsx`

- [ ] **Step 1: Update Hero with editorial typography**

Replace the entire file:

```tsx
"use client";

import { Search } from "lucide-react";
import DifficultyFilter from "./DifficultyFilter";
import type { TopicMeta, Difficulty } from "@/lib/types";

interface HeroSearchProps {
  topics: TopicMeta[];
  selectedDifficulty: Difficulty | "all";
  onDifficultyChange: (value: Difficulty | "all") => void;
  counts: Record<string, number>;
}

function triggerCmdK() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

export default function HeroSearch({
  selectedDifficulty,
  onDifficultyChange,
  counts,
}: HeroSearchProps) {
  return (
    <section className="relative py-20 sm:py-28 px-4 text-center overflow-hidden">
      <div className="relative">
        <h1 className="font-display text-foreground font-normal leading-[0.98] tracking-[-0.04em] text-[clamp(48px,7vw,96px)]">
          Hiểu AI qua{" "}
          <em className="font-serif italic font-normal tracking-[-0.02em]">
            hình ảnh trực quan
          </em>
        </h1>

        <p className="mt-7 text-[18px] text-muted max-w-[600px] mx-auto leading-[1.55]">
          Khám phá AI/ML qua minh họa tương tác và ví dụ thực tế bằng tiếng Việt.
          Không cần nền tảng kỹ thuật.
        </p>

        <div className="mt-10 max-w-[480px] mx-auto">
          <button
            type="button"
            onClick={triggerCmdK}
            className="w-full flex items-center gap-3 rounded-[var(--r-pill)] border border-border bg-card pl-6 pr-4 py-3.5 text-[15px] text-tertiary shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-glow-accent)] focus-within:shadow-[var(--shadow-glow-accent)]"
          >
            <Search size={16} className="text-tertiary shrink-0" />
            <span className="flex-1 text-left">Tìm kiếm chủ đề...</span>
            <kbd className="hidden sm:inline-flex items-center rounded-[var(--r-sm)] border border-border bg-surface px-2 py-0.5 text-[10px] font-mono text-tertiary tracking-[0.04em]">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="mt-5">
          <DifficultyFilter
            selected={selectedDifficulty}
            onChange={onDifficultyChange}
            counts={counts}
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/HeroSearch.tsx
git commit -m "feat: hero with editorial Space Grotesk + Fraunces italic treatment"
```

---

### Task 6: Update Footer

**Files:**
- Modify: `src/components/layout/Footer.tsx`

- [ ] **Step 1: Redesign footer with Perplexity ink style**

Replace the entire file:

```tsx
import Link from "next/link";
import { Brain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-dark border-t border-[rgba(255,255,255,0.06)] mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Brain className="h-4 w-4 text-accent" />
            <span className="font-display text-[17px] font-medium tracking-[-0.02em] text-[#F5F5F7]">
              AI Cho Mọi Người
            </span>
          </div>

          <div className="flex items-center gap-6">
            {[
              { href: "/", label: "Trang chủ" },
              { href: "/bookmarks", label: "Đã lưu" },
              { href: "/progress", label: "Tiến độ" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[13px] text-[#9B9BA3] transition-colors hover:text-[#C4C4CC]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center">
          <p className="font-serif italic text-[15px] text-[#6C6C74]">
            Hiểu AI qua hình ảnh và ví dụ đơn giản
          </p>
          <p className="mt-2 font-mono text-[11px] tracking-[0.04em] text-[#6C6C74]">
            © 2026 Tien Dat Do
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat: footer with Perplexity ink-950 bg and editorial serif tagline"
```

---

### Task 7: Update TopicCard with application heat accent

**Files:**
- Modify: `src/components/home/TopicCard.tsx`

- [ ] **Step 1: Add heat glow for application topics**

Replace the entire file:

```tsx
"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";
import type { TopicMeta } from "@/lib/types";

const difficultyLabel: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};

interface TopicCardProps {
  topic: TopicMeta;
  isRead?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (slug: string) => void;
}

export default function TopicCard({
  topic,
  isRead = false,
  isBookmarked = false,
  onToggleBookmark,
}: TopicCardProps) {
  const BookmarkIcon = isBookmarked ? BookmarkCheck : Bookmark;
  const isApplication = !!topic.applicationOf;

  return (
    <div className={`relative rounded-[var(--r-lg)] border bg-card/50 shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-card hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 ${
      isApplication
        ? "border-[rgba(255,122,41,0.2)] hover:shadow-[var(--shadow-glow-heat)]"
        : "border-border"
    } ${isRead ? "topic-card-read" : ""}`}>
      {onToggleBookmark && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleBookmark(topic.slug);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-[var(--r-sm)] text-tertiary hover:text-accent transition-colors z-10"
          aria-label={isBookmarked ? "Bỏ lưu" : "Lưu lại"}
        >
          <BookmarkIcon className="h-4 w-4" />
        </button>
      )}

      <Link href={`/topics/${topic.slug}`} className="block p-5">
        <div className="pr-6">
          <h3 className="font-display text-sm font-medium text-foreground leading-snug tracking-[-0.01em]">
            {topic.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted leading-relaxed">
            {topic.titleVi}
          </p>
          <p className="mt-2 text-[11px] text-tertiary leading-relaxed line-clamp-2">
            {topic.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center rounded-[var(--r-pill)] px-2.5 py-0.5 text-[11px] font-semibold ${
              topic.difficulty === "beginner" ? "tag-beginner" :
              topic.difficulty === "intermediate" ? "tag-intermediate" :
              "tag-advanced"
            }`}>
              {difficultyLabel[topic.difficulty]}
            </span>
            {isApplication && (
              <span className="inline-flex items-center rounded-[var(--r-pill)] bg-heat-soft px-2.5 py-0.5 text-[11px] font-medium text-heat">
                Ứng dụng
              </span>
            )}
            {topic.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-[var(--r-pill)] bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/TopicCard.tsx
git commit -m "feat: topic cards with Perplexity shadows and heat-glow for application topics"
```

---

### Task 8: Update TopicLayout display typography

**Files:**
- Modify: `src/components/topic/TopicLayout.tsx`

- [ ] **Step 1: Update heading typography and content width**

In `src/components/topic/TopicLayout.tsx`, make these targeted changes:

1. Change `className="content-width px-5 py-10"` to `className="content-width px-5 sm:px-8 py-10"` on the `<motion.article>`.

2. Change the `<h1>` class from:
```
text-3xl font-bold tracking-tight text-foreground
```
to:
```
font-display text-[40px] font-medium tracking-[-0.035em] leading-[1.05] text-foreground
```

3. Change the `<p>` subtitle class from:
```
text-lg text-muted
```
to:
```
text-lg text-muted tracking-[-0.01em]
```

4. Change all `rounded-[16px]` to `rounded-[var(--r-lg)]` throughout the file.

5. Change the "Mark as read" button border-radius from `rounded-full` to `rounded-[var(--r-pill)]`.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: Clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/topic/TopicLayout.tsx
git commit -m "feat: topic layout with display typography and Perplexity radii tokens"
```

---

### Task 9: Update ProfessionPaths card styling

**Files:**
- Modify: `src/components/home/ProfessionPaths.tsx`

- [ ] **Step 1: Update card and text styling**

In the `ProfessionPaths.tsx` component (already edited in Task 1 to remove kids entries), update the card styling:

1. Change the `<Link>` wrapper class from:
```
rounded-[16px] border border-border bg-card/50 backdrop-blur-sm
```
to:
```
rounded-[var(--r-lg)] border border-border bg-card/50 shadow-[var(--shadow-sm)]
```

2. Change the icon wrapper from:
```
rounded-xl bg-surface
```
to:
```
rounded-[var(--r-md)] bg-surface
```

3. Change the `<h3>` from:
```
text-[13px] font-semibold
```
to:
```
font-display text-[13px] font-medium tracking-[-0.01em]
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/ProfessionPaths.tsx
git commit -m "feat: profession path cards with Perplexity tokens"
```

---

### Task 10: Final verification and cleanup

**Files:**
- Various (read-only checks)

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (some kids tests were deleted, remaining tests should pass).

- [ ] **Step 3: Start dev server and verify visually**

Run: `npm run dev`
Check in browser:
- Homepage renders with Space Grotesk headings, Inter Tight body text, Fraunces italic in hero
- Vietnamese diacritics render correctly with all fonts
- Light mode is default (no dark class on load)
- Dark mode toggle works
- Navbar has glassy backdrop blur
- Hero composer has pill shape with accent glow on focus
- Topic cards have proper shadows, application cards show orange glow
- Footer has ink-950 dark background
- All existing topic pages render correctly
- No kids routes remain (404 on /kids/*)

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "fix: final cleanup after design system migration"
```
