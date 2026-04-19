import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LiquidBackground } from "../components/LiquidBackground";
import { GlassPanel } from "../components/GlassPanel";
import { AnimatedIn } from "../components/AnimatedIn";
import { FONT_DISPLAY, FONT_SANS, FONT_MONO } from "../fonts";
import { COLORS } from "../tokens";

export const LessonScene = () => {
  const frame = useCurrentFrame();
  // Slider animates from 0 to 1.2 across the scene (~150 frames).
  const t = interpolate(frame, [0, 60, 120], [0.1, 1.1, 0.3], {
    extrapolateRight: "clamp",
  });
  const pct = Math.max(0, Math.min(1, t / 1.2));
  const temperature = t.toFixed(2);

  const labelLow = "Chính xác — dùng cho Q&A, trích xuất";
  const labelHigh = "Sáng tạo — dùng cho brainstorm";
  const label = t < 0.35 ? labelLow : t < 0.8 ? "Cân bằng" : labelHigh;

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
        <div style={{ width: 1100 }}>
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
              Bài học · Điều chỉnh độ sáng tạo
            </div>
          </AnimatedIn>
          <AnimatedIn delay={6}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 44,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: COLORS.ink,
                marginBottom: 28,
              }}
            >
              Kéo thử — cảm nhận AI &ldquo;sáng tạo&rdquo; thế nào
            </div>
          </AnimatedIn>

          <AnimatedIn delay={12}>
            <GlassPanel padding={32} radius={20}>
              {/* Slider */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  color: COLORS.ash,
                }}
              >
                <span>0.0</span>
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 22,
                    fontWeight: 600,
                    color: COLORS.turquoise700,
                  }}
                >
                  T = {temperature}
                </span>
                <span>1.2</span>
              </div>
              <div
                style={{
                  position: "relative",
                  height: 12,
                  borderRadius: 999,
                  background: COLORS.paper3,
                  border: `1px solid ${COLORS.line}`,
                  marginBottom: 30,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct * 100}%`,
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${COLORS.turquoise500}, ${COLORS.turquoise300})`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `calc(${pct * 100}% - 14px)`,
                    top: -8,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: COLORS.white,
                    border: `2px solid ${COLORS.turquoise500}`,
                    boxShadow: "0 4px 14px rgba(32, 184, 176, 0.35)",
                  }}
                />
              </div>

              {/* Live label */}
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 16,
                  color: COLORS.graphite,
                  marginBottom: 22,
                }}
              >
                <strong style={{ color: COLORS.ink }}>Chế độ:</strong>{" "}
                <span style={{ color: COLORS.turquoise700, fontWeight: 500 }}>
                  {label}
                </span>
              </div>

              {/* Output preview bars — three parallel "samples" at this T */}
              <div style={{ display: "grid", gap: 12 }}>
                {[0, 1, 2].map((i) => {
                  const noise = Math.sin(frame * 0.15 + i * 1.7) * 0.5 + 0.5;
                  const w = 0.4 + pct * 0.55 * (0.7 + noise * 0.6);
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: 11,
                          color: COLORS.ash,
                          width: 58,
                        }}
                      >
                        mẫu {i + 1}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 34,
                          borderRadius: 8,
                          background: COLORS.paper2,
                          border: `1px solid ${COLORS.line}`,
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(1, w) * 100}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, ${COLORS.turquoise600}, ${COLORS.turquoise300})`,
                            opacity: 0.78,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          </AnimatedIn>

          <AnimatedIn delay={24}>
            <div
              style={{
                marginTop: 22,
                fontFamily: FONT_SANS,
                fontSize: 17,
                color: COLORS.graphite,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              Mỗi chủ đề có{" "}
              <span style={{ color: COLORS.turquoise700, fontWeight: 500 }}>
                minh hoạ tương tác riêng
              </span>{" "}
              — kéo, gõ, thử sai — không chỉ là chữ.
            </div>
          </AnimatedIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
