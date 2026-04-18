"use client";

/**
 * Chat tile — Claude Desktop streaming response demo.
 *
 * ---------------------------------------------------------------------------
 * DOCS GROUNDING (Anthropic sources, snapshot 2026-04-18)
 * ---------------------------------------------------------------------------
 *
 * Source: https://docs.claude.com/en/docs/build-with-claude/streaming
 *         (302 redirect → https://platform.claude.com/docs/en/build-with-claude/streaming)
 * Fetched: 2026-04-18
 *
 *   Quote 1 (streaming mechanism):
 *   > "When creating a Message, you can set `"stream": true` to incrementally
 *   >  stream the response using server-sent events (SSE)."
 *
 *   Quote 2 (per-token delivery via delta events):
 *   > "A series of content blocks, each of which have a `content_block_start`,
 *   >  one or more `content_block_delta` events, and a `content_block_stop`
 *   >  event. Each content block has an `index` that corresponds to its index
 *   >  in the final Message `content` array."
 *
 *   Quote 3 (named SSE event types):
 *   > "Each server-sent event includes a named event type and associated JSON
 *   >  data. Each event uses an SSE event name (e.g. `event: message_stop`),
 *   >  and includes the matching event `type` in its data."
 *
 * Source: https://claude.com/product/overview (formerly anthropic.com/claude)
 * Fetched: 2026-04-18 — page focuses on capabilities, no verbatim streaming
 * claim available beyond the platform docs above.
 *
 * ---------------------------------------------------------------------------
 * CONTEXT7 FINDINGS (snapshot 2026-04-18)
 * ---------------------------------------------------------------------------
 *
 * framer-motion (/grx7/framer-motion): `useReducedMotion()` returns
 *   `boolean | null` — `null` before the media query initialises (SSR /
 *   pre-hydration). DemoCanvas already treats `null` as "reduced"; we follow
 *   the same contract here for the in-tile text reveal.
 *
 * next.js v16.1.6 (/vercel/next.js/v16.1.6): `next/dynamic` with a static
 *   import literal — `dynamic(() => import("./chat"))` — remains the canonical
 *   lazy-load path in Next 16 App Router. (docs/01-app/02-guides/lazy-loading.mdx)
 */

import Link from "next/link";
import { ChevronDown, Settings, Send, Square } from "lucide-react";

import {
  ClaudeDesktopShell,
  ShellMessage,
  ShellComposerStub,
} from "@/features/claude/components/ClaudeDesktopShell";
import { AnnotationLayer } from "@/features/claude/components/AnnotationLayer";
import { DemoCanvas } from "@/features/claude/components/DemoCanvas";
import { DeepLinkCTA } from "@/features/claude/components/DeepLinkCTA";
import { useDemoPlayhead } from "@/features/claude/useDemoPlayhead";
import { findTile } from "@/features/claude/registry";
import type { Annotation } from "@/features/claude/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TARGET_TEXT =
  "Mạng nơ-ron là một mô hình học máy lấy cảm hứng từ cách não bộ hoạt động. Nó gồm nhiều lớp tế bào nhân tạo, mỗi tế bào nhận tín hiệu, xử lý, rồi chuyển tiếp. Qua huấn luyện, mạng học cách nhận biết mẫu — như phân biệt chữ viết tay hay ảnh động vật.";

const USER_QUESTION = "Giải thích cơ bản về mạng nơ-ron cho học sinh cấp 2.";

const STREAM_START = 0.05;
const STREAM_END = 0.85;

const ONE_LINER =
  "Claude trả lời theo từng token, hiện lên thời gian thực — không phải chờ cả câu rồi mới xuất hiện cùng lúc.";

const CHAT_HISTORY: Array<{ id: string; title: string; active?: boolean }> = [
  {
    id: "nn",
    title: "Giải thích cơ bản về mạng nơ-ron cho học sinh cấp 2",
    active: true,
  },
  { id: "email", title: "Viết email gửi khách hàng về việc hoãn dự án" },
  { id: "summary", title: "Tóm tắt bài báo về AI generative" },
  { id: "py", title: "Code Python đọc file Excel tính tổng doanh thu" },
  { id: "domain", title: "Gợi ý 10 tên miền cho startup AI giáo dục Việt Nam" },
];

const ANNOTATIONS: Annotation[] = [
  {
    id: "user-sent",
    pin: 1,
    label: "Câu hỏi gửi ngay",
    description:
      "Enter → câu hỏi của bạn xuất hiện tức thì ở cột chat; Claude bắt đầu xử lý.",
    showAt: [0.0, 0.12],
    anchor: { x: 68, y: 28 },
  },
  {
    id: "streaming",
    pin: 2,
    label: "Token chảy từng phần",
    description:
      "Mỗi token (~1–2 ký tự trung bình) được gửi về trình duyệt ngay khi mô hình sinh ra — không chờ toàn bộ câu. Đây là server-sent events (SSE) đằng sau hậu trường.",
    showAt: [0.1, 0.5],
    anchor: { x: 42, y: 45 },
  },
  {
    id: "stop-button",
    pin: 3,
    label: "Nút Dừng giữa chừng",
    description:
      "Trong lúc Claude đang trả lời, composer hiện nút Dừng (vuông). Bấm vào để cắt phản hồi nếu Claude lạc đề hoặc dài dòng.",
    showAt: [0.3, 0.8],
    anchor: { x: 58, y: 82 },
  },
  {
    id: "done",
    pin: 4,
    label: "Sẵn sàng cho lượt kế",
    description:
      "Khi stream hoàn tất, nút Dừng trở lại nút Gửi (mũi tên). Bạn có thể gõ tiếp ngay trong cùng cuộc trò chuyện — Claude nhớ bối cảnh vừa rồi.",
    showAt: [0.85, 1.0],
    anchor: { x: 58, y: 82 },
  },
];

const CROSS_LINKS: Array<{ href: string; title: string; blurb: string }> = [
  {
    href: "/claude/artifacts",
    title: "Artifacts",
    blurb: "Panel bên phải cho mã và tài liệu",
  },
  {
    href: "/claude/voice",
    title: "Voice Mode",
    blurb: "Nói chuyện với Claude",
  },
  {
    href: "/claude/projects",
    title: "Projects",
    blurb: "Không gian làm việc dài hạn",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map playhead 0..1 to streamed substring of TARGET_TEXT.
 *  - 0..STREAM_START → empty (Claude still "thinking")
 *  - STREAM_START..STREAM_END → linearly grows
 *  - STREAM_END..1 → full text, frozen.
 */
function streamedSubstring(playhead: number): string {
  if (playhead <= STREAM_START) return "";
  if (playhead >= STREAM_END) return TARGET_TEXT;
  const t = (playhead - STREAM_START) / (STREAM_END - STREAM_START);
  const n = Math.floor(t * TARGET_TEXT.length);
  return TARGET_TEXT.slice(0, n);
}

function isStreaming(playhead: number): boolean {
  return playhead > STREAM_START && playhead < STREAM_END;
}

// ---------------------------------------------------------------------------
// Streaming composer — ShellComposerStub + absolute-positioned icon
// ---------------------------------------------------------------------------

function StreamingComposer({ playhead }: { playhead: number }) {
  const streaming = isStreaming(playhead);
  return (
    <div className="relative">
      <ShellComposerStub placeholder="Nhập tiếp theo..." />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        aria-label={streaming ? "Dừng phản hồi" : "Gửi"}
        className="pointer-events-none absolute right-7 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-foreground bg-foreground text-background"
      >
        {streaming ? (
          <Square size={12} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Send size={12} strokeWidth={2.5} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell slot builder — shared by hero demo + still frames
// ---------------------------------------------------------------------------

interface ShellSlots {
  topBar: React.ReactNode;
  leftRail: React.ReactNode;
  main: React.ReactNode;
}

function ChatShellContents({ playhead }: { playhead: number }): ShellSlots {
  const revealed = streamedSubstring(playhead);
  const streaming = isStreaming(playhead);
  const showTypingHint = playhead <= STREAM_START;

  const topBar = (
    <div className="flex w-full items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-foreground">
        Cuộc trò chuyện mới
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-foreground">
        Claude Sonnet 4.7
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="ml-auto text-tertiary" aria-hidden="true">
        <Settings size={16} strokeWidth={1.8} />
      </span>
    </div>
  );

  const leftRail = (
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

  const main = (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden pt-3">
        <ShellMessage from="user">{USER_QUESTION}</ShellMessage>
        <ShellMessage from="claude">
          {showTypingHint ? (
            <span className="text-tertiary italic">Claude đang soạn...</span>
          ) : (
            <span>
              {revealed}
              {streaming ? (
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-foreground opacity-80"
                />
              ) : null}
            </span>
          )}
        </ShellMessage>
      </div>
      <StreamingComposer playhead={playhead} />
    </div>
  );

  return { topBar, leftRail, main };
}

// ---------------------------------------------------------------------------
// StillFrame — scaled-down shell with frozen playhead + static annotations
// ---------------------------------------------------------------------------

function StillFrame({
  playhead,
  title,
  caption,
}: {
  playhead: number;
  title: string;
  caption: string;
}) {
  const slots = ChatShellContents({ playhead });
  // Only show annotations whose showAt range straddles this frozen playhead.
  const relevant = ANNOTATIONS.filter(
    ({ showAt: [s, e] }) => playhead >= s && playhead <= e
  );
  return (
    <figure className="flex flex-col gap-3">
      <div className="relative">
        <ClaudeDesktopShell
          topBar={slots.topBar}
          leftRail={slots.leftRail}
          main={slots.main}
          height={280}
        />
        <AnnotationLayer annotations={relevant} playhead={playhead} staticMode />
      </div>
      <figcaption>
        <div className="text-[13px] font-semibold text-foreground">{title}</div>
        <div className="mt-1 text-[12px] leading-[1.5] text-secondary">
          {caption}
        </div>
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Default export — the full tile
// ---------------------------------------------------------------------------

export default function ChatTile() {
  const tile = findTile("chat");
  const viTitle = tile?.viTitle ?? "Chat + phản hồi trực tiếp";

  const { playhead, playing, onPlay, onReset, onStep } = useDemoPlayhead({
    duration: 8000,
    pauseAtEnd: 2000,
  });

  const slots = ChatShellContents({ playhead });

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
            topBar={slots.topBar}
            leftRail={slots.leftRail}
            main={slots.main}
          />
          <AnnotationLayer annotations={ANNOTATIONS} playhead={playhead} />
        </div>
      </DemoCanvas>

      {/* Still frames — "Cách nó hoạt động" */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[22px] font-semibold leading-[1.25] text-foreground md:text-[26px]">
          Cách nó hoạt động
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <StillFrame
            playhead={0.04}
            title="Câu hỏi vừa gửi"
            caption="Bạn gõ xong và bấm Enter. Câu hỏi lên tức thì, Claude bắt đầu đọc và suy nghĩ."
          />
          <StillFrame
            playhead={0.45}
            title="Đang stream"
            caption="Claude đang sinh phản hồi từng token. Bạn đọc song song với mô hình — không cần chờ cả câu."
          />
          <StillFrame
            playhead={0.92}
            title="Hoàn tất"
            caption="Phản hồi đầy đủ. Composer quay về trạng thái sẵn sàng. Claude nhớ bối cảnh, bạn có thể hỏi tiếp."
          />
        </div>
      </section>

      {/* Thử ngay */}
      <section className="flex flex-col items-start gap-4 rounded-[14px] border border-border bg-[var(--paper-2,#F3F2EE)] p-6">
        <h2 className="text-[20px] font-semibold leading-[1.25] text-foreground">
          Thử ngay
        </h2>
        <p className="max-w-[58ch] text-[14px] leading-[1.55] text-secondary">
          Bấm nút bên dưới để mở Claude với một câu hỏi mẫu — phản hồi chính là
          ví dụ streaming bạn vừa đọc.
        </p>
        <DeepLinkCTA prompt="Giải thích ngắn về streaming response trong LLM cho người mới, bằng ví dụ thực tế từ cuộc sống hằng ngày. Viết bằng tiếng Việt, dễ hiểu." />
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
                className="block rounded-[12px] border border-border bg-card p-4 transition-transform hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)]"
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
