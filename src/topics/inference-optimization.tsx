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
  slug: "inference-optimization",
  title: "Inference Optimization",
  titleVi: "Tối ưu suy luận — Làm AI nhanh hơn",
  description:
    "Các kỹ thuật tăng tốc và giảm chi phí khi chạy mô hình AI: KV caching, speculative decoding, batching, quantization và Pareto frontier của throughput-latency.",
  category: "infrastructure",
  tags: ["inference", "optimization", "quantization", "latency", "vllm", "batching", "kv-cache"],
  difficulty: "advanced",
  relatedSlugs: ["model-serving", "gpu-optimization", "cost-optimization", "kv-cache", "quantization"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 *  LATENCY BREAKDOWN MODEL
 *  Mỗi request LLM đi qua 4 giai đoạn chính:
 *    1) Tokenization      — chuyển text → token IDs (CPU)
 *    2) Prefill           — encode toàn bộ prompt cùng lúc (GPU)
 *    3) KV-cache lookup   — truy cập attention cache (GPU memory)
 *    4) Decoding          — sinh từng token một (GPU, autoregressive)
 *
 *  Baseline (FP16, batch=1, không tối ưu) cho prompt 512 token,
 *  sinh 128 token trên GPU A100 với model 13B params:
 *    Tokenization ≈  8 ms
 *    Prefill      ≈ 90 ms
 *    KV lookup    ≈ 60 ms
 *    Decoding     ≈ 342 ms  (128 token × ~2.7 ms/token)
 *    Tổng         ≈ 500 ms
 * ────────────────────────────────────────────────────────────── */

interface LatencyStage {
  id: "tokenize" | "prefill" | "kv" | "decode";
  labelVi: string;
  baselineMs: number;
  color: string;
  note: string;
}

const BASELINE_STAGES: LatencyStage[] = [
  {
    id: "tokenize",
    labelVi: "Tokenization",
    baselineMs: 8,
    color: "#a855f7",
    note: "CPU chuyển text → token IDs",
  },
  {
    id: "prefill",
    labelVi: "Prefill",
    baselineMs: 90,
    color: "#3b82f6",
    note: "Encode toàn bộ prompt trên GPU",
  },
  {
    id: "kv",
    labelVi: "KV-cache lookup",
    baselineMs: 60,
    color: "#f59e0b",
    note: "Truy xuất attention key-value",
  },
  {
    id: "decode",
    labelVi: "Decoding",
    baselineMs: 342,
    color: "#22c55e",
    note: "Sinh từng token một (autoregressive)",
  },
];

/* ──────────────────────────────────────────────────────────────
 *  OPTIMIZATION TOGGLES
 *  Mỗi kỹ thuật có hệ số nhân (multiplier) lên từng stage:
 *    - KV caching:        decode÷2.8, kv÷1.4 (khi seq_len tăng)
 *    - Speculative:       decode÷2.2 (draft model suggest k token)
 *    - Batching(size):    prefill & decode chia sẻ GPU — throughput tăng
 *                         nhưng latency/request không giảm (thậm chí tăng nhẹ)
 *    - Quantization INT8: prefill÷1.7, decode÷1.9, kv÷2.0
 * ────────────────────────────────────────────────────────────── */

type ToggleKey = "kvCache" | "speculative" | "batching" | "quantization";

interface ToggleState {
  kvCache: boolean;
  speculative: boolean;
  batching: boolean;
  quantization: boolean;
}

const DEFAULT_TOGGLES: ToggleState = {
  kvCache: false,
  speculative: false,
  batching: false,
  quantization: false,
};

interface ToggleDef {
  key: ToggleKey;
  labelVi: string;
  description: string;
  speedupLabel: string;
}

const TOGGLES: ToggleDef[] = [
  {
    key: "kvCache",
    labelVi: "KV Caching",
    description: "Lưu key-value attention đã tính cho các token trước.",
    speedupLabel: "~2.5x decode",
  },
  {
    key: "speculative",
    labelVi: "Speculative Decoding",
    description: "Draft model đề xuất k token, target model verify.",
    speedupLabel: "~2.2x decode",
  },
  {
    key: "batching",
    labelVi: "Continuous Batching",
    description: "Ghép nhiều request vào cùng một GPU batch.",
    speedupLabel: "throughput ×4–8",
  },
  {
    key: "quantization",
    labelVi: "Quantization (INT8/INT4)",
    description: "Giảm số bit biểu diễn trọng số và activation.",
    speedupLabel: "~1.8x toàn pipeline",
  },
];

/* ──────────────────────────────────────────────────────────────
 *  LATENCY CALCULATOR
 *  Trả về ms cho mỗi stage dưới một set toggles cho trước.
 * ────────────────────────────────────────────────────────────── */

function stageLatency(stage: LatencyStage, t: ToggleState): number {
  let ms = stage.baselineMs;

  if (stage.id === "decode") {
    if (t.kvCache) ms /= 2.8;
    if (t.speculative) ms /= 2.2;
    if (t.quantization) ms /= 1.9;
    // Batching không giảm latency/request; nếu bật, thêm ~8% overhead
    if (t.batching) ms *= 1.08;
  }

  if (stage.id === "prefill") {
    if (t.quantization) ms /= 1.7;
    if (t.batching) ms *= 1.05;
  }

  if (stage.id === "kv") {
    if (t.kvCache) ms /= 1.4;
    if (t.quantization) ms /= 2.0;
  }

  if (stage.id === "tokenize") {
    // Tokenization là CPU, gần như không đổi theo các tối ưu GPU
    // Chỉ batching giảm chi phí trung bình nhờ amortize
    if (t.batching) ms /= 1.1;
  }

  return Math.max(0.5, ms);
}

function totalLatency(t: ToggleState): number {
  return BASELINE_STAGES.reduce((acc, s) => acc + stageLatency(s, t), 0);
}

/* ──────────────────────────────────────────────────────────────
 *  BATCHING THROUGHPUT CURVE
 *  Với mỗi batch size, throughput (req/s) = batch / batch_latency_s.
 *  Tuy nhiên, batch_latency tăng phi tuyến khi batch lớn do:
 *    - Memory pressure → swap KV cache
 *    - Diminishing returns của GPU SM occupancy
 *  Mô hình đơn giản: latency(batch) = base + alpha * sqrt(batch)
 * ────────────────────────────────────────────────────────────── */

function batchLatencyMs(batch: number, quantization: boolean): number {
  const base = quantization ? 260 : 500;
  const alpha = quantization ? 22 : 36;
  return base + alpha * Math.sqrt(batch);
}

function batchThroughput(batch: number, quantization: boolean): number {
  const latS = batchLatencyMs(batch, quantization) / 1000;
  return batch / latS;
}

interface BatchSample {
  batch: number;
  throughput: number;
  latency: number;
}

const BATCH_SIZES = [1, 4, 16, 64];

/* ──────────────────────────────────────────────────────────────
 *  PARETO FRONTIER POINTS
 *  Mỗi điểm: (latency_ms, throughput_reqs_per_s).
 *  Các config:
 *    - Baseline FP16 batch=1
 *    - +KV cache batch=1
 *    - +KV+Quant batch=4
 *    - +KV+Quant+Spec batch=4
 *    - +KV+Quant+Batch=16
 *    - Full optimized batch=64
 * ────────────────────────────────────────────────────────────── */

interface ParetoPoint {
  id: string;
  labelVi: string;
  latencyMs: number;
  throughput: number;
  isPareto: boolean;
}

const PARETO_POINTS: ParetoPoint[] = [
  { id: "baseline", labelVi: "Baseline FP16", latencyMs: 500, throughput: 2, isPareto: true },
  { id: "kv", labelVi: "+ KV cache", latencyMs: 215, throughput: 4.6, isPareto: true },
  { id: "kvq", labelVi: "+ Quant INT8", latencyMs: 130, throughput: 7.7, isPareto: true },
  { id: "kvqs", labelVi: "+ Speculative", latencyMs: 82, throughput: 12.2, isPareto: true },
  { id: "b16", labelVi: "+ Batch=16", latencyMs: 310, throughput: 51, isPareto: true },
  { id: "b64", labelVi: "Full + Batch=64", latencyMs: 540, throughput: 118, isPareto: true },
  { id: "naive-large", labelVi: "FP32 Batch=4", latencyMs: 650, throughput: 6, isPareto: false },
  { id: "overbatch", labelVi: "Batch=256 OOM", latencyMs: 1400, throughput: 182, isPareto: false },
];

const TOTAL_STEPS = 9;

const LESSON_LABELS = [
  "Dự đoán",
  "Latency breakdown",
  "Toggles",
  "Batching & throughput",
  "Pareto frontier",
  "Aha",
  "Thử thách",
  "Lý thuyết",
  "Kiểm tra",
];

/* ────────────────────────────────────────────────────────────── */

export default function InferenceOptimizationTopic() {
  const [toggles, setToggles] = useState<ToggleState>(DEFAULT_TOGGLES);
  const [selectedBatch, setSelectedBatch] = useState<number>(1);
  const [hoverPoint, setHoverPoint] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const toggleKey = useCallback((key: ToggleKey) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetToggles = useCallback(() => setToggles(DEFAULT_TOGGLES), []);
  const allOn = useCallback(
    () =>
      setToggles({
        kvCache: true,
        speculative: true,
        batching: true,
        quantization: true,
      }),
    []
  );

  // ─── Derived latency data ─────────────────────────────────
  const baselineTotal = useMemo(() => totalLatency(DEFAULT_TOGGLES), []);
  const currentTotal = useMemo(() => totalLatency(toggles), [toggles]);
  const speedup = useMemo(
    () => (baselineTotal / currentTotal).toFixed(1),
    [baselineTotal, currentTotal]
  );

  const stageData = useMemo(
    () =>
      BASELINE_STAGES.map((s) => ({
        ...s,
        ms: stageLatency(s, toggles),
        baselineMs: s.baselineMs,
      })),
    [toggles]
  );

  // ─── Pie geometry for latency breakdown ───────────────────
  const pieData = useMemo(() => {
    const total = stageData.reduce((a, s) => a + s.ms, 0);
    let angleAcc = -Math.PI / 2; // start at top
    return stageData.map((s) => {
      const sweep = (s.ms / total) * Math.PI * 2;
      const start = angleAcc;
      const end = angleAcc + sweep;
      angleAcc = end;
      return { ...s, start, end, sweep, fraction: s.ms / total };
    });
  }, [stageData]);

  // ─── Batching samples ─────────────────────────────────────
  const batchSamples: BatchSample[] = useMemo(
    () =>
      BATCH_SIZES.map((b) => ({
        batch: b,
        throughput: batchThroughput(b, toggles.quantization),
        latency: batchLatencyMs(b, toggles.quantization),
      })),
    [toggles.quantization]
  );

  const maxThroughput = Math.max(...batchSamples.map((s) => s.throughput));

  // ─── Quiz ─────────────────────────────────────────────────
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Trong một request LLM điển hình (prompt 512 token, sinh 128 token), giai đoạn nào chiếm nhiều latency nhất?",
        options: [
          "Tokenization — vì text rất dài",
          "Decoding — vì phải sinh từng token tuần tự",
          "Prefill — vì phải encode toàn bộ prompt",
        ],
        correct: 1,
        explanation:
          "Decoding là autoregressive: mỗi token mới cần một forward pass riêng. 128 token × ~2.7 ms ≈ 342 ms, chiếm ~68% tổng thời gian. Prefill chỉ ~18% vì nó xử lý toàn bộ prompt trong 1 pass duy nhất (parallel).",
      },
      {
        question: "KV caching tăng tốc decoding bằng cách nào?",
        options: [
          "Nén trọng số model xuống INT4",
          "Lưu key-value của các token trước, tránh tính lại attention toàn bộ",
          "Dự đoán nhiều token cùng lúc rồi verify",
        ],
        correct: 1,
        explanation:
          "Không có KV cache, mỗi token mới yêu cầu attention trên toàn bộ chuỗi → O(N²) cho cả chuỗi. Với KV cache, chỉ cần tính Q cho token mới rồi dot-product với K,V đã lưu → O(N) mỗi token. Tiết kiệm ~2.5× trên decoding stage.",
      },
      {
        question:
          "Speculative decoding khác KV caching ở điểm then chốt nào?",
        options: [
          "Speculative cần 2 model (draft + target), KV cache chỉ cần 1",
          "Speculative giảm bộ nhớ, KV cache tăng bộ nhớ",
          "Speculative chỉ dùng cho prefill, KV cache chỉ dùng cho decode",
        ],
        correct: 0,
        explanation:
          "Speculative decoding dùng một draft model nhỏ (ví dụ 1B) để sinh k token ứng viên, sau đó target model lớn (70B) verify k token đó trong MỘT forward pass. Nếu accept được m≤k token, tăng tốc ~m lần. KV cache chỉ lưu trữ attention state, không cần thêm model.",
      },
      {
        question:
          "Tăng batch size từ 1 lên 64 ảnh hưởng throughput (req/s) và latency/request thế nào?",
        options: [
          "Cả hai đều tăng tuyến tính",
          "Throughput tăng gần tuyến tính, latency/request tăng nhẹ",
          "Throughput giảm, latency giảm",
        ],
        correct: 1,
        explanation:
          "Batching khai thác parallelism của GPU: 64 request chia sẻ cùng forward pass. Throughput tăng gần 64× (giảm dần do overhead), nhưng latency/request tăng nhẹ vì batch lớn hơn → forward pass dài hơn một chút. Đây là đánh đổi throughput ↔ latency.",
      },
      {
        question: "Quantization INT8 giảm bộ nhớ mô hình bao nhiêu so với FP32?",
        options: [
          "Giảm 25% (3/4 còn lại)",
          "Giảm 75% (1/4 còn lại)",
          "Giảm 50% (1/2 còn lại)",
        ],
        correct: 1,
        explanation:
          "FP32 dùng 32 bit/tham số, INT8 dùng 8 bit/tham số. Tỷ lệ 8/32 = 1/4, nên giảm 75% bộ nhớ. Model 28GB FP32 chỉ còn 7GB INT8.",
      },
      {
        question:
          "PagedAttention (vLLM) giải quyết vấn đề gì của KV cache?",
        options: [
          "Làm cho KV cache nhỏ hơn bằng cách nén",
          "Quản lý KV cache như virtual memory — giảm internal fragmentation",
          "Tính lại KV khi cần thay vì lưu",
        ],
        correct: 1,
        explanation:
          "KV cache cấp phát liên tục (contiguous) lãng phí tới 60% bộ nhớ do reserve cho max_seq_len. PagedAttention chia KV thành các page nhỏ (mỗi page 16 token), cấp phát theo nhu cầu — giảm waste xuống ~4%, tăng batch size 2–4×.",
      },
      {
        type: "fill-blank",
        question:
          "Hai trục của Pareto frontier trong inference serving thường là {blank} (thấp = tốt) và {blank} (cao = tốt). Không có điểm nào tối ưu cả hai — phải đánh đổi.",
        blanks: [
          { answer: "latency", accept: ["độ trễ", "thời gian phản hồi"] },
          { answer: "throughput", accept: ["thông lượng", "req/s", "requests per second"] },
        ],
        explanation:
          "Interactive chatbot cần latency thấp (<200 ms p50) nên dùng batch nhỏ. Batch job (tóm tắt hàng triệu tài liệu) ưu tiên throughput nên dùng batch lớn (64–256). Không có cấu hình 'tốt nhất' cho mọi use case — chọn điểm trên Pareto frontier phù hợp SLA.",
      },
      {
        question:
          "Công ty bạn phục vụ chatbot với SLA: p95 latency < 300 ms. Cấu hình nào phù hợp nhất?",
        options: [
          "Batch=64, INT4, speculative — để tối đa throughput",
          "Batch=1, KV cache, INT8, speculative — cân bằng latency thấp",
          "Batch=256, FP16, không speculative — để 'safe'",
        ],
        correct: 1,
        explanation:
          "SLA latency ưu tiên batch nhỏ. KV cache + INT8 + speculative giảm latency/request nhiều nhất. Batch lớn đẩy latency p95 vượt SLA. Batch=256 FP16 vừa chậm (do FP16) vừa có latency cao (do batch lớn) — tệ nhất cho chatbot.",
      },
    ],
    []
  );

  /* ────────────────────────────────────────────────────────── */

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label={LESSON_LABELS[0]}>
        <div className="mb-4">
          <ProgressSteps current={currentStep} total={TOTAL_STEPS} labels={LESSON_LABELS} />
        </div>
        <PredictionGate
          question="Model Llama-3 70B trên GPU A100 (80GB) mất 500 ms/request. Bạn cần phục vụ 10.000 người dùng đồng thời với ngân sách cố định — đâu là cách hiệu quả nhất?"
          options={[
            "Mua thêm 10 GPU A100 để chạy song song",
            "Giảm số tham số xuống 7B và chấp nhận chất lượng thấp hơn",
            "Kết hợp KV cache + speculative + batching + quantization trên cùng hạ tầng",
          ]}
          correct={2}
          explanation="Tối ưu software (KV cache, speculative, continuous batching, quantization) có thể giảm chi phí 10–50× mà KHÔNG phải đổi model hay thêm GPU. Đây là cách các nền tảng lớn (OpenAI, Anthropic, vLLM-based services tại VN) serving thực tế."
        >
          <p className="text-sm text-muted mt-3">
            Tiếp tục để khám phá cách mỗi giai đoạn trong pipeline đóng góp vào latency, và cách các kỹ thuật tối ưu tác động lên chúng.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* STEP 2: LATENCY BREAKDOWN */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label={LESSON_LABELS[1]}>
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Một request LLM đi qua bốn giai đoạn. Pie chart bên dưới hiển thị
          <strong className="text-foreground"> tỉ lệ thời gian</strong> mỗi stage chiếm trong tổng latency —
          con số trên mỗi lát là mili-giây thực tế với cấu hình hiện tại.
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Pie chart */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
              <svg viewBox="-120 -120 240 240" className="w-64 h-64 flex-shrink-0">
                {pieData.map((slice, i) => {
                  const r = 100;
                  const x1 = r * Math.cos(slice.start);
                  const y1 = r * Math.sin(slice.start);
                  const x2 = r * Math.cos(slice.end);
                  const y2 = r * Math.sin(slice.end);
                  const largeArc = slice.sweep > Math.PI ? 1 : 0;

                  // label position — middle of arc
                  const midAngle = (slice.start + slice.end) / 2;
                  const lr = r * 0.6;
                  const lx = lr * Math.cos(midAngle);
                  const ly = lr * Math.sin(midAngle);

                  return (
                    <motion.g
                      key={slice.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <path
                        d={`M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={slice.color}
                        stroke="#0f172a"
                        strokeWidth={1.5}
                        opacity={slice.fraction < 0.02 ? 0.4 : 0.92}
                      />
                      {slice.fraction > 0.06 && (
                        <text
                          x={lx}
                          y={ly}
                          textAnchor="middle"
                          fill="white"
                          fontSize={11}
                          fontWeight="bold"
                        >
                          {slice.ms.toFixed(0)}ms
                        </text>
                      )}
                    </motion.g>
                  );
                })}
                <circle r={30} fill="#0f172a" />
                <text
                  textAnchor="middle"
                  y={-2}
                  fill="var(--text-primary)"
                  fontSize={11}
                  fontWeight="bold"
                >
                  Tổng
                </text>
                <text
                  textAnchor="middle"
                  y={13}
                  fill="#a855f7"
                  fontSize={13}
                  fontWeight="bold"
                >
                  {currentTotal.toFixed(0)}ms
                </text>
              </svg>

              {/* Legend + speedup */}
              <div className="flex-1 min-w-0 space-y-2">
                {stageData.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {s.labelVi}
                        </div>
                        <div className="text-xs text-muted truncate">{s.note}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-mono font-bold text-foreground">
                        {s.ms.toFixed(0)}ms
                      </div>
                      {s.ms < s.baselineMs && (
                        <div className="text-[10px] text-emerald-500 font-mono">
                          −{Math.round((1 - s.ms / s.baselineMs) * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="mt-3 rounded-lg bg-accent/10 border border-accent/30 px-3 py-2 text-center">
                  <div className="text-xs text-muted">Tăng tốc so với baseline</div>
                  <div className="text-2xl font-bold text-accent">{speedup}×</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted text-center italic">
              Bật các toggle ở mục tiếp theo để xem từng lát thay đổi trực quan.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: TOGGLES */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label={LESSON_LABELS[2]}>
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bật từng kỹ thuật để xem <strong className="text-foreground">cumulative speedup</strong> —
          hiệu ứng nhân lên khi kết hợp. Không tối ưu nào là miễn phí: mỗi kỹ thuật
          có đánh đổi về chất lượng, bộ nhớ, hoặc độ phức tạp triển khai.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            {/* Toggle controls */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={resetToggles}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
              >
                Reset
              </button>
              <button
                onClick={allOn}
                className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition-colors"
              >
                Bật tất cả
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TOGGLES.map((t) => {
                const active = toggles[t.key];
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      toggleKey(t.key);
                      setCurrentStep(3);
                    }}
                    className={`text-left rounded-xl border px-4 py-3 transition-all ${
                      active
                        ? "border-accent bg-accent/10 shadow-sm"
                        : "border-border bg-card hover:border-border-strong"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            active
                              ? "border-accent bg-accent"
                              : "border-border bg-transparent"
                          }`}
                        >
                          {active && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          )}
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {t.labelVi}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-accent">
                        {t.speedupLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-snug pl-6">
                      {t.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Cumulative bar */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Latency hiện tại
                </span>
                <span className="text-xs text-muted">
                  Baseline {baselineTotal.toFixed(0)}ms → {currentTotal.toFixed(0)}ms
                </span>
              </div>
              <div className="relative h-8 rounded-lg bg-[#1e293b] overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-emerald-500"
                  animate={{
                    width: `${Math.min(100, (currentTotal / baselineTotal) * 100)}%`,
                  }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white drop-shadow">
                    {speedup}× nhanh hơn
                  </span>
                </div>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 4: BATCHING THROUGHPUT */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label={LESSON_LABELS[3]}>
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Batching không giảm latency/request — nó tăng
          <strong className="text-foreground"> throughput</strong> (req/s).
          Chọn batch size để so sánh throughput ở batch 1, 4, 16, 64.
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Batch selector */}
            <div className="flex justify-center gap-2">
              {BATCH_SIZES.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBatch(b)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    selectedBatch === b
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  Batch={b}
                </button>
              ))}
            </div>

            {/* Throughput bars */}
            <div className="space-y-2">
              {batchSamples.map((s) => {
                const pct = (s.throughput / maxThroughput) * 100;
                const selected = s.batch === selectedBatch;
                return (
                  <div key={s.batch} className="flex items-center gap-3">
                    <div className="w-16 text-right text-xs font-mono text-muted">
                      batch={s.batch}
                    </div>
                    <div className="flex-1 relative h-8 rounded-lg bg-[#1e293b] overflow-hidden">
                      <motion.div
                        className={`absolute inset-y-0 left-0 ${
                          selected ? "bg-accent" : "bg-blue-600/70"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className="text-xs font-bold text-white drop-shadow">
                          {s.throughput.toFixed(1)} req/s
                        </span>
                        <span className="text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                          {s.latency.toFixed(0)} ms/batch
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              {batchSamples.map((s) => (
                <div
                  key={s.batch}
                  className={`rounded-lg border px-2 py-2 ${
                    s.batch === selectedBatch
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="text-[10px] text-muted uppercase">B={s.batch}</div>
                  <div className="text-sm font-bold text-foreground">
                    {s.throughput.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-muted">req/s</div>
                </div>
              ))}
            </div>

            <Callout variant="tip" title="Quan sát">
              Khi batch tăng 64×, throughput không tăng đúng 64× — chỉ khoảng 45–55×. Overhead
              đến từ memory bandwidth và SM occupancy bão hoà. Đây là lý do điểm
              "batch=256" thường rớt khỏi Pareto frontier do out-of-memory.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 5: PARETO FRONTIER */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label={LESSON_LABELS[4]}>
        <p className="mb-4 text-sm text-muted leading-relaxed">
          <strong className="text-foreground">Pareto frontier</strong> là tập điểm
          không thể cải thiện một trục (latency hoặc throughput) mà không hy sinh trục còn lại.
          Các điểm KHÔNG trên frontier là tối ưu kém — có cấu hình tốt hơn ở cả hai trục.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 640 360" className="w-full max-w-3xl mx-auto">
              {/* Axes */}
              <line x1={60} y1={320} x2={620} y2={320} stroke="#475569" strokeWidth={1.5} />
              <line x1={60} y1={40} x2={60} y2={320} stroke="#475569" strokeWidth={1.5} />

              {/* Axis labels */}
              <text x={340} y={350} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>
                Latency/request (ms, thấp hơn = tốt hơn →)
              </text>
              <text
                x={-180}
                y={22}
                transform="rotate(-90)"
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize={11}
              >
                Throughput (req/s, ↑ cao hơn = tốt hơn)
              </text>

              {/* Grid */}
              {[0.25, 0.5, 0.75].map((f) => (
                <line
                  key={f}
                  x1={60}
                  y1={40 + f * 280}
                  x2={620}
                  y2={40 + f * 280}
                  stroke="#1e293b"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              ))}
              {[0.25, 0.5, 0.75].map((f) => (
                <line
                  key={`v${f}`}
                  x1={60 + f * 560}
                  y1={40}
                  x2={60 + f * 560}
                  y2={320}
                  stroke="#1e293b"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              ))}

              {/* Pareto line */}
              {(() => {
                const pareto = PARETO_POINTS.filter((p) => p.isPareto).sort(
                  (a, b) => a.latencyMs - b.latencyMs
                );
                const path = pareto
                  .map((p, i) => {
                    const x = 60 + (Math.min(1400, p.latencyMs) / 1400) * 560;
                    const y = 320 - (Math.min(200, p.throughput) / 200) * 280;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ");
                return (
                  <path
                    d={path}
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="none"
                    opacity={0.6}
                  />
                );
              })()}

              {/* Points */}
              {PARETO_POINTS.map((p) => {
                const x = 60 + (Math.min(1400, p.latencyMs) / 1400) * 560;
                const y = 320 - (Math.min(200, p.throughput) / 200) * 280;
                const isHover = hoverPoint === p.id;
                return (
                  <motion.g
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onMouseEnter={() => setHoverPoint(p.id)}
                    onMouseLeave={() => setHoverPoint(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHover ? 8 : 6}
                      fill={p.isPareto ? "#22c55e" : "#ef4444"}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      opacity={0.9}
                    />
                    <text
                      x={x + 10}
                      y={y - 6}
                      fill={isHover ? "#f8fafc" : "#cbd5e1"}
                      fontSize={isHover ? 11 : 9}
                      fontWeight={isHover ? "bold" : "normal"}
                    >
                      {p.labelVi}
                    </text>
                  </motion.g>
                );
              })}

              {/* Legend */}
              <g transform="translate(450, 50)">
                <rect x={0} y={0} width={160} height={54} rx={6} fill="#0f172a" opacity={0.85} />
                <circle cx={12} cy={16} r={5} fill="#22c55e" />
                <text x={24} y={20} fill="#e2e8f0" fontSize={11}>Trên Pareto frontier</text>
                <circle cx={12} cy={40} r={5} fill="#ef4444" />
                <text x={24} y={44} fill="#e2e8f0" fontSize={11}>Bị dominate (kém hơn)</text>
              </g>
            </svg>

            <Callout variant="info" title="Cách đọc chart">
              Trục X: latency (thấp = tốt, bên trái). Trục Y: throughput (cao = tốt, bên trên).
              Điểm xanh nằm trên đường gạch = Pareto optimal. Điểm đỏ bị thống trị —
              luôn có config xanh vừa nhanh hơn vừa throughput cao hơn hoặc bằng.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 6: AHA MOMENT */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label={LESSON_LABELS[5]}>
        <AhaMoment>
          <p>
            Bốn kỹ thuật không cộng — chúng <strong>nhân</strong>. KV cache ×2.5,
            speculative ×2.2, quantization ×1.8 — kết hợp cho ~10× chỉ trên decoding.
            Thêm batching nâng throughput ×50 mà không cần GPU mới.
            Đây là lý do <strong>model 70B có thể serve tại $0.0003/1K token</strong>{" "}
            trên hạ tầng cloud thương mại — điều tưởng chừng không thể nếu chỉ nhìn vào "baseline FP32".
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 7: CHALLENGE */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label={LESSON_LABELS[6]}>
        <InlineChallenge
          question="Chatbot của bạn có SLA: p95 latency < 250 ms. Hiện tại baseline FP16 batch=1 cho 500 ms. Kế hoạch nào giúp đạt SLA mà vẫn giữ throughput cao nhất?"
          options={[
            "Batch=64 + INT4 — tối đa throughput, latency chắc sẽ thấp",
            "KV cache + INT8 + speculative + batch=4 — giảm latency xuống ~150 ms, throughput 4×",
            "Chỉ quantization INT4 — giảm bộ nhớ là đủ",
          ]}
          correct={1}
          explanation="Kết hợp KV + INT8 + speculative giảm decode (stage chiếm ~70%) đáng kể — ước tính latency còn 130–170 ms. Batch=4 tăng throughput 4× mà không đẩy latency vượt SLA. Batch=64 (đáp án A) sẽ đẩy p95 lên 400+ ms → vi phạm SLA dù throughput cao. Chỉ INT4 (C) không đủ — decode vẫn là bottleneck."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Model 70B FP16 = 140 GB. GPU A100 có 80 GB. Dùng quantization nào để fit trên 1 GPU duy nhất?"
            options={[
              "FP16 — giữ nguyên, dùng CPU offload",
              "INT8 — giảm còn 70 GB, fit 80 GB",
              "INT4 — giảm còn 35 GB, còn dư cho KV cache",
            ]}
            correct={2}
            explanation="INT4 giảm 8× so với FP32 (hay 4× so với FP16): 140 GB → 35 GB. Còn lại 45 GB cho KV cache, activation, và overhead — đủ chạy batch lớn. INT8 (70 GB) fit nhưng chỉ còn 10 GB cho KV cache → batch rất nhỏ. Đây là lý do INT4 phổ biến cho serving model lớn."
          />
        </div>
      </LessonSection>

      {/* STEP 8: EXPLANATION */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label={LESSON_LABELS[7]}>
        <ExplanationSection>
          <p>
            <strong>Tối ưu suy luận (Inference Optimization)</strong> là nghệ thuật
            serving model AI với latency thấp, throughput cao, và chi phí nhỏ —
            mà KHÔNG đổi kiến trúc model hay huấn luyện lại.
          </p>

          <p>
            <strong>1. Tại sao decoding chậm?</strong>
          </p>
          <p>
            Mỗi token mới phải đi qua toàn bộ model — forward pass của model N tầng
            có độ phức tạp O(N · d²) với d là hidden size. Với Llama-70B, mỗi token mất
            ~2–5 ms trên A100. Sinh 512 token → 1–2.5 giây trần.
            Và không thể song song hoá vì token t+1 cần token t đã sinh (autoregressive).
          </p>

          <p>
            <strong>2. KV Cache — giảm O(N²) xuống O(N)</strong>
          </p>
          <p>
            Self-attention ở mỗi layer:
          </p>
          <LaTeX block>
            {"\\text{Attention}(Q, K, V) = \\text{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right) V"}
          </LaTeX>
          <p>
            Khi sinh token thứ t, chỉ Q<sub>t</sub> mới — còn K<sub>1..t-1</sub> và V<sub>1..t-1</sub>{" "}
            đã tính ở bước trước. Lưu chúng trong "KV cache" trên GPU memory,
            mỗi bước chỉ append K<sub>t</sub>, V<sub>t</sub>. Tiết kiệm ~2.5× trên decoding stage.
            Xem chi tiết tại <TopicLink slug="kv-cache">KV Cache</TopicLink>.
          </p>

          <CollapsibleDetail title="Công thức kích thước KV cache">
            <p className="text-sm text-muted leading-relaxed">
              Tổng bộ nhớ KV cache:
            </p>
            <LaTeX block>
              {"\\text{KV} = 2 \\cdot n_{\\text{layers}} \\cdot n_{\\text{heads}} \\cdot d_{\\text{head}} \\cdot L_{\\text{seq}} \\cdot B \\cdot \\text{bytes}"}
            </LaTeX>
            <p className="text-sm text-muted leading-relaxed">
              Ví dụ Llama-2 70B: 80 layers, 64 heads, 128 d_head, seq=4096, batch=1, FP16 (2 bytes).
              <br />
              KV = 2 × 80 × 64 × 128 × 4096 × 1 × 2 ≈ 10.7 GB — chỉ cho 1 request!
              <br />
              Đây là lý do batch lớn rất tốn bộ nhớ — và là động lực cho PagedAttention.
            </p>
          </CollapsibleDetail>

          <p>
            <strong>3. Speculative Decoding — dự đoán trước</strong>
          </p>
          <p>
            Ý tưởng (Leviathan et al., 2023): dùng một <em>draft model</em> nhỏ
            (ví dụ 1B params) sinh k token liên tiếp. Sau đó <em>target model</em>{" "}
            lớn (70B) verify k token trong MỘT forward pass — đây là khâu song song hoá được.
            Nếu accept m ≤ k token, speedup ≈ m.
          </p>
          <LaTeX block>
            {"\\mathbb{E}[\\text{tokens per step}] = 1 + \\sum_{i=1}^{k} \\prod_{j=1}^{i} \\alpha_j"}
          </LaTeX>
          <p>
            với α<sub>j</sub> là xác suất draft token thứ j được accept. Thực nghiệm cho thấy α ≈ 0.7–0.85,
            dẫn tới speedup 2–3×.
          </p>

          <p>
            <strong>4. Continuous Batching</strong>
          </p>
          <p>
            Static batching: đợi N request, xử lý cùng lúc, đợi request dài nhất xong.
            Lãng phí GPU vì các request ngắn kết thúc sớm nhưng slot vẫn chiếm.
          </p>
          <p>
            Continuous batching (Orca, vLLM): ngay khi một request xong, thay bằng request mới
            trong cùng batch. GPU utilization tăng từ ~30% lên 90%+.
            Xem <TopicLink slug="model-serving">Model Serving</TopicLink> và{" "}
            <TopicLink slug="gpu-optimization">GPU Optimization</TopicLink>.
          </p>
          <LaTeX block>
            {"\\text{GPU Util} = \\frac{\\text{Active compute}}{\\text{Peak FLOPs}} \\approx \\frac{B \\cdot \\text{FLOPs/token}}{\\text{TFLOPS}_{\\text{GPU}}}"}
          </LaTeX>

          <Callout variant="tip" title="PagedAttention (vLLM)">
            Cấp phát KV cache contiguous reserve max_seq_len — lãng phí ~60% khi sequence ngắn.
            PagedAttention chia KV cache thành page 16-token, cấp phát theo nhu cầu như virtual memory.
            Kết quả: waste 4%, batch size ×2–4, throughput ×3–5.
          </Callout>

          <p>
            <strong>5. Quantization</strong>
          </p>
          <p>
            Giảm số bit/tham số. FP16 → INT8 → INT4:
          </p>
          <LaTeX block>
            {"w_{\\text{int8}} = \\text{round}\\!\\left(\\frac{w_{\\text{fp32}}}{s}\\right), \\quad s = \\frac{\\max|w|}{127}"}
          </LaTeX>
          <p>
            Techniques: GPTQ, AWQ, SmoothQuant. Chất lượng thường giảm &lt; 1% với INT8,
            1–3% với INT4. Chi tiết tại <TopicLink slug="quantization">Quantization</TopicLink>.
          </p>

          <Callout variant="warning" title="Đánh đổi chất lượng">
            INT4 có thể làm hỏng các capability hiếm: reasoning nhiều bước, code phức tạp.
            Luôn evaluate trên benchmark trước khi deploy INT4 cho chatbot quan trọng.
            Khuyến nghị: INT8 là sweet spot cho production, INT4 cho edge/cost-critical.
          </Callout>

          <p>
            <strong>6. Pareto frontier — chọn config phù hợp</strong>
          </p>
          <p>
            Không có "config tốt nhất" — chỉ có config tốt nhất cho một use case:
          </p>
          <ul className="list-disc pl-6 text-sm text-muted space-y-1 my-2">
            <li>
              <strong>Interactive chat</strong>: p95 latency &lt; 300 ms → batch nhỏ (1–4), KV cache, speculative.
            </li>
            <li>
              <strong>Batch job</strong> (tóm tắt tài liệu): ưu tiên throughput → batch 64–128, INT4.
            </li>
            <li>
              <strong>Edge device</strong> (điện thoại): ưu tiên bộ nhớ → INT4, model nhỏ (3B–7B).
            </li>
            <li>
              <strong>RAG pipeline</strong>: prefill là bottleneck (prompt dài) → FlashAttention + prefix caching.
            </li>
          </ul>

          <CollapsibleDetail title="Pareto optimality — định nghĩa toán học">
            <p className="text-sm text-muted leading-relaxed">
              Một config x được gọi là Pareto-optimal nếu không tồn tại config y sao cho:
            </p>
            <LaTeX block>
              {"\\text{latency}(y) \\leq \\text{latency}(x) \\ \\wedge \\ \\text{throughput}(y) \\geq \\text{throughput}(x)"}
            </LaTeX>
            <p className="text-sm text-muted leading-relaxed">
              với ít nhất một bất đẳng thức là strict. Pareto frontier là tập các config Pareto-optimal.
              Trong thực tế, chọn điểm trên frontier gần nhất với ràng buộc SLA của bạn.
            </p>
          </CollapsibleDetail>

          <CodeBlock
            language="python"
            title="Inference tối ưu với vLLM (production-grade)"
          >
{`from vllm import LLM, SamplingParams

# Model đã quantize AWQ 4-bit: 70B params chỉ 35GB
# vLLM tự động xử lý continuous batching + PagedAttention
llm = LLM(
    model="TheBloke/Llama-3-70B-AWQ",
    quantization="awq",              # 4-bit AWQ
    tensor_parallel_size=2,          # 2 GPU A100
    max_model_len=8192,
    gpu_memory_utilization=0.95,
    enable_prefix_caching=True,      # Cache common system prompts
    speculative_model="facebook/opt-1.3b",  # Draft model nhỏ
    num_speculative_tokens=5,        # Propose 5 token mỗi lần
    enable_chunked_prefill=True,     # Chia prefill thành chunk nhỏ
)

params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=512,
)

# Gửi nhiều request cùng lúc — vLLM sẽ batch tự động
prompts = [
    "Giải thích AI cho học sinh lớp 5",
    "Viết đoạn code Python đọc CSV",
    "Tóm tắt cuốn sách Sapiens",
    # ... hàng trăm request
]

outputs = llm.generate(prompts, params)

# Metrics thực tế trên 2×A100 80GB:
#   - Baseline naive FP16:  ~200 tokens/s total
#   - Với vLLM + AWQ + spec: ~2000–3000 tokens/s total
#   - Chi phí giảm ~15× so với HuggingFace pipeline ngây thơ`}
          </CodeBlock>

          <CodeBlock
            language="bash"
            title="Deploy vLLM server với OpenAI-compatible API"
          >
{`# Khởi động vLLM OpenAI-compatible server
python -m vllm.entrypoints.openai.api_server \\
  --model TheBloke/Llama-3-70B-AWQ \\
  --quantization awq \\
  --tensor-parallel-size 2 \\
  --max-model-len 8192 \\
  --gpu-memory-utilization 0.95 \\
  --enable-prefix-caching \\
  --enable-chunked-prefill \\
  --host 0.0.0.0 \\
  --port 8000

# Client gọi như OpenAI API
curl http://localhost:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-3-70b",
    "messages": [{"role": "user", "content": "Chào bạn"}],
    "temperature": 0.7,
    "max_tokens": 256
  }'

# Benchmark throughput với vllm benchmark tool
python benchmarks/benchmark_serving.py \\
  --backend vllm \\
  --model TheBloke/Llama-3-70B-AWQ \\
  --num-prompts 1000 \\
  --request-rate 50

# Kết quả điển hình trên 2×A100:
#   Successful requests: 1000
#   Total tokens: 256000
#   Throughput: 2800 tokens/s
#   Mean TTFT: 180 ms
#   Mean TPOT: 28 ms
#   P95 latency: 240 ms`}
          </CodeBlock>

          <Callout variant="info" title="Tốc độ đổi mới">
            Lĩnh vực inference optimization đổi mới rất nhanh. Mỗi vài tháng có kỹ thuật mới:
            FlashAttention-3, Medusa (multi-head speculative), Lookahead Decoding,
            Grouped-Query Attention. Theo dõi vLLM changelog và SGLang để cập nhật.
          </Callout>

          <p>
            Khi kết hợp tối ưu suy luận với <TopicLink slug="cost-optimization">chiến lược chi phí</TopicLink>{" "}
            (spot instance, multi-region, autoscaling) và <TopicLink slug="model-serving">model serving</TopicLink>{" "}
            (canary deploy, A/B test), bạn có được một hệ thống AI production-grade
            phục vụ hàng triệu người dùng với chi phí kiểm soát được.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 9: SUMMARY + QUIZ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label={LESSON_LABELS[8]}>
        <MiniSummary
          points={[
            "Latency của 1 request LLM = tokenization + prefill + KV lookup + decoding. Decoding chiếm ~68% vì autoregressive.",
            "KV cache lưu attention đã tính → giảm decoding từ O(N²) xuống O(N), tăng tốc ~2.5×.",
            "Speculative decoding dùng draft model nhỏ đề xuất, target model verify song song → ×2–3 khi acceptance rate cao.",
            "Continuous batching tăng throughput ×5–10 mà KHÔNG giảm latency; PagedAttention (vLLM) giảm waste KV cache từ 60% xuống 4%.",
            "Quantization INT8/INT4 giảm bộ nhớ 4–8× và tăng tốc 1.5–2× — sweet spot INT8 cho chất lượng, INT4 cho tiết kiệm.",
            "Pareto frontier latency ↔ throughput: không có config tốt nhất — chọn theo SLA. Kết hợp 4 kỹ thuật có thể giảm chi phí 10–50×.",
          ]}
        />

        <div className="mt-6">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
