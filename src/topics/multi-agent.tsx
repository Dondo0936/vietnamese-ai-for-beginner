"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "multi-agent",
  title: "Multi-Agent Systems",
  titleVi: "Hệ thống đa Agent — Đội ngũ AI phối hợp",
  description:
    "Nhiều AI Agent chuyên biệt cùng phối hợp để giải quyết các bài toán phức tạp mà một Agent đơn lẻ khó xử lý.",
  category: "ai-agents",
  tags: ["multi-agent", "collaboration", "orchestration"],
  difficulty: "advanced",
  relatedSlugs: ["agent-architecture", "orchestration", "agentic-workflows"],
  vizType: "interactive",
};

const AGENTS = [
  { id: "researcher", label: "Nghiên cứu viên", color: "#3b82f6", x: 150, y: 60 },
  { id: "writer", label: "Biên tập viên", color: "#22c55e", x: 450, y: 60 },
  { id: "reviewer", label: "Kiểm duyệt viên", color: "#f59e0b", x: 150, y: 220 },
  { id: "coordinator", label: "Điều phối viên", color: "#ef4444", x: 300, y: 140 },
  { id: "coder", label: "Lập trình viên", color: "#8b5cf6", x: 450, y: 220 },
];

const MESSAGES = [
  { from: "coordinator", to: "researcher", text: "Tìm dữ liệu về chủ đề X" },
  { from: "researcher", to: "coordinator", text: "Đã tìm được 5 nguồn tham khảo" },
  { from: "coordinator", to: "writer", text: "Viết bài dựa trên dữ liệu này" },
  { from: "writer", to: "reviewer", text: "Bản nháp hoàn tất, xin kiểm duyệt" },
  { from: "reviewer", to: "coordinator", text: "Cần bổ sung phần kết luận" },
];

export default function MultiAgentTopic() {
  const [msgIndex, setMsgIndex] = useState(0);

  const advance = () => {
    if (msgIndex < MESSAGES.length - 1) setMsgIndex(msgIndex + 1);
  };

  const reset = () => setMsgIndex(0);

  const currentMsg = MESSAGES[msgIndex];
  const fromAgent = AGENTS.find((a) => a.id === currentMsg.from)!;
  const toAgent = AGENTS.find((a) => a.id === currentMsg.to)!;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang làm một <strong>bộ phim</strong>. Một người không thể
          vừa đạo diễn, vừa quay phim, vừa diễn xuất, vừa dựng hình. Thay vào đó,
          bạn cần <strong>một đội ngũ chuyên nghiệp</strong>:
        </p>
        <p>
          <strong>Đạo diễn</strong> (điều phối viên) chỉ đạo tổng thể,
          <strong> biên kịch</strong> (nghiên cứu viên) viết kịch bản,
          <strong> diễn viên</strong> (biên tập viên) thể hiện nội dung,
          <strong> nhà phê bình</strong> (kiểm duyệt viên) đánh giá chất lượng.
          Mỗi người làm tốt phần của mình, kết hợp lại tạo thành tác phẩm hoàn chỉnh!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
            {/* Connection arrow */}
            <line
              x1={fromAgent.x}
              y1={fromAgent.y}
              x2={toAgent.x}
              y2={toAgent.y}
              stroke="#60a5fa"
              strokeWidth={3}
              strokeDasharray="6,4"
            />

            {AGENTS.map((a) => (
              <g key={a.id}>
                <circle
                  cx={a.x}
                  cy={a.y}
                  r={32}
                  fill={a.id === currentMsg.from || a.id === currentMsg.to ? a.color : "#1e293b"}
                  stroke={a.color}
                  strokeWidth={2}
                />
                <text x={a.x} y={a.y + 4} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">
                  {a.label}
                </text>
              </g>
            ))}
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              <strong>{fromAgent.label}</strong> → <strong>{toAgent.label}</strong>:
              &quot;{currentMsg.text}&quot;
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={advance}
              disabled={msgIndex >= MESSAGES.length - 1}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Tin nhắn tiếp
            </button>
            <button onClick={reset} className="rounded-lg bg-card border border-border px-5 py-2 text-sm font-semibold text-muted hover:text-foreground">
              Bắt đầu lại
            </button>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Hệ thống đa Agent</strong> sử dụng nhiều AI Agent chuyên biệt phối hợp
          với nhau, mỗi Agent đảm nhận một vai trò riêng biệt trong quy trình giải quyết vấn đề.
        </p>
        <p>Các mô hình phối hợp phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Mô hình điều phối trung tâm:</strong> Một Agent chính phân chia công việc
            và giám sát các Agent khác.
          </li>
          <li>
            <strong>Mô hình ngang hàng:</strong> Các Agent giao tiếp trực tiếp với nhau
            mà không cần điều phối viên.
          </li>
          <li>
            <strong>Mô hình phân cấp:</strong> Tổ chức theo cây — Agent cấp trên
            quản lý các Agent cấp dưới.
          </li>
        </ol>
        <p>
          Hệ thống đa Agent vượt trội khi xử lý các tác vụ phức tạp đòi hỏi nhiều
          chuyên môn khác nhau, như phát triển phần mềm, nghiên cứu khoa học hay phân tích dữ liệu.
        </p>
      </ExplanationSection>
    </>
  );
}
