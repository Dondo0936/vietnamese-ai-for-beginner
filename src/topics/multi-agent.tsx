"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { PredictionGate, AhaMoment, InlineChallenge, Callout, CollapsibleDetail,
  MiniSummary, CodeBlock, LessonSection, LaTeX, TopicLink, ProgressSteps } from "@/components/interactive";
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

/* ──────────────────────────────────────────────────────────────
 * Cấu hình 3 agent cho visualization chính.
 * Coordinator ở giữa, Researcher + Writer ở 2 bên.
 * Toạ độ được căn cho viewBox 600×320.
 * ────────────────────────────────────────────────────────────── */
type AgentId = "coordinator" | "researcher" | "writer";

type AgentConfig = {
  id: AgentId;
  label: string;
  role: string;
  color: string;
  x: number;
  y: number;
  icon: string;
};

const AGENTS: AgentConfig[] = [
  {
    id: "coordinator",
    label: "Coordinator",
    role: "Điều phối",
    color: "#ef4444",
    x: 300,
    y: 80,
    icon: "🎯",
  },
  {
    id: "researcher",
    label: "Researcher",
    role: "Nghiên cứu",
    color: "#3b82f6",
    x: 120,
    y: 230,
    icon: "🔍",
  },
  {
    id: "writer",
    label: "Writer",
    role: "Viết bài",
    color: "#22c55e",
    x: 480,
    y: 230,
    icon: "✍️",
  },
];

/* ──────────────────────────────────────────────────────────────
 * Kịch bản tin nhắn — mô phỏng flow orchestration.
 * Mỗi bước mô tả 1 message hoặc 1 phase xử lý local.
 *
 *   "send"    : có animation đường bay tin nhắn
 *   "process" : agent đang "suy nghĩ" (pulse)
 *   "final"   : kết quả tổng hợp hiển thị ở panel dưới
 * ────────────────────────────────────────────────────────────── */
type Step =
  | { kind: "send"; from: AgentId; to: AgentId; text: string }
  | { kind: "process"; who: AgentId; text: string }
  | { kind: "final"; text: string };

const SCRIPT: Step[] = [
  {
    kind: "process",
    who: "coordinator",
    text: "Coordinator nhận task và phân rã thành 2 subtask: (1) nghiên cứu xu hướng LLM agent 2026, (2) viết báo cáo 300 từ.",
  },
  {
    kind: "send",
    from: "coordinator",
    to: "researcher",
    text: "Subtask A — Tìm 3 xu hướng LLM agent nổi bật năm 2026. Trả JSON {title, source}.",
  },
  {
    kind: "process",
    who: "researcher",
    text: "Researcher tra cứu web, tổng hợp. Dùng tools: web_search, read_url.",
  },
  {
    kind: "send",
    from: "researcher",
    to: "coordinator",
    text: "Kết quả: 3 xu hướng — (1) Tool Use nâng cao, (2) Long-context reasoning, (3) Multi-agent orchestration.",
  },
  {
    kind: "process",
    who: "coordinator",
    text: "Coordinator validate kết quả rồi gửi sang Writer kèm yêu cầu format.",
  },
  {
    kind: "send",
    from: "coordinator",
    to: "writer",
    text: "Subtask B — Viết báo cáo 300 từ dựa trên 3 điểm trên. Giọng văn chuyên nghiệp, Tiếng Việt.",
  },
  {
    kind: "process",
    who: "writer",
    text: "Writer soạn bản nháp, tự kiểm tra ngữ pháp + độ dài.",
  },
  {
    kind: "send",
    from: "writer",
    to: "coordinator",
    text: "Bản báo cáo 312 từ — sẵn sàng giao cho người dùng.",
  },
  {
    kind: "final",
    text: "Báo cáo hoàn tất. Tổng: 8 thông điệp, 3 phase xử lý, 1 kết quả thống nhất.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * Bộ câu hỏi — 8 quiz questions phủ các mặt của multi-agent.
 * ────────────────────────────────────────────────────────────── */
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
      "10+ agent giao tiếp ngang hàng = O(n²) tin nhắn = hỗn loạn. Phân cấp (hierarchical): coordinator → sub-coordinator → agents. Giảm complexity, dễ quản lý, dễ debug.",
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
  {
    question: "Vai trò chính của Coordinator (hay Orchestrator) là gì?",
    options: [
      "Trực tiếp trả lời câu hỏi người dùng",
      "Phân rã nhiệm vụ lớn thành subtask, phân công đúng specialist, tổng hợp kết quả",
      "Chỉ chuyển tiếp tin nhắn giữa các agent",
      "Chạy các công cụ bên ngoài như web search",
    ],
    correct: 1,
    explanation:
      "Coordinator là bộ não điều phối: (1) decompose task, (2) route tới specialist phù hợp, (3) validate output, (4) aggregate thành kết quả cuối. LangGraph và CrewAI đều có node/role này.",
  },
  {
    question: "Chi phí coordination của hệ thống 5 agent P2P (giao tiếp ngang hàng) là gì?",
    options: [
      "5 kênh — mỗi agent 1 kênh",
      "C(5,2) = 10 kênh giao tiếp, mỗi vòng debate có thể gấp đôi số tin nhắn",
      "Không đáng kể",
      "25 kênh",
    ],
    correct: 1,
    explanation:
      "5 agent P2P có C(5,2) = 10 cặp = 10 kênh. Khi thêm agent thứ 6: 15 kênh. Tăng O(n²). Giải pháp: hub-and-spoke hoặc hierarchical — giảm về O(n).",
  },
  {
    question: "Shared memory (blackboard) trong multi-agent là gì?",
    options: [
      "1 file cấu hình chung",
      "Không gian nhớ mà mọi agent cùng đọc/ghi — agent mới vào có thể đọc lịch sử trao đổi thay vì gửi riêng cho từng agent",
      "1 database SQL",
      "Cache tạm thời trên GPU",
    ],
    correct: 1,
    explanation:
      "Blackboard pattern: 1 state chung (ví dụ: LangGraph state, CrewAI shared memory). Agent đọc state, xử lý, ghi lại. Tránh chuyện mỗi agent phải broadcast cho N−1 agent khác — đặc biệt hữu ích khi có nhiều hơn 5 agent.",
  },
  {
    question: "Nguy cơ lớn nhất của multi-agent so với single-agent là gì?",
    options: [
      "Không thể mở rộng",
      "Chi phí (token × số agent × số vòng) + thời gian chạy tăng + rủi ro 'tam sao thất bản' khi chuyển thông tin",
      "Kém chính xác trong mọi tình huống",
      "Không chạy được trên production",
    ],
    correct: 1,
    explanation:
      "Mỗi message giữa agent = thêm LLM call. 5 agent × 4 vòng = 20+ call. Thêm vào đó: error propagation (agent A diễn giải sai → agent B làm sai theo). Cần monitoring kỹ + fallback single-agent cho task đơn giản.",
  },
  {
    question: "LangGraph khác CrewAI ở điểm cốt lõi nào?",
    options: [
      "CrewAI nhanh hơn",
      "LangGraph là graph-based workflow (node + edge, có loop/conditional), CrewAI thiên về role-based (agent có role + goal, chạy tuần tự theo tasks)",
      "LangGraph không hỗ trợ multi-agent",
      "CrewAI không hỗ trợ tool use",
    ],
    correct: 1,
    explanation:
      "LangGraph: nghĩ workflow như state machine — node là hàm, edge là điều kiện, có thể loop. Mạnh về kiểm soát flow. CrewAI: nghĩ theo 'đội ngũ' — agent có role/goal/backstory, giao tasks theo kiểu manager. Pick-your-poison tuỳ tư duy thiết kế của team.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * Component chính — VisualizationSection mô phỏng orchestration.
 * ────────────────────────────────────────────────────────────── */
export default function MultiAgentTopic() {
  const [stepIdx, setStepIdx] = useState(0);
  const [running, setRunning] = useState(false);

  const step = SCRIPT[stepIdx];

  /* Lấy agent đang "hoạt động" theo bước hiện tại */
  const activeAgents = useMemo(() => {
    const set = new Set<AgentId>();
    if (step.kind === "send") {
      set.add(step.from);
      set.add(step.to);
    } else if (step.kind === "process") {
      set.add(step.who);
    }
    return set;
  }, [step]);

  const findAgent = useCallback(
    (id: AgentId) => AGENTS.find((a) => a.id === id)!,
    [],
  );

  const submitTask = useCallback(() => {
    setStepIdx(0);
    setRunning(true);
  }, []);

  const nextStep = useCallback(() => {
    setStepIdx((i) => Math.min(i + 1, SCRIPT.length - 1));
  }, []);

  const reset = useCallback(() => {
    setStepIdx(0);
    setRunning(false);
  }, []);

  /* Thống kê đã chạy được bao nhiêu message / process */
  const stats = useMemo(() => {
    const upTo = SCRIPT.slice(0, stepIdx + 1);
    return {
      sends: upTo.filter((s) => s.kind === "send").length,
      processes: upTo.filter((s) => s.kind === "process").length,
      isFinal: step.kind === "final",
    };
  }, [stepIdx, step]);

  return (
    <>
      {/* ── 1. DỰ ĐOÁN ────────────────────────────────────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn cần AI viết báo cáo kỹ thuật: tìm dữ liệu, viết code benchmark, soạn bài, kiểm duyệt. 1 Agent làm tất cả hay nhiều Agent chuyên biệt?"
          options={[
            "1 Agent — đơn giản hơn và nhanh hơn",
            "Nhiều Agent chuyên biệt — mỗi Agent giỏi 1 việc, phối hợp cho kết quả tốt hơn, giống đội ngũ sản xuất phim",
            "2 Agent — 1 làm, 1 kiểm tra là đủ",
          ]}
          correct={1}
          explanation="Mỗi Agent chuyên biệt (researcher, writer, coder, reviewer) giỏi hơn 1 Agent đa năng. Giống đội ngũ: đạo diễn phối hợp quay phim, diễn viên, biên kịch — kết quả tốt hơn 1 người làm tất cả."
        >
          <p className="text-sm text-muted mt-2">
            Bên dưới, bạn sẽ bấm &quot;Submit task&quot; để quan sát Coordinator
            phân rã nhiệm vụ và điều phối 2 specialist Researcher + Writer.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ── 2. KHÁM PHÁ ───────────────────────────────────────── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Orchestration với 3 agent
              </h3>
              <p className="text-sm text-muted">
                Coordinator nhận task, phân rã thành subtask rồi giao cho
                Researcher + Writer. Quan sát tin nhắn bay giữa các node, mỗi
                agent &quot;suy nghĩ&quot; riêng, và kết quả tổng hợp cuối cùng.
              </p>
            </div>

            {/* Nút điều khiển */}
            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={submitTask}
                disabled={running && stepIdx === 0}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {running ? "Đã bắt đầu" : "Submit task"}
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!running || stepIdx >= SCRIPT.length - 1}
                className="rounded-lg bg-card border border-border px-5 py-2 text-sm font-semibold text-foreground hover:border-accent/50 disabled:opacity-40"
              >
                Bước tiếp ({stepIdx + 1}/{SCRIPT.length})
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg bg-card border border-border px-5 py-2 text-sm font-semibold text-muted hover:text-foreground"
              >
                Bắt đầu lại
              </button>
            </div>

            {/* Canvas SVG chính */}
            <div className="rounded-xl bg-background/60 border border-border p-3">
              <svg
                viewBox="0 0 600 320"
                className="w-full max-w-2xl mx-auto block"
                role="img"
                aria-label="Sơ đồ 3 agent đang điều phối"
              >
                {/* Đường nối tĩnh giữa coordinator và các specialist */}
                {(["researcher", "writer"] as AgentId[]).map((id) => {
                  const a = findAgent(id);
                  const c = findAgent("coordinator");
                  return (
                    <line
                      key={`wire-${id}`}
                      x1={c.x}
                      y1={c.y}
                      x2={a.x}
                      y2={a.y}
                      stroke="#334155"
                      strokeWidth={1.5}
                      strokeDasharray="2,3"
                    />
                  );
                })}

                {/* Message bay khi step hiện tại là "send" */}
                {step.kind === "send" && (
                  <motion.circle
                    key={`msg-${stepIdx}`}
                    cx={findAgent(step.from).x}
                    cy={findAgent(step.from).y}
                    r={8}
                    fill="#facc15"
                    initial={{
                      cx: findAgent(step.from).x,
                      cy: findAgent(step.from).y,
                      opacity: 0,
                    }}
                    animate={{
                      cx: findAgent(step.to).x,
                      cy: findAgent(step.to).y,
                      opacity: [0, 1, 1, 0.6],
                    }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                )}

                {/* 3 node agent */}
                {AGENTS.map((a) => {
                  const isActive = activeAgents.has(a.id);
                  const isProcessing =
                    step.kind === "process" && step.who === a.id;
                  return (
                    <g key={a.id}>
                      {/* Vòng ngoài pulse khi đang process */}
                      {isProcessing && (
                        <motion.circle
                          cx={a.x}
                          cy={a.y}
                          r={46}
                          fill="none"
                          stroke={a.color}
                          strokeWidth={2}
                          initial={{ r: 46, opacity: 0.8 }}
                          animate={{ r: 64, opacity: 0 }}
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        />
                      )}
                      <motion.circle
                        cx={a.x}
                        cy={a.y}
                        r={42}
                        fill={isActive ? a.color : "#1e293b"}
                        stroke={a.color}
                        strokeWidth={isActive ? 3 : 2}
                        animate={{
                          scale: isActive ? 1.05 : 1,
                        }}
                        transition={{ duration: 0.25 }}
                      />
                      <text
                        x={a.x}
                        y={a.y - 4}
                        textAnchor="middle"
                        fontSize="20"
                      >
                        {a.icon}
                      </text>
                      <text
                        x={a.x}
                        y={a.y + 14}
                        textAnchor="middle"
                        fill={isActive ? "white" : a.color}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {a.label}
                      </text>
                      <text
                        x={a.x}
                        y={a.y + 58}
                        textAnchor="middle"
                        fill="var(--text-secondary)"
                        fontSize="11"
                      >
                        {a.role}
                      </text>
                    </g>
                  );
                })}

                {/* Badge hiển thị phase kiểu "SEND" / "PROCESS" */}
                <g>
                  <rect
                    x={20}
                    y={20}
                    width={110}
                    height={22}
                    rx={4}
                    fill={
                      step.kind === "send"
                        ? "#0ea5e9"
                        : step.kind === "process"
                          ? "#a855f7"
                          : "#22c55e"
                    }
                  />
                  <text x={75} y={35} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                    {step.kind === "send"
                      ? "MESSAGE"
                      : step.kind === "process"
                        ? "PROCESSING"
                        : "COMPLETED"}
                  </text>
                </g>
              </svg>
            </div>

            {/* Panel mô tả bước hiện tại */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Bước {stepIdx + 1}/{SCRIPT.length}</span>
                <span>·</span>
                <span>
                  {stats.sends} message · {stats.processes} phase xử lý
                </span>
              </div>
              {step.kind === "send" && (
                <div className="text-sm text-foreground">
                  <span
                    className="font-semibold"
                    style={{ color: findAgent(step.from).color }}
                  >
                    {findAgent(step.from).label}
                  </span>{" "}
                  → {" "}
                  <span
                    className="font-semibold"
                    style={{ color: findAgent(step.to).color }}
                  >
                    {findAgent(step.to).label}
                  </span>
                  <div className="mt-1 rounded-md bg-background/50 p-2 text-sm italic">
                    &quot;{step.text}&quot;
                  </div>
                </div>
              )}
              {step.kind === "process" && (
                <div className="text-sm text-foreground">
                  <span
                    className="font-semibold"
                    style={{ color: findAgent(step.who).color }}
                  >
                    {findAgent(step.who).label}
                  </span>{" "}
                  đang xử lý…
                  <div className="mt-1 rounded-md bg-background/50 p-2 text-sm">
                    {step.text}
                  </div>
                </div>
              )}
              {step.kind === "final" && (
                <div className="rounded-md bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-800 dark:text-green-300">
                  ✅ {step.text}
                </div>
              )}
            </div>

            {/* Thanh progress 3 bucket */}
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-sky-500/10 border border-sky-500/30 p-3">
                <div className="text-xs text-muted">Message</div>
                <div className="text-lg font-bold text-sky-800 dark:text-sky-300">{stats.sends}</div>
              </div>
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-3">
                <div className="text-xs text-muted">Phase xử lý</div>
                <div className="text-lg font-bold text-purple-800 dark:text-purple-300">
                  {stats.processes}
                </div>
              </div>
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                <div className="text-xs text-muted">Hoàn tất</div>
                <div className="text-lg font-bold text-green-800 dark:text-green-300">
                  {stats.isFinal ? "Yes" : "—"}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted">
              Lưu ý: số message tăng gần như tuyến tính với số agent trong
              hub-and-spoke. Ở pattern peer-to-peer (P2P), con số này là O(n²) —
              hãy ghi nhớ khi thiết kế hệ thống hơn 5 agent.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── 3. AHA ────────────────────────────────────────────── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <p>
            Multi-agent không chỉ là &quot;nhiều agent chạy song song&quot; — mà
            là <strong>chuyên môn hoá + kiểm chứng chéo</strong>. Coordinator
            phân rã, specialist làm sâu, và lỗi của agent này được agent khác
            phát hiện. Giống khoa học: không ai tự peer review bài mình.
            Orchestrator là &quot;lớp keo&quot; biến n agent rời rạc thành 1 hệ
            thống có kỷ luật.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── 4. THỬ THÁCH ──────────────────────────────────────── */}
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
          explanation="C(5,2) = 10 kênh giao tiếp. Với 20 agent = C(20,2) = 190 kênh! Giải pháp: mô hình phân cấp (coordinator) hoặc pub/sub (shared state) — giảm từ O(n²) xuống O(n)."
        />

        <InlineChallenge
          question="Trong hệ trên (3 agent, 8 message), nếu một LLM call tốn 2 giây và chạy tuần tự, tổng thời gian tối thiểu là bao nhiêu?"
          options={[
            "2 giây — chạy song song hết",
            "6 giây — 3 agent × 2 giây",
            "Khoảng 8 × 2 = 16 giây — mỗi message/phase là 1 LLM call độc lập",
            "Không tính được",
          ]}
          correct={2}
          explanation="Mỗi message + phase xử lý trong hub-and-spoke tuần tự = 1 LLM call. 8 bước × 2s ≈ 16s. Song song được chỉ khi 2 subtask độc lập (Researcher + Coder có thể chạy parallel). Latency là chi phí lớn của multi-agent — dùng parallel branches khi được phép."
        />
      </LessonSection>

      {/* ── 5. LÝ THUYẾT ──────────────────────────────────────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Hệ thống đa Agent</strong> (Multi-Agent System — MAS) sử
            dụng nhiều AI Agent chuyên biệt phối hợp để hoàn thành 1 nhiệm vụ.
            Mỗi agent có: (1) <em>role</em> — vai trò riêng, (2) <em>tools</em> —
            công cụ riêng, (3) <em>memory</em> — bộ nhớ local hoặc shared. Khác
            với 1 LLM đơn độc, multi-agent chia việc theo chuyên môn và cho phép
            kiểm chứng chéo.
          </p>

          <p>
            <strong>Ba topology phối hợp phổ biến</strong>:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Điều phối trung tâm (Hub-and-Spoke):</strong> 1 coordinator
              phân công và giám sát. Đơn giản, dễ debug. Đây chính là pattern
              chúng ta vừa mô phỏng phía trên. Nhược điểm: coordinator là nút
              cổ chai — nếu nó chậm hoặc bị hallucinate, cả hệ thống chịu.
            </li>
            <li>
              <strong>Ngang hàng (Peer-to-Peer):</strong> Agent giao tiếp trực
              tiếp. Linh hoạt nhưng phức tạp <LaTeX>{"O(n^2)"}</LaTeX>. Phù hợp
              debate pattern (2–3 agent tranh luận) hoặc swarm intelligence.
            </li>
            <li>
              <strong>Phân cấp (Hierarchical):</strong> Tổ chức theo cây.
              Coordinator → sub-coordinator → agents. Mở rộng tốt cho hệ thống
              10+ agent. Giống cơ cấu công ty: CEO → manager → staff.
            </li>
          </ul>

          <Callout variant="insight" title="4 pattern kinh điển của multi-agent">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Orchestrator</strong>: 1 coordinator phân rã + phân
                công (giống mẫu trên).
              </li>
              <li>
                <strong>Debate</strong>: 2 agent đối lập (proposer + critic)
                tranh luận → giảm hallucination.
              </li>
              <li>
                <strong>Reflection</strong>: 1 agent làm, 1 agent review và yêu
                cầu sửa đổi → cải thiện chất lượng output.
              </li>
              <li>
                <strong>Swarm</strong>: Nhiều agent đồng hạng, mỗi agent làm 1
                phần nhỏ + chia sẻ blackboard → khám phá không gian rộng.
              </li>
            </ul>
          </Callout>

          <Callout variant="warning" title="Chi phí coordination không rẻ">
            <p className="text-sm">
              Mỗi tin nhắn giữa agents = thêm API call + tokens. 5 agent × 5
              vòng giao tiếp = 25 LLM calls. Đảm bảo lợi ích chuyên môn hoá lớn
              hơn chi phí coordination. Tác vụ đơn giản: 1 agent đủ tốt. Một
              nguyên tắc thực nghiệm: nếu single-agent + chain-of-thought đã
              đạt 85% độ chính xác, việc nâng lên 92% bằng multi-agent có thể
              tốn 5–10× chi phí — tính kỹ ROI.
            </p>
          </Callout>

          <Callout variant="tip" title="Khi nào KHÔNG nên dùng multi-agent">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Task đơn giản, có thể giải bằng 1 prompt + 1 tool call.</li>
              <li>Latency quan trọng (chatbot realtime): mỗi message là 1 LLM call thêm.</li>
              <li>Budget hạn hẹp — token cost tăng tuyến tính theo số agent.</li>
              <li>
                Không có cơ chế guardrail tốt cho agent (risk escalation khi
                agent &quot;cãi&quot; nhau vô hạn).
              </li>
            </ul>
          </Callout>

          <Callout variant="info" title="State management — blackboard pattern">
            <p className="text-sm">
              Trong LangGraph, state là 1 dict được nhiều node cùng đọc/ghi.
              Trong CrewAI, shared memory lưu lịch sử công việc. Blackboard
              pattern giúp agent mới tham gia có thể đọc context thay vì phải
              được gửi riêng — nhưng phải cẩn thận race condition và versioning
              nếu agent chạy song song.
            </p>
          </Callout>

          <p className="mt-4">
            <strong>Hai framework phổ biến hiện nay</strong>: LangGraph (của
            LangChain) — workflow graph-based với state + node + edge, phù hợp
            khi bạn cần kiểm soát flow chi tiết + loop + conditional routing.
            CrewAI — role-based, trực quan hơn khi bạn nghĩ theo &quot;đội
            ngũ&quot;, agent có role/goal/backstory và coordinator gán tasks.
            Code bên dưới minh hoạ 2 style.
          </p>

          <CodeBlock language="python" title="multi_agent_crewai.py — CrewAI style">
{`from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, WebsiteSearchTool

# ─── Khai báo tools ──────────────────────────────────
search_tool   = SerperDevTool()
web_read_tool = WebsiteSearchTool()


# ─── 3 agent chuyên biệt ────────────────────────────
researcher = Agent(
    role="Senior Research Analyst",
    goal="Tìm 3 xu hướng LLM agent nổi bật năm 2026",
    backstory=(
        "Bạn là một analyst kỳ cựu chuyên theo dõi arXiv, "
        "blog của các lab AI lớn, và GitHub trending."
    ),
    tools=[search_tool, web_read_tool],
    verbose=True,
    allow_delegation=False,
)

writer = Agent(
    role="Technical Writer",
    goal="Viết báo cáo 300 từ chuyên nghiệp bằng Tiếng Việt",
    backstory=(
        "Bạn là một technical writer có 10 năm kinh nghiệm "
        "giải thích các khái niệm AI phức tạp cho cả developer và PM."
    ),
    verbose=True,
    allow_delegation=False,
)

reviewer = Agent(
    role="Quality Reviewer",
    goal="Kiểm tra tính chính xác và độ rõ ràng của báo cáo",
    backstory="Bạn là editor kỹ tính nhất công ty.",
    verbose=True,
)


# ─── Định nghĩa tasks với dependency ─────────────────
research_task = Task(
    description=(
        "Tìm 3 xu hướng LLM agent nổi bật năm 2026. "
        "Trả về JSON [{title, why_it_matters, source_url}]."
    ),
    expected_output="JSON array với 3 xu hướng kèm nguồn.",
    agent=researcher,
)

write_task = Task(
    description=(
        "Viết báo cáo 300 từ dựa trên research output. "
        "Giọng văn chuyên nghiệp, dùng ngôi thứ ba."
    ),
    expected_output="Báo cáo Markdown, khoảng 300 từ.",
    agent=writer,
    context=[research_task],   # phụ thuộc output của research
)

review_task = Task(
    description="Review báo cáo, chỉ ra lỗi hoặc điểm cần cải thiện.",
    expected_output="Danh sách feedback + bản sửa nếu cần.",
    agent=reviewer,
    context=[write_task],
)


# ─── Lập Crew + chạy ────────────────────────────────
crew = Crew(
    agents=[researcher, writer, reviewer],
    tasks=[research_task, write_task, review_task],
    process=Process.sequential,   # có thể đổi sang hierarchical
    verbose=2,
)

result = crew.kickoff(inputs={"topic": "AI Agents 2026"})
print(result)`}
          </CodeBlock>

          <p className="text-sm text-muted mt-2">
            CrewAI nhấn mạnh khía cạnh role-play: mỗi agent có một
            &quot;nhân vật&quot; rõ ràng (backstory, goal) giúp LLM giữ vai
            nhất quán. Tuy trừu tượng đẹp nhưng khi flow phức tạp với loop +
            conditional, LangGraph tự nhiên hơn.
          </p>

          <CodeBlock language="python" title="multi_agent_langgraph.py — LangGraph style">
{`from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI


# ─── Shared state (blackboard) ───────────────────────
class AgentState(TypedDict):
    task: str
    research: str | None
    draft: str | None
    review: str | None
    iterations: int


llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)


# ─── 3 node — mỗi node là 1 "agent" ─────────────────
def researcher_node(state: AgentState) -> AgentState:
    prompt = (
        f"Task: {state['task']}\\n"
        "Tìm 3 xu hướng LLM agent 2026, trả JSON."
    )
    resp = llm.invoke([HumanMessage(content=prompt)])
    return {**state, "research": resp.content}


def writer_node(state: AgentState) -> AgentState:
    feedback = state.get("review") or "(chưa có review)"
    prompt = (
        f"Viết báo cáo 300 từ dựa trên:\\n{state['research']}\\n"
        f"Phản hồi lần trước (nếu có): {feedback}"
    )
    resp = llm.invoke([HumanMessage(content=prompt)])
    return {
        **state,
        "draft": resp.content,
        "iterations": state.get("iterations", 0) + 1,
    }


def reviewer_node(state: AgentState) -> AgentState:
    prompt = (
        f"Review báo cáo:\\n{state['draft']}\\n"
        "Trả 'OK' nếu đạt, hoặc liệt kê điểm cần sửa."
    )
    resp = llm.invoke([HumanMessage(content=prompt)])
    return {**state, "review": resp.content}


# ─── Conditional edge — quyết định loop hay kết thúc ─
def route_after_review(state: AgentState) -> Literal["writer", "end"]:
    review = (state.get("review") or "").strip().upper()
    iters = state.get("iterations", 0)
    if review.startswith("OK") or iters >= 3:
        return "end"
    return "writer"   # loop lại nếu review không đạt


# ─── Xây graph ──────────────────────────────────────
graph = StateGraph(AgentState)
graph.add_node("researcher", researcher_node)
graph.add_node("writer",     writer_node)
graph.add_node("reviewer",   reviewer_node)

graph.set_entry_point("researcher")
graph.add_edge("researcher", "writer")
graph.add_edge("writer",     "reviewer")
graph.add_conditional_edges(
    "reviewer",
    route_after_review,
    {"writer": "writer", "end": END},
)

app = graph.compile()

# ─── Chạy ───────────────────────────────────────────
final = app.invoke({
    "task": "Viết báo cáo xu hướng LLM agent 2026",
    "research": None,
    "draft": None,
    "review": None,
    "iterations": 0,
})

print(final["draft"])`}
          </CodeBlock>

          <p className="text-sm text-muted mt-2">
            LangGraph đưa bạn gần với tư duy <em>state machine</em>: flow có
            thể loop (writer ↔ reviewer) đến khi reviewer OK hoặc đạt max
            iterations. Đây là điểm mạnh then chốt so với CrewAI &quot;tuần
            tự&quot; thuần.
          </p>

          <CollapsibleDetail title="Debate pattern — khi 2 agent phản biện giảm hallucination">
            <div className="space-y-2 text-sm text-muted">
              <p>
                <strong>Setup</strong>: Agent A (proposer) trả lời câu hỏi.
                Agent B (critic) đọc câu trả lời và tìm lỗi logic, thiếu sót,
                nguồn sai. Sau đó A phản hồi lại B. Lặp 2–3 vòng.
              </p>
              <p>
                <strong>Tại sao giảm hallucination</strong>: LLM có xu hướng
                đồng ý với câu lệnh. Khi bạn bắt 1 LLM đóng vai &quot;critic
                khắt khe&quot;, nó có mandate mới để tìm lỗi. Nhiều nghiên
                cứu (Du et al. 2023, Madaan et al. 2023) cho thấy debate +
                self-refine cải thiện 5–15% trên các benchmark reasoning.
              </p>
              <p>
                <strong>Lưu ý</strong>: Debate có thể rơi vào loop vô hạn nếu
                không có điều kiện dừng. Luôn có max_rounds hoặc điều kiện
                &quot;cả 2 đồng ý&quot; để kết thúc.
              </p>
            </div>
          </CollapsibleDetail>

          <p className="text-foreground mt-3">
            <strong>Self-reflection vs separate reviewer</strong> — một quyết
            định thiết kế thường gặp. Self-reflection (1 agent tự review) rẻ
            hơn, ít latency, nhưng thiên vị: LLM có xu hướng đánh giá tích cực
            với chính output của mình. Separate reviewer tốn 1 LLM call nữa
            nhưng cho perspective khác — đặc biệt hiệu quả khi reviewer dùng
            model khác writer (ví dụ writer = gpt-4o-mini, reviewer =
            claude-opus). &quot;Cross-model review&quot; giảm systematic bias.
            Rule of thumb: task consequence cao (code production, medical
            advice) → dùng separate reviewer; task nội dung (email, summary) →
            self-reflection đủ.
          </p>

          <p className="text-foreground mt-3">
            <strong>Agent memory — 3 tầng</strong>. Working memory: context
            hiện tại trong 1 lần chạy (thread). Episodic memory: lịch sử các
            task đã làm — lưu vector DB, retrieve khi task mới vào. Semantic
            memory: kiến thức trừu tượng rút ra (ví dụ &quot;công ty này ưu
            tiên phong cách formal&quot;). Multi-agent càng phức tạp càng cần
            phân biệt rõ: mỗi agent có working memory riêng, nhưng episodic +
            semantic nên share để đồng bộ hành vi.
          </p>

          <CollapsibleDetail title="Làm sao đánh giá chất lượng multi-agent system?">
            <div className="space-y-2 text-sm text-muted">
              <p>
                <strong>3 nhóm metric quan trọng</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>End-to-end quality</strong>: output cuối có đúng
                  không? Dùng LLM-as-judge hoặc human eval trên test set.
                </li>
                <li>
                  <strong>Efficiency</strong>: số LLM calls, tokens in/out,
                  latency, tỷ lệ cache hit. So với single-agent baseline.
                </li>
                <li>
                  <strong>Robustness</strong>: khi inject lỗi vào 1 agent,
                  reviewer có bắt được không? Test với adversarial input.
                </li>
              </ul>
              <p>
                <strong>Công cụ</strong>: LangSmith (LangChain), OpenAI Evals,
                RAGAS (cho agent có RAG). Luôn log mọi message giữa agents —
                debug multi-agent không có trace gần như bất khả thi.
              </p>
            </div>
          </CollapsibleDetail>

          <p className="text-foreground mt-4">
            <strong>So sánh nhanh CrewAI vs LangGraph</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-md">
              <thead className="bg-surface/60">
                <tr>
                  <th className="text-left p-2 border-b border-border">Tiêu chí</th>
                  <th className="text-left p-2 border-b border-border">CrewAI</th>
                  <th className="text-left p-2 border-b border-border">LangGraph</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border-b border-border font-medium">Paradigm</td>
                  <td className="p-2 border-b border-border">Role-based</td>
                  <td className="p-2 border-b border-border">Graph state machine</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-border font-medium">Học nhanh</td>
                  <td className="p-2 border-b border-border">✅ rất nhanh</td>
                  <td className="p-2 border-b border-border">Cần thời gian</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-border font-medium">Loop + conditional</td>
                  <td className="p-2 border-b border-border">Hạn chế</td>
                  <td className="p-2 border-b border-border">✅ native</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-border font-medium">Parallel branches</td>
                  <td className="p-2 border-b border-border">Khá</td>
                  <td className="p-2 border-b border-border">✅ tốt</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-border font-medium">Quan sát (tracing)</td>
                  <td className="p-2 border-b border-border">Tốt</td>
                  <td className="p-2 border-b border-border">✅ LangSmith</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Khi nào dùng?</td>
                  <td className="p-2">
                    Team nhỏ, task tuần tự kiểu &quot;viết báo cáo&quot;
                  </td>
                  <td className="p-2">
                    Flow phức tạp, cần loop, nhiều điều kiện rẽ nhánh
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-muted mt-3">
            Không có &quot;đúng&quot;/&quot;sai&quot; — cả 2 framework đều
            production-ready. Startup thường bắt đầu với CrewAI để prototype
            nhanh, rồi chuyển sang LangGraph khi flow đủ phức tạp cần kiểm soát.
            Một số team còn kết hợp: dùng LangGraph làm &quot;meta-orchestrator&quot;
            và CrewAI cho sub-crew bên trong.
          </p>

          <p className="text-foreground mt-4">
            <strong>Ví dụ case-study thực tế</strong>: một startup travel dùng
            5 agent để trả lời yêu cầu &quot;lên kế hoạch du lịch 5 ngày ở
            Đà Nẵng cho gia đình có 2 trẻ nhỏ&quot;:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>
              <strong>Intent Parser</strong> — đọc yêu cầu, trích xuất: điểm
              đến, thời lượng, số người, ràng buộc (&quot;trẻ nhỏ&quot;).
            </li>
            <li>
              <strong>Flight/Transport Agent</strong> — tra chuyến bay, thời
              gian, giá qua tool calls API Skyscanner.
            </li>
            <li>
              <strong>Hotel Agent</strong> — tìm khách sạn family-friendly, có
              hồ bơi, gần biển.
            </li>
            <li>
              <strong>Itinerary Agent</strong> — xếp lịch 5 ngày, tính
              drive-time giữa các điểm.
            </li>
            <li>
              <strong>Coordinator</strong> — tổng hợp thành itinerary, kiểm
              tra conflict (ví dụ: giờ check-in khách sạn &gt; giờ đáp máy bay).
            </li>
          </ol>
          <p className="text-sm text-muted">
            Kết quả: latency ~18s (so với 4s của single-agent), nhưng chất
            lượng lịch trình cao hơn hẳn — có link booking thật, thời gian
            hợp lý. Người dùng chấp nhận latency vì đây là task &quot;thi
            thoảng&quot; chứ không phải realtime chat.
          </p>

          <p className="text-foreground mt-4">
            <strong>Các nguyên tắc thiết kế MAS tốt</strong>:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>
              <strong>Single source of truth</strong>: 1 state dùng chung, tránh
              mỗi agent giữ bản copy riêng.
            </li>
            <li>
              <strong>Explicit contract</strong>: mỗi agent định nghĩa rõ
              input/output schema (JSON/Pydantic) — giảm ambiguity.
            </li>
            <li>
              <strong>Timeout + fallback</strong>: nếu 1 agent timeout, có
              strategy thay thế (dùng LLM mạnh hơn? escalate người dùng?).
            </li>
            <li>
              <strong>Stop condition</strong>: mọi loop phải có điều kiện dừng
              — max iterations, confidence threshold, hoặc human approval.
            </li>
            <li>
              <strong>Observability</strong>: log mọi message + trace chi phí.
              Không có logs = không debug được.
            </li>
          </ol>

          <p className="text-foreground mt-4">
            <strong>Công thức chi phí đơn giản cho multi-agent</strong>:
          </p>
          <LaTeX block>
            {"\\text{Cost} \\approx \\sum_{i=1}^{N} \\text{(token}_i \\times \\text{price}_i\\text{)} + \\text{latency overhead}"}
          </LaTeX>
          <p className="text-sm text-muted">
            Với <LaTeX>{"N"}</LaTeX> là tổng số LLM call (tính cả message lẫn
            processing step). Overhead coordination thường thêm 20–40% so với
            single-agent cho cùng chất lượng đầu ra. Nếu bài toán của bạn không
            cần chất lượng cao hơn đáng kể, single-agent + prompt engineering
            tốt vẫn là lựa chọn kinh tế hơn.
          </p>

          <p className="text-foreground mt-4">
            <strong>Lưu ý production</strong>: multi-agent đưa ra thách thức vận
            hành mới so với chatbot thường:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>Debugging</strong>: khi output cuối sai, lỗi ở agent nào?
              Cần tracing tool (LangSmith, Langfuse, Helicone) để xem message
              timeline.
            </li>
            <li>
              <strong>Retry logic</strong>: nếu 1 agent fail, retry cả chain
              hay chỉ agent đó? Cần checkpoint state (LangGraph có built-in).
            </li>
            <li>
              <strong>Cost cap</strong>: đặt hard limit token per request —
              debate loop có thể chạy vô hạn nếu quên stop condition.
            </li>
            <li>
              <strong>Prompt drift</strong>: khi 1 agent đổi prompt, downstream
              agent có thể hiểu sai format. Snapshot + version prompt.
            </li>
          </ul>

          <p className="text-sm text-muted mt-4">
            Tham khảo bài học liên quan:{" "}
            <TopicLink slug="agent-architecture">Agent architecture</TopicLink>,{" "}
            <TopicLink slug="orchestration">Orchestration patterns</TopicLink>,{" "}
            <TopicLink slug="agentic-workflows">Agentic workflows</TopicLink>.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ── 6. TÓM TẮT ─────────────────────────────────────────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="6 điều cần nhớ về Multi-Agent Systems"
          points={[
            "Nhiều Agent chuyên biệt (researcher + writer + reviewer) phối hợp > 1 agent đa năng cho bài toán phức tạp.",
            "3 topology chính: Hub-and-Spoke (đơn giản), Peer-to-Peer (O(n²) kênh, linh hoạt), Hierarchical (mở rộng tốt).",
            "4 pattern điển hình: Orchestrator (phân rã), Debate (phản biện), Reflection (tự sửa), Swarm (đồng hạng).",
            "Coordinator = bộ não: phân rã task, route tới specialist, validate, aggregate. Thiếu coordinator → hỗn loạn.",
            "Trade-off: chất lượng tốt hơn nhưng tốn token × latency × rủi ro error propagation. Tính ROI trước khi deploy.",
            "Framework: CrewAI (role-based, học nhanh) vs LangGraph (graph state machine, kiểm soát flow mạnh).",
          ]}
        />
      </LessonSection>

      {/* ── 7. QUIZ ────────────────────────────────────────────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>

      {/* ── 8. TỔNG KẾT ──────────────────────────────────────── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tổng kết">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <ProgressSteps current={8} total={8} />
            <span className="text-sm text-muted">
              Hoàn tất — bạn đã đi qua toàn bộ 8 bước.
            </span>
          </div>
          <p className="text-sm text-foreground">
            Multi-agent là bước tiến tự nhiên khi single-agent bị giới hạn: 1
            LLM không thể vừa làm web search, vừa viết code, vừa kiểm duyệt
            chất lượng tốt như 3 agent chuyên biệt phối hợp. Nhưng thiết kế
            đúng quan trọng hơn là số lượng agent — 3 agent được orchestrate
            tốt hơn 10 agent chồng chéo nhiệm vụ.
          </p>
          <ul className="text-sm text-muted list-disc list-inside space-y-1">
            <li>Nhận diện khi nào multi-agent thật sự đáng giá so với single-agent.</li>
            <li>Chọn topology (hub, P2P, hierarchical) phù hợp với quy mô.</li>
            <li>Hiểu 4 pattern: orchestrator, debate, reflection, swarm.</li>
            <li>Biết viết hệ thống đơn giản bằng CrewAI và LangGraph.</li>
            <li>Tự đánh giá được chi phí / chất lượng / độ phức tạp của hệ.</li>
          </ul>
          <p className="text-xs text-muted mt-2">
            Gợi ý bài tập: hãy thử viết 1 hệ 3 agent (researcher + writer +
            reviewer) bằng LangGraph, thêm loop writer ↔ reviewer với điều kiện
            dừng &quot;OK&quot; hoặc max 3 lần. Đo: tổng token, latency, tỉ lệ
            hoàn thành so với single-agent chain-of-thought. Con số sẽ cho bạn
            câu trả lời thực tế liệu multi-agent có đáng trong bài toán của bạn.
          </p>
        </div>
      </LessonSection>
    </>
  );
}
