"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX, TopicLink } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "actor-critic", title: "Actor-Critic (A2C/A3C)", titleVi: "Actor-Critic", description: "Kiến trúc kết hợp mạng chính sách (Actor) và mạng đánh giá (Critic) để học ổn định hơn", category: "reinforcement-learning", tags: ["a2c", "a3c", "advantage"], difficulty: "advanced", relatedSlugs: ["policy-gradient", "deep-q-network", "rlhf"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function ActorCriticTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Actor và Critic làm gì?", options: ["Actor và Critic là 2 tên gọi của cùng 1 network", "Actor: chọn action (policy). Critic: đánh giá action đó tốt hay xấu (value function). Giống diễn viên và đạo diễn", "Actor xử lý ảnh, Critic xử lý text"], correct: 1, explanation: "Actor = diễn viên: hành động (chọn action). Critic = đạo diễn: đánh giá (tốt/xấu, cho điểm). Actor học từ feedback của Critic. Critic học từ reward thật. Kết hợp: ổn định hơn REINFORCE (Actor only) và hiệu quả hơn DQN (Critic only)." },
    { question: "Advantage function A(s,a) = Q(s,a) - V(s) có ý nghĩa gì?", options: ["Đo accuracy của model", "Action a TẠI state s tốt/xấu hơn TRUNG BÌNH bao nhiêu. A > 0: tốt hơn TB → tăng xác suất. A < 0: xấu hơn TB → giảm", "Khoảng cách giữa 2 states"], correct: 1, explanation: "V(s) = giá trị trung bình của state s. Q(s,a) = giá trị nếu thực hiện action a. A(s,a) = Q(s,a) - V(s) = action a tốt/xấu hơn average bao nhiêu. Dùng A thay vì Q giảm variance (vì đã trừ baseline V). Đây là 'Advantage' trong A2C." },
    { question: "PPO (dùng trong ChatGPT RLHF) cải thiện Actor-Critic thế nào?", options: ["Dùng model lớn hơn", "CLIP ratio của policy change → ngăn policy thay đổi quá nhiều mỗi step → training ổn định, không bị collapse", "Dùng nhiều data hơn"], correct: 1, explanation: "Policy gradient có thể thay đổi policy nhiều trong 1 step → học không ổn định. PPO clip: ratio = pi_new/pi_old, giới hạn trong [1-eps, 1+eps] (eps=0.2). Policy chỉ thay đổi tối đa 20%/step. Ổn định + đơn giản → algorithm mặc định cho RLHF (ChatGPT, Claude)." },
    {
      type: "fill-blank",
      question: "Trong Actor-Critic: mạng {blank} đóng vai diễn viên chọn action theo policy, còn mạng {blank} đóng vai đạo diễn ước lượng value.",
      blanks: [
        { answer: "Actor", accept: ["actor", "diễn viên"] },
        { answer: "Critic", accept: ["critic", "đạo diễn"] },
      ],
      explanation: "Actor học policy π(a|s) — quyết định hành động. Critic học value V(s) hoặc Q(s,a) — đánh giá xem state/action đó tốt xấu thế nào. Critic cung cấp baseline để giảm variance cho Actor.",
    },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
      <PredictionGate question="REINFORCE (Policy Gradient) có variance cao vì chỉ dùng return làm tín hiệu học. DQN chỉ học value, không học policy trực tiếp. Có cách kết hợp ưu điểm cả hai?" options={["Không — phải chọn 1 trong 2", "Actor-Critic: Actor (policy) chọn action, Critic (value) đánh giá → variance thấp + policy trực tiếp", "Dùng model lớn hơn"]} correct={1} explanation="Actor-Critic = best of both worlds! Actor học policy (như REINFORCE nhưng variance thấp hơn vì Critic đánh giá). Critic học value function (như DQN nhưng hỗ trợ Actor). PPO (variant của Actor-Critic) là thuật toán dùng cho RLHF trong ChatGPT và Claude!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection><div className="space-y-4">
          <svg viewBox="0 0 600 130" className="w-full max-w-2xl mx-auto">
            <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">Actor-Critic Architecture</text>
            <rect x={20} y={35} width={100} height={50} rx={8} fill="#3b82f6" /><text x={70} y={55} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">State</text><text x={70} y={72} textAnchor="middle" fill="white" fontSize={7}>Observation</text>
            <line x1={120} y1={55} x2={170} y2={40} stroke="#22c55e" strokeWidth={2} /><line x1={120} y1={65} x2={170} y2={80} stroke="#f59e0b" strokeWidth={2} />
            <rect x={175} y={25} width={130} height={35} rx={8} fill="#22c55e" /><text x={240} y={47} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Actor (Policy)</text>
            <rect x={175} y={67} width={130} height={35} rx={8} fill="#f59e0b" /><text x={240} y={89} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Critic (Value)</text>
            <text x={330} y={47} fill="#22c55e" fontSize={12}>→ Action</text>
            <text x={330} y={89} fill="#f59e0b" fontSize={12}>→ V(s)</text>
            <rect x={430} y={40} width={150} height={50} rx={8} fill="#8b5cf6" opacity={0.3} stroke="#8b5cf6" strokeWidth={1.5} />
            <text x={505} y={60} textAnchor="middle" fill="#8b5cf6" fontSize={9} fontWeight="bold">Advantage</text>
            <text x={505} y={78} textAnchor="middle" fill="#94a3b8" fontSize={8}>A = r + gamma*V(s') - V(s)</text>
            <text x={300} y={120} textAnchor="middle" fill="#64748b" fontSize={9}>Actor học từ Advantage. Critic học từ TD error. Ổn định hơn REINFORCE.</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha"><AhaMoment><p>Actor = <strong>diễn viên</strong>{" "}(hành động). Critic = <strong>đạo diễn</strong>{" "}(đánh giá). Diễn viên học từ feedback đạo diễn, đạo diễn học từ khán giả (reward). Kết hợp tạo <strong>system ổn định và hiệu quả</strong>. PPO (Actor-Critic variant) là thuật toán <strong>dùng trong RLHF cho ChatGPT và Claude!</strong></p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách"><InlineChallenge question="PPO clip ratio trong [0.8, 1.2]. Nghĩa là policy chỉ thay đổi tối đa 20% mỗi step. Tại sao không cho thay đổi nhiều hơn (50%?)?" options={["Tiết kiệm compute", "Thay đổi lớn = mất ổn định. Policy A tốt → thay đổi 50% → policy B có thể tệ vì reward landscape phức tạp. Small steps an toàn hơn", "Không có lý do"]} correct={1} explanation="Trust region: policy landscape phức tạp, thay đổi lớn có thể 'nhảy' từ vùng tốt sang vùng tệ. PPO giới hạn mỗi step → bảo đảm cải thiện dần dần. Epsilon=0.2 là sweet spot: đủ nhanh để học, đủ nhỏ để ổn định. Đây là lý do PPO là default cho RLHF." /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết"><ExplanationSection>
        <p><strong>Actor-Critic</strong>{" "}kết hợp policy optimization (Actor) với value estimation (Critic) — ổn định và hiệu quả hơn dùng riêng. Về bản chất, Actor kế thừa ý tưởng từ{" "}
          <TopicLink slug="policy-gradient">Policy Gradient</TopicLink>, còn Critic học value function tương tự{" "}
          <TopicLink slug="q-learning">Q-Learning</TopicLink>.</p>
        <p><strong>Advantage Actor-Critic (A2C):</strong></p>
        <LaTeX block>{"\\text{Advantage: } A(s,a) = r + \\gamma V(s') - V(s) \\quad \\text{(TD error làm advantage estimate)}"}</LaTeX>
        <LaTeX block>{"\\nabla_\\theta J = \\mathbb{E}[\\nabla_\\theta \\log \\pi_\\theta(a|s) \\cdot A(s,a)] \\quad \\text{(Actor update)}"}</LaTeX>
        <LaTeX block>{"\\mathcal{L}_{\\text{critic}} = (r + \\gamma V(s') - V(s))^2 \\quad \\text{(Critic update)}"}</LaTeX>
        <p><strong>PPO (Proximal Policy Optimization):</strong></p>
        <LaTeX block>{"\\mathcal{L}^{\\text{CLIP}} = \\mathbb{E}\\left[\\min\\left(r_t(\\theta) A_t, \\text{clip}(r_t(\\theta), 1-\\epsilon, 1+\\epsilon) A_t\\right)\\right]"}</LaTeX>
        <Callout variant="tip" title="PPO = Default cho RLHF">PPO là thuật toán dùng cho RLHF trong ChatGPT, Claude, Gemini. Ổn định, đơn giản implement, hiệu quả. GRPO (DeepSeek) là variant không cần Critic riêng — sinh nhiều responses, rank, update policy.</Callout>
        <CodeBlock language="python" title="A2C với PyTorch">{`import torch
import torch.nn as nn

class ActorCritic(nn.Module):
    def __init__(self, state_dim, action_dim):
        super().__init__()
        self.shared = nn.Sequential(nn.Linear(state_dim, 128), nn.ReLU())
        self.actor = nn.Linear(128, action_dim)   # Policy
        self.critic = nn.Linear(128, 1)            # Value

    def forward(self, state):
        h = self.shared(state)
        return torch.softmax(self.actor(h), -1), self.critic(h)

model = ActorCritic(4, 2)

# Training: Actor học từ Advantage, Critic học từ TD error
probs, value = model(state)
_, next_value = model(next_state)
advantage = reward + 0.99 * next_value - value  # TD error
actor_loss = -(torch.log(probs[action]) * advantage.detach())
critic_loss = advantage.pow(2)
loss = actor_loss + 0.5 * critic_loss
loss.backward()`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt"><MiniSummary points={["Actor-Critic: Actor (policy) chọn action, Critic (value) đánh giá. Kết hợp ưu điểm PG + DQN.", "Advantage A(s,a) = action tốt/xấu hơn trung bình bao nhiêu → giảm variance đáng kể.", "PPO clip ratio [1-eps, 1+eps] → policy thay đổi nhỏ mỗi step → training ổn định.", "PPO là default cho RLHF (ChatGPT, Claude). GRPO là variant không cần Critic riêng.", "A3C: async parallel training. A2C: synchronous. PPO: trust region. SAC: maximum entropy."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
