"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  CollapsibleDetail,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "learning-rate",
  title: "Learning Rate",
  titleVi: "Tốc độ học",
  description:
    "Siêu tham số quan trọng nhất trong huấn luyện mạng nơ-ron, quyết định kích thước bước di chuyển khi tối ưu.",
  category: "neural-fundamentals",
  tags: ["optimization", "hyperparameter", "training"],
  difficulty: "beginner",
  relatedSlugs: ["gradient-descent", "sgd", "optimizers"],
  vizType: "interactive",
};

/* ---------- math helpers for 1D loss landscape ---------- */
const SVG_W = 500;
const SVG_H = 260;
const PAD = 38;
const X_MIN = -2;
const X_MAX = 8;
const Y_MIN = 0;
const Y_MAX = 28;
const OPTIMUM = 3;

function loss(x: number) {
  return (x - OPTIMUM) ** 2 + 0.5;
}
function grad(x: number) {
  return 2 * (x - OPTIMUM);
}
function toX(v: number) {
  return PAD + ((v - X_MIN) / (X_MAX - X_MIN)) * (SVG_W - 2 * PAD);
}
function toY(v: number) {
  return SVG_H - PAD - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (SVG_H - 2 * PAD);
}

/* ---------- LR range test: simulate loss as LR sweeps exponentially ---------- */
// Loss surface as a function of the chosen LR. Models the classic "U" shape
// seen in the LR Finder: tiny LR → no progress; good LR → steep drop;
// excessive LR → blow-up. We model it with a convex valley + explosion tail.
function rangeTestLoss(lrLog: number) {
  // lrLog: natural log of LR, typical range [-7, 2] (i.e. 1e-3..~7)
  const center = -3.5; // log(0.03) ~ sweet spot
  const valley = 0.25 + 0.4 * (lrLog - center) ** 2;
  // Explosion kicks in past lrLog ~ -1.5 (LR ~ 0.2)
  const explode = Math.max(0, lrLog - -1.5);
  return valley + explode * explode * 2.5;
}

/* ---------- scheduler curves for side-by-side comparison ---------- */
type SchedulerName = "constant" | "step" | "cosine" | "onecycle" | "warmup-cosine";

function schedulerValue(name: SchedulerName, t: number, T: number, base: number) {
  switch (name) {
    case "constant":
      return base;
    case "step": {
      // decay x0.5 every T/3 steps
      const stage = Math.floor(t / (T / 3));
      return base * Math.pow(0.5, stage);
    }
    case "cosine": {
      return (base / 2) * (1 + Math.cos((Math.PI * t) / T));
    }
    case "onecycle": {
      // triangular: rise to max in first 30%, then decay to near zero
      const pctStart = 0.3;
      if (t / T < pctStart) {
        return base * 0.1 + (base - base * 0.1) * (t / (T * pctStart));
      }
      const progress = (t - T * pctStart) / (T * (1 - pctStart));
      return base * 0.1 + (base - base * 0.1) * 0.5 * (1 + Math.cos(Math.PI * progress));
    }
    case "warmup-cosine": {
      const warm = 0.1; // 10% warmup
      if (t / T < warm) return (base * t) / (T * warm);
      const progress = (t - T * warm) / (T * (1 - warm));
      return (base / 2) * (1 + Math.cos(Math.PI * progress));
    }
  }
}

/* ---------- 2D loss landscape for convergence-path visualization ---------- */
// A skewed bowl: f(x, y) = a*x² + b*y². We can render contour rings
// and trace gradient-descent paths for different LRs.
const BOWL_A = 1.0;
const BOWL_B = 6.0; // y-direction is much steeper → classic zig-zag

function bowlLoss(x: number, y: number) {
  return BOWL_A * x * x + BOWL_B * y * y;
}
function bowlGrad(x: number, y: number): [number, number] {
  return [2 * BOWL_A * x, 2 * BOWL_B * y];
}

const BOWL_W = 420;
const BOWL_H = 260;
const BOWL_XR = 5; // x-range is [-5, 5]
const BOWL_YR = 2.2; // y-range is [-2.2, 2.2]

function bowlToX(x: number) {
  return BOWL_W / 2 + (x / BOWL_XR) * (BOWL_W / 2 - 15);
}
function bowlToY(y: number) {
  return BOWL_H / 2 - (y / BOWL_YR) * (BOWL_H / 2 - 15);
}

function runBowlGD(lr: number, steps: number, start: [number, number] = [-4.2, 1.8]) {
  const path: { x: number; y: number; L: number }[] = [];
  let [x, y] = start;
  for (let i = 0; i < steps; i++) {
    path.push({ x, y, L: bowlLoss(x, y) });
    const [gx, gy] = bowlGrad(x, y);
    x = x - lr * gx;
    y = y - lr * gy;
    // clamp to keep off-screen trails visually bounded
    x = Math.max(-BOWL_XR * 1.5, Math.min(BOWL_XR * 1.5, x));
    y = Math.max(-BOWL_YR * 1.5, Math.min(BOWL_YR * 1.5, y));
  }
  return path;
}

/* ---------- main component ---------- */
export default function LearningRateTopic() {
  const [lr, setLr] = useState(0.3);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* state for LR scheduler viz */
  const [schedEpochs, setSchedEpochs] = useState(80);
  const [schedBase, setSchedBase] = useState(0.01);
  const [activeSched, setActiveSched] = useState<SchedulerName>("cosine");

  /* state for warmup viz */
  const [warmupPct, setWarmupPct] = useState(10); // percent of total steps
  const [warmupBase, setWarmupBase] = useState(0.001);

  /* state for 2D landscape comparison */
  const [bowlLr, setBowlLr] = useState(0.08);

  // Compute trajectory for current LR (1D bowl)
  const trajectory = useMemo(() => {
    const pts: { x: number; y: number; g: number }[] = [];
    let x = 0.5;
    for (let i = 0; i < 25; i++) {
      const g = grad(x);
      pts.push({ x, y: loss(x), g });
      x = Math.max(X_MIN, Math.min(X_MAX, x - lr * g));
    }
    return pts;
  }, [lr]);

  // Loss curve (static)
  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = X_MIN + (i / 200) * (X_MAX - X_MIN);
      pts.push(`${toX(x)},${toY(loss(x))}`);
    }
    return pts.join(" ");
  }, []);

  // Animate step by step
  const runAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimStep(0);
    let s = 0;
    intervalRef.current = setInterval(() => {
      s++;
      if (s >= Math.min(trajectory.length - 1, 20)) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
        return;
      }
      setAnimStep(s);
    }, 300);
  }, [isAnimating, trajectory]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimating(false);
    setAnimStep(0);
  }, []);

  // Status assessment
  const status = useMemo(() => {
    if (lr < 0.08)
      return { text: "Quá chậm — mất rất nhiều bước mới gần cực tiểu", color: "#f59e0b" };
    if (lr <= 0.5) return { text: "Tốt! Hội tụ ổn định về cực tiểu", color: "#22c55e" };
    if (lr <= 0.85)
      return { text: "Dao động mạnh quanh cực tiểu — khó hội tụ", color: "#f59e0b" };
    return { text: "Phân kỳ! Bước quá lớn, nhảy qua cực tiểu liên tục", color: "#ef4444" };
  }, [lr]);

  /* --- LR Range Test curve --- */
  const rangeTestCurve = useMemo(() => {
    const pts: { x: number; y: number; lr: number; lossVal: number }[] = [];
    for (let i = 0; i <= 160; i++) {
      const lrLog = -7 + (i / 160) * 9; // log-space sweep from ~1e-3 to ~e^2
      const lossVal = rangeTestLoss(lrLog);
      pts.push({
        x: (i / 160) * 440 + 40,
        y: 220 - Math.min(200, (lossVal / 30) * 200),
        lr: Math.exp(lrLog),
        lossVal,
      });
    }
    return pts;
  }, []);

  const rangeTestPath = useMemo(
    () => rangeTestCurve.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
    [rangeTestCurve]
  );

  // "Steepest descent point" — the recommended LR from the range test
  const rangeTestOptimal = useMemo(() => {
    let best = rangeTestCurve[0];
    let bestSlope = 0;
    for (let i = 5; i < rangeTestCurve.length - 5; i++) {
      const slope = rangeTestCurve[i + 5].lossVal - rangeTestCurve[i - 5].lossVal;
      if (slope < bestSlope) {
        bestSlope = slope;
        best = rangeTestCurve[i];
      }
    }
    return best;
  }, [rangeTestCurve]);

  /* --- Scheduler curves (cached for all 4) --- */
  const schedulerCurves = useMemo(() => {
    const steps = 100;
    const names: SchedulerName[] = ["constant", "step", "cosine", "onecycle"];
    return names.map((name) => {
      const pts: { t: number; v: number }[] = [];
      for (let t = 0; t <= steps; t++) {
        pts.push({ t, v: schedulerValue(name, t, steps, schedBase) });
      }
      return { name, pts };
    });
  }, [schedBase]);

  /* --- Active scheduler timeline (for expanded view) --- */
  const activeSchedPts = useMemo(() => {
    const pts: { t: number; v: number }[] = [];
    for (let t = 0; t <= schedEpochs; t++) {
      pts.push({ t, v: schedulerValue(activeSched, t, schedEpochs, schedBase) });
    }
    return pts;
  }, [activeSched, schedEpochs, schedBase]);

  /* --- Warmup curve --- */
  const warmupPts = useMemo(() => {
    const total = 100;
    const warmSteps = (warmupPct / 100) * total;
    const pts: { t: number; v: number }[] = [];
    for (let t = 0; t <= total; t++) {
      let v: number;
      if (t < warmSteps) {
        v = (warmupBase * t) / warmSteps;
      } else {
        const p = (t - warmSteps) / (total - warmSteps);
        v = (warmupBase / 2) * (1 + Math.cos(Math.PI * p));
      }
      pts.push({ t, v });
    }
    return pts;
  }, [warmupPct, warmupBase]);

  /* --- 2D bowl paths for LR comparison --- */
  const bowlPaths = useMemo(() => {
    return {
      tiny: runBowlGD(0.02, 60),
      good: runBowlGD(bowlLr, 60),
      big: runBowlGD(0.16, 30),
    };
  }, [bowlLr]);

  /* Quiz — 8 questions */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Learning rate = 0.001 là mặc định phổ biến cho optimizer nào?",
      options: ["SGD thuần", "Adam", "Batch Gradient Descent", "Newton's method"],
      correct: 1,
      explanation:
        "Adam mặc định lr = 0.001 và hoạt động tốt trong hầu hết trường hợp. SGD thường cần lr lớn hơn (0.01-0.1) vì không có momentum thích ứng.",
    },
    {
      question: "Learning rate warmup có nghĩa là gì?",
      options: [
        "Tăng LR dần dần trong vài epoch đầu, rồi mới bắt đầu giảm",
        "Bắt đầu với LR lớn nhất rồi giảm nhanh",
        "Giữ LR cố định suốt quá trình huấn luyện",
        "Chỉ dùng LR khi mô hình đã hội tụ",
      ],
      correct: 0,
      explanation:
        "Warmup bắt đầu với LR rất nhỏ, tăng dần lên giá trị mục tiêu trong vài epoch đầu. Tránh cập nhật quá mạnh khi trọng số chưa ổn định — đặc biệt quan trọng với Transformer.",
    },
    {
      question:
        "Loss giảm nhanh ban đầu rồi dao động lên xuống. Nguyên nhân có thể nhất là gì?",
      options: [
        "Dữ liệu quá ít",
        "Learning rate tốt ban đầu nhưng quá lớn khi gần cực tiểu — cần LR scheduling",
        "Mô hình quá nhỏ",
        "Bug trong code",
      ],
      correct: 1,
      explanation:
        "LR cố định phù hợp khi xa cực tiểu nhưng quá lớn khi đến gần. LR scheduling (giảm dần) giải quyết: bước lớn lúc đầu, bước nhỏ khi gần đích.",
    },
    {
      question:
        "Trong LR Range Test (Leslie Smith), đâu là learning rate tốt nhất để chọn?",
      options: [
        "LR tại điểm loss thấp nhất trên biểu đồ",
        "LR tại điểm loss giảm dốc nhất (steepest descent) — thường thấp hơn điểm min một chút",
        "LR nhỏ nhất trong khoảng thử",
        "LR trung bình cộng của khoảng thử",
      ],
      correct: 1,
      explanation:
        "Chọn LR tại điểm dốc nhất trước khi loss bật lên. Đó là vùng LR đủ lớn để hội tụ nhanh nhưng chưa đủ lớn để gây bất ổn. Thường thấp hơn điểm min khoảng 1 bậc 10.",
    },
    {
      question:
        "Vì sao trên một hàm loss có các hướng dốc không đều (ill-conditioned), LR lớn lại gây ra hiện tượng zig-zag?",
      options: [
        "Vì optimizer bị lỗi",
        "Vì cùng một LR quá lớn với hướng rất dốc nhưng vẫn vừa với hướng thoải — nên dao động trong hướng dốc",
        "Vì gradient bị chặn cắt (clipped)",
        "Vì dữ liệu không chuẩn hóa",
      ],
      correct: 1,
      explanation:
        "Đây chính là lý do ra đời của momentum và adaptive methods (Adam/RMSProp). LR duy nhất cho mọi hướng là vấn đề khi độ cong các trục khác nhau lớn (ill-conditioned Hessian).",
    },
    {
      question:
        "OneCycleLR (Leslie Smith) khác gì so với Cosine Annealing thuần?",
      options: [
        "OneCycleLR có pha warmup ở đầu và pha anneal sâu ở cuối trong MỘT chu kỳ duy nhất",
        "OneCycleLR giảm đều tuyến tính",
        "OneCycleLR chỉ dùng cho RL",
        "OneCycleLR không khác gì Cosine",
      ],
      correct: 0,
      explanation:
        "OneCycle: warmup → đạt max_lr → anneal sâu hơn nhiều so với cosine. Mục tiêu là 'super-convergence' — huấn luyện nhanh gấp 5-10 lần trên một số bài toán.",
    },
    {
      question: "Tại sao không nên dùng LR quá nhỏ 'cho an toàn'?",
      options: [
        "Mô hình có thể kẹt ở điểm saddle hoặc minimum cục bộ không tốt, và huấn luyện tốn rất nhiều thời gian",
        "LR nhỏ luôn cho kết quả xấu",
        "Vì GPU cần LR lớn để hoạt động",
        "Vì bạn sẽ bị framework cảnh báo",
      ],
      correct: 0,
      explanation:
        "LR nhỏ = bước nhỏ = dễ kẹt tại local minima, saddle points, plateau. Một chút 'noise' từ LR lớn hơn thực ra giúp thoát ra và tìm minimum tổng quát tốt hơn.",
    },
    {
      question:
        "Bạn huấn luyện một Transformer 1B tham số. Bỏ warmup và loss bùng lên NaN ở bước 200. Lý do kỹ thuật nhất?",
      options: [
        "Quá ít dữ liệu",
        "LayerNorm chưa ổn định + gradient rất lớn ở bước đầu → update khổng lồ → activations bùng → NaN",
        "Pytorch bug",
        "GPU quá nóng",
      ],
      correct: 1,
      explanation:
        "Ở bước đầu, LayerNorm statistics chưa ổn định, attention softmax dễ saturate, gradient lớn. LR đầy đủ ngay từ đầu → update quá lớn → NaN. Warmup là liều 'an thần' cần thiết cho các kiến trúc pre-LN/post-LN.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={10} label="Dự đoán">
        <PredictionGate
          question="Bạn đi Grab bike về nhà. Tài xế biết hướng đi nhưng phải chọn tốc độ. Nếu chạy quá nhanh trên đường hẹp, điều gì xảy ra?"
          options={[
            "Về nhanh hơn — tốc độ luôn tốt",
            "Vượt qua ngõ rẽ, phải quay lại, rồi lại vượt — lặp vô hạn",
            "Không ảnh hưởng — chỉ cần biết hướng",
            "Xe tự động giảm tốc",
          ]}
          correct={1}
          explanation="Giống hệt learning rate! Quá lớn → vượt qua cực tiểu → quay lại → vượt tiếp → dao động mãi. Learning rate là 'tốc độ' của gradient descent."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Learning rate quyết định bước nhảy bao xa theo hướng gradient. Hãy tự tay{" "}
            <strong className="text-foreground">kéo thanh trượt</strong> để cảm nhận: nhỏ
            quá thì chậm, lớn quá thì dao động, vừa phải thì hội tụ đẹp.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: INTERACTIVE LR EXPLORER ===== */}
      <LessonSection step={2} totalSteps={10} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* LR slider */}
            <div className="space-y-2 max-w-lg mx-auto">
              <label className="text-sm font-medium text-muted">
                Learning rate (<LaTeX>{`\\alpha`}</LaTeX>):{" "}
                <strong className="text-foreground">{lr.toFixed(2)}</strong>
              </label>
              <input
                type="range"
                min="0.01"
                max="1.1"
                step="0.01"
                value={lr}
                onChange={(e) => {
                  setLr(parseFloat(e.target.value));
                  reset();
                }}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>0.01 (Rùa bò)</span>
                <span>0.3 (Vừa phải)</span>
                <span>1.1 (Phân kỳ)</span>
              </div>
            </div>

            {/* Status */}
            <div
              className="rounded-lg p-3 text-center text-sm font-medium"
              style={{
                color: status.color,
                backgroundColor: `${status.color}15`,
                border: `1px solid ${status.color}40`,
              }}
            >
              {status.text}
            </div>

            {/* Loss landscape */}
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full max-w-2xl mx-auto">
              <line
                x1={PAD}
                y1={SVG_H - PAD}
                x2={SVG_W - PAD}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={SVG_W / 2}
                y={SVG_H - 8}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
              >
                Trọng số (w)
              </text>

              <polyline
                points={curvePoints}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity={0.4}
              />

              <line
                x1={toX(OPTIMUM)}
                y1={SVG_H - PAD}
                x2={toX(OPTIMUM)}
                y2={toY(loss(OPTIMUM))}
                stroke="#22c55e"
                strokeWidth="1"
                strokeDasharray="4,3"
                opacity={0.4}
              />
              <text
                x={toX(OPTIMUM)}
                y={SVG_H - PAD + 14}
                textAnchor="middle"
                fill="#22c55e"
                fontSize="9"
              >
                Cực tiểu
              </text>

              {trajectory.slice(0, animStep + 1).map((p, i) => {
                if (i === 0) return null;
                const prev = trajectory[i - 1];
                return (
                  <line
                    key={`trail-${i}`}
                    x1={toX(prev.x)}
                    y1={toY(prev.y)}
                    x2={toX(p.x)}
                    y2={toY(p.y)}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    opacity={0.3 + (i / (animStep + 1)) * 0.5}
                    strokeDasharray="4,2"
                  />
                );
              })}

              {trajectory.slice(0, animStep + 1).map((p, i) => (
                <circle
                  key={`dot-${i}`}
                  cx={toX(p.x)}
                  cy={toY(Math.min(p.y, Y_MAX))}
                  r={i === animStep ? 6 : 3}
                  fill={i === 0 ? "#f59e0b" : "#ef4444"}
                  opacity={0.4 + (i / (animStep + 1)) * 0.6}
                />
              ))}

              {animStep > 0 && (
                <motion.circle
                  cx={toX(trajectory[animStep].x)}
                  cy={toY(Math.min(trajectory[animStep].y, Y_MAX))}
                  r={7}
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth="2"
                  initial={false}
                  animate={{
                    cx: toX(trajectory[animStep].x),
                    cy: toY(Math.min(trajectory[animStep].y, Y_MAX)),
                  }}
                  transition={{ type: "spring", stiffness: 120, damping: 15 }}
                />
              )}

              {trajectory.slice(0, Math.min(animStep + 1, 8)).map((p, i) => (
                <text
                  key={`lbl-${i}`}
                  x={toX(p.x)}
                  y={toY(Math.min(p.y, Y_MAX)) - 10}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                >
                  {i}
                </text>
              ))}
            </svg>

            <div className="flex justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Đặt lại
              </button>
              <button
                onClick={runAnimation}
                disabled={isAnimating}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isAnimating ? "Đang chạy..." : "Chạy tối ưu"}
              </button>
            </div>

            {animStep > 0 && (
              <div className="overflow-x-auto">
                <div className="flex gap-1 text-xs">
                  {trajectory.slice(0, Math.min(animStep + 1, 8)).map((p, i) => (
                    <div
                      key={`cell-${i}`}
                      className="flex-shrink-0 rounded border border-border p-2 text-center min-w-[65px]"
                    >
                      <p className="text-muted">Bước {i}</p>
                      <p className="text-foreground font-semibold">
                        w = {p.x.toFixed(2)}
                      </p>
                      <p className="text-muted">L = {p.y.toFixed(2)}</p>
                    </div>
                  ))}
                  {animStep >= 8 && (
                    <div className="flex items-center px-2 text-muted">
                      ...bước {animStep}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={10} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Learning rate</strong> là &quot;bước chân&quot; trong gradient descent.
            Quá nhỏ → rùa bò, mất cả ngày. Quá lớn → nhảy qua nhảy lại, không bao giờ
            dừng. Vừa phải → đi thẳng đến đích!
          </p>
          <p className="text-sm mt-2 opacity-80">
            Công thức: <LaTeX>{"w_{\\text{mới}} = w_{\\text{cũ}} - \\alpha \\cdot \\nabla L"}</LaTeX>
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE 1 ===== */}
      <LessonSection step={4} totalSteps={10} label="Thử thách">
        <InlineChallenge
          question="Loss giảm nhanh trong 5 epoch đầu, sau đó dao động lên xuống quanh giá trị 0.3 mà không giảm thêm. Bạn nên làm gì?"
          options={[
            "Tăng learning rate để hội tụ nhanh hơn",
            "Giảm learning rate (hoặc dùng LR scheduling) để bước nhỏ hơn khi gần cực tiểu",
            "Không làm gì — đây là hành vi bình thường",
          ]}
          correct={1}
          explanation="Dao động quanh cực tiểu = bước quá lớn khi gần đích. Giảm LR (hoặc dùng cosine annealing, step decay) giúp bước nhỏ dần, hội tụ chính xác hơn."
        />
      </LessonSection>

      {/* ===== STEP 5: LR RANGE TEST ===== */}
      <LessonSection step={5} totalSteps={10} label="LR Range Test">
        <ExplanationSection>
          <p>
            Trước khi chọn LR, Leslie Smith đề xuất chạy một bài kiểm tra đơn giản:{" "}
            <strong>LR Range Test</strong> (còn gọi là LR Finder). Ý tưởng: huấn luyện vài
            batch với LR tăng mũ từ rất nhỏ (ví dụ <LaTeX>{"10^{-7}"}</LaTeX>) lên rất lớn
            (ví dụ <LaTeX>{"10^{1}"}</LaTeX>), sau đó vẽ loss theo LR. Chọn LR ở vùng{" "}
            <strong>dốc xuống mạnh nhất</strong>.
          </p>

          <VisualizationSection>
            <div className="space-y-3">
              <p className="text-sm text-muted text-center">
                Trục hoành: log(learning rate) — trục tung: loss sau ít bước huấn luyện
              </p>
              <svg viewBox="0 0 500 260" className="w-full max-w-2xl mx-auto">
                {/* axes */}
                <line x1={40} y1={220} x2={480} y2={220} stroke="#334155" strokeWidth="1" />
                <line x1={40} y1={20} x2={40} y2={220} stroke="#334155" strokeWidth="1" />

                {/* LR tick labels */}
                {[-7, -5, -3, -1, 1].map((lg, i) => (
                  <g key={`tick-${i}`}>
                    <line
                      x1={40 + ((lg + 7) / 9) * 440}
                      y1={220}
                      x2={40 + ((lg + 7) / 9) * 440}
                      y2={224}
                      stroke="#64748b"
                    />
                    <text
                      x={40 + ((lg + 7) / 9) * 440}
                      y={238}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="10"
                    >
                      1e{lg}
                    </text>
                  </g>
                ))}

                {/* curve */}
                <polyline
                  points={rangeTestPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                />

                {/* sweet spot region */}
                <rect
                  x={rangeTestOptimal.x - 30}
                  y={rangeTestOptimal.y - 20}
                  width={60}
                  height={200 - (rangeTestOptimal.y - 20)}
                  fill="#22c55e"
                  opacity={0.08}
                />
                <circle cx={rangeTestOptimal.x} cy={rangeTestOptimal.y} r={6} fill="#22c55e" />
                <text
                  x={rangeTestOptimal.x}
                  y={rangeTestOptimal.y - 12}
                  textAnchor="middle"
                  fill="#22c55e"
                  fontSize="11"
                  fontWeight="600"
                >
                  Chọn ở đây (≈ {rangeTestOptimal.lr.toFixed(3)})
                </text>

                {/* explosion region label */}
                <text x={440} y={60} textAnchor="end" fill="#ef4444" fontSize="10">
                  Loss bùng nổ
                </text>
                <text x={80} y={210} fill="#f59e0b" fontSize="10">
                  Quá nhỏ, không học
                </text>

                {/* axis labels */}
                <text x={260} y={254} textAnchor="middle" fill="#94a3b8" fontSize="11">
                  Learning rate (thang log)
                </text>
                <text
                  x={18}
                  y={120}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  transform="rotate(-90 18 120)"
                >
                  Loss
                </text>
              </svg>
            </div>
          </VisualizationSection>

          <p>
            Nguyên tắc đọc biểu đồ:
          </p>
          <ul>
            <li>
              <strong>Vùng bên trái (LR quá nhỏ)</strong>: loss gần như phẳng — mô hình
              không học được gì đáng kể.
            </li>
            <li>
              <strong>Vùng giữa (dốc xuống)</strong>: loss giảm nhanh — đây là nơi{" "}
              <em>nên chọn</em>. Cụ thể: điểm có slope âm nhất, thường ngay trước khi
              biểu đồ bắt đầu đi ngang.
            </li>
            <li>
              <strong>Vùng bên phải (LR quá lớn)</strong>: loss bùng nổ, có thể tới NaN.
              Đây là ranh giới tối đa tuyệt đối.
            </li>
          </ul>

          <Callout variant="tip" title="Mẹo của fast.ai">
            Sau khi tìm được <LaTeX>{"\\alpha_{\\max}"}</LaTeX> ở vùng dốc, chọn LR thực
            tế bằng <LaTeX>{"\\alpha = \\alpha_{\\max} / 10"}</LaTeX> để có biên an toàn.
            Hoặc dùng luôn <LaTeX>{"\\alpha_{\\max}"}</LaTeX> làm đỉnh của OneCycleLR.
          </Callout>

          <CollapsibleDetail title="Toán học phía sau LR Range Test">
            <p>
              Với loss lồi địa phương <LaTeX>{"L(w)"}</LaTeX>, cập nhật GD:{" "}
              <LaTeX>{"w_{t+1} = w_t - \\alpha \\nabla L(w_t)"}</LaTeX>. Biểu diễn Taylor:
            </p>
            <LaTeX block>
              {"L(w_{t+1}) \\approx L(w_t) - \\alpha \\|\\nabla L\\|^2 + \\tfrac{\\alpha^2}{2} \\nabla L^\\top H \\nabla L"}
            </LaTeX>
            <p>
              Số hạng tuyến tính <LaTeX>{"-\\alpha\\|\\nabla L\\|^2"}</LaTeX> làm loss
              giảm; số hạng bậc hai <LaTeX>{"\\alpha^2 \\cdot \\cdot \\cdot"}</LaTeX> là
              bất ổn. Khi <LaTeX>{"\\alpha < 2/\\lambda_{\\max}(H)"}</LaTeX>, tiến trình
              hội tụ (Lipschitz smoothness). Vượt ngưỡng này: divergence. LR Range Test
              là cách thực nghiệm xác định <LaTeX>{"2/\\lambda_{\\max}"}</LaTeX> mà không
              cần tính Hessian.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: SCHEDULER COMPARISON ===== */}
      <LessonSection step={6} totalSteps={10} label="So sánh scheduler">
        <ExplanationSection>
          <p>
            Một LR tốt ở đầu thường quá lớn ở cuối. Giải pháp: <strong>LR scheduler</strong>{" "}
            — một hàm thay đổi LR theo số bước/epoch. Dưới đây là 4 chiến lược phổ biến
            nhất, hãy so sánh hình dáng:
          </p>

          <VisualizationSection>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {schedulerCurves.map((curve) => {
                  const pathStr = curve.pts
                    .map((p, i) => {
                      const x = 30 + (p.t / 100) * 200;
                      const y = 110 - (p.v / schedBase) * 90;
                      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(" ");
                  const labels: Record<SchedulerName, string> = {
                    constant: "Constant",
                    step: "Step Decay",
                    cosine: "Cosine Annealing",
                    onecycle: "One-Cycle",
                    "warmup-cosine": "Warmup + Cosine",
                  };
                  const colors: Record<SchedulerName, string> = {
                    constant: "#64748b",
                    step: "#f59e0b",
                    cosine: "#3b82f6",
                    onecycle: "#a855f7",
                    "warmup-cosine": "#22c55e",
                  };
                  return (
                    <div
                      key={curve.name}
                      className="rounded-lg border border-border bg-card p-2"
                    >
                      <p className="text-xs font-medium text-center text-foreground mb-1">
                        {labels[curve.name]}
                      </p>
                      <svg viewBox="0 0 250 130" className="w-full">
                        <line x1={30} y1={110} x2={230} y2={110} stroke="#334155" />
                        <line x1={30} y1={10} x2={30} y2={110} stroke="#334155" />
                        <path
                          d={pathStr}
                          fill="none"
                          stroke={colors[curve.name]}
                          strokeWidth="2"
                        />
                        <text x={30} y={125} fontSize="8" fill="#64748b">
                          t=0
                        </text>
                        <text x={230} y={125} textAnchor="end" fontSize="8" fill="#64748b">
                          t=T
                        </text>
                      </svg>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted mb-2">
                  Khám phá một scheduler cụ thể:
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["constant", "step", "cosine", "onecycle", "warmup-cosine"] as SchedulerName[]).map(
                    (name) => (
                      <button
                        key={name}
                        onClick={() => setActiveSched(name)}
                        className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                          activeSched === name
                            ? "border-accent bg-accent text-white"
                            : "border-border text-muted hover:text-foreground"
                        }`}
                      >
                        {name}
                      </button>
                    )
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="text-xs text-muted">
                    Tổng số epoch: <strong className="text-foreground">{schedEpochs}</strong>
                    <input
                      type="range"
                      min={20}
                      max={200}
                      value={schedEpochs}
                      onChange={(e) => setSchedEpochs(parseInt(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </label>
                  <label className="text-xs text-muted">
                    LR gốc: <strong className="text-foreground">{schedBase.toFixed(4)}</strong>
                    <input
                      type="range"
                      min={0.0001}
                      max={0.1}
                      step={0.0001}
                      value={schedBase}
                      onChange={(e) => setSchedBase(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </label>
                </div>
                <svg viewBox="0 0 500 160" className="w-full mt-3">
                  <line x1={40} y1={140} x2={480} y2={140} stroke="#334155" />
                  <line x1={40} y1={15} x2={40} y2={140} stroke="#334155" />
                  <path
                    d={activeSchedPts
                      .map((p, i) => {
                        const x = 40 + (p.t / schedEpochs) * 440;
                        const y = 140 - (p.v / schedBase) * 120;
                        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                  />
                  <text x={260} y={156} textAnchor="middle" fill="#94a3b8" fontSize="10">
                    Epoch
                  </text>
                  <text x={30} y={15} textAnchor="end" fill="#94a3b8" fontSize="9">
                    α
                  </text>
                </svg>
              </div>
            </div>
          </VisualizationSection>

          <LaTeX block>
            {"\\alpha_t = \\alpha_0 \\cdot \\frac{1}{2}\\left(1 + \\cos\\left(\\frac{\\pi \\cdot t}{T}\\right)\\right)"}
          </LaTeX>
          <p className="text-sm text-muted text-center">
            Cosine Annealing — LR giảm mượt mà theo đường cosine
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Chiến lược
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Mô tả
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Khi nào dùng
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Constant</td>
                  <td className="py-2 pr-3">LR cố định suốt quá trình</td>
                  <td className="py-2">Prototype nhanh, ít dữ liệu</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Step Decay</td>
                  <td className="py-2 pr-3">Giảm LR x0.1 mỗi N epoch</td>
                  <td className="py-2">CNN truyền thống (ResNet)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Cosine Annealing</td>
                  <td className="py-2 pr-3">Giảm mượt theo cosine</td>
                  <td className="py-2">Transformer, Vision Transformer</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Warmup + Decay</td>
                  <td className="py-2 pr-3">Tăng dần → đỉnh → giảm dần</td>
                  <td className="py-2">BERT, GPT (bắt buộc với LLM)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">One-Cycle</td>
                  <td className="py-2 pr-3">Tăng → đỉnh → giảm trong 1 cycle</td>
                  <td className="py-2">FastAI, huấn luyện nhanh</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="tip" title="Quy tắc ngón tay cái">
            Bắt đầu với Adam lr = 0.001 hoặc SGD lr = 0.01. Nếu loss không giảm → tăng
            LR. Nếu loss dao động → giảm LR. Dùng LR finder (trong FastAI) để tự động
            tìm LR tốt nhất.
          </Callout>

          <CodeBlock language="python" title="lr_scheduling.py — 4 scheduler thực chiến">
            {`import torch
import torch.optim as optim

# Tạo optimizer với LR ban đầu
model = torch.nn.Linear(10, 1)
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)

# ---- 1) Step Decay: giảm LR x0.5 mỗi 30 epoch ----
sched_step = optim.lr_scheduler.StepLR(optimizer, step_size=30, gamma=0.5)

# ---- 2) Cosine Annealing: giảm từ 1e-3 → 0 trong 100 epoch ----
sched_cos = optim.lr_scheduler.CosineAnnealingLR(
    optimizer, T_max=100, eta_min=1e-6
)

# ---- 3) Warmup + Cosine (dùng với Transformer) ----
# Dùng SequentialLR để ghép 2 scheduler
warmup = optim.lr_scheduler.LinearLR(
    optimizer, start_factor=0.01, end_factor=1.0, total_iters=10
)
cosine = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=90)
sched_wc = optim.lr_scheduler.SequentialLR(
    optimizer,
    schedulers=[warmup, cosine],
    milestones=[10],
)

# ---- 4) OneCycle (Leslie Smith — super-convergence) ----
sched_one = optim.lr_scheduler.OneCycleLR(
    optimizer,
    max_lr=1e-3,
    steps_per_epoch=100,
    epochs=10,
    pct_start=0.1,   # 10% đầu warmup
    anneal_strategy="cos",
    div_factor=25,   # lr ban đầu = max_lr / 25
    final_div_factor=1e4,  # lr cuối = max_lr / (25 * 1e4)
)

for epoch in range(100):
    for batch in dataloader:
        optimizer.zero_grad()
        loss = loss_fn(model(batch.x), batch.y)
        loss.backward()
        optimizer.step()
        # OneCycle cần step() mỗi batch, không phải mỗi epoch
        sched_one.step()
    # Các scheduler còn lại cập nhật mỗi epoch
    sched_cos.step()`}
          </CodeBlock>

          <Callout variant="warning" title="LR warmup là bắt buộc cho Transformer">
            Transformer (GPT, BERT, ViT) rất nhạy với LR ban đầu. Không warmup → gradient
            explosion ở epoch đầu → huấn luyện thất bại. Luôn warmup 5-10% tổng số bước.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 7: WARMUP VISUALIZATION ===== */}
      <LessonSection step={7} totalSteps={10} label="Warmup">
        <ExplanationSection>
          <p>
            Tại sao Transformer cần <strong>warmup</strong>? Ở bước huấn luyện đầu tiên,
            trọng số được khởi tạo ngẫu nhiên, LayerNorm chưa có statistics ổn định, và
            attention softmax có thể &quot;saturate&quot; (một head hút hết attention về
            chính nó). Một update đầy đủ kích thước ngay lập tức sẽ đẩy mô hình ra khỏi
            vùng có gradient hữu ích. Warmup là &quot;liều an thần&quot; — tăng dần LR
            từ gần 0 lên giá trị mục tiêu trong vài phần trăm đầu.
          </p>

          <VisualizationSection>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-muted">
                  Warmup pct: <strong className="text-foreground">{warmupPct}%</strong>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={warmupPct}
                    onChange={(e) => setWarmupPct(parseInt(e.target.value))}
                    className="w-full accent-accent"
                  />
                </label>
                <label className="text-xs text-muted">
                  LR đỉnh: <strong className="text-foreground">{warmupBase.toFixed(4)}</strong>
                  <input
                    type="range"
                    min={0.0001}
                    max={0.005}
                    step={0.0001}
                    value={warmupBase}
                    onChange={(e) => setWarmupBase(parseFloat(e.target.value))}
                    className="w-full accent-accent"
                  />
                </label>
              </div>

              <svg viewBox="0 0 500 200" className="w-full max-w-2xl mx-auto">
                <line x1={40} y1={170} x2={480} y2={170} stroke="#334155" />
                <line x1={40} y1={15} x2={40} y2={170} stroke="#334155" />

                {/* shade warmup region */}
                <rect
                  x={40}
                  y={15}
                  width={(warmupPct / 100) * 440}
                  height={155}
                  fill="#f59e0b"
                  opacity={0.08}
                />
                <text
                  x={40 + ((warmupPct / 100) * 440) / 2}
                  y={30}
                  textAnchor="middle"
                  fill="#f59e0b"
                  fontSize="11"
                  fontWeight="600"
                >
                  Warmup
                </text>

                <path
                  d={warmupPts
                    .map((p, i) => {
                      const x = 40 + (p.t / 100) * 440;
                      const y = 170 - (p.v / warmupBase) * 145;
                      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                />

                <text x={260} y={190} textAnchor="middle" fill="#94a3b8" fontSize="10">
                  % tổng số bước huấn luyện
                </text>
              </svg>
            </div>
          </VisualizationSection>

          <Callout variant="info" title="Công thức warmup tuyến tính">
            <LaTeX block>
              {"\\alpha_t = \\begin{cases} \\alpha_{\\max} \\cdot \\frac{t}{T_{\\text{warm}}} & \\text{nếu } t < T_{\\text{warm}} \\\\ \\alpha_{\\max} \\cdot \\text{decay}(t - T_{\\text{warm}}) & \\text{ngược lại} \\end{cases}"}
            </LaTeX>
            Trong đó <LaTeX>{"T_{\\text{warm}}"}</LaTeX> thường là 5-10% tổng số bước.
            Với BERT-base, Devlin et al. dùng 10,000 bước warmup trên tổng 1M bước.
          </Callout>

          <CollapsibleDetail title="Vì sao Transformer đặc biệt cần warmup?">
            <p>
              Ba nguyên nhân kỹ thuật:
            </p>
            <ol>
              <li>
                <strong>Adam adaptive variance không ổn định ở bước đầu</strong>: phương
                sai của bước cập nhật <LaTeX>{"\\hat{v}_t"}</LaTeX> chưa hội tụ → các
                update sớm có magnitude lớn.
              </li>
              <li>
                <strong>Attention softmax saturate</strong>: nếu một logit tình cờ lớn,
                softmax tập trung vào nó → gradient ở các token khác gần 0 → mô hình học
                một kiểu &quot;tắc&quot;.
              </li>
              <li>
                <strong>LayerNorm statistics</strong>: mean/var ban đầu chưa ổn định →
                gradient qua LayerNorm có thể rất lớn hoặc rất nhỏ.
              </li>
            </ol>
            <p>
              Warmup cho phép mô hình &quot;tự điều chỉnh&quot; trước khi nhận update
              mạnh. Nghiên cứu{" "}
              <em>&quot;On the Adequacy of Untuned Warmup for Adaptive Optimization&quot;</em>{" "}
              (Ma &amp; Yarats 2021) chỉ ra warmup tương đương với khởi tạo lại{" "}
              <LaTeX>{"\\hat{v}_t"}</LaTeX>.
            </p>
          </CollapsibleDetail>

          <CodeBlock language="python" title="warmup_scheduler.py — custom warmup với Hugging Face">
            {`from transformers import get_linear_schedule_with_warmup
from torch.optim import AdamW

optimizer = AdamW(model.parameters(), lr=5e-5, weight_decay=0.01)

total_steps = len(train_loader) * num_epochs
warmup_steps = int(0.1 * total_steps)  # 10% warmup

scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=warmup_steps,
    num_training_steps=total_steps,
)

# Trong vòng lặp huấn luyện
for batch in train_loader:
    optimizer.zero_grad()
    loss = model(**batch).loss
    loss.backward()
    # Clip gradient trước khi step (cũng quan trọng với Transformer)
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    optimizer.step()
    scheduler.step()  # cập nhật LR mỗi bước, không phải mỗi epoch

# Biến thể: cosine warmup thay vì linear
# from transformers import get_cosine_schedule_with_warmup
# scheduler = get_cosine_schedule_with_warmup(
#     optimizer,
#     num_warmup_steps=warmup_steps,
#     num_training_steps=total_steps,
#     num_cycles=0.5,  # nửa chu kỳ cosine — về 0 ở cuối
# )`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 8: 2D LANDSCAPE — CONVERGENCE PATHS ===== */}
      <LessonSection step={8} totalSteps={10} label="Đường hội tụ 2D">
        <ExplanationSection>
          <p>
            Trong thực tế, loss surface có <strong>nhiều trục với độ cong khác nhau</strong>.
            Đây là hiện tượng &quot;ill-conditioning&quot;. Cùng một LR có thể vừa với
            trục thoải nhưng quá lớn với trục dốc, gây zig-zag. Hãy xem trên một bowl 2D
            có tỉ lệ độ cong 6:1:
          </p>

          <VisualizationSection>
            <div className="space-y-3">
              <label className="text-sm text-muted">
                Learning rate cho đường &quot;vừa phải&quot; (xanh):{" "}
                <strong className="text-foreground">{bowlLr.toFixed(3)}</strong>
                <input
                  type="range"
                  min={0.01}
                  max={0.15}
                  step={0.005}
                  value={bowlLr}
                  onChange={(e) => setBowlLr(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </label>

              <svg viewBox={`0 0 ${BOWL_W} ${BOWL_H}`} className="w-full max-w-2xl mx-auto">
                {/* contour ellipses */}
                {[0.5, 1.2, 2.5, 5, 10, 18, 30].map((level, i) => {
                  const rx = Math.sqrt(level / BOWL_A) * ((BOWL_W / 2 - 15) / BOWL_XR);
                  const ry = Math.sqrt(level / BOWL_B) * ((BOWL_H / 2 - 15) / BOWL_YR);
                  return (
                    <ellipse
                      key={`cnt-${i}`}
                      cx={BOWL_W / 2}
                      cy={BOWL_H / 2}
                      rx={rx}
                      ry={ry}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth={0.5}
                      opacity={0.3}
                    />
                  );
                })}

                {/* optimum */}
                <circle cx={BOWL_W / 2} cy={BOWL_H / 2} r={4} fill="#22c55e" />
                <text
                  x={BOWL_W / 2 + 8}
                  y={BOWL_H / 2 + 4}
                  fontSize="9"
                  fill="#22c55e"
                  fontWeight="600"
                >
                  min
                </text>

                {/* tiny LR path */}
                <polyline
                  points={bowlPaths.tiny
                    .map((p) => `${bowlToX(p.x)},${bowlToY(p.y)}`)
                    .join(" ")}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  opacity={0.8}
                />
                {bowlPaths.tiny.filter((_, i) => i % 5 === 0).map((p, i) => (
                  <circle
                    key={`tiny-${i}`}
                    cx={bowlToX(p.x)}
                    cy={bowlToY(p.y)}
                    r={2}
                    fill="#f59e0b"
                  />
                ))}

                {/* good LR path */}
                <polyline
                  points={bowlPaths.good
                    .map((p) => `${bowlToX(p.x)},${bowlToY(p.y)}`)
                    .join(" ")}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                {bowlPaths.good.filter((_, i) => i % 3 === 0).map((p, i) => (
                  <circle
                    key={`good-${i}`}
                    cx={bowlToX(p.x)}
                    cy={bowlToY(p.y)}
                    r={2.5}
                    fill="#22c55e"
                  />
                ))}

                {/* big LR path */}
                <polyline
                  points={bowlPaths.big
                    .map((p) => `${bowlToX(p.x)},${bowlToY(p.y)}`)
                    .join(" ")}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  opacity={0.9}
                  strokeDasharray="3,2"
                />
                {bowlPaths.big.slice(0, 12).map((p, i) => (
                  <circle
                    key={`big-${i}`}
                    cx={bowlToX(p.x)}
                    cy={bowlToY(p.y)}
                    r={2}
                    fill="#ef4444"
                  />
                ))}

                {/* legend */}
                <g transform={`translate(${BOWL_W - 130}, 14)`}>
                  <rect width="120" height="58" fill="#0f172a" opacity={0.4} rx="4" />
                  <circle cx="10" cy="14" r="3" fill="#f59e0b" />
                  <text x="20" y="18" fontSize="9" fill="#f59e0b">
                    α=0.02 (chậm)
                  </text>
                  <circle cx="10" cy="28" r="3" fill="#22c55e" />
                  <text x="20" y="32" fontSize="9" fill="#22c55e">
                    α={bowlLr.toFixed(2)} (vừa)
                  </text>
                  <circle cx="10" cy="42" r="3" fill="#ef4444" />
                  <text x="20" y="46" fontSize="9" fill="#ef4444">
                    α=0.16 (zig-zag)
                  </text>
                </g>
              </svg>

              <p className="text-xs text-muted text-center">
                Các vòng là đường đồng mức của loss. Bowl này dốc theo trục y gấp 6 lần
                trục x — nên đường đỏ dao động dữ dội theo trục y trước khi tiến chậm
                theo trục x.
              </p>
            </div>
          </VisualizationSection>

          <Callout variant="info" title="Đây là lý do ra đời momentum và Adam">
            Khi các trục có độ cong khác nhau, SGD + LR cố định sẽ hoặc{" "}
            <em>chậm theo trục thoải</em> hoặc <em>dao động theo trục dốc</em> — không có
            LR nào vừa cho cả hai. <strong>Momentum</strong> trung bình hóa dao động;{" "}
            <strong>Adam/RMSProp</strong> chia gradient cho căn bậc hai của moment 2 →
            tự động cân bằng các trục. Xem thêm{" "}
            <TopicLink slug="optimizers">Optimizers</TopicLink>.
          </Callout>

          <CollapsibleDetail title="Điều kiện hội tụ chính xác cho quadratic">
            <p>
              Với loss <LaTeX>{"L(w) = \\tfrac{1}{2} w^\\top A w"}</LaTeX>, gradient
              descent có tốc độ hội tụ phụ thuộc <strong>condition number</strong>{" "}
              <LaTeX>{"\\kappa = \\lambda_{\\max}(A) / \\lambda_{\\min}(A)"}</LaTeX>. Để
              ổn định: <LaTeX>{"\\alpha < 2/\\lambda_{\\max}"}</LaTeX>. Nhưng tốc độ co
              theo trục thoải nhất là{" "}
              <LaTeX>{"1 - \\alpha \\lambda_{\\min}"}</LaTeX>, nên sẽ rất chậm khi{" "}
              <LaTeX>{"\\kappa"}</LaTeX> lớn. Đó là vì sao các mẹo như <em>chuẩn hóa dữ
              liệu</em>, <em>batch normalization</em>, <em>adaptive LR</em> đều là cách
              giảm <LaTeX>{"\\kappa"}</LaTeX> thực hiệu dụng.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 9: INLINE CHALLENGE 2 + MINI SUMMARY ===== */}
      <LessonSection step={9} totalSteps={10} label="Thử thách nâng cao & Tóm tắt">
        <InlineChallenge
          question="Bạn chuyển từ SGD (lr=0.1) sang Adam. Nên đặt lr cho Adam bằng bao nhiêu?"
          options={[
            "Giữ nguyên 0.1 — optimizer không ảnh hưởng LR",
            "Giảm xuống 0.001 — Adam tự điều chỉnh nên cần LR nhỏ hơn nhiều",
            "Tăng lên 1.0 — Adam cần LR lớn hơn SGD",
          ]}
          correct={1}
          explanation="Adam có adaptive learning rate riêng cho từng tham số, nên LR cơ bản cần nhỏ hơn SGD ~10-100 lần. SGD lr=0.1 → Adam lr=0.001 là chuyển đổi phổ biến."
        />

        <div className="mt-6">
          <MiniSummary
            title="Learning Rate — Điểm chốt"
            points={[
              "LR là siêu tham số quan trọng nhất: w_mới = w_cũ - α × gradient. Chọn sai LR = huấn luyện thất bại bất kể kiến trúc.",
              "Quá nhỏ → hội tụ chậm, có thể kẹt saddle. Quá lớn → dao động hoặc phân kỳ. Vừa phải → hội tụ ổn định và tổng quát tốt.",
              "LR Range Test (Leslie Smith): sweep LR từ nhỏ đến lớn, chọn điểm dốc nhất trên biểu đồ loss vs log(LR).",
              "Scheduler là bắt buộc: step/cosine/onecycle. Bước lớn lúc đầu (khám phá), bước nhỏ lúc cuối (hội tụ chính xác).",
              "Warmup 5-10% bước đầu là bắt buộc cho Transformer — tránh gradient explosion khi LayerNorm và attention chưa ổn định.",
              "Khi loss surface ill-conditioned (các trục có độ cong rất khác), cần momentum hoặc adaptive LR (Adam) — một LR duy nhất không đủ.",
            ]}
          />
        </div>
      </LessonSection>

      {/* ===== STEP 10: QUIZ ===== */}
      <LessonSection step={10} totalSteps={10} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
