"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "actor-critic", title: "Actor-Critic (A2C/A3C)", titleVi: "Actor-Critic", description: "Kien truc ket hop mang chinh sach (Actor) va mang danh gia (Critic) de hoc on dinh hon", category: "reinforcement-learning", tags: ["a2c", "a3c", "advantage"], difficulty: "advanced", relatedSlugs: ["policy-gradient", "deep-q-network", "rlhf"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function ActorCriticTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Actor va Critic lam gi?", options: ["Actor va Critic la 2 ten goi cua cung 1 network", "Actor: chon action (policy). Critic: danh gia action do tot hay xau (value function). Giong dien vien va dao dien", "Actor xu ly anh, Critic xu ly text"], correct: 1, explanation: "Actor = dien vien: hanh dong (chon action). Critic = dao dien: danh gia (tot/xau, cho diem). Actor hoc tu feedback cua Critic. Critic hoc tu reward that. Ket hop: on dinh hon REINFORCE (Actor only) va hieu qua hon DQN (Critic only)." },
    { question: "Advantage function A(s,a) = Q(s,a) - V(s) co y nghia gi?", options: ["Do accuracy cua model", "Action a TAI state s tot/xau hon TRUNG BINH bao nhieu. A > 0: tot hon TB → tang xac suat. A < 0: xau hon TB → giam", "Khoang cach giua 2 states"], correct: 1, explanation: "V(s) = gia tri trung binh cua state s. Q(s,a) = gia tri neu thuc hien action a. A(s,a) = Q(s,a) - V(s) = action a tot/xau hon average bao nhieu. Dung A thay vi Q giam variance (vi da tru baseline V). Day la 'Advantage' trong A2C." },
    { question: "PPO (dung trong ChatGPT RLHF) cai thien Actor-Critic the nao?", options: ["Dung model lon hon", "CLIP ratio cua policy change → ngan policy thay doi qua nhieu moi step → training on dinh, khong bi collapse", "Dung nhieu data hon"], correct: 1, explanation: "Policy gradient co the thay doi policy nhieu trong 1 step → hoc khong on dinh. PPO clip: ratio = pi_new/pi_old, gioi han trong [1-eps, 1+eps] (eps=0.2). Policy chi thay doi toi da 20%/step. On dinh + don gian → algorithm mac dinh cho RLHF (ChatGPT, Claude)." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="REINFORCE (Policy Gradient) co variance cao vi chi dung return lam tin hieu hoc. DQN chi hoc value, khong hoc policy truc tiep. Co cach ket hop uu diem ca hai?" options={["Khong — phai chon 1 trong 2", "Actor-Critic: Actor (policy) chon action, Critic (value) danh gia → variance thap + policy truc tiep", "Dung model lon hon"]} correct={1} explanation="Actor-Critic = best of both worlds! Actor hoc policy (nhu REINFORCE nhung variance thap hon vi Critic danh gia). Critic hoc value function (nhu DQN nhung ho tro Actor). PPO (variant cua Actor-Critic) la thuat toan dung cho RLHF trong ChatGPT va Claude!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
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
            <text x={300} y={120} textAnchor="middle" fill="#64748b" fontSize={9}>Actor hoc tu Advantage. Critic hoc tu TD error. On dinh hon REINFORCE.</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>Actor = <strong>dien vien</strong>{" "}(hanh dong). Critic = <strong>dao dien</strong>{" "}(danh gia). Dien vien hoc tu feedback dao dien, dao dien hoc tu khan gia (reward). Ket hop tao <strong>system on dinh va hieu qua</strong>. PPO (Actor-Critic variant) la thuat toan <strong>dung trong RLHF cho ChatGPT va Claude!</strong></p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="PPO clip ratio trong [0.8, 1.2]. Nghia la policy chi thay doi toi da 20% moi step. Tai sao khong cho thay doi nhieu hon (50%?)?" options={["Tiet kiem compute", "Thay doi lon = mat on dinh. Policy A tot → thay doi 50% → policy B co the te vi reward landscape phuc tap. Small steps an toan hon", "Khong co ly do"]} correct={1} explanation="Trust region: policy landscape phuc tap, thay doi lon co the 'nhay' tu vung tot sang vung te. PPO gioi han moi step → bao dam cai thien dan dan. Epsilon=0.2 la sweet spot: du nhanh de hoc, du nho de on dinh. Day la ly do PPO la default cho RLHF." /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>Actor-Critic</strong>{" "}ket hop policy optimization (Actor) voi value estimation (Critic) — on dinh va hieu qua hon dung rieng.</p>
        <p><strong>Advantage Actor-Critic (A2C):</strong></p>
        <LaTeX block>{"\\text{Advantage: } A(s,a) = r + \\gamma V(s') - V(s) \\quad \\text{(TD error lam advantage estimate)}"}</LaTeX>
        <LaTeX block>{"\\nabla_\\theta J = \\mathbb{E}[\\nabla_\\theta \\log \\pi_\\theta(a|s) \\cdot A(s,a)] \\quad \\text{(Actor update)}"}</LaTeX>
        <LaTeX block>{"\\mathcal{L}_{\\text{critic}} = (r + \\gamma V(s') - V(s))^2 \\quad \\text{(Critic update)}"}</LaTeX>
        <p><strong>PPO (Proximal Policy Optimization):</strong></p>
        <LaTeX block>{"\\mathcal{L}^{\\text{CLIP}} = \\mathbb{E}\\left[\\min\\left(r_t(\\theta) A_t, \\text{clip}(r_t(\\theta), 1-\\epsilon, 1+\\epsilon) A_t\\right)\\right]"}</LaTeX>
        <Callout variant="tip" title="PPO = Default cho RLHF">PPO la thuat toan dung cho RLHF trong ChatGPT, Claude, Gemini. On dinh, don gian implement, hieu qua. GRPO (DeepSeek) la variant khong can Critic rieng — sinh nhieu responses, rank, update policy.</Callout>
        <CodeBlock language="python" title="A2C voi PyTorch">{`import torch
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

# Training: Actor hoc tu Advantage, Critic hoc tu TD error
probs, value = model(state)
_, next_value = model(next_state)
advantage = reward + 0.99 * next_value - value  # TD error
actor_loss = -(torch.log(probs[action]) * advantage.detach())
critic_loss = advantage.pow(2)
loss = actor_loss + 0.5 * critic_loss
loss.backward()`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["Actor-Critic: Actor (policy) chon action, Critic (value) danh gia. Ket hop uu diem PG + DQN.", "Advantage A(s,a) = action tot/xau hon trung binh bao nhieu → giam variance dang ke.", "PPO clip ratio [1-eps, 1+eps] → policy thay doi nho moi step → training on dinh.", "PPO la default cho RLHF (ChatGPT, Claude). GRPO la variant khong can Critic rieng.", "A3C: async parallel training. A2C: synchronous. PPO: trust region. SAC: maximum entropy."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
