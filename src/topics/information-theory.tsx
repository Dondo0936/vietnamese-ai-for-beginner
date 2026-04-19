"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  CloudLightning,
  Dice5,
  Sparkles,
  RotateCcw,
  Zap,
  Coins,
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
  LaTeX,
  CollapsibleDetail,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "information-theory",
  title: "Information Theory",
  titleVi: "Lý thuyết thông tin",
  description:
    "Entropy, cross-entropy và KL divergence — đo 'độ bất ngờ' của dữ liệu bằng bit, nền tảng của mọi loss function.",
  category: "math-foundations",
  tags: ["entropy", "kl-divergence", "cross-entropy"],
  difficulty: "intermediate",
  relatedSlugs: ["loss-functions", "probability-statistics", "vae"],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;
const LN2 = Math.log(2);
const EPS = 1e-12;

function log2(x: number) {
  return Math.log(x + EPS) / LN2;
}

function entropy(p: number[]): number {
  let h = 0;
  for (const pi of p) {
    if (pi > 0) h -= pi * log2(pi);
  }
  return h;
}

function surprise(p: number): number {
  if (p <= 0) return Infinity;
  return -log2(p);
}

function fmt(n: number, digits = 2): string {
  if (!isFinite(n)) return "∞";
  return n.toFixed(digits);
}

/* ─────────────────────────────────────────────────────────────
   Coin entropy — slider cho P(ngửa)
   ───────────────────────────────────────────────────────────── */
function CoinEntropyVisual({ pHeads }: { pHeads: number }) {
  const p = Math.max(0.01, Math.min(0.99, pHeads / 100));
  const H = entropy([p, 1 - p]);
  const color = H > 0.9 ? "#dc2626" : H > 0.5 ? "#f59e0b" : "#16a34a";

  // Vẽ parabol entropy theo P(ngửa)
  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 1; i <= 99; i++) {
      const pi = i / 100;
      const h = entropy([pi, 1 - pi]);
      const x = 20 + (i / 100) * 280;
      const y = 110 - h * 80;
      pts.push(`${i === 1 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, []);

  const markerX = 20 + p * 280;
  const markerY = 110 - H * 80;

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border border-border bg-surface/60 p-3">
          <div className="text-xs text-muted">P(ngửa)</div>
          <div className="text-2xl font-bold text-foreground">
            {(p * 100).toFixed(0)}%
          </div>
        </div>
        <div className="rounded-xl border bg-surface/60 p-3" style={{ borderColor: color }}>
          <div className="text-xs text-muted">Entropy H</div>
          <div className="font-mono text-2xl font-bold" style={{ color }}>
            {fmt(H)} bit
          </div>
        </div>
      </div>

      <svg viewBox="0 0 320 140" className="w-full">
        {/* Lưới */}
        <line x1={20} y1={110} x2={300} y2={110} stroke="currentColor" className="text-border" />
        <line x1={20} y1={30} x2={20} y2={110} stroke="currentColor" className="text-border" />

        <text x={26} y={32} fontSize={9} fill="currentColor" className="text-muted">1 bit (max)</text>
        <text x={26} y={108} fontSize={9} fill="currentColor" className="text-muted">0 bit</text>
        <text x={20} y={126} fontSize={9} fill="currentColor" className="text-muted">0</text>
        <text x={160} y={126} fontSize={9} fill="currentColor" className="text-muted" textAnchor="middle">0.5</text>
        <text x={300} y={126} fontSize={9} fill="currentColor" className="text-muted" textAnchor="end">1</text>

        {/* Parabol */}
        <path d={curvePath} fill="none" stroke="#2563eb" strokeWidth={2.2} />

        {/* Marker */}
        <motion.line
          x1={markerX}
          y1={110}
          x2={markerX}
          y2={markerY}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="3 3"
          animate={{ x1: markerX, x2: markerX, y2: markerY }}
          transition={{ duration: 0.15 }}
        />
        <motion.circle
          cx={markerX}
          cy={markerY}
          r={5}
          fill={color}
          stroke="#ffffff"
          strokeWidth={1.5}
          animate={{ cx: markerX, cy: markerY }}
          transition={{ duration: 0.15 }}
        />
      </svg>

      <p className="text-xs text-muted leading-relaxed">
        Entropy đạt đỉnh <strong>1 bit</strong> khi đồng xu công bằng (P = 0.5) — bất
        định tối đa. Khi đồng xu lệch hẳn (P = 0.99), entropy tụt về gần 0 — gần như
        luôn biết trước kết quả.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Dice entropy — xúc xắc 4 mặt / 6 mặt
   ───────────────────────────────────────────────────────────── */
type DiceMode = "uniform4" | "uniform6" | "loaded";

function DiceEntropyVisual() {
  const [mode, setMode] = useState<DiceMode>("uniform4");
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  const dist = useMemo(() => {
    if (mode === "uniform4") return [0.25, 0.25, 0.25, 0.25];
    if (mode === "uniform6") return [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6];
    return [0.5, 0.2, 0.12, 0.08, 0.06, 0.04];
  }, [mode]);

  const H = entropy(dist);
  const Hmax = log2(dist.length);

  const rollDice = useCallback(() => {
    const r = Math.random();
    let cum = 0;
    for (let i = 0; i < dist.length; i++) {
      cum += dist[i];
      if (r < cum) {
        setLastRoll(i);
        return;
      }
    }
    setLastRoll(dist.length - 1);
  }, [dist]);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      {/* Chọn mode */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "uniform4" as const, label: "Xúc xắc 4 mặt fair", icon: Dice5 },
            { key: "uniform6" as const, label: "Xúc xắc 6 mặt fair", icon: Dice5 },
            { key: "loaded" as const, label: "Xúc xắc 6 mặt gian", icon: Zap },
          ]
        ).map((m) => {
          const Icon = m.icon;
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMode(m.key);
                setLastRoll(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "border border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              <Icon size={12} /> {m.label}
            </button>
          );
        })}
      </div>

      {/* Bar chart phân phối */}
      <div className="rounded-lg bg-surface/50 p-4">
        <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
          {dist.map((pi, i) => {
            const heightPct = pi * 100 * 2.5; // scale cho dễ nhìn
            const isRolled = lastRoll === i;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <motion.div
                  className="w-full rounded-t-md"
                  style={{
                    backgroundColor: isRolled ? "#dc2626" : "#2563eb",
                  }}
                  animate={{ height: heightPct }}
                  transition={{ type: "spring", stiffness: 140, damping: 18 }}
                />
                <span className="text-[10px] text-muted">
                  {(pi * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] font-semibold text-foreground">
                  {i + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface/40 p-3 text-center">
          <div className="text-[10px] uppercase tracking-wide text-tertiary">
            Số mặt
          </div>
          <div className="mt-1 text-lg font-bold text-foreground">{dist.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-accent-light p-3 text-center">
          <div className="text-[10px] uppercase tracking-wide text-accent">
            H(X)
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-accent">
            {fmt(H)} bit
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface/40 p-3 text-center">
          <div className="text-[10px] uppercase tracking-wide text-tertiary">
            H<sub>max</sub> = log₂ n
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-foreground">
            {fmt(Hmax)} bit
          </div>
        </div>
      </div>

      {/* Nút roll */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={rollDice}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Sparkles size={14} /> Tung xúc xắc
        </button>
        <AnimatePresence mode="wait">
          {lastRoll !== null && (
            <motion.div
              key={lastRoll}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.2 }}
              className="text-sm"
            >
              Trúng mặt <strong className="text-accent">{lastRoll + 1}</strong> — surprise ={" "}
              <strong className="font-mono">{fmt(surprise(dist[lastRoll]))} bit</strong>.{" "}
              <span className="text-muted">
                {surprise(dist[lastRoll]) < 1.5
                  ? "Mặt phổ biến, ít bất ngờ."
                  : surprise(dist[lastRoll]) < 3
                    ? "Mặt trung bình."
                    : "Mặt hiếm, rất bất ngờ."}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        <strong>Nhận xét:</strong> xúc xắc 4 mặt fair có H = 2 bit; xúc xắc 6 mặt fair có
        H ≈ 2.58 bit; xúc xắc gian (lệch về mặt 1) có H ≈ 2.02 bit. <em>Càng nhiều mặt
        và càng cân bằng</em> → entropy càng cao.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Cross-entropy explorer — hai phân phối, cross-entropy + KL
   ───────────────────────────────────────────────────────────── */
function CrossEntropyExplorer() {
  const [qPct, setQPct] = useState(50);

  const p = [0.5, 0.5]; // true coin
  const q1 = Math.max(0.01, Math.min(0.99, qPct / 100));
  const q = [q1, 1 - q1];

  const Hp = entropy(p);
  const ce = -(p[0] * log2(q[0]) + p[1] * log2(q[1]));
  const kl = ce - Hp;

  const barColor = (val: number) => {
    if (val < 1.1) return "#16a34a";
    if (val < 1.5) return "#f59e0b";
    return "#dc2626";
  };

  return (
    <div className="w-full space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="mb-2 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
            p — phân phối thật (cố định)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <DistBar label="Mặt 1" p={p[0]} color="#2563eb" />
            <DistBar label="Mặt 2" p={p[1]} color="#2563eb" />
          </div>
          <p className="mt-2 text-[10px] text-muted">Entropy H(p) = {fmt(Hp)} bit</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="mb-2 text-[11px] font-semibold text-red-700 dark:text-red-300">
            q — dự đoán của mô hình
          </p>
          <div className="grid grid-cols-2 gap-2">
            <DistBar label="Mặt 1" p={q[0]} color="#dc2626" />
            <DistBar label="Mặt 2" p={q[1]} color="#dc2626" />
          </div>
          <div className="mt-2">
            <input
              type="range"
              min={1}
              max={99}
              value={qPct}
              onChange={(e) => setQPct(Number(e.target.value))}
              className="w-full accent-red-500"
              aria-label="q[Mặt 1]"
            />
            <p className="text-[10px] text-muted">
              q[Mặt 1] = {qPct}% — kéo để di chuyển
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-surface/50 p-3 text-center">
          <div className="text-[11px] font-semibold text-muted">H(p)</div>
          <div className="mt-1 font-mono text-lg font-bold text-foreground">
            {fmt(Hp)} bit
          </div>
          <div className="mt-1 text-[10px] text-muted">Không đổi</div>
        </div>
        <div
          className="rounded-lg border bg-surface/50 p-3 text-center"
          style={{ borderColor: barColor(ce) }}
        >
          <div className="text-[11px] font-semibold" style={{ color: barColor(ce) }}>
            H(p, q) — CE loss
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-foreground">
            {isFinite(ce) ? fmt(ce) : "∞"} bit
          </div>
          <div className="mt-1 text-[10px] text-muted">
            Số bit thực tế dùng mã của q
          </div>
        </div>
        <div
          className="rounded-lg border bg-surface/50 p-3 text-center"
          style={{ borderColor: barColor(kl + 1) }}
        >
          <div className="text-[11px] font-semibold" style={{ color: barColor(kl + 1) }}>
            KL(p ‖ q)
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-foreground">
            {isFinite(kl) ? fmt(Math.max(0, kl)) : "∞"} bit
          </div>
          <div className="mt-1 text-[10px] text-muted">
            Phần &quot;phí phạm&quot;
          </div>
        </div>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        <strong>Quan hệ then chốt:</strong> H(p, q) = H(p) + KL(p ‖ q). Khi q = p (slider ở 50%),
        KL = 0 và cross-entropy = H(p) — không thể giảm thêm. Đẩy q về 1% hoặc 99%, KL tăng vọt
        — đúng với ý nghĩa &quot;mô hình tự tin sai thì bị phạt rất nặng&quot;.
      </p>
    </div>
  );
}

function DistBar({ label, p, color }: { label: string; p: number; color: string }) {
  return (
    <div className="rounded border border-border bg-card p-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="font-mono text-muted">{(p * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${p * 100}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Mini-visual: công thức đi kèm hình
   ───────────────────────────────────────────────────────────── */
function EntropyShape() {
  // Hình parabol đơn giản
  const path = useMemo(() => {
    const pts: string[] = [];
    for (let i = 1; i <= 99; i++) {
      const p = i / 100;
      const h = entropy([p, 1 - p]);
      const x = 10 + (i / 100) * 300;
      const y = 110 - h * 80;
      pts.push(`${i === 1 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, []);

  return (
    <svg viewBox="0 0 320 140" className="w-full max-w-sm">
      <line x1={10} y1={110} x2={310} y2={110} stroke="currentColor" className="text-border" />
      <line x1={10} y1={30} x2={10} y2={110} stroke="currentColor" className="text-border" />
      <text x={14} y={32} fontSize={9} fill="currentColor" className="text-muted">H max</text>
      <text x={14} y={108} fontSize={9} fill="currentColor" className="text-muted">H = 0</text>
      <path d={path} fill="none" stroke="#2563eb" strokeWidth={2.4} />
      <circle cx={160} cy={30} r={4} fill="#dc2626" />
      <text x={162} y={28} fontSize={9} fill="#dc2626">
        P = 0.5 → H max
      </text>
    </svg>
  );
}

function KLShape() {
  return (
    <svg viewBox="0 0 320 140" className="w-full max-w-sm">
      <line x1={10} y1={110} x2={310} y2={110} stroke="currentColor" className="text-border" />
      <line x1={20} y1={10} x2={20} y2={110} stroke="currentColor" className="text-border" />
      {/* Hai phân phối */}
      {[
        { x: 40, h: 70, c: "#2563eb", label: "p" },
        { x: 80, h: 50, c: "#2563eb", label: "" },
        { x: 120, h: 30, c: "#2563eb", label: "" },
        { x: 160, h: 20, c: "#2563eb", label: "" },
      ].map((b, i) => (
        <rect key={`p-${i}`} x={b.x} y={110 - b.h} width={20} height={b.h} fill={b.c} opacity={0.75} rx={2} />
      ))}
      {[
        { x: 60, h: 25, c: "#dc2626", label: "q" },
        { x: 100, h: 35, c: "#dc2626", label: "" },
        { x: 140, h: 50, c: "#dc2626", label: "" },
        { x: 180, h: 70, c: "#dc2626", label: "" },
      ].map((b, i) => (
        <rect key={`q-${i}`} x={b.x} y={110 - b.h} width={20} height={b.h} fill={b.c} opacity={0.75} rx={2} />
      ))}
      <rect x={220} y={30} width={12} height={10} fill="#2563eb" opacity={0.75} rx={2} />
      <text x={236} y={39} fontSize={10} fill="currentColor" className="text-foreground">p (thật)</text>
      <rect x={220} y={48} width={12} height={10} fill="#dc2626" opacity={0.75} rx={2} />
      <text x={236} y={57} fontSize={10} fill="currentColor" className="text-foreground">q (dự đoán)</text>
      <text x={220} y={95} fontSize={10} fill="currentColor" className="text-muted">KL = độ &quot;lệch&quot; giữa p và q</text>
    </svg>
  );
}

function CrossEntropyShape() {
  return (
    <svg viewBox="0 0 320 140" className="w-full max-w-sm">
      <line x1={20} y1={110} x2={310} y2={110} stroke="currentColor" className="text-border" />
      <line x1={20} y1={20} x2={20} y2={110} stroke="currentColor" className="text-border" />
      <text x={24} y={28} fontSize={10} fill="currentColor" className="text-muted">loss</text>
      <text x={308} y={122} fontSize={9} fill="currentColor" className="text-muted" textAnchor="end">q → 1</text>
      <path
        d={Array.from({ length: 80 }, (_, i) => {
          const q = 0.02 + (i / 79) * 0.95;
          const x = 20 + (i / 79) * 285;
          const y = 110 + Math.log(q) * 18;
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${Math.max(10, y).toFixed(1)}`;
        }).join(" ")}
        fill="none"
        stroke="#dc2626"
        strokeWidth={2.4}
      />
      <text x={40} y={40} fontSize={10} fill="#dc2626">
        Loss lớn khi mô hình đoán sai rất chắc
      </text>
      <text x={150} y={105} fontSize={10} fill="#16a34a">
        Loss ≈ 0 khi đoán đúng
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   QUIZ
   ───────────────────────────────────────────────────────────── */
const quizQuestions: QuizQuestion[] = [
  {
    question: "Xúc xắc 6 mặt công bằng. Entropy H(X) bằng bao nhiêu bit?",
    options: [
      "1 bit",
      "2 bit",
      "Khoảng 2,58 bit (= log₂ 6)",
      "6 bit",
    ],
    correct: 2,
    explanation:
      "Với phân phối đều trên n giá trị, entropy đạt cực đại H = log₂ n. Với xúc xắc 6 mặt fair, H = log₂ 6 ≈ 2,58 bit. Nếu xúc xắc gian (lệch về một mặt), entropy sẽ nhỏ hơn.",
  },
  {
    question: "Sự kiện nào mang NHIỀU THÔNG TIN hơn khi xảy ra?",
    options: [
      "'Trời Sài Gòn hôm nay nắng' (P ≈ 0.95)",
      "'Mưa đá giữa trưa tháng 4 ở Sài Gòn' (P ≈ 0.001)",
      "Bằng nhau vì cả hai đều xảy ra",
      "Không xác định được",
    ],
    correct: 1,
    explanation:
      "Information = −log₂ P. Sự kiện hiếm có nhiều bit thông tin hơn. 'Nắng' có P cao → −log₂(0.95) ≈ 0.07 bit. 'Mưa đá' có P thấp → −log₂(0.001) ≈ 10 bit. Đó là lý do tin tức chỉ đưa tin bất ngờ — vì chúng mang nhiều thông tin hơn.",
  },
  {
    question:
      "Khi hai phân phối p và q trùng nhau hoàn toàn (p = q), KL(p ‖ q) bằng bao nhiêu?",
    options: [
      "Vô cùng lớn",
      "Bằng 0",
      "Bằng entropy của p",
      "Bằng 1 bit",
    ],
    correct: 1,
    explanation:
      "KL(p ‖ q) = 0 khi và chỉ khi p = q. Đây là lý do KL được gọi là 'độ lệch' giữa hai phân phối — càng gần nhau, KL càng nhỏ; trùng nhau thì KL = 0.",
  },
  {
    type: "fill-blank",
    question:
      "Entropy H(X) đạt giá trị {blank} khi mọi sự kiện đồng xác suất, và đạt {blank} khi một sự kiện chắc chắn xảy ra (P = 1).",
    blanks: [
      { answer: "cực đại", accept: ["maximum", "max", "lớn nhất", "cao nhất"] },
      { answer: "0", accept: ["0 bit", "bằng 0", "không"] },
    ],
    explanation:
      "Entropy là độ bất định trung bình. Khi đồng đều → không thể đoán trước → H lớn nhất = log₂ n. Khi một sự kiện chắc chắn → không có gì để đoán → H = 0.",
  },
  {
    question:
      "Trong machine learning, cross-entropy H(p, q) được dùng làm loss function. Minimize cross-entropy đồng nghĩa với việc làm gì?",
    options: [
      "Làm entropy H(p) bằng 0",
      "Làm phân phối q (mô hình) gần p (nhãn thật) nhất có thể",
      "Tăng entropy của q",
      "Bỏ qua nhãn thật",
    ],
    correct: 1,
    explanation:
      "H(p, q) = H(p) + KL(p ‖ q). Vì H(p) không phụ thuộc mô hình (nhãn là cố định), tối thiểu cross-entropy tương đương tối thiểu KL(p ‖ q) — tức là kéo q về gần p. Đây là lý do cross-entropy là loss mặc định cho bài toán phân loại.",
  },
];

/* ═══════════════ MAIN ═══════════════ */
export default function InformationTheoryTopic() {
  return (
    <>
      {/* ━━━ BƯỚC 1 — DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử đoán">
        <PredictionGate
          question="Bạn đọc hai tin trên báo: (A) 'Trời Sài Gòn hôm nay nắng', (B) 'Mưa đá giữa trưa tháng 4 ở Sài Gòn'. Tin nào chứa NHIỀU THÔNG TIN hơn?"
          options={[
            "A — vì quan trọng hơn",
            "B — sự kiện hiếm có nhiều thông tin hơn sự kiện gần như chắc chắn",
            "Bằng nhau",
            "Phụ thuộc vào tâm trạng người đọc",
          ]}
          correct={1}
          explanation="Entropy và thông tin đo sự 'bất ngờ'. 'Nắng' có xác suất ≈ 0.95 → không ai lạ → gần như 0 bit thông tin. 'Mưa đá' có xác suất ≈ 0.001 → rất hiếm → khoảng 10 bit thông tin. Tin tức chỉ đưa tin bất ngờ vì chúng mang nhiều thông tin — đây chính là trực giác Shannon đặt nền cho toàn bộ lý thuyết thông tin."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Hôm nay bạn sẽ học ba thước đo cốt lõi: <strong>entropy</strong> (đo bất định),{" "}
            <strong>KL divergence</strong> (đo sự khác nhau giữa hai phân phối), và{" "}
            <strong>cross-entropy</strong> (loss function của machine learning). Cả ba đều
            tính bằng <em>bit</em>.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ ━━━ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CloudLightning size={20} className="text-accent" /> Entropy = &quot;độ bất ngờ trung bình&quot;
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Hãy tưởng tượng bạn đang nhắn tin cho bạn bè về thời tiết ở Sài Gòn bằng{" "}
            <em>điện báo tính tiền theo ký tự</em>. Nếu hầu hết ngày là nắng, bạn nên đặt{" "}
            &quot;nắng&quot; = một ký tự ngắn, còn &quot;mưa đá&quot; thì nhận ký tự dài — vì nó hiếm,
            dùng ký tự dài cũng không phí nhiều lần. Trung bình, bạn gửi rất ít ký tự mỗi tin.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Ngược lại, ở một thành phố ôn đới mỗi loại thời tiết xuất hiện đều đều, bạn buộc phải
            dùng ký tự dài hơn cho tất cả. Shannon chứng minh: <strong>số bit trung bình ngắn
            nhất</strong> bạn có thể dùng để mã hoá một bản tin chính là <strong>entropy H</strong> của
            phân phối thời tiết ở đó.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-relaxed text-foreground/85 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <Sun size={14} /> Phân phối lệch
              </p>
              Một kết quả chiếm ưu thế → dễ đoán → entropy thấp, mã ngắn trung bình.
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-foreground/85 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
                <Coins size={14} /> Đồng xu công bằng
              </p>
              Hai mặt bằng nhau → bất định nhất cho 2 kết quả → entropy = 1 bit.
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-relaxed text-foreground/85 dark:border-red-800 dark:bg-red-900/20">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-red-700 dark:text-red-300">
                <Dice5 size={14} /> Xúc xắc 6 mặt
              </p>
              Đồng đều trên nhiều kết quả → entropy cao nhất = log₂ 6 ≈ 2.58 bit.
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — KHÁM PHÁ (playgrounds) ━━━ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="mb-1 text-base font-semibold text-foreground">
            Playground 1 — Đồng xu nghiêng dần
          </h3>
          <p className="mb-4 text-sm text-muted leading-relaxed">
            Kéo thanh trượt để thay đổi P(ngửa). Chấm đỏ chạy theo đường cong entropy. Khi P
            = 50%, entropy đạt đỉnh 1 bit. Khi P rất gần 0 hoặc 1, entropy tiến về 0.
          </p>

          <SliderGroup
            sliders={[
              { key: "p", label: "P(ngửa)", min: 1, max: 99, step: 1, defaultValue: 50, unit: "%" },
            ]}
            visualization={(v) => <CoinEntropyVisual pHeads={v.p} />}
          />

          <h3 className="mt-8 mb-1 text-base font-semibold text-foreground">
            Playground 2 — Xúc xắc 4 mặt vs 6 mặt vs &quot;gian&quot;
          </h3>
          <p className="mb-4 text-sm text-muted leading-relaxed">
            Chọn chế độ và quan sát thanh entropy. Uniform càng nhiều mặt → entropy càng cao.
            Xúc xắc gian (lệch về mặt 1) có entropy nhỏ hơn fair dù cùng số mặt.
          </p>
          <DiceEntropyVisual />

          <h3 className="mt-8 mb-1 text-base font-semibold text-foreground">
            Playground 3 — Cross-entropy khi mô hình sai
          </h3>
          <p className="mb-4 text-sm text-muted leading-relaxed">
            Đây là phân phối thật p của một đồng xu (giả sử nhãn ta quan sát thấy chính là xác
            suất P(ngửa) = 50%). Kéo q — dự đoán của mô hình — xem cross-entropy và KL divergence
            thay đổi. Khi q = p → KL = 0; càng lệch → loss càng cao.
          </p>
          <CrossEntropyExplorer />
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — ĐI SÂU (StepReveal công thức) ━━━ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Đi sâu">
        <h3 className="mb-3 text-base font-semibold text-foreground">
          Entropy được dựng lên từng mảnh
        </h3>
        <StepReveal
          labels={[
            "Bước 1: Surprise của một sự kiện",
            "Bước 2: Trung bình theo xác suất",
            "Bước 3: Đó chính là entropy",
          ]}
        >
          {[
            <div
              key="s1"
              className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-foreground leading-relaxed"
            >
              <p className="mb-3">
                <strong>Surprise của một kết quả.</strong> Một kết quả xảy ra với xác suất p
                mang lượng &quot;bất ngờ&quot; bằng{" "}
                <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-accent">
                  −log₂ p
                </span>{" "}
                bit. Sự kiện gần như chắc chắn (p = 0.99) → surprise ≈ 0.014 bit (ai cũng biết
                trước). Sự kiện rất hiếm (p = 0.001) → surprise ≈ 10 bit (rất bất ngờ).
              </p>
              <p className="text-xs text-muted">
                Lý do dùng log: khi hai sự kiện độc lập xảy ra cùng lúc, surprise của chúng
                cộng lại. Nếu bạn dùng −p thay cho −log p, hai sự kiện độc lập sẽ nhân chứ không
                cộng — ít trực quan hơn.
              </p>
            </div>,
            <div
              key="s2"
              className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-foreground leading-relaxed"
            >
              <p>
                <strong>Trung bình theo xác suất.</strong> Mỗi sự kiện có surprise riêng. Để
                có một con số duy nhất cho toàn phân phối, ta nhân surprise của mỗi sự kiện với
                xác suất của nó, rồi cộng tổng. Đây chính là &quot;giá trị kỳ vọng của
                surprise&quot; — sự bất ngờ trung bình mà bạn phải chịu khi rút một mẫu.
              </p>
            </div>,
            <div
              key="s3"
              className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-foreground leading-relaxed"
            >
              <p className="mb-3">
                <strong>Công thức Shannon:</strong>
              </p>
              <div className="rounded-lg bg-surface p-3 text-center font-mono text-sm">
                H(X) = − Σ p(x) · log₂ p(x)
              </div>
              <p className="mt-3">
                Đơn vị là <strong>bit</strong>. Entropy không âm, đạt cực đại khi phân phối
                đồng đều, và = 0 khi một sự kiện chắc chắn xảy ra.
              </p>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — AHA ━━━ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Entropy = mức bất ngờ trung bình.</strong> Cross-entropy = số bit trung bình
            khi bạn mã hoá dữ liệu thật <em>bằng mô hình sai</em>. KL divergence = phần &quot;chi
            phí&quot; dư ra giữa hai con số đó.
          </p>
          <p className="mt-2">
            Vì vậy, khi bạn bấm nút &quot;train&quot; trên một mạng nơ-ron phân loại, bạn đang
            làm <em>một việc rất đơn giản</em>: thu nhỏ phần chi phí dư — tức là làm xác suất
            mô hình phát ra tiến về xác suất thật của nhãn.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — THỬ THÁCH ━━━ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Xúc xắc 6 mặt công bằng — entropy bao nhiêu bit?"
          options={[
            "1 bit",
            "2 bit",
            "log₂ 6 ≈ 2,58 bit",
            "6 bit",
          ]}
          correct={2}
          explanation="Phân phối đều trên n kết quả → entropy đạt cực đại H = log₂ n. Xúc xắc 6 mặt fair → H = log₂ 6 ≈ 2,58 bit. Đây cũng là lý do 'chơi tài xỉu 6 mặt' khó đoán hơn 'chơi đồng xu' (1 bit)."
        />

        <div className="mt-6">
          <InlineChallenge
            question="Một mô hình phân loại 10 lớp chưa học gì, nên output q gần uniform. Cross-entropy loss trung bình trên mỗi mẫu xấp xỉ bao nhiêu?"
            options={[
              "≈ 0 bit",
              "≈ 1 bit",
              "≈ log₂ 10 ≈ 3,32 bit",
              "≈ 10 bit",
            ]}
            correct={2}
            explanation="Với nhãn one-hot và q uniform trên 10 lớp (mỗi lớp 0.1), CE = −log(0.1) = log 10 ≈ 3,32 bit. Đây là 'baseline ngu' — mô hình chưa học gì nên loss ở ngưỡng này. Khi bắt đầu train, loss phải giảm dưới mức này thì mô hình mới đang học."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — GIẢI THÍCH (LaTeX ≤3) ━━━ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Dưới đây là ba công thức &quot;nền&quot; — bạn sẽ gặp lại chúng ở{" "}
            <TopicLink slug="loss-functions">loss functions</TopicLink>, VAE, decision tree, và
            knowledge distillation. Mỗi công thức đi kèm một hình để bám vào.
          </p>

          {/* Công thức 1 — Entropy */}
          <div className="my-5 rounded-xl border border-border bg-surface/50 p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">
              1) Entropy H(X) — độ bất định trung bình
            </p>
            <LaTeX block>{"H(X) = -\\sum_{x} p(x) \\log_2 p(x)"}</LaTeX>
            <div className="mt-3 flex justify-center">
              <EntropyShape />
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              Lấy −log₂ xác suất của mỗi kết quả (= surprise), nhân với xác suất tương ứng, rồi
              cộng lại. Đường cong là entropy của đồng xu theo P(ngửa) — đỉnh ở 0.5.
            </p>
          </div>

          {/* Công thức 2 — KL divergence */}
          <div className="my-5 rounded-xl border border-border bg-surface/50 p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">
              2) KL divergence — độ &quot;lệch&quot; giữa hai phân phối
            </p>
            <LaTeX block>{"D_{KL}(p \\| q) = \\sum_{x} p(x) \\log_2 \\frac{p(x)}{q(x)} \\geq 0"}</LaTeX>
            <div className="mt-3 flex justify-center">
              <KLShape />
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              KL = 0 khi và chỉ khi p = q. <strong>Không đối xứng</strong>: KL(p ‖ q) ≠ KL(q ‖ p).
              Khi bạn train, p là nhãn thật (one-hot) và q là output softmax — KL đo mô hình
              lệch bao xa so với sự thật.
            </p>
          </div>

          {/* Công thức 3 — Cross-entropy */}
          <div className="my-5 rounded-xl border border-border bg-surface/50 p-5">
            <p className="mb-2 text-sm font-semibold text-foreground">
              3) Cross-entropy H(p, q) — loss function
            </p>
            <LaTeX block>{"H(p, q) = -\\sum_{x} p(x) \\log_2 q(x) = H(p) + D_{KL}(p \\| q)"}</LaTeX>
            <div className="mt-3 flex justify-center">
              <CrossEntropyShape />
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              Vì H(p) không phụ thuộc mô hình, tối thiểu cross-entropy <em>tương đương</em> tối
              thiểu KL. Khi nhãn là one-hot, công thức rút gọn thành −log q[lớp đúng] — chính là
              loss cho phân loại ở PyTorch, TensorFlow.
            </p>
          </div>

          <Callout variant="tip" title="Trực giác 'bảng mã'">
            Shannon chứng minh: số bit trung bình ngắn nhất để mã hoá một ký tự sinh ra từ phân
            phối p chính là H(p). Nếu bạn dùng <em>bảng mã sai</em> (tối ưu cho q thay vì p),
            số bit trung bình là H(p, q) — luôn lớn hơn hoặc bằng H(p). Phần dư chính là KL(p ‖ q).
            Trong ML: &quot;bảng mã&quot; = mô hình, &quot;phần dư&quot; = loss.
          </Callout>

          <Callout variant="warning" title="KL không đối xứng">
            KL(p ‖ q) và KL(q ‖ p) khác nhau về ý nghĩa thực hành. KL(p ‖ q) phạt nặng chỗ p có
            mass mà q gán gần 0 (&quot;phủ các mode&quot;). KL(q ‖ p) phạt nặng chỗ ngược lại
            (&quot;săn một mode&quot;). VAE dùng KL(q ‖ p); phần lớn phân loại dùng KL(p ‖ q) =
            cross-entropy. Nếu cần khoảng cách đối xứng, dùng Jensen–Shannon divergence.
          </Callout>

          <CollapsibleDetail title="Mutual information — mối liên hệ giữa hai biến">
            <p className="text-sm leading-relaxed">
              <strong>I(X; Y) = H(X) − H(X | Y).</strong> Đo lượng thông tin bạn biết thêm về X
              nếu biết Y. Bằng 0 khi X và Y độc lập. Là nền tảng của contrastive learning
              (InfoNCE trong CLIP, SimCLR), feature selection, và phân cụm dựa trên thông tin.
            </p>
          </CollapsibleDetail>

          <div className="my-5 rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Trực giác &quot;information gain&quot; của cây quyết định
            </p>
            <p className="mb-3 text-sm leading-relaxed text-foreground/85">
              Giả sử bạn đoán liệu một người có đậu phỏng vấn không. Trước khi biết gì, entropy
              của &quot;đậu/không đậu&quot; trong tập huấn luyện là ~ 1 bit (hai lớp xấp xỉ cân
              bằng). Sau khi biết thêm đặc trưng &quot;điểm IELTS ≥ 7.0&quot;, phân phối trở nên
              lệch — entropy điều kiện giảm xuống, ví dụ còn 0,6 bit.
            </p>
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                  H(Y) — trước khi biết
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-foreground">1,00 bit</div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  H(Y | IELTS)
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-foreground">0,60 bit</div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800 dark:bg-amber-900/20">
                <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Information gain
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-foreground">0,40 bit</div>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Cây quyết định (ID3, C4.5) chọn đặc trưng có <strong>information gain lớn nhất</strong>{" "}
              làm điểm chia. Đây là một trong những ứng dụng cổ điển và trực quan nhất của entropy
              trong machine learning — bạn đã nhìn thấy Shannon trong phòng họp rồi.
            </p>
          </div>

          <Callout variant="info" title="Vì sao 'log' xuất hiện khắp nơi trong ML?">
            Bạn sẽ gặp log trong: cross-entropy loss, KL divergence, log-likelihood, log-odds,
            log-softmax, PPL (perplexity). Lý do chung: log biến <em>phép nhân xác suất</em>{" "}
            thành <em>phép cộng</em> — dễ tối ưu, tránh underflow, cộng độc lập giữa các sự kiện
            độc lập. Mỗi khi thấy log, hãy nhớ: đây là &quot;ngôn ngữ cộng&quot; của xác suất.
          </Callout>

          <div className="my-5 rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Ba sai lầm hay gặp khi mới học entropy
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs leading-relaxed text-foreground/85 dark:border-red-800 dark:bg-red-900/10">
                <p className="mb-1 text-sm font-semibold text-red-700 dark:text-red-300">
                  Nhầm &quot;entropy cao&quot; với &quot;data xấu&quot;
                </p>
                Entropy cao không phải là tiêu cực. Dữ liệu lý thuyết đa dạng (nhiều kết quả đều
                nhau) <em>cần</em> entropy cao để mô tả. Ví dụ: ảnh nén sau cùng (JPEG đã nén
                mạnh) có entropy gần cực đại — nhưng đó là vì đã bỏ hết dư thừa, không phải vì
                tệ.
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs leading-relaxed text-foreground/85 dark:border-amber-800 dark:bg-amber-900/10">
                <p className="mb-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  Nhầm entropy với variance (phương sai)
                </p>
                Variance đo độ phân tán quanh trung bình (biến số liên tục). Entropy đo độ bất
                định (bao nhiêu kết quả có thể). Hai khái niệm khác hẳn nhau — dùng sai sẽ sai
                toàn bộ phân tích.
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs leading-relaxed text-foreground/85 dark:border-blue-800 dark:bg-blue-900/10">
                <p className="mb-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Quên rằng KL không đối xứng
                </p>
                Viết KL(p ‖ q) rồi &quot;dùng lại&quot; cho KL(q ‖ p) — hai giá trị có thể khác
                xa nhau. Luôn đọc kỹ thứ tự; nếu cần đối xứng, dùng Jensen-Shannon divergence.
              </div>
            </div>
          </div>

          <div className="my-5 rounded-xl border border-border bg-surface/30 p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Đi từ entropy đến mô hình ngôn ngữ (LLM)
            </p>
            <p className="mb-3 text-sm leading-relaxed text-foreground/85">
              Mô hình ngôn ngữ dự đoán ký tự (hoặc token) tiếp theo dựa trên các ký tự đã xuất
              hiện. Chất lượng của mô hình thường được đo bằng <strong>perplexity</strong>:
            </p>
            <div className="mb-3 rounded-lg bg-card p-3 text-center font-mono text-sm">
              PPL = 2<sup>H(p, q)</sup>
            </div>
            <p className="text-sm leading-relaxed text-foreground/85">
              Nếu cross-entropy của mô hình trên một đoạn văn bản là 2 bit/token, thì perplexity
              là 4 — trung bình mô hình &quot;cân đối&quot; giữa 4 token khả dĩ mỗi bước. Càng
              nhỏ càng giỏi. Các LLM tiếng Anh hiện đại đạt PPL khoảng 10–30 trên văn bản thông
              thường.
            </p>
          </div>

          <CollapsibleDetail title="Bit vs nat — đơn vị đo thông tin">
            <p className="text-sm leading-relaxed">
              <strong>Bit</strong> dùng log cơ số 2, trực quan cho khoa học máy tính và mã hoá.{" "}
              <strong>Nat</strong> dùng logarit tự nhiên (ln), mặc định trong giải tích và các thư
              viện như scipy, torch. Quy đổi: 1 nat ≈ 1.443 bit. Kết quả cross-entropy loss
              hiển thị ở PyTorch thường tính bằng nat — nếu bạn muốn đọc ra bit, nhân với 1.443.
            </p>
          </CollapsibleDetail>

          <p className="leading-relaxed">
            Entropy xuất hiện ở rất nhiều nơi trong ML:{" "}
            <TopicLink slug="loss-functions">loss functions</TopicLink>,{" "}
            <TopicLink slug="vae">VAE</TopicLink>, distillation, decision tree (information
            gain), và cả trong <TopicLink slug="information-theory-in-compression">nén dữ liệu</TopicLink>{" "}
            (ZIP, JPEG, H.265). Nó là &quot;ngôn ngữ chung&quot; nối giữa xác suất, thống kê và
            học máy.
          </p>

          <div className="my-5 rounded-xl border border-border bg-surface/50 p-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Một bảng nhanh entropy vài nguồn dữ liệu
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface/60 text-tertiary">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Nguồn</th>
                    <th className="px-3 py-2 text-left font-medium">Đặc điểm</th>
                    <th className="px-3 py-2 text-left font-medium">H xấp xỉ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-card">
                    <td className="px-3 py-2 font-semibold text-foreground">Đồng xu công bằng</td>
                    <td className="px-3 py-2 text-muted">2 kết quả đều nhau</td>
                    <td className="px-3 py-2 font-mono text-accent">1 bit</td>
                  </tr>
                  <tr className="bg-surface/20">
                    <td className="px-3 py-2 font-semibold text-foreground">Xúc xắc 6 mặt fair</td>
                    <td className="px-3 py-2 text-muted">6 kết quả đều nhau</td>
                    <td className="px-3 py-2 font-mono text-accent">2,58 bit</td>
                  </tr>
                  <tr className="bg-card">
                    <td className="px-3 py-2 font-semibold text-foreground">Chữ cái tiếng Anh</td>
                    <td className="px-3 py-2 text-muted">26 chữ, &apos;e&apos; rất phổ biến</td>
                    <td className="px-3 py-2 font-mono text-accent">≈ 4,1 bit/chữ</td>
                  </tr>
                  <tr className="bg-surface/20">
                    <td className="px-3 py-2 font-semibold text-foreground">Văn bản tiếng Việt</td>
                    <td className="px-3 py-2 text-muted">Có dấu — phân phối lệch</td>
                    <td className="px-3 py-2 font-mono text-accent">≈ 4,7 bit/ký tự</td>
                  </tr>
                  <tr className="bg-card">
                    <td className="px-3 py-2 font-semibold text-foreground">Byte ngẫu nhiên</td>
                    <td className="px-3 py-2 text-muted">256 giá trị đều nhau</td>
                    <td className="px-3 py-2 font-mono text-accent">8 bit (tối đa)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              Văn bản có &quot;dư thừa&quot; lớn: lý thuyết cần 8 bit/ký tự ASCII, nhưng thực tế chỉ
              cần ~4,7 bit/ký tự tiếng Việt. Đây là lý do ZIP nén văn bản rất tốt — nó chỉ cần
              &quot;đánh thuế&quot; phần dư thừa đó.
            </p>
          </div>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Tóm tắt & Kiểm tra">
        <MiniSummary
          title="5 điều cần nhớ"
          points={[
            "Surprise của một sự kiện = −log₂ p — càng hiếm càng bất ngờ.",
            "Entropy H(X) là surprise trung bình. Max khi phân phối đồng đều, = 0 khi chắc chắn.",
            "Cross-entropy H(p, q) = loss function cho phân loại — tối thiểu CE = tối thiểu KL.",
            "KL(p ‖ q) ≥ 0, = 0 khi p = q. Không đối xứng — chọn thứ tự có chủ đích.",
            "Bit và nat chỉ khác nhau về cơ số logarit — kết quả lý thuyết giống nhau.",
          ]}
        />

        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-foreground/85 leading-relaxed">
          <p>
            <strong>Xem ứng dụng thực tế:</strong>{" "}
            <TopicLink slug="information-theory-in-compression">
              Entropy trong nén file (ZIP, JPEG, H.265)
            </TopicLink>{" "}
            — cách Shannon đặt giới hạn lý thuyết cho mọi thuật toán nén, và Huffman gán mã
            ngắn cho ký tự phổ biến.
          </p>
        </div>

        <QuizSection questions={quizQuestions} />
        <div className="mt-4 flex items-center justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted hover:text-foreground"
            onClick={() => window.location.reload()}
          >
            <RotateCcw size={12} /> Tải lại trang để làm lại từ đầu
          </button>
        </div>
      </LessonSection>
    </>
  );
}
