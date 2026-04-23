import { AbsoluteFill } from "remotion";
import { ArrowRight } from "lucide-react";

import { COLORS, VN_TEXT_RENDER } from "./tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "./fonts";

/**
 * Static banner — Perceptron story card.
 *
 * 1280×720 still designed for a social share image / article OG card.
 * Renders one frame via `npx remotion still`. The paper background,
 * clay accent, and type scale match the lesson video so the two sit
 * together without visual dissonance.
 */

export const LESSON_PERCEPTRON_BANNER_DURATION = 1;

export const LessonPerceptronBannerComposition = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.paper, overflow: "hidden" }}>
      {/* soft radial accent */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 75% 25%, rgba(32, 184, 176, 0.12), transparent 55%)`,
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
          topics / perceptron
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
          gap: 60,
        }}
      >
        {/* Left · copy */}
        <div style={{ flex: 1, maxWidth: 680 }}>
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
            1958 · Mark I · Cornell
          </div>

          <h1
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 700,
              fontSize: 140,
              lineHeight: 0.95,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: "-0.035em",
              ...VN_TEXT_RENDER,
            }}
          >
            Perceptron
          </h1>

          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 26,
              fontWeight: 500,
              color: COLORS.graphite,
              marginTop: 26,
              lineHeight: 1.32,
              maxWidth: 620,
              ...VN_TEXT_RENDER,
            }}
          >
            Mạng nơ-ron đầu tiên{" "}
            <span style={{ color: COLORS.clay }}>không phải là code</span>
            {" "}— mà là một chiếc máy có photocell, điện trở xoay và motor.
          </p>

          <div
            style={{
              marginTop: 38,
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
            udemi.tech/topics/perceptron
            <ArrowRight size={16} color={COLORS.paper} strokeWidth={2.5} />
          </div>
        </div>

        {/* Right · diagram */}
        <div
          style={{
            flex: "0 0 420px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BannerDiagram />
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
 * Banner diagram — photocell grid → weighted sum node → 0/1 output.
 *
 * The shape inside the grid is a stylised "A" so the machine has
 * something to "see". Clay accent on lit cells matches the lesson
 * video palette.
 */
const BannerDiagram = () => {
  const cells = 6;
  const litShape: [number, number][] = [
    [2, 0],
    [3, 0],
    [1, 1],
    [4, 1],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
    [1, 3],
    [4, 3],
    [1, 4],
    [4, 4],
  ];
  const isLit = (x: number, y: number) =>
    litShape.some(([lx, ly]) => lx === x && ly === y);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      {/* Photocell grid */}
      <div
        style={{
          padding: 14,
          background: COLORS.paper2,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 14,
          display: "grid",
          gridTemplateColumns: `repeat(${cells}, 38px)`,
          gap: 6,
          boxShadow: `0 18px 48px rgba(0,0,0,0.08)`,
        }}
      >
        {Array.from({ length: cells * cells }).map((_, i) => {
          const x = i % cells;
          const y = Math.floor(i / cells);
          const lit = isLit(x, y);
          return (
            <div
              key={i}
              style={{
                width: 38,
                height: 38,
                borderRadius: 6,
                background: lit ? COLORS.peach500 : COLORS.paper3,
                border: `1px solid ${lit ? COLORS.clay : COLORS.line}`,
              }}
            />
          );
        })}
      </div>

      <ArrowRight size={22} color={COLORS.graphite} strokeWidth={2.25} />

      {/* Perceptron node + output */}
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: "50%",
            background: COLORS.turquoise50,
            border: `2.5px solid ${COLORS.turquoise500}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 10px 28px rgba(32, 184, 176, 0.22)`,
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: COLORS.turquoise700,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
            }}
          >
            Σ
          </span>
          <span
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 18,
              fontWeight: 600,
              color: COLORS.turquoiseInk,
              marginTop: 2,
              ...VN_TEXT_RENDER,
            }}
          >
            nơ-ron
          </span>
        </div>

        <ArrowRight size={18} color={COLORS.graphite} strokeWidth={2.25} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.turquoise600,
              padding: "4px 14px",
              border: `2px solid ${COLORS.turquoise500}`,
              borderRadius: 6,
              background: COLORS.paper,
              textAlign: "center",
            }}
          >
            1
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.ash,
              padding: "4px 14px",
              border: `2px dashed ${COLORS.line}`,
              borderRadius: 6,
              background: COLORS.paper,
              textAlign: "center",
            }}
          >
            0
          </span>
        </div>
      </div>
    </div>
  );
};
