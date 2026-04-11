"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "policy-gradient", title: "Policy Gradient", titleVi: "Gradient chính sách", description: "Phương pháp tối ưu trực tiếp chính sách hành động bằng gradient ascent trên phần thưởng kỳ vọng", category: "reinforcement-learning", tags: ["reinforce", "policy", "optimization"], difficulty: "intermediate", relatedSlugs: ["actor-critic", "q-learning", "gradient-descent"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function PolicyGradientTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Policy Gradient khác Q-Learning ở điểm nào cơ bản?", options: ["Dùng nhiều GPU hơn", "Q-Learning học VALUE function rồi suy ra policy. Policy Gradient học TRỰC TIẾP policy pi(a|s) — mapping state→action probabilities", "Không khác"], correct: 1, explanation: "Q-Learning: học Q(s,a) → chọn argmax. Policy Gradient: học trực tiếp pi(a|s) = P(action|state). Ưu điểm PG: xử lý action space liên tục (robot arm), stochastic policies (cần thiết cho game). Nhược điểm: variance cao, cần nhiều samples." },
    { question: "Tại sao Policy Gradient có variance cao?", options: ["Vì dùng nhiều params", "Reward signal DELAYED và NOISY: cùng action nhưng khác episodes có reward khác nhau → gradient dao động mạnh", "Vì learning rate quá lớn"], correct: 1, explanation: "Episode 1: action A → reward 10. Episode 2: cùng action A → reward 2 (do môi trường random). Gradient estimate dao động mạnh. Giải pháp: baseline subtraction (trừ mean reward) giảm variance mà không thay đổi expected gradient." },
    { question: "REINFORCE algorithm là gì?", options: ["Tên của deep learning framework", "Policy gradient cơ bản nhất: sample episode, tính return, update policy theo gradient = return x grad(log pi)", "Kỹ thuật tăng cường data"], correct: 1, explanation: "REINFORCE (Williams 1992): (1) Sample toàn bộ episode theo policy, (2) Tính return G_t cho mỗi step, (3) Update: theta += alpha * G_t * grad(log pi(a_t|s_t)). Đơn giản nhưng variance cao. Actor-Critic cải thiện bằng cách dùng Critic đánh giá." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
      <PredictionGate question="Robot cần điều khiển cánh tay (góc xoay 0-360 độ — liên tục). Q-Learning cần discretize thành 36 bins → mất độ chính xác. Có cách nào tốt hơn?" options={["Discretize nhiều hơn (3600 bins)", "Policy Gradient: học TRỰC TIẾP phân phối xác suất trên action liên tục — output mean và std của Gaussian", "Không thể dùng RL cho action liên tục"]} correct={1} explanation="Q-Learning: output Q cho mỗi action rời rạc → action liên tục phải discretize (mất thông tin). Policy Gradient: output mean + std của Gaussian → sample action liên tục trực tiếp. Tự nhiên cho robot, xe tự lái, bất kỳ action space liên tục nào.">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection><div className="space-y-4">
          <svg viewBox="0 0 600 100" className="w-full max-w-2xl mx-auto">
            <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">Q-Learning vs Policy Gradient</text>
            <rect x={20} y={30} width={260} height={50} rx={8} fill="#3b82f6" opacity={0.3} stroke="#3b82f6" strokeWidth={1.5} />
            <text x={150} y={50} textAnchor="middle" fill="#3b82f6" fontSize={9} fontWeight="bold">Q-Learning: học Q(s,a) → argmax</text>
            <text x={150} y={68} textAnchor="middle" fill="#94a3b8" fontSize={8}>Discrete actions. Indirect policy.</text>
            <rect x={320} y={30} width={260} height={50} rx={8} fill="#22c55e" opacity={0.3} stroke="#22c55e" strokeWidth={1.5} />
            <text x={450} y={50} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold">Policy Gradient: học pi(a|s) trực tiếp</text>
            <text x={450} y={68} textAnchor="middle" fill="#94a3b8" fontSize={8}>Continuous actions. Direct policy.</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha"><AhaMoment><p>Q-Learning: học <strong>bản đồ giá trị</strong>{" "}rồi suy ra đường đi. Policy Gradient: học <strong>trực tiếp cách đi</strong>. Giống học lái xe: Q-Learning = học giá trị mỗi ngã tư rồi tính đường. PG = học trực tiếp phản xạ lái xe (bao nhiêu độ, nhanh/chậm). PG tự nhiên hơn cho hành động liên tục!</p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách"><InlineChallenge question="REINFORCE có vấn đề: variance cao vì dùng toàn bộ episode return. Cách đơn giản nhất để giảm variance?" options={["Tăng learning rate", "Trừ baseline b (ví dụ mean return) từ return: G_t - b. Gradient không đổi nhưng variance giảm đáng kể", "Dùng nhiều episodes hơn"]} correct={1} explanation="Baseline subtraction: thay vì gradient = G_t * grad(log pi), dùng (G_t - b) * grad(log pi). Nếu b = mean(G), action tốt hơn trung bình → gradient dương (tăng xác suất). Action tệ → gradient âm (giảm). Không thay đổi expected gradient nhưng variance giảm 50-90%!" /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết"><ExplanationSection>
        <p><strong>Policy Gradient</strong>{" "}tối ưu trực tiếp policy pi_theta(a|s) bằng gradient ascent trên expected return.</p>
        <p><strong>Policy Gradient Theorem:</strong></p>
        <LaTeX block>{"\\nabla_\\theta J(\\theta) = \\mathbb{E}_{\\pi_\\theta}\\left[\\sum_{t=0}^{T} \\nabla_\\theta \\log \\pi_\\theta(a_t|s_t) \\cdot G_t\\right]"}</LaTeX>
        <p><strong>REINFORCE với baseline:</strong></p>
        <LaTeX block>{"\\nabla_\\theta J(\\theta) = \\mathbb{E}\\left[\\nabla_\\theta \\log \\pi_\\theta(a_t|s_t) \\cdot (G_t - b)\\right]"}</LaTeX>
        <Callout variant="tip" title="Continuous Actions">Cho actions liên tục: policy output mean mu và std sigma của Gaussian. Sample action: a ~ N(mu, sigma^2). Gradient: grad log N(a|mu, sigma) tính được closed-form. Đây là cách robot, xe tự lái học điều khiển.</Callout>
        <CodeBlock language="python" title="REINFORCE algorithm">{`import torch
import torch.nn as nn
import torch.distributions as dist

class PolicyNetwork(nn.Module):
    def __init__(self, state_dim, action_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 128), nn.ReLU(),
            nn.Linear(128, action_dim),
            nn.Softmax(dim=-1),  # Action probabilities
        )
    def forward(self, state):
        return self.net(state)

policy = PolicyNetwork(4, 2)
optimizer = torch.optim.Adam(policy.parameters(), lr=0.001)

# REINFORCE training
for episode in range(1000):
    log_probs, rewards = [], []
    state = env.reset()

    while not done:
        probs = policy(state)
        m = dist.Categorical(probs)
        action = m.sample()
        log_probs.append(m.log_prob(action))
        state, reward, done, _ = env.step(action.item())
        rewards.append(reward)

    # Tính returns với baseline
    G, returns = 0, []
    for r in reversed(rewards):
        G = r + 0.99 * G
        returns.insert(0, G)
    returns = torch.tensor(returns)
    returns = (returns - returns.mean()) / (returns.std() + 1e-8)  # Baseline

    # Update policy
    loss = -sum(lp * G for lp, G in zip(log_probs, returns))
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt"><MiniSummary points={["Policy Gradient học TRỰC TIẾP policy pi(a|s), không qua Q-value. Tự nhiên cho action liên tục.", "REINFORCE: sample episode → tính return → update gradient = G * grad(log pi).", "Baseline subtraction: trừ mean return → giảm variance 50-90% mà không thay đổi expected gradient.", "Ưu: action liên tục, stochastic policy. Nhược: variance cao, cần nhiều samples, on-policy.", "Actor-Critic cải thiện: dùng Critic (value network) làm baseline → giảm variance hơn nữa."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
