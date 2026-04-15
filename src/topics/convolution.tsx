"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
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

/* ── Data ── */
const INPUT_GRID = [
  [1, 2, 0, 1, 3],
  [0, 1, 3, 2, 1],
  [2, 3, 1, 0, 2],
  [1, 0, 2, 3, 1],
  [3, 2, 1, 1, 0],
];

const KERNELS: Record<string, { name: string; data: number[][]; desc: string }> = {
  edge_v: {
    name: "Cạnh dọc",
    data: [[1, 0, -1], [1, 0, -1], [1, 0, -1]],
    desc: "Phát hiện sự thay đổi từ trái sang phải",
  },
  edge_h: {
    name: "Cạnh ngang",
    data: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
    desc: "Phát hiện sự thay đổi từ trên xuống dưới",
  },
  sharpen: {
    name: "Làm nét",
    data: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
    desc: "Tăng cường chi tiết trung tâm",
  },
  blur: {
    name: "Làm mờ",
    data: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
    desc: "Lấy trung bình vùng lân cận",
  },
};

function computeConv(input: number[][], kernel: number[][], row: number, col: number): number {
  let sum = 0;
  for (let kr = 0; kr < 3; kr++) {
    for (let kc = 0; kc < 3; kc++) {
      sum += input[row + kr][col + kc] * kernel[kr][kc];
    }
  }
  return sum;
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "Kernel 3×3 trượt qua ảnh 5×5 (stride 1, không padding). Output có kích thước gì?",
    options: ["5×5", "3×3", "4×4", "2×2"],
    correct: 1,
    explanation: "Output = (Input - Kernel) / Stride + 1 = (5 - 3)/1 + 1 = 3. Ma trận 3×3. Mỗi bước, kernel cần 3 pixel → vị trí cuối cùng là cột/hàng thứ 3 (index 2).",
  },
  {
    question: "Tại sao CNN cần nhiều kernel khác nhau thay vì chỉ dùng một kernel?",
    options: [
      "Để tăng tốc độ xử lý",
      "Mỗi kernel phát hiện một loại đặc trưng khác nhau (cạnh, góc, kết cấu...)",
      "Để giảm kích thước ảnh",
      "Vì một kernel không đủ tham số",
    ],
    correct: 1,
    explanation: "Mỗi kernel là một 'mắt' chuyên tìm một kiểu pattern. Kernel cạnh dọc thì tìm cạnh dọc, kernel góc thì tìm góc. Kết hợp nhiều kernel → mô tả đầy đủ đặc trưng của ảnh.",
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
    explanation: "Padding thêm viền số 0 quanh ảnh. Với kernel 3×3, padding = 1 giúp output cùng kích thước input. Không có padding, ảnh nhỏ dần qua mỗi lớp conv.",
  },
];

/* ── Component ── */
export default function ConvolutionTopic() {
  const [pos, setPos] = useState({ row: 0, col: 0 });
  const [kernelKey, setKernelKey] = useState("edge_v");

  const kernel = KERNELS[kernelKey];
  const maxRow = INPUT_GRID.length - 3;
  const maxCol = INPUT_GRID[0].length - 3;
  const result = computeConv(INPUT_GRID, kernel.data, pos.row, pos.col);

  const outputGrid = useMemo(() => {
    return Array.from({ length: 3 }, (_, r) =>
      Array.from({ length: 3 }, (_, c) =>
        computeConv(INPUT_GRID, kernel.data, r, c)
      )
    );
  }, [kernel.data]);

  const stepForward = useCallback(() => {
    setPos((p) => {
      if (p.col < maxCol) return { row: p.row, col: p.col + 1 };
      if (p.row < maxRow) return { row: p.row + 1, col: 0 };
      return { row: 0, col: 0 };
    });
  }, [maxCol, maxRow]);

  const cellSize = 42;
  const kernelCellSize = 38;
  const TOTAL_STEPS = 8;

  /* Compute multiplication detail string */
  const multParts: string[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const iv = INPUT_GRID[pos.row + r][pos.col + c];
      const kv = kernel.data[r][c];
      multParts.push(`${iv}×(${kv})`);
    }
  }

  return (
    <>
      {/* ═══ Step 1: HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn có ma trận 5×5 (ảnh) và một 'cửa sổ' 3×3 (bộ lọc). Tại mỗi vị trí, bạn nhân từng cặp số rồi cộng tất cả lại. Khi trượt cửa sổ qua toàn bộ ma trận, output có kích thước bao nhiêu?"
          options={["5×5 (bằng input)", "3×3 (nhỏ hơn)", "7×7 (lớn hơn)"]}
          correct={1}
          explanation="Output là 3×3! Cửa sổ 3×3 trượt trên ma trận 5×5: vị trí đầu tiên ở (0,0), cuối cùng ở (2,2). Tổng cộng 3 hàng × 3 cột = 9 vị trí. Đây chính là phép tích chập!"
        />
      </LessonSection>

      {/* ═══ Step 2: DISCOVER — Interactive Convolution ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá phép tích chập">
        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-foreground leading-relaxed mb-3">
            Hãy tưởng tượng bạn là thợ kiểm tra vải ở chợ Bến Thành. Bạn đặt một{" "}
            <strong>khuôn mẫu nhỏ 3×3</strong>{" "}
            lên tấm vải, so sánh từng điểm. Nơi nào khớp nhiều → điểm cao, nơi nào không khớp → điểm thấp. Rồi bạn trượt khuôn sang vị trí tiếp theo.
          </p>

          <p className="text-sm text-muted mb-3">
            Chọn loại bộ lọc, rồi nhấn &quot;Bước tiếp&quot; để xem phép tích chập tại từng vị trí.
          </p>

          {/* Kernel selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(KERNELS).map(([key, k]) => (
              <button
                key={key} type="button"
                onClick={() => { setKernelKey(key); setPos({ row: 0, col: 0 }); }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  kernelKey === key
                    ? "border-amber-500 bg-amber-500/15 text-amber-500"
                    : "border-border bg-card text-foreground hover:bg-surface"
                }`}
              >
                {k.name}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 520 200" className="w-full rounded-lg border border-border bg-background">
            {/* Input grid */}
            <text x={115} y={16} fontSize={11} fill="currentColor" className="text-foreground"
              textAnchor="middle" fontWeight={600}>
              Input (5×5)
            </text>
            {INPUT_GRID.map((row, r) =>
              row.map((val, c) => {
                const x = 10 + c * cellSize;
                const y = 22 + r * cellSize;
                const inKernel = r >= pos.row && r < pos.row + 3 && c >= pos.col && c < pos.col + 3;
                return (
                  <g key={`i-${r}-${c}`}>
                    <rect x={x} y={y} width={cellSize - 2} height={cellSize - 2} rx={5}
                      fill={inKernel ? "#f59e0b" : "#666"} opacity={inKernel ? 0.25 : 0.08}
                      stroke={inKernel ? "#f59e0b" : "#666"} strokeWidth={inKernel ? 2 : 0.5} />
                    <text x={x + cellSize / 2 - 1} y={y + cellSize / 2 + 5} fontSize={15}
                      fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={500}>
                      {val}
                    </text>
                  </g>
                );
              })
            )}

            {/* Kernel */}
            <text x={345} y={16} fontSize={11} fill="#f59e0b" textAnchor="middle" fontWeight={600}>
              {kernel.name} (3×3)
            </text>
            {kernel.data.map((row, r) =>
              row.map((val, c) => {
                const x = 278 + c * kernelCellSize;
                const y = 22 + r * kernelCellSize;
                return (
                  <g key={`k-${r}-${c}`}>
                    <rect x={x} y={y} width={kernelCellSize - 2} height={kernelCellSize - 2}
                      rx={5} fill="#f59e0b" opacity={0.15} stroke="#f59e0b" strokeWidth={1} />
                    <text x={x + kernelCellSize / 2 - 1} y={y + kernelCellSize / 2 + 5} fontSize={14}
                      fill="#f59e0b" textAnchor="middle" fontWeight={600}>
                      {val}
                    </text>
                  </g>
                );
              })
            )}

            {/* Equals */}
            <text x={420} y={75} fontSize={28} fill="currentColor" className="text-muted" fontWeight={700}>
              =
            </text>

            {/* Result */}
            <motion.g key={`${pos.row}-${pos.col}-${kernelKey}`}>
              <rect x={440} y={45} width={65} height={50} rx={10}
                fill="#22c55e" opacity={0.15} stroke="#22c55e" strokeWidth={2} />
              <motion.text x={472} y={78} fontSize={22} fill="#22c55e" textAnchor="middle" fontWeight={700}
                initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                {result}
              </motion.text>
            </motion.g>

            {/* Kernel description */}
            <text x={345} y={148} fontSize={10} fill="#f59e0b" textAnchor="middle" fontWeight={500}>
              {kernel.desc}
            </text>

            {/* Output grid */}
            <text x={345} y={168} fontSize={10} fill="#22c55e" textAnchor="middle" fontWeight={600}>
              Output (3×3)
            </text>
            {outputGrid.map((row, r) =>
              row.map((val, c) => {
                const x = 295 + c * 35;
                const y = 174 + r * 25;
                const isCurrent = r === pos.row && c === pos.col;
                const computed = r < pos.row || (r === pos.row && c <= pos.col);
                return (
                  <g key={`o-${r}-${c}`}>
                    <rect x={x} y={y} width={33} height={23} rx={4}
                      fill={isCurrent ? "#22c55e" : computed ? "#22c55e" : "#666"}
                      opacity={isCurrent ? 0.3 : computed ? 0.1 : 0.05}
                      stroke={isCurrent ? "#22c55e" : "#666"} strokeWidth={isCurrent ? 2 : 0.5} />
                    <text x={x + 16} y={y + 16} fontSize={10}
                      fill={computed || isCurrent ? "#22c55e" : "#666"} textAnchor="middle" fontWeight={500}>
                      {computed || isCurrent ? val : "?"}
                    </text>
                  </g>
                );
              })
            )}
          </svg>

          {/* Computation breakdown */}
          <div className="mt-3 rounded-lg border border-border bg-background/50 p-3">
            <p className="text-xs text-muted mb-1">
              Phép tính tại vị trí ({pos.row}, {pos.col}):
            </p>
            <p className="text-xs text-foreground">
              {multParts.join(" + ")} = <strong className="text-green-500">{result}</strong>
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={stepForward}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white">
              Bước tiếp
            </button>
            <button type="button" onClick={() => setPos({ row: 0, col: 0 })}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface">
              Đặt lại
            </button>
            <span className="text-xs text-muted ml-auto">
              Vị trí: ({pos.row}, {pos.col}) / ({maxRow}, {maxCol})
            </span>
          </div>

          <p className="text-sm text-muted mt-3">
            Bạn vừa thấy cùng một phép toán lặp lại ở mọi vị trí — nhân rồi cộng. Nhưng kết quả thay đổi tùy theo kernel bạn chọn. Thử chuyển sang &quot;Cạnh ngang&quot; xem sự khác biệt...
          </p>
        </VisualizationSection>
      </LessonSection>

      {/* ═══ Step 3: AHA MOMENT ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Phép toán &quot;nhân từng cặp rồi cộng&quot; bạn vừa thực hiện chính là <strong>phép tích chập (convolution)</strong>!{" "}
            Bộ lọc khác nhau → phát hiện đặc trưng khác nhau. CNN học được bộ lọc tối ưu tự động qua quá trình huấn luyện.
          </p>
          <p className="text-sm text-muted mt-1">
            Giống bạn có nhiều cái kính lọc: kính đỏ thấy chỉ màu đỏ, kính xanh thấy chỉ xanh. Mỗi kernel là một &quot;cái kính&quot; tìm một loại pattern riêng.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 4: STRIDE AND PADDING ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Stride và Padding">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Stride (bước nhảy)</h4>
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <div className="grid grid-cols-5 gap-0.5 mb-1">
                    {Array.from({ length: 25 }, (_, i) => {
                      const r = Math.floor(i / 5);
                      const c = i % 5;
                      const s1 = r < 3 && c < 3;
                      const s2 = r < 3 && c >= 2 && c <= 4;
                      return (
                        <div key={i} className="w-6 h-6 rounded text-[10px] flex items-center justify-center"
                          style={{
                            backgroundColor: s1 ? "#3b82f630" : s2 ? "#8b5cf630" : "#66666615",
                            border: s1 || s2 ? `1.5px solid ${s1 ? "#3b82f6" : "#8b5cf6"}` : "1px solid #33333330",
                          }}>
                          {INPUT_GRID[r][c]}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-muted">Stride=1: di chuyển 1 ô</span>
                </div>
                <div className="text-center">
                  <div className="grid grid-cols-5 gap-0.5 mb-1">
                    {Array.from({ length: 25 }, (_, i) => {
                      const r = Math.floor(i / 5);
                      const c = i % 5;
                      const s1 = r < 3 && c < 3;
                      const s2 = r < 3 && c >= 2;
                      return (
                        <div key={i} className="w-6 h-6 rounded text-[10px] flex items-center justify-center"
                          style={{
                            backgroundColor: s1 ? "#3b82f630" : (s2 && c <= 4 && r < 3) ? "#f9731630" : "#66666615",
                            border: s1 ? "1.5px solid #3b82f6" : (s2 && c <= 4 && r < 3) ? "1.5px solid #f97316" : "1px solid #33333330",
                          }}>
                          {INPUT_GRID[r][c]}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-muted">Stride=2: nhảy 2 ô</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Padding (đệm viền)</h4>
              <p className="text-sm text-muted mb-2">
                Thêm viền số 0 quanh ảnh để giữ kích thước output bằng input.
              </p>
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <div className="grid grid-cols-5 gap-0.5 mb-1">
                    {Array.from({ length: 25 }, (_, i) => (
                      <div key={i} className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/30 text-[9px] flex items-center justify-center text-foreground">
                        {INPUT_GRID[Math.floor(i / 5)][i % 5]}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted">Không padding: 5→3</span>
                </div>
                <div className="text-center">
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {Array.from({ length: 49 }, (_, i) => {
                      const r = Math.floor(i / 7);
                      const c = i % 7;
                      const isPad = r === 0 || r === 6 || c === 0 || c === 6;
                      return (
                        <div key={i} className="w-5 h-5 rounded text-[9px] flex items-center justify-center"
                          style={{
                            backgroundColor: isPad ? "#22c55e15" : "#3b82f615",
                            border: `1px solid ${isPad ? "#22c55e40" : "#3b82f640"}`,
                            color: isPad ? "#22c55e" : "currentColor",
                          }}>
                          {isPad ? "0" : INPUT_GRID[r - 1][c - 1]}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-muted">Padding=1: 5→5 (giữ nguyên)</span>
                </div>
              </div>
            </div>
          </div>
      </LessonSection>

      {/* ═══ Step 5: CHALLENGE ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Ảnh 7×7 qua kernel 3×3 với stride=2 và padding=0. Output bao nhiêu?"
          options={[
            "(7-3)/2 + 1 = 3 → output 3×3",
            "(7-3)/1 + 1 = 5 → output 5×5",
            "(7-3)/2 + 1 = 2.5 → không hợp lệ",
          ]}
          correct={0}
          explanation="Công thức: O = (W - K) / S + 1 = (7 - 3) / 2 + 1 = 3. Output là 3×3. Nếu ra số lẻ → cấu hình không hợp lệ (cần chỉnh padding hoặc stride)."
        />
      </LessonSection>

      {/* ═══ Step 6: EXPLAIN ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection>
          <p>
            <strong>Phép tích chập (Convolution)</strong>{" "}
            là phép toán cốt lõi của CNN. Về mặt toán học, nó là tương quan chéo (cross-correlation) giữa input và kernel:
          </p>

          <LaTeX block>{String.raw`(I * K)(i,j) = \sum_{m=0}^{k-1}\sum_{n=0}^{k-1} I(i+m, j+n) \cdot K(m,n)`}</LaTeX>

          <p className="mt-3">Kích thước output được tính theo công thức:</p>

          <LaTeX block>{String.raw`O = \left\lfloor \frac{W - K + 2P}{S} \right\rfloor + 1`}</LaTeX>

          <p className="text-sm text-muted mt-1">
            W = kích thước input, K = kích thước kernel, P = padding, S = stride.
          </p>

          <Callout variant="insight" title="Tại sao tích chập hiệu quả?">
            <p>
              <strong>Chia sẻ trọng số:</strong>{" "}
              Kernel 3×3 chỉ có 9 tham số, dùng ở mọi vị trí. Ảnh 224×224 cần 50.176 phép tính nhưng chỉ 9 tham số — tiết kiệm bộ nhớ hàng triệu lần so với fully-connected.
            </p>
          </Callout>

          <Callout variant="info" title="Tích chập nhiều kênh">
            <p>
              Ảnh RGB có 3 kênh. Kernel cũng phải có 3 kênh: 3×3×3 = 27 tham số. Mỗi kênh kernel nhân với kênh tương ứng, rồi cộng tất cả lại thành 1 giá trị. 32 kernel → 32 feature maps.
            </p>
          </Callout>

          <CodeBlock language="python" title="convolution.py">
{`import numpy as np

def conv2d(image, kernel, stride=1, padding=0):
    """Phép tích chập 2D từ đầu."""
    # Thêm padding
    if padding > 0:
        image = np.pad(image, padding, mode='constant')

    H, W = image.shape
    kH, kW = kernel.shape
    oH = (H - kH) // stride + 1
    oW = (W - kW) // stride + 1
    output = np.zeros((oH, oW))

    for i in range(oH):
        for j in range(oW):
            # Lấy vùng input tương ứng
            region = image[i*stride:i*stride+kH,
                          j*stride:j*stride+kW]
            # Nhân từng phần tử rồi cộng
            output[i, j] = np.sum(region * kernel)

    return output

# Ví dụ: phát hiện cạnh dọc
edge_kernel = np.array([[1, 0, -1],
                         [1, 0, -1],
                         [1, 0, -1]])
result = conv2d(image, edge_kernel, stride=1, padding=1)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 7: SUMMARY ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về phép tích chập"
          points={[
            "Tích chập = trượt kernel qua input, nhân từng cặp rồi cộng — phát hiện đặc trưng cục bộ.",
            "Kernel khác nhau phát hiện đặc trưng khác nhau: cạnh, góc, kết cấu, làm mờ...",
            "Stride kiểm soát bước nhảy (stride lớn = output nhỏ), Padding giữ kích thước output.",
            "Chia sẻ trọng số: kernel 3×3 chỉ có 9 tham số nhưng áp dụng ở mọi vị trí — hiệu quả hơn FC hàng triệu lần.",
            "Công thức output: O = (W - K + 2P) / S + 1. Nhớ kiểm tra chia hết!",
          ]}
        />
      </LessonSection>

      {/* ═══ Step 8: QUIZ ═══ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
