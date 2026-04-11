"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "agent-architecture",
  title: "Agent Architecture",
  titleVi: "Kiến trúc Agent — Bộ não của AI tự chủ",
  description:
    "Cấu trúc tổng thể của một AI Agent, bao gồm các thành phần cốt lõi: nhận thức, suy luận, bộ nhớ và hành động.",
  category: "ai-agents",
  tags: ["agent", "architecture", "llm", "tools"],
  difficulty: "intermediate",
  relatedSlugs: ["function-calling", "planning", "memory-systems", "multi-agent"],
  vizType: "interactive",
};

const COMPONENTS = [
  { id: "llm", label: "LLM (Bộ não)", x: 300, y: 60, color: "#3b82f6", desc: "Mô hình ngôn ngữ là trung tâm suy luận, ra quyết định và tạo phản hồi." },
  { id: "memory", label: "Bộ nhớ", x: 120, y: 170, color: "#8b5cf6", desc: "Lưu trữ ngắn hạn và dài hạn — giúp Agent nhớ bối cảnh và kinh nghiệm." },
  { id: "tools", label: "Công cụ", x: 480, y: 170, color: "#22c55e", desc: "API, cơ sở dữ liệu, trình duyệt — giúp Agent tương tác với thế giới bên ngoài." },
  { id: "planning", label: "Lập kế hoạch", x: 300, y: 270, color: "#f59e0b", desc: "Chia bài toán lớn thành các bước nhỏ và sắp xếp thứ tự thực hiện." },
];

export default function AgentArchitectureTopic() {
  const [selected, setSelected] = useState<string | null>(null);
  const info = COMPONENTS.find((c) => c.id === selected);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng AI Agent như một <strong>giám đốc điều hành</strong> của công ty.
          Giám đốc có <strong>bộ não</strong> (LLM) để suy nghĩ, <strong>sổ ghi chép</strong> (bộ nhớ)
          để nhớ thông tin, <strong>đội ngũ nhân viên</strong> (công cụ) để thực hiện công việc,
          và khả năng <strong>lập kế hoạch</strong> để chia dự án lớn thành từng giai đoạn.
        </p>
        <p>
          Giám đốc không tự tay làm mọi thứ — thay vào đó, họ <strong>suy nghĩ</strong>,
          <strong> phân công</strong> và <strong>giám sát</strong>. Kiến trúc Agent hoạt động
          theo nguyên lý tương tự!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <p className="text-sm text-muted">Nhấn vào từng thành phần để tìm hiểu chi tiết:</p>
          <svg viewBox="0 0 600 340" className="w-full max-w-2xl mx-auto">
            {/* Connections */}
            <line x1={300} y1={90} x2={120} y2={150} stroke="#475569" strokeWidth={2} />
            <line x1={300} y1={90} x2={480} y2={150} stroke="#475569" strokeWidth={2} />
            <line x1={300} y1={90} x2={300} y2={245} stroke="#475569" strokeWidth={2} />
            <line x1={120} y1={200} x2={300} y2={245} stroke="#475569" strokeWidth={1.5} strokeDasharray="4,3" />
            <line x1={480} y1={200} x2={300} y2={245} stroke="#475569" strokeWidth={1.5} strokeDasharray="4,3" />

            {COMPONENTS.map((c) => (
              <g key={c.id} onClick={() => setSelected(c.id)} className="cursor-pointer">
                <rect
                  x={c.x - 65}
                  y={c.y - 22}
                  width={130}
                  height={44}
                  rx={10}
                  fill={selected === c.id ? c.color : "#1e293b"}
                  stroke={c.color}
                  strokeWidth={selected === c.id ? 3 : 2}
                />
                <text x={c.x} y={c.y + 5} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                  {c.label}
                </text>
              </g>
            ))}
          </svg>
          {info && (
            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">{info.desc}</p>
            </div>
          )}
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Kiến trúc Agent</strong> mô tả cách tổ chức các thành phần để tạo nên một
          AI có khả năng tự chủ giải quyết vấn đề phức tạp. Bốn thành phần cốt lõi:
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>LLM (Bộ não):</strong> Trung tâm suy luận và ra quyết định, xử lý ngôn ngữ
            tự nhiên và điều phối mọi hoạt động.
          </li>
          <li>
            <strong>Bộ nhớ:</strong> Gồm bộ nhớ ngắn hạn (ngữ cảnh hội thoại) và bộ nhớ dài hạn
            (cơ sở dữ liệu vector lưu trữ kinh nghiệm).
          </li>
          <li>
            <strong>Công cụ:</strong> Các API và dịch vụ bên ngoài mà Agent có thể gọi, như
            tìm kiếm web, thực thi mã, truy vấn cơ sở dữ liệu.
          </li>
          <li>
            <strong>Lập kế hoạch:</strong> Khả năng phân tách bài toán lớn thành các bước nhỏ
            và thực hiện tuần tự hoặc song song.
          </li>
        </ol>
        <p>
          Kiến trúc Agent hiện đại thường theo mô hình <strong>vòng lặp</strong> — Agent liên tục
          suy luận, hành động, quan sát và điều chỉnh cho đến khi hoàn thành nhiệm vụ.
        </p>
      </ExplanationSection>
    </>
  );
}
