"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Brain,
  Sparkles,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Circle,
  Dot,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LaTeX,
  TopicLink,
  StepReveal,
  ToggleCompare,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ════════════════════════════════════════════════════════════════════════
   METADATA
   ════════════════════════════════════════════════════════════════════════ */
export const metadata: TopicMeta = {
  slug: "overfitting-underfitting",
  title: "Overfitting & Underfitting",
  titleVi: "Học quá khớp vs học chưa đủ — Overfit & Underfit",
  description:
    "Hai thái cực ngược nhau khi luyện mô hình. Học thuộc đề cũ → chết khi đề mới (overfit). Học mỗi lý thuyết → nhớ nhưng không làm nổi (underfit).",
  category: "classic-ml",
  tags: ["training", "generalization", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["regularization", "cross-validation", "bias-variance"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ════════════════════════════════════════════════════════════════════════
   DATA — 12 điểm train + 8 điểm test, nằm quanh đường cong "thật"
   y = sin(x) + x/4 với nhiễu nhỏ.
   ════════════════════════════════════════════════════════════════════════ */
type Pt = { x: number; y: number };

const TRAIN_POINTS: Pt[] = [
  { x: 0.3, y: 0.38 },
  { x: 0.9, y: 0.95 },
  { x: 1.4, y: 1.22 },
  { x: 2.0, y: 1.35 },
  { x: 2.7, y: 0.95 },
  { x: 3.3, y: 0.58 },
  { x: 3.9, y: 0.38 },
  { x: 4.5, y: 0.25 },
  { x: 5.1, y: 0.42 },
  { x: 5.7, y: 1.05 },
  { x: 6.2, y: 1.78 },
  { x: 6.8, y: 2.25 },
];

const TEST_POINTS: Pt[] = [
  { x: 0.6, y: 0.7 },
  { x: 1.7, y: 1.35 },
  { x: 2.4, y: 1.15 },
  { x: 3.0, y: 0.72 },
  { x: 3.6, y: 0.45 },
  { x: 4.8, y: 0.3 },
  { x: 5.4, y: 0.65 },
  { x: 6.5, y: 2.0 },
];

/* ---------- SVG geometry ---------- */
const W = 520;
const H = 300;
const PAD_L = 40;
const PAD_R = 20;
const PAD_T = 30;
const PAD_B = 40;
const X_DOMAIN: [number, number] = [0, 7.2];
const Y_DOMAIN: [number, number] = [-0.2, 2.8];

function toX(v: number) {
  return PAD_L + ((v - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * (W - PAD_L - PAD_R);
}
function toY(v: number) {
  return H - PAD_B - ((v - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0])) * (H - PAD_T - PAD_B);
}

/* ════════════════════════════════════════════════════════════════════════
   POLYNOMIAL FIT — least squares via normal equations for small degrees
   (d ≤ 20). Good enough for the visualization.
   ════════════════════════════════════════════════════════════════════════ */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M: number[][] = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[pivot][i])) pivot = k;
    }
    [M[i], M[pivot]] = [M[pivot], M[i]];
    if (Math.abs(M[i][i]) < 1e-12) continue;
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = Math.abs(M[i][i]) < 1e-12 ? 0 : sum / M[i][i];
  }
  return x;
}

function polyFit(points: Pt[], degree: number): number[] {
  const n = degree + 1;
  const A: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const b = new Array<number>(n).fill(0);
  for (const p of points) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) A[i][j] += Math.pow(p.x, i + j);
      b[i] += p.y * Math.pow(p.x, i);
    }
  }
  return solveLinearSystem(A, b);
}

function polyEval(coefs: number[], x: number): number {
  let s = 0;
  for (let i = 0; i < coefs.length; i++) s += coefs[i] * Math.pow(x, i);
  return s;
}

function mse(points: Pt[], coefs: number[]): number {
  if (points.length === 0) return 0;
  return (
    points.reduce((acc, p) => acc + Math.pow(p.y - polyEval(coefs, p.x), 2), 0) /
    points.length
  );
}

/* ════════════════════════════════════════════════════════════════════════
   QUIZ
   ════════════════════════════════════════════════════════════════════════ */
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Train loss = 0.01, Validation loss = 2.5. Mô hình đang gặp vấn đề gì?",
    options: [
      "Underfit — mô hình quá đơn giản",
      "Overfit — mô hình thuộc lòng train nhưng kém trên dữ liệu mới",
      "Good fit — train loss thấp là tốt",
      "Không đủ thông tin để kết luận",
    ],
    correct: 1,
    explanation:
      "Khoảng cách khổng lồ giữa train loss (0.01) và val loss (2.5) chính là dấu hiệu rõ ràng nhất của overfit. Mô hình 'nhớ' từng điểm train nhưng không nắm được quy luật chung.",
  },
  {
    question: "Early stopping dừng huấn luyện khi nào?",
    options: [
      "Khi train loss = 0",
      "Khi validation loss bắt đầu tăng trở lại sau khi giảm",
      "Sau đúng 100 epoch",
      "Khi learning rate quá nhỏ",
    ],
    correct: 1,
    explanation:
      "Validation loss giảm → mô hình đang học tốt. Khi val loss tăng lại → bắt đầu overfit. Early stopping lưu mô hình tại điểm val loss thấp nhất rồi dừng.",
  },
  {
    question:
      "Cách nào KHÔNG giúp giảm overfit?",
    options: [
      "Thêm regularization (L2 / Dropout)",
      "Tăng số lượng dữ liệu huấn luyện",
      "Tăng bậc đa thức lên rất cao để mô hình mạnh hơn",
      "Dùng cross-validation để chọn mô hình",
    ],
    correct: 2,
    explanation:
      "Tăng bậc đa thức = tăng độ phức tạp = càng dễ overfit. Các cách còn lại đều giảm overfit: thêm dữ liệu, thêm ràng buộc, chọn mô hình trên val thay vì train.",
  },
  {
    type: "fill-blank",
    question:
      "Nếu train loss = 0.5 và val loss = 0.52, cả hai đều cao, khoảng cách nhỏ → mô hình đang bị {blank}. Nếu train loss = 0.01 nhưng val loss = 1.8 → mô hình đang bị {blank}.",
    blanks: [
      { answer: "underfit", accept: ["underfitting", "chưa khớp", "chưa đủ"] },
      { answer: "overfit", accept: ["overfitting", "quá khớp", "thuộc lòng"] },
    ],
    explanation:
      "Underfit: cả hai loss đều cao, khoảng cách nhỏ — mô hình chưa học đủ. Overfit: train loss thấp nhưng val loss cao — mô hình nhớ train nhưng không tổng quát hoá.",
  },
];

/* ════════════════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
export default function OverfittingUnderfittingTopic() {
  const [degree, setDegree] = useState(3);
  const [showTest, setShowTest] = useState(false);

  /* ---- Fit polynomial ---- */
  const coefs = useMemo(() => polyFit(TRAIN_POINTS, degree), [degree]);
  const trainLoss = useMemo(() => mse(TRAIN_POINTS, coefs), [coefs]);
  const testLoss = useMemo(() => mse(TEST_POINTS, coefs), [coefs]);

  /* ---- Sample curve points ---- */
  const curvePath = useMemo(() => {
    const steps = 220;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = X_DOMAIN[0] + (i / steps) * (X_DOMAIN[1] - X_DOMAIN[0]);
      const y = polyEval(coefs, x);
      const cy = Math.max(PAD_T - 8, Math.min(H - PAD_B + 8, toY(y)));
      pts.push(`${toX(x).toFixed(2)},${cy.toFixed(2)}`);
    }
    return pts.join(" ");
  }, [coefs]);

  /* ---- Status based on degree ---- */
  const status = useMemo(() => {
    if (degree <= 1)
      return {
        text: "Underfit",
        label: "Đơn giản quá — chưa học nổi quy luật",
        color: "#3b82f6",
        emoji: TrendingDown,
      };
    if (degree <= 5)
      return {
        text: "Good fit",
        label: "Vừa đủ — bắt được quy luật, bỏ qua nhiễu",
        color: "#22c55e",
        emoji: Sparkles,
      };
    return {
      text: "Overfit",
      label: "Phức tạp quá — nhớ luôn cả nhiễu trong train",
      color: "#ef4444",
      emoji: TrendingUp,
    };
  }, [degree]);

  /* ---- Training-curve chart data (train vs val loss by epoch) ---- */
  const trainingCurve = useMemo(() => {
    const points: { epoch: number; train: number; val: number }[] = [];
    const EPOCHS = 80;
    const turnAt = 28;
    for (let e = 0; e <= EPOCHS; e++) {
      const train = 1.9 * Math.exp(-e / 18) + 0.08;
      let val;
      if (e < turnAt) {
        val = 2.1 * Math.exp(-e / 22) + 0.14;
      } else {
        const bottom = 2.1 * Math.exp(-turnAt / 22) + 0.14;
        val = bottom + (e - turnAt) * 0.018;
      }
      points.push({ epoch: e, train, val });
    }
    return { points, turnAt, max: EPOCHS };
  }, []);

  const renderCurvePath = useCallback(
    (key: "train" | "val") => {
      const { points } = trainingCurve;
      const PW = 480;
      const PH = 180;
      const px = (i: number) => 40 + (i / (points.length - 1)) * (PW - 60);
      const py = (v: number) => 16 + (1 - Math.min(1, v / 2.4)) * (PH - 36);
      return points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(p[key]).toFixed(1)}`)
        .join(" ");
    },
    [trainingCurve],
  );

  const overfitRatio = testLoss > 0 && trainLoss > 0 ? testLoss / trainLoss : 1;

  return (
    <>
      {/* ═══════════ STEP 1 — HOOK + PREDICTION ═══════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Hook">
        <div className="rounded-2xl border border-border bg-card p-6 mb-5">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
            <BookOpen size={20} className="text-accent" />
            Học thuộc lòng vs học lý thuyết — hai kiểu trượt kỳ thi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 space-y-2">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle size={14} /> Học thuộc 10 đề cũ
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Nhớ rõ từng câu trong 10 đề đã làm. Vào phòng thi gặp đề mới — lạ từ câu 1.
                Điểm rất thấp. Đây là <strong>overfit</strong>.
              </p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-2">
              <p className="text-sm font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-2">
                <Brain size={14} /> Học mỗi lý thuyết, không làm bài
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Đọc hiểu lý thuyết nhưng chưa luyện bài nào. Gặp đề thật — bí từ đầu, không áp
                dụng được. Đây là <strong>underfit</strong>.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Mô hình ML cũng y như thế. Có hai cách &ldquo;trượt&rdquo;: học ít quá (underfit)
            hoặc học nhiều quá đến mức thuộc cả nhiễu (overfit). Mục tiêu là <em>ở giữa</em> —
            đủ phức tạp để bắt được quy luật, đủ đơn giản để không nhớ rác.
          </p>
        </div>

        <PredictionGate
          question="Bạn tăng bậc đa thức (polynomial degree) từ 1 lên 20 để fit đường cong qua các điểm dữ liệu. Train loss (lỗi trên dữ liệu cũ) sẽ thay đổi thế nào?"
          options={[
            "Giảm dần rồi tăng lại khi quá phức tạp",
            "Luôn giảm — càng nhiều bậc, càng khớp chặt các điểm train",
            "Luôn giữ nguyên, không đổi",
            "Giảm đến bậc 3 rồi dừng hẳn",
          ]}
          correct={1}
          explanation="Train loss LUÔN giảm khi tăng độ phức tạp — mô hình mạnh hơn, có nhiều 'tự do' hơn để uốn éo vừa mọi điểm. Nhưng ở đây là cái bẫy: train loss = 0 không có nghĩa mô hình tốt. Phải xem loss trên dữ liệu mới (test) mới biết mô hình có thực sự hiểu quy luật hay chỉ 'thuộc lòng'."
        />
      </LessonSection>

      {/* ═══════════ STEP 2 — REVEAL: Interactive polynomial fit ═══════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Đây là <strong className="text-foreground">12 điểm dữ liệu train (cam)</strong> nằm
          gần một đường cong &ldquo;thật&rdquo; (chưa hiện). Kéo thanh trượt để chọn{" "}
          <strong className="text-foreground">bậc đa thức</strong> dùng để fit các điểm này.
          Quan sát đường xanh biến dạng thế nào, rồi <strong>bật test data</strong> để xem mô
          hình có &ldquo;đoán đúng&rdquo; điểm mới không.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            {/* Status badge */}
            <div
              className="flex items-center justify-center gap-3 rounded-xl p-3 text-center"
              style={{
                color: status.color,
                backgroundColor: `${status.color}15`,
                border: `1px solid ${status.color}40`,
              }}
            >
              <status.emoji size={18} />
              <div>
                <p className="text-base font-bold">{status.text}</p>
                <p className="text-xs opacity-90">{status.label}</p>
              </div>
            </div>

            {/* SVG chart */}
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-background"
              role="img"
              aria-label={`Fit đa thức bậc ${degree} trên 12 điểm train`}
            >
              {/* Grid */}
              {[0, 0.5, 1, 1.5, 2, 2.5].map((v) => (
                <line
                  key={`gy-${v}`}
                  x1={PAD_L}
                  y1={toY(v)}
                  x2={W - PAD_R}
                  y2={toY(v)}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth={0.5}
                  strokeDasharray="2,3"
                  opacity={0.45}
                />
              ))}
              {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                <line
                  key={`gx-${v}`}
                  x1={toX(v)}
                  y1={PAD_T}
                  x2={toX(v)}
                  y2={H - PAD_B}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth={0.5}
                  strokeDasharray="2,3"
                  opacity={0.35}
                />
              ))}
              {/* Axes */}
              <line
                x1={PAD_L}
                y1={H - PAD_B}
                x2={W - PAD_R}
                y2={H - PAD_B}
                stroke="currentColor"
                className="text-muted"
                strokeWidth={1}
              />
              <line
                x1={PAD_L}
                y1={PAD_T}
                x2={PAD_L}
                y2={H - PAD_B}
                stroke="currentColor"
                className="text-muted"
                strokeWidth={1}
              />
              <text x={W / 2} y={H - 10} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
                x (đặc trưng đầu vào)
              </text>
              <text
                x={14}
                y={H / 2}
                fontSize={10}
                fill="currentColor"
                className="text-muted"
                textAnchor="middle"
                transform={`rotate(-90 14 ${H / 2})`}
              >
                y (giá trị cần dự đoán)
              </text>

              {/* Fit curve */}
              <motion.polyline
                key={`curve-${degree}`}
                points={curvePath}
                fill="none"
                stroke={status.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              />

              {/* Train points */}
              {TRAIN_POINTS.map((p, i) => (
                <circle
                  key={`train-${i}`}
                  cx={toX(p.x)}
                  cy={toY(p.y)}
                  r={5.5}
                  fill="#f59e0b"
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              ))}

              {/* Test points (conditionally) */}
              <AnimatePresence>
                {showTest &&
                  TEST_POINTS.map((p, i) => (
                    <motion.g
                      key={`test-${i}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                    >
                      <circle
                        cx={toX(p.x)}
                        cy={toY(p.y)}
                        r={6}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth={2}
                      />
                      <circle cx={toX(p.x)} cy={toY(p.y)} r={2} fill="#06b6d4" />
                    </motion.g>
                  ))}
              </AnimatePresence>

              {/* Legend */}
              <g>
                <circle cx={W - 120} cy={PAD_T - 4} r={4} fill="#f59e0b" />
                <text x={W - 112} y={PAD_T - 1} fontSize={10} fill="#f59e0b" fontWeight={600}>
                  Train
                </text>
                {showTest && (
                  <>
                    <circle
                      cx={W - 70}
                      cy={PAD_T - 4}
                      r={4}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={2}
                    />
                    <text x={W - 60} y={PAD_T - 1} fontSize={10} fill="#06b6d4" fontWeight={600}>
                      Test
                    </text>
                  </>
                )}
              </g>
            </svg>

            {/* Loss panel */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-background p-4 text-center">
                <p className="text-xs text-muted mb-1">Train loss (MSE)</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: "#f59e0b" }}>
                  {trainLoss.toFixed(3)}
                </p>
                <p className="text-[10px] text-muted mt-1">
                  Càng tăng bậc, càng giảm về 0.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4 text-center">
                <p className="text-xs text-muted mb-1">Test loss (MSE)</p>
                <p
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: overfitRatio > 2 ? "#ef4444" : "#06b6d4" }}
                >
                  {testLoss.toFixed(3)}
                </p>
                {overfitRatio > 2 && showTest && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium">
                    Test &raquo; train &rArr; overfit!
                  </p>
                )}
                {!showTest && (
                  <p className="text-[10px] text-muted mt-1">Bật &ldquo;Hiện test&rdquo; để quan sát.</p>
                )}
              </div>
            </div>

            {/* Slider + toggle */}
            <div className="space-y-3 max-w-lg mx-auto">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Bậc đa thức: <span className="font-bold text-accent">{degree}</span>
                </label>
                <div className="flex gap-1">
                  {[1, 3, 20].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDegree(d)}
                      className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      = {d}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={degree}
                onChange={(e) => setDegree(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #22c55e 25%, #f59e0b 65%, #ef4444 100%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-tertiary">
                <span>1 (underfit)</span>
                <span>3–5 (good)</span>
                <span>20 (overfit)</span>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 mt-3">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Circle size={13} className="text-cyan-500" />
                  Hiện dữ liệu test (8 điểm mới, mô hình chưa từng thấy)
                </span>
                <input
                  type="checkbox"
                  checked={showTest}
                  onChange={(e) => setShowTest(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
              </label>
            </div>

            <Callout variant="tip" title="Hãy thử ba mốc">
              Nhấn nút &ldquo;= 1&rdquo; → đường gần như thẳng, bỏ sót hầu hết điểm (underfit).
              Nhấn &ldquo;= 3&rdquo; → đường cong mượt, ôm đúng hình dạng quy luật (good fit).
              Nhấn &ldquo;= 20&rdquo; → đường uốn éo cực mạnh để đi qua từng điểm train — nhưng
              bật test và bạn sẽ thấy nó sai bét ngoài vùng train (overfit).
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════ STEP 3 — AHA ═══════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Train loss thấp không có nghĩa là mô hình tốt.</strong> Mục tiêu thực sự là{" "}
            <em>loss thấp trên dữ liệu mới</em>, chưa hề thấy. Mô hình overfit thuộc lòng train
            data (loss ≈ 0) nhưng sai bét trên test — giống học sinh thuộc đáp án 10 đề cũ
            nhưng thi trượt vì đề mới.
          </p>
          <p className="mt-3">
            Good fit &ne; train loss thấp nhất. Good fit = <strong>khoảng cách nhỏ</strong>{" "}
            giữa train loss và test loss, cả hai đều ở mức hợp lý.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════ STEP 4 — DEEPEN: 3 regimes revealed step by step ═══════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ba chế độ — mổ xẻ từng chế độ">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bấm <strong>&ldquo;Tiếp tục&rdquo;</strong> để đi qua ba chế độ của cùng dữ liệu
          train: bậc 1 → bậc 3 → bậc 20. Mỗi chế độ sẽ kèm hình minh hoạ và chẩn đoán.
        </p>

        <StepReveal
          labels={[
            "Bậc 1 — Underfit",
            "Bậc 3 — Good fit",
            "Bậc 20 — Overfit",
            "So sánh cả 3",
          ]}
        >
          {[
            <RegimeCard
              key="d1"
              title="Bậc 1 — đường thẳng"
              color="#3b82f6"
              degree={1}
              verdict="Underfit"
              summary="Mô hình chỉ có 2 tham số (độ dốc + chặn). Không đủ linh hoạt để uốn theo đỉnh và đáy của dữ liệu. Cả train loss lẫn test loss đều cao, gần bằng nhau."
              diagnosis={[
                "Train loss: cao (~0.55)",
                "Test loss: cao (~0.58)",
                "Triệu chứng: cả hai đều cao, khoảng cách nhỏ",
                "Cách chữa: tăng độ phức tạp, thêm feature",
              ]}
            />,
            <RegimeCard
              key="d3"
              title="Bậc 3 — đường cong mềm"
              color="#22c55e"
              degree={3}
              verdict="Good fit"
              summary="Mô hình đủ linh hoạt để ôm được hình chữ 'U' trong dữ liệu — dip ở giữa, tăng ở hai đầu — nhưng không quá uốn éo. Loss hợp lý trên cả train và test."
              diagnosis={[
                "Train loss: thấp (~0.04)",
                "Test loss: thấp (~0.06)",
                "Triệu chứng: cả hai đều thấp, khoảng cách nhỏ",
                "Đây là mục tiêu bạn cần nhắm tới",
              ]}
            />,
            <RegimeCard
              key="d20"
              title="Bậc 20 — đường uốn éo cực đại"
              color="#ef4444"
              degree={20}
              verdict="Overfit"
              summary="Mô hình có 21 tham số — đủ tự do để uốn qua từng điểm train. Train loss gần 0. Nhưng giữa các điểm, đường cong dao động hỗn loạn → test loss cực cao."
              diagnosis={[
                "Train loss: rất thấp (~0.002)",
                "Test loss: rất cao (~10+)",
                "Triệu chứng: khoảng cách KHỔNG LỒ giữa train và test",
                "Cách chữa: giảm bậc, thêm dữ liệu, regularization",
              ]}
            />,
            <div
              key="compare"
              className="rounded-xl border border-border bg-surface/50 p-4 space-y-3"
            >
              <h4 className="text-sm font-bold text-foreground">Tổng kết ba chế độ</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-3 font-semibold text-foreground"> </th>
                      <th className="py-2 pr-3 font-semibold text-blue-500">Bậc 1</th>
                      <th className="py-2 pr-3 font-semibold text-green-500">Bậc 3</th>
                      <th className="py-2 font-semibold text-red-500">Bậc 20</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr>
                      <td className="py-1.5 pr-3 font-medium">Train loss</td>
                      <td className="py-1.5 pr-3">Cao</td>
                      <td className="py-1.5 pr-3">Thấp</td>
                      <td className="py-1.5">Rất thấp (≈ 0)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-3 font-medium">Test loss</td>
                      <td className="py-1.5 pr-3">Cao</td>
                      <td className="py-1.5 pr-3">Thấp</td>
                      <td className="py-1.5">Rất cao</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-3 font-medium">Ẩn dụ</td>
                      <td className="py-1.5 pr-3">Chỉ học lý thuyết</td>
                      <td className="py-1.5 pr-3">Hiểu quy luật</td>
                      <td className="py-1.5">Học vẹt đề cũ</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-3 font-medium">Chữa bằng</td>
                      <td className="py-1.5 pr-3">Tăng phức tạp</td>
                      <td className="py-1.5 pr-3">—</td>
                      <td className="py-1.5">Thêm data / regularize</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted italic">
                Quy tắc ngầm: mô hình tốt là mô hình <strong>đủ phức tạp để bắt quy luật</strong>,
                nhưng <strong>không phức tạp tới mức nhớ luôn nhiễu</strong>.
              </p>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ═══════════ STEP 5 — CHALLENGE ═══════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Early stopping = dừng huấn luyện khi validation loss bắt đầu TĂNG trở lại (không chờ train loss về 0). Vì sao kỹ thuật này chống overfit hiệu quả?"
          options={[
            "Vì dừng sớm → train nhanh hơn, tiết kiệm điện",
            "Vì val loss tăng là dấu hiệu mô hình bắt đầu nhớ nhiễu — dừng ngay sẽ giữ được mô hình ở điểm tổng quát tốt nhất",
            "Vì sau epoch đó mô hình sẽ quên hết kiến thức cũ",
            "Vì val loss tăng nghĩa là dữ liệu bị hỏng",
          ]}
          correct={1}
          explanation="Train loss luôn giảm khi train lâu hơn (mô hình càng ngày càng hợp với train data). Val loss ban đầu cũng giảm (vì mô hình đang học quy luật), nhưng sau một điểm nó BẮT ĐẦU TĂNG — lúc này mô hình chuyển từ 'học quy luật' sang 'nhớ nhiễu'. Early stopping: lưu mô hình tại điểm val loss thấp nhất, bỏ qua phần sau. Đây là cách đơn giản, miễn phí, hiệu quả nhất để chống overfit."
        />

        <div className="mt-5">
          <p className="mb-3 text-sm text-muted leading-relaxed">
            Bên dưới là biểu đồ &ldquo;kinh điển&rdquo;: đường train loss (xanh) luôn giảm, đường
            val loss (đỏ) giảm rồi tăng. Đường xanh lá đứt nét là <strong>điểm early stop</strong>.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-5">
            <svg
              viewBox="0 0 480 200"
              className="mx-auto w-full max-w-xl"
              role="img"
              aria-label="Đường cong train loss và val loss theo epoch"
            >
              {/* Grid */}
              <line x1={40} y1={16} x2={40} y2={164} stroke="currentColor" className="text-muted" strokeWidth={1} />
              <line x1={40} y1={164} x2={460} y2={164} stroke="currentColor" className="text-muted" strokeWidth={1} />
              <text x={14} y={24} fontSize={9} fill="currentColor" className="text-muted">Loss</text>
              <text x={450} y={180} fontSize={9} fill="currentColor" className="text-muted" textAnchor="end">Epoch →</text>

              {/* Early stopping guide */}
              <line
                x1={40 + (trainingCurve.turnAt / trainingCurve.max) * 420}
                y1={16}
                x2={40 + (trainingCurve.turnAt / trainingCurve.max) * 420}
                y2={164}
                stroke="#22c55e"
                strokeWidth={1}
                strokeDasharray="5,4"
                opacity={0.6}
              />
              <text
                x={40 + (trainingCurve.turnAt / trainingCurve.max) * 420}
                y={14}
                fontSize={9}
                fill="#22c55e"
                textAnchor="middle"
                fontWeight={700}
              >
                ★ Early stop
              </text>

              {/* Train curve */}
              <path
                d={renderCurvePath("train")}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2.2}
              />
              {/* Val curve */}
              <path
                d={renderCurvePath("val")}
                fill="none"
                stroke="#ef4444"
                strokeWidth={2.2}
                strokeDasharray="5,3"
              />

              {/* Regions */}
              <text
                x={60}
                y={38}
                fontSize={9}
                fill="currentColor"
                className="text-muted"
              >
                Cả hai giảm — đang học quy luật
              </text>
              <text
                x={280}
                y={38}
                fontSize={9}
                fill="#ef4444"
                fontWeight={600}
              >
                Val tăng — bắt đầu overfit
              </text>

              {/* Legend */}
              <g transform="translate(310, 150)">
                <line x1={0} y1={0} x2={16} y2={0} stroke="#3b82f6" strokeWidth={2} />
                <text x={20} y={3} fontSize={9} fill="#3b82f6">Train loss</text>
                <line x1={90} y1={0} x2={106} y2={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="3,2" />
                <text x={110} y={3} fontSize={9} fill="#ef4444">Val loss</text>
              </g>
            </svg>
          </div>
        </div>
      </LessonSection>

      {/* ═══════════ STEP 6 — EXPLAIN ═══════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection>
          <p className="leading-relaxed">
            Khi ta luyện một mô hình, có <strong>hai lỗi</strong> hoàn toàn khác nhau cần phân
            biệt: lỗi trên dữ liệu đã thấy (<em>train error</em>) và lỗi trên dữ liệu chưa thấy
            (<em>test error</em>). Mục tiêu cuối cùng luôn là{" "}
            <strong>thu nhỏ test error</strong>, vì chỉ khi đó mô hình mới thực sự hữu ích.
          </p>

          <LaTeX block>
            {"\\text{Test Error} \\approx \\text{Train Error} + \\text{Generalization Gap}"}
          </LaTeX>

          <p className="leading-relaxed mt-3">
            <strong>Generalization gap</strong> (khoảng cách tổng quát hoá) chính là khoảng cách
            giữa &ldquo;điểm bài tập về nhà&rdquo; và &ldquo;điểm thi&rdquo;. Mục tiêu là giữ
            khoảng cách này nhỏ — không phải bằng cách &ldquo;hạ&rdquo; train error về 0, mà
            bằng cách chọn mô hình <em>đủ linh hoạt vừa phải</em>.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            So sánh hai mô hình cực trị
          </h4>

          <ToggleCompare
            labelA="Underfit (bậc 1)"
            labelB="Overfit (bậc 20)"
            description="Cùng dữ liệu train, hai đường cong khác nhau kinh khủng."
            childA={
              <div className="rounded-lg bg-background p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-500">
                  Underfit = học chưa đủ
                </p>
                <ul className="list-disc list-inside text-sm text-foreground/85 space-y-1">
                  <li>Mô hình quá đơn giản (ít tham số)</li>
                  <li>Cả train và test error đều cao</li>
                  <li>Ẩn dụ: chỉ học lý thuyết, chưa luyện đề</li>
                  <li>Giải pháp: tăng độ phức tạp, thêm feature, huấn luyện lâu hơn</li>
                </ul>
              </div>
            }
            childB={
              <div className="rounded-lg bg-background p-4 space-y-2">
                <p className="text-sm font-semibold text-red-500">
                  Overfit = học thuộc nhiễu
                </p>
                <ul className="list-disc list-inside text-sm text-foreground/85 space-y-1">
                  <li>Mô hình quá phức tạp (quá nhiều tham số)</li>
                  <li>Train error rất thấp, test error rất cao</li>
                  <li>Ẩn dụ: học thuộc đáp án 10 đề cũ, gặp đề mới trượt</li>
                  <li>
                    Giải pháp: thêm dữ liệu,{" "}
                    <TopicLink slug="regularization">regularization</TopicLink>, early stopping,
                    giảm độ phức tạp
                  </li>
                </ul>
              </div>
            }
          />

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Bảng chẩn đoán nhanh
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">Triệu chứng</th>
                  <th className="text-left py-2 pr-3 font-semibold text-blue-500">Underfit</th>
                  <th className="text-left py-2 pr-3 font-semibold text-green-500">Good fit</th>
                  <th className="text-left py-2 font-semibold text-red-500">Overfit</th>
                </tr>
              </thead>
              <tbody className="text-foreground/85">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Train error</td>
                  <td className="py-2 pr-3">Cao</td>
                  <td className="py-2 pr-3">Thấp</td>
                  <td className="py-2">Rất thấp</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Test error</td>
                  <td className="py-2 pr-3">Cao</td>
                  <td className="py-2 pr-3">Thấp</td>
                  <td className="py-2">Cao</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Khoảng cách</td>
                  <td className="py-2 pr-3">Nhỏ</td>
                  <td className="py-2 pr-3">Nhỏ</td>
                  <td className="py-2">Lớn</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">Độ phức tạp</td>
                  <td className="py-2 pr-3">Quá thấp</td>
                  <td className="py-2 pr-3">Vừa phải</td>
                  <td className="py-2">Quá cao</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="tip" title="Quy trình làm việc thực tế">
            <ol className="list-decimal list-inside space-y-1 mt-1">
              <li>Chọn mô hình đủ lớn để <em>ban đầu</em> overfit nhẹ trên train.</li>
              <li>
                Dùng <TopicLink slug="cross-validation">cross-validation</TopicLink> hoặc{" "}
                <TopicLink slug="train-val-test">train/val/test split</TopicLink> để đo
                generalization gap.
              </li>
              <li>
                Nếu overfit: thêm dữ liệu, early stopping,{" "}
                <TopicLink slug="regularization">regularization</TopicLink>.
              </li>
              <li>Nếu underfit: tăng số tham số / thêm feature / train lâu hơn.</li>
              <li>Lặp lại tới khi val loss không còn tốt hơn được nữa.</li>
            </ol>
          </Callout>

          <CollapsibleDetail title="Mẹo nhận diện thêm — không chỉ xem loss">
            <p className="text-sm leading-relaxed">
              Ngoài việc so loss, còn vài dấu hiệu khác:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-foreground/80 mt-2">
              <li>
                <strong>Đường cong học</strong>: train loss giảm, val loss tăng → overfit rõ.
              </li>
              <li>
                <strong>Độ phức tạp vs dữ liệu</strong>: nếu số tham số &gt; số mẫu &times; 10 → nguy
                cơ overfit rất cao, đặc biệt với dataset &lt; 1000 mẫu.
              </li>
              <li>
                <strong>Độ nhạy với seed</strong>: mô hình overfit thường cho kết quả rất
                khác nhau giữa các lần huấn luyện (với cùng data nhưng khác random seed).
              </li>
              <li>
                <strong>Kiểm tra bằng mắt</strong> (khi có thể): vẽ đường fit cùng data. Nếu
                đường uốn éo bất thường quanh mỗi điểm &rArr; overfit.
              </li>
            </ul>
          </CollapsibleDetail>

          <Callout variant="warning" title="Cái bẫy lớn nhất: nhìn train loss rồi tự hào">
            Rất nhiều người mới tự tin khi thấy train loss về gần 0 và nghĩ &ldquo;xong rồi&rdquo;.
            <strong>Train loss thấp là điều dễ đạt nhất trong ML</strong> — chỉ cần tăng độ phức
            tạp đủ lớn là được. Giá trị thật của một mô hình nằm ở <em>test loss</em>, không
            phải train loss. Luôn giữ một phần dữ liệu (test set) tuyệt đối ngoài tầm với của
            quá trình huấn luyện.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════ STEP 7 — CONNECT / SUMMARY ═══════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="4 điều cần nhớ về overfit vs underfit"
          points={[
            "Underfit = mô hình quá đơn giản; train & test loss đều cao. Overfit = mô hình quá phức tạp; train loss thấp, test loss cao.",
            "Good fit không phải train loss thấp nhất — mà là khoảng cách nhỏ giữa train và test loss.",
            "Early stopping: dừng khi val loss bắt đầu tăng. Cách đơn giản, miễn phí, cực kỳ hiệu quả.",
            "Quy trình: ban đầu overfit nhẹ, rồi dùng regularization / thêm dữ liệu để thu hẹp gap. Không bao giờ bắt đầu với mô hình quá nhỏ.",
          ]}
        />

        <Callout variant="tip" title="Xem ứng dụng thực tế">
          Muốn thấy overfit gây hại thực sự thế nào khi triển khai? Xem{" "}
          <TopicLink slug="overfitting-underfitting-in-compas">
            Overfit trong COMPAS
          </TopicLink>{" "}
          — công cụ chấm điểm rủi ro tái phạm ở Mỹ, nơi 137 đặc trưng phức tạp cho ra kết quả{" "}
          <em>tệ hơn</em> mô hình 2 biến đơn giản.
        </Callout>
      </LessonSection>

      {/* ═══════════ STEP 8 — QUIZ ═══════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   LOCAL HELPER — RegimeCard
   ════════════════════════════════════════════════════════════════════════ */
interface RegimeCardProps {
  title: string;
  color: string;
  degree: number;
  verdict: string;
  summary: string;
  diagnosis: string[];
}

function RegimeCard({
  title,
  color,
  degree,
  verdict,
  summary,
  diagnosis,
}: RegimeCardProps) {
  const coefs = polyFit(TRAIN_POINTS, degree);
  const points: string[] = [];
  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const x = X_DOMAIN[0] + (i / steps) * (X_DOMAIN[1] - X_DOMAIN[0]);
    const y = polyEval(coefs, x);
    const cy = Math.max(PAD_T - 8, Math.min(H - PAD_B + 8, toY(y)));
    points.push(`${toX(x).toFixed(2)},${cy.toFixed(2)}`);
  }

  return (
    <div
      className="rounded-xl border-2 p-4 space-y-3"
      style={{ borderColor: `${color}60`, backgroundColor: `${color}0D` }}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold" style={{ color }}>
          {title}
        </h4>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {verdict}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-h-[180px] rounded-md border border-border bg-background"
      >
        {/* Axes */}
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="currentColor" className="text-muted" strokeWidth={1} />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="currentColor" className="text-muted" strokeWidth={1} />
        {/* Curve */}
        <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth={2.5} />
        {/* Train points */}
        {TRAIN_POINTS.map((p, i) => (
          <circle
            key={`rc-${i}`}
            cx={toX(p.x)}
            cy={toY(p.y)}
            r={4.5}
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth={1.2}
          />
        ))}
      </svg>

      <p className="text-sm text-foreground/85 leading-relaxed">{summary}</p>

      <ul className="space-y-1">
        {diagnosis.map((d, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted">
            <Dot size={14} style={{ color }} className="shrink-0 mt-0.5" />
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
