import { interpolate, useCurrentFrame } from "remotion";
import { GraduationCap, ArrowLeft, ChevronRight, Check } from "lucide-react";
import { AppFrame } from "../components/AppFrame";
import { AnimatedIn } from "../components/AnimatedIn";
import { Cursor } from "../components/Cursor";
import { COLORS } from "../tokens";
import { FONT_VN_DISPLAY } from "../fonts";

/**
 * Scene 3 — Student path detail page.
 *
 * Mocks `/paths/student`: a back link, a header card with the path's
 * icon + title + description + progress bar, and the first stage
 * "Giới thiệu" with three lesson tiles. Cursor arrives, hovers the
 * first tile ("Machine Learning là gì?"), and clicks at frame ~130.
 */

type Stage = {
  title: string;
  read: number;
  total: number;
  tiles: { titleVi: string; title: string; diff: "beginner" | "intermediate"; read?: boolean }[];
  done?: boolean;
};

const STAGES: Stage[] = [
  {
    title: "Giới thiệu",
    read: 0,
    total: 3,
    tiles: [
      { titleVi: "Machine Learning là gì?", title: "What is Machine Learning?", diff: "beginner" },
      { titleVi: "Sẵn sàng toán", title: "Math Readiness", diff: "beginner" },
      { titleVi: "Dữ liệu và tập dữ liệu", title: "Data and Datasets", diff: "beginner" },
    ],
  },
  {
    title: "Nền tảng toán",
    read: 0,
    total: 4,
    tiles: [
      { titleVi: "Gradient là gì?", title: "Gradient Intuition", diff: "beginner" },
      { titleVi: "Đạo hàm và độ dốc", title: "Derivatives", diff: "intermediate" },
      { titleVi: "Vector và ma trận", title: "Vectors & Matrices", diff: "intermediate" },
    ],
  },
];

const DIFF_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  beginner: { bg: "rgba(34,197,94,0.15)", color: "#16a34a", label: "Cơ bản" },
  intermediate: { bg: "rgba(245,158,11,0.15)", color: "#d97706", label: "Trung bình" },
};

export const PathDetailScene = () => {
  const frame = useCurrentFrame();

  const tileHover = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tileClick = interpolate(frame, [130, 142], [1, 0.96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <AnimatedIn delay={2} offsetY={6}>
            <div
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 12,
                color: COLORS.ash,
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 14,
              }}
            >
              <ArrowLeft size={14} color={COLORS.ash} strokeWidth={1.8} />
              Trang chủ
            </div>
          </AnimatedIn>

          {/* Header card */}
          <AnimatedIn delay={6} offsetY={10}>
            <div
              style={{
                background: "rgba(255,255,255,0.6)",
                border: `1px solid ${COLORS.line}`,
                borderRadius: 16,
                padding: 22,
                marginBottom: 26,
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: "rgba(32,184,176,0.12)",
                    color: COLORS.turquoise700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <GraduationCap size={24} color={COLORS.turquoise700} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: FONT_VN_DISPLAY,
                      fontSize: 22,
                      fontWeight: 600,
                      color: COLORS.ink,
                      marginBottom: 6,
                    }}
                  >
                    Học sinh · Sinh viên
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_VN_DISPLAY,
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: COLORS.graphite,
                    }}
                  >
                    Nền tảng AI/ML từ con số 0 — toán, thuật toán cổ điển, mạng nơ-ron cơ bản
                  </div>
                </div>
              </div>
              {/* Progress */}
              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                    fontSize: 11,
                    color: COLORS.ash,
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span>0/57 chủ đề đã hoàn thành</span>
                  <span style={{ color: COLORS.turquoise700, fontWeight: 600 }}>0%</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: COLORS.paper2,
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "0%",
                      height: "100%",
                      background: COLORS.turquoise500,
                    }}
                  />
                </div>
              </div>
            </div>
          </AnimatedIn>

          {/* Timeline */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 19,
                top: 20,
                bottom: 20,
                width: 1,
                background: COLORS.line,
              }}
            />
            {STAGES.map((stage, si) => (
              <div key={stage.title} style={{ position: "relative", marginBottom: 22 }}>
                <AnimatedIn delay={14 + si * 8} offsetY={8}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: stage.done ? COLORS.turquoise500 : COLORS.paper2,
                        color: stage.done ? "#FFFFFF" : COLORS.graphite,
                        border: `1px solid ${COLORS.line}`,
                        fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {stage.done ? <Check size={18} /> : si + 1}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: FONT_VN_DISPLAY,
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLORS.ink,
                        }}
                      >
                        {stage.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                          fontSize: 11,
                          color: COLORS.ash,
                          marginTop: 2,
                        }}
                      >
                        {stage.read}/{stage.total} hoàn thành
                      </div>
                    </div>
                  </div>
                </AnimatedIn>
                <div
                  style={{
                    marginLeft: 19,
                    paddingLeft: 32,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {stage.tiles.map((t, ti) => {
                    const isFirst = si === 0 && ti === 0;
                    return (
                      <AnimatedIn key={t.titleVi} delay={24 + si * 8 + ti * 5} offsetY={6}>
                        <div
                          style={{
                            border: isFirst && tileHover
                              ? `1.5px solid ${COLORS.turquoise500}`
                              : `1px solid ${COLORS.line}`,
                            borderRadius: 12,
                            background: isFirst && tileHover
                              ? "rgba(32,184,176,0.06)"
                              : "#FFFFFF",
                            padding: "9px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            transform: isFirst
                              ? `scale(${(1 + 0.02 * tileHover) * (isFirst ? tileClick : 1)})`
                              : undefined,
                            boxShadow: isFirst && tileHover
                              ? `0 4px 12px rgba(32,184,176,${0.1 * tileHover})`
                              : "none",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontFamily: FONT_VN_DISPLAY,
                                fontSize: 12,
                                fontWeight: 500,
                                color: COLORS.ink,
                                lineHeight: 1.3,
                              }}
                            >
                              {t.titleVi}
                            </div>
                            <div
                              style={{
                                fontFamily: FONT_VN_DISPLAY,
                                fontSize: 11,
                                color: COLORS.ash,
                                marginTop: 2,
                              }}
                            >
                              {t.title}
                            </div>
                          </div>
                          <div
                            style={{
                              fontFamily: FONT_VN_DISPLAY,
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: DIFF_STYLE[t.diff].bg,
                              color: DIFF_STYLE[t.diff].color,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {DIFF_STYLE[t.diff].label}
                          </div>
                          {isFirst && tileHover > 0.4 && (
                            <ChevronRight size={12} color={COLORS.turquoise600} strokeWidth={2} />
                          )}
                        </div>
                      </AnimatedIn>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cursor path: enters top-right → hovers "Machine Learning là gì?" tile → click */}
        <Cursor
          hideBefore={4}
          keyframes={[
            { at: 14, x: 1060, y: 120 },
            { at: 80, x: 370, y: 430 },
            { at: 110, x: 360, y: 422 },
            { at: 130, x: 360, y: 422, click: true },
            { at: 160, x: 360, y: 422 },
          ]}
        />
      </div>
    </AppFrame>
  );
};
