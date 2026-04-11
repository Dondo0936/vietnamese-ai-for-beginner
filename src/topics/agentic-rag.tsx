"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "agentic-rag",
  title: "Agentic RAG",
  titleVi: "RAG tăng cường với Agent",
  description:
    "Kết hợp RAG với AI Agent để tự quyết định khi nào truy xuất, xác minh và tổng hợp thông tin",
  category: "emerging",
  tags: ["rag", "agent", "adaptive-retrieval"],
  difficulty: "intermediate",
  relatedSlugs: ["rag", "agent-architecture", "react-framework"],
  vizType: "interactive",
};

const BASIC_STEPS = [
  { label: "Câu hỏi", color: "#3b82f6", desc: "Người dùng đặt câu hỏi" },
  { label: "Truy xuất", color: "#f59e0b", desc: "Tìm tài liệu liên quan" },
  { label: "Sinh câu trả lời", color: "#22c55e", desc: "LLM sinh đáp án từ context" },
];

const AGENTIC_STEPS = [
  { label: "Câu hỏi", color: "#3b82f6", desc: "Người dùng đặt câu hỏi" },
  { label: "Lập kế hoạch", color: "#8b5cf6", desc: "Agent phân tích & lên kế hoạch truy xuất" },
  { label: "Truy xuất #1", color: "#f59e0b", desc: "Tìm tài liệu theo truy vấn đầu" },
  { label: "Đánh giá", color: "#ef4444", desc: "Kiểm tra: đủ thông tin chưa?" },
  { label: "Truy xuất #2", color: "#f59e0b", desc: "Tìm thêm với truy vấn khác" },
  { label: "Xác minh", color: "#ec4899", desc: "So sánh & xác minh nguồn" },
  { label: "Tổng hợp", color: "#22c55e", desc: "Sinh đáp án toàn diện" },
];

export default function AgenticRagTopic() {
  const [mode, setMode] = useState<"basic" | "agentic">("basic");
  const [step, setStep] = useState(0);

  const steps = mode === "basic" ? BASIC_STEPS : AGENTIC_STEPS;
  const currentSteps = steps.slice(0, step + 1);

  const handleToggle = (newMode: "basic" | "agentic") => {
    setMode(newMode);
    setStep(0);
  };

  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const reset = () => setStep(0);

  const svgW = 700;
  const svgH = mode === "basic" ? 150 : 200;
  const boxW = mode === "basic" ? 140 : 80;
  const boxH = 36;
  const totalW = steps.length * (boxW + 20) - 20;
  const startX = (svgW - totalW) / 2;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng sự khác nhau giữa một <strong>công cụ tìm kiếm đơn
          giản</strong> và một <strong>trợ lý nghiên cứu thông minh</strong>.
        </p>
        <p>
          <strong>RAG thông thường</strong> giống như bạn Google một câu hỏi, copy
          đoạn đầu tiên tìm được, rồi gửi cho sếp. Đơn giản nhưng thường thiếu
          sót.
        </p>
        <p>
          <strong>Agentic RAG</strong> giống như trợ lý nghiên cứu thật sự: đọc kết
          quả đầu tiên, nghĩ &quot;Hmm, thông tin này chưa đủ, để tôi tìm thêm với
          từ khóa khác&quot;, rồi so sánh nhiều nguồn, kiểm chứng chéo, và cuối cùng
          tổng hợp thành báo cáo hoàn chỉnh.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => handleToggle("basic")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === "basic"
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                RAG cơ bản
              </button>
              <button
                onClick={() => handleToggle("agentic")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === "agentic"
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                Agentic RAG
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Đặt lại
              </button>
              <button
                onClick={nextStep}
                disabled={step >= steps.length - 1}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Bước tiếp
              </button>
            </div>
          </div>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-3xl mx-auto">
            <defs>
              <marker id="ragArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
              </marker>
            </defs>

            {/* Steps */}
            {steps.map((s, i) => {
              const x = startX + i * (boxW + 20);
              const active = i <= step;
              const yPos = mode === "agentic" ? 50 : 40;

              return (
                <g key={`step-${i}`}>
                  <rect
                    x={x}
                    y={yPos}
                    width={boxW}
                    height={boxH}
                    rx={8}
                    fill={active ? s.color : "#1e293b"}
                    stroke={active ? s.color : "#475569"}
                    strokeWidth={active ? 2 : 1}
                    opacity={active ? 1 : 0.5}
                  />
                  <text
                    x={x + boxW / 2}
                    y={yPos + boxH / 2 + 4}
                    textAnchor="middle"
                    fill={active ? "white" : "#94a3b8"}
                    fontSize={mode === "basic" ? 10 : 8}
                    fontWeight="bold"
                  >
                    {s.label}
                  </text>
                  {i < steps.length - 1 && (
                    <line
                      x1={x + boxW}
                      y1={yPos + boxH / 2}
                      x2={x + boxW + 20}
                      y2={yPos + boxH / 2}
                      stroke={i < step ? "#60a5fa" : "#475569"}
                      strokeWidth={1.5}
                      markerEnd="url(#ragArrow)"
                    />
                  )}
                  {/* Description below */}
                  {active && (
                    <text
                      x={x + boxW / 2}
                      y={yPos + boxH + 18}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="7"
                    >
                      {s.desc}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Agentic loop indicator */}
            {mode === "agentic" && step >= 3 && (
              <g>
                <path
                  d={`M ${startX + 3 * (boxW + 20) + boxW / 2} ${50 - 5}
                      C ${startX + 3 * (boxW + 20) + boxW / 2} ${20},
                        ${startX + 2 * (boxW + 20) + boxW / 2} ${20},
                        ${startX + 2 * (boxW + 20) + boxW / 2} ${50 - 5}`}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  markerEnd="url(#ragArrow)"
                />
                <text
                  x={startX + 2.5 * (boxW + 20) + boxW / 2}
                  y={13}
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize="8"
                >
                  Lặp nếu chưa đủ
                </text>
              </g>
            )}

            {/* Title */}
            <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#64748b" fontSize="10">
              {mode === "basic" ? "RAG cơ bản: Tuyến tính, một lần truy xuất" : "Agentic RAG: Lặp, đánh giá, xác minh"}
            </text>
          </svg>

          {/* Current step description */}
          {step < steps.length && (
            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm font-medium text-foreground">
                Bước {step + 1}/{steps.length}: {steps[step].label}
              </p>
              <p className="text-xs text-muted mt-1">{steps[step].desc}</p>
            </div>
          )}
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Agentic RAG</strong> là bước tiến hóa tiếp theo của RAG (Retrieval-
          Augmented Generation), kết hợp khả năng truy xuất thông tin với tư duy
          &quot;agent&quot; — tự lập kế hoạch, tự đánh giá, và tự điều chỉnh.
        </p>

        <p>Hạn chế của RAG cơ bản:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>Chỉ truy xuất một lần, không biết kết quả có đủ tốt không.</li>
          <li>Không thể reformulate query khi kết quả kém.</li>
          <li>Không xác minh chéo giữa các nguồn.</li>
          <li>Gặp khó với câu hỏi phức tạp cần nhiều bước suy luận.</li>
        </ul>

        <p>Agentic RAG giải quyết bằng:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Adaptive Retrieval:</strong> Agent tự quyết định khi nào cần truy
            xuất thêm thay vì truy xuất cố định cho mọi câu hỏi.
          </li>
          <li>
            <strong>Query Reformulation:</strong> Nếu kết quả truy xuất không tốt,
            agent viết lại truy vấn với từ khóa khác.
          </li>
          <li>
            <strong>Self-Verification:</strong> Agent kiểm tra câu trả lời có được hỗ
            trợ bởi tài liệu không, giảm hallucination.
          </li>
          <li>
            <strong>Iterative Retrieval:</strong> Truy xuất nhiều vòng, mỗi vòng dựa
            trên thông tin đã thu thập trước đó.
          </li>
          <li>
            <strong>Tool Use:</strong> Agent có thể gọi các công cụ (máy tính, API, cơ
            sở dữ liệu) ngoài việc tìm kiếm tài liệu.
          </li>
        </ol>
        <p>
          Ví dụ thực tế: khi hỏi &quot;So sánh GDP Việt Nam và Thái Lan năm 2024&quot;,
          Agentic RAG sẽ tìm GDP VN, rồi GDP Thái, rồi xác minh số liệu từ nhiều
          nguồn, và cuối cùng tổng hợp bảng so sánh hoàn chỉnh.
        </p>
      </ExplanationSection>
    </>
  );
}
