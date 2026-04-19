"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Scale,
  BarChart3,
  Repeat,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CollapsibleDetail,
  LessonSection,
  TopicLink,
  StepReveal,
  TabView,
  CodeBlock,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "model-evaluation-selection",
  title: "Model Evaluation & Selection",
  titleVi: "Đánh giá và chọn mô hình",
  description:
    "Bốn mô hình cùng giải một bài toán — ai thắng? Bạn kéo trọng số cho accuracy, precision, latency, rồi xem thứ hạng đổi theo thời gian thực.",
  category: "classic-ml",
  tags: ["evaluation", "model-selection", "metrics", "comparison"],
  difficulty: "beginner",
  relatedSlugs: [
    "confusion-matrix",
    "bias-variance",
    "cross-validation",
    "overfitting-underfitting",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU — 4 mô hình candidate cho cùng bài toán phát hiện gian
   lận. Các số được thiết kế để mỗi model "nổi" ở một trục khác
   nhau: không model nào thống trị mọi metric.
   ──────────────────────────────────────────────────────────── */

type ModelId = "logreg" | "rf" | "xgb" | "nn";

interface CandidateModel {
  id: ModelId;
  name: string;
  vi: string;
  color: string;
  accuracy: number; // 0-1
  precision: number;
  recall: number;
  f1: number;
  latencyMs: number; // inference latency, ms/1k
  trainMin: number; // training time minutes
  story: string;
}

const MODELS: CandidateModel[] = [
  {
    id: "logreg",
    name: "Logistic Regression",
    vi: "Hồi quy logistic",
    color: "#3b82f6",
    accuracy: 0.978,
    precision: 0.62,
    recall: 0.41,
    f1: 0.49,
    latencyMs: 0.8,
    trainMin: 2,
    story:
      "Siêu nhanh, dễ giải thích, accuracy cao ngất — nhưng chính accuracy cao đang đánh lừa bạn. Nó bỏ sót hơn nửa số ca gian lận.",
  },
  {
    id: "rf",
    name: "Random Forest",
    vi: "Rừng ngẫu nhiên",
    color: "#10b981",
    accuracy: 0.981,
    precision: 0.78,
    recall: 0.66,
    f1: 0.72,
    latencyMs: 4.2,
    trainMin: 18,
    story:
      "Cân bằng tốt giữa precision và recall. Train nhanh, nhưng inference chậm hơn logistic vì phải hỏi cả trăm cây.",
  },
  {
    id: "xgb",
    name: "XGBoost",
    vi: "XGBoost (gradient boosting)",
    color: "#a855f7",
    accuracy: 0.984,
    precision: 0.83,
    recall: 0.71,
    f1: 0.77,
    latencyMs: 2.1,
    trainMin: 35,
    story:
      "F1 cao nhất, inference nhanh, nhưng train lâu và cần tuning nhiều tham số. Ứng viên hàng đầu cho production.",
  },
  {
    id: "nn",
    name: "Neural Net (MLP)",
    vi: "Mạng nơ-ron (MLP)",
    color: "#f59e0b",
    accuracy: 0.979,
    precision: 0.74,
    recall: 0.75,
    f1: 0.74,
    latencyMs: 8.5,
    trainMin: 120,
    story:
      "Recall tốt nhất — bắt được nhiều ca gian lận nhất. Bù lại train lâu nhất và inference chậm nhất. Chọn nó khi chi phí bỏ sót cao.",
  },
];

type MetricKey =
  | "accuracy"
  | "precision"
  | "recall"
  | "f1"
  | "latencyMs"
  | "trainMin";

interface MetricSpec {
  key: MetricKey;
  label: string;
  hint: string;
  unit?: string;
  higherIsBetter: boolean;
  color: string;
}

const METRIC_SPECS: MetricSpec[] = [
  {
    key: "accuracy",
    label: "Accuracy",
    hint: "Tỉ lệ dự đoán đúng trên toàn bộ test set",
    higherIsBetter: true,
    color: "#64748b",
  },
  {
    key: "precision",
    label: "Precision",
    hint: "Trong các ca báo gian lận, bao nhiêu đúng là gian lận?",
    higherIsBetter: true,
    color: "#3b82f6",
  },
  {
    key: "recall",
    label: "Recall",
    hint: "Trong các ca gian lận thật, model bắt được bao nhiêu?",
    higherIsBetter: true,
    color: "#10b981",
  },
  {
    key: "f1",
    label: "F1",
    hint: "Trung bình điều hòa của precision và recall",
    higherIsBetter: true,
    color: "#a855f7",
  },
  {
    key: "latencyMs",
    label: "Latency",
    hint: "Thời gian chấm 1000 giao dịch (ms) — càng thấp càng tốt",
    unit: " ms",
    higherIsBetter: false,
    color: "#f59e0b",
  },
  {
    key: "trainMin",
    label: "Train time",
    hint: "Thời gian huấn luyện một lần (phút) — càng thấp càng tốt",
    unit: " ph",
    higherIsBetter: false,
    color: "#ef4444",
  },
];

/* ────────────────────────────────────────────────────────────
   HÀM TÍNH ĐIỂM TỔNG HỢP
   Mỗi metric được chuẩn hoá min-max trong số liệu 4 mô hình,
   nhân với weight do người học chọn, rồi cộng lại.
   ──────────────────────────────────────────────────────────── */

function normalizedScore(
  m: CandidateModel,
  spec: MetricSpec,
  all: CandidateModel[],
): number {
  const values = all.map((x) => x[spec.key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 1;
  const raw = (m[spec.key] - min) / (max - min);
  return spec.higherIsBetter ? raw : 1 - raw;
}

function totalScore(
  m: CandidateModel,
  weights: Record<MetricKey, number>,
): number {
  const sumWeights = METRIC_SPECS.reduce(
    (acc, s) => acc + weights[s.key],
    0,
  );
  if (sumWeights === 0) return 0;
  let total = 0;
  for (const spec of METRIC_SPECS) {
    total += weights[spec.key] * normalizedScore(m, spec, MODELS);
  }
  return total / sumWeights;
}

/* ────────────────────────────────────────────────────────────
   DASHBOARD COMPONENT
   ──────────────────────────────────────────────────────────── */

function ModelSelectionDashboard() {
  const [weights, setWeights] = useState<Record<MetricKey, number>>({
    accuracy: 1,
    precision: 2,
    recall: 2,
    f1: 3,
    latencyMs: 1,
    trainMin: 1,
  });

  const ranked = useMemo(() => {
    return [...MODELS]
      .map((m) => ({ model: m, score: totalScore(m, weights) }))
      .sort((a, b) => b.score - a.score);
  }, [weights]);

  const winner = ranked[0];

  return (
    <div className="space-y-4">
      {/* Scoring weights */}
      <div className="rounded-xl border border-border bg-surface/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Scale size={16} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">
            Trọng số cho mỗi metric — kéo để ưu tiên điều bạn quan tâm
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {METRIC_SPECS.map((spec) => (
            <div
              key={spec.key}
              className="rounded-lg border border-border bg-card p-2.5"
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-semibold"
                  style={{ color: spec.color }}
                >
                  {spec.label}
                </span>
                <span className="text-[11px] tabular-nums text-muted">
                  w = {weights[spec.key]}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={weights[spec.key]}
                onChange={(e) =>
                  setWeights((prev) => ({
                    ...prev,
                    [spec.key]: Number(e.target.value),
                  }))
                }
                aria-label={`Weight ${spec.label}`}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${spec.color}aa 0%, ${spec.color}aa ${
                    (weights[spec.key] / 5) * 100
                  }%, var(--bg-surface) ${
                    (weights[spec.key] / 5) * 100
                  }%, var(--bg-surface) 100%)`,
                }}
              />
              <p className="text-[10px] text-muted leading-snug mt-1">
                {spec.hint}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking */}
      <div className="space-y-2">
        {ranked.map((row, rank) => {
          const { model, score } = row;
          const isTop = rank === 0;
          return (
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              key={model.id}
              className="rounded-xl border-2 bg-card p-4"
              style={{
                borderColor: isTop ? model.color : "var(--border)",
                boxShadow: isTop
                  ? `0 0 0 4px ${model.color}20`
                  : "none",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: model.color + "22",
                    color: model.color,
                  }}
                >
                  {rank + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: model.color }}
                    >
                      {model.vi}
                    </span>
                    {isTop && (
                      <Trophy size={14} className="text-amber-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted leading-snug mt-0.5">
                    {model.story}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Score</div>
                  <div
                    className="text-lg font-bold tabular-nums"
                    style={{ color: model.color }}
                  >
                    {score.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Metric bars */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {METRIC_SPECS.map((spec) => {
                  const value = model[spec.key];
                  const norm = normalizedScore(model, spec, MODELS);
                  return (
                    <div key={spec.key} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-muted">
                        <span>{spec.label}</span>
                        <span className="tabular-nums">
                          {spec.key === "accuracy" ||
                          spec.key === "precision" ||
                          spec.key === "recall" ||
                          spec.key === "f1"
                            ? value.toFixed(2)
                            : value + (spec.unit ?? "")}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-surface overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${norm * 100}%`,
                            backgroundColor: spec.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-xl border border-accent/30 bg-accent-light p-3">
        <div className="flex items-center gap-2 text-sm">
          <Target size={14} className="text-accent" />
          <span className="font-semibold text-accent-dark">
            Kết luận cho bộ trọng số hiện tại:
          </span>
          <span className="text-foreground">
            <strong style={{ color: winner.model.color }}>
              {winner.model.vi}
            </strong>{" "}
            đứng đầu. Thay đổi trọng số phía trên, thứ hạng sẽ đổi ngay.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   CONFUSION MATRIX VISUAL — dùng cho tab "Classification"
   ──────────────────────────────────────────────────────────── */

function ConfusionVisual() {
  const [threshold, setThreshold] = useState(0.5);

  // Giả lập 80 mẫu test. Xác suất thật ngầm; cutoff threshold tạo ra
  // TP/FP/FN/TN động theo threshold.
  const samples = useMemo(() => {
    const rng = (() => {
      let s = 42;
      return () => {
        s = (1103515245 * s + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    })();
    const arr: { score: number; actual: 0 | 1 }[] = [];
    for (let i = 0; i < 80; i++) {
      const actual = rng() < 0.3 ? 1 : 0;
      const score = actual
        ? Math.min(1, 0.4 + rng() * 0.5)
        : Math.max(0, rng() * 0.6);
      arr.push({ score, actual });
    }
    return arr;
  }, []);

  let tp = 0,
    fp = 0,
    fn = 0,
    tn = 0;
  for (const s of samples) {
    const pred = s.score >= threshold ? 1 : 0;
    if (pred === 1 && s.actual === 1) tp++;
    else if (pred === 1 && s.actual === 0) fp++;
    else if (pred === 0 && s.actual === 1) fn++;
    else tn++;
  }
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted leading-relaxed">
        Kéo ngưỡng (threshold) để thấy confusion matrix đổi ra sao. Threshold
        thấp: bắt nhiều gian lận (recall cao) nhưng báo động giả nhiều
        (precision thấp). Threshold cao: ngược lại.
      </p>

      <input
        type="range"
        min={0.1}
        max={0.9}
        step={0.01}
        value={threshold}
        onChange={(e) => setThreshold(Number(e.target.value))}
        aria-label="Decision threshold"
        className="w-full h-2 rounded-full cursor-pointer accent-accent"
      />
      <div className="text-center text-xs text-muted tabular-nums">
        Ngưỡng quyết định = {threshold.toFixed(2)}
      </div>

      <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
        <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
          <div className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-semibold">
            TP — đúng
          </div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {tp}
          </div>
        </div>
        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
          <div className="text-[10px] uppercase text-amber-700 dark:text-amber-400 font-semibold">
            FP — báo giả
          </div>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
            {fp}
          </div>
        </div>
        <div className="rounded-lg border-2 border-red-400 bg-red-50 dark:bg-red-900/20 p-3 text-center">
          <div className="text-[10px] uppercase text-red-700 dark:text-red-400 font-semibold">
            FN — bỏ sót
          </div>
          <div className="text-xl font-bold text-red-700 dark:text-red-400 tabular-nums">
            {fn}
          </div>
        </div>
        <div className="rounded-lg border-2 border-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 text-center">
          <div className="text-[10px] uppercase text-slate-700 dark:text-slate-300 font-semibold">
            TN — đúng âm
          </div>
          <div className="text-xl font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            {tn}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-around text-xs pt-2">
        <div className="text-center">
          <div className="text-muted">Precision</div>
          <div className="font-bold text-blue-600 tabular-nums">
            {precision.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted">Recall</div>
          <div className="font-bold text-emerald-600 tabular-nums">
            {recall.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted">F1</div>
          <div className="font-bold text-purple-600 tabular-nums">
            {f1.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   REGRESSION METRICS VISUAL — scatter predicted vs actual + bar RMSE/MAE
   ──────────────────────────────────────────────────────────── */

function RegressionVisual() {
  const [noise, setNoise] = useState(0.4);

  const points = useMemo(() => {
    const arr: { actual: number; pred: number }[] = [];
    for (let i = 0; i < 50; i++) {
      const a = (i / 49) * 10;
      const n = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * noise;
      arr.push({ actual: a, pred: a + n });
    }
    return arr;
  }, [noise]);

  const mse =
    points.reduce((s, p) => s + (p.pred - p.actual) ** 2, 0) / points.length;
  const rmse = Math.sqrt(mse);
  const mae =
    points.reduce((s, p) => s + Math.abs(p.pred - p.actual), 0) / points.length;
  const meanActual = points.reduce((s, p) => s + p.actual, 0) / points.length;
  const ssTot = points.reduce(
    (s, p) => s + (p.actual - meanActual) ** 2,
    0,
  );
  const ssRes = points.reduce((s, p) => s + (p.pred - p.actual) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted leading-relaxed">
        Kéo nhiễu (noise) để thấy RMSE, MAE, R² đổi ra sao. Scatter bám đường
        chéo = model tốt.
      </p>
      <input
        type="range"
        min={0.05}
        max={1.5}
        step={0.05}
        value={noise}
        onChange={(e) => setNoise(Number(e.target.value))}
        aria-label="Regression noise"
        className="w-full h-2 rounded-full cursor-pointer accent-accent"
      />
      <svg viewBox="0 0 260 200" className="w-full max-w-sm mx-auto">
        {/* Grid */}
        {[0, 2.5, 5, 7.5, 10].map((v) => (
          <g key={v}>
            <line
              x1={30 + (v / 10) * 220}
              y1={10}
              x2={30 + (v / 10) * 220}
              y2={180}
              stroke="var(--border)"
              strokeWidth={0.4}
              strokeDasharray="2,3"
            />
            <line
              x1={30}
              y1={10 + (1 - v / 10) * 170}
              x2={250}
              y2={10 + (1 - v / 10) * 170}
              stroke="var(--border)"
              strokeWidth={0.4}
              strokeDasharray="2,3"
            />
          </g>
        ))}
        {/* Diagonal */}
        <line
          x1={30}
          y1={180}
          x2={250}
          y2={10}
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="4,3"
        />
        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={30 + (p.actual / 10) * 220}
            cy={10 + (1 - p.pred / 10) * 170}
            r={2.4}
            fill="#a855f7"
            opacity={0.75}
          />
        ))}
        <text
          x={140}
          y={195}
          fontSize={9}
          fill="var(--text-muted)"
          textAnchor="middle"
        >
          Giá trị thực tế
        </text>
      </svg>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-surface p-2">
          <div className="text-[10px] text-muted uppercase">RMSE</div>
          <div className="font-bold text-blue-600 tabular-nums text-sm">
            {rmse.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg bg-surface p-2">
          <div className="text-[10px] text-muted uppercase">MAE</div>
          <div className="font-bold text-emerald-600 tabular-nums text-sm">
            {mae.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg bg-surface p-2">
          <div className="text-[10px] text-muted uppercase">R²</div>
          <div className="font-bold text-purple-600 tabular-nums text-sm">
            {r2.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   RANKING METRIC VISUAL — NDCG/MAP: thứ tự kết quả
   ──────────────────────────────────────────────────────────── */

function RankingVisual() {
  const [ordering, setOrdering] = useState<"good" | "bad">("good");

  const relevance: Record<"good" | "bad", number[]> = {
    good: [3, 3, 2, 2, 1, 0, 0, 0, 0, 0],
    bad: [0, 0, 1, 2, 3, 0, 2, 3, 0, 0],
  };

  function dcg(rels: number[]): number {
    return rels.reduce(
      (s, r, i) => s + (Math.pow(2, r) - 1) / Math.log2(i + 2),
      0,
    );
  }
  const idealRels = [...relevance.good].sort((a, b) => b - a);
  const ndcg = dcg(relevance[ordering]) / dcg(idealRels);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted leading-relaxed">
        Trong các hệ thống gợi ý, Google Search, Shopee tìm kiếm — thứ tự kết
        quả mới là thứ quan trọng, không phải đúng/sai đơn thuần. NDCG thưởng
        model đặt kết quả hay lên đầu.
      </p>
      <div className="flex gap-2 justify-center">
        {(["good", "bad"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setOrdering(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              ordering === key
                ? "bg-accent text-white border-accent"
                : "border-border text-muted bg-card hover:bg-surface"
            }`}
          >
            {key === "good" ? "Sắp xếp tốt" : "Sắp xếp kém"}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {relevance[ordering].map((rel, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5"
          >
            <span className="shrink-0 w-6 text-xs font-mono text-muted">
              #{i + 1}
            </span>
            <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(rel / 3) * 100}%`,
                  backgroundColor:
                    rel === 3
                      ? "#10b981"
                      : rel === 2
                        ? "#3b82f6"
                        : rel === 1
                          ? "#f59e0b"
                          : "#94a3b8",
                }}
              />
            </div>
            <span className="shrink-0 w-10 text-right text-xs tabular-nums font-mono text-muted">
              rel {rel}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center rounded-lg bg-surface p-3">
        <div className="text-xs text-muted uppercase">NDCG@10</div>
        <div className="text-2xl font-bold text-accent tabular-nums">
          {ndcg.toFixed(3)}
        </div>
        <div className="text-[10px] text-muted mt-1">
          {ordering === "good"
            ? "Kết quả liên quan nhất ở top → NDCG gần 1"
            : "Kết quả tốt bị đẩy xuống → NDCG giảm mạnh"}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   CALIBRATION VISUAL — reliability diagram
   ──────────────────────────────────────────────────────────── */

function CalibrationVisual() {
  const [mode, setMode] = useState<"good" | "over" | "under">("good");

  const buckets = useMemo(() => {
    const arr: { pred: number; actual: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const p = (i + 0.5) / 10;
      let a: number;
      if (mode === "good") a = p + (Math.sin(i * 1.1) * 0.02);
      else if (mode === "over") a = Math.max(0, p * 0.65);
      else a = Math.min(1, p * 1.25 + 0.05);
      arr.push({ pred: p, actual: a });
    }
    return arr;
  }, [mode]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted leading-relaxed">
        Calibration hỏi: khi model nói &ldquo;70% chắc là gian lận&rdquo;, thực
        tế có đúng 70% ca trong nhóm đó là gian lận không? Đường chéo = hoàn
        hảo.
      </p>
      <div className="flex gap-1.5 justify-center">
        {(["good", "over", "under"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              mode === key
                ? "bg-accent text-white border-accent"
                : "border-border text-muted bg-card hover:bg-surface"
            }`}
          >
            {key === "good"
              ? "Hiệu chuẩn tốt"
              : key === "over"
                ? "Quá tự tin"
                : "Thiếu tự tin"}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 240 200" className="w-full max-w-sm mx-auto">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1={30 + v * 190}
              y1={10}
              x2={30 + v * 190}
              y2={180}
              stroke="var(--border)"
              strokeWidth={0.4}
              strokeDasharray="2,3"
            />
            <text
              x={30 + v * 190}
              y={195}
              fontSize={8}
              fill="var(--text-muted)"
              textAnchor="middle"
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        <line
          x1={30}
          y1={180}
          x2={220}
          y2={10}
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="4,3"
        />
        <polyline
          fill="none"
          stroke="#a855f7"
          strokeWidth={2}
          points={buckets
            .map(
              (b) => `${30 + b.pred * 190},${10 + (1 - b.actual) * 170}`,
            )
            .join(" ")}
        />
        {buckets.map((b, i) => (
          <circle
            key={i}
            cx={30 + b.pred * 190}
            cy={10 + (1 - b.actual) * 170}
            r={3}
            fill="#a855f7"
          />
        ))}
      </svg>
      <div className="text-[11px] text-center text-muted italic">
        Trục X: xác suất model dự đoán — Trục Y: tỉ lệ thực tế đúng
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   ROC-AUC VISUAL — dùng trong ExplanationSection
   ──────────────────────────────────────────────────────────── */

function RocAucChart() {
  // Hard-coded curves for 3 models: good, mid, bad
  const curves = [
    {
      label: "XGBoost (AUC 0.96)",
      color: "#a855f7",
      pts: [
        [0, 0],
        [0.02, 0.4],
        [0.05, 0.7],
        [0.1, 0.85],
        [0.25, 0.94],
        [0.5, 0.98],
        [1, 1],
      ] as [number, number][],
    },
    {
      label: "Random Forest (AUC 0.87)",
      color: "#10b981",
      pts: [
        [0, 0],
        [0.05, 0.3],
        [0.15, 0.6],
        [0.3, 0.82],
        [0.5, 0.93],
        [0.75, 0.98],
        [1, 1],
      ] as [number, number][],
    },
    {
      label: "Random guess (AUC 0.50)",
      color: "#94a3b8",
      pts: [
        [0, 0],
        [1, 1],
      ] as [number, number][],
    },
  ];
  return (
    <svg viewBox="0 0 280 220" className="w-full max-w-md mx-auto">
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line
            x1={30 + v * 230}
            y1={10}
            x2={30 + v * 230}
            y2={190}
            stroke="var(--border)"
            strokeWidth={0.4}
            strokeDasharray="2,3"
          />
          <text
            x={30 + v * 230}
            y={205}
            fontSize={8}
            fill="var(--text-muted)"
            textAnchor="middle"
          >
            {v}
          </text>
          <line
            x1={30}
            y1={10 + (1 - v) * 180}
            x2={260}
            y2={10 + (1 - v) * 180}
            stroke="var(--border)"
            strokeWidth={0.4}
            strokeDasharray="2,3"
          />
        </g>
      ))}
      {curves.map((c) => (
        <g key={c.label}>
          <polyline
            fill="none"
            stroke={c.color}
            strokeWidth={2}
            points={c.pts
              .map((p) => `${30 + p[0] * 230},${10 + (1 - p[1]) * 180}`)
              .join(" ")}
          />
        </g>
      ))}
      {/* Legend */}
      {curves.map((c, i) => (
        <g key={c.label} transform={`translate(40, ${25 + i * 16})`}>
          <rect width={10} height={3} y={3} fill={c.color} rx={1} />
          <text x={16} y={8} fontSize={9} fill="var(--text-primary)">
            {c.label}
          </text>
        </g>
      ))}
      <text
        x={140}
        y={218}
        fontSize={9}
        fill="var(--text-muted)"
        textAnchor="middle"
      >
        False Positive Rate
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   DECISION TREE VISUAL — metric by problem type
   ──────────────────────────────────────────────────────────── */

function MetricDecisionTree() {
  const nodes: {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    label: string;
    metrics?: string;
    weight?: number;
  }[] = [
    { x: 230, y: 10, w: 160, h: 34, color: "#6366f1", label: "Loại bài toán?", weight: 600 },
    { x: 40, y: 90, w: 180, h: 34, color: "#22c55e", label: "Classification", weight: 600 },
    { x: 400, y: 90, w: 180, h: 34, color: "#f59e0b", label: "Regression / Ranking", weight: 600 },
    { x: 10, y: 170, w: 140, h: 34, color: "#22c55e", label: "Cân bằng", metrics: "Accuracy, AUC" },
    { x: 160, y: 170, w: 140, h: 34, color: "#ef4444", label: "Mất cân bằng", metrics: "F1, AP, MCC" },
    { x: 330, y: 170, w: 140, h: 34, color: "#f59e0b", label: "Regression", metrics: "RMSE, MAE, R²" },
    { x: 510, y: 170, w: 140, h: 34, color: "#a855f7", label: "Ranking", metrics: "NDCG, MAP" },
  ];
  const edges: [number, number, number, number][] = [
    [260, 44, 130, 90],
    [360, 44, 490, 90],
    [80, 124, 50, 170],
    [180, 124, 210, 170],
    [440, 124, 400, 170],
    [550, 124, 580, 170],
  ];
  return (
    <svg viewBox="0 0 620 260" className="w-full">
      {edges.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#475569"
          strokeWidth={1}
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <rect
            x={n.x}
            y={n.y}
            width={n.w}
            height={n.h}
            rx={8}
            fill={n.color}
            fillOpacity={n.weight ? 0.15 : 0.1}
            stroke={n.color}
          />
          <text
            x={n.x + n.w / 2}
            y={n.y + (n.metrics ? 14 : 22)}
            textAnchor="middle"
            fontSize={n.metrics ? 9 : 11}
            fill={n.color}
            fontWeight={n.weight ?? 700}
          >
            {n.label}
          </text>
          {n.metrics && (
            <text
              x={n.x + n.w / 2}
              y={n.y + 27}
              textAnchor="middle"
              fontSize={9}
              fill={n.color}
            >
              {n.metrics}
            </text>
          )}
        </g>
      ))}
      <text
        x={310}
        y={245}
        textAnchor="middle"
        fontSize={10}
        fill="var(--text-muted)"
      >
        Bonus: luôn báo thêm confidence interval từ cross-validation
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Bạn có 4 model dự đoán gian lận. Tất cả đều đạt accuracy 98%. Nên nhìn vào đâu tiếp theo?",
    options: [
      "Chọn đại model đầu tiên — đằng nào cũng giống nhau",
      "Precision, Recall, F1 — vì với dữ liệu mất cân bằng, accuracy cao không nói lên điều gì",
      "Chọn model có tên hay nhất",
      "Chờ thu thêm dữ liệu",
    ],
    correct: 1,
    explanation:
      "Với 2% gian lận trong tổng số giao dịch, một model luôn đoán 'không gian lận' cũng đạt 98%. Accuracy 98% là con số rỗng. Cần xem precision/recall/F1 để biết model thực sự bắt được gian lận hay chỉ đoán mặc định lớp đa số.",
  },
  {
    question:
      "Model A: ROC AUC = 0.95, Accuracy = 55%. Giải thích hợp lý nhất?",
    options: [
      "Có lỗi trong tính toán",
      "Model xếp hạng tốt (AUC cao) nhưng threshold mặc định đang sai — precision/recall bị lệch",
      "AUC luôn bằng accuracy",
      "Dữ liệu bị leak",
    ],
    correct: 1,
    explanation:
      "AUC đo khả năng xếp hạng — model có tách được dương và âm hay không. Accuracy phụ thuộc vào một threshold cụ thể. Model có thể xếp hạng tuyệt vời nhưng threshold 0.5 rơi vào vùng hầu hết điểm score nằm cùng phía → accuracy sập. Giải pháp: calibrate hoặc chọn threshold theo precision-recall mong muốn.",
  },
  {
    question:
      "Cross-validation 5-fold giúp gì khi so sánh hai model có F1 tương đương nhau?",
    options: [
      "Tăng tốc độ training",
      "Ước lượng F1 trên nhiều tập validation — nếu F1 trung bình ± std không overlap, model A ổn định hơn model B",
      "Tự động tinh chỉnh hyperparameter",
      "Giảm kích thước dữ liệu",
    ],
    correct: 1,
    explanation:
      "Cross-validation đưa ra phân phối hiệu suất chứ không phải một con số. Khi so sánh, nếu F1(A) = 0.82 ± 0.01 còn F1(B) = 0.81 ± 0.08, model A đáng tin cậy hơn dù trung bình gần nhau. Đây là lý do luôn báo cáo cả mean và std khi chọn model.",
  },
  {
    type: "fill-blank",
    question:
      "Metric cân bằng precision và recall bằng trung bình điều hòa gọi là {blank}.",
    blanks: [
      {
        answer: "F1",
        accept: ["F1-Score", "F1 score", "F1-score", "f1", "f1-score"],
      },
    ],
    explanation:
      "F1 = 2·P·R/(P+R). Khác trung bình cộng ở chỗ F1 phạt nặng khi một trong hai yếu tố thấp — phù hợp với dữ liệu mất cân bằng vì không cho phép đánh đổi cực đoan.",
  },
  {
    question:
      "Latency của model XGBoost = 2ms/yêu cầu, Neural Net = 8ms/yêu cầu. Trang web cần phản hồi trong 100ms, trung bình mỗi request cần gọi 5 lần. Chọn gì?",
    options: [
      "Neural Net — vì học sâu hơn",
      "XGBoost — vì 2ms × 5 = 10ms, còn nhiều ngân sách. Neural Net 40ms chiếm gần nửa budget",
      "Cả hai như nhau",
      "Không cần quan tâm latency",
    ],
    correct: 1,
    explanation:
      "Ở production, latency nhân lên theo số lần gọi. XGBoost cho phép bạn cộng thêm logic khác (feature fetch, validation) mà vẫn dưới 100ms. Neural Net ngay từ đầu đã ăn 40% budget — rủi ro timeout khi tải tăng. Latency luôn phải nằm trong bảng so sánh cùng với F1.",
  },
];

/* ═══════════════════════ MAIN ═══════════════════════ */

export default function ModelEvaluationSelectionTopic() {
  return (
    <>
      {/* STEP 1 — HOOK */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="5 model candidate cùng dự đoán gian lận thẻ. Model A accuracy 98,4%, Model B accuracy 97,9%. A thắng? "
          options={[
            "Đúng — accuracy cao hơn là tốt hơn",
            "Chưa chắc — cần xem model nào bắt được nhiều ca gian lận thật, latency bao nhiêu, và trade-off với false alarm",
            "Không quan trọng, chọn model nào cũng được",
            "Chờ dữ liệu thêm",
          ]}
          correct={1}
          explanation="Với dữ liệu 98% không gian lận, một model luôn đoán 'không gian lận' cũng đạt 98% accuracy. Câu hỏi 'chọn model nào' không bao giờ có một con số trả lời — mà là một quy trình: xác định metric quan trọng, cân nhắc trade-off, đo nhiều lần với cross-validation, rồi so sánh. Bài này dạy bạn quy trình đó."
        >
          <div className="mt-4 rounded-xl border border-accent/30 bg-accent-light p-4">
            <div className="flex items-start gap-3">
              <Trophy className="text-accent shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-foreground/90 leading-relaxed">
                Hãy tưởng tượng bạn đang duyệt 5 ứng viên CV cho cùng một vị
                trí. Ai cũng có điểm mạnh riêng — người nhanh, người cẩn thận,
                người rẻ. Bạn không chọn được trước khi biết <em>công ty cần
                gì nhất</em>. Model selection cũng vậy: không có model &ldquo;tốt
                nhất&rdquo;, chỉ có model phù hợp nhất cho một bộ yêu cầu cụ
                thể.
              </p>
            </div>
          </div>
        </PredictionGate>
      </LessonSection>

      {/* STEP 2 — REVEAL: dashboard tương tác */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-3 mb-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={18} className="text-accent" /> 4 model đã huấn
              luyện — chọn cái nào?
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Bốn model dưới đây đã chạy xong trên cùng tập dữ liệu phát hiện
              gian lận. Con số của chúng được thiết kế để không model nào
              thống trị: mỗi model mạnh ở một trục khác nhau. Bạn kéo trọng số
              cho từng metric — dashboard sẽ sắp xếp lại thứ hạng ngay tức khắc.
              Hãy thử:
            </p>
            <ul className="text-xs text-muted space-y-1 pl-4 list-disc">
              <li>Chỉ quan tâm accuracy → ai lên đầu?</li>
              <li>Tăng weight recall (sợ bỏ sót gian lận) → thứ tự đổi ra sao?</li>
              <li>Cần latency thấp cho thanh toán realtime → ai rơi xuống?</li>
            </ul>
          </div>
          <ModelSelectionDashboard />
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3 — DEEPEN: TabView 4 nhóm metric */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Đào sâu">
        <p className="text-sm text-muted leading-relaxed mb-4">
          Metrics không phải một loại. Mỗi bài toán có nhóm metrics riêng.
          Bấm qua 4 tab dưới để thấy visual + một đoạn code sklearn nhỏ cho
          mỗi nhóm.
        </p>

        <TabView
          tabs={[
            {
              label: "Classification",
              content: (
                <div className="space-y-4">
                  <ConfusionVisual />
                  <CodeBlock
                    language="python"
                    title="classification_metrics.py"
                  >
                    {`from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
)
# y_true: nhãn thật, y_pred: dự đoán (0/1), y_proba: xác suất
print("Precision:", precision_score(y_true, y_pred))
print("Recall:   ", recall_score(y_true, y_pred))
print("F1:       ", f1_score(y_true, y_pred))
print("ROC AUC:  ", roc_auc_score(y_true, y_proba))`}
                  </CodeBlock>
                </div>
              ),
            },
            {
              label: "Regression",
              content: (
                <div className="space-y-4">
                  <RegressionVisual />
                  <CodeBlock language="python" title="regression_metrics.py">
                    {`from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score,
)
import numpy as np
# y_true, y_pred là mảng số thực
rmse = np.sqrt(mean_squared_error(y_true, y_pred))
mae = mean_absolute_error(y_true, y_pred)
r2 = r2_score(y_true, y_pred)
print(f"RMSE={rmse:.3f}  MAE={mae:.3f}  R2={r2:.3f}")`}
                  </CodeBlock>
                </div>
              ),
            },
            {
              label: "Ranking",
              content: (
                <div className="space-y-4">
                  <RankingVisual />
                  <CodeBlock language="python" title="ranking_metrics.py">
                    {`from sklearn.metrics import ndcg_score, average_precision_score
import numpy as np
# y_true: relevance (0..3), y_score: điểm model đưa ra
y_true = np.array([[3, 3, 2, 2, 1, 0, 0, 0, 0, 0]])
y_score = np.array([[0.9, 0.8, 0.7, 0.65, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05]])
print("NDCG@10:", ndcg_score(y_true, y_score))
print("MAP:   ", average_precision_score((y_true > 0).astype(int), y_score))`}
                  </CodeBlock>
                </div>
              ),
            },
            {
              label: "Calibration",
              content: (
                <div className="space-y-4">
                  <CalibrationVisual />
                  <CodeBlock language="python" title="calibration_check.py">
                    {`from sklearn.calibration import calibration_curve
import matplotlib.pyplot as plt
# y_proba là xác suất dương model sinh ra
prob_true, prob_pred = calibration_curve(y_true, y_proba, n_bins=10)
plt.plot([0, 1], [0, 1], "--", label="Hoàn hảo")
plt.plot(prob_pred, prob_true, "o-", label="Model")
plt.xlabel("Xác suất dự đoán")
plt.ylabel("Tần suất thực tế")
plt.legend(); plt.show()`}
                  </CodeBlock>
                </div>
              ),
            },
          ]}
        />
      </LessonSection>

      {/* STEP 4 — AHA */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc hiểu">
        <AhaMoment>
          <p>
            Chọn model không phải tìm <strong>&ldquo;model tốt nhất&rdquo;</strong>{" "}
            — mà là <strong>biên soạn một bộ yêu cầu</strong> rồi tìm model
            thoả mãn nó.
          </p>
          <p className="mt-3">
            Bộ yêu cầu thường gồm: <em>metric chính</em> (tuỳ bài toán),{" "}
            <em>ràng buộc thời gian</em> (train, inference), <em>khả năng giải
            thích</em> (cho khách hàng, quy định), và <em>chi phí</em> (tính
            toán, bảo trì). Khi bạn đã viết bộ yêu cầu, model trả lời gần như
            hiện ra.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 5 — CHALLENGE */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Model X được quảng cáo: ROC AUC = 0,95. Bạn triển khai thử — accuracy chỉ 55%. Chuyện gì xảy ra?"
          options={[
            "Có bug trong code — phải có ít nhất 95% accuracy",
            "Model xếp hạng (ranking) tốt nhưng threshold mặc định đang sai — điểm score của đa số mẫu rơi về cùng một phía của threshold",
            "AUC tính sai",
            "Phải đổi sang model khác ngay",
          ]}
          correct={1}
          explanation="AUC = 0,95 nghĩa là nếu bạn xếp hạng tất cả mẫu theo score model, dương và âm tách rõ. Nhưng accuracy phụ thuộc vào một threshold. Ví dụ: nếu phần lớn score nằm ở vùng 0,55-0,95, threshold mặc định 0,5 sẽ gắn tất cả vào dương — accuracy sập. Cách xử lý: (1) calibrate probability, (2) chọn threshold theo nhu cầu precision/recall, hoặc (3) dùng ngưỡng tối ưu F1 từ precision-recall curve."
        />
      </LessonSection>

      {/* STEP 6 — EXPLAIN */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Đánh giá và chọn mô hình đi theo vòng lặp 4 bước:{" "}
            <em>huấn luyện → dự đoán → đo lường → so sánh</em>. Mỗi vòng lặp
            cho bạn thêm hiểu biết để tinh chỉnh: đổi hyperparameter, thêm
            feature, hoặc chuyển hẳn sang model khác.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-4">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Repeat size={16} className="text-accent" /> Quy trình 5 bước so
              sánh model khoa học
            </h4>
            <StepReveal
              labels={[
                "1. Viết bộ yêu cầu",
                "2. Chọn metric chính",
                "3. Chạy baseline",
                "4. Cross-validation",
                "5. Chọn — và giải thích",
              ]}
            >
              {[
                <div
                  key="s1"
                  className="rounded-lg bg-card border border-border p-4"
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    Trước khi mở editor, hãy viết ra giấy: bài toán là
                    classification hay regression? Dữ liệu cân bằng không?
                    Latency giới hạn bao nhiêu? Chi phí sai âm (bỏ sót) vs sai
                    dương (báo giả) khác nhau ra sao? Bộ yêu cầu này là la
                    bàn — mọi quyết định sau đó đều nhìn nó.
                  </p>
                </div>,
                <div
                  key="s2"
                  className="rounded-lg bg-card border border-border p-4"
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    Chọn <strong>một</strong> metric làm &ldquo;điểm chính&rdquo;
                    (primary metric) và 2-3 metric phụ. Ví dụ: gian lận →
                    primary F1, phụ precision (giữ trust), latency (UX).
                    Không bao giờ tối ưu 6 metric cùng lúc — sẽ tê liệt.
                  </p>
                </div>,
                <div
                  key="s3"
                  className="rounded-lg bg-card border border-border p-4"
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    Chạy <strong>baseline đơn giản</strong> trước: logistic
                    regression hoặc majority-class. Đây là &ldquo;sàn&rdquo;
                    để mọi model phức tạp phải vượt qua. Nếu neural net 100M
                    tham số chỉ nhỉnh hơn logistic 0,5% F1 — có thật sự đáng
                    deploy?
                  </p>
                </div>,
                <div
                  key="s4"
                  className="rounded-lg bg-card border border-border p-4"
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    Dùng <TopicLink slug="cross-validation">cross-validation</TopicLink>{" "}
                    5-fold (hoặc stratified cho imbalanced) để đánh giá. Báo
                    cáo <em>trung bình ± độ lệch chuẩn</em>, không chỉ một con
                    số. Model A = 0,82 ± 0,01 đáng tin hơn Model B = 0,83 ±
                    0,08 dù trung bình thấp hơn.
                  </p>
                </div>,
                <div
                  key="s5"
                  className="rounded-lg bg-card border border-border p-4"
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    Ghi lại lý do chọn: &ldquo;chọn XGBoost vì F1=0,77 (± 0,01),
                    latency 2ms/yêu cầu, train time chấp nhận được, dễ giải
                    thích qua feature importance cho bộ phận compliance&rdquo;.
                    Khi stakeholder hỏi, bạn đã có câu trả lời.
                  </p>
                </div>,
              ]}
            </StepReveal>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            ROC AUC — công thức một dòng, ý nghĩa một đời
          </h4>
          <p className="text-sm text-foreground/85 leading-relaxed">
            ROC AUC là xác suất model đưa ra score cao hơn cho một mẫu dương
            ngẫu nhiên so với một mẫu âm ngẫu nhiên:
          </p>
          <LaTeX block>
            {
              "\\text{ROC AUC} = P\\big(\\hat{s}(x^+) > \\hat{s}(x^-)\\big)"
            }
          </LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Nói ngắn gọn: đưa model hai giao dịch — một gian lận thật, một
            bình thường. AUC = 0,95 nghĩa là 95% số lần model xếp giao dịch
            gian lận có score cao hơn. AUC 0,50 = đoán mò. AUC 1,0 = hoàn
            hảo. Biểu đồ dưới cho 3 mức AUC:
          </p>
          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <RocAucChart />
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Average Precision (AP) — bạn bè thân thiết của AUC cho dữ liệu mất
            cân bằng
          </h4>
          <LaTeX block>
            {
              "\\text{AP} = \\sum_{k=1}^{n} (R_k - R_{k-1}) \\cdot P_k"
            }
          </LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            AP là diện tích dưới precision-recall curve. Khi gian lận chỉ
            chiếm 1% dữ liệu, AUC có thể cao giả tạo (vì TN rất nhiều). AP
            nhìn trực tiếp vào đường precision-recall — phản ánh thực chất
            hơn. Quy tắc: dữ liệu mất cân bằng trên 1:20 → ưu tiên AP hơn
            AUC.
          </p>

          <Callout
            variant="warning"
            title="Accuracy — người bạn cũ hay phản bội"
          >
            Khi dữ liệu mất cân bằng (fraud 1%, disease detection 2%, spam
            3%), accuracy là <strong>metric tệ nhất</strong>. Một model ngốc
            nghếch đoán &ldquo;không có&rdquo; cho mọi mẫu cũng đạt 99%
            accuracy. Hãy đổi sang F1, AP, hoặc matthews correlation
            coefficient (MCC) — xem{" "}
            <TopicLink slug="confusion-matrix">
              Confusion Matrix
            </TopicLink>{" "}
            để hiểu gốc rễ.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Code: cross_val_score + GridSearchCV trong 13 dòng
          </h4>
          <CodeBlock language="python" title="compare_models_cv.py">
            {`from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

models = {
    "LogReg": LogisticRegression(max_iter=1000, random_state=42),
    "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42),
}
for name, m in models.items():
    scores = cross_val_score(m, X, y, cv=5, scoring="f1_weighted")
    print(f"{name}: F1 = {scores.mean():.3f} +/- {scores.std():.3f}")`}
          </CodeBlock>

          <CodeBlock language="python" title="tune_with_grid_search.py">
            {`from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

param_grid = {
    "n_estimators": [100, 300],
    "max_depth": [None, 8, 16],
    "min_samples_leaf": [1, 4],
}
grid = GridSearchCV(RandomForestClassifier(random_state=42),
                    param_grid, cv=5, scoring="f1", n_jobs=-1)
grid.fit(X_train, y_train)
print("Best:", grid.best_params_, "score:", grid.best_score_)`}
          </CodeBlock>

          <Callout
            variant="tip"
            title="Một dòng code để có toàn cảnh metric"
          >
            <p>
              <code>sklearn.metrics.classification_report(y_true, y_pred)</code>{" "}
              in ra precision, recall, F1 cho từng lớp, macro-avg,
              weighted-avg. Luôn in báo cáo này song song với accuracy để
              phát hiện bất cân bằng sớm.
            </p>
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Sơ đồ quyết định: chọn metric theo bài toán
          </h4>
          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <MetricDecisionTree />
          </div>

          <CollapsibleDetail title="Khi nào F1 là metric tệ?">
            <p className="text-sm leading-relaxed">
              F1 giả định precision và recall quan trọng như nhau. Nhưng có
              bài toán thì không:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 mt-2">
              <li>
                <strong>Sàng lọc ung thư</strong>: bỏ sót (recall thấp) nguy
                hiểm gấp nhiều lần báo giả. Dùng F2 (nhấn recall) hoặc hẳn
                recall với ràng buộc precision sàn.
              </li>
              <li>
                <strong>Thư rác</strong>: chuyển nhầm email công việc vào
                spam (precision thấp) rất bực mình. Dùng F0.5 (nhấn
                precision).
              </li>
              <li>
                <strong>Ranking</strong>: thứ tự quan trọng hơn đúng/sai →
                NDCG, MAP.
              </li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="No Free Lunch Theorem — và vì sao bạn vẫn nên thử">
            <p className="text-sm leading-relaxed">
              Định lý No Free Lunch (Wolpert 1996) phát biểu: khi tính trung
              bình trên TOÀN BỘ bài toán có thể có, không thuật toán nào tốt
              hơn thuật toán khác. Nghe như khiến việc chọn model vô nghĩa —
              nhưng thực tế:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 mt-2">
              <li>
                Bạn không gặp &ldquo;toàn bộ bài toán&rdquo; — bạn gặp một
                bài toán cụ thể với cấu trúc cụ thể.
              </li>
              <li>
                Mỗi thuật toán có <em>inductive bias</em> — giả định ngầm về
                cấu trúc dữ liệu. Tree giả định dữ liệu có hierarchy, linear
                giả định additive, NN giả định hierarchy phi tuyến.
              </li>
              <li>
                Do đó việc thử 3-5 thuật toán khác nhau luôn hợp lý — bạn
                đang đánh cược về inductive bias nào khớp với bài toán của
                mình nhất.
              </li>
            </ul>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 7 — CONNECT */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="5 điều nhớ khi chọn model"
          points={[
            "Không có model 'tốt nhất' chung — chỉ có model phù hợp nhất cho bộ yêu cầu cụ thể của bài toán.",
            "Accuracy bị đánh lừa khi dữ liệu mất cân bằng — luôn kèm precision/recall/F1 hoặc AP.",
            "ROC AUC đo khả năng xếp hạng; accuracy đo trên một threshold — hai câu chuyện khác nhau.",
            "Cross-validation 5-fold + báo cáo mean ± std, không chỉ một con số.",
            "Latency, train time, khả năng giải thích luôn nằm cùng bàn cân với F1 — đừng chỉ nhìn một trục.",
          ]}
        />
        <div className="mt-4">
          <Callout variant="tip" title="Xem ứng dụng thực tế">
            Chiến thuật chọn model trong các cuộc thi Kaggle có gì khác so với
            bài toán sản xuất?{" "}
            <TopicLink slug="model-evaluation-selection-in-kaggle">
              Đánh giá &amp; chọn mô hình trên Kaggle
            </TopicLink>{" "}
            — câu chuyện về leaderboard shakeup, ensemble stacking và nghệ
            thuật chọn 2 bài nộp cuối.
          </Callout>
        </div>
      </LessonSection>

      {/* STEP 8 — QUIZ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
