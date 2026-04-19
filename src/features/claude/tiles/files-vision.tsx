"use client";

/**
 * Files & Vision tile — Claude Desktop PDF/image upload demo.
 *
 * ---------------------------------------------------------------------------
 * DOCS GROUNDING (Anthropic sources, snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * Source: https://platform.claude.com/docs/en/build-with-claude/pdf-support
 * Fetched: 2026-04-19
 *
 *   Quote 1 (what Claude extracts from PDFs):
 *   > "You can ask Claude about any text, pictures, charts, and tables
 *   >  in PDFs you provide."
 *
 *   Quote 2 (example use cases):
 *   > "Analyzing financial reports and understanding charts/tables"
 *
 *   Quote 3 (how PDF support works — two-pass text + image):
 *   > "Documents are provided as a combination of text and images for
 *   >  analysis. This allows users to ask for insights on visual elements
 *   >  of a PDF, such as charts, diagrams, and other non-textual content."
 *
 *   Quote 4 (PDF request limits):
 *   > "Maximum request size | 32 MB ... Maximum pages per request | 600
 *   >  (100 for models with a 200k-token context window) ... Format |
 *   >  Standard PDF (no passwords/encryption)"
 *
 * Source: https://platform.claude.com/docs/en/build-with-claude/vision
 * Fetched: 2026-04-19
 *
 *   Quote 5 (how to upload on claude.ai):
 *   > "Upload an image like you would a file, or drag and drop an image
 *   >  directly into the chat window."
 *
 *   Quote 6 (image format list):
 *   > "Use a supported image format: JPEG, PNG, GIF, or WebP."
 *
 *   Quote 7 (image limits on claude.ai):
 *   > "The maximal number of images per message or request is: 20 per
 *   >  message on claude.ai ... The maximal dimensions per image are
 *   >  8000x8000 px."
 *
 * Source: https://support.claude.com/en/articles/8241126-upload-content-to-claude-ai
 * Fetched: 2026-04-19
 *
 *   Quote 8 (file types supported in claude.ai):
 *   > "Documents: PDF, DOCX, CSV, TXT, HTML, ODT, RTF, EPUB, JSON, XLSX.
 *   >  Images: JPEG, PNG, GIF, WebP."
 *
 *   Quote 9 (extraction behavior):
 *   > "Claude extracts text only from [non-PDF documents]. For PDFs,
 *   >  Claude analyzes both text and visual elements (like images, charts,
 *   >  and graphics)."
 *
 *   Quote 10 (size limits on claude.ai):
 *   > "File size: 30MB per file. Number of files: Up to 20 files per chat."
 *
 *   Quote 11 (XLSX plan gating — the one feature flag we mention):
 *   > "You must enable code execution and file creation in your account
 *   >  to upload XLSX files."
 *
 * Canonical URL used by ViewRealUI is the Anthropic PDF-support docs page.
 * The support article 8241126-upload-content-to-claude-ai is reachable and
 * is the source of quotes 8–11 above. ViewRealUI still points at the
 * platform PDF-support docs because they're the richer canonical reference
 * for a PDF-forward tile — covering text+visual analysis, supported
 * formats, and size limits in one page.
 *
 * ---------------------------------------------------------------------------
 * CONTEXT7 FINDINGS (snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * next.js v16.2.2 (/vercel/next.js/v16.2.2, closest pinned version to the
 *   installed v16.2.3): `next/dynamic` import path MUST be a static string
 *   literal — "Additionally, the `dynamic()` call must be placed at the top
 *   level of the module to allow for proper preloading and bundle matching."
 *   This tile is lazy-loaded from `tiles/index.ts` as
 *   `dynamic(() => import("./files-vision"))`. No template literals.
 *   (docs/01-app/02-guides/lazy-loading.mdx)
 *
 * framer-motion (/grx7/framer-motion): no direct usage here — AnnotationLayer
 *   owns the `AnimatePresence` + `motion.*` entrance/pulse inherited from
 *   commit a10d8d6. This tile consumes that polish by passing `playhead`
 *   to `<AnnotationLayer />`; reduced-motion respect lives in that layer
 *   via `useReducedMotion()`, not here.
 *
 * react v19.2.0 (/facebook/react/v19_2_0): `memo` wrappers on the three
 *   shell-slot components keep the static shell chrome from re-rendering
 *   when the hero DemoCanvas re-renders on playhead ticks. Same pattern
 *   as chat / projects / artifacts tiles.
 */

import { memo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Settings,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
} from "lucide-react";

import {
  ClaudeDesktopShell,
  ShellMessage,
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
  "Kéo thả file PDF hoặc ảnh vào chat là xong — Claude đọc cả chữ, bảng biểu, biểu đồ và hình minh hoạ bên trong, không cần bạn copy nội dung ra dạng chữ.";

const ACTIVE_CHAT_TITLE = "Tóm tắt báo cáo tài chính Q1";

const PDF_FILENAME = "bao-cao-tai-chinh-q1.pdf";
const PDF_PAGE_COUNT = "12 trang · 2,4 MB";

const USER_QUESTION =
  "Tóm tắt doanh thu và chi phí từ file này giúp mình, kèm số trang nguồn để mình kiểm tra lại.";

const CLAUDE_INTRO =
  "Mình đã đọc xong 12 trang báo cáo. Tóm tắt nhanh ba con số chính:";

const CLAUDE_REVENUE_LABEL = "Doanh thu Q1";
const CLAUDE_REVENUE_VALUE = "184,2 tỷ đồng";
const CLAUDE_COST_LABEL = "Chi phí vận hành";
const CLAUDE_COST_VALUE = "121,7 tỷ đồng";
const CLAUDE_MARGIN_LABEL = "Biên lợi nhuận gộp";
const CLAUDE_MARGIN_VALUE = "33,9 %";

const CLAUDE_SOURCE_LINE =
  "Số liệu trích từ Bảng 2 — trang 4 và Biểu đồ 1 — trang 7 của báo cáo.";

const CHAT_HISTORY: Array<{ id: string; title: string; active?: boolean }> = [
  { id: "q1", title: ACTIVE_CHAT_TITLE, active: true },
  { id: "slide", title: "Ảnh biểu đồ khách hàng mới" },
];

// Anchor calibration notes (2026-04-19):
//   - Shell layout: top bar 44px; left rail 248px; no artifacts panel.
//     Main column fills from ~22% to 100% of shell width.
//   - Pin 1 (attachment chip above composer): sits just above the composer
//     stub near the bottom of main → x:42, y:78.
//   - Pin 2 (filename + page count inside the chip): same row, further right
//     → x:54, y:78.
//   - Pin 3 (extracted revenue value in Claude's reply): upper-left of
//     Claude's bubble, inline with the first stat row → x:32, y:46.
//   - Pin 4 (source-citation line at bottom of Claude's reply) → x:44, y:60.
const ANNOTATIONS: Annotation[] = [
  {
    id: "drag-drop",
    pin: 1,
    label: "Kéo thả file vào chat",
    description:
      "Thả PDF hoặc ảnh trực tiếp vào cửa sổ chat — không cần mở menu. Một chip đính kèm xuất hiện ngay phía trên ô soạn tin để bạn xác nhận đã gửi đúng file.",
    showAt: [0.0, 0.55],
    anchor: { x: 42, y: 78 },
  },
  {
    id: "file-meta",
    pin: 2,
    label: "Claude đọc toàn bộ PDF",
    description:
      "Tên file kèm số trang và dung lượng. Theo tài liệu Anthropic, Claude đọc được PDF tối đa 32 MB và 600 trang mỗi yêu cầu — đủ cho hầu hết báo cáo, hợp đồng, sách giáo trình.",
    showAt: [0.0, 0.55],
    anchor: { x: 54, y: 78 },
  },
  {
    id: "extracted-number",
    pin: 3,
    label: "Số liệu tự trích từ file",
    description:
      "Claude phân tích cả chữ lẫn hình trong PDF. Con số này đến từ một bảng trong báo cáo, không phải bạn gõ tay — và cũng không phải Claude đoán từ ngữ cảnh.",
    showAt: [0.5, 1.0],
    anchor: { x: 32, y: 46 },
  },
  {
    id: "source-citation",
    pin: 4,
    label: "Claude chỉ rõ trang gốc khi bạn hỏi",
    description:
      "Khi bạn yêu cầu, Claude chỉ cho bạn trang và vị trí trong PDF — giúp bạn kiểm tra lại hoặc đọc nguyên gốc. Đây là hành vi theo yêu cầu, không mặc định.",
    showAt: [0.5, 1.0],
    anchor: { x: 44, y: 60 },
  },
];

const CROSS_LINKS: Array<{ href: string; title: string; blurb: string }> = [
  {
    href: "/claude/chat",
    title: "Chat + phản hồi trực tiếp",
    blurb: "Cùng một ô chat, thêm file là Claude tự chuyển qua đọc tài liệu.",
  },
  {
    href: "/claude/artifacts",
    title: "Artifacts",
    blurb:
      "Sau khi đọc file, Claude có thể tạo bảng tổng hợp mở trong Artifacts.",
  },
  {
    href: "/claude/projects",
    title: "Workspace (Projects)",
    blurb:
      "Lưu file dùng đi dùng lại trong Projects — Claude nhớ ngữ cảnh cả dự án.",
  },
];

// ---------------------------------------------------------------------------
// Shell slot components — memoized for DemoCanvas playhead ticks
// ---------------------------------------------------------------------------

const FilesVisionTopBar = memo(function FilesVisionTopBar() {
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

const FilesVisionLeftRail = memo(function FilesVisionLeftRail() {
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
 * PDF attachment chip — shown attached to the user's message AND inside the
 * composer (to convey "dropped into composer, sent with the message"). Uses
 * lucide `FileText` rather than an emoji; paper-white background with a
 * subtle ring to mimic the real chip.
 */
function PdfChip({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[10px] border border-border bg-[var(--pure-white,#FFFFFF)] text-foreground ${
        compact ? "px-2 py-1" : "px-2.5 py-1.5"
      }`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-[var(--paper-2,#F3F2EE)] text-tertiary"
      >
        <FileText size={13} strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[12px] font-medium leading-tight">
          {PDF_FILENAME}
        </span>
        <span className="truncate text-[11px] leading-tight text-tertiary">
          {PDF_PAGE_COUNT}
        </span>
      </span>
    </span>
  );
}

/**
 * A compact "stat row" used in Claude's reply to present extracted numbers
 * with some visual hierarchy — label on the left, bold value on the right.
 * Keeps the demo legible at shell-size without needing a full table.
 */
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-2">
      <span className="text-[12px] text-tertiary">{label}</span>
      <span className="font-mono text-[13px] font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

/**
 * Composer stub that shows an attached-file chip floating above a "+"
 * upload affordance + the placeholder text. Mimics the real Claude Desktop
 * look where files live in a band above the text input until sent.
 */
function FilesVisionComposer() {
  return (
    <div
      className="mx-4 mb-4 border border-border bg-[var(--pure-white,#FFFFFF)]"
      style={{ borderRadius: 14, boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <PdfChip compact />
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-tertiary"
          aria-hidden="true"
        >
          <Plus size={12} strokeWidth={2} />
        </span>
        <span className="text-[13px] text-tertiary">
          Hỏi tiếp về file này...
        </span>
      </div>
    </div>
  );
}

const FilesVisionMain = memo(function FilesVisionMain() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden pt-3">
        <ShellMessage from="user">
          {/* ShellMessage wraps children in a <div>, so block-level children
              are valid. Using <div> instead of <span> avoids div-in-span
              HTML nesting violations that browsers silently repair. */}
          <div className="mb-2 flex">
            <PdfChip />
          </div>
          <div>{USER_QUESTION}</div>
        </ShellMessage>
        <ShellMessage from="claude">
          <div>{CLAUDE_INTRO}</div>
          <div className="mt-2 flex flex-col gap-1.5">
            <StatRow label={CLAUDE_REVENUE_LABEL} value={CLAUDE_REVENUE_VALUE} />
            <StatRow label={CLAUDE_COST_LABEL} value={CLAUDE_COST_VALUE} />
            <StatRow label={CLAUDE_MARGIN_LABEL} value={CLAUDE_MARGIN_VALUE} />
          </div>
          <div className="mt-2 text-[12px] italic text-tertiary">
            {CLAUDE_SOURCE_LINE}
          </div>
        </ShellMessage>
      </div>
      <FilesVisionComposer />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Default export — the full tile
// ---------------------------------------------------------------------------

export default function FilesVisionTile() {
  const tile = findTile("files-vision");
  const viTitle = tile?.viTitle ?? "Files & Vision";

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

      {/* Hero demo — full shell, file attachment rendered inline in main */}
      <DemoCanvas
        title={viTitle}
        onPlay={onPlay}
        onReset={onReset}
        onStep={onStep}
        playing={playing}
      >
        <div className="relative">
          <ClaudeDesktopShell
            topBar={<FilesVisionTopBar />}
            leftRail={<FilesVisionLeftRail />}
            main={<FilesVisionMain />}
          />
          <AnnotationLayer annotations={ANNOTATIONS} playhead={playhead} />
        </div>
      </DemoCanvas>

      {/* Honest disclosure — Anthropic's PDF-support docs are the richest
          canonical public reference for the three claims this tile makes
          (text+visual extraction, supported formats, size limits). */}
      <ViewRealUI
        href="https://docs.claude.com/en/docs/build-with-claude/pdf-support"
        label="Xem tài liệu gốc của Anthropic về đọc PDF"
        caption="Mở trang Anthropic Docs trong tab mới. Giao diện demo được dựng lại dựa trên tài liệu này, ảnh chụp ngày 2026-04-19."
      />

      {/* Plan-availability note — grounds the size caps and the one feature
          flag we know about (XLSX requires code execution / file creation
          to be enabled). Sources: support article 8241126 + platform docs
          vision/pdf-support, fetched 2026-04-19. */}
      <p
        role="note"
        className="max-w-[62ch] text-[12px] leading-[1.55] text-tertiary"
      >
        Trong claude.ai: PDF, DOCX, CSV, TXT, HTML, ODT, RTF, EPUB, JSON, XLSX
        và ảnh JPEG/PNG/GIF/WebP đều tải lên được — tối đa 30 MB mỗi file và 20
        file mỗi cuộc chat. File XLSX cần bật hai tính năng Code execution và
        File creation trong cài đặt Claude. Với API, PDF có giới hạn 32 MB và
        600 trang mỗi yêu cầu.
      </p>

      {/* "Cách nó hoạt động" — three crop cards built from shared primitives. */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[22px] font-semibold leading-[1.25] text-foreground md:text-[26px]">
          Cách nó hoạt động
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <CropCard
            title="Những loại file Claude đọc được"
            caption="Anthropic liệt kê PDF, DOCX, CSV, TXT, HTML, ODT, RTF, EPUB, JSON, XLSX cho tài liệu; JPEG, PNG, GIF, WebP cho ảnh. Với file không phải PDF, Claude trích chữ; PDF và ảnh thì đọc cả phần hình."
          >
            <div
              className="flex flex-col gap-2 rounded-[12px] border border-border bg-[var(--paper,#FBFAF7)] px-3 py-2.5"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-center gap-2 text-[12px] text-foreground">
                <FileText
                  size={14}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  className="text-tertiary"
                />
                <span className="font-mono">PDF · DOCX · XLSX · CSV · TXT</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-foreground">
                <ImageIcon
                  size={14}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  className="text-tertiary"
                />
                <span className="font-mono">JPEG · PNG · GIF · WebP</span>
              </div>
            </div>
            <CropAnnotation
              pin={1}
              label="Tài liệu + ảnh, cùng một ô chat"
            />
          </CropCard>

          <CropCard
            title="Cách Claude trích xuất nội dung"
            caption="Anthropic: PDF được cung cấp dưới dạng kết hợp giữa chữ và ảnh để phân tích — nhờ đó Claude hỏi-đáp được cả về biểu đồ, sơ đồ, nội dung phi văn bản, không chỉ phần chữ."
          >
            <CropBubble from="user">
              Trong biểu đồ trang 7, quý nào doanh thu cao nhất?
            </CropBubble>
            <CropBubble from="claude">
              Quý 4 cao nhất với 31,5 tỷ đồng — đọc từ cột Q4 trong Biểu đồ 1,
              trang 7.
            </CropBubble>
            <CropAnnotation
              pin={3}
              label="Đọc cả chữ lẫn hình trong file"
            />
          </CropCard>

          <CropCard
            title="Dẫn nguồn để bạn kiểm tra lại"
            caption="Khi bạn hỏi thêm 'trích từ đâu?', Claude chỉ rõ số trang và tên bảng/biểu đồ. Bạn mở PDF gốc ở trang đó là xác minh được — không phải đoán xem con số lấy từ đâu."
          >
            <div
              className="flex items-start gap-2 rounded-[12px] border border-border bg-[var(--paper,#FBFAF7)] px-3 py-2.5 text-[12px] italic text-tertiary"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <Paperclip
                size={12}
                strokeWidth={1.8}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
              />
              <span>{CLAUDE_SOURCE_LINE}</span>
            </div>
            <CropAnnotation
              pin={4}
              label="Trích dẫn số trang, tên bảng/biểu đồ"
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
          Bấm nút bên dưới để mở Claude với câu hỏi mẫu — sau đó kéo thả một
          hoá đơn PDF của bạn vào chat để Claude đọc thử.
        </p>
        <DeepLinkCTA prompt="Mình vừa upload hoá đơn tiền điện PDF — tóm tắt giúp mình 3 chi phí lớn nhất theo tháng và đề xuất cách tiết kiệm." />
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
