"use client";

import { useState, useCallback } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "linear-regression",
  title: "Linear Regression",
  titleVi: "Hồi quy tuyến tính",
  description: "Vẽ đường thẳng tốt nhất qua các điểm dữ liệu để dự đoán giá trị liên tục",
  category: "classic-ml",
  tags: ["regression", "supervised-learning", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["polynomial-regression", "logistic-regression", "gradient-descent"],
  vizType: "interactive",
};

const initialPoints = [
  { x: 50, y: 280 },
  { x: 100, y: 240 },
  { x: 150, y: 220 },
  { x: 200, y: 180 },
  { x: 270, y: 150 },
  { x: 320, y: 120 },
  { x: 400, y: 80 },
];

function fitLine(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 200 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export default function LinearRegressionTopic() {
  const [points, setPoints] = useState(initialPoints);
  const [dragging, setDragging] = useState<number | null>(null);

  const { slope, intercept } = fitLine(points);
  const lineY = (x: number) => slope * x + intercept;

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (dragging !== null) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPoints((prev) => [...prev, { x, y }]);
    },
    [dragging]
  );

  const handlePointerDown = (idx: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragging(idx);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (dragging === null) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = Math.max(0, Math.min(500, e.clientX - rect.left));
      const y = Math.max(0, Math.min(320, e.clientY - rect.top));
      setPoints((prev) => prev.map((p, i) => (i === dragging ? { x, y } : p)));
    },
    [dragging]
  );

  const handlePointerUp = useCallback(() => setDragging(null), []);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một nhà môi giới bất động sản. Bạn có bảng dữ liệu
          về <strong>diện tích nhà</strong> và <strong>giá bán</strong>. Bạn muốn vẽ
          một đường thẳng xuyên qua các điểm dữ liệu sao cho đường đó &quot;gần&quot; tất
          cả các điểm nhất có thể. Khi có khách hỏi giá nhà 80m&sup2;, bạn chỉ cần
          dóng lên đường thẳng đó để ước lượng giá.
        </p>
        <p>
          <strong>Hồi quy tuyến tính</strong> chính là việc tìm đường thẳng &quot;tốt nhất&quot;
          đó &mdash; đường có tổng sai số nhỏ nhất so với mọi điểm dữ liệu.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào biểu đồ để thêm điểm, hoặc kéo các điểm hiện có. Đường hồi quy tự
          động cập nhật.
        </p>
        <svg
          viewBox="0 0 500 320"
          className="w-full cursor-crosshair rounded-lg border border-border bg-background"
          onClick={handleSvgClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Grid lines */}
          {[0, 80, 160, 240, 320].map((y) => (
            <line key={y} x1={0} y1={y} x2={500} y2={y} stroke="currentColor" className="text-border" strokeWidth={0.5} />
          ))}
          {[0, 100, 200, 300, 400, 500].map((x) => (
            <line key={x} x1={x} y1={0} x2={x} y2={320} stroke="currentColor" className="text-border" strokeWidth={0.5} />
          ))}

          {/* Regression line */}
          <line
            x1={0}
            y1={lineY(0)}
            x2={500}
            y2={lineY(500)}
            stroke="#3b82f6"
            strokeWidth={2.5}
            strokeDasharray="8 4"
          />

          {/* Error lines */}
          {points.map((p, i) => (
            <line
              key={`err-${i}`}
              x1={p.x}
              y1={p.y}
              x2={p.x}
              y2={lineY(p.x)}
              stroke="#ef4444"
              strokeWidth={1}
              opacity={0.5}
            />
          ))}

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={6}
              fill="#f97316"
              stroke="#fff"
              strokeWidth={2}
              className="cursor-grab"
              onPointerDown={handlePointerDown(i)}
            />
          ))}

          {/* Labels */}
          <text x={460} y={16} fontSize={11} fill="#3b82f6" fontWeight={600}>
            y = {slope.toFixed(2)}x + {intercept.toFixed(0)}
          </text>
        </svg>
        <button
          onClick={() => setPoints(initialPoints)}
          className="mt-3 rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
        >
          Đặt lại
        </button>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Hồi quy tuyến tính (Linear Regression)</strong> là thuật toán nền tảng
          nhất trong học máy. Mục tiêu là tìm hàm tuyến tính <em>y = wx + b</em> sao cho
          tổng bình phương sai số giữa giá trị dự đoán và giá trị thực tế là nhỏ nhất.
        </p>
        <p>
          Phương pháp phổ biến nhất là <strong>bình phương tối thiểu (Ordinary Least Squares)</strong>,
          cho phép tính trực tiếp nghiệm tối ưu bằng công thức đại số. Với dữ liệu lớn hơn,
          ta thường dùng <strong>gradient descent</strong> để tối ưu dần dần.
        </p>
        <p>
          Đường màu đỏ nét nhỏ trong biểu đồ thể hiện <strong>sai số (residual)</strong> &mdash;
          khoảng cách từ mỗi điểm đến đường hồi quy. Thuật toán cố gắng làm tổng bình
          phương các đường đỏ này nhỏ nhất.
        </p>
      </ExplanationSection>
    </>
  );
}
