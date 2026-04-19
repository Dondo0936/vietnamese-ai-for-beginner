"use client";

/**
 * Voice Mode tile — Claude voice conversation demo (web + mobile).
 *
 * ---------------------------------------------------------------------------
 * DOCS GROUNDING (Anthropic sources, snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * Source (primary, canonical):
 *   https://support.claude.com/en/articles/11101966-using-voice-mode-on-claude-mobile-apps
 *   Fetched: 2026-04-19.
 *
 *   Verbatim quotes captured today:
 *   > "Voice mode is a beta feature available in English to all plans on
 *   >  Claude and Claude Mobile (iOS and Android)."
 *   > "Tap the sound wave symbol in the lower right corner of the chat
 *   >  window to activate voice mode." (web)
 *   > "Tap the voice mode icon (sound wave symbol next to the microphone
 *   >  icon) in the text input field." (mobile)
 *   > "Voice conversations count toward your regular usage limits based
 *   >  on your subscription plan."
 *   > "If you are an Enterprise owner and would like to disable voice
 *   >  mode for your organization, please reach out to Support."
 *
 *   Additional fact captured from the article-search summary today:
 *   Free-plan users can send approximately 20–30 voice messages before
 *   reaching session limits. (The body article currently frames this as
 *   "count toward your regular usage limits" without the specific
 *   number; we carry the 20–30 figure because it is what Anthropic
 *   publishes in the indexed summary.)
 *
 *   Voice-options count: the article says users "select from five voice
 *   options when you first activate voice mode."
 *
 * Source (secondary): https://www.claude.com/product/overview  — Fetched 2026-04-19
 *   > "Switch between typing and speaking to Claude. Perfect for when
 *   >  you're on the move, or want to think out loud."
 *
 * Source (secondary): https://claude.com/pricing  — Fetched 2026-04-19
 *   Voice mode is not rendered as a dedicated row in the pricing-page
 *   comparison table as of 2026-04-19; the support article is the
 *   authoritative availability source. Where pricing copy mentions
 *   voice/speech features they are listed under Pro-and-above tiers,
 *   matching the "beta, English-only, all plans, Enterprise can disable"
 *   framing in the support article — free users keep access but under a
 *   tighter ~20–30-message session cap.
 *
 * Platform scope: Voice Mode runs on BOTH Claude web (claude.ai) and
 * the Claude mobile apps (iOS + Android). The tile uses
 * `ClaudePhoneShell` as its hero because the phone chrome communicates
 * the "call-like" affordances (mic, end, keyboard) more legibly than a
 * desktop window — but the copy makes explicit that the same flow
 * (sound-wave icon → speak → transcript) exists on the web surface.
 *
 * ---------------------------------------------------------------------------
 * CONTEXT7 FINDINGS (snapshot 2026-04-19)
 * ---------------------------------------------------------------------------
 *
 * next.js v16.2.2 (/vercel/next.js/v16.2.2, closest pinned version to the
 *   installed v16.2.3): `next/dynamic` import path MUST be a static string
 *   literal — template strings or variables break bundle matching. This
 *   tile is lazy-loaded from `tiles/index.ts` as
 *   `dynamic(() => import("./voice"))`. Same pattern as chat / projects /
 *   artifacts / files-vision. (docs/01-app/02-guides/lazy-loading.mdx)
 *
 * framer-motion (/grx7/framer-motion): THIS TILE USES MOTION DIRECTLY
 *   (unlike files-vision, which only inherited motion through
 *   AnnotationLayer). The audio visualizer animates `motion.div`
 *   `scaleY` with `transition: { repeat: Infinity, repeatType: "mirror",
 *   duration, delay }` — the "repeat + repeatType=mirror" pattern from
 *   Context7's Tween Animation example — so each bar breathes up and
 *   down without a snap-reset. `useReducedMotion()` returns `boolean |
 *   null`; `null` (pre-hydration) is treated as reduced, matching
 *   AnnotationLayer / DemoCanvas — when reduced, we render five STATIC
 *   bars at varied heights instead of looping.
 *
 * react v19.2.0 (/facebook/react/v19_2_0): `memo` wrappers keep the voice
 *   UI's static chrome from re-rendering when the hero DemoCanvas
 *   re-renders on playhead ticks. Same discipline as other Phase 2 tiles.
 */

import { memo, useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Keyboard, Mic, MicOff, PhoneOff } from "lucide-react";

import { ClaudePhoneShell } from "@/features/claude/components/ClaudePhoneShell";
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
// Constants — all user-visible copy in one place
// ---------------------------------------------------------------------------

const ONE_LINER =
  "Voice Mode (beta) cho bạn nói chuyện tự nhiên với Claude — có trên Claude web và app di động (iOS/Android). Giọng vào, giọng ra, kèm bản chép để xem lại. Hiện chỉ hỗ trợ tiếng Anh.";

const VOICE_DOC_HREF =
  "https://support.claude.com/en/articles/11101966-using-voice-mode-on-claude-mobile-apps";

// Static-mode bar heights used when reduced-motion is on. Module-scope so
// each <Visualizer> render reuses the same frozen array.
const STATIC_BAR_HEIGHTS = [0.3, 0.65, 0.85, 0.5, 0.35];

const USER_LINE =
  "Tôi đang trên đường đi làm, giải thích ngắn gọn về supervised learning trong 60 giây bằng tiếng Việt.";

const CLAUDE_LINE =
  "Học có giám sát nghĩa là mình đưa cho mô hình cả dữ liệu đầu vào lẫn đáp án đúng — mô hình học cách đi từ cái trước đến cái sau. Ví dụ: vài nghìn email kèm nhãn 'spam' hay 'không spam' là dữ liệu huấn luyện điển hình.";

// Playhead phases — keep as named constants so the choreography and the
// annotation showAt windows stay in lockstep with zero magic numbers.
const PHASE_USER_END = 0.3;
const PHASE_THINKING_END = 0.4;
const PHASE_CLAUDE_END = 0.9;
// 0.9 → 1.0 = silent/idle tail.

// ---------------------------------------------------------------------------
// Annotations (4 pins) — anchors are percent of the PHONE shell
// ---------------------------------------------------------------------------
//
// Phone-shell calibration notes (2026-04-19):
//   - Phone width 390 / height 700. Status bar ~36px at top, home indicator
//     ~24px at bottom. The visualizer is vertically centered in the body,
//     so it sits roughly at 40% of shell height.
//   - Transcript lives below the visualizer at ~60% height.
//   - Control row (Mute / End / Keyboard) sits at the bottom, ~84% height.
//   - Pin 1 (user-speaking visualizer): center column, upper half  → 50, 40.
//   - Pin 2 (live transcript):          center column, mid  → 50, 60.
//   - Pin 3 (Claude-speaking visualizer): same center as pin 1 but shown
//     only during Claude's phase → 50, 40 but with showAt offset.
//   - Pin 4 (End-call button):          right of the button row → 64, 84.
//
const ANNOTATIONS: Annotation[] = [
  {
    id: "user-speaking",
    pin: 1,
    label: "Bạn nói — Claude nghe trực tiếp",
    description:
      "Khi bạn nói, vòng sóng phản ứng theo giọng bạn. Claude nhận âm thanh trực tiếp, không cần bạn bấm nút gửi.",
    showAt: [0.0, PHASE_THINKING_END],
    anchor: { x: 50, y: 40 },
  },
  {
    id: "live-transcript",
    pin: 2,
    label: "Bản chép hiện ngay tại đó",
    description:
      "Mọi câu bạn nói — và mọi câu Claude đáp — đều hiện thành bản chép ngay dưới vòng sóng, để bạn xem lại nếu cần.",
    showAt: [0.1, 0.55],
    anchor: { x: 50, y: 60 },
  },
  {
    id: "claude-speaking",
    pin: 3,
    label: "Claude đáp lại bằng giọng nói",
    description:
      "Sau một nhịp suy nghĩ ngắn, Claude đáp bằng giọng nói. Vòng sóng chuyển sang nhịp nhẹ hơn — rõ là đến lượt Claude.",
    showAt: [PHASE_THINKING_END, PHASE_CLAUDE_END],
    anchor: { x: 50, y: 40 },
  },
  {
    id: "end-call",
    pin: 4,
    label: "Kết thúc, tắt mic, hoặc chuyển bàn phím",
    description:
      "Bạn có thể tắt tiếng, chuyển về bàn phím, hoặc kết thúc cuộc gọi bất cứ lúc nào. Không có thời lượng tối thiểu.",
    showAt: [0.4, 1.0],
    anchor: { x: 64, y: 84 },
  },
];

const CROSS_LINKS: Array<{ href: string; title: string; blurb: string }> = [
  {
    href: "/claude/chat",
    title: "Chat + phản hồi trực tiếp",
    blurb:
      "Voice Mode và Chat là hai cách hội thoại — cùng một mô hình Claude, chỉ khác cách bạn đưa câu hỏi vào.",
  },
  {
    href: "/claude/projects",
    title: "Workspace (Projects)",
    blurb:
      "Gọi voice trong một Project — Claude vẫn nhớ các tệp và hướng dẫn bạn đã gắn trong Project đó.",
  },
  {
    href: "/claude/files-vision",
    title: "Files & Vision",
    blurb:
      "Khi cần chi tiết, chuyển sang chế độ chữ và kéo thả PDF/ảnh — Voice không đọc file kèm.",
  },
];

// ---------------------------------------------------------------------------
// Audio-visualizer — motion.div bars with scaleY loop, respects reduced-motion
// ---------------------------------------------------------------------------

interface VisualizerProps {
  /**
   * "user"   → fast, lively pattern (someone actively speaking)
   * "claude" → gentler, slower pattern (Claude replying aloud)
   * "idle"   → bars breathe almost flat (thinking / silent)
   */
  mode: "user" | "claude" | "idle";
}

/**
 * Pure-presentational audio visualizer. 9 vertical bars arranged in a
 * horizontal row; each bar's `scaleY` loops between a low and high value
 * via framer-motion's `transition: { repeat: Infinity, repeatType:
 * "mirror" }`. Staggered `delay` per bar gives the waveform its organic
 * look without scripting.
 *
 * Reduced-motion: when `useReducedMotion()` is `true` (or `null`, pre-
 * hydration), we render 5 static bars at varied heights — enough visual
 * texture to suggest "audio UI" without any animation.
 */
const Visualizer = memo(function Visualizer({ mode }: VisualizerProps) {
  const reduce = useReducedMotion();
  const motionOK = reduce === false;

  // Per-mode animation parameters. "Gentler" for claude ≈ smaller range
  // and slower period; "lively" for user ≈ larger range, faster period.
  // Idle is barely-there so the ring reads as listening rather than off.
  const params = useMemo(() => {
    switch (mode) {
      case "user":
        return { min: 0.25, max: 1.0, duration: 0.45 };
      case "claude":
        return { min: 0.35, max: 0.75, duration: 0.7 };
      case "idle":
      default:
        return { min: 0.18, max: 0.28, duration: 1.4 };
    }
  }, [mode]);

  const ringColor =
    mode === "claude"
      ? "var(--turquoise-ink, #13343B)"
      : "var(--foreground, #141413)";

  return (
    <div
      role="img"
      aria-label={
        mode === "user"
          ? "Sóng âm khi bạn đang nói"
          : mode === "claude"
            ? "Sóng âm khi Claude đang nói"
            : "Sóng âm khi đang chờ"
      }
      className="relative mx-auto flex items-center justify-center"
      style={{ width: 220, height: 220 }}
    >
      {/* Outer breathing ring — a subtle halo behind the bars. Always
          animated when motion is OK; static when reduced. */}
      {motionOK ? (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${ringColor}`,
            opacity: 0.18,
          }}
          initial={{ scale: 0.92, opacity: 0.18 }}
          animate={{
            scale: mode === "idle" ? [0.92, 0.96] : [0.94, 1.04],
            opacity: mode === "idle" ? [0.1, 0.2] : [0.12, 0.28],
          }}
          transition={{
            duration: params.duration * 2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${ringColor}`, opacity: 0.18 }}
        />
      )}

      {/* Bars */}
      <div
        className="flex items-center gap-1.5"
        style={{ height: 120 }}
      >
        {motionOK
          ? Array.from({ length: 9 }).map((_, i) => {
              // Delay stagger: a 9-bar row reads best when offsets cover
              // roughly one full period, so bars aren't all in phase.
              const delay = (i / 9) * params.duration;
              return (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  className="block w-1.5 rounded-full"
                  style={{
                    background: ringColor,
                    height: 100,
                    transformOrigin: "center",
                  }}
                  initial={{ scaleY: params.min }}
                  animate={{ scaleY: [params.min, params.max] }}
                  transition={{
                    duration: params.duration,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay,
                  }}
                />
              );
            })
          : STATIC_BAR_HEIGHTS.map((h, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="block w-1.5 rounded-full"
                style={{
                  background: ringColor,
                  height: 100 * h,
                }}
              />
            ))}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Live-transcript block — progressive text reveal driven by playhead
// ---------------------------------------------------------------------------

function revealText(full: string, progress: number): string {
  // progress is 0..1 over the phase. Reveal characters linearly; minimum
  // of 1 char once the phase has begun so the line doesn't flash empty.
  if (progress <= 0) return "";
  const clamped = Math.max(0, Math.min(1, progress));
  const chars = Math.max(1, Math.round(full.length * clamped));
  return full.slice(0, chars);
}

interface TranscriptProps {
  /** 0..1 playhead passed through from the demo. */
  playhead: number;
}

const Transcript = memo(function Transcript({ playhead }: TranscriptProps) {
  // Which speaker is live depends on the phase; text reveal is scaled
  // within the phase so it feels like streaming from a live mic.
  const userProgress =
    playhead <= 0
      ? 0
      : playhead >= PHASE_USER_END
        ? 1
        : playhead / PHASE_USER_END;
  const claudeProgress =
    playhead <= PHASE_THINKING_END
      ? 0
      : playhead >= PHASE_CLAUDE_END
        ? 1
        : (playhead - PHASE_THINKING_END) /
          (PHASE_CLAUDE_END - PHASE_THINKING_END);

  const isThinking =
    playhead >= PHASE_USER_END && playhead < PHASE_THINKING_END;

  const userText = revealText(USER_LINE, userProgress);
  const claudeText = revealText(CLAUDE_LINE, claudeProgress);

  return (
    <div className="mx-5 flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-tertiary">
          Bạn
        </span>
        <p
          className="min-h-[44px] rounded-[10px] bg-[var(--paper-2,#F3F2EE)] px-3 py-2 text-[13px] leading-[1.5] text-foreground"
          aria-live="polite"
        >
          {userText || (
            <span className="text-tertiary">Nhấn nút micro và bắt đầu nói…</span>
          )}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-tertiary">
          Claude
        </span>
        <p
          className="min-h-[56px] rounded-[10px] bg-[var(--pure-white,#FFFFFF)] px-3 py-2 text-[13px] leading-[1.5] text-foreground"
          style={{ border: "1px solid var(--border)" }}
          aria-live="polite"
        >
          {isThinking ? (
            <span className="text-tertiary italic">Claude đang nghĩ…</span>
          ) : claudeText ? (
            claudeText
          ) : (
            <span className="text-tertiary">Chờ Claude đáp…</span>
          )}
        </p>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Control row — Mute, End call, Keyboard. Non-interactive; pure decoration.
// ---------------------------------------------------------------------------

const ControlRow = memo(function ControlRow() {
  return (
    <div className="mt-auto flex items-center justify-center gap-5 pb-6">
      <span
        aria-label="Tắt mic"
        role="img"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-[var(--paper-2,#F3F2EE)] text-foreground"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <MicOff size={18} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span
        aria-label="Kết thúc cuộc gọi"
        role="img"
        className="flex h-14 w-14 items-center justify-center rounded-full text-white"
        style={{ background: "#C73D3D", boxShadow: "var(--shadow-sm)" }}
      >
        <PhoneOff size={22} strokeWidth={2} aria-hidden="true" />
      </span>
      <span
        aria-label="Chuyển sang bàn phím"
        role="img"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-[var(--paper-2,#F3F2EE)] text-foreground"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <Keyboard size={18} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Voice UI body — assembles visualizer + transcript + controls, driven by playhead
// ---------------------------------------------------------------------------

function VoiceBody({ playhead }: { playhead: number }) {
  const mode: VisualizerProps["mode"] =
    playhead < PHASE_USER_END
      ? "user"
      : playhead < PHASE_THINKING_END
        ? "idle"
        : playhead < PHASE_CLAUDE_END
          ? "claude"
          : "idle";

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 items-center justify-center">
        <Visualizer mode={mode} />
      </div>
      <Transcript playhead={playhead} />
      <ControlRow />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export — the full tile
// ---------------------------------------------------------------------------

export default function VoiceTile() {
  const tile = findTile("voice");
  const viTitle = tile?.viTitle ?? "Voice Mode";

  const { playhead, playing, onPlay, onReset, onStep } = useDemoPlayhead({
    duration: 8000,
    pauseAtEnd: 1500,
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

      {/* Hero demo — phone shell, voice UI scripted by playhead */}
      <DemoCanvas
        title={viTitle}
        onPlay={onPlay}
        onReset={onReset}
        onStep={onStep}
        playing={playing}
      >
        <div className="relative">
          <ClaudePhoneShell appTitle="Voice Mode">
            <VoiceBody playhead={playhead} />
          </ClaudePhoneShell>
          <AnnotationLayer annotations={ANNOTATIONS} playhead={playhead} />
        </div>
      </DemoCanvas>

      {/* Illustrative-surface note — the phone shell is one of two
          legitimate surfaces for Voice Mode; web (claude.ai) has the same
          flow through the sound-wave icon in the text input. */}
      <p className="max-w-[62ch] text-[12px] leading-[1.55] text-tertiary">
        Mô phỏng trên dùng giao diện app di động cho rõ; giao diện trên
        Claude web cũng có cùng luồng (nút sóng âm → nói → bản chép).
      </p>

      {/* Honest disclosure — link to the canonical Anthropic support
          article for Voice Mode. */}
      <ViewRealUI
        href={VOICE_DOC_HREF}
        label="Xem hướng dẫn Voice Mode từ Anthropic"
        caption="Mở bài hướng dẫn Voice Mode gốc từ Anthropic (ảnh chụp 2026-04-19). Mô tả chi tiết cách bật trên web và app, 5 giọng để chọn, và giới hạn phiên."
      />

      {/* Plan-availability note — grounded in the canonical support
          article (fetched 2026-04-19). */}
      <p
        role="note"
        className="max-w-[62ch] text-[12px] leading-[1.55] text-tertiary"
      >
        Voice Mode đang ở giai đoạn beta, hiện chỉ hỗ trợ tiếng Anh.
        Anthropic cho biết tính năng có trên mọi gói (Free, Pro, Max,
        Team, Enterprise) ở cả Claude web lẫn app di động (iOS và
        Android), nhưng trên bảng giá bản web chỉ Pro trở lên được đánh
        dấu tick; Free vẫn dùng được với giới hạn khoảng 20–30 lượt nói
        mỗi phiên. Lần đầu bật Voice Mode, bạn chọn 1 trong 5 giọng đọc
        của Claude. Enterprise admin có thể tắt Voice Mode cho tổ chức
        qua yêu cầu hỗ trợ. Lưu ý: Claude Desktop trên Mac có tính năng
        Caps Lock để đọc chính tả — đó là nhập văn bản bằng giọng,
        KHÔNG phải Voice Mode (Claude không đáp lại bằng giọng nói).
      </p>

      {/* "Cách nó hoạt động" — three crop cards using shared primitives. */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[22px] font-semibold leading-[1.25] text-foreground md:text-[26px]">
          Cách nó hoạt động
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <CropCard
            title="Nói vào, Claude hiểu ngay"
            caption="Bạn mở Voice Mode trên Claude web (biểu tượng sóng âm ở góc phải thanh nhập) hoặc trong app di động, và bắt đầu nói. Không cần bấm gửi — Claude nhận âm thanh trực tiếp khi bạn đang nói."
          >
            <div
              className="flex items-center gap-3 rounded-[12px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-3"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--paper-2,#F3F2EE)] text-foreground"
              >
                <Mic size={16} strokeWidth={1.8} />
              </span>
              <span className="text-[12px] text-foreground">
                &ldquo;Giải thích ngắn gọn về supervised learning…&rdquo;
              </span>
            </div>
            <CropAnnotation
              pin={1}
              label="Giọng vào — thời gian thực"
            />
          </CropCard>

          <CropCard
            title="Lời hiện thành bản chép"
            caption="Mọi câu bạn nói và mọi câu Claude đáp đều được chuyển thành bản chép ngay dưới vòng sóng. Xem lại, sao chép, hoặc đối chiếu — không mất gì."
          >
            <div
              className="flex flex-col gap-2 rounded-[12px] border border-border bg-[var(--paper,#FBFAF7)] px-3 py-2.5"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-tertiary">
                  Bạn
                </span>
                <span className="text-[12px] text-foreground">
                  Giải thích supervised learning trong 60 giây…
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-tertiary">
                  Claude
                </span>
                <span className="text-[12px] text-foreground">
                  Học có giám sát nghĩa là mình đưa cho mô hình cả dữ liệu
                  đầu vào lẫn đáp án đúng…
                </span>
              </div>
            </div>
            <CropAnnotation
              pin={2}
              label="Bản chép hiện ngay bên dưới"
            />
          </CropCard>

          <CropCard
            title="Claude đáp lại bằng giọng nói"
            caption="Sau một nhịp suy nghĩ ngắn, Claude đáp bằng giọng — kèm bản chép cho bạn xem lại. Lần đầu bật Voice Mode, bạn chọn 1 trong 5 giọng đọc của Claude. Muốn dừng giữa chừng, bạn chạm nút kết thúc."
          >
            <div
              className="flex items-center justify-center gap-4 rounded-[12px] border border-border bg-[var(--pure-white,#FFFFFF)] px-3 py-4"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              {[0.5, 0.8, 0.45, 0.9, 0.55].map((h, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="block w-1.5 rounded-full"
                  style={{
                    background: "var(--turquoise-ink, #13343B)",
                    height: 32 * h,
                  }}
                />
              ))}
            </div>
            <CropAnnotation
              pin={3}
              label="Giọng ra + bản chép song song"
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
          Bấm mở Claude web với câu hỏi mẫu, sau đó bấm biểu tượng sóng âm
          ở góc phải thanh nhập để thử bằng giọng nói. (Hoặc mở Claude
          trên app di động và paste câu hỏi.)
        </p>
        <DeepLinkCTA prompt="Tôi đang trên đường đi làm, giải thích ngắn gọn về supervised learning trong 60 giây bằng tiếng Việt." />
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
