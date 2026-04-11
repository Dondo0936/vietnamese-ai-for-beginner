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
  CodeBlock,
  LaTeX,
  ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "activation-functions",
  title: "Activation Functions",
  titleVi: "Hàm kích hoạt",
  description:
    "Các hàm phi tuyến giúp mạng nơ-ron học được các mối quan hệ phức tạp trong dữ liệu.",
  category: "neural-fundamentals",
  tags: ["neural-network", "fundamentals", "math"],
  difficulty: "beginner",
  relatedSlugs: ["perceptron", "mlp", "vanishing-exploding-gradients"],
  vizType: "interactive",
};

/* ---------- math helpers ---------- */
const SVG_W = 480;
const SVG_H = 300;
const PAD = 40;
const X_RANGE = 6; // -6 to 6

type ActivationName = "sigmoid" | "relu" | "tanh" | "leaky-relu";

interface ActivationDef {
  fn: (x: number) => number;
  deriv: (x: number) => number;
  color: string;
  label: string;
  formula: string;
  range: string;
}

const ACTIVATIONS: Record<ActivationName, ActivationDef> = {
  sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-x)),
    deriv: (x) => {
      const s = 1 / (1 + Math.exp(-x));
      return s * (1 - s);
    },
    color: "#3b82f6",
    label: "Sigmoid",
    formula: "\\sigma(x) = \\frac{1}{1 + e^{-x}}",
    range: "(0, 1)",
  },
  relu: {
    fn: (x) => Math.max(0, x),
    deriv: (x) => (x > 0 ? 1 : 0),
    color: "#22c55e",
    label: "ReLU",
    formula: "\\text{ReLU}(x) = \\max(0, x)",
    range: "[0, +∞)",
  },
  tanh: {
    fn: (x) => Math.tanh(x),
    deriv: (x) => 1 - Math.tanh(x) ** 2,
    color: "#f59e0b",
    label: "Tanh",
    formula: "\\tanh(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}",
    range: "(-1, 1)",
  },
  "leaky-relu": {
    fn: (x) => (x > 0 ? x : 0.1 * x),
    deriv: (x) => (x > 0 ? 1 : 0.1),
    color: "#ef4444",
    label: "Leaky ReLU",
    formula: "f(x) = \\begin{cases} x & x > 0 \\\\ 0.01x & x \\leq 0 \\end{cases}",
    range: "(-∞, +∞)",
  },
};

function dataToSvgX(x: number) {
  return PAD + ((x + X_RANGE) / (2 * X_RANGE)) * (SVG_W - 2 * PAD);
}

function dataToSvgY(y: number, yMin: number, yMax: number) {
  return SVG_H - PAD - ((y - yMin) / (yMax - yMin)) * (SVG_H - 2 * PAD);
}

/* ---------- main component ---------- */
export default function ActivationFunctionsTopic() {
  const [selected, setSelected] = useState<ActivationName>("relu");
  const [inputVal, setInputVal] = useState(1.5);
  const [showDeriv, setShowDeriv] = useState(false);
  const [chainInputs, setChainInputs] = useState([2.0, -1.0, 0.5]);

  const act = ACTIVATIONS[selected];
  const outputVal = act.fn(inputVal);
  const derivVal = act.deriv(inputVal);

  // Determine y range based on activation
  const yRange = useMemo((): [number, number] => {
    if (selected === "relu" || selected === "leaky-relu") return [-1, 5];
    return [-1.5, 1.5];
  }, [selected]);

  // Generate curve points
  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = -X_RANGE + (i / 200) * 2 * X_RANGE;
      const y = Math.max(yRange[0], Math.min(yRange[1], act.fn(x)));
      pts.push(`${dataToSvgX(x)},${dataToSvgY(y, yRange[0], yRange[1])}`);
    }
    return pts.join(" ");
  }, [selected, act, yRange]);

  // Derivative curve
  const derivPoints = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = -X_RANGE + (i / 200) * 2 * X_RANGE;
      const y = Math.max(yRange[0], Math.min(yRange[1], act.deriv(x)));
      pts.push(`${dataToSvgX(x)},${dataToSvgY(y, yRange[0], yRange[1])}`);
    }
    return pts.join(" ");
  }, [selected, act, yRange]);

  // Chain demo: pass same input through sigmoid many times
  const chainResults = useMemo(() => {
    const results: number[][] = [];
    for (const inp of chainInputs) {
      const chain: number[] = [inp];
      let val = inp;
      for (let i = 0; i < 8; i++) {
        val = ACTIVATIONS.sigmoid.fn(val);
        chain.push(val);
      }
      results.push(chain);
    }
    return results;
  }, [chainInputs]);

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Tại sao ReLU là lựa chọn mặc định cho lớp ẩn trong hầu hết mạng nơ-ron hiện đại?",
      options: [
        "Vì ReLU cho đầu ra trong khoảng (0,1) như xác suất",
        "Vì ReLU tính nhanh (chỉ so sánh với 0) và gradient không bị triệt tiêu ở vùng dương",
        "Vì ReLU là hàm kích hoạt duy nhất có đạo hàm",
        "Vì ReLU phù hợp cho lớp đầu ra",
      ],
      correct: 1,
      explanation:
        "ReLU chỉ cần phép so sánh max(0,x), cực kỳ nhanh. Gradient ở vùng dương luôn bằng 1, tránh triệt tiêu gradient — vấn đề nghiêm trọng của sigmoid/tanh.",
    },
    {
      question: "'Dying ReLU' xảy ra khi nào?",
      options: [
        "Khi đầu vào luôn dương",
        "Khi learning rate quá nhỏ",
        "Khi nơ-ron luôn nhận đầu vào âm, gradient = 0, nơ-ron không bao giờ cập nhật",
        "Khi dùng quá nhiều lớp",
      ],
      correct: 2,
      explanation:
        "Nếu đầu vào luôn âm, ReLU trả về 0 và gradient cũng bằng 0. Nơ-ron 'chết' vĩnh viễn. Leaky ReLU giải quyết bằng cách cho gradient nhỏ (0.01) ở vùng âm.",
    },
    {
      question:
        "Khi nào dùng sigmoid ở lớp đầu ra?",
      options: [
        "Luôn luôn — sigmoid là tốt nhất",
        "Bài toán phân loại nhị phân (xác suất 0-1)",
        "Bài toán hồi quy liên tục",
        "Bài toán phân loại đa lớp",
      ],
      correct: 1,
      explanation:
        "Sigmoid nén đầu ra về (0,1) — hoàn hảo cho xác suất nhị phân. Phân loại đa lớp dùng softmax, hồi quy dùng tuyến tính (không kích hoạt).",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Nếu xếp chồng 100 lớp tuyến tính (chỉ nhân ma trận, không có gì khác), kết quả sẽ tương đương với bao nhiêu lớp?"
          options={[
            "100 lớp — mỗi lớp đều đóng góp",
            "50 lớp — giảm một nửa",
            "1 lớp duy nhất — tất cả rút gọn thành một phép nhân",
            "0 lớp — kết quả luôn bằng 0",
          ]}
          correct={2}
          explanation="Nhân nhiều ma trận vẫn cho một ma trận: W₁ × W₂ × ... × W₁₀₀ = W_tổng. Không có phi tuyến, 100 lớp = 1 lớp! Đây là lý do hàm kích hoạt tồn tại."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Hàm kích hoạt chính là thành phần phá vỡ tính tuyến tính. Hãy{" "}
            <strong className="text-foreground">kéo thanh trượt</strong>{" "}
            để cảm nhận từng hàm biến đổi tín hiệu như thế nào.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: INTERACTIVE EXPLORER ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* Function selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(Object.keys(ACTIVATIONS) as ActivationName[]).map((name) => (
                <button
                  key={name}
                  onClick={() => setSelected(name)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    selected === name
                      ? "text-white shadow-md"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={
                    selected === name
                      ? { backgroundColor: ACTIVATIONS[name].color }
                      : {}
                  }
                >
                  {ACTIVATIONS[name].label}
                </button>
              ))}
            </div>

            {/* Toggle derivative */}
            <div className="flex justify-center">
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDeriv}
                  onChange={(e) => setShowDeriv(e.target.checked)}
                  className="accent-accent"
                />
                Hiện đạo hàm (gradient)
              </label>
            </div>

            {/* SVG Graph */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-xl mx-auto"
            >
              {/* Axes */}
              <line
                x1={PAD}
                y1={dataToSvgY(0, yRange[0], yRange[1])}
                x2={SVG_W - PAD}
                y2={dataToSvgY(0, yRange[0], yRange[1])}
                stroke="#334155"
                strokeWidth="1"
              />
              <line
                x1={dataToSvgX(0)}
                y1={PAD}
                x2={dataToSvgX(0)}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={SVG_W - PAD + 5}
                y={dataToSvgY(0, yRange[0], yRange[1]) - 5}
                fill="#64748b"
                fontSize="11"
              >
                x
              </text>
              <text
                x={dataToSvgX(0) + 5}
                y={PAD - 5}
                fill="#64748b"
                fontSize="11"
              >
                y
              </text>

              {/* Tick marks */}
              {[-4, -2, 2, 4].map((v) => (
                <g key={`tx-${v}`}>
                  <line
                    x1={dataToSvgX(v)}
                    y1={dataToSvgY(0, yRange[0], yRange[1]) - 3}
                    x2={dataToSvgX(v)}
                    y2={dataToSvgY(0, yRange[0], yRange[1]) + 3}
                    stroke="#475569"
                    strokeWidth="1"
                  />
                  <text
                    x={dataToSvgX(v)}
                    y={dataToSvgY(0, yRange[0], yRange[1]) + 16}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                  >
                    {v}
                  </text>
                </g>
              ))}

              {/* Derivative curve (behind main curve) */}
              {showDeriv && (
                <polyline
                  points={derivPoints}
                  fill="none"
                  stroke={act.color}
                  strokeWidth="2"
                  strokeDasharray="6,4"
                  opacity={0.5}
                />
              )}

              {/* Main curve */}
              <polyline
                points={curvePoints}
                fill="none"
                stroke={act.color}
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Input marker */}
              <motion.circle
                cx={dataToSvgX(inputVal)}
                cy={dataToSvgY(
                  Math.max(
                    yRange[0],
                    Math.min(yRange[1], outputVal)
                  ),
                  yRange[0],
                  yRange[1]
                )}
                r="7"
                fill={act.color}
                stroke="white"
                strokeWidth="2"
                initial={false}
                animate={{
                  cx: dataToSvgX(inputVal),
                  cy: dataToSvgY(
                    Math.max(
                      yRange[0],
                      Math.min(yRange[1], outputVal)
                    ),
                    yRange[0],
                    yRange[1]
                  ),
                }}
                transition={{ type: "spring", stiffness: 150, damping: 15 }}
              />

              {/* Value label */}
              <motion.text
                x={dataToSvgX(inputVal)}
                y={
                  dataToSvgY(
                    Math.max(
                      yRange[0],
                      Math.min(yRange[1], outputVal)
                    ),
                    yRange[0],
                    yRange[1]
                  ) - 14
                }
                textAnchor="middle"
                fill={act.color}
                fontSize="11"
                fontWeight="bold"
                initial={false}
                animate={{
                  x: dataToSvgX(inputVal),
                }}
              >
                f({inputVal.toFixed(1)}) = {outputVal.toFixed(3)}
              </motion.text>

              {/* Dashed lines to axes */}
              <line
                x1={dataToSvgX(inputVal)}
                y1={dataToSvgY(
                  Math.max(yRange[0], Math.min(yRange[1], outputVal)),
                  yRange[0],
                  yRange[1]
                )}
                x2={dataToSvgX(inputVal)}
                y2={dataToSvgY(0, yRange[0], yRange[1])}
                stroke={act.color}
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity={0.4}
              />
            </svg>

            {/* Slider */}
            <div className="space-y-2 max-w-md mx-auto">
              <label className="text-sm font-medium text-muted">
                Đầu vào x ={" "}
                <strong className="text-foreground">
                  {inputVal.toFixed(1)}
                </strong>
                {" → "}
                f(x) ={" "}
                <strong style={{ color: act.color }}>
                  {outputVal.toFixed(4)}
                </strong>
                {showDeriv && (
                  <>
                    {" | "}
                    f&apos;(x) ={" "}
                    <strong className="text-foreground/70">
                      {derivVal.toFixed(4)}
                    </strong>
                  </>
                )}
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={inputVal}
                onChange={(e) =>
                  setInputVal(parseFloat(e.target.value))
                }
                className="w-full accent-accent"
              />
            </div>

            {/* Info card */}
            <div className="rounded-lg bg-background/50 border border-border p-4 text-sm text-foreground/80 space-y-1">
              <p>
                <strong style={{ color: act.color }}>{act.label}:</strong>{" "}
                Khoảng giá trị: {act.range}
              </p>
              <LaTeX block>{act.formula}</LaTeX>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Hàm kích hoạt</strong>{" "}
            là &quot;công tắc&quot; của nơ-ron — nó quyết định tín hiệu có được
            chuyển tiếp hay không, và chuyển bao nhiêu. Giống như bảo vệ quán karaoke:
            ReLU chỉ cho vào nếu bạn đủ tuổi (x &gt; 0), Sigmoid cho vào nhưng hạn chế
            số người (nén về 0-1).
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: VANISHING GRADIENT DEMO ===== */}
      <LessonSection step={4} totalSteps={8} label="Thí nghiệm">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          Đây là lý do sigmoid gặp vấn đề ở lớp ẩn. Khi tín hiệu đi qua sigmoid nhiều lần,
          nó bị &quot;nén&quot; dần về 0.5 — gradient gần bằng 0, mạng không thể học!
        </p>
        <VisualizationSection>
          <div className="space-y-3">
            <p className="text-xs text-center text-muted">
              Xem giá trị thay đổi khi đi qua sigmoid 8 lần liên tiếp
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 text-foreground font-semibold">
                      Đầu vào
                    </th>
                    {Array.from({ length: 9 }, (_, i) => (
                      <th
                        key={i}
                        className="py-2 px-2 text-foreground font-semibold text-center"
                      >
                        {i === 0 ? "x" : `σ×${i}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chainResults.map((chain, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border/50"
                    >
                      <td className="py-2 pr-3 font-medium text-foreground">
                        x = {chainInputs[idx]}
                      </td>
                      {chain.map((val, i) => {
                        const opacity = 1 - (i / chain.length) * 0.6;
                        const isConverging =
                          i > 0 && Math.abs(val - 0.5) < 0.01;
                        return (
                          <td
                            key={i}
                            className="py-2 px-2 text-center"
                            style={{
                              color: isConverging
                                ? "#ef4444"
                                : "#3b82f6",
                              opacity,
                            }}
                          >
                            {val.toFixed(3)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-center text-red-400">
              Mọi giá trị đều hội tụ về 0.5 — gradient gần bằng 0!
              Đây là vấn đề &quot;triệt tiêu gradient&quot;.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 5: INLINE CHALLENGE ===== */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Nơ-ron dùng ReLU luôn nhận đầu vào âm (ví dụ: z = -3). Điều gì xảy ra?"
          options={[
            "Đầu ra = -3 và gradient = 1 — học bình thường",
            "Đầu ra = 0 và gradient = 0 — nơ-ron 'chết' vĩnh viễn",
            "Đầu ra = 0.5 — ReLU trung bình hóa",
          ]}
          correct={1}
          explanation="ReLU(x<0) = 0 và gradient = 0. Nơ-ron không bao giờ cập nhật được trọng số nữa — gọi là 'dying ReLU'. Leaky ReLU giải quyết bằng f(x) = 0.01x khi x < 0."
        />
      </LessonSection>

      {/* ===== STEP 6: EXPLANATION ===== */}
      <LessonSection step={6} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Hàm kích hoạt (Activation Function)</strong>{" "}
            thêm tính phi tuyến vào mạng. Không có nó, dù mạng bao nhiêu lớp cũng chỉ
            tương đương một phép biến đổi tuyến tính.
          </p>

          <p>
            <strong>Bảng so sánh hàm kích hoạt phổ biến:</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Hàm
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Khoảng
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Dùng ở
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Nhược điểm
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">ReLU</td>
                  <td className="py-2 pr-3">[0, +∞)</td>
                  <td className="py-2 pr-3">Lớp ẩn (mặc định)</td>
                  <td className="py-2">Dying neuron</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Sigmoid</td>
                  <td className="py-2 pr-3">(0, 1)</td>
                  <td className="py-2 pr-3">Đầu ra nhị phân</td>
                  <td className="py-2">Triệt tiêu gradient</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Tanh</td>
                  <td className="py-2 pr-3">(-1, 1)</td>
                  <td className="py-2 pr-3">RNN, LSTM</td>
                  <td className="py-2">Triệt tiêu gradient</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Leaky ReLU</td>
                  <td className="py-2 pr-3">(-∞, +∞)</td>
                  <td className="py-2 pr-3">Lớp ẩn</td>
                  <td className="py-2">Hệ số alpha cần chọn</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">Softmax</td>
                  <td className="py-2 pr-3">(0, 1), tổng = 1</td>
                  <td className="py-2 pr-3">Đầu ra đa lớp</td>
                  <td className="py-2">Chỉ dùng ở lớp cuối</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="tip" title="Quy tắc chọn hàm kích hoạt">
            Lớp ẩn: bắt đầu với <strong>ReLU</strong>. Đầu ra nhị phân: <strong>sigmoid</strong>.
            Đầu ra đa lớp: <strong>softmax</strong>. Hồi quy: <strong>không kích hoạt</strong>{" "}
            (tuyến tính). GELU đang phổ biến trong Transformer (GPT, BERT).
          </Callout>

          <CodeBlock language="python" title="activation_demo.py">
{`import torch
import torch.nn.functional as F

x = torch.tensor([-2.0, -1.0, 0.0, 1.0, 2.0])

print(F.relu(x))        # [0, 0, 0, 1, 2]
print(torch.sigmoid(x)) # [0.12, 0.27, 0.50, 0.73, 0.88]
print(torch.tanh(x))    # [-0.96, -0.76, 0.00, 0.76, 0.96]

# Trong mạng nơ-ron:
model = torch.nn.Sequential(
    torch.nn.Linear(784, 256),
    torch.nn.ReLU(),          # hàm kích hoạt sau mỗi lớp ẩn
    torch.nn.Linear(256, 10),
    torch.nn.Softmax(dim=1),  # softmax cho phân loại 10 lớp
)`}
          </CodeBlock>

          <Callout variant="insight" title="GELU — xu hướng mới">
            GELU (Gaussian Error Linear Unit) kết hợp ưu điểm của ReLU và sigmoid,
            được dùng trong GPT và BERT. Thay vì cắt cứng tại 0 như ReLU,
            GELU &quot;mềm mại&quot; hơn: các giá trị gần 0 được cho qua một phần.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Hàm kích hoạt — Điểm chốt"
          points={[
            "Hàm kích hoạt thêm tính phi tuyến — không có nó, nhiều lớp vẫn chỉ là một phép tuyến tính.",
            "ReLU là mặc định cho lớp ẩn: nhanh, gradient ổn định ở vùng dương, nhưng có thể gây dying neuron.",
            "Sigmoid (0-1) cho phân loại nhị phân, Softmax cho phân loại đa lớp, Tanh cho RNN.",
            "Triệt tiêu gradient: sigmoid/tanh nén gradient về ~0 ở vùng bão hòa, gây khó huấn luyện mạng sâu.",
            "GELU đang thay thế ReLU trong Transformer hiện đại (GPT, BERT).",
          ]}
        />
      </LessonSection>

      {/* ===== STEP 8: QUIZ ===== */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
