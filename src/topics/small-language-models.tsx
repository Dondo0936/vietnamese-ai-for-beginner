"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "small-language-models",
  title: "Small Language Models",
  titleVi: "Mô hình ngôn ngữ nhỏ — Nhỏ mà có võ",
  description:
    "Mô hình ngôn ngữ dưới 10B tham số được tối ưu để chạy trên thiết bị cá nhân với chất lượng ngày càng tiệm cận mô hình lớn.",
  category: "emerging",
  tags: ["slm", "small", "efficient", "on-device"],
  difficulty: "intermediate",
  relatedSlugs: ["edge-ai", "inference-optimization", "moe"],
  vizType: "static",
};

export default function SmallLanguageModelsTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng sự khác biệt giữa <strong>siêu thị lớn</strong> (mô hình 70B+)
          và <strong>cửa hàng tiện lợi</strong> (mô hình dưới 10B). Siêu thị có mọi thứ nhưng
          phải lái xe đến — cửa hàng tiện lợi ngay góc phố, có đủ những thứ bạn
          cần hàng ngày.
        </p>
        <p>
          <strong>SLM</strong> giống cửa hàng tiện lợi — không biết &quot;mọi thứ trên đời&quot;
          nhưng đủ thông minh cho <strong>hầu hết tác vụ hàng ngày</strong>: trả lời câu hỏi,
          viết email, tóm tắt văn bản... và chạy <strong>ngay trên điện thoại</strong> của bạn!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 250" className="w-full max-w-2xl mx-auto">
            <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
              So sánh kích thước mô hình
            </text>
            {[
              { name: "Phi-3 Mini (3.8B)", size: 3.8, color: "#22c55e", device: "Điện thoại" },
              { name: "Gemma 2 (9B)", size: 9, color: "#3b82f6", device: "Laptop" },
              { name: "Llama 3 (70B)", size: 70, color: "#f59e0b", device: "Server GPU" },
              { name: "GPT-4 (~1.8T?)", size: 400, color: "#ef4444", device: "Cụm GPU lớn" },
            ].map((m, i) => {
              const y = 40 + i * 50;
              const barW = Math.min(350, (m.size / 400) * 350);
              return (
                <g key={i}>
                  <text x={20} y={y + 20} fill="#94a3b8" fontSize={10}>{m.name}</text>
                  <rect x={180} y={y + 5} width={350} height={26} rx={4} fill="#1e293b" />
                  <rect x={180} y={y + 5} width={Math.max(barW, 5)} height={26} rx={4} fill={m.color} opacity={0.8} />
                  <text x={540} y={y + 23} fill="#94a3b8" fontSize={9}>{m.device}</text>
                </g>
              );
            })}
            <text x={300} y={240} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              Mô hình nhỏ: chạy trên điện thoại | Mô hình lớn: cần cụm GPU
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Small Language Models (SLM)</strong> là mô hình ngôn ngữ với số tham số
          nhỏ (thường dưới 10B), được thiết kế để chạy hiệu quả trên thiết bị cá nhân
          như điện thoại, laptop hoặc máy tính bảng.
        </p>
        <p>Xu hướng SLM nổi bật:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Dữ liệu chất lượng cao:</strong> Thay vì tăng kích thước, SLM tập trung vào dữ liệu huấn luyện tốt hơn (chất lượng thắng số lượng).</li>
          <li><strong>Chưng cất kiến thức:</strong> Học từ mô hình lớn, giữ lại kiến thức quan trọng trong mô hình nhỏ.</li>
          <li><strong>Kiến trúc tối ưu:</strong> Thiết kế kiến trúc chuyên biệt cho kích thước nhỏ (Phi, Gemma).</li>
        </ol>
        <p>
          Đại diện tiêu biểu: <strong>Phi-3</strong> (Microsoft), <strong>Gemma</strong> (Google),
          <strong> Llama 3 8B</strong> (Meta). SLM đang thu hẹp khoảng cách chất lượng với mô hình lớn
          và mở ra kỷ nguyên <strong>AI chạy trên thiết bị cá nhân</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
