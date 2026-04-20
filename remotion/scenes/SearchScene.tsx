import { useCurrentFrame, interpolate, Easing } from "remotion";
import { Search } from "lucide-react";
import { LandingChrome } from "../components/LandingChrome";
import { AnimatedIn } from "../components/AnimatedIn";
import { COLORS, VN_TEXT_RENDER } from "../tokens";import { FONT_VN_DISPLAY, FONT_MONO } from "../fonts";

/**
 * Scene 2 — Landing search section
 * (mirror of src/components/landing/LandingSearch.tsx).
 *
 * "✳ 260 chủ đề · 4 lộ trình · tiếng Việt · mã nguồn mở" eyebrow, then
 * the huge "Hỏi bất cứ gì về AI." display with italic emphasis,
 * centered rounded search box, then the chip rail underneath.
 *
 * Around frame 70 a typeahead dropdown fades in showing 3 real topic
 * hits — same UX the user gets when they type "attention" into the
 * live search.
 */
export const SearchScene = () => {
  const frame = useCurrentFrame();

  // Typed-in query — one char every 3 frames starting at frame 50.
  const typedChars = Math.min(
    "attention".length,
    Math.max(0, Math.floor((frame - 50) / 3))
  );
  const typed = "attention".slice(0, typedChars);

  // Dropdown reveal begins once enough characters are typed.
  const dropdownOpacity = interpolate(frame, [70, 85], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <LandingChrome>
      <div
        style={{
          padding: "64px 48px",
          textAlign: "center",
          position: "relative",
          height: "100%",
          background: `radial-gradient(ellipse at 50% 0%, rgba(32, 184, 176, 0.08), transparent 55%)`,
        }}
      >
        <AnimatedIn delay={2} offsetY={6} duration={14}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: COLORS.ash,
            }}
          >
            ✳ 260 chủ đề · 4 lộ trình · tiếng Việt · mã nguồn mở
          </div>
        </AnimatedIn>

        <AnimatedIn delay={8} offsetY={14} duration={22}>
          <h2
            style={{
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,              fontSize: 88,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 0.98,
              margin: "16px 0 32px",
              color: COLORS.ink,
            }}
          >
            Hỏi bất cứ gì<br />
            về{" "}
            <span
              style={{
                fontStyle: "italic",
                fontWeight: 400,
                color: COLORS.turquoiseInk,
              }}
            >
              AI.
            </span>
          </h2>
        </AnimatedIn>

        {/* Outer z-index:30 wrapper. Each AnimatedIn child creates its own
            stacking context (non-identity transform), so z-index on the
            inner wrap alone wouldn't clear the chips AnimatedIn below. */}
        <div style={{ position: "relative", zIndex: 30 }}>
        <AnimatedIn delay={20} offsetY={10} duration={18}>
          <div
            style={{
              maxWidth: 780,
              margin: "0 auto",
              position: "relative",
            }}
          >
            {/* Search box */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "20px 24px",
                background: COLORS.white,
                border: `1.5px solid ${COLORS.ink}`,
                borderRadius: 24,
                boxShadow: "0 12px 40px rgba(17,17,17,0.08)",
                textAlign: "left",
              }}
            >
              <Search size={20} color={COLORS.graphite} strokeWidth={1.8} />
              <span
                style={{
                  flex: 1,
                  fontFamily: FONT_VN_DISPLAY,
                  ...VN_TEXT_RENDER,                  fontSize: 17,
                  color: typed ? COLORS.ink : COLORS.ash,
                }}
              >
                {typed || "Tìm chủ đề — RAG, transformer, gradient descent…"}
                {typed && frame % 20 < 10 && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 18,
                      background: COLORS.ink,
                      marginLeft: 2,
                      verticalAlign: "text-bottom",
                    }}
                  />
                )}
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLORS.graphite,
                  padding: "4px 10px",
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: 4,
                  background: COLORS.paper2,
                }}
              >
                ⌘ K
              </span>
            </div>

            {/* Typeahead dropdown */}
            {dropdownOpacity > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: COLORS.white,
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: 16,
                  boxShadow: "0 20px 40px rgba(17,17,17,0.12)",
                  overflow: "hidden",
                  opacity: dropdownOpacity,
                  transform: `translateY(${(1 - dropdownOpacity) * 8}px)`,
                  textAlign: "left",
                  padding: 6,
                }}
              >
                {[
                  {
                    title: "Cơ chế attention",
                    sub: "attention-mechanism · Deep Learning",
                    active: true,
                  },
                  {
                    title: "Multi-head attention",
                    sub: "multi-head-attention · Deep Learning",
                    active: false,
                  },
                  {
                    title: "Self-attention",
                    sub: "self-attention · Deep Learning",
                    active: false,
                  },
                ].map((r) => (
                  <div
                    key={r.title}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: r.active
                        ? "rgba(32, 184, 176, 0.08)"
                        : "transparent",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT_VN_DISPLAY,
                        ...VN_TEXT_RENDER,                        fontSize: 15,
                        fontWeight: 500,
                        color: COLORS.ink,
                      }}
                    >
                      {r.title}
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 11,
                        color: COLORS.ash,
                      }}
                    >
                      {r.sub}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnimatedIn>
        </div>

        {/* Chips */}
        <AnimatedIn delay={32} offsetY={8} duration={18}>
          <div
            style={{
              marginTop: 28,
              maxWidth: 900,
              margin: "28px auto 0",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
              fontFamily: FONT_VN_DISPLAY,
              ...VN_TEXT_RENDER,              fontSize: 13,
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: COLORS.ash,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                alignSelf: "center",
                marginRight: 8,
              }}
            >
              Gợi ý:
            </span>
            {[
              "attention",
              "RAG",
              "fine-tuning",
              "bias-variance",
              "LoRA",
              "reasoning models",
              "MoE",
              "KV cache",
              "constitutional AI",
              "diffusion",
              "MLOps",
            ].map((c) => (
              <span
                key={c}
                style={{
                  padding: "6px 14px",
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: 999,
                  color: COLORS.graphite,
                  background: COLORS.white,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </AnimatedIn>
      </div>
    </LandingChrome>
  );
};
