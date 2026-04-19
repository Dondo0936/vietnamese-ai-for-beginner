"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Target,
  Wand2,
  RotateCcw,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  LessonSection,
  TopicLink,
  StepReveal,
  SliderGroup,
  ToggleCompare,
  LaTeX,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "logistic-regression",
  title: "Logistic Regression",
  titleVi: "Hồi quy logistic",
  description:
    "Khi câu trả lời chỉ có hai lựa chọn — có hay không. Hồi quy logistic ép số thực vào khoảng 0–1 để dự đoán xác suất.",
  category: "classic-ml",
  tags: ["classification", "supervised-learning", "probability"],
  difficulty: "beginner",
  relatedSlugs: ["linear-regression", "naive-bayes", "svm"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

/* ───────── Toán học dùng chung ───────── */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

type Pt = { x: number; y: number; label: 0 | 1 };

const INITIAL_POINTS: Pt[] = [
  { x: 90, y: 210, label: 0 },
  { x: 130, y: 160, label: 0 },
  { x: 160, y: 220, label: 0 },
  { x: 180, y: 140, label: 0 },
  { x: 120, y: 110, label: 0 },
  { x: 200, y: 180, label: 0 },
  { x: 220, y: 230, label: 0 },
  { x: 300, y: 100, label: 1 },
  { x: 340, y: 180, label: 1 },
  { x: 360, y: 140, label: 1 },
  { x: 390, y: 220, label: 1 },
  { x: 420, y: 150, label: 1 },
  { x: 450, y: 200, label: 1 },
  { x: 370, y: 250, label: 1 },
];

/* ─────────────────────────────────────────────────────────────
   Playground chính — kéo điểm, chỉnh trọng số, xem biên phân loại
   ───────────────────────────────────────────────────────────── */
interface PlaygroundProps {
  weight: number;
  bias: number;
  threshold: number;
}

function SigmoidClassifierPlayground({ weight, bias, threshold }: PlaygroundProps) {
  const [points, setPoints] = useState<Pt[]>(INITIAL_POINTS);
  const [addLabel, setAddLabel] = useState<0 | 1>(1);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const stats = useMemo(() => {
    let correct = 0;
    for (const p of points) {
      const z = weight * ((p.x - 250) / 80) + bias;
      const prob = sigmoid(z);
      const pred = prob >= threshold ? 1 : 0;
      if (pred === p.label) correct++;
    }
    return {
      correct,
      total: points.length,
      accuracy: points.length > 0 ? correct / points.length : 0,
    };
  }, [points, weight, bias, threshold]);

  const sigmoidPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = (i / 120) * 500;
      const z = weight * ((x - 250) / 80) + bias;
      const y = 300 - sigmoid(z) * 260 - 20;
      pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [weight, bias]);

  const thresholdY = useMemo(() => 300 - threshold * 260 - 20, [threshold]);

  const boundaryX = useMemo(() => {
    // z = 0 ↔ w·((x−250)/80) + b = 0 ↔ x = 250 − 80·b/w
    if (Math.abs(weight) < 1e-6) return null;
    const logit = Math.log(threshold / (1 - threshold));
    return 250 + (80 * (logit - bias)) / weight;
  }, [weight, bias, threshold]);

  const onSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (dragIdx !== null) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 500;
      const y = ((e.clientY - rect.top) / rect.height) * 320;
      if (x < 10 || x > 490 || y < 10 || y > 295) return;
      setPoints((prev) => [...prev, { x, y, label: addLabel }]);
    },
    [addLabel, dragIdx],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (dragIdx === null) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(10, Math.min(490, ((e.clientX - rect.left) / rect.width) * 500));
      const y = Math.max(10, Math.min(295, ((e.clientY - rect.top) / rect.height) * 320));
      setPoints((prev) => prev.map((p, i) => (i === dragIdx ? { ...p, x, y } : p)));
    },
    [dragIdx],
  );

  return (
    <div className="space-y-3">
      <svg
        viewBox="0 0 500 320"
        className="w-full rounded-lg border border-border bg-background cursor-crosshair"
        style={{ touchAction: dragIdx !== null ? "none" : "auto" }}
        role="img"
        aria-label={`Bộ phân loại logistic — ${points.length} điểm, accuracy ${(stats.accuracy * 100).toFixed(0)}%`}
        onClick={onSvgClick}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragIdx(null)}
        onPointerLeave={() => setDragIdx(null)}
      >
        {/* Vùng phân loại */}
        {boundaryX !== null && (
          <>
            <rect
              x={0}
              y={0}
              width={Math.max(0, Math.min(500, boundaryX))}
              height={320}
              fill="#3b82f6"
              opacity={0.06}
            />
            <rect
              x={Math.max(0, Math.min(500, boundaryX))}
              y={0}
              width={500 - Math.max(0, Math.min(500, boundaryX))}
              height={320}
              fill="#ef4444"
              opacity={0.06}
            />
          </>
        )}

        {/* Lưới */}
        {[0, 80, 160, 240, 300].map((y) => (
          <line
            key={`gy-${y}`}
            x1={0}
            y1={y}
            x2={500}
            y2={y}
            stroke="currentColor"
            className="text-border"
            strokeWidth={0.5}
          />
        ))}

        {/* Trục sigmoid P(y=1) */}
        <line x1={10} y1={20} x2={10} y2={280} stroke="currentColor" className="text-muted" strokeWidth={0.5} />
        <text x={14} y={26} fontSize={11} fill="currentColor" className="text-muted">P = 1</text>
        <text x={14} y={278} fontSize={11} fill="currentColor" className="text-muted">P = 0</text>

        {/* Đường sigmoid */}
        <motion.path
          d={sigmoidPath}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2.5}
          animate={{ d: sigmoidPath }}
          transition={{ duration: 0.15 }}
        />

        {/* Ngưỡng */}
        <line
          x1={0}
          y1={thresholdY}
          x2={500}
          y2={thresholdY}
          stroke="#16a34a"
          strokeWidth={1.2}
          strokeDasharray="4 4"
          opacity={0.7}
        />
        <text x={498} y={thresholdY - 4} fontSize={11} fill="#16a34a" textAnchor="end" fontWeight={600}>
          ngưỡng = {(threshold * 100).toFixed(0)}%
        </text>

        {/* Biên quyết định */}
        {boundaryX !== null && boundaryX > 0 && boundaryX < 500 && (
          <motion.line
            x1={boundaryX}
            y1={0}
            x2={boundaryX}
            y2={320}
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="6 4"
            animate={{ x1: boundaryX, x2: boundaryX }}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Các điểm */}
        {points.map((p, i) => {
          const z = weight * ((p.x - 250) / 80) + bias;
          const prob = sigmoid(z);
          const pred = prob >= threshold ? 1 : 0;
          const isCorrect = pred === p.label;
          return (
            <g key={`pt-${i}`}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={7}
                fill={p.label === 0 ? "#3b82f6" : "#ef4444"}
                stroke={isCorrect ? "#ffffff" : "#f59e0b"}
                strokeWidth={isCorrect ? 1.5 : 2.5}
                className="cursor-grab"
                animate={{ cx: p.x, cy: p.y }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setDragIdx(i);
                }}
              />
              <title>
                {`Lớp ${p.label} — P(y=1) = ${(prob * 100).toFixed(0)}% ${isCorrect ? "(đúng)" : "(sai)"}`}
              </title>
            </g>
          );
        })}

        {/* Chỉ số accuracy */}
        <g>
          <rect x={10} y={6} width={180} height={22} rx={4} fill="currentColor" className="text-surface" opacity={0.9} />
          <text x={20} y={21} fontSize={11} fill="currentColor" className="text-foreground" fontWeight={600}>
            Accuracy: {(stats.accuracy * 100).toFixed(0)}% ({stats.correct}/{stats.total})
          </text>
        </g>
      </svg>

      {/* Bảng điều khiển thêm điểm */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">Nhấp vào canvas để thêm điểm:</span>
        <button
          type="button"
          onClick={() => setAddLabel(0)}
          className={`rounded-full px-3 py-1 font-semibold transition-colors ${
            addLabel === 0
              ? "bg-blue-500 text-white"
              : "border border-border bg-card text-muted hover:text-foreground"
          }`}
        >
          Lớp 0 (xanh)
        </button>
        <button
          type="button"
          onClick={() => setAddLabel(1)}
          className={`rounded-full px-3 py-1 font-semibold transition-colors ${
            addLabel === 1
              ? "bg-red-500 text-white"
              : "border border-border bg-card text-muted hover:text-foreground"
          }`}
        >
          Lớp 1 (đỏ)
        </button>
        <button
          type="button"
          onClick={() => setPoints(INITIAL_POINTS)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1 text-muted hover:text-foreground"
        >
          <RotateCcw size={12} /> Đặt lại
        </button>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Viền vàng = dự đoán sai. Kéo điểm hoặc chỉnh slider phía dưới để quan sát biên
        quyết định (đường tím nét đứt) di chuyển. Đường xanh dương là đường cong sigmoid
        cho P(y=1) theo trục ngang.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Demo linear vs logistic — ToggleCompare
   ───────────────────────────────────────────────────────────── */
function LinearPredictionCard() {
  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <Activity size={14} />
        <span className="text-sm font-semibold">Dùng hồi quy tuyến tính cho phân loại</span>
      </div>
      <svg viewBox="0 0 380 180" className="w-full">
        {/* Trục */}
        <line x1={20} y1={150} x2={370} y2={150} stroke="currentColor" className="text-border" />
        <line x1={20} y1={20} x2={20} y2={150} stroke="currentColor" className="text-border" />
        <text x={25} y={18} fontSize={11} fill="currentColor" className="text-muted">y</text>

        {/* Ngưỡng 0 và 1 */}
        <line x1={20} y1={140} x2={370} y2={140} stroke="#16a34a" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.6} />
        <line x1={20} y1={40} x2={370} y2={40} stroke="#16a34a" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.6} />
        <text x={372} y={44} fontSize={11} fill="#16a34a" textAnchor="start">y=1</text>
        <text x={372} y={144} fontSize={11} fill="#16a34a" textAnchor="start">y=0</text>

        {/* Đường tuyến tính dốc */}
        <line x1={40} y1={170} x2={360} y2={0} stroke="#f59e0b" strokeWidth={2.5} />

        {/* Điểm dữ liệu */}
        {[
          { x: 60, y: 140, c: "#3b82f6" },
          { x: 90, y: 140, c: "#3b82f6" },
          { x: 120, y: 140, c: "#3b82f6" },
          { x: 150, y: 140, c: "#3b82f6" },
          { x: 240, y: 40, c: "#ef4444" },
          { x: 270, y: 40, c: "#ef4444" },
          { x: 300, y: 40, c: "#ef4444" },
          { x: 340, y: 40, c: "#ef4444" },
        ].map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={p.c} stroke="#fff" strokeWidth={1} />
        ))}

        {/* Vùng lỗi */}
        <rect x={20} y={150} width={350} height={20} fill="#dc2626" opacity={0.1} />
        <rect x={20} y={0} width={350} height={20} fill="#dc2626" opacity={0.1} />
        <text x={195} y={175} fontSize={11} fill="#dc2626" textAnchor="middle">
          y &lt; 0 (vô nghĩa)
        </text>
      </svg>
      <p className="text-xs text-foreground/85 leading-relaxed">
        Đường thẳng có thể cho output âm hoặc lớn hơn 1. Nhưng xác suất phải nằm
        trong [0, 1]! Thêm vài điểm ngoại lai, đường thẳng bị kéo hẳn đi — biên phân
        loại dịch sai theo.
      </p>
    </div>
  );
}

function LogisticPredictionCard() {
  return (
    <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
        <Target size={14} />
        <span className="text-sm font-semibold">Dùng hồi quy logistic cho phân loại</span>
      </div>
      <svg viewBox="0 0 380 180" className="w-full">
        <line x1={20} y1={150} x2={370} y2={150} stroke="currentColor" className="text-border" />
        <line x1={20} y1={20} x2={20} y2={150} stroke="currentColor" className="text-border" />
        <text x={25} y={18} fontSize={11} fill="currentColor" className="text-muted">P</text>

        <line x1={20} y1={140} x2={370} y2={140} stroke="#16a34a" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.6} />
        <line x1={20} y1={40} x2={370} y2={40} stroke="#16a34a" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.6} />
        <text x={372} y={44} fontSize={11} fill="#16a34a" textAnchor="start">P=1</text>
        <text x={372} y={144} fontSize={11} fill="#16a34a" textAnchor="start">P=0</text>

        {/* Đường sigmoid */}
        <path
          d={Array.from({ length: 80 }, (_, i) => {
            const xi = 20 + (i / 79) * 350;
            const z = ((xi - 195) / 40) * 0.6;
            const yi = 140 - sigmoid(z) * 100;
            return `${i === 0 ? "M" : "L"}${xi.toFixed(1)},${yi.toFixed(1)}`;
          }).join(" ")}
          fill="none"
          stroke="#16a34a"
          strokeWidth={2.5}
        />

        {/* Điểm dữ liệu */}
        {[
          { x: 60, y: 140, c: "#3b82f6" },
          { x: 90, y: 140, c: "#3b82f6" },
          { x: 120, y: 140, c: "#3b82f6" },
          { x: 150, y: 140, c: "#3b82f6" },
          { x: 240, y: 40, c: "#ef4444" },
          { x: 270, y: 40, c: "#ef4444" },
          { x: 300, y: 40, c: "#ef4444" },
          { x: 340, y: 40, c: "#ef4444" },
        ].map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={p.c} stroke="#fff" strokeWidth={1} />
        ))}
      </svg>
      <p className="text-xs text-foreground/85 leading-relaxed">
        Hàm sigmoid <em>ép</em> mọi đầu vào về khoảng (0, 1). Điểm nào nằm trên
        ngưỡng 0.5 được phân vào lớp 1, dưới ngưỡng là lớp 0. Dù có outlier xa,
        đường cong vẫn bằng phẳng ở hai đầu.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Visual nhỏ — từ đường thẳng đến sigmoid
   ───────────────────────────────────────────────────────────── */
function SigmoidMiniVisual() {
  return (
    <svg viewBox="0 0 320 140" className="w-full max-w-sm">
      <line x1={10} y1={110} x2={310} y2={110} stroke="currentColor" className="text-border" />
      <line x1={160} y1={10} x2={160} y2={130} stroke="currentColor" className="text-border" />
      <line x1={10} y1={20} x2={310} y2={20} stroke="#16a34a" strokeDasharray="3 3" strokeWidth={0.8} opacity={0.6} />
      <line x1={10} y1={110} x2={310} y2={110} stroke="#16a34a" strokeDasharray="3 3" strokeWidth={0.8} opacity={0.6} />
      <text x={312} y={24} fontSize={11} fill="#16a34a">1</text>
      <text x={312} y={114} fontSize={11} fill="#16a34a">0</text>
      <text x={156} y={130} fontSize={11} fill="currentColor" className="text-muted" textAnchor="end">0</text>
      <path
        d={Array.from({ length: 80 }, (_, i) => {
          const xi = 10 + (i / 79) * 300;
          const z = ((xi - 160) / 40) * 1.3;
          const yi = 110 - sigmoid(z) * 90;
          return `${i === 0 ? "M" : "L"}${xi.toFixed(1)},${yi.toFixed(1)}`;
        }).join(" ")}
        fill="none"
        stroke="#2563eb"
        strokeWidth={2.4}
      />
    </svg>
  );
}

function LogOddsMiniVisual() {
  return (
    <svg viewBox="0 0 320 140" className="w-full max-w-sm">
      <line x1={10} y1={70} x2={310} y2={70} stroke="currentColor" className="text-border" />
      <line x1={160} y1={10} x2={160} y2={130} stroke="currentColor" className="text-border" />
      {/* log-odds là hàm ngược của sigmoid, tăng vô hạn */}
      <path
        d={Array.from({ length: 80 }, (_, i) => {
          const p = 0.02 + (i / 79) * 0.96;
          const xi = 10 + (i / 79) * 300;
          const lo = Math.log(p / (1 - p));
          const yi = 70 - lo * 14;
          return `${i === 0 ? "M" : "L"}${xi.toFixed(1)},${Math.max(6, Math.min(134, yi)).toFixed(1)}`;
        }).join(" ")}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth={2.4}
      />
      <text x={12} y={18} fontSize={11} fill="currentColor" className="text-muted">log-odds lớn</text>
      <text x={12} y={130} fontSize={11} fill="currentColor" className="text-muted">log-odds nhỏ</text>
      <text x={308} y={82} fontSize={11} fill="currentColor" className="text-muted" textAnchor="end">p = 1</text>
      <text x={18} y={82} fontSize={11} fill="currentColor" className="text-muted">p = 0</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   ProbOddsLogOddsVisual — kéo P, xem odds + log-odds cập nhật
   ───────────────────────────────────────────────────────────── */
function ProbOddsLogOddsVisual({ pct }: { pct: number }) {
  const p = Math.max(0.01, Math.min(0.99, pct / 100));
  const odds = p / (1 - p);
  const logOdds = Math.log(odds);
  const oddsLabel =
    odds >= 1
      ? `${odds.toFixed(2)} : 1`
      : `1 : ${(1 / odds).toFixed(2)}`;

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center dark:border-blue-800 dark:bg-blue-900/20">
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
            Xác suất P
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-foreground">
            {(p * 100).toFixed(0)}%
          </div>
          <div className="mt-1 text-[10px] text-muted">Nằm trong [0, 1]</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-center dark:border-purple-800 dark:bg-purple-900/20">
          <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
            Odds = P / (1 − P)
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-foreground">
            {oddsLabel}
          </div>
          <div className="mt-1 text-[10px] text-muted">Tỉ số thắng/thua</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Log-odds = log(odds)
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-foreground">
            {logOdds.toFixed(2)}
          </div>
          <div className="mt-1 text-[10px] text-muted">Tuyến tính với w·x + b</div>
        </div>
      </div>

      <svg viewBox="0 0 360 80" className="w-full">
        {/* Thanh xác suất */}
        <rect x={10} y={10} width={340} height={16} rx={8} fill="currentColor" className="text-surface" />
        <motion.rect
          x={10}
          y={10}
          height={16}
          rx={8}
          fill="#2563eb"
          animate={{ width: 340 * p }}
          transition={{ duration: 0.15 }}
        />
        <text x={10} y={42} fontSize={11} fill="currentColor" className="text-muted">
          Thanh xác suất: {(p * 100).toFixed(0)}% tô xanh, {(100 - p * 100).toFixed(0)}% còn lại
        </text>

        {/* Marker log-odds trên trục (−5..5) */}
        <line x1={10} y1={62} x2={350} y2={62} stroke="currentColor" className="text-border" />
        <line x1={180} y1={58} x2={180} y2={66} stroke="currentColor" className="text-border" />
        <text x={180} y={76} fontSize={11} fill="currentColor" className="text-muted" textAnchor="middle">
          0 (p = 0.5)
        </text>
        <motion.circle
          cy={62}
          r={5}
          fill="#16a34a"
          animate={{ cx: 180 + Math.max(-170, Math.min(170, logOdds * 34)) }}
          transition={{ duration: 0.15 }}
        />
      </svg>

      <p className="text-xs text-muted leading-relaxed">
        Logistic <strong>học tuyến tính</strong> trên log-odds — nghĩa là khi đặc trưng x tăng 1
        đơn vị, log-odds tăng đúng w đơn vị. Đây là lý do hệ số w của logistic có thể diễn giải
        được trực tiếp: &quot;tăng thêm 1 giờ học&quot; làm log-odds đậu phỏng vấn tăng đúng w.
      </p>
    </div>
  );
}

function CrossEntropyMiniVisual() {
  return (
    <svg viewBox="0 0 320 140" className="w-full max-w-sm">
      <line x1={20} y1={120} x2={310} y2={120} stroke="currentColor" className="text-border" />
      <line x1={20} y1={10} x2={20} y2={120} stroke="currentColor" className="text-border" />
      <text x={24} y={20} fontSize={11} fill="currentColor" className="text-muted">loss</text>
      <text x={310} y={132} fontSize={11} fill="currentColor" className="text-muted" textAnchor="end">p̂ = 1</text>
      <text x={22} y={132} fontSize={11} fill="currentColor" className="text-muted">p̂ = 0</text>
      {/* −log(p̂) */}
      <path
        d={Array.from({ length: 80 }, (_, i) => {
          const p = 0.02 + (i / 79) * 0.95;
          const xi = 20 + (i / 79) * 290;
          const yi = 120 + Math.log(p) * 20;
          return `${i === 0 ? "M" : "L"}${xi.toFixed(1)},${Math.max(8, yi).toFixed(1)}`;
        }).join(" ")}
        fill="none"
        stroke="#dc2626"
        strokeWidth={2.4}
      />
      <text x={42} y={30} fontSize={11} fill="#dc2626">loss lớn khi p̂ nhỏ</text>
      <text x={188} y={118} fontSize={11} fill="#16a34a">loss ≈ 0 khi p̂ → 1</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   QUIZ — đủ 5 câu tiếng Việt
   ───────────────────────────────────────────────────────────── */
const quizQuestions: QuizQuestion[] = [
  {
    question: "Vì sao không dùng hồi quy tuyến tính cho bài toán phân loại 'có/không'?",
    options: [
      "Hồi quy tuyến tính chạy chậm hơn",
      "Hồi quy tuyến tính cho giá trị ngoài [0, 1] — không hợp làm xác suất, và rất nhạy với ngoại lai",
      "Hồi quy tuyến tính không nhận input số",
      "Hồi quy tuyến tính chỉ dùng được cho ảnh",
    ],
    correct: 1,
    explanation:
      "Output tuyến tính có thể âm hoặc vượt 1 — không thể hiểu là xác suất. Thêm ngoại lai, đường thẳng bị xoay lệch nên biên phân loại cũng sai. Sigmoid ép mọi đầu vào vào khoảng (0, 1), ổn định và có ý nghĩa xác suất.",
  },
  {
    question: "Output của hàm sigmoid σ(z) luôn nằm trong khoảng nào?",
    options: [
      "(−1, 1)",
      "(0, 1)",
      "(−∞, +∞)",
      "{0, 1}",
    ],
    correct: 1,
    explanation:
      "σ(z) = 1 / (1 + e^(−z)). Khi z → −∞, σ → 0. Khi z → +∞, σ → 1. Khi z = 0, σ = 0.5. Vì mẫu luôn dương và tử số ≤ mẫu số, giá trị luôn nằm trong khoảng mở (0, 1) — rất hợp làm xác suất.",
  },
  {
    question: "Shopee muốn hạn chế bỏ lọt đơn huỷ. Nếu mô hình đang dùng ngưỡng 0.5 và bỏ sót 30% ca huỷ thật, ta nên làm gì?",
    options: [
      "Tăng ngưỡng lên 0.7 — chỉ báo khi rất chắc",
      "Giảm ngưỡng xuống 0.3 — dễ đánh dấu 'có thể huỷ' hơn, bắt được nhiều ca thật",
      "Bỏ sigmoid và dùng tuyến tính",
      "Huấn luyện lại từ đầu với dữ liệu ngẫu nhiên",
    ],
    correct: 1,
    explanation:
      "Giảm ngưỡng = dễ dán nhãn 'huỷ' hơn → tăng recall (bắt được nhiều ca thật), nhưng precision có thể giảm. Ở các bài toán bỏ sót nguy hiểm (y tế, gian lận), ngưỡng thấp thường được ưu tiên.",
  },
  {
    type: "fill-blank",
    question:
      "Hồi quy logistic dùng hàm mất mát {blank} cross-entropy, đảm bảo hàm loss {blank} (convex) nên gradient descent hội tụ đến cực tiểu toàn cục.",
    blanks: [
      { answer: "binary", accept: ["nhị phân", "binary", "Binary"] },
      { answer: "lồi", accept: ["convex", "lồi", "Lồi"] },
    ],
    explanation:
      "Binary cross-entropy (log loss) phạt nặng dự đoán tự tin nhưng sai, và là hàm lồi theo tham số w, b. Nếu dùng MSE với sigmoid, loss sẽ không lồi — gradient descent có thể kẹt ở cực tiểu cục bộ.",
  },
  {
    question: "Tăng ngưỡng (threshold) từ 0.3 lên 0.7 ảnh hưởng thế nào đến precision/recall?",
    options: [
      "Precision tăng, recall giảm — báo khắt khe hơn nên ít báo nhầm nhưng bỏ sót nhiều hơn",
      "Cả precision và recall cùng tăng",
      "Cả precision và recall cùng giảm",
      "Không thay đổi gì, chỉ đổi accuracy",
    ],
    correct: 0,
    explanation:
      "Ngưỡng cao = chỉ báo 'dương' khi mô hình rất chắc → ít False Positive → precision tăng, nhưng bỏ lọt nhiều ca dương thật → recall giảm. Bạn luôn đánh đổi giữa hai chỉ số này.",
  },
];

/* ═══════════════ MAIN ═══════════════ */
export default function LogisticRegressionTopic() {
  return (
    <>
      {/* ━━━ BƯỚC 1 — DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn được đưa dữ liệu 'đã đậu phỏng vấn hay chưa' theo điểm IELTS. Đầu ra cần là gì để hữu dụng nhất cho nhà tuyển dụng?"
          options={[
            "Một con số từ 0 đến vô cùng — càng lớn càng dễ đậu",
            "Một xác suất từ 0% đến 100% — để nhà tuyển dụng tự chọn ngưỡng cắt",
            "Một chữ 'đậu' hoặc 'rớt' duy nhất",
            "Không dự đoán được vì đây là con người",
          ]}
          correct={1}
          explanation="Xác suất linh hoạt nhất: nhà tuyển dụng có thể đặt ngưỡng 0.8 nếu muốn chắc chắn, hoặc 0.4 nếu muốn xét nhiều ứng viên hơn. Hồi quy logistic cho đúng kiểu output này — mọi đầu vào ép về khoảng (0, 1)."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Hồi quy tuyến tính trả một số bất kỳ. Nhưng đôi khi bạn chỉ cần câu trả lời:{" "}
            <strong className="text-foreground">có hay không?</strong> (có bệnh, spam, đậu phỏng
            vấn, khách huỷ đơn…). Logistic là tuyến tính ép vào khoảng 0–1 bằng hàm sigmoid.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Wand2 size={20} className="text-accent" /> Cái &quot;kẹp&quot; biến số bất kỳ thành xác suất
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Tưởng tượng bạn có một máy sản xuất số. Đầu vào là bất kỳ số thực nào — có thể +42
            hoặc −13 000. Bây giờ bạn <strong>kẹp</strong> cỗ máy đó qua một cái ống hình chữ S:
            mọi số âm rất nhỏ sẽ bị nén về gần 0, mọi số dương rất lớn sẽ bị nén về gần 1, và
            số 0 sẽ nằm đúng giữa (bằng 0.5).
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Cái ống đó chính là <strong>hàm sigmoid</strong>. Logistic chỉ có ba phần:{" "}
            <em>hồi quy tuyến tính</em> để tính một con số, <em>sigmoid</em> để ép vào [0, 1],
            và <em>ngưỡng</em> để chốt &quot;có&quot; hay &quot;không&quot;.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-foreground/85 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="mb-1 text-sm font-semibold text-blue-700 dark:text-blue-300">1. Tuyến tính</p>
              Tính z = w·x + b cho mỗi mẫu dữ liệu, giống{" "}
              <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink>.
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-xs leading-relaxed text-foreground/85 dark:border-purple-800 dark:bg-purple-900/20">
              <p className="mb-1 text-sm font-semibold text-purple-700 dark:text-purple-300">2. Sigmoid</p>
              Ép z qua σ(z) = 1 / (1 + e^(−z)). Giờ bạn có một số trong (0, 1) — xác suất.
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-relaxed text-foreground/85 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="mb-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">3. Ngưỡng</p>
              Nếu xác suất ≥ ngưỡng (mặc định 0.5) → báo lớp 1. Ngược lại → lớp 0.
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — PLAYGROUND CHÍNH ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="mb-1 text-base font-semibold text-foreground">
            Playground — chỉnh trọng số w, bias b, và ngưỡng
          </h3>
          <p className="mb-4 text-sm text-muted leading-relaxed">
            Dưới đây là một SVG sống. Nhấp vào canvas để thêm điểm (chọn lớp 0 hoặc 1), kéo điểm
            để di chuyển, và kéo các thanh trượt bên dưới để xem{" "}
            <strong>đường cong sigmoid uốn lại</strong> và <strong>biên quyết định</strong>{" "}
            (đường tím) di chuyển theo thời gian thực.
          </p>

          <SliderGroup
            sliders={[
              { key: "w", label: "Trọng số w (dốc)", min: 0.2, max: 4, step: 0.1, defaultValue: 1.6 },
              { key: "b", label: "Bias b (dịch)", min: -3, max: 3, step: 0.1, defaultValue: 0 },
              { key: "th", label: "Ngưỡng (%)", min: 10, max: 90, step: 1, defaultValue: 50, unit: "%" },
            ]}
            visualization={(values) => (
              <SigmoidClassifierPlayground
                weight={values.w}
                bias={values.b}
                threshold={values.th / 100}
              />
            )}
          />

          <Callout variant="insight" title="Ba điều nên thử ngay">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Kéo <strong>trọng số w</strong> lên: đường sigmoid dốc hơn — mô hình &quot;quyết
                đoán&quot; hơn, vùng &quot;không chắc&quot; thu hẹp lại.
              </li>
              <li>
                Kéo <strong>bias b</strong>: đường cong dịch ngang — biên quyết định di chuyển qua
                trái hoặc phải.
              </li>
              <li>
                Đặt ngưỡng 90% rồi quan sát: nhiều điểm lớp 1 bị tính là lớp 0 — recall giảm, đúng
                như lý thuyết.
              </li>
            </ul>
          </Callout>

          <h3 className="mt-8 mb-1 text-base font-semibold text-foreground">
            Mini playground — Xác suất ↔ Odds ↔ Log-odds
          </h3>
          <p className="mb-4 text-sm text-muted leading-relaxed">
            Logistic &quot;nói chuyện&quot; với ba con số khác nhau mô tả cùng một sự kiện. Kéo
            thanh trượt để thấy ba cách biểu diễn chuyển qua nhau — bạn sẽ hiểu vì sao &quot;log
            của tỉ số&quot; lại là ngôn ngữ tự nhiên của mô hình.
          </p>
          <SliderGroup
            sliders={[
              {
                key: "p",
                label: "P(y=1)",
                min: 1,
                max: 99,
                step: 1,
                defaultValue: 50,
                unit: "%",
              },
            ]}
            visualization={(values) => (
              <ProbOddsLogOddsVisual pct={values.p} />
            )}
          />
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — ĐI SÂU (ToggleCompare + StepReveal) ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu">
        <h3 className="mb-3 text-base font-semibold text-foreground">
          Vì sao tuyến tính &quot;vỡ&quot; khi gán cho phân loại?
        </h3>
        <ToggleCompare
          labelA="Tuyến tính gán cho phân loại"
          labelB="Logistic (sigmoid) cho phân loại"
          description="Chuyển qua lại hai chế độ để thấy sự khác nhau về output."
          childA={<LinearPredictionCard />}
          childB={<LogisticPredictionCard />}
        />

        <h3 className="mt-6 mb-3 text-base font-semibold text-foreground">
          Tháo rời cơ chế — từng bước một
        </h3>
        <StepReveal
          labels={[
            "Bước 1: Tính z",
            "Bước 2: Sigmoid",
            "Bước 3: So với ngưỡng",
            "Bước 4: Học từ sai số",
          ]}
        >
          {[
            <div
              key="s1"
              className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-foreground leading-relaxed"
            >
              <p>
                <strong>Ghép dữ liệu vào tuyến tính.</strong> Với mỗi mẫu (ví dụ: điểm IELTS = 6.5),
                ta tính{" "}
                <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-accent">
                  z = w·x + b
                </span>
                . Trọng số w càng lớn, đặc trưng càng &quot;có tiếng nói&quot; trong quyết định.
                Bias b dịch đường cong qua trái/phải. Đây là bước giống hệt{" "}
                <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink>.
              </p>
            </div>,
            <div
              key="s2"
              className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-foreground leading-relaxed"
            >
              <p className="mb-3">
                <strong>Ép z qua sigmoid.</strong> Số bất kỳ giờ bị &quot;kẹp&quot; vào (0, 1).
                Đầu ra này là{" "}
                <strong>xác suất mô hình nghĩ mẫu thuộc lớp 1</strong>. Khi z = 0, xác suất = 0.5 —
                đúng ranh giới; khi z rất dương, xác suất gần 1; khi z rất âm, xác suất gần 0.
              </p>
              <SigmoidMiniVisual />
            </div>,
            <div
              key="s3"
              className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-foreground leading-relaxed"
            >
              <p>
                <strong>So với ngưỡng.</strong> Ngưỡng mặc định là 0.5, nhưng bạn có thể đặt cao
                (0.8) nếu cần chắc chắn, hay thấp (0.3) nếu sợ bỏ sót. Ví dụ: máy quét ung thư để
                ngưỡng thấp cho chắc — thà báo nhầm vài ca còn hơn bỏ lọt một ca thật.
              </p>
            </div>,
            <div
              key="s4"
              className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-foreground leading-relaxed"
            >
              <p>
                <strong>Học bằng cross-entropy.</strong> Mỗi lần mô hình đoán sai, nó tính một{" "}
                &quot;mức phạt&quot; bằng &minus;log(p̂) cho mẫu lớp 1, và &minus;log(1 − p̂) cho
                lớp 0. Dự đoán 0.99 nhưng đáp án là 0 → phạt rất nặng. Gradient descent dùng mức
                phạt để chỉnh w và b cho đến khi mọi mẫu được phân loại hợp lý.
              </p>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — AHA ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Hồi quy logistic = hồi quy tuyến tính + hàm sigmoid.</strong> Cỗ máy bên trong
            vẫn là đường thẳng w·x + b. Chỉ khác là: đầu ra bị ép qua một &quot;cái ống chữ S&quot;
            để thành xác suất (0, 1). Biên quyết định chính là nơi xác suất bằng ngưỡng.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — THỬ THÁCH ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Output của hàm sigmoid σ(z) = 1 / (1 + e^(−z)) luôn nằm trong khoảng nào?"
          options={[
            "[0, +∞)",
            "(−1, 1)",
            "(0, 1)",
            "(−∞, +∞)",
          ]}
          correct={2}
          explanation="Vì e^(−z) > 0 luôn luôn, mẫu số 1 + e^(−z) > 1, nên tử số 1 chia cho mẫu số > 1 luôn nhỏ hơn 1. Đồng thời, 1 / (số dương) > 0. Kết quả: σ(z) nằm trong khoảng mở (0, 1) — đây là lý do sigmoid hợp làm xác suất."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Một bệnh viện dùng logistic để dự đoán nguy cơ nhồi máu cơ tim. Sai khi nào tốn kém hơn?"
            options={[
              "Báo sai 'có nguy cơ' (False Positive) — tốn kém hơn, vì làm bệnh nhân lo lắng",
              "Bỏ sót ca thật (False Negative) — tốn kém hơn, vì bệnh nhân có thể tử vong",
              "Cả hai loại sai như nhau",
              "Phụ thuộc hoàn toàn vào tuổi bệnh nhân",
            ]}
            correct={1}
            explanation="Ở tình huống y tế, False Negative (bỏ sót) thường nguy hiểm hơn. Vì vậy bác sĩ thường đặt ngưỡng thấp (0.3 thay vì 0.5) để dễ đánh dấu 'có nguy cơ' — chấp nhận thêm xét nghiệm còn hơn bỏ lọt ca cần cấp cứu."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — GIẢI THÍCH (LaTeX ≤3) ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Sau khi đã cảm nhận bằng tay, đây là ba công thức <em>duy nhất</em> bạn cần biết về
            hồi quy logistic. Mỗi công thức đi kèm một hình nhỏ — đừng học thuộc, hãy nhìn.
          </p>

          {/* Công thức 1 — sigmoid */}
          <div className="my-5 rounded-xl border border-border bg-surface/50 p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">
              1) Hàm sigmoid — &quot;cái ống&quot; ép số thực vào (0, 1)
            </p>
            <LaTeX block>{"\\sigma(z) = \\frac{1}{1 + e^{-z}}, \\quad z = w \\cdot x + b"}</LaTeX>
            <div className="mt-3 flex justify-center">
              <SigmoidMiniVisual />
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              z là &quot;điểm số&quot; mà mô hình tuyến tính tính được. Sigmoid ép điểm số đó
              thành xác suất &quot;đúng lớp 1&quot;. Z = 0 ↔ p = 0.5 (ranh giới).
            </p>
          </div>

          {/* Công thức 2 — log-odds */}
          <div className="my-5 rounded-xl border border-border bg-surface/50 p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">
              2) Log-odds — cách logistic &quot;hiểu&quot; xác suất ngược lại
            </p>
            <LaTeX block>{"\\log \\frac{p}{1 - p} = w \\cdot x + b"}</LaTeX>
            <div className="mt-3 flex justify-center">
              <LogOddsMiniVisual />
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              Đây là công thức đảo ngược của sigmoid. Nó nói: &quot;nếu tỉ số p : (1 − p) là 2:1,
              log của nó là log(2) ≈ 0.69 — và bằng với z = w·x + b&quot;. Nhờ thế, ta có thể
              học w và b bằng cách tối thiểu loss, vì mối quan hệ giữa đặc trưng x và log-odds
              là tuyến tính.
            </p>
          </div>

          {/* Công thức 3 — cross-entropy loss */}
          <div className="my-5 rounded-xl border border-border bg-surface/50 p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">
              3) Binary cross-entropy — hàm mất mát
            </p>
            <LaTeX block>{"\\mathcal{L} = -\\frac{1}{n}\\sum_{i=1}^{n}\\Big[y_i \\log \\hat{p}_i + (1 - y_i) \\log(1 - \\hat{p}_i)\\Big]"}</LaTeX>
            <div className="mt-3 flex justify-center">
              <CrossEntropyMiniVisual />
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              Với mẫu có nhãn thật y = 1, chỉ phần đầu &minus;log(p̂) &quot;bật&quot;. Nếu mô
              hình đoán p̂ = 0.99 (đúng rất chắc) → loss ≈ 0. Nếu đoán p̂ = 0.01 (sai rất chắc) →
              loss tiến về +∞. Chính đặc tính &quot;phạt cực mạnh khi tự tin nhưng sai&quot; của
              −log là lý do cross-entropy hợp cho phân loại.
            </p>
          </div>

          <Callout variant="tip" title="Vì sao dùng cross-entropy chứ không phải MSE?">
            Với sigmoid ở cuối, MSE tạo ra gradient dạng σ&apos;(z)·(ŷ − y). Khi mô hình
            rất tự tin (p̂ gần 0 hoặc gần 1), σ&apos;(z) ≈ 0 → gradient teo lại → học
            cực kỳ chậm, gần như dừng. Cross-entropy cộng với sigmoid đơn giản hoá
            gradient thành ŷ − y (không nhân σ&apos;(z)), nên sai càng nhiều thì học
            càng nhanh. Đây là lý do mọi framework ML (scikit-learn, PyTorch,
            TensorFlow) mặc định dùng binary cross-entropy cho phân loại nhị phân.
          </Callout>

          <Callout variant="warning" title="Biên chỉ tuyến tính">
            Hồi quy logistic chỉ tạo ra biên dạng đường thẳng (hoặc siêu phẳng với nhiều chiều).
            Nếu hai lớp không thể phân tách bằng đường thẳng (ví dụ: vòng tròn nằm giữa hai vòng
            khác), bạn cần{" "}
            <TopicLink slug="svm">SVM với kernel</TopicLink> hoặc{" "}
            <TopicLink slug="neural-network-basics">mạng nơ-ron</TopicLink>.
          </Callout>

          <div className="my-5 rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Khi nào nên đặt ngưỡng khác 0.5?
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-foreground/85 dark:border-red-800 dark:bg-red-900/20">
                <p className="mb-1 text-sm font-semibold text-red-700 dark:text-red-300">
                  Ngưỡng thấp (0.2 − 0.4)
                </p>
                Khi bỏ sót rất tốn kém: ung thư, gian lận thẻ tín dụng, lọc khủng bố. Ưu tiên recall
                — chấp nhận thêm ca cần xét lại.
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-foreground/85 dark:border-emerald-800 dark:bg-emerald-900/20">
                <p className="mb-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Ngưỡng mặc định (0.5)
                </p>
                Cả hai loại sai có giá tương đương. Điểm khởi đầu cho mọi dự án chưa có ràng buộc
                kinh doanh rõ ràng.
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-foreground/85 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="mb-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  Ngưỡng cao (0.7 − 0.9)
                </p>
                Khi báo nhầm rất tốn kém: email marketing (không muốn spam quá tay), quyết định
                chặn tài khoản VIP. Ưu tiên precision.
              </div>
            </div>
          </div>

          <div className="my-5 rounded-xl border border-border bg-surface/30 p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Bốn bài toán thường gặp — nên đặt ngưỡng nào?
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-surface/60 text-tertiary">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Bài toán</th>
                    <th className="px-3 py-2 text-left font-medium">Cái gì tốn kém hơn?</th>
                    <th className="px-3 py-2 text-left font-medium">Ngưỡng gợi ý</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-card">
                    <td className="px-3 py-2 font-semibold text-foreground">Phát hiện ung thư sớm</td>
                    <td className="px-3 py-2 text-muted">Bỏ sót (tử vong)</td>
                    <td className="px-3 py-2 font-mono text-red-600 dark:text-red-400">0,20 − 0,35</td>
                  </tr>
                  <tr className="bg-surface/20">
                    <td className="px-3 py-2 font-semibold text-foreground">Gian lận thẻ tín dụng</td>
                    <td className="px-3 py-2 text-muted">Bỏ sót (mất tiền)</td>
                    <td className="px-3 py-2 font-mono text-red-600 dark:text-red-400">0,30 − 0,50</td>
                  </tr>
                  <tr className="bg-card">
                    <td className="px-3 py-2 font-semibold text-foreground">Lọc spam Gmail</td>
                    <td className="px-3 py-2 text-muted">Báo nhầm (email sếp)</td>
                    <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400">0,70 − 0,85</td>
                  </tr>
                  <tr className="bg-surface/20">
                    <td className="px-3 py-2 font-semibold text-foreground">Gợi ý sản phẩm</td>
                    <td className="px-3 py-2 text-muted">Hai loại sai gần như nhau</td>
                    <td className="px-3 py-2 font-mono text-foreground">0,50</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              Chọn ngưỡng là một <em>quyết định kinh doanh</em>, không phải chỉ là tinh chỉnh
              mô hình. Nếu bạn không biết chọn số nào, bắt đầu 0,5 rồi điều chỉnh dựa trên chi
              phí thực tế mỗi loại lỗi.
            </p>
          </div>

          <CollapsibleDetail title="Đoán xác suất cho nhiều lớp (multi-class) — softmax">
            <p className="text-sm leading-relaxed">
              Khi bài toán có 3 lớp trở lên (nhận dạng chữ, phân loại email thành 5 thư mục…),
              người ta tổng quát hoá sigmoid thành <strong>softmax</strong>. Ý tưởng giống hệt:
              tính một điểm số cho mỗi lớp, rồi đưa qua một hàm ép tổng các điểm về bằng 1. Cơ
              chế học (cross-entropy) và cách giải thích (xác suất lớp) vẫn giữ nguyên. Nếu bạn
              đã hiểu logistic nhị phân, softmax chỉ là bản &quot;nhiều kênh&quot;.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Tại sao gọi là 'hồi quy' trong khi thực ra là phân loại?">
            <p className="text-sm leading-relaxed">
              Vì đầu ra trước khi áp ngưỡng là một <strong>số thực liên tục</strong> (xác suất),
              không phải nhãn rời rạc. Logistic là hồi quy trên log-odds. Khi bạn áp ngưỡng để
              chốt thành 0/1, bạn thêm một bước phân loại nữa ở cuối. Tên &quot;hồi quy&quot;
              giữ từ thời thống kê học, hơi gây hiểu nhầm nhưng đã quá phổ biến để đổi.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt & Kiểm tra">
        <MiniSummary
          title="5 điều cần nhớ"
          points={[
            "Logistic = tuyến tính w·x + b + sigmoid σ — ép số bất kỳ vào khoảng (0, 1).",
            "Biên quyết định là nơi xác suất bằng ngưỡng (mặc định 0.5, nhưng bạn có thể chỉnh).",
            "Cross-entropy là hàm mất mát — lồi, phạt nặng khi mô hình tự tin nhưng sai.",
            "Ngưỡng cao → precision tăng, recall giảm. Ngưỡng thấp → bắt nhiều ca dương hơn.",
            "Chỉ phân tách được bằng đường thẳng — dữ liệu cong cần SVM kernel hoặc mạng nơ-ron.",
          ]}
        />

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <ArrowRight size={18} className="mt-0.5 shrink-0 text-accent" />
          <div className="text-sm text-foreground/85 leading-relaxed">
            <strong>Xem ứng dụng thực tế:</strong>{" "}
            <TopicLink slug="logistic-regression-in-spam-filter">
              Logistic trong lọc spam Gmail
            </TopicLink>{" "}
            — cách bộ lọc thư rác biến xác suất thành quyết định &quot;vào hộp&quot; hay
            &quot;vào thùng rác&quot; mỗi giây.
          </div>
        </div>

        <QuizSection questions={quizQuestions} />

        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <Check size={10} /> Đúng
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <X size={10} /> Sai
          </span>
        </div>
      </LessonSection>
    </>
  );
}
