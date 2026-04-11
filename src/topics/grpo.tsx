"use client";

import { useState } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "grpo",
  title: "GRPO",
  titleVi: "GRPO - Tối ưu hóa chính sách theo nhóm",
  description:
    "Phương pháp alignment hiệu quả, sử dụng phần thưởng nhóm thay vì reward model riêng biệt.",
  category: "training-optimization",
  tags: ["grpo", "alignment", "reinforcement-learning", "optimization"],
  difficulty: "advanced",
  relatedSlugs: ["rlhf", "dpo", "fine-tuning"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

const QUIZ: QuizQuestion[] = [
  {
    question: "GRPO khác PPO (RLHF) ở điểm nào cốt lõi nhất?",
    options: [
      "GRPO dùng dữ liệu ít hơn",
      "GRPO không cần critic/value function riêng — thay thế bằng trung bình nhóm (group baseline)",
      "GRPO chỉ dùng cho bài toán toán học",
      "GRPO huấn luyện nhanh hơn PPO",
    ],
    correct: 1,
    explanation:
      "PPO cần huấn luyện value function (critic) song song — tốn 2x bộ nhớ. GRPO thay critic bằng trung bình reward của nhóm phản hồi. Đơn giản hơn, tiết kiệm hơn, và ổn định hơn.",
  },
  {
    question: "GRPO phù hợp nhất cho loại bài toán nào?",
    options: [
      "Bài toán sáng tạo (viết thơ, truyện)",
      "Bài toán có verifiable reward — toán, code, logic — nơi ta kiểm tra đúng/sai tự động",
      "Bài toán dịch thuật",
      "Bài toán phân loại văn bản",
    ],
    correct: 1,
    explanation:
      "GRPO cần hàm reward rõ ràng. Bài toán toán/code có đáp án đúng/sai tự động kiểm tra → reward dễ định nghĩa. Đây là lý do DeepSeek-R1 (toán + reasoning) dùng GRPO thành công.",
  },
  {
    question: "Với mỗi prompt, GRPO sinh G = 16 phản hồi. Advantage của phản hồi i được tính thế nào?",
    options: [
      "advantage_i = reward_i",
      "advantage_i = (reward_i - mean(rewards)) / std(rewards) — chuẩn hoá trong nhóm",
      "advantage_i = reward_i - reward_max",
      "advantage_i = reward_i / sum(rewards)",
    ],
    correct: 1,
    explanation:
      "Chuẩn hoá nhóm biến reward tuyệt đối thành tương đối: phản hồi tốt hơn trung bình → advantage > 0 → tăng xác suất. Kém hơn trung bình → advantage < 0 → giảm xác suất.",
  },
];

export default function GRPOTopic() {
  const [method, setMethod] = useState<"ppo" | "dpo" | "grpo">("grpo");

  const methodInfo = {
    ppo: {
      color: "#ef4444", label: "PPO (RLHF)",
      pros: ["Exploration mạnh", "Có value function ước lượng", "Linh hoạt"],
      cons: ["Cần reward model riêng", "Cần critic/value function", "RL không ổn định", "Rất tốn VRAM"],
    },
    dpo: {
      color: "#f59e0b", label: "DPO",
      pros: ["Đơn giản — 1 bước supervised", "Không cần reward model", "Ổn định"],
      cons: ["Cần dữ liệu cặp sở thích", "Thiếu exploration", "Không dùng được verifiable reward"],
    },
    grpo: {
      color: "#22c55e", label: "GRPO",
      pros: ["Không cần reward model", "Không cần critic", "Dùng được verifiable reward", "Exploration qua sampling"],
      cons: ["Cần sinh nhiều mẫu mỗi prompt", "Reward function phải rõ ràng", "Tốn tài nguyên inference"],
    },
  };

  const info = methodInfo[method];

  return (
    <>
      {/* ━━━ 1. HOOK ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="RLHF cần reward model (tốn kém). DPO cần dữ liệu cặp sở thích (khó thu thập). Có cách alignment nào không cần cả hai?"
          options={[
            "Không — phải chọn một trong hai",
            "Có — cho mô hình sinh nhiều phiên bản, so sánh chúng với nhau thay vì dùng reward model hay dữ liệu cặp",
            "Có — chỉ cần SFT tốt là đủ",
          ]}
          correct={1}
          explanation="GRPO: sinh G phản hồi cho mỗi prompt, chấm điểm bằng hàm reward đơn giản (vd: kiểm tra đáp án toán), rồi so sánh trong nhóm. Không cần reward model, không cần dữ liệu cặp!"
        >
          <p className="text-sm text-muted mt-2">
            Đây là kỹ thuật đằng sau DeepSeek-R1 — mô hình reasoning gây chấn động đầu 2025.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ 2. TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            So sánh PPO vs DPO vs GRPO
          </h3>
          <p className="text-sm text-muted mb-4">
            Chọn từng phương pháp để so sánh ưu nhược điểm.
          </p>

          <div className="flex gap-2 flex-wrap mb-4">
            {(["ppo", "dpo", "grpo"] as const).map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  method === m ? "text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
                style={method === m ? { backgroundColor: methodInfo[m].color } : {}}>
                {methodInfo[m].label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
            <div className="rounded-lg bg-background/50 border border-green-500/30 p-3">
              <p className="text-sm font-semibold text-green-400">Ưu điểm</p>
              <ul className="text-xs text-muted space-y-1 mt-1 list-disc list-inside">
                {info.pros.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
            <div className="rounded-lg bg-background/50 border border-red-500/30 p-3">
              <p className="text-sm font-semibold text-red-400">Nhược điểm</p>
              <ul className="text-xs text-muted space-y-1 mt-1 list-disc list-inside">
                {info.cons.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>

          {/* GRPO pipeline diagram */}
          <svg viewBox="0 0 700 200" className="w-full max-w-3xl mx-auto">
            <text x="350" y="18" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontWeight="bold">
              Quy trình GRPO
            </text>

            {[
              { label: "1 Prompt", x: 30, color: "var(--text-tertiary)" },
              { label: "Sinh G mẫu", x: 170, color: "#3b82f6" },
              { label: "Chấm điểm", x: 310, color: "#f59e0b" },
              { label: "Chuẩn hoá nhóm", x: 450, color: "#8b5cf6" },
              { label: "Cập nhật", x: 590, color: "#22c55e" },
            ].map((item, i) => (
              <g key={i}>
                <rect x={item.x} y="35" width="120" height="42" rx="8" fill="var(--bg-surface)" stroke={item.color} strokeWidth="1.5" />
                <text x={item.x + 60} y="60" textAnchor="middle" fill={item.color} fontSize="9" fontWeight="bold">
                  {item.label}
                </text>
                {i < 4 && (
                  <line x1={item.x + 120} y1="56" x2={item.x + 140} y2="56"
                    stroke="var(--text-tertiary)" strokeWidth="1.5" markerEnd="url(#arr-grpo)" />
                )}
              </g>
            ))}

            {/* Detail row */}
            <text x="200" y="105" textAnchor="middle" fill="#3b82f6" fontSize="8">G = 8-64 phản hồi</text>
            <text x="370" y="105" textAnchor="middle" fill="#f59e0b" fontSize="8">reward(y_i) = ?</text>
            <text x="510" y="105" textAnchor="middle" fill="#8b5cf6" fontSize="8">adv = (r - mean) / std</text>

            {/* Example group */}
            <text x="350" y="135" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="bold">
              Ví dụ: Prompt &quot;2 + 3 = ?&quot;
            </text>

            {[
              { ans: "y1: 5", reward: "+1", color: "#22c55e" },
              { ans: "y2: 4", reward: "-1", color: "#ef4444" },
              { ans: "y3: 5", reward: "+1", color: "#22c55e" },
              { ans: "y4: 6", reward: "-1", color: "#ef4444" },
            ].map((item, i) => (
              <g key={i}>
                <rect x={80 + i * 150} y="150" width="130" height="30" rx="6" fill="var(--bg-surface)" stroke={item.color} strokeWidth="1" />
                <text x={145 + i * 150} y="169" textAnchor="middle" fill={item.color} fontSize="9">
                  {item.ans} (r={item.reward})
                </text>
              </g>
            ))}

            <defs>
              <marker id="arr-grpo" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-tertiary)" />
              </marker>
            </defs>
          </svg>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ 3. AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc aha">
        <AhaMoment>
          GRPO thay thế <strong>giám khảo chuyên nghiệp</strong>{" "}(reward model) bằng{" "}
          <strong>so sánh trong nhóm</strong>: cho mô hình viết 16 bài, bài nào tốt
          hơn trung bình thì khuyến khích, bài nào kém hơn thì giảm. Giống cách lớp
          học không cần giáo viên chấm bài — học sinh tự so sánh với nhau!
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 4. THÁCH THỨC ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="GRPO sinh 8 phản hồi cho prompt '15 x 7 = ?'. Rewards: [1, 0, 1, 1, 0, 1, 0, 1]. Mean = 0.625. Phản hồi nào có advantage dương?"
          options={[
            "Chỉ phản hồi có reward = 1 (vị trí 1, 3, 4, 6, 8) — tất cả đều trên trung bình",
            "Tất cả 8 phản hồi đều có advantage dương",
            "Chỉ phản hồi đầu tiên",
            "Không phản hồi nào — vì mean không phải 0",
          ]}
          correct={0}
          explanation="Advantage = (reward - mean) / std. Reward 1 > mean 0.625 → advantage > 0 (khuyến khích). Reward 0 < mean 0.625 → advantage < 0 (giảm xác suất). 5 phản hồi đúng được tăng, 3 sai bị giảm."
        />
      </LessonSection>

      {/* ━━━ 5. GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>GRPO</strong>{" "}(Group Relative Policy Optimization, DeepSeek 2024)
            tối ưu chính sách dựa trên so sánh tương đối trong nhóm:
          </p>

          <p>Với mỗi prompt x, sinh G phản hồi. Tính advantage:</p>
          <LaTeX block>{"\\hat{A}_i = \\frac{r_i - \\text{mean}(\\{r_1, ..., r_G\\})}{\\text{std}(\\{r_1, ..., r_G\\})}"}</LaTeX>

          <p>Hàm mục tiêu GRPO (dạng PPO clip với group advantage):</p>
          <LaTeX block>{"\\mathcal{L} = \\mathbb{E} \\left[ \\min\\left( \\rho_i \\hat{A}_i, \\; \\text{clip}(\\rho_i, 1\\!-\\!\\epsilon, 1\\!+\\!\\epsilon) \\hat{A}_i \\right) - \\beta D_{\\text{KL}}(\\pi_\\theta \\| \\pi_{\\text{ref}}) \\right]"}</LaTeX>

          <p>
            Trong đó <LaTeX>{"\\rho_i = \\pi_\\theta(y_i|x) / \\pi_{\\text{old}}(y_i|x)"}</LaTeX>{" "}
            là importance ratio, <LaTeX>{"\\epsilon"}</LaTeX> là clip range.
          </p>

          <Callout variant="insight" title="Verifiable Reward — Chìa khoá của GRPO">
            GRPO đặc biệt mạnh khi có reward tự động kiểm tra được: bài toán = kiểm
            tra đáp án, code = chạy test, logic = verify chain. DeepSeek-R1 dùng GRPO
            với math/code verifier đạt kết quả ngang/vượt OpenAI o1.
          </Callout>

          <CodeBlock language="python" title="grpo_pseudocode.py">{`# GRPO Training Loop
for prompt in dataset:
    # Sinh nhóm phản hồi
    responses = model.generate(prompt, num_return=16)

    # Chấm điểm (verifiable reward)
    rewards = [verify_answer(r, prompt.answer) for r in responses]

    # Chuẩn hoá nhóm
    mean_r, std_r = mean(rewards), std(rewards)
    advantages = [(r - mean_r) / (std_r + 1e-8) for r in rewards]

    # Cập nhật chính sách (PPO-style với group advantage)
    loss = ppo_clip_loss(model, responses, advantages, kl_coef=0.04)
    loss.backward()
    optimizer.step()`}</CodeBlock>

          <Callout variant="warning" title="Chi phí inference">
            GRPO cần sinh G phản hồi mỗi prompt (G = 8-64). Với dataset 10K prompt
            và G = 16, cần sinh 160K phản hồi mỗi epoch. Cần nhiều GPU inference
            song song để hiệu quả.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ 6. TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Những điều cần nhớ về GRPO"
          points={[
            "GRPO thay reward model bằng so sánh nhóm: sinh G phản hồi, chuẩn hoá advantage = (r - mean) / std.",
            "Không cần reward model riêng, không cần critic/value function — tiết kiệm đáng kể so với PPO.",
            "Đặc biệt mạnh cho verifiable reward (toán, code, logic) — DeepSeek-R1 dùng GRPO đạt kết quả ngang o1.",
            "Trade-off: cần sinh nhiều mẫu (inference cost) và cần reward function rõ ràng — không phù hợp cho tác vụ chủ quan.",
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
