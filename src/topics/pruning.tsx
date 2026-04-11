"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "pruning",
  title: "Pruning",
  titleVi: "Pruning - Cắt tỉa mô hình",
  description:
    "Kỹ thuật loại bỏ các trọng số hoặc nơ-ron ít quan trọng để giảm kích thước mô hình.",
  category: "training-optimization",
  tags: ["pruning", "compression", "sparsity", "optimization"],
  difficulty: "intermediate",
  relatedSlugs: ["quantization", "distillation", "mixed-precision"],
  vizType: "interactive",
};

interface Connection {
  from: number;
  to: number;
  weight: number;
}

const CONNECTIONS: Connection[] = [
  { from: 0, to: 0, weight: 0.85 },
  { from: 0, to: 1, weight: 0.12 },
  { from: 0, to: 2, weight: 0.67 },
  { from: 0, to: 3, weight: 0.03 },
  { from: 1, to: 0, weight: 0.05 },
  { from: 1, to: 1, weight: 0.92 },
  { from: 1, to: 2, weight: 0.08 },
  { from: 1, to: 3, weight: 0.74 },
  { from: 2, to: 0, weight: 0.45 },
  { from: 2, to: 1, weight: 0.02 },
  { from: 2, to: 2, weight: 0.55 },
  { from: 2, to: 3, weight: 0.11 },
];

export default function PruningTopic() {
  const [threshold, setThreshold] = useState(0.2);

  const { active, pruned } = useMemo(() => {
    const a = CONNECTIONS.filter((c) => Math.abs(c.weight) >= threshold);
    const p = CONNECTIONS.filter((c) => Math.abs(c.weight) < threshold);
    return { active: a, pruned: p };
  }, [threshold]);

  const prunedPercent = ((pruned.length / CONNECTIONS.length) * 100).toFixed(0);

  const inputY = (i: number) => 60 + i * 80;
  const outputY = (i: number) => 40 + i * 60;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>cây bonsai</strong> sum suê. Nhiều cành
          nhỏ không đóng góp gì cho vẻ đẹp tổng thể mà chỉ tốn dưỡng chất.
        </p>
        <p>
          Bạn <strong>cắt tỉa</strong> những cành yếu, vô dụng. Cây trông gọn gàng hơn,
          khỏe mạnh hơn, và dưỡng chất tập trung vào cành quan trọng.
        </p>
        <p>
          Pruning mô hình AI tương tự: loại bỏ các <strong>kết nối có trọng số nhỏ</strong>{" "}
          (ít quan trọng). Mô hình nhẹ hơn, nhanh hơn, mà vẫn hoạt động gần như cũ!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Threshold slider */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted">
              Ngưỡng cắt tỉa: {threshold.toFixed(2)} (trọng số &lt; {threshold.toFixed(2)} sẽ bị loại)
            </label>
            <input type="range" min="0" max="0.8" step="0.05" value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-accent" />
          </div>

          {/* Neural network visualization */}
          <svg viewBox="0 0 500 280" className="w-full max-w-xl mx-auto">
            <text x="250" y="18" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              Mạng nơ-ron sau cắt tỉa ({prunedPercent}% đã cắt)
            </text>

            {/* Pruned connections (gray dashed) */}
            {pruned.map((c, i) => (
              <line key={`p-${i}`}
                x1="100" y1={inputY(c.from)} x2="400" y2={outputY(c.to)}
                stroke="#334155" strokeWidth="1" strokeDasharray="3,3" opacity={0.3} />
            ))}

            {/* Active connections */}
            {active.map((c, i) => (
              <line key={`a-${i}`}
                x1="100" y1={inputY(c.from)} x2="400" y2={outputY(c.to)}
                stroke="#3b82f6" strokeWidth={c.weight * 4 + 0.5} opacity={0.7} />
            ))}

            {/* Input neurons */}
            {[0, 1, 2].map((i) => (
              <g key={`in-${i}`}>
                <circle cx="80" cy={inputY(i)} r="18" fill="#3b82f6" opacity={0.8} />
                <text x="80" y={inputY(i) + 4} textAnchor="middle" fill="white" fontSize="10">
                  x{i + 1}
                </text>
              </g>
            ))}

            {/* Output neurons */}
            {[0, 1, 2, 3].map((i) => {
              const hasConnection = active.some((c) => c.to === i);
              return (
                <g key={`out-${i}`}>
                  <circle cx="420" cy={outputY(i)} r="16"
                    fill={hasConnection ? "#22c55e" : "#334155"}
                    opacity={hasConnection ? 0.8 : 0.3} />
                  <text x="420" y={outputY(i) + 4} textAnchor="middle"
                    fill={hasConnection ? "white" : "#64748b"} fontSize="10">
                    y{i + 1}
                  </text>
                </g>
              );
            })}

            {/* Labels */}
            <text x="80" y="270" textAnchor="middle" fill="#94a3b8" fontSize="9">Đầu vào</text>
            <text x="420" y="270" textAnchor="middle" fill="#94a3b8" fontSize="9">Đầu ra</text>
          </svg>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-blue-400">{active.length}/{CONNECTIONS.length}</p>
              <p className="text-xs text-muted">Kết nối còn lại</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-red-400">{prunedPercent}%</p>
              <p className="text-xs text-muted">Đã cắt tỉa</p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
              <p className="text-lg font-bold text-green-400">
                {(100 - parseInt(prunedPercent) * 0.3).toFixed(0)}%
              </p>
              <p className="text-xs text-muted">Chất lượng ước tính</p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Pruning</strong> (Cắt tỉa) là kỹ thuật loại bỏ các trọng số hoặc cấu
          trúc ít quan trọng trong mô hình để giảm kích thước và tăng tốc suy luận,
          trong khi cố gắng giữ nguyên hiệu suất.
        </p>
        <p>Hai loại pruning chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Unstructured Pruning:</strong> Loại bỏ từng trọng số riêng lẻ có giá
            trị nhỏ. Tạo ra ma trận thưa (sparse), cần phần cứng chuyên biệt để tăng tốc.
          </li>
          <li>
            <strong>Structured Pruning:</strong> Loại bỏ toàn bộ neuron, filter, hoặc
            attention head. Giảm kích thước thật sự và tăng tốc trên phần cứng tiêu chuẩn.
          </li>
        </ol>
        <p>
          Quy trình thường là: huấn luyện &rarr; cắt tỉa &rarr; fine-tune lại (để phục
          hồi chất lượng). Nghiên cứu cho thấy có thể cắt tỉa đến{" "}
          <strong>90% trọng số</strong> mà chỉ giảm dưới 2% hiệu suất ở nhiều bài toán.
        </p>
      </ExplanationSection>
    </>
  );
}
