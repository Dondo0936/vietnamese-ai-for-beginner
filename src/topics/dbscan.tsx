"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "dbscan",
  title: "DBSCAN",
  titleVi: "Phân cụm dựa trên mật độ",
  description: "Thuật toán phân cụm tìm vùng mật độ cao, tự xác định số cụm và phát hiện nhiễu",
  category: "classic-ml",
  tags: ["clustering", "unsupervised-learning", "density"],
  difficulty: "intermediate",
  relatedSlugs: ["k-means", "pca", "knn"],
  vizType: "interactive",
};

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const dataPoints = [
  // Cluster 1 (circle top-left)
  { x: 80, y: 80 }, { x: 100, y: 60 }, { x: 60, y: 100 }, { x: 90, y: 110 },
  { x: 110, y: 90 }, { x: 70, y: 70 },
  // Cluster 2 (arc bottom)
  { x: 200, y: 220 }, { x: 230, y: 240 }, { x: 260, y: 250 }, { x: 290, y: 240 },
  { x: 320, y: 220 }, { x: 250, y: 260 },
  // Cluster 3 (right)
  { x: 400, y: 100 }, { x: 420, y: 130 }, { x: 380, y: 120 }, { x: 410, y: 80 },
  { x: 430, y: 110 },
  // Noise
  { x: 250, y: 50 }, { x: 450, y: 260 }, { x: 30, y: 250 },
];

const clusterColors = ["#3b82f6", "#22c55e", "#f97316", "#8b5cf6"];

export default function DbscanTopic() {
  const [epsilon, setEpsilon] = useState(55);
  const minPts = 3;

  const { labels, hoverIdx, setHoverIdx } = useMemo(() => {
    const n = dataPoints.length;
    const lab = new Array(n).fill(-1);
    let cluster = 0;

    for (let i = 0; i < n; i++) {
      if (lab[i] !== -1) continue;
      const neighbors = dataPoints
        .map((p, j) => ({ j, d: dist(dataPoints[i], p) }))
        .filter((x) => x.d <= epsilon && x.j !== i);

      if (neighbors.length < minPts - 1) continue;

      lab[i] = cluster;
      const queue = neighbors.map((x) => x.j);

      while (queue.length > 0) {
        const qi = queue.shift()!;
        if (lab[qi] === -1 || lab[qi] === -2) {
          lab[qi] = cluster;
          const qNeighbors = dataPoints
            .map((p, j) => ({ j, d: dist(dataPoints[qi], p) }))
            .filter((x) => x.d <= epsilon && x.j !== qi);
          if (qNeighbors.length >= minPts - 1) {
            qNeighbors.forEach((x) => {
              if (lab[x.j] === -1) queue.push(x.j);
            });
          }
        }
      }
      cluster++;
    }
    return { labels: lab, hoverIdx: -1, setHoverIdx: () => {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epsilon]);

  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const numClusters = new Set(labels.filter((l) => l >= 0)).size;
  const numNoise = labels.filter((l) => l < 0).length;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn nhìn bản đồ thành phố từ trên cao vào ban đêm. Bạn thấy
          các <strong>cụm đèn sáng</strong> &mdash; đó là khu dân cư. Giữa các cụm là
          vùng tối (thưa đèn). Một vài đèn lẻ loi giữa đồng không phải khu dân cư nào.
        </p>
        <p>
          <strong>DBSCAN</strong> tìm cụm bằng cách &quot;lan&quot; từ vùng mật độ cao ra
          xung quanh. Điểm lẻ loi (thưa) bị đánh dấu là <strong>nhiễu (noise)</strong>.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Kéo thanh trượt epsilon (&epsilon;) để thay đổi bán kính vùng lân cận. Di chuột
          vào điểm để thấy vùng &epsilon;.
        </p>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Epsilon circle for hovered point */}
          {hoveredIdx >= 0 && (
            <circle
              cx={dataPoints[hoveredIdx].x}
              cy={dataPoints[hoveredIdx].y}
              r={epsilon}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              opacity={0.6}
            />
          )}

          {/* Data points */}
          {dataPoints.map((p, i) => {
            const cluster = labels[i];
            const color = cluster >= 0 ? clusterColors[cluster % clusterColors.length] : "#666";
            const isNoise = cluster < 0;
            return (
              <g key={i}>
                <circle
                  cx={p.x} cy={p.y} r={isNoise ? 4 : 6}
                  fill={color}
                  stroke={isNoise ? "#999" : "#fff"}
                  strokeWidth={isNoise ? 1 : 1.5}
                  opacity={isNoise ? 0.5 : 1}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(-1)}
                />
                {isNoise && (
                  <text x={p.x + 8} y={p.y + 4} fontSize={9} fill="#999">
                    nhiễu
                  </text>
                )}
              </g>
            );
          })}

          {/* Stats */}
          <text x={10} y={20} fontSize={12} fill="currentColor" className="text-foreground" fontWeight={600}>
            &epsilon; = {epsilon} | Cụm: {numClusters} | Nhiễu: {numNoise}
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Epsilon (&epsilon;):</label>
          <input
            type="range"
            min={20}
            max={120}
            value={epsilon}
            onChange={(e) => setEpsilon(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="w-10 text-center text-sm font-bold text-accent">{epsilon}</span>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>DBSCAN (Density-Based Spatial Clustering)</strong> tìm cụm dựa trên
          mật độ điểm. Hai tham số chính: <strong>&epsilon;</strong> (bán kính vùng lân
          cận) và <strong>minPts</strong> (số điểm tối thiểu trong vùng &epsilon; để được
          coi là &quot;lõi&quot;).
        </p>
        <p>
          Ưu điểm so với K-Means: <strong>không cần chọn số cụm</strong>, phát hiện
          được cụm hình dạng bất kỳ, và tự động nhận diện <strong>điểm nhiễu</strong>.
        </p>
        <p>
          Hạn chế: khó chọn &epsilon; phù hợp, không hoạt động tốt khi các cụm có mật
          độ rất khác nhau. Biến thể HDBSCAN giải quyết vấn đề này bằng cách tự động
          điều chỉnh &epsilon; theo vùng.
        </p>
      </ExplanationSection>
    </>
  );
}
