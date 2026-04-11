"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "cost-optimization",
  title: "Cost Optimization",
  titleVi: "Tối ưu chi phí — AI không đốt tiền",
  description:
    "Chiến lược giảm chi phí vận hành hệ thống AI mà không hy sinh chất lượng, từ chọn mô hình đến quản lý tài nguyên.",
  category: "infrastructure",
  tags: ["cost", "optimization", "budget", "efficiency"],
  difficulty: "intermediate",
  relatedSlugs: ["inference-optimization", "model-serving", "gpu-optimization"],
  vizType: "static",
};

export default function CostOptimizationTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn điều hành một <strong>nhà hàng</strong>. Không phải
          mọi món đều cần đầu bếp 5 sao — mì gói thì nhân viên mới cũng nấu được!
        </p>
        <p>
          Tương tự trong AI: không phải mọi yêu cầu đều cần GPT-4 —
          <strong> câu hỏi đơn giản</strong> dùng mô hình nhỏ,
          <strong> câu hỏi phức tạp</strong> mới dùng mô hình lớn. Kết hợp với
          <strong> caching</strong> (nhớ món đã nấu), <strong>batching</strong> (nấu chung),
          và <strong>tắt bếp khi vắng khách</strong> (auto-scaling) để tiết kiệm tối đa.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={13} fontWeight="bold">
              5 chiến lược tối ưu chi phí
            </text>
            {[
              { label: "Chọn mô hình phù hợp", saving: "50-80%", desc: "Dùng mô hình nhỏ cho tác vụ đơn giản", color: "#3b82f6" },
              { label: "Caching thông minh", saving: "30-60%", desc: "Lưu cache cho câu hỏi thường gặp", color: "#22c55e" },
              { label: "Lượng tử hoá", saving: "40-70%", desc: "Giảm kích thước mô hình, ít GPU hơn", color: "#f59e0b" },
              { label: "Auto-scaling", saving: "20-50%", desc: "Tự động mở rộng/thu hẹp theo tải", color: "#8b5cf6" },
              { label: "Prompt tối ưu", saving: "10-30%", desc: "Viết prompt ngắn gọn, giảm token", color: "#ef4444" },
            ].map((s, i) => {
              const y = 40 + i * 45;
              const barW = parseFloat(s.saving) * 3;
              return (
                <g key={i}>
                  <text x={20} y={y + 22} fill="#94a3b8" fontSize={10}>{s.label}</text>
                  <rect x={200} y={y + 7} width={300} height={24} rx={4} fill="#1e293b" />
                  <rect x={200} y={y + 7} width={barW} height={24} rx={4} fill={s.color} opacity={0.8} />
                  <text x={205 + barW} y={y + 24} fill="white" fontSize={10} fontWeight="bold">
                    {s.saving}
                  </text>
                  <text x={520} y={y + 24} fill="#94a3b8" fontSize={8}>{s.desc}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Tối ưu chi phí AI</strong> là chiến lược giảm thiểu chi phí vận hành
          hệ thống AI (GPU, API, bandwidth) mà vẫn duy trì chất lượng dịch vụ chấp nhận được.
        </p>
        <p>Năm chiến lược hiệu quả nhất:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Model routing:</strong> Dùng mô hình nhỏ rẻ cho tác vụ dễ, mô hình lớn cho tác vụ khó.</li>
          <li><strong>Semantic caching:</strong> Lưu câu trả lời cho các câu hỏi tương tự, tránh gọi API lại.</li>
          <li><strong>Lượng tử hoá:</strong> Giảm kích thước mô hình 2-4x, cần ít GPU hơn để phục vụ.</li>
          <li><strong>Auto-scaling:</strong> Tự động điều chỉnh tài nguyên theo lưu lượng thực tế.</li>
          <li><strong>Prompt engineering:</strong> Viết prompt ngắn gọn, hiệu quả — mỗi token đều có giá.</li>
        </ol>
        <p>
          Với các chiến lược trên, nhiều công ty đã giảm được <strong>70-90% chi phí AI</strong>
          mà không ảnh hưởng đáng kể đến trải nghiệm người dùng.
        </p>
      </ExplanationSection>
    </>
  );
}
