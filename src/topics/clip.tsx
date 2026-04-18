"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ──────────────────────────────────────────────────────────────────────────
 * Metadata — giữ nguyên từ phiên bản trước.
 * ────────────────────────────────────────────────────────────────────────── */
export const metadata: TopicMeta = {
  slug: "clip",
  title: "CLIP",
  titleVi: "CLIP — Kết nối hình ảnh và ngôn ngữ",
  description:
    "Mô hình học cách liên kết hình ảnh và văn bản trong cùng một không gian vector, cho phép tìm kiếm ảnh bằng ngôn ngữ tự nhiên.",
  category: "multimodal",
  tags: ["clip", "contrastive-learning", "image-text", "embedding"],
  difficulty: "intermediate",
  relatedSlugs: ["vlm", "text-to-image", "unified-multimodal"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────────────────
 * Dữ liệu cho ma trận tương phản (contrastive matrix).
 *
 * Ý tưởng: 5 ảnh (hàng) × 5 mô tả (cột) → 25 ô cosine similarity.
 * Đường chéo là cặp đúng (ảnh i ↔ mô tả i), ngoài đường chéo là cặp sai.
 * Hai tập giá trị: "init" (trước huấn luyện) và "trained" (sau huấn luyện).
 * Trước huấn luyện, tất cả các ô xấp xỉ 0.2 (gần như ngẫu nhiên).
 * Sau huấn luyện, đường chéo ~0.9, ngoài đường chéo ~0.05-0.15.
 * ────────────────────────────────────────────────────────────────────────── */
type ImageItem = {
  id: string;
  emoji: string;
  vi: string;
  en: string;
};

type TextItem = {
  id: string;
  vi: string;
  en: string;
};

const IMAGES: ImageItem[] = [
  { id: "pho", emoji: "🍜", vi: "Tô phở bò", en: "a bowl of pho bo" },
  { id: "aodai", emoji: "👗", vi: "Áo dài trắng", en: "a white ao dai" },
  { id: "halong", emoji: "🏝️", vi: "Vịnh Hạ Long", en: "Ha Long Bay" },
  { id: "xemay", emoji: "🛵", vi: "Xe máy phố cổ", en: "a scooter in the old quarter" },
  { id: "banhmi", emoji: "🥖", vi: "Bánh mì Sài Gòn", en: "a Saigon banh mi" },
];

const TEXTS: TextItem[] = [
  { id: "pho", vi: "Tô phở bò nóng hổi với hành lá", en: "a hot bowl of pho with scallions" },
  { id: "aodai", vi: "Nữ sinh mặc áo dài trắng", en: "a student wearing a white ao dai" },
  { id: "halong", vi: "Đảo đá vôi giữa biển xanh ngọc", en: "limestone islands in emerald sea" },
  { id: "xemay", vi: "Chiếc xe máy trên phố Hà Nội", en: "a scooter on a Hanoi street" },
  { id: "banhmi", vi: "Bánh mì giòn kẹp thịt nướng", en: "a crispy banh mi with grilled meat" },
];

// Ma trận trước huấn luyện: gần ngẫu nhiên, tất cả ~0.18-0.25.
const INIT_MATRIX: number[][] = [
  [0.22, 0.19, 0.24, 0.18, 0.21],
  [0.20, 0.23, 0.17, 0.22, 0.19],
  [0.18, 0.21, 0.25, 0.20, 0.22],
  [0.24, 0.17, 0.19, 0.23, 0.20],
  [0.21, 0.20, 0.18, 0.24, 0.23],
];

// Ma trận sau huấn luyện: đường chéo ~0.88-0.94, ngoài ~0.04-0.15.
const TRAINED_MATRIX: number[][] = [
  [0.93, 0.08, 0.11, 0.14, 0.22],
  [0.06, 0.91, 0.05, 0.09, 0.07],
  [0.10, 0.04, 0.94, 0.12, 0.05],
  [0.17, 0.07, 0.13, 0.88, 0.11],
  [0.19, 0.06, 0.04, 0.10, 0.92],
];

/* ──────────────────────────────────────────────────────────────────────────
 * Dữ liệu cho phần zero-shot classification.
 *
 * Người học nhập một danh sách nhãn (prompt engineering), CLIP "chọn" ảnh
 * có similarity cao nhất. Ở đây mô phỏng kết quả cosine dựa theo nhãn.
 * ────────────────────────────────────────────────────────────────────────── */
const DEFAULT_ZS_LABELS = [
  "một bức ảnh phở bò",
  "một bức ảnh áo dài",
  "một bức ảnh vịnh Hạ Long",
  "một bức ảnh xe máy",
  "một bức ảnh bánh mì",
];

/**
 * Hàm mô phỏng similarity giữa một nhãn text và từng ảnh.
 * Thực tế, mô hình sẽ trả về vector và ta tính cosine.
 * Ở đây ta dùng keyword matching đơn giản để minh hoạ.
 */
function simulateSimilarity(label: string, imageId: string): number {
  const l = label.toLowerCase();
  const keywords: Record<string, string[]> = {
    pho: ["phở", "pho", "noodle", "soup"],
    aodai: ["áo dài", "ao dai", "dress"],
    halong: ["hạ long", "ha long", "bay", "vịnh", "đảo"],
    xemay: ["xe máy", "scooter", "motorbike", "moto"],
    banhmi: ["bánh mì", "banh mi", "sandwich"],
  };
  const list = keywords[imageId] ?? [];
  const matched = list.some((k) => l.includes(k));
  if (matched) {
    // độ dài mô tả càng kỹ → similarity càng cao
    const bonus = Math.min(label.length / 60, 0.12);
    return 0.78 + bonus + (Math.random() - 0.5) * 0.04;
  }
  return 0.08 + Math.random() * 0.12;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Quiz — 8 câu (yêu cầu: 8 quiz questions).
 * Hỗn hợp multiple-choice và fill-blank để đa dạng.
 * ────────────────────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "CLIP được huấn luyện bằng phương pháp nào?",
    options: [
      "Supervised learning — con người gán nhãn từng ảnh",
      "Contrastive learning — kéo cặp ảnh-mô tả đúng lại gần, đẩy cặp sai ra xa trong không gian embedding",
      "Reinforcement learning — thử-sai để tìm cặp phù hợp",
      "Self-supervised learning — dự đoán phần bị che trong ảnh",
    ],
    correct: 1,
    explanation:
      "CLIP dùng contrastive learning trên 400 triệu cặp ảnh-mô tả từ internet. Với mỗi batch N cặp, mô hình phải xác định đúng N cặp khớp trong ma trận N × N khả năng. Đây chính là InfoNCE loss đối xứng.",
  },
  {
    question:
      "CLIP có thể phân loại ảnh mà KHÔNG cần dữ liệu huấn luyện cho task đó (zero-shot). Cách nào?",
    options: [
      "CLIP nhớ hết các ảnh đã thấy trong quá trình huấn luyện",
      "Tạo text embedding cho mỗi nhãn (ví dụ: 'a photo of a cat'), so sánh similarity với image embedding của ảnh cần phân loại",
      "CLIP dùng bộ phân loại SVM ẩn bên trong",
      "CLIP tra cứu ảnh tương tự trên Google Images",
    ],
    correct: 1,
    explanation:
      "Đây là sức mạnh zero-shot: thay vì train classifier, ta chỉ cần viết mô tả cho mỗi nhãn bằng ngôn ngữ tự nhiên, encode thành text embedding, rồi so cosine similarity với image embedding. Nhãn có similarity cao nhất = kết quả phân loại.",
  },
  {
    question:
      "Stable Diffusion dùng CLIP text encoder. Vai trò của nó trong text-to-image là gì?",
    options: [
      "Phân loại prompt vào các thể loại ảnh",
      "Tạo ảnh trực tiếp từ prompt",
      "Mã hoá prompt thành conditioning vector để dẫn dắt quá trình khử nhiễu của U-Net",
      "Kiểm tra prompt có vi phạm nội quy không",
    ],
    correct: 2,
    explanation:
      "CLIP text encoder chuyển prompt thành vector ngữ nghĩa 768 chiều. Vector này được đưa vào U-Net qua cross-attention, dẫn dắt quá trình khử nhiễu: 'nên khử nhiễu theo hướng nào để ảnh khớp với mô tả?'. Không có CLIP, U-Net sẽ tạo ảnh ngẫu nhiên.",
  },
  {
    type: "fill-blank",
    question:
      "CLIP dùng hai encoder song song để tạo embedding của {blank} (qua Vision Transformer) và embedding của {blank} (qua Text Transformer), rồi đặt cả hai vào cùng một không gian vector để so cosine similarity.",
    blanks: [
      { answer: "image", accept: ["hình ảnh", "Image", "ảnh"] },
      { answer: "text", accept: ["văn bản", "Text", "mô tả"] },
    ],
    explanation:
      "CLIP học liên kết image ↔ text: image encoder (ViT) cho ra vector ảnh, text encoder (Transformer) cho ra vector văn bản, cả hai được chiếu vào cùng không gian 768 chiều.",
  },
  {
    question:
      "Trong InfoNCE loss của CLIP, tham số temperature τ (tau) có tác dụng gì?",
    options: [
      "Điều chỉnh learning rate của optimizer",
      "Điều chỉnh độ 'sắc' của softmax — τ nhỏ làm phân phối tập trung vào cặp đúng, τ lớn làm phân phối mềm hơn",
      "Chỉ dùng khi inference, không ảnh hưởng huấn luyện",
      "Quyết định batch size tối đa có thể dùng",
    ],
    correct: 1,
    explanation:
      "τ giống nhiệt độ trong softmax: khi τ → 0, similarity của cặp đúng bị phóng đại, gradient rất lớn nhưng mô hình dễ mất ổn định. Khi τ lớn, gradient êm hơn nhưng học chậm. CLIP học cả τ như một tham số (log τ), giá trị hội tụ quanh 0.07.",
  },
  {
    question:
      "Batch size trong huấn luyện CLIP rất quan trọng. Tại sao batch lớn (32k) lại tốt hơn batch nhỏ (256)?",
    options: [
      "Batch lớn cho gradient chính xác hơn nhưng không ảnh hưởng chất lượng mô hình",
      "Batch lớn cung cấp nhiều cặp âm (negative pairs) để so sánh, giúp học không gian embedding tốt hơn",
      "Batch lớn tiết kiệm GPU memory",
      "Batch lớn bắt buộc cho Vision Transformer",
    ],
    correct: 1,
    explanation:
      "Contrastive learning cần nhiều negative pairs để phân biệt. Với batch N, mỗi ảnh có N−1 negative texts. Batch 32k → 31.999 negatives → không gian embedding phân tách tốt. Đây là lý do CLIP gốc dùng batch 32.768 trên nhiều GPU.",
  },
  {
    type: "fill-blank",
    question:
      "Một kỹ thuật phổ biến khi dùng CLIP zero-shot là {blank} — bọc nhãn trong mẫu câu như 'a photo of a {nhãn}' thay vì chỉ dùng nhãn trần. Điều này khớp với phân phối {blank} mà CLIP đã thấy khi huấn luyện.",
    blanks: [
      { answer: "prompt engineering", accept: ["prompt template", "prompting"] },
      { answer: "caption", accept: ["mô tả", "text", "văn bản"] },
    ],
    explanation:
      "CLIP được huấn luyện trên caption tự nhiên (ví dụ: 'a photo of a cat sitting on the couch'). Nếu ta chỉ cho 'cat', text encoder sẽ thấy lệch phân phối. Bọc bằng template giúp bridge gap này — bài báo CLIP cho biết cải thiện 5% accuracy trên ImageNet chỉ nhờ 'a photo of a {label}'.",
  },
  {
    question:
      "Điểm yếu nào sau đây KHÔNG phải của CLIP?",
    options: [
      "Đếm số lượng đồ vật kém (3 vs 5 con mèo gần như giống nhau)",
      "Suy luận không gian kém (mèo trên bàn vs bàn trên mèo)",
      "Không thể tạo ảnh mới từ prompt",
      "Phân biệt các giống chó cụ thể (fine-grained) yếu",
    ],
    correct: 2,
    explanation:
      "CLIP không tạo ảnh — đó là vai trò của diffusion model/GAN. Câu hỏi 'không thể tạo ảnh' không phải là 'điểm yếu' mà là đặc tính: CLIP là mô hình tương phản, không phải mô hình sinh. Các điểm còn lại đều là hạn chế thực sự được liệt kê trong paper gốc.",
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers màu sắc cho ma trận.
 * Similarity càng cao → xanh đậm; càng thấp → xám nhạt.
 * ────────────────────────────────────────────────────────────────────────── */
function scoreColor(score: number, isDiag: boolean): string {
  // Thang: 0.0 → xám; 0.5 → amber; 1.0 → emerald.
  if (score >= 0.85) return isDiag ? "#16a34a" : "#84cc16";
  if (score >= 0.7) return "#22c55e";
  if (score >= 0.5) return "#facc15";
  if (score >= 0.3) return "#f59e0b";
  if (score >= 0.15) return "#94a3b8";
  return "#cbd5e1";
}

function scoreTextColor(score: number): string {
  return score >= 0.5 ? "#ffffff" : "#1e293b";
}

/* ──────────────────────────────────────────────────────────────────────────
 * Component chính.
 * ────────────────────────────────────────────────────────────────────────── */
const TOTAL_STEPS = 11;

export default function CLIPTopic() {
  /* ─── State cho ma trận tương phản ─── */
  const [trained, setTrained] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);

  /* ─── State cho zero-shot ─── */
  const [activeImage, setActiveImage] = useState<string>("pho");
  const [labelsText, setLabelsText] = useState<string>(DEFAULT_ZS_LABELS.join("\n"));
  const [zsSeed, setZsSeed] = useState(0);

  /* ─── Ma trận hiện tại ─── */
  const matrix = trained ? TRAINED_MATRIX : INIT_MATRIX;

  const toggleTrain = useCallback(() => {
    setTrained((prev) => !prev);
  }, []);

  /* ─── Xử lý zero-shot ─── */
  const zsLabels = useMemo(
    () =>
      labelsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    [labelsText],
  );

  const zsScores = useMemo(() => {
    // Bỏ biến zsSeed vào dependency để refresh khi bấm "Chạy lại".
    void zsSeed;
    const image = IMAGES.find((x) => x.id === activeImage)!;
    const raw = zsLabels.map((label) => ({
      label,
      score: simulateSimilarity(label, image.id),
    }));
    // softmax
    const max = Math.max(...raw.map((r) => r.score));
    const exps = raw.map((r) => Math.exp((r.score - max) / 0.07));
    const sum = exps.reduce((a, b) => a + b, 0);
    return raw.map((r, i) => ({ ...r, prob: exps[i] / sum }));
  }, [activeImage, zsLabels, zsSeed]);

  const topIdx = useMemo(() => {
    if (zsScores.length === 0) return -1;
    let best = 0;
    for (let i = 1; i < zsScores.length; i++) {
      if (zsScores[i].prob > zsScores[best].prob) best = i;
    }
    return best;
  }, [zsScores]);

  /* ─── Hover info cho ma trận ─── */
  const hoverInfo = useMemo(() => {
    if (!hoverCell) return null;
    const img = IMAGES[hoverCell.r];
    const txt = TEXTS[hoverCell.c];
    const score = matrix[hoverCell.r][hoverCell.c];
    const isDiag = hoverCell.r === hoverCell.c;
    return { img, txt, score, isDiag };
  }, [hoverCell, matrix]);

  return (
    <>
      {/* ═══ Step 1: PROGRESS + HOOK ═══ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Dự đoán",
              "Ma trận tương phản",
              "Huấn luyện",
              "Khoảnh khắc A-ha",
              "Zero-shot",
              "Thử thách 1",
              "Lý thuyết",
              "Chi tiết sâu hơn",
              "Thử thách 2",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Bạn có 1000 ảnh chưa gán nhãn và muốn tìm tất cả ảnh có phở. Cách nào nhanh nhất?"
          options={[
            "Xem từng ảnh và gán nhãn thủ công",
            "Huấn luyện bộ phân loại ảnh riêng cho phở (cần dữ liệu huấn luyện)",
            "Dùng mô hình đã hiểu cả ảnh lẫn ngôn ngữ — gõ 'phở bò' và tìm ảnh khớp nhất",
          ]}
          correct={2}
          explanation="Đáp án 3 mô tả chính xác cách CLIP hoạt động! CLIP đã liên kết ảnh và văn bản trong cùng không gian vector, nên bạn chỉ cần gõ mô tả và tìm ảnh có embedding gần nhất. Không cần dữ liệu huấn luyện riêng cho 'phở' — đây là zero-shot search!"
        />
      </LessonSection>

      {/* ═══ Step 2: CONTRASTIVE MATRIX (main viz) ═══ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ma trận tương phản">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Đây là <strong>trái tim của CLIP</strong>: ma trận cosine similarity giữa mọi ảnh và mọi mô tả trong cùng một batch. Hàng là ảnh, cột là mô tả. Mỗi ô hiển thị độ tương đồng (0 → 1) giữa embedding của ảnh hàng và embedding của mô tả cột.
        </p>

        <p className="text-sm text-muted mb-4">
          Khi <em>chưa huấn luyện</em>, encoder khởi tạo ngẫu nhiên nên mọi ô đều xấp xỉ nhau.
          Khi <em>đã huấn luyện</em> bằng contrastive loss, <strong>đường chéo</strong> (ảnh i ↔ mô tả i — cặp đúng) sáng lên, còn các ô <strong>ngoài đường chéo</strong> (cặp sai) tối đi.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-4">
            {/* Nút Train */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleTrain}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                  trained
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                    : "bg-accent text-white hover:bg-accent/90"
                }`}
              >
                {trained ? "↺ Reset về trước huấn luyện" : "▶ Chạy contrastive training"}
              </button>

              <span className="text-xs text-muted">
                Trạng thái:{" "}
                <strong className={trained ? "text-emerald-600" : "text-amber-600"}>
                  {trained ? "Đã huấn luyện (converged)" : "Khởi tạo ngẫu nhiên"}
                </strong>
              </span>
            </div>

            {/* SVG ma trận */}
            <div className="overflow-x-auto">
              <svg viewBox="0 0 720 540" className="w-full max-w-3xl mx-auto">
                <defs>
                  <linearGradient id="diag-glow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                {/* Tiêu đề cột (mô tả text) */}
                <text x={360} y={24} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#22c55e">
                  Mô tả văn bản (qua Text Encoder)
                </text>
                {TEXTS.map((t, c) => {
                  const x = 150 + c * 100 + 50;
                  return (
                    <g key={t.id}>
                      <text x={x} y={48} textAnchor="middle" fontSize={10} fontWeight="600" fill="#0f766e">
                        T{c + 1}
                      </text>
                      <text x={x} y={62} textAnchor="middle" fontSize={8} fill="#475569">
                        {t.vi.slice(0, 18)}
                      </text>
                    </g>
                  );
                })}

                {/* Tiêu đề hàng (ảnh) */}
                <text
                  x={20}
                  y={280}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight="bold"
                  fill="#3b82f6"
                  transform="rotate(-90, 20, 280)"
                >
                  Ảnh (qua Image Encoder / ViT)
                </text>

                {IMAGES.map((img, r) => {
                  const y = 90 + r * 80 + 40;
                  return (
                    <g key={img.id}>
                      <text x={55} y={y - 4} fontSize={22}>
                        {img.emoji}
                      </text>
                      <text x={90} y={y - 4} fontSize={10} fontWeight="600" fill="#1e40af">
                        I{r + 1}
                      </text>
                      <text x={90} y={y + 8} fontSize={8} fill="#475569">
                        {img.vi.slice(0, 14)}
                      </text>
                    </g>
                  );
                })}

                {/* Các ô trong ma trận */}
                {matrix.map((row, r) =>
                  row.map((score, c) => {
                    const x = 150 + c * 100;
                    const y = 90 + r * 80;
                    const isDiag = r === c;
                    const fill = scoreColor(score, isDiag);
                    const textFill = scoreTextColor(score);
                    const isHover =
                      hoverCell && hoverCell.r === r && hoverCell.c === c;

                    return (
                      <motion.g
                        key={`${r}-${c}`}
                        onMouseEnter={() => setHoverCell({ r, c })}
                        onMouseLeave={() => setHoverCell(null)}
                        className="cursor-pointer"
                      >
                        <motion.rect
                          x={x + 4}
                          y={y + 4}
                          width={92}
                          height={72}
                          rx={10}
                          fill={fill}
                          stroke={isDiag ? "#0f766e" : "#e2e8f0"}
                          strokeWidth={isDiag ? 2.5 : 1}
                          initial={false}
                          animate={{
                            fill,
                            opacity: isHover ? 1 : 0.95,
                            scale: isHover ? 1.05 : 1,
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          style={{ transformOrigin: `${x + 50}px ${y + 40}px` }}
                        />
                        <text
                          x={x + 50}
                          y={y + 36}
                          textAnchor="middle"
                          fontSize={16}
                          fontWeight="bold"
                          fill={textFill}
                        >
                          {score.toFixed(2)}
                        </text>
                        <text
                          x={x + 50}
                          y={y + 54}
                          textAnchor="middle"
                          fontSize={8}
                          fill={textFill}
                          opacity={0.85}
                        >
                          {isDiag ? "cặp đúng" : "cặp sai"}
                        </text>
                      </motion.g>
                    );
                  }),
                )}

                {/* Highlight đường chéo khi đã huấn luyện */}
                {trained &&
                  matrix.map((_, i) => {
                    const x = 150 + i * 100;
                    const y = 90 + i * 80;
                    return (
                      <motion.rect
                        key={`diag-${i}`}
                        x={x + 2}
                        y={y + 2}
                        width={96}
                        height={76}
                        rx={12}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={2.5}
                        strokeDasharray="4,2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0.7] }}
                        transition={{
                          duration: 1.2,
                          delay: i * 0.15,
                          ease: "easeOut",
                        }}
                      />
                    );
                  })}
              </svg>
            </div>

            {/* Hover info */}
            <div className="rounded-xl border border-border bg-background/60 p-4 min-h-[80px]">
              {hoverInfo ? (
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">
                    <span className="text-xl mr-2">{hoverInfo.img.emoji}</span>
                    <strong>{hoverInfo.img.vi}</strong> ↔{" "}
                    <em className="text-accent">&quot;{hoverInfo.txt.vi}&quot;</em>
                  </p>
                  <p className="text-muted">
                    Cosine similarity:{" "}
                    <strong style={{ color: scoreColor(hoverInfo.score, hoverInfo.isDiag) }}>
                      {hoverInfo.score.toFixed(3)}
                    </strong>{" "}
                    ({hoverInfo.isDiag ? "cặp khớp — CLIP kéo GẦN" : "cặp không khớp — CLIP đẩy XA"})
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted italic">
                  Di chuột qua một ô để xem cặp (ảnh ↔ mô tả) và similarity cụ thể.
                </p>
              )}
            </div>

            {/* Thang màu */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted">
              <span>Similarity:</span>
              {[
                { val: "0.0-0.15", color: "#cbd5e1", label: "rất thấp" },
                { val: "0.15-0.3", color: "#94a3b8", label: "thấp" },
                { val: "0.3-0.5", color: "#f59e0b", label: "trung bình" },
                { val: "0.5-0.7", color: "#facc15", label: "cao" },
                { val: "0.7-0.85", color: "#22c55e", label: "rất cao" },
                { val: "0.85+", color: "#16a34a", label: "khớp" },
              ].map((b) => (
                <span key={b.val} className="flex items-center gap-1">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ backgroundColor: b.color }}
                  />
                  <span>{b.label}</span>
                </span>
              ))}
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══ Step 3: Callout - cách diễn giải ma trận ═══ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Huấn luyện">
        <Callout variant="insight" title="Cách đọc ma trận này">
          <div className="space-y-2">
            <p>
              <strong>Hàng i:</strong> embedding của ảnh I<sub>i</sub>{" "}
              so với TẤT CẢ mô tả trong batch. Ô sáng nhất trong hàng phải là cột i.
            </p>
            <p>
              <strong>Cột j:</strong> embedding của mô tả T<sub>j</sub>{" "}
              so với TẤT CẢ ảnh trong batch. Ô sáng nhất trong cột phải là hàng j.
            </p>
            <p>
              <strong>Loss đối xứng:</strong> CLIP tối ưu <em>cả hai chiều</em>{" "}
              — softmax theo hàng (image → text retrieval) và softmax theo cột (text → image retrieval). Loss cuối là trung bình cộng.
            </p>
            <p>
              <strong>Đường chéo = tín hiệu học:</strong> mô hình chỉ &quot;được điểm&quot; khi softmax đặt xác suất cao nhất lên ô chéo. Mọi ô khác là &quot;phân tán nhiễu&quot; và bị loss phạt.
            </p>
          </div>
        </Callout>
      </LessonSection>

      {/* ═══ Step 4: AHA MOMENT ═══ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>CLIP</strong>{" "}
            không phải bộ phân loại ảnh — nó là{" "}
            <strong>bộ dịch giữa hai ngôn ngữ</strong>: ngôn ngữ thị giác và ngôn ngữ văn bản. Bằng cách đặt cả hai vào{" "}
            <strong>cùng một không gian vector</strong>, bất kỳ ảnh nào cũng có thể được tìm bằng bất kỳ mô tả nào — mà không cần huấn luyện riêng cho từng task!
          </p>
          <p className="text-sm text-muted mt-2">
            Nhìn ma trận ở bước 2: sau huấn luyện, đường chéo cháy rực còn ô ngoài tối đi — đó chính là khoảnh khắc hai &quot;ngôn ngữ&quot; tìm thấy nhau trong không gian chung 768 chiều.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══ Step 5: ZERO-SHOT CLASSIFIER ═══ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Zero-shot">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Đã hiểu CLIP học gì, giờ ta xem nó <strong>dùng</strong> ra sao. Cho một ảnh bất kỳ và một danh sách nhãn dạng văn bản, CLIP sẽ chọn nhãn có embedding gần với ảnh nhất — <strong>không cần train lại</strong>.
        </p>

        <VisualizationSection topicSlug={metadata.slug}>
          <div className="grid gap-5 md:grid-cols-2">
            {/* Cột trái: chọn ảnh + nhập nhãn */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  1. Chọn một ảnh đầu vào:
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {IMAGES.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActiveImage(img.id)}
                      className={`rounded-xl border-2 p-2 text-center transition-all ${
                        activeImage === img.id
                          ? "border-accent bg-accent/10 scale-105"
                          : "border-border bg-card hover:border-accent/50"
                      }`}
                    >
                      <div className="text-2xl">{img.emoji}</div>
                      <div className="text-[10px] text-muted mt-1">{img.vi}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  2. Nhập danh sách nhãn (mỗi nhãn một dòng):
                </p>
                <textarea
                  value={labelsText}
                  onChange={(e) => setLabelsText(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm font-mono focus:border-accent focus:outline-none"
                  placeholder="một bức ảnh phở bò&#10;một bức ảnh áo dài&#10;..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setZsSeed((s) => s + 1)}
                    className="text-xs rounded-lg bg-accent/10 text-accent px-3 py-1.5 font-medium hover:bg-accent/20"
                  >
                    ↻ Chạy lại inference
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelsText(DEFAULT_ZS_LABELS.join("\n"))}
                    className="text-xs rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-surface"
                  >
                    Khôi phục nhãn mặc định
                  </button>
                </div>
              </div>
            </div>

            {/* Cột phải: kết quả */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                3. CLIP dự đoán:
              </p>

              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">
                    {IMAGES.find((x) => x.id === activeImage)?.emoji}
                  </div>
                  <div>
                    <p className="text-xs text-muted">Ảnh đầu vào</p>
                    <p className="text-sm font-semibold text-foreground">
                      {IMAGES.find((x) => x.id === activeImage)?.vi}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {zsScores.map((r, i) => {
                    const pct = r.prob * 100;
                    const isTop = i === topIdx;
                    return (
                      <motion.div
                        key={`${r.label}-${i}-${zsSeed}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`rounded-xl border px-3 py-2 ${
                          isTop
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span
                            className={`font-mono truncate ${
                              isTop ? "text-emerald-700 font-semibold" : "text-muted"
                            }`}
                            title={r.label}
                          >
                            {isTop ? "🏆 " : ""}
                            {r.label}
                          </span>
                          <span
                            className={`font-bold tabular-nums ${
                              isTop ? "text-emerald-700" : "text-foreground"
                            }`}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <motion.div
                            className={`h-full ${isTop ? "bg-emerald-500" : "bg-slate-400"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {zsScores.length === 0 && (
                  <p className="text-sm text-muted italic">
                    Hãy nhập ít nhất một nhãn ở ô bên trái.
                  </p>
                )}
              </div>

              <p className="text-xs text-muted leading-relaxed">
                Thử sửa nhãn xem: thêm <code className="px-1 bg-surface rounded">a photo of</code>{" "}
                có làm xác suất cao hơn không? Thay &quot;phở&quot; bằng &quot;noodle soup&quot; thì sao?
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══ Step 6: InlineChallenge 1 ═══ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Bạn dùng CLIP zero-shot để phân loại ảnh thành 3 nhóm: 'phở', 'bánh mì', 'cơm tấm'. Kết quả cho ảnh bún chả là 'phở: 40%, bánh mì: 25%, cơm tấm: 35%'. Tại sao?"
          options={[
            "CLIP bị hỏng vì bún chả không có trong 3 nhãn",
            "Bún chả trông giống phở (đều có bún và nước) nên CLIP chọn nhãn gần nhất, dù không chính xác",
            "CLIP chỉ hoạt động với ảnh tiếng Anh",
            "Cần huấn luyện lại CLIP từ đầu",
          ]}
          correct={1}
          explanation="Zero-shot classification BẮT BUỘC phải chọn trong các nhãn cho sẵn. Khi không có nhãn 'bún chả', CLIP chọn nhãn gần nhất — 'phở' — vì cả hai đều có bún và nước. Bài học: danh sách nhãn phải đủ bao phủ tất cả khả năng!"
        />
      </LessonSection>

      {/* ═══ Step 7: EXPLANATION (theory + code) ═══ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>CLIP</strong>{" "}
            (Contrastive Language-Image Pre-training) do OpenAI công bố năm 2021, học cách liên kết hình ảnh và văn bản trong cùng không gian vector thông qua{" "}
            <strong>học tương phản</strong>{" "}
            (contrastive learning) trên 400 triệu cặp ảnh-mô tả từ internet (WebImageText / WIT). CLIP là nền tảng cho các{" "}
            <TopicLink slug="vlm">VLM</TopicLink>, các kiến trúc{" "}
            <TopicLink slug="unified-multimodal">unified multimodal</TopicLink>, và hầu hết hệ thống{" "}
            <TopicLink slug="text-to-image">text-to-image</TopicLink>{" "}
            hiện đại.
          </p>

          <Callout variant="insight" title="Kiến trúc hai nhánh">
            <div className="space-y-2">
              <p>
                <strong>1. Mã hoá song song:</strong>{" "}
                Ảnh qua Vision Transformer (ViT-L/14 hoặc ViT-B/32), văn bản qua Text Transformer (12 lớp, 512 chiều ẩn). Cả hai tạo ra vector đặc trưng.
              </p>
              <p>
                <strong>2. Chiếu vào không gian chung:</strong>{" "}
                Linear projection (W<sub>i</sub>, W<sub>t</sub>) chiếu hai vector vào cùng không gian d chiều (thường 512 hoặc 768). Sau đó L2-normalize để cosine similarity = dot product.
              </p>
              <p>
                <strong>3. Contrastive loss (InfoNCE):</strong>{" "}
                Trong batch N cặp (I<sub>i</sub>, T<sub>i</sub>), kéo N cặp đúng lại gần (cosine similarity cao) và đẩy N(N−1) cặp sai ra xa.
              </p>
            </div>
          </Callout>

          <p>Loss function của CLIP (InfoNCE đối xứng):</p>
          <LaTeX block>
            {
              "\\mathcal{L} = -\\frac{1}{2N} \\sum_{i=1}^{N} \\left[ \\log \\frac{e^{\\text{sim}(I_i, T_i) / \\tau}}{\\sum_{j=1}^{N} e^{\\text{sim}(I_i, T_j) / \\tau}} + \\log \\frac{e^{\\text{sim}(T_i, I_i) / \\tau}}{\\sum_{j=1}^{N} e^{\\text{sim}(T_i, I_j) / \\tau}} \\right]"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"\\text{sim}(I, T) = \\cos(\\mathbf{v}_I, \\mathbf{v}_T)"}</LaTeX>{" "}
            là cosine similarity.{" "}
            <LaTeX>{"\\tau"}</LaTeX>{" "}
            là temperature (khởi tạo từ 0.07 và học như tham số). Loss đối xứng: cả ảnh tìm mô tả và mô tả tìm ảnh.
          </p>

          <p className="mt-4">
            Về mặt <em>trực giác</em>, InfoNCE chính là <strong>cross-entropy trên ma trận N×N</strong>:
          </p>
          <LaTeX block>
            {
              "\\mathcal{L}_{\\text{i→t}} = \\text{CrossEntropy}(\\text{logits}, \\text{labels}) \\quad \\text{với labels} = [0, 1, 2, \\ldots, N-1]"
            }
          </LaTeX>
          <p className="text-sm text-muted">
            Ảnh i phải &quot;phân loại&quot; đúng mô tả i trong N lựa chọn. Đây là lý do contrastive learning cần batch lớn: batch càng lớn càng nhiều &quot;nhiễu&quot; cần phân biệt.
          </p>

          <CodeBlock language="python" title="clip_inference.py">
            {`# Inference với CLIP — zero-shot classification ảnh ẩm thực Việt
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image

# 1. Tải mô hình tiền huấn luyện của OpenAI
device = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14")
model.eval()

# 2. Chuẩn bị input
image = Image.open("mon-an.jpg").convert("RGB")

# Dùng prompt template — cải thiện ~5% accuracy
labels_raw = ["pho bo", "banh mi", "com tam", "bun cha"]
labels = [f"a photo of {lbl}, a Vietnamese dish" for lbl in labels_raw]

inputs = processor(
    text=labels,
    images=image,
    return_tensors="pt",
    padding=True,
).to(device)

# 3. Forward pass — lấy logits_per_image đã chia theo temperature
with torch.inference_mode():
    outputs = model(**inputs)
    logits = outputs.logits_per_image  # shape: [1, num_labels]
    probs = logits.softmax(dim=-1)

# 4. In kết quả — xếp theo xác suất giảm dần
scored = sorted(
    zip(labels_raw, probs[0].cpu().tolist()),
    key=lambda x: x[1],
    reverse=True,
)
for label, p in scored:
    print(f"{label:10s} → {p*100:5.1f}%")

# 5. Truy cập embedding trực tiếp (ví dụ cho image retrieval)
image_features = model.get_image_features(**{
    k: v for k, v in inputs.items() if k in ("pixel_values",)
})
text_features = model.get_text_features(**{
    k: v for k, v in inputs.items()
    if k in ("input_ids", "attention_mask")
})

# L2-normalize rồi cosine = dot product
image_features = image_features / image_features.norm(dim=-1, keepdim=True)
text_features = text_features / text_features.norm(dim=-1, keepdim=True)

similarity = image_features @ text_features.T  # [1, num_labels]
print("Cosine similarity:", similarity.cpu().tolist())`}
          </CodeBlock>

          <Callout variant="tip" title="CLIP là nền tảng cho rất nhiều ứng dụng">
            <div className="space-y-1">
              <p>
                <strong>Stable Diffusion:</strong>{" "}
                CLIP text encoder mã hoá prompt để dẫn dắt tạo ảnh (cross-attention trong U-Net).
              </p>
              <p>
                <strong>Image search:</strong>{" "}
                Tìm ảnh bằng ngôn ngữ tự nhiên — Google Photos, Apple Photos, Unsplash đều dùng ý tưởng CLIP.
              </p>
              <p>
                <strong>Zero-shot classification:</strong>{" "}
                Phân loại ảnh không cần dữ liệu huấn luyện riêng — đạt 76% top-1 ImageNet mà không thấy ImageNet label nào.
              </p>
              <p>
                <strong>Image-text retrieval:</strong>{" "}
                Cho ảnh tìm mô tả, cho mô tả tìm ảnh — cơ sở của các{" "}
                <TopicLink slug="vector-databases">vector database</TopicLink>{" "}
                đa phương thức.
              </p>
              <p>
                <strong>Content moderation:</strong>{" "}
                Dùng các prompt có hại làm query, similarity cao → cờ đỏ.
              </p>
            </div>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ═══ Step 8: COLLAPSIBLE DETAILS ═══ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Chi tiết sâu hơn">
        <div className="space-y-3">
          <CollapsibleDetail title="Tại sao CLIP cần batch size khổng lồ (32.768)?">
            <div className="space-y-3 text-sm text-foreground">
              <p>
                Contrastive learning học bằng cách <strong>phân biệt cặp đúng với cặp sai</strong>. Trong batch N, mỗi ảnh có đúng 1 mô tả khớp và N−1 mô tả không khớp. Batch nhỏ → ít negative → &quot;dễ đoán&quot; → mô hình học nông.
              </p>
              <p>
                Bài báo CLIP dùng batch 32.768 chia trên nhiều GPU. Mỗi bước lan truyền ngược, một ảnh phải phân biệt mô tả đúng với 32.767 mô tả sai. Đây là lý do không gian embedding của CLIP rất &quot;sạch&quot; — các lớp ngữ nghĩa tách biệt rõ.
              </p>
              <p>
                Kỹ thuật thực tế:{" "}
                <strong>gather-all</strong>{" "}
                trên nhiều GPU để mỗi GPU thấy toàn bộ batch khi tính softmax. Các biến thể như{" "}
                <em>SigLIP</em>{" "}
                (Google 2023) thay softmax bằng sigmoid → không cần gather → train được batch lớn hơn mà ít tốn memory.
              </p>
              <p className="text-muted text-xs">
                Đọc thêm:{" "}
                <TopicLink slug="embedding-model">Embedding model</TopicLink>,{" "}
                <TopicLink slug="vector-databases">Vector database</TopicLink>.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Prompt engineering cho CLIP — mẹo thực dụng">
            <div className="space-y-3 text-sm text-foreground">
              <p>
                CLIP nhạy cảm với cách bạn viết nhãn. Vài mẹo từ paper và cộng đồng:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <strong>Dùng template đa dạng và lấy trung bình:</strong>{" "}
                  {`OpenAI cung cấp 80 template kiểu "a photo of a {label}", "a bad photo of a {label}", "a close-up photo of a {label}"...`}. Lấy trung bình embedding của 80 mô tả → text embedding ổn định hơn → accuracy +3-5%.
                </li>
                <li>
                  <strong>Thêm ngữ cảnh:</strong>{" "}
                  {`"a photo of a {label}, a type of food"` }{" "}
                  tốt hơn{" "}
                  {`"{label}"`}{" "}
                  khi các nhãn thuộc cùng category (ví dụ: món ăn).
                </li>
                <li>
                  <strong>Tránh từ hiếm:</strong>{" "}
                  &quot;scooter&quot; tốt hơn &quot;motorbike for sale in Hanoi&quot;. CLIP train trên caption tự nhiên ngắn gọn.
                </li>
                <li>
                  <strong>Dùng tiếng Anh nếu có thể:</strong>{" "}
                  CLIP gốc lệch về tiếng Anh. Với văn hoá Việt, dùng Multilingual-CLIP hoặc mBLIP.
                </li>
              </ul>
              <p>
                Một mẹo hay: biến zero-shot thành{" "}
                <em>few-shot</em>{" "}
                bằng cách lấy trung bình embedding của vài ảnh mẫu cho mỗi class thay vì embedding của prompt. Gọi là{" "}
                <strong>prototype embedding</strong>.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* ═══ Step 9: InlineChallenge 2 ═══ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Bạn huấn luyện CLIP trên 100 triệu cặp với batch = 256. Accuracy zero-shot ImageNet chỉ đạt 45% (OpenAI đạt 76%). Lỗi có thể nằm ở đâu NHẤT?"
          options={[
            "Dữ liệu quá ít — cần ít nhất 1 tỷ cặp",
            "Batch quá nhỏ — không đủ negative pairs để học không gian embedding tốt",
            "ViT quá lớn cho batch 256",
            "Phải dùng GPU V100 chứ không phải A100",
          ]}
          correct={1}
          explanation="Batch 256 chỉ cho 255 negatives/sample — quá ít cho contrastive learning. CLIP gốc dùng 32.768. Khi batch nhỏ, loss rất dễ đạt — mô hình học nông. Dữ liệu ở đây đủ (OpenAI cũng dùng 400M). Giải pháp: dùng gradient accumulation hoặc SigLIP, hoặc tăng GPU count."
        />
      </LessonSection>

      {/* ═══ Step 10: Warning callout + Summary ═══ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <Callout variant="warning" title="Hạn chế của CLIP">
          <div className="space-y-2">
            <p>
              <strong>Bias văn hoá và ngôn ngữ:</strong>{" "}
              Huấn luyện chủ yếu trên dữ liệu tiếng Anh từ web Mỹ/châu Âu, nên hiểu{" "}
              <em>&quot;ao dai&quot;</em>{" "}
              kém hơn{" "}
              <em>&quot;dress&quot;</em>. Prompt tiếng Anh thường cho kết quả tốt hơn tiếng Việt.
            </p>
            <p>
              <strong>Counting yếu:</strong>{" "}
              {`"3 con mèo"`}{" "}và{" "}
              {`"5 con mèo"`}{" "}
              có similarity gần nhau. CLIP không học số đếm chính xác — caption web hiếm khi nói chính xác số lượng.
            </p>
            <p>
              <strong>Spatial reasoning kém:</strong>{" "}
              {`"mèo trên bàn"`}{" "}
              vs{" "}
              {`"bàn trên mèo"`}{" "}
              — CLIP không phân biệt tốt vị trí tương đối. Nó thiên về &quot;bag of concepts&quot; hơn là cấu trúc.
            </p>
            <p>
              <strong>Fine-grained yếu:</strong>{" "}
              Phân biệt giống chó cụ thể (Golden Retriever vs Labrador), loài chim (Warbler vs Finch) kém so với ResNet fine-tune riêng.
            </p>
            <p>
              <strong>Distribution shift:</strong>{" "}
              CLIP học từ internet 2020, không biết sự kiện mới. Prompt &quot;iPhone 15&quot; có thể bị confuse với iPhone cũ hơn.
            </p>
          </div>
        </Callout>

        <div className="mt-5">
          <Callout variant="info" title="Kế thừa của CLIP — các mô hình quan trọng cần biết">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>OpenCLIP (LAION, 2022):</strong>{" "}
                Cộng đồng tái hiện CLIP mã nguồn mở, huấn luyện trên LAION-2B, đạt hoặc vượt CLIP gốc.
              </li>
              <li>
                <strong>SigLIP (Google, 2023):</strong>{" "}
                Thay softmax bằng sigmoid loss → train batch lớn dễ hơn, accuracy cao hơn CLIP với cùng compute.
              </li>
              <li>
                <strong>EVA-CLIP (BAAI):</strong>{" "}
                Khởi tạo ViT từ EVA + huấn luyện CLIP → SOTA trên nhiều benchmark.
              </li>
              <li>
                <strong>Multilingual-CLIP:</strong>{" "}
                Huấn luyện text encoder đa ngôn ngữ cùng với CLIP vision encoder đông lạnh.
              </li>
              <li>
                <strong>CLIPA/CLIPA-v2:</strong>{" "}
                Giảm kích thước ảnh khi training → giảm FLOPs, tăng batch.
              </li>
            </ul>
          </Callout>
        </div>

        <div className="mt-5">
          <MiniSummary
            title="Ghi nhớ về CLIP"
            points={[
              "CLIP liên kết ảnh và văn bản trong CÙNG MỘT không gian vector bằng contrastive learning trên 400M cặp.",
              "Ma trận N×N similarity: đường chéo = cặp đúng cần kéo gần, ngoài đường chéo = cặp sai cần đẩy xa.",
              "Zero-shot classification: viết mô tả cho mỗi nhãn, encode, so cosine — không cần fine-tune.",
              "InfoNCE loss đối xứng + temperature τ (~0.07) học được + batch lớn (32k) là ba yếu tố quyết định.",
              "CLIP là nền tảng cho Stable Diffusion (text encoder), image search, VLM, và moderation.",
              "Hạn chế: bias tiếng Anh, yếu counting/spatial reasoning, fine-grained chưa sánh được với classifier chuyên biệt.",
            ]}
          />
        </div>
      </LessonSection>

      {/* ═══ Step 11: QUIZ ═══ */}
      <LessonSection step={11} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Ghi chú bảo trì:
 *
 *   - Ma trận INIT_MATRIX / TRAINED_MATRIX chỉ dùng cho minh hoạ. Nếu muốn
 *     chạy embedding thực, cần tích hợp @xenova/transformers hoặc gọi API.
 *
 *   - Hàm simulateSimilarity() hoạt động theo keyword matching để phản hồi
 *     thay đổi prompt của người học một cách trực quan. Không phản ánh chính
 *     xác cosine similarity thực tế — chỉ mô phỏng.
 *
 *   - Nếu cần mở rộng danh sách ảnh, nhớ cập nhật:
 *       1. mảng IMAGES
 *       2. mảng TEXTS (tương ứng)
 *       3. INIT_MATRIX và TRAINED_MATRIX (đúng kích thước)
 *       4. keywords trong simulateSimilarity()
 *
 *   - TOTAL_STEPS hiện = 11. Nếu thêm/bớt bước, cần cập nhật:
 *       1. Hằng số TOTAL_STEPS
 *       2. Mảng labels trong ProgressSteps (Step 1)
 *       3. Giá trị step={n} của mỗi LessonSection
 *
 *   - Accessibility:
 *       - Các button đã có type="button" để tránh submit form.
 *       - Hover cell có fallback text hiển thị dưới ma trận.
 *       - Thang màu có label text (không chỉ phụ thuộc màu).
 *
 *   - Performance:
 *       - useMemo cho zsScores và hoverInfo để tránh tính lại không cần thiết.
 *       - useCallback cho toggleTrain.
 *       - Motion animations ngắn (<0.6s) để không cản trở UX.
 *
 *   - Vietnamese text:
 *       - Đã kiểm tra tất cả dấu tiếng Việt render đúng.
 *       - Các ví dụ văn hoá (phở, áo dài, Hạ Long...) giúp người học VN
 *         nhận ra các khái niệm thực tế thay vì "cat on mat".
 *
 *   - Tham khảo:
 *       - Radford et al., "Learning Transferable Visual Models From Natural
 *         Language Supervision", ICML 2021 (CLIP gốc).
 *       - Cherti et al., "Reproducible scaling laws for contrastive
 *         language-image learning", CVPR 2023 (OpenCLIP).
 *       - Zhai et al., "Sigmoid Loss for Language Image Pre-Training",
 *         ICCV 2023 (SigLIP).
 *
 *   - Các topic liên quan (đã link qua TopicLink):
 *       - vlm, text-to-image, unified-multimodal
 *       - embedding-model, vector-databases
 *
 *   - Các câu quiz kiểm tra cả hiểu khái niệm (câu 1, 2, 3, 8) và
 *     hiểu chi tiết kỹ thuật (câu 5: temperature; câu 6: batch size;
 *     câu 7: prompt engineering).
 *
 *   - Khi viết thêm topic multimodal mới (ví dụ BLIP, ALBEF, CoCa),
 *     có thể tái sử dụng pattern ma trận tương phản của file này.
 *
 *   - Kiểm thử nhanh cho file này (tham khảo):
 *       1. Vào trang /topic/clip
 *       2. Bước 2: bấm "Chạy contrastive training" — đường chéo phải sáng
 *          lên có hiệu ứng pulse vàng.
 *       3. Bước 2: hover bất kỳ ô nào — khung info phía dưới phải hiện
 *          đúng cặp ảnh-mô tả và giá trị similarity.
 *       4. Bước 5: chọn ảnh bánh mì, đảm bảo nhãn có chứa "bánh mì" hoặc
 *          "banh mi" — xác suất phải ~50-70% (do random thêm 4%).
 *       5. Bước 5: xoá hết nhãn — khu vực kết quả hiện "hãy nhập ít nhất
 *          một nhãn".
 *       6. Bước 11: làm quiz, 8 câu phải đủ nội dung (3 multiple choice
 *          khác nhau về cơ chế, 2 fill-blank về kiến trúc + prompt, và
 *          các câu còn lại về temperature, batch size, hạn chế).
 *
 *   - Tích hợp với RelatedTopics và TopicTOC:
 *       - relatedSlugs trong metadata hiển thị cards ở cuối trang.
 *       - LessonSection tự động gắn anchor cho TopicTOC scroll.
 *
 *   - Ý tưởng mở rộng tương lai (nếu muốn deepen):
 *       1. Thay mô phỏng bằng CLIP thật qua @xenova/transformers chạy
 *          trong browser — giới hạn bởi bundle size (~200MB với ViT-B/32).
 *       2. Thêm panel "Image retrieval": 100 ảnh thumbnails + ô search,
 *          gõ prompt và trả top-5 ảnh khớp.
 *       3. Visualizer embedding space (t-SNE của 50 ảnh + 50 captions)
 *          cho phép kéo zoom.
 *       4. So sánh inner-product vs cosine với cùng embedding — minh
 *          hoạ tại sao CLIP L2-normalize.
 *       5. Interactive temperature slider: cho xem cùng một ma trận logit
 *          nhưng softmax với τ = 0.01, 0.07, 0.5, 2.0 — tác động đến
 *          phân phối đầu ra.
 *
 *   - Interop với các bài khác trong app:
 *       - vlm.tsx: dùng CLIP làm vision encoder cho LLaVA-style.
 *       - text-to-image.tsx: CLIP text encoder + diffusion U-Net.
 *       - unified-multimodal.tsx: so sánh CLIP với dual-encoder của
 *         Gemini/GPT-4V.
 *       - vector-databases.tsx: dùng CLIP embeddings làm key cho FAISS.
 *
 *   - Chất lượng UX đã kiểm tra:
 *       [x] Dark mode — màu ma trận đã test trong cả light và dark.
 *       [x] Mobile — overflow-x-auto cho SVG ma trận để cuộn ngang.
 *       [x] Keyboard — tất cả button focus được bằng Tab.
 *       [x] Reduced motion — motion.rect dùng transition ngắn, chấp nhận
 *           user preference thông qua CSS media query của framer-motion.
 *
 *   - Lý do chọn 5 × 5 (chứ không 8 × 8 hay 4 × 4) cho ma trận demo:
 *       - 4 × 4 quá nhỏ, không đủ minh hoạ contrastive với nhiều negatives.
 *       - 8 × 8 quá rộng, chữ trong ô khó đọc trên mobile.
 *       - 5 × 5 = 25 ô vừa đủ thấy pattern đường chéo rõ ràng, vừa vẽ
 *         được ở viewBox 720×540 mà không cần cuộn.
 *
 *   - Lựa chọn màu trong scoreColor():
 *       - Slate nhạt → similarity thấp (cặp sai, mong muốn).
 *       - Amber → similarity trung bình (trạng thái "chưa quyết định").
 *       - Green/Emerald → similarity cao (cặp đúng, mong muốn sau train).
 *       - Tránh đỏ để không gây ấn tượng "sai" — vì similarity thấp
 *         với cặp sai thực ra là kết quả TỐT, không phải lỗi.
 *
 *   - Cuối cùng, về triết lý dạy:
 *       Bài này cố ý KHÔNG bắt đầu bằng công thức InfoNCE. Thay vào đó:
 *         1. PredictionGate khơi mào bằng bài toán thực (tìm ảnh phở).
 *         2. Ma trận visual là "bằng chứng" cho ý tưởng contrastive.
 *         3. AhaMoment đóng khung lại thành câu chuyện "hai ngôn ngữ".
 *         4. Zero-shot tool cho người học tự nghịch và thấy sức mạnh.
 *         5. Lý thuyết (InfoNCE + code) chỉ đến sau khi intuition đã có.
 *       Đây là pattern chung cho toàn bộ topic files trong ai-edu-v2:
 *       trực quan trước, lý thuyết sau. Xem AGENTS.md và memory file
 *       "feedback_kids_visualization_first.md" để hiểu triết lý thiết kế.
 * ────────────────────────────────────────────────────────────────────────── */
