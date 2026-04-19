"use client";

/**
 * Claude for Chrome tile — Anthropic's Chrome browser extension that
 * puts Claude in a side panel, lets it see the current page + DOM, and
 * (with your approval) click, fill forms, navigate, and capture
 * screenshots. Hero hiển thị một tab VnExpress mở, Claude side panel
 * trượt vào từ bên phải, và chế độ "Ask before acting" chip hiển thị
 * trên thanh composer.
 *
 * Product naming note: Anthropic's marketing post uses "Claude for
 * Chrome" (blog title), the Chrome Web Store listing says "Claude",
 * and the support help-center article is titled "Getting Started
 * with Claude in Chrome". This tile uses "Claude for Chrome"
 * consistently — matching the registry — and flags the help-center
 * variant here for future readers.
 *
 * ---------------------------------------------------------------------------
 * DOCS GROUNDING (Anthropic sources, snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * Primary — announcement blog post:
 *   https://claude.com/blog/claude-for-chrome
 *   Fetched: 2026-04-19. Carries the launch narrative and the
 *   prompt-injection risk framing:
 *     > "so much work happens in browsers that giving Claude the
 *     >  ability to see what you're looking at, click buttons, and
 *     >  fill forms will make it substantially more useful"
 *     > Prompt-injection classifiers reduce attack success rate from
 *     >  23.6% → 11.2% (Anthropic's published safety figure).
 *
 * Product page:
 *   https://claude.com/claude-for-chrome
 *   Fetched: 2026-04-19. Landing page with install CTA + feature grid.
 *
 * Chrome Web Store listing:
 *   https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn
 *   Fetched: 2026-04-19. Canonical install target.
 *
 * Getting Started (Anthropic support article):
 *   https://support.claude.com/en/articles/12012173-getting-started-with-claude-in-chrome
 *   Fetched: 2026-04-19. Explains pinning via puzzle-piece → thumbtack,
 *   side-panel open flow, "/" shortcut menu, screenshot capture.
 *
 * Permissions Guide (Anthropic support article):
 *   https://support.claude.com/en/articles/12902446-claude-for-chrome-permissions-guide
 *   Fetched: 2026-04-19. Source of truth for the safety model:
 *     - "Ask before acting" (default): Claude makes a plan, user
 *       approves, Claude executes the whole workflow inside the
 *       approved boundary. Vietnamese: "Hỏi trước khi hành động".
 *     - "Act without asking": autonomous. Vietnamese: "Hành động không
 *       cần hỏi". Anthropic's verbatim warning:
 *         > "Using 'Act without asking' significantly increases prompt
 *         >  injection risk. Malicious actors may be able to trick
 *         >  Claude into unintended actions even with our safeguards."
 *     - First visit to a new site → "Permission required" prompt with
 *       "Allow this action" or "Always allow actions on this site".
 *     - "Your approved sites" settings panel lets users revoke per-site.
 *     - ALWAYS requires explicit approval regardless of mode:
 *       purchases / financial transactions, permanent file-or-data
 *       deletion, permission modifications, account creation,
 *       authorization grants.
 *     - Blocked categories regardless of permission: financial
 *       services, adult content, pirated content.
 *
 * Timeline (from blog post, captured 2026-04-19):
 *   - Research preview: 2025-08-25
 *   - Max-plan beta: 2025-11-24
 *   - GA on paid plans: 2025-12-18
 *   - Pro users: Haiku 4.5 only
 *   - Max / Team / Enterprise: Opus 4.6, Sonnet 4.6, or Haiku 4.5
 *
 * Side-panel positioning caveat: Anthropic does not publish pixel
 * dimensions (width / left-vs-right) for the extension's side panel.
 * Modern Chrome side panels default to the right, so the shell uses
 * right-side with a 38% width as a designer reconstruction. The
 * visible `MockBadge` + `ViewRealUI` disclosure cover this gap.
 *
 * ---------------------------------------------------------------------------
 * CONTEXT7 FINDINGS (snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * next.js v16.2.2 (/vercel/next.js/v16.2.2, closest pinned to the
 *   installed v16.2.3): `next/dynamic` with a static `() => import("./X")`
 *   is still the supported pattern. The import path must be a string
 *   literal so the bundler can match bundles. This tile is registered
 *   from `tiles/index.ts` as `dynamic(() => import("./chrome"))`,
 *   matching every Phase-2 tile before it.
 *   (docs/01-app/02-guides/lazy-loading.mdx)
 *
 * react v19.2.0 (/facebook/react/v19_2_0): `memo` wraps static chrome
 *   helpers (tab strip, address bar, page content, side-panel bits)
 *   so they don't re-render on DemoCanvas playhead ticks.
 *
 * framer-motion: no direct motion.* usage here — `AnnotationLayer`
 *   owns all motion (AnimatePresence + pulse).
 */

import { memo } from "react";
import Link from "next/link";
import {
  Puzzle,
  Shield,
  Lock,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import {
  ClaudeChromeShell,
  AskBeforeActingChip,
} from "@/features/claude/components/ClaudeChromeShell";
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
  "Claude for Chrome là tiện ích mở rộng trình duyệt — Claude đọc trang bạn đang xem, mở ra trong side panel bên phải, rồi bấm nút, điền form, chụp màn hình hộ bạn. Mặc định chạy ở chế độ 'Ask before acting' — Claude lập kế hoạch, bạn duyệt, rồi Claude mới thực thi. Đang trong giai đoạn beta, có cho mọi gói trả phí của claude.ai.";

// Canonical URLs (all verified 2026-04-19)
const BLOG_HREF = "https://claude.com/blog/claude-for-chrome";
const PRODUCT_PAGE_HREF = "https://claude.com/claude-for-chrome";
const CHROME_STORE_HREF =
  "https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn";
const GETTING_STARTED_HREF =
  "https://support.claude.com/en/articles/12012173-getting-started-with-claude-in-chrome";
const PERMISSIONS_HREF =
  "https://support.claude.com/en/articles/12902446-claude-for-chrome-permissions-guide";

// Sample URL shown in the address bar — a real VnExpress section path,
// not a fabricated article URL.
const SAMPLE_URL = "vnexpress.net/kinh-doanh/tin-tuc";

// Sample article title — clearly generic (quarter / year reference),
// NOT quoting a real VnExpress story. The PageContent block pairs this
// with a disclosure caption so readers know it's a simulated article.
const SAMPLE_ARTICLE_TITLE = "Thị trường Việt Nam quý 1 năm 2026";

// Demo prompt + response bullets — kept deliberately generic so we don't
// fabricate statistics or invent a real story's content. Bullets are
// phrased by paragraph position ("mở đầu", "giữa", "kết") rather than
// by made-up numbers or quotes.
const USER_PROMPT = "Tóm tắt bài báo này cho mình thành 3 ý chính.";
const CLAUDE_RESPONSE_INTRO =
  "Bài báo nói về ba điểm chính — mình tóm tắt theo thứ tự xuất hiện trên trang:";
const CLAUDE_BULLETS = [
  "Theo đoạn mở đầu, bài viết giới thiệu bối cảnh kinh doanh của quý và các chỉ số chính được nhắc đến.",
  "Đoạn giữa phân tích lý do biến động và dẫn lời chuyên gia được báo trích trong bài.",
  "Đoạn kết nêu dự báo ngắn hạn và cảnh báo những rủi ro mà bài báo nhấn mạnh.",
];

// ---------------------------------------------------------------------------
// Annotations (4 pins) — anchors are percent of the FULL Chrome shell
// (tab strip + address bar + body)
// ---------------------------------------------------------------------------
//
// Chrome-shell calibration notes (2026-04-19):
//   - Shell chrome: 36px tab strip + 40px address-bar row + body.
//   - Body is ~62%/38% split — page on the left, Claude side panel on
//     the right.
//   - Pin 1 (address bar, URL input) → x:28, y:10 — Claude reads the
//     page you're on, no copy-paste.
//   - Pin 2 (pinned Claude icon in toolbar) → x:58, y:10 — click to
//     open side panel; pin via puzzle-piece for quick access.
//   - Pin 3 (side panel body, where Claude's answer renders) → x:80,
//     y:35 — panel slides in from the right, separate from the page.
//   - Pin 4 ("Ask before acting" chip in side-panel top bar) → x:72,
//     y:20 — default permission mode; "Act without asking" is faster
//     but Anthropic warns of higher prompt-injection risk.
//
const ANNOTATIONS: Annotation[] = [
  {
    id: "url",
    pin: 1,
    label: "Trang bạn đang xem",
    description:
      "Claude đọc thẳng URL + DOM của tab hiện tại — bạn không phải copy-paste nội dung sang chỗ khác. Đây là khác biệt lớn so với chat thường.",
    showAt: [0.0, 0.5],
    anchor: { x: 28, y: 10 },
  },
  {
    id: "pinned-icon",
    pin: 2,
    label: "Biểu tượng Claude trên thanh công cụ",
    description:
      "Một cú bấm là mở Claude ở dạng side panel. Mẹo: ghim biểu tượng qua nút puzzle-piece → thumbtack để luôn thấy nó trên thanh công cụ.",
    showAt: [0.0, 0.5],
    anchor: { x: 58, y: 10 },
  },
  {
    id: "side-panel",
    pin: 3,
    label: "Panel Claude trượt vào từ bên phải",
    description:
      "Panel tách khỏi nội dung trang — Claude nhìn thấy tab nhưng câu trả lời hiển thị bên đây, không chèn lên trang gốc. Bạn vẫn đọc được trang trong khi Claude xử lý.",
    showAt: [0.25, 0.85],
    anchor: { x: 80, y: 35 },
  },
  {
    id: "ask-before-acting",
    pin: 4,
    label: "Chế độ 'Ask before acting' — mặc định",
    description:
      "Claude lập kế hoạch → chờ bạn duyệt → thực thi trong giới hạn đã duyệt. Chế độ 'Act without asking' nhanh hơn nhưng Anthropic cảnh báo rủi ro prompt injection tăng rõ rệt.",
    showAt: [0.55, 1.0],
    anchor: { x: 72, y: 20 },
  },
];

const CROSS_LINKS: Array<{ href: string; title: string; blurb: string }> = [
  {
    href: "/claude/web-search",
    title: "Web Search",
    blurb:
      "Web Search trả kết quả có trích dẫn trong chat thường — còn Claude for Chrome đi ngược lại: bạn đang ở trên một trang, Claude đọc trang đó thay vì đi tìm thêm nguồn. Hai cách khác nhau để lấy thông tin tươi vào câu trả lời.",
  },
  {
    href: "/claude/files-vision",
    title: "Files & Vision",
    blurb:
      "Files & Vision đọc PDF / ảnh / bảng tính bạn tải lên chat. Chrome mở rộng điều đó sang trang web trực tiếp — cùng mô hình vision để 'thấy' nội dung, khác kênh nhập liệu.",
  },
  {
    href: "/claude/projects",
    title: "Workspace (Projects)",
    blurb:
      "Projects giữ ngữ cảnh dài hạn cho một việc. Bạn có thể kết hợp: bật Chrome để Claude thu thông tin từ các trang đang đọc, rồi đẩy vào project làm nguồn tham chiếu cho cuộc thảo luận sau.",
  },
];

// ---------------------------------------------------------------------------
// Chrome top-bar helpers (render inside ClaudeChromeShell slots)
// ---------------------------------------------------------------------------

// The tab strip + address bar are rendered by the shell itself — the
// tile only needs to pass `url` and `tabLabels` down. We keep the two
// names exported as memoized helpers for future tiles that want to
// customize the look, but the hero just uses shell defaults.

// ---------------------------------------------------------------------------
// PageContent — the simulated webpage inside the main area
// ---------------------------------------------------------------------------
//
// Design goals:
//   - Look like a Vietnamese news-site article preview WITHOUT fabricating
//     the body text. We use gray-rect placeholders for paragraphs +
//     figure so we don't invent statistics or quotes.
//   - Add a visible disclosure caption at the bottom that says the
//     article is simulated. The caption is the only text inside the
//     page block that's read by assistive tech — everything else is
//     wrapped in aria-hidden so the side panel is the focus.
//
const PageContent = memo(function PageContent() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Site header — chrome-free, just the logo text */}
      <div
        aria-hidden="true"
        className="flex items-center justify-between border-b border-border px-4 py-2"
        style={{ background: "var(--pure-white, #FFFFFF)" }}
      >
        <span className="text-[12px] font-bold text-foreground">
          VnExpress
        </span>
        <span className="text-[10px] text-tertiary">Kinh doanh</span>
      </div>

      {/* Article body */}
      <div
        aria-hidden="true"
        className="flex flex-col gap-3 overflow-hidden px-5 py-4"
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.08em] text-tertiary">
          Kinh doanh · Thị trường
        </div>
        <div className="text-[15px] font-semibold leading-[1.3] text-foreground">
          {SAMPLE_ARTICLE_TITLE}
        </div>
        <div className="text-[10px] text-tertiary">
          Tác giả giả lập · 19/4/2026
        </div>

        {/* Figure placeholder — rounded rect */}
        <div
          className="rounded-[8px] border border-border"
          style={{
            height: 96,
            background:
              "linear-gradient(135deg, rgba(19,52,59,0.08), rgba(19,52,59,0.03))",
          }}
        />

        {/* Paragraph skeleton — rows of gray rects, NOT fake body text.
            Keeps the page "read-like" without inventing numbers / quotes. */}
        <div className="flex flex-col gap-1.5">
          <span
            className="block rounded"
            style={{
              height: 8,
              width: "96%",
              background: "rgba(19,52,59,0.12)",
            }}
          />
          <span
            className="block rounded"
            style={{
              height: 8,
              width: "92%",
              background: "rgba(19,52,59,0.10)",
            }}
          />
          <span
            className="block rounded"
            style={{
              height: 8,
              width: "78%",
              background: "rgba(19,52,59,0.10)",
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span
            className="block rounded"
            style={{
              height: 8,
              width: "94%",
              background: "rgba(19,52,59,0.10)",
            }}
          />
          <span
            className="block rounded"
            style={{
              height: 8,
              width: "88%",
              background: "rgba(19,52,59,0.10)",
            }}
          />
          <span
            className="block rounded"
            style={{
              height: 8,
              width: "62%",
              background: "rgba(19,52,59,0.08)",
            }}
          />
        </div>
      </div>

      {/* Disclosure caption — the ONE readable line on the page so
          assistive tech users know the page is simulated. */}
      <p className="mt-auto border-t border-border px-5 py-2 text-[10px] leading-[1.45] text-tertiary">
        Trang mô phỏng minh hoạ — không phải bài báo thật trên VnExpress.
      </p>
    </div>
  );
});

// ---------------------------------------------------------------------------
// SidePanelTopBar — "Claude" label + Ask-before-acting chip + settings glyph
// ---------------------------------------------------------------------------

const SidePanelTopBar = memo(function SidePanelTopBar() {
  return (
    <div className="flex w-full items-center gap-2">
      <span className="text-[11px] font-semibold text-foreground">Claude</span>
      <AskBeforeActingChip />
      <span
        aria-label="Cài đặt panel"
        role="img"
        className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-[var(--pure-white,#FFFFFF)] text-tertiary"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width={11}
          height={11}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
        >
          <circle cx="3.5" cy="8" r="1" />
          <circle cx="8" cy="8" r="1" />
          <circle cx="12.5" cy="8" r="1" />
        </svg>
      </span>
    </div>
  );
});

// ---------------------------------------------------------------------------
// SidePanelBody — user prompt + Claude response bubbles + source footer
// ---------------------------------------------------------------------------

const SidePanelBody = memo(function SidePanelBody() {
  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      <div className="px-1 pb-1 text-[9px] font-mono uppercase tracking-[0.08em] text-tertiary">
        Trợ lý Claude · Hội thoại
      </div>

      {/* User bubble */}
      <div className="ml-auto max-w-[92%] rounded-[10px] bg-foreground px-3 py-2 text-[12px] leading-[1.5] text-background">
        {USER_PROMPT}
      </div>

      {/* Claude response bubble */}
      <div
        className="max-w-[95%] rounded-[10px] bg-[var(--pure-white,#FFFFFF)] px-3 py-2 text-[12px] leading-[1.5] text-foreground"
        style={{ border: "1px solid var(--border)" }}
      >
        <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.06em] text-tertiary">
          <Sparkles size={10} strokeWidth={1.8} aria-hidden="true" />
          Claude
        </span>
        <div>{CLAUDE_RESPONSE_INTRO}</div>
        <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-4 text-[11.5px] leading-[1.45]">
          {CLAUDE_BULLETS.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ol>
      </div>

      {/* Source footer */}
      <div className="mt-auto flex items-center gap-1.5 rounded-[8px] border border-border bg-[var(--paper-2,#F3F2EE)] px-2 py-1 text-[10px] text-tertiary">
        <Lock size={10} strokeWidth={1.8} aria-hidden="true" />
        nguồn: trang hiện tại
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// SidePanelComposer — borderless input stub + send icon
// ---------------------------------------------------------------------------

const SidePanelComposer = memo(function SidePanelComposer() {
  return (
    <div
      className="flex items-center gap-2 rounded-[10px] border border-border bg-[var(--pure-white,#FFFFFF)] px-2.5 py-1.5"
    >
      <MessageSquare
        size={12}
        strokeWidth={1.8}
        aria-hidden="true"
        className="text-tertiary"
      />
      <span className="flex-1 text-[11px] text-tertiary">
        Nhập hoặc gõ &lsquo;/&rsquo; để xem shortcut...
      </span>
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width={9}
          height={9}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8 L13 8 M9 4 L13 8 L9 12" />
        </svg>
      </span>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Default export — the full tile
// ---------------------------------------------------------------------------

export default function ClaudeChromeTile() {
  const tile = findTile("chrome");
  const viTitle = tile?.viTitle ?? "Claude for Chrome";

  // Two distinct phases: URL/icon reveal → side-panel + ask-before-acting.
  // 7s sweep matches Claude Design pacing so readers have time to parse
  // both the browser chrome and the side-panel content.
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

      {/* Hero demo — Chrome shell with page + side panel */}
      <DemoCanvas
        title={viTitle}
        onPlay={onPlay}
        onReset={onReset}
        onStep={onStep}
        playing={playing}
      >
        <div className="relative">
          <ClaudeChromeShell
            url={SAMPLE_URL}
            tabLabels={["VnExpress — Kinh doanh", "Gmail"]}
            mainContent={<PageContent />}
            sidePanelTopBar={<SidePanelTopBar />}
            sidePanelBody={<SidePanelBody />}
            sidePanelComposer={<SidePanelComposer />}
          />
          <AnnotationLayer annotations={ANNOTATIONS} playhead={playhead} />
        </div>
      </DemoCanvas>

      {/* Honest disclosure — link to Anthropic's announcement post. */}
      <ViewRealUI
        href={BLOG_HREF}
        label="Đọc thông báo Claude for Chrome từ Anthropic"
        caption="Mở bài giới thiệu gốc từ Anthropic (ảnh chụp 2026-04-19). Mô tả đầy đủ mô hình quyền, rủi ro prompt injection, và các mốc phát hành."
      />

      {/* Plan-availability note */}
      <p
        role="note"
        className="max-w-[62ch] text-[12px] leading-[1.55] text-tertiary"
      >
        Claude for Chrome hiện ở giai đoạn beta, có cho mọi gói trả
        phí của claude.ai — Pro, Max, Team và Enterprise. Tiến trình
        ra mắt: bản research preview ngày 25/8/2025, mở beta cho gói
        Max ngày 24/11/2025, và mở rộng cho toàn bộ gói trả phí ngày
        18/12/2025. Người dùng Pro hiện chỉ dùng Haiku 4.5 bên trong
        extension; người dùng Max, Team, Enterprise có thể chọn Opus
        4.6, Sonnet 4.6 hoặc Haiku 4.5. Cài đặt miễn phí tại{" "}
        <a
          href={CHROME_STORE_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-border underline-offset-2 hover:text-foreground"
        >
          Chrome Web Store
        </a>
        ; xem trang giới thiệu sản phẩm tại{" "}
        <a
          href={PRODUCT_PAGE_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-border underline-offset-2 hover:text-foreground"
        >
          claude.com/claude-for-chrome
        </a>
        . Hướng dẫn bắt đầu có ở bài{" "}
        <a
          href={GETTING_STARTED_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-border underline-offset-2 hover:text-foreground"
        >
          Getting Started with Claude in Chrome
        </a>
        ; chi tiết về mô hình quyền ở bài{" "}
        <a
          href={PERMISSIONS_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-border underline-offset-2 hover:text-foreground"
        >
          Claude for Chrome Permissions Guide
        </a>
        . Vì đang trong beta, UI và tính năng có thể thay đổi — tile
        này đối chiếu với tư liệu ngày 19/4/2026.
      </p>

      {/* Safety disclosure block */}
      <section
        aria-label="Lưu ý an toàn"
        className="flex flex-col gap-3 rounded-[14px] border border-border bg-[var(--paper-2,#F3F2EE)] p-5"
      >
        <div className="flex items-center gap-2">
          <Shield
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
            className="text-foreground"
          />
          <h2 className="text-[16px] font-semibold text-foreground">
            An toàn khi để Claude điều khiển trình duyệt
          </h2>
        </div>
        <p className="max-w-[66ch] text-[13.5px] leading-[1.55] text-secondary">
          Claude for Chrome có hai chế độ quyền, chọn qua dropdown trên
          thanh composer của panel:
        </p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-[1.55] text-secondary">
          <li>
            <span className="font-semibold text-foreground">
              Ask before acting (mặc định)
            </span>{" "}
            — Claude lập kế hoạch trước, chờ bạn bấm duyệt, rồi mới
            thực thi toàn bộ bước trong phạm vi đã duyệt. Đây là chế
            độ Anthropic khuyến khích cho người mới.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Act without asking
            </span>{" "}
            — Claude hành động tự chủ, không hỏi từng bước. Anthropic
            cảnh báo nguyên văn:{" "}
            <em>
              &ldquo;Using &lsquo;Act without asking&rsquo; significantly
              increases prompt injection risk. Malicious actors may be
              able to trick Claude into unintended actions even with
              our safeguards.&rdquo;
            </em>{" "}
            Theo số liệu Anthropic công bố, bộ phân loại prompt
            injection đã kéo tỉ lệ tấn công thành công từ 23.6% xuống
            còn 11.2% — tốt hơn đáng kể nhưng không về 0.
          </li>
        </ul>
        <p className="max-w-[66ch] text-[13.5px] leading-[1.55] text-secondary">
          Lần đầu Claude chạm vào một site mới, panel luôn hiện hộp
          &ldquo;Permission required&rdquo; với hai lựa chọn:{" "}
          <em>Allow this action</em> (duyệt một lần) hoặc{" "}
          <em>Always allow actions on this site</em> (duyệt luôn cho
          site đó). Bạn thu hồi quyền từng site bất kỳ lúc nào trong
          phần &ldquo;Your approved sites&rdquo; của cài đặt extension.
        </p>
        <p className="max-w-[66ch] text-[13.5px] leading-[1.55] text-secondary">
          Các hành động sau <span className="font-semibold">luôn</span>{" "}
          cần bạn bấm duyệt, bất kể đang ở chế độ nào:
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-[13.5px] leading-[1.55] text-secondary">
          <li>Mua hàng hoặc giao dịch tài chính.</li>
          <li>Xoá file hoặc dữ liệu vĩnh viễn.</li>
          <li>Thay đổi quyền (permissions) của tài khoản hoặc site.</li>
          <li>Tạo tài khoản mới.</li>
          <li>Cấp phép truy cập (authorization grants) cho bên thứ ba.</li>
        </ul>
        <p className="max-w-[66ch] text-[13.5px] leading-[1.55] text-secondary">
          Anthropic chặn sẵn toàn bộ ba nhóm site bất kể bạn chọn chế
          độ nào: dịch vụ tài chính, nội dung người lớn, và nội dung
          vi phạm bản quyền.
        </p>
        <p className="max-w-[66ch] text-[13.5px] leading-[1.55] text-foreground">
          Lời khuyên của Anthropic: bắt đầu với{" "}
          <span className="font-semibold">Ask before acting</span> và
          chỉ dùng trên các site bạn thật sự tin cậy. Khi đã quen rồi,
          cân nhắc cẩn trọng trước khi chuyển sang Act without asking.
        </p>
      </section>

      {/* "Cách nó hoạt động" — 3 CropCards */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[22px] font-semibold leading-[1.25] text-foreground md:text-[26px]">
          Cách nó hoạt động
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {/* 1 — Install & pin */}
          <CropCard
            title="Bước 1 — Cài + ghim biểu tượng"
            caption="Vào Chrome Web Store, bấm Add to Chrome. Sau khi cài, mở menu puzzle-piece trên thanh công cụ, tìm Claude và bấm thumbtack để ghim. Kể từ đó, biểu tượng Claude luôn hiện trên toolbar — một cú bấm là mở side panel."
          >
            <div className="flex items-center gap-3 rounded-[10px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-2.5">
              <span
                aria-label="Biểu tượng tiện ích mở rộng"
                role="img"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-tertiary"
                style={{ background: "var(--paper-2,#F3F2EE)" }}
              >
                <Puzzle size={13} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span aria-hidden="true" className="text-[10px] text-tertiary">
                →
              </span>
              <span
                aria-label="Biểu tượng Claude đã ghim"
                role="img"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-[12px] font-semibold text-foreground"
                style={{
                  background: "var(--pure-white, #FFFFFF)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                C
              </span>
              <span className="text-[11px] text-tertiary">
                Ghim Claude lên toolbar
              </span>
            </div>
            <CropAnnotation pin={1} label="Cài đặt → ghim biểu tượng" />
          </CropCard>

          {/* 2 — Permission model — Ask before acting vs Act without asking */}
          <CropCard
            title="Bước 2 — Chọn chế độ quyền"
            caption="Dropdown trên thanh composer của panel chọn giữa 'Ask before acting' (mặc định, an toàn hơn) và 'Act without asking' (nhanh hơn, rủi ro prompt injection cao hơn theo cảnh báo của Anthropic). Mặc định nên để Ask before acting cho đến khi bạn biết rõ site mình đang dùng."
          >
            <div className="flex flex-col gap-2 rounded-[10px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-2.5">
              <AskBeforeActingChip />
              <AskBeforeActingChip label="Act without asking" />
              <p className="text-[10px] leading-[1.45] text-tertiary">
                &ldquo;Act without asking significantly increases prompt
                injection risk.&rdquo; — Anthropic
              </p>
            </div>
            <CropAnnotation pin={2} label="Ask trước → duyệt → thực thi" />
          </CropCard>

          {/* 3 — Scheduled tasks / recurring browser workflows */}
          <CropCard
            title="Bước 3 — Tác vụ định kỳ trong trình duyệt"
            caption="Claude for Chrome có thể chạy scheduled tasks — các workflow trình duyệt lặp lại (ví dụ: theo dõi một báo cáo, tóm tắt dashboard mỗi sáng). Caption này mô tả tính năng; không chụp lại UI đặt lịch, do giao diện có thể đổi trong beta."
          >
            <div className="flex flex-col gap-1.5 rounded-[10px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-2.5">
              <div className="flex items-center gap-2 text-[11px] text-foreground">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--turquoise-500, #20B8B0)" }}
                />
                Mỗi sáng 8:00 — tóm tắt dashboard KPI
              </div>
              <div className="flex items-center gap-2 text-[11px] text-tertiary">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "rgba(19,52,59,0.25)" }}
                />
                Mỗi thứ hai — kiểm kho
              </div>
            </div>
            <CropAnnotation
              pin={3}
              label="Workflow lặp lại, có thể dừng / sửa bất kỳ lúc nào"
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
          Nút bên dưới mở chat Claude thường ở claude.ai/new —{" "}
          <span className="font-semibold">không phải</span> Claude for
          Chrome. Để dùng Claude trong trình duyệt (đọc tab bạn đang
          xem, bấm nút, điền form), bạn cần cài extension riêng từ
          Chrome Web Store.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <DeepLinkCTA prompt="Giúp mình lên dàn ý tóm tắt một bài báo thành 3 ý chính — mở đầu, giữa, kết — bằng tiếng Việt tự nhiên." />
          <a
            href={CHROME_STORE_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-foreground bg-[var(--pure-white,#FFFFFF)] px-4 py-2 text-[13px] font-medium text-foreground transition-transform hover:translate-y-[-1px]"
          >
            <Puzzle size={14} strokeWidth={2} aria-hidden="true" />
            Cài Claude for Chrome từ Web Store
            <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* Liên quan — only tiles currently status: "ready" */}
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
