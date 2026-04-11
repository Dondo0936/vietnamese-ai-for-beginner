"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "agent-evaluation",
  title: "Agent Evaluation",
  titleVi: "Đánh giá Agent — Đo lường AI tự chủ",
  description:
    "Các phương pháp và tiêu chí để đánh giá hiệu quả, độ chính xác và an toàn của AI Agent.",
  category: "ai-agents",
  tags: ["evaluation", "benchmark", "agent", "metrics"],
  difficulty: "advanced",
  relatedSlugs: ["agent-architecture", "agentic-workflows", "guardrails"],
  vizType: "static",
};

const METRICS = [
  { label: "Tỷ lệ hoàn thành", value: "85%", color: "#22c55e" },
  { label: "Số bước trung bình", value: "4.2", color: "#3b82f6" },
  { label: "Tỷ lệ sử dụng công cụ đúng", value: "92%", color: "#8b5cf6" },
  { label: "Chi phí token trung bình", value: "2.4K", color: "#f59e0b" },
  { label: "Tỷ lệ lỗi", value: "8%", color: "#ef4444" },
];

export default function AgentEvaluationTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>giám đốc nhân sự</strong> đánh giá nhân viên cuối năm.
          Bạn không chỉ nhìn vào <em>kết quả</em> mà còn xem <em>quá trình</em>:
        </p>
        <p>
          Nhân viên có hoàn thành công việc không? Mất bao lâu? Có dùng đúng công cụ không?
          Chi phí bao nhiêu? Có mắc lỗi nghiêm trọng nào không? Đánh giá AI Agent cũng cần
          xem xét nhiều khía cạnh tương tự — không chỉ <strong>kết quả cuối cùng</strong>
          mà cả <strong>cách Agent đạt được kết quả đó</strong>.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            <text x={300} y={25} textAnchor="middle" fill="#e2e8f0" fontSize={14} fontWeight="bold">
              Bảng đánh giá Agent
            </text>
            {METRICS.map((m, i) => {
              const y = 50 + i * 45;
              const barWidth = parseFloat(m.value) || 50;
              const normalizedWidth = Math.min(barWidth * 3.5, 350);
              return (
                <g key={i}>
                  <text x={20} y={y + 20} fill="#94a3b8" fontSize={12}>
                    {m.label}
                  </text>
                  <rect x={200} y={y + 5} width={normalizedWidth} height={22} rx={4} fill={m.color} opacity={0.8} />
                  <text x={200 + normalizedWidth + 10} y={y + 21} fill="white" fontSize={12} fontWeight="bold">
                    {m.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Đánh giá Agent</strong> khác biệt căn bản so với đánh giá mô hình AI thông thường
          vì Agent tương tác với môi trường, sử dụng công cụ và trải qua nhiều bước.
        </p>
        <p>Các chiều đánh giá quan trọng:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Tỷ lệ hoàn thành:</strong> Agent có giải quyết được nhiệm vụ không?</li>
          <li><strong>Hiệu quả:</strong> Cần bao nhiêu bước, token, và thời gian?</li>
          <li><strong>Sử dụng công cụ:</strong> Agent có chọn đúng công cụ và truyền đúng tham số?</li>
          <li><strong>An toàn:</strong> Agent có thực hiện hành động nguy hiểm hoặc ngoài phạm vi không?</li>
          <li><strong>Chi phí:</strong> Tổng chi phí API và tài nguyên tiêu thụ.</li>
        </ol>
        <p>
          Các bộ benchmark phổ biến gồm <strong>SWE-bench</strong> (sửa lỗi mã nguồn),
          <strong> WebArena</strong> (điều hướng web), và <strong>GAIA</strong> (tác vụ tổng quát).
          Đánh giá nên kết hợp cả <strong>tự động</strong> và <strong>con người đánh giá</strong>.
        </p>
      </ExplanationSection>
    </>
  );
}
