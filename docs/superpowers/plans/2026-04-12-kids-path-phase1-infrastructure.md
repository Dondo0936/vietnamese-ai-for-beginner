# Kids Path — Phase 1: Infrastructure &amp; Schema — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the infrastructure &amp; schema foundation for the Kids (Nhí + Teen) learning paths — three Supabase tables with RLS, a separate kid topic registry, a `KidsPathPage` component, a `KidsModeProvider` context, six stub routes under `/kids/`, two new cards on the home page, and a dual-registry-aware `TopicLink`. No content lessons, no parent auth, no cron. Phase 2–6 follow from this foundation.

**Architecture:** Additive only — no existing adult routes or topics modified. Kids section lives under `src/app/kids/`, its topics under `src/topics/kids/`, its primitives under `src/components/interactive/kids/` (Phase 3 populates). Chrome (navbar + color tokens) stays shared via `AppShell`. Schema is 3 additive Supabase tables (`kid_profiles`, `kid_artifacts`, `retention_checks`) + one RPC (`record_artifact`) with `SECURITY DEFINER`. All referenced from the spec at `docs/superpowers/specs/2026-04-12-kids-learning-path-design.md`.

**Tech Stack:** Next.js 16.2.3 App Router (note: `proxy.ts` replaces `middleware.ts` in Next 16; AGENTS.md reminds you to check `node_modules/next/dist/docs/` for breaking changes), TypeScript 5.9, Tailwind CSS v4, Supabase (`@supabase/ssr` 0.10.2 + `supabase-js` 2.103.0), Vitest 4.1 + `@testing-library/react` 16.3, `lucide-react` for icons.

---

## Working environment

You are executing this plan inside a git worktree:

```
/Users/thanhnha231206/idea/ai-edu-v2/.worktrees/kids-path
```

Branch: `feature/kids-path` (already created). All commits land on this branch. Do not push.

**Before any file edit:** ensure you're in the worktree, not the main repo:

```bash
cd /Users/thanhnha231206/idea/ai-edu-v2/.worktrees/kids-path
git branch --show-current   # must print: feature/kids-path
```

---

## Recommended pre-read (5 min)

Before Task 1, skim these to match the house style:

- `docs/superpowers/specs/2026-04-12-kids-learning-path-design.md` — the full design spec (sections §4, §8, §10, §11, §14 Phase 1 are directly load-bearing).
- `src/components/paths/LearningPathPage.tsx` — the adult path-page component `KidsPathPage` will parallel.
- `src/components/home/ProfessionPaths.tsx` — where the 2 new kid cards land.
- `src/components/interactive/TopicLink.tsx` — the existing dual-registry-target.
- `src/lib/progress-context.tsx` — the context shape `KidsModeProvider` parallels.
- `supabase/rls-policies.sql` — the existing migration convention (single file, no timestamp prefixes; apply via Supabase dashboard SQL editor).
- `src/__tests__/home-content.test.tsx` — the Vitest + RTL mocking pattern.

Next.js 16 breaking changes: the project's `AGENTS.md` tells you to check `node_modules/next/dist/docs/01-app/` when touching routing, layouts, or `proxy.ts`/`middleware.ts`. Do this when you hit Tasks 8–13.

---

## File structure produced by this plan

```
supabase/
  kids-schema.sql                                 # NEW (Task 1) — 3 tables + RPC + RLS, applied via dashboard

src/
  lib/
    kids/
      types.ts                                    # NEW (Task 2) — KidsTopicMeta, KidProfile, Artifact, RetentionCheck
      mode-context.tsx                            # NEW (Task 4) — KidsModeProvider + useKidsMode
  topics/
    kids/
      kids-registry.ts                            # NEW (Task 3) — kidsTopicMap, kidsTopicList
  components/
    interactive/
      TopicLink.tsx                               # MODIFY (Task 5) — dual-registry awareness
    paths/
      KidsPathPage.tsx                            # NEW (Task 6) — variant of LearningPathPage
    home/
      ProfessionPaths.tsx                         # MODIFY (Task 13) — add Nhí + Teen cards
  app/
    kids/
      layout.tsx                                  # NEW (Task 7)
      page.tsx                                    # NEW (Task 8) — "Ba mẹ hay bé?" landing
      nhi/page.tsx                                # NEW (Task 9) — empty stages
      teen/page.tsx                               # NEW (Task 10) — empty stages
      topics/[slug]/page.tsx                      # NEW (Task 11) — slug-to-kidsTopicMap resolver
      parent/page.tsx                             # NEW (Task 12) — Phase 2 coming-soon stub
  __tests__/
    kids-mode-context.test.tsx                    # NEW (Task 4)
    topic-link-dual-registry.test.tsx             # NEW (Task 5)
    kids-path-page.test.tsx                       # NEW (Task 6)
    kids-landing.test.tsx                         # NEW (Task 8)
    profession-paths-kids.test.tsx                # NEW (Task 13)
```

---

## Task 1: Supabase schema — 3 tables + RPC + RLS

**Files:**
- Create: `supabase/kids-schema.sql`

Match the existing convention at `supabase/rls-policies.sql`: one SQL file, no timestamp prefix, applied manually via the Supabase dashboard SQL editor. Design spec §8 (tables) and §8.1 (RPC) are source of truth.

- [ ] **Step 1: Create `supabase/kids-schema.sql`**

```sql
-- ============================================================
-- Kids Learning Path — schema additions
-- Spec: docs/superpowers/specs/2026-04-12-kids-learning-path-design.md §8
-- Apply in the Supabase dashboard SQL editor.
-- ============================================================

-- 1. kid_profiles: parent-owned kid profile rows
CREATE TABLE IF NOT EXISTS public.kid_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  birth_year int NOT NULL CHECK (birth_year BETWEEN 2010 AND 2020),
  tier text NOT NULL CHECK (tier IN ('nhi', 'teen')),
  pin_hash text,
  consent_given_at timestamptz,
  consent_version text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. kid_artifacts: the parent-dashboard trust asset
CREATE TABLE IF NOT EXISTS public.kid_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id uuid NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  topic_slug text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('classifier','story','sketch','quiz-completion','drawing','other')),
  payload jsonb,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

-- 3. retention_checks: the Strategy B 3-day spaced-retrieval mechanism
CREATE TABLE IF NOT EXISTS public.retention_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id uuid NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  topic_slug text NOT NULL,
  concept_key text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  asked_at timestamptz,
  remembered boolean,
  question_payload jsonb
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.kid_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_checks ENABLE ROW LEVEL SECURITY;

-- Parents manage their own kid_profiles rows
CREATE POLICY "parent reads own kids" ON public.kid_profiles
  FOR SELECT USING (auth.uid() = parent_user_id);
CREATE POLICY "parent inserts own kids" ON public.kid_profiles
  FOR INSERT WITH CHECK (auth.uid() = parent_user_id);
CREATE POLICY "parent updates own kids" ON public.kid_profiles
  FOR UPDATE USING (auth.uid() = parent_user_id);
CREATE POLICY "parent deletes own kids" ON public.kid_profiles
  FOR DELETE USING (auth.uid() = parent_user_id);

-- Parents read artifacts/retention-checks for THEIR OWN kids only
CREATE POLICY "parent reads own kid artifacts" ON public.kid_artifacts
  FOR SELECT USING (
    kid_profile_id IN (
      SELECT id FROM public.kid_profiles WHERE parent_user_id = auth.uid()
    )
  );
CREATE POLICY "parent reads own kid retention" ON public.retention_checks
  FOR SELECT USING (
    kid_profile_id IN (
      SELECT id FROM public.kid_profiles WHERE parent_user_id = auth.uid()
    )
  );

-- Kid-device writes go through RPCs, not direct inserts. No INSERT/UPDATE policies for
-- kid_artifacts or retention_checks — RPCs run SECURITY DEFINER (see below) and bypass RLS.

-- ============================================================
-- RPC: record_artifact — kid devices (no auth.uid()) call this via a
-- signed handoff token; function runs SECURITY DEFINER so it can insert
-- bypassing RLS. Phase 2 mints the handoff token when the parent sets
-- the kid's PIN on the device.
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_artifact(
  p_kid_profile_id uuid,
  p_handoff_token text,
  p_topic_slug text,
  p_kind text,
  p_payload jsonb,
  p_thumbnail_url text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- TODO (Phase 2): verify p_handoff_token against a short-lived
  -- server-minted JWT before allowing the insert. For now, Phase 1
  -- stubs the function so the schema is in place; the token check is
  -- added in Phase 2 when kid-device auth ships.
  INSERT INTO public.kid_artifacts (
    kid_profile_id, topic_slug, kind, payload, thumbnail_url
  ) VALUES (
    p_kid_profile_id, p_topic_slug, p_kind, p_payload, p_thumbnail_url
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Lock the function from anonymous callers until Phase 2 hardens the
-- token check. Only the service_role can call it in Phase 1.
REVOKE EXECUTE ON FUNCTION public.record_artifact FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_artifact TO service_role;
```

- [ ] **Step 2: Apply to Supabase dev project via dashboard SQL editor**

Open the Supabase dashboard → SQL Editor → paste the contents of `supabase/kids-schema.sql` → Run. Expect: "Success. No rows returned."

- [ ] **Step 3: Verify tables exist**

Run in the SQL editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('kid_profiles','kid_artifacts','retention_checks');
```

Expected output: 3 rows — `kid_profiles`, `kid_artifacts`, `retention_checks`.

Run:

```sql
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'record_artifact';
```

Expected: 1 row with `prosecdef = true` (SECURITY DEFINER is on).

- [ ] **Step 4: Commit**

```bash
git add supabase/kids-schema.sql
git commit -m "feat(kids): add Supabase schema — kid_profiles, artifacts, retention_checks + RPC

Adds the three additive tables and the record_artifact SECURITY DEFINER
RPC per spec §8. RLS enables parent-scoped read on all three tables;
kid-device writes go through record_artifact which Phase 2 will harden
with a handoff-token check. Function is REVOKE'd from anon/authenticated
in Phase 1 so it can only be called via service_role until the token
mechanism lands."
```

---

## Task 2: TypeScript types for kid data

**Files:**
- Create: `src/lib/kids/types.ts`

- [ ] **Step 1: Create `src/lib/kids/types.ts`**

```typescript
import type { TopicMeta } from "@/lib/types";

/**
 * Kids-path types — mirrors and extends the adult TopicMeta with
 * kid-specific fields. See spec §4, §7, §8.
 */

export type KidTier = "nhi" | "teen";

/**
 * Extends TopicMeta with a required tier and optional kid-flavored fields.
 * Falls back to TopicMeta shape so existing helpers (search, difficulty
 * labels, etc.) continue to work over kid topics.
 */
export interface KidsTopicMeta extends TopicMeta {
  tier: KidTier;
  /** Target lesson duration in minutes — Nhí ~6, Teen ~12 (spec §5) */
  durationMinutes: number;
  /** Mascot mood used in the lesson's intro — stub emoji in v1 */
  mascotMood?: "happy" | "curious" | "oops" | "celebrate";
}

/**
 * A kid profile owned by a parent (auth.users row). Matches the
 * kid_profiles table in supabase/kids-schema.sql.
 */
export interface KidProfile {
  id: string;
  parentUserId: string;
  displayName: string;
  birthYear: number;
  tier: KidTier;
  consentGivenAt: string | null;
  consentVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * An artifact a kid produced during a lesson — the trust asset on the
 * parent dashboard. Matches kid_artifacts rows.
 */
export interface KidArtifact {
  id: string;
  kidProfileId: string;
  topicSlug: string;
  kind: "classifier" | "story" | "sketch" | "quiz-completion" | "drawing" | "other";
  payload: Record<string, unknown> | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

/**
 * A scheduled or completed 3-day spaced-retrieval check. Matches
 * retention_checks rows.
 */
export interface RetentionCheck {
  id: string;
  kidProfileId: string;
  topicSlug: string;
  conceptKey: string;
  scheduledFor: string;
  askedAt: string | null;
  remembered: boolean | null;
  questionPayload: Record<string, unknown> | null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: no new errors. (Any errors must come from code outside this task.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/kids/types.ts
git commit -m "feat(kids): add TypeScript types for kid profile, artifact, retention

Extends TopicMeta with a KidsTopicMeta that adds tier + durationMinutes
+ optional mascot mood. Defines KidProfile/KidArtifact/RetentionCheck
matching the kid_profiles/kid_artifacts/retention_checks Supabase
tables from Task 1."
```

---

## Task 3: Create kid topic registry scaffold

**Files:**
- Create: `src/topics/kids/kids-registry.ts`

Empty registry for Phase 1 — content arrives in Phase 5. The registry shape must be stable now so `TopicLink` (Task 5) and `KidsPathPage` (Task 6) can depend on it.

- [ ] **Step 1: Create `src/topics/kids/kids-registry.ts`**

```typescript
import type { KidsTopicMeta } from "@/lib/kids/types";

/**
 * Kid topic registry — separate from the adult topicMap. See spec §11.1.
 *
 * Phase 1 ships empty. Phase 5 adds all 48 kid topics. Phase 3 adds
 * the two exemplar lessons (one Nhí + one Teen).
 *
 * Kept as a dedicated module so imports from /kids/* routes never
 * accidentally pull in adult topic code, and vice versa.
 */

export const kidsTopicList: KidsTopicMeta[] = [];

export const kidsTopicMap: Record<string, KidsTopicMeta> = Object.fromEntries(
  kidsTopicList.map((t) => [t.slug, t])
);

/** Topics filtered by tier — used by /kids/nhi and /kids/teen pages. */
export const nhiTopics: KidsTopicMeta[] = kidsTopicList.filter((t) => t.tier === "nhi");
export const teenTopics: KidsTopicMeta[] = kidsTopicList.filter((t) => t.tier === "teen");
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/topics/kids/kids-registry.ts
git commit -m "feat(kids): scaffold empty kid topic registry

Creates kidsTopicMap/kidsTopicList + per-tier slices (nhiTopics,
teenTopics). Empty in Phase 1 — Phase 3 and Phase 5 populate. Kept
separate from the adult topicMap per spec §11.1."
```

---

## Task 4: KidsModeProvider context (TDD)

**Files:**
- Create: `src/lib/kids/mode-context.tsx`
- Test: `src/__tests__/kids-mode-context.test.tsx`

A React context that exposes the current kid profile (null until Phase 2's auth), the current tier, and audio-narration preferences. Phase 1 scaffold — all values have sensible defaults so routes can consume the context without wiring up auth.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/kids-mode-context.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KidsModeProvider, useKidsMode } from "@/lib/kids/mode-context";

function Probe() {
  const { tier, audioNarration, setAudioNarration } = useKidsMode();
  return (
    <div>
      <span data-testid="tier">{tier ?? "none"}</span>
      <span data-testid="audio">{audioNarration ? "on" : "off"}</span>
      <button onClick={() => setAudioNarration(!audioNarration)}>toggle</button>
    </div>
  );
}

describe("KidsModeProvider", () => {
  it("defaults to no tier and audio narration off when tier is null", () => {
    render(
      <KidsModeProvider>
        <Probe />
      </KidsModeProvider>
    );
    expect(screen.getByTestId("tier")).toHaveTextContent("none");
    expect(screen.getByTestId("audio")).toHaveTextContent("off");
  });

  it("defaults audio narration to 'on' when tier is nhi", () => {
    render(
      <KidsModeProvider initialTier="nhi">
        <Probe />
      </KidsModeProvider>
    );
    expect(screen.getByTestId("tier")).toHaveTextContent("nhi");
    expect(screen.getByTestId("audio")).toHaveTextContent("on");
  });

  it("defaults audio narration to 'off' when tier is teen", () => {
    render(
      <KidsModeProvider initialTier="teen">
        <Probe />
      </KidsModeProvider>
    );
    expect(screen.getByTestId("tier")).toHaveTextContent("teen");
    expect(screen.getByTestId("audio")).toHaveTextContent("off");
  });

  it("lets consumers toggle audio narration", async () => {
    const user = userEvent.setup();
    render(
      <KidsModeProvider initialTier="teen">
        <Probe />
      </KidsModeProvider>
    );
    expect(screen.getByTestId("audio")).toHaveTextContent("off");
    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("audio")).toHaveTextContent("on");
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

Run: `pnpm test --run src/__tests__/kids-mode-context.test.tsx`
Expected: import error — `Cannot find module '@/lib/kids/mode-context'`.

- [ ] **Step 3: Implement `KidsModeProvider`**

Create `src/lib/kids/mode-context.tsx`:

```typescript
"use client";

import { createContext, useContext, useState } from "react";
import type { KidProfile, KidTier } from "./types";

interface KidsModeState {
  /** Currently-active kid profile, or null if no one is logged in as a kid. */
  profile: KidProfile | null;
  /** Current tier — derived from profile, or set explicitly for route-level defaults. */
  tier: KidTier | null;
  /** Audio narration on? Default: on for Nhí, off for Teen. User-toggleable. */
  audioNarration: boolean;
  setAudioNarration: (next: boolean) => void;
}

const defaultState: KidsModeState = {
  profile: null,
  tier: null,
  audioNarration: false,
  setAudioNarration: () => {},
};

const KidsModeContext = createContext<KidsModeState>(defaultState);

interface KidsModeProviderProps {
  children: React.ReactNode;
  /** Override tier at the route level (e.g. /kids/nhi sets "nhi"). */
  initialTier?: KidTier | null;
  /** Phase 2 will populate this once parent auth is wired. */
  profile?: KidProfile | null;
}

export function KidsModeProvider({
  children,
  initialTier = null,
  profile = null,
}: KidsModeProviderProps) {
  const [audioNarration, setAudioNarration] = useState<boolean>(
    initialTier === "nhi"
  );

  const value: KidsModeState = {
    profile,
    tier: initialTier,
    audioNarration,
    setAudioNarration,
  };

  return <KidsModeContext.Provider value={value}>{children}</KidsModeContext.Provider>;
}

export function useKidsMode(): KidsModeState {
  return useContext(KidsModeContext);
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `pnpm test --run src/__tests__/kids-mode-context.test.tsx`
Expected: `Test Files  1 passed (1)` · `Tests  4 passed (4)`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/kids/mode-context.tsx src/__tests__/kids-mode-context.test.tsx
git commit -m "feat(kids): add KidsModeProvider + useKidsMode hook

Exposes current tier, kid profile (null until Phase 2 auth), and an
audioNarration preference that defaults on for Nhí and off for Teen.
Consumers can toggle audio via setAudioNarration. Spec §10.2."
```

---

## Task 5: TopicLink dual-registry awareness (TDD)

**Files:**
- Modify: `src/components/interactive/TopicLink.tsx`
- Test: `src/__tests__/topic-link-dual-registry.test.tsx`

Existing `TopicLink` looks up the slug only in the adult `topicMap`. Extend it so that when rendered inside a `/kids/*` route, it looks up in `kidsTopicMap` and links to `/kids/topics/<slug>` instead of `/topics/<slug>`. Backwards-compatible: adult usages unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/topic-link-dual-registry.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/link — render as plain anchor so we can assert the href
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock usePathname from next/navigation
const pathnameMock = vi.fn(() => "/topics/linear-regression");
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

// Mock both registries with one known slug each
vi.mock("@/topics/registry", () => ({
  topicMap: {
    "linear-regression": { slug: "linear-regression", title: "Linear Regression", titleVi: "Hồi quy tuyến tính" },
  },
}));
vi.mock("@/topics/kids/kids-registry", () => ({
  kidsTopicMap: {
    "may-nhin-pixel": { slug: "may-nhin-pixel", title: "How machines see pixels", titleVi: "Máy nhìn pixel", tier: "nhi" },
  },
}));

import TopicLink from "@/components/interactive/TopicLink";

describe("TopicLink dual-registry awareness", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
  });

  it("links to /topics/:slug on adult routes and validates against topicMap", () => {
    pathnameMock.mockReturnValue("/topics/linear-regression");
    render(<TopicLink slug="linear-regression">Hồi quy tuyến tính</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy tuyến tính" });
    expect(link).toHaveAttribute("href", "/topics/linear-regression");
  });

  it("links to /kids/topics/:slug when rendered inside /kids/*", () => {
    pathnameMock.mockReturnValue("/kids/topics/may-nhin-pixel");
    render(<TopicLink slug="may-nhin-pixel">Máy nhìn pixel</TopicLink>);
    const link = screen.getByRole("link", { name: "Máy nhìn pixel" });
    expect(link).toHaveAttribute("href", "/kids/topics/may-nhin-pixel");
  });

  it("still links correctly from /kids/nhi (non-topic kid route)", () => {
    pathnameMock.mockReturnValue("/kids/nhi");
    render(<TopicLink slug="may-nhin-pixel">Máy nhìn pixel</TopicLink>);
    const link = screen.getByRole("link", { name: "Máy nhìn pixel" });
    expect(link).toHaveAttribute("href", "/kids/topics/may-nhin-pixel");
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

Run: `pnpm test --run src/__tests__/topic-link-dual-registry.test.tsx`
Expected: two of the three tests fail — the `href` values are still `/topics/...` because the component doesn't branch on route yet.

- [ ] **Step 3: Modify `src/components/interactive/TopicLink.tsx`**

Replace file contents with:

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { topicMap } from "@/topics/registry";
import { kidsTopicMap } from "@/topics/kids/kids-registry";

interface TopicLinkProps {
  slug: string;
  children: React.ReactNode;
}

/**
 * Links to a topic page. Automatically routes to /kids/topics/:slug when
 * rendered under /kids/*, and validates against the kid registry in that
 * case. Adult routes are unchanged (back-compat).
 *
 * See spec §11.1.
 */
export default function TopicLink({ slug, children }: TopicLinkProps) {
  const pathname = usePathname() ?? "";
  const isKidRoute = pathname.startsWith("/kids");

  if (process.env.NODE_ENV === "development") {
    const registry = isKidRoute ? kidsTopicMap : topicMap;
    if (!registry[slug]) {
      console.warn(
        `[TopicLink] slug "${slug}" not found in ${isKidRoute ? "kidsTopicMap" : "topicMap"} (path: ${pathname})`
      );
    }
  }

  const href = isKidRoute ? `/kids/topics/${slug}` : `/topics/${slug}`;

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

- [ ] **Step 4: Run the test — expect PASS**

Run: `pnpm test --run src/__tests__/topic-link-dual-registry.test.tsx`
Expected: `Tests  3 passed (3)`.

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `pnpm test --run`
Expected: all tests pass (existing 15 + 4 new from Task 4 + 3 new from Task 5 = 22 total).

- [ ] **Step 6: Commit**

```bash
git add src/components/interactive/TopicLink.tsx src/__tests__/topic-link-dual-registry.test.tsx
git commit -m "feat(kids): TopicLink routes to /kids/topics/:slug on /kids/* routes

Uses usePathname to detect kid-route rendering and validates against
kidsTopicMap in that case, otherwise falls back to the adult topicMap
and /topics/:slug URL. Dev-mode warning now reports which registry
was consulted. Backwards-compatible — adult usages unchanged."
```

---

## Task 6: KidsPathPage component (TDD)

**Files:**
- Create: `src/components/paths/KidsPathPage.tsx`
- Test: `src/__tests__/kids-path-page.test.tsx`

Parallel to `LearningPathPage` but tuned for kid chrome: mascot slot in the header, larger touch targets on topic cards, per-tier color accent (yellow for Nhí, purple for Teen). Phase 1 ships the component with stub emoji mascot; Phase 6 swaps in real art. Renders empty-state messaging gracefully when `stages` is empty (which it will be all through Phase 1).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/kids-path-page.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sparkles } from "lucide-react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("@/components/layout/AppShell", () => ({
  default: ({ children }: any) => <div data-testid="app-shell">{children}</div>,
}));
vi.mock("@/lib/progress-context", () => ({
  useProgress: () => ({ readTopics: [], loading: false }),
}));
vi.mock("@/topics/kids/kids-registry", () => ({
  kidsTopicMap: {
    "may-nhin-pixel": {
      slug: "may-nhin-pixel",
      title: "How machines see pixels",
      titleVi: "Máy nhìn pixel thế nào?",
      difficulty: "beginner" as const,
      tier: "nhi" as const,
      durationMinutes: 6,
    },
  },
}));

import KidsPathPage from "@/components/paths/KidsPathPage";

describe("KidsPathPage", () => {
  it("renders the tier name, mascot stub, and description", () => {
    render(
      <KidsPathPage
        tier="nhi"
        nameVi="Lộ trình Nhí"
        descriptionVi="Bé làm quen AI — 18 bài, có audio"
        mascotEmoji="🐙"
        icon={Sparkles}
        stages={[]}
      />
    );
    expect(screen.getByText("Lộ trình Nhí")).toBeInTheDocument();
    expect(screen.getByText("Bé làm quen AI — 18 bài, có audio")).toBeInTheDocument();
    expect(screen.getByText("🐙")).toBeInTheDocument();
  });

  it("renders an empty-state message when stages is empty", () => {
    render(
      <KidsPathPage
        tier="nhi"
        nameVi="Lộ trình Nhí"
        descriptionVi=""
        mascotEmoji="🐙"
        icon={Sparkles}
        stages={[]}
      />
    );
    expect(screen.getByText(/đang được chuẩn bị/i)).toBeInTheDocument();
  });

  it("renders stage topics when stages contain known kid slugs", () => {
    render(
      <KidsPathPage
        tier="nhi"
        nameVi="Lộ trình Nhí"
        descriptionVi=""
        mascotEmoji="🐙"
        icon={Sparkles}
        stages={[{ title: "Chặng 1", slugs: ["may-nhin-pixel"] }]}
      />
    );
    expect(screen.getByText("Chặng 1")).toBeInTheDocument();
    expect(screen.getByText("Máy nhìn pixel thế nào?")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

Run: `pnpm test --run src/__tests__/kids-path-page.test.tsx`
Expected: import error — `Cannot find module '@/components/paths/KidsPathPage'`.

- [ ] **Step 3: Implement `KidsPathPage`**

Create `src/components/paths/KidsPathPage.tsx`:

```typescript
"use client";

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useProgress } from "@/lib/progress-context";
import { kidsTopicMap } from "@/topics/kids/kids-registry";
import type { KidsTopicMeta, KidTier } from "@/lib/kids/types";
import type { Stage } from "@/components/paths/LearningPathPage";

interface KidsPathPageProps {
  tier: KidTier;
  nameVi: string;
  descriptionVi: string;
  /** Emoji placeholder in v1; replaced with real art in Phase 6. */
  mascotEmoji: string;
  icon: React.ElementType;
  stages: Stage[];
}

/**
 * Kid-tier learning path page. Variant of LearningPathPage with:
 *   - mascot emoji slot in the header
 *   - tier-specific accent color (yellow for Nhí, purple for Teen)
 *   - larger touch targets on topic cards
 *   - graceful empty state for Phase 1 (when kidsTopicMap is empty)
 *
 * Spec §10.2 + §13.
 */
export default function KidsPathPage({
  tier,
  nameVi,
  descriptionVi,
  mascotEmoji,
  icon: Icon,
  stages,
}: KidsPathPageProps) {
  const { readTopics, loading } = useProgress();

  const allSlugs = stages.flatMap((s) => s.slugs);
  const totalTopics = allSlugs.length;
  const readCount = allSlugs.filter((s) => readTopics.includes(s)).length;

  const tierAccent =
    tier === "nhi"
      ? {
          border: "border-amber-300 dark:border-amber-500/40",
          bg: "bg-amber-50/70 dark:bg-amber-500/5",
          text: "text-amber-700 dark:text-amber-400",
        }
      : {
          border: "border-violet-300 dark:border-violet-500/40",
          bg: "bg-violet-50/70 dark:bg-violet-500/5",
          text: "text-violet-700 dark:text-violet-400",
        };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Đang tải...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Trang chủ
        </Link>

        {/* Header with mascot + tier accent */}
        <div className={`rounded-[20px] border-2 ${tierAccent.border} ${tierAccent.bg} p-6 mb-8`}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 text-5xl leading-none" aria-hidden="true">
              {mascotEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${tierAccent.text} mb-1`}>
                <Icon size={14} />
                <span>{tier === "nhi" ? "Lộ trình Nhí · 6–10 tuổi" : "Lộ trình Teen · 11–15 tuổi"}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">{nameVi}</h1>
              {descriptionVi && <p className="text-sm text-muted mt-2">{descriptionVi}</p>}
            </div>
          </div>

          {totalTopics > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted">
                  {readCount}/{totalTopics} bài đã xong
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    tier === "nhi" ? "bg-amber-400" : "bg-violet-400"
                  }`}
                  style={{
                    width: `${Math.round((readCount / totalTopics) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Empty state (Phase 1 ships here) */}
        {stages.length === 0 && (
          <div className="rounded-[16px] border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted">
              Các bài học đang được chuẩn bị.{" "}
              <span className="inline-block animate-pulse">📚</span>
            </p>
            <p className="text-xs text-tertiary mt-2">
              Quay lại sớm nhé!
            </p>
          </div>
        )}

        {/* Stages */}
        {stages.map((stage, stageIdx) => {
          const stageTopics = stage.slugs
            .map((s) => kidsTopicMap[s])
            .filter((t): t is KidsTopicMeta => t !== undefined);
          const isLast = stageIdx === stages.length - 1;

          return (
            <div key={stage.title} className="relative pb-8">
              {!isLast && (
                <div
                  className="absolute left-[19px] top-[44px] bottom-0 w-px bg-border"
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${tierAccent.bg} ${tierAccent.text} border ${tierAccent.border}`}
                >
                  {stageIdx + 1}
                </div>
                <h2 className="text-sm font-semibold text-foreground">{stage.title}</h2>
              </div>
              <div className="ml-[19px] pl-8">
                <div className="flex flex-wrap gap-2">
                  {stageTopics.map((topic) => {
                    const isRead = readTopics.includes(topic.slug);
                    return (
                      <Link
                        key={topic.slug}
                        href={`/kids/topics/${topic.slug}`}
                        className={`group relative flex items-center gap-2 rounded-[14px] border px-4 py-3 text-left transition-all min-h-[44px] ${
                          isRead
                            ? `${tierAccent.border} ${tierAccent.bg}`
                            : "border-border bg-card/50 hover:bg-card"
                        }`}
                      >
                        {isRead && <Check size={14} className={tierAccent.text} />}
                        <span className="text-[13px] font-medium text-foreground leading-snug">
                          {topic.titleVi}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `pnpm test --run src/__tests__/kids-path-page.test.tsx`
Expected: `Tests  3 passed (3)`.

- [ ] **Step 5: Commit**

```bash
git add src/components/paths/KidsPathPage.tsx src/__tests__/kids-path-page.test.tsx
git commit -m "feat(kids): KidsPathPage component stub

Variant of LearningPathPage with mascot emoji slot, tier-specific
accent (amber for Nhí, violet for Teen), 44px min touch targets on
topic cards, and a graceful empty state for Phase 1 pre-content.
Reuses the Stage type from LearningPathPage. Spec §10.2 + §13."
```

---

## Task 7: `/kids/layout.tsx`

**Files:**
- Create: `src/app/kids/layout.tsx`

Wraps all `/kids/*` routes in the shared `KidsModeProvider` context. No auth guard in Phase 1 (parent subtree remains a public stub here; Phase 2 adds `proxy.ts` + server-side redirect).

Check `node_modules/next/dist/docs/01-app/` if anything about App Router layouts is unclear — AGENTS.md requires this because Next.js 16 has breaking changes from training data.

- [ ] **Step 1: Create `src/app/kids/layout.tsx`**

```typescript
import { KidsModeProvider } from "@/lib/kids/mode-context";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Kids — AI Cho Mọi Người",
    template: "%s · AI Cho Mọi Người (Kids)",
  },
  description: "Lộ trình AI dành cho bé 6–15 tuổi — tiếng Việt, tương tác, có audio.",
};

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  // tier is set per-sub-route (/kids/nhi sets "nhi", etc.) via nested
  // KidsModeProvider. This top-level provider just ensures useKidsMode()
  // never throws on /kids/* routes.
  return <KidsModeProvider>{children}</KidsModeProvider>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/kids/layout.tsx
git commit -m "feat(kids): /kids route group layout with KidsModeProvider

Sets kid-specific metadata (title template + description) and wraps
descendants in the KidsModeProvider so useKidsMode() is always safe
to call under /kids/*. No auth guard here — Phase 2 adds proxy.ts
for /kids/parent/*."
```

---

## Task 8: `/kids/page.tsx` — landing "Ba mẹ hay bé?" (TDD)

**Files:**
- Create: `src/app/kids/page.tsx`
- Test: `src/__tests__/kids-landing.test.tsx`

Simple choice landing page — two large tap targets: "Bé đang dùng" (goes to `/kids`-tier picker, linked to `/kids/nhi` by default for Phase 1) and "Ba mẹ đang dùng" (goes to `/kids/parent`).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/kids-landing.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("@/components/layout/AppShell", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

import KidsLandingPage from "@/app/kids/page";

describe("/kids landing page", () => {
  it("renders the Vietnamese choice prompt", () => {
    render(<KidsLandingPage />);
    expect(screen.getByText(/ba mẹ hay bé/i)).toBeInTheDocument();
  });

  it("has a 'Bé đang dùng' link to /kids/nhi", () => {
    render(<KidsLandingPage />);
    const kid = screen.getByRole("link", { name: /bé đang dùng/i });
    expect(kid).toHaveAttribute("href", "/kids/nhi");
  });

  it("has a 'Ba mẹ đang dùng' link to /kids/parent", () => {
    render(<KidsLandingPage />);
    const parent = screen.getByRole("link", { name: /ba mẹ đang dùng/i });
    expect(parent).toHaveAttribute("href", "/kids/parent");
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

Run: `pnpm test --run src/__tests__/kids-landing.test.tsx`
Expected: import error — `Cannot find module '@/app/kids/page'`.

- [ ] **Step 3: Implement `/kids/page.tsx`**

Create `src/app/kids/page.tsx`:

```typescript
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

export default function KidsLandingPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-7xl mb-4" aria-hidden="true">🐙</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Xin chào! Mình là Mực.
        </h1>
        <p className="text-muted mb-10">Ba mẹ hay bé đang dùng đây nhỉ?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/kids/nhi"
            className="group rounded-[20px] border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-500/5 p-6 text-center hover:border-amber-400 transition-colors"
          >
            <div className="text-4xl mb-2" aria-hidden="true">🧒</div>
            <div className="text-lg font-semibold text-foreground">Bé đang dùng</div>
            <div className="text-xs text-muted mt-1">6–15 tuổi</div>
          </Link>

          <Link
            href="/kids/parent"
            className="group rounded-[20px] border-2 border-violet-300 dark:border-violet-500/40 bg-violet-50/70 dark:bg-violet-500/5 p-6 text-center hover:border-violet-400 transition-colors"
          >
            <div className="text-4xl mb-2" aria-hidden="true">👨‍👩‍👧</div>
            <div className="text-lg font-semibold text-foreground">Ba mẹ đang dùng</div>
            <div className="text-xs text-muted mt-1">Bảng theo dõi của con</div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `pnpm test --run src/__tests__/kids-landing.test.tsx`
Expected: `Tests  3 passed (3)`.

- [ ] **Step 5: Commit**

```bash
git add src/app/kids/page.tsx src/__tests__/kids-landing.test.tsx
git commit -m "feat(kids): /kids landing with 'Ba mẹ hay bé?' choice

Two large tap-target cards — amber for 'Bé đang dùng' (→ /kids/nhi)
and violet for 'Ba mẹ đang dùng' (→ /kids/parent). Mực octopus emoji
sits in the hero. Keeps the choice short and visual, matching the
Nhí-friendly design principle."
```

---

## Task 9: `/kids/nhi/page.tsx`

**Files:**
- Create: `src/app/kids/nhi/page.tsx`

Wires up `KidsPathPage` with `tier="nhi"` and empty stages (content lands in Phase 5).

- [ ] **Step 1: Create `src/app/kids/nhi/page.tsx`**

```typescript
"use client";

import { Sparkles } from "lucide-react";
import KidsPathPage from "@/components/paths/KidsPathPage";
import { KidsModeProvider } from "@/lib/kids/mode-context";
import type { Stage } from "@/components/paths/LearningPathPage";

/**
 * Nhí learning path (6–10 tuổi). Spec §4.
 * Phase 1 ships with empty stages — Phase 5 populates with the 18 Nhí topics.
 */

const stages: Stage[] = [
  // Populated in Phase 5 with Chặng 1–5 from Appendix A.
];

export default function NhiPathPage() {
  return (
    <KidsModeProvider initialTier="nhi">
      <KidsPathPage
        tier="nhi"
        nameVi="Bé làm quen với AI"
        descriptionVi="18 bài vui vẻ — hình ảnh, kéo thả, có audio. Không cần biết đọc nhiều."
        mascotEmoji="🐙"
        icon={Sparkles}
        stages={stages}
      />
    </KidsModeProvider>
  );
}
```

- [ ] **Step 2: Run the Vitest suite to confirm no regressions**

Run: `pnpm test --run`
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/kids/nhi/page.tsx
git commit -m "feat(kids): /kids/nhi Nhí path page stub

Renders KidsPathPage with tier='nhi' and empty stages — Phase 5 will
populate with the 18 Nhí topics across 5 chặng. Spec §4."
```

---

## Task 10: `/kids/teen/page.tsx`

**Files:**
- Create: `src/app/kids/teen/page.tsx`

- [ ] **Step 1: Create `src/app/kids/teen/page.tsx`**

```typescript
"use client";

import { Rocket } from "lucide-react";
import KidsPathPage from "@/components/paths/KidsPathPage";
import { KidsModeProvider } from "@/lib/kids/mode-context";
import type { Stage } from "@/components/paths/LearningPathPage";

/**
 * Teen learning path (11–15 tuổi). Spec §4.
 * Phase 1 ships with empty stages — Phase 5 populates with 28 Teen topics
 * plus the 2-lesson capstone that bridges into /paths/student.
 */

const stages: Stage[] = [
  // Populated in Phase 5.
];

export default function TeenPathPage() {
  return (
    <KidsModeProvider initialTier="teen">
      <KidsPathPage
        tier="teen"
        nameVi="Teen tự làm dự án AI"
        descriptionVi="30 bài — train mô hình nhỏ, hiểu AI tạo sinh, và sẵn sàng cho lộ trình Học sinh · Sinh viên."
        mascotEmoji="🐙"
        icon={Rocket}
        stages={stages}
      />
    </KidsModeProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/kids/teen/page.tsx
git commit -m "feat(kids): /kids/teen Teen path page stub

Renders KidsPathPage with tier='teen' and empty stages. Phase 5 adds
28 Teen topics + the 2-lesson capstone that bridges to the existing
student path via pathObjectives.nextPath. Spec §4."
```

---

## Task 11: `/kids/topics/[slug]/page.tsx`

**Files:**
- Create: `src/app/kids/topics/[slug]/page.tsx`

Slug-resolving page — renders the kid topic if found in `kidsTopicMap`, otherwise calls `notFound()`. Phase 1 has zero kid topics in the registry, so every URL here returns 404 until Phase 3 adds the first exemplars. That's correct behavior.

In Next.js 16, `params` is a Promise and must be awaited. Verify against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.mdx` if unsure.

- [ ] **Step 1: Create `src/app/kids/topics/[slug]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { KidsModeProvider } from "@/lib/kids/mode-context";
import { kidsTopicMap } from "@/topics/kids/kids-registry";

/**
 * Kid topic page. Resolves slug from kidsTopicMap; 404s for unknown slugs.
 * Phase 1 ships with an empty registry — all slugs 404 until Phase 3
 * adds the first exemplars. Phase 3 also wires in the dynamic-import
 * renderer for the topic file's default export (mirrors the adult
 * /topics/[slug] pattern).
 *
 * Spec §10.1, §11.1.
 */

export default async function KidTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = kidsTopicMap[slug];

  if (!topic) {
    notFound();
  }

  return (
    <KidsModeProvider initialTier={topic.tier}>
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
          <h1 className="text-xl font-bold text-foreground mb-4">{topic.titleVi}</h1>
          <p className="text-sm text-muted">
            (Phase 3 sẽ nạp nội dung bài học ở đây.)
          </p>
        </div>
      </AppShell>
    </KidsModeProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/kids/topics/[slug]/page.tsx
git commit -m "feat(kids): /kids/topics/[slug] resolver

Awaits params (Next.js 16), looks up slug in kidsTopicMap, and 404s
on miss. Phase 1 registry is empty so every URL 404s — that's the
correct behavior until Phase 3 adds exemplars and the dynamic-import
renderer pattern. Spec §10.1."
```

---

## Task 12: `/kids/parent/page.tsx` — coming-soon stub

**Files:**
- Create: `src/app/kids/parent/page.tsx`

Phase 2 will replace this with the real dashboard + auth guard. For Phase 1, just a labeled placeholder so the route returns 200 and the home-page card's link works.

- [ ] **Step 1: Create `src/app/kids/parent/page.tsx`**

```typescript
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Parent dashboard stub — Phase 2 will:
 *   - move to a server component behind a proxy.ts cookie check +
 *     Supabase session verification in the layout.tsx
 *   - render ParentDashboard (artifacts gallery, retention score, etc.)
 * Spec §7, §9, §10.3.
 */
export default function ParentDashboardStubPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Link
          href="/kids"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Quay lại
        </Link>
        <div className="text-6xl mb-4" aria-hidden="true">📊</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bảng theo dõi của ba mẹ
        </h1>
        <p className="text-sm text-muted">
          Phần này đang được chuẩn bị. Phiên bản chính thức sẽ có: đăng nhập bằng email,
          theo dõi tiến độ con, xem tác phẩm con làm, và kiểm tra khả năng nhớ sau 3 ngày.
        </p>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/kids/parent/page.tsx
git commit -m "feat(kids): /kids/parent Phase 1 coming-soon stub

Placeholder page describing what the Phase 2 dashboard will include
(email login, progress tracking, artifact gallery, 3-day retention
checks). Keeps the route live so home-page links resolve without
forcing Phase 2 auth work into Phase 1."
```

---

## Task 13: Home page — add Nhí + Teen cards to `ProfessionPaths` (TDD)

**Files:**
- Modify: `src/components/home/ProfessionPaths.tsx`
- Test: `src/__tests__/profession-paths-kids.test.tsx`

Extend `Profession` to allow an optional `href` override (so Nhí/Teen link to `/kids/nhi` and `/kids/teen` rather than the default `/paths/:id`), then append two new entries for kids.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/profession-paths-kids.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import ProfessionPaths from "@/components/home/ProfessionPaths";

describe("ProfessionPaths — kid cards", () => {
  it("renders a Nhí card linking to /kids/nhi", () => {
    render(<ProfessionPaths topics={[]} />);
    const nhi = screen.getByRole("link", { name: /nhí|bé làm quen/i });
    expect(nhi).toHaveAttribute("href", "/kids/nhi");
  });

  it("renders a Teen card linking to /kids/teen", () => {
    render(<ProfessionPaths topics={[]} />);
    const teen = screen.getByRole("link", { name: /teen|tự làm dự án/i });
    expect(teen).toHaveAttribute("href", "/kids/teen");
  });

  it("still renders the four existing adult profession cards", () => {
    render(<ProfessionPaths topics={[]} />);
    expect(screen.getByRole("link", { name: /học sinh · sinh viên/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nhân viên văn phòng/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ai engineer/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ai researcher/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

Run: `pnpm test --run src/__tests__/profession-paths-kids.test.tsx`
Expected: the first two tests fail — no Nhí or Teen links yet. The "four existing adult" test should already pass.

- [ ] **Step 3: Modify `src/components/home/ProfessionPaths.tsx`**

Two edits: (a) add an optional `href` field to `Profession`, (b) append two new profession entries.

**3a.** Find the `Profession` interface (top of file) and change it to:

```typescript
export interface Profession {
  id: string;
  nameVi: string;
  descriptionVi: string;
  icon: React.ElementType;
  topicSlugs: string[];
  /** Override for the link target. Defaults to /paths/:id if not set. */
  href?: string;
}
```

**3b.** Add `Sparkles` and `Rocket` to the `lucide-react` import at the top:

```typescript
import {
  GraduationCap,
  Briefcase,
  Code2,
  FlaskConical,
  Sparkles,
  Rocket,
  ArrowRight,
} from "lucide-react";
```

**3c.** At the very end of the `professions: Profession[]` array (after the existing `ai-researcher` entry and before the closing `];`), insert two new entries:

```typescript
  {
    id: "kids-nhi",
    nameVi: "Bé làm quen với AI (6–10 tuổi)",
    descriptionVi: "18 bài vui vẻ — hình ảnh, kéo thả, có audio. Không cần biết đọc nhiều.",
    icon: Sparkles,
    topicSlugs: [], // Phase 5 populates; for Phase 1 the card shows 0 chủ đề.
    href: "/kids/nhi",
  },
  {
    id: "kids-teen",
    nameVi: "Teen tự làm dự án AI (11–15 tuổi)",
    descriptionVi: "30 bài — train mô hình nhỏ, hiểu AI tạo sinh, sẵn sàng cho lộ trình Học sinh.",
    icon: Rocket,
    topicSlugs: [], // Phase 5 populates.
    href: "/kids/teen",
  },
```

**3d.** Inside the component, find this line:

```typescript
            href={`/paths/${prof.id}`}
```

and change it to:

```typescript
            href={prof.href ?? `/paths/${prof.id}`}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `pnpm test --run src/__tests__/profession-paths-kids.test.tsx`
Expected: `Tests  3 passed (3)`.

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `pnpm test --run`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/ProfessionPaths.tsx src/__tests__/profession-paths-kids.test.tsx
git commit -m "feat(kids): add Nhí + Teen cards to home page ProfessionPaths

Two new entries (kids-nhi, kids-teen) point to /kids/nhi and /kids/teen
via a new optional 'href' override on the Profession interface —
backwards-compatible with the four existing adult cards that still
use the default /paths/:id pattern. topicSlugs is empty in Phase 1;
Phase 5 populates. Spec §12."
```

---

## Task 14: End-to-end smoke test — dev server + 6 routes

**Files:** none (manual verification step)

- [ ] **Step 1: Start the dev server in the worktree**

```bash
pnpm dev
```

Expected: Next.js boots and prints `✓ Ready in <N>ms` with a local URL (typically `http://localhost:3000`).

- [ ] **Step 2: Open each route in a browser and confirm 200**

In a browser, verify:

| URL | Expected behavior |
|---|---|
| `http://localhost:3000/` | Home page loads; 6 profession cards render (4 adult + Nhí + Teen). |
| `http://localhost:3000/kids` | "Xin chào! Mình là Mực." landing with two choice cards. |
| `http://localhost:3000/kids/nhi` | Amber-accent Nhí path page with mascot, title, and empty-state message "Các bài học đang được chuẩn bị." |
| `http://localhost:3000/kids/teen` | Violet-accent Teen path page with mascot, title, and empty-state message. |
| `http://localhost:3000/kids/topics/does-not-exist` | Next.js 404 page (expected — registry is empty in Phase 1). |
| `http://localhost:3000/kids/parent` | Coming-soon stub with "Bảng theo dõi của ba mẹ" heading. |

Also verify the Nhí and Teen cards on the home page link to `/kids/nhi` and `/kids/teen` respectively.

- [ ] **Step 3: Stop the dev server**

`Ctrl+C` in the terminal running `pnpm dev`.

- [ ] **Step 4: Run full test suite one more time**

```bash
pnpm test --run
```

Expected: all tests pass (original 15 + 4 KidsModeProvider + 3 TopicLink + 3 KidsPathPage + 3 landing + 3 ProfessionPaths = 31 total, or thereabouts).

- [ ] **Step 5: Run type-check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run lint**

```bash
pnpm lint
```

Expected: no errors introduced by Phase 1 files. If pre-existing warnings/errors surface unrelated to our changes, ignore them.

- [ ] **Step 7: Commit (if any small fixes needed from smoke test)**

If any lint/typecheck issues showed up during steps 4–6, fix and commit:

```bash
git add -A && git commit -m "chore(kids): post-smoke-test cleanups"
```

Otherwise, skip this step.

- [ ] **Step 8: Final branch status check**

```bash
git log --oneline main..HEAD
```

Expected: 13 commits (one per Task 1–13). Each should have a clear `feat(kids):` or `chore(kids):` prefix.

---

## Phase 1 exit criteria

Before declaring Phase 1 done and moving to Phase 2:

- [ ] All 14 tasks completed with commits
- [ ] `pnpm test --run` passes with no failures
- [ ] `pnpm tsc --noEmit` passes with no errors
- [ ] `pnpm lint` shows no new errors
- [ ] All 6 `/kids/*` routes render in the dev server
- [ ] Home page shows the Nhí and Teen cards in the profession grid
- [ ] Supabase dashboard shows the 3 new tables and the `record_artifact` RPC with `prosecdef = true`

Once all boxes are checked, Phase 1 is shippable. Move to Phase 2 (parent auth + dashboard skeleton).

---

## Notes for the implementer

1. **Breaking-change vigilance for Next.js 16.** AGENTS.md tells you to read `node_modules/next/dist/docs/` before touching routing. Specifically relevant to this plan:
   - `01-app/03-api-reference/03-file-conventions/page.mdx` for `params`-as-Promise (Task 11).
   - `01-app/03-api-reference/03-file-conventions/layout.mdx` for layout composition (Task 7).
   - `01-app/02-guides/authentication.mdx` for the `proxy.ts` pattern you'll need in Phase 2 (not Phase 1).

2. **Supabase dev vs prod.** Task 1's SQL applies to whichever Supabase project your `.env.local` points at. Apply to a dev project first; production migration runs separately when the feature is ready.

3. **Handoff-token stub in `record_artifact`.** The RPC's `p_handoff_token` arg is accepted and ignored in Phase 1 — Phase 2 adds the JWT-verification logic. The `REVOKE EXECUTE ... FROM anon, authenticated` at the bottom of the SQL file means nothing except the `service_role` can call it in Phase 1, which is the point.

4. **No tests for SQL or route pages without interactivity.** Task 1 and Tasks 7/9/10/11/12 have no Vitest coverage by design — SQL is verified via schema introspection; route pages that are essentially plain JSX are verified by the smoke test in Task 14. Tasks 4/5/6/8/13 do have tests because they have logic worth asserting.

5. **If a test unexpectedly fails after an unrelated step.** The most likely cause is the dual-registry change in Task 5 — double-check that the `pathname` mock is set correctly in any test that renders components using `TopicLink`. Existing component tests (e.g., topic-layout.test.tsx) may need a small `vi.mock("next/navigation", ...)` if they exercise `TopicLink`.

6. **Commits are intentionally small.** Each task is one commit. This plan produces ~14 commits on `feature/kids-path`. Do not squash before review — granular history is useful for reviewing + for rolling back a specific task if needed.
