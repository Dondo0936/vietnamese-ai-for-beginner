"use client";

import { useState, useMemo, useCallback } from "react";
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
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

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

/* ---------- math helpers ---------- */
function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}
function relu(x: number) {
  return Math.max(0, x);
}

/* Network: 2 inputs, 2 hidden neurons, 1 output */
const W1 = [
  [0.3, 0.7],
  [0.5, -0.4],
]; // 2x2
const B1 = [0.1, -0.2];
const W2 = [0.6, -0.3]; // 2->1
const B2 = 0.15;

interface ForwardState {
  x: [number, number];
  z1: [number, number];
  a1: [number, number];
  z2: number;
  a2: number;
}

function forwardPass(x1: number, x2: number): ForwardState {
  const x: [number, number] = [x1, x2];
  const z1: [number, number] = [
    W1[0][0] * x1 + W1[1][0] * x2 + B1[0],
    W1[0][1] * x1 + W1[1][1] * x2 + B1[1],
  ];
  const a1: [number, number] = [relu(z1[0]), relu(z1[1])];
  const z2 = W2[0] * a1[0] + W2[1] * a1[1] + B2;
  const a2 = sigmoid(z2);
  return { x, z1, a1, z2, a2 };
}

/* SVG constants */
const SVG_W = 540;
const SVG_H = 300;

/* Node positions */
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

/* ---------- main component ---------- */
export default function ForwardPropagationTopic() {
  const [x1, setX1] = useState(0.5);
  const [x2, setX2] = useState(0.8);
  const [step, setStep] = useState(-1); // -1 = not started
  const [isAnimating, setIsAnimating] = useState(false);

  const state = useMemo(() => forwardPass(x1, x2), [x1, x2]);

  const stepLabels = [
    "Đầu vào",
    "Nhân trọng số + bias → z",
    "Hàm kích hoạt ReLU → a",
    "Nhân trọng số + bias → z₂",
    "Sigmoid → đầu ra",
  ];

  const stepDetails = useMemo(
    () => [
      `x = [${x1.toFixed(2)}, ${x2.toFixed(2)}]`,
      `z₁ = ${W1[0][0]}×${x1.toFixed(2)} + ${W1[1][0]}×${x2.toFixed(2)} + ${B1[0]} = ${state.z1[0].toFixed(3)}  |  z₂ = ${W1[0][1]}×${x1.toFixed(2)} + ${W1[1][1]}×${x2.toFixed(2)} + (${B1[1]}) = ${state.z1[1].toFixed(3)}`,
      `a₁ = ReLU(${state.z1[0].toFixed(3)}) = ${state.a1[0].toFixed(3)}  |  a₂ = ReLU(${state.z1[1].toFixed(3)}) = ${state.a1[1].toFixed(3)}`,
      `z = ${W2[0]}×${state.a1[0].toFixed(3)} + (${W2[1]})×${state.a1[1].toFixed(3)} + ${B2} = ${state.z2.toFixed(3)}`,
      `ŷ = sigmoid(${state.z2.toFixed(3)}) = ${state.a2.toFixed(4)}`,
    ],
    [x1, x2, state]
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

  /* Quiz */
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
      question:
        "Forward propagation có cần tính gradient không?",
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
  ];

  /** Get node color based on current animation step */
  function nodeColor(nodeType: string): string {
    if (step < 0) return "#1e293b";
    if (nodeType === "input") return step >= 0 ? "#3b82f6" : "#1e293b";
    if (nodeType === "hidden") return step >= 2 ? "#8b5cf6" : "#1e293b";
    if (nodeType === "output") return step >= 4 ? "#22c55e" : "#1e293b";
    return "#1e293b";
  }

  /** Get node displayed value */
  function nodeValue(name: string): string {
    if (step < 0) return name;
    switch (name) {
      case "x1":
        return step >= 0 ? x1.toFixed(2) : "x₁";
      case "x2":
        return step >= 0 ? x2.toFixed(2) : "x₂";
      case "h1":
        return step >= 2 ? state.a1[0].toFixed(2) : step >= 1 ? state.z1[0].toFixed(2) : "h₁";
      case "h2":
        return step >= 2 ? state.a1[1].toFixed(2) : step >= 1 ? state.z1[1].toFixed(2) : "h₂";
      case "out":
        return step >= 4 ? state.a2.toFixed(3) : step >= 3 ? state.z2.toFixed(2) : "ŷ";
      default:
        return name;
    }
  }

  function isConnectionActive(from: string, to: string): boolean {
    if (from.startsWith("x") && to.startsWith("h")) return step >= 1;
    if (from.startsWith("h") && to === "out") return step >= 3;
    return false;
  }

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={7} label="Dự đoán">
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
            Hãy tự tay truyền dữ liệu qua mạng và theo dõi từng phép tính.
            Thay đổi đầu vào rồi nhấn{" "}
            <strong className="text-foreground">Lan truyền</strong>{" "}
            để xem con số biến đổi qua từng lớp.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: INTERACTIVE FORWARD PASS ===== */}
      <LessonSection step={2} totalSteps={7} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* Input sliders */}
            <div className="flex flex-wrap gap-6 justify-center">
              <div className="space-y-1">
                <label className="text-xs text-muted">
                  x₁ ={" "}
                  <strong className="text-foreground">
                    {x1.toFixed(2)}
                  </strong>
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
                  <strong className="text-foreground">
                    {x2.toFixed(2)}
                  </strong>
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

            {/* Network diagram */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-2xl mx-auto"
            >
              {/* Layer labels */}
              <text x={60} y={40} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
                Đầu vào
              </text>
              <text x={230} y={40} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
                Lớp ẩn
              </text>
              <text x={420} y={40} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
                Đầu ra
              </text>

              {/* Connections */}
              {CONNECTIONS.map((conn, i) => {
                const from = NODES[conn.from as keyof typeof NODES];
                const to = NODES[conn.to as keyof typeof NODES];
                const active = isConnectionActive(conn.from, conn.to);
                return (
                  <g key={`conn-${i}`}>
                    <motion.line
                      x1={from.x + 20}
                      y1={from.y}
                      x2={to.x - 20}
                      y2={to.y}
                      stroke={active ? (conn.w >= 0 ? "#3b82f6" : "#ef4444") : "#334155"}
                      strokeWidth={active ? Math.abs(conn.w) * 4 + 1 : 1}
                      opacity={active ? 0.7 : 0.2}
                      initial={false}
                      animate={{
                        stroke: active ? (conn.w >= 0 ? "#3b82f6" : "#ef4444") : "#334155",
                        opacity: active ? 0.7 : 0.2,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                    {active && (
                      <text
                        x={(from.x + to.x) / 2 + (from.y === to.y ? 0 : from.y < to.y ? 12 : -12)}
                        y={(from.y + to.y) / 2 + (from.y === to.y ? -8 : 0)}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="8"
                      >
                        {conn.w > 0 ? "+" : ""}{conn.w}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
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
                    cx={pos.x}
                    cy={pos.y}
                    r={18}
                    fill={nodeColor(type)}
                    stroke={step >= 0 ? nodeColor(type) : "#475569"}
                    strokeWidth="2"
                    initial={false}
                    animate={{ fill: nodeColor(type) }}
                    transition={{ duration: 0.3 }}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {nodeValue(name)}
                  </text>
                  {/* Operation label below hidden nodes */}
                  {type === "hidden" && step >= 1 && step < 3 && (
                    <text
                      x={pos.x}
                      y={pos.y + 34}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="8"
                    >
                      {step === 1 ? "z = W·x+b" : "a = ReLU(z)"}
                    </text>
                  )}
                  {type === "output" && step >= 3 && (
                    <text
                      x={pos.x}
                      y={pos.y + 34}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="8"
                    >
                      {step === 3 ? "z = W·a+b" : "ŷ = σ(z)"}
                    </text>
                  )}
                </g>
              ))}

              {/* Flow arrows between layers */}
              {step >= 1 && (
                <>
                  <motion.polygon
                    points="143,148 153,150 143,152"
                    fill="#3b82f6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                  />
                </>
              )}
              {step >= 3 && (
                <motion.polygon
                  points="330,148 340,150 330,152"
                  fill="#3b82f6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                />
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

            {/* Final result */}
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
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={7} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Forward Propagation</strong>{" "}
            chỉ là hai phép tính lặp đi lặp lại: (1) nhân trọng số + bias → z,
            (2) hàm kích hoạt → a. Giống quán phở tự phục vụ: mỗi quầy bạn ghé qua đều
            thêm gia vị (trọng số) rồi người kiểm tra (hàm kích hoạt) quyết định cho qua hay không!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={7} label="Thử thách">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          Bạn đã thấy forward pass tính toán đầu ra. Nhưng kết quả chính xác chưa?
          Bước tiếp theo sau forward propagation là gì?
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
      </LessonSection>

      {/* ===== STEP 5: EXPLANATION ===== */}
      <LessonSection step={5} totalSteps={7} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Lan truyền tiến (Forward Propagation)</strong>{" "}
            là quá trình đưa dữ liệu qua mạng để tạo ra dự đoán. Tại mỗi lớp:
          </p>

          <p>
            <strong>Bước 1 — Biến đổi tuyến tính:</strong>
          </p>
          <LaTeX block>{"z^{[l]} = W^{[l]} \\cdot a^{[l-1]} + b^{[l]}"}</LaTeX>

          <p>
            <strong>Bước 2 — Hàm kích hoạt:</strong>
          </p>
          <LaTeX block>{"a^{[l]} = f(z^{[l]})"}</LaTeX>

          <p>
            Lặp lại cho mỗi lớp từ <LaTeX>{"l=1"}</LaTeX> đến lớp cuối cùng.
            Đầu ra cuối <LaTeX>{"\\hat{y} = a^{[L]}"}</LaTeX> là dự đoán của mạng.
          </p>

          <Callout variant="info" title="Forward pass trong huấn luyện vs inference">
            <strong>Huấn luyện:</strong>{" "}
            Cần lưu lại tất cả giá trị trung gian (z, a) ở mỗi lớp — backpropagation sẽ dùng chúng để tính gradient.
            <br />
            <strong>Inference (suy luận):</strong>{" "}
            Chỉ cần đầu ra cuối, không lưu giá trị trung gian, không tính gradient → nhanh hơn nhiều.
          </Callout>

          <CodeBlock language="python" title="forward_pass.py">
{`import numpy as np

def forward(X, weights, biases):
    """Forward pass qua mạng nơ-ron"""
    a = X  # đầu vào ban đầu
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

          <Callout variant="tip" title="Mẹo tối ưu inference">
            Khi deploy mô hình, dùng <strong>torch.no_grad()</strong>{" "}
            hoặc <strong>model.eval()</strong> để tắt tính gradient — tiết kiệm bộ nhớ
            và tăng tốc 2-3 lần. Giống như khi nấu phở để bán, bạn không cần ghi lại
            từng bước nữa!
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: MINI SUMMARY ===== */}
      <LessonSection step={6} totalSteps={7} label="Tóm tắt">
        <MiniSummary
          title="Forward Propagation — Điểm chốt"
          points={[
            "Forward pass = lặp 2 phép tính tại mỗi lớp: z = W·a + b, rồi a = f(z).",
            "Dữ liệu đi MỘT CHIỀU từ đầu vào → lớp ẩn → đầu ra, không quay lại.",
            "Đầu ra cuối cùng (ŷ) được so sánh với nhãn thực (y) qua hàm loss.",
            "Khi huấn luyện: lưu giá trị trung gian cho backpropagation. Khi inference: bỏ qua → nhanh hơn.",
            "Vòng lặp huấn luyện: forward → loss → backward → cập nhật trọng số → lặp lại.",
          ]}
        />
      </LessonSection>

      {/* ===== STEP 7: QUIZ ===== */}
      <LessonSection step={7} totalSteps={7} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
