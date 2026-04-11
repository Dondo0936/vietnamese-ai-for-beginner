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
  slug: "iou",
  title: "IoU - Intersection over Union",
  titleVi: "IoU - Giao trên hợp",
  description:
    "Chỉ số đo mức độ trùng khớp giữa hai bounding box, nền tảng đánh giá phát hiện đối tượng.",
  category: "computer-vision",
  tags: ["computer-vision", "evaluation", "metric"],
  difficulty: "beginner",
  relatedSlugs: ["object-detection", "nms", "anchor-boxes"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "IoU = 0.75 có nghĩa là gì?",
    options: [
      "Hai box trùng khớp 75% -- diện tích giao chiếm 75% diện tích hợp",
      "Box dự đoán nhỏ hơn ground truth 75%",
      "Mô hình đúng 75% thời gian",
      "Ảnh có 75% pixel thuộc đối tượng",
    ],
    correct: 0,
    explanation: "IoU = Giao / Hợp = 0.75 nghĩa là vùng chồng lấp chiếm 75% tổng diện tích của cả 2 box. Đây là mức rất tốt!",
  },
  {
    question: "COCO benchmark dùng mAP@[0.5:0.95]. Điều này có nghĩa gì?",
    options: [
      "Chỉ tính detection đúng khi IoU > 0.95",
      "Tính mAP ở nhiều ngưỡng IoU (0.5, 0.55, 0.6, ..., 0.95) rồi lấy trung bình",
      "Đánh giá trên 50-95% dữ liệu test",
      "IoU phải nằm giữa 0.5 và 0.95",
    ],
    correct: 1,
    explanation: "COCO tính mAP trung bình trên 10 ngưỡng IoU từ 0.5 đến 0.95 (bước 0.05). Khắt khe hơn PASCAL VOC (chỉ dùng IoU=0.5) vì đòi hỏi box chính xác ở nhiều mức.",
  },
  {
    question: "Tại sao GIoU tốt hơn IoU khi dùng làm loss function?",
    options: [
      "GIoU nhanh hơn khi tính toán",
      "GIoU cho gradient khác 0 ngay cả khi 2 box không giao nhau",
      "GIoU không cần bounding box",
      "GIoU chính xác hơn cho ảnh lớn",
    ],
    correct: 1,
    explanation: "Khi 2 box không giao: IoU = 0, gradient = 0 -- mô hình không học được! GIoU xét thêm diện tích bao đóng (enclosing box), cho gradient khác 0 để mô hình biết cần di chuyển box về phía nào.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function IoUTopic() {
  const [boxAx, setBoxAx] = useState(100);
  const [boxAy, setBoxAy] = useState(60);
  const [boxBx, setBoxBx] = useState(200);
  const [boxBy, setBoxBy] = useState(100);
  const boxW = 180;
  const boxH = 140;

  const iou = useMemo(() => {
    const x1 = Math.max(boxAx, boxBx);
    const y1 = Math.max(boxAy, boxBy);
    const x2 = Math.min(boxAx + boxW, boxBx + boxW);
    const y2 = Math.min(boxAy + boxH, boxBy + boxH);
    const interW = Math.max(0, x2 - x1);
    const interH = Math.max(0, y2 - y1);
    const intersection = interW * interH;
    const union = boxW * boxH * 2 - intersection;
    return union > 0 ? intersection / union : 0;
  }, [boxAx, boxAy, boxBx, boxBy, boxW, boxH]);

  const iouColor = iou > 0.7 ? "#22c55e" : iou > 0.4 ? "#f59e0b" : "#ef4444";
  const iouLabel = iou > 0.7 ? "Tốt" : iou > 0.4 ? "Trung bình" : "Kém";

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Mô hình dự đoán bounding box cho chiếc xe máy. Box dự đoán lệch sang phải một chút so với box thật. Làm sao đo mức chính xác?"
          options={[
            "Đo khoảng cách giữa 2 tâm box",
            "Tính tỷ lệ diện tích GIAO NHAU chia cho diện tích HỢP",
            "So sánh chiều rộng 2 box",
          ]}
          correct={1}
          explanation="IoU = Giao / Hợp. Đo cả VỊ TRÍ lẫn KÍCH THƯỚC: 2 box trùng hoàn hảo -> IoU = 1.0, không chạm nhau -> IoU = 0. Đơn giản, trực giác, và scale-invariant!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">Box A - X: {boxAx}</label>
                <input type="range" min="20" max="350" value={boxAx}
                  onChange={(e) => setBoxAx(parseInt(e.target.value))} className="w-full accent-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">Box A - Y: {boxAy}</label>
                <input type="range" min="10" max="200" value={boxAy}
                  onChange={(e) => setBoxAy(parseInt(e.target.value))} className="w-full accent-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">Box B - X: {boxBx}</label>
                <input type="range" min="20" max="350" value={boxBx}
                  onChange={(e) => setBoxBx(parseInt(e.target.value))} className="w-full accent-green-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">Box B - Y: {boxBy}</label>
                <input type="range" min="10" max="200" value={boxBy}
                  onChange={(e) => setBoxBy(parseInt(e.target.value))} className="w-full accent-green-500" />
              </div>
            </div>

            <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
              <rect x="0" y="0" width="600" height="320" rx="8" fill="#0f172a" />
              {(() => {
                const x1 = Math.max(boxAx, boxBx);
                const y1 = Math.max(boxAy, boxBy);
                const x2 = Math.min(boxAx + boxW, boxBx + boxW);
                const y2 = Math.min(boxAy + boxH, boxBy + boxH);
                if (x2 > x1 && y2 > y1) {
                  return <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="#f59e0b" opacity={0.5} />;
                }
                return null;
              })()}
              <rect x={boxAx} y={boxAy} width={boxW} height={boxH}
                fill="none" stroke="#3b82f6" strokeWidth="2.5" />
              <text x={boxAx + 5} y={boxAy + 16} fill="#3b82f6" fontSize="11" fontWeight="bold">
                Ground Truth
              </text>
              <rect x={boxBx} y={boxBy} width={boxW} height={boxH}
                fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="6,3" />
              <text x={boxBx + 5} y={boxBy + boxH - 5} fill="#22c55e" fontSize="11" fontWeight="bold">
                Dự đoán
              </text>

              <rect x="430" y="10" width="150" height="70" rx="10"
                fill={iouColor} opacity={0.15} stroke={iouColor} strokeWidth="1.5" />
              <text x="505" y="35" textAnchor="middle" fill="#94a3b8" fontSize="11">IoU</text>
              <text x="505" y="60" textAnchor="middle" fill={iouColor} fontSize="22" fontWeight="bold">
                {iou.toFixed(3)}
              </text>
              <text x="505" y="75" textAnchor="middle" fill={iouColor} fontSize="10">{iouLabel}</text>
              <text x="300" y="300" textAnchor="middle" fill="#64748b" fontSize="11">
                IoU = Diện tích giao (vàng) / Diện tích hợp
              </text>
            </svg>
            <p className="text-sm text-muted text-center">
              Kéo thanh trượt để di chuyển 2 box. Vùng vàng = diện tích giao nhau.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            IoU đo <strong>cả vị trí lẫn kích thước</strong>{" "}trong 1 con số duy nhất (0 đến 1).
            Giống như <strong>cho điểm bài thi</strong>: IoU &ge; 0.5 là <strong>đạt</strong> (PASCAL VOC),
            IoU &ge; 0.75 là <strong>giỏi</strong>, IoU = 1.0 là <strong>hoàn hảo</strong>.
            Scale-invariant: box lớn hay nhỏ đều đánh giá công bằng!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="2 box không giao nhau (IoU = 0). Nếu dùng IoU làm loss function, gradient = 0 -- mô hình không học được! Giải pháp?"
          options={[
            "Dùng L1 loss thay vì IoU loss",
            "Dùng GIoU: xét thêm diện tích bao đóng (enclosing box) để có gradient khác 0",
            "Tăng learning rate lên rất cao",
          ]}
          correct={1}
          explanation="GIoU = IoU - (diện tích phần thừa trong enclosing box) / (diện tích enclosing box). Khi 2 box xa nhau, GIoU < 0 nhưng gradient khác 0 -- mô hình biết cần kéo box lại gần nhau!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>IoU (Intersection over Union)</strong>{" "}là chỉ số nền tảng trong phát hiện đối tượng,
            đo mức trùng khớp giữa box dự đoán và ground truth.
          </p>

          <p><strong>Công thức:</strong></p>
          <LaTeX block>{"\\text{IoU} = \\frac{|A \\cap B|}{|A \\cup B|} = \\frac{\\text{Intersection}}{\\text{Union}}"}</LaTeX>

          <Callout variant="insight" title="Các biến thể IoU dùng làm Loss">
            <div className="space-y-2 text-sm">
              <p><strong>GIoU:</strong>{" "}<LaTeX>{"\\text{GIoU} = \\text{IoU} - \\frac{|C \\setminus (A \\cup B)|}{|C|}"}</LaTeX> -- C là enclosing box. Gradient khác 0 khi 2 box không giao.</p>
              <p><strong>DIoU:</strong>{" "}Thêm penalty khoảng cách tâm: <LaTeX>{"\\text{DIoU} = \\text{IoU} - \\frac{d^2}{c^2}"}</LaTeX></p>
              <p><strong>CIoU:</strong>{" "}Thêm penalty tỷ lệ khung hình (aspect ratio) -- tốt nhất cho regression.</p>
            </div>
          </Callout>

          <Callout variant="warning" title="IoU trong đánh giá mô hình">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>PASCAL VOC:</strong>{" "}mAP@0.5 -- detection đúng khi IoU &ge; 0.5</li>
              <li><strong>COCO:</strong>{" "}mAP@[0.5:0.95] -- trung bình 10 ngưỡng, khắt khe hơn</li>
              <li><strong>Trong NMS:</strong>{" "}Loại box có IoU &gt; ngưỡng với box tốt nhất</li>
              <li><strong>Trong huấn luyện:</strong>{" "}Gán anchor với ground truth có IoU cao nhất</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Tính IoU và các biến thể">
{`import torch
from torchvision.ops import (
    box_iou,
    generalized_box_iou,
    distance_box_iou,
    complete_box_iou,
)

# Boxes format: [x1, y1, x2, y2]
gt = torch.tensor([[100, 60, 280, 200]], dtype=torch.float)
pred = torch.tensor([[200, 100, 380, 240]], dtype=torch.float)

# IoU cơ bản
iou = box_iou(gt, pred)
print(f"IoU: {iou.item():.3f}")

# GIoU (dùng làm loss)
giou = generalized_box_iou(gt, pred)
giou_loss = 1 - giou  # loss = 1 - GIoU

# DIoU (xét khoảng cách tâm)
diou = distance_box_iou(gt, pred)

# CIoU (xét cả aspect ratio)
ciou = complete_box_iou(gt, pred)
ciou_loss = 1 - ciou  # loss tốt nhất cho box regression`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "IoU = Giao / Hợp: đo mức trùng khớp 2 box trong 1 con số (0 = không chạm, 1 = trùng hoàn hảo)",
          "Ngưỡng phổ biến: IoU >= 0.5 (đạt), >= 0.75 (giỏi). COCO dùng trung bình 10 ngưỡng",
          "GIoU, DIoU, CIoU: biến thể dùng làm loss function, cho gradient khác 0 khi box xa nhau",
          "IoU dùng trong: đánh giá mAP, NMS, gán anchor, loss function -- chỉ số nền tảng nhất",
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
