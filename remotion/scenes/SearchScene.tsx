import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LiquidBackground } from "../components/LiquidBackground";
import { GlassPanel } from "../components/GlassPanel";
import { AnimatedIn } from "../components/AnimatedIn";
import { FONT_DISPLAY, FONT_SANS, FONT_MONO } from "../fonts";
import { COLORS } from "../tokens";

const FULL_QUERY = "chuỗi suy luận";

const SUGGESTIONS = [
  { vi: "Chuỗi suy luận (Chain of Thought)", tag: "LLM · Cơ bản" },
  { vi: "Chuỗi suy luận trong mô hình lý luận", tag: "Ứng dụng · Mô hình mới" },
  { vi: "In-context learning", tag: "LLM · Cơ bản" },
  { vi: "Reasoning models", tag: "Xu hướng · 2025" },
];

export const SearchScene = () => {
  const frame = useCurrentFrame();

  // Type the query character by character from frame 18 → 48.
  const typed = Math.max(
    0,
    Math.min(FULL_QUERY.length, Math.floor((frame - 18) / 2))
  );
  const query = FULL_QUERY.slice(0, typed);
  const showSuggestions = frame > 55;
  const reveal = interpolate(frame, [55, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorOn = Math.floor(frame / 12) % 2 === 0;

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
        <div style={{ width: 1040 }}>
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
                textAlign: "center",
              }}
            >
              Tìm kiếm
            </div>
          </AnimatedIn>
          <AnimatedIn delay={6}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 48,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: COLORS.ink,
                textAlign: "center",
                marginBottom: 32,
                lineHeight: 1.1,
              }}
            >
              Gõ tiếng Việt — AI đọc hiểu ngay
            </div>
          </AnimatedIn>

          <AnimatedIn delay={10}>
            <GlassPanel padding={0} radius={20} style={{ overflow: "hidden" }}>
              {/* Search input row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "20px 26px",
                  borderBottom: showSuggestions
                    ? `1px solid ${COLORS.line}`
                    : "none",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: `2px solid ${COLORS.ash}`,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: -6,
                      bottom: -6,
                      width: 10,
                      height: 2,
                      background: COLORS.ash,
                      transform: "rotate(45deg)",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 24,
                    color: COLORS.ink,
                    flex: 1,
                    fontWeight: 400,
                  }}
                >
                  {query || (
                    <span style={{ color: COLORS.ash }}>
                      Tìm chủ đề, khái niệm, ứng dụng…
                    </span>
                  )}
                  {query && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 22,
                        marginLeft: 3,
                        background: cursorOn
                          ? COLORS.turquoise700
                          : "transparent",
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: COLORS.ash,
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: `1px solid ${COLORS.line}`,
                    background: COLORS.paper2,
                  }}
                >
                  Enter
                </div>
              </div>

              {/* Suggestions */}
              {showSuggestions && (
                <div
                  style={{
                    padding: "8px 0",
                    opacity: reveal,
                    transform: `translateY(${(1 - reveal) * 8}px)`,
                  }}
                >
                  {SUGGESTIONS.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 26px",
                        background:
                          i === 0
                            ? "rgba(32, 184, 176, 0.08)"
                            : "transparent",
                        borderLeft:
                          i === 0
                            ? `3px solid ${COLORS.turquoise500}`
                            : `3px solid transparent`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: FONT_SANS,
                          fontSize: 18,
                          color: i === 0 ? COLORS.turquoise700 : COLORS.ink,
                          fontWeight: i === 0 ? 500 : 400,
                        }}
                      >
                        {s.vi}
                      </div>
                      <div
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: 11,
                          color: COLORS.ash,
                        }}
                      >
                        {s.tag}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </AnimatedIn>

          <AnimatedIn delay={85}>
            <div
              style={{
                marginTop: 22,
                fontFamily: FONT_SANS,
                fontSize: 15,
                color: COLORS.graphite,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              Tìm kiếm mờ song ngữ Việt–Anh — bỏ dấu, gõ tắt, viết sai một chút
              đều ra kết quả.
            </div>
          </AnimatedIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
