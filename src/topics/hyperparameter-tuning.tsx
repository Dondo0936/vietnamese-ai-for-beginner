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
  slug: "hyperparameter-tuning",
  title: "Hyperparameter Tuning",
  titleVi: "Tinh chỉnh siêu tham số — Tìm công thức vàng",
  description:
    "Quá trình tìm kiếm bộ siêu tham số tối ưu (learning rate, batch size, layers...) để mô hình đạt hiệu suất cao nhất.",
  category: "foundations",
  tags: ["hyperparameter", "tuning", "optimization", "grid-search"],
  difficulty: "intermediate",
  relatedSlugs: ["learning-rate", "train-val-test", "overfitting-underfitting"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

// ---------------------------------------------------------------------------
// Domain data for the interactive visualizations
// ---------------------------------------------------------------------------

type LearningRate = 0.0001 | 0.001 | 0.003 | 0.01 | 0.03 | 0.1;
type BatchSize = 8 | 16 | 32 | 64 | 128 | 256;

interface GridCell {
  lr: LearningRate;
  bs: BatchSize;
  /** Validation accuracy in [0, 1] sampled from a smooth synthetic landscape */
  accuracy: number;
  /** Total GPU-minutes burned to evaluate this cell */
  costMinutes: number;
}

const LEARNING_RATES: LearningRate[] = [0.0001, 0.001, 0.003, 0.01, 0.03, 0.1];
const BATCH_SIZES: BatchSize[] = [8, 16, 32, 64, 128, 256];

/**
 * Synthetic validation-accuracy landscape — peaks around lr=0.003, bs=32 and
 * degrades as we move toward the corners. The shape is smooth so the
 * heatmap reads intuitively while still rewarding careful search.
 */
function syntheticAccuracy(lr: LearningRate, bs: BatchSize): number {
  const logLr = Math.log10(lr); // roughly in [-4, -1]
  const logBs = Math.log2(bs); // roughly in [3, 8]
  const lrDistance = Math.abs(logLr - Math.log10(0.003));
  const bsDistance = Math.abs(logBs - Math.log2(32));
  const peak = 0.93;
  const drop = 0.18 * lrDistance + 0.06 * bsDistance;
  const noise = ((Math.sin(logLr * 7.31 + logBs * 3.17) + 1) / 2) * 0.03;
  return Math.max(0.42, peak - drop + noise);
}

function syntheticCost(bs: BatchSize): number {
  // Larger batches take slightly longer per step but converge faster.
  // We model this as roughly flat with a small batch-size penalty.
  return 5 + Math.log2(bs) * 1.4;
}

const GRID_CELLS: GridCell[] = LEARNING_RATES.flatMap((lr) =>
  BATCH_SIZES.map<GridCell>((bs) => ({
    lr,
    bs,
    accuracy: syntheticAccuracy(lr, bs),
    costMinutes: syntheticCost(bs),
  })),
);

function accuracyToColor(accuracy: number): string {
  // Map [0.42, 0.95] → cold (slate) → warm (emerald) gradient.
  const t = Math.max(0, Math.min(1, (accuracy - 0.42) / (0.95 - 0.42)));
  const red = Math.round(239 - t * (239 - 34));
  const green = Math.round(68 + t * (197 - 68));
  const blue = Math.round(68 + t * (94 - 68));
  return `rgb(${red}, ${green}, ${blue})`;
}

function formatLr(lr: LearningRate): string {
  if (lr >= 0.01) return lr.toFixed(2);
  if (lr >= 0.001) return lr.toFixed(3);
  return lr.toExponential(0);
}

// ---------------------------------------------------------------------------
// Data for the random-vs-grid comparison
// ---------------------------------------------------------------------------

interface SearchTrial {
  lr: number;
  bs: number;
  accuracy: number;
}

/**
 * A handful of hard-coded trials illustrating why random search tends to
 * outperform grid search when only one or two hyperparameters actually
 * matter (Bergstra & Bengio, 2012). Grid samples the same few lr values
 * repeatedly; random spreads coverage across the important axis.
 */
const GRID_TRIALS: SearchTrial[] = [
  { lr: 0.0001, bs: 32, accuracy: 0.58 },
  { lr: 0.001, bs: 32, accuracy: 0.81 },
  { lr: 0.01, bs: 32, accuracy: 0.88 },
  { lr: 0.1, bs: 32, accuracy: 0.51 },
  { lr: 0.0001, bs: 128, accuracy: 0.55 },
  { lr: 0.001, bs: 128, accuracy: 0.79 },
  { lr: 0.01, bs: 128, accuracy: 0.86 },
  { lr: 0.1, bs: 128, accuracy: 0.48 },
];

const RANDOM_TRIALS: SearchTrial[] = [
  { lr: 0.0002, bs: 47, accuracy: 0.66 },
  { lr: 0.0007, bs: 73, accuracy: 0.78 },
  { lr: 0.0023, bs: 18, accuracy: 0.9 },
  { lr: 0.004, bs: 96, accuracy: 0.92 },
  { lr: 0.013, bs: 58, accuracy: 0.85 },
  { lr: 0.019, bs: 204, accuracy: 0.77 },
  { lr: 0.057, bs: 41, accuracy: 0.63 },
  { lr: 0.082, bs: 12, accuracy: 0.55 },
];

// ---------------------------------------------------------------------------
// Interactive grid-search heatmap
// ---------------------------------------------------------------------------

interface HeatmapProps {
  cells: GridCell[];
  activated: Set<string>;
  onActivate: (cellKey: string) => void;
}

function cellKey(lr: LearningRate, bs: BatchSize): string {
  return `${lr}|${bs}`;
}

function GridSearchHeatmap({ cells, activated, onActivate }: HeatmapProps) {
  const cellSize = 60;
  const originX = 80;
  const originY = 40;
  const width = originX + cellSize * LEARNING_RATES.length + 40;
  const height = originY + cellSize * BATCH_SIZES.length + 60;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-3xl mx-auto"
      role="img"
      aria-label="Grid search heatmap: learning rate vs batch size"
    >
      <text
        x={width / 2}
        y={20}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={12}
        fontWeight="bold"
      >
        Grid Search: Learning Rate × Batch Size (click để chạy thử)
      </text>

      {/* Axis labels */}
      <text
        x={originX + (cellSize * LEARNING_RATES.length) / 2}
        y={originY - 16}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={11}
      >
        Learning Rate →
      </text>
      <text
        x={20}
        y={originY + (cellSize * BATCH_SIZES.length) / 2}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={11}
        transform={`rotate(-90 20 ${
          originY + (cellSize * BATCH_SIZES.length) / 2
        })`}
      >
        Batch Size ↑
      </text>

      {/* Column labels: learning rate */}
      {LEARNING_RATES.map((lr, i) => (
        <text
          key={`lr-${lr}`}
          x={originX + i * cellSize + cellSize / 2}
          y={originY - 4}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize={11}
        >
          {formatLr(lr)}
        </text>
      ))}

      {/* Row labels: batch size */}
      {BATCH_SIZES.map((bs, j) => (
        <text
          key={`bs-${bs}`}
          x={originX - 8}
          y={originY + j * cellSize + cellSize / 2 + 3}
          textAnchor="end"
          fill="#cbd5e1"
          fontSize={11}
        >
          {bs}
        </text>
      ))}

      {/* Cells */}
      {cells.map((cell) => {
        const i = LEARNING_RATES.indexOf(cell.lr);
        const j = BATCH_SIZES.indexOf(cell.bs);
        const key = cellKey(cell.lr, cell.bs);
        const isActive = activated.has(key);
        const color = isActive ? accuracyToColor(cell.accuracy) : "#1e293b";
        const stroke = isActive ? "#f8fafc" : "#334155";

        return (
          <g key={key}>
            <rect
              x={originX + i * cellSize + 2}
              y={originY + j * cellSize + 2}
              width={cellSize - 4}
              height={cellSize - 4}
              rx={6}
              fill={color}
              stroke={stroke}
              strokeWidth={isActive ? 1.5 : 0.75}
              className="cursor-pointer transition-colors"
              onClick={() => onActivate(key)}
            />
            {isActive && (
              <text
                x={originX + i * cellSize + cellSize / 2}
                y={originY + j * cellSize + cellSize / 2 + 4}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight="bold"
                pointerEvents="none"
              >
                {(cell.accuracy * 100).toFixed(0)}%
              </text>
            )}
            {!isActive && (
              <text
                x={originX + i * cellSize + cellSize / 2}
                y={originY + j * cellSize + cellSize / 2 + 4}
                textAnchor="middle"
                fill="#64748b"
                fontSize={11}
                pointerEvents="none"
              >
                ?
              </text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${originX}, ${originY + cellSize * BATCH_SIZES.length + 18})`}>
        <text x={0} y={6} fill="#94a3b8" fontSize={11}>
          Accuracy
        </text>
        {Array.from({ length: 12 }).map((_, idx) => {
          const acc = 0.42 + (idx / 11) * (0.95 - 0.42);
          return (
            <rect
              key={idx}
              x={60 + idx * 14}
              y={0}
              width={14}
              height={10}
              fill={accuracyToColor(acc)}
            />
          );
        })}
        <text x={60} y={24} fill="#64748b" fontSize={11}>
          42%
        </text>
        <text x={60 + 11 * 14} y={24} fill="#64748b" fontSize={11}>
          95%
        </text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Grid vs random scatter comparison
// ---------------------------------------------------------------------------

function SearchComparison() {
  const plotWidth = 260;
  const plotHeight = 180;
  const minLogLr = -4.2;
  const maxLogLr = -0.8;
  const minLogBs = 2.8;
  const maxLogBs = 8.2;

  function projectX(lr: number): number {
    const t = (Math.log10(lr) - minLogLr) / (maxLogLr - minLogLr);
    return 40 + t * (plotWidth - 50);
  }

  function projectY(bs: number): number {
    const t = (Math.log2(bs) - minLogBs) / (maxLogBs - minLogBs);
    return plotHeight - 30 - t * (plotHeight - 60);
  }

  function renderPlot(
    trials: SearchTrial[],
    title: string,
    offsetX: number,
    tint: string,
  ) {
    return (
      <g transform={`translate(${offsetX}, 0)`}>
        <text
          x={plotWidth / 2}
          y={18}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize={11}
          fontWeight="bold"
        >
          {title}
        </text>

        {/* Axes */}
        <line
          x1={40}
          y1={plotHeight - 30}
          x2={plotWidth - 10}
          y2={plotHeight - 30}
          stroke="#475569"
          strokeWidth={1}
        />
        <line
          x1={40}
          y1={30}
          x2={40}
          y2={plotHeight - 30}
          stroke="#475569"
          strokeWidth={1}
        />
        <text
          x={plotWidth / 2}
          y={plotHeight - 12}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={11}
        >
          log(learning rate)
        </text>
        <text
          x={12}
          y={plotHeight / 2}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={11}
          transform={`rotate(-90 12 ${plotHeight / 2})`}
        >
          log(batch size)
        </text>

        {/* Projection shadows onto the "important" axis (x) */}
        {trials.map((t, idx) => (
          <line
            key={`shadow-${idx}`}
            x1={projectX(t.lr)}
            y1={plotHeight - 30}
            x2={projectX(t.lr)}
            y2={plotHeight - 24}
            stroke={tint}
            strokeWidth={2}
            opacity={0.6}
          />
        ))}

        {/* Trials */}
        {trials.map((t, idx) => (
          <circle
            key={`trial-${idx}`}
            cx={projectX(t.lr)}
            cy={projectY(t.bs)}
            r={5 + t.accuracy * 3}
            fill={accuracyToColor(t.accuracy)}
            stroke={tint}
            strokeWidth={1.5}
          />
        ))}
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${plotWidth * 2 + 30} ${plotHeight + 20}`} className="w-full max-w-3xl mx-auto">
      {renderPlot(GRID_TRIALS, "Grid Search (8 trials)", 0, "#ef4444")}
      {renderPlot(RANDOM_TRIALS, "Random Search (8 trials)", plotWidth + 20, "#22c55e")}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Bayesian-opt efficiency bars (from the earlier version, tightened)
// ---------------------------------------------------------------------------

function StrategyEfficiencyBars() {
  const strategies = [
    {
      name: "Grid Search",
      description: "Thử tất cả tổ hợp — bùng nổ tổ hợp",
      trials: "10^N (thường không khả thi)",
      efficiency: 20,
      color: "#ef4444",
    },
    {
      name: "Random Search",
      description: "Sampling đều — coverage tốt",
      trials: "~100 trials",
      efficiency: 55,
      color: "#f59e0b",
    },
    {
      name: "Bayesian Opt",
      description: "Surrogate model dự đoán vùng hứa hẹn",
      trials: "~30–50 trials",
      efficiency: 90,
      color: "#22c55e",
    },
  ];

  return (
    <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
      <text
        x={300}
        y={18}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={12}
        fontWeight="bold"
      >
        3 chiến lược Hyperparameter Tuning — hiệu quả/budget
      </text>

      {strategies.map((s, idx) => {
        const y = 40 + idx * 48;
        const barWidth = 340;
        const filled = (barWidth * s.efficiency) / 100;
        return (
          <g key={s.name}>
            <text x={15} y={y + 14} fill="#cbd5e1" fontSize={11} fontWeight="bold">
              {s.name}
            </text>
            <text x={15} y={y + 26} fill="#64748b" fontSize={11}>
              {s.description}
            </text>
            <rect x={160} y={y} width={barWidth} height={28} rx={4} fill="#1e293b" />
            <rect x={160} y={y} width={filled} height={28} rx={4} fill={s.color} />
            <text
              x={160 + filled - 8}
              y={y + 18}
              textAnchor="end"
              fill="white"
              fontSize={11}
              fontWeight="bold"
            >
              {s.efficiency}%
            </text>
            <text x={510} y={y + 18} fill="#94a3b8" fontSize={11}>
              {s.trials}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Hooks that encapsulate the interactive "run experiment" logic
// ---------------------------------------------------------------------------

interface UseGridExplorerResult {
  activated: Set<string>;
  bestCell: GridCell | null;
  totalCost: number;
  runCell: (key: string) => void;
  runRandomBatch: (count: number) => void;
  reset: () => void;
}

function useGridExplorer(cells: GridCell[]): UseGridExplorerResult {
  const [activated, setActivated] = useState<Set<string>>(new Set());

  const runCell = useCallback((key: string) => {
    setActivated((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const runRandomBatch = useCallback(
    (count: number) => {
      setActivated((prev) => {
        const next = new Set(prev);
        const available = cells
          .map((cell) => cellKey(cell.lr, cell.bs))
          .filter((key) => !next.has(key));
        for (let i = 0; i < count && available.length > 0; i += 1) {
          const idx = Math.floor(Math.random() * available.length);
          next.add(available[idx]);
          available.splice(idx, 1);
        }
        return next;
      });
    },
    [cells],
  );

  const reset = useCallback(() => {
    setActivated(new Set());
  }, []);

  const { bestCell, totalCost } = useMemo(() => {
    let best: GridCell | null = null;
    let cost = 0;
    for (const cell of cells) {
      if (!activated.has(cellKey(cell.lr, cell.bs))) continue;
      cost += cell.costMinutes;
      if (!best || cell.accuracy > best.accuracy) best = cell;
    }
    return { bestCell: best, totalCost: cost };
  }, [activated, cells]);

  return { activated, bestCell, totalCost, runCell, runRandomBatch, reset };
}

// ---------------------------------------------------------------------------
// Control panel wrapping the heatmap
// ---------------------------------------------------------------------------

interface ControlPanelProps {
  activatedCount: number;
  bestCell: GridCell | null;
  totalCost: number;
  onRunRandom: (count: number) => void;
  onReset: () => void;
}

function HeatmapControlPanel({
  activatedCount,
  bestCell,
  totalCost,
  onRunRandom,
  onReset,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mt-4">
      <div className="flex-1 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className="text-muted">
            Đã chạy: <strong className="text-foreground">{activatedCount}</strong>/36 cells
          </span>
          <span className="text-muted">
            Chi phí: <strong className="text-foreground">{totalCost.toFixed(1)} phút</strong>
          </span>
          {bestCell && (
            <span className="text-muted">
              Best so far:{" "}
              <strong className="text-foreground">
                {(bestCell.accuracy * 100).toFixed(1)}%
              </strong>{" "}
              (lr={formatLr(bestCell.lr)}, bs={bestCell.bs})
            </span>
          )}
        </div>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onRunRandom(5)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Random 5 trials
      </motion.button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onReset}
        className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Reset
      </motion.button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main topic component
// ---------------------------------------------------------------------------

export default function HyperparameterTuningTopic() {
  const explorer = useGridExplorer(GRID_CELLS);

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Hyperparameter khác parameter (weights) thế nào?",
        options: [
          "Hai tên gọi của cùng một thứ",
          "Hyperparameters được ĐẶT TRƯỚC training (lr, layers, batch_size). Parameters (weights, biases) được MÔ HÌNH HỌC trong training",
          "Hyperparameters luôn lớn hơn parameters",
          "Parameters chỉ có ở deep learning, hyperparameters có ở mọi mô hình",
        ],
        correct: 1,
        explanation:
          "Parameters (weights, biases) là thứ mô hình tự học thông qua gradient descent. Hyperparameters (learning rate, số layers, dropout rate, batch size...) là thứ NGƯỜI chọn trước khi training. Hyperparameter tuning = tìm bộ hyperparameters tốt nhất để parameters hội tụ tới lời giải tốt.",
      },
      {
        question: "Grid Search vs Random Search: cái nào thường tốt hơn?",
        options: [
          "Grid Search vì thử tất cả tổ hợp chắc chắn không bỏ sót",
          "Random Search — với cùng budget, thường tìm config tốt hơn vì explore nhiều giá trị của mỗi hyperparameter hơn",
          "Hai cái hoàn toàn tương đương về mặt toán học",
          "Grid Search chỉ tốt khi mô hình có ít hơn 2 hyperparameters",
        ],
        correct: 1,
        explanation:
          "Grid search 10×10 = 100 trials nhưng chỉ có 10 giá trị mỗi trục. Random search 100 trials thì mỗi trục có ~100 giá trị phân bố khác nhau. Bergstra & Bengio (2012) chứng minh rằng khi chỉ một vài hyperparameter thực sự quan trọng thì random search thắng grid với cùng budget.",
      },
      {
        question: "Bayesian Optimization ưu việt hơn random search ở điểm nào?",
        options: [
          "Nhanh hơn vì chạy được trên GPU",
          "Dùng surrogate model (Gaussian Process) để học từ trials đã chạy và dự đoán vùng hyperparameter hứa hẹn → cần ít trials hơn",
          "Không thực sự tốt hơn random",
          "Không cần validation set vì đã có GP",
        ],
        correct: 1,
        explanation:
          "Bayesian Optimization fit một Gaussian Process lên (hyperparams → accuracy). Sau mỗi trial, GP được update và acquisition function (Expected Improvement, UCB) chọn điểm kế tiếp — vừa khai thác vùng tốt vừa khám phá vùng chưa chắc chắn. Thường hiệu quả gấp 3–5× random search.",
      },
      {
        question:
          "Bạn thấy mô hình train loss rất thấp nhưng validation accuracy kém. Hyperparameter nào nên tune TRƯỚC?",
        options: [
          "Learning rate — vì lr luôn là hung thủ số một",
          "Regularization (weight decay, dropout) — vấn đề là overfitting, không phải tốc độ học",
          "Số epochs — train thêm nhiều epoch nữa",
          "Batch size — batch size nhỏ hơn sẽ giảm overfitting",
        ],
        correct: 1,
        explanation:
          "Train loss thấp + val accuracy kém = overfitting. Tăng regularization (weight decay, dropout, data augmentation) là phản ứng đầu tiên. Tune lr không giải quyết overfitting. Train thêm epoch sẽ làm overfitting tệ hơn. Xem thêm overfitting-underfitting.",
      },
      {
        question: "Khi nào nên dùng log-uniform thay vì uniform cho learning rate?",
        options: [
          "Luôn uniform — đơn giản hơn",
          "Khi hyperparameter trải nhiều orders of magnitude (ví dụ lr từ 1e-5 đến 1e-1), log-uniform cho phép sample đều trên mỗi thập phân",
          "Chỉ dùng log-uniform cho batch size",
          "Log-uniform chỉ dùng cho model nhỏ",
        ],
        correct: 1,
        explanation:
          "Learning rate thường trải 4–5 orders of magnitude. Uniform sampling trong [1e-5, 1e-1] sẽ hầu như luôn rơi vào vùng gần 0.1. Log-uniform sample đều trên thang log → coverage tốt cho mọi thập phân. Quy tắc: tham số liên tục, nhiều orders → log-uniform.",
      },
      {
        question:
          "Team bạn có 4 GPU. Mỗi trial mất ~8 giờ. Deadline 2 ngày. Chiến lược tuning nào?",
        options: [
          "Grid search đầy đủ trên 5 hyperparameters",
          "Bayesian Opt song song (async) ~24 trials (4 GPU × 6 vòng × 8h ≈ 2 ngày) — song song tốt nhất với sequential-suggest-async",
          "Tune tay theo cảm tính",
          "Chỉ chạy 1 trial với config default",
        ],
        correct: 1,
        explanation:
          "4 GPU × 2 ngày × 24h / 8h = 24 trial-slots. Bayesian Opt async (Optuna, W&B Sweeps) suggest tiếp theo cho mỗi GPU ngay khi nó rảnh → tận dụng tối đa hardware. Grid search 5 HPs là bất khả thi với budget này.",
      },
      {
        question: "Early stopping trong hyperparameter tuning nghĩa là gì?",
        options: [
          "Dừng training khi loss = 0",
          "Dừng SỚM những trial kém hứa hẹn (ví dụ ASHA, Hyperband) để dồn budget cho trial tốt → tăng throughput 3–10×",
          "Chỉ chạy 1 epoch cho mọi trial",
          "Không liên quan tới hyperparameter tuning",
        ],
        correct: 1,
        explanation:
          "ASHA/Hyperband/Successive Halving: cho mọi trial chạy vài epoch, kill các trial bottom-half, dồn compute cho trial sống sót. Cực kỳ hiệu quả cho deep learning nơi learning curve có thể suy luận sớm.",
      },
      {
        type: "fill-blank",
        question:
          "Hai hyperparameter quan trọng nhất với deep learning là {blank} và {blank} (dạng regularization).",
        blanks: [
          { answer: "learning rate", accept: ["lr", "learning_rate", "tốc độ học"] },
          { answer: "weight decay", accept: ["dropout", "regularization", "l2"] },
        ],
        explanation:
          "Learning rate quyết định hội tụ (ảnh hưởng 10× tới kết quả cuối). Regularization (weight decay / dropout) quyết định generalization. Hai hyperparameter này nên được tune trước tiên và kỹ nhất.",
      },
    ],
    [],
  );

  const activatedCount = explorer.activated.size;

  return (
    <>
      <LessonSection step={0} totalSteps={TOTAL_STEPS} label="Tiến trình">
        <ProgressSteps
          current={0}
          total={TOTAL_STEPS}
          labels={[
            "Dự đoán",
            "Khám phá",
            "Aha",
            "Thử thách",
            "Lý thuyết",
            "Tóm tắt",
            "Kiểm tra",
          ]}
        />
      </LessonSection>

      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn train một classifier: lr=0.1 → accuracy 70%, lr=0.01 → 85%, lr=0.001 → 80%. Còn 10 hyperparameter khác cần tune, mỗi trial mất 1 giờ. Cách nào tìm bộ tối ưu?"
          options={[
            "Thử tất cả tổ hợp (Grid Search) — dù 10^10 trials là bất khả thi",
            "Dùng Bayesian Optimization: surrogate model dự đoán vùng hứa hẹn → tìm near-optimal với 50–100 trials",
            "Random chọn 10 trials và chốt config tốt nhất thấy được",
            "Hỏi ChatGPT config nào tốt và dùng luôn",
          ]}
          correct={1}
          explanation="Grid search: 10 giá trị × 10 hyperparams = 10 tỷ tổ hợp — hoàn toàn không khả thi. Random search: tốt hơn nhưng vẫn 'mù' theo nghĩa không học từ trials trước. Bayesian Optimization: GP học từ mỗi trial → dự đoán vùng nào hứa hẹn, đưa ra suggestion tiếp theo thông minh. 50–100 trials thường đủ tìm near-optimal."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection topicSlug={metadata.slug}>
              <div className="space-y-6">
                <p className="text-sm text-muted">
                  Heatmap bên dưới là landscape validation accuracy trên lưới 6×6 của{" "}
                  <code className="px-1 rounded bg-surface">learning_rate × batch_size</code>.
                  Click từng cell để &quot;chạy&quot; thí nghiệm — màu sẽ hiện ra dựa trên
                  accuracy thật. Thử random 5 trials và so sánh với việc phải grid-search
                  đầy đủ 36 cells.
                </p>

                <GridSearchHeatmap
                  cells={GRID_CELLS}
                  activated={explorer.activated}
                  onActivate={explorer.runCell}
                />

                <HeatmapControlPanel
                  activatedCount={activatedCount}
                  bestCell={explorer.bestCell}
                  totalCost={explorer.totalCost}
                  onRunRandom={explorer.runRandomBatch}
                  onReset={explorer.reset}
                />

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted mb-3">
                    Grid search (trái) dành toàn bộ budget cho 8 combination cố định trên
                    2 giá trị batch size. Random search (phải) với cùng 8 trials phân bố
                    khắp không gian — coverage trên trục learning rate (trục &quot;quan
                    trọng&quot;) tốt hơn hẳn.
                  </p>

                  <SearchComparison />
                </div>

                <div className="pt-4 border-t border-border">
                  <StrategyEfficiencyBars />
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                Bayesian Optimization giống <strong>GPS thông minh</strong> cho không gian
                hyperparameter — mỗi lần thử xong, nó <strong>học</strong> một bản đồ xấp
                xỉ và <strong>dự đoán</strong> vùng nào có thể cho kết quả tốt hơn. Tìm
                near-optimal với 50 trials thay vì 10.000 trials random.{" "}
                <strong>Optuna</strong> là tool miễn phí tốt nhất hiện nay cho Bayesian HP
                tuning, và nó tích hợp thẳng với{" "}
                <TopicLink slug="train-val-test">pipeline train/val/test</TopicLink> của
                bạn.
              </p>
            </AhaMoment>

            <Callout variant="insight" title="Học từ quá khứ">
              Điểm mấu chốt: Grid và Random đều <em>không học</em> từ trials trước. Chúng
              chỉ sample theo một schedule cố định hoặc ngẫu nhiên. Bayesian Opt <em>học
              một mô hình</em> của landscape → mọi trial đều cung cấp thông tin cho trial
              kế tiếp. Đây là lý do nó hiệu quả đột phá khi trials đắt đỏ (LLM
              fine-tuning, RL training).
            </Callout>
          </LessonSection>

          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="Bạn có budget 100 GPU-hours cho HP tuning. Mỗi trial mất 1 giờ. 5 hyperparameters cần tune. Grid cần 10^5 = 100K trials. Random cần ~300. Bayesian?"
                options={[
                  "100 trials (1 trial mỗi GPU-hour)",
                  "30–50 trials — Bayesian Opt hiệu quả hơn 3–5× random, tìm near-optimal với ~50 trials",
                  "Vẫn cần 100K trials như grid",
                  "Chỉ 5 trials — mỗi HP 1 trial",
                ]}
                correct={1}
                explanation="Bayesian Opt thường đạt near-optimal trong 30–50 trials. Budget 100 GPU-hours: dùng 50 cho sweep, còn 50 để retrain final model với best config trên full data. Hiệu quả hơn random 3–5×, hơn grid vô hạn lần. Tools: Optuna, W&B Sweeps, Ray Tune."
              />

              <InlineChallenge
                question="Sau 20 trials random search, best accuracy = 88% tại lr=0.003, bs=32. Bạn muốn tinh chỉnh thêm. Chiến lược nào tốt nhất?"
                options={[
                  "Tiếp tục random search thêm 20 trials nữa với cùng range rộng",
                  "Bayesian Opt tập trung vào vùng quanh (lr=0.003, bs=32) — exploitation gần vùng tốt",
                  "Bỏ hết, grid search từ đầu",
                  "Chọn lr=0.003, bs=32 là final, không tune nữa",
                ]}
                correct={1}
                explanation="Sau giai đoạn explore, nên chuyển sang exploit. Bayesian Opt với prior tập trung quanh best config (hoặc narrow search range) sẽ tinh chỉnh thêm 1–2% accuracy. Optuna làm việc này tự động qua acquisition function."
              />
            </div>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection topicSlug={metadata.slug}>
              <p>
                <strong>Hyperparameter Tuning</strong> là quá trình tìm bộ siêu tham số
                (learning rate, batch size, weight decay, kiến trúc...) tối ưu cho một
                nhiệm vụ và dataset cụ thể. Không có bộ &quot;default&quot; tốt cho mọi
                bài toán — tuning là bắt buộc khi triển khai nghiêm túc.
              </p>

              <p>
                <strong>Grid Search</strong> duyệt qua mọi tổ hợp trên lưới cố định:
              </p>

              <LaTeX block>
                {"\\mathcal{H}_{\\text{grid}} = \\{\\theta : \\theta_i \\in \\text{values}_i\\} \\quad |\\mathcal{H}| = \\prod_i |\\text{values}_i|"}
              </LaTeX>

              <p>
                Với N hyperparameter mỗi cái 10 giá trị, lưới có 10^N điểm — bất khả thi
                khi N &gt; 3. Grid search cũng &quot;phí&quot; budget vì nhiều chiều thực
                ra không quan trọng.
              </p>

              <p>
                <strong>Random Search</strong> sample từng hyperparameter độc lập từ một
                phân phối:
              </p>

              <LaTeX block>
                {"\\theta^{(k)} \\sim \\prod_i p_i(\\theta_i), \\quad k = 1, \\ldots, T"}
              </LaTeX>

              <p>
                Với cùng T trials, random search cho mỗi hyperparameter T giá trị khác
                nhau (grid chỉ cho |values_i| giá trị). Khi chỉ 1–2 hyperparameter thực
                sự quan trọng, random explore vùng có ích tốt hơn.
              </p>

              <p>
                <strong>Bayesian Optimization</strong> duy trì một surrogate model
                f̂(θ) (thường là Gaussian Process hoặc Tree-structured Parzen Estimator),
                chọn trial tiếp theo bằng acquisition function:
              </p>

              <LaTeX block>
                {"\\theta_{\\text{next}} = \\arg\\max_\\theta \\alpha(\\theta \\mid \\mathcal{D}_{1:t})"}
              </LaTeX>

              <LaTeX block>
                {"\\text{EI}(\\theta) = \\mathbb{E}\\left[\\max(f(\\theta) - f^*, 0)\\right]"}
              </LaTeX>

              <p>
                Expected Improvement (EI) chọn điểm có kỳ vọng cải thiện lớn nhất so với
                best-so-far f*. UCB (Upper Confidence Bound) cân bằng exploration/
                exploitation qua một hệ số κ:
              </p>

              <LaTeX block>
                {"\\text{UCB}(\\theta) = \\mu(\\theta) + \\kappa \\cdot \\sigma(\\theta)"}
              </LaTeX>

              <Callout variant="tip" title="Thứ tự tune theo độ quan trọng">
                Learning rate có ảnh hưởng lớn nhất (có thể thay đổi accuracy 10×).
                Regularization (weight decay, dropout) quyết định generalization.
                Batch size ảnh hưởng cả generalization lẫn wall-clock. Kiến trúc (số
                layers, hidden dims) thường ít nhạy hơn một khi đã ở vùng đủ lớn.
                Tune theo thứ tự quan trọng và tune từng nhóm nhỏ một lúc.
              </Callout>

              <Callout variant="info" title="Đừng quên seed">
                Kết quả mỗi trial phụ thuộc vào random seed (init weights, data
                shuffle). Trong tuning nghiêm túc, mỗi config nên được chạy với 3 seed
                khác nhau và lấy trung bình — nếu không, bạn có thể đang tune cho
                &quot;may mắn&quot;.
              </Callout>

              <Callout variant="warning" title="Đừng tune trên test set">
                Hyperparameter tuning dùng <em>validation set</em>. Test set chỉ được
                chạm tới đúng MỘT LẦN để báo cáo final performance. Tune trên test =
                test leak = con số báo cáo lạc quan giả dối. Xem thêm{" "}
                <TopicLink slug="train-val-test">train/val/test split</TopicLink>.
              </Callout>

              <CodeBlock language="python" title="Bayesian HP Tuning với Optuna (sklearn)">
                {`import optuna
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split

# Load + split
data = load_breast_cancer()
X_train, X_val, y_train, y_val = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

def objective(trial: optuna.Trial) -> float:
    """Optuna đề xuất hyperparameters thông minh dựa trên lịch sử."""
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 50, 500),
        "max_depth": trial.suggest_int("max_depth", 3, 10),
        "learning_rate": trial.suggest_float(
            "learning_rate", 1e-3, 3e-1, log=True
        ),
        "subsample": trial.suggest_float("subsample", 0.5, 1.0),
        "min_samples_leaf": trial.suggest_int("min_samples_leaf", 1, 20),
    }

    model = GradientBoostingClassifier(random_state=42, **params)
    model.fit(X_train, y_train)

    # Optuna tối đa hoá validation accuracy
    return model.score(X_val, y_val)

# Bayesian Optimization với TPE sampler (mặc định của Optuna)
study = optuna.create_study(
    direction="maximize",
    sampler=optuna.samplers.TPESampler(seed=42),
    pruner=optuna.pruners.MedianPruner(n_warmup_steps=5),
)
study.optimize(objective, n_trials=50, n_jobs=4)

print(f"Best accuracy: {study.best_value:.4f}")
print(f"Best params: {study.best_params}")

# Thường tìm near-optimal trong 30-50 trials
# TPE giống Bayesian Opt: học từ trials trước qua Parzen estimator
`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="PyTorch sweep: learning rate + weight decay"
              >
                {`import optuna
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

def build_model(hidden: int, dropout: float) -> nn.Module:
    return nn.Sequential(
        nn.Linear(784, hidden),
        nn.ReLU(),
        nn.Dropout(dropout),
        nn.Linear(hidden, hidden),
        nn.ReLU(),
        nn.Dropout(dropout),
        nn.Linear(hidden, 10),
    )

def train_and_evaluate(
    trial: optuna.Trial,
    train_loader: DataLoader,
    val_loader: DataLoader,
    device: torch.device,
) -> float:
    lr = trial.suggest_float("lr", 1e-5, 1e-1, log=True)
    weight_decay = trial.suggest_float("weight_decay", 1e-6, 1e-2, log=True)
    hidden = trial.suggest_categorical("hidden", [128, 256, 512])
    dropout = trial.suggest_float("dropout", 0.0, 0.5)
    batch_size = trial.suggest_categorical("batch_size", [32, 64, 128, 256])

    model = build_model(hidden, dropout).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    loss_fn = nn.CrossEntropyLoss()

    for epoch in range(10):
        model.train()
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)
            optimizer.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward()
            optimizer.step()

        # Validation + pruning hook
        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for xb, yb in val_loader:
                xb, yb = xb.to(device), yb.to(device)
                pred = model(xb).argmax(dim=1)
                correct += (pred == yb).sum().item()
                total += yb.size(0)
        val_acc = correct / total

        # Báo cáo intermediate → Optuna có thể kill trial kém (ASHA/Median pruner)
        trial.report(val_acc, epoch)
        if trial.should_prune():
            raise optuna.TrialPruned()

    return val_acc

study = optuna.create_study(
    direction="maximize",
    pruner=optuna.pruners.HyperbandPruner(min_resource=1, max_resource=10),
)
study.optimize(
    lambda t: train_and_evaluate(t, train_loader, val_loader, device),
    n_trials=40,
)
`}
              </CodeBlock>

              <CollapsibleDetail title="Vì sao TPE (Tree-structured Parzen Estimator) phổ biến hơn GP trong Optuna?">
                <p>
                  Gaussian Process có scaling O(n³) theo số trials — chậm khi bạn chạy
                  hàng trăm trials. TPE thay vào đó mô hình hoá hai phân phối:
                  p(θ | y &lt; y*) (vùng tốt) và p(θ | y ≥ y*) (vùng tệ), rồi chọn θ
                  tối đa hoá tỷ lệ p_tốt / p_tệ. TPE scale tuyến tính theo trials, xử
                  lý tốt hỗn hợp liên tục / rời rạc / điều kiện, và là mặc định của
                  Optuna. Với &lt; 50 trials, chất lượng tương đương GP.
                </p>
                <p>
                  Khi nào dùng GP: trials cực kỳ đắt (fine-tune LLM vài giờ mỗi trial),
                  budget nhỏ (≤ 30 trials), không có nhiều hyperparameter điều kiện.
                  Lib: scikit-optimize, GPyOpt, BoTorch.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="ASHA, Hyperband & Successive Halving — pruning chiến lược">
                <p>
                  Trong deep learning, learning curve của một trial thường có thể dự
                  đoán sớm: nếu sau 3 epochs trial X đã kém bottom-half, khả năng cao
                  nó sẽ tiếp tục kém. Successive Halving tận dụng điều này: chạy n
                  trials với budget r, kill half tệ nhất, chạy n/2 trials còn lại với
                  budget 2r, lặp lại.
                </p>
                <p>
                  <strong>Hyperband</strong> chạy nhiều lượt Successive Halving với các
                  (n, r) khác nhau để hedge giữa &quot;nhiều trials ngắn&quot; và
                  &quot;ít trials dài&quot;. <strong>ASHA</strong> (Async Successive
                  Halving) là version song song: không cần synchronize tất cả trials
                  tại mỗi rung — trial nào xong rung là được xét promote/kill ngay. Lý
                  tưởng cho cluster.
                </p>
                <p>
                  Kết quả: throughput tăng 3–10× so với no-pruning. Combine với Bayesian
                  sampling (Optuna cho phép TPE + Hyperband) → state-of-the-art cho HP
                  tuning deep learning.
                </p>
              </CollapsibleDetail>

              <p>
                <strong>Search space design</strong> thường quan trọng hơn thuật toán
                tuning. Dưới đây là &quot;bảng sơ đồ&quot; khoảng giá trị hợp lý cho
                các hyperparameter phổ biến trong deep learning (image / text
                classification):
              </p>

              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <code className="px-1 rounded bg-surface">learning_rate</code>:
                  log-uniform [1e-5, 1e-1]. Với AdamW trên transformers, sweet spot
                  thường quanh [1e-5, 3e-4].
                </li>
                <li>
                  <code className="px-1 rounded bg-surface">weight_decay</code>:
                  log-uniform [1e-6, 1e-1]. Với vision transformers, thường 0.05–0.1.
                </li>
                <li>
                  <code className="px-1 rounded bg-surface">batch_size</code>:
                  categorical từ {"{32, 64, 128, 256, 512}"} (hoặc lũy thừa 2 tới tối
                  đa GPU memory cho phép).
                </li>
                <li>
                  <code className="px-1 rounded bg-surface">dropout</code>: uniform
                  [0.0, 0.5]. Bắt đầu 0.1 và tăng nếu overfitting.
                </li>
                <li>
                  <code className="px-1 rounded bg-surface">warmup_steps</code>: int
                  [0, 10% tổng steps]. Quan trọng cho training ổn định với transformers.
                </li>
                <li>
                  <code className="px-1 rounded bg-surface">label_smoothing</code>:
                  uniform [0.0, 0.2]. Regularization nhẹ cho classification.
                </li>
              </ul>

              <Callout variant="warning" title="Đừng tune mọi thứ cùng lúc">
                Search space càng lớn, &quot;curse of dimensionality&quot; càng nặng.
                Quy tắc: tune 3–5 hyperparameter quan trọng nhất trước, fix các HP còn
                lại ở default hợp lý. Sau khi có config tốt, tune nhóm HP thứ cấp nếu
                còn budget. Tune 10 HP cùng lúc thường tốn gấp đôi nhưng cải thiện chỉ
                ~1–2%.
              </Callout>

              <p>
                <strong>Tracking và reproducibility</strong> là phần quan trọng mà dễ
                bị bỏ qua. Mỗi trial nên log: hyperparameters, git commit hash, seed,
                learning curve, final metrics, model checkpoint. Công cụ: Weights &amp;
                Biases, MLflow, TensorBoard. Optuna có built-in visualization
                (parallel coordinate plot, parameter importance) giúp phát hiện HP nào
                thực sự quan trọng.
              </p>

              <p>
                Cuối cùng, đừng quên <strong>retrain trên full data</strong>. Khi
                tuning xong, merge train + validation, retrain một lần nữa với best
                config trên tập lớn hơn → final model. Test set vẫn chỉ chạm một lần
                sau đó để báo cáo.
              </p>

              <p>
                <strong>Multi-fidelity tuning</strong> là kỹ thuật tiên tiến dùng
                nhiều &quot;mức độ chi tiết&quot; khác nhau để đánh giá trials. Ví dụ
                với LLM fine-tuning: trial sơ bộ chạy trên 10% data, trial hứa hẹn
                được promote lên 100% data. BOHB (Bayesian Opt + HyperBand) là tổ hợp
                sampling thông minh với early-stopping đa mức. Ray Tune hỗ trợ BOHB
                sẵn, phù hợp cluster GPU lớn.
              </p>

              <p>
                Một pattern thực tế đáng giá: <strong>&quot;coarse-to-fine&quot;</strong>.
                Vòng 1 — random search 50 trials với range rộng, mỗi trial chạy 20%
                full training. Vòng 2 — Bayesian Opt 20 trials với range hẹp quanh top
                5 config từ vòng 1, chạy đầy đủ. Tổng budget: 50×0.2 + 20×1 = 30
                full-trial-equivalents, nhưng kết quả thường tốt hơn 50 trials full
                hoặc 100 trials random.
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Hyperparameters (lr, batch_size, dropout, weight_decay...) được ĐẶT TRƯỚC training. Parameters (weights) được mô hình HỌC. Tuning = tìm hyperparameters tốt.",
                "Grid Search bùng nổ tổ hợp (10^N). Random Search cùng budget thường tốt hơn vì coverage trên trục quan trọng cao hơn.",
                "Bayesian Optimization (Optuna / TPE) học từ trials trước và gợi ý thông minh — 3–5× hiệu quả hơn random với cùng budget.",
                "Thứ tự tune: learning rate → regularization → batch size → kiến trúc. Dùng log-uniform cho hyperparameters trải nhiều orders of magnitude.",
                "Early stopping (ASHA/Hyperband) kill trials kém sớm — tăng throughput 3–10×, đặc biệt quan trọng với deep learning.",
                "TUYỆT ĐỐI không tune trên test set. Validation set cho tuning, test set chạm một lần duy nhất để báo cáo final.",
              ]}
            />
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
