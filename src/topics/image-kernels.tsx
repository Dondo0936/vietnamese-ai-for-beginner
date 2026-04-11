"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "image-kernels",
  title: "Image Kernels",
  titleVi: "Kernel ảnh - Bộ lọc tích chập",
  description:
    "Ma trận nhỏ trượt trên ảnh để trích xuất đặc trưng, nền tảng toán học của mạng tích chập.",
  category: "computer-vision",
  tags: ["computer-vision", "convolution", "filtering"],
  difficulty: "beginner",
  relatedSlugs: ["convolution", "cnn", "feature-extraction-cnn"],
  vizType: "interactive",
};

const IMAGE_GRID = [
  [50, 50, 50, 200, 200],
  [50, 50, 50, 200, 200],
  [50, 50, 100, 200, 200],
  [50, 50, 200, 200, 200],
  [50, 200, 200, 200, 200],
];

const KERNELS: Record<string, { name: string; matrix: number[][] }> = {
  edge: {
    name: "Phát hiện cạnh",
    matrix: [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1],
    ],
  },
  sharpen: {
    name: "Làm sắc nét",
    matrix: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
  },
  blur: {
    name: "Làm mờ",
    matrix: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
  },
};

export default function ImageKernelsTopic() {
  const [kernelType, setKernelType] = useState<string>("edge");
  const [posR, setPosR] = useState(1);
  const [posC, setPosC] = useState(1);

  const kernel = KERNELS[kernelType];

  const result = useMemo(() => {
    let sum = 0;
    const divisor = kernelType === "blur" ? 9 : 1;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = posR + dr;
        const c = posC + dc;
        if (r >= 0 && r < 5 && c >= 0 && c < 5) {
          sum += IMAGE_GRID[r][c] * kernel.matrix[dr + 1][dc + 1];
        }
      }
    }
    return Math.max(0, Math.min(255, Math.round(sum / divisor)));
  }, [posR, posC, kernel, kernelType]);

  const cellSize = 50;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>kính lúp đặc biệt</strong>. Khi
          bạn đặt kính lên ảnh, nó không chỉ phóng to mà còn{" "}
          <strong>biến đổi</strong> vùng nhìn thấy — có kính phát hiện cạnh,
          kính làm mờ, kính làm sắc nét.
        </p>
        <p>
          Kernel (bộ lọc) là kính lúp đó — một ma trận nhỏ{" "}
          <strong>trượt trên ảnh</strong>, nhân với pixel bên dưới rồi cộng
          lại thành giá trị mới. Mỗi loại kernel tạo ra hiệu ứng khác nhau —
          đây chính là phép <strong>tích chập</strong> (convolution)!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(KERNELS).map(([key, k]) => (
              <button
                key={key}
                onClick={() => setKernelType(key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  kernelType === key
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {k.name}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
            {/* Image grid */}
            <text x="130" y="18" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
              Ảnh đầu vào
            </text>
            {IMAGE_GRID.map((row, r) =>
              row.map((val, c) => {
                const inKernel =
                  Math.abs(r - posR) <= 1 && Math.abs(c - posC) <= 1;
                return (
                  <g
                    key={`img-${r}-${c}`}
                    onClick={() => {
                      if (r >= 1 && r <= 3 && c >= 1 && c <= 3) {
                        setPosR(r);
                        setPosC(c);
                      }
                    }}
                    style={{ cursor: r >= 1 && r <= 3 && c >= 1 && c <= 3 ? "pointer" : "default" }}
                  >
                    <rect
                      x={5 + c * cellSize}
                      y={25 + r * cellSize}
                      width={cellSize}
                      height={cellSize}
                      fill={`rgb(${val},${val},${val})`}
                      stroke={inKernel ? "#f59e0b" : "#334155"}
                      strokeWidth={inKernel ? 2.5 : 1}
                    />
                    <text
                      x={5 + c * cellSize + cellSize / 2}
                      y={25 + r * cellSize + cellSize / 2 + 4}
                      textAnchor="middle"
                      fill={val > 128 ? "#0f172a" : "#e2e8f0"}
                      fontSize="11"
                    >
                      {val}
                    </text>
                  </g>
                );
              })
            )}

            {/* Kernel */}
            <text x="410" y="18" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
              Kernel ({kernel.name})
            </text>
            {kernel.matrix.map((row, r) =>
              row.map((val, c) => (
                <g key={`ker-${r}-${c}`}>
                  <rect
                    x={340 + c * cellSize}
                    y={25 + r * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill="#1e293b"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  <text
                    x={340 + c * cellSize + cellSize / 2}
                    y={25 + r * cellSize + cellSize / 2 + 4}
                    textAnchor="middle"
                    fill={val > 0 ? "#22c55e" : val < 0 ? "#ef4444" : "#64748b"}
                    fontSize="13"
                    fontWeight="bold"
                  >
                    {val}
                  </text>
                </g>
              ))
            )}

            {/* Multiply symbol */}
            <text x="295" y="100" textAnchor="middle" fill="#94a3b8" fontSize="24" fontWeight="bold">
              *
            </text>

            {/* Result */}
            <text x="300" y="225" textAnchor="middle" fill="#94a3b8" fontSize="11">
              Giá trị đầu ra tại vị trí ({posR}, {posC}):
            </text>
            <rect x="240" y="235" width="120" height="45" rx="8" fill="#f59e0b" opacity={0.2} stroke="#f59e0b" strokeWidth="1.5" />
            <text x="300" y="265" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="bold">
              {result}
            </text>

            <text x="300" y="310" textAnchor="middle" fill="#64748b" fontSize="10">
              Nhấn vào ô ảnh (không phải viền) để di chuyển kernel
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Image Kernel</strong> (bộ lọc) là ma trận nhỏ (thường 3x3
          hoặc 5x5) thực hiện phép tích chập với ảnh. Đây là thao tác cốt lõi
          của mạng nơ-ron tích chập (CNN).
        </p>
        <p>Các loại kernel phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Phát hiện cạnh (Edge):</strong> Trung tâm dương, xung quanh
            âm — nhấn mạnh sự thay đổi cường độ pixel.
          </li>
          <li>
            <strong>Làm sắc nét (Sharpen):</strong> Tăng cường chi tiết bằng
            cách khuếch đại sự khác biệt giữa pixel trung tâm và lân cận.
          </li>
          <li>
            <strong>Làm mờ (Blur):</strong> Lấy trung bình các pixel lân cận
            để làm mịn ảnh, giảm nhiễu.
          </li>
        </ol>
        <p>
          Trong CNN truyền thống, kernel được thiết kế thủ công. Trong CNN hiện
          đại, <strong>kernel được học tự động</strong> thông qua backpropagation
          — mạng tự tìm ra bộ lọc tối ưu cho tác vụ cụ thể.
        </p>
      </ExplanationSection>
    </>
  );
}
