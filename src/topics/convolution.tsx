"use client";

import React, { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  CollapsibleDetail,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────
// METADATA — giữ nguyên, registry không cần đổi
// ─────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────
// DATA — Ma trận input 6×6 (ảnh xám giả lập). Các giá trị được chọn
// sao cho các kernel preset cho ra feature map có pattern rõ ràng:
// cột trái tối, cột phải sáng → sobel X rõ rệt;
// hàng trên tối, hàng dưới sáng → sobel Y rõ rệt; v.v.
// ─────────────────────────────────────────────────────────────────────
const INPUT_6x6: number[][] = [
  [10, 10, 10, 90, 90, 90],
  [10, 20, 30, 90, 80, 70],
  [10, 30, 50, 80, 60, 40],
  [20, 40, 60, 70, 50, 30],
  [40, 50, 70, 60, 40, 20],
  [60, 70, 80, 40, 30, 10],
];

// ─────────────────────────────────────────────────────────────────────
// DATA — Các preset kernel. Mỗi kernel 3×3 tách rời nhau để dễ compare.
// ─────────────────────────────────────────────────────────────────────
type Kernel = {
  key: string;
  name: string;
  data: number[][];
  desc: string;
  // Chia cho divisor trước khi hiển thị (kernel trung bình 1/9, v.v.).
  divisor?: number;
};

const KERNELS: Kernel[] = [
  {
    key: "sobel_x",
    name: "Sobel X",
    data: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
    desc: "Phát hiện cạnh dọc — đạo hàm theo trục x",
  },
  {
    key: "sobel_y",
    name: "Sobel Y",
    data: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ],
    desc: "Phát hiện cạnh ngang — đạo hàm theo trục y",
  },
  {
    key: "gaussian",
    name: "Gaussian Blur",
    data: [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ],
    divisor: 16,
    desc: "Làm mờ có trọng số — giữ cạnh tốt hơn trung bình đơn thuần",
  },
  {
    key: "sharpen",
    name: "Sharpen",
    data: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    desc: "Làm nét — khuếch đại điểm trung tâm, trừ lân cận",
  },
  {
    key: "laplacian",
    name: "Laplacian",
    data: [
      [0, 1, 0],
      [1, -4, 1],
      [0, 1, 0],
    ],
    desc: "Đạo hàm bậc 2 theo mọi hướng — phát hiện đỉnh và rìa",
  },
  {
    key: "identity",
    name: "Identity",
    data: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    desc: "Kernel đồng nhất — output = input (dùng để sanity check)",
  },
];

// ─────────────────────────────────────────────────────────────────────
// HELPER — Tính 1 ô output tại vị trí (row, col) của input với kernel.
// ─────────────────────────────────────────────────────────────────────
function computeConv(
  input: number[][],
  kernel: number[][],
  row: number,
  col: number,
  divisor = 1,
): number {
  let sum = 0;
  for (let kr = 0; kr < 3; kr++) {
    for (let kc = 0; kc < 3; kc++) {
      sum += input[row + kr][col + kc] * kernel[kr][kc];
    }
  }
  return sum / divisor;
}

// Tính toàn bộ feature map cho 1 kernel — input 6×6, kernel 3×3, stride 1,
// không padding → output 4×4.
function computeFeatureMap(input: number[][], k: Kernel): number[][] {
  const H = input.length - 2;
  const W = input[0].length - 2;
  const divisor = k.divisor ?? 1;
  const out: number[][] = [];
  for (let r = 0; r < H; r++) {
    const row: number[] = [];
    for (let c = 0; c < W; c++) {
      row.push(computeConv(input, k.data, r, c, divisor));
    }
    out.push(row);
  }
  return out;
}

// Chuẩn hoá để vẽ màu cho feature map — map giá trị về 0..1.
function normalize(grid: number[][]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const row of grid) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (min === max) {
    max = min + 1;
  }
  return { min, max };
}

// ─────────────────────────────────────────────────────────────────────
// QUIZ — 8 câu theo yêu cầu
// ─────────────────────────────────────────────────────────────────────
const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Kernel 3×3 trượt qua ảnh 6×6 (stride 1, không padding). Output có kích thước gì?",
    options: ["6×6", "5×5", "4×4", "3×3"],
    correct: 2,
    explanation:
      "Công thức: O = (W − K) / S + 1 = (6 − 3) / 1 + 1 = 4. Feature map 4×4 — nhỏ hơn input 2 pixel ở mỗi chiều vì mất 1 pixel ở mỗi rìa.",
  },
  {
    question:
      "Tại sao CNN cần nhiều kernel khác nhau thay vì chỉ dùng một kernel?",
    options: [
      "Để tăng tốc độ xử lý",
      "Mỗi kernel phát hiện một loại đặc trưng khác nhau (cạnh, góc, kết cấu...)",
      "Để giảm kích thước ảnh",
      "Vì một kernel không đủ tham số",
    ],
    correct: 1,
    explanation:
      "Mỗi kernel là một 'mắt' chuyên tìm một pattern. Kernel cạnh dọc tìm cạnh dọc, kernel góc tìm góc. Kết hợp 32–256 kernel → mô tả đầy đủ đặc trưng cục bộ của ảnh.",
  },
  {
    question: "Padding 'same' trong tích chập có tác dụng gì?",
    options: [
      "Tăng gấp đôi kích thước output",
      "Giữ kích thước output bằng input bằng cách thêm viền 0",
      "Thay đổi giá trị kernel",
      "Giảm số lượng kernel cần dùng",
    ],
    correct: 1,
    explanation:
      "Padding thêm viền 0 quanh ảnh. Với kernel 3×3, padding = 1 giữ output cùng kích thước input. Không padding → ảnh nhỏ dần qua mỗi lớp conv, mất thông tin ở rìa.",
  },
  {
    type: "fill-blank",
    question:
      "Công thức kích thước output: O = (W − K + 2P) / S + {blank}. Với W=7, K=3, P=0, S=2 → O = {blank}.",
    blanks: [
      { answer: "1", accept: ["một", "one"] },
      { answer: "3", accept: ["3×3", "ba"] },
    ],
    explanation:
      "(7 − 3 + 0) / 2 + 1 = 2 + 1 = 3. Output 3×3. Luôn kiểm tra chia hết — nếu không, cấu hình sai và phải chỉnh stride hoặc padding.",
  },
  {
    question:
      "Sobel X kernel = [[-1,0,1],[-2,0,2],[-1,0,1]]. Nó phát hiện điều gì?",
    options: [
      "Cạnh ngang — đạo hàm theo trục y",
      "Cạnh dọc — sự chênh lệch giá trị giữa cột trái và cột phải",
      "Vùng phẳng — nơi không có cạnh",
      "Góc nghiêng 45°",
    ],
    correct: 1,
    explanation:
      "Sobel X so sánh tổng có trọng số của cột phải (+1, +2, +1) với cột trái (−1, −2, −1). Nơi nào chênh lệch lớn → có cạnh dọc. Trọng số 2 ở giữa cho hàng trung tâm nhiều ảnh hưởng hơn.",
  },
  {
    question:
      "Trong tích chập, weight sharing nghĩa là gì và mang lại lợi ích chính nào?",
    options: [
      "Nhiều kernel dùng chung một input — giảm bộ nhớ ảnh",
      "Cùng một kernel (với 9 tham số) được áp dụng ở mọi vị trí — giảm tham số so với fully-connected",
      "Nhiều layer chia sẻ cùng bias — giảm phép nhân",
      "GPU chia sẻ cache giữa các thread — tăng tốc",
    ],
    correct: 1,
    explanation:
      "Kernel 3×3 chỉ có 9 trọng số, dùng ở mọi vị trí trên feature map. Ảnh 224×224 nối fully-connected sang 1 feature map cần ~2.5 tỷ tham số; conv chỉ cần 9 → tiết kiệm hàng triệu lần và giữ được tính bất biến tịnh tiến.",
  },
  {
    question:
      "Gaussian blur 3×3 với divisor 16. Giá trị trung tâm là 4, lân cận gần là 2, góc là 1. Tại sao phải chia cho 16?",
    options: [
      "Để ép output là số nguyên",
      "Tổng trọng số = 1+2+1+2+4+2+1+2+1 = 16; chia để giữ giá trị pixel ở cùng thang đo",
      "Vì 16 là kích thước batch",
      "Để tăng độ tương phản",
    ],
    correct: 1,
    explanation:
      "Nếu không chia, pixel trung bình sẽ bị nhân lên ~16 lần. Chia cho tổng trọng số (16) giữ giá trị output trong cùng khoảng với input — giữ cường độ trung bình của ảnh.",
  },
  {
    question:
      "Kernel Laplacian [[0,1,0],[1,-4,1],[0,1,0]] có tổng trọng số = 0. Tác dụng trên vùng phẳng (mọi pixel cùng giá trị) là gì?",
    options: [
      "Khuếch đại vùng phẳng thành màu trắng",
      "Output bằng 0 — vùng phẳng bị loại bỏ, chỉ giữ lại cạnh/đỉnh",
      "Gây ra nhiễu ngẫu nhiên",
      "Giữ nguyên giá trị vùng phẳng",
    ],
    correct: 1,
    explanation:
      "Vùng phẳng: 4v − 4v = 0. Mọi kernel có tổng trọng số = 0 đều triệt tiêu DC component (độ sáng trung bình), chỉ giữ lại biến thiên — lý do Laplacian, Sobel, Prewitt đều có tính chất này.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 9;

export default function ConvolutionTopic() {
  const [kernelIdx, setKernelIdx] = useState(0);
  const [pos, setPos] = useState({ row: 0, col: 0 });
  const [autoPlay, setAutoPlay] = useState(false);

  const kernel = KERNELS[kernelIdx];
  const maxRow = INPUT_6x6.length - 3; // 3
  const maxCol = INPUT_6x6[0].length - 3; // 3

  // Feature map 4×4 cho kernel hiện tại
  const featureMap = useMemo(
    () => computeFeatureMap(INPUT_6x6, kernel),
    [kernel],
  );
  const fmRange = useMemo(() => normalize(featureMap), [featureMap]);
  const inputRange = useMemo(() => normalize(INPUT_6x6), []);

  // Giá trị tại vị trí đang hiện
  const divisor = kernel.divisor ?? 1;
  const result = computeConv(INPUT_6x6, kernel.data, pos.row, pos.col, divisor);

  const stepForward = useCallback(() => {
    setPos((p) => {
      if (p.col < maxCol) return { row: p.row, col: p.col + 1 };
      if (p.row < maxRow) return { row: p.row + 1, col: 0 };
      return { row: 0, col: 0 };
    });
  }, [maxRow, maxCol]);

  // Auto-play: trượt kernel liên tục
  React.useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(stepForward, 650);
    return () => clearInterval(id);
  }, [autoPlay, stepForward]);

  // Chi tiết phép nhân tại vị trí hiện tại
  const multParts = useMemo(() => {
    const parts: string[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const iv = INPUT_6x6[pos.row + r][pos.col + c];
        const kv = kernel.data[r][c];
        parts.push(`${iv}·(${kv})`);
      }
    }
    return parts;
  }, [pos, kernel]);

  // Helper để tô màu input & feature map — sáng = giá trị cao
  const cellBg = (v: number, range: { min: number; max: number }) => {
    const t = (v - range.min) / (range.max - range.min || 1);
    const shade = Math.round(t * 90 + 10); // 10–100%
    return `hsl(210, 12%, ${shade}%)`;
  };

  const fmBg = (v: number) => {
    const t = (v - fmRange.min) / (fmRange.max - fmRange.min || 1);
    // Hue xanh lá → vàng → đỏ
    const hue = Math.round((1 - t) * 160 + 10);
    return `hsl(${hue}, 70%, ${35 + t * 20}%)`;
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 1 — HOOK: Dự đoán */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-3">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Sandbox",
              "Aha",
              "Ví dụ đời thường",
              "Thử thách A",
              "Thử thách B",
              "Giải thích",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Bạn có ma trận 6×6 (ảnh) và một 'cửa sổ' 3×3 (bộ lọc). Tại mỗi vị trí, bạn nhân từng cặp số rồi cộng. Khi trượt cửa sổ qua toàn bộ ma trận (stride 1, không padding), output có kích thước bao nhiêu?"
          options={[
            "6×6 (bằng input)",
            "4×4 (nhỏ hơn 2 pixel mỗi chiều)",
            "3×3",
            "8×8 (lớn hơn)",
          ]}
          correct={1}
          explanation="Output 4×4! Công thức O = (W − K) / S + 1 = (6 − 3)/1 + 1 = 4. Ở rìa, kernel không có đủ 3 pixel để ôm, nên mất 1 pixel mỗi rìa — 6 trừ đi 2 (hai rìa) = 4."
        >
          <p className="text-sm text-muted mt-4">
            Bên dưới là một sandbox đầy đủ: 6 preset kernel (Sobel X/Y, Gaussian, Sharpen,
            Laplacian, Identity). Chọn kernel và xem feature map 4×4 tương ứng cập nhật trực
            tiếp.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 2 — VISUALIZATION: 2D Convolution Sandbox */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Sandbox tích chập 2D">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Sandbox — input 6×6, kernel 3×3, feature map 4×4
          </h3>
          <p className="text-sm text-muted mb-4">
            Chọn một preset kernel. Ô vàng bên trái là vùng kernel đang ôm; ô đang tính ở
            feature map bên phải được viền sáng. Nhấn <strong>Bước tiếp</strong> để trượt,
            hoặc bật <strong>Auto</strong> để xem kernel đi hết ảnh.
          </p>

          {/* Kernel picker — 6 preset */}
          <div className="mb-4 flex flex-wrap gap-2">
            {KERNELS.map((k, i) => (
              <button
                key={k.key}
                type="button"
                onClick={() => {
                  setKernelIdx(i);
                  setPos({ row: 0, col: 0 });
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  i === kernelIdx
                    ? "border-amber-500 bg-amber-500/15 text-amber-500"
                    : "border-border bg-card text-foreground hover:bg-surface"
                }`}
              >
                {k.name}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted mb-3">
            <strong>{kernel.name}:</strong> {kernel.desc}
            {kernel.divisor ? ` (chia kết quả cho ${kernel.divisor})` : ""}
          </p>

          {/* Main 3-panel layout: input | kernel | feature map */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Input 6×6 */}
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <div className="text-[11px] font-semibold text-foreground text-center mb-2">
                Input 6×6
              </div>
              <div className="inline-grid gap-1 mx-auto"
                style={{ gridTemplateColumns: "repeat(6, 36px)" }}
              >
                {INPUT_6x6.map((row, r) =>
                  row.map((v, c) => {
                    const inKernel =
                      r >= pos.row && r < pos.row + 3 &&
                      c >= pos.col && c < pos.col + 3;
                    return (
                      <motion.div
                        key={`in-${r}-${c}`}
                        className="h-9 rounded flex items-center justify-center text-[11px] font-semibold"
                        style={{
                          background: inKernel
                            ? "rgba(245, 158, 11, 0.35)"
                            : cellBg(v, inputRange),
                          color: inKernel
                            ? "#f59e0b"
                            : v > (inputRange.min + inputRange.max) / 2
                              ? "#000"
                              : "#fff",
                          outline: inKernel ? "2px solid #f59e0b" : "none",
                          outlineOffset: "-2px",
                        }}
                        animate={{ scale: inKernel ? 1.05 : 1 }}
                      >
                        {v}
                      </motion.div>
                    );
                  }),
                )}
              </div>
            </div>

            {/* Kernel 3×3 + result */}
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl border border-amber-500/60 bg-amber-500/10 p-3">
                <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 text-center mb-2">
                  Kernel {kernel.name}
                </div>
                <div className="inline-grid gap-1"
                  style={{ gridTemplateColumns: "repeat(3, 40px)" }}
                >
                  {kernel.data.map((row, r) =>
                    row.map((v, c) => (
                      <div
                        key={`k-${r}-${c}`}
                        className="h-10 rounded flex items-center justify-center text-[13px] font-bold"
                        style={{
                          background: "rgba(245, 158, 11, 0.15)",
                          color: "#f59e0b",
                          border: "1px solid rgba(245,158,11,0.4)",
                        }}
                      >
                        {v}
                      </div>
                    )),
                  )}
                </div>
                {kernel.divisor && (
                  <div className="text-[10px] text-amber-500 text-center mt-1">
                    ÷ {kernel.divisor}
                  </div>
                )}
              </div>

              {/* Equals + result */}
              <div className="text-2xl font-bold text-muted">=</div>
              <motion.div
                key={`${pos.row}-${pos.col}-${kernel.key}`}
                className="rounded-xl border-2 border-green-500 bg-green-500/10 px-4 py-2"
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-[10px] text-green-600 dark:text-green-400 text-center">
                  Giá trị tại ({pos.row}, {pos.col})
                </div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400 text-center">
                  {result.toFixed(divisor > 1 ? 1 : 0)}
                </div>
              </motion.div>
            </div>

            {/* Feature map 4×4 */}
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <div className="text-[11px] font-semibold text-green-600 dark:text-green-400 text-center mb-2">
                Feature map 4×4
              </div>
              <div className="inline-grid gap-1 mx-auto"
                style={{ gridTemplateColumns: "repeat(4, 52px)" }}
              >
                {featureMap.map((row, r) =>
                  row.map((v, c) => {
                    const isCurrent = r === pos.row && c === pos.col;
                    return (
                      <motion.div
                        key={`fm-${r}-${c}`}
                        className="h-9 rounded flex items-center justify-center text-[11px] font-semibold"
                        style={{
                          background: fmBg(v),
                          color: "#fff",
                          outline: isCurrent ? "2px solid #22c55e" : "none",
                          outlineOffset: "-2px",
                        }}
                        animate={{ scale: isCurrent ? 1.08 : 1 }}
                      >
                        {v.toFixed(divisor > 1 ? 1 : 0)}
                      </motion.div>
                    );
                  }),
                )}
              </div>
              <div className="text-[10px] text-tertiary text-center mt-2">
                Min {fmRange.min.toFixed(1)} · Max {fmRange.max.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Computation breakdown */}
          <div className="mt-4 rounded-lg border border-border bg-background/50 p-3">
            <div className="text-[11px] text-muted mb-1">
              Element-wise multiply & sum tại vị trí ({pos.row}, {pos.col}):
            </div>
            <div className="text-xs text-foreground font-mono leading-relaxed break-all">
              {multParts.join(" + ")}
              {divisor > 1 ? ` all ÷ ${divisor}` : ""} ={" "}
              <strong className="text-green-600 dark:text-green-400">
                {result.toFixed(divisor > 1 ? 2 : 0)}
              </strong>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={stepForward}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
            >
              Bước tiếp →
            </button>
            <button
              type="button"
              onClick={() => setPos({ row: 0, col: 0 })}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Đặt lại
            </button>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="accent-accent"
              />
              Auto-play
            </label>
            <span className="text-xs text-muted ml-auto">
              Vị trí: ({pos.row}, {pos.col}) / ({maxRow}, {maxCol})
            </span>
          </div>

          <p className="text-sm text-muted mt-3">
            Hãy đặc biệt chú ý khi đổi qua <strong>Sobel X</strong> và <strong>Sobel Y</strong>:
            feature map sáng ở các vị trí khác nhau, cho thấy mỗi kernel thực sự phát hiện
            một loại cạnh riêng. <strong>Identity</strong> cho output gần bằng vùng trung tâm
            của input — đúng như tên gọi.
          </p>

          {/* ────────────────────────────────────────────────────── */}
          {/* Gallery: tất cả feature map của 6 kernel cạnh nhau */}
          {/* ────────────────────────────────────────────────────── */}
          <div className="mt-6 pt-5 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-1">
              Gallery — cùng input, 6 kernel, 6 feature map khác nhau
            </h4>
            <p className="text-xs text-muted mb-3">
              Mỗi mini-card là feature map 4×4 của một kernel. Màu nóng = giá trị cao, lạnh
              = thấp. Dùng để so sánh nhanh &quot;con mắt&quot; của từng kernel.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {KERNELS.map((k) => {
                const fm = computeFeatureMap(INPUT_6x6, k);
                const range = normalize(fm);
                const colorOf = (v: number) => {
                  const t = (v - range.min) / (range.max - range.min || 1);
                  const hue = Math.round((1 - t) * 160 + 10);
                  return `hsl(${hue}, 70%, ${35 + t * 20}%)`;
                };
                return (
                  <button
                    key={`gallery-${k.key}`}
                    type="button"
                    onClick={() => {
                      setKernelIdx(KERNELS.findIndex((x) => x.key === k.key));
                      setPos({ row: 0, col: 0 });
                    }}
                    className={`rounded-lg border p-2 text-left transition-all ${
                      k.key === kernel.key
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-border bg-card hover:bg-surface"
                    }`}
                  >
                    <div className="text-[10px] font-semibold text-foreground mb-1.5">
                      {k.name}
                    </div>
                    <div
                      className="inline-grid gap-0.5"
                      style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
                    >
                      {fm.map((row, r) =>
                        row.map((v, c) => (
                          <div
                            key={`g-${k.key}-${r}-${c}`}
                            className="aspect-square rounded-sm"
                            style={{ background: colorOf(v), minWidth: "14px" }}
                            title={v.toFixed(1)}
                          />
                        )),
                      )}
                    </div>
                    <div className="text-[9px] text-tertiary mt-1.5 leading-tight">
                      min {range.min.toFixed(0)} · max {range.max.toFixed(0)}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              <strong>Quan sát:</strong> Sobel X và Sobel Y cho feature map gần như đối xứng
              nhau — một bên nhạy với cạnh dọc, một bên với cạnh ngang. Gaussian cho ra toàn
              giá trị trung bình (feature map khá &quot;phẳng&quot;). Sharpen khuếch đại
              tương phản — giá trị min/max trải rất rộng. Laplacian thường có min âm mạnh ở
              các đỉnh. Identity gần như trùng với input gốc.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 3 — AHA */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Phép toán <strong>nhân từng cặp rồi cộng</strong> mà bạn vừa thấy trên sandbox
            chính là <strong>phép tích chập</strong>. Mỗi kernel là một &quot;câu hỏi&quot;
            mà ảnh phải trả lời: &quot;ở vị trí này có cạnh dọc không?&quot;, &quot;có đỉnh
            sáng không?&quot;, &quot;có biến thiên lớn không?&quot;. Output feature map là
            bản đồ câu trả lời ở mọi vị trí.
          </p>
          <p className="text-sm text-muted mt-2">
            Điều kỳ diệu: CNN không cần được lập trình thủ công các kernel này. Nó{" "}
            <em>tự học</em> ra các kernel tối ưu cho nhiệm vụ — nhận diện mèo, đọc biển số,
            chẩn đoán X-quang — chỉ từ dữ liệu và backprop.
          </p>
        </AhaMoment>

        <Callout variant="tip" title="Đừng nhầm với tương quan chéo (cross-correlation)">
          Về mặt toán học, &quot;convolution&quot; thực sự yêu cầu lật kernel (flip 180°)
          trước khi nhân. Trong deep learning, các framework (PyTorch, TensorFlow) mặc định
          làm <em>cross-correlation</em> — không lật kernel — vì nhanh hơn và dù sao CNN
          cũng tự học trọng số kernel, nên việc lật chỉ đổi dấu trọng số. Chúng ta gọi là
          &quot;tích chập&quot; theo thói quen ngành.
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 4 — ANALOGY: Ví dụ đời thường */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ví dụ đời thường">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Thợ kiểm tra vải ở chợ Bến Thành
          </h3>
          <p className="text-sm text-foreground leading-relaxed mb-3">
            Hãy tưởng tượng bạn là thợ kiểm vải. Bạn có một{" "}
            <strong>khuôn mẫu nhựa 3×3</strong> với các đánh dấu &quot;cao&quot;,{" "}
            &quot;trung bình&quot;, &quot;thấp&quot;. Đặt khuôn lên một điểm trên tấm vải
            6×6, so sánh từng ô: ô nào khớp đánh dấu &quot;cao&quot; thì cộng điểm dương,
            ô nào khớp &quot;thấp&quot; thì cộng điểm âm. Tổng điểm tại vị trí đó cho biết
            <em>mức độ giống khuôn</em>.
          </p>
          <p className="text-sm text-foreground leading-relaxed mb-3">
            Bạn trượt khuôn sang trái, sang phải, xuống dưới, được một bản đồ 4×4 &quot;mức
            độ giống&quot;. Đó chính là <strong>feature map</strong>.
          </p>
          <p className="text-sm text-muted">
            Sau đó bạn dùng khuôn khác — khuôn phát hiện vết ố, khuôn tìm chỉ thưa, khuôn
            dò đường sọc. Mỗi khuôn cho một feature map riêng. Xếp chồng 32 feature map lên
            nhau, bạn có &quot;siêu-ảnh&quot; mô tả vải ở 32 khía cạnh khác nhau. Đây
            chính là output của một lớp conv trong CNN.
          </p>
        </div>

        <Callout variant="info" title="Tại sao CNN mạnh cho ảnh?">
          Ba tính chất: (1){" "}
          <strong>Tính cục bộ</strong> — pixel gần nhau liên quan nhau hơn pixel xa; (2){" "}
          <strong>Chia sẻ trọng số</strong> — con mèo ở góc trái trông giống con mèo ở góc
          phải, nên cùng kernel áp dụng mọi nơi; (3){" "}
          <strong>Bất biến tịnh tiến</strong> — dịch ảnh vài pixel không đổi ý nghĩa.
          Fully-connected không có những tính chất này.
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 5 — CHALLENGE A */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách A">
        <InlineChallenge
          question="Ảnh 224×224, kernel 5×5, stride=2, padding=2. Output feature map có kích thước bao nhiêu?"
          options={[
            "(224 − 5 + 4) / 2 + 1 = 112 → 112×112",
            "(224 − 5) / 2 + 1 = 110 → 110×110",
            "(224 − 5 + 4) / 1 + 1 = 224 → 224×224",
            "Không chia hết → cấu hình sai",
          ]}
          correct={0}
          explanation="Công thức: O = (W − K + 2P) / S + 1 = (224 − 5 + 2·2) / 2 + 1 = 223/2 + 1 = 111.5 + 1. Cần làm tròn xuống: ⌊223/2⌋ + 1 = 111 + 1 = 112. Output 112×112 — đúng kích thước nửa input, thường thấy ở lớp đầu của ResNet."
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 6 — CHALLENGE B */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách B">
        <InlineChallenge
          question="Một lớp conv có input 32 kênh (RGB qua vài layer), output 64 kênh, kernel 3×3. Tổng số tham số (không tính bias) là bao nhiêu?"
          options={[
            "9 — chỉ một kernel 3×3",
            "3·3·32·64 = 18.432 — mỗi kernel output nhìn cả 32 kênh input",
            "64 — mỗi feature map output 1 tham số",
            "32·64 = 2.048 — chỉ cần tham số giữa kênh",
          ]}
          correct={1}
          explanation="Mỗi kernel output phải có đủ chiều để ôm hết 32 kênh input → kích thước 3×3×32 = 288 tham số / kernel. Có 64 kernel output → 288·64 = 18.432 tham số. Thêm 64 bias nếu tính → 18.496. Đó là lý do CNN hiện đại (ResNet, VGG) có hàng chục triệu tham số dù kernel nhỏ."
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 7 — EXPLANATION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Phép tích chập 2D</strong> là phép toán cốt lõi của{" "}
            <TopicLink slug="cnn">CNN</TopicLink>. Cho ảnh đầu vào{" "}
            <LaTeX>{"I"}</LaTeX> kích thước <LaTeX>{"H \\times W"}</LaTeX> và kernel{" "}
            <LaTeX>{"K"}</LaTeX> kích thước <LaTeX>{"k \\times k"}</LaTeX>, output tại vị
            trí <LaTeX>{"(i, j)"}</LaTeX> là:
          </p>

          <LaTeX block>
            {String.raw`(I * K)(i,j) = \sum_{m=0}^{k-1}\sum_{n=0}^{k-1} I(i+m,\; j+n) \cdot K(m, n)`}
          </LaTeX>

          <p className="mt-3">
            Kích thước output tính bằng công thức tổng quát (với padding <LaTeX>{"P"}</LaTeX>
            {" "}và stride <LaTeX>{"S"}</LaTeX>):
          </p>

          <LaTeX block>
            {String.raw`O = \left\lfloor \frac{W - k + 2P}{S} \right\rfloor + 1`}
          </LaTeX>

          <p className="text-sm text-muted mt-1">
            Nếu bạn thấy phép chia không chia hết, cấu hình không hợp lệ — cần chỉnh padding
            hoặc stride. Các framework thường tự làm tròn xuống và chỉ cảnh báo.
          </p>

          <Callout variant="insight" title="Tại sao tích chập hiệu quả hơn fully-connected?">
            <p>
              <strong>Chia sẻ trọng số (weight sharing):</strong> kernel 3×3 có 9 tham số,
              dùng ở mọi vị trí trên ảnh 224×224 = 50.176 vị trí. Fully-connected giữa hai
              feature map 224×224 cần <LaTeX>{"224^4 \\approx 2.5"}</LaTeX> tỷ tham số.
              Conv chỉ cần 9 — giảm 277 triệu lần, và vẫn học được các đặc trưng cục bộ tốt
              hơn.
            </p>
          </Callout>

          <Callout variant="info" title="Tích chập nhiều kênh (multi-channel)">
            <p>
              Ảnh RGB có 3 kênh. Mỗi kernel phải có <em>cùng số kênh</em> để ôm hết input:
              kernel 3×3×3 = 27 tham số. Mỗi kênh kernel nhân phần tử với kênh input tương
              ứng, rồi cộng <em>tất cả</em> lại thành 1 giá trị scalar. 64 kernel output →
              64 feature map, mỗi cái là một &quot;quan sát&quot; riêng về ảnh đầu vào.
            </p>
          </Callout>

          <Callout variant="warning" title="Cảnh giác với output size không chia hết">
            <p>
              Với <LaTeX>{"W=7, K=3, S=2, P=0"}</LaTeX>: <LaTeX>{"(7-3)/2 + 1 = 3"}</LaTeX>{" "}
              — hợp lệ. Nhưng <LaTeX>{"W=8, K=3, S=2, P=0"}</LaTeX>:{" "}
              <LaTeX>{"(8-3)/2 + 1 = 3.5"}</LaTeX> — framework làm tròn xuống còn 3. Hệ
              quả: 1 hàng/cột ở rìa bị bỏ! Luôn kiểm tra hoặc đặt padding để chia hết.
            </p>
          </Callout>

          <Callout variant="tip" title="Quy tắc thiết kế kernel size">
            <p>
              Trong CNN hiện đại, kernel 3×3 gần như là mặc định (VGG, ResNet, EfficientNet).
              Lý do: hai lớp 3×3 chồng lên nhau cho <em>receptive field</em> tương đương
              5×5 nhưng với 2·9 = 18 tham số thay vì 25 — rẻ hơn và còn có thêm 1 lớp phi
              tuyến ở giữa. Kernel 1×1 dùng để trộn kênh mà không trộn không gian; kernel
              7×7 chỉ còn ở lớp đầu (stem) để nuốt nhanh ảnh thô.
            </p>
          </Callout>

          <CodeBlock language="python" title="conv2d_naive.py">
{`"""Phép tích chập 2D viết tay — phiên bản dễ đọc nhất."""
import numpy as np

def conv2d(image: np.ndarray, kernel: np.ndarray,
           stride: int = 1, padding: int = 0) -> np.ndarray:
    """
    Giả thiết: image và kernel đều 2D (một kênh).
    Trả về feature map 2D.
    """
    if padding > 0:
        image = np.pad(image, padding, mode="constant", constant_values=0)

    H, W = image.shape
    kH, kW = kernel.shape
    oH = (H - kH) // stride + 1
    oW = (W - kW) // stride + 1
    output = np.zeros((oH, oW), dtype=np.float32)

    for i in range(oH):
        for j in range(oW):
            region = image[i * stride : i * stride + kH,
                           j * stride : j * stride + kW]
            output[i, j] = np.sum(region * kernel)  # element-wise × rồi sum

    return output

# Sobel X — phát hiện cạnh dọc
sobel_x = np.array([[-1, 0, 1],
                    [-2, 0, 2],
                    [-1, 0, 1]], dtype=np.float32)

# Gaussian blur 3×3 — chia 16 để giữ cường độ
gaussian = np.array([[1, 2, 1],
                     [2, 4, 2],
                     [1, 2, 1]], dtype=np.float32) / 16.0

# Laplacian — phát hiện đỉnh và rìa, tổng trọng số = 0
laplacian = np.array([[0,  1, 0],
                      [1, -4, 1],
                      [0,  1, 0]], dtype=np.float32)`}
          </CodeBlock>

          <p className="mt-4">
            Trong thực tế, không ai viết vòng lặp Python cho conv — quá chậm. Các framework
            dùng thủ thuật <strong>im2col</strong> để biến tích chập thành một phép nhân ma
            trận lớn, sau đó gọi BLAS / cuDNN. Một GPU hiện đại chạy phép nhân ma trận
            nhanh hơn vòng lặp Python hàng chục nghìn lần.
          </p>

          <CodeBlock language="python" title="conv2d_pytorch.py">
{`"""Conv2D trong PyTorch — cách dùng thực tế."""
import torch
import torch.nn as nn

# Khai báo một lớp conv: 3 kênh input (RGB), 64 kênh output,
# kernel 3×3, stride 1, padding 1 (giữ nguyên kích thước không gian).
conv = nn.Conv2d(
    in_channels=3,
    out_channels=64,
    kernel_size=3,
    stride=1,
    padding=1,
)

# Input batch: 8 ảnh, 3 kênh, 224×224
x = torch.randn(8, 3, 224, 224)
y = conv(x)
print(y.shape)   # torch.Size([8, 64, 224, 224])

# Đếm tham số: 3·3·3·64 + 64 (bias) = 1.792
n_params = sum(p.numel() for p in conv.parameters())
print(f"Tham số: {n_params}")  # 1792

# Gradient flow tự động — backprop qua phép tích chập
loss = y.mean()
loss.backward()
print(conv.weight.grad.shape)  # [64, 3, 3, 3]`}
          </CodeBlock>

          <CollapsibleDetail title="Vì sao framework dùng cross-correlation thay vì convolution đúng nghĩa?">
            <p>
              Định nghĩa toán học cổ điển của convolution yêu cầu lật kernel 180° trước
              khi nhân. Công thức đầy đủ:
            </p>
            <LaTeX block>
              {String.raw`(I * K)(i,j) = \sum_{m,n} I(i-m,\; j-n) \cdot K(m, n)`}
            </LaTeX>
            <p className="mt-2">
              Các framework DL (PyTorch, TF, JAX, ONNX) đều bỏ qua bước lật — thực chất là
              <em>cross-correlation</em>. Lý do:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
              <li>
                <strong>Nhanh hơn:</strong> không phải lật kernel trong bộ nhớ — tiết kiệm
                thời gian và bộ nhớ trên GPU.
              </li>
              <li>
                <strong>Tương đương học:</strong> CNN học trọng số kernel từ dữ liệu. Dù
                có lật hay không, model cũng sẽ tự học ra phiên bản phù hợp. Chỉ khác dấu
                trọng số.
              </li>
              <li>
                <strong>Tên gọi đã cố định:</strong> ngành DL đã dùng &quot;convolution&quot;
                từ 1989 (LeNet). Đổi sang &quot;cross-correlation&quot; bây giờ sẽ gây nhầm
                lẫn lớn hơn là giữ sai thuật ngữ.
              </li>
            </ol>
            <p className="mt-2">
              Chỉ khi bạn làm signal processing thuần (xử lý âm thanh cổ điển, DSP), mới cần
              convolution &quot;đúng&quot;. Trong DL, cứ gọi là conv.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Separable convolution — nén tham số bằng cách tách kernel">
            <p>
              Nhiều kernel 2D có thể được <em>tách</em> thành tích ngoài của hai kernel 1D.
              Ví dụ Gaussian 3×3:
            </p>
            <LaTeX block>
              {String.raw`G = \frac{1}{16} \begin{bmatrix}1&2&1\\2&4&2\\1&2&1\end{bmatrix}
              = \frac{1}{4}\begin{bmatrix}1\\2\\1\end{bmatrix} \cdot \frac{1}{4}\begin{bmatrix}1&2&1\end{bmatrix}`}
            </LaTeX>
            <p className="mt-2">
              Thay vì 1 tích chập 3×3 (9 phép nhân / vị trí), ta chạy 2 tích chập 1D (3 + 3
              = 6 phép nhân / vị trí). Với kernel <LaTeX>{"k \\times k"}</LaTeX>, tiết kiệm
              từ <LaTeX>{"k^2"}</LaTeX> về <LaTeX>{"2k"}</LaTeX> — cực lớn khi k = 7, 11.
            </p>
            <p className="mt-2">
              Kiến trúc <strong>MobileNet</strong> và{" "}
              <strong>Xception</strong> đẩy ý tưởng này xa hơn với{" "}
              <em>depthwise separable convolution</em>: tách tích chập không gian và tích
              chập kênh thành hai bước riêng. Giảm 8–9 lần FLOPs so với conv thường, mất
              không đáng kể độ chính xác — lý do các model này chạy được trên điện thoại.
            </p>
          </CollapsibleDetail>

          <p className="mt-4">
            <strong>Ứng dụng ngoài thị giác:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>1D convolution</strong> cho chuỗi thời gian, âm thanh, văn bản — kernel
              trượt theo chiều thời gian, phát hiện pattern cục bộ (&quot;ba âm tiết lặp&quot;,
              &quot;tăng rồi giảm&quot;).
            </li>
            <li>
              <strong>3D convolution</strong> cho video (không gian + thời gian) và MRI
              (ba chiều không gian).
            </li>
            <li>
              <strong>Graph convolution</strong> khái quát hoá lên đồ thị bất kỳ — tổng hợp
              thông tin từ lân cận trong mạng xã hội, phân tử hoá học, mạng giao thông.
            </li>
            <li>
              <strong>Dilated / atrous convolution</strong> mở rộng receptive field mà
              không tăng tham số — chủ lực trong segmentation (DeepLab) và audio generation
              (WaveNet).
            </li>
          </ul>

          <CodeBlock language="python" title="compare_kernels.py">
{`"""So sánh các kernel preset trên cùng một ảnh xám 6×6."""
import numpy as np

def conv2d(img, k):
    H, W = img.shape; kH, kW = k.shape
    oH, oW = H - kH + 1, W - kW + 1
    out = np.zeros((oH, oW))
    for i in range(oH):
        for j in range(oW):
            out[i, j] = np.sum(img[i:i+kH, j:j+kW] * k)
    return out

img = np.array([
    [10, 10, 10, 90, 90, 90],
    [10, 20, 30, 90, 80, 70],
    [10, 30, 50, 80, 60, 40],
    [20, 40, 60, 70, 50, 30],
    [40, 50, 70, 60, 40, 20],
    [60, 70, 80, 40, 30, 10],
], dtype=np.float32)

kernels = {
    "Sobel X":   np.array([[-1,0,1],[-2,0,2],[-1,0,1]], dtype=np.float32),
    "Sobel Y":   np.array([[-1,-2,-1],[0,0,0],[1,2,1]], dtype=np.float32),
    "Gaussian":  np.array([[1,2,1],[2,4,2],[1,2,1]], dtype=np.float32) / 16,
    "Sharpen":   np.array([[0,-1,0],[-1,5,-1],[0,-1,0]], dtype=np.float32),
    "Laplacian": np.array([[0,1,0],[1,-4,1],[0,1,0]], dtype=np.float32),
    "Identity":  np.array([[0,0,0],[0,1,0],[0,0,0]], dtype=np.float32),
}

for name, k in kernels.items():
    fm = conv2d(img, k)
    print(f"{name:<10} min={fm.min():6.1f}  max={fm.max():6.1f}  mean={fm.mean():6.1f}")
    # Quan sát: Sobel X có min âm mạnh ở cột trái, max dương mạnh ở cột phải
    # — phản ánh gradient chuyển từ tối sang sáng theo chiều ngang.`}
          </CodeBlock>

          <CollapsibleDetail title="Dilated convolution — mở rộng 'tầm nhìn' mà không tăng tham số">
            <p>
              Tích chập thường có một receptive field cố định: kernel 3×3 chỉ &quot;thấy&quot;
              3 pixel mỗi chiều. Để nhìn xa hơn, bạn có thể xếp chồng nhiều layer, nhưng
              như vậy tốn tham số và compute.
            </p>
            <p className="mt-2">
              <strong>Dilated (atrous) convolution</strong> chèn khoảng trống giữa các điểm
              của kernel. Dilation rate = 2 biến kernel 3×3 thành một cửa sổ 5×5 nhưng vẫn
              chỉ dùng 9 trọng số — bỏ qua các pixel xen giữa:
            </p>
            <LaTeX block>
              {String.raw`y(i,j) = \sum_{m,n} x(i + r \cdot m,\; j + r \cdot n) \cdot K(m,n)`}
            </LaTeX>
            <p className="mt-2">
              Với <LaTeX>{"r = 2"}</LaTeX>, kernel nhảy 2 pixel mỗi bước. Ứng dụng nổi
              tiếng: <strong>WaveNet</strong> dùng dilation tăng theo cấp số nhân (1, 2, 4,
              8, 16, …, 512) để mô hình hoá âm thanh — chỉ 10 layer mà receptive field
              phủ 1024 sample. <strong>DeepLab</strong> dùng dilation trong segmentation
              để giữ resolution không gian cao mà vẫn có tầm nhìn rộng.
            </p>
          </CollapsibleDetail>

          <p className="mt-3">
            <strong>Pitfalls thường gặp khi bắt đầu với CNN:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Quên padding:</strong> feature map co dần qua mỗi layer → mất 10–20%
              pixel ở rìa sau vài layer. Luôn đặt padding để giữ kích thước, hoặc tính toán
              trước output size.
            </li>
            <li>
              <strong>Nhầm thứ tự chiều:</strong> PyTorch dùng <code>[B, C, H, W]</code>,
              TensorFlow mặc định <code>[B, H, W, C]</code>. Chuyển đổi nhầm → lỗi shape khó
              debug.
            </li>
            <li>
              <strong>Không chuẩn hoá input:</strong> pixel 0–255 qua conv sẽ cho activation
              khổng lồ, gradient nổ. Luôn normalize về mean=0, std=1 (hoặc chia 255).
            </li>
            <li>
              <strong>Dùng kernel quá lớn:</strong> kernel 11×11 ở lớp đầu (AlexNet, 2012)
              đã lỗi thời. Hiện đại dùng 3×3 stacked — rẻ hơn, sâu hơn, hiệu quả hơn.
            </li>
            <li>
              <strong>Quên bias tương tác với BatchNorm:</strong> nếu layer sau là BN, bias
              của conv vô nghĩa (BN tự tính). Đặt <code>bias=False</code> để tiết kiệm tham
              số.
            </li>
            <li>
              <strong>Áp dụng cùng kernel cho ảnh màu:</strong> Sobel cho ảnh xám cần 1 kênh
              kernel. Với RGB phải chạy kernel 3D (3 kênh) hoặc chuyển ảnh sang grayscale
              trước. Sai số im lặng — model không báo lỗi mà kết quả chỉ &quot;kém&quot;.
            </li>
            <li>
              <strong>Bỏ qua kiểm tra output shape sau mỗi layer:</strong> khi thiết kế
              mạng, in shape sau mỗi lớp để chắc chắn downsample đúng như kế hoạch. Bug
              shape ở conv-5 rất khó truy ngược nếu chỉ thấy loss kỳ lạ.
            </li>
          </ul>

          <Callout variant="insight" title="Receptive field — 'tầm nhìn' của một neuron">
            <p>
              Một neuron ở lớp conv-1 chỉ thấy 3×3 pixel gốc. Neuron ở lớp conv-2 (chồng
              lên conv-1) thấy 5×5 pixel gốc. Qua càng nhiều layer, receptive field càng
              lớn. Công thức truy ngược:
            </p>
            <LaTeX block>
              {String.raw`R_{l} = R_{l-1} + (k_{l} - 1) \cdot \prod_{i=1}^{l-1} s_{i}`}
            </LaTeX>
            <p className="mt-2">
              Với ResNet-50, receptive field ở lớp cuối khoảng 483×483 — đủ để &quot;nhìn&quot;
              cả một ảnh 224×224 nhiều lần. Đây là lý do feature ở tầng cuối mô tả được
              context toàn cục (loài chó, khung cảnh) thay vì chỉ cạnh/kết cấu cục bộ.
            </p>
          </Callout>

          <Callout variant="warning" title="Conv không phải lúc nào cũng tốt hơn Transformer">
            <p>
              Từ 2020, Vision Transformer (ViT) và các biến thể (Swin, DeiT) cho thấy
              self-attention có thể cạnh tranh với conv trên tác vụ thị giác — đặc biệt khi
              có nhiều dữ liệu. Bài học: inductive bias &quot;cục bộ&quot; của conv là lợi
              thế khi dữ liệu ít, nhưng giới hạn khi dữ liệu rất nhiều. Các kiến trúc hiện
              đại (ConvNeXt, CoAtNet) kết hợp cả hai — lấy mạnh điểm của từng bên.
            </p>
          </Callout>

          <CollapsibleDetail title="Im2col — bí mật tốc độ của conv trên GPU">
            <p>
              Vòng lặp Python chạy conv 224×224 trên CPU mất vài giây. PyTorch làm việc đó
              trong mili-giây. Bí quyết: <strong>im2col</strong> — biến tích chập thành
              phép nhân ma trận lớn, rồi gọi cuBLAS / cuDNN đã tối ưu tận răng cho GPU.
            </p>
            <p className="mt-2">
              Các bước:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm mt-1">
              <li>
                <strong>Im2col:</strong> mỗi vị trí kernel sẽ ôm một vùng <LaTeX>{"k \\times k \\times C"}</LaTeX> của
                input. Ta flatten vùng đó thành một cột, rồi ghép tất cả các cột lại
                thành ma trận X kích thước <LaTeX>{"(k^2 C) \\times (H' W')"}</LaTeX>.
              </li>
              <li>
                <strong>Reshape kernel:</strong> tất cả tham số kernel được xếp thành ma
                trận W kích thước <LaTeX>{"C_{out} \\times (k^2 C)"}</LaTeX>.
              </li>
              <li>
                <strong>Matmul:</strong> <LaTeX>{"Y = W \\cdot X"}</LaTeX>. Kết quả là
                ma trận <LaTeX>{"C_{out} \\times (H' W')"}</LaTeX>.
              </li>
              <li>
                <strong>Col2im:</strong> reshape lại thành tensor 4D{" "}
                <LaTeX>{"(B, C_{out}, H', W')"}</LaTeX>.
              </li>
            </ol>
            <p className="mt-2">
              Chi phí bộ nhớ: ma trận X lớn gấp <LaTeX>{"k^2"}</LaTeX> lần input gốc — với
              kernel 3×3 là 9 lần. Đây là đánh đổi: dùng thêm bộ nhớ để tận dụng tốc độ
              matmul của GPU. Các kỹ thuật mới (Winograd, FFT-conv) giảm số FLOP nhưng cài
              đặt phức tạp hơn — chỉ dùng khi kernel size phù hợp.
            </p>
          </CollapsibleDetail>

          <p className="mt-4">
            <strong>Mở rộng đọc thêm:</strong> sau khi hiểu convolution, bước kế tiếp là
            học các khối xây dựng của CNN hiện đại — <TopicLink slug="pooling">pooling</TopicLink>{" "}
            để downsample, <TopicLink slug="cnn">kiến trúc CNN</TopicLink> (LeNet → VGG →
            ResNet → EfficientNet), và so sánh với{" "}
            <TopicLink slug="self-attention">self-attention</TopicLink> của Transformer.
            Hiểu sâu một phép toán cơ bản luôn đáng giá hơn lướt qua mười kỹ thuật hào
            nhoáng.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 8 — MINI SUMMARY */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="6 điều cần nhớ về phép tích chập"
          points={[
            "Tích chập = trượt kernel qua input, nhân từng cặp (element-wise) rồi cộng — phát hiện đặc trưng cục bộ.",
            "Mỗi kernel phát hiện một loại đặc trưng: Sobel → cạnh; Gaussian → làm mờ; Laplacian → đỉnh/rìa; Identity → giữ nguyên.",
            "Công thức output: O = ⌊(W − K + 2P) / S⌋ + 1. Stride lớn → output nhỏ; padding giữ kích thước.",
            "Chia sẻ trọng số: kernel 3×3 có 9 tham số nhưng áp dụng mọi vị trí — tiết kiệm hàng triệu lần so với fully-connected.",
            "Multi-channel: kernel phải cùng số kênh với input; ảnh RGB + kernel 3×3 → kernel thực sự là 3×3×3 = 27 tham số.",
            "Framework DL dùng cross-correlation (không lật kernel) nhưng vẫn gọi là convolution theo thói quen ngành.",
          ]}
        />

        <Callout variant="tip" title="Bài tập thực hành">
          Mở Colab, lấy một ảnh xám bất kỳ và áp dụng cả 5 kernel preset (Sobel X/Y, Gaussian,
          Sharpen, Laplacian). Quan sát: Sobel X có feature map sáng ở đâu? Gaussian có giữ
          cạnh không? Laplacian ra sao ở vùng phẳng? Làm tay một lần để thấm — sau đó mới
          học CNN cho tự động.
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 9 — QUIZ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
