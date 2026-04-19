import { AbsoluteFill } from "remotion";
import { LiquidBackground } from "../components/LiquidBackground";
import { GlassPanel } from "../components/GlassPanel";
import { AnimatedIn } from "../components/AnimatedIn";
import { FONT_DISPLAY, FONT_SANS, FONT_MONO, FONT_VN_DISPLAY } from "../fonts";
import { COLORS } from "../tokens";

const PATHS = [
  {
    label: "Học sinh · Sinh viên",
    subtitle: "Toán nền tảng · ML cơ bản · Mạng nơ-ron",
    hours: "52 giờ",
    stages: 5,
  },
  {
    label: "Nhân viên văn phòng",
    subtitle: "Prompt · RAG · An toàn · Ứng dụng ngành",
    hours: "24 giờ",
    stages: 4,
  },
  {
    label: "Kỹ sư AI",
    subtitle: "Xây dựng ứng dụng AI · Chatbot · Trợ lý công việc",
    hours: "110 giờ",
    stages: 7,
  },
  {
    label: "Nghiên cứu AI",
    subtitle: "Hiểu sâu mô hình · Xu hướng mới · An toàn AI",
    hours: "92 giờ",
    stages: 6,
  },
];

export const PathsScene = () => {
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
        <div style={{ width: 1080 }}>
          <AnimatedIn delay={2}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: COLORS.turquoise600,
                marginBottom: 10,
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              Chọn lộ trình của bạn
            </div>
          </AnimatedIn>
          <AnimatedIn delay={8}>
            {/*
              Section title — Be Vietnam Pro + OpenType shaping disabled so
              "đường" ("ư" + "ờ" combined marks) renders byte-stable across
              frames. See fonts.ts.
            */}
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 54,
                fontWeight: 700,
                letterSpacing: "-0.015em",
                color: COLORS.ink,
                textAlign: "center",
                marginBottom: 40,
                textRendering: "geometricPrecision",
                fontKerning: "none",
                fontFeatureSettings: '"kern" off, "liga" off, "calt" off, "clig" off',
              }}
            >
              Bốn con đường, cùng một đích
            </div>
          </AnimatedIn>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            {PATHS.map((p, i) => (
              <AnimatedIn key={p.label} delay={14 + i * 7} offsetY={16}>
                <GlassPanel padding={24} radius={18}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 26,
                        fontWeight: 600,
                        color: COLORS.ink,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {p.label}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontFamily: FONT_MONO,
                        fontSize: 12,
                        color: COLORS.turquoise700,
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "rgba(32, 184, 176, 0.14)",
                          border: `1px solid ${COLORS.turquoise500}`,
                        }}
                      >
                        {p.hours}
                      </span>
                      <span style={{ color: COLORS.ash }}>
                        {p.stages} chặng
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: 16,
                      color: COLORS.graphite,
                      lineHeight: 1.45,
                    }}
                  >
                    {p.subtitle}
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
