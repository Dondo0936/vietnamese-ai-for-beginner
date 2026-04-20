import { useCurrentFrame, interpolate, Easing } from "remotion";
import { LandingChrome, LandingBackdrop } from "../components/LandingChrome";
import { AnimatedIn } from "../components/AnimatedIn";
import { COLORS, VN_TEXT_RENDER } from "../tokens";import { FONT_VN_DISPLAY, FONT_MONO } from "../fonts";

/**
 * Scene 1 — Landing hero (mirror of src/components/landing/LandingHero.tsx).
 *
 * Left column: eyebrow → big editorial headline "Học AI / không cần /
 * <s>biết tiếng Anh.</s>" → lede → CTA row → 4-number counter strip.
 * Right column: animated AttentionDemoCard cycling query tokens.
 */
export const HeroScene = () => {
  const frame = useCurrentFrame();

  // Which query row is "active" — cycles every 24 frames so the viewer
  // sees the attention shift before the scene cuts.
  const queryIndex = Math.min(4, Math.floor(frame / 24) % 5);

  return (
    <LandingChrome>
      <LandingBackdrop />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
          padding: "40px 56px",
          height: "100%",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* LEFT — copy */}
        <div>
          <AnimatedIn delay={2} offsetY={6} duration={14}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: FONT_MONO,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: COLORS.ash,
                marginBottom: 22,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: COLORS.turquoise500,
                }}
              />
              <span>
                nền tảng giáo dục AI · mã nguồn mở · 2026
              </span>
            </div>
          </AnimatedIn>

          <AnimatedIn delay={8} offsetY={14}>
            <h1
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,                fontSize: 76,
                fontWeight: 500,
                letterSpacing: "-0.035em",
                lineHeight: 0.94,
                color: COLORS.ink,
                margin: 0,
                marginBottom: 20,
              }}
            >
              Học AI<br />
              không cần<br />
              <span
                style={{
                  position: "relative",
                  display: "inline-block",
                  color: COLORS.graphite,
                }}
              >
                biết tiếng Anh.
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "52%",
                    height: 6,
                    background: COLORS.turquoise500,
                    transform: "skewY(-3deg)",
                  }}
                />
              </span>
            </h1>
          </AnimatedIn>

          <AnimatedIn delay={18} offsetY={8}>
            <p
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,                fontSize: 15,
                lineHeight: 1.55,
                color: COLORS.graphite,
                maxWidth: 460,
                margin: "0 0 24px",
              }}
            >
              260+ chủ đề viết lại cho người Việt — qua slider, drag-drop,
              toggle-compare và minh hoạ thủ công.
            </p>
          </AnimatedIn>

          <AnimatedIn delay={26} offsetY={8}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 14 }}
            >
              <span
                style={{
                  fontFamily: FONT_VN_DISPLAY,
                  ...VN_TEXT_RENDER,                  fontSize: 15,
                  fontWeight: 500,
                  color: COLORS.paper,
                  background: COLORS.ink,
                  padding: "14px 22px",
                  borderRadius: 999,
                }}
              >
                Mở udemi.tech →
              </span>
              <span
                style={{
                  fontFamily: FONT_VN_DISPLAY,
                  ...VN_TEXT_RENDER,                  fontSize: 14,
                  color: COLORS.turquoise700,
                }}
              >
                Xem 4 lộ trình →
              </span>
            </div>
          </AnimatedIn>

          <AnimatedIn delay={36} offsetY={8}>
            <div
              style={{
                marginTop: 32,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 20,
                borderTop: `1px solid ${COLORS.line}`,
                paddingTop: 20,
              }}
            >
              {[
                ["260+", "chủ đề"],
                ["47", "primitive tương tác"],
                ["4", "lộ trình"],
                ["~278h", "nội dung"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div
                    style={{
                      fontFamily: FONT_VN_DISPLAY,
                      ...VN_TEXT_RENDER,                      fontSize: 26,
                      fontWeight: 500,
                      color: COLORS.ink,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {n}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_VN_DISPLAY,
                      ...VN_TEXT_RENDER,                      fontSize: 11,
                      color: COLORS.ash,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedIn>
        </div>

        {/* RIGHT — AttentionDemoCard */}
        <AnimatedIn delay={12} offsetY={18} duration={22}>
          <AttentionDemoCard queryIndex={queryIndex} frame={frame} />
        </AnimatedIn>
      </div>
    </LandingChrome>
  );
};

const QUERY_LABELS = ["con mèo", "đang", "ngủ", "trên", "ghế"];
const ROWS_BY_QUERY: number[][][] = [
  [
    [30, 80, 50, 20, 15],
    [60, 35, 90, 25, 20],
    [20, 45, 30, 95, 40],
    [40, 55, 65, 40, 50],
    [25, 60, 40, 75, 90],
  ],
  [
    [85, 30, 40, 20, 10],
    [30, 70, 60, 25, 20],
    [90, 40, 50, 35, 20],
    [20, 40, 35, 60, 55],
    [15, 30, 25, 60, 75],
  ],
  [
    [90, 75, 50, 20, 15],
    [60, 80, 90, 25, 20],
    [30, 55, 40, 85, 40],
    [20, 40, 55, 70, 60],
    [25, 40, 35, 85, 90],
  ],
  [
    [40, 35, 30, 20, 15],
    [30, 45, 40, 25, 20],
    [50, 45, 35, 60, 45],
    [30, 50, 70, 50, 60],
    [70, 65, 55, 90, 95],
  ],
  [
    [20, 30, 25, 15, 10],
    [30, 40, 50, 25, 20],
    [40, 55, 40, 60, 65],
    [40, 50, 55, 70, 85],
    [35, 50, 60, 80, 95],
  ],
];

const AttentionDemoCard = ({
  queryIndex,
  frame,
}: {
  queryIndex: number;
  frame: number;
}) => {
  const rows = ROWS_BY_QUERY[queryIndex];
  const sliderPct = (queryIndex / 4) * 100;
  const thumbX = interpolate(frame, [0, 4], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 16,
        boxShadow: "0 20px 40px rgba(17,17,17,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Chrome bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 14px",
          borderBottom: `1px solid ${COLORS.line}`,
          background: COLORS.paper2,
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <Dot color="#F25C54" />
          <Dot color="#F5B547" />
          <Dot color="#3DD68C" />
        </div>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.graphite,
          }}
        >
          udemi.tech/topics/attention-mechanism
        </span>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: COLORS.turquoise700,
            background: COLORS.turquoise50,
            padding: "2px 8px",
            borderRadius: 4,
            letterSpacing: "0.08em",
          }}
        >
          ● LIVE
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 22px" }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: COLORS.ash,
            marginBottom: 10,
          }}
        >
          Bước 3 / 8 · Trực quan tương tác
        </div>
        <h3
          style={{
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,            fontSize: 19,
            fontWeight: 500,
            color: COLORS.ink,
            margin: 0,
            marginBottom: 6,
          }}
        >
          Mô hình &quot;nhìn&quot; vào đâu khi đọc câu?
        </h3>
        <p
          style={{
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,            fontSize: 12,
            color: COLORS.graphite,
            margin: 0,
            marginBottom: 14,
          }}
        >
          Cột cao = mô hình chú ý nhiều hơn vào token đó cho query hiện tại.
        </p>

        {/* Attention bar grid */}
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr",
              alignItems: "center",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,                fontSize: 12,
                color: COLORS.graphite,
              }}
            >
              {QUERY_LABELS[i]}
            </span>
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 14 }}>
              {row.map((h, j) => (
                <div
                  key={j}
                  style={{
                    flex: 1,
                    height: `${h * thumbX}%`,
                    background: mixAccent(h),
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Slider */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px dashed ${COLORS.line}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: COLORS.ash,
              marginBottom: 8,
            }}
          >
            <span>← con mèo</span>
            <span style={{ fontFamily: FONT_MONO }}>
              query: &quot;{QUERY_LABELS[queryIndex]}&quot;
            </span>
            <span>ghế →</span>
          </div>
          <div
            style={{
              position: "relative",
              height: 4,
              background: COLORS.paper2,
              borderRadius: 999,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${sliderPct}%`,
                background: COLORS.turquoise500,
                borderRadius: 999,
                transition: "width 220ms ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -6,
                left: `${sliderPct}%`,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: COLORS.turquoise500,
                border: `2px solid ${COLORS.white}`,
                transform: "translateX(-50%)",
                boxShadow: "0 3px 8px rgba(17,17,17,0.12)",
              }}
            />
          </div>
        </div>

        {/* Aha callout */}
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            background: "rgba(32, 184, 176, 0.08)",
            borderLeft: `3px solid ${COLORS.turquoise500}`,
            borderRadius: "0 6px 6px 0",
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,            fontSize: 11,
            color: COLORS.ink,
          }}
        >
          <b>✳ Khoảnh khắc à-ha:</b> attention dịch chuyển khi query đổi — không cố định một ô.
        </div>
      </div>
    </div>
  );
};

const Dot = ({ color }: { color: string }) => (
  <span
    style={{
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: color,
    }}
  />
);

const mixAccent = (h: number) => {
  // Linear approximation of color-mix(var(--accent) h%, paper2).
  const t = h / 100;
  const r = Math.round(243 * (1 - t) + 32 * t);
  const g = Math.round(242 * (1 - t) + 184 * t);
  const b = Math.round(238 * (1 - t) + 176 * t);
  return `rgb(${r}, ${g}, ${b})`;
};
