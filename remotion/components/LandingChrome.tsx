import { CSSProperties, ReactNode } from "react";
import { COLORS } from "../tokens";
import { FONT_VN_DISPLAY, FONT_SANS } from "../fonts";

/**
 * Landing-page chrome (mirror of `src/components/landing/LandingNav.tsx`).
 *
 * Renders the same 4-ray asterisk star + "udemi" wordmark + link row +
 * Đăng nhập/Mở app buttons that the live landing ships. Scenes that
 * want the nav strip include this at their top; scenes that want a
 * full-bleed look (marquee, outro) skip it.
 */
export const LandingChrome = ({
  children,
  background = COLORS.paper,
  showNav = true,
}: {
  children: ReactNode;
  background?: string;
  showNav?: boolean;
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {showNav && <LandingNav />}
      <div
        style={{
          position: "absolute",
          inset: showNav ? "64px 0 0 0" : 0,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const LandingNav = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 64,
      background: "rgba(251, 250, 247, 0.82)",
      borderBottom: `1px solid ${COLORS.line}`,
      backdropFilter: "blur(24px) saturate(1.8)",
      WebkitBackdropFilter: "blur(24px) saturate(1.8)",
      zIndex: 10,
      display: "flex",
      alignItems: "center",
      paddingLeft: 48,
      paddingRight: 48,
    }}
  >
    {/* Brand — star + wordmark */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 240,
      }}
    >
      <StarMark />
      <span
        style={{
          fontFamily: FONT_VN_DISPLAY,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: COLORS.ink,
        }}
      >
        udemi
      </span>
      <span
        style={{
          marginLeft: 8,
          paddingLeft: 12,
          borderLeft: `1px solid ${COLORS.line}`,
          fontFamily: FONT_VN_DISPLAY,
          fontSize: 11,
          fontWeight: 400,
          color: COLORS.ash,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        AI cho mọi người
      </span>
    </div>

    {/* Links — middle */}
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        gap: 28,
        fontFamily: FONT_VN_DISPLAY,
        fontSize: 14,
        color: COLORS.graphite,
      }}
    >
      <span>Lộ trình</span>
      <span>Chủ đề</span>
      <span>Cẩm nang Claude</span>
      <span>Giới thiệu</span>
      <span>GitHub ↗</span>
    </div>

    {/* Actions — right */}
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        minWidth: 240,
        justifyContent: "flex-end",
      }}
    >
      <span
        style={{
          fontFamily: FONT_VN_DISPLAY,
          fontSize: 13,
          fontWeight: 500,
          color: COLORS.graphite,
          padding: "8px 14px",
        }}
      >
        Đăng nhập
      </span>
      <span
        style={{
          fontFamily: FONT_VN_DISPLAY,
          fontSize: 13,
          fontWeight: 500,
          color: COLORS.paper,
          background: COLORS.ink,
          padding: "10px 16px",
          borderRadius: 999,
        }}
      >
        Mở app →
      </span>
    </div>
  </div>
);

/** 4-ray asterisk star — 4 rotated strokes through a shared center. */
const StarMark = () => (
  <svg width={18} height={18} viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
    <g stroke={COLORS.turquoise500} strokeWidth={1.4} strokeLinecap="round">
      <line x1={9} y1={1} x2={9} y2={17} />
      <line x1={1} y1={9} x2={17} y2={9} />
      <line x1={3.3} y1={3.3} x2={14.7} y2={14.7} />
      <line x1={14.7} y1={3.3} x2={3.3} y2={14.7} />
    </g>
  </svg>
);

/** Shared big-hero decorative glow backdrop. */
export const LandingBackdrop = ({ style }: { style?: CSSProperties }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse at 50% 0%, rgba(32, 184, 176, 0.10), transparent 55%)`,
      pointerEvents: "none",
      ...style,
    }}
  />
);
