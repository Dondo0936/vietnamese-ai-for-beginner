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
  slug: "orchestration",
  title: "Orchestration",
  titleVi: "Điều phối — Nhạc trưởng của hệ thống AI",
  description:
    "Tầng quản lý luồng công việc, điều phối giữa các Agent, công cụ và dịch vụ trong hệ thống AI phức tạp.",
  category: "ai-agents",
  tags: ["orchestration", "workflow", "coordination"],
  difficulty: "advanced",
  relatedSlugs: ["multi-agent", "agentic-workflows", "agent-architecture"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const FRAMEWORKS = [
  { id: "langgraph", name: "LangGraph", desc: "Graph-based workflow. Nodes = actions, edges = transitions. Stateful, flexible.", color: "#3b82f6" },
  { id: "crewai", name: "CrewAI", desc: "Role-based multi-agent. Agents có role, goal, backstory. Dễ dùng cho team-based tasks.", color: "#22c55e" },
  { id: "autogen", name: "AutoGen", desc: "Conversation-based. Agents chat với nhau. GroupChat pattern cho multi-agent debate.", color: "#8b5cf6" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tầng orchestration giải quyết vấn đề gì mà Agent đơn lẻ không xử lý được?",
    options: [
      "Tăng tốc LLM",
      "Quản lý luồng giữa nhiều Agent/tools: định tuyến, trạng thái, xử lý lỗi, tối ưu tài nguyên — coordination phức tạp",
      "Cải thiện prompt",
      "Giảm chi phí token",
    ],
    correct: 1,
    explanation:
      "Khi hệ thống có 5+ agents, 10+ tools, cần: routing (agent nào xử lý?), state management (đang ở bước nào?), error handling (bước 3 fail thì sao?), resource optimization (song song hay tuần tự?). Orchestration quản lý tất cả.",
  },
  {
    question: "Graph-based orchestration (LangGraph) có lợi thế gì so với sequential chains?",
    options: [
      "Nhanh hơn",
      "Cho phép branching (rẽ nhánh), looping (vòng lặp), conditional routing (đi nhánh nào tuỳ kết quả) — linh hoạt hơn chain cứng",
      "Dùng ít token hơn",
      "Không cần LLM",
    ],
    correct: 1,
    explanation:
      "Chain: A → B → C (cứng nhắc). Graph: A → nếu OK → B, nếu fail → retry A, nếu B xong → C hoặc D tuỳ kết quả. Graph biểu diễn logic phức tạp mà chain không thể.",
  },
  {
    question: "Khi step 3/5 trong workflow fail, orchestrator nên làm gì?",
    options: [
      "Restart toàn bộ từ đầu",
      "Retry step 3 (có giới hạn), nếu vẫn fail thì fallback sang chiến lược khác hoặc escalate cho con người",
      "Bỏ qua và chạy step 4",
      "Dừng ngay và báo lỗi",
    ],
    correct: 1,
    explanation:
      "Orchestrator tốt có error handling strategy: (1) retry với backoff, (2) fallback sang tool/agent khác, (3) escalate cho human nếu critical, (4) checkpoint để resume từ bước cuối thành công.",
  },
  {
    type: "fill-blank",
    question: "Tầng orchestration biến một nhiệm vụ lớn thành một {blank} gồm nhiều bước ({blank}) có thứ tự, trạng thái và xử lý lỗi rõ ràng.",
    blanks: [
      { answer: "workflow", accept: ["luồng công việc", "quy trình", "luồng"] },
      { answer: "multi-step", accept: ["multi step", "đa bước", "nhiều bước", "multistep"] },
    ],
    explanation: "Orchestrator mô hình hoá nhiệm vụ như một workflow (luồng công việc) multi-step: mỗi node là một action của agent/tool, các edge mô tả thứ tự, điều kiện và nhánh xử lý lỗi.",
  },
];

export default function OrchestrationTopic() {
  const [selectedFw, setSelectedFw] = useState(0);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Hệ thống có 5 Agent, 10 công cụ, 3 database. Agent A cần kết quả Agent B trước khi chạy. Agent C và D chạy song song. Ai quản lý tất cả?"
          options={[
            "Mỗi Agent tự quản lý — giao tiếp trực tiếp",
            "Cần tầng ĐIỀU PHỐI riêng biệt — quản lý luồng, trạng thái, lỗi, và tài nguyên như nhạc trưởng quản lý dàn nhạc",
            "Người dùng tự chỉ đạo từng bước",
          ]}
          correct={1}
          explanation="Orchestration layer = nhạc trưởng: biết khi nào violon chơi, khi nào kèn ngưng, khi nào cả dàn hoà tấu. Quản lý routing, state, dependencies, error handling cho hệ thống phức tạp."
        >
          <p className="text-sm text-muted mt-2">
            Hãy khám phá tầng điều phối và các framework phổ biến.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Kiến trúc Orchestration
          </h3>
          <p className="text-sm text-muted mb-4">
            Tầng điều phối kết nối agents, tools, và dịch vụ.
          </p>

          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto mb-4">
            {/* User input */}
            <rect x={225} y={5} width={150} height={35} rx={8} fill="var(--bg-surface)" stroke="var(--text-tertiary)" strokeWidth={1.5} />
            <text x={300} y={27} textAnchor="middle" fill="var(--text-primary)" fontSize={10} fontWeight="bold">
              Người dùng
            </text>

            <line x1={300} y1={40} x2={300} y2={60} stroke="var(--text-tertiary)" strokeWidth={1.5} />

            {/* Orchestrator */}
            <rect x={175} y={60} width={250} height={50} rx={12} fill="#3b82f6" stroke="#60a5fa" strokeWidth={2} />
            <text x={300} y={82} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
              Tầng Điều phối
            </text>
            <text x={300} y={98} textAnchor="middle" fill="#bfdbfe" fontSize={8}>
              Routing | State | Error Handling | Monitoring
            </text>

            {/* Agents */}
            {["Agent A\n(Nghiên cứu)", "Agent B\n(Viết code)", "Agent C\n(Kiểm tra)"].map((name, i) => {
              const x = 100 + i * 200;
              const lines = name.split("\n");
              return (
                <g key={i}>
                  <line x1={300} y1={110} x2={x} y2={140} stroke="var(--text-tertiary)" strokeWidth={1.5} />
                  <rect x={x - 65} y={140} width={130} height={42} rx={8} fill="var(--bg-surface)" stroke="#8b5cf6" strokeWidth={2} />
                  <text x={x} y={157} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">{lines[0]}</text>
                  <text x={x} y={172} textAnchor="middle" fill="var(--text-tertiary)" fontSize={8}>{lines[1]}</text>
                </g>
              );
            })}

            {/* Tools */}
            {["API", "Database", "LLM", "Search"].map((tool, i) => {
              const x = 75 + i * 150;
              return (
                <g key={i}>
                  <line x1={x} y1={200} x2={x} y2={222} stroke="var(--text-tertiary)" strokeWidth={1} strokeDasharray="3,3" />
                  <rect x={x - 50} y={222} width={100} height={30} rx={6} fill="var(--bg-surface)" stroke="#22c55e" strokeWidth={1.5} />
                  <text x={x} y={241} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold">{tool}</text>
                </g>
              );
            })}

            <text x={560} y={165} fill="var(--text-tertiary)" fontSize={8}>Agents</text>
            <text x={560} y={240} fill="var(--text-tertiary)" fontSize={8}>Tools</text>
          </svg>

          <h4 className="text-sm font-semibold text-foreground mb-2">Frameworks phổ biến:</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {FRAMEWORKS.map((fw, i) => (
              <button key={fw.id} onClick={() => setSelectedFw(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedFw === i ? "text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={selectedFw === i ? { backgroundColor: fw.color } : {}}>
                {fw.name}
              </button>
            ))}
          </div>
          <div className="rounded-lg bg-background/50 border border-border p-3">
            <p className="text-sm font-medium" style={{ color: FRAMEWORKS[selectedFw].color }}>
              {FRAMEWORKS[selectedFw].name}
            </p>
            <p className="text-sm text-muted mt-1">{FRAMEWORKS[selectedFw].desc}</p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Orchestration không phải thêm 1 layer phức tạp — nó là thứ{" "}
          <strong>biến hỗn loạn thành trật tự</strong>. Không có nhạc trưởng, 50 nhạc
          công chơi 50 bản khác nhau. Có nhạc trưởng, cùng 50 nhạc công tạo nên
          giao hưởng hoàn hảo. Khi mỗi{" "}
          <TopicLink slug="agent-architecture">agent</TopicLink>{" "}chạy vòng lặp{" "}
          <TopicLink slug="react-framework">ReAct</TopicLink>{" "}riêng và cả hệ{" "}
          <TopicLink slug="multi-agent">multi-agent</TopicLink>{" "}cần phối hợp, orchestration quyết định{" "}
          <em>ai làm gì</em>, <em>khi nào</em>, <em>theo thứ tự nào</em>, và{" "}
          <em>xử lý ra sao khi có lỗi</em>.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Workflow: A → B → C. Bước B thất bại 3 lần liên tiếp. Orchestrator nên làm gì?"
          options={[
            "Retry lần thứ 4, 5, 6... vô hạn",
            "Sau 3 retry: thử fallback (Agent khác hoặc tool khác cho bước B). Nếu fallback cũng fail: escalate cho con người",
            "Bỏ qua B, chạy C",
            "Restart từ A",
          ]}
          correct={1}
          explanation="Strategy: retry (có limit) → fallback (plan B) → escalate (human). Ví dụ: B = search API fail → retry 3x → fallback sang API khác → nếu vẫn fail → thông báo user. KHÔNG retry vô hạn, KHÔNG bỏ qua."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Orchestration</strong>{" "}là tầng quản lý cấp cao, đảm nhận 4 nhiệm vụ:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Routing:</strong>{" "}Xác định Agent/tool nào xử lý mỗi bước.
              Có thể dùng LLM router hoặc rule-based.
            </li>
            <li>
              <strong>State Management:</strong>{" "}Theo dõi tiến trình: đang ở bước nào,
              kết quả trung gian là gì, checkpoint để resume.
            </li>
            <li>
              <strong>Error Handling:</strong>{" "}Retry → fallback → escalate.
              Timeout cho mỗi bước. Circuit breaker cho service lỗi.
            </li>
            <li>
              <strong>Resource Optimization:</strong>{" "}Song song hoá bước độc lập,
              rate limiting cho API, cost tracking.
            </li>
          </ul>

          <CodeBlock language="python" title="orchestration.py">{`from langgraph.graph import StateGraph

# LangGraph: graph-based orchestration
graph = StateGraph(AgentState)

# Nodes = actions
graph.add_node("research", research_agent)
graph.add_node("code", coding_agent)
graph.add_node("review", review_agent)

# Edges = transitions (có thể conditional)
graph.add_edge("research", "code")

# Conditional routing: review pass → END, fail → code
graph.add_conditional_edges(
    "review",
    lambda state: "end" if state["approved"] else "code",
    {"end": END, "code": "code"},
)

# Compile và chạy
app = graph.compile()
result = app.invoke({"task": "Viết API endpoint"})`}</CodeBlock>

          <Callout variant="insight" title="Graph vs Chain vs Agent-based">
            Chain: A → B → C (cố định, đơn giản). Agent-based: LLM tự quyết
            bước tiếp (linh hoạt, khó kiểm soát). Graph: nodes + conditional
            edges (cân bằng — linh hoạt VÀ kiểm soát được). LangGraph là trend
            2024-2025.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Orchestration"
          points={[
            "4 nhiệm vụ: Routing (ai xử lý?), State (đang ở đâu?), Error Handling (fail thì sao?), Resource (tối ưu chi phí/tốc độ).",
            "Graph-based (LangGraph): nodes = actions, edges = transitions. Hỗ trợ branching, looping, conditional — linh hoạt hơn chain.",
            "Error strategy: retry (có limit) → fallback (plan B) → escalate (human). Checkpoint để resume từ bước cuối thành công.",
            "Frameworks: LangGraph (graph), CrewAI (role-based), AutoGen (conversation). Chọn theo use case.",
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
