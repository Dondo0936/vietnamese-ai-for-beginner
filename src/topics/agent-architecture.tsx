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

const TOTAL_STEPS = 8;

const COMPONENTS = [
  { id: "llm", label: "LLM (Bộ não)", x: 300, y: 55, color: "#3b82f6",
    desc: "Mô hình ngôn ngữ là trung tâm suy luận, ra quyết định và tạo phản hồi. Nhận input, phân tích, chọn action." },
  { id: "memory", label: "Bộ nhớ", x: 110, y: 170, color: "#8b5cf6",
    desc: "Ngắn hạn (context window), dài hạn (vector DB). Giúp Agent nhớ bối cảnh, kinh nghiệm quá khứ, sở thích người dùng." },
  { id: "tools", label: "Công cụ", x: 490, y: 170, color: "#22c55e",
    desc: "API, database, trình duyệt, code interpreter. Mở rộng khả năng của LLM — tương tác với thế giới thực." },
  { id: "planning", label: "Lập kế hoạch", x: 300, y: 270, color: "#f59e0b",
    desc: "Chia bài toán lớn thành bước nhỏ, sắp xếp thứ tự, phản ánh và điều chỉnh. Là 'chiến lược' của Agent." },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Thành phần nào KHÔNG thể thiếu trong mọi AI Agent?",
    options: [
      "Bộ nhớ dài hạn",
      "LLM (bộ não) — trung tâm suy luận và ra quyết định",
      "Trình duyệt web",
      "Giao diện người dùng",
    ],
    correct: 1,
    explanation:
      "LLM là 'bộ não' không thể thiếu — mọi Agent đều cần nó để suy luận và ra quyết định. Bộ nhớ, công cụ, planning đều quan trọng nhưng Agent đơn giản có thể hoạt động không có chúng.",
  },
  {
    question: "Agent vòng lặp (agentic loop) hoạt động theo mô hình nào?",
    options: [
      "Input → Output (1 lần)",
      "Suy luận → Hành động → Quan sát → (Lặp lại cho đến khi hoàn thành)",
      "Lập kế hoạch → Thực hiện toàn bộ → Kết thúc",
      "Nhận lệnh → Chạy script → Trả kết quả",
    ],
    correct: 1,
    explanation:
      "Agent hiện đại hoạt động theo vòng lặp: perceive (nhận thức) → reason (suy luận) → act (hành động) → observe (quan sát kết quả) → lặp lại. Dừng khi nhiệm vụ hoàn thành hoặc timeout.",
  },
  {
    question: "Sự khác biệt cốt lõi giữa AI Agent và chatbot thông thường?",
    options: [
      "Agent có giao diện đẹp hơn",
      "Agent có khả năng TỰ CHỦ hành động — lập kế hoạch, sử dụng công cụ, tự điều chỉnh — thay vì chỉ phản hồi câu hỏi",
      "Agent dùng mô hình lớn hơn",
      "Agent chạy nhanh hơn chatbot",
    ],
    correct: 1,
    explanation:
      "Chatbot: nhận câu hỏi → trả lời (1 bước). Agent: nhận nhiệm vụ → lập kế hoạch → gọi công cụ → kiểm tra → điều chỉnh → hoàn thành (nhiều bước, tự chủ). Agent 'hành động' thay vì chỉ 'phản hồi'.",
  },
];

export default function AgentArchitectureTopic() {
  const [selected, setSelected] = useState<string | null>(null);
  const info = COMPONENTS.find(c => c.id === selected);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn muốn xây AI có thể: tìm kiếm web, đọc email, viết code, và tự điều chỉnh khi sai. Cần tối thiểu mấy thành phần?"
          options={[
            "1 — chỉ cần LLM đủ mạnh",
            "4 — Bộ não (LLM), Bộ nhớ, Công cụ, Lập kế hoạch — như con người cần não, trí nhớ, tay chân, và khả năng lên kế hoạch",
            "2 — LLM + API là đủ",
          ]}
          correct={1}
          explanation="AI Agent cần 4 thành phần cốt lõi: LLM (suy luận), Memory (nhớ context), Tools (tương tác thế giới), Planning (chia bài toán). Thiếu bất kỳ thành phần nào, Agent sẽ bị giới hạn nghiêm trọng."
        >
          <p className="text-sm text-muted mt-2">
            Hãy khám phá từng thành phần và cách chúng kết nối với nhau.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            4 thành phần của AI Agent
          </h3>
          <p className="text-sm text-muted mb-4">
            Nhấn vào từng thành phần để xem vai trò.
          </p>

          <svg viewBox="0 0 600 330" className="w-full max-w-2xl mx-auto mb-4">
            <line x1={300} y1={85} x2={110} y2={148} stroke="var(--text-tertiary)" strokeWidth={2} />
            <line x1={300} y1={85} x2={490} y2={148} stroke="var(--text-tertiary)" strokeWidth={2} />
            <line x1={300} y1={85} x2={300} y2={245} stroke="var(--text-tertiary)" strokeWidth={2} />
            <line x1={110} y1={195} x2={300} y2={245} stroke="var(--text-tertiary)" strokeWidth={1.5} strokeDasharray="4,3" />
            <line x1={490} y1={195} x2={300} y2={245} stroke="var(--text-tertiary)" strokeWidth={1.5} strokeDasharray="4,3" />

            {COMPONENTS.map(c => (
              <g key={c.id} onClick={() => setSelected(c.id)} className="cursor-pointer">
                <rect x={c.x - 70} y={c.y - 25} width={140} height={50} rx={12}
                  fill={selected === c.id ? c.color : "var(--bg-surface)"}
                  stroke={c.color} strokeWidth={selected === c.id ? 3 : 2} />
                <text x={c.x} y={c.y + 5} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                  {c.label}
                </text>
              </g>
            ))}

            {/* Loop indicator */}
            <path d="M 510 140 C 560 140, 560 290, 490 290" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" />
            <text x="565" y="220" fill="#8b5cf6" fontSize="8" transform="rotate(90, 565, 220)">
              Vòng lặp Agent
            </text>
          </svg>

          {info && (
            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm font-medium" style={{ color: COMPONENTS.find(c => c.id === selected)?.color }}>
                {info.label}
              </p>
              <p className="text-sm text-muted mt-1">{info.desc}</p>
            </div>
          )}
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          AI Agent không phải LLM được bọc thêm API — nó là một{" "}
          <strong>hệ thống tự chủ</strong>{" "}có vòng lặp: nhận thức → suy luận →
          hành động → quan sát → điều chỉnh. Giống con người giải quyết vấn đề:
          ta không chỉ <em>nghĩ</em>, mà còn <em>làm</em>, <em>nhìn kết quả</em>,
          rồi <em>thay đổi cách làm</em>.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Agent được giao: 'Tìm 5 bài báo về AI, tóm tắt mỗi bài, gửi email tổng hợp cho sếp'. Thành phần nào được sử dụng?"
          options={[
            "Chỉ LLM và Công cụ",
            "Cả 4: LLM (suy luận), Planning (chia 3 bước), Tools (search + email), Memory (nhớ kết quả trung gian)",
            "Chỉ Công cụ và Planning",
            "Chỉ LLM — đủ thông minh để tự làm",
          ]}
          correct={1}
          explanation="Planning chia thành 3 bước (search → summarize → email). Tools thực hiện search web và send email. LLM tóm tắt và suy luận. Memory lưu kết quả tìm kiếm để tổng hợp ở bước cuối."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Kiến trúc Agent</strong>{" "}hiện đại gồm 4 thành phần cốt lõi hoạt
            động trong vòng lặp liên tục:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>LLM (Bộ não):</strong>{" "}Trung tâm suy luận. Nhận input từ người dùng
              + context từ bộ nhớ + kết quả từ công cụ → đưa ra quyết định tiếp theo.
            </li>
            <li>
              <strong>Bộ nhớ:</strong>{" "}Ngắn hạn (context window, scratchpad) và dài hạn
              (vector database). Giải quyết giới hạn context window của LLM.
            </li>
            <li>
              <strong>Công cụ:</strong>{" "}Mở rộng khả năng: search, code execution, API calls,
              database queries. Định nghĩa bằng JSON Schema.
            </li>
            <li>
              <strong>Lập kế hoạch:</strong>{" "}Task decomposition, reflection, self-correction.
              Biến nhiệm vụ phức tạp thành chuỗi bước thực hiện được.
            </li>
          </ul>

          <CodeBlock language="python" title="agent_architecture.py">{`class Agent:
    def __init__(self, llm, tools, memory):
        self.llm = llm          # Bộ não
        self.tools = tools      # Công cụ
        self.memory = memory    # Bộ nhớ

    def run(self, task, max_steps=10):
        plan = self.llm.plan(task)    # Lập kế hoạch
        self.memory.save(plan)

        for step in range(max_steps):
            context = self.memory.recall(task)
            action = self.llm.decide(task, context, self.tools)

            if action.type == "finish":
                return action.result

            # Thực thi công cụ
            result = self.tools.execute(action)
            self.memory.save(result)  # Lưu kết quả

            # Phản ánh: cần điều chỉnh không?
            reflection = self.llm.reflect(task, result)
            if reflection.needs_replan:
                plan = self.llm.replan(task, reflection)`}</CodeBlock>

          <Callout variant="warning" title="Thách thức chính của Agent">
            Agent dễ rơi vào vòng lặp vô hạn, gọi sai công cụ, hoặc quên
            context giữa các bước. Cần: max_steps (giới hạn vòng lặp),
            guardrails (giới hạn hành động), và monitoring (theo dõi từng bước).
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Agent Architecture"
          points={[
            "4 thành phần: LLM (suy luận), Memory (ngắn hạn + dài hạn), Tools (công cụ bên ngoài), Planning (lập kế hoạch).",
            "Agent hoạt động theo vòng lặp: Perceive → Reason → Act → Observe → Adjust → Lặp lại.",
            "Khác chatbot: Agent TỰ CHỦ lập kế hoạch và hành động nhiều bước, thay vì chỉ phản hồi 1 câu hỏi.",
            "Thách thức: vòng lặp vô hạn, sai công cụ, mất context. Cần max_steps, guardrails, monitoring.",
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
