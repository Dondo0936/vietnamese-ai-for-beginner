import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["mixture-of-depths"]!;

export default function MoDArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<DepthRouterViz />}>
      <ArticleSection eyebrow="01 · Ý tưởng">
        <ArticleProse>
          <p>
            Paper tuần này từ Google DeepMind đặt câu hỏi đơn giản: <b>vì
            sao mọi token đều phải đi qua toàn bộ layer của transformer?</b>{" "}
            Trong khi &ldquo;the&rdquo; rõ ràng không cần 32 layer attention
            như &ldquo;counterfactual&rdquo;.
          </p>
          <p>
            <b>Mixture-of-Depths</b> (MoD) thêm một router nhỏ trước mỗi
            layer: mỗi token tự chọn đi qua layer này hay bỏ qua. Thiết
            kế vẫn giữ nguyên kiến trúc{" "}
            <Term slug="transformer">transformer</Term>, chỉ thêm chừng
            0.1% tham số cho router — nhưng cắt được 50% FLOPs mà MMLU
            không đổi.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Router thế nào"
        heading="Mỗi token được chấm điểm độ khó, top-k đi đường sâu"
      >
        <ArticleProse>
          <p>
            Router chỉ là một linear layer nhỏ. Nó chấm điểm mỗi token,
            rồi chọn top-k đi qua{" "}
            <Term slug="attention-mechanism">attention + FFN</Term>; phần
            còn lại bỏ qua layer này và đi theo residual connection. Với
            k=0.3, 30% token đi đường sâu, 70% đi đường tắt.
          </p>
        </ArticleProse>
        <DepthScenarios />
        <ArticleProse>
          <p>
            Hay ở chỗ router học từ dữ liệu, không cần quy tắc do người
            đặt. Những token hay được cho đi sâu là: từ hiếm, tên riêng,
            boundary của câu, vị trí cần lập kế hoạch. Stopwords{" "}
            &ldquo;the, a, is&rdquo; gần như luôn bị bỏ qua.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Số liệu"
        heading="FLOPs −50%, MMLU giữ nguyên — nhưng có điều kiện"
      >
        <ArticleCompare
          before={{
            label: "Transformer baseline · 8B",
            value: "100% FLOPs",
            note: "MMLU 64.2 · HumanEval 51.8 · train 1.2e23 FLOPs.",
          }}
          after={{
            label: "MoD-8B · k=0.3",
            value: "50% FLOPs",
            note: "MMLU 64.0 · HumanEval 52.3 · train 6.1e22 FLOPs. Gần ngang.",
          }}
        />
        <ArticleProse>
          <p>
            Điều kiện: phải train từ đầu hoặc fine-tune sâu. Gắn router
            kiểu adapter nhẹ lên một model có sẵn không chạy được —
            router cần học phân bố token song song với phần còn lại của
            network.
          </p>
          <p>
            So với <Term slug="moe">Mixture-of-Experts</Term> (MoE), MoD
            khác ở chỗ: MoE thêm tham số (nhiều expert FFN), MoD không
            thêm tham số (chỉ router). Hai hướng độc lập — paper gợi ý
            có thể gộp lại, gọi là MoDE.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection eyebrow="04 · Có dùng ngay được không" heading="Chưa — nhưng là tín hiệu cho roadmap">
        <ArticleProse>
          <p>
            MoD mới dừng ở paper và một reference checkpoint 8B. Chưa ai
            mở rộng lên 70B. Inference engine (vLLM, SGLang) cũng chưa
            hỗ trợ nhánh bỏ layer của router. Thực tế <b>3–6 tháng
            nữa</b> mới có bản chạy được, nếu các lab lớn thấy đáng đầu
            tư.
          </p>
          <p>
            Tín hiệu rõ hơn là cho{" "}
            <Term slug="scaling-laws">scaling laws</Term>: compute có
            thể được chia động theo từng token. Đây là lần đầu có paper
            cho thấy compute động không đánh đổi với chất lượng.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — Depth router diagram (exported for card previews)
 * ────────────────────────────────────────────────────────────── */
export function DepthRouterViz() {
  const tokens = [
    { t: "the", deep: false },
    { t: "counter", deep: true },
    { t: "factual", deep: true },
    { t: "in", deep: false },
    { t: "a", deep: false },
    { t: "constitu", deep: true },
    { t: "tional", deep: true },
    { t: "setting", deep: true },
    { t: "is", deep: false },
    { t: "rare", deep: false },
  ];
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Mixture-of-Depths router diagram showing which tokens skip layers"
    >
      <defs>
        <linearGradient id="mod-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" fill="url(#mod-bg)" />

      <text
        x="40"
        y="40"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--turquoise-ink)"
        letterSpacing="0.1em"
      >
        / MIXTURE-OF-DEPTHS · k=0.3 · 60% TOKENS SKIP
      </text>

      {/* Tokens row */}
      {tokens.map((tk, i) => {
        const x = 60 + i * 80;
        return (
          <g key={i}>
            <rect
              x={x - 32}
              y={70}
              width="64"
              height="32"
              rx="6"
              fill="var(--bg-card)"
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={x}
              y={91}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="11"
              fill="var(--text-primary)"
            >
              {tk.t}
            </text>
          </g>
        );
      })}

      {/* Router bar */}
      <rect
        x={40}
        y={120}
        width={820}
        height={22}
        rx="4"
        fill="var(--turquoise-500)"
      />
      <text
        x="450"
        y="136"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--paper)"
        letterSpacing="0.1em"
      >
        ROUTER · CHẤM ĐIỂM ĐỘ KHÓ MỖI TOKEN
      </text>

      {/* Paths */}
      {tokens.map((tk, i) => {
        const x = 60 + i * 80;
        return (
          <g key={`path-${i}`}>
            {tk.deep ? (
              <>
                <line
                  x1={x}
                  y1={142}
                  x2={x}
                  y2={178}
                  stroke="var(--turquoise-600)"
                  strokeWidth={2}
                />
                <rect
                  x={x - 30}
                  y={178}
                  width="60"
                  height="80"
                  rx="6"
                  fill="var(--turquoise-100)"
                  stroke="var(--turquoise-500)"
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={205}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fill="var(--turquoise-ink)"
                >
                  attn
                </text>
                <text
                  x={x}
                  y={220}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fill="var(--turquoise-ink)"
                >
                  +
                </text>
                <text
                  x={x}
                  y={238}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fill="var(--turquoise-ink)"
                >
                  FFN
                </text>
                <line
                  x1={x}
                  y1={258}
                  x2={x}
                  y2={290}
                  stroke="var(--turquoise-600)"
                  strokeWidth={2}
                />
              </>
            ) : (
              <>
                <line
                  x1={x}
                  y1={142}
                  x2={x}
                  y2={290}
                  stroke="var(--text-tertiary)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                <text
                  x={x}
                  y={220}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fill="var(--text-tertiary)"
                >
                  skip
                </text>
              </>
            )}
            <circle
              cx={x}
              cy={296}
              r={4}
              fill={tk.deep ? "var(--turquoise-500)" : "var(--text-tertiary)"}
            />
          </g>
        );
      })}

      <line
        x1="40"
        y1="298"
        x2="860"
        y2="298"
        stroke="var(--border)"
        strokeWidth={1}
      />
      <text
        x="40"
        y="320"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.08em"
      >
        ■ TOKEN ĐI SÂU (attn + FFN) · · ·  — TOKEN SKIP (chỉ residual)
      </text>
    </svg>
  );
}

function DepthScenarios() {
  const scenarios = [
    { k: 0.1, label: "k=0.1", note: "Aggressive skip · FLOPs 18%, MMLU −1.4" },
    { k: 0.3, label: "k=0.3 (paper)", note: "Sweet spot · FLOPs 50%, MMLU −0.2" },
    { k: 0.6, label: "k=0.6", note: "Gần như baseline · FLOPs 85%, MMLU 0.0" },
  ];
  return (
    <ArticleViz caption="3 cấu hình k · k = tỉ lệ token đi đường sâu mỗi layer">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {scenarios.map((s) => (
          <div
            key={s.label}
            style={{
              padding: "18px 20px",
              background: s.k === 0.3 ? "var(--turquoise-50)" : "var(--bg-primary)",
              border: `1px solid ${s.k === 0.3 ? "var(--turquoise-500)" : "var(--border)"}`,
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                marginBottom: 14,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                display: "flex",
                gap: 3,
                marginBottom: 12,
                height: 28,
              }}
            >
              {Array.from({ length: 20 }).map((_, i) => {
                const isDeep = i < Math.round(20 * s.k);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: isDeep
                        ? s.k === 0.3
                          ? "var(--turquoise-500)"
                          : "var(--graphite)"
                        : "var(--border)",
                      borderRadius: 2,
                    }}
                  />
                );
              })}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {s.note}
            </div>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}
