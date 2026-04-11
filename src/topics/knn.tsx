"use client";

import { useState, useCallback, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "knn",
  title: "K-Nearest Neighbors",
  titleVi: "K láng giềng gần nhất",
  description: "Thuật toán phân loại dựa trên khoảng cách đến K điểm gần nhất",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "distance"],
  difficulty: "beginner",
  relatedSlugs: ["k-means", "svm", "logistic-regression"],
  vizType: "interactive",
};

const classA = [
  { x: 80, y: 80 }, { x: 100, y: 140 }, { x: 130, y: 60 },
  { x: 60, y: 180 }, { x: 150, y: 120 }, { x: 110, y: 200 },
  { x: 170, y: 170 },
];

const classB = [
  { x: 340, y: 100 }, { x: 370, y: 180 }, { x: 400, y: 70 },
  { x: 310, y: 220 }, { x: 420, y: 140 }, { x: 380, y: 250 },
  { x: 350, y: 50 },
];

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export default function KnnTopic() {
  const [k, setK] = useState(3);
  const [query, setQuery] = useState({ x: 250, y: 150 });
  const [dragging, setDragging] = useState(false);

  const allPoints = useMemo(
    () => [
      ...classA.map((p) => ({ ...p, cls: "A" })),
      ...classB.map((p) => ({ ...p, cls: "B" })),
    ],
    []
  );

  const neighbors = useMemo(() => {
    const sorted = allPoints
      .map((p) => ({ ...p, d: dist(p, query) }))
      .sort((a, b) => a.d - b.d);
    return sorted.slice(0, k);
  }, [allPoints, k, query]);

  const prediction = useMemo(() => {
    const countA = neighbors.filter((n) => n.cls === "A").length;
    return countA > k / 2 ? "A" : "B";
  }, [neighbors, k]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragging) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      setQuery({
        x: Math.max(10, Math.min(490, e.clientX - rect.left)),
        y: Math.max(10, Math.min(290, e.clientY - rect.top)),
      });
    },
    [dragging]
  );

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn mới chuyển đến một khu phố lạ và muốn biết quán phở ngon
          ở đâu. Bạn hỏi <strong>K người hàng xóm gần nhất</strong> &mdash; nếu đa số họ
          nói quán A, bạn sẽ chọn quán A.
        </p>
        <p>
          <strong>KNN</strong> phân loại điểm mới bằng cách nhìn vào K điểm dữ liệu gần
          nhất và bỏ phiếu đa số. Không cần &quot;huấn luyện&quot; &mdash; chỉ cần nhớ toàn
          bộ dữ liệu và so khoảng cách.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Kéo điểm truy vấn (hình thoi vàng) để di chuyển. Điều chỉnh K bằng thanh trượt.
        </p>
        <svg
          viewBox="0 0 500 300"
          className="w-full rounded-lg border border-border bg-background"
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
        >
          {/* Neighbor connection lines */}
          {neighbors.map((n, i) => (
            <line
              key={`line-${i}`}
              x1={query.x} y1={query.y}
              x2={n.x} y2={n.y}
              stroke={n.cls === "A" ? "#3b82f6" : "#ef4444"}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.6}
            />
          ))}

          {/* K radius circle */}
          {neighbors.length > 0 && (
            <circle
              cx={query.x}
              cy={query.y}
              r={neighbors[neighbors.length - 1].d}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="5 3"
              opacity={0.4}
            />
          )}

          {/* Class A points */}
          {classA.map((p, i) => (
            <circle key={`a-${i}`} cx={p.x} cy={p.y} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />
          ))}

          {/* Class B points */}
          {classB.map((p, i) => (
            <circle key={`b-${i}`} cx={p.x} cy={p.y} r={6} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />
          ))}

          {/* Query point */}
          <polygon
            points={`${query.x},${query.y - 10} ${query.x + 8},${query.y} ${query.x},${query.y + 10} ${query.x - 8},${query.y}`}
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth={2}
            className="cursor-grab"
            onPointerDown={() => setDragging(true)}
          />

          {/* Result */}
          <rect x={370} y={5} width={125} height={30} rx={8} fill={prediction === "A" ? "#3b82f6" : "#ef4444"} opacity={0.15}
            stroke={prediction === "A" ? "#3b82f6" : "#ef4444"} strokeWidth={1.5} />
          <text x={432} y={24} fontSize={12} fill={prediction === "A" ? "#3b82f6" : "#ef4444"} textAnchor="middle" fontWeight={600}>
            Dự đoán: Lớp {prediction}
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">K =</label>
          <input
            type="range"
            min={1}
            max={7}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="w-6 text-center text-sm font-bold text-accent">{k}</span>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>K-Nearest Neighbors (KNN)</strong> là thuật toán <strong>phi tham số</strong>
          đơn giản nhất. Không cần huấn luyện &mdash; khi có điểm mới, nó tính khoảng cách
          đến tất cả điểm đã biết, chọn K điểm gần nhất, và bỏ phiếu đa số.
        </p>
        <p>
          Giá trị <strong>K</strong> rất quan trọng: K nhỏ (như 1) nhạy với nhiễu; K lớn
          quá thì ranh giới quá mượt. Khoảng cách phổ biến là <strong>Euclidean</strong>,
          nhưng cũng có thể dùng Manhattan, Minkowski, hay cosine.
        </p>
        <p>
          Hạn chế chính: <strong>chậm</strong> khi dữ liệu lớn (phải so khoảng cách với
          mọi điểm) và bị ảnh hưởng bởi <strong>chiều cao (curse of dimensionality)</strong>.
          Cần chuẩn hóa đặc trưng để các chiều có cùng thang đo.
        </p>
      </ExplanationSection>
    </>
  );
}
