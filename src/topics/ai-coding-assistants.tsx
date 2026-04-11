"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-coding-assistants",
  title: "AI Coding Assistants",
  titleVi: "Trợ lý lập trình AI",
  description:
    "Các công cụ AI hỗ trợ viết code, debug và review — từ autocomplete đến agentic coding",
  category: "emerging",
  tags: ["copilot", "code-generation", "developer-tools"],
  difficulty: "beginner",
  relatedSlugs: ["llm-overview", "function-calling", "agentic-workflows"],
  vizType: "static",
};

const LEVELS = [
  {
    name: "Autocomplete",
    year: "2021",
    color: "#3b82f6",
    tools: "GitHub Copilot, TabNine",
    desc: "Gợi ý hoàn thành dòng code hiện tại",
  },
  {
    name: "Chat-based",
    year: "2022",
    color: "#8b5cf6",
    tools: "ChatGPT, Gemini",
    desc: "Hỏi đáp, giải thích, sinh code từ mô tả",
  },
  {
    name: "Inline + Context",
    year: "2023",
    color: "#f59e0b",
    tools: "Cursor, Copilot Chat",
    desc: "Hiểu toàn bộ dự án, sửa inline",
  },
  {
    name: "Agentic Coding",
    year: "2024-25",
    color: "#22c55e",
    tools: "Claude Code, Cursor Agent",
    desc: "Tự lập kế hoạch, sửa nhiều file, chạy test",
  },
];

export default function AiCodingAssistantsTopic() {
  const svgW = 700;
  const svgH = 380;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một <strong>lập trình viên senior ngồi cạnh
          24/7</strong>. Ở mức cơ bản, họ giúp bạn <strong>hoàn thành câu
          code</strong> đang gõ. Ở mức cao hơn, họ có thể <strong>giải thích
          bug</strong>, gợi ý refactor, và thậm chí <strong>viết cả tính năng</strong>{" "}
          từ mô tả.
        </p>
        <p>
          Gần đây, trợ lý AI đã tiến hóa thành <strong>agentic coding</strong> — như
          một đồng nghiệp senior có thể tự lập kế hoạch, sửa nhiều file cùng lúc,
          chạy test, và thậm chí tự debug khi code lỗi. Từ một trợ lý autocomplete
          đơn giản đến một &quot;junior developer AI&quot; thực thụ.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-3xl mx-auto">
            <text
              x={svgW / 2}
              y={22}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="13"
              fontWeight="bold"
            >
              Sự tiến hóa của trợ lý lập trình AI
            </text>

            {/* Timeline line */}
            <line x1={80} y1={65} x2={620} y2={65} stroke="#475569" strokeWidth={2} />

            {/* Timeline dots & labels */}
            {LEVELS.map((level, i) => {
              const x = 100 + i * 160;
              return (
                <g key={level.name}>
                  {/* Timeline dot */}
                  <circle cx={x} cy={65} r={8} fill={level.color} />
                  <text
                    x={x}
                    y={55}
                    textAnchor="middle"
                    fill={level.color}
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {level.year}
                  </text>

                  {/* Card */}
                  <rect
                    x={x - 70}
                    y={85}
                    width={140}
                    height={120}
                    rx={8}
                    fill="#1e293b"
                    stroke={level.color}
                    strokeWidth={1.5}
                  />

                  {/* Level name */}
                  <text
                    x={x}
                    y={108}
                    textAnchor="middle"
                    fill={level.color}
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {level.name}
                  </text>

                  {/* Divider */}
                  <line
                    x1={x - 55}
                    y1={115}
                    x2={x + 55}
                    y2={115}
                    stroke="#334155"
                    strokeWidth={0.5}
                  />

                  {/* Description */}
                  {level.desc.split(", ").length > 1 ? (
                    <>
                      <text
                        x={x}
                        y={132}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="8"
                      >
                        {level.desc.split(",")[0]},
                      </text>
                      <text
                        x={x}
                        y={144}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="8"
                      >
                        {level.desc.split(",").slice(1).join(",").trim()}
                      </text>
                    </>
                  ) : (
                    <text
                      x={x}
                      y={136}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="8"
                    >
                      {level.desc}
                    </text>
                  )}

                  {/* Tools */}
                  <text
                    x={x}
                    y={170}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="7"
                  >
                    {level.tools.split(", ")[0]}
                  </text>
                  {level.tools.split(", ")[1] && (
                    <text
                      x={x}
                      y={182}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="7"
                    >
                      {level.tools.split(", ")[1]}
                    </text>
                  )}

                  {/* Progress arrows between levels */}
                  {i < LEVELS.length - 1 && (
                    <polygon
                      points={`${x + 75},${145} ${x + 90},${140} ${x + 75},${135}`}
                      fill="#475569"
                    />
                  )}
                </g>
              );
            })}

            {/* How it works section */}
            <rect x={40} y={225} width={620} height={130} rx={10} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <text x={svgW / 2} y={248} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              Cách hoạt động bên trong
            </text>

            {/* FIM box */}
            <rect x={60} y={260} width={140} height={50} rx={6} fill="#334155" stroke="#3b82f6" strokeWidth={1} />
            <text x={130} y={278} textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">
              Fill-in-the-Middle
            </text>
            <text x={130} y={292} textAnchor="middle" fill="#94a3b8" fontSize="7">
              Prefix + Suffix &rarr; Middle
            </text>
            <text x={130} y={302} textAnchor="middle" fill="#94a3b8" fontSize="7">
              Gợi ý code tại vị trí con trỏ
            </text>

            {/* Context box */}
            <rect x={220} y={260} width={140} height={50} rx={6} fill="#334155" stroke="#8b5cf6" strokeWidth={1} />
            <text x={290} y={278} textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="bold">
              Context Gathering
            </text>
            <text x={290} y={292} textAnchor="middle" fill="#94a3b8" fontSize="7">
              Đọc file liên quan, imports,
            </text>
            <text x={290} y={302} textAnchor="middle" fill="#94a3b8" fontSize="7">
              cấu trúc dự án
            </text>

            {/* Fine-tuned LLM box */}
            <rect x={380} y={260} width={140} height={50} rx={6} fill="#334155" stroke="#f59e0b" strokeWidth={1} />
            <text x={450} y={278} textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">
              Code-tuned LLM
            </text>
            <text x={450} y={292} textAnchor="middle" fill="#94a3b8" fontSize="7">
              LLM huấn luyện trên hàng tỷ
            </text>
            <text x={450} y={302} textAnchor="middle" fill="#94a3b8" fontSize="7">
              dòng code mã nguồn mở
            </text>

            {/* Agentic loop box */}
            <rect x={540} y={260} width={100} height={50} rx={6} fill="#334155" stroke="#22c55e" strokeWidth={1} />
            <text x={590} y={278} textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold">
              Agent Loop
            </text>
            <text x={590} y={292} textAnchor="middle" fill="#94a3b8" fontSize="7">
              Plan &rarr; Code &rarr;
            </text>
            <text x={590} y={302} textAnchor="middle" fill="#94a3b8" fontSize="7">
              Test &rarr; Fix
            </text>

            {/* Connecting arrows */}
            <line x1={200} y1={285} x2={220} y2={285} stroke="#475569" strokeWidth={1} markerEnd="url(#codeArrow)" />
            <line x1={360} y1={285} x2={380} y2={285} stroke="#475569" strokeWidth={1} markerEnd="url(#codeArrow)" />
            <line x1={520} y1={285} x2={540} y2={285} stroke="#475569" strokeWidth={1} markerEnd="url(#codeArrow)" />
            <defs>
              <marker id="codeArrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#475569" />
              </marker>
            </defs>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Trợ lý lập trình AI</strong> là các công cụ sử dụng mô hình ngôn
          ngữ lớn (LLM) được tinh chỉnh trên code để hỗ trợ lập trình viên viết
          code nhanh hơn, ít lỗi hơn, và hiệu quả hơn.
        </p>

        <p>Các cấp độ hỗ trợ:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Code completion (Gợi ý code):</strong> Dự đoán và hoàn thành dòng
            code tiếp theo. Sử dụng kỹ thuật Fill-in-the-Middle (FIM): cho mô hình
            biết code trước và sau con trỏ, sinh phần ở giữa.
          </li>
          <li>
            <strong>Chat-based coding:</strong> Hỏi đáp bằng ngôn ngữ tự nhiên: &quot;Viết
            hàm sắp xếp mảng&quot;, &quot;Giải thích đoạn code này&quot;, &quot;Tìm bug
            trong hàm X&quot;.
          </li>
          <li>
            <strong>Inline + Context-aware:</strong> Hiểu cấu trúc toàn bộ dự án,
            gợi ý phù hợp với codebase của bạn, không chỉ file đang mở.
          </li>
          <li>
            <strong>Agentic coding:</strong> AI tự lập kế hoạch thay đổi, sửa nhiều
            file, chạy test, sửa lỗi, tạo commit. Ví dụ: <strong>Claude Code</strong>{" "}
            và <strong>Cursor Agent</strong> có thể nhận một feature request và tự
            triển khai hoàn chỉnh.
          </li>
        </ol>

        <p>Công nghệ đằng sau:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>Code-tuned LLMs:</strong> Mô hình được huấn luyện trên hàng tỷ
            dòng code từ GitHub, Stack Overflow, tài liệu kỹ thuật.
          </li>
          <li>
            <strong>Context gathering:</strong> Thu thập thông tin từ file đang mở,
            imports, cấu trúc dự án, lịch sử git để tạo context phù hợp.
          </li>
          <li>
            <strong>Tool integration:</strong> Agentic coding tích hợp terminal, file
            system, browser, git, và test runner để tự động hóa workflow.
          </li>
        </ul>
        <p>
          Trợ lý AI không thay thế lập trình viên mà giúp họ tập trung vào{" "}
          <strong>tư duy thiết kế</strong> và <strong>logic nghiệp vụ</strong>, trong
          khi AI xử lý phần code boilerplate và repetitive.
        </p>
      </ExplanationSection>
    </>
  );
}
