import { LandingChrome } from "../components/LandingChrome";
import { AnimatedIn } from "../components/AnimatedIn";
import { COLORS } from "../tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "../fonts";

/**
 * Scene 6 — Landing process section
 * (mirror of src/components/landing/LandingProcess.tsx).
 *
 * The 8-step template every topic follows: Dự đoán → Ẩn dụ → Trực quan
 * → Khoảnh khắc à-ha → Thử thách → Giải thích → Tóm tắt → Quiz.
 * Grid of 4×2 numbered tiles, stagger-revealed.
 */
export const ProcessScene = () => {
  return (
    <LandingChrome>
      <div
        style={{
          padding: "56px 56px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div>
          <AnimatedIn delay={2} offsetY={6} duration={14}>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: COLORS.ash,
              }}
            >
              (03) · Công thức 8 bước
            </span>
          </AnimatedIn>
          <AnimatedIn delay={6} offsetY={10} duration={16}>
            <h2
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 50,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 1.02,
                margin: "8px 0 0",
                color: COLORS.ink,
              }}
            >
              Mỗi bài, tám bước.{" "}
              <span
                style={{
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: COLORS.turquoiseInk,
                }}
              >
                Không đổi.
              </span>
            </h2>
          </AnimatedIn>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            gap: 14,
            flex: 1,
          }}
        >
          {STEPS.map((s, i) => (
            <AnimatedIn
              key={s.name}
              delay={14 + i * 3}
              offsetY={10}
              duration={14}
            >
              <StepTile step={s} />
            </AnimatedIn>
          ))}
        </div>
      </div>
    </LandingChrome>
  );
};

type Step = { n: string; name: string; blurb: string };
const STEPS: Step[] = [
  { n: "01", name: "Dự đoán", blurb: "Đoán trước khi đọc — não cam kết." },
  { n: "02", name: "Ẩn dụ", blurb: "Một hình dung quen thuộc làm mỏ neo." },
  { n: "03", name: "Trực quan", blurb: "Slider, drag-drop, toggle tương tác." },
  { n: "04", name: "Khoảnh khắc à-ha", blurb: "Một câu chốt để não \"crack\"." },
  { n: "05", name: "Thử thách", blurb: "Mini puzzle — sai cũng được." },
  { n: "06", name: "Giải thích", blurb: "Công thức chỉ đến đây mới xuất hiện." },
  { n: "07", name: "Tóm tắt", blurb: "Ba câu để mang đi." },
  { n: "08", name: "Quiz", blurb: "3-5 câu khái quát hoá kiến thức." },
];

const StepTile = ({ step }: { step: Step }) => (
  <div
    style={{
      padding: "18px 18px 20px",
      background: COLORS.white,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 12,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      boxSizing: "border-box",
    }}
  >
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: 11,
        color: COLORS.turquoise700,
        letterSpacing: "0.08em",
      }}
    >
      {step.n}
    </span>
    <div
      style={{
        fontFamily: FONT_VN_DISPLAY,
        fontSize: 18,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        color: COLORS.ink,
      }}
    >
      {step.name}
    </div>
    <div
      style={{
        fontFamily: FONT_VN_DISPLAY,
        fontSize: 11,
        color: COLORS.graphite,
        lineHeight: 1.45,
      }}
    >
      {step.blurb}
    </div>
  </div>
);
