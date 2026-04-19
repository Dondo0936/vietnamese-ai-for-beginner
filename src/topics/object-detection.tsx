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
  slug: "object-detection",
  title: "Object Detection",
  titleVi: "Phát hiện đối tượng",
  description:
    "Tác vụ xác định vị trí và phân loại nhiều đối tượng trong hình ảnh bằng bounding box.",
  category: "computer-vision",
  tags: ["computer-vision", "detection", "bounding-box"],
  difficulty: "intermediate",
  relatedSlugs: ["image-classification", "anchor-boxes", "nms", "iou"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
const OBJECTS = [
  { label: "Xe máy", x: 50, y: 60, w: 140, h: 110, color: "#3b82f6", conf: 0.95 },
  { label: "Người", x: 220, y: 30, w: 90, h: 190, color: "#22c55e", conf: 0.91 },
  { label: "Ô tô", x: 370, y: 70, w: 160, h: 120, color: "#f59e0b", conf: 0.88 },
  { label: "Biển số", x: 400, y: 150, w: 80, h: 30, color: "#ef4444", conf: 0.73 },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Mỗi dự đoán của mô hình Object Detection bao gồm những gì?",
    options: [
      "Chỉ nhãn lớp của đối tượng",
      "Toạ độ bounding box (x, y, w, h) + nhãn lớp + điểm tin cậy",
      "Mask pixel-level cho đối tượng",
      "Chỉ vị trí tâm đối tượng",
    ],
    correct: 1,
    explanation:
      "Mỗi detection gồm 3 thành phần: bounding box (vị trí + kích thước), nhãn lớp (đây là gì), và confidence score (mô hình tự tin bao nhiêu).",
  },
  {
    question: "YOLO thuộc trường phái nào trong Object Detection?",
    options: [
      "Two-stage (hai giai đoạn)",
      "One-stage (một giai đoạn)",
      "Anchor-free",
      "Transformer-based",
    ],
    correct: 1,
    explanation:
      "YOLO (You Only Look Once) là mô hình one-stage tiêu biểu -- dự đoán bounding box và nhãn trong MỘT lần duyệt mạng, đạt tốc độ real-time.",
  },
  {
    question:
      "Camera giao thông ở Việt Nam cần phát hiện vi phạm thời gian thực. Nên dùng trường phái nào?",
    options: [
      "Two-stage (Faster R-CNN) vì chính xác hơn",
      "One-stage (YOLO) vì nhanh hơn, phù hợp real-time",
      "Cả hai đều không phù hợp",
      "Chỉ cần Image Classification",
    ],
    correct: 1,
    explanation:
      "Camera giao thông cần xử lý real-time (30+ FPS). YOLO đạt 30-150 FPS tuỳ phiên bản, phù hợp hơn Faster R-CNN (5-15 FPS) cho bài toán này.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function ObjectDetectionTopic() {
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [confThreshold, setConfThreshold] = useState(0.5);

  const filtered = useMemo(
    () => OBJECTS.filter((o) => o.conf >= confThreshold),
    [confThreshold]
  );

  return (
    <>
      {/* Step 1: Hook */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Camera giao thông trên phố Nguyễn Trãi ghi nhận ảnh có 3 xe máy, 1 ô tô, 2 người đi bộ. Image Classification có thể xử lý việc này không?"
          options={[
            "Được, gán nhãn 'giao thông' cho ảnh",
            "Không, vì cần tìm VỊ TRÍ từng đối tượng riêng biệt",
            "Được, chỉ cần chạy classification nhiều lần",
          ]}
          correct={1}
          explanation="Classification chỉ gán 1 nhãn cho cả ảnh. Ở đây ta cần tìm VỊ TRÍ + LOẠI từng đối tượng. Đó chính là Object Detection!"
        >

      {/* Step 2: Discover */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <button
                type="button"
                onClick={() => setShowBoxes(!showBoxes)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  showBoxes ? "bg-accent text-white" : "bg-card border border-border text-muted"
                }`}
              >
                {showBoxes ? "Ẩn khung" : "Hiện khung"}
              </button>
              <button
                type="button"
                onClick={() => setShowLabels(!showLabels)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  showLabels ? "bg-accent text-white" : "bg-card border border-border text-muted"
                }`}
              >
                {showLabels ? "Ẩn nhãn" : "Hiện nhãn"}
              </button>
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-muted">
                  Ngưỡng tin cậy: {confThreshold.toFixed(2)}
                </label>
                <input
                  type="range" min="0.1" max="1" step="0.05"
                  value={confThreshold}
                  onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>

            <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
              <rect x="0" y="0" width="600" height="280" rx="8" fill="#0f172a" />
              <text x="300" y="140" textAnchor="middle" fill="#1e293b" fontSize="32" fontWeight="bold">
                Camera Giao Thông
              </text>

              {/* Object shapes */}
              <rect x="70" y="80" width="100" height="70" rx="6" fill="#334155" opacity={0.4} />
              <rect x="240" y="40" width="50" height="160" rx="4" fill="#334155" opacity={0.4} />
              <rect x="390" y="80" width="120" height="90" rx="6" fill="#334155" opacity={0.4} />

              {showBoxes && filtered.map((obj) => (
                <g key={obj.label}>
                  <rect
                    x={obj.x} y={obj.y} width={obj.w} height={obj.h}
                    fill="none" stroke={obj.color} strokeWidth="2.5" rx="3"
                  />
                  {showLabels && (
                    <>
                      <rect
                        x={obj.x} y={obj.y - 18}
                        width={obj.label.length * 9 + 45} height="18"
                        fill={obj.color} rx="3"
                      />
                      <text x={obj.x + 4} y={obj.y - 4} fill="white" fontSize="11" fontWeight="bold">
                        {obj.label} {(obj.conf * 100).toFixed(0)}%
                      </text>
                    </>
                  )}
                </g>
              ))}
              <text x="10" y="270" fill="#64748b" fontSize="11">
                Phát hiện: {filtered.length} đối tượng (ngưỡng: {(confThreshold * 100).toFixed(0)}%)
              </text>
            </svg>

            <p className="text-sm text-muted text-center">
              Kéo thanh ngưỡng lên cao -- các box kém tin cậy bị loại. Đây là cách lọc nhiễu trong thực tế!
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* Step 3: Aha */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Object Detection = <strong>Classification</strong>{" "}(đây là cái gì?) + <strong>Localization</strong>{" "}(nó ở đâu?).
            Mỗi đối tượng được mô tả bằng bộ ba: <strong>bounding box</strong>{" "}(x, y, w, h) +{" "}
            <strong>nhãn lớp</strong> + <strong>confidence score</strong>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* Step 4: Challenge */}
      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="YOLO dự đoán 300 bounding box cho 1 ảnh, nhiều box chồng chéo trên cùng 1 chiếc xe. Cần làm gì để chỉ giữ 1 box tốt nhất?"
          options={[
            "Giảm ngưỡng confidence xuống thấp hơn",
            "Dùng NMS (Non-Maximum Suppression) để loại box trùng lặp",
            "Huấn luyện lại mô hình với ít anchor hơn",
          ]}
          correct={1}
          explanation="NMS giữ box có confidence cao nhất, rồi loại tất cả box chồng lấp (IoU > ngưỡng). Đây là bước hậu xử lý bắt buộc trong mọi detector!"
        />
      </LessonSection>

      {/* Step 5: Explain */}
      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Object Detection</strong>{" "}là tác vụ vừa xác định vị trí (bounding box) vừa phân loại
            các đối tượng trong ảnh. Khác với Image Classification chỉ gán 1 nhãn cho cả ảnh.
          </p>

          <Callout variant="insight" title="Hai trường phái chính">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-blue-400">Two-stage (R-CNN, Faster R-CNN)</p>
                <p className="text-sm">Bước 1: Đề xuất vùng ứng viên (Region Proposal). Bước 2: Phân loại + tinh chỉnh box. Chính xác cao nhưng chậm (5-15 FPS).</p>
              </div>
              <div>
                <p className="font-semibold text-green-400">One-stage (YOLO, SSD)</p>
                <p className="text-sm">Dự đoán box + nhãn trong 1 lần duyệt mạng. Nhanh (30-150 FPS), phù hợp real-time.</p>
              </div>
            </div>
          </Callout>

          <p><strong>Hàm mất mát</strong>{" "}gồm 2 phần:</p>
          <LaTeX block>{"\\mathcal{L} = \\mathcal{L}_{cls} + \\lambda \\cdot \\mathcal{L}_{bbox}"}</LaTeX>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><LaTeX>{"\\mathcal{L}_{cls}"}</LaTeX>: Cross-entropy cho phân loại nhãn</li>
            <li><LaTeX>{"\\mathcal{L}_{bbox}"}</LaTeX>: Smooth L1 hoặc IoU loss cho toạ độ bounding box</li>
          </ul>

          <Callout variant="warning" title="Ứng dụng thực tế tại Việt Nam">
            <ul className="list-disc list-inside space-y-1">
              <li>Camera giao thông phát hiện vi phạm đèn đỏ (YOLO + biển số)</li>
              <li>Hệ thống đếm xe trên cao tốc Bắc-Nam</li>
              <li>Phát hiện sản phẩm trên kệ hàng siêu thị (inventory management)</li>
              <li>Nhận diện khuôn mặt trong CCCD tại quầy eKYC</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Object Detection với YOLOv8 (Ultralytics)">
{`from ultralytics import YOLO

# Load pretrained YOLOv8
model = YOLO("yolov8n.pt")  # nano version, nhanh nhất

# Phát hiện đối tượng trong ảnh
results = model("camera_giao_thong.jpg")

# Duyệt qua các detection
for box in results[0].boxes:
    x1, y1, x2, y2 = box.xyxy[0]  # toạ độ
    conf = box.conf[0]              # confidence
    cls = int(box.cls[0])           # class index
    name = model.names[cls]         # class name
    print(f"{name}: {conf:.2%} at ({x1:.0f},{y1:.0f})-({x2:.0f},{y2:.0f})")

# Lưu ảnh kết quả
results[0].save("result.jpg")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* Step 6: Summary */}
      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Object Detection = Classification + Localization: tìm VỊ TRÍ (bounding box) + LOẠI (nhãn) từng đối tượng",
          "Two-stage (Faster R-CNN): chính xác nhưng chậm. One-stage (YOLO): nhanh, phù hợp real-time",
          "Mỗi dự đoán gồm: toạ độ (x, y, w, h) + nhãn lớp + confidence score",
          "NMS là bước hậu xử lý bắt buộc để loại bỏ box trùng lặp",
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
