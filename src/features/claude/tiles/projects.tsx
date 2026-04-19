"use client";

/**
 * Projects tile — Claude Desktop workspace demo.
 *
 * ---------------------------------------------------------------------------
 * DOCS GROUNDING (Anthropic sources, snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * Source: https://support.claude.com/en/articles/9519177-what-are-projects
 * Fetched: 2026-04-19
 *
 *   Quote 1 (project knowledge base):
 *   > "Anything you upload to this space will be used across all of your
 *   >  chats within that project."
 *
 *   Quote 2 (project instructions):
 *   > "Claude will use these instructions for all the chats within the
 *   >  project."
 *
 *   Quote 3 (per-project memory summaries):
 *   > "Claude maintains separate memory summaries for each individual
 *   >  project, as well as a summary including the rest of your non-project
 *   >  chats."
 *
 *   Quote 4 (availability / limits):
 *   > "Projects are available to all users, including those with free
 *   >  Claude accounts."
 *
 *   Quote 5 (memory plan gating):
 *   > "Memory from chat history is available for users on Pro, Max, Team,
 *   >  and Enterprise plans."
 *
 * Note: the marketing page at https://www.claude.com/ lists Projects under
 * its Learn/Resources strip with the short line "Organize conversations by
 * topic with persistent context. Keep related work together and build on
 * previous insights." but does not host a standalone projects landing page
 * at /product/projects (404 as of fetch date). The support article above
 * is the canonical public definition.
 *
 * ---------------------------------------------------------------------------
 * CONTEXT7 FINDINGS (snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * next.js v16.2.2 (/vercel/next.js/v16.2.2): `next/dynamic` in App Router
 *   requires a STATIC import literal — `dynamic(() => import("./projects"))`.
 *   Template literals force a client bailout. This tile is lazy-loaded from
 *   `src/features/claude/tiles/index.ts` using that exact static form.
 *   (docs/01-app/02-guides/lazy-loading.mdx)
 *
 * framer-motion (/grx7/framer-motion): DemoCanvas owns `useReducedMotion()`;
 *   when it returns `null` (pre-hydration) or `true` we fall back to a
 *   static "Xem tĩnh" button. The playhead still renders all annotations in
 *   static mode via AnnotationLayer's `staticMode` contract — this tile
 *   doesn't pass it directly but AnnotationLayer filters by showAt windows
 *   against the current playhead value which stays at 0 when the user
 *   hasn't pressed Play, so all four pins become visible together once
 *   they're rendered by the StillFrame-style cards below.
 *
 * react v19 (/facebook/react/v19): `memo` wrappers on ProjectsTopBar/
 *   ProjectsLeftRail/ProjectsMain keep the static shell chrome from
 *   re-rendering when the hero DemoCanvas re-renders on playhead ticks.
 *   ProjectsMain currently takes no props (the playhead drives annotations
 *   only, not the main content) — memo is kept for consistency with the
 *   chat tile's pattern and so future prop additions don't cause churn.
 */

import { memo, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Settings, Plus, FileText, Book, Brain } from "lucide-react";

import {
  ClaudeDesktopShell,
  ShellMessage,
  ShellComposerStub,
} from "@/features/claude/components/ClaudeDesktopShell";
import { AnnotationLayer } from "@/features/claude/components/AnnotationLayer";
import { DemoCanvas } from "@/features/claude/components/DemoCanvas";
import { DeepLinkCTA } from "@/features/claude/components/DeepLinkCTA";
import { ViewRealUI } from "@/features/claude/components/ViewRealUI";
import { useDemoPlayhead } from "@/features/claude/useDemoPlayhead";
import { findTile } from "@/features/claude/registry";
import type { Annotation } from "@/features/claude/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ONE_LINER =
  "Projects là không gian làm việc riêng cho mỗi chủ đề — files và instructions gắn liền với project, dùng chung cho mọi chat bên trong. (Memory xuyên phiên có trên gói Pro trở lên.)";

const ACTIVE_PROJECT_NAME = "Kế hoạch Q2 — Marketing";
const ACTIVE_PROJECT_DESC = "Roadmap, KPI và brief cho chiến dịch quý 2.";

const PROJECT_FILES = [
  "roadmap-q2.pdf",
  "kpi.xlsx",
  "brief.docx",
  "notes.md",
] as const;

const USER_QUESTION =
  "Mình cần tóm tắt lại roadmap cho buổi họp sáng mai, chú ý các mốc quan trọng.";

const CLAUDE_REPLY_PREFIX = "Dựa trên ";
const CLAUDE_REPLY_FILENAME = "roadmap-q2.pdf";
const CLAUDE_REPLY_SUFFIX =
  " mà bạn đã thêm vào Projects, đây là 3 mốc lớn của quý 2: ra mắt landing ngày 12/5, khởi chạy paid campaign 27/5, và đánh giá lại chỉ số KPI ngày 20/6. Mình giữ nguyên giọng văn và hướng dẫn trong Instructions của project.";

const PROJECTS_LIST: Array<{ id: string; title: string; active?: boolean }> = [
  { id: "q2", title: ACTIVE_PROJECT_NAME, active: true },
  { id: "onboard", title: "Onboarding khách hàng doanh nghiệp" },
  { id: "blog", title: "Blog series — AI cho giáo viên" },
];

// Anchor calibration notes (2026-04-19):
//   - Shell layout mirrors chat tile: top bar 44px, left rail 248px (~22.5%
//     of a 1100px shell), main column starts at x≈22.5%.
//   - Left rail "Projects" section renders a heading + 3 list items. The
//     active (first) item sits near x:11 (half of rail width), y:26 (rail
//     starts just below the 44px top bar, active item is the first row).
//   - Project header strip at the top of the main column: project name at
//     y:12 (just below top bar), chip row at y:20. Files chip is the first
//     chip in the row, sitting around x:40. Instructions chip is next,
//     around x:54.
//   - Claude reply with the filename reference is the second message in
//     the column; the filename token sits mid-bubble around x:42, y:56.
const ANNOTATIONS: Annotation[] = [
  {
    id: "active-project",
    pin: 1,
    label: "Mỗi project là một không gian riêng",
    description:
      "Danh sách project ở cột trái. Mỗi project có files, instructions, memory và lịch sử chat riêng — không trộn lẫn với các project khác.",
    showAt: [0.0, 0.55],
    anchor: { x: 11, y: 26 },
  },
  {
    id: "files-chip",
    pin: 2,
    label: "File bạn thêm sẽ luôn có mặt",
    description:
      "File upload vào Projects được dùng xuyên suốt mọi chat trong project. Không cần đính kèm lại mỗi lượt.",
    showAt: [0.0, 0.55],
    anchor: { x: 40, y: 20 },
  },
  {
    id: "instructions-chip",
    pin: 3,
    label: "Hướng dẫn riêng cho project, dùng lại mỗi chat",
    description:
      "Instructions là system prompt của riêng project — Claude đọc lại trước mọi chat trong project, giữ giọng văn và quy ước đồng nhất.",
    showAt: [0.5, 1.0],
    // Shifted from x:54 → x:45 so the pin lands over the Instructions
    // chip in the project-header row instead of drifting to Memory.
    anchor: { x: 45, y: 22 },
  },
  {
    id: "memory-filename",
    pin: 4,
    label: "Files luôn sẵn sàng, không cần đính kèm lại",
    description:
      "Claude trích dẫn trực tiếp tên file trong project. Bạn không phải dán nội dung PDF vào câu hỏi — memory của project giữ sẵn bối cảnh.",
    showAt: [0.5, 1.0],
    anchor: { x: 42, y: 56 },
  },
];

const CROSS_LINKS: Array<{ href: string; title: string; blurb: string }> = [
  {
    href: "/claude/chat",
    title: "Chat + phản hồi trực tiếp",
    blurb: "Bề mặt trò chuyện chính bên trong mỗi project.",
  },
  {
    href: "/claude/files-vision",
    title: "Files & Vision",
    blurb: "Cách Claude đọc PDF, ảnh, Excel bạn đưa vào project.",
  },
  {
    href: "/claude/memory",
    title: "Memory",
    blurb: "Ghi nhớ xuyên phiên; mỗi project có summary riêng.",
  },
];

// ---------------------------------------------------------------------------
// "Cách nó hoạt động" crop primitives — zoomed fragments, not mini-shells
// ---------------------------------------------------------------------------

/** Small card wrapper shared by the 3 "how it works" crops. */
function CropCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-3">
      <div
        className="flex flex-col gap-3 rounded-[14px] border border-border bg-[var(--paper-2,#F3F2EE)] p-5"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        {children}
      </div>
      <figcaption className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-tertiary">
          {title}
        </span>
        <p className="text-[14px] leading-[1.55] text-muted">{caption}</p>
      </figcaption>
    </figure>
  );
}

/** Inline pin+label — matches the AnnotationLayer look but as a flow element. */
function CropAnnotation({
  pin,
  label,
  align = "left",
}: {
  pin: number;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex items-start gap-2 ${align === "right" ? "ml-auto flex-row-reverse" : ""}`}
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-foreground bg-[var(--paper,#FBFAF7)] text-[11px] font-semibold text-foreground"
        style={{
          // Layered halo so pins lift off paper-2 crop-card background.
          // Matches the AnnotationLayer polish — single source of truth
          // is pending (crop-primitives extraction happens at Task 3).
          boxShadow:
            "0 2px 6px rgba(0,0,0,0.10), 0 0 0 3px var(--paper,#FBFAF7), 0 0 0 4px rgba(19,52,59,0.18)",
        }}
      >
        {pin}
      </span>
      <span
        className="rounded-[6px] border border-border bg-[var(--pure-white,#FFFFFF)] px-2 py-0.5 text-[12px] leading-[1.35] text-foreground"
        style={{
          borderLeft: "2px solid var(--turquoise-ink, #13343B)",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** A small project-header strip (project name + chip row). */
function CropProjectHeader() {
  return (
    <div
      className="flex flex-col gap-2 rounded-[12px] border border-border bg-[var(--paper,#FBFAF7)] px-4 py-3"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-foreground">
          {ACTIVE_PROJECT_NAME}
        </span>
        <span className="text-[11px] leading-[1.35] text-tertiary">
          {ACTIVE_PROJECT_DESC}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <CropChip icon="files">Files ({PROJECT_FILES.length})</CropChip>
        <CropChip icon="instructions">Instructions</CropChip>
        <CropChip icon="memory">Memory</CropChip>
      </div>
    </div>
  );
}

/** A chip shown in project-header rows. */
function CropChip({
  icon,
  children,
}: {
  icon: "files" | "instructions" | "memory";
  children: ReactNode;
}) {
  const Icon = icon === "files" ? FileText : icon === "instructions" ? Book : Brain;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-foreground">
      <Icon size={11} strokeWidth={1.8} aria-hidden="true" />
      {children}
    </span>
  );
}

/** File list + instructions preview for the middle crop card. */
function CropFilesAndInstructions() {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-col gap-1.5 rounded-[12px] border border-border bg-[var(--paper,#FBFAF7)] px-3 py-2.5"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-tertiary">
          Files trong project
        </span>
        <ul className="flex flex-col gap-1">
          {PROJECT_FILES.map((name) => (
            <li
              key={name}
              className="flex items-center gap-2 text-[12px] text-foreground"
            >
              <FileText
                size={12}
                strokeWidth={1.8}
                aria-hidden="true"
                className="text-tertiary"
              />
              <span className="font-mono">{name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div
        className="flex flex-col gap-1 rounded-[12px] border border-border bg-[var(--paper,#FBFAF7)] px-3 py-2.5"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-tertiary">
          Instructions
        </span>
        <p className="text-[12px] leading-[1.5] text-secondary">
          Trả lời bằng tiếng Việt, giọng thân thiện nhưng gọn. Khi có số liệu,
          trích dẫn từ file gốc. Luôn kết thúc bằng 1 câu hỏi gợi ý bước kế
          tiếp.
        </p>
      </div>
    </div>
  );
}

/** Claude reply that cites a specific filename — used in the third crop. */
function CropCitingReply() {
  return (
    <div
      className="rounded-[12px] bg-[var(--paper,#FBFAF7)] px-4 py-2.5 text-[13px] leading-[1.55] text-foreground"
      style={{ maxWidth: "95%" }}
    >
      {CLAUDE_REPLY_PREFIX}
      <span className="rounded-[4px] bg-[var(--paper-2,#F3F2EE)] px-1 py-0.5 font-mono text-[12px]">
        {CLAUDE_REPLY_FILENAME}
      </span>
      {CLAUDE_REPLY_SUFFIX}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell slot components — shared by hero demo
// ---------------------------------------------------------------------------

const ProjectsTopBar = memo(function ProjectsTopBar() {
  return (
    <div className="flex w-full items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-foreground">
        {ACTIVE_PROJECT_NAME}
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

const ProjectsLeftRail = memo(function ProjectsLeftRail() {
  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-[8px] border border-border bg-card px-2 py-1.5 text-[12px] font-medium text-foreground hover:bg-surface"
      >
        <Plus size={12} strokeWidth={2} aria-hidden="true" />
        New project
      </button>
      <div className="px-1 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-tertiary">
        Projects
      </div>
      <ul className="flex flex-col gap-1">
        {PROJECTS_LIST.map((p) => (
          <li key={p.id}>
            <div
              className={`truncate rounded-[8px] px-2 py-1.5 text-[12px] ${
                p.active
                  ? "bg-[var(--paper,#FBFAF7)] font-medium text-foreground shadow-[var(--shadow-sm)]"
                  : "text-secondary hover:bg-[var(--paper,#FBFAF7)]"
              }`}
            >
              {p.title}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});

const ProjectsMain = memo(function ProjectsMain() {
  return (
    <div className="flex h-full flex-col">
      {/* Project header strip */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-semibold text-foreground">
              {ACTIVE_PROJECT_NAME}
            </span>
            <span className="text-[11px] leading-[1.35] text-tertiary">
              {ACTIVE_PROJECT_DESC}
            </span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-foreground">
            <FileText size={11} strokeWidth={1.8} aria-hidden="true" />
            Files ({PROJECT_FILES.length})
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-foreground">
            <Book size={11} strokeWidth={1.8} aria-hidden="true" />
            Instructions
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-foreground">
            <Brain size={11} strokeWidth={1.8} aria-hidden="true" />
            Memory
          </span>
        </div>
      </div>

      {/* Conversation area */}
      <div className="flex-1 overflow-hidden pt-3">
        <ShellMessage from="user">{USER_QUESTION}</ShellMessage>
        <ShellMessage from="claude">
          <span>
            {CLAUDE_REPLY_PREFIX}
            <span className="rounded-[4px] bg-[var(--paper-2,#F3F2EE)] px-1 py-0.5 font-mono text-[12px]">
              {CLAUDE_REPLY_FILENAME}
            </span>
            {CLAUDE_REPLY_SUFFIX}
          </span>
        </ShellMessage>
      </div>

      <ShellComposerStub placeholder="Hỏi tiếp trong project này..." />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Default export — the full tile
// ---------------------------------------------------------------------------

export default function ProjectsTile() {
  const tile = findTile("projects");
  const viTitle = tile?.viTitle ?? "Workspace (Projects)";

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

      {/* Hero demo */}
      <DemoCanvas
        title={viTitle}
        onPlay={onPlay}
        onReset={onReset}
        onStep={onStep}
        playing={playing}
      >
        <div className="relative">
          <ClaudeDesktopShell
            topBar={<ProjectsTopBar />}
            leftRail={<ProjectsLeftRail />}
            main={<ProjectsMain />}
          />
          <AnnotationLayer annotations={ANNOTATIONS} playhead={playhead} />
        </div>
      </DemoCanvas>

      {/* Honest disclosure link — sends curious users to Anthropic's own
          support page for Projects. Keeps the demo interactive while
          closing the fidelity gap. Pairs with the "Mô phỏng" badge on the
          shell above. */}
      <ViewRealUI
        href="https://support.claude.com/en/articles/9519177-what-are-projects"
        label="Xem trang Projects thật từ Anthropic"
        caption="Mở trang gốc trong tab mới. Giao diện demo được dựng lại theo ảnh chụp ngày 2026-04-19."
      />

      {/* Plan availability — factual disclosure, not decorative. Placed between
          the real-UI link and the "Cách nó hoạt động" deep-dive so users see
          the gating note before reading the mechanism breakdown. */}
      <p
        role="note"
        className="max-w-[62ch] text-[12px] leading-[1.55] text-tertiary"
      >
        Projects có sẵn trên mọi gói (Free tối đa 5 projects). Memory summaries
        xuyên phiên chỉ có từ gói Pro trở lên.
      </p>

      {/* "Cách nó hoạt động" — zoomed crop cards. Three bespoke compositions,
          not mini-shell thumbnails. Each card shows just the relevant UI
          fragment(s) at full card width. */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[22px] font-semibold leading-[1.25] text-foreground md:text-[26px]">
          Cách nó hoạt động
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <CropCard
            title="Bộ nhớ cục bộ cho một mục đích"
            caption="Project bó gọn toàn bộ tư liệu, hướng dẫn và ký ức vào một không gian duy nhất — mỗi chủ đề có chỗ riêng, không đè lên nhau."
          >
            <CropProjectHeader />
            <CropAnnotation pin={2} label="File bạn thêm sẽ luôn có mặt" />
            <CropAnnotation
              pin={3}
              label="Hướng dẫn riêng cho project, dùng lại mỗi chat"
              align="right"
            />
          </CropCard>

          <CropCard
            title="File và hướng dẫn dùng chung"
            caption="File upload một lần, Claude đọc lại cho mọi chat trong project. Instructions đặt giọng văn và quy ước cho mọi câu trả lời."
          >
            <CropFilesAndInstructions />
          </CropCard>

          <CropCard
            title="Files theo project, không phải theo chat"
            caption="File upload vào Projects được dùng xuyên suốt mọi chat trong project — Claude trích dẫn trực tiếp tên file, không cần bạn đính kèm lại mỗi lượt. (Riêng memory summaries cần gói Pro trở lên.)"
          >
            <CropCitingReply />
            <CropAnnotation
              pin={4}
              label="Files luôn sẵn sàng, không cần đính kèm lại"
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
          Bấm nút bên dưới để mở Claude với câu hỏi mẫu — bạn sẽ thấy rõ cách
          Instructions giúp mọi chat trong project nói cùng một ngôn ngữ.
        </p>
        <DeepLinkCTA prompt="Mình đang xây Projects trong Claude — gợi ý 3 cách tổ chức Instructions để đội marketing dùng chung, mỗi cách 1-2 câu." />
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
