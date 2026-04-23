import { AbsoluteFill } from "remotion";
import { ArrowRight, Check } from "lucide-react";

import { COLORS, VN_TEXT_RENDER } from "./tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "./fonts";

/**
 * Static banner — Large Tabular Models story card.
 *
 * 1280×720 still for the LTM article's social share / OG image.
 * Matches the article palette (clay + turquoise on paper) and the
 * lesson video's topbar framing. Rendered via `npx remotion still`.
 */

export const LESSON_LTM_BANNER_DURATION = 1;

export const LessonLargeTabularModelsBannerComposition = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.paper, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 78% 22%, rgba(32, 184, 176, 0.14), transparent 55%)`,
          pointerEvents: "none",
        }}
      />

      {/* Top chrome */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 56,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Star />
        <span
          style={{
            fontFamily: FONT_VN_DISPLAY,
            fontSize: 16,
            fontWeight: 500,
            color: COLORS.ink,
            letterSpacing: "-0.01em",
          }}
        >
          udemi
        </span>
        <span
          style={{
            marginLeft: 10,
            paddingLeft: 14,
            borderLeft: `1px solid ${COLORS.line}`,
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: COLORS.graphite,
            textTransform: "lowercase",
            letterSpacing: "0.06em",
          }}
        >
          articles / large-tabular-models
        </span>
      </div>

      {/* Main layout */}
      <div
        style={{
          position: "absolute",
          inset: "0 56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 50,
        }}
      >
        {/* Left · copy */}
        <div style={{ flex: 1, maxWidth: 720 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "6px 16px",
              border: `1px solid ${COLORS.turquoise300}`,
              borderRadius: 999,
              background: COLORS.turquoise50,
              fontFamily: FONT_MONO,
              fontSize: 12,
              color: COLORS.turquoise700,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              marginBottom: 26,
            }}
          >
            TabPFN v2 · Nature · 2025
          </div>

          <h1
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 700,
              fontSize: 92,
              lineHeight: 0.98,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: "-0.035em",
              ...VN_TEXT_RENDER,
            }}
          >
            Large
            <br />
            Tabular
            <br />
            <span style={{ color: COLORS.clay }}>Models.</span>
          </h1>

          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 24,
              fontWeight: 500,
              color: COLORS.graphite,
              marginTop: 26,
              lineHeight: 1.34,
              maxWidth: 620,
              ...VN_TEXT_RENDER,
            }}
          >
            AI đọc bảng —{" "}
            <span style={{ color: COLORS.turquoise700 }}>
              pretrain một lần, dùng cho mọi bảng
            </span>
            . Không fine-tune. Không hyperparameter tuning.
          </p>

          <div
            style={{
              marginTop: 34,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 18px",
              background: COLORS.ink,
              borderRadius: 8,
              fontFamily: FONT_MONO,
              fontSize: 14,
              color: COLORS.paper,
              letterSpacing: "0.02em",
            }}
          >
            udemi.tech/articles/large-tabular-models
            <ArrowRight size={16} color={COLORS.paper} strokeWidth={2.5} />
          </div>
        </div>

        {/* Right · diagram */}
        <div
          style={{
            flex: "0 0 430px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BannerTable />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Star = () => (
  <span
    style={{
      position: "relative",
      display: "inline-block",
      width: 16,
      height: 16,
    }}
  >
    <span
      style={{
        position: "absolute",
        inset: 0,
        margin: "auto",
        width: 3,
        height: 16,
        background: COLORS.turquoise500,
        transform: "rotate(45deg)",
      }}
    />
    <span
      style={{
        position: "absolute",
        inset: 0,
        margin: "auto",
        width: 3,
        height: 16,
        background: COLORS.turquoise500,
        transform: "rotate(-45deg)",
      }}
    />
  </span>
);

/**
 * A stylised 5×5 CSV with one cell highlighted as the predicted value.
 * The turquoise "y" column hints at the prediction target; the clay
 * cell with a check mark is the prediction TabPFN just filled in.
 */
const BannerTable = () => {
  const cols = 5;
  const rows = 6;
  const headers = ["x₁", "x₂", "x₃", "x₄", "y"];
  const hi: [number, number] = [4, 4];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 58px)`,
        gap: 5,
        padding: 18,
        background: COLORS.paper2,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 14,
        boxShadow: `0 20px 52px rgba(0,0,0,0.08)`,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const isHeader = r === 0;
        const isHighlight = r === hi[0] && c === hi[1];
        const isYCol = c === cols - 1;
        return (
          <div
            key={i}
            style={{
              height: 36,
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_MONO,
              fontSize: 12,
              fontWeight: isHeader ? 700 : 500,
              color: isHeader
                ? COLORS.graphite
                : isHighlight
                  ? COLORS.paper
                  : COLORS.ash,
              background: isHighlight
                ? COLORS.clay
                : isHeader
                  ? COLORS.paper3
                  : isYCol
                    ? COLORS.turquoise50
                    : COLORS.paper,
              border: `1px solid ${
                isHighlight ? COLORS.clay : COLORS.line
              }`,
              letterSpacing: isHeader ? "0.06em" : undefined,
            }}
          >
            {isHeader ? (
              headers[c]
            ) : isHighlight ? (
              <Check size={18} color={COLORS.paper} strokeWidth={3} />
            ) : (
              ""
            )}
          </div>
        );
      })}
    </div>
  );
};
