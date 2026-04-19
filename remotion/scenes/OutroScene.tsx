import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LiquidBackground } from "../components/LiquidBackground";
import { GlassPanel } from "../components/GlassPanel";
import { AnimatedIn } from "../components/AnimatedIn";
import { FONT_DISPLAY, FONT_SANS, FONT_MONO } from "../fonts";
import { COLORS } from "../tokens";

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [0, 30, 90], [0, 1, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <LiquidBackground />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(32, 184, 176, ${
            0.15 * glow
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
        <GlassPanel
          padding={64}
          radius={32}
          style={{ textAlign: "center", width: 860 }}
        >
          <AnimatedIn delay={2}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 28,
                fontWeight: 500,
                color: COLORS.turquoise700,
                marginBottom: 14,
                letterSpacing: "-0.01em",
              }}
            >
              Bắt đầu ngay —
            </div>
          </AnimatedIn>
          <AnimatedIn delay={8}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 76,
                fontWeight: 600,
                letterSpacing: "-0.035em",
                lineHeight: 1.02,
                color: COLORS.ink,
                marginBottom: 20,
              }}
            >
              udemi.tech
            </div>
          </AnimatedIn>
          <AnimatedIn delay={16}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.graphite,
                lineHeight: 1.5,
              }}
            >
              Miễn phí · Mã nguồn mở · 100% tiếng Việt
            </div>
          </AnimatedIn>
          <AnimatedIn delay={26}>
            <div
              style={{
                marginTop: 32,
                fontFamily: FONT_MONO,
                fontSize: 12,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: COLORS.ash,
              }}
            >
              Next.js 16 · Supabase · Vercel
            </div>
          </AnimatedIn>
        </GlassPanel>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
