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
  slug: "test-time-compute",
  title: "Test-Time Compute",
  titleVi: "Tính toán lúc suy luận — Nghĩ thêm khi cần",
  description:
    "Chiến lược sử dụng nhiều tài nguyên tính toán hơn tại thời điểm suy luận để cải thiện chất lượng câu trả lời.",
  category: "emerging",
  tags: ["test-time", "compute", "scaling", "inference"],
  difficulty: "advanced",
  relatedSlugs: ["reasoning-models", "inference-optimization", "cost-optimization"],
  vizType: "interactive",
};

/* ── Strategy comparison ── */
interface Strategy {
  name: string;
  compute: number;
  accuracy: number;
  latency: string;
  costMultiple: string;
  desc: string;
}

const STRATEGIES: Strategy[] = [
  { name: "1-pass (baseline)", compute: 1, accuracy: 55, latency: "1s", costMultiple: "1x", desc: "Sinh 1 câu trả lời duy nhất" },
  { name: "Best-of-N (N=8)", compute: 8, accuracy: 72, latency: "2s", costMultiple: "8x", desc: "Sinh 8 answers, chọn cái tốt nhất bằng reward model" },
  { name: "Majority Vote (N=16)", compute: 16, accuracy: 78, latency: "3s", costMultiple: "16x", desc: "Sinh 16 answers, chọn đáp án xuất hiện nhiều nhất" },
  { name: "Iterative Refine (3 rounds)", compute: 6, accuracy: 82, latency: "8s", costMultiple: "6x", desc: "Sinh → phê bình → sửa, lặp 3 vòng" },
  { name: "Tree Search + PRM", compute: 20, accuracy: 93, latency: "30s", costMultiple: "20x", desc: "Khám phá cây suy luận, PRM đánh giá từng bước" },
];

const TOTAL_STEPS = 7;

export default function TestTimeComputeTopic() {
  const [activeIdx, setActiveIdx] = useState(0);
  const strategy = STRATEGIES[activeIdx];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Test-time compute scaling khác train-time scaling thế nào?",
      options: [
        "Tăng compute LÚC INFERENCE (per query) thay vì lúc training (one-time)",
        "Tăng kích thước model lên gấp đôi",
        "Dùng GPU mạnh hơn",
      ],
      correct: 0,
      explanation: "Train-time: tăng data, model size, FLOPs → cải thiện cho MỌI query. Test-time: tăng compute PER QUERY → chỉ tốn thêm cho query cần. Linh hoạt hơn: câu dễ dùng ít, câu khó dùng nhiều.",
    },
    {
      question: "Majority Voting hoạt động thế nào và khi nào hiệu quả?",
      options: [
        "Sinh N answers với temperature > 0, chọn đáp án xuất hiện nhiều nhất",
        "Chọn answer đầu tiên là tốt nhất",
        "Average tất cả embeddings thành 1 answer",
      ],
      correct: 0,
      explanation: "Sinh N answers (temperature 0.7-1.0 để đa dạng). Nếu 12/16 answers đều ra '42' → confident đó là đáp án đúng. Hiệu quả khi: answer space nhỏ (toán, multiple choice), model đúng > 50% cases. Không hiệu quả cho open-ended generation.",
    },
    {
      question: "Tại sao Tree Search + PRM cho accuracy cao nhất nhưng tốn nhất?",
      options: [
        "Cần GPU đắt tiền hơn",
        "Khám phá NHIỀU NHÁNH suy luận, dùng Process Reward Model đánh giá TỪNG BƯỚC, backtrack khi sai",
        "Dùng model lớn hơn",
      ],
      correct: 1,
      explanation: "Tree search: tại mỗi bước suy luận, thử nhiều hướng (branching). PRM đánh giá chất lượng từng bước → tỉa nhánh kém, đi sâu nhánh tốt. Giống AlphaGo search nhưng cho reasoning thay vì cờ vây. Tốn nhiều compute nhưng tìm được lời giải tối ưu.",
    },
    {
      type: "fill-blank",
      question: "Test-time compute cho phép model dùng thêm compute để sinh chuỗi {blank} dài hơn, tức là nhiều {blank} suy luận hơn tại inference.",
      blanks: [
        { answer: "reasoning", accept: ["suy luận", "chain-of-thought"] },
        { answer: "tokens", accept: ["token"] },
      ],
      explanation: "Test-time compute scaling chủ yếu biểu hiện qua việc model sinh nhiều reasoning tokens hơn — nghĩ sâu và dài hơn trước khi đưa ra đáp án cuối.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Model 8B (nhỏ) trả lời bài toán IMO đúng 10%. Model 70B (lớn) đúng 30%. Nhưng nếu cho model 8B 'suy nghĩ' gấp 100 lần (test-time compute), kết quả sẽ thế nào?"
          options={[
            "Vẫn chỉ 10% — model nhỏ là nhỏ, không thể cải thiện",
            "Model 8B + test-time compute có thể đạt 40-50%, VƯỢT model 70B dùng 1-pass",
            "Đạt 100% vì compute đủ nhiều",
          ]}
          correct={1}
          explanation="Nghiên cứu cho thấy: model nhỏ + test-time compute scaling có thể VƯỢT model lớn hơn 14x dùng 1-pass! Giống sinh viên trung bình được suy nghĩ 3 tiếng vs thiên tài chỉ có 5 phút — thời gian suy nghĩ bù đắp cho năng lực nền."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn <strong className="text-foreground">chiến lược test-time compute</strong>{" "}
          để xem trade-off giữa compute, accuracy, và chi phí.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {STRATEGIES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeIdx === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
              {/* Accuracy */}
              <text x={15} y={38} fill="#94a3b8" fontSize={11}>Accuracy</text>
              <rect x={90} y={24} width={430} height={20} rx={4} fill="#1e293b" />
              <rect x={90} y={24} width={430 * strategy.accuracy / 100} height={20} rx={4} fill="#22c55e" />
              <text x={95 + 430 * strategy.accuracy / 100} y={38} fill="white" fontSize={11} fontWeight="bold">{strategy.accuracy}%</text>

              {/* Compute */}
              <text x={15} y={72} fill="#94a3b8" fontSize={11}>Compute</text>
              <rect x={90} y={58} width={430} height={20} rx={4} fill="#1e293b" />
              <rect x={90} y={58} width={430 * strategy.compute / 20} height={20} rx={4} fill="#3b82f6" />
              <text x={95 + 430 * strategy.compute / 20} y={72} fill="white" fontSize={11} fontWeight="bold">{strategy.costMultiple}</text>

              {/* Stats */}
              <text x={200} y={110} textAnchor="middle" fill="#f59e0b" fontSize={11}>Latency: {strategy.latency}</text>
              <text x={400} y={110} textAnchor="middle" fill="#ef4444" fontSize={11}>Cost: {strategy.costMultiple}</text>

              {/* Description */}
              <rect x={40} y={125} width={520} height={35} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
              <text x={300} y={147} textAnchor="middle" fill="#94a3b8" fontSize={11}>{strategy.desc}</text>

              {/* Efficiency curve hint */}
              <text x={300} y={185} textAnchor="middle" fill="#64748b" fontSize={11}>
                Accuracy tăng nhanh ban đầu, rồi chậm dần (diminishing returns)
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Hai cách làm AI giỏi hơn: <strong>train lâu hơn</strong>{" "}(1 lần, fix) hoặc{" "}
            <strong>nghĩ lâu hơn</strong>{" "}(mỗi query, linh hoạt).
            Test-time compute giống cho thí sinh <strong>thêm thời gian làm bài</strong>{" "}
            — câu dễ xong nhanh, câu khó nghĩ kỹ. Linh hoạt hơn nhiều so với tăng kích thước model!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn dùng Majority Voting (N=32) cho chatbot. Mỗi answer tốn $0.01. Budget $100/ngày = 10K requests. Nhưng sếp muốn 100K requests/ngày. Giải pháp?"
          options={[
            "Tăng budget lên $1000/ngày",
            "Adaptive compute: câu dễ dùng 1-pass, chỉ dùng voting cho câu khó (phân loại tự động)",
            "Giảm N xuống 2 cho mọi câu",
          ]}
          correct={1}
          explanation="Adaptive test-time compute: classifier nhẹ phân loại câu hỏi → 80% câu dễ dùng 1-pass ($0.01), 15% trung bình dùng N=4 ($0.04), 5% khó dùng N=32 ($0.32). Chi phí trung bình: $0.027/req → 100K req = $2700 < budget. Tiết kiệm 10x so với voting cho mọi câu!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Test-Time Compute</strong>{" "}
            là paradigm mới cho phép model sử dụng nhiều compute hơn tại INFERENCE để cải thiện chất lượng từng câu trả lời. Đây là nền tảng của{" "}
            <TopicLink slug="reasoning-models">reasoning models</TopicLink>{" "}
            thế hệ mới, mở rộng{" "}
            <TopicLink slug="scaling-laws">scaling laws</TopicLink>{" "}
            từ training sang inference.
          </p>

          <p><strong>Scaling law mới:</strong></p>
          <LaTeX block>{"\\text{Performance} \\propto \\log(C_{\\text{train}}) + \\alpha \\cdot \\log(C_{\\text{test-time}})"}</LaTeX>
          <p>
            Model nhỏ + test-time compute cao có thể <strong>vượt</strong>{" "}
            model lớn + 1-pass inference!
          </p>

          <p><strong>5 chiến lược chính:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Best-of-N:</strong>{" "}Sinh N answers, reward model chọn cái tốt nhất</li>
            <li><strong>Majority Voting:</strong>{" "}Sinh N answers, chọn đáp án phổ biến nhất (self-consistency)</li>
            <li><strong>Iterative Refinement:</strong>{" "}Generate → Critique → Revise, lặp K vòng</li>
            <li><strong>Tree Search:</strong>{" "}Khám phá cây suy luận, PRM tỉa nhánh kém (MCTS style)</li>
            <li><strong>Adaptive Compute:</strong>{" "}Phân loại độ khó → allocate compute tương ứng</li>
          </ul>

          <Callout variant="tip" title="Compute-optimal Allocation">
            Không phải mọi câu đều cần nhiều compute. Nghiên cứu (Snell et al. 2024) chỉ ra: chiến lược tối ưu là phân bổ compute dựa trên ĐỘ KHÓ — câu dễ 1-pass, câu trung bình best-of-4, câu khó tree search. Hiệu quả hơn 5-10x so với compute đều cho mọi câu.
          </Callout>

          <p><strong>Verifier / Reward Models:</strong></p>
          <LaTeX block>{"\\text{Best-of-N: } \\hat{y} = \\arg\\max_{y_i \\in \\{y_1, ..., y_N\\}} R(x, y_i)"}</LaTeX>
          <LaTeX block>{"\\text{Majority Vote: } \\hat{y} = \\arg\\max_{a} \\sum_{i=1}^{N} \\mathbb{1}[y_i = a]"}</LaTeX>

          <CodeBlock language="python" title="Test-time compute: Best-of-N + Reward Model">
{`import anthropic
import numpy as np

client = anthropic.Anthropic()

def best_of_n(prompt: str, n: int = 8) -> str:
    """Sinh N answers, reward model chọn cái tốt nhất."""
    # Sinh N diverse answers (temperature > 0)
    answers = []
    for _ in range(n):
        resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            temperature=0.8,  # Đa dạng hoá
            messages=[{"role": "user", "content": prompt}],
        )
        answers.append(resp.content[0].text)

    # Reward model đánh giá chất lượng
    scores = []
    for ans in answers:
        score_resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=10,
            messages=[
                {"role": "user", "content": f"""Rate answer quality 0-10.
Question: {prompt}
Answer: {ans}
Score (number only):"""}
            ],
        )
        scores.append(float(score_resp.content[0].text.strip()))

    # Chọn answer có score cao nhất
    best_idx = int(np.argmax(scores))
    return answers[best_idx]

# Chi phí: N=8 → 8x inference + 8x scoring = ~16x
# Accuracy: +15-25% trên bài toán khó`}
          </CodeBlock>

          <Callout variant="info" title="AlphaProof & AlphaGeometry">
            Google DeepMind dùng test-time compute (tree search + verifier) để giải bài toán IMO 2024, đạt huy chương vàng. Mỗi bài toán dùng hàng nghìn GPU-hours compute — nhưng chỉ TẠI INFERENCE, không phải retrain model.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Test-time compute: tăng compute PER QUERY thay vì tăng model size — linh hoạt, chỉ tốn khi cần.",
          "Model 8B + 100x test-time compute có thể VƯỢT model 70B dùng 1-pass.",
          "5 chiến lược: Best-of-N, Majority Vote, Iterative Refine, Tree Search, Adaptive Compute.",
          "Adaptive allocation: phân loại độ khó → câu dễ 1-pass, câu khó tree search. Hiệu quả 5-10x.",
          "Trade-off: accuracy tăng nhưng latency và chi phí tăng theo. Diminishing returns sau một ngưỡng.",
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
