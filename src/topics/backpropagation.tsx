"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

/* ───────────────────────────────────────────────────────────────────────────
 * METADATA
 * ───────────────────────────────────────────────────────────────────────────
 * Giữ nguyên theo yêu cầu bài học — thông tin mô tả dùng cho hệ thống đề
 * xuất, trang chủ lộ trình và sitemap.
 * ───────────────────────────────────────────────────────────────────────── */

export const metadata: TopicMeta = {
  slug: "backpropagation",
  title: "Backpropagation",
  titleVi: "Lan truyền ngược",
  description:
    "Thuật toán cốt lõi để huấn luyện mạng nơ-ron — truy ngược lỗi từ đầu ra về từng trọng số bằng quy tắc chuỗi, rồi điều chỉnh trọng số đúng một lượng tối ưu.",
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

/* ───────────────────────────────────────────────────────────────────────────
 * TOÁN HỌC CỐT LÕI
 * ───────────────────────────────────────────────────────────────────────────
 * Ta dựng một mạng nơ-ron nhỏ với kiến trúc 2-3-1:
 *   - 2 đầu vào  : x1 = 0.60, x2 = 0.90
 *   - 3 nơ-ron ẩn: h1, h2, h3 (sigmoid)
 *   - 1 đầu ra   : ŷ (sigmoid)
 *
 * Có 2 ma trận trọng số:
 *   W1 ∈ R^{3×2} (6 trọng số từ input → hidden)
 *   W2 ∈ R^{1×3} (3 trọng số từ hidden → output)
 *
 * Tổng cộng 9 trọng số. Ta tính forward pass, loss (MSE), rồi tính gradient
 * cho từng trọng số theo chain rule.
 * ───────────────────────────────────────────────────────────────────────── */

const TARGET = 0.8;
const X1 = 0.6;
const X2 = 0.9;

// Trọng số khởi tạo "xui rủi" để dự đoán ban đầu xa mục tiêu → dễ quan sát quá
// trình học rõ ràng qua nhiều bước.
const W1_INIT: number[][] = [
  [0.15, -0.2], // trọng số vào h1
  [0.25, 0.3], // trọng số vào h2
  [-0.1, 0.4], // trọng số vào h3
];
const W2_INIT: number[] = [0.35, -0.3, 0.5]; // trọng số từ h1,h2,h3 → ŷ

// Kích hoạt sigmoid và đạo hàm — chọn sigmoid vì giá trị đẹp trong [0,1] và
// đạo hàm thể hiện được hiện tượng vanishing khi bão hòa.
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const dSigmoid = (a: number) => a * (1 - a);

interface ForwardResult {
  z: number[]; // pre-activations của hidden layer
  h: number[]; // activations của hidden layer
  zOut: number; // pre-activation của output
  out: number; // activation của output
  loss: number; // MSE loss
}

function forwardPass(W1: number[][], W2: number[], x1 = X1, x2 = X2): ForwardResult {
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
  dL_dW2: number[]; // 3 gradient cho W2
  dL_dW1: number[][]; // 3x2 gradient cho W1
  dL_dOut: number; // đạo hàm loss theo output
  dL_dZout: number; // đạo hàm loss theo pre-activation output
  dL_dH: number[]; // đạo hàm loss theo mỗi hidden activation
}

/**
 * Tính toàn bộ gradient bằng chain rule, diễn giải từng bước.
 *
 * Gọi L = ½(y − ŷ)². Với y là TARGET cố định, ta có:
 *   dL/dŷ      = −(y − ŷ)
 *   dŷ/dzOut   = ŷ · (1 − ŷ)          // đạo hàm sigmoid
 *   dzOut/dW2ᵢ = hᵢ
 *   dzOut/dhᵢ  = W2ᵢ
 *   dhᵢ/dzᵢ    = hᵢ · (1 − hᵢ)
 *   dzᵢ/dW1ᵢⱼ  = xⱼ
 *
 * Ghép lại:
 *   ∂L/∂W2ᵢ   = dL/dŷ · dŷ/dzOut · hᵢ
 *   ∂L/∂W1ᵢⱼ  = dL/dŷ · dŷ/dzOut · W2ᵢ · dhᵢ/dzᵢ · xⱼ
 */
function backwardPass(
  W1: number[][],
  W2: number[],
  fp: ForwardResult,
  x1 = X1,
  x2 = X2
): GradientResult {
  void W1; // giữ tham số cho khả năng mở rộng về sau
  const dL_dOut = -(TARGET - fp.out);
  const dL_dZout = dL_dOut * dSigmoid(fp.out);

  const dL_dW2: number[] = [
    dL_dZout * fp.h[0],
    dL_dZout * fp.h[1],
    dL_dZout * fp.h[2],
  ];

  const dL_dH: number[] = [
    dL_dZout * W2[0],
    dL_dZout * W2[1],
    dL_dZout * W2[2],
  ];

  const dL_dW1: number[][] = [];
  for (let i = 0; i < 3; i += 1) {
    const dHi_dZi = dSigmoid(fp.h[i]);
    dL_dW1.push([
      dL_dH[i] * dHi_dZi * x1,
      dL_dH[i] * dHi_dZi * x2,
    ]);
  }

  return { dL_dW2, dL_dW1, dL_dOut, dL_dZout, dL_dH };
}

function applyUpdate(
  W1: number[][],
  W2: number[],
  g: GradientResult,
  lr: number
): { W1: number[][]; W2: number[] } {
  const W2_new = W2.map((w, i) => w - lr * g.dL_dW2[i]);
  const W1_new = W1.map((row, i) => [
    row[0] - lr * g.dL_dW1[i][0],
    row[1] - lr * g.dL_dW1[i][1],
  ]);
  return { W1: W1_new, W2: W2_new };
}

/* ───────────────────────────────────────────────────────────────────────────
 * QUIZ — 8 câu hỏi đa dạng (trắc nghiệm, điền chỗ trống)
 * ───────────────────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Backpropagation dùng quy tắc toán học nào để tính gradient khi lan truyền ngược qua nhiều lớp?",
    options: [
      "Quy tắc tích (product rule)",
      "Quy tắc chuỗi (chain rule)",
      "Quy tắc thương (quotient rule)",
      "Quy tắc L'Hôpital",
    ],
    correct: 1,
    explanation:
      "Chain rule cho phép tính đạo hàm của hàm hợp: dL/dw = dL/dŷ · dŷ/dz · dz/dw. Mỗi lớp đóng góp một thừa số nhân thêm — chính vì vậy mà 'gradient có thể biến mất hoặc bùng nổ' khi mạng quá sâu.",
  },
  {
    question:
      "Tại sao backpropagation hiệu quả hơn việc thử ngẫu nhiên các trọng số?",
    options: [
      "Vì nó chạy trên GPU nhanh hơn",
      "Vì nó tính CHÍNH XÁC hướng thay đổi của mỗi trọng số chỉ trong 1 lần duyệt ngược",
      "Vì nó chỉ thay đổi trọng số ở lớp cuối",
      "Vì nó thử ngẫu nhiên nhưng thông minh hơn",
    ],
    correct: 1,
    explanation:
      "Backprop tính gradient chính xác cho MỌI trọng số trong đúng một lần duyệt ngược — không thử-sai, không mò. Nếu mạng có N trọng số, ta chỉ tốn O(N) phép tính thay vì O(N²) như khi thử đổi từng trọng số một.",
  },
  {
    question:
      "Khi mạng có 100 lớp và mỗi đạo hàm chain rule có độ lớn khoảng 0.5, gradient ở lớp đầu tiên sẽ như thế nào?",
    options: [
      "Vẫn giữ nguyên",
      "Tăng rất lớn (bùng nổ)",
      "Giảm gần về 0 (biến mất)",
      "Dao động không ổn định",
    ],
    correct: 2,
    explanation:
      "0.5^100 ≈ 7.9e-31. Đây là hiện tượng vanishing gradient — các lớp đầu gần như không được cập nhật. Giải pháp phổ biến: dùng ReLU (đạo hàm = 1 khi > 0), Batch Normalization, hoặc Residual Connection (ResNet).",
  },
  {
    type: "fill-blank",
    question:
      "Backpropagation sử dụng quy tắc {blank} để tính đạo hàm của hàm hợp, cho phép truyền gradient từ lớp đầu ra về lớp đầu vào qua nhiều phép tính liên tiếp.",
    blanks: [{ answer: "chuỗi", accept: ["chain rule", "quy tắc chuỗi"] }],
    explanation:
      "Quy tắc chuỗi (chain rule): d(f∘g)/dx = df/dg × dg/dx. Backpropagation áp dụng chain rule lặp lại cho mỗi lớp — mỗi lớp đóng góp một thừa số nhân thêm vào gradient cuối cùng.",
  },
  {
    question:
      "Công thức cập nhật trọng số chuẩn của gradient descent trong backprop là gì?",
    options: [
      "w_new = w_old × learning_rate",
      "w_new = w_old + learning_rate × gradient",
      "w_new = w_old − learning_rate × gradient",
      "w_new = gradient / learning_rate",
    ],
    correct: 2,
    explanation:
      "Ta TRỪ gradient (nhân với learning rate) để đi ngược hướng tăng của loss — tức là đi về phía loss giảm. Gradient chỉ hướng tăng nhanh nhất, nên ta đi theo hướng âm của nó.",
  },
  {
    question:
      "Trong mạng 2-3-1 với sigmoid, một trọng số ẩn w₁₁ nằm giữa x₁ và h₁. Công thức chain rule cho ∂L/∂w₁₁ là gì?",
    options: [
      "∂L/∂w₁₁ = ∂L/∂ŷ · x₁",
      "∂L/∂w₁₁ = ∂L/∂ŷ · ∂ŷ/∂z_out · W2₁ · h₁(1−h₁) · x₁",
      "∂L/∂w₁₁ = h₁ · x₁",
      "∂L/∂w₁₁ = ∂L/∂ŷ · ∂ŷ/∂h₁",
    ],
    correct: 1,
    explanation:
      "Phải nhân qua đủ 5 thừa số: ∂L/∂ŷ (từ loss), ∂ŷ/∂z_out (đạo hàm sigmoid output), W2₁ (trọng số output nhìn về h₁), h₁(1−h₁) (đạo hàm sigmoid hidden) và cuối cùng x₁ (đầu vào).",
  },
  {
    type: "fill-blank",
    question:
      "Nếu learning rate quá lớn, trọng số sẽ {blank} quanh điểm tối ưu — loss không giảm mà còn tăng lên.",
    blanks: [{ answer: "dao động", accept: ["dao động", "nhảy", "oscillate", "bật"] }],
    explanation:
      "Learning rate lớn khiến mỗi bước cập nhật nhảy qua điểm tối ưu. Trong thực tế, người ta thường dùng learning rate schedule (warmup + decay) hoặc optimizer có adaptive step size như Adam.",
  },
  {
    question:
      "Trong PyTorch, gọi loss.backward() có tác dụng gì?",
    options: [
      "Tính forward pass",
      "Tính và tích lũy gradient vào thuộc tính .grad của từng parameter",
      "Cập nhật trọng số ngay lập tức",
      "Reset gradient về 0",
    ],
    correct: 1,
    explanation:
      ".backward() xây dựng lại computational graph và tính gradient cho mọi tensor có requires_grad=True. Gradient được CỘNG DỒN vào .grad — nên phải gọi optimizer.zero_grad() trước mỗi bước để tránh tích lũy từ batch trước.",
  },
];

/* ───────────────────────────────────────────────────────────────────────────
 * COMPONENT PHỤ — Computational Graph trực quan
 * ───────────────────────────────────────────────────────────────────────────
 * Vẽ mạng 2-3-1 bằng SVG, với các node và edge có thể đổi màu / độ mờ để
 * minh họa forward (trái→phải) và backward (phải→trái). Gradient hiển thị
 * dưới dạng số trên cạnh và vòng glow quanh node.
 * ───────────────────────────────────────────────────────────────────────── */

interface GraphProps {
  W1: number[][];
  W2: number[];
  fp: ForwardResult;
  grad: GradientResult;
  direction: "idle" | "forward" | "backward";
  tick: number; // tăng mỗi lần animation re-run để force key change
}

function NetworkGraph({ W1, W2, fp, grad, direction, tick }: GraphProps) {
  const inputX = 60;
  const hiddenX = 220;
  const outputX = 380;

  const inputYs = [80, 160];
  const hiddenYs = [60, 140, 220];
  const outputY = 140;

  const forwardColor = "#2563eb"; // blue-600
  const backwardColor = "#dc2626"; // red-600
  const neutral = "var(--accent)";

  return (
    <svg viewBox="0 0 460 280" className="w-full max-w-xl mx-auto">
      {/* ─── Edges: input → hidden (W1) ─── */}
      {[0, 1, 2].map((i) =>
        [0, 1].map((j) => {
          const y1 = inputYs[j];
          const y2 = hiddenYs[i];
          const gradValue = grad.dL_dW1[i][j];
          const weight = W1[i][j];
          const edgeKey = `w1-${i}-${j}`;
          const isForward = direction === "forward";
          const isBackward = direction === "backward";
          const stroke = isForward ? forwardColor : isBackward ? backwardColor : neutral;
          return (
            <g key={edgeKey}>
              <motion.line
                x1={inputX + 22}
                y1={y1}
                x2={hiddenX - 22}
                y2={y2}
                stroke={stroke}
                strokeWidth={1.5 + Math.min(2.5, Math.abs(weight) * 2)}
                opacity={0.55}
                initial={false}
                animate={{
                  pathLength: isBackward ? [0, 1] : 1,
                  opacity: direction === "idle" ? 0.35 : 0.8,
                }}
                transition={{ duration: 0.7, delay: isBackward ? 0.2 + i * 0.05 : 0 }}
              />
              <text
                x={(inputX + hiddenX) / 2}
                y={(y1 + y2) / 2 - 4}
                fontSize={8}
                fill="var(--text-secondary)"
                textAnchor="middle"
              >
                {isBackward ? `∂=${gradValue.toFixed(3)}` : weight.toFixed(2)}
              </text>
            </g>
          );
        })
      )}

      {/* ─── Edges: hidden → output (W2) ─── */}
      {[0, 1, 2].map((i) => {
        const y1 = hiddenYs[i];
        const weight = W2[i];
        const gradValue = grad.dL_dW2[i];
        const isForward = direction === "forward";
        const isBackward = direction === "backward";
        const stroke = isForward ? forwardColor : isBackward ? backwardColor : neutral;
        return (
          <g key={`w2-${i}`}>
            <motion.line
              x1={hiddenX + 22}
              y1={y1}
              x2={outputX - 22}
              y2={outputY}
              stroke={stroke}
              strokeWidth={1.5 + Math.min(2.5, Math.abs(weight) * 2)}
              opacity={0.55}
              initial={false}
              animate={{
                pathLength: isBackward ? [0, 1] : 1,
                opacity: direction === "idle" ? 0.35 : 0.9,
              }}
              transition={{ duration: 0.6, delay: isBackward ? i * 0.05 : 0.4 + i * 0.08 }}
            />
            <text
              x={(hiddenX + outputX) / 2}
              y={(y1 + outputY) / 2 - 4}
              fontSize={9}
              fill="var(--text-secondary)"
              textAnchor="middle"
            >
              {isBackward ? `∂=${gradValue.toFixed(3)}` : weight.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* ─── Inputs ─── */}
      {[X1, X2].map((v, j) => (
        <g key={`in-${j}`}>
          <motion.circle
            cx={inputX}
            cy={inputYs[j]}
            r={22}
            fill="var(--accent-light)"
            stroke={direction === "forward" ? forwardColor : neutral}
            strokeWidth={2}
            animate={
              direction === "forward"
                ? { scale: [1, 1.12, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.45, delay: j * 0.05 }}
          />
          <text
            x={inputX}
            y={inputYs[j] + 4}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-primary)"
            fontWeight={600}
          >
            {v.toFixed(2)}
          </text>
          <text
            x={inputX}
            y={inputYs[j] - 28}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-tertiary)"
          >
            x{j + 1}
          </text>
        </g>
      ))}

      {/* ─── Hidden layer ─── */}
      {[0, 1, 2].map((i) => (
        <g key={`h-${i}`}>
          <motion.circle
            cx={hiddenX}
            cy={hiddenYs[i]}
            r={22}
            fill="rgba(139,92,246,0.1)"
            stroke="#8b5cf6"
            strokeWidth={2}
            animate={
              direction === "forward"
                ? { scale: [1, 1.1, 1] }
                : direction === "backward"
                  ? { scale: [1, 1.08, 1] }
                  : { scale: 1 }
            }
            transition={{
              duration: 0.5,
              delay: direction === "forward" ? 0.2 + i * 0.05 : 0.5 + i * 0.05,
            }}
          />
          <text
            x={hiddenX}
            y={hiddenYs[i] + 4}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-primary)"
            fontWeight={600}
          >
            {fp.h[i].toFixed(3)}
          </text>
          <text
            x={hiddenX}
            y={hiddenYs[i] - 28}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-tertiary)"
          >
            h{i + 1}
          </text>
        </g>
      ))}

      {/* ─── Output ─── */}
      <motion.circle
        key={`out-${tick}`}
        cx={outputX}
        cy={outputY}
        r={26}
        fill={fp.loss < 0.005 ? "rgba(16,185,129,0.15)" : "rgba(220,38,38,0.1)"}
        stroke={fp.loss < 0.005 ? "#10b981" : "#dc2626"}
        strokeWidth={2.5}
        animate={{
          scale: direction === "forward" ? [1, 1.15, 1] : direction === "backward" ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.6, delay: direction === "forward" ? 0.4 : 0 }}
      />
      <text
        x={outputX}
        y={outputY + 4}
        textAnchor="middle"
        fontSize={11}
        fill="var(--text-primary)"
        fontWeight={700}
      >
        {fp.out.toFixed(3)}
      </text>
      <text
        x={outputX}
        y={outputY - 32}
        textAnchor="middle"
        fontSize={10}
        fill="var(--text-tertiary)"
      >
        ŷ
      </text>

      {/* ─── Target marker ─── */}
      <text
        x={outputX + 40}
        y={outputY + 4}
        fontSize={10}
        fill="var(--text-tertiary)"
      >
        mục tiêu {TARGET.toFixed(2)}
      </text>

      {/* ─── Loss pill ─── */}
      <rect
        x={outputX - 28}
        y={outputY + 40}
        width={56}
        height={20}
        rx={10}
        fill={fp.loss < 0.005 ? "#10b981" : "#f59e0b"}
        opacity={0.15}
      />
      <text
        x={outputX}
        y={outputY + 54}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill={fp.loss < 0.005 ? "#10b981" : "#b45309"}
      >
        L = {fp.loss.toFixed(4)}
      </text>
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 * COMPONENT CHÍNH
 * ───────────────────────────────────────────────────────────────────────── */

export default function BackpropagationTopic() {
  // Trọng số hiện tại của mạng (có thể bị thay đổi sau mỗi lần bấm "huấn luyện 1 bước")
  const [W1, setW1] = useState<number[][]>(W1_INIT.map((r) => [...r]));
  const [W2, setW2] = useState<number[]>([...W2_INIT]);

  // Hyper-parameter: learning rate — có thể kéo slider
  const [lr, setLr] = useState(0.8);

  // Trạng thái animation forward / backward
  const [direction, setDirection] = useState<"idle" | "forward" | "backward">("idle");
  const [tick, setTick] = useState(0);

  // Số bước huấn luyện đã chạy — để hiển thị progress
  const [step, setStep] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);

  const fp = useMemo(() => forwardPass(W1, W2), [W1, W2]);
  const grad = useMemo(() => backwardPass(W1, W2, fp), [W1, W2, fp]);

  useEffect(() => {
    setLossHistory((prev) => (prev.length === 0 ? [fp.loss] : prev));
    // chỉ khởi tạo lịch sử 1 lần
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runForward = useCallback(() => {
    setDirection("forward");
    setTick((t) => t + 1);
    window.setTimeout(() => setDirection("idle"), 900);
  }, []);

  const runBackward = useCallback(() => {
    setDirection("backward");
    setTick((t) => t + 1);
    window.setTimeout(() => setDirection("idle"), 1100);
  }, []);

  const trainOneStep = useCallback(() => {
    const next = applyUpdate(W1, W2, grad, lr);
    setW1(next.W1);
    setW2(next.W2);
    setStep((s) => s + 1);
    const newFp = forwardPass(next.W1, next.W2);
    setLossHistory((prev) => [...prev.slice(-49), newFp.loss]);
  }, [W1, W2, grad, lr]);

  const resetNetwork = useCallback(() => {
    setW1(W1_INIT.map((r) => [...r]));
    setW2([...W2_INIT]);
    setStep(0);
    const initFp = forwardPass(W1_INIT, W2_INIT);
    setLossHistory([initFp.loss]);
    setDirection("idle");
  }, []);

  const runFullCycle = useCallback(() => {
    runForward();
    window.setTimeout(() => runBackward(), 1000);
    window.setTimeout(() => trainOneStep(), 2100);
  }, [runForward, runBackward, trainOneStep]);

  // Dữ liệu mini-chart loss: chuẩn hóa về 0..1 theo max
  const lossMax = Math.max(...lossHistory, 0.001);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 1: HOOK — Đặt câu hỏi gợi mở
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <div className="mb-4 flex items-center gap-3">
          <ProgressSteps
            current={1}
            total={8}
            labels={[
              "Thử đoán",
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
          question="Mạng nơ-ron vừa đưa ra dự đoán SAI. Bạn cần sửa hàng triệu trọng số để nó dự đoán đúng hơn. Cách nào khả thi nhất?"
          options={[
            "Sửa tất cả trọng số một lượng như nhau (ví dụ +0.01)",
            "Truy ngược lỗi từ đầu ra về đầu vào — trọng số nào ảnh hưởng nhiều đến lỗi thì sửa nhiều",
            "Chỉ sửa trọng số ở lớp cuối cùng vì nó gần output nhất",
            "Thử ngẫu nhiên từng trọng số và chọn bộ tốt nhất",
          ]}
          correct={1}
          explanation="Chính xác! Truy ngược lỗi từ output về input, phân bổ 'trách nhiệm' cho từng trọng số dựa trên độ ảnh hưởng của nó — đó chính là ý tưởng cốt lõi của Backpropagation. Và đáng kinh ngạc là ta tính được chính xác 'độ ảnh hưởng' đó chỉ bằng một lần duyệt ngược qua mạng, nhờ quy tắc chuỗi."
        >
          <p className="text-sm text-muted mt-4 mb-2">
            Trước khi nhìn thuật toán thực hiện điều này, hãy{" "}
            <strong className="text-foreground">tự mình</strong> thử điều chỉnh
            trọng số bằng tay để thấy nó khó đến mức nào.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 2: VISUALIZATION — Computational graph tương tác
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Đồ thị tính toán — Forward & Backward Pass
          </h3>
          <p className="text-sm text-muted mb-4">
            Mạng 2 đầu vào → 3 nơ-ron ẩn → 1 đầu ra (tổng 9 trọng số). Nhấn{" "}
            <em>Forward</em> để xem dữ liệu chảy trái → phải. Nhấn{" "}
            <em>Backward</em> để xem gradient ∂L/∂w của{" "}
            <strong>mọi trọng số</strong> được tính theo chain rule chảy phải →
            trái. Nhấn <em>Huấn luyện 1 bước</em> để cập nhật trọng số bằng
            gradient descent.
          </p>

          {/* ─── Graph ─── */}
          <div className="rounded-xl border border-border bg-card/50 p-3 mb-4">
            <NetworkGraph
              W1={W1}
              W2={W2}
              fp={fp}
              grad={grad}
              direction={direction}
              tick={tick}
            />
          </div>

          {/* ─── Control panel ─── */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <button
              type="button"
              onClick={runForward}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              → Forward Pass
            </button>
            <button
              type="button"
              onClick={runBackward}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              ← Backward Pass
            </button>
            <button
              type="button"
              onClick={trainOneStep}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-accent text-white hover:bg-accent-dark transition-colors"
            >
              ↺ Huấn luyện 1 bước
            </button>
            <button
              type="button"
              onClick={runFullCycle}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              ▶ Chạy đủ chu trình
            </button>
            <button
              type="button"
              onClick={resetNetwork}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-border bg-card text-muted hover:text-foreground transition-colors"
            >
              ↻ Reset
            </button>
          </div>

          {/* ─── Learning rate slider ─── */}
          <div className="max-w-md mx-auto mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted w-28">
                Learning rate α
              </span>
              <input
                type="range"
                min={0.01}
                max={3}
                step={0.01}
                value={lr}
                onChange={(e) => setLr(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              />
              <span className="text-xs font-mono text-accent w-12 text-right">
                {lr.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-tertiary mt-1 text-center">
              α nhỏ → học chậm nhưng ổn định. α lớn → học nhanh nhưng có thể
              dao động hoặc phân kỳ.
            </p>
          </div>

          {/* ─── Loss history mini-chart ─── */}
          <div className="rounded-xl border border-border bg-card/50 p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                Loss qua {lossHistory.length} bước
              </span>
              <span className="text-xs font-mono text-accent">
                L = {fp.loss.toFixed(5)}
              </span>
            </div>
            <svg viewBox={`0 0 ${Math.max(lossHistory.length, 2) * 6} 60`} className="w-full h-16">
              {lossHistory.map((l, i) => {
                const barH = (l / lossMax) * 50;
                return (
                  <rect
                    key={i}
                    x={i * 6}
                    y={60 - barH}
                    width={5}
                    height={barH}
                    fill={l < 0.01 ? "#10b981" : l < 0.05 ? "#f59e0b" : "#ef4444"}
                    opacity={0.85}
                  />
                );
              })}
            </svg>
          </div>

          {/* ─── Numerical readout ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-2xl mx-auto">
            <div className="rounded-lg bg-card/50 border border-border p-2 text-center">
              <p className="text-[10px] text-muted uppercase tracking-wide">Bước</p>
              <p className="text-sm font-bold text-foreground">{step}</p>
            </div>
            <div className="rounded-lg bg-card/50 border border-border p-2 text-center">
              <p className="text-[10px] text-muted uppercase tracking-wide">ŷ</p>
              <p className="text-sm font-bold text-foreground">
                {fp.out.toFixed(3)}
              </p>
            </div>
            <div className="rounded-lg bg-card/50 border border-border p-2 text-center">
              <p className="text-[10px] text-muted uppercase tracking-wide">
                Target
              </p>
              <p className="text-sm font-bold text-foreground">
                {TARGET.toFixed(3)}
              </p>
            </div>
            <div className="rounded-lg bg-card/50 border border-border p-2 text-center">
              <p className="text-[10px] text-muted uppercase tracking-wide">Loss</p>
              <p
                className={`text-sm font-bold ${
                  fp.loss < 0.005 ? "text-green-600" : "text-amber-600"
                }`}
              >
                {fp.loss.toFixed(4)}
              </p>
            </div>
          </div>

          {/* ─── Converged banner ─── */}
          <AnimatePresence>
            {fp.loss < 0.005 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400 text-center max-w-lg mx-auto"
              >
                Mạng đã hội tụ sau <strong>{step}</strong> bước huấn luyện! Loss
                &lt; 0.005 — ŷ gần sát TARGET. Thử tăng α hoặc reset để xem quá
                trình học khác đi.
              </motion.div>
            )}
          </AnimatePresence>
        </VisualizationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 3: AHA MOMENT
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc A-ha">
        <AhaMoment>
          Thay vì mò từng trọng số, <strong>Backpropagation</strong> tính{" "}
          <em>chính xác</em> hướng và độ lớn cần sửa cho <em>MỌI</em> trọng số
          — <strong>cùng một lúc</strong>, chỉ trong một lần duyệt ngược, nhờ
          quy tắc chuỗi. Đây là bước logic tiếp theo sau{" "}
          <TopicLink slug="forward-propagation">lan truyền tiến</TopicLink> và
          là lý do vì sao ta có thể huấn luyện mạng hàng tỷ tham số ngày nay.
        </AhaMoment>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 4: ĐI SÂU — Chain rule & công thức
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={8} label="Đi sâu">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Chain rule — trái tim của backpropagation
        </h3>
        <p className="text-sm text-muted mb-4">
          Loss L phụ thuộc vào ŷ, ŷ phụ thuộc vào z_out, z_out phụ thuộc vào h,
          h phụ thuộc vào z, z phụ thuộc vào w. Đạo hàm của L theo w là tích
          các đạo hàm trung gian:
        </p>

        <LaTeX block>
          {
            "\\frac{\\partial L}{\\partial w} \\;=\\; \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial z_{\\text{out}}} \\cdot \\frac{\\partial z_{\\text{out}}}{\\partial h} \\cdot \\frac{\\partial h}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}"
          }
        </LaTeX>

        <Callout variant="insight" title="Mỗi lớp thêm một thừa số">
          Mạng sâu hơn = chuỗi dài hơn = tích nhiều thừa số hơn. Nếu mỗi thừa
          số &lt; 1 → tích tiến về 0 (<em>vanishing</em>). Nếu mỗi thừa số &gt;
          1 → tích nổ tung (<em>exploding</em>). Đây là lý do ReLU, BatchNorm
          và ResNet được phát minh.
        </Callout>

        <CollapsibleDetail title="Tính từng ∂ cho mạng 2-3-1 (xem chi tiết từng bước)">
          <div className="space-y-3 text-sm text-muted">
            <p>
              <strong>Bước 1 — Đạo hàm loss theo output:</strong> L =
              ½(y − ŷ)² nên dL/dŷ = −(y − ŷ). Với y = 0.8 và ŷ hiện tại ={" "}
              {fp.out.toFixed(4)}, ta được dL/dŷ ={" "}
              <span className="font-mono text-accent">
                {grad.dL_dOut.toFixed(4)}
              </span>
              .
            </p>
            <p>
              <strong>Bước 2 — Qua sigmoid output:</strong> dŷ/dz_out = ŷ(1 −
              ŷ) ={" "}
              <span className="font-mono text-accent">
                {(fp.out * (1 - fp.out)).toFixed(4)}
              </span>
              . Do đó dL/dz_out ={" "}
              <span className="font-mono text-accent">
                {grad.dL_dZout.toFixed(4)}
              </span>
              .
            </p>
            <p>
              <strong>Bước 3 — Với mỗi W2ᵢ:</strong> ∂L/∂W2ᵢ = dL/dz_out · hᵢ.
              Ví dụ với h₁ = {fp.h[0].toFixed(3)} → ∂L/∂W2₁ ={" "}
              <span className="font-mono text-accent">
                {grad.dL_dW2[0].toFixed(4)}
              </span>
              .
            </p>
            <p>
              <strong>Bước 4 — Truyền ngược qua hidden:</strong> dL/dhᵢ =
              dL/dz_out · W2ᵢ. Sau đó qua sigmoid ẩn: ×hᵢ(1−hᵢ). Cuối cùng
              nhân với xⱼ để ra ∂L/∂W1ᵢⱼ.
            </p>
            <p className="text-tertiary text-xs">
              Mỗi gradient hiển thị ngay trong đồ thị trên khi bạn bấm Backward.
            </p>
          </div>
        </CollapsibleDetail>

        <div className="h-4" />

        <CollapsibleDetail title="Vì sao ta có thể vector hóa toàn bộ tính toán này">
          <div className="space-y-3 text-sm text-muted">
            <p>
              Viết dạng ma trận: H = σ(W₁ x), ŷ = σ(W₂ H). Khi đó:
            </p>
            <LaTeX block>
              {
                "\\frac{\\partial L}{\\partial W_2} = \\delta_{\\text{out}} \\cdot H^{\\top}, \\quad \\frac{\\partial L}{\\partial W_1} = \\delta_{\\text{hid}} \\cdot x^{\\top}"
              }
            </LaTeX>
            <p>
              với{" "}
              <LaTeX>
                {"\\delta_{\\text{out}} = (\\hat{y} - y) \\cdot \\hat{y}(1-\\hat{y})"}
              </LaTeX>{" "}
              và{" "}
              <LaTeX>
                {
                  "\\delta_{\\text{hid}} = (W_2^{\\top} \\delta_{\\text{out}}) \\odot H (1 - H)"
                }
              </LaTeX>
              .
            </p>
            <p>
              Dạng ma trận này chạy được trên GPU với tensor cores — và đó là
              lý do thực tế vì sao backprop + GPU = kỷ nguyên deep learning.
              Hàng tỷ phép nhân ma trận được gom thành vài GEMM (GEneral Matrix
              Multiply) gọi xuống cuBLAS.
            </p>
          </div>
        </CollapsibleDetail>

        <div className="h-4" />

        <Callout variant="tip" title="Nhớ quy tắc nhỏ khi viết backprop bằng tay">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Đầu ra của forward pass (z, h, ŷ) <strong>phải được lưu lại</strong>
              — backward sẽ cần dùng để tính đạo hàm sigmoid.
            </li>
            <li>
              Đạo hàm sigmoid đẹp ở chỗ chỉ cần giá trị activation: σ′(z) = σ(z)(1
              − σ(z)).
            </li>
            <li>
              Với ReLU: σ′(z) = 1 nếu z &gt; 0, ngược lại = 0 — rất rẻ tính.
            </li>
          </ul>
        </Callout>

        <div className="h-4" />

        <Callout variant="warning" title="Cẩn trọng khi tính gradient bằng tay">
          Một sai số dấu (+/−) hay một thừa số bị quên rất dễ làm sai cả
          pipeline mà không phát hiện được. Luôn{" "}
          <strong>kiểm tra gradient</strong> bằng finite differences:{" "}
          <LaTeX>
            {"\\frac{L(w+\\epsilon) - L(w-\\epsilon)}{2\\epsilon}"}
          </LaTeX>{" "}
          với ε = 1e-5, so sánh với gradient tính bằng backprop. Hai giá trị
          phải khớp đến 5-6 chữ số.
        </Callout>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 5: THỬ THÁCH — 2 InlineChallenge
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <div className="space-y-5">
          <InlineChallenge
            question="Bạn đang huấn luyện mạng 100 lớp, mỗi lớp dùng sigmoid. Đạo hàm sigmoid max = 0.25. Gradient ở lớp đầu tiên sẽ như thế nào?"
            options={[
              "Tăng rất lớn, bùng nổ",
              "Gần như bằng 0, không cập nhật được",
              "Luôn xấp xỉ 1, ổn định",
              "Phụ thuộc vào learning rate",
            ]}
            correct={1}
            explanation="0.25^100 ≈ 6.2e-61 — gradient biến mất gần như hoàn toàn ở lớp đầu. Đây là lý do sigmoid không còn được dùng ở lớp ẩn trong mạng sâu. Giải pháp: dùng ReLU (đạo hàm = 1 khi > 0), hoặc kiến trúc ResNet (skip connection giữ gradient không bị nhân nhiều lần)."
          />

          <InlineChallenge
            question="Đạo hàm ∂L/∂W2₁ = 0.12 với learning rate α = 0.5. Trọng số W2₁ hiện tại = 0.80. Sau cập nhật, W2₁ mới bằng bao nhiêu?"
            options={[
              "0.80 + 0.5 × 0.12 = 0.86",
              "0.80 − 0.5 × 0.12 = 0.74",
              "0.80 × 0.5 − 0.12 = 0.28",
              "0.12 / 0.5 = 0.24",
            ]}
            correct={1}
            explanation="Công thức: w_new = w_old − α · ∂L/∂w = 0.80 − 0.5 × 0.12 = 0.74. Dấu TRỪ rất quan trọng: ta muốn loss GIẢM nên phải đi ngược hướng gradient (hướng gradient là hướng loss TĂNG)."
          />
        </div>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 6: GIẢI THÍCH + CODE
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <h3 className="text-lg font-semibold text-foreground">
            Lịch sử ngắn gọn
          </h3>
          <p>
            Ý tưởng backpropagation có nguồn gốc từ công trình của{" "}
            <strong>Seppo Linnainmaa</strong> (1970) về vi phân tự động theo
            kiểu ngược (reverse-mode automatic differentiation), và{" "}
            <strong>Paul Werbos</strong> (1974) áp dụng cho mạng nơ-ron trong
            luận án tiến sĩ. Tuy nhiên phải đến bài báo{" "}
            <em>"Learning representations by back-propagating errors"</em> của{" "}
            <strong>Rumelhart, Hinton & Williams (1986)</strong> thì cộng đồng
            mới nhìn ra sức mạnh của thuật toán này cho mạng đa tầng. Gần 40
            năm sau, mọi framework deep learning (PyTorch, TensorFlow, JAX)
            đều xây dựng quanh nó.
          </p>

          <Callout variant="insight" title="Tại sao gọi là 'lan truyền ngược'?">
            Vì lỗi (loss) được tính ở đầu ra, rồi <em>lan truyền ngược</em> về
            từng lớp trước đó để phân bổ trách nhiệm cho mỗi trọng số. Giống
            như một chuỗi domino — nhưng đổ từ cuối về đầu, chứ không phải từ
            đầu về cuối. Mỗi lớp "thì thầm" với lớp trước: "bạn đóng góp chừng
            này lỗi cho tôi".
          </Callout>

          <h3 className="text-lg font-semibold text-foreground">
            Công thức cập nhật trọng số
          </h3>
          <p>
            Backprop chỉ trả ra gradient. Để thực sự{" "}
            <em>điều chỉnh</em> trọng số, ta cần kết hợp với thuật toán tối ưu
            hóa — phổ biến nhất là{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink>:
          </p>
          <LaTeX block>
            {"w \\leftarrow w - \\alpha \\cdot \\frac{\\partial L}{\\partial w}"}
          </LaTeX>
          <p>
            Trong đó <LaTeX>{"\\alpha"}</LaTeX> là{" "}
            <strong>learning rate</strong> (tốc độ học) và{" "}
            <LaTeX>{"\\frac{\\partial L}{\\partial w}"}</LaTeX> là gradient —
            đạo hàm riêng của{" "}
            <TopicLink slug="loss-functions">hàm mất mát</TopicLink> theo trọng
            số đó. Kết hợp với kỹ thuật{" "}
            <TopicLink slug="calculus-for-backprop">vi tích phân</TopicLink>,
            chain rule giúp tính gradient qua hàng trăm lớp một cách hiệu quả.
          </p>

          <Callout variant="tip" title="Quy tắc chuỗi — trái tim của backprop">
            Chain rule cho phép tính đạo hàm qua nhiều lớp bằng cách nhân
            chuỗi:
            <LaTeX block>
              {
                "\\frac{\\partial L}{\\partial w_1} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial h} \\cdot \\frac{\\partial h}{\\partial w_1}"
              }
            </LaTeX>
            Mỗi lớp đóng góp một thừa số. Không cần tính lại từ đầu — chỉ nhân
            thêm!
          </Callout>

          <h3 className="text-lg font-semibold text-foreground">
            Cài đặt bằng tay (NumPy)
          </h3>
          <p>
            Đây là toàn bộ backprop cho mạng 2-3-1 của chúng ta, viết bằng
            NumPy thuần — không dùng framework nào. Bạn sẽ thấy nó ngắn đến
            không tưởng.
          </p>

          <CodeBlock language="python" title="manual_backprop.py">{`import numpy as np

# ─── Forward pass ─────────────────────────────────────────
def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))

# Dữ liệu & mục tiêu
x = np.array([0.6, 0.9])
y = 0.8

# Trọng số khởi tạo (tương ứng mạng 2-3-1 trong bài)
W1 = np.array([[0.15, -0.20],
               [0.25,  0.30],
               [-0.10, 0.40]])    # (3, 2)
W2 = np.array([0.35, -0.30, 0.50])  # (3,)

# Forward
z1 = W1 @ x                 # (3,)
h  = sigmoid(z1)            # (3,)
z2 = W2 @ h                 # scalar
y_hat = sigmoid(z2)
loss = 0.5 * (y - y_hat) ** 2
print(f"ŷ = {y_hat:.4f}, loss = {loss:.5f}")

# ─── Backward pass (chain rule bằng tay) ──────────────────
dL_dy      = -(y - y_hat)                 # ∂L/∂ŷ
dy_dz2     = y_hat * (1 - y_hat)          # σ'(z2)
dL_dz2     = dL_dy * dy_dz2               # scalar

dL_dW2     = dL_dz2 * h                   # (3,)
dL_dh      = dL_dz2 * W2                  # (3,)

dh_dz1     = h * (1 - h)                  # σ'(z1), (3,)
dL_dz1     = dL_dh * dh_dz1               # (3,)
dL_dW1     = np.outer(dL_dz1, x)          # (3, 2)

# ─── Gradient descent update ──────────────────────────────
lr = 0.8
W1 -= lr * dL_dW1
W2 -= lr * dL_dW2

# Forward lại để xem loss đã giảm
h  = sigmoid(W1 @ x)
y_hat = sigmoid(W2 @ h)
new_loss = 0.5 * (y - y_hat) ** 2
print(f"Sau 1 bước: ŷ = {y_hat:.4f}, loss = {new_loss:.5f}")`}</CodeBlock>

          <p>
            Chạy script trên, bạn sẽ thấy loss giảm sau đúng 1 bước cập nhật.
            Chạy 50 bước trong vòng lặp, loss về gần 0. Đây chính xác là điều
            đang diễn ra trong đồ thị ở trên.
          </p>

          <Callout variant="info" title="Framework tự động làm điều này cho bạn">
            Trong PyTorch/TensorFlow/JAX, bạn chỉ cần viết forward pass. Thư
            viện sẽ xây dựng <em>computational graph</em> và tự động chạy
            backward:
          </Callout>

          <CodeBlock language="python" title="pytorch_backprop.py">{`import torch
import torch.nn as nn
import torch.optim as optim

# Mạng 2-3-1
model = nn.Sequential(
    nn.Linear(2, 3),
    nn.Sigmoid(),
    nn.Linear(3, 1),
    nn.Sigmoid(),
)

x = torch.tensor([0.6, 0.9])
y = torch.tensor([0.8])

# Loss & optimizer
loss_fn = nn.MSELoss()
optimizer = optim.SGD(model.parameters(), lr=0.8)

# Vòng lặp huấn luyện
for step in range(50):
    # Forward
    y_hat = model(x)
    loss = loss_fn(y_hat, y)

    # Backward — TỰ ĐỘNG tính gradient cho MỌI tham số
    optimizer.zero_grad()    # xóa gradient cũ
    loss.backward()          # ← đây là backprop
    optimizer.step()         # w <- w - lr * grad

    if step % 10 == 0:
        print(f"Step {step:3d} | loss = {loss.item():.5f}")

# Xem gradient của từng weight sau backward()
for name, param in model.named_parameters():
    print(f"{name}: shape={tuple(param.shape)}, "
          f"last grad norm={param.grad.norm().item():.4f}")`}</CodeBlock>

          <p>
            Điểm khác biệt: với PyTorch, bạn không cần viết công thức đạo hàm
            cho sigmoid, linear layer, MSE,... Thư viện đã biết cách lấy đạo
            hàm mọi phép tính cơ bản, và tự xâu chuỗi chúng lại. Đây gọi là{" "}
            <em>autograd</em> (automatic differentiation). Nhưng bản chất nó
            đang làm <strong>chính xác</strong> những gì bạn vừa viết bằng tay
            ở NumPy ở trên.
          </p>

          <Callout variant="warning" title="Vanishing & Exploding Gradient">
            Khi mạng quá sâu, gradient có thể biến mất (nhân nhiều số nhỏ) hoặc
            bùng nổ (nhân nhiều số lớn) — xem chi tiết tại{" "}
            <TopicLink slug="vanishing-exploding-gradients">
              Vanishing & Exploding Gradients
            </TopicLink>
            . Giải pháp: dùng ReLU thay sigmoid, Batch Normalization,
            Residual Connections (ResNet), hoặc LSTM cho chuỗi thời gian.
          </Callout>

          <h3 className="text-lg font-semibold text-foreground">
            Vì sao backprop là một cuộc cách mạng
          </h3>
          <p>
            Trước backprop, huấn luyện mạng đa tầng gần như bất khả thi — ta
            chỉ biết điều chỉnh trọng số ở lớp cuối (perceptron 1 lớp).
            Backprop mở khóa kiến trúc đa tầng và, khi kết hợp với GPU &
            lượng dữ liệu khổng lồ, dẫn trực tiếp đến{" "}
            <TopicLink slug="transformer">Transformer</TopicLink>,{" "}
            <TopicLink slug="cnn">CNN</TopicLink>,
            và cuối cùng là các mô hình ngôn ngữ lớn ngày nay.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 7: TÓM TẮT — 6 điểm
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={8} label="Tổng kết">
        <MiniSummary
          title="Ghi nhớ về Backpropagation"
          points={[
            "Backpropagation tính CHÍNH XÁC gradient (hướng + độ lớn) cho MỌI trọng số chỉ trong 1 lần duyệt ngược qua mạng.",
            "Công cụ toán học nền tảng là QUY TẮC CHUỖI (chain rule) — đạo hàm của hàm hợp = tích các đạo hàm trung gian.",
            "Forward pass lưu các activation (h, ŷ); backward pass dùng chúng để tính gradient qua sigmoid/ReLU.",
            "Cập nhật trọng số: w ← w − α · ∂L/∂w. Dấu TRỪ vì gradient chỉ hướng TĂNG của loss — ta muốn đi hướng ngược lại.",
            "Vanishing/Exploding gradient là thách thức chính ở mạng sâu — giải pháp: ReLU, BatchNorm, ResNet, LayerNorm, Gradient Clipping.",
            "Framework (PyTorch, TF, JAX) tự động làm backprop qua autograd, nhưng bản chất vẫn là chain rule đang chạy dưới mui xe.",
          ]}
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 8: QUIZ
          ══════════════════════════════════════════════════════════════════ */}
      <QuizSection questions={quizQuestions} />
    </>
  );
}
