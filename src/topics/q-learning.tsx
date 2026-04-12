"use client";

import { useState, useCallback, useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX, TopicLink } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "q-learning", title: "Q-Learning", titleVi: "Q-Learning", description: "Thuật toán học tăng cường cơ bản học giá trị hành động tối ưu từ trải nghiệm", category: "reinforcement-learning", tags: ["reinforcement", "q-table", "reward"], difficulty: "beginner", relatedSlugs: ["deep-q-network", "multi-armed-bandit", "supervised-unsupervised-rl"], vizType: "interactive" };

/* ── Grid World ── */
const GRID = 4;
const GOAL = { r: 3, c: 3 };
const TRAP = { r: 1, c: 2 };
const ACTIONS = ["Up", "Right", "Down", "Left"] as const;
const DELTAS: Record<string, [number, number]> = { Up: [-1, 0], Right: [0, 1], Down: [1, 0], Left: [0, -1] };

function getReward(r: number, c: number): number {
  if (r === GOAL.r && c === GOAL.c) return 10;
  if (r === TRAP.r && c === TRAP.c) return -5;
  return -0.1;
}

function initQ(): number[][][] {
  return Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => [0, 0, 0, 0]));
}

const TOTAL_STEPS = 7;

export default function QLearningTopic() {
  const [qTable, setQTable] = useState(initQ);
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [episodes, setEpisodes] = useState(0);

  const trainStep = useCallback(() => {
    setQTable(prev => {
      const qt = prev.map(row => row.map(cell => [...cell]));
      const { r, c } = pos;
      const aIdx = Math.random() < 0.3 ? Math.floor(Math.random() * 4) : qt[r][c].indexOf(Math.max(...qt[r][c]));
      const [dr, dc] = DELTAS[ACTIONS[aIdx]];
      const nr = Math.max(0, Math.min(GRID - 1, r + dr));
      const nc = Math.max(0, Math.min(GRID - 1, c + dc));
      const reward = getReward(nr, nc);
      qt[r][c][aIdx] += 0.5 * (reward + 0.9 * Math.max(...qt[nr][nc]) - qt[r][c][aIdx]);
      setPos(nr === GOAL.r && nc === GOAL.c ? { r: 0, c: 0 } : { r: nr, c: nc });
      if (nr === GOAL.r && nc === GOAL.c) setEpisodes(e => e + 1);
      return qt;
    });
  }, [pos]);

  const runMany = useCallback(() => { for (let i = 0; i < 100; i++) trainStep(); }, [trainStep]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Q(s,a) đại diện cho gì?", options: ["Xác suất hành động a thành công", "GIÁ TRỊ KỲ VỌNG của tổng reward tương lai nếu thực hiện hành động a tại state s rồi theo chính sách tối ưu", "Số lần đã thực hiện hành động a"], correct: 1, explanation: "Q(s,a) = 'hành động a tại state s tốt đến đâu?' Giá trị cao = hành động tốt (dẫn đến nhiều reward). Agent chọn action có Q cao nhất tại mỗi state → chính sách tối ưu. Q-Learning học Q table từ trải nghiệm (trial-and-error)." },
    { question: "Epsilon-greedy: tại sao cần random action (explore)?", options: ["Để chậm hơn", "Nếu luôn chọn action có Q cao nhất (exploit) → có thể bị kẹt ở local optimum, bỏ lỡ đường tốt hơn. Cần explore để tìm", "Vì model chưa học xong"], correct: 1, explanation: "Explore vs Exploit dilemma: luôn exploit = có thể miss đường tắt (local optimum). Luôn explore = không tận dụng kiến thức đã học. Epsilon-greedy: 90% exploit (chọn best Q), 10% explore (random) → cân bằng học và khai thác." },
    { question: "Discount factor gamma (0.9) làm gì?", options: ["Giảm learning rate", "Cân bằng reward NGAY (gần) và reward TƯƠNG LAI (xa). Gamma cao (0.99) = nhìn xa. Gamma thấp (0.5) = nhìn gần", "Giảm số episodes"], correct: 1, explanation: "Gamma = 0.9: reward 1 bước sau giảm 10%, 2 bước: 19%, 10 bước: 65%. Nghĩa là agent 'quan tâm' reward gần nhiều hơn reward xa. Gamma = 0.99: nhìn xa (tốt cho planning). Gamma = 0.5: nhìn gần (tốt cho reactive). Grab dùng gamma cao để tối ưu route dài." },
    {
      type: "fill-blank",
      question: "Công thức cập nhật Q-Learning dựa trên phương trình {blank}, sử dụng hàm giá trị hành động ký hiệu là {blank}.",
      blanks: [
        { answer: "Bellman", accept: ["bellman"] },
        { answer: "Q(s,a)", accept: ["q(s,a)", "Q(s, a)"] },
      ],
      explanation: "Bellman equation là nền tảng của Q-Learning: Q(s,a) = E[r + gamma * max_{a'} Q(s', a')]. Học Q(s,a) = học giá trị kỳ vọng của việc thực hiện action a tại state s.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate question="Grab cần tìm đường ngắn nhất cho tài xế. Mỗi ngã tư có nhiều hướng, không biết trước đường nào kẹt. Tài xế học bằng cách nào?" options={["Lập trình mỗi ngã tư bằng tay", "Thử nhiều đường, nhớ đường nào nhanh (reward cao), lần sau ưu tiên đường đó — đây là Q-Learning!", "Luôn đi thẳng"]} correct={1} explanation="Q-Learning: tại mỗi ngã tư (state), thử hành động (rẽ trái/phải/thẳng), nhận reward (nhanh = +, chậm = -). Dần dần xây dựng 'bản đồ giá trị' (Q-table): tại mỗi ngã tư, biết rẽ hướng nào có giá trị cao nhất. Grab dùng RL tương tự cho 30 triệu chuyến/ngày!">
          <p className="text-sm text-muted mt-2">
            Hãy tiếp tục để tự huấn luyện một agent Q-Learning.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">Click <strong className="text-foreground">Train 1 bước</strong>{" "}hoặc <strong className="text-foreground">Train 100 bước</strong>{" "}để xem agent học cách đi đến đích (góc dưới-phải).</p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              <button onClick={trainStep} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Train 1 bước</button>
              <button onClick={runMany} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Train 100 bước</button>
              <button onClick={() => { setQTable(initQ()); setPos({ r: 0, c: 0 }); setEpisodes(0); }} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground">Reset</button>
            </div>
            <svg viewBox="0 0 400 400" className="w-full max-w-sm mx-auto">
              {Array.from({ length: GRID }, (_, r) => Array.from({ length: GRID }, (_, c) => {
                const x = c * 100; const y = r * 100;
                const maxQ = Math.max(...qTable[r][c]);
                const fill = r === GOAL.r && c === GOAL.c ? "#22c55e" : r === TRAP.r && c === TRAP.c ? "#ef4444" : maxQ > 3 ? "#3b82f6" : "#1e293b";
                const isAgent = pos.r === r && pos.c === c;
                return (<g key={`${r}${c}`}>
                  <rect x={x + 2} y={y + 2} width={96} height={96} rx={8} fill={fill} opacity={0.3} stroke={isAgent ? "#f59e0b" : "#475569"} strokeWidth={isAgent ? 3 : 1} />
                  {r === GOAL.r && c === GOAL.c && <text x={x + 50} y={y + 55} textAnchor="middle" fill="#22c55e" fontSize={12} fontWeight="bold">ĐÍCH</text>}
                  {r === TRAP.r && c === TRAP.c && <text x={x + 50} y={y + 55} textAnchor="middle" fill="#ef4444" fontSize={12} fontWeight="bold">BẪY</text>}
                  {isAgent && <circle cx={x + 50} cy={y + 50} r={15} fill="#f59e0b" />}
                  <text x={x + 50} y={y + 92} textAnchor="middle" fill="#64748b" fontSize={7}>Q:{maxQ.toFixed(1)}</text>
                </g>);
              }))}
            </svg>
            <p className="text-center text-sm text-muted">Episodes hoàn thành: <strong>{episodes}</strong></p>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment><p>Sau nhiều lần thử, agent <strong>học được bản đồ giá trị</strong>{" "}(Q-table): tại mỗi ô, biết đi hướng nào có giá trị cao nhất. Q values <strong>lan ngược từ đích</strong>{" "}— ô gần đích có Q cao, ô xa Q thấp hơn. Agent đi theo gradient của Q values đến đích — giống nước chảy từ núi xuống thung lũng!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge question="Agent có epsilon=0.3 (30% random). Sau 1000 episodes, agent đã học tốt. Nên giảm epsilon xuống 0.05 không?" options={["Không — giữ 0.3 để tiếp tục explore", "CÓ — agent đã học → nên exploit nhiều hơn (0.05 = 95% chọn best action). Giảm dần epsilon là chiến lược chuẩn", "Đặt epsilon = 0 (không explore)"]} correct={1} explanation="Epsilon decay: ban đầu explore nhiều (0.3-1.0) để khám phá. Dần dần giảm (0.05-0.01) để khai thác kiến thức đã học. Epsilon = 0 nguy hiểm: môi trường thay đổi thì không adapt được. Giữ 0.01-0.05 để vẫn explore chút ít." />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Q-Learning</strong>{" "}là thuật toán RL học giá trị Q(s,a) — 'hành động a tại state s tốt đến đâu?' — từ trải nghiệm (off-policy, model-free). Khi state space quá lớn (hình ảnh, game), Q-table được thay bằng neural network — xem{" "}
            <TopicLink slug="deep-q-network">Deep Q-Network (DQN)</TopicLink>. Một nhánh khác là học trực tiếp policy thay vì value function — xem{" "}
            <TopicLink slug="policy-gradient">Policy Gradient</TopicLink>.</p>
          <p><strong>Q-value update rule:</strong></p>
          <LaTeX block>{"Q(s_t, a_t) \\leftarrow Q(s_t, a_t) + \\alpha \\left[ r_t + \\gamma \\max_{a'} Q(s_{t+1}, a') - Q(s_t, a_t) \\right]"}</LaTeX>
          <p>Trong đó: <LaTeX>{"\\alpha"}</LaTeX> = learning rate, <LaTeX>{"\\gamma"}</LaTeX> = discount factor, <LaTeX>{"r_t"}</LaTeX> = reward.</p>
          <Callout variant="tip" title="Off-policy">Q-Learning là off-policy: update Q dựa trên best action (max Q), không phải action thực sự đã thực hiện. Ưu điểm: học từ bất kỳ data nào (replay buffer). Nhược điểm: có thể overestimate Q values.</Callout>
          <CodeBlock language="python" title="Q-Learning cho grid world">{`import numpy as np

# Q-table: states x actions
q_table = np.zeros((16, 4))  # 4x4 grid, 4 actions
alpha, gamma, epsilon = 0.5, 0.9, 0.3

for episode in range(1000):
    state = 0  # Start
    while state != 15:  # Goal
        # Epsilon-greedy action selection
        if np.random.random() < epsilon:
            action = np.random.randint(4)  # Explore
        else:
            action = np.argmax(q_table[state])  # Exploit

        next_state, reward = env.step(state, action)

        # Q-Learning update
        q_table[state, action] += alpha * (
            reward + gamma * np.max(q_table[next_state])
            - q_table[state, action]
        )
        state = next_state

    # Epsilon decay
    epsilon = max(0.01, epsilon * 0.995)

# Sau 1000 episodes: agent học đường tối ưu
# Policy: tại mỗi state, chọn action có Q cao nhất`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={["Q(s,a) = giá trị kỳ vọng nếu thực hiện action a tại state s. Agent chọn action có Q cao nhất.", "Update rule: Q mới = Q cũ + alpha * (reward + gamma * max Q tiếp theo - Q cũ).", "Epsilon-greedy: explore (random) vs exploit (best Q). Giảm epsilon dần theo thời gian.", "Off-policy: học từ best action (max Q) không phải action thực hiện → linh hoạt hơn.", "Hạn chế: Q-table chỉ cho state/action nhỏ. State lớn (hình ảnh) → cần Deep Q-Network (DQN)."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
