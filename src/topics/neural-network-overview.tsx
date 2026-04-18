"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
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

export const metadata: TopicMeta = {
  slug: "neural-network-overview",
  title: "Neural Network Overview",
  titleVi: "Tổng quan mạng nơ-ron — Bộ não nhân tạo",
  description:
    "Cái nhìn toàn cảnh về mạng nơ-ron nhân tạo: từ cấu trúc, cách học, đến các kiến trúc phổ biến nhất.",
  category: "foundations",
  tags: ["neural-network", "overview", "deep-learning", "architecture"],
  difficulty: "beginner",
  relatedSlugs: ["perceptron", "mlp", "backpropagation", "activation-functions"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

/* ──────────────────────────────────────────────────────────────
 * Kiến trúc mạng nơ-ron 3-4-2 (Input 3 → Hidden 4 → Output 2)
 * ────────────────────────────────────────────────────────────── */
const LAYER_SIZES = [3, 4, 2] as const;
const INPUT_SIZE = LAYER_SIZES[0];
const HIDDEN_SIZE = LAYER_SIZES[1];
const OUTPUT_SIZE = LAYER_SIZES[2];

type LayerIndex = 0 | 1 | 2;

interface NeuronId {
  layer: LayerIndex;
  index: number;
}

/** Trọng số được khởi tạo cố định (deterministic) để demo hoạt động nhất quán. */
function makeWeights(
  rows: number,
  cols: number,
  seed: number,
): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      // Pseudo-random nhưng deterministic: xoay quanh khoảng [-1, 1]
      const s = Math.sin((r + 1) * 12.9898 + (c + 1) * 78.233 + seed) * 43758.5453;
      const v = s - Math.floor(s); // phần thập phân trong [0,1)
      row.push(+(v * 2 - 1).toFixed(2));
    }
    out.push(row);
  }
  return out;
}

const W1: number[][] = makeWeights(HIDDEN_SIZE, INPUT_SIZE, 7); // [4 × 3]
const B1: number[] = [0.1, -0.2, 0.05, 0.15];
const W2: number[][] = makeWeights(OUTPUT_SIZE, HIDDEN_SIZE, 11); // [2 × 4]
const B2: number[] = [0.0, 0.2];

function relu(x: number): number {
  return x > 0 ? x : 0;
}

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

interface ForwardPass {
  input: number[];
  z1: number[];
  a1: number[];
  z2: number[];
  a2: number[];
}

function forwardPass(inputs: number[]): ForwardPass {
  const z1: number[] = [];
  const a1: number[] = [];
  for (let j = 0; j < HIDDEN_SIZE; j++) {
    let sum = B1[j];
    for (let i = 0; i < INPUT_SIZE; i++) {
      sum += W1[j][i] * inputs[i];
    }
    z1.push(+sum.toFixed(3));
    a1.push(+relu(sum).toFixed(3));
  }
  const z2: number[] = [];
  for (let k = 0; k < OUTPUT_SIZE; k++) {
    let sum = B2[k];
    for (let j = 0; j < HIDDEN_SIZE; j++) {
      sum += W2[k][j] * a1[j];
    }
    z2.push(+sum.toFixed(3));
  }
  const a2 = softmax(z2).map((v) => +v.toFixed(3));
  return { input: inputs, z1, a1, z2, a2 };
}

/* Toạ độ hiển thị của từng neuron trong SVG. */
const SVG_WIDTH = 640;
const SVG_HEIGHT = 360;
const LAYER_X = [110, 320, 540] as const;

function neuronY(layer: LayerIndex, index: number): number {
  const size = LAYER_SIZES[layer];
  const step = 70;
  const total = (size - 1) * step;
  const startY = SVG_HEIGHT / 2 - total / 2;
  return startY + index * step;
}

function neuronFill(layer: LayerIndex): string {
  if (layer === 0) return "#3b82f6";
  if (layer === 1) return "#f59e0b";
  return "#22c55e";
}

function sameNeuron(a: NeuronId | null, b: NeuronId): boolean {
  if (!a) return false;
  return a.layer === b.layer && a.index === b.index;
}

function isConnectionHighlighted(
  selected: NeuronId | null,
  from: NeuronId,
  to: NeuronId,
): boolean {
  if (!selected) return false;
  if (sameNeuron(selected, from)) return true;
  if (sameNeuron(selected, to)) return true;
  return false;
}

function weightColor(w: number): string {
  // Weight dương → xanh dương. Weight âm → đỏ. Độ đậm theo |w|.
  const magnitude = Math.min(1, Math.abs(w));
  if (w >= 0) {
    const alpha = 0.25 + magnitude * 0.65;
    return `rgba(59, 130, 246, ${alpha.toFixed(2)})`;
  }
  const alpha = 0.25 + magnitude * 0.65;
  return `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
}

function activationBrightness(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0.25;
  return 0.25 + 0.75 * Math.min(1, value / maxValue);
}

export default function NeuralNetworkOverviewTopic() {
  /* ─ State ─ */
  const [x1, setX1] = useState(0.5);
  const [x2, setX2] = useState(-0.3);
  const [x3, setX3] = useState(0.8);
  const [selected, setSelected] = useState<NeuronId | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const inputs = useMemo<number[]>(() => [x1, x2, x3], [x1, x2, x3]);
  const pass = useMemo<ForwardPass>(() => forwardPass(inputs), [inputs]);

  const maxHidden = useMemo(
    () => Math.max(0.001, ...pass.a1),
    [pass.a1],
  );
  const maxOutput = useMemo(
    () => Math.max(0.001, ...pass.a2),
    [pass.a2],
  );

  const onAnimate = useCallback(() => {
    setIsAnimating(true);
    setPulseKey((k) => k + 1);
    window.setTimeout(() => setIsAnimating(false), 2400);
  }, []);

  const onReset = useCallback(() => {
    setX1(0.5);
    setX2(-0.3);
    setX3(0.8);
    setSelected(null);
  }, []);

  const handleNeuronClick = useCallback(
    (id: NeuronId) => {
      setSelected((prev) => (sameNeuron(prev, id) ? null : id));
    },
    [],
  );

  /* ─ Quiz (8 câu) ─ */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Neural network 'học' bằng cách nào?",
        options: [
          "Lập trình từng quy tắc thủ công",
          "Điều chỉnh weights (trọng số) thông qua backpropagation để giảm loss — giống điều chỉnh núm âm thanh để nghe hay nhất",
          "Copy dữ liệu từ internet",
        ],
        correct: 1,
        explanation:
          "Neural network = tập hợp weights. Training = tìm weights tối ưu. Backpropagation tính gradient của loss theo từng weight → gradient descent điều chỉnh weights → loss giảm dần → model đúng dần. Như điều chỉnh 1 triệu núm âm thanh cùng lúc!",
      },
      {
        question: "Tại sao cần activation function (ReLU, sigmoid)?",
        options: [
          "Để tính nhanh hơn",
          "Không có activation → mạng chỉ là phép nhân ma trận (tuyến tính) → không học được non-linear patterns",
          "Để giảm overfitting",
        ],
        correct: 1,
        explanation:
          "Linear(Linear(x)) = Linear(x) — bao nhiêu layers cũng chỉ là 1 phép biến đổi tuyến tính. Activation function (ReLU, tanh) thêm non-linearity → mạng có thể học bất kỳ function nào (Universal Approximation Theorem). ReLU: max(0, x) — đơn giản, hiệu quả.",
      },
      {
        question: "Deep Learning khác Machine Learning thế nào?",
        options: [
          "Hoàn toàn khác nhau",
          "Deep Learning LÀ Machine Learning, nhưng dùng neural networks nhiều layers (deep) → tự học features thay vì cần feature engineering thủ công",
          "Deep Learning không cần data",
        ],
        correct: 1,
        explanation:
          "ML truyền thống: feature engineering thủ công → model. DL: raw data → neural network tự học features (layers đầu học edges, layers giữa học shapes, layers sau học concepts). Trade-off: DL cần NHIỀU data hơn nhưng không cần feature engineering.",
      },
      {
        type: "fill-blank",
        question:
          "Neural network học bằng cách chạy {blank} để tính gradient, rồi dùng gradient descent để cập nhật weights.",
        blanks: [
          { answer: "backpropagation", accept: ["lan truyền ngược", "backprop"] },
        ],
        explanation:
          "Backpropagation (lan truyền ngược) tính đạo hàm riêng của hàm loss theo từng weight bằng quy tắc chuỗi, sau đó gradient descent dùng các gradient đó để cập nhật weights theo hướng giảm loss.",
      },
      {
        question: "Forward pass tại 1 neuron tính gì?",
        options: [
          "Đạo hàm của loss theo weight",
          "Weighted sum z = Σ wᵢxᵢ + b, sau đó qua activation a = σ(z)",
          "Giá trị ngẫu nhiên",
        ],
        correct: 1,
        explanation:
          "Mỗi neuron nhận input từ layer trước, nhân từng input với weight tương ứng, cộng bias rồi qua activation. Đây là bước 'lan truyền tiến' — dữ liệu đi từ input layer → output layer.",
      },
      {
        question:
          "Một MLP có input 10, 2 hidden layers mỗi layer 100 neurons, output 2. Số parameters là bao nhiêu?",
        options: [
          "Khoảng 302",
          "Khoảng 11,302 (10·100 + 100 + 100·100 + 100 + 100·2 + 2)",
          "Khoảng 1 triệu",
        ],
        correct: 1,
        explanation:
          "Layer 1: 10·100 + 100 = 1100. Layer 2: 100·100 + 100 = 10100. Output: 100·2 + 2 = 202. Tổng 11,302. GPT-4 có ~1.8 nghìn tỷ parameters — gấp ~160 triệu lần!",
      },
      {
        question: "Kiến trúc nào phù hợp nhất cho dữ liệu hình ảnh?",
        options: [
          "MLP (fully connected)",
          "CNN (convolutional) — tận dụng cấu trúc không gian 2D",
          "RNN truyền thống",
        ],
        correct: 1,
        explanation:
          "CNN dùng kernel trượt qua ảnh, khai thác tính lân cận (local) và chia sẻ trọng số (weight sharing) → ít parameters, học tốt features không gian. MLP cho ảnh tốn quá nhiều params; RNN phù hợp sequence.",
      },
      {
        type: "fill-blank",
        question:
          "Định lý {blank} nói rằng mạng 1 hidden layer đủ rộng có thể xấp xỉ bất kỳ hàm liên tục nào.",
        blanks: [
          {
            answer: "Universal Approximation",
            accept: ["universal approximation", "xấp xỉ tổng quát"],
          },
        ],
        explanation:
          "Universal Approximation Theorem (Cybenko 1989, Hornik 1991): MLP với 1 hidden layer đủ nơ-ron có thể xấp xỉ mọi hàm liên tục trên tập compact. Nhưng trong thực tế, sâu (deep) hiệu quả hơn rộng (wide).",
      },
    ],
    [],
  );

  return (
    <>
      <div className="mb-6">
        <ProgressSteps
          current={1}
          total={TOTAL_STEPS}
          labels={[
            "Dự đoán",
            "Khám phá",
            "Khoảnh khắc Aha",
            "Thử thách",
            "Lý thuyết",
            "Tóm tắt",
            "Kiểm tra",
          ]}
        />
      </div>

      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Não con người có 86 tỷ neuron, mỗi neuron kết nối tới hàng nghìn neuron khác. Neural network nhân tạo bắt chước điều gì?"
          options={[
            "Copy chính xác bộ não sinh học",
            "Lấy ý tưởng: nhiều đơn vị đơn giản (neurons) kết nối thành mạng → xử lý thông tin phức tạp. Đơn giản hơn não rất nhiều",
            "Không liên quan gì đến não",
          ]}
          correct={1}
          explanation="Neural network lấy CẢM HỨNG từ não: nhiều neurons đơn giản kết nối thành mạng → xử lý được tác vụ phức tạp. Nhưng artificial neuron đơn giản hơn nhiều: chỉ là weighted sum + activation function. Sức mạnh đến từ SỐ LƯỢNG và cách kết nối, không phải từ độ phức tạp của từng neuron."
        >
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Ở phần tiếp theo bạn sẽ tự tay kéo các input và quan sát activation
            lan truyền qua mạng 3-4-2 — đúng như cách GPT, ResNet, AlphaGo tính
            toán, chỉ khác quy mô.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo các thanh trượt để đổi input. Click vào neuron bất kỳ để
          highlight các kết nối đi tới/đi ra. Bấm{" "}
          <strong className="text-foreground">Animate forward pass</strong>{" "}
          để xem hoạt động lan truyền theo thời gian.
        </p>
        <VisualizationSection>
          <div className="space-y-5">
            {/* Thanh điều khiển */}
            <div className="grid gap-3 rounded-xl border border-border bg-card/60 p-4 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-muted">
                <span>
                  Input x₁:{" "}
                  <strong className="text-foreground">{x1.toFixed(2)}</strong>
                </span>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={x1}
                  onChange={(e) => setX1(parseFloat(e.target.value))}
                  className="accent-blue-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                <span>
                  Input x₂:{" "}
                  <strong className="text-foreground">{x2.toFixed(2)}</strong>
                </span>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={x2}
                  onChange={(e) => setX2(parseFloat(e.target.value))}
                  className="accent-blue-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                <span>
                  Input x₃:{" "}
                  <strong className="text-foreground">{x3.toFixed(2)}</strong>
                </span>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={x3}
                  onChange={(e) => setX3(parseFloat(e.target.value))}
                  className="accent-blue-500"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={onAnimate}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                Animate forward pass
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                disabled={selected === null}
              >
                Bỏ chọn neuron
              </button>
            </div>

            {/* Sơ đồ mạng */}
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="w-full max-w-3xl mx-auto"
              role="img"
              aria-label="Sơ đồ neural network 3-4-2"
            >
              <text
                x={SVG_WIDTH / 2}
                y={20}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={13}
                fontWeight="bold"
              >
                Mạng nơ-ron 3 lớp (3-4-2) — click để highlight kết nối
              </text>

              {/* Kết nối Layer 0 → Layer 1 */}
              {Array.from({ length: INPUT_SIZE }, (_, i) =>
                Array.from({ length: HIDDEN_SIZE }, (_, j) => {
                  const from: NeuronId = { layer: 0, index: i };
                  const to: NeuronId = { layer: 1, index: j };
                  const w = W1[j][i];
                  const highlighted = isConnectionHighlighted(
                    selected,
                    from,
                    to,
                  );
                  return (
                    <motion.line
                      key={`c01-${i}-${j}-${pulseKey}`}
                      x1={LAYER_X[0] + 18}
                      y1={neuronY(0, i)}
                      x2={LAYER_X[1] - 18}
                      y2={neuronY(1, j)}
                      stroke={weightColor(w)}
                      strokeWidth={highlighted ? 3 : 1 + Math.abs(w) * 1.2}
                      opacity={highlighted ? 1 : 0.55}
                      initial={
                        isAnimating ? { pathLength: 0 } : { pathLength: 1 }
                      }
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 0.6,
                        delay: isAnimating ? 0.1 : 0,
                      }}
                    />
                  );
                }),
              )}

              {/* Kết nối Layer 1 → Layer 2 */}
              {Array.from({ length: HIDDEN_SIZE }, (_, j) =>
                Array.from({ length: OUTPUT_SIZE }, (_, k) => {
                  const from: NeuronId = { layer: 1, index: j };
                  const to: NeuronId = { layer: 2, index: k };
                  const w = W2[k][j];
                  const highlighted = isConnectionHighlighted(
                    selected,
                    from,
                    to,
                  );
                  return (
                    <motion.line
                      key={`c12-${j}-${k}-${pulseKey}`}
                      x1={LAYER_X[1] + 18}
                      y1={neuronY(1, j)}
                      x2={LAYER_X[2] - 18}
                      y2={neuronY(2, k)}
                      stroke={weightColor(w)}
                      strokeWidth={highlighted ? 3 : 1 + Math.abs(w) * 1.2}
                      opacity={highlighted ? 1 : 0.55}
                      initial={
                        isAnimating ? { pathLength: 0 } : { pathLength: 1 }
                      }
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 0.6,
                        delay: isAnimating ? 0.8 : 0,
                      }}
                    />
                  );
                }),
              )}

              {/* Neurons layer 0 (Input) */}
              {Array.from({ length: INPUT_SIZE }, (_, i) => {
                const id: NeuronId = { layer: 0, index: i };
                const val = pass.input[i];
                const highlighted = sameNeuron(selected, id);
                return (
                  <g
                    key={`n0-${i}`}
                    onClick={() => handleNeuronClick(id)}
                    className="cursor-pointer"
                  >
                    <motion.circle
                      cx={LAYER_X[0]}
                      cy={neuronY(0, i)}
                      r={highlighted ? 22 : 18}
                      fill={neuronFill(0)}
                      opacity={0.35 + Math.min(1, Math.abs(val)) * 0.55}
                      stroke={highlighted ? "#fff" : "rgba(148,163,184,0.6)"}
                      strokeWidth={highlighted ? 2.5 : 1}
                      animate={{ scale: isAnimating ? [1, 1.15, 1] : 1 }}
                      transition={{ duration: 0.4, delay: 0 }}
                    />
                    <text
                      x={LAYER_X[0]}
                      y={neuronY(0, i) + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      x{i + 1}
                    </text>
                    <text
                      x={LAYER_X[0]}
                      y={neuronY(0, i) + 35}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={9}
                    >
                      {val.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Neurons layer 1 (Hidden) */}
              {Array.from({ length: HIDDEN_SIZE }, (_, j) => {
                const id: NeuronId = { layer: 1, index: j };
                const val = pass.a1[j];
                const highlighted = sameNeuron(selected, id);
                const brightness = activationBrightness(val, maxHidden);
                return (
                  <g
                    key={`n1-${j}`}
                    onClick={() => handleNeuronClick(id)}
                    className="cursor-pointer"
                  >
                    <motion.circle
                      cx={LAYER_X[1]}
                      cy={neuronY(1, j)}
                      r={highlighted ? 22 : 18}
                      fill={neuronFill(1)}
                      opacity={brightness}
                      stroke={highlighted ? "#fff" : "rgba(148,163,184,0.6)"}
                      strokeWidth={highlighted ? 2.5 : 1}
                      animate={{ scale: isAnimating ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 0.4, delay: isAnimating ? 0.7 : 0 }}
                    />
                    <text
                      x={LAYER_X[1]}
                      y={neuronY(1, j) + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      h{j + 1}
                    </text>
                    <text
                      x={LAYER_X[1]}
                      y={neuronY(1, j) + 35}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={9}
                    >
                      a={val.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Neurons layer 2 (Output) */}
              {Array.from({ length: OUTPUT_SIZE }, (_, k) => {
                const id: NeuronId = { layer: 2, index: k };
                const val = pass.a2[k];
                const highlighted = sameNeuron(selected, id);
                const brightness = activationBrightness(val, maxOutput);
                return (
                  <g
                    key={`n2-${k}`}
                    onClick={() => handleNeuronClick(id)}
                    className="cursor-pointer"
                  >
                    <motion.circle
                      cx={LAYER_X[2]}
                      cy={neuronY(2, k)}
                      r={highlighted ? 22 : 18}
                      fill={neuronFill(2)}
                      opacity={brightness}
                      stroke={highlighted ? "#fff" : "rgba(148,163,184,0.6)"}
                      strokeWidth={highlighted ? 2.5 : 1}
                      animate={{ scale: isAnimating ? [1, 1.25, 1] : 1 }}
                      transition={{ duration: 0.4, delay: isAnimating ? 1.4 : 0 }}
                    />
                    <text
                      x={LAYER_X[2]}
                      y={neuronY(2, k) + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      y{k + 1}
                    </text>
                    <text
                      x={LAYER_X[2]}
                      y={neuronY(2, k) + 35}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={9}
                    >
                      p={val.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Nhãn lớp */}
              <text
                x={LAYER_X[0]}
                y={SVG_HEIGHT - 12}
                textAnchor="middle"
                fill="#3b82f6"
                fontSize={11}
                fontWeight="bold"
              >
                Input layer
              </text>
              <text
                x={LAYER_X[1]}
                y={SVG_HEIGHT - 12}
                textAnchor="middle"
                fill="#f59e0b"
                fontSize={11}
                fontWeight="bold"
              >
                Hidden (ReLU)
              </text>
              <text
                x={LAYER_X[2]}
                y={SVG_HEIGHT - 12}
                textAnchor="middle"
                fill="#22c55e"
                fontSize={11}
                fontWeight="bold"
              >
                Output (softmax)
              </text>
            </svg>

            {/* Ma trận trọng số W1 dạng heatmap */}
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Ma trận trọng số W₁ (4 hidden × 3 input) — màu thể hiện dấu và
                độ lớn
              </p>
              <div className="grid gap-2" style={{ gridTemplateColumns: "auto repeat(3, 1fr)" }}>
                <div />
                {Array.from({ length: INPUT_SIZE }, (_, i) => (
                  <div
                    key={`w1-head-${i}`}
                    className="text-center text-xs font-semibold text-blue-400"
                  >
                    x{i + 1}
                  </div>
                ))}
                {W1.flatMap((row, j) => [
                  <div
                    key={`w1-row-${j}`}
                    className="text-right text-xs font-semibold text-amber-400 pr-2 self-center"
                  >
                    h{j + 1}
                  </div>,
                  ...row.map((w, i) => (
                    <div
                      key={`w1-${j}-${i}`}
                      className="rounded-md px-2 py-2 text-center text-xs font-mono font-semibold text-white"
                      style={{ backgroundColor: weightColor(w) }}
                      title={`W₁[${j}][${i}] = ${w}`}
                    >
                      {w.toFixed(2)}
                    </div>
                  )),
                ])}
              </div>
            </div>

            {/* Bảng activation hiện tại */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card/60 p-4 text-xs text-muted">
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Hidden activations (sau ReLU)
                </p>
                <div className="flex flex-wrap gap-2">
                  {pass.a1.map((a, j) => (
                    <span
                      key={`ha-${j}`}
                      className="rounded-md bg-amber-500/20 px-2 py-1 font-mono text-amber-300"
                    >
                      h{j + 1}: {a.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card/60 p-4 text-xs text-muted">
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Output probabilities (softmax)
                </p>
                <div className="flex flex-wrap gap-2">
                  {pass.a2.map((p, k) => (
                    <span
                      key={`pa-${k}`}
                      className="rounded-md bg-emerald-500/20 px-2 py-1 font-mono text-emerald-300"
                    >
                      class {k + 1}: {(p * 100).toFixed(1)}%
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {selected && (
              <div className="rounded-xl border border-accent/40 bg-accent-light/40 p-4 text-xs text-muted">
                <p className="font-semibold text-foreground">
                  Đang chọn:{" "}
                  {selected.layer === 0
                    ? `Input x${selected.index + 1}`
                    : selected.layer === 1
                      ? `Hidden h${selected.index + 1}`
                      : `Output y${selected.index + 1}`}
                </p>
                <p className="mt-1">
                  Tất cả kết nối liên quan đã được làm nổi bật. Độ dày của dây
                  nói lên độ lớn của weight, màu xanh = dương, đỏ = âm.
                </p>
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Neural network chỉ là:{" "}
            <strong>
              nhiều phép nhân ma trận + các{" "}
              <TopicLink slug="activation-functions">
                activation functions
              </TopicLink>
            </strong>
            . Sức mạnh không đến từ 1 neuron mà từ{" "}
            <strong>hàng triệu neurons kết nối</strong> — giống đàn kiến: 1 con
            yếu, cả đàn làm được mọi thứ. Training = điều chỉnh hàng triệu
            &quot;núm âm thanh&quot; (weights) để output đúng!
          </p>
          <p className="mt-3">
            Khi bạn kéo slider phía trên, một sự kiện nhỏ lan truyền qua toàn
            mạng: x thay đổi → z₁ thay đổi → a₁ thay đổi → z₂ thay đổi →
            softmax → xác suất đầu ra thay đổi. Đây chính là{" "}
            <em>forward pass</em>, trái tim của mọi inference.
          </p>
        </AhaMoment>

        <Callout variant="tip" title="Tại sao có hidden layer?">
          Không có hidden layer, mạng chỉ học được các ranh giới tuyến tính.
          Hidden layer với activation phi tuyến cho phép mạng &quot;gập&quot;
          không gian đầu vào, tạo ra các biên quyết định phức tạp — chính là lý
          do MLP có thể phân loại xoắn ốc, học hàm XOR, hay nhận diện mèo.
        </Callout>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Một neural network có 3 layers, mỗi hidden layer 100 neurons, input 10, output 2. Có bao nhiêu parameters?"
          options={[
            "302 (10+100+100+100+2)",
            "10·100 + 100 + 100·100 + 100 + 100·2 + 2 = 11,302",
            "1 triệu parameters",
          ]}
          correct={1}
          explanation="Layer 1: 10·100 weights + 100 biases = 1100. Layer 2: 100·100 + 100 = 10100. Layer 3: 100·2 + 2 = 202. Tổng: 11,302 parameters. GPT-4 có ~1.8 nghìn tỷ parameters — mỗi param là 1 'núm âm thanh' cần điều chỉnh!"
        />

        <div className="mt-5">
          <InlineChallenge
            question="Nếu bỏ hết activation functions (chỉ còn Linear layers), mạng sẽ làm được gì?"
            options={[
              "Vẫn học được xấp xỉ mọi hàm như bình thường",
              "Suy biến về một phép biến đổi tuyến tính duy nhất, bất kể số layers",
              "Học nhanh hơn nhưng kém chính xác hơn",
            ]}
            correct={1}
            explanation="Linear(Linear(x)) = Linear(x). Dù có 1000 layers linear liên tiếp, toàn bộ mạng chỉ tương đương một phép nhân ma trận W_total cộng bias — nghĩa là chỉ học được ranh giới tuyến tính. Activation phi tuyến (ReLU/tanh/sigmoid) phá vỡ tính chất này."
          />
        </div>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Neural Network</strong> là mô hình gồm nhiều layers neurons
            kết nối, học bằng cách điều chỉnh weights để giảm loss. Đơn vị cơ
            bản nhất là <TopicLink slug="perceptron">perceptron</TopicLink>;
            xếp chồng nhiều lớp tạo thành <TopicLink slug="mlp">MLP</TopicLink>.
          </p>

          <p>
            <strong>Forward pass (1 neuron):</strong>
          </p>
          <LaTeX block>
            {"z = \\sum_{i=1}^{n} w_i x_i + b \\quad \\text{(weighted sum)}"}
          </LaTeX>
          <LaTeX block>
            {"a = \\sigma(z) \\quad \\text{(activation: ReLU, sigmoid, tanh)}"}
          </LaTeX>

          <p>
            <strong>Forward pass (ma trận cho cả lớp):</strong>
          </p>
          <LaTeX block>
            {"\\mathbf{z}^{(l)} = W^{(l)} \\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)}, \\quad \\mathbf{a}^{(l)} = \\sigma(\\mathbf{z}^{(l)})"}
          </LaTeX>

          <p>
            <strong>Training loop:</strong>
          </p>
          <LaTeX block>
            {"\\theta_{t+1} = \\theta_t - \\eta \\cdot \\nabla_\\theta \\mathcal{L}(\\theta)"}
          </LaTeX>

          <p>
            Quá trình tính gradient được thực hiện bởi{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink>, kết
            hợp với{" "}
            <TopicLink slug="supervised-unsupervised-rl">
              học có giám sát
            </TopicLink>{" "}
            để điều chỉnh weights từ dữ liệu có nhãn.
          </p>

          <Callout variant="tip" title="Universal Approximation Theorem">
            Neural network với 1 hidden layer đủ rộng có thể xấp xỉ BẤT KỲ hàm
            liên tục nào. Nhưng trong thực tế, nhiều layers (deep) hiệu quả
            hơn: mỗi layer học mức abstraction cao hơn (edges → shapes →
            objects).
          </Callout>

          <Callout variant="warning" title="Vấn đề vanishing/exploding gradient">
            Khi mạng rất sâu, gradient khi backprop có thể teo về 0 (vanishing)
            hoặc phình to vô tận (exploding). Kỹ thuật chống: ReLU thay
            sigmoid, batch normalization, residual connections (ResNet),
            LayerNorm, khởi tạo Kaiming/Xavier.
          </Callout>

          <p>
            <strong>Các kiến trúc phổ biến:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>MLP:</strong> Fully connected. Tốt cho tabular data.
            </li>
            <li>
              <strong>CNN:</strong> Convolution + pooling. Tốt cho ảnh, video,
              âm thanh (spectrogram).
            </li>
            <li>
              <strong>RNN/LSTM/GRU:</strong> Recurrence. Tốt cho sequence
              (trước khi Transformer lên ngôi).
            </li>
            <li>
              <strong>Transformer:</strong> Self-attention. Tốt cho text,
              multimodal — kiến trúc chủ đạo hiện nay.
            </li>
            <li>
              <strong>GNN:</strong> Graph neural network. Tốt cho dữ liệu cấu
              trúc đồ thị (mạng xã hội, phân tử).
            </li>
          </ul>

          <CodeBlock
            language="python"
            title="Neural Network cơ bản với PyTorch"
          >
{`import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleNN(nn.Module):
    """MLP 3 lớp cho bài toán phân loại."""

    def __init__(self, input_size: int = 10, hidden: int = 100, output: int = 2) -> None:
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden)
        self.fc2 = nn.Linear(hidden, hidden)
        self.fc3 = nn.Linear(hidden, output)
        self.dropout = nn.Dropout(p=0.2)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, input_size)
        h1 = F.relu(self.fc1(x))          # Layer 1 + ReLU
        h1 = self.dropout(h1)              # Regularization
        h2 = F.relu(self.fc2(h1))          # Layer 2 + ReLU
        logits = self.fc3(h2)              # Output (chưa softmax)
        return logits


model = SimpleNN()
num_params = sum(p.numel() for p in model.parameters())
print(f"Tổng parameters: {num_params:,}")  # 11,302

# Hàm loss và optimizer
criterion = nn.CrossEntropyLoss()           # softmax + NLL
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# Vòng lặp huấn luyện
for epoch in range(100):
    # ─── Forward pass ───
    logits = model(X_train)
    loss = criterion(logits, y_train)

    # ─── Backward pass (backpropagation) ───
    optimizer.zero_grad()
    loss.backward()

    # ─── Cập nhật weights ───
    optimizer.step()

    if epoch % 10 == 0:
        acc = (logits.argmax(dim=1) == y_train).float().mean()
        print(f"epoch={epoch:3d} loss={loss.item():.4f} acc={acc.item():.3f}")`}
          </CodeBlock>

          <CollapsibleDetail title="Chi tiết: sự khác nhau giữa logits, softmax, cross-entropy">
            <p className="text-sm leading-relaxed">
              <strong>Logits</strong> là output thô của lớp cuối (chưa qua
              softmax), có thể âm/dương/lớn bé tùy ý.{" "}
              <strong>Softmax</strong> biến logits thành phân phối xác suất:{" "}
              <LaTeX>
                {"p_k = \\frac{e^{z_k}}{\\sum_j e^{z_j}}"}
              </LaTeX>
              . <strong>Cross-entropy loss</strong> đo khoảng cách giữa phân
              phối dự đoán và nhãn thật:{" "}
              <LaTeX>
                {"\\mathcal{L} = -\\sum_k y_k \\log p_k"}
              </LaTeX>
              . Trong PyTorch,{" "}
              <code className="rounded bg-surface px-1 text-xs">
                nn.CrossEntropyLoss
              </code>{" "}
              gộp softmax + log + NLL thành một bước (ổn định số học hơn), nên
              bạn truyền logits chứ không truyền softmax.
            </p>
          </CollapsibleDetail>

          <CodeBlock
            language="python"
            title="Tự tay viết forward pass bằng NumPy (không dùng framework)"
          >
{`import numpy as np

# ─── Ma trận trọng số và bias ───
# Input 3 → Hidden 4 → Output 2
rng = np.random.default_rng(seed=42)
W1 = rng.standard_normal((4, 3)) * np.sqrt(2 / 3)   # Kaiming init
b1 = np.zeros(4)
W2 = rng.standard_normal((2, 4)) * np.sqrt(2 / 4)
b2 = np.zeros(2)


def relu(z: np.ndarray) -> np.ndarray:
    return np.maximum(0, z)


def softmax(z: np.ndarray) -> np.ndarray:
    shift = z - z.max(axis=-1, keepdims=True)  # chống overflow
    exps = np.exp(shift)
    return exps / exps.sum(axis=-1, keepdims=True)


def forward(x: np.ndarray) -> dict:
    """Forward pass cho 1 mẫu hoặc batch."""
    z1 = x @ W1.T + b1              # (batch, 4)
    a1 = relu(z1)                    # (batch, 4)
    z2 = a1 @ W2.T + b2              # (batch, 2)
    p = softmax(z2)                  # (batch, 2)
    return {"z1": z1, "a1": a1, "z2": z2, "p": p}


# Demo
x = np.array([[0.5, -0.3, 0.8]])
out = forward(x)
print("Hidden activations:", out["a1"])
print("Probabilities:    ", out["p"])
print("Predicted class:  ", out["p"].argmax(axis=-1))`}
          </CodeBlock>

          <CollapsibleDetail title="Chi tiết: khởi tạo trọng số (weight initialization)">
            <p className="text-sm leading-relaxed">
              Khởi tạo toàn 0 là thảm hoạ: mọi neuron trong layer học giống
              nhau (symmetry problem). Khởi tạo quá lớn → exploding gradient;
              quá nhỏ → vanishing. Hai công thức kinh điển:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>
                <strong>Xavier/Glorot</strong> (tanh/sigmoid):{" "}
                <LaTeX>
                  {"W \\sim \\mathcal{N}\\left(0, \\frac{2}{n_{in}+n_{out}}\\right)"}
                </LaTeX>
              </li>
              <li>
                <strong>Kaiming/He</strong> (ReLU):{" "}
                <LaTeX>
                  {"W \\sim \\mathcal{N}\\left(0, \\frac{2}{n_{in}}\\right)"}
                </LaTeX>
              </li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              PyTorch mặc định dùng Kaiming uniform cho{" "}
              <code className="rounded bg-surface px-1 text-xs">
                nn.Linear
              </code>
              . Bias thường khởi tạo = 0.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết bổ sung">
        <ExplanationSection>
          <p>
            <strong>Từ 1 neuron đến một mạng:</strong> một perceptron đơn lẻ
            chỉ vẽ được 1 đường thẳng trong không gian đặc trưng — tương
            đương với mô hình logistic regression. Ghép nhiều perceptron song
            song trong 1 lớp, ta được một bộ các đường thẳng đồng thời. Đi
            qua activation phi tuyến, các đường đó được &quot;uốn cong&quot;
            lại. Xếp chồng thêm lớp nữa, các vùng cong đó được tái tổ hợp
            thành các vùng quyết định bất kỳ. Đây là trực giác hình học của
            deep learning.
          </p>

          <p>
            <strong>Biểu diễn bằng đồ thị tính toán:</strong> mỗi node trong
            đồ thị là một phép toán (cộng, nhân, kích hoạt), mỗi cạnh là một
            tensor. PyTorch và JAX xây đồ thị này một cách động khi bạn chạy
            forward; autograd đi ngược lại chính đồ thị đó để tính gradient.
            Điều kỳ diệu là bạn chỉ cần định nghĩa forward, framework tự lo
            backward.
          </p>

          <p>
            <strong>Regularization — chống overfitting:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>L2 (weight decay):</strong> thêm{" "}
              <LaTeX>{"\\lambda \\lVert W \\rVert^2"}</LaTeX> vào loss, kéo
              weights về 0 → model mượt hơn, ít nhạy nhiễu.
            </li>
            <li>
              <strong>Dropout:</strong> mỗi bước training, tắt ngẫu nhiên một
              tỷ lệ neurons. Mạng buộc phải phân tán &quot;kiến thức&quot; →
              giảm co-adaptation.
            </li>
            <li>
              <strong>Early stopping:</strong> theo dõi validation loss, dừng
              khi bắt đầu tăng.
            </li>
            <li>
              <strong>Data augmentation:</strong> xoay, cắt, flip ảnh để mở
              rộng tập huấn luyện ảo → model khái quát hoá tốt hơn.
            </li>
          </ul>

          <p>
            <strong>Optimizer phổ biến:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>SGD + momentum:</strong> gradient descent chuẩn, thêm
              momentum để giảm dao động.
            </li>
            <li>
              <strong>Adam:</strong> kết hợp momentum và adaptive learning
              rate — mặc định &quot;an toàn&quot; cho đa số bài toán.
            </li>
            <li>
              <strong>AdamW:</strong> Adam tách rời weight decay, được dùng
              rộng rãi trong Transformer.
            </li>
            <li>
              <strong>Lion:</strong> optimizer mới từ Google (2023), chỉ dùng
              dấu của gradient — ít bộ nhớ hơn Adam.
            </li>
          </ul>

          <Callout variant="info" title="Batch size và learning rate">
            Batch lớn ước lượng gradient chính xác hơn nhưng cần nhiều GPU
            memory; batch nhỏ có nhiều nhiễu &quot;tốt&quot; giúp thoát khỏi
            local minima phẳng. Quy tắc ngón tay cái: khi tăng batch size lên
            k lần, tăng learning rate lên khoảng √k lần (linear scaling rule
            của Facebook AI).
          </Callout>

          <p>
            <strong>Các loại bài toán và output layer tương ứng:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Phân loại nhị phân:</strong> 1 neuron output + sigmoid
              + binary cross-entropy.
            </li>
            <li>
              <strong>Phân loại nhiều lớp (loại trừ):</strong> K neurons +
              softmax + cross-entropy.
            </li>
            <li>
              <strong>Phân loại nhiều nhãn (không loại trừ):</strong> K
              neurons + sigmoid từng phần + BCE.
            </li>
            <li>
              <strong>Hồi quy:</strong> 1 hoặc nhiều neurons + không
              activation + MSE / Huber loss.
            </li>
            <li>
              <strong>Sinh dữ liệu:</strong> phụ thuộc mô hình (VAE, GAN,
              diffusion, LM) — có riêng output head đặc thù.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          points={[
            "Neural network = nhiều layers neurons. Mỗi neuron tính weighted sum z = Wx + b rồi qua activation a = σ(z).",
            "Training = backpropagation tính gradient của loss theo từng weight → gradient descent giảm loss.",
            "Activation phi tuyến (ReLU, sigmoid, tanh) là điều kiện bắt buộc để mạng học được hàm phi tuyến.",
            "Universal Approximation: 1 hidden layer đủ rộng xấp xỉ mọi hàm; thực tế deep (nhiều lớp) hiệu quả hơn wide.",
            "Số parameters = Σ(n_in·n_out + n_out). Mô hình hiện đại có hàng tỷ parameters — mỗi param là 1 nút cần học.",
            "5 kiến trúc chính: MLP (tabular), CNN (ảnh), RNN (sequence cũ), Transformer (text & multimodal), GNN (đồ thị).",
          ]}
        />

        <Callout variant="insight" title="Bạn đã nắm được">
          Hoàn tất chủ đề này nghĩa là bạn đã có bức tranh tổng quan về cách
          một neural network tính toán, học, và khái quát hoá. Hãy quay lại
          bài này bất cứ khi nào cần ôn lại bức tranh lớn.
        </Callout>

        <Callout variant="info" title="Tiếp theo học gì?">
          Sau chủ đề này, hãy đi sâu vào{" "}
          <TopicLink slug="backpropagation">backpropagation</TopicLink> để hiểu
          CÁCH gradient được tính, rồi xem{" "}
          <TopicLink slug="activation-functions">
            activation functions
          </TopicLink>{" "}
          để biết vì sao ReLU thống trị, và cuối cùng là{" "}
          <TopicLink slug="mlp">MLP</TopicLink> cùng các kiến trúc con.
        </Callout>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
