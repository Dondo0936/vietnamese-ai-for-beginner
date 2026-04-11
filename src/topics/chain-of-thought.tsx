"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  ToggleCompare,
  LessonSection,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "chain-of-thought",
  title: "Chain-of-Thought",
  titleVi: "Chuỗi suy luận từng bước",
  description:
    "Kỹ thuật yêu cầu mô hình trình bày quá trình suy nghĩ từng bước để cải thiện khả năng lập luận.",
  category: "llm-concepts",
  tags: ["reasoning", "prompt", "cot", "llm"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "in-context-learning", "llm-overview"],
  vizType: "interactive",
};

// ─── Bài toán để demo ───
const PROBLEMS = [
  {
    question: "Một cửa hàng giảm giá 20%. Sau đó giảm thêm 10% trên giá đã giảm. Tổng giảm giá thực tế là bao nhiêu phần trăm?",
    wrongAnswer: { answer: "30%", reasoning: "20% + 10% = 30%" },
    cotAnswer: {
      answer: "28%",
      steps: [
        "Giá gốc = 100 đồng",
        "Sau giảm 20%: 100 × 0.8 = 80 đồng",
        "Sau giảm thêm 10%: 80 × 0.9 = 72 đồng",
        "Tổng giảm: 100 − 72 = 28 đồng → 28%",
      ],
    },
  },
  {
    question: "Trong phòng có 3 công tắc, ngoài phòng có 3 bóng đèn. Bạn chỉ được vào phòng 1 lần. Làm sao biết công tắc nào nối với đèn nào?",
    wrongAnswer: { answer: "Bật từng cái và chạy vào xem", reasoning: "Bật 1 → vào kiểm tra → quay ra bật cái khác (Sai! Chỉ được vào 1 lần)" },
    cotAnswer: {
      answer: "Dùng nhiệt!",
      steps: [
        "Bật công tắc 1, chờ 5 phút",
        "Tắt công tắc 1, bật công tắc 2",
        "Vào phòng: đèn sáng = công tắc 2",
        "Đèn tắt nhưng NÓNG = công tắc 1 (vừa bật lâu)",
        "Đèn tắt và NGUỘI = công tắc 3",
      ],
    },
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Chain-of-Thought cải thiện LLM ở loại task nào nhất?",
    options: [
      "Dịch thuật đơn giản",
      "Bài toán logic và tính toán nhiều bước",
      "Tóm tắt văn bản",
      "Phân loại cảm xúc",
    ],
    correct: 1,
    explanation: "CoT giúp nhất ở task cần LẬP LUẬN nhiều bước — toán, logic, suy luận nhân quả. Với task đơn giản (dịch, phân loại), CoT ít có tác dụng.",
  },
  {
    question: "Zero-shot CoT sử dụng prompt đơn giản nào?",
    options: [
      "'Trả lời nhanh nhất có thể'",
      "'Hãy suy nghĩ từng bước' (Let's think step by step)",
      "'Cho tôi 3 ví dụ trước'",
      "'Tóm tắt trong 1 câu'",
    ],
    correct: 1,
    explanation: "Chỉ cần thêm 'Let's think step by step' hoặc 'Hãy suy nghĩ từng bước' vào cuối prompt → cải thiện đáng kể! Paper Google 2022 chứng minh điều này.",
  },
  {
    question: "Tại sao CoT hoạt động — về mặt kỹ thuật?",
    options: [
      "Vì AI có thêm thời gian suy nghĩ",
      "Vì mỗi bước trung gian cung cấp ngữ cảnh cho bước tiếp theo, giảm lỗi tích lũy",
      "Vì AI copy bài giải từ Internet",
      "Vì prompt dài hơn = tốt hơn",
    ],
    correct: 1,
    explanation: "Mỗi bước trung gian được sinh ra trở thành INPUT cho bước sau. Thay vì nhảy thẳng từ đề bài → đáp án (dễ sai), AI đi qua chuỗi suy luận — mỗi bước đơn giản hơn tổng thể.",
  },
];

export default function ChainOfThoughtTopic() {
  const [selectedProblem, setSelectedProblem] = useState(0);
  const [showCoT, setShowCoT] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState(0);

  const problem = PROBLEMS[selectedProblem];

  function revealNextStep() {
    if (revealedSteps < problem.cotAnswer.steps.length) {
      setRevealedSteps(s => s + 1);
    }
  }

  function switchProblem(idx: number) {
    setSelectedProblem(idx);
    setShowCoT(false);
    setRevealedSteps(0);
  }

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <LessonSection step={1} totalSteps={6} label="Thử đoán">
      <PredictionGate
        question="Cửa hàng giảm giá 20%, sau đó giảm thêm 10%. Tổng giảm bao nhiêu phần trăm?"
        options={["30%", "28%", "25%", "32%"]}
        correct={1}
        explanation="Không phải 30%! Giảm 20% trước: 100 → 80. Giảm 10% nữa: 80 × 0.9 = 72. Tổng giảm = 28%. Hầu hết mọi người (và AI khi không dùng CoT) trả lời sai là 30% vì cộng thẳng. Chain-of-Thought buộc AI tính TỪNG BƯỚC để tránh lỗi này."
      >
        <p className="text-sm text-muted mt-4">
          Xem sự khác biệt khi AI trả lời <strong className="text-foreground">có</strong>{" "}và <strong className="text-foreground">không có</strong>{" "}Chain-of-Thought.
        </p>
      </PredictionGate>

            </LessonSection>

{/* ━━━ KHÁM PHÁ — So sánh có/không CoT ━━━ */}
      <LessonSection step={2} totalSteps={6} label="Khám phá">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-3">
          Cùng câu hỏi, hai cách trả lời
        </h3>

        {/* Chọn bài toán */}
        <div className="flex gap-2 mb-4">
          {PROBLEMS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => switchProblem(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedProblem === i
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              Bài toán {i + 1}
            </button>
          ))}
        </div>

        {/* Đề bài */}
        <div className="rounded-lg bg-surface p-4 mb-4">
          <span className="text-[10px] font-medium text-tertiary uppercase tracking-wider block mb-1">
            Đề bài
          </span>
          <p className="text-sm text-foreground leading-relaxed">
            {problem.question}
          </p>
        </div>

        <ToggleCompare
          labelA="Không có CoT"
          labelB="Có Chain-of-Thought"
          childA={
            <div className="space-y-3">
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4">
                <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-2">
                  AI trả lời thẳng
                </span>
                <p className="text-sm text-foreground leading-relaxed">
                  {problem.wrongAnswer.reasoning}
                </p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-2">
                  → {problem.wrongAnswer.answer} ✗
                </p>
              </div>
              <p className="text-xs text-muted italic">
                AI nhảy thẳng đến đáp án mà không tính toán — dễ sai ở bài toán nhiều bước.
              </p>
            </div>
          }
          childB={
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 p-4">
                <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider block mb-2">
                  AI suy nghĩ từng bước
                </span>
                <div className="space-y-2">
                  {problem.cotAnswer.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-200 dark:bg-green-800 text-[10px] font-bold text-green-700 dark:text-green-300">
                        {i + 1}
                      </span>
                      <span className="text-sm text-foreground">{step}</span>
                    </div>
                  ))}
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">
                  → {problem.cotAnswer.answer} ✓
                </p>
              </div>
              <p className="text-xs text-muted italic">
                Từng bước trung gian trở thành ngữ cảnh cho bước tiếp theo — giảm lỗi tích lũy.
              </p>
            </div>
          }
        />
      </VisualizationSection>

            </LessonSection>

{/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={6} label="Khám phá">
      <AhaMoment>
        <strong>Chain-of-Thought</strong>{" "}buộc AI &quot;show your work&quot; — trình bày từng bước suy luận thay vì nhảy thẳng đến đáp án. Mỗi bước trung gian trở thành <em>input</em>{" "}cho bước tiếp theo, giúp AI xử lý bài toán phức tạp bằng chuỗi bước đơn giản.
      </AhaMoment>

            </LessonSection>

{/* ━━━ THỬ THÁCH ━━━ */}
      <LessonSection step={4} totalSteps={6} label="Thử thách">
      <InlineChallenge
        question="Bạn muốn AI dịch 'Hello' sang tiếng Việt. Có cần dùng Chain-of-Thought không?"
        options={[
          "Có — luôn dùng CoT cho mọi task",
          "Không — dịch đơn giản không cần suy luận nhiều bước, CoT chỉ thêm chậm",
          "Tùy — dùng CoT nếu câu dài",
        ]}
        correct={1}
        explanation="CoT chỉ hữu ích cho task CẦN SUY LUẬN: toán, logic, phân tích. Với task đơn giản như dịch một từ, CoT chỉ thêm token (tốn tiền) mà không cải thiện kết quả."
      />

            </LessonSection>

{/* ━━━ GIẢI THÍCH ━━━ */}
      <LessonSection step={5} totalSteps={6} label="Giải thích">
      <ExplanationSection>
        <p>
          <strong>Chain-of-Thought (CoT)</strong>{" "}là kỹ thuật prompt yêu cầu LLM trình bày
          quá trình suy luận từng bước trước khi đưa ra đáp án cuối cùng.
        </p>

        <Callout variant="insight" title="Tại sao CoT hoạt động?">
          LLM sinh text từ trái sang phải. Mỗi token mới chỉ &quot;thấy&quot; các token trước nó.
          Khi AI viết bước trung gian, bước đó trở thành <em>ngữ cảnh</em>{" "}cho bước tiếp theo.
          Thay vì: &quot;Đề bài → Đáp án&quot; (nhảy xa, dễ sai), CoT tạo ra:
          &quot;Đề bài → Bước 1 → Bước 2 → ... → Đáp án&quot; (nhiều bước ngắn, mỗi bước dễ hơn).
        </Callout>

        <p><strong>3 biến thể chính:</strong></p>
        <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
          <li>
            <strong>Zero-shot CoT:</strong>{" "}Thêm &quot;Hãy suy nghĩ từng bước&quot; vào cuối prompt.
            Đơn giản nhất, không cần ví dụ mẫu.
          </li>
          <li>
            <strong>Few-shot CoT:</strong>{" "}Cho AI xem 2-3 ví dụ bài giải mẫu có từng bước.
            AI học theo format và tự giải bài mới tương tự.
          </li>
          <li>
            <strong>Self-Consistency:</strong>{" "}Chạy CoT nhiều lần (5-10 lần), lấy đáp án
            xuất hiện nhiều nhất. Giảm lỗi ngẫu nhiên đáng kể.
          </li>
        </ul>

        <CodeBlock language="python" title="chain_of_thought.py">{`# Zero-shot CoT — chỉ cần 1 câu thêm vào cuối
prompt = """
Một cửa hàng giảm giá 20%, sau đó giảm thêm 10%.
Tổng giảm bao nhiêu phần trăm?

Hãy suy nghĩ từng bước.
"""

# Few-shot CoT — cho ví dụ mẫu
prompt = """
Ví dụ: Giảm 10% rồi giảm 10% nữa.
Bước 1: 100 × 0.9 = 90
Bước 2: 90 × 0.9 = 81
Đáp án: Tổng giảm 19%

Câu hỏi: Giảm 20% rồi giảm 10%.
"""

# Self-Consistency — chạy 5 lần, vote
answers = []
for _ in range(5):
    response = llm(prompt, temperature=0.7)
    answers.append(extract_answer(response))
final = most_common(answers)  # → 28%`}</CodeBlock>

        <Callout variant="tip" title="Khi nào dùng CoT?">
          <strong>NÊN dùng:</strong>{" "}Toán, logic, phân tích nhiều bước, lập kế hoạch, debugging code.
          <br />
          <strong>KHÔNG cần:</strong>{" "}Dịch thuật, phân loại đơn giản, tóm tắt, sinh text sáng tạo.
        </Callout>
      </ExplanationSection>

            </LessonSection>

{/* ━━━ TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={6} label="Tổng kết">
      <MiniSummary
        points={[
          "Chain-of-Thought buộc AI suy luận từng bước thay vì nhảy thẳng đến đáp án",
          "Mỗi bước trung gian trở thành ngữ cảnh cho bước tiếp theo — giảm lỗi tích lũy",
          "3 biến thể: Zero-shot ('suy nghĩ từng bước'), Few-shot (cho ví dụ mẫu), Self-Consistency (chạy nhiều lần + vote)",
          "Hiệu quả nhất cho bài toán logic, tính toán, suy luận — không cần cho task đơn giản",
        ]}
      />

      <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
