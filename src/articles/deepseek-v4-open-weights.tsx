import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["deepseek-v4-open-weights"]!;

export default function DeepSeekV4Article() {
  return (
    <ArticleShell meta={meta} heroViz={<MoERoutingViz />}>
      <ArticleSection eyebrow="01 · Cái mới">
        <ArticleProse>
          <p>
            DeepSeek vừa mở trọng số V4 — 236B tổng tham số, <b>37B
            active</b> qua <Term slug="moe">Mixture-of-Experts</Term>, 8
            expert và chọn 2 cho mỗi token. Apache 2.0, chạy được trên
            2× H100 80GB khi dùng INT4.
          </p>
          <p>
            Trong 72 giờ đầu, HuggingFace Hub có hơn 140 fine-tune được
            đẩy lên — mức lan nhanh nhất từ trước tới nay cho một
            open-weight model lớn. DeepSeek-V4 tạm thời giữ vị trí số 1
            OpenLLM leaderboard.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Bộ nhớ"
        heading="FP16 cần 3× H100. INT4 đủ 2× H100. Giá hạ tầng giảm một phần ba."
      >
        <ArticleCompare
          before={{
            label: "FP16 (trọng số gốc)",
            value: "472 GB",
            note: "Cần 3× H100 80GB · 18–24 đô/giờ tuỳ nhà cung cấp. Ngoài tầm của solo dev.",
          }}
          after={{
            label: "INT4 (qua GPTQ)",
            value: "118 GB",
            note: "Vừa khít 2× H100 · 12–16 đô/giờ. MMLU chỉ rơi 0.6 điểm.",
          }}
        />
        <ArticleProse>
          <p>
            <Term slug="quantization">Quantization</Term> INT4 không
            mới, nhưng V4 được thiết kế với quantization ngay từ đầu —
            attention projection và expert FFN đều khởi tạo theo scale.
            Kết quả: INT4 chỉ rơi 0.6 điểm MMLU, không phải 2–3 điểm như
            các model chưa quant-aware.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Benchmark"
        heading="Ngang GPT-4o trên MMLU + HumanEval · ngắn hơn trên MATH"
      >
        <BenchmarkTable />
        <ArticleProse>
          <p>
            DeepSeek-V4 đặc biệt mạnh ở code và reasoning ngắn. Trên
            MATH (kiểu AIME), nó thua cả Claude 4.6 lẫn GPT-5 tune —
            nhiều khả năng do thiếu RL post-training kiểu o-series. Dù
            vậy, trong nhóm open-weight, đây là model tốt nhất hiện có.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Ai nên quan tâm"
        heading="Mọi người làm production mà không muốn phụ thuộc một nhà cung cấp"
      >
        <ArticleProse>
          <p>
            Open weights cộng Apache 2.0 có nghĩa: bạn được tự host,
            fine-tune không giới hạn, và phân phối cả model đã fine-tune.
            Trước đây bạn phải chọn giữa chất lượng (GPT, Claude) và
            quyền sở hữu (Llama, Qwen). V4 xoá khoảng cách đó.
          </p>
          <p>
            Lưu ý: DeepSeek là lab Trung Quốc. Trọng số cụ thể của
            training data không công khai. Nếu compliance yêu cầu truy
            vết audit, V4 chưa đủ. Với các use case B2B thông thường
            (công cụ nội bộ, coding assistant, RAG), không thành vấn đề.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — MoE expert routing (8 experts, 2 active per token)
 * ────────────────────────────────────────────────────────────── */
export function MoERoutingViz() {
  const experts = [0, 1, 2, 3, 4, 5, 6, 7];
  const tokens = [
    { t: "tokenize", active: [2, 5] },
    { t: "this", active: [0, 3] },
    { t: "Vietnamese", active: [1, 6] },
    { t: "sentence", active: [2, 4] },
  ];
  const expertLabels = [
    "common",
    "code",
    "NLP",
    "math",
    "chat",
    "multilingual",
    "reasoning",
    "fallback",
  ];

  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="DeepSeek-V4 MoE expert routing — 8 experts, 2 active per token"
    >
      <defs>
        <linearGradient id="moe-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" fill="url(#moe-bg)" />

      <text
        x="40"
        y="40"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--turquoise-ink)"
        letterSpacing="0.1em"
      >
        / MoE ROUTING · 8 EXPERTS · 2 ACTIVE / TOKEN · 37B/236B PARAMS
      </text>

      {/* Tokens on left */}
      {tokens.map((tk, i) => {
        const y = 90 + i * 58;
        return (
          <g key={`tk-${i}`}>
            <rect
              x="36"
              y={y - 14}
              width="140"
              height="32"
              rx="6"
              fill="var(--bg-card)"
              stroke="var(--border)"
            />
            <text
              x="106"
              y={y + 6}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="12"
              fill="var(--ink)"
            >
              {tk.t}
            </text>
          </g>
        );
      })}

      {/* Experts on right */}
      {experts.map((e, i) => {
        const y = 78 + i * 28;
        return (
          <g key={`exp-${e}`}>
            <rect
              x="660"
              y={y}
              width="200"
              height="22"
              rx="6"
              fill="var(--bg-card)"
              stroke="var(--border)"
            />
            <text
              x="672"
              y={y + 14}
              fontFamily="var(--font-mono)"
              fontSize="11"
              fill="var(--turquoise-ink)"
            >
              expert-{e}
            </text>
            <text
              x="848"
              y={y + 14}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fill="var(--text-tertiary)"
            >
              {expertLabels[e]}
            </text>
          </g>
        );
      })}

      {/* Router label in middle */}
      <g>
        <rect x="320" y="150" width="240" height="30" rx="6" fill="var(--turquoise-500)" />
        <text
          x="440"
          y="170"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="var(--paper)"
          letterSpacing="0.1em"
        >
          ROUTER · TOP-2 / TOKEN
        </text>
      </g>

      {/* Connections: token → router → active experts */}
      {tokens.map((tk, i) => {
        const yToken = 90 + i * 58;
        return (
          <g key={`conn-${i}`}>
            {/* Token → router */}
            <line
              x1="176"
              y1={yToken}
              x2="320"
              y2={165}
              stroke="var(--text-tertiary)"
              strokeWidth="1"
              opacity="0.3"
            />
            {/* Router → active experts */}
            {tk.active.map((e) => {
              const yExpert = 78 + e * 28 + 11;
              return (
                <line
                  key={`line-${i}-${e}`}
                  x1="560"
                  y1={165}
                  x2="660"
                  y2={yExpert}
                  stroke="var(--turquoise-500)"
                  strokeWidth="1.4"
                  opacity="0.75"
                />
              );
            })}
          </g>
        );
      })}

      {/* Highlight active experts */}
      {tokens.flatMap((tk) => tk.active).map((e, idx) => {
        const y = 78 + e * 28;
        return (
          <rect
            key={`hl-${idx}-${e}`}
            x="660"
            y={y}
            width="200"
            height="22"
            rx="6"
            fill="none"
            stroke="var(--turquoise-500)"
            strokeWidth="1.8"
            opacity="0.5"
          />
        );
      })}

      <text
        x="40"
        y="320"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.08em"
      >
        MỖI TOKEN KÍCH HOẠT 2/8 EXPERT · 236B THAM SỐ, CHỈ 37B ACTIVE TẠI MỖI LƯỢT
      </text>
    </svg>
  );
}

function BenchmarkTable() {
  const rows: Array<{
    name: string;
    mmlu: string;
    humanEval: string;
    math: string;
    accent?: boolean;
    licence: string;
  }> = [
    { name: "DeepSeek-V4", mmlu: "86.3", humanEval: "89.7", math: "72.4", licence: "Apache 2.0", accent: true },
    { name: "GPT-4o", mmlu: "86.1", humanEval: "89.2", math: "84.5", licence: "closed" },
    { name: "Claude 4.6", mmlu: "88.7", humanEval: "91.4", math: "86.2", licence: "closed" },
    { name: "Llama-3.1-405B", mmlu: "83.8", humanEval: "81.5", math: "68.9", licence: "Llama comm." },
    { name: "Qwen-2.5-72B", mmlu: "85.0", humanEval: "86.6", math: "71.1", licence: "Apache 2.0" },
  ];

  return (
    <ArticleViz caption="Open-weight models in bold · closed models for reference · numbers Apr 2026">
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--font-display)",
          fontSize: 14,
        }}
      >
        <thead>
          <tr>
            {["Model", "MMLU", "HumanEval", "MATH", "Licence"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: h === "Model" || h === "Licence" ? "left" : "right",
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--border)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  fontWeight: 500,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.name}
              style={{
                background: r.accent ? "var(--turquoise-50)" : "transparent",
              }}
            >
              <td
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--border-subtle)",
                  color: r.accent ? "var(--turquoise-ink)" : "var(--text-primary)",
                  fontWeight: r.accent ? 600 : 500,
                }}
              >
                {r.name}
              </td>
              {[r.mmlu, r.humanEval, r.math].map((v, i) => (
                <td
                  key={i}
                  style={{
                    padding: "12px 14px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    borderBottom: "1px solid var(--border-subtle)",
                    color: r.accent ? "var(--turquoise-ink)" : "var(--text-secondary)",
                  }}
                >
                  {v}
                </td>
              ))}
              <td
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {r.licence}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ArticleViz>
  );
}
