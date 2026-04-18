"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CollapsibleDetail,
  CodeBlock,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ───── METADATA ───── */

export const metadata: TopicMeta = {
  slug: "bias-variance",
  title: "Bias-Variance Tradeoff",
  titleVi: "Đánh đổi Bias-Variance",
  description:
    "Sự cân bằng giữa mô hình quá đơn giản (underfitting) và quá phức tạp (overfitting)",
  category: "classic-ml",
  tags: ["theory", "overfitting", "model-selection"],
  difficulty: "intermediate",
  relatedSlugs: [
    "polynomial-regression",
    "cross-validation",
    "random-forests",
    "regularization",
    "overfitting-underfitting",
  ],
  vizType: "interactive",
};

/* ───── HÀM TẠO DỮ LIỆU — f(x) = sin(2πx) + nhiễu Gauss (Bishop PRML) ─────
 * d = 1: underfit · d = 3-6: sweet spot · d = 20: overfit (Runge)
 * ─────────────────────────────────────────────────────────────────────── */

const N_TRAIN = 15;
const NOISE_SIGMA = 0.18;

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 0xffffffff;
    return s / 0xffffffff;
  };
}

// Box-Muller transform để sinh số ngẫu nhiên chuẩn tắc từ uniform
function gaussianFrom(rng: () => number): number {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function trueFn(x: number): number {
  return Math.sin(2 * Math.PI * x);
}

function makeDataset(seed: number, n: number = N_TRAIN) {
  const rng = seededRng(seed);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i += 1) {
    const x = i / (n - 1);
    const y = trueFn(x) + NOISE_SIGMA * gaussianFrom(rng);
    pts.push({ x, y });
  }
  return pts;
}

/* ───── POLY REGRESSION — normal equation: β̂ = (XᵀX + λI)⁻¹ Xᵀy ───── */

function vandermonde(xs: number[], degree: number): number[][] {
  return xs.map((x) => {
    const row = new Array(degree + 1);
    let v = 1;
    for (let j = 0; j <= degree; j += 1) {
      row[j] = v;
      v *= x;
    }
    return row;
  });
}

function transpose(M: number[][]): number[][] {
  const r = M.length;
  const c = M[0].length;
  const T: number[][] = Array.from({ length: c }, () => new Array(r));
  for (let i = 0; i < r; i += 1) {
    for (let j = 0; j < c; j += 1) T[j][i] = M[i][j];
  }
  return T;
}

function matmul(A: number[][], B: number[][]): number[][] {
  const r = A.length;
  const c = B[0].length;
  const k = B.length;
  const C: number[][] = Array.from({ length: r }, () => new Array(c).fill(0));
  for (let i = 0; i < r; i += 1) {
    for (let j = 0; j < c; j += 1) {
      let s = 0;
      for (let t = 0; t < k; t += 1) s += A[i][t] * B[t][j];
      C[i][j] = s;
    }
  }
  return C;
}

function matvec(A: number[][], x: number[]): number[] {
  return A.map((row) => {
    let s = 0;
    for (let j = 0; j < row.length; j += 1) s += row[j] * x[j];
    return s;
  });
}

// Gauss-Jordan inverse cho ma trận nhỏ (tối đa ~21x21)
function inverse(M: number[][]): number[][] | null {
  const n = M.length;
  const A: number[][] = M.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  for (let i = 0; i < n; i += 1) {
    let pivot = A[i][i];
    if (Math.abs(pivot) < 1e-12) {
      let swap = -1;
      for (let k = i + 1; k < n; k += 1) {
        if (Math.abs(A[k][i]) > 1e-12) {
          swap = k;
          break;
        }
      }
      if (swap < 0) return null;
      [A[i], A[swap]] = [A[swap], A[i]];
      pivot = A[i][i];
    }
    for (let j = 0; j < 2 * n; j += 1) A[i][j] /= pivot;
    for (let k = 0; k < n; k += 1) {
      if (k === i) continue;
      const factor = A[k][i];
      for (let j = 0; j < 2 * n; j += 1) A[k][j] -= factor * A[i][j];
    }
  }
  return A.map((row) => row.slice(n));
}

// Regularized normal equation: (XᵀX + λI)⁻¹ Xᵀy
function polyFit(
  pts: { x: number; y: number }[],
  degree: number,
  lambda = 1e-8
): number[] {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const X = vandermonde(xs, degree);
  const XT = transpose(X);
  const XTX = matmul(XT, X);
  // Thêm λI nhỏ để đảm bảo ổn định số học khi degree lớn
  for (let i = 0; i < XTX.length; i += 1) XTX[i][i] += lambda;
  const inv = inverse(XTX);
  if (!inv) return new Array(degree + 1).fill(0);
  const XTy = matvec(XT, ys);
  return matvec(inv, XTy);
}

function polyEval(beta: number[], x: number): number {
  let y = 0;
  let v = 1;
  for (let j = 0; j < beta.length; j += 1) {
    y += beta[j] * v;
    v *= x;
  }
  return y;
}

function mse(
  beta: number[],
  pts: { x: number; y: number }[]
): number {
  let s = 0;
  for (const p of pts) {
    const e = p.y - polyEval(beta, p.x);
    s += e * e;
  }
  return s / pts.length;
}

/* ───── BIAS-VARIANCE DECOMPOSITION (Monte Carlo) ─────
 * Sample K dataset, fit K model, đo bias²/variance tại mỗi điểm test.
 * Precompute cho d ∈ [1, 20]. */

const TEST_GRID = Array.from({ length: 41 }, (_, i) => i / 40);
const NUM_REALIZATIONS = 40;
const MAX_DEGREE = 20;

type Decomp = {
  degree: number;
  bias2: number;
  variance: number;
  total: number; // bias² + variance + noise floor
  trainMse: number;
  testMse: number;
};

function decomposeAtDegree(degree: number): Decomp {
  let biasSum = 0;
  let varSum = 0;
  let trainSum = 0;
  let testSum = 0;

  // Precompute f(x) trên test grid
  const fGrid = TEST_GRID.map(trueFn);

  // K datasets → K fits → K predictions trên test grid
  const preds: number[][] = [];
  for (let k = 0; k < NUM_REALIZATIONS; k += 1) {
    const ds = makeDataset(17 + k * 7);
    const beta = polyFit(ds, degree);
    const pred = TEST_GRID.map((x) => polyEval(beta, x));
    preds.push(pred);

    // Train MSE trung bình
    trainSum += mse(beta, ds);

    // Test MSE: dùng ground truth + noise giả lập
    const rng = seededRng(10_000 + k);
    let tsum = 0;
    for (let i = 0; i < TEST_GRID.length; i += 1) {
      const yTrue = fGrid[i] + NOISE_SIGMA * gaussianFrom(rng);
      const e = yTrue - pred[i];
      tsum += e * e;
    }
    testSum += tsum / TEST_GRID.length;
  }

  // Bias² = trung bình trên x của (meanPred(x) - f(x))²
  // Variance = trung bình trên x của var của K predictions tại x
  for (let i = 0; i < TEST_GRID.length; i += 1) {
    let meanPred = 0;
    for (let k = 0; k < NUM_REALIZATIONS; k += 1) meanPred += preds[k][i];
    meanPred /= NUM_REALIZATIONS;

    let v = 0;
    for (let k = 0; k < NUM_REALIZATIONS; k += 1) {
      const d = preds[k][i] - meanPred;
      v += d * d;
    }
    v /= NUM_REALIZATIONS;

    const b = meanPred - fGrid[i];
    biasSum += b * b;
    varSum += v;
  }

  const bias2 = biasSum / TEST_GRID.length;
  const variance = varSum / TEST_GRID.length;
  const noise = NOISE_SIGMA * NOISE_SIGMA;

  return {
    degree,
    bias2,
    variance,
    total: bias2 + variance + noise,
    trainMse: trainSum / NUM_REALIZATIONS,
    testMse: testSum / NUM_REALIZATIONS,
  };
}

/* ───── QUIZ — 8 câu ───── */

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Mô hình hồi quy tuyến tính trên dữ liệu dạng parabol. Đây là bias cao hay variance cao?",
    options: [
      "Variance cao — mô hình quá nhạy với dữ liệu",
      "Bias cao — mô hình quá đơn giản, không nắm bắt được đường cong",
      "Cả hai đều thấp",
      "Không thể xác định",
    ],
    correct: 1,
    explanation:
      "Đường thẳng không thể khớp parabol → sai hệ thống (bias). Dù train thêm dữ liệu, đường thẳng vẫn sai. Đây là underfitting — cần mô hình phức tạp hơn (bậc 2).",
  },
  {
    question:
      "Random Forest thường có bias-variance profile thế nào so với 1 cây quyết định sâu?",
    options: [
      "Bias cao hơn, variance thấp hơn",
      "Bias tương đương, variance thấp hơn nhiều (nhờ averaging)",
      "Bias thấp hơn, variance cao hơn",
      "Cả hai cao hơn",
    ],
    correct: 1,
    explanation:
      "Mỗi cây sâu có bias thấp (linh hoạt) nhưng variance cao. Trung bình nhiều cây → variance giảm mạnh (lỗi ngẫu nhiên bù trừ) trong khi bias gần không đổi. Đây là sức mạnh ensemble!",
  },
  {
    question: "Làm sao biết mô hình đang overfitting?",
    options: [
      "Training accuracy cao, validation accuracy cũng cao",
      "Training accuracy cao nhưng validation accuracy thấp hơn nhiều (khoảng cách lớn)",
      "Cả training và validation accuracy đều thấp",
      "Validation accuracy cao hơn training accuracy",
    ],
    correct: 1,
    explanation:
      "Khoảng cách lớn giữa train và val accuracy = overfitting. Model 'nhớ' training data nhưng không generalize. Cả hai thấp = underfitting. Cả hai cao = sweet spot!",
  },
  {
    type: "fill-blank",
    question:
      "Khi độ phức tạp mô hình tăng, {blank} giảm nhưng {blank} tăng. Tổng sai số có dạng đường cong {blank}.",
    blanks: [
      { answer: "bias", accept: ["Bias", "bias²", "Bias²"] },
      { answer: "variance", accept: ["Variance"] },
      { answer: "chữ U", accept: ["hình chữ U", "U"] },
    ],
    explanation:
      "Đây là bản chất của Bias-Variance Tradeoff: tăng phức tạp → bias giảm, variance tăng. Tổng sai số = Bias² + Variance + Noise có hình chữ U, với 'sweet spot' ở đáy.",
  },
  {
    question:
      "Dùng đa thức bậc 20 fit 15 điểm dữ liệu. Hiện tượng gì sẽ xảy ra?",
    options: [
      "Mô hình sẽ generalise rất tốt vì nhiều tham số",
      "Mô hình khớp gần như hoàn hảo các điểm train nhưng dao động dữ dội giữa các điểm → test error rất cao (overfitting)",
      "Mô hình sẽ tự regularize",
      "Không có gì đặc biệt xảy ra",
    ],
    correct: 1,
    explanation:
      "Đa thức bậc 20 với 15 điểm có 21 tham số > 15 ràng buộc → bài toán under-determined. Fit đi qua mọi điểm train (train MSE ≈ 0) nhưng oscillate kinh khủng giữa các điểm (hiện tượng Runge). Đây là hình ảnh overfitting kinh điển.",
  },
  {
    question:
      "Irreducible error (noise σ²) có thể giảm bằng cách thêm dữ liệu huấn luyện không?",
    options: [
      "Có — càng nhiều data càng giảm noise",
      "Không — noise thuộc về bản chất dữ liệu, không phụ thuộc mô hình hay lượng data",
      "Chỉ giảm nếu dùng deep learning",
      "Chỉ giảm nếu regularize",
    ],
    correct: 1,
    explanation:
      "σ² phản ánh sự ngẫu nhiên không thể giảm trong y (đo đạc sai số, yếu tố bên ngoài không quan sát được). Thêm data, đổi model, regularize đều không đụng tới σ². Chỉ cách duy nhất là cải thiện chất lượng dữ liệu đầu vào.",
  },
  {
    type: "fill-blank",
    question:
      "Trong sklearn, để ước lượng ổn định train/val error theo lượng data ta dùng hàm {blank}_curve từ sklearn.model_selection.",
    blanks: [{ answer: "learning", accept: ["learning"] }],
    explanation:
      "learning_curve(estimator, X, y, train_sizes=...) trả về train_scores và val_scores theo kích thước tập huấn luyện. Đây là công cụ chẩn đoán bias-variance trực quan nhất.",
  },
  {
    question:
      "Có cách nào PHÁ VỠ tradeoff (giảm cả bias và variance cùng lúc)?",
    options: [
      "Không — tradeoff là bất biến",
      "Có — thêm dữ liệu huấn luyện: bias có thể giữ nguyên còn variance giảm mạnh",
      "Có — regularize vô hạn",
      "Có — chọn random seed tốt",
    ],
    correct: 1,
    explanation:
      "Với một lượng data cố định tradeoff đúng là khó phá. Nhưng khi tăng N → ∞, variance của hầu hết mô hình hội tụ về 0 trong khi bias giữ nguyên theo cấu trúc mô hình. Đây là lý do 'more data usually wins'.",
  },
];

/* ───── HẰNG SỐ VẼ CHART ───── */

const FIT_W = 480;
const FIT_H = 240;
const FIT_PAD = { l: 34, r: 14, t: 12, b: 26 };
const DECOMP_W = 480;
const DECOMP_H = 200;
const DECOMP_PAD = { l: 34, r: 14, t: 12, b: 30 };

const TOTAL_STEPS = 8;

/* Pilot: interactive-first — "Ẩn dụ bắn cung" now a canvas, not 4 bullet points.
   Two sliders (bias, variance) → ~25 arrows on a target. The 4 quadrants of the
   classic metaphor become visible as the learner tunes. */
const TARGET_R = 100;
const SHOT_SEED = 7;
function bullsRng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 0xffffffff; };
}
function bullsShots(bias: number, variance: number) {
  const rng = bullsRng(SHOT_SEED);
  const shots: { x: number; y: number }[] = [];
  for (let i = 0; i < 25; i++) {
    const ang = rng() * Math.PI * 2;
    const r = Math.sqrt(-2 * Math.log(Math.max(1e-6, rng()))) * variance;
    shots.push({ x: bias + r * Math.cos(ang), y: r * Math.sin(ang) });
  }
  return shots;
}
function BullseyeCanvas() {
  const [bias, setBias] = useState(10);
  const [variance, setVariance] = useState(15);
  const shots = useMemo(() => bullsShots(bias, variance), [bias, variance]);
  const label =
    bias < 20 && variance < 20 ? "Bias thấp · Variance thấp — lý tưởng"
    : bias >= 20 && variance < 20 ? "Bias cao · Variance thấp — underfit"
    : bias < 20 && variance >= 20 ? "Bias thấp · Variance cao — overfit"
    : "Bias cao · Variance cao — tệ nhất";
  const cx = 140, cy = 140;
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">Ẩn dụ bắn cung — kéo hai thanh để tái tạo cả bốn trường hợp</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <svg viewBox="0 0 280 280" className="w-full max-w-[240px] mx-auto" role="img"
          aria-label={`Bia bắn cung. ${label}. 25 mũi tên với bias ${bias} và variance ${variance}.`}>
          <title>{label}</title>
          {[TARGET_R, TARGET_R * 0.66, TARGET_R * 0.33].map((r, i) => (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill={i === 0 ? "#fee2e2" : i === 1 ? "#fecaca" : "#fca5a5"}
              stroke="#ef4444" strokeWidth={1} />
          ))}
          <circle cx={cx} cy={cy} r={3} fill="#7f1d1d" />
          {shots.map((s, i) => (
            <circle key={i} cx={cx + s.x} cy={cy + s.y} r={3}
              fill="#1e293b" stroke="#fff" strokeWidth={0.8} opacity={0.85} />
          ))}
        </svg>
        <div className="flex-1 space-y-3 text-sm">
          <div>
            <label className="flex items-center justify-between text-muted">
              <span>Bias (lệch hệ thống)</span>
              <span className="font-mono text-foreground">{bias}</span>
            </label>
            <input type="range" min={0} max={60} step={1} value={bias}
              onChange={(e) => setBias(Number(e.target.value))} className="w-full accent-accent" />
          </div>
          <div>
            <label className="flex items-center justify-between text-muted">
              <span>Variance (độ tán)</span>
              <span className="font-mono text-foreground">{variance}</span>
            </label>
            <input type="range" min={2} max={40} step={1} value={variance}
              onChange={(e) => setVariance(Number(e.target.value))} className="w-full accent-accent" />
          </div>
          <p className="font-semibold" style={{ color:
            bias < 20 && variance < 20 ? "#22c55e"
            : (bias >= 20 && variance >= 20) ? "#ef4444" : "#f59e0b" }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══ COMPONENT CHÍNH ═══ */

export default function BiasVarianceTopic() {
  // Degree hiện tại (1..20)
  const [degree, setDegree] = useState(3);

  // Có hiển thị chồng nhiều fit (Monte Carlo) để thấy variance không?
  const [showEnsemble, setShowEnsemble] = useState(false);

  // Seed dataset hiện tại (có thể tái tạo)
  const [seed, setSeed] = useState(42);

  // ─── Dataset & fit ────────────────────────────────────────────────────
  const dataset = useMemo(() => makeDataset(seed), [seed]);

  const beta = useMemo(() => polyFit(dataset, degree), [dataset, degree]);

  const fitCurve = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= 200; i += 1) {
      const x = i / 200;
      pts.push({ x, y: polyEval(beta, x) });
    }
    return pts;
  }, [beta]);

  // Ensemble — 8 fit với 8 seed khác nhau để hiển thị variance
  const ensembleCurves = useMemo(() => {
    if (!showEnsemble) return [];
    const curves: { x: number; y: number }[][] = [];
    for (let k = 0; k < 8; k += 1) {
      const ds = makeDataset(seed + 31 * (k + 1));
      const b = polyFit(ds, degree);
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 100; i += 1) {
        const x = i / 100;
        pts.push({ x, y: polyEval(b, x) });
      }
      curves.push(pts);
    }
    return curves;
  }, [showEnsemble, degree, seed]);

  // ─── Bias-Variance decomposition curves (precompute for d = 1..20) ───
  const decomp = useMemo(() => {
    const out: Decomp[] = [];
    for (let d = 1; d <= MAX_DEGREE; d += 1) {
      out.push(decomposeAtDegree(d));
    }
    return out;
  }, []);

  const currentDecomp = decomp[degree - 1] ?? decomp[0];

  const maxBias = Math.max(...decomp.map((d) => d.bias2));
  const maxVar = Math.max(...decomp.map((d) => d.variance));
  const maxTotal = Math.max(...decomp.map((d) => d.total));
  const yMax = Math.max(maxBias, maxVar, maxTotal) * 1.1;

  // ─── Xác định vùng underfitting / sweet spot / overfitting ───────────
  const zone =
    degree <= 2
      ? "Underfitting"
      : degree <= 6
        ? "Sweet Spot"
        : "Overfitting";
  const zoneColor =
    degree <= 2 ? "#ef4444" : degree <= 6 ? "#22c55e" : "#ef4444";

  // ─── SVG path helpers ────────────────────────────────────────────────
  const fitPath = useMemo(() => {
    return fitCurve
      .map((p, i) => {
        const px = FIT_PAD.l + p.x * (FIT_W - FIT_PAD.l - FIT_PAD.r);
        const py =
          FIT_PAD.t +
          ((1 - (p.y + 1.5) / 3) * (FIT_H - FIT_PAD.t - FIT_PAD.b));
        return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
      })
      .join(" ");
  }, [fitCurve]);

  const truePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i += 1) {
      const x = i / 100;
      const y = trueFn(x);
      const px = FIT_PAD.l + x * (FIT_W - FIT_PAD.l - FIT_PAD.r);
      const py =
        FIT_PAD.t + ((1 - (y + 1.5) / 3) * (FIT_H - FIT_PAD.t - FIT_PAD.b));
      pts.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(" ");
  }, []);

  const ensemblePaths = useMemo(() => {
    return ensembleCurves.map((curve) =>
      curve
        .map((p, i) => {
          const px = FIT_PAD.l + p.x * (FIT_W - FIT_PAD.l - FIT_PAD.r);
          const py =
            FIT_PAD.t +
            ((1 - (p.y + 1.5) / 3) * (FIT_H - FIT_PAD.t - FIT_PAD.b));
          return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
        })
        .join(" ")
    );
  }, [ensembleCurves]);

  // Decomposition paths
  const decompPath = useCallback(
    (key: "bias2" | "variance" | "total") => {
      return decomp
        .map((d, i) => {
          const px =
            DECOMP_PAD.l +
            (i / (MAX_DEGREE - 1)) *
              (DECOMP_W - DECOMP_PAD.l - DECOMP_PAD.r);
          const py =
            DECOMP_PAD.t +
            ((1 - d[key] / yMax) *
              (DECOMP_H - DECOMP_PAD.t - DECOMP_PAD.b));
          return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
        })
        .join(" ");
    },
    [decomp, yMax]
  );

  const biasPath = useMemo(() => decompPath("bias2"), [decompPath]);
  const variancePath = useMemo(() => decompPath("variance"), [decompPath]);
  const totalPath = useMemo(() => decompPath("total"), [decompPath]);

  const decompCurX =
    DECOMP_PAD.l +
    ((degree - 1) / (MAX_DEGREE - 1)) *
      (DECOMP_W - DECOMP_PAD.l - DECOMP_PAD.r);

  // Ước lượng "sweet spot" = degree có total nhỏ nhất
  const sweetDegree = useMemo(() => {
    let best = 1;
    let bestTotal = Infinity;
    for (const d of decomp) {
      if (d.total < bestTotal) {
        bestTotal = d.total;
        best = d.degree;
      }
    }
    return best;
  }, [decomp]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleDegreeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDegree(Number(e.target.value));
    },
    []
  );

  const handleResample = useCallback(() => {
    setSeed((s) => s + 1);
  }, []);

  const handleResetDemo = useCallback(() => {
    setDegree(3);
    setShowEnsemble(false);
    setSeed(42);
  }, []);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 1: HOOK — PredictionGate (ẩn dụ bắn cung)
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Khám phá",
              "A-ha",
              "Đi sâu",
              "Thử thách",
              "Giải thích",
              "Tổng kết",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Bạn bắn cung. 10 mũi tên đều lệch sang phải 20cm nhưng chụm lại sát nhau. Bạn sẽ sửa gì?"
          options={[
            "Bắn mạnh hơn — mũi tên sẽ thẳng hơn",
            "Chỉnh tầm sang trái 20cm — sai số hệ thống, cần sửa hướng (giảm bias)",
            "Tập trung hơn — mũi tên đang tán loạn",
          ]}
          correct={1}
          explanation="Mũi tên lệch hệ thống = BIAS cao. Mũi tên chụm = variance thấp. Bạn cần sửa hướng (giảm bias), không cần tập trung hơn. Đây chính là tradeoff bias-variance trong ML!"
        >
          <p className="text-sm text-muted mt-4">
            Trong Machine Learning, mô hình cũng &quot;bắn cung&quot; vào kết
            quả đúng. Chúng ta sẽ xem cách một tham số duy nhất (độ phức tạp
            mô hình) điều khiển cả hai loại sai số này cùng lúc.
          </p>
        </PredictionGate>

        <BullseyeCanvas />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 2: VISUALIZATION — Polynomial fit + BV decomposition
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Fit đa thức cho hàm sin — kéo thanh trượt degree từ 1 đến 20
          </h3>
          <p className="text-sm text-muted mb-4">
            Dữ liệu sinh từ f(x) = sin(2πx) + noise Gauss. Thử tăng bậc đa
            thức: lúc đầu mô hình quá thô (underfit), qua một điểm sweet spot,
            rồi oscillate mạnh (overfit).
          </p>

          {/* Chart 1: fit curve */}
          <div className="rounded-xl border border-border bg-card/30 p-3 mb-4">
            <svg
              viewBox={`0 0 ${FIT_W} ${FIT_H}`}
              className="w-full"
              role="img"
              aria-label="Polynomial fit chart"
            >
              {/* Grid */}
              {[-1, 0, 1].map((v) => {
                const y =
                  FIT_PAD.t +
                  ((1 - (v + 1.5) / 3) * (FIT_H - FIT_PAD.t - FIT_PAD.b));
                return (
                  <g key={v}>
                    <line
                      x1={FIT_PAD.l}
                      y1={y}
                      x2={FIT_W - FIT_PAD.r}
                      y2={y}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth={0.5}
                    />
                    <text
                      x={FIT_PAD.l - 4}
                      y={y + 3}
                      fontSize={9}
                      fill="currentColor"
                      className="text-muted"
                      textAnchor="end"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* True function */}
              <path
                d={truePath}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />

              {/* Ensemble curves (background) */}
              {ensemblePaths.map((p, i) => (
                <path
                  key={i}
                  d={p}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={1}
                  opacity={0.35}
                />
              ))}

              {/* Main fit */}
              <motion.path
                d={fitPath}
                fill="none"
                stroke={zoneColor}
                strokeWidth={2.5}
                initial={false}
                animate={{ d: fitPath }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />

              {/* Data points */}
              {dataset.map((p, i) => {
                const px =
                  FIT_PAD.l + p.x * (FIT_W - FIT_PAD.l - FIT_PAD.r);
                const py =
                  FIT_PAD.t +
                  ((1 - (p.y + 1.5) / 3) * (FIT_H - FIT_PAD.t - FIT_PAD.b));
                return (
                  <circle
                    key={i}
                    cx={px}
                    cy={py}
                    r={3.5}
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Legend */}
              <g transform={`translate(${FIT_PAD.l}, ${FIT_H - 8})`}>
                <line
                  x1={0}
                  y1={0}
                  x2={18}
                  y2={0}
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <text x={22} y={3} fontSize={9} fill="currentColor">
                  f(x) = sin(2πx)
                </text>
                <line
                  x1={110}
                  y1={0}
                  x2={128}
                  y2={0}
                  stroke={zoneColor}
                  strokeWidth={2.5}
                />
                <text x={132} y={3} fontSize={9} fill="currentColor">
                  Fit đa thức bậc {degree}
                </text>
                <circle cx={250} cy={0} r={3} fill="#3b82f6" />
                <text x={258} y={3} fontSize={9} fill="currentColor">
                  Data (train)
                </text>
              </g>
            </svg>
          </div>

          {/* Controls */}
          <div className="grid gap-3 mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground whitespace-nowrap min-w-[90px]">
                Degree d:
              </label>
              <input
                type="range"
                min={1}
                max={MAX_DEGREE}
                value={degree}
                onChange={handleDegreeChange}
                className="flex-1 accent-accent"
              />
              <span
                className="w-10 text-center text-sm font-bold"
                style={{ color: zoneColor }}
              >
                {degree}
              </span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEnsemble}
                  onChange={(e) => setShowEnsemble(e.target.checked)}
                  className="accent-accent"
                />
                Hiển thị 8 fit (để nhìn variance)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResample}
                  className="text-[11px] text-accent hover:underline"
                >
                  ↻ Resample dataset
                </button>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="text-[11px] text-muted hover:text-accent"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Zone banner */}
            <motion.div
              className="rounded-lg px-3 py-2 text-sm font-semibold text-center"
              style={{
                backgroundColor: `${zoneColor}22`,
                color: zoneColor,
                border: `1px solid ${zoneColor}55`,
              }}
              animate={{ backgroundColor: `${zoneColor}22` }}
            >
              Degree d = {degree} → {zone}
              {degree === sweetDegree && " ★ (đạt sweet spot)"}
            </motion.div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 p-2 bg-blue-50/50 dark:bg-blue-900/10">
                <div className="font-bold text-blue-500">Train MSE</div>
                <div className="text-lg font-bold text-blue-600">
                  {currentDecomp.trainMse.toFixed(3)}
                </div>
              </div>
              <div className="rounded-lg border border-orange-200 dark:border-orange-800 p-2 bg-orange-50/50 dark:bg-orange-900/10">
                <div className="font-bold text-orange-500">Test MSE</div>
                <div className="text-lg font-bold text-orange-600">
                  {currentDecomp.testMse.toFixed(3)}
                </div>
              </div>
              <div className="rounded-lg border border-red-200 dark:border-red-800 p-2 bg-red-50/50 dark:bg-red-900/10">
                <div className="font-bold text-red-500">Gap</div>
                <div className="text-lg font-bold text-red-600">
                  {(
                    currentDecomp.testMse - currentDecomp.trainMse
                  ).toFixed(3)}
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Bias² / Variance / Total decomposition over degree */}
          <h4 className="text-sm font-semibold text-foreground mb-1">
            Đường cong Bias² + Variance + Total (Monte Carlo trên 40 dataset)
          </h4>
          <p className="text-xs text-muted mb-2">
            Với mỗi degree, ta sample nhiều dataset khác nhau, fit mô hình, đo
            bias² và variance tại mỗi điểm test. Tổng sai số = Bias² + Variance
            + σ² (noise floor).
          </p>

          <div className="rounded-xl border border-border bg-card/30 p-3">
            <svg
              viewBox={`0 0 ${DECOMP_W} ${DECOMP_H}`}
              className="w-full"
              role="img"
              aria-label="Bias-variance decomposition"
            >
              {/* Grid + axes */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y =
                  DECOMP_PAD.t +
                  (1 - t) * (DECOMP_H - DECOMP_PAD.t - DECOMP_PAD.b);
                return (
                  <line
                    key={t}
                    x1={DECOMP_PAD.l}
                    y1={y}
                    x2={DECOMP_W - DECOMP_PAD.r}
                    y2={y}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* Paths */}
              <path
                d={biasPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2.5}
              />
              <path
                d={variancePath}
                fill="none"
                stroke="#f97316"
                strokeWidth={2.5}
              />
              <path
                d={totalPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="6 3"
              />

              {/* Sweet spot marker */}
              {(() => {
                const sx =
                  DECOMP_PAD.l +
                  ((sweetDegree - 1) / (MAX_DEGREE - 1)) *
                    (DECOMP_W - DECOMP_PAD.l - DECOMP_PAD.r);
                const sy =
                  DECOMP_PAD.t +
                  (1 - decomp[sweetDegree - 1].total / yMax) *
                    (DECOMP_H - DECOMP_PAD.t - DECOMP_PAD.b);
                return (
                  <g>
                    <circle
                      cx={sx}
                      cy={sy}
                      r={5}
                      fill="#22c55e"
                      stroke="white"
                      strokeWidth={1.5}
                    />
                    <text
                      x={sx}
                      y={sy - 10}
                      fontSize={9}
                      fill="#22c55e"
                      textAnchor="middle"
                      fontWeight={700}
                    >
                      sweet d={sweetDegree}
                    </text>
                  </g>
                );
              })()}

              {/* Current position */}
              <motion.line
                x1={decompCurX}
                y1={DECOMP_PAD.t}
                x2={decompCurX}
                y2={DECOMP_H - DECOMP_PAD.b}
                stroke={zoneColor}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                animate={{ x1: decompCurX, x2: decompCurX }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              />

              {/* X-axis labels */}
              <text
                x={DECOMP_W / 2}
                y={DECOMP_H - 4}
                fontSize={9}
                fill="currentColor"
                className="text-muted"
                textAnchor="middle"
              >
                Degree d (1 → 20)
              </text>

              {/* Legend */}
              <g transform={`translate(${DECOMP_PAD.l + 6}, 14)`}>
                <line
                  x1={0}
                  y1={0}
                  x2={16}
                  y2={0}
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                />
                <text x={20} y={3} fontSize={9} fill="#3b82f6">
                  Bias²
                </text>
                <line
                  x1={70}
                  y1={0}
                  x2={86}
                  y2={0}
                  stroke="#f97316"
                  strokeWidth={2.5}
                />
                <text x={90} y={3} fontSize={9} fill="#f97316">
                  Variance
                </text>
                <line
                  x1={150}
                  y1={0}
                  x2={166}
                  y2={0}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                />
                <text x={170} y={3} fontSize={9} fill="#ef4444">
                  Total (Bias²+Var+σ²)
                </text>
              </g>
            </svg>

            <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
              <div className="rounded bg-blue-50/50 dark:bg-blue-900/10 p-1.5">
                <div className="text-[9px] text-blue-500 font-bold uppercase">
                  Bias²
                </div>
                <div className="font-mono text-blue-600 font-bold">
                  {currentDecomp.bias2.toFixed(3)}
                </div>
              </div>
              <div className="rounded bg-orange-50/50 dark:bg-orange-900/10 p-1.5">
                <div className="text-[9px] text-orange-500 font-bold uppercase">
                  Variance
                </div>
                <div className="font-mono text-orange-600 font-bold">
                  {currentDecomp.variance.toFixed(3)}
                </div>
              </div>
              <div className="rounded bg-red-50/50 dark:bg-red-900/10 p-1.5">
                <div className="text-[9px] text-red-500 font-bold uppercase">
                  Total
                </div>
                <div className="font-mono text-red-600 font-bold">
                  {currentDecomp.total.toFixed(3)}
                </div>
              </div>
            </div>
          </div>

          {/* Observation banner */}
          <div className="rounded-xl border-l-4 border-l-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm mt-3">
            <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
              Những gì bạn thấy:
            </p>
            <ul className="list-disc pl-5 text-amber-700 dark:text-amber-300 space-y-0.5 text-[13px]">
              <li><strong>d = 1-2:</strong> đường fit quá phẳng → bias² rất cao.</li>
              <li><strong>d = 3-6:</strong> fit ôm sát đường thật → sweet spot.</li>
              <li><strong>d = 10-20:</strong> uốn lượn dữ dội → variance bùng nổ.</li>
              <li>Bật <em>Hiển thị 8 fit</em> để nhìn chùm đường — độ dày = variance.</li>
            </ul>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 3: AHA MOMENT
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Bias-Variance Tradeoff:</strong> Mô hình đơn giản → bias
            cao (sai hệ thống). Mô hình phức tạp → variance cao (nhạy dữ
            liệu). Tổng sai số có dạng chữ U — &quot;sweet spot&quot; ở đáy!
          </p>
          <p className="text-sm text-muted mt-2">
            Giống như bắn cung: ngắm trúng tim (bias thấp) và bắn ổn định
            (variance thấp) là hai kỹ năng KHÁC NHAU. Mô hình ML cần cả hai,
            nhưng thường phải đánh đổi — giảm bên này sẽ tăng bên kia.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 4: ĐI SÂU
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Phân rã sai số dự đoán
        </h3>
        <p className="text-sm text-muted mb-4">
          Với hàm thật f(x) và nhiễu ε ∼ N(0, σ²), giả sử y = f(x) + ε. Lấy kỳ
          vọng trên các dataset huấn luyện khác nhau, sai số bình phương trung
          bình của một dự đoán ŷ(x) phân rã đẹp như sau:
        </p>

        <LaTeX block>
          {
            "\\mathbb{E}\\big[(y - \\hat{y}(x))^2\\big] = \\underbrace{(\\mathbb{E}[\\hat{y}(x)] - f(x))^2}_{\\text{Bias}^2} + \\underbrace{\\mathbb{E}\\big[(\\hat{y}(x) - \\mathbb{E}[\\hat{y}(x)])^2\\big]}_{\\text{Variance}} + \\underbrace{\\sigma^2}_{\\text{Noise}}"
          }
        </LaTeX>

        <p className="text-sm text-muted mb-4">
          Ba thành phần này luôn không âm. Ta không thể đụng tới σ² (noise của
          chính dữ liệu), nhưng có thể trade giữa bias và variance qua lựa
          chọn mô hình và lượng dữ liệu.
        </p>

        <Callout variant="insight" title="Ba thành phần, ba cách giải quyết">
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <strong>Bias</strong>: sai số hệ thống do mô hình không đủ biểu
              cảm. Giảm bias bằng cách tăng độ phức tạp (bậc cao hơn, thêm
              layer, thêm feature, giảm regularization).
            </li>
            <li>
              <strong>Variance</strong>: sai số do mô hình học thuộc nhiễu của
              một tập huấn luyện cụ thể. Giảm bằng cách thêm dữ liệu,
              regularize (L1/L2, dropout), hoặc ensemble (Random Forest,
              Bagging).
            </li>
            <li>
              <strong>Noise σ²</strong>: không thể giảm bằng mô hình. Chỉ có
              thể cải thiện chất lượng dữ liệu đầu vào (đo đạc tốt hơn, lọc
              outlier, feature engineering).
            </li>
          </ol>
        </Callout>

        <CollapsibleDetail title="Tại sao công thức phân rã luôn đúng? (chứng minh 5 dòng)">
          <div className="space-y-2 text-sm text-muted">
            <p>
              Gọi{" "}
              <LaTeX>{"\\bar{y}(x) = \\mathbb{E}[\\hat{y}(x)]"}</LaTeX> là dự
              đoán kỳ vọng. Ta viết:
            </p>
            <LaTeX block>
              {
                "y - \\hat{y} = \\underbrace{(y - f)}_{= \\varepsilon} + \\underbrace{(f - \\bar{y})}_{\\text{bias}} + \\underbrace{(\\bar{y} - \\hat{y})}_{\\text{variance}}"
              }
            </LaTeX>
            <p>
              Bình phương và lấy kỳ vọng, các tích chéo triệt tiêu vì ε độc
              lập với mô hình và{" "}
              <LaTeX>{"\\mathbb{E}[\\bar{y} - \\hat{y}] = 0"}</LaTeX>. Kết quả:
              3 số hạng bình phương độc lập — chính là công thức phân rã.
            </p>
            <p>
              Đây là lý do ta có thể &quot;đo&quot; từng thành phần riêng biệt
              qua Monte Carlo (như trong demo): sample nhiều dataset → ước
              lượng kỳ vọng và phương sai của ŷ(x).
            </p>
          </div>
        </CollapsibleDetail>

        <div className="h-4" />

        <CollapsibleDetail title="Vì sao đa thức bậc cao oscillate mạnh? (hiện tượng Runge)">
          <div className="space-y-2 text-sm text-muted">
            <p>
              Khi dùng đa thức bậc d fit n điểm với d + 1 &gt; n, bài toán
              thiếu ràng buộc — có vô số đa thức đi qua tất cả điểm train.
              Normal equation chọn một nghiệm (thường là nghiệm có norm nhỏ
              nhất khi có regularization), nhưng nghiệm đó vẫn dao động dữ
              dội giữa các điểm.
            </p>
            <p>
              Runge (1901) chứng minh với các nút cách đều, đa thức nội suy
              Lagrange bậc cao cho hàm{" "}
              <LaTeX>{"\\tfrac{1}{1 + 25 x^2}"}</LaTeX> dao động vô hạn ở biên
              — càng tăng bậc càng tệ. Đây chính là phiên bản toán học của
              &quot;overfitting&quot;.
            </p>
            <p>
              Giải pháp: dùng nút Chebyshev thay vì cách đều, hoặc thêm ràng
              buộc L2 (ridge regression) để ép coefficient nhỏ lại.
            </p>
          </div>
        </CollapsibleDetail>

        <div className="h-4" />

        <Callout variant="tip" title="Chẩn đoán từ learning curve">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Train & Val đều thấp, gap nhỏ</strong> → underfitting
              (bias cao). Tăng phức tạp, thêm feature.
            </li>
            <li>
              <strong>Train cao, Val thấp, gap lớn</strong> → overfitting
              (variance cao). Thêm dữ liệu, regularize, giảm phức tạp.
            </li>
            <li>
              <strong>Cả hai cao, gap nhỏ</strong> → sweet spot, mô hình đã
              tốt. Nếu vẫn chưa đủ thì cần cải tiến model chất.
            </li>
            <li>
              <strong>Val &gt; Train</strong> → hiếm, có thể do data leakage
              hoặc val set quá dễ. Kiểm tra lại pipeline.
            </li>
          </ul>
        </Callout>

        <div className="h-4" />

        <Callout variant="warning" title="Bốn sai lầm hay gặp">
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              Chọn mô hình dựa trên <em>train error</em>: luôn chọn model phức
              tạp hơn → overfit.
            </li>
            <li>
              Regularize một cách máy móc (λ = default) mà không tune qua cross
              validation.
            </li>
            <li>
              So sánh model có số lượng feature khác nhau bằng R² thay vì
              adjusted R² hoặc validation score.
            </li>
            <li>
              Không fix random seed khi so sánh — variance giữa các seed có
              thể che lấp khác biệt thực giữa mô hình.
            </li>
          </ol>
        </Callout>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 5: THỬ THÁCH — 2 InlineChallenge
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <div className="space-y-5">
          <InlineChallenge
            question="Training accuracy 99%, validation accuracy 70%. Mô hình đang ở đâu trên đường cong?"
            options={[
              "Underfitting (bên trái) — cần tăng phức tạp",
              "Overfitting (bên phải) — cần giảm phức tạp hoặc thêm dữ liệu",
              "Sweet spot — kết quả tốt rồi",
            ]}
            correct={1}
            explanation="Khoảng cách train (99%) vs val (70%) = 29% → overfitting rõ ràng. Mô hình 'nhớ' training data nhưng không generalize. Giải pháp: regularization, early stopping, thêm dữ liệu, hoặc giảm phức tạp."
          />

          <InlineChallenge
            question="Bạn đang fit đa thức bậc 12 cho 10 điểm dữ liệu. Train MSE = 0.00, Test MSE = 4.5. Vấn đề chính là gì?"
            options={[
              "Bias quá cao — cần model phức tạp hơn",
              "Variance bùng nổ — model có 13 tham số fit 10 ràng buộc → overfitting cực độ",
              "Noise quá cao trong dữ liệu",
              "Cần tăng learning rate",
            ]}
            correct={1}
            explanation="Với bậc 12, model có 13 tham số trong khi chỉ có 10 ràng buộc. Đa thức sẽ đi qua mọi điểm train (MSE ≈ 0) nhưng dao động điên loạn giữa các điểm (hiện tượng Runge). Test MSE lớn vì variance cực cao. Giải pháp: giảm bậc, thêm dữ liệu, hoặc L2 regularize mạnh."
          />
        </div>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 6: GIẢI THÍCH + CODE
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <h3 className="text-lg font-semibold text-foreground">
            Định nghĩa hình thức
          </h3>
          <p>
            <strong>Bias-Variance Tradeoff</strong> là khái niệm nền tảng của
            lý thuyết học có giám sát: sai số kỳ vọng của một mô hình trên một
            điểm x bất kỳ có thể phân rã thành ba thành phần{" "}
            <em>không âm</em> và <em>không thể triệt tiêu đồng thời</em> với
            một lượng dữ liệu hữu hạn.
          </p>

          <h3 className="text-lg font-semibold text-foreground">
            Công thức phân rã (Geman, Bienenstock, Doursat 1992)
          </h3>
          <p>Cho bài toán hồi quy với nhiễu độc lập:</p>
          <LaTeX block>
            {
              "\\mathbb{E}\\big[(y - \\hat{y}(x))^2\\big] = \\text{Bias}^2[\\hat{y}(x)] + \\text{Var}[\\hat{y}(x)] + \\sigma^2"
            }
          </LaTeX>
          <p>Trong đó:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <LaTeX>
                {"\\text{Bias}[\\hat{y}(x)] = \\mathbb{E}[\\hat{y}(x)] - f(x)"}
              </LaTeX>{" "}
              — sai số hệ thống.
            </li>
            <li>
              <LaTeX>
                {
                  "\\text{Var}[\\hat{y}(x)] = \\mathbb{E}\\big[(\\hat{y}(x) - \\mathbb{E}[\\hat{y}(x)])^2\\big]"
                }
              </LaTeX>{" "}
              — độ dao động giữa các training set.
            </li>
            <li>
              <LaTeX>{"\\sigma^2"}</LaTeX> — noise không thể giảm (irreducible
              error).
            </li>
          </ul>

          <Callout variant="insight" title="'Dial độ phức tạp' của từng mô hình">
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Polynomial: bậc d.</li>
              <li>Decision Tree: max_depth, min_samples_leaf.</li>
              <li>Neural Network: số layer/neuron, epoch.</li>
              <li>KNN: k (k nhỏ = phức tạp cao).</li>
              <li>Regularization: λ lớn = phức tạp thấp.</li>
            </ul>
            <p className="mt-2">
              Xoay dial: bias² ↔ variance. Tổng có dạng chữ U — chọn điểm đáy
              qua{" "}
              <TopicLink slug="cross-validation">cross-validation</TopicLink>.
            </p>
          </Callout>

          <h3 className="text-lg font-semibold text-foreground">
            Code #1 — Chẩn đoán bằng learning curve
          </h3>
          <p>
            <code>learning_curve</code> của sklearn vẽ train và validation
            score theo kích thước tập huấn luyện — công cụ vàng để phát hiện
            bias vs variance.
          </p>

          <CodeBlock
            language="python"
            title="diagnose_learning_curve.py"
          >{`from sklearn.model_selection import learning_curve
from sklearn.tree import DecisionTreeRegressor
import numpy as np, matplotlib.pyplot as plt

model = DecisionTreeRegressor(max_depth=None)
train_sizes, train_scores, val_scores = learning_curve(
    model, X, y, cv=5,
    train_sizes=np.linspace(0.1, 1.0, 10),
    scoring="neg_mean_squared_error",
)
train_mse = -train_scores.mean(axis=1)
val_mse = -val_scores.mean(axis=1)

plt.plot(train_sizes, train_mse, label="Train MSE")
plt.plot(train_sizes, val_mse, label="Val MSE")
plt.xlabel("Training size"); plt.ylabel("MSE"); plt.legend(); plt.show()

gap = val_mse[-1] - train_mse[-1]
if gap > 0.1 * val_mse[-1]:
    print("⚠ Overfitting — variance cao")
elif val_mse[-1] > 2 * noise_floor:
    print("⚠ Underfitting — bias cao")
else:
    print("✓ Gần sweet spot")`}</CodeBlock>

          <h3 className="text-lg font-semibold text-foreground">
            Code #2 — Monte Carlo đo bias và variance trực tiếp
          </h3>
          <p>
            Cách trực tiếp nhất để &quot;nhìn thấy&quot; phân rã: sample nhiều
            dataset, fit nhiều model, so với hàm thật. Đây cũng chính là thuật
            toán chạy trong demo phía trên.
          </p>

          <CodeBlock
            language="python"
            title="bias_variance_mc.py"
          >{`import numpy as np
from numpy.polynomial import polynomial as P

def true_fn(x): return np.sin(2 * np.pi * x)

def sample_dataset(n=15, sigma=0.18, rng=None):
    rng = rng or np.random.default_rng()
    x = np.linspace(0, 1, n)
    return x, true_fn(x) + sigma * rng.standard_normal(n)

def mc_bias_variance(degree, K=200, sigma=0.18):
    x_test = np.linspace(0, 1, 41)
    f_true = true_fn(x_test)
    preds = np.zeros((K, 41))
    rng = np.random.default_rng(42)
    for k in range(K):
        x, y = sample_dataset(rng=rng)
        preds[k] = P.polyval(x_test, P.polyfit(x, y, degree))
    bias2 = ((preds.mean(axis=0) - f_true) ** 2).mean()
    variance = preds.var(axis=0).mean()
    return bias2, variance, bias2 + variance + sigma ** 2

for d in [1, 3, 6, 10, 15, 20]:
    b2, v, t = mc_bias_variance(d)
    print(f"d={d:2d}  bias²={b2:.3f}  var={v:.3f}  total={t:.3f}")`}</CodeBlock>

          <p>
            Chạy đoạn code trên bạn sẽ thấy đường cong chữ U cổ điển: d = 1-2
            bias² cao, variance thấp; d = 3-6 cả hai thấp; d = 15-20 variance
            bùng nổ trong khi bias² đã gần 0.
          </p>

          <Callout variant="tip" title="Công cụ giảm từng thành phần">
            <p className="mb-1">
              <strong>Giảm bias (underfit):</strong>
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Tăng độ phức tạp (layer, bậc cao hơn).</li>
              <li>Feature engineering: tương tác, đa thức, domain features.</li>
              <li>Giảm regularization (λ nhỏ hơn), train lâu hơn.</li>
            </ul>
            <p className="mt-2 mb-1">
              <strong>Giảm variance (overfit):</strong>
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Thêm dữ liệu — vũ khí mạnh nhất.</li>
              <li>
                <TopicLink slug="regularization">Regularization</TopicLink>{" "}
                L1/L2, dropout.
              </li>
              <li>
                Ensemble (Bagging,{" "}
                <TopicLink slug="random-forests">Random Forest</TopicLink>).
              </li>
              <li>Giảm phức tạp, early stopping, data augmentation.</li>
            </ul>
          </Callout>

          <Callout variant="info" title="So sánh mô hình qua lăng kính BV">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Linear Regression</strong>: bias cao, variance thấp.
              </li>
              <li>
                <strong>Decision Tree (sâu)</strong>: bias rất thấp, variance
                rất cao. Không ổn định.
              </li>
              <li>
                <strong>Random Forest</strong>: bias ≈ tree đơn lẻ, variance
                giảm mạnh nhờ averaging.
              </li>
              <li>
                <strong>Ridge / Lasso</strong>: bias tăng nhẹ, variance giảm
                đáng kể.
              </li>
              <li>
                <strong>Deep NN</strong>: bias rất thấp, variance cao. Cần
                regularization và data lớn.
              </li>
            </ul>
          </Callout>

          <h3 className="text-lg font-semibold text-foreground">
            Ứng dụng thực tế
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Hyperparameter tuning:</strong> grid/random search trên
              degree, max_depth, λ — chọn điểm val error thấp nhất.
            </li>
            <li>
              <strong>Model selection:</strong> so sánh linear vs polynomial
              vs RF qua cross-validation.
            </li>
            <li>
              <strong>Ensemble learning:</strong> bagging giảm variance,
              boosting giảm bias.
            </li>
            <li>
              <strong>Regularization tuning:</strong> λ, dropout rate,
              max_depth — tất cả là dial trade bias ↔ variance.
            </li>
            <li>
              <strong>Data collection:</strong> khi test error chạm noise
              floor, thêm data không giúp — phải cải thiện đo đạc.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground">
            Những sai lầm điển hình (pitfalls)
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Regularize mạnh mặc định — tạo underfit cho bài toán đơn giản.</li>
            <li>Dùng train set chọn hyperparameter → double dipping.</li>
            <li>Bỏ qua noise floor — cố đạt MSE dưới σ² là vô ích.</li>
            <li>Nhầm variance của model với variance của metric.</li>
            <li>Dùng chung random seed cho split và model init.</li>
          </ul>

          <p>
            Để tìm hiểu sâu hơn, xem{" "}
            <TopicLink slug="overfitting-underfitting">
              Overfitting vs Underfitting
            </TopicLink>{" "}
            và{" "}
            <TopicLink slug="cross-validation">Cross-Validation</TopicLink> —
            những công cụ thực tế giúp bạn điều hướng tradeoff này.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 7: TÓM TẮT — 6 điểm
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tổng kết">
        <MiniSummary
          title="Ghi nhớ về Bias-Variance Tradeoff"
          points={[
            "Tổng sai số kỳ vọng = Bias² + Variance + σ² (noise không thể giảm). Ba thành phần luôn không âm.",
            "Bias cao = sai hệ thống, mô hình quá đơn giản (underfitting). Variance cao = nhạy dữ liệu, mô hình quá phức tạp (overfitting).",
            "Tăng độ phức tạp: bias giảm nhưng variance tăng. Tổng sai số có dạng chữ U — sweet spot ở đáy.",
            "Chẩn đoán: train & val đều thấp → underfit; train cao, val thấp → overfit; cả hai cao → sweet spot.",
            "Giảm bias: tăng phức tạp, thêm feature, giảm regularization. Giảm variance: thêm data, regularize, ensemble (Random Forest).",
            "Learning curve và Monte Carlo là hai công cụ chẩn đoán trực quan nhất — vẽ và tin đường cong!",
          ]}
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 8: QUIZ
          ══════════════════════════════════════════════════════════════════ */}
      <QuizSection questions={QUIZ} />
    </>
  );
}
