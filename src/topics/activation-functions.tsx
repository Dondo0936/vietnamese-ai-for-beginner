"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Waves,
  Zap,
  Droplet,
  Layers3,
  PackageOpen,
  TrendingDown,
  AlertTriangle,
  Sparkles as SparkIcon,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  CollapsibleDetail,
  StepReveal,
  TabView,
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "activation-functions",
  title: "Activation Functions",
  titleVi: "Hàm kích hoạt — Cái uốn cong của mạng nơ-ron",
  description:
    "Không có hàm kích hoạt, cả một mạng nơ-ron chỉ là một phép tính tuyến tính khổng lồ. Kéo, thử, so sánh để thấy vì sao 5 đường cong nhỏ lại thay đổi mọi thứ.",
  category: "neural-fundamentals",
  tags: ["neural-network", "fundamentals", "activation", "non-linearity"],
  difficulty: "beginner",
  relatedSlugs: [
    "perceptron",
    "mlp",
    "vanishing-exploding-gradients",
    "activation-functions-in-alphago",
  ],
  vizType: "interactive",
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU & HÀM TOÁN
   ──────────────────────────────────────────────────────────── */

type ActKey = "relu" | "sigmoid" | "tanh" | "leaky" | "softmax";

interface ActivationMeta {
  key: ActKey;
  label: string;
  shortVi: string;
  color: string;
  rangeVi: string;
  whenVi: string;
}

const ACT_META: Record<ActKey, ActivationMeta> = {
  relu: {
    key: "relu",
    label: "ReLU",
    shortVi: "Cắt thẳng ở 0 — âm thành 0, dương giữ nguyên",
    color: "#22c55e",
    rangeVi: "[0, +∞)",
    whenVi: "Mặc định cho lớp ẩn của CNN, MLP, ResNet",
  },
  sigmoid: {
    key: "sigmoid",
    label: "Sigmoid",
    shortVi: "Bóp mọi số về khoảng 0 tới 1, hình chữ S",
    color: "#3b82f6",
    rangeVi: "(0, 1)",
    whenVi: "Đầu ra nhị phân, cổng trong LSTM",
  },
  tanh: {
    key: "tanh",
    label: "Tanh",
    shortVi: "Bóp về khoảng −1 tới 1, đối xứng quanh 0",
    color: "#f59e0b",
    rangeVi: "(−1, 1)",
    whenVi: "Trạng thái ứng viên trong RNN, LSTM",
  },
  leaky: {
    key: "leaky",
    label: "Leaky ReLU",
    shortVi: "ReLU nhưng vùng âm rò rỉ một chút",
    color: "#ef4444",
    rangeVi: "(−∞, +∞)",
    whenVi: "Khi ReLU bắt đầu có nơ-ron chết",
  },
  softmax: {
    key: "softmax",
    label: "Softmax",
    shortVi: "Biến nhiều điểm số thành xác suất cộng lại bằng 1",
    color: "#8b5cf6",
    rangeVi: "(0, 1), tổng = 1",
    whenVi: "Lớp đầu ra của bài toán phân loại đa lớp",
  },
};

function relu(x: number): number {
  return Math.max(0, x);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function tanh(x: number): number {
  return Math.tanh(x);
}

function leaky(x: number): number {
  return x > 0 ? x : 0.01 * x;
}

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function scalarActivation(name: ActKey, x: number): number {
  if (name === "relu") return relu(x);
  if (name === "sigmoid") return sigmoid(x);
  if (name === "tanh") return tanh(x);
  if (name === "leaky") return leaky(x);
  // softmax của một giá trị đơn lẻ không có ý nghĩa — trả về sigmoid để giữ đường mượt
  return sigmoid(x);
}

/* ────────────────────────────────────────────────────────────
   Toạ độ SVG
   ──────────────────────────────────────────────────────────── */

const SVG_W = 360;
const SVG_H = 200;
const PAD = 28;
const X_MIN = -5;
const X_MAX = 5;

function xToPx(x: number): number {
  return PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (SVG_W - 2 * PAD);
}

function yToPx(y: number, yMin: number, yMax: number): number {
  return SVG_H - PAD - ((y - yMin) / (yMax - yMin)) * (SVG_H - 2 * PAD);
}

function buildCurve(
  fn: (x: number) => number,
  yMin: number,
  yMax: number,
): string {
  const pts: string[] = [];
  const samples = 160;
  for (let i = 0; i <= samples; i++) {
    const x = X_MIN + (i / samples) * (X_MAX - X_MIN);
    const y = fn(x);
    const clamped = Math.max(yMin, Math.min(yMax, y));
    pts.push(`${xToPx(x).toFixed(2)},${yToPx(clamped, yMin, yMax).toFixed(2)}`);
  }
  return pts.join(" ");
}

function yRangeFor(name: ActKey): [number, number] {
  if (name === "relu" || name === "leaky") return [-1.5, 5];
  return [-1.5, 1.5];
}

/* ────────────────────────────────────────────────────────────
   Khung vẽ duy nhất
   ──────────────────────────────────────────────────────────── */

interface CurvePanelProps {
  actKey: ActKey;
  inputX: number;
}

function CurvePanel({ actKey, inputX }: CurvePanelProps) {
  const meta = ACT_META[actKey];
  const [yMin, yMax] = yRangeFor(actKey);
  const curve = useMemo(
    () => buildCurve((x) => scalarActivation(actKey, x), yMin, yMax),
    [actKey, yMin, yMax],
  );

  const outY = scalarActivation(actKey, inputX);
  const outYClamped = Math.max(yMin, Math.min(yMax, outY));

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-semibold"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
        <span className="text-[11px] text-tertiary">
          Miền giá trị: {meta.rangeVi}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Đồ thị ${meta.label}, đầu vào x = ${inputX.toFixed(1)} cho đầu ra ${outY.toFixed(3)}`}
      >
        {/* Trục */}
        <line
          x1={PAD}
          y1={yToPx(0, yMin, yMax)}
          x2={SVG_W - PAD}
          y2={yToPx(0, yMin, yMax)}
          stroke="var(--border)"
          strokeWidth={1}
        />
        <line
          x1={xToPx(0)}
          y1={PAD}
          x2={xToPx(0)}
          y2={SVG_H - PAD}
          stroke="var(--border)"
          strokeWidth={1}
        />
        {[-4, -2, 2, 4].map((v) => (
          <g key={v}>
            <line
              x1={xToPx(v)}
              y1={yToPx(0, yMin, yMax) - 3}
              x2={xToPx(v)}
              y2={yToPx(0, yMin, yMax) + 3}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={xToPx(v)}
              y={yToPx(0, yMin, yMax) + 14}
              textAnchor="middle"
              fontSize={9}
              fill="var(--text-tertiary)"
            >
              {v}
            </text>
          </g>
        ))}
        {/* Đường cong */}
        <polyline
          points={curve}
          fill="none"
          stroke={meta.color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* Đường chiếu từ x tới đường cong */}
        <line
          x1={xToPx(inputX)}
          y1={yToPx(0, yMin, yMax)}
          x2={xToPx(inputX)}
          y2={yToPx(outYClamped, yMin, yMax)}
          stroke={meta.color}
          strokeWidth={1}
          strokeDasharray="3,3"
          opacity={0.5}
        />
        {/* Điểm di chuyển */}
        <motion.circle
          cx={xToPx(inputX)}
          cy={yToPx(outYClamped, yMin, yMax)}
          r={6}
          fill={meta.color}
          stroke="white"
          strokeWidth={2}
          initial={false}
          animate={{
            cx: xToPx(inputX),
            cy: yToPx(outYClamped, yMin, yMax),
          }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        />
      </svg>
      <div className="rounded-lg bg-card border border-border px-3 py-2 text-xs text-foreground/85 flex items-center justify-between">
        <span>
          f({inputX.toFixed(2)}) ={" "}
          <strong style={{ color: meta.color }}>{outY.toFixed(3)}</strong>
        </span>
        <span className="text-tertiary">{meta.shortVi}</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Softmax — thanh xác suất
   ──────────────────────────────────────────────────────────── */

const SOFTMAX_CLASSES = ["chó", "mèo", "cá", "chim"];

interface SoftmaxPanelProps {
  logits: number[];
  setLogit: (idx: number, value: number) => void;
}

function SoftmaxPanel({ logits, setLogit }: SoftmaxPanelProps) {
  const probs = softmax(logits);
  const meta = ACT_META.softmax;

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: meta.color }}>
          Softmax — biến điểm số thành xác suất
        </span>
        <span className="text-[11px] text-tertiary">Miền: {meta.rangeVi}</span>
      </div>
      <p className="text-xs text-muted leading-relaxed">
        Hãy tưởng tượng mô hình vừa nhìn một tấm ảnh và đưa ra bốn{" "}
        <strong>điểm số thô</strong> (logit) cho bốn lớp. Kéo từng thanh để đổi
        điểm số, và xem softmax biến chúng thành{" "}
        <strong>xác suất cộng lại bằng 1</strong> như thế nào.
      </p>
      <div className="space-y-3">
        {SOFTMAX_CLASSES.map((name, i) => (
          <div key={name} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-foreground/80">
              <span>
                Lớp <strong>{name}</strong> — điểm số z
                <sub>{i + 1}</sub> ={" "}
                <span className="tabular-nums">{logits[i].toFixed(1)}</span>
              </span>
              <span
                className="font-mono font-bold"
                style={{ color: meta.color }}
              >
                {(probs[i] * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={-3}
              max={5}
              step={0.1}
              value={logits[i]}
              onChange={(e) => setLogit(i, parseFloat(e.target.value))}
              className="w-full accent-accent"
              aria-label={`Logit cho lớp ${name}`}
            />
            <div className="h-3 rounded-full bg-card overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: meta.color, opacity: 0.85 }}
                initial={false}
                animate={{ width: `${probs[i] * 100}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-tertiary border-t border-border pt-2">
        <span>
          Tổng bốn xác suất:{" "}
          <strong className="text-foreground">
            {probs.reduce((a, b) => a + b, 0).toFixed(3)}
          </strong>
        </span>
        <span>
          Dự đoán:{" "}
          <strong className="text-foreground">
            {SOFTMAX_CLASSES[probs.indexOf(Math.max(...probs))]}
          </strong>
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   So sánh 4 hàm phi-softmax trên cùng một đầu vào
   ──────────────────────────────────────────────────────────── */

const SIDE_KEYS: ActKey[] = ["relu", "sigmoid", "tanh", "leaky"];

interface SideBySideProps {
  inputX: number;
}

function SideBySide({ inputX }: SideBySideProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SIDE_KEYS.map((k) => (
        <CurvePanel key={k} actKey={k} inputX={inputX} />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Biên giới quyết định: tuyến tính vs phi tuyến
   ──────────────────────────────────────────────────────────── */

interface Point {
  x: number;
  y: number;
  cls: 0 | 1;
}

const XOR_POINTS: Point[] = [
  { x: 0.2, y: 0.2, cls: 0 },
  { x: 0.3, y: 0.25, cls: 0 },
  { x: 0.25, y: 0.15, cls: 0 },
  { x: 0.8, y: 0.8, cls: 0 },
  { x: 0.75, y: 0.85, cls: 0 },
  { x: 0.85, y: 0.75, cls: 0 },
  { x: 0.2, y: 0.8, cls: 1 },
  { x: 0.15, y: 0.85, cls: 1 },
  { x: 0.25, y: 0.75, cls: 1 },
  { x: 0.8, y: 0.2, cls: 1 },
  { x: 0.85, y: 0.15, cls: 1 },
  { x: 0.75, y: 0.25, cls: 1 },
];

function BoundaryPanel({ variant }: { variant: "linear" | "nonlinear" }) {
  const W = 280;
  const H = 280;
  const scale = (v: number) => v * W;

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {variant === "linear"
            ? "Mạng chỉ có lớp tuyến tính"
            : "Mạng có thêm hàm kích hoạt phi tuyến"}
        </span>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full"
          style={{
            backgroundColor:
              variant === "linear" ? "#ef444422" : "#22c55e22",
            color: variant === "linear" ? "#ef4444" : "#22c55e",
          }}
        >
          {variant === "linear" ? "Hỏng" : "Đúng"}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto rounded-md bg-card"
      >
        {/* Lưới nhẹ */}
        {[0.25, 0.5, 0.75].map((g) => (
          <g key={g}>
            <line
              x1={scale(g)}
              y1={0}
              x2={scale(g)}
              y2={H}
              stroke="var(--border)"
              strokeWidth={0.5}
              opacity={0.4}
            />
            <line
              x1={0}
              y1={scale(g)}
              x2={W}
              y2={scale(g)}
              stroke="var(--border)"
              strokeWidth={0.5}
              opacity={0.4}
            />
          </g>
        ))}

        {/* Vùng màu theo mô hình */}
        {variant === "linear" ? (
          <>
            <rect
              x={0}
              y={0}
              width={W / 2}
              height={H}
              fill="#3b82f6"
              opacity={0.08}
            />
            <rect
              x={W / 2}
              y={0}
              width={W / 2}
              height={H}
              fill="#f59e0b"
              opacity={0.08}
            />
            <line
              x1={W / 2}
              y1={0}
              x2={W / 2}
              y2={H}
              stroke="#64748b"
              strokeDasharray="5,4"
              strokeWidth={1.5}
            />
          </>
        ) : (
          <>
            {/* Bốn góc nhận hai màu xen kẽ — vùng quyết định phi tuyến */}
            <rect
              x={0}
              y={0}
              width={W / 2}
              height={H / 2}
              fill="#3b82f6"
              opacity={0.1}
            />
            <rect
              x={W / 2}
              y={H / 2}
              width={W / 2}
              height={H / 2}
              fill="#3b82f6"
              opacity={0.1}
            />
            <rect
              x={W / 2}
              y={0}
              width={W / 2}
              height={H / 2}
              fill="#f59e0b"
              opacity={0.1}
            />
            <rect
              x={0}
              y={H / 2}
              width={W / 2}
              height={H / 2}
              fill="#f59e0b"
              opacity={0.1}
            />
            <path
              d={`M 0 ${H / 2} Q ${W / 4} ${H * 0.2}, ${W / 2} ${H / 2} T ${W} ${H / 2}`}
              stroke="#10b981"
              strokeWidth={2}
              fill="none"
            />
            <path
              d={`M ${W / 2} 0 Q ${W * 0.6} ${H / 4}, ${W / 2} ${H / 2} T ${W / 2} ${H}`}
              stroke="#10b981"
              strokeWidth={2}
              fill="none"
              opacity={0.6}
            />
          </>
        )}

        {/* Điểm dữ liệu */}
        {XOR_POINTS.map((p, i) => (
          <circle
            key={i}
            cx={scale(p.x)}
            cy={scale(1 - p.y)}
            r={6}
            fill={p.cls === 0 ? "#3b82f6" : "#f59e0b"}
            stroke="white"
            strokeWidth={1.5}
          />
        ))}
      </svg>
      <p className="text-[11px] text-muted leading-relaxed">
        {variant === "linear"
          ? "Chỉ được kẻ một đường thẳng — không thể tách hai nhóm xen kẽ. Dù xếp bao nhiêu lớp cũng vẫn là một đường thẳng."
          : "Thêm hàm kích hoạt sau mỗi lớp — mạng uốn được đường ranh giới cong, ôm được cấu hình xen kẽ này."}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Vanishing gradient — chồng 8 lớp sigmoid
   ──────────────────────────────────────────────────────────── */

interface SigmoidChainProps {
  startX: number;
  depth: number;
}

function SigmoidChain({ startX, depth }: SigmoidChainProps) {
  const values: number[] = [startX];
  let v = startX;
  for (let i = 0; i < depth; i++) {
    v = sigmoid(v);
    values.push(v);
  }
  const finalGrad = Math.pow(0.25, depth);

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
      <p className="text-xs text-muted leading-relaxed">
        Nếu bạn đưa đầu vào x qua sigmoid{" "}
        <strong>{depth} lần liên tiếp</strong>, kết quả luôn nén về gần 0,5 —
        và gradient đi ngược lại qua {depth} lớp bị nhân với một con số cực
        nhỏ.
      </p>
      <div className="flex items-end gap-1 overflow-x-auto">
        {values.map((val, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1 shrink-0 min-w-[52px]"
          >
            <span
              className="text-[10px] tabular-nums"
              style={{
                color:
                  i > 0 && Math.abs(val - 0.5) < 0.02
                    ? "#ef4444"
                    : "var(--text-tertiary)",
              }}
            >
              {val.toFixed(3)}
            </span>
            <div
              className="w-6 rounded-t-sm"
              style={{
                height: `${Math.max(4, Math.abs(val) * 60)}px`,
                backgroundColor:
                  i === 0
                    ? "#8b5cf6"
                    : Math.abs(val - 0.5) < 0.02
                      ? "#ef4444"
                      : "#3b82f6",
                opacity: 1 - (i / (values.length + 1)) * 0.4,
              }}
            />
            <span className="text-[10px] text-tertiary">
              {i === 0 ? "x" : `σ${i}`}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-md bg-card border border-border px-3 py-2 text-xs leading-relaxed">
        Đạo hàm cực đại của sigmoid là{" "}
        <strong className="text-amber-600 dark:text-amber-400">0,25</strong>.
        Sau {depth} lớp, gradient bị nhân với{" "}
        <strong className="text-red-500">0,25^{depth} ≈ {finalGrad.toExponential(2)}</strong>
        . Đây là lý do mạng sâu dùng sigmoid gần như không học được — hiện
        tượng <em>vanishing gradient</em>.
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   QUIZ
   ──────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Không có hàm kích hoạt, một mạng nơ-ron 100 lớp sẽ tương đương với điều gì?",
    options: [
      "100 lớp khác nhau — mỗi lớp đóng góp một phần",
      "50 lớp tuyến tính cộng với 50 lớp phi tuyến",
      "Đúng một lớp tuyến tính — tất cả rút gọn thành một phép nhân ma trận",
      "Không có gì đặc biệt — vẫn học được mọi thứ",
    ],
    correct: 2,
    explanation:
      "Nhân nhiều ma trận luôn cho một ma trận khác. Dù có 1 000 lớp tuyến tính, kết quả vẫn là một phép biến đổi tuyến tính duy nhất — không thể uốn cong đường ranh giới.",
  },
  {
    question:
      "Vì sao sigmoid gây hiện tượng triệt tiêu gradient (vanishing gradient) trong mạng sâu?",
    options: [
      "Vì sigmoid chậm hơn ReLU",
      "Vì đạo hàm cực đại của sigmoid là 0,25, nhân qua nhiều lớp khiến gradient co về gần 0",
      "Vì sigmoid không có đạo hàm tại x = 0",
      "Vì sigmoid luôn trả về số âm",
    ],
    correct: 1,
    explanation:
      "σ'(x) = σ(x)·(1−σ(x)), đạt cực đại 0,25 tại x = 0. Xếp 10 lớp sigmoid ⇒ gradient bị nhân với (0,25)^10 ≈ 10⁻⁶. Cực kỳ nhỏ — các lớp đầu gần như không cập nhật được.",
  },
  {
    type: "fill-blank",
    question:
      "ReLU(x) = max(0, x). Với x = −2, ReLU trả về {blank}. Với x = 3, ReLU trả về {blank}.",
    blanks: [
      { answer: "0", accept: ["0.0"] },
      { answer: "3", accept: ["3.0"] },
    ],
    explanation:
      "ReLU cắt mọi giá trị âm về 0 và giữ nguyên giá trị dương. Đây cũng là lý do gradient ở vùng dương luôn bằng 1 — không bị nén như sigmoid.",
  },
  {
    question:
      "Softmax thường được đặt ở đâu trong một mạng phân loại đa lớp?",
    options: [
      "Sau mỗi lớp ẩn để chuẩn hoá tín hiệu",
      "Chỉ ở lớp đầu ra — biến các điểm số thành xác suất cộng bằng 1",
      "Trước lớp đầu tiên để làm sạch đầu vào",
      "Không dùng trong mạng nơ-ron",
    ],
    correct: 1,
    explanation:
      "Softmax chỉ dùng ở lớp cuối cùng, biến một véc-tơ điểm số thành một phân phối xác suất (các giá trị trong khoảng (0, 1), tổng bằng 1) — phù hợp cho bài toán phân loại nhiều lớp.",
  },
  {
    question:
      "Bạn đang huấn luyện một mạng CNN dùng ReLU, phát hiện khoảng 30% nơ-ron luôn trả đầu ra 0. Cách xử lý nào KHÔNG hợp lý?",
    options: [
      "Đổi sang Leaky ReLU để vùng âm có gradient nhỏ",
      "Giảm learning rate để tránh đẩy pre-activation sâu về âm",
      "Kiểm tra lại khởi tạo trọng số (He init)",
      "Tăng learning rate lên gấp 10 để 'đánh thức' các nơ-ron chết",
    ],
    correct: 3,
    explanation:
      "Tăng learning rate mạnh thường làm tình hình tệ hơn — một bước lớn có thể đẩy thêm pre-activation sang vùng âm, khiến nhiều nơ-ron hơn bị chết. Các phương án còn lại đều là cách chuẩn để tránh dying ReLU.",
  },
  {
    type: "fill-blank",
    question:
      "Đặt ba logit [1,0; 2,0; 1,0] vào softmax, lớp thứ hai sẽ nhận xác suất khoảng {blank} (làm tròn đến hai chữ số thập phân, ví dụ 0,42). Tổng ba xác suất luôn bằng {blank}.",
    blanks: [
      { answer: "0,58", accept: ["0.58", "0,58", "58%"] },
      { answer: "1", accept: ["1,0", "1.0", "100%"] },
    ],
    explanation:
      "e^1 ≈ 2,72; e^2 ≈ 7,39. Tổng ≈ 2,72 + 7,39 + 2,72 = 12,83. Xác suất lớp thứ hai ≈ 7,39 / 12,83 ≈ 0,58. Tổng ba xác suất luôn bằng 1 theo định nghĩa softmax.",
  },
  {
    question:
      "Nên chọn hàm kích hoạt nào ở lớp đầu ra cho bài toán hồi quy dự đoán giá nhà (một số thực dương)?",
    options: [
      "Sigmoid — để đầu ra nằm trong (0, 1)",
      "Softmax — để đầu ra là xác suất",
      "Không dùng hàm kích hoạt — đầu ra là số thực không giới hạn",
      "ReLU bắt buộc — vì giá nhà không thể âm",
    ],
    correct: 2,
    explanation:
      "Giá nhà có thể là bất kỳ số thực nào, không cần nén về (0, 1) hay thành xác suất. Cách chuẩn là để lớp đầu ra tuyến tính. Nếu cần bắt đầu ra dương có thể dùng softplus, nhưng ReLU sẽ cắt mất mọi tín hiệu âm trong gradient.",
  },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function ActivationFunctionsTopic() {
  const [inputX, setInputX] = useState(1.2);
  const [chainX, setChainX] = useState(2.5);
  const [chainDepth, setChainDepth] = useState(6);
  const [logits, setLogits] = useState<number[]>([1.5, 2.8, 0.4, 1.0]);

  function updateLogit(idx: number, value: number) {
    setLogits((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  return (
    <>
      {/* ━━━━━ BƯỚC 1 — HOOK ━━━━━ */}
      <LessonSection step={1} totalSteps={8} label="Câu chuyện mở đầu">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent-light p-2">
              <Activity size={22} className="text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Không có hàm kích hoạt, mọi mạng đều là một đường thẳng
            </h3>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Một mạng nơ-ron nhân đầu vào với rất nhiều ma trận, hết lớp này đến
            lớp khác. Nhưng có một sự thật lạ: <strong>nhân bao nhiêu ma trận
            rồi cũng ra một ma trận khác</strong>. Nếu bạn xếp 10, 100 hay 1 000
            lớp tuyến tính mà không thêm gì, cả mạng gộp lại{" "}
            <em>vẫn chỉ là một phép tính tuyến tính khổng lồ</em>.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Tuyến tính nghĩa là: bạn chỉ uốn lượn được bằng các đường thẳng.
            Nhưng thế giới thực toàn đường cong — ảnh con mèo không nằm trên
            một mặt phẳng, hai nhóm khách hàng cũng không tách được bằng một nét
            bút. <strong>Hàm kích hoạt</strong> là cái cần nhỏ sau mỗi lớp, uốn
            thẳng thành cong. Chỉ cần bẻ cong một chút ở mỗi tầng, mạng bỗng
            nhiên biểu diễn được mọi thứ.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-surface/50 p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Layers3 size={14} className="text-accent" /> Trước khi thêm
              </div>
              <p className="text-[11px] text-muted leading-snug">
                100 lớp tuyến tính = 1 lớp. Mạng chỉ kẻ được đường thẳng.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/50 p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Waves size={14} className="text-accent" /> Cần thứ gì đó?
              </div>
              <p className="text-[11px] text-muted leading-snug">
                Một đường cong nhỏ xen giữa hai lớp — phi tuyến.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/50 p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <SparkIcon size={14} className="text-accent" /> Sau khi thêm
              </div>
              <p className="text-[11px] text-muted leading-snug">
                Mạng uốn được vô số đường cong — biểu diễn cả ảnh, âm thanh,
                ngôn ngữ.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━━━ BƯỚC 2 — DỰ ĐOÁN ━━━━━ */}
      <LessonSection step={2} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Nếu bạn xếp 100 lớp tuyến tính (chỉ có phép nhân ma trận) mà không thêm bất kỳ hàm kích hoạt nào, kết quả sẽ mạnh ngang bao nhiêu lớp thật?"
          options={[
            "100 lớp — mỗi lớp đều đóng góp",
            "50 lớp — giảm một nửa vì nén dữ liệu",
            "1 lớp duy nhất — tất cả rút gọn thành một phép nhân",
            "0 lớp — mạng không làm được gì",
          ]}
          correct={2}
          explanation="Nhân liên tiếp W₁ × W₂ × ... × W₁₀₀ vẫn chỉ cho một ma trận W_tổng. Không có phi tuyến ⇒ 100 lớp = 1 lớp. Đây chính là lý do hàm kích hoạt phải tồn tại — để 'phá' tính tuyến tính sau mỗi lớp."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Cả bài học này là để bạn <strong>tay cầm slider</strong>, xem năm
            đường cong nhỏ — ReLU, sigmoid, tanh, Leaky ReLU và softmax — biến
            một tín hiệu thô thành tín hiệu hữu ích như thế nào.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━━━ BƯỚC 3 — REVEAL (TabView + so sánh) ━━━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm text-muted leading-relaxed">
                Đây là năm hàm kích hoạt phổ biến nhất. Mỗi tab cho bạn một đường
                cong — hãy <strong>kéo thanh trượt bên dưới</strong> để đẩy đầu
                vào x chạy từ −5 đến 5 và quan sát điểm màu nhảy theo.
              </p>
              <div className="flex items-center gap-3 max-w-sm">
                <span className="text-xs text-muted shrink-0">Đầu vào x</span>
                <input
                  type="range"
                  min={-5}
                  max={5}
                  step={0.05}
                  value={inputX}
                  onChange={(e) => setInputX(parseFloat(e.target.value))}
                  className="flex-1 accent-accent"
                  aria-label="Đầu vào x"
                />
                <span className="text-xs font-mono tabular-nums w-12 text-right">
                  {inputX.toFixed(2)}
                </span>
              </div>
            </div>

            <TabView
              tabs={[
                {
                  label: "ReLU",
                  content: (
                    <div className="space-y-3">
                      <CurvePanel actKey="relu" inputX={inputX} />
                      <div className="rounded-lg bg-surface/60 border border-border p-3 text-xs text-foreground/80 leading-relaxed">
                        <strong className="text-green-600 dark:text-green-400">
                          Cú hích của deep learning hiện đại.
                        </strong>{" "}
                        Cắt mọi số âm về 0, giữ nguyên số dương. Cực nhanh và
                        gradient không bị nén ở vùng dương — nhưng nơ-ron có thể
                        chết nếu rơi luôn vào vùng âm.
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Sigmoid",
                  content: (
                    <div className="space-y-3">
                      <CurvePanel actKey="sigmoid" inputX={inputX} />
                      <div className="rounded-lg bg-surface/60 border border-border p-3 text-xs text-foreground/80 leading-relaxed">
                        <strong className="text-blue-600 dark:text-blue-400">
                          Cái nút công tắc kinh điển.
                        </strong>{" "}
                        Bóp mọi số về khoảng (0, 1). Hay được dùng ở đầu ra nhị
                        phân, nhưng ở lớp ẩn thì gây triệt tiêu gradient — bạn
                        sẽ thấy ở bước sau.
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Tanh",
                  content: (
                    <div className="space-y-3">
                      <CurvePanel actKey="tanh" inputX={inputX} />
                      <div className="rounded-lg bg-surface/60 border border-border p-3 text-xs text-foreground/80 leading-relaxed">
                        <strong className="text-amber-600 dark:text-amber-400">
                          Người họ hàng đối xứng của sigmoid.
                        </strong>{" "}
                        Bóp về (−1, 1) và có tâm ở 0, nên gradient đỡ lệch hơn.
                        Thường gặp trong RNN/LSTM để giữ trạng thái ứng viên.
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Leaky ReLU",
                  content: (
                    <div className="space-y-3">
                      <CurvePanel actKey="leaky" inputX={inputX} />
                      <div className="rounded-lg bg-surface/60 border border-border p-3 text-xs text-foreground/80 leading-relaxed">
                        <strong className="text-red-500">
                          ReLU có một khe nhỏ cho vùng âm.
                        </strong>{" "}
                        Công thức f(x) = 0,01x khi x ≤ 0. Chỉ cho một chút tín
                        hiệu rỉ xuống — đủ để nơ-ron có cơ hội hồi sinh.
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Softmax",
                  content: (
                    <SoftmaxPanel logits={logits} setLogit={updateLogit} />
                  ),
                },
              ]}
            />

            <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  So sánh bốn hàm cùng một lúc
                </h4>
                <span className="text-xs text-tertiary">
                  Cùng đầu vào x = {inputX.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Giữ thanh trượt ở trên, quan sát bốn hàm phản ứng khác nhau thế
                nào với cùng một x. Đây là cách nhanh nhất để cảm nhận{" "}
                <strong>tính cách</strong> của mỗi hàm.
              </p>
              <SideBySide inputX={inputX} />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━━━ BƯỚC 4 — DEEPEN (StepReveal: vì sao phi tuyến) ━━━━━ */}
      <LessonSection step={4} totalSteps={8} label="Đi sâu: vì sao cần uốn cong">
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Bấm từng bước để thấy vì sao chỉ một chút phi tuyến đã mở ra toàn bộ
          sức mạnh của mạng nơ-ron sâu.
        </p>
        <StepReveal
          labels={[
            "Bài toán: XOR",
            "Thử bằng đường thẳng",
            "Thêm hàm kích hoạt",
            "Tổng kết: ranh giới cong",
          ]}
        >
          {[
            <div
              key="s1"
              className="rounded-xl border border-border bg-surface/50 p-4 space-y-2"
            >
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <PackageOpen size={16} className="text-accent" /> Cấu hình xen
                kẽ (giống XOR)
              </h4>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Có bốn cụm điểm: hai cụm cam ở góc trên phải và dưới trái, hai
                cụm xanh ở hai góc còn lại. Nhìn mắt thường, ai cũng thấy hai
                màu &mdash; nhưng chúng <strong>xen kẽ</strong>. Đây là bài toán
                kinh điển mà mọi mô hình tuyến tính đều thất bại.
              </p>
            </div>,
            <div key="s2" className="space-y-3">
              <BoundaryPanel variant="linear" />
              <p className="text-xs text-muted leading-relaxed">
                Mô hình tuyến tính chỉ được kẻ <strong>đúng một đường thẳng</strong>.
                Dù xoay thế nào, bạn cũng không thể chia hai nhóm màu xen kẽ.
                Thêm 100 lớp tuyến tính ⇒ vẫn một đường thẳng, vì nhân ma trận
                liên tiếp cho ra ma trận khác.
              </p>
            </div>,
            <div key="s3" className="space-y-3">
              <BoundaryPanel variant="nonlinear" />
              <p className="text-xs text-muted leading-relaxed">
                Thêm ReLU hoặc tanh sau mỗi lớp ⇒ mạng <strong>uốn được</strong>
                . Đường ranh giới có thể cong, gấp khúc, thậm chí bao quanh một
                cụm. Giờ mô hình tách được cả cấu hình xen kẽ.
              </p>
            </div>,
            <div
              key="s4"
              className="rounded-xl border border-border bg-surface/50 p-4 space-y-2"
            >
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <SparkIcon size={16} className="text-accent" /> Điểm chốt
              </h4>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Hàm kích hoạt là cái bản lề nhỏ giữa hai lớp, nhưng nhờ nó mà
                mạng nhiều lớp <strong>thật sự</strong> có ý nghĩa. Không có
                bản lề, các lớp xếp vào nhau chỉ tạo ra một đường thẳng. Có bản
                lề, bạn được cả một mặt phẳng gấp khúc — đủ ôm mọi hình dạng
                trong dữ liệu thực.
              </p>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ━━━━━ BƯỚC 5 — CHALLENGE ━━━━━ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Khi bạn xếp 10 lớp sigmoid liên tiếp và cho backprop chạy ngược, gradient ở lớp đầu tiên thường gần với số nào nhất?"
          options={[
            "Khoảng 1 — gradient vẫn lành lặn",
            "Khoảng 0,25 — đúng bằng đạo hàm cực đại một lớp",
            "Gần 0 (cỡ 10⁻⁶ trở xuống) — vì bị nhân đạo hàm ≤ 0,25 suốt 10 lần",
            "Lớn hơn 1 rất nhiều — gradient bùng nổ",
          ]}
          correct={2}
          explanation="Mỗi lớp sigmoid nhân gradient với một số không vượt quá 0,25. Sau 10 lớp: (0,25)¹⁰ ≈ 10⁻⁶. Các lớp đầu gần như không nhận được tín hiệu để cập nhật — đây là hiện tượng triệt tiêu gradient, lý do chính khiến sigmoid không được dùng ở lớp ẩn của mạng sâu hiện đại."
        />
        <div className="mt-5">
          <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-red-500" />
              <h4 className="text-sm font-semibold text-foreground">
                Nhìn tận mắt: tín hiệu co về 0,5 sau mỗi lớp sigmoid
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <label className="text-xs text-muted flex items-center gap-2">
                x đầu vào
                <input
                  type="number"
                  step={0.5}
                  value={chainX}
                  onChange={(e) => setChainX(parseFloat(e.target.value) || 0)}
                  className="w-20 rounded-md border border-border bg-card px-2 py-1 text-sm"
                />
              </label>
              <label className="text-xs text-muted flex items-center gap-2">
                Số lớp
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={1}
                  value={chainDepth}
                  onChange={(e) => setChainDepth(parseInt(e.target.value))}
                  className="flex-1 accent-accent"
                  aria-label="Số lớp sigmoid xếp chồng"
                />
                <span className="tabular-nums font-semibold text-foreground">
                  {chainDepth}
                </span>
              </label>
            </div>
            <SigmoidChain startX={chainX} depth={chainDepth} />
          </div>
        </div>
      </LessonSection>

      {/* ━━━━━ BƯỚC 6 — AHA ━━━━━ */}
      <LessonSection step={6} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Hàm kích hoạt không phải là <strong>tính năng phụ</strong> — nó là
          cái biến một phép nhân ma trận thành một mạng học được.
          <br />
          <br />
          Một mạng tuyến tính là một đường thẳng. Thêm một đường cong nhỏ vào
          mỗi lớp, bạn được một mạng <strong>vô cùng linh hoạt</strong> — có
          thể xấp xỉ mọi hàm, ôm mọi ranh giới, phân biệt mọi cấu hình dữ liệu.
        </AhaMoment>
      </LessonSection>

      {/* ━━━━━ BƯỚC 7 — EXPLAIN (LaTeX ≤3) ━━━━━ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Bạn đã thấy năm đường cong trong phần khám phá. Bên dưới là ba công
            thức <strong>ngắn nhất</strong> có thể — mỗi công thức đi kèm một
            hình minh hoạ và một câu giải thích bằng tiếng Việt. Đừng thuộc
            lòng; nhớ hình dáng đường cong là đủ.
          </p>

          {/* ── ReLU ── */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-green-500" />
              <h4 className="text-base font-semibold text-foreground">
                ReLU — cắt vuông ở 0
              </h4>
            </div>
            <LaTeX block>{"\\mathrm{ReLU}(x) = \\max(0, x)"}</LaTeX>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <CurvePanel actKey="relu" inputX={1.5} />
              <p className="text-sm text-foreground/85 leading-relaxed">
                Bằng lời: <strong>nếu x âm, ra 0; nếu x dương, giữ nguyên</strong>
                . Một cái chặn ánh sáng đơn giản — nhưng cực nhanh, và là hàm
                kích hoạt mặc định cho hầu hết các mô hình thị giác máy tính
                hiện đại.
              </p>
            </div>
          </div>

          {/* ── Sigmoid ── */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Droplet size={18} className="text-blue-500" />
              <h4 className="text-base font-semibold text-foreground">
                Sigmoid — bóp mọi số về (0, 1)
              </h4>
            </div>
            <LaTeX block>{"\\sigma(x) = \\frac{1}{1 + e^{-x}}"}</LaTeX>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <CurvePanel actKey="sigmoid" inputX={0.5} />
              <p className="text-sm text-foreground/85 leading-relaxed">
                Bằng lời: dù x là bao nhiêu, sigmoid đều nén về một số giữa 0 và
                1. Rất tiện cho <strong>đầu ra nhị phân</strong> (phải/trái,
                đúng/sai). Nhưng ở lớp ẩn của mạng sâu, nó gây triệt tiêu
                gradient.
              </p>
            </div>
          </div>

          {/* ── Softmax ── */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Waves size={18} className="text-purple-500" />
              <h4 className="text-base font-semibold text-foreground">
                Softmax — biến bảng điểm thành bảng xác suất
              </h4>
            </div>
            <LaTeX block>
              {"\\mathrm{softmax}(z_i) = \\frac{e^{z_i}}{\\sum_{j} e^{z_j}}"}
            </LaTeX>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <SoftmaxPanel logits={logits} setLogit={updateLogit} />
              <p className="text-sm text-foreground/85 leading-relaxed">
                Bằng lời: <strong>ai điểm cao sẽ chiếm phần lớn xác suất, các
                lớp còn lại chia phần còn lại</strong>. Công thức trông rối
                nhưng ý nghĩa đơn giản — tổng luôn bằng 1. Đây là cách chuẩn
                đưa mạng đa lớp về một phân phối xác suất.
              </p>
            </div>
          </div>

          <Callout variant="tip" title="Quy tắc chọn hàm kích hoạt">
            Lớp ẩn mặc định: <strong>ReLU</strong>. Nếu thấy nơ-ron chết →{" "}
            <strong>Leaky ReLU</strong>. Đầu ra nhị phân:{" "}
            <strong>sigmoid</strong>. Đầu ra đa lớp: <strong>softmax</strong>.
            RNN/LSTM: <strong>tanh</strong> cho trạng thái ứng viên,{" "}
            <strong>sigmoid</strong> cho cổng. Hồi quy:{" "}
            <strong>không kích hoạt</strong> ở lớp cuối.
          </Callout>

          <Callout variant="warning" title="Bẫy thường gặp">
            Đừng thêm softmax vào <em>trong</em> mô hình rồi cộng thêm
            CrossEntropyLoss (với PyTorch). Loss đó đã tự làm log-softmax bên
            trong — thêm lần nữa gây sai gradient. Giữ lớp cuối dạng tuyến tính
            và để hàm loss lo phần còn lại.
          </Callout>

          <CollapsibleDetail title="Bảng nhanh: đặc điểm của 5 hàm">
            <div className="space-y-2 text-sm leading-relaxed">
              {(["relu", "sigmoid", "tanh", "leaky", "softmax"] as ActKey[]).map(
                (k) => {
                  const m = ACT_META[k];
                  return (
                    <div
                      key={k}
                      className="rounded-lg border border-border bg-surface/40 p-3 space-y-1"
                      style={{ borderLeft: `3px solid ${m.color}` }}
                    >
                      <div className="flex items-center justify-between">
                        <strong style={{ color: m.color }}>{m.label}</strong>
                        <span className="text-[11px] text-tertiary">
                          Miền giá trị {m.rangeVi}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80">
                        {m.shortVi}. Thường đặt ở: {m.whenVi}.
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Vì sao ReLU đơn giản lại thắng sigmoid ở lớp ẩn?">
            <div className="space-y-2 text-sm leading-relaxed text-foreground/85">
              <p>
                Có ba lý do thực tế. <strong>Một</strong>: ReLU chỉ cần một phép
                so sánh với 0 — cực rẻ trên GPU. <strong>Hai</strong>: gradient ở
                vùng dương luôn là 1, nên dù có 50 lớp, tín hiệu học vẫn đi xuyên
                qua nguyên vẹn ở phần dương. <strong>Ba</strong>: đầu ra
                &ldquo;thưa&rdquo; (nhiều nơ-ron trả 0) khiến mạng tự đơn giản
                hoá — một dạng regularization ngầm.
              </p>
              <p>
                Đổi lại, ReLU có điểm yếu: nếu một nơ-ron rơi vào vùng âm và
                không thoát ra được, nó sẽ <em>chết</em> vĩnh viễn. Leaky ReLU,
                ELU, GELU đều là các biến thể giúp vùng âm có tí gradient, tránh
                bẫy này.
              </p>
            </div>
          </CollapsibleDetail>

          <p className="leading-relaxed">
            Chi tiết về vì sao gradient triệt tiêu, xem tại{" "}
            <TopicLink slug="vanishing-exploding-gradients">
              Vanishing &amp; Exploding Gradient
            </TopicLink>
            . Lý thuyết về lớp perceptron một đơn vị — tổ tiên của mạng nhiều
            lớp — xem tại <TopicLink slug="perceptron">Perceptron</TopicLink>.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━━━ BƯỚC 8 — CONNECT + QUIZ ━━━━━ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt & kiểm tra">
        <MiniSummary
          title="5 điều cần nhớ"
          points={[
            "Không có hàm kích hoạt, cả một mạng nơ-ron chỉ là một phép tính tuyến tính lớn — không uốn được đường cong.",
            "ReLU cắt vuông ở 0: mặc định cho lớp ẩn vì nhanh và gradient không nén ở vùng dương.",
            "Sigmoid bóp về (0, 1): hợp cho đầu ra nhị phân, nhưng gây triệt tiêu gradient ở mạng sâu.",
            "Softmax dùng ở lớp cuối của phân loại đa lớp — biến điểm số thành xác suất cộng bằng 1.",
            "Tanh & Leaky ReLU là hai bản đối xứng / sửa lỗi của sigmoid và ReLU — dùng khi gradient lệch tâm hoặc có nơ-ron chết.",
          ]}
        />
        <div className="mt-4">
          <Callout variant="tip" title="Thấy lý thuyết rồi, bây giờ xem thực chiến">
            Muốn thấy năm đường cong này được ghép lại trong một mạng 13 tầng để
            đánh bại nhà vô địch cờ vây thế giới? Xem{" "}
            <TopicLink slug="activation-functions-in-alphago">
              Hàm kích hoạt trong AlphaGo
            </TopicLink>
            .
          </Callout>
        </div>
        <div className="mt-6">
          <QuizSection questions={quizQuestions} />
        </div>
        <div className="mt-4 flex items-center justify-center text-xs text-muted gap-2">
          <AlertTriangle size={12} />
          Bạn có thể làm lại quiz bất kỳ lúc nào — học thuộc hình dáng đường
          cong trước khi học thuộc công thức.
        </div>
      </LessonSection>
    </>
  );
}
