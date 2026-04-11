"use client";

import { useState, useCallback } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "logistic-regression",
  title: "Logistic Regression",
  titleVi: "Hồi quy logistic",
  description: "Thuật toán phân loại nhị phân sử dụng hàm sigmoid để dự đoán xác suất",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "probability"],
  difficulty: "beginner",
  relatedSlugs: ["linear-regression", "naive-bayes", "svm"],
  vizType: "interactive",
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export default function LogisticRegressionTopic() {
  const [boundary, setBoundary] = useState(250);
  const [steepness, setSteepness] = useState(5);

  const classAPoints = [
    { x: 60, y: 80 }, { x: 90, y: 200 }, { x: 120, y: 140 },
    { x: 140, y: 260 }, { x: 170, y: 100 }, { x: 180, y: 220 },
    { x: 100, y: 170 },
  ];
  const classBPoints = [
    { x: 310, y: 90 }, { x: 340, y: 210 }, { x: 370, y: 150 },
    { x: 390, y: 260 }, { x: 420, y: 120 }, { x: 440, y: 200 },
    { x: 360, y: 270 },
  ];

  const sigmoidPath = useCallback(() => {
    const points: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * 500;
      const input = ((x - boundary) / 500) * steepness * 4;
      const y = 320 - sigmoid(input) * 280 - 20;
      points.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(" ");
  }, [boundary, steepness]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là bác sĩ cần quyết định bệnh nhân có bị tiểu đường hay
          không dựa trên mức đường huyết. Với đường huyết thấp, xác suất gần 0%; với đường
          huyết cao, xác suất gần 100%. Ở giữa có một <strong>ngưỡng chuyển đổi mượt</strong>,
          không phải nhảy đột ngột từ &quot;không&quot; sang &quot;có&quot;.
        </p>
        <p>
          Hàm <strong>sigmoid</strong> tạo ra đường cong chữ S &mdash; chuyển đổi mượt mà từ
          0 đến 1, chính là xác suất thuộc lớp dương.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Kéo thanh trượt để di chuyển ranh giới quyết định và điều chỉnh độ dốc sigmoid.
        </p>
        <svg
          viewBox="0 0 500 320"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Background regions */}
          <rect x={0} y={0} width={boundary} height={320} fill="#3b82f6" opacity={0.06} />
          <rect x={boundary} y={0} width={500 - boundary} height={320} fill="#ef4444" opacity={0.06} />

          {/* Decision boundary */}
          <line x1={boundary} y1={0} x2={boundary} y2={320} stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6 3" />

          {/* Sigmoid curve */}
          <path d={sigmoidPath()} fill="none" stroke="#3b82f6" strokeWidth={2.5} />

          {/* Class A points */}
          {classAPoints.map((p, i) => (
            <circle key={`a-${i}`} cx={p.x} cy={p.y} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />
          ))}

          {/* Class B points */}
          {classBPoints.map((p, i) => (
            <circle key={`b-${i}`} cx={p.x} cy={p.y} r={5} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />
          ))}

          {/* Labels */}
          <text x={boundary / 2} y={310} fontSize={12} fill="#3b82f6" textAnchor="middle" fontWeight={600}>
            Lớp A
          </text>
          <text x={boundary + (500 - boundary) / 2} y={310} fontSize={12} fill="#ef4444" textAnchor="middle" fontWeight={600}>
            Lớp B
          </text>
          <text x={boundary} y={16} fontSize={11} fill="#8b5cf6" textAnchor="middle">
            Ranh giới
          </text>
        </svg>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-4">
            <label className="w-28 text-sm font-medium text-foreground">Ranh giới:</label>
            <input
              type="range"
              min={100}
              max={400}
              value={boundary}
              onChange={(e) => setBoundary(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="w-28 text-sm font-medium text-foreground">Độ dốc:</label>
            <input
              type="range"
              min={1}
              max={20}
              value={steepness}
              onChange={(e) => setSteepness(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Hồi quy logistic (Logistic Regression)</strong> là thuật toán phân loại
          nhị phân phổ biến nhất. Dù có tên &quot;hồi quy&quot;, nó thực chất là thuật toán
          <strong> phân loại</strong>: dự đoán xác suất mẫu thuộc lớp dương.
        </p>
        <p>
          Ý tưởng: tính tổ hợp tuyến tính <em>z = wx + b</em>, rồi đưa qua hàm
          <strong> sigmoid</strong>: <em>&sigma;(z) = 1/(1+e⁻ᶻ)</em> để nén giá trị về
          khoảng [0, 1]. Nếu xác suất &ge; 0.5 thì dự đoán lớp dương, ngược lại dự đoán lớp âm.
        </p>
        <p>
          Hàm mất mát là <strong>binary cross-entropy</strong>, được tối ưu bằng gradient
          descent. Mặc dù đơn giản, logistic regression vẫn rất hiệu quả và được dùng rộng
          rãi trong y tế, tài chính, và marketing.
        </p>
      </ExplanationSection>
    </>
  );
}
