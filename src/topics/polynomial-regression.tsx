"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "polynomial-regression",
  title: "Polynomial Regression",
  titleVi: "Hồi quy đa thức",
  description: "Mở rộng hồi quy tuyến tính bằng cách dùng đường cong bậc cao để khớp dữ liệu phức tạp hơn",
  category: "classic-ml",
  tags: ["regression", "supervised-learning", "overfitting"],
  difficulty: "beginner",
  relatedSlugs: ["linear-regression", "bias-variance", "cross-validation"],
  vizType: "interactive",
};

const dataPoints = [
  { x: 30, y: 250 },
  { x: 80, y: 180 },
  { x: 130, y: 120 },
  { x: 200, y: 90 },
  { x: 260, y: 100 },
  { x: 320, y: 150 },
  { x: 400, y: 240 },
  { x: 450, y: 270 },
];

function polyFit(points: { x: number; y: number }[], degree: number) {
  const xNorm = points.map((p) => p.x / 500);
  const yVals = points.map((p) => p.y);

  const path: string[] = [];
  const steps = 100;

  if (degree === 1) {
    const n = points.length;
    const sx = xNorm.reduce((a, b) => a + b, 0);
    const sy = yVals.reduce((a, b) => a + b, 0);
    const sxy = xNorm.reduce((a, x, i) => a + x * yVals[i], 0);
    const sx2 = xNorm.reduce((a, x) => a + x * x, 0);
    const m = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
    const b = (sy - m * sx) / n;
    for (let i = 0; i <= steps; i++) {
      const xv = i / steps;
      const yv = m * xv + b;
      path.push(`${i === 0 ? "M" : "L"}${xv * 500},${yv}`);
    }
  } else {
    const evalPoly = (xv: number) => {
      let sum = 0;
      for (let d = 0; d <= degree; d++) {
        const basisVal = Math.pow(xv - 0.5, d);
        const weight = yVals.reduce((a, y, i) => a + y * Math.pow(xNorm[i] - 0.5, d), 0) /
          Math.max(1, xNorm.reduce((a, x) => a + Math.pow(x - 0.5, 2 * d), 0));
        sum += weight * basisVal;
      }
      return Math.max(0, Math.min(320, sum));
    };

    for (let i = 0; i <= steps; i++) {
      const xv = i / steps;
      const yv = evalPoly(xv);
      path.push(`${i === 0 ? "M" : "L"}${xv * 500},${yv}`);
    }
  }

  return path.join(" ");
}

export default function PolynomialRegressionTopic() {
  const [degree, setDegree] = useState(2);

  const curvePath = polyFit(dataPoints, degree);

  const degreeLabel = degree === 1 ? "Bậc 1 (tuyến tính)" :
    degree <= 3 ? `Bậc ${degree} (vừa phải)` :
    degree <= 5 ? `Bậc ${degree} (phức tạp)` :
    `Bậc ${degree} (quá khớp!)`;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang uốn một sợi dây thép để nó đi qua các điểm trên tấm
          bảng. Nếu bạn chỉ uốn nhẹ (bậc thấp), sợi dây sẽ mượt nhưng có thể không chạm
          hết các điểm. Nếu bạn uốn quá nhiều (bậc cao), sợi dây sẽ ngoằn ngoèo đi qua
          mọi điểm nhưng trông rất kỳ lạ.
        </p>
        <p>
          <strong>Hồi quy đa thức</strong> cho phép ta dùng đường cong thay vì đường thẳng,
          nhưng phải cẩn thận chọn bậc phù hợp &mdash; không quá đơn giản, không quá phức tạp.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Kéo thanh trượt để thay đổi bậc của đa thức. Quan sát khi bậc quá cao, đường cong
          bắt đầu &quot;quá khớp&quot; (overfitting).
        </p>
        <svg
          viewBox="0 0 500 320"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Grid */}
          {[0, 80, 160, 240, 320].map((y) => (
            <line key={y} x1={0} y1={y} x2={500} y2={y} stroke="currentColor" className="text-border" strokeWidth={0.5} />
          ))}

          {/* Curve */}
          <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} />

          {/* Points */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={5} fill="#f97316" stroke="#fff" strokeWidth={2} />
          ))}

          {/* Degree label */}
          <text x={10} y={20} fontSize={13} fill="#3b82f6" fontWeight={600}>
            {degreeLabel}
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Bậc đa thức:</label>
          <input
            type="range"
            min={1}
            max={7}
            value={degree}
            onChange={(e) => setDegree(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="w-8 text-center text-sm font-bold text-accent">{degree}</span>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Hồi quy đa thức (Polynomial Regression)</strong> mở rộng hồi quy tuyến
          tính bằng cách thêm các số hạng bậc cao: <em>y = w₀ + w₁x + w₂x&sup2; + ... + wₙxⁿ</em>.
          Điều này cho phép mô hình khớp với dữ liệu có dạng đường cong.
        </p>
        <p>
          Tuy nhiên, khi bậc quá cao, mô hình sẽ <strong>quá khớp (overfitting)</strong> &mdash;
          nó &quot;nhớ&quot; từng điểm dữ liệu thay vì học quy luật chung. Đây là một ví dụ
          kinh điển về sự <strong>đánh đổi giữa bias và variance</strong>.
        </p>
        <p>
          Trong thực tế, ta thường dùng <strong>kiểm chứng chéo (cross-validation)</strong> để
          chọn bậc phù hợp, hoặc dùng <strong>regularization</strong> (như Ridge, Lasso) để
          hạn chế các hệ số quá lớn.
        </p>
      </ExplanationSection>
    </>
  );
}
