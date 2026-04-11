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
  SliderGroup,
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

/* ---------- math helpers ---------- */
const SVG_W = 560;
const SVG_H = 320;

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function relu(x: number) {
  return Math.max(0, x);
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

/* ---------- main component ---------- */
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
        // ReLU for hidden, sigmoid for output
        next.push(
          l === layers.length - 2 ? sigmoid(sum) : relu(sum)
        );
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

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question:
        "Tại sao MLP cần hàm kích hoạt phi tuyến giữa các lớp?",
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
        "Lớp ẩn 1 đến lớp ẩn 2 (128 x 64)",
        "Đầu vào đến lớp ẩn 1 (784 x 128)",
        "Lớp ẩn 2 đến đầu ra (64 x 10)",
        "Tất cả bằng nhau",
      ],
      correct: 1,
      explanation:
        "784 x 128 = 100.352 trọng số, lớn nhất. Đây là lý do lớp đầu tiên thường chiếm phần lớn tham số trong MLP.",
    },
    {
      question:
        "\"Fully connected\" nghĩa là gì trong ngữ cảnh MLP?",
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
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={7} label="Dự đoán">
        <PredictionGate
          question="Một Perceptron đơn lẻ chỉ vẽ được đường thẳng để phân loại. Muốn phân loại hình xoắn ốc (spiral), bạn cần gì?"
          options={[
            "Một Perceptron với learning rate lớn hơn",
            "Nhiều Perceptron xếp thành nhiều lớp",
            "Huấn luyện lâu hơn trên cùng Perceptron",
            "Dùng dữ liệu nhiều hơn",
          ]}
          correct={1}
          explanation="Chính xác! Xếp nhiều Perceptron thành nhiều lớp tạo ra MLP — mạng có thể vẽ ranh giới cong phức tạp tùy ý."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Bạn đã nắm ý tưởng cốt lõi. Bây giờ hãy tự tay{" "}
            <strong className="text-foreground">xây dựng</strong>{" "}
            một MLP và xem dữ liệu chảy qua từng lớp.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: BUILD YOUR OWN MLP ===== */}
      <LessonSection step={2} totalSteps={7} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <p className="text-sm text-muted text-center">
              Thay đổi giá trị đầu vào, rồi nhấn{" "}
              <strong className="text-foreground">Lan truyền</strong>{" "}
              để xem tín hiệu đi qua mạng. Rê chuột lên nơ-ron để xem chi tiết.
            </p>

            {/* Input controls */}
            <div className="flex flex-wrap gap-4 justify-center">
              {inputVals.map((v, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-xs text-muted">
                    x<sub>{i + 1}</sub> ={" "}
                    <strong className="text-foreground">
                      {v.toFixed(2)}
                    </strong>
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
                        stroke={isHovered ? "#f59e0b" : isActive ? fill : "#475569"}
                        strokeWidth={isHovered ? 3 : 2}
                        className="cursor-pointer"
                        initial={false}
                        animate={{
                          fill,
                          scale:
                            isActive && activeLayer === layerIdx
                              ? 1.12
                              : 1,
                        }}
                        transition={{ duration: 0.25 }}
                        onMouseEnter={() =>
                          setHoveredNode({
                            layer: layerIdx,
                            node: nodeIdx,
                          })
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
              <div className="grid grid-cols-3 gap-3">
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
                  <p className="text-xs text-muted">Đầu ra</p>
                  <p className="text-sm font-bold text-green-400">
                    {(
                      activations[layers.length - 1]?.[0] ?? 0
                    ).toFixed(4)}
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
            Bạn vừa xây một <strong>Multi-Layer Perceptron</strong> — mạng nơ-ron
            nhiều lớp! Mỗi lớp ẩn trích xuất đặc trưng ngày càng trừu tượng,
            giống như nhà máy phở: lớp 1 sơ chế nguyên liệu, lớp 2 nấu nước dùng,
            lớp cuối cho ra tô phở hoàn chỉnh.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: INLINE CHALLENGE ===== */}
      <LessonSection step={4} totalSteps={7} label="Thử thách">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          Bạn đã thấy tín hiệu chảy qua mạng. Nhưng nếu bỏ hết hàm kích hoạt (ReLU, sigmoid)
          thì sao? Nghĩ kĩ trước khi chọn!
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
      </LessonSection>

      {/* ===== STEP 5: EXPLANATION ===== */}
      <LessonSection step={5} totalSteps={7} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Multi-Layer Perceptron (MLP)</strong>{" "}
            là kiến trúc mạng nơ-ron cơ bản nhất với các lớp kết nối đầy đủ (fully connected).
            Tại mỗi lớp, phép tính diễn ra theo hai bước:
          </p>

          <LaTeX block>
            {"z^{[l]} = W^{[l]} \\cdot a^{[l-1]} + b^{[l]}"}
          </LaTeX>
          <LaTeX block>{"a^{[l]} = f(z^{[l]})"}</LaTeX>

          <p>
            Trong đó <LaTeX>{"W^{[l]}"}</LaTeX> là ma trận trọng số,{" "}
            <LaTeX>{"b^{[l]}"}</LaTeX> là bias, và{" "}
            <LaTeX>{"f"}</LaTeX> là hàm kích hoạt phi tuyến (ReLU, sigmoid, v.v.).
          </p>

          <Callout variant="tip" title="Tại sao gọi là fully connected?">
            Mỗi nơ-ron ở lớp trước kết nối với <strong>tất cả</strong>{" "}
            nơ-ron ở lớp sau — giống như mỗi đầu bếp trong phân xưởng 1 gửi
            nguyên liệu cho mọi đầu bếp phân xưởng 2. Số trọng số = (số nơ-ron lớp trước)
            × (số nơ-ron lớp sau).
          </Callout>

          <p>
            <strong>Ba loại lớp trong MLP:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Lớp đầu vào:</strong>{" "}
              Nhận dữ liệu thô. Số nơ-ron = số đặc trưng (ảnh 28×28 pixel = 784 nơ-ron).
            </li>
            <li>
              <strong>Lớp ẩn:</strong>{" "}
              Trích xuất đặc trưng. Lớp đầu nhận diện nét đơn giản,
              lớp sau tổ hợp thành đặc trưng phức tạp hơn.
            </li>
            <li>
              <strong>Lớp đầu ra:</strong>{" "}
              Cho kết quả cuối. 1 nơ-ron cho bài toán hồi quy, n nơ-ron cho phân loại n lớp.
            </li>
          </ul>

          <CodeBlock language="python" title="mlp_pytorch.py">
{`import torch.nn as nn

class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(784, 128),   # 784 đầu vào → 128 nơ-ron ẩn
            nn.ReLU(),             # kích hoạt phi tuyến
            nn.Linear(128, 64),    # 128 → 64 nơ-ron ẩn
            nn.ReLU(),
            nn.Linear(64, 10),     # 64 → 10 lớp đầu ra
        )

    def forward(self, x):
        return self.layers(x)     # dữ liệu chảy qua từng lớp`}
          </CodeBlock>

          <Callout variant="warning" title="MLP không phải lúc nào cũng tốt nhất">
            MLP coi mỗi đầu vào là độc lập — không hiểu vị trí không gian (dùng CNN)
            hay trình tự thời gian (dùng RNN/Transformer). Nhưng MLP là nền tảng
            để hiểu mọi kiến trúc phức tạp hơn.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 6: MINI SUMMARY ===== */}
      <LessonSection step={6} totalSteps={7} label="Tóm tắt">
        <MiniSummary
          title="MLP — Điểm chốt"
          points={[
            "MLP gồm lớp đầu vào → lớp ẩn (một hoặc nhiều) → lớp đầu ra, tất cả kết nối đầy đủ.",
            "Hàm kích hoạt phi tuyến (ReLU, sigmoid) là BẮT BUỘC — không có nó, nhiều lớp vẫn chỉ là một phép tuyến tính.",
            "Số trọng số giữa hai lớp = (nơ-ron lớp trước) × (nơ-ron lớp sau) + bias.",
            "MLP là nền tảng của deep learning — CNN, RNN, Transformer đều dựa trên ý tưởng xếp chồng nhiều lớp.",
            "Mạng học bằng cách điều chỉnh trọng số qua backpropagation và gradient descent.",
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
