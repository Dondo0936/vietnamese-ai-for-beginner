"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "overfitting-underfitting",
  title: "Overfitting & Underfitting",
  titleVi: "Quá khớp & Chưa khớp",
  description:
    "Hai vấn đề đối lập khi huấn luyện mô hình: học quá ít hoặc học quá nhiều từ dữ liệu.",
  category: "neural-fundamentals",
  tags: ["training", "generalization", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["regularization", "epochs-batches", "loss-functions"],
  vizType: "interactive",
};

// Generate some noisy data points following a sine-like curve
const DATA_POINTS = [
  { x: 0.5, y: 1.2 }, { x: 1.0, y: 2.1 }, { x: 1.5, y: 2.5 },
  { x: 2.0, y: 2.0 }, { x: 2.5, y: 1.5 }, { x: 3.0, y: 1.8 },
  { x: 3.5, y: 2.8 }, { x: 4.0, y: 3.5 }, { x: 4.5, y: 3.2 },
  { x: 5.0, y: 2.0 }, { x: 5.5, y: 1.4 }, { x: 6.0, y: 1.9 },
];

export default function OverfittingUnderfittingTopic() {
  const [complexity, setComplexity] = useState(3); // 1=underfit, 3=good, 6=overfit

  const svgW = 460;
  const svgH = 250;
  const pad = 35;

  const toX = (v: number) => pad + ((v - 0) / 7) * (svgW - 2 * pad);
  const toY = (v: number) => svgH - pad - ((v - 0) / 5) * (svgH - 2 * pad);

  // Generate fitting curve based on complexity
  const fittingCurve = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * 7;
      let y: number;
      if (complexity <= 1) {
        // Underfit: straight line
        y = 1.5 + 0.15 * x;
      } else if (complexity <= 3) {
        // Good fit: smooth curve
        y = 1.0 + 1.5 * Math.sin(x * 0.8) + 0.3 * x * (complexity / 3);
      } else {
        // Overfit: passes through every point with wild oscillations
        const wave = Math.sin(x * complexity * 0.6) * (complexity * 0.2);
        const base = 1.0 + 1.5 * Math.sin(x * 0.8) + 0.3 * x * 0.7;
        y = base + wave;
      }
      y = Math.max(0, Math.min(5, y));
      points.push(`${toX(x)},${toY(y)}`);
    }
    return points.join(" ");
  }, [complexity]);

  let statusText: string;
  let statusColor: string;
  let trainError: string;
  let testError: string;
  if (complexity <= 1) {
    statusText = "Chưa khớp (Underfitting)";
    statusColor = "#3b82f6";
    trainError = "Cao";
    testError = "Cao";
  } else if (complexity <= 4) {
    statusText = "Khớp tốt (Good Fit)";
    statusColor = "#22c55e";
    trainError = "Thấp";
    testError = "Thấp";
  } else {
    statusText = "Quá khớp (Overfitting)";
    statusColor = "#ef4444";
    trainError = "Rất thấp";
    testError = "Cao";
  }

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>ôn thi</strong>. Có ba cách ôn:
        </p>
        <p>
          <strong>Underfitting (chưa khớp):</strong> Bạn lướt qua sách vài lần rồi
          đi thi. Bạn không nắm được kiến thức cơ bản, nên cả bài tập trong sách lẫn
          đề thi đều làm sai. (&quot;Học chưa đủ&quot;)
        </p>
        <p>
          <strong>Good fit (khớp tốt):</strong> Bạn học kỹ nguyên lý, hiểu bản chất.
          Bạn giải được cả bài trong sách lẫn đề thi mới. (&quot;Học vừa đủ&quot;)
        </p>
        <p>
          <strong>Overfitting (quá khớp):</strong> Bạn <em>học thuộc lòng</em> tất cả
          đáp án trong sách mà không hiểu. Bài trong sách thì đúng hết, nhưng gặp đề
          thi mới thì không biết làm! (&quot;Học vẹt&quot;)
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-5">
          {/* Complexity slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">
              Độ phức tạp mô hình:{" "}
              <strong className="text-foreground">{complexity}</strong>
            </label>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={complexity}
              onChange={(e) => setComplexity(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>Đơn giản (Underfit)</span>
              <span>Vừa phải</span>
              <span>Phức tạp (Overfit)</span>
            </div>
          </div>

          {/* Status */}
          <div
            className="rounded-lg p-3 text-center text-sm font-semibold"
            style={{
              color: statusColor,
              backgroundColor: `${statusColor}15`,
              border: `1px solid ${statusColor}40`,
            }}
          >
            {statusText}
          </div>

          {/* Graph */}
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-xl mx-auto">
            {/* Axes */}
            <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#334155" strokeWidth="1" />
            <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#334155" strokeWidth="1" />

            {/* Fitting curve */}
            <polyline
              points={fittingCurve}
              fill="none"
              stroke={statusColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Data points */}
            {DATA_POINTS.map((p, i) => (
              <g key={`dp-${i}`}>
                <circle cx={toX(p.x)} cy={toY(p.y)} r="5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
              </g>
            ))}

            {/* Labels */}
            <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#64748b" fontSize="10">
              Dữ liệu
            </text>
          </svg>

          {/* Error comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-xs text-muted mb-1">Lỗi trên dữ liệu huấn luyện</p>
              <p className="text-lg font-bold" style={{ color: statusColor }}>
                {trainError}
              </p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-xs text-muted mb-1">Lỗi trên dữ liệu mới (test)</p>
              <p className="text-lg font-bold" style={{ color: statusColor }}>
                {testError}
              </p>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Overfitting</strong> và <strong>Underfitting</strong> là hai vấn đề
          đối lập nhưng đều khiến mô hình hoạt động kém trên dữ liệu mới.
        </p>
        <p>
          <strong>Underfitting</strong> xảy ra khi mô hình quá đơn giản, không đủ khả
          năng nắm bắt các mẫu (pattern) trong dữ liệu. Dấu hiệu: lỗi cao trên cả
          tập train lẫn test. Cách khắc phục: tăng độ phức tạp mô hình, thêm đặc trưng,
          huấn luyện lâu hơn.
        </p>
        <p>
          <strong>Overfitting</strong> xảy ra khi mô hình quá phức tạp, &quot;thuộc
          lòng&quot; dữ liệu huấn luyện (kể cả nhiễu) thay vì học các mẫu tổng quát.
          Dấu hiệu: lỗi rất thấp trên train nhưng cao trên test. Cách khắc phục:
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Regularization:</strong> L1, L2, Dropout để giới hạn độ phức tạp.
          </li>
          <li>
            <strong>Early stopping:</strong> Dừng huấn luyện khi lỗi trên tập
            validation bắt đầu tăng.
          </li>
          <li>
            <strong>Thêm dữ liệu:</strong> Nhiều dữ liệu hơn giúp mô hình tổng quát
            hóa tốt hơn.
          </li>
          <li>
            <strong>Data augmentation:</strong> Tạo thêm dữ liệu bằng cách biến đổi
            dữ liệu hiện có.
          </li>
        </ul>
      </ExplanationSection>
    </>
  );
}
