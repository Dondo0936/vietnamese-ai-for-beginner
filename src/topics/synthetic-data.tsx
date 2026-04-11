"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "synthetic-data",
  title: "Synthetic Data",
  titleVi: "Dữ liệu tổng hợp — AI tạo dữ liệu cho AI",
  description:
    "Dữ liệu được tạo bằng AI hoặc mô phỏng, dùng để huấn luyện mô hình khi dữ liệu thật khan hiếm, đắt đỏ hoặc nhạy cảm.",
  category: "emerging",
  tags: ["synthetic-data", "generation", "augmentation", "privacy"],
  difficulty: "intermediate",
  relatedSlugs: ["small-language-models", "bias-fairness", "alignment"],
  vizType: "static",
};

export default function SyntheticDataTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn muốn huấn luyện <strong>phi công</strong>. Để phi công luyện
          tập, bạn không bắt họ bay máy bay thật ngay — quá đắt và nguy hiểm!
          Thay vào đó, bạn dùng <strong>buồng mô phỏng bay</strong> tạo ra hàng ngàn
          tình huống giả lập: thời tiết xấu, động cơ hỏng, hạ cánh khẩn cấp...
        </p>
        <p>
          <strong>Dữ liệu tổng hợp</strong> giống buồng mô phỏng — tạo ra dữ liệu huấn luyện
          &quot;giả nhưng hữu ích&quot; khi dữ liệu thật quá ít, quá đắt hoặc vi phạm quyền
          riêng tư.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 250" className="w-full max-w-2xl mx-auto">
            {/* Sources */}
            <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
              Nguồn tạo dữ liệu tổng hợp
            </text>
            {[
              { label: "LLM sinh văn bản", desc: "GPT-4, Claude tạo cặp Q&A", color: "#3b82f6", x: 100 },
              { label: "Mô phỏng", desc: "Tạo dữ liệu cảm biến, vật lý", color: "#22c55e", x: 300 },
              { label: "GAN / Diffusion", desc: "Tạo ảnh, âm thanh tổng hợp", color: "#f59e0b", x: 500 },
            ].map((s, i) => (
              <g key={i}>
                <rect x={s.x - 80} y={35} width={160} height={50} rx={10} fill={s.color} />
                <text x={s.x} y={57} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">{s.label}</text>
                <text x={s.x} y={73} textAnchor="middle" fill="white" fontSize={8}>{s.desc}</text>
              </g>
            ))}

            {/* Arrow down */}
            {[100, 300, 500].map((x, i) => (
              <line key={i} x1={x} y1={85} x2={300} y2={120} stroke="#475569" strokeWidth={1.5} />
            ))}

            {/* Synthetic Dataset */}
            <rect x={180} y={120} width={240} height={40} rx={10} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
            <text x={300} y={145} textAnchor="middle" fill="#8b5cf6" fontSize={11} fontWeight="bold">Tập dữ liệu tổng hợp</text>

            {/* Use cases */}
            <line x1={300} y1={160} x2={300} y2={180} stroke="#475569" strokeWidth={1.5} />
            {[
              { label: "Huấn luyện mô hình", x: 100 },
              { label: "Đánh giá / Test", x: 300 },
              { label: "Tăng cường dữ liệu", x: 500 },
            ].map((u, i) => (
              <g key={i}>
                <line x1={300} y1={180} x2={u.x} y2={200} stroke="#475569" strokeWidth={1} />
                <rect x={u.x - 70} y={200} width={140} height={30} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
                <text x={u.x} y={220} textAnchor="middle" fill="#94a3b8" fontSize={9}>{u.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Dữ liệu tổng hợp (Synthetic Data)</strong> là dữ liệu được tạo bằng
          thuật toán hoặc mô hình AI, không thu thập từ thế giới thực. Nó ngày càng quan trọng
          khi dữ liệu thật khan hiếm hoặc nhạy cảm.
        </p>
        <p>Ba ứng dụng chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Khắc phục khan hiếm dữ liệu:</strong> Tạo dữ liệu cho các lĩnh vực hiếm (bệnh lý, ngôn ngữ ít tài nguyên).</li>
          <li><strong>Bảo vệ quyền riêng tư:</strong> Tạo dữ liệu có tính chất tương tự nhưng không chứa thông tin cá nhân thật.</li>
          <li><strong>Cải thiện cân bằng:</strong> Bổ sung dữ liệu cho các nhóm ít đại diện, giảm thiên kiến.</li>
        </ol>
        <p>
          Thách thức lớn nhất: đảm bảo dữ liệu tổng hợp <strong>đủ đa dạng</strong> và
          <strong> không khuếch đại lỗi</strong> từ mô hình gốc. Xu hướng &quot;AI dạy AI&quot;
          đang phát triển nhưng cần kiểm soát chặt chẽ.
        </p>
      </ExplanationSection>
    </>
  );
}
