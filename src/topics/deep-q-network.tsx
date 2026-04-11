"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "deep-q-network", title: "Deep Q-Network (DQN)", titleVi: "Mạng Q sâu", description: "Kết hợp Q-Learning với mạng nơ-ron sâu để xử lý không gian trạng thái lớn", category: "reinforcement-learning", tags: ["deep-rl", "atari", "experience-replay"], difficulty: "intermediate", relatedSlugs: ["q-learning", "actor-critic", "mlp"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function DeepQNetworkTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "DQN khác Q-Learning ở điểm nào?", options: ["Dùng GPU", "Thay Q-TABLE bằng NEURAL NETWORK: input = state (pixels/features), output = Q(s,a) cho mỗi action. Xử lý được state lớn (hình ảnh)", "Không có epsilon-greedy"], correct: 1, explanation: "Q-table: bảng số, chỉ cho state/action nhỏ (4x4 grid = 16 states). DQN: neural network nhận bất kỳ state nào (210x160 pixels Atari) và output Q values. Tổng quát hoá cho states chưa thấy bao giờ!" },
    { question: "Experience Replay giải quyết vấn đề gì?", options: ["Tăng tốc training", "Phá bỏ tương quan thời gian giữa samples. Lưu transitions vào buffer, sample RANDOM để train → data i.i.d., ổn định hơn", "Giảm memory"], correct: 1, explanation: "Không có replay: train trên data tương quan (s1→s2→s3 liên tiếp) → neural network bất ổn. Replay buffer lưu 1M transitions, sample random batch 32 → phân phối đa dạng, ổn định. Giống ôn thi: đọc lại bài cũ random thay vì chỉ đọc bài mới nhất." },
    { question: "Target network trong DQN làm gì?", options: ["Tăng tốc inference", "Dùng COPY CŨ của network để tính target Q, cập nhật định kỳ. Tránh 'moving target' → training ổn định hơn", "Giảm overfitting"], correct: 1, explanation: "Không có target network: đang tối ưu Q với target = r + gamma * max Q (cùng network) → target THAY ĐỔI mỗi step → bất ổn (chase moving target). Target network: freeze copy, cập nhật mỗi 10K steps → target ổn định → training ổn định." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
      <PredictionGate question="Atari game Breakout có 210x160x3 pixels = 100K giá trị mỗi frame. Q-table cho state này cần bao nhiêu entries?" options={["100,000", "256^100000 — vô hạn! Không thể dùng Q-table. Cần neural network để generalize từ pixels", "1 triệu"]} correct={1} explanation="Mỗi pixel có 256 giá trị, 100K pixels → 256^100000 trạng thái. Q-table bất khả thi! DQN: neural network (CNN) nhận 4 frames (84x84) → output Q value cho mỗi action. Generalize: hình ảnh tương tự → Q tương tự. Đây là breakthrough của DeepMind (2015).">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection><div className="space-y-4">
          <svg viewBox="0 0 600 140" className="w-full max-w-2xl mx-auto">
            <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">DQN Architecture</text>
            <rect x={20} y={35} width={100} height={60} rx={8} fill="#3b82f6" opacity={0.8} /><text x={70} y={60} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">State</text><text x={70} y={78} textAnchor="middle" fill="white" fontSize={7}>4x84x84 pixels</text>
            <text x={145} y={68} fill="#94a3b8" fontSize={14}>→</text>
            <rect x={170} y={30} width={120} height={70} rx={8} fill="#f59e0b" opacity={0.8} /><text x={230} y={55} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">CNN + FC</text><text x={230} y={73} textAnchor="middle" fill="white" fontSize={7}>Neural Network</text><text x={230} y={87} textAnchor="middle" fill="white" fontSize={7}>(Q-function)</text>
            <text x={315} y={68} fill="#94a3b8" fontSize={14}>→</text>
            <rect x={340} y={35} width={120} height={60} rx={8} fill="#22c55e" opacity={0.8} /><text x={400} y={58} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Q(s, a)</text><text x={400} y={78} textAnchor="middle" fill="white" fontSize={7}>cho mỗi action</text>
            <text x={485} y={68} fill="#94a3b8" fontSize={14}>→</text>
            <rect x={500} y={45} width={80} height={40} rx={8} fill="#8b5cf6" opacity={0.8} /><text x={540} y={70} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">argmax</text>
            <text x={300} y={125} textAnchor="middle" fill="#64748b" fontSize={9}>+ Experience Replay Buffer + Target Network → Training ổn định</text>
          </svg>
        </div></VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha"><AhaMoment><p>DQN = Q-Learning + Neural Network + 2 tricks: <strong>Experience Replay</strong>{" "}(lưu và sample random) + <strong>Target Network</strong>{" "}(freeze target). 3 thành phần này biến RL từ 'thử nghiệm nhỏ' thành hệ thống <strong>đánh bại con người ở Atari</strong>{" "}(2015) — đột phá mở ra kỷ nguyên Deep RL!</p></AhaMoment></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách"><InlineChallenge question="Replay buffer của bạn có 1M transitions. Mỗi step train trên batch 32 random samples. Tại sao random thay vì sample mới nhất?" options={["Random nhanh hơn", "Mới nhất = correlated (s1→s2→s3 từ 1 episode) → gradient bất ổn. Random phá correlation → i.i.d. samples → training ổn định", "Không có lý do"]} correct={1} explanation="Data từ 1 episode rất correlated (agent đi 1 đường). Train trên correlated data → network bị bias về experience gần nhất, quên kinh nghiệm cũ. Random sampling: mỗi batch có transitions đa dạng từ nhiều episodes → gradient ổn định, học đều." /></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết"><ExplanationSection>
        <p><strong>Deep Q-Network (DQN)</strong>{" "}thay Q-table bằng neural network, xử lý state lớn (pixels). 3 innovations chính:</p>
        <p><strong>Loss function:</strong></p>
        <LaTeX block>{"\\mathcal{L}(\\theta) = \\mathbb{E}\\left[\\left(r + \\gamma \\max_{a'} Q(s', a'; \\theta^-) - Q(s, a; \\theta)\\right)^2\\right]"}</LaTeX>
        <p><LaTeX>{"\\theta^-"}</LaTeX> = target network weights (cập nhật định kỳ).</p>
        <Callout variant="tip" title="Double DQN">DQN overestimate Q values (max operator bias). Double DQN: online network CHỌN action, target network ĐÁNH GIÁ giá trị → giảm overestimation 30-50%. Van Hasselt et al. (2016).</Callout>
        <CodeBlock language="python" title="DQN với PyTorch">{`import torch
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

# Cập nhật target network mỗi 10K steps
# target_net.load_state_dict(q_net.state_dict())`}</CodeBlock>
      </ExplanationSection></LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt"><MiniSummary points={["DQN = Q-Learning + Neural Network. Xử lý state lớn (pixels) mà Q-table không thể.", "Experience Replay: lưu transitions, sample random → phá correlation, training ổn định.", "Target Network: freeze copy để tính target → tránh 'moving target' problem.", "Double DQN giảm overestimation. Dueling DQN tách Value và Advantage.", "Breakthrough: DQN đánh bại con người ở 49 game Atari (DeepMind, 2015)."]} /></LessonSection>
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
