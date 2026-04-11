"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ensemble-methods",
  title: "Ensemble Methods",
  titleVi: "Phương pháp kết hợp — Đông tay vỗ nên kêu",
  description:
    "Kỹ thuật kết hợp nhiều mô hình yếu lại thành một mô hình mạnh hơn bất kỳ thành viên đơn lẻ nào.",
  category: "foundations",
  tags: ["ensemble", "bagging", "boosting", "stacking"],
  difficulty: "intermediate",
  relatedSlugs: ["random-forests", "gradient-boosting", "decision-trees"],
  vizType: "static",
};

export default function EnsembleMethodsTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn hỏi <strong>một người duy nhất</strong> đoán số kẹo trong hũ —
          có thể đoán sai xa. Nhưng nếu hỏi <strong>100 người</strong> rồi lấy trung bình,
          kết quả thường <strong>chính xác đáng kinh ngạc</strong>! Đây gọi là
          &quot;Trí tuệ đám đông&quot;.
        </p>
        <p>
          <strong>Ensemble</strong> áp dụng nguyên lý tương tự — kết hợp nhiều mô hình
          &quot;tầm thường&quot; lại thành một mô hình mạnh mẽ. Mỗi mô hình mắc lỗi khác
          nhau, khi kết hợp, các lỗi triệt tiêu lẫn nhau!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            {[
              {
                method: "Bagging (Bootstrap Aggregating)",
                desc: "Huấn luyện nhiều mô hình trên các tập con ngẫu nhiên, lấy trung bình/bình chọn",
                example: "Random Forest",
                color: "#3b82f6",
                y: 10,
              },
              {
                method: "Boosting",
                desc: "Huấn luyện tuần tự — mô hình sau tập trung sửa lỗi mô hình trước",
                example: "XGBoost, AdaBoost",
                color: "#22c55e",
                y: 100,
              },
              {
                method: "Stacking",
                desc: "Mô hình cấp trên học cách kết hợp dự đoán của các mô hình cấp dưới",
                example: "Meta-learner",
                color: "#f59e0b",
                y: 190,
              },
            ].map((m, i) => (
              <g key={i}>
                <rect x={20} y={m.y} width={560} height={75} rx={10} fill="#1e293b" stroke={m.color} strokeWidth={2} />
                <text x={40} y={m.y + 22} fill={m.color} fontSize={12} fontWeight="bold">{m.method}</text>
                <text x={40} y={m.y + 42} fill="#e2e8f0" fontSize={10}>{m.desc}</text>
                <text x={40} y={m.y + 60} fill="#94a3b8" fontSize={9}>Ví dụ: {m.example}</text>
              </g>
            ))}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Phương pháp kết hợp (Ensemble)</strong> tạo ra mô hình mạnh bằng cách
          kết hợp nhiều mô hình đơn giản hơn. Ba chiến lược chính:
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Bagging:</strong> Huấn luyện nhiều mô hình song song trên các tập dữ liệu
            con ngẫu nhiên (bootstrap), kết hợp bằng trung bình hoặc bình chọn. Giảm phương sai.
          </li>
          <li>
            <strong>Boosting:</strong> Huấn luyện tuần tự — mỗi mô hình mới tập trung vào
            các mẫu mà mô hình trước sai. Giảm thiên kiến.
          </li>
          <li>
            <strong>Stacking:</strong> Dùng một mô hình &quot;meta-learner&quot; để học cách
            kết hợp tối ưu dự đoán từ nhiều mô hình khác nhau.
          </li>
        </ol>
        <p>
          Ensemble là phương pháp chiến thắng hầu hết các cuộc thi ML (Kaggle) và được
          sử dụng rộng rãi trong công nghiệp. <strong>XGBoost</strong> và
          <strong> Random Forest</strong> là hai ứng dụng phổ biến nhất.
        </p>
      </ExplanationSection>
    </>
  );
}
