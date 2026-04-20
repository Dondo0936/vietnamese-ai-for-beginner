import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["claude-opus-4-7-launch"]!;

export default function Opus47Article() {
  return (
    <ArticleShell meta={meta} heroViz={<ReasoningChainViz />}>
      <ArticleSection eyebrow="01 · Cái mới">
        <ArticleProse>
          <p>
            Anthropic vừa công bố Opus 4.7: context 500k token, SWE-bench
            71.2%, giá bằng Claude 3.5. Điểm đáng để ý không nằm ở benchmark
            chung, mà ở <b>cost per successful task</b> — giảm chừng 30% dù
            reasoning chain dài thêm 2.4 lần.
          </p>
          <p>
            Trước đây, model nghĩ nhiều đồng nghĩa với trả nhiều tiền. Với
            4.7, Anthropic nói hai thứ đó tách ra được — nhờ{" "}
            <Term slug="kv-cache">KV cache</Term> ở tầng thấp và một
            router prefix cho bước verify ở cuối chuỗi.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Benchmark"
        heading="SWE-bench 71.2% — nhưng nhìn cost trước khi ăn mừng"
      >
        <ArticleCompare
          before={{
            label: "Claude 4.6 · 4 tháng trước",
            value: "SWE-bench 66.1%",
            note: "Reasoning avg ~26 bước. $18 / 1M input token.",
          }}
          after={{
            label: "Claude Opus 4.7",
            value: "SWE-bench 71.2%",
            note: "Reasoning avg ~64 bước. $12.5 / 1M input token nhờ KV cache.",
          }}
        />
        <ArticleProse>
          <p>
            Benchmark công khai lớn nhất hiện nay là SWE-bench Verified —
            mỗi task là một pull-request thật trên repo Python. 71.2%
            nghĩa là Opus 4.7 vượt cả GPT-5 tune lẫn o3-mini-high. Cộng
            đồng vài tháng trước vẫn hỏi bao giờ tới 70%; giờ đã qua.
          </p>
          <p>
            Quan trọng hơn: tính theo <b>cost-per-successful-task</b>, 4.7
            rẻ hơn 4.6 một phần ba. Reasoning dài hơn nhưng hoá đơn không
            tăng, vì chừng 68% chain dùng lại KV cache của prompt gốc.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Vì sao reasoning dài hơn lại rẻ hơn"
        heading="KV cache cho chain + router verify đầu cuối"
      >
        <ChainCostCompareViz />
        <ArticleProse>
          <p>
            Ở 4.6, mỗi bước reasoning sinh một prefill pass mới — tức cả
            context bị tính lại từ đầu. Ở 4.7, Anthropic giữ KV cache của
            prompt gốc và chỉ decode thêm cho phần chain — giống cách{" "}
            <Term slug="kv-cache">KV cache</Term> chạy trong streaming,
            nhưng áp dụng cho{" "}
            <Term slug="reasoning-models">reasoning loop</Term>.
          </p>
          <p>
            Bước verify cuối chuỗi thì ngược lại: router bỏ qua 40% lời
            giải mà nó tin chắc đúng, không chạy verify đầy đủ. Không
            hoàn hảo — 2% bị loại oan — nhưng tính trên đại trà vẫn lời.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection eyebrow="04 · Ai hưởng lợi" heading="Ai nên đổi sớm — ai nên chờ">
        <ArticleProse>
          <p>
            <b>Đổi sớm nếu</b> bạn đang dùng Claude 4.6 cho code-review,
            ETL từ tài liệu, hoặc retrieval context dài. 500k token cộng
            giá rẻ hơn là lợi rõ.
          </p>
          <p>
            <b>Chờ nếu</b> pipeline của bạn có{" "}
            <Term slug="chain-of-thought">chain-of-thought</Term> prompt
            tự viết — 4.7 thích chain ngắn hơn, prompt kiểu &ldquo;think
            step by step 10 lần&rdquo; dễ phản tác dụng vì model tự suy
            luận dài thêm, tổng token tăng trùng lặp.
          </p>
          <p>
            Trước và sau khi đổi, bạn nên bật{" "}
            <Term slug="cost-latency-tokens">theo dõi cost per task</Term>{" "}
            — đó là cách duy nhất thấy được lợi thật.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* Hero viz — reasoning chain (64 nodes, key step emphasized) */
export function ReasoningChainViz() {
  const NODES = 16;
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Chain of thought visualization with 16 reasoning steps"
    >
      <defs>
        <linearGradient id="rc-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" fill="url(#rc-bg)" />

      <text
        x="40"
        y="50"
        fontFamily="var(--font-mono)"
        fontSize="12"
        fill="var(--turquoise-ink)"
        letterSpacing="0.1em"
      >
        / REASONING CHAIN · 64 BƯỚC · KV CACHE REUSED 68%
      </text>

      {Array.from({ length: NODES }).map((_, i) => {
        const x = 60 + i * 52;
        const y = 170 + Math.sin(i * 0.9) * 50;
        const emphasized = i === 9;
        const r = emphasized ? 18 : 9;
        return (
          <g key={i}>
            {i < NODES - 1 && (
              <line
                x1={x + r * 0.6}
                y1={y}
                x2={60 + (i + 1) * 52 - 9 * 0.6}
                y2={170 + Math.sin((i + 1) * 0.9) * 50}
                stroke="var(--turquoise-600)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                opacity={0.5}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={emphasized ? "var(--turquoise-500)" : "var(--turquoise-300)"}
              opacity={emphasized ? 1 : 0.55}
            />
            <text
              x={x}
              y={y + 32}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="9"
              fill="var(--turquoise-ink)"
              opacity={emphasized ? 1 : 0.55}
            >
              {LABELS[i]}
            </text>
          </g>
        );
      })}

      {/* Callout for the emphasized step */}
      <g transform="translate(360 60)">
        <rect
          width="240"
          height="44"
          rx="10"
          fill="var(--bg-card)"
          stroke="var(--turquoise-500)"
          strokeWidth="1.5"
        />
        <text
          x="16"
          y="18"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--turquoise-ink)"
          letterSpacing="0.1em"
        >
          ◆ BƯỚC 37 · MODEL TỰ NGHI NGỜ
        </text>
        <text
          x="16"
          y="34"
          fontFamily="var(--font-display)"
          fontSize="12"
          fill="var(--ink)"
        >
          &ldquo;Khoan, step 14 sai giả định&rdquo;
        </text>
      </g>

      <text
        x="40"
        y="300"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--text-tertiary)"
        letterSpacing="0.1em"
      >
        CLAUDE-OPUS-4.7 · 500K CTX · −30% COST / TASK
      </text>
    </svg>
  );
}

const LABELS = [
  "parse",
  "recall",
  "plan",
  "draft",
  "split",
  "check",
  "branch",
  "reason",
  "doubt",
  "revise",
  "merge",
  "verify",
  "prune",
  "polish",
  "ship",
  "done",
];

function ChainCostCompareViz() {
  return (
    <ArticleViz caption="Cost-per-task · Opus 4.6 so với 4.7 · 1k requests avg">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          padding: "4px 0",
        }}
      >
        {[
          { name: "Opus 4.6", bars: 26, cost: "$0.092", accent: "var(--graphite)" },
          { name: "Opus 4.7", bars: 64, cost: "$0.064", accent: "var(--turquoise-500)" },
        ].map((r) => (
          <div
            key={r.name}
            style={{
              padding: "18px 22px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {r.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  fontWeight: 500,
                  color: r.accent,
                  letterSpacing: "-0.02em",
                }}
              >
                {r.cost}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                height: 60,
              }}
            >
              {Array.from({ length: r.bars }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: r.accent,
                    opacity: 0.4 + (i % 5) * 0.1,
                    height: `${40 + ((i * 13) % 60)}%`,
                    borderRadius: 1,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {r.bars} bước reasoning avg
            </div>
          </div>
        ))}
      </div>
    </ArticleViz>
  );
}
