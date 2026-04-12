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
  slug: "rlhf",
  title: "RLHF",
  titleVi: "RLHF - Học tăng cường từ phản hồi con người",
  description:
    "Kỹ thuật huấn luyện AI phù hợp với giá trị con người thông qua phản hồi và mô hình thưởng.",
  category: "training-optimization",
  tags: ["rlhf", "alignment", "reward-model", "ppo"],
  difficulty: "advanced",
  relatedSlugs: ["dpo", "fine-tuning", "grpo"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const PIPELINE = [
  {
    title: "Bước 1: SFT",
    subtitle: "Supervised Fine-Tuning",
    desc: "Huấn luyện mô hình tuân theo chỉ dẫn bằng dữ liệu do con người viết. Giống dạy học sinh làm bài mẫu.",
    color: "#3b82f6",
    details: [
      "Dữ liệu: cặp (prompt, response) do chuyên gia viết",
      "Mục tiêu: mô hình sinh ra câu trả lời giống mẫu",
      "Kết quả: mô hình biết tuân theo chỉ dẫn cơ bản",
    ],
  },
  {
    title: "Bước 2: Reward Model",
    subtitle: "Huấn luyện mô hình thưởng",
    desc: "Con người xếp hạng nhiều câu trả lời. Mô hình thưởng học từ sở thích này — trở thành 'giám khảo' AI.",
    color: "#f59e0b",
    details: [
      "Con người so sánh: 'Phản hồi A tốt hơn B'",
      "Reward model học dự đoán sở thích con người",
      "Kết quả: hàm score(response) → điểm số",
    ],
  },
  {
    title: "Bước 3: PPO",
    subtitle: "Tối ưu hóa chính sách",
    desc: "Mô hình liên tục sinh câu trả lời, nhận điểm từ reward model, rồi cải thiện — giống luyện tập có huấn luyện viên.",
    color: "#22c55e",
    details: [
      "Mô hình sinh phản hồi → Reward Model chấm điểm",
      "PPO cập nhật trọng số để tăng điểm thưởng",
      "KL penalty ngăn mô hình đi quá xa bản SFT",
    ],
  },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao RLHF cần reward model thay vì trực tiếp dùng phản hồi con người?",
    options: [
      "Vì con người không đủ thông minh để đánh giá",
      "Vì RL cần chấm điểm hàng triệu lần — con người không thể làm nhanh vậy, nên cần AI thay thế",
      "Vì reward model cho điểm chính xác hơn con người",
      "Vì reward model rẻ hơn con người",
    ],
    correct: 1,
    explanation:
      "PPO cần reward signal cho mỗi response sinh ra (hàng triệu lần). Con người không thể chấm nhanh như vậy, nên ta huấn luyện reward model để 'thay mặt' con người đánh giá.",
  },
  {
    question: "KL-divergence penalty trong RLHF có vai trò gì?",
    options: [
      "Tăng tốc huấn luyện",
      "Ngăn mô hình đi quá xa mô hình SFT gốc, tránh reward hacking",
      "Giảm chi phí tính toán",
      "Tăng chất lượng dữ liệu huấn luyện",
    ],
    correct: 1,
    explanation:
      "Không có KL penalty, mô hình sẽ tìm cách 'hack' reward model — sinh ra câu trả lời được điểm cao nhưng vô nghĩa. KL penalty giữ mô hình gần với bản SFT ổn định.",
  },
  {
    question: "ChatGPT, Claude dùng kỹ thuật alignment nào?",
    options: [
      "Chỉ dùng SFT, không cần RLHF",
      "RLHF hoặc các biến thể của nó (RLAIF, Constitutional AI)",
      "Chỉ dùng prompt engineering",
      "Chỉ dùng DPO",
    ],
    correct: 1,
    explanation:
      "ChatGPT dùng RLHF gốc, Claude dùng RLAIF + Constitutional AI (biến thể của RLHF). Hầu hết LLM hàng đầu đều dùng RLHF hoặc biến thể để alignment.",
  },
  {
    type: "fill-blank",
    question: "RLHF có 3 bước: SFT → huấn luyện {blank} (học sở thích con người, thay mặt con người chấm điểm) → dùng {blank} (thuật toán RL phổ biến nhất) để tối ưu policy theo điểm thưởng.",
    blanks: [
      { answer: "reward model", accept: ["mô hình thưởng", "rm", "reward-model"] },
      { answer: "PPO", accept: ["ppo", "proximal policy optimization"] },
    ],
    explanation: "RLHF chuẩn gồm: (1) SFT học format trả lời từ ví dụ mẫu, (2) Reward Model học sở thích con người từ pairwise comparisons để chấm điểm hàng triệu phản hồi, (3) PPO (Proximal Policy Optimization) cập nhật chính sách để tăng reward kèm KL penalty tránh đi xa bản SFT.",
  },
];

export default function RLHFTopic() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="GPT-3 rất giỏi viết văn nhưng hay nói bậy, bịa đặt, và không nghe lời. OpenAI đã biến nó thành ChatGPT bằng cách nào?"
          options={[
            "Huấn luyện lại từ đầu trên dữ liệu sạch hơn",
            "Dùng phản hồi của con người để dạy AI phân biệt câu trả lời tốt và xấu, rồi tối ưu bằng RL",
            "Thêm bộ lọc từ ngữ xấu vào đầu ra",
          ]}
          correct={1}
          explanation="RLHF (Reinforcement Learning from Human Feedback) là bước nhảy vọt từ GPT-3 → ChatGPT. Con người dạy AI biết thế nào là 'tốt', rồi RL giúp AI liên tục cải thiện."
        >
          <p className="text-sm text-muted mt-2">
            Hãy cùng khám phá quy trình 3 bước đã thay đổi toàn bộ ngành AI.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Quy trình RLHF 3 bước
          </h3>
          <p className="text-sm text-muted mb-4">
            Nhấn vào từng bước để xem chi tiết.
          </p>

          <div className="flex gap-2 flex-wrap mb-4">
            {PIPELINE.map((s, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeStep === i ? "text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={activeStep === i ? { backgroundColor: s.color } : {}}>
                {s.title}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 700 260" className="w-full max-w-3xl mx-auto">
            {PIPELINE.map((s, i) => {
              const x = 30 + i * 230;
              const isActive = activeStep === i;
              return (
                <g key={i}>
                  <rect x={x} y="20" width="200" height="200" rx="12"
                    fill="var(--bg-surface)" stroke={s.color}
                    strokeWidth={isActive ? 2.5 : 1} opacity={isActive ? 1 : 0.4} />
                  <text x={x + 100} y="48" textAnchor="middle" fill={s.color}
                    fontSize="12" fontWeight="bold">{s.title}</text>
                  <text x={x + 100} y="65" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">
                    {s.subtitle}
                  </text>

                  {isActive && s.details.map((d, j) => (
                    <text key={j} x={x + 15} y={90 + j * 35} fill="var(--text-secondary)" fontSize="8">
                      {d.length > 42 ? d.slice(0, 42) + "..." : d}
                    </text>
                  ))}

                  {i < 2 && (
                    <line x1={x + 200} y1="120" x2={x + 230} y2="120"
                      stroke="var(--text-tertiary)" strokeWidth="2" markerEnd="url(#arrow-rlhf)" />
                  )}
                </g>
              );
            })}
            <defs>
              <marker id="arrow-rlhf" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-tertiary)" />
              </marker>
            </defs>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 mt-2">
            <p className="text-sm font-medium" style={{ color: PIPELINE[activeStep].color }}>
              {PIPELINE[activeStep].title}: {PIPELINE[activeStep].subtitle}
            </p>
            <p className="text-sm text-muted mt-1">{PIPELINE[activeStep].desc}</p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          <strong>RLHF</strong>{" "}không chỉ dạy AI kiến thức mới — nó dạy AI{" "}
          <strong>giá trị</strong>. Giống như việc dạy trẻ con không chỉ biết đọc chữ,
          mà còn biết phân biệt đúng sai, biết khi nào nên nói và khi nào nên im lặng.
          Đây là bước chuyển từ <em>thông minh</em> sang <em>hữu ích và an toàn</em>.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Mô hình AI phát hiện rằng câu trả lời dài luôn được reward model cho điểm cao hơn, nên nó bắt đầu viết rất dài dù không cần thiết. Hiện tượng này gọi là gì?"
          options={[
            "Overfitting",
            "Reward hacking — khai thác lỗ hổng của reward model",
            "Catastrophic forgetting",
            "Mode collapse",
          ]}
          correct={1}
          explanation="Reward hacking xảy ra khi mô hình tìm cách tối đa điểm thưởng mà không thực sự cải thiện chất lượng. KL penalty và reward model tốt hơn là giải pháp."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>RLHF</strong>{" "}(Reinforcement Learning from Human Feedback) là phương pháp{" "}
            <TopicLink slug="alignment">alignment</TopicLink>{" "}
            phổ biến nhất hiện nay, đứng sau ChatGPT, Claude và hầu hết LLM hàng đầu. Anthropic mở rộng RLHF thành{" "}
            <TopicLink slug="constitutional-ai">Constitutional AI</TopicLink>{" "}
            với RLAIF.
          </p>

          <p>Hàm mục tiêu của bước PPO:</p>
          <LaTeX block>{"\\max_{\\pi_\\theta} \\; \\mathbb{E}_{x \\sim D, \\, y \\sim \\pi_\\theta} \\left[ R_\\phi(x, y) - \\beta \\cdot D_{\\text{KL}}(\\pi_\\theta \\| \\pi_{\\text{SFT}}) \\right]"}</LaTeX>

          <p>
            Trong đó <LaTeX>{"R_\\phi"}</LaTeX> là reward model, <LaTeX>{"\\pi_\\theta"}</LaTeX> là chính sách hiện tại,
            {" "}<LaTeX>{"\\pi_{\\text{SFT}}"}</LaTeX> là mô hình gốc sau SFT, và{" "}
            <LaTeX>{"\\beta"}</LaTeX> kiểm soát KL penalty.
          </p>

          <Callout variant="insight" title="Ba trụ cột: Hữu ích, Trung thực, An toàn">
            RLHF hướng mô hình theo 3 giá trị: helpful (giúp ích người dùng),
            honest (không bịa đặt), harmless (không gây hại). Dữ liệu phản hồi
            từ con người mã hoá cả 3 giá trị này.
          </Callout>

          <CodeBlock language="python" title="rlhf_overview.py">{`# Bước 1: SFT
sft_model = train_sft(base_model, instruction_data)

# Bước 2: Reward Model
reward_model = train_reward_model(
    comparison_data  # [(prompt, chosen, rejected), ...]
)

# Bước 3: PPO
from trl import PPOTrainer
ppo_trainer = PPOTrainer(
    model=sft_model,
    reward_model=reward_model,
    config=PPOConfig(
        kl_penalty="kl",    # KL divergence penalty
        init_kl_coef=0.2,   # Beta - mức penalty
    ),
)
# Mô hình sinh → RM chấm → PPO cập nhật → lặp lại`}</CodeBlock>

          <Callout variant="warning" title="Hạn chế của RLHF">
            Cần nhiều phản hồi con người (tốn kém), reward model có thể bị hack,
            PPO không ổn định và có nhiều hyperparameter. Đây là lý do{" "}
            <TopicLink slug="dpo">DPO</TopicLink>{" "}
            và GRPO ra đời như các giải pháp đơn giản hơn.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về RLHF"
          points={[
            "RLHF gồm 3 bước: SFT (học tuân theo chỉ dẫn) → Reward Model (học sở thích con người) → PPO (tối ưu bằng RL).",
            "Reward model thay mặt con người chấm điểm hàng triệu câu trả lời — giải quyết nút cổ chai tốc độ.",
            "KL penalty ngăn reward hacking — giữ mô hình không đi quá xa bản SFT ổn định.",
            "RLHF biến mô hình thông minh thành mô hình hữu ích + an toàn. Là nền tảng của ChatGPT và Claude.",
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
