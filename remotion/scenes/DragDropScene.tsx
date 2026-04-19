import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LiquidBackground } from "../components/LiquidBackground";
import { GlassPanel } from "../components/GlassPanel";
import { AnimatedIn } from "../components/AnimatedIn";
import { FONT_DISPLAY, FONT_SANS, FONT_MONO } from "../fonts";
import { COLORS } from "../tokens";

type BinId = "pool" | "safe" | "enterprise" | "never";

interface Item {
  id: number;
  label: string;
  home: Exclude<BinId, "pool">;
  /** Frame at which this chip snaps from pool → home bin. */
  dropAt: number;
}

const ITEMS: Item[] = [
  { id: 1, label: "Slide thuyết trình chung", home: "safe", dropAt: 30 },
  { id: 2, label: "Email nội bộ", home: "safe", dropAt: 46 },
  { id: 3, label: "Báo cáo tài chính quý", home: "enterprise", dropAt: 62 },
  { id: 4, label: "Hợp đồng khách hàng", home: "never", dropAt: 78 },
  { id: 5, label: "Số CCCD", home: "never", dropAt: 92 },
  { id: 6, label: "Mức lương nhân viên", home: "enterprise", dropAt: 106 },
];

const BINS: { id: Exclude<BinId, "pool">; label: string; tone: string }[] = [
  { id: "safe", label: "An toàn với AI công cộng", tone: COLORS.success },
  {
    id: "enterprise",
    label: "Chỉ dùng AI có cam kết bảo mật",
    tone: COLORS.turquoise600,
  },
  { id: "never", label: "Không bao giờ dán vào AI", tone: COLORS.danger },
];

export const DragDropScene = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <LiquidBackground />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 48,
        }}
      >
        <div style={{ width: 1140 }}>
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
              Bài: An toàn dữ liệu với AI
            </div>
          </AnimatedIn>
          <AnimatedIn delay={6}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 38,
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: COLORS.ink,
                textAlign: "center",
                marginBottom: 22,
                lineHeight: 1.15,
              }}
            >
              Kéo từng loại dữ liệu vào giỏ phù hợp
            </div>
          </AnimatedIn>

          {/* Pool of unsorted items */}
          <AnimatedIn delay={10}>
            <GlassPanel
              padding={18}
              radius={16}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                minHeight: 78,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  color: COLORS.ash,
                  width: "100%",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 4,
                }}
              >
                Giỏ chờ phân loại
              </div>
              {ITEMS.filter((it) => frame < it.dropAt).map((it) => (
                <Chip key={it.id} label={it.label} tone="neutral" />
              ))}
              {ITEMS.every((it) => frame >= it.dropAt) && (
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 14,
                    color: COLORS.ash,
                    fontStyle: "italic",
                  }}
                >
                  Hết! Bạn đã phân loại tất cả.
                </div>
              )}
            </GlassPanel>
          </AnimatedIn>

          {/* Three bins */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {BINS.map((bin, bi) => (
              <AnimatedIn key={bin.id} delay={14 + bi * 4} offsetY={12}>
                <GlassPanel
                  padding={18}
                  radius={16}
                  style={{
                    minHeight: 180,
                    border: `1.5px dashed ${bin.tone}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: 16,
                      fontWeight: 600,
                      color: bin.tone,
                      marginBottom: 12,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.2,
                    }}
                  >
                    {bin.label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {ITEMS.filter(
                      (it) => it.home === bin.id && frame >= it.dropAt
                    ).map((it) => {
                      const t = interpolate(
                        frame,
                        [it.dropAt, it.dropAt + 10],
                        [0, 1],
                        { extrapolateRight: "clamp" }
                      );
                      return (
                        <div
                          key={it.id}
                          style={{
                            opacity: t,
                            transform: `perspective(100px) scale(${0.9 + t * 0.1})`,
                          }}
                        >
                          <Chip label={it.label} tone={bin.id} />
                        </div>
                      );
                    })}
                  </div>
                </GlassPanel>
              </AnimatedIn>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Chip = ({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "safe" | "enterprise" | "never";
}) => {
  const palette = {
    neutral: { bg: COLORS.paper3, border: COLORS.line, fg: COLORS.graphite },
    safe: {
      bg: "rgba(61, 214, 140, 0.14)",
      border: COLORS.success,
      fg: "#1D9B5A",
    },
    enterprise: {
      bg: "rgba(32, 184, 176, 0.12)",
      border: COLORS.turquoise500,
      fg: COLORS.turquoise700,
    },
    never: {
      bg: "rgba(242, 92, 84, 0.14)",
      border: COLORS.danger,
      fg: "#B23129",
    },
  }[tone];

  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: 10,
        background: palette.bg,
        border: `1.5px solid ${palette.border}`,
        color: palette.fg,
        fontFamily: FONT_SANS,
        fontSize: 14,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};
