import { useCurrentFrame } from "remotion";
import { LandingChrome } from "../components/LandingChrome";
import { AnimatedIn } from "../components/AnimatedIn";
import { COLORS } from "../tokens";
import { FONT_VN_DISPLAY, FONT_MONO } from "../fonts";

/**
 * Scene 4 — Landing paths section
 * (mirror of src/components/landing/LandingPaths.tsx).
 *
 * "Ai học ở đây?" section with 4 profession cards (Học sinh/Sinh viên,
 * Nhân viên văn phòng, AI Engineer, AI Researcher). Each card has a
 * zero-padded index, title, description, and a bullet list of 3-4
 * outcomes. Staggered in with AnimatedIn.
 */
export const PathsScene = () => {
  const frame = useCurrentFrame();

  return (
    <LandingChrome>
      <div
        style={{
          padding: "56px 56px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <div>
          <AnimatedIn delay={2} offsetY={6} duration={14}>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: COLORS.ash,
              }}
            >
              (01) · Lộ trình học
            </span>
          </AnimatedIn>
          <AnimatedIn delay={6} offsetY={10} duration={16}>
            <h2
              style={{
                fontFamily: FONT_VN_DISPLAY,
                fontSize: 56,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 1.02,
                margin: "10px 0 0",
                color: COLORS.ink,
              }}
            >
              Ai học ở đây?{" "}
              <span
                style={{
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: COLORS.turquoiseInk,
                }}
              >
                Bốn loại người.
              </span>
            </h2>
          </AnimatedIn>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
            flex: 1,
          }}
        >
          {PATHS.map((p, i) => (
            <AnimatedIn key={p.slug} delay={16 + i * 5} offsetY={14} duration={18}>
              <PathCard path={p} />
            </AnimatedIn>
          ))}
        </div>
      </div>
    </LandingChrome>
  );
};

type Path = {
  index: string;
  title: string;
  slug: string;
  desc: string;
  bullets: string[];
  accent: string;
};

const PATHS: Path[] = [
  {
    index: "01",
    title: "Học sinh · Sinh viên",
    slug: "/paths/student",
    desc: "Học AI từ đầu qua trực quan, không cần giải tích nặng trước.",
    bullets: [
      "4 cấp độ · ~70h",
      "Bắt đầu: bias-variance, gradient descent",
      "Kết thúc: transformer, RAG",
    ],
    accent: COLORS.turquoise500,
  },
  {
    index: "02",
    title: "Nhân viên văn phòng",
    slug: "/paths/office",
    desc: "Dùng được AI trong công việc tuần sau — không code, không toán.",
    bullets: [
      "6 chương · ~20h",
      "Prompt, RAG, agents, phân tích dữ liệu",
      "Trực quan 100% · không đụng mã",
    ],
    accent: COLORS.peach500,
  },
  {
    index: "03",
    title: "AI Engineer",
    slug: "/paths/ai-engineer",
    desc: "Từ đọc paper tới build hệ thống — hiểu mọi khâu, không chỉ cách gọi API.",
    bullets: [
      "10 giai đoạn · ~110h",
      "Transformer → fine-tune → agents",
      "Evaluation, RAG, inference ops",
    ],
    accent: COLORS.turquoiseInk,
  },
  {
    index: "04",
    title: "AI Researcher",
    slug: "/paths/ai-researcher",
    desc: "Intuition sâu cho kiến trúc hiện đại — đủ để đọc paper và phản biện.",
    bullets: [
      "8 chương · ~78h",
      "Attention, MoE, reasoning models",
      "Constitutional AI, scaling laws",
    ],
    accent: COLORS.clay,
  },
];

const PathCard = ({ path }: { path: Path }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: 20,
      padding: 26,
      background: COLORS.white,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 14,
      height: "100%",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        fontFamily: FONT_VN_DISPLAY,
        fontSize: 46,
        fontWeight: 500,
        color: path.accent,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}
    >
      {path.index}
    </div>
    <div>
      <div
        style={{
          fontFamily: FONT_VN_DISPLAY,
          fontSize: 22,
          fontWeight: 500,
          color: COLORS.ink,
          letterSpacing: "-0.02em",
          marginBottom: 6,
        }}
      >
        {path.title}
      </div>
      <div
        style={{
          fontFamily: FONT_VN_DISPLAY,
          fontSize: 13,
          color: COLORS.graphite,
          lineHeight: 1.5,
          marginBottom: 10,
        }}
      >
        {path.desc}
      </div>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {path.bullets.map((b) => (
          <li
            key={b}
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: COLORS.ash,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                background: path.accent,
                borderRadius: "50%",
              }}
            />
            {b}
          </li>
        ))}
      </ul>
    </div>
  </div>
);
