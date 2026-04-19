"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Target as TargetIcon, Sparkles, RefreshCw } from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  ToggleCompare,
  SliderGroup,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bias-variance",
  title: "Bias-Variance Tradeoff",
  titleVi: "Bias và Variance",
  description:
    "Ẩn dụ bắn cung: bias là xa tâm, variance là đạn rải. Bốn tổ hợp xuất hiện khi bạn thay đổi độ phức tạp của mô hình.",
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

/* ────────────────────────────────────────────────────────────
   RANDOM — seeded noise so arrows/fits stay stable across renders
   ──────────────────────────────────────────────────────────── */
function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function gaussian(rng: () => number): number {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU — 4 tấm bia kinh điển
   ──────────────────────────────────────────────────────────── */

type ArcheryCase = {
  id: "LL" | "LH" | "HL" | "HH";
  title: string;
  tagline: string;
  bias: number;       // độ lệch tâm (px, dịch phải)
  variance: number;   // độ rải
  color: string;
  modelAnalogy: string;
  complexity: "simple" | "balanced" | "complex-random" | "bad";
};

const ARCHERY_CASES: ArcheryCase[] = [
  {
    id: "LL",
    title: "Bias thấp · Variance thấp",
    tagline: "Lý tưởng — như xạ thủ Olympic",
    bias: 0,
    variance: 8,
    color: "#10b981",
    modelAnalogy:
      "Mô hình vừa đủ phức tạp, có đủ dữ liệu để học ổn định. Tâm lệch rất ít, mũi tên chụm lại.",
    complexity: "balanced",
  },
  {
    id: "LH",
    title: "Bias thấp · Variance cao",
    tagline: "Overfit — như xạ thủ đang ốm",
    bias: 0,
    variance: 28,
    color: "#f59e0b",
    modelAnalogy:
      "Mô hình đủ linh hoạt để ngắm trúng tâm, nhưng quá nhạy với nhiễu dữ liệu — mỗi lần huấn luyện trên tập khác, đường tên bay lệch ngẫu nhiên.",
    complexity: "complex-random",
  },
  {
    id: "HL",
    title: "Bias cao · Variance thấp",
    tagline: "Underfit — ngắm sai nhưng sai đều",
    bias: 40,
    variance: 8,
    color: "#3b82f6",
    modelAnalogy:
      "Mô hình quá đơn giản, không nắm bắt được đường cong thật. Mũi tên chụm lại ở sai vị trí — luôn sai cùng một cách.",
    complexity: "simple",
  },
  {
    id: "HH",
    title: "Bias cao · Variance cao",
    tagline: "Tệ nhất — ngắm sai và bắn bừa",
    bias: 40,
    variance: 28,
    color: "#ef4444",
    modelAnalogy:
      "Mô hình sai từ cấu trúc và cũng không ổn định. Giải pháp: xem lại toàn bộ pipeline trước khi tinh chỉnh.",
    complexity: "bad",
  },
];

function generateShots(bias: number, variance: number, seed: number) {
  const rng = seededRng(seed);
  const shots: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 20; i++) {
    const g1 = gaussian(rng);
    const g2 = gaussian(rng);
    shots.push({
      x: bias + variance * g1 * 0.5,
      y: variance * g2 * 0.5,
    });
  }
  return shots;
}

/* ────────────────────────────────────────────────────────────
   POLY FIT — Compare degree 1 vs 10 on sin(2π x) + noise
   ──────────────────────────────────────────────────────────── */

type Point = { x: number; y: number };

const TRUE_POINTS: Point[] = [];
for (let i = 0; i <= 50; i++) {
  const x = i / 50;
  TRUE_POINTS.push({ x, y: Math.sin(2 * Math.PI * x) });
}

function generateNoisyData(seed: number, n = 15): Point[] {
  const rng = seededRng(seed);
  const data: Point[] = [];
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    const y = Math.sin(2 * Math.PI * x) + 0.2 * gaussian(rng);
    data.push({ x, y });
  }
  return data;
}

// Gauss-Jordan inverse for small matrices
function invert(M: number[][]): number[][] | null {
  const n = M.length;
  const A = M.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  for (let i = 0; i < n; i++) {
    let pivot = A[i][i];
    if (Math.abs(pivot) < 1e-12) {
      let swap = -1;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(A[k][i]) > 1e-12) {
          swap = k;
          break;
        }
      }
      if (swap < 0) return null;
      [A[i], A[swap]] = [A[swap], A[i]];
      pivot = A[i][i];
    }
    for (let j = 0; j < 2 * n; j++) A[i][j] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = A[k][i];
      for (let j = 0; j < 2 * n; j++) A[k][j] -= factor * A[i][j];
    }
  }
  return A.map((row) => row.slice(n));
}

function polyFit(data: Point[], degree: number, lambda = 1e-6): number[] {
  const n = data.length;
  const d = degree + 1;
  const X: number[][] = data.map((p) => {
    const row = [] as number[];
    let v = 1;
    for (let j = 0; j < d; j++) {
      row.push(v);
      v *= p.x;
    }
    return row;
  });
  const XT: number[][] = Array.from({ length: d }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < d; j++) XT[j][i] = X[i][j];
  const XTX: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += XT[i][k] * X[k][j];
      XTX[i][j] = s;
    }
  }
  for (let i = 0; i < d; i++) XTX[i][i] += lambda;
  const inv = invert(XTX);
  if (!inv) return new Array(d).fill(0);
  const XTy: number[] = new Array(d).fill(0);
  for (let i = 0; i < d; i++) {
    let s = 0;
    for (let k = 0; k < n; k++) s += XT[i][k] * data[k].y;
    XTy[i] = s;
  }
  const beta: number[] = new Array(d).fill(0);
  for (let i = 0; i < d; i++) {
    let s = 0;
    for (let j = 0; j < d; j++) s += inv[i][j] * XTy[j];
    beta[i] = s;
  }
  return beta;
}

function polyEval(beta: number[], x: number): number {
  let y = 0;
  let v = 1;
  for (let j = 0; j < beta.length; j++) {
    y += beta[j] * v;
    v *= x;
  }
  return y;
}

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Một mô hình đạt train accuracy 99% nhưng validation accuracy chỉ 70%. Đây là tình huống gì?",
    options: [
      "Underfitting — bias cao, cần tăng phức tạp",
      "Overfitting — variance cao, cần giảm phức tạp hoặc thêm dữ liệu",
      "Sweet spot — kết quả đã tối ưu",
      "Dữ liệu sai — cần thu thập lại",
    ],
    correct: 1,
    explanation:
      "Khoảng cách lớn giữa train và validation (29%) là dấu hiệu overfitting kinh điển. Mô hình thuộc lòng dữ liệu huấn luyện nhưng không khái quát. Giải pháp: thêm dữ liệu, regularization, giảm phức tạp, hoặc ensemble.",
  },
  {
    question:
      "Hồi quy tuyến tính cho dữ liệu có dạng parabol — đây là bias cao hay variance cao?",
    options: [
      "Variance cao — mô hình quá nhạy",
      "Bias cao — mô hình quá đơn giản, đường thẳng không bắt được đường cong",
      "Cả hai đều thấp",
      "Không thể xác định",
    ],
    correct: 1,
    explanation:
      "Đường thẳng không thể mô tả được parabol — đây là sai số hệ thống (bias cao). Dù thêm dữ liệu, đường thẳng vẫn sai. Cần mô hình phức tạp hơn (polynomial degree 2 trở lên).",
  },
  {
    type: "fill-blank",
    question:
      "Khi độ phức tạp mô hình tăng, {blank} giảm nhưng {blank} tăng. Tổng sai số có hình chữ {blank}.",
    blanks: [
      { answer: "bias", accept: ["Bias", "bias²"] },
      { answer: "variance", accept: ["Variance"] },
      { answer: "U", accept: ["U", "hình U"] },
    ],
    explanation:
      "Đây là bản chất của đánh đổi Bias-Variance: phức tạp tăng → bias giảm, variance tăng. Tổng sai số có hình chữ U với 'sweet spot' ở đáy.",
  },
  {
    question:
      "Random Forest thường so với một cây Decision Tree sâu có đặc điểm gì?",
    options: [
      "Bias cao hơn, variance thấp hơn",
      "Bias gần như bằng nhau, variance thấp hơn nhiều nhờ trung bình hoá",
      "Bias thấp hơn, variance cao hơn",
      "Cả hai đều kém hơn",
    ],
    correct: 1,
    explanation:
      "Mỗi cây sâu có bias thấp (linh hoạt) và variance cao. Random Forest trung bình nhiều cây độc lập — variance giảm mạnh (nhiễu ngẫu nhiên triệt tiêu) còn bias gần như giữ nguyên. Đây là nguyên tắc vàng của ensemble.",
  },
  {
    question:
      "Irreducible error (σ² — noise của chính dữ liệu) có thể giảm bằng cách nào?",
    options: [
      "Thêm dữ liệu huấn luyện",
      "Tăng độ phức tạp của mô hình",
      "Cải thiện chất lượng đo đạc dữ liệu (cảm biến tốt hơn, định nghĩa chặt hơn, loại outlier)",
      "Không thể giảm — σ² là hằng số của vũ trụ",
    ],
    correct: 2,
    explanation:
      "σ² phản ánh nhiễu trong chính dữ liệu — không phụ thuộc mô hình. Thêm data, regularize không giảm được nó. Cách duy nhất là nâng chất lượng dữ liệu đầu vào: thiết bị đo tốt hơn, định nghĩa nhãn rõ ràng hơn, xử lý outlier.",
  },
  {
    question:
      "Bạn fit đa thức bậc 10 cho 12 điểm dữ liệu. Train MSE = 0.00, Test MSE = 4.5. Vấn đề chính là gì?",
    options: [
      "Bias quá cao — cần mô hình phức tạp hơn nữa",
      "Variance bùng nổ — mô hình thuộc lòng 12 điểm nhưng dao động dữ dội giữa chúng",
      "Thiếu regularization, nên thêm dropout",
      "Learning rate quá cao",
    ],
    correct: 1,
    explanation:
      "11 tham số fit 12 ràng buộc → đa thức đi qua gần hết điểm train (train MSE ≈ 0) nhưng oscillate kinh khủng ở khoảng giữa — hiện tượng Runge. Test MSE lớn vì variance cực cao. Giải pháp: giảm bậc, thêm dữ liệu, hoặc regularization mạnh.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT — TARGET (1 tấm bia cho 1 archery case)
   ──────────────────────────────────────────────────────────── */

function ArcheryTarget({
  archCase,
  selected,
  onSelect,
}: {
  archCase: ArcheryCase;
  selected: boolean;
  onSelect: () => void;
}) {
  const shots = useMemo(
    () => generateShots(archCase.bias, archCase.variance, 7 + archCase.id.charCodeAt(0) + archCase.id.charCodeAt(1)),
    [archCase]
  );
  const cx = 100;
  const cy = 100;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative rounded-xl border-2 p-2 text-left transition-all"
      style={{
        borderColor: selected ? archCase.color : "var(--border)",
        backgroundColor: selected ? archCase.color + "15" : "var(--bg-card)",
      }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full"
        role="img"
        aria-label={archCase.title}
      >
        {[60, 40, 20].map((r, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={i === 0 ? "#fee2e2" : i === 1 ? "#fecaca" : "#fca5a5"}
            stroke="#ef4444"
            strokeWidth={0.8}
          />
        ))}
        <circle cx={cx} cy={cy} r={3} fill="#7f1d1d" />
        {shots.map((s, i) => (
          <circle
            key={i}
            cx={cx + s.x}
            cy={cy + s.y}
            r={3.5}
            fill={archCase.color}
            stroke="white"
            strokeWidth={1}
            opacity={0.85}
          />
        ))}
      </svg>
      <div className="mt-2 px-1">
        <div className="text-[11px] font-bold" style={{ color: archCase.color }}>
          {archCase.title}
        </div>
        <div className="text-[10px] text-muted leading-tight">
          {archCase.tagline}
        </div>
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT — ERROR CURVE (under SliderGroup)
   ──────────────────────────────────────────────────────────── */

function ErrorCurveVisualization({
  values,
}: {
  values: Record<string, number>;
}) {
  const complexity = values.complexity;
  // Synthetic bias/variance/total curves over complexity 1..20
  const points = Array.from({ length: 20 }, (_, i) => {
    const c = i + 1;
    const bias2 = 1.2 * Math.pow(1 / c, 1.5);
    const variance = 0.05 + 0.015 * Math.pow(c, 1.3);
    const total = bias2 + variance + 0.04;
    return { c, bias2, variance, total };
  });
  const maxY = Math.max(...points.map((p) => p.total)) * 1.1;

  const xAt = (c: number) => 30 + ((c - 1) / 19) * 220;
  const yAt = (v: number) => 10 + (1 - v / maxY) * 130;

  const biasPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(p.c).toFixed(1)},${yAt(p.bias2).toFixed(1)}`)
    .join(" ");
  const varPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(p.c).toFixed(1)},${yAt(p.variance).toFixed(1)}`)
    .join(" ");
  const totalPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(p.c).toFixed(1)},${yAt(p.total).toFixed(1)}`)
    .join(" ");

  const current = points[Math.min(19, Math.max(0, complexity - 1))];
  const curX = xAt(current.c);

  const zone =
    complexity <= 3
      ? "Underfit — bias cao"
      : complexity <= 8
        ? "Sweet spot — cân bằng"
        : "Overfit — variance cao";
  const zoneColor =
    complexity <= 3 ? "#3b82f6" : complexity <= 8 ? "#10b981" : "#f59e0b";

  return (
    <div className="w-full space-y-3">
      <svg viewBox="0 0 280 160" className="w-full" role="img" aria-label="Đường cong bias-variance">
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = 10 + (1 - t) * 130;
          return (
            <line
              key={t}
              x1={30}
              y1={y}
              x2={250}
              y2={y}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.5}
            />
          );
        })}
        <path d={biasPath} fill="none" stroke="#3b82f6" strokeWidth={2} />
        <path d={varPath} fill="none" stroke="#f59e0b" strokeWidth={2} />
        <path d={totalPath} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 3" />
        <motion.line
          x1={curX}
          y1={10}
          x2={curX}
          y2={140}
          stroke={zoneColor}
          strokeWidth={1.5}
          animate={{ x1: curX, x2: curX }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        />
        <text x={30} y={155} fontSize={9} fill="currentColor" className="text-muted">
          Đơn giản
        </text>
        <text x={250} y={155} fontSize={9} fill="currentColor" className="text-muted" textAnchor="end">
          Phức tạp
        </text>
      </svg>
      <div className="flex flex-wrap gap-3 text-[11px] justify-center">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-[#3b82f6]" /> Bias²
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-[#f59e0b]" /> Variance
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-0.5 w-4"
            style={{ backgroundColor: "#ef4444", borderTop: "2px dashed #ef4444" }}
          />{" "}
          Tổng sai số
        </span>
      </div>
      <div
        className="rounded-lg px-3 py-2 text-center text-sm font-semibold"
        style={{ backgroundColor: zoneColor + "22", color: zoneColor }}
      >
        Độ phức tạp = {complexity}/20 → {zone}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT — POLY FIT overlay for ToggleCompare
   ──────────────────────────────────────────────────────────── */

function PolyFitChart({ degree, seed }: { degree: number; seed: number }) {
  const data = useMemo(() => generateNoisyData(seed), [seed]);
  const beta = useMemo(() => polyFit(data, degree), [data, degree]);
  const fitPoints = useMemo(() => {
    const pts: Point[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = i / 100;
      pts.push({ x, y: polyEval(beta, x) });
    }
    return pts;
  }, [beta]);

  const W = 320;
  const H = 200;
  const padL = 30;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const xAt = (x: number) => padL + x * (W - padL - padR);
  const yAt = (y: number) => padT + ((1 - (y + 1.5) / 3) * (H - padT - padB));

  const truePath = TRUE_POINTS.map(
    (p, i) => `${i === 0 ? "M" : "L"}${xAt(p.x).toFixed(1)},${yAt(p.y).toFixed(1)}`
  ).join(" ");
  const fitPath = fitPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(p.x).toFixed(1)},${yAt(p.y).toFixed(1)}`)
    .join(" ");

  const color = degree <= 2 ? "#3b82f6" : degree <= 6 ? "#10b981" : "#ef4444";

  // train MSE
  let trainMSE = 0;
  for (const p of data) {
    const e = p.y - polyEval(beta, p.x);
    trainMSE += e * e;
  }
  trainMSE /= data.length;

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Đa thức bậc ${degree}`}>
        {[-1, 0, 1].map((v) => (
          <line
            key={v}
            x1={padL}
            y1={yAt(v)}
            x2={W - padR}
            y2={yAt(v)}
            stroke="currentColor"
            className="text-border"
            strokeWidth={0.5}
          />
        ))}
        <path d={truePath} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" />
        <motion.path
          d={fitPath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          initial={false}
          animate={{ d: fitPath }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
        {data.map((p, i) => (
          <circle
            key={i}
            cx={xAt(p.x)}
            cy={yAt(p.y)}
            r={3.5}
            fill="#0ea5e9"
            stroke="white"
            strokeWidth={1}
          />
        ))}
        <text x={padL} y={H - 10} fontSize={9} fill="currentColor" className="text-muted">
          0
        </text>
        <text x={W - padR} y={H - 10} fontSize={9} fill="currentColor" className="text-muted" textAnchor="end">
          1
        </text>
      </svg>
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex gap-3 text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 bg-[#94a3b8] opacity-60" /> Hàm thật
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: color }} /> Đa thức bậc {degree}
          </span>
        </div>
        <span className="tabular-nums text-muted">
          Train MSE = {trainMSE.toFixed(3)}
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT PHỤ — ModelRow & DiagnosisStep
   ──────────────────────────────────────────────────────────── */

function badgeColor(label: string): string {
  if (label.includes("Rất cao")) return "#dc2626";
  if (label.includes("Cao")) return "#f59e0b";
  if (label.includes("Trung")) return "#64748b";
  if (label.includes("Rất thấp")) return "#059669";
  if (label.includes("Thấp")) return "#10b981";
  if (label.includes("Tăng")) return "#f59e0b";
  if (label.includes("Giảm")) return "#10b981";
  return "#64748b";
}

function ModelRow({
  name,
  bias,
  variance,
  note,
}: {
  name: string;
  bias: string;
  variance: string;
  note: string;
}) {
  return (
    <tr className="border-t border-border">
      <td className="p-2 font-semibold text-foreground">{name}</td>
      <td className="p-2 text-center">
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            backgroundColor: badgeColor(bias) + "22",
            color: badgeColor(bias),
          }}
        >
          {bias}
        </span>
      </td>
      <td className="p-2 text-center">
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            backgroundColor: badgeColor(variance) + "22",
            color: badgeColor(variance),
          }}
        >
          {variance}
        </span>
      </td>
      <td className="p-2 text-muted">{note}</td>
    </tr>
  );
}

function DiagnosisStep({
  num,
  q,
  yes,
  no,
  color,
}: {
  num: number;
  q: string;
  yes: string;
  no: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {num}
        </span>
        <span className="text-sm font-semibold text-foreground">{q}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-2">
          <strong className="text-emerald-600">Có &rarr;</strong>{" "}
          <span className="text-foreground/80">{yes}</span>
        </div>
        <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-2">
          <strong className="text-rose-600">Không &rarr;</strong>{" "}
          <span className="text-foreground/80">{no}</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENT CHÍNH
   ════════════════════════════════════════════════════════════ */

export default function BiasVarianceTopic() {
  const [selectedCase, setSelectedCase] = useState<ArcheryCase["id"]>("LL");
  const activeCase = ARCHERY_CASES.find((c) => c.id === selectedCase)!;

  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn bắn 10 mũi tên. Cả 10 mũi đều lệch tâm sang phải 20cm nhưng chụm sát nhau thành một cụm nhỏ. Bạn đang gặp vấn đề gì?"
          options={[
            "Tập trung kém — cần bắn chậm lại để chụm hơn",
            "Ngắm sai — sai hệ thống cùng chiều. Cần chỉnh thước ngắm sang trái 20cm.",
            "Tên bị cong — cần đổi tên",
            "Thời tiết — cần đợi gió lặng",
          ]}
          correct={1}
          explanation="Khi mọi mũi tên lệch cùng hướng, đó là sai hệ thống — gọi là bias cao. Sự chụm lại (variance thấp) cho biết bạn đang ổn định, chỉ cần chỉnh điểm ngắm. Trong ML, mô hình underfit có đúng tính chất này: sai nhất quán, sửa bằng cách tăng độ phức tạp chứ không phải tăng dữ liệu."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Mô hình ML cũng &ldquo;bắn cung&rdquo; vào kết quả đúng. Hôm nay bạn sẽ thấy <strong>bốn tổ hợp</strong>{" "}
            bias–variance hiện ra thành bốn tấm bia. Biết đang ở tấm bia nào, bạn biết phải chỉnh gì.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ BẮN CUNG (4 tấm bia) ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Bốn tấm bia">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TargetIcon size={20} className="text-accent" /> Bốn tổ hợp bias × variance
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Bốn tấm bia dưới đây tái hiện bốn tình huống huấn luyện mô hình. Click vào từng tấm để xem
            mô hình tương ứng trông như thế nào — và tại sao cả hai chiều (xa tâm và rải) đều quan trọng.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ARCHERY_CASES.map((c) => (
              <ArcheryTarget
                key={c.id}
                archCase={c}
                selected={c.id === selectedCase}
                onSelect={() => setSelectedCase(c.id)}
              />
            ))}
          </div>

          <motion.div
            key={activeCase.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border p-4 mt-3"
            style={{
              borderLeft: `4px solid ${activeCase.color}`,
              backgroundColor: activeCase.color + "12",
            }}
          >
            <div className="text-sm font-semibold text-foreground mb-1">
              Mô hình tương ứng: {activeCase.title}
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              {activeCase.modelAnalogy}
            </p>
          </motion.div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TRỰC QUAN HOÁ CHÍNH (slider độ phức tạp) ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Đây là quan sát cốt lõi: <strong>độ phức tạp mô hình</strong> là một cái nút. Kéo nút lên —
            bias giảm, variance tăng. Kéo xuống — bias tăng, variance giảm. Tổng sai số có hình chữ U,
            và bạn đang đi tìm đáy chữ U đó.
          </p>

          <SliderGroup
            title="Kéo thanh độ phức tạp để xem ba đường cong"
            sliders={[
              {
                key: "complexity",
                label: "Độ phức tạp của mô hình (số bậc, số layer, số feature…)",
                min: 1,
                max: 20,
                step: 1,
                defaultValue: 6,
              },
            ]}
            visualization={(values) => <ErrorCurveVisualization values={values} />}
          />

          <Callout variant="insight" title="Ba điều bạn vừa thấy">
            <ul className="list-disc pl-5 space-y-0.5 mt-1">
              <li>
                <strong>Đường xanh (Bias²):</strong> luôn giảm khi tăng phức tạp — mô hình nhiều
                tham số thì bắt được nhiều mẫu hơn.
              </li>
              <li>
                <strong>Đường cam (Variance):</strong> luôn tăng khi tăng phức tạp — mô hình nhạy
                hơn với từng mẫu dữ liệu cụ thể.
              </li>
              <li>
                <strong>Đường đỏ đứt (Tổng):</strong> hình chữ U. Đáy chữ U là điểm bạn nên chọn —
                gọi là <em>sweet spot</em>.
              </li>
            </ul>
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          <strong>Bias-Variance Tradeoff</strong> không phải là lỗi cần sửa — nó là bản chất toán học
          của việc học từ dữ liệu có hạn. Ngắm trúng tâm (bias thấp) và bắn ổn định (variance thấp) là{" "}
          <em>hai kỹ năng khác nhau</em>.
          <br />
          <br />
          Biết mô hình của bạn đang ở đâu trên trục bias-variance, bạn biết phải thêm gì: thêm độ
          phức tạp để giảm bias, thêm dữ liệu hay ensemble để giảm variance, cải thiện đo đạc để
          giảm noise. Không có <em>một viên đạn bạc</em> — có ba loại thuốc cho ba loại bệnh.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — ĐI SÂU: COMPARE BẬC 1 vs BẬC 10 ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Đi sâu">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Cùng một dữ liệu, hai mô hình — kết quả trái ngược
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            15 điểm dữ liệu được sinh từ hàm sin + nhiễu nhẹ. Bấm qua lại giữa bậc 1 (đường thẳng) và
            bậc 10 (đa thức cong) để thấy hai đầu cực đoan của thang bias-variance.
          </p>

          <ToggleCompare
            labelA="Đa thức bậc 1 (underfit)"
            labelB="Đa thức bậc 10 (overfit)"
            description="Cùng 15 điểm dữ liệu, hai mức độ phức tạp cực đoan."
            childA={
              <div className="space-y-3">
                <PolyFitChart degree={1} seed={42} />
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Bias rất cao.</strong> Đường thẳng không thể mô phỏng đường sin. Mô hình
                    sai nhất quán ở cả hai đầu — không thể sửa bằng thêm dữ liệu. Cần tăng độ phức tạp
                    (bậc cao hơn).
                  </p>
                </div>
              </div>
            }
            childB={
              <div className="space-y-3">
                <PolyFitChart degree={10} seed={42} />
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    <strong>Variance bùng nổ.</strong> Đa thức đi qua gần hết điểm, nhưng dao động dữ
                    dội ở giữa. Train MSE rất thấp nhưng test MSE cao — hiện tượng Runge. Cần giảm
                    bậc, thêm dữ liệu, hoặc regularization (Ridge, Lasso).
                  </p>
                </div>
              </div>
            }
          />

          <Callout variant="tip" title="Bạn đọc learning curve thế nào?">
            <ul className="list-disc pl-5 space-y-0.5">
              <li><strong>Train thấp, val thấp:</strong> underfit → tăng phức tạp.</li>
              <li><strong>Train cao, val thấp (gap lớn):</strong> overfit → thêm dữ liệu, regularize.</li>
              <li><strong>Cả hai cao, gap nhỏ:</strong> bạn đang ở sweet spot — đủ tốt rồi.</li>
              <li>
                <strong>Val &gt; Train:</strong> hiếm gặp, thường là rò rỉ dữ liệu giữa train và val —
                kiểm tra lại pipeline.
              </li>
            </ul>
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — THỬ THÁCH ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn có 500 ảnh chó/mèo và train một mạng deep learning 50 triệu tham số. Train accuracy = 100%, val accuracy = 65%. Bạn đang ở bên nào của đường cong chữ U?"
          options={[
            "Bên trái — underfit, cần mô hình lớn hơn nữa",
            "Bên phải — overfit, cần thêm dữ liệu hoặc giảm phức tạp",
            "Đúng đáy — kết quả đã tối ưu",
            "Không thể xác định nếu chưa biết loss function",
          ]}
          correct={1}
          explanation="50 triệu tham số so với 500 ảnh là tỉ lệ rất mất cân. Mạng học thuộc từng ảnh (train 100%) nhưng không khái quát (val 65%). Giải pháp theo thứ tự: data augmentation, pretrained backbone (transfer learning), regularization (dropout, weight decay), hoặc chọn kiến trúc nhỏ hơn. Đây là bên phải đường cong chữ U."
        />

        <div className="mt-5">
          <InlineChallenge
            question="Nhóm nghiên cứu cá ngừ đo 8 đặc điểm của cá để dự đoán tuổi. Mô hình hồi quy tuyến tính cho R² = 0.4 trên cả train và val. Vấn đề là gì?"
            options={[
              "Overfit — cần giảm feature và regularize",
              "Underfit — mối quan hệ giữa 8 đặc điểm và tuổi có thể phi tuyến, cần mô hình phức tạp hơn (polynomial, tree-based)",
              "Noise quá cao — nên bỏ dự án",
              "Thiếu dữ liệu — nên đo thêm 10 đặc điểm nữa",
            ]}
            correct={1}
            explanation="Train và val cùng thấp là đặc điểm underfit — bias cao. Mô hình tuyến tính đơn giản không nắm được đường cong. Hướng đi: thử polynomial regression, random forest, hoặc gradient boosting. Nếu các mô hình phi tuyến cũng không cải thiện, khi đó mới nên nghi ngờ chất lượng dữ liệu hoặc noise."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — GIẢI THÍCH (công thức + trực quan) ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Với bài toán hồi quy có nhiễu độc lập (ký hiệu nhiễu là{" "}
            <span className="font-mono text-sm">ε</span>, phương sai{" "}
            <span className="font-mono text-sm">σ²</span>), giá trị quan sát được là{" "}
            <span className="font-mono text-sm">y = f(x) + ε</span>. Sai số kỳ vọng của dự đoán{" "}
            <span className="font-mono text-sm">ŷ(x)</span> — lấy trung bình trên nhiều tập huấn
            luyện khả dĩ — phân rã đẹp đẽ thành <strong>ba thành phần</strong> không âm:
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-5 my-4">
            <LaTeX block>
              {"\\mathbb{E}\\big[(y - \\hat{y}(x))^2\\big] = \\underbrace{\\big(\\mathbb{E}[\\hat{y}(x)] - f(x)\\big)^2}_{\\text{Bias}^2} + \\underbrace{\\text{Var}[\\hat{y}(x)]}_{\\text{Variance}} + \\underbrace{\\sigma^2}_{\\text{Noise}}"}
            </LaTeX>
            <p className="text-xs text-muted mt-2 text-center italic">
              Ba số hạng này luôn không âm và không thể triệt tiêu đồng thời với một lượng dữ liệu hữu hạn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="rounded-xl border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                  Bias²
                </span>
                <span className="text-sm font-semibold text-foreground">Sai số hệ thống</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Khoảng cách trung bình từ dự đoán của mô hình đến giá trị thật. Cao khi mô hình quá
                đơn giản so với hàm cần học.
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                <strong>Giảm bằng:</strong> tăng độ phức tạp, thêm feature, giảm regularization.
              </p>
            </div>
            <div className="rounded-xl border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                  Variance
                </span>
                <span className="text-sm font-semibold text-foreground">Dao động giữa tập huấn luyện</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Mô hình thay đổi bao nhiêu khi bạn huấn luyện lại trên tập dữ liệu khác cùng phân
                phối. Cao khi mô hình quá nhạy với nhiễu.
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                <strong>Giảm bằng:</strong> thêm dữ liệu, regularization, ensemble, giảm phức tạp.
              </p>
            </div>
            <div className="rounded-xl border-l-4 border-l-rose-500 bg-rose-50 dark:bg-rose-900/20 p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-800 text-rose-800 dark:text-rose-200">
                  σ²
                </span>
                <span className="text-sm font-semibold text-foreground">Noise không thể giảm</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Nhiễu vốn có của chính dữ liệu — không phụ thuộc mô hình. Là giới hạn dưới của sai số
                mà bạn có thể đạt được.
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                <strong>Giảm bằng:</strong> cải thiện đo đạc, định nghĩa nhãn, loại outlier dữ liệu.
              </p>
            </div>
          </div>

          <p className="leading-relaxed">
            Công thức thứ hai đáng nhớ là <strong>phân rã Bias–Variance cho một điểm dự đoán</strong>.
            Hai thành phần Bias² và Variance cạnh tranh nhau qua &ldquo;cái nút&rdquo; độ phức tạp:
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-5 my-4">
            <LaTeX block>
              {"\\text{Total Error}(x) = \\text{Bias}^2[\\hat{y}(x)] + \\text{Var}[\\hat{y}(x)] + \\sigma^2"}
            </LaTeX>
            <p className="text-xs text-muted mt-2 text-center italic">
              Khi tăng phức tạp: Bias² ↓ nhưng Variance ↑. Tổng có hình chữ U.
            </p>
          </div>

          <Callout variant="info" title="'Cái nút' độ phức tạp hiện diện trong mọi mô hình">
            <ul className="list-disc pl-5 space-y-0.5 mt-1">
              <li><strong>Polynomial regression:</strong> bậc d.</li>
              <li><strong>Decision tree:</strong> max_depth, min_samples_leaf.</li>
              <li><strong>Neural network:</strong> số layer, số neuron, epoch huấn luyện.</li>
              <li><strong>KNN:</strong> k (k nhỏ = phức tạp cao).</li>
              <li><strong>Regularization:</strong> λ lớn = phức tạp thấp hơn.</li>
            </ul>
            <p className="mt-2 text-sm">
              Dù tên gọi khác nhau, tất cả đều xoay cùng một trục bias ↔ variance. Cách tìm điểm tối
              ưu trong thực tế:{" "}
              <TopicLink slug="cross-validation">cross-validation</TopicLink>.
            </p>
          </Callout>

          <Callout variant="warning" title="Bốn sai lầm hay gặp">
            <ol className="list-decimal pl-5 space-y-0.5 mt-1">
              <li>Chọn mô hình dựa trên train error — luôn dẫn đến model phức tạp nhất, tức overfit.</li>
              <li>Regularize &ldquo;theo mặc định&rdquo; mà không tune λ — có thể gây underfit ngược.</li>
              <li>So sánh model nhiều feature bằng R² thô — R² chỉ tăng khi thêm feature, kể cả feature rác.</li>
              <li>Không cố định random seed khi so sánh — variance giữa các seed che lấp khác biệt thật.</li>
            </ol>
          </Callout>

          {/* Map of popular models on the bias-variance axis */}
          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Bản đồ bias-variance cho các mô hình phổ biến
          </h4>
          <p className="text-sm leading-relaxed mb-3">
            Khi nhìn qua lăng kính bias–variance, các mô hình ML cổ điển xếp khá rõ ràng. Bảng dưới
            đây là điểm xuất phát — không phải chân lý tuyệt đối, vì các hyperparameter có thể đẩy
            một mô hình đi theo hướng khác.
          </p>

          <div className="rounded-xl border border-border overflow-hidden my-3">
            <table className="w-full text-sm">
              <thead className="bg-surface/60 border-b border-border">
                <tr>
                  <th className="text-left p-2 font-semibold text-foreground">Mô hình</th>
                  <th className="text-center p-2 font-semibold text-blue-500">Bias</th>
                  <th className="text-center p-2 font-semibold text-amber-500">Variance</th>
                  <th className="text-left p-2 font-semibold text-foreground">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <ModelRow
                  name="Linear regression"
                  bias="Cao"
                  variance="Thấp"
                  note="An toàn, dễ giải thích. Underfit với dữ liệu phi tuyến."
                />
                <ModelRow
                  name="Decision tree (sâu)"
                  bias="Rất thấp"
                  variance="Rất cao"
                  note="Linh hoạt nhưng nhạy. Không ổn định — thay vài mẫu là cây khác hẳn."
                />
                <ModelRow
                  name="Random Forest"
                  bias="Gần với tree đơn"
                  variance="Thấp"
                  note="Trung bình nhiều cây → variance giảm mạnh, bias gần như không đổi."
                />
                <ModelRow
                  name="KNN (k nhỏ)"
                  bias="Thấp"
                  variance="Cao"
                  note="k=1 gần như thuộc lòng train. Tăng k để giảm variance."
                />
                <ModelRow
                  name="Ridge / Lasso"
                  bias="Tăng nhẹ"
                  variance="Giảm"
                  note="Penalty L2/L1 kéo trọng số về 0, giảm dao động giữa các tập."
                />
                <ModelRow
                  name="Deep Neural Network"
                  bias="Rất thấp"
                  variance="Cao"
                  note="Cần regularization (dropout, weight decay) + dữ liệu lớn để ổn định."
                />
                <ModelRow
                  name="Gradient Boosting"
                  bias="Thấp dần theo boost"
                  variance="Tăng dần"
                  note="Mỗi cây thêm vào giảm bias nhưng tăng variance — early stopping là chìa khoá."
                />
              </tbody>
            </table>
          </div>

          {/* Diagnosis decision tree */}
          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Sơ đồ chẩn đoán nhanh khi mô hình chưa tốt
          </h4>
          <p className="text-sm leading-relaxed mb-3">
            Bốn câu hỏi dưới đây giúp bạn quyết định bước tiếp theo cần làm. Đừng bỏ qua bước 1 — đa
            số người nhảy thẳng sang &ldquo;đổi mô hình&rdquo; trước khi hiểu mình đang ở đâu.
          </p>

          <div className="space-y-2 my-4">
            <DiagnosisStep
              num={1}
              q="Train error có thấp không?"
              yes="Tiếp bước 2 — mô hình đủ phức tạp."
              no="Underfit. Tăng độ phức tạp, thêm feature, giảm regularization. Đừng thêm dữ liệu vội."
              color="#3b82f6"
            />
            <DiagnosisStep
              num={2}
              q="Gap giữa train và validation có lớn không?"
              yes="Overfit. Thêm dữ liệu, regularize, ensemble, giảm phức tạp."
              no="Tiếp bước 3 — mô hình khái quát ổn."
              color="#f59e0b"
            />
            <DiagnosisStep
              num={3}
              q="Validation error có đạt target business?"
              yes="Tiếp bước 4 — gần như xong."
              no="Sweet spot nhưng chưa đủ tốt. Cân nhắc feature engineering, thay đổi kiến trúc, hoặc tăng chất lượng dữ liệu."
              color="#10b981"
            />
            <DiagnosisStep
              num={4}
              q="Validation có ổn định giữa các lần chạy?"
              yes="Xong. Deploy và giám sát."
              no="Kiểm tra random seed, data leakage, imbalanced splits trước khi tin vào con số."
              color="#a855f7"
            />
          </div>

          <p className="mt-4 leading-relaxed">
            Nếu bạn muốn đi sâu hơn, xem{" "}
            <TopicLink slug="overfitting-underfitting">Overfitting vs Underfitting</TopicLink> để thấy
            các dấu hiệu cụ thể và{" "}
            <TopicLink slug="regularization">Regularization</TopicLink> cho các kỹ thuật như L1/L2,
            dropout. Sau đó{" "}
            <TopicLink slug="random-forests">Random Forest</TopicLink> minh hoạ cách ensemble giảm
            variance mà không tăng bias — một trong những &ldquo;cú nhảy&rdquo; quan trọng nhất trong ML cổ điển.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt & Kiểm tra">
        <MiniSummary
          title="6 điều mang theo ra khỏi bài"
          points={[
            "Tổng sai số = Bias² + Variance + σ². Ba thành phần luôn không âm và không thể triệt tiêu cùng lúc.",
            "Bias cao = sai hệ thống, mô hình quá đơn giản (underfit). Variance cao = quá nhạy, mô hình quá phức tạp (overfit).",
            "Tăng phức tạp: bias giảm, variance tăng. Tổng có hình chữ U — sweet spot ở đáy.",
            "Chẩn đoán: train & val đều thấp → underfit. Train cao, val thấp → overfit. Cả hai cao → sweet spot.",
            "Giảm bias: tăng phức tạp, thêm feature. Giảm variance: thêm dữ liệu, regularize, ensemble.",
            "σ² là giới hạn dưới — không thể giảm bằng mô hình. Cải thiện chất lượng dữ liệu là cách duy nhất.",
          ]}
        />

        <Callout variant="tip" title="Xem ứng dụng thực tế">
          Câu chuyện Netflix Prize 1 triệu đô và vì sao đội thắng cần 800+ mô hình:{" "}
          <TopicLink slug="bias-variance-in-netflix-prize">
            Bias-Variance trong Netflix Prize
          </TopicLink>
          .
        </Callout>

        <QuizSection questions={quizQuestions} />

        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Sparkles size={12} />
            Một khái niệm — hiện diện trong mọi mô hình ML.
          </div>
        </div>
      </LessonSection>

      {/* Tiny refresh icon usage just to keep import referenced when needed */}
      <div className="sr-only">
        <RefreshCw />
      </div>
    </>
  );
}
