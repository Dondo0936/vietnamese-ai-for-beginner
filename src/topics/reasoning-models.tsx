"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

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

/* ── Reasoning mode comparison ── */
interface ReasoningMode {
  name: string;
  thinkTokens: number;
  accuracy: number;
  latency: string;
  cost: string;
  example: string;
}

const MODES: ReasoningMode[] = [
  { name: "Trả lời nhanh", thinkTokens: 0, accuracy: 55, latency: "0.5s", cost: "$0.01", example: "9 + 15 = 24 (trả lời ngay)" },
  { name: "Suy luận nhẹ", thinkTokens: 200, accuracy: 78, latency: "3s", cost: "$0.05", example: "Hmm, 9 + 15... 9+10=19, 19+5=24. Đáp án: 24" },
  { name: "Suy luận sâu", thinkTokens: 2000, accuracy: 95, latency: "30s", cost: "$0.50", example: "Bước 1: Phân tích bài toán... Bước 5: Kiểm tra lại... Đáp án: 24" },
];

const TOTAL_STEPS = 7;

export default function ReasoningModelsTopic() {
  const [activeMode, setActiveMode] = useState(0);
  const mode = MODES[activeMode];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Mô hình suy luận (reasoning models) tăng chất lượng bằng cách nào?",
      options: [
        "Dùng nhiều GPU hơn khi training",
        "Sinh chuỗi suy luận nội bộ (chain-of-thought) trước khi trả lời cuối cùng",
        "Tăng kích thước model lên gấp 10 lần",
      ],
      correct: 1,
      explanation: "Reasoning models dùng thêm compute LÚC INFERENCE (test-time compute) để 'suy nghĩ'. Sinh chuỗi reasoning tokens: phân tích bài toán → thử hướng giải → kiểm tra logic → tự sửa lỗi. Chậm hơn nhưng chính xác hơn nhiều.",
    },
    {
      question: "Khi nào KHÔNG nên dùng reasoning model?",
      options: [
        "Giải bài toán IMO (toán Olympic)",
        "Trả lời 'Thời tiết Hà Nội hôm nay?' — câu hỏi factual đơn giản",
        "Viết code thuật toán phức tạp",
      ],
      correct: 1,
      explanation: "Câu hỏi factual đơn giản không cần suy luận — model thường trả lời đúng ngay. Dùng reasoning model = tốn 10-50x chi phí mà chất lượng không khác biệt. Chỉ dùng reasoning cho: toán, code phức tạp, logic, planning.",
    },
    {
      question: "RLHF cho reasoning models khác RLHF thường thế nào?",
      options: [
        "Reward model đánh giá cả QUÁ TRÌNH suy luận, không chỉ kết quả cuối",
        "Không dùng RLHF, chỉ dùng supervised learning",
        "Dùng nhiều human raters hơn",
      ],
      correct: 0,
      explanation: "Process reward model (PRM) cho điểm từng bước suy luận — bước nào logic đúng, bước nào sai. Outcome reward model (ORM) chỉ đánh giá kết quả cuối. PRM dạy model 'suy nghĩ đúng cách' thay vì chỉ 'trả lời đúng'.",
    },
    {
      type: "fill-blank",
      question: "Reasoning models sinh chuỗi {blank} nội bộ trước khi trả lời — đây là quá trình {blank} sâu được tối ưu bằng test-time compute.",
      blanks: [
        { answer: "chain-of-thought", accept: ["cot", "suy luận", "chain of thought"] },
        { answer: "thinking", accept: ["reasoning", "suy nghĩ", "tư duy"] },
      ],
      explanation: "Đặc trưng của reasoning models là sinh chuỗi chain-of-thought (CoT) dài trong giai đoạn thinking trước khi xuất đáp án cuối, cho phép phân tích, tự kiểm tra, và backtracking.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bài toán: 'Có 5 người xếp hàng. An đứng sau Bình, Cường đứng trước An, Dung đứng cuối. Ai đứng thứ 2?' LLM thường trả lời ngay trong 0.5s. Reasoning model nghĩ 30s. Ai đúng hơn?"
          options={[
            "LLM thường — trả lời nhanh là hay",
            "Reasoning model — bài logic cần phân tích từng bước, không đoán được",
            "Cả hai đều đúng vì bài đơn giản",
          ]}
          correct={1}
          explanation="Bài logic nhiều ràng buộc cần suy luận từng bước. LLM thường hay đoán sai vì 'nhìn pattern' thay vì 'suy nghĩ'. Reasoning model phân tích: An sau Bình → Bình...An, Cường trước An → ...Cường...An, Dung cuối → sắp xếp hợp lý. Giống thi tự luận vs trắc nghiệm!"
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn <strong className="text-foreground">chế độ suy luận</strong>{" "}
          để xem trade-off giữa thời gian, chi phí, và chất lượng.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              {MODES.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMode(i)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    activeMode === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 210" className="w-full max-w-2xl mx-auto">
              {/* Accuracy bar */}
              <text x={15} y={38} fill="#94a3b8" fontSize={10}>Accuracy</text>
              <rect x={100} y={24} width={420} height={22} rx={4} fill="#1e293b" />
              <rect x={100} y={24} width={420 * (mode.accuracy / 100)} height={22} rx={4} fill="#22c55e" />
              <text x={105 + 420 * (mode.accuracy / 100)} y={39} fill="white" fontSize={10} fontWeight="bold">
                {mode.accuracy}%
              </text>

              {/* Think tokens bar */}
              <text x={15} y={72} fill="#94a3b8" fontSize={10}>Think tokens</text>
              <rect x={100} y={58} width={420} height={22} rx={4} fill="#1e293b" />
              <rect x={100} y={58} width={420 * (mode.thinkTokens / 2000)} height={22} rx={4} fill="#3b82f6" />
              <text x={105 + Math.max(5, 420 * (mode.thinkTokens / 2000))} y={73} fill="white" fontSize={10} fontWeight="bold">
                {mode.thinkTokens}
              </text>

              {/* Stats */}
              <text x={200} y={115} textAnchor="middle" fill="#f59e0b" fontSize={11}>
                Latency: {mode.latency}
              </text>
              <text x={400} y={115} textAnchor="middle" fill="#ef4444" fontSize={11}>
                Chi phí: {mode.cost}
              </text>

              {/* Example thinking process */}
              <rect x={40} y={130} width={520} height={40} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
              <text x={300} y={148} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                {mode.example}
              </text>

              {/* Trade-off indicator */}
              <text x={300} y={195} textAnchor="middle" fill="#e2e8f0" fontSize={10} fontWeight="bold">
                Nghĩ nhiều hơn = chính xác hơn = tốn hơn = chậm hơn
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            LLM thường = <strong>thi trắc nghiệm</strong>{" "}(nhìn câu hỏi, đoán ngay).
            Reasoning model = <strong>thi tự luận</strong>{" "}(phân tích đề, viết lời giải, kiểm tra lại).
            Bước nhảy vọt: AI không chỉ &quot;biết nhiều&quot; mà bắt đầu &quot;biết suy nghĩ&quot;.
            Nhưng giống sinh viên giỏi: <strong>không cần viết 10 trang cho câu hỏi đơn giản!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Model reasoning sinh 2000 thinking tokens + 200 answer tokens cho mỗi câu hỏi. Bạn phục vụ 10K requests/ngày. Thinking tokens tốn $0.15/1K, output tokens $0.60/1K. Chi phí thinking vs output?"
          options={[
            "Thinking: $3000/ngày (chiếm 71%). Output: $1200/ngày (chiếm 29%)",
            "Output đắt hơn vì giá per token cao hơn",
            "Giống nhau vì tổng tokens bằng nhau",
          ]}
          correct={0}
          explanation="Thinking: 10K x 2000 x $0.15/1K = $3000. Output: 10K x 200 x $0.60/1K = $1200. Thinking chiếm 71% chi phí dù giá per token rẻ hơn — vì SỐ LƯỢNG tokens rất lớn. Đây là lý do cần routing: chỉ dùng reasoning cho câu khó!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Mô hình suy luận (Reasoning Models)</strong>{" "}
            như o1/o3 (OpenAI), Claude với extended thinking, DeepSeek-R1 đại diện cho paradigm mới: tăng{" "}
            <TopicLink slug="test-time-compute">test-time compute</TopicLink>{" "}
            LÚC INFERENCE thay vì chỉ lúc training. Cốt lõi là sinh chuỗi{" "}
            <TopicLink slug="chain-of-thought">chain-of-thought</TopicLink>{" "}
            nội bộ, và DeepSeek-R1 được huấn luyện bằng{" "}
            <TopicLink slug="grpo">GRPO</TopicLink>{" "}
            thay vì PPO.
          </p>

          <p><strong>Scaling Laws cũ vs mới:</strong></p>
          <LaTeX block>{"\\text{Cũ: } \\text{Performance} \\propto \\log(\\text{Training Compute})"}</LaTeX>
          <LaTeX block>{"\\text{Mới: } \\text{Performance} \\propto \\log(\\text{Training Compute}) + \\log(\\text{Test-time Compute})"}</LaTeX>

          <p><strong>Cơ chế hoạt động:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Chain-of-Thought nội bộ:</strong>{" "}Sinh chuỗi suy luận dài (thinking tokens) trước khi trả lời</li>
            <li><strong>Self-verification:</strong>{" "}Kiểm tra lại các bước, phát hiện lỗi logic</li>
            <li><strong>Backtracking:</strong>{" "}Thử hướng giải khác khi phát hiện sai</li>
            <li><strong>Decomposition:</strong>{" "}Chia bài toán phức tạp thành các bước nhỏ</li>
          </ul>

          <Callout variant="tip" title="Process vs Outcome Reward">
            Outcome Reward Model (ORM): chỉ đánh giá kết quả cuối — model có thể &quot;đoán đúng sai cách&quot;.
            Process Reward Model (PRM): đánh giá TỪNG BƯỚC suy luận — dạy model suy nghĩ đúng cách.
            PRM cho kết quả tốt hơn nhưng cần data annotation từng bước (đắt hơn).
          </Callout>

          <p><strong>Training Reasoning Models:</strong></p>
          <LaTeX block>{"\\mathcal{L} = \\underbrace{\\mathcal{L}_{\\text{SFT}}}_{\\text{Supervised thinking traces}} + \\underbrace{\\lambda \\cdot \\mathcal{L}_{\\text{RL}}}_{\\text{Reinforcement from PRM}}"}</LaTeX>

          <p>
            Bước 1: SFT trên dữ liệu thinking traces (human-written hoặc distilled).
            Bước 2: RL với PRM reward — model tự khám phá chiến lược suy luận mới.
          </p>

          <CodeBlock language="python" title="So sánh reasoning vs standard model">
{`import anthropic

client = anthropic.Anthropic()

# Standard model — trả lời nhanh
standard = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{"role": "user", "content": "5 người xếp hàng..."}],
)
# Latency: ~1s, cost: ~$0.01

# Extended thinking — suy luận sâu
reasoning = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000,  # Cho phép nghĩ tối đa 10K tokens
    },
    messages=[{"role": "user", "content": "5 người xếp hàng..."}],
)
# Latency: ~15s, cost: ~$0.30
# Nhưng accuracy trên bài logic: 95% vs 55%

# Xem quá trình suy luận
for block in reasoning.content:
    if block.type == "thinking":
        print("THINKING:", block.thinking)  # Chuỗi suy luận
    elif block.type == "text":
        print("ANSWER:", block.text)  # Câu trả lời cuối`}
          </CodeBlock>

          <Callout variant="info" title="GRPO vs PPO cho Reasoning">
            DeepSeek-R1 dùng GRPO (Group Relative Policy Optimization) thay PPO — không cần critic model riêng, sinh nhiều answers rồi rank theo reward. Đơn giản hơn, tiết kiệm GPU hơn, kết quả ngang PPO.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Reasoning models tăng compute lúc inference (test-time compute) thay vì chỉ lúc training.",
          "Sinh chain-of-thought nội bộ: phân tích → thử hướng giải → kiểm tra logic → tự sửa lỗi.",
          "Vượt trội ở toán, code, logic phức tạp. Không cần cho câu hỏi đơn giản (lãng phí 10-50x chi phí).",
          "Process Reward Model (PRM) đánh giá từng bước suy luận — dạy model 'suy nghĩ đúng cách'.",
          "Trade-off: accuracy tăng 40-50% nhưng latency và chi phí tăng 10-50x. Routing thông minh là chìa khoá.",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
