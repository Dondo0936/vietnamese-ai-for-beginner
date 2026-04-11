"use client";

import { useState } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
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

const TOTAL_STEPS = 8;

interface Step { type: "thought" | "action" | "observation"; text: string; }

const DEMO_STEPS: Step[] = [
  { type: "thought", text: "Người dùng hỏi dân số Hà Nội. Tôi cần tra cứu vì dữ liệu có thể đã thay đổi." },
  { type: "action", text: "search('dân số Hà Nội 2024')" },
  { type: "observation", text: "Kết quả: Dân số Hà Nội khoảng 8,5 triệu người (2024)." },
  { type: "thought", text: "Đã có thông tin chính xác. Tôi sẽ trả lời người dùng." },
  { type: "action", text: "respond('Dân số Hà Nội năm 2024 khoảng 8,5 triệu người.')" },
];

const TYPE_CONFIG = {
  thought: { bg: "#3b82f6", label: "Suy luận" },
  action: { bg: "#22c55e", label: "Hành động" },
  observation: { bg: "#f59e0b", label: "Quan sát" },
};

const QUIZ: QuizQuestion[] = [
  {
    question: "ReAct khác Chain-of-Thought (CoT) thuần túy ở điểm nào?",
    options: [
      "ReAct nhanh hơn CoT",
      "ReAct xen kẽ suy luận VÀ hành động (gọi công cụ), trong khi CoT chỉ suy luận trong đầu mà không kiểm chứng",
      "CoT chỉ dùng cho toán, ReAct dùng cho mọi thứ",
      "ReAct không cần LLM",
    ],
    correct: 1,
    explanation:
      "CoT: suy luận xong rồi trả lời (có thể bịa vì không kiểm chứng). ReAct: suy luận → hành động (tra cứu/tính toán) → quan sát kết quả → suy luận tiếp. Mỗi bước được grounding bởi dữ liệu thật.",
  },
  {
    question: "Trong vòng lặp ReAct, pha 'Observation' đến từ đâu?",
    options: [
      "Từ LLM tự sinh ra",
      "Từ kết quả thực thi action — API, database, tìm kiếm web",
      "Từ người dùng nhập thêm",
      "Từ reward model",
    ],
    correct: 1,
    explanation:
      "Observation là kết quả THỰC từ bên ngoài: API trả về, search engine trả kết quả, code chạy xong. Đây là 'grounding' — buộc AI làm việc với dữ liệu thật thay vì tưởng tượng.",
  },
  {
    question: "Khi nào ReAct agent nên DỪNG vòng lặp?",
    options: [
      "Sau đúng 3 vòng",
      "Khi AI có đủ thông tin để trả lời chính xác — hoặc khi vượt quá số bước tối đa (timeout)",
      "Khi hết công cụ để gọi",
      "Khi observation trùng lặp",
    ],
    correct: 1,
    explanation:
      "ReAct dừng khi: (1) AI suy luận rằng đã đủ thông tin để trả lời, hoặc (2) vượt max_steps (tránh vòng lặp vô hạn). Điều kiện dừng tốt là yếu tố thiết kế quan trọng.",
  },
];

export default function ReActFrameworkTopic() {
  const [visibleSteps, setVisibleSteps] = useState(1);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="AI bịa đặt (hallucinate) khi trả lời câu hỏi cần dữ liệu thực tế. Cách tốt nhất để giảm ảo giác?"
          options={[
            "Huấn luyện trên nhiều dữ liệu hơn",
            "Cho AI kiểm chứng thông tin trong quá trình suy nghĩ — suy luận → tra cứu → suy luận tiếp",
            "Thêm câu 'Hãy trả lời chính xác' vào prompt",
          ]}
          correct={1}
          explanation="ReAct (Reasoning + Acting): AI suy luận rồi HÀNH ĐỘNG tra cứu thực tế, thay vì chỉ suy nghĩ trong đầu. Mỗi bước suy luận được 'grounding' bởi dữ liệu thật từ bên ngoài."
        >
          <p className="text-sm text-muted mt-2">
            Hãy quan sát vòng lặp Thought → Action → Observation hoạt động.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Vòng lặp ReAct: Suy luận → Hành động → Quan sát
          </h3>
          <p className="text-sm text-muted mb-4">
            Nhấn &quot;Bước tiếp&quot; để xem AI giải quyết: &quot;Dân số Hà Nội là bao nhiêu?&quot;
          </p>

          <svg viewBox="0 0 700 320" className="w-full max-w-2xl mx-auto mb-4">
            {DEMO_STEPS.slice(0, visibleSteps).map((s, i) => {
              const y = 15 + i * 58;
              const cfg = TYPE_CONFIG[s.type];
              return (
                <g key={i}>
                  <rect x={15} y={y} width={110} height={36} rx={8} fill={cfg.bg} />
                  <text x={70} y={y + 23} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
                    {cfg.label}
                  </text>
                  <text x={140} y={y + 23} fill="var(--text-primary)" fontSize={10}>
                    {s.text.length > 65 ? s.text.slice(0, 65) + "..." : s.text}
                  </text>
                  {i < visibleSteps - 1 && (
                    <line x1={70} y1={y + 36} x2={70} y2={y + 58} stroke="var(--text-tertiary)" strokeWidth={2} strokeDasharray="4,3" />
                  )}
                </g>
              );
            })}
          </svg>

          <div className="flex gap-3 justify-center">
            <button onClick={() => setVisibleSteps(v => Math.min(v + 1, DEMO_STEPS.length))}
              disabled={visibleSteps >= DEMO_STEPS.length}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
              Bước tiếp theo
            </button>
            <button onClick={() => setVisibleSteps(1)}
              className="rounded-lg bg-card border border-border px-5 py-2 text-sm font-semibold text-muted hover:text-foreground">
              Đặt lại
            </button>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Con người không giải quyết vấn đề chỉ bằng suy nghĩ thuần túy — ta{" "}
          <strong>nghĩ rồi làm, quan sát kết quả, rồi nghĩ tiếp</strong>.{" "}
          ReAct dạy AI cùng phương pháp: xen kẽ <em>reasoning</em> (suy luận)
          với <em>acting</em> (hành động kiểm chứng). Mỗi quan sát từ thế giới
          thực giúp điều chỉnh suy luận — giảm ảo giác một cách cấu trúc.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="AI suy luận bằng CoT: 'Paris là thủ đô nước Đức' rồi trả lời sai. Nếu dùng ReAct, bước nào sẽ phát hiện lỗi?"
          options={[
            "Bước Thought — AI sẽ suy nghĩ lại",
            "Bước Action + Observation — AI search 'thủ đô nước Đức' và thấy kết quả là Berlin, tự sửa sai",
            "Bước cuối — AI tự kiểm tra",
            "Không phát hiện được — ReAct cũng sai",
          ]}
          correct={1}
          explanation="ReAct: Thought (Paris là thủ đô Đức?) → Action (search 'capital of Germany') → Observation (Berlin) → Thought (À, Paris là Pháp, Berlin là Đức). Observation từ bên ngoài 'grounding' suy luận sai."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>ReAct</strong>{" "}(Yao et al., 2023) là khung tư duy kết hợp reasoning
            traces và action trong cùng prompt:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Thought:</strong>{" "}AI phân tích tình huống, lập kế hoạch bước tiếp.
              Đây là reasoning trace giúp giải thích quyết định.
            </li>
            <li>
              <strong>Action:</strong>{" "}AI chọn công cụ và thực hiện (search, lookup, calculate).
              Đây là acting — tương tác với môi trường.
            </li>
            <li>
              <strong>Observation:</strong>{" "}Kết quả thực từ bên ngoài. Đưa lại cho AI
              làm input cho vòng lặp tiếp theo.
            </li>
          </ul>

          <CodeBlock language="python" title="react_agent.py">{`# ReAct agent đơn giản
def react_agent(question, tools, max_steps=5):
    context = f"Question: {question}\\n"

    for step in range(max_steps):
        # Thought — AI suy luận
        thought = llm(context + "Thought:")
        context += f"Thought: {thought}\\n"

        # Kiểm tra dừng
        if "Final Answer:" in thought:
            return extract_answer(thought)

        # Action — AI chọn công cụ
        action = llm(context + "Action:")
        context += f"Action: {action}\\n"

        # Observation — Thực thi và lấy kết quả
        result = execute_tool(action, tools)
        context += f"Observation: {result}\\n"

    return "Không tìm được câu trả lời"`}</CodeBlock>

          <Callout variant="insight" title="ReAct vs chỉ Reasoning vs chỉ Acting">
            Chỉ Reasoning (CoT): suy nghĩ giỏi nhưng hay bịa. Chỉ Acting: hành
            động mù quáng không có chiến lược. ReAct kết hợp cả hai: suy nghĩ
            có chiến lược + hành động có kiểm chứng = kết quả tốt nhất.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về ReAct"
          points={[
            "ReAct = Reasoning + Acting: vòng lặp Thought → Action → Observation cho đến khi có đủ thông tin.",
            "Observation từ bên ngoài (API, search) 'grounding' suy luận — giảm hallucination cấu trúc.",
            "Khác CoT (chỉ suy nghĩ): ReAct kiểm chứng mỗi bước bằng dữ liệu thật từ thế giới bên ngoài.",
            "Là nền tảng của hầu hết AI Agent frameworks: LangChain, LlamaIndex, AutoGPT đều dựa trên ReAct pattern.",
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
