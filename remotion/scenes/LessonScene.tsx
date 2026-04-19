import { interpolate, useCurrentFrame } from "remotion";
import { ArrowLeft } from "lucide-react";
import { AppFrame } from "../components/AppFrame";
import { AnimatedIn } from "../components/AnimatedIn";
import { KnnCanvas } from "../components/KnnCanvas";
import { Cursor } from "../components/Cursor";
import { COLORS } from "../tokens";
import { FONT_VN_DISPLAY } from "../fonts";

/**
 * Scene 4 — A real lesson page with an interactive visualization.
 *
 * Mocks `/topics/knn` (visually representative of the k-NN topic in the
 * Student path): back link, position chip, H1 + VN subtitle, tag pills,
 * then LessonSection step 3 "Khám phá" with the SliderGroup primitive
 * wrapping a KnnCanvas. The cursor grabs the slider handle and drags
 * from k=1 → k=15, the KnnCanvas's decision boundary smoothing in
 * real-time. The MetricReadout below the slider echoes the value.
 */

const SLIDER_TRACK_X0 = 56; // within slider card
const SLIDER_TRACK_X1 = 440;
const K_MIN = 1;
const K_MAX = 21;

export const LessonScene = () => {
  const frame = useCurrentFrame();

  // k animates from 1 → 15 between frames 60 and 160
  const k = interpolate(frame, [60, 90, 130, 180], [1, 3, 9, 15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const kOdd = Math.max(1, Math.round(k) | 1);
  const sliderPct = (k - K_MIN) / (K_MAX - K_MIN);

  // Slider handle x position in scene coordinates
  const cardLeft = 640 - 480 / 2; // content max-w 480, centered
  const trackInnerLeft = cardLeft + 22; // inner padding ~22
  const trackInnerWidth = 480 - 44;
  const handleX = trackInnerLeft + trackInnerWidth * sliderPct;
  const handleY = 480; // approximate slider y in this layout

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
          <AnimatedIn delay={2} offsetY={6}>
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 12,
                color: COLORS.ash,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ArrowLeft size={14} color={COLORS.ash} strokeWidth={1.8} />
                Quay lại lộ trình Học sinh · Sinh viên
              </span>
              <span>Bài 1/57 — Giới thiệu</span>
            </div>
          </AnimatedIn>

          {/* Header */}
          <AnimatedIn delay={8} offsetY={10}>
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 40,
                fontWeight: 500,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                color: COLORS.ink,
                marginBottom: 6,
              }}
            >
              K-Nearest Neighbors
            </div>
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 18,
                color: COLORS.graphite,
                marginBottom: 14,
              }}
            >
              k láng giềng gần nhất (k-NN)
            </div>
          </AnimatedIn>

          {/* Tag pills */}
          <AnimatedIn delay={16} offsetY={6}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              <Pill bg="rgba(245,158,11,0.15)" color="#d97706">Trung bình</Pill>
              <Pill bg={COLORS.paper2} color={COLORS.graphite}>classic-ml</Pill>
              <Pill
                bg="transparent"
                color={COLORS.turquoise700}
                border={`1px solid ${COLORS.turquoise500}`}
              >
                Lộ trình: Học sinh · Sinh viên
              </Pill>
            </div>
          </AnimatedIn>

          {/* LessonSection Step 3 */}
          <AnimatedIn delay={26} offsetY={10}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
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
                3
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
                Khám phá
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                  fontSize: 11,
                  color: COLORS.ash,
                }}
              >
                3/8
              </div>
            </div>
          </AnimatedIn>

          {/* SliderGroup card */}
          <AnimatedIn delay={34} offsetY={14}>
            <div
              style={{
                background: "#FFFFFF",
                border: `1px solid ${COLORS.line}`,
                borderRadius: 14,
                padding: 22,
                boxShadow: "0 1px 2px rgba(10,10,11,0.04)",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_VN_DISPLAY,
                  fontSize: 15,
                  fontWeight: 600,
                  color: COLORS.ink,
                  marginBottom: 14,
                }}
              >
                Biên quyết định mượt ra sao khi thay đổi k?
              </div>

              {/* Viz pane */}
              <div
                style={{
                  background: COLORS.paper2,
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <KnnCanvas k={kOdd} width={400} height={320} />
              </div>

              {/* Slider */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_VN_DISPLAY,
                      fontSize: 14,
                      color: COLORS.ink,
                    }}
                  >
                    k (số hàng xóm hỏi ý kiến)
                  </span>
                  <span
                    style={{
                      fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                      fontSize: 14,
                      fontWeight: 600,
                      color: COLORS.turquoise700,
                    }}
                  >
                    {kOdd}
                  </span>
                </div>
                <SliderTrack pct={sliderPct} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                    fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                    fontSize: 11,
                    color: COLORS.ash,
                  }}
                >
                  <span>1</span>
                  <span>21</span>
                </div>

                {/* MetricReadout */}
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: `1px solid ${COLORS.line}`,
                    display: "flex",
                    gap: 24,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span
                      style={{
                        fontFamily: FONT_VN_DISPLAY,
                        fontSize: 12,
                        color: COLORS.ash,
                      }}
                    >
                      Láng giềng đang hỏi
                    </span>
                    <span
                      style={{
                        fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                        fontSize: 15,
                        fontWeight: 600,
                        color: COLORS.turquoise700,
                      }}
                    >
                      {kOdd}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span
                      style={{
                        fontFamily: FONT_VN_DISPLAY,
                        fontSize: 12,
                        color: COLORS.ash,
                      }}
                    >
                      Độ mượt biên
                    </span>
                    <span
                      style={{
                        fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                        fontSize: 15,
                        fontWeight: 600,
                        color: COLORS.turquoise700,
                      }}
                    >
                      {(sliderPct * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedIn>
        </div>

        {/* Cursor grabs handle and drags */}
        <Cursor
          hideBefore={4}
          keyframes={[
            { at: 34, x: 900, y: 120 },
            { at: 56, x: handleAt(0), y: 568 },
            { at: 60, x: handleAt(0), y: 568 },
            { at: 95, x: handleAt(0.1), y: 568 },
            { at: 130, x: handleAt(0.4), y: 568 },
            { at: 180, x: handleAt(0.7), y: 568 },
            { at: 210, x: handleAt(0.7), y: 568 },
          ]}
        />
      </div>
    </AppFrame>
  );
};

function handleAt(pct: number) {
  // Mirrors the slider math in the markup above. The card's inner width
  // is ~480-44 = 436, centered at x=640. So the track starts at
  // 640 - 218 = 422 and ends at 640 + 218 = 858 approximately.
  const trackLeft = 442;
  const trackWidth = 396;
  return trackLeft + trackWidth * pct;
}

const Pill = ({
  children,
  bg,
  color,
  border,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
  border?: string;
}) => (
  <span
    style={{
      fontFamily: FONT_VN_DISPLAY,
      fontSize: 12,
      fontWeight: 500,
      padding: "4px 10px",
      borderRadius: 999,
      background: bg,
      color,
      border: border ?? "none",
    }}
  >
    {children}
  </span>
);

const SliderTrack = ({ pct }: { pct: number }) => (
  <div style={{ position: "relative", height: 24 }}>
    <div
      style={{
        position: "absolute",
        top: 9,
        left: 0,
        right: 0,
        height: 6,
        borderRadius: 999,
        background: `linear-gradient(to right, ${COLORS.turquoise500} 0%, ${COLORS.turquoise500} ${pct * 100}%, ${COLORS.paper3} ${pct * 100}%, ${COLORS.paper3} 100%)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        top: 0,
        left: `calc(${pct * 100}% - 12px)`,
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: "#FFFFFF",
        border: `2px solid ${COLORS.turquoise600}`,
        boxShadow: "0 2px 6px rgba(32,184,176,0.35)",
      }}
    />
  </div>
);
