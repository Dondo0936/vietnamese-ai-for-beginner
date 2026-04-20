import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["phogpt-7b-reasoning"]!;

export default function PhoGPTArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<VMLUBarsViz />}>
      <ArticleSection eyebrow="01 · Cái mới">
        <ArticleProse>
          <p>
            VinAI Research vừa ra PhoGPT-7B Reasoning — model đầu tiên
            được train để suy luận bằng tiếng Việt, không phải dịch
            tiếng Anh ra. Nền tảng là Llama-3.1-8B, fine-tune trên 40B
            token tiếng Việt có giải thích (đề + lời giải, theo chương
            trình phổ thông + đại học).
          </p>
          <p>
            Điểm VMLU đạt 68% — ngang GPT-4o trên một số môn, vượt ở
            Văn và Sử. Quan trọng hơn con số: đây là model đầu tiên
            không &ldquo;nói tiếng Việt giọng Tây&rdquo;, tức không ép
            cú pháp tiếng Anh lên câu tiếng Việt khi trả lời dài.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Benchmark"
        heading="VMLU theo môn — nơi tiếng Việt khó hơn"
      >
        <VMLUDetailTable />
        <ArticleProse>
          <p>
            Thế mạnh: Văn, Sử, Địa lý Việt Nam — các môn cần hiểu ngữ
            cảnh văn hoá và thành ngữ. Điểm yếu: Toán chuyên, Vật lý —
            nơi Claude và GPT-4o vẫn vượt nhờ khối reasoning dài.
          </p>
          <p>
            Điều ít ai chú ý: với{" "}
            <Term slug="tokenization">tokenization</Term> tiếng Việt
            tốt hơn (BPE học trên corpus tiếng Việt), PhoGPT tốn ít
            token hơn 40% cho cùng một câu so với GPT-4o. Tức chạy
            local trên 1× A100 không còn là điều xa xỉ.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Cách dùng"
        heading="Chạy local, tune tiếp, hay gọi API — chọn theo use case"
      >
        <ArticleCompare
          before={{
            label: "Dùng GPT-4o cho tiếng Việt",
            value: "~3× token",
            note: "1 câu tiếng Việt vào GPT thường tốn 1.5–3× token so với tiếng Anh cùng nghĩa. Hoá đơn tăng theo.",
          }}
          after={{
            label: "Dùng PhoGPT-7B",
            value: "gần 1× token",
            note: "Tokenizer học trên tiếng Việt. Cùng câu chỉ tốn một phần ba token. Chạy local trên 1× A100 với INT8.",
          }}
        />
        <ArticleProse>
          <p>
            VinAI publish trọng số Apache 2.0, kèm tokenizer và một bộ
            eval mở. Dev có thể{" "}
            <Term slug="fine-tuning-vs-prompting">fine-tune</Term> tiếp
            cho lĩnh vực riêng (luật, y, giáo dục) với ~400 ví dụ có
            giải thích.
          </p>
          <p>
            Cảnh báo một lần: reasoning chain của PhoGPT ngắn hơn
            o-series. Các task cần{" "}
            <Term slug="chain-of-thought">chain-of-thought</Term> dài
            (giải hệ, chứng minh) PhoGPT thua. Nhưng task thực tế của
            đa số doanh nghiệp — trả lời chính sách, tóm tắt hợp đồng,
            giải thích quy trình — PhoGPT đủ và rẻ.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection eyebrow="04 · Ai nên dùng" heading="Doanh nghiệp Việt cần hiểu tiếng Việt">
        <ArticleProse>
          <p>
            Trường học đang xây trợ giảng AI tiếng Việt, ngân hàng cần
            phân loại khiếu nại, y tế cần tóm tắt bệnh án, báo chí cần
            kiểm tra thông tin — những use case này đều có ngưỡng chấp
            nhận được với 7B. Không cần gọi GPT-4o nữa, không còn khoá
            data tại Mỹ.
          </p>
          <p>
            Với cộng đồng Việt, đây là lần đầu có một mô hình đáng gọi
            là &ldquo;của mình&rdquo; mà vẫn chạy được trên RTX 4090.
            VinAI cho tải về{" "}
            <a
              href="https://huggingface.co/vinai/phogpt-7b-reasoning"
              target="_blank"
              rel="noopener noreferrer"
            >
              huggingface.co/vinai/phogpt-7b-reasoning
            </a>
            .
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — VMLU bar chart (PhoGPT highlighted)
 * ────────────────────────────────────────────────────────────── */
export function VMLUBarsViz() {
  const models = [
    { name: "PhoGPT-7B", score: 68, phogpt: true },
    { name: "GPT-4o", score: 72, phogpt: false },
    { name: "Claude 4.6", score: 74, phogpt: false },
    { name: "Qwen-2.5-72B", score: 64, phogpt: false },
    { name: "Llama-3.1-8B", score: 46, phogpt: false },
    { name: "Sealion-7B", score: 58, phogpt: false },
  ];
  const maxH = 180;
  const maxScore = 80;

  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="VMLU benchmark scores across models with PhoGPT-7B highlighted"
    >
      <defs>
        <linearGradient id="vm-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" fill="url(#vm-bg)" />

      <text
        x="40"
        y="40"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--turquoise-ink)"
        letterSpacing="0.1em"
      >
        / VMLU · ĐIỂM TRUNG BÌNH 58 MÔN · 04/2026
      </text>

      {/* Grid lines */}
      {[20, 40, 60, 80].map((g) => {
        const y = 260 - (g / maxScore) * maxH;
        return (
          <g key={g}>
            <line x1="60" y1={y} x2="880" y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
            <text x="50" y={y + 4} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-tertiary)">
              {g}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {models.map((m, i) => {
        const barW = 100;
        const gap = 30;
        const x = 90 + i * (barW + gap);
        const h = (m.score / maxScore) * maxH;
        const y = 260 - h;
        const fill = m.phogpt ? "var(--turquoise-500)" : "var(--graphite)";
        const opacity = m.phogpt ? 1 : 0.5;
        return (
          <g key={m.name}>
            <rect x={x} y={y} width={barW} height={h} rx="4" fill={fill} opacity={opacity} />
            {m.phogpt && (
              <rect x={x - 4} y={y - 4} width={barW + 8} height={h + 4} rx="6" fill="none" stroke="var(--turquoise-500)" strokeWidth="2" />
            )}
            <text
              x={x + barW / 2}
              y={y - 10}
              textAnchor="middle"
              fontFamily="var(--font-display)"
              fontSize={m.phogpt ? "18" : "14"}
              fontWeight="500"
              fill={m.phogpt ? "var(--turquoise-ink)" : "var(--text-primary)"}
              letterSpacing="-0.02em"
            >
              {m.score}
            </text>
            <text
              x={x + barW / 2}
              y="280"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fill={m.phogpt ? "var(--turquoise-ink)" : "var(--text-secondary)"}
              letterSpacing="0.06em"
              fontWeight={m.phogpt ? 600 : 400}
            >
              {m.name}
            </text>
          </g>
        );
      })}

      {/* Baseline */}
      <line x1="60" y1="260" x2="880" y2="260" stroke="var(--ink)" strokeWidth="1.5" />

      <text x="40" y="320" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-tertiary)" letterSpacing="0.08em">
        ◆ PHOGPT-7B · OPEN WEIGHTS · CHẠY LOCAL TRÊN 1× A100
      </text>
    </svg>
  );
}

function VMLUDetailTable() {
  const rows = [
    { subject: "Văn học Việt Nam", phogpt: 82, claude: 71, gpt4o: 74 },
    { subject: "Lịch sử Việt Nam", phogpt: 79, claude: 68, gpt4o: 70 },
    { subject: "Địa lý Việt Nam", phogpt: 76, claude: 72, gpt4o: 72 },
    { subject: "Toán chuyên", phogpt: 54, claude: 82, gpt4o: 78 },
    { subject: "Vật lý", phogpt: 58, claude: 80, gpt4o: 76 },
    { subject: "Hoá học", phogpt: 61, claude: 78, gpt4o: 75 },
  ];
  return (
    <ArticleViz caption="VMLU chia theo môn · xanh = PhoGPT dẫn · đen = Claude/GPT-4o dẫn">
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
            {["Môn", "PhoGPT-7B", "Claude 4.6", "GPT-4o"].map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: i === 0 ? "left" : "right",
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
          {rows.map((r) => {
            const phogptWin = r.phogpt >= Math.max(r.claude, r.gpt4o);
            return (
              <tr
                key={r.subject}
                style={{
                  background: phogptWin ? "var(--turquoise-50)" : "transparent",
                }}
              >
                <td
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  {r.subject}
                </td>
                {[r.phogpt, r.claude, r.gpt4o].map((v, i) => {
                  const isWinner =
                    (i === 0 && phogptWin) ||
                    (i === 1 && r.claude >= Math.max(r.phogpt, r.gpt4o)) ||
                    (i === 2 && r.gpt4o >= Math.max(r.phogpt, r.claude));
                  return (
                    <td
                      key={i}
                      style={{
                        padding: "12px 14px",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        borderBottom: "1px solid var(--border-subtle)",
                        color: isWinner
                          ? i === 0
                            ? "var(--turquoise-ink)"
                            : "var(--ink)"
                          : "var(--text-tertiary)",
                        fontWeight: isWinner ? 600 : 400,
                      }}
                    >
                      {v}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </ArticleViz>
  );
}
