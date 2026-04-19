"use client";

/**
 * Claude Design (Anthropic Labs) tile — mô tả sản phẩm, người dùng mô
 * tả, Claude dựng visual đầu tiên, rồi tinh chỉnh bằng chat / comment /
 * direct edit / sliders. Hero hiển thị một phiên Claude Design đang
 * dựng prototype app thiền di động — đúng ví dụ mà Anthropic đưa ra
 * trong thông báo ra mắt.
 *
 * ---------------------------------------------------------------------------
 * DOCS GROUNDING (Anthropic sources, snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * Source (primary, canonical — announcement post):
 *   https://www.anthropic.com/news/claude-design-anthropic-labs
 *   Fetched: 2026-04-19.
 *
 *   Verbatim quotes captured today (via WebFetch summary of the post):
 *   > "A new Anthropic Labs product that lets you collaborate with
 *   >  Claude to create polished visual work like designs, prototypes,
 *   >  slides, one-pagers, and more."
 *   > "Start designing at claude.ai/design."
 *   > Workflow: "Describe what you need and Claude builds a first
 *   >  version. From there, you refine through conversation, inline
 *   >  comments, direct edits, or custom sliders (made by Claude)
 *   >  until it's right."
 *   > "During onboarding, Claude builds a design system for your team
 *   >  by reading your codebase and design files. Every project after
 *   >  that uses your colors, typography, and components automatically."
 *   > Exports: "Designs can be shared as an internal URL within your
 *   >  organization, saved as a folder, or exported to Canva, PDF,
 *   >  PPTX, or standalone HTML files."
 *   > "When a design is ready to build, Claude packages everything
 *   >  into a handoff bundle that you can pass to Claude Code with a
 *   >  single instruction."
 *   > Model: "Powered by Anthropic's most capable vision model, Claude
 *   >  Opus 4.7."
 *   > Availability: "Available in research preview for Claude Pro,
 *   >  Max, Team, and Enterprise subscribers." Enterprise: "off by
 *   >  default" with admin enablement required.
 *
 * Source (secondary — TechCrunch, 2026-04-17):
 *   https://techcrunch.com/2026/04/17/anthropic-launches-claude-design-a-new-product-for-creating-quick-visuals/
 *   Fetched: 2026-04-19.
 *
 *   Verbatim example use-case captured:
 *   > "Prototype a serene mobile meditation app… tweak the colors,
 *   >  the size of the typography, or ask Claude to add a dark mode
 *   >  toggle."
 *   This is the exact example the hero demo mirrors, so the tile
 *   doesn't invent a fictional use case.
 *
 * Surface: Claude Design is a Labs / research-preview product with
 * its own URL (claude.ai/design) and its own chrome — narrower top
 * bar, canvas-first body, no conversation rail. That's why this tile
 * uses `ClaudeLabsShell` rather than `ClaudeDesktopShell`.
 *
 * ---------------------------------------------------------------------------
 * CONTEXT7 FINDINGS (snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * next.js v16.2.2 (/vercel/next.js/v16.2.2, closest pinned version to the
 *   installed v16.2.3): `next/dynamic` with a static `() => import("./X")`
 *   is the supported pattern — the import path must be a string literal
 *   so the bundler can match bundles. This tile is registered from
 *   `tiles/index.ts` as `dynamic(() => import("./claude-design"))`
 *   following the convention of every Phase-2 tile before it.
 *   (docs/01-app/02-guides/lazy-loading.mdx)
 *
 * framer-motion (/grx7/framer-motion): no direct motion.* usage in this
 *   tile — AnnotationLayer owns all motion (AnimatePresence + pulse).
 *   Confirmed via Context7 that Framer Motion's orchestration (delay /
 *   staggerChildren) is supported, but the tile doesn't need per-element
 *   stagger because the playhead-driven reveal already produces visual
 *   rhythm through annotation showAt windows.
 *
 * react v19.2.0 (/facebook/react/v19_2_0): `memo` wraps static chrome
 *   components (top bar, prompt-stream, canvas preview) so they don't
 *   re-render on DemoCanvas playhead ticks. Same discipline as every
 *   Phase-2 tile before it.
 */

import { memo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  MessageSquare,
  Sparkles,
  Sliders,
  Share2,
  Moon,
  Play,
} from "lucide-react";

import {
  ClaudeLabsShell,
  LabsBetaChip,
} from "@/features/claude/components/ClaudeLabsShell";
import { AnnotationLayer } from "@/features/claude/components/AnnotationLayer";
import { DemoCanvas } from "@/features/claude/components/DemoCanvas";
import { DeepLinkCTA } from "@/features/claude/components/DeepLinkCTA";
import { ViewRealUI } from "@/features/claude/components/ViewRealUI";
import {
  CropCard,
  CropAnnotation,
} from "@/features/claude/components/crop-primitives";
import { useDemoPlayhead } from "@/features/claude/useDemoPlayhead";
import { findTile } from "@/features/claude/registry";
import type { Annotation } from "@/features/claude/types";

// ---------------------------------------------------------------------------
// Constants — all user-visible copy + content in one place
// ---------------------------------------------------------------------------

const ONE_LINER =
  "Claude Design (Anthropic Labs, research preview) cho bạn mô tả bằng lời — Claude dựng ngay bản thiết kế đầu tiên (slide, prototype, one-pager), rồi tinh chỉnh qua chat, bình luận trực tiếp, sửa tay, hoặc thanh điều chỉnh.";

// Canonical announcement post for the Labs product — URL slug verified
// against anthropic.com/news on 2026-04-19.
const DESIGN_ANNOUNCEMENT_HREF =
  "https://www.anthropic.com/news/claude-design-anthropic-labs";

// The product URL users navigate to. Per the announcement: "Start
// designing at claude.ai/design." Captured 2026-04-19.
const DESIGN_APP_URL = "https://claude.ai/design";

// The exact example use-case Anthropic / TechCrunch cite — "prototype
// a serene mobile meditation app" plus refinements (dark-mode toggle,
// typography size). We mirror it verbatim so the hero is grounded in
// Anthropic's own messaging, not a fabricated prompt.
const USER_PROMPT =
  "Dựng prototype một ứng dụng thiền di động — cảm giác tĩnh, màu xanh bạc hà, phông chữ tròn nhẹ.";

const USER_REFINE_1 = "Thêm nút bật chế độ tối.";
const USER_REFINE_2 = "Cho chữ tiêu đề lớn hơn một chút.";

// The fabricated Claude response framing — mirrors how the real product
// narrates ("I've created a first pass…"). We keep it neutral + short.
const CLAUDE_INTRO = "Mình đã dựng bản đầu — ba màn hình chính, dùng tông bạc hà dịu.";

const PROJECT_TITLE = "Prototype: Ứng dụng thiền di động";

// ---------------------------------------------------------------------------
// Annotations (4 pins) — anchors are percent of the LABS shell
// ---------------------------------------------------------------------------
//
// Labs-shell calibration notes (2026-04-19):
//   - ClaudeLabsShell: 3px beta strip + 36px top bar + body.
//   - Body is split into two columns in the hero: left (≈34%) = chat/
//     prompt pane; right (≈66%) = canvas preview with three phone
//     thumbnails.
//   - Pin 1 (user prompt row in chat pane, where user describes the
//     feature) → x:18, y:22.
//   - Pin 2 (canvas preview — phone thumbnails showing the first pass)
//     → x:62, y:42.
//   - Pin 3 (sliders strip — custom knobs Claude makes for tweaking
//     colors / typography / radius) → x:62, y:78.
//   - Pin 4 (export / handoff button in top-right area) → x:88, y:14.
//
const ANNOTATIONS: Annotation[] = [
  {
    id: "describe",
    pin: 1,
    label: "Mô tả bằng lời — Claude dựng bản đầu",
    description:
      "Bạn mô tả thiết kế cần có bằng tiếng Việt hoặc tiếng Anh trong ô chat bên trái. Claude dựng bản đầu tiên ngay trên canvas — đúng như Anthropic mô tả trong thông báo ra mắt 17/4/2026.",
    showAt: [0.0, 0.55],
    anchor: { x: 18, y: 22 },
  },
  {
    id: "canvas",
    pin: 2,
    label: "Canvas hiện ra phiên bản đầu tiên",
    description:
      "Claude Design không chỉ trả lời bằng chữ — sản phẩm hiện ra trực tiếp trên canvas bên phải. Với prototype app, Claude dựng các màn hình chính ở dạng có thể bấm thử.",
    showAt: [0.0, 0.55],
    anchor: { x: 62, y: 42 },
  },
  {
    id: "sliders",
    pin: 3,
    label: "Thanh điều chỉnh do Claude tự làm",
    description:
      "Khi cần tinh chỉnh — màu sắc, cỡ chữ, bán kính bo góc — Claude tạo các thanh trượt tùy chỉnh ngay trong phiên, để bạn kéo thay vì phải gõ lại prompt. Anthropic gọi đây là 'custom sliders (made by Claude)'.",
    showAt: [0.5, 1.0],
    anchor: { x: 62, y: 78 },
  },
  {
    id: "handoff",
    pin: 4,
    label: "Xuất / chuyển giao qua Claude Code",
    description:
      "Xong thiết kế: xuất PDF / PPTX / HTML / Canva, chia sẻ URL nội bộ trong tổ chức, hoặc đóng gói thành handoff bundle rồi chuyển sang Claude Code để build — theo nguyên văn thông báo của Anthropic.",
    showAt: [0.5, 1.0],
    anchor: { x: 88, y: 14 },
  },
];

const CROSS_LINKS: Array<{ href: string; title: string; blurb: string }> = [
  {
    href: "/claude/artifacts",
    title: "Artifacts",
    blurb:
      "Artifacts là khung xem-bên-trong-chat cho code/doc/app. Claude Design là sản phẩm Labs riêng — mở rộng ý tưởng Artifacts sang thiết kế đồ hoạ, có canvas, comment, slider chuyên cho visual.",
  },
  {
    href: "/claude/chat",
    title: "Chat + phản hồi trực tiếp",
    blurb:
      "Ô chat bên trái Claude Design dùng đúng mô hình streaming bạn đã quen từ chat thường — chỉ khác đầu ra: thay vì văn bản, Claude dựng visual trên canvas bên phải.",
  },
  {
    href: "/claude/files-vision",
    title: "Files & Vision",
    blurb:
      "Claude Design đọc file ảnh, PDF, DOCX, PPTX, XLSX bạn thả vào — cùng nền tảng vision model Opus 4.7 mà Files & Vision dùng để đọc tài liệu bạn đưa lên.",
  },
];

// ---------------------------------------------------------------------------
// Hero top bar — project title + Labs · Beta chip + Share / handoff
// ---------------------------------------------------------------------------

const DesignTopBar = memo(function DesignTopBar() {
  return (
    <div className="flex w-full items-center gap-2">
      {/* Project title chip — narrower than desktop chrome since the
          top bar itself is 36px. Reads "[project name] · Mô phỏng". */}
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-[var(--pure-white,#FFFFFF)] px-2 py-0.5 text-[11px] text-foreground">
        {PROJECT_TITLE}
        <ChevronDown size={11} strokeWidth={2} aria-hidden="true" />
      </span>
      <LabsBetaChip />
      {/* Right-aligned controls — Share (handoff) button anchors pin #4. */}
      <span
        aria-label="Chia sẻ / chuyển giao"
        role="img"
        className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-[var(--pure-white,#FFFFFF)] px-2 py-0.5 text-[11px] text-foreground"
      >
        <Share2 size={11} strokeWidth={2} aria-hidden="true" />
        Xuất
      </span>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Chat pane (left column) — user prompts + Claude "đã dựng" intro
// ---------------------------------------------------------------------------

const ChatPane = memo(function ChatPane() {
  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      <div className="px-1 pb-1 text-[9px] font-mono uppercase tracking-[0.08em] text-tertiary">
        Hội thoại thiết kế
      </div>
      {/* User's initial brief — pin 1 anchors on this bubble */}
      <div
        className="ml-auto max-w-[95%] rounded-[10px] bg-foreground px-3 py-2 text-[12px] leading-[1.5] text-background"
      >
        {USER_PROMPT}
      </div>
      {/* Claude's intro — kept short; the actual product lives on the canvas */}
      <div
        className="max-w-[95%] rounded-[10px] bg-[var(--pure-white,#FFFFFF)] px-3 py-2 text-[12px] leading-[1.5] text-foreground"
        style={{ border: "1px solid var(--border)" }}
      >
        <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.06em] text-tertiary">
          <Sparkles size={10} strokeWidth={1.8} aria-hidden="true" />
          Claude
        </span>
        <div>{CLAUDE_INTRO}</div>
      </div>
      {/* Two refinement prompts — these map to the "refine through
          conversation" + "direct edits" flow Anthropic describes. */}
      <div className="ml-auto max-w-[95%] rounded-[10px] bg-foreground/90 px-3 py-1.5 text-[11px] leading-[1.45] text-background">
        {USER_REFINE_1}
      </div>
      <div className="ml-auto max-w-[95%] rounded-[10px] bg-foreground/90 px-3 py-1.5 text-[11px] leading-[1.45] text-background">
        {USER_REFINE_2}
      </div>
      <div
        className="mt-auto flex items-center gap-2 rounded-[10px] border border-border bg-[var(--pure-white,#FFFFFF)] px-2.5 py-1.5 text-[11px] text-tertiary"
      >
        <MessageSquare size={12} strokeWidth={1.8} aria-hidden="true" />
        Nói tiếp: &ldquo;sửa màu, thêm màn hình…&rdquo;
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Canvas preview (right column) — three phone mockups of the meditation app
// ---------------------------------------------------------------------------
//
// We render three small phone silhouettes with mint-green tints + rounded
// glyphs (breathing circle, play button, moon). These aren't real Figma
// frames — they're abstracted phone-screen thumbnails readable at small
// size. The three screens mirror the typical onboarding → breathe → rest
// structure of a meditation app, so the preview reads as "first pass of
// a prototype" rather than placeholder boxes.

const MINT = "#C9E4DA";
const MINT_INK = "#2E5E5A";
const INK_DARK = "#141413";

interface PhonePreviewProps {
  /** "light" phones use mint background; the right-most one is dark-mode. */
  tone: "light" | "dark";
  /** The glyph drawn inside — a breathing ring, a play button, or a moon. */
  glyph: "breathe" | "play" | "moon";
  label: string;
}

function PhonePreview({ tone, glyph, label }: PhonePreviewProps) {
  const bg = tone === "light" ? MINT : INK_DARK;
  const ink = tone === "light" ? MINT_INK : "#C9E4DA";
  const border = tone === "light" ? "rgba(19,52,59,0.15)" : "rgba(255,255,255,0.10)";
  return (
    <div
      className="flex flex-col items-center gap-1"
      role="img"
      aria-label={`Màn hình mẫu: ${label}`}
    >
      <div
        className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{
          width: 96,
          height: 180,
          borderRadius: 18,
          background: bg,
          border: `1px solid ${border}`,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Tiny status bar strip for "this is a phone screen" legibility. */}
        <span
          aria-hidden="true"
          className="absolute left-3 right-3 top-2 flex items-center justify-between text-[7px] font-mono"
          style={{ color: ink, opacity: 0.65 }}
        >
          <span>9:41</span>
          <span>{tone === "dark" ? "🌙" : "☀"}</span>
        </span>
        {/* Glyph */}
        <div className="flex flex-1 items-center justify-center">
          {glyph === "breathe" ? (
            <span
              aria-hidden="true"
              className="block rounded-full"
              style={{
                width: 52,
                height: 52,
                border: `2px solid ${ink}`,
                background: tone === "light" ? "rgba(255,255,255,0.6)" : "rgba(201,228,218,0.08)",
              }}
            />
          ) : glyph === "play" ? (
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: ink, color: bg }}
            >
              <Play size={16} strokeWidth={2.2} />
            </span>
          ) : (
            <span aria-hidden="true" style={{ color: ink }}>
              <Moon size={36} strokeWidth={1.6} />
            </span>
          )}
        </div>
        {/* Label row at the bottom of the screen */}
        <div
          className="w-full px-2 pb-2 text-center text-[9px] font-medium"
          style={{ color: ink }}
        >
          {label}
        </div>
      </div>
      {/* Thumb caption — a breadcrumb showing which screen this is */}
      <span className="text-[9px] font-mono uppercase tracking-[0.06em] text-tertiary">
        {label}
      </span>
    </div>
  );
}

interface SliderStripProps {
  label: string;
  /** 0..1 — visual position of the thumb on the track. */
  value: number;
  unit?: string;
}

function SliderStrip({ label, value, unit }: SliderStripProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[72px] text-[10px] font-mono uppercase tracking-[0.06em] text-tertiary">
        {label}
      </span>
      <div
        className="relative h-1.5 flex-1 rounded-full"
        style={{ background: "rgba(19,52,59,0.10)" }}
        role="img"
        aria-label={`Thanh điều chỉnh ${label}`}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${Math.round(value * 100)}%`,
            background: "var(--turquoise-ink, #13343B)",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground bg-[var(--pure-white,#FFFFFF)]"
          style={{ left: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="w-[56px] text-right text-[10px] text-foreground font-mono">
        {unit ?? `${Math.round(value * 100)}%`}
      </span>
    </div>
  );
}

const CanvasPreview = memo(function CanvasPreview() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden border-l border-border p-4">
      {/* Canvas title — echoes Figma-style breadcrumb */}
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.08em] text-tertiary">
        <span>Canvas · 3 màn hình</span>
        <span>100%</span>
      </div>

      {/* Phone thumbnails row — three screens, last one is the dark-mode
          toggle the user asked for. This is the "generated prototype"
          that pin #2 anchors on. */}
      <div className="flex items-start justify-center gap-4 rounded-[12px] border border-border bg-[var(--pure-white,#FFFFFF)] p-4">
        <PhonePreview tone="light" glyph="breathe" label="Thở" />
        <PhonePreview tone="light" glyph="play" label="Bài thiền" />
        <PhonePreview tone="dark" glyph="moon" label="Chế độ tối" />
      </div>

      {/* Sliders — custom knobs Claude makes for tweaking the design.
          This is the "custom sliders (made by Claude)" feature anchored
          by pin #3. Three knobs because the user asked for mint color
          + rounded font + larger title — each one maps visually. */}
      <div className="flex flex-col gap-2 rounded-[12px] border border-border bg-[var(--pure-white,#FFFFFF)] px-4 py-3">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-tertiary">
          <Sliders size={11} strokeWidth={1.8} aria-hidden="true" />
          Thanh điều chỉnh
        </div>
        <SliderStrip label="Sắc bạc hà" value={0.62} />
        <SliderStrip label="Độ bo góc" value={0.78} unit="18px" />
        <SliderStrip label="Cỡ tiêu đề" value={0.55} unit="28pt" />
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Hero body — two-column (chat | canvas) layout for the Labs shell
// ---------------------------------------------------------------------------

const DesignHeroBody = memo(function DesignHeroBody() {
  return (
    <div className="flex h-full min-h-0">
      {/* Chat pane — ~34% width so the canvas has room to breathe. */}
      <div
        className="flex shrink-0 flex-col border-r border-border"
        style={{ width: "34%", background: "var(--paper, #FBFAF7)" }}
      >
        <ChatPane />
      </div>
      {/* Canvas pane — remaining ~66% */}
      <div className="flex min-w-0 flex-1 flex-col">
        <CanvasPreview />
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Default export — the full tile
// ---------------------------------------------------------------------------

export default function ClaudeDesignTile() {
  const tile = findTile("claude-design");
  const viTitle = tile?.viTitle ?? "Claude Design";

  // Slower sweep than chat/web-search (6s) — the hero has two distinct
  // phases (describe → refine with sliders) and readers need time to
  // parse the canvas, not just a text stream. 7000ms feels right.
  const { playhead, playing, onPlay, onReset, onStep } = useDemoPlayhead({
    duration: 7000,
    pauseAtEnd: 1800,
  });

  return (
    <article className="mx-auto flex max-w-[1100px] flex-col gap-12 px-4 py-10">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-tertiary">
          Cẩm nang Claude · Khởi đầu
        </span>
        <h1 className="text-[36px] font-semibold leading-[1.15] text-foreground md:text-[44px]">
          {viTitle}
        </h1>
        <p className="max-w-[62ch] text-[16px] leading-[1.55] text-secondary md:text-[17px]">
          {ONE_LINER}
        </p>
      </header>

      {/* Hero demo — labs shell, two-column chat + canvas */}
      <DemoCanvas
        title={viTitle}
        onPlay={onPlay}
        onReset={onReset}
        onStep={onStep}
        playing={playing}
      >
        <div className="relative">
          <ClaudeLabsShell
            topBar={<DesignTopBar />}
            body={<DesignHeroBody />}
          />
          <AnnotationLayer annotations={ANNOTATIONS} playhead={playhead} />
        </div>
      </DemoCanvas>

      {/* Honest disclosure — link straight to Anthropic's announcement
          post for Claude Design. Slug verified 2026-04-19. */}
      <ViewRealUI
        href={DESIGN_ANNOUNCEMENT_HREF}
        label="Đọc thông báo Claude Design từ Anthropic Labs"
        caption="Mở bài giới thiệu gốc từ Anthropic (17/4/2026, ảnh chụp 2026-04-19). Mô tả đầy đủ cách dựng bản đầu, tinh chỉnh, xuất, và chuyển giao sang Claude Code."
      />

      {/* Plan-availability note — grounded in the announcement post
          (Pro, Max, Team, Enterprise; Enterprise off by default; research
          preview; powered by Opus 4.7). */}
      <p
        role="note"
        className="max-w-[62ch] text-[12px] leading-[1.55] text-tertiary"
      >
        Claude Design ra mắt ngày 17/4/2026 ở dạng research preview,
        hiện có cho người dùng gói Pro, Max, Team và Enterprise của
        claude.ai. Với gói Enterprise, tính năng mặc định tắt — admin
        của workspace phải bật trước khi thành viên dùng. Sử dụng
        tính vào hạn mức của gói hiện tại; có thể mua thêm lượt dùng
        vượt mức. Sản phẩm chạy trên Claude Opus 4.7 (mô hình vision
        mạnh nhất hiện tại của Anthropic). Truy cập tại{" "}
        <a
          href={DESIGN_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-border underline-offset-2 hover:text-foreground"
        >
          claude.ai/design
        </a>
        . Vì là Labs / research preview, giao diện và tính năng có
        thể thay đổi nhanh — bài này đối chiếu với thông báo ra mắt
        ngày 17/4/2026.
      </p>

      {/* "Cách nó hoạt động" — three crop cards using shared primitives. */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[22px] font-semibold leading-[1.25] text-foreground md:text-[26px]">
          Cách nó hoạt động
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <CropCard
            title="Bước 1 — Mô tả, Claude dựng bản đầu"
            caption="Bạn mô tả thiết kế cần có bằng ngôn ngữ tự nhiên — 'slide pitch 3 trang', 'one-pager giới thiệu sản phẩm', 'prototype app đặt lịch'. Claude dựng bản đầu tiên trên canvas trong vài giây. Đúng quy trình được nêu trong thông báo ra mắt của Anthropic Labs."
          >
            <div
              className="rounded-[10px] bg-foreground px-3 py-2 text-[12px] leading-[1.5] text-background"
              style={{ maxWidth: "85%" }}
            >
              Dựng prototype app thiền di động — tông bạc hà, phông tròn.
            </div>
            <div
              className="rounded-[10px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-2 text-[12px] leading-[1.5] text-foreground"
              style={{ maxWidth: "85%" }}
            >
              <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.06em] text-tertiary">
                <Sparkles size={10} strokeWidth={1.8} aria-hidden="true" />
                Claude
              </span>
              <div>Đã dựng ba màn hình — tông bạc hà dịu, phông bo mềm.</div>
            </div>
            <CropAnnotation pin={1} label="Chat mô tả → canvas dựng ngay" />
          </CropCard>

          <CropCard
            title="Bước 2 — Tinh chỉnh qua chat, comment, slider"
            caption="Bốn cách sửa: (1) nói chuyện thêm trong chat, (2) comment thẳng lên phần tử cụ thể, (3) sửa trực tiếp chữ/màu, (4) kéo thanh trượt do Claude tự sinh — theo Anthropic, đây là 'custom sliders (made by Claude)'."
          >
            <div className="flex flex-col gap-2 rounded-[10px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-2.5">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-tertiary">
                <Sliders size={11} strokeWidth={1.8} aria-hidden="true" />
                Thanh điều chỉnh
              </div>
              <SliderStrip label="Sắc bạc hà" value={0.62} />
              <SliderStrip label="Cỡ tiêu đề" value={0.55} unit="28pt" />
            </div>
            <CropAnnotation pin={2} label="Slider do Claude tự làm" />
          </CropCard>

          <CropCard
            title="Bước 3 — Xuất, chia sẻ, chuyển giao"
            caption="Xuất sang PDF, PPTX, HTML, Canva; chia sẻ URL nội bộ trong tổ chức; hoặc đóng gói thành handoff bundle để chuyển sang Claude Code — một lệnh duy nhất là xong, theo đúng thông báo của Anthropic."
          >
            <div
              className="flex flex-wrap items-center gap-2 rounded-[10px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-2.5"
            >
              <span className="rounded-full border border-border bg-[var(--paper-2,#F3F2EE)] px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.06em] text-tertiary">
                PDF
              </span>
              <span className="rounded-full border border-border bg-[var(--paper-2,#F3F2EE)] px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.06em] text-tertiary">
                PPTX
              </span>
              <span className="rounded-full border border-border bg-[var(--paper-2,#F3F2EE)] px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.06em] text-tertiary">
                HTML
              </span>
              <span className="rounded-full border border-border bg-[var(--paper-2,#F3F2EE)] px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.06em] text-tertiary">
                Canva
              </span>
              <span className="rounded-full border border-foreground bg-foreground px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.06em] text-background">
                → Claude Code
              </span>
            </div>
            <CropAnnotation
              pin={3}
              label="Handoff bundle → Claude Code"
              align="right"
            />
          </CropCard>
        </div>
      </section>

      {/* Thử ngay */}
      <section className="flex flex-col items-start gap-4 rounded-[14px] border border-border bg-[var(--paper-2,#F3F2EE)] p-6">
        <h2 className="text-[20px] font-semibold leading-[1.25] text-foreground">
          Thử ngay
        </h2>
        <p className="max-w-[58ch] text-[14px] leading-[1.55] text-secondary">
          Bấm mở Claude với câu mẫu bên dưới. Trên gói Pro trở lên, Claude
          sẽ gợi ý chuyển sang Claude Design (claude.ai/design) để dựng
          slide/prototype trực tiếp thay vì chỉ trả lời bằng văn bản.
        </p>
        <DeepLinkCTA prompt="Dựng giúp mình 3 slide pitch ngắn cho sản phẩm AI dạy tiếng Việt cho học sinh cấp 2 — slide 1: vấn đề, slide 2: giải pháp, slide 3: kêu gọi đầu tư. Tông màu trung tính, phông chữ tròn, có chỗ đặt logo." />
      </section>

      {/* Liên quan — cross-links only to tiles currently status: "ready" */}
      <nav aria-label="Liên quan" className="flex flex-col gap-4">
        <h2 className="text-[20px] font-semibold leading-[1.25] text-foreground">
          Liên quan
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {CROSS_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-[12px] border border-border bg-card p-4 transition-transform hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--turquoise-500)] focus-visible:ring-offset-2"
              >
                <div className="text-[14px] font-semibold text-foreground">
                  {link.title}
                </div>
                <div className="mt-1 text-[12px] leading-[1.5] text-secondary">
                  {link.blurb}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
