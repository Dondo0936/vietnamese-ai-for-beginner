"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "q-learning",
  title: "Q-Learning",
  titleVi: "Q-Learning",
  description:
    "Thuật toán học tăng cường cơ bản học giá trị hành động tối ưu từ trải nghiệm",
  category: "reinforcement-learning",
  tags: ["reinforcement", "q-table", "reward"],
  difficulty: "intermediate",
  relatedSlugs: [
    "deep-q-network",
    "multi-armed-bandit",
    "supervised-unsupervised-rl",
  ],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 * Grid World 5×5 với tường và cái bẫy
 * ────────────────────────────────────────────────────────────── */
const GRID_SIZE = 5;
const START = { r: 0, c: 0 } as const;
const GOAL = { r: 4, c: 4 } as const;

/** Các ô tường (không thể bước vào). */
const WALLS: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [1, 3],
  [2, 1],
  [3, 2],
  [3, 3],
];

/** Cái bẫy trừ điểm mạnh (không kết thúc episode). */
const TRAPS: ReadonlyArray<readonly [number, number]> = [[2, 3]];

const ACTIONS = ["Up", "Right", "Down", "Left"] as const;
type Action = (typeof ACTIONS)[number];

const DELTAS: Record<Action, readonly [number, number]> = {
  Up: [-1, 0],
  Right: [0, 1],
  Down: [1, 0],
  Left: [0, -1],
};

/** Reward tại từng ô. */
function getReward(r: number, c: number): number {
  if (r === GOAL.r && c === GOAL.c) return 10;
  for (const [wr, wc] of TRAPS) {
    if (r === wr && c === wc) return -5;
  }
  return -0.1; // chi phí sống, khuyến khích đi nhanh
}

function isWall(r: number, c: number): boolean {
  for (const [wr, wc] of WALLS) {
    if (r === wr && c === wc) return true;
  }
  return false;
}

function isGoal(r: number, c: number): boolean {
  return r === GOAL.r && c === GOAL.c;
}

/** Q-table 5×5 với 4 actions mỗi ô. */
type QTable = number[][][];

function initQ(): QTable {
  const table: QTable = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: number[][] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push([0, 0, 0, 0]);
    }
    table.push(row);
  }
  return table;
}

function cloneQ(q: QTable): QTable {
  return q.map((row) => row.map((cell) => cell.slice()));
}

/** Chọn action theo epsilon-greedy. */
function selectAction(q: QTable, r: number, c: number, epsilon: number): number {
  if (Math.random() < epsilon) {
    return Math.floor(Math.random() * ACTIONS.length);
  }
  const qs = q[r][c];
  let best = 0;
  let bestValue = qs[0];
  for (let i = 1; i < qs.length; i++) {
    if (qs[i] > bestValue) {
      bestValue = qs[i];
      best = i;
    }
  }
  return best;
}

/** Bước môi trường — trả về vị trí kế tiếp và reward. */
function step(
  r: number,
  c: number,
  actionIndex: number,
): { nr: number; nc: number; reward: number; done: boolean } {
  const [dr, dc] = DELTAS[ACTIONS[actionIndex]];
  let nr = r + dr;
  let nc = c + dc;

  // Chạm biên — đứng yên
  if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) {
    nr = r;
    nc = c;
  }
  // Chạm tường — đứng yên
  if (isWall(nr, nc)) {
    nr = r;
    nc = c;
  }

  const reward = getReward(nr, nc);
  const done = isGoal(nr, nc);
  return { nr, nc, reward, done };
}

const ALPHA = 0.3;
const GAMMA = 0.95;
const EPSILON_START = 0.4;
const EPSILON_MIN = 0.05;
const EPSILON_DECAY = 0.995;
const MAX_STEPS_PER_EPISODE = 200;

const TOTAL_STEPS = 7;

type ArrowDir = "up" | "right" | "down" | "left";

function bestActionArrow(q: number[]): ArrowDir | null {
  const max = Math.max(...q);
  if (max <= 0.01) return null;
  const idx = q.indexOf(max);
  const dirs: ArrowDir[] = ["up", "right", "down", "left"];
  return dirs[idx];
}

function arrowPath(dir: ArrowDir, cx: number, cy: number): string {
  const len = 18;
  switch (dir) {
    case "up":
      return `M ${cx} ${cy + len / 2} L ${cx} ${cy - len / 2} M ${cx - 5} ${cy - len / 2 + 6} L ${cx} ${cy - len / 2} L ${cx + 5} ${cy - len / 2 + 6}`;
    case "down":
      return `M ${cx} ${cy - len / 2} L ${cx} ${cy + len / 2} M ${cx - 5} ${cy + len / 2 - 6} L ${cx} ${cy + len / 2} L ${cx + 5} ${cy + len / 2 - 6}`;
    case "left":
      return `M ${cx + len / 2} ${cy} L ${cx - len / 2} ${cy} M ${cx - len / 2 + 6} ${cy - 5} L ${cx - len / 2} ${cy} L ${cx - len / 2 + 6} ${cy + 5}`;
    case "right":
      return `M ${cx - len / 2} ${cy} L ${cx + len / 2} ${cy} M ${cx + len / 2 - 6} ${cy - 5} L ${cx + len / 2} ${cy} L ${cx + len / 2 - 6} ${cy + 5}`;
  }
}

/** Chuyển giá trị Q max thành màu nền heatmap. */
function heatColor(value: number, maxAbs: number): string {
  if (maxAbs <= 0.01) return "rgba(30, 41, 59, 0.4)";
  if (value >= 0) {
    const t = Math.min(1, value / maxAbs);
    const alpha = 0.2 + t * 0.7;
    return `rgba(34, 197, 94, ${alpha.toFixed(2)})`;
  }
  const t = Math.min(1, Math.abs(value) / maxAbs);
  const alpha = 0.2 + t * 0.7;
  return `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
}

export default function QLearningTopic() {
  /* ─ State ─ */
  const [qTable, setQTable] = useState<QTable>(() => initQ());
  const [pos, setPos] = useState<{ r: number; c: number }>({
    r: START.r,
    c: START.c,
  });
  const [episodes, setEpisodes] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [epsilon, setEpsilon] = useState(EPSILON_START);
  const [lastReward, setLastReward] = useState(0);
  const [cumulativeReward, setCumulativeReward] = useState(0);
  const [isTraining, setIsTraining] = useState(false);

  /* ─ Các hành động training ─ */

  /** Một bước đi: chọn action, quan sát, cập nhật Q(s,a), di chuyển. */
  const doStep = useCallback(() => {
    setQTable((prev) => {
      const q = cloneQ(prev);
      const { r, c } = pos;
      const aIdx = selectAction(q, r, c, epsilon);
      const { nr, nc, reward, done } = step(r, c, aIdx);

      const maxNext = Math.max(...q[nr][nc]);
      const tdTarget = reward + GAMMA * maxNext;
      const tdError = tdTarget - q[r][c][aIdx];
      q[r][c][aIdx] += ALPHA * tdError;

      if (done) {
        setPos({ r: START.r, c: START.c });
        setEpisodes((e) => e + 1);
        setEpsilon((ep) => Math.max(EPSILON_MIN, ep * EPSILON_DECAY));
      } else {
        setPos({ r: nr, c: nc });
      }
      setTotalSteps((s) => s + 1);
      setLastReward(reward);
      setCumulativeReward((cr) => cr + reward);
      return q;
    });
  }, [pos, epsilon]);

  /** Chạy đến hết 1 episode (tới goal hoặc max steps). */
  const runEpisode = useCallback(() => {
    setQTable((prev) => {
      const q = cloneQ(prev);
      let r: number = START.r;
      let c: number = START.c;
      let episodeReward = 0;
      let localEps = epsilon;

      for (let i = 0; i < MAX_STEPS_PER_EPISODE; i++) {
        const aIdx = selectAction(q, r, c, localEps);
        const { nr, nc, reward, done } = step(r, c, aIdx);
        const maxNext = Math.max(...q[nr][nc]);
        q[r][c][aIdx] += ALPHA * (reward + GAMMA * maxNext - q[r][c][aIdx]);
        episodeReward += reward;
        r = nr;
        c = nc;
        if (done) break;
      }

      localEps = Math.max(EPSILON_MIN, localEps * EPSILON_DECAY);

      setPos({ r: START.r, c: START.c });
      setEpisodes((e) => e + 1);
      setEpsilon(localEps);
      setTotalSteps((s) => s + 1);
      setLastReward(episodeReward);
      setCumulativeReward((cr) => cr + episodeReward);
      return q;
    });
  }, [epsilon]);

  /** Huấn luyện 100 episodes liên tục. */
  const autoTrain = useCallback(() => {
    setIsTraining(true);
    setQTable((prev) => {
      const q = cloneQ(prev);
      let localEps = epsilon;
      let totalR = 0;
      let completed = 0;

      for (let ep = 0; ep < 100; ep++) {
        let r: number = START.r;
        let c: number = START.c;
        for (let i = 0; i < MAX_STEPS_PER_EPISODE; i++) {
          const aIdx = selectAction(q, r, c, localEps);
          const { nr, nc, reward, done } = step(r, c, aIdx);
          const maxNext = Math.max(...q[nr][nc]);
          q[r][c][aIdx] += ALPHA * (reward + GAMMA * maxNext - q[r][c][aIdx]);
          totalR += reward;
          r = nr;
          c = nc;
          if (done) break;
        }
        localEps = Math.max(EPSILON_MIN, localEps * EPSILON_DECAY);
        completed++;
      }

      setPos({ r: START.r, c: START.c });
      setEpisodes((e) => e + completed);
      setEpsilon(localEps);
      setTotalSteps((s) => s + completed);
      setLastReward(totalR / completed);
      setCumulativeReward((cr) => cr + totalR);
      return q;
    });
    setIsTraining(false);
  }, [epsilon]);

  const reset = useCallback(() => {
    setQTable(initQ());
    setPos({ r: START.r, c: START.c });
    setEpisodes(0);
    setTotalSteps(0);
    setEpsilon(EPSILON_START);
    setLastReward(0);
    setCumulativeReward(0);
  }, []);

  /* ─ Giá trị phụ trợ cho render ─ */
  const maxAbsQ = useMemo(() => {
    let m = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        for (let a = 0; a < ACTIONS.length; a++) {
          const v = Math.abs(qTable[r][c][a]);
          if (v > m) m = v;
        }
      }
    }
    return m;
  }, [qTable]);

  /* ─ Quiz (8 câu) ─ */
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Q(s,a) đại diện cho gì?",
        options: [
          "Xác suất hành động a thành công",
          "GIÁ TRỊ KỲ VỌNG của tổng reward tương lai nếu thực hiện hành động a tại state s rồi theo chính sách tối ưu",
          "Số lần đã thực hiện hành động a",
        ],
        correct: 1,
        explanation:
          "Q(s,a) = 'hành động a tại state s tốt đến đâu?' Giá trị cao = hành động tốt (dẫn đến nhiều reward). Agent chọn action có Q cao nhất tại mỗi state → chính sách tối ưu. Q-Learning học Q table từ trải nghiệm (trial-and-error).",
      },
      {
        question: "Epsilon-greedy: tại sao cần random action (explore)?",
        options: [
          "Để chậm hơn",
          "Nếu luôn chọn action có Q cao nhất (exploit) → có thể bị kẹt ở local optimum, bỏ lỡ đường tốt hơn. Cần explore để tìm",
          "Vì model chưa học xong",
        ],
        correct: 1,
        explanation:
          "Explore vs Exploit dilemma: luôn exploit = có thể miss đường tắt (local optimum). Luôn explore = không tận dụng kiến thức đã học. Epsilon-greedy: 90% exploit (chọn best Q), 10% explore (random) → cân bằng học và khai thác.",
      },
      {
        question: "Discount factor gamma (0.9) làm gì?",
        options: [
          "Giảm learning rate",
          "Cân bằng reward NGAY (gần) và reward TƯƠNG LAI (xa). Gamma cao (0.99) = nhìn xa. Gamma thấp (0.5) = nhìn gần",
          "Giảm số episodes",
        ],
        correct: 1,
        explanation:
          "Gamma = 0.9: reward 1 bước sau giảm 10%, 2 bước: 19%, 10 bước: 65%. Agent 'quan tâm' reward gần nhiều hơn reward xa. Gamma = 0.99: nhìn xa (tốt cho planning). Gamma = 0.5: nhìn gần (tốt cho reactive).",
      },
      {
        type: "fill-blank",
        question:
          "Công thức cập nhật Q-Learning dựa trên phương trình {blank}, sử dụng hàm giá trị hành động ký hiệu là {blank}.",
        blanks: [
          { answer: "Bellman", accept: ["bellman"] },
          { answer: "Q(s,a)", accept: ["q(s,a)", "Q(s, a)"] },
        ],
        explanation:
          "Bellman equation là nền tảng của Q-Learning: Q(s,a) = E[r + γ·max_{a'} Q(s', a')]. Học Q(s,a) = học giá trị kỳ vọng của việc thực hiện action a tại state s.",
      },
      {
        question: "TD error (temporal difference) là gì?",
        options: [
          "Sai số giữa target (r + γ·maxQ') và ước lượng hiện tại Q(s,a)",
          "Thời gian giữa hai lần huấn luyện",
          "Độ trễ của môi trường khi phản hồi",
        ],
        correct: 0,
        explanation:
          "TD error δ = r + γ·max_{a'} Q(s',a') − Q(s,a). Nó đo lường mức độ &quot;ngạc nhiên&quot; của agent so với kỳ vọng. Update = Q + α·δ, kéo Q về gần target. α nhỏ → học chậm nhưng ổn định; α lớn → học nhanh nhưng dao động.",
      },
      {
        question:
          "Tại sao Q-Learning được gọi là 'off-policy' còn SARSA là 'on-policy'?",
        options: [
          "Chúng dùng cùng công thức nhưng khác tên gọi",
          "Q-Learning dùng max Q(s',a') (action tối ưu) để update, bất kể action thực tế; SARSA dùng chính action đã lấy ở bước tiếp theo",
          "Off-policy không dùng policy nào cả",
        ],
        correct: 1,
        explanation:
          "Q-Learning: target dùng max → ngầm giả định sẽ chọn best. Điều đó cho phép học từ dữ liệu tạo bởi policy khác (replay buffer). SARSA: target dùng action thực sự được lấy ở bước tiếp theo → học về chính policy đang đi → bảo thủ hơn trong môi trường nguy hiểm.",
      },
      {
        question:
          "Khi state space quá lớn (ví dụ ảnh pixel), Q-table không dùng được. Giải pháp là gì?",
        options: [
          "Làm bảng Q khổng lồ",
          "Xấp xỉ Q(s,a) bằng neural network (Deep Q-Network — DQN)",
          "Bỏ Q-Learning",
        ],
        correct: 1,
        explanation:
          "DQN thay Q-table bằng neural net nhận state làm input, xuất ra Q của mọi action. Kèm hai kỹ thuật: experience replay (khử correlation) và target network (ổn định target).",
      },
      {
        type: "fill-blank",
        question:
          "Khi training tiến triển, ta thường cho {blank} giảm dần để chuyển từ explore sang exploit.",
        blanks: [
          { answer: "epsilon", accept: ["ε", "epsilon-greedy"] },
        ],
        explanation:
          "Epsilon decay: khởi đầu ε cao (0.5-1.0) để khám phá, giảm dần xuống 0.01-0.05 sau nhiều episodes. Giữ một chút epsilon > 0 để vẫn thích nghi với môi trường thay đổi.",
      },
    ],
    [],
  );

  /* ─ Render ─ */
  const CELL = 72;
  const GRID_PX = GRID_SIZE * CELL;

  return (
    <>
      <div className="mb-6">
        <ProgressSteps
          current={1}
          total={TOTAL_STEPS}
          labels={[
            "Dự đoán",
            "Khám phá",
            "Khoảnh khắc Aha",
            "Thử thách",
            "Lý thuyết",
            "Tóm tắt",
            "Kiểm tra",
          ]}
        />
      </div>

      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Grab cần tìm đường ngắn nhất cho tài xế. Mỗi ngã tư có nhiều hướng, không biết trước đường nào kẹt. Tài xế học bằng cách nào?"
          options={[
            "Lập trình mỗi ngã tư bằng tay",
            "Thử nhiều đường, nhớ đường nào nhanh (reward cao), lần sau ưu tiên đường đó — đây là Q-Learning!",
            "Luôn đi thẳng",
          ]}
          correct={1}
          explanation="Q-Learning: tại mỗi ngã tư (state), thử hành động (rẽ trái/phải/thẳng), nhận reward (nhanh = +, chậm = -). Dần dần xây dựng 'bản đồ giá trị' (Q-table): tại mỗi ngã tư, biết rẽ hướng nào có giá trị cao nhất."
        >
          <p className="text-sm text-muted mt-2">
            Ở bước tiếp theo, bạn sẽ tự huấn luyện một agent trong mê cung 5×5.
          </p>
        </PredictionGate>
      </LessonSection>

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Agent xuất phát ở góc{" "}
          <strong className="text-foreground">trên-trái</strong> và phải tới
          đích ở góc <strong className="text-foreground">dưới-phải</strong>,
          tránh{" "}
          <span className="inline-block rounded bg-slate-700 px-1.5 text-xs font-mono text-slate-200">
            tường
          </span>{" "}
          và{" "}
          <span className="inline-block rounded bg-red-500/30 px-1.5 text-xs font-mono text-red-300">
            bẫy
          </span>
          . Dùng các nút bên dưới để xem nó học.
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Controls */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={doStep}
                disabled={isTraining}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                Step
              </button>
              <button
                type="button"
                onClick={runEpisode}
                disabled={isTraining}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
              >
                Episode
              </button>
              <button
                type="button"
                onClick={autoTrain}
                disabled={isTraining}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50"
              >
                Auto-train 100 episodes
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Reset
              </button>
            </div>

            {/* Thống kê */}
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-card/60 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  Episodes
                </p>
                <p className="text-xl font-bold text-foreground">
                  {episodes}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card/60 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  Epsilon (ε)
                </p>
                <p className="text-xl font-bold text-foreground">
                  {epsilon.toFixed(3)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card/60 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  Last reward
                </p>
                <p className="text-xl font-bold text-foreground">
                  {lastReward.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card/60 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  Cumul. reward
                </p>
                <p className="text-xl font-bold text-foreground">
                  {cumulativeReward.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Grid world SVG */}
            <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
              <svg
                viewBox={`0 0 ${GRID_PX} ${GRID_PX}`}
                className="w-full max-w-md"
                role="img"
                aria-label="Grid world 5x5"
              >
                {Array.from({ length: GRID_SIZE }, (_, r) =>
                  Array.from({ length: GRID_SIZE }, (_, c) => {
                    const x = c * CELL;
                    const y = r * CELL;
                    const wall = isWall(r, c);
                    const trap = TRAPS.some(([tr, tc]) => tr === r && tc === c);
                    const goal = isGoal(r, c);
                    const start = r === START.r && c === START.c;
                    const maxQ = Math.max(...qTable[r][c]);
                    let fill: string;
                    if (wall) fill = "#0f172a";
                    else if (trap) fill = "rgba(239,68,68,0.35)";
                    else if (goal) fill = "rgba(34,197,94,0.55)";
                    else fill = heatColor(maxQ, maxAbsQ);

                    const arrow = !wall && !goal
                      ? bestActionArrow(qTable[r][c])
                      : null;
                    const isAgent = pos.r === r && pos.c === c;

                    return (
                      <g key={`cell-${r}-${c}`}>
                        <rect
                          x={x + 1}
                          y={y + 1}
                          width={CELL - 2}
                          height={CELL - 2}
                          rx={6}
                          fill={fill}
                          stroke={
                            isAgent
                              ? "#f59e0b"
                              : wall
                                ? "#1e293b"
                                : "rgba(71,85,105,0.6)"
                          }
                          strokeWidth={isAgent ? 3 : 1}
                        />
                        {wall && (
                          <text
                            x={x + CELL / 2}
                            y={y + CELL / 2 + 4}
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize={11}
                            fontWeight="bold"
                          >
                            WALL
                          </text>
                        )}
                        {trap && !wall && (
                          <text
                            x={x + CELL / 2}
                            y={y + CELL / 2 + 4}
                            textAnchor="middle"
                            fill="#fecaca"
                            fontSize={11}
                            fontWeight="bold"
                          >
                            TRAP
                          </text>
                        )}
                        {goal && (
                          <text
                            x={x + CELL / 2}
                            y={y + CELL / 2 + 4}
                            textAnchor="middle"
                            fill="#052e16"
                            fontSize={11}
                            fontWeight="bold"
                          >
                            GOAL
                          </text>
                        )}
                        {start && !isAgent && (
                          <text
                            x={x + CELL / 2}
                            y={y + 14}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize={11}
                          >
                            start
                          </text>
                        )}
                        {/* Mũi tên policy */}
                        {arrow && !trap && !goal && (
                          <motion.path
                            key={`arrow-${r}-${c}-${arrow}`}
                            d={arrowPath(arrow, x + CELL / 2, y + CELL / 2)}
                            stroke="#f8fafc"
                            strokeWidth={2}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.85 }}
                            transition={{ duration: 0.25 }}
                          />
                        )}
                        {/* Max Q text */}
                        {!wall && !goal && (
                          <text
                            x={x + CELL - 6}
                            y={y + CELL - 6}
                            textAnchor="end"
                            fill="#e2e8f0"
                            fontSize={11}
                            fontFamily="monospace"
                            opacity={0.75}
                          >
                            {maxQ.toFixed(1)}
                          </text>
                        )}
                        {/* Agent */}
                        {isAgent && (
                          <motion.circle
                            layout
                            cx={x + CELL / 2}
                            cy={y + CELL / 2}
                            r={CELL * 0.28}
                            fill="#fbbf24"
                            stroke="#78350f"
                            strokeWidth={1.5}
                            transition={{ type: "spring", stiffness: 260 }}
                          />
                        )}
                      </g>
                    );
                  }),
                )}
              </svg>

              {/* Q-table heatmap chi tiết (tất cả action) */}
              <div className="w-full max-w-md rounded-xl border border-border bg-card/60 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Q-table heatmap (max Q theo ô)
                </p>
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  }}
                >
                  {Array.from({ length: GRID_SIZE }, (_, r) =>
                    Array.from({ length: GRID_SIZE }, (_, c) => {
                      const maxQ = Math.max(...qTable[r][c]);
                      const wall = isWall(r, c);
                      return (
                        <div
                          key={`hm-${r}-${c}`}
                          className="aspect-square rounded-md text-center text-[10px] font-mono font-semibold text-white flex items-center justify-center"
                          style={{
                            backgroundColor: wall
                              ? "#0f172a"
                              : heatColor(maxQ, maxAbsQ),
                          }}
                          title={`Q(${r},${c}) max = ${maxQ.toFixed(3)}`}
                        >
                          {wall ? "·" : maxQ.toFixed(1)}
                        </div>
                      );
                    }),
                  )}
                </div>
                <p className="mt-3 text-[11px] text-muted leading-relaxed">
                  Màu xanh đậm = Q cao (ô &quot;tốt&quot;). Màu đỏ = Q âm (ô
                  &quot;xấu&quot;). Khi agent học, bạn sẽ thấy màu xanh lan
                  dần từ đích về điểm xuất phát — Q values truyền ngược qua
                  phương trình Bellman.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/60 p-4 text-xs text-muted leading-relaxed">
              <p>
                <strong className="text-foreground">Gợi ý quan sát:</strong>{" "}
                Nhấn <em>Step</em> nhiều lần để cảm nhận từng bước update TD;
                hoặc bấm <em>Auto-train 100 episodes</em> để xem chính sách
                (mũi tên) hình thành rõ ràng. Mỗi ô hiển thị giá trị max-Q
                hiện tại.
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Sau nhiều lần thử, agent{" "}
            <strong>học được bản đồ giá trị</strong> (Q-table): tại mỗi ô,
            biết đi hướng nào có giá trị cao nhất. Q values{" "}
            <strong>lan ngược từ đích</strong> — ô gần đích có Q cao, ô xa
            hơn thì Q thấp dần. Agent đi theo gradient của Q values — giống
            nước chảy từ núi xuống thung lũng!
          </p>
          <p className="mt-3">
            Đây là điểm khác biệt then chốt so với supervised learning:
            không ai dạy agent &quot;đi đâu&quot;. Agent tự khám phá, tự
            chấm điểm, và tự xây bản đồ của riêng nó. Tín hiệu duy nhất là{" "}
            <em>reward</em>.
          </p>
        </AhaMoment>

        <Callout variant="tip" title="Tại sao có chi phí sống (-0.1)?">
          Nếu mỗi ô không có goal đều cho reward = 0, agent có thể lang
          thang vô tận vì không bị phạt. Thêm -0.1 mỗi bước biến bài toán
          thành &quot;đến đích càng nhanh càng tốt&quot; — đây là cách thiết
          kế reward shaping đơn giản.
        </Callout>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Agent có ε = 0.3. Sau 1000 episodes, nó đã học tốt. Nên giảm ε xuống 0.05 không?"
          options={[
            "Không — giữ 0.3 để tiếp tục explore",
            "CÓ — agent đã học → nên exploit nhiều hơn (0.05 = 95% chọn best action). Epsilon decay là chiến lược chuẩn",
            "Đặt ε = 0 (tắt explore hoàn toàn)",
          ]}
          correct={1}
          explanation="Epsilon decay: ban đầu explore nhiều (0.3-1.0) để khám phá, sau đó giảm dần (0.05-0.01) để khai thác kiến thức. ε = 0 nguy hiểm: môi trường thay đổi thì agent không adapt được. Giữ ε khoảng 0.01-0.05 là cân bằng tốt."
        />

        <div className="mt-5">
          <InlineChallenge
            question="Một ô có Q = [2.0, 5.0, 1.5, 3.0] cho [Up, Right, Down, Left]. Action Right đưa agent vào ô có max Q' = 6, reward = -0.1. Với α = 0.5, γ = 0.9, Q(s, Right) mới là?"
            options={[
              "5.0 (không đổi)",
              "0.5 × (-0.1 + 0.9×6 − 5.0) + 5.0 = 0.15 + 5.0 = 5.15",
              "6.0 (chính là maxQ')",
            ]}
            correct={1}
            explanation="Áp dụng: Q ← Q + α·[r + γ·maxQ' − Q] = 5.0 + 0.5·(−0.1 + 5.4 − 5.0) = 5.0 + 0.5·0.3 = 5.15. Q dịch nhẹ về phía target. Lặp nhiều lần, Q hội tụ tới giá trị kỳ vọng thật sự."
          />
        </div>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Q-Learning</strong> là thuật toán RL học giá trị{" "}
            <LaTeX>{"Q(s, a)"}</LaTeX> — &quot;hành động a tại state s tốt
            đến đâu?&quot; — từ trải nghiệm (off-policy, model-free). Khi
            state space quá lớn (hình ảnh, game), Q-table được thay bằng
            neural network — xem{" "}
            <TopicLink slug="deep-q-network">Deep Q-Network (DQN)</TopicLink>
            . Một nhánh khác là học trực tiếp policy thay vì value function
            — xem <TopicLink slug="policy-gradient">Policy Gradient</TopicLink>
            .
          </p>

          <p>
            <strong>Phương trình Bellman tối ưu:</strong>
          </p>
          <LaTeX block>
            {"Q^{*}(s, a) = \\mathbb{E}\\left[ r + \\gamma \\max_{a'} Q^{*}(s', a') \\mid s, a \\right]"}
          </LaTeX>

          <p>
            <strong>Quy tắc cập nhật Q-Learning:</strong>
          </p>
          <LaTeX block>
            {"Q(s_t, a_t) \\leftarrow Q(s_t, a_t) + \\alpha \\left[ r_t + \\gamma \\max_{a'} Q(s_{t+1}, a') - Q(s_t, a_t) \\right]"}
          </LaTeX>

          <p>Trong đó:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <LaTeX>{"\\alpha"}</LaTeX> — learning rate, kiểm soát tốc độ
              cập nhật.
            </li>
            <li>
              <LaTeX>{"\\gamma"}</LaTeX> — discount factor, đo mức độ quan
              trọng của reward tương lai.
            </li>
            <li>
              <LaTeX>{"r_t"}</LaTeX> — reward nhận được khi chuyển từ{" "}
              <LaTeX>{"s_t"}</LaTeX> sang <LaTeX>{"s_{t+1}"}</LaTeX>.
            </li>
            <li>
              <LaTeX>{"\\epsilon"}</LaTeX> — xác suất explore trong
              epsilon-greedy.
            </li>
          </ul>

          <Callout variant="tip" title="Off-policy vs On-policy">
            Q-Learning là <strong>off-policy</strong>: update Q dựa trên best
            action (max Q), không phải action thực sự đã thực hiện. Ưu điểm:
            học từ bất kỳ data nào (replay buffer, quan sát người chơi
            khác). Nhược điểm: có thể overestimate Q values (Double Q-Learning
            khắc phục). SARSA là <strong>on-policy</strong> — update bằng
            action thực tế sẽ được lấy ở bước tiếp theo, bảo thủ hơn khi có
            nguy hiểm.
          </Callout>

          <Callout variant="warning" title="Cảnh giác với reward sparse">
            Nếu reward chỉ có ở đích (các bước khác = 0), Q values gần như
            không update ở phần lớn không gian. Agent khó học. Giải pháp:{" "}
            <em>reward shaping</em> (thêm reward trung gian), HER (Hindsight
            Experience Replay), hoặc intrinsic motivation (curiosity).
          </Callout>

          <p>
            <strong>Điều kiện hội tụ:</strong> Q-Learning hội tụ tới{" "}
            <LaTeX>{"Q^{*}"}</LaTeX> với xác suất 1 nếu:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>Mọi (s, a) được thăm vô hạn lần.</li>
            <li>
              Learning rate thoả{" "}
              <LaTeX>{"\\sum \\alpha_t = \\infty, \\sum \\alpha_t^2 < \\infty"}</LaTeX>
              .
            </li>
            <li>State và action rời rạc, hữu hạn.</li>
          </ul>
          <p className="text-sm">
            Thực tế: state lớn → cần xấp xỉ hàm (neural network), mất bảo đảm
            hội tụ nhưng thường vẫn work tốt.
          </p>

          <CodeBlock language="python" title="Q-Learning với NumPy — grid world 5×5">
{`import numpy as np

GRID = 5
N_ACTIONS = 4              # Up, Right, Down, Left
DELTAS = [(-1, 0), (0, 1), (1, 0), (0, -1)]

WALLS = {(1, 1), (1, 3), (2, 1), (3, 2), (3, 3)}
TRAPS = {(2, 3)}
GOAL = (4, 4)
START = (0, 0)


def step(r: int, c: int, a: int) -> tuple[int, int, float, bool]:
    dr, dc = DELTAS[a]
    nr, nc = r + dr, c + dc
    # Biên và tường
    if not (0 <= nr < GRID and 0 <= nc < GRID) or (nr, nc) in WALLS:
        nr, nc = r, c
    # Reward
    if (nr, nc) == GOAL:
        return nr, nc, 10.0, True
    if (nr, nc) in TRAPS:
        return nr, nc, -5.0, False
    return nr, nc, -0.1, False


def select_action(q: np.ndarray, r: int, c: int, eps: float) -> int:
    if np.random.rand() < eps:
        return np.random.randint(N_ACTIONS)
    return int(np.argmax(q[r, c]))


def train(episodes: int = 1000) -> np.ndarray:
    q = np.zeros((GRID, GRID, N_ACTIONS))
    alpha, gamma = 0.3, 0.95
    eps, eps_min, eps_decay = 0.4, 0.05, 0.995

    for ep in range(episodes):
        r, c = START
        for _ in range(200):  # giới hạn bước
            a = select_action(q, r, c, eps)
            nr, nc, reward, done = step(r, c, a)
            # ── Bellman update ──
            td_target = reward + gamma * q[nr, nc].max()
            q[r, c, a] += alpha * (td_target - q[r, c, a])
            r, c = nr, nc
            if done:
                break
        eps = max(eps_min, eps * eps_decay)
    return q


if __name__ == "__main__":
    q_opt = train(episodes=2000)
    # Chính sách tối ưu π(s) = argmax_a Q(s, a)
    policy = q_opt.argmax(axis=-1)
    print("Optimal policy (0=Up, 1=Right, 2=Down, 3=Left):")
    print(policy)`}
          </CodeBlock>

          <CodeBlock
            language="python"
            title="Double Q-Learning — khắc phục overestimation bias"
          >
{`import numpy as np

# Double Q-Learning: dùng 2 bảng Q luân phiên để tránh max bias.
# Một bảng chọn action, bảng kia đánh giá → giảm overestimation.

def double_q_update(
    qa: np.ndarray,
    qb: np.ndarray,
    s: tuple[int, int],
    a: int,
    r: float,
    s_next: tuple[int, int],
    alpha: float,
    gamma: float,
) -> None:
    if np.random.rand() < 0.5:
        # Cập nhật Qa bằng đánh giá của Qb tại argmax theo Qa
        best_a = int(np.argmax(qa[s_next]))
        target = r + gamma * qb[s_next + (best_a,)]
        qa[s + (a,)] += alpha * (target - qa[s + (a,)])
    else:
        best_a = int(np.argmax(qb[s_next]))
        target = r + gamma * qa[s_next + (best_a,)]
        qb[s + (a,)] += alpha * (target - qb[s + (a,)])


def policy_from_double_q(qa: np.ndarray, qb: np.ndarray) -> np.ndarray:
    """Chính sách dùng trung bình hai bảng."""
    return ((qa + qb) / 2).argmax(axis=-1)`}
          </CodeBlock>

          <CollapsibleDetail title="Chi tiết: tại sao Q-Learning overestimate?">
            <p className="text-sm leading-relaxed">
              Toán tử <LaTeX>{"\\max_{a'} Q(s', a')"}</LaTeX> có tính chất:{" "}
              <LaTeX>
                {"\\mathbb{E}[\\max X] \\ge \\max \\mathbb{E}[X]"}
              </LaTeX>
              . Khi Q có nhiễu ước lượng (đương nhiên, do mẫu hữu hạn), max
              trên các ước lượng nhiễu sẽ luôn nghiêng về phía lớn — đẩy Q
              lên cao hơn giá trị thật. Càng nhiều action, bias càng nặng.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              <strong>Double Q-Learning</strong> (van Hasselt 2010) tách đôi:
              một mạng chọn action, mạng khác đánh giá. Hai ước lượng độc
              lập hủy bớt bias. <strong>Double DQN</strong> áp dụng ý tưởng
              này cho deep RL.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chi tiết: chọn γ thế nào?">
            <p className="text-sm leading-relaxed">
              Discount factor γ ∈ [0, 1) quyết định &quot;tầm nhìn xa&quot;
              của agent. γ = 0 → chỉ quan tâm reward ngay; γ → 1 → lên kế
              hoạch dài hạn. Ảnh hưởng thực tế:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>
                γ = 0.9 → &quot;horizon hiệu dụng&quot; khoảng{" "}
                <LaTeX>{"1 / (1 - \\gamma) = 10"}</LaTeX> bước.
              </li>
              <li>γ = 0.99 → horizon ≈ 100 bước.</li>
              <li>
                γ = 0.999 → horizon ≈ 1000 bước. Cần cẩn thận: gradient lan
                xa làm training không ổn định.
              </li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              Trong Atari, γ = 0.99 là chuẩn. Trong robotics dài hạn, người
              ta dùng γ = 0.995-0.999. Trò chơi cờ — γ có thể bằng 1.0 vì
              episode hữu hạn rõ ràng.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết mở rộng">
        <ExplanationSection>
          <p>
            <strong>Markov Decision Process (MDP)</strong> là khung toán học
            của RL. Một MDP gồm 5 thành phần{" "}
            <LaTeX>{"(\\mathcal{S}, \\mathcal{A}, P, R, \\gamma)"}</LaTeX>
            :
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <LaTeX>{"\\mathcal{S}"}</LaTeX> — tập các state (ví dụ: toạ
              độ ô trong mê cung).
            </li>
            <li>
              <LaTeX>{"\\mathcal{A}"}</LaTeX> — tập các action (ví dụ: 4
              hướng di chuyển).
            </li>
            <li>
              <LaTeX>{"P(s' \\mid s, a)"}</LaTeX> — xác suất chuyển state.
              Ở grid world tất định, P = 1 khi nước đi hợp lệ.
            </li>
            <li>
              <LaTeX>{"R(s, a, s')"}</LaTeX> — reward nhận được khi chuyển
              từ s sang s' bằng action a.
            </li>
            <li>
              <LaTeX>{"\\gamma \\in [0, 1)"}</LaTeX> — discount factor.
            </li>
          </ul>

          <p>
            Agent muốn tìm <strong>chính sách tối ưu</strong>{" "}
            <LaTeX>{"\\pi^{*}(s)"}</LaTeX> — hàm trả về action tốt nhất cho
            mỗi state — sao cho kỳ vọng tổng reward tương lai (có chiết
            khấu) là lớn nhất:
          </p>
          <LaTeX block>
            {"J(\\pi) = \\mathbb{E}_{\\pi} \\left[ \\sum_{t=0}^{\\infty} \\gamma^t r_t \\right]"}
          </LaTeX>

          <p>
            <strong>Hàm giá trị trạng thái và hàm giá trị hành động:</strong>
          </p>
          <LaTeX block>
            {"V^{\\pi}(s) = \\mathbb{E}_{\\pi}\\left[ \\sum_{t=0}^{\\infty} \\gamma^t r_t \\mid s_0 = s \\right]"}
          </LaTeX>
          <LaTeX block>
            {"Q^{\\pi}(s, a) = \\mathbb{E}_{\\pi}\\left[ \\sum_{t=0}^{\\infty} \\gamma^t r_t \\mid s_0 = s, a_0 = a \\right]"}
          </LaTeX>

          <p>
            Liên hệ giữa hai hàm:{" "}
            <LaTeX>
              {"V^{\\pi}(s) = \\sum_a \\pi(a \\mid s) Q^{\\pi}(s, a)"}
            </LaTeX>
            . Chính sách tối ưu chọn argmax của Q:{" "}
            <LaTeX>
              {"\\pi^{*}(s) = \\arg\\max_{a} Q^{*}(s, a)"}
            </LaTeX>
            .
          </p>

          <Callout variant="info" title="Model-free vs Model-based">
            Q-Learning là <strong>model-free</strong>: agent không cần biết
            P(s'|s,a) hay R(s,a,s'), chỉ cần tương tác với môi trường và
            quan sát (s, a, r, s'). Ngược lại,{" "}
            <strong>model-based</strong> (ví dụ Dyna-Q, MuZero) học một mô
            hình môi trường rồi dùng mô hình đó để lên kế hoạch. Model-based
            tiết kiệm sample nhưng khó khi môi trường phức tạp.
          </Callout>

          <p>
            <strong>Hội tụ và lý thuyết:</strong> Theorem Watkins &amp;
            Dayan (1992) chứng minh Q-Learning hội tụ tới{" "}
            <LaTeX>{"Q^{*}"}</LaTeX> với xác suất 1 trong MDP tabular, với
            điều kiện mọi cặp (s, a) được thăm vô hạn lần và learning rate
            thoả điều kiện Robbins-Monro. Trong thực tế với function
            approximation (DQN), mất bảo đảm hội tụ nhưng vẫn work nhờ
            experience replay và target network.
          </p>

          <p>
            <strong>So sánh nhanh các họ RL:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Value-based</strong> (Q-Learning, DQN): học Q, suy ra
              policy qua argmax. Tốt cho action rời rạc.
            </li>
            <li>
              <strong>Policy-based</strong> (REINFORCE, PPO): học thẳng
              π(a|s). Tốt cho action liên tục.
            </li>
            <li>
              <strong>Actor-Critic</strong> (A2C, SAC): học đồng thời cả V
              (critic) và π (actor). Ổn định và dùng nhiều nhất trong thực
              tế hiện đại.
            </li>
            <li>
              <strong>Model-based</strong> (MuZero, Dreamer): học model
              môi trường, planning trong mô phỏng. Sample-efficient nhất.
            </li>
          </ul>

          <Callout variant="warning" title="Cạm bẫy khi triển khai thực tế">
            Nhiều dự án RL thất bại vì lỗi không rõ ràng: reward định nghĩa
            sai (agent tìm cách lách luật), quá ít episodes (chưa hội tụ),
            state không đủ Markov (agent không thấy thông tin cần thiết),
            hoặc simulator khác môi trường thật (sim-to-real gap). RL mạnh
            nhưng brittle — luôn debug bằng cách in Q values và vẽ policy.
          </Callout>

          <p>
            <strong>Ứng dụng thực tế:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Game:</strong> AlphaGo, AlphaStar, OpenAI Five,
              MuZero.
            </li>
            <li>
              <strong>Robotics:</strong> điều khiển tay máy (Boston Dynamics,
              OpenAI Dactyl).
            </li>
            <li>
              <strong>Logistics:</strong> Grab, Uber phân tuyến tài xế;
              Amazon sắp xếp kho hàng.
            </li>
            <li>
              <strong>Hệ thống gợi ý:</strong> YouTube, TikTok học thứ tự
              đề xuất bằng RL.
            </li>
            <li>
              <strong>LLM:</strong> RLHF (Reinforcement Learning from Human
              Feedback) — ChatGPT, Claude học từ sở thích người dùng.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          points={[
            "Q(s,a) = giá trị kỳ vọng của việc thực hiện action a tại state s rồi theo chính sách tối ưu. Agent chọn action có Q cao nhất.",
            "Update rule Bellman: Q(s,a) ← Q(s,a) + α·[r + γ·max_{a'} Q(s',a') − Q(s,a)]. Đây là cốt lõi của Q-Learning.",
            "Epsilon-greedy cân bằng explore (random) và exploit (best Q). Giảm ε dần theo thời gian để chuyển từ khám phá sang khai thác.",
            "Off-policy: học từ best action (max Q) bất kể action thực sự → linh hoạt, cho phép experience replay.",
            "Q-table chỉ dùng được với state/action rời rạc nhỏ. State lớn (ảnh, cảm biến) → Deep Q-Network (DQN) thay Q-table bằng neural network.",
            "Bẫy cần biết: overestimation bias (dùng Double Q-Learning), reward sparse (dùng reward shaping, HER), và sai γ (chọn γ theo horizon bài toán).",
          ]}
        />

        <Callout variant="insight" title="Bạn đã làm được">
          Qua tiện ích phía trên, bạn đã huấn luyện một agent thực sự: Q
          values lan ngược từ đích, các mũi tên chính sách xuất hiện dần, và
          ε giảm dần thể hiện sự chuyển dịch từ khám phá sang khai thác.
          Cũng chính là cách Grab tối ưu tài xế, cách AlphaGo đánh giá nước
          cờ.
        </Callout>

        <Callout variant="info" title="Tiếp theo học gì?">
          Sau bài này, hãy xem{" "}
          <TopicLink slug="deep-q-network">Deep Q-Network</TopicLink> để biết
          cách mở rộng Q-Learning cho state space liên tục, và{" "}
          <TopicLink slug="policy-gradient">Policy Gradient</TopicLink> cho
          cách tiếp cận ngược lại — học thẳng chính sách.
        </Callout>
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
