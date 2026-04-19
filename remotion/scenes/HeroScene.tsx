import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LiquidBackground } from "../components/LiquidBackground";
import { GlassPanel } from "../components/GlassPanel";
import { AnimatedIn } from "../components/AnimatedIn";
import { FONT_DISPLAY, FONT_SANS, FONT_MONO, FONT_VN_DISPLAY } from "../fonts";
import { COLORS } from "../tokens";

export const HeroScene = () => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [0, 30, 120], [0, 1, 1], {
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
        <GlassPanel
          padding={56}
          radius={28}
          style={{ width: 900, textAlign: "center" }}
        >
          <AnimatedIn delay={4}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: COLORS.turquoise600,
                marginBottom: 20,
                fontWeight: 500,
              }}
            >
              udemi.tech
            </div>
          </AnimatedIn>
          <AnimatedIn delay={8}>
            {/*
              Hero wordmark — uses Be Vietnam Pro + fully disabled OpenType
              features so Chromium cannot re-shape the combined-mark glyphs
              ("ọ" in "mọi", "ờ" in "người") between frames. See fonts.ts.
            */}
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 80,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: COLORS.ink,
                marginBottom: 18,
                textRendering: "geometricPrecision",
                fontKerning: "none",
                fontFeatureSettings: '"kern" off, "liga" off, "calt" off, "clig" off',
              }}
            >
              AI cho mọi người
            </div>
          </AnimatedIn>
          <AnimatedIn delay={16}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 26,
                fontWeight: 400,
                letterSpacing: "-0.01em",
                color: COLORS.graphite,
                lineHeight: 1.4,
                maxWidth: 720,
                margin: "0 auto",
              }}
            >
              Học AI và học máy bằng tiếng Việt qua{" "}
              <span style={{ color: COLORS.turquoise700, fontWeight: 500 }}>
                hình minh họa tương tác
              </span>{" "}
              và ví dụ thực tế.
            </div>
          </AnimatedIn>
          <AnimatedIn delay={30}>
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                marginTop: 36,
                fontFamily: FONT_SANS,
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              <Pill label="264 chủ đề" />
              <Pill label="Miễn phí · Mã nguồn mở" tone="accent" />
              <Pill label="100% tiếng Việt" />
            </div>
          </AnimatedIn>
        </GlassPanel>
      </AbsoluteFill>

      {/* soft spotlight glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 55%, rgba(32, 184, 176, ${
            0.12 * glow
          }) 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

const Pill = ({
  label,
  tone = "light",
}: {
  label: string;
  tone?: "light" | "accent";
}) => (
  <div
    style={{
      padding: "8px 16px",
      borderRadius: 999,
      background:
        tone === "accent" ? "rgba(32, 184, 176, 0.14)" : "rgba(255,255,255,0.7)",
      border:
        tone === "accent"
          ? `1px solid ${COLORS.turquoise500}`
          : `1px solid ${COLORS.line}`,
      color: tone === "accent" ? COLORS.turquoise700 : COLORS.graphite,
      fontFamily: FONT_SANS,
    }}
  >
    {label}
  </div>
);
