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
  slug: "actor-critic",
  title: "Actor-Critic (A2C/A3C)",
  titleVi: "Actor-Critic",
  description:
    "Kiến trúc kết hợp mạng chính sách (Actor) và mạng đánh giá (Critic) để học ổn định hơn",
  category: "reinforcement-learning",
  tags: ["a2c", "a3c", "advantage"],
  difficulty: "advanced",
  relatedSlugs: ["policy-gradient", "deep-q-network", "rlhf"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

// ---------------------------------------------------------------------------
// Simple grid-world environment used by the visualization
// ---------------------------------------------------------------------------

const GRID_SIZE = 5;
const START_CELL = { x: 0, y: 4 }; // bottom-left
const GOAL_CELL = { x: 4, y: 0 }; // top-right
const PIT_CELLS = [
  { x: 2, y: 2 },
  { x: 3, y: 1 },
  { x: 1, y: 3 },
];

type Action = "up" | "right" | "down" | "left";
const ACTIONS: Action[] = ["up", "right", "down", "left"];

interface Cell {
  x: number;
  y: number;
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function isGoal(cell: Cell): boolean {
  return cell.x === GOAL_CELL.x && cell.y === GOAL_CELL.y;
}

function isPit(cell: Cell): boolean {
  return PIT_CELLS.some((p) => p.x === cell.x && p.y === cell.y);
}

function inBounds(cell: Cell): boolean {
  return cell.x >= 0 && cell.x < GRID_SIZE && cell.y >= 0 && cell.y < GRID_SIZE;
}

function stepAction(cell: Cell, action: Action): Cell {
  switch (action) {
    case "up":
      return { x: cell.x, y: cell.y - 1 };
    case "right":
      return { x: cell.x + 1, y: cell.y };
    case "down":
      return { x: cell.x, y: cell.y + 1 };
    case "left":
      return { x: cell.x - 1, y: cell.y };
  }
}

function rewardForCell(cell: Cell): number {
  if (isGoal(cell)) return 1.0;
  if (isPit(cell)) return -1.0;
  return -0.04; // small step penalty encourages short paths
}

// ---------------------------------------------------------------------------
// Hand-crafted "value function" and "policy" for the visualization
// ---------------------------------------------------------------------------

/**
 * Pre-computed V(s) field that grows linearly with Manhattan proximity to the
 * goal, then gets punched downward near pits. This is NOT a real learned
 * critic — it is a stylized version whose job is to look believable while the
 * user clicks through steps.
 */
function critticValue(cell: Cell): number {
  if (isGoal(cell)) return 1.0;
  if (isPit(cell)) return -1.0;
  const dx = Math.abs(cell.x - GOAL_CELL.x);
  const dy = Math.abs(cell.y - GOAL_CELL.y);
  const base = 0.95 ** (dx + dy);
  // Pull value down slightly near pits (neighbors of pits)
  const nearPit = PIT_CELLS.some(
    (p) => Math.abs(p.x - cell.x) + Math.abs(p.y - cell.y) === 1,
  );
  return nearPit ? base - 0.25 : base;
}

/**
 * Stylised actor probabilities. For each cell, compute softmax over actions
 * based on the value of the neighbouring cell (higher neighbour value = more
 * probable action).
 */
function actorProbs(cell: Cell): Record<Action, number> {
  const logits: Record<Action, number> = {
    up: 0,
    right: 0,
    down: 0,
    left: 0,
  };
  let maxLogit = -Infinity;
  for (const action of ACTIONS) {
    const next = stepAction(cell, action);
    const v = inBounds(next) ? critticValue(next) : -1.5;
    logits[action] = v * 5; // scale for sharper softmax
    if (logits[action] > maxLogit) maxLogit = logits[action];
  }
  let sum = 0;
  const exps: Record<Action, number> = { up: 0, right: 0, down: 0, left: 0 };
  for (const action of ACTIONS) {
    exps[action] = Math.exp(logits[action] - maxLogit);
    sum += exps[action];
  }
  const probs: Record<Action, number> = { up: 0, right: 0, down: 0, left: 0 };
  for (const action of ACTIONS) {
    probs[action] = exps[action] / sum;
  }
  return probs;
}

function sampleFromProbs(probs: Record<Action, number>): Action {
  let r = Math.random();
  for (const action of ACTIONS) {
    r -= probs[action];
    if (r <= 0) return action;
  }
  return "right";
}

function greedyAction(probs: Record<Action, number>): Action {
  let best: Action = "right";
  let bestP = -Infinity;
  for (const action of ACTIONS) {
    if (probs[action] > bestP) {
      bestP = probs[action];
      best = action;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Visualization state management
// ---------------------------------------------------------------------------

interface TrajectoryStep {
  state: Cell;
  action: Action;
  reward: number;
  nextState: Cell;
  valueBefore: number;
  valueAfter: number;
  advantage: number;
}

interface AgentState {
  position: Cell;
  steps: TrajectoryStep[];
  totalReward: number;
  episodeOver: boolean;
  episodeCount: number;
}

const INITIAL_AGENT_STATE: AgentState = {
  position: { ...START_CELL },
  steps: [],
  totalReward: 0,
  episodeOver: false,
  episodeCount: 0,
};

function useActorCriticAgent() {
  const [state, setState] = useState<AgentState>(INITIAL_AGENT_STATE);

  const stepForward = useCallback(() => {
    setState((prev) => {
      if (prev.episodeOver) return prev;

      const probs = actorProbs(prev.position);
      const action = sampleFromProbs(probs);
      const raw = stepAction(prev.position, action);
      const next = inBounds(raw) ? raw : prev.position;
      const reward = rewardForCell(next);
      const valueBefore = critticValue(prev.position);
      const valueAfter = critticValue(next);
      const gamma = 0.95;
      const advantage = reward + gamma * valueAfter - valueBefore;

      const step: TrajectoryStep = {
        state: prev.position,
        action,
        reward,
        nextState: next,
        valueBefore,
        valueAfter,
        advantage,
      };

      const terminal = isGoal(next) || isPit(next) || prev.steps.length >= 30;

      return {
        ...prev,
        position: next,
        steps: [...prev.steps, step],
        totalReward: prev.totalReward + reward,
        episodeOver: terminal,
      };
    });
  }, []);

  const greedyStep = useCallback(() => {
    setState((prev) => {
      if (prev.episodeOver) return prev;

      const probs = actorProbs(prev.position);
      const action = greedyAction(probs);
      const raw = stepAction(prev.position, action);
      const next = inBounds(raw) ? raw : prev.position;
      const reward = rewardForCell(next);
      const valueBefore = critticValue(prev.position);
      const valueAfter = critticValue(next);
      const gamma = 0.95;
      const advantage = reward + gamma * valueAfter - valueBefore;

      const step: TrajectoryStep = {
        state: prev.position,
        action,
        reward,
        nextState: next,
        valueBefore,
        valueAfter,
        advantage,
      };

      const terminal = isGoal(next) || isPit(next) || prev.steps.length >= 30;

      return {
        ...prev,
        position: next,
        steps: [...prev.steps, step],
        totalReward: prev.totalReward + reward,
        episodeOver: terminal,
      };
    });
  }, []);

  const resetEpisode = useCallback(() => {
    setState((prev) => ({
      position: { ...START_CELL },
      steps: [],
      totalReward: 0,
      episodeOver: false,
      episodeCount: prev.episodeCount + 1,
    }));
  }, []);

  const fullReset = useCallback(() => {
    setState(INITIAL_AGENT_STATE);
  }, []);

  return { state, stepForward, greedyStep, resetEpisode, fullReset };
}

// ---------------------------------------------------------------------------
// Grid-world SVG renderer
// ---------------------------------------------------------------------------

interface GridWorldProps {
  position: Cell;
  showValues: boolean;
  showPolicy: boolean;
}

function GridWorldSVG({ position, showValues, showPolicy }: GridWorldProps) {
  const cellSize = 60;
  const padding = 20;
  const width = padding * 2 + GRID_SIZE * cellSize;
  const height = padding * 2 + GRID_SIZE * cellSize + 24;

  function valueToColor(v: number): string {
    const t = Math.max(0, Math.min(1, (v + 1) / 2));
    const red = Math.round(239 - t * (239 - 34));
    const green = Math.round(68 + t * (197 - 68));
    const blue = Math.round(68 + t * (94 - 68));
    return `rgb(${red}, ${green}, ${blue})`;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-md mx-auto">
      <text
        x={width / 2}
        y={14}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={11}
        fontWeight="bold"
      >
        Grid World: tìm đường từ S (start) tới G (goal), tránh pits
      </text>

      {Array.from({ length: GRID_SIZE }).map((_, x) =>
        Array.from({ length: GRID_SIZE }).map((_, y) => {
          const cell: Cell = { x, y };
          const cellX = padding + x * cellSize;
          const cellY = padding + 10 + y * cellSize;
          const goal = isGoal(cell);
          const pit = isPit(cell);
          const start = cell.x === START_CELL.x && cell.y === START_CELL.y;
          const value = critticValue(cell);

          let fill = "#0f172a";
          if (goal) fill = "#22c55e";
          else if (pit) fill = "#ef4444";
          else if (showValues) fill = valueToColor(value);

          return (
            <g key={cellKey(cell)}>
              <rect
                x={cellX + 2}
                y={cellY + 2}
                width={cellSize - 4}
                height={cellSize - 4}
                rx={6}
                fill={fill}
                stroke="#334155"
                strokeWidth={1}
                opacity={0.88}
              />
              {goal && (
                <text
                  x={cellX + cellSize / 2}
                  y={cellY + cellSize / 2 + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize={14}
                  fontWeight="bold"
                >
                  G
                </text>
              )}
              {pit && (
                <text
                  x={cellX + cellSize / 2}
                  y={cellY + cellSize / 2 + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize={14}
                  fontWeight="bold"
                >
                  ×
                </text>
              )}
              {start && !goal && !pit && (
                <text
                  x={cellX + cellSize / 2}
                  y={cellY + 14}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize={11}
                  fontWeight="bold"
                >
                  S
                </text>
              )}
              {showValues && !goal && !pit && (
                <text
                  x={cellX + cellSize / 2}
                  y={cellY + cellSize - 6}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize={11}
                >
                  {value.toFixed(2)}
                </text>
              )}
              {showPolicy && !goal && !pit && <PolicyArrows cell={cell} cellX={cellX} cellY={cellY} cellSize={cellSize} />}
            </g>
          );
        }),
      )}

      {/* Agent */}
      <motion.circle
        animate={{
          cx: padding + position.x * cellSize + cellSize / 2,
          cy: padding + 10 + position.y * cellSize + cellSize / 2,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        r={cellSize / 4}
        fill="#fde047"
        stroke="#854d0e"
        strokeWidth={2}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Policy arrow overlays
// ---------------------------------------------------------------------------

interface PolicyArrowsProps {
  cell: Cell;
  cellX: number;
  cellY: number;
  cellSize: number;
}

function PolicyArrows({ cell, cellX, cellY, cellSize }: PolicyArrowsProps) {
  const probs = actorProbs(cell);
  const cx = cellX + cellSize / 2;
  const cy = cellY + cellSize / 2;
  const maxLen = cellSize / 2 - 6;

  function arrow(action: Action): { x1: number; y1: number; x2: number; y2: number } {
    const p = probs[action];
    const len = p * maxLen;
    switch (action) {
      case "up":
        return { x1: cx, y1: cy, x2: cx, y2: cy - len };
      case "right":
        return { x1: cx, y1: cy, x2: cx + len, y2: cy };
      case "down":
        return { x1: cx, y1: cy, x2: cx, y2: cy + len };
      case "left":
        return { x1: cx, y1: cy, x2: cx - len, y2: cy };
    }
  }

  return (
    <g>
      {ACTIONS.map((action) => {
        const { x1, y1, x2, y2 } = arrow(action);
        return (
          <line
            key={action}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#fef3c7"
            strokeWidth={1.8}
            strokeLinecap="round"
            opacity={0.85}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={2} fill="#fef3c7" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Two-network diagram (Actor + Critic)
// ---------------------------------------------------------------------------

function ActorCriticDiagram() {
  return (
    <svg viewBox="0 0 620 200" className="w-full max-w-2xl mx-auto">
      <text
        x={310}
        y={16}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={12}
        fontWeight="bold"
      >
        Actor + Critic: hai đầu mạng chia sẻ features
      </text>

      {/* State block */}
      <rect x={20} y={60} width={110} height={60} rx={8} fill="#3b82f6" />
      <text x={75} y={86} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
        State s_t
      </text>
      <text x={75} y={104} textAnchor="middle" fill="white" fontSize={11}>
        (observation)
      </text>

      {/* Shared trunk */}
      <rect x={160} y={65} width={110} height={50} rx={8} fill="#7c3aed" />
      <text x={215} y={86} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
        Shared trunk
      </text>
      <text x={215} y={100} textAnchor="middle" fill="white" fontSize={11}>
        (convs / MLP)
      </text>

      <line x1={130} y1={90} x2={160} y2={90} stroke="#94a3b8" strokeWidth={2} markerEnd="url(#arrowhead)" />

      {/* Actor head */}
      <rect x={300} y={30} width={130} height={48} rx={8} fill="#22c55e" />
      <text x={365} y={50} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
        Actor π(a|s)
      </text>
      <text x={365} y={66} textAnchor="middle" fill="white" fontSize={11}>
        policy softmax
      </text>

      <line
        x1={270}
        y1={80}
        x2={300}
        y2={54}
        stroke="#22c55e"
        strokeWidth={2}
        markerEnd="url(#arrowheadGreen)"
      />

      {/* Critic head */}
      <rect x={300} y={102} width={130} height={48} rx={8} fill="#f59e0b" />
      <text x={365} y={122} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
        Critic V(s)
      </text>
      <text x={365} y={138} textAnchor="middle" fill="white" fontSize={11}>
        scalar value
      </text>

      <line
        x1={270}
        y1={100}
        x2={300}
        y2={126}
        stroke="#f59e0b"
        strokeWidth={2}
        markerEnd="url(#arrowheadAmber)"
      />

      {/* Outputs */}
      <text x={460} y={54} fill="#22c55e" fontSize={11}>
        → action a_t
      </text>
      <text x={460} y={126} fill="#f59e0b" fontSize={11}>
        → V̂(s_t)
      </text>

      {/* Advantage box */}
      <rect
        x={450}
        y={160}
        width={160}
        height={34}
        rx={8}
        fill="#8b5cf6"
        opacity={0.25}
        stroke="#8b5cf6"
        strokeWidth={1.5}
      />
      <text x={530} y={178} textAnchor="middle" fill="#c4b5fd" fontSize={11} fontWeight="bold">
        Advantage
      </text>
      <text x={530} y={190} textAnchor="middle" fill="#cbd5e1" fontSize={11}>
        A = r + γ·V(s′) − V(s)
      </text>

      {/* Arrow markers */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <polygon points="0 0, 8 4, 0 8" fill="#94a3b8" />
        </marker>
        <marker
          id="arrowheadGreen"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <polygon points="0 0, 8 4, 0 8" fill="#22c55e" />
        </marker>
        <marker
          id="arrowheadAmber"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <polygon points="0 0, 8 4, 0 8" fill="#f59e0b" />
        </marker>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Telemetry sparkline — visualises advantage per step
// ---------------------------------------------------------------------------

interface AdvantageSparklineProps {
  steps: TrajectoryStep[];
}

function AdvantageSparkline({ steps }: AdvantageSparklineProps) {
  const width = 560;
  const height = 100;
  const padding = 24;

  if (steps.length === 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl mx-auto">
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          fill="#64748b"
          fontSize={11}
        >
          Chưa có step nào — bấm &quot;Step&quot; để agent di chuyển.
        </text>
      </svg>
    );
  }

  const minA = Math.min(-0.2, ...steps.map((s) => s.advantage));
  const maxA = Math.max(0.2, ...steps.map((s) => s.advantage));

  function projectX(idx: number): number {
    return padding + (idx / Math.max(1, steps.length - 1)) * (width - padding * 2);
  }

  function projectY(a: number): number {
    const t = (a - minA) / (maxA - minA);
    return height - padding - t * (height - padding * 2);
  }

  const zeroY = projectY(0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl mx-auto">
      <text x={width / 2} y={14} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
        Advantage A(s, a) theo từng step
      </text>

      {/* Zero line */}
      <line
        x1={padding}
        y1={zeroY}
        x2={width - padding}
        y2={zeroY}
        stroke="#475569"
        strokeDasharray="3 3"
      />
      <text x={width - padding + 4} y={zeroY + 3} fill="#64748b" fontSize={11}>
        A = 0
      </text>

      {/* Bars */}
      {steps.map((step, idx) => {
        const x = projectX(idx);
        const y = projectY(step.advantage);
        const barHeight = Math.abs(y - zeroY);
        const barY = Math.min(y, zeroY);
        const fill = step.advantage >= 0 ? "#22c55e" : "#ef4444";
        return (
          <rect
            key={idx}
            x={x - 6}
            y={barY}
            width={12}
            height={barHeight}
            rx={2}
            fill={fill}
            opacity={0.85}
          />
        );
      })}

      {/* Points */}
      {steps.map((step, idx) => (
        <circle
          key={`pt-${idx}`}
          cx={projectX(idx)}
          cy={projectY(step.advantage)}
          r={3}
          fill="#fde047"
          stroke="#1e293b"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Step-by-step telemetry table
// ---------------------------------------------------------------------------

interface StepTableProps {
  steps: TrajectoryStep[];
}

function StepTable({ steps }: StepTableProps) {
  if (steps.length === 0) return null;
  const recent = steps.slice(-5);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted border-b border-border">
            <th className="text-left py-1.5 pr-2">t</th>
            <th className="text-left py-1.5 pr-2">state</th>
            <th className="text-left py-1.5 pr-2">action</th>
            <th className="text-left py-1.5 pr-2">reward</th>
            <th className="text-left py-1.5 pr-2">V(s)</th>
            <th className="text-left py-1.5 pr-2">V(s′)</th>
            <th className="text-left py-1.5 pr-2">A</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((step, idx) => {
            const t = steps.length - recent.length + idx;
            const sign = step.advantage >= 0 ? "text-emerald-400" : "text-red-400";
            return (
              <tr key={t} className="border-b border-border/40">
                <td className="py-1 pr-2 text-muted">{t}</td>
                <td className="py-1 pr-2">
                  ({step.state.x},{step.state.y})
                </td>
                <td className="py-1 pr-2">{step.action}</td>
                <td className="py-1 pr-2">{step.reward.toFixed(2)}</td>
                <td className="py-1 pr-2">{step.valueBefore.toFixed(2)}</td>
                <td className="py-1 pr-2">{step.valueAfter.toFixed(2)}</td>
                <td className={`py-1 pr-2 font-semibold ${sign}`}>
                  {step.advantage.toFixed(3)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Control panel wrapping the agent
// ---------------------------------------------------------------------------

interface ViewToggles {
  showValues: boolean;
  showPolicy: boolean;
}

interface AgentControlsProps {
  state: AgentState;
  toggles: ViewToggles;
  setToggles: (t: ViewToggles) => void;
  onStep: () => void;
  onGreedy: () => void;
  onReset: () => void;
}

function AgentControls({
  state,
  toggles,
  setToggles,
  onStep,
  onGreedy,
  onReset,
}: AgentControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onStep}
          disabled={state.episodeOver}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Step (sample từ π)
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onGreedy}
          disabled={state.episodeOver}
          className="rounded-lg border border-accent bg-card px-4 py-2 text-sm font-semibold text-accent hover:bg-surface disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Greedy step (argmax)
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onReset}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Reset episode
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={toggles.showValues}
            onChange={(e) =>
              setToggles({ ...toggles, showValues: e.target.checked })
            }
          />
          <span>Hiện Critic V(s)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={toggles.showPolicy}
            onChange={(e) =>
              setToggles({ ...toggles, showPolicy: e.target.checked })
            }
          />
          <span>Hiện Actor π(a|s)</span>
        </label>
      </div>

      <div className="rounded-lg border border-border bg-card/60 px-4 py-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
        <span className="text-muted">
          Episode: <strong className="text-foreground">{state.episodeCount + 1}</strong>
        </span>
        <span className="text-muted">
          Steps: <strong className="text-foreground">{state.steps.length}</strong>
        </span>
        <span className="text-muted">
          Total reward:{" "}
          <strong className="text-foreground">{state.totalReward.toFixed(2)}</strong>
        </span>
        <span className="text-muted">
          Trạng thái:{" "}
          <strong className="text-foreground">
            {state.episodeOver
              ? isGoal(state.position)
                ? "Tới đích G"
                : isPit(state.position)
                  ? "Rơi xuống pit"
                  : "Hết budget"
              : "Đang chạy"}
          </strong>
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main topic component
// ---------------------------------------------------------------------------

export default function ActorCriticTopic() {
  const agent = useActorCriticAgent();
  const [toggles, setToggles] = useState<ViewToggles>({
    showValues: true,
    showPolicy: true,
  });

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Actor và Critic làm gì trong Actor-Critic?",
        options: [
          "Actor và Critic là hai tên gọi của cùng một network",
          "Actor: chọn action (policy π). Critic: đánh giá action đó tốt hay xấu (value function V hoặc Q)",
          "Actor xử lý ảnh, Critic xử lý text",
          "Actor là environment, Critic là agent",
        ],
        correct: 1,
        explanation:
          "Actor = diễn viên: hành động (chọn action dựa trên policy). Critic = đạo diễn: đánh giá (chấm điểm state/action). Actor học từ feedback của Critic. Critic học từ reward thật. Kết hợp ổn định hơn REINFORCE (actor only) và tổng quát hơn DQN (critic only).",
      },
      {
        question: "Advantage function A(s, a) = Q(s, a) − V(s) có ý nghĩa gì?",
        options: [
          "Đo accuracy của model",
          "Action a TẠI state s tốt/xấu hơn TRUNG BÌNH bao nhiêu. A > 0: tốt hơn mean → tăng xác suất. A < 0: giảm",
          "Khoảng cách giữa hai states",
          "Số bước còn lại trong episode",
        ],
        correct: 1,
        explanation:
          "V(s) là giá trị trung bình của state s (average qua mọi action theo policy). Q(s, a) là giá trị nếu chọn action a. A(s, a) = Q − V = action a tốt hơn/xấu hơn mean bao nhiêu. Dùng A thay vì Q giảm variance (đã trừ baseline V). Đây là 'Advantage' trong A2C.",
      },
      {
        question: "PPO (dùng trong RLHF của ChatGPT) cải thiện Actor-Critic ra sao?",
        options: [
          "Dùng model lớn hơn",
          "CLIP ratio π_new/π_old trong [1−ε, 1+ε] → policy không thay đổi quá nhiều mỗi step → training ổn định",
          "Dùng nhiều data hơn",
          "Bỏ Critic hoàn toàn",
        ],
        correct: 1,
        explanation:
          "Policy gradient có thể thay đổi policy rất nhiều trong một update → mất ổn định. PPO clip ratio giới hạn trong [0.8, 1.2] (ε = 0.2) → policy chỉ thay đổi tối đa ~20%/step. Ổn định và đơn giản → thuật toán mặc định cho RLHF.",
      },
      {
        question:
          "Trong A2C với n-step returns (n = 5), vì sao lại ưu việt hơn 1-step TD?",
        options: [
          "Không khác gì 1-step TD",
          "5-step kết hợp nhiều reward thực → ít bias hơn nhưng variance nhỉnh cao hơn — thường là sweet spot cho on-policy",
          "n-step luôn tệ hơn 1-step",
          "5-step chỉ dùng cho MCTS",
        ],
        correct: 1,
        explanation:
          "1-step TD: advantage = r + γV(s′) − V(s) — bias thấp do V xấp xỉ nhưng variance thấp. Monte Carlo (n = ∞): dùng return thật — unbiased nhưng variance cao. n-step = tradeoff. GAE (Generalized Advantage Estimation) là trung bình trọng số của nhiều n-step.",
      },
      {
        question:
          "Tại sao shared trunk (feature extractor chung) lại phổ biến cho Actor-Critic trên ảnh?",
        options: [
          "Giúp model nhỏ hơn, nhưng hại performance",
          "Actor và Critic dùng cùng state → features chung (convs) học nhanh hơn, tiết kiệm compute và tham số",
          "Bắt buộc về mặt toán học",
          "Chỉ để tiết kiệm memory",
        ],
        correct: 1,
        explanation:
          "Convolutional trunk học hierarchical features từ pixels. Cả policy head và value head đều cần những features đó → chia sẻ có lợi. Cần cẩn thận cân bằng losses (Actor loss vs Critic loss × β) để không để một head dominate gradient.",
      },
      {
        question:
          "Entropy bonus H(π) được cộng vào loss của A2C với hệ số β dương. Vai trò?",
        options: [
          "Regularize Critic về 0",
          "Khuyến khích policy giữ entropy cao → exploration nhiều hơn, tránh collapse sớm vào suboptimal",
          "Làm loss lớn hơn cho dễ train",
          "Không có tác dụng",
        ],
        correct: 1,
        explanation:
          "Không có entropy bonus, policy có thể collapse về deterministic quá sớm — kẹt ở local optimum. Entropy bonus β·H(π) giữ xác suất các action không-best đủ lớn để tiếp tục explore. β thường 0.01 và decay dần khi agent đã học tốt.",
      },
      {
        question: "Vì sao A3C (async) từng phổ biến nhưng nay ít dùng hơn?",
        options: [
          "A3C quá chậm",
          "A3C dùng nhiều worker async → stale gradients, khó debug. A2C (sync) với env parallelization đạt tương đương và đơn giản hơn. Hardware hiện đại (GPU) hưởng lợi từ batched sync",
          "Không có lý do cụ thể",
          "A3C vi phạm bản quyền DeepMind",
        ],
        correct: 1,
        explanation:
          "A3C (Asynchronous Advantage Actor-Critic, Mnih 2016) dùng nhiều worker cập nhật async → nổi tiếng nhưng khó reproduce vì non-determinism. A2C sync với vectorized envs đạt performance ngang nhau, deterministic, và phù hợp GPU → OpenAI khuyến nghị A2C từ 2017.",
      },
      {
        type: "fill-blank",
        question:
          "Trong Actor-Critic, mạng {blank} đóng vai diễn viên chọn action theo policy, còn mạng {blank} đóng vai đạo diễn ước lượng value.",
        blanks: [
          { answer: "Actor", accept: ["actor", "diễn viên"] },
          { answer: "Critic", accept: ["critic", "đạo diễn"] },
        ],
        explanation:
          "Actor học policy π(a|s) — quyết định hành động. Critic học value V(s) hoặc Q(s, a) — đánh giá xem state/action đó tốt xấu thế nào. Critic cung cấp baseline để giảm variance cho Actor.",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={0} totalSteps={TOTAL_STEPS} label="Tiến trình">
        <ProgressSteps
          current={0}
          total={TOTAL_STEPS}
          labels={[
            "Dự đoán",
            "Khám phá",
            "Aha",
            "Thử thách",
            "Lý thuyết",
            "Tóm tắt",
            "Kiểm tra",
          ]}
        />
      </LessonSection>

      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="REINFORCE (Policy Gradient) có variance cao vì chỉ dùng return làm tín hiệu học. DQN chỉ học value, không học policy trực tiếp. Có cách kết hợp ưu điểm cả hai?"
          options={[
            "Không — phải chọn một trong hai",
            "Actor-Critic: Actor (policy) chọn action, Critic (value) đánh giá → variance thấp + policy trực tiếp",
            "Dùng model lớn hơn là đủ",
            "Chỉ cần reward shaping khéo léo",
          ]}
          correct={1}
          explanation="Actor-Critic = best of both worlds. Actor học policy (như REINFORCE nhưng variance thấp hơn vì Critic làm baseline). Critic học value function (như DQN nhưng hỗ trợ Actor chứ không chọn action). PPO (variant của Actor-Critic) là thuật toán dùng cho RLHF trong ChatGPT và Claude."
        >
          <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
            <VisualizationSection topicSlug={metadata.slug}>
              <div className="space-y-6">
                <p className="text-sm text-muted">
                  Agent màu vàng xuất phát từ ô S (góc dưới trái), cần tới ô G (góc trên
                  phải) và tránh các pit màu đỏ. Mũi tên vàng trong mỗi ô là policy
                  π(a|s) của Actor (độ dài tỉ lệ với xác suất action). Màu nền là
                  giá trị V(s) của Critic (xanh = tốt, đỏ = xấu). Bấm <strong>Step</strong>{" "}
                  để agent sample action từ π; bấm <strong>Greedy step</strong> để
                  chọn argmax.
                </p>

                <GridWorldSVG
                  position={agent.state.position}
                  showValues={toggles.showValues}
                  showPolicy={toggles.showPolicy}
                />

                <AgentControls
                  state={agent.state}
                  toggles={toggles}
                  setToggles={setToggles}
                  onStep={agent.stepForward}
                  onGreedy={agent.greedyStep}
                  onReset={agent.resetEpisode}
                />

                <div className="pt-4 border-t border-border">
                  <AdvantageSparkline steps={agent.state.steps} />
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted mb-3">
                    Bảng bên dưới hiển thị 5 step gần nhất. Lưu ý cột{" "}
                    <strong>A</strong> (Advantage): dương (xanh) nghĩa là bước đó tốt
                    hơn trung bình → Actor sẽ tăng xác suất chọn action đó trong lần
                    training kế tiếp. Âm (đỏ) → giảm xác suất.
                  </p>
                  <StepTable steps={agent.state.steps} />
                </div>

                <div className="pt-4 border-t border-border">
                  <ActorCriticDiagram />
                </div>
              </div>
            </VisualizationSection>
          </LessonSection>

          <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
            <AhaMoment>
              <p>
                Actor = <strong>diễn viên</strong> (hành động). Critic ={" "}
                <strong>đạo diễn</strong> (đánh giá). Diễn viên học từ feedback của
                đạo diễn, đạo diễn học từ reward thật của khán giả (environment).
                Kết hợp tạo ra một <strong>system ổn định và hiệu quả</strong>:
                advantage của Critic giảm variance cho Actor, reward thực giữ Critic
                grounded. <strong>PPO</strong> — biến thể được sử dụng nhiều nhất — là
                thuật toán <strong>mặc định cho RLHF</strong> trong ChatGPT, Claude,
                và Gemini.
              </p>
            </AhaMoment>

            <Callout variant="insight" title="Liên hệ sâu hơn">
              Nếu bạn coi Q-Learning là &quot;học giá trị rồi act greedy&quot;, và{" "}
              <TopicLink slug="policy-gradient">Policy Gradient</TopicLink> là
              &quot;học trực tiếp phân phối hành động&quot;, thì Actor-Critic là
              &quot;vừa học policy, vừa học value, hai mạng cùng training&quot;. Đó
              là lý do nó kế thừa điểm mạnh của cả hai và cân bằng được bias/variance
              tradeoff tốt hơn.
            </Callout>
          </LessonSection>

          <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
            <div className="space-y-4">
              <InlineChallenge
                question="PPO clip ratio trong [0.8, 1.2]. Nghĩa là policy chỉ thay đổi tối đa ~20% mỗi step. Tại sao không cho thay đổi nhiều hơn (50%)?"
                options={[
                  "Tiết kiệm compute",
                  "Thay đổi lớn = mất ổn định. Policy A tốt → thay đổi 50% → policy B có thể tệ vì reward landscape phức tạp. Small steps an toàn hơn",
                  "Không có lý do cụ thể",
                  "Để model hội tụ nhanh hơn",
                ]}
                correct={1}
                explanation="Trust region: policy landscape phức tạp, thay đổi lớn có thể 'nhảy' từ vùng tốt sang vùng tệ. PPO giới hạn mỗi step → đảm bảo cải thiện dần dần. ε = 0.2 là sweet spot: đủ nhanh để học, đủ nhỏ để ổn định. Đây là lý do PPO là default cho RLHF."
              />

              <InlineChallenge
                question="Critic của bạn luôn dự đoán V(s) = 0 (mạng bị stuck). Chuyện gì xảy ra với Actor?"
                options={[
                  "Actor vẫn học bình thường vì có reward",
                  "Advantage A = r + γ·0 − 0 = r → biến thành REINFORCE không baseline → variance cao, học chậm",
                  "Actor sẽ crash",
                  "Actor sẽ học nhanh hơn do ít noise",
                ]}
                correct={1}
                explanation="Critic stuck ở 0 = không còn baseline subtract → advantage = return thô → biến Actor-Critic thành REINFORCE cơ bản (variance cao). Debug: kiểm tra loss scale của Critic (hệ số β thường 0.5), learning rate Critic, initialization. Critic phải học trước hoặc song song."
              />
            </div>
          </LessonSection>

          <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
            <ExplanationSection topicSlug={metadata.slug}>
              <p>
                <strong>Actor-Critic</strong> kết hợp policy optimization (Actor) với
                value estimation (Critic) — ổn định và hiệu quả hơn khi dùng riêng
                lẻ. Về bản chất, Actor kế thừa ý tưởng từ{" "}
                <TopicLink slug="policy-gradient">Policy Gradient</TopicLink>, còn
                Critic học value function tương tự{" "}
                <TopicLink slug="q-learning">Q-Learning</TopicLink>.
              </p>

              <p>
                <strong>Advantage Actor-Critic (A2C)</strong> định nghĩa advantage qua
                TD error:
              </p>

              <LaTeX block>
                {"A(s, a) = r + \\gamma V(s') - V(s) \\quad \\text{(TD error làm advantage estimate)}"}
              </LaTeX>

              <p>
                Actor update dùng advantage để &quot;cân&quot; gradient log-probability:
              </p>

              <LaTeX block>
                {"\\nabla_\\theta J(\\theta) = \\mathbb{E}\\left[\\nabla_\\theta \\log \\pi_\\theta(a | s) \\cdot A(s, a)\\right]"}
              </LaTeX>

              <p>
                Critic update minimise squared TD error:
              </p>

              <LaTeX block>
                {"\\mathcal{L}_{\\text{critic}} = \\left(r + \\gamma V_\\phi(s') - V_\\phi(s)\\right)^2"}
              </LaTeX>

              <p>
                Tổng loss thường là tổng trọng số, cộng thêm entropy bonus để giữ
                exploration:
              </p>

              <LaTeX block>
                {"\\mathcal{L} = \\mathcal{L}_{\\text{actor}} + c_v \\cdot \\mathcal{L}_{\\text{critic}} - c_e \\cdot H(\\pi_\\theta)"}
              </LaTeX>

              <p>
                Hệ số điển hình: c_v = 0.5, c_e = 0.01. Entropy bonus khuyến khích
                policy giữ &quot;mềm&quot; — tránh collapse sớm vào suboptimal.
              </p>

              <p>
                <strong>Proximal Policy Optimization (PPO)</strong> thêm một bước quan
                trọng: giới hạn tỉ số xác suất giữa policy mới và cũ để training ổn
                định. Đặt r_t(θ) = π_θ(a_t|s_t) / π_θ_old(a_t|s_t), PPO tối đa hoá:
              </p>

              <LaTeX block>
                {"\\mathcal{L}^{\\text{CLIP}}(\\theta) = \\mathbb{E}\\left[\\min\\left(r_t(\\theta) \\hat{A}_t, \\text{clip}(r_t(\\theta), 1 - \\epsilon, 1 + \\epsilon) \\hat{A}_t\\right)\\right]"}
              </LaTeX>

              <p>
                Với ε = 0.2, policy chỉ thay đổi tối đa 20% mỗi update → đảm bảo
                training ổn định ngay cả khi reuse data cho nhiều epoch (off-policy
                nhẹ). Đây là lý do PPO là thuật toán mặc định cho RLHF trong ChatGPT,
                Claude, Gemini.
              </p>

              <Callout variant="tip" title="PPO = Default cho RLHF">
                PPO ổn định, đơn giản implement (10–20 dòng khác biệt so với A2C),
                hiệu quả trên hàng loạt domain. GRPO (DeepSeek) là variant mới hơn
                không cần Critic riêng — sinh nhiều responses cho mỗi prompt, rank
                chúng, update policy theo relative advantage. Giảm memory và đơn giản
                hoá pipeline RLHF.
              </Callout>

              <Callout variant="info" title="GAE — Generalized Advantage Estimation">
                Thay vì chỉ dùng 1-step TD hay n-step return, GAE (Schulman 2016) tính
                advantage là trung bình trọng số của tất cả k-step TD errors với hệ
                số λ ∈ [0, 1]. λ = 0 → 1-step TD (bias cao, variance thấp). λ = 1 →
                Monte Carlo (bias thấp, variance cao). λ = 0.95 là sweet spot phổ
                biến. PPO mặc định dùng GAE.
              </Callout>

              <Callout variant="warning" title="Critic bias & catastrophic forgetting">
                Nếu Critic chưa học tốt, advantage sẽ biased → Actor cập nhật sai
                hướng. Đặc biệt nguy hiểm ở đầu training. Kỹ thuật: warmup Critic vài
                nghìn step trước khi bật Actor update; dùng target network cho Critic
                (như DQN) để ổn định; clipping value loss tương tự CLIP của PPO.
              </Callout>

              <Callout variant="insight" title="Continuous action spaces">
                Với action liên tục (robotics, locomotion), Actor xuất phân phối
                (thường là Gaussian với mean + log_std học được): a ~ N(μ_θ(s),
                σ_θ(s)). SAC (Soft Actor-Critic) thêm maximum entropy framework —
                tối đa hoá vừa reward vừa entropy của policy, rất ổn định cho
                continuous control.
              </Callout>

              <CodeBlock language="python" title="A2C với PyTorch (discrete actions)">
                {`import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.distributions import Categorical

class ActorCritic(nn.Module):
    """Shared trunk, separate policy / value heads."""

    def __init__(self, state_dim: int, action_dim: int, hidden: int = 128):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(state_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
        )
        self.policy_head = nn.Linear(hidden, action_dim)
        self.value_head = nn.Linear(hidden, 1)

    def forward(self, state: torch.Tensor):
        features = self.shared(state)
        logits = self.policy_head(features)
        value = self.value_head(features).squeeze(-1)
        return logits, value

    def act(self, state: torch.Tensor):
        logits, value = self(state)
        dist = Categorical(logits=logits)
        action = dist.sample()
        log_prob = dist.log_prob(action)
        return action, log_prob, value, dist.entropy()


def a2c_update(
    model: ActorCritic,
    optimizer: torch.optim.Optimizer,
    rollout: dict,
    gamma: float = 0.99,
    value_coef: float = 0.5,
    entropy_coef: float = 0.01,
) -> dict:
    """One A2C update from a batch of (s, a, r, s', done) transitions."""
    states = rollout["states"]       # (T, state_dim)
    actions = rollout["actions"]     # (T,)
    rewards = rollout["rewards"]     # (T,)
    next_states = rollout["next_states"]
    dones = rollout["dones"].float()

    logits, values = model(states)
    _, next_values = model(next_states)

    # 1-step TD target and advantage
    td_target = rewards + gamma * next_values.detach() * (1.0 - dones)
    advantage = (td_target - values).detach()

    dist = Categorical(logits=logits)
    log_probs = dist.log_prob(actions)
    entropy = dist.entropy().mean()

    actor_loss = -(log_probs * advantage).mean()
    critic_loss = F.mse_loss(values, td_target)
    loss = actor_loss + value_coef * critic_loss - entropy_coef * entropy

    optimizer.zero_grad()
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=0.5)
    optimizer.step()

    return {
        "loss": loss.item(),
        "actor_loss": actor_loss.item(),
        "critic_loss": critic_loss.item(),
        "entropy": entropy.item(),
    }


# Training loop sketch (vectorised envs recommended)
model = ActorCritic(state_dim=4, action_dim=2)
optimizer = torch.optim.Adam(model.parameters(), lr=3e-4)

for iteration in range(1000):
    rollout = collect_rollout(env, model, n_steps=128)
    stats = a2c_update(model, optimizer, rollout)
    if iteration % 10 == 0:
        print(f"iter={iteration} loss={stats['loss']:.3f} H={stats['entropy']:.3f}")
`}
              </CodeBlock>

              <CodeBlock language="python" title="PPO clip objective (PyTorch)">
                {`import torch
import torch.nn.functional as F
from torch.distributions import Categorical

def ppo_update(
    model,
    optimizer,
    rollout: dict,
    epochs: int = 4,
    clip_epsilon: float = 0.2,
    value_coef: float = 0.5,
    entropy_coef: float = 0.01,
    batch_size: int = 64,
):
    """PPO-Clip update reusing a rollout for multiple epochs."""
    states = rollout["states"]
    actions = rollout["actions"]
    advantages = rollout["advantages"]       # computed via GAE
    returns = rollout["returns"]             # GAE + V
    old_log_probs = rollout["log_probs"].detach()

    # Normalise advantages (standard trick)
    advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

    n = states.shape[0]

    for _ in range(epochs):
        perm = torch.randperm(n)
        for start in range(0, n, batch_size):
            idx = perm[start : start + batch_size]
            s = states[idx]
            a = actions[idx]
            adv = advantages[idx]
            ret = returns[idx]
            old_lp = old_log_probs[idx]

            logits, values = model(s)
            dist = Categorical(logits=logits)
            new_lp = dist.log_prob(a)
            entropy = dist.entropy().mean()

            # Probability ratio r_t(θ)
            ratio = torch.exp(new_lp - old_lp)

            # Clipped surrogate objective
            surr1 = ratio * adv
            surr2 = torch.clamp(ratio, 1 - clip_epsilon, 1 + clip_epsilon) * adv
            actor_loss = -torch.min(surr1, surr2).mean()

            critic_loss = F.mse_loss(values, ret)
            loss = actor_loss + value_coef * critic_loss - entropy_coef * entropy

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 0.5)
            optimizer.step()


def compute_gae(rewards, values, dones, gamma=0.99, lam=0.95):
    """Generalized Advantage Estimation (Schulman 2016)."""
    advantages = torch.zeros_like(rewards)
    gae = 0.0
    next_value = 0.0
    for t in reversed(range(len(rewards))):
        mask = 1.0 - dones[t]
        delta = rewards[t] + gamma * next_value * mask - values[t]
        gae = delta + gamma * lam * mask * gae
        advantages[t] = gae
        next_value = values[t]
    returns = advantages + values
    return advantages, returns
`}
              </CodeBlock>

              <CollapsibleDetail title="A2C vs A3C vs IMPALA vs PPO — một bảng tổng kết nhanh">
                <p>
                  <strong>A3C</strong> (Asynchronous Advantage Actor-Critic, 2016):
                  nhiều worker async, mỗi worker có bản copy model, push gradient về
                  global model. Nổi tiếng nhưng khó reproduce vì non-determinism.
                </p>
                <p>
                  <strong>A2C</strong>: synchronous version — các env chạy song song
                  nhưng gradient update sync. Đơn giản, deterministic, tận dụng GPU
                  tốt. OpenAI khuyến nghị từ 2017.
                </p>
                <p>
                  <strong>IMPALA</strong> (DeepMind 2018): scale lên hàng trăm actor
                  với V-trace off-policy correction. Xử lý tốt lag giữa actor và
                  learner. Dùng cho large-scale RL (AlphaStar).
                </p>
                <p>
                  <strong>PPO</strong> (2017): đơn giản hoá TRPO, clip ratio thay vì
                  KL constraint. Robust, implementation-friendly, default cho RLHF.
                </p>
                <p>
                  <strong>SAC</strong>: off-policy, maximum entropy, thiết kế cho
                  continuous control. Sample-efficient hơn PPO trên robotics.
                </p>
                <p>
                  <strong>GRPO</strong> (DeepSeek 2024): Group Relative Policy
                  Optimization — bỏ Critic, dùng reward tương đối giữa các responses
                  cho cùng prompt. Hiệu quả cho LLM RLHF.
                </p>
              </CollapsibleDetail>

              <CollapsibleDetail title="Từ Q-Learning tới Actor-Critic — một con đường trực quan">
                <p>
                  Q-Learning học Q(s, a) → act greedy theo argmax. Hoạt động tốt với
                  action discrete nhỏ. Với action space lớn hoặc continuous, argmax
                  trở nên không khả thi.
                </p>
                <p>
                  Policy Gradient học trực tiếp π(a|s). Vấn đề: variance cao vì chỉ
                  dùng Monte Carlo return làm tín hiệu. REINFORCE cần hàng triệu
                  episode cho bài toán đơn giản.
                </p>
                <p>
                  <strong>Insight</strong>: nếu ta học đồng thời V(s) làm baseline,
                  thay &quot;return&quot; bằng &quot;return − V(s)&quot; trong gradient,
                  variance giảm mạnh mà không thay đổi expected gradient (vì E[V(s)]
                  = const theo action). Đây chính là Actor-Critic.
                </p>
                <p>
                  Mở rộng: thay baseline V(s) bằng TD target r + γV(s′), được advantage
                  1-step. Dùng GAE, được smooth multi-step advantage. Thêm clipping,
                  được PPO. Thêm off-policy correction, được IMPALA. Mỗi bước là một
                  cải tiến nhỏ và có lý.
                </p>
              </CollapsibleDetail>

              <p>
                <strong>Triển khai thực tế</strong>: với các bài cartpole / lunar
                lander, A2C đơn giản đủ hội tụ trong vài phút trên CPU. Với Atari hay
                MuJoCo, PPO với vectorized envs (8–32 env song song) là lựa chọn mặc
                định — libraries tham khảo: Stable Baselines3, CleanRL, RLlib.
              </p>

              <p>
                <strong>Hyperparameters quan trọng</strong> cho Actor-Critic: learning
                rate (3e-4 với Adam là sweet spot), gamma (0.99), GAE lambda (0.95),
                entropy coef (0.01, decay theo thời gian), value coef (0.5), clip
                epsilon (0.2 cho PPO), batch size (64–256), epochs per rollout (4–10
                cho PPO).
              </p>

              <p>
                <strong>Debug checklist</strong> khi Actor-Critic không học: (1)
                Kiểm tra Critic loss có giảm không — nếu không, Critic có thể stuck.
                (2) Kiểm tra entropy — nếu rớt về 0 quá nhanh, tăng entropy coef. (3)
                Kiểm tra advantage scale — nên near-zero-mean, unit-variance sau
                normalise. (4) Kiểm tra gradient norms — nếu explode, giảm lr hoặc
                clip mạnh hơn.
              </p>

              <p>
                <strong>RLHF pipeline tổng quan</strong> cho LLM: (1) SFT — supervised
                fine-tune base LLM trên (prompt, response). (2) Reward model —
                classifier trên (prompt, chosen, rejected) để predict preference.
                (3) PPO — reward model làm environment, Actor = LLM policy,
                Critic = value head; GAE + clip 0.2 + KL penalty để không drift khỏi
                SFT. ChatGPT, Claude, Gemini đều dùng biến thể của pipeline này.
              </p>
            </ExplanationSection>
          </LessonSection>

          <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
            <MiniSummary
              points={[
                "Actor-Critic: Actor (policy π) chọn action, Critic (value V) đánh giá. Kết hợp ưu điểm Policy Gradient + Q-Learning.",
                "Advantage A(s, a) = r + γV(s′) − V(s) đo action tốt/xấu hơn mean bao nhiêu → giảm variance đáng kể cho Actor update.",
                "PPO clip ratio trong [1 − ε, 1 + ε] giới hạn thay đổi policy mỗi update → training ổn định ngay cả khi reuse data.",
                "PPO là default cho RLHF (ChatGPT, Claude, Gemini). GRPO (DeepSeek) là variant mới không cần Critic riêng, tiết kiệm memory.",
                "A3C (async) đã nhường chỗ cho A2C (sync) + vectorized envs trên GPU hiện đại. IMPALA scale lên hàng trăm worker.",
                "Entropy bonus giữ policy mềm để tiếp tục explore; GAE (λ ≈ 0.95) cân bằng bias/variance tốt nhất trong hầu hết domain.",
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
