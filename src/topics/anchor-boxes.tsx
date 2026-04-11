"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "anchor-boxes",
  title: "Anchor Boxes",
  titleVi: "Anchor Boxes - Hộp neo",
  description:
    "Các hộp tham chiếu với tỷ lệ và kích thước khác nhau, dùng làm điểm khởi đầu để dự đoán bounding box.",
  category: "computer-vision",
  tags: ["computer-vision", "detection", "anchors"],
  difficulty: "intermediate",
  relatedSlugs: ["object-detection", "iou", "nms"],
  vizType: "interactive",
};

export default function AnchorBoxesTopic() {
  const [scaleIdx, setScaleIdx] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const scales = [0.5, 1.0, 1.5];
  const ratios = [
    { w: 1, h: 2, label: "1:2 (người đứng)" },
    { w: 1, h: 1, label: "1:1 (vuông)" },
    { w: 2, h: 1, label: "2:1 (xe nằm)" },
  ];

  const scale = scales[scaleIdx];
  const cx = 300;
  const cy = 160;
  const baseSize = 50;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang tìm kiếm <strong>kho báu</strong> trên bãi
          biển. Thay vì đào ngẫu nhiên, bạn đặt sẵn{" "}
          <strong>lưới đánh dấu</strong> trên cát, mỗi ô có nhiều khung đào
          với kích thước khác nhau — khung dọc để tìm hộp dài, khung vuông
          để tìm hộp vuông.
        </p>
        <p>
          Anchor boxes cũng vậy — đây là các <strong>hộp mẫu đặt sẵn</strong>{" "}
          trên ảnh với nhiều tỷ lệ và kích thước. Mô hình chỉ cần{" "}
          <strong>điều chỉnh nhẹ</strong> (offset) từ anchor gần nhất thay vì
          đoán bounding box từ đầu!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted">
                Tỷ lệ phóng: {scale.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={scaleIdx}
                onChange={(e) => setScaleIdx(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <button
              onClick={() => setShowAll(!showAll)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                showAll
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted"
              }`}
            >
              {showAll ? "Chỉ hiện tại tâm" : "Hiện lưới anchor"}
            </button>
          </div>

          <svg viewBox="0 0 600 340" className="w-full max-w-2xl mx-auto">
            {/* Background */}
            <rect x="0" y="0" width="600" height="340" rx="8" fill="#0f172a" />

            {/* Grid of anchor centers (if showAll) */}
            {showAll &&
              [1, 2, 3, 4, 5].map((r) =>
                [1, 2, 3, 4, 5, 6, 7].map((c) => (
                  <circle
                    key={`grid-${r}-${c}`}
                    cx={c * 75}
                    cy={r * 55 + 5}
                    r="2"
                    fill="#475569"
                    opacity={0.5}
                  />
                ))
              )}

            {/* Anchor boxes at center */}
            {ratios.map((ratio, i) => {
              const w = baseSize * ratio.w * scale;
              const h = baseSize * ratio.h * scale;
              const colors = ["#3b82f6", "#22c55e", "#f59e0b"];
              return (
                <g key={ratio.label}>
                  <rect
                    x={cx - w}
                    y={cy - h}
                    width={w * 2}
                    height={h * 2}
                    fill="none"
                    stroke={colors[i]}
                    strokeWidth="2"
                    strokeDasharray={i === 1 ? "none" : "6,3"}
                    opacity={0.8}
                  />
                  <text
                    x={cx + w + 5}
                    y={cy - h + 14}
                    fill={colors[i]}
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {ratio.label}
                  </text>
                </g>
              );
            })}

            {/* Center point */}
            <circle cx={cx} cy={cy} r="4" fill="#ef4444" />
            <text x={cx} y={cy - 10} textAnchor="middle" fill="#ef4444" fontSize="9">
              Tâm anchor
            </text>

            {/* Show grid anchors with boxes if enabled */}
            {showAll && (
              <text x="300" y="330" textAnchor="middle" fill="#64748b" fontSize="10">
                Mỗi điểm trên lưới có 3 anchor boxes (3 tỷ lệ x {scales.length} kích thước = {3 * scales.length} anchor/điểm)
              </text>
            )}
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Tại mỗi điểm trên lưới, đặt <strong className="text-accent">3 tỷ lệ khung hình</strong>{" "}
              (aspect ratio) x <strong className="text-accent">{scales.length} kích thước</strong> ={" "}
              <strong className="text-accent">{3 * scales.length} anchor boxes</strong>
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Anchor Boxes</strong> (hộp neo) là tập hợp các bounding box
          mẫu với tỷ lệ khung hình (aspect ratio) và kích thước (scale) xác
          định trước, được đặt đều đặn trên lưới feature map.
        </p>
        <p>Vai trò trong phát hiện đối tượng:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Điểm khởi đầu:</strong> Thay vì dự đoán bounding box từ
            đầu, mô hình chỉ cần dự đoán offset (dịch chuyển) từ anchor gần
            nhất.
          </li>
          <li>
            <strong>Đa dạng hình dạng:</strong> Nhiều tỷ lệ (1:1, 1:2, 2:1)
            và nhiều kích thước giúp phát hiện đối tượng có hình dạng khác nhau.
          </li>
          <li>
            <strong>Phân loại:</strong> Mỗi anchor được gán nhãn positive
            (IoU cao với ground truth) hoặc negative để huấn luyện.
          </li>
        </ol>
        <p>
          Faster R-CNN sử dụng 9 anchors/vị trí (3 tỷ lệ x 3 kích thước).
          Các phương pháp mới hơn như FCOS và CenterNet loại bỏ anchor
          (anchor-free), dự đoán trực tiếp từ tâm đối tượng.
        </p>
      </ExplanationSection>
    </>
  );
}
