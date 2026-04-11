"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "hyperparameter-tuning",
  title: "Hyperparameter Tuning",
  titleVi: "Tinh chỉnh siêu tham số — Tìm công thức vàng",
  description:
    "Quá trình tìm kiếm bộ siêu tham số tối ưu (learning rate, batch size, layers...) để mô hình đạt hiệu suất cao nhất.",
  category: "foundations",
  tags: ["hyperparameter", "tuning", "optimization", "grid-search"],
  difficulty: "intermediate",
  relatedSlugs: ["learning-rate", "train-val-test", "overfitting-underfitting"],
  vizType: "interactive",
};

const METHODS = [
  { id: "grid", label: "Grid Search", desc: "Thử mọi tổ hợp trên lưới định trước", efficiency: 30 },
  { id: "random", label: "Random Search", desc: "Thử ngẫu nhiên — thường hiệu quả hơn grid", efficiency: 60 },
  { id: "bayesian", label: "Bayesian Optimization", desc: "Học từ kết quả trước để chọn thử nghiệm tiếp", efficiency: 85 },
];

export default function HyperparameterTuningTopic() {
  const [method, setMethod] = useState("grid");
  const m = METHODS.find((x) => x.id === method)!;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang <strong>nêm nếm một nồi phở</strong>. Bạn không biết
          chính xác cần bao nhiêu muối, đường, nước mắm — phải <strong>thử và nếm</strong>.
        </p>
        <p>
          <strong>Grid Search:</strong> Thử mọi tổ hợp — 1 thìa muối + 1 đường, 1 muối + 2 đường...
          <strong> Random Search:</strong> Thử ngẫu nhiên — may mắn có thể tìm nhanh hơn.
          <strong> Bayesian:</strong> Sau mỗi lần nếm, bạn suy luận hướng nêm tiếp — thông minh nhất!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex gap-3">
            {METHODS.map((x) => (
              <button
                key={x.id}
                onClick={() => setMethod(x.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  method === x.id ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {x.label}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 150" className="w-full max-w-2xl mx-auto">
            <text x={20} y={30} fill="#94a3b8" fontSize={11}>Hiệu quả tìm kiếm:</text>
            <rect x={20} y={40} width={500} height={30} rx={6} fill="#1e293b" />
            <rect x={20} y={40} width={500 * m.efficiency / 100} height={30} rx={6} fill={m.efficiency > 70 ? "#22c55e" : m.efficiency > 50 ? "#f59e0b" : "#ef4444"} />
            <text x={530} y={60} fill="white" fontSize={12} fontWeight="bold">{m.efficiency}%</text>

            <text x={20} y={100} fill="#e2e8f0" fontSize={11}>{m.desc}</text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Siêu tham số (Hyperparameters)</strong> là các thiết lập được chọn trước khi
          huấn luyện — khác với tham số (weights) mà mô hình tự học. Ví dụ: learning rate,
          batch size, số layers, regularization strength.
        </p>
        <p>Ba phương pháp tìm kiếm phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Grid Search:</strong> Thử mọi tổ hợp trên lưới giá trị. Đầy đủ nhưng rất tốn thời gian.</li>
          <li><strong>Random Search:</strong> Chọn ngẫu nhiên từ phân phối. Nghiên cứu cho thấy thường hiệu quả hơn grid search.</li>
          <li><strong>Bayesian Optimization:</strong> Xây dựng mô hình surrogate, chọn thử nghiệm tiếp dựa trên kết quả trước. Hiệu quả nhất.</li>
        </ol>
        <p>
          Công cụ phổ biến: <strong>Optuna</strong>, <strong>Ray Tune</strong>,
          <strong> W&B Sweeps</strong>. Tinh chỉnh tốt có thể cải thiện hiệu suất
          mô hình <strong>5-20%</strong> so với giá trị mặc định.
        </p>
      </ExplanationSection>
    </>
  );
}
