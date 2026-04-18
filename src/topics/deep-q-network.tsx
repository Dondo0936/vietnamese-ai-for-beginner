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
  slug: "deep-q-network",
  title: "Deep Q-Network (DQN)",
  titleVi: "Mạng Q sâu",
  description:
    "Kết hợp Q-Learning với mạng nơ-ron sâu để xử lý không gian trạng thái lớn",
  category: "reinforcement-learning",
  tags: ["deep-rl", "atari", "experience-replay"],
  difficulty: "intermediate",
  relatedSlugs: ["q-learning", "actor-critic", "mlp"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;
const STEP_LABELS = [
  "Dự đoán",
  "Khám phá",
  "Khoảnh khắc Aha",
  "Thử thách",
  "Lý thuyết",
  "Tóm tắt",
  "Kiểm tra",
];

/* ──────────────────────────────────────────────────────────────────────────
 * GRID WORLD — 8×8 môi trường Atari-like
 * Cell có 4 loại: empty, goal, obstacle, start.
 * Agent thực hiện 4 action: up / right / down / left.
 * Q-table: mảng (64 cells × 4 actions) lưu ước lượng giá trị.
 * ──────────────────────────────────────────────────────────────────────── */

const GRID_SIZE = 8;
const NUM_ACTIONS = 4; // 0=up, 1=right, 2=down, 3=left
const ACTION_NAMES = ["↑", "→", "↓", "←"] as const;

type CellKind = "empty" | "goal" | "obstacle" | "start";

interface GridCell {
  kind: CellKind;
  x: number;
  y: number;
}

interface Transition {
  s: number;
  a: number;
  r: number;
  sNext: number;
  done: boolean;
}

// Bố cục cố định — chọn sao cho có ít nhất 1 đường đi qua.
const LAYOUT: CellKind[][] = [
  ["start", "empty", "empty", "obstacle", "empty", "empty", "empty", "empty"],
  ["empty", "obstacle", "empty", "empty", "empty", "obstacle", "empty", "empty"],
  ["empty", "obstacle", "empty", "obstacle", "empty", "obstacle", "empty", "empty"],
  ["empty", "empty", "empty", "obstacle", "empty", "empty", "empty", "obstacle"],
  ["obstacle", "obstacle", "empty", "empty", "empty", "obstacle", "empty", "empty"],
  ["empty", "empty", "empty", "obstacle", "empty", "empty", "empty", "empty"],
  ["empty", "obstacle", "obstacle", "empty", "obstacle", "obstacle", "obstacle", "empty"],
  ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "goal"],
];

function cellIndex(x: number, y: number): number {
  return y * GRID_SIZE + x;
}

function buildCells(): GridCell[] {
  const cells: GridCell[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      cells.push({ kind: LAYOUT[y][x], x, y });
    }
  }
  return cells;
}

const ALL_CELLS = buildCells();
const START_IDX = ALL_CELLS.findIndex((c) => c.kind === "start");
const GOAL_IDX = ALL_CELLS.findIndex((c) => c.kind === "goal");

/* ──────────────────────────────────────────────────────────────────────────
 * MDP DYNAMICS
 * ──────────────────────────────────────────────────────────────────────── */
function step(
  s: number,
  a: number,
): { sNext: number; r: number; done: boolean } {
  const cur = ALL_CELLS[s];
  let nx = cur.x;
  let ny = cur.y;
  if (a === 0) ny -= 1;
  if (a === 1) nx += 1;
  if (a === 2) ny += 1;
  if (a === 3) nx -= 1;

  // Va chạm biên: đứng yên, phạt nhẹ
  if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
    return { sNext: s, r: -1, done: false };
  }

  const nextIdx = cellIndex(nx, ny);
  const nextCell = ALL_CELLS[nextIdx];

  if (nextCell.kind === "obstacle") {
    return { sNext: s, r: -5, done: false };
  }
  if (nextCell.kind === "goal") {
    return { sNext: nextIdx, r: 20, done: true };
  }
  // Mỗi bước đi mất một chút năng lượng → khuyến khích đi nhanh
  return { sNext: nextIdx, r: -0.1, done: false };
}

/* ──────────────────────────────────────────────────────────────────────────
 * TABULAR Q-LEARNING (stand-in cho DQN) để trực quan hoá
 * Ta dùng Q-table thay vì mạng nơ-ron để người học nhìn thấy giá trị học.
 * Ý tưởng (replay, ε-greedy, target update) vẫn giữ nguyên.
 * ──────────────────────────────────────────────────────────────────────── */
const ALPHA = 0.2;
const GAMMA = 0.95;

interface AgentState {
  q: number[][]; // [64][4]
  buffer: Transition[];
  pos: number;
  epsilon: number;
  episode: number;
  totalSteps: number;
  lastReward: number;
  episodeReturn: number;
  sampledIndices: number[];
}

function initialAgent(): AgentState {
  const q: number[][] = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    q.push([0, 0, 0, 0]);
  }
  return {
    q,
    buffer: [],
    pos: START_IDX,
    epsilon: 0.9,
    episode: 0,
    totalSteps: 0,
    lastReward: 0,
    episodeReturn: 0,
    sampledIndices: [],
  };
}

// Pseudo-random tái lập để demo không giật.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return function rand(): number {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function selectAction(
  q: number[][],
  s: number,
  epsilon: number,
  rand: () => number,
): number {
  if (rand() < epsilon) {
    return Math.floor(rand() * NUM_ACTIONS);
  }
  const row = q[s];
  let best = 0;
  let bestVal = row[0];
  for (let i = 1; i < NUM_ACTIONS; i++) {
    if (row[i] > bestVal) {
      bestVal = row[i];
      best = i;
    }
  }
  return best;
}

const BUFFER_CAPACITY = 400;
const BATCH_SIZE = 16;

function doStep(state: AgentState, rand: () => number): AgentState {
  const a = selectAction(state.q, state.pos, state.epsilon, rand);
  const { sNext, r, done } = step(state.pos, a);

  const buffer = state.buffer.slice();
  buffer.push({ s: state.pos, a, r, sNext, done });
  if (buffer.length > BUFFER_CAPACITY) buffer.shift();

  // Cập nhật online bằng 1 bước TD (mô phỏng DQN-update đơn giản).
  const q = state.q.map((row) => row.slice());
  const maxNext = Math.max(...q[sNext]);
  const target = r + (done ? 0 : GAMMA * maxNext);
  q[state.pos][a] = q[state.pos][a] + ALPHA * (target - q[state.pos][a]);

  // Replay: lấy ngẫu nhiên BATCH_SIZE transitions (đủ điều kiện) để học lại.
  const sampled: number[] = [];
  if (buffer.length >= BATCH_SIZE) {
    const used = new Set<number>();
    while (sampled.length < BATCH_SIZE) {
      const idx = Math.floor(rand() * buffer.length);
      if (used.has(idx)) continue;
      used.add(idx);
      sampled.push(idx);
      const t = buffer[idx];
      const maxN = Math.max(...q[t.sNext]);
      const tgt = t.r + (t.done ? 0 : GAMMA * maxN);
      q[t.s][t.a] = q[t.s][t.a] + ALPHA * (tgt - q[t.s][t.a]);
    }
  }

  let pos = sNext;
  let episode = state.episode;
  let epsilon = state.epsilon;
  let episodeReturn = state.episodeReturn + r;
  if (done || state.totalSteps % 200 === 199) {
    pos = START_IDX;
    episode += 1;
    epsilon = Math.max(0.05, epsilon * 0.97);
    episodeReturn = 0;
  }

  return {
    q,
    buffer,
    pos,
    epsilon,
    episode,
    totalSteps: state.totalSteps + 1,
    lastReward: r,
    episodeReturn,
    sampledIndices: sampled,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * GRID VIEW — heatmap Q-values (V(s) = max_a Q(s,a))
 * ──────────────────────────────────────────────────────────────────────── */
interface GridViewProps {
  agent: AgentState;
  size: number;
}

function GridView({ agent, size }: GridViewProps) {
  const cell = size / GRID_SIZE;
  const values: number[] = agent.q.map((row) => Math.max(...row));
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const span = vMax - vMin || 1;

  const posCell = ALL_CELLS[agent.pos];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[420px] mx-auto"
      role="img"
      aria-label="Grid world với Q-value heatmap"
    >
      {/* background */}
      <rect x={0} y={0} width={size} height={size} rx={8} fill="#0f172a" />
      {/* cells */}
      {ALL_CELLS.map((c, i) => {
        const v = (values[i] - vMin) / span;
        let fill = "#1e293b";
        if (c.kind === "obstacle") fill = "#7f1d1d";
        else if (c.kind === "goal") fill = "#166534";
        else {
          const green = Math.round(30 + v * 120);
          const blue = Math.round(60 + v * 80);
          fill = `rgb(${30}, ${green}, ${blue})`;
        }
        const x = c.x * cell;
        const y = c.y * cell;
        return (
          <g key={i}>
            <rect
              x={x + 1}
              y={y + 1}
              width={cell - 2}
              height={cell - 2}
              rx={3}
              fill={fill}
              stroke="#0f172a"
            />
            {c.kind === "empty" && (
              <text
                x={x + cell / 2}
                y={y + cell / 2 + 3}
                fill="#e2e8f0"
                fontSize={8}
                textAnchor="middle"
                opacity={0.6}
              >
                {values[i].toFixed(1)}
              </text>
            )}
            {c.kind === "goal" && (
              <text
                x={x + cell / 2}
                y={y + cell / 2 + 3}
                fill="#bbf7d0"
                fontSize={10}
                textAnchor="middle"
                fontWeight="bold"
              >
                G
              </text>
            )}
          </g>
        );
      })}
      {/* mũi tên policy: vẽ action tốt nhất tại mỗi ô trống */}
      {ALL_CELLS.map((c, i) => {
        if (c.kind !== "empty" && c.kind !== "start") return null;
        const row = agent.q[i];
        const best = row.indexOf(Math.max(...row));
        const x = c.x * cell + cell / 2;
        const y = c.y * cell + cell / 2 - 10;
        if (Math.max(...row) === 0) return null;
        return (
          <text
            key={`a-${i}`}
            x={x}
            y={y}
            fill="#fde68a"
            fontSize={10}
            textAnchor="middle"
            opacity={0.85}
          >
            {ACTION_NAMES[best]}
          </text>
        );
      })}
      {/* agent */}
      <motion.circle
        cx={posCell.x * cell + cell / 2}
        cy={posCell.y * cell + cell / 2}
        r={cell / 3.2}
        fill="#3b82f6"
        stroke="#93c5fd"
        strokeWidth={2}
        animate={{
          cx: posCell.x * cell + cell / 2,
          cy: posCell.y * cell + cell / 2,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * REPLAY BUFFER VIEW — mỗi transition là 1 ô; chấm màu cho phần vừa sample
 * ──────────────────────────────────────────────────────────────────────── */
interface BufferViewProps {
  agent: AgentState;
  width: number;
}

function BufferView({ agent, width }: BufferViewProps) {
  const cols = 40;
  const rows = Math.ceil(BUFFER_CAPACITY / cols);
  const cellW = width / cols;
  const cellH = 10;
  const height = rows * cellH + 24;

  const sampled = new Set(agent.sampledIndices);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-3xl mx-auto"
      role="img"
      aria-label="Replay buffer visualization"
    >
      <text x={4} y={12} fill="#94a3b8" fontSize={10}>
        Replay buffer — {agent.buffer.length}/{BUFFER_CAPACITY} transitions (ô
        vàng = vừa được sample cho batch)
      </text>
      {Array.from({ length: BUFFER_CAPACITY }, (_, i) => {
        const hasData = i < agent.buffer.length;
        const isSampled = sampled.has(i);
        const cx = (i % cols) * cellW;
        const cy = Math.floor(i / cols) * cellH + 18;
        const fill = !hasData
          ? "#1e293b"
          : isSampled
          ? "#facc15"
          : agent.buffer[i].done
          ? "#22c55e"
          : agent.buffer[i].r < -1
          ? "#ef4444"
          : "#38bdf8";
        return (
          <rect
            key={i}
            x={cx + 0.5}
            y={cy + 0.5}
            width={cellW - 1}
            height={cellH - 1}
            rx={2}
            fill={fill}
            opacity={hasData ? 0.9 : 0.3}
          />
        );
      })}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * MAIN TOPIC
 * ──────────────────────────────────────────────────────────────────────── */
export default function DeepQNetworkTopic() {
  const [agent, setAgent] = useState<AgentState>(initialAgent);
  const [seed, setSeed] = useState<number>(271828);

  const rand = useMemo(() => lcg(seed), [seed]);

  const handleStep = useCallback(() => {
    setAgent((cur) => doStep(cur, rand));
  }, [rand]);

  const handleStep10 = useCallback(() => {
    setAgent((cur) => {
      let next = cur;
      for (let i = 0; i < 10; i++) next = doStep(next, rand);
      return next;
    });
  }, [rand]);

  const handleStep100 = useCallback(() => {
    setAgent((cur) => {
      let next = cur;
      for (let i = 0; i < 100; i++) next = doStep(next, rand);
      return next;
    });
  }, [rand]);

  const handleReset = useCallback(() => {
    setAgent(initialAgent());
    setSeed((s) => (s * 1103515245 + 12345) >>> 0);
  }, []);

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "DQN khác Q-Learning cổ điển ở điểm cốt lõi nào nhất?",
        options: [
          "DQN chạy trên GPU còn Q-Learning chạy trên CPU",
          "DQN thay Q-table bằng một neural network Q(s, a; θ), cho phép tổng quát hoá giữa các state tương tự và xử lý state rất lớn (pixel)",
          "DQN không cần epsilon-greedy, chỉ cần softmax",
        ],
        correct: 1,
        explanation:
          "Q-table chỉ dùng được khi số state hữu hạn và đủ nhỏ. DQN thay bằng mạng nơ-ron: input là state thô (VD 4 frame ảnh 84×84), output là Q-values cho mỗi action. Network tự tổng quát hoá giữa state tương tự, mở đường cho RL chiều cao.",
      },
      {
        question:
          "Experience Replay giải quyết vấn đề chính nào trong off-policy deep RL?",
        options: [
          "Giảm bộ nhớ GPU",
          "Phá bỏ tương quan thời gian giữa các sample liên tiếp; biến stream online thành mini-batch gần i.i.d., ổn định gradient",
          "Giúp network học cả action chưa gặp",
        ],
        correct: 1,
        explanation:
          "Transitions liên tiếp trong một episode rất tương quan (s₁→s₂→s₃). Train trực tiếp sẽ làm gradient lệch. Replay buffer lưu ~1M transitions, mini-batch 32 được sample ngẫu nhiên → phân phối data đa dạng, gần i.i.d., training ổn định.",
      },
      {
        question:
          "Target network trong DQN có vai trò gì?",
        options: [
          "Tăng tốc inference",
          "Là bản sao đóng băng của Q-network để tính target y = r + γ·max Q(s′, a′; θ⁻); tránh 'moving target' khi online net đang thay đổi",
          "Giảm bộ nhớ vì dùng float16",
        ],
        correct: 1,
        explanation:
          "Không có target network: tham số trong target thay đổi cùng online → target chạy theo prediction, training dao động. Target net: copy đóng băng, cập nhật mỗi C = 10K bước (hoặc soft-update τ = 0.005) → target ổn định, Bellman update hội tụ tốt hơn.",
      },
      {
        question:
          "Double DQN (van Hasselt 2016) sửa chữa điều gì ở DQN gốc?",
        options: [
          "Tốc độ chậm",
          "DQN có bias 'overestimation' do max trong cùng một network; Double DQN dùng online-net chọn action và target-net đánh giá giá trị → giảm overestimation",
          "Vấn đề bộ nhớ",
        ],
        correct: 1,
        explanation:
          "Công thức DQN: y = r + γ·max_a' Q_target(s', a'). Toán tử max trên cùng ước lượng gây positive bias. Double DQN: a* = argmax Q_online(s', a'); y = r + γ · Q_target(s', a*). Thí nghiệm Atari giảm overestimation 30–50%, policy cải thiện.",
      },
      {
        question:
          "Dueling DQN tách Q(s, a) thành hai nhánh gì?",
        options: [
          "Policy và Value",
          "Value V(s) và Advantage A(s, a), sau đó kết hợp Q(s, a) = V(s) + (A(s, a) − mean_a A(s, a))",
          "Reward và discount",
        ],
        correct: 1,
        explanation:
          "Dueling kiến trúc: một nhánh xuất V(s) (giá trị state), nhánh kia xuất A(s,a) (lợi thế tương đối của mỗi action). Trung hoá bằng việc trừ mean_a giúp identifiability. Lợi ích: học nhanh với state mà action ít quan trọng.",
      },
      {
        type: "fill-blank",
        question:
          "DQN ổn định nhờ hai đổi mới kinh điển: {blank} network (bản sao đóng băng để tính target Q) và {blank} buffer (lưu transitions rồi sample ngẫu nhiên để phá correlation).",
        blanks: [
          { answer: "target", accept: ["muc tieu", "mục tiêu"] },
          {
            answer: "replay",
            accept: ["experience replay", "experience-replay", "replay buffer"],
          },
        ],
        explanation:
          "Target network giải quyết moving-target problem khi bootstrap TD; replay buffer phá tương quan thời gian và tăng hiệu quả sample (tái sử dụng transitions cũ).",
      },
      {
        question:
          "Prioritized Experience Replay (Schaul et al. 2016) thay đổi gì?",
        options: [
          "Lấy mẫu đều như cũ nhưng nhanh hơn",
          "Sample transitions với xác suất tỷ lệ với |TD error|^α, dùng importance-sampling weights để khử bias — học nhanh hơn trên những transitions quan trọng",
          "Dùng beta distribution thay vì uniform",
        ],
        correct: 1,
        explanation:
          "Transitions có TD-error lớn chứa nhiều thông tin mới. PER ưu tiên chúng. Công thức: p_i = (|δ_i| + ε)^α; sample P(i) = p_i / Σp. Vì không uniform, cần IS weight w_i = (1/(N·P(i)))^β để giữ kỳ vọng gradient đúng. β được anneal 0.4 → 1.",
      },
      {
        question:
          "Atari DQN của DeepMind (2015) preprocess input thế nào trước khi đưa vào CNN?",
        options: [
          "Giữ nguyên 210×160 RGB",
          "Scale về grayscale, resize 84×84, stack 4 frame gần nhất → input (4, 84, 84); frame-skipping mỗi 4 frame; reward clipping ±1",
          "Downsample về 42×42 RGB",
        ],
        correct: 1,
        explanation:
          "Để có tín hiệu chuyển động (không thiếu thông tin thời gian), stack 4 frame. Resize 84×84 giảm cost CNN. Grayscale vì màu không cần cho hầu hết game. Reward clip ±1 đồng bộ scale gradient giữa các game. Tổng số params ≈ 1.7M.",
      },
    ],
    [],
  );

  return (
    <>
      <div className="mb-4">
        <ProgressSteps current={1} total={TOTAL_STEPS} labels={STEP_LABELS} />
      </div>

      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Atari game Breakout có frame 210×160×3 pixels ≈ 100K giá trị mỗi ảnh. Nếu lưu Q-table cho toàn bộ state khả dĩ thì cần bao nhiêu entries?"
          options={[
            "100,000 — bằng số pixel",
            "256^100000 — một số lớn không thể lưu nổi; do đó Q-table không khả thi và cần neural network để tổng quát hoá",
            "1 triệu (khoảng 10⁶)",
          ]}
          correct={1}
          explanation="Mỗi pixel ∈ {0,...,255} → mỗi state có 256^100000 giá trị khả dĩ. Dù giảm grayscale + 84×84 vẫn là 256^7056 — bất khả thi. DQN dùng CNN để 'học' hàm Q(s, a) thay vì lưu bảng, và chia sẻ tham số giữa state tương tự."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <p className="mb-4 text-sm text-muted leading-relaxed">
              Môi trường <strong>8×8 grid</strong> mô phỏng Atari thu nhỏ. Agent
              (chấm xanh) xuất phát từ góc trên-trái, tìm đường đến ô G (góc
              dưới-phải) trong khi tránh các ô đỏ (obstacle). Mỗi bước đi mất
              −0.1 năng lượng, va chạm vật cản −5, tới đích +20. Ban đầu agent
              đi ngẫu nhiên (ε=0.9). Kéo thanh nút để chạy thí nghiệm.
            </p>

            <VisualizationSection>
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
                  <GridView agent={agent} size={420} />

                  <div className="space-y-3">
                    <div className="rounded-lg border border-border bg-card p-4 space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Episode</span>
                        <span className="font-mono text-foreground">
                          {agent.episode}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Tổng bước</span>
                        <span className="font-mono text-foreground">
                          {agent.totalSteps}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted">ε (exploration)</span>
                        <span className="font-mono text-foreground">
                          {agent.epsilon.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Reward gần nhất</span>
                        <span className="font-mono text-foreground">
                          {agent.lastReward.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Return episode</span>
                        <span className="font-mono text-foreground">
                          {agent.episodeReturn.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Buffer</span>
                        <span className="font-mono text-foreground">
                          {agent.buffer.length}/{BUFFER_CAPACITY}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleStep}
                        className="rounded-md border border-border bg-card hover:bg-surface px-3 py-2 text-sm font-medium transition-colors"
                      >
                        Bước +1
                      </button>
                      <button
                        type="button"
                        onClick={handleStep10}
                        className="rounded-md border border-border bg-card hover:bg-surface px-3 py-2 text-sm font-medium transition-colors"
                      >
                        Bước +10
                      </button>
                      <button
                        type="button"
                        onClick={handleStep100}
                        className="rounded-md border border-accent bg-accent-light hover:bg-accent/20 px-3 py-2 text-sm font-medium transition-colors text-accent-dark"
                      >
                        Bước +100
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-md border border-border bg-card hover:bg-surface px-3 py-2 text-sm font-medium transition-colors"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted leading-relaxed">
                      <p>
                        <span className="inline-block w-3 h-3 bg-green-600 rounded align-middle mr-1.5" />
                        Ô đích (+20 reward){" "}
                        <span className="inline-block w-3 h-3 bg-red-900 rounded align-middle ml-3 mr-1.5" />
                        Vật cản (−5){" "}
                        <span className="inline-block w-3 h-3 bg-blue-500 rounded-full align-middle ml-3 mr-1.5" />
                        Agent
                      </p>
                      <p className="mt-1">
                        Ô càng sáng = V(s) = max<sub>a</sub> Q(s, a) càng cao;
                        mũi tên vàng = action tốt nhất đã học.
                      </p>
                    </div>
                  </div>
                </div>

                <BufferView agent={agent} width={640} />

                <div className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed">
                  <p className="text-muted">
                    Mỗi bước, agent: (1) chọn action bằng ε-greedy dựa trên Q
                    hiện tại, (2) đẩy transition (s, a, r, s′, done) vào replay
                    buffer, (3) sample mini-batch {BATCH_SIZE} transitions
                    ngẫu nhiên và cập nhật Q theo Bellman:
                  </p>
                  <LaTeX block>
                    {"Q(s, a) \\leftarrow Q(s, a) + \\alpha\\,\\big(r + \\gamma\\,\\max_{a'} Q(s', a') - Q(s, a)\\big)"}
                  </LaTeX>
                  <p className="text-muted mt-2">
                    Ở DQN thực, Q là một neural network; ở đây ta dùng Q-table
                    để dễ nhìn, nhưng cơ chế (replay + TD target) y hệt. Càng
                    chạy nhiều bước, ô gần đích sẽ sáng lên trước, rồi "lan" về
                    phía xuất phát — đó là quá trình giá trị được{" "}
                    <em>backup</em> ngược qua phương trình Bellman.
                  </p>
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection
            step={3}
            totalSteps={TOTAL_STEPS}
            label="Khoảnh khắc Aha"
          >
            <AhaMoment>
              <p>
                DQN = Q-Learning + mạng nơ-ron sâu + 2 mẹo quyết định:{" "}
                <strong>Experience Replay</strong> và{" "}
                <strong>Target Network</strong>. Ba thành phần này không mới
                riêng lẻ, nhưng kết hợp lại biến RL từ một đề tài thí nghiệm
                nhỏ thành hệ thống đánh bại con người trên 49 trò Atari (Mnih
                et al., Nature 2015). Đây là "AlexNet moment" của RL — mở ra
                kỷ nguyên Deep Reinforcement Learning.
              </p>
            </AhaMoment>

            <Callout variant="insight" title="Vì sao hai mẹo nhỏ lại đổi luật chơi">
              Trước 2013, người ta biết phối hợp Q-learning với neural
              network (Riedmiller 2005, Neural Fitted Q) nhưng training rất
              không ổn định. DeepMind thêm đúng hai kỹ thuật — replay tái sử
              dụng data và target network tách biệt — và hội tụ trở nên ổn
              định cho CNN lớn. Bài học: đôi khi đột phá không phải ở kiến
              trúc mới, mà ở cách ổn định hoá quá trình học.
            </Callout>
          </LessonSection>

          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <InlineChallenge
              question="Replay buffer của bạn chứa 1M transitions. Mỗi bước train trên một mini-batch 32 transitions được sample ngẫu nhiên. Vì sao dùng random thay vì lấy 32 bước mới nhất?"
              options={[
                "Random nhanh hơn vì tránh lock trên queue",
                "32 bước mới nhất rất tương quan (cùng episode) → gradient lệch, network overfit trải nghiệm gần đây, quên kinh nghiệm cũ. Random sampling giữ phân phối đa dạng, gần i.i.d.",
                "Không có lý do rõ ràng",
              ]}
              correct={1}
              explanation="Data từ 1 episode cực kỳ tương quan (agent đi 1 quỹ đạo). Train trực tiếp → bias về experience gần, catastrophic forgetting. Random sampling: mỗi batch có transitions đa dạng từ nhiều episode → gradient ổn định, học đều; đồng thời mỗi transition được tái sử dụng nhiều lần → sample-efficient."
            />

            <div className="mt-4">
              <InlineChallenge
                question="Bạn thấy Q-values tăng không kiểm soát (explode) sau ~1M steps. Diagnosis và fix?"
                options={[
                  "Giảm learning rate là đủ",
                  "Nhiều khả năng là thiếu target network hoặc cập nhật target quá thường xuyên → moving target + max bias. Fix: thêm target network cập nhật mỗi C=10K bước, hoặc soft-update τ=0.005; cân nhắc Double DQN để giảm overestimation",
                  "Chuyển sang Monte Carlo",
                ]}
                correct={1}
                explanation="Q explode là triệu chứng kinh điển của moving target kết hợp max bias. Luôn kiểm tra: (1) có target network chưa? (2) C đủ lớn chưa? (3) reward clip? (4) thử Double DQN — trong nhiều game giảm Q value trung bình xuống 30–50% và cải thiện policy."
              />
            </div>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection>
              <p>
                <strong>Deep Q-Network (DQN)</strong> xấp xỉ hàm action-value
                Q(s, a) bằng neural network Q(s, a; θ). Training tối thiểu hoá
                loss Bellman theo target bootstrap:
              </p>
              <LaTeX block>
                {"\\mathcal{L}(\\theta) = \\mathbb{E}_{(s, a, r, s') \\sim \\mathcal{D}}\\left[\\left(r + \\gamma \\max_{a'} Q(s', a'; \\theta^-) - Q(s, a; \\theta)\\right)^2\\right]"}
              </LaTeX>
              <p>
                Ở đây <LaTeX>{"\\theta^-"}</LaTeX> là tham số target
                network (bản sao đóng băng), <LaTeX>{"\\mathcal{D}"}</LaTeX>{" "}
                là replay buffer. Gradient:
              </p>
              <LaTeX block>
                {"\\nabla_\\theta \\mathcal{L} = -\\mathbb{E}\\left[\\delta \\cdot \\nabla_\\theta Q(s, a; \\theta)\\right], \\quad \\delta = r + \\gamma \\max_{a'} Q(s', a'; \\theta^-) - Q(s, a; \\theta)"}
              </LaTeX>

              <p className="mt-3">
                <strong>Ba thành phần ổn định training:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-sm pl-2">
                <li>
                  <strong>Experience Replay</strong>: buffer cỡ 10⁵–10⁶ lưu
                  transitions; mỗi bước sample mini-batch 32 i.i.d. Ưu điểm:
                  (i) phá tương quan, (ii) tái sử dụng data, (iii) cho phép
                  off-policy update.
                </li>
                <li>
                  <strong>Target Network</strong>: θ⁻ chỉ copy từ θ mỗi C
                  (10K) bước (hard-update) hoặc soft-update{" "}
                  <LaTeX>{"\\theta^- \\leftarrow \\tau \\theta + (1-\\tau) \\theta^-"}</LaTeX>
                  với τ = 0.005. Tránh "moving target".
                </li>
                <li>
                  <strong>Reward clipping</strong>: cắt r về ±1 để gradient có
                  cùng scale giữa các game.
                </li>
              </ol>

              <p className="mt-3">
                <strong>ε-greedy exploration schedule</strong>. Thường khởi ε
                = 1.0, anneal tuyến tính xuống 0.1 trong 1M bước đầu, giữ 0.1
                trong testing. Công thức:
              </p>
              <LaTeX block>
                {"\\varepsilon_t = \\max\\left(\\varepsilon_{\\min}, \\varepsilon_0 - \\frac{t}{T_{\\text{anneal}}}\\right)"}
              </LaTeX>

              <Callout variant="tip" title="Double DQN — sửa overestimation">
                DQN overestimate Q do toán tử max trên cùng một estimator bị
                noise. Double DQN (van Hasselt 2016): dùng online net để{" "}
                <em>chọn</em> action, dùng target net để <em>đánh giá</em>.
                Target mới:{" "}
                <LaTeX>{"y = r + \\gamma\\, Q\\big(s', \\arg\\max_{a'} Q(s', a'; \\theta); \\theta^-\\big)"}</LaTeX>
                . Thay đổi tối thiểu, gain rõ rệt.
              </Callout>

              <Callout variant="info" title="Dueling DQN — tách Value và Advantage">
                Kiến trúc hai nhánh: một nhánh xuất V(s), một nhánh xuất
                A(s, a). Kết hợp:{" "}
                <LaTeX>{"Q(s, a) = V(s) + \\left(A(s, a) - \\tfrac{1}{|\\mathcal{A}|}\\sum_{a'} A(s, a')\\right)"}</LaTeX>
                . Tách trung hoá giúp identifiability. Đặc biệt hiệu quả khi
                nhiều action có Q gần bằng nhau.
              </Callout>

              <Callout variant="warning" title="Những nơi DQN không phù hợp">
                DQN giả định action space rời rạc và nhỏ. Không dùng được cho
                tay robot điều khiển liên tục (cần DDPG/SAC/TD3). DQN cũng yêu
                cầu buffer lớn → memory có thể là bottleneck (1M frames ≈ vài
                GB RAM sau nén). Với partial observability nặng, cần thêm
                recurrent (DRQN) hoặc transformer.
              </Callout>

              <CodeBlock language="python" title="DQN minimal với PyTorch">
                {`import random
from collections import deque
from dataclasses import dataclass
from typing import Deque

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np


@dataclass
class Transition:
    s: np.ndarray
    a: int
    r: float
    s_next: np.ndarray
    done: bool


class QNet(nn.Module):
    """MLP Q-network cho state vector nhỏ; đổi thành CNN cho Atari."""

    def __init__(self, state_dim: int, n_actions: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 128), nn.ReLU(),
            nn.Linear(128, 128), nn.ReLU(),
            nn.Linear(128, n_actions),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # (B, state_dim) → (B, A)
        return self.net(x)


class ReplayBuffer:
    """Uniform replay buffer — FIFO deque."""

    def __init__(self, capacity: int = 100_000):
        self.buf: Deque[Transition] = deque(maxlen=capacity)

    def push(self, t: Transition) -> None:
        self.buf.append(t)

    def sample(self, batch_size: int) -> list[Transition]:
        return random.sample(self.buf, batch_size)

    def __len__(self) -> int:
        return len(self.buf)


def train_step(
    online: QNet,
    target: QNet,
    opt: torch.optim.Optimizer,
    batch: list[Transition],
    gamma: float = 0.99,
) -> float:
    """Một bước TD-error: minibatch → L2 loss → backward."""
    s = torch.as_tensor(np.stack([t.s for t in batch]), dtype=torch.float32)
    a = torch.as_tensor([t.a for t in batch], dtype=torch.long).unsqueeze(1)
    r = torch.as_tensor([t.r for t in batch], dtype=torch.float32)
    s_next = torch.as_tensor(np.stack([t.s_next for t in batch]), dtype=torch.float32)
    done = torch.as_tensor([t.done for t in batch], dtype=torch.float32)

    # Q(s, a) từ online net
    q_sa = online(s).gather(1, a).squeeze(1)

    # Target: r + gamma * max_a' Q_target(s', a')
    with torch.no_grad():
        max_q_next = target(s_next).max(dim=1).values
        y = r + gamma * max_q_next * (1 - done)

    loss = F.smooth_l1_loss(q_sa, y)  # Huber cho ổn định
    opt.zero_grad()
    loss.backward()
    torch.nn.utils.clip_grad_norm_(online.parameters(), max_norm=10.0)
    opt.step()
    return float(loss.item())


def select_action(q: QNet, s: np.ndarray, eps: float, n_actions: int) -> int:
    if random.random() < eps:
        return random.randrange(n_actions)
    with torch.no_grad():
        qv = q(torch.as_tensor(s, dtype=torch.float32).unsqueeze(0))
    return int(qv.argmax(dim=1).item())`}
              </CodeBlock>

              <CodeBlock
                language="python"
                title="Vòng training DQN đầy đủ với target update & ε-anneal"
              >
                {`import gymnasium as gym
import numpy as np
import torch


def run_dqn(
    env_name: str = "CartPole-v1",
    total_steps: int = 200_000,
    batch_size: int = 64,
    buffer_capacity: int = 50_000,
    gamma: float = 0.99,
    lr: float = 1e-3,
    target_update_every: int = 500,
    eps_start: float = 1.0,
    eps_end: float = 0.05,
    eps_decay_steps: int = 50_000,
    warmup: int = 1_000,
    seed: int = 0,
) -> QNet:
    env = gym.make(env_name)
    state_dim = env.observation_space.shape[0]
    n_actions = env.action_space.n

    online = QNet(state_dim, n_actions)
    target = QNet(state_dim, n_actions)
    target.load_state_dict(online.state_dict())
    for p in target.parameters():
        p.requires_grad = False

    opt = torch.optim.Adam(online.parameters(), lr=lr)
    buf = ReplayBuffer(capacity=buffer_capacity)

    s, _ = env.reset(seed=seed)
    episode_return = 0.0
    log = []
    for t in range(total_steps):
        eps = max(
            eps_end,
            eps_start - (eps_start - eps_end) * (t / eps_decay_steps),
        )
        a = select_action(online, s, eps, n_actions)
        s_next, r, terminated, truncated, _ = env.step(a)
        done = terminated or truncated
        buf.push(Transition(s, a, float(r), s_next, bool(done)))
        s = s_next
        episode_return += r

        if len(buf) >= max(batch_size, warmup):
            batch = buf.sample(batch_size)
            loss = train_step(online, target, opt, batch, gamma=gamma)
        else:
            loss = 0.0

        if t % target_update_every == 0 and t > 0:
            # Hard update: copy toàn bộ trọng số
            target.load_state_dict(online.state_dict())

        if done:
            log.append(episode_return)
            episode_return = 0.0
            s, _ = env.reset()
            if len(log) % 20 == 0:
                print(
                    f"step={t:>7d} | eps={eps:.2f} | "
                    f"return(20 ep mean)={np.mean(log[-20:]):.1f}"
                )

    env.close()
    return online


if __name__ == "__main__":
    _ = run_dqn()
    # CartPole-v1 thường đạt return ~500 (max) sau ~50K–100K steps.`}
              </CodeBlock>

              <p className="mt-3">
                <strong>Các biến thể hiện đại của DQN.</strong> Rainbow DQN
                (Hessel et al. 2018) tổng hợp 6 cải tiến vào một agent:
                Double DQN, Dueling, Prioritized Replay, Multi-step learning,
                Distributional RL (C51), Noisy Networks. Kết quả trên Atari
                Suite: median human-normalized score cao gấp đôi DQN gốc.
              </p>

              <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                <li>
                  <strong>Double DQN</strong>: sửa overestimation.
                </li>
                <li>
                  <strong>Dueling DQN</strong>: tách V/A.
                </li>
                <li>
                  <strong>Prioritized Experience Replay</strong>: sample theo
                  |TD-error|.
                </li>
                <li>
                  <strong>Multi-step (n-step) returns</strong>: target dùng
                  n-step thay vì 1-step để giảm bias ở early training.
                </li>
                <li>
                  <strong>C51 / Distributional</strong>: học phân phối reward
                  thay vì kỳ vọng — thêm tín hiệu cho network.
                </li>
                <li>
                  <strong>Noisy Networks</strong>: thêm noise vào weights thay
                  vì ε-greedy — exploration theo state.
                </li>
                <li>
                  <strong>Implicit Quantile Networks (IQN)</strong>: mở rộng
                  C51 với quantile regression.
                </li>
              </ul>

              <CollapsibleDetail title="Chứng minh sơ lược: vì sao target network giúp ổn định">
                <div className="space-y-2 text-sm">
                  <p>
                    Fitted Q-Iteration cổ điển (Riedmiller 2005) xem mỗi lần
                    cập nhật là một phép regress: với target y<sub>i</sub> = r
                    <sub>i</sub> + γ·max Q(s′<sub>i</sub>, a′; θ<sub>old</sub>),
                    huấn luyện θ<sub>new</sub> ← argmin Σ(Q(s<sub>i</sub>, a
                    <sub>i</sub>; θ) − y<sub>i</sub>)². Nếu giữ θ<sub>old</sub>{" "}
                    cố định trong một số bước, bài toán trở thành regression
                    tĩnh với target cố định → hội tụ như supervised learning.
                  </p>
                  <p>
                    DQN "gần đúng" chiến lược này bằng target network cập nhật
                    mỗi C bước. Nếu C quá nhỏ, ta gần với TD online (θ<sub>-</sub>{" "}
                    = θ) — moving target, dao động. Nếu C quá lớn, target lỗi
                    thời → học chậm. Thực nghiệm: C = 10K bước là sweet spot
                    cho Atari.
                  </p>
                  <p>
                    Soft-update (Lillicrap et al. 2016, DDPG) là biến thể:{" "}
                    θ<sub>-</sub> ← τθ + (1 − τ)θ<sub>-</sub> mỗi bước với τ ≈
                    0.005. Ưu điểm: smoother, thường ổn định hơn hard update
                    cho continuous control.
                  </p>
                </div>
              </CollapsibleDetail>

              <CollapsibleDetail title="Các lỗi thường gặp khi implement DQN">
                <div className="space-y-2 text-sm">
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>
                      <strong>Quên no_grad trên target</strong>: target net
                      vẫn tính gradient → memory leak và học sai.
                    </li>
                    <li>
                      <strong>Sample từ buffer trống</strong>: gọi sample khi
                      len(buf) &lt; batch_size → crash; dùng warmup steps.
                    </li>
                    <li>
                      <strong>Không normalise state</strong>: pixel 0–255 hoặc
                      feature không cùng scale → gradient bất ổn.
                    </li>
                    <li>
                      <strong>Target update quá thường xuyên</strong>: C quá
                      nhỏ → oscillation. Quá lớn → hội tụ chậm.
                    </li>
                    <li>
                      <strong>Reward không clip</strong>: game có reward rất
                      lớn (Frostbite +200) → Q values explode.
                    </li>
                    <li>
                      <strong>ε decay quá nhanh</strong>: agent chưa đủ explore
                      → mắc kẹt local policy.
                    </li>
                    <li>
                      <strong>Buffer quá nhỏ</strong>: correlation vẫn cao,
                      training dao động.
                    </li>
                    <li>
                      <strong>Không gradient clip</strong>: TD error có thể
                      rất lớn ở early training → exploding gradient.
                    </li>
                    <li>
                      <strong>Dùng MSE thay vì Huber</strong>: outlier lớn (do
                      bootstrap) làm loss nổ.
                    </li>
                    <li>
                      <strong>Không track running returns</strong>: khó biết
                      agent có tiến bộ không — luôn log return trung bình 100
                      episode gần nhất.
                    </li>
                  </ul>
                </div>
              </CollapsibleDetail>

              <p className="mt-4">
                DQN là nền tảng để bước sang{" "}
                <TopicLink slug="actor-critic">Actor-Critic</TopicLink> và
                policy gradient cho không gian action liên tục. Ôn lại nền
                tảng ở{" "}
                <TopicLink slug="q-learning">Q-Learning</TopicLink> và{" "}
                <TopicLink slug="mlp">MLP</TopicLink> nếu cần.
              </p>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
                <p className="font-semibold text-foreground">
                  Bảng hyperparameter tham khảo (Atari DQN, Mnih 2015)
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Buffer capacity: 1,000,000 transitions (≈ 4–8 GB RAM)</li>
                  <li>Batch size: 32</li>
                  <li>
                    Target update: mỗi 10,000 gradient steps (hard update)
                  </li>
                  <li>
                    Discount γ: 0.99 — ưu tiên reward dài hạn, ngưỡng ổn định
                  </li>
                  <li>
                    Optimizer: RMSProp (lr 2.5e-4, momentum 0.95) — hoặc Adam
                    với lr 1e-4 cho implementation hiện đại
                  </li>
                  <li>
                    ε schedule: 1.0 → 0.1 trong 1M bước; eval với ε = 0.05
                  </li>
                  <li>Frame-skip: 4 (agent quan sát mỗi 4 frame)</li>
                  <li>Frame-stack: 4 (input CNN = [4, 84, 84])</li>
                  <li>Reward clip: sign(r) ∈ {"{"}−1, 0, +1{"}"}</li>
                  <li>Gradient clip: norm ≤ 10</li>
                  <li>Warm-up: 50,000 bước thuần random trước khi học</li>
                  <li>Tổng bước training: ~50M frames (~200M steps)</li>
                </ul>
                <p className="text-muted text-xs mt-2">
                  Một ghi chú thực tế: training DQN trên Atari cần 1–2 tuần
                  GPU đơn thời 2015. Với TPU/multi-GPU ngày nay, Rainbow có
                  thể hoàn thành trong vài giờ — nhưng pipeline cơ bản vẫn
                  giống hệt.
                </p>
              </div>

              <p className="mt-3">
                <strong>Tại sao off-policy lại quan trọng?</strong> DQN có
                thể học từ transitions được sinh ra bởi policy cũ hoặc cả
                policy ngẫu nhiên. Điều này cho phép: (1) tái sử dụng buffer
                khi policy thay đổi, (2) học từ demonstration (DQfD — Deep
                Q-learning from Demonstrations), (3) offline RL (học hoàn
                toàn từ dataset cố định, không tương tác môi trường). Các
                phương pháp on-policy như A2C/PPO không có lợi thế này.
              </p>

              <p className="mt-3">
                <strong>Liên hệ với Q-Learning cổ điển.</strong> DQN không
                phải là một thuật toán mới hoàn toàn — nó thực chất là
                Q-Learning với 3 thay đổi kỹ thuật: (1) hàm Q được tham số
                hoá, (2) cập nhật bằng gradient thay vì look-up, (3) dữ liệu
                được lưu và tái sử dụng. Cốt lõi vẫn là phương trình Bellman
                optimality Q*(s, a) = 𝔼[r + γ max Q*(s′, a′)]. Hiểu Q-learning
                là điều kiện tiên quyết để hiểu DQN.
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "DQN = Q-Learning + neural network tham số hoá Q(s, a; θ). Xử lý được state lớn (pixels Atari) mà Q-table không thể lưu nổi.",
                "Experience Replay: buffer 1M transitions, sample mini-batch ngẫu nhiên để phá tương quan thời gian, tái sử dụng data, ổn định gradient.",
                "Target Network: bản sao đóng băng θ⁻, cập nhật mỗi C=10K bước (hoặc soft-update τ=0.005). Tránh moving target khi bootstrap TD.",
                "Double DQN sửa overestimation do max bias: online net chọn action, target net đánh giá giá trị. Dueling DQN tách Q = V + A.",
                "Rainbow DQN gộp 6 cải tiến: Double, Dueling, Prioritized Replay, Multi-step, C51, Noisy Nets — score Atari gấp đôi DQN gốc.",
                "Dấu ấn lịch sử: DQN (DeepMind 2015) đánh bại người chơi ở 49 game Atari — 'AlexNet moment' của RL, khởi đầu kỷ nguyên Deep RL.",
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
