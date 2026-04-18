"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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

/* ==========================================================================
 *  METADATA — không đổi
 * ========================================================================== */
export const metadata: TopicMeta = {
  slug: "epochs-batches",
  title: "Epochs & Batches",
  titleVi: "Epoch và Batch",
  description:
    "Cách dữ liệu được chia thành lô và lặp lại nhiều vòng trong quá trình huấn luyện.",
  category: "neural-fundamentals",
  tags: ["training", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["sgd", "gradient-descent", "learning-rate"],
  vizType: "interactive",
};

/* ==========================================================================
 *  CONSTANTS — dataset mô phỏng, màu sắc, kích thước svg
 * ========================================================================== */

/** Dataset mô phỏng gồm 500 điểm. Đây là con số đủ lớn để thấy được
 *  sự khác biệt giữa batch size = 8, 32, 128 nhưng vẫn đủ nhỏ để render mượt. */
const TOTAL_SAMPLES = 500;

/** Ba lựa chọn batch size kinh điển trong cộng đồng deep learning.
 *  - 8: "noisy batch" — gradient dao động mạnh, đường đi zig‑zag
 *  - 32: mini‑batch "ngọt" — mặc định của nhiều tutorial
 *  - 128: batch lớn — mượt, ổn định, cần nhiều GPU RAM hơn */
const BATCH_OPTIONS = [8, 32, 128] as const;
type BatchOption = (typeof BATCH_OPTIONS)[number];

/** Số epoch tối đa trong bộ điều khiển. */
const MAX_EPOCHS = 10;
const MIN_EPOCHS = 1;

/** Màu phối — dùng chung với hệ thống token của dự án. */
const COLORS = {
  dataset: "#64748b",
  batch: "#3b82f6",
  lossNoisy: "#f97316",
  lossMid: "#22c55e",
  lossSmooth: "#6366f1",
  grid: "#1e293b",
  contour1: "#334155",
  contour2: "#475569",
  contour3: "#64748b",
  path: "#ef4444",
  minimum: "#fbbf24",
};

/** Khung loss landscape (biểu đồ contour). */
const LANDSCAPE_W = 420;
const LANDSCAPE_H = 280;

/** Khung loss curve theo iteration. */
const CURVE_W = 520;
const CURVE_H = 240;

/** Khung dataset 500 điểm được xếp dưới dạng grid 25×20. */
const DATA_W = 520;
const DATA_H = 200;
const GRID_COLS = 25;
const GRID_ROWS = 20;

/* ==========================================================================
 *  HELPERS — các hàm tính toán "model training" mô phỏng
 * ========================================================================== */

/** Trả về loss lý thuyết tại vị trí (w1, w2) trên bản đồ loss.
 *  Dạng hàm 2D có một minimum tại (0, 0), hợp lý để minh hoạ SGD. */
function theoreticalLoss(w1: number, w2: number): number {
  // Mặt lỗi dạng elliptic + nhiễu sinusoidal nhỏ để trông "thật" hơn
  return 0.6 * w1 * w1 + 1.2 * w2 * w2 + 0.08 * Math.sin(3 * w1) * Math.cos(2 * w2);
}

/** Ước lượng gradient tại (w1, w2) — giải tích, không số học. */
function gradient(w1: number, w2: number): [number, number] {
  const g1 = 1.2 * w1 + 0.08 * 3 * Math.cos(3 * w1) * Math.cos(2 * w2);
  const g2 = 2.4 * w2 - 0.08 * 2 * Math.sin(3 * w1) * Math.sin(2 * w2);
  return [g1, g2];
}

/** Thêm noise phụ thuộc vào batch size. Batch nhỏ = noise lớn. */
function sampleNoise(batchSize: number): number {
  // Phân phối chuẩn xấp xỉ bằng cách cộng 6 biến đều (Irwin–Hall)
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += Math.random();
  const z = sum - 3; // ~ N(0, 1)
  // Noise tỉ lệ nghịch với căn batch size — giống lý thuyết SGD
  const scale = 0.9 / Math.sqrt(batchSize);
  return z * scale;
}

/** Mô phỏng quỹ đạo SGD qua các iteration.
 *  - Bắt đầu ở (w1=1.6, w2=1.2) — góc trên phải của bản đồ
 *  - Mỗi bước: grad + noise phụ thuộc batch size */
function simulatePath(
  batchSize: number,
  steps: number,
  learningRate: number
): Array<{ w1: number; w2: number; loss: number }> {
  const path: Array<{ w1: number; w2: number; loss: number }> = [];
  let w1 = 1.6;
  let w2 = 1.2;

  for (let i = 0; i < steps; i++) {
    const [g1, g2] = gradient(w1, w2);
    const n1 = sampleNoise(batchSize);
    const n2 = sampleNoise(batchSize);
    w1 = w1 - learningRate * (g1 + n1);
    w2 = w2 - learningRate * (g2 + n2);
    path.push({
      w1,
      w2,
      loss: Math.max(0, theoreticalLoss(w1, w2) + sampleNoise(batchSize) * 0.1),
    });
  }

  return path;
}

/** Ánh xạ toạ độ (w1, w2) ∈ [-2, 2]² sang pixel trong landscape SVG. */
function landscapeXY(w1: number, w2: number): [number, number] {
  const x = ((w1 + 2) / 4) * LANDSCAPE_W;
  const y = LANDSCAPE_H - ((w2 + 2) / 4) * LANDSCAPE_H;
  return [x, y];
}

/** Ánh xạ (iteration, loss) sang pixel curve. */
function curveXY(
  iter: number,
  loss: number,
  totalIter: number,
  maxLoss: number
): [number, number] {
  const x = (iter / Math.max(1, totalIter - 1)) * (CURVE_W - 40) + 30;
  const y = CURVE_H - (loss / maxLoss) * (CURVE_H - 40) - 20;
  return [x, y];
}

/* ==========================================================================
 *  SUB‑COMPONENT: LossLandscape
 *  Contour đơn giản + quỹ đạo SGD chuyển động dần
 * ========================================================================== */

interface LossLandscapeProps {
  path: Array<{ w1: number; w2: number; loss: number }>;
  progress: number; // 0..1
}

function LossLandscape({ path, progress }: LossLandscapeProps) {
  const visibleCount = Math.max(1, Math.floor(path.length * progress));
  const visiblePath = path.slice(0, visibleCount);

  // Sinh tập điểm vẽ contour bằng cách lấy mẫu trên lưới
  const contourPoints = useMemo(() => {
    const pts: Array<{ x: number; y: number; level: number }> = [];
    const step = 14;
    for (let px = 10; px < LANDSCAPE_W; px += step) {
      for (let py = 10; py < LANDSCAPE_H; py += step) {
        const w1 = (px / LANDSCAPE_W) * 4 - 2;
        const w2 = (1 - py / LANDSCAPE_H) * 4 - 2;
        const l = theoreticalLoss(w1, w2);
        let level = 3;
        if (l < 0.4) level = 0;
        else if (l < 1.2) level = 1;
        else if (l < 2.5) level = 2;
        pts.push({ x: px, y: py, level });
      }
    }
    return pts;
  }, []);

  return (
    <svg
      viewBox={`0 0 ${LANDSCAPE_W} ${LANDSCAPE_H}`}
      className="w-full max-w-md mx-auto"
      role="img"
      aria-label="Bản đồ loss với quỹ đạo SGD"
    >
      {/* Nền */}
      <rect
        x={0}
        y={0}
        width={LANDSCAPE_W}
        height={LANDSCAPE_H}
        fill="#0f172a"
      />

      {/* Contour dạng chấm — "cheap trick" để trông có vẻ 3D */}
      {contourPoints.map((p, i) => {
        const colors = [
          "#1e293b",
          COLORS.contour1,
          COLORS.contour2,
          COLORS.contour3,
        ];
        return (
          <circle
            key={`c-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={colors[p.level]}
            opacity={0.55}
          />
        );
      })}

      {/* Trục */}
      <line
        x1={LANDSCAPE_W / 2}
        y1={0}
        x2={LANDSCAPE_W / 2}
        y2={LANDSCAPE_H}
        stroke="#334155"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        x1={0}
        y1={LANDSCAPE_H / 2}
        x2={LANDSCAPE_W}
        y2={LANDSCAPE_H / 2}
        stroke="#334155"
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* Minimum */}
      {(() => {
        const [mx, my] = landscapeXY(0, 0);
        return (
          <g>
            <circle cx={mx} cy={my} r={10} fill="none" stroke={COLORS.minimum} strokeWidth={1} opacity={0.4} />
            <circle cx={mx} cy={my} r={6} fill="none" stroke={COLORS.minimum} strokeWidth={1.5} opacity={0.7} />
            <circle cx={mx} cy={my} r={3} fill={COLORS.minimum} />
          </g>
        );
      })()}

      {/* Quỹ đạo SGD — polyline */}
      {visiblePath.length > 1 && (
        <polyline
          fill="none"
          stroke={COLORS.path}
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={visiblePath
            .map((p) => {
              const [x, y] = landscapeXY(p.w1, p.w2);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ")}
          opacity={0.85}
        />
      )}

      {/* Điểm kết thúc hiện tại */}
      {visiblePath.length > 0 && (() => {
        const last = visiblePath[visiblePath.length - 1];
        const [lx, ly] = landscapeXY(last.w1, last.w2);
        return (
          <motion.circle
            cx={lx}
            cy={ly}
            r={5}
            fill={COLORS.path}
            initial={false}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 0.4 }}
          />
        );
      })()}

      {/* Điểm khởi đầu */}
      {(() => {
        const [sx, sy] = landscapeXY(1.6, 1.2);
        return (
          <g>
            <circle cx={sx} cy={sy} r={5} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1.5} />
            <text
              x={sx + 8}
              y={sy - 6}
              fill="#94a3b8"
              fontSize={9}
              fontFamily="monospace"
            >
              start
            </text>
          </g>
        );
      })()}

      {/* Nhãn */}
      <text x={8} y={14} fill="#94a3b8" fontSize={10}>
        w₁ →
      </text>
      <text
        x={8}
        y={LANDSCAPE_H - 8}
        fill="#94a3b8"
        fontSize={10}
      >
        ← w₂
      </text>
    </svg>
  );
}

/* ==========================================================================
 *  SUB‑COMPONENT: LossCurve
 *  Vẽ đường loss theo iteration
 * ========================================================================== */

interface LossCurveProps {
  path: Array<{ w1: number; w2: number; loss: number }>;
  progress: number;
  batchSize: BatchOption;
  numBatches: number;
  epochs: number;
}

function LossCurve({ path, progress, batchSize, numBatches, epochs }: LossCurveProps) {
  const visibleCount = Math.max(1, Math.floor(path.length * progress));
  const visiblePath = path.slice(0, visibleCount);

  const maxLoss = useMemo(() => {
    return Math.max(1.5, ...path.map((p) => p.loss));
  }, [path]);

  const colorByBatch: Record<BatchOption, string> = {
    8: COLORS.lossNoisy,
    32: COLORS.lossMid,
    128: COLORS.lossSmooth,
  };
  const stroke = colorByBatch[batchSize];

  return (
    <svg
      viewBox={`0 0 ${CURVE_W} ${CURVE_H}`}
      className="w-full max-w-2xl mx-auto"
      role="img"
      aria-label="Đường loss theo iteration"
    >
      <rect x={0} y={0} width={CURVE_W} height={CURVE_H} fill="#0f172a" />

      {/* Gridlines ngang */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={`gh-${frac}`}
          x1={30}
          y1={CURVE_H - frac * (CURVE_H - 40) - 20}
          x2={CURVE_W - 10}
          y2={CURVE_H - frac * (CURVE_H - 40) - 20}
          stroke="#1e293b"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
      ))}

      {/* Ranh giới giữa các epoch */}
      {Array.from({ length: epochs }, (_, e) => {
        const iter = (e + 1) * numBatches;
        const frac = iter / (epochs * numBatches);
        const x = frac * (CURVE_W - 40) + 30;
        return (
          <line
            key={`ep-${e}`}
            x1={x}
            y1={10}
            x2={x}
            y2={CURVE_H - 20}
            stroke="#334155"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.5}
          />
        );
      })}

      {/* Trục y */}
      <line
        x1={30}
        y1={10}
        x2={30}
        y2={CURVE_H - 20}
        stroke="#475569"
        strokeWidth={1}
      />
      <text
        x={8}
        y={CURVE_H / 2}
        fill="#94a3b8"
        fontSize={10}
        transform={`rotate(-90 8 ${CURVE_H / 2})`}
      >
        Loss
      </text>

      {/* Trục x */}
      <line
        x1={30}
        y1={CURVE_H - 20}
        x2={CURVE_W - 10}
        y2={CURVE_H - 20}
        stroke="#475569"
        strokeWidth={1}
      />
      <text x={CURVE_W - 80} y={CURVE_H - 4} fill="#94a3b8" fontSize={10}>
        Iterations
      </text>

      {/* Đường loss */}
      {visiblePath.length > 1 && (
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth={1.8}
          points={visiblePath
            .map((p, i) => {
              const [x, y] = curveXY(i, p.loss, path.length, maxLoss);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ")}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Điểm hiện tại */}
      {visiblePath.length > 0 && (() => {
        const last = visiblePath[visiblePath.length - 1];
        const [x, y] = curveXY(
          visiblePath.length - 1,
          last.loss,
          path.length,
          maxLoss
        );
        return (
          <motion.circle
            cx={x}
            cy={y}
            r={4}
            fill={stroke}
            initial={false}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 0.4 }}
          />
        );
      })()}

      {/* Legend batch size */}
      <g>
        <rect x={CURVE_W - 160} y={16} width={150} height={36} rx={6} fill="#1e293b" opacity={0.9} />
        <circle cx={CURVE_W - 146} cy={34} r={4} fill={stroke} />
        <text x={CURVE_W - 136} y={38} fill="#e2e8f0" fontSize={10}>
          batch = {batchSize} ({batchSize === 8 ? "noisy" : batchSize === 32 ? "mượt vừa" : "mượt"})
        </text>
      </g>
    </svg>
  );
}

/* ==========================================================================
 *  SUB‑COMPONENT: DatasetGrid
 *  500 điểm dữ liệu xếp 25×20, highlight batch đang active
 * ========================================================================== */

interface DatasetGridProps {
  batchSize: BatchOption;
  activeBatchIndex: number;
  totalBatches: number;
}

function DatasetGrid({ batchSize, activeBatchIndex, totalBatches }: DatasetGridProps) {
  const cellW = DATA_W / GRID_COLS;
  const cellH = DATA_H / GRID_ROWS;
  const r = Math.min(cellW, cellH) / 3;

  // Giới hạn batch size rendered cho performance — mỗi batch <=128 ô
  const displayedSamples = Math.min(TOTAL_SAMPLES, GRID_COLS * GRID_ROWS);

  return (
    <svg
      viewBox={`0 0 ${DATA_W} ${DATA_H + 20}`}
      className="w-full max-w-2xl mx-auto"
      role="img"
      aria-label={`Tập dữ liệu ${TOTAL_SAMPLES} mẫu, batch ${activeBatchIndex + 1}/${totalBatches}`}
    >
      <rect x={0} y={0} width={DATA_W} height={DATA_H + 20} fill="#0f172a" />

      {Array.from({ length: displayedSamples }, (_, i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        const cx = col * cellW + cellW / 2;
        const cy = row * cellH + cellH / 2;

        // Mỗi batch có số mẫu = batchSize. Xác định mẫu này thuộc batch nào
        const batchOf = Math.floor(i / batchSize);
        const isActive = batchOf === activeBatchIndex;

        return (
          <motion.circle
            key={`d-${i}`}
            cx={cx}
            cy={cy}
            r={isActive ? r * 1.4 : r}
            fill={isActive ? COLORS.batch : COLORS.dataset}
            opacity={isActive ? 1 : 0.35}
            initial={false}
            animate={{
              r: isActive ? r * 1.4 : r,
              opacity: isActive ? 1 : 0.35,
            }}
            transition={{ duration: 0.2 }}
          />
        );
      })}

      <text
        x={DATA_W / 2}
        y={DATA_H + 14}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={10}
      >
        {TOTAL_SAMPLES} mẫu · batch hiện tại: {activeBatchIndex + 1}/{totalBatches}
      </text>
    </svg>
  );
}

/* ==========================================================================
 *  QUIZ — 8 câu
 * ========================================================================== */
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question:
      "Dataset 10.000 mẫu, batch_size = 100, train 5 epoch. Tổng cộng bao nhiêu lần cập nhật trọng số?",
    options: [
      "50 (5 × 10)",
      "500 ((10.000/100) × 5)",
      "50.000 (10.000 × 5)",
      "100 (10.000/100)",
    ],
    correct: 1,
    explanation:
      "Mỗi epoch: 10.000/100 = 100 iteration. 5 epoch → 100 × 5 = 500 lần cập nhật. Công thức: iterations = (N / B) × E.",
  },
  {
    question: "Tại sao thường shuffle dữ liệu trước mỗi epoch?",
    options: [
      "Để mô hình chạy nhanh hơn trên GPU",
      "Để mỗi batch khác nhau qua các epoch → gradient đa dạng → hội tụ tốt hơn, giảm overfit",
      "Vì CUDA yêu cầu dữ liệu ngẫu nhiên",
      "Shuffle không quan trọng — chỉ là thói quen",
    ],
    correct: 1,
    explanation:
      "Nếu giữ nguyên thứ tự, model luôn thấy cùng một chuỗi batch → có thể học pattern thứ tự thay vì nội dung. Shuffle đảm bảo batch khác nhau mỗi epoch, gradient đa dạng hơn, thường cải thiện generalization.",
  },
  {
    question:
      "Bạn có GPU 16 GB. Ảnh 1024×1024 khiến batch_size = 2 là tối đa. Vấn đề là gì, và cách giải quyết?",
    options: [
      "Không vấn đề — batch nhỏ luôn tốt",
      "Gradient quá noisy với 2 mẫu. Dùng gradient accumulation: tích lũy gradient qua nhiều batch nhỏ rồi mới cập nhật",
      "Giảm kích thước ảnh là cách duy nhất",
    ],
    correct: 1,
    explanation:
      "Gradient accumulation: chạy forward+backward 8 lần với batch = 2, cộng dồn gradient, rồi mới gọi optimizer.step(). Hiệu quả giống batch = 16 nhưng chỉ cần RAM cho 2 mẫu cùng lúc.",
  },
  {
    type: "fill-blank",
    question:
      "Dataset 1.000 mẫu, batch_size = 50, train 10 epoch. Số lần cập nhật = (1000 / {blank}) × 10 = 200 lần.",
    blanks: [{ answer: "50", accept: ["batch_size", "50"] }],
    explanation:
      "1000/50 = 20 iteration mỗi epoch. 10 epoch × 20 = 200 update. Công thức chung: iterations = (N / batch_size) × epochs.",
  },
  {
    question:
      "Bạn đang train với batch_size = 8. Đường loss rất dao động (zig‑zag). Khi đổi sang batch_size = 128 thì:",
    options: [
      "Đường loss vẫn dao động y như cũ",
      "Đường loss mượt hơn vì gradient trung bình trên nhiều mẫu hơn, variance thấp hơn",
      "Đường loss xấu hẳn đi, không thể train nổi",
    ],
    correct: 1,
    explanation:
      "Noise ~ 1/√B theo lý thuyết SGD. Tăng batch từ 8 lên 128 (×16) → noise giảm ×4. Loss curve mượt hơn rõ rệt.",
  },
  {
    question:
      "'1 epoch không đủ để model hội tụ' thường đúng trên dataset lớn vì:",
    options: [
      "Vì Python chậm",
      "Vì số lần cập nhật trong 1 epoch chưa đủ để SGD đi hết từ điểm khởi tạo đến minimum, đặc biệt khi learning rate nhỏ",
      "Vì GPU cần khởi động",
    ],
    correct: 1,
    explanation:
      "Với learning rate nhỏ và loss landscape phức tạp, SGD cần rất nhiều bước để đi từ khởi tạo ngẫu nhiên đến gần minimum. Dataset càng lớn, mỗi epoch càng nhiều iteration — nhưng vẫn có thể chưa đủ cho mô hình lớn như GPT/BERT.",
  },
  {
    question:
      "Khi nào 'batch lớn hơn' có thể làm model tệ đi (test accuracy thấp hơn)?",
    options: [
      "Không bao giờ — batch lớn luôn tốt",
      "Khi batch quá lớn, gradient quá chính xác → SGD hành xử gần giống full‑batch GD → dễ mắc kẹt ở sharp minima, generalize kém",
      "Chỉ khi GPU nhỏ",
    ],
    correct: 1,
    explanation:
      "Nghiên cứu của Keskar (2017) chỉ ra: batch quá lớn (>8k) thường đưa SGD đến sharp minima, test accuracy giảm. Batch vừa phải (32‑256) hoạt động như regularizer tự nhiên.",
  },
  {
    question:
      "Hãy chọn công thức tổng số iteration đúng nhất cho 1 lần training:",
    options: [
      "iterations = N × E",
      "iterations = E / B",
      "iterations = ⌈N/B⌉ × E (làm tròn lên vì batch cuối có thể nhỏ hơn)",
      "iterations = B × E",
    ],
    correct: 2,
    explanation:
      "Với N mẫu và batch size B, mỗi epoch có ⌈N/B⌉ iteration (batch cuối có thể thiếu). Nhân với E epoch ra tổng số lần cập nhật.",
  },
];

/* ==========================================================================
 *  MAIN COMPONENT
 * ========================================================================== */
export default function EpochsBatchesTopic() {
  // State của visualization
  const [batchSize, setBatchSize] = useState<BatchOption>(32);
  const [epochs, setEpochs] = useState<number>(3);
  const [learningRate] = useState<number>(0.06);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // 0..1
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Số batch trong 1 epoch + tổng iteration
  const numBatches = useMemo(
    () => Math.ceil(TOTAL_SAMPLES / batchSize),
    [batchSize]
  );
  const totalIterations = numBatches * epochs;

  // Sinh quỹ đạo SGD (deterministic per batchSize+epochs nhờ dùng lại)
  const path = useMemo(
    () => simulatePath(batchSize, totalIterations, learningRate),
    [batchSize, totalIterations, learningRate]
  );

  // Vị trí iteration hiện tại
  const currentIter = Math.max(0, Math.floor(progress * totalIterations) - 1);
  const currentEpoch = Math.min(epochs, Math.floor(currentIter / numBatches) + 1);
  const currentBatchInEpoch = currentIter % numBatches;

  /* -------- Animation controls -------- */
  const runAnimation = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(0);
    startTimeRef.current = null;

    const DURATION = 4500 + epochs * 400; // ms

    const tick = (ts: number) => {
      if (startTimeRef.current === null) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const p = Math.min(1, elapsed / DURATION);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsRunning(false);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [isRunning, epochs]);

  const resetAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTimeRef.current = null;
    setProgress(0);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Khi đổi batch hoặc epoch, reset animation
  useEffect(() => {
    resetAnimation();
  }, [batchSize, epochs, resetAnimation]);

  return (
    <>
      {/* =========================================================
          STEP 1 — PREDICTION GATE
          ========================================================= */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn dạy võ cho 500 học viên. Cách nào hợp lý nhất để tất cả đều thành thạo?"
          options={[
            "Dạy cả 500 cùng lúc (batch = 500) — 1 buổi xong",
            "Dạy từng người một (batch = 1) — kỹ nhưng cực chậm",
            "Chia nhóm ~32 người, dạy lần lượt, lặp lại 10 vòng (mini‑batch + nhiều epoch)",
            "Chỉ dạy 32 người giỏi — bỏ 468 người còn lại",
          ]}
          correct={2}
          explanation="Đây chính là cách deep learning hoạt động: chia nhóm nhỏ (batch) + lặp lại nhiều vòng (epoch). Mỗi batch cập nhật trọng số 1 lần. Duyệt hết 500 mẫu = xong 1 epoch."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Phía dưới bạn sẽ tự điều chỉnh <strong>batch size</strong> (8, 32, hay 128)
            và <strong>số epoch</strong> để thấy loss curve thay đổi và quỹ đạo SGD
            trên bản đồ loss. Nhấn <strong>Chạy training</strong> để xem.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* =========================================================
          STEP 2 — VISUALIZATION
          ========================================================= */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-5">
            {/* --- Tiêu đề + progress --- */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Mô phỏng training loop
                </h3>
                <p className="text-xs text-muted">
                  500 mẫu · {numBatches} batch/epoch · {epochs} epoch · tổng{" "}
                  <strong className="text-foreground">{totalIterations}</strong> iteration
                </p>
              </div>
              <ProgressSteps
                current={currentEpoch}
                total={epochs}
                labels={Array.from({ length: epochs }, (_, i) => `Epoch ${i + 1}`)}
              />
            </div>

            {/* --- Slider batch size + epoch --- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
                <label className="text-xs font-medium text-muted">
                  Batch size:{" "}
                  <strong className="text-foreground">{batchSize}</strong>{" "}
                  <span className="text-muted">({numBatches} batch/epoch)</span>
                </label>
                <div className="flex gap-2">
                  {BATCH_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={isRunning}
                      onClick={() => setBatchSize(opt)}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        batchSize === opt
                          ? "bg-accent text-white"
                          : "bg-card text-muted hover:text-foreground border border-border"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted">
                  8 = gradient nhiễu · 32 = mặc định · 128 = mượt, cần nhiều RAM
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
                <label className="text-xs font-medium text-muted">
                  Số epoch:{" "}
                  <strong className="text-foreground">{epochs}</strong>
                </label>
                <input
                  type="range"
                  min={MIN_EPOCHS}
                  max={MAX_EPOCHS}
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
                  disabled={isRunning}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[11px] text-muted">
                  <span>{MIN_EPOCHS}</span>
                  <span>5</span>
                  <span>{MAX_EPOCHS}</span>
                </div>
              </div>
            </div>

            {/* --- Hành động --- */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={runAnimation}
                disabled={isRunning}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isRunning ? "Đang train..." : `Chạy training (${epochs} epoch)`}
              </button>
              <button
                type="button"
                onClick={resetAnimation}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Đặt lại
              </button>
              <div className="ml-auto flex items-center gap-3 text-xs text-muted">
                <span>
                  Epoch{" "}
                  <strong className="text-foreground">{currentEpoch}</strong>/
                  {epochs}
                </span>
                <span>
                  Batch{" "}
                  <strong className="text-foreground">
                    {currentBatchInEpoch + 1}
                  </strong>
                  /{numBatches}
                </span>
                <span>
                  Iter{" "}
                  <strong className="text-foreground">{currentIter + 1}</strong>/
                  {totalIterations}
                </span>
              </div>
            </div>

            {/* --- Dataset grid --- */}
            <div className="rounded-lg border border-border bg-background/30 p-3">
              <p className="text-xs font-medium text-muted mb-2">
                Tập dữ liệu (batch đang được xử lý sáng lên)
              </p>
              <DatasetGrid
                batchSize={batchSize}
                activeBatchIndex={currentBatchInEpoch}
                totalBatches={numBatches}
              />
            </div>

            {/* --- Loss curve + landscape --- */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-background/30 p-3">
                <p className="text-xs font-medium text-muted mb-2">
                  Loss theo iteration
                </p>
                <LossCurve
                  path={path}
                  progress={progress}
                  batchSize={batchSize}
                  numBatches={numBatches}
                  epochs={epochs}
                />
              </div>
              <div className="rounded-lg border border-border bg-background/30 p-3">
                <p className="text-xs font-medium text-muted mb-2">
                  Quỹ đạo SGD trên bản đồ loss
                </p>
                <LossLandscape path={path} progress={progress} />
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Hãy thử: chạy với <strong>batch = 8</strong> và xem đường loss
              zig‑zag mạnh. Chuyển sang <strong>batch = 128</strong> — đường loss
              mượt hơn, quỹ đạo SGD đi gần như thẳng về điểm minimum.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* =========================================================
          STEP 3 — AHA MOMENT
          ========================================================= */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Epoch</strong> = 1 vòng qua toàn bộ dữ liệu.{" "}
            <strong>Batch</strong> = 1 lô nhỏ → 1 lần cập nhật trọng số (qua{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink>).{" "}
            <strong>Iteration</strong> = 1 lần cập nhật. Giống đội shipper Shopee:
            mỗi xe chở 1 batch đơn hàng, giao hết tất cả đơn = xong 1 epoch, hôm
            sau có đơn mới lại chạy epoch tiếp theo.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* =========================================================
          STEP 4 — INLINE CHALLENGE #1
          ========================================================= */}
      <LessonSection step={4} totalSteps={8} label="Thử thách 1">
        <InlineChallenge
          question="ImageNet: 1.2 triệu ảnh, batch_size = 256. Mỗi epoch có bao nhiêu iteration?"
          options={[
            "256 iteration",
            "≈ 4.688 iteration (1.200.000 / 256)",
            "1.200.000 iteration (mỗi ảnh 1 iteration)",
          ]}
          correct={1}
          explanation="1.200.000 / 256 ≈ 4.688 iteration mỗi epoch. Nếu train 90 epoch (ResNet baseline), tổng ≈ 422.000 lần cập nhật trọng số."
        />
      </LessonSection>

      {/* =========================================================
          STEP 5 — EXPLANATION
          ========================================================= */}
      <LessonSection step={5} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p>
            Một <strong>training loop</strong> deep learning gồm ba khái niệm lồng nhau:
            epoch chứa nhiều batch, mỗi batch thực hiện 1 iteration (forward + backward +
            cập nhật trọng số).
          </p>

          <LaTeX block>
            {"\\text{iterations} = \\left\\lceil \\frac{N}{B} \\right\\rceil \\times E"}
          </LaTeX>

          <p className="text-sm text-muted">
            Với <code>N</code> = tổng số mẫu, <code>B</code> = batch size,{" "}
            <code>E</code> = số epoch. Dấu ceiling vì batch cuối có thể nhỏ hơn B.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Khái niệm
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Định nghĩa
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Ví dụ (N=1000, B=100, E=5)
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Batch</td>
                  <td className="py-2 pr-3">
                    Nhóm B mẫu → 1 lần cập nhật trọng số
                  </td>
                  <td className="py-2">100 mẫu / batch</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Iteration</td>
                  <td className="py-2 pr-3">forward + backward + optimizer.step()</td>
                  <td className="py-2">10 iter / epoch</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Epoch</td>
                  <td className="py-2 pr-3">1 vòng qua toàn bộ N mẫu</td>
                  <td className="py-2">5 epoch = 50 iter</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">Shuffle</td>
                  <td className="py-2 pr-3">
                    Xáo trộn thứ tự trước mỗi epoch
                  </td>
                  <td className="py-2">Batch khác nhau mỗi epoch</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="tip" title="Batch size ảnh hưởng gì?">
            <strong>Nhỏ (8–32):</strong> gradient noisy, regularize tự nhiên, ít
            tốn RAM; chậm trên GPU.
            <br />
            <strong>Vừa (32–256):</strong> "sweet spot" cho đa số bài toán
            computer vision.
            <br />
            <strong>Lớn (256–4096):</strong> mượt, tận dụng GPU tốt, nhưng cần
            tăng learning rate theo quy tắc{" "}
            <em>linear scaling</em> và dễ rơi vào sharp minima.
          </Callout>

          <p className="text-sm text-muted">
            Mỗi iteration gồm: forward pass → tính loss →{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink> → cập
            nhật trọng số. Chạy nhiều epoch giúp model thấy dữ liệu nhiều lần,
            nhưng quá nhiều có thể gây{" "}
            <TopicLink slug="overfitting-underfitting">overfitting</TopicLink>.
          </p>

          <CodeBlock language="python" title="pytorch_training_loop.py">
{`# ------------------------------------------------------------------
# Training loop PyTorch chuẩn — minh hoạ đầy đủ epoch × batch
# ------------------------------------------------------------------
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset

class DummyDataset(Dataset):
    """Tập dữ liệu giả lập 500 mẫu x 10 chiều."""
    def __init__(self, n: int = 500):
        self.x = torch.randn(n, 10)
        self.y = torch.randint(0, 2, (n,))
    def __len__(self):
        return len(self.x)
    def __getitem__(self, idx):
        return self.x[idx], self.y[idx]

# 1) Dataset + DataLoader --------------------------------------------
dataset = DummyDataset(n=500)
loader = DataLoader(
    dataset,
    batch_size=32,        # <-- batch size ở đây
    shuffle=True,         # xáo trộn trước mỗi epoch
    num_workers=4,        # 4 worker load song song
    pin_memory=True,      # tăng tốc transfer CPU → GPU
    drop_last=False,      # giữ batch cuối kể cả khi <32 mẫu
)

# 2) Mô hình + loss + optimizer --------------------------------------
model = nn.Sequential(
    nn.Linear(10, 32),
    nn.ReLU(),
    nn.Linear(32, 2),
)
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.06, momentum=0.9)

EPOCHS = 5

# 3) Training loop ---------------------------------------------------
for epoch in range(EPOCHS):
    running_loss = 0.0
    model.train()

    for batch_idx, (xb, yb) in enumerate(loader):
        # forward
        logits = model(xb)
        loss = loss_fn(logits, yb)

        # backward
        optimizer.zero_grad()      # xóa grad cũ TRƯỚC khi backward
        loss.backward()            # tính d(loss)/d(weights)

        # update
        optimizer.step()           # w <- w - lr * grad

        running_loss += loss.item()

        # log
        if batch_idx % 5 == 0:
            print(
                f"[epoch {epoch+1}/{EPOCHS}] "
                f"batch {batch_idx+1}/{len(loader)} "
                f"loss={loss.item():.4f}"
            )

    avg = running_loss / len(loader)
    print(f"Epoch {epoch+1} xong — loss TB: {avg:.4f}")

# 4) Tổng số iteration = len(loader) * EPOCHS = ceil(500/32) * 5 = 80
print("Tổng iteration:", len(loader) * EPOCHS)`}
          </CodeBlock>

          <Callout variant="insight" title="Gradient Accumulation cho GPU nhỏ">
            GPU 8 GB không chứa nổi batch 256? Tích luỹ gradient qua 4 batch
            nhỏ rồi mới gọi <code>optimizer.step()</code>. Hiệu quả = batch 256
            nhưng chỉ cần RAM cho 64 mẫu cùng lúc.
          </Callout>

          <CodeBlock language="python" title="gradient_accumulation.py">
{`# Gradient accumulation: mô phỏng batch lớn trên GPU nhỏ
ACCUM_STEPS = 4          # batch hiệu quả = batch_size * 4
micro_batch_size = 64    # vừa với 8GB GPU
# -> effective batch = 256

model.train()
optimizer.zero_grad()

for i, (xb, yb) in enumerate(loader):
    logits = model(xb)
    loss = loss_fn(logits, yb) / ACCUM_STEPS   # chia đều để trung bình đúng
    loss.backward()                            # gradient TÍCH LUỸ

    if (i + 1) % ACCUM_STEPS == 0:
        optimizer.step()                       # update sau 4 batch
        optimizer.zero_grad()                  # mới reset grad`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* =========================================================
          STEP 6 — INLINE CHALLENGE #2 + Chi tiết sâu
          ========================================================= */}
      <LessonSection step={6} totalSteps={8} label="Thử thách 2 & chi tiết">
        <div className="space-y-4">
          <InlineChallenge
            question="Bạn train 10 epoch nhưng quên shuffle=True. Điều gì có khả năng xảy ra?"
            options={[
              "Không vấn đề — shuffle chỉ ảnh hưởng tốc độ",
              "Mô hình có thể học pattern thứ tự dữ liệu thay vì nội dung, gradient ít đa dạng → hội tụ chậm hoặc overfit",
              "Mô hình train nhanh hơn vì không tốn thời gian shuffle",
            ]}
            correct={1}
            explanation="Không shuffle → mỗi epoch batch giống hệt nhau → gradient theo cùng quỹ đạo → model có thể 'nhớ' thứ tự. Luôn dùng shuffle=True cho training data (không cần cho val/test)."
          />

          <CollapsibleDetail title="Vì sao batch = 1 (SGD thuần) vẫn hoạt động?">
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                Với batch = 1, mỗi iteration chỉ thấy 1 mẫu — gradient rất nhiễu
                (high variance). Nhưng nhờ <strong>expectation</strong> của
                gradient ngẫu nhiên bằng gradient của loss trung bình, SGD vẫn
                hội tụ đến minimum — chỉ là chậm và "run rẩy".
              </p>
              <p>
                Lợi ích bất ngờ: noise này giúp SGD thoát khỏi các local minima
                cạn và tìm đến flat minima — được cho là generalize tốt hơn. Đó
                là lý do mini‑batch vừa phải vẫn hay hơn full‑batch trong thực
                tế.
              </p>
              <LaTeX block>
                {"\\mathbb{E}[\\nabla L_{\\text{batch}}] = \\nabla L_{\\text{full}}"}
              </LaTeX>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Quy tắc linear scaling cho learning rate">
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                Khi tăng batch size từ <code>B</code> lên <code>kB</code>, gradient
                trung bình mịn hơn nhưng có cùng hướng. Nhiều bài báo (Goyal et al.,
                2017 — "Accurate, Large Minibatch SGD") đề xuất nhân learning rate
                lên <code>k</code> lần:
              </p>
              <LaTeX block>{"\\eta_{\\text{new}} = k \\cdot \\eta_{\\text{base}}"}</LaTeX>
              <p>
                Ví dụ: baseline ResNet‑50 batch=256 dùng lr=0.1. Khi scale lên
                batch=8192 (×32), lr mới ≈ 3.2. Đi kèm thường phải có{" "}
                <strong>warmup</strong> vài epoch đầu để tránh divergence.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* =========================================================
          STEP 7 — MINI SUMMARY
          ========================================================= */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Epochs & Batches — 6 ý cần nhớ"
          points={[
            "Batch = 1 lô nhỏ dữ liệu → 1 lần cập nhật trọng số. Epoch = 1 vòng qua toàn bộ dữ liệu.",
            "iterations = ⌈N / batch_size⌉ × epochs. ImageNet 90 epoch batch 256 ≈ 422.000 update.",
            "Shuffle trước mỗi epoch: batch khác nhau → gradient đa dạng → thường generalize tốt hơn.",
            "Batch nhỏ (8–32) = noisy nhưng regularize. Batch lớn (>256) = mượt, cần tăng LR theo linear scaling.",
            "GPU thiếu RAM? Gradient accumulation: tích lũy gradient qua N batch nhỏ rồi mới optimizer.step().",
            "Loss curve mượt dần khi tăng batch (noise ~ 1/√B). Batch quá lớn có thể rơi vào sharp minima → test kém.",
          ]}
        />
      </LessonSection>

      {/* =========================================================
          STEP 8 — QUIZ
          ========================================================= */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ_QUESTIONS} />
      </LessonSection>

      {/* =========================================================
          BONUS — 4 Callouts phụ (được yêu cầu) phân bố cuối bài
          ========================================================= */}
      <LessonSection step={8} totalSteps={8} label="Tham khảo nhanh">
        <div className="space-y-3">
          <Callout variant="info" title="Sự khác biệt giữa batch GD, mini‑batch GD, và SGD">
            <p>
              <strong>Batch GD</strong> dùng toàn bộ N mẫu mỗi update — chính xác
              nhất về gradient, nhưng cực chậm với dataset lớn.{" "}
              <strong>SGD</strong> dùng 1 mẫu — nhanh, nhiễu, hay thoát local
              minima. <strong>Mini‑batch GD</strong> (batch 32–512) là dung hoà:
              tận dụng vector hoá GPU + noise vừa phải.
            </p>
          </Callout>

          <Callout variant="warning" title="Cẩn thận: batch size và BatchNorm">
            <p>
              <TopicLink slug="batch-normalization">Batch Normalization</TopicLink>{" "}
              phụ thuộc vào thống kê trong batch hiện tại. Nếu batch quá nhỏ
              (≤ 8), thống kê không ổn định → BN hoạt động kém. Giải pháp:{" "}
              <strong>GroupNorm</strong> hoặc <strong>LayerNorm</strong>, hoặc
              dùng <em>Sync BN</em> qua nhiều GPU.
            </p>
          </Callout>

          <Callout variant="tip" title="Mẹo debug: lưu checkpoint mỗi N epoch">
            <p>
              Train lâu có thể crash. Hãy <code>torch.save(model.state_dict(),
              ...)</code> sau mỗi epoch (hoặc mỗi N batch). Tốt nhất lưu kèm
              epoch, optimizer state, và loss hiện tại để có thể resume chính
              xác.
            </p>
          </Callout>

          <Callout variant="insight" title="Epoch không phải đơn vị thời gian duy nhất">
            <p>
              Trong huấn luyện LLM hiện đại, người ta hay đo bằng{" "}
              <strong>số token đã thấy</strong> thay vì epoch (vì dataset quá
              lớn — có thể chỉ train 1 epoch!). GPT‑3 train trên ~300B token —
              chưa hết 1 vòng Common Crawl + Books + Wikipedia.
            </p>
          </Callout>
        </div>
      </LessonSection>
    </>
  );
}
