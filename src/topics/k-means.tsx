"use client";

import { useState, useCallback } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "k-means",
  title: "K-Means Clustering",
  titleVi: "Phân cụm K-Means",
  description: "Chia dữ liệu thành K cụm dựa trên khoảng cách đến tâm cụm",
  category: "classic-ml",
  tags: ["clustering", "unsupervised-learning"],
  difficulty: "beginner",
  relatedSlugs: ["dbscan", "knn", "pca"],
  vizType: "interactive",
};

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const dataPoints = [
  { x: 60, y: 60 }, { x: 80, y: 90 }, { x: 100, y: 50 }, { x: 70, y: 110 },
  { x: 250, y: 220 }, { x: 270, y: 250 }, { x: 230, y: 260 }, { x: 260, y: 200 },
  { x: 400, y: 80 }, { x: 420, y: 110 }, { x: 380, y: 60 }, { x: 430, y: 90 },
  { x: 90, y: 70 }, { x: 240, y: 240 }, { x: 410, y: 100 },
];

const colors = ["#3b82f6", "#ef4444", "#22c55e"];

const initialCentroids = [
  { x: 150, y: 150 },
  { x: 300, y: 100 },
  { x: 350, y: 250 },
];

export default function KMeansTopic() {
  const [centroids, setCentroids] = useState(initialCentroids);
  const [iteration, setIteration] = useState(0);

  const assignments = dataPoints.map((p) => {
    let minD = Infinity;
    let best = 0;
    centroids.forEach((c, i) => {
      const d = dist(p, c);
      if (d < minD) { minD = d; best = i; }
    });
    return best;
  });

  const stepForward = useCallback(() => {
    const newCentroids = centroids.map((_, ci) => {
      const assigned = dataPoints.filter((_, pi) => assignments[pi] === ci);
      if (assigned.length === 0) return centroids[ci];
      return {
        x: assigned.reduce((s, p) => s + p.x, 0) / assigned.length,
        y: assigned.reduce((s, p) => s + p.y, 0) / assigned.length,
      };
    });
    setCentroids(newCentroids);
    setIteration((i) => i + 1);
  }, [centroids, assignments]);

  const reset = () => {
    setCentroids(initialCentroids);
    setIteration(0);
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là quản lý cửa hàng giao hàng và cần đặt <strong>3 kho
          trung chuyển</strong> sao cho mỗi khách hàng được phục vụ từ kho gần nhất. Ban
          đầu bạn đặt kho tạm, rồi xem mỗi khách hàng thuộc kho nào, dời kho về trung
          tâm nhóm khách, rồi phân lại... lặp cho đến khi ổn định.
        </p>
        <p>
          <strong>K-Means</strong> làm đúng vậy: đặt K tâm cụm, gán điểm vào cụm gần
          nhất, dời tâm về trung bình nhóm, lặp lại cho đến khi hội tụ.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp &quot;Bước tiếp&quot; để xem centroid di chuyển qua từng vòng lặp.
        </p>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Assignment lines */}
          {dataPoints.map((p, i) => (
            <line
              key={`line-${i}`}
              x1={p.x} y1={p.y}
              x2={centroids[assignments[i]].x} y2={centroids[assignments[i]].y}
              stroke={colors[assignments[i]]}
              strokeWidth={0.8}
              opacity={0.3}
            />
          ))}

          {/* Data points */}
          {dataPoints.map((p, i) => (
            <circle
              key={`pt-${i}`}
              cx={p.x} cy={p.y} r={5}
              fill={colors[assignments[i]]}
              stroke="#fff" strokeWidth={1.5}
            />
          ))}

          {/* Centroids */}
          {centroids.map((c, i) => (
            <g key={`c-${i}`}>
              <line x1={c.x - 8} y1={c.y - 8} x2={c.x + 8} y2={c.y + 8} stroke={colors[i]} strokeWidth={3} />
              <line x1={c.x + 8} y1={c.y - 8} x2={c.x - 8} y2={c.y + 8} stroke={colors[i]} strokeWidth={3} />
              <circle cx={c.x} cy={c.y} r={3} fill="#fff" />
            </g>
          ))}

          {/* Iteration label */}
          <text x={10} y={20} fontSize={13} fill="currentColor" className="text-foreground" fontWeight={600}>
            Vòng lặp: {iteration}
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={stepForward}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Bước tiếp
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Đặt lại
          </button>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>K-Means</strong> là thuật toán <strong>phân cụm không giám sát</strong>
          phổ biến nhất. Nó chia dữ liệu thành K nhóm dựa trên khoảng cách Euclidean đến
          tâm cụm (centroid).
        </p>
        <p>
          Thuật toán lặp hai bước: (1) <strong>Gán</strong>: mỗi điểm được gán cho cụm có
          centroid gần nhất. (2) <strong>Cập nhật</strong>: mỗi centroid được dời về trung
          bình của các điểm trong cụm. Lặp cho đến khi centroid không thay đổi nữa.
        </p>
        <p>
          Hạn chế: phải <strong>chọn K trước</strong> (dùng phương pháp Elbow hoặc
          Silhouette), nhạy với vị trí khởi tạo (giải quyết bằng K-Means++), và chỉ tìm
          được cụm hình cầu (dùng DBSCAN cho cụm hình dạng tự do).
        </p>
      </ExplanationSection>
    </>
  );
}
