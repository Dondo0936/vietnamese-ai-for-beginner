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

export const metadata: TopicMeta = {
  slug: "lora",
  title: "LoRA",
  titleVi: "LoRA - Tinh chỉnh hạng thấp",
  description:
    "Kỹ thuật tinh chỉnh hiệu quả, chỉ huấn luyện ma trận nhỏ thay vì toàn bộ mô hình.",
  category: "training-optimization",
  tags: ["lora", "peft", "fine-tuning", "efficiency"],
  difficulty: "intermediate",
  relatedSlugs: ["fine-tuning", "qlora", "quantization"],
  vizType: "interactive",
};

const TOTAL_STEPS = 10;
const STEP_LABELS = [
  "Dự đoán",
  "Khám phá",
  "Aha",
  "Thử thách",
  "Lý thuyết",
  "So sánh QLoRA",
  "Code PEFT",
  "Thử thách 2",
  "Tóm tắt",
  "Quiz",
];

/* ============================================================
 * Helper: compute parameter counts for full fine-tune vs LoRA.
 * The formula is W in R^{d_out x d_in}. LoRA uses A in R^{r x d_in}
 * and B in R^{d_out x r}, so A has r * d_in trainable params and
 * B has d_out * r trainable params.
 * ============================================================ */
function computeParamCounts(dIn: number, dOut: number, r: number) {
  const full = dIn * dOut;
  const lora = r * dIn + dOut * r;
  const ratio = (lora / full) * 100;
  const saved = full - lora;
  return {
    full,
    lora,
    ratio,
    saved,
    ratioLabel: ratio < 0.01 ? ratio.toExponential(2) : ratio.toFixed(3),
  };
}

/* ============================================================
 * Helper: format large integer counts with a Vietnamese-ish
 * compact suffix (K, M, B) so students can compare visually.
 * ============================================================ */
function formatCompact(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

/* ============================================================
 * Helper: estimate memory footprint in MB/GB. We assume fp16
 * weights at 2 bytes per parameter (full fine-tune), int4 at
 * 0.5 bytes per param (QLoRA base), and fp16 for LoRA adapters.
 * Optimizer state (Adam) adds 8 bytes per trainable param.
 * ============================================================ */
function estimateMemory(trainable: number, frozen: number, base4bit: boolean) {
  const weightBytes = base4bit ? 0.5 : 2;
  const frozenBytes = frozen * weightBytes;
  const trainableBytes = trainable * 2; // fp16 adapters always
  const optimizerBytes = trainable * 8; // Adam: m + v at fp32
  const gradientBytes = trainable * 2; // fp16 grads for adapters
  const total = frozenBytes + trainableBytes + optimizerBytes + gradientBytes;
  return {
    frozenGB: frozenBytes / 1e9,
    trainableMB: trainableBytes / 1e6,
    optimizerMB: optimizerBytes / 1e6,
    gradientMB: gradientBytes / 1e6,
    totalGB: total / 1e9,
  };
}

/* ============================================================
 * Quiz - 8 carefully layered questions. We mix recall, applied
 * computation, and conceptual contrast so students have to
 * think about the trade-offs rather than memorize.
 * ============================================================ */
const QUIZ: QuizQuestion[] = [
  {
    question: "LoRA tiết kiệm bộ nhớ bằng cách nào?",
    options: [
      "Xoá bớt lớp trong mô hình gốc để thu nhỏ kích thước",
      "Đóng băng trọng số gốc, chỉ huấn luyện hai ma trận nhỏ A và B có tích bằng thay đổi cần thiết",
      "Nén toàn bộ mô hình xuống 4-bit rồi huấn luyện bình thường",
      "Giảm kích thước batch size khi huấn luyện",
    ],
    correct: 1,
    explanation:
      "LoRA giữ nguyên W gốc (đóng băng), chỉ học hai ma trận hạng thấp A (r x d) và B (d x r) sao cho ΔW = BA. Với r << d, số tham số giảm hàng trăm lần. Đây là ý tưởng cốt lõi phân biệt LoRA với các hướng khác như prompt tuning hay full fine-tune.",
  },
  {
    question: "Rank r trong LoRA ảnh hưởng thế nào đến kết quả?",
    options: [
      "r lớn hơn luôn tốt hơn vì biểu diễn nhiều hơn",
      "r nhỏ hơn luôn tốt hơn vì ít overfit hơn",
      "r lớn cho phép biểu diễn thay đổi phức tạp hơn nhưng tốn nhiều tham số hơn — cần cân bằng",
      "r không ảnh hưởng đến kết quả cuối cùng, chỉ ảnh hưởng tốc độ",
    ],
    correct: 2,
    explanation:
      "r là trade-off: r nhỏ (4-8) tiết kiệm nhưng hạn chế khả năng biểu diễn; r lớn (32-64) biểu diễn tốt hơn nhưng tiến gần full fine-tune. Thực nghiệm cho thấy r = 8-16 thường đủ cho hầu hết tác vụ hạ nguồn.",
  },
  {
    question: "Lợi thế nào KHÔNG phải của LoRA so với full fine-tuning?",
    options: [
      "Có thể gộp adapter vào mô hình gốc mà không tăng latency khi suy luận",
      "Giảm hơn 99% số tham số cần huấn luyện",
      "Luôn cho kết quả tốt hơn full fine-tuning trên mọi tập dữ liệu",
      "Cho phép fine-tune mô hình lớn trên GPU consumer 24GB",
    ],
    correct: 2,
    explanation:
      "LoRA KHÔNG luôn tốt hơn full fine-tuning. Trên tập dữ liệu rất lớn với sự dịch chuyển phân phối mạnh, full FT vẫn có thể vượt LoRA vài điểm phần trăm. LoRA thắng ở hiệu quả (bộ nhớ, thời gian, khả năng lưu nhiều adapter), không phải luôn thắng ở chất lượng tuyệt đối.",
  },
  {
    type: "fill-blank",
    question:
      "LoRA đóng băng W gốc và chỉ học hai ma trận {blank}-rank A và B. Với chiều d = 4096 và rank r = {blank}, adapter chỉ có ~65K tham số (so với 16.7M của W).",
    blanks: [
      { answer: "low", accept: ["hạng thấp", "thấp", "low-rank"] },
      { answer: "8", accept: ["r=8", "8.0"] },
    ],
    explanation:
      "LoRA phân tích ΔW = BA với r << d. Với d = 4096, r = 8 → tham số LoRA = 2 × 4096 × 8 ≈ 65K, chỉ bằng 0.39% ma trận gốc. Rank r điển hình là 4-16 cho đa số tác vụ, đôi khi 32-64 cho tác vụ khó.",
  },
  {
    question:
      "Điểm khác biệt then chốt giữa LoRA và QLoRA là gì?",
    options: [
      "QLoRA dùng rank cao hơn để bù quantization",
      "QLoRA lượng tử hóa (quantize) trọng số gốc xuống 4-bit (NF4) và dùng paged optimizer, nhờ đó fit được mô hình 65B trên một GPU 48GB",
      "QLoRA huấn luyện cả W gốc lẫn adapter",
      "QLoRA không dùng ma trận A, B mà dùng prompt tuning",
    ],
    correct: 1,
    explanation:
      "QLoRA = LoRA + 4-bit NF4 quantization cho W gốc + double quantization (lượng tử hóa cả scaling factor) + paged optimizer (CPU offload cho optimizer state). Cả ba kỹ thuật cộng lại giúp fine-tune Llama 65B trên 1x A100 48GB — trước đây cần 8x A100.",
  },
  {
    question:
      "Trong LoRA, tại sao khởi tạo B = 0 và A ~ N(0, σ²) lại quan trọng?",
    options: [
      "Để tiết kiệm bộ nhớ GPU khi khởi tạo",
      "Để đảm bảo mô hình ban đầu hoạt động giống hệt mô hình gốc (BA = 0), rồi dần dần học delta",
      "Để adapter có gradient lớn hơn ngay từ bước đầu",
      "Không quan trọng, có thể khởi tạo ngẫu nhiên cả hai",
    ],
    correct: 1,
    explanation:
      "B khởi tạo 0 → ΔW = BA = 0 → W' = W (mô hình gốc). A khởi tạo Gaussian để khi gradient flow tới, B học được hướng thay đổi có ý nghĩa. Nếu cả hai đều 0 thì gradient cũng 0 (chết). Nếu cả hai ngẫu nhiên thì mô hình ban đầu đã lệch khỏi pre-train — hại kiến thức nền.",
  },
  {
    question:
      "Hệ số α (lora_alpha) trong LoRA đóng vai trò gì?",
    options: [
      "Số lượng epoch huấn luyện",
      "Hệ số scaling: ΔW được nhân với α/r để duy trì độ lớn ổn định khi thay đổi r",
      "Kích thước mini-batch",
      "Xác suất dropout cho adapter",
    ],
    correct: 1,
    explanation:
      "W' = W + (α/r) · BA. Nhờ chia cho r, khi bạn thử nhiều giá trị r khác nhau thì tác động gần như bằng nhau — tiết kiệm hyperparameter tuning. Thông thường đặt α = 16 hoặc α = 2r.",
  },
  {
    question:
      "Khi triển khai production, ưu điểm nào của LoRA là quan trọng nhất với dịch vụ phục vụ nhiều khách hàng khác nhau?",
    options: [
      "Giảm thời gian inference xuống một nửa",
      "Có thể chia sẻ một mô hình nền duy nhất trên GPU, swap adapter (vài MB) cho từng khách hàng/tác vụ — không cần deploy nhiều bản sao mô hình 7B",
      "Tự động sinh dữ liệu huấn luyện",
      "Không cần GPU để inference",
    ],
    correct: 1,
    explanation:
      "Multi-tenant serving: 1 base model 14GB + 100 adapter × 20MB = 16GB, thay vì 100 × 14GB = 1.4TB. S-LoRA, LoRAX và các hệ thống serving hiện đại khai thác điều này để giảm chi phí GPU hàng chục lần.",
  },
];

export default function LoRATopic() {
  /* ============================================================
   * State: the visualization is driven by three primary knobs —
   * rank r, input/output dims (d), and whether we're comparing
   * plain LoRA against QLoRA (4-bit base). A dropout slider is
   * kept for reference but only surfaces via a callout.
   * ============================================================ */
  const [rank, setRank] = useState<number>(8);
  const [dim, setDim] = useState<number>(4096);
  const [alpha, setAlpha] = useState<number>(16);
  const [useQLoRA, setUseQLoRA] = useState<boolean>(false);
  const [targetModules, setTargetModules] = useState<number>(2);
  const [numLayers, setNumLayers] = useState<number>(32);

  /* ============================================================
   * Derived stats. We compute per-layer counts and then multiply
   * by the number of target modules per layer and the number of
   * transformer layers so learners can see the full-model tally.
   * ============================================================ */
  const stats = useMemo(() => {
    const perMatrix = computeParamCounts(dim, dim, rank);
    const totalFull = perMatrix.full * targetModules * numLayers;
    const totalLora = perMatrix.lora * targetModules * numLayers;
    const ratio = (totalLora / totalFull) * 100;
    return {
      perMatrixFull: perMatrix.full,
      perMatrixLora: perMatrix.lora,
      totalFull,
      totalLora,
      ratio: ratio.toFixed(4),
      saved: (100 - ratio).toFixed(2),
    };
  }, [rank, dim, targetModules, numLayers]);

  /* ============================================================
   * Memory estimate for the whole setup. Real numbers depend on
   * activations, gradient checkpointing, and micro-batching but
   * this gives a good "order of magnitude" intuition.
   * ============================================================ */
  const memoryEstimate = useMemo(() => {
    return estimateMemory(stats.totalLora, stats.totalFull, useQLoRA);
  }, [stats, useQLoRA]);

  /* ============================================================
   * Pre-computed presets so students can jump between common
   * LoRA configurations without scrubbing sliders.
   * ============================================================ */
  const applyPreset = useCallback(
    (preset: "tiny" | "standard" | "expressive" | "qlora-65b") => {
      if (preset === "tiny") {
        setRank(4);
        setAlpha(8);
        setDim(2048);
        setUseQLoRA(false);
        setTargetModules(2);
        setNumLayers(24);
      } else if (preset === "standard") {
        setRank(8);
        setAlpha(16);
        setDim(4096);
        setUseQLoRA(false);
        setTargetModules(2);
        setNumLayers(32);
      } else if (preset === "expressive") {
        setRank(32);
        setAlpha(64);
        setDim(4096);
        setUseQLoRA(false);
        setTargetModules(4);
        setNumLayers(32);
      } else {
        setRank(16);
        setAlpha(32);
        setDim(8192);
        setUseQLoRA(true);
        setTargetModules(4);
        setNumLayers(80);
      }
    },
    []
  );

  /* ============================================================
   * Scale factor for the SVG matrix visualization. Rank bars are
   * sized proportionally so changes feel continuous.
   * ============================================================ */
  const rankBarWidth = Math.max(12, Math.min(96, rank * 1.4));
  const rankBarHeight = Math.max(12, Math.min(96, rank * 1.4));

  return (
    <>
      {/* ━━━ Step 0: Progress tracker ━━━ */}
      <div className="mb-6">
        <ProgressSteps
          current={1}
          total={TOTAL_STEPS}
          labels={STEP_LABELS}
        />
      </div>

      {/* ━━━ 1. HOOK / PREDICTION ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Mô hình Llama 3 có 8 tỷ tham số. Bạn muốn fine-tune nó trên laptop GPU 8GB. Cần tối thiểu bao nhiêu tham số phải huấn luyện để đạt chất lượng gần full fine-tune?"
          options={[
            "Phải huấn luyện cả 8 tỷ tham số — không có cách nào khác",
            "Chỉ cần huấn luyện khoảng 0.1% (~8 triệu tham số) là đủ",
            "Cần ít nhất 50% (~4 tỷ tham số)",
            "Khoảng 1 tỷ (~12%) — phần còn lại là embedding",
          ]}
          correct={1}
          explanation="LoRA cho phép fine-tune hiệu quả với chỉ 0.01-0.1% tổng tham số! Bí quyết: các thay đổi trọng số có ích thực sự nằm trong một không gian hạng thấp, không cần cập nhật toàn bộ W khổng lồ."
        >
          <p className="text-sm text-muted mt-2">
            Hãy cùng khám phá ý tưởng toán học đằng sau phép màu này. Bạn sẽ
            thấy rằng bức tranh &quot;full fine-tune&quot; thực ra cực kỳ dư
            thừa — và LoRA cắt bỏ sự dư thừa đó một cách rất tinh tế.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. VISUALIZATION ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Trực quan hóa adapter LoRA
          </h3>
          <p className="text-sm text-muted mb-4">
            Kéo các thanh trượt để thấy rank r, chiều d và chế độ QLoRA ảnh
            hưởng đến số tham số, bộ nhớ và cấu trúc ma trận.
          </p>

          {/* Preset chips — quick jumps between common configs */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset("tiny")}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted hover:text-foreground"
            >
              Tiny (r=4, 2B base)
            </button>
            <button
              onClick={() => applyPreset("standard")}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted hover:text-foreground"
            >
              Chuẩn (r=8, 7B base)
            </button>
            <button
              onClick={() => applyPreset("expressive")}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted hover:text-foreground"
            >
              Biểu diễn mạnh (r=32)
            </button>
            <button
              onClick={() => applyPreset("qlora-65b")}
              className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
            >
              QLoRA 65B
            </button>
          </div>

          {/* Main controls */}
          <div className="space-y-4 max-w-lg mx-auto mb-6">
            <div className="space-y-1">
              <label className="text-sm text-muted">
                Rank r ={" "}
                <strong className="text-foreground">{rank}</strong>
              </label>
              <input
                type="range"
                min={1}
                max={64}
                step={1}
                value={rank}
                onChange={(e) => setRank(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>1 (cực gọn)</span>
                <span>64 (chi tiết)</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted">
                Chiều d ={" "}
                <strong className="text-foreground">
                  {dim.toLocaleString()}
                </strong>
              </label>
              <input
                type="range"
                min={512}
                max={12288}
                step={512}
                value={dim}
                onChange={(e) => setDim(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>512</span>
                <span>12.288</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted">
                Alpha α ={" "}
                <strong className="text-foreground">{alpha}</strong>{" "}
                <span className="text-xs">(scale = α/r ={" "}
                  {(alpha / rank).toFixed(2)})</span>
              </label>
              <input
                type="range"
                min={1}
                max={128}
                step={1}
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted">
                Số target modules /layer ={" "}
                <strong className="text-foreground">{targetModules}</strong>{" "}
                <span className="text-xs">(q/k/v/o proj)</span>
              </label>
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={targetModules}
                onChange={(e) => setTargetModules(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted">
                Số tầng transformer ={" "}
                <strong className="text-foreground">{numLayers}</strong>
              </label>
              <input
                type="range"
                min={4}
                max={80}
                step={1}
                value={numLayers}
                onChange={(e) => setNumLayers(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Chế độ QLoRA (base 4-bit NF4)
                </p>
                <p className="text-xs text-muted">
                  Lượng tử hóa W gốc xuống 4-bit để fit model 65B trên 1 GPU.
                </p>
              </div>
              <button
                onClick={() => setUseQLoRA(!useQLoRA)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  useQLoRA ? "bg-accent" : "bg-surface border border-border"
                }`}
                aria-pressed={useQLoRA}
              >
                <motion.span
                  layout
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                  animate={{ left: useQLoRA ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              </button>
            </div>
          </div>

          {/* SVG: W (frozen gray) + B x A (trainable blue) */}
          <svg
            viewBox="0 0 760 260"
            className="w-full max-w-3xl mx-auto mb-6"
            role="img"
            aria-label="Trực quan hóa phân rã LoRA"
          >
            {/* W matrix (frozen) */}
            <g>
              <rect
                x="20"
                y="60"
                width="140"
                height="140"
                rx="8"
                fill={useQLoRA ? "#1f2937" : "#334155"}
                stroke={useQLoRA ? "#f59e0b" : "#64748b"}
                strokeWidth="2"
                strokeDasharray={useQLoRA ? "6 3" : "0"}
              />
              <text
                x="90"
                y="100"
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="18"
                fontWeight="bold"
              >
                W₀
              </text>
              <text
                x="90"
                y="122"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
              >
                {dim.toLocaleString()} × {dim.toLocaleString()}
              </text>
              <text
                x="90"
                y="142"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
              >
                {formatCompact(stats.perMatrixFull)} params
              </text>
              <text
                x="90"
                y="180"
                textAnchor="middle"
                fill={useQLoRA ? "#fbbf24" : "#94a3b8"}
                fontSize="10"
                fontWeight="bold"
              >
                {useQLoRA ? "4-bit NF4 ❄️" : "Đóng băng ❄️"}
              </text>
              <text
                x="90"
                y="220"
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
              >
                (không gradient)
              </text>
            </g>

            {/* Plus sign */}
            <text
              x="185"
              y="135"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="28"
              fontWeight="bold"
            >
              +
            </text>

            {/* Scale factor */}
            <text
              x="225"
              y="120"
              textAnchor="middle"
              fill="#60a5fa"
              fontSize="11"
            >
              {(alpha / rank).toFixed(2)}
            </text>
            <text
              x="225"
              y="150"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
            >
              α/r
            </text>
            <text
              x="258"
              y="135"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="20"
            >
              ×
            </text>

            {/* B matrix (d x r) — tall and narrow */}
            <g>
              <rect
                x="285"
                y="60"
                width={rankBarWidth}
                height="140"
                rx="6"
                fill="#1e3a8a"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <text
                x={285 + rankBarWidth / 2}
                y="135"
                textAnchor="middle"
                fill="#93c5fd"
                fontSize="14"
                fontWeight="bold"
              >
                B
              </text>
              <text
                x={285 + rankBarWidth / 2}
                y="220"
                textAnchor="middle"
                fill="#93c5fd"
                fontSize="9"
              >
                {dim}×{rank}
              </text>
              <text
                x={285 + rankBarWidth / 2}
                y="240"
                textAnchor="middle"
                fill="#60a5fa"
                fontSize="8"
              >
                init = 0
              </text>
            </g>

            {/* × */}
            <text
              x={285 + rankBarWidth + 18}
              y="135"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="20"
            >
              ×
            </text>

            {/* A matrix (r x d) — short and wide */}
            <g>
              <rect
                x={310 + rankBarWidth + 18}
                y={135 - rankBarHeight / 2}
                width="140"
                height={rankBarHeight}
                rx="6"
                fill="#1e3a8a"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <text
                x={310 + rankBarWidth + 18 + 70}
                y="140"
                textAnchor="middle"
                fill="#93c5fd"
                fontSize="14"
                fontWeight="bold"
              >
                A
              </text>
              <text
                x={310 + rankBarWidth + 18 + 70}
                y={135 + rankBarHeight / 2 + 20}
                textAnchor="middle"
                fill="#93c5fd"
                fontSize="9"
              >
                {rank}×{dim}
              </text>
              <text
                x={310 + rankBarWidth + 18 + 70}
                y={135 + rankBarHeight / 2 + 35}
                textAnchor="middle"
                fill="#60a5fa"
                fontSize="8"
              >
                init ~ N(0, σ²)
              </text>
            </g>

            {/* = */}
            <text
              x={460 + rankBarWidth + 18}
              y="135"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="22"
            >
              =
            </text>

            {/* Result W' */}
            <g>
              <rect
                x={485 + rankBarWidth + 18}
                y="60"
                width="140"
                height="140"
                rx="8"
                fill="#064e3b"
                stroke="#22c55e"
                strokeWidth="2"
              />
              <text
                x={555 + rankBarWidth + 18}
                y="100"
                textAnchor="middle"
                fill="#86efac"
                fontSize="16"
                fontWeight="bold"
              >
                W′
              </text>
              <text
                x={555 + rankBarWidth + 18}
                y="122"
                textAnchor="middle"
                fill="#bbf7d0"
                fontSize="9"
              >
                = W₀ + (α/r)·BA
              </text>
              <text
                x={555 + rankBarWidth + 18}
                y="148"
                textAnchor="middle"
                fill="#bbf7d0"
                fontSize="9"
              >
                {dim.toLocaleString()} × {dim.toLocaleString()}
              </text>
              <text
                x={555 + rankBarWidth + 18}
                y="180"
                textAnchor="middle"
                fill="#22c55e"
                fontSize="10"
                fontWeight="bold"
              >
                Gộp khi deploy
              </text>
            </g>
          </svg>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-slate-300">
                {formatCompact(stats.totalFull)}
              </p>
              <p className="text-xs text-muted">Tham số full FT</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-blue-400">
                {formatCompact(stats.totalLora)}
              </p>
              <p className="text-xs text-muted">Tham số LoRA (A+B)</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-yellow-400">
                {stats.ratio}%
              </p>
              <p className="text-xs text-muted">Tỷ lệ trainable</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-green-400">
                {stats.saved}%
              </p>
              <p className="text-xs text-muted">Tiết kiệm</p>
            </div>
          </div>

          {/* Memory grid */}
          <div className="rounded-xl border border-border bg-background/30 p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Ước lượng VRAM cần thiết (rough)
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-base font-bold text-foreground">
                  {memoryEstimate.frozenGB.toFixed(2)} GB
                </p>
                <p className="text-xs text-muted">
                  Base {useQLoRA ? "(4-bit)" : "(fp16)"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-blue-400">
                  {memoryEstimate.trainableMB.toFixed(1)} MB
                </p>
                <p className="text-xs text-muted">Adapter fp16</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-purple-400">
                  {memoryEstimate.optimizerMB.toFixed(1)} MB
                </p>
                <p className="text-xs text-muted">Optimizer Adam</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-green-400">
                  {memoryEstimate.totalGB.toFixed(2)} GB
                </p>
                <p className="text-xs text-muted">Tổng cộng</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              Chưa tính activations và gradient checkpointing — thực tế có thể
              tiết kiệm thêm 30-50%.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Thay đổi trọng số khi fine-tune thực ra nằm trong{" "}
          <strong>không gian hạng thấp</strong> — giống như bức tranh phong
          cảnh dù có hàng triệu pixel nhưng chỉ cần vài nét cọ chính là đã nắm
          bắt được bản chất. <strong>LoRA</strong> khai thác điều này: thay vì
          cập nhật ma trận khổng lồ W, chỉ cần học hai ma trận mỏng A và B mà
          tích của chúng xấp xỉ thay đổi cần thiết. Hàm tri thức đã học sẵn
          trong W₀ không bị đụng vào — nó chỉ được &quot;bẻ lái&quot; bằng một
          cú hích hạng thấp.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. INLINE CHALLENGE 1 ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Ma trận gốc W có kích thước 4096 x 4096 (16.7M tham số). Với LoRA rank r = 8, tổng tham số của A và B là bao nhiêu?"
          options={[
            "32.768 (chỉ tính A: 4096 × 8)",
            "65.536 (A: 4096 × 8 cộng B: 8 × 4096)",
            "16.777.216 (4096 × 4096)",
            "8.192 (8 × 1024)",
          ]}
          correct={1}
          explanation="A có kích thước 8 × 4096 = 32.768 tham số, B có kích thước 4096 × 8 = 32.768 tham số. Tổng = 65.536 — chỉ bằng 0.39% so với ma trận gốc 16.7M. Nếu áp dụng LoRA cho 4 module × 32 tầng, tổng cộng vẫn < 10M tham số trainable."
        />
      </LessonSection>

      {/* ━━━ 5. DEEP EXPLANATION ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>LoRA (Low-Rank Adaptation)</strong> dựa trên giả thuyết
            rằng sự thay đổi trọng số khi{" "}
            <TopicLink slug="fine-tuning">fine-tune</TopicLink> có{" "}
            <strong>intrinsic rank thấp</strong>. Thay vì cập nhật toàn bộ ma
            trận W, LoRA phân tích delta thành tích của hai ma trận mỏng:
          </p>

          <LaTeX block>
            {"W' = W_0 + \\Delta W = W_0 + \\frac{\\alpha}{r} \\cdot BA"}
          </LaTeX>

          <p>
            Trong đó <LaTeX>{"W_0 \\in \\mathbb{R}^{d_{out} \\times d_{in}}"}</LaTeX>{" "}
            đóng băng, <LaTeX>{"B \\in \\mathbb{R}^{d_{out} \\times r}"}</LaTeX>{" "}
            và <LaTeX>{"A \\in \\mathbb{R}^{r \\times d_{in}}"}</LaTeX> là hai
            ma trận huấn luyện được, với <LaTeX>{"r \\ll \\min(d_{in}, d_{out})"}</LaTeX>.
            Hệ số <LaTeX>{"\\alpha"}</LaTeX> kiểm soát độ lớn của đóng góp
            adapter — chia cho r để tổng tác động không phụ thuộc nhiều vào r.
          </p>

          <p>Quy trình LoRA gồm ba bước cốt lõi:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Đóng băng W gốc:</strong> Ma trận pre-train không bị
              thay đổi — bảo toàn toàn bộ kiến thức nền đã học được.
            </li>
            <li>
              <strong>Thêm adapter:</strong> Khởi tạo A ngẫu nhiên (Gaussian),
              B = 0. Tại bước 0, ΔW = BA = 0 — mô hình vẫn hoạt động hệt
              như cũ. Khi gradient chảy vào B, nó học hướng cần thiết.
            </li>
            <li>
              <strong>Gộp khi triển khai:</strong> Sau huấn luyện, tính
              W&#x27; = W + (α/r)·BA một lần và lưu. Không tăng chi phí
              inference so với mô hình gốc.
            </li>
          </ul>

          <Callout variant="insight" title="Giả thuyết intrinsic rank">
            Bài báo LoRA (Hu et al. 2021) chứng minh rằng với nhiều tác vụ
            downstream, rank của ΔW thực tế rất thấp — thậm chí r = 1 hoặc r
            = 2 vẫn cho kết quả cạnh tranh với full fine-tune. Điều này là
            ngạc nhiên: ta tưởng phải &quot;cập nhật&quot; hàng triệu chiều,
            nhưng thực ra hầu hết đã có sẵn trong W₀.
          </Callout>

          <CollapsibleDetail title="Toán học sâu hơn: tại sao α/r ổn định khi thay đổi r?">
            <p>
              Khi khởi tạo A ~ N(0, 1/r) và B = 0, kỳ vọng{" "}
              <LaTeX>{"\\|BA\\|_F^2"}</LaTeX> tỷ lệ với r. Nếu không chia cho
              r, tăng r sẽ làm delta lớn bất thường và phá pre-train. Chia cho
              r đảm bảo độ lớn ổn định — bạn có thể grid-search các r khác
              nhau mà không phải tune lại learning rate hay alpha.
            </p>
            <p>
              Cụ thể, với scale s = α/r, update rule là W&#x27; = W + s·BA.
              Khi r gấp đôi, s giảm một nửa, tổng tác động vẫn giữ nguyên về
              mặt norm — chỉ khả năng biểu diễn tăng lên.
            </p>
          </CollapsibleDetail>

          <CodeBlock language="python" title="lora_peft.py">
            {`from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM

# 1. Load base model (fp16 trên GPU)
base_model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-8B",
    torch_dtype="float16",
    device_map="auto",
)

# 2. Cấu hình LoRA
config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,                    # Rank — trade-off giữa chất lượng/chi phí
    lora_alpha=16,          # Scaling: W' = W + (16/8)·BA = W + 2·BA
    target_modules=[        # Áp dụng cho attention projections
        "q_proj", "v_proj", # Tối thiểu: Q và V
        # "k_proj", "o_proj"  # Tùy chọn: K và O cho biểu diễn mạnh hơn
    ],
    lora_dropout=0.05,      # Regularization
    bias="none",            # Không huấn luyện bias
    modules_to_save=None,   # Không có module full-trainable
)

# 3. Gắn adapter
model = get_peft_model(base_model, config)
model.print_trainable_parameters()
# → trainable params: 4,194,304 || all params: 8,034,078,720
# → trainable%: 0.0522

# 4. Huấn luyện như bình thường
# trainer = Trainer(model=model, ...)
# trainer.train()

# 5. Lưu adapter (chỉ vài MB, không phải 14GB mô hình gốc!)
model.save_pretrained("./my-lora-adapter")

# 6. Nạp lại khi inference
from peft import PeftModel
base = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3-8B")
model = PeftModel.from_pretrained(base, "./my-lora-adapter")

# 7. (Tùy chọn) Gộp để tăng tốc inference
model = model.merge_and_unload()  # W' = W + BA, xoá adapter`}
          </CodeBlock>

          <Callout variant="warning" title="Đừng quên lưu adapter riêng">
            Mặc định PEFT chỉ lưu A và B (vài MB). Nếu bạn save_pretrained()
            toàn bộ PeftModel thì vẫn chỉ có adapter — đừng ngạc nhiên khi
            thư mục nhỏ. Để deploy một-file, dùng merge_and_unload() rồi save.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. LORA vs QLORA COMPARISON ━━━ */}
      <LessonSection
        step={6}
        totalSteps={TOTAL_STEPS}
        label="So sánh QLoRA"
      >
        <ExplanationSection>
          <h3 className="text-lg font-semibold text-foreground">
            LoRA vs QLoRA: khi nào dùng cái nào?
          </h3>
          <p>
            Nếu LoRA đã tiết kiệm 99% tham số huấn luyện, tại sao vẫn cần
            QLoRA? Câu trả lời: LoRA vẫn phải giữ{" "}
            <strong>W gốc ở fp16 trên GPU</strong>. Với mô hình 65B, bạn cần
            130GB VRAM chỉ để load W₀ — vẫn quá tải cho consumer GPU.{" "}
            <strong>QLoRA = LoRA + quantization 4-bit</strong> để cắt 4×
            footprint của base model.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Tiêu chí
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-blue-400">
                    LoRA
                  </th>
                  <th className="text-left py-2 font-semibold text-amber-400">
                    QLoRA
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Base model</td>
                  <td className="py-2 pr-3">fp16 / bf16 (2 bytes/param)</td>
                  <td className="py-2">4-bit NF4 (0.5 bytes/param)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Adapter A, B</td>
                  <td className="py-2 pr-3">fp16</td>
                  <td className="py-2">fp16 (không quantize)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Optimizer state</td>
                  <td className="py-2 pr-3">Adam fp32 trên GPU</td>
                  <td className="py-2">Paged Adam (offload CPU)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">VRAM cho Llama 65B</td>
                  <td className="py-2 pr-3">~130GB (8× A100)</td>
                  <td className="py-2">~48GB (1× A100)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Tốc độ</td>
                  <td className="py-2 pr-3">Nhanh nhất</td>
                  <td className="py-2">Chậm hơn ~25% (dequantize on-the-fly)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">Chất lượng</td>
                  <td className="py-2 pr-3">Gần full FT</td>
                  <td className="py-2">99%+ so với LoRA (NF4 hầu như không mất)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="insight" title="Ba cải tiến cốt lõi của QLoRA">
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <strong>4-bit NormalFloat (NF4):</strong> kiểu lượng tử hóa
                phù hợp phân phối chuẩn của trọng số pre-train. Hiệu quả hơn
                int4 đều.
              </li>
              <li>
                <strong>Double quantization:</strong> lượng tử hóa chính scale
                factor của từng block, tiết kiệm thêm ~0.37 bit/param.
              </li>
              <li>
                <strong>Paged optimizer:</strong> khi VRAM đầy, tự động
                offload Adam state sang RAM CPU qua NVIDIA unified memory —
                tránh OOM khi gặp peak activation.
              </li>
            </ol>
          </Callout>

          <CollapsibleDetail title="Khi nào KHÔNG nên dùng LoRA/QLoRA?">
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Continued pre-training quy mô lớn:</strong> nếu bạn có
                hàng tỷ token mới (ví dụ: đào tạo cho một ngôn ngữ hoàn toàn
                mới), full fine-tune (hoặc full FT + gradient checkpointing)
                vẫn là lựa chọn an toàn. Rank thấp không đủ biểu diễn sự dịch
                chuyển phân phối lớn.
              </li>
              <li>
                <strong>Thay đổi kiến trúc:</strong> nếu bạn cần thêm token
                mới vào vocab hoặc thay đổi hidden size, LoRA không đủ — cần
                full fine-tune lớp embedding/output head.
              </li>
              <li>
                <strong>Fine-tune cực nhỏ dữ liệu (&lt; 100 mẫu):</strong>{" "}
                prefix tuning hoặc prompt tuning có thể tốt hơn, vì LoRA với
                r=8 vẫn có ~4M tham số — quá nhiều cho 100 mẫu.
              </li>
            </ul>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 7. CODE: QLORA ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Code PEFT">
        <ExplanationSection>
          <p>
            Dưới đây là cấu hình QLoRA đầy đủ, sẵn sàng copy-paste. Lưu ý 3
            chỗ khác biệt so với LoRA thuần: <code>BitsAndBytesConfig</code>,{" "}
            <code>prepare_model_for_kbit_training</code>, và optimizer{" "}
            <code>paged_adamw_32bit</code>.
          </p>

          <CodeBlock language="python" title="qlora_fine_tune.py">
            {`import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
    TaskType,
)

# ===== 1. 4-bit quantization config =====
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # NormalFloat 4-bit
    bnb_4bit_compute_dtype=torch.bfloat16,  # Tính toán ở bf16
    bnb_4bit_use_double_quant=True,     # Double quantization
)

# ===== 2. Load model 4-bit =====
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-70B",
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3-70B")

# ===== 3. Chuẩn bị cho k-bit training =====
# Bật gradient checkpointing, cast layer norm về fp32,
# đóng băng mọi tham số non-LoRA
model = prepare_model_for_kbit_training(
    model,
    use_gradient_checkpointing=True,
)

# ===== 4. Gắn LoRA adapter =====
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,                           # Rank cao hơn LoRA thường
    lora_alpha=32,                  # α = 2r
    target_modules=[                # Tất cả linear layer trong attention
        "q_proj", "k_proj",
        "v_proj", "o_proj",
        # "gate_proj", "up_proj",   # Cũng có thể thêm MLP
        # "down_proj",
    ],
    lora_dropout=0.05,
    bias="none",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# → trainable: 40M / 70B = 0.057%

# ===== 5. Training với paged optimizer =====
args = TrainingArguments(
    output_dir="./qlora-llama3-70b",
    num_train_epochs=3,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=16,
    optim="paged_adamw_32bit",      # Offload optimizer state
    learning_rate=2e-4,
    bf16=True,
    logging_steps=10,
    save_strategy="epoch",
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
)

# trainer = Trainer(model=model, args=args, ...)
# trainer.train()

# ===== 6. Lưu adapter (~100MB thay vì 140GB!) =====
model.save_pretrained("./qlora-llama3-adapter")`}
          </CodeBlock>

          <Callout variant="insight" title="Serving nhiều adapter chung base model">
            Với framework như <strong>vLLM + LoRAX</strong> hoặc{" "}
            <strong>S-LoRA</strong>, bạn có thể load 1 base Llama-70B + hàng
            trăm adapter LoRA cùng lúc, mỗi request chọn adapter tương ứng.
            Điều này biến LoRA thành cơ chế chính cho multi-tenant LLM
            serving ở quy mô production — một công ty SaaS có thể fine-tune
            riêng cho từng khách hàng với chi phí GPU gần như không đổi.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 8. INLINE CHALLENGE 2 ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Bạn có GPU 24GB VRAM. Muốn fine-tune Llama-3 13B (base fp16 ≈ 26GB). Cách nào hợp lý nhất?"
          options={[
            "Full fine-tune — 24GB đủ nếu dùng mixed precision",
            "LoRA thuần với r=8 — tiết kiệm vì adapter chỉ vài MB",
            "QLoRA với r=16, base 4-bit NF4 — ~7GB cho base + optimizer fit thoải mái trong 24GB",
            "Không thể fine-tune Llama-3 13B trên 24GB bằng cách nào",
          ]}
          correct={2}
          explanation="Full FT 13B cần ~80GB (weights+grads+optimizer). LoRA thuần vẫn giữ base fp16 = 26GB — không fit! QLoRA hạ base xuống ~7GB (4-bit), adapter+optimizer thêm ~3GB, còn dư VRAM cho activations. Đây chính là case QLoRA thắng rõ nhất."
        />
      </LessonSection>

      {/* ━━━ 9. MINI SUMMARY ━━━ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về LoRA"
          points={[
            "LoRA đóng băng W gốc, chỉ học hai ma trận hạng thấp A (r × d_in) và B (d_out × r) — giảm >99% tham số huấn luyện.",
            "Rank r là tham số quan trọng nhất: r = 4-16 đủ cho hầu hết tác vụ; r = 32-64 khi cần biểu diễn mạnh hơn.",
            "Khởi tạo B = 0, A ~ Gaussian → mô hình ban đầu hoạt động như cũ; scale α/r giúp ổn định khi đổi r.",
            "Sau huấn luyện gộp W' = W + (α/r)·BA — không tăng latency khi triển khai.",
            "QLoRA = LoRA + 4-bit NF4 base + double quant + paged optimizer → fit được model 65B trên 1 GPU 48GB.",
            "Cho phép multi-tenant serving: 1 base model + N adapter (vài MB/cái) thay cho N bản sao model 14GB.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 10. QUIZ ━━━ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
