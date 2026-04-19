"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ============================================================================
 *  METADATA
 * ============================================================================
 */
export const metadata: TopicMeta = {
  slug: "batch-normalization",
  title: "Batch Normalization",
  titleVi: "Chuẩn hóa theo lô",
  description:
    "Kỹ thuật chuẩn hóa đầu vào mỗi lớp theo thống kê mini-batch để ổn định gradient, tăng tốc hội tụ, và giảm internal covariate shift.",
  category: "neural-fundamentals",
  tags: ["training", "techniques", "normalization", "regularization"],
  difficulty: "advanced",
  relatedSlugs: [
    "mlp",
    "vanishing-exploding-gradients",
    "regularization",
    "optimizers",
  ],
  vizType: "interactive",
};

/* ============================================================================
 *  CONSTANTS & HELPERS
 * ============================================================================
 */
const TOTAL_STEPS = 10;
const EPSILON = 1e-5;

// Seeded pseudo-random for deterministic renders
function seededRand(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Generate a batch of Gaussian-like samples using Box-Muller transform
function generateBatch(
  size: number,
  mean: number,
  std: number,
  seed: number,
): number[] {
  const vals: number[] = [];
  for (let i = 0; i < size; i++) {
    const u1 = Math.max(0.001, seededRand(seed + i * 2));
    const u2 = seededRand(seed + i * 2 + 1);
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    vals.push(mean + std * normal);
  }
  return vals;
}

// Compute mean & variance of an array
function batchStats(xs: number[]): { mu: number; variance: number; sigma: number } {
  const mu = xs.reduce((s, v) => s + v, 0) / xs.length;
  const variance =
    xs.reduce((s, v) => s + (v - mu) ** 2, 0) / xs.length;
  return { mu, variance, sigma: Math.sqrt(variance + EPSILON) };
}

// Simulate a training loss curve with/without BN (toy model)
function simulateLossCurve(
  epochs: number,
  useBN: boolean,
  seed: number,
): number[] {
  const out: number[] = [];
  const decay = useBN ? 0.82 : 0.94; // BN converges faster
  const noise = useBN ? 0.015 : 0.05; // BN is smoother
  const start = 2.3;
  let current = start;
  for (let e = 0; e < epochs; e++) {
    const wobble = (seededRand(seed + e) - 0.5) * noise;
    current = current * decay + 0.05 + wobble;
    out.push(Math.max(0.05, current));
  }
  return out;
}

// Histogram binning helper
function histogram(values: number[], bins: number, range: [number, number]) {
  const [lo, hi] = range;
  const width = (hi - lo) / bins;
  const counts = new Array(bins).fill(0);
  values.forEach((v) => {
    const idx = Math.min(
      bins - 1,
      Math.max(0, Math.floor((v - lo) / width)),
    );
    counts[idx] += 1;
  });
  return counts.map((c, i) => ({
    binStart: lo + i * width,
    binEnd: lo + (i + 1) * width,
    count: c,
    freq: c / Math.max(1, values.length),
  }));
}

/* ============================================================================
 *  QUIZ QUESTIONS
 * ============================================================================
 */
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question:
      "Batch Normalization khi inference dùng gì thay cho batch statistics (μ, σ của mini-batch)?",
    options: [
      "Tính trên batch hiện tại giống lúc train",
      "Running mean và running variance tích lũy từ quá trình huấn luyện (exponential moving average)",
      "Mean = 0, variance = 1 cố định",
      "Không dùng gì — BN tắt hoàn toàn khi inference",
    ],
    correct: 1,
    explanation:
      "Khi inference, batch có thể chỉ 1 mẫu — không thể tính mean/variance ổn định. Nên BN dùng running statistics (EMA) tích lũy từ lúc train. model.eval() trong PyTorch tự chuyển sang dùng running stats.",
  },
  {
    question: "Tại sao BatchNorm có tham số γ (scale) và β (shift) học được?",
    options: [
      "Để mạng tự quyết định có cần chuẩn hóa hay không — nếu γ=σ và β=μ thì BN bị triệt tiêu, khôi phục phân phối cũ",
      "Chỉ để tăng số tham số cho mạng mạnh hơn",
      "Để thay thế learning rate trong optimizer",
      "γ và β là cố định, không học được",
    ],
    correct: 0,
    explanation:
      "Nếu chuẩn hóa về (0,1) là tối ưu, mạng sẽ học γ=1, β=0. Nhưng nếu phân phối khác tốt hơn, mạng có thể ‘undo’ BN bằng cách học γ=σ_cũ, β=μ_cũ. γ và β đem lại tính biểu diễn tối đa — không hy sinh khả năng học.",
  },
  {
    question:
      "Layer Normalization (LN) chuẩn hóa theo chiều nào? Và vì sao Transformer dùng LN thay vì BN?",
    options: [
      "LN chuẩn hóa theo batch — giống BN chỉ đổi tên",
      "LN chuẩn hóa theo features của TỪNG mẫu — không phụ thuộc batch size, phù hợp sequence có độ dài thay đổi",
      "LN không chuẩn hóa, chỉ scale và shift",
      "Transformer dùng cả BN và LN song song",
    ],
    correct: 1,
    explanation:
      "LN chuẩn hóa trên chiều feature của từng sample → hoạt động tốt với batch_size=1 và với sequence length thay đổi. BN phụ thuộc vào batch nên không phù hợp cho RNN / Transformer, nơi mỗi step có thể có số token khác nhau.",
  },
  {
    type: "fill-blank",
    question:
      "Batch Normalization tính {blank} (μ) và {blank} (σ²) của từng mini-batch, rồi chuẩn hóa về phân phối (0, 1) trước khi scale & shift bằng γ, β học được.",
    blanks: [
      { answer: "trung bình", accept: ["mean", "mu", "μ"] },
      { answer: "phương sai", accept: ["variance", "sigma bình phương", "σ²"] },
    ],
    explanation:
      "Công thức chuẩn hóa: x̂ = (x − μ_batch) / √(σ²_batch + ε). Mỗi mini-batch có trung bình (mean) và phương sai (variance) riêng. Khi inference, dùng running statistics (EMA) tích lũy từ quá trình huấn luyện thay vì batch statistics.",
  },
  {
    question:
      "Khi batch size quá nhỏ (ví dụ 1 hoặc 2), BatchNorm gặp vấn đề gì?",
    options: [
      "Không có vấn đề — BN hoạt động với mọi batch size",
      "Mean và variance ước lượng từ batch quá nhỏ rất ồn, gradient dao động mạnh và model dễ diverge",
      "BN tự động chuyển sang LayerNorm",
      "BN trở nên nhanh hơn vì ít phép tính",
    ],
    correct: 1,
    explanation:
      "μ và σ² ước lượng từ 1-2 mẫu là ước lượng cực kỳ ồn. Khi đó BN đẩy gradient đi lung tung, model khó hội tụ. Giải pháp: tăng batch size, hoặc đổi sang GroupNorm / LayerNorm.",
  },
  {
    question:
      "Thứ tự đúng của BatchNorm trong một block Conv thường là gì?",
    options: [
      "Activation → BN → Conv",
      "Conv → BN → Activation (ReLU)",
      "BN → Conv → Activation",
      "Thứ tự không quan trọng",
    ],
    correct: 1,
    explanation:
      "Thứ tự phổ biến: Conv → BN → ReLU. Bản thân paper gốc đặt BN trước activation để activation nhận input đã chuẩn hóa. (ResNet v2 thử đổi sang BN-ReLU-Conv và cải thiện thêm.)",
  },
  {
    question:
      "BN có tác dụng phụ nào khác ngoài việc ổn định training?",
    options: [
      "Giảm tốc độ training",
      "Có hiệu ứng regularization nhẹ (giống dropout) nhờ noise từ mini-batch",
      "Khiến model cần nhiều dữ liệu hơn",
      "Không có tác dụng nào khác ngoài normalization",
    ],
    correct: 1,
    explanation:
      "Mỗi mini-batch cho μ, σ² hơi khác nhau → thêm noise ngẫu nhiên vào activation. Noise này có tác dụng regularization nhẹ, giảm nhu cầu dùng dropout. Đó là lý do nhiều CNN hiện đại chỉ dùng BN, bỏ dropout.",
  },
  {
    question:
      "Với CNN, BatchNorm 2D (BatchNorm2d) tính μ, σ² trên những chiều nào?",
    options: [
      "Trên chiều channel duy nhất",
      "Trên chiều batch N và hai chiều không gian H, W — cho mỗi channel C một cặp (μ, σ²)",
      "Trên tất cả N, C, H, W cùng lúc",
      "Chỉ trên chiều H, W",
    ],
    correct: 1,
    explanation:
      "BatchNorm2d với tensor [N, C, H, W] tính thống kê qua (N, H, W) cho từng channel C. Nên có C cặp (μ_c, σ²_c) và C cặp (γ_c, β_c). Mỗi channel được chuẩn hóa độc lập.",
  },
];

/* ============================================================================
 *  VISUALIZATION SUB-COMPONENT: HISTOGRAM
 * ============================================================================
 */
interface HistogramProps {
  values: number[];
  label: string;
  color: string;
  range: [number, number];
  bins?: number;
  width?: number;
  height?: number;
}

function HistogramChart({
  values,
  label,
  color,
  range,
  bins = 16,
  width = 320,
  height = 160,
}: HistogramProps) {
  const hist = useMemo(
    () => histogram(values, bins, range),
    [values, bins, range],
  );
  const maxFreq = Math.max(...hist.map((b) => b.freq), 0.01);
  const barW = (width - 40) / bins;
  const stats = useMemo(() => batchStats(values), [values]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted">
          μ = <strong style={{ color }}>{stats.mu.toFixed(2)}</strong>
          {"  "}σ ={" "}
          <strong style={{ color }}>{stats.sigma.toFixed(2)}</strong>
        </span>
      </div>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`histogram ${label}`}
        className="overflow-visible"
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
        />
        {/* baseline */}
        <line
          x1={20}
          x2={width - 20}
          y1={height - 24}
          y2={height - 24}
          stroke="currentColor"
          className="text-border"
        />
        {/* zero marker */}
        {range[0] < 0 && range[1] > 0 && (
          <line
            x1={20 + ((0 - range[0]) / (range[1] - range[0])) * (width - 40)}
            x2={20 + ((0 - range[0]) / (range[1] - range[0])) * (width - 40)}
            y1={8}
            y2={height - 24}
            stroke={color}
            strokeDasharray="3 3"
            opacity={0.35}
          />
        )}
        {hist.map((b, i) => {
          const h = (b.freq / maxFreq) * (height - 40);
          return (
            <motion.rect
              key={i}
              x={20 + i * barW}
              y={height - 24 - h}
              width={Math.max(1, barW - 2)}
              height={h}
              fill={color}
              initial={{ height: 0, y: height - 24 }}
              animate={{ height: h, y: height - 24 - h }}
              transition={{ duration: 0.3, delay: i * 0.015 }}
              opacity={0.85}
              rx={2}
            />
          );
        })}
        {/* axis labels */}
        <text
          x={20}
          y={height - 6}
          fontSize={11}
          className="fill-muted"
          textAnchor="start"
        >
          {range[0].toFixed(0)}
        </text>
        <text
          x={width - 20}
          y={height - 6}
          fontSize={11}
          className="fill-muted"
          textAnchor="end"
        >
          {range[1].toFixed(0)}
        </text>
      </svg>
    </div>
  );
}

/* ============================================================================
 *  VISUALIZATION SUB-COMPONENT: LOSS CURVE
 * ============================================================================
 */
interface LossCurveProps {
  withBN: number[];
  withoutBN: number[];
  width?: number;
  height?: number;
}

function LossCurveChart({
  withBN,
  withoutBN,
  width = 520,
  height = 200,
}: LossCurveProps) {
  const maxLoss = Math.max(...withBN, ...withoutBN, 2.4);
  const epochs = withBN.length;
  const xStep = (width - 40) / Math.max(1, epochs - 1);

  const mkPath = (series: number[]) =>
    series
      .map((v, i) => {
        const x = 24 + i * xStep;
        const y = height - 28 - (v / maxLoss) * (height - 50);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg width={width} height={height} role="img" aria-label="loss curve">
      {/* grid */}
      {Array.from({ length: 5 }).map((_, g) => {
        const y = 12 + g * ((height - 40) / 4);
        return (
          <line
            key={g}
            x1={24}
            x2={width - 12}
            y1={y}
            y2={y}
            stroke="currentColor"
            className="text-border"
            opacity={0.25}
          />
        );
      })}
      {/* x axis */}
      <line
        x1={24}
        x2={width - 12}
        y1={height - 28}
        y2={height - 28}
        stroke="currentColor"
        className="text-border"
      />
      {/* without BN — red */}
      <motion.path
        d={mkPath(withoutBN)}
        fill="none"
        stroke="#ef4444"
        strokeWidth={2.4}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9 }}
      />
      {/* with BN — accent */}
      <motion.path
        d={mkPath(withBN)}
        fill="none"
        stroke="currentColor"
        className="text-accent"
        strokeWidth={2.6}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: 0.2 }}
      />
      {/* labels */}
      <text
        x={width - 16}
        y={20}
        fontSize={11}
        textAnchor="end"
        className="fill-accent font-semibold"
      >
        Có BN
      </text>
      <text
        x={width - 16}
        y={36}
        fontSize={11}
        textAnchor="end"
        fill="#ef4444"
        className="font-semibold"
      >
        Không BN
      </text>
      <text
        x={24}
        y={height - 10}
        fontSize={11}
        className="fill-muted"
      >
        epoch 0
      </text>
      <text
        x={width - 12}
        y={height - 10}
        fontSize={11}
        textAnchor="end"
        className="fill-muted"
      >
        epoch {epochs}
      </text>
      <text
        x={12}
        y={16}
        fontSize={11}
        className="fill-muted"
      >
        loss {maxLoss.toFixed(1)}
      </text>
    </svg>
  );
}

/* ============================================================================
 *  MAIN COMPONENT
 * ============================================================================
 */
export default function BatchNormalizationTopic() {
  /* --------------------------- STATE --------------------------- */
  const [batchSize, setBatchSize] = useState(32);
  const [batchMean, setBatchMean] = useState(6.0);
  const [batchStd, setBatchStd] = useState(3.5);
  const [gamma, setGamma] = useState(1.0);
  const [beta, setBeta] = useState(0.0);
  const [bnStep, setBnStep] = useState<0 | 1 | 2>(0);
  const [epochs, setEpochs] = useState(30);

  /* --------------------------- DATA --------------------------- */
  const rawValues = useMemo(
    () => generateBatch(batchSize, batchMean, batchStd, 42),
    [batchSize, batchMean, batchStd],
  );

  const stats = useMemo(() => batchStats(rawValues), [rawValues]);

  const normalized = useMemo(
    () => rawValues.map((v) => (v - stats.mu) / stats.sigma),
    [rawValues, stats],
  );

  const scaled = useMemo(
    () => normalized.map((v) => v * gamma + beta),
    [normalized, gamma, beta],
  );

  const displayValues =
    bnStep === 0 ? rawValues : bnStep === 1 ? normalized : scaled;

  const displayLabel =
    bnStep === 0
      ? "Trước BN — phân phối gốc"
      : bnStep === 1
        ? "Sau chuẩn hóa — μ≈0, σ≈1"
        : `Sau γ=${gamma.toFixed(2)}, β=${beta.toFixed(2)}`;

  /* Loss curves for the training demo */
  const lossWithBN = useMemo(
    () => simulateLossCurve(epochs, true, 17),
    [epochs],
  );
  const lossWithoutBN = useMemo(
    () => simulateLossCurve(epochs, false, 17),
    [epochs],
  );

  /* Running stats simulation (EMA) — for inference explanation */
  const runningStats = useMemo(() => {
    let runMu = 0;
    let runVar = 1;
    const momentum = 0.1;
    const history: { epoch: number; runMu: number; runVar: number }[] = [];
    for (let e = 0; e < Math.min(epochs, 20); e++) {
      const batch = generateBatch(batchSize, batchMean, batchStd, 100 + e);
      const s = batchStats(batch);
      runMu = (1 - momentum) * runMu + momentum * s.mu;
      runVar = (1 - momentum) * runVar + momentum * s.variance;
      history.push({ epoch: e, runMu, runVar });
    }
    return history;
  }, [epochs, batchSize, batchMean, batchStd]);

  /* --------------------------- CALLBACKS --------------------------- */
  const resetScale = useCallback(() => {
    setGamma(1.0);
    setBeta(0.0);
  }, []);

  const undoBN = useCallback(() => {
    setGamma(stats.sigma);
    setBeta(stats.mu);
  }, [stats]);

  /* --------------------------- RENDER --------------------------- */
  return (
    <>
      {/* ============================================================
       *  STEP 1 — PREDICTION GATE
       * ============================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-3">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Khám phá BN",
              "Batch size",
              "Loss curves",
              "A-ha",
              "Thử thách nhanh",
              "Công thức & code",
              "Running stats",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>
        <PredictionGate
          question="Lớp 1 chấm thang 100, lớp 2 thang 10, lớp 3 dùng chữ A–F. Muốn so sánh điểm công bằng, bạn làm gì?"
          options={[
            "So sánh trực tiếp — điểm là điểm",
            "Quy tất cả về cùng một thang (trung bình 0, độ lệch 1) rồi mới so sánh",
            "Bỏ qua lớp có thang khác",
            "Chỉ lấy điểm trung bình của mỗi lớp",
          ]}
          correct={1}
          explanation="Chuẩn hóa về cùng thang — đó chính là tinh thần của Batch Normalization. Trong mạng nơ-ron, mỗi lớp có phân phối activation khác nhau; BN chuẩn hóa về (μ=0, σ=1) để lớp sau luôn nhận input ổn định, bất kể các lớp trước đã thay đổi ra sao."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Khi phân phối đầu vào thay đổi liên tục giữa các lớp (hiện tượng{" "}
            <em>internal covariate shift</em>), mạng phải liên tục{" "}
            <strong>thích nghi lại</strong> thay vì học điều mới. BN giải quyết
            bằng cách chuẩn hóa tại mỗi lớp — đồng thời giảm nhẹ vấn đề{" "}
            <TopicLink slug="vanishing-exploding-gradients">
              vanishing/exploding gradients
            </TopicLink>
            . Bạn sẽ <strong className="text-foreground">tự tay thử</strong>{" "}
            quy trình 3 bước ngay dưới đây.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ============================================================
       *  STEP 2 — INTERACTIVE VISUALIZATION (BN 3 STEPS)
       * ============================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá BN">
        <p className="mb-3 text-sm text-foreground leading-relaxed">
          BN gồm 3 bước: (1) tính μ, σ² của batch, (2) chuẩn hóa về (0, 1),
          (3) scale bằng γ rồi shift bằng β. Dùng nút dưới để xem từng bước,
          kéo các slider để thay đổi phân phối gốc và các tham số học được.
        </p>

        <VisualizationSection topicSlug="batch-normalization">
          <div className="space-y-5">
            {/* Step tabs */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { s: 0 as const, label: "1. Trước BN" },
                { s: 1 as const, label: "2. Chuẩn hóa" },
                { s: 2 as const, label: "3. Scale + Shift" },
              ].map(({ s, label }) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setBnStep(s)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    bnStep === s
                      ? "bg-accent text-white shadow"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Controls row 1: raw distribution */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-muted">
                  Batch size:{" "}
                  <strong className="text-foreground">{batchSize}</strong>
                </label>
                <input
                  type="range"
                  min={2}
                  max={128}
                  step={2}
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">
                  Trung bình gốc (μ):{" "}
                  <strong className="text-foreground">
                    {batchMean.toFixed(1)}
                  </strong>
                </label>
                <input
                  type="range"
                  min={-10}
                  max={20}
                  step={0.5}
                  value={batchMean}
                  onChange={(e) => setBatchMean(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">
                  Độ lệch gốc (σ):{" "}
                  <strong className="text-foreground">
                    {batchStd.toFixed(1)}
                  </strong>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={batchStd}
                  onChange={(e) => setBatchStd(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>

            {/* Controls row 2: scale & shift (only step 2) */}
            {bnStep === 2 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted">
                    γ (scale, học được):{" "}
                    <strong className="text-foreground">
                      {gamma.toFixed(2)}
                    </strong>
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={5}
                    step={0.05}
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted">
                    β (shift, học được):{" "}
                    <strong className="text-foreground">
                      {beta.toFixed(2)}
                    </strong>
                  </label>
                  <input
                    type="range"
                    min={-5}
                    max={5}
                    step={0.1}
                    value={beta}
                    onChange={(e) => setBeta(parseFloat(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <button
                    type="button"
                    onClick={resetScale}
                    className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
                  >
                    Reset γ=1, β=0
                  </button>
                  <button
                    type="button"
                    onClick={undoBN}
                    className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
                  >
                    {"Học 'undo' (γ=σ, β=μ)"}
                  </button>
                </div>
              </div>
            )}

            {/* Histograms: current + reference */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <HistogramChart
                values={rawValues}
                label="Trước BN"
                color="#ef4444"
                range={[batchMean - 4 * batchStd, batchMean + 4 * batchStd]}
              />
              <HistogramChart
                values={displayValues}
                label={displayLabel}
                color="currentColor"
                range={
                  bnStep === 0
                    ? [batchMean - 4 * batchStd, batchMean + 4 * batchStd]
                    : bnStep === 1
                      ? [-4, 4]
                      : [beta - 4 * gamma, beta + 4 * gamma]
                }
              />
            </div>

            {/* Formula callout that swaps per step */}
            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              {bnStep === 0 && (
                <p className="text-sm text-muted">
                  Activation gốc có μ ={" "}
                  <strong className="text-foreground">
                    {stats.mu.toFixed(2)}
                  </strong>{" "}
                  và σ ={" "}
                  <strong className="text-foreground">
                    {stats.sigma.toFixed(2)}
                  </strong>
                  . Lớp sau khó học nếu phân phối này thay đổi mỗi batch.
                </p>
              )}
              {bnStep === 1 && (
                <div className="space-y-2">
                  <LaTeX block>{`\\hat{x}_i = \\frac{x_i - \\mu_{\\mathcal{B}}}{\\sqrt{\\sigma^2_{\\mathcal{B}} + \\varepsilon}}`}</LaTeX>
                  <p className="text-xs text-muted">
                    Sau khi trừ μ và chia σ, phân phối mới có μ ≈ 0, σ ≈ 1. Lớp
                    sau nhận input ổn định.
                  </p>
                </div>
              )}
              {bnStep === 2 && (
                <div className="space-y-2">
                  <LaTeX block>{`y_i = \\gamma \\hat{x}_i + \\beta`}</LaTeX>
                  <p className="text-xs text-muted">
                    γ và β là tham số{" "}
                    <strong className="text-foreground">học được</strong>. Nếu
                    mạng muốn giữ phân phối gốc, nó sẽ học γ = σ, β = μ — tức
                    là BN có thể “tự triệt tiêu” khi cần.
                  </p>
                </div>
              )}
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ============================================================
       *  STEP 3 — BATCH SIZE EFFECT
       * ============================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Batch size quan trọng">
        <p className="mb-3 text-sm text-foreground leading-relaxed">
          Kéo batch size ở trên xuống 2 rồi lên lại 128 để thấy phân phối sau
          BN ổn định ra sao. Batch quá nhỏ → ước lượng μ, σ² quá ồn → BN phản
          tác dụng.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              n: 2,
              tone: "warning" as const,
              title: "N = 2",
              body: "μ, σ² ước lượng từ 2 mẫu cực kỳ ồn. BN có thể làm training diverge. Dùng GroupNorm thay thế.",
            },
            {
              n: 32,
              tone: "tip" as const,
              title: "N = 32",
              body: "Sweet spot cho hầu hết CNN. Đủ mẫu để μ, σ² ổn định, vẫn đủ noise để regularization.",
            },
            {
              n: 128,
              tone: "info" as const,
              title: "N = 128",
              body: "Thống kê rất ổn định. Với GPU lớn đây là lựa chọn tốt. Nhưng ít regularization hơn.",
            },
          ].map((c) => (
            <Callout key={c.n} variant={c.tone} title={c.title}>
              {c.body}
            </Callout>
          ))}
        </div>
      </LessonSection>

      {/* ============================================================
       *  STEP 4 — TRAINING LOSS WITH vs WITHOUT BN
       * ============================================================ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Training với/không BN">
        <p className="mb-3 text-sm text-foreground leading-relaxed">
          So sánh loss qua các epoch trên cùng một kiến trúc (mô phỏng toy).
          BN giúp hội tụ nhanh hơn và loss mượt hơn. Kéo số epoch để xem xu
          hướng dài hạn.
        </p>

        <VisualizationSection topicSlug="batch-normalization">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted">
                Số epoch:{" "}
                <strong className="text-foreground">{epochs}</strong>
              </label>
              <input
                type="range"
                min={10}
                max={60}
                step={1}
                value={epochs}
                onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
                className="w-full accent-accent"
              />
            </div>

            <div className="flex justify-center">
              <LossCurveChart
                withBN={lossWithBN}
                withoutBN={lossWithoutBN}
                width={520}
                height={200}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-semibold text-accent mb-1">
                  Có BN
                </p>
                <p className="text-[11px] text-muted leading-relaxed">
                  Loss cuối ≈{" "}
                  <strong className="text-foreground">
                    {lossWithBN[lossWithBN.length - 1].toFixed(3)}
                  </strong>
                  . Hội tụ nhanh. Có thể dùng learning rate cao hơn mà không
                  diverge.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-semibold text-red-500 mb-1">
                  Không BN
                </p>
                <p className="text-[11px] text-muted leading-relaxed">
                  Loss cuối ≈{" "}
                  <strong className="text-foreground">
                    {lossWithoutBN[lossWithoutBN.length - 1].toFixed(3)}
                  </strong>
                  . Chậm hơn, loss dao động mạnh hơn, nhạy cảm với khởi tạo.
                </p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ============================================================
       *  STEP 5 — AHA MOMENT
       * ============================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Batch Normalization</strong> không chỉ là phép{" "}
            “trừ trung bình, chia độ lệch” — nó còn có{" "}
            <strong>γ và β học được</strong>. Nếu chuẩn hóa là tối ưu, mạng
            giữ γ=1, β=0. Nếu không, mạng có thể học γ=σ, β=μ để{" "}
            <em>triệt tiêu BN</em>. Nghĩa là: BN không bao giờ hạn chế khả
            năng biểu diễn — nó chỉ mở thêm lựa chọn dễ học hơn.
          </p>
          <p className="text-sm text-muted mt-1">
            Đó là lý do BN (và các biến thể LN, GN, IN) gần như luôn có mặt
            trong kiến trúc hiện đại: lợi ích rõ ràng, chi phí cực nhỏ, và
            không hy sinh expressivity.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ============================================================
       *  STEP 6 — INLINE CHALLENGES (x2)
       * ============================================================ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <div className="space-y-4">
          <InlineChallenge
            question="Bạn huấn luyện CNN với batch size 4 trên GPU nhỏ. Training bị diverge khi thêm BatchNorm2d. Lý do có khả năng cao nhất?"
            options={[
              "BN luôn làm diverge, phải bỏ đi",
              "Batch 4 quá nhỏ → μ, σ² ước lượng ồn → gradient dao động mạnh. Dùng GroupNorm hoặc tăng batch size qua gradient accumulation",
              "Phải thêm dropout cùng BN",
              "Phải đặt BN sau activation",
            ]}
            correct={1}
            explanation="BN cần batch đủ lớn để μ, σ² ổn định. Batch 4 là quá ít. Giải pháp: (1) GroupNorm không phụ thuộc batch, (2) SyncBN nếu có multi-GPU, (3) Gradient accumulation để có effective batch lớn hơn."
          />
          <InlineChallenge
            question="Tại inference bạn gửi từng ảnh một (batch=1). Nếu BN dùng batch stats lúc này, chuyện gì xảy ra?"
            options={[
              "σ² = 0 với batch=1 → chia cho 0 → NaN. Vì vậy inference phải dùng running mean/variance đã tích lũy lúc train",
              "Không sao, BN vẫn hoạt động bình thường",
              "Ảnh sẽ bị đổi màu ngẫu nhiên",
              "Model tự tắt BN khi batch=1",
            ]}
            correct={0}
            explanation="Với batch=1, variance trong batch đó = 0 → chia 0. Nên trong PyTorch, model.eval() chuyển BN sang dùng running_mean và running_var (EMA tích lũy lúc training). Luôn gọi model.eval() trước inference."
          />
        </div>
      </LessonSection>

      {/* ============================================================
       *  STEP 7 — EXPLANATION: FORMULAS & CODE
       * ============================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Công thức & code">
        <ExplanationSection topicSlug="batch-normalization">
          <p>
            Ý tưởng cốt lõi: trong một mini-batch{" "}
            <LaTeX>{`\\mathcal{B} = \\{x_1, \\dots, x_m\\}`}</LaTeX>, tính
            thống kê của chính batch và dùng chúng để chuẩn hóa mỗi activation.
            Sau đó scale bằng γ và shift bằng β — hai tham số học được cho phép
            mạng tự quyết định muốn chuẩn hóa đến đâu.
          </p>

          <Callout variant="insight" title="Bốn bước của BN (training)">
            <div className="space-y-2">
              <p>1. Trung bình batch:</p>
              <LaTeX block>{`\\mu_{\\mathcal{B}} = \\frac{1}{m} \\sum_{i=1}^{m} x_i`}</LaTeX>
              <p>2. Phương sai batch:</p>
              <LaTeX block>{`\\sigma^2_{\\mathcal{B}} = \\frac{1}{m} \\sum_{i=1}^{m} (x_i - \\mu_{\\mathcal{B}})^2`}</LaTeX>
              <p>3. Chuẩn hóa:</p>
              <LaTeX block>{`\\hat{x}_i = \\frac{x_i - \\mu_{\\mathcal{B}}}{\\sqrt{\\sigma^2_{\\mathcal{B}} + \\varepsilon}}`}</LaTeX>
              <p>4. Scale & shift:</p>
              <LaTeX block>{`y_i = \\gamma \\hat{x}_i + \\beta`}</LaTeX>
            </div>
          </Callout>

          <Callout variant="info" title="Running statistics cho inference">
            <p>
              Khi training, ngoài dùng μ, σ² của batch hiện tại, BN còn cập nhật
              EMA (exponential moving average) để dành cho inference:
            </p>
            <LaTeX block>{`\\mu_{\\text{run}} \\leftarrow (1 - \\rho)\\mu_{\\text{run}} + \\rho\\,\\mu_{\\mathcal{B}}`}</LaTeX>
            <LaTeX block>{`\\sigma^2_{\\text{run}} \\leftarrow (1 - \\rho)\\sigma^2_{\\text{run}} + \\rho\\,\\sigma^2_{\\mathcal{B}}`}</LaTeX>
            <p className="mt-2 text-sm">
              Với <LaTeX>{`\\rho`}</LaTeX> = momentum (PyTorch mặc định 0.1).
              Khi{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-xs">
                model.eval()
              </code>
              , BN chuyển sang dùng{" "}
              <LaTeX>{`\\mu_{\\text{run}}, \\sigma^2_{\\text{run}}`}</LaTeX>.
            </p>
          </Callout>

          <Callout variant="warning" title="Những cái bẫy thường gặp">
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                Quên gọi <code>model.eval()</code> trước inference → BN dùng
                batch stats của 1 ảnh → kết quả lộn xộn.
              </li>
              <li>
                Dùng BN với batch rất nhỏ → μ, σ² ồn → diverge. Đổi sang
                GroupNorm / LayerNorm.
              </li>
              <li>
                BN trong RNN không tự nhiên vì sequence length thay đổi; đó là
                lý do Transformer mặc định dùng LayerNorm.
              </li>
              <li>
                Nếu fine-tune trên domain mới với batch khác biệt hoàn toàn,
                running stats cũ có thể không còn phù hợp. Cân nhắc{" "}
                <code>track_running_stats=True</code> và thời gian warm-up.
              </li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="pytorch_batchnorm2d.py">
{`import torch
import torch.nn as nn

class ConvBlock(nn.Module):
    """Conv2d -> BatchNorm2d -> ReLU: khối chuẩn của CNN hiện đại."""

    def __init__(self, in_ch: int, out_ch: int, kernel_size: int = 3):
        super().__init__()
        self.conv = nn.Conv2d(
            in_ch, out_ch, kernel_size,
            padding=kernel_size // 2,
            bias=False,  # BN có beta => bias của conv thừa
        )
        # BatchNorm2d: tính thống kê trên (N, H, W) cho từng channel C.
        # num_features = out_ch => có out_ch cặp (gamma, beta),
        # (running_mean, running_var).
        self.bn = nn.BatchNorm2d(
            num_features=out_ch,
            eps=1e-5,
            momentum=0.1,           # EMA cho running stats
            affine=True,            # bật gamma, beta học được
            track_running_stats=True,
        )
        self.act = nn.ReLU(inplace=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.act(self.bn(self.conv(x)))


# Ví dụ sử dụng
model = nn.Sequential(
    ConvBlock(3, 64),
    ConvBlock(64, 128),
    nn.AdaptiveAvgPool2d(1),
    nn.Flatten(),
    nn.Linear(128, 10),
)

# Training mode: BN dùng batch stats và update running stats.
model.train()
x = torch.randn(32, 3, 32, 32)   # batch 32, giống CIFAR
out = model(x)
print("train output:", out.shape)

# Inference: BN dùng running_mean, running_var.
model.eval()
with torch.no_grad():
    single = torch.randn(1, 3, 32, 32)
    pred = model(single)
    print("eval output:", pred.shape)

# Freeze BN (khi fine-tune)
for m in model.modules():
    if isinstance(m, nn.BatchNorm2d):
        m.eval()                  # đóng băng running stats
        for p in m.parameters():
            p.requires_grad = False`}
          </CodeBlock>

          <CodeBlock language="python" title="custom_batchnorm.py">
{`class MyBatchNorm2d(nn.Module):
    """Viết tay BatchNorm2d để hiểu kĩ bên trong."""

    def __init__(self, num_features: int, momentum: float = 0.1,
                 eps: float = 1e-5):
        super().__init__()
        self.num_features = num_features
        self.momentum = momentum
        self.eps = eps
        # Học được
        self.gamma = nn.Parameter(torch.ones(num_features))
        self.beta = nn.Parameter(torch.zeros(num_features))
        # Buffer: không học, nhưng lưu cùng state_dict
        self.register_buffer("running_mean", torch.zeros(num_features))
        self.register_buffer("running_var", torch.ones(num_features))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (N, C, H, W)
        if self.training:
            dims = (0, 2, 3)
            mu = x.mean(dim=dims)
            var = x.var(dim=dims, unbiased=False)
            # update running stats
            with torch.no_grad():
                self.running_mean.mul_(1 - self.momentum).add_(
                    mu, alpha=self.momentum
                )
                self.running_var.mul_(1 - self.momentum).add_(
                    var, alpha=self.momentum
                )
        else:
            mu = self.running_mean
            var = self.running_var

        x_hat = (x - mu[None, :, None, None]) / torch.sqrt(
            var[None, :, None, None] + self.eps
        )
        return (
            self.gamma[None, :, None, None] * x_hat
            + self.beta[None, :, None, None]
        )`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ============================================================
       *  STEP 8 — COLLAPSIBLE DETAILS
       * ============================================================ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Chi tiết nâng cao">
        <div className="space-y-3">
          <CollapsibleDetail title="So sánh BN, LayerNorm, GroupNorm, InstanceNorm">
            <div className="space-y-2 text-sm">
              <p>
                Các biến thể norm khác nhau ở chỗ <strong>chọn chiều nào</strong>{" "}
                để tính μ, σ²:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>
                  <strong>BatchNorm</strong>: qua batch N và không gian H, W
                  cho mỗi channel C. Mặc định CNN cỡ vừa/ lớn.
                </li>
                <li>
                  <strong>LayerNorm</strong>: qua toàn bộ feature của từng mẫu.
                  Không phụ thuộc batch. Chuẩn của{" "}
                  <TopicLink slug="transformer">Transformer</TopicLink>.
                </li>
                <li>
                  <strong>GroupNorm</strong>: chia C thành G nhóm, norm trong
                  mỗi nhóm. Tốt cho batch nhỏ.
                </li>
                <li>
                  <strong>InstanceNorm</strong>: norm qua H, W cho mỗi
                  (sample, channel). Style transfer thường dùng.
                </li>
              </ul>
              <p className="text-xs text-muted">
                Quy tắc ngón tay: CNN, batch &gt; 16 → BN. CNN, batch nhỏ → GN.
                RNN / Transformer → LN. Generative / style transfer → IN.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Tại sao 'internal covariate shift' có thể không phải lý do thật?">
            <div className="space-y-2 text-sm">
              <p>
                Paper gốc (Ioffe &amp; Szegedy, 2015) giải thích BN hiệu quả
                nhờ giảm <em>internal covariate shift</em>: phân phối đầu vào
                của mỗi lớp không đổi quá nhiều giữa các bước.
              </p>
              <p>
                Santurkar et al. (2018, “How Does Batch Normalization Help
                Optimization?”) chỉ ra rằng giả thuyết này có thể không phải
                lý do thật. Qua thí nghiệm họ cho thấy BN{" "}
                <strong>làm mượt landscape của hàm loss</strong>: gradient ổn
                định hơn, có thể dùng learning rate lớn hơn, và bước đi ít
                hỗn loạn.
              </p>
              <p className="text-xs text-muted">
                Dù lý do chính thống là gì, hiệu quả thực nghiệm của BN vẫn
                rất rõ — và đó mới là điều các kỹ sư quan tâm.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* ============================================================
       *  STEP 9 — RUNNING STATS TABLE + MINI SUMMARY
       * ============================================================ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Running stats & tóm tắt">
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm text-foreground">
            Mô phỏng EMA cho μ và σ² trong{" "}
            <strong>{runningStats.length}</strong> epoch đầu:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className="py-1 text-left">Epoch</th>
                  <th className="py-1 text-right">running μ</th>
                  <th className="py-1 text-right">running σ²</th>
                </tr>
              </thead>
              <tbody>
                {runningStats
                  .filter((_, i) => i % 2 === 0) // every other row for compactness
                  .map((r) => (
                    <tr key={r.epoch} className="border-b border-border/40">
                      <td className="py-1 text-foreground">{r.epoch}</td>
                      <td className="py-1 text-right text-foreground">
                        {r.runMu.toFixed(3)}
                      </td>
                      <td className="py-1 text-right text-foreground">
                        {r.runVar.toFixed(3)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Với momentum 0.1, sau vài epoch running stats đã hội tụ về gần
            batch stats thực tế. Đây chính là con số BN dùng khi{" "}
            <code>model.eval()</code>.
          </p>
        </div>

        <MiniSummary
          title="Ghi nhớ về Batch Normalization"
          points={[
            "BN chuẩn hóa mỗi mini-batch về μ ≈ 0, σ ≈ 1 rồi scale bằng γ và shift bằng β học được.",
            "Hiệu ứng: ổn định gradient, cho phép learning rate lớn hơn, hội tụ nhanh hơn, regularization nhẹ.",
            "Khi inference BN dùng running mean/variance (EMA) — nhớ gọi model.eval() trước khi predict.",
            "Batch quá nhỏ → μ, σ² ồn → model dễ diverge. Chuyển sang GroupNorm hoặc tăng effective batch.",
            "BN dùng cho CNN; LayerNorm cho Transformer/RNN; GroupNorm cho batch nhỏ; InstanceNorm cho style transfer.",
            "γ=σ và β=μ sẽ ‘undo’ BN — chứng tỏ BN không hy sinh khả năng biểu diễn, chỉ nới thêm lựa chọn.",
          ]}
        />
      </LessonSection>

      {/* ============================================================
       *  STEP 10 — QUIZ
       * ============================================================ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}

/* ============================================================================
 *  END OF FILE — batch-normalization.tsx
 *
 *  Notes for future maintainers:
 *   - All text is Vietnamese on purpose (UX language).
 *   - HistogramChart and LossCurveChart are inlined intentionally: they are
 *     too specific to this topic to promote to /components/interactive.
 *   - If you add more interactive bits, keep TOTAL_STEPS in sync with the
 *     ProgressSteps labels array at the top of the main component.
 *   - Running stats table is illustrative — real PyTorch BN updates happen
 *     inside the C++ kernel; we simulate the math here only to make the idea
 *     visible to learners.
 *   - γ/β sliders intentionally extend to values large enough that learners
 *     can see the "undo BN" case (γ=σ, β=μ) by clicking the button.
 *   - The loss simulation is a toy (exponential decay + noise) — it is NOT a
 *     replacement for a real benchmark. Its purpose is to show the *shape* of
 *     the effect (faster convergence, less wobble), not precise numbers.
 * ============================================================================
 */
