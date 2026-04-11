"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gradient-boosting",
  title: "Gradient Boosting",
  titleVi: "Tăng cường gradient",
  description: "Xây dựng mô hình mạnh bằng cách nối tiếp các mô hình yếu, mỗi mô hình sửa sai cho mô hình trước",
  category: "classic-ml",
  tags: ["ensemble", "boosting", "supervised-learning"],
  difficulty: "intermediate",
  relatedSlugs: ["decision-trees", "random-forests", "bias-variance"],
  vizType: "interactive",
};

const trueValues = [200, 120, 250, 80, 180, 150, 220];
const labels = ["A", "B", "C", "D", "E", "F", "G"];

function getStepPredictions(step: number) {
  const base = 170;
  const corrections = [
    [0, 0, 0, 0, 0, 0, 0],
    [10, -20, 30, -40, 5, -10, 20],
    [5, -10, 15, -15, 2, -5, 10],
    [8, -5, 8, -10, 1, -3, 5],
    [4, -3, 4, -5, 1, -1, 3],
  ];

  const predictions = trueValues.map(() => base);
  for (let s = 1; s <= step; s++) {
    if (s < corrections.length) {
      predictions.forEach((_, i) => {
        predictions[i] += corrections[s][i];
      });
    }
  }
  return predictions;
}

export default function GradientBoostingTopic() {
  const [step, setStep] = useState(0);
  const predictions = getStepPredictions(step);

  const maxY = 280;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang học bắn cung. Mũi tên đầu tiên lệch xa bia. Bạn quan
          sát <strong>sai số</strong> và điều chỉnh &mdash; mũi tiếp theo đỡ lệch hơn. Rồi
          bạn lại điều chỉnh tiếp. Mỗi lần bắn, bạn chỉ tập trung sửa phần sai còn lại.
        </p>
        <p>
          <strong>Gradient Boosting</strong> hoạt động tương tự: mỗi mô hình nhỏ tiếp theo
          chỉ học từ <strong>phần sai số</strong> (residual) mà các mô hình trước chưa giải
          quyết được.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp nút để đi qua từng bước boosting. Quan sát dự đoán (cam) tiến gần giá trị
          thực (xanh) qua mỗi vòng.
        </p>
        <svg
          viewBox="0 0 500 320"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Bars */}
          {trueValues.map((val, i) => {
            const x = 40 + i * 65;
            const trueH = (val / 300) * maxY;
            const predH = (predictions[i] / 300) * maxY;
            return (
              <g key={i}>
                {/* True value bar */}
                <rect
                  x={x - 15} y={maxY - trueH + 20}
                  width={14} height={trueH}
                  fill="#3b82f6" opacity={0.3} rx={3}
                />
                {/* Prediction bar */}
                <rect
                  x={x + 1} y={maxY - predH + 20}
                  width={14} height={predH}
                  fill="#f97316" rx={3}
                />
                {/* Label */}
                <text x={x} y={310} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
                  {labels[i]}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <rect x={350} y={8} width={12} height={12} fill="#3b82f6" opacity={0.3} rx={2} />
          <text x={367} y={18} fontSize={10} fill="currentColor" className="text-muted">Thực tế</text>
          <rect x={350} y={26} width={12} height={12} fill="#f97316" rx={2} />
          <text x={367} y={36} fontSize={10} fill="currentColor" className="text-muted">Dự đoán</text>

          {/* Step label */}
          <text x={15} y={18} fontSize={13} fill="#f97316" fontWeight={700}>
            Vòng {step}/{4}
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white disabled:opacity-30"
          >
            Lùi lại
          </button>
          <button
            onClick={() => setStep(Math.min(4, step + 1))}
            disabled={step === 4}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white disabled:opacity-30"
          >
            Vòng tiếp
          </button>
          <button
            onClick={() => setStep(0)}
            className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
          >
            Đặt lại
          </button>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Gradient Boosting</strong> xây dựng mô hình theo cách <strong>tuần tự</strong>:
          mỗi mô hình mới được huấn luyện để dự đoán <em>phần sai số</em> (residual) của
          tổ hợp các mô hình trước đó.
        </p>
        <p>
          Khác với Random Forest (xây song song), Gradient Boosting xây <strong>nối tiếp</strong>,
          tập trung vào các mẫu khó. Tên gọi &quot;Gradient&quot; vì nó dùng gradient của hàm
          mất mát để xác định hướng cải thiện.
        </p>
        <p>
          Các thư viện phổ biến: <strong>XGBoost</strong>, <strong>LightGBM</strong>,
          <strong> CatBoost</strong>. Gradient Boosting thường đứng đầu trong các cuộc thi
          dữ liệu dạng bảng (tabular data) trên Kaggle.
        </p>
      </ExplanationSection>
    </>
  );
}
