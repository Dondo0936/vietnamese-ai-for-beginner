import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Search as SearchIcon, ArrowRight, Sparkles } from "lucide-react";
import { AppFrame } from "../components/AppFrame";
import { AnimatedIn } from "../components/AnimatedIn";
import { Cursor } from "../components/Cursor";
import { COLORS } from "../tokens";
import { FONT_DISPLAY, FONT_SANS, FONT_VN_DISPLAY } from "../fonts";

/**
 * Scene 1 — Home page.
 *
 * Renders a faithful mock of `src/app/page.tsx` hero: eyebrow, display
 * headline, subtitle, ask-bar, and the Claude guide card. Cursor enters
 * at frame ~120 and glides down toward the path-picker section below
 * the fold, setting up the cut to Scene 2.
 */
export const HeroScene = () => {
  const frame = useCurrentFrame();

  return (
    <AppFrame>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 48,
          paddingLeft: 56,
          paddingRight: 56,
          position: "relative",
        }}
      >
        {/* Hero section */}
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            textAlign: "center",
            paddingTop: 18,
          }}
        >
          <AnimatedIn delay={4} offsetY={10}>
            <div
              style={{
                fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: COLORS.ash,
                marginBottom: 18,
                fontWeight: 500,
              }}
            >
              AI cho mọi người · Tiếng Việt
            </div>
          </AnimatedIn>

          <AnimatedIn delay={10} offsetY={14}>
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 60,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: COLORS.ink,
                marginBottom: 14,
                textRendering: "geometricPrecision",
                fontKerning: "none",
                fontFeatureSettings: '"kern" off, "liga" off, "calt" off, "clig" off',
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

          <AnimatedIn delay={20} offsetY={10}>
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 17,
                fontWeight: 400,
                color: COLORS.graphite,
                lineHeight: 1.55,
                maxWidth: 540,
                margin: "0 auto",
              }}
            >
              Khám phá AI/ML qua minh họa tương tác và ví dụ thực tế bằng tiếng
              Việt. Không cần nền tảng kỹ thuật.
            </div>
          </AnimatedIn>

          {/* Ask bar */}
          <AnimatedIn delay={32} offsetY={12}>
            <div
              style={{
                marginTop: 28,
                maxWidth: 560,
                marginLeft: "auto",
                marginRight: "auto",
                background: "#FFFFFF",
                border: `1px solid ${COLORS.line}`,
                borderRadius: 14,
                paddingLeft: 20,
                paddingRight: 6,
                paddingTop: 10,
                paddingBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 1px 2px rgba(10,10,11,0.04), 0 0 0 1px rgba(10,10,11,0.02)",
              }}
            >
              <SearchIcon size={18} color={COLORS.ash} strokeWidth={1.8} />
              <span
                style={{
                  fontFamily: FONT_VN_DISPLAY,
                  fontSize: 15,
                  color: COLORS.ash,
                  flex: 1,
                  textAlign: "left",
                }}
              >
                Tìm kiếm chủ đề...
              </span>
              <span
                style={{
                  fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                  fontSize: 11,
                  color: COLORS.ash,
                  padding: "3px 7px",
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: 5,
                  background: COLORS.paper2,
                }}
              >
                ⌘K
              </span>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: COLORS.turquoiseInk,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={16} color={COLORS.paper} strokeWidth={2} />
              </div>
            </div>
          </AnimatedIn>

          <AnimatedIn delay={44} offsetY={8}>
            <div
              style={{
                marginTop: 14,
                fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                fontSize: 12,
                color: COLORS.ash,
                display: "flex",
                gap: 14,
                justifyContent: "center",
              }}
            >
              <span>264 chủ đề</span>
              <span>|</span>
              <span>12 danh mục</span>
              <span>|</span>
              <span>4 lộ trình</span>
            </div>
          </AnimatedIn>

          {/* Claude guide card */}
          <AnimatedIn delay={58} offsetY={14}>
            <div
              style={{
                marginTop: 28,
                maxWidth: 560,
                marginLeft: "auto",
                marginRight: "auto",
                background: `linear-gradient(135deg, ${COLORS.peach200} 0%, ${COLORS.paper} 65%)`,
                border: `1px solid ${COLORS.peach200}`,
                borderRadius: 14,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: COLORS.turquoise100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Sparkles size={16} color={COLORS.turquoise700} strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontFamily: FONT_VN_DISPLAY,
                    fontSize: 14,
                    fontWeight: 500,
                    color: COLORS.ink,
                  }}
                >
                  Cẩm nang Claude.{" "}
                </span>
                <span
                  style={{
                    fontFamily: FONT_VN_DISPLAY,
                    fontSize: 14,
                    color: COLORS.graphite,
                  }}
                >
                  Chưa dùng Claude? Bắt đầu ở đây.
                </span>
              </div>
              <ArrowRight size={18} color={COLORS.turquoise700} strokeWidth={2} />
            </div>
          </AnimatedIn>
        </div>

        {/* soft spotlight glow */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 30%, rgba(32, 184, 176, ${
              0.08 * interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp" })
            }) 0%, transparent 55%)`,
            pointerEvents: "none",
            zIndex: -1,
          }}
        />

        {/* Cursor enters late, glides down off-screen */}
        <Cursor
          hideBefore={8}
          keyframes={[
            { at: 96, x: 1060, y: 290 },
            { at: 130, x: 680, y: 560 },
            { at: 155, x: 680, y: 680 },
          ]}
        />
      </div>
    </AppFrame>
  );
};
