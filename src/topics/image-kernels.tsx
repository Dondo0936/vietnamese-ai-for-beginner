"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { PredictionGate, AhaMoment, InlineChallenge, Callout, CollapsibleDetail,
  MiniSummary, CodeBlock, LessonSection, LaTeX, TopicLink, ProgressSteps } from "@/components/interactive";
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

/* ─────────────────────────────────────────────────────────────
 * DỮ LIỆU: Ảnh 10×10 pixel (hình chữ thập đơn giản)
 * Giá trị từ 0 (đen) đến 255 (trắng).
 * Hình dạng: khối sáng ở giữa, nền tối xung quanh — đủ để
 * thấy rõ các hiệu ứng khi áp dụng các kernel khác nhau.
 * ───────────────────────────────────────────────────────────── */
const IMAGE_10x10: number[][] = [
  [ 30,  30,  30,  30, 200, 200,  30,  30,  30,  30],
  [ 30,  30,  30,  30, 200, 200,  30,  30,  30,  30],
  [ 30,  30,  30,  30, 200, 200,  30,  30,  30,  30],
  [ 30,  30,  30,  30, 200, 200,  30,  30,  30,  30],
  [200, 200, 200, 200, 230, 230, 200, 200, 200, 200],
  [200, 200, 200, 200, 230, 230, 200, 200, 200, 200],
  [ 30,  30,  30,  30, 200, 200,  30,  30,  30,  30],
  [ 30,  30,  30,  30, 200, 200,  30,  30,  30,  30],
  [ 30,  30,  30,  30, 200, 200,  30,  30,  30,  30],
  [ 30,  30,  30,  30, 200, 200,  30,  30,  30,  30],
];

/* ─────────────────────────────────────────────────────────────
 * PRESET KERNELS — Các ma trận 3×3 kinh điển trong xử lý ảnh.
 *
 *  • Identity      : không đổi
 *  • Edge Detect   : phát hiện mọi cạnh (Laplacian kiểu 8-neighbor)
 *  • Sobel X / Y   : phát hiện cạnh dọc / ngang
 *  • Gaussian Blur : làm mờ mượt, giảm nhiễu
 *  • Sharpen       : làm nét, khuếch đại chi tiết
 *  • Emboss        : hiệu ứng chạm nổi
 *  • Laplacian     : phát hiện vùng thay đổi cường độ đột ngột
 * ───────────────────────────────────────────────────────────── */
type KernelPreset = {
  name: string;
  matrix: number[][];
  divisor: number;     // chia kết quả (dùng cho blur)
  offset: number;      // cộng thêm (dùng cho emboss)
  description: string;
};

const PRESETS: Record<string, KernelPreset> = {
  identity: {
    name: "Identity",
    matrix: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    divisor: 1,
    offset: 0,
    description: "Không đổi — trả lại đúng ảnh gốc. Dùng để kiểm tra rằng pipeline tích chập chạy đúng.",
  },
  edge: {
    name: "Edge Detection",
    matrix: [
      [-1, -1, -1],
      [-1,  8, -1],
      [-1, -1, -1],
    ],
    divisor: 1,
    offset: 0,
    description: "Phát hiện MỌI cạnh theo mọi hướng. Tổng = 0 nên vùng đồng nhất ra 0 (đen), chỉ cạnh mới ra giá trị lớn.",
  },
  sobelX: {
    name: "Sobel X",
    matrix: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
    divisor: 1,
    offset: 128,
    description: "Phát hiện cạnh DỌC (thay đổi theo chiều ngang). Cộng thêm 128 để thấy cả gradient âm và dương.",
  },
  sobelY: {
    name: "Sobel Y",
    matrix: [
      [-1, -2, -1],
      [ 0,  0,  0],
      [ 1,  2,  1],
    ],
    divisor: 1,
    offset: 128,
    description: "Phát hiện cạnh NGANG (thay đổi theo chiều dọc). Gốc của thuật toán Canny Edge Detection.",
  },
  blur: {
    name: "Gaussian Blur",
    matrix: [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ],
    divisor: 16,
    offset: 0,
    description: "Làm mờ theo phân phối Gaussian (tâm nặng hơn lân cận). Chia 16 để giữ độ sáng trung bình.",
  },
  sharpen: {
    name: "Sharpen",
    matrix: [
      [ 0, -1,  0],
      [-1,  5, -1],
      [ 0, -1,  0],
    ],
    divisor: 1,
    offset: 0,
    description: "Làm sắc nét: khuếch đại sai biệt giữa pixel trung tâm và 4 lân cận. Tổng = 1 nên giữ độ sáng.",
  },
  emboss: {
    name: "Emboss",
    matrix: [
      [-2, -1, 0],
      [-1,  1, 1],
      [ 0,  1, 2],
    ],
    divisor: 1,
    offset: 128,
    description: "Hiệu ứng chạm nổi 3D. Cộng 128 để đưa vùng phẳng về xám trung tính.",
  },
  laplacian: {
    name: "Laplacian",
    matrix: [
      [0,  1, 0],
      [1, -4, 1],
      [0,  1, 0],
    ],
    divisor: 1,
    offset: 128,
    description: "Đạo hàm bậc hai — nhạy với điểm thay đổi cường độ đột ngột (chi tiết nhỏ, nhiễu).",
  },
  boxBlur: {
    name: "Box Blur",
    matrix: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    divisor: 9,
    offset: 0,
    description: "Làm mờ 'đơn giản nhất': lấy trung bình cộng của 9 pixel. Kém mượt hơn Gaussian nhưng rẻ, dùng trong mean filtering.",
  },
  motionBlur: {
    name: "Motion Blur",
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    divisor: 3,
    offset: 0,
    description: "Làm mờ chuyển động theo đường chéo — mô phỏng camera rung hoặc vật thể di chuyển. Kernel thực tế thường dài 9×9 hoặc hơn.",
  },
  embossStrong: {
    name: "Emboss++",
    matrix: [
      [-4, -2, 0],
      [-2,  1, 2],
      [ 0,  2, 4],
    ],
    divisor: 1,
    offset: 128,
    description: "Phiên bản Emboss mạnh: hiệu ứng 3D rõ rệt hơn, biên sắc và tương phản cao. Dùng cho ảnh nghệ thuật hoặc xử lý texture.",
  },
};

const PRESET_ORDER = [
  "identity",
  "edge",
  "sobelX",
  "sobelY",
  "blur",
  "boxBlur",
  "motionBlur",
  "sharpen",
  "emboss",
  "embossStrong",
  "laplacian",
];

/* ─────────────────────────────────────────────────────────────
 * Hàm tích chập tham chiếu: áp dụng 1 kernel 3×3 lên toàn ảnh.
 * Dùng zero-padding (các vị trí ngoài biên coi như 0).
 * ───────────────────────────────────────────────────────────── */
function convolve(
  image: number[][],
  kernel: number[][],
  divisor: number,
  offset: number,
): number[][] {
  const H = image.length;
  const W = image[0].length;
  const out: number[][] = [];
  for (let r = 0; r < H; r++) {
    const row: number[] = [];
    for (let c = 0; c < W; c++) {
      let sum = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && rr < H && cc >= 0 && cc < W) {
            sum += image[rr][cc] * kernel[dr + 1][dc + 1];
          }
        }
      }
      const v = Math.round(sum / divisor + offset);
      row.push(Math.max(0, Math.min(255, v)));
    }
    out.push(row);
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────
 * QUIZ — 8 câu hỏi bám sát các khái niệm đã trình bày.
 * ───────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "Phép tích chập 2D (2D convolution) với kernel 3×3 làm gì ở MỖI vị trí?",
    options: [
      "Nhân ma trận kernel với toàn bộ ảnh một lần duy nhất",
      "Trượt kernel, tại mỗi vị trí nhân element-wise với vùng 3×3 bên dưới rồi cộng tất cả lại",
      "Thay pixel hiện tại bằng giá trị trung bình của mọi pixel trong ảnh",
      "Chỉ áp dụng kernel cho pixel ở chính giữa ảnh",
    ],
    correct: 1,
    explanation:
      "Kernel TRƯỢT (slide) qua từng vị trí của ảnh. Tại mỗi vị trí: nhân element-wise giữa kernel và cửa sổ 3×3 bên dưới, rồi cộng 9 tích lại thành 1 giá trị đầu ra — đây là định nghĩa chính xác của tích chập 2D.",
  },
  {
    question: "Tại sao kernel phát hiện cạnh (edge) có tâm +8 và xung quanh -1?",
    options: [
      "Để ảnh đầu ra sáng hơn ảnh gốc",
      "Để tổng kernel = 0: vùng đồng nhất cho ~0, vùng có thay đổi cường độ cho giá trị lớn",
      "Để giảm nhiễu trong ảnh tốt hơn làm mờ Gaussian",
      "Vì mọi kernel trong computer vision đều phải có tổng bằng 0",
    ],
    correct: 1,
    explanation:
      "Tổng +8 + 8×(-1) = 0. Trên vùng pixel đồng nhất, nhân rồi cộng sẽ ra xấp xỉ 0 (đen). Chỉ nơi có cạnh — nơi pixel trung tâm khác lân cận — mới tạo ra giá trị lớn. Đây là cơ chế cốt lõi của mọi edge detector.",
  },
  {
    question: "Trong CNN hiện đại (ResNet, ViT-Conv, EfficientNet…), giá trị kernel được tạo ra ra sao?",
    options: [
      "Kỹ sư thiết kế thủ công từ các công thức Sobel, Prewitt…",
      "Lấy trực tiếp từ thư viện OpenCV đã được tối ưu sẵn",
      "Học tự động qua backpropagation để tối ưu hàm mất mát trên dữ liệu huấn luyện",
      "Sinh ngẫu nhiên rồi giữ cố định suốt quá trình huấn luyện",
    ],
    correct: 2,
    explanation:
      "CNN hiện đại KHÔNG thiết kế kernel thủ công. Khởi tạo ngẫu nhiên (He, Xavier…), sau đó backpropagation tự động điều chỉnh từng giá trị để giảm loss. Mạng tự khám phá ra những bộ lọc phù hợp nhất cho tác vụ.",
  },
  {
    question: "Kernel Gaussian Blur chia kết quả cho 16 (tổng kernel). Tại sao?",
    options: [
      "Để kết quả không vượt quá 255",
      "Để giữ nguyên độ sáng trung bình của ảnh — nếu không chia, ảnh sẽ sáng lên 16 lần",
      "Vì 16 là kích thước kernel",
      "Để tăng tốc độ tính toán",
    ],
    correct: 1,
    explanation:
      "Tổng các phần tử của kernel blur là 1+2+1+2+4+2+1+2+1 = 16. Không chia, mọi pixel sẽ bị nhân lên ~16 lần độ sáng. Chia cho tổng đảm bảo kernel là 'trung bình có trọng số', giữ độ sáng nguyên vẹn.",
  },
  {
    question: "Sobel X và Sobel Y phát hiện cạnh theo hướng nào?",
    options: [
      "Sobel X: cạnh NGANG, Sobel Y: cạnh DỌC",
      "Sobel X: cạnh DỌC (thay đổi theo trục x), Sobel Y: cạnh NGANG (thay đổi theo trục y)",
      "Cả hai đều phát hiện mọi hướng, chỉ khác độ mạnh",
      "Sobel X phát hiện cạnh đỏ, Sobel Y phát hiện cạnh xanh",
    ],
    correct: 1,
    explanation:
      "Sobel X có cột trái âm, cột phải dương → đo gradient theo trục X (đi từ trái sang phải) → phát hiện cạnh DỌC. Sobel Y có hàng trên âm, hàng dưới dương → đo gradient theo trục Y → phát hiện cạnh NGANG. Kết hợp √(Gx² + Gy²) cho edge magnitude theo mọi hướng.",
  },
  {
    question: "Zero-padding khi tích chập để làm gì?",
    options: [
      "Làm ảnh đầu ra nhỏ hơn ảnh đầu vào",
      "Giữ kích thước ảnh đầu ra bằng ảnh đầu vào và xử lý được cả các pixel ở biên",
      "Chỉ để đẹp, không ảnh hưởng kết quả",
      "Để tăng tốc độ bằng cache",
    ],
    correct: 1,
    explanation:
      "Không padding: ảnh H×W qua kernel 3×3 cho đầu ra (H-2)×(W-2) — mất biên. Padding bằng 0 quanh ảnh giúp kernel vẫn 'đặt' được ở các pixel biên, giữ kích thước output = input. Đây là padding='same' trong TensorFlow/PyTorch.",
  },
  {
    question: "Stride = 2 (bước nhảy 2) khi tích chập có tác dụng gì?",
    options: [
      "Làm kernel lớn hơn 2 lần",
      "Giảm kích thước ảnh đầu ra xuống còn ~1/2 mỗi chiều, giảm tham số và tăng 'tầm nhìn' của mạng",
      "Chỉ ảnh hưởng khi dùng kernel kích thước chẵn",
      "Làm ảnh đầu ra mờ đi",
    ],
    correct: 1,
    explanation:
      "Stride = 2: kernel trượt 2 pixel mỗi lần thay vì 1 → đầu ra nhỏ hơn ~2 lần mỗi chiều. Kỹ thuật này (cùng với pooling) giúp CNN giảm dần spatial resolution khi đi sâu, đồng thời mỗi neuron lớp sau 'nhìn' được vùng ảnh rộng hơn (receptive field lớn dần).",
  },
  {
    question: "Nếu áp dụng kernel Identity ([[0,0,0],[0,1,0],[0,0,0]]) lên ảnh, kết quả là gì?",
    options: [
      "Ảnh toàn màu đen",
      "Ảnh y hệt ảnh gốc — vì chỉ pixel trung tâm được giữ với hệ số 1, lân cận nhân 0",
      "Ảnh bị dịch 1 pixel về bên phải",
      "Ảnh bị đảo ngược màu",
    ],
    correct: 1,
    explanation:
      "Identity kernel: trung tâm = 1, còn lại = 0. Tại mỗi vị trí, chỉ pixel ở chính giữa (×1) đóng góp, các lân cận bị nhân với 0. Kết quả = ảnh gốc nguyên vẹn. Đây là 'test case' đầu tiên để kiểm tra pipeline tích chập đúng.",
  },
];

/* ─────────────────────────────────────────────────────────────
 * COMPONENT
 * ───────────────────────────────────────────────────────────── */
export default function ImageKernelsTopic() {
  // ─ state: preset đang chọn
  const [presetKey, setPresetKey] = useState<string>("edge");

  // ─ state: ma trận kernel cho người dùng chỉnh (có thể custom)
  const [matrix, setMatrix] = useState<number[][]>(
    PRESETS.edge.matrix.map((row) => [...row]),
  );

  // ─ state: divisor & offset (người dùng cũng có thể chỉnh)
  const [divisor, setDivisor] = useState<number>(PRESETS.edge.divisor);
  const [offset, setOffset] = useState<number>(PRESETS.edge.offset);

  // ─ state: vị trí cửa sổ 3×3 khi "walkthrough"
  const [walkR, setWalkR] = useState<number>(4);
  const [walkC, setWalkC] = useState<number>(4);

  /* ─ Tính ảnh đầu ra (memoized) ─ */
  const outputImage = useMemo(
    () => convolve(IMAGE_10x10, matrix, divisor || 1, offset),
    [matrix, divisor, offset],
  );

  /* ─ Tính giá trị đầu ra tại vị trí walkthrough hiện tại ─ */
  const walkValue = useMemo(() => {
    let sum = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = walkR + dr;
        const c = walkC + dc;
        if (r >= 0 && r < 10 && c >= 0 && c < 10) {
          sum += IMAGE_10x10[r][c] * matrix[dr + 1][dc + 1];
        }
      }
    }
    const v = Math.round(sum / (divisor || 1) + offset);
    return {
      raw: sum,
      clamped: Math.max(0, Math.min(255, v)),
    };
  }, [matrix, divisor, offset, walkR, walkC]);

  /* ─ Chọn preset: cập nhật ma trận, divisor, offset ─ */
  const selectPreset = useCallback((key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setPresetKey(key);
    setMatrix(p.matrix.map((row) => [...row]));
    setDivisor(p.divisor);
    setOffset(p.offset);
  }, []);

  /* ─ Cập nhật 1 ô trong ma trận kernel ─ */
  const setCell = useCallback((r: number, c: number, val: number) => {
    setMatrix((m) => {
      const next = m.map((row) => [...row]);
      next[r][c] = val;
      return next;
    });
    setPresetKey("custom");
  }, []);

  /* ─ Reset về kernel hiện tại ─ */
  const resetKernel = useCallback(() => {
    selectPreset("identity");
  }, [selectPreset]);

  const activePreset = PRESETS[presetKey] ?? {
    name: "Custom",
    matrix,
    divisor,
    offset,
    description: "Kernel tự định nghĩa. Thử các giá trị âm/dương khác nhau để xem hiệu ứng.",
  };

  // ─ kích thước hiển thị ô trong SVG
  const CELL = 26;

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 1 — DỰ ĐOÁN
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={8}
            labels={[
              "Dự đoán",
              "Khám phá",
              "Aha",
              "Thử thách 1",
              "Giải thích",
              "Thử thách 2",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Bạn có ảnh 10×10 pixel. Một ma trận 3×3 (gọi là 'kernel') trượt qua từng vị trí, nhân với vùng ảnh bên dưới rồi cộng lại. Kết quả bạn đoán là gì?"
          options={[
            "Ảnh bị phóng to 3 lần theo cả chiều ngang và dọc",
            "Ảnh mới cùng kích thước nhưng có hiệu ứng khác (mờ, nét, phát hiện cạnh…) tuỳ giá trị kernel",
            "Ảnh bị nén nhỏ xuống 3×3",
            "Ảnh chuyển sang màu đen trắng hoàn toàn",
          ]}
          correct={1}
          explanation="Đó chính là phép TÍCH CHẬP (convolution)! Kernel 3×3 trượt qua, tạo ảnh đầu ra cùng kích thước. Hiệu ứng khác nhau tuỳ giá trị kernel: phát hiện cạnh (edge), làm mờ (blur), làm sắc (sharpen), chạm nổi (emboss)…"
        >
          <p className="text-sm text-muted mt-4">
            Ở phần tiếp theo, bạn sẽ được tự tay chỉnh ma trận kernel và xem ảnh đầu ra thay đổi như thế nào.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 2 — KHÁM PHÁ (Kernel Playground)
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            {/* ── Row: Preset buttons ───────────────────────── */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Chọn preset kernel
              </h3>
              <p className="text-sm text-muted mb-3">
                Nhấn vào tên preset để load ma trận chuẩn. Bạn cũng có thể tự chỉnh các ô trong ma trận bên dưới.
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_ORDER.map((key) => {
                  const p = PRESETS[key];
                  const active = presetKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectPreset(key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-accent text-white"
                          : "bg-card border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={resetKernel}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-surface border border-border text-muted hover:text-foreground transition-colors"
                >
                  Reset
                </button>
              </div>
              <p className="text-xs text-tertiary mt-2">
                <span className="font-semibold text-accent">{activePreset.name}</span> — {activePreset.description}
              </p>
            </div>

            {/* ── Row: Editable Kernel + Divisor/Offset ─────── */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Ma trận kernel (có thể chỉnh)
                </h4>
                <div className="grid grid-cols-3 gap-1.5 max-w-[180px]">
                  {matrix.map((row, r) =>
                    row.map((val, c) => (
                      <input
                        key={`k-${r}-${c}`}
                        type="number"
                        value={val}
                        step={1}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          setCell(r, c, Number.isFinite(n) ? n : 0);
                        }}
                        className={`h-11 w-full text-center rounded-md border bg-surface font-mono text-sm ${
                          val > 0
                            ? "border-green-400 text-green-600 dark:text-green-400"
                            : val < 0
                              ? "border-red-400 text-red-600 dark:text-red-400"
                              : "border-border text-muted"
                        }`}
                      />
                    )),
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block text-xs text-muted">
                    Divisor
                    <input
                      type="number"
                      value={divisor}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        setDivisor(Number.isFinite(n) && n !== 0 ? n : 1);
                        setPresetKey("custom");
                      }}
                      className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground"
                    />
                  </label>
                  <label className="block text-xs text-muted">
                    Offset
                    <input
                      type="number"
                      value={offset}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        setOffset(Number.isFinite(n) ? n : 0);
                        setPresetKey("custom");
                      }}
                      className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-tertiary mt-2 leading-relaxed">
                  Kết quả mỗi pixel = (tổng tích / divisor) + offset, rồi clamp về [0, 255].
                </p>
              </div>

              {/* Walkthrough summary */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Walkthrough tại vị trí ({walkR}, {walkC})
                </h4>
                <p className="text-xs text-muted mb-3">
                  Nhấn vào bất kỳ ô nào trong ảnh đầu vào để di chuyển &quot;cửa sổ&quot; 3×3.
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Tổng tích (trước chia):</span>
                    <span className="font-mono font-semibold text-foreground">{walkValue.raw}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Chia cho divisor {divisor || 1}:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {Math.round(walkValue.raw / (divisor || 1))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Cộng offset {offset}:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {Math.round(walkValue.raw / (divisor || 1)) + offset}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
                    <span className="text-accent font-semibold">Sau clamp [0,255]:</span>
                    <span className="font-mono font-bold text-accent">{walkValue.clamped}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Ảnh đầu vào + Ảnh đầu ra ─────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Input image */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Ảnh đầu vào (10×10)
                </h4>
                <svg viewBox={`0 0 ${CELL * 10 + 4} ${CELL * 10 + 4}`} className="w-full max-w-[280px] mx-auto">
                  {IMAGE_10x10.map((row, r) =>
                    row.map((val, c) => {
                      const inWindow =
                        Math.abs(r - walkR) <= 1 && Math.abs(c - walkC) <= 1;
                      const isCenter = r === walkR && c === walkC;
                      return (
                        <g
                          key={`in-${r}-${c}`}
                          onClick={() => {
                            setWalkR(r);
                            setWalkC(c);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <rect
                            x={2 + c * CELL}
                            y={2 + r * CELL}
                            width={CELL}
                            height={CELL}
                            fill={`rgb(${val},${val},${val})`}
                            stroke={isCenter ? "#ef4444" : inWindow ? "#f59e0b" : "#334155"}
                            strokeWidth={isCenter ? 2 : inWindow ? 1.5 : 0.5}
                          />
                        </g>
                      );
                    }),
                  )}
                </svg>
                <p className="text-[11px] text-tertiary mt-1 text-center">
                  Khung cam: vùng 3×3 được tích chập. Ô đỏ: tâm kernel.
                </p>
              </div>

              {/* Output image */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Ảnh đầu ra (sau tích chập)
                </h4>
                <svg viewBox={`0 0 ${CELL * 10 + 4} ${CELL * 10 + 4}`} className="w-full max-w-[280px] mx-auto">
                  {outputImage.map((row, r) =>
                    row.map((val, c) => (
                      <motion.rect
                        key={`out-${r}-${c}-${val}`}
                        x={2 + c * CELL}
                        y={2 + r * CELL}
                        width={CELL}
                        height={CELL}
                        fill={`rgb(${val},${val},${val})`}
                        stroke="#334155"
                        strokeWidth={0.5}
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )),
                  )}
                </svg>
                <p className="text-[11px] text-tertiary mt-1 text-center">
                  Ảnh cập nhật ngay khi bạn đổi kernel.
                </p>
              </div>
            </div>

            {/* ── Hoạt ảnh walkthrough tích chập ─────────── */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Walkthrough tích chập: 9 tích + 1 tổng
              </h4>
              <p className="text-xs text-muted mb-3">
                Mỗi ô = pixel_đầu_vào × kernel. Cộng 9 ô lại, chia divisor, cộng offset, clamp → 1 pixel đầu ra.
              </p>
              <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                {[-1, 0, 1].map((dr) =>
                  [-1, 0, 1].map((dc) => {
                    const r = walkR + dr;
                    const c = walkC + dc;
                    const inside = r >= 0 && r < 10 && c >= 0 && c < 10;
                    const pixel = inside ? IMAGE_10x10[r][c] : 0;
                    const k = matrix[dr + 1][dc + 1];
                    const product = pixel * k;
                    return (
                      <motion.div
                        key={`mul-${dr}-${dc}`}
                        initial={{ scale: 0.9, opacity: 0.6 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-md border border-border bg-surface p-2 text-center"
                      >
                        <div className="text-[10px] text-muted">
                          {pixel} × {k}
                        </div>
                        <div
                          className={`text-sm font-mono font-bold ${
                            product > 0
                              ? "text-green-600 dark:text-green-400"
                              : product < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted"
                          }`}
                        >
                          {product}
                        </div>
                      </motion.div>
                    );
                  }),
                )}
              </div>
              <div className="mt-3 rounded-md bg-accent-light p-3 text-center">
                <span className="text-xs text-accent font-semibold">Tổng 9 tích = </span>
                <span className="font-mono font-bold text-accent">{walkValue.raw}</span>
                <span className="text-xs text-accent font-semibold"> → pixel output = </span>
                <span className="font-mono font-bold text-accent">{walkValue.clamped}</span>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 3 — AHA
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Kernel là <strong>bộ lọc có thể học</strong>. Trong xử lý ảnh truyền thống, kỹ sư ngồi
            thiết kế từng giá trị bằng tay: Sobel, Prewitt, Laplacian, Gaussian… Nhưng CNN hiện đại
            đi xa hơn — nó <strong>để backpropagation tự tìm</strong> những kernel tối ưu cho
            từng tác vụ cụ thể. Một lớp Conv trong ResNet có 64 kernel; mỗi kernel học phát hiện
            một đặc trưng khác nhau: cạnh dọc, cạnh ngang, đốm tròn, texture da, biên màu…
          </p>
          <p className="mt-3">
            Điều đó có nghĩa là: thay vì lập trình mắt nhân tạo từng bộ lọc một, ta chỉ cần
            định nghĩa <em>kiến trúc</em> (có bao nhiêu lớp, mỗi lớp bao nhiêu kernel) rồi
            để dữ liệu tự dạy nó nhìn.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 4 — THỬ THÁCH 1
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Kernel Gaussian Blur có các giá trị [[1,2,1],[2,4,2],[1,2,1]] và chia cho 16. Tại sao tâm lại có giá trị 4 (lớn nhất)?"
          options={[
            "Vì pixel trung tâm là pixel quan trọng nhất, nên cho trọng số lớn nhất — giống như trung bình có trọng số, càng xa tâm càng ít ảnh hưởng",
            "Vì 4 là số lớn nhất có thể trong một kernel 3×3",
            "Vì Gaussian là tên một nhà toán học người Đức",
            "Vì 4 + 4×2 + 4×1 = 16 nên chia được cho 16",
          ]}
          correct={0}
          explanation="Phân phối Gaussian (hình quả chuông) có mật độ cao nhất ở tâm, thấp dần ra ngoài. Kernel mô phỏng điều này: tâm 4 > cạnh 2 > góc 1. Pixel ở trung tâm ảnh hưởng nhất đến output, lân cận ảnh hưởng ít hơn. Đây là lý do Gaussian blur mượt hơn box blur (mọi ô đều bằng nhau)."
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 5 — GIẢI THÍCH
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Image Kernel</strong> (còn gọi là filter, mask, convolution matrix) là một ma
            trận nhỏ — thường 3×3, 5×5, hoặc 7×7 — thực hiện phép <strong>tích chập 2D</strong>{" "}
            với ảnh. Đây là thao tác cốt lõi của mạng nơ-ron tích chập (CNN) và mọi thuật toán
            xử lý ảnh truyền thống từ 1960s đến nay.
          </p>

          <p>
            Công thức toán học của tích chập 2D rời rạc (với ảnh I và kernel K):
          </p>

          <LaTeX block>
            {"(I * K)[i, j] = \\sum_{m=-1}^{1} \\sum_{n=-1}^{1} I[i+m,\\, j+n] \\cdot K[m, n]"}
          </LaTeX>

          <p className="text-sm text-muted">
            Kernel K trượt qua ảnh I. Tại mỗi vị trí (i, j): lấy vùng 3×3 của ảnh xung quanh
            điểm đó, nhân element-wise với K, rồi cộng 9 giá trị lại thành 1 pixel đầu ra.
          </p>

          <Callout variant="insight" title="Các loại kernel kinh điển">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Identity:</strong> [[0,0,0],[0,1,0],[0,0,0]]. Giữ nguyên ảnh — dùng để kiểm tra pipeline.
              </p>
              <p>
                <strong>Edge Detection (Laplacian 8-neighbor):</strong> tâm +8, xung quanh -1. Tổng = 0 → vùng phẳng ra 0, chỉ cạnh ra giá trị lớn.
              </p>
              <p>
                <strong>Sobel X/Y:</strong> phát hiện cạnh theo trục — cơ sở của edge detection Canny. Kết hợp √(Gx² + Gy²) cho edge magnitude tổng hợp.
              </p>
              <p>
                <strong>Gaussian Blur:</strong> xấp xỉ phân phối chuẩn 2D. Làm mượt ảnh, giảm nhiễu, là bước tiền xử lý trước edge detection.
              </p>
              <p>
                <strong>Sharpen (Unsharp Mask):</strong> khuếch đại sai biệt giữa pixel và lân cận, làm chi tiết rõ nét hơn.
              </p>
              <p>
                <strong>Emboss:</strong> hiệu ứng chạm nổi — thấy ảnh như điêu khắc 3D bằng cách nhấn mạnh gradient theo một hướng.
              </p>
            </div>
          </Callout>

          <Callout variant="warning" title="Kernel thủ công vs Kernel học được">
            <p className="text-sm">
              Trong xử lý ảnh truyền thống (OpenCV, PIL, scikit-image), kernel được{" "}
              <strong>thiết kế bằng tay</strong> dựa trên công thức toán học cố định. Đây là
              cách làm đã ngự trị suốt 50+ năm.
            </p>
            <p className="text-sm mt-2">
              Trong CNN hiện đại (AlexNet 2012, VGG, ResNet, EfficientNet, ConvNeXt…), kernel là{" "}
              <strong>parameter được học qua backpropagation</strong>. Khởi tạo ngẫu nhiên, sau
              đó SGD/Adam tự điều chỉnh từng giá trị để giảm loss. Mạng tự tìm bộ lọc tối ưu.
              ResNet-50 có hơn 23 triệu parameter kernel — không cách nào thiết kế thủ công!
            </p>
          </Callout>

          <Callout variant="info" title="Padding, Stride và Receptive Field">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Padding:</strong> thêm hàng/cột 0 quanh ảnh trước khi tích chập. Padding = 1 với kernel 3×3 giữ nguyên kích thước output. PyTorch: <code>padding=1</code> hoặc <code>padding=&apos;same&apos;</code>.
              </p>
              <p>
                <strong>Stride:</strong> bước nhảy của kernel. Stride = 1 (mặc định): quét mọi vị trí. Stride = 2: bỏ qua 1 vị trí, output nhỏ hơn ~1/2.
              </p>
              <p>
                <strong>Receptive field:</strong> vùng pixel gốc mà một neuron ở lớp sâu &quot;nhìn&quot; được. Càng xếp chồng nhiều lớp Conv, receptive field càng rộng — lớp sâu có thể &quot;thấy&quot; cả khuôn mặt, lớp đầu chỉ thấy vài pixel.
              </p>
            </div>
          </Callout>

          <Callout variant="tip" title="Mẹo thực hành">
            <ul className="list-disc list-inside space-y-1 text-sm pl-2">
              <li>Với blur để giảm nhiễu, thử Gaussian 5×5 sigma=1.0 — tốt hơn 3×3.</li>
              <li>Trước edge detection, luôn blur nhẹ trước để tránh nhận cạnh giả do nhiễu.</li>
              <li>Kernel sắc (sharpen) mạnh tay có thể gây halo artifact ở cạnh.</li>
              <li>Muốn phát hiện cạnh mạnh hơn Sobel? Thử Scharr hoặc Canny.</li>
            </ul>
          </Callout>

          <CollapsibleDetail title="Chi tiết toán học: Convolution vs Cross-correlation">
            <div className="space-y-2 text-sm">
              <p>
                Về mặt toán học thuần tuý, <strong>tích chập thực sự</strong> đòi hỏi lật kernel 180° trước khi nhân:
              </p>
              <LaTeX block>
                {"(I * K)[i,j] = \\sum_{m} \\sum_{n} I[i-m,\\, j-n] \\cdot K[m,n]"}
              </LaTeX>
              <p>
                Còn phép mà chúng ta làm ở trên (không lật kernel) chính xác là{" "}
                <strong>cross-correlation</strong>:
              </p>
              <LaTeX block>
                {"(I \\star K)[i,j] = \\sum_{m} \\sum_{n} I[i+m,\\, j+n] \\cdot K[m,n]"}
              </LaTeX>
              <p>
                Tuy nhiên trong deep learning, hầu hết framework (PyTorch, TensorFlow) dùng cross-correlation nhưng vẫn gọi là &quot;convolution&quot;. Vì kernel được học, việc lật hay không không ảnh hưởng kết quả — mạng tự học luôn dạng đã-lật hoặc chưa-lật. Quen thuộc thì cứ dùng thuật ngữ convolution, nhưng biết khác biệt toán học là quan trọng khi đọc paper cũ.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Tại sao kernel 3×3 phổ biến hơn 5×5 hay 7×7?">
            <div className="space-y-2 text-sm">
              <p>
                Trước AlexNet (2012), nhiều mạng dùng kernel 7×7, 11×11 cho lớp đầu. Nhưng VGG (2014) chứng minh:
                <strong> 2 lớp Conv 3×3 xếp chồng có receptive field 5×5</strong> (tương đương kernel 5×5), nhưng:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>
                  <strong>Ít parameter hơn:</strong> 2×(3×3) = 18 vs 1×(5×5) = 25.
                </li>
                <li>
                  <strong>Nhiều non-linearity hơn:</strong> có 2 lần ReLU thay vì 1, biểu diễn được hàm phức tạp hơn.
                </li>
                <li>
                  <strong>Regularization ngầm:</strong> hạn chế không gian hàm học được.
                </li>
              </ul>
              <p>
                Từ đó, 3×3 trở thành chuẩn &quot;mặc định&quot;. ResNet, Inception, EfficientNet đều chủ yếu dùng 3×3 (đôi khi thêm 1×1 để giảm số kênh). Ngoại lệ: lớp đầu tiên của ResNet-50 vẫn dùng 7×7 stride 2 để giảm nhanh độ phân giải.
              </p>
            </div>
          </CollapsibleDetail>

          <CodeBlock language="python" title="Áp dụng kernel với OpenCV (Python)">
{`import cv2
import numpy as np

# ── Đọc ảnh grayscale ────────────────────────────────────────
img = cv2.imread("ho_guom.jpg", cv2.IMREAD_GRAYSCALE)

# ── Kernel phát hiện cạnh (Laplacian 8-neighbor) ────────────
edge_kernel = np.array([
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1],
], dtype=np.float32)

# ── Kernel Gaussian blur 5×5, sigma=1.0 ─────────────────────
gauss = cv2.getGaussianKernel(ksize=5, sigma=1.0)
blur_kernel = gauss @ gauss.T  # 2D Gaussian = tích ngoài của 1D

# ── Kernel sharpen (Unsharp Mask đơn giản) ──────────────────
sharpen_kernel = np.array([
    [ 0, -1,  0],
    [-1,  5, -1],
    [ 0, -1,  0],
], dtype=np.float32)

# ── Kernel emboss ───────────────────────────────────────────
emboss_kernel = np.array([
    [-2, -1, 0],
    [-1,  1, 1],
    [ 0,  1, 2],
], dtype=np.float32)

# ── Áp dụng tích chập: filter2D(image, depth, kernel) ───────
# depth = -1 → cùng depth với ảnh gốc (uint8)
edges   = cv2.filter2D(img, -1, edge_kernel)
blurred = cv2.filter2D(img, -1, blur_kernel)
sharp   = cv2.filter2D(img, -1, sharpen_kernel)
emboss  = cv2.filter2D(img, -1, emboss_kernel) + 128  # offset

# ── Sobel sẵn có trong OpenCV (chính xác hơn, hỗ trợ float) ─
sobel_x = cv2.Sobel(img, cv2.CV_64F, dx=1, dy=0, ksize=3)
sobel_y = cv2.Sobel(img, cv2.CV_64F, dx=0, dy=1, ksize=3)

# Độ lớn gradient tổng hợp
magnitude = np.sqrt(sobel_x**2 + sobel_y**2)
magnitude = np.clip(magnitude, 0, 255).astype(np.uint8)

# ── Edge detection Canny (tổ hợp nhiều bước, rất mạnh) ──────
canny = cv2.Canny(img, threshold1=100, threshold2=200)

# ── Ghi ảnh ra file ─────────────────────────────────────────
cv2.imwrite("edges.jpg", edges)
cv2.imwrite("blurred.jpg", blurred)
cv2.imwrite("sharp.jpg", sharp)
cv2.imwrite("emboss.jpg", emboss)
cv2.imwrite("gradient.jpg", magnitude)
cv2.imwrite("canny.jpg", canny)`}
          </CodeBlock>

          <p className="mt-4">
            Nếu bạn chỉ cần một kernel có sẵn, OpenCV cung cấp <code>cv2.Sobel</code>,{" "}
            <code>cv2.Laplacian</code>, <code>cv2.GaussianBlur</code>,{" "}
            <code>cv2.medianBlur</code>… Còn khi cần kernel tuỳ biến, dùng <code>cv2.filter2D</code> như trên.
          </p>

          <CodeBlock language="python" title="Kernel học được trong CNN với PyTorch">
{`import torch
import torch.nn as nn
import torch.nn.functional as F

# ── Một lớp Conv2D có 32 kernel 3×3, học qua backprop ──────
conv = nn.Conv2d(
    in_channels=3,       # ảnh RGB
    out_channels=32,     # 32 kernel → 32 feature map
    kernel_size=3,
    stride=1,
    padding=1,           # giữ kích thước (padding='same')
    bias=True,
)

# Kernel weights: shape (32, 3, 3, 3)
#   32 = số kernel
#    3 = số kênh input (RGB)
#  3×3 = kích thước spatial
print(conv.weight.shape)  # torch.Size([32, 3, 3, 3])

# ── Khởi tạo ngẫu nhiên He (phù hợp với ReLU) ──────────────
nn.init.kaiming_normal_(conv.weight, nonlinearity='relu')

# ── Forward pass: ảnh (batch=1, C=3, H=64, W=64) ───────────
x = torch.randn(1, 3, 64, 64)
y = conv(x)
print(y.shape)  # torch.Size([1, 32, 64, 64])

# ── Training loop đơn giản ─────────────────────────────────
optimizer = torch.optim.Adam(conv.parameters(), lr=1e-3)
target = torch.randn(1, 32, 64, 64)

for step in range(100):
    optimizer.zero_grad()
    pred = conv(x)
    loss = F.mse_loss(pred, target)
    loss.backward()      # ← BACKPROP điều chỉnh kernel weights
    optimizer.step()

# Sau training, conv.weight đã thay đổi — mạng đã "học" ra
# những kernel tối ưu cho bài toán, KHÔNG CẦN thiết kế thủ công.`}
          </CodeBlock>

          <p>
            Sự khác biệt cốt lõi: ở code đầu (OpenCV), bạn ghi rõ từng giá trị kernel. Ở code sau (PyTorch),
            bạn chỉ nói &quot;tôi muốn 32 kernel 3×3&quot; rồi để backprop tự tìm giá trị. Đây chính là
            cuộc cách mạng mà deep learning mang tới cho computer vision.
          </p>

          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            So sánh: Kernel thủ công vs Kernel học được
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Tiêu chí</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Thủ công (OpenCV)</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Học được (CNN)</th>
                </tr>
              </thead>
              <tbody className="text-muted">
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Nguồn gốc giá trị</td>
                  <td className="py-2 px-3">Kỹ sư thiết kế theo công thức</td>
                  <td className="py-2 px-3">Backprop tự tìm từ dữ liệu</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Cần dữ liệu?</td>
                  <td className="py-2 px-3">Không</td>
                  <td className="py-2 px-3">Có — nhiều càng tốt (thường 10K+ ảnh)</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Tổng quát hoá</td>
                  <td className="py-2 px-3">Cố định — không thích nghi</td>
                  <td className="py-2 px-3">Rất tốt với task đã huấn luyện</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Khả năng diễn giải</td>
                  <td className="py-2 px-3">Dễ — nhìn giá trị là hiểu</td>
                  <td className="py-2 px-3">Khó — phải dùng Grad-CAM, feature viz…</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Hiệu năng trên task phức tạp</td>
                  <td className="py-2 px-3">Thấp — không học được khái niệm cao cấp</td>
                  <td className="py-2 px-3">Cao — học được mắt, mũi, bánh xe, khuôn mặt…</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3">Chi phí tính toán</td>
                  <td className="py-2 px-3">Rất rẻ — chỉ một phép filter</td>
                  <td className="py-2 px-3">Tốn GPU khi training, inference vẫn nhẹ</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Use case</td>
                  <td className="py-2 px-3">Preprocessing, industrial vision đơn giản</td>
                  <td className="py-2 px-3">Classification, detection, segmentation hiện đại</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Đi sâu: 1×1 Convolution — kernel kỳ lạ nhưng cực mạnh
          </h3>
          <p>
            Một kernel 1×1 có vẻ vô nghĩa — nó chỉ nhân pixel với một số. Nhưng trong CNN với nhiều kênh,
            1×1 convolution thực sự là một phép{" "}
            <strong>combine các feature map</strong>: với input C kênh và C&apos; kernel 1×1, mỗi kernel
            là một vector trọng số C chiều, thực hiện linear combination của C feature map input
            thành 1 feature map output.
          </p>
          <LaTeX block>
            {"\\text{output}[i,j,k'] = \\sum_{k=0}^{C-1} \\text{input}[i,j,k] \\cdot K[k, k']"}
          </LaTeX>
          <p>
            Ứng dụng: Inception dùng 1×1 để <strong>giảm chiều kênh</strong> trước khi conv 3×3/5×5 đắt đỏ,
            ResNet-50 dùng bottleneck 1×1 → 3×3 → 1×1 để tiết kiệm tham số, MobileNet dùng 1×1 kết hợp
            với depthwise conv cho mobile inference.
          </p>

          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Trực giác hình ảnh: tại sao tổng kernel quyết định hiệu ứng
          </h3>
          <p>
            Có một cách đơn giản để &quot;đoán&quot; một kernel làm gì chỉ từ tổng của nó:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm pl-2">
            <li>
              <strong>Tổng = 1:</strong> giữ độ sáng trung bình (Identity, Gaussian sau khi chia, Sharpen).
              Đây là kernel &quot;bảo toàn năng lượng&quot; — ảnh không sáng lên/tối đi tổng thể.
            </li>
            <li>
              <strong>Tổng &gt; 1:</strong> làm ảnh sáng lên (hiếm dùng trực tiếp).
            </li>
            <li>
              <strong>Tổng &lt; 1 nhưng &gt; 0:</strong> làm ảnh tối đi.
            </li>
            <li>
              <strong>Tổng = 0:</strong> highlight sự thay đổi — vùng đồng nhất cho 0 (đen),
              chỉ cạnh/biên mới cho giá trị khác 0. Tất cả edge detector đều có tổng = 0.
            </li>
            <li>
              <strong>Kernel đối xứng:</strong> tạo hiệu ứng không thiên hướng (blur, sharpen).
            </li>
            <li>
              <strong>Kernel bất đối xứng:</strong> tạo hiệu ứng có hướng (Sobel X/Y, Emboss).
            </li>
          </ul>

          <p>
            Thử nghiệm ngay ở phần playground phía trên: điền 9 số bất kỳ vào ma trận, quan sát ảnh output.
            Nếu bạn nhập [1,1,1; 1,1,1; 1,1,1] và divisor = 9, đó là <em>box blur</em>. Nhập{" "}
            [-1,0,1; -1,0,1; -1,0,1] thì ra một edge detector dọc thô sơ. Trực giác này rất hữu ích khi
            debug CNN hoặc khi thiết kế bộ lọc preprocessing.
          </p>

          <CollapsibleDetail title="Bonus: Separable Convolution và tối ưu tốc độ">
            <div className="space-y-2 text-sm">
              <p>
                Một kernel 2D K là <strong>separable</strong> nếu có thể viết thành tích ngoài của 2 vector 1D:
              </p>
              <LaTeX block>{"K_{2D} = v \\cdot h^T"}</LaTeX>
              <p>
                Ví dụ, Gaussian 2D = Gaussian 1D dọc ⊗ Gaussian 1D ngang. Thay vì tích chập 2D tốn{" "}
                <strong>k² phép nhân mỗi pixel</strong>, ta tích chập 1D hai lần — chỉ tốn{" "}
                <strong>2k phép nhân</strong>. Với kernel 5×5: 25 → 10 (tiết kiệm 60%). Với 7×7: 49 → 14 (72%).
              </p>
              <p>
                OpenCV tự động tối ưu điều này cho <code>GaussianBlur</code>. MobileNet phát triển ý tưởng xa
                hơn với <strong>depthwise-separable convolution</strong>: tách spatial conv và channel conv,
                giảm tham số ~9 lần so với conv chuẩn, với accuracy giảm rất ít.
              </p>
            </div>
          </CollapsibleDetail>

          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Code: Separable Convolution trong thực tế
          </h3>
          <p>
            Nếu kernel 2D có rank = 1 (SVD cho đúng 1 giá trị kỳ dị khác 0), ta có thể tách thành tích
            ngoài của 2 vector 1D. Dưới đây là triển khai thuần Python + NumPy để minh hoạ tiết kiệm
            tính toán:
          </p>

          <CodeBlock language="python" title="Separable convolution: Gaussian 5×5 → 2 conv 1D">
{`import numpy as np
from scipy.signal import convolve2d

# ── 1) Kernel Gaussian 5×5 (σ=1) ──────────────────────────
def gaussian_1d(k=5, sigma=1.0):
    x = np.arange(k) - (k - 1) / 2
    g = np.exp(-(x**2) / (2 * sigma**2))
    return g / g.sum()

g1 = gaussian_1d(5, 1.0)         # shape (5,)
G2d = np.outer(g1, g1)           # shape (5,5), sum = 1

# ── 2) Kiểm tra rank bằng SVD: kernel separable nếu rank=1 ─
U, S, Vt = np.linalg.svd(G2d)
print("Giá trị kỳ dị:", S.round(4))   # chỉ S[0] khác 0 đáng kể
print("Tỉ lệ S[1]/S[0]:", S[1] / S[0]) # ~ 1e-16 — separable!

# ── 3) Cách "ngây thơ": conv2D trực tiếp O(k²) ────────────
img = np.random.rand(512, 512)
out_2d = convolve2d(img, G2d, mode="same", boundary="symm")

# ── 4) Cách tối ưu: 2 lần conv1D O(2k) ────────────────────
#     kernel 1D dọc → ngang, kết quả TƯƠNG ĐƯƠNG cách 3)
out_sep_v = convolve2d(img, g1[:, None], mode="same", boundary="symm")
out_sep   = convolve2d(out_sep_v, g1[None, :], mode="same", boundary="symm")

# ── 5) So sánh sai số ─────────────────────────────────────
diff = np.abs(out_2d - out_sep).max()
print(f"Max diff = {diff:.2e}")   # ~ 1e-14, gần như = 0

# ── 6) Đếm FLOPs ──────────────────────────────────────────
# Naïve 2D: k² = 25 nhân/pixel → 25 · 512² = 6.55M
# Separable: 2k = 10 nhân/pixel → 2.62M  (giảm 60%)
# Với kernel 11×11: 121 vs 22  → giảm 82%`}
          </CodeBlock>

          <p className="mt-3">
            Trên GPU, lợi ích của separable conv đến từ việc hai bước 1D có dạng tensor nhỏ hơn, dễ
            tile vào shared memory. OpenCV tự nhận ra kernel symmetric separable và gọi{" "}
            <code>sepFilter2D</code> ở bên dưới khi bạn dùng <code>GaussianBlur</code>. Trên CPU,
            SIMD cũng khai thác 1D conv tốt hơn 2D.
          </p>

          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Code: Depthwise Separable Convolution (MobileNet)
          </h3>
          <p>
            Depthwise-separable là một phát minh của MobileNet (2017): tách một conv chuẩn thành 2
            bước — <em>depthwise</em> (mỗi kênh input có 1 kernel riêng) và <em>pointwise</em>{" "}
            (conv 1×1 để trộn kênh). Tổng chi phí giảm ~8–9× so với conv chuẩn.
          </p>

          <CodeBlock language="python" title="Depthwise separable conv trong PyTorch">
{`import torch
import torch.nn as nn

# ── Conv chuẩn: 32 → 64 kênh, kernel 3×3 ──────────────────
#    tham số: 32 × 64 × 3 × 3 = 18,432
standard_conv = nn.Conv2d(
    in_channels=32, out_channels=64,
    kernel_size=3, padding=1, bias=False,
)
print("Standard params:", sum(p.numel() for p in standard_conv.parameters()))

# ── Depthwise separable: 2 lớp thay cho 1 ─────────────────
class DepthwiseSeparable(nn.Module):
    def __init__(self, in_ch, out_ch, k=3):
        super().__init__()
        # 1) Depthwise — mỗi kênh input 1 kernel riêng (groups = in_ch)
        self.depthwise = nn.Conv2d(
            in_ch, in_ch,
            kernel_size=k, padding=k // 2,
            groups=in_ch,           # ← mấu chốt
            bias=False,
        )
        # 2) Pointwise — conv 1×1 để trộn kênh từ in_ch → out_ch
        self.pointwise = nn.Conv2d(
            in_ch, out_ch,
            kernel_size=1,
            bias=False,
        )
        self.bn1 = nn.BatchNorm2d(in_ch)
        self.bn2 = nn.BatchNorm2d(out_ch)
        self.act = nn.ReLU6(inplace=True)

    def forward(self, x):
        x = self.act(self.bn1(self.depthwise(x)))
        x = self.act(self.bn2(self.pointwise(x)))
        return x

dsc = DepthwiseSeparable(32, 64)
print("DW-Sep params:", sum(p.numel() for p in dsc.parameters() if p.requires_grad))

# Tham số: depthwise 32·3·3 = 288  +  pointwise 32·64·1·1 = 2048 = 2336
# So với conv chuẩn 18,432 → giảm ~7.9 lần! Accuracy giảm <1% trên ImageNet.
# Công thức chung: tiết kiệm ≈ 1/N + 1/k²
#   N = số kênh output, k = kích thước kernel
#   Với N=64, k=3: 1/64 + 1/9 = 0.127 → chỉ tốn 12.7% chi phí gốc.

x = torch.randn(1, 32, 56, 56)
print(standard_conv(x).shape)   # [1, 64, 56, 56]
print(dsc(x).shape)             # [1, 64, 56, 56] — cùng output shape`}
          </CodeBlock>

          <p className="mt-3">
            Kể từ MobileNet, mọi mạng CNN hướng mobile (MobileNetV2/V3, EfficientNet, EfficientNet-Lite,
            ShuffleNet, GhostNet…) đều dựa trên depthwise-separable. ConvNeXt (2022) cũng dùng
            depthwise 7×7 để &quot;đuổi kịp&quot; ViT về receptive field rộng trong khi vẫn giữ tham số
            hợp lý.
          </p>

          <CollapsibleDetail title="Biến đổi Fourier của kernel — góc nhìn tần số">
            <div className="space-y-2 text-sm">
              <p>
                Một cái nhìn sâu xa về kernel: mọi phép tích chập có thể <strong>diễn đạt trong miền
                tần số</strong>. Theo định lý tích chập:
              </p>
              <LaTeX block>{"I * K \\;\\longleftrightarrow\\; \\hat{I} \\cdot \\hat{K}"}</LaTeX>
              <p>
                Tức là tích chập trong miền không gian tương đương với nhân element-wise trong miền
                Fourier. <LaTeX>{"\\hat{K}"}</LaTeX> (DFT 2D của kernel) cho ta biết kernel{" "}
                <em>cho phép những tần số nào đi qua</em>:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>
                  <strong>Gaussian blur</strong> có DFT là một đường cong &quot;hình chuông&quot; tập
                  trung quanh tần số 0 — đây là <em>low-pass filter</em>: chỉ cho tần số thấp qua,
                  chặn tần số cao → mượt ảnh, loại nhiễu.
                </li>
                <li>
                  <strong>Edge detect (Laplacian 8-neighbor)</strong> có DFT giá trị nhỏ ở tâm, lớn ở
                  rìa — <em>high-pass filter</em>: cho tần số cao qua (cạnh, góc, chi tiết) và chặn
                  tần số thấp (vùng phẳng, nền).
                </li>
                <li>
                  <strong>Sharpen</strong> = ảnh gốc + phần high-frequency → DFT có giá trị ≥ 1 khắp
                  nơi, đặc biệt khuếch đại tần số cao.
                </li>
                <li>
                  <strong>Sobel X/Y</strong> là <em>band-pass</em> theo hướng: DFT của Sobel X gần 0
                  dọc trục <LaTeX>{"\\omega_x = 0"}</LaTeX> và lớn khi{" "}
                  <LaTeX>{"\\omega_x"}</LaTeX> lớn — chọn tần số theo trục ngang.
                </li>
              </ul>

              <p>
                Công thức DFT 2D rời rạc của kernel:
              </p>
              <LaTeX block>
                {"\\hat{K}[u, v] = \\sum_{m=0}^{M-1} \\sum_{n=0}^{N-1} K[m, n] \\; e^{-j 2\\pi (um/M + vn/N)}"}
              </LaTeX>

              <p>
                Hệ quả thực hành: nếu cần tích chập với kernel <em>rất lớn</em> (ví dụ 51×51), thay
                vì tốn <LaTeX>{"O(HW \\cdot 51^2)"}</LaTeX> trong không gian, ta dùng FFT:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>
                  FFT ảnh <LaTeX>{"\\hat{I} = \\mathcal{F}(I)"}</LaTeX>, độ phức tạp{" "}
                  <LaTeX>{"O(HW \\log(HW))"}</LaTeX>.
                </li>
                <li>
                  FFT kernel (sau khi zero-pad về cùng kích thước ảnh).
                </li>
                <li>
                  Nhân element-wise trong miền tần số.
                </li>
                <li>
                  Inverse FFT để lấy kết quả.
                </li>
              </ol>
              <p>
                Điểm hoà vốn: khoảng kernel 9×9 đến 15×15 trở lên thì FFT-conv nhanh hơn space-conv
                trên CPU. OpenCV có <code>cv2.dft</code> và <code>scipy.signal.fftconvolve</code>{" "}
                dùng sẵn chiến thuật này. Ngoài ra, nhiều thuật toán như <em>Wiener
                deconvolution</em>, <em>bandpass filtering</em>, <em>hybrid image</em> (Oliva &amp;
                Schyns 2006) đều thao tác trực tiếp trong miền tần số.
              </p>

              <p>
                Góc nhìn này giúp hiểu vì sao <strong>CNN deep</strong> có thể biểu diễn bất kỳ bộ
                lọc tuyến tính nào: xếp chồng nhiều conv 3×3 + ReLU đủ để mô phỏng filter tần số
                tuỳ ý. Đó cũng là lý do vì sao Fourier analysis vẫn là công cụ cổ điển nhưng vô
                giá khi debug kernel &quot;lạ&quot; trong các paper computer vision cũ.
              </p>

              <p>
                Code minh hoạ ngắn:
              </p>
              <CodeBlock language="python" title="Xem phổ tần số của kernel Gaussian vs Edge">
{`import numpy as np
import matplotlib.pyplot as plt

def pad_and_fft(kernel, size=64):
    padded = np.zeros((size, size))
    kh, kw = kernel.shape
    padded[:kh, :kw] = kernel
    F = np.fft.fftshift(np.fft.fft2(padded))
    return np.abs(F)

gauss = np.array([[1, 2, 1], [2, 4, 2], [1, 2, 1]]) / 16
edge  = np.array([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]])

Gf = pad_and_fft(gauss)
Ef = pad_and_fft(edge)

# Gf tập trung ở tâm (tần số 0) → low-pass
# Ef nhỏ ở tâm, lớn ở rìa       → high-pass

fig, ax = plt.subplots(1, 2, figsize=(8, 4))
ax[0].imshow(np.log(Gf + 1e-3), cmap="viridis"); ax[0].set_title("Gaussian FFT")
ax[1].imshow(np.log(Ef + 1e-3), cmap="viridis"); ax[1].set_title("Edge FFT")
plt.show()`}
              </CodeBlock>
            </div>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 6 — THỬ THÁCH 2
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn áp dụng kernel Sobel X lên một bức ảnh chụp cầu thang (có nhiều cạnh dọc và ngang). Đoán kết quả bạn sẽ thấy?"
          options={[
            "Mọi cạnh đều sáng như nhau",
            "Chỉ cạnh DỌC của cầu thang (các trụ, tay vịn đứng) hiện ra rõ, cạnh ngang (bậc) mờ đi",
            "Chỉ cạnh NGANG của cầu thang (các bậc) hiện ra rõ, cạnh dọc mờ đi",
            "Ảnh chuyển sang màu xanh dương",
          ]}
          correct={1}
          explanation="Sobel X có cột trái âm, cột phải dương → đo gradient theo trục X (ngang) → phát hiện sự thay đổi cường độ khi DI CHUYỂN NGANG → tìm ra cạnh DỌC. Muốn cạnh ngang, dùng Sobel Y. Muốn tất cả, dùng √(Gx² + Gy²)."
        />
        <p className="text-sm text-muted mt-3">
          Muốn đi sâu hơn? Xem <TopicLink slug="convolution">convolution</TopicLink>, sau đó{" "}
          <TopicLink slug="cnn">CNN</TopicLink> để hiểu cách nhiều lớp Conv xếp chồng học hierarchy đặc trưng.
        </p>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 7 — TÓM TẮT
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          points={[
            "Image kernel là ma trận nhỏ (3×3, 5×5) trượt trên ảnh, thực hiện nhân element-wise rồi cộng — tạo ra pixel đầu ra mới.",
            "Các kernel kinh điển: Identity (giữ nguyên), Edge (phát hiện cạnh), Sobel X/Y (cạnh theo trục), Gaussian (làm mờ), Sharpen (làm sắc), Emboss (chạm nổi), Laplacian (đạo hàm 2).",
            "Tổng kernel quyết định: tổng = 1 → giữ độ sáng; tổng = 0 → highlight thay đổi; chia divisor để chuẩn hoá; cộng offset khi có giá trị âm.",
            "Padding giữ kích thước output, stride điều khiển độ phân giải output — cả hai đều có trong mọi framework deep learning.",
            "Xử lý ảnh truyền thống: kernel thiết kế thủ công (OpenCV). CNN hiện đại: kernel HỌC qua backpropagation — mạng tự tìm bộ lọc tối ưu cho tác vụ.",
            "Kernel 3×3 xếp chồng tạo receptive field lớn mà vẫn ít tham số — đó là lý do kiến trúc như ResNet, EfficientNet đều chủ yếu dùng 3×3.",
          ]}
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 8 — KIỂM TRA
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
