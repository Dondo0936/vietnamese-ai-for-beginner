"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  LessonSection,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "in-context-learning",
  title: "In-Context Learning",
  titleVi: "Học trong ngữ cảnh",
  description:
    "Khả năng LLM học và thực hiện tác vụ mới chỉ từ vài ví dụ trong prompt, không cần huấn luyện lại.",
  category: "llm-concepts",
  tags: ["icl", "few-shot", "zero-shot", "prompt"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "chain-of-thought", "fine-tuning-vs-prompting"],
  vizType: "interactive",
};

// ─── Demo: thêm/bớt ví dụ và thấy output đổi ───
const TASK_EXAMPLES = [
  { input: "Tôi yêu Hà Nội!", output: "Tích cực" },
  { input: "Dịch vụ quá tệ", output: "Tiêu cực" },
  { input: "Bình thường, không có gì đặc biệt", output: "Trung lập" },
  { input: "Phở ở đây ngon nhất Sài Gòn!", output: "Tích cực" },
];

const TEST_INPUT = "Nhân viên thân thiện nhưng đồ ăn hơi lạt";

const AI_OUTPUTS: Record<number, { answer: string; confidence: number; reasoning: string }> = {
  0: {
    answer: "Đây là một nhận xét về trải nghiệm ăn uống tại nhà hàng.",
    confidence: 20,
    reasoning: "Không có ví dụ → AI không biết format mong muốn, trả lời lan man",
  },
  1: {
    answer: "Tiêu cực",
    confidence: 55,
    reasoning: "1 ví dụ → AI hiểu task là phân loại, nhưng chỉ thấy 1 class nên thiên lệch",
  },
  2: {
    answer: "Trung lập (có cả mặt tốt và xấu)",
    confidence: 75,
    reasoning: "2 ví dụ → AI thấy 2 class, bắt đầu phân biệt được tích cực/tiêu cực",
  },
  3: {
    answer: "Trung lập",
    confidence: 88,
    reasoning: "3 ví dụ (gồm cả 'trung lập') → AI hiểu có 3 class, phân loại chính xác hơn",
  },
  4: {
    answer: "Trung lập — nhân viên tốt (tích cực) nhưng đồ ăn lạt (tiêu cực) → cân bằng",
    confidence: 95,
    reasoning: "4 ví dụ → AI hiểu rõ format, 3 class, và cách phân tích cân bằng",
  },
};

const quizQuestions: QuizQuestion[] = [
  {
    question: "In-Context Learning khác gì với fine-tuning?",
    options: [
      "ICL thay đổi trọng số model, fine-tuning không",
      "ICL KHÔNG thay đổi trọng số — chỉ cho ví dụ trong prompt. Fine-tuning thay đổi trọng số vĩnh viễn",
      "ICL cần nhiều dữ liệu hơn fine-tuning",
      "Không khác gì, hai tên cho cùng một thứ",
    ],
    correct: 1,
    explanation: "ICL là 'dạy tạm' qua prompt — model không thay đổi, hiểu biết mất khi prompt hết. Fine-tuning thay đổi trọng số vĩnh viễn.",
  },
  {
    question: "Thêm quá nhiều ví dụ (20-30 ví dụ) vào prompt có tốt không?",
    options: [
      "Càng nhiều càng tốt",
      "Không — tốn context window, tốn tiền, và hiệu quả giảm dần sau 5-10 ví dụ",
      "Không — AI chỉ đọc ví dụ đầu tiên",
      "Tốt nếu ví dụ ngắn",
    ],
    correct: 1,
    explanation: "Hiệu quả ICL tăng nhanh ở 1-5 ví dụ, sau đó diminishing returns. 20-30 ví dụ tốn context window (tiền!) mà cải thiện rất ít. 3-5 ví dụ là sweet spot.",
  },
  {
    question: "AI hoạt động theo mô hình nào khi làm in-context learning?",
    options: [
      "Pattern matching — nhận ra format từ ví dụ và áp dụng cho input mới",
      "Học thuộc lòng — ghi nhớ mọi ví dụ",
      "Search engine — tìm đáp án trên Internet",
      "Random — đoán ngẫu nhiên",
    ],
    correct: 0,
    explanation: "ICL là pattern matching cấp cao: AI nhận ra CẤU TRÚC (input → output) từ ví dụ, rồi áp dụng cấu trúc đó cho input mới. Không ghi nhớ, không tìm kiếm.",
  },
];

export default function InContextLearningTopic() {
  const [numExamples, setNumExamples] = useState(0);

  const activeExamples = TASK_EXAMPLES.slice(0, numExamples);
  const output = AI_OUTPUTS[numExamples];

  const addExample = useCallback(() => {
    if (numExamples < 4) setNumExamples(n => n + 1);
  }, [numExamples]);

  const removeExample = useCallback(() => {
    if (numExamples > 0) setNumExamples(n => n - 1);
  }, [numExamples]);

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <PredictionGate
        question="Bạn muốn AI phân loại cảm xúc review tiếng Việt. Cách nào hiệu quả nhất MÀ KHÔNG CẦN huấn luyện lại model?"
        options={[
          "Viết chương trình if-else kiểm tra từ khóa",
          "Cho AI xem vài ví dụ (review → cảm xúc) ngay trong prompt",
          "Chờ phiên bản AI mới biết tiếng Việt tốt hơn",
        ]}
        correct={1}
        explanation="Chỉ cần cho AI 3-5 ví dụ mẫu ngay trong prompt → nó 'hiểu' task và làm theo! Đây gọi là In-Context Learning — AI 'học' từ ví dụ trong prompt mà không cần thay đổi trọng số."
      >
        <p className="text-sm text-muted mt-4">
          Hãy thử thêm ví dụ từng cái một và xem output AI thay đổi ra sao.
        </p>
      </PredictionGate>

      {/* ━━━ KHÁM PHÁ — Thêm/bớt ví dụ, xem output đổi ━━━ */}
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Thêm ví dụ → Output cải thiện
        </h3>
        <p className="text-sm text-muted mb-4">
          Nhấn &quot;+ Thêm ví dụ&quot; để đưa thêm ví dụ mẫu vào prompt. Xem AI trả lời tốt hơn dần.
        </p>

        {/* Nút thêm/bớt */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={removeExample}
            disabled={numExamples === 0}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Minus size={14} />
            Bớt
          </button>
          <span className="text-sm font-bold text-accent">{numExamples} ví dụ</span>
          <button
            type="button"
            onClick={addExample}
            disabled={numExamples === 4}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={14} />
            Thêm ví dụ
          </button>
          <span className="text-xs text-tertiary ml-auto">
            {numExamples === 0 ? "Zero-shot" : `${numExamples}-shot`}
          </span>
        </div>

        {/* Prompt đang xây */}
        <div className="rounded-lg border border-border bg-card overflow-hidden mb-4">
          {/* Ví dụ mẫu */}
          <AnimatePresence>
            {activeExamples.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-border px-4 py-2 bg-surface"
              >
                <span className="text-xs text-tertiary">Ví dụ {i + 1}: </span>
                <span className="text-xs text-foreground">&quot;{ex.input}&quot;</span>
                <span className="text-xs text-accent font-medium"> → {ex.output}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Test input */}
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs text-tertiary">Câu hỏi: </span>
            <span className="text-sm text-foreground font-medium">&quot;{TEST_INPUT}&quot;</span>
          </div>

          {/* AI output */}
          <AnimatePresence mode="wait">
            <motion.div
              key={numExamples}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-3 bg-accent-light"
            >
              <span className="text-xs text-accent font-semibold block mb-1">AI trả lời:</span>
              <p className="text-sm text-foreground leading-relaxed">{output.answer}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Confidence meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Độ chính xác</span>
            <span className="text-xs font-bold text-accent">{output.confidence}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${output.confidence}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-xs text-muted italic">{output.reasoning}</p>
        </div>
      </VisualizationSection>

      {/* ━━━ AHA MOMENT ━━━ */}
      <AhaMoment>
        Bạn vừa thấy AI &quot;học&quot; một task mới chỉ từ vài ví dụ — <strong>không cần huấn luyện lại, không cần code, không cần data lớn</strong>.
        Đây là <strong>In-Context Learning</strong>{" "}— khả năng kỳ diệu của LLM: hiểu task từ ví dụ mẫu trong prompt.
      </AhaMoment>

      {/* ━━━ THỬ THÁCH ━━━ */}
      <InlineChallenge
        question="Nếu bạn cho AI 4 ví dụ phân loại cảm xúc, xong hỏi nó dịch tiếng Anh — nó sẽ dịch hay phân loại?"
        options={[
          "Phân loại — vì nó đã 'học' phân loại từ 4 ví dụ",
          "Dịch — vì câu hỏi cuối yêu cầu dịch, ví dụ trước chỉ là gợi ý",
          "Bị lỗi — không hiểu bạn muốn gì",
        ]}
        correct={1}
        explanation="LLM nhìn toàn bộ context — nếu câu hỏi cuối rõ ràng yêu cầu dịch, nó sẽ dịch. Ví dụ mẫu là 'gợi ý' format, không phải 'lệnh cứng'. Đó là lý do prompt engineering quan trọng!"
      />

      {/* ━━━ GIẢI THÍCH ━━━ */}
      <ExplanationSection>
        <p>
          <strong>In-Context Learning (ICL)</strong>{" "}là khả năng LLM thực hiện tác vụ mới
          chỉ từ vài ví dụ trong prompt, mà <em>không thay đổi trọng số model</em>.
        </p>

        <Callout variant="insight" title="Tại sao AI 'học' được mà không cần training?">
          LLM không thực sự &quot;học&quot; theo nghĩa truyền thống. Trong quá trình pre-training,
          nó đã thấy hàng triệu pattern &quot;ví dụ → áp dụng&quot;. Khi bạn cho ví dụ trong prompt,
          nó <em>nhận ra pattern</em>{" "}và áp dụng cho input mới. Giống như thợ may giỏi — bạn chỉ cần
          cho xem 1 mẫu áo, họ hiểu ngay style bạn muốn.
        </Callout>

        <p><strong>3 chế độ:</strong></p>
        <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
          <li>
            <strong>Zero-shot:</strong>{" "}Không ví dụ. Chỉ mô tả task. AI dựa vào pre-training knowledge.
          </li>
          <li>
            <strong>Few-shot:</strong>{" "}3-5 ví dụ mẫu. Sweet spot cho hầu hết task.
          </li>
          <li>
            <strong>Many-shot:</strong>{" "}10-50+ ví dụ. Hiệu quả tăng ít, tốn context window nhiều.
          </li>
        </ul>

        <Callout variant="tip" title="Mẹo: chất lượng ví dụ quan trọng hơn số lượng">
          3 ví dụ đa dạng (cover các edge case) tốt hơn 10 ví dụ giống nhau.
          Ví dụ nên cover mọi class/format bạn muốn AI output. Thứ tự ví dụ cũng ảnh hưởng — đặt ví dụ khó cuối cùng.
        </Callout>

        <CodeBlock language="python" title="in_context_learning.py">{`# Zero-shot — không ví dụ
response = llm("Phân loại cảm xúc: 'Phở ngon quá!'")
# → "Đây là câu khen ngợi..." (lan man, sai format)

# Few-shot — 3 ví dụ
prompt = """Phân loại cảm xúc:
'Tuyệt vời!' → Tích cực
'Dở quá' → Tiêu cực
'Cũng được' → Trung lập

'Phở ngon quá!' →"""
response = llm(prompt)
# → "Tích cực" (đúng format, chính xác)`}</CodeBlock>
      </ExplanationSection>

      <MiniSummary
        points={[
          "In-Context Learning = AI 'học' task mới từ vài ví dụ trong prompt, KHÔNG thay đổi trọng số",
          "Zero-shot (0 ví dụ) → Few-shot (3-5 ví dụ) → Many-shot (10+): hiệu quả tăng nhanh rồi chậm dần",
          "AI không 'học' thật — nó nhận ra pattern từ pre-training và áp dụng cho context hiện tại",
          "Chất lượng ví dụ quan trọng hơn số lượng — 3 ví dụ đa dạng tốt hơn 10 ví dụ giống nhau",
        ]}
      />

      <QuizSection questions={quizQuestions} />
    </>
  );
}
