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
  slug: "multi-agent",
  title: "Multi-Agent Systems",
  titleVi: "Hệ thống đa Agent — Đội ngũ AI phối hợp",
  description:
    "Nhiều AI Agent chuyên biệt cùng phối hợp để giải quyết các bài toán phức tạp mà một Agent đơn lẻ khó xử lý.",
  category: "ai-agents",
  tags: ["multi-agent", "collaboration", "orchestration"],
  difficulty: "advanced",
  relatedSlugs: ["agent-architecture", "orchestration", "agentic-workflows"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const AGENTS = [
  { id: "researcher", label: "Nghiên cứu", color: "#3b82f6", x: 150, y: 60 },
  { id: "writer", label: "Viết bài", color: "#22c55e", x: 450, y: 60 },
  { id: "reviewer", label: "Kiểm duyệt", color: "#f59e0b", x: 150, y: 220 },
  { id: "coordinator", label: "Điều phối", color: "#ef4444", x: 300, y: 140 },
  { id: "coder", label: "Lập trình", color: "#8b5cf6", x: 450, y: 220 },
];

const MESSAGES = [
  { from: "coordinator", to: "researcher", text: "Tìm dữ liệu về performance của 3 framework ML" },
  { from: "researcher", to: "coordinator", text: "Đã tìm: PyTorch nhanh hơn TF 15%, JAX nhanh nhất" },
  { from: "coordinator", to: "coder", text: "Viết benchmark code cho 3 framework" },
  { from: "coder", to: "coordinator", text: "Code hoàn tất, kết quả: JAX 1.2x, PyTorch 1.0x, TF 0.9x" },
  { from: "coordinator", to: "writer", text: "Viết báo cáo tổng hợp từ dữ liệu nghiên cứu + benchmark" },
  { from: "writer", to: "reviewer", text: "Bản nháp hoàn tất, xin kiểm duyệt" },
  { from: "reviewer", to: "coordinator", text: "Tốt! Cần bổ sung phần so sánh chi phí" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Khi nào nên dùng multi-agent thay vì single agent?",
    options: [
      "Luôn luôn — nhiều agent tốt hơn",
      "Khi nhiệm vụ cần nhiều chuyên môn khác nhau (nghiên cứu + code + viết) hoặc cần debate/kiểm chứng chéo",
      "Khi muốn tiết kiệm chi phí",
      "Khi mô hình LLM yếu",
    ],
    correct: 1,
    explanation:
      "Multi-agent tốt khi: (1) cần nhiều vai trò chuyên biệt, (2) cần kiểm chứng chéo (reviewer kiểm tra writer), (3) bài toán quá phức tạp cho 1 agent. Nhưng thêm chi phí coordination — đừng dùng cho tác vụ đơn giản.",
  },
  {
    question: "Mô hình điều phối nào phù hợp nhất khi có 10+ agent cần phối hợp?",
    options: [
      "Ngang hàng — tất cả giao tiếp trực tiếp",
      "Phân cấp — coordinator chính quản lý các sub-coordinator, mỗi sub-coordinator quản lý nhóm agent",
      "Không cần điều phối — để tự quản",
      "Tuần tự — từng agent chạy lần lượt",
    ],
    correct: 1,
    explanation:
      "10+ agent giao tiếp ngang hàng = O(n^2) tin nhắn = hỗn loạn. Phân cấp (hierarchical): coordinator → sub-coordinator → agents. Giảm complexity, dễ quản lý, dễ debug.",
  },
  {
    question: "Debate pattern (tranh luận) giữa 2 agent giúp gì?",
    options: [
      "Tăng tốc độ xử lý",
      "Giảm hallucination: agent A đưa ra ý kiến, agent B phản biện và kiểm chứng — kết quả cuối được cân nhắc kỹ hơn",
      "Giảm chi phí API",
      "Tăng tính sáng tạo",
    ],
    correct: 1,
    explanation:
      "Debate: Agent A trả lời → Agent B phản biện ('Sai! Vì...') → Agent A phản hồi → Kết luận. Giống peer review trong khoa học — giảm sai sót vì mỗi ý kiến đều được kiểm chứng.",
  },
];

export default function MultiAgentTopic() {
  const [msgIndex, setMsgIndex] = useState(0);
  const currentMsg = MESSAGES[msgIndex];
  const fromAgent = AGENTS.find(a => a.id === currentMsg.from)!;
  const toAgent = AGENTS.find(a => a.id === currentMsg.to)!;

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn cần AI viết báo cáo kỹ thuật: tìm dữ liệu, viết code benchmark, soạn bài, kiểm duyệt. 1 Agent làm tất cả hay 4 Agent chuyên biệt?"
          options={[
            "1 Agent — đơn giản hơn và nhanh hơn",
            "4 Agent chuyên biệt — mỗi Agent giỏi 1 việc, phối hợp cho kết quả tốt hơn, giống đội ngũ sản xuất phim",
            "2 Agent — 1 làm, 1 kiểm tra là đủ",
          ]}
          correct={1}
          explanation="Mỗi Agent chuyên biệt (researcher, coder, writer, reviewer) giỏi hơn 1 Agent đa năng. Giống đội ngũ: đạo diễn phối hợp quay phim, diễn viên, biên kịch — kết quả tốt hơn 1 người làm tất cả."
        >
          <p className="text-sm text-muted mt-2">
            Hãy quan sát đội ngũ Agent phối hợp hoàn thành nhiệm vụ.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            5 Agent phối hợp viết báo cáo
          </h3>
          <p className="text-sm text-muted mb-4">
            Nhấn &quot;Tin nhắn tiếp&quot; để xem luồng giao tiếp giữa các Agent.
          </p>

          <svg viewBox="0 0 600 290" className="w-full max-w-2xl mx-auto mb-4">
            <line x1={fromAgent.x} y1={fromAgent.y} x2={toAgent.x} y2={toAgent.y}
              stroke="#60a5fa" strokeWidth={3} strokeDasharray="6,4" />

            {AGENTS.map(a => (
              <g key={a.id}>
                <circle cx={a.x} cy={a.y} r={32}
                  fill={a.id === currentMsg.from || a.id === currentMsg.to ? a.color : "var(--bg-surface)"}
                  stroke={a.color} strokeWidth={2} />
                <text x={a.x} y={a.y + 4} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">
                  {a.label}
                </text>
              </g>
            ))}
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center mb-3">
            <p className="text-xs text-muted mb-1">
              Tin nhắn {msgIndex + 1}/{MESSAGES.length}
            </p>
            <p className="text-sm text-foreground">
              <strong style={{ color: fromAgent.color }}>{fromAgent.label}</strong>{" "}
              &rarr;{" "}
              <strong style={{ color: toAgent.color }}>{toAgent.label}</strong>:
              &quot;{currentMsg.text}&quot;
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => setMsgIndex(i => Math.min(i + 1, MESSAGES.length - 1))}
              disabled={msgIndex >= MESSAGES.length - 1}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
              Tin nhắn tiếp
            </button>
            <button onClick={() => setMsgIndex(0)}
              className="rounded-lg bg-card border border-border px-5 py-2 text-sm font-semibold text-muted hover:text-foreground">
              Bắt đầu lại
            </button>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Multi-agent không chỉ là &quot;nhiều agent chạy song song&quot; — mà là{" "}
          <strong>chuyên môn hoá + kiểm chứng chéo</strong>. Researcher tìm dữ liệu,
          Coder viết benchmark, Writer tổng hợp, Reviewer phản biện. Mỗi Agent giỏi
          1 việc, và <em>sai lầm của Agent này được Agent khác phát hiện</em>.
          Giống khoa học: không ai tự peer review bài mình.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="5 agent giao tiếp ngang hàng (mọi agent nói chuyện trực tiếp). Có bao nhiêu kênh giao tiếp? Vấn đề gì xảy ra?"
          options={[
            "5 kênh — mỗi agent 1 kênh",
            "10 kênh — C(5,2) = 10 cặp. Thông tin dễ xung đột, khó đồng bộ, tốn token",
            "25 kênh",
            "Không có vấn đề",
          ]}
          correct={1}
          explanation="C(5,2) = 10 kênh giao tiếp. Với 20 agent = C(20,2) = 190 kênh! Giải pháp: mô hình phân cấp (coordinator) hoặc pub/sub (shared state) — giảm từ O(n^2) xuống O(n)."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Hệ thống đa Agent</strong>{" "}sử dụng nhiều AI Agent chuyên biệt phối hợp.
            Ba mô hình phối hợp chính:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Điều phối trung tâm (Hub-and-Spoke):</strong>{" "}1 coordinator phân công
              và giám sát. Đơn giản, dễ debug. Nút cổ chai tại coordinator.
            </li>
            <li>
              <strong>Ngang hàng (Peer-to-Peer):</strong>{" "}Agent giao tiếp trực tiếp.
              Linh hoạt nhưng phức tạp O(n^2). Phù hợp debate pattern.
            </li>
            <li>
              <strong>Phân cấp (Hierarchical):</strong>{" "}Tổ chức theo cây. Coordinator
              → sub-coordinator → agents. Mở rộng tốt cho hệ thống lớn.
            </li>
          </ul>

          <CodeBlock language="python" title="multi_agent.py">{`# Hệ thống đa Agent với CrewAI pattern
class MultiAgentSystem:
    def __init__(self):
        self.researcher = Agent(role="Nghiên cứu", tools=[web_search])
        self.coder = Agent(role="Lập trình", tools=[code_exec])
        self.writer = Agent(role="Viết bài", tools=[])
        self.reviewer = Agent(role="Kiểm duyệt", tools=[])
        self.coordinator = Agent(role="Điều phối", tools=[])

    def run(self, task):
        plan = self.coordinator.plan(task)

        # Bước 1: Nghiên cứu + Code (song song)
        research = self.researcher.execute(plan.step1)
        code_result = self.coder.execute(plan.step2)

        # Bước 2: Viết bài (phụ thuộc bước 1)
        draft = self.writer.execute(research, code_result)

        # Bước 3: Kiểm duyệt → Feedback loop
        review = self.reviewer.evaluate(draft)
        if review.needs_revision:
            draft = self.writer.revise(draft, review.feedback)

        return draft`}</CodeBlock>

          <Callout variant="warning" title="Chi phí coordination">
            Mỗi tin nhắn giữa agents = thêm API call + tokens. 5 agent x 5 vòng
            giao tiếp = 25 LLM calls. Đảm bảo lợi ích chuyên môn hoá lớn hơn
            chi phí coordination. Tác vụ đơn giản: 1 agent đủ tốt.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Multi-Agent Systems"
          points={[
            "Nhiều Agent chuyên biệt phối hợp: researcher + coder + writer + reviewer > 1 agent đa năng cho bài toán phức tạp.",
            "3 mô hình: Hub-and-Spoke (đơn giản), Peer-to-Peer (linh hoạt), Hierarchical (mở rộng tốt).",
            "Debate pattern: agent phản biện nhau → giảm hallucination. Giống peer review trong khoa học.",
            "Trade-off: chuyên môn hoá tốt hơn nhưng tốn chi phí coordination. Không dùng cho tác vụ đơn giản.",
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
