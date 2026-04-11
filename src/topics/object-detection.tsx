"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
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

const OBJECTS = [
  { label: "Mèo", x: 60, y: 50, w: 140, h: 120, color: "#3b82f6", conf: 0.95 },
  { label: "Chó", x: 280, y: 80, w: 130, h: 150, color: "#22c55e", conf: 0.88 },
  { label: "Người", x: 450, y: 20, w: 100, h: 200, color: "#f59e0b", conf: 0.92 },
  { label: "Bóng", x: 350, y: 250, w: 60, h: 60, color: "#ef4444", conf: 0.73 },
];

export default function ObjectDetectionTopic() {
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [confThreshold, setConfThreshold] = useState(0.5);

  const filtered = OBJECTS.filter((o) => o.conf >= confThreshold);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>nhân viên an ninh</strong> theo dõi
          camera giám sát. Bạn không chỉ nhận biết &quot;có người trong ảnh&quot; mà
          phải <strong>chỉ ra chính xác vị trí</strong> của từng người bằng
          cách vẽ khung bao quanh họ.
        </p>
        <p>
          Object Detection vừa <strong>phân loại</strong> (đây là cái gì?) vừa{" "}
          <strong>định vị</strong> (nó ở đâu?) — mỗi đối tượng được khoanh vùng
          bằng một hình chữ nhật (bounding box) kèm nhãn và độ tin cậy.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                showBoxes
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted"
              }`}
            >
              {showBoxes ? "Ẩn khung" : "Hiện khung"}
            </button>
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                showLabels
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted"
              }`}
            >
              {showLabels ? "Ẩn nhãn" : "Hiện nhãn"}
            </button>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted">
                Ngưỡng tin cậy: {confThreshold.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          <svg viewBox="0 0 600 340" className="w-full max-w-2xl mx-auto">
            {/* Background representing image */}
            <rect x="0" y="0" width="600" height="340" rx="8" fill="#0f172a" />
            <text x="300" y="170" textAnchor="middle" fill="#1e293b" fontSize="40" fontWeight="bold">
              HÌNH ẢNH
            </text>

            {/* Scene elements (simple shapes representing objects) */}
            <ellipse cx="130" cy="120" rx="50" ry="40" fill="#334155" opacity={0.5} />
            <ellipse cx="345" cy="165" rx="45" ry="55" fill="#334155" opacity={0.5} />
            <rect x="475" y="40" width="50" height="160" rx="8" fill="#334155" opacity={0.5} />
            <circle cx="380" cy="280" r="25" fill="#334155" opacity={0.5} />

            {/* Bounding boxes */}
            {showBoxes &&
              filtered.map((obj) => (
                <g key={obj.label}>
                  <rect
                    x={obj.x}
                    y={obj.y}
                    width={obj.w}
                    height={obj.h}
                    fill="none"
                    stroke={obj.color}
                    strokeWidth="2.5"
                    rx="3"
                  />
                  {showLabels && (
                    <>
                      <rect
                        x={obj.x}
                        y={obj.y - 18}
                        width={obj.label.length * 8 + 45}
                        height="18"
                        fill={obj.color}
                        rx="3"
                      />
                      <text
                        x={obj.x + 4}
                        y={obj.y - 4}
                        fill="white"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {obj.label} {(obj.conf * 100).toFixed(0)}%
                      </text>
                    </>
                  )}
                </g>
              ))}

            {/* Stats */}
            <text x="10" y="330" fill="#64748b" fontSize="10">
              Phát hiện: {filtered.length} đối tượng (ngưỡng: {(confThreshold * 100).toFixed(0)}%)
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Object Detection</strong> (Phát hiện đối tượng) là tác vụ vừa
          xác định vị trí (bounding box) vừa phân loại các đối tượng trong ảnh.
          Khác với Image Classification chỉ gán 1 nhãn cho cả ảnh.
        </p>
        <p>Hai trường phái chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Two-stage (R-CNN, Faster R-CNN):</strong> Bước 1 đề xuất
            vùng ứng viên (Region Proposal), bước 2 phân loại và tinh chỉnh.
            Chính xác cao nhưng chậm hơn.
          </li>
          <li>
            <strong>One-stage (YOLO, SSD):</strong> Dự đoán bounding box và
            nhãn trực tiếp trong một lần duyệt mạng. Nhanh hơn, phù hợp
            ứng dụng thời gian thực.
          </li>
        </ol>
        <p>
          Mỗi dự đoán gồm: tọa độ bounding box (x, y, w, h), nhãn lớp, và
          điểm tin cậy (confidence score). <strong>NMS</strong> (Non-Maximum
          Suppression) được dùng để loại bỏ các box trùng lặp.
        </p>
      </ExplanationSection>
    </>
  );
}
