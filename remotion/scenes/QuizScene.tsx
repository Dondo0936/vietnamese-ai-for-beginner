import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LiquidBackground } from "../components/LiquidBackground";
import { GlassPanel } from "../components/GlassPanel";
import { AnimatedIn } from "../components/AnimatedIn";
import { FONT_DISPLAY, FONT_SANS, FONT_MONO } from "../fonts";
import { COLORS } from "../tokens";

const OPTIONS = [
  "AI có cơ sở dữ liệu sự thật",
  "AI đoán từ tiếp theo theo xác suất",
  "AI hỏi internet mỗi lần trả lời",
  "AI dịch từ tiếng Anh sang tiếng Việt",
];

// Index 1 is the correct answer.
const CORRECT = 1;

export const QuizScene = () => {
  const frame = useCurrentFrame();

  // Hover the candidate from 30→60f, then commit-correct at 80f.
  const hoverIdx = frame < 30 ? -1 : frame < 65 ? 1 : 1;
  const committed = frame >= 75;
  const showReveal = interpolate(frame, [75, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <LiquidBackground />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 64,
        }}
      >
        <div style={{ width: 1000 }}>
          <AnimatedIn delay={2}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: COLORS.turquoise600,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Kiểm tra nhanh
            </div>
          </AnimatedIn>
          <AnimatedIn delay={6}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 42,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: COLORS.ink,
                marginBottom: 26,
                lineHeight: 1.15,
              }}
            >
              Một mô hình ngôn ngữ lớn thực sự làm gì khi trả lời bạn?
            </div>
          </AnimatedIn>

          <div style={{ display: "grid", gap: 12 }}>
            {OPTIONS.map((opt, i) => {
              const isHover = i === hoverIdx && !committed;
              const isCorrect = committed && i === CORRECT;
              const border =
                isCorrect
                  ? COLORS.success
                  : isHover
                    ? COLORS.turquoise500
                    : COLORS.line;
              const bg = isCorrect
                ? `rgba(61, 214, 140, ${0.12 * showReveal + 0.05})`
                : isHover
                  ? "rgba(32, 184, 176, 0.10)"
                  : "rgba(255, 255, 255, 0.72)";

              return (
                <AnimatedIn key={i} delay={12 + i * 4} offsetY={10}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "16px 22px",
                      borderRadius: 14,
                      border: `1.5px solid ${border}`,
                      background: bg,
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: `1.5px solid ${border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: FONT_MONO,
                        fontSize: 12,
                        fontWeight: 600,
                        color: isCorrect
                          ? COLORS.success
                          : isHover
                            ? COLORS.turquoise700
                            : COLORS.ash,
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        fontFamily: FONT_SANS,
                        fontSize: 20,
                        color: COLORS.ink,
                      }}
                    >
                      {opt}
                    </div>
                    {isCorrect && (
                      <div
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: 12,
                          fontWeight: 600,
                          color: COLORS.success,
                          opacity: showReveal,
                        }}
                      >
                        ✓ đúng
                      </div>
                    )}
                  </div>
                </AnimatedIn>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 22,
              fontFamily: FONT_SANS,
              fontSize: 15,
              color: COLORS.ash,
              textAlign: "center",
              opacity: showReveal,
            }}
          >
            Mỗi bài kết thúc bằng câu hỏi — trắc nghiệm, điền vào chỗ trống,
            kéo thả. Học qua thực hành, không chỉ qua đọc.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
