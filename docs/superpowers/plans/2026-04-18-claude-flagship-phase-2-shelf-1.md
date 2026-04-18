# Claude Flagship Guide — Phase 2 (Shelf 1 demos) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Each task dispatches **three** subagents in sequence: implementer, content expert auditor, code quality reviewer. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 1 "Đang xây dựng" placeholder with real, visualization-heavy, annotated demos for the 8 Shelf 1 (Khởi đầu / Starter) tiles so that a Vietnamese learner who finishes Shelf 1 can open Claude Desktop and use Chat, Projects, Artifacts, Files & Vision, Voice Mode, Web Search, Claude Design, and the Chrome extension **without additional instructions**.

**Architecture:** Each tile drops a per-slug page body into the existing `/claude/[feature]` dispatcher. The dispatcher already imports from a `status: "planned" | "ready"` flag on each tile in the registry; when a tile flips to `"ready"`, the dispatcher renders a dedicated body file from `src/features/claude/tiles/<slug>.tsx`. Every tile body is composed from the four Phase 1 primitives (`ClaudeDesktopShell`, `AnnotationLayer`, `DemoCanvas`, `DeepLinkCTA`) and ships with scripted playback, per-frame annotations, and a Vietnamese teaching voice.

**Tech Stack:** Same as Phase 1 — Next.js 16.2.3 App Router, React 19, TypeScript, Tailwind 4, framer-motion, Vitest + Testing Library. No new runtime dependencies.

---

## Content philosophy (non-negotiable)

This is the user's flagship path. Every tile must meet these bars:

1. **Claude Desktop fidelity.** The demo MUST render inside `ClaudeDesktopShell` with pixel-faithful chrome (44px top bar, 248px left rail, correct borders/paper tokens). If the feature happens in a different Anthropic surface (e.g. `claude-design` is Claude.ai Labs, `chrome` is a browser extension), use a dedicated sub-shell component that mirrors THAT surface faithfully. **A learner must recognize the UI instantly when they open Claude.**

2. **Visualization-heavy, not text-heavy.** Prose is a caption, not the lesson. The demo IS the lesson. No bulleted walls of Vietnamese; if a concept needs more than 2 sentences of prose, that's a signal to add another annotated frame instead.

3. **Anthropic-docs-grounded.** Before writing any tile, the implementer and the content auditor each fetch current Anthropic docs for that feature (via WebFetch on `claude.com/product/*`, `code.claude.com/docs`, `platform.claude.com/docs`, or `docs.claude.com/skills` as applicable). Any copy or claim about what Claude does MUST be traceable to an Anthropic source last fetched on 2026-04-18 or later. Cite the source URL in a code-level JSDoc at the top of each tile file.

4. **Vietnamese teaching voice.** Clear, concrete, technically correct, pedagogically sound. No jargon without a one-line parenthetical. Diacritics correct. Addressing "bạn" (informal you) throughout.

5. **Deep-link prompts that actually show the feature.** The `<DeepLinkCTA prompt={...}>` seed MUST produce a Claude response that exercises the tile's feature when a user clicks it. Not a generic "tell me about X" prompt — something that *demonstrates* X.

## Pipeline per tile — three subagents, in order

For each Task 1–8 below, the controller:

1. **Dispatches the implementer subagent (Opus)** with the full task text + pinned docs. The implementer writes TDD tests, then the tile body, commits, self-reviews, reports.

2. **Dispatches the content expert auditor subagent (Opus, new in Phase 2)** with:
   - Path to the committed tile file
   - List of Anthropic docs the auditor must re-fetch at audit time (so facts are current, not cached from implementation)
   - Fidelity checklist (chrome match, annotation accuracy, Vietnamese copy, deep-link realism, pedagogical flow)
   - **Instruction to assume the implementer was fast and may be wrong.** The auditor reads the code AND opens Claude Desktop / the real feature page to cross-check. If a fact is wrong, flag it.
   - The auditor returns either `✅ Content approved` or `❌ Content issues: <list>` with file:line citations and evidence URLs.

3. **If content auditor finds issues**, send implementer back via SendMessage with the audit report, let them fix, re-audit. Loop bounded at 3 iterations per the subagent-driven-development skill.

4. **Dispatches the code quality reviewer subagent (Opus, `superpowers:code-reviewer`)** with the implementer's report. Same pattern as Phase 1.

5. **Only after both auditor and code reviewer approve** does the task mark complete.

**Rationale for the third agent:** in Phase 1 the code reviewer caught engineering issues (dark-mode tokens, exhaustiveness, naming). But they don't check whether a Vietnamese explanation of Claude's Extended Thinking is correct or whether the Chat demo's scripted tokens match what the real model would stream. The content auditor fills that gap.

## Shipping rules (from `AGENTS.md`)

After every task commit, you do NOT push — tasks commit locally on the worktree branch. Only the controller pushes after the final Shelf 1 merge. But when the controller DOES push, it's git push + `vercel deploy --prod --yes` + curl verify, per the rule that landed in commit `4bdb7cb`.

## File structure

**New per-tile body files** (one per task):

```
src/features/claude/tiles/
  chat.tsx              # Task 1 — response streaming demo
  projects.tsx          # Task 2 — persistent workspace (rail + instructions + files)
  artifacts.tsx         # Task 3 — side-panel React/doc artifact
  files-vision.tsx      # Task 4 — PDF + image drop, extracted-data overlay
  voice.tsx             # Task 5 — waveform + transcript animation
  web-search.tsx        # Task 6 — citation chips + fresh-info flag
  claude-design.tsx     # Task 7 — Labs slides/prototype preview (own sub-shell)
  chrome.tsx            # Task 8 — browser sidebar overlay (own sub-shell)
```

**Small supporting additions:**

```
src/features/claude/
  useDemoPlayhead.ts              # Shared hook: 0..1 playhead + play/pause/step/reset
  components/ClaudeLabsShell.tsx  # Alt shell for /claude-design (Labs chrome)
  components/ClaudeChromeShell.tsx # Alt shell for /chrome (browser sidebar)
  tiles/index.ts                  # Dispatcher map: slug → lazy body component
```

**Dispatcher upgrade** (`src/app/claude/[feature]/page.tsx`):
- When `tile.status === "ready"`, lookup a body component in `tiles/index.ts` and render it; else fall back to `TilePlaceholder` (Phase 1 behavior).

**Registry flip** — update `tile.status` from `"planned"` to `"ready"` for each tile as it lands.

**New test files** (one per tile + one for the shared hook + one for dispatcher):

```
src/__tests__/
  claude-use-demo-playhead.test.tsx
  claude-tile-chat.test.tsx
  claude-tile-projects.test.tsx
  claude-tile-artifacts.test.tsx
  claude-tile-files-vision.test.tsx
  claude-tile-voice.test.tsx
  claude-tile-web-search.test.tsx
  claude-tile-claude-design.test.tsx
  claude-tile-chrome.test.tsx
  claude-dispatcher-ready-routing.test.tsx
```

## Per-tile standard template

Every tile body exports a default function that composes the Phase 1 primitives:

```tsx
"use client";
/**
 * Source of truth for this tile's behavior (fetched YYYY-MM-DD):
 * - https://claude.com/product/<feature>
 * - https://docs.claude.com/en/<feature>
 *
 * UI snapshot: matches Claude Desktop as of 2026-04-18.
 */

import { useDemoPlayhead } from "@/features/claude/useDemoPlayhead";
import { ClaudeDesktopShell, ShellMessage, ShellComposerStub }
  from "@/features/claude/components/ClaudeDesktopShell";
import { AnnotationLayer } from "@/features/claude/components/AnnotationLayer";
import { DemoCanvas } from "@/features/claude/components/DemoCanvas";
import { DeepLinkCTA } from "@/features/claude/components/DeepLinkCTA";
import type { Annotation } from "@/features/claude/types";

const annotations: Annotation[] = [ /* 3-5 pins with showAt timing */ ];

const stillFrames = [
  { t: 0,   title: "...", caption: "Vietnamese explanation." },
  { t: 0.5, title: "...", caption: "..." },
  { t: 1,   title: "...", caption: "..." },
];

export default function ChatTile() {
  const { playhead, playing, onPlay, onReset, onStep } =
    useDemoPlayhead({ duration: 7000 });

  return (
    <article className="mx-auto max-w-[1100px] px-4 py-12">
      <header>{/* eyebrow, H1 (tile.viTitle), one-line answer */}</header>

      <DemoCanvas
        title="Chat + phản hồi trực tiếp"
        playing={playing}
        onPlay={onPlay}
        onReset={onReset}
        onStep={onStep}
      >
        <div className="relative">
          <ClaudeDesktopShell
            topBar={<ChatTopBar />}
            leftRail={<ChatLeftRail />}
            main={<ChatMain playhead={playhead} />}
          />
          <AnnotationLayer annotations={annotations} playhead={playhead} />
        </div>
      </DemoCanvas>

      <section className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stillFrames.map(f => (
          <StillFrame key={f.t} playhead={f.t} title={f.title} caption={f.caption} />
        ))}
      </section>

      <section className="mt-12 flex flex-wrap gap-3">
        <DeepLinkCTA prompt="..." />
      </section>

      <nav className="mt-12 border-t border-border pt-6">
        {/* 2-3 cross-links to sibling tiles */}
      </nav>
    </article>
  );
}
```

Each task below fills in the specifics for one tile.

---

## Task 0: `useDemoPlayhead` shared hook + dispatcher upgrade

Foundation task — ship before any tile task so they can all consume the same playhead primitive.

**Files:**
- Create: `src/features/claude/useDemoPlayhead.ts`
- Modify: `src/app/claude/[feature]/page.tsx` — route to real tile body when `tile.status === "ready"`
- Create: `src/features/claude/tiles/index.ts` — slug→lazy body map, initially empty
- Test: `src/__tests__/claude-use-demo-playhead.test.tsx`
- Test: `src/__tests__/claude-dispatcher-ready-routing.test.tsx`

- [ ] **Step 1: Context7 on framer-motion `useAnimationFrame`** (we will drive the playhead with rAF for smoothness; confirm the hook API and SSR behavior).

- [ ] **Step 2: Write the failing test for `useDemoPlayhead`**

```tsx
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDemoPlayhead } from "@/features/claude/useDemoPlayhead";

describe("useDemoPlayhead", () => {
  it("starts at playhead=0 playing=false", () => {
    const { result } = renderHook(() => useDemoPlayhead({ duration: 1000 }));
    expect(result.current.playhead).toBe(0);
    expect(result.current.playing).toBe(false);
  });

  it("onPlay flips playing=true", () => {
    const { result } = renderHook(() => useDemoPlayhead({ duration: 1000 }));
    act(() => result.current.onPlay());
    expect(result.current.playing).toBe(true);
  });

  it("onReset returns to playhead=0 playing=false", () => {
    const { result } = renderHook(() => useDemoPlayhead({ duration: 1000 }));
    act(() => {
      result.current.onPlay();
      result.current.onReset();
    });
    expect(result.current.playhead).toBe(0);
    expect(result.current.playing).toBe(false);
  });

  it("onStep nudges playhead forward by the configured step (default 0.1)", () => {
    const { result } = renderHook(() => useDemoPlayhead({ duration: 1000 }));
    act(() => result.current.onStep());
    expect(result.current.playhead).toBeCloseTo(0.1);
  });
});
```

- [ ] **Step 3: Implement `useDemoPlayhead`**

```ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface DemoPlayhead {
  playhead: number;       // 0..1
  playing: boolean;
  onPlay: () => void;     // toggles play/pause
  onReset: () => void;
  onStep: () => void;     // nudge forward by `step`
}

export function useDemoPlayhead(opts: {
  duration: number;       // ms for a full 0→1 sweep
  step?: number;          // fraction to advance per onStep (default 0.1)
  loop?: boolean;         // continue past 1.0 by resetting to 0 (default true)
  pauseAtEnd?: number;    // ms to hold at 1.0 before loop (default 1500)
}): DemoPlayhead {
  const step = opts.step ?? 0.1;
  const loop = opts.loop ?? true;
  const pauseAtEnd = opts.pauseAtEnd ?? 1500;
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const startedAt = useRef<number | null>(null);
  const holdUntil = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  const frame = useCallback((now: number) => {
    if (holdUntil.current !== null) {
      if (now >= holdUntil.current) {
        holdUntil.current = null;
        startedAt.current = now;
        setPlayhead(0);
      }
    } else {
      const elapsed = now - (startedAt.current ?? now);
      const t = Math.min(1, elapsed / opts.duration);
      setPlayhead(t);
      if (t >= 1) {
        if (loop) holdUntil.current = now + pauseAtEnd;
        else setPlaying(false);
      }
    }
    raf.current = requestAnimationFrame(frame);
  }, [loop, pauseAtEnd, opts.duration]);

  useEffect(() => {
    if (!playing) return;
    startedAt.current = performance.now();
    holdUntil.current = null;
    raf.current = requestAnimationFrame(frame);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); };
  }, [playing, frame]);

  const onPlay = useCallback(() => setPlaying((p) => !p), []);
  const onReset = useCallback(() => {
    setPlaying(false);
    setPlayhead(0);
    holdUntil.current = null;
  }, []);
  const onStep = useCallback(() => {
    setPlayhead((p) => Math.min(1, p + step));
  }, [step]);

  return { playhead, playing, onPlay, onReset, onStep };
}
```

- [ ] **Step 4: Run hook tests — 4 passing.**

- [ ] **Step 5: Write dispatcher-routing test**

```tsx
// src/__tests__/claude-dispatcher-ready-routing.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("@/features/claude/tiles", () => ({
  tileBodies: {
    chat: () => <div data-testid="real-chat">real chat body</div>,
  },
}));

import ClaudeFeaturePage from "@/app/claude/[feature]/page";
import { tiles } from "@/features/claude/registry";

describe("/claude/[feature] dispatcher routing", () => {
  it("renders real tile body when status is ready", async () => {
    // Monkey-patch registry for this test — flip chat's status to "ready".
    const original = tiles.find((t) => t.slug === "chat")!.status;
    tiles.find((t) => t.slug === "chat")!.status = "ready";
    try {
      const node = await ClaudeFeaturePage({
        params: Promise.resolve({ feature: "chat" }),
      });
      render(node);
      expect(screen.getByTestId("real-chat")).toBeInTheDocument();
    } finally {
      tiles.find((t) => t.slug === "chat")!.status = original;
    }
  });
});
```

- [ ] **Step 6: Create `src/features/claude/tiles/index.ts`**

```ts
import type { ComponentType } from "react";

/** Slug → lazy body component. Populated per task as tiles ship. */
export const tileBodies: Record<string, ComponentType> = {
  // Task 1 will add: chat: dynamic(() => import("./chat"))
  // ...etc
};
```

- [ ] **Step 7: Modify `src/app/claude/[feature]/page.tsx`**

Replace:

```tsx
  if (!tile) notFound();
  return <TilePlaceholder tile={tile} />;
```

With:

```tsx
  if (!tile) notFound();
  const Body = tile.status === "ready" ? tileBodies[tile.slug] : undefined;
  return Body ? <Body /> : <TilePlaceholder tile={tile} />;
```

Add import: `import { tileBodies } from "@/features/claude/tiles";`

- [ ] **Step 8: Run dispatcher test — 1 passing (+ keep Phase 1's 3 tests passing).**

- [ ] **Step 9: Commit**

```bash
git add src/features/claude/useDemoPlayhead.ts \
        src/features/claude/tiles/index.ts \
        src/app/claude/[feature]/page.tsx \
        src/__tests__/claude-use-demo-playhead.test.tsx \
        src/__tests__/claude-dispatcher-ready-routing.test.tsx
git commit -m "feat(claude): add useDemoPlayhead hook + dispatcher routing for ready tiles"
```

- [ ] **Step 10: No content audit for Task 0** — this is pure infrastructure, no user-visible content. Skip audit; go straight to code quality review.

---

## Task 1: `chat` tile — response streaming demo

**One-sentence answer:** Claude trả lời theo từng token, hiện lên thời gian thực — không phải chờ cả câu rồi mới xuất hiện cùng lúc.

**Docs to fetch (implementer + auditor):**
- https://claude.com/product/overview (section on "Conversation" / chat)
- Any mention of streaming / SSE behavior on `docs.claude.com`

**Files:**
- Create: `src/features/claude/tiles/chat.tsx`
- Modify: `src/features/claude/tiles/index.ts` — add `chat` entry via `dynamic()`
- Modify: `src/features/claude/registry.ts` — flip `chat.status` to `"ready"`
- Test: `src/__tests__/claude-tile-chat.test.tsx`

**Demo design:**

- Shell contents:
  - Top bar: model pill ("Claude Sonnet 4.7"), "+ New chat" button placeholder, settings icon.
  - Left rail: 3–5 mock past-chat entries in Vietnamese (e.g. "Viết email gửi khách hàng", "Giải thích machine learning cho mẹ").
  - Main: one user message bubble ("Giải thích cơ bản về mạng nơ-ron cho học sinh cấp 2"), then a Claude bubble that streams token-by-token as the playhead advances.
  - ShellComposerStub at the bottom with the placeholder "Nhập tiếp theo..."

- Playhead timing (0..1 over 8000ms):
  - `0.00–0.05` — user hits Enter, their bubble appears immediately.
  - `0.05–0.85` — Claude bubble streams ~120 Vietnamese characters at ~7 chars/frame.
  - `0.85–1.00` — streaming complete; "stop" icon in composer becomes "send" icon again.

- Annotations (4 pins):
  1. At `showAt: [0.00, 0.12]`, anchor near the user bubble — label "Bạn gõ xong, Enter → câu hỏi lên ngay.", description "Câu hỏi xuất hiện tức thì ở cột chat."
  2. At `showAt: [0.10, 0.50]`, anchor near first streamed tokens — label "Claude bắt đầu phản hồi theo từng token.", description "Mỗi token (~1–2 ký tự) được gửi về trình duyệt ngay khi mô hình sinh ra — không chờ toàn bộ câu."
  3. At `showAt: [0.50, 0.85]`, anchor mid-bubble — label "Nút 'Dừng' trong composer.", description "Bạn có thể bấm Dừng giữa chừng nếu Claude đang trả lời dài dòng hoặc lạc đề."
  4. At `showAt: [0.85, 1.00]`, anchor near final token — label "Hoàn tất: composer trở về trạng thái 'Gửi'.", description "Icon chuyển từ Dừng (vuông) sang Gửi (mũi tên) — sẵn sàng cho lượt tiếp."

- Still frames (3):
  - Frame A at `t=0.05` — "Câu hỏi vào, chờ phản hồi" / Vietnamese explanation ~2 sentences.
  - Frame B at `t=0.50` — "Token chảy từng chữ" / ~2 sentences.
  - Frame C at `t=1.00` — "Kết thúc lượt" / ~2 sentences.

- DeepLinkCTA prompt:
  - `"Giải thích ngắn về streaming response trong LLM cho người mới, bằng ví dụ thực tế."`
  - Rationale: when the user clicks, they land in a fresh Claude.ai chat and see the feature demonstrated on themselves.

- Cross-links: Artifacts (side panel), Voice Mode, Projects.

**Tests (5):**

```tsx
// src/__tests__/claude-tile-chat.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatTile from "@/features/claude/tiles/chat";

vi.mock("framer-motion", { spy: true });

describe("chat tile", () => {
  it("renders the tile H1 with the viTitle from the registry", () => {
    render(<ChatTile />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Chat \+ phản hồi trực tiếp/ })
    ).toBeInTheDocument();
  });

  it("renders a DemoCanvas region with the tile title", () => {
    render(<ChatTile />);
    expect(
      screen.getByRole("region", { name: /Chat \+ phản hồi trực tiếp/i })
    ).toBeInTheDocument();
  });

  it("renders a ClaudeDesktopShell via its figure role", () => {
    render(<ChatTile />);
    expect(
      screen.getByRole("figure", { name: /Bản mô phỏng giao diện Claude Desktop/ })
    ).toBeInTheDocument();
  });

  it("renders a DeepLinkCTA pointing to claude.ai/new with an encoded prompt", () => {
    render(<ChatTile />);
    const cta = screen.getByRole("link", { name: /Thử trong Claude/i });
    expect(cta.getAttribute("href")).toMatch(/^https:\/\/claude\.ai\/new\?q=/);
  });

  it("renders cross-links to sibling tiles", () => {
    render(<ChatTile />);
    const crossLinks = screen
      .getAllByRole("link")
      .filter((l) => (l.getAttribute("href") ?? "").startsWith("/claude/"));
    expect(crossLinks.length).toBeGreaterThanOrEqual(2);
  });
});
```

**Steps:** (TDD cycle identical to Phase 1 tasks — write tests, implement, verify, commit)

- [ ] **Step 1: Context7 + WebFetch** — implementer fetches the docs URLs above and pastes the 2–3 most relevant quotes into a comment at the top of `chat.tsx`.
- [ ] **Step 2: Write failing tests.**
- [ ] **Step 3: Create `src/features/claude/tiles/chat.tsx`** following the Per-tile standard template (section above).
- [ ] **Step 4: Wire into `tiles/index.ts`**
  ```ts
  import dynamic from "next/dynamic";
  export const tileBodies: Record<string, ComponentType> = {
    chat: dynamic(() => import("./chat")),
  };
  ```
- [ ] **Step 5: Flip `chat.status` to `"ready"` in `registry.ts`.**
- [ ] **Step 6: Run all tests.**
- [ ] **Step 7: Commit:**
  ```bash
  git commit -m "feat(claude): ship chat tile — streaming response demo"
  ```

**Content audit (mandatory):** After implementer reports DONE, dispatch content expert with:
- Checklist: shell chrome matches claude.ai/new (model pill text correct? left rail format realistic? composer copy current?).
- Vietnamese copy read aloud — any clunky phrasing?
- Claim fidelity: is "token = 1–2 ký tự" accurate? (Claude uses BPE tokens that roughly map to syllable fragments, so 1–2 ký tự is reasonable for Vietnamese but should be qualified in the annotation description as "~1–2 ký tự trung bình").
- Deep-link prompt: does clicking actually produce a useful Claude response? Auditor opens the URL in a new tab and confirms.

---

## Task 2: `projects` tile — persistent workspace

**One-sentence answer:** Projects là không gian làm việc riêng của bạn — instructions, files, memory gắn liền với một chủ đề, Claude tự động nhớ khi bạn quay lại.

**Docs to fetch:**
- https://claude.com/product/overview (Projects section)
- https://docs.claude.com/en/docs/claude-code/projects (or whichever /docs path is current)

**Files:**
- Create: `src/features/claude/tiles/projects.tsx`
- Modify: `src/features/claude/tiles/index.ts`
- Modify: `src/features/claude/registry.ts` (flip status)
- Test: `src/__tests__/claude-tile-projects.test.tsx`

**Demo design:**

- Shell: left rail shows **Projects** section expanded, with 3 mock projects: "Báo cáo tài chính quý 3", "Luận văn thạc sĩ", "Kế hoạch du lịch Nhật Bản". "Báo cáo tài chính quý 3" is active/highlighted.
- Main column: above the messages, a small "Project header" strip shows the project name + a collapsible "Instructions" region + a "Files (4)" chip.
- Conversation: user asks "Tóm tắt chương 3 trong file PDF", Claude responds referencing *specific filename* — illustrating project-scoped context.
- Annotations (4): left rail project switch, project header strip, files chip, Claude's filename citation.
- Playhead 6000ms. Still frames at t=0, 0.5, 1.
- DeepLinkCTA: prompt seeds a project-friendly request like `"Mình đang xây Projects trong Claude — gợi ý 3 cách tổ chức Instructions để đội marketing dùng chung."`
- Cross-links: Chat, Files & Vision, Memory (Shelf 2 tile, status still planned — link goes to placeholder).

**Steps, tests, commit message:** follow the standard template. Content audit must verify the rail layout matches the real Projects UI (as of 2026-04-18).

---

## Task 3: `artifacts` tile — right-panel output

**One-sentence answer:** Artifacts là panel bên phải — nơi Claude xuất mã, tài liệu, ứng dụng React chạy được, tách bạch với luồng chat.

**Docs:**
- https://claude.com/product/overview (Artifacts section)
- https://docs.claude.com/en/docs/claude-code/artifacts (if exists)

**Files:** `tiles/artifacts.tsx`, index, registry, test.

**Demo design:**
- Shell with `artifactsPanel` slot populated (the first tile to use the optional third pane).
- User asks: "Viết cho mình một component React đếm ngược 10 giây."
- Claude's chat bubble says a one-line preamble, then the main content (the actual code + live preview) materializes in the right panel.
- Artifacts panel shows 3 tabs (visible in the real app): **Preview**, **Code**, **Versions**. Preview shows a live countdown counter. Code shows syntax-highlighted JSX (use a small scripted highlight; don't pull a real Shiki/Prism dep).
- Annotations (5): bubble preamble, panel opens from right, tabs strip, preview is interactive, download/copy icons.
- Playhead 9000ms.
- DeepLinkCTA: `"Làm cho mình một mini-app to-do list trong Claude Artifacts, dùng React."`
- Cross-links: Chat, Claude Design, Claude Code.

---

## Task 4: `files-vision` tile — PDF / image / spreadsheet

**One-sentence answer:** Thả PDF, ảnh, hoặc bảng tính vào Claude — nó đọc được và trả lời về nội dung, không chỉ tên file.

**Docs:**
- https://claude.com/product/overview (Files + Vision sections)
- https://docs.claude.com/en/docs/build-with-claude/vision
- https://docs.claude.com/en/docs/build-with-claude/pdf-support

**Demo design:**
- Shell composer area shows a drag-target state briefly, then a PDF thumbnail + image thumbnail attached as chips above the text input.
- User types "So sánh doanh thu Q2 và Q3 từ báo cáo này", Claude responds with a numeric comparison quoting specific values — illustrating OCR/text-extraction.
- A second sub-demo below the main shell: a small image with bounding boxes drawn over detected objects (Vision).
- Annotations (5): drop zone, attachment chips, Claude's quoted values, bounding-box overlay, caveat ("không phải OCR hoàn hảo — hình chữ viết tay có thể sai").
- DeepLinkCTA (doc variant since file upload isn't pre-seedable in URL): `<DeepLinkCTA docHref="https://docs.claude.com/en/docs/build-with-claude/pdf-support" label="Mở tài liệu Files + Vision" />`.

---

## Task 5: `voice` tile — Voice Mode

**One-sentence answer:** Nhấn micrô, nói chuyện với Claude như với bạn — nó nghe, suy luận, rồi đọc lại bằng giọng tự nhiên.

**Docs:**
- https://claude.com/product/overview (Voice section, if present)
- Search `docs.claude.com` for voice / audio.

**Demo design:**
- Shell with an overlay that appears when voice mode is active: full-width waveform visualization at bottom, live transcript in center, "Stop / Cancel" pill at bottom.
- Script: user says 4 words → transcript appears word-by-word → Claude responds with its own transcript + waveform.
- Waveform: 24 bars with animated heights driven by the playhead (sine * random wiggle).
- Annotations (4): mic button, live transcript, Claude's spoken answer, stop button.
- Playhead 7000ms.
- DeepLinkCTA (doc variant): `<DeepLinkCTA docHref="..." label="Bật Voice Mode trong Claude" />`.

---

## Task 6: `web-search` tile — fresh info + citations

**One-sentence answer:** Claude có thể tra web để lấy thông tin mới nhất — mỗi câu trả lời kèm link nguồn để bạn kiểm chứng.

**Docs:**
- https://claude.com/product/overview
- https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool

**Demo design:**
- User asks something time-sensitive: "Giá bitcoin hôm nay là bao nhiêu?" → Claude response shows a small "🔎 Đang tìm web..." indicator, then resolves with a specific number and **two citation chips** below the message (domain name + favicon stub).
- Annotations (4): search indicator, citations row, hover on citation shows URL preview tooltip, "no live web = no answer" caveat.
- DeepLinkCTA: `"Tin nào trong tuần này đáng chú ý nhất với người làm công nghệ ở Việt Nam? Cho mình 3 gạch đầu dòng có trích dẫn."`

---

## Task 7: `claude-design` tile — Anthropic Labs product (NEW)

**One-sentence answer:** Claude Design là sản phẩm mới của Anthropic Labs (ra mắt 17/4/2026) — tạo slide, prototype, one-pager bằng cách mô tả bằng tiếng Việt.

**Docs:**
- https://www.anthropic.com/news (search for "Claude Design" / April 17 2026 announcement)
- https://claude.com/labs/design or similar

**Demo design:**
- Dedicated sub-shell `ClaudeLabsShell` — different chrome (Labs logo, "Beta" tag).
- Main: prompt bar + a gallery of 4 generated slides previewed as a horizontal carousel.
- Demo flow: prompt "Slide giới thiệu công ty startup làm AI giáo dục" → 4 slide thumbnails pop in one-by-one.
- Annotations (4): Labs header, prompt input, slide thumbnails animate in, export/share row.
- "Mới · 17/4/2026" badge at top per spec §12.
- DeepLinkCTA (doc variant → Labs page): `<DeepLinkCTA docHref="..." label="Thử Claude Design" />`.

**New primitive:** `src/features/claude/components/ClaudeLabsShell.tsx` — smaller-chrome variant, Labs-branded. Build it as part of this task (sized down from `ClaudeDesktopShell`, reuse same token system).

---

## Task 8: `chrome` tile — Claude for Chrome extension

**One-sentence answer:** Claude for Chrome là tiện ích trình duyệt — Claude đọc trang web bạn đang xem và trả lời về nội dung đó, không cần copy-paste.

**Docs:**
- https://chromewebstore.google.com/detail/claude (or equivalent listing)
- https://claude.com/product (Chrome section)

**Demo design:**
- Sub-shell `ClaudeChromeShell` — mocks a Chrome window with an address bar showing "vnexpress.net/..." and a right-side overlay panel with Claude inside.
- User clicks the extension icon, sidebar slides in from the right, user asks "Tóm tắt bài báo này cho mình." → Claude answers referencing specific paragraphs.
- Annotations (4): address bar (shows the page), extension icon in toolbar, sidebar slide-in, Claude's paragraph-specific response.
- DeepLinkCTA (doc variant → Chrome store): `<DeepLinkCTA docHref="..." label="Cài Claude for Chrome" />`.

**New primitive:** `src/features/claude/components/ClaudeChromeShell.tsx`.

---

## After all 8 tiles land

- [ ] **Integration smoke:** `pnpm build` — confirm all 24 routes still SSG (no tile accidentally went dynamic). Confirm `/claude/chat`, `/claude/projects`, etc. render the real body (not placeholder).
- [ ] **Full test suite:** expect +50+ new passing tests. Pre-existing 2 failures unchanged.
- [ ] **Ship per AGENTS.md rule:** `git push origin main` + `vercel deploy --prod --yes` + curl each of the 8 new tile URLs (200 + grep for tile title).
- [ ] **Append completion notes to this plan** (commits, LOC, coverage gaps, Phase 3 follow-ups).

## Budget & stop conditions

- **LOC ceiling for Phase 2:** ~3500. If we cross 4500 LOC, stop and re-scope.
- **Content audit iteration bound:** 3 rounds per tile. If a tile hits 3 and still fails audit, escalate to human and do NOT ship that tile — flip it back to `"planned"` so the dispatcher shows the placeholder, ship the rest.
- **Unknown doc hits:** if an auditor or implementer cannot find an Anthropic doc for a feature (e.g. Voice Mode might not have a public doc yet), the tile must EITHER (a) caveat its claims in Vietnamese ("Theo hiểu biết hiện tại của Anthropic, tính năng này...") OR (b) be deferred to Phase 3 with explicit `status: "planned"` kept.

## Non-goals in Phase 2

- Real API calls from any demo. Everything scripted.
- Audio playback in the voice tile. Pure visual.
- Actual Artifact code execution. Mock the live-preview.
- Mobile-specific tile treatments. Desktop+md+ is the target.
