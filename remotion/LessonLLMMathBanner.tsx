import { AbsoluteFill } from "remotion";
import { ArrowRight, Calculator, Terminal, X, Check } from "lucide-react";

import { COLORS, VN_TEXT_RENDER } from "./tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "./fonts";

/**
 * Static banner. LLM math weakness story card.
 *
 * 1280×720 still. Left: the headline claim (ChatGPT đoán token,
 * không tính số). Right: two stacked number cards showing the
 * divergence on the last digits between the LLM answer and the
 * calculator.
 */

export const LESSON_LLM_MATH_BANNER_DURATION = 1;

export const LessonLLMMathBannerComposition = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.paper, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 78% 22%, rgba(32, 184, 176, 0.13), transparent 55%)`,
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
          topics / llm-math
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          inset: "0 56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 48,
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
              marginBottom: 28,
            }}
          >
            LLM math · Vì sao hay sai
          </div>

          <h1
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 700,
              fontSize: 86,
              lineHeight: 1.0,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: "-0.035em",
              ...VN_TEXT_RENDER,
            }}
          >
            Nó đoán <span style={{ color: COLORS.clay }}>token</span>,
            <br />
            không tính số.
          </h1>

          <p
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontSize: 22,
              fontWeight: 500,
              color: COLORS.graphite,
              marginTop: 26,
              lineHeight: 1.38,
              maxWidth: 600,
              ...VN_TEXT_RENDER,
            }}
          >
            ChatGPT trả lời <span style={{ color: COLORS.turquoise700 }}>trôi chảy</span>,
            nhưng với phép tính dài, câu trả lời hợp lý chưa chắc đúng.
            Cách sửa: cho model dùng <span style={{ color: COLORS.turquoise700 }}>Python</span>.
          </p>

          <div
            style={{
              marginTop: 32,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 18px",
              background: COLORS.ink,
              borderRadius: 8,
              fontFamily: FONT_MONO,
              fontSize: 13,
              color: COLORS.paper,
              letterSpacing: "0.02em",
            }}
          >
            udemi.tech/articles/llm-math-weakness
            <ArrowRight size={16} color={COLORS.paper} strokeWidth={2.5} />
          </div>
        </div>

        {/* Right · divergent answers */}
        <div
          style={{
            flex: "0 0 430px",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: COLORS.ash,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              textAlign: "center",
              marginBottom: 2,
            }}
          >
            7583 × 2947 = ?
          </div>

          <AnswerRow
            icon="llm"
            label="ChatGPT"
            tone="clay"
            digits={["22,347,", "5", "01"]}
            highlightFrom={1}
            ok={false}
          />

          <AnswerRow
            icon="calc"
            label="Máy tính"
            tone="turquoise"
            digits={["22,347,", "3", "01"]}
            highlightFrom={1}
            ok={true}
          />

          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: COLORS.clay,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              textAlign: "center",
              marginTop: 2,
            }}
          >
            Lệch 200. Nhìn rất giống nhau.
          </div>
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

const AnswerRow = ({
  icon,
  label,
  tone,
  digits,
  highlightFrom,
  ok,
}: {
  icon: "llm" | "calc";
  label: string;
  tone: "clay" | "turquoise";
  digits: string[];
  highlightFrom: number;
  ok: boolean;
}) => {
  const accent = tone === "turquoise" ? COLORS.turquoise500 : COLORS.clay;
  const highlightBg = ok ? COLORS.turquoise50 : "#FBE9E3";
  return (
    <div
      style={{
        padding: "18px 20px",
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        boxShadow: `0 12px 32px rgba(0,0,0,0.06)`,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 8,
          background: highlightBg,
          border: `1px solid ${accent}`,
        }}
      >
        {icon === "llm" ? (
          <Terminal size={18} color={accent} strokeWidth={2.2} />
        ) : (
          <Calculator size={18} color={accent} strokeWidth={2.2} />
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: accent,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 700,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 34,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          {digits.map((d, i) => (
            <span
              key={i}
              style={{
                color: i >= highlightFrom ? accent : COLORS.ink,
                background: i >= highlightFrom ? highlightBg : "transparent",
                padding: i >= highlightFrom ? "0 3px" : 0,
                borderRadius: 4,
              }}
            >
              {d}
            </span>
          ))}
        </div>
      </div>
      {ok ? (
        <Check size={20} color={COLORS.turquoise600} strokeWidth={3} />
      ) : (
        <X size={20} color={COLORS.clay} strokeWidth={3} />
      )}
    </div>
  );
};
