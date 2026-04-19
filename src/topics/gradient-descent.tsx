"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Footprints,
  Gauge,
  Compass,
  Sparkles,
  Target,
  TrendingDown,
  Activity,
  Layers,
  CircleDot,
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
  SliderGroup,
  TabView,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gradient-descent",
  title: "Gradient Descent",
  titleVi: "Thuật toán Gradient Descent — xoay weight để giảm loss",
  description:
    "Bạn đã hiểu gradient là mũi tên chỉ đường. Giờ áp vào bài toán huấn luyện thật: xoay các weight theo từng bước để loss giảm dần. So sánh ba cách bước: Vanilla, Momentum, Adam.",
  category: "neural-fundamentals",
  tags: ["optimization", "training", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: [
    "gradient-intuition",
    "learning-rate",
    "sgd",
    "loss-functions",
    "backpropagation",
    "epochs-batches",
  ],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   MẶT LOSS 2D — hai weight w1, w2 (thung lũng hẹp)
   L(w1, w2) = 0.5·(w1 − 1)² + 2·(w2 + 0.5)²
   Cực tiểu tại (1, −0.5). Hẹp theo trục w2 → dễ so sánh
   ba optimizer cảm nhận được "hình dạng thung lũng".
   ──────────────────────────────────────────────────────────── */

const VIEW_W = 540;
const VIEW_H = 340;
const PAD = 28;
const X_MIN = -3;
const X_MAX = 4;
const Y_MIN = -3;
const Y_MAX = 3;

function toPX(x: number): number {
  return PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (VIEW_W - 2 * PAD);
}
function toPY(y: number): number {
  return (
    VIEW_H -
    PAD -
    ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (VIEW_H - 2 * PAD)
  );
}
function lossAt(w1: number, w2: number): number {
  return 0.5 * (w1 - 1) ** 2 + 2 * (w2 + 0.5) ** 2;
}
function gradAt(w1: number, w2: number): [number, number] {
  return [1.0 * (w1 - 1), 4.0 * (w2 + 0.5)];
}

/* ────────────────────────────────────────────────────────────
   ĐƯỜNG ĐỒNG MỨC — sample bằng cách bắn tia từ điểm cực tiểu
   ──────────────────────────────────────────────────────────── */

const CONTOUR_LEVELS = [0.3, 0.8, 1.6, 2.8, 4.5, 7, 10];

function sampleContour(level: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let a = 0; a < 360; a += 3) {
    const rad = (a * Math.PI) / 180;
    let lo = 0;
    let hi = 6;
    for (let iter = 0; iter < 24; iter++) {
      const mid = (lo + hi) / 2;
      const px = 1 + mid * Math.cos(rad);
      const py = -0.5 + mid * Math.sin(rad);
      if (lossAt(px, py) < level) lo = mid;
      else hi = mid;
    }
    const r = (lo + hi) / 2;
    const px = 1 + r * Math.cos(rad);
    const py = -0.5 + r * Math.sin(rad);
    if (px >= X_MIN && px <= X_MAX && py >= Y_MIN && py <= Y_MAX) {
      pts.push({ x: px, y: py });
    }
  }
  return pts;
}

function contourColor(level: number): string {
  const t = Math.min(level / 10, 1);
  if (t < 0.5) {
    const s = t * 2;
    const r = Math.round(60 + 120 * s);
    const g = Math.round(150 + 60 * s);
    const b = Math.round(220 - 70 * s);
    return `rgb(${r},${g},${b})`;
  }
  const s = (t - 0.5) * 2;
  const r = 255;
  const g = Math.round(200 * (1 - s));
  const b = Math.round(90 * (1 - s));
  return `rgb(${r},${Math.max(0, g)},${Math.max(0, b)})`;
}

/* ────────────────────────────────────────────────────────────
   TÍNH ĐƯỜNG ĐI CỦA 3 OPTIMIZER TRÊN CÙNG ĐIỂM BẮT ĐẦU
   Vanilla GD, Momentum, Adam
   ──────────────────────────────────────────────────────────── */

type StepPoint = { x: number; y: number; loss: number };

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function simulateVanilla(
  start: [number, number],
  lr: number,
  steps: number,
): StepPoint[] {
  const trail: StepPoint[] = [];
  let x = start[0];
  let y = start[1];
  for (let i = 0; i < steps; i++) {
    trail.push({ x, y, loss: lossAt(x, y) });
    const [gx, gy] = gradAt(x, y);
    x = clamp(x - lr * gx, X_MIN, X_MAX);
    y = clamp(y - lr * gy, Y_MIN, Y_MAX);
  }
  return trail;
}

function simulateMomentum(
  start: [number, number],
  lr: number,
  beta: number,
  steps: number,
): StepPoint[] {
  const trail: StepPoint[] = [];
  let x = start[0];
  let y = start[1];
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < steps; i++) {
    trail.push({ x, y, loss: lossAt(x, y) });
    const [gx, gy] = gradAt(x, y);
    vx = beta * vx + gx;
    vy = beta * vy + gy;
    x = clamp(x - lr * vx, X_MIN, X_MAX);
    y = clamp(y - lr * vy, Y_MIN, Y_MAX);
  }
  return trail;
}

function simulateAdam(
  start: [number, number],
  lr: number,
  steps: number,
): StepPoint[] {
  const beta1 = 0.9;
  const beta2 = 0.999;
  const eps = 1e-8;
  const trail: StepPoint[] = [];
  let x = start[0];
  let y = start[1];
  let mx = 0;
  let my = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < steps; i++) {
    trail.push({ x, y, loss: lossAt(x, y) });
    const [gx, gy] = gradAt(x, y);
    mx = beta1 * mx + (1 - beta1) * gx;
    my = beta1 * my + (1 - beta1) * gy;
    vx = beta2 * vx + (1 - beta2) * gx * gx;
    vy = beta2 * vy + (1 - beta2) * gy * gy;
    const t = i + 1;
    const mhx = mx / (1 - Math.pow(beta1, t));
    const mhy = my / (1 - Math.pow(beta1, t));
    const vhx = vx / (1 - Math.pow(beta2, t));
    const vhy = vy / (1 - Math.pow(beta2, t));
    x = clamp(x - (lr * mhx) / (Math.sqrt(vhx) + eps), X_MIN, X_MAX);
    y = clamp(y - (lr * mhy) / (Math.sqrt(vhy) + eps), Y_MIN, Y_MAX);
  }
  return trail;
}

/* ────────────────────────────────────────────────────────────
   BỘ CÂU QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Khi huấn luyện mạng nơ-ron, gradient descent làm gì ở mỗi bước?",
    options: [
      "Thêm dữ liệu mới vào tập huấn luyện",
      "Giữ weight nguyên, chỉ đo loss",
      "Cập nhật mỗi weight theo hướng NGƯỢC với gradient của loss đối với weight đó",
      "Đổi hàm loss sang dạng khác",
    ],
    correct: 2,
    explanation:
      "Gradient descent chỉ làm một việc: với mỗi weight, nhìn gradient của loss theo weight ấy, rồi cập nhật weight ← weight − η·gradient. Toàn bộ quá trình huấn luyện là lặp lại bước này hàng triệu lần.",
  },
  {
    question:
      "Trên mặt loss thung lũng hẹp (một trục dốc, một trục thoải), Vanilla GD với LR vừa đủ sẽ có đường đi như thế nào?",
    options: [
      "Đi thẳng tới đáy theo đường chéo",
      "Zigzag qua lại giữa hai vách thung lũng, chậm chạp bò về đáy",
      "Nhảy thẳng tới đáy trong một bước",
      "Đứng yên vì gradient bằng 0",
    ],
    correct: 1,
    explanation:
      "Ở trục dốc, gradient lớn → mỗi bước nhảy qua đáy thung lũng sang vách đối diện, tạo zigzag. Trục thoải tiến chậm vì gradient nhỏ. Đây chính là điểm yếu kinh điển của Vanilla GD, và là lý do Momentum + Adam ra đời.",
  },
  {
    question: "Momentum cải thiện điều gì so với Vanilla GD?",
    options: [
      "Tự động chọn learning rate tối ưu",
      "Loại bỏ hoàn toàn gradient nhỏ",
      "Tích luỹ 'quán tính' theo hướng nhất quán, giúp vượt qua vùng phẳng và dập tắt zigzag trong thung lũng hẹp",
      "Không cần gradient nữa",
    ],
    correct: 2,
    explanation:
      "Công thức v ← β·v + g cộng dồn gradient qua nhiều bước. Hướng nhất quán được cộng dồn → đi nhanh hơn. Hướng dao động (zigzag) triệt tiêu vì các bước ngược dấu. Giống quả bóng có đà lăn xuống thay vì một người rụt rè bước từng bước.",
  },
  {
    question:
      "Adam được gọi là 'Momentum + RMSprop với hiệu chỉnh'. Ưu điểm nổi bật nhất?",
    options: [
      "Luôn cho loss = 0",
      "Mỗi weight tự có learning rate riêng, thích nghi theo lịch sử gradient — gần như chạy tốt ngay cả khi chưa tinh chỉnh siêu tham số",
      "Không cần tính gradient",
      "Chỉ chạy trên GPU",
    ],
    correct: 1,
    explanation:
      "Adam giữ hai bộ nhớ: trung bình gradient (như Momentum) và trung bình bình phương gradient (như RMSprop). Weight có gradient lớn → learning rate tự nhỏ lại, weight ít được cập nhật → learning rate tự lớn lên. Đó là lý do Adam là lựa chọn mặc định cho hầu hết mạng sâu.",
  },
  {
    question:
      "So sánh Batch GD, Mini-batch GD và SGD (theo lượng dữ liệu mỗi bước). Phương án nào được dùng phổ biến nhất trong deep learning ngày nay?",
    options: [
      "Batch GD — dùng toàn bộ tập dữ liệu mỗi bước",
      "Mini-batch GD — dùng một lô nhỏ (thường 32–256 mẫu)",
      "SGD thuần — đúng 1 mẫu mỗi bước",
      "Không có phương án nào được dùng — deep learning không dùng gradient descent",
    ],
    correct: 1,
    explanation:
      "Mini-batch cân bằng giữa ổn định (gradient ít nhiễu) và tốc độ (không cần quét toàn bộ dataset). Batch GD không chạy nổi trên dataset lớn (ImageNet, GPT) — dùng toàn bộ 10M ảnh để tính 1 bước là bất khả thi. SGD thuần quá nhiễu. Mini-batch là cân bằng vàng.",
  },
  {
    type: "fill-blank",
    question:
      "Công thức Vanilla GD cập nhật một weight: θ ← θ − {blank} · ∇L(θ). Ký hiệu này là siêu tham số học, còn gọi là learning rate.",
    blanks: [
      {
        answer: "η",
        accept: ["η", "eta", "alpha", "α", "lr", "learning rate", "tốc độ học"],
      },
    ],
    explanation:
      "η (eta) hoặc α (alpha) là learning rate — kiểm soát kích thước mỗi bước. Quá to → phân kỳ, quá nhỏ → stall. Tinh chỉnh η là kỹ năng quan trọng nhất khi huấn luyện mạng thật.",
  },
  {
    question:
      "Mạng nơ-ron có 175 tỉ weight (ví dụ GPT-3). Khi chạy gradient descent, mỗi bước ta phải tính gradient cho bao nhiêu weight?",
    options: [
      "Chỉ 1 weight — chọn ngẫu nhiên",
      "Chỉ các weight của lớp cuối",
      "Tất cả 175 tỉ — mỗi weight cần gradient của loss theo chính nó để cập nhật",
      "Không cần tính gradient khi mạng lớn",
    ],
    correct: 2,
    explanation:
      "Mỗi weight cần gradient riêng để cập nhật. Với 175 tỉ weight, mỗi bước tính 175 tỉ gradient. Đó là lý do cần GPU/TPU và backpropagation (thuật toán tính gradient hiệu quả qua đồ thị tính toán). Không có backprop, deep learning hiện đại không tồn tại.",
  },
];

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENT 1: LOSS SURFACE + BALL + 3 OPTIMIZER
   TabView chuyển giữa Vanilla / Momentum / Adam, cùng điểm xuất
   phát, cùng LR — người học thấy khác biệt rõ rệt.
   ──────────────────────────────────────────────────────────── */

type OptimKind = "vanilla" | "momentum" | "adam";

interface OptimCtx {
  kind: OptimKind;
  label: string;
  tint: string;
  description: string;
}

const OPTIM_META: Record<OptimKind, OptimCtx> = {
  vanilla: {
    kind: "vanilla",
    label: "Vanilla GD",
    tint: "#3b82f6",
    description:
      "Bước cơ bản nhất: weight ← weight − η · gradient. Trên thung lũng hẹp sẽ zigzag vì trục dốc bị nhảy lố.",
  },
  momentum: {
    kind: "momentum",
    label: "Momentum",
    tint: "#8b5cf6",
    description:
      "Thêm 'quán tính' — mỗi bước là trung bình luỹ kế của gradient. Giảm zigzag, đi mượt xuống đáy thung lũng.",
  },
  adam: {
    kind: "adam",
    label: "Adam",
    tint: "#10b981",
    description:
      "Mỗi weight có learning rate riêng. Gradient lớn → bước nhỏ, gradient nhỏ → bước lớn. Mặc định cho hầu hết deep learning.",
  },
};

function LossSurfacePlayground() {
  const [optim, setOptim] = useState<OptimKind>("vanilla");
  const [start, setStart] = useState<[number, number]>([-2, 2]);
  const [lr, setLr] = useState<number>(0.1);
  const [step, setStep] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const runRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const contourPolys = useMemo(
    () =>
      CONTOUR_LEVELS.map((level) => ({
        level,
        color: contourColor(level),
        pts: sampleContour(level),
      })),
    [],
  );

  const fullTrail = useMemo<StepPoint[]>(() => {
    const steps = 60;
    if (optim === "vanilla") return simulateVanilla(start, lr, steps);
    if (optim === "momentum") return simulateMomentum(start, lr, 0.9, steps);
    return simulateAdam(start, lr, steps);
  }, [optim, start, lr]);

  const visibleTrail = useMemo(
    () => fullTrail.slice(0, Math.min(step + 1, fullTrail.length)),
    [fullTrail, step],
  );

  const current = visibleTrail[visibleTrail.length - 1] ?? {
    x: start[0],
    y: start[1],
    loss: lossAt(start[0], start[1]),
  };

  const [gx, gy] = gradAt(current.x, current.y);
  const gradMag = Math.sqrt(gx * gx + gy * gy);

  const handleStep = useCallback(() => {
    setStep((s) => Math.min(s + 1, fullTrail.length - 1));
  }, [fullTrail.length]);

  const handleReset = useCallback(() => {
    setRunning(false);
    setStep(0);
  }, []);

  useEffect(() => {
    if (!running) {
      if (runRef.current) clearInterval(runRef.current);
      return;
    }
    runRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= fullTrail.length - 1) {
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, 150);
    return () => {
      if (runRef.current) clearInterval(runRef.current);
    };
  }, [running, fullTrail.length]);

  // Reset step when switching optim or start/lr so auto-run behaves
  useEffect(() => {
    setStep(0);
    setRunning(false);
  }, [optim, lr, start]);

  const onClickSurface = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * VIEW_W;
      const py = ((e.clientY - rect.top) / rect.height) * VIEW_H;
      const nx =
        X_MIN + ((px - PAD) / (VIEW_W - 2 * PAD)) * (X_MAX - X_MIN);
      const ny =
        Y_MIN +
        ((VIEW_H - PAD - py) / (VIEW_H - 2 * PAD)) * (Y_MAX - Y_MIN);
      setStart([clamp(nx, X_MIN + 0.1, X_MAX - 0.1), clamp(ny, Y_MIN + 0.1, Y_MAX - 0.1)]);
    },
    [],
  );

  const tint = OPTIM_META[optim].tint;

  const diagnosticKey = `${optim}-${lr.toFixed(2)}-${step > 3 ? "run" : "idle"}`;

  const surfacePanel = (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface/60">
          <div className="flex items-center gap-2 text-xs">
            <Target className="h-3.5 w-3.5 text-accent" />
            <span className="font-semibold text-foreground">
              Mặt loss L(w₁, w₂) — đáy tại (1, −0.5)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-tertiary tabular-nums">
            <span>Bước {step}/{fullTrail.length - 1}</span>
            <span>·</span>
            <span>Loss {current.loss.toFixed(3)}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-50 via-white to-rose-50 dark:from-sky-950/30 dark:via-neutral-950 dark:to-rose-950/30">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="w-full cursor-crosshair"
            onClick={onClickSurface}
            role="img"
            aria-label="Bản đồ loss: bấm để đặt điểm bắt đầu, quan sát đường đi của optimizer."
          >
            <title>
              Bản đồ loss contour — điểm hiện tại tại w₁={current.x.toFixed(2)},
              w₂={current.y.toFixed(2)}, loss={current.loss.toFixed(3)}.
            </title>

            {/* Contours */}
            {contourPolys.map(({ level, color, pts }) => {
              if (pts.length < 3) return null;
              const d =
                pts
                  .map(
                    (p, i) =>
                      `${i === 0 ? "M" : "L"} ${toPX(p.x).toFixed(1)} ${toPY(p.y).toFixed(1)}`,
                  )
                  .join(" ") + " Z";
              return (
                <path
                  key={level}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.1}
                  opacity={0.75}
                />
              );
            })}

            {/* Minimum marker */}
            <circle
              cx={toPX(1)}
              cy={toPY(-0.5)}
              r={5}
              fill="none"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="3,3"
            />
            <text
              x={toPX(1)}
              y={toPY(-0.5) + 18}
              textAnchor="middle"
              fontSize={10}
              fill="#166534"
              fontWeight={600}
            >
              đáy
            </text>

            {/* Start marker */}
            <circle
              cx={toPX(start[0])}
              cy={toPY(start[1])}
              r={4}
              fill="none"
              stroke="#64748b"
              strokeWidth={1.5}
            />
            <text
              x={toPX(start[0])}
              y={toPY(start[1]) - 8}
              textAnchor="middle"
              fontSize={9}
              fill="#64748b"
            >
              xuất phát
            </text>

            {/* Full trail (faded) */}
            {fullTrail.length > 1 && (
              <polyline
                points={fullTrail
                  .map(
                    (p) =>
                      `${toPX(p.x).toFixed(1)},${toPY(p.y).toFixed(1)}`,
                  )
                  .join(" ")}
                fill="none"
                stroke={tint}
                strokeWidth={1}
                strokeDasharray="2,3"
                opacity={0.25}
              />
            )}

            {/* Visible trail (solid) */}
            {visibleTrail.length > 1 && (
              <polyline
                points={visibleTrail
                  .map(
                    (p) =>
                      `${toPX(p.x).toFixed(1)},${toPY(p.y).toFixed(1)}`,
                  )
                  .join(" ")}
                fill="none"
                stroke={tint}
                strokeWidth={2}
                opacity={0.85}
              />
            )}

            {/* Trail dots */}
            {visibleTrail.map((p, i) => (
              <circle
                key={`dot-${i}`}
                cx={toPX(p.x)}
                cy={toPY(p.y)}
                r={1.8}
                fill={tint}
                opacity={0.3 + (i / Math.max(visibleTrail.length, 1)) * 0.5}
              />
            ))}

            {/* Current ball */}
            <motion.circle
              cx={toPX(current.x)}
              cy={toPY(current.y)}
              r={8}
              fill={tint}
              stroke="#fff"
              strokeWidth={2}
              animate={{
                cx: toPX(current.x),
                cy: toPY(current.y),
              }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
            />
          </svg>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-t border-border bg-surface/60">
          <button
            type="button"
            onClick={handleStep}
            disabled={running || step >= fullTrail.length - 1}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent bg-accent text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-40"
          >
            <Footprints className="h-3.5 w-3.5" />
            Một bước
          </button>
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            disabled={step >= fullTrail.length - 1}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              running
                ? "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
                : "border-border bg-card text-foreground hover:border-accent/50"
            } disabled:opacity-40`}
          >
            {running ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Dừng
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Tự chạy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card text-muted px-3 py-1.5 text-xs font-semibold hover:border-accent/50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại
          </button>
          <span className="ml-auto text-[11px] text-tertiary italic tabular-nums">
            |∇L| = {gradMag.toFixed(3)}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-tertiary italic">
        Gợi ý: bấm vào bản đồ để đổi điểm xuất phát. Nền xanh = loss thấp, nền đỏ = loss cao.
      </p>
    </div>
  );

  const lossCurvePanel = (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface/60">
        <div className="flex items-center gap-2 text-xs">
          <TrendingDown className="h-3.5 w-3.5 text-accent" />
          <span className="font-semibold text-foreground">
            Loss theo số bước
          </span>
        </div>
        <span className="text-[11px] text-tertiary italic">
          {OPTIM_META[optim].label}
        </span>
      </div>
      <div className="p-3">
        <LossCurveMini
          trail={fullTrail}
          step={step}
          color={tint}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Optim picker — a thin layer above TabView so state stays coupled */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border">
          {(["vanilla", "momentum", "adam"] as OptimKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setOptim(kind)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-inset focus:ring-2 focus:ring-ring ${
                optim === kind
                  ? "border-b-2 text-accent"
                  : "border-b-2 border-transparent text-muted hover:text-foreground hover:bg-surface"
              }`}
              style={
                optim === kind
                  ? {
                      borderBottomColor: OPTIM_META[kind].tint,
                      color: OPTIM_META[kind].tint,
                    }
                  : undefined
              }
            >
              {OPTIM_META[kind].label}
            </button>
          ))}
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted leading-relaxed">
            {OPTIM_META[optim].description}
          </p>

          {surfacePanel}

          {/* LR slider — wrapping SliderGroup via a small bridge that pushes
              the slider's internal value up so the simulation can react. */}
          <SliderGroup
            title="Điều chỉnh learning rate"
            sliders={[
              {
                key: "lr",
                label: "Learning rate η",
                min: 0.01,
                max: 0.6,
                step: 0.01,
                defaultValue: lr,
              },
            ]}
            visualization={(vals) => (
              <LrBridge
                sliderLr={vals.lr}
                parentLr={lr}
                setParentLr={setLr}
                tint={tint}
              />
            )}
          />

          {lossCurvePanel}

          <AnimatePresence mode="wait">
            <motion.div
              key={diagnosticKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <OptimDiagnostic
                trail={fullTrail}
                step={step}
                optim={optim}
                lr={lr}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Secondary TabView — side-by-side comparison + usage guide */}
      <TabView
        tabs={[
          {
            label: "So sánh ba đường đi",
            content: <ThreeOptimComparison start={start} lr={lr} />,
          },
          {
            label: "Khi nào dùng optimizer nào",
            content: <OptimUsageGuide />,
          },
        ]}
      />
    </div>
  );
}

/* Loss-curve mini chart */
function LossCurveMini({
  trail,
  step,
  color,
}: {
  trail: StepPoint[];
  step: number;
  color: string;
}) {
  const w = 520;
  const h = 120;
  const pad = 24;
  if (trail.length < 2) {
    return (
      <div className="text-xs text-muted text-center py-6">
        Bấm “Một bước” hoặc “Tự chạy” để thấy loss giảm theo thời gian.
      </div>
    );
  }
  const losses = trail.map((p) => p.loss);
  const maxL = Math.max(...losses);
  const minL = Math.min(...losses);
  const range = Math.max(maxL - minL, 0.01);
  const coords = losses.map((l, i) => {
    const x = pad + (i / (losses.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((l - minL) / range) * (h - 2 * pad);
    return [x, y] as [number, number];
  });
  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const visibleCoords = coords.slice(0, Math.min(step + 1, coords.length));
  const visiblePath = visibleCoords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const cursor = coords[Math.min(step, coords.length - 1)];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <title>Đường cong loss theo bước — bóng tại bước hiện tại.</title>
      {/* Axis baseline */}
      <line
        x1={pad}
        y1={h - pad}
        x2={w - pad}
        y2={h - pad}
        stroke="#cbd5e1"
        strokeWidth={1}
      />
      {/* Full path faded */}
      <path d={path} fill="none" stroke={color} strokeWidth={1} opacity={0.3} />
      {/* Visible path solid */}
      <path d={visiblePath} fill="none" stroke={color} strokeWidth={2} />
      {/* Cursor */}
      <circle cx={cursor[0]} cy={cursor[1]} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
      <text
        x={cursor[0] + 6}
        y={cursor[1] - 6}
        fontSize={10}
        fill={color}
        fontWeight={600}
      >
        {losses[Math.min(step, losses.length - 1)].toFixed(2)}
      </text>
      {/* Labels */}
      <text x={pad} y={15} fontSize={9} fill="#64748b">
        loss cao
      </text>
      <text x={pad} y={h - 6} fontSize={9} fill="#64748b">
        loss thấp
      </text>
      <text x={w - pad} y={h - 6} textAnchor="end" fontSize={9} fill="#64748b">
        bước →
      </text>
    </svg>
  );
}

/* Bridges the SliderGroup's internal value up to the parent without
   triggering an update loop. */
function LrBridge({
  sliderLr,
  parentLr,
  setParentLr,
  tint,
}: {
  sliderLr: number;
  parentLr: number;
  setParentLr: (v: number) => void;
  tint: string;
}) {
  useEffect(() => {
    if (Math.abs(sliderLr - parentLr) > 1e-4) {
      setParentLr(sliderLr);
    }
  }, [sliderLr, parentLr, setParentLr]);

  return <LrGauge lr={sliderLr} tint={tint} />;
}

/* Visual gauge for learning rate */
function LrGauge({
  lr,
  tint,
}: {
  lr: number;
  tint: string;
}) {
  const region =
    lr < 0.03
      ? { tag: "Rất chậm", color: "#0ea5e9" }
      : lr < 0.2
        ? { tag: "An toàn", color: "#22c55e" }
        : lr < 0.4
          ? { tag: "Năng động", color: "#f59e0b" }
          : { tag: "Sát giới hạn", color: "#ef4444" };

  return (
    <div className="flex items-center gap-4 w-full">
      <Gauge className="h-5 w-5 shrink-0" style={{ color: tint }} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted">
            η = <strong className="text-foreground tabular-nums">{lr.toFixed(3)}</strong>
          </span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: region.color + "22", color: region.color }}
          >
            {region.tag}
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${(lr / 0.6) * 100}%`,
              backgroundColor: region.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* Diagnostic — tells the learner what happened */
function OptimDiagnostic({
  trail,
  step,
  optim,
  lr,
}: {
  trail: StepPoint[];
  step: number;
  optim: OptimKind;
  lr: number;
}) {
  if (step < 3) {
    return (
      <Callout variant="info" title="Bấm 'Tự chạy' để xem toàn cảnh đường đi">
        Mỗi optimizer đi theo cùng điểm xuất phát nhưng chọn bước khác nhau. Bấm
        ít nhất vài bước rồi xem loss giảm ra sao trên đồ thị bên dưới.
      </Callout>
    );
  }
  const endLoss = trail[Math.min(step, trail.length - 1)].loss;
  const optimal = trail[trail.length - 1].loss;
  const ratio = endLoss / Math.max(optimal, 0.01);
  if (optim === "vanilla" && lr > 0.35) {
    return (
      <Callout variant="warning" title="Vanilla GD + LR hơi to → zigzag rõ rệt">
        Quan sát đường đi xanh lam: trục w₂ dốc nên mỗi bước nhảy qua đáy sang
        vách đối diện. Đây chính là bệnh zigzag — Momentum và Adam sẽ khắc phục.
      </Callout>
    );
  }
  if (ratio > 2.5) {
    return (
      <Callout variant="info" title="Vẫn đang bò về đáy">
        Loss hiện tại còn lớn hơn {ratio.toFixed(1)}× so với loss cuối đường đi.
        Bấm thêm bước — hoặc tăng η một chút (nhưng đừng quá 0.4 với Vanilla).
      </Callout>
    );
  }
  if (optim === "adam") {
    return (
      <Callout variant="tip" title="Adam hội tụ mượt mà">
        Nhìn đồ thị loss: Adam xuống dốc nhanh và đều, ít dao động. Đó là lý do
        Adam là mặc định cho hầu hết bài toán deep learning.
      </Callout>
    );
  }
  if (optim === "momentum") {
    return (
      <Callout variant="tip" title="Momentum giảm zigzag rõ rệt">
        So với Vanilla GD cùng η, đường đi Momentum (tím) ít nảy hơn. Lực
        &ldquo;quán tính&rdquo; làm các bước ngược dấu triệt tiêu.
      </Callout>
    );
  }
  return (
    <Callout variant="tip" title="Vanilla GD đã hội tụ">
      Với η vừa phải, Vanilla GD vẫn tới được đáy. Trên mạng thật nó chậm hơn
      nhiều so với Momentum/Adam — nhưng ý tưởng gốc vẫn là &ldquo;đi ngược
      gradient&rdquo;.
    </Callout>
  );
}

/* Side-by-side comparison of three optims on the same start/lr */
function ThreeOptimComparison({
  start,
  lr,
}: {
  start: [number, number];
  lr: number;
}) {
  const paths = useMemo(() => {
    const steps = 60;
    return {
      vanilla: simulateVanilla(start, lr, steps),
      momentum: simulateMomentum(start, lr, 0.9, steps),
      adam: simulateAdam(start, lr, steps),
    };
  }, [start, lr]);

  const contourPolys = useMemo(
    () =>
      CONTOUR_LEVELS.map((level) => ({
        level,
        color: contourColor(level),
        pts: sampleContour(level),
      })),
    [],
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted leading-relaxed">
        Cùng điểm xuất phát, cùng learning rate, 60 bước — ba optimizer vẽ ba
        đường đi rất khác nhau trên mặt loss.
      </p>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full bg-gradient-to-br from-sky-50 via-white to-rose-50 dark:from-sky-950/30 dark:via-neutral-950 dark:to-rose-950/30"
        >
          <title>
            Ba đường đi của ba optimizer trên cùng bản đồ loss — xanh lam =
            Vanilla, tím = Momentum, xanh ngọc = Adam.
          </title>

          {/* Contours */}
          {contourPolys.map(({ level, color, pts }) => {
            if (pts.length < 3) return null;
            const d =
              pts
                .map(
                  (p, i) =>
                    `${i === 0 ? "M" : "L"} ${toPX(p.x).toFixed(1)} ${toPY(p.y).toFixed(1)}`,
                )
                .join(" ") + " Z";
            return (
              <path
                key={level}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={1}
                opacity={0.5}
              />
            );
          })}

          {/* Start + end markers */}
          <circle
            cx={toPX(start[0])}
            cy={toPY(start[1])}
            r={5}
            fill="#64748b"
            stroke="#fff"
            strokeWidth={1.5}
          />
          <circle
            cx={toPX(1)}
            cy={toPY(-0.5)}
            r={5}
            fill="none"
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="3,3"
          />

          {/* Three paths */}
          {(["vanilla", "momentum", "adam"] as OptimKind[]).map((kind) => {
            const trail = paths[kind];
            const poly = trail
              .map((p) => `${toPX(p.x).toFixed(1)},${toPY(p.y).toFixed(1)}`)
              .join(" ");
            return (
              <polyline
                key={kind}
                points={poly}
                fill="none"
                stroke={OPTIM_META[kind].tint}
                strokeWidth={2}
                opacity={0.85}
              />
            );
          })}

          {/* End-of-path dots */}
          {(["vanilla", "momentum", "adam"] as OptimKind[]).map((kind) => {
            const end = paths[kind][paths[kind].length - 1];
            return (
              <circle
                key={`${kind}-end`}
                cx={toPX(end.x)}
                cy={toPY(end.y)}
                r={5}
                fill={OPTIM_META[kind].tint}
                stroke="#fff"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {(["vanilla", "momentum", "adam"] as OptimKind[]).map((kind) => {
          const end = paths[kind][paths[kind].length - 1];
          return (
            <div
              key={kind}
              className="rounded-lg border p-2"
              style={{
                borderColor: OPTIM_META[kind].tint + "55",
                backgroundColor: OPTIM_META[kind].tint + "10",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <CircleDot
                  className="h-3 w-3"
                  style={{ color: OPTIM_META[kind].tint }}
                />
                <strong style={{ color: OPTIM_META[kind].tint }}>
                  {OPTIM_META[kind].label}
                </strong>
              </div>
              <div className="text-muted tabular-nums">
                loss cuối = {end.loss.toFixed(3)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Simple usage guide card (non-interactive but concise) */
function OptimUsageGuide() {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-4 w-4 text-blue-500" />
          <strong className="text-foreground">Vanilla GD</strong>
        </div>
        <p className="text-muted">
          Dùng để HIỂU nguyên lý. Ít khi dùng cho mạng thật vì zigzag và chậm
          trên thung lũng hẹp. Gặp trong bài giảng và dataset siêu đơn giản.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-violet-500" />
          <strong className="text-foreground">Momentum (SGD + Momentum)</strong>
        </div>
        <p className="text-muted">
          Lựa chọn ưa thích cho mạng thị giác lớn (ResNet, EfficientNet). Bước
          mượt, tổng quát hoá tốt nếu tinh chỉnh η và β đúng cách.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <strong className="text-foreground">Adam / AdamW</strong>
        </div>
        <p className="text-muted">
          Mặc định cho Transformer, LLM, diffusion. Chạy tốt ngay cả khi chưa
          tinh chỉnh kỹ — siêu tham số mặc định (η = 1e-3, β₁ = 0.9, β₂ = 0.999)
          thường đủ dùng.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENT 2: ONE-STEP DETAIL (StepReveal)
   Một điểm cụ thể, ta mổ xẻ 3 pha: tính loss → tính gradient → cập nhật
   ──────────────────────────────────────────────────────────── */

function OneStepDetail() {
  // Fixed demo point: w1 = -1.2, w2 = 1.5, lr = 0.2 (Vanilla GD)
  const w1 = -1.2;
  const w2 = 1.5;
  const lr = 0.2;
  const L = lossAt(w1, w2);
  const [gx, gy] = gradAt(w1, w2);
  const nw1 = w1 - lr * gx;
  const nw2 = w2 - lr * gy;
  const nL = lossAt(nw1, nw2);
  const delta = nL - L;

  const labels = [
    "1. Tính loss tại weight hiện tại",
    "2. Tính gradient của loss theo weight",
    "3. Cập nhật weight — trừ đi η × gradient",
  ];

  return (
    <StepReveal labels={labels}>
      <OneStepPhase1 w1={w1} w2={w2} L={L} />
      <OneStepPhase2 w1={w1} w2={w2} gx={gx} gy={gy} />
      <OneStepPhase3
        w1={w1}
        w2={w2}
        nw1={nw1}
        nw2={nw2}
        lr={lr}
        gx={gx}
        gy={gy}
        delta={delta}
      />
    </StepReveal>
  );
}

function OneStepPhase1({ w1, w2, L }: { w1: number; w2: number; L: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            1. Tính loss tại weight hiện tại
          </h4>
          <p className="text-xs text-muted">
            Với cặp weight hiện tại, loss cho biết ta đang sai bao nhiêu.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-surface p-3 text-sm leading-relaxed space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted">w₁ (hiện tại)</span>
          <strong className="tabular-nums text-foreground">{w1.toFixed(2)}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">w₂ (hiện tại)</span>
          <strong className="tabular-nums text-foreground">{w2.toFixed(2)}</strong>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-blue-600 font-medium">
            L(w₁, w₂) = 0.5·(w₁ − 1)² + 2·(w₂ + 0.5)²
          </span>
          <strong className="tabular-nums text-blue-600">{L.toFixed(3)}</strong>
        </div>
      </div>

      {/* Mini viz: point on a 1D slice to show "how high" */}
      <svg viewBox="0 0 420 80" className="w-full">
        <title>Loss tại điểm hiện tại — cao hay thấp so với đáy.</title>
        <line x1={30} y1={60} x2={390} y2={60} stroke="#cbd5e1" strokeWidth={1} />
        <text x={30} y={74} fontSize={9} fill="#64748b">
          đáy (loss = 0)
        </text>
        <text x={390} y={74} textAnchor="end" fontSize={9} fill="#64748b">
          loss cao
        </text>
        {/* Bar up to loss */}
        <rect
          x={195}
          y={60 - Math.min(40, L * 6)}
          width={14}
          height={Math.min(40, L * 6)}
          fill="#3b82f6"
          rx={2}
        />
        <circle cx={202} cy={60 - Math.min(40, L * 6)} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
        <text
          x={202}
          y={60 - Math.min(40, L * 6) - 10}
          textAnchor="middle"
          fontSize={10}
          fill="#3b82f6"
          fontWeight={700}
        >
          L = {L.toFixed(2)}
        </text>
      </svg>

      <p className="text-xs text-muted italic">
        &ldquo;Càng cao = càng sai. Ta muốn đẩy con số này xuống càng gần 0 càng tốt.&rdquo;
      </p>
    </div>
  );
}

function OneStepPhase2({
  w1,
  w2,
  gx,
  gy,
}: {
  w1: number;
  w2: number;
  gx: number;
  gy: number;
}) {
  const mag = Math.sqrt(gx * gx + gy * gy);
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            2. Tính gradient của loss theo weight
          </h4>
          <p className="text-xs text-muted">
            Mỗi weight có một đạo hàm riêng — cho biết weight đó ảnh hưởng đến loss ra sao.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-surface p-3 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted">∂L/∂w₁ = 1·(w₁ − 1)</span>
          <strong className="tabular-nums text-amber-600">{gx.toFixed(3)}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">∂L/∂w₂ = 4·(w₂ + 0.5)</span>
          <strong className="tabular-nums text-amber-600">{gy.toFixed(3)}</strong>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-muted">|∇L| = √(g₁² + g₂²)</span>
          <strong className="tabular-nums text-amber-700">{mag.toFixed(3)}</strong>
        </div>
      </div>

      {/* Mini viz: gradient arrow at point */}
      <svg viewBox="0 0 420 110" className="w-full">
        <title>Gradient là vector chỉ hướng loss TĂNG nhanh nhất.</title>
        {/* Background ellipses = loss contours */}
        {[30, 45, 60, 75].map((r, i) => (
          <ellipse
            key={r}
            cx={210}
            cy={55}
            rx={r * 1.8}
            ry={r * 0.6}
            fill="none"
            stroke="#6366f1"
            strokeWidth={1}
            opacity={0.25 - i * 0.05}
          />
        ))}
        {/* Point */}
        <circle cx={120} cy={70} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
        <text x={120} y={88} textAnchor="middle" fontSize={9} fill="#1e3a8a" fontWeight={600}>
          (w₁, w₂)
        </text>
        {/* Gradient arrow up-left (toward uphill direction) */}
        <defs>
          <marker
            id="osp2-arrow-up"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="#ef4444" />
          </marker>
          <marker
            id="osp2-arrow-down"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="#22c55e" />
          </marker>
        </defs>
        <line
          x1={120}
          y1={70}
          x2={60}
          y2={25}
          stroke="#ef4444"
          strokeWidth={2.5}
          markerEnd="url(#osp2-arrow-up)"
        />
        <text x={36} y={18} fontSize={10} fill="#ef4444" fontWeight={700}>
          ∇L (lên dốc)
        </text>
        <line
          x1={120}
          y1={70}
          x2={180}
          y2={100}
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeDasharray="4,3"
          markerEnd="url(#osp2-arrow-down)"
        />
        <text x={188} y={104} fontSize={10} fill="#166534" fontWeight={700}>
          −∇L (xuống dốc)
        </text>
      </svg>

      <p className="text-xs text-muted italic">
        &ldquo;Gradient là mũi tên chỉ LÊN dốc loss. Ta sẽ đi NGƯỢC mũi tên đó ở bước 3.&rdquo;
      </p>
    </div>
  );
}

function OneStepPhase3({
  w1,
  w2,
  nw1,
  nw2,
  lr,
  gx,
  gy,
  delta,
}: {
  w1: number;
  w2: number;
  nw1: number;
  nw2: number;
  lr: number;
  gx: number;
  gy: number;
  delta: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
          <Footprints className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            3. Cập nhật weight — trừ đi η × gradient
          </h4>
          <p className="text-xs text-muted">
            Mỗi weight dịch một chút NGƯỢC chiều gradient của chính nó.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-surface p-3 text-sm space-y-2">
        <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 text-center">
          <span className="text-muted">w₁ cũ</span>
          <span className="text-muted">−</span>
          <span className="text-muted">η · g₁</span>
          <span className="text-muted">=</span>
          <span className="text-muted">w₁ mới</span>

          <strong className="tabular-nums text-foreground">{w1.toFixed(2)}</strong>
          <span>−</span>
          <strong className="tabular-nums text-amber-600">
            {lr.toFixed(2)} · {gx.toFixed(2)}
          </strong>
          <span>=</span>
          <strong className="tabular-nums text-emerald-600">{nw1.toFixed(3)}</strong>
        </div>

        <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 text-center border-t border-border pt-2">
          <span className="text-muted">w₂ cũ</span>
          <span className="text-muted">−</span>
          <span className="text-muted">η · g₂</span>
          <span className="text-muted">=</span>
          <span className="text-muted">w₂ mới</span>

          <strong className="tabular-nums text-foreground">{w2.toFixed(2)}</strong>
          <span>−</span>
          <strong className="tabular-nums text-amber-600">
            {lr.toFixed(2)} · {gy.toFixed(2)}
          </strong>
          <span>=</span>
          <strong className="tabular-nums text-emerald-600">{nw2.toFixed(3)}</strong>
        </div>
      </div>

      {/* Mini viz: arrow from old to new point over contour */}
      <svg viewBox="0 0 420 110" className="w-full">
        <title>Weight dịch từ điểm cũ sang điểm mới — loss giảm.</title>
        {[30, 45, 60, 75].map((r, i) => (
          <ellipse
            key={r}
            cx={210}
            cy={55}
            rx={r * 1.8}
            ry={r * 0.6}
            fill="none"
            stroke="#6366f1"
            strokeWidth={1}
            opacity={0.25 - i * 0.05}
          />
        ))}
        <defs>
          <marker
            id="osp3-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="#10b981" />
          </marker>
        </defs>
        <line
          x1={120}
          y1={75}
          x2={200}
          y2={55}
          stroke="#10b981"
          strokeWidth={2.5}
          markerEnd="url(#osp3-arrow)"
        />
        {/* Old point */}
        <circle cx={120} cy={75} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} opacity={0.5} />
        <text x={120} y={98} textAnchor="middle" fontSize={9} fill="#1e3a8a" fontWeight={600}>
          (w cũ)
        </text>
        {/* New point */}
        <circle cx={200} cy={55} r={7} fill="#10b981" stroke="#fff" strokeWidth={2} />
        <text x={200} y={45} textAnchor="middle" fontSize={10} fill="#065f46" fontWeight={700}>
          (w mới)
        </text>
      </svg>

      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-emerald-800 dark:text-emerald-200 font-medium">
            Loss đã giảm
          </span>
          <strong className="tabular-nums text-emerald-700 dark:text-emerald-300">
            Δ = {delta.toFixed(3)} {delta < 0 ? "↓" : "↑"}
          </strong>
        </div>
      </div>

      <p className="text-xs text-muted italic">
        &ldquo;Một bước. Một weight. Một lần giảm loss. Gradient descent là lặp lại việc này
        hàng triệu lần.&rdquo;
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENT 3: BATCH / MINI-BATCH / SGD — compact card triad
   (dùng cho phần CHALLENGE context)
   ──────────────────────────────────────────────────────────── */

function BatchTriad() {
  const variants = [
    {
      name: "Batch GD",
      icon: Layers,
      dataPerStep: "Toàn bộ tập dữ liệu (ví dụ 60 000 ảnh MNIST)",
      pros: "Gradient chính xác, đường đi mượt",
      cons: "Không chạy nổi trên dataset lớn (ImageNet, GPT)",
      tint: "#3b82f6",
    },
    {
      name: "Mini-batch GD",
      icon: Sparkles,
      dataPerStep: "Một lô nhỏ (thường 32–256 mẫu)",
      pros: "Cân bằng: gradient đủ chính xác, đủ nhanh, tận dụng GPU",
      cons: "Có nhiễu nhẹ, cần tinh chỉnh batch size",
      tint: "#10b981",
    },
    {
      name: "SGD thuần",
      icon: Activity,
      dataPerStep: "Đúng 1 mẫu ngẫu nhiên mỗi bước",
      pros: "Cập nhật rất nhanh, có thể thoát saddle point",
      cons: "Gradient rất nhiễu, hội tụ không ổn định",
      tint: "#f59e0b",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {variants.map((v) => {
        const Icon = v.icon;
        return (
          <div
            key={v.name}
            className="rounded-xl border p-4 space-y-2"
            style={{
              borderColor: v.tint + "55",
              backgroundColor: v.tint + "08",
            }}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" style={{ color: v.tint }} />
              <strong className="text-foreground">{v.name}</strong>
            </div>
            <div className="text-[11px] text-muted space-y-1.5 leading-relaxed">
              <div>
                <span className="text-tertiary">Dữ liệu mỗi bước: </span>
                {v.dataPerStep}
              </div>
              <div>
                <span className="text-emerald-600 font-medium">+ </span>
                {v.pros}
              </div>
              <div>
                <span className="text-rose-500 font-medium">− </span>
                {v.cons}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function GradientDescentTopic() {
  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Bắt cầu từ intuition">
        <div className="rounded-2xl border-2 border-accent/30 bg-accent-light p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/60 dark:bg-white/10">
              <TrendingDown className="h-6 w-6 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground leading-snug">
                Bạn đã hiểu gradient là gì. Giờ áp vào bài toán huấn luyện
                thật.
              </h3>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Ở bài{" "}
                <TopicLink slug="gradient-intuition">
                  gradient — mũi tên chỉ đường xuống dốc
                </TopicLink>
                , bạn đã thấy một viên bi lăn trên đồi sương mù. Bi là vị trí, đồi
                là loss, ngón tay chỉ hướng là gradient.
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Giờ đến phần thật sự áp dụng: trong huấn luyện, &ldquo;tọa
                độ&rdquo; không phải (x, y) mà là <strong>các weight</strong> của
                mạng nơ-ron. Mỗi bước gradient descent sẽ <strong>xoay các
                weight này</strong> để loss giảm.
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Bài này tập trung vào <strong>THUẬT TOÁN</strong> — cách máy
                thực sự đi từng bước. Bạn sẽ gặp ba biến thể bước: Vanilla,
                Momentum, Adam. Cùng một địa hình, ba tính cách đi khác nhau.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 text-center space-y-1">
              <Target className="mx-auto h-6 w-6 text-blue-500" />
              <p className="text-[11px] font-semibold text-foreground">Vị trí</p>
              <p className="text-[10px] text-muted leading-tight">
                Vector weight θ = (w₁, w₂, ..., wₙ) của mạng.
              </p>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 text-center space-y-1">
              <Compass className="mx-auto h-6 w-6 text-amber-500" />
              <p className="text-[11px] font-semibold text-foreground">Ngón tay</p>
              <p className="text-[10px] text-muted leading-tight">
                Gradient ∇L — mỗi thành phần tương ứng một weight.
              </p>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-white/5 p-3 text-center space-y-1">
              <Footprints className="mx-auto h-6 w-6 text-emerald-500" />
              <p className="text-[11px] font-semibold text-foreground">Bước</p>
              <p className="text-[10px] text-muted leading-tight">
                θ ← θ − η·∇L — cập nhật tất cả weight cùng lúc.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — DISCOVER ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Mặt loss có dạng thung lũng hẹp (một trục dốc, một trục thoải). Bạn bật Vanilla GD với learning rate vừa phải. Đường đi của weight sẽ như thế nào?"
          options={[
            "Đi thẳng từ điểm xuất phát đến đáy thung lũng",
            "Đứng yên vì gradient bằng 0",
            "Zigzag qua lại giữa hai vách, bò chậm theo trục thoải đến đáy",
            "Nhảy thẳng đến đáy trong một bước duy nhất",
          ]}
          correct={2}
          explanation="Ở trục dốc, gradient lớn → bước dài → dễ nhảy QUA đáy sang vách đối diện. Ở trục thoải, gradient nhỏ → bước ngắn. Kết quả: đường đi zigzag. Chính cái bệnh này làm Momentum và Adam được phát minh."
        >
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Dưới đây bạn sẽ thấy chính xác hành vi đó trên một loss thung lũng
            hẹp — rồi đổi sang Momentum và Adam để xem cải thiện.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — REVEAL (loss surface + 3 optimizers) ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá tương tác">
        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Mặt loss L(w₁, w₂) = 0.5·(w₁ − 1)² + 2·(w₂ + 0.5)² — đáy tại
            (1, −0.5), thung lũng hẹp theo trục w₂. Bấm vào bản đồ để đổi điểm
            xuất phát, chỉnh learning rate, rồi bấm &ldquo;Tự chạy&rdquo; để
            xem bi lăn.
          </p>
          <LossSurfacePlayground />
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — DEEPEN (one step zoomed in) ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Đi sâu — một bước">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Giờ mổ xẻ CHÍNH XÁC một bước Vanilla GD ở điểm cụ thể:
          (w₁, w₂) = (−1.2, 1.5), η = 0.2. Bấm &ldquo;Tiếp tục&rdquo; để xem
          ba pha của một bước.
        </p>
        <OneStepDetail />

        <div className="mt-6">
          <AhaMoment>
            <strong>Gradient descent là vòng lặp ba dòng:</strong> tính loss,
            tính gradient, cập nhật weight. Toàn bộ quá trình huấn luyện — từ
            MNIST đến GPT-4 — là vòng lặp này <em>lặp hàng trăm triệu lần</em>,
            chỉ khác cỡ mạng và cách chọn bước.
          </AhaMoment>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — CHALLENGE ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Một quyết định kỹ thuật quan trọng: mỗi bước gradient descent, ta
          dùng bao nhiêu dữ liệu để tính gradient? Ba lựa chọn, ba đánh đổi.
        </p>

        <BatchTriad />

        <div className="mt-5">
          <InlineChallenge
            question="Bạn huấn luyện ResNet trên ImageNet (1,2 triệu ảnh). Dùng BATCH GD (toàn bộ dataset mỗi bước) — điều gì xảy ra?"
            options={[
              "Huấn luyện siêu nhanh vì gradient chính xác nhất",
              "Mỗi bước phải forward + backward qua 1,2 triệu ảnh → nửa ngày chỉ được 1 bước, RAM GPU không đủ, gần như bất khả thi",
              "Hội tụ ngay sau 1 bước",
              "Tự động chuyển sang Adam",
            ]}
            correct={1}
            explanation="Đây là lý do Batch GD chỉ dạy để hiểu nguyên lý. Thực tế ta dùng Mini-batch (ví dụ 256 ảnh mỗi bước) — vừa ổn định, vừa tận dụng được song song hoá GPU. Với 1,2 triệu ảnh và batch 256 → ~4 700 bước/epoch, chạy được trong giờ."
          />
        </div>

        <div className="mt-5">
          <InlineChallenge
            question="Khi nào bạn NÊN ưu tiên SGD thuần (batch size = 1) thay vì Mini-batch?"
            options={[
              "Luôn ưu tiên vì SGD nhanh nhất",
              "Không bao giờ — SGD thuần hầu như không được dùng trong deep learning thực tế do nhiễu quá lớn và không tận dụng được GPU",
              "Khi dataset siêu lớn",
              "Khi mạng có nhiều lớp",
            ]}
            correct={1}
            explanation="&lsquo;SGD&rsquo; trong ngôn ngữ deep learning ngày nay thực chất ám chỉ Mini-batch GD, không phải SGD thuần. Thuần 1 mẫu gây nhiễu cực lớn và không khai thác được song song GPU/TPU — mỗi mẫu bỏ không 99 % sức mạnh tính toán của mỗi CUDA core."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — EXPLAIN (≤3 LaTeX) ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Giải thích toán">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Ba công thức đóng gói toàn bộ thuật toán. Mỗi công thức đi kèm một
            visual nhỏ và một câu giải thích bằng tiếng Việt đời thường — để
            bạn đọc được chứ không chỉ nhìn mà sợ.
          </p>

          {/* ── Formula 1: Vanilla GD update ── */}
          <div className="rounded-xl border border-border bg-surface/50 p-5 my-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">
                1
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Vanilla Gradient Descent — công thức gốc
                </p>
                <p className="text-xs text-muted">
                  θ là vector toàn bộ weight. η là learning rate. ∇L(θ) là
                  gradient của loss theo θ.
                </p>
              </div>
            </div>

            <LaTeX block>
              {"\\theta_{t+1} = \\theta_t - \\eta \\, \\nabla L(\\theta_t)"}
            </LaTeX>

            {/* Visual: old θ → new θ */}
            <div className="rounded-lg bg-card border border-border p-3">
              <svg viewBox="0 0 440 90" className="w-full">
                <title>Vector weight cũ − η × gradient = vector weight mới.</title>
                <circle cx={60} cy={50} r={7} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
                <text x={60} y={75} textAnchor="middle" fontSize={10} fill="#1e3a8a" fontWeight={600}>
                  θ cũ
                </text>
                <text x={110} y={54} fontSize={14} fill="var(--text-primary)" fontWeight={700}>−</text>
                <line x1={130} y1={50} x2={200} y2={20} stroke="#ef4444" strokeWidth={2} />
                <path d="M 200 20 L 192 19 L 194 27 Z" fill="#ef4444" />
                <text x={206} y={18} fontSize={10} fill="#ef4444" fontWeight={600}>η · ∇L</text>
                <text x={230} y={54} fontSize={14} fill="var(--text-primary)" fontWeight={700}>=</text>
                <circle cx={290} cy={50} r={7} fill="#10b981" stroke="#fff" strokeWidth={2} />
                <text x={290} y={75} textAnchor="middle" fontSize={10} fill="#065f46" fontWeight={600}>
                  θ mới
                </text>
                <line x1={340} y1={50} x2={400} y2={50} stroke="#10b981" strokeWidth={2} strokeDasharray="4,3" />
                <path d="M 400 50 L 392 46 L 392 54 Z" fill="#10b981" />
                <text x={400} y={44} textAnchor="end" fontSize={10} fill="#065f46" fontWeight={600}>
                  gần đáy hơn
                </text>
              </svg>
            </div>

            <p className="text-xs text-muted italic leading-relaxed">
              &ldquo;Lấy weight cũ, trừ đi một bước theo hướng gradient, ra được
              weight mới sát đáy hơn. Đúng một dòng — nhưng lặp nó hàng triệu
              lần thì huấn luyện được GPT.&rdquo;
            </p>
          </div>

          {/* ── Formula 2: SGD / Mini-batch update ── */}
          <div className="rounded-xl border border-border bg-surface/50 p-5 my-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-sm font-bold">
                2
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Mini-batch SGD — dùng một lô nhỏ dữ liệu thay vì cả tập
                </p>
                <p className="text-xs text-muted">
                  B là tập 32–256 mẫu random từ dataset. Gradient được tính
                  trung bình trên B, không phải toàn bộ N mẫu.
                </p>
              </div>
            </div>

            <LaTeX block>
              {"\\theta_{t+1} = \\theta_t - \\eta \\cdot \\frac{1}{|B|}\\sum_{i \\in B} \\nabla L_i(\\theta_t)"}
            </LaTeX>

            {/* Visual: sampling a small batch from large dataset */}
            <div className="rounded-lg bg-card border border-border p-3">
              <svg viewBox="0 0 440 100" className="w-full">
                <title>Lấy ngẫu nhiên một lô nhỏ từ toàn bộ dataset để tính gradient.</title>
                {/* Big dataset grid */}
                <rect x={20} y={15} width={170} height={70} fill="none" stroke="#cbd5e1" strokeWidth={1} rx={4} />
                <text x={105} y={12} textAnchor="middle" fontSize={9} fill="#64748b">
                  Toàn bộ dataset (N mẫu)
                </text>
                {Array.from({ length: 10 * 4 }).map((_, i) => {
                  const col = i % 10;
                  const row = Math.floor(i / 10);
                  const cx = 30 + col * 16;
                  const cy = 25 + row * 16;
                  const isBatch = [3, 7, 12, 17, 22, 28, 33, 36].includes(i);
                  return (
                    <rect
                      key={i}
                      x={cx}
                      y={cy}
                      width={10}
                      height={10}
                      fill={isBatch ? "#f59e0b" : "#e2e8f0"}
                      rx={2}
                    />
                  );
                })}
                {/* Arrow */}
                <line x1={200} y1={50} x2={250} y2={50} stroke="#f59e0b" strokeWidth={2} />
                <path d="M 250 50 L 242 46 L 242 54 Z" fill="#f59e0b" />
                {/* Small batch */}
                <rect x={260} y={25} width={80} height={50} fill="none" stroke="#f59e0b" strokeWidth={1.5} rx={4} />
                <text x={300} y={22} textAnchor="middle" fontSize={9} fill="#b45309">
                  Mini-batch B (|B| mẫu)
                </text>
                {Array.from({ length: 8 }).map((_, i) => {
                  const col = i % 4;
                  const row = Math.floor(i / 4);
                  return (
                    <rect
                      key={`b-${i}`}
                      x={265 + col * 18}
                      y={32 + row * 18}
                      width={12}
                      height={12}
                      fill="#f59e0b"
                      rx={2}
                    />
                  );
                })}
                {/* Arrow to gradient */}
                <line x1={345} y1={50} x2={380} y2={50} stroke="#10b981" strokeWidth={2} />
                <path d="M 380 50 L 372 46 L 372 54 Z" fill="#10b981" />
                <text x={410} y={54} textAnchor="middle" fontSize={10} fill="#065f46" fontWeight={600}>
                  ∇L
                </text>
              </svg>
            </div>

            <p className="text-xs text-muted italic leading-relaxed">
              &ldquo;Thay vì đọc toàn bộ sách trước khi bước, ta đọc nhanh vài
              trang ngẫu nhiên — đủ để biết nên đi hướng nào. Gradient có ồn hơn
              một chút, nhưng 1000× nhanh hơn.&rdquo;
            </p>
          </div>

          {/* ── Formula 3: Momentum ── */}
          <div className="rounded-xl border border-border bg-surface/50 p-5 my-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white text-sm font-bold">
                3
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Momentum — thêm &ldquo;quán tính&rdquo; vào bước
                </p>
                <p className="text-xs text-muted">
                  v là velocity — trung bình luỹ kế của gradient. β thường là
                  0.9, giữ lại 90 % đà cũ mỗi bước.
                </p>
              </div>
            </div>

            <LaTeX block>
              {"v_{t+1} = \\beta v_t + \\nabla L(\\theta_t), \\quad \\theta_{t+1} = \\theta_t - \\eta \\, v_{t+1}"}
            </LaTeX>

            {/* Visual: ball with momentum */}
            <div className="rounded-lg bg-card border border-border p-3">
              <svg viewBox="0 0 440 100" className="w-full">
                <title>Quán tính cộng dồn các bước nhất quán, triệt tiêu các bước ngược dấu.</title>
                {/* Arrows cumulative: several small arrows combining into one big arrow */}
                <line x1={40} y1={50} x2={90} y2={40} stroke="#8b5cf6" strokeWidth={1.5} opacity={0.5} />
                <path d="M 90 40 L 82 38 L 84 46 Z" fill="#8b5cf6" opacity={0.5} />

                <line x1={100} y1={40} x2={145} y2={35} stroke="#8b5cf6" strokeWidth={1.8} opacity={0.7} />
                <path d="M 145 35 L 137 33 L 139 41 Z" fill="#8b5cf6" opacity={0.7} />

                <line x1={155} y1={35} x2={200} y2={30} stroke="#8b5cf6" strokeWidth={2} opacity={0.85} />
                <path d="M 200 30 L 192 28 L 194 36 Z" fill="#8b5cf6" opacity={0.85} />

                {/* Big combined arrow */}
                <line x1={220} y1={60} x2={400} y2={30} stroke="#8b5cf6" strokeWidth={3.5} />
                <path d="M 400 30 L 388 27 L 392 37 Z" fill="#8b5cf6" />
                <text x={300} y={75} fontSize={10} fill="#6d28d9" fontWeight={700} textAnchor="middle">
                  v — quán tính cộng dồn
                </text>

                <text x={120} y={18} fontSize={9} fill="#6d28d9" fontWeight={600} textAnchor="middle">
                  các bước nhất quán cộng dồn
                </text>
              </svg>
            </div>

            <p className="text-xs text-muted italic leading-relaxed">
              &ldquo;Vanilla GD = người đi bộ, mỗi bước chỉ nhìn ngay dưới chân.
              Momentum = quả bóng có đà — khi gradient chỉ cùng hướng nhiều
              bước liền, bóng tăng tốc. Khi gradient đổi chiều nhẹ, đà cũ lấn
              át → triệt tiêu zigzag.&rdquo;
            </p>
          </div>

          <Callout variant="info" title="Adam — tại sao lại là mặc định">
            Adam kết hợp Momentum (công thức 3) với RMSprop (chia mỗi gradient
            cho căn của trung bình bình phương gradient). Kết quả: mỗi weight
            có learning rate riêng, tự thích nghi theo lịch sử. Thêm một chi
            tiết quan trọng là &ldquo;bias correction&rdquo; cho các bước đầu —
            khi v chưa ổn định. Đó là lý do Adam gần như luôn chạy được với
            siêu tham số mặc định, còn Vanilla GD cần tinh chỉnh kỹ.
          </Callout>

          <CollapsibleDetail title="Vì sao phải trừ η·∇L mà không phải cộng?">
            <div className="space-y-2 text-sm leading-relaxed text-muted">
              <p>
                Gradient theo định nghĩa toán học chỉ hướng loss <em>tăng</em>{" "}
                nhanh nhất. Để loss giảm nhanh nhất, ta phải đi NGƯỢC lại —
                tức TRỪ gradient. Nhầm dấu là lỗi phổ biến khi viết trainer thủ
                công: nếu bạn quên dấu trừ, loss sẽ <strong>tăng</strong> thay
                vì giảm, và sau vài bước mạng chập hoàn toàn.
              </p>
              <p>
                Thư viện như PyTorch đã ẩn chi tiết này — khi bạn gọi{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-accent">
                  optimizer.step()
                </code>
                , bước trừ gradient đã được lo sẵn. Nhưng hiểu rõ dấu trừ này
                là thứ phân biệt &ldquo;dùng thư viện&rdquo; với &ldquo;hiểu
                cái mình đang làm&rdquo;.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Learning rate — vì sao nó là siêu tham số khó nhất">
            <div className="space-y-2 text-sm leading-relaxed text-muted">
              <p>
                η (eta) kiểm soát cỡ bước. Không có công thức &ldquo;chọn η
                đúng&rdquo; — phụ thuộc hoàn toàn vào bài toán:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Quá nhỏ (η &lt; 10⁻⁵ cho mạng lớn): huấn luyện đóng băng,
                  loss giảm không đáng kể sau nhiều epoch.
                </li>
                <li>
                  Quá lớn (η &gt; 0.1 cho Adam): gradient phát nổ, loss = NaN
                  sau vài bước.
                </li>
                <li>
                  Vừa phải: một dải khoảng 10 lần (ví dụ 1e-4 đến 1e-3 cho
                  Adam trên Transformer).
                </li>
              </ul>
              <p>
                Thực tế: người ta dùng{" "}
                <strong>learning rate scheduler</strong> — ban đầu η lớn để
                tiến nhanh, cuối quá trình η nhỏ để tinh chỉnh. Ba lịch phổ
                biến: step decay, cosine annealing, warmup+cosine (GPT-3 dùng
                lịch thứ ba).
              </p>
              <p>
                Đọc chi tiết hơn ở{" "}
                <TopicLink slug="learning-rate">
                  learning rate
                </TopicLink>
                {" "}— một bài riêng cho siêu tham số then chốt này.
              </p>
            </div>
          </CollapsibleDetail>

          <p className="leading-relaxed mt-4">
            Để thật sự áp dụng ba công thức này, ta cần thêm hai mảnh ghép: (1)
            cách <em>tính</em> ∇L cho mạng sâu hàng tỉ tham số, và (2) cách
            chia tập dữ liệu thành các epoch/batch. Đó là nội dung của hai bài
            tiếp theo trong lộ trình.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — CONNECT ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt & Liên kết">
        <MiniSummary
          title="Ba ý bạn mang về"
          points={[
            "Gradient descent là vòng lặp ba dòng: tính loss → tính gradient → cập nhật weight theo θ ← θ − η·∇L. Toàn bộ huấn luyện là lặp vòng này hàng triệu lần.",
            "Vanilla GD hay zigzag trên thung lũng hẹp. Momentum thêm quán tính → đi mượt hơn. Adam tự thích nghi learning rate cho từng weight → mặc định trong deep learning hiện đại.",
            "Mỗi bước ta dùng một MINI-BATCH (32–256 mẫu) thay vì toàn bộ dataset — đó là cân bằng vàng giữa chính xác và tốc độ, tận dụng song song hoá GPU.",
          ]}
        />

        <div className="mt-5 space-y-3">
          <Callout variant="tip" title="Hai mảnh ghép tiếp theo">
            Gradient descent cần biết ∇L. Với mạng nhiều lớp, ta tính ∇L qua{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink>{" "}
            — thuật toán truyền ngược sai số qua từng lớp. Và để chia dữ liệu
            thành các lần quét, ta cần hiểu{" "}
            <TopicLink slug="epochs-batches">epoch và batch</TopicLink>
            . Ba bài này hợp lại = toàn bộ vòng huấn luyện.
          </Callout>

          <Callout variant="insight" title="Một sự thật nho nhỏ">
            Gradient descent có từ <strong>1847</strong>, do Augustin-Louis
            Cauchy phát minh để giải hệ phương trình thiên văn. Mãi đến
            2006–2012 người ta mới tìm được cách <em>giữ gradient không
            chết</em> qua nhiều lớp (ReLU, dropout, khởi tạo Xavier/He, batch
            normalization) để ý tưởng cũ kỹ này hoạt động trên mạng sâu 100+
            lớp — và toàn bộ kỷ nguyên deep learning hiện đại bùng nổ từ đó.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
        <div className="mt-6 flex items-center justify-center text-xs text-muted gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Quay lại bản đồ loss ở trên nếu muốn nghịch tiếp ba optimizer.
        </div>
      </LessonSection>

    </>
  );
}
