import { interpolate, useCurrentFrame } from "remotion";
import { GraduationCap, Briefcase, Code2, FlaskConical, ArrowUpRight } from "lucide-react";
import { AppFrame } from "../components/AppFrame";
import { AnimatedIn } from "../components/AnimatedIn";
import { Cursor } from "../components/Cursor";
import { COLORS } from "../tokens";
import { FONT_VN_DISPLAY } from "../fonts";

/**
 * Scene 2 — Profession paths grid.
 *
 * Mocks the `ProfessionPaths` home section: four cards in a 2×2 grid.
 * Cursor arrives from the top, settles on the Student card (row 1,
 * col 1). The card lifts (shadow + border) at frame ~70 and clicks at
 * frame ~110. The click sets up the cut to the Student path detail.
 */
type Path = {
  slug: string;
  viTitle: string;
  desc: string;
  Icon: typeof GraduationCap;
  readCount: number;
  total: number;
};

const PATHS: Path[] = [
  {
    slug: "student",
    viTitle: "Học sinh · Sinh viên",
    desc: "Nền tảng AI/ML từ con số 0 — toán, thuật toán cổ điển, mạng nơ-ron cơ bản",
    Icon: GraduationCap,
    readCount: 2,
    total: 57,
  },
  {
    slug: "office",
    viTitle: "Nhân viên văn phòng",
    desc: "Hiểu AI để ứng dụng trong công việc — prompt, RAG, agent và an toàn AI",
    Icon: Briefcase,
    readCount: 0,
    total: 28,
  },
  {
    slug: "ai-engineer",
    viTitle: "AI Engineer",
    desc: "Xây dựng & triển khai hệ thống AI — fine-tuning, RAG, serving, MLOps",
    Icon: Code2,
    readCount: 0,
    total: 46,
  },
  {
    slug: "ai-researcher",
    viTitle: "AI Researcher",
    desc: "Lý thuyết sâu & xu hướng mới — scaling laws, alignment, kiến trúc tiên tiến",
    Icon: FlaskConical,
    readCount: 0,
    total: 38,
  },
];

export const PathsScene = () => {
  const frame = useCurrentFrame();

  const hover = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const click = interpolate(frame, [110, 122], [1, 0.97], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const studentScale = 1 + 0.015 * hover;
  const studentShadow = hover
    ? `0 6px 18px rgba(10,10,11,${0.06 + 0.06 * hover}), 0 0 0 1px ${COLORS.turquoise500}`
    : "0 1px 2px rgba(10,10,11,0.04), 0 0 0 1px rgba(10,10,11,0.02)";

  return (
    <AppFrame>
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "40px 56px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: COLORS.paper,
        }}
      >
        <div style={{ width: "100%", maxWidth: 1100 }}>
          <AnimatedIn delay={2} offsetY={8}>
            <div
              style={{
                paddingBottom: 14,
                borderBottom: `1px solid ${COLORS.line}`,
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: COLORS.ash,
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Lộ trình
              </div>
              <div
                style={{
                  fontFamily: FONT_VN_DISPLAY,
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: "-0.015em",
                  color: COLORS.ink,
                }}
              >
                Chọn con đường phù hợp
              </div>
            </div>
          </AnimatedIn>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {PATHS.map((p, i) => {
              const isStudent = i === 0;
              return (
                <AnimatedIn key={p.slug} delay={14 + i * 7} offsetY={12}>
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid ${COLORS.line}`,
                      borderRadius: 16,
                      boxShadow: isStudent
                        ? studentShadow
                        : "0 1px 2px rgba(10,10,11,0.04), 0 0 0 1px rgba(10,10,11,0.02)",
                      padding: 22,
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                      transform: isStudent
                        ? `scale(${studentScale * click})`
                        : undefined,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: COLORS.paper2,
                        border: `1px solid ${COLORS.line}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <p.Icon size={20} color={COLORS.ink} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: FONT_VN_DISPLAY,
                          fontSize: 18,
                          fontWeight: 500,
                          letterSpacing: "-0.01em",
                          color: COLORS.ink,
                          marginBottom: 6,
                        }}
                      >
                        {p.viTitle}
                      </div>
                      <div
                        style={{
                          fontFamily: FONT_VN_DISPLAY,
                          fontSize: 13,
                          lineHeight: 1.55,
                          color: COLORS.graphite,
                          marginBottom: 14,
                        }}
                      >
                        {p.desc}
                      </div>
                      <div
                        style={{
                          fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                          fontSize: 11,
                          color: COLORS.ash,
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <span>{p.total} chủ đề</span>
                        {p.readCount > 0 && (
                          <>
                            <span>·</span>
                            <span>
                              {p.readCount}/{p.total} đã đọc ·{" "}
                              {Math.round((p.readCount / p.total) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowUpRight size={16} color={COLORS.ash} strokeWidth={1.8} />
                  </div>
                </AnimatedIn>
              );
            })}
          </div>
        </div>

        <Cursor
          hideBefore={4}
          keyframes={[
            { at: 10, x: 1060, y: 80 },
            { at: 60, x: 360, y: 255 },
            { at: 90, x: 320, y: 235 },
            { at: 110, x: 320, y: 235, click: true },
            { at: 140, x: 320, y: 235 },
          ]}
        />
      </div>
    </AppFrame>
  );
};
