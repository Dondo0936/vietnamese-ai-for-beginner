"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "pooling",
  title: "Pooling Layers",
  titleVi: "Lớp gộp",
  description: "Giảm kích thước dữ liệu bằng cách tóm tắt thông tin trong vùng lân cận",
  category: "dl-architectures",
  tags: ["computer-vision", "cnn", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["convolution", "cnn", "u-net"],
  vizType: "interactive",
};

const inputGrid = [
  [6, 2, 8, 4],
  [1, 5, 3, 7],
  [9, 3, 1, 6],
  [4, 8, 5, 2],
];

export default function PoolingTopic() {
  const [poolType, setPoolType] = useState<"max" | "avg">("max");
  const [activeQuad, setActiveQuad] = useState(0);

  const quads = [
    { row: 0, col: 0 },
    { row: 0, col: 2 },
    { row: 2, col: 0 },
    { row: 2, col: 2 },
  ];

  const getPoolResult = (qr: number, qc: number) => {
    const vals = [
      inputGrid[qr][qc], inputGrid[qr][qc + 1],
      inputGrid[qr + 1][qc], inputGrid[qr + 1][qc + 1],
    ];
    if (poolType === "max") return Math.max(...vals);
    return vals.reduce((a, b) => a + b, 0) / 4;
  };

  const cellSize = 55;
  const q = quads[activeQuad];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có bức ảnh rất chi tiết và muốn tạo ảnh thu nhỏ. Bạn chia
          ảnh thành các ô 2&times;2, rồi từ mỗi ô chỉ giữ lại <strong>giá trị lớn nhất</strong>
          (max pooling) hoặc <strong>giá trị trung bình</strong> (average pooling).
        </p>
        <p>
          Kết quả: ảnh nhỏ hơn 4 lần nhưng vẫn giữ được thông tin quan trọng nhất. Điều
          này giúp CNN <strong>giảm tính toán</strong> và tạo <strong>tính bất biến dịch
          chuyển nhẹ</strong>.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Chọn kiểu pooling và nhấp vào từng vùng 2&times;2 trên input để xem kết quả.
        </p>
        <svg
          viewBox="0 0 500 280"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Input grid */}
          <text x={120} y={20} fontSize={12} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Input (4&times;4)
          </text>
          {inputGrid.map((row, r) =>
            row.map((val, c) => {
              const x = 10 + c * cellSize;
              const y = 30 + r * cellSize;
              const inQuad = r >= q.row && r < q.row + 2 && c >= q.col && c < q.col + 2;
              const isMax = poolType === "max" && inQuad && val === getPoolResult(q.row, q.col);
              return (
                <g key={`${r}-${c}`}>
                  <rect
                    x={x} y={y} width={cellSize - 3} height={cellSize - 3}
                    rx={6} fill={inQuad ? "#f59e0b" : "#666"}
                    opacity={isMax ? 0.35 : inQuad ? 0.15 : 0.08}
                    stroke={inQuad ? "#f59e0b" : "#666"} strokeWidth={inQuad ? 2 : 0.5}
                  />
                  <text x={x + cellSize / 2 - 1} y={y + cellSize / 2 + 2} fontSize={18}
                    fill={isMax ? "#f59e0b" : "currentColor"} className={isMax ? "" : "text-foreground"}
                    textAnchor="middle" fontWeight={isMax ? 800 : 400}>
                    {val}
                  </text>
                </g>
              );
            })
          )}

          {/* Clickable quadrants overlay */}
          {quads.map((qd, i) => (
            <rect
              key={`quad-${i}`}
              x={10 + qd.col * cellSize}
              y={30 + qd.row * cellSize}
              width={cellSize * 2 - 3}
              height={cellSize * 2 - 3}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => setActiveQuad(i)}
            />
          ))}

          {/* Arrow */}
          <line x1={235} y1={140} x2={290} y2={140} stroke="#888" strokeWidth={2} />
          <polygon points="295,140 288,135 288,145" fill="#888" />
          <text x={263} y={128} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
            {poolType === "max" ? "Max" : "Avg"}
          </text>

          {/* Output grid */}
          <text x={370} y={75} fontSize={12} fill="#22c55e" textAnchor="middle" fontWeight={600}>
            Output (2&times;2)
          </text>
          {[0, 1].map((r) =>
            [0, 1].map((c) => {
              const x = 310 + c * cellSize;
              const y = 85 + r * cellSize;
              const qi = r * 2 + c;
              const val = getPoolResult(quads[qi].row, quads[qi].col);
              const isActive = qi === activeQuad;
              return (
                <g key={`out-${r}-${c}`}>
                  <rect
                    x={x} y={y} width={cellSize - 3} height={cellSize - 3}
                    rx={6} fill="#22c55e" opacity={isActive ? 0.3 : 0.1}
                    stroke="#22c55e" strokeWidth={isActive ? 2 : 1}
                  />
                  <text x={x + cellSize / 2 - 1} y={y + cellSize / 2 + 2} fontSize={18}
                    fill="#22c55e" textAnchor="middle" fontWeight={isActive ? 800 : 400}>
                    {poolType === "avg" ? val.toFixed(1) : val}
                  </text>
                </g>
              );
            })
          )}
        </svg>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setPoolType("max")}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
              poolType === "max"
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-foreground hover:bg-accent hover:text-white"
            }`}
          >
            Max Pooling
          </button>
          <button
            onClick={() => setPoolType("avg")}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
              poolType === "avg"
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-foreground hover:bg-accent hover:text-white"
            }`}
          >
            Average Pooling
          </button>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Pooling</strong> giảm kích thước không gian của feature map. Cửa sổ
          2&times;2 với stride 2 giảm kích thước đi 4 lần (chiều rộng &times; chiều cao
          đều giảm một nửa).
        </p>
        <p>
          <strong>Max Pooling</strong> lấy giá trị lớn nhất trong cửa sổ &mdash; giữ lại
          đặc trưng nổi bật nhất. <strong>Average Pooling</strong> lấy trung bình &mdash;
          giữ lại thông tin tổng quát hơn. Max pooling phổ biến hơn trong các CNN hiện đại.
        </p>
        <p>
          Lợi ích: <strong>giảm tham số và tính toán</strong>, tạo tính <strong>bất biến
          dịch chuyển nhỏ</strong> (đặc trưng dịch chuyển vài pixel vẫn cho kết quả tương
          tự), và giúp <strong>chống overfitting</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
