"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "convolution",
  title: "Convolution Operation",
  titleVi: "Phép tích chập",
  description: "Phép toán trượt bộ lọc qua dữ liệu để phát hiện đặc trưng cục bộ",
  category: "dl-architectures",
  tags: ["computer-vision", "fundamentals", "math"],
  difficulty: "intermediate",
  relatedSlugs: ["cnn", "pooling", "self-attention"],
  vizType: "interactive",
};

const inputGrid = [
  [1, 2, 0, 1, 3],
  [0, 1, 3, 2, 1],
  [2, 3, 1, 0, 2],
  [1, 0, 2, 3, 1],
  [3, 2, 1, 1, 0],
];

const kernel = [
  [1, 0, -1],
  [1, 0, -1],
  [1, 0, -1],
];

function computeConv(row: number, col: number) {
  let sum = 0;
  for (let kr = 0; kr < 3; kr++) {
    for (let kc = 0; kc < 3; kc++) {
      sum += inputGrid[row + kr][col + kc] * kernel[kr][kc];
    }
  }
  return sum;
}

export default function ConvolutionTopic() {
  const [pos, setPos] = useState({ row: 0, col: 0 });

  const cellSize = 40;
  const kernelCellSize = 35;
  const result = computeConv(pos.row, pos.col);

  const maxRow = inputGrid.length - 3;
  const maxCol = inputGrid[0].length - 3;

  const stepForward = () => {
    setPos((p) => {
      if (p.col < maxCol) return { row: p.row, col: p.col + 1 };
      if (p.row < maxRow) return { row: p.row + 1, col: 0 };
      return { row: 0, col: 0 };
    });
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đặt một <strong>khung cửa sổ nhỏ 3&times;3</strong> lên tấm
          ảnh. Tại mỗi vị trí, bạn nhân từng pixel với trọng số tương ứng trong khung, rồi
          cộng tất cả lại. Kết quả cho bạn biết đặc trưng tại vùng đó (ví dụ: có cạnh dọc
          không).
        </p>
        <p>
          Rồi bạn trượt khung sang phải một bước, lặp lại. Đây chính là <strong>phép tích
          chập</strong> &mdash; nền tảng của CNN.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp &quot;Bước tiếp&quot; để trượt kernel qua input. Quan sát phép nhân và cộng tại
          mỗi vị trí.
        </p>
        <svg
          viewBox="0 0 500 260"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Input grid */}
          <text x={110} y={18} fontSize={12} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Input (5&times;5)
          </text>
          {inputGrid.map((row, r) =>
            row.map((val, c) => {
              const x = 10 + c * cellSize;
              const y = 25 + r * cellSize;
              const inKernel = r >= pos.row && r < pos.row + 3 && c >= pos.col && c < pos.col + 3;
              return (
                <g key={`${r}-${c}`}>
                  <rect
                    x={x} y={y} width={cellSize - 2} height={cellSize - 2}
                    rx={4}
                    fill={inKernel ? "#f59e0b" : "#666"}
                    opacity={inKernel ? 0.25 : 0.08}
                    stroke={inKernel ? "#f59e0b" : "#666"}
                    strokeWidth={inKernel ? 2 : 0.5}
                  />
                  <text x={x + cellSize / 2 - 1} y={y + cellSize / 2 + 4} fontSize={14} fill="currentColor" className="text-foreground" textAnchor="middle">
                    {val}
                  </text>
                </g>
              );
            })
          )}

          {/* Kernel */}
          <text x={330} y={18} fontSize={12} fill="#f59e0b" textAnchor="middle" fontWeight={600}>
            Kernel (3&times;3)
          </text>
          {kernel.map((row, r) =>
            row.map((val, c) => {
              const x = 265 + c * kernelCellSize;
              const y = 25 + r * kernelCellSize;
              return (
                <g key={`k-${r}-${c}`}>
                  <rect
                    x={x} y={y} width={kernelCellSize - 2} height={kernelCellSize - 2}
                    rx={4} fill="#f59e0b" opacity={0.15} stroke="#f59e0b" strokeWidth={1}
                  />
                  <text x={x + kernelCellSize / 2 - 1} y={y + kernelCellSize / 2 + 4} fontSize={13}
                    fill="#f59e0b" textAnchor="middle" fontWeight={600}>
                    {val}
                  </text>
                </g>
              );
            })
          )}

          {/* Equals */}
          <text x={400} y={80} fontSize={24} fill="currentColor" className="text-muted" fontWeight={700}>
            =
          </text>

          {/* Result */}
          <rect x={420} y={55} width={60} height={45} rx={8} fill="#22c55e" opacity={0.15} stroke="#22c55e" strokeWidth={2} />
          <text x={450} y={83} fontSize={20} fill="#22c55e" textAnchor="middle" fontWeight={700}>
            {result}
          </text>

          {/* Computation detail */}
          <text x={250} y={160} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
            Phép tính tại vị trí ({pos.row}, {pos.col}):
          </text>
          <text x={250} y={178} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
            {Array.from({ length: 3 }, (_, r) =>
              Array.from({ length: 3 }, (_, c) =>
                `${inputGrid[pos.row + r][pos.col + c]}&times;${kernel[r][c] >= 0 ? "" : "("}${kernel[r][c]}${kernel[r][c] >= 0 ? "" : ")"}`
              ).join(" + ")
            ).join(" + ")} = {result}
          </text>

          {/* Output grid (small) */}
          <text x={250} y={210} fontSize={11} fill="#22c55e" textAnchor="middle" fontWeight={600}>
            Output (3&times;3)
          </text>
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 3 }, (_, c) => {
              const x = 195 + c * 38;
              const y = 218 + r * 28;
              const computed = r < pos.row || (r === pos.row && c <= pos.col);
              const current = r === pos.row && c === pos.col;
              const val = computeConv(r, c);
              return (
                <g key={`o-${r}-${c}`}>
                  <rect x={x} y={y} width={36} height={26} rx={4}
                    fill={current ? "#22c55e" : computed ? "#22c55e" : "#666"}
                    opacity={current ? 0.3 : computed ? 0.1 : 0.05}
                    stroke={current ? "#22c55e" : "#666"} strokeWidth={current ? 2 : 0.5}
                  />
                  <text x={x + 18} y={y + 17} fontSize={11} fill={computed || current ? "#22c55e" : "#999"} textAnchor="middle">
                    {computed || current ? val : "?"}
                  </text>
                </g>
              );
            })
          )}
        </svg>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={stepForward}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Bước tiếp
          </button>
          <button
            onClick={() => setPos({ row: 0, col: 0 })}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Đặt lại
          </button>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Phép tích chập (Convolution)</strong> trượt bộ lọc (kernel) qua dữ liệu
          đầu vào. Tại mỗi vị trí, tính <strong>tổng tích phần tử</strong> (element-wise
          multiplication rồi sum) giữa vùng input và kernel.
        </p>
        <p>
          Kernel trong ví dụ là bộ lọc <strong>phát hiện cạnh dọc</strong>: cột trái dương,
          cột phải âm. Kết quả lớn nơi có sự thay đổi mạnh từ trái sang phải. Mỗi CNN
          có <strong>hàng trăm kernel</strong> khác nhau, mỗi kernel phát hiện một đặc
          trưng khác.
        </p>
        <p>
          Tham số quan trọng: <strong>stride</strong> (bước nhảy), <strong>padding</strong>
          (đệm viền), <strong>kích thước kernel</strong>. Output nhỏ hơn input (trừ khi có
          padding). Số lượng tham số rất ít so với fully-connected layer.
        </p>
      </ExplanationSection>
    </>
  );
}
