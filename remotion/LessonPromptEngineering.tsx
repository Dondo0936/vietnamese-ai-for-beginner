import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { ReactNode } from "react";
import { ArrowRight, X, Check, Sparkles } from "lucide-react";

import { AnimatedIn } from "./components/AnimatedIn";
import { COLORS, VN_TEXT_RENDER } from "./tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "./fonts";

/**
 * Lesson video — Prompt engineering, one insight.
 *
 * The fact: 2–3 concrete examples beat paragraphs of instruction.
 * Show, don't tell. Same classification task; the "wordy rules"
 * prompt drifts, the 3-shot prompt lands on the right label and
 * format every time.
 *
 * Five-scene arc: cover → wordy prompt + drift → 3-shot prompt +
 * clean output → the insight → CTA.
 *
 *   cover 100 · wordy 150 · fewshot 160 · insight 130 · cta 90 = 630
 *   Transitions 4 × 20 = 80 → total 550 frames ≈ 18.3 seconds.
 */

export const LESSON_PROMPT_ENGINEERING_DURATION = 550;

const TRANS = 20;
const springFast = springTiming({
  durationInFrames: TRANS,
  config: { damping: 200, overshootClamping: true },
});
const linearFast = linearTiming({ durationInFrames: TRANS });

export const LessonPromptEngineeringComposition = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100}>
          <CoverScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <WordyScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={160}>
          <FewShotScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <InsightScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={90}>
          <CtaScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/* Shared frame                                                     */
/* ──────────────────────────────────────────────────────────────── */

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
          topics / prompt-engineering
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

/* ──────────────────────────────────────────────────────────────── */
/* Scene 1 · COVER                                                  */
/* ──────────────────────────────────────────────────────────────── */

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
            Prompt engineering · Một mẹo duy nhất
          </span>
        </AnimatedIn>

        <AnimatedIn delay={8} duration={22}>
          <h1
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 84,
              lineHeight: 1.04,
              color: COLORS.ink,
              margin: 0,
              maxWidth: 1020,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Prompt tốt{" "}
            <span style={{ color: COLORS.clay }}>không phải</span> prompt dài.
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
            Bí quyết: <i>show, don&rsquo;t tell</i>.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/* Scene 2 · WORDY                                                  */
/* ──────────────────────────────────────────────────────────────── */

const WordyScene = () => {
  const frame = useCurrentFrame();
  const showOutput = frame >= 60;

  return (
    <LessonFrame step={2} label="Cách 1 — mô tả">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
          gap: 24,
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
            Cách 1 — viết <span style={{ color: COLORS.clay }}>ba đoạn văn</span>{" "}
            mô tả quy tắc.
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
            <PromptCard
              title="Prompt"
              tone="clay"
              body={`Phân loại câu dưới đây theo cảm xúc: tích cực, tiêu cực, hoặc trung lập. Hãy đảm bảo phân loại chính xác. Trả kết quả theo format rõ ràng, không thêm giải thích. Phân tích ngữ cảnh kỹ trước khi kết luận. Ưu tiên độ chính xác. Nếu không chắc, chọn trung lập...`}
            />
          </AnimatedIn>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: COLORS.ash,
            }}
          >
            <ArrowRight size={28} strokeWidth={2} />
          </div>

          <AnimatedIn delay={showOutput ? 0 : 1000} duration={22}>
            <OutputCard
              title="Output"
              ok={false}
              lines={[
                "Label: positive (lệch tiếng Anh)",
                "Confidence: high",
                "Explanation: câu mang ý...",
              ]}
            />
          </AnimatedIn>
        </div>

        <AnimatedIn delay={86} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 18,
              color: COLORS.clay,
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 780,
              ...VN_TEXT_RENDER,
            }}
          >
            Output lệch format, thêm giải thích dù bạn đã cấm, nhãn lúc tiếng
            Việt lúc tiếng Anh.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/* Scene 3 · FEW-SHOT                                               */
/* ──────────────────────────────────────────────────────────────── */

const FewShotScene = () => {
  const frame = useCurrentFrame();
  const showOutput = frame >= 64;

  return (
    <LessonFrame step={3} label="Cách 2 — ví dụ">
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
              fontSize: 40,
              lineHeight: 1.12,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Cách 2 — xoá mô tả, đưa{" "}
            <span style={{ color: COLORS.turquoise700 }}>ba ví dụ</span>.
          </h2>
        </AnimatedIn>

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 26,
            marginTop: 8,
          }}
        >
          <AnimatedIn delay={12} duration={22}>
            <PromptCard
              title="Prompt"
              tone="turquoise"
              lines={[
                "Phim này dở quá → tiêu cực",
                "Đồ ăn ngon, phục vụ tuyệt → tích cực",
                "Trời hôm nay mưa → trung lập",
                "Ứng dụng này load chậm quá → ?",
              ]}
            />
          </AnimatedIn>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: COLORS.ash,
            }}
          >
            <ArrowRight size={28} strokeWidth={2} />
          </div>

          <AnimatedIn delay={showOutput ? 0 : 1000} duration={22}>
            <OutputCard
              title="Output"
              ok={true}
              lines={["tiêu cực"]}
            />
          </AnimatedIn>
        </div>

        <AnimatedIn delay={90} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 18,
              color: COLORS.turquoise700,
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 780,
              ...VN_TEXT_RENDER,
            }}
          >
            Đúng lớp, đúng ngôn ngữ, đúng format — chỉ một từ, không thêm.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/* Scene 4 · INSIGHT                                                */
/* ──────────────────────────────────────────────────────────────── */

const InsightScene = () => {
  const frame = useCurrentFrame();
  const leftW = interpolate(frame, [10, 60], [0, 35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightW = interpolate(frame, [20, 70], [0, 88], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <LessonFrame step={4} label="Vì sao">
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
        <AnimatedIn delay={0} duration={20}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 54,
              lineHeight: 1.1,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              maxWidth: 1040,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Model học từ <span style={{ color: COLORS.turquoise700 }}>ví dụ</span>{" "}
            nhanh hơn từ <span style={{ color: COLORS.clay }}>quy tắc</span>.
          </h2>
        </AnimatedIn>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            width: 640,
            marginTop: 6,
          }}
        >
          <BarRow
            label="Làm theo hướng dẫn"
            tone="clay"
            value={leftW}
          />
          <BarRow
            label="Bắt chước ví dụ"
            tone="turquoise"
            value={rightW}
          />
        </div>

        <AnimatedIn delay={44} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 18,
              color: COLORS.graphite,
              textAlign: "center",
              maxWidth: 780,
              lineHeight: 1.5,
              margin: 0,
              ...VN_TEXT_RENDER,
            }}
          >
            Quy tắc phải &ldquo;diễn giải&rdquo; thành hành vi. Ví dụ đã là hành
            vi — model chỉ việc lặp lại pattern.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

const BarRow = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "clay" | "turquoise";
}) => {
  const color = tone === "turquoise" ? COLORS.turquoise500 : COLORS.clay;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          fontFamily: FONT_MONO,
          fontSize: 11,
          color: COLORS.ash,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
        }}
      >
        <span>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{Math.round(value)}%</span>
      </div>
      <div
        style={{
          height: 22,
          background: COLORS.paper2,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
          }}
        />
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/* Scene 5 · CTA                                                    */
/* ──────────────────────────────────────────────────────────────── */

const CtaScene = () => {
  return (
    <LessonFrame step={5} label="Thử ngay">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
          gap: 24,
        }}
      >
        <AnimatedIn delay={0} duration={20}>
          <Sparkles size={40} color={COLORS.turquoise600} strokeWidth={1.8} />
        </AnimatedIn>

        <AnimatedIn delay={8} duration={22}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 44,
              lineHeight: 1.12,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              maxWidth: 880,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Thêm 3 ví dụ vào prompt tiếp theo của bạn.
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
            udemi.tech/topics/prompt-engineering
            <ArrowRight size={18} color={COLORS.paper} strokeWidth={2.25} />
          </div>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/* Shared cards                                                     */
/* ──────────────────────────────────────────────────────────────── */

const PromptCard = ({
  title,
  tone,
  body,
  lines,
}: {
  title: string;
  tone: "clay" | "turquoise";
  body?: string;
  lines?: string[];
}) => {
  const accent = tone === "turquoise" ? COLORS.turquoise500 : COLORS.clay;
  return (
    <div
      style={{
        width: 440,
        padding: "18px 20px",
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        fontFamily: FONT_MONO,
        fontSize: 13,
        color: COLORS.graphite,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: COLORS.ash,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginBottom: 10,
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {body && (
        <p
          style={{
            margin: 0,
            lineHeight: 1.55,
            fontFamily: FONT_VN_DISPLAY,
            color: COLORS.graphite,
            ...VN_TEXT_RENDER,
          }}
        >
          {body}
        </p>
      )}
      {lines && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                padding: "6px 10px",
                background:
                  i === lines.length - 1 ? COLORS.turquoise50 : COLORS.paper2,
                border: `1px solid ${
                  i === lines.length - 1 ? COLORS.turquoise100 : COLORS.line
                }`,
                borderRadius: 4,
                fontSize: 13,
                color: i === lines.length - 1 ? COLORS.turquoiseInk : COLORS.graphite,
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OutputCard = ({
  title,
  ok,
  lines,
}: {
  title: string;
  ok: boolean;
  lines: string[];
}) => {
  const accent = ok ? COLORS.turquoise500 : COLORS.clay;
  return (
    <div
      style={{
        width: 280,
        padding: "18px 20px",
        background: ok ? COLORS.turquoise50 : "#FBE9E3",
        border: `2px solid ${accent}`,
        borderRadius: 10,
        fontFamily: FONT_VN_DISPLAY,
        fontSize: 14,
        color: COLORS.ink,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 10,
          color: ok ? COLORS.turquoise700 : COLORS.clay,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginBottom: 10,
          fontWeight: 600,
          fontFamily: FONT_MONO,
        }}
      >
        <span>{title}</span>
        {ok ? (
          <Check size={14} color={COLORS.turquoise600} strokeWidth={3} />
        ) : (
          <X size={14} color={COLORS.clay} strokeWidth={3} />
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              fontFamily: i === 0 && ok ? FONT_VN_DISPLAY : FONT_MONO,
              fontSize: ok ? 22 : 12,
              fontWeight: ok ? 700 : 400,
              color: ok ? COLORS.turquoiseInk : COLORS.graphite,
              lineHeight: 1.4,
              ...VN_TEXT_RENDER,
            }}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
