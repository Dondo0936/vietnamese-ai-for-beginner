"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "agentic-workflows",
  title: "Agentic Workflows",
  titleVi: "Quy trình tự chủ — AI làm việc như con người",
  description:
    "Các mẫu thiết kế luồng công việc nơi AI Agent tự chủ thực hiện chuỗi tác vụ phức tạp với ít sự can thiệp.",
  category: "ai-agents",
  tags: ["workflow", "automation", "agent", "patterns"],
  difficulty: "advanced",
  relatedSlugs: ["agent-architecture", "planning", "multi-agent", "orchestration"],
  vizType: "interactive",
};

const PATTERNS = [
  {
    id: "reflection",
    label: "Phản ánh",
    desc: "Agent tự đánh giá kết quả và cải thiện lặp đi lặp lại.",
    nodes: ["Tạo bản nháp", "Tự đánh giá", "Cải thiện", "Hoàn thành"],
  },
  {
    id: "tool-use",
    label: "Sử dụng công cụ",
    desc: "Agent quyết định khi nào cần gọi công cụ bên ngoài.",
    nodes: ["Nhận yêu cầu", "Chọn công cụ", "Thực thi", "Tổng hợp"],
  },
  {
    id: "planning-pattern",
    label: "Lập kế hoạch",
    desc: "Agent tạo kế hoạch chi tiết trước khi bắt đầu thực hiện.",
    nodes: ["Phân tích", "Lập kế hoạch", "Thực hiện", "Kiểm tra"],
  },
  {
    id: "multi-agent-pattern",
    label: "Đa Agent",
    desc: "Nhiều Agent chuyên biệt phối hợp giải quyết vấn đề.",
    nodes: ["Phân công", "Agent A", "Agent B", "Tổng hợp"],
  },
];

export default function AgenticWorkflowsTopic() {
  const [activePattern, setActivePattern] = useState("reflection");
  const pattern = PATTERNS.find((p) => p.id === activePattern)!;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một <strong>tác giả viết sách</strong>. Bạn không viết
          xong ngay lần đầu — thay vào đó, bạn trải qua nhiều bước:
        </p>
        <p>
          <strong>Viết bản nháp</strong> → <strong>Tự đọc lại</strong> → <strong>Sửa chữa</strong> →
          <strong> Nhờ biên tập viên góp ý</strong> → <strong>Chỉnh sửa lần cuối</strong>.
          Mỗi vòng lặp cải thiện chất lượng. Quy trình tự chủ của AI hoạt động tương tự —
          AI thực hiện, đánh giá, và tinh chỉnh cho đến khi đạt yêu cầu.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePattern(p.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activePattern === p.id
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 140" className="w-full max-w-2xl mx-auto">
            {pattern.nodes.map((node, i) => {
              const x = 75 + i * 150;
              return (
                <g key={i}>
                  <rect x={x - 55} y={40} width={110} height={40} rx={8} fill="#3b82f6" stroke="#60a5fa" strokeWidth={2} />
                  <text x={x} y={65} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
                    {node}
                  </text>
                  {i < pattern.nodes.length - 1 && (
                    <line x1={x + 55} y1={60} x2={x + 95} y2={60} stroke="#60a5fa" strokeWidth={2} markerEnd="url(#aw-arrow)" />
                  )}
                </g>
              );
            })}
            {activePattern === "reflection" && (
              <path d="M 525 80 C 525 120, 75 120, 75 80" fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#aw-arrow-warn)" />
            )}
            <defs>
              <marker id="aw-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
              </marker>
              <marker id="aw-arrow-warn" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
              </marker>
            </defs>
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">{pattern.desc}</p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Quy trình tự chủ (Agentic Workflows)</strong> là các mẫu thiết kế cho phép
          AI Agent thực hiện chuỗi tác vụ phức tạp một cách tự chủ, với tối thiểu sự can thiệp
          của con người.
        </p>
        <p>Bốn mẫu thiết kế phổ biến nhất:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Phản ánh (Reflection):</strong> Agent tự kiểm tra và cải thiện kết quả qua nhiều vòng lặp.</li>
          <li><strong>Sử dụng công cụ (Tool Use):</strong> Agent quyết định công cụ nào cần dùng và khi nào.</li>
          <li><strong>Lập kế hoạch (Planning):</strong> Agent phân tích yêu cầu, tạo kế hoạch rồi thực hiện tuần tự.</li>
          <li><strong>Đa Agent (Multi-Agent):</strong> Nhiều Agent chuyên biệt phối hợp giải quyết từng phần.</li>
        </ol>
        <p>
          Kết hợp nhiều mẫu tạo nên hệ thống AI mạnh mẽ — ví dụ Agent vừa lập kế hoạch,
          vừa sử dụng công cụ, vừa phản ánh để cải thiện kết quả.
        </p>
      </ExplanationSection>
    </>
  );
}
