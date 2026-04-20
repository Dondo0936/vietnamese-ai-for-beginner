import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["claude-design-launch"]!;

/**
 * Lead article (2026-04-20). Meta-story: this section of udemi.tech
 * was itself designed with Claude Design. Three bespoke viz blocks:
 *   - Hero: Handoff flow diagram (prompt → bundle → build)
 *   - Section 1: Bundle anatomy (annotated file tree)
 *   - Section 3: Variation picker (V1 / V2 / V3 with "chosen" badge)
 */
export default function ClaudeDesignArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<HandoffFlow />}>
      <ArticleSection eyebrow="01 · Ý tưởng">
        <ArticleProse>
          <p>
            Chuyển giao thiết kế giữa designer và engineer xưa nay vẫn
            là một trò đau đầu. Figma xuất PNG, designer viết spec,
            engineer mở bảng chú thích, đo padding bằng mắt. Mỗi bước
            rơi rớt một ít thông tin, mỗi cuộc họp lại thêm phần mơ hồ.
          </p>
          <p>
            <b>Claude Design</b> — Anthropic ra mắt đầu tuần này —
            chọn lối khác: <b>mockup không còn là hình, mà là mã thật</b>.
            Designer viết prompt tiếng Việt, công cụ dựng HTML/CSS, rồi
            đóng gói thành bundle để{" "}
            <Term slug="ai-coding-assistants">coding agent</Term> mở ra
            và dựng thẳng thành sản phẩm.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection eyebrow="02 · Bundle là gì" heading="Một file ZIP chứa đủ ngữ cảnh để agent tự dựng">
        <ArticleProse>
          <p>
            Khi designer chốt phương án, Claude Design xuất một bundle.
            Ba thứ quan trọng nằm bên trong: README dặn coding agent đọc
            gì trước, HTML/CSS nguyên bản của mockup, và{" "}
            <b>chat transcript đầy đủ</b> — nơi ý định của designer
            được ghi lại chi tiết hơn bất kỳ tài liệu spec nào.
          </p>
        </ArticleProse>
        <BundleAnatomy />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Figma vs Claude Design"
        heading="Handoff cũ là ảnh. Handoff mới là thực thi được."
      >
        <ArticleCompare
          before={{
            label: "Figma",
            value: "PNG + spec",
            note: "Engineer đọc pixel và bảng padding, rồi dịch lại thành code. Thông tin rơi rớt ở mỗi khâu.",
          }}
          after={{
            label: "Claude Design",
            value: "HTML + chat",
            note: "Agent đọc bundle trực tiếp. Không cần diễn giải. Ý định gốc nằm ngay trong transcript.",
          }}
        />
        <ArticleProse>
          <p>
            Điểm mấu chốt không phải là designer viết code — designer
            vẫn dùng prompt. Điểm mấu chốt là <b>đầu ra của designer
            trùng với đầu vào của agent</b>. Chuyển giao thủ công, ở
            nghĩa truyền thống, biến mất.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Thực tế · bài viết này"
        heading="3 phương án, 1 bundle, 1 lần ship"
      >
        <VariationPicker />
        <ArticleProse>
          <p>
            Section &ldquo;Bài viết&rdquo; mà bạn đang đọc — gồm lưới
            editorial có lead story, rail &ldquo;cùng tuần&rdquo;, và
            hàng 4 card — được thiết kế bằng Claude Design trong một
            buổi chiều. Designer yêu cầu 3 phương án (editorial ·
            digest · live feed), công cụ dựng cả ba ở độ chi tiết đủ
            để so sánh đánh đổi, rồi xuất bundle. Coding agent (Claude
            Code) dựng thành production trong vài giờ — bạn đang đọc
            bản đầu tiên nó ra.
          </p>
          <p>
            Đây không phải câu chuyện AI thay thế designer. Designer
            vẫn là người chọn V1 thay vì V2. Đây là câu chuyện về việc{" "}
            <b>khoảng cách giữa ý tưởng và code thu hẹp lại</b> khi cả
            hai cùng nói một ngôn ngữ mà máy đọc được.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection eyebrow="05 · Ai nên dùng" heading="Chỉ đáng dùng khi bạn đã làm việc cùng agent">
        <ArticleProse>
          <p>
            Claude Design hợp nhất khi đội của bạn đã dùng{" "}
            <Term slug="ai-coding-assistants">coding agent</Term> để
            dựng sản phẩm. Nếu pipeline của bạn vẫn là người đọc Figma
            rồi tự gõ, giá trị của nó nhỏ hơn nhiều — định dạng bundle
            tận dụng khả năng{" "}
            <Term slug="ai-coding-assistants">đọc file có cấu trúc</Term>{" "}
            và làm việc đồng thời trên nhiều file của agent.
          </p>
          <p>
            Ngược lại, nếu đội đã chạy theo hướng{" "}
            <Term slug="agentic-workflows">agentic</Term>, Claude
            Design khép mắt xích cuối: bản thiết kế cũng được viết
            bằng ngôn ngữ agent đọc được, không còn khâu trung gian chỉ
            dành cho người.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — the handoff flow (exported for card previews)
 * ────────────────────────────────────────────────────────────── */
export function HandoffFlow() {
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Sơ đồ luồng handoff: Designer prompt → Bundle → Coding agent build"
    >
      <defs>
        <linearGradient id="hf-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
        <marker
          id="hf-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--turquoise-500)" />
        </marker>
      </defs>
      <rect width="900" height="340" fill="url(#hf-bg)" />

      {/* Stage 1 — Designer prompt */}
      <g transform="translate(60 80)">
        <rect
          width="200"
          height="180"
          rx="14"
          fill="var(--bg-card)"
          stroke="var(--border)"
          strokeWidth="1.5"
        />
        <text
          x="100"
          y="38"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
          letterSpacing="1.4"
        >
          01 · DESIGNER
        </text>
        <text
          x="100"
          y="72"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="22"
          fontWeight="500"
          fill="var(--ink)"
          letterSpacing="-0.01em"
        >
          Prompt
        </text>
        <g transform="translate(22 98)">
          <rect width="156" height="58" rx="6" fill="var(--paper-2)" />
          <text
            x="12"
            y="22"
            fontFamily="var(--font-mono)"
            fontSize="11"
            fill="var(--text-secondary)"
          >
            &gt; làm section tin tức AI
          </text>
          <text
            x="12"
            y="38"
            fontFamily="var(--font-mono)"
            fontSize="11"
            fill="var(--text-secondary)"
          >
            &gt; 3 phương án, có viz
          </text>
          <text
            x="12"
            y="50"
            fontFamily="var(--font-mono)"
            fontSize="9"
            fill="var(--turquoise-500)"
          >
            _
          </text>
        </g>
      </g>

      {/* Arrow 1→2 */}
      <line
        x1="268"
        y1="170"
        x2="328"
        y2="170"
        stroke="var(--turquoise-500)"
        strokeWidth="2"
        markerEnd="url(#hf-arrow)"
      />

      {/* Stage 2 — Bundle */}
      <g transform="translate(340 50)">
        <rect
          width="220"
          height="240"
          rx="14"
          fill="var(--turquoise-50)"
          stroke="var(--turquoise-500)"
          strokeWidth="2"
        />
        <text
          x="110"
          y="38"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--turquoise-ink)"
          letterSpacing="1.4"
        >
          02 · CLAUDE DESIGN
        </text>
        <text
          x="110"
          y="72"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="22"
          fontWeight="500"
          fill="var(--turquoise-ink)"
          letterSpacing="-0.01em"
        >
          Bundle .zip
        </text>
        <g transform="translate(24 96)" fontFamily="var(--font-mono)" fontSize="11" fill="var(--turquoise-ink)">
          <text y="0">📁 udemi-tech/</text>
          <text y="20" x="10">├── README.md</text>
          <text y="40" x="10">├── chats/</text>
          <text y="58" x="24">└── chat1.md</text>
          <text y="78" x="10">└── project/</text>
          <text y="96" x="24">├── Articles.html</text>
          <text y="114" x="24">├── articles.css</text>
          <text y="132" x="24">└── components/</text>
        </g>
      </g>

      {/* Arrow 2→3 */}
      <line
        x1="568"
        y1="170"
        x2="628"
        y2="170"
        stroke="var(--turquoise-500)"
        strokeWidth="2"
        markerEnd="url(#hf-arrow)"
      />

      {/* Stage 3 — Coding agent */}
      <g transform="translate(640 80)">
        <rect
          width="200"
          height="180"
          rx="14"
          fill="var(--ink)"
          stroke="var(--ink)"
          strokeWidth="1.5"
        />
        <text
          x="100"
          y="38"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--turquoise-300)"
          letterSpacing="1.4"
        >
          03 · CODING AGENT
        </text>
        <text
          x="100"
          y="72"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="22"
          fontWeight="500"
          fill="var(--paper)"
          letterSpacing="-0.01em"
        >
          Build
        </text>
        <g transform="translate(22 98)">
          <rect width="156" height="58" rx="6" fill="rgba(255,255,255,0.06)" />
          <text
            x="12"
            y="22"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--turquoise-300)"
          >
            ✓ component scaffold
          </text>
          <text
            x="12"
            y="38"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--turquoise-300)"
          >
            ✓ tokens mapped
          </text>
          <text
            x="12"
            y="54"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--paper)"
            opacity="0.6"
          >
            · tests passing
          </text>
        </g>
      </g>

      {/* Bottom label */}
      <text
        x="450"
        y="320"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--text-tertiary)"
        letterSpacing="0.08em"
      >
        INTENT ĐƯỢC LƯU TRONG TRANSCRIPT · KHÔNG DỊCH LẠI Ở BẤT KỲ KHÂU NÀO
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 2 viz — Bundle anatomy (annotated file tree)
 * ────────────────────────────────────────────────────────────── */
function BundleAnatomy() {
  const rows: Array<{
    indent: number;
    label: string;
    annotation?: string;
    highlight?: "readme" | "chat" | "html";
  }> = [
    { indent: 0, label: "📁 udemi-tech/" },
    { indent: 1, label: "├── README.md", annotation: "agent đọc trước · dặn luật handoff", highlight: "readme" },
    { indent: 1, label: "├── chats/" },
    { indent: 2, label: "│   └── chat1.md", annotation: "transcript đầy đủ · intent gốc", highlight: "chat" },
    { indent: 1, label: "└── project/" },
    { indent: 2, label: "    ├── Articles Section.html", annotation: "3 phương án · render real", highlight: "html" },
    { indent: 2, label: "    ├── articles.css" },
    { indent: 2, label: "    ├── Landing Page.html" },
    { indent: 2, label: "    └── components/" },
    { indent: 3, label: "        ├── Articles.jsx" },
    { indent: 3, label: "        └── Landing.jsx" },
  ];

  return (
    <ArticleViz caption="Một bundle chuẩn · ba thứ quan trọng được tô màu">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <pre
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            lineHeight: 1.85,
            margin: 0,
            color: "var(--text-primary)",
            background: "var(--bg-primary)",
            padding: 20,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            overflow: "auto",
          }}
        >
          {rows.map((r) => (
            <span
              key={r.label}
              style={{
                display: "block",
                color: r.highlight
                  ? "var(--turquoise-ink)"
                  : "var(--text-secondary)",
                fontWeight: r.highlight ? 600 : 400,
              }}
            >
              {r.label}
            </span>
          ))}
        </pre>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {rows
            .filter((r) => r.annotation)
            .map((r, i) => (
              <div
                key={r.label}
                style={{
                  padding: "12px 16px",
                  background: "var(--turquoise-50)",
                  border: "1px solid var(--turquoise-100)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--turquoise-ink)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {String(i + 1).padStart(2, "0")} ·{" "}
                  {r.label.trim().replace(/^[│├└─\s]+/, "")}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 14,
                    color: "var(--text-primary)",
                    lineHeight: 1.5,
                  }}
                >
                  {r.annotation}
                </div>
              </div>
            ))}
        </div>
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 4 viz — Variation picker (V1 / V2 / V3)
 * ────────────────────────────────────────────────────────────── */
function VariationPicker() {
  const variants = [
    {
      id: "V1",
      label: "Editorial",
      note: "Lead story + rail + 4 cards. Như NYT.",
      chosen: true,
    },
    {
      id: "V2",
      label: "Weekly digest",
      note: 'Format "Số #16" · 5 tin đánh số + agenda tuần tới.',
    },
    {
      id: "V3",
      label: "Live feed",
      note: "Chronological stream · LIVE indicator · dense.",
    },
  ];
  return (
    <ArticleViz caption="3 phương án tool dựng · designer chọn V1 · bundle chỉ export variant được chọn">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {variants.map((v) => (
          <div
            key={v.id}
            style={{
              padding: "22px 20px",
              background: v.chosen ? "var(--turquoise-50)" : "var(--bg-primary)",
              border: `1px solid ${
                v.chosen ? "var(--turquoise-500)" : "var(--border)"
              }`,
              borderRadius: "var(--radius-md)",
              position: "relative",
            }}
          >
            {v.chosen && (
              <span
                style={{
                  position: "absolute",
                  top: -10,
                  left: 20,
                  padding: "2px 10px",
                  background: "var(--turquoise-500)",
                  color: "var(--paper)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  borderRadius: "var(--radius-full)",
                  fontWeight: 600,
                }}
              >
                ◆ đã chọn
              </span>
            )}
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 38,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: v.chosen ? "var(--turquoise-ink)" : "var(--ink)",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {v.id}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              {v.label}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.55,
              }}
            >
              {v.note}
            </div>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}
