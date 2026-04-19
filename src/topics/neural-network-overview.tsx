"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  Zap,
  Eye,
  MousePointerClick,
  RotateCcw,
  Network,
  Layers,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CollapsibleDetail,
  LessonSection,
  TopicLink,
  StepReveal,
  LaTeX,
  MatchPairs,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "neural-network-overview",
  title: "Neural Network Overview",
  titleVi: "Mạng nơ-ron là gì — bộ não nhỏ trong máy tính",
  description:
    "Nhiều nơ-ron đơn giản kết nối lại thành một mạng thông minh. Kéo slider, bấm vào từng nơ-ron, xem tín hiệu lan truyền — bạn sẽ hiểu vì sao ý tưởng này thay đổi cả thế giới AI.",
  category: "neural-fundamentals",
  tags: ["neural-network", "overview", "mlp", "deep-learning"],
  difficulty: "beginner",
  relatedSlugs: [
    "perceptron",
    "mlp",
    "activation-functions",
    "backpropagation",
  ],
  vizType: "interactive",
};

/* ═══════════════════════════════════════════════════════════════════
   KIẾN TRÚC DEMO — 2 input → 3 hidden → 2 output
   Trọng số cố định, mô phỏng mạng phân loại nhỏ.
   ═══════════════════════════════════════════════════════════════════ */

const LAYER_SIZES = [2, 3, 2] as const;
const INPUT_SIZE = LAYER_SIZES[0];
const HIDDEN_SIZE = LAYER_SIZES[1];
const OUTPUT_SIZE = LAYER_SIZES[2];

type LayerIndex = 0 | 1 | 2;

interface NeuronId {
  layer: LayerIndex;
  index: number;
}

/* Trọng số mặc định — người học có thể chỉnh trong demo. */
const DEFAULT_W1: number[][] = [
  // hidden h1 nhận (x1, x2)
  [0.8, -0.6],
  // hidden h2
  [-0.5, 0.9],
  // hidden h3
  [0.7, 0.4],
];
const DEFAULT_B1: number[] = [0.1, -0.2, 0.0];

const W2: number[][] = [
  // output y1 nhận (h1, h2, h3)
  [0.9, -0.7, 0.5],
  // output y2
  [-0.6, 0.8, 0.3],
];
const B2: number[] = [0.0, 0.1];

function relu(x: number): number {
  return x > 0 ? x : 0;
}

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

interface ForwardPass {
  input: number[];
  z1: number[];
  a1: number[];
  z2: number[];
  a2: number[];
}

function forwardPass(
  inputs: number[],
  W1: number[][],
  B1: number[],
): ForwardPass {
  const z1: number[] = [];
  const a1: number[] = [];
  for (let j = 0; j < HIDDEN_SIZE; j++) {
    let sum = B1[j];
    for (let i = 0; i < INPUT_SIZE; i++) {
      sum += W1[j][i] * inputs[i];
    }
    z1.push(+sum.toFixed(3));
    a1.push(+relu(sum).toFixed(3));
  }
  const z2: number[] = [];
  for (let k = 0; k < OUTPUT_SIZE; k++) {
    let sum = B2[k];
    for (let j = 0; j < HIDDEN_SIZE; j++) {
      sum += W2[k][j] * a1[j];
    }
    z2.push(+sum.toFixed(3));
  }
  const a2 = softmax(z2).map((v) => +v.toFixed(3));
  return { input: inputs, z1, a1, z2, a2 };
}

/* ─── Toạ độ hiển thị trên SVG ─── */
const SVG_WIDTH = 560;
const SVG_HEIGHT = 320;
const LAYER_X = [100, 280, 460] as const;

function neuronY(layer: LayerIndex, index: number): number {
  const size = LAYER_SIZES[layer];
  const step = 80;
  const total = (size - 1) * step;
  const startY = SVG_HEIGHT / 2 - total / 2;
  return startY + index * step;
}

function neuronFill(layer: LayerIndex): string {
  if (layer === 0) return "#3b82f6"; // blue — input
  if (layer === 1) return "#f59e0b"; // amber — hidden
  return "#10b981"; // green — output
}

function sameNeuron(a: NeuronId | null, b: NeuronId): boolean {
  if (!a) return false;
  return a.layer === b.layer && a.index === b.index;
}

function connectionHighlighted(
  selected: NeuronId | null,
  from: NeuronId,
  to: NeuronId,
): boolean {
  if (!selected) return false;
  if (sameNeuron(selected, from)) return true;
  if (sameNeuron(selected, to)) return true;
  return false;
}

function weightColor(w: number): string {
  const magnitude = Math.min(1, Math.abs(w));
  if (w >= 0) {
    const alpha = 0.25 + magnitude * 0.6;
    return `rgba(59, 130, 246, ${alpha.toFixed(2)})`;
  }
  const alpha = 0.25 + magnitude * 0.6;
  return `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
}

function neuronOpacity(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0.3;
  return 0.3 + 0.7 * Math.min(1, Math.abs(value) / maxValue);
}

/* ═══════════════════════════════════════════════════════════════════
   MLP PLAYGROUND — kéo input, click nơ-ron, xem output
   ═══════════════════════════════════════════════════════════════════ */

function MLPPlayground() {
  const [x1, setX1] = useState(0.6);
  const [x2, setX2] = useState(-0.4);
  const [w1, setW1] = useState<number[][]>(DEFAULT_W1.map((r) => [...r]));
  const [b1] = useState<number[]>([...DEFAULT_B1]);
  const [selected, setSelected] = useState<NeuronId | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  const inputs = useMemo<number[]>(() => [x1, x2], [x1, x2]);
  const pass = useMemo<ForwardPass>(
    () => forwardPass(inputs, w1, b1),
    [inputs, w1, b1],
  );

  const maxHidden = Math.max(0.001, ...pass.a1);
  const maxOutput = Math.max(0.001, ...pass.a2);
  const predictedClass = pass.a2[0] > pass.a2[1] ? 1 : 2;

  const handleNeuronClick = useCallback((id: NeuronId) => {
    setSelected((prev) => (sameNeuron(prev, id) ? null : id));
  }, []);

  const reset = useCallback(() => {
    setX1(0.6);
    setX2(-0.4);
    setW1(DEFAULT_W1.map((r) => [...r]));
    setSelected(null);
    setPulseKey((k) => k + 1);
  }, []);

  const updateW1 = useCallback(
    (hiddenIdx: number, inputIdx: number, value: number) => {
      setW1((prev) => {
        const next = prev.map((row) => [...row]);
        next[hiddenIdx][inputIdx] = value;
        return next;
      });
    },
    [],
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted leading-relaxed">
        Đây là một mạng nơ-ron nhỏ: <strong>2 đầu vào</strong> → 3 nơ-ron ẩn →{" "}
        <strong>2 đầu ra</strong>. Mỗi đầu ra là một xác suất &ldquo;mạng nghĩ
        dữ liệu thuộc lớp nào&rdquo;.
      </p>

      {/* ─── Input sliders ─── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MousePointerClick size={14} className="text-accent" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Bước 1 — Kéo hai đầu vào
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">
              Đầu vào x₁:{" "}
              <strong className="text-foreground font-mono tabular-nums">
                {x1.toFixed(2)}
              </strong>
            </span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={x1}
              onChange={(e) => setX1(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
              aria-label="Input x1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">
              Đầu vào x₂:{" "}
              <strong className="text-foreground font-mono tabular-nums">
                {x2.toFixed(2)}
              </strong>
            </span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={x2}
              onChange={(e) => setX2(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
              aria-label="Input x2"
            />
          </label>
        </div>
      </div>

      {/* ─── Sơ đồ mạng ─── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network size={14} className="text-accent" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Bước 2 — Bấm vào một nơ-ron để xem dây nối
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted hover:text-foreground"
          >
            <RotateCcw size={11} />
            Đặt lại
          </button>
        </div>

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full max-w-2xl mx-auto"
          role="img"
          aria-label="Sơ đồ mạng nơ-ron 2-3-2. Click nơ-ron để xem dây nối."
        >
          <text x={LAYER_X[0]} y={22} textAnchor="middle" fill="#3b82f6" fontSize={11} fontWeight="bold">Đầu vào</text>
          <text x={LAYER_X[1]} y={22} textAnchor="middle" fill="#f59e0b" fontSize={11} fontWeight="bold">Lớp ẩn (ReLU)</text>
          <text x={LAYER_X[2]} y={22} textAnchor="middle" fill="#10b981" fontSize={11} fontWeight="bold">Đầu ra (softmax)</text>

          {/* Kết nối Layer 0 → Layer 1 */}
          {Array.from({ length: INPUT_SIZE }, (_, i) =>
            Array.from({ length: HIDDEN_SIZE }, (_, j) => {
              const from: NeuronId = { layer: 0, index: i };
              const to: NeuronId = { layer: 1, index: j };
              const w = w1[j][i];
              const hi = connectionHighlighted(selected, from, to);
              return (
                <g key={`c01-${i}-${j}-${pulseKey}`}>
                  <motion.line
                    x1={LAYER_X[0] + 20}
                    y1={neuronY(0, i)}
                    x2={LAYER_X[1] - 20}
                    y2={neuronY(1, j)}
                    stroke={weightColor(w)}
                    strokeWidth={hi ? 3.5 : 1 + Math.abs(w) * 1.8}
                    opacity={hi ? 1 : 0.5}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.05 * (i * 3 + j) }}
                  />
                  {hi && (
                    <text
                      x={(LAYER_X[0] + 20 + LAYER_X[1] - 20) / 2}
                      y={(neuronY(0, i) + neuronY(1, j)) / 2 - 4}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#f59e0b"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      w = {w.toFixed(2)}
                    </text>
                  )}
                </g>
              );
            }),
          )}

          {/* Kết nối Layer 1 → Layer 2 */}
          {Array.from({ length: HIDDEN_SIZE }, (_, j) =>
            Array.from({ length: OUTPUT_SIZE }, (_, k) => {
              const from: NeuronId = { layer: 1, index: j };
              const to: NeuronId = { layer: 2, index: k };
              const w = W2[k][j];
              const hi = connectionHighlighted(selected, from, to);
              return (
                <g key={`c12-${j}-${k}-${pulseKey}`}>
                  <motion.line
                    x1={LAYER_X[1] + 20}
                    y1={neuronY(1, j)}
                    x2={LAYER_X[2] - 20}
                    y2={neuronY(2, k)}
                    stroke={weightColor(w)}
                    strokeWidth={hi ? 3.5 : 1 + Math.abs(w) * 1.8}
                    opacity={hi ? 1 : 0.5}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 + 0.05 * (j * 2 + k) }}
                  />
                  {hi && (
                    <text
                      x={(LAYER_X[1] + 20 + LAYER_X[2] - 20) / 2}
                      y={(neuronY(1, j) + neuronY(2, k)) / 2 - 4}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#f59e0b"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      w = {w.toFixed(2)}
                    </text>
                  )}
                </g>
              );
            }),
          )}

          {/* Nơ-ron cả ba lớp — dùng chung một vòng lặp */}
          {(
            [
              { layer: 0 as LayerIndex, size: INPUT_SIZE, label: "x", values: pass.input, maxVal: 1, formatOutput: false },
              { layer: 1 as LayerIndex, size: HIDDEN_SIZE, label: "h", values: pass.a1, maxVal: maxHidden, formatOutput: false },
              { layer: 2 as LayerIndex, size: OUTPUT_SIZE, label: "y", values: pass.a2, maxVal: maxOutput, formatOutput: true },
            ] as const
          ).flatMap((spec) =>
            Array.from({ length: spec.size }, (_, i) => {
              const id: NeuronId = { layer: spec.layer, index: i };
              const val = spec.values[i];
              const hi = sameNeuron(selected, id);
              const label = spec.formatOutput ? `${(val * 100).toFixed(0)}%` : val.toFixed(2);
              return (
                <g key={`n-${spec.layer}-${i}`} onClick={() => handleNeuronClick(id)} className="cursor-pointer">
                  <motion.circle
                    cx={LAYER_X[spec.layer]}
                    cy={neuronY(spec.layer, i)}
                    r={hi ? 24 : 20}
                    fill={neuronFill(spec.layer)}
                    opacity={neuronOpacity(val, spec.maxVal)}
                    stroke={hi ? "#fff" : "rgba(148,163,184,0.6)"}
                    strokeWidth={hi ? 3 : 1}
                    animate={{ r: hi ? 24 : 20 }}
                    transition={{ duration: 0.25 }}
                  />
                  <text x={LAYER_X[spec.layer]} y={neuronY(spec.layer, i) + 4} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold" className="pointer-events-none">
                    {spec.label}{i + 1}
                  </text>
                  <text x={LAYER_X[spec.layer]} y={neuronY(spec.layer, i) + 38} textAnchor="middle" fill="#94a3b8" fontSize={10} className="pointer-events-none">
                    {label}
                  </text>
                </g>
              );
            }),
          )}
        </svg>

        {/* Chú thích dây */}
        <div className="flex flex-wrap justify-center gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-1 rounded bg-blue-500" />
            Trọng số dương (thúc đẩy)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-1 rounded bg-red-500" />
            Trọng số âm (ức chế)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-1.5 rounded bg-amber-500" />
            Dây dày = trọng số lớn
          </span>
        </div>
      </div>

      {/* ─── Trọng số chỉnh được ─── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={14} className="text-accent" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Bước 3 — Thử vặn các trọng số w (lớp ẩn)
          </span>
        </div>
        <p className="text-[11px] text-muted leading-relaxed">
          Mỗi dây từ đầu vào sang nơ-ron ẩn có một con số gọi là <em>trọng số</em>.
          Trọng số lớn = ảnh hưởng mạnh. Kéo thử và quan sát phần trăm đầu ra thay
          đổi theo thời gian thực.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: HIDDEN_SIZE }, (_, j) => (
            <div
              key={`w-group-${j}`}
              className="rounded-lg border border-border bg-surface/40 p-3 space-y-2"
            >
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Nơ-ron ẩn h{j + 1}
              </div>
              {Array.from({ length: INPUT_SIZE }, (_, i) => (
                <label key={`w-${j}-${i}`} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted flex items-center justify-between">
                    <span>
                      w(x{i + 1} → h{j + 1})
                    </span>
                    <span className="font-mono tabular-nums text-foreground">
                      {w1[j][i].toFixed(2)}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={-1.5}
                    max={1.5}
                    step={0.05}
                    value={w1[j][i]}
                    onChange={(e) =>
                      updateW1(j, i, parseFloat(e.target.value))
                    }
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-amber-500"
                    aria-label={`Trọng số x${i + 1} đến h${j + 1}`}
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bảng kết quả ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold mb-2">
            Kích hoạt lớp ẩn (sau ReLU)
          </p>
          <div className="flex flex-wrap gap-2">
            {pass.a1.map((a, j) => (
              <span
                key={`ha-${j}`}
                className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-mono text-amber-700 dark:text-amber-300 tabular-nums"
              >
                h{j + 1}: {a.toFixed(2)}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted mt-2 italic">
            ReLU: giữ nguyên nếu dương, biến về 0 nếu âm.
          </p>
        </div>
        <div className="rounded-xl border-2 border-emerald-400/60 bg-emerald-50 dark:bg-emerald-900/15 p-4">
          <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold mb-2">
            Xác suất đầu ra (softmax)
          </p>
          <div className="flex flex-wrap gap-2">
            {pass.a2.map((p, k) => (
              <span
                key={`pa-${k}`}
                className={`rounded-md px-2 py-1 text-xs font-mono tabular-nums ${
                  k + 1 === predictedClass
                    ? "bg-emerald-500 text-white font-bold"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                y{k + 1}: {(p * 100).toFixed(1)}%
              </span>
            ))}
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-2 font-semibold">
            → Mạng nghĩ đây là lớp {predictedClass}
          </p>
        </div>
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-accent/40 bg-accent-light/40 p-3 text-xs leading-relaxed"
        >
          <p className="font-semibold text-foreground">
            Đang chọn:{" "}
            {selected.layer === 0
              ? `Đầu vào x${selected.index + 1}`
              : selected.layer === 1
                ? `Nơ-ron ẩn h${selected.index + 1}`
                : `Đầu ra y${selected.index + 1}`}
          </p>
          <p className="text-muted mt-1">
            Dây dày nối với nơ-ron này đã được làm nổi bật — kèm con số trọng số.
            Màu xanh dương là dương, đỏ là âm, đậm là mạnh.
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DEEPEN — StepReveal: tín hiệu đi qua từng lớp
   ═══════════════════════════════════════════════════════════════════ */

interface FlowStep {
  label: string;
  title: string;
  description: string;
  highlightLayer: LayerIndex;
  values: { label: string; value: string; tone: "blue" | "amber" | "emerald" }[];
  explain: string;
}

function SignalFlow() {
  // Dùng input cố định cho demo: x1 = 0.6, x2 = -0.4
  const inputs = [0.6, -0.4];
  const pass = forwardPass(inputs, DEFAULT_W1, DEFAULT_B1);

  const steps: FlowStep[] = [
    {
      label: "Nhận đầu vào",
      title: "Bước 1 — Hai con số đi vào",
      description:
        "Mạng nhận hai đặc trưng của dữ liệu — ví dụ kích thước và màu sắc của một bông hoa. Đây là hai cảm giác đầu tiên.",
      highlightLayer: 0,
      values: [
        { label: "x1", value: inputs[0].toFixed(2), tone: "blue" },
        { label: "x2", value: inputs[1].toFixed(2), tone: "blue" },
      ],
      explain:
        "Giống như bộ não, cảm giác đến từ các giác quan — ở đây là hai kênh dữ liệu thô.",
    },
    {
      label: "Tính lớp ẩn",
      title: "Bước 2 — Ba nơ-ron ẩn cùng &ldquo;cân&rdquo; tín hiệu",
      description:
        "Mỗi nơ-ron ẩn nhận cả hai đầu vào, nhân với trọng số riêng của nó rồi cộng lại. Con số ra đôi khi dương, đôi khi âm — phụ thuộc vào việc nơ-ron đó &ldquo;chú ý&rdquo; gì.",
      highlightLayer: 1,
      values: [
        { label: "z1 (h1)", value: pass.z1[0].toFixed(2), tone: "amber" },
        { label: "z2 (h2)", value: pass.z1[1].toFixed(2), tone: "amber" },
        { label: "z3 (h3)", value: pass.z1[2].toFixed(2), tone: "amber" },
      ],
      explain:
        "Công thức cho mỗi nơ-ron: z = w₁·x₁ + w₂·x₂ + b. Đây là phép &ldquo;cân đong&rdquo; đầu vào.",
    },
    {
      label: "Qua ReLU",
      title: "Bước 3 — Công tắc ReLU: âm thì tắt, dương thì mở",
      description:
        "Mỗi nơ-ron ẩn có một công tắc. Nếu z dương, giữ nguyên. Nếu z âm, biến về 0. Đây chính là phép &ldquo;phi tuyến&rdquo; làm mạng thông minh hơn phép nhân thông thường.",
      highlightLayer: 1,
      values: [
        { label: "a1", value: pass.a1[0].toFixed(2), tone: "amber" },
        { label: "a2", value: pass.a1[1].toFixed(2), tone: "amber" },
        { label: "a3", value: pass.a1[2].toFixed(2), tone: "amber" },
      ],
      explain:
        "ReLU(z) = max(0, z). Nơ-ron nào &ldquo;ngủ&rdquo; (a = 0) thì không đóng góp gì cho lớp sau.",
    },
    {
      label: "Đến đầu ra",
      title: "Bước 4 — Hai nơ-ron đầu ra tổng hợp ý kiến",
      description:
        "Mỗi đầu ra đọc toàn bộ ba nơ-ron ẩn, cân lại lần nữa, rồi cộng. Ra hai con số chưa chuẩn hoá.",
      highlightLayer: 2,
      values: [
        { label: "z1 (y1)", value: pass.z2[0].toFixed(2), tone: "emerald" },
        { label: "z2 (y2)", value: pass.z2[1].toFixed(2), tone: "emerald" },
      ],
      explain:
        "Vẫn là công thức quen thuộc: z = Σw·a + b. Mỗi đầu ra &ldquo;nghe&rdquo; từ cả ba nơ-ron ẩn.",
    },
    {
      label: "Softmax",
      title: "Bước 5 — Softmax biến hai con số thành xác suất",
      description:
        "Hai con số đầu ra được &ldquo;dịch&rdquo; thành hai xác suất cộng lại bằng 100%. Lớp nào phần trăm cao hơn, mạng chọn lớp đó.",
      highlightLayer: 2,
      values: [
        {
          label: "P(lớp 1)",
          value: `${(pass.a2[0] * 100).toFixed(1)}%`,
          tone: "emerald",
        },
        {
          label: "P(lớp 2)",
          value: `${(pass.a2[1] * 100).toFixed(1)}%`,
          tone: "emerald",
        },
      ],
      explain:
        "Softmax giữ số to to hơn, số bé bé đi — dễ đọc, dễ so sánh. Tổng luôn bằng 1.",
    },
  ];

  return (
    <StepReveal labels={steps.map((s) => s.label)}>
      {steps.map((step, idx) => (
        <div
          key={`flow-step-${idx}`}
          className="rounded-xl border border-border bg-surface/50 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                step.highlightLayer === 0
                  ? "bg-blue-500"
                  : step.highlightLayer === 1
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            >
              {idx + 1}
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              {step.title}
            </h4>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            {step.description}
          </p>

          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-[10px] uppercase tracking-wide text-tertiary font-semibold mb-2">
              Giá trị hiện tại
            </p>
            <div className="flex flex-wrap gap-2">
              {step.values.map((v, i) => {
                const toneClasses =
                  v.tone === "blue"
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/40"
                    : v.tone === "amber"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40"
                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40";
                return (
                  <span
                    key={`v-${idx}-${i}`}
                    className={`rounded-md border px-2.5 py-1 text-xs font-mono tabular-nums ${toneClasses}`}
                  >
                    <span className="opacity-70 mr-1">{v.label}:</span>
                    <strong>{v.value}</strong>
                  </span>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-muted italic leading-relaxed">
            {step.explain}
          </p>
        </div>
      ))}
    </StepReveal>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   QUIZ — 6 câu, pha trộn MCQ và fill-blank
   ═══════════════════════════════════════════════════════════════════ */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Mạng nơ-ron nhân tạo lấy cảm hứng từ đâu, và mô phỏng tới mức nào?",
    options: [
      "Bắt chước chính xác 100% bộ não người",
      "Lấy ý tưởng: nhiều đơn vị đơn giản kết nối với nhau. Nơ-ron nhân tạo đơn giản hơn nơ-ron sinh học rất nhiều",
      "Không liên quan gì tới bộ não",
      "Chỉ bắt chước tế bào gan",
    ],
    correct: 1,
    explanation:
      "Mạng nơ-ron chỉ vay ý tưởng: nhiều đơn vị đơn giản (nơ-ron) kết nối thành mạng thì có thể giải quyết việc phức tạp. Nơ-ron nhân tạo chỉ là phép tính đơn giản — tổng có trọng số cộng bias, rồi qua một công tắc. Sức mạnh đến từ số lượng và cách kết nối.",
  },
  {
    question: "Một nơ-ron trong mạng làm công việc gì với các đầu vào?",
    options: [
      "Cộng các đầu vào lại rồi chia cho số lượng",
      "Nhân mỗi đầu vào với một trọng số, cộng tất cả lại (cộng thêm bias), rồi cho qua hàm kích hoạt",
      "Chọn đầu vào lớn nhất và bỏ các đầu vào còn lại",
      "Gửi đầu vào sang máy chủ khác để xử lý",
    ],
    correct: 1,
    explanation:
      "Công thức cơ bản: z = w₁·x₁ + w₂·x₂ + ... + b. Sau đó a = σ(z), với σ là hàm kích hoạt (ReLU, sigmoid, tanh). Trọng số w chính là &ldquo;ý kiến&rdquo; của nơ-ron về độ quan trọng của từng đầu vào.",
  },
  {
    question: "Vì sao mạng cần có hàm kích hoạt như ReLU?",
    options: [
      "Để mạng chạy nhanh hơn",
      "Để mạng học được cả các quy luật cong (phi tuyến). Nếu không có, dù xếp chồng bao nhiêu lớp, mạng vẫn chỉ là một phép nhân ma trận duy nhất",
      "Để làm giảm số lượng trọng số",
      "Để nơ-ron nào cũng cháy",
    ],
    correct: 1,
    explanation:
      "Phép nhân ma trận xếp chồng nhau vẫn chỉ ra phép nhân ma trận. Hàm kích hoạt đưa &ldquo;khúc gãy&rdquo; (phi tuyến) vào mạch tính toán, giúp mạng học được các ranh giới cong, các quy luật phức tạp như phân biệt mèo với chó.",
  },
  {
    type: "fill-blank",
    question:
      "Tầng đầu tiên gọi là lớp đầu vào. Tầng cuối gọi là lớp đầu ra. Các tầng ở giữa gọi là lớp {blank}.",
    blanks: [
      { answer: "ẩn", accept: ["an", "hidden", "lớp ẩn"] },
    ],
    explanation:
      "Lớp ở giữa được gọi là &ldquo;lớp ẩn&rdquo; (hidden layer) vì người quan sát bên ngoài không nhìn thấy trực tiếp — họ chỉ thấy đầu vào và đầu ra. Mạng có nhiều lớp ẩn gọi là mạng &ldquo;sâu&rdquo; (deep network).",
  },
  {
    question:
      "Một mạng có 2 đầu vào, 3 nơ-ron ẩn và 2 đầu ra. Nếu bạn tăng một trọng số w(x₁ → h₂) từ 0.5 lên 1.5, điều gì sẽ xảy ra?",
    options: [
      "Không có gì thay đổi",
      "Nơ-ron h₂ sẽ nhận tín hiệu từ x₁ mạnh hơn → kéo theo các nơ-ron ở lớp đầu ra cũng thay đổi",
      "Toàn bộ mạng sẽ ngừng hoạt động",
      "Chỉ x₁ đổi giá trị",
    ],
    correct: 1,
    explanation:
      "Một trọng số thay đổi gây ra chuỗi lan truyền: h₂ đổi → z ở đầu ra đổi → xác suất softmax đổi. Đây là lý do tại sao việc huấn luyện (chỉnh trọng số) lại làm mạng hành xử khác đi.",
  },
  {
    question:
      "Softmax ở đầu ra có công dụng gì?",
    options: [
      "Làm mạng chạy chậm lại để dễ debug",
      "Biến các con số đầu ra thành các xác suất cộng lại bằng 100%, để mạng &ldquo;chọn&rdquo; được lớp có phần trăm cao nhất",
      "Xoá các nơ-ron yếu",
      "Tăng số lượng nơ-ron",
    ],
    correct: 1,
    explanation:
      "Softmax nén các con số đầu ra (có thể âm, dương, lớn, bé tuỳ ý) về một phân phối xác suất: mỗi số trong khoảng [0, 1], tổng bằng 1. Lớp có xác suất lớn nhất là lớp mạng &ldquo;đoán&rdquo;.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   NƠ-RON ẨN DỤ — hình minh hoạ một nơ-ron duy nhất
   ═══════════════════════════════════════════════════════════════════ */

function SingleNeuronIllustration() {
  return (
    <svg viewBox="0 0 360 180" className="w-full max-w-md mx-auto">
      {/* Ba input nhỏ */}
      <g>
        {[40, 90, 140].map((y, i) => (
          <g key={`in-${i}`}>
            <circle cx={40} cy={y} r={14} fill="#3b82f6" opacity={0.7} />
            <text
              x={40}
              y={y + 4}
              textAnchor="middle"
              fontSize={11}
              fill="white"
              fontWeight="bold"
            >
              x{i + 1}
            </text>
            <line
              x1={54}
              y1={y}
              x2={170}
              y2={90}
              stroke="#f59e0b"
              strokeWidth={1 + i * 0.6}
              opacity={0.7}
            />
            <text
              x={110}
              y={y + (90 - y) / 2 - 2}
              fontSize={10}
              fill="#f59e0b"
              fontWeight="bold"
              textAnchor="middle"
            >
              w{i + 1}
            </text>
          </g>
        ))}
      </g>

      {/* Nơ-ron thân */}
      <circle cx={185} cy={90} r={28} fill="#f59e0b" opacity={0.85} />
      <text
        x={185}
        y={88}
        textAnchor="middle"
        fontSize={11}
        fill="white"
        fontWeight="bold"
      >
        Σ
      </text>
      <text
        x={185}
        y={102}
        textAnchor="middle"
        fontSize={9}
        fill="white"
      >
        + b
      </text>

      {/* Mũi tên từ Σ sang công tắc ReLU */}
      <line
        x1={213}
        y1={90}
        x2={255}
        y2={90}
        stroke="#94a3b8"
        strokeWidth={2}
        markerEnd="url(#arrow)"
      />
      <defs>
        <marker
          id="arrow"
          markerWidth={6}
          markerHeight={6}
          refX={5}
          refY={3}
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 Z" fill="#94a3b8" />
        </marker>
      </defs>

      {/* Công tắc ReLU */}
      <rect x={258} y={72} width={46} height={36} rx={6} fill="#10b981" />
      <text
        x={281}
        y={95}
        textAnchor="middle"
        fontSize={11}
        fill="white"
        fontWeight="bold"
      >
        ReLU
      </text>

      {/* Output */}
      <line
        x1={304}
        y1={90}
        x2={336}
        y2={90}
        stroke="#94a3b8"
        strokeWidth={2}
      />
      <circle cx={342} cy={90} r={12} fill="#10b981" opacity={0.85} />
      <text
        x={342}
        y={94}
        textAnchor="middle"
        fontSize={10}
        fill="white"
        fontWeight="bold"
      >
        a
      </text>

      {/* Chú thích */}
      <text x={40} y={170} fontSize={10} fill="#94a3b8" textAnchor="middle">
        Đầu vào
      </text>
      <text x={185} y={170} fontSize={10} fill="#94a3b8" textAnchor="middle">
        Cộng có trọng số
      </text>
      <text x={281} y={170} fontSize={10} fill="#94a3b8" textAnchor="middle">
        Công tắc
      </text>
      <text x={342} y={170} fontSize={10} fill="#94a3b8" textAnchor="middle">
        Ra
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT CHÍNH
   ═══════════════════════════════════════════════════════════════════ */

export default function NeuralNetworkOverviewTopic() {
  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bộ não người có khoảng 86 tỷ nơ-ron, mỗi nơ-ron là một tế bào phức tạp. Mạng nơ-ron trong máy tính 'bắt chước' bộ não ở mức nào?"
          options={[
            "Sao chép chính xác từng tế bào, từng kết nối của não",
            "Chỉ vay ý tưởng lớn: nhiều đơn vị đơn giản kết nối lại. Nơ-ron nhân tạo đơn giản hơn nơ-ron thật rất nhiều",
            "Thay thế hoàn toàn bộ não sinh học",
            "Không liên quan gì tới não",
          ]}
          correct={1}
          explanation="Mạng nơ-ron chỉ vay một ý tưởng lớn: nhiều đơn vị đơn giản kết nối thành mạng thì có thể làm việc phức tạp. Nơ-ron nhân tạo chỉ là một phép cộng có trọng số, rồi qua một công tắc. Đơn giản vậy thôi — nhưng xếp hàng triệu cái lại thì ra được ChatGPT, Google Translate, Tesla Autopilot."
        >
          <div className="mt-4 rounded-xl border border-border bg-card/80 p-4 space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <Brain size={18} />
              <span className="text-sm font-semibold">
                Mạng nơ-ron = nhiều nơ-ron đơn giản kết nối thành mạng thông minh
              </span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Ở phần tiếp theo, bạn sẽ thấy một mạng nhỏ có 2 đầu vào, 3 nơ-ron ẩn
              và 2 đầu ra. Kéo slider, bấm vào nơ-ron — xem tín hiệu đi. Bạn sẽ
              hiểu bộ khung chung cho cả GPT-4, ResNet, AlphaGo — dù các mô hình đó
              có hàng tỷ nơ-ron, bộ khung vẫn là cái bạn đang học.
            </p>
          </div>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Network size={20} className="text-accent" />
            Một nơ-ron đơn lẻ giống cái gì?
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Hãy tưởng tượng một <strong>thợ cân đồ</strong>. Thợ nhận nhiều nguồn
            hàng, mỗi nguồn có độ &ldquo;tin cậy&rdquo; khác nhau. Thợ cân từng
            nguồn với độ tin cậy tương ứng, cộng lại, rồi quyết định:{" "}
            <em>&ldquo;Tổng này có đủ lớn để đáng tin không?&rdquo;</em> Nếu có —
            gửi tín hiệu đi tiếp. Nếu không — im lặng. Đó là toàn bộ công việc của
            một nơ-ron nhân tạo.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4">
            <SingleNeuronIllustration />
            <p className="text-xs text-muted text-center mt-2 italic leading-relaxed">
              Ba đầu vào × ba trọng số → cộng lại → qua công tắc ReLU → ra tín hiệu.
              Tất cả nơ-ron trong mọi mạng lớn đều chỉ làm chuyện này.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-1">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <span className="text-sm font-semibold">Đầu vào (xᵢ)</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Nguồn dữ liệu thô. Với bài phân loại hoa: có thể là kích thước
                cánh và màu sắc.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <span className="text-sm font-semibold">Trọng số (wᵢ)</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Con số &ldquo;nơ-ron tin nguồn này bao nhiêu&rdquo;. Lớn = tin
                nhiều. Âm = không thích. Đây là thứ được học.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <span className="text-sm font-semibold">Đầu ra (a)</span>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                &ldquo;Kết luận&rdquo; của nơ-ron sau khi cân nhắc. Gửi tiếp cho
                nơ-ron ở lớp sau.
              </p>
            </div>
          </div>

          <Callout variant="insight" title="Tại sao một nơ-ron đơn lẻ lại yếu?">
            Một nơ-ron chỉ vẽ được đúng một đường thẳng trong không gian dữ liệu.
            Nhưng xếp ba nơ-ron song song ở một lớp, rồi ghép nhiều lớp chồng lên
            nhau — bạn có một mạng có thể uốn cong, xoắn, vẽ biên giới phức tạp
            quanh bất cứ đám dữ liệu nào. Sức mạnh đến từ{" "}
            <strong>cách kết nối</strong>, không phải từ mỗi nơ-ron.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TRỰC QUAN HOÁ TƯƠNG TÁC ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <MLPPlayground />
          <div className="mt-5 space-y-3">
            <Callout variant="insight" title="Điều bạn vừa thấy trên màn hình">
              Mỗi lần bạn kéo slider x₁ hoặc x₂, hai con số đó đi qua 6 dây (2 ×
              3) sang ba nơ-ron ẩn. Mỗi nơ-ron ẩn cân, cộng, qua công tắc, rồi
              gửi tiếp qua 6 dây nữa (3 × 2) đến hai nơ-ron đầu ra. Chỉ có{" "}
              <strong>phép nhân và phép cộng</strong> — không có phép màu.
            </Callout>
            <Callout variant="tip" title="Thử thêm: vặn trọng số w">
              Ở phần &ldquo;Bước 3&rdquo; bạn có 6 slider w. Vặn thử một cái về
              âm rất sâu — bạn sẽ thấy một nơ-ron ẩn &ldquo;tắt&rdquo; hẳn (ReLU
              cắt âm về 0), và xác suất đầu ra thay đổi mạnh. Đây chính là cách
              huấn luyện thay đổi hành vi của mạng: chỉ đổi trọng số, không đổi
              kiến trúc.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          <p>
            Mạng nơ-ron chỉ là <strong>phép nhân và phép cộng</strong>, xếp thành
            nhiều lớp, xen kẽ với một vài &ldquo;công tắc&rdquo; (như ReLU). Mọi{" "}
            <em>trí tuệ</em> nằm trong các con số trọng số — không nằm trong cấu
            trúc phức tạp.
          </p>
          <p className="mt-3">
            Sức mạnh đến từ <strong>số lượng và cách kết nối</strong>: một nơ-ron
            yếu, một triệu nơ-ron kết nối khéo thì viết được thơ, dịch được tiếng,
            chơi được cờ vây.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — ĐI SÂU ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Đi sâu">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
          <Layers size={18} className="text-accent" />
          Tín hiệu đi qua mạng như thế nào? — Năm chặng
        </h3>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Cùng &ldquo;đi theo&rdquo; hai con số đầu vào{" "}
          <span className="font-mono text-foreground">x₁ = 0.6, x₂ = −0.4</span>{" "}
          xem chúng biến đổi thành hai phần trăm đầu ra thế nào. Bấm{" "}
          <em>Tiếp tục</em> để mở từng chặng.
        </p>
        <SignalFlow />
      </LessonSection>

      {/* ━━━ BƯỚC 6 — THỬ THÁCH ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Một nơ-ron có đầu vào x₁ = 2, x₂ = -1. Trọng số w₁ = 0.5, w₂ = 1. Bias b = 0. Giá trị z trước ReLU là bao nhiêu?"
          options={[
            "z = 0.5 × 2 + 1 × (-1) + 0 = 0",
            "z = 0.5 + 1 = 1.5",
            "z = 2 × (-1) = -2",
            "z = 3 (chỉ cộng đầu vào)",
          ]}
          correct={0}
          explanation="Công thức: z = w₁·x₁ + w₂·x₂ + b = 0.5·2 + 1·(-1) + 0 = 1 + (-1) + 0 = 0. Sau ReLU, a = max(0, 0) = 0 — nơ-ron này 'ngủ' ở ca này."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Một mạng có 2 đầu vào → 3 nơ-ron ẩn → 2 đầu ra (không có bias). Bạn cần bao nhiêu trọng số tổng cộng?"
            options={[
              "5 trọng số (2 + 3)",
              "7 trọng số (2 × 3 + 2 − 1)",
              "12 trọng số (2 × 3 cho lớp ẩn, cộng 3 × 2 cho lớp ra)",
              "6 trọng số (chỉ đếm một chiều)",
            ]}
            correct={2}
            explanation="Mỗi đầu vào nối tới từng nơ-ron ẩn → 2 × 3 = 6. Mỗi nơ-ron ẩn nối tới từng đầu ra → 3 × 2 = 6. Tổng 12 trọng số. Nếu có bias thì cộng thêm 3 + 2 = 5 bias nữa (bỏ qua ở đây)."
          />
        </div>

        <div className="mt-4">
          <InlineChallenge
            question="Nếu xoá hết hàm kích hoạt ReLU khỏi mạng, chuyện gì sẽ xảy ra?"
            options={[
              "Mạng chạy nhanh hơn, không vấn đề gì",
              "Mạng vẫn học được các quy luật cong như trước",
              "Toàn bộ mạng, dù có bao nhiêu lớp, tương đương một phép nhân ma trận duy nhất — chỉ học được đường thẳng",
              "Mạng tự tạo ra ReLU mới",
            ]}
            correct={2}
            explanation="Không có phi tuyến, phép nhân ma trận xếp chồng nhau vẫn ra một phép nhân ma trận. Mạng sẽ mất toàn bộ khả năng học quy luật cong. ReLU (hay tanh, sigmoid) tạo ra các 'khúc gãy' giúp mạng uốn cong không gian dữ liệu."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — GIẢI THÍCH ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Bạn đã thấy một mạng nhỏ hoạt động. Giờ gom lại thành hai công thức
            cốt lõi — đủ để hiểu mọi mạng nơ-ron, từ mạng nhỏ bạn vừa chơi cho
            đến GPT-4 với cả nghìn tỷ trọng số.
          </p>

          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            1. Một nơ-ron: cộng có trọng số rồi qua công tắc
          </h4>
          <LaTeX block>
            {"z = \\sum_{i} w_i \\cdot x_i + b \\quad \\Longrightarrow \\quad a = \\sigma(z)"}
          </LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc đơn giản: &ldquo;lấy từng đầu vào nhân với trọng số của nó, cộng
            tất cả lại, thêm bias b, rồi cho qua một hàm σ&rdquo;. Hàm σ có thể
            là ReLU (nếu dương giữ nguyên, âm về 0), sigmoid (ép về khoảng 0–1),
            hoặc tanh (ép về khoảng −1–+1). Trong ba hàm, ReLU là &ldquo;ngôi
            sao&rdquo; vì đơn giản và học nhanh.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-2">
              Hình hoá ReLU — công tắc &ldquo;âm thì tắt&rdquo;
            </p>
            <svg viewBox="0 0 300 150" className="w-full max-w-xs mx-auto">
              <line x1={20} y1={120} x2={280} y2={120} stroke="currentColor" className="text-muted" strokeWidth={1} />
              <line x1={150} y1={20} x2={150} y2={130} stroke="currentColor" className="text-muted" strokeWidth={1} />
              <line x1={20} y1={120} x2={150} y2={120} stroke="#ef4444" strokeWidth={3} />
              <line x1={150} y1={120} x2={270} y2={30} stroke="#10b981" strokeWidth={3} />
              <text x={75} y={135} fontSize={10} fill="#ef4444" textAnchor="middle">z &lt; 0 → a = 0 (tắt)</text>
              <text x={210} y={135} fontSize={10} fill="#10b981" textAnchor="middle">z &gt; 0 → a = z (mở)</text>
              <text x={155} y={18} fontSize={10} fill="currentColor" className="text-muted">a</text>
              <text x={275} y={128} fontSize={10} fill="currentColor" className="text-muted">z</text>
            </svg>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            2. Cả một lớp cùng lúc: phép nhân ma trận
          </h4>
          <LaTeX block>
            {"\\mathbf{a}^{(l)} = \\sigma\\!\\left( W^{(l)} \\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)} \\right)"}
          </LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc đơn giản: &ldquo;đầu ra của lớp l bằng ma trận trọng số W nhân
            với đầu ra lớp trước, cộng bias, rồi qua hàm kích hoạt&rdquo;. Thay
            vì tính từng nơ-ron một, máy tính làm cả lớp trong một phép nhân ma
            trận — nhanh gấp nghìn lần trên GPU. Đây cũng là lý do card đồ hoạ
            NVIDIA bỗng dưng trở thành đế chế AI: chúng giỏi nhân ma trận.
          </p>

          <Callout variant="tip" title="Đếm trọng số của một mạng">
            Lớp có n_in đầu vào và n_out đầu ra thì có n_in × n_out trọng số,
            cộng thêm n_out bias. Một mạng 2 → 3 → 2 (giống demo) có: (2×3 + 3) +
            (3×2 + 2) = 9 + 8 = 17 tham số. GPT-4 có khoảng 1.8 nghìn tỷ tham số
            — gấp hơn 100 tỷ lần mạng nhỏ bạn vừa chơi!
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Các loại mạng nơ-ron thường gặp
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            <div className="rounded-xl border-l-4 border-l-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 space-y-1">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                MLP — Multi-Layer Perceptron
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Kiểu bạn vừa thấy: các lớp &ldquo;đầy đủ&rdquo; (mỗi nơ-ron nối
                với tất cả nơ-ron lớp sau). Tốt cho dữ liệu bảng.
              </p>
            </div>
            <div className="rounded-xl border-l-4 border-l-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                CNN — Convolutional
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Thêm phép tích chập, quét &ldquo;ô vuông nhỏ&rdquo; trên ảnh. Tốt
                cho ảnh, video. ResNet, YOLO thuộc loại này.
              </p>
            </div>
            <div className="rounded-xl border-l-4 border-l-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-1">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                RNN / LSTM
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Nơ-ron có &ldquo;trí nhớ&rdquo;, đọc chuỗi từ trái sang phải.
                Từng là vua xử lý ngôn ngữ trước Transformer.
              </p>
            </div>
            <div className="rounded-xl border-l-4 border-l-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 space-y-1">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Transformer
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Kiến trúc đứng sau GPT, Gemini, Claude. Nơ-ron có thể &ldquo;chú
                ý&rdquo; đến bất kỳ phần nào của đầu vào.
              </p>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            Ghép mỗi khái niệm với ý nghĩa
          </h4>
          <MatchPairs
            instruction="Ghép mỗi thuật ngữ với lời giải thích dễ hiểu nhất."
            pairs={[
              {
                left: "Trọng số (weight)",
                right: "Con số đo &ldquo;nơ-ron tin đầu vào này bao nhiêu&rdquo;",
              },
              {
                left: "Bias",
                right: "Con số cộng thêm để nơ-ron dễ kích hoạt hơn hoặc khó hơn",
              },
              {
                left: "Lớp ẩn (hidden layer)",
                right: "Các lớp ở giữa mà người bên ngoài không nhìn thấy trực tiếp",
              },
              {
                left: "Hàm kích hoạt",
                right: "Công tắc phi tuyến — chặn giá trị âm hoặc ép về khoảng nhất định",
              },
              {
                left: "Softmax",
                right: "Biến các con số đầu ra thành xác suất cộng lại bằng 100%",
              },
            ]}
          />

          <Callout variant="warning" title="Hai điều thường gây nhầm lẫn">
            <p>
              <strong>Một:</strong> &ldquo;Mạng nơ-ron&rdquo; KHÔNG phải phiên
              bản số hoá của bộ não. Nó chỉ là phép toán cộng-nhân xếp chồng. Từ
              &ldquo;nơ-ron&rdquo; là tên mượn.
            </p>
            <p className="mt-2">
              <strong>Hai:</strong> Mạng <em>sâu hơn</em> không có nghĩa là{" "}
              <em>thông minh hơn</em>. Nhiều lớp có thể dẫn đến vấn đề{" "}
              &ldquo;gradient biến mất&rdquo;. Các kỹ thuật như ResNet, batch
              norm ra đời để chữa chuyện này.
            </p>
          </Callout>

          <CollapsibleDetail title="Mạng học như thế nào? (xem nhanh)">
            <p className="text-sm leading-relaxed">
              Bài này tập trung vào <em>mạng nơ-ron là gì</em>, không phải cách
              mạng học. Nhưng tóm tắt một dòng để bạn có bức tranh chung:{" "}
              <strong>
                mạng bắt đầu với trọng số ngẫu nhiên, chạy thử, so với đáp án đúng,
                rồi tự điều chỉnh trọng số theo hướng giảm sai
              </strong>{" "}
              — lặp hàng triệu lần. Quá trình tính &ldquo;hướng giảm sai&rdquo;
              gọi là{" "}
              <TopicLink slug="backpropagation">lan truyền ngược</TopicLink>, và
              cách bước đi gọi là &ldquo;gradient descent&rdquo;.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Vì sao nhiều lớp lại cần hàm kích hoạt?">
            <p className="text-sm leading-relaxed">
              Toán học: hợp của hai phép tuyến tính vẫn là một phép tuyến tính. W₂
              × (W₁ × x + b₁) + b₂ = (W₂W₁) × x + (W₂b₁ + b₂). Dù bạn xếp 100 lớp
              chồng nhau, kết quả cuối cùng chỉ tương đương một lớp tuyến tính
              duy nhất. Phi tuyến (ReLU, tanh, sigmoid) phá vỡ tính chất này —
              giúp mạng có thể &ldquo;uốn cong&rdquo; không gian dữ liệu và học
              quy luật phức tạp.
            </p>
          </CollapsibleDetail>

          <p className="mt-4 leading-relaxed">
            Mạng nơ-ron không chỉ nằm trong máy học lý thuyết — nó đang chạy mỗi
            lần bạn hỏi Siri, dùng Google Dịch, mở khoá iPhone bằng khuôn mặt.
            Bước tiếp theo: đọc{" "}
            <TopicLink slug="perceptron">perceptron</TopicLink> để hiểu nơ-ron
            đơn lẻ sâu hơn, hoặc{" "}
            <TopicLink slug="activation-functions">hàm kích hoạt</TopicLink> để
            biết ReLU, sigmoid, tanh khác nhau thế nào.
          </p>

          <div className="rounded-xl border border-accent/30 bg-accent-light/30 p-4 my-3">
            <div className="flex items-center gap-2 mb-2 text-accent">
              <Sparkles size={16} />
              <span className="text-sm font-semibold">Một dòng ngàn vàng</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed italic">
              &ldquo;Mạng nơ-ron = nhiều phép nhân ma trận + vài công tắc phi
              tuyến, lặp đi lặp lại. Trí thông minh nằm trong các con số trọng
              số, được học từ dữ liệu.&rdquo;
            </p>
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt & Kiểm tra">
        <MiniSummary
          title="5 điều cần nhớ về mạng nơ-ron"
          points={[
            "Mạng nơ-ron = nhiều nơ-ron đơn giản xếp thành lớp, kết nối với nhau. Ý tưởng vay từ bộ não, nhưng đơn giản hơn rất nhiều.",
            "Mỗi nơ-ron chỉ làm một việc: nhân các đầu vào với trọng số, cộng lại, thêm bias, rồi qua một công tắc (hàm kích hoạt).",
            "Một lớp được tính đồng thời bằng phép nhân ma trận — đó là lý do GPU (giỏi nhân ma trận) chạy AI nhanh hơn CPU nhiều lần.",
            "Hàm kích hoạt phi tuyến (ReLU, sigmoid, tanh) là bắt buộc — không có nó, dù bao nhiêu lớp cũng chỉ học được đường thẳng.",
            "Softmax ở đầu ra biến các con số thành xác suất — mạng 'chọn' lớp có xác suất cao nhất.",
          ]}
        />

        <div className="mt-6">
          <Callout variant="tip" title="Xem ứng dụng thực tế">
            Muốn xem mạng nơ-ron hoạt động trong sản phẩm bạn dùng hàng ngày?
            &ldquo;Hey Siri&rdquo; và &ldquo;OK Google&rdquo; dùng đúng ý tưởng
            này để biến giọng nói của bạn thành văn bản. Xem tiếp:{" "}
            <TopicLink slug="neural-network-overview-in-voice-assistants">
              Mạng nơ-ron trong trợ lý giọng nói
            </TopicLink>
            .
          </Callout>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted">
          <Eye size={12} />
          <span>
            Trước khi chuyển, kiểm tra nhanh xem bạn đã hiểu đến đâu — sáu câu
            ngắn, mất khoảng hai phút.
          </span>
        </div>

        <div className="mt-4">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
