"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  ClipboardCheck,
  Compass,
  Layers,
  Link2,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  TriangleAlert,
  Check,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  CollapsibleDetail,
  StepReveal,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "backpropagation",
  title: "Backpropagation",
  titleVi: "Lan truyền ngược — truy ngược lỗi qua từng lớp",
  description:
    "Mạng đoán sai — lỗi đến từ lớp nào, weight nào cần sửa bao nhiêu? Backprop dùng quy tắc chuỗi để truy ngược lỗi từ đầu ra về từng trọng số, chỉ trong một lần duyệt.",
  category: "neural-fundamentals",
  tags: ["neural-network", "training", "optimization", "gradient", "chain-rule"],
  difficulty: "intermediate",
  relatedSlugs: [
    "forward-propagation",
    "gradient-descent",
    "loss-functions",
    "vanishing-exploding-gradients",
    "activation-functions",
    "calculus-for-backprop",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ────────────────────────────────────────────────────────────
   MẠNG NƠ-RON 2-3-1 — forward + backward
   Đầu vào: x1, x2. Hidden: 3 nơ-ron (sigmoid). Output: 1 (sigmoid).
   Target y = 0.8. Loss = ½(y − ŷ)².
   ──────────────────────────────────────────────────────────── */

const TARGET = 0.8;
const X1 = 0.6;
const X2 = 0.9;

const W1_INIT: number[][] = [
  [0.15, -0.2],
  [0.25, 0.3],
  [-0.1, 0.4],
];
const W2_INIT: number[] = [0.35, -0.3, 0.5];

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}
function dSigmoidFromAct(a: number): number {
  return a * (1 - a);
}

interface ForwardResult {
  z: number[];
  h: number[];
  zOut: number;
  out: number;
  loss: number;
}

function forwardPass(
  W1: number[][],
  W2: number[],
  x1 = X1,
  x2 = X2,
): ForwardResult {
  const z: number[] = [];
  const h: number[] = [];
  for (let i = 0; i < 3; i += 1) {
    const zi = W1[i][0] * x1 + W1[i][1] * x2;
    z.push(zi);
    h.push(sigmoid(zi));
  }
  const zOut = W2[0] * h[0] + W2[1] * h[1] + W2[2] * h[2];
  const out = sigmoid(zOut);
  const loss = 0.5 * (TARGET - out) ** 2;
  return { z, h, zOut, out, loss };
}

interface GradientResult {
  dL_dOut: number;
  dL_dZout: number;
  dL_dW2: number[];
  dL_dH: number[];
  dL_dZ: number[];
  dL_dW1: number[][];
}

function backwardPass(
  W2: number[],
  fp: ForwardResult,
  x1 = X1,
  x2 = X2,
): GradientResult {
  const dL_dOut = -(TARGET - fp.out);
  const dL_dZout = dL_dOut * dSigmoidFromAct(fp.out);
  const dL_dW2 = [
    dL_dZout * fp.h[0],
    dL_dZout * fp.h[1],
    dL_dZout * fp.h[2],
  ];
  const dL_dH = [dL_dZout * W2[0], dL_dZout * W2[1], dL_dZout * W2[2]];
  const dL_dZ = [
    dL_dH[0] * dSigmoidFromAct(fp.h[0]),
    dL_dH[1] * dSigmoidFromAct(fp.h[1]),
    dL_dH[2] * dSigmoidFromAct(fp.h[2]),
  ];
  const dL_dW1: number[][] = [];
  for (let i = 0; i < 3; i += 1) {
    dL_dW1.push([dL_dZ[i] * x1, dL_dZ[i] * x2]);
  }
  return { dL_dOut, dL_dZout, dL_dW2, dL_dH, dL_dZ, dL_dW1 };
}

function applyUpdate(
  W1: number[][],
  W2: number[],
  g: GradientResult,
  lr: number,
): { W1: number[][]; W2: number[] } {
  const W2_new = W2.map((w, i) => w - lr * g.dL_dW2[i]);
  const W1_new = W1.map((row, i) => [
    row[0] - lr * g.dL_dW1[i][0],
    row[1] - lr * g.dL_dW1[i][1],
  ]);
  return { W1: W1_new, W2: W2_new };
}

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Backpropagation trả lời cho câu hỏi gì bằng tiếng Việt đời thường?",
    options: [
      "Dự đoán của mạng là bao nhiêu?",
      "Loss hiện tại của mạng là bao nhiêu?",
      "Mỗi weight nên thay đổi bao nhiêu để loss giảm? — và quan trọng: nó dùng quy tắc chuỗi để trả lời cho MỌI weight trong một lần duyệt ngược",
      "Mạng có bao nhiêu tham số?",
    ],
    correct: 2,
    explanation:
      "Backprop không tính dự đoán — đó là việc của forward pass. Nó trả lời câu hỏi 'mỗi weight ảnh hưởng loss bao nhiêu' (gradient ∂L/∂w) cho toàn bộ weight, chỉ tốn một lần forward + một lần backward. Đây là lý do mạng tỉ tham số huấn luyện được.",
  },
  {
    question:
      "Mạng sâu 100 lớp, mỗi lớp có đạo hàm cục bộ khoảng 0.5. Gradient ở LỚP ĐẦU TIÊN (xa đầu ra nhất) sẽ có độ lớn xấp xỉ bao nhiêu?",
    options: [
      "50 — cộng 0.5 qua 100 lần",
      "0.5 — không đổi vì chain rule giữ nguyên",
      "0.5 mũ 100 ≈ 8·10⁻³¹ — gradient tan biến, lớp đầu gần như không học được",
      "100 — mỗi lớp nhân thêm một bậc",
    ],
    correct: 2,
    explanation:
      "Chain rule NHÂN các đạo hàm cục bộ. 0.5^100 ≈ 7.9·10⁻³¹ — gần như bằng 0. Đây chính là vanishing gradient. Giải pháp lịch sử: thay sigmoid bằng ReLU (đạo hàm = 1 khi z > 0), thêm Batch Normalization, hoặc dùng Residual Connection của ResNet để gradient có đường tắt.",
  },
  {
    question:
      "Đạo hàm ∂L/∂W2₁ = 0.12 với learning rate η = 0.5. Trọng số W2₁ hiện tại = 0.80. Sau một bước gradient descent, W2₁ bằng bao nhiêu?",
    options: [
      "0.80 + 0.5 · 0.12 = 0.86",
      "0.80 − 0.5 · 0.12 = 0.74",
      "0.80 · 0.5 − 0.12 = 0.28",
      "0.12 / 0.5 = 0.24",
    ],
    correct: 1,
    explanation:
      "Công thức cập nhật: w_mới = w_cũ − η · ∂L/∂w = 0.80 − 0.5 · 0.12 = 0.74. Dấu TRỪ rất quan trọng — gradient chỉ hướng loss TĂNG, ta đi NGƯỢC để loss GIẢM.",
  },
  {
    type: "fill-blank",
    question:
      "Backpropagation dùng quy tắc {blank} để ghép các đạo hàm cục bộ của từng lớp lại, truyền gradient từ đầu ra về đầu vào.",
    blanks: [
      {
        answer: "chuỗi",
        accept: ["chain", "chain rule", "quy tắc chuỗi", "chuoi"],
      },
    ],
    explanation:
      "Quy tắc chuỗi (chain rule): d(f∘g)/dx = df/dg × dg/dx. Mỗi lớp chỉ cần biết đạo hàm cục bộ của chính nó. Backprop ráp các mảnh lại bằng phép nhân xuyên qua toàn mạng.",
  },
  {
    question:
      "Vì sao backprop đi từ CUỐI (đầu ra) về ĐẦU (đầu vào), mà không đi xuôi?",
    options: [
      "Vì ngược tốn ít bộ nhớ hơn",
      "Vì loss được tính ở đầu ra, và ta cần ∂L/∂(mọi weight) — bắt đầu từ ∂L/∂output là có cơ sở, rồi dùng chain rule trườn ngược về từng lớp. Đi xuôi sẽ phải tính lại O(N²) lần",
      "Vì GPU thiết kế cho phép toán từ phải sang trái",
      "Vì thuật toán gradient descent yêu cầu vậy",
    ],
    correct: 1,
    explanation:
      "Đi ngược (reverse-mode autodiff) là cách rẻ nhất khi có nhiều đầu vào (tham số) và một đầu ra (loss). Bắt đầu từ ∂L/∂output = 1, nhân xuống từng lớp: sau một lần duyệt, ta có ∂L/∂ mọi weight. Đi xuôi sẽ tốn O(N²) — không khả thi cho mạng tỉ tham số.",
  },
  {
    question:
      "Khi backprop, lớp ẩn cần nhớ giá trị gì từ forward pass để tính đạo hàm cục bộ?",
    options: [
      "Chỉ cần nhớ loss cuối cùng",
      "Nhớ giá trị activation h (hoặc z) đã tính ở forward — để tính ∂h/∂z = h(1−h) cho sigmoid hoặc ∂h/∂z = 1 khi z > 0 cho ReLU",
      "Không cần nhớ gì, backprop tính lại từ đầu",
      "Nhớ giá trị dự đoán ŷ của các ví dụ khác trong batch",
    ],
    correct: 1,
    explanation:
      "Forward pass phải lưu lại activation của từng lớp vào bộ nhớ. Backward dùng các giá trị này để tính đạo hàm cục bộ của activation. Đây là lý do huấn luyện mạng lớn tốn RAM: không chỉ weight mà còn phải cache activation của mọi batch.",
  },
  {
    question:
      "Sau một bước backprop + cập nhật weight, điều gì xảy ra với loss?",
    options: [
      "Loss luôn về 0 ngay lập tức",
      "Loss thường giảm một chút (nếu learning rate hợp lý) — lặp hàng ngàn lần mới hội tụ",
      "Loss không đổi",
      "Loss tăng lên vì weight bị phá",
    ],
    correct: 1,
    explanation:
      "Một bước gradient descent chỉ giảm loss một lượng nhỏ — tương ứng cỡ bước η·∇L. Huấn luyện thực tế lặp hàng triệu bước (trên nhiều batch) mới hội tụ. Nếu learning rate quá to, loss có thể tăng; nếu quá nhỏ, giảm lâu.",
  },
];

/* ────────────────────────────────────────────────────────────
   SƠ ĐỒ MẠNG — forward + backward animation
   ──────────────────────────────────────────────────────────── */

type FlowMode = "idle" | "forward" | "backward";

interface NetworkDiagramProps {
  W1: number[][];
  W2: number[];
  fp: ForwardResult;
  grad: GradientResult;
  mode: FlowMode;
  tick: number;
}

function NetworkDiagram({ W1, W2, fp, grad, mode, tick }: NetworkDiagramProps) {
  const inputX = 70;
  const hiddenX = 250;
  const outputX = 430;
  const inputYs = [100, 190];
  const hiddenYs = [60, 150, 240];
  const outputY = 150;
  const FWD = "#2563eb";
  const BWD = "#dc2626";
  const IDLE = "var(--accent)";
  const stroke = mode === "forward" ? FWD : mode === "backward" ? BWD : IDLE;
  const labelCol = mode === "backward" ? BWD : "var(--text-secondary)";

  return (
    <svg
      viewBox="0 0 520 320"
      className="w-full max-w-2xl mx-auto"
      role="img"
      aria-label={`Sơ đồ mạng 2-3-1 ở chế độ ${mode === "forward" ? "lan truyền tiến" : mode === "backward" ? "lan truyền ngược" : "nghỉ"}, loss ${fp.loss.toFixed(4)}.`}
    >
      <title>
        Mạng 2-3-1. ŷ = {fp.out.toFixed(3)}, target = {TARGET}, loss = {fp.loss.toFixed(4)}.
      </title>

      {/* Layer bands + labels */}
      {[40, 220, 400].map((x, idx) => (
        <g key={x}>
          <rect x={x} y={20} width={60} height={280} rx={10} fill="var(--bg-surface)" opacity={0.4} />
          <text x={x + 30} y={16} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)">
            {["Lớp vào", "Lớp ẩn", "Lớp ra"][idx]}
          </text>
        </g>
      ))}

      {/* Edges: input → hidden (W1) */}
      {[0, 1, 2].map((i) =>
        [0, 1].map((j) => {
          const weight = W1[i][j];
          const width = 1.2 + Math.min(2.5, Math.abs(weight) * 2);
          return (
            <g key={`w1-${i}-${j}-${tick}`}>
              <motion.line
                x1={inputX + 22}
                y1={inputYs[j]}
                x2={hiddenX - 22}
                y2={hiddenYs[i]}
                stroke={stroke}
                strokeWidth={width}
                opacity={mode === "idle" ? 0.35 : 0.85}
                initial={{ pathLength: mode === "backward" ? 0 : 1 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.7,
                  delay:
                    mode === "forward"
                      ? j * 0.1 + i * 0.05
                      : mode === "backward"
                        ? 0.35 + i * 0.05 + j * 0.05
                        : 0,
                }}
              />
              <text
                x={(inputX + hiddenX) / 2 + (j === 0 ? -4 : 4)}
                y={(inputYs[j] + hiddenYs[i]) / 2 + (j === 0 ? -2 : 10)}
                fontSize={11}
                fill={labelCol}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {mode === "backward" ? `∂=${grad.dL_dW1[i][j].toFixed(2)}` : weight.toFixed(2)}
              </text>
            </g>
          );
        }),
      )}

      {/* Edges: hidden → output (W2) */}
      {[0, 1, 2].map((i) => (
        <g key={`w2-${i}-${tick}`}>
          <motion.line
            x1={hiddenX + 22}
            y1={hiddenYs[i]}
            x2={outputX - 26}
            y2={outputY}
            stroke={stroke}
            strokeWidth={1.4 + Math.min(2.5, Math.abs(W2[i]) * 2)}
            opacity={mode === "idle" ? 0.35 : 0.9}
            initial={{ pathLength: mode === "backward" ? 0 : 1 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 0.6,
              delay:
                mode === "forward" ? 0.3 + i * 0.07 : mode === "backward" ? i * 0.05 : 0,
            }}
          />
          <text
            x={(hiddenX + outputX) / 2}
            y={(hiddenYs[i] + outputY) / 2 - 4}
            fontSize={11}
            fill={labelCol}
            textAnchor="middle"
            fontFamily="monospace"
          >
            {mode === "backward" ? `∂=${grad.dL_dW2[i].toFixed(2)}` : W2[i].toFixed(2)}
          </text>
        </g>
      ))}

      {/* Input neurons */}
      {[X1, X2].map((v, j) => (
        <g key={`in-${j}`}>
          <motion.circle
            cx={inputX}
            cy={inputYs[j]}
            r={22}
            fill="var(--accent-light)"
            stroke={mode === "forward" ? FWD : IDLE}
            strokeWidth={2}
            animate={mode === "forward" ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={{ duration: 0.45, delay: j * 0.05 }}
          />
          <text x={inputX} y={inputYs[j] + 4} textAnchor="middle" fontSize={11} fill="var(--text-primary)" fontWeight={600} fontFamily="monospace">
            {v.toFixed(2)}
          </text>
          <text x={inputX} y={inputYs[j] - 28} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)">
            x{j + 1}
          </text>
        </g>
      ))}

      {/* Hidden neurons */}
      {[0, 1, 2].map((i) => (
        <g key={`h-${i}`}>
          <motion.circle
            cx={hiddenX}
            cy={hiddenYs[i]}
            r={24}
            fill="rgba(139,92,246,0.12)"
            stroke="#8b5cf6"
            strokeWidth={2}
            animate={
              mode === "forward"
                ? { scale: [1, 1.1, 1] }
                : mode === "backward"
                  ? { scale: [1, 1.08, 1] }
                  : { scale: 1 }
            }
            transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
          />
          <text x={hiddenX} y={hiddenYs[i] + 4} textAnchor="middle" fontSize={11} fill="var(--text-primary)" fontWeight={600} fontFamily="monospace">
            {fp.h[i].toFixed(2)}
          </text>
          <text x={hiddenX} y={hiddenYs[i] - 30} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)">
            h{i + 1}
          </text>
        </g>
      ))}

      {/* Output */}
      <motion.circle
        cx={outputX}
        cy={outputY}
        r={28}
        fill={fp.loss < 0.005 ? "rgba(16,185,129,0.18)" : "rgba(220,38,38,0.12)"}
        stroke={fp.loss < 0.005 ? "#10b981" : "#dc2626"}
        strokeWidth={2.5}
        animate={
          mode === "forward"
            ? { scale: [1, 1.15, 1] }
            : mode === "backward"
              ? { scale: [1, 1.1, 1] }
              : { scale: 1 }
        }
        transition={{ duration: 0.6, delay: mode === "forward" ? 0.5 : 0 }}
      />
      <text x={outputX} y={outputY + 4} textAnchor="middle" fontSize={12} fill="var(--text-primary)" fontWeight={700} fontFamily="monospace">
        {fp.out.toFixed(3)}
      </text>
      <text x={outputX} y={outputY - 34} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)">ŷ</text>

      {/* Target marker */}
      <text x={outputX + 42} y={outputY - 8} fontSize={11} fill="#10b981" fontWeight={600}>target</text>
      <text x={outputX + 42} y={outputY + 6} fontSize={11} fill="#10b981" fontWeight={700} fontFamily="monospace">
        {TARGET.toFixed(2)}
      </text>

      {/* Loss badge */}
      <rect
        x={outputX - 36}
        y={outputY + 40}
        width={72}
        height={22}
        rx={10}
        fill={fp.loss < 0.005 ? "#10b981" : "#f59e0b"}
        opacity={0.18}
      />
      <text x={outputX} y={outputY + 55} textAnchor="middle" fontSize={11} fontWeight={700} fill={fp.loss < 0.005 ? "#10b981" : "#b45309"} fontFamily="monospace">
        L = {fp.loss.toFixed(4)}
      </text>

      {/* Flow direction label */}
      <AnimatePresence mode="wait">
        {mode !== "idle" && (
          <motion.g key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <rect x={180} y={284} width={160} height={22} rx={11} fill={mode === "forward" ? FWD : BWD} opacity={0.12} />
            <text x={260} y={300} textAnchor="middle" fontSize={11} fill={mode === "forward" ? FWD : BWD} fontWeight={700}>
              {mode === "forward" ? "→ Forward: dữ liệu chạy tới" : "← Backward: gradient chạy về"}
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   DEEPEN — mini SVG cho mỗi bước
   ──────────────────────────────────────────────────────────── */

interface DeepenStepVisualProps {
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  numbers: DeepenNumbers;
}

interface DeepenNumbers {
  x1: number;
  x2: number;
  w1a: number;
  w1b: number;
  z: number;
  h: number;
  w2: number;
  zOut: number;
  yHat: number;
  loss: number;
  dL_dOut: number;
  dOut_dZout: number;
  dL_dZout: number;
  dL_dW2: number;
  dL_dH: number;
  dH_dZ: number;
  dL_dZ: number;
  dL_dW1a: number;
  dL_dW1b: number;
  w2New: number;
  w1aNew: number;
  w1bNew: number;
  lr: number;
}

function computeDeepenNumbers(lr: number): DeepenNumbers {
  const x1 = 0.6;
  const x2 = 0.9;
  const w1a = 0.15;
  const w1b = -0.2;
  const w2 = 0.35;
  const z = w1a * x1 + w1b * x2;
  const h = sigmoid(z);
  const zOut = w2 * h;
  const yHat = sigmoid(zOut);
  const loss = 0.5 * (TARGET - yHat) ** 2;
  const dL_dOut = -(TARGET - yHat);
  const dOut_dZout = yHat * (1 - yHat);
  const dL_dZout = dL_dOut * dOut_dZout;
  const dL_dW2 = dL_dZout * h;
  const dL_dH = dL_dZout * w2;
  const dH_dZ = h * (1 - h);
  const dL_dZ = dL_dH * dH_dZ;
  const dL_dW1a = dL_dZ * x1;
  const dL_dW1b = dL_dZ * x2;
  return {
    x1,
    x2,
    w1a,
    w1b,
    z,
    h,
    w2,
    zOut,
    yHat,
    loss,
    dL_dOut,
    dOut_dZout,
    dL_dZout,
    dL_dW2,
    dL_dH,
    dH_dZ,
    dL_dZ,
    dL_dW1a,
    dL_dW1b,
    w2New: w2 - lr * dL_dW2,
    w1aNew: w1a - lr * dL_dW1a,
    w1bNew: w1b - lr * dL_dW1b,
    lr,
  };
}

/* Helper: render a single "pill" box with label + value */
interface PillProps {
  cx: number;
  cy: number;
  label: string;
  value: string;
  color: string;
  width?: number;
  height?: number;
}
function Pill({ cx, cy, label, value, color, width = 96, height = 46 }: PillProps) {
  return (
    <g>
      <rect
        x={cx - width / 2}
        y={cy - height / 2}
        width={width}
        height={height}
        rx={9}
        fill={color + "22"}
        stroke={color}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontSize={11}
        fill={color}
        fontWeight={600}
        fontFamily="monospace"
      >
        {label}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fontSize={11}
        fill={color}
        fontWeight={700}
        fontFamily="monospace"
      >
        {value}
      </text>
    </g>
  );
}

function DeepenStepVisual({ phase, numbers }: DeepenStepVisualProps) {
  if (phase === 1) {
    return (
      <svg viewBox="0 0 440 150" className="w-full">
        <title>Forward pass: x → h → ŷ.</title>
        <circle cx={60} cy={50} r={18} fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={2} />
        <text x={60} y={54} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0369a1">
          {numbers.x1}
        </text>
        <text x={60} y={26} textAnchor="middle" fontSize={11} fill="#0369a1">x₁</text>
        <circle cx={60} cy={110} r={18} fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={2} />
        <text x={60} y={114} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0369a1">
          {numbers.x2}
        </text>
        <text x={60} y={140} textAnchor="middle" fontSize={11} fill="#0369a1">x₂</text>
        <line x1={78} y1={50} x2={202} y2={80} stroke="#0ea5e9" strokeWidth={1.5} />
        <line x1={78} y1={110} x2={202} y2={80} stroke="#0ea5e9" strokeWidth={1.5} />
        <text x={130} y={58} fontSize={11} fill="#6366f1" fontFamily="monospace">w={numbers.w1a}</text>
        <text x={130} y={105} fontSize={11} fill="#6366f1" fontFamily="monospace">w={numbers.w1b}</text>
        <circle cx={220} cy={80} r={20} fill="#ede9fe" stroke="#8b5cf6" strokeWidth={2} />
        <text x={220} y={84} textAnchor="middle" fontSize={11} fontWeight={700} fill="#6d28d9">
          {numbers.h.toFixed(2)}
        </text>
        <text x={220} y={112} textAnchor="middle" fontSize={11} fill="#6d28d9">
          h = σ({numbers.z.toFixed(2)})
        </text>
        <text x={220} y={54} textAnchor="middle" fontSize={11} fill="#6d28d9">
          z = {numbers.w1a}·{numbers.x1}+{numbers.w1b}·{numbers.x2}
        </text>
        <line x1={240} y1={80} x2={362} y2={80} stroke="#ec4899" strokeWidth={1.5} />
        <text x={295} y={74} fontSize={11} fill="#be185d" fontFamily="monospace">w₂={numbers.w2}</text>
        <circle cx={380} cy={80} r={22} fill="#fce7f3" stroke="#ec4899" strokeWidth={2.5} />
        <text x={380} y={84} textAnchor="middle" fontSize={11} fontWeight={700} fill="#be185d">
          {numbers.yHat.toFixed(3)}
        </text>
        <text x={380} y={46} textAnchor="middle" fontSize={11} fill="#be185d" fontWeight={600}>ŷ</text>
        <text x={380} y={118} textAnchor="middle" fontSize={11} fill="#be185d">
          = σ({numbers.zOut.toFixed(2)})
        </text>
      </svg>
    );
  }
  if (phase === 2) {
    return (
      <svg viewBox="0 0 440 140" className="w-full">
        <title>Tính loss: so ŷ với target y.</title>
        <circle cx={120} cy={70} r={22} fill="#fce7f3" stroke="#ec4899" strokeWidth={2} />
        <text x={120} y={74} textAnchor="middle" fontSize={11} fontWeight={700} fill="#be185d">
          {numbers.yHat.toFixed(3)}
        </text>
        <text x={120} y={40} textAnchor="middle" fontSize={11} fill="#be185d">ŷ (dự đoán)</text>
        <circle cx={260} cy={70} r={22} fill="#dcfce7" stroke="#16a34a" strokeWidth={2} />
        <text x={260} y={74} textAnchor="middle" fontSize={11} fontWeight={700} fill="#166534">
          {TARGET}
        </text>
        <text x={260} y={40} textAnchor="middle" fontSize={11} fill="#166534">y (đáp án)</text>
        <line x1={145} y1={70} x2={235} y2={70} stroke="#f97316" strokeWidth={2} strokeDasharray="4,3" />
        <text x={190} y={62} textAnchor="middle" fontSize={11} fill="#c2410c" fontWeight={600}>
          sai số: {(TARGET - numbers.yHat).toFixed(3)}
        </text>
        <rect x={320} y={54} width={100} height={32} rx={8} fill="#fef3c7" stroke="#f59e0b" />
        <text x={370} y={68} textAnchor="middle" fontSize={11} fill="#b45309">L = ½(y − ŷ)²</text>
        <text x={370} y={82} textAnchor="middle" fontSize={12} fill="#b45309" fontWeight={700} fontFamily="monospace">
          {numbers.loss.toFixed(4)}
        </text>
        <text x={190} y={125} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)" fontStyle="italic">
          Càng khác xa target → loss càng to.
        </text>
      </svg>
    );
  }
  if (phase === 3) {
    return (
      <svg viewBox="0 0 440 130" className="w-full">
        <title>∂L/∂ŷ: loss đổi bao nhiêu khi ŷ đổi 1 đơn vị.</title>
        <rect x={20} y={20} width={180} height={50} rx={8} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1.5} />
        <text x={110} y={40} textAnchor="middle" fontSize={11} fill="#b45309">L = ½(y − ŷ)²</text>
        <text x={110} y={58} textAnchor="middle" fontSize={11} fill="#b45309" fontFamily="monospace">
          → ∂L/∂ŷ = −(y − ŷ)
        </text>
        <path d="M 205 45 L 240 45" stroke="#dc2626" strokeWidth={2} markerEnd="url(#arrow-deepen)" />
        <defs>
          <marker id="arrow-deepen" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#dc2626" />
          </marker>
        </defs>
        <rect x={248} y={20} width={170} height={50} rx={8} fill="#fee2e2" stroke="#dc2626" strokeWidth={2} />
        <text x={333} y={40} textAnchor="middle" fontSize={11} fill="#991b1b">
          Thay số: −({TARGET} − {numbers.yHat.toFixed(3)})
        </text>
        <text x={333} y={58} textAnchor="middle" fontSize={13} fill="#991b1b" fontWeight={700} fontFamily="monospace">
          ∂L/∂ŷ = {numbers.dL_dOut.toFixed(3)}
        </text>
        <text x={220} y={100} textAnchor="middle" fontSize={11} fill="var(--text-secondary)" fontStyle="italic">
          Dấu âm: ŷ đang nhỏ hơn target, tăng ŷ một tí → loss giảm.
        </text>
      </svg>
    );
  }
  if (phase === 4) {
    return (
      <svg viewBox="0 0 440 180" className="w-full">
        <title>∂L/∂h qua chain rule: ba thừa số nhân lại.</title>
        <Pill cx={55} cy={55} label="∂L/∂ŷ" value={numbers.dL_dOut.toFixed(2)} color="#dc2626" />
        <text x={117} y={60} fontSize={16} fontWeight={700} fill="var(--text-primary)">×</text>
        <Pill cx={185} cy={55} label="∂ŷ/∂z_out" value={numbers.dOut_dZout.toFixed(2)} color="#ec4899" />
        <text x={247} y={60} fontSize={16} fontWeight={700} fill="var(--text-primary)">×</text>
        <Pill cx={315} cy={55} label="w₂" value={numbers.w2.toFixed(2)} color="#8b5cf6" />
        <line x1={120} y1={100} x2={320} y2={100} stroke="var(--border)" />
        <rect x={160} y={115} width={120} height={40} rx={10} fill="#16a34a22" stroke="#16a34a" strokeWidth={2} />
        <text x={220} y={132} textAnchor="middle" fontSize={11} fill="#166534" fontWeight={600} fontFamily="monospace">
          ∂L/∂h
        </text>
        <text x={220} y={148} textAnchor="middle" fontSize={13} fill="#166534" fontWeight={700} fontFamily="monospace">
          = {numbers.dL_dH.toFixed(3)}
        </text>
        <text x={220} y={174} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)" fontStyle="italic">
          Tích ba thừa số — gradient đã lan về lớp ẩn.
        </text>
      </svg>
    );
  }
  if (phase === 5) {
    // Two rows: one for w1a (×x1), one for w1b (×x2)
    const rows = [
      { y: 40, xLabel: "x₁", xVal: numbers.x1, gradLabel: "∂L/∂w₁ₐ", gradVal: numbers.dL_dW1a },
      { y: 105, xLabel: "x₂", xVal: numbers.x2, gradLabel: "∂L/∂w₁_b", gradVal: numbers.dL_dW1b },
    ];
    return (
      <svg viewBox="0 0 440 170" className="w-full">
        <title>∂L/∂w₁: thêm hai thừa số σ′(z) và x.</title>
        {rows.map((r) => (
          <g key={r.xLabel}>
            <Pill cx={50} cy={r.y} label="∂L/∂h" value={numbers.dL_dH.toFixed(2)} color="#16a34a" width={82} height={40} />
            <text x={98} y={r.y + 5} fontSize={14} fontWeight={700} fill="var(--text-primary)">×</text>
            <Pill cx={155} cy={r.y} label="∂h/∂z" value={numbers.dH_dZ.toFixed(2)} color="#0ea5e9" width={82} height={40} />
            <text x={203} y={r.y + 5} fontSize={14} fontWeight={700} fill="var(--text-primary)">×</text>
            <Pill cx={260} cy={r.y} label={r.xLabel} value={r.xVal.toFixed(2)} color="#f59e0b" width={82} height={40} />
            <text x={308} y={r.y + 5} fontSize={14} fontWeight={700} fill="var(--text-primary)">=</text>
            <Pill cx={360} cy={r.y} label={r.gradLabel} value={r.gradVal.toFixed(3)} color="#dc2626" width={80} height={40} />
          </g>
        ))}
        <text x={220} y={160} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)" fontStyle="italic">
          Hai weight cùng lớp nhưng gradient khác nhau vì nhân với x₁ hoặc x₂.
        </text>
      </svg>
    );
  }
  // phase 6 — update rule applied to three weights
  const rows = [
    { y: 30, name: "w₂", old: numbers.w2, grad: numbers.dL_dW2, nw: numbers.w2New },
    { y: 70, name: "w₁ₐ", old: numbers.w1a, grad: numbers.dL_dW1a, nw: numbers.w1aNew },
    { y: 110, name: "w₁_b", old: numbers.w1b, grad: numbers.dL_dW1b, nw: numbers.w1bNew },
  ];
  return (
    <svg viewBox="0 0 440 160" className="w-full">
      <title>Cập nhật weight: w_mới = w_cũ − η · ∂L/∂w.</title>
      {rows.map((row) => (
        <g key={row.name}>
          <text x={30} y={row.y + 14} fontSize={11} fontWeight={700} fill="#8b5cf6" fontFamily="monospace">
            {row.name}
          </text>
          <Pill cx={90} cy={row.y + 13} label="cũ" value={row.old.toFixed(2)} color="#8b5cf6" width={58} height={26} />
          <text x={126} y={row.y + 17} fontSize={12} fontWeight={700} fill="var(--text-primary)">−</text>
          <Pill cx={160} cy={row.y + 13} label="η" value={numbers.lr.toFixed(1)} color="#0ea5e9" width={40} height={26} />
          <text x={184} y={row.y + 17} fontSize={12} fontWeight={700} fill="var(--text-primary)">·</text>
          <Pill cx={225} cy={row.y + 13} label="grad" value={row.grad.toFixed(3)} color="#dc2626" width={60} height={26} />
          <text x={262} y={row.y + 17} fontSize={12} fontWeight={700} fill="var(--text-primary)">=</text>
          <Pill cx={310} cy={row.y + 13} label="mới" value={row.nw.toFixed(3)} color="#16a34a" width={76} height={26} />
          <text x={372} y={row.y + 17} fontSize={11} fontWeight={600} fill={row.nw > row.old ? "#16a34a" : "#dc2626"}>
            {row.nw > row.old ? "↑" : "↓"} {Math.abs(row.nw - row.old).toFixed(3)}
          </text>
        </g>
      ))}
      <text x={220} y={150} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)" fontStyle="italic">
        Mỗi weight nhích đúng một lượng η · gradient của nó.
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   DEEPEN CARD — khung chung cho mỗi bước StepReveal
   ──────────────────────────────────────────────────────────── */

type CardTone = "sky" | "amber" | "rose" | "emerald" | "violet" | "indigo";

const TONE_CLASSES: Record<CardTone, { bg: string; fg: string }> = {
  sky: { bg: "bg-sky-100 dark:bg-sky-900/30", fg: "text-sky-600 dark:text-sky-300" },
  amber: { bg: "bg-amber-100 dark:bg-amber-900/30", fg: "text-amber-600 dark:text-amber-300" },
  rose: { bg: "bg-rose-100 dark:bg-rose-900/30", fg: "text-rose-600 dark:text-rose-300" },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", fg: "text-emerald-600 dark:text-emerald-300" },
  violet: { bg: "bg-violet-100 dark:bg-violet-900/30", fg: "text-violet-600 dark:text-violet-300" },
  indigo: { bg: "bg-indigo-100 dark:bg-indigo-900/30", fg: "text-indigo-600 dark:text-indigo-300" },
};

interface DeepenCardProps {
  icon: React.ComponentType<{ className?: string }>;
  tone: CardTone;
  title: string;
  formula: string;
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  numbers: DeepenNumbers;
  children: React.ReactNode;
}

function DeepenCard({
  icon: Icon,
  tone,
  title,
  formula,
  phase,
  numbers,
  children,
}: DeepenCardProps) {
  const cls = TONE_CLASSES[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cls.bg}`}>
          <Icon className={`h-5 w-5 ${cls.fg}`} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-[11px] font-mono text-muted">{formula}</p>
        </div>
      </div>
      <p className="text-sm text-foreground/85 leading-relaxed">{children}</p>
      <div className="rounded-lg bg-surface border border-border p-3">
        <DeepenStepVisual phase={phase} numbers={numbers} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   FORMULA BOX — khung chung cho ba LaTeX + minh hoạ ở Explain
   ──────────────────────────────────────────────────────────── */

interface FormulaBoxProps {
  idx: number;
  title: string;
  subtitle: string;
  latex: string;
  caption: string;
  children: React.ReactNode;
}

function FormulaBox({ idx, title, subtitle, latex, caption, children }: FormulaBoxProps) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-5 my-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
          {idx}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <LaTeX block>{latex}</LaTeX>
      <div className="rounded-lg bg-card border border-border p-3">{children}</div>
      <p className="text-xs text-muted italic leading-relaxed">{caption}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   ACTION BUTTON — nút điều khiển chung
   ──────────────────────────────────────────────────────────── */

interface ActionBtnProps {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  cls: string;
  children: React.ReactNode;
}

function ActionBtn({ onClick, icon: Icon, cls, children }: ActionBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function BackpropagationTopic() {
  const [W1, setW1] = useState<number[][]>(W1_INIT.map((r) => [...r]));
  const [W2, setW2] = useState<number[]>([...W2_INIT]);
  const [lr, setLr] = useState(0.8);
  const [mode, setMode] = useState<FlowMode>("idle");
  const [tick, setTick] = useState(0);
  const [step, setStep] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fp = useMemo(() => forwardPass(W1, W2), [W1, W2]);
  const grad = useMemo(() => backwardPass(W2, fp), [W2, fp]);

  useEffect(() => {
    if (lossHistory.length === 0) {
      setLossHistory([fp.loss]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runForward = useCallback(() => {
    setMode("forward");
    setTick((t) => t + 1);
    const t = setTimeout(() => setMode("idle"), 950);
    return () => clearTimeout(t);
  }, []);

  const runBackward = useCallback(() => {
    setMode("backward");
    setTick((t) => t + 1);
    const t = setTimeout(() => setMode("idle"), 1100);
    return () => clearTimeout(t);
  }, []);

  const trainOneStep = useCallback(() => {
    const next = applyUpdate(W1, W2, grad, lr);
    setW1(next.W1);
    setW2(next.W2);
    setStep((s) => s + 1);
    const newFp = forwardPass(next.W1, next.W2);
    setLossHistory((prev) => [...prev.slice(-59), newFp.loss]);
  }, [W1, W2, grad, lr]);

  const resetNetwork = useCallback(() => {
    setW1(W1_INIT.map((r) => [...r]));
    setW2([...W2_INIT]);
    setStep(0);
    const initFp = forwardPass(W1_INIT, W2_INIT);
    setLossHistory([initFp.loss]);
    setMode("idle");
    setAutoRunning(false);
    if (autoTimer.current) clearTimeout(autoTimer.current);
  }, []);

  const runFullCycle = useCallback(() => {
    setMode("forward");
    setTick((t) => t + 1);
    const t1 = setTimeout(() => {
      setMode("backward");
      setTick((t) => t + 1);
    }, 1000);
    const t2 = setTimeout(() => {
      trainOneStep();
      setMode("idle");
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [trainOneStep]);

  useEffect(() => {
    if (!autoRunning) return;
    if (fp.loss < 0.002) {
      setAutoRunning(false);
      return;
    }
    autoTimer.current = setTimeout(() => {
      trainOneStep();
    }, 220);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [autoRunning, trainOneStep, fp.loss, step]);

  const lossMax = Math.max(...lossHistory, 0.001);
  const deepenNumbers = useMemo(() => computeDeepenNumbers(0.8), []);

  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Ẩn dụ mở đầu">
        <div className="rounded-2xl border-2 border-accent/30 bg-accent-light p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/60 dark:bg-white/10">
              <ClipboardCheck className="h-6 w-6 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground leading-snug">
                Mạng đoán sai — vậy lỗi đến từ LỚP NÀO?
              </h3>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Hình dung bạn là giáo viên chấm bài nhóm. Cả nhóm cùng làm một bài
                tập, kết quả cuối <strong>sai 5 điểm</strong> so với đáp án. Câu
                hỏi quan trọng không phải &ldquo;sai hay đúng&rdquo; — mà là{" "}
                <em>mỗi thành viên góp bao nhiêu vào cái sai đó</em>, để bạn biết
                ai cần học lại phần gì.
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Mạng nơ-ron cũng vậy. Khi ŷ khác target 0.2 đơn vị, câu hỏi thú
                vị là: <strong>weight nào chịu trách nhiệm bao nhiêu?</strong>{" "}
                Câu trả lời — cho cả <em>triệu</em> weight cùng một lúc — chính là{" "}
                <strong>backpropagation</strong>. Nó &ldquo;truy ngược lỗi&rdquo;
                từ đầu ra về từng lớp bằng quy tắc chuỗi, chỉ tốn một lần duyệt
                ngược.
              </p>
            </div>
          </div>

          {/* Mini sketch */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              {
                icon: Brain,
                iconCls: "text-sky-500",
                title: "Forward",
                desc: "Dữ liệu chảy từ trái sang phải, mạng đưa ra dự đoán.",
              },
              {
                icon: Target,
                iconCls: "text-amber-500",
                title: "So loss",
                desc: "So dự đoán với đáp án — ra một con số sai lệch.",
              },
              {
                icon: ArrowLeft,
                iconCls: "text-rose-500",
                title: "Backward",
                desc: "Truy ngược lỗi qua từng lớp, phân bổ trách nhiệm cho từng weight.",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-xl bg-white/70 dark:bg-white/5 p-3 text-center space-y-1">
                  <Icon className={`mx-auto h-6 w-6 ${card.iconCls}`} />
                  <p className="text-[11px] font-semibold text-foreground">{card.title}</p>
                  <p className="text-[10px] text-muted leading-tight">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — DISCOVER (PredictionGate) ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn đã biết phải 'truy ngược lỗi qua từng lớp'. Mạng có 1 triệu weight. Nếu bạn truy ngược NGÂY THƠ — mỗi weight chạy lại cả mạng một lần để đo ảnh hưởng — thì mất bao nhiêu lần duyệt mạng cho một bước cập nhật?"
          options={[
            "Một lần duyệt — chain rule miễn phí",
            "Khoảng 1.000 lần — vì mỗi lớp một lần",
            "Khoảng 1 triệu lần — mỗi weight một lần chạy lại",
            "Đúng 2 lần — một forward một backward",
          ]}
          correct={2}
          explanation="Cách ngây thơ (numerical differentiation) cần đổi từng weight rồi chạy lại cả mạng → O(N) lần duyệt, với N = số weight. 1 triệu weight nghĩa là 1 triệu lần duyệt — bất khả thi. Backprop thật sự chỉ tốn ĐÚNG một forward + một backward = 2 lần duyệt, nhờ chia sẻ các đạo hàm cục bộ đã tính được. Đây là lý do mạng tỉ tham số mới huấn luyện được trên đời."
        >
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Trong sơ đồ mạng bên dưới, bạn sẽ thấy đúng cái ý tưởng đó chạy: bấm{" "}
            <em>Forward</em> để dữ liệu chảy tới, rồi bấm <em>Backward</em> để
            gradient chảy về. Mỗi cạnh hiển thị chính{" "}
            <strong>gradient của weight đó</strong> — đúng một con số, đúng một
            lượt.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — REVEAL (interactive network) ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá tương tác">
        <VisualizationSection topicSlug={metadata.slug}>
          <LessonSection label="Thí nghiệm 1: Sơ đồ mạng 2-3-1" step={1}>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Mạng có 2 đầu vào, 3 nơ-ron ẩn (sigmoid), 1 đầu ra (sigmoid). Tổng
              9 weight. Mục tiêu y = 0.8. Bấm các nút dưới để thấy forward,
              backward, và cập nhật diễn ra trên cùng một sơ đồ.
            </p>

            <div className="rounded-xl border border-border bg-card/60 p-3">
              <NetworkDiagram
                W1={W1}
                W2={W2}
                fp={fp}
                grad={grad}
                mode={mode}
                tick={tick}
              />
            </div>

            {/* Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <ActionBtn onClick={runForward} icon={ArrowRight} cls="bg-blue-600 text-white hover:bg-blue-700">
                Forward
              </ActionBtn>
              <ActionBtn onClick={runBackward} icon={ArrowLeft} cls="bg-rose-600 text-white hover:bg-rose-700">
                Backward
              </ActionBtn>
              <ActionBtn onClick={trainOneStep} icon={TrendingDown} cls="bg-accent text-white hover:opacity-90">
                Huấn luyện 1 bước
              </ActionBtn>
              <ActionBtn onClick={runFullCycle} icon={Play} cls="bg-emerald-600 text-white hover:bg-emerald-700">
                Chu trình đủ
              </ActionBtn>
              <button
                type="button"
                onClick={() => setAutoRunning((r) => !r)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  autoRunning
                    ? "bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-900/30 dark:text-rose-200"
                    : "bg-card border border-border text-foreground hover:border-accent/50"
                }`}
              >
                {autoRunning ? "Dừng tự chạy" : "Tự chạy đến khi hội tụ"}
              </button>
              <ActionBtn onClick={resetNetwork} icon={RotateCcw} cls="border border-border bg-card text-muted hover:text-foreground">
                Đặt lại
              </ActionBtn>
            </div>

            {/* LR slider */}
            <div className="mt-4 max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground shrink-0">
                  Learning rate η
                </span>
                <input
                  type="range"
                  min={0.05}
                  max={3}
                  step={0.05}
                  value={lr}
                  onChange={(e) => setLr(parseFloat(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  aria-label="Learning rate"
                  style={{
                    background:
                      "linear-gradient(to right, #0ea5e9 0%, #22c55e 35%, #f59e0b 70%, #ef4444 100%)",
                  }}
                />
                <span
                  className="text-xs font-bold tabular-nums w-10 text-right"
                  style={{
                    color: lr < 0.3 ? "#0ea5e9" : lr < 1.2 ? "#16a34a" : lr < 2 ? "#b45309" : "#dc2626",
                  }}
                >
                  {lr.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-tertiary mt-1 text-center italic">
                η nhỏ → học chậm. η vừa → mượt. η lớn → dao động hoặc phân kỳ.
              </p>
            </div>

            {/* Numerical readout */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mx-auto">
              {[
                { label: "Bước", value: String(step), tone: "neutral" as const },
                { label: "ŷ", value: fp.out.toFixed(3), tone: "neutral" as const },
                { label: "Target", value: TARGET.toFixed(2), tone: "neutral" as const },
                {
                  label: "Loss",
                  value: fp.loss.toFixed(4),
                  tone: fp.loss < 0.005 ? ("ok" as const) : ("warn" as const),
                },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className={`rounded-lg border p-2 text-center ${
                    cell.tone === "ok"
                      ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700"
                      : cell.tone === "warn"
                        ? "bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700"
                        : "bg-card border-border"
                  }`}
                >
                  <p
                    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide ${
                      cell.tone === "ok"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : cell.tone === "warn"
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-tertiary"
                    }`}
                  >
                    {cell.tone === "ok" ? (
                      <Check size={10} aria-hidden="true" />
                    ) : cell.tone === "warn" ? (
                      <TriangleAlert size={10} aria-hidden="true" />
                    ) : null}
                    {cell.label}
                  </p>
                  <p
                    className={`text-sm font-bold tabular-nums ${
                      cell.tone === "ok"
                        ? "text-emerald-800 dark:text-emerald-200"
                        : cell.tone === "warn"
                          ? "text-amber-800 dark:text-amber-200"
                          : "text-foreground"
                    }`}
                  >
                    {cell.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Loss history chart */}
            <div className="mt-4 rounded-xl border border-border bg-card/60 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                  Đường loss qua {lossHistory.length} bước
                </span>
                <span className="text-[11px] font-mono text-accent">
                  min L = {Math.min(...lossHistory).toFixed(4)}
                </span>
              </div>
              <svg
                viewBox={`0 0 ${Math.max(lossHistory.length, 4) * 7} 70`}
                className="w-full h-20"
                preserveAspectRatio="none"
                role="img"
                aria-label="Biểu đồ loss giảm qua các bước huấn luyện."
              >
                {lossHistory.map((l, i) => {
                  const barH = (l / lossMax) * 60;
                  return (
                    <rect
                      key={i}
                      x={i * 7}
                      y={70 - barH}
                      width={6}
                      height={barH}
                      fill={l < 0.01 ? "#10b981" : l < 0.05 ? "#f59e0b" : "#ef4444"}
                      opacity={0.85}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Converged banner */}
            <AnimatePresence>
              {fp.loss < 0.005 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 p-3 text-sm text-emerald-700 dark:text-emerald-300 text-center max-w-lg mx-auto"
                >
                  Mạng đã hội tụ sau <strong>{step}</strong> bước huấn luyện!
                  Loss &lt; 0.005 — ŷ gần sát target. Bạn vừa xem backprop chạy
                  hết một vòng đời huấn luyện.
                </motion.div>
              )}
            </AnimatePresence>
          </LessonSection>

          {/* Preset tour */}
          <LessonSection label="Thí nghiệm 2: Ba kịch bản learning rate" step={2}>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              Bấm một nút để đặt mạng về trạng thái khởi tạo và chọn η tương
              ứng, rồi bấm <em>Tự chạy</em> ở trên để quan sát.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  lr: 0.2,
                  icon: TriangleAlert,
                  iconCls: "text-sky-500",
                  hoverCls: "hover:border-sky-400",
                  title: "η = 0.20 — chậm",
                  desc: "Loss giảm đều nhưng rất lâu mới chạm đáy. An toàn, không dao động.",
                },
                {
                  lr: 0.9,
                  icon: Sparkles,
                  iconCls: "text-emerald-500",
                  hoverCls: "hover:border-emerald-400",
                  title: "η = 0.90 — êm",
                  desc: "Hội tụ trong vài chục bước. Đây là vùng \u201csweet spot\u201d cho mạng nhỏ này.",
                },
                {
                  lr: 2.8,
                  icon: TriangleAlert,
                  iconCls: "text-rose-500",
                  hoverCls: "hover:border-rose-400",
                  title: "η = 2.80 — nổ",
                  desc: "Bước quá to, loss có thể nảy lên thay vì giảm. Quan sát đường loss răng cưa.",
                },
              ].map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.lr}
                    type="button"
                    onClick={() => {
                      resetNetwork();
                      setLr(preset.lr);
                    }}
                    className={`rounded-xl border border-border bg-card ${preset.hoverCls} p-3 text-left transition-colors`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${preset.iconCls}`} />
                      <span className="text-sm font-semibold text-foreground">
                        {preset.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-snug">{preset.desc}</p>
                  </button>
                );
              })}
            </div>
          </LessonSection>

          <Callout variant="insight" title="Ba điều đáng chú ý trong thí nghiệm">
            Thứ nhất: gradient ở cạnh cuối (hidden → output) có con số đáng kể.
            Thứ hai: gradient ở cạnh đầu (input → hidden) nhỏ hơn — vì đã bị
            nhân thêm σ&prime;(z) &lt; 0.25. Thứ ba: sau mỗi bước, weight nào có
            gradient lớn thì đổi nhiều hơn weight nào có gradient nhỏ. Đây chính
            là &ldquo;phân bổ trách nhiệm&rdquo; bằng toán.
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — DEEPEN (6-step walk-through) ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu — sáu bước cụ thể">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Giờ mổ xẻ một <em>mạng mini</em> (một đầu vào → một ẩn → một ra) với
          số nhỏ để bạn có thể theo dõi mọi con số. Bấm <em>Tiếp tục</em> để
          xem từng bước. Con số ở mỗi bước được tính thật bằng công thức bạn
          vừa thấy.
        </p>

        <StepReveal
          labels={[
            "1. Forward",
            "2. Loss",
            "3. ∂L/∂ŷ",
            "4. ∂L/∂h",
            "5. ∂L/∂w₁",
            "6. Cập nhật",
          ]}
        >
          {[
            <DeepenCard
              key="d1"
              icon={ArrowRight}
              tone="sky"
              title="Bước 1 — Forward: lấy ŷ"
              formula="x → z = w₁·x → h = σ(z) → z_out = w₂·h → ŷ = σ(z_out)"
              phase={1}
              numbers={deepenNumbers}
            >
              Cho đầu vào x₁ = {deepenNumbers.x1}, x₂ = {deepenNumbers.x2}. Với
              weight khởi tạo, mạng tính z = {deepenNumbers.z.toFixed(2)},
              activation h = σ(z) = {deepenNumbers.h.toFixed(3)}. Qua lớp ra:
              z_out = w₂·h = {deepenNumbers.zOut.toFixed(3)}, và dự đoán{" "}
              <strong>ŷ = σ(z_out) = {deepenNumbers.yHat.toFixed(3)}</strong>.
              Forward KHÔNG vứt đi các con số này — chúng sẽ dùng lại ở
              backward.
            </DeepenCard>,
            <DeepenCard
              key="d2"
              icon={Target}
              tone="amber"
              title="Bước 2 — Tính loss"
              formula="L = ½(y − ŷ)²"
              phase={2}
              numbers={deepenNumbers}
            >
              So dự đoán ŷ = {deepenNumbers.yHat.toFixed(3)} với target y ={" "}
              {TARGET}. Sai lệch: {(TARGET - deepenNumbers.yHat).toFixed(3)}.
              Loss MSE: L = ½·(sai lệch)² ={" "}
              <strong>{deepenNumbers.loss.toFixed(4)}</strong>. Con số càng to
              thì mạng càng sai nhiều.
            </DeepenCard>,
            <DeepenCard
              key="d3"
              icon={ArrowLeft}
              tone="rose"
              title="Bước 3 — ∂L/∂ŷ (điểm khởi đầu của backward)"
              formula="∂L/∂ŷ = −(y − ŷ)"
              phase={3}
              numbers={deepenNumbers}
            >
              Backward bắt đầu ở đây — con số DUY NHẤT ta biết trực tiếp. Thay
              số: ∂L/∂ŷ = −({TARGET} − {deepenNumbers.yHat.toFixed(3)}) ={" "}
              <strong>{deepenNumbers.dL_dOut.toFixed(3)}</strong>. Dấu âm nói:
              ŷ đang thấp hơn target, tăng ŷ một chút → loss giảm. Dấu này
              quyết định hướng sửa weight.
            </DeepenCard>,
            <DeepenCard
              key="d4"
              icon={Link2}
              tone="emerald"
              title="Bước 4 — Chain rule: ∂L/∂h qua ba thừa số"
              formula="∂L/∂h = ∂L/∂ŷ · ∂ŷ/∂z_out · ∂z_out/∂h"
              phase={4}
              numbers={deepenNumbers}
            >
              Chain rule xuất hiện. Ba thừa số: (a) ∂L/∂ŷ ={" "}
              {deepenNumbers.dL_dOut.toFixed(3)} — ở bước 3; (b) ∂ŷ/∂z_out =
              ŷ·(1−ŷ) = {deepenNumbers.dOut_dZout.toFixed(3)} — đạo hàm sigmoid
              output; (c) ∂z_out/∂h = w₂ = {deepenNumbers.w2}. Nhân ba: ∂L/∂h ={" "}
              <strong>{deepenNumbers.dL_dH.toFixed(3)}</strong>. Gradient đã lan
              về lớp ẩn mà không cần chạy lại mạng.
            </DeepenCard>,
            <DeepenCard
              key="d5"
              icon={Layers}
              tone="violet"
              title="Bước 5 — ∂L/∂w₁ cho mỗi weight lớp vào"
              formula="∂L/∂w₁ⱼ = ∂L/∂h · σ′(z) · xⱼ"
              phase={5}
              numbers={deepenNumbers}
            >
              Tiếp chain rule. σ&prime;(z) = h·(1−h) ={" "}
              {deepenNumbers.dH_dZ.toFixed(3)} — đạo hàm sigmoid ở lớp ẩn. Với
              w₁ₐ (nối x₁ → h): nhân thêm x₁ = {deepenNumbers.x1} ra{" "}
              <strong>{deepenNumbers.dL_dW1a.toFixed(3)}</strong>. Với w₁_b (nối
              x₂ → h): nhân thêm x₂ = {deepenNumbers.x2} ra{" "}
              <strong>{deepenNumbers.dL_dW1b.toFixed(3)}</strong>. Hai weight
              cùng lớp nhưng gradient khác nhau vì nhân với đầu vào khác.
            </DeepenCard>,
            <DeepenCard
              key="d6"
              icon={TrendingDown}
              tone="indigo"
              title="Bước 6 — Cập nhật: w ← w − η · ∂L/∂w"
              formula="với η = 0.8 (learning rate)"
              phase={6}
              numbers={deepenNumbers}
            >
              Áp dụng công thức gradient descent cho từng weight. w₂ mới ={" "}
              {deepenNumbers.w2} − 0.8 · {deepenNumbers.dL_dW2.toFixed(3)} ={" "}
              <strong>{deepenNumbers.w2New.toFixed(3)}</strong>. w₁ₐ mới ={" "}
              <strong>{deepenNumbers.w1aNew.toFixed(3)}</strong>, w₁_b mới ={" "}
              <strong>{deepenNumbers.w1bNew.toFixed(3)}</strong>. Dấu TRỪ bảo ta
              đi NGƯỢC gradient (gradient chỉ hướng tăng loss, ta muốn giảm).
              Sau một bước, chạy forward lại — loss sẽ nhỏ hơn một chút.
            </DeepenCard>,
          ]}
        </StepReveal>

        <div className="mt-6">
          <AhaMoment>
            <strong>Sáu bước — chỉ nhân và cộng</strong>. Không phép thuật. Mỗi
            lớp nhớ activation của mình, tính đạo hàm cục bộ (một hai dòng),
            rồi nhân vào gradient truyền ngược. Làm như thế qua 100 lớp cũng
            không khó hơn — chỉ dài hơn. Đây là lý do bạn có thể viết
            backpropagation bằng tay cho mạng nhỏ, và framework làm tự động
            cho mạng tỉ tham số.
          </AhaMoment>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — CHALLENGE ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Mạng 2-3-1. Bạn tính được ∂L/∂ŷ = 0.3, ŷ = 0.7, và weight w₂ nối h₁ → ŷ bằng 0.5. Áp dụng chain rule, ∂L/∂h₁ bằng bao nhiêu?"
          options={[
            "∂L/∂h₁ = 0.3 + 0.5 = 0.8 — cộng ba thành phần",
            "∂L/∂h₁ = 0.3 · ŷ(1−ŷ) · w₂ = 0.3 · 0.21 · 0.5 = 0.0315",
            "∂L/∂h₁ = 0.3 · 0.5 = 0.15 — chỉ cần hai thừa số",
            "∂L/∂h₁ = w₂ / ∂L/∂ŷ = 0.5 / 0.3 ≈ 1.67",
          ]}
          correct={1}
          explanation="Chain rule nhân ba thừa số để đi từ ŷ về h₁: (1) ∂L/∂ŷ = 0.3 đã có; (2) ∂ŷ/∂z_out = ŷ·(1−ŷ) = 0.7·0.3 = 0.21 — đạo hàm sigmoid output; (3) ∂z_out/∂h₁ = w₂ = 0.5. Tích: 0.3 · 0.21 · 0.5 = 0.0315. Lỗi thường gặp là quên đạo hàm sigmoid, hoặc cộng thay vì nhân."
        />

        <div className="mt-5">
          <InlineChallenge
            question="Mạng 50 lớp, toàn sigmoid. Đạo hàm sigmoid cực đại = 0.25 (đạt khi activation = 0.5). Gradient ở LỚP ĐẦU TIÊN (xa output nhất) có độ lớn xấp xỉ bao nhiêu so với gradient ở lớp CUỐI?"
            options={[
              "Giống nhau — chain rule giữ gradient không đổi",
              "To hơn 50 lần — mỗi lớp cộng thêm 0.25",
              "Nhỏ hơn khoảng 0.25^50 ≈ 1.1·10⁻³⁰ — gần như bằng 0 (vanishing gradient)",
              "Lớn hơn vì lớp đầu nhiều weight hơn",
            ]}
            correct={2}
            explanation="Chain rule NHÂN đạo hàm cục bộ. 0.25^50 ≈ 10⁻³⁰ — gradient teo tới mức gần 0 trước khi về đến lớp đầu. Hệ quả: lớp đầu gần như không được cập nhật → mạng không học được đặc trưng sơ cấp. Giải pháp thực tế: thay sigmoid bằng ReLU (đạo hàm = 1 khi z > 0), dùng Batch Normalization, hoặc Residual Connection (skip connection) của ResNet để gradient có đường tắt."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — EXPLAIN (exactly 3 LaTeX) ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích toán">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Bạn đã thấy backprop chạy bằng số trong mạng mini ở Bước 4. Giờ ta
            viết lại bằng ba công thức tổng quát — mỗi công thức kèm một hình
            minh hoạ và một câu &ldquo;nó nghĩa là gì bằng tiếng Việt đời
            thường&rdquo;.
          </p>

          {/* Công thức 1 — chain rule áp dụng cho mạng */}
          <FormulaBox
            idx={1}
            title="Quy tắc chuỗi xuyên mạng"
            subtitle="Gradient của loss theo một weight ở lớp đầu = tích các đạo hàm cục bộ suốt đường đi từ weight đó đến output."
            latex="\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial z_{\\text{out}}} \\cdot \\frac{\\partial z_{\\text{out}}}{\\partial h} \\cdot \\frac{\\partial h}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}"
            caption={"\u201cĐể biết một weight ở lớp đầu ảnh hưởng loss bao nhiêu, đi ngược đường đi tín hiệu, nhân đạo hàm cục bộ ở mỗi đoạn.\u201d"}
          >
            <svg viewBox="0 0 500 120" className="w-full">
              <title>Chain rule: gradient lan qua 5 đoạn, mỗi đoạn là một thừa số.</title>
              {[
                { x: 40, label: "L", color: "#f59e0b" },
                { x: 130, label: "ŷ", color: "#ec4899" },
                { x: 220, label: "z_out", color: "#8b5cf6" },
                { x: 310, label: "h", color: "#3b82f6" },
                { x: 400, label: "z", color: "#0ea5e9" },
                { x: 470, label: "w", color: "#16a34a" },
              ].map((n) => (
                <g key={n.label}>
                  <circle cx={n.x} cy={50} r={22} fill={n.color + "22"} stroke={n.color} strokeWidth={1.8} />
                  <text x={n.x} y={54} textAnchor="middle" fontSize={12} fill={n.color} fontWeight={700} fontFamily="monospace">
                    {n.label}
                  </text>
                </g>
              ))}
              {[
                { x1: 118, x2: 64, label: "∂L/∂ŷ" },
                { x1: 208, x2: 154, label: "∂ŷ/∂z_out" },
                { x1: 298, x2: 244, label: "∂z_out/∂h" },
                { x1: 388, x2: 334, label: "∂h/∂z" },
                { x1: 458, x2: 424, label: "∂z/∂w" },
              ].map((e, i) => (
                <g key={i}>
                  <line x1={e.x1} y1={50} x2={e.x2} y2={50} stroke="#dc2626" strokeWidth={2} markerEnd="url(#backward-arrow)" />
                  <text x={(e.x1 + e.x2) / 2} y={38} textAnchor="middle" fontSize={11} fill="#991b1b" fontFamily="monospace">
                    {e.label}
                  </text>
                </g>
              ))}
              <defs>
                <marker id="backward-arrow" markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto">
                  <path d="M 0 0 L 8 4 L 0 8 Z" fill="#dc2626" />
                </marker>
              </defs>
              <text x={250} y={100} textAnchor="middle" fontSize={11} fill="var(--text-secondary)" fontStyle="italic">
                Bắt đầu từ L ở bên trái, đi NGƯỢC, nhân mỗi cạnh.
              </text>
            </svg>
          </FormulaBox>

          <FormulaBox
            idx={2}
            title="Gradient loss theo một weight — dạng gọn"
            subtitle="Mỗi weight wᵢⱼ (nối nơ-ron j → nơ-ron i) có công thức: gradient sai số lan về nhân với activation đi vào."
            latex="\\frac{\\partial L}{\\partial w_{ij}} = \\delta_i \\cdot a_j"
            caption={"\u201cWeight giữa A và B được cập nhật theo tích của hai thứ: A phát ra bao nhiêu (a_j), và B chịu trách nhiệm bao nhiêu cho lỗi cuối (δ_i).\u201d"}
          >
            <svg viewBox="0 0 440 130" className="w-full">
              <title>Công thức δ · a — gradient của weight nối hai nơ-ron.</title>
              <circle cx={100} cy={65} r={28} fill="#3b82f622" stroke="#3b82f6" strokeWidth={2} />
              <text x={100} y={70} textAnchor="middle" fontSize={12} fill="#1e3a8a" fontWeight={700} fontFamily="monospace">a_j</text>
              <text x={100} y={30} textAnchor="middle" fontSize={11} fill="#1e3a8a">activation đi vào</text>
              <circle cx={340} cy={65} r={28} fill="#dc262622" stroke="#dc2626" strokeWidth={2} />
              <text x={340} y={70} textAnchor="middle" fontSize={12} fill="#991b1b" fontWeight={700} fontFamily="monospace">δ_i</text>
              <text x={340} y={30} textAnchor="middle" fontSize={11} fill="#991b1b">gradient lan về</text>
              <line x1={130} y1={65} x2={310} y2={65} stroke="#8b5cf6" strokeWidth={3} />
              <text x={220} y={58} textAnchor="middle" fontSize={11} fill="#6d28d9" fontWeight={700} fontFamily="monospace">w_ij</text>
              <text x={220} y={82} textAnchor="middle" fontSize={11} fill="var(--text-secondary)">
                ∂L/∂w_ij = δ_i · a_j
              </text>
              <text x={220} y={120} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)" fontStyle="italic">
                δ_i = (sai số lan về nơ-ron i) · σ&prime;(z_i)
              </text>
            </svg>
          </FormulaBox>

          <FormulaBox
            idx={3}
            title="Cập nhật weight — gradient descent"
            subtitle="Sau khi backprop xong, áp dụng công thức này cho MỌI weight cùng một lúc."
            latex="w \\leftarrow w - \\eta \\, \\frac{\\partial L}{\\partial w}"
            caption={"\u201cWeight cũ trừ đi cỡ bước (η) nhân trách nhiệm (gradient). Làm đồng thời cho mọi weight — đó là một lần gradient descent trên toàn mạng.\u201d"}
          >
            <svg viewBox="0 0 440 100" className="w-full">
              <title>Weight cũ trừ η·gradient = weight mới.</title>
              <Pill cx={75} cy={50} label="w cũ" value="0.35" color="#8b5cf6" width={90} height={40} />
              <text x={130} y={55} fontSize={18} fill="var(--text-primary)" fontWeight={700}>−</text>
              <Pill cx={180} cy={50} label="η" value="0.8" color="#0ea5e9" width={60} height={40} />
              <text x={220} y={55} fontSize={18} fill="var(--text-primary)" fontWeight={700}>·</text>
              <Pill cx={285} cy={50} label="∂L/∂w" value="−0.05" color="#dc2626" width={90} height={40} />
              <text x={340} y={55} fontSize={18} fill="var(--text-primary)" fontWeight={700}>=</text>
              <Pill cx={395} cy={50} label="w mới" value="0.39" color="#16a34a" width={70} height={40} />
              <text x={220} y={90} textAnchor="middle" fontSize={11} fill="var(--text-tertiary)" fontStyle="italic">
                Dấu TRỪ: đi NGƯỢC gradient vì gradient chỉ hướng loss TĂNG.
              </text>
            </svg>
          </FormulaBox>

          <Callout variant="insight" title="Ba công thức ghép thành một thuật toán">
            (1) Chain rule cho biết làm sao đi ngược qua mạng; (2) công thức δ·a
            biến chain rule thành một phép tính cục bộ ở từng cạnh weight; (3)
            update rule dùng gradient để đi về phía loss nhỏ hơn. Ba mảnh này
            là toàn bộ thuật toán backpropagation — những thứ còn lại (batch,
            momentum, Adam, learning rate schedule) chỉ là cải tiến xung quanh
            lõi này.
          </Callout>

          <CollapsibleDetail title="Vì sao backprop NHÂN các đạo hàm mà không CỘNG?">
            <div className="space-y-2 text-sm leading-relaxed text-muted">
              <p>
                Trực giác: hãy tưởng tượng một chuỗi tỉ lệ. Giá vé đổi 1 đồng
                làm chi phí chuyến đi đổi 2 đồng. Chi phí chuyến đi đổi 1 đồng
                làm ngân sách đổi 1.5 đồng. Kết hợp lại: giá vé đổi 1 đồng làm
                ngân sách đổi 2·1.5 = 3 đồng. Các tỉ lệ dọc chuỗi NHÂN nhau,
                không cộng.
              </p>
              <p>
                Toán học: khi h → 0 trong định nghĩa đạo hàm, các hạng tử bậc
                cao bị bỏ qua, và chỉ còn tích các hệ số tuyến tính — chính là
                chain rule.
              </p>
              <p>
                Hệ quả trực tiếp: nếu mỗi lớp có đạo hàm cục bộ &lt; 1, tích
                qua nhiều lớp tiến về 0 (vanishing). Nếu &gt; 1, tích phát nổ
                (exploding). Đây là lý do{" "}
                <TopicLink slug="vanishing-exploding-gradients">
                  vanishing &amp; exploding gradient
                </TopicLink>{" "}
                là vấn đề kinh điển của mạng sâu.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Framework (PyTorch, JAX) làm gì khác so với khi mình viết tay?">
            <div className="space-y-2 text-sm leading-relaxed text-muted">
              <p>
                Thư viện ghi lại <strong>computational graph</strong> khi bạn
                viết forward pass. Mỗi phép toán cơ bản (nhân ma trận, cộng,
                sigmoid, ReLU, …) đã có đạo hàm được cài sẵn. Khi bạn gọi{" "}
                loss.backward(), thư viện tự động chạy chain rule theo đúng thứ
                tự ngược của graph.
              </p>
              <p>
                Cái tên chuyên môn là <em>reverse-mode automatic
                differentiation</em> (autodiff ngược). Nó KHÔNG phải tính đạo
                hàm tượng trưng, cũng KHÔNG phải xấp xỉ số — nó tính đạo hàm
                CHÍNH XÁC bằng cách ráp các đạo hàm cục bộ đã biết. Chi phí:
                thêm ~1 lần duyệt nữa so với forward, và bộ nhớ gấp đôi (phải
                lưu activation của mọi lớp).
              </p>
            </div>
          </CollapsibleDetail>

          <p className="leading-relaxed mt-4">
            Để hiểu sâu về cách <em>tính</em> đạo hàm (chain rule, đạo hàm
            riêng, gradient), đọc{" "}
            <TopicLink slug="calculus-for-backprop">
              giải tích cho backprop
            </TopicLink>
            . Để hiểu cách <em>dùng</em> gradient để đi về minimum (learning
            rate, momentum, Adam), đọc{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink>.
            Backprop chỉ tính gradient — việc đi xuống đồi là của gradient
            descent.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — CONNECT ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt & Liên kết">
        <MiniSummary
          title="Năm ý bạn mang về"
          points={[
            "Backprop trả lời câu hỏi: mỗi weight ảnh hưởng loss bao nhiêu. Gradient ∂L/∂w là đơn vị đo của 'trách nhiệm'.",
            "Cách làm: bắt đầu từ ∂L/∂output (con số duy nhất biết trực tiếp), rồi áp quy tắc chuỗi để lan ngược về từng lớp.",
            "Công thức gọn cho một weight: ∂L/∂w_ij = δ_i · a_j — tích của gradient lan về và activation đi vào.",
            "Gradient descent cập nhật: w ← w − η · ∂L/∂w. Dấu TRỪ vì gradient chỉ hướng TĂNG của loss.",
            "Thách thức thực tế ở mạng sâu: vanishing / exploding gradient — giải pháp: ReLU, Batch Normalization, Residual Connection.",
          ]}
        />

        <div className="mt-5 space-y-3">
          <Callout variant="tip" title="Bước kế tiếp trong lộ trình">
            Backprop chỉ TÍNH gradient — phần quyết định đi về đâu là của{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink>{" "}
            (bao gồm các biến thể như momentum, Adam). Và nền tảng toán của
            chain rule xuyên mạng nằm ở{" "}
            <TopicLink slug="calculus-for-backprop">
              giải tích cho backprop
            </TopicLink>{" "}
            — nếu bạn thấy mấy công thức trên hơi khó, đọc bài đó trước rồi
            quay lại sẽ dễ hơn rất nhiều.
          </Callout>

          <Callout variant="insight" title="Một sự thật lịch sử">
            Ý tưởng backprop có từ Seppo Linnainmaa (1970) và Paul Werbos
            (1974), nhưng phải đến bài báo của Rumelhart, Hinton, Williams
            (1986) cộng đồng mới nhìn ra sức mạnh thực sự của nó cho mạng đa
            tầng. Gần 40 năm sau, mọi framework deep learning (PyTorch,
            TensorFlow, JAX) đều xây quanh đúng thuật toán này — và nó là công
            cụ toán học đứng sau mọi mô hình lớn ngày nay, từ GPT đến Stable
            Diffusion.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
        <div className="mt-6 flex items-center justify-center text-xs text-muted gap-2">
          <Compass className="h-3.5 w-3.5" />
          Bạn có thể quay lại sơ đồ mạng và kịch bản learning rate bất cứ lúc
          nào để củng cố trực giác.
        </div>
      </LessonSection>
    </>
  );
}
