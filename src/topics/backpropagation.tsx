"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "backpropagation",
  title: "Backpropagation",
  titleVi: "Lan truyền ngược",
  description:
    "Thuật toán cốt lõi để huấn luyện mạng nơ-ron, tính gradient của hàm mất mát theo từng trọng số.",
  category: "neural-fundamentals",
  tags: ["neural-network", "training", "optimization", "gradient"],
  difficulty: "intermediate",
  relatedSlugs: [
    "forward-propagation",
    "gradient-descent",
    "loss-functions",
    "vanishing-exploding-gradients",
  ],
  vizType: "interactive",
};

const LAYERS = [2, 3, 2, 1];

export default function BackpropagationTopic() {
  const [phase, setPhase] = useState<"idle" | "forward" | "loss" | "backward" | "update">("idle");
  const [activeLayerForward, setActiveLayerForward] = useState(-1);
  const [activeLayerBackward, setActiveLayerBackward] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);

  const nodePositions = LAYERS.map((count, layerIdx) => {
    const layerX = 70 + layerIdx * 130;
    return Array.from({ length: count }, (_, nodeIdx) => {
      const totalHeight = (count - 1) * 55;
      const startY = 120 - totalHeight / 2;
      return { x: layerX, y: startY + nodeIdx * 55 };
    });
  });

  const runFullCycle = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);

    // Forward pass
    setPhase("forward");
    setActiveLayerForward(0);
    let step = 0;

    const forwardInterval = setInterval(() => {
      step++;
      if (step >= LAYERS.length) {
        clearInterval(forwardInterval);

        // Show loss
        setTimeout(() => {
          setPhase("loss");

          // Backward pass
          setTimeout(() => {
            setPhase("backward");
            let backStep = LAYERS.length - 1;
            setActiveLayerBackward(backStep);

            const backInterval = setInterval(() => {
              backStep--;
              if (backStep < 0) {
                clearInterval(backInterval);

                // Update phase
                setTimeout(() => {
                  setPhase("update");
                  setTimeout(() => {
                    setPhase("idle");
                    setActiveLayerForward(-1);
                    setActiveLayerBackward(-1);
                    setIsRunning(false);
                  }, 1500);
                }, 800);
                return;
              }
              setActiveLayerBackward(backStep);
            }, 600);
          }, 1000);
        }, 800);
        return;
      }
      setActiveLayerForward(step);
    }, 600);
  }, [isRunning]);

  const phaseLabels: Record<string, { text: string; color: string }> = {
    idle: { text: "Sẵn sàng", color: "#64748b" },
    forward: { text: "Lan truyền tiến (Forward Pass)", color: "#3b82f6" },
    loss: { text: "Tính hàm mất mát (Loss)", color: "#f59e0b" },
    backward: { text: "Lan truyền ngược (Backward Pass)", color: "#ef4444" },
    update: { text: "Cập nhật trọng số!", color: "#22c55e" },
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>giáo viên chấm bài thi</strong> cho một lớp
          học nhiều tầng. Học sinh tầng 1 giải bài, chuyển đáp án cho học sinh tầng 2
          tiếp tục giải, rồi tầng 3, cho đến khi ra đáp án cuối cùng.
        </p>
        <p>
          Khi đáp án cuối sai (loss cao), bạn không chỉ mắng học sinh cuối cùng &mdash;
          bạn <strong>truy ngược lại</strong> từng tầng để xem ai đã mắc lỗi ở đâu.
          &quot;Tầng 3 sai vì tầng 2 chuyển sai, mà tầng 2 sai vì tầng 1 tính
          nhầm.&quot;
        </p>
        <p>
          Dựa vào mức độ đóng góp vào lỗi của mỗi tầng, bạn yêu cầu từng tầng{" "}
          <strong>điều chỉnh cách giải</strong> (cập nhật trọng số). Đó chính là
          backpropagation &mdash; <strong>quy trách nhiệm</strong> cho từng trọng số
          trong mạng!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{
                color: phaseLabels[phase].color,
                backgroundColor: `${phaseLabels[phase].color}15`,
                border: `1px solid ${phaseLabels[phase].color}40`,
              }}
            >
              {phaseLabels[phase].text}
            </div>
            <button
              onClick={runFullCycle}
              disabled={isRunning}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isRunning ? "Đang chạy..." : "Chạy một vòng huấn luyện"}
            </button>
          </div>

          <svg viewBox="0 0 570 250" className="w-full max-w-2xl mx-auto">
            {/* Layer labels */}
            {["Đầu vào", "Ẩn 1", "Ẩn 2", "Đầu ra"].map((label, i) => (
              <text
                key={`lbl-${i}`}
                x={nodePositions[i][0].x}
                y={18}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
              >
                {label}
              </text>
            ))}

            {/* Connections */}
            {LAYERS.map((_, layerIdx) => {
              if (layerIdx === LAYERS.length - 1) return null;
              return nodePositions[layerIdx].map((fromPos, fromIdx) =>
                nodePositions[layerIdx + 1].map((toPos, toIdx) => {
                  const isForwardActive = phase === "forward" && activeLayerForward > layerIdx;
                  const isBackwardActive =
                    phase === "backward" && activeLayerBackward <= layerIdx;
                  const isUpdate = phase === "update";

                  let strokeColor = "#334155";
                  if (isForwardActive) strokeColor = "#3b82f6";
                  if (isBackwardActive) strokeColor = "#ef4444";
                  if (isUpdate) strokeColor = "#22c55e";

                  return (
                    <motion.line
                      key={`c-${layerIdx}-${fromIdx}-${toIdx}`}
                      x1={fromPos.x + 16}
                      y1={fromPos.y}
                      x2={toPos.x - 16}
                      y2={toPos.y}
                      stroke={strokeColor}
                      strokeWidth={isForwardActive || isBackwardActive || isUpdate ? 2.5 : 1}
                      opacity={isForwardActive || isBackwardActive || isUpdate ? 0.8 : 0.25}
                      initial={false}
                      animate={{ stroke: strokeColor }}
                      transition={{ duration: 0.3 }}
                    />
                  );
                })
              );
            })}

            {/* Nodes */}
            {LAYERS.map((_, layerIdx) =>
              nodePositions[layerIdx].map((pos, nodeIdx) => {
                const isForwardActive = phase === "forward" && activeLayerForward >= layerIdx;
                const isBackwardActive =
                  phase === "backward" && activeLayerBackward <= layerIdx;
                const isUpdate = phase === "update";

                let fillColor = "#1e293b";
                if (isForwardActive) fillColor = "#3b82f6";
                if (isBackwardActive) fillColor = "#ef4444";
                if (isUpdate) fillColor = "#22c55e";

                return (
                  <motion.circle
                    key={`n-${layerIdx}-${nodeIdx}`}
                    cx={pos.x}
                    cy={pos.y}
                    r={15}
                    fill={fillColor}
                    stroke={fillColor === "#1e293b" ? "#475569" : fillColor}
                    strokeWidth="2"
                    initial={false}
                    animate={{ fill: fillColor }}
                    transition={{ duration: 0.3 }}
                  />
                );
              })
            )}

            {/* Loss indicator */}
            <AnimatePresence>
              {(phase === "loss" || phase === "backward") && (
                <motion.g
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <rect
                    x="475"
                    y="95"
                    width="80"
                    height="45"
                    rx="8"
                    fill="#f59e0b"
                    opacity={0.15}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  <text x="515" y="113" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">
                    Loss
                  </text>
                  <text x="515" y="130" textAnchor="middle" fill="#f59e0b" fontSize="12" fontFamily="monospace">
                    0.342
                  </text>
                </motion.g>
              )}
            </AnimatePresence>

            {/* Forward arrow */}
            {phase === "forward" && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <text x="285" y="225" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">
                  Dữ liệu &rarr;
                </text>
              </motion.g>
            )}

            {/* Backward arrow */}
            {phase === "backward" && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <text x="285" y="225" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
                  &larr; Gradient lỗi
                </text>
              </motion.g>
            )}

            {/* Update message */}
            {phase === "update" && (
              <motion.g
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <text x="285" y="225" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">
                  Cập nhật trọng số theo gradient
                </text>
              </motion.g>
            )}
          </svg>

          {/* Phase explanation */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["forward", "loss", "backward", "update"] as const).map((p) => (
              <div
                key={p}
                className={`rounded-lg border p-3 text-center text-xs transition-all ${
                  phase === p
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted"
                }`}
              >
                <div
                  className="mx-auto mb-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: phaseLabels[p].color }}
                />
                {p === "forward" && "Lan truyền tiến"}
                {p === "loss" && "Tính mất mát"}
                {p === "backward" && "Lan truyền ngược"}
                {p === "update" && "Cập nhật"}
              </div>
            ))}
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Backpropagation</strong> (lan truyền ngược) là thuật toán nền tảng để
          huấn luyện mạng nơ-ron, được phổ biến bởi Rumelhart, Hinton và Williams năm 1986.
          Nó cho phép tính <strong>gradient</strong> (đạo hàm riêng) của hàm mất mát theo
          từng trọng số trong mạng một cách hiệu quả.
        </p>
        <p>Quá trình huấn luyện một bước gồm 4 giai đoạn:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Forward pass:</strong> Đưa dữ liệu qua mạng để tính đầu ra dự đoán.
          </li>
          <li>
            <strong>Tính loss:</strong> So sánh dự đoán với nhãn thực tế bằng hàm mất mát.
          </li>
          <li>
            <strong>Backward pass:</strong> Dùng quy tắc chuỗi (chain rule) để tính gradient
            từ lớp đầu ra ngược về lớp đầu vào. Mỗi trọng số nhận được &quot;phần trách
            nhiệm&quot; cho lỗi.
          </li>
          <li>
            <strong>Cập nhật trọng số:</strong> Dùng gradient descent để điều chỉnh trọng số
            theo hướng giảm loss.
          </li>
        </ol>
        <p>
          Điểm mấu chốt của backpropagation là{" "}
          <strong>quy tắc chuỗi (chain rule)</strong>: &part;L/&part;w = &part;L/&part;a &sdot;
          &part;a/&part;z &sdot; &part;z/&part;w. Gradient được &quot;lan truyền&quot; từ lớp
          cuối về lớp đầu, mỗi lớp nhân thêm gradient cục bộ của mình.
        </p>
      </ExplanationSection>
    </>
  );
}
