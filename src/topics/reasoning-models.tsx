"use client";

import { useMemo, useState } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ---------------------------------------------------------------------------
// METADATA — giữ nguyên theo yêu cầu
// ---------------------------------------------------------------------------

export const metadata: TopicMeta = {
  slug: "reasoning-models",
  title: "Reasoning Models",
  titleVi: "Mô hình suy luận — AI biết nghĩ sâu",
  description:
    "Thế hệ mô hình AI mới có khả năng suy luận từng bước, giải quyết các bài toán phức tạp đòi hỏi logic và tư duy.",
  category: "emerging",
  tags: ["reasoning", "o1", "chain-of-thought", "thinking"],
  difficulty: "advanced",
  relatedSlugs: ["test-time-compute", "long-context", "planning"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// TYPES & DATA — bài toán minh họa và dấu vết suy luận
// ---------------------------------------------------------------------------

interface ReasoningTrace {
  id: string;
  step: number;
  content: string;
  kind: "plan" | "compute" | "check" | "revise" | "answer";
}

interface ModelProfile {
  name: string;
  family: string;
  thinkTokens: number; // tokens thinking trung bình
  answerTokens: number; // tokens của câu trả lời cuối
  accAime: number; // accuracy AIME 2024
  accMath500: number; // MATH-500
  accGpqa: number; // GPQA Diamond
  latencySec: number; // thời gian inference trung bình (1 câu)
  costPerCall: number; // USD ước lượng (1 câu khó)
  note: string;
}

const PROBLEM_VI =
  "Một cửa hàng có 3 loại trà sữa: trân châu, pudding và thạch. " +
  "Giá trung bình mỗi ly: 35.000đ, 42.000đ, 38.000đ. Hôm nay bán 120 ly, " +
  "tổng doanh thu 4.620.000đ. Biết số ly pudding bằng tổng số ly trân châu và thạch. " +
  "Hỏi mỗi loại bán bao nhiêu ly?";

// Standard LLM — trả lời trực tiếp, sai
const STANDARD_ANSWER = {
  answer:
    "Khoảng 40 ly mỗi loại (vì tổng 120 ly chia đều ≈ 40). Doanh thu trung bình 4.620.000 / 120 ≈ 38.500đ/ly — gần với giá thạch, nên có thể thạch nhiều hơn.",
  correct: false,
  note: "Đoán theo trực giác, không giải hệ phương trình. Kết quả số không khớp ràng buộc pudding = trân châu + thạch.",
};

// Reasoning model — dấu vết suy luận chi tiết
const REASONING_TRACE: ReasoningTrace[] = [
  {
    id: "r1",
    step: 1,
    kind: "plan",
    content:
      "Đặt biến: gọi x = số ly trân châu, y = số ly pudding, z = số ly thạch. Mình có 3 ràng buộc: tổng số ly, tổng doanh thu, và điều kiện pudding = trân châu + thạch. Đây là hệ 3 phương trình 3 ẩn — giải được.",
  },
  {
    id: "r2",
    step: 2,
    kind: "compute",
    content:
      "Viết hệ: (1) x + y + z = 120. (2) 35x + 42y + 38z = 4620 (đơn vị nghìn đồng). (3) y = x + z.",
  },
  {
    id: "r3",
    step: 3,
    kind: "compute",
    content:
      "Thế (3) vào (1): x + (x + z) + z = 120 → 2x + 2z = 120 → x + z = 60, nên y = 60.",
  },
  {
    id: "r4",
    step: 4,
    kind: "compute",
    content:
      "Thế y = 60 và z = 60 - x vào (2): 35x + 42·60 + 38(60 - x) = 4620 → 35x + 2520 + 2280 - 38x = 4620 → -3x + 4800 = 4620 → -3x = -180 → x = 60.",
  },
  {
    id: "r5",
    step: 5,
    kind: "check",
    content:
      "Hmm, x = 60 nhưng x + z = 60 → z = 0. Kiểm tra: tổng = 60 + 60 + 0 = 120 ✓, doanh thu = 60·35 + 60·42 + 0·38 = 2100 + 2520 = 4620 ✓, pudding = 60 = 60 + 0 = x + z ✓.",
  },
  {
    id: "r6",
    step: 6,
    kind: "revise",
    content:
      "Đáp án hợp lệ toán học nhưng z = 0 có vẻ lạ. Xem lại đề — không có ràng buộc mỗi loại > 0. Kết quả vẫn đúng; có thể hôm nay thạch hết từ sáng.",
  },
  {
    id: "r7",
    step: 7,
    kind: "answer",
    content:
      "Trân châu: 60 ly. Pudding: 60 ly. Thạch: 0 ly. (Với giả định có thể hết hàng.) Nếu đề yêu cầu z > 0, thì cần thêm ràng buộc.",
  },
];

// So sánh các mô hình
const MODELS: ModelProfile[] = [
  {
    name: "GPT-4o (standard)",
    family: "Non-reasoning LLM",
    thinkTokens: 0,
    answerTokens: 180,
    accAime: 9,
    accMath500: 76,
    accGpqa: 50,
    latencySec: 2,
    costPerCall: 0.008,
    note: "Trả lời trực tiếp — nhanh nhưng kém chính xác trên bài toán nhiều bước.",
  },
  {
    name: "OpenAI o1",
    family: "Reasoning (covert)",
    thinkTokens: 15000,
    answerTokens: 300,
    accAime: 74,
    accMath500: 94,
    accGpqa: 77,
    latencySec: 45,
    costPerCall: 0.9,
    note: "Thinking tokens ẩn — API trả summary. Train bằng large-scale RL trên reasoning traces.",
  },
  {
    name: "OpenAI o3",
    family: "Reasoning",
    thinkTokens: 30000,
    answerTokens: 350,
    accAime: 96,
    accMath500: 97,
    accGpqa: 87,
    latencySec: 180,
    costPerCall: 5,
    note: "Tăng test-time compute cực lớn. Có chế độ high/medium/low effort để cân bằng chi phí.",
  },
  {
    name: "DeepSeek-R1",
    family: "Reasoning open-weight",
    thinkTokens: 12000,
    answerTokens: 280,
    accAime: 79,
    accMath500: 97,
    accGpqa: 71,
    latencySec: 60,
    costPerCall: 0.1,
    note: "Open weights. Huấn luyện GRPO thay vì PPO. Thinking trace minh bạch trong <think>...</think>.",
  },
];

const TOTAL_STEPS = 8;

// ---------------------------------------------------------------------------
// QUIZ — 8 câu theo yêu cầu
// ---------------------------------------------------------------------------

function buildQuiz(): QuizQuestion[] {
  return [
    {
      question:
        "Điểm khác biệt cốt lõi giữa reasoning model (o1, DeepSeek-R1) và LLM thường (GPT-4o)?",
      options: [
        "Reasoning model có nhiều tham số hơn gấp 10 lần",
        "Reasoning model sinh chuỗi reasoning tokens (chain-of-thought) nội bộ trước khi xuất đáp án",
        "Reasoning model không dùng Transformer",
        "Reasoning model chỉ hoạt động với toán",
      ],
      correct: 1,
      explanation:
        "Đặc trưng của reasoning model là dành token lúc INFERENCE để 'suy nghĩ' — thinking trace dài (hàng nghìn token) trước khi đưa ra câu trả lời cuối. Đây là test-time compute, không phải tăng parameter.",
    },
    {
      question:
        "Scaling law cho reasoning model khác scaling law truyền thống thế nào?",
      options: [
        "Không thêm yếu tố nào mới — chỉ là phiên bản mới",
        "Thêm trục test-time compute: chất lượng ∝ log(training compute) + log(test-time compute)",
        "Thay thế hoàn toàn training compute bằng test-time compute",
        "Chất lượng giảm khi tăng test-time compute",
      ],
      correct: 1,
      explanation:
        "Paper o1 và các khảo sát 2024–2025 cho thấy: với cùng base model, thêm thinking tokens làm chất lượng tăng tuyến tính theo log của thinking budget. Hai trục độc lập — bạn có thể đánh đổi train compute với test-time compute.",
    },
    {
      question: "Khi nào KHÔNG nên dùng reasoning model?",
      options: [
        "Bài toán olympic IMO",
        "Câu hỏi factual đơn giản: 'Thủ đô Việt Nam là gì?'",
        "Viết code giải thuật phức tạp",
        "Phân tích bài báo khoa học",
      ],
      correct: 1,
      explanation:
        "Factual đơn giản không cần suy luận — model thường trả lời đúng ngay. Dùng reasoning model sẽ tốn 10–100× chi phí mà chất lượng không khác. Routing thông minh (cheap model cho câu dễ, reasoning cho câu khó) là chìa khoá kinh tế.",
    },
    {
      question:
        "Process Reward Model (PRM) khác Outcome Reward Model (ORM) thế nào?",
      options: [
        "PRM đánh giá từng bước suy luận; ORM chỉ đánh giá đáp án cuối",
        "PRM rẻ hơn ORM vì ít data",
        "PRM chỉ dùng cho code, ORM cho toán",
        "Chúng giống nhau",
      ],
      correct: 0,
      explanation:
        "ORM: reward = 1 nếu đáp án cuối đúng, 0 nếu sai — model có thể 'đoán đúng sai cách'. PRM: chấm điểm từng bước (bước nào logic, bước nào sai), dạy model 'suy nghĩ đúng cách'. PRM chất lượng hơn nhưng cần annotate từng bước — đắt.",
    },
    {
      question:
        "Một câu hỏi sinh 8.000 thinking tokens + 200 answer tokens. Giá thinking $0.15/1M và answer $0.60/1M. Chi phí mỗi câu?",
      options: [
        "$0.0012 thinking + $0.00012 answer ≈ $0.0013",
        "$0.012 thinking + $0.0012 answer ≈ $0.013",
        "$1.20 thinking + $0.12 answer ≈ $1.32",
        "Không tính được — tuỳ nhà cung cấp",
      ],
      correct: 1,
      explanation:
        "Thinking: 8.000 × $0.15 / 1.000.000 = $0.0012. Answer: 200 × $0.60 / 1.000.000 = $0.00012. Lưu ý câu này là thí dụ đơn vị /1M; chi phí thực tế với o1/o3 cao hơn nhiều vì giá thinking ~ $3–60/1M tuỳ tier.",
    },
    {
      question:
        "DeepSeek-R1 dùng GRPO thay PPO — khác biệt chính là gì?",
      options: [
        "GRPO tăng kích thước model",
        "GRPO bỏ critic network — dùng nhóm output ranking làm advantage",
        "GRPO không dùng reinforcement learning",
        "GRPO yêu cầu human feedback nhiều hơn",
      ],
      correct: 1,
      explanation:
        "GRPO (Group Relative Policy Optimization) không train critic model riêng. Thay vào đó, sample K output cho cùng 1 prompt, tính reward từng output, normalize trong nhóm → dùng làm advantage. Đơn giản hơn PPO, tiết kiệm 30–50% GPU.",
    },
    {
      question: "Nguyên nhân chính khiến thinking trace tăng tính tin cậy?",
      options: [
        "Nó làm model chậm đi nên ít lỗi hơn",
        "Mỗi bước phân tích là một token sequence, cho phép kiểm tra, backtrack và decompose — giảm nguy cơ sai một cú",
        "Thinking trace được post-process bằng rule-based",
        "Thinking trace tự động được con người kiểm duyệt",
      ],
      correct: 1,
      explanation:
        "Reasoning model có thể tự kiểm tra (verify), phát hiện mâu thuẫn, thử hướng khác (backtrack), hoặc chia bài phức tạp thành bài con (decompose). Đây là những thao tác nhận thức mà một forward pass không thể thực hiện.",
    },
    {
      type: "fill-blank",
      question:
        "Reasoning model sinh chuỗi {blank} nội bộ trước khi trả lời — quá trình này tiêu tốn {blank} compute, là một dạng scaling thứ hai bên cạnh training compute.",
      blanks: [
        {
          answer: "chain-of-thought",
          accept: ["cot", "suy luận", "chain of thought", "reasoning"],
        },
        {
          answer: "test-time",
          accept: ["inference-time", "inference time", "test time"],
        },
      ],
      explanation:
        "Chain-of-thought là chuỗi suy luận nội bộ; test-time compute là loại compute tiêu thụ lúc inference (khác với training compute dùng lúc train). Đây là hai khái niệm trung tâm của reasoning models.",
    },
  ];
}

// ---------------------------------------------------------------------------
// HELPER — phân loại màu theo kind
// ---------------------------------------------------------------------------

function kindLabel(kind: ReasoningTrace["kind"]): {
  label: string;
  color: string;
  bg: string;
} {
  switch (kind) {
    case "plan":
      return {
        label: "Lập kế hoạch",
        color: "text-blue-300",
        bg: "bg-blue-500/10 border-blue-500/30",
      };
    case "compute":
      return {
        label: "Tính toán",
        color: "text-cyan-300",
        bg: "bg-cyan-500/10 border-cyan-500/30",
      };
    case "check":
      return {
        label: "Kiểm tra",
        color: "text-green-300",
        bg: "bg-green-500/10 border-green-500/30",
      };
    case "revise":
      return {
        label: "Sửa đổi",
        color: "text-amber-300",
        bg: "bg-amber-500/10 border-amber-500/30",
      };
    case "answer":
      return {
        label: "Đáp án",
        color: "text-purple-300",
        bg: "bg-purple-500/10 border-purple-500/30",
      };
  }
}

// ---------------------------------------------------------------------------
// COMPONENT chính
// ---------------------------------------------------------------------------

export default function ReasoningModelsTopic() {
  const [showTrace, setShowTrace] = useState(false);
  const [selectedModel, setSelectedModel] = useState(1); // o1 mặc định
  const [effortBudget, setEffortBudget] = useState(2000); // tokens

  const quiz = useMemo(() => buildQuiz(), []);
  const model = MODELS[selectedModel];

  // Đường cong test-time compute: 1 − exp(−k·log(budget))
  const points = useMemo(() => {
    const budgets = [50, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
    // Base accuracy thấp; mỗi log-decade cộng ~10 điểm
    return budgets.map((b) => {
      const acc = 20 + 12 * Math.log10(b); // smoothed
      return { budget: b, acc: Math.min(99, acc) };
    });
  }, []);

  const currentAcc = useMemo(() => {
    return Math.min(99, 20 + 12 * Math.log10(Math.max(50, effortBudget)));
  }, [effortBudget]);

  return (
    <>
      {/* ================================================================
           BƯỚC 1 — DỰ ĐOÁN
           ================================================================ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bài toán: 'Có 5 người xếp hàng. An đứng sau Bình, Cường đứng trước An, Dung đứng cuối. Ai đứng thứ 2?' LLM thường trả lời trong 0.5s. Reasoning model nghĩ 30s. Ai đúng hơn?"
          options={[
            "LLM thường — trả lời nhanh là hay",
            "Reasoning model — bài logic cần phân tích từng bước, không đoán được",
            "Cả hai đều đúng vì bài đơn giản",
            "Phải có con người kiểm tra mới biết",
          ]}
          correct={1}
          explanation="Bài logic nhiều ràng buộc cần suy luận từng bước. LLM thường đoán sai vì 'nhìn pattern' thay vì 'suy nghĩ'. Reasoning model sắp xếp: An sau Bình → Bình...An; Cường trước An → ...Cường...An; Dung cuối → Bình, Cường, An, ?, Dung. Giống thi tự luận vs trắc nghiệm."
        >
          <p className="mt-2 text-sm text-muted">
            Trong bài này bạn sẽ xem chính dấu vết suy luận (thinking trace)
            của một mô hình reasoning, hiểu cơ chế test-time compute, và so
            sánh o1, o3, DeepSeek-R1.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ================================================================
           BƯỚC 2 — ẨN DỤ
           ================================================================ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ thực tế">
        <p>
          LLM thường giống một học sinh làm <strong>bài trắc nghiệm</strong>:
          đọc câu hỏi, chọn đáp án ngay. Tốc độ là ưu tiên; nhìn pattern tốt
          sẽ đúng nhanh. Nhưng với bài yêu cầu 5–10 bước suy luận, phương
          pháp này giống như đoán — đôi khi may mắn, đôi khi sai tinh vi.
        </p>
        <p>
          Reasoning model giống học sinh làm <strong>bài tự luận</strong>:
          đọc đề, <em>viết nháp</em> — đặt biến, lập phương trình, tính từng
          bước, kiểm tra, sửa nếu sai, rồi mới viết đáp án. Bản nháp đó
          không dài vì xấu — nó dài vì <em>cần thiết</em>. Giống một người
          thợ mộc đo hai lần, cắt một lần.
        </p>
        <p>
          Một cách nhìn khác: hãy nghĩ tới <strong>một bác sĩ chẩn đoán</strong>.
          Ca nhẹ (cảm cúm) — nhìn triệu chứng, kê đơn trong 2 phút. Ca phức
          tạp (triệu chứng mâu thuẫn) — bác sĩ dừng lại, <em>nói to suy nghĩ
          của mình</em>: "nếu là A thì phải thấy B, nhưng B không có, vậy
          không phải A; hoặc là C, kiểm tra lại bằng xét nghiệm...". Quá
          trình đó chính là chain-of-thought.
        </p>
        <p>
          Bước nhảy vọt của AI không phải là "biết nhiều hơn" mà là{" "}
          <strong>biết suy nghĩ</strong>. Và giống sinh viên giỏi, reasoning
          model <em>không cần viết 10 trang cho câu hỏi đơn giản</em> — nó
          nên biết khi nào dừng. Đây chính là lý do routing (chọn model tuỳ
          độ khó) là chìa khoá kinh tế trong thực tế.
        </p>
        <p>
          Nếu không có khả năng suy luận, mô hình chỉ là một bộ nhớ khổng
          lồ biết pattern — giỏi nhớ, dở tư duy. Reasoning models là bước
          đầu tiên khiến AI có thể đối mặt với những vấn đề{" "}
          <em>ngoài phân bố</em> training data: các biến thể mới, các kết
          hợp chưa từng thấy, các bài toán olympic thật sự. Đó là thông điệp
          lớn nhất của o1, o3 và DeepSeek-R1 trong làn sóng 2024–2025.
        </p>
      </LessonSection>

      {/* ================================================================
           BƯỚC 3 — VISUALIZATION TƯƠNG TÁC
           ================================================================ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            {/* ── Problem + câu trả lời standard ── */}
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">
                Bài toán:
              </p>
              <p className="text-sm leading-relaxed text-foreground/90">
                {PROBLEM_VI}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Standard LLM */}
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-red-300">
                    LLM thường (GPT-4o)
                  </p>
                  <span className="text-xs text-red-300/80">~ 2s · 180 tk</span>
                </div>
                <p className="text-xs leading-relaxed text-foreground/85">
                  {STANDARD_ANSWER.answer}
                </p>
                <p className="mt-2 text-xs text-red-300">
                  ✗ {STANDARD_ANSWER.note}
                </p>
              </div>

              {/* Reasoning Model */}
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-green-300">
                    Reasoning model (o1 / R1)
                  </p>
                  <span className="text-xs text-green-300/80">
                    ~ 45s · 15K thinking tokens
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-foreground/85">
                  Đáp án: Trân châu 60, Pudding 60, Thạch 0. Giải bằng hệ
                  phương trình 3 ẩn và kiểm tra chéo cả 3 ràng buộc.
                </p>
                <button
                  onClick={() => setShowTrace(!showTrace)}
                  className="mt-3 rounded-md border border-green-500/50 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-300 transition-colors hover:bg-green-500/20"
                >
                  {showTrace ? "Ẩn" : "Hiện"} thinking trace (
                  {REASONING_TRACE.length} bước)
                </button>
              </div>
            </div>

            {/* ── Thinking trace expanded ── */}
            {showTrace && (
              <div className="rounded-lg border border-border bg-background/80 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
                  <p className="text-sm font-semibold text-foreground">
                    &lt;think&gt;...&lt;/think&gt; — dấu vết suy luận
                  </p>
                </div>
                <div className="space-y-2">
                  {REASONING_TRACE.map((t) => {
                    const k = kindLabel(t.kind);
                    return (
                      <div
                        key={t.id}
                        className={`rounded-md border p-3 text-xs ${k.bg}`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-mono text-muted">
                            Bước {t.step}
                          </span>
                          <span className={`font-semibold ${k.color}`}>
                            {k.label}
                          </span>
                        </div>
                        <p className="leading-relaxed text-foreground/90">
                          {t.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-muted">
                  Lưu ý bước 6 — model <em>tự nghi ngờ</em> đáp án z = 0, đọc
                  lại đề, xác nhận không có ràng buộc z &gt; 0. Đó chính là
                  self-verification — thứ LLM thường không làm.
                </p>
              </div>
            )}

            {/* ── Test-time compute scaling curve ── */}
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Test-time compute scaling — thinking tokens vs accuracy
              </p>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">
                  Ngân sách thinking tokens:
                </span>
                {[200, 1000, 5000, 20000].map((b) => (
                  <button
                    key={b}
                    onClick={() => setEffortBudget(b)}
                    className={`rounded-md px-2 py-1 text-xs ${
                      effortBudget === b
                        ? "bg-accent text-white"
                        : "bg-card border border-border text-muted"
                    }`}
                  >
                    {b.toLocaleString()}
                  </button>
                ))}
              </div>

              <svg
                viewBox="0 0 600 250"
                className="w-full max-w-2xl mx-auto"
                role="img"
                aria-label="Đường cong scaling test-time compute"
              >
                {/* Grid */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <g key={y}>
                    <line
                      x1="50"
                      x2="570"
                      y1={220 - y * 1.8}
                      y2={220 - y * 1.8}
                      stroke="#1e293b"
                      strokeWidth="0.5"
                    />
                    <text
                      x="45"
                      y={224 - y * 1.8}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="11"
                    >
                      {y}%
                    </text>
                  </g>
                ))}

                {/* X axis labels (log scale) */}
                {points.map((p, i) => (
                  <text
                    key={i}
                    x={50 + (i / (points.length - 1)) * 520}
                    y="240"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="11"
                  >
                    {p.budget >= 1000
                      ? `${p.budget / 1000}K`
                      : p.budget}
                  </text>
                ))}

                {/* Curve */}
                <polyline
                  points={points
                    .map(
                      (p, i) =>
                        `${50 + (i / (points.length - 1)) * 520},${220 - p.acc * 1.8}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                />

                {/* Points */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={50 + (i / (points.length - 1)) * 520}
                    cy={220 - p.acc * 1.8}
                    r="3"
                    fill="#22c55e"
                  />
                ))}

                {/* Current budget marker */}
                {(() => {
                  const idx = points.findIndex((p) => p.budget >= effortBudget);
                  const safeIdx = idx === -1 ? points.length - 1 : idx;
                  const x = 50 + (safeIdx / (points.length - 1)) * 520;
                  return (
                    <g>
                      <line
                        x1={x}
                        x2={x}
                        y1="20"
                        y2="220"
                        stroke="#f59e0b"
                        strokeWidth="1"
                        strokeDasharray="4 3"
                      />
                      <circle
                        cx={x}
                        cy={220 - currentAcc * 1.8}
                        r="5"
                        fill="#f59e0b"
                      />
                      <text
                        x={x + 8}
                        y={220 - currentAcc * 1.8}
                        fill="#fbbf24"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {currentAcc.toFixed(0)}% acc
                      </text>
                    </g>
                  );
                })()}

                <text
                  x="310"
                  y="15"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                >
                  Accuracy ∝ log(test-time compute) — cùng model, thêm
                  thinking = tốt hơn.
                </text>
              </svg>
            </div>

            {/* ── So sánh model ── */}
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">
                So sánh: reasoning vs non-reasoning
              </p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {MODELS.map((m, i) => (
                  <button
                    key={m.name}
                    onClick={() => setSelectedModel(i)}
                    className={`rounded-lg border p-3 text-left text-xs transition-colors ${
                      selectedModel === i
                        ? "border-accent bg-accent/10"
                        : "border-border bg-background/40"
                    }`}
                  >
                    <div className="font-semibold text-foreground">
                      {m.name}
                    </div>
                    <div className="text-muted">{m.family}</div>
                    <div className="mt-2 flex justify-between">
                      <span className="text-muted">AIME&apos;24</span>
                      <span className="text-green-400">{m.accAime}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">MATH-500</span>
                      <span className="text-green-400">{m.accMath500}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">GPQA</span>
                      <span className="text-green-400">{m.accGpqa}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Latency</span>
                      <span className="text-amber-400">{m.latencySec}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Cost/call</span>
                      <span className="text-amber-400">
                        ${m.costPerCall.toFixed(3)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-border bg-background/80 p-3 text-xs">
                <p className="font-semibold text-foreground">{model.name}</p>
                <p className="mt-1 text-muted">{model.note}</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-muted">Thinking tokens:</span>
                    <p className="font-mono text-blue-300">
                      {model.thinkTokens.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted">Answer tokens:</span>
                    <p className="font-mono text-purple-300">
                      {model.answerTokens}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted">Tỷ lệ think/ans:</span>
                    <p className="font-mono text-amber-300">
                      {model.thinkTokens === 0
                        ? "—"
                        : (model.thinkTokens / model.answerTokens).toFixed(0) +
                          "×"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-red-500/30 bg-background/50 p-3">
                <p className="text-sm font-semibold text-red-300">
                  Non-reasoning LLM
                </p>
                <p className="text-xs text-muted">
                  Một forward pass sinh đáp án. Nhanh, rẻ, nhưng dễ sai trên
                  bài nhiều bước. Tốt cho Q&amp;A factual, chat casual,
                  classification.
                </p>
              </div>
              <div className="rounded-lg border border-green-500/30 bg-background/50 p-3">
                <p className="text-sm font-semibold text-green-300">
                  Reasoning LLM
                </p>
                <p className="text-xs text-muted">
                  Sinh thinking trace (100s–1000s tokens) rồi mới answer.
                  Chậm, đắt hơn 10–100×, nhưng vượt trội trên toán, code
                  phức tạp, logic, planning.
                </p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ================================================================
           BƯỚC 4 — AHA MOMENT
           ================================================================ */}
      <LessonSection
        step={4}
        totalSteps={TOTAL_STEPS}
        label="Khoảnh khắc Aha"
      >
        <AhaMoment>
          <p>
            LLM thường = <strong>thi trắc nghiệm</strong> (nhìn câu hỏi, đoán
            ngay). Reasoning model = <strong>thi tự luận</strong> (phân
            tích, viết lời giải, kiểm tra lại). Bước nhảy vọt: AI không chỉ
            "biết nhiều" mà bắt đầu <strong>"biết suy nghĩ"</strong>. Nhưng
            giống một sinh viên giỏi, bí quyết là biết <em>khi nào</em> cần
            dành 10 trang — và khi nào một câu là đủ.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ================================================================
           BƯỚC 5 — 2 INLINE CHALLENGE
           ================================================================ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách 1">
        <InlineChallenge
          question="Model reasoning sinh 2.000 thinking tokens + 200 answer tokens cho mỗi câu hỏi. Bạn phục vụ 10.000 requests/ngày. Thinking tokens tốn $0.15/1M, output tokens $0.60/1M. Chi phí thinking vs output?"
          options={[
            "Thinking: $0.03/ngày. Output: $0.012/ngày — vài xu, bỏ qua",
            "Thinking: $3/ngày (71%). Output: $1.2/ngày (29%). Thinking chiếm phần lớn vì số lượng tokens lớn",
            "Output đắt hơn vì giá per token cao hơn",
            "Bằng nhau vì tổng bằng 2.200 tokens × ngày",
          ]}
          correct={1}
          explanation="Thinking: 10.000 × 2.000 × $0.15 / 1M = $3. Output: 10.000 × 200 × $0.60 / 1M = $1.2. Thinking chiếm 71% chi phí dù giá per token rẻ hơn — vì SỐ LƯỢNG token lớn hơn 10×. Đây là lý do cần routing: chỉ dùng reasoning cho câu khó!"
        />
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách 2">
        <InlineChallenge
          question="Bạn xây trợ lý học sinh. Khoảng 80% câu là Q&A factual đơn giản, 20% là bài toán nhiều bước. Chiến lược nào tối ưu chi phí × chất lượng?"
          options={[
            "Dùng o3 cho tất cả — chất lượng cao nhất",
            "Dùng GPT-4o cho tất cả — rẻ nhất",
            "Classifier nhẹ phân loại câu hỏi → GPT-4o cho câu factual, reasoning model (o1 / R1) cho câu cần suy luận",
            "Luôn chạy cả hai model song song và lấy đáp án dài hơn",
          ]}
          correct={2}
          explanation="Routing là chiến lược chuẩn: (1) Một classifier nhẹ (embedding + vài rule / logistic) phân loại câu hỏi. (2) Câu factual dùng model rẻ. (3) Câu khó dùng reasoning. Kết quả: chi phí trung bình giảm 5–10×, chất lượng gần như không đổi vì 80% câu vốn không cần reasoning. 'Luôn dùng mạnh nhất' là anti-pattern — lãng phí tài nguyên và làm user phải chờ vô ích."
        />
      </LessonSection>

      {/* ================================================================
           BƯỚC 6 — EXPLANATION SÂU
           ================================================================ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Mô hình suy luận (Reasoning Models)</strong> như o1/o3
            (OpenAI), DeepSeek-R1 và Claude với extended thinking là một
            paradigm mới: tăng{" "}
            <TopicLink slug="test-time-compute">test-time compute</TopicLink>{" "}
            (compute tại thời điểm inference) thay vì chỉ tăng training
            compute. Cốt lõi là sinh chuỗi{" "}
            <TopicLink slug="chain-of-thought">chain-of-thought</TopicLink>{" "}
            nội bộ, rất dài (hàng nghìn đến hàng chục nghìn tokens), trước
            khi xuất đáp án cuối. DeepSeek-R1 còn được train bằng{" "}
            <TopicLink slug="grpo">GRPO</TopicLink> — một biến thể PPO không
            cần critic.
          </p>

          <p>
            <strong>Định nghĩa hình thức.</strong> Gọi <em>x</em> là prompt,
            <em>y</em> là đáp án cuối, <em>z</em> là thinking trace ẩn. LLM
            thường mô hình:
          </p>
          <LaTeX block>{"p(y \\mid x)"}</LaTeX>
          <p className="text-sm text-muted">
            Reasoning model mô hình có biến ẩn trung gian:
          </p>
          <LaTeX block>
            {"p(y \\mid x) = \\sum_{z} p(z \\mid x) \\cdot p(y \\mid x, z)"}
          </LaTeX>
          <p className="text-sm text-muted">
            Trong thực tế, thay vì cộng tất cả <em>z</em>, model sample một{" "}
            <em>z</em> bằng autoregressive decoding (có thể hàng nghìn token),
            rồi condition <em>y</em> trên cả <em>x</em> và <em>z</em>. Khi{" "}
            <em>z</em> đủ dài và đúng hướng, <em>p(y | x, z)</em> chính xác
            hơn nhiều so với <em>p(y | x)</em> trực tiếp.
          </p>

          <p>
            <strong>Scaling laws cũ vs mới.</strong> Trục scaling thứ hai là
            một trong những phát hiện lớn nhất của o1:
          </p>
          <LaTeX block>
            {
              "\\text{Cũ: } \\text{Accuracy} \\propto \\log(\\text{Training Compute})"
            }
          </LaTeX>
          <LaTeX block>
            {
              "\\text{Mới: } \\text{Accuracy} \\propto \\log(\\text{Training}) + \\log(\\text{Test-time Compute})"
            }
          </LaTeX>

          <p>
            <strong>Cơ chế cốt lõi.</strong> Bốn "thao tác nhận thức" mà
            thinking trace cho phép:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Decomposition:</strong> chia bài lớn thành bài con —
              giải hệ → đặt biến → viết phương trình → thế → rút.
            </li>
            <li>
              <strong>Self-verification:</strong> kiểm tra đáp án vừa tính
              ngược trở lại các ràng buộc ban đầu.
            </li>
            <li>
              <strong>Backtracking:</strong> phát hiện mâu thuẫn → thử hướng
              khác thay vì ép đưa ra đáp án sai.
            </li>
            <li>
              <strong>Analogical reasoning:</strong> nhận ra bài này giống
              một bài khác đã biết → áp dụng công thức / strategy tương tự.
            </li>
          </ul>

          <Callout variant="tip" title="Process vs Outcome Reward Model">
            <p>
              <strong>Outcome Reward Model (ORM):</strong> chỉ cho reward ở
              đáp án cuối. Đơn giản, dễ thu data — nhưng model có thể "đoán
              đúng sai cách", trace kém chất lượng.
            </p>
            <p>
              <strong>Process Reward Model (PRM):</strong> chấm điểm{" "}
              <em>từng bước</em>. Dạy model suy nghĩ đúng, không chỉ ra đúng.
              Nhưng data đắt: cần annotate từng bước trong trace.
            </p>
            <p>
              Thực tế: kết hợp cả hai — ORM cho bulk data từ test suite, PRM
              cho data chất lượng cao từ expert annotators.
            </p>
          </Callout>

          <Callout variant="warning" title="3 cạm bẫy với reasoning models">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>"Luôn bật reasoning" là anti-pattern.</strong> Câu
                hỏi factual đơn giản không cần — bạn sẽ tốn 10–100× chi phí
                mà không được gì.
              </li>
              <li>
                <strong>Context window bị ăn bởi thinking.</strong> Thinking
                trace nằm trong context → với 100K context limit, reasoning
                model có thể chỉ còn 50K cho input thực.
              </li>
              <li>
                <strong>Hallucination trong trace.</strong> Model có thể suy
                luận rất mạch lạc tới một bước sai, rồi xây kết luận trên đó.
                Trace dài <em>không</em> đảm bảo đúng — chỉ tăng xác suất.
              </li>
            </ul>
          </Callout>

          <Callout variant="info" title="GRPO vs PPO — điểm khác biệt">
            DeepSeek-R1 dùng GRPO (Group Relative Policy Optimization) thay
            PPO. Thay vì huấn luyện một critic network riêng để ước lượng
            value, GRPO sample K output cho cùng 1 prompt, tính reward từng
            output bằng rule-based (đáp án đúng/sai, format đúng/sai),
            normalize trong nhóm → dùng làm advantage. Không cần critic →
            tiết kiệm 30–50% memory và compute. Bất ngờ: chất lượng gần
            ngang PPO trên nhiều benchmark.
          </Callout>

          <Callout variant="insight" title="Emergent behaviours của reasoning">
            R1 và o1 cho thấy những hành vi không được dạy trực tiếp: nhận
            ra "chờ đã, mình đang sai", dịch bài toán sang ngôn ngữ formal
            (algebra), thử nhiều approach song song rồi so sánh. DeepSeek
            paper gọi hiện tượng này là <em>"aha moment"</em> — xuất hiện
            tự nhiên trong quá trình RL khi reward dài hạn buộc model khám
            phá.
          </Callout>

          <p>
            <strong>Training pipeline tiêu biểu.</strong>
          </p>
          <LaTeX block>
            {
              "\\mathcal{L} = \\underbrace{\\mathcal{L}_{\\text{SFT}}}_{\\text{Supervised CoT}} + \\underbrace{\\lambda \\cdot \\mathcal{L}_{\\text{RL}}}_{\\text{Reinforcement (PRM/ORM)}}"
            }
          </LaTeX>
          <p>
            Bước 1: <em>SFT</em> trên corpus thinking trace (có thể từ
            expert, distilled từ model mạnh, hoặc R1-Zero style —{" "}
            <em>không</em> có SFT, chỉ RL từ base). Bước 2: <em>RL</em> với
            PRM/ORM — model tự khám phá chiến lược mới, xuất hiện hành vi
            phản xạ như "wait", "let me check", v.v.
          </p>

          <p>
            <strong>Code mẫu 1 — Claude extended thinking API.</strong>
          </p>
          <CodeBlock
            language="python"
            title="Anthropic SDK — extended thinking"
          >
            {`# pip install anthropic
import anthropic

client = anthropic.Anthropic()

# Standard — trả lời nhanh
standard = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Giải hệ: x+y+z=120; 35x+42y+38z=4620; y=x+z"}
    ],
)
# Latency ~1s, cost ~$0.01

# Extended thinking — bật thinking budget
reasoning = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000,  # tối đa 10K thinking tokens
    },
    messages=[
        {"role": "user", "content": "Giải hệ: x+y+z=120; 35x+42y+38z=4620; y=x+z"}
    ],
)
# Latency ~15s, cost ~$0.30
# Accuracy trên bài logic: 95% vs 55%

# Inspect thinking
for block in reasoning.content:
    if block.type == "thinking":
        print("THINKING:", block.thinking[:200], "...")
    elif block.type == "text":
        print("ANSWER:", block.text)

# Tip: dùng stream=True để xem thinking trực tiếp
# Tip: thinking budget càng cao, accuracy càng tăng (đến một ngưỡng)`}
          </CodeBlock>

          <p>
            <strong>Code mẫu 2 — Routing thông minh.</strong> Trong production,
            routing là đòn bẩy chi phí lớn nhất. Ví dụ heuristic đơn giản
            phân loại câu hỏi cần reasoning hay không:
          </p>
          <CodeBlock
            language="python"
            title="Simple reasoning router"
          >
            {`import re
from openai import OpenAI

client = OpenAI()

REASONING_TRIGGERS = [
    r"\\bprove\\b", r"\\bchứng minh\\b", r"\\bgiải hệ\\b",
    r"thuật toán", r"độ phức tạp", r"logic",
    r"\\d+\\s*[+\\-*/]\\s*\\d+",  # có biểu thức số học
    r"bước", r"tại sao",
]

def needs_reasoning(prompt: str) -> bool:
    """Heuristic: bật reasoning nếu câu hỏi có tín hiệu phân tích."""
    low = prompt.lower()
    score = sum(1 for pat in REASONING_TRIGGERS if re.search(pat, low))
    return score >= 2 or len(prompt) > 400

def answer(prompt: str) -> str:
    if needs_reasoning(prompt):
        # Câu khó → reasoning model
        resp = client.chat.completions.create(
            model="o1-mini",  # hoặc "o3-mini", "deepseek-reasoner"
            messages=[{"role": "user", "content": prompt}],
            # o-series không hỗ trợ system prompt & temperature
        )
    else:
        # Câu dễ → fast model
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
    return resp.choices[0].message.content

# Trong thực tế: thay regex heuristic bằng classifier
#   (embedding → logistic regression) để chính xác hơn.`}
          </CodeBlock>

          <CollapsibleDetail title="Chi tiết: GRPO — biến thể PPO không critic">
            <p>
              PPO truyền thống cần 4 model trong memory cùng lúc: policy,
              reference policy, reward model, critic. Rất tốn GPU. GRPO bỏ
              critic.
            </p>
            <p>Với mỗi prompt q:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm pl-2">
              <li>Sample K output {"{o_1, ..., o_K}"} từ policy hiện tại.</li>
              <li>Tính reward r_i cho mỗi o_i (rule-based hoặc RM).</li>
              <li>
                Normalize trong nhóm: A_i = (r_i − mean) / std. Đó là
                advantage.
              </li>
              <li>
                Update policy với loss PPO-clip sử dụng A_i — không cần
                critic ước lượng value.
              </li>
            </ol>
            <p>
              Kết quả: tiết kiệm 30–50% memory và compute, code đơn giản
              hơn nhiều, và DeepSeek chứng minh chất lượng ngang PPO trên
              reasoning tasks. Đây là một trong những lý do R1 huấn luyện
              được với budget thấp hơn OpenAI nhiều.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Nâng cao: R1-Zero và emergent 'aha'">
            <p>
              DeepSeek paper R1 giới thiệu hai model: R1-Zero (chỉ RL,
              không SFT) và R1 (SFT + RL). R1-Zero bắt đầu từ base model và
              chạy RL thuần với reward rule-based (đúng/sai đáp án, đúng
              format).
            </p>
            <p>
              Ngạc nhiên là R1-Zero tự phát triển hành vi "aha": trong
              trace xuất hiện các phrase như <em>"wait"</em>, <em>"let me
              reconsider"</em>, <em>"that doesn't seem right"</em>. Những
              hành vi này không có trong training data — xuất hiện tự nhiên
              như policy tối ưu của môi trường RL mà reward đòi hỏi đáp án
              đúng cuối cùng.
            </p>
            <p>
              Hệ quả triết học: reasoning không phải kỹ năng được "dạy", mà
              là hành vi được <em>khuyến khích</em> bởi cấu trúc reward.
              Nếu bạn buộc một agent phải đúng trong môi trường khó, nó sẽ
              phát minh ra suy luận.
            </p>
          </CollapsibleDetail>

          <p>
            <strong>Trong thực tế — ứng dụng:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Toán olympic và PhD-level science:</strong> AIME, IMO,
              GPQA Diamond. Reasoning models đạt mức top student.
            </li>
            <li>
              <strong>Coding contests:</strong> o3 đã đạt điểm gần vàng trên
              Codeforces, R1 xếp hạng cao trên LiveCodeBench.
            </li>
            <li>
              <strong>Agent planning:</strong> chia mục tiêu lớn thành
              subgoal, lên kế hoạch nhiều bước, tự kiểm tra tiến độ.
            </li>
            <li>
              <strong>Legal / medical diagnostics:</strong> phân tích dài
              với nhiều ràng buộc, cần truy vết logic.
            </li>
          </ul>

          <p>
            <strong>Khi nào KHÔNG dùng:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              Câu hỏi factual đơn giản — Q&amp;A, trivia, ngày tháng, định
              nghĩa.
            </li>
            <li>Summarization, translation, style transfer — không cần phân tích nhiều bước.</li>
            <li>
              Latency SLA khắt khe (&lt; 2s) — reasoning model thường mất
              10–60s.
            </li>
            <li>
              Streaming UX cần token đầu tiên nhanh — thinking làm TTFT
              (time to first token) tăng 10–100×.
            </li>
          </ul>

          <p>
            Tương lai gần: kỳ vọng thấy router thông minh hơn (model tự
            quyết định bật thinking khi nào), thinking có thể "stream" để
            giảm latency cảm nhận, và các open-weight reasoning models
            (Qwen-Reasoning, Llama-Reasoning) sẽ khép khoảng cách với o-series.
          </p>

          <CollapsibleDetail title="Benchmark tham khảo 2024–2025">
            <p>
              Để có bức tranh định lượng, đây là một vài con số hay gặp
              trong các paper cuối 2024 / đầu 2025 (các số có thể lệch nhẹ
              tuỳ phiên bản):
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                <strong>AIME 2024:</strong> GPT-4o ~9%, o1 ~74%, o3 ~96%,
                DeepSeek-R1 ~79%. Đây là kỳ thi toán Mỹ mời 500 học sinh
                giỏi nhất — o3 đã vượt ngưỡng top học sinh.
              </li>
              <li>
                <strong>MATH-500:</strong> GPT-4o ~76%, các reasoning models
                thường &gt; 94%. Sát trần, bài toán bậc THPT.
              </li>
              <li>
                <strong>GPQA Diamond (PhD science):</strong> GPT-4o ~50%,
                reasoning models 70–87%. Đây là benchmark "Google-proof"
                — không thể tra ra đáp án.
              </li>
              <li>
                <strong>Codeforces rating:</strong> o3 ~ 2700+ (gần mức
                International Grandmaster). GPT-4o ~ 900–1100.
              </li>
            </ul>
            <p>
              Khi chọn model cho production, đừng chỉ nhìn benchmark toán —
              hãy đo trên đúng distribution nhiệm vụ của bạn. Một model mạnh
              AIME có thể yếu trong domain pháp luật hoặc tư vấn khách hàng.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Điều kiện hạ tầng cho reasoning ở production">
            <p>
              Vài điểm thực tế khi triển khai reasoning model:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                <strong>Timeout generous:</strong> đặt timeout &gt;= 120s
                cho o1/o3. Đừng dùng default 30s của HTTP client.
              </li>
              <li>
                <strong>Streaming UX:</strong> cho người dùng biết model
                đang "suy nghĩ" để tránh cảm giác treo. Hiển thị thanh
                progress hoặc loading state rõ ràng.
              </li>
              <li>
                <strong>Cache aggressively:</strong> reasoning rất tốn — cache
                trên (query, context) là cách tiết kiệm dễ nhất.
              </li>
              <li>
                <strong>Budget cap:</strong> luôn đặt max thinking tokens
                hợp lý (thường 4–10K) để tránh runaway cost.
              </li>
            </ul>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ================================================================
           BƯỚC 7 — TÓM TẮT (6 điểm)
           ================================================================ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về Reasoning Models"
          points={[
            "Reasoning models (o1, o3, DeepSeek-R1) tăng test-time compute bằng cách sinh chain-of-thought nội bộ trước khi trả lời.",
            "Scaling law mới: accuracy ∝ log(training compute) + log(test-time compute) — hai trục scaling độc lập.",
            "Thao tác cốt lõi của thinking trace: decomposition, self-verification, backtracking, analogical reasoning.",
            "Process Reward Model (PRM) chấm từng bước suy luận — dạy model 'suy nghĩ đúng cách', khác ORM chỉ chấm đáp án.",
            "GRPO của DeepSeek-R1 bỏ critic network — sample nhóm K output, normalize reward làm advantage, tiết kiệm 30–50% GPU.",
            "Routing là chìa khoá kinh tế: câu dễ dùng GPT-4o, câu khó dùng reasoning — giảm 5–10× chi phí trung bình.",
          ]}
        />
      </LessonSection>

      {/* ================================================================
           BƯỚC 8 — QUIZ (8 câu)
           ================================================================ */}
      <QuizSection questions={quiz} />
    </>
  );
}
