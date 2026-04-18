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

// ---------------------------------------------------------------------------
// METADATA
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "gpu-optimization",
  title: "GPU Optimization",
  titleVi: "Tối ưu GPU — Profiler kéo sập bottleneck",
  description:
    "Mở profiler, quan sát từng lát cắt thời gian trên GPU: truyền dữ liệu HBM↔SRAM, tính toán matmul, chu kỳ idle. Bật FP16, gradient checkpointing, tensor cores, data parallel để xem throughput đổi thay.",
  category: "infrastructure",
  tags: ["gpu", "cuda", "profiler", "mixed-precision", "tensor-cores"],
  difficulty: "advanced",
  relatedSlugs: ["inference-optimization", "model-serving", "cost-optimization"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// KIỂU DỮ LIỆU CHO PROFILER
// ---------------------------------------------------------------------------
//
// Mỗi "event" trên timeline đại diện cho một khối công việc mà GPU thực hiện
// trong một khoảng thời gian rất ngắn (tính bằng micro-giây). Profiler thật
// của NVIDIA (Nsight Systems, Nsight Compute) cũng tổ chức dữ liệu theo kiểu
// này: stream → category → span.
//
// Chúng ta mô phỏng 3 loại event phổ biến nhất:
//   • hbm     → copy tensor từ HBM (High Bandwidth Memory) lên SRAM on-chip
//   • compute → matmul / convolution trên Tensor Cores hoặc CUDA cores
//   • idle    → GPU chờ data, chờ kernel launch, chờ sync
//
// ---------------------------------------------------------------------------

type EventKind = "hbm" | "compute" | "idle";

interface TimelineEvent {
  kind: EventKind;
  label: string;
  // vị trí bắt đầu / kết thúc tính theo phần trăm chiều dài timeline
  start: number;
  end: number;
}

interface ProfilerScenario {
  // thông số cấu hình hiện tại của người dùng
  fp16: boolean;
  checkpoint: boolean;
  tensorCores: boolean;
  dataParallel: boolean;
}

interface ProfilerResult {
  events: TimelineEvent[];
  throughput: number; // samples/sec
  hbmBandwidth: number; // GB/s thực tế đạt được
  computeTflops: number;
  memoryFootprint: number; // GB
  bottleneck: "compute" | "memory" | "balanced" | "idle";
  computeShare: number; // % thời gian thực sự compute
  memoryShare: number; // % thời gian truyền memory
  idleShare: number; // % thời gian idle
}

// ---------------------------------------------------------------------------
// HẰNG SỐ VẬT LÝ CỦA GPU GIẢ ĐỊNH
// ---------------------------------------------------------------------------
//
// Các con số này dựa trên một GPU tầm cỡ A100 80GB, sau đó scale xuống cho
// dễ cảm nhận. Mục tiêu của mô phỏng không phải là chính xác tuyệt đối mà là
// truyền đúng "trật tự độ lớn" — ai dùng GPU thật cũng sẽ nhận ra.

const PEAK_TFLOPS_FP32 = 19.5; // theo datasheet A100 FP32
const PEAK_TFLOPS_TENSOR_FP16 = 312; // Tensor Core FP16
const PEAK_HBM_BANDWIDTH = 1555; // GB/s
const GLOBAL_BATCH = 128;
const SEQ_LEN = 1024;
const HIDDEN = 4096;

// ---------------------------------------------------------------------------
// BỘ SINH TIMELINE
// ---------------------------------------------------------------------------
//
// Bài toán giả định: một bước forward + backward của một Transformer block.
// Mỗi block thực hiện:
//   1. Load activation từ HBM vào SRAM
//   2. QKV projection (matmul lớn)
//   3. Attention scores (matmul)
//   4. Softmax + dropout
//   5. Context matmul
//   6. Output projection
//   7. Store activation về HBM (để backward pass dùng)
//
// Khi người dùng bật FP16, các matmul chạy trên Tensor Cores nhanh gấp nhiều
// lần. Khi bật checkpointing, activation không lưu toàn bộ mà tính lại ở
// backward → tiết kiệm memory nhưng tốn thêm compute. Khi bật data parallel,
// communication (all-reduce gradient) chen vào timeline.
//
// Kết quả: mảng sự kiện có start/end đã được sắp xếp, không chồng chéo.

function generateTimeline(scenario: ProfilerScenario): ProfilerResult {
  const { fp16, checkpoint, tensorCores, dataParallel } = scenario;

  // ---- Bước 1: tính thời gian cho từng category ----
  // Đơn vị: phần trăm của toàn bộ chu kỳ (100 = toàn bộ 1 step)

  // Memory transfer baseline
  let hbmTime = 30; // FP32 activation + gradient
  if (fp16) hbmTime *= 0.55; // bandwidth giảm gần nửa
  if (checkpoint) hbmTime *= 0.7; // ít activation phải store

  // Compute baseline
  let computeTime = 35;
  if (fp16 && tensorCores) computeTime *= 0.18; // Tensor Core FP16 ~ 16x FP32
  else if (fp16) computeTime *= 0.55;
  if (checkpoint) computeTime *= 1.35; // recompute forward ở backward

  // Data parallel → communication overhead
  let commTime = 0;
  if (dataParallel) commTime = 12 + (fp16 ? -3 : 0); // fp16 gradient sync ít hơn

  // Idle time — mọi thứ còn lại (data loader, kernel launch, sync)
  // Không bao giờ bằng 0 trong thực tế, có sàn tối thiểu.
  const accounted = hbmTime + computeTime + commTime;
  let idleTime = Math.max(8, 100 - accounted);

  // Re-normalize để tổng về lại 100 (nếu tràn)
  const total = hbmTime + computeTime + commTime + idleTime;
  const scale = 100 / total;
  hbmTime *= scale;
  computeTime *= scale;
  commTime *= scale;
  idleTime *= scale;

  // ---- Bước 2: dàn các event theo trật tự thời gian ----

  const events: TimelineEvent[] = [];
  let cursor = 0;

  // 1. Load activation input từ HBM
  const load1 = hbmTime * 0.3;
  events.push({
    kind: "hbm",
    label: "Load act (HBM→SRAM)",
    start: cursor,
    end: cursor + load1,
  });
  cursor += load1;

  // 2. QKV projection — matmul lớn
  const qkv = computeTime * 0.35;
  events.push({
    kind: "compute",
    label: "QKV matmul",
    start: cursor,
    end: cursor + qkv,
  });
  cursor += qkv;

  // 3. Idle nhỏ (kernel launch overhead)
  const launchIdle = idleTime * 0.25;
  events.push({
    kind: "idle",
    label: "Kernel launch",
    start: cursor,
    end: cursor + launchIdle,
  });
  cursor += launchIdle;

  // 4. Attention scores matmul
  const attn = computeTime * 0.25;
  events.push({
    kind: "compute",
    label: "Attn scores",
    start: cursor,
    end: cursor + attn,
  });
  cursor += attn;

  // 5. HBM roundtrip cho softmax (memory-bound)
  const smem = hbmTime * 0.35;
  events.push({
    kind: "hbm",
    label: "Softmax I/O",
    start: cursor,
    end: cursor + smem,
  });
  cursor += smem;

  // 6. Context matmul
  const ctx = computeTime * 0.25;
  events.push({
    kind: "compute",
    label: "Context matmul",
    start: cursor,
    end: cursor + ctx,
  });
  cursor += ctx;

  // 7. Output projection
  const outProj = computeTime * 0.15;
  events.push({
    kind: "compute",
    label: "Output proj",
    start: cursor,
    end: cursor + outProj,
  });
  cursor += outProj;

  // 8. Idle (sync before commit)
  const syncIdle = idleTime * 0.35;
  events.push({
    kind: "idle",
    label: "Sync",
    start: cursor,
    end: cursor + syncIdle,
  });
  cursor += syncIdle;

  // 9. Store output về HBM
  const store = hbmTime * 0.35;
  events.push({
    kind: "hbm",
    label: "Store act (SRAM→HBM)",
    start: cursor,
    end: cursor + store,
  });
  cursor += store;

  // 10. Communication (nếu data parallel)
  if (commTime > 0) {
    events.push({
      kind: "hbm",
      label: "All-reduce grad",
      start: cursor,
      end: cursor + commTime,
    });
    cursor += commTime;
  }

  // 11. Idle còn lại
  const tailIdle = Math.max(0, 100 - cursor);
  if (tailIdle > 0.5) {
    events.push({
      kind: "idle",
      label: "Data loader wait",
      start: cursor,
      end: cursor + tailIdle,
    });
  }

  // ---- Bước 3: tính các chỉ số tổng hợp ----

  // Throughput (samples/sec) — giả định 1 step = 10ms baseline, scale ngược
  // theo thời gian compute+memory thực tế. Thêm lợi ích data parallel.
  const baselineStepMs = 120;
  const actualStepMs = baselineStepMs * (hbmTime + computeTime) / 65;
  let throughput = (GLOBAL_BATCH / (actualStepMs / 1000));
  if (dataParallel) throughput *= 1.85; // ~8 GPU scaling không lý tưởng

  // Compute throughput thực (TFLOPS)
  let tflops = 8.2;
  if (fp16 && tensorCores) tflops = 178;
  else if (fp16) tflops = 32;

  // HBM bandwidth thực sự đạt được (% của peak)
  let hbmUsed = PEAK_HBM_BANDWIDTH * 0.48;
  if (fp16) hbmUsed = PEAK_HBM_BANDWIDTH * 0.55;
  if (checkpoint) hbmUsed *= 0.9;

  // Memory footprint
  let mem = 68; // GB baseline FP32 (gradient + optimizer + activation)
  if (fp16) mem *= 0.55;
  if (checkpoint) mem *= 0.45;
  if (dataParallel) mem *= 1.08; // overhead buffer

  // Bottleneck analysis
  const totalNonIdle = hbmTime + computeTime;
  const computeShare = computeTime;
  const memoryShare = hbmTime;
  const idleShare = idleTime;
  let bottleneck: ProfilerResult["bottleneck"];
  if (idleShare > 25) bottleneck = "idle";
  else if (computeShare / totalNonIdle > 0.6) bottleneck = "compute";
  else if (memoryShare / totalNonIdle > 0.55) bottleneck = "memory";
  else bottleneck = "balanced";

  return {
    events,
    throughput: Math.round(throughput),
    hbmBandwidth: Math.round(hbmUsed),
    computeTflops: Math.round(tflops * 10) / 10,
    memoryFootprint: Math.round(mem * 10) / 10,
    bottleneck,
    computeShare: Math.round(computeShare),
    memoryShare: Math.round(memoryShare),
    idleShare: Math.round(idleShare),
  };
}

// ---------------------------------------------------------------------------
// COMPONENT CON — THANH TIMELINE
// ---------------------------------------------------------------------------

const EVENT_COLORS: Record<EventKind, { bar: string; dot: string; label: string }> = {
  compute: {
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    label: "text-emerald-700 dark:text-emerald-300",
  },
  hbm: {
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    label: "text-amber-700 dark:text-amber-300",
  },
  idle: {
    bar: "bg-rose-400",
    dot: "bg-rose-400",
    label: "text-rose-700 dark:text-rose-300",
  },
};

interface TimelineProps {
  events: TimelineEvent[];
  streamLabel: string;
}

function TimelineStream({ events, streamLabel }: TimelineProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted w-20 shrink-0">
          {streamLabel}
        </span>
        <div className="relative h-8 w-full rounded-md bg-surface/70 border border-border overflow-hidden">
          {events.map((ev, i) => {
            const width = ev.end - ev.start;
            if (width < 0.3) return null; // ẩn event quá nhỏ để không làm rối UI
            const color = EVENT_COLORS[ev.kind].bar;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleY: 0.6 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className={`absolute top-1 bottom-1 ${color} flex items-center justify-center`}
                style={{
                  left: `${ev.start}%`,
                  width: `${width}%`,
                }}
                title={`${ev.label} • ${width.toFixed(1)}%`}
              >
                {width > 8 && (
                  <span className="text-[10px] font-medium text-white truncate px-1">
                    {ev.label}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPONENT CON — TOGGLE
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ label, hint, value, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-full text-left rounded-xl border p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
        value
          ? "border-accent bg-accent-light"
          : "border-border bg-card hover:bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{label}</div>
          <div className="text-xs text-muted mt-0.5 leading-snug">{hint}</div>
        </div>
        <div
          className={`shrink-0 w-10 h-5 rounded-full relative transition-colors ${
            value ? "bg-accent" : "bg-surface border border-border"
          }`}
        >
          <motion.div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
            animate={{ left: value ? "calc(100% - 18px)" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// COMPONENT CON — METRIC CARD
// ---------------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  trend?: "up" | "down" | "flat";
  subtitle?: string;
}

function MetricCard({ label, value, unit, trend, subtitle }: MetricCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted";
  const trendGlyph = trend === "up" ? "↑" : trend === "down" ? "↓" : "·";
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-semibold text-foreground tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-muted font-mono">{unit}</span>
        )}
        {trend && (
          <span className={`ml-auto text-xs ${trendColor}`}>{trendGlyph}</span>
        )}
      </div>
      {subtitle && (
        <div className="text-[11px] text-muted mt-1 leading-snug">
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPONENT CON — BOTTLENECK BADGE
// ---------------------------------------------------------------------------

function BottleneckBadge({
  kind,
}: {
  kind: ProfilerResult["bottleneck"];
}) {
  const config: Record<
    ProfilerResult["bottleneck"],
    { bg: string; text: string; label: string; hint: string }
  > = {
    compute: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-800 dark:text-emerald-200",
      label: "Compute-bound",
      hint: "GPU đang chạy matmul hết công suất — tốt, nhưng muốn nhanh hơn phải tăng Tensor Core efficiency.",
    },
    memory: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-800 dark:text-amber-200",
      label: "Memory-bound",
      hint: "Phần lớn thời gian chờ HBM — hãy giảm độ rộng tensor, dùng FP16, hoặc fuse kernel để ít roundtrip hơn.",
    },
    balanced: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-800 dark:text-blue-200",
      label: "Cân bằng",
      hint: "Compute và memory share đều nhau — cấu hình tốt, phần lớn phép toán đang roofline optimal.",
    },
    idle: {
      bg: "bg-rose-100 dark:bg-rose-900/30",
      text: "text-rose-800 dark:text-rose-200",
      label: "Idle-bound",
      hint: "GPU chờ nhiều — nghi vấn data loader chậm, batch nhỏ, sync không cần thiết, hoặc CPU preprocessing.",
    },
  };
  const c = config[kind];
  return (
    <div
      className={`rounded-xl border border-border px-4 py-3 ${c.bg} ${c.text}`}
    >
      <div className="text-xs uppercase tracking-wide opacity-80">
        Bottleneck chính
      </div>
      <div className="text-lg font-bold mt-0.5">{c.label}</div>
      <div className="text-xs mt-1 leading-snug opacity-90">{c.hint}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPONENT CHÍNH
// ---------------------------------------------------------------------------

export default function GPUOptimizationTopic() {
  const [fp16, setFp16] = useState(false);
  const [checkpoint, setCheckpoint] = useState(false);
  const [tensorCores, setTensorCores] = useState(false);
  const [dataParallel, setDataParallel] = useState(false);

  const scenario: ProfilerScenario = useMemo(
    () => ({ fp16, checkpoint, tensorCores, dataParallel }),
    [fp16, checkpoint, tensorCores, dataParallel],
  );

  const result = useMemo(() => generateTimeline(scenario), [scenario]);

  // baseline để có thể show delta
  const baseline = useMemo(
    () =>
      generateTimeline({
        fp16: false,
        checkpoint: false,
        tensorCores: false,
        dataParallel: false,
      }),
    [],
  );

  const throughputTrend =
    result.throughput > baseline.throughput * 1.05
      ? "up"
      : result.throughput < baseline.throughput * 0.95
        ? "down"
        : "flat";

  const memoryTrend =
    result.memoryFootprint < baseline.memoryFootprint * 0.95
      ? "down"
      : result.memoryFootprint > baseline.memoryFootprint * 1.05
        ? "up"
        : "flat";

  const resetAll = useCallback(() => {
    setFp16(false);
    setCheckpoint(false);
    setTensorCores(false);
    setDataParallel(false);
  }, []);

  const maxOut = useCallback(() => {
    setFp16(true);
    setCheckpoint(true);
    setTensorCores(true);
    setDataParallel(true);
  }, []);

  // ---------------------------------------------------------------------------
  // QUIZ
  // ---------------------------------------------------------------------------

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "Profiler cho thấy kernel matmul chiếm 70% thời gian, HBM transfer chỉ 15%, idle 5%. Workload này là gì?",
        options: [
          "Memory-bound — cần giảm kích thước tensor",
          "Compute-bound — cần Tensor Core hoặc precision thấp hơn",
          "Idle-bound — cần data loader nhanh hơn",
          "Bandwidth-saturated — cần PCIe 5.0",
        ],
        correct: 1,
        explanation:
          "Khi compute chiếm phần lớn timeline và HBM thấp, GPU đang sử dụng tốt nhưng bị giới hạn bởi throughput arithmetic. Giải pháp: dùng FP16/BF16 trên Tensor Cores (16x throughput so với FP32 CUDA core), hoặc fuse kernels để tiết kiệm launch overhead.",
      },
      {
        question:
          "Mixed Precision (FP16/BF16) tăng throughput nhờ điều gì trước hết?",
        options: [
          "GPU chạy ở tần số cao hơn khi dùng FP16",
          "FP16 tăng gấp đôi số phép tính mỗi cycle trên Tensor Core + giảm nửa băng thông HBM",
          "FP16 loại bỏ bước softmax cần thiết",
          "FP16 tự động kích hoạt data parallelism",
        ],
        correct: 1,
        explanation:
          "Tensor Cores xử lý FP16 nhanh gấp 8-16x so với FP32 trên CUDA core. Đồng thời mỗi tensor chỉ chiếm một nửa dung lượng → HBM bandwidth hiệu dụng tăng gấp đôi. Hai lợi ích này nhân với nhau là lý do mixed precision gần như luôn là optimization đầu tiên nên bật.",
      },
      {
        question:
          "Gradient checkpointing đánh đổi tài nguyên nào?",
        options: [
          "Đánh đổi thời gian compute lấy ít memory hơn (tính lại activation ở backward)",
          "Đánh đổi memory lấy ít compute hơn (cache activation tốt hơn)",
          "Không đánh đổi gì — free lunch",
          "Đánh đổi accuracy lấy tốc độ",
        ],
        correct: 0,
        explanation:
          "Thay vì lưu mọi activation của forward pass để backward dùng, gradient checkpointing chỉ lưu một subset và tính lại phần còn lại trong backward. Kết quả: memory giảm 50-70%, compute tăng ~30%. Đáng giá khi bạn muốn train model lớn hơn trên cùng GPU.",
      },
      {
        question:
          "Data parallelism trên 8 GPU thực tế chỉ tăng throughput ~6.5x (không phải 8x). Tại sao?",
        options: [
          "GPU không đồng bộ tần số",
          "Chi phí all-reduce gradient giữa các GPU chiếm thời gian",
          "Hệ điều hành giới hạn số thread",
          "FP16 không hoạt động trên nhiều GPU",
        ],
        correct: 1,
        explanation:
          "Mỗi step, các GPU phải trao đổi gradient để cập nhật weight đồng nhất. All-reduce qua NVLink hoặc InfiniBand tốn thời gian, và thời gian này không scale xuống khi tăng GPU. Đây là lý do công cụ như NCCL, ring-allreduce, và gradient compression ra đời.",
      },
      {
        question:
          "Thuật ngữ 'roofline model' nghĩa là gì?",
        options: [
          "Một architecture để train transformer nhanh hơn",
          "Một biểu đồ cho biết workload bị giới hạn bởi compute hay memory bandwidth, dựa trên arithmetic intensity",
          "Phương pháp checkpoint cho long-context LLM",
          "Kỹ thuật nén gradient trong distributed training",
        ],
        correct: 1,
        explanation:
          "Roofline model vẽ: trục x = arithmetic intensity (FLOPs per byte), trục y = performance (FLOPs/s). Đường 'mái' có hai đoạn: đoạn nghiêng = bandwidth-bound, đoạn ngang = compute-bound. Workload của bạn nằm dưới mái đó — khoảng cách đến mái cho biết còn bao nhiêu dư địa tối ưu.",
      },
      {
        question:
          "Kernel fusion (ví dụ: FlashAttention) giúp nhanh vì sao?",
        options: [
          "Dùng thuật toán attention mới có độ phức tạp thấp hơn",
          "Giữ intermediate tensor trong SRAM on-chip thay vì roundtrip qua HBM",
          "Chạy attention song song trên nhiều GPU",
          "Dùng FP8 thay vì FP16",
        ],
        correct: 1,
        explanation:
          "Attention chuẩn tạo ra ma trận N×N rất lớn, phải ghi vào HBM rồi đọc lại cho softmax. FlashAttention fuse các bước (matmul → softmax → matmul) thành một kernel duy nhất, giữ tile dữ liệu trong SRAM (nhanh hơn HBM ~50x). Kết quả: 2-4x nhanh hơn mà kết quả toán học giống hệt.",
      },
      {
        question:
          "Khi huấn luyện model 70B trên một GPU 80GB, bạn gặp OOM. Chiến lược đầu tiên nên thử?",
        options: [
          "Tăng batch size để amortize overhead",
          "Kết hợp FP16/BF16 + gradient checkpointing + ZeRO/FSDP để shard state",
          "Giảm learning rate",
          "Đổi sang CPU training",
        ],
        correct: 1,
        explanation:
          "Thứ tự 'rẻ tới đắt': (1) mixed precision cắt memory gần nửa, (2) gradient checkpointing cắt thêm 50%, (3) ZeRO Stage 2/3 hoặc FSDP shard optimizer states và weights qua nhiều GPU. Ba kỹ thuật này có thể fit 70B trên cluster 8×A100 mà không cần pipeline parallelism.",
      },
      {
        question:
          "Trong profiler, bạn thấy GPU utilization chỉ 35% dù không có idle lớn. Nguyên nhân có thể là?",
        options: [
          "GPU có thể đang chạy nhiều kernel nhỏ không lấp đầy SM (streaming multiprocessor)",
          "GPU bị overheat và throttle",
          "Driver CUDA quá mới",
          "Code Python quá chậm",
        ],
        correct: 0,
        explanation:
          "GPU có hàng trăm SM; một kernel nhỏ (batch bé, hidden dim thấp) chỉ dùng vài chục SM → occupancy thấp. Utilization % trong nvidia-smi thực ra là 'có ít nhất 1 kernel chạy', không phản ánh occupancy. Cần Nsight Compute để thấy achieved occupancy thật. Giải pháp: tăng batch, fuse kernel, hoặc dùng CUDA graphs để loại overhead.",
      },
    ],
    [],
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* ==================================================================
          BƯỚC 1 — HOOK / DỰ ĐOÁN
          ================================================================== */}

      <PredictionGate
        question="Một GPU A100 có thể đạt 312 TFLOPS khi chạy FP16 Tensor Core. Trong thực tế, một bài train LLM thường đạt bao nhiêu phần trăm con số đó?"
        options={[
          "80-95% — hầu hết các thư viện đều tối ưu rất tốt",
          "40-60% — còn rất nhiều dư địa để profiler phát hiện",
          "10-25% — thường bị nghẽn memory, idle, hoặc kernel nhỏ",
          "100% — miễn là bạn dùng PyTorch",
        ]}
        correct={2}
        explanation="Phần lớn training run đạt 15-30% peak FLOPS. Thủ phạm thường là: (1) memory bandwidth bottleneck, (2) kernel launch overhead cho batch nhỏ, (3) data loader chậm làm GPU idle. Profiler cho bạn bằng chứng cụ thể để biết gỡ chỗ nào trước."
      >
        <p className="text-sm text-muted mt-2">
          Hôm nay bạn sẽ mở một profiler giả lập, bật/tắt từng tối ưu và thấy
          timeline thay đổi. Đây là cách engineer thật debug performance.
        </p>
      </PredictionGate>

      {/* ==================================================================
          BƯỚC 2 — ẨN DỤ THỰC TẾ
          ================================================================== */}

      <p>
        Hãy hình dung một nhà máy cơ khí có <strong>hàng nghìn máy CNC</strong>
        {" "}chạy song song — đó là GPU. Phía trong phân xưởng là{" "}
        <strong>kho nguyên liệu nhỏ nhưng cực nhanh</strong> (SRAM, vài MB) và
        bên ngoài là <strong>kho tổng khổng lồ nhưng xa hơn</strong> (HBM, vài
        chục GB). Mỗi khi máy CNC cần thêm nguyên liệu, xe nâng phải chạy ra
        kho tổng, lấy pallet, và mang về. Nếu máy CNC cứ phải chờ xe nâng, sản
        lượng tuột dốc dù bạn có thêm bao nhiêu máy đi nữa.
      </p>
      <p>
        Đó chính là{" "}
        <strong>vấn đề memory bandwidth</strong>: tốc độ tính toán của Tensor
        Core nhanh hơn tốc độ HBM khoảng 50-100 lần. Phần lớn công việc của
        kỹ sư tối ưu GPU là sắp xếp lại timeline sao cho xe nâng và máy CNC
        không phải đợi nhau. Profiler là camera quan sát toàn bộ phân xưởng —
        không có nó, bạn chỉ đang đoán.
      </p>
      <p>
        Các tối ưu nổi tiếng đều có bóng dáng trong ẩn dụ này. Mixed precision
        giống như dùng pallet nhẹ hơn — xe nâng chạy nhanh hơn. Gradient
        checkpointing là &quot;vứt bớt bán thành phẩm, tự gia công lại khi
        cần&quot; — đánh đổi thời gian máy lấy không gian kho. Kernel fusion
        (ví dụ FlashAttention) là &quot;làm xong cả 3 công đoạn trước khi trả
        pallet về kho tổng&quot;. Data parallelism là mở thêm nhà máy song
        song, nhưng đêm nào các nhà máy cũng phải họp để chia sẻ bản vẽ
        (all-reduce gradient).
      </p>
      <p>
        Trong phần tiếp theo, bạn sẽ cầm lái profiler. Mỗi toggle bạn bật là
        một tinh chỉnh trên phân xưởng; timeline thay đổi ngay lập tức, và
        bottleneck badge cho biết đâu là chỗ nghẽn tiếp theo. Đừng chỉ nhìn
        throughput tăng — quan trọng hơn là hiểu <em>tại sao</em>.
      </p>

      {/* ==================================================================
          BƯỚC 3 — VISUALIZATION: GPU PROFILER VIEW
          ================================================================== */}

      <VisualizationSection topicSlug={metadata.slug}>
        <LessonSection label="Profiler GPU tương tác" step={1} totalSteps={3}>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Nsight-style timeline
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Mỗi thanh là một event GPU trong 1 training step. Bật các
                  tối ưu bên dưới và quan sát.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-surface"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={maxOut}
                  className="text-xs px-3 py-1.5 rounded-lg border border-accent bg-accent-light text-accent-dark dark:text-accent hover:bg-accent/10"
                >
                  Bật hết
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3 h-3 rounded-sm ${EVENT_COLORS.compute.dot}`}
                />
                <span
                  className={EVENT_COLORS.compute.label}
                >
                  Compute (matmul)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${EVENT_COLORS.hbm.dot}`} />
                <span className={EVENT_COLORS.hbm.label}>
                  HBM ↔ SRAM (memory)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3 h-3 rounded-sm ${EVENT_COLORS.idle.dot}`}
                />
                <span className={EVENT_COLORS.idle.label}>Idle / wait</span>
              </div>
            </div>

            {/* Timeline streams */}
            <div className="rounded-xl border border-border bg-card/70 p-4 space-y-3">
              <TimelineStream events={result.events} streamLabel="GPU 0" />
              {/* Thanh chia tỉ lệ phần trăm dưới timeline */}
              <div className="flex items-center gap-2">
                <span className="w-20" />
                <div className="relative w-full h-4">
                  {[0, 25, 50, 75, 100].map((mark) => (
                    <div
                      key={mark}
                      className="absolute top-0 text-[10px] font-mono text-muted -translate-x-1/2"
                      style={{ left: `${mark}%` }}
                    >
                      {mark}%
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ToggleRow
                label="FP16 Mixed Precision"
                hint="Tensor half-precision. Giảm memory 50%, tăng throughput 2-8x."
                value={fp16}
                onChange={setFp16}
              />
              <ToggleRow
                label="Tensor Cores"
                hint="Phần cứng chuyên cho matmul FP16/BF16/TF32. Hiệu quả với FP16."
                value={tensorCores}
                onChange={setTensorCores}
              />
              <ToggleRow
                label="Gradient Checkpointing"
                hint="Tính lại activation ở backward. Giảm memory 50%, tốn thêm compute ~30%."
                value={checkpoint}
                onChange={setCheckpoint}
              />
              <ToggleRow
                label="Data Parallel (8 GPU)"
                hint="Replicate model, shard batch, all-reduce gradient. Tăng throughput nhưng thêm communication."
                value={dataParallel}
                onChange={setDataParallel}
              />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                label="Throughput"
                value={result.throughput.toLocaleString()}
                unit="samples/s"
                trend={throughputTrend}
                subtitle={`baseline: ${baseline.throughput.toLocaleString()}`}
              />
              <MetricCard
                label="Compute"
                value={result.computeTflops.toFixed(1)}
                unit="TFLOPS"
                trend={
                  result.computeTflops > baseline.computeTflops ? "up" : "flat"
                }
                subtitle={`peak FP16: ${PEAK_TFLOPS_TENSOR_FP16}`}
              />
              <MetricCard
                label="HBM used"
                value={result.hbmBandwidth.toLocaleString()}
                unit="GB/s"
                trend={
                  result.hbmBandwidth > baseline.hbmBandwidth ? "up" : "flat"
                }
                subtitle={`peak: ${PEAK_HBM_BANDWIDTH}`}
              />
              <MetricCard
                label="Memory"
                value={result.memoryFootprint.toFixed(1)}
                unit="GB"
                trend={memoryTrend}
                subtitle="activation + grad + opt"
              />
            </div>

            {/* Time share breakdown */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Phân bổ thời gian
              </div>
              <div className="flex h-6 w-full overflow-hidden rounded-md border border-border">
                <motion.div
                  className={EVENT_COLORS.compute.bar}
                  animate={{ width: `${result.computeShare}%` }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className={EVENT_COLORS.hbm.bar}
                  animate={{ width: `${result.memoryShare}%` }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className={EVENT_COLORS.idle.bar}
                  animate={{ width: `${result.idleShare}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className={EVENT_COLORS.compute.label}>
                  Compute {result.computeShare}%
                </span>
                <span className={EVENT_COLORS.hbm.label}>
                  Memory {result.memoryShare}%
                </span>
                <span className={EVENT_COLORS.idle.label}>
                  Idle {result.idleShare}%
                </span>
              </div>
            </div>

            {/* Bottleneck analysis */}
            <BottleneckBadge kind={result.bottleneck} />

            <Callout variant="tip" title="Bài tập quan sát">
              Bật từng toggle một lần lượt, bắt đầu từ FP16 → Tensor Cores →
              Checkpointing → Data Parallel. Lưu ý loại bottleneck thay đổi
              như thế nào. Đây là flow debug thật trong production.
            </Callout>
          </div>
        </LessonSection>

        <LessonSection
          label="Tra cứu: thông số GPU A100"
          step={2}
          totalSteps={3}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-muted">Peak FP32 (CUDA)</div>
              <div className="font-semibold text-foreground text-base">
                {PEAK_TFLOPS_FP32} TFLOPS
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-muted">Peak FP16 (Tensor)</div>
              <div className="font-semibold text-foreground text-base">
                {PEAK_TFLOPS_TENSOR_FP16} TFLOPS
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-muted">HBM bandwidth</div>
              <div className="font-semibold text-foreground text-base">
                {PEAK_HBM_BANDWIDTH} GB/s
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-muted">HBM dung lượng</div>
              <div className="font-semibold text-foreground text-base">
                80 GB
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-muted">SM count</div>
              <div className="font-semibold text-foreground text-base">108</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-muted">Tensor Core / SM</div>
              <div className="font-semibold text-foreground text-base">4</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-muted">L2 cache</div>
              <div className="font-semibold text-foreground text-base">
                40 MB
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-muted">NVLink</div>
              <div className="font-semibold text-foreground text-base">
                600 GB/s
              </div>
            </div>
          </div>
          <p className="text-xs text-muted mt-3">
            Tỷ lệ compute/bandwidth = 312 / 1.555 ≈{" "}
            <span className="font-mono text-foreground">200 FLOPs/byte</span>.
            Workload có arithmetic intensity thấp hơn 200 sẽ bị memory-bound
            ngay cả khi dùng Tensor Core.
          </p>
        </LessonSection>

        <LessonSection
          label="Roofline arithmetic intensity"
          step={3}
          totalSteps={3}
        >
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="text-sm text-foreground">
              <LaTeX block>
                {`\\text{AI} = \\frac{\\text{FLOPs}}{\\text{bytes moved}} \\quad\\Rightarrow\\quad \\text{Performance} = \\min(\\text{peak FLOPs},\\, \\text{bandwidth} \\times \\text{AI})`}
              </LaTeX>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Công thức roofline: hiệu năng là minimum của hai giới hạn. Nếu AI
              quá thấp, dù Tensor Core có nhanh cũng vô ích — dữ liệu không về
              kịp. Ngược lại nếu AI cao, workload compute-bound, và Tensor Core
              phát huy hết.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-surface p-2">
                <div className="text-muted">Element-wise add</div>
                <div className="font-mono text-foreground">AI ≈ 0.17</div>
                <div className="text-rose-600 dark:text-rose-400">
                  memory-bound
                </div>
              </div>
              <div className="rounded bg-surface p-2">
                <div className="text-muted">Softmax (naive)</div>
                <div className="font-mono text-foreground">AI ≈ 1.5</div>
                <div className="text-amber-600 dark:text-amber-400">
                  memory-bound
                </div>
              </div>
              <div className="rounded bg-surface p-2">
                <div className="text-muted">GEMM 4096×4096</div>
                <div className="font-mono text-foreground">AI ≈ 680</div>
                <div className="text-emerald-600 dark:text-emerald-400">
                  compute-bound
                </div>
              </div>
            </div>
          </div>
        </LessonSection>
      </VisualizationSection>

      {/* ==================================================================
          BƯỚC 4 — AHA MOMENT
          ================================================================== */}

      <AhaMoment>
        Tối ưu GPU không phải là &quot;viết code chạy nhanh hơn&quot; — mà là{" "}
        <strong>dời dữ liệu ít nhất có thể</strong>, để Tensor Core không phải
        đợi HBM. Một phần lớn các kỹ thuật nổi tiếng (FP16, fused kernel,
        FlashAttention, KV-cache) đều là biến thể của cùng một ý tưởng: làm
        sao để một byte dữ liệu được tận dụng cho nhiều FLOPs nhất có thể.
      </AhaMoment>

      {/* ==================================================================
          BƯỚC 5 — INLINE CHALLENGE #1 & #2
          ================================================================== */}

      <InlineChallenge
        question="Profiler cho thấy: compute 18%, HBM 52%, idle 30%. Bạn nên ưu tiên gỡ chỗ nào TRƯỚC TIÊN?"
        options={[
          "Bật Tensor Core để tăng compute",
          "Sửa idle trước — 30% là lãng phí hoàn toàn, thường do data loader",
          "Bật FP16 để giảm HBM",
          "Mua GPU mới",
        ]}
        correct={1}
        explanation="Luôn xử lý idle trước khi tối ưu compute/memory. Idle 30% nghĩa là cho dù compute có chạy nhanh đến đâu, GPU vẫn đói. Common fix: num_workers trong DataLoader, pin_memory=True, prefetch, hoặc dùng webdataset/parquet streaming thay vì read file-by-file."
      />

      <InlineChallenge
        question="Bạn train Transformer 13B FP32 trên 1×A100 80GB thì OOM. Thứ tự bật tối ưu nào TỐI ƯU NHẤT về memory?"
        options={[
          "Data Parallel trước, FP16 sau",
          "FP16 → Gradient Checkpointing → ZeRO/FSDP (nếu cần >1 GPU)",
          "Chỉ cần Tensor Core là đủ",
          "Giảm batch size xuống 1",
        ]}
        correct={1}
        explanation="Thứ tự 'rẻ tới đắt về công sức': FP16 cắt memory ~50% (1 flag PyTorch), checkpointing cắt thêm ~50% (1 flag nữa), sau đó mới đến FSDP nếu vẫn không đủ. Giảm batch xuống 1 là giải pháp cuối cùng vì nó ảnh hưởng đến chất lượng training."
      />

      {/* ==================================================================
          BƯỚC 6 — GIẢI THÍCH SÂU
          ================================================================== */}

      <ExplanationSection>
        <p>
          Một GPU hiện đại có hai lớp hệ thống mà bạn phải đồng thời tối ưu:{" "}
          <strong>compute fabric</strong> (CUDA cores, Tensor Cores,
          RT cores) và <strong>memory hierarchy</strong> (HBM → L2 → SMEM →
          register). Phần lớn performance problem trong ML workload nằm ở lớp
          thứ hai. Lý do đơn giản: Tensor Core có thể tạo ra 312 TFLOPS, nhưng
          HBM chỉ cấp được 1555 GB/s. Nếu bạn cần 4 byte (một FP32) cho mỗi
          FLOP, tức là cần 312 × 10¹² × 4 = 1248 TB/s băng thông — gấp 800 lần
          những gì HBM có thể cấp. Do đó Tensor Core phải{" "}
          <em>tái sử dụng</em> dữ liệu trong SRAM; nếu không, nó sẽ idle.
        </p>

        <p>
          Để đo được tất cả những điều trên, bạn dùng{" "}
          <strong>profiler</strong>. Hai công cụ chính của NVIDIA là:
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Nsight Systems (nsys):</strong> xem timeline ở cấp độ
            process/stream/kernel. Phù hợp để tìm idle gap, data loader bottle‑
            neck, kernel launch overhead, sync không cần thiết.
          </li>
          <li>
            <strong>Nsight Compute (ncu):</strong> deep dive vào một kernel
            cụ thể. Cho bạn occupancy, warp stall reasons, L1/L2 hit rate,
            Tensor Core utilization.
          </li>
          <li>
            <strong>PyTorch Profiler:</strong> wrapper tiện lợi, export sang
            Chrome Tracing hoặc TensorBoard. Đủ tốt cho 80% use case training.
          </li>
          <li>
            <strong>Nvidia-smi / DCGM:</strong> thống kê mức độ sử dụng GPU,
            nhưng chỉ số &quot;GPU util&quot; gây hiểu lầm — nó chỉ nói có
            kernel chạy hay không, không phản ánh occupancy thật.
          </li>
        </ul>

        <p>
          <strong>Mixed precision</strong> là đòn bẩy đầu tiên nên kéo. Khái
          niệm: lưu weight ở FP32 (để cộng gradient không mất độ chính xác),
          nhưng chạy forward/backward ở FP16 hoặc BF16. Tensor Core xử lý FP16
          nhanh gấp 8× FP32 CUDA, và memory giảm một nửa. BF16 (Brain Floating
          Point) có cùng kích thước FP16 nhưng dynamic range rộng như FP32 →
          ít gặp overflow hơn, không cần loss scaling. Đây là mặc định cho các
          model &gt; 1B param hiện nay.
        </p>

        <CodeBlock language="python" title="Mixed precision trong PyTorch">
{`import torch
from torch.cuda.amp import autocast, GradScaler

model = MyTransformer().cuda()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
scaler = GradScaler()  # xử lý FP16 overflow tự động

for batch in dataloader:
    optimizer.zero_grad()

    # Autocast: tự động chuyển sang FP16 cho matmul / conv,
    # giữ FP32 cho layernorm / softmax để ổn định.
    with autocast(dtype=torch.float16):
        output = model(batch["input"])
        loss = criterion(output, batch["label"])

    # Loss scaling: nhân loss với số lớn để gradient không underflow ở FP16.
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()

# Với BF16, không cần GradScaler vì dynamic range đủ rộng:
#     with autocast(dtype=torch.bfloat16):
#         ...
#     loss.backward()
#     optimizer.step()
`}
        </CodeBlock>

        <p>
          <strong>Gradient checkpointing</strong> (còn gọi là activation
          checkpointing) là đòn bẩy thứ hai. Bình thường, forward pass lưu mọi
          activation để backward pass có thể dùng khi tính gradient. Với model
          vài chục tầng và sequence dài, activation chiếm memory nhiều hơn cả
          weight. Checkpointing chỉ lưu activation ở một số &quot;checkpoint
          layer&quot; và tính lại phần giữa khi cần. Giá phải trả: forward
          pass được chạy hai lần (một lần chính thức, một lần recompute) → ~
          30% compute overhead đổi lấy 50-70% giảm memory.
        </p>

        <Callout variant="insight" title="Khi nào KHÔNG dùng checkpointing">
          Nếu GPU đang idle 20% vì data loader chậm, thêm checkpointing chỉ
          làm idle giảm (vì compute tăng) chứ throughput không đổi hoặc giảm.
          Chỉ dùng checkpointing khi bạn thực sự cần memory cho model lớn hơn
          hoặc batch lớn hơn. Profile trước, tối ưu sau.
        </Callout>

        <p>
          <strong>Tensor Cores</strong> là đơn vị phần cứng chuyên biệt cho
          matmul 4×4 FP16 (hoặc TF32, BF16, FP8 tùy generation). Chúng tăng
          throughput matmul 8-16× so với CUDA core tiêu chuẩn. Để Tensor Core
          &quot;bắt&quot; được kernel, shape tensor phải là bội của 8 (cho
          FP16) hoặc 16 (cho FP8). Đây là lý do nhiều codebase dùng hidden
          size 4096, 6144, 8192 — đều chia hết cho 8. Dùng 4095 sẽ vô tình
          đẩy kernel về CUDA core.
        </p>

        <CodeBlock language="python" title="Kiểm tra Tensor Core activation">
{`import torch

# Shape phải là multiple của 8 cho FP16 Tensor Core.
# 4096 = 8 * 512  → OK
# 4095              → PyTorch sẽ pad hoặc rơi về CUDA core
a = torch.randn(128, 4096, dtype=torch.float16, device="cuda")
b = torch.randn(4096, 4096, dtype=torch.float16, device="cuda")

# Bật TF32 cho matmul FP32 — tăng tốc ~2x, sai số ~1e-3
torch.backends.cuda.matmul.allow_tf32 = True
torch.backends.cudnn.allow_tf32 = True

# Với Ampere/Hopper, dùng BF16 thay FP16 nếu gặp NaN:
a_bf = a.to(torch.bfloat16)
b_bf = b.to(torch.bfloat16)
out = a_bf @ b_bf  # tự động chạy trên Tensor Core

# Profile để chắc chắn:
#   with torch.profiler.profile(activities=[ProfilerActivity.CUDA]) as p:
#       out = a_bf @ b_bf
#   print(p.key_averages().table(sort_by="cuda_time_total"))
# Tìm kernel 'tensorop' hoặc 'hmma' → Tensor Core đang chạy.
`}
        </CodeBlock>

        <p>
          <strong>Kernel fusion</strong> là bước tối ưu tiếp theo khi mixed
          precision và checkpointing đã bật. Ý tưởng: thay vì gọi nhiều kernel
          nhỏ (mỗi kernel đọc/ghi HBM riêng), fuse chúng thành một kernel lớn
          giữ dữ liệu trong SRAM. Ví dụ nổi tiếng nhất là{" "}
          <strong>FlashAttention</strong>: attention naive viết ma trận N×N ra
          HBM rồi đọc lại cho softmax (tốn 4N² bytes memory). FlashAttention
          chia attention thành tile, tính softmax streaming trong SRAM, chỉ
          ghi output cuối cùng ra HBM. Kết quả: 2-4× nhanh hơn và dùng ít
          memory hơn ~20×.
        </p>

        <p>
          <strong>Distributed training</strong> mở rộng sang nhiều GPU khi một
          GPU không đủ. Có ba chiến lược chính:
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Data parallelism (DP/DDP):</strong> mỗi GPU có full model,
            xử lý batch khác nhau, sync gradient qua all-reduce. Đơn giản,
            scale tốt tới vài chục GPU nếu model đủ nhỏ.
          </li>
          <li>
            <strong>Tensor parallelism (TP):</strong> chia trọng số của mỗi
            layer ra nhiều GPU. Giao tiếp dày đặc (mỗi layer có 2 all-reduce),
            yêu cầu NVLink băng thông cao.
          </li>
          <li>
            <strong>Pipeline parallelism (PP):</strong> chia layer thành stage
            trên các GPU khác nhau, pipeline micro-batch qua các stage để lấp
            đầy bubble.
          </li>
          <li>
            <strong>ZeRO / FSDP:</strong> shard optimizer states, gradient, và
            weight qua các GPU. Giữ được mô hình lớn mà vẫn cho cảm giác như
            data parallel.
          </li>
        </ul>

        <Callout variant="warning" title="Đo trước, tối ưu sau">
          Đừng bao giờ bật distributed training khi chưa squeeze hết 1 GPU.
          Nhiều team thêm GPU khi vấn đề thực sự là data loader. Multi-GPU
          debug khó gấp 10 lần single-GPU; hãy tối ưu single-GPU tới khi nào
          chắc chắn đã chạm trần rồi mới scale ra.
        </Callout>

        <CollapsibleDetail title="Roofline model — lý thuyết chính thức">
          <p>
            Roofline model do Williams et al. (Berkeley, 2009) đề xuất là một
            công cụ trực quan để xác định workload của bạn đang bị giới hạn
            bởi compute hay memory. Trên biểu đồ: trục hoành là{" "}
            <em>arithmetic intensity</em> (FLOPs / byte), trục tung là{" "}
            <em>performance</em> (FLOPs / sec). Đường mái có hai đoạn:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              Đoạn nghiêng (bên trái): performance = bandwidth × AI. Bị giới
              hạn bởi memory bandwidth.
            </li>
            <li>
              Đoạn ngang (bên phải): performance = peak FLOPs. Bị giới hạn bởi
              compute.
            </li>
          </ul>
          <p>
            Workload của bạn là một điểm trên biểu đồ. Khoảng cách từ điểm đó
            đến đường mái là <em>dư địa tối ưu</em>. Nếu bạn bị memory-bound,
            tăng FLOPS không giúp; phải tăng AI (reuse dữ liệu nhiều hơn).
            Nếu compute-bound, tăng bandwidth không giúp; phải giảm FLOPs hoặc
            dùng precision thấp hơn.
          </p>
          <p>
            Công thức ridge point (điểm knee):{" "}
            <LaTeX>{`\\text{AI}_{ridge} = \\frac{\\text{peak FLOPs}}{\\text{bandwidth}}`}</LaTeX>
            . Với A100: 312 TFLOPS / 1555 GB/s ≈ 200 FLOP/byte. Bất kỳ kernel
            nào có AI &lt; 200 sẽ bị memory-bound dù chạy Tensor Core.
          </p>
        </CollapsibleDetail>

        <CollapsibleDetail title="Checklist debug performance (PRINT-OUT)">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>GPU util &lt; 80%?</strong> → profile xem có idle gap.
              Check data loader (num_workers, pin_memory), kernel launch
              overhead, sync không cần thiết.
            </li>
            <li>
              <strong>Không dùng Tensor Core?</strong> → bật autocast FP16/BF16.
              Check shape multiple of 8. Chạy{" "}
              <code className="font-mono text-xs">nsys profile</code> và tìm
              kernel có tiền tố <code>hmma</code>.
            </li>
            <li>
              <strong>Memory-bound attention?</strong> → thay bằng FlashAttention
              (PyTorch SDPA tự động pick nếu shape hợp lệ).
            </li>
            <li>
              <strong>OOM?</strong> → FP16 → gradient checkpointing →
              activation offload (CPU) → FSDP.
            </li>
            <li>
              <strong>Distributed scale kém?</strong> → check NCCL bandwidth,
              gradient bucketing, overlap communication với computation.
            </li>
            <li>
              <strong>Kernel nhỏ nhiều?</strong> → dùng{" "}
              <code className="font-mono text-xs">torch.compile</code> hoặc
              CUDA graphs để giảm launch overhead.
            </li>
          </ol>
        </CollapsibleDetail>

        <p>
          Tối ưu GPU là một vòng lặp: <strong>profile → tìm bottleneck →
          áp dụng đúng tool → profile lại</strong>. Bạn không thể đoán đúng
          chỉ bằng đọc paper; mỗi workload có pattern riêng. Công cụ có sẵn
          (Nsight, PyTorch Profiler, DCGM) đã đủ cho 95% trường hợp. Phần khó
          là đọc output và biết tìm dấu hiệu gì.
        </p>

        <p>
          Các chủ đề bạn có thể muốn đọc tiếp:{" "}
          <TopicLink slug="inference-optimization">
            tối ưu inference với KV-cache
          </TopicLink>
          ,{" "}
          <TopicLink slug="model-serving">model serving ở scale</TopicLink>, và{" "}
          <TopicLink slug="cost-optimization">
            tối ưu chi phí GPU cloud
          </TopicLink>
          .
        </p>
      </ExplanationSection>

      {/* ==================================================================
          BƯỚC 7 — MINI SUMMARY
          ================================================================== */}

      <MiniSummary
        title="6 điểm chốt về tối ưu GPU"
        points={[
          "Profile trước, tối ưu sau — Nsight Systems cho timeline, Nsight Compute cho kernel deep dive, PyTorch Profiler cho use case thường ngày.",
          "Phân loại bottleneck bằng time share: compute-bound, memory-bound, idle-bound — mỗi loại có playbook tối ưu khác nhau.",
          "FP16/BF16 + Tensor Cores là đòn bẩy đầu tiên: tăng throughput 2-8×, giảm memory 50%, gần như không rủi ro với BF16.",
          "Gradient checkpointing đổi 30% compute lấy 50-70% memory — chỉ bật khi bạn thật sự cần memory.",
          "Kernel fusion (FlashAttention, torch.compile) giảm HBM roundtrip — đặc biệt quan trọng cho attention và softmax.",
          "Multi-GPU là phương án cuối cùng: DP → ZeRO/FSDP → TP → PP, theo thứ tự độ phức tạp tăng dần. Luôn tối ưu single-GPU trước.",
        ]}
      />

      {/* ==================================================================
          BƯỚC 8 — QUIZ
          ================================================================== */}

      <QuizSection questions={quizQuestions} />
    </>
  );
}
