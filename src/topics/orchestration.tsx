"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "orchestration",
  title: "Orchestration",
  titleVi: "Điều phối — Nhạc trưởng của hệ thống AI",
  description:
    "Tầng quản lý luồng công việc, điều phối giữa các Agent, công cụ và dịch vụ trong hệ thống AI phức tạp.",
  category: "ai-agents",
  tags: ["orchestration", "workflow", "coordination"],
  difficulty: "advanced",
  relatedSlugs: ["multi-agent", "agentic-workflows", "agent-architecture"],
  vizType: "static",
};

export default function OrchestrationTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng một <strong>dàn nhạc giao hưởng</strong>. Mỗi nhạc công
          (violon, kèn, trống...) đều giỏi nhạc cụ của mình, nhưng nếu không có
          <strong> nhạc trưởng</strong>, âm nhạc sẽ hỗn loạn.
        </p>
        <p>
          Nhạc trưởng biết khi nào violon nên chơi, khi nào kèn nên ngưng, khi nào
          tất cả cùng hòa tấu. <strong>Tầng điều phối</strong> trong hệ thống AI
          đóng vai trò nhạc trưởng — quyết định Agent nào hoạt động, dữ liệu chảy đi đâu,
          và khi nào kết quả đã sẵn sàng.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
            {/* Orchestrator */}
            <rect x={200} y={20} width={200} height={50} rx={12} fill="#3b82f6" stroke="#60a5fa" strokeWidth={2} />
            <text x={300} y={50} textAnchor="middle" fill="white" fontSize={13} fontWeight="bold">
              Tầng Điều phối
            </text>

            {/* Agents row */}
            {["Agent A", "Agent B", "Agent C"].map((name, i) => {
              const x = 100 + i * 200;
              return (
                <g key={i}>
                  <line x1={300} y1={70} x2={x} y2={120} stroke="#475569" strokeWidth={2} />
                  <rect x={x - 60} y={120} width={120} height={40} rx={8} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
                  <text x={x} y={145} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">{name}</text>
                </g>
              );
            })}

            {/* Tools row */}
            {["API", "Cơ sở dữ liệu", "LLM", "Tìm kiếm"].map((tool, i) => {
              const x = 75 + i * 150;
              return (
                <g key={i}>
                  <line x1={x} y1={200} x2={x} y2={230} stroke="#475569" strokeWidth={1.5} strokeDasharray="4,3" />
                  <rect x={x - 50} y={230} width={100} height={32} rx={6} fill="#1e293b" stroke="#22c55e" strokeWidth={1.5} />
                  <text x={x} y={251} textAnchor="middle" fill="#22c55e" fontSize={10} fontWeight="bold">{tool}</text>
                </g>
              );
            })}

            {/* Labels */}
            <text x={560} y={145} fill="#94a3b8" fontSize={10}>Agent</text>
            <text x={560} y={250} fill="#94a3b8" fontSize={10}>Công cụ</text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Điều phối (Orchestration)</strong> là tầng quản lý cấp cao trong hệ thống AI,
          chịu trách nhiệm điều hướng luồng công việc giữa nhiều Agent, công cụ và dịch vụ.
        </p>
        <p>Tầng điều phối đảm nhận các nhiệm vụ:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Định tuyến:</strong> Xác định Agent hoặc công cụ nào phù hợp cho từng tác vụ.</li>
          <li><strong>Quản lý trạng thái:</strong> Theo dõi tiến trình, kết quả trung gian và lỗi.</li>
          <li><strong>Xử lý lỗi:</strong> Thử lại, chuyển hướng hoặc thông báo khi có sự cố.</li>
          <li><strong>Tối ưu tài nguyên:</strong> Cân bằng tải, kiểm soát chi phí và độ trễ.</li>
        </ol>
        <p>
          Các framework phổ biến như <strong>LangGraph</strong>, <strong>CrewAI</strong>,
          và <strong>AutoGen</strong> cung cấp công cụ xây dựng tầng điều phối.
          Thiết kế tốt giúp hệ thống linh hoạt, dễ mở rộng và dễ gỡ lỗi.
        </p>
      </ExplanationSection>
    </>
  );
}
