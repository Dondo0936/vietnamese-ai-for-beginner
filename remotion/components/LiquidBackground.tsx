import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../tokens";

/**
 * Minimalist liquid-glass background.
 *
 * Two slowly drifting turquoise blobs on warm paper, each heavily blurred,
 * produce the frosted-glass base that matches the app's Perplexity × Momo
 * paper palette (--paper, --paper-2) plus the turquoise accent ramp.
 */
export const LiquidBackground = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const blob1X = 220 + Math.sin(t * 0.6) * 80;
  const blob1Y = 180 + Math.cos(t * 0.45) * 60;
  const blob2X = 1050 + Math.cos(t * 0.5) * 90;
  const blob2Y = 540 + Math.sin(t * 0.4) * 70;
  const blob3X = 640 + Math.sin(t * 0.3 + 1) * 40;
  const blob3Y = 360 + Math.cos(t * 0.35) * 30;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.paper,
        backgroundImage: `radial-gradient(ellipse at 50% 0%, ${COLORS.paper} 0%, ${COLORS.paper2} 60%, ${COLORS.paper3} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: blob1X,
          top: blob1Y,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.turquoise300} 0%, ${COLORS.turquoise100} 60%, transparent 75%)`,
          filter: "blur(70px)",
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: blob2X,
          top: blob2Y,
          width: 440,
          height: 440,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.turquoise500} 0%, ${COLORS.turquoise100} 55%, transparent 75%)`,
          filter: "blur(80px)",
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: blob3X,
          top: blob3Y,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.peach200} 0%, transparent 70%)`,
          filter: "blur(100px)",
          opacity: 0.35,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(26,26,26,0.02) 0px, rgba(26,26,26,0.02) 1px, transparent 1px, transparent 3px)`,
          mixBlendMode: "multiply",
        }}
      />
    </AbsoluteFill>
  );
};
