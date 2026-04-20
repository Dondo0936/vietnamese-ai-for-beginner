import { LandingChrome } from "../components/LandingChrome";
import { AnimatedIn } from "../components/AnimatedIn";
import { COLORS, VN_TEXT_RENDER } from "../tokens";import { FONT_VN_DISPLAY, FONT_MONO } from "../fonts";

/**
 * Scene 7 — Landing testimonials
 * (mirror of src/components/landing/LandingQuotes.tsx).
 *
 * 4 testimonial cards in a 2×2 grid. Role + context stacked
 * (the data-layout="stack" invariant we pinned on the live landing).
 */
export const QuotesScene = () => {
  return (
    <LandingChrome background={COLORS.paper2}>
      <div
        style={{
          padding: "56px 56px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 24,
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
              (04) · người Việt đang học ở đây
            </span>
          </AnimatedIn>
          <AnimatedIn delay={6} offsetY={10} duration={16}>
            <h2
              style={{
                fontFamily: FONT_VN_DISPLAY,
                ...VN_TEXT_RENDER,                fontSize: 56,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 1.02,
                margin: "8px 0 0",
                color: COLORS.ink,
              }}
            >
              Ai dùng udemi?
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
          {QUOTES.map((q, i) => (
            <AnimatedIn
              key={q.role}
              delay={14 + i * 5}
              offsetY={12}
              duration={16}
            >
              <QuoteCard quote={q} />
            </AnimatedIn>
          ))}
        </div>
      </div>
    </LandingChrome>
  );
};

type Quote = {
  quote: string;
  role: string;
  context: string;
  path: string;
};

const QUOTES: Quote[] = [
  {
    quote:
      "Không ngờ attention lại dễ đến vậy. Ở trường toàn công thức khô khan.",
    role: "Minh",
    context: "Hà Nội",
    path: "student",
  },
  {
    quote:
      "Lộ trình Engineer giống một khóa học thật — nhưng miễn phí và tiếng Việt.",
    role: "Hiếu",
    context: "HCM",
    path: "ai-engineer",
  },
  {
    quote: "Đọc xong RAG mới hiểu team backend đang build gì.",
    role: "Trinh, Data analyst",
    context: "Ngân hàng",
    path: "office",
  },
  {
    quote: "Phần ẩn dụ phở và Grab làm mình cười, rồi nhớ luôn.",
    role: "Duy, Product Manager",
    context: "Công ty AI trong nước",
    path: "office",
  },
];

const QuoteCard = ({ quote }: { quote: Quote }) => (
  <div
    style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 12,
      padding: 28,
      height: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        fontFamily: FONT_VN_DISPLAY,
        ...VN_TEXT_RENDER,        fontSize: 52,
        lineHeight: 0.6,
        color: COLORS.turquoise500,
        marginBottom: 4,
      }}
    >
      &ldquo;
    </div>
    <blockquote
      style={{
        fontFamily: FONT_VN_DISPLAY,
        ...VN_TEXT_RENDER,        fontSize: 18,
        lineHeight: 1.35,
        fontWeight: 400,
        letterSpacing: "-0.01em",
        color: COLORS.ink,
        margin: 0,
        marginBottom: 22,
        flex: 1,
      }}
    >
      {quote.quote}
    </blockquote>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingTop: 14,
        borderTop: `1px solid ${COLORS.line}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <b
          style={{
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,            fontSize: 13,
            fontWeight: 500,
            color: COLORS.ink,
          }}
        >
          {quote.role}
        </b>
        <span
          style={{
            fontFamily: FONT_VN_DISPLAY,
            ...VN_TEXT_RENDER,            fontSize: 12,
            color: COLORS.ash,
          }}
        >
          {quote.context}
        </span>
      </div>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          color: COLORS.turquoise700,
          padding: "4px 10px",
          background: "rgba(32, 184, 176, 0.08)",
          borderRadius: 4,
        }}
      >
        {quote.path}
      </span>
    </div>
  </div>
);
