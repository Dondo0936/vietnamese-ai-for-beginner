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
  slug: "agentic-rag",
  title: "Agentic RAG",
  titleVi: "RAG tăng cường với Agent",
  description:
    "Kết hợp RAG với AI Agent để tự quyết định khi nào truy xuất, xác minh và tổng hợp thông tin",
  category: "emerging",
  tags: ["rag", "agent", "adaptive-retrieval"],
  difficulty: "intermediate",
  relatedSlugs: ["rag", "agent-architecture", "react-framework"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

/* ──────────────────────────────────────────────────────────────
   Preset câu hỏi cho demo — mỗi câu hỏi "kích hoạt" một chuỗi
   hành động khác nhau của agent. Điều này giúp người học thấy
   tính adaptive của Agentic RAG: cùng một agent, nhưng với câu
   hỏi khác nhau, số bước và lựa chọn tool cũng khác.
   ──────────────────────────────────────────────────────────── */
type AgentStep = {
  id: string;
  phase: "plan" | "retrieve" | "evaluate" | "reretrieve" | "answer";
  title: string;
  detail: string;
  score?: number;
  tool?: string;
};

type AgentScenario = {
  id: string;
  question: string;
  naiveSteps: AgentStep[];
  agenticSteps: AgentStep[];
  naiveRelevance: number;
  agenticRelevance: number;
  naiveSummary: string;
  agenticSummary: string;
};

const SCENARIOS: AgentScenario[] = [
  {
    id: "policy",
    question: "Chính sách nghỉ phép năm 2025 của FPT là bao nhiêu ngày?",
    naiveSteps: [
      {
        id: "n1",
        phase: "retrieve",
        title: "Retrieve top-3 docs",
        detail: "Vector search với query gốc → trả 3 docs.",
        score: 0.62,
        tool: "vector_db",
      },
      {
        id: "n2",
        phase: "answer",
        title: "Generate trực tiếp",
        detail: "Ghép context + prompt → LLM trả về câu trả lời duy nhất, không kiểm tra.",
        score: 0.58,
      },
    ],
    agenticSteps: [
      {
        id: "a1",
        phase: "plan",
        title: "Plan: phân tích câu hỏi",
        detail: "Phát hiện từ khoá '2025' → cần document mới nhất. Lập kế hoạch: (1) retrieve nội bộ, (2) kiểm tra metadata date, (3) verify với HR portal.",
        tool: "reasoning",
      },
      {
        id: "a2",
        phase: "retrieve",
        title: "Retrieve lần 1",
        detail: "Vector DB nội bộ → 3 docs, top doc là 'HR Policy 2024.pdf' (metadata date = 2024-06-01).",
        score: 0.64,
        tool: "vector_db",
      },
      {
        id: "a3",
        phase: "evaluate",
        title: "Evaluate: doc này có outdated?",
        detail: "So sánh metadata.date (2024) với câu hỏi ('2025') → LOW relevance. Flag: cần retrieve lại từ nguồn khác.",
        score: 0.42,
      },
      {
        id: "a4",
        phase: "reretrieve",
        title: "Re-retrieve từ HR portal API",
        detail: "Gọi tool `fetch_hr_portal('leave_policy', year=2025)` → trả về bản chính thức 2025-01-15.",
        score: 0.91,
        tool: "hr_portal_api",
      },
      {
        id: "a5",
        phase: "answer",
        title: "Synthesize + cite",
        detail: "Tổng hợp: '15 ngày/năm (theo HR Portal, cập nhật 15/01/2025)'. Trích dẫn nguồn rõ ràng.",
        score: 0.94,
      },
    ],
    naiveRelevance: 0.58,
    agenticRelevance: 0.94,
    naiveSummary: "Trả lời 12 ngày (số liệu cũ 2024) — có thể SAI cho năm 2025.",
    agenticSummary: "Trả lời 15 ngày + trích dẫn văn bản 2025 — chính xác, có nguồn.",
  },
  {
    id: "compare",
    question: "So sánh doanh thu Q3 2024 giữa FPT và Viettel.",
    naiveSteps: [
      {
        id: "n1",
        phase: "retrieve",
        title: "Retrieve top-3 docs",
        detail: "Vector search với query gốc → mix docs FPT + Viettel nhưng không phân tách đơn vị.",
        score: 0.55,
        tool: "vector_db",
      },
      {
        id: "n2",
        phase: "answer",
        title: "Generate",
        detail: "LLM ghép số liệu — nhưng đơn vị khác nhau (triệu vs tỷ VND) → kết luận có thể sai 1000 lần.",
        score: 0.48,
      },
    ],
    agenticSteps: [
      {
        id: "a1",
        phase: "plan",
        title: "Plan: phát hiện câu so sánh",
        detail: "Nhận biết đây là câu so sánh 2 entity → cần retrieve riêng cho từng công ty, chuẩn hoá đơn vị.",
        tool: "reasoning",
      },
      {
        id: "a2",
        phase: "retrieve",
        title: "Retrieve FPT Q3 2024",
        detail: "Tool: `search_financial('FPT', quarter='Q3', year=2024)` → báo cáo tài chính FPT (tỷ VND).",
        score: 0.88,
        tool: "financial_api",
      },
      {
        id: "a3",
        phase: "retrieve",
        title: "Retrieve Viettel Q3 2024",
        detail: "Tool: `search_financial('Viettel', quarter='Q3', year=2024)` → báo cáo Viettel (triệu VND).",
        score: 0.85,
        tool: "financial_api",
      },
      {
        id: "a4",
        phase: "evaluate",
        title: "Evaluate: đơn vị khác nhau!",
        detail: "FPT ghi 'tỷ VND', Viettel ghi 'triệu VND'. Agent phát hiện và chuẩn hoá cả hai về tỷ VND.",
        score: 0.72,
      },
      {
        id: "a5",
        phase: "reretrieve",
        title: "Cross-check với nguồn thứ 3",
        detail: "Tool: `fetch_news('doanh thu Q3 2024')` từ VnEconomy → xác nhận số liệu khớp.",
        score: 0.89,
        tool: "web_search",
      },
      {
        id: "a6",
        phase: "answer",
        title: "Synthesize bảng so sánh",
        detail: "Trả về bảng chuẩn hoá + chú thích nguồn: FPT 14.2k tỷ vs Viettel 45.1k tỷ, verified bởi 2 nguồn.",
        score: 0.95,
      },
    ],
    naiveRelevance: 0.48,
    agenticRelevance: 0.95,
    naiveSummary: "Kết luận sai đơn vị → sai tỷ lệ 1000 lần. Không cross-check.",
    agenticSummary: "Chuẩn hoá đơn vị, verify 2 nguồn, đưa bảng so sánh rõ ràng.",
  },
  {
    id: "multihop",
    question: "Công ty mẹ của chuỗi siêu thị WinMart hiện có bao nhiêu nhân viên?",
    naiveSteps: [
      {
        id: "n1",
        phase: "retrieve",
        title: "Retrieve top-3 docs",
        detail: "Vector search với query gốc → trả docs về WinMart, không liên quan đến số nhân viên công ty mẹ.",
        score: 0.38,
        tool: "vector_db",
      },
      {
        id: "n2",
        phase: "answer",
        title: "Generate",
        detail: "LLM không thấy số nhân viên → hallucinate một con số hoặc trả lời 'không biết'.",
        score: 0.31,
      },
    ],
    agenticSteps: [
      {
        id: "a1",
        phase: "plan",
        title: "Plan: phát hiện multi-hop",
        detail: "Đây là câu 2 bước: (1) ai là công ty mẹ của WinMart? (2) công ty đó có bao nhiêu nhân viên?",
        tool: "reasoning",
      },
      {
        id: "a2",
        phase: "retrieve",
        title: "Retrieve hop 1: công ty mẹ WinMart",
        detail: "Tool: `search_docs('WinMart công ty mẹ')` → kết quả: Masan Group (thông qua Masan Consumer).",
        score: 0.87,
        tool: "vector_db",
      },
      {
        id: "a3",
        phase: "retrieve",
        title: "Retrieve hop 2: số nhân viên Masan",
        detail: "Tool: `search_docs('Masan Group số nhân viên 2024')` → báo cáo thường niên: ~45,000 nhân viên.",
        score: 0.90,
        tool: "vector_db",
      },
      {
        id: "a4",
        phase: "evaluate",
        title: "Evaluate: thông tin có khớp?",
        detail: "Kiểm tra năm báo cáo (2024), đơn vị đếm (full-time vs part-time). Confidence cao.",
        score: 0.88,
      },
      {
        id: "a5",
        phase: "answer",
        title: "Synthesize",
        detail: "Trả lời: 'WinMart thuộc Masan Group, có khoảng 45,000 nhân viên (báo cáo 2024).'",
        score: 0.93,
      },
    ],
    naiveRelevance: 0.31,
    agenticRelevance: 0.93,
    naiveSummary: "Không tách được 2 hop → thiếu thông tin hoặc hallucinate.",
    agenticSummary: "Agent tự chia câu hỏi thành 2 bước, retrieve từng bước, tổng hợp.",
  },
  {
    id: "general",
    question: "1 + 1 bằng mấy?",
    naiveSteps: [
      {
        id: "n1",
        phase: "retrieve",
        title: "Retrieve top-3 docs",
        detail: "Vector search (bắt buộc!) → trả về 3 docs hoàn toàn không liên quan.",
        score: 0.12,
        tool: "vector_db",
      },
      {
        id: "n2",
        phase: "answer",
        title: "Generate với context nhiễu",
        detail: "LLM cố gắng ghép context vô nghĩa → có thể hallucinate hoặc trả lời rườm rà.",
        score: 0.6,
      },
    ],
    agenticSteps: [
      {
        id: "a1",
        phase: "plan",
        title: "Plan: đánh giá câu hỏi",
        detail: "Phát hiện đây là kiến thức toán cơ bản → model đã biết. Quyết định: SKIP retrieve.",
        tool: "reasoning",
      },
      {
        id: "a2",
        phase: "answer",
        title: "Trả lời trực tiếp",
        detail: "Không cần retrieve. Trả lời: '2'. Nhanh, rẻ, không nhiễu.",
        score: 0.99,
      },
    ],
    naiveRelevance: 0.6,
    agenticRelevance: 0.99,
    naiveSummary: "Retrieve lãng phí, context nhiễu, có thể chậm + tốn token.",
    agenticSummary: "Skip retrieve — đúng loại câu hỏi cần trả lời thẳng.",
  },
];

const PHASE_COLORS: Record<AgentStep["phase"], { bg: string; border: string; text: string; label: string }> = {
  plan: { bg: "bg-purple-500/10", border: "border-purple-500/50", text: "text-purple-700 dark:text-purple-400", label: "PLAN" },
  retrieve: { bg: "bg-amber-500/10", border: "border-amber-500/50", text: "text-amber-700 dark:text-amber-400", label: "RETRIEVE" },
  evaluate: { bg: "bg-red-500/10", border: "border-red-500/50", text: "text-red-700 dark:text-red-400", label: "EVALUATE" },
  reretrieve: { bg: "bg-orange-500/10", border: "border-orange-500/50", text: "text-orange-700 dark:text-orange-400", label: "RE-RETRIEVE" },
  answer: { bg: "bg-emerald-500/10", border: "border-emerald-500/50", text: "text-emerald-700 dark:text-emerald-400", label: "ANSWER" },
};

export default function AgenticRAGTopic() {
  const [selectedScenario, setSelectedScenario] = useState<string>("policy");
  const [mode, setMode] = useState<"naive" | "agentic">("agentic");
  const [runStep, setRunStep] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [customQuestion, setCustomQuestion] = useState<string>("");

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === selectedScenario) ?? SCENARIOS[0],
    [selectedScenario],
  );

  const currentSteps = useMemo(
    () => (mode === "naive" ? scenario.naiveSteps : scenario.agenticSteps),
    [mode, scenario],
  );

  const runAgent = useCallback(() => {
    setIsRunning(true);
    setRunStep(-1);
    const total = currentSteps.length;
    let i = 0;
    const tick = () => {
      setRunStep(i);
      i += 1;
      if (i <= total) {
        setTimeout(tick, 850);
      } else {
        setIsRunning(false);
      }
    };
    tick();
  }, [currentSteps.length]);

  const resetRun = useCallback(() => {
    setRunStep(-1);
    setIsRunning(false);
  }, []);

  const handleScenarioChange = useCallback(
    (id: string) => {
      setSelectedScenario(id);
      resetRun();
    },
    [resetRun],
  );

  const handleModeChange = useCallback(
    (next: "naive" | "agentic") => {
      setMode(next);
      resetRun();
    },
    [resetRun],
  );

  const stepCountDiff = scenario.agenticSteps.length - scenario.naiveSteps.length;
  const relevanceDelta = (scenario.agenticRelevance - scenario.naiveRelevance) * 100;

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Agentic RAG khác Basic RAG ở điểm nào?",
        options: [
          "Dùng model lớn hơn",
          "Agent TỰ QUYẾT ĐỊNH: có cần retrieve không, retrieve từ đâu, bao nhiêu lần, có cần verify không",
          "Dùng vector database tốt hơn",
          "Agentic RAG chỉ khác tên gọi, bản chất giống hệt",
        ],
        correct: 1,
        explanation:
          "Basic RAG: luôn retrieve → generate (1 bước cố định). Agentic RAG: agent đánh giá câu hỏi → quyết định có cần retrieve? → retrieve từ nguồn nào? → kết quả đủ tốt? → cần retrieve thêm? → verify thông tin? Linh hoạt và chính xác hơn nhiều.",
      },
      {
        question: "Khi nào Agentic RAG quyết định KHÔNG retrieve?",
        options: [
          "Không bao giờ — luôn retrieve để an toàn",
          "Khi câu hỏi thuộc kiến thức chung mà model đã biết (ví dụ: '1+1=?'), retrieve sẽ lãng phí và có thể gây nhiễu",
          "Khi database trống",
          "Khi user yêu cầu",
        ],
        correct: 1,
        explanation:
          "Adaptive retrieval: câu hỏi kiến thức chung → trả lời trực tiếp (nhanh, rẻ). Câu hỏi cần thông tin cụ thể → retrieve. Câu hỏi phức tạp → multi-step retrieve. Không phải mọi câu đều cần retrieve — giống không cần tra Google cho '1+1=?'.",
      },
      {
        question: "Self-RAG technique hoạt động thế nào?",
        options: [
          "Model tự đánh giá: (1) có cần retrieve? (2) retrieved docs có relevance? (3) response có supported by docs?",
          "Model tự tạo database riêng",
          "Model retrieve từ chính output của mình",
          "Model dùng reinforcement learning để tự chấm điểm",
        ],
        correct: 0,
        explanation:
          "Self-RAG (Asai et al. 2023): model tự sinh 'reflection tokens' để tự đánh giá từng bước. [Retrieve]: có cần retrieve? [ISREL]: doc có relevant? [ISSUP]: answer có được support? [ISUSE]: answer có hữu ích? Mỗi bước có quyết định → kết quả chính xác hơn.",
      },
      {
        question: "CRAG (Corrective RAG) làm gì khi retrieved docs không tốt?",
        options: [
          "Luôn trả về docs cho LLM, để LLM tự lọc",
          "Thêm một evaluator nhỏ chấm relevance → nếu 'incorrect' thì bỏ docs, fallback sang web search",
          "Tắt RAG, trả lời từ parametric memory",
          "Retrain mô hình trên query mới",
        ],
        correct: 1,
        explanation:
          "CRAG (Yan et al. 2024) thêm một lightweight evaluator chấm 3 nhãn: correct / ambiguous / incorrect. Correct → dùng. Ambiguous → mix với web search. Incorrect → bỏ hoàn toàn và dùng web search. Kết quả +15% accuracy so với basic RAG.",
      },
      {
        question: "Trong vòng lặp Plan → Retrieve → Evaluate, bước Evaluate trả về gì?",
        options: [
          "Chỉ một điểm số duy nhất cho toàn bộ câu trả lời",
          "Quyết định tiếp theo: dừng và answer, retrieve thêm, reformulate query, hoặc từ chối trả lời",
          "Log để debug",
          "Không có output — chỉ để đo performance",
        ],
        correct: 1,
        explanation:
          "Evaluator đóng vai trò 'bộ não phản xạ': nhìn retrieved docs + câu hỏi gốc → quyết định hành động tiếp theo. Đây là lý do agentic RAG 'thông minh' — có vòng lặp đóng (closed loop) thay vì pipeline một chiều.",
      },
      {
        question: "Multi-source retrieval trong Agentic RAG có lợi ích gì?",
        options: [
          "Tăng chi phí nhưng không cải thiện gì",
          "Agent chọn nguồn phù hợp với câu hỏi: vector DB cho semantic, SQL cho structured, web cho real-time, API cho official data",
          "Bắt buộc dùng cả 4 nguồn cho mọi câu",
          "Chỉ để tiếp thị",
        ],
        correct: 1,
        explanation:
          "Không nguồn nào tốt cho mọi loại câu hỏi. Vector DB giỏi semantic nhưng yếu exact match. SQL chính xác nhưng cứng. Web mới nhưng nhiễu. Agent biết chọn đúng nguồn cho đúng câu hỏi — như một nhà nghiên cứu chuyên nghiệp.",
      },
      {
        question: "Trade-off chính của Agentic RAG so với Basic RAG là gì?",
        options: [
          "Agentic RAG luôn nhanh hơn và rẻ hơn",
          "Agentic RAG chính xác hơn nhưng tốn nhiều token/latency do nhiều bước LLM call",
          "Không có trade-off — Agentic RAG toàn ưu điểm",
          "Agentic RAG chỉ chạy được với model nhỏ",
        ],
        correct: 1,
        explanation:
          "Mỗi bước plan/evaluate cần một LLM call → tổng token × 3-10 so với basic RAG. Latency cũng cao hơn (2-30 giây). Đổi lại: chính xác hơn 15-30%, ít hallucinate, có citation. Dùng khi chất lượng quan trọng hơn tốc độ.",
      },
      {
        type: "fill-blank",
        question:
          "Agentic RAG vượt trội so với basic RAG nhờ hai năng lực: agent có thể gọi nhiều công cụ retrieve thông qua {blank}, và tự đánh giá chất lượng kết quả bằng {blank} trước khi trả lời.",
        blanks: [
          { answer: "tool use", accept: ["function calling", "tool-use", "tool calling", "công cụ"] },
          { answer: "self-reflection", accept: ["self reflection", "tự phản hồi", "tự đánh giá", "reflection"] },
        ],
        explanation:
          "Tool use giúp agent linh hoạt chọn nguồn (vector DB, SQL, web, API). Self-reflection (Self-RAG, CRAG) giúp agent quyết định retrieve tiếp, đổi truy vấn hay từ chối trả lời — chính xác hơn 15-30% so với basic RAG.",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Chatbot công ty bạn dùng Basic RAG. User hỏi 'Chính sách nghỉ phép năm 2025 là gì?' — RAG trả về document 2024 (chưa update). Chatbot trả lời sai. Giải pháp?"
          options={[
            "Update document thường xuyên hơn",
            "Dùng Agentic RAG: agent kiểm tra document date, nhận biết outdated, tự động tìm document mới hơn hoặc báo cho user",
            "Thay đổi LLM mạnh hơn",
          ]}
          correct={1}
          explanation="Agentic RAG thông minh hơn: kiểm tra metadata (date, version), cross-check nhiều nguồn, tự nhận biết 'document này từ 2024, câu hỏi về 2025 — có thể outdated'. Agent tự quyết định: retrieve thêm, cảnh báo user, hoặc từ chối trả lời thay vì đưa thông tin sai."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Hãy đóng vai người dùng: <strong className="text-foreground">chọn một câu hỏi</strong>, rồi
          xem cả hai hệ thống chạy từng bước. Chú ý số bước, điểm relevance, và kết luận cuối cùng —
          sự khác biệt giữa <strong className="text-foreground">naive RAG</strong> và{" "}
          <strong className="text-foreground">agentic RAG</strong> nằm ở đó.
        </p>
        <VisualizationSection>
          <div className="space-y-5">
            {/* Scenario picker */}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-2">1. Chọn câu hỏi demo</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {SCENARIOS.map((s) => {
                  const active = s.id === selectedScenario;
                  const categoryLabel =
                    s.id === "policy"
                      ? "Nhân sự"
                      : s.id === "compare"
                      ? "So sánh"
                      : s.id === "multihop"
                      ? "Multi-hop"
                      : "Kiến thức chung";
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleScenarioChange(s.id)}
                      className={`rounded-lg border p-3 text-left text-xs leading-snug transition-colors ${
                        active
                          ? "border-purple-500 bg-purple-500/10 text-foreground"
                          : "border-border bg-card text-muted hover:border-purple-500/50"
                      }`}
                    >
                      <span
                        className={`mb-1 block text-[10px] font-bold uppercase ${
                          active ? "text-purple-700 dark:text-purple-400" : "text-muted"
                        }`}
                      >
                        {categoryLabel}
                      </span>
                      {s.question}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom question — illustrative only, routes to closest scenario by keyword */}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-2">
                Hoặc thử nhập câu hỏi của bạn (agent sẽ chọn scenario gần nhất)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="VD: Doanh thu Viettel Q2 2024..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const q = customQuestion.toLowerCase();
                    if (q.includes("so sánh") || q.includes("doanh thu") || q.includes("vs")) {
                      handleScenarioChange("compare");
                    } else if (
                      q.match(/^\s*\d+\s*[+\-*/]\s*\d+/) ||
                      q.includes("bằng mấy") ||
                      (q.includes("là gì") && q.length < 30)
                    ) {
                      handleScenarioChange("general");
                    } else if (
                      q.includes("công ty mẹ") ||
                      q.includes("ceo của") ||
                      q.includes("trực thuộc") ||
                      q.includes("của chuỗi")
                    ) {
                      handleScenarioChange("multihop");
                    } else {
                      handleScenarioChange("policy");
                    }
                  }}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
                >
                  Phân loại
                </button>
              </div>
            </div>

            {/* Mode picker */}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-2">2. Chọn hệ thống</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleModeChange("naive")}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                    mode === "naive"
                      ? "border-blue-500 bg-blue-500/20 text-blue-800 dark:text-blue-300"
                      : "border-border bg-card text-muted hover:border-blue-500/50"
                  }`}
                >
                  Naive RAG
                  <span className="ml-2 text-[10px] opacity-70">
                    {scenario.naiveSteps.length} bước
                  </span>
                </button>
                <button
                  onClick={() => handleModeChange("agentic")}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                    mode === "agentic"
                      ? "border-purple-500 bg-purple-500/20 text-purple-800 dark:text-purple-300"
                      : "border-border bg-card text-muted hover:border-purple-500/50"
                  }`}
                >
                  Agentic RAG
                  <span className="ml-2 text-[10px] opacity-70">
                    {scenario.agenticSteps.length} bước
                  </span>
                </button>
              </div>
            </div>

            {/* Run controls */}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-2">
                3. Chạy agent — xem từng bước
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={runAgent}
                  disabled={isRunning}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isRunning ? "Đang chạy..." : "▶ Chạy"}
                </button>
                <button
                  onClick={resetRun}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
                >
                  ↻ Reset
                </button>
                <div className="ml-2 flex-1">
                  <ProgressSteps
                    current={Math.max(1, Math.min(runStep + 1, currentSteps.length))}
                    total={currentSteps.length}
                  />
                </div>
              </div>
            </div>

            {/* Reasoning trace */}
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Trace suy luận của agent
              </p>
              <div className="space-y-2">
                {currentSteps.map((step, idx) => {
                  const visible = idx <= runStep || runStep === -1;
                  const active = idx === runStep;
                  const color = PHASE_COLORS[step.phase];
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{
                        opacity: visible ? 1 : 0.25,
                        y: 0,
                        scale: active ? 1.01 : 1,
                      }}
                      transition={{ duration: 0.35 }}
                      className={`rounded-lg border p-3 text-sm transition-colors ${color.border} ${color.bg} ${
                        active ? "ring-2 ring-offset-2 ring-offset-background ring-purple-500/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${color.text} bg-background/60`}
                        >
                          {color.label}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {idx + 1}. {step.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted leading-relaxed">{step.detail}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px]">
                            {step.tool && (
                              <span className="rounded bg-background/70 px-1.5 py-0.5 font-mono text-muted">
                                tool: {step.tool}
                              </span>
                            )}
                            {typeof step.score === "number" && (
                              <span
                                className={`font-mono ${
                                  step.score > 0.8
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : step.score > 0.6
                                    ? "text-amber-700 dark:text-amber-400"
                                    : "text-red-700 dark:text-red-400"
                                }`}
                              >
                                relevance = {step.score.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Summary comparison */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400 font-bold">Naive RAG</p>
                <p className="mt-1 text-sm text-foreground">{scenario.naiveSummary}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded bg-background/50 p-2">
                    <p className="text-muted">Bước</p>
                    <p className="font-mono text-lg text-foreground">{scenario.naiveSteps.length}</p>
                  </div>
                  <div className="rounded bg-background/50 p-2">
                    <p className="text-muted">Relevance</p>
                    <p className="font-mono text-lg text-blue-700 dark:text-blue-400">
                      {(scenario.naiveRelevance * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                <p className="text-xs uppercase tracking-wide text-purple-700 dark:text-purple-400 font-bold">Agentic RAG</p>
                <p className="mt-1 text-sm text-foreground">{scenario.agenticSummary}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded bg-background/50 p-2">
                    <p className="text-muted">Bước</p>
                    <p className="font-mono text-lg text-foreground">
                      {scenario.agenticSteps.length}
                      {stepCountDiff !== 0 && (
                        <span
                          className={`ml-1 text-xs ${
                            stepCountDiff > 0 ? "text-purple-700 dark:text-purple-400" : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          ({stepCountDiff > 0 ? "+" : ""}
                          {stepCountDiff})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="rounded bg-background/50 p-2">
                    <p className="text-muted">Relevance</p>
                    <p className="font-mono text-lg text-emerald-700 dark:text-emerald-400">
                      {(scenario.agenticRelevance * 100).toFixed(0)}%
                      <span className="ml-1 text-xs text-emerald-500">
                        (+{relevanceDelta.toFixed(0)}pp)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted leading-relaxed">
              Chú ý: scenario &quot;1+1&quot; cho thấy agentic RAG có thể <em>ít bước hơn</em> naive RAG —
              vì agent biết skip retrieve khi không cần. &quot;Nhiều bước&quot; không phải mục tiêu; mục tiêu
              là <em>đúng số bước</em> cho loại câu hỏi.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Basic RAG giống <strong>máy tra cứu tự động</strong>{" "}— luôn tìm, luôn trả.
            Agentic RAG giống <strong>nhà nghiên cứu thông minh</strong>{" "}— suy nghĩ trước khi tìm,
            kiểm tra nguồn, cross-check, và biết nói &apos;tôi không chắc chắn&apos; khi thông tin không đủ.
            Bước nhảy từ &apos;retrieve and read&apos; sang{" "}
            <strong>&apos;think, retrieve, verify, synthesize&apos;</strong>.
          </p>
          <p className="mt-3">
            Khi bạn thêm vòng lặp <LaTeX>{"\\text{Plan} \\to \\text{Retrieve} \\to \\text{Evaluate} \\to \\text{Re-retrieve?}"}</LaTeX>, hệ thống từ một <em>pipeline</em> trở thành một <em>agent</em>. Không phải model giỏi hơn — mà là cấu trúc giỏi hơn.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="User hỏi: 'So sánh doanh thu Q3 2024 của FPT và Viettel.' Basic RAG retrieve 2 documents riêng. Nhưng 2 docs dùng đơn vị khác nhau (triệu vs tỷ VND). Agentic RAG xử lý thế nào?"
          options={[
            "Trả về 2 con số và để user tự so sánh",
            "Agent nhận biết đơn vị khác nhau, tự chuyển đổi, cross-check với nguồn thứ 3, trả về so sánh chuẩn hoá",
            "Báo lỗi vì data không tương thích",
          ]}
          correct={1}
          explanation="Agentic RAG: (1) retrieve FPT doc + Viettel doc, (2) nhận biết đơn vị khác nhau, (3) chuyển đổi về cùng đơn vị, (4) cross-check với báo cáo tổng hợp, (5) trả về bảng so sánh chuẩn hoá + ghi chú nguồn. Multi-step reasoning + tool use!"
        />

        <div className="mt-5">
          <InlineChallenge
            question="Bạn đang build chatbot hỗ trợ khách hàng. 80% câu hỏi là kiến thức chung ('giờ mở cửa?', 'địa chỉ?'), 20% là câu phức tạp ('hoàn tiền đơn #A1234'). Agentic RAG nên áp dụng thế nào?"
            options={[
              "Bắt buộc tất cả câu hỏi đều qua retrieve + evaluate để an toàn",
              "Dùng adaptive retrieval: câu đơn giản skip retrieve, câu phức tạp mới kích hoạt full pipeline plan→retrieve→evaluate→answer",
              "Viết rule if/else cho từng loại câu hỏi",
            ]}
            correct={1}
            explanation="Adaptive retrieval tiết kiệm 80% cost/latency cho các câu đơn giản, đồng thời đảm bảo các câu phức tạp có đủ bước verify. Rule-based cũng được nhưng khó maintain khi chatbot scale — LLM classifier học được ngữ cảnh tốt hơn."
          />
        </div>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Agentic RAG</strong>{" "}
            kết hợp <TopicLink slug="rag">RAG</TopicLink> với AI Agent dựa trên{" "}
            <TopicLink slug="agent-architecture">agent architecture</TopicLink> — agent tự quyết định khi nào
            retrieve, từ nguồn nào, bao nhiêu lần, và có cần verify không. Khả năng điều phối nhiều công cụ đến từ{" "}
            <TopicLink slug="function-calling">function calling</TopicLink>.
          </p>

          <p>
            <strong>4 khả năng cốt lõi:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Adaptive Retrieval:</strong>{" "}Quyết định CÓ CẦN retrieve hay không (skip cho câu đơn giản)
            </li>
            <li>
              <strong>Multi-source:</strong>{" "}Retrieve từ nhiều nguồn: vector DB, SQL, web search, API
            </li>
            <li>
              <strong>Self-reflection:</strong>{" "}Tự đánh giá: retrieved docs có relevant? answer có supported?
            </li>
            <li>
              <strong>Iterative refinement:</strong>{" "}Không đủ tốt → reformulate query → retrieve lại
            </li>
          </ul>

          <Callout variant="tip" title="CRAG - Corrective RAG">
            <p>
              CRAG (Yan et al. 2024): sau khi retrieve, evaluator đánh giá relevance. Correct → dùng. Ambiguous →
              web search bổ sung. Incorrect → bỏ retrieved docs, dùng web search thay thế. Kết quả: +15% accuracy
              so với basic RAG.
            </p>
            <p className="mt-2 text-xs">
              Key insight: evaluator không cần là model lớn — một BERT-class model fine-tune cho task này đủ tốt
              và rất nhanh. Điều này giúp CRAG chạy ở chi phí thấp.
            </p>
          </Callout>

          <Callout variant="info" title="Self-RAG: reflection tokens">
            <p>
              Self-RAG (Asai et al. 2023) huấn luyện model sinh ra các &quot;reflection tokens&quot; đặc biệt xen
              trong output: <code>[Retrieve=Yes/No]</code>, <code>[IsRel]</code>, <code>[IsSup]</code>,{" "}
              <code>[IsUse]</code>. Mỗi token là một nhãn đánh giá từng bước — từ đó model &quot;tự giám sát&quot;
              chính mình mà không cần evaluator ngoài.
            </p>
          </Callout>

          <Callout variant="warning" title="Trade-off: latency và chi phí">
            <p>
              Agentic RAG đắt hơn basic RAG 3-10 lần về token (do nhiều LLM call cho plan, evaluate, synthesize).
              Latency cũng tăng: basic RAG 1-3 giây, agentic RAG 5-30 giây. Dùng khi <em>chất lượng quan trọng
              hơn tốc độ</em>: báo cáo tài chính, y tế, pháp lý. Không dùng cho chat autocomplete realtime.
            </p>
          </Callout>

          <Callout variant="insight" title="Khi nào KHÔNG nên dùng Agentic RAG">
            <p>
              Không phải mọi ứng dụng đều cần agentic. Nếu domain hẹp (FAQ ổn định), data ít thay đổi, và câu hỏi
              có structure cố định → basic RAG + prompt engineering tốt đã đủ. Agentic RAG toả sáng khi: data
              nhiều nguồn, câu hỏi đa dạng, cần verify, hoặc cost của câu trả lời sai rất cao.
            </p>
          </Callout>

          <CodeBlock language="python" title="Agentic RAG với Anthropic SDK + tool use">
{`import anthropic

client = anthropic.Anthropic()

tools = [
    {
        "name": "search_docs",
        "description": "Tìm tài liệu trong knowledge base nội bộ",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "source": {
                    "type": "string",
                    "enum": ["internal_vector_db", "web", "sql_database"],
                },
                "top_k": {"type": "integer", "default": 5},
            },
            "required": ["query", "source"],
        },
    },
    {
        "name": "verify_fact",
        "description": "Verify một claim cụ thể với nguồn thứ ba",
        "input_schema": {
            "type": "object",
            "properties": {
                "claim": {"type": "string"},
                "check_against": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["claim"],
        },
    },
    {
        "name": "fetch_metadata",
        "description": "Lấy metadata của một document (date, author, version)",
        "input_schema": {
            "type": "object",
            "properties": {"doc_id": {"type": "string"}},
            "required": ["doc_id"],
        },
    },
]

SYSTEM_PROMPT = """Bạn là một nghiên cứu viên thông minh.
Trước khi trả lời, hãy:
1. PLAN: phân tích câu hỏi, liệt kê thông tin cần tìm.
2. RETRIEVE: chọn nguồn phù hợp nhất, truy vấn.
3. EVALUATE: docs có đủ, có cập nhật, có nhất quán?
4. RE-RETRIEVE (nếu cần): reformulate hoặc đổi nguồn.
5. ANSWER: tổng hợp và trích dẫn rõ nguồn.
Nếu câu hỏi là kiến thức chung, có thể SKIP retrieve."""

def run_agent(user_question: str, max_loops: int = 6):
    messages = [{"role": "user", "content": user_question}]
    for loop in range(max_loops):
        resp = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=tools,
            messages=messages,
        )
        if resp.stop_reason == "end_turn":
            return resp.content[-1].text
        # process tool_use blocks
        tool_results = []
        for block in resp.content:
            if block.type == "tool_use":
                result = call_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })
        messages.append({"role": "assistant", "content": resp.content})
        messages.append({"role": "user", "content": tool_results})
    return "[agent dừng: quá số vòng cho phép]"

# Ví dụ
answer = run_agent(
    "So sánh chính sách nghỉ phép của FPT và VNG năm 2025"
)
print(answer)`}
          </CodeBlock>

          <CodeBlock language="python" title="LangChain: agentic RAG với LangGraph">
{`from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

llm = ChatAnthropic(model="claude-sonnet-4-5")
vector_store = Chroma(persist_directory="./kb")

class AgentState(TypedDict):
    question: str
    plan: str
    docs: list[Document]
    eval_label: Literal["correct", "ambiguous", "incorrect", "pending"]
    reformulated: str
    iterations: int
    answer: str

def plan_node(state: AgentState) -> AgentState:
    """Phase 1: agent lập kế hoạch."""
    prompt = f"""Câu hỏi: {state['question']}
Hãy xác định: (1) đây là kiến thức chung hay cần retrieve?
(2) nếu cần, nguồn phù hợp nhất là gì?
(3) query tối ưu để tìm kiếm là gì?"""
    plan = llm.invoke([HumanMessage(content=prompt)]).content
    return {**state, "plan": plan, "iterations": 0}

def should_retrieve(state: AgentState) -> Literal["retrieve", "answer_direct"]:
    """Router: adaptive retrieval quyết định có retrieve hay không."""
    if "kiến thức chung" in state["plan"].lower() or "skip" in state["plan"].lower():
        return "answer_direct"
    return "retrieve"

def retrieve_node(state: AgentState) -> AgentState:
    """Phase 2: retrieve docs."""
    query = state.get("reformulated") or state["question"]
    docs = vector_store.similarity_search(query, k=5)
    return {**state, "docs": docs, "eval_label": "pending"}

def evaluate_node(state: AgentState) -> AgentState:
    """Phase 3: evaluator chấm relevance."""
    context = "\\n---\\n".join(d.page_content for d in state["docs"])
    prompt = f"""Câu hỏi: {state['question']}
Docs retrieved:
{context}

Docs có đủ trả lời câu hỏi?
Trả lời một từ: correct | ambiguous | incorrect"""
    label = llm.invoke([HumanMessage(content=prompt)]).content.strip().lower()
    return {**state, "eval_label": label}  # type: ignore

def should_reretrieve(state: AgentState) -> Literal["reformulate", "answer"]:
    if state["eval_label"] == "correct":
        return "answer"
    if state["iterations"] >= 3:
        return "answer"  # bỏ cuộc sau 3 lần
    return "reformulate"

def reformulate_node(state: AgentState) -> AgentState:
    """Phase 4: reformulate query."""
    prompt = f"""Query cũ: {state.get('reformulated') or state['question']}
Docs không đủ tốt. Hãy viết lại query — cụ thể hơn, đổi từ khoá."""
    new_q = llm.invoke([HumanMessage(content=prompt)]).content
    return {**state, "reformulated": new_q, "iterations": state["iterations"] + 1}

def answer_node(state: AgentState) -> AgentState:
    """Phase 5: synthesize + cite."""
    context = "\\n---\\n".join(d.page_content for d in state.get("docs", []))
    prompt = f"""Câu hỏi: {state['question']}
Context: {context or '(no retrieval)'}
Trả lời ngắn gọn, trích dẫn nguồn khi có."""
    answer = llm.invoke([HumanMessage(content=prompt)]).content
    return {**state, "answer": answer}

# Lắp graph
graph = StateGraph(AgentState)
graph.add_node("plan", plan_node)
graph.add_node("retrieve", retrieve_node)
graph.add_node("evaluate", evaluate_node)
graph.add_node("reformulate", reformulate_node)
graph.add_node("answer", answer_node)

graph.set_entry_point("plan")
graph.add_conditional_edges("plan", should_retrieve, {
    "retrieve": "retrieve",
    "answer_direct": "answer",
})
graph.add_edge("retrieve", "evaluate")
graph.add_conditional_edges("evaluate", should_reretrieve, {
    "reformulate": "reformulate",
    "answer": "answer",
})
graph.add_edge("reformulate", "retrieve")
graph.add_edge("answer", END)

app = graph.compile()

result = app.invoke({"question": "Chính sách nghỉ phép FPT 2025?"})
print(result["answer"])`}
          </CodeBlock>

          <CollapsibleDetail title="Tại sao LangGraph (state graph) phù hợp với Agentic RAG hơn chain thông thường?">
            <p className="text-sm leading-relaxed">
              Chain LangChain cổ điển là DAG một chiều: input → step1 → step2 → output. Agentic RAG cần các cạnh{" "}
              <em>ngược</em> (reformulate → retrieve lại) và <em>có điều kiện</em> (evaluate → branch). LangGraph
              cho phép định nghĩa state machine rõ ràng: mỗi node đọc/ghi state, mỗi cạnh có thể gắn hàm điều
              kiện. Bạn có thể debug bằng cách in ra trace các state transition — điều gần như bất khả với
              prompt-only agent.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              Ngoài LangGraph, các lựa chọn tương đương: <code>Haystack Pipelines</code>, <code>LlamaIndex</code>{" "}
              <code>QueryEngine</code> với <code>RouterQueryEngine</code>, <code>DSPy</code> với module-based
              program, hoặc build tay với một event loop + reducer pattern (inspired by Redux).
            </p>
          </CollapsibleDetail>

          <p className="mt-5">
            <strong>Các kiến trúc agentic RAG phổ biến:</strong>{" "}
            khi design một hệ thống, bạn sẽ chọn giữa các pattern sau — mỗi pattern có trade-off riêng về độ phức
            tạp, chi phí và chất lượng:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Query Rewriter:</strong>{" "}pattern đơn giản nhất — LLM viết lại query trước khi vào vector
              search. Không có vòng lặp, chi phí thấp, nhưng không thể sửa sai sau retrieval.
            </li>
            <li>
              <strong>CRAG (Corrective):</strong>{" "}thêm evaluator chấm retrieved docs, fallback sang web khi
              docs tệ. Tăng độ chính xác mà không tăng nhiều độ phức tạp.
            </li>
            <li>
              <strong>Self-RAG:</strong>{" "}model tự sinh reflection tokens. Cần fine-tune nhưng không cần
              evaluator ngoài.
            </li>
            <li>
              <strong>RAT (Retrieval-Augmented Thought):</strong>{" "}LLM viết ra chain-of-thought trước, rồi
              retrieve cho từng bước suy nghĩ. Phù hợp câu multi-hop và lý luận.
            </li>
            <li>
              <strong>Plan-and-Execute:</strong>{" "}LLM lập plan đầy đủ (list of subtasks), rồi một agent khác
              thực thi từng task. Dễ debug, dễ log, dễ caching.
            </li>
            <li>
              <strong>ReAct loop:</strong>{" "}mix reasoning + acting trong từng turn — là nền tảng của hầu hết
              các framework agentic hiện đại.
            </li>
          </ul>

          <CollapsibleDetail title="Kiểm soát chi phí: cache + budget + early stopping">
            <p className="text-sm leading-relaxed">
              Một agent không giới hạn có thể gọi tool 20-30 lần cho một câu hỏi khó → burn rất nhiều token. Các
              kỹ thuật thực tế:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                <strong>Token budget:</strong>{" "}đặt cap <code>max_iterations=6</code>, <code>max_tokens_total=20k</code>.
                Khi vượt, agent phải trả lời với gì đang có.
              </li>
              <li>
                <strong>Tool result cache:</strong>{" "}cache retrieval theo normalized query — cùng câu hỏi không
                retrieve lại.
              </li>
              <li>
                <strong>Prompt caching:</strong>{" "}Anthropic SDK cho phép cache system prompt + tool schema — tiết
                kiệm 80-90% input token cho các call lặp lại.
              </li>
              <li>
                <strong>Early stopping trên evaluator:</strong>{" "}nếu evaluator trả &quot;correct&quot; với
                confidence &gt; 0.9 → bỏ qua verify bổ sung.
              </li>
              <li>
                <strong>Small evaluator:</strong>{" "}dùng Haiku/Sonnet cho evaluator, Opus chỉ cho synthesis cuối.
              </li>
            </ul>
          </CollapsibleDetail>

          <p className="mt-5">
            <strong>Đánh giá một agentic RAG system:</strong>{" "}không đủ chỉ đo accuracy cuối. Hãy đo từng
            thành phần:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Retrieval quality:</strong>{" "}Recall@k, MRR, nDCG trên tập queries có nhãn.
            </li>
            <li>
              <strong>Router accuracy:</strong>{" "}quyết định retrieve vs skip có đúng không?
            </li>
            <li>
              <strong>Evaluator calibration:</strong>{" "}&quot;correct&quot; của evaluator có thực sự correct
              không? Đo bằng confusion matrix.
            </li>
            <li>
              <strong>Answer faithfulness:</strong>{" "}câu trả lời có được support bởi retrieved docs không?
              (RAGAS, TruLens).
            </li>
            <li>
              <strong>Citation accuracy:</strong>{" "}trích dẫn có đúng nguồn không?
            </li>
            <li>
              <strong>Cost &amp; latency:</strong>{" "}token tổng, LLM call count, p50/p95 latency.
            </li>
          </ul>

          <Callout variant="tip" title="Debugging agentic RAG: dùng tracing">
            <p>
              Khi agent chạy 5-10 bước, log plain-text không đủ. Dùng LangSmith, Helicone, hoặc OpenTelemetry để
              xem cây call: mỗi node, input/output, token cost, latency. Khi một câu trả lời sai, bạn có thể lần
              ngược xem agent đã retrieve gì, evaluator đã chấm sao, reformulate thế nào — đây là điểm khác biệt
              giữa prototype và hệ thống production.
            </p>
            <p className="mt-2 text-xs">
              Một pattern hữu ích: gắn <code>trace_id</code> cho mọi request, log state sau mỗi node, và xuất ra
              JSON để review offline. Bạn sẽ ngạc nhiên về số lần agent &quot;đi vòng&quot; — nhiều hơn dự kiến.
            </p>
          </Callout>

          <p className="mt-4 text-xs text-muted leading-relaxed">
            Tóm lại: Agentic RAG không phải một công nghệ cụ thể mà là một <em>hướng tiếp cận</em>. Bạn có thể
            bắt đầu bằng cách thêm 1 bước evaluator vào basic RAG (CRAG-style), sau đó nâng dần — thêm adaptive
            retrieval, multi-source, và cuối cùng là self-reflection. Mỗi bước thêm 5-10% accuracy và 20-30% độ
            phức tạp — hãy dừng khi đủ cho use case của bạn.
          </p>
          <p className="mt-2 text-xs text-muted leading-relaxed">
            Một lưu ý cuối: dù agentic, <em>đừng để agent chạy không giới hạn</em>. Luôn có timeout, budget, và
            fallback path trả lời &quot;tôi không tìm được thông tin đáng tin&quot; — đây là hành vi đáng tin cậy
            cho production, không phải điểm yếu.
          </p>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          points={[
            "Agentic RAG biến pipeline một chiều thành vòng lặp Plan → Retrieve → Evaluate → Re-retrieve → Answer, do agent tự điều phối.",
            "4 năng lực cốt lõi: Adaptive Retrieval, Multi-source, Self-reflection, Iterative Refinement.",
            "CRAG thêm evaluator nhẹ chấm correct/ambiguous/incorrect; Self-RAG huấn luyện model sinh reflection tokens để tự giám sát.",
            "Adaptive retrieval cho phép skip bước retrieve cho câu kiến thức chung — tiết kiệm cost và tránh nhiễu.",
            "Multi-source routing giúp chọn đúng công cụ: vector DB, SQL, web, API — tuỳ loại câu hỏi.",
            "Trade-off chính: +15-30% accuracy, nhưng ×3-10 token và ×2-10 latency — hãy cân nhắc theo use case.",
          ]}
        />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
