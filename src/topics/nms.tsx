"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "nms",
  title: "Non-Maximum Suppression",
  titleVi: "NMS - Triệt tiêu không cực đại",
  description:
    "Thuật toán loại bỏ các bounding box trùng lặp, chỉ giữ lại box tốt nhất cho mỗi đối tượng.",
  category: "computer-vision",
  tags: ["computer-vision", "detection", "post-processing"],
  difficulty: "intermediate",
  relatedSlugs: ["object-detection", "iou", "anchor-boxes"],
  vizType: "interactive",
};

interface Box {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  conf: number;
  color: string;
}

const ALL_BOXES: Box[] = [
  { id: 1, x: 80, y: 60, w: 150, h: 130, conf: 0.95, color: "#3b82f6" },
  { id: 2, x: 90, y: 50, w: 140, h: 140, conf: 0.85, color: "#60a5fa" },
  { id: 3, x: 70, y: 70, w: 160, h: 120, conf: 0.72, color: "#93c5fd" },
  { id: 4, x: 350, y: 80, w: 120, h: 160, conf: 0.90, color: "#22c55e" },
  { id: 5, x: 360, y: 90, w: 110, h: 150, conf: 0.78, color: "#4ade80" },
  { id: 6, x: 340, y: 75, w: 130, h: 155, conf: 0.65, color: "#86efac" },
];

function computeIoU(a: Box, b: Box): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - intersection;
  return intersection / union;
}

export default function NmsTopic() {
  const [iouThreshold, setIouThreshold] = useState(0.5);
  const [applied, setApplied] = useState(false);

  const keptBoxes = useMemo(() => {
    const sorted = [...ALL_BOXES].sort((a, b) => b.conf - a.conf);
    const kept: Box[] = [];
    const suppressed = new Set<number>();

    for (const box of sorted) {
      if (suppressed.has(box.id)) continue;
      kept.push(box);
      for (const other of sorted) {
        if (other.id !== box.id && !suppressed.has(other.id)) {
          if (computeIoU(box, other) > iouThreshold) {
            suppressed.add(other.id);
          }
        }
      }
    }
    return kept;
  }, [iouThreshold]);

  const displayBoxes = applied ? keptBoxes : ALL_BOXES;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn chụp ảnh nhóm và nhiều người{" "}
          <strong>gắn thẻ (tag) cùng một người</strong> trong ảnh. Kết quả: một
          khuôn mặt bị gắn 5 thẻ chồng chéo. Bạn cần{" "}
          <strong>giữ lại thẻ chính xác nhất</strong> và xóa phần còn lại.
        </p>
        <p>
          NMS làm đúng việc đó: khi mô hình phát hiện đối tượng tạo ra hàng
          trăm bounding box chồng chéo cho cùng một vật thể, NMS{" "}
          <strong>giữ box tự tin nhất</strong> và loại bỏ các box trùng lặp
          (IoU cao) — giống như dọn dẹp bàn làm việc bừa bộn!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={() => setApplied(!applied)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                applied
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              {applied ? "Hiện tất cả box" : "Áp dụng NMS"}
            </button>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted">
                Ngưỡng IoU: {iouThreshold.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={iouThreshold}
                onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
            <rect x="0" y="0" width="600" height="300" rx="8" fill="#0f172a" />

            {/* Simple object shapes */}
            <ellipse cx="155" cy="130" rx="50" ry="45" fill="#334155" opacity={0.4} />
            <ellipse cx="410" cy="160" rx="40" ry="55" fill="#334155" opacity={0.4} />

            {/* Bounding boxes */}
            {displayBoxes.map((box) => (
              <g key={box.id}>
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  fill="none"
                  stroke={box.color}
                  strokeWidth={2}
                  opacity={0.9}
                />
                <rect
                  x={box.x}
                  y={box.y - 16}
                  width={50}
                  height="16"
                  fill={box.color}
                  rx="3"
                />
                <text
                  x={box.x + 4}
                  y={box.y - 4}
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {(box.conf * 100).toFixed(0)}%
                </text>
              </g>
            ))}
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              {applied ? (
                <>
                  Sau NMS: <strong className="text-green-500">{keptBoxes.length}</strong> box
                  (loại bỏ <strong className="text-red-500">{ALL_BOXES.length - keptBoxes.length}</strong> box trùng lặp)
                </>
              ) : (
                <>
                  Trước NMS: <strong className="text-accent">{ALL_BOXES.length}</strong> box
                  chồng chéo — nhấn &quot;Áp dụng NMS&quot; để lọc
                </>
              )}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Non-Maximum Suppression (NMS)</strong> là bước hậu xử lý quan
          trọng trong phát hiện đối tượng. Nó loại bỏ các bounding box trùng
          lặp, chỉ giữ lại box tốt nhất cho mỗi đối tượng.
        </p>
        <p>Thuật toán NMS:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Sắp xếp:</strong> Xếp tất cả box theo điểm tin cậy giảm
            dần.
          </li>
          <li>
            <strong>Chọn box tốt nhất:</strong> Lấy box có điểm cao nhất, thêm
            vào kết quả.
          </li>
          <li>
            <strong>Loại bỏ trùng lặp:</strong> Tính IoU của box vừa chọn với
            tất cả box còn lại. Loại bỏ box có IoU vượt ngưỡng.
          </li>
          <li>
            <strong>Lặp lại:</strong> Tiếp tục cho đến khi hết box.
          </li>
        </ol>
        <p>
          Biến thể: <strong>Soft-NMS</strong> giảm điểm thay vì loại bỏ hoàn
          toàn; <strong>DIoU-NMS</strong> xét thêm khoảng cách tâm;{" "}
          <strong>Weighted NMS</strong> kết hợp nhiều box thành một.
        </p>
      </ExplanationSection>
    </>
  );
}
