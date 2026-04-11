"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "deep-q-network", title: "Deep Q-Network (DQN)", titleVi: "Mang Q sau", description: "Ket hop Q-Learning voi mang no-ron sau de xu ly khong gian trang thai lon", category: "reinforcement-learning", tags: ["deep-rl", "atari", "experience-replay"], difficulty: "intermediate", relatedSlugs: ["q-learning", "actor-critic", "mlp"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function DeepQNetworkTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "DQN khac Q-Learning o diem nao?", options: ["Dung GPU", "Thay Q-TABLE bang NEURAL NETWORK: input = state (pixels/features), output = Q(s,a) cho moi action. Xu ly duoc state lon (hinh anh)", "Khong co epsilon-greedy"], correct: 1, explanation: "Q-table: bang so, chi cho state/action nho (4x4 grid = 16 states). DQN: neural network nhan bat ky state nao (210x160 pixels Atari) va output Q values. Tong quat hoa cho states chua thay bao gio!" },
    { question: "Experience Replay giai quyet van de gi?", options: ["Tang toc training", "Pha bo tuong quan thoi gian giua samples. Luu transitions vao buffer, sample RANDOM de train → data i.i.d., on dinh hon", "Giam memory"], correct: 1, explanation: "Khong co replay: train tren data tuong quan (s1→s2→s3 lien tiep) → neural network bat on. Replay buffer luu 1M transitions, sample random batch 32 → phan phoi da dang, on dinh. Giong on thi: doc lai bai cu random thay vi chi doc bai moi nhat." },
    { question: "Target network trong DQN lam gi?", options: ["Tang toc inference", "Dung COPY CU cua network de tinh target Q, cap nhat dinh ky. Tranh 'moving target' → training on dinh hon", "Giam overfitting"], correct: 1, explanation: "Khong co target network: dang toi uu Q voi target = r + gamma * max Q (cung network) → target THAY DOI moi step → bat on (chase moving target). Target network: freeze copy, cap nhat moi 10K steps → target on dinh → training on dinh." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="Atari game Breakout co 210x160x3 pixels = 100K gia tri moi frame. Q-table cho state nay can bao nhieu entries?" options={["100,000", "256^100000 — vo han! Khong the dung Q-table. Can neural network de generalize tu pixels", "1 trieu"]} correct={1} explanation="Moi pixel co 256 gia tri, 100K pixels → 256^100000 trang thai. Q-table bat kha thi! DQN: neural network (CNN) nhan 4 frames (84x84) → output Q value cho moi action. Generalize: hinh anh tuong tu → Q tuong tu. Day la breakthrough cua DeepMind (2015).">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <VisualizationSection><div className="space-y-4">
          <svg viewBox="0 0 600 140" className="w-full max-w-2xl mx-auto">
            <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">DQN Architecture</text>
            <rect x={20} y={35} width={100} height={60} rx={8} fill="#3b82f6" opacity={0.8} /><text x={70} y={60} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">State</text><text x={70} y={78} textAnchor="middle" fill="white" fontSize={7}>4x84x84 pixels</text>
            <text x={145} y={68} fill="#94a3b8" fontSize={14}>→</text>
            <rect x={170} y={30} width={120} height={70} rx={8} fill="#f59e0b" opacity={0.8} /><text x={230} y={55} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">CNN + FC</text><text x={230} y={73} textAnchor="middle" fill="white" fontSize={7}>Neural Network</text><text x={230} y={87} textAnchor="middle" fill="white" fontSize={7}>(Q-function)</text>
            <text x={315} y={68} fill="#94a3b8" fontSize={14}>→</text>
            <rect x={340} y={35} width={120} height={60} rx={8} fill="#22c55e" opacity={0.8} /><text x={400} y={58} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Q(s, a)</text><text x={400} y={78} textAnchor="middle" fill="white" fontSize={7}>cho moi action</text>
            <text x={485} y={68} fill="#94a3b8" fontSize={14}>→</text>
            <rect x={500} y={45} width={80} height={40} rx={8} fill="#8b5cf6" opacity={0.8} /><text x={540} y={70} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">argmax</text>
            <text x={300} y={125} textAnchor="middle" fill="#64748b" fontSize={9}>+ Experience Replay Buffer + Target Network → Training on dinh</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>DQN = Q-Learning + Neural Network + 2 tricks: <strong>Experience Replay</strong>{" "}(luu va sample random) + <strong>Target Network</strong>{" "}(freeze target). 3 thanh phan nay bien RL tu 'thu nghiem nho' thanh he thong <strong>danh bai con nguoi o Atari</strong>{" "}(2015) — dot pha mo ra ky nguyen Deep RL!</p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="Replay buffer cua ban co 1M transitions. Moi step train tren batch 32 random samples. Tai sao random thay vi sample moi nhat?" options={["Random nhanh hon", "Moi nhat = correlated (s1→s2→s3 tu 1 episode) → gradient bat on. Random pha correlation → i.i.d. samples → training on dinh", "Khong co ly do"]} correct={1} explanation="Data tu 1 episode rat correlated (agent di 1 duong). Train tren correlated data → network bi bias ve experience gan nhat, quen kinh nghiem cu. Random sampling: moi batch co transitions da dang tu nhieu episodes → gradient on dinh, hoc deu." /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>Deep Q-Network (DQN)</strong>{" "}thay Q-table bang neural network, xu ly state lon (pixels). 3 innovations chinh:</p>
        <p><strong>Loss function:</strong></p>
        <LaTeX block>{"\\mathcal{L}(\\theta) = \\mathbb{E}\\left[\\left(r + \\gamma \\max_{a'} Q(s', a'; \\theta^-) - Q(s, a; \\theta)\\right)^2\\right]"}</LaTeX>
        <p><LaTeX>{"\\theta^-"}</LaTeX> = target network weights (cap nhat dinh ky).</p>
        <Callout variant="tip" title="Double DQN">DQN overestimate Q values (max operator bias). Double DQN: online network CHON action, target network DANH GIA gia tri → giam overestimation 30-50%. Van Hasselt et al. (2016).</Callout>
        <CodeBlock language="python" title="DQN voi PyTorch">{`import torch
import torch.nn as nn
from collections import deque
import random

class DQN(nn.Module):
    def __init__(self, state_dim, action_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 128), nn.ReLU(),
            nn.Linear(128, 128), nn.ReLU(),
            nn.Linear(128, action_dim),
        )
    def forward(self, x): return self.net(x)

# Experience Replay Buffer
replay = deque(maxlen=100000)

# Training step
def train_dqn(q_net, target_net, optimizer, batch_size=32):
    batch = random.sample(replay, batch_size)
    states, actions, rewards, next_states, dones = zip(*batch)

    q_values = q_net(states).gather(1, actions)
    with torch.no_grad():
        next_q = target_net(next_states).max(1)[0]
        targets = rewards + 0.99 * next_q * (1 - dones)

    loss = nn.MSELoss()(q_values.squeeze(), targets)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

# Cap nhat target network moi 10K steps
# target_net.load_state_dict(q_net.state_dict())`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["DQN = Q-Learning + Neural Network. Xu ly state lon (pixels) ma Q-table khong the.", "Experience Replay: luu transitions, sample random → pha correlation, training on dinh.", "Target Network: freeze copy de tinh target → tranh 'moving target' problem.", "Double DQN giam overestimation. Dueling DQN tach Value va Advantage.", "Breakthrough: DQN danh bai con nguoi o 49 game Atari (DeepMind, 2015)."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
