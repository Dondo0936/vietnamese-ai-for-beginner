"use client";

import { useState, useCallback, useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "q-learning", title: "Q-Learning", titleVi: "Q-Learning", description: "Thuat toan hoc tang cuong co ban hoc gia tri hanh dong toi uu tu trai nghiem", category: "reinforcement-learning", tags: ["reinforcement", "q-table", "reward"], difficulty: "beginner", relatedSlugs: ["deep-q-network", "multi-armed-bandit", "supervised-unsupervised-rl"], vizType: "interactive" };

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
    { question: "Q(s,a) dai dien cho gi?", options: ["Xac suat hanh dong a thanh cong", "GIA TRI KY VONG cua tong reward tuong lai neu thuc hien hanh dong a tai state s roi theo chinh sach toi uu", "So lan da thuc hien hanh dong a"], correct: 1, explanation: "Q(s,a) = 'hanh dong a tai state s tot den dau?' Gia tri cao = hanh dong tot (dan den nhieu reward). Agent chon action co Q cao nhat tai moi state → chinh sach toi uu. Q-Learning hoc Q table tu trai nghiem (trial-and-error)." },
    { question: "Epsilon-greedy: tai sao can random action (explore)?", options: ["De cham hon", "Neu luon chon action co Q cao nhat (exploit) → co the bi ket o local optimum, bo lo duong tot hon. Can explore de tim", "Vi model chua hoc xong"], correct: 1, explanation: "Explore vs Exploit dilemma: luon exploit = co the miss duong tat (local optimum). Luon explore = khong tan dung kien thuc da hoc. Epsilon-greedy: 90% exploit (chon best Q), 10% explore (random) → can bang hoc va khai thac." },
    { question: "Discount factor gamma (0.9) lam gi?", options: ["Giam learning rate", "Can bang reward NGAY (gan) va reward TUONG LAI (xa). Gamma cao (0.99) = nhin xa. Gamma thap (0.5) = nhin gan", "Giam so episodes"], correct: 1, explanation: "Gamma = 0.9: reward 1 buoc sau giam 10%, 2 buoc: 19%, 10 buoc: 65%. Nghia la agent 'quan tam' reward gan nhieu hon reward xa. Gamma = 0.99: nhin xa (tot cho planning). Gamma = 0.5: nhin gan (tot cho reactive). Grab dung gamma cao de toi uu route dai." },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate question="Grab can tim duong ngan nhat cho tai xe. Moi nga tu co nhieu huong, khong biet truoc duong nao ket. Tai xe hoc bang cach nao?" options={["Lap trinh moi nga tu bang tay", "Thu nhieu duong, nho duong nao nhanh (reward cao), lan sau uu tien duong do — day la Q-Learning!", "Luon di thang"]} correct={1} explanation="Q-Learning: tai moi nga tu (state), thu hanh dong (re trai/phai/thang), nhan reward (nhanh = +, cham = -). Dan dan xay dung 'ban do gia tri' (Q-table): tai moi nga tu, biet re huong nao co gia tri cao nhat. Grab dung RL tuong tu cho 30 trieu chuyen/ngay!">
          <p className="text-sm text-muted mt-2">
            Hay tiep tuc de tu huan luyen mot agent Q-Learning.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">Click <strong className="text-foreground">Train 1 buoc</strong>{" "}hoac <strong className="text-foreground">Train 100 buoc</strong>{" "}de xem agent hoc cach di den dich (goc duoi-phai).</p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              <button onClick={trainStep} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Train 1 buoc</button>
              <button onClick={runMany} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Train 100 buoc</button>
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
                  {r === GOAL.r && c === GOAL.c && <text x={x + 50} y={y + 55} textAnchor="middle" fill="#22c55e" fontSize={12} fontWeight="bold">DICH</text>}
                  {r === TRAP.r && c === TRAP.c && <text x={x + 50} y={y + 55} textAnchor="middle" fill="#ef4444" fontSize={12} fontWeight="bold">BAY</text>}
                  {isAgent && <circle cx={x + 50} cy={y + 50} r={15} fill="#f59e0b" />}
                  <text x={x + 50} y={y + 92} textAnchor="middle" fill="#64748b" fontSize={7}>Q:{maxQ.toFixed(1)}</text>
                </g>);
              }))}
            </svg>
            <p className="text-center text-sm text-muted">Episodes hoan thanh: <strong>{episodes}</strong></p>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment><p>Sau nhieu lan thu, agent <strong>hoc duoc ban do gia tri</strong>{" "}(Q-table): tai moi o, biet di huong nao co gia tri cao nhat. Q values <strong>lan nguoc tu dich</strong>{" "}— o gan dich co Q cao, o xa Q thap hon. Agent di theo gradient cua Q values den dich — giong nuoc chay tu nui xuong thung lung!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge question="Agent co epsilon=0.3 (30% random). Sau 1000 episodes, agent da hoc tot. Nen giam epsilon xuong 0.05 khong?" options={["Khong — giu 0.3 de tiep tuc explore", "CO — agent da hoc → nen exploit nhieu hon (0.05 = 95% chon best action). Giam dan epsilon la chien luoc chuan", "Dat epsilon = 0 (khong explore)"]} correct={1} explanation="Epsilon decay: ban dau explore nhieu (0.3-1.0) de kham pha. Dan dan giam (0.05-0.01) de khai thac kien thuc da hoc. Epsilon = 0 nguy hiem: moi truong thay doi thi khong adapt duoc. Giu 0.01-0.05 de van explore chut it." />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p><strong>Q-Learning</strong>{" "}la thuat toan RL hoc gia tri Q(s,a) — 'hanh dong a tai state s tot den dau?' — tu trai nghiem (off-policy, model-free).</p>
          <p><strong>Q-value update rule:</strong></p>
          <LaTeX block>{"Q(s_t, a_t) \\leftarrow Q(s_t, a_t) + \\alpha \\left[ r_t + \\gamma \\max_{a'} Q(s_{t+1}, a') - Q(s_t, a_t) \\right]"}</LaTeX>
          <p>Trong do: <LaTeX>{"\\alpha"}</LaTeX> = learning rate, <LaTeX>{"\\gamma"}</LaTeX> = discount factor, <LaTeX>{"r_t"}</LaTeX> = reward.</p>
          <Callout variant="tip" title="Off-policy">Q-Learning la off-policy: update Q dua tren best action (max Q), khong phai action thuc su da thuc hien. Uu diem: hoc tu bat ky data nao (replay buffer). Nhuoc diem: co the overestimate Q values.</Callout>
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

# Sau 1000 episodes: agent hoc duong toi uu
# Policy: tai moi state, chon action co Q cao nhat`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={["Q(s,a) = gia tri ky vong neu thuc hien action a tai state s. Agent chon action co Q cao nhat.", "Update rule: Q moi = Q cu + alpha * (reward + gamma * max Q tiep theo - Q cu).", "Epsilon-greedy: explore (random) vs exploit (best Q). Giam epsilon dan theo thoi gian.", "Off-policy: hoc tu best action (max Q) khong phai action thuc hien → linh hoat hon.", "Han che: Q-table chi cho state/action nho. State lon (hinh anh) → can Deep Q-Network (DQN)."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
