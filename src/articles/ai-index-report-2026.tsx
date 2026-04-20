import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleStat,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["ai-index-report-2026"]!;

export default function AIIndex2026Article() {
  return (
    <ArticleShell meta={meta} heroViz={<CostCurveViz />}>
      <ArticleSection eyebrow="01 · Đại cảnh">
        <ArticleProse>
          <p>
            Stanford HAI ra AI Index Report 2026 — báo cáo thường niên
            theo dõi trạng thái ngành. Bản lần này dài 420 trang, nhưng
            ba con số tóm được bức tranh lớn:
          </p>
        </ArticleProse>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "8px 0" }}>
          <ArticleStat value="−86%" label="Chi phí inference · 12 tháng" />
          <ArticleStat value="3.1×" label="Số model mở · so với 2025" />
          <ArticleStat value="92%" label="GPQA top-model · gần bão hoà" />
        </div>
        <ArticleProse>
          <p>
            Đọc ngắn: thị trường đang rẻ nhanh hơn bất kỳ công nghệ
            nào từng có. Benchmark cũ gần hết hữu dụng. Mô hình mở đang
            bắt kịp mô hình kín.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Giá rơi thế nào"
        heading="GPT-4 level từ 30 đô xuống 4 đô mỗi triệu token"
      >
        <ArticleProse>
          <p>
            Tháng 4/2025, một triệu token input cho mô hình ở mức GPT-4
            có giá khoảng 30 đô. Một năm sau: 4 đô. Đây không phải giảm
            giá của một hãng — là giá sàn thị trường, vì có ít nhất 6
            nhà cung cấp chạm tới chất lượng đó.
          </p>
          <p>
            Báo cáo chỉ ra ba động lực: (1) kiến trúc{" "}
            <Term slug="moe">MoE</Term> với active param nhỏ hơn, (2){" "}
            <Term slug="kv-cache">KV cache</Term> và tối ưu inference,
            (3) <b>cạnh tranh open weights</b> buộc closed-source phải
            giảm. Về dài hạn, (3) là động lực lớn nhất.
          </p>
        </ArticleProse>
        <CostBreakdownTable />
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Mô hình mở"
        heading="Số lượng gấp 3.1 lần — nhưng chênh lệch chất lượng thu hẹp 4 lần"
      >
        <ArticleProse>
          <p>
            Cuối 2024, model mở tốt nhất kém closed-source 18 điểm MMLU.
            Cuối 2025, khoảng cách còn 4.3. Không chỉ có thêm model —
            các model mới thật sự tốt hơn.
          </p>
          <p>
            Lớp mô hình mở chính: Meta Llama, Alibaba Qwen, DeepSeek,
            Mistral, VinAI. Báo cáo nhấn mạnh vai trò của cộng đồng
            Trung Quốc trong nửa sau 2025 — phần lớn model mở &ldquo;đe
            doạ&rdquo; vị trí của GPT-4 đến từ Qwen và DeepSeek.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Benchmark sắp chết"
        heading="MMLU 90+, GPQA 92, AIME 88 — đâu là thước đo mới?"
      >
        <ArticleProse>
          <p>
            Ba benchmark lớn nhất đều đã bị model tốt nhất chạm ngưỡng.
            Cộng đồng chuyển sang: SWE-bench Verified, HumanEval-Pro,
            ARC-AGI-2, GAIA. Điểm chung: <b>task thực, nhiều bước,
            không có đáp án trong training data</b>.
          </p>
          <p>
            Dự báo của báo cáo: 2026 sẽ là năm mà{" "}
            <Term slug="scaling-laws">scaling laws</Term> cho benchmark
            cổ điển trở nên &ldquo;sụp&rdquo; — tăng compute thêm 10×
            không cho thêm điểm. Giá trị thực chuyển sang reasoning
            chain dài, tool use, long-context retrieval.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection eyebrow="05 · Ý nghĩa" heading="Với người Việt, điều gì đáng chú ý nhất?">
        <ArticleProse>
          <p>
            Một là: giá rơi nhanh nghĩa là <b>ứng dụng dùng LLM năm
            ngoái không dám làm, năm nay đáng thử lại</b>. Phí chat
            support, phân tích báo cáo, tóm tắt tài liệu pháp lý — ngày
            xưa một request mất 6 xu, giờ 0.8 xu.
          </p>
          <p>
            Hai là: model mở đủ tốt để doanh nghiệp Việt không phụ
            thuộc một hãng. PhoGPT-7B, DeepSeek-V4, Qwen-2.5 — cả ba
            đều chạy được local, cả ba đều vượt ngưỡng dùng production.
          </p>
          <p>
            Ba là: benchmark chuẩn ngành đang đổi. Ai còn đang tuyển
            kỹ sư ML dựa trên &ldquo;điểm MMLU cao của model&rdquo;
            cần đọc lại. Thước đo đã chuyển.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — Inference cost curve (12 months)
 * ────────────────────────────────────────────────────────────── */
export function CostCurveViz() {
  // Monthly data: $/M input tokens for GPT-4 level models
  const points = [
    { m: "04/25", v: 30.0 },
    { m: "05/25", v: 28.0 },
    { m: "06/25", v: 25.0 },
    { m: "07/25", v: 22.0 },
    { m: "08/25", v: 18.0 },
    { m: "09/25", v: 15.0 },
    { m: "10/25", v: 12.5 },
    { m: "11/25", v: 10.0 },
    { m: "12/25", v: 8.5 },
    { m: "01/26", v: 7.0 },
    { m: "02/26", v: 5.5 },
    { m: "03/26", v: 4.8 },
    { m: "04/26", v: 4.2 },
  ];
  const maxV = 30;
  const minX = 80;
  const maxX = 860;
  const minY = 240;
  const maxY = 70;

  const path = points
    .map((p, i) => {
      const x = minX + (i / (points.length - 1)) * (maxX - minX);
      const y = minY - (p.v / maxV) * (minY - maxY);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Inference cost curve — 30 USD falling to 4 USD per million tokens over 12 months"
    >
      <defs>
        <linearGradient id="ai-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
        <linearGradient id="ai-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-500)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--turquoise-500)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" fill="url(#ai-bg)" />

      <text
        x="40"
        y="40"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--turquoise-ink)"
        letterSpacing="0.1em"
      >
        / CHI PHÍ INFERENCE · GPT-4 LEVEL · USD / 1M INPUT TOKEN
      </text>

      {/* Y axis grid */}
      {[0, 10, 20, 30].map((g) => {
        const y = minY - (g / maxV) * (minY - maxY);
        return (
          <g key={g}>
            <line x1={minX} y1={y} x2={maxX} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
            <text x={minX - 10} y={y + 4} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-tertiary)">
              ${g}
            </text>
          </g>
        );
      })}

      {/* X axis labels — every 2 months */}
      {points.map((p, i) => {
        if (i % 2 !== 0 && i !== points.length - 1) return null;
        const x = minX + (i / (points.length - 1)) * (maxX - minX);
        return (
          <text
            key={p.m}
            x={x}
            y={minY + 20}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--text-tertiary)"
          >
            {p.m}
          </text>
        );
      })}

      {/* Area fill */}
      <path
        d={`${path} L ${maxX} ${minY} L ${minX} ${minY} Z`}
        fill="url(#ai-area)"
      />

      {/* Main line */}
      <path d={path} stroke="var(--turquoise-500)" strokeWidth="2.5" fill="none" />

      {/* Endpoints */}
      {[points[0], points[points.length - 1]].map((p, i) => {
        const idx = i === 0 ? 0 : points.length - 1;
        const x = minX + (idx / (points.length - 1)) * (maxX - minX);
        const y = minY - (p.v / maxV) * (minY - maxY);
        return (
          <g key={p.m}>
            <circle cx={x} cy={y} r="6" fill="var(--turquoise-500)" stroke="var(--paper)" strokeWidth="2" />
            <rect
              x={i === 0 ? x - 4 : x - 78}
              y={y - 40}
              width="84"
              height="30"
              rx="6"
              fill={i === 0 ? "var(--ink)" : "var(--turquoise-500)"}
            />
            <text
              x={i === 0 ? x + 38 : x - 36}
              y={y - 22}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fill={i === 0 ? "var(--turquoise-300)" : "var(--paper)"}
              fontWeight="600"
              letterSpacing="0.08em"
            >
              {p.m}
            </text>
            <text
              x={i === 0 ? x + 38 : x - 36}
              y={y - 10}
              textAnchor="middle"
              fontFamily="var(--font-display)"
              fontSize="13"
              fill="var(--paper)"
              fontWeight="500"
            >
              ${p.v}
            </text>
          </g>
        );
      })}

      <text x="40" y="320" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-tertiary)" letterSpacing="0.08em">
        GIẢM 86% TRONG 12 THÁNG · AI INDEX REPORT 2026 · STANFORD HAI
      </text>
    </svg>
  );
}

function CostBreakdownTable() {
  const rows = [
    { driver: "Kiến trúc MoE", impact: "−32%", note: "Active param giảm từ 175B xuống 37B cho cùng chất lượng." },
    { driver: "KV cache tối ưu", impact: "−24%", note: "Prefill cache reuse + grouped-query attention." },
    { driver: "Cạnh tranh open weights", impact: "−38%", note: "Closed-source buộc phải giảm để khỏi mất thị phần." },
    { driver: "Phần cứng (H200, MI300X)", impact: "−12%", note: "Bandwidth bộ nhớ tăng, FP8 native." },
  ];
  return (
    <ArticleViz caption="4 động lực · cộng dồn không bằng 86% vì có trùng lắp nhưng tổng hướng giảm rõ">
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
            {["Động lực", "Tác động", "Ghi chú"].map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: i === 1 ? "right" : "left",
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
            <tr key={r.driver}>
              <td
                style={{
                  padding: "14px",
                  borderBottom: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  minWidth: 200,
                }}
              >
                {r.driver}
              </td>
              <td
                style={{
                  padding: "14px",
                  borderBottom: "1px solid var(--border-subtle)",
                  textAlign: "right",
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  fontWeight: 500,
                  color: "var(--clay)",
                  letterSpacing: "-0.02em",
                }}
              >
                {r.impact}
              </td>
              <td
                style={{
                  padding: "14px",
                  borderBottom: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {r.note}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ArticleViz>
  );
}
