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
  slug: "instance-segmentation",
  title: "Instance Segmentation",
  titleVi: "Phân đoạn thể hiện",
  description:
    "Kết hợp phát hiện đối tượng và phân đoạn, phân biệt từng thể hiện riêng lẻ của cùng loại đối tượng.",
  category: "computer-vision",
  tags: ["computer-vision", "segmentation", "detection"],
  difficulty: "advanced",
  relatedSlugs: ["semantic-segmentation", "object-detection", "panoptic-segmentation"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
interface Instance {
  id: number;
  label: string;
  color: string;
  points: string;
  cx: number;
  cy: number;
}

const INSTANCES: Instance[] = [
  { id: 1, label: "Xe #1", color: "#3b82f6", points: "50,250 55,200 80,180 130,180 155,200 160,250 140,265 70,265", cx: 105, cy: 220 },
  { id: 2, label: "Xe #2", color: "#22c55e", points: "220,260 225,210 250,190 300,190 325,210 330,260 310,275 240,275", cx: 275, cy: 230 },
  { id: 3, label: "Người #1", color: "#f59e0b", points: "400,260 405,160 420,120 440,110 460,120 475,160 480,260 460,270 420,270", cx: 440, cy: 190 },
  { id: 4, label: "Người #2", color: "#ec4899", points: "510,250 515,170 525,135 540,125 555,135 565,170 570,250 555,260 525,260", cx: 540, cy: 195 },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Instance Segmentation kết hợp khả năng của hai tác vụ nào?",
    options: [
      "Image Classification + Data Augmentation",
      "Object Detection (bounding box) + Semantic Segmentation (pixel mask)",
      "Style Transfer + Feature Extraction",
      "Optical Flow + Color Spaces",
    ],
    correct: 1,
    explanation:
      "Instance Segmentation = Object Detection (tìm từng đối tượng) + Semantic Segmentation (mask pixel-level). Kết quả: mỗi đối tượng có mask riêng biệt.",
  },
  {
    question: "Mask R-CNN thêm gì so với Faster R-CNN?",
    options: [
      "Thêm lớp fully connected lớn hơn",
      "Thêm nhánh dự đoán mask cho mỗi vùng đề xuất",
      "Thêm nhiều anchor box hơn",
      "Thay đổi hoàn toàn kiến trúc",
    ],
    correct: 1,
    explanation:
      "Mask R-CNN giữ nguyên Faster R-CNN (box + class) và thêm 1 nhánh song song dự đoán binary mask cho mỗi Region of Interest (RoI).",
  },
  {
    question: "SAM (Segment Anything Model) của Meta có gì đặc biệt?",
    options: [
      "Chỉ hoạt động trên ảnh y tế",
      "Có thể phân đoạn bất kỳ đối tượng nào mà không cần huấn luyện trên lớp đó",
      "Nhanh gấp 100 lần Mask R-CNN",
      "Chỉ hỗ trợ ảnh đen trắng",
    ],
    correct: 1,
    explanation:
      "SAM là foundation model cho segmentation: huấn luyện trên 11M ảnh, 1B+ masks, có thể phân đoạn đối tượng mới (zero-shot) chỉ bằng click hoặc box prompt.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function InstanceSegmentationTopic() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <>
      {/* Step 1: Hook */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Ảnh camera giao thông có 3 chiếc xe máy đỗ sát nhau. Semantic Segmentation tô tất cả cùng màu 'xe'. Làm sao phân biệt xe #1, #2, #3?"
          options={[
            "Dùng Object Detection để vẽ 3 bounding box",
            "Dùng Instance Segmentation: mỗi xe có mask pixel riêng biệt",
            "Không thể phân biệt được",
          ]}
          correct={1}
          explanation="Instance Segmentation tô MÀU RIÊNG cho từng xe: xe #1 xanh, xe #2 đỏ, xe #3 vàng. Mỗi thể hiện (instance) có mask pixel-level riêng biệt!"
        >

      {/* Step 2: Discover */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <p className="text-sm text-muted text-center">
              Nhấn vào từng đối tượng để highlight. Mỗi instance có mask và màu riêng!
            </p>

            <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
              <rect x="0" y="0" width="600" height="300" rx="8" fill="#0f172a" />
              {/* Road */}
              <rect x="0" y="200" width="600" height="100" fill="#1e293b" opacity={0.5} />

              {INSTANCES.map((inst) => {
                const isSelected = selectedId === inst.id;
                const dimmed = selectedId !== null && !isSelected;
                return (
                  <g
                    key={inst.id}
                    onClick={() => setSelectedId(isSelected ? null : inst.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <polygon
                      points={inst.points}
                      fill={inst.color}
                      opacity={dimmed ? 0.15 : 0.5}
                      stroke={inst.color}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    <text
                      x={inst.cx} y={inst.cy}
                      textAnchor="middle" fill="white"
                      fontSize="10" fontWeight="bold"
                      opacity={dimmed ? 0.3 : 1}
                    >
                      {inst.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {selectedId && (
              <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
                <p className="text-sm text-muted">
                  Đã chọn:{" "}
                  <strong className="text-accent">
                    {INSTANCES.find((i) => i.id === selectedId)?.label}
                  </strong>{" "}
                  -- Mỗi thể hiện có mask (mặt nạ pixel) riêng biệt + bounding box + nhãn lớp
                </p>
              </div>
            )}

            {/* Comparison */}
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { name: "Classification", desc: "1 nhãn cho cả ảnh", color: "#3b82f6" },
                { name: "Detection", desc: "Bounding box + nhãn", color: "#22c55e" },
                { name: "Semantic Seg.", desc: "Pixel-level, cùng màu", color: "#f59e0b" },
                { name: "Instance Seg.", desc: "Pixel-level, MÀU RIÊNG", color: "#8b5cf6" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="rounded-lg border p-3 text-center w-[130px]"
                  style={{ borderColor: item.color }}
                >
                  <p className="text-xs font-bold" style={{ color: item.color }}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* Step 3: Aha */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Instance Segmentation = <strong>Object Detection</strong>{" "}(tìm từng đối tượng) +{" "}
            <strong>Semantic Segmentation</strong>{" "}(mask pixel-level). Kết quả: mỗi đối tượng có{" "}
            <strong>bounding box + nhãn + mask pixel riêng biệt</strong> -- giống như điểm danh
            từng học sinh trong lớp bằng cách tô màu riêng!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* Step 4: Challenge */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Mask R-CNN dự đoán mask riêng cho mỗi đối tượng. Điều gì xảy ra khi 2 người đi bộ che khuất nhau (occlusion)?"
          options={[
            "Mô hình chỉ nhận ra 1 người",
            "Mask của 2 người có thể chồng lấp -- mỗi pixel thuộc mask gần nhất",
            "Mask R-CNN không xử lý được occlusion",
          ]}
          correct={1}
          explanation="Mask R-CNN dự đoán mask ĐỘC LẬP cho mỗi RoI, nên 2 mask có thể chồng lấp. Pixel chồng lấp thường được gán cho instance có confidence cao hơn hoặc diện tích mask nhỏ hơn (foreground priority)."
        />
      </LessonSection>

      {/* Step 5: Explain */}
      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Instance Segmentation</strong>{" "}kết hợp phát hiện đối tượng và phân đoạn ngữ nghĩa -- không chỉ tô màu
            theo danh mục mà còn <strong>phân biệt từng thể hiện</strong>{" "}riêng lẻ.
          </p>

          <Callout variant="insight" title="Kiến trúc Mask R-CNN">
            <p className="text-sm">Mask R-CNN mở rộng Faster R-CNN bằng 1 nhánh mask song song:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
              <li><strong>Backbone + FPN:</strong>{" "}Trích xuất đặc trưng đa tỷ lệ</li>
              <li><strong>RPN:</strong>{" "}Đề xuất vùng ứng viên (Region Proposals)</li>
              <li><strong>RoIAlign:</strong>{" "}Cắt feature map cho mỗi vùng (không làm tròn để giữ chính xác)</li>
              <li><strong>3 nhánh song song:</strong>{" "}Box regression + Classification + <strong>Binary Mask</strong></li>
            </ol>
          </Callout>

          <p><strong>Hàm mất mát</strong>{" "}Mask R-CNN:</p>
          <LaTeX block>{"\\mathcal{L} = \\mathcal{L}_{cls} + \\mathcal{L}_{box} + \\mathcal{L}_{mask}"}</LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"\\mathcal{L}_{mask}"}</LaTeX> là binary cross-entropy trên mask <LaTeX>{"28 \\times 28"}</LaTeX>{" "}
            cho mỗi RoI, chỉ tính cho lớp ground-truth (class-specific mask).
          </p>

          <p><strong>Các phương pháp nổi bật:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Mask R-CNN</strong>{" "}(2017): Two-stage, phổ biến nhất, baseline mạnh</li>
            <li><strong>YOLACT</strong>{" "}(2019): One-stage, real-time, sinh mask bằng prototype + coefficients</li>
            <li><strong>SAM</strong>{" "}(2023): Segment Anything -- foundation model, zero-shot segmentation</li>
            <li><strong>SAM 2</strong>{" "}(2024): Mở rộng SAM cho video, tracking + segmentation</li>
          </ul>

          <Callout variant="warning" title="Ứng dụng thực tế">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Robot:</strong>{" "}Gắp đồ vật trên dây chuyền -- cần mask chính xác từng vật</li>
              <li><strong>Thương mại điện tử:</strong>{" "}Tự động tách nền sản phẩm trên Shopee</li>
              <li><strong>Y tế:</strong>{" "}Đếm và đo từng tế bào riêng biệt trong ảnh hiển vi</li>
              <li><strong>Nông nghiệp:</strong>{" "}Đếm từng quả trên cây từ ảnh drone</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Instance Segmentation với SAM (Segment Anything)">
{`from segment_anything import sam_model_registry, SamPredictor
import cv2
import numpy as np

# Load SAM model
sam = sam_model_registry["vit_h"](
    checkpoint="sam_vit_h.pth"
)
predictor = SamPredictor(sam)

# Đọc ảnh và set image
image = cv2.imread("duong_pho.jpg")
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
predictor.set_image(image_rgb)

# Prompt: click vào tâm xe máy (x=200, y=300)
input_point = np.array([[200, 300]])
input_label = np.array([1])  # 1 = foreground

masks, scores, logits = predictor.predict(
    point_coords=input_point,
    point_labels=input_label,
    multimask_output=True,  # 3 masks ứng viên
)

# Chọn mask có score cao nhất
best_mask = masks[scores.argmax()]
print(f"Mask shape: {best_mask.shape}")  # (H, W) boolean
print(f"Score: {scores.max():.3f}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* Step 6: Summary */}
      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Instance Segmentation = Detection + Segmentation: mỗi đối tượng có mask pixel riêng biệt",
          "Mask R-CNN: thêm nhánh mask vào Faster R-CNN, dùng RoIAlign để giữ chính xác pixel",
          "SAM (Segment Anything): foundation model, zero-shot -- chỉ cần click là phân đoạn",
          "Ứng dụng khi cần phân biệt từng thể hiện: robot gắp đồ, đếm tế bào, tách nền sản phẩm",
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
