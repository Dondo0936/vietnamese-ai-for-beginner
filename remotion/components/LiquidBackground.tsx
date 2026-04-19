import { AbsoluteFill } from "remotion";
import { COLORS } from "../tokens";

/**
 * Static liquid-glass background.
 *
 * Earlier revisions drifted three blobs via useCurrentFrame. That looks
 * nice in the raw MP4, but when the output is palette-quantized into a
 * 48-colour GIF (for the README inline embed), the colour values behind
 * every text layer shift by 1–2 palette indices each frame. The Bayer
 * dither pattern then re-tiles, and the eye reads that as text shimmer —
 * even though the text pixels never moved. Freezing the backdrop keeps
 * the GIF palette locked, so text-adjacent pixels stay byte-identical
 * frame-to-frame and the dither pattern never changes.
 *
 * The paper tone, blob halo, and grain overlay all remain — the scene
 * just stops *flowing*. Trade-off accepted in exchange for headings that
 * actually sit still in the README GIF.
 */
export const LiquidBackground = () => {
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
          left: 220,
          top: 180,
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
          left: 1050,
          top: 540,
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
          left: 640,
          top: 360,
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
