"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "data-preprocessing",
  title: "Data Preprocessing",
  titleVi: "Tiền xử lý dữ liệu — Rửa rau trước khi nấu",
  description:
    "Các bước làm sạch, chuẩn hoá và biến đổi dữ liệu thô trước khi đưa vào mô hình máy học.",
  category: "foundations",
  tags: ["preprocessing", "cleaning", "normalization", "data"],
  difficulty: "beginner",
  relatedSlugs: ["feature-engineering", "train-val-test", "data-preprocessing"],
  vizType: "static",
};

export default function DataPreprocessingTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn mua rau ở chợ. Trước khi nấu, bạn phải:
          <strong> rửa sạch</strong> (loại bỏ bụi bẩn), <strong>nhặt lá úa</strong>
          (loại bỏ dữ liệu hỏng), <strong>cắt đều</strong> (chuẩn hoá kích thước),
          và <strong>phân loại</strong> (rau xào riêng, rau luộc riêng).
        </p>
        <p>
          Dữ liệu thô cũng giống rau mới mua — đầy &quot;bụi bẩn&quot;: giá trị thiếu,
          ngoại lai, đơn vị khác nhau, dữ liệu trùng lặp. <strong>Tiền xử lý</strong>
          là bước &quot;rửa rau&quot; — không thể bỏ qua nếu muốn mô hình &quot;nấu&quot; ra
          kết quả ngon!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
            <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
              Pipeline tiền xử lý dữ liệu
            </text>
            {[
              { label: "Xử lý giá trị thiếu", desc: "Điền trung bình, trung vị, hoặc loại bỏ hàng", color: "#ef4444", icon: "🕳️" },
              { label: "Loại bỏ ngoại lai", desc: "Phát hiện và xử lý giá trị bất thường", color: "#f59e0b", icon: "📍" },
              { label: "Chuẩn hoá / Chuẩn tắc", desc: "Min-Max, Z-score để đưa về cùng thang đo", color: "#3b82f6", icon: "📏" },
              { label: "Mã hoá biến phân loại", desc: "One-hot, Label Encoding cho biến chữ", color: "#22c55e", icon: "🔢" },
              { label: "Xử lý mất cân bằng", desc: "Over/undersampling, SMOTE", color: "#8b5cf6", icon: "⚖️" },
            ].map((step, i) => {
              const y = 35 + i * 52;
              return (
                <g key={i}>
                  <rect x={30} y={y} width={540} height={40} rx={8} fill="#1e293b" stroke={step.color} strokeWidth={1.5} />
                  <text x={60} y={y + 15} fill={step.color} fontSize={11} fontWeight="bold">
                    Bước {i + 1}: {step.label}
                  </text>
                  <text x={60} y={y + 32} fill="#94a3b8" fontSize={9}>{step.desc}</text>
                  {i < 4 && (
                    <line x1={300} y1={y + 40} x2={300} y2={y + 52} stroke="#475569" strokeWidth={1.5} />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Tiền xử lý dữ liệu</strong> là bước quan trọng nhất trong pipeline ML —
          &quot;rác vào, rác ra&quot; (garbage in, garbage out). Dữ liệu sạch là nền tảng
          cho mọi mô hình tốt.
        </p>
        <p>Năm bước tiền xử lý cơ bản:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Xử lý giá trị thiếu:</strong> Điền bằng trung bình/trung vị, hoặc loại bỏ nếu quá nhiều.</li>
          <li><strong>Phát hiện ngoại lai:</strong> Dùng IQR, Z-score để tìm và xử lý giá trị bất thường.</li>
          <li><strong>Chuẩn hoá:</strong> Min-Max (0-1) hoặc Z-score (trung bình 0, độ lệch 1) để đồng nhất thang đo.</li>
          <li><strong>Mã hoá:</strong> Chuyển biến phân loại (text) thành số để mô hình xử lý được.</li>
          <li><strong>Cân bằng lớp:</strong> Xử lý khi một lớp chiếm đa số bằng over/under-sampling.</li>
        </ol>
        <p>
          Quy tắc thực tiễn: các nhà khoa học dữ liệu thường dành <strong>60-80% thời gian</strong>
          cho tiền xử lý và chỉ 20-40% cho xây dựng mô hình.
        </p>
      </ExplanationSection>
    </>
  );
}
