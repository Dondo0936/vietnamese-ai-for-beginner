"use client";

/**
 * Artifacts tile — Claude Desktop side-panel preview demo.
 *
 * ---------------------------------------------------------------------------
 * DOCS GROUNDING (Anthropic sources, snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * Source: https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them
 * Fetched: 2026-04-19
 *
 *   Quote 1 (what an artifact is):
 *   > "Claude can share substantial, standalone content with you in a
 *   >  dedicated window"
 *
 *   Quote 2 (trigger criterion):
 *   > "It is significant and self-contained, typically over 15 lines."
 *
 *   Quote 3 (trigger criterion — reuse intent):
 *   > "It is something you're likely to want to edit, iterate on, or
 *   >  reuse outside"
 *
 *   Quote 4 (plan availability):
 *   > "Artifacts are supported on free, Pro, Max, Team, and Enterprise
 *   >  plans."
 *
 *   Quote 5 (content types Artifacts can render):
 *   > "Documents (Markdown or plain text), Code snippets, Single-page
 *   >  HTML websites, SVG images, Diagrams and flowcharts, Interactive
 *   >  React components"
 *
 * Source: https://claude.com/blog/artifacts (redirect target from
 *         anthropic.com/news/artifacts) — Fetched: 2026-04-19
 *
 *   Quote 6 (dedicated space framing):
 *   > "Artifacts give you a dedicated space to see, iterate on, and build
 *   >  code, documents, and visualizations as we work together"
 *
 * Source: https://support.claude.com/en/articles/9547008-publishing-and-sharing-artifacts
 * Fetched: 2026-04-19
 *
 *   Quote 6 (publish gating):
 *   > "Publishing is available on Free, Pro, and Max plans."
 *
 *   Quote 7 (internal-share gating):
 *   > "Internal sharing is available on Team and Enterprise plans.
 *   >  Artifacts created on Team or Enterprise accounts can only be
 *   >  shared within your organization—they cannot be published publicly."
 *
 * Canonical URL used by ViewRealUI is the support article above — it has
 * the richest verbatim content about when Claude opens an Artifact and
 * which plans have access, which is what this tile teaches.
 *
 * ---------------------------------------------------------------------------
 * CONTEXT7 FINDINGS (snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * next.js v16.2.2 (/vercel/next.js/v16.2.2, closest pinned version to the
 *   installed v16.2.3): `next/dynamic` in App Router requires a STATIC
 *   import literal — `dynamic(() => import("./artifacts"))`. Template
 *   literals force a client bailout. This tile is lazy-loaded from
 *   `src/features/claude/tiles/index.ts` using that exact static form.
 *   (docs/01-app/02-guides/lazy-loading.mdx)
 *
 * framer-motion (/grx7/framer-motion): DemoCanvas owns `useReducedMotion()`;
 *   the tile itself never reads that hook directly. AnnotationLayer filters
 *   by showAt windows against the current playhead, so when the user hasn't
 *   pressed Play, the playhead stays at 0 and only the first-stage pins
 *   render. This matches the contract the chat + projects tiles rely on.
 *
 * react v19.2.0 (/facebook/react/v19_2_0): `memo` wrappers on the three
 *   shell-slot components keep the static shell chrome from re-rendering
 *   when the hero DemoCanvas re-renders on playhead ticks. Consistent with
 *   chat.tsx + projects.tsx.
 */

import { memo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Settings,
  LayoutPanelLeft,
  Download,
  Copy,
  Code2,
  Eye,
  History,
} from "lucide-react";

import {
  ClaudeDesktopShell,
  ShellMessage,
  ShellComposerStub,
} from "@/features/claude/components/ClaudeDesktopShell";
import { AnnotationLayer } from "@/features/claude/components/AnnotationLayer";
import { DemoCanvas } from "@/features/claude/components/DemoCanvas";
import { DeepLinkCTA } from "@/features/claude/components/DeepLinkCTA";
import { ViewRealUI } from "@/features/claude/components/ViewRealUI";
import {
  CropCard,
  CropBubble,
  CropAnnotation,
} from "@/features/claude/components/crop-primitives";
import { useDemoPlayhead } from "@/features/claude/useDemoPlayhead";
import { findTile } from "@/features/claude/registry";
import type { Annotation } from "@/features/claude/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ONE_LINER =
  "Artifacts là khung xem ở cạnh chat — Claude tự mở để hiển thị code, React, biểu đồ hay tài liệu dài, giữ riêng khỏi cuộc hội thoại để bạn xem, sửa và tải về.";

const ACTIVE_CHAT_TITLE = "Phân tích doanh thu Q1";

const USER_QUESTION =
  "Tạo giúp mình biểu đồ cột doanh thu 4 quý năm 2025 cho buổi thuyết trình.";

// Keep the on-screen text free of emoji/icons — use the inline lucide icon
// rendered in `ChatMain` below. The separator token is a plain middle dot.
const ARTIFACT_CHIP_LABEL = "Biểu đồ cột doanh thu 2025";
const ARTIFACT_CHIP_SUFFIX = "Đã mở ở khung cạnh";

const CLAUDE_INTRO =
  "Đây là biểu đồ cột doanh thu 4 quý năm 2025. Mình đã mở ở khung Artifacts bên phải để bạn xem đầy đủ, sửa số liệu hoặc tải về PNG cho slide.";

const ARTIFACT_TITLE = "Biểu đồ cột doanh thu 2025";
const ARTIFACT_VERSION_LINE = "Phiên bản 2";

// Plausible VND revenue numbers (tỷ đồng). Kept round so the demo reads at
// a glance — this is a simulated panel, not real data.
const BAR_DATA: Array<{ q: string; value: number; label: string }> = [
  { q: "Q1", value: 18.4, label: "18,4 tỷ" },
  { q: "Q2", value: 22.7, label: "22,7 tỷ" },
  { q: "Q3", value: 27.1, label: "27,1 tỷ" },
  { q: "Q4", value: 31.5, label: "31,5 tỷ" },
];

const CHAT_HISTORY: Array<{ id: string; title: string; active?: boolean }> = [
  { id: "q1", title: ACTIVE_CHAT_TITLE, active: true },
  { id: "deck", title: "Slide mở đầu buổi họp tháng 4" },
];

// Anchor calibration notes (2026-04-19):
//   - Shell layout: top bar 44px; left rail 248px; artifacts panel 42% of
//     shell width on the right. Main column sits between rail and panel —
//     roughly x:22..58 for a 1100px shell.
//   - Pin 1 (user bubble): right-aligned inside main column → x:46, y:20.
//   - Pin 2 (Claude's artifact-open indicator chip): mid-main after Claude's
//     reply — around x:38, y:52.
//   - Pin 3 (Preview/Code tab switcher at top of panel): panel occupies
//     ~58..100; tabs sit near the top-left of the panel header → x:70, y:14.
//   - Pin 4 (version note at bottom of panel): bottom strip inside panel,
//     centered-left → x:78, y:92.
const ANNOTATIONS: Annotation[] = [
  {
    id: "user-request",
    pin: 1,
    label: "Yêu cầu biểu đồ trong câu hỏi",
    description:
      "Bạn hỏi một nội dung vừa dài vừa tách biệt — ở đây là một biểu đồ. Đây chính là tín hiệu Claude dùng để quyết định mở Artifacts.",
    showAt: [0.0, 0.55],
    anchor: { x: 46, y: 20 },
  },
  {
    id: "auto-open-chip",
    pin: 2,
    label: "Claude tự mở khung Artifacts",
    description:
      "Khi nội dung vượt ~15 dòng và đứng riêng được (code, React, SVG, tài liệu), Claude tạo Artifact và mở luôn ở cột phải. Trong chat chỉ còn một dòng tóm tắt kèm chip tham chiếu.",
    showAt: [0.0, 0.55],
    anchor: { x: 38, y: 52 },
  },
  {
    id: "tab-switch",
    pin: 3,
    label: "Xem trực quan hoặc code gốc",
    description:
      "Xem trực quan hoặc mở mã nguồn — Claude cho bạn cả hai, tuỳ loại Artifact. Một số loại (ví dụ tài liệu ngắn) chỉ có chế độ xem duy nhất.",
    showAt: [0.5, 1.0],
    anchor: { x: 70, y: 14 },
  },
  {
    id: "version-history",
    pin: 4,
    label: "Có lịch sử phiên bản, sửa được tiếp",
    description:
      "Mỗi lần bạn yêu cầu Claude chỉnh Artifact, phiên bản mới được thêm vào. Chuyển giữa các phiên bản để so sánh hoặc quay lại bản cũ.",
    showAt: [0.5, 1.0],
    anchor: { x: 78, y: 92 },
  },
];

const CROSS_LINKS: Array<{ href: string; title: string; blurb: string }> = [
  {
    href: "/claude/chat",
    title: "Chat + phản hồi trực tiếp",
    blurb: "Nội dung ngắn vẫn ở chat; Artifacts chỉ bật khi cần.",
  },
  {
    href: "/claude/claude-design",
    title: "Claude Design",
    blurb: "Slide, prototype, one-pager — đều sinh qua Artifacts.",
  },
  {
    href: "/claude/projects",
    title: "Workspace (Projects)",
    blurb: "Artifact dính theo chat, chat dính theo project.",
  },
];

// ---------------------------------------------------------------------------
// Artifact preview — static SVG bar chart for Q1-Q4 2025
// ---------------------------------------------------------------------------

/**
 * Small presentational SVG bar chart. Axes are decorative — the chart
 * exists to make the panel feel "real" at glance, not to communicate data.
 */
function ArtifactBarChart() {
  // Chart viewBox: 320 wide × 180 tall. Keep a 28px bottom gutter for x-axis
  // labels and a 16px top gutter so tallest bar doesn't clip.
  const viewW = 320;
  const viewH = 180;
  const chartTop = 16;
  const chartBottom = viewH - 28; // y of baseline
  const chartH = chartBottom - chartTop; // 136
  const maxVal = 32; // just above Q4 so Q4 doesn't fill 100%
  const barSlot = viewW / BAR_DATA.length; // 80
  const barW = 40;

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      role="img"
      aria-label="Biểu đồ cột doanh thu Q1 tới Q4 năm 2025"
      className="w-full"
      style={{ maxHeight: 220 }}
    >
      {/* Axis baseline */}
      <line
        x1={0}
        x2={viewW}
        y1={chartBottom}
        y2={chartBottom}
        stroke="var(--border, #E6E4DE)"
        strokeWidth={1}
      />
      {/* Light horizontal gridlines */}
      {[0.25, 0.5, 0.75].map((frac) => {
        const y = chartTop + chartH * (1 - frac);
        return (
          <line
            key={frac}
            x1={0}
            x2={viewW}
            y1={y}
            y2={y}
            stroke="var(--border, #E6E4DE)"
            strokeOpacity={0.5}
            strokeDasharray="2 3"
            strokeWidth={1}
          />
        );
      })}
      {/* Bars + labels */}
      {BAR_DATA.map((d, i) => {
        const h = (d.value / maxVal) * chartH;
        const x = i * barSlot + (barSlot - barW) / 2;
        const y = chartBottom - h;
        return (
          <g key={d.q}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={3}
              fill="var(--turquoise-ink, #13343B)"
              opacity={0.88}
            />
            {/* Value label above the bar */}
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize={10}
              fill="var(--foreground, #13343B)"
              fontFamily="var(--font-mono, ui-monospace, monospace)"
            >
              {d.label}
            </text>
            {/* Quarter label below the baseline */}
            <text
              x={x + barW / 2}
              y={chartBottom + 16}
              textAnchor="middle"
              fontSize={11}
              fill="var(--tertiary, #6B6A66)"
            >
              {d.q}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Shell slot components — memoized for DemoCanvas playhead ticks
// ---------------------------------------------------------------------------

const ArtifactsTopBar = memo(function ArtifactsTopBar() {
  return (
    <div className="flex w-full items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-foreground">
        {ACTIVE_CHAT_TITLE}
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-foreground">
        Claude Sonnet 4.6
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="ml-auto text-tertiary" aria-hidden="true">
        <Settings size={16} strokeWidth={1.8} />
      </span>
    </div>
  );
});

const ArtifactsLeftRail = memo(function ArtifactsLeftRail() {
  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-tertiary">
        Chats
      </div>
      <ul className="flex flex-col gap-1">
        {CHAT_HISTORY.map((chat) => (
          <li key={chat.id}>
            <div
              className={`truncate rounded-[8px] px-2 py-1.5 text-[12px] ${
                chat.active
                  ? "bg-[var(--paper,#FBFAF7)] font-medium text-foreground shadow-[var(--shadow-sm)]"
                  : "text-secondary hover:bg-[var(--paper,#FBFAF7)]"
              }`}
            >
              {chat.title}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});

/**
 * Inline "artifact opened" indicator inside Claude's reply. Non-interactive.
 * Uses a lucide icon (LayoutPanelLeft) rather than an emoji so product copy
 * stays emoji-free.
 */
function ArtifactOpenChip() {
  return (
    <span
      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--pure-white,#FFFFFF)] px-2.5 py-1 text-[12px] text-foreground"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <LayoutPanelLeft
        size={12}
        strokeWidth={1.8}
        aria-hidden="true"
        className="text-tertiary"
      />
      <span className="font-medium">{ARTIFACT_CHIP_LABEL}</span>
      <span className="text-tertiary" aria-hidden="true">
        ·
      </span>
      <span className="text-tertiary">{ARTIFACT_CHIP_SUFFIX}</span>
    </span>
  );
}

const ArtifactsMain = memo(function ArtifactsMain() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden pt-3">
        <ShellMessage from="user">{USER_QUESTION}</ShellMessage>
        <ShellMessage from="claude">
          <span>{CLAUDE_INTRO}</span>
          <br />
          <ArtifactOpenChip />
        </ShellMessage>
      </div>
      <ShellComposerStub placeholder="Hỏi tiếp, Claude sẽ cập nhật Artifact..." />
    </div>
  );
});

/**
 * Right-hand artifacts panel — header (title + tab switcher + copy/download
 * buttons), preview body with bar chart, and a small version footer.
 */
const ArtifactsPanel = memo(function ArtifactsPanel() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-foreground">
            {ARTIFACT_TITLE}
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            <span
              aria-pressed="true"
              className="inline-flex items-center gap-1 rounded-full border border-foreground bg-foreground px-2 py-0.5 text-[11px] font-medium text-background"
            >
              <Eye size={11} strokeWidth={2} aria-hidden="true" />
              Preview
            </span>
            <span
              aria-pressed="false"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-tertiary"
            >
              <Code2 size={11} strokeWidth={1.8} aria-hidden="true" />
              Code
            </span>
          </div>
        </div>
        <div
          className="flex shrink-0 items-center gap-1 text-tertiary"
          aria-hidden="true"
        >
          <button
            type="button"
            aria-hidden="true"
            className="pointer-events-none flex h-7 w-7 items-center justify-center rounded-[8px] border border-border bg-card"
          >
            <Copy size={12} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-hidden="true"
            className="pointer-events-none flex h-7 w-7 items-center justify-center rounded-[8px] border border-border bg-card"
          >
            <Download size={12} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Preview body */}
      <div className="flex-1 overflow-hidden p-4">
        <div
          className="flex h-full items-center justify-center rounded-[12px] border border-border bg-[var(--pure-white,#FFFFFF)] p-4"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <ArtifactBarChart />
        </div>
      </div>

      {/* Version footer */}
      <div className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-[11px] text-tertiary">
        <History size={11} strokeWidth={1.8} aria-hidden="true" />
        <span>{ARTIFACT_VERSION_LINE}</span>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Default export — the full tile
// ---------------------------------------------------------------------------

export default function ArtifactsTile() {
  const tile = findTile("artifacts");
  const viTitle = tile?.viTitle ?? "Artifacts";

  const { playhead, playing, onPlay, onReset, onStep } = useDemoPlayhead({
    duration: 6000,
    pauseAtEnd: 2000,
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

      {/* Hero demo — full shell with all three slots */}
      <DemoCanvas
        title={viTitle}
        onPlay={onPlay}
        onReset={onReset}
        onStep={onStep}
        playing={playing}
      >
        <div className="relative">
          <ClaudeDesktopShell
            topBar={<ArtifactsTopBar />}
            leftRail={<ArtifactsLeftRail />}
            main={<ArtifactsMain />}
            artifactsPanel={<ArtifactsPanel />}
          />
          <AnnotationLayer
            annotations={ANNOTATIONS}
            playhead={playhead}
          />
        </div>
      </DemoCanvas>

      {/* Honest disclosure — the Anthropic support article is the canonical
          public explanation of what Artifacts are and when they open. */}
      <ViewRealUI
        href="https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them"
        label="Xem bài viết gốc của Anthropic về Artifacts"
        caption="Mở trang hỗ trợ trong tab mới. Giao diện demo được dựng lại dựa trên bài viết này, ảnh chụp ngày 2026-04-19."
      />

      {/* Plan availability — factual disclosure, matches Task 2 pattern.
          Per Anthropic support: "Artifacts are supported on free, Pro, Max,
          Team, and Enterprise plans." (fetched 2026-04-19) */}
      <p
        role="note"
        className="max-w-[62ch] text-[12px] leading-[1.55] text-tertiary"
      >
        Artifacts dùng được trên mọi gói — Free, Pro, Max, Team và Enterprise.
        Publish ra công khai chỉ có trên Free, Pro và Max; Team và Enterprise
        chỉ chia sẻ nội bộ trong tổ chức. MCP và lưu trữ bền vững cần từ gói
        Pro trở lên.
      </p>

      {/* "Cách nó hoạt động" — three crop cards built from shared primitives. */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[22px] font-semibold leading-[1.25] text-foreground md:text-[26px]">
          Cách nó hoạt động
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <CropCard
            title="Khi nào Artifacts tự mở"
            caption="Khi nội dung đủ dài (~15 dòng) và đứng riêng được — code, React, SVG, tài liệu dài — Claude tạo Artifact thay vì đổ hết ra chat."
          >
            <CropBubble from="user">{USER_QUESTION}</CropBubble>
            <CropBubble from="claude">
              Mình sẽ mở Artifact để bạn xem biểu đồ đầy đủ.
            </CropBubble>
            <CropAnnotation
              pin={2}
              label="Nội dung dài + đứng riêng → Artifact"
            />
          </CropCard>

          <CropCard
            title="Xem trực quan hoặc code gốc"
            caption="Khung Artifact cho bạn xem trực quan hoặc mở mã nguồn — tuỳ loại, một số chỉ có chế độ xem."
          >
            <div
              className="flex items-center gap-1 rounded-[12px] border border-border bg-[var(--paper,#FBFAF7)] px-3 py-2.5"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <span
                aria-pressed="true"
                className="inline-flex items-center gap-1 rounded-full border border-foreground bg-foreground px-2 py-0.5 text-[11px] font-medium text-background"
              >
                <Eye size={11} strokeWidth={2} aria-hidden="true" />
                Preview
              </span>
              <span
                aria-pressed="false"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-tertiary"
              >
                <Code2 size={11} strokeWidth={1.8} aria-hidden="true" />
                Code
              </span>
            </div>
            <CropAnnotation pin={3} label="Đổi giữa Preview và Code" />
          </CropCard>

          <CropCard
            title="Lịch sử phiên bản"
            caption="Mỗi lần Claude chỉnh Artifact, một phiên bản mới được thêm vào. Bạn có thể xem lại bản cũ hoặc tiếp tục sửa từ bản hiện tại."
          >
            <div
              className="flex items-center gap-1.5 rounded-[12px] border border-border bg-[var(--paper,#FBFAF7)] px-3 py-2.5 text-[12px] text-tertiary"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <History size={12} strokeWidth={1.8} aria-hidden="true" />
              <span>{ARTIFACT_VERSION_LINE}</span>
            </div>
            <CropAnnotation
              pin={4}
              label="Có lịch sử phiên bản, sửa được tiếp"
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
          Bấm nút bên dưới để mở Claude với câu hỏi mẫu — bạn sẽ thấy Claude
          mở Artifacts cho một biểu đồ cột.
        </p>
        <DeepLinkCTA prompt="Mình muốn thử Artifacts — hãy vẽ giúp mình một biểu đồ cột so sánh tỉ lệ người dùng Android/iOS ở Việt Nam năm 2025, kèm chú thích nguồn." />
      </section>

      {/* Liên quan */}
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
