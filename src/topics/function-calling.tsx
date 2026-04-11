"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "function-calling",
  title: "Function Calling",
  titleVi: "Gọi hàm — Khi AI biết dùng công cụ",
  description:
    "Cơ chế cho phép mô hình ngôn ngữ lớn gọi các hàm bên ngoài để lấy dữ liệu hoặc thực thi hành động thực tế.",
  category: "ai-agents",
  tags: ["tools", "api", "agent"],
  difficulty: "intermediate",
  relatedSlugs: ["react-framework", "agent-architecture", "orchestration"],
  vizType: "interactive",
};

const TOOLS = [
  { id: "weather", name: "Thời tiết", icon: "☀️", desc: "Lấy thời tiết hiện tại" },
  { id: "calculator", name: "Máy tính", icon: "🔢", desc: "Tính toán biểu thức" },
  { id: "database", name: "Cơ sở dữ liệu", icon: "🗄️", desc: "Truy vấn dữ liệu" },
  { id: "email", name: "Email", icon: "📧", desc: "Gửi email" },
];

const STEPS = ["Nhận câu hỏi", "Chọn công cụ", "Tạo tham số", "Gọi hàm", "Trả kết quả"];

export default function FunctionCallingTopic() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const handleToolClick = (id: string) => {
    setSelectedTool(id);
    setStep(0);
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng AI như một <strong>nhân viên lễ tân khách sạn</strong> thông minh.
          Khi khách hỏi &quot;Thời tiết hôm nay thế nào?&quot;, nhân viên không tự bịa câu trả lời
          mà sẽ <strong>gọi điện cho đài khí tượng</strong> để lấy thông tin chính xác.
        </p>
        <p>
          Tương tự, khi khách hỏi &quot;Đặt giúp tôi bàn ăn tối&quot;, nhân viên sẽ
          <strong> gọi đến nhà hàng</strong> thay vì tự ý sắp xếp. Mỗi &quot;cuộc gọi&quot; chính
          là một <strong>function call</strong> — AI biết <em>khi nào</em> cần gọi,
          gọi <em>công cụ nào</em>, và truyền <em>tham số gì</em>.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <p className="text-sm text-muted">Chọn một công cụ để xem quy trình gọi hàm:</p>
          <div className="flex flex-wrap gap-3">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleToolClick(t.id)}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  selectedTool === t.id
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {t.icon} {t.name}
              </button>
            ))}
          </div>

          {selectedTool && (
            <>
              <svg viewBox="0 0 700 180" className="w-full max-w-2xl mx-auto">
                {STEPS.map((label, i) => {
                  const x = 70 + i * 145;
                  const active = i <= step;
                  return (
                    <g key={i}>
                      <rect
                        x={x - 55}
                        y={50}
                        width={110}
                        height={40}
                        rx={8}
                        fill={active ? "#3b82f6" : "#1e293b"}
                        stroke={active ? "#60a5fa" : "#475569"}
                        strokeWidth={2}
                      />
                      <text
                        x={x}
                        y={75}
                        textAnchor="middle"
                        fill={active ? "white" : "#94a3b8"}
                        fontSize={11}
                        fontWeight="bold"
                      >
                        {label}
                      </text>
                      {i < STEPS.length - 1 && (
                        <line
                          x1={x + 55}
                          y1={70}
                          x2={x + 90}
                          y2={70}
                          stroke={i < step ? "#3b82f6" : "#475569"}
                          strokeWidth={2}
                          markerEnd="url(#arrowhead)"
                        />
                      )}
                    </g>
                  );
                })}
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
                  </marker>
                </defs>
                <text x={350} y={130} textAnchor="middle" fill="#94a3b8" fontSize={12}>
                  Công cụ: {TOOLS.find((t) => t.id === selectedTool)?.name} — Bước {step + 1}/{STEPS.length}
                </text>
              </svg>
              <div className="flex justify-center">
                <button
                  onClick={nextStep}
                  disabled={step >= STEPS.length - 1}
                  className="rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Bước tiếp theo
                </button>
              </div>
            </>
          )}
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Function Calling</strong> là cơ chế cho phép mô hình ngôn ngữ lớn (LLM)
          gọi các hàm hoặc API bên ngoài để thực hiện hành động mà bản thân nó không thể làm,
          chẳng hạn truy vấn dữ liệu thời gian thực, tính toán phức tạp, hoặc tương tác với hệ thống khác.
        </p>
        <p>Quy trình gọi hàm gồm 5 bước:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Nhận câu hỏi:</strong> LLM phân tích yêu cầu của người dùng.</li>
          <li><strong>Chọn công cụ:</strong> Quyết định hàm nào phù hợp từ danh sách công cụ.</li>
          <li><strong>Tạo tham số:</strong> Sinh ra tham số JSON đúng định dạng cho hàm.</li>
          <li><strong>Gọi hàm:</strong> Hệ thống thực thi hàm với tham số đã tạo.</li>
          <li><strong>Trả kết quả:</strong> LLM tổng hợp kết quả và trình bày cho người dùng.</li>
        </ol>
        <p>
          Đây là nền tảng quan trọng để xây dựng <strong>AI Agent</strong> — hệ thống AI có khả năng
          tương tác với thế giới thực thông qua các công cụ.
        </p>
      </ExplanationSection>
    </>
  );
}
