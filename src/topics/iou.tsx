"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
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
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn và bạn bè cùng vẽ <strong>vòng tròn</strong>{" "}
          bao quanh con mèo trong ảnh. Làm sao biết ai vẽ chính xác hơn?
        </p>
        <p>
          IoU cho câu trả lời: nó đo <strong>phần giao nhau</strong> (vùng
          chồng lặp) chia cho <strong>phần hợp</strong> (tổng diện tích). Nếu
          hai vòng tròn trùng khớp hoàn toàn → IoU = 1.0 (hoàn hảo). Nếu không
          chạm nhau → IoU = 0 (hoàn toàn sai).
        </p>
        <p>
          Giống như cho điểm bài thi — IoU ≥ 0.5 thường được coi là{" "}
          <strong>&quot;đạt&quot;</strong> trong phát hiện đối tượng!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Box A - X: {boxAx}
              </label>
              <input
                type="range"
                min="20"
                max="350"
                value={boxAx}
                onChange={(e) => setBoxAx(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Box A - Y: {boxAy}
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={boxAy}
                onChange={(e) => setBoxAy(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Box B - X: {boxBx}
              </label>
              <input
                type="range"
                min="20"
                max="350"
                value={boxBx}
                onChange={(e) => setBoxBx(parseInt(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Box B - Y: {boxBy}
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={boxBy}
                onChange={(e) => setBoxBy(parseInt(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>
          </div>

          <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
            <rect x="0" y="0" width="600" height="320" rx="8" fill="#0f172a" />

            {/* Intersection */}
            {(() => {
              const x1 = Math.max(boxAx, boxBx);
              const y1 = Math.max(boxAy, boxBy);
              const x2 = Math.min(boxAx + boxW, boxBx + boxW);
              const y2 = Math.min(boxAy + boxH, boxBy + boxH);
              if (x2 > x1 && y2 > y1) {
                return (
                  <rect
                    x={x1}
                    y={y1}
                    width={x2 - x1}
                    height={y2 - y1}
                    fill="#f59e0b"
                    opacity={0.5}
                  />
                );
              }
              return null;
            })()}

            {/* Box A */}
            <rect
              x={boxAx}
              y={boxAy}
              width={boxW}
              height={boxH}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
            />
            <text x={boxAx + 5} y={boxAy + 16} fill="#3b82f6" fontSize="11" fontWeight="bold">
              Ground Truth (A)
            </text>

            {/* Box B */}
            <rect
              x={boxBx}
              y={boxBy}
              width={boxW}
              height={boxH}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeDasharray="6,3"
            />
            <text x={boxBx + 5} y={boxBy + boxH - 5} fill="#22c55e" fontSize="11" fontWeight="bold">
              Dự đoán (B)
            </text>

            {/* IoU display */}
            <rect
              x="430"
              y="10"
              width="150"
              height="70"
              rx="10"
              fill={iouColor}
              opacity={0.15}
              stroke={iouColor}
              strokeWidth="1.5"
            />
            <text x="505" y="35" textAnchor="middle" fill="#94a3b8" fontSize="11">
              IoU
            </text>
            <text x="505" y="60" textAnchor="middle" fill={iouColor} fontSize="22" fontWeight="bold">
              {iou.toFixed(3)}
            </text>
            <text x="505" y="75" textAnchor="middle" fill={iouColor} fontSize="10">
              {iouLabel}
            </text>

            {/* Formula */}
            <text x="300" y="300" textAnchor="middle" fill="#64748b" fontSize="11">
              IoU = Diện tích giao (vàng) / Diện tích hợp = {iou.toFixed(3)}
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>IoU (Intersection over Union)</strong> là chỉ số đo mức độ
          trùng khớp giữa bounding box dự đoán và ground truth. Giá trị từ 0
          (không trùng) đến 1 (trùng hoàn toàn).
        </p>
        <p>Cách tính và ứng dụng:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Công thức:</strong> IoU = Diện tích giao / Diện tích hợp
            = Intersection / Union.
          </li>
          <li>
            <strong>Ngưỡng phổ biến:</strong> IoU ≥ 0.5 (PASCAL VOC),
            IoU ≥ 0.5:0.95 (COCO mAP) để đánh giá dự đoán đúng/sai.
          </li>
          <li>
            <strong>Trong NMS:</strong> Loại bỏ box có IoU cao với box tốt nhất
            để giảm trùng lặp.
          </li>
          <li>
            <strong>Trong huấn luyện:</strong> Gán anchor box với ground truth
            có IoU cao nhất để tạo positive samples.
          </li>
        </ol>
        <p>
          Biến thể: <strong>GIoU</strong> (Generalized IoU) xử lý trường hợp
          không giao nhau; <strong>DIoU</strong> thêm khoảng cách tâm;{" "}
          <strong>CIoU</strong> thêm tỷ lệ khung hình — đều dùng làm loss
          function tốt hơn L1/L2.
        </p>
      </ExplanationSection>
    </>
  );
}
