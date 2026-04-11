"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
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
  relatedSlugs: ["perceptron", "activation-functions", "forward-propagation", "backpropagation"],
  vizType: "interactive",
};

const LAYERS = [3, 4, 4, 2]; // input, hidden1, hidden2, output

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export default function MLPTopic() {
  const [animating, setAnimating] = useState(false);
  const [activeLayer, setActiveLayer] = useState(-1);
  const [activeNode, setActiveNode] = useState<{ layer: number; node: number } | null>(null);

  const nodePositions = LAYERS.map((count, layerIdx) => {
    const layerX = 80 + layerIdx * 150;
    return Array.from({ length: count }, (_, nodeIdx) => {
      const totalHeight = (count - 1) * 60;
      const startY = 140 - totalHeight / 2;
      return { x: layerX, y: startY + nodeIdx * 60 };
    });
  });

  const startAnimation = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setActiveLayer(0);

    let layer = 0;
    const interval = setInterval(() => {
      layer++;
      if (layer >= LAYERS.length) {
        clearInterval(interval);
        setTimeout(() => {
          setAnimating(false);
          setActiveLayer(-1);
        }, 800);
        return;
      }
      setActiveLayer(layer);
    }, 700);
  }, [animating]);

  const layerLabels = ["Đầu vào", "Ẩn 1", "Ẩn 2", "Đầu ra"];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng một <strong>nhà máy sản xuất</strong> có nhiều phân xưởng
          nối tiếp nhau. Nguyên liệu thô (dữ liệu đầu vào) đi vào phân xưởng đầu tiên,
          được gia công sơ bộ, rồi chuyển sang phân xưởng tiếp theo để tinh chế thêm.
        </p>
        <p>
          Mỗi <strong>phân xưởng</strong> (lớp ẩn) có nhiều <strong>công nhân</strong>{" "}
          (nơ-ron), mỗi người chuyên xử lý một đặc điểm khác nhau của sản phẩm. Công nhân
          ở phân xưởng sau nhận kết quả từ tất cả công nhân phân xưởng trước và tổng hợp
          lại.
        </p>
        <p>
          Cuối cùng, phân xưởng cuối cùng (lớp đầu ra) cho ra{" "}
          <strong>sản phẩm hoàn thiện</strong> &mdash; đó là kết quả dự đoán của mạng.
          Càng nhiều phân xưởng, sản phẩm càng tinh xảo (mạng càng học được các đặc trưng
          phức tạp hơn).
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Nhấn nút để xem dữ liệu lan truyền qua từng lớp
            </p>
            <button
              onClick={startAnimation}
              disabled={animating}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {animating ? "Đang chạy..." : "Lan truyền tiến"}
            </button>
          </div>

          <svg viewBox="0 0 650 300" className="w-full max-w-2xl mx-auto">
            {/* Layer labels */}
            {LAYERS.map((_, layerIdx) => (
              <text
                key={`label-${layerIdx}`}
                x={nodePositions[layerIdx][0].x}
                y={20}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
                fontWeight="600"
              >
                {layerLabels[layerIdx]}
              </text>
            ))}

            {/* Connections */}
            {LAYERS.map((_, layerIdx) => {
              if (layerIdx === LAYERS.length - 1) return null;
              return nodePositions[layerIdx].map((fromPos, fromIdx) =>
                nodePositions[layerIdx + 1].map((toPos, toIdx) => {
                  const isActive = activeLayer > layerIdx;
                  return (
                    <motion.line
                      key={`conn-${layerIdx}-${fromIdx}-${toIdx}`}
                      x1={fromPos.x + 20}
                      y1={fromPos.y}
                      x2={toPos.x - 20}
                      y2={toPos.y}
                      stroke={isActive ? "#3b82f6" : "#334155"}
                      strokeWidth={isActive ? 2 : 1}
                      opacity={isActive ? 0.8 : 0.3}
                      initial={false}
                      animate={{
                        stroke: isActive ? "#3b82f6" : "#334155",
                        strokeWidth: isActive ? 2 : 1,
                        opacity: isActive ? 0.8 : 0.3,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  );
                })
              );
            })}

            {/* Nodes */}
            {LAYERS.map((count, layerIdx) =>
              nodePositions[layerIdx].map((pos, nodeIdx) => {
                const isActive = activeLayer >= layerIdx;
                const isInput = layerIdx === 0;
                const isOutput = layerIdx === LAYERS.length - 1;
                let fillColor = "#1e293b";
                if (isActive) {
                  if (isInput) fillColor = "#3b82f6";
                  else if (isOutput) fillColor = "#22c55e";
                  else fillColor = "#8b5cf6";
                }

                return (
                  <g key={`node-${layerIdx}-${nodeIdx}`}>
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={18}
                      fill={fillColor}
                      stroke={isActive ? fillColor : "#475569"}
                      strokeWidth="2"
                      initial={false}
                      animate={{
                        fill: fillColor,
                        scale: isActive && activeLayer === layerIdx ? 1.15 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      onMouseEnter={() => setActiveNode({ layer: layerIdx, node: nodeIdx })}
                      onMouseLeave={() => setActiveNode(null)}
                      className="cursor-pointer"
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {isInput
                        ? `x${nodeIdx + 1}`
                        : isOutput
                          ? `y${nodeIdx + 1}`
                          : `h${nodeIdx + 1}`}
                    </text>
                  </g>
                );
              })
            )}

            {/* Data flow pulse animation */}
            <AnimatePresence>
              {animating && activeLayer >= 0 && activeLayer < LAYERS.length && (
                <motion.circle
                  cx={nodePositions[activeLayer][0].x}
                  cy={140}
                  r={50}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </AnimatePresence>
          </svg>

          {/* Node info tooltip */}
          <AnimatePresence>
            {activeNode && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg bg-background/80 border border-border p-3 text-center text-sm text-muted"
              >
                {activeNode.layer === 0
                  ? `Nơ-ron đầu vào #${activeNode.node + 1}: nhận dữ liệu thô từ bên ngoài`
                  : activeNode.layer === LAYERS.length - 1
                    ? `Nơ-ron đầu ra #${activeNode.node + 1}: giá trị dự đoán = ${sigmoid(Math.random() * 4 - 2).toFixed(3)}`
                    : `Nơ-ron ẩn lớp ${activeNode.layer}, vị trí #${activeNode.node + 1}: trích xuất đặc trưng trung gian`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Multi-Layer Perceptron (MLP)</strong> là kiến trúc mạng nơ-ron cơ bản nhất
          gồm nhiều lớp nơ-ron xếp chồng lên nhau. Không giống Perceptron đơn lẻ chỉ giải
          được bài toán tuyến tính, MLP có thể học các ranh giới quyết định phi tuyến phức tạp.
        </p>
        <p>MLP gồm ba loại lớp:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Lớp đầu vào (Input layer):</strong> Nhận dữ liệu thô. Số nơ-ron bằng
            số đặc trưng của dữ liệu.
          </li>
          <li>
            <strong>Lớp ẩn (Hidden layers):</strong> Nơi diễn ra phép tính chính. Mỗi
            nơ-ron nhận tín hiệu từ tất cả nơ-ron lớp trước, tính tổng có trọng số, rồi
            đi qua hàm kích hoạt phi tuyến.
          </li>
          <li>
            <strong>Lớp đầu ra (Output layer):</strong> Cho kết quả cuối cùng. Số nơ-ron
            phụ thuộc vào bài toán (1 cho hồi quy, n cho phân loại n lớp).
          </li>
        </ul>
        <p>
          Tất cả các nơ-ron giữa hai lớp liền kề đều được kết nối với nhau &mdash; gọi là{" "}
          <strong>fully connected (kết nối đầy đủ)</strong>. Mỗi kết nối có một trọng số
          riêng, và mạng học bằng cách điều chỉnh các trọng số này thông qua{" "}
          <strong>lan truyền ngược (backpropagation)</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
