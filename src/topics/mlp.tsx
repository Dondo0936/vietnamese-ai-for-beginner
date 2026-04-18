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

export const metadata: TopicMeta = {
  slug: "mlp",
  title: "Multi-Layer Perceptron",
  titleVi: "Mạng nơ-ron nhiều lớp",
  description:
    "Kiến trúc mạng nơ-ron cơ bản với nhiều lớp, cho phép giải quyết các bài toán phi tuyến tính.",
  category: "neural-fundamentals",
  tags: ["neural-network", "deep-learning", "architecture"],
  difficulty: "beginner",
  relatedSlugs: [
    "perceptron",
    "activation-functions",
    "forward-propagation",
    "backpropagation",
  ],
  vizType: "interactive",
};

/* ───────────── math helpers ───────────── */
const SVG_W = 560;
const SVG_H = 320;
const XOR_SVG = 260;

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function relu(x: number) {
  return Math.max(0, x);
}

function tanh(x: number) {
  return Math.tanh(x);
}

/** Compute node positions for a given layer config */
function computePositions(layers: number[]) {
  return layers.map((count, layerIdx) => {
    const layerX = 70 + layerIdx * (420 / (layers.length - 1));
    return Array.from({ length: count }, (_, nodeIdx) => {
      const totalH = (count - 1) * 52;
      const startY = SVG_H / 2 - totalH / 2;
      return { x: layerX, y: startY + nodeIdx * 52 };
    });
  });
}

/** XOR ground truth */
const XOR_DATA = [
  { x: 0, y: 0, label: 0 },
  { x: 0, y: 1, label: 1 },
  { x: 1, y: 0, label: 1 },
  { x: 1, y: 1, label: 0 },
];

/** Decision surface for a single perceptron (linear) */
function linearDecision(x: number, y: number, w1: number, w2: number, b: number) {
  return sigmoid(w1 * x + w2 * y + b);
}

/** Decision surface for a tiny MLP with 2 hidden units (tanh) solving XOR */
function xorMLP(x: number, y: number) {
  // Fixed weights that actually solve XOR
  const h1 = tanh(20 * x + 20 * y - 10);   // OR gate approximation
  const h2 = tanh(-20 * x - 20 * y + 30);  // NAND gate approximation
  return sigmoid(20 * h1 + 20 * h2 - 30);
}

/** Sample points of the sine curve for universal approximation demo */
function sineTargets(n = 80) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x = -Math.PI + (2 * Math.PI * i) / (n - 1);
    pts.push({ x, y: Math.sin(x) });
  }
  return pts;
}

/**
 * A hand-tuned MLP (1 hidden layer, K ReLU units) that roughly
 * approximates sin(x) on [-π, π] using piecewise linear bumps.
 * More hidden units → tighter fit.
 */
function approxSine(x: number, hiddenUnits: number) {
  // Use evenly spaced "bumps" across [-π, π]
  let sum = 0;
  const L = -Math.PI;
  const R = Math.PI;
  for (let k = 0; k < hiddenUnits; k++) {
    const center = L + ((R - L) * (k + 0.5)) / hiddenUnits;
    const width = (R - L) / hiddenUnits;
    // Triangle bump around center, height = sin(center)
    const v = relu(1 - Math.abs(x - center) / width);
    sum += v * Math.sin(center);
  }
  return sum;
}

/* ───────────── main component ───────────── */
export default function MLPTopic() {
  /* Visualization state */
  const [layers, setLayers] = useState([2, 3, 3, 1]);
  const [inputVals, setInputVals] = useState([0.6, 0.9]);
  const [propagated, setPropagated] = useState(false);
  const [activeLayer, setActiveLayer] = useState(-1);
  const [hoveredNode, setHoveredNode] = useState<{
    layer: number;
    node: number;
  } | null>(null);

  /* XOR demo state */
  const [xorMode, setXorMode] = useState<"perceptron" | "mlp">("perceptron");
  // Perceptron weights the user can tweak to try (and fail) to solve XOR
  const [pW1, setPW1] = useState(1);
  const [pW2, setPW2] = useState(1);
  const [pB, setPB] = useState(-0.5);

  /* Universal approximation state */
  const [hiddenUnits, setHiddenUnits] = useState(10);

  /* Architecture playground state */
  const [taskType, setTaskType] = useState<"tabular" | "image" | "sequence" | "tiny">("tabular");

  // Random but stable weights (seeded by layer structure)
  const weights = useMemo(() => {
    const w: number[][][] = [];
    let seed = 42;
    const nextRand = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed / 2147483647) * 2 - 1;
    };
    for (let l = 0; l < layers.length - 1; l++) {
      w[l] = [];
      for (let i = 0; i < layers[l]; i++) {
        w[l][i] = [];
        for (let j = 0; j < layers[l + 1]; j++) {
          w[l][i][j] = parseFloat((nextRand() * 0.8).toFixed(3));
        }
      }
    }
    return w;
  }, [layers]);

  // Forward pass computation
  const activations = useMemo(() => {
    const acts: number[][] = [inputVals.slice(0, layers[0])];
    for (let l = 0; l < layers.length - 1; l++) {
      const prev = acts[l];
      const next: number[] = [];
      for (let j = 0; j < layers[l + 1]; j++) {
        let sum = 0.1; // bias
        for (let i = 0; i < layers[l]; i++) {
          sum += (prev[i] ?? 0) * (weights[l]?.[i]?.[j] ?? 0);
        }
        next.push(l === layers.length - 2 ? sigmoid(sum) : relu(sum));
      }
      acts.push(next);
    }
    return acts;
  }, [inputVals, layers, weights]);

  const positions = useMemo(() => computePositions(layers), [layers]);

  const propagate = useCallback(() => {
    setPropagated(false);
    setActiveLayer(0);
    let layer = 0;
    const interval = setInterval(() => {
      layer++;
      if (layer >= layers.length) {
        clearInterval(interval);
        setPropagated(true);
        return;
      }
      setActiveLayer(layer);
    }, 500);
  }, [layers]);

  const layerLabels = (idx: number) => {
    if (idx === 0) return "Đầu vào";
    if (idx === layers.length - 1) return "Đầu ra";
    return `Ẩn ${idx}`;
  };

  /* ── Precompute XOR decision surface ── */
  const xorGrid = useMemo(() => {
    const N = 30;
    const cells: { x: number; y: number; val: number }[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const xv = i / (N - 1);
        const yv = j / (N - 1);
        const val =
          xorMode === "perceptron"
            ? linearDecision(xv, yv, pW1, pW2, pB)
            : xorMLP(xv, yv);
        cells.push({ x: xv, y: yv, val });
      }
    }
    return cells;
  }, [xorMode, pW1, pW2, pB]);

  /* ── Precompute sine approximation curves ── */
  const sineCurves = useMemo(() => {
    const targets = sineTargets(100);
    const approx = targets.map(({ x }) => ({
      x,
      y: approxSine(x, hiddenUnits),
    }));
    return { targets, approx };
  }, [hiddenUnits]);

  const sineMSE = useMemo(() => {
    const { targets, approx } = sineCurves;
    let sum = 0;
    for (let i = 0; i < targets.length; i++) {
      const d = targets[i].y - approx[i].y;
      sum += d * d;
    }
    return sum / targets.length;
  }, [sineCurves]);

  /* ── Architecture recommendation ── */
  const archRecommendation = useMemo(() => {
    switch (taskType) {
      case "tabular":
        return {
          layers: "2–3 lớp ẩn",
          width: "64–256 nơ-ron mỗi lớp",
          activation: "ReLU hoặc GELU",
          note: "MLP là lựa chọn chuẩn cho dữ liệu bảng (số, hạng mục mã hoá). Không cần sâu.",
          color: "#22c55e",
        };
      case "image":
        return {
          layers: "MLP KHÔNG tối ưu — cần CNN",
          width: "MLP mất tính cục bộ không gian",
          activation: "ReLU với CNN",
          note: "Ảnh có cấu trúc không gian 2D. Flatten rồi đưa vào MLP sẽ vỡ pattern — dùng Conv2D.",
          color: "#ef4444",
        };
      case "sequence":
        return {
          layers: "MLP KHÔNG tối ưu — cần RNN/Transformer",
          width: "MLP coi mọi bước thời gian độc lập",
          activation: "GELU với Transformer",
          note: "Chuỗi có phụ thuộc thứ tự. Dùng LSTM, GRU hoặc Attention thay vì MLP thuần.",
          color: "#f59e0b",
        };
      case "tiny":
        return {
          layers: "1 lớp ẩn là đủ",
          width: "8–32 nơ-ron",
          activation: "tanh hoặc ReLU",
          note: "Dataset nhỏ (dưới vài nghìn mẫu) dễ overfitting. Giữ mạng nhỏ, thêm dropout.",
          color: "#8b5cf6",
        };
    }
  }, [taskType]);

  /* ── Preset architectures ── */
  const applyPreset = useCallback(
    (preset: "shallow" | "deep" | "wide" | "pyramid") => {
      if (preset === "shallow") setLayers([2, 4, 1]);
      else if (preset === "deep") setLayers([2, 3, 3, 3, 3, 1]);
      else if (preset === "wide") setLayers([2, 8, 1]);
      else if (preset === "pyramid") setLayers([2, 6, 4, 2, 1]);
      setPropagated(false);
      setActiveLayer(-1);
    },
    []
  );

  /* ── Count parameters ── */
  const paramCount = useMemo(() => {
    let total = 0;
    for (let l = 0; l < layers.length - 1; l++) {
      total += layers[l] * layers[l + 1]; // weights
      total += layers[l + 1]; // biases
    }
    return total;
  }, [layers]);

  // Reset propagation when layers change
  useEffect(() => {
    setPropagated(false);
    setActiveLayer(-1);
  }, [layers]);

  /* ───────────── Quiz ───────────── */
  const quizQuestions: QuizQuestion[] = [
    {
      question: "Tại sao MLP cần hàm kích hoạt phi tuyến giữa các lớp?",
      options: [
        "Để tăng tốc độ tính toán",
        "Nếu không, nhiều lớp tuyến tính xếp chồng vẫn chỉ là một phép tuyến tính",
        "Để giảm số lượng trọng số",
        "Hàm kích hoạt là tùy chọn, không bắt buộc",
      ],
      correct: 1,
      explanation:
        "Tổ hợp nhiều phép biến đổi tuyến tính vẫn chỉ là một phép tuyến tính duy nhất. Hàm kích hoạt phi tuyến phá vỡ tính tuyến tính, cho phép mạng biểu diễn ranh giới phức tạp.",
    },
    {
      question:
        "Một MLP có 784 đầu vào, 2 lớp ẩn (128 và 64 nơ-ron), 10 đầu ra. Lớp nào có nhiều trọng số nhất?",
      options: [
        "Lớp ẩn 1 đến lớp ẩn 2 (128 × 64)",
        "Đầu vào đến lớp ẩn 1 (784 × 128)",
        "Lớp ẩn 2 đến đầu ra (64 × 10)",
        "Tất cả bằng nhau",
      ],
      correct: 1,
      explanation:
        "784 × 128 = 100.352 trọng số, lớn nhất. Đây là lý do lớp đầu tiên thường chiếm phần lớn tham số trong MLP.",
    },
    {
      question: "'Fully connected' nghĩa là gì trong ngữ cảnh MLP?",
      options: [
        "Mỗi nơ-ron kết nối với tất cả nơ-ron ở mọi lớp khác",
        "Mỗi nơ-ron ở lớp trước kết nối với mỗi nơ-ron ở lớp kế tiếp",
        "Tất cả trọng số có cùng giá trị",
        "Mạng được huấn luyện trên toàn bộ dữ liệu",
      ],
      correct: 1,
      explanation:
        "Fully connected chỉ kết nối giữa hai lớp liền kề: mỗi nơ-ron lớp l kết nối với mọi nơ-ron lớp l+1, không phải mọi lớp.",
    },
    {
      question:
        "Bài toán XOR cho thấy điều gì về perceptron đơn lẻ?",
      options: [
        "Perceptron học chậm hơn MLP",
        "Perceptron không thể vẽ ranh giới phi tuyến, XOR cần ít nhất 1 lớp ẩn",
        "Perceptron cần nhiều dữ liệu hơn",
        "Perceptron chỉ cần learning rate nhỏ hơn",
      ],
      correct: 1,
      explanation:
        "Năm 1969, Minsky và Papert chỉ ra perceptron đơn không giải được XOR — một điểm chết đối với AI thời đó. MLP với 1 lớp ẩn 2 nơ-ron đã giải được, mở đường cho deep learning.",
    },
    {
      question:
        "Universal Approximation Theorem nói gì?",
      options: [
        "Mọi mạng MLP đều hội tụ về nghiệm tối ưu",
        "Một MLP với đủ nơ-ron ẩn có thể xấp xỉ hầu hết hàm liên tục trên tập compact với độ chính xác tuỳ ý",
        "MLP luôn tốt hơn mọi mô hình khác",
        "Tăng chiều sâu luôn tăng độ chính xác",
      ],
      correct: 1,
      explanation:
        "Định lý Cybenko (1989) và Hornik (1991): MLP với 1 lớp ẩn đủ rộng có thể xấp xỉ bất kỳ hàm liên tục nào trên tập compact. Tuy nhiên định lý không nói cách học trọng số — và thường sâu hiệu quả hơn rộng.",
    },
    {
      question: "Depth vs Width: khi nào nên tăng chiều sâu thay vì chiều rộng?",
      options: [
        "Luôn luôn — sâu hơn bao giờ cũng tốt hơn",
        "Khi cần học đặc trưng phân cấp (hierarchical), mỗi lớp xây trên lớp trước",
        "Không bao giờ — rộng đơn giản hơn",
        "Khi dữ liệu rất nhỏ",
      ],
      correct: 1,
      explanation:
        "Sâu giúp học đặc trưng theo cấp (lớp thấp: cạnh, lớp cao: hình dạng). Với dữ liệu nhỏ, sâu dễ overfit — rộng 1 lớp có thể đủ theo Universal Approximation Theorem.",
    },
    {
      type: "code",
      question: "Hoàn thiện đoạn code định nghĩa MLP 3 lớp ẩn với ReLU bằng PyTorch:",
      codeTemplate: `import torch.nn as nn

class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(784, 256),
            nn.___(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 10),
        )`,
      language: "python",
      blanks: [{ answer: "ReLU" }],
      explanation:
        "nn.ReLU() là hàm kích hoạt phi tuyến bắt buộc giữa các lớp tuyến tính. Thiếu nó, toàn bộ mạng dù có bao nhiêu lớp cũng chỉ là một phép biến đổi tuyến tính duy nhất.",
    },
    {
      question:
        "Tại sao MLP KHÔNG phù hợp với dữ liệu ảnh dù Universal Approximation Theorem nói nó có thể xấp xỉ mọi hàm?",
      options: [
        "MLP không đủ nhanh",
        "MLP mất tính cục bộ không gian: flatten ảnh 28×28 thành 784 vector, pixel kề nhau không còn 'gần'; CNN giữ cấu trúc này tốt hơn với ít tham số hơn",
        "Universal Approximation chỉ áp dụng cho văn bản",
        "MLP không hỗ trợ GPU",
      ],
      correct: 1,
      explanation:
        "Định lý nói 'có tồn tại' trọng số đủ tốt, chưa chắc học được trong thực tế. CNN sử dụng inductive bias về không gian (trọng số chia sẻ, cục bộ) nên học hiệu quả hơn nhiều trên ảnh với ít tham số.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={9} label="Dự đoán">
        <PredictionGate
          question="Một perceptron đơn lẻ chỉ vẽ được đường thẳng để phân loại. Muốn phân loại hình xoắn ốc (spiral), bạn cần gì?"
          options={[
            "Một Perceptron với learning rate lớn hơn",
            "Nhiều Perceptron xếp thành nhiều lớp",
            "Huấn luyện lâu hơn trên cùng Perceptron",
            "Dùng dữ liệu nhiều hơn",
          ]}
          correct={1}
          explanation="Chính xác! Xếp nhiều perceptron thành nhiều lớp tạo ra MLP — mạng có thể vẽ ranh giới cong phức tạp tùy ý."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Bạn đã nắm ý tưởng cốt lõi. Bây giờ hãy tự tay{" "}
            <strong className="text-foreground">xây dựng</strong> một MLP và xem dữ
            liệu chảy qua từng lớp — quá trình đó gọi là{" "}
            <TopicLink slug="forward-propagation">lan truyền tiến</TopicLink>.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: BUILD YOUR OWN MLP ===== */}
      <LessonSection step={2} totalSteps={9} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <p className="text-sm text-muted text-center">
              Thay đổi giá trị đầu vào, rồi nhấn{" "}
              <strong className="text-foreground">Lan truyền</strong> để xem tín
              hiệu đi qua mạng. Rê chuột lên nơ-ron để xem chi tiết.
            </p>

            {/* Preset architectures */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => applyPreset("shallow")}
                className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted hover:text-foreground hover:bg-background"
              >
                Nông (2-4-1)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("deep")}
                className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted hover:text-foreground hover:bg-background"
              >
                Sâu (2-3-3-3-3-1)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("wide")}
                className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted hover:text-foreground hover:bg-background"
              >
                Rộng (2-8-1)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("pyramid")}
                className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted hover:text-foreground hover:bg-background"
              >
                Kim tự tháp (2-6-4-2-1)
              </button>
            </div>

            {/* Input controls */}
            <div className="flex flex-wrap gap-4 justify-center">
              {inputVals.map((v, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-xs text-muted">
                    x<sub>{i + 1}</sub> ={" "}
                    <strong className="text-foreground">{v.toFixed(2)}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={v}
                    onChange={(e) => {
                      const newVals = [...inputVals];
                      newVals[i] = parseFloat(e.target.value);
                      setInputVals(newVals);
                      setPropagated(false);
                      setActiveLayer(-1);
                    }}
                    className="w-32 accent-accent"
                  />
                </div>
              ))}
            </div>

            {/* Network SVG */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-2xl mx-auto"
            >
              {/* Layer labels */}
              {layers.map((_, idx) => (
                <text
                  key={`lbl-${idx}`}
                  x={positions[idx][0].x}
                  y={24}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="600"
                >
                  {layerLabels(idx)}
                </text>
              ))}

              {/* Connections */}
              {layers.map((_, layerIdx) => {
                if (layerIdx >= layers.length - 1) return null;
                return positions[layerIdx].map((fromPos, fi) =>
                  positions[layerIdx + 1].map((toPos, ti) => {
                    const w = weights[layerIdx]?.[fi]?.[ti] ?? 0;
                    const isActive = activeLayer > layerIdx;
                    const thickness = Math.abs(w) * 3 + 0.5;
                    return (
                      <motion.line
                        key={`c-${layerIdx}-${fi}-${ti}`}
                        x1={fromPos.x + 18}
                        y1={fromPos.y}
                        x2={toPos.x - 18}
                        y2={toPos.y}
                        stroke={
                          isActive
                            ? w >= 0
                              ? "#3b82f6"
                              : "#ef4444"
                            : "#334155"
                        }
                        strokeWidth={isActive ? thickness : 0.8}
                        opacity={isActive ? 0.7 : 0.2}
                        initial={false}
                        animate={{
                          stroke: isActive
                            ? w >= 0
                              ? "#3b82f6"
                              : "#ef4444"
                            : "#334155",
                          opacity: isActive ? 0.7 : 0.2,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    );
                  })
                );
              })}

              {/* Nodes */}
              {layers.map((count, layerIdx) =>
                positions[layerIdx].map((pos, nodeIdx) => {
                  const isActive = activeLayer >= layerIdx;
                  const val = activations[layerIdx]?.[nodeIdx] ?? 0;
                  const isInput = layerIdx === 0;
                  const isOutput = layerIdx === layers.length - 1;
                  let fill = "#1e293b";
                  if (isActive) {
                    if (isInput) fill = "#3b82f6";
                    else if (isOutput) fill = "#22c55e";
                    else fill = "#8b5cf6";
                  }
                  const isHovered =
                    hoveredNode?.layer === layerIdx &&
                    hoveredNode?.node === nodeIdx;

                  return (
                    <g key={`n-${layerIdx}-${nodeIdx}`}>
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={16}
                        fill={fill}
                        stroke={
                          isHovered ? "#f59e0b" : isActive ? fill : "#475569"
                        }
                        strokeWidth={isHovered ? 3 : 2}
                        className="cursor-pointer"
                        initial={false}
                        animate={{
                          fill,
                          scale:
                            isActive && activeLayer === layerIdx ? 1.12 : 1,
                        }}
                        transition={{ duration: 0.25 }}
                        onMouseEnter={() =>
                          setHoveredNode({ layer: layerIdx, node: nodeIdx })
                        }
                        onMouseLeave={() => setHoveredNode(null)}
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
                        {propagated || isActive
                          ? val.toFixed(2)
                          : isInput
                            ? `x${nodeIdx + 1}`
                            : isOutput
                              ? "y"
                              : `h${nodeIdx + 1}`}
                      </text>
                    </g>
                  );
                })
              )}

              {/* Pulse animation */}
              <AnimatePresence>
                {activeLayer >= 0 &&
                  activeLayer < layers.length &&
                  !propagated && (
                    <motion.circle
                      cx={positions[activeLayer][0].x}
                      cy={SVG_H / 2}
                      r={40}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
              </AnimatePresence>
            </svg>

            {/* Hovered node tooltip */}
            <AnimatePresence>
              {hoveredNode && propagated && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg bg-background/80 border border-border p-3 text-center text-sm text-muted"
                >
                  {hoveredNode.layer === 0
                    ? `Đầu vào x${hoveredNode.node + 1} = ${(activations[0]?.[hoveredNode.node] ?? 0).toFixed(3)}`
                    : hoveredNode.layer === layers.length - 1
                      ? `Đầu ra y = sigmoid(...) = ${(activations[hoveredNode.layer]?.[hoveredNode.node] ?? 0).toFixed(4)} — xác suất dự đoán`
                      : `Nơ-ron ẩn h${hoveredNode.node + 1} (lớp ${hoveredNode.layer}): ReLU(tổng trọng số) = ${(activations[hoveredNode.layer]?.[hoveredNode.node] ?? 0).toFixed(4)}`}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action button */}
            <div className="flex justify-center">
              <button
                onClick={propagate}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Lan truyền
              </button>
            </div>

            {/* Result summary */}
            {propagated && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Đầu vào</p>
                  <p className="text-sm font-bold text-foreground">
                    [{inputVals.map((v) => v.toFixed(2)).join(", ")}]
                  </p>
                </div>
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Số lớp ẩn</p>
                  <p className="text-sm font-bold text-foreground">
                    {layers.length - 2}
                  </p>
                </div>
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Tham số</p>
                  <p className="text-sm font-bold text-foreground">
                    {paramCount}
                  </p>
                </div>
                <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                  <p className="text-xs text-muted">Đầu ra</p>
                  <p className="text-sm font-bold text-green-400">
                    {(activations[layers.length - 1]?.[0] ?? 0).toFixed(4)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: XOR PROBLEM ===== */}
      <LessonSection step={3} totalSteps={9} label="Bài toán XOR">
        <div className="space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            Năm 1969, Minsky và Papert công bố cuốn sách{" "}
            <em>Perceptrons</em> chỉ ra: một perceptron đơn lẻ{" "}
            <strong>không thể</strong> giải bài toán XOR. Điều đó đã khiến làn
            sóng AI đầu tiên nguội lạnh suốt hơn một thập kỷ — cho đến khi MLP +
            backpropagation xuất hiện. Hãy tự tay chứng kiến:
          </p>

          <VisualizationSection>
            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setXorMode("perceptron")}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    xorMode === "perceptron"
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  Perceptron đơn (tuyến tính)
                </button>
                <button
                  type="button"
                  onClick={() => setXorMode("mlp")}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    xorMode === "mlp"
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  MLP (1 lớp ẩn 2 nơ-ron)
                </button>
              </div>

              {/* XOR plot */}
              <div className="flex flex-col items-center gap-3">
                <svg
                  viewBox={`0 0 ${XOR_SVG} ${XOR_SVG}`}
                  className="w-full max-w-sm"
                >
                  {/* Decision surface heatmap */}
                  {xorGrid.map((cell, idx) => {
                    const cx = cell.x * XOR_SVG;
                    const cy = (1 - cell.y) * XOR_SVG;
                    const alpha = Math.abs(cell.val - 0.5) * 2;
                    const color =
                      cell.val > 0.5 ? "34,197,94" : "239,68,68";
                    return (
                      <rect
                        key={idx}
                        x={cx - XOR_SVG / 60}
                        y={cy - XOR_SVG / 60}
                        width={XOR_SVG / 30}
                        height={XOR_SVG / 30}
                        fill={`rgba(${color}, ${alpha * 0.4})`}
                      />
                    );
                  })}

                  {/* Data points */}
                  {XOR_DATA.map((pt, idx) => {
                    const cx = pt.x * XOR_SVG;
                    const cy = (1 - pt.y) * XOR_SVG;
                    return (
                      <g key={idx}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={10}
                          fill={pt.label === 1 ? "#22c55e" : "#ef4444"}
                          stroke="white"
                          strokeWidth={2}
                        />
                        <text
                          x={cx}
                          y={cy + 3}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={700}
                          fill="white"
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <p className="text-xs text-muted text-center max-w-sm">
                  Điểm xanh = lớp 1, điểm đỏ = lớp 0.{" "}
                  {xorMode === "perceptron"
                    ? "Perceptron chỉ vẽ được MỘT đường thẳng — không đường nào phân tách được 2 nhóm XOR!"
                    : "MLP với 1 lớp ẩn dựng 2 đường thẳng ở lớp ẩn, rồi tổ hợp thành ranh giới cong — XOR được giải."}
                </p>
              </div>

              {/* Perceptron sliders (only show in perceptron mode) */}
              {xorMode === "perceptron" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted">
                      w₁ = <strong>{pW1.toFixed(2)}</strong>
                    </label>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={0.1}
                      value={pW1}
                      onChange={(e) => setPW1(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted">
                      w₂ = <strong>{pW2.toFixed(2)}</strong>
                    </label>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={0.1}
                      value={pW2}
                      onChange={(e) => setPW2(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted">
                      b = <strong>{pB.toFixed(2)}</strong>
                    </label>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={0.1}
                      value={pB}
                      onChange={(e) => setPB(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                </div>
              )}

              {xorMode === "perceptron" && (
                <Callout variant="warning" title="Dù vặn thế nào cũng không giải được">
                  Thử bất kỳ tổ hợp w₁, w₂, b nào — bạn sẽ luôn thấy ít nhất 1
                  điểm bị phân loại sai. Đó là vì XOR là bài toán{" "}
                  <strong>không tuyến tính phân tách</strong> (not linearly
                  separable). Đây chính là rào cản lý thuyết đã khiến
                  connectionism gần như biến mất khỏi AI trong 15 năm.
                </Callout>
              )}

              {xorMode === "mlp" && (
                <Callout variant="tip" title="MLP giải được XOR!">
                  MLP dùng 2 nơ-ron ẩn: nơ-ron 1 học gần giống hàm OR, nơ-ron 2
                  học gần giống hàm NAND. Lớp đầu ra tổ hợp 2 tín hiệu này —
                  đúng định nghĩa XOR = OR AND NAND. Đây là khoảnh khắc lịch
                  sử: <em>chiều sâu</em> cho phép học đặc trưng phân cấp.
                </Callout>
              )}
            </div>
          </VisualizationSection>
        </div>
      </LessonSection>

      {/* ===== STEP 4: AHA MOMENT ===== */}
      <LessonSection step={4} totalSteps={9} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Bạn vừa xây một <strong>Multi-Layer Perceptron</strong> — mạng nơ-ron
            nhiều lớp! Mỗi lớp ẩn trích xuất đặc trưng ngày càng trừu tượng, giống
            như nhà máy phở: lớp 1 sơ chế nguyên liệu, lớp 2 nấu nước dùng, lớp
            cuối cho ra tô phở hoàn chỉnh. Quan trọng hơn: <em>chiều sâu</em> phá
            vỡ giới hạn tuyến tính — điều mà perceptron đơn không thể làm được
            với XOR.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 5: UNIVERSAL APPROXIMATION ===== */}
      <LessonSection step={5} totalSteps={9} label="Xấp xỉ vạn năng">
        <div className="space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            Năm 1989 Cybenko chứng minh:{" "}
            <strong>một MLP với 1 lớp ẩn đủ rộng có thể xấp xỉ hầu hết mọi hàm liên tục</strong>{" "}
            trên tập compact với độ chính xác tuỳ ý. Dưới đây, ta dùng MLP với số
            nơ-ron ẩn thay đổi để xấp xỉ <LaTeX>{"f(x) = \\sin(x)"}</LaTeX>.
          </p>

          <VisualizationSection>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <label className="text-xs text-muted">
                  Số nơ-ron ẩn K ={" "}
                  <strong className="text-foreground">{hiddenUnits}</strong>
                </label>
                <input
                  type="range"
                  min={2}
                  max={40}
                  step={1}
                  value={hiddenUnits}
                  onChange={(e) => setHiddenUnits(parseInt(e.target.value))}
                  className="w-64 accent-accent"
                />
                <p className="text-xs text-muted">
                  MSE ={" "}
                  <strong
                    className={
                      sineMSE < 0.02
                        ? "text-green-400"
                        : sineMSE < 0.1
                          ? "text-yellow-400"
                          : "text-red-400"
                    }
                  >
                    {sineMSE.toFixed(4)}
                  </strong>
                </p>
              </div>

              <svg
                viewBox="-350 -120 700 240"
                className="w-full max-w-2xl mx-auto"
              >
                {/* Axes */}
                <line x1={-Math.PI * 100} y1={0} x2={Math.PI * 100} y2={0} stroke="#475569" strokeWidth={0.5} />
                <line x1={0} y1={-110} x2={0} y2={110} stroke="#475569" strokeWidth={0.5} />
                {/* Target: sine */}
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  points={sineCurves.targets
                    .map((p) => `${p.x * 100},${-p.y * 90}`)
                    .join(" ")}
                />
                {/* MLP approximation */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  points={sineCurves.approx
                    .map((p) => `${p.x * 100},${-p.y * 90}`)
                    .join(" ")}
                />
                {/* Labels */}
                <text x={-320} y={-95} fill="#22c55e" fontSize={11} fontWeight={600}>
                  sin(x) — mục tiêu
                </text>
                <text x={-320} y={-75} fill="#f59e0b" fontSize={11} fontWeight={600}>
                  MLP({hiddenUnits} nơ-ron)
                </text>
                <text x={-Math.PI * 100 - 15} y={-5} fill="#94a3b8" fontSize={9}>
                  -π
                </text>
                <text x={Math.PI * 100 + 5} y={-5} fill="#94a3b8" fontSize={9}>
                  π
                </text>
              </svg>

              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
                  <p className="text-xs text-muted">K = 2</p>
                  <p className="text-xs text-red-400">Quá thô</p>
                </div>
                <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
                  <p className="text-xs text-muted">K = 10</p>
                  <p className="text-xs text-yellow-400">Khá tốt</p>
                </div>
                <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
                  <p className="text-xs text-muted">K = 30+</p>
                  <p className="text-xs text-green-400">Rất gần</p>
                </div>
              </div>
            </div>
          </VisualizationSection>

          <Callout variant="info" title="Lưu ý quan trọng về Universal Approximation">
            Định lý chỉ nói{" "}
            <strong>tồn tại</strong> bộ trọng số đủ tốt — nó{" "}
            <strong>không đảm bảo</strong> ta có thể học được chúng bằng gradient
            descent với dữ liệu hữu hạn. Trong thực tế: (1) mạng có thể cần rất
            nhiều nơ-ron, (2) huấn luyện có thể kẹt ở local minima, (3) thường{" "}
            <em>sâu</em> hiệu quả hơn <em>rộng</em> về mặt tham số.
          </Callout>
        </div>
      </LessonSection>

      {/* ===== STEP 6: INLINE CHALLENGES ===== */}
      <LessonSection step={6} totalSteps={9} label="Thử thách">
        <div className="space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            Bạn đã thấy tín hiệu chảy qua mạng. Nhưng nếu bỏ hết hàm kích hoạt
            (ReLU, sigmoid) thì sao? Nghĩ kĩ trước khi chọn!
          </p>
          <InlineChallenge
            question="Nếu MLP 10 lớp không có hàm kích hoạt phi tuyến, nó tương đương với gì?"
            options={[
              "Một MLP 5 lớp — giảm một nửa",
              "Một phép biến đổi tuyến tính duy nhất — như Perceptron đơn!",
              "Không thay đổi gì — hàm kích hoạt chỉ tăng tốc",
            ]}
            correct={1}
            explanation="Tích của nhiều ma trận (W₁ × W₂ × ... × W₁₀) vẫn là một ma trận duy nhất. Không có phi tuyến, 10 lớp chỉ bằng 1 lớp! Đây là lý do hàm kích hoạt là bắt buộc."
          />

          <InlineChallenge
            question="Depth vs Width: Bạn có 10.000 tham số để xây mạng cho bài toán ảnh phức tạp. Chọn thế nào?"
            options={[
              "1 lớp ẩn rất rộng (10.000 nơ-ron) — Universal Approximation nói là đủ",
              "Nhiều lớp ẩn vừa phải (ví dụ 5 × ~40 nơ-ron) — chiều sâu giúp học đặc trưng phân cấp, hiệu quả hơn về tham số",
              "Càng nông càng tốt — dễ huấn luyện",
            ]}
            correct={1}
            explanation="Thực nghiệm và lý thuyết sâu (Bengio, 2009) cho thấy: với cùng số tham số, mạng sâu biểu diễn được hàm phức tạp hơn mạng rộng. Đặc trưng được tổ hợp theo cấp — lớp thấp học cạnh, lớp cao học hình dạng."
          />
        </div>
      </LessonSection>

      {/* ===== STEP 7: EXPLANATION ===== */}
      <LessonSection step={7} totalSteps={9} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Multi-Layer Perceptron (MLP)</strong> là kiến trúc mạng nơ-ron
            cơ bản nhất với các lớp kết nối đầy đủ (fully connected). Tại mỗi
            lớp, phép tính diễn ra theo hai bước:
          </p>

          <LaTeX block>{"z^{[l]} = W^{[l]} \\cdot a^{[l-1]} + b^{[l]}"}</LaTeX>
          <LaTeX block>{"a^{[l]} = f(z^{[l]})"}</LaTeX>

          <p>
            Trong đó <LaTeX>{"W^{[l]}"}</LaTeX> là ma trận trọng số,{" "}
            <LaTeX>{"b^{[l]}"}</LaTeX> là bias, và <LaTeX>{"f"}</LaTeX> là{" "}
            <TopicLink slug="activation-functions">hàm kích hoạt</TopicLink> phi
            tuyến (ReLU, sigmoid, v.v.). Mạng học bằng{" "}
            <TopicLink slug="backpropagation">lan truyền ngược</TopicLink> để tối
            ưu trọng số.
          </p>

          <Callout variant="tip" title="Tại sao gọi là fully connected?">
            Mỗi nơ-ron ở lớp trước kết nối với <strong>tất cả</strong> nơ-ron ở
            lớp sau — giống như mỗi đầu bếp trong phân xưởng 1 gửi nguyên liệu
            cho mọi đầu bếp phân xưởng 2. Số trọng số = (số nơ-ron lớp trước) ×
            (số nơ-ron lớp sau).
          </Callout>

          <p>
            <strong>Ba loại lớp trong MLP:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Lớp đầu vào:</strong> Nhận dữ liệu thô. Số nơ-ron = số đặc
              trưng (ảnh 28×28 pixel = 784 nơ-ron).
            </li>
            <li>
              <strong>Lớp ẩn:</strong> Trích xuất đặc trưng. Lớp đầu nhận diện
              nét đơn giản, lớp sau tổ hợp thành đặc trưng phức tạp hơn.
            </li>
            <li>
              <strong>Lớp đầu ra:</strong> Cho kết quả cuối. 1 nơ-ron cho bài
              toán hồi quy, n nơ-ron cho phân loại n lớp.
            </li>
          </ul>

          <CodeBlock language="python" title="mlp_pytorch.py — MLP cơ bản">
{`import torch
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self, in_dim=784, hidden=[128, 64], out_dim=10):
        super().__init__()
        dims = [in_dim, *hidden, out_dim]
        layers = []
        for i in range(len(dims) - 1):
            layers.append(nn.Linear(dims[i], dims[i + 1]))
            if i < len(dims) - 2:   # không đặt ReLU sau lớp đầu ra
                layers.append(nn.ReLU())
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)

# Khởi tạo & đếm tham số
model = MLP(784, [128, 64], 10)
n_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Tham số: {n_params:,}")   # ~109k

# Forward pass thử
x = torch.randn(32, 784)        # batch 32, ảnh flatten
logits = model(x)               # (32, 10)
print(logits.shape)`}
          </CodeBlock>

          <CollapsibleDetail title="Backpropagation — MLP học như thế nào?">
            <p>
              Với hàm loss <LaTeX>{"\\mathcal{L}"}</LaTeX> (ví dụ cross-entropy),
              ta tính gradient của loss theo từng trọng số bằng quy tắc chuỗi:
            </p>
            <LaTeX block>
              {
                "\\frac{\\partial \\mathcal{L}}{\\partial W^{[l]}} = \\frac{\\partial \\mathcal{L}}{\\partial a^{[l]}} \\cdot \\frac{\\partial a^{[l]}}{\\partial z^{[l]}} \\cdot \\frac{\\partial z^{[l]}}{\\partial W^{[l]}}"
              }
            </LaTeX>
            <p>
              Gradient được <em>lan truyền ngược</em> từ lớp cuối về lớp đầu. Đây
              là lý do các hàm kích hoạt khả vi (ReLU, sigmoid) là bắt buộc —
              nếu đạo hàm bằng 0 khắp nơi (như hàm bước), gradient biến mất.
            </p>
            <p>
              Xem chi tiết tại{" "}
              <TopicLink slug="backpropagation">Backpropagation</TopicLink>.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Tại sao Universal Approximation không nói 'dùng 1 lớp là đủ'?">
            <p>
              Định lý Cybenko phát biểu: tồn tại trọng số. Nhưng:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                Số nơ-ron cần có thể mũ (exponential) theo độ phức tạp của hàm
                mục tiêu.
              </li>
              <li>
                Các chứng minh của Rolnick &amp; Tegmark (2018) cho thấy: có
                những hàm mà mạng sâu cần{" "}
                <LaTeX>{"O(n)"}</LaTeX> tham số, nhưng mạng nông cần{" "}
                <LaTeX>{"O(2^n)"}</LaTeX>.
              </li>
              <li>
                Huấn luyện mạng rộng một lớp dễ vướng overfitting — tham số
                không được tái sử dụng qua chiều sâu.
              </li>
              <li>
                Thực nghiệm: ResNet 152 lớp đánh bại MLP 1 lớp rộng trên
                ImageNet, vì <strong>inductive bias</strong> phân cấp phù hợp
                với ảnh tự nhiên.
              </li>
            </ul>
          </CollapsibleDetail>

          <CodeBlock language="python" title="xor_mlp.py — Giải XOR từ đầu">
{`import torch
import torch.nn as nn

# Dữ liệu XOR
X = torch.tensor([[0., 0.], [0., 1.], [1., 0.], [1., 1.]])
y = torch.tensor([[0.], [1.], [1.], [0.]])

# MLP nhỏ nhất: 2 đầu vào -> 2 nơ-ron ẩn (tanh) -> 1 đầu ra (sigmoid)
model = nn.Sequential(
    nn.Linear(2, 2),
    nn.Tanh(),
    nn.Linear(2, 1),
    nn.Sigmoid(),
)

loss_fn = nn.BCELoss()
opt = torch.optim.Adam(model.parameters(), lr=0.1)

for epoch in range(2000):
    pred = model(X)
    loss = loss_fn(pred, y)
    opt.zero_grad()
    loss.backward()
    opt.step()

    if epoch % 200 == 0:
        acc = ((pred > 0.5).float() == y).float().mean().item()
        print(f"epoch {epoch:4d}  loss={loss.item():.4f}  acc={acc:.2f}")

# Kết quả cuối
print("Dự đoán:", model(X).squeeze().detach().tolist())
# ~ [0.02, 0.98, 0.98, 0.02]  ← XOR đã học được!`}
          </CodeBlock>

          <Callout variant="warning" title="MLP không phải lúc nào cũng tốt nhất">
            MLP coi mỗi đầu vào là độc lập — không hiểu vị trí không gian (dùng
            CNN) hay trình tự thời gian (dùng RNN/Transformer). Nhưng MLP là nền
            tảng để hiểu mọi kiến trúc phức tạp hơn.
          </Callout>

          <Callout variant="info" title="Chọn số lớp và số nơ-ron thế nào?">
            <p className="mb-2">
              Không có công thức vạn năng, nhưng có vài heuristic hữu ích:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                Bắt đầu với 1–2 lớp ẩn, mỗi lớp ~cùng cỡ chiều đầu vào.
              </li>
              <li>
                Nếu underfitting (bias cao): tăng chiều rộng hoặc chiều sâu.
              </li>
              <li>
                Nếu overfitting (variance cao): giảm mạng, thêm dropout/L2.
              </li>
              <li>
                Với dữ liệu có cấu trúc (ảnh, chuỗi): dùng CNN/RNN/Transformer
                thay vì cố ép MLP.
              </li>
              <li>
                Dùng Bayesian/grid search hoặc <em>learning rate finder</em> để
                tinh chỉnh hyperparameter có hệ thống.
              </li>
            </ul>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 8: ARCHITECTURE CHOICE ===== */}
      <LessonSection step={8} totalSteps={9} label="Chọn kiến trúc">
        <div className="space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            Kiến trúc MLP phụ thuộc vào loại bài toán. Chọn loại dữ liệu bên dưới
            để xem khuyến nghị:
          </p>

          <VisualizationSection>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {(
                  [
                    { key: "tabular", label: "Dữ liệu bảng (CSV)" },
                    { key: "image", label: "Ảnh" },
                    { key: "sequence", label: "Chuỗi / văn bản" },
                    { key: "tiny", label: "Dataset nhỏ (<1k mẫu)" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTaskType(t.key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      taskType === t.key
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-surface text-muted hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <motion.div
                key={taskType}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-border bg-background/40 p-4"
                style={{ borderLeftColor: archRecommendation.color, borderLeftWidth: 4 }}
              >
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted mb-1">Số lớp</p>
                    <p className="text-sm font-semibold text-foreground">
                      {archRecommendation.layers}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Chiều rộng</p>
                    <p className="text-sm font-semibold text-foreground">
                      {archRecommendation.width}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Kích hoạt</p>
                    <p className="text-sm font-semibold text-foreground">
                      {archRecommendation.activation}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted leading-relaxed">
                  {archRecommendation.note}
                </p>
              </motion.div>

              <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                <p className="font-semibold text-foreground mb-1">
                  Quy tắc ngón tay cái:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Dữ liệu bảng → MLP 2-3 lớp, gradient boosted trees thường
                    cũng mạnh.
                  </li>
                  <li>Ảnh → CNN (ResNet, EfficientNet, ViT).</li>
                  <li>Chuỗi → Transformer (GPT, BERT) hoặc RNN (LSTM, GRU).</li>
                  <li>
                    Dataset nhỏ → giữ mạng nhỏ + regularization mạnh, hoặc
                    transfer learning.
                  </li>
                </ul>
              </div>
            </div>
          </VisualizationSection>

          <ProgressSteps
            current={1}
            total={5}
            labels={[
              "Xác định loại dữ liệu",
              "Chọn họ kiến trúc (MLP/CNN/RNN/Transformer)",
              "Bắt đầu với baseline đơn giản",
              "Tinh chỉnh độ sâu, độ rộng, regularization",
              "So sánh có hệ thống qua cross-validation",
            ]}
          />
        </div>
      </LessonSection>

      {/* ===== STEP 9: MINI SUMMARY + QUIZ ===== */}
      <LessonSection step={9} totalSteps={9} label="Tóm tắt & Kiểm tra">
        <MiniSummary
          title="MLP — Điểm chốt"
          points={[
            "MLP gồm lớp đầu vào → lớp ẩn (một hoặc nhiều) → lớp đầu ra, tất cả kết nối đầy đủ.",
            "Hàm kích hoạt phi tuyến (ReLU, sigmoid) là BẮT BUỘC — không có nó, nhiều lớp vẫn chỉ là một phép tuyến tính.",
            "Perceptron đơn KHÔNG giải được XOR; MLP với 1 lớp ẩn 2 nơ-ron là đủ — chiều sâu mở khoá các hàm phi tuyến.",
            "Universal Approximation Theorem: MLP đủ rộng xấp xỉ hầu hết hàm liên tục; nhưng thực tế, SÂU thường hiệu quả hơn RỘNG.",
            "Số trọng số giữa hai lớp = (nơ-ron lớp trước) × (nơ-ron lớp sau) + bias.",
            "MLP tốt cho dữ liệu bảng; ảnh/chuỗi nên dùng CNN/Transformer với inductive bias phù hợp hơn.",
          ]}
        />

        <div className="mt-6">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
