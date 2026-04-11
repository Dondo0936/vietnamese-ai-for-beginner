"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bias-variance",
  title: "Bias-Variance Tradeoff",
  titleVi: "Đánh đổi Bias-Variance",
  description: "Sự cân bằng giữa mô hình quá đơn giản (underfitting) và quá phức tạp (overfitting)",
  category: "classic-ml",
  tags: ["theory", "overfitting", "model-selection"],
  difficulty: "intermediate",
  relatedSlugs: ["polynomial-regression", "cross-validation", "random-forests"],
  vizType: "interactive",
};

export default function BiasVarianceTopic() {
  const [complexity, setComplexity] = useState(5);

  const maxC = 10;
  const bias = Math.max(5, 100 - complexity * 12);
  const variance = Math.max(5, complexity * 12 - 10);
  const totalError = bias + variance + 15;

  const chartW = 440;
  const chartH = 200;
  const chartX = 30;
  const chartY = 30;

  const biasPath = Array.from({ length: 11 }, (_, i) => {
    const x = chartX + (i / maxC) * chartW;
    const y = chartY + chartH - (Math.max(5, 100 - i * 12) / 120) * chartH;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  const variancePath = Array.from({ length: 11 }, (_, i) => {
    const x = chartX + (i / maxC) * chartW;
    const y = chartY + chartH - (Math.max(5, i * 12 - 10) / 120) * chartH;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  const totalPath = Array.from({ length: 11 }, (_, i) => {
    const b = Math.max(5, 100 - i * 12);
    const v = Math.max(5, i * 12 - 10);
    const t = b + v + 15;
    const x = chartX + (i / maxC) * chartW;
    const y = chartY + chartH - (t / 200) * chartH;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  const curX = chartX + (complexity / maxC) * chartW;

  const zone =
    complexity <= 3 ? "Underfitting" :
    complexity <= 7 ? "Cân bằng tốt" :
    "Overfitting";

  const zoneColor =
    complexity <= 3 ? "#ef4444" :
    complexity <= 7 ? "#22c55e" :
    "#ef4444";

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang bắn cung vào bia. <strong>Bias cao</strong> nghĩa là
          tất cả mũi tên đều lệch sang một bên (sai hệ thống) &mdash; mô hình quá đơn giản.
          <strong> Variance cao</strong> nghĩa là các mũi tên tán loạn khắp nơi &mdash; mô
          hình quá nhạy với dữ liệu huấn luyện.
        </p>
        <p>
          Mục tiêu là tìm <strong>điểm cân bằng</strong>: mô hình vừa đủ phức tạp để nắm
          bắt quy luật, nhưng không quá phức tạp để &quot;nhớ&quot; nhiễu.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Kéo thanh trượt để thay đổi độ phức tạp mô hình. Quan sát bias giảm nhưng
          variance tăng.
        </p>
        <svg
          viewBox="0 0 500 280"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Grid */}
          {[0, 50, 100, 150, 200].map((v) => (
            <line
              key={v}
              x1={chartX} y1={chartY + chartH - (v / 200) * chartH}
              x2={chartX + chartW} y2={chartY + chartH - (v / 200) * chartH}
              stroke="currentColor" className="text-border" strokeWidth={0.5}
            />
          ))}

          {/* Curves */}
          <path d={biasPath} fill="none" stroke="#3b82f6" strokeWidth={2.5} />
          <path d={variancePath} fill="none" stroke="#f97316" strokeWidth={2.5} />
          <path d={totalPath} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" />

          {/* Current position line */}
          <line x1={curX} y1={chartY} x2={curX} y2={chartY + chartH} stroke={zoneColor} strokeWidth={1.5} strokeDasharray="4 3" />

          {/* Zone label */}
          <text x={curX} y={chartY - 5} fontSize={12} fill={zoneColor} textAnchor="middle" fontWeight={700}>
            {zone}
          </text>

          {/* Axis labels */}
          <text x={chartX + chartW / 2} y={chartY + chartH + 25} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
            Độ phức tạp mô hình &rarr;
          </text>
          <text x={8} y={chartY + chartH / 2} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle" transform={`rotate(-90, 8, ${chartY + chartH / 2})`}>
            Sai số
          </text>

          {/* Legend */}
          <line x1={chartX} y1={chartY + chartH + 40} x2={chartX + 25} y2={chartY + chartH + 40} stroke="#3b82f6" strokeWidth={2.5} />
          <text x={chartX + 30} y={chartY + chartH + 44} fontSize={10} fill="#3b82f6">Bias&sup2;</text>

          <line x1={chartX + 90} y1={chartY + chartH + 40} x2={chartX + 115} y2={chartY + chartH + 40} stroke="#f97316" strokeWidth={2.5} />
          <text x={chartX + 120} y={chartY + chartH + 44} fontSize={10} fill="#f97316">Variance</text>

          <line x1={chartX + 200} y1={chartY + chartH + 40} x2={chartX + 225} y2={chartY + chartH + 40} stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" />
          <text x={chartX + 230} y={chartY + chartH + 44} fontSize={10} fill="#ef4444">Tổng sai số</text>
        </svg>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Độ phức tạp:</label>
          <input
            type="range"
            min={0}
            max={10}
            value={complexity}
            onChange={(e) => setComplexity(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="w-6 text-center text-sm font-bold text-accent">{complexity}</span>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Bias</strong> đo sai số do mô hình quá đơn giản (thiếu khớp - underfitting).
          <strong> Variance</strong> đo sai số do mô hình quá nhạy với dữ liệu huấn luyện
          (quá khớp - overfitting).
        </p>
        <p>
          Công thức phân rã sai số: <em>Tổng sai số = Bias&sup2; + Variance + Nhiễu không
          thể giảm</em>. Khi tăng độ phức tạp, bias giảm nhưng variance tăng. Điểm tối ưu
          là nơi tổng sai số nhỏ nhất.
        </p>
        <p>
          Cách kiểm soát: dùng <strong>regularization</strong> để hạn chế phức tạp,
          <strong> cross-validation</strong> để ước lượng sai số tổng quát hóa, và <strong>
          ensemble methods</strong> (như Random Forest) để giảm variance mà không tăng bias.
        </p>
      </ExplanationSection>
    </>
  );
}
