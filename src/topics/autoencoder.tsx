"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { PredictionGate, AhaMoment, InlineChallenge, Callout, CollapsibleDetail,
  MiniSummary, CodeBlock, LessonSection, LaTeX, TopicLink, ProgressSteps } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ============================================================================
 * METADATA
 * ==========================================================================*/

export const metadata: TopicMeta = {
  slug: "autoencoder",
  title: "Autoencoder",
  titleVi: "Bộ tự mã hóa",
  description:
    "Mạng nén dữ liệu vào biểu diễn chiều thấp rồi tái tạo lại, học đặc trưng quan trọng nhất.",
  category: "dl-architectures",
  tags: ["unsupervised-learning", "compression", "representation"],
  difficulty: "advanced",
  relatedSlugs: ["vae", "pca", "gan"],
  vizType: "interactive",
};

/* ============================================================================
 * CONSTANTS — MNIST-like 28×28 digit + latent space mock
 * ==========================================================================*/

const TOTAL_STEPS = 8;

// Các mốc bottleneck: 784 → 128 → 32 → 8 → 32 → 128 → 784
const LAYER_SIZES = [784, 128, 32, 8, 32, 128, 784] as const;
// Index 3 là bottleneck
const BOTTLENECK_OPTIONS = [2, 4, 8, 16, 32, 64, 128] as const;
type BottleneckSize = (typeof BOTTLENECK_OPTIONS)[number];

// Mẫu &quot;số 3&quot; đơn giản 28×28 — mảng bit (0 = trắng, 1 = đen)
// Đủ để cảm nhận reconstruction quality bằng mắt.
function makeDigitThree(): number[][] {
  const grid: number[][] = Array.from({ length: 28 }, () =>
    Array(28).fill(0),
  );
  // Nét trên
  for (let j = 8; j <= 19; j++) {
    grid[6][j] = 1;
    grid[7][j] = 1;
  }
  // Cong phải trên
  for (let i = 6; i <= 13; i++) {
    grid[i][19] = 1;
    grid[i][18] = 1;
  }
  // Nét giữa
  for (let j = 11; j <= 18; j++) {
    grid[13][j] = 1;
    grid[14][j] = 1;
  }
  // Cong phải dưới
  for (let i = 13; i <= 20; i++) {
    grid[i][19] = 1;
    grid[i][18] = 1;
  }
  // Nét dưới
  for (let j = 8; j <= 19; j++) {
    grid[20][j] = 1;
    grid[21][j] = 1;
  }
  return grid;
}

const DIGIT_THREE = makeDigitThree();

// Mô phỏng reconstruction: càng ít bottleneck → càng nhiều &quot;blur&quot;
function reconstructDigit(
  original: number[][],
  bottleneck: BottleneckSize,
): { grid: number[]; loss: number } {
  const flat: number[] = [];
  const originalFlat = original.flat();
  const N = 28;

  // Noise scale giảm khi bottleneck tăng
  const noiseScale = Math.max(0, 0.6 - Math.log2(bottleneck) * 0.1);
  // Blur radius: bottleneck nhỏ → blur nhiều
  const blurRadius = Math.max(0, 4 - Math.floor(Math.log2(bottleneck)));

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      let sum = 0;
      let count = 0;
      for (let di = -blurRadius; di <= blurRadius; di++) {
        for (let dj = -blurRadius; dj <= blurRadius; dj++) {
          const ni = i + di;
          const nj = j + dj;
          if (ni >= 0 && ni < N && nj >= 0 && nj < N) {
            sum += original[ni][nj];
            count += 1;
          }
        }
      }
      const avg = count > 0 ? sum / count : 0;
      // pseudo-noise deterministic from (i, j, bottleneck)
      const h = Math.sin(i * 12.9898 + j * 78.233 + bottleneck * 3.71) * 43758.5453;
      const noise = (h - Math.floor(h) - 0.5) * noiseScale;
      const v = Math.max(0, Math.min(1, avg + noise));
      flat.push(v);
    }
  }

  // MSE loss
  let mse = 0;
  for (let k = 0; k < flat.length; k++) {
    const diff = flat[k] - originalFlat[k];
    mse += diff * diff;
  }
  mse /= flat.length;

  return { grid: flat, loss: mse };
}

// 2D latent space mock — 6 cluster (các chữ số), mỗi cluster có nhiều điểm
interface LatentPoint {
  x: number;
  y: number;
  digit: number;
}

function makeLatentPoints(): LatentPoint[] {
  const centers: [number, number][] = [
    [-3.0, -2.0], // 0
    [-1.8, 2.4], // 1
    [0.5, -2.8], // 2
    [2.3, 1.1], // 3
    [-2.7, 0.9], // 4
    [1.6, -0.8], // 5
  ];
  const points: LatentPoint[] = [];
  for (let d = 0; d < centers.length; d++) {
    const [cx, cy] = centers[d];
    for (let k = 0; k < 28; k++) {
      // deterministic &quot;random&quot;
      const a = Math.sin(d * 17.1 + k * 3.7) * 43758.5453;
      const b = Math.sin(d * 9.3 + k * 6.1) * 17438.913;
      const rx = (a - Math.floor(a) - 0.5) * 1.3;
      const ry = (b - Math.floor(b) - 0.5) * 1.3;
      points.push({ x: cx + rx, y: cy + ry, digit: d });
    }
  }
  return points;
}

const LATENT_POINTS = makeLatentPoints();

const DIGIT_COLORS = [
  "#ef4444", // 0 red
  "#3b82f6", // 1 blue
  "#22c55e", // 2 green
  "#f59e0b", // 3 amber
  "#a855f7", // 4 purple
  "#06b6d4", // 5 cyan
];

/* ============================================================================
 * QUIZ — 8 câu
 * ==========================================================================*/

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Autoencoder bottleneck có 2 neuron. Input là ảnh 784 pixel (28×28). Mạng học được gì?",
    options: [
      "Không học được gì — 2 neuron quá ít.",
      "Nén 784 chiều → 2 chiều, giữ lại 2 đặc trưng quan trọng nhất (giống PCA nhưng phi tuyến).",
      "Tái tạo ảnh hoàn hảo pixel-by-pixel.",
      "Học cách mã hoá nhị phân 0/1.",
    ],
    correct: 1,
    explanation:
      "Bottleneck buộc mạng 'ép' 784 chiều vào 2 số. Nó sẽ tự học 2 đặc trưng quan trọng nhất — ví dụ: nghiêng trái/phải và nét đậm/nhạt. Đây là giảm chiều phi tuyến.",
  },
  {
    question:
      "Denoising Autoencoder nhận input bị nhiễu nhưng target là ảnh sạch. Tại sao?",
    options: [
      "Để tăng tốc huấn luyện.",
      "Để mạng học biểu diễn robust — nén bản chất, không nén nhiễu.",
      "Vì dữ liệu thực tế luôn có nhiễu.",
      "Để giảm kích thước bottleneck.",
    ],
    correct: 1,
    explanation:
      "Nếu input có nhiễu mà output phải sạch, mạng không thể 'copy' trực tiếp — phải hiểu bản chất dữ liệu để lọc nhiễu. Biểu diễn latent sẽ robust hơn autoencoder thường.",
  },
  {
    question:
      "Autoencoder loss thấp nhưng không sinh được dữ liệu mới tốt. Tại sao?",
    options: [
      "Vì loss quá thấp = overfitting.",
      "Vì latent space không liên tục — lấy mẫu ngẫu nhiên rơi vào vùng 'trống' không có ý nghĩa.",
      "Vì decoder quá yếu.",
      "Vì bottleneck quá lớn.",
    ],
    correct: 1,
    explanation:
      "Autoencoder mã hóa mỗi ảnh thành 1 điểm cố định trong latent space. Giữa các điểm là vùng trống — lấy mẫu ở đó cho output vô nghĩa. VAE giải quyết bằng cách ép latent space thành phân phối liên tục.",
  },
  {
    question:
      "Bottleneck size = input size (784 → 784 → 784). Mạng sẽ học gì?",
    options: [
      "Biểu diễn nén hiệu quả như bình thường.",
      "Có thể chỉ học hàm đồng nhất (identity) — copy input sang output mà không nén gì.",
      "Không thể train được.",
      "Tự động prune bớt neuron.",
    ],
    correct: 1,
    explanation:
      "Khi bottleneck ≥ input size, không có áp lực nén — mạng có thể học hàm đồng nhất. Phải d << D để ép mạng tìm cấu trúc. Đây là nguồn gốc tên 'cổ chai'.",
  },
  {
    question:
      "Autoencoder tuyến tính 1 lớp (không activation, bottleneck = k) học được gì?",
    options: [
      "Không học được gì.",
      "Học một phép chiếu lên không gian con tối ưu — tương đương PCA top-k.",
      "Học t-SNE.",
      "Học mọi hàm phi tuyến.",
    ],
    correct: 1,
    explanation:
      "Với MSE loss và lớp tuyến tính, nghiệm tối ưu là phép chiếu lên k principal component hàng đầu — chính là PCA. Kích hoạt phi tuyến mới khiến autoencoder vượt qua PCA.",
  },
  {
    type: "fill-blank",
    question:
      "Autoencoder có hai phần: {blank} nén x → z (qua bottleneck nhỏ) và {blank} giải nén z → x̂. Mục tiêu: x̂ ≈ x, loss = ||x − x̂||².",
    blanks: [
      {
        answer: "encoder",
        accept: ["Encoder", "bộ mã hoá", "bộ mã hóa", "mạng nén"],
      },
      {
        answer: "decoder",
        accept: ["Decoder", "bộ giải mã", "mạng giải nén"],
      },
    ],
    explanation:
      "Encoder z = f_θ(x) nén dữ liệu D chiều vào latent d chiều (d << D). Decoder x̂ = g_φ(z) giải nén ngược lại. Với 1 lớp tuyến tính → tương đương PCA; với nhiều lớp phi tuyến → mạnh hơn nhiều.",
  },
  {
    question:
      "Ứng dụng nào sau đây KHÔNG phải thế mạnh truyền thống của autoencoder?",
    options: [
      "Phát hiện bất thường (anomaly detection).",
      "Giảm chiều cho visualization.",
      "Sinh ảnh chất lượng cao (high-fidelity generation).",
      "Khử nhiễu (denoising).",
    ],
    correct: 2,
    explanation:
      "Autoencoder vanilla không phải generative model mạnh — latent space rời rạc, sampling cho ra ảnh mờ. Để sinh ảnh dùng VAE, GAN, hoặc diffusion model. AE truyền thống mạnh ở nén, phát hiện anomaly, pretrain feature.",
  },
  {
    question:
      "Trong training autoencoder MNIST, loss reconstruction giảm nhanh rồi chững. Bước nào là hợp lí tiếp theo để cải thiện?",
    options: [
      "Giảm bottleneck về 1 để buộc nén thêm.",
      "Thêm skip connection — nhưng có thể khiến mạng bỏ qua bottleneck, giảm chất lượng latent.",
      "Cân nhắc: thay MSE bằng BCE, thêm data augmentation, hoặc chuyển sang denoising AE để học biểu diễn robust hơn.",
      "Ngừng train — 0.05 đã là giá trị tối ưu.",
    ],
    correct: 2,
    explanation:
      "MSE loss chững có thể do: (1) mạng đã capture được cấu trúc chính, (2) loss function không phù hợp (BCE phù hợp hơn với ảnh nhị phân), (3) không có regularization nên latent trở nên tầm thường. Thử denoising hoặc contractive AE.",
  },
];

/* ============================================================================
 * UTILITIES
 * ==========================================================================*/

function pxColor(v: number): string {
  const g = Math.round(255 * (1 - v));
  return `rgb(${g}, ${g}, ${g})`;
}

function pointColor(d: number): string {
  return DIGIT_COLORS[d] ?? "#64748b";
}

/* ============================================================================
 * MAIN COMPONENT
 * ==========================================================================*/

export default function AutoencoderTopic() {
  const [bottleneck, setBottleneck] = useState<BottleneckSize>(32);
  const [hoveredDigit, setHoveredDigit] = useState<number | null>(null);

  const reconstruction = useMemo(
    () => reconstructDigit(DIGIT_THREE, bottleneck),
    [bottleneck],
  );

  const compressionRatio = useMemo(() => {
    return (784 / bottleneck).toFixed(1);
  }, [bottleneck]);

  const qualityLabel = useMemo(() => {
    if (bottleneck >= 64) return "Rất tốt — gần như không mất chi tiết";
    if (bottleneck >= 16) return "Tốt — hình dáng rõ, hơi mờ";
    if (bottleneck >= 4) return "Mờ — giữ bản chất, mất chi tiết";
    return "Rất mờ — chỉ giữ được khái niệm chung";
  }, [bottleneck]);

  const qualityColor = useMemo(() => {
    if (bottleneck >= 64) return "#22c55e";
    if (bottleneck >= 16) return "#84cc16";
    if (bottleneck >= 4) return "#f59e0b";
    return "#ef4444";
  }, [bottleneck]);

  const setBottleneckByIndex = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(BOTTLENECK_OPTIONS.length - 1, idx));
    setBottleneck(BOTTLENECK_OPTIONS[clamped]);
  }, []);

  const currentBottleneckIdx = BOTTLENECK_OPTIONS.indexOf(bottleneck);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 1 — HOOK: prediction về nén ảnh
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Hãy tưởng tượng bạn cần gửi một tấm ảnh 1&nbsp;MB qua đường truyền
          chỉ cho phép 10&nbsp;KB mỗi gói. Bạn nén ảnh xuống, gửi đi, rồi giải
          nén ở đầu bên kia. Câu hỏi là...
        </p>
        <PredictionGate
          question="Ảnh giải nén có giống 100% ảnh gốc không? Tại sao?"
          options={[
            "Giống 100% — nén không mất thông tin.",
            "Gần giống nhưng mất chi tiết — nén buộc phải giữ cái quan trọng, bỏ cái phụ.",
            "Hoàn toàn khác — nén nhiều quá thì mất hết.",
          ]}
          correct={1}
          explanation="Nén 100 lần thì buộc phải mất chi tiết! Nhưng thuật toán nén thông minh sẽ giữ lại bản chất (hình dạng, màu chính) và bỏ chi tiết nhỏ (texture, noise). Autoencoder học cách nén thông minh này một cách tự động, không cần ai dạy."
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 2 — DISCOVER: Interactive bottleneck + reconstruction + latent
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection
        step={2}
        totalSteps={TOTAL_STEPS}
        label="Khám phá cổ chai"
      >
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Bên dưới là một autoencoder mô phỏng trên ảnh chữ số 28×28 (784
          pixel). Kéo slider để thay đổi kích thước <strong>bottleneck</strong>
          {" "}— cổ chai nén dữ liệu trước khi giải nén lại.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            {/* ─────────── Architecture diagram ─────────── */}
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3 text-center">
                Kiến trúc: 784 → 128 → 32 → {bottleneck} → 32 → 128 → 784
              </p>

              <svg
                viewBox="0 0 700 170"
                className="w-full"
                role="img"
                aria-label="Sơ đồ kiến trúc autoencoder"
              >
                {/* Labels */}
                <rect
                  x={20}
                  y={5}
                  width={260}
                  height={20}
                  rx={6}
                  fill="#3b82f6"
                  opacity={0.1}
                />
                <text
                  x={150}
                  y={19}
                  fontSize={11}
                  fill="#3b82f6"
                  textAnchor="middle"
                  fontWeight={600}
                >
                  Encoder — nén dữ liệu
                </text>

                <rect
                  x={420}
                  y={5}
                  width={260}
                  height={20}
                  rx={6}
                  fill="#22c55e"
                  opacity={0.1}
                />
                <text
                  x={550}
                  y={19}
                  fontSize={11}
                  fill="#22c55e"
                  textAnchor="middle"
                  fontWeight={600}
                >
                  Decoder — giải nén
                </text>

                <motion.text
                  key={bottleneck}
                  x={350}
                  y={19}
                  fontSize={11}
                  fill="#f59e0b"
                  textAnchor="middle"
                  fontWeight={700}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  Bottleneck ({bottleneck} chiều)
                </motion.text>

                {/* Layer rectangles */}
                {LAYER_SIZES.map((size, li) => {
                  const x = 50 + li * 100;
                  const isBottleneck = li === 3;
                  const isEncoder = li < 3;
                  const color = isBottleneck
                    ? "#f59e0b"
                    : isEncoder
                      ? "#3b82f6"
                      : "#22c55e";

                  const displaySize = isBottleneck ? bottleneck : size;
                  const height = Math.max(
                    18,
                    Math.min(110, Math.sqrt(displaySize) * 5 + 12),
                  );
                  const y = 90 - height / 2;

                  return (
                    <g key={`layer-${li}`}>
                      <motion.rect
                        x={x - 20}
                        y={y}
                        width={40}
                        height={height}
                        rx={6}
                        fill={color}
                        opacity={0.35}
                        stroke={color}
                        strokeWidth={isBottleneck ? 2.5 : 1.5}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{
                          delay: li * 0.05,
                          type: "spring",
                          stiffness: 260,
                        }}
                        style={{ transformOrigin: `${x}px 90px` }}
                      />
                      <text
                        x={x}
                        y={y + height + 14}
                        fontSize={11}
                        fill={color}
                        textAnchor="middle"
                        fontWeight={600}
                      >
                        {displaySize}
                      </text>
                      {li < LAYER_SIZES.length - 1 && (
                        <line
                          x1={x + 20}
                          y1={90}
                          x2={x + 80}
                          y2={90}
                          stroke={color}
                          strokeWidth={1.5}
                          opacity={0.4}
                          markerEnd="url(#arrow)"
                        />
                      )}
                    </g>
                  );
                })}

                {/* I/O labels */}
                <text
                  x={50}
                  y={160}
                  fontSize={11}
                  fill="currentColor"
                  className="text-muted"
                  textAnchor="middle"
                >
                  Input x (784)
                </text>
                <text
                  x={650}
                  y={160}
                  fontSize={11}
                  fill="currentColor"
                  className="text-muted"
                  textAnchor="middle"
                >
                  Output x̂ ≈ x
                </text>

                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
                  </marker>
                </defs>
              </svg>
            </div>

            {/* ─────────── Bottleneck slider ─────────── */}
            <div className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-sm font-semibold text-foreground">
                  Kích thước bottleneck z
                </label>
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <span>
                    Tỉ lệ nén:{" "}
                    <span className="font-mono text-foreground">
                      {compressionRatio}×
                    </span>
                  </span>
                  <span>·</span>
                  <span>
                    MSE loss:{" "}
                    <span className="font-mono" style={{ color: qualityColor }}>
                      {reconstruction.loss.toFixed(4)}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted w-14">nén mạnh</span>
                <input
                  type="range"
                  min={0}
                  max={BOTTLENECK_OPTIONS.length - 1}
                  step={1}
                  value={currentBottleneckIdx}
                  onChange={(e) =>
                    setBottleneckByIndex(Number(e.target.value))
                  }
                  className="flex-1 accent-accent"
                  aria-label="Bottleneck size"
                />
                <span className="text-[11px] text-muted w-14 text-right">
                  ít nén
                </span>
                <span className="w-16 text-center text-sm font-bold text-accent tabular-nums">
                  z = {bottleneck}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {BOTTLENECK_OPTIONS.map((b, i) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBottleneckByIndex(i)}
                    className={`px-2 py-1 text-[11px] rounded font-mono transition ${
                      b === bottleneck
                        ? "bg-accent text-white"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              <p
                className="text-[11px] leading-relaxed"
                style={{ color: qualityColor }}
              >
                {qualityLabel}
              </p>
            </div>

            {/* ─────────── Reconstruction side-by-side ─────────── */}
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3 text-center">
                So sánh input vs reconstruction
              </p>

              <div className="flex items-center justify-center gap-6 flex-wrap">
                {/* Original */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="grid rounded-lg border border-border overflow-hidden"
                    style={{
                      gridTemplateColumns: "repeat(28, 8px)",
                      gridAutoRows: "8px",
                    }}
                  >
                    {DIGIT_THREE.flat().map((v, k) => (
                      <div
                        key={`orig-${k}`}
                        style={{ background: pxColor(v) }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted font-mono">
                    Input x (28×28 = 784)
                  </span>
                </div>

                <div className="text-accent text-2xl">→</div>

                {/* Bottleneck indicator */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="rounded-lg bg-amber-500/20 border border-amber-500/60 flex items-center justify-center"
                    style={{ width: 224, height: 224 }}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-500 font-mono">
                        z ∈ ℝ
                        <sup>{bottleneck}</sup>
                      </div>
                      <p className="text-xs text-muted mt-2">
                        latent code
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted font-mono">
                    Bottleneck ({bottleneck} số)
                  </span>
                </div>

                <div className="text-accent text-2xl">→</div>

                {/* Reconstruction */}
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    key={bottleneck}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="grid rounded-lg border border-border overflow-hidden"
                    style={{
                      gridTemplateColumns: "repeat(28, 8px)",
                      gridAutoRows: "8px",
                    }}
                  >
                    {reconstruction.grid.map((v, k) => (
                      <div
                        key={`rec-${k}`}
                        style={{ background: pxColor(v) }}
                      />
                    ))}
                  </motion.div>
                  <span className="text-[11px] text-muted font-mono">
                    Output x̂ (784)
                  </span>
                </div>
              </div>

              <p className="mt-4 text-[11px] text-muted text-center leading-relaxed">
                Bottleneck càng nhỏ → càng mờ, nhưng mạng buộc phải học
                <em> bản chất</em> của chữ số (đường cong, hình dạng) thay vì
                nhớ từng pixel.
              </p>
            </div>

            {/* ─────────── 2D Latent space plot ─────────── */}
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Latent space 2D — các chữ số tự phân cụm
                </p>
                <ProgressSteps
                  current={Math.max(
                    1,
                    Math.min(
                      3,
                      bottleneck <= 4 ? 1 : bottleneck <= 32 ? 2 : 3,
                    ),
                  )}
                  total={3}
                  labels={["nén mạnh", "cân bằng", "ít nén"]}
                />
              </div>

              <div className="flex items-start gap-4 flex-wrap">
                <svg
                  viewBox="-5 -5 10 10"
                  className="w-80 h-80 rounded-lg border border-border bg-surface/40"
                  role="img"
                  aria-label="Latent space 2D"
                >
                  {/* Grid */}
                  {Array.from({ length: 11 }, (_, i) => i - 5).map((g) => (
                    <g key={`grid-${g}`}>
                      <line
                        x1={g}
                        y1={-5}
                        x2={g}
                        y2={5}
                        stroke="currentColor"
                        strokeWidth={0.02}
                        opacity={0.2}
                        className="text-muted"
                      />
                      <line
                        x1={-5}
                        y1={g}
                        x2={5}
                        y2={g}
                        stroke="currentColor"
                        strokeWidth={0.02}
                        opacity={0.2}
                        className="text-muted"
                      />
                    </g>
                  ))}

                  {/* Axes */}
                  <line
                    x1={-5}
                    y1={0}
                    x2={5}
                    y2={0}
                    stroke="currentColor"
                    strokeWidth={0.04}
                    opacity={0.5}
                    className="text-muted"
                  />
                  <line
                    x1={0}
                    y1={-5}
                    x2={0}
                    y2={5}
                    stroke="currentColor"
                    strokeWidth={0.04}
                    opacity={0.5}
                    className="text-muted"
                  />

                  {/* Points */}
                  {LATENT_POINTS.map((p, i) => {
                    const isHover =
                      hoveredDigit !== null && p.digit === hoveredDigit;
                    const isDim =
                      hoveredDigit !== null && p.digit !== hoveredDigit;
                    return (
                      <circle
                        key={`pt-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={isHover ? 0.18 : 0.12}
                        fill={pointColor(p.digit)}
                        opacity={isDim ? 0.15 : 0.85}
                        stroke={isHover ? "#000" : "none"}
                        strokeWidth={0.02}
                        style={{
                          transition: "all 0.2s",
                        }}
                      />
                    );
                  })}
                </svg>

                <div className="flex-1 space-y-2 min-w-[180px]">
                  <p className="text-[11px] text-muted leading-relaxed">
                    Mỗi điểm là một ảnh. Hai trục là hai chiều của{" "}
                    <em>bottleneck</em>. Autoencoder không hề được &quot;dạy&quot;
                    nhãn, nhưng các chữ số <strong>tự phân cụm</strong> vì
                    ảnh giống nhau sẽ có latent code gần nhau.
                  </p>

                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {DIGIT_COLORS.map((color, d) => (
                      <button
                        key={`lg-${d}`}
                        type="button"
                        onMouseEnter={() => setHoveredDigit(d)}
                        onMouseLeave={() => setHoveredDigit(null)}
                        className="flex items-center gap-2 text-[11px] px-2 py-1 rounded hover:bg-surface/50 transition text-left"
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ background: color }}
                        />
                        <span className="text-foreground font-mono">
                          chữ số {d}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-muted leading-relaxed pt-2 border-t border-border/40">
                    <strong>Ghi chú:</strong> giữa các cluster có &quot;vùng
                    trống&quot; — nếu sample z từ đó, decoder sinh ra ảnh
                    không giống chữ số nào. Đây là lí do vanilla AE không
                    phải generative model tốt; VAE giải quyết bằng cách ép
                    latent space liên tục.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 3 — AHA MOMENT
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Autoencoder không chỉ nén — nó học ra bản chất.</strong>
            {" "}Bottleneck buộc mạng phải tìm ra đặc trưng quan trọng nhất
            của dữ liệu. Với chữ số viết tay, 2 chiều latent có thể tự học
            ra <em>độ nghiêng</em> và <em>nét dày</em>. Không ai dạy mạng
            khái niệm &quot;độ nghiêng&quot; — nó tự khám phá vì đó là chiều
            biến đổi lớn nhất trong dữ liệu.
          </p>
          <p className="text-sm text-muted mt-2">
            Đây là một ví dụ đẹp của <em>unsupervised learning</em>: mạng tự
            tìm ra cấu trúc ẩn trong dữ liệu, chỉ bằng một nguyên tắc duy
            nhất — <strong>tái tạo lại chính mình</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 4 — DEEPEN: variants overview
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Các biến thể quan trọng">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
            <h4 className="text-sm font-semibold text-blue-500 mb-2">
              Vanilla Autoencoder
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Nén → giải nén. Học biểu diễn nén. Dùng cho giảm chiều, trích
              xuất đặc trưng, pretrain encoder.
            </p>
            <div className="mt-2 flex items-center justify-center gap-1 text-sm">
              <span className="text-blue-500">x</span>
              <span className="text-muted">→</span>
              <span className="text-amber-500 font-bold">z</span>
              <span className="text-muted">→</span>
              <span className="text-green-500">x̂</span>
            </div>
          </div>

          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
            <h4 className="text-sm font-semibold text-purple-500 mb-2">
              Denoising AE
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Input = ảnh bị nhiễu, target = ảnh sạch. Học lọc nhiễu tự động,
              biểu diễn robust hơn.
            </p>
            <div className="mt-2 flex items-center justify-center gap-1 text-sm">
              <span className="text-red-400">x̃</span>
              <span className="text-muted">→</span>
              <span className="text-amber-500 font-bold">z</span>
              <span className="text-muted">→</span>
              <span className="text-green-500">x (sạch)</span>
            </div>
          </div>

          <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-4">
            <h4 className="text-sm font-semibold text-pink-500 mb-2">
              Sparse AE
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Thêm ràng buộc: phần lớn neuron bottleneck phải = 0. Mỗi input
              chỉ kích hoạt vài neuron. Gần với lí thuyết về &quot;neuron
              khái niệm&quot; trong não.
            </p>
            <div className="mt-2 text-center">
              <LaTeX>{`\\mathcal{L} = \\|x - \\hat{x}\\|^2 + \\lambda \\cdot \\text{sparsity}(z)`}</LaTeX>
            </div>
          </div>

          <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
            <h4 className="text-sm font-semibold text-orange-500 mb-2">
              <TopicLink slug="vae">VAE (Variational)</TopicLink>
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Latent space = phân phối xác suất (thường là Gaussian). Có thể
              sinh dữ liệu mới bằng lấy mẫu. Nền tảng cho nhiều generative
              model.
            </p>
            <div className="mt-2 flex items-center justify-center gap-1 text-sm">
              <span className="text-blue-500">x</span>
              <span className="text-muted">→</span>
              <span className="text-amber-500 font-bold">μ, σ</span>
              <span className="text-muted">→ sample →</span>
              <span className="text-green-500">x̂</span>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <h4 className="text-sm font-semibold text-cyan-500 mb-2">
              Contractive AE
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Thêm phạt Jacobian: ép encoder ít nhạy với biến đổi nhỏ của
              input. Kết quả: biểu diễn ổn định, gần như bất biến với nhiễu
              nhỏ.
            </p>
            <div className="mt-2 text-center">
              <LaTeX>{`\\mathcal{L} = \\|x - \\hat{x}\\|^2 + \\lambda \\|\\nabla_x f_\\theta(x)\\|_F^2`}</LaTeX>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <h4 className="text-sm font-semibold text-emerald-500 mb-2">
              Masked AE (MAE)
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Xóa ngẫu nhiên 75% patch của ảnh, bắt mạng tái tạo lại.
              Phương pháp self-supervised mạnh cho pretrain Vision
              Transformer (He et al. 2022).
            </p>
            <div className="mt-2 text-center">
              <span className="text-[11px] text-emerald-500 font-mono">
                x → mask → encoder → decoder → x̂
              </span>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 5 — FIRST CHALLENGE
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh 1">
        <InlineChallenge
          question="Autoencoder có bottleneck = kích thước input (784 → 784 → 784). Mạng sẽ học gì?"
          options={[
            "Học biểu diễn nén hiệu quả như bình thường.",
            "Có thể chỉ học hàm đồng nhất — copy input sang output mà không học gì hữu ích.",
            "Không thể train được — loss luôn bằng 0.",
          ]}
          correct={1}
          explanation="Khi bottleneck ≥ input size, mạng có thể chỉ đơn giản copy input → output (identity mapping). Bottleneck phải NHỎ HƠN input để buộc mạng nén — đây là nguồn gốc tên 'cổ chai'. Denoising AE giải quyết bằng cách thêm nhiễu, buộc mạng phải học bản chất dù bottleneck to."
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 6 — EXPLAIN: formulas, callouts, collapsibles, codeblocks
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Autoencoder</strong> là mạng nơ-ron học ra một cặp hàm:
            một encoder nén dữ liệu và một decoder tái tạo lại. Mục tiêu là
            output giống input nhất có thể, với điều kiện phải đi qua một
            bottleneck thấp chiều.
          </p>

          <LaTeX block>{String.raw`\text{Encoder: } z = f_\theta(x) \in \mathbb{R}^d`}</LaTeX>
          <LaTeX block>{String.raw`\text{Decoder: } \hat{x} = g_\phi(z) \in \mathbb{R}^D`}</LaTeX>
          <LaTeX block>{String.raw`\mathcal{L}(\theta, \phi) = \|x - \hat{x}\|^2 = \|x - g_\phi(f_\theta(x))\|^2`}</LaTeX>

          <p className="text-sm text-muted mt-2">
            Trong đó d &lt;&lt; D (bottleneck nhỏ hơn input). Mạng phải tìm
            cách nén D chiều vào d chiều mà vẫn tái tạo được. Cả θ và φ
            được học qua stochastic gradient descent — <strong>target
            chính là input</strong>, nên autoencoder là self-supervised:
            không cần nhãn.
          </p>

          <Callout variant="insight" title="Autoencoder tuyến tính ≡ PCA">
            <p>
              Autoencoder 1 lớp tuyến tính (không activation, MSE loss) có
              nghiệm tối ưu là phép chiếu lên không gian con của k principal
              component hàng đầu —{" "}
              <strong>chính xác tương đương PCA</strong>. Nhiều lớp + activation
              phi tuyến (ReLU, tanh) → autoencoder mạnh hơn PCA rất nhiều, có
              thể nắm bắt cấu trúc cong trong dữ liệu (manifold). Đây là lí
              do AE còn được gọi là <em>nonlinear PCA</em>.
            </p>
          </Callout>

          <Callout variant="info" title="Ứng dụng thực tế của autoencoder">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Phát hiện bất thường:</strong> Train AE trên dữ liệu
                bình thường (máy móc công nghiệp, giao dịch ngân hàng). Khi
                gặp dữ liệu lạ → reconstruction error cao → flag là anomaly.
              </p>
              <p>
                <strong>Giảm chiều cho visualization:</strong> Latent 2D/3D
                dùng để vẽ dữ liệu phức tạp (giống t-SNE nhưng có encoder học
                được, áp dụng cho điểm mới).
              </p>
              <p>
                <strong>Khử nhiễu:</strong> Denoising AE lọc nhiễu ảnh/audio
                tự động. Dùng rộng rãi trong tiền xử lí ảnh y tế.
              </p>
              <p>
                <strong>Pretrain encoder:</strong> Trong kỉ nguyên chưa có
                ImageNet, AE được dùng để khởi tạo trọng số encoder trước
                khi fine-tune cho task supervised.
              </p>
              <p>
                <strong>Nén đặc biệt:</strong> Autoencoder neural có thể
                nén ảnh y tế hoặc dữ liệu khoa học tốt hơn JPEG cho domain
                cụ thể.
              </p>
            </div>
          </Callout>

          <Callout variant="warning" title="Bẫy thường gặp khi train autoencoder">
            <div className="space-y-2 text-sm">
              <p>
                <strong>1. Identity mapping:</strong> Bottleneck quá to →
                mạng học hàm đồng nhất. Kiểm tra: nếu loss → 0 cực nhanh,
                có thể đây là vấn đề.
              </p>
              <p>
                <strong>2. Posterior collapse (với VAE):</strong> Decoder
                mạnh đến mức bỏ qua z — mạng chỉ học phân phối trung bình.
              </p>
              <p>
                <strong>3. Loss function sai:</strong> MSE giả định
                Gaussian, không phù hợp với ảnh nhị phân — BCE thường tốt
                hơn. Với ảnh màu, perceptual loss (VGG features) cho kết
                quả rõ nét hơn.
              </p>
            </div>
          </Callout>

          <Callout variant="tip" title="Debug autoencoder">
            <p>
              Nếu reconstruction mờ đều trên mọi mẫu: bottleneck quá nhỏ
              hoặc model under-fit. Nếu reconstruction khớp train set nhưng
              xấu trên test: over-fit — thêm dropout / weight decay. Nếu
              latent code collapse (mọi x cho z gần giống nhau): encoder
              quá yếu hoặc decoder quá mạnh. Visualize latent 2D bằng
              t-SNE/UMAP để phát hiện collapse.
            </p>
          </Callout>

          <CollapsibleDetail title="Chứng minh: AE tuyến tính = PCA (chi tiết)">
            <div className="space-y-3 text-sm">
              <p>
                Xét autoencoder tuyến tính: z = W_1 x, x̂ = W_2 z = W_2 W_1
                x, với W_1 ∈ R^{`{d×D}`}, W_2 ∈ R^{`{D×d}`}, d &lt; D.
              </p>
              <p>
                Loss MSE cho N mẫu:
              </p>
              <LaTeX block>{`\\mathcal{L} = \\frac{1}{N} \\sum_{n=1}^N \\|x_n - W_2 W_1 x_n\\|^2`}</LaTeX>
              <p>
                Đặt A = W_2 W_1. Vì rank(A) ≤ d, ta đi tìm ma trận
                &quot;gần&quot; với I nhất có rank ≤ d dưới norm Frobenius,
                weighted theo covariance của x. Định lí Eckart-Young cho:
                nghiệm tối ưu là phép chiếu lên không gian con của d vector
                riêng ứng với eigenvalue lớn nhất của Σ = (1/N) Σ x_n x_n^T
                — đây chính là PCA.
              </p>
              <p>
                Nghĩa là <strong>AE tuyến tính đạt cùng một subspace với PCA</strong>
                {" "}(dù ma trận W_1 không nhất thiết là các eigenvector đơn
                vị — chúng có thể sai khác một xoay trong không gian
                latent).
              </p>
              <p>
                Khi thêm phi tuyến (ReLU giữa các lớp), autoencoder có thể
                học manifold cong — điều PCA không làm được. Đây là lí do
                AE vượt trội PCA trên dữ liệu thực tế (ảnh, âm thanh, văn
                bản).
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chọn loss function cho autoencoder">
            <div className="space-y-3 text-sm">
              <p>
                MSE (||x − x̂||²) là mặc định, nhưng không phải lúc nào cũng
                tối ưu:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Binary Cross-Entropy</strong> cho ảnh nhị phân
                  (MNIST sau khi binarize) hoặc ảnh grayscale normalized
                  [0, 1]. Phạt mạnh hơn khi sai xa biên.
                </li>
                <li>
                  <strong>L1 loss</strong> khi muốn reconstruction sắc
                  cạnh hơn (MSE dễ cho ra ảnh mờ vì phạt quadratic).
                </li>
                <li>
                  <strong>SSIM / Perceptual loss</strong> cho ảnh tự
                  nhiên. Dùng features từ VGG pre-trained làm đại diện
                  cho &quot;giống nhau về ngữ nghĩa&quot; thay vì pixel.
                </li>
                <li>
                  <strong>Adversarial loss</strong> (VAE-GAN) kết hợp AE
                  với discriminator để ép output trông thực.
                </li>
                <li>
                  <strong>Spectral loss</strong> cho audio — so sánh
                  magnitude spectrum thay vì waveform.
                </li>
              </ul>
              <p className="text-muted">
                Một quan sát kinh điển: MSE trên ảnh tự nhiên tạo ra output
                &quot;mờ&quot; vì nó ưa thích giá trị trung bình. Ví dụ,
                với 2 ảnh có thể là đáp án hợp lệ, MSE tối ưu là lấy trung
                bình hai ảnh — thường trông xấu. Perceptual loss giải
                quyết bằng cách đo &quot;giống nhau về nội dung&quot;.
              </p>
            </div>
          </CollapsibleDetail>

          <p className="mt-4">
            Về mặt công thức, loss tổng quát của autoencoder có dạng:
          </p>
          <LaTeX block>{`\\mathcal{L}_{\\text{total}} = \\underbrace{\\mathcal{L}_{\\text{rec}}(x, \\hat{x})}_{\\text{tái tạo}} + \\underbrace{\\lambda \\cdot \\Omega(z, \\theta)}_{\\text{regularizer}}`}</LaTeX>
          <p className="text-sm text-muted">
            Số hạng regularizer thay đổi theo biến thể: sparsity (sparse AE),
            KL divergence (VAE), Jacobian norm (contractive AE), adversarial
            (AAE), v.v.
          </p>

          <CodeBlock language="python" title="autoencoder_mnist.py">
{`import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms


class Autoencoder(nn.Module):
    """MNIST autoencoder: 784 → 128 → 32 → 8 → 32 → 128 → 784."""

    def __init__(self, latent_dim: int = 8):
        super().__init__()
        self.latent_dim = latent_dim

        # ─── Encoder ───
        self.encoder = nn.Sequential(
            nn.Linear(784, 128),
            nn.ReLU(),
            nn.Linear(128, 32),
            nn.ReLU(),
            nn.Linear(32, latent_dim),  # ← Bottleneck!
        )

        # ─── Decoder (đối xứng) ───
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 128),
            nn.ReLU(),
            nn.Linear(128, 784),
            nn.Sigmoid(),  # Output ∈ [0, 1] — phù hợp với ảnh normalized
        )

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        # x: [B, 784] — flatten ảnh 28×28
        z = self.encoder(x)      # [B, latent_dim]
        x_hat = self.decoder(z)  # [B, 784]
        return x_hat, z

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        """Chỉ lấy latent code — dùng cho giảm chiều / anomaly detection."""
        return self.encoder(x)

    def decode(self, z: torch.Tensor) -> torch.Tensor:
        """Generate từ latent — lưu ý: vanilla AE không generative tốt."""
        return self.decoder(z)


# ─── Training loop ───
def train(latent_dim: int = 8, epochs: int = 20, batch_size: int = 256):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Lambda(lambda x: x.view(-1)),  # flatten 28×28 → 784
    ])
    train_ds = datasets.MNIST("./data", train=True, download=True, transform=transform)
    loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)

    model = Autoencoder(latent_dim=latent_dim).to(device)
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    # BCE phù hợp với ảnh normalized [0, 1]
    loss_fn = nn.BCELoss()

    for epoch in range(epochs):
        total = 0.0
        for x, _ in loader:  # bỏ qua nhãn — self-supervised!
            x = x.to(device)
            x_hat, _ = model(x)

            loss = loss_fn(x_hat, x)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total += loss.item() * x.size(0)

        avg = total / len(train_ds)
        print(f"Epoch {epoch + 1:2d}/{epochs} | loss = {avg:.4f}")

    return model


# ─── Sử dụng latent code cho anomaly detection ───
@torch.no_grad()
def anomaly_score(model: Autoencoder, x: torch.Tensor) -> torch.Tensor:
    """Reconstruction error cao → anomaly."""
    x_hat, _ = model(x)
    # Per-sample MSE
    return ((x - x_hat) ** 2).mean(dim=-1)


if __name__ == "__main__":
    model = train(latent_dim=8, epochs=10)

    # Kiểm tra: sample 1 mẫu, xem loss
    x_sample = next(iter(DataLoader(
        datasets.MNIST(
            "./data", train=False, download=True,
            transform=transforms.Compose([
                transforms.ToTensor(),
                transforms.Lambda(lambda x: x.view(-1)),
            ]),
        ),
        batch_size=1,
    )))[0]
    scores = anomaly_score(model, x_sample)
    print(f"Anomaly score: {scores.item():.4f}")`}
          </CodeBlock>

          <CodeBlock language="python" title="denoising_autoencoder.py">
{`"""Denoising Autoencoder — variant quan trọng:
   input = ảnh + nhiễu, target = ảnh sạch.
   Mạng phải hiểu bản chất dữ liệu để lọc nhiễu."""

import torch
import torch.nn as nn


class DenoisingAE(nn.Module):
    """Convolutional Denoising AE cho MNIST."""

    def __init__(self, latent_dim: int = 32):
        super().__init__()

        # Encoder: 28×28 → 14×14 → 7×7 → latent
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 16, 3, stride=2, padding=1),  # 28 → 14
            nn.ReLU(),
            nn.Conv2d(16, 32, 3, stride=2, padding=1),  # 14 → 7
            nn.ReLU(),
            nn.Flatten(),
            nn.Linear(32 * 7 * 7, latent_dim),
        )

        # Decoder: latent → 7×7 → 14×14 → 28×28
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 32 * 7 * 7),
            nn.ReLU(),
            nn.Unflatten(1, (32, 7, 7)),
            nn.ConvTranspose2d(32, 16, 3, stride=2, padding=1, output_padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(16, 1, 3, stride=2, padding=1, output_padding=1),
            nn.Sigmoid(),
        )

    def forward(self, x_noisy):
        z = self.encoder(x_noisy)
        x_hat = self.decoder(z)
        return x_hat


def add_gaussian_noise(x: torch.Tensor, sigma: float = 0.3) -> torch.Tensor:
    """Thêm nhiễu Gaussian. sigma lớn → nhiễu mạnh."""
    return (x + sigma * torch.randn_like(x)).clamp(0, 1)


def train_denoising(model, loader, optimizer, loss_fn, epochs=20, sigma=0.3):
    model.train()
    for epoch in range(epochs):
        total = 0.0
        for x, _ in loader:
            x_clean = x  # target là ảnh sạch
            x_noisy = add_gaussian_noise(x_clean, sigma=sigma)

            x_hat = model(x_noisy)
            # Loss giữa output và ảnh SẠCH (không phải noisy input!)
            loss = loss_fn(x_hat, x_clean)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total += loss.item() * x.size(0)

        print(f"Epoch {epoch + 1:2d} | loss = {total / len(loader.dataset):.4f}")


# Điểm mấu chốt: mạng không thể chỉ copy input sang output
# (vì input ≠ target). Nó BUỘC phải học lọc nhiễu → biểu diễn robust.
#
# Denoising AE là tiền thân của:
#   - BERT: mask 15% token, dự đoán lại → &quot;denoising&quot; trong NLP
#   - MAE (Masked AE): mask 75% patch ảnh → pretrain cho ViT
#   - Diffusion models: denoising lặp lại thành generative mạnh nhất hiện nay`}
          </CodeBlock>

          <p className="mt-4">
            Một cách nhìn đang rất thịnh hành gần đây: <strong>mọi mô hình
            denoising đủ mạnh đều trở thành generative model</strong>.
            Diffusion models (Stable Diffusion, DALL-E 3, Imagen) về cơ bản
            là chuỗi các denoising autoencoder lặp lại — mỗi bước khử một
            ít nhiễu. Bằng cách học phân phối của noise ở mọi mức, chúng có
            thể sinh ảnh từ pure noise. Autoencoder — tưởng chừng chỉ là
            kĩ thuật nén — đang là gốc rễ của generative AI hiện đại.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 7 — SECOND CHALLENGE + SUMMARY
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Thử thách nhanh 2 + Tóm tắt">
        <InlineChallenge
          question="Bạn train AE trên máy bình thường (không bị lỗi). Sau 100 epoch, reconstruction gần như hoàn hảo nhưng sample z ngẫu nhiên từ N(0, I) lại cho ra ảnh vô nghĩa. Lí do?"
          options={[
            "Mạng chưa train đủ lâu.",
            "Latent space của vanilla AE không có cấu trúc prior nào — nên N(0, I) không phải là phân phối mà encoder sinh ra.",
            "Lỗi ở decoder.",
          ]}
          correct={1}
          explanation="Vanilla AE không ràng buộc phân phối của z. Có thể encoder chỉ dùng một vùng bé trong latent space. Sample từ N(0, I) rơi vào vùng encoder chưa bao giờ &quot;thăm&quot; → decoder chưa học cách xử lí → output vô nghĩa. VAE giải quyết bằng KL divergence với N(0, I)."
        />

        <div className="mt-4">
          <MiniSummary
            title="Ghi nhớ về Autoencoder"
            points={[
              "Encoder + Bottleneck + Decoder. Mục tiêu: x̂ ≈ x qua một cổ chai d << D.",
              "Bottleneck buộc mạng học đặc trưng quan trọng nhất — nonlinear PCA.",
              "AE tuyến tính + MSE ≡ PCA. Phi tuyến → mạnh hơn PCA, học được manifold cong.",
              "Ứng dụng: anomaly detection, giảm chiều, khử nhiễu, pretrain encoder.",
              "Điểm yếu: latent space rời rạc → không sinh dữ liệu mới tốt → cần VAE.",
              "Biến thể: Denoising, Sparse, Contractive, VAE, MAE — đều dùng lại khung chung.",
            ]}
          />
        </div>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════════
       * STEP 8 — QUIZ
       * ═══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra hiểu biết">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
