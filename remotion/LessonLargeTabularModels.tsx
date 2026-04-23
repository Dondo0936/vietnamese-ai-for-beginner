import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { ReactNode } from "react";
import { ArrowRight, Loader, Check } from "lucide-react";

import { AnimatedIn } from "./components/AnimatedIn";
import { COLORS, VN_TEXT_RENDER } from "./tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "./fonts";

/**
 * Lesson video — Large Tabular Models (TabPFN v2).
 *
 * One fact: tabular data was the last AI holdout; a transformer
 * pretrained on hundreds of millions of synthetic tables now beats
 * XGBoost on most small-to-medium benchmarks without any training.
 *
 * Five-scene arc: cover → old XGBoost workflow → new LTM workflow
 * → benchmark reveal → CTA.
 *
 *   cover 100 · old 150 · new 160 · bench 130 · cta 90 = 630
 *   Transitions 4 × 20 = 80 → total 550 frames ≈ 18.3 seconds.
 */

export const LESSON_LTM_DURATION = 550;

const TRANS = 20;
const springFast = springTiming({
  durationInFrames: TRANS,
  config: { damping: 200, overshootClamping: true },
});
const linearFast = linearTiming({ durationInFrames: TRANS });

export const LessonLargeTabularModelsComposition = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100}>
          <CoverScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <OldWayScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          timing={linearFast}
          presentation={slide({ direction: "from-right" })}
        />

        <TransitionSeries.Sequence durationInFrames={160}>
          <NewWayScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition timing={springFast} presentation={fade()} />

        <TransitionSeries.Sequence durationInFrames={130}>
          <BenchmarkScene />
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
          articles / large-tabular-models
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
            Large Tabular Models · Nature 2025
          </span>
        </AnimatedIn>

        <AnimatedIn delay={8} duration={22}>
          <h1
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 82,
              lineHeight: 1.05,
              color: COLORS.ink,
              margin: 0,
              maxWidth: 1020,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            AI biết đọc bảng —{" "}
            <span style={{ color: COLORS.clay }}>không cần train.</span>
          </h1>
        </AnimatedIn>

        <AnimatedIn delay={32} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 24,
              color: COLORS.graphite,
              marginTop: 30,
              maxWidth: 880,
              lineHeight: 1.4,
              ...VN_TEXT_RENDER,
            }}
          >
            TabPFN v2 pretrain một lần trên hàng trăm triệu bảng giả, rồi
            đoán cột thiếu cho mọi bảng của bạn.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/* Scene 2 · OLD WAY — the XGBoost loop                             */
/* ──────────────────────────────────────────────────────────────── */

const OldWayScene = () => {
  const frame = useCurrentFrame();

  const loaderRotation = interpolate(frame, [0, 150], [0, 720], {
    extrapolateRight: "clamp",
  });

  return (
    <LessonFrame step={2} label="Cách cũ">
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
              fontSize: 50,
              lineHeight: 1.1,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              maxWidth: 1000,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Bảng 500 dòng. <span style={{ color: COLORS.clay }}>XGBoost.</span>{" "}
            Hàng giờ tinker.
          </h2>
        </AnimatedIn>

        <AnimatedIn delay={16} duration={22}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              marginTop: 16,
            }}
          >
            <StepPill label="Chọn hyperparam" />
            <SmallArrow />
            <StepPill label="Train" spin loaderRotation={loaderRotation} />
            <SmallArrow />
            <StepPill label="Eval" />
            <SmallArrow />
            <StepPill label="Lặp lại" dashed />
          </div>
        </AnimatedIn>

        <AnimatedIn delay={46} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 20,
              color: COLORS.graphite,
              maxWidth: 820,
              textAlign: "center",
              lineHeight: 1.45,
              marginTop: 12,
              ...VN_TEXT_RENDER,
            }}
          >
            Quy trình thống trị dữ liệu bảng hơn một thập kỷ — mỗi tác vụ
            một vòng train + tune riêng.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

const StepPill = ({
  label,
  spin,
  loaderRotation,
  dashed,
}: {
  label: string;
  spin?: boolean;
  loaderRotation?: number;
  dashed?: boolean;
}) => (
  <div
    style={{
      padding: "10px 18px",
      border: `1.5px ${dashed ? "dashed" : "solid"} ${COLORS.line}`,
      borderRadius: 999,
      background: COLORS.paper2,
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: FONT_VN_DISPLAY,
      fontSize: 16,
      color: COLORS.graphite,
      ...VN_TEXT_RENDER,
    }}
  >
    {spin && loaderRotation !== undefined && (
      <span style={{ transform: `rotate(${loaderRotation}deg)` }}>
        <Loader size={16} color={COLORS.clay} />
      </span>
    )}
    {label}
  </div>
);

const SmallArrow = () => (
  <ArrowRight size={18} color={COLORS.ash} strokeWidth={2.25} />
);

/* ──────────────────────────────────────────────────────────────── */
/* Scene 3 · NEW WAY — pretrain once, reuse everywhere              */
/* ──────────────────────────────────────────────────────────────── */

const NewWayScene = () => {
  const frame = useCurrentFrame();

  const tablesShow = Math.min(Math.floor((frame - 10) / 2), 18);

  return (
    <LessonFrame step={3} label="Cách mới — LTM">
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
        <AnimatedIn delay={0} duration={20}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 48,
              lineHeight: 1.1,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              maxWidth: 1040,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Pretrain một lần —{" "}
            <span style={{ color: COLORS.turquoise700 }}>dùng cho mọi bảng.</span>
          </h2>
        </AnimatedIn>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginTop: 18,
          }}
        >
          {/* Synthetic tables feeding in */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 4,
              width: 240,
            }}
          >
            {[...Array(18)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: 22,
                  background:
                    i <= tablesShow ? COLORS.clay : COLORS.paper3,
                  borderRadius: 3,
                  opacity: i <= tablesShow ? 0.3 + ((i * 23) % 60) / 100 : 0.3,
                  border: `1px solid ${
                    i <= tablesShow ? COLORS.clay : COLORS.line
                  }`,
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>

          <SmallArrow />

          {/* Transformer */}
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: 20,
              border: `2px solid ${COLORS.turquoise500}`,
              background: COLORS.turquoise50,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 12px 34px rgba(32, 184, 176, 0.24)`,
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                color: COLORS.turquoise700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              Transformer
            </span>
            <span
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 28,
                fontWeight: 700,
                color: COLORS.turquoiseInk,
                marginTop: 2,
                ...VN_TEXT_RENDER,
              }}
            >
              TabPFN v2
            </span>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                color: COLORS.turquoise600,
                marginTop: 8,
                letterSpacing: "0.1em",
              }}
            >
              in-context
            </span>
          </div>

          <SmallArrow />

          {/* Your table + prediction */}
          <AnimatedIn delay={30} duration={22}>
            <UserTableViz />
          </AnimatedIn>
        </div>

        <AnimatedIn delay={62} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 18,
              color: COLORS.graphite,
              maxWidth: 960,
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
              ...VN_TEXT_RENDER,
            }}
          >
            Bạn đưa bảng + hàng cần đoán — model nhìn toàn bộ trong context,
            trả về dự đoán trong một giây. Không gradient descent.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

const UserTableViz = () => {
  const cols = 4;
  const rows = 4;
  const hiR = 3;
  const hiC = 3;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 30px)`,
        gap: 3,
        padding: 10,
        background: COLORS.paper2,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 8,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const header = r === 0;
        const hi = r === hiR && c === hiC;
        return (
          <div
            key={i}
            style={{
              width: 30,
              height: 20,
              borderRadius: 3,
              background: hi
                ? COLORS.turquoise500
                : header
                  ? COLORS.paper3
                  : COLORS.paper,
              border: `1px solid ${hi ? COLORS.turquoise500 : COLORS.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_MONO,
              fontSize: 9,
              fontWeight: 700,
              color: hi
                ? COLORS.paper
                : header
                  ? COLORS.graphite
                  : COLORS.ash,
            }}
          >
            {hi ? <Check size={12} color={COLORS.paper} strokeWidth={3} /> : ""}
          </div>
        );
      })}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/* Scene 4 · BENCHMARK                                              */
/* ──────────────────────────────────────────────────────────────── */

const BenchmarkScene = () => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [10, 70], [0, 67], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <LessonFrame step={4} label="Số liệu">
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 100px",
          gap: 28,
        }}
      >
        <AnimatedIn delay={0} duration={20}>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
              color: COLORS.ash,
              textTransform: "uppercase",
              letterSpacing: "0.24em",
            }}
          >
            OpenML-CC18 · 72 bài phân loại
          </span>
        </AnimatedIn>

        <AnimatedIn delay={8} duration={22}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 54,
              lineHeight: 1.08,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              maxWidth: 1000,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            TabPFN v2 thắng XGBoost trên{" "}
            <span
              style={{
                fontFamily: FONT_MONO,
                color: COLORS.turquoise600,
              }}
            >
              ~{Math.round(fill)}%
            </span>{" "}
            bài.
          </h2>
        </AnimatedIn>

        <AnimatedIn delay={24} duration={22}>
          <div
            style={{
              width: 620,
              height: 32,
              background: COLORS.paper2,
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
            }}
          >
            <div
              style={{
                width: `${fill}%`,
                background: COLORS.turquoise500,
              }}
            />
            <div
              style={{
                width: `${100 - fill}%`,
                background: `repeating-linear-gradient(90deg, ${COLORS.line} 0 8px, ${COLORS.paper2} 8px 16px)`,
              }}
            />
          </div>
        </AnimatedIn>

        <AnimatedIn delay={40} duration={22}>
          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 18,
              color: COLORS.graphite,
              maxWidth: 760,
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
              ...VN_TEXT_RENDER,
            }}
          >
            Với bảng dưới 1K dòng, ưu thế còn rõ hơn — và không cần một
            lần tuning hyperparameter nào.
          </p>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/* Scene 5 · CTA                                                    */
/* ──────────────────────────────────────────────────────────────── */

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
          gap: 24,
        }}
      >
        <AnimatedIn delay={0} duration={20}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 600,
              fontSize: 46,
              lineHeight: 1.12,
              color: COLORS.ink,
              margin: 0,
              textAlign: "center",
              maxWidth: 900,
              letterSpacing: "-0.02em",
              ...VN_TEXT_RENDER,
            }}
          >
            Cơ chế, benchmark, và khi nào nên bỏ LTM —{" "}
            <span style={{ color: COLORS.turquoise700 }}>bài đầy đủ.</span>
          </h2>
        </AnimatedIn>

        <AnimatedIn delay={24} duration={22}>
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
            udemi.tech/articles/large-tabular-models
            <ArrowRight size={18} color={COLORS.paper} strokeWidth={2.25} />
          </div>
        </AnimatedIn>
      </AbsoluteFill>
    </LessonFrame>
  );
};
