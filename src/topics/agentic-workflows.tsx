"use client";

import { useState } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
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

const TOTAL_STEPS = 8;

const PATTERNS = [
  { id: "reflection", label: "Phản ánh", color: "#3b82f6",
    desc: "Agent tự đánh giá kết quả và cải thiện qua nhiều vòng lặp. Giống tác giả viết → đọc lại → sửa → đọc lại.",
    nodes: ["Tạo bản nháp", "Tự đánh giá", "Cải thiện", "Kiểm tra lần cuối"],
    hasLoop: true },
  { id: "tool-use", label: "Dùng công cụ", color: "#22c55e",
    desc: "Agent quyết định KHI NÀO cần gọi công cụ và CÔNG CỤ NÀO phù hợp. ReAct pattern mở rộng.",
    nodes: ["Phân tích", "Chọn công cụ", "Thực thi", "Tổng hợp"],
    hasLoop: false },
  { id: "planning-exec", label: "Lập kế hoạch", color: "#f59e0b",
    desc: "Agent tạo kế hoạch chi tiết trước, rồi thực hiện từng bước. Có thể replan nếu bước nào thất bại.",
    nodes: ["Lập kế hoạch", "Thực hiện", "Kiểm tra", "Điều chỉnh"],
    hasLoop: true },
  { id: "multi-agent-wf", label: "Đa Agent", color: "#8b5cf6",
    desc: "Nhiều Agent chuyên biệt phối hợp: mỗi Agent đảm nhận 1 phần, coordinator tổng hợp.",
    nodes: ["Phân công", "Agent A", "Agent B", "Tổng hợp"],
    hasLoop: false },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Reflection pattern (phản ánh) giúp Agent cải thiện kết quả bằng cách nào?",
    options: [
      "Tăng kích thước mô hình",
      "Agent tự đánh giá output, phát hiện thiếu sót, rồi sinh phiên bản cải thiện — lặp lại nhiều vòng",
      "Gọi thêm API",
      "Tăng temperature",
    ],
    correct: 1,
    explanation:
      "Reflection: Generate → Critique → Refine → (Lặp). Giống tác giả viết bản nháp → đọc lại phê bình → sửa → đọc lại. Mỗi vòng cải thiện chất lượng. Thường 2-3 vòng là đủ tốt.",
  },
  {
    question: "Kết hợp nhiều pattern tạo nên điều gì?",
    options: [
      "Hệ thống phức tạp không cần thiết",
      "Agentic workflow mạnh mẽ: vd. Agent lập kế hoạch + dùng công cụ + phản ánh + phân công cho sub-agents",
      "Chi phí API tăng không kiểm soát",
      "Kết quả kém hơn vì quá phức tạp",
    ],
    correct: 1,
    explanation:
      "Các pattern kết hợp tạo hệ thống mạnh: Planning (chia bước) + Tool Use (thực thi) + Reflection (kiểm tra) + Multi-Agent (chuyên biệt hoá). Như đội ngũ sản xuất có kế hoạch, công cụ, review, và phân công rõ ràng.",
  },
  {
    question: "Rủi ro lớn nhất của agentic workflow là gì?",
    options: [
      "Chạy quá nhanh",
      "Agent tự chủ thực hiện hành động sai mà không ai kiểm soát — cần guardrails và human-in-the-loop",
      "Tốn quá ít token",
      "Không đủ sáng tạo",
    ],
    correct: 1,
    explanation:
      "Agent tự chủ = có thể tự mắc lỗi mà không ai phát hiện. Cần: (1) guardrails (giới hạn hành động), (2) human-in-the-loop (confirm trước hành động quan trọng), (3) monitoring (log mọi bước).",
  },
  {
    type: "fill-blank",
    question: "Agentic workflow chia nhiệm vụ phức tạp thành chuỗi {blank} bước, trong đó agent hoạt động {blank} (tự quyết định bước kế tiếp) thay vì chỉ trả lời 1 lượt.",
    blanks: [
      { answer: "nhiều", accept: ["multi-step", "đa", "many"] },
      { answer: "tự chủ", accept: ["autonomous", "tự động", "autonomously"] },
    ],
    explanation: "Khác biệt cốt lõi của agentic workflow: (1) multi-step (chuỗi nhiều bước thay vì 1 câu trả lời), (2) autonomous (agent tự chọn bước kế tiếp dựa trên kết quả hiện tại). Cần guardrails và human-in-the-loop để đảm bảo an toàn.",
  },
];

export default function AgenticWorkflowsTopic() {
  const [activePattern, setActivePattern] = useState("reflection");
  const pattern = PATTERNS.find(p => p.id === activePattern)!;

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="AI viết blog post lần đầu. Kết quả: 6/10. Cách nào để đạt 9/10 mà không cần con người sửa?"
          options={[
            "Dùng mô hình lớn hơn",
            "Cho AI TỰ ĐỌC LẠI, phê bình, sửa, rồi đọc lại — lặp 2-3 vòng như tác giả chuyên nghiệp",
            "Thêm prompt dài hơn",
          ]}
          correct={1}
          explanation="Reflection pattern: AI viết → AI tự phê bình ('Phần 2 thiếu ví dụ, kết luận yếu') → AI sửa → AI kiểm tra lại. Mỗi vòng cải thiện chất lượng — giống quy trình viết của tác giả chuyên nghiệp."
        >
          <p className="text-sm text-muted mt-2">
            Đây là 1 trong 4 mẫu thiết kế tạo nên AI Agent tự chủ thực sự.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            4 mẫu thiết kế Agentic Workflow
          </h3>
          <p className="text-sm text-muted mb-4">
            Chọn từng pattern để xem luồng hoạt động.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {PATTERNS.map(p => (
              <button key={p.id} onClick={() => setActivePattern(p.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activePattern === p.id ? "text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={activePattern === p.id ? { backgroundColor: p.color } : {}}>
                {p.label}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 650 140" className="w-full max-w-3xl mx-auto mb-4">
            {pattern.nodes.map((node, i) => {
              const x = 80 + i * 155;
              return (
                <g key={i}>
                  <rect x={x - 60} y={35} width={120} height={42} rx={8}
                    fill={pattern.color} stroke="white" strokeWidth={0.5} opacity={0.9} />
                  <text x={x} y={61} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                    {node}
                  </text>
                  {i < pattern.nodes.length - 1 && (
                    <line x1={x + 60} y1={56} x2={x + 95} y2={56}
                      stroke="var(--text-tertiary)" strokeWidth={2} markerEnd="url(#arr-aw)" />
                  )}
                </g>
              );
            })}
            {pattern.hasLoop && (
              <path d="M 545 77 C 545 120, 80 120, 80 77" fill="none"
                stroke="#f59e0b" strokeWidth={2} strokeDasharray="5,3" markerEnd="url(#arr-aw-loop)" />
            )}
            <defs>
              <marker id="arr-aw" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="var(--text-tertiary)" />
              </marker>
              <marker id="arr-aw-loop" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
              </marker>
            </defs>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-3">
            <p className="text-sm font-medium" style={{ color: pattern.color }}>{pattern.label}</p>
            <p className="text-sm text-muted mt-1">{pattern.desc}</p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Agentic workflow không phải chỉ chạy LLM nhiều lần — mà là tổ chức
          LLM thành <strong>quy trình có cấu trúc</strong>: lập kế hoạch, thực thi,
          kiểm tra, điều chỉnh. Giống chuyển từ &quot;1 người ngồi viết&quot; thành
          &quot;quy trình xuất bản sách&quot;: soạn → biên tập → hiệu đính → in.
          Kết quả ổn định và chất lượng cao hơn hẳn.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Agent dùng Reflection pattern viết code, qua 5 vòng nhưng code vẫn lỗi. Vấn đề gì và giải pháp?"
          options={[
            "Cần thêm 10 vòng nữa",
            "Reflection đơn thuần không đủ — cần kết hợp Tool Use (chạy code thực) để kiểm chứng bằng test thay vì chỉ đọc lại",
            "Dùng mô hình lớn hơn",
            "Bỏ reflection, viết 1 lần là đủ",
          ]}
          correct={1}
          explanation="Reflection chỉ 'đọc lại' code — có thể bỏ sót lỗi logic. Kết hợp Tool Use: chạy code thực + chạy test → phát hiện lỗi chính xác → sửa đúng chỗ. Đây là sức mạnh của kết hợp pattern."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Agentic Workflows</strong>{" "}(Andrew Ng, 2024) là 4 mẫu thiết kế tạo nên
            AI Agent tự chủ thực sự — xây dựng trên nền <TopicLink slug="agent-architecture">agent architecture</TopicLink>{" "}cơ bản:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Reflection:</strong>{" "}Generate → Critique → Refine → Loop.
              Cải thiện chất lượng qua self-evaluation. Đơn giản nhưng hiệu quả.
            </li>
            <li>
              <strong>Tool Use:</strong>{" "}Agent quyết định công cụ nào, khi nào, tham số gì — thực hiện qua{" "}
              <TopicLink slug="function-calling">function calling</TopicLink>{" "}và mẫu{" "}
              <TopicLink slug="react-framework">ReAct</TopicLink>. Mở rộng khả năng vượt xa LLM thuần.
            </li>
            <li>
              <strong>Planning:</strong>{" "}Phân rã → Thực hiện → Kiểm tra → Replan.
              Giải quyết bài toán phức tạp từng bước.
            </li>
            <li>
              <strong>Multi-Agent:</strong>{" "}Chuyên biệt hoá + phối hợp.
              Nhiều role giải quyết các khía cạnh khác nhau.
            </li>
          </ul>

          <CodeBlock language="python" title="reflection_pattern.py">{`def reflection_workflow(task, max_rounds=3):
    # Vòng lặp phản ánh
    draft = llm.generate(task)

    for round in range(max_rounds):
        # Tự phê bình
        critique = llm(f"Đánh giá bản nháp sau. "
                       f"Liệt kê 3 điểm cần cải thiện:\\n{draft}")

        # Kiểm tra: đã đủ tốt chưa?
        if "không cần sửa" in critique.lower():
            break

        # Cải thiện dựa trên phê bình
        draft = llm(f"Cải thiện bản nháp dựa trên feedback:\\n"
                    f"Bản nháp: {draft}\\n"
                    f"Phê bình: {critique}")

    return draft`}</CodeBlock>

          <Callout variant="warning" title="An toàn: Human-in-the-Loop">
            Agent tự chủ có thể thực hiện hành động sai: gửi email nhầm, xoá
            file, chi tiền. Luôn thêm: (1) confirmation trước hành động không
            thể đảo ngược, (2) giới hạn quyền (sandbox), (3) log mọi bước
            để audit. Tự chủ không có nghĩa là không giám sát.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Agentic Workflows"
          points={[
            "4 pattern: Reflection (tự phê bình), Tool Use (dùng công cụ), Planning (lập kế hoạch), Multi-Agent (chuyên biệt hoá).",
            "Kết hợp pattern tạo Agent mạnh: vd. Planning + Tool Use + Reflection = Agent giải quyết bài toán phức tạp, tự kiểm tra, tự sửa.",
            "Reflection đơn giản nhất nhưng hiệu quả: 2-3 vòng generate → critique → refine cải thiện chất lượng đáng kể.",
            "An toàn: luôn thêm guardrails, human-in-the-loop, monitoring. Tự chủ cần đi kèm giám sát.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 7. QUIZ ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
