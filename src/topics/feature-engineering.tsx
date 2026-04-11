"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "feature-engineering",
  title: "Feature Engineering",
  titleVi: "Kỹ thuật đặc trưng — Nghệ thuật chọn nguyên liệu",
  description:
    "Quá trình tạo, chọn lọc và biến đổi các đặc trưng đầu vào để mô hình máy học dễ học và dự đoán chính xác hơn.",
  category: "foundations",
  tags: ["features", "engineering", "transformation", "selection"],
  difficulty: "beginner",
  relatedSlugs: ["data-preprocessing", "dimensionality-curse", "train-val-test"],
  vizType: "interactive",
};

const RAW_FEATURES = [
  { name: "Ngày sinh", value: "15/03/1990" },
  { name: "Thu nhập", value: "25.000.000 VNĐ" },
  { name: "Địa chỉ", value: "123 Nguyễn Huệ, Q1, TP.HCM" },
];

const ENGINEERED = [
  { name: "Tuổi", value: "36", method: "Tính từ ngày sinh" },
  { name: "Nhóm thu nhập", value: "Trung bình", method: "Phân nhóm (binning)" },
  { name: "Quận", value: "Q1", method: "Trích xuất từ địa chỉ" },
  { name: "Thành phố", value: "TP.HCM", method: "Trích xuất từ địa chỉ" },
  { name: "Log thu nhập", value: "17.03", method: "Biến đổi logarithm" },
];

export default function FeatureEngineeringTopic() {
  const [showEngineered, setShowEngineered] = useState(false);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn muốn nấu một bữa cơm ngon. <strong>Nguyên liệu thô</strong>
          (gạo, thịt, rau) quan trọng, nhưng <strong>cách chế biến</strong> mới là then chốt:
          thái miếng vừa, ướp gia vị, nấu đúng lửa.
        </p>
        <p>
          <strong>Feature Engineering</strong> giống cách chế biến — biến dữ liệu thô
          (&quot;ngày sinh: 15/03/1990&quot;) thành đặc trưng hữu ích (&quot;tuổi: 36&quot;).
          Mô hình ML không thể ăn nguyên liệu sống — cần &quot;nấu chín&quot; dữ liệu
          để mô hình &quot;tiêu hoá&quot; dễ dàng!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <button
            onClick={() => setShowEngineered(!showEngineered)}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white"
          >
            {showEngineered ? "Xem dữ liệu thô" : "Biến đổi đặc trưng"}
          </button>
          <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
            {!showEngineered ? (
              <>
                <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">Dữ liệu thô</text>
                {RAW_FEATURES.map((f, i) => {
                  const y = 35 + i * 55;
                  return (
                    <g key={i}>
                      <rect x={50} y={y} width={500} height={40} rx={8} fill="#1e293b" stroke="#ef4444" strokeWidth={1.5} />
                      <text x={80} y={y + 25} fill="#ef4444" fontSize={11} fontWeight="bold">{f.name}:</text>
                      <text x={250} y={y + 25} fill="#94a3b8" fontSize={11}>{f.value}</text>
                    </g>
                  );
                })}
              </>
            ) : (
              <>
                <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">Sau kỹ thuật đặc trưng</text>
                {ENGINEERED.map((f, i) => {
                  const y = 30 + i * 38;
                  return (
                    <g key={i}>
                      <rect x={50} y={y} width={500} height={30} rx={6} fill="#1e293b" stroke="#22c55e" strokeWidth={1.5} />
                      <text x={80} y={y + 20} fill="#22c55e" fontSize={10} fontWeight="bold">{f.name}:</text>
                      <text x={210} y={y + 20} fill="white" fontSize={10}>{f.value}</text>
                      <text x={370} y={y + 20} fill="#94a3b8" fontSize={9}>← {f.method}</text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Feature Engineering</strong> (Kỹ thuật đặc trưng) là quá trình tạo, chọn lọc
          và biến đổi các biến đầu vào để cải thiện hiệu suất mô hình máy học.
        </p>
        <p>Các kỹ thuật phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Tạo đặc trưng mới:</strong> Tính tuổi từ ngày sinh, tạo tỷ lệ, kết hợp biến.</li>
          <li><strong>Biến đổi:</strong> Log, bình phương, chuẩn hoá để phân phối phù hợp hơn.</li>
          <li><strong>Mã hoá:</strong> Chuyển dữ liệu phân loại thành số (one-hot, label encoding).</li>
          <li><strong>Chọn lọc:</strong> Loại bỏ đặc trưng không liên quan hoặc trùng lặp.</li>
        </ol>
        <p>
          Trong deep learning, mạng nơ-ron tự động học đặc trưng (feature learning).
          Tuy nhiên, feature engineering vẫn rất quan trọng trong ML truyền thống và
          có thể cải thiện cả mô hình deep learning.
        </p>
      </ExplanationSection>
    </>
  );
}
