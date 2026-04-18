"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  TopicLink,
  CollapsibleDetail,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ======================================================================== */
/*  METADATA                                                                 */
/* ======================================================================== */
export const metadata: TopicMeta = {
  slug: "forward-propagation",
  title: "Forward Propagation",
  titleVi: "Lan truyền tiến",
  description:
    "Quá trình dữ liệu đi từ đầu vào qua các lớp để tạo ra dự đoán đầu ra.",
  category: "neural-fundamentals",
  tags: ["neural-network", "training", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: [
    "mlp",
    "backpropagation",
    "activation-functions",
    "loss-functions",
  ],
  vizType: "interactive",
};

/* ======================================================================== */
/*  MATH HELPERS                                                             */
/* ======================================================================== */
function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}
function relu(x: number) {
  return Math.max(0, x);
}
function tanh(x: number) {
  return Math.tanh(x);
}
function leakyRelu(x: number, alpha = 0.01) {
  return x >= 0 ? x : alpha * x;
}

/* Activation registry for the "activation hook points" feature */
type ActivationName = "relu" | "sigmoid" | "tanh" | "leakyRelu";
const ACTIVATIONS: Record<
  ActivationName,
  { fn: (x: number) => number; label: string; formula: string }
> = {
  relu: { fn: relu, label: "ReLU", formula: "max(0, z)" },
  sigmoid: { fn: sigmoid, label: "Sigmoid", formula: "1 / (1 + e^{-z})" },
  tanh: { fn: tanh, label: "Tanh", formula: "tanh(z)" },
  leakyRelu: { fn: (x) => leakyRelu(x), label: "Leaky ReLU", formula: "max(0.01z, z)" },
};

/* ======================================================================== */
/*  CORE NETWORK (original 2-2-1 diagram — PRESERVED)                        */
/* ======================================================================== */
const W1 = [
  [0.3, 0.7],
  [0.5, -0.4],
]; // 2x2
const B1 = [0.1, -0.2];
const W2 = [0.6, -0.3];
const B2 = 0.15;

interface ForwardState {
  x: [number, number];
  z1: [number, number];
  a1: [number, number];
  z2: number;
  a2: number;
}

function forwardPass(
  x1: number,
  x2: number,
  activation: ActivationName = "relu"
): ForwardState {
  const f = ACTIVATIONS[activation].fn;
  const x: [number, number] = [x1, x2];
  const z1: [number, number] = [
    W1[0][0] * x1 + W1[1][0] * x2 + B1[0],
    W1[0][1] * x1 + W1[1][1] * x2 + B1[1],
  ];
  const a1: [number, number] = [f(z1[0]), f(z1[1])];
  const z2 = W2[0] * a1[0] + W2[1] * a1[1] + B2;
  const a2 = sigmoid(z2);
  return { x, z1, a1, z2, a2 };
}

/* SVG geometry for the original 2-2-1 diagram */
const SVG_W = 540;
const SVG_H = 300;

const NODES = {
  x1: { x: 60, y: 100 },
  x2: { x: 60, y: 200 },
  h1: { x: 230, y: 100 },
  h2: { x: 230, y: 200 },
  out: { x: 420, y: 150 },
};

const CONNECTIONS = [
  { from: "x1", to: "h1", w: W1[0][0] },
  { from: "x1", to: "h2", w: W1[0][1] },
  { from: "x2", to: "h1", w: W1[1][0] },
  { from: "x2", to: "h2", w: W1[1][1] },
  { from: "h1", to: "out", w: W2[0] },
  { from: "h2", to: "out", w: W2[1] },
] as const;

/* ======================================================================== */
/*  MULTI-LAYER NETWORK (4-layer animation)                                  */
/* ======================================================================== */
interface LayerDef {
  label: string;
  size: number;
  activation: ActivationName | "linear";
}
const DEEP_LAYERS: LayerDef[] = [
  { label: "Input", size: 3, activation: "linear" },
  { label: "Hidden 1", size: 4, activation: "relu" },
  { label: "Hidden 2", size: 4, activation: "relu" },
  { label: "Hidden 3", size: 3, activation: "relu" },
  { label: "Output", size: 2, activation: "sigmoid" },
];

/* Pre-initialised pseudo-random weights (deterministic, derived from indices). */
function deepWeight(l: number, i: number, j: number): number {
  const raw = Math.sin(l * 91.3 + i * 12.7 + j * 5.1) * 10000;
  return (raw - Math.floor(raw)) * 2 - 1; // in [-1, 1]
}
function deepBias(l: number, j: number): number {
  const raw = Math.sin(l * 33.1 + j * 7.2) * 10000;
  return (raw - Math.floor(raw)) * 0.6 - 0.3; // in [-0.3, 0.3]
}

/* Run a full forward pass through the deep network and return every activation. */
function deepForward(input: number[]): number[][] {
  const activations: number[][] = [input.slice()];
  for (let l = 1; l < DEEP_LAYERS.length; l++) {
    const prev = activations[l - 1];
    const layer = DEEP_LAYERS[l];
    const out: number[] = [];
    for (let j = 0; j < layer.size; j++) {
      let z = deepBias(l, j);
      for (let i = 0; i < prev.length; i++) {
        z += deepWeight(l, i, j) * prev[i];
      }
      if (layer.activation === "linear") {
        out.push(z);
      } else {
        out.push(ACTIVATIONS[layer.activation as ActivationName].fn(z));
      }
    }
    activations.push(out);
  }
  return activations;
}

/* ======================================================================== */
/*  PRE-TRAINED WEIGHT COMPARISON                                            */
/* ======================================================================== */
/** "Random init" vs "Trained" — shows how W matures during training. */
const RANDOM_W = [
  [0.12, -0.85],
  [0.33, 0.47],
];
const TRAINED_W = [
  [1.92, -0.31],
  [-0.18, 2.05],
];
const RANDOM_B = [0.01, -0.02];
const TRAINED_B = [0.43, -0.67];

function miniForward(
  x: [number, number],
  W: number[][],
  b: number[]
): { z: number[]; a: number[] } {
  const z = [W[0][0] * x[0] + W[1][0] * x[1] + b[0], W[0][1] * x[0] + W[1][1] * x[1] + b[1]];
  const a = z.map(relu);
  return { z, a };
}

/* ======================================================================== */
/*  MAIN COMPONENT                                                           */
/* ======================================================================== */
export default function ForwardPropagationTopic() {
  /* ----- ORIGINAL 2-2-1 INTERACTIVE STATE (PRESERVED) ----- */
  const [x1, setX1] = useState(0.5);
  const [x2, setX2] = useState(0.8);
  const [step, setStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activation, setActivation] = useState<ActivationName>("relu");

  const state = useMemo(
    () => forwardPass(x1, x2, activation),
    [x1, x2, activation]
  );

  const stepLabels = [
    "Đầu vào",
    `Nhân trọng số + bias → z`,
    `Hàm kích hoạt ${ACTIVATIONS[activation].label} → a`,
    "Nhân trọng số + bias → z₂",
    "Sigmoid → đầu ra",
  ];

  const stepDetails = useMemo(
    () => [
      `x = [${x1.toFixed(2)}, ${x2.toFixed(2)}]`,
      `z₁ = ${W1[0][0]}×${x1.toFixed(2)} + ${W1[1][0]}×${x2.toFixed(2)} + ${B1[0]} = ${state.z1[0].toFixed(3)}  |  z₂ = ${W1[0][1]}×${x1.toFixed(2)} + ${W1[1][1]}×${x2.toFixed(2)} + (${B1[1]}) = ${state.z1[1].toFixed(3)}`,
      `a₁ = ${ACTIVATIONS[activation].label}(${state.z1[0].toFixed(3)}) = ${state.a1[0].toFixed(3)}  |  a₂ = ${ACTIVATIONS[activation].label}(${state.z1[1].toFixed(3)}) = ${state.a1[1].toFixed(3)}`,
      `z = ${W2[0]}×${state.a1[0].toFixed(3)} + (${W2[1]})×${state.a1[1].toFixed(3)} + ${B2} = ${state.z2.toFixed(3)}`,
      `ŷ = sigmoid(${state.z2.toFixed(3)}) = ${state.a2.toFixed(4)}`,
    ],
    [x1, x2, state, activation]
  );

  const runAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setStep(0);
    let s = 0;
    const interval = setInterval(() => {
      s++;
      if (s >= 5) {
        clearInterval(interval);
        setIsAnimating(false);
        return;
      }
      setStep(s);
    }, 1200);
  }, [isAnimating]);

  const reset = useCallback(() => {
    setStep(-1);
    setIsAnimating(false);
  }, []);

  /* ----- MATRIX VISUALIZATION STATE ----- */
  const [matrixStep, setMatrixStep] = useState(0);
  const matrixStepTotal = 6;

  /* ----- MULTI-LAYER ANIMATION STATE ----- */
  const [deepInput, setDeepInput] = useState<number[]>([0.6, -0.4, 0.9]);
  const [deepLayer, setDeepLayer] = useState(0); // active layer index
  const [deepPlaying, setDeepPlaying] = useState(false);

  const deepActivations = useMemo(() => deepForward(deepInput), [deepInput]);

  useEffect(() => {
    if (!deepPlaying) return;
    if (deepLayer >= DEEP_LAYERS.length - 1) {
      setDeepPlaying(false);
      return;
    }
    const t = setTimeout(() => setDeepLayer((l) => l + 1), 900);
    return () => clearTimeout(t);
  }, [deepPlaying, deepLayer]);

  const resetDeep = useCallback(() => {
    setDeepLayer(0);
    setDeepPlaying(false);
  }, []);

  /* ----- PRE-TRAINED COMPARISON STATE ----- */
  const [cmpX, setCmpX] = useState<[number, number]>([0.8, 0.2]);
  const randomOut = useMemo(() => miniForward(cmpX, RANDOM_W, RANDOM_B), [cmpX]);
  const trainedOut = useMemo(() => miniForward(cmpX, TRAINED_W, TRAINED_B), [cmpX]);

  /* ----- QUIZ ----- */
  const quizQuestions: QuizQuestion[] = [
    {
      question:
        "Trong forward propagation, phép tính nào xảy ra ĐẦU TIÊN tại mỗi nơ-ron?",
      options: [
        "Áp dụng hàm kích hoạt",
        "Tính tổ hợp tuyến tính: z = W·x + b",
        "Tính gradient",
        "So sánh với nhãn thực tế",
      ],
      correct: 1,
      explanation:
        "Mỗi nơ-ron luôn tính z = W·x + b trước, rồi mới áp dụng hàm kích hoạt a = f(z). Gradient chỉ tính trong backpropagation.",
    },
    {
      question: "Forward propagation có cần tính gradient không?",
      options: [
        "Có — gradient cần cho mọi phép tính",
        "Không — forward pass chỉ tính đầu ra, gradient tính ở backpropagation",
        "Chỉ khi huấn luyện",
        "Chỉ ở lớp đầu ra",
      ],
      correct: 1,
      explanation:
        "Forward pass chỉ lan truyền dữ liệu từ trái sang phải. Gradient tính ở bước riêng (backpropagation). Khi inference, hoàn toàn không cần gradient → nhanh hơn.",
    },
    {
      question:
        "Nếu đầu ra sigmoid = 0.82, điều này nghĩa là gì trong phân loại nhị phân?",
      options: [
        "Mô hình chắc chắn 82% rằng mẫu thuộc lớp dương",
        "Loss = 0.82",
        "Mô hình cần huấn luyện thêm 82 epoch",
        "Trọng số trung bình = 0.82",
      ],
      correct: 0,
      explanation:
        "Sigmoid nén đầu ra về (0,1), biểu diễn xác suất. Giá trị 0.82 nghĩa là mô hình dự đoán 82% khả năng mẫu thuộc lớp dương (positive class).",
    },
    {
      type: "fill-blank",
      question:
        "Trong forward propagation, tại mỗi lớp có hai bước: đầu tiên tính z = W·a + b (biến đổi tuyến tính), sau đó tính a = {blank}(z) để thêm tính phi tuyến.",
      blanks: [
        {
          answer: "f",
          accept: ["activation", "hàm kích hoạt", "relu", "sigmoid"],
        },
      ],
      explanation:
        "Hàm kích hoạt f(z) là bước thứ hai tại mỗi lớp, biến đổi tổng có trọng số z thành giá trị kích hoạt a. Không có bước này, toàn bộ mạng dù nhiều lớp cũng chỉ là một phép biến đổi tuyến tính.",
    },
    {
      question:
        "Khi thực hiện forward pass trên batch 32 mẫu với mạng 3 lớp, ma trận trọng số W của mỗi lớp có thay đổi giữa các mẫu không?",
      options: [
        "Có — mỗi mẫu có bộ trọng số riêng",
        "Không — W dùng chung cho cả batch, chỉ đầu vào x khác nhau",
        "Thay đổi nếu dùng ReLU, không thay đổi nếu dùng sigmoid",
        "Thay đổi theo thứ tự mẫu trong batch",
      ],
      correct: 1,
      explanation:
        "Trọng số W và bias b được chia sẻ cho mọi mẫu trong batch — đây chính là lý do có thể xếp các mẫu thành ma trận X ∈ ℝ^(32×d) và tính Z = X·W + b cùng lúc (vectorization). Mỗi hàng của Z là kết quả cho một mẫu.",
    },
    {
      question:
        "Mạng có 5 lớp, bạn bỏ TOÀN BỘ hàm kích hoạt (giữ lại phép nhân ma trận). Mạng tương đương với gì?",
      options: [
        "Một mạng 5 lớp mạnh hơn",
        "Một hàm phi tuyến phức tạp",
        "Một phép biến đổi tuyến tính duy nhất (tương đương 1 lớp)",
        "Mạng không thể chạy",
      ],
      correct: 2,
      explanation:
        "Nhân nhiều ma trận tuyến tính lại với nhau vẫn cho ra một ma trận tuyến tính: W₅·W₄·W₃·W₂·W₁ = W_tổng. Không có hàm kích hoạt phi tuyến thì độ sâu mất tác dụng — đó là lý do ReLU/sigmoid tồn tại.",
    },
    {
      question:
        "Trong inference (suy luận) với PyTorch, tại sao nên bọc forward pass trong torch.no_grad()?",
      options: [
        "Để mô hình chính xác hơn",
        "Để tránh lưu computation graph phục vụ gradient — tiết kiệm bộ nhớ và tăng tốc",
        "Để đổi hàm kích hoạt",
        "Để batch nhỏ hơn",
      ],
      correct: 1,
      explanation:
        "Mặc định PyTorch lưu computation graph (các tensor trung gian) để phục vụ backprop. Khi inference không cần backprop, no_grad() bỏ qua việc lưu này — thường tiết kiệm 30-50% bộ nhớ và tăng tốc 2-3 lần.",
    },
    {
      type: "fill-blank",
      question:
        "Với trọng số đã huấn luyện, đầu vào x đi qua mạng theo chiều từ trái sang phải — quá trình này gọi là {blank} propagation, còn ngược lại (tính gradient) gọi là {blank}.",
      blanks: [
        { answer: "forward", accept: ["Forward", "lan truyền tiến"] },
        { answer: "backpropagation", accept: ["backward", "lan truyền ngược"] },
      ],
      explanation:
        "Forward đi tới (xuôi), backward đi lui (ngược) — hai nửa của một vòng huấn luyện.",
    },
  ];

  /* --------------------------------------------------------------------- */
  /*  HELPERS FOR ORIGINAL DIAGRAM COLORS                                   */
  /* --------------------------------------------------------------------- */
  function nodeColor(nodeType: string): string {
    if (step < 0) return "#1e293b";
    if (nodeType === "input") return step >= 0 ? "#3b82f6" : "#1e293b";
    if (nodeType === "hidden") return step >= 2 ? "#8b5cf6" : "#1e293b";
    if (nodeType === "output") return step >= 4 ? "#22c55e" : "#1e293b";
    return "#1e293b";
  }

  function nodeValue(name: string): string {
    if (step < 0) return name;
    switch (name) {
      case "x1":
        return step >= 0 ? x1.toFixed(2) : "x₁";
      case "x2":
        return step >= 0 ? x2.toFixed(2) : "x₂";
      case "h1":
        return step >= 2
          ? state.a1[0].toFixed(2)
          : step >= 1
            ? state.z1[0].toFixed(2)
            : "h₁";
      case "h2":
        return step >= 2
          ? state.a1[1].toFixed(2)
          : step >= 1
            ? state.z1[1].toFixed(2)
            : "h₂";
      case "out":
        return step >= 4
          ? state.a2.toFixed(3)
          : step >= 3
            ? state.z2.toFixed(2)
            : "ŷ";
      default:
        return name;
    }
  }

  function isConnectionActive(from: string, to: string): boolean {
    if (from.startsWith("x") && to.startsWith("h")) return step >= 1;
    if (from.startsWith("h") && to === "out") return step >= 3;
    return false;
  }

  /* --------------------------------------------------------------------- */
  /*  RENDER                                                                */
  /* --------------------------------------------------------------------- */
  return (
    <>
      {/* =============== STEP 1: PREDICTION GATE =============== */}
      <LessonSection step={1} totalSteps={9} label="Dự đoán">
        <PredictionGate
          question="Khi bạn gửi ảnh cho ChatGPT và nó nhận ra đó là con mèo, quá trình tính toán đi theo hướng nào trong mạng?"
          options={[
            "Từ đầu ra ngược về đầu vào",
            "Chỉ tính ở lớp đầu ra",
            "Một chiều từ đầu vào đến đầu ra, lớp này nối tiếp lớp kia",
            "Ngẫu nhiên giữa các lớp",
          ]}
          correct={2}
          explanation="Dữ liệu luôn đi một chiều từ trái sang phải qua từng lớp — đó là Forward Propagation! Giống xe máy đi trên đường một chiều, không quay lại."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Hãy tự tay truyền dữ liệu qua mạng và theo dõi từng phép tính. Thay
            đổi đầu vào rồi nhấn{" "}
            <strong className="text-foreground">Lan truyền</strong> để xem con
            số biến đổi qua từng lớp.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* =============== STEP 2: INTERACTIVE FORWARD PASS (PRESERVED) =============== */}
      <LessonSection step={2} totalSteps={9} label="Khám phá">
        <div className="mb-4 flex justify-center">
          <ProgressSteps
            current={Math.max(1, step + 1)}
            total={5}
            labels={stepLabels}
          />
        </div>

        <VisualizationSection>
          <div className="space-y-4">
            {/* Input sliders */}
            <div className="flex flex-wrap gap-6 justify-center">
              <div className="space-y-1">
                <label className="text-xs text-muted">
                  x₁ ={" "}
                  <strong className="text-foreground">{x1.toFixed(2)}</strong>
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.05"
                  value={x1}
                  onChange={(e) => {
                    setX1(parseFloat(e.target.value));
                    reset();
                  }}
                  className="w-36 accent-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">
                  x₂ ={" "}
                  <strong className="text-foreground">{x2.toFixed(2)}</strong>
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.05"
                  value={x2}
                  onChange={(e) => {
                    setX2(parseFloat(e.target.value));
                    reset();
                  }}
                  className="w-36 accent-accent"
                />
              </div>
            </div>

            {/* Activation hook selector */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-xs text-muted">Hàm kích hoạt lớp ẩn:</span>
              {(Object.keys(ACTIVATIONS) as ActivationName[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setActivation(key);
                    reset();
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    activation === key
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-card text-muted hover:text-foreground"
                  }`}
                >
                  {ACTIVATIONS[key].label}
                </button>
              ))}
            </div>

            {/* Network diagram (PRESERVED) */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-2xl mx-auto"
            >
              <text
                x={60}
                y={40}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
                fontWeight="600"
              >
                Đầu vào
              </text>
              <text
                x={230}
                y={40}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
                fontWeight="600"
              >
                Lớp ẩn
              </text>
              <text
                x={420}
                y={40}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
                fontWeight="600"
              >
                Đầu ra
              </text>

              {CONNECTIONS.map((conn, i) => {
                const from = NODES[conn.from as keyof typeof NODES];
                const to = NODES[conn.to as keyof typeof NODES];
                const active = isConnectionActive(conn.from, conn.to);
                const color = active ? (conn.w >= 0 ? "#3b82f6" : "#ef4444") : "#334155";
                return (
                  <g key={`conn-${i}`}>
                    <motion.line
                      x1={from.x + 20} y1={from.y} x2={to.x - 20} y2={to.y}
                      stroke={color}
                      strokeWidth={active ? Math.abs(conn.w) * 4 + 1 : 1}
                      opacity={active ? 0.7 : 0.2}
                      initial={false}
                      animate={{ stroke: color, opacity: active ? 0.7 : 0.2 }}
                      transition={{ duration: 0.3 }}
                    />
                    {active && (
                      <text
                        x={(from.x + to.x) / 2 + (from.y === to.y ? 0 : from.y < to.y ? 12 : -12)}
                        y={(from.y + to.y) / 2 + (from.y === to.y ? -8 : 0)}
                        textAnchor="middle" fill="#64748b" fontSize="8"
                      >
                        {conn.w > 0 ? "+" : ""}{conn.w}
                      </text>
                    )}
                  </g>
                );
              })}

              {(
                [
                  { name: "x1", pos: NODES.x1, type: "input" },
                  { name: "x2", pos: NODES.x2, type: "input" },
                  { name: "h1", pos: NODES.h1, type: "hidden" },
                  { name: "h2", pos: NODES.h2, type: "hidden" },
                  { name: "out", pos: NODES.out, type: "output" },
                ] as const
              ).map(({ name, pos, type }) => (
                <g key={name}>
                  <motion.circle
                    cx={pos.x} cy={pos.y} r={18}
                    fill={nodeColor(type)}
                    stroke={step >= 0 ? nodeColor(type) : "#475569"}
                    strokeWidth="2"
                    initial={false}
                    animate={{ fill: nodeColor(type) }}
                    transition={{ duration: 0.3 }}
                  />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white"
                    fontSize="10" fontWeight="bold"
                    className="pointer-events-none select-none">
                    {nodeValue(name)}
                  </text>
                  {type === "hidden" && step >= 1 && step < 3 && (
                    <text x={pos.x} y={pos.y + 34} textAnchor="middle" fill="#94a3b8" fontSize="8">
                      {step === 1 ? "z = W·x+b" : `a = ${ACTIVATIONS[activation].label}(z)`}
                    </text>
                  )}
                  {type === "output" && step >= 3 && (
                    <text x={pos.x} y={pos.y + 34} textAnchor="middle" fill="#94a3b8" fontSize="8">
                      {step === 3 ? "z = W·a+b" : "ŷ = σ(z)"}
                    </text>
                  )}
                </g>
              ))}

              {step >= 1 && (
                <motion.polygon points="143,148 153,150 143,152" fill="#3b82f6"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} />
              )}
              {step >= 3 && (
                <motion.polygon points="330,148 340,150 330,152" fill="#3b82f6"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} />
              )}
            </svg>

            {/* Controls */}
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
                {isAnimating ? "Đang chạy..." : "Lan truyền"}
              </button>
            </div>

            {/* Step-by-step detail */}
            <AnimatePresence mode="wait">
              {step >= 0 && (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-lg bg-background/50 border border-border p-4 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                      {step + 1}
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {stepLabels[step]}
                    </p>
                  </div>
                  <p className="text-xs text-muted pl-7 break-all">
                    {stepDetails[step]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {step >= 4 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Đầu vào</p>
                  <p className="text-sm font-bold text-blue-400">
                    [{x1.toFixed(2)}, {x2.toFixed(2)}]
                  </p>
                </div>
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Dự đoán ŷ</p>
                  <p className="text-sm font-bold text-green-400">
                    {state.a2.toFixed(4)} ({(state.a2 * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            )}
          </div>
        </VisualizationSection>

        <Callout variant="info" title="Đổi hàm kích hoạt, quan sát đầu ra">
          Các nút phía trên cho bạn thay <strong>ReLU</strong> bằng{" "}
          <strong>Sigmoid</strong>, <strong>Tanh</strong> hay{" "}
          <strong>Leaky ReLU</strong>. Lưu ý: với cùng một đầu vào x, đầu ra ŷ
          thay đổi — vì hàm kích hoạt định hình đường cong quyết định khác nhau.
          Đây là điểm &quot;hook&quot; nơi bạn có thể cắm bất kỳ hàm phi tuyến
          nào vào forward pass.
        </Callout>
      </LessonSection>

      {/* =============== STEP 3: MATRIX VISUALIZATION =============== */}
      <LessonSection step={3} totalSteps={9} label="Ma trận chi tiết">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-2">
            Phóng to một phép tính: W × x + b theo từng phần tử
          </h3>
          <p className="text-sm text-muted mb-5 leading-relaxed">
            Bên trong mỗi nơ-ron là một phép nhân ma trận đơn giản. Hãy xem nó
            diễn ra từng bước một, với đầu vào x = [{x1.toFixed(2)},{" "}
            {x2.toFixed(2)}] và trọng số đã được định nghĩa phía trên.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* W matrix */}
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-xs text-muted mb-2 text-center">
                Ma trận trọng số W
              </p>
              <div className="grid grid-cols-2 gap-2">
                {W1.map((row, i) =>
                  row.map((v, j) => (
                    <motion.div
                      key={`w-${i}-${j}`}
                      className={`rounded-md px-3 py-2 text-center text-sm font-mono ${
                        matrixStep >= 1 && (i === 0 || j === 0)
                          ? "bg-blue-500/20 border border-blue-400/40 text-blue-300"
                          : "bg-card border border-border text-muted"
                      }`}
                      animate={{
                        scale: matrixStep >= 1 && j === matrixStep - 1 ? 1.05 : 1,
                      }}
                    >
                      {v.toFixed(2)}
                    </motion.div>
                  ))
                )}
              </div>
              <p className="text-[10px] text-muted text-center mt-2">
                Kích thước: 2×2
              </p>
            </div>

            {/* x vector */}
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-xs text-muted mb-2 text-center">
                Vector đầu vào x
              </p>
              <div className="flex flex-col gap-2">
                <div
                  className={`rounded-md px-3 py-2 text-center text-sm font-mono transition-colors ${
                    matrixStep >= 1
                      ? "bg-amber-500/20 border border-amber-400/40 text-amber-300"
                      : "bg-card border border-border text-muted"
                  }`}
                >
                  {x1.toFixed(2)}
                </div>
                <div
                  className={`rounded-md px-3 py-2 text-center text-sm font-mono transition-colors ${
                    matrixStep >= 1
                      ? "bg-amber-500/20 border border-amber-400/40 text-amber-300"
                      : "bg-card border border-border text-muted"
                  }`}
                >
                  {x2.toFixed(2)}
                </div>
              </div>
              <p className="text-[10px] text-muted text-center mt-2">
                Kích thước: 2×1
              </p>
            </div>

            {/* b vector */}
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-xs text-muted mb-2 text-center">
                Vector bias b
              </p>
              <div className="flex flex-col gap-2">
                {B1.map((bv, i) => (
                  <div
                    key={`b-${i}`}
                    className={`rounded-md px-3 py-2 text-center text-sm font-mono transition-colors ${
                      matrixStep >= 4
                        ? "bg-violet-500/20 border border-violet-400/40 text-violet-300"
                        : "bg-card border border-border text-muted"
                    }`}
                  >
                    {bv.toFixed(2)}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted text-center mt-2">
                Kích thước: 2×1
              </p>
            </div>
          </div>

          {/* Element-wise breakdown */}
          <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3 mb-4">
            <p className="text-sm font-semibold text-foreground">
              Tính z₁ và z₂ từng phần tử:
            </p>

            <AnimatePresence>
              {matrixStep >= 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-wrap items-center gap-2 text-sm font-mono"
                >
                  <span className="text-blue-300">z₁ =</span>
                  <span className="text-blue-300">W[0][0]·x₁</span>
                  {matrixStep >= 2 && (
                    <>
                      <span className="text-muted">+</span>
                      <span className="text-blue-300">W[1][0]·x₂</span>
                    </>
                  )}
                  {matrixStep >= 4 && (
                    <>
                      <span className="text-muted">+</span>
                      <span className="text-violet-300">b[0]</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {matrixStep >= 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pl-4 text-xs text-muted font-mono"
              >
                = {W1[0][0].toFixed(2)}×{x1.toFixed(2)}
                {matrixStep >= 2 &&
                  ` + ${W1[1][0].toFixed(2)}×${x2.toFixed(2)}`}
                {matrixStep >= 4 && ` + ${B1[0].toFixed(2)}`}
                {matrixStep >= 5 && (
                  <span className="text-blue-300">
                    {" "}
                    = {state.z1[0].toFixed(3)}
                  </span>
                )}
              </motion.div>
            )}

            {matrixStep >= 3 && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-wrap items-center gap-2 text-sm font-mono pt-2 border-t border-border"
              >
                <span className="text-blue-300">z₂ =</span>
                <span className="text-blue-300">W[0][1]·x₁</span>
                <span className="text-muted">+</span>
                <span className="text-blue-300">W[1][1]·x₂</span>
                {matrixStep >= 4 && (
                  <>
                    <span className="text-muted">+</span>
                    <span className="text-violet-300">b[1]</span>
                  </>
                )}
              </motion.div>
            )}

            {matrixStep >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pl-4 text-xs text-muted font-mono"
              >
                = {W1[0][1].toFixed(2)}×{x1.toFixed(2)} +{" "}
                {W1[1][1].toFixed(2)}×{x2.toFixed(2)}
                {matrixStep >= 4 && ` + (${B1[1].toFixed(2)})`}
                {matrixStep >= 5 && (
                  <span className="text-blue-300">
                    {" "}
                    = {state.z1[1].toFixed(3)}
                  </span>
                )}
              </motion.div>
            )}

            {matrixStep >= 5 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-md bg-green-500/10 border border-green-400/40 p-3 text-sm text-green-300 font-mono"
              >
                z = [{state.z1[0].toFixed(3)}, {state.z1[1].toFixed(3)}]
              </motion.div>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setMatrixStep(0)}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              Đặt lại
            </button>
            <button
              onClick={() =>
                setMatrixStep((s) => Math.min(s + 1, matrixStepTotal - 1))
              }
              disabled={matrixStep >= matrixStepTotal - 1}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Bước tiếp
            </button>
          </div>
          <p className="text-center text-[11px] text-muted mt-2">
            Bước {matrixStep + 1}/{matrixStepTotal}
          </p>
        </VisualizationSection>

        <Callout variant="tip" title="Tại sao gọi là tích vô hướng (dot product)?">
          Mỗi phần tử z_i là <strong>tích vô hướng</strong> giữa cột thứ i của W
          và vector x, cộng thêm bias b_i. Trong NumPy:{" "}
          <code className="text-accent">z = W.T @ x + b</code>. Hiểu rõ tích vô
          hướng là nền tảng để đọc bất kỳ công thức học sâu nào — xem lại tại{" "}
          <TopicLink slug="vectors-and-matrices">đại số tuyến tính</TopicLink>.
        </Callout>
      </LessonSection>

      {/* =============== STEP 4: MULTI-LAYER ANIMATION =============== */}
      <LessonSection step={4} totalSteps={9} label="Mạng sâu 4 lớp">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-2">
            Tín hiệu lan qua 4 lớp ẩn
          </h3>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Trong thực tế, mạng có hàng chục tới hàng trăm lớp. Hãy xem dữ liệu{" "}
            <strong>x ∈ ℝ³</strong> lan truyền qua một mạng 5 lớp: input (3) →
            hidden (4, 4, 3) → output (2). Nhấn <em>Phát</em> để theo dõi từng
            lớp &quot;sáng lên&quot; khi tín hiệu tới nó.
          </p>

          {/* Input sliders */}
          <div className="flex flex-wrap gap-4 justify-center mb-4">
            {deepInput.map((v, i) => (
              <div key={`deep-in-${i}`} className="space-y-1">
                <label className="text-xs text-muted">
                  x{i + 1} ={" "}
                  <strong className="text-foreground">{v.toFixed(2)}</strong>
                </label>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={v}
                  onChange={(e) => {
                    const next = [...deepInput];
                    next[i] = parseFloat(e.target.value);
                    setDeepInput(next);
                    setDeepLayer(0);
                  }}
                  className="w-28 accent-accent"
                />
              </div>
            ))}
          </div>

          {/* Layered SVG */}
          <svg
            viewBox="0 0 700 320"
            className="w-full max-w-3xl mx-auto mb-4"
          >
            {/* Layer labels */}
            {DEEP_LAYERS.map((layer, l) => (
              <text
                key={`lab-${l}`}
                x={70 + l * 140}
                y={25}
                textAnchor="middle"
                fill={l <= deepLayer ? "#60a5fa" : "#64748b"}
                fontSize={11}
                fontWeight={700}
              >
                {layer.label}
              </text>
            ))}
            {DEEP_LAYERS.map((layer, l) => (
              <text
                key={`act-${l}`}
                x={70 + l * 140}
                y={40}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={9}
              >
                {layer.activation === "linear" ? "—" : ACTIVATIONS[layer.activation as ActivationName].label}
              </text>
            ))}

            {/* Connections layer-to-layer */}
            {DEEP_LAYERS.slice(0, -1).map((layer, l) => {
              const nextLayer = DEEP_LAYERS[l + 1];
              const x0 = 70 + l * 140;
              const x1c = 70 + (l + 1) * 140;
              const spacing0 = 220 / Math.max(1, layer.size);
              const spacing1 = 220 / Math.max(1, nextLayer.size);
              const active = l + 1 <= deepLayer;
              return (
                <g key={`conn-layer-${l}`}>
                  {Array.from({ length: layer.size }).map((_, i) =>
                    Array.from({ length: nextLayer.size }).map((__, j) => {
                      const w = deepWeight(l + 1, i, j);
                      const y0 = 70 + i * spacing0 + spacing0 / 2;
                      const y1 = 70 + j * spacing1 + spacing1 / 2;
                      return (
                        <motion.line
                          key={`cl-${l}-${i}-${j}`}
                          x1={x0 + 14}
                          y1={y0}
                          x2={x1c - 14}
                          y2={y1}
                          stroke={
                            active
                              ? w >= 0
                                ? "#3b82f6"
                                : "#ef4444"
                              : "#334155"
                          }
                          strokeWidth={active ? Math.abs(w) * 1.5 + 0.3 : 0.4}
                          opacity={active ? 0.35 : 0.1}
                          initial={false}
                          animate={{
                            opacity: active ? 0.35 : 0.1,
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      );
                    })
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {DEEP_LAYERS.map((layer, l) => {
              const x = 70 + l * 140;
              const spacing = 220 / Math.max(1, layer.size);
              const active = l <= deepLayer;
              const values = deepActivations[l] ?? [];
              return (
                <g key={`layer-${l}`}>
                  {Array.from({ length: layer.size }).map((_, i) => {
                    const y = 70 + i * spacing + spacing / 2;
                    const v = values[i] ?? 0;
                    const mag = Math.min(1, Math.abs(v));
                    const fill = active
                      ? l === 0
                        ? "#3b82f6"
                        : l === DEEP_LAYERS.length - 1
                          ? "#22c55e"
                          : `rgb(${139 + mag * 50}, ${92 + mag * 40}, ${246})`
                      : "#1e293b";
                    return (
                      <g key={`node-${l}-${i}`}>
                        <motion.circle
                          cx={x}
                          cy={y}
                          r={14}
                          fill={fill}
                          stroke={active ? "#60a5fa" : "#475569"}
                          strokeWidth={2}
                          initial={false}
                          animate={{
                            fill,
                            scale: active && l === deepLayer ? 1.1 : 1,
                          }}
                          transition={{ duration: 0.35 }}
                        />
                        <text
                          x={x}
                          y={y + 3}
                          textAnchor="middle"
                          fill="white"
                          fontSize={8}
                          fontWeight={700}
                          className="pointer-events-none select-none"
                        >
                          {active ? v.toFixed(2) : ""}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          <div className="flex justify-center gap-3 mb-3">
            <button
              onClick={resetDeep}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
            >
              Đặt lại
            </button>
            <button
              onClick={() =>
                setDeepLayer((l) => Math.min(l + 1, DEEP_LAYERS.length - 1))
              }
              disabled={deepLayer >= DEEP_LAYERS.length - 1}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground disabled:opacity-40"
            >
              Lớp tiếp
            </button>
            <button
              onClick={() => {
                setDeepLayer(0);
                setDeepPlaying(true);
              }}
              disabled={deepPlaying}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {deepPlaying ? "Đang chạy..." : "Phát"}
            </button>
          </div>

          <p className="text-center text-xs text-muted">
            Đang ở lớp {deepLayer + 1}/{DEEP_LAYERS.length}:{" "}
            <strong className="text-foreground">
              {DEEP_LAYERS[deepLayer].label}
            </strong>{" "}
            — kích thước {DEEP_LAYERS[deepLayer].size}
          </p>

          {/* Final vector */}
          {deepLayer >= DEEP_LAYERS.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg bg-background/50 border border-border p-3 text-center"
            >
              <p className="text-xs text-muted mb-1">Đầu ra ŷ</p>
              <p className="text-sm font-mono font-bold text-green-400">
                [
                {deepActivations[DEEP_LAYERS.length - 1]
                  .map((v) => v.toFixed(3))
                  .join(", ")}
                ]
              </p>
            </motion.div>
          )}
        </VisualizationSection>

        <Callout variant="info" title="Khi nào mạng sâu hơn?">
          Mạng sâu hơn = nhiều lớp hơn = nhiều &quot;cấp trừu tượng&quot; hơn.
          Lớp đầu học cạnh và góc, lớp giữa học hình khối, lớp cuối học khái niệm
          như &quot;mèo&quot;. Nhưng mạng quá sâu cũng có vấn đề — xem{" "}
          <TopicLink slug="backpropagation">backpropagation</TopicLink> và hiện
          tượng vanishing gradient.
        </Callout>
      </LessonSection>

      {/* =============== STEP 5: PRE-TRAINED COMPARISON =============== */}
      <LessonSection step={5} totalSteps={9} label="So sánh trọng số">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-2">
            Trọng số ngẫu nhiên vs đã huấn luyện
          </h3>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Forward propagation là phép tính GIỐNG NHAU dù trọng số tốt hay xấu
            — chỉ kết quả khác. Hãy cho cùng một đầu vào chạy qua 2 bộ trọng số:
            một bộ mới khởi tạo ngẫu nhiên (vô nghĩa), một bộ đã được huấn luyện
            (có kỹ năng phân loại).
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-4">
            <div className="space-y-1">
              <label className="text-xs text-muted">
                x₁ ={" "}
                <strong className="text-foreground">
                  {cmpX[0].toFixed(2)}
                </strong>
              </label>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.05"
                value={cmpX[0]}
                onChange={(e) =>
                  setCmpX([parseFloat(e.target.value), cmpX[1]])
                }
                className="w-36 accent-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted">
                x₂ ={" "}
                <strong className="text-foreground">
                  {cmpX[1].toFixed(2)}
                </strong>
              </label>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.05"
                value={cmpX[1]}
                onChange={(e) =>
                  setCmpX([cmpX[0], parseFloat(e.target.value)])
                }
                className="w-36 accent-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Random model */}
            <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-amber-300">
                  Khởi tạo ngẫu nhiên
                </p>
                <span className="text-[10px] rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 font-semibold">
                  Epoch 0
                </span>
              </div>
              <p className="text-xs text-muted">Trọng số W:</p>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                {RANDOM_W.flat().map((v, i) => (
                  <div
                    key={`rand-w-${i}`}
                    className="rounded bg-card border border-border px-2 py-1 text-center text-muted"
                  >
                    {v.toFixed(2)}
                  </div>
                ))}
              </div>
              <div className="rounded-md bg-background/60 p-2 text-xs font-mono space-y-1">
                <p className="text-muted">
                  z = [{randomOut.z.map((v) => v.toFixed(2)).join(", ")}]
                </p>
                <p className="text-amber-300">
                  a (ReLU) = [{randomOut.a.map((v) => v.toFixed(2)).join(", ")}]
                </p>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Đầu ra chỉ là &quot;tiếng ồn&quot; — mạng chưa học được gì nên
                không phân biệt được lớp.
              </p>
            </div>

            {/* Trained model */}
            <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-300">
                  Đã huấn luyện
                </p>
                <span className="text-[10px] rounded-full bg-green-500/20 text-green-300 px-2 py-0.5 font-semibold">
                  Epoch 100
                </span>
              </div>
              <p className="text-xs text-muted">Trọng số W:</p>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                {TRAINED_W.flat().map((v, i) => (
                  <div
                    key={`tr-w-${i}`}
                    className="rounded bg-card border border-border px-2 py-1 text-center text-foreground"
                  >
                    {v.toFixed(2)}
                  </div>
                ))}
              </div>
              <div className="rounded-md bg-background/60 p-2 text-xs font-mono space-y-1">
                <p className="text-muted">
                  z = [{trainedOut.z.map((v) => v.toFixed(2)).join(", ")}]
                </p>
                <p className="text-green-300">
                  a (ReLU) = [
                  {trainedOut.a.map((v) => v.toFixed(2)).join(", ")}]
                </p>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Mạng &quot;phát hiện&quot; các đặc trưng có ý nghĩa. Cùng một
                công thức, chỉ số khác → kết quả hoàn toàn khác.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted mt-4 italic">
            Thông điệp: forward pass = công thức cố định. Học nằm ở việc cập
            nhật W, b — công việc của backpropagation.
          </p>
        </VisualizationSection>
      </LessonSection>

      {/* =============== STEP 6: AHA MOMENT =============== */}
      <LessonSection step={6} totalSteps={9} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Forward Propagation</strong> chỉ là hai phép tính lặp đi lặp
            lại: (1) nhân trọng số + bias → z, (2){" "}
            <TopicLink slug="activation-functions">hàm kích hoạt</TopicLink> →
            a. Quá trình này đi qua từng lớp của{" "}
            <TopicLink slug="mlp">MLP</TopicLink> để tạo ra dự đoán cuối cùng.
            Dù mạng có 3 lớp hay 300 lớp, công thức này vẫn đúng — chỉ lặp lại
            nhiều hơn.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* =============== STEP 7: CHALLENGES =============== */}
      <LessonSection step={7} totalSteps={9} label="Thử thách">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          Bạn đã thấy forward pass tính toán đầu ra. Nhưng kết quả chính xác
          chưa? Bước tiếp theo sau forward propagation là gì?
        </p>
        <InlineChallenge
          question="Sau forward propagation, mô hình dự đoán ŷ = 0.647 nhưng nhãn thực tế y = 1. Bước tiếp theo là gì?"
          options={[
            "Tính loss (sai số) rồi dùng backpropagation để cập nhật trọng số",
            "Chạy forward propagation thêm lần nữa",
            "Thay đổi đầu vào cho đến khi ŷ = 1",
          ]}
          correct={0}
          explanation="Forward pass cho dự đoán, loss đo sai số, rồi backpropagation tính gradient để cập nhật trọng số. Đây là vòng lặp huấn luyện: forward → loss → backward → cập nhật."
        />

        <div className="h-4" />

        <InlineChallenge
          question="Mạng có 3 lớp ẩn, mỗi lớp dùng sigmoid. Bạn nhận thấy đầu ra gần như không thay đổi dù x thay đổi mạnh. Lý do khả dĩ nhất?"
          options={[
            "Trọng số quá nhỏ → z luôn gần 0 → sigmoid(z) ≈ 0.5 với mọi đầu vào",
            "Forward pass bị lỗi kỹ thuật",
            "Sigmoid không phải hàm kích hoạt hợp lệ",
            "Mạng cần nhiều đầu vào hơn",
          ]}
          correct={0}
          explanation="Khi mọi nơ-ron đều 'bão hoà' quanh 0.5 (vùng phẳng của sigmoid), tín hiệu khó đi qua — đây là tiền đề cho vấn đề vanishing gradient. Cách khắc phục: dùng ReLU cho lớp ẩn, hoặc khởi tạo W tốt hơn (He/Xavier init)."
        />
      </LessonSection>

      {/* =============== STEP 8: EXPLANATION =============== */}
      <LessonSection step={8} totalSteps={9} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Lan truyền tiến (Forward Propagation)</strong> là quá trình
            đưa dữ liệu qua mạng để tạo ra dự đoán. Tại mỗi lớp:
          </p>

          <p>
            <strong>Bước 1 — Biến đổi tuyến tính</strong> (dựa trên{" "}
            <TopicLink slug="vectors-and-matrices">
              đại số tuyến tính
            </TopicLink>
            ):
          </p>
          <LaTeX block>
            {"z^{[l]} = W^{[l]} \\cdot a^{[l-1]} + b^{[l]}"}
          </LaTeX>

          <p>
            <strong>Bước 2 — Hàm kích hoạt:</strong>
          </p>
          <LaTeX block>{"a^{[l]} = f(z^{[l]})"}</LaTeX>

          <p>
            Lặp lại cho mỗi lớp từ <LaTeX>{"l=1"}</LaTeX> đến lớp cuối cùng. Đầu
            ra cuối <LaTeX>{"\\hat{y} = a^{[L]}"}</LaTeX> là dự đoán của mạng.
          </p>

          <Callout
            variant="info"
            title="Forward pass trong huấn luyện vs inference"
          >
            <strong>Huấn luyện:</strong> Cần lưu lại tất cả giá trị trung gian
            (z, a) ở mỗi lớp —{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink> sẽ
            dùng chúng để tính gradient.
            <br />
            <strong>Inference (suy luận):</strong> Chỉ cần đầu ra cuối, không
            lưu giá trị trung gian, không tính gradient → nhanh hơn nhiều.
          </Callout>

          <CodeBlock language="python" title="forward_pass.py">
{`import numpy as np

def forward(X, weights, biases):
    """Forward pass qua mạng nơ-ron — phiên bản gốc."""
    a = X  # đầu vào ban đầu, shape (batch, input_dim)
    cache = [a]  # lưu lại cho backprop

    for W, b in zip(weights[:-1], biases[:-1]):
        z = a @ W + b          # biến đổi tuyến tính
        a = np.maximum(0, z)   # ReLU cho lớp ẩn
        cache.append(a)

    # Lớp cuối: sigmoid cho phân loại nhị phân
    z = a @ weights[-1] + biases[-1]
    y_hat = 1 / (1 + np.exp(-z))
    cache.append(y_hat)

    return y_hat, cache`}
          </CodeBlock>

          <p>
            Phiên bản trên dùng NumPy, đơn giản cho mục đích học. Trong thực tế,
            các thư viện như PyTorch tự động tạo computation graph để backprop:
          </p>

          <CodeBlock language="python" title="forward_pytorch.py">
{`import torch
import torch.nn as nn
import torch.nn.functional as F

class MLP(nn.Module):
    def __init__(self, in_dim=784, hidden=128, out_dim=10):
        super().__init__()
        self.fc1 = nn.Linear(in_dim, hidden)
        self.fc2 = nn.Linear(hidden, hidden)
        self.fc3 = nn.Linear(hidden, out_dim)

    def forward(self, x):
        # Mỗi lớp = Linear(W, b) + activation
        h1 = F.relu(self.fc1(x))    # lớp ẩn 1
        h2 = F.relu(self.fc2(h1))   # lớp ẩn 2
        logits = self.fc3(h2)       # đầu ra thô (chưa softmax)
        return logits

model = MLP()
x = torch.randn(32, 784)           # batch 32 ảnh MNIST

# Huấn luyện: cần gradient
logits = model(x)                  # computation graph được dựng

# Inference: tắt gradient, nhanh và tiết kiệm RAM
model.eval()
with torch.no_grad():
    preds = model(x).argmax(dim=1)`}
          </CodeBlock>

          <Callout variant="tip" title="Mẹo tối ưu inference">
            Khi deploy mô hình, dùng <strong>torch.no_grad()</strong> hoặc{" "}
            <strong>model.eval()</strong> để tắt tính gradient — tiết kiệm bộ
            nhớ và tăng tốc 2-3 lần. Giống như khi nấu phở để bán, bạn không
            cần ghi lại từng bước nữa!
          </Callout>

          <Callout
            variant="warning"
            title="Đừng quên chuyển sang .eval() khi inference"
          >
            Các layer như <code>Dropout</code> và <code>BatchNorm</code> hoạt
            động KHÁC giữa chế độ huấn luyện và inference. Quên gọi{" "}
            <code>model.eval()</code> có thể làm đầu ra không ổn định. Một bug
            thầm lặng nhưng rất phổ biến trong production.
          </Callout>

          <CollapsibleDetail title="Vectorization: tại sao batch giúp GPU chạy nhanh">
            <div className="space-y-3 text-sm text-muted leading-relaxed">
              <p>
                Với một mẫu, bạn tính <code>z = W·x + b</code>. Với batch 32
                mẫu, bạn xếp chúng thành ma trận{" "}
                <code>X ∈ ℝ^{"{32 × d}"}</code> và tính{" "}
                <code>Z = X·W + b</code> một lần. GPU sẽ phân công 32 phép nhân
                song song trên hàng ngàn core — thường nhanh gấp 20-50 lần so
                với vòng lặp Python.
              </p>
              <p>
                Đây là lý do mọi framework học sâu đều yêu cầu{" "}
                <strong>batch dimension ở đầu tensor</strong>. Bạn KHÔNG viết
                vòng for <code>for sample in batch</code> — bạn vector hoá.
              </p>
              <CodeBlock language="python" title="vectorized_forward.py">
{`# Thay vì (chậm):
outputs = []
for x in batch:            # 32 mẫu riêng biệt
    z = W @ x + b
    outputs.append(relu(z))

# Hãy viết (nhanh gấp nhiều lần):
Z = batch @ W + b           # batch shape (32, d) @ W (d, h) → (32, h)
A = np.maximum(0, Z)`}
              </CodeBlock>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Forward pass trong Transformer: có gì đặc biệt?">
            <div className="space-y-3 text-sm text-muted leading-relaxed">
              <p>
                Transformer (GPT, BERT) vẫn tuân theo nguyên tắc forward
                propagation, nhưng mỗi &quot;lớp&quot; phức tạp hơn. Một block
                gồm:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  <strong>Self-attention:</strong> tính Q, K, V từ x rồi{" "}
                  <code>attention(Q, K, V) = softmax(QKᵀ / √d) · V</code>
                </li>
                <li>
                  <strong>Residual + LayerNorm:</strong>{" "}
                  <code>x = LN(x + attn_out)</code>
                </li>
                <li>
                  <strong>Feed-forward:</strong> 2 lớp Linear với GELU ở giữa
                </li>
                <li>
                  <strong>Residual + LayerNorm</strong> lần nữa
                </li>
              </ol>
              <p>
                Bản chất vẫn là: <em>biến đổi tuyến tính → phi tuyến → lặp</em>.
                Chỉ khác là chiều biến đổi giờ phụ thuộc vào NHIỀU token cùng
                lúc (qua attention), không chỉ token hiện tại.
              </p>
            </div>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* =============== STEP 9: MINI SUMMARY + QUIZ =============== */}
      <LessonSection step={9} totalSteps={9} label="Tổng kết & Kiểm tra">
        <MiniSummary
          title="Forward Propagation — Điểm chốt"
          points={[
            "Forward pass = lặp 2 phép tính tại mỗi lớp: z = W·a + b, rồi a = f(z).",
            "Dữ liệu đi MỘT CHIỀU từ đầu vào → lớp ẩn → đầu ra, không quay lại.",
            "Đầu ra cuối cùng (ŷ) được so sánh với nhãn thực (y) qua hàm loss.",
            "Khi huấn luyện: lưu giá trị trung gian cho backpropagation. Khi inference: bỏ qua → nhanh hơn.",
            "Trọng số W, b dùng chung cho mọi mẫu trong batch — đây là cơ sở để vector hoá trên GPU.",
            "Vòng lặp huấn luyện: forward → loss → backward → cập nhật trọng số → lặp lại.",
          ]}
        />

        <div className="h-6" />

        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
