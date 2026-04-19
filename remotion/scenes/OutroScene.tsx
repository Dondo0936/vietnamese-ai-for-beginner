import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Brain } from "lucide-react";
import { AnimatedIn } from "../components/AnimatedIn";
import { COLORS } from "../tokens";
import { FONT_VN_DISPLAY } from "../fonts";

/**
 * Scene 6 — Outro.
 *
 * A minimal paper card centered on the canvas: brand mark + tagline +
 * URL. Mirrors the app's aesthetic (paper background, turquoise brain)
 * rather than the glass-panel hero used in earlier demos — this keeps
 * the outro visually consistent with the navbar shown in every prior
 * scene. A soft turquoise glow rolls in over the first second.
 */
export const OutroScene = () => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [0, 30, 90], [0, 1, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.paper }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(32, 184, 176, ${
            0.12 * glow
          }) 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 64,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 820 }}>
          <AnimatedIn delay={2} offsetY={10}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 24,
              }}
            >
              <Brain size={44} color={COLORS.turquoise500} strokeWidth={2} />
              <span
                style={{
                  fontFamily: FONT_VN_DISPLAY,
                  fontSize: 38,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: COLORS.ink,
                }}
              >
                AI Cho Mọi Người
              </span>
            </div>
          </AnimatedIn>

          <AnimatedIn delay={12} offsetY={10}>
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 52,
                fontWeight: 500,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                color: COLORS.ink,
                marginBottom: 16,
              }}
            >
              Hiểu AI qua{" "}
              <span
                style={{
                  background: `linear-gradient(120deg, ${COLORS.turquoise500}, ${COLORS.peach500} 45%, ${COLORS.turquoise700})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                hình ảnh và ví dụ
              </span>
            </div>
          </AnimatedIn>

          <AnimatedIn delay={22} offsetY={8}>
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 17,
                color: COLORS.graphite,
                lineHeight: 1.55,
                marginBottom: 32,
              }}
            >
              264 chủ đề · 4 lộ trình · Miễn phí · 100% tiếng Việt
            </div>
          </AnimatedIn>

          <AnimatedIn delay={34} offsetY={8}>
            <div
              style={{
                display: "inline-block",
                padding: "12px 28px",
                borderRadius: 999,
                background: COLORS.turquoiseInk,
                color: COLORS.paper,
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 16,
                fontWeight: 500,
                boxShadow: "0 4px 14px rgba(19,52,59,0.18)",
              }}
            >
              udemi.tech
            </div>
          </AnimatedIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
