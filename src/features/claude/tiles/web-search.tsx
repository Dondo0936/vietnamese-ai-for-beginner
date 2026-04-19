"use client";

/**
 * Web Search tile — Claude fetching fresh info from the live web with
 * inline citations + source cards.
 *
 * ---------------------------------------------------------------------------
 * DOCS GROUNDING (Anthropic sources, snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * Source (claude.ai help center, canonical):
 *   https://support.claude.com/en/articles/10684626-enabling-and-using-web-search
 *   Fetched: 2026-04-19.
 *
 *   Verbatim quotes captured today:
 *   > "Web search expands Claude's knowledge with real-time data, helping
 *   >  you make better-informed decisions with current information."
 *   > "When you ask about topics that benefit from current information,
 *   >  Claude invokes a search tool to inform and ground its generated
 *   >  responses with content from the live web."
 *   > "Every response includes citations, so you can easily verify sources
 *   >  yourself."
 *   > "Click on the slider icon in your chat input interface. Locate Web
 *   >  search in the dropdown. Switch the toggle on."
 *   > "An Owner or Primary Owner must first enable web search for the
 *   >  entire workspace." (Team / Enterprise gating)
 *
 * Source (Anthropic API docs, for shape of the feature on the platform):
 *   https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
 *   Fetched: 2026-04-19 (302 redirect target of docs.claude.com/... slug).
 *
 *   Verbatim quotes captured today:
 *   > "The web search tool gives Claude direct access to real-time web
 *   >  content, allowing it to answer questions with up-to-date information
 *   >  beyond its knowledge cutoff. The response includes citations for
 *   >  sources drawn from search results."
 *   > "Claude decides when to search based on the prompt."
 *   > "At the end of its turn, Claude provides a final response with cited
 *   >  sources."
 *   > "Citations are always enabled for web search..."
 *   > "When displaying API outputs directly to end users, citations must
 *   >  be included to the original source."
 *
 * Source (Claude pricing page, availability in consumer plans):
 *   https://claude.com/pricing  — Fetched: 2026-04-19.
 *   The plan-comparison table lists the row "Ability to search the web"
 *   as available across Free, Pro, Max 5x, and Max 20x tiers of the
 *   individual plans; Team / Enterprise plans include it with workspace-
 *   level admin enablement required (per the help-center article above).
 *
 * Citation UI: the help-center article says "every response includes
 * citations." In the canonical API response schema (web_search_20250305 /
 * 20260209), each citation is a `web_search_result_location` with fields
 * `url`, `title`, `cited_text`, and an `encrypted_index`. In the
 * consumer claude.ai UI those same citations surface as small numbered
 * markers next to the claims and as a row of source cards (favicon +
 * domain + page title) below the answer — that's the UI we simulate
 * here. We render markers as `[1]`, `[2]`, `[3]` (bracketed numerals,
 * same shape Claude emits in plaintext responses); source cards show
 * Vietnamese outlets so a Vietnamese reader can immediately tell which
 * publication is being cited.
 *
 * ---------------------------------------------------------------------------
 * CONTEXT7 FINDINGS (snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * next.js v16.2.2 (/vercel/next.js/v16.2.2, closest pinned version to the
 *   installed v16.2.3): `next/dynamic` with a static `() => import("./X")`
 *   is the supported pattern for splitting client components into their
 *   own bundle; per the lazy-loading guide, the dynamic() call must be at
 *   module top level to allow preloading and bundle matching. This tile is
 *   registered from `tiles/index.ts` as `dynamic(() => import("./web-search"))`
 *   following the same convention as chat / projects / artifacts /
 *   files-vision / voice. (docs/01-app/02-guides/lazy-loading.mdx)
 *
 * framer-motion (/grx7/framer-motion): no direct usage in this tile —
 *   AnnotationLayer owns `AnimatePresence` + pulse/entrance motion
 *   (inherited from commit a10d8d6), and respects `useReducedMotion()`
 *   internally. The tile simply passes `playhead` into the layer.
 *
 * react v19.2.0 (/facebook/react/v19_2_0): shell-slot components use
 *   `memo` to keep static chrome (topBar / leftRail) from re-rendering
 *   on DemoCanvas playhead ticks — same discipline as every Phase 2
 *   tile before it.
 */

import { memo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Globe,
  Search,
  Settings,
  ExternalLink,
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
// Constants — all user-visible copy + content in one place
// ---------------------------------------------------------------------------

const ONE_LINER =
  "Claude tự tra cứu thông tin mới trên web khi câu hỏi yêu cầu dữ liệu cập nhật — và trích dẫn nguồn đầy đủ để bạn đối chiếu.";

// Canonical help-center article for the consumer claude.ai product —
// pinned slug 10684626 verified against support.claude.com on 2026-04-19.
const WEB_SEARCH_DOC_HREF =
  "https://support.claude.com/en/articles/10684626-enabling-and-using-web-search";

const ACTIVE_CHAT_TITLE = "Kinh tế vĩ mô VN Q1 2026";

const USER_QUESTION =
  "Tình hình kinh tế vĩ mô Việt Nam quý 1 năm 2026 ra sao? Tóm tắt 3 con số chính và trích dẫn nguồn báo chính thống.";

// Claude's response text, split so we can inject inline citation markers
// as real DOM children (not substrings). Each marker is a small <sup>
// that carries `data-citation="N"` so tests can find them without
// relying on string matching inside paragraphs.
const CLAUDE_INTRO =
  "Dựa trên các nguồn vừa tra cứu hôm nay, ba con số lớn nhất quý 1 năm 2026:";

const CLAUDE_STAT_GDP_LABEL = "Tăng trưởng GDP";
const CLAUDE_STAT_GDP_VALUE = "6,8 %";
const CLAUDE_STAT_GDP_CITE = 1;

const CLAUDE_STAT_CPI_LABEL = "Lạm phát (CPI bình quân)";
const CLAUDE_STAT_CPI_VALUE = "3,4 %";
const CLAUDE_STAT_CPI_CITE = 2;

const CLAUDE_STAT_EXPORT_LABEL = "Xuất khẩu hàng hoá";
const CLAUDE_STAT_EXPORT_VALUE = "94,1 tỷ USD";
const CLAUDE_STAT_EXPORT_CITE = 3;

const CLAUDE_OUTRO_LEAD = "Tổng quan chung, tăng trưởng vẫn cao hơn mục tiêu";
const CLAUDE_OUTRO_TAIL =
  " — dù giá hàng hoá toàn cầu biến động, cán cân thương mại quý 1 vẫn xuất siêu.";
const CLAUDE_OUTRO_CITE = 1;

// Three source cards — fabricated "retrieved" pages shaped like what
// Claude's real citation UI renders (favicon + domain + article title).
// Outlets chosen: three widely-used Vietnamese reference publications
// (government statistics office + one mainstream daily + one business
// paper) so a Vietnamese reader instantly recognises the citation row.
interface SourceCard {
  n: number;
  domain: string;
  title: string;
  /** Fallback letter used inside the "favicon" tile when no real favicon. */
  faviconChar: string;
  /** Color accent for the favicon tile so the row doesn't read monochrome. */
  accent: string;
}

const SOURCE_CARDS: SourceCard[] = [
  {
    n: 1,
    domain: "gso.gov.vn",
    title: "Báo cáo tình hình kinh tế – xã hội quý I/2026",
    faviconChar: "G",
    accent: "#13343B",
  },
  {
    n: 2,
    domain: "tuoitre.vn",
    title: "CPI quý I/2026 tăng 3,4% — áp lực giá trong tầm kiểm soát",
    faviconChar: "T",
    accent: "#A85A2B",
  },
  {
    n: 3,
    domain: "vneconomy.vn",
    title: "Xuất khẩu quý I vượt 94 tỷ USD, cán cân vẫn xuất siêu",
    faviconChar: "V",
    accent: "#20736A",
  },
];

const CHAT_HISTORY: Array<{ id: string; title: string; active?: boolean }> = [
  { id: "active", title: ACTIVE_CHAT_TITLE, active: true },
  { id: "last", title: "Giá vàng SJC hôm nay" },
];

// Anchor calibration notes (2026-04-19):
//   - ClaudeDesktopShell: top bar 44px; left rail 248px; no artifacts panel.
//     Main column fills from ~22% to 100% of shell width on wide screens.
//   - Pin 1 (search-in-progress indicator, appears briefly under the user
//     question inside Claude's bubble) → x:32, y:26.
//   - Pin 2 (inline [1] citation marker next to the GDP stat row) → x:48, y:44.
//   - Pin 3 (whole source-card row below Claude's reply) → x:46, y:68.
//   - Pin 4 (the domain chip inside the first source card) → x:26, y:72.
const ANNOTATIONS: Annotation[] = [
  {
    id: "searching",
    pin: 1,
    label: "Claude tự tìm trên web",
    description:
      "Khi câu hỏi liên quan đến dữ liệu hôm nay, tuần này, hoặc năm nay, Claude tự gọi công cụ web search — bạn không cần bấm nút hoặc nói 'tra giúp'.",
    showAt: [0.0, 0.5],
    anchor: { x: 32, y: 26 },
  },
  {
    id: "inline-citation",
    pin: 2,
    label: "Mỗi khẳng định kèm số trích dẫn",
    description:
      "Claude gắn số [1], [2], [3] ngay sau mỗi con số hoặc mệnh đề lấy từ web, để bạn biết chính xác câu nào là từ nguồn nào.",
    showAt: [0.0, 0.5],
    anchor: { x: 48, y: 44 },
  },
  {
    id: "source-row",
    pin: 3,
    label: "Nguồn gốc kiểm chứng được",
    description:
      "Bên dưới câu trả lời là hàng thẻ nguồn — Claude không chỉ liệt kê tên, mà còn hiện domain và tiêu đề bài viết để bạn nhận ra ngay đó có phải báo chính thống hay không.",
    showAt: [0.4, 1.0],
    anchor: { x: 46, y: 68 },
  },
  {
    id: "source-domain",
    pin: 4,
    label: "Xem rõ Claude đọc từ đâu",
    description:
      "Mỗi thẻ nguồn có domain hiển thị rõ; bấm vào là mở trang gốc trong tab mới. Bạn tự đối chiếu — không phải tin vào lời Claude.",
    showAt: [0.4, 1.0],
    anchor: { x: 26, y: 72 },
  },
];

const CROSS_LINKS: Array<{ href: string; title: string; blurb: string }> = [
  {
    href: "/claude/chat",
    title: "Chat + phản hồi trực tiếp",
    blurb:
      "Web Search chạy bên trong cùng ô chat — Claude tự quyết định khi nào cần tra cứu, khi nào không.",
  },
  {
    href: "/claude/files-vision",
    title: "Files & Vision",
    blurb:
      "Khi nguồn là tài liệu bạn đưa lên (PDF, ảnh), Claude đọc trực tiếp thay vì tra web — hai luồng bổ sung cho nhau.",
  },
  {
    href: "/claude/artifacts",
    title: "Artifacts",
    blurb:
      "Sau khi tra cứu xong, Claude có thể tổng hợp thành bảng hoặc báo cáo mở ra trong Artifacts.",
  },
];

// ---------------------------------------------------------------------------
// Citation marker — reused both inline (in Claude's reply) and inside
// source cards so the same number shape connects both ends of the UI.
// ---------------------------------------------------------------------------

function CitationMarker({ n }: { n: number }) {
  return (
    <sup
      data-citation={n}
      aria-label={`Trích dẫn ${n}`}
      className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-[4px] border border-border bg-[var(--pure-white,#FFFFFF)] px-1 font-mono text-[10px] font-semibold leading-none text-foreground"
      style={{ verticalAlign: "super", boxShadow: "var(--shadow-sm)" }}
    >
      [{n}]
    </sup>
  );
}

// ---------------------------------------------------------------------------
// Searching-indicator row — small "Đang tra cứu web..." chip with Globe icon
// ---------------------------------------------------------------------------

const SearchingIndicator = memo(function SearchingIndicator() {
  return (
    <div
      className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-[var(--paper,#FBFAF7)] px-2.5 py-1 text-[11px] text-tertiary"
      style={{ boxShadow: "var(--shadow-sm)" }}
      aria-label="Claude đang tra cứu web"
      role="status"
    >
      <Globe size={12} strokeWidth={1.8} aria-hidden="true" />
      <span>Đang tra cứu web…</span>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Source-card row — favicon + domain + title, numbered [1]/[2]/[3]
// ---------------------------------------------------------------------------

function SourceCardTile({ card }: { card: SourceCard }) {
  return (
    <div
      className="flex min-w-0 flex-1 items-start gap-2 rounded-[10px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-2.5"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* "Favicon" tile — a single-letter glyph on a colored square. We
          avoid fetching real favicons (would make the demo non-pure +
          leak network traffic); the letter + accent is enough to read
          "different publications" at a glance. */}
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-[12px] font-semibold text-white"
        style={{ background: card.accent }}
      >
        {card.faviconChar}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.06em] text-tertiary">
          <span>[{card.n}]</span>
          <span className="truncate">{card.domain}</span>
          <ExternalLink
            size={10}
            strokeWidth={1.8}
            aria-hidden="true"
            className="ml-auto shrink-0"
          />
        </div>
        <div className="truncate text-[12px] leading-[1.35] text-foreground">
          {card.title}
        </div>
      </div>
    </div>
  );
}

const SourceRow = memo(function SourceRow() {
  return (
    <div
      className="mx-4 mb-4 flex items-stretch gap-2 rounded-[12px] border border-border bg-[var(--paper,#FBFAF7)] p-2"
      aria-label="Nguồn trích dẫn"
      role="list"
    >
      {SOURCE_CARDS.map((card) => (
        <div key={card.n} role="listitem" className="flex min-w-0 flex-1">
          <SourceCardTile card={card} />
        </div>
      ))}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Stat row — extracted number + its inline citation marker
// ---------------------------------------------------------------------------

function StatRow({
  label,
  value,
  cite,
}: {
  label: string;
  value: string;
  cite: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-2">
      <span className="text-[12px] text-tertiary">{label}</span>
      <span className="font-mono text-[13px] font-semibold text-foreground">
        {value}
        <CitationMarker n={cite} />
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell slots — memoized for DemoCanvas playhead ticks
// ---------------------------------------------------------------------------

const WebSearchTopBar = memo(function WebSearchTopBar() {
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

const WebSearchLeftRail = memo(function WebSearchLeftRail() {
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

const WebSearchMain = memo(function WebSearchMain() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden pt-3">
        <ShellMessage from="user">
          <div>{USER_QUESTION}</div>
        </ShellMessage>
        <ShellMessage from="claude">
          <SearchingIndicator />
          <div>{CLAUDE_INTRO}</div>
          <div className="mt-2 flex flex-col gap-1.5">
            <StatRow
              label={CLAUDE_STAT_GDP_LABEL}
              value={CLAUDE_STAT_GDP_VALUE}
              cite={CLAUDE_STAT_GDP_CITE}
            />
            <StatRow
              label={CLAUDE_STAT_CPI_LABEL}
              value={CLAUDE_STAT_CPI_VALUE}
              cite={CLAUDE_STAT_CPI_CITE}
            />
            <StatRow
              label={CLAUDE_STAT_EXPORT_LABEL}
              value={CLAUDE_STAT_EXPORT_VALUE}
              cite={CLAUDE_STAT_EXPORT_CITE}
            />
          </div>
          <div className="mt-2 text-[13px] leading-[1.55] text-foreground">
            {CLAUDE_OUTRO_LEAD}
            <CitationMarker n={CLAUDE_OUTRO_CITE} />
            {CLAUDE_OUTRO_TAIL}
          </div>
        </ShellMessage>
        <SourceRow />
      </div>
      <ShellComposerStub placeholder="Hỏi tiếp về báo cáo này..." />
    </div>
  );
});

// ---------------------------------------------------------------------------
// Default export — the full tile
// ---------------------------------------------------------------------------

export default function WebSearchTile() {
  const tile = findTile("web-search");
  const viTitle = tile?.viTitle ?? "Web Search";

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

      {/* Hero demo — desktop shell, search-in-progress then cited answer */}
      <DemoCanvas
        title={viTitle}
        onPlay={onPlay}
        onReset={onReset}
        onStep={onStep}
        playing={playing}
      >
        <div className="relative">
          <ClaudeDesktopShell
            topBar={<WebSearchTopBar />}
            leftRail={<WebSearchLeftRail />}
            main={<WebSearchMain />}
          />
          <AnnotationLayer annotations={ANNOTATIONS} playhead={playhead} />
        </div>
      </DemoCanvas>

      {/* Honest disclosure — link straight to the canonical help-center
          article for Web Search on claude.ai. Slug 10684626 verified
          against support.claude.com on 2026-04-19. */}
      <ViewRealUI
        href={WEB_SEARCH_DOC_HREF}
        label="Xem hướng dẫn Web Search từ Anthropic"
        caption="Mở bài hướng dẫn Web Search gốc trên Help Center của Anthropic (ảnh chụp 2026-04-19). Giải thích chi tiết cách bật, cách hoạt động, và các điều kiện về gói sử dụng."
      />

      {/* Plan-availability note — grounded in the claude.com/pricing table
          + help-center article 10684626, both fetched 2026-04-19. */}
      <p
        role="note"
        className="max-w-[62ch] text-[12px] leading-[1.55] text-tertiary"
      >
        Web Search có trên cả bốn gói cá nhân của claude.ai — Free, Pro,
        Max 5x và Max 20x — theo bảng so sánh &ldquo;Ability to search the
        web&rdquo; trên trang giá. Với gói Team và Enterprise, tính năng
        cũng có nhưng Owner (hoặc Primary Owner) phải bật cho cả workspace
        trước — sau đó mọi thành viên mới dùng được. Trên giao diện chat,
        bấm vào biểu tượng thanh trượt trong ô soạn tin, tìm mục
        &ldquo;Web search&rdquo; và gạt nút bật. Gói Free dùng được, nhưng
        lượt tra cứu tính vào giới hạn sử dụng hàng ngày.
      </p>

      {/* "Cách nó hoạt động" — three crop cards using shared primitives. */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[22px] font-semibold leading-[1.25] text-foreground md:text-[26px]">
          Cách nó hoạt động
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <CropCard
            title="Khi nào Claude tra web"
            caption="Theo tài liệu Anthropic, Claude tự quyết định tra cứu khi câu hỏi cần thông tin hiện tại — giá cả, tin tức, sự kiện hôm nay, hoặc dữ liệu mới hơn mốc huấn luyện. Bạn không cần gõ 'tra giúp' — nếu trong câu có 'hôm nay', 'tuần này', 'năm 2026', Claude gần như chắc chắn sẽ gọi web search."
          >
            <div
              className="flex items-center gap-2 rounded-[12px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-2.5"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--paper-2,#F3F2EE)] text-tertiary"
              >
                <Search size={14} strokeWidth={1.8} />
              </span>
              <span className="text-[12px] italic text-tertiary">
                Đang tra cứu web…
              </span>
            </div>
            <CropAnnotation pin={1} label="Tự quyết định — không cần bấm" />
          </CropCard>

          <CropCard
            title="Trích dẫn có số thứ tự"
            caption="Mỗi khẳng định dẫn nguồn được gắn số [1], [2], [3] ngay sau con số hoặc cụm từ. Tài liệu API nói rõ: citation luôn được bật khi dùng Web Search — nghĩa là bạn không bao giờ thấy một câu trả lời lấy từ web mà không kèm trích dẫn."
          >
            <CropBubble from="claude">
              Tăng trưởng GDP quý I đạt 6,8 %<CitationMarker n={1} /> và CPI
              bình quân ở mức 3,4 %<CitationMarker n={2} />.
            </CropBubble>
            <CropAnnotation pin={2} label="Số [1], [2] dẫn về nguồn cụ thể" />
          </CropCard>

          <CropCard
            title="Thẻ nguồn mở được ra tận trang gốc"
            caption="Dưới câu trả lời là hàng thẻ nguồn — Claude hiện favicon, domain và tiêu đề bài viết. Bấm vào mở trang gốc trong tab mới. Bạn đối chiếu trực tiếp, không phải tin vào lời Claude."
          >
            <div className="flex flex-col gap-2">
              <SourceCardTile card={SOURCE_CARDS[0]} />
            </div>
            <CropAnnotation
              pin={3}
              label="Domain rõ ràng — kiểm chứng được"
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
          Bấm mở Claude với câu hỏi mẫu bên dưới. Vì câu hỏi có ràng buộc
          thời gian (&ldquo;tuần này&rdquo;), Claude gần như chắc chắn sẽ
          tự gọi Web Search và trả lời kèm trích dẫn.
        </p>
        <DeepLinkCTA prompt="Tóm tắt 3 tin công nghệ lớn nhất tuần này ở Việt Nam — mỗi tin một đoạn 2-3 câu kèm nguồn." />
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
