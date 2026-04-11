"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "dimensionality-curse",
  title: "Curse of Dimensionality",
  titleVi: "Lời nguyền chiều cao — Khi nhiều hơn lại tệ hơn",
  description:
    "Hiện tượng hiệu suất mô hình giảm khi số chiều đặc trưng tăng quá nhiều so với lượng dữ liệu có sẵn.",
  category: "foundations",
  tags: ["dimensionality", "curse", "features", "overfitting"],
  difficulty: "intermediate",
  relatedSlugs: ["pca", "feature-engineering", "overfitting-underfitting"],
  vizType: "interactive",
};

export default function DimensionalityCurseTopic() {
  const [dims, setDims] = useState(2);
  const dataNeeded = Math.pow(10, dims);
  const sparsity = dims > 3 ? ((1 - 1 / Math.pow(2, dims)) * 100).toFixed(1) : "thấp";

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn tìm một quả bóng trong <strong>căn phòng</strong>. Phòng 1 chiều
          (đường thẳng 10m): dễ tìm. Phòng 2 chiều (10m x 10m): khó hơn một chút.
          Phòng 3 chiều (10 x 10 x 10m): khó hơn nữa.
        </p>
        <p>
          Khi &quot;phòng&quot; có <strong>100 chiều</strong>, dù có hàng triệu quả bóng,
          không gian vẫn <strong>rộng lớn kinh khủng</strong> — mỗi quả bóng cô đơn
          trong vùng trống mênh mông. Đây là <strong>lời nguyền chiều cao</strong>:
          càng nhiều đặc trưng, dữ liệu càng &quot;thưa thớt&quot; và mô hình càng khó học.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted">Số chiều: {dims}</label>
            <input
              type="range" min={1} max={10} step={1}
              value={dims}
              onChange={(e) => setDims(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
          <svg viewBox="0 0 600 160" className="w-full max-w-2xl mx-auto">
            <text x={20} y={30} fill="#94a3b8" fontSize={11}>Dữ liệu cần thiết (ước tính):</text>
            <rect x={20} y={40} width={500} height={28} rx={4} fill="#1e293b" />
            <rect
              x={20} y={40}
              width={Math.min(500, 500 * Math.log10(dataNeeded) / 10)}
              height={28} rx={4} fill={dims > 5 ? "#ef4444" : "#22c55e"}
            />
            <text x={530} y={59} fill="white" fontSize={11} fontWeight="bold">
              {dataNeeded > 1e9 ? "10^" + dims : dataNeeded.toLocaleString()} mẫu
            </text>

            <text x={20} y={100} fill="#94a3b8" fontSize={11}>
              Độ thưa thớt: <tspan fill={dims > 3 ? "#ef4444" : "#22c55e"} fontWeight="bold">
                {typeof sparsity === "string" && sparsity !== "thấp" ? sparsity + "%" : sparsity}
              </tspan>
            </text>
            <text x={20} y={130} fill="#94a3b8" fontSize={10}>
              {dims <= 3
                ? "Không gian vừa đủ — dữ liệu phủ tốt."
                : dims <= 6
                  ? "Bắt đầu thưa thớt — cần nhiều dữ liệu hơn."
                  : "Lời nguyền chiều cao! Dữ liệu cực kỳ thưa thớt."}
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Lời nguyền chiều cao</strong> mô tả hiện tượng khi số chiều đặc trưng tăng,
          không gian dữ liệu mở rộng theo cấp số nhân, khiến dữ liệu trở nên thưa thớt
          và mô hình khó tổng quát hoá.
        </p>
        <p>Hậu quả:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Dữ liệu thưa thớt:</strong> Cần lượng dữ liệu tăng theo cấp số nhân với số chiều.</li>
          <li><strong>Khoảng cách vô nghĩa:</strong> Mọi điểm dữ liệu gần như cách đều nhau — KNN, clustering mất hiệu quả.</li>
          <li><strong>Overfitting:</strong> Quá nhiều đặc trưng so với mẫu → mô hình học nhiễu thay vì quy luật.</li>
        </ol>
        <p>
          Giải pháp: <strong>giảm chiều</strong> (PCA, t-SNE), <strong>chọn đặc trưng</strong>
          (feature selection), <strong>regularization</strong>, và thu thập thêm dữ liệu.
        </p>
      </ExplanationSection>
    </>
  );
}
