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
  slug: "planning",
  title: "Planning",
  titleVi: "Lập kế hoạch — AI biết chia để trị",
  description:
    "Khả năng của AI Agent phân tách vấn đề phức tạp thành chuỗi bước nhỏ hơn và thực hiện có chiến lược.",
  category: "ai-agents",
  tags: ["planning", "decomposition", "agent"],
  difficulty: "intermediate",
  relatedSlugs: ["agent-architecture", "react-framework", "agentic-workflows"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

interface Task { id: number; label: string; done: boolean; children?: Task[]; }

const INITIAL_PLAN: Task[] = [
  { id: 1, label: "Phân tích yêu cầu", done: false, children: [
    { id: 11, label: "Hiểu câu hỏi", done: false },
    { id: 12, label: "Xác định phạm vi", done: false },
  ]},
  { id: 2, label: "Thu thập dữ liệu", done: false, children: [
    { id: 21, label: "Tìm kiếm web", done: false },
    { id: 22, label: "Truy vấn database", done: false },
  ]},
  { id: 3, label: "Xử lý & phân tích", done: false },
  { id: 4, label: "Tổng hợp & trả lời", done: false },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Plan-then-Execute khác Adaptive Planning ở điểm nào?",
    options: [
      "Plan-then-Execute nhanh hơn",
      "Plan-then-Execute lập toàn bộ kế hoạch trước; Adaptive Planning lập từng bước, điều chỉnh dựa trên kết quả trung gian",
      "Adaptive Planning không cần LLM",
      "Không có sự khác biệt",
    ],
    correct: 1,
    explanation:
      "Plan-then-Execute: lập kế hoạch đầy đủ → thực hiện tuần tự. Phù hợp bài toán rõ ràng. Adaptive: lập kế hoạch bước 1 → thực hiện → quan sát → lập kế hoạch bước 2. Phù hợp bài toán không chắc chắn.",
  },
  {
    question: "Task decomposition (phân rã nhiệm vụ) giúp gì cho Agent?",
    options: [
      "Giảm chi phí API",
      "Biến bài toán phức tạp thành chuỗi bước nhỏ mà LLM có thể giải quyết — mỗi bước đủ đơn giản để thực hiện chính xác",
      "Tăng tốc độ trả lời",
      "Giảm hallucination",
    ],
    correct: 1,
    explanation:
      "LLM giải quyết bước nhỏ chính xác hơn bài toán lớn. Phân rã: 'Viết báo cáo doanh thu Q4' → (1) lấy dữ liệu → (2) phân tích → (3) viết kết luận → (4) format. Mỗi bước đơn giản, dễ kiểm chứng.",
  },
  {
    question: "Khi Agent phát hiện bước 3 trong kế hoạch thất bại, nên làm gì?",
    options: [
      "Bỏ qua và tiếp tục bước 4",
      "Phản ánh (reflect) tại sao thất bại → lập kế hoạch mới (replan) → thử lại với chiến lược khác",
      "Báo lỗi và dừng ngay",
      "Lặp lại bước 3 vô hạn",
    ],
    correct: 1,
    explanation:
      "Agent tốt có khả năng reflection: phân tích lý do thất bại (sai công cụ? thiếu dữ liệu?) → replan (thay đổi chiến lược) → thử lại. Đây là adaptive planning — khả năng tự điều chỉnh.",
  },
];

export default function PlanningTopic() {
  const [plan, setPlan] = useState<Task[]>(INITIAL_PLAN);

  const toggleTask = (id: number) => {
    setPlan(prev => prev.map(t => {
      if (t.id === id) return { ...t, done: !t.done };
      if (t.children) {
        const newChildren = t.children.map(c => c.id === id ? { ...c, done: !c.done } : c);
        return { ...t, children: newChildren, done: newChildren.every(c => c.done) };
      }
      return t;
    }));
  };

  const completedCount = plan.reduce((acc, t) => {
    if (t.children) return acc + t.children.filter(c => c.done).length;
    return acc + (t.done ? 1 : 0);
  }, 0);
  const totalCount = plan.reduce((acc, t) => acc + (t.children?.length ?? 1), 0);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn giao AI nhiệm vụ: 'Viết báo cáo so sánh 3 framework ML, bao gồm benchmark và mẫu code'. AI nên làm gì trước tiên?"
          options={[
            "Bắt đầu viết ngay từ đoạn mở đầu",
            "Chia nhiệm vụ thành bước nhỏ: (1) xác định 3 framework, (2) tìm benchmark, (3) viết code mẫu, (4) tổng hợp",
            "Tìm kiếm trên Google tất cả cùng lúc",
          ]}
          correct={1}
          explanation="Lập kế hoạch trước khi hành động — giống đầu bếp đọc công thức trước khi nấu. Agent phân rã nhiệm vụ lớn thành bước nhỏ, xác định thứ tự và phụ thuộc, rồi mới thực hiện."
        >
          <p className="text-sm text-muted mt-2">
            Hãy thử tự mình lập kế hoạch và theo dõi tiến trình!
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Kế hoạch Agent — Nhấn để đánh dấu hoàn thành
          </h3>
          <p className="text-sm text-muted mb-4">
            Tiến trình: {completedCount}/{totalCount} bước hoàn thành
          </p>

          <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto mb-4">
            {plan.map((task, i) => {
              const y = 15 + i * 70;
              return (
                <g key={task.id}>
                  <g onClick={() => !task.children && toggleTask(task.id)} className={task.children ? "" : "cursor-pointer"}>
                    <rect x={25} y={y} width={210} height={38} rx={8}
                      fill={task.done ? "#22c55e" : "var(--bg-surface)"}
                      stroke={task.done ? "#4ade80" : "var(--text-tertiary)"} strokeWidth={2} />
                    <text x={130} y={y + 24} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
                      {task.done ? "done " : ""}{task.label}
                    </text>
                  </g>
                  {task.children?.map((child, j) => (
                    <g key={child.id} onClick={() => toggleTask(child.id)} className="cursor-pointer">
                      <line x1={235} y1={y + 19} x2={300} y2={y + j * 35} stroke="var(--text-tertiary)" strokeWidth={1.5} />
                      <rect x={300} y={y + j * 35 - 14} width={190} height={28} rx={6}
                        fill={child.done ? "#22c55e" : "var(--bg-surface)"}
                        stroke={child.done ? "#4ade80" : "var(--text-tertiary)"} strokeWidth={1.5} />
                      <text x={395} y={y + j * 35 + 4} textAnchor="middle" fill="white" fontSize={11}>
                        {child.done ? "done " : ""}{child.label}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>

          <div className="flex justify-center">
            <button onClick={() => setPlan(INITIAL_PLAN)}
              className="rounded-lg bg-card border border-border px-5 py-2 text-sm font-semibold text-muted hover:text-foreground">
              Đặt lại kế hoạch
            </button>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          LLM giải <strong>bài toán nhỏ</strong>{" "}chính xác hơn nhiều so với bài toán lớn.
          Planning biến 1 nhiệm vụ khó thành 5 bước dễ — mỗi bước đủ đơn giản để LLM
          thực hiện chính xác. Giống ông bà ta nói: <strong>chia để trị</strong>.
          Thêm khả năng <em>phản ánh</em>{" "}(tự đánh giá và điều chỉnh) = Agent thực sự thông minh.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Agent lập kế hoạch: (1) Search A, (2) Search B, (3) So sánh A và B. Bước 1 và 2 có thể chạy song song không?"
          options={[
            "Không — phải tuần tự",
            "Có — bước 1 và 2 độc lập nhau, chỉ bước 3 phụ thuộc kết quả cả hai",
            "Tuỳ thuộc vào công cụ",
            "Song song luôn tốt hơn tuần tự",
          ]}
          correct={1}
          explanation="Phân tích phụ thuộc (dependency): bước 1 và 2 không phụ thuộc nhau → chạy song song. Bước 3 cần kết quả của cả 1 và 2 → phải chờ. Agent tốt tối ưu bằng song song hoá các bước độc lập."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Planning</strong>{" "}là khả năng cốt lõi giúp Agent giải quyết nhiệm vụ
            phức tạp. Gồm 3 kỹ thuật chính:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Task Decomposition:</strong>{" "}Chia nhiệm vụ lớn thành bước nhỏ.
              Kỹ thuật: Chain-of-Thought prompting, Tree of Thoughts.
            </li>
            <li>
              <strong>Plan-then-Execute:</strong>{" "}Lập kế hoạch đầy đủ trước, thực hiện
              tuần tự. Phù hợp bài toán cấu trúc rõ ràng.
            </li>
            <li>
              <strong>Adaptive Planning:</strong>{" "}Lập kế hoạch từng bước, điều chỉnh dựa
              trên kết quả. Phù hợp bài toán không chắc chắn.
            </li>
          </ul>

          <CodeBlock language="python" title="planning_agent.py">{`class PlanningAgent:
    def plan(self, task):
        """Phân rã nhiệm vụ thành bước nhỏ"""
        prompt = f"""Chia nhiệm vụ sau thành các bước nhỏ:
        Nhiệm vụ: {task}
        Xác định bước nào có thể song song."""
        return self.llm(prompt)

    def execute_with_reflection(self, plan):
        for step in plan.steps:
            result = self.execute(step)

            # Phản ánh: bước này thành công không?
            reflection = self.llm(f"Bước: {step}\\n"
                                  f"Kết quả: {result}\\n"
                                  f"Đánh giá: thành công hay thất bại? "
                                  f"Cần điều chỉnh gì?")

            if reflection.needs_replan:
                plan = self.replan(plan, reflection)
                continue

        return self.summarize(plan.results)`}</CodeBlock>

          <Callout variant="insight" title="Tree of Thoughts (ToT)">
            Thay vì lập 1 kế hoạch duy nhất, ToT tạo nhiều nhánh kế hoạch song
            song, đánh giá từng nhánh, chọn nhánh tốt nhất. Giống chơi cờ: nghĩ
            trước nhiều nước rồi chọn nước hay nhất.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Planning"
          points={[
            "Task decomposition: chia bài toán lớn thành bước nhỏ — LLM giải bước nhỏ chính xác hơn.",
            "Plan-then-Execute: lập kế hoạch trước, phù hợp bài toán rõ ràng. Adaptive: lập từng bước, phù hợp bài toán mở.",
            "Reflection (phản ánh): Agent tự đánh giá kết quả, phát hiện lỗi, replan — khả năng tự điều chỉnh.",
            "Tối ưu: phân tích dependency graph, song song hoá bước độc lập, tuần tự bước phụ thuộc.",
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
