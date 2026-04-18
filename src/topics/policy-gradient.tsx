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

// ---------------------------------------------------------------------------
// Metadata — DO NOT CHANGE. The routing layer reads this at build time to
// register the topic with the learning-path index.
// ---------------------------------------------------------------------------
export const metadata: TopicMeta = {
  slug: "policy-gradient",
  title: "Policy Gradient",
  titleVi: "Gradient chính sách",
  description:
    "Phương pháp tối ưu trực tiếp chính sách hành động bằng gradient ascent trên phần thưởng kỳ vọng",
  category: "reinforcement-learning",
  tags: ["reinforce", "policy", "optimization"],
  difficulty: "intermediate",
  relatedSlugs: ["actor-critic", "q-learning", "gradient-descent"],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// Hằng số mô phỏng
// ---------------------------------------------------------------------------
const TOTAL_STEPS = 7;
const CORRIDOR_LENGTH = 11; // vị trí 0..10
const GOAL_POSITION = 5; // vị trí nhận reward
const INITIAL_POSITION = 0;
const INITIAL_POLICY: ReadonlyArray<number> = Object.freeze([0.5, 0.5]); // [prob_left, prob_right]
const LEARNING_RATE = 0.35;
const REWARD_AT_GOAL = 1;
const STEP_PENALTY = -0.04;
const MAX_STEPS_PER_EPISODE = 20;

// ---------------------------------------------------------------------------
// Kiểu dữ liệu cho bộ mô phỏng REINFORCE
// ---------------------------------------------------------------------------
type ActionKind = "left" | "right";

interface TrajectoryStep {
  position: number;
  action: ActionKind;
  reward: number;
  logProbIndex: 0 | 1;
}

interface EpisodeRecord {
  id: number;
  steps: number;
  totalReward: number;
  reachedGoal: boolean;
  policyBefore: [number, number];
  policyAfter: [number, number];
}

// ---------------------------------------------------------------------------
// Toán vặt cho policy gradient
// ---------------------------------------------------------------------------
function clampProb(p: number): number {
  if (Number.isNaN(p)) return 0.5;
  return Math.max(0.02, Math.min(0.98, p));
}

function sampleAction(policy: ReadonlyArray<number>): ActionKind {
  const r = Math.random();
  return r < policy[0] ? "left" : "right";
}

function deterministicAction(policy: ReadonlyArray<number>): ActionKind {
  return policy[1] >= policy[0] ? "right" : "left";
}

function applyAction(pos: number, action: ActionKind): number {
  if (action === "left") return Math.max(0, pos - 1);
  return Math.min(CORRIDOR_LENGTH - 1, pos + 1);
}

function rewardAt(pos: number): number {
  if (pos === GOAL_POSITION) return REWARD_AT_GOAL;
  return STEP_PENALTY;
}

/**
 * Công thức REINFORCE dạng rời rạc cho chính sách nhị phân (softmax 2 lựa chọn).
 * Tham số θ được lưu ngầm qua phân phối (p_left, p_right). Ta cập nhật trực
 * tiếp trên không gian xác suất, sau đó chuẩn hóa để tổng vẫn bằng 1.
 *
 *   p_action  ← p_action + α · G · (1 − p_action)
 *   p_other   ← p_other  − α · G · p_other
 *
 * Đây là phiên bản đơn giản hoá của gradient của log-softmax, đủ để minh hoạ
 * cơ chế "tăng xác suất của action mang lại reward dương, giảm xác suất khi
 * reward âm" mà không cần thư viện autograd.
 */
function updatePolicy(
  policy: ReadonlyArray<number>,
  trajectory: ReadonlyArray<TrajectoryStep>,
): [number, number] {
  const gamma = 0.95;
  let G = 0;
  const returns: number[] = new Array(trajectory.length);
  for (let t = trajectory.length - 1; t >= 0; t -= 1) {
    G = trajectory[t].reward + gamma * G;
    returns[t] = G;
  }
  // baseline: mean return — giảm variance mà không lệch kỳ vọng gradient
  const mean = returns.reduce((a, b) => a + b, 0) / Math.max(1, returns.length);
  const advantage = returns.map((g) => g - mean);

  let pLeft = policy[0];
  let pRight = policy[1];

  for (let t = 0; t < trajectory.length; t += 1) {
    const adv = advantage[t];
    if (trajectory[t].action === "left") {
      pLeft = pLeft + LEARNING_RATE * adv * (1 - pLeft);
      pRight = pRight - LEARNING_RATE * adv * pRight;
    } else {
      pRight = pRight + LEARNING_RATE * adv * (1 - pRight);
      pLeft = pLeft - LEARNING_RATE * adv * pLeft;
    }
    pLeft = clampProb(pLeft);
    pRight = clampProb(pRight);
    const sum = pLeft + pRight;
    pLeft = pLeft / sum;
    pRight = pRight / sum;
  }

  return [pLeft, pRight];
}

// ---------------------------------------------------------------------------
// Bộ câu hỏi — tổng cộng 8 quiz theo yêu cầu
// ---------------------------------------------------------------------------
function buildQuizQuestions(): QuizQuestion[] {
  return [
    {
      question: "Policy Gradient khác Q-Learning ở điểm nào cơ bản?",
      options: [
        "Dùng nhiều GPU hơn",
        "Q-Learning học VALUE function rồi suy ra policy. Policy Gradient học TRỰC TIẾP policy π(a|s) — mapping state→action probabilities",
        "Không khác",
      ],
      correct: 1,
      explanation:
        "Q-Learning: học Q(s,a) → chọn argmax. Policy Gradient: học trực tiếp π(a|s) = P(action|state). Ưu điểm PG: xử lý action space liên tục (cánh tay robot), stochastic policies (cần thiết cho game đối kháng). Nhược điểm: variance cao, cần nhiều samples.",
    },
    {
      question: "Tại sao Policy Gradient có variance cao?",
      options: [
        "Vì dùng nhiều params",
        "Reward signal DELAYED và NOISY: cùng action nhưng khác episodes có reward khác nhau → gradient dao động mạnh",
        "Vì learning rate quá lớn",
      ],
      correct: 1,
      explanation:
        "Episode 1: action A → reward 10. Episode 2: cùng action A → reward 2 (do môi trường random). Gradient estimate dao động mạnh. Giải pháp: baseline subtraction (trừ mean reward) giảm variance mà không thay đổi expected gradient.",
    },
    {
      question: "REINFORCE algorithm là gì?",
      options: [
        "Tên của deep learning framework",
        "Policy gradient cơ bản nhất: sample episode, tính return, update policy theo gradient = return × ∇ log π",
        "Kỹ thuật tăng cường data",
      ],
      correct: 1,
      explanation:
        "REINFORCE (Williams 1992): (1) Sample toàn bộ episode theo policy, (2) Tính return G_t cho mỗi step, (3) Update: θ += α · G_t · ∇ log π(a_t|s_t). Đơn giản nhưng variance cao. Actor-Critic cải thiện bằng cách dùng Critic đánh giá.",
    },
    {
      question:
        "Baseline trong REINFORCE có vai trò gì với expected gradient?",
      options: [
        "Làm expected gradient đổi hướng",
        "KHÔNG làm lệch expected gradient (unbiased), nhưng giảm variance — vì E[∇ log π · b] = 0 với b độc lập action",
        "Chỉ là kỹ thuật tăng tốc GPU",
      ],
      correct: 1,
      explanation:
        "Với baseline b không phụ thuộc action, ta có E[∇ log π(a|s) · b] = b · ∇ Σ π(a|s) = b · ∇ 1 = 0. Vì vậy trừ baseline vẫn cho cùng một expected gradient (unbiased) nhưng phương sai của sample giảm đáng kể.",
    },
    {
      question:
        "Khi nào nên chọn Policy Gradient thay vì DQN (Deep Q-Network)?",
      options: [
        "Khi không gian hành động là tập hữu hạn nhỏ",
        "Khi action liên tục (robot, steering) hoặc cần stochastic policy (trò chơi đối kháng cần randomize)",
        "Khi có ít dữ liệu",
      ],
      correct: 1,
      explanation:
        "DQN mạnh với action rời rạc nhỏ (Atari 4–18 nút bấm). Với action liên tục (góc xoay, lực đẩy) hoặc trường hợp cần policy ngẫu nhiên (rock-paper-scissors, poker), Policy Gradient và các biến thể (DDPG, SAC, PPO) là lựa chọn chuẩn.",
    },
    {
      question: "On-policy khác off-policy ở điểm gì?",
      options: [
        "Không có gì khác",
        "On-policy: học từ data do CHÍNH policy hiện tại sinh ra (REINFORCE, PPO). Off-policy: dùng replay buffer từ policy CŨ (DQN, SAC)",
        "On-policy nhanh hơn",
      ],
      correct: 1,
      explanation:
        "REINFORCE là on-policy vì công thức gradient yêu cầu hành vi lấy mẫu theo π hiện tại. Nếu tái sử dụng dữ liệu cũ không hiệu chỉnh, gradient bị sai lệch. Off-policy như DQN, SAC có thể tái sử dụng replay buffer — sample-efficient hơn nhưng tricky hơn để ổn định.",
    },
    {
      question:
        "PPO (Proximal Policy Optimization) giải quyết vấn đề gì của REINFORCE?",
      options: [
        "Tăng FLOPs",
        "Giới hạn bước cập nhật policy (trust region) để không nhảy quá xa → ổn định hơn REINFORCE",
        "Không liên quan",
      ],
      correct: 1,
      explanation:
        "REINFORCE: một bước cập nhật quá lớn có thể phá huỷ policy (performance collapse). PPO dùng clipped surrogate objective: nếu ratio π_new/π_old vượt ngoài khoảng [1−ε, 1+ε], gradient bị chặn. Nhờ vậy update nhiều epoch trên cùng batch mà vẫn ổn định. PPO là backbone của RLHF hiện đại.",
    },
    {
      type: "fill-blank",
      question:
        "Policy Gradient cập nhật tham số bằng cách đi theo {blank} của log-likelihood nhân với {blank} (G_t hoặc advantage).",
      blanks: [
        { answer: "gradient", accept: ["grad"] },
        { answer: "reward", accept: ["return", "g_t", "phần thưởng"] },
      ],
      explanation:
        "Công thức cốt lõi: ∇_θ J(θ) = E[∇_θ log π_θ(a|s) · G_t]. Đây chính là gradient ascent trên expected reward — tăng xác suất của action tốt, giảm xác suất action xấu.",
    },
  ];
}

// ===========================================================================
// Thành phần trực quan: Corridor agent
// ===========================================================================
interface CorridorProps {
  position: number;
  isRunning: boolean;
}

function CorridorVisual({ position, isRunning }: CorridorProps) {
  const cellWidth = 520 / CORRIDOR_LENGTH;
  return (
    <svg viewBox="0 0 560 100" className="w-full max-w-2xl mx-auto">
      {/* nền corridor */}
      <rect
        x={16}
        y={32}
        width={528}
        height={42}
        rx={10}
        fill="#0f172a"
        stroke="#1e293b"
        strokeWidth={1}
      />
      {Array.from({ length: CORRIDOR_LENGTH }).map((_, idx) => {
        const x = 20 + idx * cellWidth;
        const isGoal = idx === GOAL_POSITION;
        return (
          <g key={idx}>
            <rect
              x={x}
              y={36}
              width={cellWidth - 4}
              height={34}
              rx={6}
              fill={isGoal ? "#22c55e" : "#1e293b"}
              opacity={isGoal ? 0.45 : 0.6}
              stroke={isGoal ? "#22c55e" : "#334155"}
              strokeWidth={1}
            />
            <text
              x={x + (cellWidth - 4) / 2}
              y={58}
              textAnchor="middle"
              fill={isGoal ? "#bbf7d0" : "#64748b"}
              fontSize={9}
              fontWeight={isGoal ? "bold" : "normal"}
            >
              {idx}
            </text>
          </g>
        );
      })}
      {/* agent */}
      <motion.circle
        cx={20 + position * cellWidth + (cellWidth - 4) / 2}
        cy={53}
        r={10}
        fill="#f59e0b"
        stroke="#fde68a"
        strokeWidth={2}
        animate={{
          cx: 20 + position * cellWidth + (cellWidth - 4) / 2,
          scale: isRunning ? [1, 1.15, 1] : 1,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      />
      <text
        x={280}
        y={22}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={11}
        fontWeight="bold"
      >
        Agent trong hành lang 1D — ô {GOAL_POSITION} là goal
      </text>
      <text
        x={280}
        y={92}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={9}
      >
        Mỗi bước sai: reward {STEP_PENALTY}. Đến goal: reward +{REWARD_AT_GOAL}.
      </text>
    </svg>
  );
}

// ===========================================================================
// Thành phần trực quan: Policy bar chart
// ===========================================================================
interface PolicyChartProps {
  policy: ReadonlyArray<number>;
  previousPolicy: ReadonlyArray<number> | null;
}

function PolicyChart({ policy, previousPolicy }: PolicyChartProps) {
  const barWidth = 110;
  const chartHeight = 150;
  const labels = ["← Left", "Right →"];
  return (
    <svg viewBox="0 0 360 220" className="w-full max-w-md mx-auto">
      <text
        x={180}
        y={18}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={11}
        fontWeight="bold"
      >
        Phân phối π(a | s) hiện tại
      </text>
      {[0, 1].map((i) => {
        const p = policy[i];
        const h = Math.max(2, p * chartHeight);
        const x = 60 + i * (barWidth + 40);
        const y = 40 + (chartHeight - h);
        const color = i === 0 ? "#3b82f6" : "#22c55e";
        const prev = previousPolicy?.[i] ?? null;
        return (
          <g key={i}>
            {/* trục nền */}
            <rect
              x={x}
              y={40}
              width={barWidth}
              height={chartHeight}
              rx={6}
              fill="#0f172a"
              stroke="#1e293b"
            />
            <motion.rect
              x={x}
              width={barWidth}
              rx={6}
              fill={color}
              opacity={0.85}
              initial={false}
              animate={{ y, height: h }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            />
            <text
              x={x + barWidth / 2}
              y={205}
              textAnchor="middle"
              fill={color}
              fontSize={11}
              fontWeight="bold"
            >
              {labels[i]}
            </text>
            <text
              x={x + barWidth / 2}
              y={34}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize={11}
              fontWeight="bold"
            >
              {(p * 100).toFixed(1)}%
            </text>
            {prev !== null && Math.abs(prev - p) > 0.001 ? (
              <text
                x={x + barWidth / 2}
                y={225}
                textAnchor="middle"
                fill={p > prev ? "#22c55e" : "#ef4444"}
                fontSize={9}
              >
                {p > prev ? "▲" : "▼"} {((p - prev) * 100).toFixed(1)}%
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

// ===========================================================================
// Thành phần trực quan: Gradient arrow
// ===========================================================================
interface GradientArrowProps {
  direction: "left" | "right" | "none";
  magnitude: number;
}

function GradientArrow({ direction, magnitude }: GradientArrowProps) {
  const strength = Math.max(0, Math.min(1, magnitude));
  const color =
    direction === "right"
      ? "#22c55e"
      : direction === "left"
        ? "#3b82f6"
        : "#64748b";
  const label =
    direction === "none"
      ? "Chưa có gradient — hãy chạy episode"
      : direction === "right"
        ? "Gradient đẩy policy sang RIGHT"
        : "Gradient đẩy policy sang LEFT";
  return (
    <svg viewBox="0 0 520 70" className="w-full max-w-xl mx-auto">
      <rect
        x={10}
        y={20}
        width={500}
        height={32}
        rx={8}
        fill="#0f172a"
        stroke="#1e293b"
      />
      <line
        x1={260}
        y1={36}
        x2={direction === "right" ? 260 + 220 * strength : 260 - 220 * strength}
        y2={36}
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={direction === "none" ? 0.35 : 0.9}
      />
      <circle cx={260} cy={36} r={6} fill={color} opacity={0.9} />
      <text
        x={260}
        y={12}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={10}
        fontWeight="bold"
      >
        {label}
      </text>
      <text
        x={260}
        y={64}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={9}
      >
        |G − baseline| = {magnitude.toFixed(3)}
      </text>
    </svg>
  );
}

// ===========================================================================
// Hook chính chạy mô phỏng REINFORCE
// ===========================================================================
function useREINFORCE() {
  const [policy, setPolicy] = useState<[number, number]>([
    INITIAL_POLICY[0],
    INITIAL_POLICY[1],
  ]);
  const [previousPolicy, setPreviousPolicy] = useState<[number, number] | null>(
    null,
  );
  const [position, setPosition] = useState<number>(INITIAL_POSITION);
  const [trajectory, setTrajectory] = useState<TrajectoryStep[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeRecord[]>([]);
  const [gradientDirection, setGradientDirection] = useState<
    "left" | "right" | "none"
  >("none");
  const [gradientMagnitude, setGradientMagnitude] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  const takeAction = useCallback(() => {
    setIsBusy(true);
    const action = sampleAction(policy);
    const newPos = applyAction(position, action);
    const reward = rewardAt(newPos);
    const step: TrajectoryStep = {
      position,
      action,
      reward,
      logProbIndex: action === "left" ? 0 : 1,
    };
    setTrajectory((prev) => [...prev, step]);
    setPosition(newPos);
    // reset trạng thái nếu đã đến goal hoặc quá dài
    window.setTimeout(() => setIsBusy(false), 120);
  }, [policy, position]);

  const runEpisode = useCallback(() => {
    setIsBusy(true);
    let pos = INITIAL_POSITION;
    const traj: TrajectoryStep[] = [];
    for (let i = 0; i < MAX_STEPS_PER_EPISODE; i += 1) {
      const action = sampleAction(policy);
      const nextPos = applyAction(pos, action);
      const reward = rewardAt(nextPos);
      traj.push({
        position: pos,
        action,
        reward,
        logProbIndex: action === "left" ? 0 : 1,
      });
      pos = nextPos;
      if (pos === GOAL_POSITION) break;
    }
    setTrajectory(traj);
    setPosition(pos);
    window.setTimeout(() => setIsBusy(false), 160);
  }, [policy]);

  const updatePolicyFromTrajectory = useCallback(() => {
    if (trajectory.length === 0) return;
    const before: [number, number] = [policy[0], policy[1]];
    const after = updatePolicy(policy, trajectory);
    const totalReward = trajectory.reduce((acc, s) => acc + s.reward, 0);
    const reachedGoal = trajectory.some(
      (s, idx) =>
        applyAction(s.position, s.action) === GOAL_POSITION && idx >= 0,
    );
    setPreviousPolicy(before);
    setPolicy(after);
    setGradientDirection(
      after[1] > before[1] ? "right" : after[1] < before[1] ? "left" : "none",
    );
    setGradientMagnitude(Math.abs(after[1] - before[1]) * 4);
    setEpisodes((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        steps: trajectory.length,
        totalReward,
        reachedGoal,
        policyBefore: before,
        policyAfter: after,
      },
    ]);
    setTrajectory([]);
    setPosition(INITIAL_POSITION);
  }, [policy, trajectory]);

  const reset = useCallback(() => {
    setPolicy([INITIAL_POLICY[0], INITIAL_POLICY[1]]);
    setPreviousPolicy(null);
    setPosition(INITIAL_POSITION);
    setTrajectory([]);
    setEpisodes([]);
    setGradientDirection("none");
    setGradientMagnitude(0);
  }, []);

  return {
    policy,
    previousPolicy,
    position,
    trajectory,
    episodes,
    gradientDirection,
    gradientMagnitude,
    isBusy,
    takeAction,
    runEpisode,
    updatePolicyFromTrajectory,
    reset,
  };
}

// ===========================================================================
// Bảng ghi lịch sử episodes — tối đa 8 dòng gần nhất
// ===========================================================================
interface EpisodeLogProps {
  episodes: ReadonlyArray<EpisodeRecord>;
}

function EpisodeLog({ episodes }: EpisodeLogProps) {
  const recent = episodes.slice(-8).reverse();
  if (recent.length === 0) {
    return (
      <p className="text-xs text-muted italic">
        Chưa có episode nào — hãy "Chạy episode" rồi "Cập nhật policy".
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">
        Lịch sử 8 episode gần nhất
      </p>
      <div className="space-y-1 text-[11px] text-muted">
        {recent.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between gap-2 border-b border-border/40 pb-1 last:border-0"
          >
            <span className="font-mono text-foreground">#{e.id}</span>
            <span>{e.steps} bước</span>
            <span
              className={
                e.reachedGoal ? "text-green-400" : "text-amber-400"
              }
            >
              {e.reachedGoal ? "tới goal" : "chưa tới"}
            </span>
            <span className="font-mono">R={e.totalReward.toFixed(2)}</span>
            <span className="font-mono text-blue-300">
              L {(e.policyBefore[0] * 100).toFixed(0)}→
              {(e.policyAfter[0] * 100).toFixed(0)}%
            </span>
            <span className="font-mono text-green-300">
              R {(e.policyBefore[1] * 100).toFixed(0)}→
              {(e.policyAfter[1] * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Component chính
// ===========================================================================
export default function PolicyGradientTopic() {
  const quizQuestions = useMemo<QuizQuestion[]>(
    () => buildQuizQuestions(),
    [],
  );

  const {
    policy,
    previousPolicy,
    position,
    trajectory,
    episodes,
    gradientDirection,
    gradientMagnitude,
    isBusy,
    takeAction,
    runEpisode,
    updatePolicyFromTrajectory,
    reset,
  } = useREINFORCE();

  const hasTrajectory = trajectory.length > 0;
  const trajectoryReward = trajectory.reduce((acc, s) => acc + s.reward, 0);
  const deterministicChoice = deterministicAction(policy);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Robot cần điều khiển cánh tay (góc xoay 0–360 độ — liên tục). Q-Learning cần discretize thành 36 bins → mất độ chính xác. Có cách nào tốt hơn?"
          options={[
            "Discretize nhiều hơn (3600 bins)",
            "Policy Gradient: học TRỰC TIẾP phân phối xác suất trên action liên tục — output mean và std của Gaussian",
            "Không thể dùng RL cho action liên tục",
          ]}
          correct={1}
          explanation="Q-Learning: output Q cho mỗi action rời rạc → action liên tục phải discretize (mất thông tin). Policy Gradient: output mean + std của Gaussian → sample action liên tục trực tiếp. Tự nhiên cho robot, xe tự lái, bất kỳ action space liên tục nào."
        />
      </LessonSection>

          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection>
              <div className="space-y-5">
                <p className="text-sm text-muted leading-relaxed">
                  Agent bắt đầu ở ô <strong>0</strong>, cần đến ô{" "}
                  <strong className="text-green-400">
                    {GOAL_POSITION}
                  </strong>
                  . Mỗi bước sai trừ 0.04, chạm goal được +1. Bấm{" "}
                  <em>Take Action</em> để agent đi một bước theo π(a|s). Bấm{" "}
                  <em>Chạy episode</em> để agent tự đi tối đa{" "}
                  {MAX_STEPS_PER_EPISODE} bước. Sau đó bấm{" "}
                  <em>Cập nhật policy</em> để REINFORCE chạy gradient ascent —
                  bạn sẽ thấy phân phối π dịch chuyển.
                </p>

                <CorridorVisual position={position} isRunning={isBusy} />

                <div className="grid gap-4 md:grid-cols-2">
                  <PolicyChart
                    policy={policy}
                    previousPolicy={previousPolicy}
                  />
                  <div className="flex flex-col justify-center gap-2 text-sm">
                    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted">
                        Trajectory hiện tại
                      </p>
                      <p className="mt-1 font-mono text-foreground">
                        {trajectory.length} bước ·{" "}
                        <span
                          className={
                            trajectoryReward >= 0
                              ? "text-green-300"
                              : "text-amber-300"
                          }
                        >
                          R={trajectoryReward.toFixed(2)}
                        </span>
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        Vị trí: {position} · π greedy:{" "}
                        <span className="text-foreground font-semibold">
                          {deterministicChoice}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted">
                        Tổng episodes
                      </p>
                      <p className="mt-1 font-mono text-foreground">
                        {episodes.length}
                      </p>
                    </div>
                  </div>
                </div>

                <GradientArrow
                  direction={gradientDirection}
                  magnitude={gradientMagnitude}
                />

                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={takeAction}
                    disabled={isBusy}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                  >
                    Take Action
                  </button>
                  <button
                    onClick={runEpisode}
                    disabled={isBusy}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                  >
                    Chạy episode
                  </button>
                  <button
                    onClick={updatePolicyFromTrajectory}
                    disabled={!hasTrajectory || isBusy}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
                  >
                    Update Policy
                  </button>
                  <button
                    onClick={reset}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
                  >
                    Reset
                  </button>
                </div>

                <EpisodeLog episodes={episodes} />

                <Callout variant="tip" title="Quan sát gì ở đây?">
                  Sau vài lần lặp, bar <strong>Right</strong> sẽ cao dần lên —
                  vì mọi trajectory đi sang phải đều mang lại reward dương khi
                  chạm ô {GOAL_POSITION}. Đó chính xác là gradient ascent trên{" "}
                  <LaTeX>{"J(\\theta)"}</LaTeX>.
                </Callout>
              </div>
            </VisualizationSection>

            <ProgressSteps
              current={Math.min(5, Math.floor(episodes.length / 2) + 1)}
              total={5}
              labels={[
                "Khởi tạo π = 50/50",
                "Sample trajectory",
                "Tính return G_t",
                "Gradient ascent",
                "Policy hội tụ",
              ]}
            />
          </LessonSection>

          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                Q-Learning: học <strong>bản đồ giá trị</strong> rồi suy ra
                đường đi. Policy Gradient: học{" "}
                <strong>trực tiếp cách đi</strong>. Giống học lái xe:
                Q-Learning = học giá trị mỗi ngã tư rồi tính đường. PG = học
                trực tiếp phản xạ (bao nhiêu độ, nhanh/chậm). PG tự nhiên hơn
                cho hành động liên tục!
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Thử thách"
          >
            <InlineChallenge
              question="REINFORCE có vấn đề: variance cao vì dùng toàn bộ episode return. Cách đơn giản nhất để giảm variance?"
              options={[
                "Tăng learning rate",
                "Trừ baseline b (ví dụ mean return) từ return: G_t − b. Gradient không đổi nhưng variance giảm đáng kể",
                "Dùng nhiều episodes hơn",
              ]}
              correct={1}
              explanation="Baseline subtraction: thay vì gradient = G_t · ∇ log π, dùng (G_t − b) · ∇ log π. Nếu b = mean(G), action tốt hơn trung bình → gradient dương (tăng xác suất). Action tệ → gradient âm (giảm). Không thay đổi expected gradient nhưng variance giảm 50–90%!"
            />
            <InlineChallenge
              question="Chính sách hội tụ về π(right)=0.98. Bạn có nên xoá hẳn p(left) = 0 không?"
              options={[
                "Nên, vì left không bao giờ hữu ích",
                "KHÔNG: giữ một entropy nhỏ (exploration bonus) để không bị kẹt nếu môi trường thay đổi",
                "Ngẫu nhiên 50/50 mãi",
              ]}
              correct={1}
              explanation="Khi p(action) tiến sát 1 thì gradient của action còn lại gần bằng 0 — policy không thể thoát khỏi cực trị cục bộ. Thực hành tốt: cộng thêm entropy bonus β · H(π) vào objective để giữ một chút exploration, đặc biệt khi môi trường non-stationary."
          />
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Policy Gradient</strong> tối ưu trực tiếp policy{" "}
                <LaTeX>{"\\pi_\\theta(a|s)"}</LaTeX> bằng gradient ascent trên
                expected return. Trái ngược với{" "}
                <TopicLink slug="q-learning">Q-Learning</TopicLink> (học value
                rồi suy ra policy), PG học policy trực tiếp. Kết hợp với một
                critic ta được{" "}
                <TopicLink slug="actor-critic">Actor-Critic</TopicLink>, và
                biến thể PPO/GRPO hiện là xương sống của{" "}
                <TopicLink slug="rlhf">RLHF</TopicLink> cho các mô hình ngôn
                ngữ.
              </p>

              <p>
                <strong>Policy Gradient Theorem:</strong>
              </p>
              <LaTeX block>
                {
                  "\\nabla_\\theta J(\\theta) = \\mathbb{E}_{\\pi_\\theta}\\left[\\sum_{t=0}^{T} \\nabla_\\theta \\log \\pi_\\theta(a_t|s_t) \\cdot G_t\\right]"
                }
              </LaTeX>

              <p>
                <strong>REINFORCE với baseline:</strong>
              </p>
              <LaTeX block>
                {
                  "\\nabla_\\theta J(\\theta) = \\mathbb{E}\\left[\\nabla_\\theta \\log \\pi_\\theta(a_t|s_t) \\cdot (G_t - b)\\right]"
                }
              </LaTeX>

              <p>
                <strong>Advantage function</strong> là lựa chọn baseline phổ
                biến nhất:
              </p>
              <LaTeX block>
                {
                  "A^{\\pi}(s,a) = Q^{\\pi}(s,a) - V^{\\pi}(s), \\quad \\nabla_\\theta J \\approx \\mathbb{E}\\left[\\nabla_\\theta \\log \\pi_\\theta(a|s) \\cdot A^{\\pi}(s,a)\\right]"
                }
              </LaTeX>

              <Callout variant="tip" title="Continuous Actions">
                Cho actions liên tục: policy output mean <LaTeX>{"\\mu"}</LaTeX>{" "}
                và std <LaTeX>{"\\sigma"}</LaTeX> của Gaussian. Sample action:{" "}
                <LaTeX>{"a \\sim \\mathcal{N}(\\mu, \\sigma^2)"}</LaTeX>.
                Gradient <LaTeX>{"\\nabla \\log \\mathcal{N}(a|\\mu, \\sigma)"}</LaTeX>{" "}
                tính được closed-form. Đây là cách robot, xe tự lái học điều
                khiển.
              </Callout>

              <Callout variant="info" title="Vì sao gradient ascent?">
                Chúng ta muốn <em>tăng</em>{" "}
                <LaTeX>{"J(\\theta) = \\mathbb{E}[\\text{return}]"}</LaTeX>,
                không phải giảm một loss. Trong code PyTorch, thủ thuật phổ
                biến là nhân với <code>-1</code>: đặt loss ={" "}
                <LaTeX>{"-\\log \\pi(a|s) \\cdot G"}</LaTeX>, rồi gọi{" "}
                <code>loss.backward()</code>. Gradient descent trên loss tương
                đương gradient ascent trên reward.
              </Callout>

              <Callout variant="warning" title="Cạm bẫy khi dùng REINFORCE">
                (1) Learning rate quá lớn → policy "nhảy" ra khỏi cực trị hợp
                lý, không hồi phục được. (2) Không normalise returns → gradient
                nổ/triệt tiêu. (3) Batch quá nhỏ → gradient estimator quá nhiễu
                → không hội tụ. PPO ra đời chính vì REINFORCE thuần rất khó
                tune cho bài toán lớn.
              </Callout>

              <CodeBlock
                language="python"
                title="REINFORCE với PyTorch — bản đầy đủ"
              >
                {`import torch
import torch.nn as nn
import torch.distributions as dist

class PolicyNetwork(nn.Module):
    def __init__(self, state_dim: int, action_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 128), nn.ReLU(),
            nn.Linear(128, 128), nn.ReLU(),
            nn.Linear(128, action_dim),
        )

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        logits = self.net(state)
        return torch.softmax(logits, dim=-1)


def train(env, episodes: int = 1000, gamma: float = 0.99, lr: float = 3e-4):
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.n
    policy = PolicyNetwork(state_dim, action_dim)
    optim = torch.optim.Adam(policy.parameters(), lr=lr)

    for ep in range(episodes):
        state, _ = env.reset()
        log_probs, rewards = [], []
        done = False

        while not done:
            s = torch.as_tensor(state, dtype=torch.float32)
            probs = policy(s)
            d = dist.Categorical(probs)
            a = d.sample()
            log_probs.append(d.log_prob(a))
            state, r, terminated, truncated, _ = env.step(a.item())
            rewards.append(r)
            done = terminated or truncated

        # Tính discounted returns
        returns, G = [], 0.0
        for r in reversed(rewards):
            G = r + gamma * G
            returns.insert(0, G)
        returns_t = torch.tensor(returns, dtype=torch.float32)

        # Baseline subtraction: trừ mean + chuẩn hoá → variance reduction
        returns_t = (returns_t - returns_t.mean()) / (returns_t.std() + 1e-8)

        # Policy gradient loss — dấu âm vì ta gradient-DESCENT trên -J
        loss = -(torch.stack(log_probs) * returns_t).sum()

        optim.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(policy.parameters(), 1.0)
        optim.step()

        if ep % 50 == 0:
            print(f"ep={ep:4d} return={sum(rewards):7.2f} "
                  f"len={len(rewards):3d} grad_norm_clipped=1.0")`}
              </CodeBlock>

              <CodeBlock language="python" title="NumPy — REINFORCE đồ chơi cho corridor">
                {`import numpy as np

def run_episode(policy, corridor_len=11, goal=5, max_steps=20):
    pos, traj = 0, []
    for _ in range(max_steps):
        a = np.random.choice(2, p=policy)   # 0=left, 1=right
        new_pos = max(0, pos - 1) if a == 0 else min(corridor_len - 1, pos + 1)
        r = 1.0 if new_pos == goal else -0.04
        traj.append((pos, a, r))
        pos = new_pos
        if pos == goal:
            break
    return traj

def reinforce_update(policy, traj, lr=0.35, gamma=0.95):
    # Tính return từng step
    G, returns = 0.0, []
    for _, _, r in reversed(traj):
        G = r + gamma * G
        returns.insert(0, G)
    returns = np.array(returns)
    advantages = returns - returns.mean()  # baseline = mean

    p = policy.copy()
    for (_, a, _), adv in zip(traj, advantages):
        # Gradient của log-softmax 2 lớp
        p[a]    += lr * adv * (1 - p[a])
        p[1-a]  -= lr * adv * p[1-a]
        p = np.clip(p, 0.02, 0.98)
        p /= p.sum()
    return p

policy = np.array([0.5, 0.5])
for ep in range(200):
    traj = run_episode(policy)
    policy = reinforce_update(policy, traj)
    if ep % 20 == 0:
        print(f"ep={ep:3d}  π(right)={policy[1]:.3f}  steps={len(traj)}")`}
              </CodeBlock>

              <p>
                <strong>Vì sao gọi là "log-prob trick"?</strong> Ta biến
                gradient của một kỳ vọng (khó tính) thành kỳ vọng của một
                gradient (sample-able). Điểm mấu chốt:
              </p>
              <LaTeX block>
                {
                  "\\nabla_\\theta \\pi_\\theta(a|s) = \\pi_\\theta(a|s) \\cdot \\nabla_\\theta \\log \\pi_\\theta(a|s)"
                }
              </LaTeX>
              <p>
                Nhờ đó ta có thể sample action theo policy, lấy gradient của
                log-prob rồi cân bằng bằng weight (chính là return hoặc
                advantage). Đây là cách duy nhất để huấn luyện khi environment
                không khả vi — tức gần như mọi bài toán RL thực tế (game
                engines, simulators vật lý, LLM decoding, ...).
              </p>

              <CollapsibleDetail title="Chứng minh ngắn: baseline không làm lệch expected gradient">
                <p>
                  Cho một baseline <LaTeX>{"b(s)"}</LaTeX> chỉ phụ thuộc
                  state (không phụ thuộc action). Ta có:
                </p>
                <LaTeX block>
                  {
                    "\\mathbb{E}_{a \\sim \\pi}[\\nabla_\\theta \\log \\pi_\\theta(a|s) \\cdot b(s)] = b(s) \\sum_a \\pi_\\theta(a|s) \\cdot \\frac{\\nabla_\\theta \\pi_\\theta(a|s)}{\\pi_\\theta(a|s)}"
                  }
                </LaTeX>
                <LaTeX block>
                  {
                    "= b(s) \\sum_a \\nabla_\\theta \\pi_\\theta(a|s) = b(s) \\nabla_\\theta \\left( \\sum_a \\pi_\\theta(a|s) \\right) = b(s) \\nabla_\\theta 1 = 0."
                  }
                </LaTeX>
                <p>
                  Vì vậy trừ baseline vẫn giữ unbiased estimator, chỉ làm giảm
                  variance. Baseline tối ưu (variance-minimising) có dạng
                  weighted average các returns, thường được xấp xỉ bằng một
                  value-network <LaTeX>{"V_\\phi(s)"}</LaTeX> học song song với
                  policy — chính là Actor-Critic.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="So sánh REINFORCE, A2C, PPO, GRPO">
                <p>
                  <strong>REINFORCE</strong> là bản gốc: dùng Monte Carlo
                  return, update 1 lần/episode, variance rất cao, sample ít.
                  Ưu điểm duy nhất là công thức đơn giản — bạn có thể viết
                  lại chỉ với NumPy như ví dụ phía trên.
                </p>
                <p>
                  <strong>A2C / A3C</strong> (Advantage Actor-Critic): dùng
                  Critic <LaTeX>{"V_\\phi"}</LaTeX> làm baseline, update theo
                  n-step TD hoặc Generalised Advantage Estimation. Variance
                  thấp hơn, sample efficient hơn. A3C (asynchronous) từng là
                  state-of-the-art trước khi PPO xuất hiện.
                </p>
                <p>
                  <strong>PPO</strong> (Schulman 2017): thêm clipping{" "}
                  <LaTeX>
                    {
                      "\\min(r_t A_t, \\text{clip}(r_t, 1-\\epsilon, 1+\\epsilon) A_t)"
                    }
                  </LaTeX>
                  . Cho phép update nhiều epoch/batch. Đây là default của
                  OpenAI, DeepMind cho RL control và cũng là thuật toán gốc
                  cho RLHF tại OpenAI.
                </p>
                <p>
                  <strong>GRPO</strong> (DeepSeek 2024): variant của PPO dành
                  cho RLHF/LLM — bỏ critic, dùng group-mean làm baseline. Đơn
                  giản hơn, ít memory hơn, phù hợp khi sample theo prompt.
                  DeepSeek R1, Qwen 2.5, và nhiều mô hình mở khác hiện dùng
                  GRPO thay cho PPO truyền thống.
                </p>
                <p>
                  <strong>TRPO</strong> (Schulman 2015) là tiền thân của PPO:
                  dùng trust region dựa trên KL-divergence, giải bằng
                  conjugate gradient. Tốt về lý thuyết nhưng phức tạp triển
                  khai — PPO đơn giản hoá bằng cách chỉ clip ratio thay vì
                  giải toán tối ưu có ràng buộc.
                </p>
              </CollapsibleDetail>

              <Callout variant="insight" title="Từ REINFORCE đến ChatGPT">
                Con đường từ REINFORCE (1992) đến RLHF cho ChatGPT (2022) chỉ
                là các lớp cải tiến kỹ thuật chồng lên nhau: (1) thêm
                Critic/Advantage → A2C, (2) thêm trust region → TRPO/PPO, (3)
                dùng preference model thay environment reward → RLHF, (4) bỏ
                critic và dùng group-mean baseline → GRPO. Ý tưởng cốt lõi{" "}
                <LaTeX>
                  {"\\nabla J \\propto \\mathbb{E}[\\nabla \\log \\pi \\cdot A]"}
                </LaTeX>{" "}
                vẫn giữ nguyên suốt 30 năm.
              </Callout>

              <p className="mt-4">
                <strong>Khi nào Policy Gradient thất bại?</strong> Khi reward
                cực kỳ thưa thớt (ví dụ Montezuma's Revenge — phần thưởng chỉ
                xuất hiện sau hàng trăm bước), mean return ≈ 0, advantage cũng
                ≈ 0, và policy không có tín hiệu để học. Giải pháp: thêm
                intrinsic reward (curiosity), hierarchical RL, hoặc imitation
                learning để bootstrap.
              </p>

              <p>
                <strong>Liên hệ với Maximum Likelihood:</strong> nếu bạn gán
                weight cho mỗi trajectory theo return của nó và cực đại hoá
                log-likelihood có trọng số, bạn sẽ ra đúng công thức REINFORCE.
                Đây là góc nhìn "RL = weighted supervised learning" mà nhiều
                paper RLHF khai thác (ví dụ RWR, AWR, DPO đều dựa trên ý
                tưởng này).
              </p>

              <p>
                <strong>Tại sao không dùng thẳng gradient của reward?</strong>{" "}
                Reward thường không khả vi theo <LaTeX>{"\\theta"}</LaTeX> —
                environment là hộp đen. Ta chỉ quan sát <em>samples</em> chứ
                không có <LaTeX>{"\\nabla_\\theta R(s,a)"}</LaTeX>. Policy
                Gradient Theorem là mẹo toán để đẩy gradient vào trong kỳ
                vọng: <LaTeX>{"\\nabla \\mathbb{E}_\\pi[R] = \\mathbb{E}_\\pi[\\nabla \\log \\pi \\cdot R]"}</LaTeX>
                . Mẹo này còn gọi là "log-derivative trick" hoặc "score function
                estimator" — xuất hiện ở khắp nơi: variational inference,
                reparameterization trick, REBAR, Gumbel-softmax...
              </p>

              <p>
                <strong>Gợi ý đọc thêm (pháp lý tinh thần):</strong> Sutton &
                Barto chương 13, Spinning Up của OpenAI, và paper gốc PPO. Với
                LLM: InstructGPT paper, DeepSeek-R1 technical report, và
                "Secrets of RLHF" series. Nếu thích thực hành, CleanRL (repo
                của Shengyi Huang) có các file single-file cho REINFORCE,
                PPO, GRPO — đọc một lần hiểu toàn bộ pipeline.
              </p>

              <p>
                <strong>Công thức bạn nên thuộc lòng:</strong>{" "}
                <LaTeX>{"\\nabla_\\theta J(\\theta) = \\mathbb{E}[\\nabla_\\theta \\log \\pi_\\theta(a|s) \\cdot A^\\pi(s,a)]"}</LaTeX>
                . Mọi thuật toán PG hiện đại (A2C, PPO, SAC-discrete, GRPO)
                đều bắt đầu từ đây rồi chỉ thay đổi cách <em>ước lượng</em>{" "}
                advantage <LaTeX>{"A^\\pi"}</LaTeX> và cách{" "}
                <em>giới hạn</em> bước update.
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Policy Gradient học TRỰC TIẾP π(a|s), không qua Q-value — tự nhiên cho action liên tục.",
                "REINFORCE: sample episode → tính return G_t → update θ theo ∇ log π · G_t.",
                "Baseline subtraction: trừ mean return, giảm variance 50–90% mà KHÔNG thay đổi expected gradient.",
                "On-policy: mỗi gradient step chỉ dùng dữ liệu từ policy hiện tại — kém sample-efficient hơn off-policy (DQN).",
                "Actor-Critic: dùng Critic V_φ(s) làm baseline — biến REINFORCE thành A2C/PPO, ổn định hơn nhiều.",
                "PPO/GRPO (với clipping và trust-region) là xương sống của RLHF hiện đại cho ChatGPT, Claude, Gemini.",
              ]}
            />
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
    </>
  );
}
