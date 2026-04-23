import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { ReactNode } from "react";
import { ArrowRight, RotateCw, Eye, Check, X } from "lucide-react";

import { AnimatedIn } from "./components/AnimatedIn";
import { COLORS, VN_TEXT_RENDER } from "./tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "./fonts";

/**
 * Lesson video — Perceptron · Mark I (1958).
 *
 * One interesting fact: the first neural network wasn't code. It was a
 * physical machine with photocells, adjustable resistors, and motors
 * that turned the knobs whenever it guessed wrong. Five-scene arc:
 *   cover → Mark I build → the learn loop → modern tie-in → CTA.
 *
 * Durations (frames @30fps):
 *   cover 100 · build 150 · learn 170 · modern 130 · cta 90 = 640
 *
 * TransitionSeries overlaps each transition with both adjacent sequences,
 * so total = sum(seq) − sum(trans) = 640 − 4 × 20 = 560 frames
 * at 30fps ≈ 18.7 seconds.
 */

export const LESSON_PERCEPTRON_DURATION = 560;

const TRANS = 20;
const springFast = springTiming({
  durationInFrames: TRANS,
  config: { damping: 200, overshootClamping: true },
});
const linearFast = linearTiming({ durationInFrames: TRANS });

export const LessonPerceptronComposition = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100}>
          <CoverScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <BuildScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={170}>
          <LearnScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <ModernScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={90}>
          <CtaScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Shared frame — topbar ties all scenes to the perceptron lesson           */
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
          topics / perceptron
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
        Bước {step} / 5 · {label}
      </span>
    </div>

    <div style={{ position: "absolute", inset: "46px 0 0 0", overflow: "hidden" }}>
      {children}
    </div>
  </AbsoluteFill>
);

const Star = () => (
  <span
    style={{
      position: "relative",
      display: "inline-block",
      width: 14,
      height: 14,
    }}
  >
    <span
      style={{
        position: "absolute",
        inset: 0,
        margin: "auto",
        width: 3,
        height: 14,
        background: COLORS.turquoise500,
        transform: "rotate(45deg)",
      }}
    />
    <span
      style={{
        position: "absolute",
        inset: 0,
        margin: "auto",
        width: 3,
        height: 14,
        background: COLORS.turquoise500,
        transform: "rotate(-45deg)",
      }}
    />
  </span>
);

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 1 · COVER                                                         */
/* ──────────────────────────────────────────────────────────────────────── */

const CoverScene = () => {
  return (
    <LessonFrame step={1} label="Mở đầu">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "0 110px",
        }}
      >
        <AnimatedIn delay={0} duration={18}>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
              color: COLORS.turquoise600,
              textTransform: "uppercase",
              letterSpacing: "0.28em",
              marginBottom: 22,
            }}
          >
            Một sự thật thú vị · Perceptron
          </span>
        </AnimatedIn>

        <AnimatedIn delay={8} duration={22}>
          <h1
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 86,
              lineHeight: 1.04,
              color: COLORS.ink,
              margin: 0,
              maxWidth: 980,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Mạng nơ-ron đầu tiên{" "}
            <span style={{ color: COLORS.clay }}>không phải là code.</span>
          </h1>
        </AnimatedIn>

        <AnimatedIn delay={32} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 26,
              fontWeight: 400,
              color: COLORS.graphite,
              marginTop: 32,
              maxWidth: 820,
              lineHeight: 1.4,
              ...VN_TEXT_RENDER,
            }}
          >
            Nó là một chiếc máy — có photocell, có điện trở xoay, có motor.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 2 · BUILD · 1958, Cornell, Mark I                                  */
/* ──────────────────────────────────────────────────────────────────────── */

const BuildScene = () => {
  const frame = useCurrentFrame();

  return (
    <LessonFrame step={2} label="Bối cảnh">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
          gap: 80,
        }}
      >
        {/* Left column — text */}
        <div style={{ flex: 1, maxWidth: 520 }}>
          <AnimatedIn delay={0} duration={18}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 14px",
                border: `1px solid ${COLORS.turquoise300}`,
                borderRadius: 999,
                background: COLORS.turquoise50,
                fontFamily: FONT_MONO,
                fontSize: 12,
                color: COLORS.turquoise700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                marginBottom: 24,
              }}
            >
              1958 · Cornell
            </div>
          </AnimatedIn>

          <AnimatedIn delay={12} duration={22}>
            <h2
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontWeight: 600,
                fontSize: 54,
                lineHeight: 1.08,
                color: COLORS.ink,
                margin: 0,
                letterSpacing: "-0.02em",
                ...VN_TEXT_RENDER,
              }}
            >
              Frank Rosenblatt chế tạo{" "}
              <span style={{ color: COLORS.clay }}>Mark I Perceptron.</span>
            </h2>
          </AnimatedIn>

          <AnimatedIn delay={34} duration={22}>
            <p
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 20,
                color: COLORS.graphite,
                lineHeight: 1.55,
                marginTop: 24,
                ...VN_TEXT_RENDER,
              }}
            >
              Một lưới 400 photocell đóng vai trò &ldquo;mắt&rdquo;. Mỗi
              photocell nối vào một điện trở xoay — chính là trọng số của
              mạng.
            </p>
          </AnimatedIn>
        </div>

        {/* Right column — photocell grid */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <AnimatedIn delay={20} duration={26}>
            <PhotocellGrid frame={frame} revealedFrame={36} />
          </AnimatedIn>
        </div>
      </AbsoluteFill>
    </LessonFrame>
  );
};

const PhotocellGrid = ({
  frame,
  revealedFrame,
}: {
  frame: number;
  revealedFrame: number;
}) => {
  const cells = 8;
  // A simple "A" letter shape across an 8x8 grid for the "image" read.
  const litShape: [number, number][] = [
    [3, 1],
    [4, 1],
    [2, 2],
    [5, 2],
    [2, 3],
    [5, 3],
    [2, 4],
    [3, 4],
    [4, 4],
    [5, 4],
    [2, 5],
    [5, 5],
    [2, 6],
    [5, 6],
  ];
  const isLit = (x: number, y: number) =>
    litShape.some(([lx, ly]) => lx === x && ly === y);
  const progress = interpolate(
    frame,
    [revealedFrame, revealedFrame + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        padding: 18,
        background: COLORS.paper2,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 12,
        display: "grid",
        gridTemplateColumns: `repeat(${cells}, 34px)`,
        gap: 6,
        boxShadow: `0 10px 30px rgba(0,0,0,0.06)`,
      }}
    >
      {Array.from({ length: cells * cells }).map((_, i) => {
        const x = i % cells;
        const y = Math.floor(i / cells);
        const lit = isLit(x, y);
        const cellOrder = (y * cells + x) / (cells * cells);
        const cellRevealed = progress >= cellOrder;
        const litOpacity = lit && cellRevealed ? 1 : 0.25;
        return (
          <div
            key={i}
            style={{
              width: 34,
              height: 34,
              borderRadius: 5,
              background: lit && cellRevealed ? COLORS.peach500 : COLORS.paper3,
              border: `1px solid ${lit && cellRevealed ? COLORS.clay : COLORS.line}`,
              opacity: litOpacity,
              transition: "background 0.2s",
            }}
          />
        );
      })}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 3 · LEARN — the wrong guess + motor loop                           */
/* ──────────────────────────────────────────────────────────────────────── */

const LearnScene = () => {
  const frame = useCurrentFrame();

  // Two guesses: first wrong (0-85), then the motor turns (85-125),
  // then it guesses right (125-170).
  const showWrong = frame >= 14;
  const showMotor = frame >= 55;
  const showRight = frame >= 110;

  return (
    <LessonFrame step={3} label="Học bằng motor">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
          gap: 30,
        }}
      >
        <AnimatedIn delay={0} duration={18}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 48,
              lineHeight: 1.08,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Đoán sai ={" "}
            <span style={{ color: COLORS.clay }}>motor tự xoay núm.</span>
          </h2>
        </AnimatedIn>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 50,
            marginTop: 20,
          }}
        >
          {/* Step 1: input image */}
          <MiniPhotocell label="Chiếu hình A" />

          <StaticArrow />

          {/* Step 2: guess (wrong/right swap) */}
          <div
            style={{
              width: 200,
              height: 140,
              borderRadius: 14,
              border: `2px solid ${
                showRight ? COLORS.turquoise500 : showWrong ? COLORS.clay : COLORS.line
              }`,
              background: showRight
                ? COLORS.turquoise50
                : showWrong
                  ? "#FBE9E3"
                  : COLORS.paper2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.ash,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              Máy đoán
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_VN_DISPLAY,
                  fontSize: 52,
                  fontWeight: 700,
                  color: showRight
                    ? COLORS.turquoise600
                    : showWrong
                      ? COLORS.clay
                      : COLORS.graphite,
                  ...VN_TEXT_RENDER,
                }}
              >
                {showRight ? "A" : "B"}
              </span>
              {showWrong && !showRight && (
                <X size={34} color={COLORS.clay} strokeWidth={3} />
              )}
              {showRight && <Check size={34} color={COLORS.turquoise500} strokeWidth={3} />}
            </div>
          </div>
        </div>

        {/* Motor turning the knobs */}
        <AnimatedIn delay={showMotor ? 0 : 1000} duration={22}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 22px",
              background: COLORS.paper,
              border: `1px solid ${COLORS.turquoise300}`,
              borderRadius: 999,
              marginTop: 14,
            }}
          >
            <SpinningKnob frame={frame} startFrame={55} />
            <SpinningKnob frame={frame} startFrame={62} />
            <SpinningKnob frame={frame} startFrame={69} />
            <span
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 18,
                color: COLORS.graphite,
                marginLeft: 8,
                ...VN_TEXT_RENDER,
              }}
            >
              Motor chỉnh lại trọng số theo hướng đúng.
            </span>
          </div>
        </AnimatedIn>

        {showRight && (
          <AnimatedIn delay={0} duration={18}>
            <p
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 20,
                color: COLORS.graphite,
                marginTop: 14,
                textAlign: "center",
                ...VN_TEXT_RENDER,
              }}
            >
              Lần sau cùng hình đó, máy đoán đúng hơn — đó là{" "}
              <span style={{ color: COLORS.turquoise700, fontWeight: 600 }}>
                &ldquo;học&rdquo; theo nghĩa cơ khí
              </span>
              .
            </p>
          </AnimatedIn>
        )}
      </AbsoluteFill>
    </LessonFrame>
  );
};

const MiniPhotocell = ({ label }: { label: string }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
    }}
  >
    <div
      style={{
        padding: 10,
        background: COLORS.paper2,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 10,
        display: "grid",
        gridTemplateColumns: "repeat(4, 18px)",
        gap: 3,
      }}
    >
      {Array.from({ length: 16 }).map((_, i) => {
        const lit = [1, 2, 4, 7, 8, 9, 10, 11, 13, 14].includes(i);
        return (
          <div
            key={i}
            style={{
              width: 18,
              height: 18,
              borderRadius: 3,
              background: lit ? COLORS.peach500 : COLORS.paper3,
              border: `1px solid ${lit ? COLORS.clay : COLORS.line}`,
            }}
          />
        );
      })}
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
      {label}
    </span>
  </div>
);

const StaticArrow = () => (
  <ArrowRight size={32} color={COLORS.graphite} strokeWidth={2.25} />
);

const SpinningKnob = ({
  frame,
  startFrame,
}: {
  frame: number;
  startFrame: number;
}) => {
  const rotation = interpolate(frame, [startFrame, startFrame + 40], [0, 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: COLORS.paper2,
        border: `2px solid ${COLORS.turquoise500}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <RotateCw size={16} color={COLORS.turquoise600} strokeWidth={2.5} />
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 4 · MODERN tie-in                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

const ModernScene = () => {
  return (
    <LessonFrame step={4} label="Móc nối">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
          gap: 28,
        }}
      >
        <AnimatedIn delay={0} duration={22}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 58,
              lineHeight: 1.08,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              maxWidth: 950,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Mỗi neuron trong GPT vẫn làm{" "}
            <span style={{ color: COLORS.turquoise700 }}>đúng việc đó.</span>
          </h2>
        </AnimatedIn>

        <AnimatedIn delay={20} duration={22}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              fontFamily: FONT_VN_DISPLAY,
              color: COLORS.graphite,
              ...VN_TEXT_RENDER,
            }}
          >
            <span style={{ fontSize: 26 }}>Chỉ nhân lên</span>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 64,
                fontWeight: 600,
                color: COLORS.clay,
                letterSpacing: "-0.02em",
              }}
            >
              ~1.7×10¹²
            </span>
            <span style={{ fontSize: 26 }}>lần.</span>
          </div>
        </AnimatedIn>

        <AnimatedIn delay={44} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 18,
              color: COLORS.ash,
              textAlign: "center",
              maxWidth: 720,
              lineHeight: 1.5,
              margin: 0,
              ...VN_TEXT_RENDER,
            }}
          >
            Cộng có trọng số, so với ngưỡng, trả về 0 hoặc 1 — công thức
            Rosenblatt viết năm 1958 vẫn còn nguyên.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────────────── */
/* Scene 5 · CTA                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

const CtaScene = () => {
  return (
    <LessonFrame step={5} label="Đọc tiếp">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
          gap: 26,
        }}
      >
        <AnimatedIn delay={0} duration={18}>
          <Eye size={44} color={COLORS.turquoise600} strokeWidth={1.8} />
        </AnimatedIn>

        <AnimatedIn delay={8} duration={22}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 46,
              lineHeight: 1.1,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              maxWidth: 880,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Xem chi tiết Mark I Perceptron + cách nó vẫn đúng hôm nay.
          </h2>
        </AnimatedIn>

        <AnimatedIn delay={28} duration={22}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 22px",
              background: COLORS.ink,
              borderRadius: 10,
              fontFamily: FONT_MONO,
              fontSize: 16,
              color: COLORS.paper,
              letterSpacing: "0.02em",
            }}
          >
            udemi.tech/topics/perceptron
            <ArrowRight size={18} color={COLORS.paper} strokeWidth={2.25} />
          </div>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};
