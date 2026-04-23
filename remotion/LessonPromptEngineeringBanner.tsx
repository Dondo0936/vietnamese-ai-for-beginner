import { AbsoluteFill } from "remotion";
import { ArrowRight, Check, X } from "lucide-react";

import { COLORS, VN_TEXT_RENDER } from "./tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "./fonts";

/**
 * Static banner — Prompt engineering story card.
 *
 * 1280×720 still for the prompt-engineering video thumbnail and
 * social share. Left: the headline claim. Right: two stacked
 * prompt cards (rules-only vs 3-shot) with red × / green ✓ chips,
 * so the idea reads in three seconds.
 */

export const LESSON_PROMPT_ENGINEERING_BANNER_DURATION = 1;

export const LessonPromptEngineeringBannerComposition = () => {
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
          topics / prompt-engineering
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
        <div style={{ flex: 1, maxWidth: 660 }}>
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
            Prompt engineering · 1 mẹo
          </div>

          <h1
            style={{
              fontFamily: FONT_VN_DISPLAY,
              fontWeight: 700,
              fontSize: 104,
              lineHeight: 0.98,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: "-0.035em",
              ...VN_TEXT_RENDER,
            }}
          >
            Show,
            <br />
            don&rsquo;t <span style={{ color: COLORS.clay }}>tell.</span>
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
            <span style={{ color: COLORS.turquoise700 }}>Ba ví dụ</span> trong
            prompt đánh bại ba đoạn văn mô tả. Model học từ pattern nhanh hơn
            từ quy tắc.
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
            udemi.tech/topics/prompt-engineering
            <ArrowRight size={16} color={COLORS.paper} strokeWidth={2.5} />
          </div>
        </div>

        {/* Right · compare stack */}
        <div
          style={{
            flex: "0 0 460px",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 18,
          }}
        >
          <MiniPromptCard
            tone="clay"
            title="Quy tắc dài dòng"
            body="Phân loại cảm xúc câu sau: tích cực, tiêu cực, hoặc trung lập. Trả về đúng format…"
            ok={false}
            output="Label: positive"
          />

          <MiniPromptCard
            tone="turquoise"
            title="3 ví dụ"
            body={[
              "Phim này dở quá → tiêu cực",
              "Đồ ăn ngon → tích cực",
              "Trời hôm nay mưa → trung lập",
            ]}
            ok={true}
            output="tiêu cực"
          />
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

const MiniPromptCard = ({
  tone,
  title,
  body,
  ok,
  output,
}: {
  tone: "clay" | "turquoise";
  title: string;
  body: string | string[];
  ok: boolean;
  output: string;
}) => {
  const accent = tone === "turquoise" ? COLORS.turquoise500 : COLORS.clay;
  const outputBg = ok ? COLORS.turquoise50 : "#FBE9E3";
  const outputColor = ok ? COLORS.turquoise700 : COLORS.clay;

  return (
    <div
      style={{
        padding: "16px 20px",
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        boxShadow: `0 12px 32px rgba(0,0,0,0.06)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginBottom: 10,
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      {Array.isArray(body) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {body.map((l, i) => (
            <div
              key={i}
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 13,
                color: COLORS.graphite,
                lineHeight: 1.45,
                ...VN_TEXT_RENDER,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      ) : (
        <p
          style={{
            fontFamily: FONT_VN_DISPLAY,
            fontSize: 13,
            color: COLORS.graphite,
            lineHeight: 1.5,
            margin: 0,
            ...VN_TEXT_RENDER,
          }}
        >
          {body}
        </p>
      )}

      <div
        style={{
          marginTop: 12,
          padding: "8px 12px",
          background: outputBg,
          border: `1.5px solid ${accent}`,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: FONT_VN_DISPLAY,
          fontSize: 16,
          color: outputColor,
          fontWeight: 700,
          ...VN_TEXT_RENDER,
        }}
      >
        <span>{output}</span>
        {ok ? (
          <Check size={16} color={COLORS.turquoise600} strokeWidth={3} />
        ) : (
          <X size={16} color={COLORS.clay} strokeWidth={3} />
        )}
      </div>
    </div>
  );
};
