"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  ToggleCompare,
  SliderGroup,
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
  slug: "gradient-descent",
  title: "Gradient Descent",
  titleVi: "Hạ gradient",
  description:
    "Thuật toán tối ưu cốt lõi trong học máy, tìm cực tiểu của hàm mất mát bằng cách đi theo hướng gradient âm.",
  category: "neural-fundamentals",
  tags: ["optimization", "training", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["learning-rate", "sgd", "loss-functions", "backpropagation"],
  vizType: "interactive",
};

/* ============================================================
 * PHẦN 1 — HẰNG SỐ & TOÁN HỌC CHO LOSS LANDSCAPE 1D
 * ============================================================ */
const X_MIN = -3;
const X_MAX = 7;
const Y_MIN = 0;
const Y_MAX = 28;
const SVG_W = 520;
const SVG_H = 280;
const PAD = 40;
const OPTIMUM = 2; // cực tiểu của (x-2)^2 + 1

function loss(x: number) {
  return (x - OPTIMUM) ** 2 + 1;
}
function grad(x: number) {
  return 2 * (x - OPTIMUM);
}
function sx(x: number) {
  return PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (SVG_W - 2 * PAD);
}
function sy(y: number) {
  return SVG_H - PAD - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (SVG_H - 2 * PAD);
}
function svgToX(svgX: number) {
  return X_MIN + ((svgX - PAD) / (SVG_W - 2 * PAD)) * (X_MAX - X_MIN);
}

/* ============================================================
 * PHẦN 2 — HẰNG SỐ & TOÁN HỌC CHO LOSS LANDSCAPE 2D
 * (dùng cho so sánh optimizer: SGD / Momentum / RMSprop / Adam)
 * ============================================================ */
const LAND_W = 560;
const LAND_H = 340;
const LAND_PAD = 30;
const LAND_X_MIN = -3;
const LAND_X_MAX = 3;
const LAND_Y_MIN = -3;
const LAND_Y_MAX = 3;

/** Hàm loss 2D có cực tiểu tại (1, 1) — dạng thung lũng hẹp theo trục y */
function loss2d(x: number, y: number) {
  const a = x - 1;
  const b = y - 1;
  return 0.5 * a * a + 3 * b * b + 0.4 * Math.sin(1.6 * x) * Math.cos(1.2 * y);
}
function grad2d(x: number, y: number): [number, number] {
  const gx = x - 1 + 0.4 * 1.6 * Math.cos(1.6 * x) * Math.cos(1.2 * y);
  const gy = 6 * (y - 1) - 0.4 * 1.2 * Math.sin(1.6 * x) * Math.sin(1.2 * y);
  return [gx, gy];
}
function lx(x: number) {
  return (
    LAND_PAD +
    ((x - LAND_X_MIN) / (LAND_X_MAX - LAND_X_MIN)) * (LAND_W - 2 * LAND_PAD)
  );
}
function ly(y: number) {
  return (
    LAND_H -
    LAND_PAD -
    ((y - LAND_Y_MIN) / (LAND_Y_MAX - LAND_Y_MIN)) * (LAND_H - 2 * LAND_PAD)
  );
}

/* ============================================================
 * PHẦN 3 — TÍNH TRƯỚC CÁC ĐƯỜNG ĐI CỦA CÁC OPTIMIZER
 * ============================================================ */

type PathPoint = { x: number; y: number; loss: number };

/** SGD thuần: w -= lr * g */
function simulateSGD(
  startX: number,
  startY: number,
  lr: number,
  steps: number,
): PathPoint[] {
  const trail: PathPoint[] = [];
  let x = startX;
  let y = startY;
  for (let i = 0; i < steps; i++) {
    trail.push({ x, y, loss: loss2d(x, y) });
    const [gx, gy] = grad2d(x, y);
    x = Math.max(LAND_X_MIN, Math.min(LAND_X_MAX, x - lr * gx));
    y = Math.max(LAND_Y_MIN, Math.min(LAND_Y_MAX, y - lr * gy));
  }
  return trail;
}

/** Momentum: v = beta*v + g; w -= lr * v */
function simulateMomentum(
  startX: number,
  startY: number,
  lr: number,
  beta: number,
  steps: number,
): PathPoint[] {
  const trail: PathPoint[] = [];
  let x = startX;
  let y = startY;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < steps; i++) {
    trail.push({ x, y, loss: loss2d(x, y) });
    const [gx, gy] = grad2d(x, y);
    vx = beta * vx + gx;
    vy = beta * vy + gy;
    x = Math.max(LAND_X_MIN, Math.min(LAND_X_MAX, x - lr * vx));
    y = Math.max(LAND_Y_MIN, Math.min(LAND_Y_MAX, y - lr * vy));
  }
  return trail;
}

/** RMSprop: s = rho*s + (1-rho)*g^2; w -= lr * g / sqrt(s + eps) */
function simulateRMSprop(
  startX: number,
  startY: number,
  lr: number,
  rho: number,
  steps: number,
): PathPoint[] {
  const trail: PathPoint[] = [];
  let x = startX;
  let y = startY;
  let sx2 = 0;
  let sy2 = 0;
  const eps = 1e-6;
  for (let i = 0; i < steps; i++) {
    trail.push({ x, y, loss: loss2d(x, y) });
    const [gx, gy] = grad2d(x, y);
    sx2 = rho * sx2 + (1 - rho) * gx * gx;
    sy2 = rho * sy2 + (1 - rho) * gy * gy;
    x = Math.max(
      LAND_X_MIN,
      Math.min(LAND_X_MAX, x - (lr * gx) / (Math.sqrt(sx2) + eps)),
    );
    y = Math.max(
      LAND_Y_MIN,
      Math.min(LAND_Y_MAX, y - (lr * gy) / (Math.sqrt(sy2) + eps)),
    );
  }
  return trail;
}

/** Adam: kết hợp Momentum + RMSprop với bias correction */
function simulateAdam(
  startX: number,
  startY: number,
  lr: number,
  steps: number,
): PathPoint[] {
  const beta1 = 0.9;
  const beta2 = 0.999;
  const eps = 1e-8;
  const trail: PathPoint[] = [];
  let x = startX;
  let y = startY;
  let mx = 0;
  let my = 0;
  let vx2 = 0;
  let vy2 = 0;
  for (let i = 0; i < steps; i++) {
    trail.push({ x, y, loss: loss2d(x, y) });
    const [gx, gy] = grad2d(x, y);
    mx = beta1 * mx + (1 - beta1) * gx;
    my = beta1 * my + (1 - beta1) * gy;
    vx2 = beta2 * vx2 + (1 - beta2) * gx * gx;
    vy2 = beta2 * vy2 + (1 - beta2) * gy * gy;
    const t = i + 1;
    const mhx = mx / (1 - Math.pow(beta1, t));
    const mhy = my / (1 - Math.pow(beta1, t));
    const vhx = vx2 / (1 - Math.pow(beta2, t));
    const vhy = vy2 / (1 - Math.pow(beta2, t));
    x = Math.max(
      LAND_X_MIN,
      Math.min(LAND_X_MAX, x - (lr * mhx) / (Math.sqrt(vhx) + eps)),
    );
    y = Math.max(
      LAND_Y_MIN,
      Math.min(LAND_Y_MAX, y - (lr * mhy) / (Math.sqrt(vhy) + eps)),
    );
  }
  return trail;
}

/* ============================================================
 * PHẦN 4 — BỘ QUIZ (8 CÂU) CHO PHẦN CUỐI
 * ============================================================ */
const QUIZ: QuizQuestion[] = [
  {
    question: "Gradient tại điểm cực tiểu của hàm loss có giá trị bằng bao nhiêu?",
    options: ["Giá trị lớn nhất", "0", "Giá trị âm lớn nhất", "1"],
    correct: 1,
    explanation:
      "Tại điểm cực tiểu, độ dốc bằng 0 nên gradient = 0. Đây là dấu hiệu cho thấy thuật toán đã hội tụ.",
  },
  {
    question: "Mini-batch Gradient Descent kết hợp ưu điểm của hai phương pháp nào?",
    options: [
      "Batch GD và Adam",
      "Batch GD và SGD",
      "SGD và RMSprop",
      "Learning rate scheduling và SGD",
    ],
    correct: 1,
    explanation:
      "Mini-batch GD tính gradient trên một lô nhỏ dữ liệu, kết hợp sự ổn định của Batch GD với tốc độ của SGD.",
  },
  {
    question: "Nếu loss không giảm sau nhiều bước, nguyên nhân có thể nhất là gì?",
    options: [
      "Dữ liệu quá ít",
      "Learning rate quá lớn, gây dao động quanh cực tiểu",
      "Máy tính quá chậm",
      "Hàm loss không có cực tiểu",
    ],
    correct: 1,
    explanation:
      "Learning rate quá lớn khiến bước nhảy vượt qua cực tiểu, tạo dao động qua lại mà không bao giờ hội tụ.",
  },
  {
    type: "fill-blank",
    question:
      "Công thức cập nhật trọng số: θ_mới = θ_cũ − α × {blank}, trong đó α là learning rate.",
    blanks: [
      {
        answer: "∇L(θ)",
        accept: ["gradient", "∇L", "grad", "đạo hàm", "nabla L"],
      },
    ],
    explanation:
      "∇L(θ) là gradient (vector đạo hàm) của hàm loss theo vector trọng số θ. Trừ đi gradient nhân learning rate có nghĩa là đi ngược chiều gradient — chiều giảm loss nhanh nhất. Đây là bản chất của gradient descent.",
  },
  {
    question:
      "Momentum giúp gì trong một thung lũng dài và hẹp (ravine) — nơi một trục dốc hơn trục kia rất nhiều?",
    options: [
      "Không ảnh hưởng — giống SGD thuần",
      "Dao động nhiều hơn trên trục dốc",
      "Tích luỹ đà theo hướng nhất quán và dập tắt dao động trên trục dốc, giúp đi thẳng xuống thung lũng nhanh hơn",
      "Làm cho loss luôn tăng",
    ],
    correct: 2,
    explanation:
      "Momentum lưu trung bình luỹ kế (v = β·v + g) của gradient. Hướng nhất quán được cộng dồn → nhanh hơn; hướng dao động bị triệt tiêu vì các bước ngược dấu cộng với v. Đặc biệt hiệu quả ở loss landscape dạng ravine.",
  },
  {
    question:
      "Adam = Momentum + RMSprop. Thành phần nào của RMSprop được Adam kế thừa?",
    options: [
      "Giảm learning rate theo thời gian",
      "Trung bình bình phương gradient v = ρ·v + (1−ρ)·g² để chia tỷ lệ bước nhảy theo độ lớn gradient",
      "Sinh ngẫu nhiên nhiễu",
      "Cập nhật theo hướng ngẫu nhiên",
    ],
    correct: 1,
    explanation:
      "RMSprop chuẩn hoá bước nhảy theo √(v + ε) — tham số có gradient lớn thì bước nhỏ lại, tham số có gradient nhỏ thì bước lớn lên. Adam giữ nguyên cơ chế này và thêm bias correction.",
  },
  {
    question:
      "Cosine annealing scheduler giảm learning rate theo dạng gì theo số epoch?",
    options: [
      "Hằng số — không thay đổi",
      "Tuyến tính — giảm đều theo thời gian",
      "Hình bậc thang — giảm đột ngột tại các mốc cố định",
      "Hình cos — mượt, ban đầu giảm chậm, ở giữa giảm nhanh, gần cuối giảm chậm lại",
    ],
    correct: 3,
    explanation:
      "α_t = α_min + 0.5·(α_max − α_min)·(1 + cos(π·t/T)). Đồ thị hình nửa sóng cos. Ưu điểm: khởi động mượt, tinh chỉnh chậm ở cuối — rất phổ biến trong huấn luyện Transformer và diffusion model.",
  },
  {
    question:
      "Với một hàm loss lồi (convex) và learning rate đủ nhỏ, gradient descent đảm bảo điều gì?",
    options: [
      "Tìm được global minimum",
      "Tìm được local minimum bất kỳ",
      "Không hội tụ",
      "Hội tụ tới saddle point",
    ],
    correct: 0,
    explanation:
      "Hàm lồi có duy nhất một cực tiểu (đó cũng là global minimum). GD với LR đủ nhỏ trên hàm lồi luôn hội tụ về global minimum. Với hàm không lồi (deep learning) thì chỉ đảm bảo tìm được local minimum hoặc saddle point.",
  },
];

/* ============================================================
 * PHẦN 5 — COMPONENT CHÍNH
 * ============================================================ */
export default function GradientDescentTopic() {
  /* ---- 5.1. Trạng thái Step 2: người học tự tay tối ưu ---- */
  const [pos, setPos] = useState<number | null>(null);
  const [lr, setLr] = useState(0.3);
  const [trail, setTrail] = useState<number[]>([]);
  const [steps, setSteps] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = X_MIN + (i / 100) * (X_MAX - X_MIN);
      pts.push(`${sx(x)},${sy(loss(x))}`);
    }
    return pts.join(" ");
  }, []);

  const handleCurveClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * SVG_W;
      const dataX = Math.max(X_MIN, Math.min(X_MAX, svgToX(clickX)));
      setPos(dataX);
      setTrail([]);
      setSteps(0);
    },
    [],
  );

  const takeStep = useCallback(() => {
    if (pos === null) return;
    const g = grad(pos);
    const next = Math.max(X_MIN, Math.min(X_MAX, pos - lr * g));
    setTrail((t) => [...t.slice(-19), pos]);
    setPos(next);
    setSteps((s) => s + 1);
  }, [pos, lr]);

  const resetOptimizer = useCallback(() => {
    setPos(null);
    setTrail([]);
    setSteps(0);
  }, []);

  /* ---- 5.2. Đường đi Batch GD / SGD trên landscape 1D ---- */
  const batchPath = useMemo(() => {
    const pts: number[] = [];
    let x = 6;
    for (let i = 0; i < 40; i++) {
      pts.push(x);
      x = x - 0.15 * grad(x);
      x = Math.max(X_MIN, Math.min(X_MAX, x));
    }
    return pts;
  }, []);

  const sgdPath = useMemo(() => {
    const pts: number[] = [];
    let x = 6;
    for (let i = 0; i < 40; i++) {
      pts.push(x);
      const noise = Math.sin(i * 7.3) * 0.6 + Math.cos(i * 3.1) * 0.4;
      x = x - 0.15 * (grad(x) + noise);
      x = Math.max(X_MIN, Math.min(X_MAX, x));
    }
    return pts;
  }, []);

  const arrowLen = 40;

  return (
    <>
      <ProgressSteps
        current={1}
        total={10}
        labels={[
          "Dự đoán",
          "Tự tay tối ưu",
          "Aha",
          "So sánh biến thể",
          "Quả bóng lăn — Momentum",
          "Bốn optimizer",
          "Lịch học — LR scheduler",
          "Thách thức",
          "Giải thích sâu",
          "Quiz",
        ]}
      />

      {/* ═══════════════════════════════════════════════════
          STEP 1 — HOOK: dự đoán hành vi trong sương mù
          ═══════════════════════════════════════════════════ */}
      <PredictionGate
        question="Bạn đứng trên đỉnh đồi trong sương mù, không thấy gì. Cách tốt nhất để xuống thung lũng là gì?"
        options={[
          "Nhảy thật xa một bước",
          "Bước nhỏ theo hướng dốc nhất",
          "Đi ngẫu nhiên",
          "Đứng yên chờ sương tan",
        ]}
        correct={1}
        explanation="Bước theo hướng dốc nhất chính là ý tưởng cốt lõi của gradient descent!"
      />

      <p className="mb-4 text-sm text-muted leading-relaxed">
        Bạn đã chọn đúng — bước theo hướng dốc nhất. Bây giờ hãy{" "}
        <strong className="text-foreground">THỬ</strong> làm điều đó trên một
        hàm mất mát thực sự. Nhấp vào đường cong để đặt vị trí, rồi bắt đầu đi
        xuống.
      </p>

        {/* ═══════════════════════════════════════════════════
            STEP 2 — NGƯỜI HỌC CHÍNH LÀ OPTIMIZER
            Giữ nguyên viz loss-landscape 1D đã có.
            ═══════════════════════════════════════════════════ */}
        <VisualizationSection>
          <div className="space-y-4">
            <p className="text-sm text-muted text-center">
              {pos === null
                ? "Nhấp vào đường cong để đặt vị trí xuất phát, rồi tự tay tối ưu!"
                : "Nhấn 'Bước tiếp' để đi theo hướng gradient. Thử thay đổi learning rate!"}
            </p>

            {/* SVG đường cong loss 1D */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-2xl mx-auto cursor-crosshair select-none"
              onClick={handleCurveClick}
            >
              <line
                x1={PAD}
                y1={SVG_H - PAD}
                x2={SVG_W - PAD}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />
              <line
                x1={PAD}
                y1={PAD}
                x2={PAD}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={SVG_W / 2}
                y={SVG_H - 8}
                textAnchor="middle"
                fill="#64748b"
                fontSize="11"
              >
                Trọng số (w)
              </text>
              <text
                x={15}
                y={SVG_H / 2}
                textAnchor="middle"
                fill="#64748b"
                fontSize="11"
                transform={`rotate(-90, 15, ${SVG_H / 2})`}
              >
                Loss
              </text>

              <line
                x1={sx(OPTIMUM)}
                y1={SVG_H - PAD}
                x2={sx(OPTIMUM)}
                y2={sy(loss(OPTIMUM))}
                stroke="#22c55e"
                strokeWidth="1"
                strokeDasharray="4,3"
                opacity={0.5}
              />
              <text
                x={sx(OPTIMUM)}
                y={SVG_H - PAD + 14}
                textAnchor="middle"
                fill="#22c55e"
                fontSize="9"
              >
                Cực tiểu
              </text>

              <polyline
                points={curvePoints}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {trail.map((tx, i) => (
                <circle
                  key={`t${i}`}
                  cx={sx(tx)}
                  cy={sy(loss(tx))}
                  r={3}
                  fill="#f59e0b"
                  opacity={0.25 + (i / trail.length) * 0.75}
                />
              ))}

              {pos !== null && (
                <>
                  <line
                    x1={sx(pos)}
                    y1={sy(loss(pos))}
                    x2={sx(pos) - Math.sign(grad(pos)) * arrowLen}
                    y2={sy(loss(pos))}
                    stroke="#ef4444"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="8"
                      markerHeight="6"
                      refX="8"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
                    </marker>
                  </defs>

                  <motion.circle
                    cx={sx(pos)}
                    cy={sy(loss(pos))}
                    r={8}
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth="2"
                    initial={false}
                    animate={{ cx: sx(pos), cy: sy(loss(pos)) }}
                    transition={{ type: "spring", stiffness: 120, damping: 15 }}
                  />
                  <motion.text
                    x={sx(pos)}
                    y={sy(loss(pos)) - 14}
                    textAnchor="middle"
                    fill="#ef4444"
                    fontSize="10"
                    fontWeight="bold"
                    initial={false}
                    animate={{ x: sx(pos), y: sy(loss(pos)) - 14 }}
                  >
                    loss={loss(pos).toFixed(2)}
                  </motion.text>
                </>
              )}
            </svg>

            {/* Điều khiển learning rate */}
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px] space-y-1">
                <label className="text-sm font-medium text-muted">
                  Learning rate:{" "}
                  <strong className="text-foreground">{lr.toFixed(2)}</strong>
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="2.0"
                  step="0.01"
                  value={lr}
                  onChange={(e) => setLr(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-muted">
                  <span>0.01 — chậm</span>
                  <span>2.0 — nhanh</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resetOptimizer}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Đặt lại
                </button>
                <button
                  onClick={takeStep}
                  disabled={pos === null}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Bước tiếp
                </button>
              </div>
            </div>

            {pos !== null && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Số bước</p>
                  <p className="text-lg font-bold text-foreground">{steps}</p>
                </div>
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Loss hiện tại</p>
                  <p className="text-lg font-bold text-foreground">
                    {loss(pos).toFixed(3)}
                  </p>
                </div>
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Gradient</p>
                  <p className="text-lg font-bold text-foreground">
                    {grad(pos).toFixed(3)}
                  </p>
                </div>
              </div>
            )}

            {steps >= 3 && (
              <p className="text-sm text-center text-muted italic">
                Bạn đã dùng {steps} bước để đến loss ={" "}
                {pos !== null ? loss(pos).toFixed(3) : "?"}.
                {loss(pos ?? 99) < 1.1
                  ? " Tuyệt vời, gần cực tiểu rồi!"
                  : " Tiếp tục bước hoặc thử learning rate khác!"}
              </p>
            )}
          </div>
        </VisualizationSection>

        {/* ═══════════════════════════════════════════════════
            STEP 3 — AHA MOMENT
            ═══════════════════════════════════════════════════ */}
        <AhaMoment>
          <p>
            Quy trình bạn vừa thực hiện — đi theo hướng gradient, với bước nhảy
            tỷ lệ thuận với learning rate — chính là{" "}
            <strong>Gradient Descent</strong>!
          </p>
          <p className="text-sm mt-2 opacity-80">
            Công thức:{" "}
            <LaTeX>{"\\theta_{t+1} = \\theta_t - \\alpha \\nabla L(\\theta_t)"}</LaTeX>
          </p>
        </AhaMoment>

        {/* ═══════════════════════════════════════════════════
            STEP 4 — SO SÁNH BATCH GD vs SGD
            ═══════════════════════════════════════════════════ */}
        <ToggleCompare
          labelA="Batch GD"
          labelB="SGD"
          description="So sánh đường đi tối ưu: mượt mà vs. nhiễu nhưng cùng hướng"
          childA={
            <VariantViz
              path={batchPath}
              curvePoints={curvePoints}
              color="#3b82f6"
              label="Batch GD: đường đi mượt mà"
            />
          }
          childB={
            <VariantViz
              path={sgdPath}
              curvePoints={curvePoints}
              color="#f59e0b"
              label="SGD: đường đi zigzag nhưng nhanh"
            />
          }
        />

        <SliderGroup
          title="Thí nghiệm: điều chỉnh tham số"
          sliders={[
            {
              key: "lr",
              label: "Learning rate",
              min: 0.01,
              max: 2.0,
              step: 0.01,
              defaultValue: 0.3,
            },
            {
              key: "start",
              label: "Vị trí xuất phát",
              min: -3,
              max: 7,
              step: 0.1,
              defaultValue: 6,
            },
          ]}
          visualization={(vals) => (
            <SliderViz
              lr={vals.lr}
              start={vals.start}
              curvePoints={curvePoints}
            />
          )}
        />

        {/* ═══════════════════════════════════════════════════
            STEP 5 — MOMENTUM: QUẢ BÓNG LĂN XUỐNG ĐỒI
            ═══════════════════════════════════════════════════ */}
        <LessonSection step={5} totalSteps={10} label="Quả bóng lăn">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Momentum — khi optimizer có &quot;quán tính&quot;
          </h3>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            SGD thuần giống một người đi bộ thận trọng: mỗi bước chỉ nhìn gradient
            ngay tại đó. Còn <strong>Momentum</strong> giống một quả bóng lăn —
            khi đã có đà, nó tiếp tục lăn theo hướng cũ ngay cả khi gradient đổi
            chiều nhẹ. Hãy xem khác biệt trên cùng một loss landscape.
          </p>
          <MomentumBall />
        </LessonSection>

        {/* ═══════════════════════════════════════════════════
            STEP 6 — BỐN OPTIMIZER: SGD / MOMENTUM / RMSPROP / ADAM
            ═══════════════════════════════════════════════════ */}
        <LessonSection step={6} totalSteps={10} label="Bốn optimizer">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            So sánh 4 optimizer trên cùng một landscape 2D
          </h3>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Cùng xuất phát tại góc trên-phải, cùng chạy 60 bước, cùng learning
            rate — nhưng 4 optimizer tới cực tiểu theo 4 cách rất khác nhau.
          </p>
          <OptimizerArena />
        </LessonSection>

        <Callout variant="insight" title="Vì sao Adam phổ biến nhất?">
          Adam kết hợp <strong>Momentum</strong> (trung bình động của gradient)
          và <strong>RMSprop</strong> (chuẩn hoá theo bình phương gradient), cộng
          thêm <em>bias correction</em> ở những bước đầu. Trong hầu hết bài toán
          deep learning ngày nay, Adam (hoặc biến thể AdamW) là lựa chọn mặc
          định — chạy tốt ngay cả khi bạn chưa tinh chỉnh siêu tham số kỹ.
        </Callout>

        {/* ═══════════════════════════════════════════════════
            STEP 7 — LR SCHEDULER
            ═══════════════════════════════════════════════════ */}
        <LessonSection step={7} totalSteps={10} label="Lịch học">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Learning rate không cần cố định — lịch điều phối
          </h3>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Giai đoạn đầu huấn luyện bạn muốn bước <em>lớn</em> để tiến nhanh. Gần
            cuối bạn muốn bước <em>nhỏ</em> để tinh chỉnh. Đó là lý do{" "}
            <strong>learning rate scheduler</strong> ra đời. Hãy so sánh 3 lịch
            phổ biến.
          </p>
          <LRScheduler />
        </LessonSection>

        <Callout variant="tip" title="Warm-up: thủ thuật thần kỳ của Transformer">
          Mô hình Transformer lớn thường bị nổ gradient ở những bước đầu do trọng
          số chưa ổn định. Giải pháp: <strong>warm-up</strong> — tăng LR từ 0 lên
          α_max trong vài ngàn bước đầu, sau đó mới cho scheduler (cosine/step)
          giảm dần. Công thức GPT-3: warm-up 375M token đầu tiên.
        </Callout>

        {/* ═══════════════════════════════════════════════════
            STEP 8 — CHALLENGE
            ═══════════════════════════════════════════════════ */}
        <InlineChallenge
          question="Learning rate = 5.0 trên hàm loss này sẽ gây ra điều gì?"
          options={[
            "Hội tụ nhanh hơn",
            "Dao động qua lại không hội tụ",
            "Không ảnh hưởng gì",
          ]}
          correct={1}
          explanation="LR quá lớn khiến bước nhảy vượt qua điểm tối ưu, tạo dao động!"
        />

        <InlineChallenge
          question="Bạn đang huấn luyện GPT-2 với Adam, loss giảm tới epoch 8 thì bắt đầu dao động lên xuống không hội tụ. Can thiệp nào HỢP LÝ NHẤT?"
          options={[
            "Tăng learning rate gấp đôi để nhảy ra khỏi dao động",
            "Giảm learning rate (hoặc bật cosine scheduler) — mô hình đang bước quá xa quanh cực tiểu",
            "Đổi sang SGD thuần — Adam không phù hợp cho Transformer",
            "Tăng batch size lên gấp 10 — gradient sẽ chính xác hơn",
          ]}
          correct={1}
          explanation="Dao động ở cuối huấn luyện là dấu hiệu kinh điển của LR quá lớn khi đã gần cực tiểu. Giảm LR (manual hoặc cosine decay) gần như luôn là bước can thiệp đầu tiên. Thay optimizer hoặc batch size không địa chỉ nguyên nhân."
        />

        {/* ═══════════════════════════════════════════════════
            STEP 9 — GIẢI THÍCH SÂU
            ═══════════════════════════════════════════════════ */}
        <ExplanationSection>
          <p>
            <strong>Gradient Descent</strong> cập nhật trọng số theo công thức
            (gradient được tính bởi{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink>):
          </p>
          <LaTeX block>
            {"\\theta_{t+1} = \\theta_t - \\alpha \\nabla L(\\theta_t)"}
          </LaTeX>
          <p>
            Trong đó <strong>θ</strong> là vector trọng số, <strong>α</strong> là
            learning rate, và <strong>∇L(θ)</strong> là gradient của{" "}
            <TopicLink slug="loss-functions">hàm loss</TopicLink>. Việc tính đạo
            hàm dựa trên nền tảng{" "}
            <TopicLink slug="calculus-for-backprop">vi tích phân</TopicLink>, đặc
            biệt là đạo hàm riêng.
          </p>

          <h4 className="text-base font-semibold text-foreground mt-6 mb-2">
            Ba biến thể cơ bản theo lượng dữ liệu
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold text-foreground">
                    Biến thể
                  </th>
                  <th className="text-left py-2 pr-4 font-semibold text-foreground">
                    Dữ liệu mỗi bước
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Đặc điểm
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">Batch GD</td>
                  <td className="py-2 pr-4">Toàn bộ tập dữ liệu</td>
                  <td className="py-2">Ổn định, chậm với dữ liệu lớn</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">SGD</td>
                  <td className="py-2 pr-4">1 mẫu ngẫu nhiên</td>
                  <td className="py-2">Nhanh, dao động nhiều</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Mini-batch GD</td>
                  <td className="py-2 pr-4">Một lô nhỏ (32-256 mẫu)</td>
                  <td className="py-2">Cân bằng tốc độ và ổn định</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="text-base font-semibold text-foreground mt-6 mb-2">
            Công thức cập nhật của 4 optimizer quan trọng
          </h4>
          <p className="text-sm text-muted">
            Gọi <LaTeX>{"g_t = \\nabla L(\\theta_t)"}</LaTeX>. Bảng dưới thể hiện
            bước cập nhật của SGD (thuần), SGD+Momentum, RMSprop và Adam.
          </p>

          <LaTeX block>
            {
              "\\text{SGD:}\\quad \\theta_{t+1} = \\theta_t - \\alpha\\, g_t"
            }
          </LaTeX>
          <LaTeX block>
            {
              "\\text{Momentum:}\\quad v_t = \\beta v_{t-1} + g_t,\\; \\theta_{t+1} = \\theta_t - \\alpha\\, v_t"
            }
          </LaTeX>
          <LaTeX block>
            {
              "\\text{RMSprop:}\\quad s_t = \\rho s_{t-1} + (1-\\rho) g_t^2,\\; \\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{s_t}+\\varepsilon}\\, g_t"
            }
          </LaTeX>
          <LaTeX block>
            {
              "\\text{Adam:}\\quad m_t = \\beta_1 m_{t-1} + (1-\\beta_1) g_t,\\; v_t = \\beta_2 v_{t-1} + (1-\\beta_2) g_t^2"
            }
          </LaTeX>
          <LaTeX block>
            {
              "\\hat{m}_t = \\frac{m_t}{1-\\beta_1^t},\\; \\hat{v}_t = \\frac{v_t}{1-\\beta_2^t},\\; \\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{\\hat{v}_t}+\\varepsilon}\\, \\hat{m}_t"
            }
          </LaTeX>

          <CodeBlock language="python" title="sgd_vanilla.py — phiên bản nguyên thuỷ">
            {`"""Gradient Descent thuần bằng NumPy.

Ví dụ với hàm 1D: L(w) = (w - 2)^2 + 1
Cực tiểu tại w = 2, L = 1.
"""
import numpy as np


def loss_fn(w: float) -> float:
    return (w - 2.0) ** 2 + 1.0


def grad_fn(w: float) -> float:
    return 2.0 * (w - 2.0)


def gradient_descent(
    w_init: float,
    lr: float = 0.1,
    steps: int = 200,
    tol: float = 1e-6,
) -> tuple[float, list[float]]:
    """Trả về (w_cuối, lịch sử loss)."""
    w = w_init
    history: list[float] = [loss_fn(w)]
    for step in range(steps):
        g = grad_fn(w)
        w = w - lr * g
        history.append(loss_fn(w))
        if abs(g) < tol:
            print(f"Hội tụ tại bước {step}, |grad| = {abs(g):.2e}")
            break
    return w, history


if __name__ == "__main__":
    w_star, hist = gradient_descent(w_init=6.0, lr=0.1, steps=100)
    print(f"w* = {w_star:.6f}, loss = {loss_fn(w_star):.6f}")`}
          </CodeBlock>

          <CodeBlock language="python" title="sgd_pytorch.py — PyTorch đầy đủ với Momentum, RMSprop, Adam">
            {`"""Huấn luyện một MLP nhỏ với 4 optimizer, so sánh đường hội tụ.

Yêu cầu: torch >= 2.0
"""
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset


# ---------------------------------------------------------
# 1. Dữ liệu giả lập — hồi quy y = 3x + nhiễu
# ---------------------------------------------------------
torch.manual_seed(42)
X = torch.randn(1000, 4)
y = X @ torch.tensor([3.0, -1.5, 2.0, 0.5]) + 0.1 * torch.randn(1000)
loader = DataLoader(TensorDataset(X, y), batch_size=32, shuffle=True)


# ---------------------------------------------------------
# 2. Kiến trúc MLP đơn giản
# ---------------------------------------------------------
def build_model() -> nn.Module:
    return nn.Sequential(
        nn.Linear(4, 16),
        nn.ReLU(),
        nn.Linear(16, 1),
    )


# ---------------------------------------------------------
# 3. Bốn optimizer, cùng learning rate
# ---------------------------------------------------------
def make_optimizers(model: nn.Module, lr: float = 1e-2):
    return {
        "SGD":      torch.optim.SGD(model.parameters(), lr=lr),
        "Momentum": torch.optim.SGD(model.parameters(), lr=lr, momentum=0.9),
        "RMSprop":  torch.optim.RMSprop(model.parameters(), lr=lr, alpha=0.99),
        "Adam":     torch.optim.Adam(model.parameters(), lr=lr,
                                     betas=(0.9, 0.999), eps=1e-8),
    }


# ---------------------------------------------------------
# 4. Vòng huấn luyện + LR scheduler
# ---------------------------------------------------------
def train_one(name: str, model: nn.Module, opt: torch.optim.Optimizer,
              epochs: int = 20):
    loss_fn = nn.MSELoss()
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    losses: list[float] = []

    for epoch in range(epochs):
        epoch_loss = 0.0
        for xb, yb in loader:
            opt.zero_grad(set_to_none=True)
            pred = model(xb).squeeze(-1)
            loss = loss_fn(pred, yb)
            loss.backward()                 # tính gradient = backpropagation
            opt.step()                      # cập nhật trọng số
            epoch_loss += loss.item() * len(xb)
        scheduler.step()                    # cập nhật learning rate
        epoch_loss /= len(loader.dataset)
        losses.append(epoch_loss)
        if epoch % 5 == 0:
            lr_now = scheduler.get_last_lr()[0]
            print(f"[{name}] epoch {epoch:3d}  loss={epoch_loss:.4f}  lr={lr_now:.5f}")
    return losses


if __name__ == "__main__":
    for name in ["SGD", "Momentum", "RMSprop", "Adam"]:
        model = build_model()
        opt = make_optimizers(model)[name]
        train_one(name, model, opt)`}
          </CodeBlock>

          <Callout variant="tip" title="Learning rate scheduling — ba lịch phổ biến">
            (1) <strong>Step decay</strong>: giảm 10× mỗi 30 epoch — đơn giản, phù
            hợp bài toán vision truyền thống. (2) <strong>Cosine annealing</strong>:
            α_t = α_min + 0.5·(α_max − α_min)·(1 + cos(πt/T)) — Transformer,
            diffusion thường dùng. (3) <strong>ReduceLROnPlateau</strong>: giảm
            khi loss ngừng cải thiện — an toàn nhất khi không biết cấu trúc loss.
          </Callout>

          <CollapsibleDetail title="Vì sao SGD vẫn sống — dù Adam mạnh hơn?">
            <p className="text-sm text-muted leading-relaxed">
              Một kết quả gây tranh cãi nhiều năm: với <em>computer vision</em>{" "}
              (ResNet, EfficientNet trên ImageNet), <strong>SGD + Momentum</strong>{" "}
              thường <em>generalize</em> tốt hơn Adam trên tập test, dù Adam hội
              tụ nhanh hơn trên tập train. Giả thuyết chính: Adam có xu hướng lao
              vào các <em>sharp minima</em> — cực tiểu hẹp, nhạy cảm với nhiễu.
              SGD với nhiễu batch tự nhiên có khuynh hướng tìm <em>flat minima</em>{" "}
              — cực tiểu phẳng, ổn định hơn khi phân bố dữ liệu thay đổi nhẹ.
            </p>
            <p className="text-sm text-muted leading-relaxed mt-2">
              Vì vậy quy tắc ngón tay cái năm 2024:
            </p>
            <ul className="text-sm text-muted list-disc list-inside space-y-1 mt-1">
              <li>Transformer / LLM / NLP → AdamW (gần như mặc định)</li>
              <li>Vision (CNN) → SGD + Momentum (nếu có thời gian tinh chỉnh)</li>
              <li>Nhanh-thử-nghiệm → Adam</li>
            </ul>
          </CollapsibleDetail>

          <CollapsibleDetail title="Saddle point và vì sao deep learning vẫn hoạt động">
            <p className="text-sm text-muted leading-relaxed">
              Hàm loss của mạng nơ-ron lớn <em>không lồi</em> — có vô số điểm tới
              hạn (gradient = 0). Trực giác bạn có thể nghĩ GD sẽ mắc kẹt ở local
              minimum. Thực tế: trong không gian cao chiều, <strong>điểm tới hạn
              đa số là saddle point</strong> (có hướng đi lên và đi xuống) chứ
              không phải local minimum. Gradient descent với một chút nhiễu
              (stochastic) gần như luôn thoát được saddle point.
            </p>
            <p className="text-sm text-muted leading-relaxed mt-2">
              Đây là lý do thực nghiệm cho thấy các mô hình lớn hội tụ ổn định
              dù lý thuyết tối ưu phi lồi bi quan.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>

        {/* ═══════════════════════════════════════════════════
            STEP 10 — TÓM TẮT & QUIZ
            ═══════════════════════════════════════════════════ */}
        <MiniSummary
          title="Gradient Descent — 6 điểm cốt lõi"
          points={[
            "Gradient chỉ hướng tăng nhanh nhất của loss; đi NGƯỢC gradient để giảm loss. Công thức: θ ← θ − α∇L(θ).",
            "Learning rate α là siêu tham số số-một: quá nhỏ thì ì, quá lớn thì dao động/nổ. Thử tầm 1e-1 đến 1e-5.",
            "Ba biến thể theo dữ liệu: Batch (toàn bộ), SGD (1 mẫu), Mini-batch (32–256 — lựa chọn mặc định).",
            "Momentum tích luỹ đà, giúp đi thẳng xuống ravine; RMSprop chuẩn hoá bước theo độ lớn gradient; Adam = Momentum + RMSprop + bias correction.",
            "LR scheduler (step/cosine/plateau) hầu như luôn tốt hơn LR cố định; Transformer thường cần thêm warm-up.",
            "Deep learning hoạt động được vì trong không gian cao chiều, đa số điểm tới hạn là saddle point (thoát được) chứ không phải local minimum.",
          ]}
        />

        <QuizSection questions={QUIZ} />
    </>
  );
}

/* ============================================================
 * PHẦN 6 — SUB-COMPONENT: VARIANT VIZ (đã có từ trước)
 * ============================================================ */
function VariantViz({
  path,
  curvePoints,
  color,
  label,
}: {
  path: number[];
  curvePoints: string;
  color: string;
  label: string;
}) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setFrame(0);
    intervalRef.current = setInterval(() => {
      setFrame((f) => {
        if (f >= path.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return f;
        }
        return f + 1;
      });
    }, 120);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [path]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-center text-muted">{label}</p>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full max-w-xl mx-auto">
        <line
          x1={PAD}
          y1={SVG_H - PAD}
          x2={SVG_W - PAD}
          y2={SVG_H - PAD}
          stroke="#334155"
          strokeWidth="1"
        />
        <polyline
          points={curvePoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          opacity={0.4}
        />
        {path.slice(0, frame + 1).map((x, i) => (
          <circle
            key={i}
            cx={sx(x)}
            cy={sy(loss(x))}
            r={3}
            fill={color}
            opacity={0.2 + (i / (frame + 1)) * 0.8}
          />
        ))}
        {path.slice(0, frame + 1).map((x, i) =>
          i > 0 ? (
            <line
              key={`l${i}`}
              x1={sx(path[i - 1])}
              y1={sy(loss(path[i - 1]))}
              x2={sx(x)}
              y2={sy(loss(x))}
              stroke={color}
              strokeWidth="1.5"
              opacity={0.5}
            />
          ) : null,
        )}
        <motion.circle
          cx={sx(path[frame])}
          cy={sy(loss(path[frame]))}
          r={7}
          fill={color}
          stroke="white"
          strokeWidth="2"
          initial={false}
          animate={{ cx: sx(path[frame]), cy: sy(loss(path[frame])) }}
          transition={{ type: "spring", stiffness: 120 }}
        />
      </svg>
    </div>
  );
}

/* ============================================================
 * PHẦN 7 — SUB-COMPONENT: SLIDER VIZ (đã có từ trước)
 * ============================================================ */
function SliderViz({
  lr,
  start,
  curvePoints,
}: {
  lr: number;
  start: number;
  curvePoints: string;
}) {
  const path = useMemo(() => {
    const pts: number[] = [];
    let x = start;
    for (let i = 0; i < 30; i++) {
      pts.push(x);
      x = x - lr * grad(x);
      x = Math.max(X_MIN, Math.min(X_MAX, x));
    }
    return pts;
  }, [lr, start]);

  const diverges = path.some((x) => loss(x) > 50);

  return (
    <div className="space-y-2 w-full">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full max-w-xl mx-auto">
        <line
          x1={PAD}
          y1={SVG_H - PAD}
          x2={SVG_W - PAD}
          y2={SVG_H - PAD}
          stroke="#334155"
          strokeWidth="1"
        />
        <polyline
          points={curvePoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          opacity={0.4}
        />
        <line
          x1={sx(OPTIMUM)}
          y1={SVG_H - PAD}
          x2={sx(OPTIMUM)}
          y2={sy(loss(OPTIMUM))}
          stroke="#22c55e"
          strokeWidth="1"
          strokeDasharray="4,3"
          opacity={0.4}
        />

        {path.map((x, i) => {
          const y = Math.min(loss(x), Y_MAX);
          return (
            <circle
              key={i}
              cx={sx(x)}
              cy={sy(y)}
              r={i === 0 ? 6 : 3}
              fill={i === 0 ? "#3b82f6" : "#f59e0b"}
              opacity={i === 0 ? 1 : 0.3 + (i / path.length) * 0.7}
            />
          );
        })}
        {path.map((x, i) =>
          i > 0 ? (
            <line
              key={`l${i}`}
              x1={sx(path[i - 1])}
              y1={sy(Math.min(loss(path[i - 1]), Y_MAX))}
              x2={sx(x)}
              y2={sy(Math.min(loss(x), Y_MAX))}
              stroke="#f59e0b"
              strokeWidth="1"
              opacity={0.3}
            />
          ) : null,
        )}

        <circle
          cx={sx(path[path.length - 1])}
          cy={sy(Math.min(loss(path[path.length - 1]), Y_MAX))}
          r={6}
          fill="#ef4444"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <p className="text-xs text-center text-muted">
        {diverges
          ? "LR quá lớn — bước nhảy vượt khỏi đồ thị!"
          : `Sau 30 bước: loss = ${loss(path[path.length - 1]).toFixed(3)}`}
      </p>
    </div>
  );
}

/* ============================================================
 * PHẦN 8 — SUB-COMPONENT: MOMENTUM BALL
 * Quả bóng lăn: so sánh SGD vs SGD+Momentum trên cùng landscape 1D
 * ============================================================ */
function MomentumBall() {
  const [running, setRunning] = useState(false);
  const [beta, setBeta] = useState(0.9);
  const [frame, setFrame] = useState(0);
  const [mode, setMode] = useState<"sgd" | "momentum" | "both">("both");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Landscape đặc biệt: có chỗ lõm nông ở giữa, cực tiểu chính bên phải.
  // L(x) = 0.5*(x-2)^2 + 0.6*sin(1.5*x)
  const ball_loss = useCallback(
    (x: number) => 0.5 * (x - 2) ** 2 + 0.6 * Math.sin(1.5 * x),
    [],
  );
  const ball_grad = useCallback(
    (x: number) => x - 2 + 0.6 * 1.5 * Math.cos(1.5 * x),
    [],
  );

  const STEPS = 80;
  const X0 = -2.5;
  const LR = 0.08;

  const { sgdPath: sPath, momPath: mPath } = useMemo(() => {
    const sPath: number[] = [];
    const mPath: number[] = [];
    let xs = X0;
    let xm = X0;
    let vm = 0;
    for (let i = 0; i < STEPS; i++) {
      sPath.push(xs);
      mPath.push(xm);
      xs = xs - LR * ball_grad(xs);
      vm = beta * vm + ball_grad(xm);
      xm = xm - LR * vm;
    }
    return { sgdPath: sPath, momPath: mPath };
  }, [beta, ball_grad]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setFrame(0);
    intervalRef.current = setInterval(() => {
      setFrame((f) => {
        if (f >= STEPS - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          return f;
        }
        return f + 1;
      });
    }, 80);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const W = 560;
  const H = 220;
  const P = 30;
  const xmin = -4;
  const xmax = 5;
  const ymin = -1;
  const ymax = 6;
  const toX = (x: number) =>
    P + ((x - xmin) / (xmax - xmin)) * (W - 2 * P);
  const toY = (y: number) =>
    H - P - ((y - ymin) / (ymax - ymin)) * (H - 2 * P);

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = xmin + (i / 200) * (xmax - xmin);
      pts.push(`${toX(x)},${toY(ball_loss(x))}`);
    }
    return pts.join(" ");
  }, [ball_loss]);

  const showSGD = mode === "sgd" || mode === "both";
  const showMom = mode === "momentum" || mode === "both";

  return (
    <VisualizationSection>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {(["sgd", "momentum", "both"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === m
                ? "bg-accent text-white"
                : "bg-card border border-border text-muted hover:text-foreground"
            }`}
          >
            {m === "sgd" ? "Chỉ SGD" : m === "momentum" ? "Chỉ Momentum" : "Cả hai"}
          </button>
        ))}
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-muted">
            β (momentum): <strong>{beta.toFixed(2)}</strong>
          </label>
          <input
            type="range"
            min="0"
            max="0.98"
            step="0.01"
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
        <button
          onClick={() => setRunning(true)}
          disabled={running}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {running ? "Đang chạy…" : "Chạy lại"}
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-3xl mx-auto">
        <polyline
          points={curve}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          opacity={0.4}
        />

        {/* đường SGD */}
        {showSGD &&
          sPath.slice(0, frame + 1).map((x, i) =>
            i > 0 ? (
              <line
                key={`s${i}`}
                x1={toX(sPath[i - 1])}
                y1={toY(ball_loss(sPath[i - 1]))}
                x2={toX(x)}
                y2={toY(ball_loss(x))}
                stroke="#f59e0b"
                strokeWidth="1.5"
                opacity={0.5}
              />
            ) : null,
          )}
        {/* đường Momentum */}
        {showMom &&
          mPath.slice(0, frame + 1).map((x, i) =>
            i > 0 ? (
              <line
                key={`m${i}`}
                x1={toX(mPath[i - 1])}
                y1={toY(ball_loss(mPath[i - 1]))}
                x2={toX(x)}
                y2={toY(ball_loss(x))}
                stroke="#22c55e"
                strokeWidth="1.5"
                opacity={0.6}
              />
            ) : null,
          )}

        {/* Quả bóng SGD */}
        {showSGD && (
          <motion.circle
            cx={toX(sPath[frame])}
            cy={toY(ball_loss(sPath[frame]))}
            r={9}
            fill="#f59e0b"
            stroke="white"
            strokeWidth="2"
            animate={{
              cx: toX(sPath[frame]),
              cy: toY(ball_loss(sPath[frame])),
            }}
            transition={{ type: "spring", stiffness: 180, damping: 12 }}
          />
        )}
        {/* Quả bóng Momentum */}
        {showMom && (
          <motion.circle
            cx={toX(mPath[frame])}
            cy={toY(ball_loss(mPath[frame]))}
            r={9}
            fill="#22c55e"
            stroke="white"
            strokeWidth="2"
            animate={{
              cx: toX(mPath[frame]),
              cy: toY(ball_loss(mPath[frame])),
            }}
            transition={{ type: "spring", stiffness: 180, damping: 12 }}
          />
        )}

        <text
          x={W / 2}
          y={H - 6}
          textAnchor="middle"
          fill="#64748b"
          fontSize="10"
        >
          trọng số w
        </text>
      </svg>

      <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-muted">
            SGD thuần — x = {sPath[frame]?.toFixed(3) ?? "?"}, L ={" "}
            {ball_loss(sPath[frame] ?? 0).toFixed(3)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-muted">
            Momentum (β={beta.toFixed(2)}) — x ={" "}
            {mPath[frame]?.toFixed(3) ?? "?"}, L ={" "}
            {ball_loss(mPath[frame] ?? 0).toFixed(3)}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted italic mt-2">
        Quan sát: tại chỗ lõm nông ở giữa, SGD có xu hướng lùng nhùng. Momentum
        tích luỹ đà nên lướt qua và tới cực tiểu chính nhanh hơn. β càng cao, đà
        càng mạnh — nhưng β quá gần 1 có thể gây vọt quá.
      </p>
    </VisualizationSection>
  );
}

/* ============================================================
 * PHẦN 9 — SUB-COMPONENT: OPTIMIZER ARENA (landscape 2D)
 * So sánh đường đi của SGD / Momentum / RMSprop / Adam
 * ============================================================ */
function OptimizerArena() {
  const [running, setRunning] = useState(false);
  const [frame, setFrame] = useState(0);
  const [showSGD, setShowSGD] = useState(true);
  const [showMom, setShowMom] = useState(true);
  const [showRms, setShowRms] = useState(true);
  const [showAdam, setShowAdam] = useState(true);
  const [lrArena, setLrArena] = useState(0.08);

  const STEPS = 80;
  const START_X = 2.3;
  const START_Y = 2.3;

  const sgdTrail = useMemo(
    () => simulateSGD(START_X, START_Y, lrArena, STEPS),
    [lrArena],
  );
  const momTrail = useMemo(
    () => simulateMomentum(START_X, START_Y, lrArena, 0.9, STEPS),
    [lrArena],
  );
  const rmsTrail = useMemo(
    () => simulateRMSprop(START_X, START_Y, lrArena * 0.3, 0.9, STEPS),
    [lrArena],
  );
  const adamTrail = useMemo(
    () => simulateAdam(START_X, START_Y, lrArena * 2, STEPS),
    [lrArena],
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setFrame(0);
    intervalRef.current = setInterval(() => {
      setFrame((f) => {
        if (f >= STEPS - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          return f;
        }
        return f + 1;
      });
    }, 80);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Đường đồng mức (contour)
  const contours = useMemo(() => {
    const levels = [0.5, 1.5, 3, 5, 8, 12, 18, 25];
    const LEVELS_N = 60;
    const polys: { level: number; pts: string[] }[] = [];
    for (const level of levels) {
      const pts: string[] = [];
      for (let i = 0; i <= LEVELS_N; i++) {
        for (let j = 0; j <= LEVELS_N; j++) {
          const x =
            LAND_X_MIN + (i / LEVELS_N) * (LAND_X_MAX - LAND_X_MIN);
          const y =
            LAND_Y_MIN + (j / LEVELS_N) * (LAND_Y_MAX - LAND_Y_MIN);
          const l = loss2d(x, y);
          if (Math.abs(l - level) < 0.25) {
            pts.push(`${lx(x).toFixed(1)},${ly(y).toFixed(1)}`);
          }
        }
      }
      polys.push({ level, pts });
    }
    return polys;
  }, []);

  const renderTrail = (
    trail: PathPoint[],
    color: string,
    show: boolean,
    key: string,
  ) => {
    if (!show) return null;
    const slice = trail.slice(0, frame + 1);
    return (
      <g key={key}>
        {slice.map((p, i) =>
          i > 0 ? (
            <line
              key={`${key}-l${i}`}
              x1={lx(slice[i - 1].x)}
              y1={ly(slice[i - 1].y)}
              x2={lx(p.x)}
              y2={ly(p.y)}
              stroke={color}
              strokeWidth="1.8"
              opacity={0.6}
            />
          ) : null,
        )}
        <circle
          cx={lx(slice[slice.length - 1].x)}
          cy={ly(slice[slice.length - 1].y)}
          r={6}
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </g>
    );
  };

  const row = (
    color: string,
    name: string,
    trail: PathPoint[],
    checked: boolean,
    onChange: (v: boolean) => void,
  ) => (
    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-accent"
      />
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      <strong className="text-foreground">{name}</strong>
      <span>loss = {trail[frame]?.loss.toFixed(3) ?? "?"}</span>
    </label>
  );

  return (
    <VisualizationSection>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <button
          onClick={() => setRunning(true)}
          disabled={running}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {running ? `Đang chạy — bước ${frame + 1}/${STEPS}` : "Chạy mô phỏng"}
        </button>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-muted">
            Learning rate cơ sở: <strong>{lrArena.toFixed(3)}</strong>
          </label>
          <input
            type="range"
            min="0.01"
            max="0.2"
            step="0.005"
            value={lrArena}
            onChange={(e) => setLrArena(parseFloat(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      </div>

      <svg
        viewBox={`0 0 ${LAND_W} ${LAND_H}`}
        className="w-full max-w-3xl mx-auto bg-background/30 rounded-lg"
      >
        {/* Contour */}
        {contours.map((c, i) =>
          c.pts.map((p, j) => {
            const [xs, ys] = p.split(",").map(parseFloat);
            return (
              <circle
                key={`${i}-${j}`}
                cx={xs}
                cy={ys}
                r={0.8}
                fill="#334155"
                opacity={0.5 - i * 0.04}
              />
            );
          }),
        )}

        {/* Cực tiểu */}
        <circle cx={lx(1)} cy={ly(1)} r={8} fill="#22c55e" opacity={0.3} />
        <circle cx={lx(1)} cy={ly(1)} r={3} fill="#22c55e" />
        <text
          x={lx(1) + 10}
          y={ly(1) + 4}
          fill="#22c55e"
          fontSize="10"
          fontWeight="bold"
        >
          cực tiểu
        </text>

        {/* Điểm xuất phát */}
        <circle
          cx={lx(START_X)}
          cy={ly(START_Y)}
          r={5}
          fill="none"
          stroke="#64748b"
          strokeWidth="1.5"
          strokeDasharray="2,2"
        />

        {renderTrail(sgdTrail, "#f59e0b", showSGD, "sgd")}
        {renderTrail(momTrail, "#3b82f6", showMom, "mom")}
        {renderTrail(rmsTrail, "#8b5cf6", showRms, "rms")}
        {renderTrail(adamTrail, "#22c55e", showAdam, "adam")}
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        {row("#f59e0b", "SGD", sgdTrail, showSGD, setShowSGD)}
        {row("#3b82f6", "Momentum (β=0.9)", momTrail, showMom, setShowMom)}
        {row("#8b5cf6", "RMSprop (ρ=0.9)", rmsTrail, showRms, setShowRms)}
        {row("#22c55e", "Adam", adamTrail, showAdam, setShowAdam)}
      </div>

      <p className="text-xs text-muted italic mt-3 leading-relaxed">
        Landscape có thung lũng hẹp theo trục y (dốc 6x). SGD dao động lên xuống;
        Momentum lướt nhanh hơn nhưng có thể vọt quá; RMSprop tự động giảm bước
        trên trục dốc; Adam thường tới đích mượt nhất. Chỉnh LR để thấy khi nào
        optimizer nào nổ.
      </p>
    </VisualizationSection>
  );
}

/* ============================================================
 * PHẦN 10 — SUB-COMPONENT: LR SCHEDULER VIZ
 * So sánh 3 lịch: constant / step / cosine
 * ============================================================ */
function LRScheduler() {
  const [schedule, setSchedule] = useState<
    "constant" | "step" | "cosine" | "warmup-cosine"
  >("cosine");
  const [lr0, setLr0] = useState(0.1);
  const TOTAL = 100;

  const lrCurve = useMemo(() => {
    const arr: number[] = [];
    for (let t = 0; t < TOTAL; t++) {
      switch (schedule) {
        case "constant":
          arr.push(lr0);
          break;
        case "step": {
          const k = Math.floor(t / 25);
          arr.push(lr0 * Math.pow(0.5, k));
          break;
        }
        case "cosine": {
          const lrMin = lr0 * 0.01;
          arr.push(
            lrMin + 0.5 * (lr0 - lrMin) * (1 + Math.cos((Math.PI * t) / TOTAL)),
          );
          break;
        }
        case "warmup-cosine": {
          const warmup = 10;
          if (t < warmup) {
            arr.push((lr0 * (t + 1)) / warmup);
          } else {
            const lrMin = lr0 * 0.01;
            const tt = (t - warmup) / (TOTAL - warmup);
            arr.push(lrMin + 0.5 * (lr0 - lrMin) * (1 + Math.cos(Math.PI * tt)));
          }
          break;
        }
      }
    }
    return arr;
  }, [schedule, lr0]);

  const W = 520;
  const H = 220;
  const P = 34;
  const maxLr = Math.max(...lrCurve) * 1.1;
  const toX = (t: number) => P + (t / TOTAL) * (W - 2 * P);
  const toY = (l: number) => H - P - (l / maxLr) * (H - 2 * P);

  const polyPts = lrCurve.map((l, t) => `${toX(t)},${toY(l)}`).join(" ");

  const meta = {
    constant: {
      name: "Hằng số",
      formula: "\\alpha_t = \\alpha_0",
      note: "Dễ thử nghiệm nhưng hiếm khi tối ưu.",
    },
    step: {
      name: "Step decay",
      formula: "\\alpha_t = \\alpha_0 \\cdot 0.5^{\\lfloor t/25 \\rfloor}",
      note: "Giảm 50% mỗi 25 epoch — dễ hiểu, phổ biến ở CNN.",
    },
    cosine: {
      name: "Cosine annealing",
      formula:
        "\\alpha_t = \\alpha_{\\min} + \\tfrac{1}{2}(\\alpha_0 - \\alpha_{\\min})(1 + \\cos(\\tfrac{\\pi t}{T}))",
      note: "Mượt, giảm chậm đầu-cuối, giảm nhanh giữa. Mặc định của nhiều LLM.",
    },
    "warmup-cosine": {
      name: "Warm-up + Cosine",
      formula: "\\text{linear warm-up} \\rightarrow \\text{cosine annealing}",
      note: "Tăng tuyến tính lên α_0 trong 10 epoch đầu, sau đó cosine. Chuẩn Transformer.",
    },
  }[schedule];

  return (
    <VisualizationSection>
      <div className="flex flex-wrap gap-2 mb-3">
        {(["constant", "step", "cosine", "warmup-cosine"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSchedule(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              schedule === s
                ? "bg-accent text-white"
                : "bg-card border border-border text-muted hover:text-foreground"
            }`}
          >
            {s === "constant"
              ? "Hằng số"
              : s === "step"
                ? "Step"
                : s === "cosine"
                  ? "Cosine"
                  : "Warmup+Cosine"}
          </button>
        ))}
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-muted">
            α₀: <strong>{lr0.toFixed(3)}</strong>
          </label>
          <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={lr0}
            onChange={(e) => setLr0(parseFloat(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-3xl mx-auto">
        {/* axes */}
        <line
          x1={P}
          y1={H - P}
          x2={W - P}
          y2={H - P}
          stroke="#334155"
          strokeWidth="1"
        />
        <line
          x1={P}
          y1={P}
          x2={P}
          y2={H - P}
          stroke="#334155"
          strokeWidth="1"
        />
        <text x={W / 2} y={H - 8} textAnchor="middle" fill="#64748b" fontSize="10">
          epoch t
        </text>
        <text
          x={12}
          y={H / 2}
          textAnchor="middle"
          fill="#64748b"
          fontSize="10"
          transform={`rotate(-90, 12, ${H / 2})`}
        >
          learning rate α
        </text>

        {/* tick labels */}
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line
              x1={toX(t)}
              y1={H - P}
              x2={toX(t)}
              y2={H - P + 4}
              stroke="#64748b"
              strokeWidth="1"
            />
            <text
              x={toX(t)}
              y={H - P + 14}
              textAnchor="middle"
              fill="#64748b"
              fontSize="9"
            >
              {t}
            </text>
          </g>
        ))}

        <polyline
          points={polyPts}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2.5"
        />

        {/* Điểm đánh dấu */}
        {[0, 25, 50, 75, 99].map((t) => (
          <circle key={t} cx={toX(t)} cy={toY(lrCurve[t])} r={3} fill="#8b5cf6" />
        ))}
      </svg>

      <div className="mt-3 space-y-1 text-xs">
        <p>
          <strong className="text-foreground">{meta.name}:</strong>{" "}
          <LaTeX>{meta.formula}</LaTeX>
        </p>
        <p className="text-muted italic">{meta.note}</p>
      </div>
    </VisualizationSection>
  );
}
