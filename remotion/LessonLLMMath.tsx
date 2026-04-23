import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { ReactNode } from "react";
import { ArrowRight, X, Check, Calculator, Terminal } from "lucide-react";

import { AnimatedIn } from "./components/AnimatedIn";
import { COLORS, VN_TEXT_RENDER } from "./tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "./fonts";

/**
 * Lesson video. Vì sao ChatGPT hay sai khi tính toán.
 *
 * One-sentence idea: ChatGPT tính dở vì nó đoán token, không tính số.
 *
 * Five-scene arc. Cover math question. Reveal wrong answer next to
 * calculator. Explain: tokenizer cuts the number into chunks. Fix:
 * give the model a tool (Python). CTA.
 *
 *   cover 100 · wrong 130 · tokens 110 · fix 100 · cta 30 = 470
 *   Transitions 4 × 20 = 80. Total 550 frames ≈ 18.3 seconds.
 */

export const LESSON_LLM_MATH_DURATION = 550;

const TRANS = 20;
const springFast = springTiming({
  durationInFrames: TRANS,
  config: { damping: 200, overshootClamping: true },
});
const linearFast = linearTiming({ durationInFrames: TRANS });

export const LessonLLMMathComposition = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100}>
          <CoverScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <WrongScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={110}>
          <TokensScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={100}>
          <FixScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={30}>
          <CtaScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/* Shared frame */

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
          topics / llm-math
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

/* Scene 1. COVER */

const CoverScene = () => {
  return (
    <LessonFrame step={1} label="Câu đố">
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
            LLM · Một sự thật khó chịu
          </span>
        </AnimatedIn>

        <AnimatedIn delay={8} duration={22}>
          <h1
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 78,
              lineHeight: 1.04,
              color: COLORS.ink,
              margin: 0,
              maxWidth: 1040,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            ChatGPT tính{" "}
            <span
              style={{
                fontFamily: FONT_MONO,
                color: COLORS.turquoise700,
                fontWeight: 700,
              }}
            >
              7583 × 2947
            </span>{" "}
            ra <span style={{ color: COLORS.clay }}>bao nhiêu?</span>
          </h1>
        </AnimatedIn>

        <AnimatedIn delay={32} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 26,
              color: COLORS.graphite,
              marginTop: 30,
              maxWidth: 860,
              lineHeight: 1.4,
              ...VN_TEXT_RENDER,
            }}
          >
            Hỏi thử. Câu trả lời tự tin, gọn gàng, và thường sai.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

/* Scene 2. WRONG ANSWER */

const WrongScene = () => {
  const frame = useCurrentFrame();
  const showCalc = frame >= 60;

  return (
    <LessonFrame step={2} label="Đáp án lệch">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
          gap: 22,
        }}
      >
        <AnimatedIn delay={0} duration={18}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 38,
              lineHeight: 1.14,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Hai số trông rất giống nhau. Chỉ{" "}
            <span style={{ color: COLORS.clay }}>hai chữ số cuối</span> khác.
          </h2>
        </AnimatedIn>

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 26,
            marginTop: 10,
          }}
        >
          <AnimatedIn delay={12} duration={22}>
            <AnswerCard
              label="ChatGPT trả lời"
              icon="llm"
              accent="clay"
              digits={["22,347,", "5", "01"]}
              highlightFrom={1}
              badge="Sai"
              ok={false}
            />
          </AnimatedIn>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: COLORS.ash,
            }}
          >
            <X size={28} strokeWidth={2.4} color={COLORS.clay} />
          </div>

          <AnimatedIn delay={showCalc ? 0 : 1000} duration={22}>
            <AnswerCard
              label="Máy tính"
              icon="calc"
              accent="turquoise"
              digits={["22,347,", "3", "01"]}
              highlightFrom={1}
              badge="Đúng"
              ok={true}
            />
          </AnimatedIn>
        </div>

        <AnimatedIn delay={90} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 18,
              color: COLORS.graphite,
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 820,
              ...VN_TEXT_RENDER,
            }}
          >
            Câu trả lời trông hợp lý. Nhưng lệch đúng{" "}
            <span style={{ color: COLORS.clay, fontWeight: 600 }}>200</span>.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

const AnswerCard = ({
  label,
  icon,
  accent,
  digits,
  highlightFrom,
  badge,
  ok,
}: {
  label: string;
  icon: "llm" | "calc";
  accent: "clay" | "turquoise";
  digits: string[];
  highlightFrom: number;
  badge: string;
  ok: boolean;
}) => {
  const color = accent === "turquoise" ? COLORS.turquoise500 : COLORS.clay;
  const bg = ok ? COLORS.turquoise50 : "#FBE9E3";
  const textColor = ok ? COLORS.turquoise700 : COLORS.clay;
  return (
    <div
      style={{
        width: 360,
        padding: "20px 22px",
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: COLORS.ash,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 600,
          }}
        >
          {icon === "llm" ? (
            <Terminal size={13} color={color} strokeWidth={2.2} />
          ) : (
            <Calculator size={13} color={color} strokeWidth={2.2} />
          )}
          {label}
        </div>
        <div
          style={{
            padding: "3px 9px",
            background: bg,
            border: `1px solid ${color}`,
            borderRadius: 999,
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: textColor,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {badge}
        </div>
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 42,
          fontWeight: 700,
          color: COLORS.ink,
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        {digits.map((d, i) => (
          <span
            key={i}
            style={{
              color: i >= highlightFrom ? color : COLORS.ink,
              background:
                i >= highlightFrom ? (ok ? COLORS.turquoise50 : "#FBE9E3") : "transparent",
              padding: i >= highlightFrom ? "0 3px" : 0,
              borderRadius: 4,
            }}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
};

/* Scene 3. TOKENS, NOT DIGITS */

const TokensScene = () => {
  const frame = useCurrentFrame();
  const splitProgress = interpolate(frame, [24, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const gap = Math.round(splitProgress * 36);

  return (
    <LessonFrame step={3} label="Tokenizer">
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
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 44,
              lineHeight: 1.1,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              letterSpacing: "-0.02em",
              maxWidth: 1040,
              ...VN_TEXT_RENDER,
            }}
          >
            Model không thấy <span style={{ color: COLORS.clay }}>chữ số</span>.
            Nó thấy <span style={{ color: COLORS.turquoise700 }}>token</span>.
          </h2>
        </AnimatedIn>

        <AnimatedIn delay={14} duration={20}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: 8,
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                color: COLORS.ash,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginRight: 4,
              }}
            >
              input
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 56,
                fontWeight: 700,
                color: COLORS.ink,
                letterSpacing: "-0.02em",
              }}
            >
              7583
            </div>
            <ArrowRight size={28} color={COLORS.ash} strokeWidth={2} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap,
              }}
            >
              <TokenChip value="75" />
              <TokenChip value="83" />
            </div>
          </div>
        </AnimatedIn>

        <AnimatedIn delay={70} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 20,
              color: COLORS.graphite,
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 820,
              ...VN_TEXT_RENDER,
            }}
          >
            Model thấy <span style={{ fontWeight: 600 }}>2 từ</span>, không phải
            4 chữ số. Nó đoán token tiếp theo, không đặt phép tính.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

const TokenChip = ({ value }: { value: string }) => (
  <div
    style={{
      padding: "10px 18px",
      background: COLORS.turquoise50,
      border: `1.5px solid ${COLORS.turquoise300}`,
      borderRadius: 8,
      fontFamily: FONT_MONO,
      fontSize: 42,
      fontWeight: 700,
      color: COLORS.turquoise700,
      letterSpacing: "-0.01em",
      lineHeight: 1,
    }}
  >
    {value}
  </div>
);

/* Scene 4. FIX, TOOL USE */

const FixScene = () => {
  const frame = useCurrentFrame();

  const steps = [
    { label: "Người dùng", body: "7583 × 2947 = ?", tone: "graphite" as const },
    { label: "LLM viết code", body: "print(7583 * 2947)", tone: "turquoise" as const },
    { label: "Python chạy", body: "22347301", tone: "turquoise" as const },
    { label: "LLM trả lời", body: "22.347.301", tone: "turquoise" as const },
  ];

  return (
    <LessonFrame step={4} label="Tool use">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 70px",
          gap: 22,
        }}
      >
        <AnimatedIn delay={0} duration={18}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 40,
              lineHeight: 1.12,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Cách sửa: cho model một{" "}
            <span style={{ color: COLORS.turquoise700 }}>công cụ</span>.
          </h2>
        </AnimatedIn>

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 14,
            marginTop: 6,
          }}
        >
          {steps.map((s, i) => {
            const revealFrame = 18 + i * 14;
            const revealed = frame >= revealFrame;
            return (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 14 }}
              >
                <AnimatedIn delay={revealed ? 0 : 1000} duration={18}>
                  <FlowCard index={i + 1} label={s.label} body={s.body} tone={s.tone} />
                </AnimatedIn>
                {i < steps.length - 1 && (
                  <AnimatedIn delay={revealed ? 4 : 1000} duration={12}>
                    <ArrowRight size={20} color={COLORS.ash} strokeWidth={2} />
                  </AnimatedIn>
                )}
              </div>
            );
          })}
        </div>

        <AnimatedIn delay={78} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 18,
              color: COLORS.graphite,
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 820,
              marginTop: 4,
              ...VN_TEXT_RENDER,
            }}
          >
            LLM đoán text. Python tính số. Ghép lại, đáp án{" "}
            <span style={{ color: COLORS.turquoise700, fontWeight: 600 }}>
              chính xác từng chữ số
            </span>
            .
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

const FlowCard = ({
  index,
  label,
  body,
  tone,
}: {
  index: number;
  label: string;
  body: string;
  tone: "graphite" | "turquoise";
}) => {
  const accent = tone === "turquoise" ? COLORS.turquoise500 : COLORS.ash;
  const bg = tone === "turquoise" ? COLORS.turquoise50 : COLORS.paper2;
  const bodyColor = tone === "turquoise" ? COLORS.turquoise700 : COLORS.ink;
  return (
    <div
      style={{
        width: 210,
        padding: "14px 14px",
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: COLORS.ash,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 600,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: 999,
            background: accent,
            color: COLORS.paper,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {index}
        </span>
        {label}
      </div>
      <div
        style={{
          padding: "10px 10px",
          background: bg,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 6,
          fontFamily: FONT_MONO,
          fontSize: 15,
          fontWeight: 600,
          color: bodyColor,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {body}
      </div>
    </div>
  );
};

/* Scene 5. CTA */

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
          gap: 18,
        }}
      >
        <AnimatedIn delay={0} duration={14}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 36,
              lineHeight: 1.1,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              maxWidth: 880,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Đọc chi tiết.
          </h2>
        </AnimatedIn>

        <AnimatedIn delay={8} duration={16}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 20px",
              background: COLORS.ink,
              borderRadius: 10,
              fontFamily: FONT_MONO,
              fontSize: 15,
              color: COLORS.paper,
              letterSpacing: "0.02em",
            }}
          >
            udemi.tech/articles/llm-math-weakness
            <ArrowRight size={16} color={COLORS.paper} strokeWidth={2.25} />
          </div>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};
