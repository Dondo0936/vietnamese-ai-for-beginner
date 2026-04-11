"use client";

import { useState, useMemo } from "react";
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

/* ── data ─────────────────────────────────────────────────── */
const IMAGE_GRID = [
  [50, 50, 50, 200, 200],
  [50, 50, 50, 200, 200],
  [50, 50, 100, 200, 200],
  [50, 50, 200, 200, 200],
  [50, 200, 200, 200, 200],
];

const KERNELS: Record<string, { name: string; matrix: number[][] }> = {
  edge: { name: "Phát hiện cạnh", matrix: [[-1,-1,-1],[-1,8,-1],[-1,-1,-1]] },
  sharpen: { name: "Làm sắc nét", matrix: [[0,-1,0],[-1,5,-1],[0,-1,0]] },
  blur: { name: "Làm mờ", matrix: [[1,1,1],[1,1,1],[1,1,1]] },
};

const QUIZ: QuizQuestion[] = [
  {
    question: "Phép tích chập (convolution) với kernel 3x3 hoạt động thế nào?",
    options: [
      "Nhân ma trận kernel với toàn bộ ảnh",
      "Kernel trượt qua ảnh, tại mỗi vị trí nhân phần tử tương ứng rồi cộng lại",
      "Kernel thay thế mỗi pixel bằng giá trị trung bình",
      "Kernel chỉ áp dụng cho pixel ở tâm ảnh",
    ],
    correct: 1,
    explanation: "Kernel trượt (slide) qua từng vị trí trên ảnh. Tại mỗi vị trí: nhân phần tử tương ứng (element-wise), rồi cộng tất cả lại thành 1 giá trị đầu ra.",
  },
  {
    question: "Tại sao kernel phát hiện cạnh có giá trị âm xung quanh và dương ở tâm?",
    options: [
      "Để ảnh đầu ra sáng hơn",
      "Để nhấn mạnh sự THAY ĐỔI cường độ pixel -- nơi có cạnh",
      "Để giảm nhiễu trong ảnh",
      "Vì kernel phải có tổng bằng 0",
    ],
    correct: 1,
    explanation: "Cạnh = nơi pixel thay đổi đột ngột (sáng → tối). Kernel edge: tâm dương (+8) trừ đi lân cận âm (-1). Vùng đồng nhất cho kết quả ~0, vùng có cạnh cho giá trị lớn!",
  },
  {
    question: "Trong CNN hiện đại, kernel được tạo ra bằng cách nào?",
    options: [
      "Thiết kế thủ công bởi kỹ sư",
      "Copy từ bộ lọc Sobel truyền thống",
      "Học tự động thông qua backpropagation từ dữ liệu",
      "Random và giữ nguyên trong suốt quá trình huấn luyện",
    ],
    correct: 2,
    explanation: "CNN HIỆN ĐẠI không thiết kế kernel thủ công. Backpropagation tự điều chỉnh giá trị kernel để tối ưu hàm mất mát. Mạng tự tìm ra bộ lọc tốt nhất cho tác vụ!",
  },
];

/* ── component ────────────────────────────────────────────── */
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
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn có ảnh đen trắng 5x5 pixel. Một 'cửa sổ' 3x3 trượt qua từng vị trí, nhân với pixel bên dưới rồi cộng lại. Kết quả là gì?"
          options={[
            "Ảnh bị phóng to gấp 3 lần",
            "Ảnh mới với hiệu ứng khác (làm mờ, phát hiện cạnh, làm sắc) tuỳ giá trị cửa sổ",
            "Ảnh bị nén nhỏ lại",
          ]}
          correct={1}
          explanation="Đó chính là phép TÍCH CHẬP (convolution)! Cửa sổ 3x3 gọi là kernel/filter. Mỗi kernel tạo hiệu ứng khác nhau: phát hiện cạnh, làm mờ, làm sắc..."
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              {Object.entries(KERNELS).map(([key, k]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setKernelType(key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    kernelType === key ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {k.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
              <text x="130" y="18" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
                Ảnh đầu vào
              </text>
              {IMAGE_GRID.map((row, r) =>
                row.map((val, c) => {
                  const inKernel = Math.abs(r - posR) <= 1 && Math.abs(c - posC) <= 1;
                  return (
                    <g
                      key={`img-${r}-${c}`}
                      onClick={() => { if (r >= 1 && r <= 3 && c >= 1 && c <= 3) { setPosR(r); setPosC(c); } }}
                      style={{ cursor: r >= 1 && r <= 3 && c >= 1 && c <= 3 ? "pointer" : "default" }}
                    >
                      <rect x={5 + c * cellSize} y={25 + r * cellSize} width={cellSize} height={cellSize}
                        fill={`rgb(${val},${val},${val})`} stroke={inKernel ? "#f59e0b" : "#334155"}
                        strokeWidth={inKernel ? 2.5 : 1} />
                      <text x={5 + c * cellSize + cellSize / 2} y={25 + r * cellSize + cellSize / 2 + 4}
                        textAnchor="middle" fill={val > 128 ? "#0f172a" : "#e2e8f0"} fontSize="11">
                        {val}
                      </text>
                    </g>
                  );
                })
              )}

              <text x="410" y="18" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
                Kernel ({kernel.name})
              </text>
              {kernel.matrix.map((row, r) =>
                row.map((val, c) => (
                  <g key={`ker-${r}-${c}`}>
                    <rect x={340 + c * cellSize} y={25 + r * cellSize} width={cellSize} height={cellSize}
                      fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                    <text x={340 + c * cellSize + cellSize / 2} y={25 + r * cellSize + cellSize / 2 + 4}
                      textAnchor="middle" fill={val > 0 ? "#22c55e" : val < 0 ? "#ef4444" : "#64748b"}
                      fontSize="13" fontWeight="bold">
                      {val}
                    </text>
                  </g>
                ))
              )}

              <text x="295" y="100" textAnchor="middle" fill="#94a3b8" fontSize="24" fontWeight="bold">*</text>

              <text x="300" y="225" textAnchor="middle" fill="#94a3b8" fontSize="11">
                Giá trị đầu ra tại vị trí ({posR}, {posC}):
              </text>
              <rect x="240" y="235" width="120" height="45" rx="8" fill="#f59e0b" opacity={0.2}
                stroke="#f59e0b" strokeWidth="1.5" />
              <text x="300" y="265" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="bold">
                {result}
              </text>
              <text x="300" y="310" textAnchor="middle" fill="#64748b" fontSize="10">
                Nhấn vào ô ảnh (hàng 1-3, cột 1-3) để di chuyển kernel
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Kernel là <strong>bộ lọc có thể học</strong>: CNN truyền thống thiết kế kernel thủ công (Sobel, Gaussian).
            CNN hiện đại để <strong>backpropagation tự tìm</strong>{" "}kernel tối ưu! Mỗi lớp Conv có hàng chục kernel,
            mỗi kernel phát hiện một đặc trưng khác nhau.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Kernel làm mờ (blur) có tất cả giá trị bằng 1/9. Tại sao nó làm mờ ảnh?"
          options={[
            "Vì 1/9 là số nhỏ nên pixel bị tối đi",
            "Vì nó thay mỗi pixel bằng TRUNG BÌNH của 9 pixel lân cận, xoá chi tiết nhỏ",
            "Vì kernel có kích thước 3x3 nên ảnh bị nén",
          ]}
          correct={1}
          explanation="Kernel blur lấy trung bình cục bộ (local average). Mỗi pixel mới = trung bình 9 pixel xung quanh. Chi tiết nhỏ (cạnh, nhiễu) bị san phẳng → ảnh mờ hơn!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Image Kernel</strong>{" "}là ma trận nhỏ (thường 3x3 hoặc 5x5) thực hiện phép tích chập với ảnh.
            Đây là thao tác cốt lõi của mạng nơ-ron tích chập (CNN).
          </p>

          <p><strong>Công thức tích chập 2D:</strong></p>
          <LaTeX block>{"(I * K)[i,j] = \\sum_{m} \\sum_{n} I[i+m, j+n] \\cdot K[m, n]"}</LaTeX>
          <p className="text-sm text-muted">
            Kernel K trượt qua ảnh I, tại mỗi vị trí (i,j): nhân element-wise rồi cộng tất cả.
          </p>

          <Callout variant="insight" title="Các loại kernel kinh điển">
            <div className="space-y-2 text-sm">
              <p><strong>Phát hiện cạnh (Edge):</strong>{" "}Tâm dương, xung quanh âm -- nhấn mạnh sự thay đổi cường độ pixel</p>
              <p><strong>Làm sắc nét (Sharpen):</strong>{" "}Tăng cường chi tiết bằng cách khuếch đại sự khác biệt với lân cận</p>
              <p><strong>Làm mờ (Blur/Gaussian):</strong>{" "}Lấy trung bình lân cận để làm mịn ảnh, giảm nhiễu</p>
              <p><strong>Sobel:</strong>{" "}Phát hiện cạnh theo hướng (ngang hoặc dọc)</p>
            </div>
          </Callout>

          <Callout variant="warning" title="Kernel thủ công vs Kernel học được">
            <p className="text-sm">
              Trong xử lý ảnh truyền thống: kernel được <strong>thiết kế bằng tay</strong>{" "}(Sobel, Laplacian).
              Trong CNN: kernel là <strong>parameter được học</strong>{" "}qua backpropagation -- mạng tự tìm bộ lọc
              tối ưu cho từng tác vụ. ResNet-50 có hơn 23 triệu parameter kernel!
            </p>
          </Callout>

          <CodeBlock language="python" title="Áp dụng kernel với OpenCV">
{`import cv2
import numpy as np

# Đọc ảnh
img = cv2.imread("ho_guom.jpg", cv2.IMREAD_GRAYSCALE)

# Kernel phát hiện cạnh
edge_kernel = np.array([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
], dtype=np.float32)

# Kernel làm mờ Gaussian 5x5
blur_kernel = cv2.getGaussianKernel(5, 1.0)
blur_kernel = blur_kernel @ blur_kernel.T  # 2D Gaussian

# Áp dụng tích chập
edges = cv2.filter2D(img, -1, edge_kernel)
blurred = cv2.filter2D(img, -1, blur_kernel)

# Kernel Sobel (phát hiện cạnh ngang)
sobel_x = cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=3)
sobel_y = cv2.Sobel(img, cv2.CV_64F, 0, 1, ksize=3)
gradient = np.sqrt(sobel_x**2 + sobel_y**2)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Kernel là ma trận nhỏ trượt trên ảnh, tạo hiệu ứng khác nhau (edge, blur, sharpen)",
          "Phép tích chập: tại mỗi vị trí, nhân element-wise rồi cộng lại thành 1 giá trị",
          "CNN hiện đại: kernel được học tự động qua backpropagation, không cần thiết kế thủ công",
          "Mỗi lớp Conv có nhiều kernel, mỗi kernel phát hiện 1 đặc trưng khác nhau",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
