"use client";

import { useState, useMemo, useCallback } from "react";
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
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "image-classification",
  title: "Image Classification",
  titleVi: "Phân loại hình ảnh",
  description:
    "Tác vụ gán nhãn danh mục cho toàn bộ hình ảnh, nền tảng của thị giác máy tính hiện đại.",
  category: "computer-vision",
  tags: ["computer-vision", "cnn", "classification"],
  difficulty: "beginner",
  relatedSlugs: ["cnn", "convolution", "feature-extraction-cnn"],
  vizType: "interactive",
};

/* ─────────────────────────────────────────────────────────────
 * DỮ LIỆU: 10 ảnh mẫu với dự đoán top-5 của mô hình
 *
 * Mỗi ảnh có:
 *   - icon: biểu tượng emoji để hiển thị (giả lập thumbnail)
 *   - trueLabel: nhãn đúng (ground truth)
 *   - preds: 5 dự đoán kèm xác suất, sắp xếp giảm dần
 *   - note: ghi chú ngắn giải thích vì sao mô hình dự đoán như vậy
 * ───────────────────────────────────────────────────────────── */
type Prediction = { label: string; prob: number };
type SampleImage = {
  id: string;
  icon: string;
  bgColor: string;
  caption: string;
  trueLabel: string;
  preds: Prediction[];
  note: string;
};

const SAMPLES: SampleImage[] = [
  {
    id: "s1",
    icon: "🏍️",
    bgColor: "#f97316",
    caption: "Xe máy trên phố Hà Nội",
    trueLabel: "Xe máy",
    preds: [
      { label: "Xe máy", prob: 0.92 },
      { label: "Xe đạp", prob: 0.04 },
      { label: "Xe tay ga", prob: 0.02 },
      { label: "Xe đạp điện", prob: 0.01 },
      { label: "Mô-tô thể thao", prob: 0.01 },
    ],
    note: "Dự đoán chắc chắn: xe máy chiếm 80% phương tiện tại Việt Nam, có nhiều trong tập huấn luyện.",
  },
  {
    id: "s2",
    icon: "🐱",
    bgColor: "#a78bfa",
    caption: "Mèo tam thể nằm trên ghế",
    trueLabel: "Mèo",
    preds: [
      { label: "Mèo nhà", prob: 0.78 },
      { label: "Mèo Ba Tư", prob: 0.11 },
      { label: "Báo con", prob: 0.05 },
      { label: "Chó nhỏ", prob: 0.04 },
      { label: "Cáo", prob: 0.02 },
    ],
    note: "Mô hình phân biệt rõ giữa giống mèo; Top-5 bao phủ cả các giống tương tự.",
  },
  {
    id: "s3",
    icon: "🐶",
    bgColor: "#fbbf24",
    caption: "Chó Golden Retriever",
    trueLabel: "Chó",
    preds: [
      { label: "Golden Retriever", prob: 0.84 },
      { label: "Labrador", prob: 0.09 },
      { label: "Chó Poodle", prob: 0.03 },
      { label: "Chó Shiba", prob: 0.02 },
      { label: "Cáo", prob: 0.02 },
    ],
    note: "Lông vàng và đầu rộng là đặc trưng Golden, tách biệt với Labrador nhờ lông dài hơn.",
  },
  {
    id: "s4",
    icon: "🚗",
    bgColor: "#60a5fa",
    caption: "Xe hơi sedan màu xanh",
    trueLabel: "Ô tô",
    preds: [
      { label: "Sedan", prob: 0.71 },
      { label: "Hatchback", prob: 0.14 },
      { label: "SUV", prob: 0.08 },
      { label: "Coupe", prob: 0.04 },
      { label: "Pickup", prob: 0.03 },
    ],
    note: "Top-5 đều thuộc họ 'ô tô con', cho thấy mô hình hiểu cấu trúc phân loại con.",
  },
  {
    id: "s5",
    icon: "🍌",
    bgColor: "#facc15",
    caption: "Chùm chuối chín",
    trueLabel: "Chuối",
    preds: [
      { label: "Chuối", prob: 0.89 },
      { label: "Chuối tây", prob: 0.06 },
      { label: "Ngô", prob: 0.02 },
      { label: "Dưa hấu", prob: 0.02 },
      { label: "Xoài", prob: 0.01 },
    ],
    note: "Hình dáng cong và màu vàng rất đặc trưng, mô hình gần như chắc chắn.",
  },
  {
    id: "s6",
    icon: "🏠",
    bgColor: "#f87171",
    caption: "Nhà cấp 4 ở miền quê",
    trueLabel: "Ngôi nhà",
    preds: [
      { label: "Nhà ở nông thôn", prob: 0.62 },
      { label: "Biệt thự", prob: 0.14 },
      { label: "Nhà kho", prob: 0.11 },
      { label: "Nhà gỗ", prob: 0.08 },
      { label: "Chuồng trại", prob: 0.05 },
    ],
    note: "Top-1 đúng nhưng confidence chỉ 62% — mái ngói và tường trắng khiến mô hình cân nhắc cả 'biệt thự'.",
  },
  {
    id: "s7",
    icon: "🌸",
    bgColor: "#f472b6",
    caption: "Hoa đào nở mùa xuân",
    trueLabel: "Hoa đào",
    preds: [
      { label: "Hoa đào", prob: 0.54 },
      { label: "Hoa anh đào", prob: 0.32 },
      { label: "Hoa mai", prob: 0.06 },
      { label: "Hoa hồng", prob: 0.04 },
      { label: "Hoa tulip", prob: 0.04 },
    ],
    note: "Đào và sakura rất giống nhau về màu và cấu trúc cánh; mô hình dễ nhầm nếu không thấy cành.",
  },
  {
    id: "s8",
    icon: "⚽",
    bgColor: "#34d399",
    caption: "Quả bóng đá trên sân cỏ",
    trueLabel: "Bóng đá",
    preds: [
      { label: "Bóng đá", prob: 0.95 },
      { label: "Bóng chuyền", prob: 0.02 },
      { label: "Bóng rổ", prob: 0.01 },
      { label: "Quả cầu", prob: 0.01 },
      { label: "Bóng tennis", prob: 0.01 },
    ],
    note: "Hoạ tiết lục giác đen trắng là đặc trưng cực mạnh của quả bóng đá.",
  },
  {
    id: "s9",
    icon: "📱",
    bgColor: "#94a3b8",
    caption: "iPhone đặt trên bàn gỗ",
    trueLabel: "Điện thoại",
    preds: [
      { label: "Smartphone", prob: 0.81 },
      { label: "Máy tính bảng", prob: 0.09 },
      { label: "Remote TV", prob: 0.04 },
      { label: "Máy nghe nhạc", prob: 0.03 },
      { label: "Máy ảnh", prob: 0.03 },
    ],
    note: "Camera, nút bấm và tỷ lệ màn hình giúp mô hình phân biệt với tablet.",
  },
  {
    id: "s10",
    icon: "🍜",
    bgColor: "#fb923c",
    caption: "Tô phở bò Hà Nội",
    trueLabel: "Phở",
    preds: [
      { label: "Mì/Soup", prob: 0.41 },
      { label: "Phở", prob: 0.33 },
      { label: "Ramen", prob: 0.14 },
      { label: "Bún bò", prob: 0.08 },
      { label: "Hủ tiếu", prob: 0.04 },
    ],
    note: "Mô hình train trên ImageNet chuẩn quốc tế → nhầm 'Phở' với 'Mì soup' vì thiếu dữ liệu món Việt.",
  },
];

/* ─────────────────────────────────────────────────────────────
 * DỮ LIỆU: Confusion matrix 5x5 (thu nhỏ từ 1000 lớp ImageNet)
 * Giả lập 1000 dự đoán tổng hợp vào 5 nhóm lớn.
 * ───────────────────────────────────────────────────────────── */
const CONFUSION_LABELS = ["Xe cộ", "Động vật", "Đồ ăn", "Đồ vật", "Thực vật"];
const CONFUSION_MATRIX: number[][] = [
  // rows = true, cols = predicted
  [186, 4, 2, 6, 2], // Xe cộ (n=200)
  [3, 178, 8, 7, 4], // Động vật (n=200)
  [1, 9, 162, 12, 16], // Đồ ăn (n=200)
  [8, 5, 10, 170, 7], // Đồ vật (n=200)
  [2, 3, 18, 9, 168], // Thực vật (n=200)
];

/* ─────────────────────────────────────────────────────────────
 * DỮ LIỆU: So sánh 3 kiến trúc trên ImageNet
 * ───────────────────────────────────────────────────────────── */
const ARCHITECTURES = [
  {
    name: "ResNet-50",
    top1: 76.1,
    top5: 92.9,
    params: 25.5,
    flops: 4.1,
    year: 2015,
    color: "#3b82f6",
    note: "Skip connections, chuẩn công nghiệp",
  },
  {
    name: "EfficientNet-B7",
    top1: 84.4,
    top5: 97.1,
    params: 66.0,
    flops: 37.0,
    year: 2019,
    color: "#22c55e",
    note: "Compound scaling chiều rộng/sâu/độ phân giải",
  },
  {
    name: "ViT-L/16",
    top1: 87.8,
    top5: 98.1,
    params: 304.0,
    flops: 190.0,
    year: 2021,
    color: "#a855f7",
    note: "Transformer thuần, cần dữ liệu lớn (JFT-300M)",
  },
];

/* ─────────────────────────────────────────────────────────────
 * DỮ LIỆU: Kiến trúc CNN từng lớp (để vẽ pipeline)
 * ───────────────────────────────────────────────────────────── */
const LAYERS = [
  { label: "Input", w: 70, h: 70, color: "#3b82f6", desc: "224×224×3" },
  { label: "Conv+Pool", w: 55, h: 55, color: "#8b5cf6", desc: "56×56×64" },
  { label: "Conv+Pool", w: 40, h: 40, color: "#8b5cf6", desc: "14×14×256" },
  { label: "Conv+Pool", w: 28, h: 28, color: "#8b5cf6", desc: "7×7×512" },
  { label: "Flatten", w: 10, h: 50, color: "#f59e0b", desc: "25088" },
  { label: "FC", w: 10, h: 35, color: "#ec4899", desc: "4096" },
  { label: "Softmax", w: 10, h: 20, color: "#22c55e", desc: "1000" },
];

/* ─────────────────────────────────────────────────────────────
 * QUIZ — 8 câu kiểm tra kiến thức về Image Classification
 * ───────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "Image Classification khác gì so với Object Detection?",
    options: [
      "Classification gán 1 nhãn cho cả ảnh, Detection tìm vị trí từng đối tượng",
      "Classification nhanh hơn Detection",
      "Classification dùng CNN, Detection dùng RNN",
      "Không có sự khác biệt",
    ],
    correct: 0,
    explanation:
      "Image Classification gán duy nhất 1 nhãn cho toàn bộ ảnh. Object Detection vừa phân loại vừa xác định vị trí (bounding box) của từng đối tượng.",
  },
  {
    question: "Lớp Softmax ở cuối mạng CNN có vai trò gì?",
    options: [
      "Trích xuất đặc trưng từ ảnh",
      "Chuyển đầu ra thành phân phối xác suất, tổng bằng 1",
      "Giảm kích thước ảnh đầu vào",
      "Tăng tốc quá trình huấn luyện",
    ],
    correct: 1,
    explanation:
      "Softmax chuyển vector điểm số thô (logits) thành phân phối xác suất trên tất cả các lớp, với tổng xác suất bằng 1.",
  },
  {
    question:
      "Tại sao mô hình phân loại ảnh cần hàng triệu ảnh huấn luyện (VD: ImageNet)?",
    options: [
      "Để chạy nhanh hơn khi inference",
      "Để học được các đặc trưng đa dạng và tổng quát hoá tốt",
      "Vì mỗi ảnh chỉ huấn luyện được 1 lần",
      "Để tiết kiệm bộ nhớ GPU",
    ],
    correct: 1,
    explanation:
      "Dữ liệu đa dạng giúp mô hình học được nhiều biến thể (góc chụp, ánh sáng, nền) và tổng quát hoá tốt thay vì chỉ nhớ tập huấn luyện.",
  },
  {
    question: "Top-5 accuracy là gì?",
    options: [
      "Độ chính xác trên 5 ảnh đầu tiên trong test set",
      "Tỉ lệ mà nhãn đúng nằm trong 5 dự đoán có xác suất cao nhất của mô hình",
      "Độ chính xác trung bình của 5 epoch cuối",
      "Độ chính xác sau khi bỏ 5 lớp yếu nhất",
    ],
    correct: 1,
    explanation:
      "Top-5 accuracy đếm là 'đúng' khi nhãn đúng xuất hiện trong 5 dự đoán có xác suất cao nhất. Với ImageNet 1000 lớp có nhiều lớp tương đồng (giống chó khác nhau), Top-5 thường cao hơn Top-1 5-10%.",
  },
  {
    question: "Confusion matrix cho ta biết điều gì mà accuracy không cho?",
    options: [
      "Tốc độ inference",
      "Mô hình nhầm lớp A thành lớp B cụ thể ở đâu (nhầm có hệ thống)",
      "Số tham số của mô hình",
      "Kích thước ảnh đầu vào",
    ],
    correct: 1,
    explanation:
      "Confusion matrix[i][j] = số lần nhãn thật là i nhưng mô hình dự đoán là j. Ô ngoài đường chéo cho thấy MÔ HÌNH NHẦM LỘN GIỮA 2 LỚP nào — rất hữu ích để debug (VD: mô hình luôn nhầm 'phở' thành 'mì soup' → cần thêm data phở).",
  },
  {
    question: "ViT (Vision Transformer) khác CNN ở điểm cốt lõi nào?",
    options: [
      "ViT không dùng GPU",
      "ViT chia ảnh thành các patch rồi xử lý như token của transformer, không dùng convolution",
      "ViT chỉ dùng cho ảnh đen trắng",
      "ViT luôn nhanh hơn CNN",
    ],
    correct: 1,
    explanation:
      "ViT cắt ảnh thành N patch (VD 14×14 patches 16×16 pixel), biến mỗi patch thành 1 token, rồi đưa qua Transformer như NLP. Không có convolution, thay vào đó dùng self-attention để mọi patch 'nhìn thấy' nhau ngay từ lớp đầu.",
  },
  {
    question: "EfficientNet đạt accuracy cao với ít tham số nhờ kỹ thuật gì?",
    options: [
      "Dùng kernel 1×1 khắp nơi",
      "Compound scaling: cân bằng tăng cả chiều rộng, chiều sâu và độ phân giải ảnh theo hệ số nhất quán",
      "Chỉ train trên GPU RTX 4090",
      "Loại bỏ hoàn toàn các lớp pooling",
    ],
    correct: 1,
    explanation:
      "EfficientNet (Tan & Le 2019) tìm ra rằng scale 1 chiều duy nhất (ví dụ chỉ làm sâu hơn) không hiệu quả. Thay vào đó, cần scale ĐỒNG THỜI ba chiều (width, depth, resolution) với tỉ lệ φ nhất quán — gọi là compound scaling.",
  },
  {
    question: "Khi fine-tune một mô hình classification pretrained trên ảnh Việt Nam (món ăn, cảnh quan), bạn nên làm gì?",
    options: [
      "Train lại từ đầu với weights ngẫu nhiên",
      "Freeze backbone, chỉ train lớp cuối (classifier head) với dữ liệu của bạn — hoặc fine-tune toàn bộ với learning rate thấp",
      "Bỏ qua pretraining vì không liên quan",
      "Chỉ dùng ViT, không dùng CNN",
    ],
    correct: 1,
    explanation:
      "Transfer learning: pretrained weights (ImageNet) đã học các đặc trưng chung (cạnh, màu, texture) rất hữu ích. Chỉ cần train lớp cuối, hoặc fine-tune toàn bộ với LR nhỏ (1e-4) để thích ứng với dữ liệu Việt Nam mà không 'quên' kiến thức cũ.",
  },
];

/* ─────────────────────────────────────────────────────────────
 * HELPER: tô màu ô confusion matrix theo độ lớn
 * ───────────────────────────────────────────────────────────── */
function confusionColor(value: number, isDiag: boolean): string {
  // giá trị cao trên đường chéo → xanh đậm, ngoài đường chéo → đỏ dần
  const intensity = Math.min(1, value / 200);
  if (isDiag) {
    const lightness = 90 - intensity * 50; // 90→40
    return `hsl(142, 60%, ${lightness}%)`;
  }
  const lightness = 95 - intensity * 40;
  return `hsl(0, 70%, ${lightness}%)`;
}

/* ─────────────────────────────────────────────────────────────
 * COMPONENT CHÍNH
 * ───────────────────────────────────────────────────────────── */
export default function ImageClassificationTopic() {
  const [selectedSampleId, setSelectedSampleId] = useState<string>("s1");
  const [showArchDetail, setShowArchDetail] = useState<boolean>(false);
  const [archMetric, setArchMetric] = useState<"top1" | "top5" | "params">(
    "top1",
  );
  const [showProbs, setShowProbs] = useState<boolean>(false);

  const selectedSample = useMemo(
    () => SAMPLES.find((s) => s.id === selectedSampleId) ?? SAMPLES[0],
    [selectedSampleId],
  );

  // Tính tổng số dự đoán và accuracy tổng từ confusion matrix
  const { totalPredictions, overallAccuracy, perClassAccuracy } =
    useMemo(() => {
      const total = CONFUSION_MATRIX.flat().reduce((a, b) => a + b, 0);
      const correct = CONFUSION_MATRIX.reduce(
        (sum, row, i) => sum + row[i],
        0,
      );
      const perClass = CONFUSION_MATRIX.map((row, i) => {
        const rowSum = row.reduce((a, b) => a + b, 0);
        return rowSum === 0 ? 0 : (row[i] / rowSum) * 100;
      });
      return {
        totalPredictions: total,
        overallAccuracy: (correct / total) * 100,
        perClassAccuracy: perClass,
      };
    }, []);

  const handleSampleSelect = useCallback((id: string) => {
    setSelectedSampleId(id);
  }, []);

  // Giá trị max theo metric để scale biểu đồ cột
  const maxMetric = useMemo(() => {
    return Math.max(...ARCHITECTURES.map((a) => a[archMetric]));
  }, [archMetric]);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 1 — DỰ ĐOÁN (HOOK)
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
          question="Bạn mở camera điện thoại, chĩa vào một chiếc xe máy trên phố Hà Nội. Ứng dụng hiện chữ 'Xe máy — 92%'. Nó đã làm gì?"
          options={[
            "Tìm vị trí xe máy trong ảnh",
            "Gán 1 nhãn cho toàn bộ bức ảnh",
            "Đếm số xe máy trong ảnh",
          ]}
          correct={1}
          explanation="Đây chính là Image Classification: nhìn toàn bộ bức ảnh và gán DUY NHẤT MỘT nhãn danh mục. Không tìm vị trí, không đếm số lượng!"
        >
          <p className="text-sm text-muted mt-4">
            Phần tiếp theo, bạn sẽ được &quot;chạm&quot; vào một trình phân loại thật: chọn
            1 trong 10 ảnh mẫu và xem mô hình đưa ra 5 dự đoán top-5 kèm độ tin cậy.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 2 — KHÁM PHÁ (Demo classifier + Confusion + Compare)
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-8">
            {/* ── Phần A: Demo 10 ảnh + top-5 ─────────────── */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Trình phân loại tương tác — chọn 1 ảnh
              </h3>
              <p className="text-sm text-muted mb-3">
                Bấm vào bất kỳ ảnh nào bên dưới. Mô hình sẽ trả về 5 nhãn có xác suất cao
                nhất (Top-5) cùng với ghi chú giải thích vì sao.
              </p>

              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {SAMPLES.map((s) => {
                  const active = s.id === selectedSampleId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSampleSelect(s.id)}
                      className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all ${
                        active
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-card scale-105"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: s.bgColor }}
                      aria-label={s.caption}
                    >
                      {s.icon}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr]">
                {/* Ảnh to hơn */}
                <div className="flex flex-col items-center">
                  <div
                    className="h-32 w-32 rounded-2xl flex items-center justify-center text-7xl shadow-sm"
                    style={{ backgroundColor: selectedSample.bgColor }}
                  >
                    {selectedSample.icon}
                  </div>
                  <p className="mt-2 text-xs text-muted text-center max-w-[160px]">
                    {selectedSample.caption}
                  </p>
                  <p className="mt-1 text-[11px] text-tertiary">
                    Nhãn đúng:{" "}
                    <span className="font-semibold text-accent">
                      {selectedSample.trueLabel}
                    </span>
                  </p>
                </div>

                {/* Top-5 bar chart */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Top-5 dự đoán
                  </h4>
                  <div className="space-y-2">
                    {selectedSample.preds.map((p, i) => {
                      const isTop1 = i === 0;
                      const isCorrect =
                        p.label.toLowerCase() ===
                          selectedSample.trueLabel.toLowerCase() ||
                        p.label
                          .toLowerCase()
                          .includes(selectedSample.trueLabel.toLowerCase());
                      return (
                        <div key={p.label} className="flex items-center gap-2">
                          <span
                            className={`w-28 text-xs truncate ${
                              isCorrect
                                ? "font-semibold text-green-600 dark:text-green-400"
                                : "text-muted"
                            }`}
                          >
                            {p.label}
                          </span>
                          <div className="flex-1 h-3 rounded-full bg-surface overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${p.prob * 100}%`,
                                backgroundColor: isCorrect
                                  ? "#22c55e"
                                  : isTop1
                                    ? "#3b82f6"
                                    : "#94a3b8",
                              }}
                            />
                          </div>
                          <span className="w-12 text-right text-[11px] font-mono text-muted">
                            {(p.prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[11px] text-tertiary italic">
                    {selectedSample.note}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Phần B: Pipeline CNN ──────────────────────── */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Pipeline CNN: từ pixel đến xác suất
              </h3>
              <p className="text-sm text-muted mb-3">
                Ảnh đi qua từng lớp, thu nhỏ kích thước không gian nhưng tăng số kênh đặc
                trưng. Cuối cùng Softmax biến logits thành phân phối xác suất 1000 lớp.
              </p>
              <svg
                viewBox="0 0 620 220"
                className="w-full max-w-3xl mx-auto"
                role="img"
                aria-label="Sơ đồ kiến trúc CNN"
              >
                {LAYERS.map((layer, i) => {
                  const x = 30 + i * 85;
                  const yCenter = 90;
                  return (
                    <g key={i}>
                      <rect
                        x={x}
                        y={yCenter - layer.h / 2}
                        width={layer.w}
                        height={layer.h}
                        rx="4"
                        fill={layer.color}
                        opacity={0.35}
                        stroke={layer.color}
                        strokeWidth="1.5"
                      />
                      <text
                        x={x + layer.w / 2}
                        y={yCenter + 2}
                        textAnchor="middle"
                        fill="currentColor"
                        className="fill-foreground"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {layer.desc}
                      </text>
                      <text
                        x={x + layer.w / 2}
                        y={yCenter + layer.h / 2 + 14}
                        textAnchor="middle"
                        fill="currentColor"
                        className="fill-muted"
                        fontSize="8"
                      >
                        {layer.label}
                      </text>
                      {i < LAYERS.length - 1 && (
                        <line
                          x1={x + layer.w + 2}
                          y1={yCenter}
                          x2={x + 83}
                          y2={yCenter}
                          stroke="#475569"
                          strokeWidth="1"
                          markerEnd="url(#arrow-ic)"
                        />
                      )}
                    </g>
                  );
                })}
                <defs>
                  <marker
                    id="arrow-ic"
                    markerWidth="6"
                    markerHeight="4"
                    refX="6"
                    refY="2"
                    orient="auto"
                  >
                    <polygon points="0 0, 6 2, 0 4" fill="#475569" />
                  </marker>
                </defs>

                <text
                  x="310"
                  y="180"
                  textAnchor="middle"
                  fill="currentColor"
                  className="fill-muted"
                  fontSize="10"
                >
                  Feature extraction (Conv+Pool) ─────────→ Classifier (FC+Softmax)
                </text>
                <text
                  x="310"
                  y="200"
                  textAnchor="middle"
                  fill="currentColor"
                  className="fill-tertiary"
                  fontSize="9"
                >
                  Kích thước không gian ↓, độ sâu kênh ↑ — đặc trưng từ đơn giản đến phức
                  tạp
                </text>
              </svg>

              <button
                type="button"
                onClick={() => setShowProbs(!showProbs)}
                className="mx-auto mt-2 block rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                {showProbs ? "Ẩn chi tiết Softmax" : "Xem cách Softmax tính xác suất"}
              </button>

              {showProbs && (
                <div className="mt-3 rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
                  <p>
                    <strong>Softmax</strong> chuyển vector logits thành xác suất:
                  </p>
                  <LaTeX block>
                    {"P(y=k) = \\frac{e^{z_k}}{\\sum_{j=1}^{K} e^{z_j}}"}
                  </LaTeX>
                  <p className="text-muted">
                    Mỗi giá trị đầu ra nằm trong khoảng (0, 1) và tổng tất cả bằng 1. Lớp có
                    logit cao nhất sẽ có xác suất cao nhất. Chia hết cho tổng mũ giúp kết
                    quả ổn định về mặt số.
                  </p>
                </div>
              )}
            </div>

            {/* ── Phần C: Confusion Matrix ──────────────────── */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Ma trận nhầm lẫn (1000 dự đoán thực tế)
              </h3>
              <p className="text-sm text-muted mb-3">
                Tổng hợp từ {totalPredictions} dự đoán ImageNet được gom vào 5 nhóm lớn.
                Hàng = nhãn thật, Cột = dự đoán. Đường chéo (xanh) là đúng, ngoài đường
                chéo (đỏ) là nhầm.
              </p>

              <div className="overflow-x-auto">
                <table className="mx-auto border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-xs text-muted"></th>
                      {CONFUSION_LABELS.map((lbl) => (
                        <th
                          key={lbl}
                          className="p-2 text-xs font-semibold text-foreground text-center"
                        >
                          ↓ {lbl}
                        </th>
                      ))}
                      <th className="p-2 text-xs font-semibold text-accent text-center">
                        Acc
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CONFUSION_MATRIX.map((row, i) => (
                      <tr key={CONFUSION_LABELS[i]}>
                        <th className="p-2 text-xs font-semibold text-foreground text-right">
                          {CONFUSION_LABELS[i]} →
                        </th>
                        {row.map((val, j) => {
                          const isDiag = i === j;
                          return (
                            <td
                              key={j}
                              className="p-2 text-center border border-border/50 font-mono text-sm"
                              style={{
                                backgroundColor: confusionColor(val, isDiag),
                                fontWeight: isDiag ? 700 : 400,
                                color: isDiag ? "#065f46" : "#991b1b",
                              }}
                            >
                              {val}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-mono text-sm font-semibold text-accent">
                          {perClassAccuracy[i].toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-md bg-accent-light p-3">
                  <div className="text-tertiary">Tổng số dự đoán</div>
                  <div className="text-lg font-bold text-accent">
                    {totalPredictions}
                  </div>
                </div>
                <div className="rounded-md bg-accent-light p-3">
                  <div className="text-tertiary">Độ chính xác tổng</div>
                  <div className="text-lg font-bold text-accent">
                    {overallAccuracy.toFixed(2)}%
                  </div>
                </div>
                <div className="rounded-md bg-surface border border-border p-3">
                  <div className="text-tertiary">Cặp nhầm nhiều nhất</div>
                  <div className="text-sm font-semibold text-foreground">
                    Thực vật ↔ Đồ ăn (18 + 16)
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-tertiary italic">
                Mô hình thường nhầm Thực vật ↔ Đồ ăn vì nhiều ảnh rau củ có bối cảnh bếp
                giống ảnh đồ ăn. Đây là dấu hiệu cần bổ sung dữ liệu hoặc dùng hard-example
                mining.
              </p>
            </div>

            {/* ── Phần D: So sánh 3 kiến trúc ──────────────── */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-base font-semibold text-foreground">
                  So sánh ResNet50 · EfficientNet · ViT trên ImageNet
                </h3>
                <div className="flex gap-1">
                  {(["top1", "top5", "params"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setArchMetric(m)}
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                        archMetric === m
                          ? "bg-accent text-white"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {m === "top1"
                        ? "Top-1 %"
                        : m === "top5"
                          ? "Top-5 %"
                          : "Tham số (M)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {ARCHITECTURES.map((a) => {
                  const value = a[archMetric];
                  const pct = (value / maxMetric) * 100;
                  return (
                    <div key={a.name} className="flex items-center gap-3">
                      <div className="w-32 text-sm">
                        <div className="font-semibold text-foreground">{a.name}</div>
                        <div className="text-[10px] text-tertiary">{a.year}</div>
                      </div>
                      <div className="flex-1 h-7 rounded-md bg-surface overflow-hidden">
                        <div
                          className="h-full flex items-center justify-end pr-2 text-xs font-semibold text-white transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: a.color,
                          }}
                        >
                          {archMetric === "params"
                            ? `${value}M`
                            : `${value.toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowArchDetail(!showArchDetail)}
                className="mt-3 text-xs text-accent font-semibold hover:underline"
              >
                {showArchDetail ? "Ẩn bảng chi tiết" : "Xem bảng chi tiết (Top-1, Top-5, FLOPs, Tham số)"}
              </button>

              {showArchDetail && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-semibold">Mô hình</th>
                        <th className="text-right py-2 px-3 font-semibold">Top-1</th>
                        <th className="text-right py-2 px-3 font-semibold">Top-5</th>
                        <th className="text-right py-2 px-3 font-semibold">Params (M)</th>
                        <th className="text-right py-2 px-3 font-semibold">GFLOPs</th>
                        <th className="text-left py-2 px-3 font-semibold">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted">
                      {ARCHITECTURES.map((a) => (
                        <tr key={a.name} className="border-b border-border/50">
                          <td className="py-2 px-3 font-semibold text-foreground">
                            {a.name}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {a.top1.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {a.top5.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {a.params.toFixed(1)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {a.flops.toFixed(1)}
                          </td>
                          <td className="py-2 px-3">{a.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-2 text-[11px] text-tertiary italic">
                Accuracy tăng đi kèm với số tham số và FLOPs. ViT-L đạt đỉnh 87.8% Top-1
                nhưng cần dữ liệu pretrain khổng lồ (JFT-300M) để không overfit.
              </p>
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
            CNN học đặc trưng theo <strong>thứ bậc</strong> giống cách thị giác của não
            người hoạt động: lớp đầu bắt <strong>cạnh và góc</strong>, lớp giữa ghép thành
            <strong> bộ phận</strong> (bánh xe, mắt, đèn pha), lớp cuối tổ hợp tất cả
            thành <strong>đối tượng hoàn chỉnh</strong>. Bạn không hề dạy mạng đâu là
            &quot;bánh xe&quot; — nó tự khám phá ra qua hàng triệu ảnh và backpropagation.
          </p>
          <p className="mt-3">
            Một cách nhìn khác:{" "}
            <em>phân loại ảnh = nén ảnh 224×224×3 ≈ 150 000 số thành 1 số nguyên</em>{" "}
            (index lớp) — mất gần 100% thông tin pixel nhưng giữ đúng &quot;khái niệm&quot;.
            Đó là sức mạnh của biểu diễn (representation learning).
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 4 — THỬ THÁCH 1
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Ảnh chụp một chiếc xe máy chở đầy hàng hoá, nhìn từ phía sau. Mô hình phân loại nhầm thành 'xe ba gác'. Nguyên nhân có thể là gì?"
          options={[
            "Mô hình dùng sai hàm Softmax",
            "Tập huấn luyện thiếu ảnh xe máy chở hàng nhìn từ phía sau",
            "Ảnh quá lớn cho mô hình xử lý",
          ]}
          correct={1}
          explanation="Mô hình chỉ tốt bằng dữ liệu huấn luyện. Nếu thiếu ảnh xe máy chở hàng từ phía sau, mô hình không học được đặc trưng đó. Đây là vấn đề distribution shift trong thực tế Việt Nam — gợi ý bổ sung ảnh từ camera giao thông địa phương."
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 5 — GIẢI THÍCH SÂU
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Image Classification</strong> (Phân loại hình ảnh) là tác vụ cơ bản
            nhất trong thị giác máy tính — gán <em>một</em> nhãn danh mục cho toàn bộ bức
            ảnh. Công thức chính thức:
          </p>
          <LaTeX block>
            {"f_\\theta: \\mathbb{R}^{H \\times W \\times 3} \\rightarrow \\{1, 2, \\ldots, K\\}"}
          </LaTeX>
          <p className="text-sm text-muted">
            Hàm <LaTeX>{"f_\\theta"}</LaTeX> với tham số <LaTeX>{"\\theta"}</LaTeX>{" "}
            nhận ảnh RGB (H×W×3) và trả về 1 trong K nhãn. Với ImageNet, K = 1000. Thực
            chất, mô hình cho ra phân phối xác suất K chiều, lớp có xác suất cao nhất
            được chọn qua <LaTeX>{"\\text{argmax}"}</LaTeX>.
          </p>

          <Callout variant="insight" title="Pipeline 3 giai đoạn">
            <p>Ảnh đầu vào (224×224×3) đi qua ba giai đoạn:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>
                <strong>Feature Extraction:</strong> các lớp Conv + Pool trích đặc trưng,
                giảm kích thước không gian (224 → 7) nhưng tăng số kênh (3 → 512).
              </li>
              <li>
                <strong>Flatten + FC:</strong> duỗi tensor 3D thành vector 1D (≈25 000
                chiều), ánh xạ qua một hoặc nhiều lớp fully-connected.
              </li>
              <li>
                <strong>Softmax:</strong> chuyển logits thành phân phối xác suất trên K
                lớp. Lấy argmax để có dự đoán cuối cùng.
              </li>
            </ol>
          </Callout>

          <p>
            <strong>Hàm mất mát Cross-Entropy</strong> được dùng để huấn luyện. Với nhãn
            one-hot <LaTeX>{"y"}</LaTeX> và dự đoán <LaTeX>{"\\hat{y}"}</LaTeX>:
          </p>
          <LaTeX block>
            {"\\mathcal{L}_{CE} = -\\sum_{k=1}^{K} y_k \\log(\\hat{y}_k)"}
          </LaTeX>
          <p className="text-sm text-muted">
            Vì <LaTeX>{"y"}</LaTeX> là one-hot, tổng chỉ còn{" "}
            <LaTeX>{"-\\log(\\hat{y}_c)"}</LaTeX> với c là lớp đúng. Mất mát càng nhỏ khi
            xác suất của lớp đúng càng gần 1. Đạo hàm của cross-entropy + softmax rất gọn:{" "}
            <LaTeX>{"\\partial \\mathcal{L} / \\partial z = \\hat{y} - y"}</LaTeX>.
          </p>

          <Callout variant="warning" title="Ứng dụng thực tế tại Việt Nam">
            <ul className="list-disc list-inside space-y-1">
              <li>
                Nhận diện loại phương tiện trên camera giao thông (xe máy chiếm 80% phương
                tiện) — phục vụ đếm lưu lượng, phân luồng.
              </li>
              <li>
                Phân loại ảnh sản phẩm trên Shopee, Tiki theo danh mục (thời trang, điện
                tử, đồ ăn…) để cải thiện tìm kiếm và gợi ý.
              </li>
              <li>
                Phân loại ảnh CCCD/CMND trong hệ thống eKYC ngân hàng — phát hiện ảnh giả,
                ảnh mờ, ảnh không đúng định dạng.
              </li>
              <li>
                Kiểm duyệt nội dung trên Zalo, VNG: phát hiện ảnh bạo lực, khoả thân, lừa
                đảo trước khi cho đăng tải.
              </li>
              <li>
                Y tế: phân loại ảnh X-quang phổi (có/không Covid, lao), ảnh da liễu (ung
                thư hắc tố vs bớt lành tính).
              </li>
            </ul>
          </Callout>

          <p>
            <strong>Các kiến trúc nổi tiếng:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>AlexNet</strong> (2012): mở đầu kỷ nguyên deep learning cho CV, thắng
              ImageNet với top-5 error 15.3% (giảm từ 26.2%).
            </li>
            <li>
              <strong>VGGNet</strong> (2014): kiến trúc đơn giản, chỉ dùng conv 3×3 và max
              pool 2×2 — sâu 16-19 lớp, đẹp về lý thuyết.
            </li>
            <li>
              <strong>GoogLeNet/Inception</strong> (2014): khối Inception với nhiều nhánh
              song song (1×1, 3×3, 5×5, pooling) để học đa tỉ lệ.
            </li>
            <li>
              <strong>ResNet</strong> (2015): skip connection cho phép huấn luyện mạng 152
              lớp mà không bị gradient tắt. Cột mốc quan trọng nhất.
            </li>
            <li>
              <strong>DenseNet</strong> (2017): mỗi lớp nhận input từ tất cả lớp trước —
              tận dụng feature tối đa.
            </li>
            <li>
              <strong>EfficientNet</strong> (2019): compound scaling tối ưu đồng thời
              width, depth, resolution theo hệ số nhất quán.
            </li>
            <li>
              <strong>Vision Transformer (ViT)</strong> (2020): áp dụng Transformer cho
              ảnh bằng cách chia patch, không dùng convolution.
            </li>
            <li>
              <strong>ConvNeXt</strong> (2022): &quot;hiện đại hoá&quot; CNN để cạnh tranh
              với ViT, chứng minh convolution vẫn rất mạnh.
            </li>
          </ul>

          <Callout variant="tip" title="Chọn kiến trúc theo tài nguyên">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Mobile/Edge (Raspberry Pi, JetsonNano):</strong>{" "}
                MobileNetV3, EfficientNet-Lite, hoặc quantized ResNet-18. Target: &lt;50MB,
                &lt;100ms inference.
              </li>
              <li>
                <strong>Server GPU (1×V100 hoặc A100):</strong> ResNet-50 (chuẩn), hoặc
                EfficientNet-B4/B5 cho accuracy tốt hơn mà vẫn nhanh.
              </li>
              <li>
                <strong>Tier cao — SOTA accuracy:</strong> ViT-L, Swin-L, ConvNeXt-L. Cần
                nhiều data (JFT hoặc LAION).
              </li>
              <li>
                <strong>Data ít (&lt;10K ảnh):</strong> luôn fine-tune từ pretrained.
                Không bao giờ train-from-scratch — sẽ overfit ngay.
              </li>
            </ul>
          </Callout>

          <Callout variant="info" title="Data Augmentation — vũ khí bí mật">
            <p className="text-sm">
              Một mô hình train chỉ 10 000 ảnh gốc có thể đạt accuracy của 1 triệu ảnh nếu
              dùng đúng augmentation. Các phép phổ biến:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm pl-2 mt-2">
              <li>
                <strong>RandomCrop + Resize:</strong> cắt ngẫu nhiên một vùng rồi phóng
                về 224×224 — dạy mô hình bất biến theo vị trí/tỉ lệ.
              </li>
              <li>
                <strong>HorizontalFlip:</strong> lật ngang ngẫu nhiên (không áp dụng cho
                chữ viết hoặc ảnh y tế có hướng rõ ràng).
              </li>
              <li>
                <strong>ColorJitter:</strong> đổi brightness, contrast, saturation, hue
                ±30% — chịu được ánh sáng khác nhau.
              </li>
              <li>
                <strong>MixUp / CutMix:</strong> trộn 2 ảnh và 2 nhãn — giảm overfit cực
                mạnh, tăng 1-2% accuracy.
              </li>
              <li>
                <strong>RandAugment / AutoAugment:</strong> tự động chọn tổ hợp
                augmentation tối ưu qua search — tiên tiến nhất hiện nay.
              </li>
            </ul>
          </Callout>

          <CollapsibleDetail title="Chi tiết: Top-1 vs Top-5 accuracy">
            <div className="space-y-2 text-sm">
              <p>
                Trên ImageNet có 1000 lớp và NHIỀU lớp rất giống nhau — ví dụ hàng trăm
                giống chó (Labrador, Golden Retriever, Husky, Husky Alaska…). Con người
                cũng khó phân biệt. Vì vậy ImageNet 2012 định nghĩa 2 metric:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>
                  <strong>Top-1 accuracy:</strong> dự đoán có xác suất cao nhất có đúng
                  nhãn không? Nghiêm khắc nhất, mô hình hiện đại đạt ~85-88%.
                </li>
                <li>
                  <strong>Top-5 accuracy:</strong> nhãn đúng có nằm trong 5 dự đoán cao
                  nhất không? Thoải mái hơn, đạt ~95-98%. Chênh 5-10% giữa Top-1 và Top-5
                  phần lớn do lớp tương đồng.
                </li>
              </ul>
              <p>
                Với dataset khách hàng (VD 10 lớp sản phẩm), Top-5 thường không có ý nghĩa
                — dùng Top-1 và thêm F1-score (vì data thường mất cân bằng).
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Transfer Learning: cách fine-tune mô hình pretrained">
            <div className="space-y-2 text-sm">
              <p>
                Transfer learning là kỹ thuật <strong>quan trọng nhất trong thực tế</strong>:
                thay vì train từ đầu (cần hàng triệu ảnh và tuần GPU), ta bắt đầu từ mô
                hình đã pretrained trên ImageNet rồi điều chỉnh.
              </p>
              <p>
                Ba chiến lược phổ biến (sắp xếp theo độ tự do tăng dần):
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>
                  <strong>Feature Extractor:</strong> đóng băng toàn bộ backbone, chỉ
                  thay/train lớp cuối (classifier head). Dùng khi data rất ít (&lt;1000
                  ảnh) và task gần với ImageNet.
                </li>
                <li>
                  <strong>Fine-tuning toàn bộ với LR nhỏ:</strong> mở khoá mọi lớp, train
                  với learning rate thấp (1e-4 hoặc nhỏ hơn) để không &quot;làm hỏng&quot;
                  kiến thức đã học. Dùng khi data vừa đủ (5K-50K ảnh).
                </li>
                <li>
                  <strong>Progressive unfreezing:</strong> bắt đầu chỉ mở head, sau vài
                  epoch dần mở khoá các khối từ cuối lên đầu. An toàn hơn cho task khác
                  ImageNet nhiều (ví dụ ảnh y tế).
                </li>
              </ol>
              <p>
                Với data Việt Nam (món ăn, phương tiện địa phương, chữ Nôm…), fine-tune
                thường cho kết quả tốt hơn nhiều so với train-from-scratch, ngay cả khi
                đích rất khác ImageNet — bởi &quot;cạnh&quot; và &quot;texture&quot; vẫn
                chung giữa mọi loại ảnh.
              </p>
            </div>
          </CollapsibleDetail>

          <CodeBlock
            language="python"
            title="Phân loại ảnh với PyTorch (pretrained ResNet-50)"
          >
            {`import torch
from torchvision import models, transforms
from PIL import Image

# ── Load ResNet-50 đã pretrain trên ImageNet ────────────────
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
model.eval()

# ── Tiền xử lý: chuẩn theo ImageNet stats ──────────────────
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])

img = Image.open("xe_may.jpg").convert("RGB")
x = transform(img).unsqueeze(0)          # (1, 3, 224, 224)

with torch.no_grad():
    logits = model(x)                    # (1, 1000)
    probs  = torch.softmax(logits, dim=1)
    top5   = torch.topk(probs, 5)

# ── In ra Top-5 cùng xác suất ──────────────────────────────
classes = models.ResNet50_Weights.IMAGENET1K_V2.meta["categories"]
for i in range(5):
    idx = top5.indices[0][i].item()
    p   = top5.values[0][i].item()
    print(f"{i+1}. {classes[idx]:30s}  {p*100:5.2f}%")

# Output ví dụ:
# 1. moped                          82.41%
# 2. mountain_bike                   7.12%
# 3. motor_scooter                   4.88%
# 4. unicycle                        2.05%
# 5. tricycle                        1.33%`}
          </CodeBlock>

          <CodeBlock
            language="python"
            title="Fine-tune ResNet-50 cho 10 lớp sản phẩm VN"
          >
            {`import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import models, datasets, transforms

# ── 1) Dataset: ảnh sản phẩm Shopee VN, 10 lớp ─────────────
train_tf = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(0.3, 0.3, 0.3),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
train_ds = datasets.ImageFolder("data/shopee_vn/train", transform=train_tf)
train_ld = DataLoader(train_ds, batch_size=64, shuffle=True, num_workers=4)

# ── 2) Load pretrained, thay lớp cuối ──────────────────────
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
num_classes = 10
model.fc = nn.Linear(model.fc.in_features, num_classes)
model = model.cuda()

# ── 3) Fine-tune toàn bộ với LR nhỏ cho backbone ──────────
optimizer = torch.optim.AdamW([
    {"params": [p for n, p in model.named_parameters() if "fc" not in n], "lr": 1e-4},
    {"params": model.fc.parameters(), "lr": 1e-3},   # head LR lớn hơn
], weight_decay=1e-4)

criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=20)

# ── 4) Vòng train ngắn gọn ────────────────────────────────
for epoch in range(20):
    model.train()
    for x, y in train_ld:
        x, y = x.cuda(), y.cuda()
        optimizer.zero_grad()
        loss = criterion(model(x), y)
        loss.backward()
        optimizer.step()
    scheduler.step()
    print(f"epoch {epoch+1:02d}  loss={loss.item():.4f}")`}
          </CodeBlock>

          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Metric đánh giá thường dùng
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold">Metric</th>
                  <th className="text-left py-2 px-3 font-semibold">Công thức</th>
                  <th className="text-left py-2 px-3 font-semibold">Khi dùng</th>
                </tr>
              </thead>
              <tbody className="text-muted">
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-semibold text-foreground">Accuracy</td>
                  <td className="py-2 px-3 font-mono text-xs">
                    correct / total
                  </td>
                  <td className="py-2 px-3">Data cân bằng, nhiều lớp đều nhau</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-semibold text-foreground">
                    Top-5 Accuracy
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">
                    y ∈ top5(ŷ)
                  </td>
                  <td className="py-2 px-3">ImageNet &amp; task có nhiều lớp gần nhau</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-semibold text-foreground">
                    Precision/Recall
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">
                    TP/(TP+FP), TP/(TP+FN)
                  </td>
                  <td className="py-2 px-3">Lớp mất cân bằng, cần đo riêng từng lớp</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-semibold text-foreground">
                    F1 (macro/weighted)
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">
                    2PR/(P+R)
                  </td>
                  <td className="py-2 px-3">
                    Cân bằng giữa precision &amp; recall, data imbalanced
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-semibold text-foreground">
                    Confusion Matrix
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">CM[i][j]</td>
                  <td className="py-2 px-3">Debug xem mô hình nhầm cặp lớp nào</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-foreground">
                    ROC-AUC (per class)
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">∫ TPR d FPR</td>
                  <td className="py-2 px-3">Khi cần threshold linh hoạt theo chi phí</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Pitfalls (cái bẫy) thường gặp
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm pl-2">
            <li>
              <strong>Data leakage:</strong> ảnh của cùng một người/đồ vật xuất hiện ở cả
              train và test → accuracy ảo cao. Luôn split theo{" "}
              <em>entity</em> chứ không phải theo ảnh.
            </li>
            <li>
              <strong>Class imbalance:</strong> 95% ảnh thuộc 1 lớp → mô hình học cách luôn
              predict lớp đó và đạt 95% accuracy &quot;giả&quot;. Dùng oversampling,
              focal loss, hoặc macro F1.
            </li>
            <li>
              <strong>Label noise:</strong> nhãn sai ~5-10% là chuyện thường. Dùng{" "}
              <code>cleanlab</code> hoặc huấn luyện với label smoothing để giảm ảnh hưởng.
            </li>
            <li>
              <strong>Domain shift:</strong> train trên ảnh web, deploy trên camera điện
              thoại → performance rơi. Luôn thu thập một phần data từ môi trường triển
              khai thật.
            </li>
            <li>
              <strong>Adversarial examples:</strong> thay đổi vài pixel có thể lừa mô hình
              — quan trọng khi dùng cho bảo mật, eKYC. Xem topic{" "}
              <em>adversarial-robustness</em>.
            </li>
            <li>
              <strong>Test set quá nhỏ:</strong> &lt;500 ảnh/lớp → accuracy dao động ±5%
              giữa các lần eval. Luôn báo cáo confidence interval.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            Ứng dụng tiên tiến năm 2024+
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm pl-2">
            <li>
              <strong>Zero-shot classification với CLIP:</strong> không cần train, chỉ cần
              viết tên lớp bằng tiếng Việt (&quot;xe máy chở hàng&quot;,
              &quot;xe ba gác&quot;). Độ chính xác rất tốt cho nhãn tự do.
            </li>
            <li>
              <strong>Open-vocabulary:</strong> model như EVA-02, DINOv2 phân loại được
              bất kỳ khái niệm nào bạn mô tả bằng ngôn ngữ.
            </li>
            <li>
              <strong>Multimodal (VLM):</strong> không chỉ ra 1 nhãn mà trả lời &quot;đây
              là gì và tại sao&quot; — dùng GPT-4V, Gemini, Qwen-VL.
            </li>
            <li>
              <strong>Few-shot learning:</strong> cho 5 ảnh/lớp là mô hình học ngay nhờ
              meta-learning và pretrained features mạnh.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 6 — THỬ THÁCH 2
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn train một classifier với 95% accuracy trên validation. Khi deploy trên camera điện thoại thực tế, accuracy rớt còn 62%. Nguyên nhân chính là gì?"
          options={[
            "Mô hình bị hỏng do chuyển sang ONNX",
            "Domain shift: ảnh validation được chụp trong studio, ảnh thực tế có ánh sáng/góc/nhiễu khác hẳn",
            "Camera điện thoại yếu hơn GPU training",
            "Softmax chạy không chính xác trên mobile",
          ]}
          correct={1}
          explanation="Đây là vấn đề domain shift kinh điển. Data validation phải đại diện cho môi trường triển khai THẬT. Giải pháp: thu thập ảnh từ camera mục tiêu ngay từ đầu, hoặc dùng domain adaptation, test-time augmentation. Không có kỹ thuật model nào bù được data sai phân phối."
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════
       *  BƯỚC 7 — TÓM TẮT
       * ═══════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          points={[
            "Image Classification gán DUY NHẤT 1 nhãn cho toàn bộ ảnh — không tìm vị trí, không đếm số lượng (đó là các task khác).",
            "CNN trích đặc trưng theo thứ bậc: cạnh → hình dạng → bộ phận → đối tượng; Softmax chuyển logits thành xác suất, Cross-Entropy tính loss.",
            "ImageNet (1000 lớp, 1.2M ảnh) là benchmark chuẩn. Mô hình hiện đại đạt Top-1 85-88%, Top-5 96-98%.",
            "Kiến trúc lớn: ResNet (2015, 76%), EfficientNet (2019, 84%), ViT (2020-21, 88%). Accuracy tăng đi kèm tham số và tính toán.",
            "Confusion matrix cho thấy cặp lớp bị nhầm có hệ thống — công cụ debug quan trọng hơn chỉ nhìn accuracy.",
            "Trong thực tế, luôn dùng transfer learning + data augmentation; cẩn trọng data leakage, class imbalance, domain shift.",
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
