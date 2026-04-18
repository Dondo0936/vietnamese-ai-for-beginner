"use client";

import { useMemo, useState } from "react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: TopicMeta = {
  slug: "cnn",
  title: "Convolutional Neural Network",
  titleVi: "Mạng nơ-ron tích chập",
  description:
    "Kiến trúc chuyên xử lý ảnh bằng các bộ lọc tích chập trượt qua dữ liệu.",
  category: "dl-architectures",
  tags: ["computer-vision", "deep-learning", "architecture"],
  difficulty: "intermediate",
  relatedSlugs: ["convolution", "pooling", "transfer-learning"],
  vizType: "interactive",
};

// ─────────────────────────────────────────────────────────────────────────────
// DỮ LIỆU — chữ số 7 dạng 28×28 (giả lập kiểu MNIST đơn giản hóa)
// ─────────────────────────────────────────────────────────────────────────────

const DIGIT_SEVEN: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 2, 3, 5, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 5, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 2, 4, 6, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 6, 3, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 9, 8, 3, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 9, 9, 5, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 8, 9, 6, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 6, 9, 9, 2, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 8, 9, 7, 2, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 6, 9, 9, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 8, 9, 8, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, 9, 9, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 7, 9, 8, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 4, 8, 9, 6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 6, 9, 9, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3, 8, 9, 8, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 5, 9, 9, 5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 8, 9, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 5, 9, 7, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 7, 9, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 2, 8, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 3, 8, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// ─────────────────────────────────────────────────────────────────────────────
// KERNEL PRESETS — các bộ lọc cổ điển
// ─────────────────────────────────────────────────────────────────────────────

type Kernel3x3 = number[][];

interface KernelPreset {
  key: string;
  name: string;
  description: string;
  kernel: Kernel3x3;
}

const KERNEL_PRESETS: KernelPreset[] = [
  {
    key: "edge-v",
    name: "Cạnh dọc",
    description: "Sobel dọc — làm nổi bật cạnh dọc của nét chữ",
    kernel: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
  },
  {
    key: "edge-h",
    name: "Cạnh ngang",
    description: "Sobel ngang — làm nổi bật cạnh ngang (nét trên của số 7)",
    kernel: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ],
  },
  {
    key: "sharpen",
    name: "Làm sắc",
    description: "Tăng độ sắc — giữ chi tiết, tăng tương phản",
    kernel: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
  },
  {
    key: "blur",
    name: "Làm mờ",
    description: "Box blur — giảm nhiễu, làm mịn chi tiết",
    kernel: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
  },
  {
    key: "laplace",
    name: "Laplacian",
    description: "Phát hiện cạnh theo mọi hướng (đạo hàm bậc hai)",
    kernel: [
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0],
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHÉP TÍCH CHẬP 2D ĐƠN GIẢN (valid padding, stride 1)
// ─────────────────────────────────────────────────────────────────────────────

function conv2d(input: number[][], kernel: Kernel3x3): number[][] {
  const H = input.length;
  const W = input[0].length;
  const kH = kernel.length;
  const kW = kernel[0].length;
  const outH = H - kH + 1;
  const outW = W - kW + 1;
  const out: number[][] = Array.from({ length: outH }, () =>
    new Array<number>(outW).fill(0),
  );
  for (let i = 0; i < outH; i++) {
    for (let j = 0; j < outW; j++) {
      let sum = 0;
      for (let m = 0; m < kH; m++) {
        for (let n = 0; n < kW; n++) {
          sum += input[i + m][j + n] * kernel[m][n];
        }
      }
      out[i][j] = sum;
    }
  }
  return out;
}

// Max pooling 2×2 stride 2
function maxPool2(input: number[][]): number[][] {
  const H = input.length;
  const W = input[0].length;
  const outH = Math.floor(H / 2);
  const outW = Math.floor(W / 2);
  const out: number[][] = Array.from({ length: outH }, () =>
    new Array<number>(outW).fill(0),
  );
  for (let i = 0; i < outH; i++) {
    for (let j = 0; j < outW; j++) {
      const a = input[i * 2][j * 2];
      const b = input[i * 2][j * 2 + 1];
      const c = input[i * 2 + 1][j * 2];
      const d = input[i * 2 + 1][j * 2 + 1];
      out[i][j] = Math.max(a, b, c, d);
    }
  }
  return out;
}

function relu(input: number[][]): number[][] {
  return input.map((row) => row.map((v) => (v > 0 ? v : 0)));
}

function matrixStats(m: number[][]): { min: number; max: number; sum: number } {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const row of m) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }
  }
  return { min, max, sum };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT PHỤ — GRID HIỂN THỊ MỘT MA TRẬN SỐ (ảnh grayscale)
// ─────────────────────────────────────────────────────────────────────────────

function MatrixGrid({
  data,
  cellSize = 8,
  colorPositive = "#22c55e",
  colorNegative = "#ef4444",
  label,
  normalize = true,
}: {
  data: number[][];
  cellSize?: number;
  colorPositive?: string;
  colorNegative?: string;
  label?: string;
  normalize?: boolean;
}) {
  const { min, max } = useMemo(() => matrixStats(data), [data]);
  const absMax = Math.max(Math.abs(min), Math.abs(max), 1e-6);
  const H = data.length;
  const W = data[0]?.length ?? 0;

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
          {label}{" "}
          <span className="text-foreground">
            {H}×{W}
          </span>
        </span>
      )}
      <svg
        viewBox={`0 0 ${W * cellSize} ${H * cellSize}`}
        width={W * cellSize}
        height={H * cellSize}
        className="rounded border border-border bg-background"
      >
        {data.map((row, i) =>
          row.map((v, j) => {
            let fill = "transparent";
            if (normalize) {
              const norm = v / absMax;
              if (norm > 0) {
                fill = colorPositive;
                const opacity = Math.min(1, Math.abs(norm));
                return (
                  <rect
                    key={`${i}-${j}`}
                    x={j * cellSize}
                    y={i * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={fill}
                    opacity={opacity}
                  />
                );
              } else if (norm < 0) {
                fill = colorNegative;
                const opacity = Math.min(1, Math.abs(norm));
                return (
                  <rect
                    key={`${i}-${j}`}
                    x={j * cellSize}
                    y={i * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={fill}
                    opacity={opacity}
                  />
                );
              }
              return null;
            }
            const opacity = Math.min(1, Math.max(0, v / 9));
            return (
              <rect
                key={`${i}-${j}`}
                x={j * cellSize}
                y={i * cellSize}
                width={cellSize}
                height={cellSize}
                fill={colorPositive}
                opacity={opacity}
              />
            );
          }),
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT PHỤ — KERNEL EDITOR 3×3
// ─────────────────────────────────────────────────────────────────────────────

function KernelEditor({
  kernel,
  onChange,
}: {
  kernel: Kernel3x3;
  onChange: (next: Kernel3x3) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">
        Kernel 3×3 (chỉnh trực tiếp)
      </p>
      <table className="mx-auto border-collapse">
        <tbody>
          {kernel.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j} className="p-0.5">
                  <input
                    type="number"
                    value={v}
                    step={0.5}
                    min={-10}
                    max={10}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (isNaN(num)) return;
                      const next = kernel.map((r) => [...r]);
                      next[i][j] = num;
                      onChange(next);
                    }}
                    className="h-9 w-14 rounded-md border border-border bg-surface text-center font-mono text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] italic text-muted">
        Tổng trọng số ={" "}
        <strong className="text-foreground">
          {kernel.flat().reduce((a, b) => a + b, 0)}
        </strong>{" "}
        · tổng &gt; 0 thường làm sáng, &lt; 0 thường phát hiện cạnh.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT PHỤ — PHÂN BỐ XÁC SUẤT ĐẦU RA (softmax 10 lớp)
// ─────────────────────────────────────────────────────────────────────────────

function ClassBars({ probs }: { probs: number[] }) {
  const top = probs.indexOf(Math.max(...probs));
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">
        Softmax — xác suất 10 lớp (0-9)
      </p>
      <div className="space-y-1">
        {probs.map((p, i) => {
          const pct = Math.round(p * 100);
          const isTop = i === top;
          return (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span
                className={`w-4 font-mono ${
                  isTop ? "font-bold text-accent" : "text-muted"
                }`}
              >
                {i}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded bg-surface">
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isTop ? "#22c55e" : "#64748b",
                  }}
                />
              </div>
              <span
                className={`w-10 text-right font-mono ${
                  isTop ? "font-bold text-accent" : "text-muted"
                }`}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 rounded-md bg-accent/10 p-2 text-center">
        <span className="text-xs text-muted">Dự đoán:</span>{" "}
        <span className="text-lg font-bold text-accent">{top}</span>
        <span className="ml-2 text-xs text-muted">
          ({Math.round(probs[top] * 100)}% tin cậy)
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TÍNH SOFTMAX GIẢ LẬP TỪ FEATURE MAP CUỐI
// ─────────────────────────────────────────────────────────────────────────────

function fakeClassify(featureMap: number[][]): number[] {
  // Heuristic: dùng tổng/cấu trúc feature map để sinh vector 10 chiều hợp lý
  const { sum, max } = matrixStats(featureMap);
  const energy = Math.max(0, sum) / (featureMap.length * featureMap[0].length);
  const logits = new Array<number>(10).fill(0).map((_, i) => {
    // Gán bias cao cho lớp 7 (vì ảnh đầu vào là số 7)
    const base = i === 7 ? 3.2 : i === 1 ? 1.5 : i === 9 ? 0.8 : 0.2;
    const noise = Math.sin(i * 0.7 + energy * 0.1) * 0.3;
    return base + noise + Math.min(max, 10) * 0.05;
  });
  const maxLogit = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxLogit));
  const sumExp = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sumExp);
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ
// ─────────────────────────────────────────────────────────────────────────────

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Tại sao CNN dùng bộ lọc nhỏ (3×3) thay vì kết nối mỗi pixel với mọi pixel khác?",
    options: [
      "Vì GPU chỉ xử lý được ma trận 3×3",
      "Vì chia sẻ trọng số giúp giảm tham số và tạo tính bất biến dịch chuyển",
      "Vì ảnh chỉ có 3 kênh màu",
      "Vì đặc trưng luôn nằm ở góc trên bên trái",
    ],
    correct: 1,
    explanation:
      "Cùng một bộ lọc trượt qua mọi vị trí → chia sẻ trọng số → ít tham số hơn fully-connected rất nhiều. Và vì bộ lọc áp dụng ở mọi nơi, con mèo nằm góc trái hay góc phải đều được phát hiện.",
  },
  {
    question:
      "Ảnh 224×224×3 qua lớp Conv với 32 bộ lọc 3×3 (stride 1, padding 1). Output có kích thước gì?",
    options: ["224×224×32", "222×222×32", "112×112×32", "224×224×3"],
    correct: 0,
    explanation:
      "Padding 1 giữ nguyên kích thước không gian (224×224). Số kênh output = số bộ lọc = 32. Mỗi bộ lọc tạo ra một feature map.",
  },
  {
    question:
      "CNN hiện đại như ResNet-50 có ~25 triệu tham số. Nếu dùng fully-connected cho ảnh 224×224×3, lớp đầu tiên cần bao nhiêu tham số (FC ra 150.528 neuron)?",
    options: ["~25 triệu", "~150 nghìn", "~7 tỷ", "~22 tỷ"],
    correct: 3,
    explanation:
      "Fully-connected: 224×224×3 = 150.528 input. Nếu lớp ẩn cũng 150.528 neuron → 150.528² ≈ 22,6 tỷ tham số chỉ cho 1 lớp! CNN giảm con số này hàng nghìn lần nhờ chia sẻ trọng số.",
  },
  {
    question: "Vai trò chính của max pooling là gì?",
    options: [
      "Tăng số kênh đầu ra",
      "Giảm kích thước không gian (downsample) và tạo tính bất biến nhỏ trước nhiễu dịch chuyển",
      "Thêm phi tuyến cho mạng",
      "Chuyển tensor thành vector 1D",
    ],
    correct: 1,
    explanation:
      "Max pooling lấy giá trị lớn nhất trong mỗi vùng 2×2 → giảm 4 lần kích thước, giữ đặc trưng mạnh nhất. Nó cũng làm mạng ít nhạy cảm với dịch chuyển nhỏ vài pixel.",
  },
  {
    question:
      "Lớp Conv đầu tiên của CNN thường học được đặc trưng gì khi train trên ảnh tự nhiên?",
    options: [
      "Khuôn mặt cụ thể của người trong tập train",
      "Các cạnh, góc và gradient hướng — các đặc trưng thị giác cấp thấp",
      "Tên của các lớp phân loại",
      "Nhãn của từng pixel",
    ],
    correct: 1,
    explanation:
      "Lớp nông học các feature cấp thấp giống các tế bào đơn giản trong vỏ não thị giác: cạnh theo các hướng, đốm, gradient màu. Đặc trưng phức tạp (hình dạng, vật thể) hình thành dần ở lớp sâu hơn.",
  },
  {
    type: "fill-blank",
    question:
      "Trong CNN, bộ lọc nhỏ trượt qua ảnh được gọi là {blank}, bước nhảy mỗi lần trượt là {blank}, và phần đệm viền giúp giữ kích thước output là {blank}.",
    blanks: [
      { answer: "kernel", accept: ["filter", "bộ lọc"] },
      { answer: "stride", accept: ["bước nhảy"] },
      { answer: "padding", accept: ["đệm"] },
    ],
    explanation:
      "Kernel (hay filter) là ma trận trọng số nhỏ trượt qua input. Stride là số pixel bộ lọc dịch chuyển mỗi bước. Padding thêm viền 0 quanh ảnh để kiểm soát kích thước output — padding = 1 với kernel 3×3 giữ nguyên kích thước.",
  },
  {
    question:
      "Bạn có ảnh 28×28. Sau Conv 3×3 (stride 1, no padding), rồi MaxPool 2×2 (stride 2), kích thước không gian cuối là bao nhiêu?",
    options: ["28×28", "26×26", "13×13", "14×14"],
    correct: 2,
    explanation:
      "Conv 3×3 không padding: 28 → 26. MaxPool 2×2 stride 2: 26 → 13 (lấy floor). Ghi nhớ công thức O = floor((W − K + 2P)/S) + 1.",
  },
  {
    question:
      "Tại sao chuyển từ ảnh CIFAR-10 (32×32) sang ImageNet (224×224) thường cần kiến trúc CNN sâu hơn?",
    options: [
      "Vì ảnh to hơn cần nhiều tham số hơn",
      "Vì receptive field của lớp nông không đủ lớn để nắm vật thể — cần stack nhiều Conv+Pool",
      "Vì GPU không xử lý được ảnh lớn",
      "Vì ảnh lớn luôn nhiễu nhiều hơn",
    ],
    correct: 1,
    explanation:
      "Mỗi neuron lớp sâu 'nhìn' một vùng lớn hơn (receptive field). Với ảnh 32×32, vài lớp là đủ phủ toàn ảnh. Với 224×224, cần nhiều block Conv+Pool để receptive field đủ phủ vật thể lớn — đó là lý do VGG/ResNet có chục lớp trở lên.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ─────────────────────────────────────────────────────────────────────────────

export default function CnnTopic() {
  // State cho kernel editor
  const [presetKey, setPresetKey] = useState<string>(KERNEL_PRESETS[0].key);
  const [kernel, setKernel] = useState<Kernel3x3>(() =>
    KERNEL_PRESETS[0].kernel.map((r) => [...r]),
  );

  function applyPreset(key: string) {
    const preset = KERNEL_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setPresetKey(key);
    setKernel(preset.kernel.map((r) => [...r]));
  }

  // Pipeline CNN giả lập: Conv1 → ReLU → Pool → Conv2 → ReLU → Pool → Dense
  const conv1 = useMemo(() => conv2d(DIGIT_SEVEN, kernel), [kernel]);
  const relu1 = useMemo(() => relu(conv1), [conv1]);
  const pool1 = useMemo(() => maxPool2(relu1), [relu1]);

  // Conv2 dùng một kernel cố định phát hiện "hình dạng" (edge detector thứ 2)
  const CONV2_KERNEL: Kernel3x3 = [
    [1, 0, -1],
    [2, 0, -2],
    [1, 0, -1],
  ];
  const conv2 = useMemo(() => conv2d(pool1, CONV2_KERNEL), [pool1]);
  const relu2 = useMemo(() => relu(conv2), [conv2]);
  const pool2 = useMemo(() => maxPool2(relu2), [relu2]);

  const probs = useMemo(() => fakeClassify(pool2), [pool2]);

  const currentPreset = KERNEL_PRESETS.find((p) => p.key === presetKey);

  return (
    <>
      {/* ──────────────────────────────────────────────────────────────────
          1. PREDICTION GATE
      ────────────────────────────────────────────────────────────────── */}
      <PredictionGate
        question="Ảnh 224×224 có ~150.000 pixel. Nếu mỗi pixel kết nối với mọi neuron (fully-connected), lớp đầu tiên cần hàng tỷ tham số. Có cách nào thông minh hơn không?"
        options={[
          "Giảm kích thước ảnh xuống thật nhỏ",
          "Dùng bộ lọc nhỏ trượt qua ảnh — mỗi lần chỉ nhìn một vùng",
          "Chuyển ảnh sang đen trắng để giảm dữ liệu",
        ]}
        correct={1}
        explanation="Đúng rồi! Thay vì nhìn toàn bộ ảnh cùng lúc, ta dùng một bộ lọc nhỏ (như 3×3) trượt qua từng vùng. Giống như bạn dùng kính lúp quét qua tấm bản đồ — mỗi lần chỉ xem một vùng nhỏ nhưng cuối cùng thấy hết."
      />

      {/* ──────────────────────────────────────────────────────────────────
          2. ẨN DỤ
      ────────────────────────────────────────────────────────────────── */}
      <p>
        Hãy tưởng tượng bạn đang ở quán phở. Từ xa nhìn vào, bạn chỉ thấy{" "}
        <strong>hình dạng tổng thể</strong> — bàn, ghế, người đứng người
        ngồi. Tiến lại gần hơn, bạn nhận ra <strong>chi tiết</strong>: tô phở
        bốc khói, bó đũa để nghiêng, lọ tương ớt. Sát tận nơi, bạn nhìn rõ{" "}
        <strong>kết cấu</strong>: sợi phở mềm, lá hành xanh, miếng bò tái
        hồng. Não bạn đang &quot;nhìn theo tầng&quot; — từ thô đến tinh.
      </p>
      <p>
        <strong>CNN (Convolutional Neural Network)</strong> cũng nhìn ảnh
        theo cách đó. Nó có hàng chục lớp xếp chồng, mỗi lớp dùng các{" "}
        <TopicLink slug="image-kernels">bộ lọc (kernel)</TopicLink> nhỏ quét
        qua ảnh để phát hiện đặc trưng. Lớp đầu bắt cạnh, lớp giữa bắt hình
        dạng, lớp sâu bắt vật thể hoàn chỉnh. Ý tưởng kinh điển này lấy cảm
        hứng từ cách vỏ não thị giác của động vật có vú xử lý ánh sáng.
      </p>
      <p>
        Bí quyết quan trọng nhất: <strong>chia sẻ trọng số</strong>. Cùng một
        bộ lọc 3×3 được dùng ở mọi vị trí trên ảnh. Nhờ vậy, nếu mạng học
        được &quot;cách nhận ra cạnh dọc&quot; ở góc trái, nó cũng nhận ra ở
        góc phải — không cần học lại. Tính bất biến dịch chuyển này làm CNN
        hiệu quả hơn fully-connected hàng nghìn lần.
      </p>
      <p>
        Ở phần tương tác bên dưới, bạn sẽ thấy một chữ số <strong>7</strong>{" "}
        dạng 28×28 đi qua toàn bộ pipeline CNN mini: Conv1 → ReLU → Pool →
        Conv2 → ReLU → Pool → Dense → Softmax. Bạn có thể chỉnh kernel của
        Conv1 bằng tay và nhìn kết quả thay đổi ở mọi lớp sau — kể cả dự
        đoán lớp cuối cùng.
      </p>

      {/* ──────────────────────────────────────────────────────────────────
          3. VISUALIZATION — CNN pipeline 28×28 với kernel editor
      ────────────────────────────────────────────────────────────────── */}
      <VisualizationSection topicSlug={metadata.slug}>
        <p className="mb-4 text-sm text-muted">
          Ảnh đầu vào là chữ số 7 dạng 28×28. Chọn kernel mẫu hoặc chỉnh tay
          trong ma trận 3×3 bên phải. Mỗi bước Conv / ReLU / Pool cập nhật
          trực tiếp. Cột cuối hiển thị xác suất softmax của 10 lớp số 0-9.
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
          {/* CỘT TRÁI — Kernel editor + presets */}
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Kernel mẫu
              </p>
              <div className="space-y-1">
                {KERNEL_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPreset(preset.key)}
                    className={`block w-full rounded-md border px-3 py-1.5 text-left text-xs transition-colors ${
                      presetKey === preset.key
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-surface text-foreground hover:border-accent/50"
                    }`}
                  >
                    <span className="font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
              {currentPreset && (
                <p className="mt-2 text-[11px] italic text-muted">
                  {currentPreset.description}
                </p>
              )}
            </div>

            <KernelEditor kernel={kernel} onChange={setKernel} />
          </div>

          {/* CỘT PHẢI — Pipeline trực quan */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Lớp 1 — Input &amp; Conv1 (phát hiện cạnh)
              </p>
              <div className="flex flex-wrap items-center justify-around gap-3">
                <MatrixGrid
                  data={DIGIT_SEVEN}
                  cellSize={7}
                  normalize={false}
                  colorPositive="#3b82f6"
                  label="Input"
                />
                <div className="font-mono text-xl text-muted">→</div>
                <MatrixGrid
                  data={conv1}
                  cellSize={7}
                  label="Conv1"
                  colorPositive="#f97316"
                  colorNegative="#a855f7"
                />
                <div className="font-mono text-xl text-muted">→</div>
                <MatrixGrid
                  data={relu1}
                  cellSize={7}
                  label="ReLU"
                  colorPositive="#f97316"
                />
              </div>
              <p className="mt-2 text-[11px] italic text-muted">
                Vùng cam = giá trị dương (kích hoạt). Vùng tím = giá trị âm
                (bị ReLU loại bỏ ngay sau đó).
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/50 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Lớp 2 — Pool1 → Conv2 (phát hiện hình dạng)
              </p>
              <div className="flex flex-wrap items-center justify-around gap-3">
                <MatrixGrid
                  data={pool1}
                  cellSize={10}
                  label="Pool1"
                  colorPositive="#22c55e"
                />
                <div className="font-mono text-xl text-muted">→</div>
                <MatrixGrid
                  data={conv2}
                  cellSize={12}
                  label="Conv2"
                  colorPositive="#f97316"
                  colorNegative="#a855f7"
                />
                <div className="font-mono text-xl text-muted">→</div>
                <MatrixGrid
                  data={relu2}
                  cellSize={12}
                  label="ReLU"
                  colorPositive="#f97316"
                />
              </div>
              <p className="mt-2 text-[11px] italic text-muted">
                Sau pool, kích thước nhỏ đi một nửa. Conv2 kết hợp các cạnh
                thành hình dạng phức tạp hơn — phần đầu của &quot;đặc
                trưng&quot; cuối cùng.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/50 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Lớp 3 — Pool2 → Flatten → Dense → Softmax
              </p>
              <div className="flex flex-wrap items-center justify-around gap-3">
                <MatrixGrid
                  data={pool2}
                  cellSize={14}
                  label="Pool2"
                  colorPositive="#22c55e"
                />
                <div className="font-mono text-xl text-muted">→</div>
                <div className="flex-1 min-w-[220px]">
                  <ClassBars probs={probs} />
                </div>
              </div>
              <p className="mt-2 text-[11px] italic text-muted">
                Tensor được &quot;duỗi thẳng&quot; thành vector 1D, qua vài
                lớp Dense rồi Softmax thành phân bố xác suất 10 lớp. Mạng
                thật sẽ học các trọng số này từ hàng chục nghìn ví dụ MNIST.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm text-foreground">
            <strong>Thử nghiệm có chủ đích:</strong> chọn kernel &quot;Cạnh
            ngang&quot; — Conv1 sẽ làm nổi bật nét nằm ngang trên đầu số 7.
            Đổi sang &quot;Cạnh dọc&quot; → nét chéo của số 7 nổi lên. Thử
            kernel toàn số 0 ở cột giữa (ví dụ [[−1,0,1],[−1,0,1],[−1,0,1]])
            — bạn vừa tự chế một &quot;edge detector dọc&quot; thủ công.
            Đây chính là điều CNN học tự động qua backprop: hàng triệu kernel
            khởi tạo ngẫu nhiên rồi được tinh chỉnh để tối đa hóa độ chính
            xác phân loại.
          </p>
        </div>
      </VisualizationSection>

      {/* ──────────────────────────────────────────────────────────────────
          4. AHA MOMENT
      ────────────────────────────────────────────────────────────────── */}
      <AhaMoment>
        <p>
          <strong>CNN</strong> không phải một bộ lọc đơn lẻ — nó là hàng chục
          lớp xếp chồng, mỗi lớp phát hiện đặc trưng phức tạp hơn lớp trước.
          Cạnh → hình dạng → vật thể hoàn chỉnh.
        </p>
        <p className="mt-1 text-sm text-muted">
          Giống cách bạn xếp LEGO: viên gạch đơn → khối hình → ngôi nhà hoàn
          chỉnh. Mỗi lớp CNN xây trên nền của lớp trước, và phép màu là mạng
          <em> tự học</em> mọi kernel chứ không ai lập trình tay.
        </p>
      </AhaMoment>

      {/* ──────────────────────────────────────────────────────────────────
          5. INLINE CHALLENGES — 2 bài
      ────────────────────────────────────────────────────────────────── */}
      <InlineChallenge
        question="Ảnh 224×224×3 dùng fully-connected cần ~22,5 tỷ tham số cho lớp đầu. CNN với bộ lọc 3×3×3 và 32 filters cần bao nhiêu?"
        options={[
          "22,5 tỷ tham số (giống FC)",
          "3 × 3 × 3 × 32 + 32 = 896 tham số",
          "224 × 224 × 32 = ~1,6 triệu tham số",
        ]}
        correct={1}
        explanation="Chỉ 896 tham số! Mỗi bộ lọc có 3×3×3 = 27 trọng số + 1 bias = 28. Với 32 bộ lọc: 28 × 32 = 896. Giảm hàng triệu lần so với FC — đây là sức mạnh của chia sẻ trọng số!"
      />

      <InlineChallenge
        question="Bạn có một feature map 14×14 ra từ lớp Pool1. Sau khi qua Conv 3×3 (no padding, stride 1) rồi MaxPool 2×2, kích thước không gian sẽ là?"
        options={[
          "14×14",
          "12×12",
          "6×6",
          "7×7",
        ]}
        correct={2}
        explanation="Conv 3×3 no padding: 14 → 12. MaxPool 2×2 stride 2: 12 → 6. Luôn ghi nhớ O = floor((W − K + 2P)/S) + 1. Với Conv default (stride 1, padding 0, kernel 3), kích thước giảm 2 pixel mỗi lớp; với Pool 2×2 thì chia đôi."
      />

      {/* ──────────────────────────────────────────────────────────────────
          6. EXPLANATION SECTION
      ────────────────────────────────────────────────────────────────── */}
      <ExplanationSection>
        <p>
          <strong>CNN (Convolutional Neural Network)</strong> là kiến trúc
          mạng nơ-ron chuyên xử lý dữ liệu có cấu trúc không gian như ảnh,
          video, âm phổ. Khác với fully-connected (mỗi neuron nối với mọi
          input), CNN dùng các bộ lọc nhỏ trượt qua toàn bộ input theo{" "}
          <TopicLink slug="convolution">phép tích chập</TopicLink>. Ba
          nguyên lý cốt lõi: <em>kết nối cục bộ</em>, <em>chia sẻ trọng số</em>
          , và <em>phân cấp đặc trưng</em>.
        </p>

        <Callout variant="insight" title="1. Kết nối cục bộ (Local Connectivity)">
          <p>
            Mỗi neuron trong lớp Conv chỉ nhìn một vùng nhỏ của input
            (receptive field), không phải toàn ảnh. Giống kính lúp rọi qua
            tấm bản đồ — bạn tập trung vào chi tiết cục bộ. Kích thước kernel
            phổ biến: 3×3, 5×5, 7×7.
          </p>
        </Callout>

        <Callout variant="insight" title="2. Chia sẻ trọng số (Weight Sharing)">
          <p>
            Cùng một bộ lọc được dùng ở mọi vị trí trên ảnh. Nếu bộ lọc phát
            hiện cạnh dọc ở góc trái, nó cũng phát hiện cạnh dọc ở góc phải.
            Điều này tạo ra <strong>tính bất biến dịch chuyển</strong>{" "}
            (translation invariance) và giảm tham số hàng nghìn lần.
          </p>
        </Callout>

        <Callout variant="insight" title="3. Phân cấp đặc trưng (Feature Hierarchy)">
          <p>
            Lớp nông phát hiện cạnh, kết cấu. Lớp giữa kết hợp thành hình
            dạng (mắt, mũi, bánh xe). Lớp sâu nhận diện vật thể hoàn chỉnh
            (mặt người, ô tô, con mèo). Mỗi lớp xây trên nền lớp trước —
            giống xếp LEGO.
          </p>
        </Callout>

        <Callout variant="warning" title="Pitfall — Overfitting khi thiếu regularization">
          <p>
            CNN sâu có hàng triệu tham số — dễ overfit nếu tập train nhỏ.
            Luôn kết hợp <TopicLink slug="data-augmentation">data augmentation</TopicLink>
            , <TopicLink slug="regularization">dropout/weight decay</TopicLink>,
            và <TopicLink slug="batch-normalization">batch normalization</TopicLink>.
            Với tập &lt; 10k ảnh, ưu tiên{" "}
            <TopicLink slug="transfer-learning">transfer learning</TopicLink>{" "}
            từ backbone đã pretrain trên ImageNet.
          </p>
        </Callout>

        <p className="mt-4 font-semibold text-foreground">Công thức tích chập:</p>
        <LaTeX block>
          {String.raw`\text{Output}(i,j) = \sum_{m}\sum_{n} \text{Input}(i+m, j+n) \cdot \text{Kernel}(m,n) + \text{bias}`}
        </LaTeX>

        <p className="mt-3">Kích thước output theo stride và padding:</p>
        <LaTeX block>{String.raw`O = \left\lfloor \frac{W - K + 2P}{S} \right\rfloor + 1`}</LaTeX>
        <p className="text-sm text-muted">
          W = kích thước input, K = kernel, P = padding, S = stride. Với
          padding = &quot;same&quot; (=  ⌊K/2⌋ khi stride 1, K lẻ), kích thước
          không gian giữ nguyên sau Conv.
        </p>

        <p className="mt-3">Số tham số của một lớp Conv:</p>
        <LaTeX block>
          {String.raw`\text{params} = (K \times K \times C_{\text{in}} + 1) \times C_{\text{out}}`}
        </LaTeX>
        <p className="text-sm text-muted">
          Ví dụ Conv 3×3 với 64 input channel → 128 output channel có (3×3×64+1)×128
          = 73.856 params. Không phụ thuộc vào kích thước không gian — đây
          chính là weight sharing.
        </p>

        <Callout variant="info" title="Các kiến trúc CNN kinh điển">
          <p>
            <strong>LeNet-5</strong> (1998): CNN đầu tiên cho nhận dạng chữ
            viết tay — 7 lớp, tiền đề của mọi thứ sau.{" "}
            <strong>AlexNet</strong> (2012): thắng ImageNet áp đảo, khởi đầu
            kỷ nguyên deep learning.{" "}
            <strong>VGGNet</strong> (2014): chỉ dùng bộ lọc 3×3 xếp chồng —
            đơn giản nhưng hiệu quả.{" "}
            <strong>ResNet</strong> (2015): skip connections, huấn luyện
            được mạng 152 lớp trở lên.{" "}
            <strong>EfficientNet</strong> (2019): tối ưu cân bằng
            depth/width/resolution.{" "}
            <strong>ConvNeXt</strong> (2022): CNN hiện đại hóa, cạnh tranh
            ngang Vision Transformer.
          </p>
        </Callout>

        <CodeBlock
          language="python"
          title="PyTorch — CNN cho MNIST 28×28"
        >
{`import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleCNN(nn.Module):
    """CNN đơn giản cho MNIST: 28x28 -> 10 lớp."""

    def __init__(self, num_classes: int = 10):
        super().__init__()
        # Block 1: 28x28x1 -> 14x14x32
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.bn1   = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(2)  # halving

        # Block 2: 14x14x32 -> 7x7x64
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2   = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(2)

        # Block 3: global avg pool tiết kiệm params so với flatten
        self.gap  = nn.AdaptiveAvgPool2d(1)
        self.drop = nn.Dropout(0.3)
        self.fc   = nn.Linear(64, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, 1, 28, 28)
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.pool1(x)                          # (B, 32, 14, 14)

        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool2(x)                          # (B, 64, 7, 7)

        x = self.gap(x)                            # (B, 64, 1, 1)
        x = torch.flatten(x, 1)                    # (B, 64)
        x = self.drop(x)
        return self.fc(x)                          # (B, 10) logits


# Training loop rút gọn
model = SimpleCNN().cuda()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
criterion = nn.CrossEntropyLoss()

for images, labels in train_loader:
    images, labels = images.cuda(), labels.cuda()
    logits = model(images)
    loss = criterion(logits, labels)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

# Tổng tham số: ~30 nghìn — nhỏ gọn nhưng đạt >99% accuracy trên MNIST`}
        </CodeBlock>

        <CodeBlock
          language="python"
          title="PyTorch — Trích xuất feature map để debug"
        >
{`import torch
import torchvision.models as models
import torchvision.transforms as T
from PIL import Image

# Dùng ResNet18 pretrained để khảo sát feature map
model = models.resnet18(weights="IMAGENET1K_V1").eval()

# Hook để bắt activation của lớp conv2 trong block1
activations = {}
def hook(module, inp, out):
    activations["conv1"] = out.detach()

model.conv1.register_forward_hook(hook)

# Đưa một ảnh qua mạng
img = Image.open("cat.jpg").convert("RGB")
preprocess = T.Compose([
    T.Resize(256),
    T.CenterCrop(224),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]),
])
x = preprocess(img).unsqueeze(0)
with torch.no_grad():
    _ = model(x)

fmap = activations["conv1"]          # (1, 64, 112, 112)
print(fmap.shape)

# Visualize 8 feature map đầu tiên
import matplotlib.pyplot as plt
fig, axes = plt.subplots(2, 4, figsize=(10, 5))
for i, ax in enumerate(axes.flat):
    ax.imshow(fmap[0, i].cpu(), cmap="viridis")
    ax.set_title(f"filter #{i}")
    ax.axis("off")
plt.tight_layout()
plt.savefig("conv1_features.png", dpi=120)`}
        </CodeBlock>

        <CollapsibleDetail title="Chi tiết: Receptive field và tại sao cần stack nhiều lớp">
          <p className="text-sm">
            <strong>Receptive field</strong> của một neuron là vùng input
            ban đầu mà nó &quot;nhìn thấy&quot;. Với Conv 3×3 stride 1,
            receptive field tăng tuyến tính: lớp 1 = 3, lớp 2 = 5, lớp 3 = 7…
            Nhưng nếu xen kẽ Pool 2×2, nó tăng theo cấp số nhân. Công thức
            truy hồi:
          </p>
          <LaTeX block>
            {String.raw`r_{\ell} = r_{\ell-1} + (k_\ell - 1) \cdot \prod_{i<\ell} s_i`}
          </LaTeX>
          <p className="text-sm">
            Đây là lý do VGG/ResNet có chục lớp trở lên — để một neuron ở
            tầng sâu cuối mạng đủ receptive field phủ toàn ảnh 224×224 và
            bắt được ngữ cảnh toàn cục của vật thể. Kiến trúc hiện đại như{" "}
            <TopicLink slug="vision-transformer">Vision Transformer</TopicLink>{" "}
            bỏ qua kỹ thuật này bằng attention toàn cục ngay từ lớp đầu.
          </p>
        </CollapsibleDetail>

        <CollapsibleDetail title="Chi tiết: Backprop qua Conv layer (tóm tắt)">
          <p className="text-sm">
            Tích chập là phép toán tuyến tính, nên backprop chỉ là chuỗi quy
            tắc dây chuyền. Gradient của loss theo kernel:
          </p>
          <LaTeX block>
            {String.raw`\frac{\partial L}{\partial K(m,n)} = \sum_{i,j} \frac{\partial L}{\partial \text{Output}(i,j)} \cdot \text{Input}(i+m, j+n)`}
          </LaTeX>
          <p className="text-sm">
            Nói cách khác, gradient của kernel = tích chập của gradient
            output với input. Gradient theo input lại là tích chập với
            kernel &quot;lật ngược&quot; (transposed convolution). Chi tiết
            đầy đủ ở{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink> và{" "}
            <TopicLink slug="calculus-for-backprop">giải tích cho backprop</TopicLink>.
          </p>
        </CollapsibleDetail>

        <p className="mt-4 font-semibold text-foreground">Ứng dụng thực tế</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong>Nhận dạng ảnh:</strong> Google Photos, Facebook face
            tagging, nhận dạng biển số xe ở trạm thu phí tự động.
          </li>
          <li>
            <strong>Y tế:</strong> CNN phân tích X-quang, MRI, CT giúp bác
            sĩ phát hiện ung thư, tổn thương, bệnh võng mạc sớm hơn mắt
            thường.
          </li>
          <li>
            <strong>Xe tự lái:</strong> nhận diện người đi bộ, làn đường,
            biển báo trong thời gian thực ở độ trễ vài mili-giây.
          </li>
          <li>
            <strong>Nông nghiệp:</strong> phát hiện sâu bệnh qua ảnh lá cây
            chụp bằng điện thoại — nông dân chỉ cần một cú chụp.
          </li>
          <li>
            <strong>Bán lẻ:</strong> camera AI đếm người, phân tích hành vi
            mua sắm, theo dõi tồn kho trên kệ theo thời gian thực.
          </li>
          <li>
            <strong>An ninh:</strong> nhận diện khuôn mặt, phát hiện vật
            đáng ngờ trong video giám sát — luôn cần cân nhắc đạo đức và
            quyền riêng tư.
          </li>
          <li>
            <strong>Sản xuất:</strong> phát hiện khuyết tật trên dây chuyền
            ở tốc độ hàng trăm sản phẩm/phút, thay thế kiểm tra thủ công.
          </li>
          <li>
            <strong>Thiên văn:</strong> phân loại thiên hà, tìm hành tinh
            ngoài hệ mặt trời từ dữ liệu quang phổ và ảnh kính thiên văn.
          </li>
        </ul>

        <Callout variant="tip" title="Khi nào KHÔNG nên dùng CNN">
          <p className="text-sm">
            Dù CNN rất mạnh cho ảnh, đừng mặc định dùng nó mọi nơi. Nếu dữ
            liệu của bạn là bảng (tabular), cây quyết định/XGBoost thường tốt
            hơn. Nếu là văn bản dài, Transformer/LLM phù hợp hơn. Nếu là
            ảnh nhưng tập rất nhỏ (&lt; 500 mẫu), nên bắt đầu bằng feature
            cổ điển (HOG, SIFT) hoặc transfer learning từ backbone pretrained
            thay vì train CNN từ đầu.
          </p>
        </Callout>

        <p className="mt-4 font-semibold text-foreground">Các pitfall hay gặp</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong>Không chuẩn hóa input:</strong> quên normalize về
            [0,1] hoặc mean/std của ImageNet → mạng hội tụ chậm hoặc phân
            kỳ. Mỗi backbone pretrained có một bộ mean/std riêng, hãy đọc
            kỹ tài liệu.
          </li>
          <li>
            <strong>Padding sai:</strong> quên padding trong mạng sâu làm
            kích thước giảm quá nhanh, không còn không gian cho Conv cuối.
            Nguyên tắc: với kernel K lẻ, padding =  ⌊K/2⌋ giữ nguyên kích
            thước.
          </li>
          <li>
            <strong>Data leakage:</strong> augmentation trên test set, hoặc
            resize ảnh trước khi chia train/val. Kiểm tra chặt pipeline:
            chỉ fit thống kê trên train, áp dụng lên val/test.
          </li>
          <li>
            <strong>Quên BatchNorm:</strong> mạng sâu không có BN/LN thường
            không train được — gradient quá bất ổn. Với batch size nhỏ (&lt;
            8), cân nhắc Group Norm hoặc Layer Norm thay BN.
          </li>
          <li>
            <strong>FC layer khổng lồ:</strong> flatten feature map lớn rồi
            nối FC 1024 là nguyên nhân số một khiến mạng phình tham số. Ưu
            tiên Global Average Pooling — giảm tham số và thường tăng
            accuracy.
          </li>
          <li>
            <strong>Đánh giá chỉ bằng accuracy:</strong> bỏ qua
            precision/recall/F1 trên class mất cân bằng. Với tập 95% âm/5%
            dương, baseline &quot;luôn đoán âm&quot; đã 95% accuracy nhưng
            vô dụng.
          </li>
          <li>
            <strong>Kernel size lớn ở lớp đầu:</strong> các model hiện đại
            thích nhiều Conv 3×3 xếp chồng hơn một Conv 7×7 đơn lẻ — cùng
            receptive field nhưng ít tham số và nhiều phi tuyến hơn.
          </li>
          <li>
            <strong>Train quá ít epoch:</strong> CNN cần hàng chục epoch để
            hội tụ; learning rate schedule (cosine, warmup) tạo khác biệt
            lớn.
          </li>
        </ul>

        <p className="mt-4 font-semibold text-foreground">
          Các thuật ngữ liên quan cần nắm
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong>Feature map:</strong> output 2D của một kernel sau khi
            tích chập toàn ảnh — mỗi kênh output = 1 feature map.
          </li>
          <li>
            <strong>Channel (kênh):</strong> chiều sâu của tensor. Ảnh RGB có
            3 kênh; output Conv N filters có N kênh.
          </li>
          <li>
            <strong>Receptive field:</strong> vùng input mà một neuron
            &quot;nhìn thấy&quot;. Càng sâu, receptive field càng lớn.
          </li>
          <li>
            <strong>Global Average Pooling (GAP):</strong> lấy trung bình
            mỗi feature map thành 1 số; thay thế Flatten+FC, cực gọn.
          </li>
          <li>
            <strong>Dilated/Atrous Conv:</strong> Conv có lỗ — tăng receptive
            field mà không giảm kích thước, dùng nhiều trong segmentation.
          </li>
          <li>
            <strong>Depthwise separable Conv:</strong> tách Conv thành
            depthwise + pointwise — giảm tham số mạnh, nền tảng của
            MobileNet.
          </li>
        </ul>

        <p className="mt-3 text-sm text-muted">
          CNN chuyên cho ảnh; với dữ liệu tuần tự như văn bản hoặc chuỗi
          thời gian, hãy xem <TopicLink slug="rnn">RNN</TopicLink>,{" "}
          <TopicLink slug="lstm">LSTM</TopicLink> và{" "}
          <TopicLink slug="transformer">Transformer</TopicLink>. Với ảnh,
          lựa chọn hiện đại cạnh tranh là{" "}
          <TopicLink slug="vision-transformer">Vision Transformer</TopicLink>
          .
        </p>
      </ExplanationSection>

      {/* ──────────────────────────────────────────────────────────────────
          7. MINI SUMMARY — 6 điểm chốt
      ────────────────────────────────────────────────────────────────── */}
      <MiniSummary
        title="Ghi nhớ về CNN"
        points={[
          "CNN dùng bộ lọc nhỏ trượt qua ảnh thay vì kết nối đầy đủ — giảm tham số hàng nghìn lần.",
          "Chia sẻ trọng số tạo tính bất biến dịch chuyển — vật thể ở đâu trong ảnh cũng được nhận ra.",
          "Phân cấp đặc trưng: cạnh → hình dạng → vật thể — mỗi lớp xây trên nền lớp trước.",
          "Kiến trúc điển hình: Conv → ReLU → Pool → ... → Flatten/GAP → FC → Softmax. Stride và padding kiểm soát kích thước.",
          "Thuộc lòng công thức kích thước: O = ⌊(W − K + 2P)/S⌋ + 1 và số params: (K·K·C_in + 1)·C_out.",
          "Từ LeNet đến ConvNeXt, CNN là nền tảng của thị giác máy tính — và vẫn cạnh tranh hiệu quả với Vision Transformer hiện đại.",
        ]}
      />

      {/* ──────────────────────────────────────────────────────────────────
          8. QUIZ — 8 câu cuối bài
      ────────────────────────────────────────────────────────────────── */}
      <QuizSection questions={QUIZ} />
    </>
  );
}
