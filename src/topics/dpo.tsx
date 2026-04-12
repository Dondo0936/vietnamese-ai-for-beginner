"use client";

import { useState } from "react";
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
  slug: "dpo",
  title: "DPO",
  titleVi: "DPO - Tối ưu hóa sở thích trực tiếp",
  description:
    "Phương pháp alignment đơn giản hơn RLHF, tối ưu hóa trực tiếp từ dữ liệu sở thích mà không cần reward model.",
  category: "training-optimization",
  tags: ["dpo", "alignment", "preference", "optimization"],
  difficulty: "advanced",
  relatedSlugs: ["rlhf", "grpo", "fine-tuning"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const QUIZ: QuizQuestion[] = [
  {
    question: "DPO đơn giản hơn RLHF ở điểm nào?",
    options: [
      "DPO dùng ít dữ liệu hơn",
      "DPO bỏ qua reward model và PPO, tối ưu trực tiếp từ dữ liệu cặp sở thích bằng một bước supervised learning",
      "DPO không cần mô hình tham chiếu",
      "DPO không cần GPU",
    ],
    correct: 1,
    explanation:
      "DPO biến bài toán RL phức tạp thành bài toán classification đơn giản: tăng xác suất cho phản hồi được chọn, giảm cho phản hồi bị loại. Không cần reward model hay PPO.",
  },
  {
    question: "DPO cần loại dữ liệu nào?",
    options: [
      "Chỉ cần dữ liệu (prompt, response) như SFT",
      "Cần điểm số từ reward model",
      "Cần bộ ba (prompt, phản hồi tốt, phản hồi kém) từ đánh giá con người",
      "Chỉ cần prompt, không cần response",
    ],
    correct: 2,
    explanation:
      "DPO cần preference data: (prompt, y_win, y_lose). Con người so sánh hai phản hồi và chọn cái tốt hơn. DPO học trực tiếp từ sự so sánh này.",
  },
  {
    question: "Khi nào RLHF vẫn tốt hơn DPO?",
    options: [
      "Khi dữ liệu nhỏ và đơn giản",
      "Khi cần khám phá không gian chính sách rộng, vì RL có khả năng exploration mà supervised learning không có",
      "Khi muốn triển khai nhanh",
      "Khi ngân sách hạn chế",
    ],
    correct: 1,
    explanation:
      "RLHF (PPO) có thể khám phá không gian phản hồi mới mà dữ liệu preference không cover. DPO bị giới hạn bởi dữ liệu có sẵn. Với bài toán phức tạp cần khám phá, RLHF vẫn vượt trội.",
  },
  {
    type: "fill-blank",
    question: "DPO tối ưu trực tiếp từ dữ liệu {blank} dạng (prompt, y_win, y_lose), không cần {blank} riêng biệt như RLHF yêu cầu — biến bài toán RL phức tạp thành supervised learning đơn giản.",
    blanks: [
      { answer: "preference", accept: ["sở thích", "cặp sở thích", "preference data", "preferences"] },
      { answer: "reward model", accept: ["mô hình thưởng", "rm", "reward-model"] },
    ],
    explanation: "DPO chứng minh nghiệm closed-form của RLHF có thể viết dưới dạng tỷ lệ xác suất giữa policy và reference model — nhờ vậy ta tối ưu trực tiếp từ preference data mà không cần huấn luyện reward model riêng hay chạy PPO bất ổn định.",
  },
];

export default function DPOTopic() {
  const [view, setView] = useState<"rlhf" | "dpo">("dpo");

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="RLHF cần 3 bước phức tạp (SFT → Reward Model → PPO). Có thể đạt kết quả tương đương chỉ bằng 1 bước không?"
          options={[
            "Không — cần reward model và RL là bắt buộc",
            "Có — nếu biến bài toán RL thành bài toán supervised learning trên dữ liệu sở thích",
            "Có — chỉ cần tăng dữ liệu SFT là đủ",
          ]}
          correct={1}
          explanation="DPO chứng minh rằng bài toán RLHF có nghiệm dạng closed-form! Thay vì huấn luyện reward model rồi chạy RL, ta có thể tối ưu trực tiếp từ dữ liệu sở thích."
        >
          <p className="text-sm text-muted mt-2">
            Hãy cùng xem DPO rút gọn quy trình 3 bước thành 1 bước như thế nào.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            RLHF vs DPO — So sánh quy trình
          </h3>
          <p className="text-sm text-muted mb-4">
            Chuyển đổi giữa hai phương pháp để thấy sự khác biệt.
          </p>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setView("rlhf")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                view === "rlhf" ? "bg-red-500 text-white" : "bg-card border border-border text-muted hover:text-foreground"
              }`}>
              RLHF (3 bước)
            </button>
            <button onClick={() => setView("dpo")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                view === "dpo" ? "bg-green-500 text-white" : "bg-card border border-border text-muted hover:text-foreground"
              }`}>
              DPO (1 bước)
            </button>
          </div>

          <svg viewBox="0 0 700 180" className="w-full max-w-3xl mx-auto mb-4">
            {view === "rlhf" ? (
              <>
                <rect x="10" y="10" width="680" height="160" rx="12" fill="var(--bg-surface)" stroke="#ef4444" strokeWidth="1.5" />
                <text x="30" y="35" fill="#ef4444" fontSize="12" fontWeight="bold">RLHF — 3 bước phức tạp</text>
                {[
                  { label: "Dữ liệu\nsở thích", x: 50, color: "var(--text-tertiary)" },
                  { label: "Huấn luyện\nReward Model", x: 210, color: "#f59e0b" },
                  { label: "Chạy RL\n(PPO)", x: 380, color: "#ef4444" },
                  { label: "Mô hình\nđã align", x: 560, color: "#22c55e" },
                ].map((item, i) => (
                  <g key={i}>
                    <rect x={item.x} y="55" width="130" height="50" rx="8" fill="var(--bg-card)" stroke={item.color} strokeWidth="1" />
                    <text x={item.x + 65} y="78" textAnchor="middle" fill={item.color} fontSize="9">
                      {item.label.split("\n")[0]}
                    </text>
                    <text x={item.x + 65} y="92" textAnchor="middle" fill={item.color} fontSize="9">
                      {item.label.split("\n")[1]}
                    </text>
                    {i < 3 && (
                      <line x1={item.x + 130} y1="80" x2={item.x + 160} y2="80"
                        stroke="var(--text-tertiary)" strokeWidth="1.5" markerEnd="url(#arr-dpo)" />
                    )}
                  </g>
                ))}
                <text x="350" y="140" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">
                  Cần reward model riêng + RL không ổn định + nhiều hyperparameter
                </text>
              </>
            ) : (
              <>
                <rect x="10" y="10" width="680" height="160" rx="12" fill="var(--bg-surface)" stroke="#22c55e" strokeWidth="1.5" />
                <text x="30" y="35" fill="#22c55e" fontSize="12" fontWeight="bold">DPO — 1 bước đơn giản</text>
                {[
                  { label: "Dữ liệu\nsở thích", x: 110, color: "var(--text-tertiary)" },
                  { label: "Tối ưu\ntrực tiếp", x: 320, color: "#22c55e" },
                  { label: "Mô hình\nđã align", x: 510, color: "#22c55e" },
                ].map((item, i) => (
                  <g key={i}>
                    <rect x={item.x} y="55" width="130" height="50" rx="8" fill="var(--bg-card)" stroke={item.color} strokeWidth="1" />
                    <text x={item.x + 65} y="78" textAnchor="middle" fill={item.color} fontSize="9">
                      {item.label.split("\n")[0]}
                    </text>
                    <text x={item.x + 65} y="92" textAnchor="middle" fill={item.color} fontSize="9">
                      {item.label.split("\n")[1]}
                    </text>
                    {i < 2 && (
                      <line x1={item.x + 130} y1="80" x2={item.x + 180} y2="80"
                        stroke="var(--text-tertiary)" strokeWidth="1.5" markerEnd="url(#arr-dpo)" />
                    )}
                  </g>
                ))}
                <text x="350" y="140" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">
                  Không cần reward model — loss function đơn giản như supervised learning
                </text>
              </>
            )}
            <defs>
              <marker id="arr-dpo" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-tertiary)" />
              </marker>
            </defs>
          </svg>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-background/50 border border-red-500/30 p-3">
              <p className="text-sm font-semibold text-red-400">RLHF</p>
              <ul className="text-xs text-muted space-y-1 mt-1 list-disc list-inside">
                <li>3 bước, 3 mô hình (SFT, RM, Policy)</li>
                <li>PPO không ổn định, nhiều hyperparameter</li>
                <li>Có khả năng exploration (khám phá)</li>
              </ul>
            </div>
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3">
              <p className="text-sm font-semibold text-green-400">DPO</p>
              <ul className="text-xs text-muted space-y-1 mt-1 list-disc list-inside">
                <li>1 bước, 1 mô hình + 1 tham chiếu</li>
                <li>Ổn định như supervised learning</li>
                <li>Bị giới hạn bởi dữ liệu preference</li>
              </ul>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          Bài toán RLHF tưởng như phải giải bằng RL phức tạp, nhưng thực ra có
          <strong>{" "}nghiệm dạng đóng</strong> (closed-form solution)! DPO chỉ ra rằng
          reward model ngầm ẩn đã được mã hoá trong tỷ lệ xác suất giữa mô hình hiện
          tại và mô hình tham chiếu — không cần huấn luyện riêng.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="DPO cần dữ liệu dạng (prompt, y_win, y_lose). Nếu bạn có 10.000 prompt và mỗi prompt có 2 phản hồi đã được xếp hạng, bạn có bao nhiêu cặp preference?"
          options={[
            "5.000 cặp",
            "10.000 cặp — mỗi prompt tạo ra 1 cặp (win, lose)",
            "20.000 cặp",
            "100.000 cặp",
          ]}
          correct={1}
          explanation="Mỗi prompt với 2 phản hồi xếp hạng tạo ra đúng 1 cặp (win, lose). 10.000 prompt = 10.000 cặp preference. Nếu mỗi prompt có k phản hồi, sẽ có C(k,2) cặp mỗi prompt."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>DPO</strong>{" "}(Direct Preference Optimization) biến bài toán{" "}
            <TopicLink slug="rlhf">RLHF</TopicLink>{" "}
            thành bài toán supervised learning đơn giản, đạt cùng mục tiêu{" "}
            <TopicLink slug="alignment">alignment</TopicLink>{" "}
            nhưng không cần reward model. Ý tưởng cốt lõi:
          </p>

          <p>
            Nghiệm tối ưu của bài toán RLHF (<LaTeX>{"\\max R - \\beta D_{\\text{KL}}"}</LaTeX>)
            có dạng:
          </p>
          <LaTeX block>{"\\pi^*(y|x) = \\frac{\\pi_{\\text{ref}}(y|x) \\cdot \\exp\\left(\\frac{R(x,y)}{\\beta}\\right)}{Z(x)}"}</LaTeX>

          <p>
            Từ đó suy ra reward ngầm ẩn:
          </p>
          <LaTeX block>{"R(x,y) = \\beta \\log \\frac{\\pi_\\theta(y|x)}{\\pi_{\\text{ref}}(y|x)} + \\beta \\log Z(x)"}</LaTeX>

          <p>Hàm loss DPO thay thế reward model bằng tỷ lệ xác suất:</p>
          <LaTeX block>{"\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E} \\left[ \\log \\sigma \\left( \\beta \\log \\frac{\\pi_\\theta(y_w|x)}{\\pi_{\\text{ref}}(y_w|x)} - \\beta \\log \\frac{\\pi_\\theta(y_l|x)}{\\pi_{\\text{ref}}(y_l|x)} \\right) \\right]"}</LaTeX>

          <Callout variant="insight" title="Hiểu đơn giản">
            DPO tăng xác suất cho y_win và giảm xác suất cho y_lose, tương đối
            so với mô hình tham chiếu. Giống cross-entropy nhưng trên cặp so sánh
            thay vì nhãn tuyệt đối.
          </Callout>

          <CodeBlock language="python" title="dpo_training.py">{`from trl import DPOTrainer, DPOConfig

# Dữ liệu: mỗi mẫu có (prompt, chosen, rejected)
dataset = load_preference_data()

trainer = DPOTrainer(
    model=sft_model,               # Mô hình sau SFT
    ref_model=sft_model_copy,      # Bản sao làm tham chiếu
    args=DPOConfig(
        beta=0.1,                  # Hệ số KL — nhỏ = thay đổi nhiều
        learning_rate=5e-7,
    ),
    train_dataset=dataset,
)
trainer.train()
# Không cần reward model, không cần PPO!`}</CodeBlock>

          <Callout variant="warning" title="Hạn chế của DPO">
            DPO bị giới hạn bởi chất lượng dữ liệu preference. Nếu dữ liệu
            không cover trường hợp phức tạp, mô hình không thể khám phá thêm
            (thiếu exploration). RLHF có lợi thế hơn ở bài toán cần sáng tạo.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về DPO"
          points={[
            "DPO biến RLHF 3 bước thành 1 bước supervised learning — không cần reward model hay PPO.",
            "Dữ liệu: bộ ba (prompt, y_win, y_lose) từ đánh giá con người.",
            "Loss function: tăng log-prob cho y_win, giảm cho y_lose, tương đối so với mô hình tham chiếu.",
            "Ổn định và dễ triển khai nhưng thiếu exploration — RLHF vẫn mạnh hơn cho bài toán cần khám phá.",
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
