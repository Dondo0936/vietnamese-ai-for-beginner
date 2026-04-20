import { useCurrentFrame, interpolate, Easing } from "remotion";
import { COLORS, VN_TEXT_RENDER } from "../tokens";import { FONT_VN_DISPLAY, FONT_MONO } from "../fonts";

/**
 * Scene 8 — Landing big-CTA / outro
 * (mirror of src/components/landing/LandingBigCTA.tsx).
 *
 * Full-bleed ink background with a giant display-size closing headline
 * "Thôi nào, / học thử đi." + two buttons + meta strip at the bottom.
 */
export const BigCTAScene = () => {
  const frame = useCurrentFrame();

  const headlineY = interpolate(frame, [0, 22], [24, 0], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [18, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const metaOpacity = interpolate(frame, [36, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.ink,
        color: COLORS.paper,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "72px 56px",
        position: "relative",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, rgba(32, 184, 176, 0.14), transparent 60%)`,
          opacity: Math.min(1, frame / 12),
        }}
      />

      <div
        style={{
          position: "relative",
          textAlign: "center",
          maxWidth: 920,
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: COLORS.turquoise300,
            marginBottom: 20,
          }}
        >
          ✳ — udemi.tech — ✳
        </div>

        <h1
          style={{
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,            fontSize: 104,
            fontWeight: 500,
            letterSpacing: "-0.035em",
            lineHeight: 0.94,
            margin: 0,
            color: COLORS.paper,
          }}
        >
          Thôi nào,<br />
          <span
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              color: COLORS.turquoise300,
            }}
          >
            học thử đi.
          </span>
        </h1>
      </div>

      <div
        style={{
          position: "relative",
          marginTop: 40,
          display: "flex",
          gap: 14,
          opacity: ctaOpacity,
          transform: `translateY(${(1 - ctaOpacity) * 8}px)`,
        }}
      >
        <span
          style={{
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,            fontSize: 15,
            fontWeight: 500,
            color: COLORS.ink,
            background: COLORS.turquoise300,
            padding: "16px 28px",
            borderRadius: 999,
          }}
        >
          Mở udemi.tech →
        </span>
        <span
          style={{
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,            fontSize: 15,
            color: COLORS.paper,
            padding: "16px 22px",
            border: `1px solid rgba(251, 250, 247, 0.25)`,
            borderRadius: 999,
          }}
        >
          Xem GitHub ↗
        </span>
      </div>

      <div
        style={{
          position: "relative",
          marginTop: 48,
          display: "flex",
          gap: 18,
          fontFamily: FONT_MONO,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: COLORS.ash,
          opacity: metaOpacity,
        }}
      >
        <span>MIT license</span>
        <span>·</span>
        <span>không quảng cáo</span>
        <span>·</span>
        <span>không tracking</span>
        <span>·</span>
        <span>chạy trên Vercel</span>
      </div>
    </div>
  );
};
