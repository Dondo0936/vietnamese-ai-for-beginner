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
  slug: "agentic-workflows",
  title: "Agentic Workflows",
  titleVi: "Quy trình tự chủ — AI làm việc như con người",
  description:
    "Các mẫu thiết kế luồng công việc nơi AI Agent tự chủ thực hiện chuỗi tác vụ phức tạp với ít sự can thiệp.",
  category: "ai-agents",
  tags: ["workflow", "automation", "agent", "patterns"],
  difficulty: "advanced",
  relatedSlugs: [
    "agent-architecture",
    "planning",
    "multi-agent",
    "orchestration",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 10;

// ───────────────────────────────────────────────────────────────────────────
// Kiểu dữ liệu cho 5 pattern workflow
// ───────────────────────────────────────────────────────────────────────────

type PatternId =
  | "sequential"
  | "routing"
  | "parallelization"
  | "orchestrator-worker"
  | "evaluator-optimizer";

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  role: "input" | "llm" | "tool" | "router" | "worker" | "evaluator" | "output";
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  loop?: boolean;
  dashed?: boolean;
}

interface WorkflowPattern {
  id: PatternId;
  label: string;
  shortLabel: string;
  color: string;
  summary: string;
  whenToUse: string;
  latency: string;
  latencyScore: number; // 1-5 (1: chậm nhất, 5: nhanh nhất)
  quality: string;
  qualityScore: number; // 1-5
  cost: string;
  costScore: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
  realExample: string;
  pitfall: string;
}

const PATTERNS: WorkflowPattern[] = [
  // ──────────────────────────────────────────────────────────────
  // 1. SEQUENTIAL — prompt chaining thuần
  // ──────────────────────────────────────────────────────────────
  {
    id: "sequential",
    label: "Sequential (Prompt chaining)",
    shortLabel: "Sequential",
    color: "#3b82f6",
    summary:
      "Chuỗi các LLM call xếp tuần tự: output của bước trước là input của bước sau. Đơn giản nhất, dễ debug.",
    whenToUse:
      "Khi nhiệm vụ chia rõ thành các bước tuyến tính, mỗi bước phụ thuộc kết quả trước đó. Vd: dịch bài → tóm tắt → rút trích điểm chính.",
    latency: "Chậm (cộng dồn mọi bước)",
    latencyScore: 2,
    quality: "Trung bình (mỗi bước chuyên biệt)",
    qualityScore: 3,
    cost: "Thấp — mỗi bước ngắn",
    costScore: 4,
    nodes: [
      { id: "in", label: "Input", x: 60, y: 110, role: "input" },
      { id: "llm1", label: "LLM 1", x: 200, y: 110, role: "llm" },
      { id: "llm2", label: "LLM 2", x: 340, y: 110, role: "llm" },
      { id: "llm3", label: "LLM 3", x: 480, y: 110, role: "llm" },
      { id: "out", label: "Output", x: 620, y: 110, role: "output" },
    ],
    edges: [
      { from: "in", to: "llm1" },
      { from: "llm1", to: "llm2", label: "intermediate" },
      { from: "llm2", to: "llm3", label: "intermediate" },
      { from: "llm3", to: "out" },
    ],
    realExample:
      "Customer support: Bước 1 phân loại ticket → Bước 2 rút trích thông tin khách → Bước 3 sinh câu trả lời → Bước 4 kiểm tra giọng văn.",
    pitfall:
      "Lỗi một bước lan sang tất cả bước sau. Luôn thêm validation + fallback giữa các bước.",
  },

  // ──────────────────────────────────────────────────────────────
  // 2. ROUTING — classifier chọn handler
  // ──────────────────────────────────────────────────────────────
  {
    id: "routing",
    label: "Routing",
    shortLabel: "Routing",
    color: "#8b5cf6",
    summary:
      "Một LLM đọc input, phân loại, rồi gửi tới handler chuyên biệt. Mỗi handler được tối ưu cho 1 loại yêu cầu.",
    whenToUse:
      "Khi inputs có nhiều loại khác nhau, mỗi loại cần cách xử lý khác. Vd: refund / hỏi kỹ thuật / khiếu nại → 3 pipeline khác nhau.",
    latency: "Nhanh (chỉ 1 handler chạy)",
    latencyScore: 4,
    quality: "Cao — chuyên biệt hoá theo loại",
    qualityScore: 4,
    cost: "Thấp — thêm 1 LLM call phân loại",
    costScore: 4,
    nodes: [
      { id: "in", label: "Input", x: 60, y: 140, role: "input" },
      { id: "router", label: "Router (classifier)", x: 230, y: 140, role: "router" },
      { id: "a", label: "Handler A (refund)", x: 430, y: 60, role: "llm" },
      { id: "b", label: "Handler B (tech)", x: 430, y: 140, role: "llm" },
      { id: "c", label: "Handler C (complaint)", x: 430, y: 220, role: "llm" },
      { id: "out", label: "Output", x: 620, y: 140, role: "output" },
    ],
    edges: [
      { from: "in", to: "router" },
      { from: "router", to: "a", label: "loại 1" },
      { from: "router", to: "b", label: "loại 2" },
      { from: "router", to: "c", label: "loại 3" },
      { from: "a", to: "out" },
      { from: "b", to: "out" },
      { from: "c", to: "out" },
    ],
    realExample:
      "Trung tâm CSKH đa ngôn ngữ: Router phát hiện tiếng Việt/Anh/Nhật → đưa tới Handler tiếng tương ứng. Không ép 1 prompt đa ngôn ngữ xử lý tất cả.",
    pitfall:
      "Nếu classifier sai, yêu cầu đi nhầm handler và kết quả rất tệ. Cần xác suất confidence + fallback handler tổng quát.",
  },

  // ──────────────────────────────────────────────────────────────
  // 3. PARALLELIZATION — chạy song song để tăng tốc / voting
  // ──────────────────────────────────────────────────────────────
  {
    id: "parallelization",
    label: "Parallelization",
    shortLabel: "Parallel",
    color: "#22c55e",
    summary:
      "Nhiều LLM chạy song song trên cùng input (hoặc phần của input), rồi một aggregator tổng hợp. Hai biến thể: sectioning + voting.",
    whenToUse:
      "Khi task có thể chẻ nhỏ độc lập (vd: dịch 10 đoạn cùng lúc) hoặc khi cần nhiều góc nhìn (vd: 3 LLM đánh giá, lấy đa số).",
    latency: "Nhanh (song song)",
    latencyScore: 5,
    quality: "Cao (kết hợp nhiều view)",
    qualityScore: 4,
    cost: "Cao (gấp N lần LLM call)",
    costScore: 2,
    nodes: [
      { id: "in", label: "Input", x: 60, y: 140, role: "input" },
      { id: "split", label: "Splitter", x: 200, y: 140, role: "router" },
      { id: "w1", label: "Worker 1", x: 360, y: 60, role: "worker" },
      { id: "w2", label: "Worker 2", x: 360, y: 140, role: "worker" },
      { id: "w3", label: "Worker 3", x: 360, y: 220, role: "worker" },
      { id: "agg", label: "Aggregator", x: 520, y: 140, role: "llm" },
      { id: "out", label: "Output", x: 640, y: 140, role: "output" },
    ],
    edges: [
      { from: "in", to: "split" },
      { from: "split", to: "w1", label: "chunk 1" },
      { from: "split", to: "w2", label: "chunk 2" },
      { from: "split", to: "w3", label: "chunk 3" },
      { from: "w1", to: "agg" },
      { from: "w2", to: "agg" },
      { from: "w3", to: "agg" },
      { from: "agg", to: "out" },
    ],
    realExample:
      "Review code an toàn: 3 LLM chạy song song — một tìm SQL injection, một tìm XSS, một tìm logic bug. Aggregator gộp thành báo cáo duy nhất.",
    pitfall:
      "Chi phí nhân N. Nếu chỉ cần 1 kết quả duy nhất, cân nhắc cascade (chạy tuần tự từ model rẻ → đắt) thay vì chạy song song.",
  },

  // ──────────────────────────────────────────────────────────────
  // 4. ORCHESTRATOR-WORKER — coordinator phân công động
  // ──────────────────────────────────────────────────────────────
  {
    id: "orchestrator-worker",
    label: "Orchestrator-Worker",
    shortLabel: "Orchestrator",
    color: "#f59e0b",
    summary:
      "Một LLM orchestrator đọc task, chia thành subtask động (số lượng + nội dung được quyết định runtime), phân công cho worker, thu kết quả.",
    whenToUse:
      "Khi subtask không biết trước lúc viết code. Vd: code review trên một repo — số file thay đổi tuỳ PR, orchestrator quyết định worker nào đọc file nào.",
    latency: "Trung bình (orchestrator + worker chạy song song)",
    latencyScore: 3,
    quality: "Rất cao — linh hoạt theo bài toán",
    qualityScore: 5,
    cost: "Cao — orchestrator + N worker + có thể synthesis",
    costScore: 2,
    nodes: [
      { id: "in", label: "Task", x: 60, y: 140, role: "input" },
      { id: "orc", label: "Orchestrator", x: 220, y: 140, role: "llm" },
      { id: "w1", label: "Worker 1", x: 400, y: 60, role: "worker" },
      { id: "w2", label: "Worker 2", x: 400, y: 140, role: "worker" },
      { id: "w3", label: "Worker N", x: 400, y: 220, role: "worker" },
      { id: "synth", label: "Synthesizer", x: 560, y: 140, role: "llm" },
      { id: "out", label: "Final", x: 680, y: 140, role: "output" },
    ],
    edges: [
      { from: "in", to: "orc" },
      { from: "orc", to: "w1", label: "subtask 1" },
      { from: "orc", to: "w2", label: "subtask 2" },
      { from: "orc", to: "w3", label: "subtask N" },
      { from: "w1", to: "synth" },
      { from: "w2", to: "synth" },
      { from: "w3", to: "synth" },
      { from: "synth", to: "out" },
    ],
    realExample:
      "Multi-file code refactor: Orchestrator đọc yêu cầu 'đổi từ callback sang async/await trong repo', quét repo, quyết định mỗi worker refactor 1 file. Synthesizer gộp diff thành PR.",
    pitfall:
      "Orchestrator sai phân công → chuỗi worker chạy vô ích. Cần prompt rất kỹ + schema output rõ để giới hạn hành vi orchestrator.",
  },

  // ──────────────────────────────────────────────────────────────
  // 5. EVALUATOR-OPTIMIZER — generator + critic loop
  // ──────────────────────────────────────────────────────────────
  {
    id: "evaluator-optimizer",
    label: "Evaluator-Optimizer",
    shortLabel: "Eval-Opt",
    color: "#ef4444",
    summary:
      "Một LLM sinh output (optimizer/generator), một LLM khác đánh giá (evaluator) và đưa feedback. Lặp cho đến khi evaluator chấp nhận.",
    whenToUse:
      "Khi tiêu chí đánh giá rõ (có rubric), nhưng kết quả một lần khó đủ chất lượng. Vd: dịch văn học, viết code chạy được test, sinh code theo style guide.",
    latency: "Chậm (nhiều vòng loop)",
    latencyScore: 2,
    quality: "Rất cao (iterative refinement)",
    qualityScore: 5,
    cost: "Cao — mỗi vòng tốn 2 LLM call",
    costScore: 2,
    nodes: [
      { id: "in", label: "Input", x: 60, y: 140, role: "input" },
      { id: "gen", label: "Generator", x: 220, y: 140, role: "llm" },
      { id: "eval", label: "Evaluator", x: 400, y: 140, role: "evaluator" },
      { id: "out", label: "Output ✓", x: 560, y: 140, role: "output" },
    ],
    edges: [
      { from: "in", to: "gen" },
      { from: "gen", to: "eval", label: "draft" },
      { from: "eval", to: "out", label: "pass" },
      { from: "eval", to: "gen", label: "feedback", loop: true, dashed: true },
    ],
    realExample:
      "Dịch thuật văn học Việt–Nhật: Generator dịch một đoạn. Evaluator chấm theo 4 tiêu chí (chính xác nghĩa, tự nhiên, giữ sắc thái, ngữ pháp). Nếu điểm < 8/10, trả feedback cho Generator sửa. Dừng khi đạt ≥ 8 hoặc chạm max 3 vòng.",
    pitfall:
      "Evaluator yếu sẽ duyệt tất cả → workflow trở thành Sequential vô ích. Nếu evaluator quá nghiêm, generator mãi không pass. Calibrate rubric kỹ.",
  },
];

// ───────────────────────────────────────────────────────────────────────────
// Quiz
// ───────────────────────────────────────────────────────────────────────────

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Pattern nào phù hợp nhất khi bạn cần dịch 50 đoạn văn độc lập càng nhanh càng tốt?",
    options: [
      "Sequential — chuỗi xử lý",
      "Parallelization — chạy song song 50 bản dịch",
      "Evaluator-Optimizer — sửa dần qua vòng",
      "Orchestrator-Worker — phân công động",
    ],
    correct: 1,
    explanation:
      "Các đoạn văn độc lập ⇒ chẻ nhỏ và chạy song song giảm latency gần 50 lần (giới hạn bởi rate limit API). Sequential sẽ cộng dồn thời gian, Evaluator-Optimizer không phù hợp vì không có rubric phức tạp, Orchestrator-Worker dư thừa khi subtasks biết trước.",
  },
  {
    question:
      "Trong Evaluator-Optimizer, vì sao nên dùng 2 LLM khác nhau cho generator và evaluator?",
    options: [
      "Tiết kiệm chi phí",
      "Tránh bias: LLM tự chấm bài mình viết dễ bỏ qua lỗi — tách biệt vai trò tăng tính phản biện",
      "Để chạy song song",
      "Vì Open AI yêu cầu",
    ],
    correct: 1,
    explanation:
      "Self-evaluation có bias. Dùng model khác (hoặc cùng model nhưng prompt + persona khác) làm evaluator giúp phát hiện lỗi thật. Thực tế Anthropic cookbook khuyến nghị 2 model khác nhau khi có thể.",
  },
  {
    question:
      "Khác biệt cơ bản giữa Routing và Orchestrator-Worker là gì?",
    options: [
      "Routing chạy song song, Orchestrator chạy tuần tự",
      "Routing chọn 1 handler duy nhất (số phân nhánh cố định), Orchestrator tạo N subtask động tại runtime rồi phân cho worker",
      "Routing cần nhiều LLM hơn",
      "Không có khác biệt đáng kể",
    ],
    correct: 1,
    explanation:
      "Routing = if/else nâng cấp (1 nhánh trong N cố định). Orchestrator-Worker = kế hoạch động (N thay đổi tuỳ input, worker có thể tạo mới). Routing đơn giản, Orchestrator linh hoạt nhưng đắt và dễ sai.",
  },
  {
    question:
      "Pattern nào có quality cao nhất nhưng latency và cost cũng cao nhất?",
    options: [
      "Sequential",
      "Routing",
      "Evaluator-Optimizer — mỗi vòng tốn 2 LLM call, cần nhiều vòng để đạt chất lượng cao",
      "Parallelization",
    ],
    correct: 2,
    explanation:
      "Evaluator-Optimizer đổi thời gian + tiền lấy chất lượng. Mỗi vòng có 2 LLM call (gen + eval), chạy 2-5 vòng ⇒ 4-10 lần so với 1-shot. Chọn khi chất lượng quan trọng hơn cost/latency.",
  },
  {
    question:
      "Kết hợp Parallelization + Voting (3 LLM trả lời, lấy đa số) giải quyết vấn đề gì?",
    options: [
      "Giảm chi phí",
      "Giảm variance của output — nếu 2/3 model đồng ý, độ tin cậy cao hơn 1 model đơn",
      "Tăng tốc độ",
      "Không có lợi ích thực tế",
    ],
    correct: 1,
    explanation:
      "Voting giảm rủi ro hallucination: nếu 3 model độc lập đưa cùng kết quả, khả năng đúng tăng vọt. Dùng khi task có đáp án rõ (true/false, số, label) — không phù hợp cho text dài mở.",
  },
  {
    question:
      "Rủi ro lớn nhất của Orchestrator-Worker là gì?",
    options: [
      "Chi phí API",
      "Orchestrator tạo kế hoạch sai → worker làm việc vô ích, có thể lặp vô hạn nếu orchestrator tự gọi lại nó",
      "Worker không đủ thông minh",
      "Mạng chậm",
    ],
    correct: 1,
    explanation:
      "Orchestrator là single point of failure. Nếu nó phân công sai, cả workflow mất công. Cần: schema output chặt, max_depth khi orchestrator đệ quy, giám sát human trước các hành động tốn kém.",
  },
  {
    question:
      "Workflow Sequential có ưu điểm gì so với các pattern khác?",
    options: [
      "Nhanh nhất",
      "Dễ debug + dễ monitor: mỗi bước có input/output rõ ràng, lỗi xảy ra ở bước nào thấy ngay",
      "Chất lượng cao nhất",
      "Không có ưu điểm",
    ],
    correct: 1,
    explanation:
      "Sequential = chuỗi hàm xếp tuần tự. Bạn có thể log input/output mỗi bước, test từng bước độc lập, replay khi có lỗi. Đây là điểm mạnh công nghệ: khi không cần linh hoạt, đơn giản luôn thắng.",
  },
  {
    type: "fill-blank",
    question:
      "5 pattern workflow cốt lõi là: {blank} (chuỗi tuần tự), {blank} (classifier chọn nhánh), {blank} (chạy đồng thời), {blank}-worker (coordinator động) và evaluator-{blank} (loop sửa bài).",
    blanks: [
      { answer: "sequential", accept: ["tuần tự", "chaining"] },
      { answer: "routing", accept: ["định tuyến", "route"] },
      { answer: "parallelization", accept: ["parallel", "song song"] },
      { answer: "orchestrator", accept: ["điều phối"] },
      { answer: "optimizer", accept: ["generator", "tối ưu"] },
    ],
    explanation:
      "Đây là 5 mẫu Anthropic tổng kết trong 'Building Effective Agents' (Dec 2024). Nắm được 5 pattern này là đủ nền để thiết kế hầu hết các workflow production.",
  },
];

// ───────────────────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────────────────

export default function AgenticWorkflowsTopic() {
  const [activeId, setActiveId] = useState<PatternId>("sequential");
  const [animateFlow, setAnimateFlow] = useState(false);

  const pattern = useMemo(
    () => PATTERNS.find((p) => p.id === activeId) ?? PATTERNS[0],
    [activeId],
  );

  const nodesById = useMemo(() => {
    const m = new Map<string, FlowNode>();
    pattern.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [pattern]);

  const roleColor = useCallback(
    (role: FlowNode["role"]): string => {
      switch (role) {
        case "input":
          return "#64748b";
        case "output":
          return "#0ea5e9";
        case "router":
          return "#a855f7";
        case "worker":
          return "#22c55e";
        case "evaluator":
          return "#ef4444";
        case "tool":
          return "#f97316";
        case "llm":
        default:
          return pattern.color;
      }
    },
    [pattern.color],
  );

  const patternIndex = PATTERNS.findIndex((p) => p.id === activeId);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn phải thiết kế hệ thống CSKH đa ngôn ngữ: phân loại yêu cầu, xử lý 50 yêu cầu/phút, đảm bảo câu trả lời chất lượng cao. Dùng 1 workflow pattern có đủ không?"
          options={[
            "Đủ — dùng 1 LLM call mạnh là xử lý được hết",
            "Không đủ — cần kết hợp: Routing (phân loại), Parallelization (song song hoá), Evaluator-Optimizer (đảm bảo chất lượng) — mỗi pattern giải quyết 1 vấn đề riêng",
            "Chỉ cần 1 pattern Sequential tốt là xong",
          ]}
          correct={1}
          explanation="Các bài toán thực tế thường cần kết hợp nhiều pattern. Routing giải phân loại, Parallelization giải throughput, Evaluator-Optimizer giải chất lượng. Hiểu từng pattern giúp bạn ghép đúng khối — giống Lego cho AI system design."
        >
          <p className="text-sm text-muted mt-2">
            Bài này mở 5 pattern cốt lõi của Anthropic: Sequential, Routing,
            Parallelization, Orchestrator-Worker, Evaluator-Optimizer.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            5 mẫu workflow cốt lõi — so sánh latency & quality
          </h3>
          <p className="text-sm text-muted mb-4">
            Chọn 1 pattern để xem luồng thông điệp giữa các node và đánh giá
            trade-off.
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeId === p.id
                    ? "text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={activeId === p.id ? { backgroundColor: p.color } : undefined}
              >
                {p.shortLabel}
              </button>
            ))}
            <button
              onClick={() => setAnimateFlow((v) => !v)}
              className="rounded-lg px-4 py-2 text-sm font-semibold border border-border text-muted hover:text-foreground"
            >
              {animateFlow ? "Dừng animation" : "▶ Chạy luồng"}
            </button>
          </div>

          <svg viewBox="0 0 720 300" className="w-full max-w-4xl mx-auto mb-4">
            <defs>
              <marker
                id="arr-aw"
                markerWidth="10"
                markerHeight="8"
                refX="9"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 10 4, 0 8" fill="var(--text-tertiary)" />
              </marker>
              <marker
                id="arr-aw-active"
                markerWidth="10"
                markerHeight="8"
                refX="9"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 10 4, 0 8" fill={pattern.color} />
              </marker>
            </defs>

            {/* Edges */}
            {pattern.edges.map((e, idx) => {
              const from = nodesById.get(e.from);
              const to = nodesById.get(e.to);
              if (!from || !to) return null;

              if (e.loop) {
                return (
                  <g key={`edge-${idx}`}>
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{
                        pathLength: animateFlow ? [0, 1, 1] : 1,
                      }}
                      transition={{
                        duration: 2,
                        repeat: animateFlow ? Infinity : 0,
                        delay: idx * 0.2,
                      }}
                      d={`M ${from.x} ${from.y - 20} C ${from.x} ${from.y - 70}, ${to.x} ${to.y - 70}, ${to.x} ${to.y - 20}`}
                      fill="none"
                      stroke={pattern.color}
                      strokeWidth={2}
                      strokeDasharray={e.dashed ? "5,3" : undefined}
                      markerEnd="url(#arr-aw-active)"
                    />
                    {e.label && (
                      <text
                        x={(from.x + to.x) / 2}
                        y={from.y - 55}
                        textAnchor="middle"
                        fill={pattern.color}
                        fontSize={9}
                        fontWeight={600}
                      >
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              }

              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const ux = dx / dist;
              const uy = dy / dist;
              const pad = 42;
              const x1 = from.x + ux * pad;
              const y1 = from.y + uy * pad;
              const x2 = to.x - ux * pad;
              const y2 = to.y - uy * pad;

              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="var(--text-tertiary)"
                    strokeWidth={2}
                    markerEnd="url(#arr-aw)"
                  />
                  {e.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 6}
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize={8}
                    >
                      {e.label}
                    </text>
                  )}
                  {animateFlow && (
                    <motion.circle
                      r={5}
                      fill={pattern.color}
                      initial={{ cx: x1, cy: y1, opacity: 0 }}
                      animate={{
                        cx: [x1, x2],
                        cy: [y1, y2],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: idx * 0.25,
                        ease: "linear",
                      }}
                    />
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {pattern.nodes.map((n) => (
              <g key={n.id}>
                <rect
                  x={n.x - 50}
                  y={n.y - 20}
                  width={100}
                  height={40}
                  rx={10}
                  fill={roleColor(n.role)}
                  opacity={0.92}
                />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight={700}
                >
                  {n.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Thông tin pattern */}
          <div className="grid gap-3 md:grid-cols-2">
            <div
              className="rounded-lg border p-4"
              style={{ borderColor: pattern.color, backgroundColor: `${pattern.color}10` }}
            >
              <p className="text-sm font-semibold" style={{ color: pattern.color }}>
                {pattern.label}
              </p>
              <p className="mt-2 text-sm text-foreground">{pattern.summary}</p>
              <p className="mt-2 text-xs text-muted">
                <strong>Khi dùng:</strong> {pattern.whenToUse}
              </p>
              <p className="mt-2 text-xs text-muted">
                <strong>Ví dụ thực:</strong> {pattern.realExample}
              </p>
              <p className="mt-2 text-xs text-muted">
                <strong>Cạm bẫy:</strong> {pattern.pitfall}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="text-sm font-semibold text-foreground">
                Trade-off
              </p>
              <div className="mt-3 space-y-3 text-xs text-muted">
                <TradeoffBar
                  label="Latency"
                  score={pattern.latencyScore}
                  value={pattern.latency}
                  color="#0ea5e9"
                />
                <TradeoffBar
                  label="Quality"
                  score={pattern.qualityScore}
                  value={pattern.quality}
                  color="#22c55e"
                />
                <TradeoffBar
                  label="Cost"
                  score={pattern.costScore}
                  value={pattern.cost}
                  color="#f59e0b"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <ProgressSteps
              current={patternIndex + 1}
              total={PATTERNS.length}
              labels={PATTERNS.map((p) => p.shortLabel)}
            />
          </div>

          {/* Bảng so sánh tổng */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-semibold text-foreground">
                    Pattern
                  </th>
                  <th className="py-2 pr-3 font-semibold text-foreground">
                    Latency
                  </th>
                  <th className="py-2 pr-3 font-semibold text-foreground">
                    Quality
                  </th>
                  <th className="py-2 pr-3 font-semibold text-foreground">
                    Cost
                  </th>
                  <th className="py-2 pr-3 font-semibold text-foreground">
                    Chọn khi
                  </th>
                </tr>
              </thead>
              <tbody>
                {PATTERNS.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-border/60 ${
                      activeId === p.id ? "bg-card/60" : ""
                    }`}
                  >
                    <td className="py-2 pr-3 font-semibold" style={{ color: p.color }}>
                      {p.shortLabel}
                    </td>
                    <td className="py-2 pr-3 text-muted">{p.latency}</td>
                    <td className="py-2 pr-3 text-muted">{p.quality}</td>
                    <td className="py-2 pr-3 text-muted">{p.cost}</td>
                    <td className="py-2 pr-3 text-muted">{p.whenToUse.split(".")[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Agentic workflow không phải chạy LLM nhiều lần một cách bừa bãi —
          mà là <strong>kiến trúc có cấu trúc</strong> với những khối Lego
          được đặt tên rõ ràng: Sequential, Routing, Parallelization,
          Orchestrator-Worker, Evaluator-Optimizer. Mỗi khối giải quyết một
          loại vấn đề cụ thể (latency, throughput, phân loại, linh hoạt,
          chất lượng). Kỹ năng của kiến trúc sư AI là biết ghép khối nào cho
          bài toán nào — chứ không phải nhồi tất cả vào một prompt dài.
          Thực ra, càng ít pattern càng tốt: đơn giản luôn thắng.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC 1 ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Bạn xây Agent viết blog post chất lượng cao. Bản nháp 1 thường 6/10. Yêu cầu sản phẩm cuối ≥ 9/10. Chọn pattern nào?"
          options={[
            "Sequential — chuỗi xử lý",
            "Routing — phân loại chủ đề",
            "Evaluator-Optimizer — generator viết, evaluator chấm theo rubric, loop cho đến khi đạt 9/10",
            "Parallelization — 3 LLM viết song song",
          ]}
          correct={2}
          explanation="Evaluator-Optimizer là lựa chọn chính xác: bạn có rubric rõ (9/10) và cần chất lượng cao > tốc độ. Generator viết → Evaluator chấm + feedback → Generator sửa → lặp. Thường 2-3 vòng là đạt. Parallelization tốt cho số lượng nhưng không giải quyết chất lượng từng bài."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            Anthropic (Schluntz & Zhang, 2024) tổng kết 5 pattern cốt lõi cho
            production agentic systems trong bài &quot;Building Effective
            Agents&quot;. Mỗi pattern là một cấu hình LLM + control flow khác
            nhau — bạn có thể ghép chúng như Lego để xây hệ thống phức tạp.
            Dưới đây là 5 pattern + toán học đơn giản của trade-off:
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Sequential (Prompt chaining):</strong> chuỗi tuyến tính
              các LLM call. Đơn giản nhất, dễ debug, nhưng lỗi lan truyền.
            </li>
            <li>
              <strong>Routing:</strong> classifier chọn 1 trong N handler
              chuyên biệt. Tăng chất lượng bằng chuyên biệt hoá.
            </li>
            <li>
              <strong>Parallelization:</strong> N worker chạy đồng thời —
              sectioning (chẻ input) hoặc voting (gộp đa số).
            </li>
            <li>
              <strong>Orchestrator-Worker:</strong> coordinator LLM phân công
              động; worker chạy song song; synthesizer tổng hợp.
            </li>
            <li>
              <strong>Evaluator-Optimizer:</strong> generator + critic loop
              — dùng khi rubric rõ ràng và chất lượng quan trọng hơn chi phí.
            </li>
          </ul>

          <p>
            Gọi <LaTeX>T</LaTeX> là tổng thời gian, <LaTeX>N</LaTeX> là số
            bước, <LaTeX>t_i</LaTeX> là thời gian bước thứ{" "}
            <LaTeX>i</LaTeX>. Một số công thức gần đúng:
          </p>

          <LaTeX block>{`T_{\\text{seq}} = \\sum_{i=1}^{N} t_i`}</LaTeX>
          <LaTeX block>{`T_{\\text{par}} \\approx \\max_{i} t_i + t_{\\text{agg}}`}</LaTeX>
          <LaTeX block>{`T_{\\text{eval-opt}} \\approx k \\cdot (t_{\\text{gen}} + t_{\\text{eval}})`}</LaTeX>

          <p>
            trong đó <LaTeX>k</LaTeX> là số vòng loop (thường 2-5). Công thức
            cho thấy Parallelization gần tối ưu latency khi các bước độc lập,
            và Evaluator-Optimizer tốn nhân <LaTeX>k</LaTeX> lần chi phí đổi
            lấy chất lượng.
          </p>

          <CodeBlock language="python" title="workflows_langgraph.py (Sequential + Routing + Parallel)">{`# Triển khai 3 pattern cơ bản bằng LangGraph
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
import asyncio

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
llm_big = ChatOpenAI(model="gpt-4o", temperature=0)

# ────────────────────────────────────────────────────────────────
# 1. SEQUENTIAL: dịch → tóm tắt → rút keyword
# ────────────────────────────────────────────────────────────────
class SeqState(TypedDict):
    input_text: str
    translated: str
    summary: str
    keywords: list[str]

def translate(s: SeqState) -> SeqState:
    out = llm.invoke(f"Dịch sang tiếng Anh: {s['input_text']}")
    s["translated"] = out.content
    return s

def summarize(s: SeqState) -> SeqState:
    out = llm.invoke(f"Tóm tắt trong 2 câu: {s['translated']}")
    s["summary"] = out.content
    return s

def extract_keywords(s: SeqState) -> SeqState:
    out = llm.invoke(f"Trả về 5 keyword JSON: {s['summary']}")
    s["keywords"] = out.content.split(",")
    return s

seq_graph = StateGraph(SeqState)
seq_graph.add_node("translate", translate)
seq_graph.add_node("summarize", summarize)
seq_graph.add_node("keywords", extract_keywords)
seq_graph.set_entry_point("translate")
seq_graph.add_edge("translate", "summarize")
seq_graph.add_edge("summarize", "keywords")
seq_graph.add_edge("keywords", END)
seq_app = seq_graph.compile()

# ────────────────────────────────────────────────────────────────
# 2. ROUTING: phân loại ticket → handler tương ứng
# ────────────────────────────────────────────────────────────────
class RouteState(TypedDict):
    ticket: str
    category: Literal["refund", "tech", "complaint"]
    response: str

def classify(s: RouteState) -> RouteState:
    out = llm.invoke(
        f"Phân loại ticket vào 1 trong [refund, tech, complaint]: {s['ticket']}"
    )
    s["category"] = out.content.strip().lower()  # type: ignore
    return s

def handle_refund(s: RouteState) -> RouteState:
    s["response"] = llm.invoke(
        f"Bạn là chuyên viên refund. Trả lời: {s['ticket']}"
    ).content
    return s

def handle_tech(s: RouteState) -> RouteState:
    s["response"] = llm_big.invoke(
        f"Bạn là kỹ sư hỗ trợ. Trả lời ngắn gọn, chính xác: {s['ticket']}"
    ).content
    return s

def handle_complaint(s: RouteState) -> RouteState:
    s["response"] = llm.invoke(
        f"Bạn là chuyên viên lắng nghe. Xoa dịu + ghi nhận: {s['ticket']}"
    ).content
    return s

def route_next(s: RouteState) -> str:
    return f"handle_{s['category']}"

route_graph = StateGraph(RouteState)
route_graph.add_node("classify", classify)
route_graph.add_node("handle_refund", handle_refund)
route_graph.add_node("handle_tech", handle_tech)
route_graph.add_node("handle_complaint", handle_complaint)
route_graph.set_entry_point("classify")
route_graph.add_conditional_edges("classify", route_next, {
    "handle_refund": "handle_refund",
    "handle_tech": "handle_tech",
    "handle_complaint": "handle_complaint",
})
for handler in ["handle_refund", "handle_tech", "handle_complaint"]:
    route_graph.add_edge(handler, END)
route_app = route_graph.compile()

# ────────────────────────────────────────────────────────────────
# 3. PARALLELIZATION: 3 evaluator chạy song song, voting
# ────────────────────────────────────────────────────────────────
async def security_review(code: str) -> str:
    return await llm.ainvoke(
        f"Tìm lỗ hổng security trong code sau:\\n{code}"
    )

async def style_review(code: str) -> str:
    return await llm.ainvoke(
        f"Tìm lỗi style / readability trong:\\n{code}"
    )

async def perf_review(code: str) -> str:
    return await llm.ainvoke(
        f"Tìm lỗi performance / big-O trong:\\n{code}"
    )

async def parallel_review(code: str) -> dict:
    sec, sty, perf = await asyncio.gather(
        security_review(code),
        style_review(code),
        perf_review(code),
    )
    aggregate = llm_big.invoke(
        "Gộp 3 review thành 1 báo cáo thống nhất:\\n"
        f"Security: {sec}\\n"
        f"Style: {sty}\\n"
        f"Perf: {perf}"
    )
    return {"final_report": aggregate.content}

# result = asyncio.run(parallel_review(code_to_review))
`}</CodeBlock>

          <Callout variant="info" title="Vì sao LangGraph hợp với workflow?">
            LangGraph mô hình hoá workflow dưới dạng đồ thị có hướng với
            state được chia sẻ. Mỗi node là một hàm (hoặc LLM call), edge là
            luật chuyển tiếp. Bạn có được: checkpoint, resume, streaming,
            human-in-the-loop miễn phí. So với tự viết <code>while True</code>{" "}
            loop, LangGraph giảm bug race condition và dễ kiểm thử.
          </Callout>

          <CodeBlock language="python" title="workflows_crewai.py (Orchestrator-Worker + Evaluator-Optimizer)">{`# CrewAI cho bạn declarative agents — hợp với Orchestrator-Worker
from crewai import Agent, Task, Crew, Process

# ────────────────────────────────────────────────────────────────
# ORCHESTRATOR-WORKER: code refactor đa file
# ────────────────────────────────────────────────────────────────
orchestrator = Agent(
    role="Lead Engineer",
    goal="Phân công refactor cho đội ngũ junior theo cấu trúc repo",
    backstory="Kinh nghiệm 10 năm scale Python codebase.",
    allow_delegation=True,     # Cho phép orchestrator giao việc
    verbose=True,
)

worker_a = Agent(
    role="Junior A",
    goal="Refactor các file được giao từ callback sang async/await",
    backstory="Mới vào, cần hướng dẫn rõ ràng.",
    allow_delegation=False,
    verbose=True,
)

worker_b = Agent(
    role="Junior B",
    goal="Viết test cho code đã refactor",
    backstory="Chuyên pytest + async testing.",
    allow_delegation=False,
    verbose=True,
)

orchestrate_task = Task(
    description=(
        "Xem repo, liệt kê 10 file cần refactor, chia đều cho Junior A. "
        "Sau đó yêu cầu Junior B viết test. Báo cáo progress sau mỗi file."
    ),
    expected_output="PR với diff refactor + test pass toàn bộ.",
    agent=orchestrator,
)

refactor_crew = Crew(
    agents=[orchestrator, worker_a, worker_b],
    tasks=[orchestrate_task],
    process=Process.hierarchical,    # Orchestrator điều phối
    verbose=True,
)

# ────────────────────────────────────────────────────────────────
# EVALUATOR-OPTIMIZER: dịch văn học có rubric
# ────────────────────────────────────────────────────────────────
translator = Agent(
    role="Literary Translator",
    goal="Dịch truyện ngắn Việt → Nhật giữ được sắc thái",
    backstory="Từng dịch Murakami sang tiếng Việt và ngược lại.",
    verbose=True,
)

critic = Agent(
    role="Editor-in-Chief",
    goal="Chấm bản dịch theo 4 tiêu chí, trả feedback cụ thể",
    backstory=(
        "Tiêu chí: (1) chính xác nghĩa, (2) tự nhiên, "
        "(3) giữ giọng tác giả, (4) ngữ pháp. Chấm 1-10 mỗi mục."
    ),
    verbose=True,
)

translate_task = Task(
    description="Dịch đoạn văn sang tiếng Nhật: {source_text}",
    expected_output="Bản dịch tiếng Nhật.",
    agent=translator,
)

review_task = Task(
    description=(
        "Chấm bản dịch của Translator. Nếu có tiêu chí < 8/10, "
        "trả feedback cụ thể để Translator sửa. Dừng khi tất cả ≥ 8."
    ),
    expected_output="JSON có 'scores' và 'feedback' hoặc 'approved': true",
    agent=critic,
    context=[translate_task],
)

eval_opt_crew = Crew(
    agents=[translator, critic],
    tasks=[translate_task, review_task],
    process=Process.sequential,
    max_rpm=30,
)

# result = eval_opt_crew.kickoff(inputs={"source_text": "..."})
`}</CodeBlock>

          <Callout variant="warning" title="Đừng dùng framework khi chưa cần">
            Anthropic lưu ý: nhiều dự án thành công chỉ dùng LLM API trực
            tiếp, không cần LangGraph/CrewAI. Framework thêm trừu tượng,
            đôi khi che giấu bug. Bắt đầu với vài dòng Python + API call; chỉ
            chuyển sang framework khi số pattern &gt; 3 hoặc cần state
            management phức tạp.
          </Callout>

          <CollapsibleDetail title="Khi nào NÊN dùng Agent (autonomy) thay vì Workflow (fixed)?">
            <p className="text-sm text-muted">
              Anthropic phân biệt rạch ròi 2 khái niệm. <strong>Workflow</strong>{" "}
              là khi bạn viết sẵn đồ thị: input chạy theo đường đã biết.{" "}
              <strong>Agent</strong> là khi LLM tự quyết định bước tiếp
              (thông qua{" "}
              <TopicLink slug="function-calling">function calling</TopicLink>).
            </p>
            <p className="mt-2 text-sm text-muted">
              Khi nào chọn Agent? (1) Không biết trước số bước — bài toán
              quá mở. (2) Môi trường động — API lỗi, tool trả kết quả bất
              ngờ. (3) Cần khả năng tự sửa. Các case còn lại: Workflow ổn
              định, dễ debug, rẻ hơn nhiều.
            </p>
            <p className="mt-2 text-sm text-muted">
              Quy tắc ngón tay: <strong>bắt đầu với Workflow</strong>. Chỉ
              upgrade lên Agent khi gặp trường hợp Workflow không xử lý nổi.
              Đa số production system thành công là Workflow được thiết kế
              kỹ, không phải Agent &quot;thông minh&quot;.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Ghép nhiều pattern: ví dụ thực tế">
            <p className="text-sm text-muted">
              Một &quot;customer support copilot&quot; production thường
              gồm:
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-muted">
              <li>
                <strong>Routing</strong> ở cửa: phân loại ticket thành 5
                category.
              </li>
              <li>
                Trong nhánh &quot;technical&quot;, dùng{" "}
                <strong>Sequential</strong>: retrieve context → generate
                answer → redact PII.
              </li>
              <li>
                Trong nhánh &quot;complaint&quot;, dùng{" "}
                <strong>Evaluator-Optimizer</strong>: generate → score tone
                + empathy → refine cho đến khi tone đủ nhẹ.
              </li>
              <li>
                <strong>Parallelization</strong> ở bước redact: 2 LLM chạy
                song song, 1 phát hiện PII, 1 phát hiện từ nhạy cảm, aggregate
                bằng union.
              </li>
              <li>
                <strong>Orchestrator-Worker</strong> ở tính năng
                &quot;escalate&quot;: orchestrator phân công cho các agent
                chuyên (billing, shipping, legal) rồi synthesize response.
              </li>
            </ol>
            <p className="mt-2 text-sm text-muted">
              Không một pattern nào giải quyết hết — nhưng 5 khối Lego ghép
              lại đủ phủ 90%+ các use case thực tế.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. CALLOUTS PHỤ ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Các điểm then chốt">
        <Callout variant="tip" title="Checklist chọn pattern">
          Hỏi lần lượt: (1) Bước có biết trước không? — Không → Orchestrator
          hoặc Agent. Có → tiếp. (2) Có rẽ nhánh theo loại input không? — Có
          → Routing. (3) Các bước có độc lập không? — Có → Parallel. (4)
          Chất lượng cần cao hơn one-shot? — Có → Eval-Opt. Còn lại →
          Sequential.
        </Callout>

        <Callout variant="insight" title="Quan sát từ production">
          Đội engineering tại Anthropic, OpenAI, và các startup AI
          mainstream đều báo cáo: workflow tốt nhất là workflow ít khối
          nhất. Mỗi khối thêm vào là 1 điểm fail mới, 1 nguồn latency mới.
          Nguyên tắc Occam: khi 2 workflow cho kết quả tương đương, chọn
          cái đơn giản hơn. Đơn giản là tính năng.
        </Callout>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PATTERNS.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border p-3"
              style={{ borderColor: `${p.color}55`, backgroundColor: `${p.color}0a` }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: p.color }}
              >
                {p.shortLabel}
              </p>
              <p className="mt-1 text-xs text-muted">{p.summary}</p>
            </div>
          ))}
        </div>
      </LessonSection>

      {/* ━━━ 7. THÁCH THỨC 2 ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Startup của bạn cần review 10.000 đơn bảo hiểm/ngày. Mỗi đơn có 5 mục cần kiểm tra độc lập. Chất lượng > tốc độ nhưng chi phí có hạn. Chọn kết hợp pattern nào?"
          options={[
            "Chỉ Sequential — đơn giản",
            "Routing → Parallelization (chia 5 mục chạy song song) → Aggregator; nếu điểm risk cao thì thêm Evaluator-Optimizer để review kỹ",
            "Evaluator-Optimizer cho tất cả — chất lượng tối đa",
            "Orchestrator-Worker cho mọi đơn",
          ]}
          correct={1}
          explanation="Giải pháp thực tế: Routing đẩy các đơn &quot;đơn giản&quot; (risk thấp) đi Parallelization nhanh + rẻ; các đơn &quot;khó&quot; mới đi Evaluator-Optimizer. Đây là kiến trúc cascade thường thấy ở production — giữ cost thấp mà vẫn có chất lượng cao cho case khó."
        />
      </LessonSection>

      {/* ━━━ 8. TÓM TẮT ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Agentic Workflows"
          points={[
            "5 pattern cốt lõi: Sequential (chuỗi), Routing (classifier), Parallelization (song song), Orchestrator-Worker (phân công động), Evaluator-Optimizer (gen + critic loop).",
            "Trade-off chính: latency vs quality vs cost. Parallel tối ưu latency, Eval-Opt tối ưu quality, Sequential tối ưu cost.",
            "Workflow = đồ thị cố định (dễ debug, rẻ). Agent = LLM tự chọn bước (linh hoạt, đắt). Bắt đầu với Workflow, upgrade lên Agent khi cần.",
            "Kết hợp pattern như Lego: Routing + Parallel + Eval-Opt là cấu hình production phổ biến cho customer support / analysis pipeline.",
            "Framework (LangGraph, CrewAI) giúp nhưng không bắt buộc — vài dòng Python + API call đủ cho dự án nhỏ, framework cần khi state phức tạp.",
            "Nguyên tắc: đơn giản là tính năng. Workflow ít khối nhất giải quyết được bài toán là workflow thắng.",
          ]}
        />
      </LessonSection>

      {/* ━━━ 9. QUIZ ━━━ */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>

      {/* ━━━ 10. ĐI TIẾP ━━━ */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Đi tiếp">
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted">
          <p className="mb-2 font-semibold text-foreground">
            Đã nắm 5 pattern — bước tiếp theo:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Hiểu kiến trúc bên trong mỗi Agent —{" "}
              <TopicLink slug="agent-architecture">Agent Architecture</TopicLink>.
            </li>
            <li>
              Đi sâu <TopicLink slug="planning">Planning</TopicLink> — cách
              Orchestrator chia subtask.
            </li>
            <li>
              Khi nhiều Agent —{" "}
              <TopicLink slug="multi-agent">Multi-Agent</TopicLink> và{" "}
              <TopicLink slug="orchestration">Orchestration</TopicLink>.
            </li>
            <li>
              Đánh giá agentic system —{" "}
              <TopicLink slug="agent-evaluation">Agent Evaluation</TopicLink>.
            </li>
            <li>
              Cho Agent truy cập công cụ —{" "}
              <TopicLink slug="function-calling">Function Calling</TopicLink>{" "}
              và{" "}
              <TopicLink slug="model-context-protocol">MCP</TopicLink>.
            </li>
          </ul>

          <p className="mt-4 font-semibold text-foreground">
            Checklist triển khai production:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>Observability:</strong> log mọi LLM call + latency +
              token usage. Dùng LangSmith / Langfuse / OpenTelemetry.
            </li>
            <li>
              <strong>Retries:</strong> tool call phải có exponential backoff
              + jitter. Workflow step có idempotency key.
            </li>
            <li>
              <strong>Budget:</strong> đo token/phiên, ngắt khi vượt
              ngưỡng. Cảnh báo khi cost/ngày tăng &gt; 2× baseline.
            </li>
            <li>
              <strong>Eval:</strong> golden dataset chạy nightly. Với
              Evaluator-Optimizer, đo điểm pass-rate theo số vòng.
            </li>
            <li>
              <strong>Fallback:</strong> nếu Router confidence &lt; 0.7,
              chuyển cho handler tổng quát thay vì đoán.
            </li>
            <li>
              <strong>Human-in-the-loop:</strong> các hành động không đảo
              ngược (gửi email, charge tiền, xoá file) phải chờ xác nhận.
            </li>
            <li>
              <strong>Cascade:</strong> dùng model rẻ cho bước đơn giản
              (classify, extract), model lớn chỉ cho bước khó (reason,
              generate).
            </li>
          </ul>

          <p className="mt-4 font-semibold text-foreground">
            Case study luyện tập:
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>
              <strong>Hệ thống viết báo cáo tài chính:</strong> nhận 10 file
              PDF, trích số liệu, so sánh tháng, viết nhận xét. Đề xuất:
              Parallel (trích song song 10 file) → Sequential (so sánh →
              viết) → Eval-Opt (critic kiểm tra tone).
            </li>
            <li>
              <strong>Code review bot:</strong> đọc PR, đánh giá security +
              style + test coverage. Đề xuất: Parallel (3 reviewer chuyên) →
              Aggregator → Eval-Opt (refine nếu có conflict giữa reviewer).
            </li>
            <li>
              <strong>Multi-lingual customer care:</strong> Routing (theo
              ngôn ngữ + category) → Sequential (retrieve KB → generate) →
              optional Eval-Opt cho khiếu nại nhạy cảm.
            </li>
          </ol>
        </div>
      </LessonSection>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Bar phụ dùng trong VisualizationSection để hiển thị trade-off
// ───────────────────────────────────────────────────────────────────────────

function TradeoffBar({
  label,
  score,
  value,
  color,
}: {
  label: string;
  score: number;
  value: string;
  color: string;
}) {
  const width = Math.max(0, Math.min(5, score)) * 20;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-background">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
