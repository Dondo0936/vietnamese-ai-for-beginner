import { interpolate, useCurrentFrame } from "remotion";
import { RotateCcw } from "lucide-react";
import { AppFrame } from "../components/AppFrame";
import { AnimatedIn } from "../components/AnimatedIn";
import { Cursor } from "../components/Cursor";
import { COLORS } from "../tokens";
import { FONT_VN_DISPLAY } from "../fonts";

/**
 * Scene 5 — Test yourself with InlineChallenge.
 *
 * Faithfully mocks `<InlineChallenge>`: dashed accent border, stacked
 * option buttons (A/B/C), real retry flow. The cursor taps the wrong
 * answer (A) at frame ~60 → red-tinted error + "Thử lại" pill appears
 * → cursor hits retry at frame ~110 → cursor taps the correct answer
 * (B) at frame ~145 → green-tinted correct card with the explanation.
 */

// Narrative frame markers
const PICK_WRONG = 62;   // cursor clicks A
const RETRY_HIT = 108;   // cursor clicks "Thử lại"
const PICK_RIGHT = 145;  // cursor clicks B

type Phase = "idle" | "wrong" | "retry" | "right";

function phaseAt(frame: number): Phase {
  if (frame < PICK_WRONG) return "idle";
  if (frame < RETRY_HIT) return "wrong";
  if (frame < PICK_RIGHT) return "retry";
  return "right";
}

export const QuizScene = () => {
  const frame = useCurrentFrame();
  const phase = phaseAt(frame);

  // Fade opacity for each block of explanation
  const wrongOpacity = interpolate(frame, [PICK_WRONG, PICK_WRONG + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightOpacity = interpolate(frame, [PICK_RIGHT, PICK_RIGHT + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Options A/B/C
  const options = [
    { key: "A", label: "Sắc nét, nhấp nhô hơn" },
    { key: "B", label: "Mượt mà, ít nhấp nhô" },
    { key: "C", label: "Không thay đổi" },
  ];

  const styleFor = (key: string) => {
    if (phase === "idle") return { border: COLORS.line, bg: "#FFFFFF", text: COLORS.ink, opacity: 1 };
    if (phase === "wrong") {
      if (key === "A") return { border: "#f87171", bg: "rgba(254,226,226,1)", text: "#991b1b", opacity: 1 };
      return { border: COLORS.line, bg: "#FFFFFF", text: COLORS.ink, opacity: 0.45 };
    }
    if (phase === "retry") return { border: COLORS.line, bg: "#FFFFFF", text: COLORS.ink, opacity: 1 };
    // right
    if (key === "B") return { border: "#4ade80", bg: "rgba(220,252,231,1)", text: "#166534", opacity: 1 };
    return { border: COLORS.line, bg: "#FFFFFF", text: COLORS.ink, opacity: 0.45 };
  };

  return (
    <AppFrame showKbd={false}>
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: COLORS.paper,
          paddingLeft: 56,
          paddingRight: 56,
          paddingTop: 28,
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {/* Lesson position crumb */}
          <AnimatedIn delay={2} offsetY={6}>
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 12,
                color: COLORS.ash,
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 22,
              }}
            >
              <span>K-Nearest Neighbors · Bài 1/57</span>
              <span>Giới thiệu</span>
            </div>
          </AnimatedIn>

          {/* LessonSection Step 8 "Kiểm tra" */}
          <AnimatedIn delay={6} offsetY={8}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: COLORS.turquoise500,
                  color: "#FFFFFF",
                  fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                8
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: COLORS.turquoise700,
                  flex: 1,
                }}
              >
                Kiểm tra
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                  fontSize: 11,
                  color: COLORS.ash,
                }}
              >
                8/8
              </div>
            </div>
          </AnimatedIn>

          {/* InlineChallenge card */}
          <AnimatedIn delay={12} offsetY={12}>
            <div
              style={{
                border: `2px dashed rgba(32,184,176,0.45)`,
                background: "rgba(32,184,176,0.04)",
                borderRadius: 14,
                padding: 22,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_VN_DISPLAY,
                  fontSize: 15,
                  fontWeight: 500,
                  color: COLORS.ink,
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                Khi k tăng trong k-NN, biên quyết định sẽ như thế nào?
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {options.map((o) => {
                  const s = styleFor(o.key);
                  return (
                    <div
                      key={o.key}
                      style={{
                        padding: "11px 16px",
                        borderRadius: 12,
                        border: `1px solid ${s.border}`,
                        background: s.bg,
                        color: s.text,
                        fontFamily: FONT_VN_DISPLAY,
                        fontSize: 14,
                        opacity: s.opacity,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span style={{ color: COLORS.ash, width: 22 }}>{o.key}.</span>
                      <span>{o.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Wrong explanation */}
              {phase === "wrong" && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(254,226,226,0.7)",
                    color: "#991b1b",
                    fontFamily: FONT_VN_DISPLAY,
                    fontSize: 13,
                    lineHeight: 1.55,
                    opacity: wrongOpacity,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Chưa đúng. </span>
                  Với k=1, biên nhấp nhô vì mỗi điểm quyết định một ô riêng. k lớn
                  hơn nghĩa là hỏi nhiều hàng xóm hơn — biên sẽ ngược lại.
                </div>
              )}

              {/* Retry pill */}
              {(phase === "wrong" || phase === "retry") && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      borderRadius: 999,
                      background: COLORS.turquoise500,
                      color: "#FFFFFF",
                      fontFamily: FONT_VN_DISPLAY,
                      fontSize: 13,
                      fontWeight: 500,
                      boxShadow: "0 2px 6px rgba(32,184,176,0.35)",
                    }}
                  >
                    <RotateCcw size={13} color="#FFFFFF" strokeWidth={2} />
                    Thử lại
                  </div>
                </div>
              )}

              {/* Right explanation */}
              {phase === "right" && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(220,252,231,0.8)",
                    color: "#166534",
                    fontFamily: FONT_VN_DISPLAY,
                    fontSize: 13,
                    lineHeight: 1.55,
                    opacity: rightOpacity,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Chính xác! </span>k lớn hơn nghĩa
                  là tham khảo nhiều hàng xóm hơn — nên biên mượt mà hơn, chịu nhiễu
                  tốt hơn.
                </div>
              )}
            </div>
          </AnimatedIn>
        </div>

        {/* Cursor journey: idle → A (wrong) → Thử lại → B (correct) */}
        <Cursor
          hideBefore={4}
          keyframes={[
            { at: 12, x: 1060, y: 120 },
            { at: 52, x: 500, y: 345 },           // over option A
            { at: PICK_WRONG, x: 500, y: 345, click: true },
            { at: 95, x: 478, y: 550 },            // over "Thử lại" pill
            { at: RETRY_HIT, x: 478, y: 550, click: true },
            { at: 135, x: 500, y: 392 },           // over option B
            { at: PICK_RIGHT, x: 500, y: 392, click: true },
            { at: 180, x: 500, y: 392 },
          ]}
        />
      </div>
    </AppFrame>
  );
};
