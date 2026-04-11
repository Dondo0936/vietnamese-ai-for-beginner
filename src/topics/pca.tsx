"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "pca",
  title: "Principal Component Analysis",
  titleVi: "Phân tích thành phần chính",
  description: "Giảm chiều dữ liệu bằng cách tìm các hướng có phương sai lớn nhất",
  category: "classic-ml",
  tags: ["dimensionality-reduction", "unsupervised-learning"],
  difficulty: "intermediate",
  relatedSlugs: ["t-sne", "k-means", "linear-regression"],
  vizType: "interactive",
};

const data2D = [
  { x: 60, y: 220 }, { x: 100, y: 195 }, { x: 140, y: 175 },
  { x: 170, y: 155 }, { x: 210, y: 140 }, { x: 250, y: 120 },
  { x: 290, y: 105 }, { x: 330, y: 90 }, { x: 370, y: 70 },
  { x: 400, y: 55 }, { x: 120, y: 210 }, { x: 200, y: 160 },
  { x: 280, y: 125 }, { x: 350, y: 80 },
];

export default function PcaTopic() {
  const [angle, setAngle] = useState(35);

  const rad = (angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  const cx = 250;
  const cy = 140;

  const projected = data2D.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const proj = dx * cosA + dy * sinA;
    return {
      x: cx + proj * cosA,
      y: cy + proj * sinA,
      origX: p.x,
      origY: p.y,
    };
  });

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang chụp ảnh bóng đổ của một vật thể 3D lên tường. Bạn
          muốn tìm <strong>góc chiếu sáng</strong> sao cho bóng đổ giữ lại được nhiều
          thông tin nhất &mdash; các chi tiết của vật không bị chồng lên nhau.
        </p>
        <p>
          <strong>PCA</strong> tìm hướng chiếu (thành phần chính) mà dữ liệu &quot;trải
          ra&quot; nhiều nhất, giữ lại nhiều thông tin nhất khi giảm chiều.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Xoay trục chiếu bằng thanh trượt. Quan sát khi nào các điểm chiếu (xanh)
          trải rộng nhất trên trục.
        </p>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Principal axis */}
          <line
            x1={cx - 220 * cosA} y1={cy - 220 * sinA}
            x2={cx + 220 * cosA} y2={cy + 220 * sinA}
            stroke="#3b82f6" strokeWidth={2} opacity={0.4}
          />

          {/* Projection lines */}
          {projected.map((p, i) => (
            <line
              key={`proj-${i}`}
              x1={p.origX} y1={p.origY}
              x2={p.x} y2={p.y}
              stroke="#8b5cf6" strokeWidth={0.8} strokeDasharray="3 2" opacity={0.4}
            />
          ))}

          {/* Original points */}
          {data2D.map((p, i) => (
            <circle key={`orig-${i}`} cx={p.x} cy={p.y} r={4} fill="#f97316" stroke="#fff" strokeWidth={1} />
          ))}

          {/* Projected points */}
          {projected.map((p, i) => (
            <circle key={`proj-pt-${i}`} cx={p.x} cy={p.y} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
          ))}

          {/* Arrow on axis */}
          <polygon
            points={`${cx + 210 * cosA},${cy + 210 * sinA} ${cx + 200 * cosA - 6 * sinA},${cy + 200 * sinA + 6 * cosA} ${cx + 200 * cosA + 6 * sinA},${cy + 200 * sinA - 6 * cosA}`}
            fill="#3b82f6"
          />

          {/* Labels */}
          <text x={10} y={20} fontSize={12} fill="#3b82f6" fontWeight={600}>
            PC1 (Góc: {angle}&deg;)
          </text>

          {/* Legend */}
          <circle cx={380} cy={12} r={4} fill="#f97316" />
          <text x={390} y={16} fontSize={10} fill="currentColor" className="text-muted">Gốc (2D)</text>
          <circle cx={380} cy={30} r={4} fill="#3b82f6" />
          <text x={390} y={34} fontSize={10} fill="currentColor" className="text-muted">Chiếu (1D)</text>
        </svg>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Góc trục chiếu:</label>
          <input
            type="range"
            min={0}
            max={180}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="w-10 text-center text-sm font-bold text-accent">{angle}&deg;</span>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>PCA (Principal Component Analysis)</strong> là kỹ thuật <strong>giảm
          chiều</strong> phổ biến nhất. Nó tìm các hướng (thành phần chính) trong không
          gian dữ liệu mà phương sai lớn nhất, rồi chiếu dữ liệu lên các hướng đó.
        </p>
        <p>
          Thành phần chính thứ nhất (PC1) là hướng có phương sai cực đại. PC2 vuông góc
          với PC1 và có phương sai lớn nhất trong các hướng còn lại. Toán học: PCA phân
          rã <strong>ma trận hiệp phương sai</strong> thành các eigenvector/eigenvalue.
        </p>
        <p>
          Ứng dụng: <strong>giảm chiều</strong> trước khi phân cụm/phân loại, <strong>trực
          quan hóa</strong> dữ liệu chiều cao, <strong>nén nhiễu</strong>, và <strong>nhận
          diện khuôn mặt</strong> (eigenfaces).
        </p>
      </ExplanationSection>
    </>
  );
}
