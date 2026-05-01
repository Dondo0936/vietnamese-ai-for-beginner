"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Brain,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Wand2,
  RotateCcw,
  PlusCircle,
  MinusCircle,
  Target,
  Zap,
  Lightbulb,
  AlertTriangle,
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
  LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "perceptron",
  title: "Perceptron",
  titleVi: "Perceptron — Nơ-ron đơn giản nhất",
  description:
    "Một nơ-ron nhân tạo có thể làm gì? Cộng có trọng số mọi đầu vào, rồi quyết định 'có' hay 'không'. Bạn sẽ tự tay chỉnh trọng số và nhìn đường quyết định xoay theo.",
  category: "neural-fundamentals",
  tags: ["neural-network", "fundamentals", "classification", "perceptron"],
  difficulty: "beginner",
  relatedSlugs: ["mlp", "activation-functions", "forward-propagation"],
  vizType: "interactive",
};

/* ─────────────────────────────────────────────────────────────
   KIỂU DỮ LIỆU & TOÁN NHỎ
   ───────────────────────────────────────────────────────────── */

type PointLabel = 0 | 1;
type LabeledPoint = { x: number; y: number; cls: PointLabel };

const VIEW_W = 440;
const VIEW_H = 340;

/* Scale inputs from pixel-ish coordinates (0..VIEW_W / 0..VIEW_H) down so
 * slope values in (-2, 2) produce nice boundaries across the viewport. */
const FEATURE_SCALE = 100;

function featureX(pxl: number) {
  return pxl / FEATURE_SCALE;
}

function featureY(pxl: number) {
  return (VIEW_H - pxl) / FEATURE_SCALE;
}

function scaledPredict(pt: { x: number; y: number }, w1: number, w2: number, b: number): PointLabel {
  const fx = featureX(pt.x);
  const fy = featureY(pt.y);
  const z = w1 * fx + w2 * fy + b;
  return z > 0 ? 1 : 0;
}

function scaledBoundary(w1: number, w2: number, b: number) {
  if (Math.abs(w2) < 1e-4 && Math.abs(w1) < 1e-4) return null;
  if (Math.abs(w2) < 1e-4) {
    const fx = -b / w1;
    const pxl = fx * FEATURE_SCALE;
    return { x1: pxl, y1: 0, x2: pxl, y2: VIEW_H };
  }
  const yAtFeat = (fx: number) => -(w1 * fx + b) / w2;
  const leftFx = 0;
  const rightFx = VIEW_W / FEATURE_SCALE;
  const y1Feat = yAtFeat(leftFx);
  const y2Feat = yAtFeat(rightFx);
  return {
    x1: 0,
    y1: VIEW_H - y1Feat * FEATURE_SCALE,
    x2: VIEW_W,
    y2: VIEW_H - y2Feat * FEATURE_SCALE,
  };
}

/* ─────────────────────────────────────────────────────────────
   DỮ LIỆU MINH HOẠ
   ───────────────────────────────────────────────────────────── */

const INITIAL_POINTS: LabeledPoint[] = [
  { x: 70, y: 260, cls: 0 },
  { x: 95, y: 280, cls: 0 },
  { x: 60, y: 230, cls: 0 },
  { x: 110, y: 260, cls: 0 },
  { x: 130, y: 290, cls: 0 },
  { x: 90, y: 210, cls: 0 },
  { x: 310, y: 100, cls: 1 },
  { x: 340, y: 130, cls: 1 },
  { x: 290, y: 80, cls: 1 },
  { x: 360, y: 90, cls: 1 },
  { x: 330, y: 60, cls: 1 },
  { x: 370, y: 120, cls: 1 },
];

/* ─────────────────────────────────────────────────────────────
   PLAYGROUND CHÍNH — slider + scatter + click-to-add
   ───────────────────────────────────────────────────────────── */

function PerceptronPlayground() {
  const [points, setPoints] = useState<LabeledPoint[]>(INITIAL_POINTS);
  const [nextLabel, setNextLabel] = useState<PointLabel>(1);
  const [w1, setW1] = useState(-1.1);
  const [w2, setW2] = useState(1);
  const [bias, setBias] = useState(0.4);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const reduce = useReducedMotion();

  const classified = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        pred: scaledPredict(p, w1, w2, bias),
      })),
    [points, w1, w2, bias]
  );

  const correctCount = classified.filter((p) => p.pred === p.cls).length;
  const accuracy = Math.round((correctCount / Math.max(classified.length, 1)) * 100);

  const boundary = useMemo(() => scaledBoundary(w1, w2, bias), [w1, w2, bias]);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) * VIEW_W) / rect.width;
      const y = ((e.clientY - rect.top) * VIEW_H) / rect.height;
      if (x < 8 || x > VIEW_W - 8 || y < 8 || y > VIEW_H - 8) return;
      setPoints((prev) => [...prev, { x, y, cls: nextLabel }]);
    },
    [nextLabel]
  );

  const resetPoints = useCallback(() => setPoints(INITIAL_POINTS), []);

  // Prebake region shading so học viên "thấy" bên nào perceptron nói 0/1
  const regionPath = useMemo(() => {
    if (!boundary) return null;
    const { x1, y1, x2, y2 } = boundary;
    return `M 0,0 L ${VIEW_W},0 L ${x2.toFixed(1)},${y2.toFixed(1)} L ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
  }, [boundary]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted leading-relaxed">
        Kéo ba thanh trượt dưới đây — <strong>w₁</strong> và <strong>w₂</strong> là trọng số của hai
        đầu vào, <strong>b</strong> là bias (độ lệch). Đường đứt tím là{" "}
        <em>quyết định</em> của perceptron. <strong>Nhấn vào biểu đồ</strong> để thêm điểm mới theo
        nhãn đang chọn.
      </p>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {/* Chọn nhãn cho điểm mới */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-tertiary uppercase tracking-wider mr-1">
            Thêm điểm nhãn
          </span>
          <button
            type="button"
            onClick={() => setNextLabel(1)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${nextLabel === 1
                ? "bg-rose-500 text-white"
                : "bg-card border border-border text-muted hover:text-foreground"
              }`}
          >
            <PlusCircle size={11} />
            Lớp 1 (đỏ)
          </button>
          <button
            type="button"
            onClick={() => setNextLabel(0)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${nextLabel === 0
                ? "bg-sky-500 text-white"
                : "bg-card border border-border text-muted hover:text-foreground"
              }`}
          >
            <MinusCircle size={11} />
            Lớp 0 (xanh)
          </button>
          <span className="ml-auto text-xs text-muted tabular-nums">
            {points.length} điểm
          </span>
        </div>

        {/* SVG */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full max-w-xl mx-auto rounded-lg border border-border bg-background/60 cursor-crosshair"
          role="img"
          aria-label={`Trực quan perceptron: ${points.length} điểm, độ chính xác ${accuracy}%`}
          onClick={handleSvgClick}
        >
          {/* Nền lưới */}
          {Array.from({ length: 9 }).map((_, i) => {
            const x = (i + 1) * (VIEW_W / 10);
            return (
              <line
                key={`gx-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={VIEW_H}
                stroke="currentColor"
                className="text-border"
                strokeWidth={0.5}
                opacity={0.5}
              />
            );
          })}
          {Array.from({ length: 7 }).map((_, i) => {
            const y = (i + 1) * (VIEW_H / 8);
            return (
              <line
                key={`gy-${i}`}
                x1={0}
                y1={y}
                x2={VIEW_W}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeWidth={0.5}
                opacity={0.5}
              />
            );
          })}

          {/* Vùng tô màu: phía trên đường = lớp 1 (hồng nhạt), dưới = lớp 0 (xanh nhạt) */}
          {regionPath && (
            <>
              <path d={regionPath} fill="#ef4444" opacity={0.05} />
              <path
                d={`M 0,${VIEW_H} L ${VIEW_W},${VIEW_H} L ${boundary!.x2.toFixed(1)},${boundary!.y2.toFixed(
                  1
                )} L ${boundary!.x1.toFixed(1)},${boundary!.y1.toFixed(1)} Z`}
                fill="#3b82f6"
                opacity={0.05}
              />
            </>
          )}

          {/* Đường quyết định */}
          {boundary && (
            <motion.line
              x1={boundary.x1}
              y1={boundary.y1}
              x2={boundary.x2}
              y2={boundary.y2}
              stroke="#a855f7"
              strokeWidth={2.5}
              strokeDasharray="7 4"
              animate={{ x1: boundary.x1, y1: boundary.y1, x2: boundary.x2, y2: boundary.y2 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 18 }}
            />
          )}

          {/* Các điểm */}
          {classified.map((pt, i) => {
            const isCorrect = pt.pred === pt.cls;
            const fill = pt.cls === 1 ? "#ef4444" : "#3b82f6";
            return (
              <motion.circle
                key={`pt-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={7}
                fill={fill}
                stroke={isCorrect ? "#ffffff" : "#f59e0b"}
                strokeWidth={isCorrect ? 1.5 : 3}
                initial={reduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 20 }}
              />
            );
          })}

          {/* Nhãn miền */}
          <text x={VIEW_W - 90} y={28} fontSize={11} fill="#ef4444" fontWeight={700}>
            Vùng lớp 1
          </text>
          <text x={14} y={VIEW_H - 14} fontSize={11} fill="#3b82f6" fontWeight={700}>
            Vùng lớp 0
          </text>
        </svg>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-foreground">Trọng số w₁</span>
              <span className="font-mono text-accent tabular-nums">{w1.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.05}
              value={w1}
              onChange={(e) => setW1(parseFloat(e.target.value))}
              aria-label="Trọng số w1"
              className="w-full h-2 accent-accent"
            />
            <div className="flex justify-between text-[10px] text-tertiary mt-0.5">
              <span>−2</span>
              <span>0</span>
              <span>+2</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-foreground">Trọng số w₂</span>
              <span className="font-mono text-accent tabular-nums">{w2.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.05}
              value={w2}
              onChange={(e) => setW2(parseFloat(e.target.value))}
              aria-label="Trọng số w2"
              className="w-full h-2 accent-accent"
            />
            <div className="flex justify-between text-[10px] text-tertiary mt-0.5">
              <span>−2</span>
              <span>0</span>
              <span>+2</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-foreground">Bias b</span>
              <span className="font-mono text-accent tabular-nums">{bias.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-3}
              max={3}
              step={0.05}
              value={bias}
              onChange={(e) => setBias(parseFloat(e.target.value))}
              aria-label="Bias"
              className="w-full h-2 accent-accent"
            />
            <div className="flex justify-between text-[10px] text-tertiary mt-0.5">
              <span>−3</span>
              <span>0</span>
              <span>+3</span>
            </div>
          </div>
        </div>

        {/* Ghi chú trực giác + nút reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-surface/40 p-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2 mb-1">
              <Target size={12} className="text-accent" />
              <span className="font-semibold text-foreground">Độ chính xác hiện tại</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-2xl font-bold tabular-nums"
                style={{
                  color:
                    accuracy === 100 ? "#22c55e" : accuracy >= 75 ? "#f59e0b" : "#ef4444",
                }}
              >
                {accuracy}%
              </span>
              <span className="text-muted">
                {correctCount}/{classified.length} điểm đúng
              </span>
            </div>
            <p className="text-muted mt-1">
              {accuracy === 100
                ? "Hoàn hảo — bạn tìm được một đường thẳng chia đúng toàn bộ."
                : "Kéo thêm các thanh để xoay hoặc dịch đường tím."}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface/40 p-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-accent" />
              <span className="font-semibold text-foreground">Trực giác ba nút</span>
            </div>
            <ul className="space-y-0.5 text-muted">
              <li>
                <strong className="text-foreground">w₁ lớn</strong>: đầu vào x càng quan trọng.
              </li>
              <li>
                <strong className="text-foreground">w₁, w₂ đổi dấu</strong>: đường quay 90°.
              </li>
              <li>
                <strong className="text-foreground">b</strong>: dịch đường song song lên/xuống.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetPoints}
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            <RotateCcw size={11} />
            Đặt lại điểm
          </button>
          <button
            type="button"
            onClick={() => {
              setW1(-1.1);
              setW2(1);
              setBias(0.4);
            }}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            Đặt lại trọng số
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DEEPEN — Luật học perceptron (StepReveal)
   Một điểm sai → điều chỉnh trọng số → đường thẳng dịch sang bên cần chia đúng.
   ───────────────────────────────────────────────────────────── */

type LearningDemoPoint = { x: number; y: number; cls: PointLabel; note?: string };

const LEARNING_POINTS: LearningDemoPoint[] = [
  { x: 80, y: 240, cls: 0, note: "điểm xanh: sinh viên mệt — không đi học" },
  { x: 120, y: 200, cls: 0 },
  { x: 150, y: 180, cls: 0 },
  { x: 260, y: 140, cls: 1, note: "điểm đỏ: tỉnh táo — đi học" },
  { x: 310, y: 110, cls: 1 },
  { x: 330, y: 90, cls: 1 },
];

function LearningRuleDemo() {
  const [step, setStep] = useState(0);

  // Bốn trạng thái trọng số: sửa dần ba điểm đỏ từ phải sang trái
  // cho tới khi đường chia đúng hai cụm.
  const states: { w1: number; w2: number; b: number; badIdx: number | null; note: string }[] = [
    {
      w1: 0.1,
      w2: -0.4,
      b: 0,
      badIdx: 5,
      note: "Khởi tạo ngẫu nhiên. Cả ba điểm đỏ đang bị đoán thành 0 — đường chưa chia được gì.",
    },
    {
      w1: 0.2,
      w2: 0.15,
      b: -1.0,
      badIdx: 4,
      note: "Điểm đỏ phải cùng đã được sửa. Đường dịch lên, nhưng hai điểm đỏ còn lại vẫn sai phía.",
    },
    {
      w1: 0.3,
      w2: 0.2,
      b: -1.3,
      badIdx: 3,
      note: "Sửa thêm điểm đỏ giữa. Chỉ còn điểm đỏ trái cùng chưa đúng.",
    },
    {
      w1: 1.0,
      w2: 0.5,
      b: -3.0,
      badIdx: null,
      note: "Perceptron học xong — đường chia đúng hai cụm màu.",
    },
  ];

  const s = states[step];
  const boundary = scaledBoundary(s.w1, s.w2, s.b);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted leading-relaxed">
        Luật học perceptron chỉ làm đúng một việc: mỗi điểm bị đoán sai thì trọng số được đẩy một
        chút theo hướng sửa điểm ấy. Xem bốn ảnh dưới đây — đường tím dịch dần cho tới khi chia
        đúng toàn bộ.
      </p>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full max-w-xl mx-auto rounded-lg border border-border bg-background/60"
        role="img"
        aria-label={`Luật học perceptron — bước ${step + 1}/4`}
      >
        {Array.from({ length: 9 }).map((_, i) => {
          const x = (i + 1) * (VIEW_W / 10);
          return (
            <line
              key={`lx-${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={VIEW_H}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.4}
              opacity={0.45}
            />
          );
        })}
        {Array.from({ length: 7 }).map((_, i) => {
          const y = (i + 1) * (VIEW_H / 8);
          return (
            <line
              key={`ly-${i}`}
              x1={0}
              y1={y}
              x2={VIEW_W}
              y2={y}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.4}
              opacity={0.45}
            />
          );
        })}

        {boundary && (
          <motion.line
            x1={boundary.x1}
            y1={boundary.y1}
            x2={boundary.x2}
            y2={boundary.y2}
            stroke="#a855f7"
            strokeWidth={2.5}
            strokeDasharray="7 4"
            animate={{ x1: boundary.x1, y1: boundary.y1, x2: boundary.x2, y2: boundary.y2 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
          />
        )}

        {LEARNING_POINTS.map((pt, i) => {
          const pred = scaledPredict(pt, s.w1, s.w2, s.b);
          const ok = pred === pt.cls;
          const isHighlighted = s.badIdx === i;
          const fill = pt.cls === 1 ? "#ef4444" : "#3b82f6";
          return (
            <g key={`lp-${i}`}>
              <motion.circle
                cx={pt.x}
                cy={pt.y}
                r={isHighlighted ? 11 : 8}
                fill={fill}
                stroke={ok ? "#ffffff" : "#f59e0b"}
                strokeWidth={ok ? 1.5 : 3}
                animate={{ r: isHighlighted ? 11 : 8 }}
              />
              {isHighlighted && (
                <motion.circle
                  cx={pt.x}
                  cy={pt.y}
                  r={18}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </g>
          );
        })}
      </svg>

      <StepReveal
        labels={["Khởi tạo", "Sửa lần 1", "Sửa lần 2", "Học xong"]}
      >
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="rounded-lg border border-border bg-surface/60 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/10 text-accent px-2 py-0.5 text-[11px] font-bold">
                Bước {idx + 1}
              </span>
              <span className="text-xs text-tertiary font-mono tabular-nums">
                w₁ = {states[idx].w1.toFixed(2)} &middot; w₂ = {states[idx].w2.toFixed(2)} &middot; b
                = {states[idx].b.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => setStep(idx)}
                className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors ${step === idx
                    ? "bg-accent text-white"
                    : "border border-border bg-card text-muted hover:text-foreground"
                  }`}
              >
                {step === idx ? "Đang xem" : "Xem bước này"}
              </button>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{states[idx].note}</p>
          </div>
        ))}
      </StepReveal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SỞ ĐỒ PERCEPTRON — input → Σ → step → output (SVG)
   ───────────────────────────────────────────────────────────── */

function PerceptronDiagram({
  x1,
  x2,
  w1,
  w2,
  b,
}: {
  x1: number;
  x2: number;
  w1: number;
  w2: number;
  b: number;
}) {
  const z = x1 * w1 + x2 * w2 + b;
  const out = z > 0 ? 1 : 0;

  return (
    <svg viewBox="0 0 560 240" className="w-full max-w-2xl mx-auto">
      {/* Bias */}
      <circle cx={60} cy={40} r={18} fill="#94a3b8" opacity={0.8} />
      <text x={60} y={44} textAnchor="middle" fill="#ffffff" fontSize={12} fontWeight={700}>
        b
      </text>

      {/* Hai input */}
      <motion.circle cx={60} cy={110} r={26} fill="#3b82f6" opacity={x1 > 0 ? 1 : 0.35} />
      <text x={60} y={115} textAnchor="middle" fill="#ffffff" fontSize={13} fontWeight={700}>
        x₁ = {x1}
      </text>
      <motion.circle cx={60} cy={190} r={26} fill="#3b82f6" opacity={x2 > 0 ? 1 : 0.35} />
      <text x={60} y={195} textAnchor="middle" fill="#ffffff" fontSize={13} fontWeight={700}>
        x₂ = {x2}
      </text>

      {/* Connections */}
      <line
        x1={78}
        y1={40}
        x2={240}
        y2={125}
        stroke="#94a3b8"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={0.6}
      />
      <line
        x1={86}
        y1={110}
        x2={240}
        y2={130}
        stroke="#3b82f6"
        strokeWidth={Math.abs(w1) * 3 + 1}
        opacity={0.7}
      />
      <text x={145} y={100} fill="#3b82f6" fontSize={12} fontWeight={700}>
        w₁ = {w1.toFixed(2)}
      </text>
      <line
        x1={86}
        y1={190}
        x2={240}
        y2={150}
        stroke="#3b82f6"
        strokeWidth={Math.abs(w2) * 3 + 1}
        opacity={0.7}
      />
      <text x={145} y={185} fill="#3b82f6" fontSize={12} fontWeight={700}>
        w₂ = {w2.toFixed(2)}
      </text>

      {/* Sum node */}
      <circle cx={270} cy={140} r={32} fill="#1e293b" stroke="#475569" strokeWidth={2} />
      <text x={270} y={135} textAnchor="middle" fill="var(--text-primary)" fontSize={18}>
        Σ
      </text>
      <text x={270} y={155} textAnchor="middle" fill="var(--text-secondary)" fontSize={11} fontWeight={700}>
        {z.toFixed(2)}
      </text>

      {/* Step function */}
      <line x1={302} y1={140} x2={355} y2={140} stroke="#475569" strokeWidth={2} />
      <rect x={355} y={108} width={60} height={64} rx={8} fill="#1e293b" stroke="#475569" strokeWidth={2} />
      <polyline
        points="365,158 380,158 380,120 408,120"
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2.5}
      />
      <text x={385} y={170} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>
        step
      </text>

      {/* Output */}
      <line x1={415} y1={140} x2={460} y2={140} stroke="#475569" strokeWidth={2} />
      <motion.circle
        cx={490}
        cy={140}
        r={28}
        fill={out === 1 ? "#22c55e" : "#ef4444"}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 0.3 }}
        key={out}
      />
      <text x={490} y={137} textAnchor="middle" fill="#ffffff" fontSize={16} fontWeight={700}>
        {out}
      </text>
      <text x={490} y={154} textAnchor="middle" fill="#ffffff" fontSize={11}>
        {out === 1 ? "CÓ" : "KHÔNG"}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   MINI DEMO — ba cổng logic (AND / OR / XOR)
   AND & OR phân tách được; XOR thì không.
   ───────────────────────────────────────────────────────────── */

type LogicGate = "AND" | "OR" | "XOR";

const LOGIC_DATA: Record<LogicGate, { x: number; y: number; cls: PointLabel }[]> = {
  AND: [
    { x: 0, y: 0, cls: 0 },
    { x: 0, y: 1, cls: 0 },
    { x: 1, y: 0, cls: 0 },
    { x: 1, y: 1, cls: 1 },
  ],
  OR: [
    { x: 0, y: 0, cls: 0 },
    { x: 0, y: 1, cls: 1 },
    { x: 1, y: 0, cls: 1 },
    { x: 1, y: 1, cls: 1 },
  ],
  XOR: [
    { x: 0, y: 0, cls: 0 },
    { x: 0, y: 1, cls: 1 },
    { x: 1, y: 0, cls: 1 },
    { x: 1, y: 1, cls: 0 },
  ],
};

function LogicGatesDemo() {
  const [gate, setGate] = useState<LogicGate>("AND");
  const pts = LOGIC_DATA[gate];

  // Perceptron thủ công cho AND / OR
  const manualPerceptron: Record<LogicGate, { w1: number; w2: number; b: number } | null> = {
    AND: { w1: 1, w2: 1, b: -1.5 },
    OR: { w1: 1, w2: 1, b: -0.5 },
    XOR: null,
  };
  const cfg = manualPerceptron[gate];

  // Vẽ 4 điểm của cổng logic lên SVG
  const toPx = (fx: number, fy: number) => ({
    cx: 80 + fx * 240,
    cy: 240 - fy * 200,
  });

  // Đường quyết định (nếu có)
  const line = useMemo(() => {
    if (!cfg) return null;
    const yAtX = (fx: number) => -(cfg.w1 * fx + cfg.b) / cfg.w2;
    return {
      x1: 80,
      y1: 240 - yAtX(0) * 200,
      x2: 320,
      y2: 240 - yAtX(1) * 200,
    };
  }, [cfg]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-tertiary uppercase tracking-wider mr-1">
          Chọn cổng logic
        </span>
        {(["AND", "OR", "XOR"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGate(g)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${gate === g
                ? "bg-accent text-white"
                : "border border-border bg-card text-muted hover:text-foreground"
              }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <svg viewBox="0 0 400 280" className="w-full max-w-sm mx-auto">
          {/* Trục */}
          <line x1={80} y1={40} x2={80} y2={240} stroke="currentColor" className="text-muted" strokeWidth={1} />
          <line x1={80} y1={240} x2={340} y2={240} stroke="currentColor" className="text-muted" strokeWidth={1} />
          <text x={70} y={40} textAnchor="end" fontSize={11} fill="currentColor" className="text-muted">
            x₂ = 1
          </text>
          <text x={70} y={245} textAnchor="end" fontSize={11} fill="currentColor" className="text-muted">
            x₂ = 0
          </text>
          <text x={80} y={260} fontSize={11} fill="currentColor" className="text-muted">
            x₁ = 0
          </text>
          <text x={320} y={260} fontSize={11} fill="currentColor" className="text-muted">
            x₁ = 1
          </text>

          {/* Đường quyết định */}
          {line && (
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#a855f7"
              strokeWidth={2.5}
              strokeDasharray="7 4"
            />
          )}

          {/* 4 điểm */}
          {pts.map((pt, i) => {
            const { cx, cy } = toPx(pt.x, pt.y);
            const fill = pt.cls === 1 ? "#ef4444" : "#3b82f6";
            return (
              <g key={`lg-${i}`}>
                <circle cx={cx} cy={cy} r={12} fill={fill} stroke="#ffffff" strokeWidth={2} />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#ffffff"
                  fontWeight={700}
                >
                  {pt.cls}
                </text>
                <text x={cx} y={cy - 18} textAnchor="middle" fontSize={11} fill="currentColor" className="text-muted">
                  ({pt.x},{pt.y})
                </text>
              </g>
            );
          })}
        </svg>

        <div className="text-sm text-foreground/90 leading-relaxed space-y-2">
          <p>
            <strong className="text-foreground">Cổng {gate}</strong> trả ra 1 khi nào?
          </p>
          <ul className="list-disc pl-5 text-muted space-y-1">
            {gate === "AND" && (
              <>
                <li>Chỉ khi <em>cả hai</em> đầu vào cùng bằng 1.</li>
                <li>Một đường thẳng chia góc phải trên ra khỏi ba góc còn lại — perceptron làm được.</li>
              </>
            )}
            {gate === "OR" && (
              <>
                <li>Khi <em>ít nhất một</em> đầu vào bằng 1.</li>
                <li>Một đường thẳng cắt qua góc trái dưới — perceptron làm được.</li>
              </>
            )}
            {gate === "XOR" && (
              <>
                <li>Khi <em>đúng một</em> đầu vào bằng 1 (khác nhau).</li>
                <li>
                  Thử đi — bạn không thể vẽ một đường thẳng nào tách hai điểm đỏ ra khỏi hai điểm
                  xanh. Đây chính là <strong>giới hạn tuyến tính</strong> của perceptron.
                </li>
              </>
            )}
          </ul>

          {cfg ? (
            <p className="font-mono text-xs text-accent bg-accent/5 rounded p-2">
              Một bộ trọng số giải được: w₁ = {cfg.w1}, w₂ = {cfg.w2}, b = {cfg.b}
            </p>
          ) : (
            <p className="font-mono text-xs text-rose-500 bg-rose-500/10 rounded p-2">
              Không tồn tại (w₁, w₂, b) nào giải được XOR.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   QUIZ
   ───────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Perceptron đưa ra quyết định 'có' hay 'không' dựa trên phép tính nào?",
    options: [
      "So sánh từng đầu vào với một ngưỡng riêng, rồi lấy lá phiếu đa số",
      "Tính tổng có trọng số của mọi đầu vào cộng với bias, rồi áp dụng hàm bước",
      "Nhân tất cả đầu vào với nhau",
      "Chọn ngẫu nhiên giữa 0 và 1",
    ],
    correct: 1,
    explanation:
      "Perceptron tính z = w₁·x₁ + w₂·x₂ + ... + b. Nếu z > 0 thì xuất 1 (có), ngược lại xuất 0 (không). Đây là lý do nó chỉ tạo được một đường thẳng chia không gian.",
  },
  {
    question:
      "Trong trực quan bạn vừa thấy, khi kéo bias b mà giữ nguyên w₁, w₂, đường quyết định làm gì?",
    options: [
      "Xoay quanh gốc toạ độ",
      "Dịch song song (lên xuống) mà không đổi hướng",
      "Đổi màu",
      "Biến mất hoàn toàn",
    ],
    correct: 1,
    explanation:
      "Bias giống như di chuyển toàn bộ đường thẳng lên xuống. Hướng đường (do w₁ và w₂ quyết định) không đổi. Trọng số quyết định 'nghiêng thế nào', bias quyết định 'ở đâu'.",
  },
  {
    question:
      "Tại sao một perceptron KHÔNG thể giải bài toán XOR?",
    options: [
      "XOR cần đầu vào liên tục, không phải nhị phân",
      "Không có một đường thẳng nào chia đúng 4 điểm của XOR",
      "Perceptron chưa được huấn luyện đủ lâu",
      "XOR cần hàm sigmoid thay cho hàm bước",
    ],
    correct: 1,
    explanation:
      "XOR có hai điểm đỏ ở chéo này và hai điểm xanh ở chéo kia. Mọi đường thẳng đều phải hy sinh ít nhất một điểm — đây là bản chất 'không phân tách tuyến tính'. Năm 1969 Minsky & Papert đã chỉ ra giới hạn này.",
  },
  {
    question:
      "Ý tưởng cốt lõi của luật học perceptron là gì?",
    options: [
      "Chọn trọng số ngẫu nhiên, miễn đúng",
      "Với mỗi điểm đoán sai, đẩy trọng số một chút theo hướng sẽ sửa điểm đó",
      "Xoá điểm khó rồi học điểm dễ trước",
      "Đổi hàm kích hoạt thành sigmoid",
    ],
    correct: 1,
    explanation:
      "Công thức chính: w_i ← w_i + η · (target − output) · x_i. Nếu đoán đúng, sai lệch = 0, trọng số không đổi. Nếu đoán sai, sai lệch ≠ 0 và kéo trọng số theo hướng giảm lỗi.",
  },
  {
    type: "fill-blank",
    question:
      "Hoàn chỉnh công thức trọng số mới: w_i = w_i + lr × ({blank} − output) × x_i. Thành phần bạn điền chính là nhãn mong muốn.",
    blanks: [{ answer: "target", accept: ["y", "nhãn", "label", "mục tiêu", "t"] }],
    explanation:
      "Cụm (target − output) là sai số: bằng 0 khi đoán đúng (không cập nhật), khác 0 khi đoán sai. lr (learning rate) là tốc độ học, quyết định bước cập nhật lớn hay nhỏ.",
  },
  {
    question:
      "Bạn đang xây perceptron phân loại 'mèo / chó' từ chiều dài tai và cân nặng. Nếu dữ liệu có chồng lấn (mèo to gần bằng chó nhỏ), perceptron sẽ:",
    options: [
      "Luôn đạt 100% vì có đủ dữ liệu",
      "Không thể đạt 100% — sẽ luôn có điểm ở 'sai bên' đường",
      "Biến hàm bước thành hàm cong để chia được",
      "Tự ngừng học và báo lỗi",
    ],
    correct: 1,
    explanation:
      "Perceptron chỉ vẽ được đường thẳng. Nếu hai lớp chồng lấn, không đường thẳng nào chia đúng tuyệt đối — luật học sẽ đi lòng vòng mãi. Đây là lý do người ta cần MLP với nhiều lớp và hàm kích hoạt phi tuyến.",
  },
];

/* ─────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ───────────────────────────────────────────────────────────── */

export default function PerceptronTopic() {
  const [x1, setX1] = useState(1);
  const [x2, setX2] = useState(0);
  const [w1, setW1] = useState(0.6);
  const [w2, setW2] = useState(0.4);
  const [b, setB] = useState(-0.5);

  const z = x1 * w1 + x2 * w2 + b;
  const out = z > 0 ? 1 : 0;

  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn là người phỏng vấn và đưa ra yêu cầu rằng ứng viên cần có 5 năm kinh nghiệm (x₁) và có bằng đại học (x₂). Ứng viên mới đến có 5 năm kinh nghiệm (x₁ = 1) nhưng không có bằng đại học (x₂ = 0). Bạn đã đặt ra 'quy tắc ngầm': kinh nghiệm quan trọng gấp 3 lần bằng cấp. Nên nhận hay không?"
          options={[
            "Nhận — vì cộng có trọng số ra kết quả lớn hơn ngưỡng 'chấp nhận'",
            "Từ chối — thiếu bằng cấp là yếu tố loại trực tiếp",
            "Cần bấm máy tính, không thể đoán bằng đầu",
            "Chưa đủ dữ kiện",
          ]}
          correct={0}
          explanation="Bạn vừa chạy một perceptron bằng đầu! Trọng số w₁ = 3 (kinh nghiệm), w₂ = 1 (bằng), bias = -2 (ngưỡng chấp nhận). Tổng = 3·1 + 1·0 − 2 = 1 > 0 → nhận. Đây chính xác là cách một perceptron quyết định."
        >
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Câu hỏi trên mô tả đúng một phép tính nằm bên trong mọi mạng nơ-ron.
            Bạn cân hai yếu tố, gán mỗi yếu tố một mức độ quan trọng, cộng lại,
            so với một ngưỡng trong đầu, rồi trả về &ldquo;có&rdquo; hoặc
            &ldquo;không&rdquo;. Thao tác đó có một tên gọi riêng:{" "}
            <strong>perceptron</strong> — đơn vị tính toán đầu tiên của mạng nơ-ron.
            Bài này đưa bạn từ câu trả lời vừa xong đến cơ chế bên trong, và vì
            sao mọi mạng sâu hiện đại vẫn dựa trên ý tưởng ấy.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Ẩn dụ">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Brain size={20} className="text-accent" /> Một cử tri chỉ biết nói &ldquo;có&rdquo; hoặc
            &ldquo;không&rdquo;
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Nhớ lại ứng viên vừa xong: 5 năm kinh nghiệm, không có bằng. Bạn nhân
            3·1 cho kinh nghiệm, cộng 1·0 cho bằng cấp, trừ đi bias 2 — kết quả ra
            1, lớn hơn 0, nên bạn nhận. Thao tác đó gọi là{" "}
            <strong>tổng có trọng số</strong> (weighted sum): mỗi đầu vào xᵢ được
            nhân với <em>trọng số</em> wᵢ thể hiện mức độ quan trọng của nó, rồi
            cộng tất cả lại, cộng thêm bias — một hằng số điều chỉnh{" "}
            <em>ngưỡng</em> mà perceptron mới chịu nói &ldquo;có&rdquo;. Nhờ vậy,
            thay đổi trọng số là thay đổi ưu tiên; thay đổi bias là thay đổi độ
            &ldquo;khó tính&rdquo; của nơ-ron.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="rounded-xl border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <ThumbsUp size={16} />
                <span className="text-sm font-semibold">Đầu vào (xᵢ)</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Dữ liệu quan sát được: kinh nghiệm, bằng cấp, chiều cao, điểm thi... thường là số.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <Zap size={16} />
                <span className="text-sm font-semibold">Trọng số (wᵢ) và bias (b)</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Mức độ quan trọng của từng đầu vào, và &ldquo;ngưỡng cá tính&rdquo; của nơ-ron. Đây
                là phần nơ-ron <em>học</em>.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <ThumbsDown size={16} />
                <span className="text-sm font-semibold">Đầu ra (y)</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Một con số duy nhất: 0 hoặc 1. Không có &ldquo;có lẽ&rdquo;, không có xác suất — chỉ
                &ldquo;có&rdquo; hoặc &ldquo;không&rdquo;.
              </p>
            </div>
          </div>

          <p className="text-sm text-foreground/85 leading-relaxed">
            Chỉ một phép cộng và một ngưỡng — vậy mà đủ để phân loại. Đây chính
            là lý do perceptron là <strong>viên gạch đầu tiên</strong> của mọi mạng
            nơ-ron hiện đại. Mạng phức tạp đến mấy, cuối cùng vẫn là hàng triệu
            phép tính như thế xếp chồng lên nhau.
          </p>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TRỰC QUAN HOÁ ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-6">
            <LessonSection label="Bàn thí nghiệm: xoay đường quyết định" step={1}>
              <PerceptronPlayground />
            </LessonSection>

            <LessonSection label="Sơ đồ một perceptron: nhìn thấy cả phép tính" step={2}>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                Đây là cùng một perceptron, nhưng biểu diễn dưới dạng <em>sơ đồ mạch</em>. Chỉnh
                x₁, x₂, w₁, w₂, b và theo dõi giá trị tổng Σ cùng với đầu ra cuối cùng.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg border border-border bg-surface/40 p-3 space-y-2">
                  <p className="text-xs font-semibold text-tertiary uppercase tracking-wider">
                    Đầu vào
                  </p>
                  {[
                    { label: "x₁", value: x1, set: setX1 },
                    { label: "x₂", value: x2, set: setX2 },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="font-mono text-sm text-foreground w-6">{label}</span>
                      <div className="flex gap-1">
                        {[0, 1].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => set(v)}
                            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${value === v
                                ? "bg-accent text-white"
                                : "border border-border bg-card text-muted hover:text-foreground"
                              }`}
                          >
                            {v === 1 ? "Có (1)" : "Không (0)"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-border bg-surface/40 p-3 space-y-2">
                  <p className="text-xs font-semibold text-tertiary uppercase tracking-wider">
                    Trọng số & bias
                  </p>
                  {[
                    { label: "w₁", value: w1, set: setW1, min: -2, max: 2 },
                    { label: "w₂", value: w2, set: setW2, min: -2, max: 2 },
                    { label: "b", value: b, set: setB, min: -3, max: 3 },
                  ].map(({ label, value, set, min, max }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="font-mono text-xs text-foreground w-6">{label}</span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={0.05}
                        value={value}
                        onChange={(e) => set(parseFloat(e.target.value))}
                        aria-label={label}
                        className="flex-1 h-1.5 accent-accent"
                      />
                      <span className="font-mono text-xs tabular-nums text-accent w-10 text-right">
                        {value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <PerceptronDiagram x1={x1} x2={x2} w1={w1} w2={w2} b={b} />

              <div className="mt-4 rounded-lg border border-border bg-surface/50 p-4 text-center">
                <p className="text-sm text-foreground">
                  <span className="text-tertiary">Phép tính: </span>
                  <span className="font-mono">
                    ({x1} × {w1.toFixed(2)}) + ({x2} × {w2.toFixed(2)}) + ({b.toFixed(2)}) ={" "}
                    <strong
                      className={z > 0 ? "text-emerald-500" : "text-rose-500"}
                    >
                      {z.toFixed(2)}
                    </strong>
                  </span>
                </p>
                <p className="text-xs text-muted mt-1">
                  {z > 0 ? "> 0 ⟶ đầu ra = 1 (CÓ)" : "≤ 0 ⟶ đầu ra = 0 (KHÔNG)"}
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={out}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold ${out === 1
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                      }`}
                  >
                    Nơ-ron nói: {out === 1 ? "CÓ" : "KHÔNG"}
                  </motion.div>
                </AnimatePresence>
              </div>
            </LessonSection>

            <LessonSection label="Ba cổng logic: AND, OR và kẻ thù XOR" step={3}>
              <p className="text-sm text-muted mb-3 leading-relaxed">
                Perceptron có thể học ba cổng logic cơ bản? Bấm vào từng cổng dưới đây. Hai cổng
                đầu — một đường thẳng đủ. Cổng thứ ba là nơi mọi chuyện vỡ kế hoạch.
              </p>
              <LogicGatesDemo />
            </LessonSection>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc hiểu">
        <AhaMoment>
          Mỗi nơ-ron — dù nằm trong GPT-4 hay trong mạng nhận diện chó mèo — vẫn chỉ làm đúng một
          việc: <strong>cộng có trọng số rồi bật / tắt</strong>.
          <br />
          <br />
          Mạng sâu chỉ đang <em>xếp chồng</em> hàng triệu phép tính đơn giản ấy lên nhau. Hiểu một
          perceptron là hiểu viên gạch cơ bản của cả kiến trúc.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — DEEPEN (luật học) ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Đi sâu hơn">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-2">
          <Lightbulb size={18} className="text-accent" />
          Perceptron tự chỉnh trọng số thế nào?
        </h3>
        <LearningRuleDemo />
      </LessonSection>

      {/* ━━━ BƯỚC 6 — CHALLENGE ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Vì sao một perceptron KHÔNG thể giải được bài toán XOR? (chọn câu trả lời đúng và sát nhất)"
          options={[
            "Vì XOR cần nhiều hơn 2 đầu vào",
            "Vì không có một đường thẳng nào chia đúng 4 điểm: (0,0)=0, (0,1)=1, (1,0)=1, (1,1)=0",
            "Vì XOR chỉ đúng với hàm sigmoid",
            "Vì perceptron cần quá nhiều dữ liệu để học",
          ]}
          correct={1}
          explanation="4 điểm của XOR nằm ở 4 góc của hình vuông. Các cặp cùng nhãn nằm chéo nhau — không có đường thẳng nào chia được. Cách thoát: xếp nhiều perceptron thành lớp (MLP), tạo ra các đường cong."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Bạn muốn một perceptron quyết định 'mở cửa hàng hôm nay' dựa trên x₁ (trời nắng) và x₂ (cuối tuần). Cả hai đều phải đúng mới mở. Cổng logic nào mô tả điều này?"
            options={[
              "OR — chỉ cần một trong hai là đủ",
              "AND — phải cả hai cùng đúng",
              "XOR — đúng một trong hai",
              "Không mô tả được bằng cổng logic",
            ]}
            correct={1}
            explanation="'Phải cả hai' = AND. Một perceptron với w₁ = 1, w₂ = 1, b = −1.5 sẽ mở cửa khi cả hai đầu vào cùng bằng 1. Đổi bias thành −0.5 sẽ biến nó thành OR (một trong hai đủ)."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — EXPLAIN (≤ 2 LaTeX) ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Năm 1958, Frank Rosenblatt tại Cornell nối một bộ điện trở chỉnh bằng
            tay vào một mảng quang điện tử rồi chiếu hình lên đó. Chiếc máy —
            Mark I Perceptron — nhìn hình, đoán nhãn, nhận phản hồi đúng/sai, rồi
            tự điều chỉnh các điện trở để lần sau đoán tốt hơn. Không ai gõ
            &ldquo;nếu sáng thì nhãn A&rdquo; vào mã nguồn — máy{" "}
            <em>tự học</em> quy tắc từ dữ liệu. Dưới đây là hai công thức cốt lõi
            đằng sau cơ chế đó — mỗi công thức kèm lời giải thích và một hình
            minh hoạ để bạn &ldquo;thấy&rdquo; nó hoạt động.
          </p>

          {/* Công thức 1 — Tổng có trọng số */}
          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            1. Tổng có trọng số (weighted sum)
          </h4>
          <LaTeX block>{"z = w_1 x_1 + w_2 x_2 + \\cdots + w_n x_n + b"}</LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc: <em>nhân từng đầu vào với trọng số của nó, cộng tất cả lại, rồi cộng thêm
              bias</em>. Trọng số wᵢ cao = đầu vào xᵢ quan trọng. Bias b giống như &ldquo;ngưỡng
            cá tính&rdquo; của nơ-ron — b âm lớn nghĩa là nơ-ron &ldquo;khó tính&rdquo;, phải cộng
            được nhiều mới qua được 0.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <p className="text-xs text-muted mb-2 font-semibold uppercase tracking-wide">
              Hình dung bằng SVG
            </p>
            <svg viewBox="0 0 400 160" className="w-full max-w-md mx-auto">
              {/* Các đường "dây" từ input đến sum */}
              <circle cx={60} cy={40} r={20} fill="#3b82f6" />
              <text x={60} y={45} textAnchor="middle" fontSize={11} fill="#ffffff" fontWeight={700}>
                x₁
              </text>
              <circle cx={60} cy={100} r={20} fill="#3b82f6" />
              <text x={60} y={105} textAnchor="middle" fontSize={11} fill="#ffffff" fontWeight={700}>
                x₂
              </text>
              <circle cx={60} cy={140} r={14} fill="#94a3b8" />
              <text x={60} y={144} textAnchor="middle" fontSize={11} fill="#ffffff" fontWeight={700}>
                b
              </text>

              <line x1={80} y1={40} x2={220} y2={75} stroke="#3b82f6" strokeWidth={3} opacity={0.8} />
              <text x={130} y={52} fontSize={11} fill="#3b82f6" fontWeight={700}>
                × w₁
              </text>
              <line x1={80} y1={100} x2={220} y2={85} stroke="#3b82f6" strokeWidth={2} opacity={0.6} />
              <text x={130} y={110} fontSize={11} fill="#3b82f6" fontWeight={700}>
                × w₂
              </text>
              <line
                x1={74}
                y1={140}
                x2={220}
                y2={90}
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                opacity={0.6}
              />

              <circle cx={240} cy={80} r={24} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
              <text x={240} y={85} textAnchor="middle" fontSize={16} fill="var(--text-primary)">
                Σ
              </text>
              <text x={240} y={120} textAnchor="middle" fontSize={11} fill="currentColor" className="text-muted">
                tổng
              </text>

              <line x1={264} y1={80} x2={320} y2={80} stroke="#475569" strokeWidth={1.5} />
              <text x={295} y={72} textAnchor="middle" fontSize={11} fill="currentColor" className="text-foreground" fontWeight={700}>
                z
              </text>
            </svg>
          </div>

          {/* Công thức 2 — Hàm bước */}
          <h4 className="text-sm font-semibold text-foreground mt-5 mb-2">
            2. Hàm bước (step function)
          </h4>
          <LaTeX block>{"y = \\begin{cases} 1 & \\text{nếu } z > 0 \\\\ 0 & \\text{nếu } z \\le 0 \\end{cases}"}</LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc: <em>nếu tổng lớn hơn 0, nơ-ron bật (xuất 1); ngược lại, nơ-ron tắt (xuất 0)</em>.
            Đây là bước &ldquo;quyết định&rdquo; biến một phép cộng liên tục thành một câu trả lời
            nhị phân. Các mạng hiện đại thay hàm bước bằng{" "}
            <TopicLink slug="activation-functions">hàm kích hoạt</TopicLink> trơn hơn như sigmoid,
            ReLU — nhưng ý tưởng &ldquo;bật/tắt dựa trên tổng&rdquo; vẫn giữ nguyên.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <p className="text-xs text-muted mb-2 font-semibold uppercase tracking-wide">
              Đồ thị hàm bước
            </p>
            <svg viewBox="0 0 360 180" className="w-full max-w-md mx-auto">
              <line x1={30} y1={90} x2={330} y2={90} stroke="currentColor" className="text-muted" strokeWidth={1} />
              <line x1={180} y1={30} x2={180} y2={160} stroke="currentColor" className="text-muted" strokeWidth={1} />
              {/* Đường hàm bước */}
              <line x1={30} y1={140} x2={180} y2={140} stroke="#3b82f6" strokeWidth={3} />
              <line x1={180} y1={40} x2={330} y2={40} stroke="#ef4444" strokeWidth={3} />
              <line x1={180} y1={140} x2={180} y2={40} stroke="currentColor" className="text-muted" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={180} cy={140} r={4} fill="#3b82f6" />
              <circle cx={180} cy={40} r={4} fill="#ef4444" />
              <text x={60} y={135} fontSize={11} fill="#3b82f6" fontWeight={700}>
                y = 0
              </text>
              <text x={250} y={35} fontSize={11} fill="#ef4444" fontWeight={700}>
                y = 1
              </text>
              <text x={175} y={175} textAnchor="end" fontSize={11} fill="currentColor" className="text-muted">
                z = 0
              </text>
              <text x={320} y={105} fontSize={11} fill="currentColor" className="text-muted">
                z →
              </text>
            </svg>
            <p className="text-xs text-muted text-center italic leading-relaxed">
              Một cầu thang bằng: bên trái 0 tất cả là 0, bên phải 0 tất cả là 1. Chính vì góc nhọn
              tại z = 0 mà hàm bước không thể dùng cho mạng sâu — không có đạo hàm để học ngược.
            </p>
          </div>

          <Callout variant="insight" title="Luật học Rosenblatt">
            Khi perceptron đoán sai, nó <strong>tự chỉnh trọng số</strong>:{" "}
            <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">
              wᵢ ← wᵢ + η · (target − output) · xᵢ
            </code>
            . Sai lệch <em>target − output</em> = 0 khi đoán đúng (không đổi), +1 hoặc −1 khi sai.
            Nhân với xᵢ giúp đẩy trọng số theo đúng hướng. Rosenblatt chứng minh: nếu dữ liệu phân
            tách tuyến tính, luật này <strong>luôn hội tụ</strong> sau số bước hữu hạn.
          </Callout>

          <Callout variant="warning" title="Mùa đông AI đầu tiên">
            Năm 1969, Minsky và Papert chứng minh perceptron không giải được XOR — một bài toán
            tưởng đơn giản. Niềm tin đang lên cao về AI bị dội gáo nước lạnh. Ngân sách nghiên cứu
            bị cắt, gần một thập kỷ gần như không có tiến bộ. Giải pháp không được công nhận rộng
            rãi cho tới khi có <strong>
              <TopicLink slug="mlp">Multi-Layer Perceptron (MLP)</TopicLink>
            </strong>{" "}
            và <TopicLink slug="backpropagation">thuật toán lan truyền ngược</TopicLink> trong
            thập niên 1980.
          </Callout>

          <CollapsibleDetail title="Perceptron khác gì hồi quy tuyến tính?">
            <p className="text-sm leading-relaxed">
              Cả hai đều tính tổng có trọng số. Khác biệt chính ở <em>đầu ra</em>:{" "}
              <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink> xuất một số liên
              tục (giá nhà, doanh thu), perceptron xuất 0/1 (có/không). Và cách học cũng khác: hồi
              quy tối thiểu hoá bình phương sai số qua công thức đóng hoặc gradient descent;
              perceptron chỉ cần luật Rosenblatt đơn giản.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Vì sao phải có bias? Gộp vào trọng số không được à?">
            <p className="text-sm leading-relaxed">
              Thực ra được — người ta hay &ldquo;gộp&rdquo; bias bằng cách thêm một đầu vào giả x₀ =
              1 với trọng số w₀ = b. Khi đó công thức chỉ còn một tổng. Trong code máy học thực tế,
              thư viện làm điều này tự động để bạn không phải quản lý riêng bias. Nhưng khi giảng
              dạy, tách bias ra giúp trực giác rõ hơn: trọng số &ldquo;xoay&rdquo; đường quyết
              định, bias &ldquo;dịch&rdquo; nó.
            </p>
          </CollapsibleDetail>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Bốn điểm kết nối — perceptron đi đâu từ đây?
          </h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/85 leading-relaxed">
            <li>
              Xếp nhiều perceptron thành từng lớp = <TopicLink slug="mlp">MLP (Multi-Layer Perceptron)</TopicLink>.
              Mỗi lớp học một kiểu &ldquo;đặc trưng&rdquo; của dữ liệu. Với 2 lớp trở lên, mạng có
              thể học được XOR và các bài toán phi tuyến.
            </li>
            <li>
              Thay hàm bước bằng{" "}
              <TopicLink slug="activation-functions">hàm kích hoạt</TopicLink> trơn (sigmoid, ReLU,
              tanh) để có đạo hàm, mở đường cho{" "}
              <TopicLink slug="backpropagation">lan truyền ngược</TopicLink>.
            </li>
            <li>
              Dùng{" "}
              <TopicLink slug="gradient-descent">gradient descent</TopicLink> để tối ưu trọng số
              thay vì luật học đơn giản — đây là cách mọi mạng sâu ngày nay được huấn luyện.
            </li>
            <li>
              Hiểu <em>đường quyết định</em> → hiểu luôn{" "}
              <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink> và{" "}
              <TopicLink slug="svm">SVM</TopicLink>, vì chúng đều dựa trên ý tưởng &ldquo;chia không
              gian bằng siêu phẳng&rdquo;.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt & kiểm tra">
        <MiniSummary
          title="4 điều cần nhớ về perceptron"
          points={[
            "Một perceptron = cộng có trọng số mọi đầu vào + bias, rồi bật/tắt theo hàm bước.",
            "Trọng số quyết định hướng đường chia; bias dịch song song đường chia.",
            "Chỉ chia được dữ liệu phân tách tuyến tính — làm được AND, OR; KHÔNG làm được XOR.",
            "Luật học Rosenblatt: điểm sai → kéo trọng số theo hướng sửa đúng điểm ấy.",
          ]}
        />

        <div className="mt-6">
          <Callout variant="tip" title="Bước tiếp theo — xem perceptron trong ứng dụng thật">
            Muốn biết perceptron thực sự được dùng để làm gì? Xem ứng dụng:{" "}
            <TopicLink slug="perceptron-in-image-classification">
              Perceptron nhận diện ảnh
            </TopicLink>{" "}
            — trực quan hoá cách một perceptron xử lý ảnh chữ số 28×28 từ bộ MNIST.
          </Callout>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted">
          <Sparkles size={12} className="text-accent" />
          <span>
            Trước khi chuyển, bấm qua 6 câu hỏi dưới đây để chắc chắn hiểu viên gạch đầu tiên của
            mạng nơ-ron.
          </span>
          <AlertTriangle size={12} />
          <Wand2 size={12} />
        </div>

        <div className="mt-4">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
