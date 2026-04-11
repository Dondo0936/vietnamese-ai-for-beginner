"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "react-framework",
  title: "ReAct Framework",
  titleVi: "ReAct — Suy luận kết hợp Hành động",
  description:
    "Khung tư duy giúp AI luân phiên giữa lý luận (Reasoning) và hành động (Acting) để giải quyết vấn đề phức tạp.",
  category: "ai-agents",
  tags: ["reasoning", "acting", "agent", "framework"],
  difficulty: "intermediate",
  relatedSlugs: ["function-calling", "planning", "agent-architecture"],
  vizType: "interactive",
};

interface Step {
  type: "thought" | "action" | "observation";
  text: string;
}

const DEMO_STEPS: Step[] = [
  { type: "thought", text: "Người dùng hỏi dân số Hà Nội. Tôi cần tra cứu thông tin này." },
  { type: "action", text: "search('dân số Hà Nội 2024')" },
  { type: "observation", text: "Kết quả: Dân số Hà Nội khoảng 8,5 triệu người (2024)." },
  { type: "thought", text: "Đã có thông tin. Tôi sẽ trả lời người dùng." },
  { type: "action", text: "respond('Dân số Hà Nội khoảng 8,5 triệu người.')" },
];

const COLOR_MAP = {
  thought: { bg: "#3b82f6", label: "Suy luận" },
  action: { bg: "#22c55e", label: "Hành động" },
  observation: { bg: "#f59e0b", label: "Quan sát" },
};

export default function ReActFrameworkTopic() {
  const [visibleSteps, setVisibleSteps] = useState(1);

  const addStep = () => {
    if (visibleSteps < DEMO_STEPS.length) setVisibleSteps(visibleSteps + 1);
  };

  const reset = () => setVisibleSteps(1);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một <strong>thám tử</strong> đang điều tra vụ án.
          Bạn không lao vào hành động ngay mà luân phiên giữa:
        </p>
        <p>
          <strong>Suy nghĩ:</strong> &quot;Manh mối này gợi ý hung thủ quen nạn nhân.&quot;
          → <strong>Hành động:</strong> &quot;Kiểm tra danh sách bạn bè nạn nhân.&quot;
          → <strong>Quan sát:</strong> &quot;Phát hiện 3 người đáng nghi.&quot;
          → <strong>Suy nghĩ:</strong> &quot;Cần kiểm tra alibi từng người...&quot;
        </p>
        <p>
          ReAct hoạt động y hệt — AI <strong>suy luận</strong> trước khi <strong>hành động</strong>,
          rồi <strong>quan sát</strong> kết quả để suy luận tiếp, tạo thành vòng lặp thông minh.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 700 320" className="w-full max-w-2xl mx-auto">
            {DEMO_STEPS.slice(0, visibleSteps).map((s, i) => {
              const y = 20 + i * 58;
              const cfg = COLOR_MAP[s.type];
              return (
                <g key={i}>
                  <rect x={20} y={y} width={120} height={36} rx={8} fill={cfg.bg} />
                  <text x={80} y={y + 23} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                    {cfg.label}
                  </text>
                  <text x={160} y={y + 23} fill="#e2e8f0" fontSize={11}>
                    {s.text.length > 60 ? s.text.slice(0, 60) + "..." : s.text}
                  </text>
                  {i < visibleSteps - 1 && (
                    <line x1={80} y1={y + 36} x2={80} y2={y + 58} stroke="#475569" strokeWidth={2} strokeDasharray="4,3" />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="flex gap-3 justify-center">
            <button
              onClick={addStep}
              disabled={visibleSteps >= DEMO_STEPS.length}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Bước tiếp theo
            </button>
            <button
              onClick={reset}
              className="rounded-lg bg-card border border-border px-5 py-2 text-sm font-semibold text-muted hover:text-foreground"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>ReAct</strong> (Reasoning + Acting) là khung tư duy kết hợp hai khả năng
          của mô hình ngôn ngữ: <strong>suy luận</strong> (tạo ra chuỗi lý luận) và
          <strong> hành động</strong> (tương tác với môi trường bên ngoài).
        </p>
        <p>Vòng lặp ReAct gồm 3 pha:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Thought (Suy luận):</strong> AI phân tích tình huống và lập kế hoạch bước tiếp.</li>
          <li><strong>Action (Hành động):</strong> AI gọi công cụ hoặc thực hiện thao tác cụ thể.</li>
          <li><strong>Observation (Quan sát):</strong> AI nhận kết quả và dùng nó để suy luận tiếp.</li>
        </ol>
        <p>
          So với chỉ suy luận thuần túy (Chain-of-Thought), ReAct cho phép AI <strong>kiểm chứng
          thông tin</strong> trong quá trình suy nghĩ, giảm thiểu ảo giác và tăng độ chính xác.
        </p>
      </ExplanationSection>
    </>
  );
}
