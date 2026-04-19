"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
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
  relatedSlugs: [
    "function-calling",
    "planning",
    "memory-systems",
    "multi-agent",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 10;

// ───────────────────────────────────────────────────────────────────────────
// Data models for the interactive visualization
// ───────────────────────────────────────────────────────────────────────────

type ComponentId = "llm" | "memory-short" | "memory-long" | "tools" | "planning";

type PhaseId = "perceive" | "plan" | "act" | "reflect";

interface ComponentNode {
  id: ComponentId;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  color: string;
  role: string;
  analogy: string;
  bookFlightRole: string;
}

interface PhaseStep {
  id: PhaseId;
  label: string;
  color: string;
  description: string;
  active: ComponentId[];
  bookFlightExample: string;
  metrics: { name: string; value: string }[];
}

const COMPONENTS: ComponentNode[] = [
  {
    id: "llm",
    label: "LLM",
    sublabel: "Bộ não trung tâm",
    x: 320,
    y: 70,
    color: "#3b82f6",
    role: "Phân tích yêu cầu người dùng, suy luận từng bước, quyết định gọi công cụ nào và tổng hợp kết quả cuối cùng.",
    analogy:
      "Như vỏ não trước (prefrontal cortex) của con người — nơi diễn ra suy luận, ra quyết định và lập ngôn ngữ.",
    bookFlightRole:
      "Đọc câu lệnh 'Đặt vé TP.HCM → Tokyo ngày 2/5 dưới 15 triệu', hiểu ý định, chia nhỏ thành các yêu cầu con: tìm chuyến, so sánh giá, đặt chỗ, xuất vé.",
  },
  {
    id: "memory-short",
    label: "Bộ nhớ ngắn hạn",
    sublabel: "Context window + scratchpad",
    x: 110,
    y: 210,
    color: "#a855f7",
    role: "Lưu trữ thông tin trong phiên hiện tại: lịch sử hội thoại, kết quả tool call, ghi chú trung gian. Bị giới hạn bởi context window của LLM.",
    analogy:
      "Như bộ nhớ làm việc (working memory) — mảng nhớ tạm giúp bạn nhớ số điện thoại đủ lâu để quay.",
    bookFlightRole:
      "Giữ kết quả search chuyến bay (20 chuyến), thông tin thẻ tín dụng người dùng, trạng thái 'đã chọn chuyến B', các số tiền đang tính toán.",
  },
  {
    id: "memory-long",
    label: "Bộ nhớ dài hạn",
    sublabel: "Vector DB + profile store",
    x: 110,
    y: 320,
    color: "#7c3aed",
    role: "Lưu trữ vĩnh viễn: sở thích người dùng, các chuyến đi trước, kiến thức miền. Truy vấn qua embedding + semantic search.",
    analogy:
      "Như trí nhớ dài hạn — bạn vẫn nhớ lần đầu đi máy bay dù đã nhiều năm. Agent dùng vector DB để 'nhớ' xuyên qua nhiều phiên.",
    bookFlightRole:
      "Truy vấn hồ sơ: 'Người dùng thường bay Vietnam Airlines, thích ghế cạnh cửa sổ, tránh chuyến quá cảnh lâu hơn 4 giờ.' Nhờ đó Agent ưu tiên lọc phù hợp.",
  },
  {
    id: "tools",
    label: "Công cụ",
    sublabel: "APIs, DBs, code exec, browser",
    x: 530,
    y: 210,
    color: "#22c55e",
    role: "Các hành động Agent có thể thực hiện: gọi API, truy vấn DB, chạy code, duyệt web, gửi email. Mỗi tool có schema rõ ràng (tên, tham số, mô tả).",
    analogy:
      "Như đôi tay và giác quan — biến 'suy nghĩ' thành 'hành động' trong thế giới thực.",
    bookFlightRole:
      "search_flights(from='SGN', to='HND', date='2024-05-02'), compare_prices(ids=[...]), book_flight(id='VN-301', passenger={...}), send_confirmation_email().",
  },
  {
    id: "planning",
    label: "Lập kế hoạch",
    sublabel: "Task decomposition + reflection",
    x: 320,
    y: 320,
    color: "#f59e0b",
    role: "Chia bài toán lớn thành chuỗi bước nhỏ, giám sát tiến độ, phát hiện lệch hướng và điều chỉnh (replan) khi cần.",
    analogy:
      "Như người quản lý dự án — giữ bản kế hoạch, đánh dấu những gì đã xong, biết lúc nào phải đổi chiến thuật.",
    bookFlightRole:
      "Kế hoạch 4 bước: [1] Tìm chuyến phù hợp ngân sách → [2] So sánh giá + giờ bay → [3] Đặt chỗ → [4] Xuất email xác nhận. Nếu bước 1 không tìm được chuyến dưới 15tr, chuyển sang Plan B: hỏi người dùng có nới ngân sách không.",
  },
];

const PHASES: PhaseStep[] = [
  {
    id: "perceive",
    label: "Perceive",
    color: "#0ea5e9",
    description:
      "Agent nhận yêu cầu từ người dùng, môi trường hoặc kết quả tool trả về. Đây là giai đoạn 'nghe' và 'đọc'.",
    active: ["llm", "memory-short"],
    bookFlightExample:
      "Người dùng gõ: 'Đặt vé SGN → Tokyo ngày 2/5, dưới 15 triệu, thích Vietnam Airlines'. LLM parse ý định, lưu vào bộ nhớ ngắn hạn.",
    metrics: [
      { name: "Latency trung bình", value: "~80 ms" },
      { name: "Tokens tiêu thụ", value: "input tokens" },
      { name: "Nguy cơ sai sót", value: "Thấp — chỉ là đọc hiểu" },
      { name: "Thành phần chính", value: "LLM + Short-term memory" },
      { name: "Đầu ra", value: "Intent đã parse + entities" },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    color: "#f59e0b",
    description:
      "Agent tham chiếu bộ nhớ dài hạn (sở thích, lịch sử), chia nhiệm vụ thành các bước con, chọn công cụ phù hợp cho bước tiếp theo.",
    active: ["llm", "memory-long", "planning"],
    bookFlightExample:
      "Planning module xây chuỗi: search_flights → filter by price < 15M → rank by user_preference (Vietnam Airlines) → pick top 3 → ask_user_confirm.",
    metrics: [
      { name: "Latency trung bình", value: "~1.5–4 s" },
      { name: "Tokens tiêu thụ", value: "Nhiều (chain-of-thought)" },
      { name: "Nguy cơ sai sót", value: "Trung bình — kế hoạch có thể thiếu bước" },
      { name: "Thành phần chính", value: "LLM + Long-term memory + Planning" },
      { name: "Đầu ra", value: "Danh sách bước cụ thể (có tên tool)" },
    ],
  },
  {
    id: "act",
    label: "Act",
    color: "#22c55e",
    description:
      "Agent gọi công cụ đã chọn với tham số cụ thể. Kết quả trả về được lưu vào bộ nhớ ngắn hạn để dùng ở các bước sau.",
    active: ["llm", "tools", "memory-short"],
    bookFlightExample:
      "Agent gọi search_flights(from='SGN', to='HND', date='2024-05-02', max_price=15000000). API trả 18 chuyến, lưu vào scratchpad.",
    metrics: [
      { name: "Latency trung bình", value: "~200 ms – 5 s (tuỳ tool)" },
      { name: "Tokens tiêu thụ", value: "Ít (JSON call)" },
      { name: "Nguy cơ sai sót", value: "Cao — tool có thể fail, trả lỗi" },
      { name: "Thành phần chính", value: "LLM + Tools + Short-term memory" },
      { name: "Đầu ra", value: "Observation (kết quả tool)" },
    ],
  },
  {
    id: "reflect",
    label: "Reflect",
    color: "#ef4444",
    description:
      "Agent tự đánh giá kết quả: đã tiến bộ chưa? Có cần sửa kế hoạch? Lặp lại vòng hay kết thúc? Đây là 'vòng phản hồi' nâng cấp Agent lên mức tự chủ.",
    active: ["llm", "planning", "memory-long"],
    bookFlightExample:
      "Agent kiểm tra: '18 chuyến tìm được, 3 chuyến Vietnam Airlines giá <15M. Chất lượng đủ để đề xuất người dùng.' Nếu 0 chuyến, Agent quay lại Plan với ngân sách mới.",
    metrics: [
      { name: "Latency trung bình", value: "~800 ms – 2 s" },
      { name: "Tokens tiêu thụ", value: "Vừa (self-critique)" },
      { name: "Nguy cơ sai sót", value: "Nguồn gốc loop vô hạn nếu reflection sai" },
      { name: "Thành phần chính", value: "LLM + Planning + Long-term memory" },
      { name: "Đầu ra", value: "Quyết định: dừng / replan / tiếp tục Act" },
    ],
  },
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
      "Perceive → Plan → Act → Reflect → (Lặp lại cho đến khi hoàn thành)",
      "Lập kế hoạch → Thực hiện toàn bộ → Kết thúc",
      "Nhận lệnh → Chạy script → Trả kết quả",
    ],
    correct: 1,
    explanation:
      "Agent hiện đại hoạt động theo vòng lặp: Perceive (nhận thức) → Plan (lập kế hoạch) → Act (hành động) → Reflect (phản ánh) → lặp lại. Dừng khi nhiệm vụ hoàn thành hoặc đạt giới hạn bước.",
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
  {
    question: "Vai trò của bộ nhớ dài hạn (long-term memory) trong Agent?",
    options: [
      "Thay thế context window của LLM",
      "Giúp Agent nhớ sở thích người dùng và kiến thức xuyên phiên qua vector DB + semantic search",
      "Tăng tốc độ inference",
      "Chỉ dùng để log lỗi",
    ],
    correct: 1,
    explanation:
      "Long-term memory = lưu trữ vĩnh viễn, truy cập qua semantic search. Cho phép Agent 'nhớ' bạn thích Vietnam Airlines từ tháng trước, dù context window đã reset. Context window là short-term, vector DB là long-term.",
  },
  {
    question: "Một Agent đặt vé máy bay bị lỗi: liên tục gọi search_flights với cùng tham số 50 lần. Nguyên nhân gốc là gì?",
    options: [
      "LLM quá yếu",
      "Thiếu module Reflection — Agent không nhận ra kết quả đã có, vẫn lặp; cần self-critique + max_steps",
      "Tool API bị quá tải",
      "Bộ nhớ ngắn hạn tràn",
    ],
    correct: 1,
    explanation:
      "Đây là 'loop death' — thường do Reflection yếu hoặc thiếu. Agent phải tự hỏi: 'Đã tiến bộ chưa? Tool gọi lần này khác lần trước không?' Kết hợp max_steps (giới hạn) + reflection (đánh giá) giải quyết triệt để.",
  },
  {
    question: "Tại sao Tools được mô tả bằng JSON Schema?",
    options: [
      "Để giảm token",
      "Để LLM hiểu chính xác tên hàm, tham số, kiểu dữ liệu, và biết khi nào/gọi thế nào — chuẩn hoá giao diện giữa LLM và thế giới thực",
      "JSON bắt buộc bởi IEEE",
      "Không có lý do cụ thể",
    ],
    correct: 1,
    explanation:
      "JSON Schema là 'hợp đồng' giữa LLM và tool: tên hàm, mô tả, tham số, kiểu, ràng buộc. LLM đọc schema → biết tool này làm gì → sinh JSON hợp lệ để gọi. Đây là nền tảng của function calling.",
  },
  {
    question: "Planning module thêm giá trị gì ngoài việc 'chia nhỏ nhiệm vụ'?",
    options: [
      "Chỉ làm chậm hệ thống",
      "Giám sát tiến độ + phát hiện lệch hướng + replan khi bước thất bại — giúp Agent resilient với lỗi",
      "Thay thế LLM",
      "Tăng độ sáng tạo",
    ],
    correct: 1,
    explanation:
      "Planning không chỉ là 'chia bước'. Nó còn giữ state, so sánh tiến độ thực tế vs kế hoạch, và tự sửa kế hoạch khi môi trường thay đổi (tool fail, kết quả bất ngờ). Đây là khác biệt giữa agent cứng (brittle) và agent bền (robust).",
  },
  {
    type: "fill-blank",
    question:
      "Vòng lặp chuẩn của một AI Agent gồm bốn pha: {blank} (nhận thức), {blank} (lập kế hoạch), {blank} (hành động) và {blank} (phản ánh).",
    blanks: [
      { answer: "perceive", accept: ["perception", "nhận thức", "observe"] },
      { answer: "plan", accept: ["planning", "lập kế hoạch", "kế hoạch"] },
      { answer: "act", accept: ["action", "acting", "hành động"] },
      { answer: "reflect", accept: ["reflection", "phản ánh", "reflecting"] },
    ],
    explanation:
      "Perceive → Plan → Act → Reflect là vòng lặp cốt lõi. Khác 'Input → Output' của chatbot truyền thống, vòng lặp Agent cho phép tự chủ nhiều bước, phát hiện lỗi và điều chỉnh.",
  },
];

// ───────────────────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────────────────

export default function AgentArchitectureTopic() {
  const [selected, setSelected] = useState<ComponentId | null>("llm");
  const [activePhase, setActivePhase] = useState<PhaseId>("perceive");
  const [showLoop, setShowLoop] = useState(false);

  const selectedComponent = useMemo(
    () => COMPONENTS.find((c) => c.id === selected) ?? null,
    [selected],
  );

  const phase = useMemo(
    () => PHASES.find((p) => p.id === activePhase) ?? PHASES[0],
    [activePhase],
  );

  const isActive = useCallback(
    (id: ComponentId) => phase.active.includes(id),
    [phase],
  );

  const phaseIndex = PHASES.findIndex((p) => p.id === activePhase);

  const advancePhase = useCallback(() => {
    const next = PHASES[(phaseIndex + 1) % PHASES.length];
    setActivePhase(next.id);
  }, [phaseIndex]);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn muốn xây AI có thể: tìm vé máy bay, so sánh giá, đặt vé, và tự điều chỉnh khi chuyến bị đầy. Agent này cần tối thiểu bao nhiêu thành phần?"
          options={[
            "1 — chỉ cần LLM đủ mạnh là đủ",
            "4 — LLM (suy luận), Memory (nhớ), Tools (gọi API), Planning (điều phối) — giống con người có não, trí nhớ, đôi tay, và khả năng lập kế hoạch",
            "2 — LLM + kết nối API đã đủ dùng",
          ]}
          correct={1}
          explanation="Một AI Agent thật sự cần 4 thành phần cốt lõi: LLM (bộ não suy luận), Memory (bộ nhớ ngắn + dài hạn), Tools (hành động ra thế giới thực), Planning (chia bài toán + phản ánh). Thiếu bất kỳ thành phần nào Agent sẽ bị giới hạn nghiêm trọng trong các nhiệm vụ nhiều bước."
        >
          <p className="text-sm text-muted mt-2">
            Trong bài này, bạn sẽ mổ xẻ một Agent đang đặt vé máy bay — từng
            thành phần bật sáng theo đúng pha nó hoạt động.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Bên trong một Agent đặt vé máy bay
          </h3>
          <p className="text-sm text-muted mb-4">
            Nhấn vào từng thành phần để xem vai trò. Dùng thanh pha ở dưới để
            chạy vòng lặp Perceive → Plan → Act → Reflect.
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            {PHASES.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePhase(p.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activePhase === p.id
                    ? "text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={
                  activePhase === p.id
                    ? { backgroundColor: p.color }
                    : undefined
                }
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={advancePhase}
              className="rounded-lg px-4 py-2 text-sm font-semibold border border-border text-muted hover:text-foreground"
            >
              ▶ Tiếp
            </button>
            <button
              onClick={() => setShowLoop((v) => !v)}
              className="rounded-lg px-4 py-2 text-sm font-semibold border border-border text-muted hover:text-foreground"
            >
              {showLoop ? "Ẩn vòng lặp" : "Hiện vòng lặp"}
            </button>
          </div>

          <svg viewBox="0 0 650 400" className="w-full max-w-3xl mx-auto mb-4">
            <defs>
              <marker
                id="arrow-aa"
                markerWidth="10"
                markerHeight="8"
                refX="9"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 10 4, 0 8" fill="var(--text-tertiary)" />
              </marker>
              <marker
                id="arrow-aa-loop"
                markerWidth="10"
                markerHeight="8"
                refX="9"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 10 4, 0 8" fill={phase.color} />
              </marker>
            </defs>

            {/* Kết nối tĩnh giữa các thành phần */}
            <line
              x1={320}
              y1={100}
              x2={110}
              y2={195}
              stroke="var(--text-tertiary)"
              strokeWidth={2}
            />
            <line
              x1={320}
              y1={100}
              x2={530}
              y2={195}
              stroke="var(--text-tertiary)"
              strokeWidth={2}
            />
            <line
              x1={320}
              y1={100}
              x2={320}
              y2={295}
              stroke="var(--text-tertiary)"
              strokeWidth={2}
            />
            <line
              x1={110}
              y1={240}
              x2={110}
              y2={295}
              stroke="var(--text-tertiary)"
              strokeWidth={1.5}
              strokeDasharray="3,3"
            />
            <line
              x1={110}
              y1={320}
              x2={280}
              y2={320}
              stroke="var(--text-tertiary)"
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
            <line
              x1={530}
              y1={240}
              x2={360}
              y2={320}
              stroke="var(--text-tertiary)"
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />

            {/* Vòng lặp Agent tuỳ chọn */}
            {showLoop && (
              <>
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  d="M 565 150 C 620 150, 620 360, 380 360"
                  fill="none"
                  stroke={phase.color}
                  strokeWidth={2.5}
                  strokeDasharray="6,4"
                  markerEnd="url(#arrow-aa-loop)"
                />
                <text
                  x={615}
                  y={260}
                  fill={phase.color}
                  fontSize={11}
                  fontWeight={700}
                  transform="rotate(90, 615, 260)"
                >
                  Vòng lặp Agent
                </text>
              </>
            )}

            {/* Nút thành phần */}
            {COMPONENTS.map((c) => {
              const active = isActive(c.id);
              const isSelected = selected === c.id;
              return (
                <g
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className="cursor-pointer"
                >
                  <motion.rect
                    initial={false}
                    animate={{
                      scale: active ? 1.06 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 250, damping: 18 }}
                    x={c.x - 80}
                    y={c.y - 30}
                    width={160}
                    height={60}
                    rx={14}
                    fill={
                      isSelected || active ? c.color : "var(--bg-surface)"
                    }
                    stroke={c.color}
                    strokeWidth={isSelected ? 3.5 : 2}
                    opacity={active || isSelected ? 1 : 0.7}
                  />
                  <text
                    x={c.x}
                    y={c.y - 4}
                    textAnchor="middle"
                    fill={isSelected || active ? "white" : c.color}
                    fontSize={13}
                    fontWeight={700}
                  >
                    {c.label}
                  </text>
                  <text
                    x={c.x}
                    y={c.y + 14}
                    textAnchor="middle"
                    fill={isSelected || active ? "white" : "var(--text-muted)"}
                    fontSize={11}
                  >
                    {c.sublabel}
                  </text>
                  {active && (
                    <motion.circle
                      initial={{ r: 6, opacity: 0.8 }}
                      animate={{ r: 18, opacity: 0 }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      cx={c.x + 70}
                      cy={c.y - 22}
                      fill={c.color}
                    />
                  )}
                </g>
              );
            })}

            {/* Hiển thị thẻ 'Pha hiện tại' */}
            <rect
              x={20}
              y={10}
              width={160}
              height={40}
              rx={8}
              fill="var(--bg-surface)"
              stroke={phase.color}
              strokeWidth={2}
            />
            <text x={100} y={26} textAnchor="middle" fill={phase.color} fontSize={11} fontWeight={700}>
              Pha hiện tại
            </text>
            <text x={100} y={42} textAnchor="middle" fill={phase.color} fontSize={13} fontWeight={700}>
              {phase.label}
            </text>
          </svg>

          {/* Thẻ thông tin pha */}
          <div className="grid gap-3 md:grid-cols-2">
            <div
              className="rounded-lg border p-4"
              style={{ borderColor: phase.color, backgroundColor: `${phase.color}10` }}
            >
              <p className="text-sm font-semibold" style={{ color: phase.color }}>
                {phase.label} — {phase.description}
              </p>
              <p className="mt-2 text-xs text-muted">
                <strong>Ví dụ (đặt vé):</strong> {phase.bookFlightExample}
              </p>
              <div className="mt-3 space-y-1">
                {phase.metrics.map((m) => (
                  <p key={m.name} className="text-xs text-muted">
                    <span className="font-medium text-foreground">{m.name}:</span>{" "}
                    {m.value}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background/50 p-4">
              {selectedComponent ? (
                <>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: selectedComponent.color }}
                  >
                    {selectedComponent.label}
                  </p>
                  <p className="mt-1 text-xs text-muted font-medium">
                    {selectedComponent.sublabel}
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {selectedComponent.role}
                  </p>
                  <p className="mt-2 text-xs text-muted italic">
                    Ẩn dụ: {selectedComponent.analogy}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    <strong>Vai trong đặt vé:</strong>{" "}
                    {selectedComponent.bookFlightRole}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">
                  Chọn một thành phần trong sơ đồ để xem chi tiết.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <ProgressSteps
              current={phaseIndex + 1}
              total={PHASES.length}
              labels={PHASES.map((p) => p.label)}
            />
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          AI Agent không phải là LLM được bọc thêm API — nó là một{" "}
          <strong>hệ thống nhận thức-hành động</strong> có vòng lặp kiểu{" "}
          <TopicLink slug="react-framework">ReAct</TopicLink>: nhận thức → suy
          luận → hành động (qua{" "}
          <TopicLink slug="function-calling">function calling</TopicLink>) →
          quan sát → điều chỉnh. Khi có nhiều Agent cùng chạy, ta thêm một tầng{" "}
          <TopicLink slug="orchestration">điều phối</TopicLink>. Giống như con
          người giải quyết vấn đề: ta không chỉ <em>nghĩ</em>, mà còn{" "}
          <em>làm</em>, <em>nhìn kết quả</em> rồi <em>thay đổi cách làm</em>.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC 1 ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Agent được giao: 'Tìm 5 bài báo về AI, tóm tắt mỗi bài, gửi email tổng hợp cho sếp'. Những thành phần nào phải phối hợp?"
          options={[
            "Chỉ LLM và Tools",
            "Cả 4: LLM (suy luận), Planning (chia 3 bước), Tools (search + email), Memory (lưu kết quả trung gian giữa các bước)",
            "Chỉ Tools và Planning",
            "Chỉ LLM — đủ thông minh để tự làm",
          ]}
          correct={1}
          explanation="Planning chia 3 bước (search → summarize → email). Tools thực hiện search web và send email. LLM tóm tắt và suy luận. Memory lưu kết quả tìm kiếm để tổng hợp ở bước cuối. Thiếu Memory → Agent mất ngữ cảnh giữa các lần gọi tool."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Kiến trúc Agent</strong> hiện đại gồm 4 thành phần cốt lõi
            hoạt động trong vòng lặp liên tục, còn gọi là <em>agentic loop</em>.
            Mỗi thành phần có chức năng riêng biệt nhưng phải phối hợp chặt
            chẽ thông qua một giao thức chung (thường là JSON messages).
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>LLM (bộ não):</strong> Trung tâm suy luận. Nhận input từ
              người dùng + context từ bộ nhớ + kết quả từ công cụ → đưa ra
              quyết định tiếp theo. Thường là GPT-4, Claude, hay Gemini.
            </li>
            <li>
              <strong>Bộ nhớ:</strong> Chia hai tầng. Ngắn hạn là context
              window + scratchpad JSON. Dài hạn là vector DB (Pinecone,
              Weaviate, pgvector) truy cập qua{" "}
              <TopicLink slug="embedding-model">embedding</TopicLink>.
            </li>
            <li>
              <strong>Công cụ:</strong> Mở rộng khả năng hành động — search
              web, code execution, API calls, DB queries, trình duyệt, file
              system. Mô tả bằng JSON Schema để LLM biết cách gọi.
            </li>
            <li>
              <strong>Lập kế hoạch:</strong> Task decomposition + reflection +
              self-correction. Biến nhiệm vụ phức tạp thành chuỗi bước khả thi
              và giữ Agent đi đúng hướng.
            </li>
          </ul>

          <p>
            Mối liên hệ toán học giữa các thành phần có thể biểu diễn dạng
            state transition:
          </p>

          <LaTeX block>{`s_{t+1} = f(s_t, a_t, o_t)`}</LaTeX>

          <p>
            trong đó <LaTeX>s_t</LaTeX> là trạng thái Agent ở bước{" "}
            <LaTeX>t</LaTeX> (bao gồm memory), <LaTeX>a_t</LaTeX> là hành động
            (tool call) được LLM chọn, <LaTeX>o_t</LaTeX> là quan sát (kết quả
            tool), và <LaTeX>f</LaTeX> là hàm chuyển trạng thái của môi
            trường. Đây là hệ thống Markov Decision Process (MDP) quen thuộc
            trong{" "}
            <TopicLink slug="supervised-unsupervised-rl">
              Reinforcement Learning
            </TopicLink>
            .
          </p>

          <CodeBlock language="python" title="agent_architecture.py (LangGraph)">{`# Pseudocode dùng LangGraph để triển khai vòng lặp Agent 4 pha
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

class AgentState(TypedDict):
    """Trạng thái được chuyền qua các pha"""
    user_request: str
    plan: list[str]
    current_step: int
    tool_results: list[dict]
    long_term_memory: dict
    final_answer: str | None

llm = ChatOpenAI(model="gpt-4o", temperature=0)

@tool
def search_flights(origin: str, destination: str, date: str, max_price: int) -> list[dict]:
    """Tìm chuyến bay theo tuyến và ngân sách."""
    # Giả lập gọi API
    return [{"id": "VN-301", "price": 12000000, "airline": "VietnamAirlines"}]

@tool
def book_flight(flight_id: str, passenger: dict) -> dict:
    """Đặt vé và trả về mã xác nhận."""
    return {"confirmation": "ABC123", "flight_id": flight_id}

TOOLS = [search_flights, book_flight]

# ── Pha 1: Perceive ────────────────────────────────────────────────────────
def perceive(state: AgentState) -> AgentState:
    # Chuẩn hoá yêu cầu thô của người dùng thành intent rõ ràng.
    prompt = f"Parse intent và extract entities từ: {state['user_request']}"
    parsed = llm.invoke(prompt)
    state["user_request"] = parsed.content
    return state

# ── Pha 2: Plan ─────────────────────────────────────────────────────────────
def plan(state: AgentState) -> AgentState:
    # Tham chiếu long-term memory để cá nhân hoá
    prefs = state["long_term_memory"].get("flight_prefs", {})
    plan_prompt = (
        f"Tạo kế hoạch 3-5 bước để hoàn thành: {state['user_request']}. "
        f"Sở thích người dùng: {prefs}. "
        f"Công cụ khả dụng: {[t.name for t in TOOLS]}"
    )
    response = llm.invoke(plan_prompt)
    state["plan"] = response.content.split("\\n")
    state["current_step"] = 0
    return state

# ── Pha 3: Act ──────────────────────────────────────────────────────────────
def act(state: AgentState) -> AgentState:
    step = state["plan"][state["current_step"]]
    # LLM chọn tool + tham số, sau đó ta execute
    llm_with_tools = llm.bind_tools(TOOLS)
    tool_call = llm_with_tools.invoke(f"Thực hiện bước: {step}")

    for call in tool_call.tool_calls:
        matched = next(t for t in TOOLS if t.name == call["name"])
        result = matched.invoke(call["args"])
        state["tool_results"].append({"step": step, "result": result})

    state["current_step"] += 1
    return state

# ── Pha 4: Reflect ──────────────────────────────────────────────────────────
def reflect(state: AgentState) -> AgentState:
    recent = state["tool_results"][-1]
    critique_prompt = (
        f"Kết quả bước vừa rồi: {recent}. "
        f"Đã hoàn thành yêu cầu '{state['user_request']}' chưa? "
        "Nếu chưa, có cần thay đổi kế hoạch không?"
    )
    verdict = llm.invoke(critique_prompt)

    if "hoàn thành" in verdict.content.lower():
        state["final_answer"] = verdict.content
    return state

def route_next(state: AgentState) -> str:
    if state["final_answer"] is not None:
        return END
    if state["current_step"] >= len(state["plan"]):
        return "plan"  # Replan nếu hết bước mà chưa xong
    return "act"

# ── Lắp ráp đồ thị ──────────────────────────────────────────────────────────
graph = StateGraph(AgentState)
graph.add_node("perceive", perceive)
graph.add_node("plan", plan)
graph.add_node("act", act)
graph.add_node("reflect", reflect)

graph.set_entry_point("perceive")
graph.add_edge("perceive", "plan")
graph.add_edge("plan", "act")
graph.add_edge("act", "reflect")
graph.add_conditional_edges("reflect", route_next, {
    "act": "act",
    "plan": "plan",
    END: END,
})

agent = graph.compile()
result = agent.invoke({
    "user_request": "Đặt vé TP.HCM → Tokyo ngày 2/5, dưới 15 triệu",
    "plan": [],
    "current_step": 0,
    "tool_results": [],
    "long_term_memory": {"flight_prefs": {"airline": "VietnamAirlines"}},
    "final_answer": None,
})`}</CodeBlock>

          <Callout variant="info" title="Vì sao dùng LangGraph thay vì viết tay?">
            LangGraph đóng gói state machine, checkpointing, retry, và
            human-in-the-loop sẵn. Tự viết vòng lặp với <code>while True</code>{" "}
            dễ dẫn đến race conditions, khó resume khi gặp lỗi, và khó kiểm
            thử. Graph-based agent là chuẩn công nghiệp hiện nay.
          </Callout>

          <Callout variant="warning" title="Thách thức chính của Agent">
            Agent dễ rơi vào vòng lặp vô hạn, gọi sai công cụ, hoặc quên
            context giữa các bước. Các biện pháp bắt buộc: (1){" "}
            <code>max_steps</code> giới hạn vòng lặp; (2) Guardrails giới hạn
            hành động nguy hiểm; (3) Monitoring log từng bước để debug khi
            Agent đi chệch.
          </Callout>

          <CodeBlock language="python" title="agent_architecture_crewai.py (CrewAI — cách tiếp cận declarative)">{`# CrewAI cho bạn định nghĩa Agent ở mức cao hơn, không cần tự viết graph.
from crewai import Agent, Task, Crew, Process
from crewai.memory import ShortTermMemory, LongTermMemory
from crewai_tools import SerperDevTool

search_tool = SerperDevTool()

# ── Định nghĩa Agent ─────────────────────────────────────────────────────
flight_planner = Agent(
    role="Flight Planner",
    goal="Đặt vé máy bay đúng ngân sách và sở thích người dùng",
    backstory=(
        "Bạn là chuyên gia đặt vé với 10 năm kinh nghiệm. "
        "Ưu tiên chất lượng, giá, và sở thích người dùng trong thứ tự đó."
    ),
    tools=[search_tool],
    memory=True,
    short_term_memory=ShortTermMemory(),
    long_term_memory=LongTermMemory(),
    allow_delegation=False,
    verbose=True,
    max_iter=8,               # max_steps — chặn loop vô hạn
    max_rpm=20,               # rate limit API
)

# ── Định nghĩa Task ──────────────────────────────────────────────────────
book_task = Task(
    description=(
        "Tìm vé TP.HCM → Tokyo ngày 2/5, dưới 15 triệu, ưu tiên Vietnam Airlines. "
        "Nếu không tìm thấy, đề xuất 2 giải pháp thay thế."
    ),
    expected_output="Mã xác nhận đặt vé hoặc 2 giải pháp thay thế có giải thích.",
    agent=flight_planner,
    human_input=False,        # Bật True nếu muốn hỏi xác nhận
)

# ── Crew: khung Agent + Task ────────────────────────────────────────────
crew = Crew(
    agents=[flight_planner],
    tasks=[book_task],
    process=Process.sequential,
    memory=True,
    verbose=True,
)

result = crew.kickoff()
print(result)`}</CodeBlock>

          <CollapsibleDetail title="Tại sao LLM + Tool không đủ — vai trò thực của Memory">
            <p className="text-sm text-muted">
              Nhiều bài blog đơn giản hoá Agent thành &quot;LLM + Tool&quot;,
              nhưng khi Agent chạy nhiều bước, context window (khoảng 128K
              tokens) nhanh chóng đầy lên vì chứa: lịch sử hội thoại, mô tả
              tool, kết quả tool, suy luận CoT. Không có bộ nhớ dài hạn, Agent
              quên sở thích người dùng sau vài phiên. Không có scratchpad,
              Agent lặp lại công việc đã làm. Không có vector search, Agent
              không tìm lại được thông tin từ tuần trước.
            </p>
            <p className="mt-2 text-sm text-muted">
              Giải pháp chuẩn: tách <strong>working memory</strong> (scratchpad
              JSON trong khung chạy hiện tại), <strong>episodic memory</strong>{" "}
              (các phiên trước, lưu dạng chunk + embedding), và{" "}
              <strong>semantic memory</strong> (kiến thức nền, profile người
              dùng, domain facts). Mỗi loại dùng công cụ khác nhau để truy
              xuất — nên kiến trúc Agent thực sự là &quot;LLM + Tools +
              Memory(3 tầng) + Planning&quot;.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Agentic loop vs ReAct vs Plan-and-Execute">
            <p className="text-sm text-muted">
              <strong>ReAct</strong> (Reasoning + Acting, Yao et al. 2022) là
              biến thể đơn giản: mỗi bước Agent sinh một đoạn suy nghĩ
              (Thought) rồi một hành động (Action). Ưu điểm: minh bạch, dễ
              debug. Nhược: ra quyết định ngắn hạn, khó nhìn trước nhiều bước.
            </p>
            <p className="mt-2 text-sm text-muted">
              <strong>Plan-and-Execute</strong> (Wang et al. 2023) tách biệt
              pha lập kế hoạch (sinh toàn bộ kế hoạch trước) và pha thực thi
              (chạy từng bước). Ưu: kế hoạch ổn định, dễ optimise. Nhược: kế
              hoạch có thể lỗi thời khi môi trường thay đổi.
            </p>
            <p className="mt-2 text-sm text-muted">
              <strong>Agentic loop 4 pha (Perceive → Plan → Act → Reflect)</strong>{" "}
              mà bài này trình bày là tổng quát hoá: bạn có thể cấu hình độ
              dài mỗi pha, cho phép replan sau reflect, và kết hợp cả ReAct
              (ngắn hạn) lẫn Plan-and-Execute (dài hạn). Framework như
              LangGraph, CrewAI, AutoGen đều xây trên mẫu này.
            </p>
            <p className="mt-2 text-sm text-muted">
              Khi nào chọn cái nào? Bài toán <em>ngắn (≤5 bước, môi trường
              ổn định)</em> → ReAct là đủ và nhẹ. Bài toán <em>dài, cấu
              trúc rõ (research pipeline, ETL)</em> → Plan-and-Execute cho
              sự ổn định. Bài toán <em>động, có fail giữa chừng (customer
              support, trading)</em> → loop 4 pha với reflect mạnh để tự sửa.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Ba loại bộ nhớ Agent và công cụ tương ứng">
            <p className="text-sm text-muted">
              <strong>Working memory (scratchpad):</strong> một object JSON
              được chuyền qua các pha trong một phiên. Chứa plan hiện tại,
              tool results, ghi chú trung gian. Hết phiên là mất. Dùng trực
              tiếp trong context window.
            </p>
            <p className="mt-2 text-sm text-muted">
              <strong>Episodic memory:</strong> lịch sử các phiên trước được
              chunk hoá + embed, lưu vector DB (Pinecone, Weaviate,
              pgvector). Khi cần, Agent query theo semantic similarity để
              lấy các episode liên quan. Ví dụ: &quot;tháng trước user đặt
              vé đi Tokyo, đã thích chuyến sáng sớm&quot;.
            </p>
            <p className="mt-2 text-sm text-muted">
              <strong>Semantic memory:</strong> kiến thức nền (domain facts,
              profile người dùng, business rules). Có thể cấu trúc hoá
              (knowledge graph, SQL) hoặc dạng tài liệu (markdown, vector
              DB). Cập nhật chậm, đọc nhiều.
            </p>
            <p className="mt-2 text-sm text-muted">
              Thực tế, một Agent production thường có đủ cả 3: working
              memory trong state graph, episodic memory qua Pinecone,
              semantic memory qua Postgres + pgvector. Phần khó nhất là{" "}
              <em>memory routing</em> — quyết định nhớ/quên gì ở tầng nào.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chi phí & latency: con số thực tế">
            <p className="text-sm text-muted">
              Một Agent 4 pha trên GPT-4o, xử lý nhiệm vụ 5 bước, tiêu thụ
              trung bình khoảng 15K–40K tokens. Với giá 2024 (~$5/1M input,
              $15/1M output), một phiên hoàn thành tốn khoảng{" "}
              <strong>$0.15 – $0.40</strong>. Nhân lên 10K phiên/ngày = chi
              phí LLM $1.5K – $4K/ngày.
            </p>
            <p className="mt-2 text-sm text-muted">
              Latency: pha Plan (CoT) nặng nhất ~2–4s. Pha Act phụ thuộc
              tool (DB query ~100ms, web scrape ~2s, code sandbox ~5s).
              Tổng phiên 5 bước thường 15–40 giây. Kỹ thuật giảm:{" "}
              <TopicLink slug="kv-cache">KV cache</TopicLink>,{" "}
              streaming response, chạy song song các tool độc lập trong 1
              pha Act.
            </p>
            <p className="mt-2 text-sm text-muted">
              Tối ưu chi phí: dùng mô hình nhỏ (GPT-4o-mini, Claude Haiku)
              cho các bước đơn giản (parse, classify) và model lớn chỉ khi
              cần suy luận phức tạp. Kiến trúc &quot;cascade&quot; này có
              thể giảm 70–80% chi phí mà giữ chất lượng gần tương đương.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. CALLOUTS PHỤ ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Các điểm then chốt">
        <Callout variant="tip" title="Mẹo thiết kế tool cho Agent">
          Đặt tên tool bằng động từ rõ nghĩa (<code>search_flights</code> tốt
          hơn <code>tool1</code>). Viết docstring ngắn gọn nhưng đủ chi tiết
          để LLM hiểu KHI NÀO dùng. Giới hạn tham số (không nên quá 5). Trả
          về JSON có cấu trúc ổn định, tránh text tự do. Lý tưởng là mỗi
          tool chỉ làm <em>một việc duy nhất</em>, thay vì gộp nhiều hành
          vi vào một hàm khổng lồ — Agent dễ nhầm khi tool có quá nhiều
          nhánh.
        </Callout>

        <Callout variant="insight" title="Khung tư duy: Agent là nhân viên mới">
          Khi debug Agent, hãy hỏi: &quot;Nếu tôi là nhân viên mới, tài liệu
          công ty có đủ để tôi làm việc không?&quot;. Đó chính là chất lượng
          prompt + tool descriptions + memory mà bạn cung cấp. Agent tốt
          không phải LLM tốt — mà là tổ chức thông tin tốt quanh LLM. Bạn
          không sửa được não của LLM, nhưng sửa được môi trường thông tin
          xung quanh nó.
        </Callout>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {COMPONENTS.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border p-3"
              style={{ borderColor: `${c.color}55`, backgroundColor: `${c.color}0a` }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: c.color }}
              >
                {c.label}
              </p>
              <p className="mt-1 text-xs text-muted">{c.role}</p>
            </div>
          ))}
        </div>
      </LessonSection>

      {/* ━━━ 7. THÁCH THỨC 2 ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Agent đặt vé đã tìm được 3 chuyến phù hợp trong pha Act. Pha nào tiếp theo chịu trách nhiệm quyết định 'đề xuất cho user hay tìm thêm'?"
          options={[
            "Perceive — đọc lại yêu cầu gốc",
            "Reflect — đánh giá kết quả hiện tại và quyết định bước tiếp theo",
            "Plan — tạo kế hoạch mới từ đầu",
            "Act — gọi thêm tool nữa",
          ]}
          correct={1}
          explanation="Reflect là pha so sánh kết quả thực tế với mục tiêu. Tại đây Agent quyết định: kết quả đủ tốt → dừng và trả lời; kết quả chưa đủ → quay lại Plan với chiến lược mới; hoặc thực hiện thêm Act nếu chỉ thiếu một tool call đơn giản."
        />
      </LessonSection>

      {/* ━━━ 8. TÓM TẮT ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Agent Architecture"
          points={[
            "4 thành phần cốt lõi: LLM (bộ não suy luận), Memory (ngắn hạn context + dài hạn vector DB), Tools (API/code/DB — mô tả bằng JSON Schema), Planning (chia bước + reflection).",
            "Agent hoạt động theo vòng lặp 4 pha: Perceive (nhận thức) → Plan (lập kế hoạch) → Act (hành động) → Reflect (phản ánh) → lặp lại.",
            "Khác chatbot: Agent TỰ CHỦ thực hiện nhiều bước với môi trường thực, thay vì chỉ phản hồi 1 lượt hội thoại.",
            "Long-term memory qua vector DB cho phép Agent nhớ sở thích người dùng xuyên phiên; short-term dùng context window cho phiên hiện tại.",
            "Bẫy phổ biến: loop vô hạn, gọi sai tool, mất ngữ cảnh. Luôn có max_steps, guardrails, và logging từng bước.",
            "Framework chuẩn: LangGraph (graph-based, rõ state), CrewAI (declarative role/task), AutoGen (multi-agent chat) — chọn theo nhu cầu cụ thể.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 9. QUIZ ━━━ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>

      {/* ━━━ 10. HƯỚNG TIẾP THEO ━━━ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Đi tiếp">
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted">
          <p className="mb-2 font-semibold text-foreground">
            Bạn đã nắm kiến trúc tổng thể — bước tiếp theo:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Học cách Agent chọn tool qua{" "}
              <TopicLink slug="function-calling">function calling</TopicLink>.
            </li>
            <li>
              Đi sâu vào{" "}
              <TopicLink slug="planning">Planning</TopicLink> — chiến lược chia
              bài toán lớn.
            </li>
            <li>
              Khám phá{" "}
              <TopicLink slug="memory-systems">Memory Systems</TopicLink> với 3
              tầng: working, episodic, semantic.
            </li>
            <li>
              Xem các mẫu workflow ở{" "}
              <TopicLink slug="agentic-workflows">Agentic Workflows</TopicLink>.
            </li>
            <li>
              Khi có nhiều Agent, bạn sẽ cần{" "}
              <TopicLink slug="multi-agent">Multi-Agent</TopicLink> +{" "}
              <TopicLink slug="orchestration">Orchestration</TopicLink>.
            </li>
          </ul>

          <p className="mt-4 font-semibold text-foreground">
            Danh sách kiểm tra trước khi triển khai Agent lên production:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>Giới hạn bước:</strong> <code>max_iter</code> hoặc{" "}
              <code>recursion_limit</code> được set cụ thể, không để mặc định
              vô tận.
            </li>
            <li>
              <strong>Sandbox:</strong> mọi tool thực thi code phải chạy trong
              container cô lập (Docker, Firecracker, gVisor), không bao giờ
              chạy trực tiếp trên máy chủ chính.
            </li>
            <li>
              <strong>Allowlist:</strong> tool gọi API phải chỉ được phép truy
              cập domain đã whitelist, không mở rộng ra toàn bộ internet.
            </li>
            <li>
              <strong>Audit log:</strong> mỗi tool call + tham số + kết quả
              ghi vào log có thể truy vết — tối thiểu 30 ngày.
            </li>
            <li>
              <strong>Human-in-the-loop:</strong> các hành động không đảo
              ngược (send email, charge payment, delete file) phải chờ
              confirmation trước khi thực thi.
            </li>
            <li>
              <strong>Budget guard:</strong> theo dõi tổng token + tổng chi
              phí theo phiên. Tự ngắt khi vượt ngưỡng để tránh &quot;cost
              explosion&quot;.
            </li>
            <li>
              <strong>Test harness:</strong> viết test giả lập môi trường
              (mock tools) để Agent có thể được kiểm thử regression mỗi khi
              prompt hay model thay đổi.
            </li>
            <li>
              <strong>Observability:</strong> dùng LangSmith, Langfuse hoặc
              Arize — trực quan hoá graph run, xem token flow, đánh giá chất
              lượng qua LLM judge.
            </li>
          </ul>

          <p className="mt-4 font-semibold text-foreground">
            Case study nhỏ để luyện tập:
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>
              <strong>Personal research assistant:</strong> Agent nhận câu
              hỏi nghiên cứu, tự tìm 5 nguồn, tóm tắt, và xuất bản tóm tắt
              markdown. Cần: search tool, read tool, memory để tránh đọc
              trùng, reflection để đánh giá chất lượng tóm tắt.
            </li>
            <li>
              <strong>Helpdesk Agent:</strong> đọc ticket, phân loại,
              tham chiếu KB (vector DB), đề xuất giải pháp, chuyển ticket
              khó cho người thật. Cần: memory dài hạn (KB), memory ngắn hạn
              (ticket context), tool gọi CRM.
            </li>
            <li>
              <strong>Data analysis Agent:</strong> nhận câu hỏi dữ liệu, tự
              viết SQL, chạy, kiểm tra kết quả bất thường, vẽ biểu đồ. Cần:
              code execution tool (sandbox), vector DB schema, reflection
              để phát hiện bug SQL.
            </li>
          </ol>
        </div>
      </LessonSection>
    </>
  );
}
