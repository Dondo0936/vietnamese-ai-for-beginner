import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { ReactNode } from "react";
import { ArrowRight, Zap, Send, Loader } from "lucide-react";

import { AnimatedIn } from "./components/AnimatedIn";
import { COLORS, VN_TEXT_RENDER } from "./tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "./fonts";

/**
 * Lesson video — Response Streaming.
 *
 * A 7-scene explainer sharing design language with LessonTokenization:
 * same turquoise/clay/peach tokens, same LessonFrame top bar, same
 * AnimatedIn reveals. Narrative follows the paired article:
 * hook → non-streaming wait → streaming reveal → TTFT bars → SSE under
 * the hood → aha → CTA.
 *
 * Durations (frames @30fps):
 *   cover 100 · wait 130 · stream 150 · compare 130
 *   sse 110 · aha 110 · cta 80   = 810
 *
 * TransitionSeries overlaps each transition with both adjacent sequences,
 * so total = sum(seq) − sum(trans) = 810 − 6 × 20 = 690 frames
 * at 30fps ≈ 23.0 seconds.
 */

export const LESSON_RESPONSE_STREAMING_DURATION = 690;

const TRANS = 20;
const springFast = springTiming({
  durationInFrames: TRANS,
  config: { damping: 200, overshootClamping: true },
});
const linearFast = linearTiming({ durationInFrames: TRANS });

export const LessonResponseStreamingComposition = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100}>
          <CoverScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <NonStreamingScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={150}>
          <StreamingScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <CompareScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={110}>
          <SseScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={110}>
          <AhaScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={80}>
          <CtaScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Shared frame — topbar ties all scenes to "bài response streaming"        */
/* ──────────────────────────────────────────────────────────────────────── */

const LessonFrame = ({
  children,
  step,
  label,
}: {
  children: ReactNode;
  step: number;
  label: string;
}) => (
  <AbsoluteFill style={{ background: COLORS.paper, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, rgba(32, 184, 176, 0.07), transparent 55%)`,
        pointerEvents: "none",
      }}
    />

    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 46,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        borderBottom: `1px solid ${COLORS.line}`,
        background: "rgba(251, 250, 247, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        zIndex: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Star />
        <span
          style={{
            fontFamily: FONT_VN_DISPLAY,
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.ink,
            letterSpacing: "-0.01em",
          }}
        >
          udemi
        </span>
        <span
          style={{
            marginLeft: 10,
            paddingLeft: 12,
            borderLeft: `1px solid ${COLORS.line}`,
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: COLORS.graphite,
            textTransform: "lowercase",
            letterSpacing: "0.04em",
          }}
        >
          articles / response-streaming
        </span>
      </div>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: COLORS.ash,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
        }}
      >
        Bước {step} / 7 · {label}
      </span>
    </div>

    <div style={{ position: "absolute", inset: "46px 0 0 0", overflow: "hidden" }}>
      {children}
    </div>
  </AbsoluteFill>
);

const Star = () => (
  <svg width={16} height={16} viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
    <g stroke={COLORS.turquoise500} strokeWidth={1.4} strokeLinecap="round">
      <line x1={9} y1={1} x2={9} y2={17} />
      <line x1={1} y1={9} x2={17} y2={9} />
      <line x1={3.3} y1={3.3} x2={14.7} y2={14.7} />
      <line x1={14.7} y1={3.3} x2={3.3} y2={14.7} />
    </g>
  </svg>
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 1 — Cover                                                          */
/* ──────────────────────────────────────────────────────────────────────── */

const CoverScene = () => (
  <LessonFrame step={1} label="Mở đầu">
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 80px",
      }}
    >
      <AnimatedIn delay={4} offsetY={8} duration={16}>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: COLORS.turquoise700,
          }}
        >
          ✳ Bài Response Streaming · Infra · Dễ
        </span>
      </AnimatedIn>

      <AnimatedIn delay={12} offsetY={18} duration={22}>
        <h1
          style={{
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,
            fontSize: 88,
            fontWeight: 500,
            letterSpacing: "-0.035em",
            lineHeight: 0.96,
            color: COLORS.ink,
            margin: "18px 0 0",
            maxWidth: 980,
          }}
        >
          Vì sao ChatGPT<br />
          hiện chữ{" "}
          <span
            style={{
              position: "relative",
              display: "inline-block",
              color: COLORS.turquoise600,
            }}
          >
            từng chút một?
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "56%",
                height: 6,
                background: COLORS.turquoise300,
                opacity: 0.7,
                transform: "skewY(-2deg)",
              }}
            />
          </span>
        </h1>
      </AnimatedIn>

      <AnimatedIn delay={26} offsetY={10} duration={18}>
        <p
          style={{
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,
            fontSize: 18,
            color: COLORS.graphite,
            margin: "26px 0 0",
            maxWidth: 640,
            lineHeight: 1.55,
          }}
        >
          Không phải hiệu ứng. Đó là cách server đẩy từng token về browser
          ngay khi model vừa sinh ra — gọi là response streaming.
        </p>
      </AnimatedIn>

      <AnimatedIn delay={40} offsetY={8} duration={16}>
        <div
          style={{
            marginTop: 36,
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.ash,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          <span>udemi.tech/articles/response-streaming</span>
          <span>·</span>
          <span>~6 phút đọc</span>
          <span>·</span>
          <span>SSE · TTFT</span>
        </div>
      </AnimatedIn>
    </div>
  </LessonFrame>
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 2 — Non-streaming (spinner forever)                                */
/* ──────────────────────────────────────────────────────────────────────── */

const NonStreamingScene = () => {
  const frame = useCurrentFrame();
  const spinnerAngle = (frame * 6) % 360;
  const clock = interpolate(frame, [16, 110], [0, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <LessonFrame step={2} label="Không streaming">
      <div
        style={{
          height: "100%",
          padding: "44px 100px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <AnimatedIn delay={2} offsetY={6} duration={14}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 40,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              color: COLORS.ink,
              margin: 0,
            }}
          >
            Cách xưa — gửi hết một cục.
          </h2>
        </AnimatedIn>

        <AnimatedIn delay={8} offsetY={10} duration={16}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 16,
              color: COLORS.graphite,
              margin: 0,
              maxWidth: 700,
              lineHeight: 1.5,
            }}
          >
            Browser gửi prompt, server chờ model sinh hết 200 token,
            rồi mới trả toàn bộ về. Người dùng nhìn spinner quay cho tới
            giây thứ 8.
          </p>
        </AnimatedIn>

        {/* Chat surface */}
        <AnimatedIn delay={14} offsetY={16} duration={18}>
          <div
            style={{
              flex: 1,
              background: COLORS.white,
              border: `1px solid ${COLORS.line}`,
              borderRadius: 18,
              boxShadow: "0 18px 40px rgba(17,17,17,0.08)",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 18,
              maxWidth: 840,
              margin: "0 auto",
              width: "100%",
            }}
          >
            {/* User bubble */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  maxWidth: 420,
                  padding: "14px 20px",
                  background: COLORS.ink,
                  color: COLORS.paper,
                  borderRadius: "18px 18px 4px 18px",
                  fontFamily: FONT_VN_DISPLAY,
                  ...VN_TEXT_RENDER,
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                }}
              >
                Giải thích response streaming giúp mình.
              </div>
            </div>

            {/* Bot bubble — forever loading */}
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: COLORS.turquoise500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.white,
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                AI
              </div>
              <div
                style={{
                  maxWidth: 500,
                  padding: "18px 22px",
                  background: COLORS.paper2,
                  color: COLORS.ink,
                  borderRadius: "18px 18px 18px 4px",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    transform: `rotate(${spinnerAngle}deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader size={20} strokeWidth={2.2} color={COLORS.ash} />
                </div>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 13,
                    color: COLORS.ash,
                    letterSpacing: "0.06em",
                  }}
                >
                  đang suy nghĩ…
                </span>
              </div>
            </div>

            {/* Meta bar — big clock */}
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 16,
                borderTop: `1px dashed ${COLORS.line}`,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  color: COLORS.ash,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Kết nối mở · chưa có byte nào
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 4,
                  fontFamily: FONT_VN_DISPLAY,
                  ...VN_TEXT_RENDER,
                  color: COLORS.clay,
                  fontWeight: 600,
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                }}
              >
                {clock.toFixed(1)}
                <span style={{ fontSize: 14 }}>s</span>
              </span>
            </div>
          </div>
        </AnimatedIn>
      </div>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 3 — Streaming (tokens peel in progressively)                       */
/* ──────────────────────────────────────────────────────────────────────── */

const STREAM_TOKENS = [
  { text: "Res", color: COLORS.turquoise500 },
  { text: "ponse", color: COLORS.turquoise600 },
  { text: " stream", color: COLORS.peach500 },
  { text: "ing", color: COLORS.clay },
  { text: " đẩy", color: COLORS.turquoise700 },
  { text: " từng", color: COLORS.turquoise500 },
  { text: " token", color: COLORS.peach500 },
  { text: " về", color: COLORS.turquoise600 },
  { text: " ngay.", color: COLORS.clay },
] as const;

const StreamingScene = () => {
  const frame = useCurrentFrame();

  // TTFT badge appears at frame 10.
  const ttftOpacity = interpolate(frame, [10, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tokens start from frame 20, one every 11 frames (~275ms each).
  const visibleCount = Math.min(
    STREAM_TOKENS.length,
    Math.max(0, Math.floor((frame - 20) / 11)),
  );

  return (
    <LessonFrame step={3} label="Streaming">
      <div
        style={{
          height: "100%",
          padding: "44px 100px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <AnimatedIn delay={2} offsetY={6} duration={14}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 40,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              color: COLORS.ink,
              margin: 0,
            }}
          >
            Cách nay — nhỏ giọt, có token nào đẩy ngay token đó.
          </h2>
        </AnimatedIn>

        <div
          style={{
            flex: 1,
            background: COLORS.white,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 18,
            boxShadow: "0 18px 40px rgba(17,17,17,0.08)",
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 840,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                maxWidth: 420,
                padding: "14px 20px",
                background: COLORS.ink,
                color: COLORS.paper,
                borderRadius: "18px 18px 4px 18px",
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              Giải thích response streaming giúp mình.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: COLORS.turquoise500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.white,
                fontFamily: FONT_MONO,
                fontSize: 13,
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              AI
            </div>
            <div
              style={{
                maxWidth: 620,
                minHeight: 110,
                padding: "16px 20px",
                background: COLORS.paper2,
                color: COLORS.ink,
                borderRadius: "18px 18px 18px 4px",
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,
                fontSize: 20,
                fontWeight: 500,
                lineHeight: 1.45,
                letterSpacing: "-0.005em",
                display: "flex",
                flexWrap: "wrap",
                alignContent: "flex-start",
              }}
            >
              {STREAM_TOKENS.map((tk, i) => {
                const inFrame = 20 + i * 11;
                const opacity = interpolate(
                  frame,
                  [inFrame, inFrame + 9],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );
                const slide = interpolate(
                  frame,
                  [inFrame, inFrame + 12],
                  [6, 0],
                  {
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                );
                const visible = i < visibleCount;
                return (
                  <span
                    key={i}
                    style={{
                      opacity,
                      transform: `translateY(${slide}px)`,
                      color: visible ? tk.color : COLORS.ink,
                      fontWeight: 600,
                      marginRight: 1,
                      whiteSpace: "pre",
                    }}
                  >
                    {tk.text}
                  </span>
                );
              })}
              {visibleCount < STREAM_TOKENS.length && frame > 22 && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 22,
                    marginLeft: 3,
                    background: COLORS.turquoise600,
                    alignSelf: "center",
                    opacity: (frame % 14 < 7) ? 1 : 0,
                  }}
                />
              )}
            </div>
          </div>

          {/* Meta row */}
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 14,
              borderTop: `1px dashed ${COLORS.line}`,
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.ash,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              SSE · text/event-stream · đang live
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.turquoise700,
                background: COLORS.turquoise50,
                padding: "4px 10px",
                borderRadius: 999,
                fontWeight: 600,
                opacity: ttftOpacity,
              }}
            >
              <Zap size={12} strokeWidth={2} /> TTFT 280ms
            </span>
          </div>
        </div>
      </div>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 4 — Compare (TTFT vs total) — bars side by side                    */
/* ──────────────────────────────────────────────────────────────────────── */

const CompareScene = () => {
  const frame = useCurrentFrame();

  // Bars grow to full width 0..100 over frames 10..72.
  const barA = interpolate(frame, [12, 72], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const barB = interpolate(frame, [12, 72], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Bar B ttft marker (first 3.5%) pops almost immediately.
  const ttftMarker = interpolate(frame, [18, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <LessonFrame step={4} label="TTFT">
      <div
        style={{
          height: "100%",
          padding: "40px 90px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <AnimatedIn delay={2} offsetY={8} duration={16}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 42,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.04,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
            }}
          >
            Cùng 8 giây. Khác nhau — chữ đầu bao giờ ra.
          </h2>
        </AnimatedIn>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 26,
            maxWidth: 960,
            width: "100%",
            margin: "8px auto 0",
          }}
        >
          {/* Non-streaming bar */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLORS.ash,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                }}
              >
                Non-streaming
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  color: COLORS.ash,
                  letterSpacing: "0.08em",
                }}
              >
                TTFT — (spinner) · total 8.0s
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: 44,
                background: COLORS.paper2,
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${COLORS.line}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${barA * 100}%`,
                  background: `repeating-linear-gradient(90deg, ${COLORS.line} 0 8px, ${COLORS.paper3} 8px 16px)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 13,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLORS.graphite,
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                NGƯỜI DÙNG CHỜ 8S
              </div>
            </div>
          </div>

          {/* Streaming bar */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLORS.turquoise700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                }}
              >
                Streaming
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  color: COLORS.ash,
                  letterSpacing: "0.08em",
                }}
              >
                TTFT 0.28s · total 8.0s
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: 44,
                background: COLORS.paper2,
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${COLORS.line}`,
              }}
            >
              {/* TTFT marker */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${3.5 * ttftMarker}%`,
                  background: COLORS.turquoise500,
                }}
              />
              {/* Rest */}
              <div
                style={{
                  position: "absolute",
                  left: `${3.5 * ttftMarker}%`,
                  top: 0,
                  bottom: 0,
                  width: `${(barB * 100 - 3.5 * ttftMarker)}%`,
                  background: `repeating-linear-gradient(90deg, ${COLORS.turquoise100} 0 8px, ${COLORS.turquoise50} 8px 16px)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 13,
                  left: 14,
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLORS.white,
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  opacity: ttftMarker,
                }}
              >
                280ms →
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 13,
                  right: 14,
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLORS.turquoise700,
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  opacity: interpolate(frame, [72, 90], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                ← ĐỌC DẦN TRONG 8S
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: COLORS.ash,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            <span>0s</span>
            <span>4s</span>
            <span>8s · hết response</span>
          </div>
        </div>

        <AnimatedIn delay={78} offsetY={8} duration={14}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 16,
              color: COLORS.graphite,
              textAlign: "center",
              margin: 0,
              maxWidth: 760,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.5,
            }}
          >
            Người dùng muốn thấy AI trả lời như một con người đang typing —
            streaming cho họ cảm giác đó.
          </p>
        </AnimatedIn>
      </div>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 5 — SSE under the hood                                             */
/* ──────────────────────────────────────────────────────────────────────── */

const SSE_CHUNKS = [
  { t: 0, text: "event: token" },
  { t: 1, text: 'data: {"t":"Res"}' },
  { t: 2, text: 'data: {"t":"ponse"}' },
  { t: 3, text: 'data: {"t":" stream"}' },
  { t: 4, text: 'data: {"t":"ing"}' },
  { t: 5, text: "data: [DONE]" },
] as const;

const SseScene = () => {
  const frame = useCurrentFrame();
  return (
    <LessonFrame step={5} label="Dưới mui xe">
      <div
        style={{
          height: "100%",
          padding: "40px 100px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <AnimatedIn delay={2} offsetY={6} duration={14}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 40,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              color: COLORS.ink,
              margin: 0,
            }}
          >
            Không phép thuật — chỉ là một HTTP header.
          </h2>
        </AnimatedIn>

        <AnimatedIn delay={10} offsetY={8} duration={16}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: FONT_MONO,
              fontSize: 13,
              color: COLORS.turquoise700,
              background: COLORS.turquoise50,
              border: `1px solid ${COLORS.turquoise100}`,
              padding: "10px 16px",
              borderRadius: 10,
              width: "fit-content",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            Content-Type: text/event-stream
          </div>
        </AnimatedIn>

        <div
          style={{
            flex: 1,
            background: COLORS.white,
            border: `1px solid ${COLORS.line}`,
            borderRadius: 14,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxShadow: "0 10px 24px rgba(17,17,17,0.05)",
            fontFamily: FONT_MONO,
            fontSize: 16,
            maxWidth: 880,
            width: "100%",
            margin: "0 auto",
          }}
        >
          {SSE_CHUNKS.map((c, i) => {
            const inFrame = 24 + i * 12;
            const opacity = interpolate(frame, [inFrame, inFrame + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const y = interpolate(frame, [inFrame, inFrame + 14], [6, 0], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const isDone = c.text.includes("DONE");
            return (
              <div
                key={c.text}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  opacity,
                  transform: `translateY(${y}px)`,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: COLORS.ash,
                    minWidth: 58,
                    letterSpacing: "0.05em",
                  }}
                >
                  +{c.t * 40}ms
                </span>
                <span
                  style={{
                    padding: "4px 10px",
                    background: isDone ? COLORS.paper3 : COLORS.turquoise50,
                    color: isDone ? COLORS.ash : COLORS.turquoise700,
                    border: `1px solid ${isDone ? COLORS.line : COLORS.turquoise100}`,
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {c.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 6 — Aha                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

const AhaScene = () => (
  <LessonFrame step={6} label="Khoảnh khắc à-ha">
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 100px",
      }}
    >
      <AnimatedIn delay={4} offsetY={20} duration={24}>
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.turquoise300}`,
            borderLeft: `6px solid ${COLORS.turquoise500}`,
            borderRadius: 18,
            padding: "34px 42px",
            maxWidth: 920,
            boxShadow: "0 20px 48px rgba(32, 184, 176, 0.14)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Zap size={20} strokeWidth={2.2} color={COLORS.turquoise700} />
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.turquoise700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 600,
              }}
            >
              À-ha
            </span>
          </div>

          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 36,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.12,
              color: COLORS.ink,
              margin: "0 0 18px",
            }}
          >
            Streaming không làm model nhanh hơn. Nó chỉ{" "}
            <span style={{ color: COLORS.turquoise700 }}>
              bóc cái hộp sớm hơn
            </span>
            .
          </h2>

          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 18,
              lineHeight: 1.5,
              color: COLORS.graphite,
              margin: 0,
            }}
          >
            Cùng một LLM. Cùng 8 giây để sinh xong câu trả lời. Khác ở chỗ
            người dùng <b>nhìn thấy</b> quá trình hay <b>nghe spinner</b>.
            Bài học: tối ưu cái người ta cảm giác được, đừng chỉ tối ưu
            cái đồng hồ chạy.
          </p>
        </div>
      </AnimatedIn>
    </div>
  </LessonFrame>
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 7 — CTA                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

const CtaScene = () => {
  const frame = useCurrentFrame();
  const arrowX = interpolate(frame, [20, 60], [0, 10], {
    easing: Easing.bezier(0.33, 1, 0.68, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <LessonFrame step={7} label="Đọc tiếp">
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 80px",
          textAlign: "center",
          gap: 22,
        }}
      >
        <AnimatedIn delay={2} offsetY={8} duration={14}>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: COLORS.ash,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            (end) bạn vừa xem bài Response Streaming
          </span>
        </AnimatedIn>

        <AnimatedIn delay={8} offsetY={16} duration={20}>
          <h1
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 74,
              fontWeight: 500,
              letterSpacing: "-0.035em",
              lineHeight: 0.98,
              color: COLORS.ink,
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            Đọc đầy đủ trên udemi
            <span style={{ transform: `translateX(${arrowX}px)`, display: "inline-flex" }}>
              <ArrowRight size={60} strokeWidth={1.6} color={COLORS.turquoise600} />
            </span>
          </h1>
        </AnimatedIn>

        <AnimatedIn delay={20} offsetY={8} duration={16}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 26px",
              background: COLORS.ink,
              color: COLORS.paper,
              borderRadius: 999,
              fontFamily: FONT_MONO,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            udemi.tech/articles/response-streaming
            <Send size={14} strokeWidth={2} />
          </div>
        </AnimatedIn>

        <AnimatedIn delay={32} offsetY={6} duration={14}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 15,
              color: COLORS.graphite,
              margin: "6px 0 0",
              maxWidth: 560,
              lineHeight: 1.5,
            }}
          >
            SSE · TTFT · đánh đổi non-streaming · khi nào nên dùng — mọi
            thứ trong 6 phút đọc.
          </p>
        </AnimatedIn>
      </div>
    </LessonFrame>
  );
};
