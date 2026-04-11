"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
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

const GRID_SIZE = 12;
const CATEGORIES: Record<number, { name: string; color: string }> = {
  0: { name: "Bầu trời", color: "#60a5fa" },
  1: { name: "Cây cối", color: "#22c55e" },
  2: { name: "Đường", color: "#94a3b8" },
  3: { name: "Xe", color: "#ef4444" },
  4: { name: "Nhà", color: "#f59e0b" },
};

// Simple scene: sky at top, trees in middle, road at bottom, car and house
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

export default function SemanticSegmentationTopic() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  const cellSize = 600 / GRID_SIZE;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một bức tranh tô màu. Thay vì tô cả bức
          tranh một màu, bạn phải <strong>tô mỗi vùng một màu khác nhau</strong>:
          bầu trời xanh dương, cây xanh lá, đường xám, xe đỏ...
        </p>
        <p>
          Semantic Segmentation làm tương tự — nó{" "}
          <strong>tô màu từng pixel</strong> trong ảnh theo danh mục. Mỗi pixel
          được gán nhãn: &quot;pixel này thuộc bầu trời&quot;, &quot;pixel kia thuộc đường&quot;.
          Kết quả là bản đồ phân vùng chi tiết đến từng điểm ảnh!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                showOverlay
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted"
              }`}
            >
              {showOverlay ? "Tắt lớp phủ" : "Bật lớp phủ"}
            </button>
            {Object.entries(CATEGORIES).map(([id, cat]) => (
              <button
                key={id}
                onClick={() => setSelectedCat(selectedCat === Number(id) ? null : Number(id))}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border ${
                  selectedCat === Number(id) ? "text-white" : "text-muted"
                }`}
                style={{
                  backgroundColor: selectedCat === Number(id) ? cat.color : "transparent",
                  borderColor: cat.color,
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
                    x={c * cellSize}
                    y={r * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={showOverlay ? CATEGORIES[cat].color : "#1e293b"}
                    opacity={showOverlay ? (isHighlighted ? 0.8 : 0.2) : 1}
                    stroke="#0f172a"
                    strokeWidth="1"
                  />
                );
              })
            )}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(CATEGORIES).map(([, cat]) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs text-muted">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Semantic Segmentation</strong> (Phân đoạn ngữ nghĩa) gán nhãn
          danh mục cho <strong>từng pixel</strong> trong ảnh. Đây là tác vụ phân
          loại ở mức pixel, chi tiết hơn nhiều so với phân loại ảnh hay phát
          hiện đối tượng.
        </p>
        <p>Đặc điểm và kiến trúc:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Encoder-Decoder:</strong> Encoder nén ảnh thành đặc trưng,
            Decoder khôi phục về kích thước gốc. Ví dụ: U-Net, SegNet.
          </li>
          <li>
            <strong>Dilated Convolution:</strong> Mở rộng trường nhận thức
            (receptive field) mà không giảm kích thước. Ví dụ: DeepLab.
          </li>
          <li>
            <strong>Hạn chế:</strong> Không phân biệt các thể hiện (instance)
            khác nhau — hai con mèo cạnh nhau đều được tô cùng một màu
            &quot;mèo&quot;.
          </li>
        </ol>
        <p>
          Ứng dụng: lái xe tự động (phân biệt đường, vỉa hè, người đi bộ),
          ảnh y tế (phân vùng khối u), chỉnh sửa ảnh (tách nền).
        </p>
      </ExplanationSection>
    </>
  );
}
