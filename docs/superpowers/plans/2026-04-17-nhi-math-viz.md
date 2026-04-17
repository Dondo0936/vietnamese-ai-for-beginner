# Nhí Math Visualizations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 6 interactive math visualization topics for the Nhí tier (ages 6–10), connected by an ocean story world with pearl-collection progression.

**Architecture:** Each topic is a self-contained SVG+React visualization component rendered inside a minimal KidsTopicLayout. Topics are registered in the kids registry and rendered via dynamic import in /kids/topics/[slug]. An OceanMap replaces the empty Nhí landing page with clickable island locations.

**Tech Stack:** Next.js 16.2.3 (App Router), React 19, TypeScript 5.9, pure SVG (no Canvas/WebGL/D3), Tailwind v4, browser SpeechSynthesis for audio narration.

**Spec:** `docs/superpowers/specs/2026-04-17-nhi-math-visualizations-design.md`

**Worktree:** `.worktrees/nhi-math-viz` (branch `feature/nhi-math-viz`)

---

## File Map

### New files

```
src/components/kids/nhi/MascotBubble.tsx       — Speech bubble with octopus emoji + optional TTS
src/components/kids/nhi/PearlReveal.tsx         — Celebration overlay with pearl glow + confetti
src/components/kids/nhi/KidsTopicLayout.tsx     — Minimal topic wrapper (back link, pearl progress)
src/components/kids/nhi/OceanMap.tsx            — SVG ocean map with 6 clickable islands
src/components/kids/nhi/CoralFactory.tsx        — Topic 1: Functions visualization
src/components/kids/nhi/CreatureGarden.tsx      — Topic 2: Classification visualization
src/components/kids/nhi/TreasureMap.tsx         — Topic 3: Vectors visualization
src/components/kids/nhi/MagicMarbleBag.tsx      — Topic 4: Probability visualization
src/components/kids/nhi/ShadowTheater.tsx       — Topic 5: Dimensionality visualization
src/components/kids/nhi/OceanRace.tsx           — Topic 6: Rates of change visualization
src/topics/kids/nhi-coral-factory.tsx           — Topic 1 metadata + renders CoralFactory
src/topics/kids/nhi-creature-garden.tsx         — Topic 2 metadata + renders CreatureGarden
src/topics/kids/nhi-treasure-map.tsx            — Topic 3 metadata + renders TreasureMap
src/topics/kids/nhi-magic-marble-bag.tsx        — Topic 4 metadata + renders MagicMarbleBag
src/topics/kids/nhi-shadow-theater.tsx          — Topic 5 metadata + renders ShadowTheater
src/topics/kids/nhi-ocean-race.tsx              — Topic 6 metadata + renders OceanRace
src/__tests__/kids-nhi-infrastructure.test.tsx  — Tests for shared components + registry
```

### Modified files

```
src/topics/kids/kids-registry.ts               — Populate with 6 Nhí topic entries
src/app/kids/nhi/page.tsx                       — Replace empty stages with OceanMap
src/app/kids/topics/[slug]/page.tsx             — Add dynamic import for topic content
```

---

## Task 1: Shared Kid Components + Infrastructure

**Files:**
- Create: `src/components/kids/nhi/MascotBubble.tsx`
- Create: `src/components/kids/nhi/PearlReveal.tsx`
- Create: `src/components/kids/nhi/KidsTopicLayout.tsx`
- Create: `src/__tests__/kids-nhi-infrastructure.test.tsx`
- Modify: `src/topics/kids/kids-registry.ts`
- Modify: `src/app/kids/topics/[slug]/page.tsx`

This task creates the shared components all 6 topics depend on, populates the registry with 6 entries, and wires up the dynamic topic import.

- [ ] **Step 1: Create MascotBubble component**

```tsx
// src/components/kids/nhi/MascotBubble.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useKidsMode } from "@/lib/kids/mode-context";

interface MascotBubbleProps {
  text: string;
  mood?: "happy" | "curious" | "oops" | "celebrate";
  autoSpeak?: boolean;
}

const MOOD_EMOJI: Record<string, string> = {
  happy: "🐙",
  curious: "🤔",
  oops: "😅",
  celebrate: "🎉",
};

export default function MascotBubble({
  text,
  mood = "happy",
  autoSpeak = true,
}: MascotBubbleProps) {
  const { audioNarration } = useKidsMode();
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(() => {
    if (!audioNarration || typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 0.85;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [text, audioNarration]);

  useEffect(() => {
    if (autoSpeak && audioNarration) {
      const timer = setTimeout(speak, 400);
      return () => {
        clearTimeout(timer);
        window.speechSynthesis?.cancel();
      };
    }
  }, [autoSpeak, audioNarration, speak]);

  return (
    <div className="flex items-end gap-2">
      <button
        type="button"
        onClick={speak}
        aria-label="Nghe lại"
        className={`text-3xl transition-transform ${speaking ? "animate-bounce" : "hover:scale-110"}`}
      >
        {MOOD_EMOJI[mood] ?? "🐙"}
      </button>
      <div className="relative rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-4 py-2 text-sm text-foreground max-w-xs">
        <div className="absolute -left-2 bottom-2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-amber-200 dark:border-r-amber-500/30 border-b-[6px] border-b-transparent" />
        {text}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create PearlReveal component**

```tsx
// src/components/kids/nhi/PearlReveal.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { markTopicRead } from "@/lib/database";

interface PearlRevealProps {
  topicSlug: string;
  onClose: () => void;
}

const CONFETTI_COLORS = ["#fbbf24", "#f59e0b", "#d97706", "#92400e", "#fde68a"];

function randomConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotation: Math.random() * 360,
  }));
}

export default function PearlReveal({ topicSlug, onClose }: PearlRevealProps) {
  const [visible, setVisible] = useState(false);
  const [confetti] = useState(() => randomConfetti(24));

  useEffect(() => {
    markTopicRead(topicSlug);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [topicSlug]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="Bạn đã tìm được viên ngọc!"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Confetti */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 100">
          {confetti.map((c) => (
            <rect
              key={c.id}
              x={c.x}
              y={-10}
              width="2"
              height="3"
              fill={c.color}
              rx="0.5"
              transform={`rotate(${c.rotation} ${c.x} -10)`}
              className="animate-confetti-fall"
              style={{ animationDelay: `${c.delay}s` }}
            />
          ))}
        </svg>

        {/* Pearl */}
        <div className="text-6xl animate-pearl-glow">🔮</div>

        <p className="text-xl font-bold text-white drop-shadow-lg">
          Tìm được viên ngọc rồi!
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="mt-2 rounded-full bg-amber-400 px-6 py-2 text-sm font-bold text-amber-900 hover:bg-amber-300 transition-colors"
        >
          Tiếp tục phiêu lưu →
        </button>
      </div>
    </div>
  );
}
```

Add these keyframe animations to `src/app/globals.css` (append at end):

```css
@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110px) rotate(720deg); opacity: 0; }
}
.animate-confetti-fall {
  animation: confetti-fall 2s ease-out forwards;
}
@keyframes pearl-glow {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.15); filter: brightness(1.3); }
}
.animate-pearl-glow {
  animation: pearl-glow 1.5s ease-in-out infinite;
}
```

- [ ] **Step 3: Create KidsTopicLayout component**

```tsx
// src/components/kids/nhi/KidsTopicLayout.tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { KidsTopicMeta } from "@/lib/kids/types";
import { useProgress } from "@/lib/progress-context";
import MascotBubble from "./MascotBubble";

const NHI_TOPIC_SLUGS = [
  "nhi-coral-factory",
  "nhi-creature-garden",
  "nhi-treasure-map",
  "nhi-magic-marble-bag",
  "nhi-shadow-theater",
  "nhi-ocean-race",
];

interface KidsTopicLayoutProps {
  meta: KidsTopicMeta;
  introText: string;
  children: React.ReactNode;
}

export default function KidsTopicLayout({
  meta,
  introText,
  children,
}: KidsTopicLayoutProps) {
  const { readTopics } = useProgress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/kids/nhi"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại bản đồ
        </Link>

        {/* Pearl progress */}
        <div className="flex items-center gap-1.5" aria-label={`Đã tìm được ${NHI_TOPIC_SLUGS.filter((s) => readTopics.includes(s)).length} trên 6 viên ngọc`}>
          {NHI_TOPIC_SLUGS.map((slug) => (
            <span
              key={slug}
              className={`inline-block w-5 h-5 rounded-full border-2 transition-colors ${
                readTopics.includes(slug)
                  ? "bg-amber-400 border-amber-500"
                  : "bg-transparent border-border"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Mascot intro */}
      <div className="px-4 mb-4">
        <MascotBubble
          text={introText}
          mood={meta.mascotMood ?? "curious"}
        />
      </div>

      {/* Visualization content */}
      <div className="px-2">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Populate kids-registry.ts with 6 Nhí entries**

Replace the contents of `src/topics/kids/kids-registry.ts`:

```ts
import type { KidsTopicMeta } from "@/lib/kids/types";

export const kidsTopicList: KidsTopicMeta[] = [
  {
    slug: "nhi-coral-factory",
    title: "Coral Factory",
    titleVi: "Nhà máy san hô",
    description: "Khám phá quy tắc biến đổi — nền tảng của hàm số",
    category: "kids-math",
    tags: ["functions", "nhi"],
    difficulty: "beginner",
    relatedSlugs: [],
    vizType: "interactive",
    tier: "nhi",
    durationMinutes: 6,
    mascotMood: "curious",
  },
  {
    slug: "nhi-creature-garden",
    title: "Creature Garden",
    titleVi: "Vườn sinh vật",
    description: "Phân loại sinh vật theo đặc điểm — nền tảng của dữ liệu và phân loại",
    category: "kids-math",
    tags: ["classification", "nhi"],
    difficulty: "beginner",
    relatedSlugs: [],
    vizType: "interactive",
    tier: "nhi",
    durationMinutes: 6,
    mascotMood: "happy",
  },
  {
    slug: "nhi-treasure-map",
    title: "Treasure Map",
    titleVi: "Bản đồ kho báu",
    description: "Kết hợp hướng đi để tìm kho báu — nền tảng của vector",
    category: "kids-math",
    tags: ["vectors", "nhi"],
    difficulty: "beginner",
    relatedSlugs: [],
    vizType: "interactive",
    tier: "nhi",
    durationMinutes: 6,
    mascotMood: "curious",
  },
  {
    slug: "nhi-magic-marble-bag",
    title: "Magic Marble Bag",
    titleVi: "Túi bi thần kỳ",
    description: "Đoán màu bi và khám phá xác suất qua thí nghiệm",
    category: "kids-math",
    tags: ["probability", "nhi"],
    difficulty: "beginner",
    relatedSlugs: [],
    vizType: "interactive",
    tier: "nhi",
    durationMinutes: 6,
    mascotMood: "happy",
  },
  {
    slug: "nhi-shadow-theater",
    title: "Shadow Theater",
    titleVi: "Rạp chiếu bóng",
    description: "Xoay ánh sáng để phân biệt hình khối — nền tảng của giảm chiều",
    category: "kids-math",
    tags: ["dimensionality", "nhi"],
    difficulty: "beginner",
    relatedSlugs: [],
    vizType: "interactive",
    tier: "nhi",
    durationMinutes: 6,
    mascotMood: "curious",
  },
  {
    slug: "nhi-ocean-race",
    title: "Ocean Race",
    titleVi: "Đường đua đại dương",
    description: "Đua trên đường cong và khám phá tốc độ thay đổi — nền tảng của đạo hàm",
    category: "kids-math",
    tags: ["calculus", "nhi"],
    difficulty: "beginner",
    relatedSlugs: [],
    vizType: "interactive",
    tier: "nhi",
    durationMinutes: 6,
    mascotMood: "happy",
  },
];

export const kidsTopicMap: Record<string, KidsTopicMeta> = Object.fromEntries(
  kidsTopicList.map((t) => [t.slug, t]),
);

export const nhiTopics: KidsTopicMeta[] = kidsTopicList.filter((t) => t.tier === "nhi");
export const teenTopics: KidsTopicMeta[] = kidsTopicList.filter((t) => t.tier === "teen");
```

- [ ] **Step 5: Update kids topic page to dynamically import content**

Replace `src/app/kids/topics/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { KidsModeProvider } from "@/lib/kids/mode-context";
import { kidsTopicList, kidsTopicMap } from "@/topics/kids/kids-registry";
import KidsTopicLoader from "@/topics/kids/kids-topic-loader";

export function generateStaticParams() {
  return kidsTopicList.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = kidsTopicMap[slug];
  if (!topic) return {};
  return {
    title: `${topic.titleVi} | Nhí — AI Cho Mọi Người`,
    description: topic.description,
  };
}

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
        <KidsTopicLoader meta={topic} />
      </AppShell>
    </KidsModeProvider>
  );
}
```

Create the loader `src/topics/kids/kids-topic-loader.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { KidsTopicMeta } from "@/lib/kids/types";

const componentCache = new Map<string, React.ComponentType>();

function getKidsTopicComponent(slug: string) {
  if (!componentCache.has(slug)) {
    const Component = dynamic(() => import(`@/topics/kids/${slug}`), {
      loading: () => (
        <div className="flex items-center justify-center py-20">
          <div className="text-4xl animate-bounce">🐙</div>
        </div>
      ),
    });
    componentCache.set(slug, Component);
  }
  return componentCache.get(slug)!;
}

interface KidsTopicLoaderProps {
  meta: KidsTopicMeta;
}

export default function KidsTopicLoader({ meta }: KidsTopicLoaderProps) {
  const TopicContent = useMemo(() => getKidsTopicComponent(meta.slug), [meta.slug]);
  return <TopicContent />;
}
```

- [ ] **Step 6: Write infrastructure tests**

```tsx
// src/__tests__/kids-nhi-infrastructure.test.tsx
import { describe, it, expect } from "vitest";
import { kidsTopicList, kidsTopicMap, nhiTopics } from "@/topics/kids/kids-registry";

describe("kids-registry: Nhí topics", () => {
  it("has exactly 6 Nhí topics", () => {
    expect(nhiTopics).toHaveLength(6);
  });

  it("all Nhí topics have tier=nhi and durationMinutes=6", () => {
    for (const t of nhiTopics) {
      expect(t.tier).toBe("nhi");
      expect(t.durationMinutes).toBe(6);
    }
  });

  it("all slugs are in kidsTopicMap", () => {
    for (const t of kidsTopicList) {
      expect(kidsTopicMap[t.slug]).toBeDefined();
      expect(kidsTopicMap[t.slug].titleVi).toBe(t.titleVi);
    }
  });

  it("slugs follow nhi- prefix convention", () => {
    for (const t of nhiTopics) {
      expect(t.slug).toMatch(/^nhi-/);
    }
  });

  it("all Vietnamese text uses correct diacritics (no ASCII Vietnamese)", () => {
    const asciiPatterns = [
      /\bNha may\b/i,
      /\bVuon\b/i,
      /\bBan do\b/i,
      /\bTui bi\b/i,
      /\bRap chieu\b/i,
      /\bDuong dua\b/i,
      /\bsan ho\b/i,
      /\bsinh vat\b/i,
      /\bkho bau\b/i,
      /\bthan ky\b/i,
      /\bchieu bong\b/i,
      /\bdai duong\b/i,
    ];
    for (const t of nhiTopics) {
      for (const pattern of asciiPatterns) {
        expect(t.titleVi).not.toMatch(pattern);
        expect(t.description).not.toMatch(pattern);
      }
    }
  });

  const expectedSlugs = [
    "nhi-coral-factory",
    "nhi-creature-garden",
    "nhi-treasure-map",
    "nhi-magic-marble-bag",
    "nhi-shadow-theater",
    "nhi-ocean-race",
  ];

  it("has all expected slugs", () => {
    const slugs = nhiTopics.map((t) => t.slug).sort();
    expect(slugs).toEqual(expectedSlugs.sort());
  });
});
```

- [ ] **Step 7: Run tests and verify**

Run: `npx vitest run src/__tests__/kids-nhi-infrastructure.test.tsx`
Expected: All tests pass.

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/kids/nhi/MascotBubble.tsx src/components/kids/nhi/PearlReveal.tsx src/components/kids/nhi/KidsTopicLayout.tsx src/topics/kids/kids-registry.ts src/topics/kids/kids-topic-loader.tsx src/app/kids/topics/\\[slug\\]/page.tsx src/__tests__/kids-nhi-infrastructure.test.tsx src/app/globals.css
git commit -m "feat(kids): add shared Nhí components + registry + dynamic topic loader"
```

---

## Task 2: OceanMap + Nhí Landing Page

**Files:**
- Create: `src/components/kids/nhi/OceanMap.tsx`
- Modify: `src/app/kids/nhi/page.tsx`

- [ ] **Step 1: Create OceanMap component**

The OceanMap is an SVG ocean scene with 6 clickable island locations. Each island has:
- A unique visual identity (icon representing the location)
- A glowing pearl overlay when the topic is completed
- A link to `/kids/topics/{slug}`

```tsx
// src/components/kids/nhi/OceanMap.tsx
"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress-context";

interface Island {
  slug: string;
  nameVi: string;
  icon: string;
  cx: number;
  cy: number;
}

const ISLANDS: Island[] = [
  { slug: "nhi-coral-factory", nameVi: "Nhà máy san hô", icon: "🏭", cx: 80, cy: 65 },
  { slug: "nhi-creature-garden", nameVi: "Vườn sinh vật", icon: "🌿", cx: 220, cy: 40 },
  { slug: "nhi-treasure-map", nameVi: "Bản đồ kho báu", icon: "🗺️", cx: 340, cy: 80 },
  { slug: "nhi-magic-marble-bag", nameVi: "Túi bi thần kỳ", icon: "🎱", cx: 140, cy: 160 },
  { slug: "nhi-shadow-theater", nameVi: "Rạp chiếu bóng", icon: "🎭", cx: 280, cy: 170 },
  { slug: "nhi-ocean-race", nameVi: "Đường đua", icon: "🏁", cx: 200, cy: 260 },
];

const W = 420;
const H = 320;
const ISLAND_R = 32;

export default function OceanMap() {
  const { readTopics } = useProgress();

  return (
    <div className="w-full max-w-lg mx-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Bản đồ đại dương — 6 hòn đảo"
      >
        {/* Ocean background */}
        <defs>
          <radialGradient id="ocean-bg">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} rx="16" fill="url(#ocean-bg)" />

        {/* Suggested path (dotted line connecting islands) */}
        <polyline
          points={ISLANDS.map((isl) => `${isl.cx},${isl.cy}`).join(" ")}
          fill="none"
          stroke="#93c5fd"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.5"
        />

        {/* Decorative waves */}
        {[60, 130, 200, 270].map((y) => (
          <path
            key={y}
            d={`M0 ${y} Q${W * 0.25} ${y - 8} ${W * 0.5} ${y} Q${W * 0.75} ${y + 8} ${W} ${y}`}
            fill="none"
            stroke="#bae6fd"
            strokeWidth="1"
            opacity="0.4"
          />
        ))}

        {/* Islands */}
        {ISLANDS.map((isl) => {
          const done = readTopics.includes(isl.slug);
          return (
            <g key={isl.slug}>
              <Link href={`/kids/topics/${isl.slug}`}>
                {/* Island base */}
                <circle
                  cx={isl.cx}
                  cy={isl.cy}
                  r={ISLAND_R}
                  fill={done ? "#fef3c7" : "#f0f9ff"}
                  stroke={done ? "#f59e0b" : "#7dd3fc"}
                  strokeWidth={done ? 3 : 2}
                  className="transition-all duration-300 cursor-pointer hover:stroke-amber-400"
                />

                {/* Icon */}
                <text
                  x={isl.cx}
                  y={isl.cy + 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="20"
                  className="pointer-events-none"
                >
                  {isl.icon}
                </text>

                {/* Pearl glow for completed */}
                {done && (
                  <circle
                    cx={isl.cx + ISLAND_R * 0.6}
                    cy={isl.cy - ISLAND_R * 0.6}
                    r="8"
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    className="animate-pearl-glow"
                  />
                )}

                {/* Label */}
                <text
                  x={isl.cx}
                  y={isl.cy + ISLAND_R + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill="#0c4a6e"
                  className="pointer-events-none"
                >
                  {isl.nameVi}
                </text>
              </Link>
            </g>
          );
        })}

        {/* Octopus at center */}
        <text x={W / 2} y={H / 2 + 20} textAnchor="middle" fontSize="28">
          🐙
        </text>
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Update Nhí landing page to use OceanMap**

Replace `src/app/kids/nhi/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { KidsModeProvider } from "@/lib/kids/mode-context";
import { useProgress } from "@/lib/progress-context";
import OceanMap from "@/components/kids/nhi/OceanMap";

const NHI_SLUGS = [
  "nhi-coral-factory",
  "nhi-creature-garden",
  "nhi-treasure-map",
  "nhi-magic-marble-bag",
  "nhi-shadow-theater",
  "nhi-ocean-race",
];

function NhiContent() {
  const { readTopics } = useProgress();
  const done = NHI_SLUGS.filter((s) => readTopics.includes(s)).length;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Trang chủ
      </Link>

      <div className="rounded-[20px] border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-500/5 p-6 mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
          <Sparkles size={14} />
          <span>Lộ trình Nhí · 6–10 tuổi</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          Cuộc phiêu lưu của Bé Bạch Tuộc
        </h1>
        <p className="text-sm text-muted mt-2">
          Bão đã cuốn đi 6 viên ngọc thần kỳ! Giúp Bé Bạch Tuộc tìm lại chúng nhé.
        </p>

        {done > 0 && (
          <div className="mt-4">
            <span className="text-xs font-medium text-muted">
              {done}/6 viên ngọc đã tìm được
            </span>
            <div className="h-2 w-full rounded-full bg-surface mt-1">
              <div
                className="h-2 rounded-full bg-amber-400 transition-all duration-700"
                style={{ width: `${Math.round((done / 6) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <OceanMap />
    </div>
  );
}

export default function NhiPathPage() {
  return (
    <KidsModeProvider initialTier="nhi">
      <AppShell>
        <NhiContent />
      </AppShell>
    </KidsModeProvider>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors.

Run: `npx vitest run`
Expected: All existing tests pass (125+).

- [ ] **Step 4: Commit**

```bash
git add src/components/kids/nhi/OceanMap.tsx src/app/kids/nhi/page.tsx
git commit -m "feat(kids): add OceanMap and update Nhí landing page"
```

---

## Task 3: Topic 1 — Nhà máy san hô (Coral Factory — Functions)

**Files:**
- Create: `src/components/kids/nhi/CoralFactory.tsx`
- Create: `src/topics/kids/nhi-coral-factory.tsx`

**Spec reference:** Spec §4.1

**The math:** f: A → B. Injective functions. Composition f(g(x)).

**Visualization:** SVG ~400×500. Left: 6 draggable input creatures. Center: machine. Right: output slots.

**Creatures data model:**
```ts
interface Creature {
  id: number;
  species: "fish" | "turtle" | "crab" | "jellyfish" | "starfish" | "seahorse";
  color: "blue" | "red" | "green" | "yellow" | "purple" | "orange";
  size: "small" | "medium" | "large";
  legs: number; // 0, 2, 4, 6, 8, 10
}
```

**SVG creature rendering:** Each creature is a simple SVG group: an ellipse body colored by `creature.color`, species-specific decorations (fish tail, crab claws, etc.), and a small `legs` count number badge. Size variant scales the group by 0.7/1.0/1.3.

**Machine rules — sequential difficulty:**
- Phase 0, Rule 1: `color → nextColor` (blue→red→green→yellow→purple→orange→blue)
- Phase 0, Rule 2 (after 3 interactions): `legs × 2`
- Phase 1 challenges use Rule 2
- Phase 1 hard mode (after 3 correct): `legs × 2 + 2` (function composition)

**Phase transitions:**
- Phase 0 → 1: After 5 drag-ins, machine "CLUNK" animation (shake + gear-stop SVG). MascotBubble: "Ôi không, máy bị kẹt rồi! Bạn có nhớ quy tắc không?"
- Phase 1 → 2: After 3 correct predictions in the hard rule. MascotBubble: "Bạn giỏi quá! Giờ bạn TẠO quy tắc riêng nhé!"
- Phase 2 end: After kid sets a rule and runs it on all 6 creatures → PearlReveal.

**All Vietnamese text strings:**
```
introText: "Ôi không! Viên ngọc bị giấu trong nhà máy san hô. Bạn giúp mình tìm được không?"
phase0Hint: "Kéo một con vật vào máy xem điều gì xảy ra!"
phase1Prompt: "Ôi không, máy bị kẹt rồi! Bạn có nhớ quy tắc không?"
phase1Correct: "Đúng rồi! Giỏi lắm!"
phase1Wrong: "Gần đúng rồi! Thử lại nha!"
phase1HardIntro: "Quy tắc mới khó hơn nè!"
phase2Prompt: "Bạn giỏi quá! Giờ bạn TẠO quy tắc riêng nhé!"
phase2Run: "Chạy máy!"
```

**Topic file:**

```tsx
// src/topics/kids/nhi-coral-factory.tsx
"use client";

import { kidsTopicMap } from "@/topics/kids/kids-registry";
import KidsTopicLayout from "@/components/kids/nhi/KidsTopicLayout";
import CoralFactory from "@/components/kids/nhi/CoralFactory";

const meta = kidsTopicMap["nhi-coral-factory"];

export default function NhiCoralFactoryTopic() {
  return (
    <KidsTopicLayout
      meta={meta}
      introText="Ôi không! Viên ngọc bị giấu trong nhà máy san hô. Bạn giúp mình tìm được không?"
    >
      <CoralFactory />
    </KidsTopicLayout>
  );
}
```

**CoralFactory.tsx requirements (~500-700 lines):**

The implementer must build:
1. SVG scene with 3 columns: input creatures (left), machine (center), output area (right)
2. 6 creature SVG groups, each draggable via pointer events (onPointerDown/Move/Up)
3. Machine SVG with gear icons, a "rule window" showing the current operation icon
4. Phase 0: drag creature → machine animate (gears spin via CSS) → output creature slides out after 600ms
5. Phase 1: input creature shown in machine, output slot empty. Kid drags from palette of possible outputs. Correct → green glow. Wrong → machine shakes.
6. Phase 2: visual operation menu (×2, +1, swap color, grow size). Kid picks. "Chạy máy!" button runs on all 6. PearlReveal on completion.
7. Adaptive difficulty: track `correctStreak` state. At 3, upgrade to hard rule.
8. All drag interactions use `pointer-events` (not mouse-only) for touch compatibility.
9. Minimum 44×44px touch targets for all interactive elements.

- [ ] **Step 1: Create CoralFactory.tsx**

Implement the full visualization component following the requirements above. All Vietnamese text must use correct diacritics. Use `useState` for phase, creatures, predictions, correctStreak, and customRule state. Use `useCallback` for drag handlers and phase transitions.

- [ ] **Step 2: Create nhi-coral-factory.tsx topic file**

Use the template above.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors.

Navigate to http://localhost:3000/kids/topics/nhi-coral-factory — verify the 3-phase flow works.

- [ ] **Step 4: Commit**

```bash
git add src/components/kids/nhi/CoralFactory.tsx src/topics/kids/nhi-coral-factory.tsx
git commit -m "feat(kids): add Coral Factory — Functions topic for Nhí"
```

---

## Task 4: Topic 2 — Vườn sinh vật (Creature Garden — Classification)

**Files:**
- Create: `src/components/kids/nhi/CreatureGarden.tsx`
- Create: `src/topics/kids/nhi-creature-garden.tsx`

**Spec reference:** Spec §4.2

**The math:** Feature vectors in R², decision boundaries, nearest-centroid classification.

**SVG scene:** ~400×450. 16 creatures with visible features.

**Creature feature model:**
```ts
interface GardenCreature {
  id: number;
  color: "red" | "blue" | "green";
  size: "small" | "medium" | "large";
  pattern: "spots" | "stripes" | "plain";
  x: number; // SVG position
  y: number;
}
```

Generate 16 creatures with balanced distribution: ~5-6 per color, ~5-6 per size. Positions randomized within the garden SVG bounds.

**Phase transitions:**
- Phase 0 → 1: After 8 drag interactions. MascotBubble: "Bão sắp tới! Giúp mình chia nhóm để trú ẩn nha!"
- Phase 1 Round 1: Sort by color (1 fence = 2 groups). Match meter (purity score 0-100%).
- Phase 1 Round 2: Second fence (4 quadrants). Sort by 2 features.
- Phase 1 → 2: Round 3 — mystery creature at gate. MascotBubble: "Bạn mới tới! Nó thuộc nhóm nào?"
- Phase 2 end: Kid classifies mystery creature correctly → PearlReveal.

**Fence mechanics:** SVG line(s) that divide the garden. In Round 1, a horizontal or vertical line creating 2 zones. In Round 2, both horizontal AND vertical creating 4 quadrants. Creatures snap to the nearest zone when dragged across a fence.

**Match meter:** `purity = correctlySorted / total`. Displayed as a colored bar. Green (>80%), yellow (50-80%), red (<50%).

**Vietnamese text strings:**
```
introText: "Vườn sinh vật đầy những bạn nhỏ dễ thương! Kéo chúng quanh vườn xem nào!"
phase1Prompt: "Bão sắp tới! Giúp mình chia nhóm để trú ẩn nha!"
phase1Round2: "Nhóm này vẫn quá đông! Chia thêm nha!"
phase2Prompt: "Bạn mới tới! Nó thuộc nhóm nào?"
phase2Correct: "Đúng rồi! Bạn ấy vui lắm!"
phase2Wrong: "Hmm, thử nhìn lại đặc điểm nha!"
```

**Topic file:** Same pattern as Task 3, with `meta = kidsTopicMap["nhi-creature-garden"]` and introText from above.

**CreatureGarden.tsx requirements (~500-650 lines):**
1. SVG garden with 16 draggable creature blobs (ellipse + feature decorations)
2. Feature spotlight button: toggles dimming all features except one (color, size, or pattern)
3. Fence SVG lines that appear at phase transitions
4. Match meter bar at bottom
5. Mystery creature entrance animation (slides in from right) in phase 2
6. All drag via pointer events with 44×44px min targets

- [ ] **Step 1: Create CreatureGarden.tsx and nhi-creature-garden.tsx**
- [ ] **Step 2: Verify with tsc + manual test at /kids/topics/nhi-creature-garden**
- [ ] **Step 3: Commit**

```bash
git add src/components/kids/nhi/CreatureGarden.tsx src/topics/kids/nhi-creature-garden.tsx
git commit -m "feat(kids): add Creature Garden — Classification topic for Nhí"
```

---

## Task 5: Topic 3 — Bản đồ kho báu (Treasure Map — Vectors)

**Files:**
- Create: `src/components/kids/nhi/TreasureMap.tsx`
- Create: `src/topics/kids/nhi-treasure-map.tsx`

**Spec reference:** Spec §4.3

**The math:** R² vectors, addition, magnitude, scalar multiplication.

**SVG scene:** ~400×400, 10×10 grid. Cell size = 36px. Padding = 20px.

**Grid model:**
```ts
type Direction = "right" | "left" | "up" | "down" | "upright" | "upleft" | "downright" | "downleft";
const DIRECTION_VECTORS: Record<Direction, [number, number]> = {
  right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1],
  upright: [1, -1], upleft: [-1, -1], downright: [1, 1], downleft: [-1, 1],
};
```

**Landmarks:** 4 fixed positions on the grid: palm tree (7,2), cave (3,6), volcano (8,8), treasure chest (9,3).

**Phase transitions:**
- Phase 0 → 1: After 6 arrow moves. Fog overlay (semitransparent white rect) fades in. MascotBubble: "Sương mù! Chỉ được đi 2 bước thôi!"
- Phase 1 Challenge 1: Reach palm tree (7,2) from octopus position using exactly 2 arrows. Arrows visually merge into diagonal (animated). Shows component numbers.
- Phase 1 Challenge 2: Reach cave (3,6) with one arrow forced to "up." Kid picks the second.
- Phase 1 Challenge 3: Single "right" arrow + strength slider (×1, ×2, ×3). Octopus jumps farther.
- Phase 1 → 2: After all 3 challenges. MascotBubble: "Bạn mình bị lạc! Vẽ đường cho bạn ấy về nhà!"
- Phase 2: Second octopus at random grid position. Kid places arrows to guide it to (0,0). Star rating: 1 arrow = ⭐⭐⭐, 2 = ⭐⭐, 3+ = ⭐. PearlReveal.

**Vietnamese text strings:**
```
introText: "Hòn đảo bí ẩn! Kéo mũi tên để di chuyển Bạch Tuộc khám phá nha!"
phase1Fog: "Sương mù dày quá! Chỉ được dùng 2 mũi tên thôi!"
phase1Challenge2: "Tới hang động! Một mũi tên phải đi lên — bạn chọn mũi tên còn lại!"
phase1Challenge3: "Mũi tên này có thể mạnh hơn! Kéo thanh trượt nha!"
phase2Prompt: "Bạn mình bị lạc! Vẽ đường cho bạn ấy về nhà!"
```

**TreasureMap.tsx requirements (~500-650 lines):**
1. SVG 10×10 grid with cell lines, landmarks as emoji/SVG icons
2. Arrow tile palette at bottom (8 directions), draggable onto the grid
3. Octopus token that moves along arrows with trail animation
4. Fog overlay (CSS opacity transition)
5. Arrow merge animation: two arrows → interpolate to diagonal → single arrow
6. Strength slider for scalar multiplication challenge
7. Star rating display at end

- [ ] **Step 1: Create TreasureMap.tsx and nhi-treasure-map.tsx**
- [ ] **Step 2: Verify with tsc + manual test**
- [ ] **Step 3: Commit**

```bash
git add src/components/kids/nhi/TreasureMap.tsx src/topics/kids/nhi-treasure-map.tsx
git commit -m "feat(kids): add Treasure Map — Vectors topic for Nhí"
```

---

## Task 6: Topic 4 — Túi bi thần kỳ (Magic Marble Bag — Probability)

**Files:**
- Create: `src/components/kids/nhi/MagicMarbleBag.tsx`
- Create: `src/topics/kids/nhi-magic-marble-bag.tsx`

**Spec reference:** Spec §4.4

**The math:** Frequentist probability, law of large numbers, conditional probability.

**SVG scene:** Bag ~200×250 center, tally bars ~400×150 bottom.

**Marble model:**
```ts
interface MarbleConfig { red: number; blue: number; }
// Phase 0 default: { red: 3, blue: 7 }
```

**Random draw:** Use `Math.random()` weighted by marble counts. With replacement (marble goes back after each draw).

**Tally bars:** SVG rect bars that grow upward. Max height = 120px. Each bar width = 60px. Red bar at x=130, blue bar at x=230. Height = `(count / maxDraws) * 120`. Label below each bar: "{count}/{totalDraws}".

**Phase transitions:**
- Phase 0 → 1: After 20 draws. Bag becomes opaque (add white fill + "?" text). MascotBubble: "Đặt cược nào! Màu gì sẽ ra tiếp theo?"
- Phase 1 prediction: Before each draw, kid taps red or blue button. Prediction row at top shows ✓/✗ history.
- Phase 1 after 10 predictions: Octopus asks "Màu nào ra NHIỀU hơn?" — 3 options: "7/10", "5/10", "3/10". Correct = "7/10" (matches blue proportion).
- Phase 1 bag change: Config changes to {red: 5, blue: 5}. Octopus: "Túi mới nè! Giờ sao?" Kid experiences 50/50 = can't predict.
- Phase 1 advanced: Two bags appear side by side. Bag A: {red: 1, blue: 9}, Bag B: {red: 5, blue: 5}. A blue marble is drawn. "Từ túi nào?" Kid picks. Correct = Bag A (Bayesian reasoning).
- Phase 1 → 2: After Bayesian question. MascotBubble: "Tạo một túi bi BÍ ẨN cho bạn mình đoán!"
- Phase 2: Kid adds/removes marbles (marble palette + drag). Bag goes opaque. Animated "friend" draws 10 times and guesses. PearlReveal.

**Vietnamese text strings:**
```
introText: "Túi bi thần kỳ! Rút một viên bi xem được màu gì nha!"
phase1Prompt: "Đặt cược nào! Màu gì sẽ ra tiếp theo?"
phase1Question: "Màu nào ra NHIỀU hơn? Bao nhiêu lần trong 10?"
phase1NewBag: "Túi mới nè! Giờ sao?"
phase1Bayesian: "Viên bi xanh này từ túi nào?"
phase1BayesianCorrect: "Đúng rồi! Túi nào nhiều bi xanh hơn thì khả năng cao hơn!"
phase2Prompt: "Tạo một túi bi BÍ ẨN cho bạn mình đoán!"
phase2FriendGuessing: "Bạn mình đang đoán..."
```

**MagicMarbleBag.tsx requirements (~550-700 lines):**
1. SVG bag shape (rounded trapezoid), semi-transparent in phase 0, opaque in phase 1
2. Marble circles inside bag (jiggle animation via CSS)
3. Draw animation: marble floats up and out of bag, lands in tally row
4. Tally bars grow with CSS transitions
5. Prediction buttons (red/blue) with ✓/✗ history row
6. Multiple-choice question overlay for "Màu nào ra NHIỀU hơn?"
7. Two-bag layout for Bayesian challenge
8. Creator mode: marble palette + drag to add/remove from bag

- [ ] **Step 1: Create MagicMarbleBag.tsx and nhi-magic-marble-bag.tsx**
- [ ] **Step 2: Verify with tsc + manual test**
- [ ] **Step 3: Commit**

```bash
git add src/components/kids/nhi/MagicMarbleBag.tsx src/topics/kids/nhi-magic-marble-bag.tsx
git commit -m "feat(kids): add Magic Marble Bag — Probability topic for Nhí"
```

---

## Task 7: Topic 5 — Rạp chiếu bóng (Shadow Theater — Dimensionality)

**Files:**
- Create: `src/components/kids/nhi/ShadowTheater.tsx`
- Create: `src/topics/kids/nhi-shadow-theater.tsx`

**Spec reference:** Spec §4.5

**The math:** Projection R³→R², variance maximization.

**SVG scene:** Split-screen. Left ~200×350: isometric 3D objects. Right ~200×350: shadow screen. Light control below.

**3D objects as isometric SVG:**
```ts
interface Shape3D {
  id: string;
  name: string;
  nameVi: string;
  vertices: [number, number, number][]; // 3D points
  faces: number[][]; // indices into vertices
  color: string;
}
```

Shapes: sphere (approximated as 12-gon), cube (8 vertices), pyramid (5 vertices), cylinder (top/bottom circles), cone (bottom circle + apex).

**Shadow projection math:**
Given a light angle θ (0–360), project each 3D vertex onto a 2D plane:
```
projectedX = vertex.x * cos(θ) + vertex.z * sin(θ)
projectedY = vertex.y
```
This produces 2D shadow silhouettes. Render as SVG polygon using the convex hull of projected points.

**Clarity meter:** Measures how distinguishable the shadows are. Compute pairwise overlap between shadow bounding boxes. Clarity = 1 - (totalOverlapArea / totalShadowArea). Display as a colored bar (red→yellow→green).

**Phase transitions:**
- Phase 0 → 1: After 10 light-angle changes. 5 objects now (add cylinder and cone). MascotBubble: "Tìm góc nhìn mà mình phân biệt được cả 5 hình!"
- Phase 1: Kid drags light angle. Clarity meter responds. When clarity > 0.85, shadows flash with color. Octopus: "Tuyệt vời!" Then second screen at 90° appears.
- Phase 1 → 2: After finding peak clarity and seeing dual projections. MascotBubble: "Giấu một hình mới sau màn! Bạn mình phải đoán từ bóng thôi!"
- Phase 2: Kid places a shape from palette behind screen, picks a deceptive angle. "Friend" guesses. PearlReveal.

**Vietnamese text strings:**
```
introText: "Rạp chiếu bóng! Xoay đèn xem bóng của các hình thay đổi thế nào!"
phase1Prompt: "Tìm góc chiếu mà mình phân biệt được cả 5 hình!"
phase1Found: "Tuyệt vời! Góc này cho thấy rõ nhất!"
phase1DualScreen: "Nhìn thêm góc này nữa — hai góc nhìn giúp mình hiểu rõ hơn!"
phase2Prompt: "Giấu một hình mới sau màn! Bạn mình phải đoán từ bóng thôi!"
phase2FriendGuessing: "Bạn mình đang đoán... Hình gì nhỉ?"
```

**ShadowTheater.tsx requirements (~600-750 lines):**
1. Isometric SVG rendering for 3D shapes (no WebGL)
2. Shadow projection using the formula above, rendered as SVG polygons
3. Draggable light-angle control (circular slider / arc handle)
4. Clarity meter bar with color gradient
5. Dual-screen layout for PC2 reveal
6. Shape palette for creator mode

- [ ] **Step 1: Create ShadowTheater.tsx and nhi-shadow-theater.tsx**
- [ ] **Step 2: Verify with tsc + manual test**
- [ ] **Step 3: Commit**

```bash
git add src/components/kids/nhi/ShadowTheater.tsx src/topics/kids/nhi-shadow-theater.tsx
git commit -m "feat(kids): add Shadow Theater — Dimensionality topic for Nhí"
```

---

## Task 8: Topic 6 — Đường đua đại dương (Ocean Race — Rates of Change)

**Files:**
- Create: `src/components/kids/nhi/OceanRace.tsx`
- Create: `src/topics/kids/nhi-ocean-race.tsx`

**Spec reference:** Spec §4.6

**The math:** Instantaneous rate of change, derivative as slope, function↔derivative relationship.

**SVG scene:** ~400×450. Top half: wavy track as cubic Bézier curve. Bottom half: speedometer + mini derivative graph.

**Track curve:** Cubic Bézier with control points creating hills and valleys:
```ts
const TRACK_POINTS = [
  { x: 20, y: 200 },   // start
  { x: 120, y: 80 },   // control 1 (hill peak)
  { x: 200, y: 280 },  // control 2 (valley)
  { x: 300, y: 100 },  // control 3 (hill)
  { x: 380, y: 220 },  // end
];
```

**Derivative computation:** For a parametric Bézier curve, the derivative at parameter t gives the tangent vector. Speed = magnitude of tangent = `sqrt(dx² + dy²)`. Normalize to display range. The slope component `dy/dx` at each point gives the rate of change.

**Speedometer:** SVG arc gauge (180° arc from -90° to +90°). Needle angle maps from min speed to max speed. Fill color: blue (slow) → yellow (medium) → red (fast).

**Mini derivative graph:** Plots speed vs position along the track. SVG polyline that fills as the octopus moves. This graph IS the derivative of the track curve.

**Phase transitions:**
- Phase 0 → 1: After 3 complete runs or 15 seconds of dragging. 3 flag positions appear on track. MascotBubble: "Chỗ nào mình chạy NHANH NHẤT? Cắm cờ đỏ ở đó!"
- Phase 1 Challenge 1: Drag red flag to steepest descent. Correct = within 30px of actual max slope. Tangent line reveals.
- Phase 1 Challenge 2: Speed graph shown, track hidden behind curtain. "Đường đua trông thế nào?" — pick from 3 track shapes. Correct reveals track.
- Phase 1 Challenge 3: "Tìm chỗ mình ĐỨNG YÊN!" — identify where speed ≈ 0 (local min/max). Tangent line goes flat.
- Phase 1 → 2: After all 3 challenges. MascotBubble: "Vẽ đường đua riêng của bạn!"
- Phase 2: Kid draws freehand curve (onPointerMove captures points → smooth with Bézier). Octopus rides it. Speedometer responds. Optional challenge: "draw a track where octopus accelerates the whole way." PearlReveal.

**Vietnamese text strings:**
```
introText: "Đường đua đại dương! Xem Bạch Tuộc lướt sóng nhanh cỡ nào!"
phase0Hint: "Kéo Bạch Tuộc dọc đường đua — nhìn đồng hồ tốc độ nha!"
phase1FlagPrompt: "Chỗ nào mình chạy NHANH NHẤT? Kéo cờ đỏ tới đó!"
phase1FlagCorrect: "Đúng rồi! Dốc nhất = nhanh nhất!"
phase1GraphPrompt: "Nhìn biểu đồ tốc độ — đường đua nào phù hợp?"
phase1StopPrompt: "Tìm chỗ mình ĐỨNG YÊN! Tốc độ bằng 0 ở đâu?"
phase2Prompt: "Vẽ đường đua riêng của bạn!"
phase2AccelerateChallenge: "Thử vẽ đường mà Bạch Tuộc tăng tốc suốt!"
```

**OceanRace.tsx requirements (~550-700 lines):**
1. SVG Bézier track with water-themed decorations
2. Octopus token that moves along the track (parametric t from 0→1)
3. Tangent line visualization at octopus position
4. Speedometer arc gauge with animated needle
5. Mini derivative graph (polyline) that fills in real time
6. Draggable flag for challenge 1
7. Multiple-choice track shape selector for challenge 2
8. Freehand drawing mode with Bézier smoothing for creator phase
9. "Go" button that animates the octopus along the full track

- [ ] **Step 1: Create OceanRace.tsx and nhi-ocean-race.tsx**
- [ ] **Step 2: Verify with tsc + manual test**
- [ ] **Step 3: Commit**

```bash
git add src/components/kids/nhi/OceanRace.tsx src/topics/kids/nhi-ocean-race.tsx
git commit -m "feat(kids): add Ocean Race — Rates of Change topic for Nhí"
```

---

## Task 9: Final Integration + Vietnamese Diacritics Check

**Files:**
- All files from Tasks 1–8
- Modify: `src/__tests__/kids-nhi-infrastructure.test.tsx` (add integration assertions)

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing 125 + new kids infrastructure tests).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Vietnamese diacritics sweep**

Run grep for common ASCII Vietnamese mistakes across all new files:

```bash
grep -rn --include="*.tsx" -E "(Nha may|Vuon|Ban do|Tui bi|Rap chieu|Duong dua|san ho|sinh vat|kho bau|than ky|chieu bong|dai duong|Bach Tuoc|vien ngoc|nhanh nhat|dung roi|gioi lam|ban minh|thu lai|bao sap|tro an|chia nhom|mat do|doc nhat|tang toc)" src/components/kids/ src/topics/kids/
```

Expected: Zero matches. If any found, fix the diacritics immediately.

- [ ] **Step 4: Manual smoke test all 6 topics**

Start dev server: `pnpm dev`

Visit each URL and verify the 3-phase flow:
1. http://localhost:3000/kids/nhi — OceanMap loads, 6 islands clickable
2. http://localhost:3000/kids/topics/nhi-coral-factory — drag creatures in/out
3. http://localhost:3000/kids/topics/nhi-creature-garden — sort creatures by features
4. http://localhost:3000/kids/topics/nhi-treasure-map — grid navigation with arrows
5. http://localhost:3000/kids/topics/nhi-magic-marble-bag — marble draws + tally
6. http://localhost:3000/kids/topics/nhi-shadow-theater — light rotation + shadows
7. http://localhost:3000/kids/topics/nhi-ocean-race — track riding + speedometer

For each topic verify:
- Phase 0 → 1 transition fires (story beat + MascotBubble appears)
- Phase 1 → 2 transition fires after challenges
- PearlReveal shows at end
- Pearl dot fills on the OceanMap after completion
- No console errors
- Touch interactions work (use browser DevTools mobile emulation)

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(kids): diacritics + integration fixes from smoke test"
```

- [ ] **Step 6: Run superpowers:finishing-a-development-branch**

Invoke the finishing skill to present merge/PR options.
