import { Fragment } from "react";
import {
  ArticleShell,
  ArticleSection,
  ArticleProse,
  ArticleViz,
  ArticleCompare,
  Term,
} from "@/components/article";
import { articleMap } from "./registry";

const meta = articleMap["turboquant-kv-cache-compression"]!;

/**
 * Explainer article — TurboQuant (Google Research, ICLR 2026).
 * Walks the reader from the KV cache memory wall, through why a
 * naïve int3 quantization shreds accuracy, to the two-step recipe
 * (random rotation + Quantized Johnson-Lindenstrauss) that makes
 * 3-bit KV cache work without fine-tune or calibration.
 */
export default function TurboQuantArticle() {
  return (
    <ArticleShell meta={meta} heroViz={<KvRotationViz />}>
      <ArticleSection eyebrow="01 · Ý tưởng">
        <ArticleProse>
          <p>
            Bạn dán một file 80 trang vào Claude rồi hỏi một câu. Vài
            giây sau câu trả lời hiện ra, đẹp đẽ. Ở phía server, GPU vừa
            phải giữ trong VRAM một bảng tra mang tên{" "}
            <Term slug="kv-cache">KV cache</Term>: mỗi token trong cửa sổ
            context để lại một vector key và một vector value, lưu lại
            để các bước generate sau khỏi tính lại. 200K token context
            trên Llama-3.1 70B khoảng 40GB chỉ riêng KV. Long context
            càng dài, GPU càng chật.
          </p>
          <p>
            Cách rõ nhất để cắt giảm: nén KV cache xuống ít bit hơn. Nhưng
            ai từng thử int3 thẳng tay đều thấy accuracy lao dốc, model
            sinh chữ lảm nhảm. Tháng 3 năm 2026, nhóm Amir Zandieh và
            Vahab Mirrokni ở Google Research công bố{" "}
            <b>TurboQuant</b> trong paper ICLR. KV cache xuống 3 bit. Trên
            LongBench accuracy gần như không đổi. Trên H100, key được
            quantize 4-bit chạy nhanh hơn baseline tới 8 lần. Không cần
            fine-tune, không cần calibration trên dataset.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="02 · Cơ chế"
        heading="Vì sao quantize thẳng tay hỏng accuracy"
      >
        <ArticleProse>
          <p>
            <Term slug="quantization">Quantization</Term> chuyển một
            vector float32 thành vector ít bit hơn bằng cách chia khoảng
            giá trị thành các bin đều. Vấn đề là phân phối các toạ độ
            của key vector không đều. Một vài chiều có giá trị cực lớn,
            phần lớn các chiều còn lại nhỏ và dồn quanh 0.
          </p>
          <p>
            Đó là <b>outlier</b>. Khi bin được căn theo dải max-min,
            outlier kéo dải rộng ra, nên vùng dày của phân phối chỉ rơi
            vào một vài bin. 3 bit nghĩa là 8 bin. Nếu 7 bin bị bỏ
            trống vì outlier kéo dải, gần như mọi giá trị bị nén về cùng
            một bin. Thông tin chết.
          </p>
        </ArticleProse>
        <OutlierVsRotated />
        <ArticleProse>
          <p>
            TurboQuant phá outlier bằng một phép xoay. Họ dùng{" "}
            <b>Hadamard transform</b>: nhân vector key với một ma trận
            trực giao có toạ độ chỉ ±1, độ dài vector giữ nguyên. Sau
            phép quay, các outlier không biến mất, chúng được trải đều
            cho mọi chiều. Phân phối từ chữ U lệch chuyển thành dạng
            beta gần như cân đối, giống một quả chuông. Bin chia đều giờ
            khớp với phân phối, mỗi bin có lượng dữ liệu xấp xỉ nhau, sai
            số quantize nhỏ hẳn lại.
          </p>
          <p>
            Phép quay là khả nghịch. Khi cần dùng key trong{" "}
            <Term slug="attention-mechanism">attention</Term>, query
            cũng được quay bằng ma trận tương ứng. Inner product giữa
            query và key sau khi quay bằng đúng inner product trước khi
            quay. Tính chất hình học giữ nguyên, chỉ phân phối toạ độ
            đẹp hơn.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="03 · Lớp thứ hai"
        heading="QJL khử bias còn lại"
      >
        <ArticleProse>
          <p>
            Quantize sau xoay vẫn còn sai số nhỏ. Vector trả về không
            bằng đúng vector gốc, chênh một đoạn. Khi tính inner product
            với hàng trăm nghìn key, các sai số nhỏ này không tự triệt
            tiêu, chúng tích thành <b>bias</b> hệ thống cộng vào điểm
            attention.
          </p>
          <p>
            TurboQuant tính phần residual giữa vector quantize và vector
            gốc, rồi nén nó bằng <b>Quantized Johnson-Lindenstrauss</b>{" "}
            (QJL): chiếu residual qua một ma trận ngẫu nhiên, lấy dấu
            ±1, lưu 1 bit cho mỗi chiều chiếu. Đây là một kỹ thuật cũ
            của lý thuyết toán tính khoảng cách, lần này được lắp vào
            đường ước lượng inner product. Kết quả: ước lượng inner
            product trở thành <b>unbiased</b>, kỳ vọng đúng bằng inner
            product gốc, sai số có thể giảm thêm bằng cách tăng số
            chiều chiếu.
          </p>
        </ArticleProse>
        <PipelineDiagram />
      </ArticleSection>

      <ArticleSection
        eyebrow="04 · Số liệu"
        heading="3 bit, 6 lần memory, accuracy gần như nguyên"
      >
        <ArticleCompare
          before={{
            label: "Llama-3.1 70B · KV cache fp16",
            value: "100% memory",
            note: "200K token context · 40GB KV cache · LongBench 47.2 · MMLU 78.1",
          }}
          after={{
            label: "Cùng model · TurboQuant 3-bit",
            value: "16% memory",
            note: "200K token context · 6.4GB KV cache · LongBench 47.0 · MMLU 78.1. Không fine-tune.",
          }}
        />
        <ArticleProse>
          <p>
            Trên needle-in-haystack, TurboQuant 3-bit giữ 100% recall
            với context 1 triệu token. Nhóm tác giả test thêm trên
            Mistral 7B và Gemma 2 27B, cùng kiểu kết quả: accuracy
            không sứt mẻ, memory KV còn 1/6.
          </p>
          <p>
            Phần thưởng phụ là tốc độ. Vì key chỉ còn 3 bit nên load từ
            HBM về SRAM nhanh hơn nhiều. Trên H100, kernel TurboQuant
            4-bit cho key chạy nhanh tới 8 lần so với baseline fp32.
            <Term slug="long-context">Long context</Term> không còn là
            cuộc đua memory, nó trở lại là cuộc đua compute.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="05 · Đánh đổi"
        heading="Không phải bữa trưa miễn phí"
      >
        <ArticleProse>
          <p>
            Hadamard transform thêm một phép nhân ma trận khi insert key
            vào cache. Với key dimension 128, chi phí xoay nhỏ so với
            attention chính, nhưng vẫn cần kernel CUDA viết kỹ. Đến
            tháng 4 năm 2026 đã có bản cho llama.cpp, MLX, và PyTorch
            do cộng đồng port; bản chính thức của Google chưa public.
          </p>
          <p>
            Sàn 3 bit không phải tuyệt đối. Đẩy xuống 2.5 bit accuracy
            bắt đầu rớt nhẹ trên reasoning benchmark, 2 bit thì hỏng rõ
            trên LongBench. Mỗi bit ăn vào dung lượng thông tin, tới
            một ngưỡng QJL cũng không cứu được.
          </p>
          <p>
            TurboQuant chỉ cứu inference. Train vẫn cần fp16 hoặc bf16
            cho gradient. Và nó chỉ giảm bottleneck KV cache, không
            chạm tới <Term slug="inference-optimization">prefill</Term>:
            xử lý prompt dài lần đầu vẫn tốn compute như cũ.
          </p>
        </ArticleProse>
      </ArticleSection>

      <ArticleSection
        eyebrow="06 · Dùng khi nào"
        heading="Bật khi memory-bound, bỏ khi prefill-bound"
      >
        <ArticleProse>
          <p>
            <b>Bật TurboQuant</b> khi pipeline serve long context, batch
            lớn, GPU đang chật vì KV. Một H100 80GB sau khi gắn
            TurboQuant 3-bit có thể giữ context 1 triệu token cho 4
            sequence song song mà trước đó chỉ giữ được 1.{" "}
            <Term slug="cost-latency-tokens">Cost per token</Term> giảm
            nhiều nhất ở phần decode, đúng phần chiếm phần lớn thời gian
            chat.
          </p>
          <p>
            <b>Bỏ qua</b> nếu workload chủ yếu là one-shot prompt ngắn
            dưới 4K token, hoặc model nhỏ dưới 7B (KV cache không là
            bottleneck), hoặc khi chưa có kernel TurboQuant cho runtime
            của bạn. Quantize int4 hoặc int8 chuẩn vẫn dễ tích hợp hơn
            cho các trường hợp đó.
          </p>
          <p>
            Lớn hơn TurboQuant là tín hiệu nó đại diện. Một paper duy
            nhất, không cần training data, không cần chỉnh model, đẩy
            được KV cache xuống mức trước đây tưởng không thể. Nếu bạn
            đang xếp roadmap inference cho long context năm 2026, đây
            là kỹ thuật đáng theo dõi sát.
          </p>
        </ArticleProse>
      </ArticleSection>
    </ArticleShell>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Hero viz — KV rotation diagram. Two histograms side by side:
 * before rotation (outlier-heavy, U-shape), after rotation
 * (beta-like, bell). Static SVG, exported for the lead-card use.
 * ────────────────────────────────────────────────────────────── */
export function KvRotationViz() {
  // Hand-tuned bar heights to read as "outlier U" and "rotated bell"
  const outlierHeights = [
    72, 28, 14, 10, 8, 8, 8, 9, 10, 12, 16, 22, 30, 60,
  ];
  const rotatedHeights = [
    8, 12, 18, 26, 36, 48, 56, 58, 54, 44, 32, 22, 14, 10,
  ];
  const barW = 14;
  const gap = 4;
  const totalW = outlierHeights.length * (barW + gap);
  return (
    <svg
      viewBox="0 0 900 340"
      className="ar-viz"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="KV cache distribution before and after random rotation"
    >
      <defs>
        <linearGradient id="tq-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--turquoise-50)" />
          <stop offset="100%" stopColor="var(--bg-card)" />
        </linearGradient>
      </defs>
      <rect width="900" height="340" fill="url(#tq-bg)" />

      <text
        x="40"
        y="36"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--turquoise-ink)"
        letterSpacing="0.1em"
      >
        / TURBOQUANT · XOAY VECTOR TRƯỚC, QUANTIZE SAU
      </text>

      {/* Left: BEFORE rotation — outlier-heavy U distribution */}
      <g transform="translate(60, 80)">
        <text
          x="0"
          y="-12"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
          letterSpacing="0.14em"
        >
          KEY GỐC · OUTLIER HAI ĐẦU
        </text>
        {outlierHeights.map((h, i) => (
          <rect
            key={`o-${i}`}
            x={i * (barW + gap)}
            y={120 - h}
            width={barW}
            height={h}
            rx={2}
            fill={
              i < 2 || i > outlierHeights.length - 3
                ? "var(--clay)"
                : "var(--clay-soft, var(--clay))"
            }
            opacity={i < 2 || i > outlierHeights.length - 3 ? 1 : 0.45}
          />
        ))}
        <line
          x1={0}
          y1={120}
          x2={totalW - gap}
          y2={120}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {/* int3 bins overlay */}
        <g>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => (
            <line
              key={`bin-${b}`}
              x1={(b / 8) * (totalW - gap)}
              y1={0}
              x2={(b / 8) * (totalW - gap)}
              y2={120}
              stroke="var(--text-tertiary)"
              strokeDasharray="2 4"
              strokeWidth={1}
              opacity={0.4}
            />
          ))}
        </g>
        <text
          x={0}
          y={140}
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
        >
          Bin int3 chia đều · giá trị dồn ở 2 bin biên
        </text>
      </g>

      {/* Arrow */}
      <g>
        <text
          x={450}
          y={90}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="var(--turquoise-ink)"
          letterSpacing="0.14em"
        >
          HADAMARD
        </text>
        <text
          x={450}
          y={108}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
          letterSpacing="0.1em"
        >
          rotate ±1
        </text>
        <line
          x1={420}
          y1={140}
          x2={480}
          y2={140}
          stroke="var(--turquoise-500)"
          strokeWidth={2}
        />
        <polygon
          points="480,140 472,135 472,145"
          fill="var(--turquoise-500)"
        />
      </g>

      {/* Right: AFTER rotation — rotated bell */}
      <g transform="translate(540, 80)">
        <text
          x="0"
          y="-12"
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--turquoise-ink)"
          letterSpacing="0.14em"
        >
          SAU XOAY · PHÂN PHỐI BETA
        </text>
        {rotatedHeights.map((h, i) => (
          <rect
            key={`r-${i}`}
            x={i * (barW + gap)}
            y={120 - h}
            width={barW}
            height={h}
            rx={2}
            fill="var(--turquoise-500)"
            opacity={0.85}
          />
        ))}
        <line
          x1={0}
          y1={120}
          x2={totalW - gap}
          y2={120}
          stroke="var(--border)"
          strokeWidth={1}
        />
        <g>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => (
            <line
              key={`bin2-${b}`}
              x1={(b / 8) * (totalW - gap)}
              y1={0}
              x2={(b / 8) * (totalW - gap)}
              y2={120}
              stroke="var(--turquoise-ink)"
              strokeDasharray="2 4"
              strokeWidth={1}
              opacity={0.4}
            />
          ))}
        </g>
        <text
          x={0}
          y={140}
          fontFamily="var(--font-mono)"
          fontSize="10"
          fill="var(--text-tertiary)"
        >
          Bin int3 khớp phân phối · sai số quantize giảm mạnh
        </text>
      </g>

      <line
        x1="40"
        y1="290"
        x2="860"
        y2="290"
        stroke="var(--border)"
        strokeWidth={1}
      />
      <text
        x="40"
        y="312"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--text-tertiary)"
        letterSpacing="0.08em"
      >
        ■ OUTLIER (ĐẬM) · ▌BIN INT3 (NÉT ĐỨT) · GIỮ NGUYÊN INNER PRODUCT QUA PHÉP QUAY
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 02 viz — same data, two scatter plots: outlier-prone
 * coords vs spread-out coords after rotation.
 * ────────────────────────────────────────────────────────────── */
function OutlierVsRotated() {
  const N = 64;
  // Deterministic pseudo-random points so SSR stays stable
  const seed = (i: number) => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const before: Array<[number, number]> = Array.from({ length: N }).map(
    (_, i) => {
      const r1 = seed(i * 2);
      const r2 = seed(i * 2 + 1);
      // Most points clustered near 0, a few outliers near ±1
      const xMag = i < 4 ? 0.85 + r1 * 0.1 : r1 * 0.18;
      const yMag = i < 4 ? -0.85 - r2 * 0.1 : r2 * 0.18 - 0.09;
      const x = (i % 2 === 0 ? 1 : -1) * xMag;
      const y = (i % 3 === 0 ? 1 : -1) * yMag;
      return [x, y];
    },
  );
  const after: Array<[number, number]> = Array.from({ length: N }).map(
    (_, i) => {
      const r1 = seed(i * 5 + 11);
      const r2 = seed(i * 5 + 19);
      // Spread-out gaussian-like
      const x = (r1 - 0.5) * 1.3;
      const y = (r2 - 0.5) * 1.3;
      return [x, y];
    },
  );

  const renderPlot = (
    pts: Array<[number, number]>,
    label: string,
    accent: string,
    isOutlierPlot: boolean,
  ) => (
    <div
      style={{
        position: "relative",
        background: "var(--paper-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ width: "100%", height: 220 }}>
        {/* Quantization grid (3-bit = 8 bins per axis) */}
        {Array.from({ length: 9 }).map((_, i) => {
          const v = -1.2 + (i / 8) * 2.4;
          return (
            <g key={`grid-${i}`}>
              <line
                x1={v}
                y1={-1.2}
                x2={v}
                y2={1.2}
                stroke="var(--border)"
                strokeWidth={0.01}
              />
              <line
                x1={-1.2}
                y1={v}
                x2={1.2}
                y2={v}
                stroke="var(--border)"
                strokeWidth={0.01}
              />
            </g>
          );
        })}
        {/* Axes */}
        <line
          x1={-1.2}
          y1={0}
          x2={1.2}
          y2={0}
          stroke="var(--text-tertiary)"
          strokeWidth={0.012}
        />
        <line
          x1={0}
          y1={-1.2}
          x2={0}
          y2={1.2}
          stroke="var(--text-tertiary)"
          strokeWidth={0.012}
        />
        {/* Points */}
        {pts.map(([x, y], i) => {
          const isOutlier = isOutlierPlot && i < 4;
          return (
            <circle
              key={`p-${i}`}
              cx={x}
              cy={y}
              r={isOutlier ? 0.06 : 0.038}
              fill={isOutlier ? "var(--clay)" : accent}
              opacity={isOutlier ? 1 : 0.78}
            />
          );
        })}
      </svg>
    </div>
  );

  return (
    <ArticleViz caption="Cùng tập key vector. Trái: outlier kéo dải, 8 bin int3 trải dài, vùng dày dồn vào 2 bin. Phải: sau Hadamard, điểm trải đều, mỗi bin ôm xấp xỉ cùng số điểm.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {renderPlot(
          before,
          "Trước xoay · int3 thẳng tay",
          "var(--graphite)",
          true,
        )}
        {renderPlot(
          after,
          "Sau Hadamard · int3 hiệu quả",
          "var(--turquoise-500)",
          false,
        )}
      </div>
    </ArticleViz>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Section 03 viz — three-stage pipeline: rotate → quantize →
 * QJL fix bias. Mirrors the paper's recipe.
 * ────────────────────────────────────────────────────────────── */
function PipelineDiagram() {
  const stages = [
    {
      tag: "1 · Rotate",
      title: "Hadamard",
      body: "Nhân key với ma trận trực giao ±1. Outlier rải đều, phân phối từ U lệch chuyển sang dạng beta.",
      tone: "clay" as const,
    },
    {
      tag: "2 · Quantize",
      title: "Scalar int3",
      body: "Mỗi toạ độ ép vào 1 trong 8 bin. Bin chia đều giờ khớp phân phối, sai số quantize nhỏ.",
      tone: "turquoise" as const,
    },
    {
      tag: "3 · QJL",
      title: "1-bit Johnson-Lindenstrauss",
      body: "Chiếu residual qua ma trận ngẫu nhiên, lưu dấu ±1. Inner product trở thành unbiased.",
      tone: "turquoise" as const,
    },
  ];
  return (
    <ArticleViz caption="Pipeline 3 bước. Bước 1 và 2 cho 6 lần memory. Bước 3 đảm bảo attention không lệch khi cộng dồn nửa triệu key.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 28px 1fr 28px 1fr",
          gap: 0,
          alignItems: "stretch",
        }}
      >
        {stages.map((s, i) => (
          <Fragment key={s.tag}>
            <div
              style={{
                padding: "18px 20px",
                background:
                  s.tone === "clay" ? "var(--paper-2)" : "var(--bg-card)",
                border: "1px solid var(--border)",
                borderLeft:
                  s.tone === "clay"
                    ? "4px solid var(--clay)"
                    : "4px solid var(--turquoise-500)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color:
                    s.tone === "clay"
                      ? "var(--clay)"
                      : "var(--turquoise-ink)",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {s.tag}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: "var(--text-primary)",
                  marginBottom: 10,
                }}
              >
                {s.title}
              </div>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                {s.body}
              </p>
            </div>
            {i < stages.length - 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: "var(--text-tertiary)",
                }}
              >
                →
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </ArticleViz>
  );
}
