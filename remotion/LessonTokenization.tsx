import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { ReactNode } from "react";
import { ArrowRight, Zap, Send } from "lucide-react";

import { AnimatedIn } from "./components/AnimatedIn";
import { COLORS, VN_TEXT_RENDER } from "./tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "./fonts";

/**
 * Lesson video — Tokenization.
 *
 * A standalone 7-scene explainer for the "tokenization" topic
 * (src/topics/tokenization.tsx). Follows the lesson's own pedagogy:
 * hook → show the gap (VN tokens > EN tokens for the same sentence)
 * → aha (BPE is trained on English) → CTA.
 *
 * Durations (frames @30fps):
 *   cover 100 · prompt 110 · vn 140 · en 120
 *   compare 130 · aha 120 · cta 80   = 800
 *
 * TransitionSeries overlaps each transition with both adjacent sequences,
 * so total = sum(seq) − sum(trans) = 800 − 6 × 20 = 680 frames
 * at 30fps ≈ 22.7 seconds.
 */

export const LESSON_TOKENIZATION_DURATION = 680;

const TRANS = 20;
const springFast = springTiming({
  durationInFrames: TRANS,
  config: { damping: 200, overshootClamping: true },
});
const linearFast = linearTiming({ durationInFrames: TRANS });

export const LessonTokenizationComposition = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100}>
          <CoverScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={110}>
          <PromptScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={140}>
          <TokenizeVNScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={120}>
          <TokenizeENScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <CompareScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={120}>
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
/* Shared frame — topbar ties all scenes to "bài tokenization"              */
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
    {/* Ambient turquoise glow */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, rgba(32, 184, 176, 0.07), transparent 55%)`,
        pointerEvents: "none",
      }}
    />

    {/* Topbar */}
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
          topics / tokenization
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
          ✳ Bài Tokenization · NLP · Khó vừa
        </span>
      </AnimatedIn>

      <AnimatedIn delay={12} offsetY={18} duration={22}>
        <h1
          style={{
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,
            fontSize: 92,
            fontWeight: 500,
            letterSpacing: "-0.035em",
            lineHeight: 0.96,
            color: COLORS.ink,
            margin: "18px 0 0",
            maxWidth: 900,
          }}
        >
          Một câu tiếng Việt<br />
          tốn{" "}
          <span
            style={{
              position: "relative",
              display: "inline-block",
              color: COLORS.clay,
            }}
          >
            2× token
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "56%",
                height: 6,
                background: COLORS.peach500,
                opacity: 0.7,
                transform: "skewY(-2deg)",
              }}
            />
          </span>
          <br />
          ở ChatGPT.
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
            maxWidth: 560,
            lineHeight: 1.55,
          }}
        >
          Hoá đơn API tăng gấp rưỡi — và mọi người Việt dùng ChatGPT đang
          trả thêm tiền mà không biết vì sao.
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
          <span>udemi.tech/topics/tokenization</span>
          <span>·</span>
          <span>~14 phút đọc</span>
          <span>·</span>
          <span>Bài 1 / 9</span>
        </div>
      </AnimatedIn>
    </div>
  </LessonFrame>
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 2 — Prompt (someone types into a chat box)                         */
/* ──────────────────────────────────────────────────────────────────────── */

const PromptScene = () => {
  const frame = useCurrentFrame();
  const userText = "Tôi yêu Việt Nam";
  const typedChars = Math.min(
    userText.length,
    Math.max(0, Math.floor((frame - 14) / 2.5)),
  );
  const typed = userText.slice(0, typedChars);

  // Bot reply bubble appears after typing finishes.
  const replyOpacity = interpolate(frame, [60, 78], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <LessonFrame step={2} label="Hỏi AI">
      <div
        style={{
          height: "100%",
          padding: "48px 120px 56px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <AnimatedIn delay={2} offsetY={6} duration={14}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 38,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              color: COLORS.ink,
              margin: 0,
            }}
          >
            Bạn gõ vào ChatGPT một câu tiếng Việt…
          </h2>
        </AnimatedIn>

        {/* Chat surface */}
        <AnimatedIn delay={8} offsetY={14} duration={18}>
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
              maxWidth: 820,
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
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  minHeight: 50,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {typed || "\u00A0"}
                {typed && typed.length < userText.length && frame % 14 < 7 && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 20,
                      background: COLORS.paper,
                      marginLeft: 3,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Bot bubble */}
            {replyOpacity > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-end",
                  opacity: replyOpacity,
                  transform: `translateY(${(1 - replyOpacity) * 6}px)`,
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
                    padding: "14px 20px",
                    background: COLORS.paper2,
                    color: COLORS.ink,
                    borderRadius: "18px 18px 18px 4px",
                    fontFamily: FONT_VN_DISPLAY,
                    ...VN_TEXT_RENDER,
                    fontSize: 16,
                    lineHeight: 1.5,
                  }}
                >
                  Input: <b>5 tokens</b>
                  <br />
                  <span style={{ color: COLORS.graphite, fontSize: 14 }}>
                    (Ủa — sao lại 5, chứ không phải 4 từ?)
                  </span>
                </div>
              </div>
            )}

            {/* Meta / cost badge */}
            {replyOpacity > 0.3 && (
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 16,
                  borderTop: `1px dashed ${COLORS.line}`,
                  opacity: replyOpacity,
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
                  Prompt gpt-4o · 4 từ · ? token
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: COLORS.clay,
                    background: COLORS.peach200,
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontWeight: 600,
                  }}
                >
                  <Zap size={12} strokeWidth={2} /> Tại sao?
                </span>
              </div>
            )}
          </div>
        </AnimatedIn>
      </div>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 3 — VN tokens peel off                                             */
/* ──────────────────────────────────────────────────────────────────────── */

const VN_TOKENS = [
  { text: "T", color: COLORS.turquoise500 },
  { text: "ôi", color: COLORS.peach500 },
  { text: " yêu", color: COLORS.clay },
  { text: " Việt", color: COLORS.turquoise600 },
  { text: " Nam", color: COLORS.heat500 },
] as const;

const TokenizeVNScene = () => {
  const frame = useCurrentFrame();

  // One token lights up every 18 frames, starting at frame 24.
  const visibleCount = Math.min(
    VN_TOKENS.length,
    Math.max(0, Math.floor((frame - 24) / 18)),
  );

  // Counter ticks once per revealed token, then holds.
  const counter = Math.min(5, visibleCount);

  return (
    <LessonFrame step={3} label="Tiếng Việt">
      <div
        style={{
          height: "100%",
          padding: "42px 90px",
          display: "flex",
          flexDirection: "column",
          gap: 26,
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <AnimatedIn delay={2} offsetY={6} duration={14}>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: COLORS.ash,
            }}
          >
            BPE của GPT-4o · Tách câu tiếng Việt
          </span>
        </AnimatedIn>

        <AnimatedIn delay={6} offsetY={10} duration={16}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 72,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: COLORS.ink,
              margin: 0,
            }}
          >
            &ldquo;Tôi yêu Việt Nam&rdquo;
          </h2>
        </AnimatedIn>

        {/* Arrow */}
        <AnimatedIn delay={18} offsetY={0} duration={12}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 24,
              color: COLORS.ash,
              lineHeight: 1,
            }}
          >
            ↓
          </div>
        </AnimatedIn>

        {/* Token chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            maxWidth: 900,
          }}
        >
          {VN_TOKENS.map((t, i) => {
            const active = i < visibleCount;
            const inFrame = 24 + i * 18;
            const opacity = interpolate(frame, [inFrame, inFrame + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const scale = interpolate(frame, [inFrame, inFrame + 12], [0.6, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 28,
                  fontWeight: 600,
                  color: COLORS.white,
                  background: active ? t.color : COLORS.paper2,
                  padding: "14px 22px",
                  borderRadius: 10,
                  opacity,
                  transform: `scale(${scale})`,
                  boxShadow: active
                    ? `0 10px 24px ${t.color}33`
                    : "none",
                  letterSpacing: "0.02em",
                }}
              >
                {t.text.replace(/ /g, "\u00B7")}
              </span>
            );
          })}
        </div>

        {/* Counter */}
        <AnimatedIn delay={26} offsetY={8} duration={14}>
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              padding: "16px 26px",
              background: COLORS.white,
              border: `1px solid ${COLORS.line}`,
              borderRadius: 14,
              boxShadow: "0 8px 20px rgba(17,17,17,0.06)",
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.ash,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Token count
            </span>
            <span
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,
                fontSize: 54,
                fontWeight: 600,
                color: COLORS.clay,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                minWidth: 58,
                textAlign: "right",
              }}
            >
              {counter}
            </span>
            <span
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,
                fontSize: 18,
                color: COLORS.graphite,
              }}
            >
              tokens · cho 4 từ
            </span>
          </div>
        </AnimatedIn>
      </div>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 4 — EN tokens (same tokenizer, same meaning)                       */
/* ──────────────────────────────────────────────────────────────────────── */

const EN_TOKENS = [
  { text: "I", color: COLORS.turquoise500 },
  { text: " love", color: COLORS.peach500 },
  { text: " Vietnam", color: COLORS.turquoise600 },
] as const;

const TokenizeENScene = () => {
  const frame = useCurrentFrame();
  const visibleCount = Math.min(
    EN_TOKENS.length,
    Math.max(0, Math.floor((frame - 20) / 22)),
  );
  const counter = Math.min(3, visibleCount);

  return (
    <LessonFrame step={4} label="Tiếng Anh">
      <div
        style={{
          height: "100%",
          padding: "42px 90px",
          display: "flex",
          flexDirection: "column",
          gap: 26,
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <AnimatedIn delay={2} offsetY={6} duration={14}>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: COLORS.ash,
            }}
          >
            Cùng BPE. Cùng ý nghĩa. Khác ngôn ngữ.
          </span>
        </AnimatedIn>

        <AnimatedIn delay={6} offsetY={10} duration={16}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 72,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: COLORS.ink,
              margin: 0,
            }}
          >
            &ldquo;I love Vietnam&rdquo;
          </h2>
        </AnimatedIn>

        <AnimatedIn delay={14} offsetY={0} duration={10}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 24,
              color: COLORS.ash,
              lineHeight: 1,
            }}
          >
            ↓
          </div>
        </AnimatedIn>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            maxWidth: 900,
          }}
        >
          {EN_TOKENS.map((t, i) => {
            const active = i < visibleCount;
            const inFrame = 20 + i * 22;
            const opacity = interpolate(frame, [inFrame, inFrame + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const scale = interpolate(frame, [inFrame, inFrame + 12], [0.6, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 28,
                  fontWeight: 600,
                  color: COLORS.white,
                  background: active ? t.color : COLORS.paper2,
                  padding: "14px 22px",
                  borderRadius: 10,
                  opacity,
                  transform: `scale(${scale})`,
                  boxShadow: active
                    ? `0 10px 24px ${t.color}33`
                    : "none",
                  letterSpacing: "0.02em",
                }}
              >
                {t.text.replace(/ /g, "\u00B7")}
              </span>
            );
          })}
        </div>

        <AnimatedIn delay={22} offsetY={8} duration={14}>
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              padding: "16px 26px",
              background: COLORS.white,
              border: `1px solid ${COLORS.line}`,
              borderRadius: 14,
              boxShadow: "0 8px 20px rgba(17,17,17,0.06)",
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.ash,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Token count
            </span>
            <span
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,
                fontSize: 54,
                fontWeight: 600,
                color: COLORS.turquoise700,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                minWidth: 58,
                textAlign: "right",
              }}
            >
              {counter}
            </span>
            <span
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,
                fontSize: 18,
                color: COLORS.graphite,
              }}
            >
              tokens · cho 3 từ
            </span>
          </div>
        </AnimatedIn>
      </div>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 5 — Side by side compare + cost multiplier                         */
/* ──────────────────────────────────────────────────────────────────────── */

const CompareScene = () => {
  const frame = useCurrentFrame();

  // Ratio badge pops after ~40 frames.
  const ratioScale = interpolate(frame, [42, 62], [0.6, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ratioOpacity = interpolate(frame, [42, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <LessonFrame step={5} label="So sánh">
      <div
        style={{
          height: "100%",
          padding: "36px 80px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <AnimatedIn delay={2} offsetY={8} duration={16}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 44,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.02,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
            }}
          >
            Cùng ý nghĩa. Khác hoá đơn.
          </h2>
        </AnimatedIn>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 28,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          {/* VN column */}
          <AnimatedIn delay={10} offsetY={16} duration={18}>
            <CompareCard
              label="Tiếng Việt"
              phrase="Tôi yêu Việt Nam"
              tokens={VN_TOKENS}
              count={5}
              accent={COLORS.clay}
              accentSoft={COLORS.peach200}
            />
          </AnimatedIn>

          {/* Ratio */}
          <div
            style={{
              opacity: ratioOpacity,
              transform: `scale(${ratioScale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.ash,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
              }}
            >
              Tỉ lệ
            </span>
            <span
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,
                fontSize: 74,
                fontWeight: 600,
                color: COLORS.ink,
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              ×1.67
            </span>
            <span
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,
                fontSize: 14,
                color: COLORS.clay,
                fontWeight: 500,
              }}
            >
              +67% hoá đơn
            </span>
          </div>

          {/* EN column */}
          <AnimatedIn delay={16} offsetY={16} duration={18}>
            <CompareCard
              label="Tiếng Anh"
              phrase="I love Vietnam"
              tokens={EN_TOKENS}
              count={3}
              accent={COLORS.turquoise700}
              accentSoft={COLORS.turquoise50}
            />
          </AnimatedIn>
        </div>

        <AnimatedIn delay={58} offsetY={8} duration={14}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 16,
              color: COLORS.graphite,
              textAlign: "center",
              margin: 0,
              maxWidth: 720,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.5,
            }}
          >
            1.000 prompt/tháng × 67% = thêm một tách cà phê mỗi ngày — chỉ vì
            đánh tiếng Việt.
          </p>
        </AnimatedIn>
      </div>
    </LessonFrame>
  );
};

const CompareCard = ({
  label,
  phrase,
  tokens,
  count,
  accent,
  accentSoft,
}: {
  label: string;
  phrase: string;
  tokens: ReadonlyArray<{ text: string; color: string }>;
  count: number;
  accent: string;
  accentSoft: string;
}) => (
  <div
    style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 16,
      padding: 22,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      boxShadow: "0 10px 24px rgba(17,17,17,0.05)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: accent,
          background: accentSoft,
          padding: "4px 10px",
          borderRadius: 999,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT_VN_DISPLAY,
          ...VN_TEXT_RENDER,
          fontSize: 34,
          fontWeight: 600,
          color: accent,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {count}
      </span>
    </div>
    <div
      style={{
        fontFamily: FONT_VN_DISPLAY,
        ...VN_TEXT_RENDER,
        fontSize: 22,
        color: COLORS.ink,
        fontWeight: 500,
        letterSpacing: "-0.01em",
      }}
    >
      &ldquo;{phrase}&rdquo;
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {tokens.map((t, i) => (
        <span
          key={i}
          style={{
            fontFamily: FONT_MONO,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.white,
            background: t.color,
            padding: "6px 10px",
            borderRadius: 6,
          }}
        >
          {t.text.replace(/ /g, "\u00B7")}
        </span>
      ))}
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 6 — Aha moment (why)                                               */
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
            maxWidth: 900,
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
              fontSize: 38,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: COLORS.ink,
              margin: "0 0 18px",
            }}
          >
            BPE được &ldquo;dạy&rdquo; từ corpus tiếng Anh.
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
            Dấu phụ tiếng Việt — ô, ư, ê, ế — không nằm trong từ vựng phổ biến
            của tokenizer. Kết quả: <b>&ldquo;Tôi&rdquo;</b> bị bẻ thành{" "}
            <TokChip text="T" color={COLORS.turquoise500} />{" "}
            <TokChip text="ôi" color={COLORS.peach500} />, còn{" "}
            <b>&ldquo;I&rdquo;</b> vẫn là{" "}
            <TokChip text="I" color={COLORS.turquoise700} /> — một token gọn
            gàng.
          </p>

          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 14,
              lineHeight: 1.5,
              color: COLORS.ash,
              margin: "18px 0 0",
              fontStyle: "italic",
            }}
          >
            &mdash; Giống cắt phở: sợi càng dài, càng ít mảnh. Dấu phụ không có
            trong &ldquo;dao&rdquo; của BPE, nên mỗi âm tiếng Việt bị vụn ra.
          </p>
        </div>
      </AnimatedIn>
    </div>
  </LessonFrame>
);

const TokChip = ({ text, color }: { text: string; color: string }) => (
  <span
    style={{
      fontFamily: FONT_MONO,
      fontSize: 13,
      fontWeight: 600,
      color: COLORS.white,
      background: color,
      padding: "2px 8px",
      borderRadius: 5,
      verticalAlign: "2px",
    }}
  >
    {text}
  </span>
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
    <LessonFrame step={7} label="Học tiếp">
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
            (end) bạn vừa xem bước 1 / 9
          </span>
        </AnimatedIn>

        <AnimatedIn delay={8} offsetY={16} duration={20}>
          <h1
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,
              fontSize: 82,
              fontWeight: 500,
              letterSpacing: "-0.035em",
              lineHeight: 0.96,
              color: COLORS.ink,
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            Học bài Tokenization
            <span style={{ transform: `translateX(${arrowX}px)`, display: "inline-flex" }}>
              <ArrowRight size={68} strokeWidth={1.6} color={COLORS.turquoise600} />
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
            udemi.tech/topics/tokenization
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
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            1 trong 260+ chủ đề — viết lại cho người Việt, qua slider,
            drag-drop, minh hoạ thủ công.
          </p>
        </AnimatedIn>
      </div>
    </LessonFrame>
  );
};
