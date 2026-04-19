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
// Metadata — DO NOT CHANGE. Used by the topic indexer at build time.
// ---------------------------------------------------------------------------
export const metadata: TopicMeta = {
  slug: "multi-armed-bandit",
  title: "Multi-Armed Bandit",
  titleVi: "Bài toán máy đánh bạc nhiều tay",
  description:
    "Bài toán cân bằng giữa khai thác kiến thức đã có và khám phá lựa chọn mới",
  category: "reinforcement-learning",
  tags: ["exploration", "exploitation", "epsilon-greedy"],
  difficulty: "advanced",
  relatedSlugs: [
    "q-learning",
    "recommendation-systems",
    "supervised-unsupervised-rl",
  ],
  vizType: "interactive",
};

// ---------------------------------------------------------------------------
// Cấu hình 5 máy đánh bạc — reward thật sự ẩn với người chơi
// ---------------------------------------------------------------------------
const TOTAL_STEPS = 7;

interface BanditArm {
  readonly name: string;
  readonly trueReward: number; // xác suất trả thưởng thật, ẩn với user
  readonly color: string;
}

const ARMS: ReadonlyArray<BanditArm> = Object.freeze([
  { name: "Máy 1", trueReward: 0.35, color: "#3b82f6" },
  { name: "Máy 2", trueReward: 0.55, color: "#22c55e" },
  { name: "Máy 3", trueReward: 0.78, color: "#f59e0b" },
  { name: "Máy 4", trueReward: 0.42, color: "#8b5cf6" },
  { name: "Máy 5", trueReward: 0.6, color: "#ec4899" },
]);

const N_ARMS = ARMS.length;
const BEST_ARM_INDEX = (() => {
  let best = 0;
  for (let i = 1; i < N_ARMS; i += 1) {
    if (ARMS[i].trueReward > ARMS[best].trueReward) best = i;
  }
  return best;
})();
const BEST_REWARD = ARMS[BEST_ARM_INDEX].trueReward;

type Strategy = "greedy" | "epsilon" | "ucb";
const EPSILON = 0.1;
const UCB_C = 2;
const MAX_REGRET_POINTS = 200;

// ---------------------------------------------------------------------------
// Toán cho các chiến lược
// ---------------------------------------------------------------------------
function selectGreedy(estimates: ReadonlyArray<number>, counts: ReadonlyArray<number>): number {
  // Ưu tiên arm chưa thử — tránh chia 0 khi tất cả đều 0
  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i] === 0) return i;
  }
  let bestIdx = 0;
  let bestVal = estimates[0];
  for (let i = 1; i < estimates.length; i += 1) {
    if (estimates[i] > bestVal) {
      bestVal = estimates[i];
      bestIdx = i;
    }
  }
  return bestIdx;
}

function selectEpsilon(
  estimates: ReadonlyArray<number>,
  counts: ReadonlyArray<number>,
): number {
  if (Math.random() < EPSILON) {
    return Math.floor(Math.random() * estimates.length);
  }
  return selectGreedy(estimates, counts);
}

function selectUCB(
  estimates: ReadonlyArray<number>,
  counts: ReadonlyArray<number>,
  totalPulls: number,
): number {
  // arm chưa thử → ưu tiên
  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i] === 0) return i;
  }
  let bestIdx = 0;
  let bestScore = -Infinity;
  const lnT = Math.log(Math.max(1, totalPulls));
  for (let i = 0; i < estimates.length; i += 1) {
    const bonus = UCB_C * Math.sqrt(lnT / counts[i]);
    const score = estimates[i] + bonus;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function drawReward(arm: number): number {
  return Math.random() < ARMS[arm].trueReward ? 1 : 0;
}

function computeInstantRegret(arm: number): number {
  return BEST_REWARD - ARMS[arm].trueReward;
}

// ---------------------------------------------------------------------------
// Quiz — 8 câu theo yêu cầu
// ---------------------------------------------------------------------------
function buildQuizQuestions(): QuizQuestion[] {
  return [
    {
      question: "Explore vs Exploit dilemma là gì?",
      options: [
        "Chọn model lớn hay nhỏ",
        "EXPLOIT: chọn lựa chọn TỐT NHẤT đã biết → tối đa reward ngắn hạn. EXPLORE: thử lựa chọn MỚI → có thể tìm tốt hơn. Cần cân bằng!",
        "Chọn data nhiều hay ít",
      ],
      correct: 1,
      explanation:
        "Ví dụ: bạn biết quán Phở A ngon (exploit). Nhưng có quán B chưa thử — có thể ngon hơn! Nếu chỉ exploit → miss Phở B. Nếu chỉ explore → lãng phí thời gian thử nhiều quán tệ. Epsilon-greedy: 90% chọn tốt nhất, 10% thử random.",
    },
    {
      question: "UCB (Upper Confidence Bound) tốt hơn epsilon-greedy thế nào?",
      options: [
        "Nhanh hơn",
        "UCB ưu tiên explore arms ÍT ĐƯỢC THỬ (uncertainty cao). Epsilon-greedy explore RANDOM không care đã thử hay chưa",
        "Không tốt hơn",
      ],
      correct: 1,
      explanation:
        "UCB = mean reward + bonus cho uncertainty. Arm chưa thử nhiều → bonus lớn → được explore. Arm đã thử nhiều → bonus nhỏ → chỉ exploit nếu mean cao. Thông minh hơn random explore: explore CÓ MỤC ĐÍCH (giảm uncertainty).",
    },
    {
      question: "A/B testing trên Shopee là dạng Bandit không?",
      options: [
        "Không liên quan",
        "Có! A/B test = 2-armed bandit. Variant A và B = 2 arms. Click rate = reward. Bandit approach (Thompson Sampling) tốt hơn A/B test truyền thống vì ADAPTIVE",
        "Chỉ là thống kê",
      ],
      correct: 1,
      explanation:
        "A/B test: chia 50/50, đợi đủ data, chọn winner. Bandit: bắt đầu 50/50, DẦN CHUYỂN traffic sang variant tốt hơn. Bandit: ít user nhận variant tệ hơn → ethical + hiệu quả hơn. Shopee, Grab, Netflix đều dùng Bandit cho recommendation.",
    },
    {
      question: "Regret (hối tiếc) trong bandit là gì?",
      options: [
        "Một loại loss function",
        "Regret = (reward nếu luôn chọn arm tốt nhất) − (reward thực tế). Mọi chiến lược tốt phải có regret tăng SUB-LINEAR theo T.",
        "Khoảng cách giữa prediction và label",
      ],
      correct: 1,
      explanation:
        "Regret R(T) = T · μ* − Σ μ_{a_t}. UCB có regret O(log T), Thompson Sampling có regret O(log T) với constant nhỏ hơn. Epsilon-greedy với ε cố định có regret linear — không tối ưu. Thuật toán 'no-regret' là thuật toán mà regret/T → 0.",
    },
    {
      question: "Thompson Sampling hoạt động thế nào?",
      options: [
        "Random thuần tuý",
        "Model reward của mỗi arm bằng phân phối hậu nghiệm (Beta cho Bernoulli). Mỗi bước sample θ_a ∼ posterior, chọn arm có θ cao nhất.",
        "Giống UCB nhưng dùng exp thay log",
      ],
      correct: 1,
      explanation:
        "Thompson Sampling là thuật toán Bayesian: giữ Beta(α_a, β_a) cho mỗi arm. Mỗi vòng: sample từ posterior → chọn argmax → update posterior. Explore tự nhiên vì arm có uncertainty cao có posterior rộng, đôi khi sample ra giá trị lớn và được chọn.",
    },
    {
      question: "Khi nào ε-greedy với ε cố định là LỰA CHỌN XẤU?",
      options: [
        "Khi có rất ít arms",
        "Khi bài toán dài hạn (T → ∞): luôn 10% random → regret tăng linear. Nên dùng ε giảm dần (ε_t = 1/t) hoặc UCB/Thompson",
        "Khi dùng GPU",
      ],
      correct: 1,
      explanation:
        "ε-greedy với ε=0.1 cố định: ngay cả khi đã biết arm tốt nhất, vẫn lãng phí 10% lượt thử random. Regret = Θ(T). Nếu ε_t giảm dần đủ nhanh (ví dụ 1/t), regret có thể sublinear. Tuy nhiên Thompson Sampling thường ổn định và dễ dùng hơn trong thực tế.",
    },
    {
      question: "Contextual bandit khác standard bandit ở đâu?",
      options: [
        "Không khác",
        "Contextual: mỗi vòng có feature vector (user profile) → chính sách π(arm | context). Đây là nền tảng của recommendation systems hiện đại",
        "Contextual nhanh hơn",
      ],
      correct: 1,
      explanation:
        "Standard: mọi user/vòng giống nhau → chỉ học μ_a. Contextual: mỗi vòng có x_t (tuổi, giới, history...) → học f_a(x). LinUCB, Neural Contextual Bandits là thuật toán chuẩn. Netflix, YouTube, TikTok recommendation đều là contextual bandit thực thụ.",
    },
    {
      type: "fill-blank",
      question:
        "Bandit phải cân bằng hai mục tiêu: {blank} (thử arm mới để giảm bất định) và {blank} (khai thác arm tốt nhất đã biết).",
      blanks: [
        { answer: "exploration", accept: ["explore", "khám phá", "kham pha"] },
        {
          answer: "exploitation",
          accept: ["exploit", "khai thác", "khai thac"],
        },
      ],
      explanation:
        "Đây là trade-off cốt lõi của mọi bài toán RL. Epsilon-greedy, UCB, Thompson Sampling là ba chiến lược phổ biến để cân bằng exploration và exploitation.",
    },
  ];
}

// ===========================================================================
// Hook chính chạy bandit
// ===========================================================================
interface BanditState {
  counts: number[];
  rewards: number[]; // tổng reward đã nhận
  cumulativeRegret: number;
  regretHistory: number[];
  pullHistory: number[]; // arm index mỗi lượt
  totalPulls: number;
}

function initialState(): BanditState {
  return {
    counts: new Array(N_ARMS).fill(0),
    rewards: new Array(N_ARMS).fill(0),
    cumulativeRegret: 0,
    regretHistory: [0],
    pullHistory: [],
    totalPulls: 0,
  };
}

function useBandit() {
  const [strategy, setStrategy] = useState<Strategy>("epsilon");
  const [state, setState] = useState<BanditState>(initialState);

  const estimates = useMemo(
    () =>
      state.rewards.map((r, i) => (state.counts[i] > 0 ? r / state.counts[i] : 0)),
    [state.rewards, state.counts],
  );

  const pullManual = useCallback(
    (arm: number) => {
      setState((prev) => {
        const reward = drawReward(arm);
        const counts = [...prev.counts];
        const rewards = [...prev.rewards];
        counts[arm] += 1;
        rewards[arm] += reward;
        const newRegret =
          prev.cumulativeRegret + computeInstantRegret(arm);
        const regretHistory = [...prev.regretHistory, newRegret].slice(
          -MAX_REGRET_POINTS,
        );
        const pullHistory = [...prev.pullHistory, arm].slice(
          -MAX_REGRET_POINTS,
        );
        return {
          counts,
          rewards,
          cumulativeRegret: newRegret,
          regretHistory,
          pullHistory,
          totalPulls: prev.totalPulls + 1,
        };
      });
    },
    [],
  );

  const pullByStrategy = useCallback(() => {
    setState((prev) => {
      const est = prev.rewards.map((r, i) =>
        prev.counts[i] > 0 ? r / prev.counts[i] : 0,
      );
      let arm = 0;
      if (strategy === "greedy") arm = selectGreedy(est, prev.counts);
      else if (strategy === "epsilon") arm = selectEpsilon(est, prev.counts);
      else arm = selectUCB(est, prev.counts, prev.totalPulls + 1);

      const reward = drawReward(arm);
      const counts = [...prev.counts];
      const rewards = [...prev.rewards];
      counts[arm] += 1;
      rewards[arm] += reward;
      const newRegret = prev.cumulativeRegret + computeInstantRegret(arm);
      const regretHistory = [...prev.regretHistory, newRegret].slice(
        -MAX_REGRET_POINTS,
      );
      const pullHistory = [...prev.pullHistory, arm].slice(-MAX_REGRET_POINTS);
      return {
        counts,
        rewards,
        cumulativeRegret: newRegret,
        regretHistory,
        pullHistory,
        totalPulls: prev.totalPulls + 1,
      };
    });
  }, [strategy]);

  const runBatch = useCallback(
    (n: number) => {
      for (let i = 0; i < n; i += 1) pullByStrategy();
    },
    [pullByStrategy],
  );

  const reset = useCallback(() => {
    setState(initialState());
  }, []);

  return {
    strategy,
    setStrategy,
    state,
    estimates,
    pullManual,
    pullByStrategy,
    runBatch,
    reset,
  };
}

// ===========================================================================
// Visualisation: 5 slot machines
// ===========================================================================
interface SlotMachineProps {
  arm: BanditArm;
  index: number;
  count: number;
  estimate: number;
  onPull: (arm: number) => void;
  isBest: boolean;
}

function SlotMachine({
  arm,
  index,
  count,
  estimate,
  onPull,
  isBest,
}: SlotMachineProps) {
  return (
    <motion.button
      onClick={() => onPull(index)}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-3 transition-colors hover:border-accent/50"
      style={{ minWidth: 96 }}
    >
      <svg viewBox="0 0 80 110" className="h-24 w-20">
        {/* thân máy */}
        <rect
          x={10}
          y={10}
          width={60}
          height={80}
          rx={8}
          fill={arm.color}
          opacity={0.25}
          stroke={arm.color}
          strokeWidth={1.5}
        />
        {/* màn hình */}
        <rect x={16} y={20} width={48} height={26} rx={4} fill="#0f172a" />
        <text
          x={40}
          y={36}
          textAnchor="middle"
          fill={arm.color}
          fontSize={11}
          fontWeight="bold"
        >
          {(estimate * 100).toFixed(0)}%
        </text>
        {/* cần gạt */}
        <line
          x1={70}
          y1={30}
          x2={76}
          y2={54}
          stroke={arm.color}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={76} cy={54} r={4} fill={arm.color} />
        {/* chân máy */}
        <rect
          x={16}
          y={52}
          width={48}
          height={34}
          rx={3}
          fill="#1e293b"
          stroke={arm.color}
          strokeWidth={0.8}
          opacity={0.6}
        />
        <text
          x={40}
          y={74}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize={11}
        >
          pull: {count}
        </text>
        {isBest ? (
          <text
            x={40}
            y={104}
            textAnchor="middle"
            fill="#fbbf24"
            fontSize={11}
            fontWeight="bold"
          >
            TRUE BEST
          </text>
        ) : null}
      </svg>
      <span
        className="text-xs font-semibold"
        style={{ color: arm.color }}
      >
        {arm.name}
      </span>
    </motion.button>
  );
}

// ===========================================================================
// Visualisation: regret graph
// ===========================================================================
interface RegretChartProps {
  history: ReadonlyArray<number>;
  strategy: Strategy;
}

function RegretChart({ history, strategy }: RegretChartProps) {
  const width = 520;
  const height = 160;
  const paddingX = 34;
  const paddingY = 24;
  const n = history.length;
  const maxRegret = Math.max(1, history[n - 1] ?? 1);
  const path = history
    .map((v, i) => {
      const x =
        paddingX + ((width - 2 * paddingX) * i) / Math.max(1, n - 1);
      const y = height - paddingY - ((height - 2 * paddingY) * v) / maxRegret;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const strategyLabel =
    strategy === "greedy"
      ? "Pure Greedy"
      : strategy === "epsilon"
        ? `ε-Greedy (ε=${EPSILON})`
        : `UCB (c=${UCB_C})`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl mx-auto">
      {/* khung */}
      <rect
        x={paddingX - 2}
        y={paddingY - 2}
        width={width - 2 * paddingX + 4}
        height={height - 2 * paddingY + 4}
        fill="#0f172a"
        stroke="#1e293b"
      />
      {/* trục y — gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = height - paddingY - (height - 2 * paddingY) * frac;
        return (
          <g key={frac}>
            <line
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              stroke="#1e293b"
              strokeDasharray="2,3"
            />
            <text
              x={paddingX - 4}
              y={y + 3}
              textAnchor="end"
              fill="#64748b"
              fontSize={11}
            >
              {(maxRegret * frac).toFixed(1)}
            </text>
          </g>
        );
      })}
      {/* đường regret */}
      <path d={path} fill="none" stroke="#ef4444" strokeWidth={1.8} />
      {/* nhãn */}
      <text
        x={width / 2}
        y={16}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={11}
        fontWeight="bold"
      >
        Cumulative regret — {strategyLabel}
      </text>
      <text
        x={width - paddingX}
        y={height - 6}
        textAnchor="end"
        fill="#94a3b8"
        fontSize={11}
      >
        pulls: {n - 1}
      </text>
      <text
        x={paddingX}
        y={height - 6}
        textAnchor="start"
        fill="#ef4444"
        fontSize={11}
      >
        total regret = {maxRegret.toFixed(2)}
      </text>
    </svg>
  );
}

// ===========================================================================
// Visualisation: strategy tabs
// ===========================================================================
interface StrategyTabsProps {
  strategy: Strategy;
  setStrategy: (s: Strategy) => void;
}

function StrategyTabs({ strategy, setStrategy }: StrategyTabsProps) {
  const items: { key: Strategy; label: string; hint: string }[] = [
    { key: "greedy", label: "Greedy", hint: "Luôn chọn arm mean cao nhất" },
    {
      key: "epsilon",
      label: "ε-Greedy",
      hint: `90% greedy, 10% random (ε=${EPSILON})`,
    },
    { key: "ucb", label: "UCB", hint: `mean + c√(ln t / N) (c=${UCB_C})` },
  ];
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {items.map((it) => {
        const active = it.key === strategy;
        return (
          <button
            key={it.key}
            onClick={() => setStrategy(it.key)}
            className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
              active
                ? "border-accent bg-accent/20 text-foreground"
                : "border-border/60 bg-background/40 text-muted hover:border-accent/40"
            }`}
          >
            <div className="font-semibold">{it.label}</div>
            <div className="text-[10px] opacity-80">{it.hint}</div>
          </button>
        );
      })}
    </div>
  );
}

// ===========================================================================
// Visualisation: pull distribution bar
// ===========================================================================
interface PullDistributionProps {
  counts: ReadonlyArray<number>;
  estimates: ReadonlyArray<number>;
}

function PullDistribution({ counts, estimates }: PullDistributionProps) {
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <div className="grid gap-2 text-xs">
      {ARMS.map((arm, i) => {
        const frac = total > 0 ? counts[i] / total : 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-16 shrink-0 font-semibold"
              style={{ color: arm.color }}
            >
              {arm.name}
            </span>
            <div className="relative h-4 flex-1 overflow-hidden rounded-md bg-background/40">
              <motion.div
                className="absolute inset-y-0 left-0"
                style={{ backgroundColor: arm.color, opacity: 0.8 }}
                initial={false}
                animate={{ width: `${frac * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
              />
            </div>
            <span className="w-24 shrink-0 text-right font-mono text-muted">
              {counts[i]} pulls · {(estimates[i] * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ===========================================================================
// Component chính
// ===========================================================================
export default function MultiArmedBanditTopic() {
  const quizQuestions = useMemo<QuizQuestion[]>(
    () => buildQuizQuestions(),
    [],
  );

  const {
    strategy,
    setStrategy,
    state,
    estimates,
    pullManual,
    pullByStrategy,
    runBatch,
    reset,
  } = useBandit();

  const totalPulls = state.totalPulls;
  const totalReward = state.rewards.reduce((a, b) => a + b, 0);
  const avgReward = totalPulls > 0 ? totalReward / totalPulls : 0;
  const optimalRate =
    totalPulls > 0
      ? state.pullHistory.filter((a) => a === BEST_ARM_INDEX).length /
        state.pullHistory.length
      : 0;

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn bước vào casino có 5 máy slot. Mỗi máy có xác suất thắng KHÁC NHAU nhưng ẨN. Bạn có 100 lượt kéo. Làm sao tối đa tiền thắng?"
          options={[
            "Kéo mãi 1 máy ngẫu nhiên",
            "Thử mỗi máy 20 lần rồi kéo máy tốt nhất",
            "Cân bằng explore (thử máy mới) và exploit (kéo máy đã biết tốt) — đây là Multi-Armed Bandit!",
          ]}
          correct={2}
          explanation="Nếu chỉ exploit (1 máy) → có thể kẹt ở máy tệ. Nếu explore đều → lãng phí lượt cho máy tệ. Chiến lược tối ưu: lúc đầu explore nhiều, dần exploit khi đã có đủ thông tin. Đây là bài toán cơ bản của RL."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection>
              <div className="space-y-5">
                <p className="text-sm text-muted leading-relaxed">
                  Có <strong>5 máy slot</strong>; mỗi máy trả thưởng 0/1 theo
                  một xác suất ẨN. Bạn có thể click vào máy để{" "}
                  <em>tự kéo</em>, hoặc chọn chiến lược rồi bấm{" "}
                  <em>Auto Pull</em> / <em>Run 50</em> để thuật toán tự quyết.
                  Đồ thị regret bên dưới cho thấy sự khác biệt giữa Greedy,
                  ε-Greedy, UCB.
                </p>

                <div className="flex flex-wrap justify-center gap-2">
                  {ARMS.map((arm, i) => (
                    <SlotMachine
                      key={i}
                      arm={arm}
                      index={i}
                      count={state.counts[i]}
                      estimate={estimates[i]}
                      onPull={pullManual}
                      isBest={i === BEST_ARM_INDEX && totalPulls >= 40}
                    />
                  ))}
                </div>

                <StrategyTabs strategy={strategy} setStrategy={setStrategy} />

                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={pullByStrategy}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                  >
                    Auto Pull ×1
                  </button>
                  <button
                    onClick={() => runBatch(10)}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
                  >
                    Run ×10
                  </button>
                  <button
                    onClick={() => runBatch(50)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-500"
                  >
                    Run ×50
                  </button>
                  <button
                    onClick={reset}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
                  >
                    Reset
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      Tổng lượt kéo
                    </p>
                    <p className="mt-1 font-mono text-lg text-foreground">
                      {totalPulls}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      Avg reward
                    </p>
                    <p className="mt-1 font-mono text-lg text-foreground">
                      {avgReward.toFixed(3)}
                      <span className="text-[11px] text-muted">
                        {" "}
                        / optimal {BEST_REWARD.toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      % lượt chọn best arm
                    </p>
                    <p className="mt-1 font-mono text-lg text-foreground">
                      {(optimalRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <PullDistribution
                  counts={state.counts}
                  estimates={estimates}
                />

                <RegretChart
                  history={state.regretHistory}
                  strategy={strategy}
                />

                <Callout variant="tip" title="Thử nghiệm so sánh">
                  Reset, chọn <strong>Greedy</strong> rồi{" "}
                  <em>Run ×50</em>. Reset, chọn <strong>UCB</strong> và chạy
                  tương tự. Đồ thị regret của Greedy thường <em>tăng mạnh</em>{" "}
                  (vì bị kẹt ở arm không tối ưu), còn UCB tăng chậm theo log.
                </Callout>
              </div>
            </VisualizationSection>

            <ProgressSteps
              current={Math.min(
                5,
                1 + Math.floor(totalPulls / 15),
              )}
              total={5}
              labels={[
                "Ước lượng ban đầu = 0",
                "Explore mỗi arm",
                "Ước lượng mean reward",
                "Exploit arm cao nhất",
                "Regret hội tụ log(t)",
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
                Bạn vừa giải quyết{" "}
                <strong>bài toán cơ bản nhất của RL</strong>: explore vs
                exploit. Epsilon-greedy: 90% chọn tốt nhất, 10% random. UCB:
                explore arms có <strong>uncertainty cao</strong> (chưa thử
                nhiều). Thompson Sampling: model uncertainty bằng{" "}
                <strong>phân phối xác suất</strong> — thông minh nhất! Shopee,
                Netflix, Grab đều dùng Bandit hàng ngày.
              </p>
            </AhaMoment>
          </LessonSection>

          <LessonSection
            step={4}
            totalSteps={TOTAL_STEPS}
            label="Thử thách"
          >
            <InlineChallenge
              question="Shopee test 3 thiết kế nút 'Mua ngay'. A/B/C test: chia đều 33/33/33, đợi 2 tuần. Bandit approach: bắt đầu 33/33/33, nhanh chóng chuyển traffic sang variant tốt nhất. Ưu điểm Bandit?"
              options={[
                "Nhanh hơn",
                "ÍT USER NHẬN VARIANT TỆ: A/B chậm 2 tuần chia đều (nhiều user nhận variant tệ). Bandit chuyển nhanh → ít user bị ảnh hưởng. ETHICAL + HIỆU QUẢ hơn",
                "Rẻ hơn",
              ]}
              correct={1}
              explanation="A/B test: 100K users × 2 tuần × variant C (tệ nhất) = 33K users có trải nghiệm tệ. Bandit: sau 1000 users nhận ra C tệ → giảm traffic C xuống 5% → chỉ ~5K users nhận C. Bandit giảm 6x số users bị ảnh hưởng."
            />
            <InlineChallenge
              question="Chạy UCB với c rất lớn (ví dụ c=100). Dự đoán regret curve?"
              options={[
                "Regret giảm nhanh hơn",
                "Regret TĂNG — vì bonus lớn khiến thuật toán cứ explore mãi, không exploit đủ arm tốt",
                "Không thay đổi",
              ]}
              correct={1}
              explanation="c điều chỉnh trade-off explore/exploit. c quá lớn → bonus lấn át mean → thuật toán như random explore, regret cao. c quá nhỏ → hành xử như greedy, kẹt ở arm tồi. c=√2 (theoretical) hoặc c≈2 (practical) thường tốt."
            />
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Multi-Armed Bandit</strong> là bài toán cân bằng
                explore (thử mới) và exploit (dùng tốt nhất) — cơ bản nhất
                của RL. Khi thêm state và transition, bandit mở rộng thành
                full RL như{" "}
                <TopicLink slug="q-learning">Q-Learning</TopicLink> hoặc{" "}
                <TopicLink slug="policy-gradient">Policy Gradient</TopicLink>.
              </p>

              <p>
                <strong>3 chiến lược chính (action-value):</strong>
              </p>
              <LaTeX block>
                {
                  "\\text{Epsilon-greedy: } a_t = \\begin{cases} \\arg\\max_a \\hat{Q}(a) & \\text{với xác suất } 1-\\epsilon \\\\ \\text{random} & \\text{với xác suất } \\epsilon \\end{cases}"
                }
              </LaTeX>
              <LaTeX block>
                {
                  "\\text{UCB: } a_t = \\arg\\max_a \\left[\\hat{Q}(a) + c\\sqrt{\\frac{\\ln t}{N(a)}}\\right]"
                }
              </LaTeX>
              <LaTeX block>
                {
                  "\\text{Thompson Sampling: } \\theta_a \\sim \\text{Beta}(\\alpha_a, \\beta_a), \\quad a_t = \\arg\\max_a \\theta_a"
                }
              </LaTeX>

              <p>
                <strong>Regret — thước đo chất lượng:</strong>
              </p>
              <LaTeX block>
                {
                  "R(T) = T \\cdot \\mu^{*} - \\mathbb{E}\\left[\\sum_{t=1}^{T} \\mu_{a_t}\\right]"
                }
              </LaTeX>
              <p>
                Với <LaTeX>{"\\mu^{*}"}</LaTeX> là mean reward của arm tối ưu.
                UCB và Thompson Sampling có regret <LaTeX>{"O(\\log T)"}</LaTeX>{" "}
                — coi như tối ưu theo định lý Lai–Robbins. ε-Greedy với ε cố
                định có regret <LaTeX>{"\\Theta(T)"}</LaTeX> — tệ hơn nhiều về
                dài hạn.
              </p>

              <Callout variant="tip" title="Thompson Sampling">
                Thompson Sampling tốt nhất trong thực tế cho Bernoulli rewards:
                model phân phối reward bằng <LaTeX>{"\\text{Beta}(\\alpha, \\beta)"}</LaTeX>
                . Mỗi vòng sample <LaTeX>{"\\theta_a"}</LaTeX> từ posterior →
                chọn arm cao nhất → update. Explore tự nhiên: arm có
                uncertainty cao → posterior rộng → thỉnh thoảng sample ra giá
                trị lớn và được chọn. Collect ổn và hiệu quả hơn UCB trên hầu
                hết benchmark.
              </Callout>

              <Callout variant="info" title="Contextual Bandit">
                Khi có thêm <em>context</em> (feature vector mô tả user hoặc
                item), ta có <strong>contextual bandit</strong>: học một hàm{" "}
                <LaTeX>{"f_a(x)"}</LaTeX> thay vì chỉ một con số μ_a. LinUCB
                (2010), Neural LinUCB, Deep Contextual Bandit là các biến thể
                đang chạy production ở YouTube, TikTok, Amazon, Netflix.
              </Callout>

              <Callout variant="warning" title="Non-stationary rewards">
                Trong thực tế μ_a <em>thay đổi theo thời gian</em> (user trend
                thay đổi, seasonality...). Giải pháp: dùng{" "}
                <strong>sliding-window</strong> (chỉ nhớ N lượt gần nhất),{" "}
                <strong>exponential discount</strong> cho ước lượng, hoặc{" "}
                <strong>change-point detection</strong> để reset posterior.
                Việc giả định stationary là bẫy phổ biến khiến bandit rớt khỏi
                production.
              </Callout>

              <Callout variant="insight" title="Liên hệ với Bayesian optimization">
                Thompson Sampling là đặc trường hợp của Bayesian Optimization
                khi action space rời rạc. Khi action liên tục (ví dụ
                hyperparameter tuning), ta thay Beta posterior bằng Gaussian
                Process. Thuật toán Expected Improvement, GP-UCB, và
                batched-Thompson đều là anh em ruột của ba thuật toán bandit
                trên.
              </Callout>

              <CodeBlock
                language="python"
                title="NumPy — UCB cho 5-armed bandit"
              >
                {`import numpy as np

class UCB:
    def __init__(self, n_arms: int, c: float = 2.0):
        self.n_arms = n_arms
        self.c = c
        self.counts = np.zeros(n_arms, dtype=np.int64)
        self.sums   = np.zeros(n_arms, dtype=np.float64)
        self.t = 0

    def select_arm(self) -> int:
        # Ưu tiên arm chưa thử — tránh chia 0
        for a in range(self.n_arms):
            if self.counts[a] == 0:
                return a
        ln_t = np.log(self.t)
        means = self.sums / self.counts
        bonus = self.c * np.sqrt(ln_t / self.counts)
        return int(np.argmax(means + bonus))

    def update(self, arm: int, reward: float) -> None:
        self.t += 1
        self.counts[arm] += 1
        self.sums[arm]   += reward


# ---- simulation ----
true_probs = np.array([0.35, 0.55, 0.78, 0.42, 0.60])
best_mu    = true_probs.max()

ucb = UCB(n_arms=5, c=2.0)
regret = []
cum = 0.0
for t in range(1, 2001):
    a = ucb.select_arm()
    r = float(np.random.rand() < true_probs[a])
    ucb.update(a, r)
    cum += best_mu - true_probs[a]
    regret.append(cum)

print(f"final regret  = {regret[-1]:.2f}")
print(f"pull dist     = {ucb.counts}")
print(f"best arm est  = {np.argmax(ucb.sums / np.maximum(1, ucb.counts))}")
# Regret tăng theo log(t) — đặc trưng của UCB`}
              </CodeBlock>

              <CodeBlock language="python" title="Thompson Sampling cho A/B/C test">
                {`import numpy as np

class ThompsonSampling:
    def __init__(self, n_arms: int):
        self.alpha = np.ones(n_arms)  # successes + 1
        self.beta  = np.ones(n_arms)  # failures  + 1

    def select_arm(self) -> int:
        samples = np.random.beta(self.alpha, self.beta)
        return int(np.argmax(samples))

    def update(self, arm: int, reward: float) -> None:
        if reward > 0:
            self.alpha[arm] += 1
        else:
            self.beta[arm]  += 1


# Shopee A/B/C test cho nút 'Mua ngay'
true_ctr = [0.10, 0.12, 0.09]
ts = ThompsonSampling(n_arms=3)
for user in range(10_000):
    arm = ts.select_arm()
    reward = 1 if np.random.rand() < true_ctr[arm] else 0
    ts.update(arm, reward)

    # Sau ~500 users: variant tốt nhất (B) nhận 80%+ traffic
    # Sau ~2000 users: converge gần như hoàn toàn về B
print(f"alpha = {ts.alpha}")
print(f"beta  = {ts.beta}")
print(f"est CTR = {ts.alpha / (ts.alpha + ts.beta)}")`}
              </CodeBlock>

              <CollapsibleDetail title="Tại sao UCB có regret O(log T)?">
                <p>
                  Ý tưởng: arm tối ưu <LaTeX>{"a^{*}"}</LaTeX> có mean{" "}
                  <LaTeX>{"\\mu^{*}"}</LaTeX>, arm khác có mean{" "}
                  <LaTeX>{"\\mu_a < \\mu^{*}"}</LaTeX>. Khi UCB chọn sai arm{" "}
                  <LaTeX>{"a"}</LaTeX>, hoặc (1) upper bound của a đã vượt{" "}
                  <LaTeX>{"\\mu^{*}"}</LaTeX> (trường hợp hiếm theo bất đẳng
                  thức Hoeffding), hoặc (2) số lượt kéo a còn quá ít khiến
                  bonus lớn. Phân tích của Auer–Cesa-Bianchi–Fischer (2002)
                  cho thấy mỗi suboptimal arm chỉ bị kéo nhiều nhất{" "}
                  <LaTeX>{"O(\\log T / \\Delta_a^{2})"}</LaTeX> lần, với{" "}
                  <LaTeX>{"\\Delta_a = \\mu^{*} - \\mu_a"}</LaTeX>. Tổng regret
                  là <LaTeX>{"O\\left(\\sum_a \\log T / \\Delta_a\\right)"}</LaTeX>{" "}
                  — sub-linear.
                </p>
                <p>
                  Lai–Robbins (1985) chứng minh cận dưới lý thuyết cũng là{" "}
                  <LaTeX>{"\\Omega(\\log T)"}</LaTeX> nên UCB đạt <em>order
                  optimal</em>. Thompson Sampling đạt cùng order nhưng constant
                  factor tốt hơn trên phần lớn benchmark (Chapelle &amp; Li 2011).
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Bayesian view: tại sao Beta là conjugate prior">
                <p>
                  Nếu reward là <LaTeX>{"r \\in \\{0, 1\\}"}</LaTeX> với xác
                  suất thành công <LaTeX>{"\\theta"}</LaTeX>, đó là phân phối
                  Bernoulli. Prior Beta cho <LaTeX>{"\\theta"}</LaTeX> có dạng{" "}
                  <LaTeX>{"p(\\theta) \\propto \\theta^{\\alpha-1}(1-\\theta)^{\\beta-1}"}</LaTeX>
                  . Sau khi quan sát 1 thành công, likelihood là{" "}
                  <LaTeX>{"\\theta"}</LaTeX>, posterior{" "}
                  <LaTeX>{"\\propto \\theta^{\\alpha}(1-\\theta)^{\\beta-1}"}</LaTeX>{" "}
                  — đúng là <LaTeX>{"\\text{Beta}(\\alpha+1, \\beta)"}</LaTeX>
                  . Đó là lý do update Thompson Sampling chỉ là{" "}
                  <code>α += 1</code> hoặc <code>β += 1</code> — không cần
                  tính tích phân.
                </p>
                <p>
                  Tính chất conjugate mở rộng cho Gaussian (prior Gaussian →
                  posterior Gaussian), Poisson (Gamma prior), multinomial
                  (Dirichlet prior). Đó là nền tảng toán học khiến Thompson
                  Sampling dễ triển khai trên nhiều loại reward khác nhau.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Ứng dụng thực tế của Bandit">
                <p>
                  <strong>News/feed ranking:</strong> Yahoo Front Page dùng
                  LinUCB (2010) chọn bài viết hiển thị → tăng CTR 12.5% so với
                  editorial baseline.
                </p>
                <p>
                  <strong>Ad selection:</strong> Google Ads dùng Thompson
                  Sampling để quyết định ad nào hiển thị — đặc biệt cho keyword
                  mới không đủ data cho ML lớn.
                </p>
                <p>
                  <strong>Clinical trials:</strong> "Adaptive clinical trials"
                  dùng Thompson Sampling: bệnh nhân được chia ngẫu nhiên lúc
                  đầu, sau đó nhánh điều trị hiệu quả hơn dần nhận nhiều bệnh
                  nhân hơn → ít bệnh nhân nhận điều trị tệ.
                </p>
                <p>
                  <strong>Recommendation:</strong> Spotify, TikTok, YouTube
                  dùng contextual bandit để mix giữa "content bạn chắc chắn
                  thích" và "content mới cần explore". Quá exploit → feed nhàm
                  chán; quá explore → user churn.
                </p>
                <p>
                  <strong>Reinforcement learning cơ bản:</strong> Bandit là
                  state-less RL. Thêm state + dynamics thì trở thành MDP; các
                  bài toán{" "}
                  <TopicLink slug="recommendation-systems">
                    recommendation
                  </TopicLink>{" "}
                  đa số được mô hình hoá như contextual bandit vì trạng thái
                  thay đổi quá nhanh để dùng full RL.
                </p>
              </CollapsibleDetail>

              <p>
                <strong>Khi nào KHÔNG dùng Bandit?</strong> Khi hành động của
                bạn <em>ảnh hưởng state</em> theo cách lâu dài (ví dụ mua
                hàng làm thay đổi preference user trong tương lai). Lúc đó
                cần full MDP và <TopicLink slug="q-learning">Q-learning</TopicLink>{" "}
                hoặc <TopicLink slug="policy-gradient">Policy Gradient</TopicLink>.
              </p>

              <p>
                <strong>Checklist chọn thuật toán:</strong> (1) Stationary,
                Bernoulli reward, context đơn giản → Thompson Sampling. (2)
                Theoretical guarantee cần thiết → UCB. (3) Cần cực kỳ đơn
                giản và prototype nhanh → ε-Greedy với ε giảm dần. (4) Có
                feature user → LinUCB hoặc Neural Contextual Bandit.
              </p>

              <p>
                <strong>Khác biệt mô phỏng phía trên với thực tế:</strong>{" "}
                trong demo, reward là Bernoulli stationary, bạn có thể reset
                tuỳ ý. Ở production Shopee/Netflix: (a) reward <em>non-stationary</em>,{" "}
                (b) phải tuân thủ constraint (fairness, diversity),{" "}
                (c) có <em>delay</em> giữa action và reward (user click rồi
                vài phút sau mới đọc),{" "}
                (d) phải log propensity để debias khi off-policy evaluation.
              </p>

              <p>
                <strong>Off-policy evaluation (OPE):</strong> khi muốn
                thử thuật toán mới mà không risk cho user, ta dùng dữ liệu đã
                log từ thuật toán cũ. Inverse Propensity Scoring (IPS) và
                Doubly Robust là hai kỹ thuật chuẩn — cho phép ước lượng
                "Thuật toán mới sẽ tốt thế nào?" chỉ từ log, không cần deploy.
                Đây là cầu nối giữa bandit và{" "}
                <TopicLink slug="supervised-unsupervised-rl">
                  supervised learning
                </TopicLink>
                .
              </p>

              <p>
                <strong>Công thức cần thuộc:</strong>{" "}
                (1) ε-Greedy chọn tốt nhất với xác suất 1−ε, random với xác
                suất ε. (2) UCB score = <LaTeX>{"\\hat{\\mu}_a + c\\sqrt{\\ln t / N_a}"}</LaTeX>
                . (3) Thompson sample từ{" "}
                <LaTeX>{"\\text{Beta}(\\alpha_a, \\beta_a)"}</LaTeX>. (4)
                Regret <LaTeX>{"R(T) = T\\mu^{*} - \\sum_t \\mu_{a_t}"}</LaTeX>.
                Bốn công thức này đủ cho 90% use-case thực tế.
              </p>

              <p>
                <strong>Gợi ý đọc thêm:</strong> "Bandit Algorithms" của Lattimore
                &amp; Szepesvári (miễn phí online) là bible cho lý thuyết. Về
                production, đọc paper LinUCB (Yahoo), BatchedBandits (Google),
                và Netflix tech blog về contextual bandit cho thumbnail
                personalization.
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Multi-Armed Bandit: bài toán cân bằng EXPLORE (thử arm mới) và EXPLOIT (dùng arm đã biết tốt nhất).",
                "3 chiến lược kinh điển: ε-Greedy (đơn giản), UCB (khai thác uncertainty), Thompson Sampling (Bayesian, thường mạnh nhất).",
                "Regret R(T) = T·μ* − Σ μ_{a_t} là thước đo chất lượng; UCB/TS đạt O(log T), ε-Greedy cố định chỉ O(T).",
                "Contextual bandit thêm feature vector — nền tảng recommendation hiện đại (Netflix, TikTok, YouTube).",
                "Bandit ≠ A/B test: Bandit adaptive, ít user bị ảnh hưởng bởi variant tệ → ethical + efficient hơn.",
                "Khi action làm thay đổi state dài hạn → không đủ, cần full RL (Q-learning, Policy Gradient).",
              ]}
            />
          </LessonSection>

          <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
            <QuizSection questions={quizQuestions} />
          </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
