"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Layers, RefreshCw, Shuffle, Timer, Zap } from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CollapsibleDetail,
  LessonSection,
  LaTeX,
  TopicLink,
  SliderGroup,
  ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ══════════════════════════════════════════════════════════════════════
   METADATA — không đổi slug/category/tags
   ══════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "epochs-batches",
  title: "Epochs & Batches",
  titleVi: "Epoch, Batch và Iteration",
  description:
    "Máy học không nhồi cả 1000 đề thi một phát. Nó chia thành nhiều buổi (epoch), mỗi buổi nhiều đợt nhỏ (batch). Xem sự thay đổi của đường loss khi bạn kéo thanh batch size.",
  category: "neural-fundamentals",
  tags: ["training", "fundamentals"],
  difficulty: "intermediate",
  relatedSlugs: ["sgd", "gradient-descent", "learning-rate"],
  vizType: "interactive",
};

/* ══════════════════════════════════════════════════════════════════════
   HẰNG SỐ CHUNG
   ══════════════════════════════════════════════════════════════════════ */

const DATASET_SIZE = 1000;

const BATCH_CHOICES = [1, 32, 128, 1000] as const;
type BatchChoice = (typeof BATCH_CHOICES)[number];

const BATCH_MEANING: Record<BatchChoice, string> = {
  1: "SGD thuần — gradient rất nhiễu",
  32: "Mini-batch nhỏ — mặc định nhiều bài hướng dẫn",
  128: "Mini-batch lớn — mượt, cần nhiều RAM hơn",
  1000: "Full-batch — cả dataset trong một bước",
};

const BATCH_COLOR: Record<BatchChoice, string> = {
  1: "#f97316",
  32: "#22c55e",
  128: "#6366f1",
  1000: "#64748b",
};

const LOSS_W = 560;
const LOSS_H = 220;
const SHUFFLE_COLS = 50;
const SHUFFLE_ROWS = 20;
const SHUFFLE_W = 560;
const SHUFFLE_H = 160;

/* ══════════════════════════════════════════════════════════════════════
   MATHS — tạo đường loss mô phỏng theo batch size
   ══════════════════════════════════════════════════════════════════════ */

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function makeLossCurve(batch: BatchChoice, epochs: number): number[] {
  const iterationsPerEpoch = Math.ceil(DATASET_SIZE / batch);
  const totalIter = iterationsPerEpoch * epochs;
  const rand = seededRandom(batch * 7919 + epochs * 31);
  const noiseScale = 0.95 / Math.sqrt(batch);
  const points: number[] = [];
  for (let i = 0; i < totalIter; i++) {
    const progress = i / Math.max(1, totalIter - 1);
    const ideal = 0.05 + 1.15 * Math.exp(-3.4 * progress);
    const noise = (rand() - 0.5) * 2 * noiseScale;
    const value = Math.max(0.02, ideal + noise * (0.6 + 0.35 * (1 - progress)));
    points.push(value);
  }
  return points;
}

function lossPath(points: number[], visible: number): string {
  if (points.length === 0 || visible === 0) return "";
  const count = Math.max(1, Math.min(points.length, visible));
  const maxLoss = Math.max(1.4, ...points);
  const left = 40;
  const right = LOSS_W - 12;
  const top = 14;
  const bottom = LOSS_H - 28;
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = left + (i / Math.max(1, points.length - 1)) * (right - left);
    const y = bottom - (points[i] / maxLoss) * (bottom - top);
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return parts.join(" ");
}

/* ══════════════════════════════════════════════════════════════════════
   SHUFFLE STRIPE — 1000 ô dữ liệu, tô theo batch đang chạy
   ══════════════════════════════════════════════════════════════════════ */

interface ShuffleStripeProps {
  batch: BatchChoice;
  order: number[];
  activeBatchIndex: number;
  totalBatches: number;
  epochIndex: number;
}

function ShuffleStripe({
  batch,
  order,
  activeBatchIndex,
  totalBatches,
  epochIndex,
}: ShuffleStripeProps) {
  const cellW = SHUFFLE_W / SHUFFLE_COLS;
  const cellH = SHUFFLE_H / SHUFFLE_ROWS;
  const radius = Math.min(cellW, cellH) / 2.5;

  return (
    <svg
      viewBox={`0 0 ${SHUFFLE_W} ${SHUFFLE_H + 24}`}
      className="w-full max-w-3xl mx-auto"
      role="img"
      aria-label={`Tập 1000 mẫu, batch ${batch}, epoch ${epochIndex + 1}`}
    >
      <rect x={0} y={0} width={SHUFFLE_W} height={SHUFFLE_H + 24} fill="#0f172a" />
      {Array.from({ length: DATASET_SIZE }, (_, i) => {
        const col = i % SHUFFLE_COLS;
        const row = Math.floor(i / SHUFFLE_COLS);
        const cx = col * cellW + cellW / 2;
        const cy = row * cellH + cellH / 2;
        const orderPos = order[i] ?? i;
        const batchOf = Math.floor(orderPos / batch);
        const isActive = batchOf === activeBatchIndex;
        const isSeen = batchOf < activeBatchIndex;
        const fill = isActive
          ? BATCH_COLOR[batch]
          : isSeen
            ? "#475569"
            : "#1e293b";
        return (
          <motion.circle
            key={`shuffle-${epochIndex}-${i}`}
            cx={cx}
            cy={cy}
            r={isActive ? radius * 1.25 : radius}
            fill={fill}
            initial={false}
            animate={{
              r: isActive ? radius * 1.25 : radius,
              fill,
            }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          />
        );
      })}
      <text
        x={SHUFFLE_W / 2}
        y={SHUFFLE_H + 18}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={11}
      >
        Epoch {epochIndex + 1} — batch {activeBatchIndex + 1}/{totalBatches} đang được học
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LOSS CURVE — đường loss theo iteration, gạch phân cách epoch
   ══════════════════════════════════════════════════════════════════════ */

interface LossChartProps {
  points: number[];
  visible: number;
  batch: BatchChoice;
  iterationsPerEpoch: number;
  totalEpochs: number;
}

function LossChart({
  points,
  visible,
  batch,
  iterationsPerEpoch,
  totalEpochs,
}: LossChartProps) {
  const d = lossPath(points, visible);
  const stroke = BATCH_COLOR[batch];
  const maxLoss = Math.max(1.4, ...points);
  const left = 40;
  const right = LOSS_W - 12;
  const top = 14;
  const bottom = LOSS_H - 28;

  const lastIndex = Math.max(0, Math.min(points.length - 1, visible - 1));
  const lastX =
    left + (lastIndex / Math.max(1, points.length - 1)) * (right - left);
  const lastY = bottom - (points[lastIndex] / maxLoss) * (bottom - top);

  return (
    <svg
      viewBox={`0 0 ${LOSS_W} ${LOSS_H}`}
      className="w-full max-w-3xl mx-auto"
      role="img"
      aria-label={`Đường loss theo iteration, batch ${batch}`}
    >
      <rect x={0} y={0} width={LOSS_W} height={LOSS_H} fill="#0f172a" />
      {[0.25, 0.5, 0.75].map((f) => {
        const y = bottom - f * (bottom - top);
        return (
          <line
            key={`g-${f}`}
            x1={left}
            y1={y}
            x2={right}
            y2={y}
            stroke="#1e293b"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        );
      })}

      {Array.from({ length: totalEpochs }, (_, e) => {
        const atIter = (e + 1) * iterationsPerEpoch;
        const frac = atIter / Math.max(1, points.length);
        const x = left + frac * (right - left);
        if (frac >= 1) return null;
        return (
          <g key={`ep-div-${e}`}>
            <line
              x1={x}
              y1={top}
              x2={x}
              y2={bottom}
              stroke="#334155"
              strokeWidth={1}
              strokeDasharray="5 3"
              opacity={0.7}
            />
            <text
              x={x}
              y={top + 10}
              fill="#64748b"
              fontSize={9}
              textAnchor="middle"
            >
              hết epoch {e + 1}
            </text>
          </g>
        );
      })}

      <line x1={left} y1={top} x2={left} y2={bottom} stroke="#475569" strokeWidth={1} />
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#475569" strokeWidth={1} />
      <text x={8} y={top + 10} fill="#94a3b8" fontSize={10}>
        Loss
      </text>
      <text x={right - 60} y={LOSS_H - 8} fill="#94a3b8" fontSize={10}>
        Iteration
      </text>

      {d && (
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {visible > 0 && (
        <motion.circle
          cx={lastX}
          cy={lastY}
          r={4}
          fill={stroke}
          initial={false}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.4 }}
        />
      )}

      <g transform={`translate(${left + 8}, ${top + 4})`}>
        <rect width={180} height={22} rx={6} fill="#1e293b" opacity={0.9} />
        <circle cx={12} cy={11} r={4} fill={stroke} />
        <text x={22} y={15} fill="#e2e8f0" fontSize={11}>
          batch {batch} · {BATCH_MEANING[batch].split("—")[0].trim()}
        </text>
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TRAINING PLAYGROUND — slider batch size + animation shuffling + loss
   ══════════════════════════════════════════════════════════════════════ */

interface TrainingPlaygroundProps {
  batch: BatchChoice;
  epochs: number;
}

function TrainingPlayground({ batch, epochs }: TrainingPlaygroundProps) {
  const iterationsPerEpoch = Math.ceil(DATASET_SIZE / batch);
  const totalIter = iterationsPerEpoch * epochs;
  const points = useMemo(() => makeLossCurve(batch, epochs), [batch, epochs]);

  const [orders, setOrders] = useState<number[][]>(() =>
    makeShuffledOrders(epochs, batch)
  );
  const [iter, setIter] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    setOrders(makeShuffledOrders(epochs, batch));
    setIter(0);
    setIsRunning(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [batch, epochs]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function play() {
    if (isRunning) return;
    setIsRunning(true);
    setIter(0);
    startRef.current = null;
    const duration = 3200 + epochs * 300;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      const target = Math.floor(progress * totalIter);
      setIter(target);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIter(totalIter);
        setIsRunning(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function reset() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIter(0);
    setIsRunning(false);
  }

  const currentIterSafe = Math.min(iter, totalIter);
  const currentEpoch = Math.min(
    epochs - 1,
    Math.floor(currentIterSafe / iterationsPerEpoch)
  );
  const batchInEpoch = currentIterSafe % iterationsPerEpoch;
  const order = orders[currentEpoch] ?? orders[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-accent" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Mô phỏng training loop
            </p>
            <p className="text-[11px] text-muted">
              1000 mẫu · batch {batch} · {iterationsPerEpoch} iteration/epoch ·{" "}
              {epochs} epoch · tổng{" "}
              <strong className="text-foreground">{totalIter}</strong>{" "}
              iteration
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={play}
            disabled={isRunning}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
          >
            <Zap size={14} />
            {isRunning ? "Đang học..." : "Chạy training"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            Đặt lại
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 text-xs">
        <div className="rounded-lg border border-border bg-background/40 p-2.5">
          <p className="text-tertiary uppercase tracking-wide text-[10px]">
            Epoch
          </p>
          <p className="text-foreground font-semibold tabular-nums">
            {currentEpoch + 1}/{epochs}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5">
          <p className="text-tertiary uppercase tracking-wide text-[10px]">
            Batch trong epoch
          </p>
          <p className="text-foreground font-semibold tabular-nums">
            {batchInEpoch + 1}/{iterationsPerEpoch}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5">
          <p className="text-tertiary uppercase tracking-wide text-[10px]">
            Iteration tổng
          </p>
          <p className="text-foreground font-semibold tabular-nums">
            {currentIterSafe}/{totalIter}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background/30 p-3">
        <div className="flex items-center gap-2 text-[11px] text-muted mb-2">
          <Shuffle size={12} className="text-accent" />
          Mỗi epoch tráo dữ liệu một lần — chấm sáng là batch đang được học
        </div>
        <ShuffleStripe
          batch={batch}
          order={order}
          activeBatchIndex={batchInEpoch}
          totalBatches={iterationsPerEpoch}
          epochIndex={currentEpoch}
        />
      </div>

      <div className="rounded-lg border border-border bg-background/30 p-3">
        <p className="text-[11px] text-muted mb-2">
          Đường loss theo iteration — gạch đứt là ranh giới giữa các epoch
        </p>
        <LossChart
          points={points}
          visible={currentIterSafe}
          batch={batch}
          iterationsPerEpoch={iterationsPerEpoch}
          totalEpochs={epochs}
        />
      </div>
    </div>
  );
}

function makeShuffledOrders(epochs: number, batch: BatchChoice): number[][] {
  const base = Array.from({ length: DATASET_SIZE }, (_, i) => i);
  const orders: number[][] = [];
  let seed = batch * 104729 + 7;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  for (let e = 0; e < epochs; e++) {
    const arr = base.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(nextRand() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    orders.push(arr);
  }
  return orders;
}

/* ══════════════════════════════════════════════════════════════════════
   COMPARE — SGD vs MINI-BATCH vs FULL-BATCH (ToggleCompare)
   Vẽ hai đường loss tĩnh trong mỗi nhánh so sánh
   ══════════════════════════════════════════════════════════════════════ */

function StaticLossComparison({
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  description,
  epochs,
}: {
  primary: BatchChoice;
  secondary: BatchChoice;
  primaryLabel: string;
  secondaryLabel: string;
  description: string;
  epochs: number;
}) {
  const pointsA = useMemo(() => makeLossCurve(primary, epochs), [primary, epochs]);
  const pointsB = useMemo(
    () => makeLossCurve(secondary, epochs),
    [secondary, epochs]
  );
  const maxLen = Math.max(pointsA.length, pointsB.length);
  const maxLoss = Math.max(1.4, ...pointsA, ...pointsB);
  const left = 40;
  const right = LOSS_W - 12;
  const top = 14;
  const bottom = LOSS_H - 28;

  function renderPath(points: number[]): string {
    const parts: string[] = [];
    for (let i = 0; i < points.length; i++) {
      const x = left + (i / Math.max(1, maxLen - 1)) * (right - left);
      const y = bottom - (points[i] / maxLoss) * (bottom - top);
      parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return parts.join(" ");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/85 leading-relaxed">{description}</p>
      <svg
        viewBox={`0 0 ${LOSS_W} ${LOSS_H}`}
        className="w-full max-w-3xl mx-auto"
        role="img"
        aria-label={`So sánh loss: ${primaryLabel} và ${secondaryLabel}`}
      >
        <rect x={0} y={0} width={LOSS_W} height={LOSS_H} fill="#0f172a" />
        {[0.25, 0.5, 0.75].map((f) => {
          const y = bottom - f * (bottom - top);
          return (
            <line
              key={`gs-${f}`}
              x1={left}
              y1={y}
              x2={right}
              y2={y}
              stroke="#1e293b"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          );
        })}
        <line x1={left} y1={top} x2={left} y2={bottom} stroke="#475569" strokeWidth={1} />
        <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#475569" strokeWidth={1} />
        <text x={8} y={top + 10} fill="#94a3b8" fontSize={10}>
          Loss
        </text>
        <text x={right - 60} y={LOSS_H - 8} fill="#94a3b8" fontSize={10}>
          Iteration
        </text>

        <path
          d={renderPath(pointsA)}
          fill="none"
          stroke={BATCH_COLOR[primary]}
          strokeWidth={1.8}
          strokeLinejoin="round"
          opacity={0.95}
        />
        <path
          d={renderPath(pointsB)}
          fill="none"
          stroke={BATCH_COLOR[secondary]}
          strokeWidth={1.8}
          strokeLinejoin="round"
          opacity={0.95}
        />

        <g transform={`translate(${left + 8}, ${top + 4})`}>
          <rect width={260} height={42} rx={6} fill="#1e293b" opacity={0.9} />
          <circle cx={12} cy={13} r={4} fill={BATCH_COLOR[primary]} />
          <text x={22} y={17} fill="#e2e8f0" fontSize={11}>
            {primaryLabel}
          </text>
          <circle cx={12} cy={31} r={4} fill={BATCH_COLOR[secondary]} />
          <text x={22} y={35} fill="#e2e8f0" fontSize={11}>
            {secondaryLabel}
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   QUIZ — 5 câu, hỗn hợp MCQ + fill-blank
   ══════════════════════════════════════════════════════════════════════ */

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question:
      "Dataset 10.000 mẫu, batch size = 100, train 5 epoch. Tổng cộng bao nhiêu lần cập nhật trọng số?",
    options: [
      "50 lần (5 × 10)",
      "500 lần — (10.000 / 100) × 5",
      "50.000 lần — 10.000 × 5",
      "100 lần — 10.000 / 100",
    ],
    correct: 1,
    explanation:
      "Mỗi epoch có 10.000 / 100 = 100 iteration. Năm epoch → 100 × 5 = 500 lần cập nhật. Công thức tổng quát: iterations = (N / B) × E.",
  },
  {
    question:
      "Khi bạn kéo thanh batch size từ 8 lên 128, đường loss sẽ thay đổi thế nào?",
    options: [
      "Đường loss vẫn dao động y hệt cũ",
      "Đường loss mượt hơn vì gradient lấy trung bình trên nhiều mẫu, nhiễu giảm",
      "Đường loss xấu hẳn đi, mô hình không học được",
      "Đường loss biến mất",
    ],
    correct: 1,
    explanation:
      "Nhiễu của gradient tỉ lệ với 1/√B. Tăng batch từ 8 lên 128 (×16) làm nhiễu giảm khoảng ×4 → đường loss mượt hơn rõ rệt.",
  },
  {
    question:
      "Vì sao thường tráo (shuffle) dữ liệu trước mỗi epoch?",
    options: [
      "Để GPU chạy nhanh hơn",
      "Để mỗi epoch các batch khác nhau → gradient đa dạng → mô hình không học theo thứ tự",
      "Vì Python yêu cầu",
      "Shuffle không có tác dụng gì",
    ],
    correct: 1,
    explanation:
      "Không shuffle nghĩa là epoch nào cũng thấy cùng chuỗi batch. Mô hình có thể học mẹo theo vị trí thay vì nội dung. Shuffle làm gradient đa dạng, thường generalize tốt hơn.",
  },
  {
    type: "fill-blank",
    question:
      "Dataset 1.000 mẫu, batch size = 50, train 10 epoch. Số iteration trong 1 epoch = 1000 / {blank} = 20.",
    blanks: [{ answer: "50", accept: ["50", "batch", "batch size", "B"] }],
    explanation:
      "Chia tổng số mẫu cho batch size: 1000 / 50 = 20 iteration mỗi epoch. Nhân với số epoch: 20 × 10 = 200 lần cập nhật.",
  },
  {
    question:
      "Khi nào batch = 1 (SGD thuần) lại có lợi so với full-batch?",
    options: [
      "Không bao giờ — batch càng lớn càng tốt",
      "Khi muốn nhiễu tự nhiên giúp thoát khỏi local minima cạn và cập nhật liên tục",
      "Khi muốn GPU chạy nhanh nhất",
      "Khi dataset rất nhỏ (< 10 mẫu)",
    ],
    correct: 1,
    explanation:
      "Batch = 1 có gradient rất nhiễu, nhưng chính nhiễu đó đôi khi giúp bước nhảy vượt khỏi hố nông và tiếp tục xuống minimum sâu hơn. Full-batch chính xác nhưng chậm và dễ kẹt.",
  },
  {
    question:
      "Bạn có GPU nhỏ, chỉ chạy nổi batch = 16. Muốn hiệu ứng tương đương batch = 64 thì làm thế nào?",
    options: [
      "Không có cách nào, phải mua GPU mới",
      "Gradient accumulation: tích luỹ gradient qua 4 batch = 16 rồi mới cập nhật trọng số một lần",
      "Chạy batch = 64 bình thường, máy tự xử",
      "Giảm dataset xuống còn 16 mẫu",
    ],
    correct: 1,
    explanation:
      "Gradient accumulation gộp gradient của 4 batch nhỏ liên tiếp trước khi cập nhật. Hiệu quả gần như batch = 64 mà không cần RAM của 64 mẫu cùng lúc.",
  },
];

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export default function EpochsBatchesTopic() {
  return (
    <>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BƯỚC 1 — HOOK (ẩn dụ ôn thi)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={1} totalSteps={8} label="Bắt đầu từ hình ảnh">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-accent-light/60 to-surface/40 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-accent" />
            <h3 className="text-base font-semibold text-foreground">
              Ôn thi không bao giờ là một phát 100 đề
            </h3>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Tưởng tượng bạn đang ôn thi đại học với kho 1000 câu. Bạn sẽ không
            ngồi xuống làm tất cả trong một buổi — vừa đuối, vừa không nhớ nổi.
            Cách mà học sinh giỏi thường làm:
          </p>
          <ul className="space-y-2 text-sm text-foreground/85">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
              Chia 1000 câu thành <strong>nhiều đợt nhỏ</strong> khoảng 30 câu.
              Mỗi đợt là một <strong>batch</strong>.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
              Làm hết các đợt trong một <strong>buổi học</strong> — đó là một{" "}
              <strong>epoch</strong>.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
              Hôm sau <strong>tráo thứ tự câu</strong>, học lại cả kho. Đó là
              epoch thứ hai. Mỗi lần giải xong một đợt là một{" "}
              <strong>iteration</strong> — một nhịp cập nhật kiến thức.
            </li>
          </ul>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Mạng nơ-ron học cũng hệt vậy. Dataset = kho câu hỏi. Batch = đợt
            nhỏ. Epoch = một vòng qua toàn bộ. Iteration = một lần cập nhật
            trọng số. Phần sau bạn sẽ tự kéo thanh batch size để thấy đường
            loss thay đổi hình dạng ra sao.
          </p>
        </div>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BƯỚC 2 — PREDICTION GATE
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={2} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Dataset có 1000 mẫu. Bạn chọn batch size = 100 và train 5 epoch. Bao nhiêu lần mô hình cập nhật trọng số?"
          options={[
            "5 lần — mỗi epoch cập nhật một lần",
            "100 lần — mỗi batch một lần",
            "50 lần — (1000 / 100) × 5",
            "5000 lần — 1000 × 5",
          ]}
          correct={2}
          explanation="Mỗi epoch có 1000 / 100 = 10 iteration. Năm epoch × 10 = 50 lần cập nhật. Mỗi iteration = một lần forward + backward + cập nhật trọng số dựa trên 100 mẫu của batch đó."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Ở bước sau, bạn sẽ kéo thanh batch size qua các giá trị 1, 32, 128
            và 1000. Chú ý xem đường loss thay đổi hình dáng thế nào khi batch
            tăng lên — và vì sao cả batch quá nhỏ hay quá lớn đều có nhược
            điểm.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BƯỚC 3 — REVEAL: training visualizer, slider batch, loss curve
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-6">
            <p className="text-sm text-foreground/85 leading-relaxed">
              Dưới đây là một khu vui chơi huấn luyện. Kéo thanh{" "}
              <strong>batch size</strong> và <strong>số epoch</strong>, bấm
              <strong> Chạy training</strong> để xem:
            </p>
            <ul className="space-y-1.5 text-sm text-foreground/80 pl-1">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                Các chấm là 1000 mẫu dữ liệu. Mỗi epoch tráo thứ tự một lần.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                Chấm nào đang <em>sáng màu</em> là batch đang được mô hình học.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                Đường loss bên dưới đi xuống mỗi khi một batch được xử lý.
              </li>
            </ul>

            <SliderGroup
              title="Bảng điều khiển training"
              sliders={[
                {
                  key: "batchIdx",
                  label: "Batch size",
                  min: 0,
                  max: 3,
                  step: 1,
                  defaultValue: 1,
                  unit: "",
                },
                {
                  key: "epochs",
                  label: "Số epoch",
                  min: 1,
                  max: 5,
                  step: 1,
                  defaultValue: 2,
                  unit: " epoch",
                },
              ]}
              visualization={(values) => {
                const idx = Math.min(
                  BATCH_CHOICES.length - 1,
                  Math.max(0, Math.round(values.batchIdx))
                );
                const batch = BATCH_CHOICES[idx];
                const epochs = Math.max(1, Math.min(5, Math.round(values.epochs)));
                return (
                  <div className="w-full space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs">
                      <span className="text-muted">
                        Batch đang chọn:{" "}
                        <strong
                          className="tabular-nums"
                          style={{ color: BATCH_COLOR[batch] }}
                        >
                          {batch}
                        </strong>
                      </span>
                      <span className="text-muted">
                        {BATCH_MEANING[batch]}
                      </span>
                      <span className="text-muted">
                        Iteration/epoch:{" "}
                        <strong className="text-foreground tabular-nums">
                          {Math.ceil(DATASET_SIZE / batch)}
                        </strong>
                      </span>
                    </div>
                    <TrainingPlayground batch={batch} epochs={epochs} />
                  </div>
                );
              }}
            />

            <Callout variant="insight" title="Để ý đường loss">
              Khi batch = 1, đường loss zig-zag mạnh — mỗi bước chỉ nhìn một
              mẫu nên gradient rất nhiễu. Khi batch = 128, đường loss xuống
              gần như mượt. Khi batch = 1000 (full-batch), chỉ có một vài điểm
              trên đường — vì cả epoch chỉ có duy nhất một lần cập nhật trọng
              số.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BƯỚC 4 — AHA
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc vỡ ra">
        <AhaMoment>
          Ba khái niệm tưởng lạ thật ra chỉ là ba tên gọi cho một ý rất đơn
          giản:
          <br />
          <br />
          <strong>Batch</strong> là &ldquo;một đợt nhỏ dữ liệu&rdquo;.{" "}
          <strong>Iteration</strong> là &ldquo;một lần học xong một batch và
          cập nhật trọng số&rdquo;. <strong>Epoch</strong> là &ldquo;một lần
          duyệt hết toàn bộ dataset&rdquo;.
          <br />
          <br />
          Máy học bằng cách <em>lặp đi lặp lại</em> — giống bạn ôn đề: không
          phải một phát hiểu hết, mà là hàng trăm nhịp chỉnh nhẹ.
        </AhaMoment>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BƯỚC 5 — DEEPEN: ToggleCompare SGD vs Mini-batch vs Full-batch
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={5} totalSteps={8} label="Đi sâu: ba kiểu chia batch">
        <div className="space-y-4">
          <p className="text-sm text-foreground/85 leading-relaxed">
            Cộng đồng deep learning chia cách cập nhật trọng số thành ba kiểu
            chính. Bấm hai nút bên dưới để so sánh từng cặp. Mỗi biểu đồ vẽ
            đường loss của cùng một mô hình, chỉ khác batch size.
          </p>

          <ToggleCompare
            labelA="SGD (batch = 1)"
            labelB="Mini-batch (batch = 32)"
            description="Bên A chỉ nhìn đúng một mẫu mỗi bước — nhiễu, nảy lung tung. Bên B nhìn 32 mẫu một lúc — lấy trung bình, mượt hơn hẳn."
            childA={
              <StaticLossComparison
                primary={1}
                secondary={32}
                primaryLabel="Batch = 1 (SGD): nhiễu, nảy"
                secondaryLabel="Batch = 32 (mini-batch): mượt hơn"
                description="Gradient của SGD có phương sai lớn vì chỉ dựa trên 1 mẫu. Mini-batch trung bình trên 32 mẫu → gradient ổn định hơn nhưng vẫn giữ một ít nhiễu có ích."
                epochs={3}
              />
            }
            childB={
              <StaticLossComparison
                primary={32}
                secondary={128}
                primaryLabel="Batch = 32: mềm vừa"
                secondaryLabel="Batch = 128: rất mượt"
                description="Tăng batch từ 32 lên 128 (×4) làm nhiễu giảm khoảng ×2. Đường loss gần như đi thẳng xuống. Cái giá phải trả: RAM gấp 4, và ít nhiễu đôi khi khiến mô hình kẹt ở minimum 'sắc' khó generalize."
                epochs={3}
              />
            }
          />

          <ToggleCompare
            labelA="Mini-batch (batch = 32)"
            labelB="Full-batch (batch = 1000)"
            description="Bên trái cập nhật nhiều lần trong 1 epoch. Bên phải chỉ cập nhật một lần duy nhất cho cả dataset → chính xác nhưng cực chậm và có nguy cơ kẹt."
            childA={
              <StaticLossComparison
                primary={32}
                secondary={1000}
                primaryLabel="Batch = 32: hàng chục lần cập nhật/epoch"
                secondaryLabel="Batch = 1000 (full-batch): 1 lần/epoch"
                description="Full-batch dùng cả dataset cho mỗi bước — gradient cực chính xác nhưng phải nhìn toàn bộ mới được cập nhật một lần. Với dataset lớn, cách này chậm kinh khủng."
                epochs={3}
              />
            }
            childB={
              <StaticLossComparison
                primary={128}
                secondary={1000}
                primaryLabel="Batch = 128: vẫn có nhiều nhịp mỗi epoch"
                secondaryLabel="Batch = 1000: chỉ vài điểm trên đường"
                description="Khi batch = kích thước dataset, mỗi epoch chỉ có đúng một iteration. Đường loss gần như là đường thẳng — chậm, thiếu nhiễu, dễ kẹt."
                epochs={3}
              />
            }
          />

          <Callout variant="tip" title="Chốt lại ba kiểu">
            <ul className="space-y-1.5 mt-1">
              <li>
                <strong>Batch = 1 (SGD thuần):</strong> nhanh mỗi bước, nhưng
                đường loss nảy lung tung. Rẻ RAM, hay thoát local minima cạn.
              </li>
              <li>
                <strong>Batch = 32 – 256 (mini-batch):</strong> &ldquo;điểm
                ngọt&rdquo; cho hầu hết bài toán. Tận dụng GPU, đủ mượt, vẫn có
                chút nhiễu regularize tự nhiên.
              </li>
              <li>
                <strong>Batch = N (full-batch):</strong> đường loss thẳng,
                gradient chính xác nhất, nhưng cực chậm và dễ kẹt sharp
                minima.
              </li>
            </ul>
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BƯỚC 6 — CHALLENGE + EXPLAIN
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách & giải thích">
        <div className="space-y-6">
          <InlineChallenge
            question="Dataset có 10.000 mẫu, bạn chọn batch size = 100. Một epoch có bao nhiêu iteration?"
            options={[
              "10 iteration",
              "100 iteration — vì 10.000 chia 100 = 100",
              "10.000 iteration — mỗi mẫu 1 iteration",
              "1 iteration — cả dataset một lượt",
            ]}
            correct={1}
            explanation="Chia tổng số mẫu cho batch size: 10.000 / 100 = 100 iteration trong một epoch. Mỗi iteration xử lý đúng 100 mẫu và cập nhật trọng số một lần."
          />

          <ExplanationSection topicSlug={metadata.slug}>
            <p className="leading-relaxed">
              Giờ bạn đã thấy rõ ba thuật ngữ. Hãy đóng gói chúng bằng một
              công thức rất ngắn: với N là tổng số mẫu, B là batch size, E là
              số epoch, thì <strong>số lần cập nhật trọng số</strong> trong cả
              khoá huấn luyện là:
            </p>

            <LaTeX block>
              {"\\text{iterations} = \\left\\lceil \\frac{N}{B} \\right\\rceil \\times E"}
            </LaTeX>

            <p className="text-sm text-muted leading-relaxed">
              Dấu trần (ceiling) xuất hiện vì batch cuối của mỗi epoch có thể
              không đủ B mẫu. Ví dụ dataset 1000, batch 300 → 4 iteration/epoch
              (batch thứ tư chỉ có 100 mẫu).
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className="rounded-lg border bg-card p-3 space-y-1"
                style={{ borderLeft: "4px solid #22c55e" }}
              >
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-500" />
                  Batch
                </p>
                <p className="text-xs text-muted leading-snug">
                  Một đợt nhỏ dữ liệu đưa vào mô hình cùng lúc. Ví dụ B = 32.
                </p>
              </div>
              <div
                className="rounded-lg border bg-card p-3 space-y-1"
                style={{ borderLeft: "4px solid #6366f1" }}
              >
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Zap size={14} className="text-indigo-500" />
                  Iteration
                </p>
                <p className="text-xs text-muted leading-snug">
                  Một nhịp: forward + backward + cập nhật trọng số cho một
                  batch.
                </p>
              </div>
              <div
                className="rounded-lg border bg-card p-3 space-y-1"
                style={{ borderLeft: "4px solid #f59e0b" }}
              >
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Timer size={14} className="text-amber-500" />
                  Epoch
                </p>
                <p className="text-xs text-muted leading-snug">
                  Một vòng đầy đủ qua toàn bộ N mẫu.
                </p>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-foreground mt-6 mb-1">
              Mini-batch cập nhật trọng số như thế nào?
            </h4>
            <p className="leading-relaxed">
              Mỗi iteration, mô hình chọn một batch gồm B mẫu, tính độ lệch
              (loss) trung bình trên batch, rồi dùng đạo hàm của loss đó để
              chỉnh trọng số đi một bước nhỏ. Dịch ra công thức:
            </p>

            <LaTeX block>
              {"w_{t+1} = w_t - \\eta \\cdot \\frac{1}{B} \\sum_{i=1}^{B} \\nabla L_i(w_t)"}
            </LaTeX>

            <p className="text-sm text-muted leading-relaxed">
              Nói bằng tiếng Việt: trọng số mới = trọng số cũ trừ đi một bước
              nhỏ theo hướng <em>trung bình</em> của độ dốc trên B mẫu. η là{" "}
              <TopicLink slug="learning-rate">learning rate</TopicLink> — độ
              dài bước. B càng lớn, trung bình càng &ldquo;đại diện&rdquo; cho
              toàn dataset → đường loss càng mượt. B càng nhỏ, trung bình chỉ
              dựa trên ít mẫu → nhiễu lớn, nhưng mỗi bước tính cực nhanh.
            </p>

            <Callout variant="warning" title="Ba cạm bẫy hay gặp">
              <ul className="space-y-1.5 mt-1">
                <li>
                  <strong>Quên shuffle:</strong> nếu bạn không tráo dữ liệu mỗi
                  epoch, các batch giống hệt nhau qua các vòng. Gradient không
                  đa dạng → mô hình có thể học theo thứ tự thay vì nội dung.
                </li>
                <li>
                  <strong>Batch quá nhỏ với BatchNorm:</strong> batch ≤ 8 làm
                  thống kê của{" "}
                  <TopicLink slug="batch-normalization">
                    batch normalization
                  </TopicLink>{" "}
                  không ổn định. Chuyển sang Layer/GroupNorm hoặc tăng batch.
                </li>
                <li>
                  <strong>Batch quá lớn mà quên tăng learning rate:</strong>{" "}
                  batch lớn làm gradient mượt hơn nhưng bước đi nhỏ hơn so với
                  trung bình. Quy tắc linear scaling: nhân B lên k lần thì
                  nhân η lên gần k lần kèm warmup.
                </li>
              </ul>
            </Callout>

            <CollapsibleDetail title="Gradient accumulation — thủ thuật giả vờ batch to khi GPU nhỏ">
              <p className="text-sm leading-relaxed">
                Bạn có GPU chỉ chạy nổi batch = 16, nhưng bài báo đòi batch =
                64. Thay vì mua GPU mới, bạn có thể: chạy forward + backward
                cho 4 batch = 16 liên tiếp, <strong>cộng dồn</strong> gradient,
                rồi mới gọi cập nhật trọng số một lần. Kết quả gần như y hệt
                batch = 64 mà RAM chỉ cần cho 16 mẫu. Nhiều framework gọi đây
                là <em>gradient accumulation</em>.
              </p>
            </CollapsibleDetail>

            <CollapsibleDetail title="Vì sao batch quá lớn đôi khi lại làm test accuracy tệ hơn?">
              <p className="text-sm leading-relaxed">
                Nghiên cứu của Keskar và cộng sự (2017) chỉ ra: khi batch rất
                lớn (vài nghìn trở lên), SGD gần như biến thành full-batch GD
                và hay hạ cánh vào <em>sharp minima</em> — vùng đáy hẹp, độ
                dốc thay đổi mạnh. Những minimum loại này nhìn thì thấp nhưng
                generalize kém sang dữ liệu test. Nhiễu vừa phải của mini-batch
                đóng vai trò regularize, giúp tìm vùng đáy rộng và &ldquo;êm&rdquo;
                hơn.
              </p>
            </CollapsibleDetail>

            <p className="text-sm leading-relaxed">
              Khi đã nắm batch và epoch, bước tiếp theo là hiểu tại sao chính
              cơ chế cập nhật trọng số lại được gọi là{" "}
              <TopicLink slug="sgd">stochastic gradient descent</TopicLink>{" "}
              (hạ gradient ngẫu nhiên) và cách{" "}
              <TopicLink slug="learning-rate">learning rate</TopicLink> làm
              thay đổi độ dài mỗi bước.
            </p>
          </ExplanationSection>
        </div>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BƯỚC 7 — MINI SUMMARY
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Năm điều cần nhớ về epoch, batch và iteration"
          points={[
            "Batch là một đợt nhỏ dữ liệu. Iteration là một nhịp cập nhật trọng số trên một batch. Epoch là một vòng qua toàn bộ dataset.",
            "Công thức iteration: ⌈N / B⌉ × E. Ví dụ 1000 mẫu, batch 100, 5 epoch ⇒ 50 lần cập nhật.",
            "Tráo dữ liệu trước mỗi epoch để các batch khác nhau qua các vòng, gradient đa dạng, thường generalize tốt hơn.",
            "Batch nhỏ (≤ 32) cho đường loss zig-zag nhưng chính nhiễu đó có tác dụng regularize. Batch lớn (128+) cho đường loss mượt, cần nhiều RAM.",
            "Full-batch chỉ hợp với dataset nhỏ. Với dataset lớn, hãy dùng mini-batch — và nếu thiếu RAM, dùng gradient accumulation để giả vờ batch to.",
          ]}
        />
        <div className="mt-4">
          <Callout variant="tip" title="Học tiếp">
            Khi đã hiểu epoch và batch, hãy xem tiếp{" "}
            <TopicLink slug="sgd">Stochastic Gradient Descent</TopicLink> để
            nắm chi tiết thuật toán cập nhật trọng số, và{" "}
            <TopicLink slug="learning-rate">Learning rate</TopicLink> để biết
            mỗi bước nên đi dài bao nhiêu.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BƯỚC 8 — QUIZ
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>
    </>
  );
}
