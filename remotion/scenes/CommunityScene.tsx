import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LiquidBackground } from "../components/LiquidBackground";
import { GlassPanel } from "../components/GlassPanel";
import { AnimatedIn } from "../components/AnimatedIn";
import { FONT_DISPLAY, FONT_SANS, FONT_MONO } from "../fonts";
import { COLORS } from "../tokens";

// Mimics the app's dark-mode ink ramp from globals.css.
const DARK = {
  paper: "#0B0B0B",
  paper2: "#141414",
  paper3: "#1C1C1C",
  line: "#262624",
  ink: "#F2F1ED",
  ash: "#7B7972",
  graphite: "#B8B6AF",
};

export const CommunityScene = () => {
  const frame = useCurrentFrame();

  // Left panel: animated progress ring + read-count. Right panel: dark-mode
  // mock of a topic card. Third row: community stats.

  // Ring progresses 0 → 62% across the scene.
  const ringPct = interpolate(frame, [10, 70], [0, 62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const topicsReadCount = Math.floor(
    interpolate(frame, [10, 70], [0, 164], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

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
              Cá nhân hoá · Cộng đồng
            </div>
          </AnimatedIn>
          <AnimatedIn delay={6}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 42,
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: COLORS.ink,
                textAlign: "center",
                marginBottom: 26,
                lineHeight: 1.15,
              }}
            >
              Tiến độ của bạn — lưu lại từng bài
            </div>
          </AnimatedIn>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
              marginBottom: 18,
            }}
          >
            {/* Left: Progress / light mode */}
            <AnimatedIn delay={10} offsetY={14}>
              <GlassPanel padding={26} radius={18}>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: COLORS.ash,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 14,
                  }}
                >
                  Tiến độ của bạn · Light
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                  <ProgressRing
                    pct={ringPct}
                    size={116}
                    track={COLORS.paper3}
                    fill={COLORS.turquoise500}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 40,
                        fontWeight: 600,
                        color: COLORS.ink,
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                      }}
                    >
                      {topicsReadCount}
                      <span
                        style={{
                          fontSize: 20,
                          color: COLORS.ash,
                          fontWeight: 500,
                        }}
                      >
                        {" "}
                        / 264
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 15,
                        color: COLORS.graphite,
                        marginTop: 6,
                      }}
                    >
                      chủ đề đã đọc
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "rgba(32, 184, 176, 0.14)",
                        border: `1px solid ${COLORS.turquoise500}`,
                        color: COLORS.turquoise700,
                        fontFamily: FONT_MONO,
                        fontSize: 11,
                      }}
                    >
                      7 ngày liên tiếp 🔥
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </AnimatedIn>

            {/* Right: Dark-mode mock of the same card */}
            <AnimatedIn delay={18} offsetY={14}>
              <div
                style={{
                  background: DARK.paper2,
                  borderRadius: 18,
                  padding: 26,
                  border: `1px solid ${DARK.line}`,
                  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: DARK.ash,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 14,
                  }}
                >
                  Tiến độ của bạn · Dark
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                  <ProgressRing
                    pct={ringPct}
                    size={116}
                    track={DARK.paper3}
                    fill="#6FD6D0"
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 40,
                        fontWeight: 600,
                        color: DARK.ink,
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                      }}
                    >
                      {topicsReadCount}
                      <span
                        style={{
                          fontSize: 20,
                          color: DARK.ash,
                          fontWeight: 500,
                        }}
                      >
                        {" "}
                        / 264
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 15,
                        color: DARK.graphite,
                        marginTop: 6,
                      }}
                    >
                      chủ đề đã đọc
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "rgba(111, 214, 208, 0.12)",
                        border: `1px solid #6FD6D0`,
                        color: "#6FD6D0",
                        fontFamily: FONT_MONO,
                        fontSize: 11,
                      }}
                    >
                      Bookmark 12 bài
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedIn>
          </div>

          {/* Community strip */}
          <AnimatedIn delay={26}>
            <GlassPanel padding={22} radius={18}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 18,
                  alignItems: "center",
                }}
              >
                <Stat
                  label="Chi phí"
                  value="0đ"
                  hint="miễn phí mãi mãi"
                />
                <Stat
                  label="Ngôn ngữ"
                  value="Tiếng Việt"
                  hint="viết bởi người Việt"
                />
                <Stat
                  label="Mã nguồn mở"
                  value="Cộng đồng"
                  hint="ai cũng đóng góp được"
                />
              </div>
            </GlassPanel>
          </AnimatedIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Stat = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) => (
  <div style={{ textAlign: "center" }}>
    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 10,
        color: COLORS.ash,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 30,
        fontWeight: 600,
        color: COLORS.ink,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontFamily: FONT_SANS,
        fontSize: 13,
        color: COLORS.graphite,
        marginTop: 6,
      }}
    >
      {hint}
    </div>
  </div>
);

const ProgressRing = ({
  pct,
  size,
  track,
  fill,
}: {
  pct: number;
  size: number;
  track: string;
  fill: string;
}) => {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={track}
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={fill}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};
