"use client";

import { useState } from "react";
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
  slug: "semantic-segmentation",
  title: "Semantic Segmentation",
  titleVi: "Phân đoạn ngữ nghĩa",
  description:
    "Tác vụ gán nhãn danh mục cho từng pixel trong ảnh, tạo bản đồ phân vùng chi tiết.",
  category: "computer-vision",
  tags: ["computer-vision", "segmentation", "pixel-wise"],
  difficulty: "intermediate",
  relatedSlugs: ["instance-segmentation", "panoptic-segmentation", "cnn"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
const GRID_SIZE = 12;
const CATEGORIES: Record<number, { name: string; color: string }> = {
  0: { name: "Bầu trời", color: "#60a5fa" },
  1: { name: "Cây cối", color: "#22c55e" },
  2: { name: "Đường", color: "#94a3b8" },
  3: { name: "Xe", color: "#ef4444" },
  4: { name: "Nhà", color: "#f59e0b" },
};

const SCENE: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,0,0,0,1,1,1,0,0],
  [0,1,1,1,1,0,1,1,1,1,1,0],
  [1,1,1,1,1,0,1,1,1,1,1,0],
  [0,1,1,1,0,4,4,4,1,1,0,0],
  [0,0,1,0,0,4,4,4,0,0,0,0],
  [0,0,0,0,0,4,4,4,0,0,0,0],
  [2,2,2,2,2,2,2,2,2,2,2,2],
  [2,2,2,3,3,3,2,2,2,2,2,2],
  [2,2,2,3,3,3,2,2,2,2,2,2],
  [2,2,2,2,2,2,2,2,2,2,2,2],
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Semantic Segmentation khác Object Detection ở điểm nào?",
    options: [
      "Semantic Segmentation gán nhãn cho TỪNG PIXEL, không dùng bounding box",
      "Semantic Segmentation nhanh hơn Object Detection",
      "Semantic Segmentation chỉ phát hiện 1 đối tượng",
      "Không có sự khác biệt",
    ],
    correct: 0,
    explanation:
      "Semantic Segmentation gán nhãn pixel-level (chi tiết đến từng điểm ảnh), trong khi Object Detection chỉ vẽ bounding box hình chữ nhật bao quanh.",
  },
  {
    question: "Hạn chế chính của Semantic Segmentation là gì?",
    options: [
      "Không thể xử lý ảnh lớn",
      "Không phân biệt được các thể hiện (instance) khác nhau cùng lớp",
      "Chỉ hoạt động với ảnh xám",
      "Không dùng được cho video",
    ],
    correct: 1,
    explanation:
      "2 chiếc xe cạnh nhau đều được tô cùng màu 'xe' -- không phân biệt xe #1 và xe #2. Đây là lý do Instance Segmentation ra đời!",
  },
  {
    question: "Kiến trúc Encoder-Decoder trong Semantic Segmentation hoạt động thế nào?",
    options: [
      "Encoder nén ảnh thành đặc trưng, Decoder khôi phục về kích thước gốc",
      "Encoder phân loại ảnh, Decoder vẽ bounding box",
      "Cả hai cùng nén ảnh",
      "Encoder dùng cho ảnh, Decoder dùng cho video",
    ],
    correct: 0,
    explanation:
      "Encoder (VD: ResNet) nén ảnh xuống feature map nhỏ nhưng giàu ngữ nghĩa. Decoder (VD: upsampling) khôi phục về kích thước ảnh gốc để gán nhãn từng pixel.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function SemanticSegmentationTopic() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  const cellSize = 600 / GRID_SIZE;

  return (
    <>
      {/* Step 1: Hook */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Xe tự lái cần biết chính xác đâu là đường, đâu là vỉa hè, đâu là người đi bộ -- đến từng điểm ảnh. Object Detection (bounding box) có đủ không?"
          options={[
            "Đủ, bounding box cho biết vị trí rồi",
            "Không đủ, cần biết CHÍNH XÁC đường viền từng vùng",
            "Chỉ cần Image Classification",
          ]}
          correct={1}
          explanation="Bounding box là hình chữ nhật thô, bao gồm cả pixel không thuộc đối tượng. Xe tự lái cần biết TỪNG PIXEL thuộc đường hay vỉa hè. Đó là Semantic Segmentation!"
        >

      {/* Step 2: Discover */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowOverlay(!showOverlay)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  showOverlay ? "bg-accent text-white" : "bg-card border border-border text-muted"
                }`}
              >
                {showOverlay ? "Tắt lớp phủ" : "Bật lớp phủ"}
              </button>
              {Object.entries(CATEGORIES).map(([id, cat]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedCat(selectedCat === Number(id) ? null : Number(id))}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border"
                  style={{
                    backgroundColor: selectedCat === Number(id) ? cat.color : "transparent",
                    borderColor: cat.color,
                    color: selectedCat === Number(id) ? "white" : cat.color,
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 500" className="w-full max-w-2xl mx-auto">
              {SCENE.map((row, r) =>
                row.map((cat, c) => {
                  const isHighlighted = selectedCat === null || selectedCat === cat;
                  return (
                    <rect
                      key={`${r}-${c}`}
                      x={c * cellSize} y={r * cellSize}
                      width={cellSize} height={cellSize}
                      fill={showOverlay ? CATEGORIES[cat].color : "#1e293b"}
                      opacity={showOverlay ? (isHighlighted ? 0.8 : 0.2) : 1}
                      stroke="#0f172a" strokeWidth="1"
                    />
                  );
                })
              )}
            </svg>

            <div className="flex flex-wrap gap-3 justify-center">
              {Object.entries(CATEGORIES).map(([, cat]) => (
                <div key={cat.name} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-muted">{cat.name}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted text-center">
              Nhấn vào tên danh mục để highlight riêng vùng đó. Mỗi pixel thuộc DUY NHẤT 1 danh mục!
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* Step 3: Aha */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Semantic Segmentation giống như <strong>tô màu</strong>{" "}bức tranh: mỗi pixel được gán đúng 1 nhãn
            (<strong>bầu trời</strong>, <strong>đường</strong>, <strong>xe</strong>...). Kết quả là bản đồ
            phân vùng chi tiết đến từng điểm ảnh -- <strong>không có pixel nào bị bỏ sót!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      {/* Step 4: Challenge */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Ảnh có 2 chiếc xe máy đỗ sát nhau. Semantic Segmentation tô cả 2 cùng màu 'xe'. Vấn đề gì xảy ra?"
          options={[
            "Không vấn đề gì, vì cả 2 đều là xe",
            "Không phân biệt được xe nào là xe nào (thiếu instance ID)",
            "Mô hình bị lỗi vì có quá nhiều xe",
          ]}
          correct={1}
          explanation="Đây là hạn chế lớn nhất của Semantic Segmentation: không phân biệt các thể hiện (instance) khác nhau cùng lớp. Instance Segmentation giải quyết vấn đề này!"
        />
      </LessonSection>

      {/* Step 5: Explain */}
      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Semantic Segmentation</strong>{" "}gán nhãn danh mục cho <strong>từng pixel</strong>{" "}trong ảnh.
            Đây là tác vụ phân loại ở mức pixel, chi tiết hơn nhiều so với phân loại ảnh hay phát hiện đối tượng.
          </p>

          <Callout variant="insight" title="Kiến trúc Encoder-Decoder">
            <p className="text-sm">Hầu hết mô hình segmentation theo kiến trúc 2 phần:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li><strong>Encoder:</strong>{" "}Nén ảnh (224x224) thành feature map nhỏ (7x7) nhưng giàu ngữ nghĩa</li>
              <li><strong>Decoder:</strong>{" "}Khôi phục feature map về kích thước ảnh gốc, gán nhãn từng pixel</li>
            </ul>
          </Callout>

          <p><strong>Hàm mất mát</strong>{" "}Cross-Entropy cho mỗi pixel:</p>
          <LaTeX block>{"\\mathcal{L} = -\\frac{1}{H \\times W} \\sum_{i=1}^{H \\times W} \\sum_{k=1}^{K} y_{i,k} \\log(\\hat{y}_{i,k})"}</LaTeX>
          <p className="text-sm text-muted">
            Với ảnh <LaTeX>{"H \\times W"}</LaTeX> pixel và K lớp, mỗi pixel đều đóng góp vào loss.
          </p>

          <p><strong>Kiến trúc nổi tiếng:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>FCN</strong>{" "}(2015): Fully Convolutional Network -- thay FC bằng Conv 1x1</li>
            <li><strong>U-Net</strong>{" "}(2015): Skip connections giữa encoder và decoder, xuất sắc cho ảnh y tế</li>
            <li><strong>DeepLab v3+</strong>{" "}(2018): Atrous convolution + ASPP, mở rộng receptive field hiệu quả</li>
            <li><strong>SegFormer</strong>{" "}(2021): Transformer-based, nhẹ và chính xác</li>
          </ul>

          <Callout variant="warning" title="Ứng dụng thực tế">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Lái xe tự lái:</strong>{" "}Phân biệt đường, vỉa hè, biển báo, người đi bộ ở Việt Nam</li>
              <li><strong>Y tế:</strong>{" "}Phân vùng khối u trong ảnh CT/MRI tại các bệnh viện</li>
              <li><strong>Nông nghiệp:</strong>{" "}Phân loại vùng trồng lúa vs hoa màu từ ảnh drone</li>
              <li><strong>Chỉnh sửa ảnh:</strong>{" "}Tách nền tự động (portrait mode) trên điện thoại</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Semantic Segmentation với torchvision">
{`import torch
from torchvision.models.segmentation import deeplabv3_resnet50
from torchvision import transforms
from PIL import Image

# Load pretrained DeepLabV3
model = deeplabv3_resnet50(pretrained=True)
model.eval()

# Tiền xử lý
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

img = Image.open("duong_pho_hanoi.jpg")
x = transform(img).unsqueeze(0)

with torch.no_grad():
    out = model(x)["out"]          # (1, 21, H, W)
    pred = out.argmax(dim=1)       # (1, H, W) - nhãn mỗi pixel

# pred[0] chứa nhãn 0-20 cho mỗi pixel
# 0=background, 7=car, 15=person, ...
print(f"Unique classes: {pred.unique().tolist()}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* Step 6: Summary */}
      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Semantic Segmentation gán nhãn cho TỪNG PIXEL -- chi tiết hơn bounding box rất nhiều",
          "Kiến trúc Encoder-Decoder: nén ảnh thành đặc trưng, rồi khôi phục về kích thước gốc",
          "Hạn chế: không phân biệt các instance cùng lớp (2 xe cùng màu = 1 vùng)",
          "U-Net, DeepLab, SegFormer là các kiến trúc phổ biến nhất hiện nay",
        ]} />
      </LessonSection>

      {/* Step 7: Quiz */}
      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
