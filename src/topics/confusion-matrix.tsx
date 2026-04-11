"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "confusion-matrix",
  title: "Confusion Matrix",
  titleVi: "Ma trận nhầm lẫn",
  description: "Bảng đánh giá hiệu suất phân loại thể hiện True/False Positive/Negative",
  category: "classic-ml",
  tags: ["evaluation", "classification", "metrics"],
  difficulty: "beginner",
  relatedSlugs: ["logistic-regression", "cross-validation", "naive-bayes"],
  vizType: "interactive",
};

export default function ConfusionMatrixTopic() {
  const [threshold, setThreshold] = useState(50);

  const metrics = useMemo(() => {
    const tp = Math.round(40 + (50 - threshold) * 0.6);
    const fn = Math.round(10 + (threshold - 50) * 0.6);
    const fp = Math.round(5 + (50 - threshold) * 0.4);
    const tn = Math.round(45 + (threshold - 50) * 0.4);

    const precision = tp / Math.max(1, tp + fp);
    const recall = tp / Math.max(1, tp + fn);
    const accuracy = (tp + tn) / Math.max(1, tp + tn + fp + fn);
    const f1 = 2 * (precision * recall) / Math.max(0.001, precision + recall);

    return { tp, fn, fp, tn, precision, recall, accuracy, f1 };
  }, [threshold]);

  const cellW = 100;
  const cellH = 70;
  const startX = 170;
  const startY = 70;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng hệ thống phát hiện cháy rừng. Có 4 tình huống: (1) <strong>Đúng
          Dương (TP)</strong>: có cháy, hệ thống báo đúng. (2) <strong>Sai Âm (FN)</strong>:
          có cháy nhưng hệ thống bỏ sót &mdash; nguy hiểm nhất! (3) <strong>Sai Dương
          (FP)</strong>: không cháy nhưng hệ thống báo nhầm. (4) <strong>Đúng Âm (TN)</strong>:
          không cháy, hệ thống đúng.
        </p>
        <p>
          <strong>Ma trận nhầm lẫn</strong> tổng hợp 4 ô này, giúp ta thấy mô hình sai ở đâu.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Kéo thanh trượt ngưỡng (threshold) để thấy sự đánh đổi giữa precision và recall.
        </p>
        <svg
          viewBox="0 0 500 320"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Column headers */}
          <text x={startX + cellW / 2} y={startY - 15} fontSize={11} fill="#22c55e" textAnchor="middle" fontWeight={600}>
            Thực: Dương
          </text>
          <text x={startX + cellW + cellW / 2 + 5} y={startY - 15} fontSize={11} fill="#ef4444" textAnchor="middle" fontWeight={600}>
            Thực: Âm
          </text>

          {/* Row headers */}
          <text x={startX - 10} y={startY + cellH / 2 + 3} fontSize={11} fill="#3b82f6" textAnchor="end" fontWeight={600}>
            Dự đoán: Dương
          </text>
          <text x={startX - 10} y={startY + cellH + cellH / 2 + 8} fontSize={11} fill="#f97316" textAnchor="end" fontWeight={600}>
            Dự đoán: Âm
          </text>

          {/* TP */}
          <rect x={startX} y={startY} width={cellW} height={cellH} rx={8} fill="#22c55e" opacity={0.15} stroke="#22c55e" strokeWidth={2} />
          <text x={startX + cellW / 2} y={startY + 28} fontSize={24} fill="#22c55e" textAnchor="middle" fontWeight={700}>
            {metrics.tp}
          </text>
          <text x={startX + cellW / 2} y={startY + 50} fontSize={10} fill="#22c55e" textAnchor="middle">
            True Positive
          </text>

          {/* FP */}
          <rect x={startX + cellW + 5} y={startY} width={cellW} height={cellH} rx={8} fill="#f97316" opacity={0.15} stroke="#f97316" strokeWidth={2} />
          <text x={startX + cellW + 5 + cellW / 2} y={startY + 28} fontSize={24} fill="#f97316" textAnchor="middle" fontWeight={700}>
            {metrics.fp}
          </text>
          <text x={startX + cellW + 5 + cellW / 2} y={startY + 50} fontSize={10} fill="#f97316" textAnchor="middle">
            False Positive
          </text>

          {/* FN */}
          <rect x={startX} y={startY + cellH + 5} width={cellW} height={cellH} rx={8} fill="#ef4444" opacity={0.15} stroke="#ef4444" strokeWidth={2} />
          <text x={startX + cellW / 2} y={startY + cellH + 33} fontSize={24} fill="#ef4444" textAnchor="middle" fontWeight={700}>
            {metrics.fn}
          </text>
          <text x={startX + cellW / 2} y={startY + cellH + 55} fontSize={10} fill="#ef4444" textAnchor="middle">
            False Negative
          </text>

          {/* TN */}
          <rect x={startX + cellW + 5} y={startY + cellH + 5} width={cellW} height={cellH} rx={8} fill="#3b82f6" opacity={0.15} stroke="#3b82f6" strokeWidth={2} />
          <text x={startX + cellW + 5 + cellW / 2} y={startY + cellH + 33} fontSize={24} fill="#3b82f6" textAnchor="middle" fontWeight={700}>
            {metrics.tn}
          </text>
          <text x={startX + cellW + 5 + cellW / 2} y={startY + cellH + 55} fontSize={10} fill="#3b82f6" textAnchor="middle">
            True Negative
          </text>

          {/* Metrics */}
          <text x={20} y={250} fontSize={11} fill="currentColor" className="text-foreground">
            Accuracy: {(metrics.accuracy * 100).toFixed(1)}%
          </text>
          <text x={20} y={270} fontSize={11} fill="#22c55e">
            Precision: {(metrics.precision * 100).toFixed(1)}%
          </text>
          <text x={20} y={290} fontSize={11} fill="#3b82f6">
            Recall: {(metrics.recall * 100).toFixed(1)}%
          </text>
          <text x={20} y={310} fontSize={11} fill="#8b5cf6">
            F1 Score: {(metrics.f1 * 100).toFixed(1)}%
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Ngưỡng quyết định:</label>
          <input
            type="range"
            min={20}
            max={80}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="w-10 text-center text-sm font-bold text-accent">{threshold}%</span>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Ma trận nhầm lẫn (Confusion Matrix)</strong> là bảng 2&times;2 tóm tắt
          hiệu suất mô hình phân loại nhị phân. Từ 4 ô TP, TN, FP, FN, ta tính được nhiều
          chỉ số quan trọng.
        </p>
        <p>
          <strong>Precision</strong> = TP/(TP+FP): trong số dự đoán dương, bao nhiêu đúng?
          <strong> Recall</strong> = TP/(TP+FN): trong số thực sự dương, ta tìm được bao nhiêu?
          <strong> F1</strong>: trung bình điều hòa của precision và recall.
        </p>
        <p>
          Khi hạ ngưỡng: recall tăng (tìm được nhiều hơn) nhưng precision giảm (nhiều báo
          nhầm hơn). Tùy bài toán mà ưu tiên: y tế thường ưu tiên recall cao (không bỏ sót
          bệnh), lọc spam ưu tiên precision cao (không xóa email quan trọng).
        </p>
      </ExplanationSection>
    </>
  );
}
