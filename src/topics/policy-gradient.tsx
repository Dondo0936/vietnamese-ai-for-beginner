"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "policy-gradient", title: "Policy Gradient", titleVi: "Gradient chinh sach", description: "Phuong phap toi uu truc tiep chinh sach hanh dong bang gradient ascent tren phan thuong ky vong", category: "reinforcement-learning", tags: ["reinforce", "policy", "optimization"], difficulty: "intermediate", relatedSlugs: ["actor-critic", "q-learning", "gradient-descent"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function PolicyGradientTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Policy Gradient khac Q-Learning o diem nao co ban?", options: ["Dung nhieu GPU hon", "Q-Learning hoc VALUE function roi suy ra policy. Policy Gradient hoc TRUC TIEP policy pi(a|s) — mapping state→action probabilities", "Khong khac"], correct: 1, explanation: "Q-Learning: hoc Q(s,a) → chon argmax. Policy Gradient: hoc truc tiep pi(a|s) = P(action|state). Uu diem PG: xu ly action space lien tuc (robot arm), stochastic policies (can thiet cho game). Nhuoc diem: variance cao, can nhieu samples." },
    { question: "Tai sao Policy Gradient co variance cao?", options: ["Vi dung nhieu params", "Reward signal DELAYED va NOISY: cung action nhung khac episodes co reward khac nhau → gradient dao dong manh", "Vi learning rate qua lon"], correct: 1, explanation: "Episode 1: action A → reward 10. Episode 2: cung action A → reward 2 (do moi truong random). Gradient estimate dao dong manh. Giai phap: baseline subtraction (tru mean reward) giam variance ma khong thay doi expected gradient." },
    { question: "REINFORCE algorithm la gi?", options: ["Ten cua deep learning framework", "Policy gradient co ban nhat: sample episode, tinh return, update policy theo gradient = return x grad(log pi)", "Ky thuat tang cuong data"], correct: 1, explanation: "REINFORCE (Williams 1992): (1) Sample toan bo episode theo policy, (2) Tinh return G_t cho moi step, (3) Update: theta += alpha * G_t * grad(log pi(a_t|s_t)). Don gian nhung variance cao. Actor-Critic cai thien bang cach dung Critic danh gia." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="Robot can dieu khien canh tay (goc xoay 0-360 do — lien tuc). Q-Learning can discretize thanh 36 bins → mat do chinh xac. Co cach nao tot hon?" options={["Discretize nhieu hon (3600 bins)", "Policy Gradient: hoc TRUC TIEP phan phoi xac suat tren action lien tuc — output mean va std cua Gaussian", "Khong the dung RL cho action lien tuc"]} correct={1} explanation="Q-Learning: output Q cho moi action roi ly tan → action lien tuc phai discretize (mat thong tin). Policy Gradient: output mean + std cua Gaussian → sample action lien tuc truc tiep. Tu nhien cho robot, xe tu lai, bat ky action space lien tuc nao.">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <VisualizationSection><div className="space-y-4">
          <svg viewBox="0 0 600 100" className="w-full max-w-2xl mx-auto">
            <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">Q-Learning vs Policy Gradient</text>
            <rect x={20} y={30} width={260} height={50} rx={8} fill="#3b82f6" opacity={0.3} stroke="#3b82f6" strokeWidth={1.5} />
            <text x={150} y={50} textAnchor="middle" fill="#3b82f6" fontSize={9} fontWeight="bold">Q-Learning: hoc Q(s,a) → argmax</text>
            <text x={150} y={68} textAnchor="middle" fill="#94a3b8" fontSize={8}>Discrete actions. Indirect policy.</text>
            <rect x={320} y={30} width={260} height={50} rx={8} fill="#22c55e" opacity={0.3} stroke="#22c55e" strokeWidth={1.5} />
            <text x={450} y={50} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold">Policy Gradient: hoc pi(a|s) truc tiep</text>
            <text x={450} y={68} textAnchor="middle" fill="#94a3b8" fontSize={8}>Continuous actions. Direct policy.</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>Q-Learning: hoc <strong>ban do gia tri</strong>{" "}roi suy ra duong di. Policy Gradient: hoc <strong>truc tiep cach di</strong>. Giong hoc lai xe: Q-Learning = hoc gia tri moi nga tu roi tinh duong. PG = hoc truc tiep phan xa lai xe (bao nhieu do, nhanh/cham). PG tu nhien hon cho hanh dong lien tuc!</p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="REINFORCE co van de: variance cao vi dung toan bo episode return. Cach don gian nhat de giam variance?" options={["Tang learning rate", "Tru baseline b (vi du mean return) tu return: G_t - b. Gradient khong doi nhung variance giam dang ke", "Dung nhieu episodes hon"]} correct={1} explanation="Baseline subtraction: thay vi gradient = G_t * grad(log pi), dung (G_t - b) * grad(log pi). Neu b = mean(G), action tot hon trung binh → gradient duong (tang xac suat). Action te → gradient am (giam). Khong thay doi expected gradient nhung variance giam 50-90%!" /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>Policy Gradient</strong>{" "}toi uu truc tiep policy pi_theta(a|s) bang gradient ascent tren expected return.</p>
        <p><strong>Policy Gradient Theorem:</strong></p>
        <LaTeX block>{"\\nabla_\\theta J(\\theta) = \\mathbb{E}_{\\pi_\\theta}\\left[\\sum_{t=0}^{T} \\nabla_\\theta \\log \\pi_\\theta(a_t|s_t) \\cdot G_t\\right]"}</LaTeX>
        <p><strong>REINFORCE voi baseline:</strong></p>
        <LaTeX block>{"\\nabla_\\theta J(\\theta) = \\mathbb{E}\\left[\\nabla_\\theta \\log \\pi_\\theta(a_t|s_t) \\cdot (G_t - b)\\right]"}</LaTeX>
        <Callout variant="tip" title="Continuous Actions">Cho actions lien tuc: policy output mean mu va std sigma cua Gaussian. Sample action: a ~ N(mu, sigma^2). Gradient: grad log N(a|mu, sigma) tinh duoc closed-form. Day la cach robot, xe tu lai hoc dieu khien.</Callout>
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

    # Tinh returns voi baseline
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

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["Policy Gradient hoc TRUC TIEP policy pi(a|s), khong qua Q-value. Tu nhien cho action lien tuc.", "REINFORCE: sample episode → tinh return → update gradient = G * grad(log pi).", "Baseline subtraction: tru mean return → giam variance 50-90% ma khong thay doi expected gradient.", "Uu: action lien tuc, stochastic policy. Nhuoc: variance cao, can nhieu samples, on-policy.", "Actor-Critic cai thien: dung Critic (value network) lam baseline → giam variance hon nua."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
