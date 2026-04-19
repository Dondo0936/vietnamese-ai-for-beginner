"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Grid3X3,
  Target,
  Zap,
  Sparkles,
  RotateCcw,
  Palette,
  ArrowRight,
  Image as ImageIcon,
  Layers,
  AlertTriangle,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  StepReveal,
  InlineChallenge,
  Callout,
  MiniSummary,
  TopicLink,
  LessonSection,
} from "@/components/interactive";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";

export const metadata: TopicMeta = {
  slug: "perceptron-in-image-classification",
  title: "Perceptron in Image Classification",
  titleVi: "Perceptron nhận diện ảnh — chữ số 0 hay 1?",
  description:
    "Một perceptron nhìn vào ảnh 28×28 pixel và quyết định đó là chữ số '0' hay '1'. Bạn tô pixel bằng chuột và thấy dự đoán đổi ngay lập tức — rồi khám phá vì sao một nơ-ron là chưa đủ cho ảnh phức tạp.",
  category: "neural-fundamentals",
  tags: ["perceptron", "image-classification", "application", "mnist"],
  difficulty: "beginner",
  relatedSlugs: ["perceptron", "mlp", "cnn"],
  vizType: "interactive",
  applicationOf: "perceptron",
  featuredApp: {
    name: "MNIST digit recognition",
    productFeature: "Classifying hand-written digits 0 vs 1",
    company: "LeCun et al. / AT&T Bell Labs",
    countryOrigin: "US",
  },
  sources: [
    {
      title:
        "Gradient-Based Learning Applied to Document Recognition",
      publisher: "Yann LeCun et al., Proc. IEEE 86(11)",
      url: "http://yann.lecun.com/exdb/publis/pdf/lecun-98.pdf",
      date: "1998-11",
      kind: "paper",
    },
    {
      title: "The MNIST database of handwritten digits",
      publisher: "Yann LeCun",
      url: "http://yann.lecun.com/exdb/mnist/",
      date: "1998-01",
      kind: "documentation",
    },
    {
      title:
        "The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain",
      publisher: "Frank Rosenblatt, Psychological Review 65(6)",
      url: "https://www.ling.upenn.edu/courses/cogs501/Rosenblatt1958.pdf",
      date: "1958-01",
      kind: "paper",
    },
    {
      title:
        "Simple 2-layer linear classifier on MNIST — baseline accuracy ~88%",
      publisher: "MNIST benchmark page",
      url: "http://yann.lecun.com/exdb/mnist/",
      date: "1998-01",
      kind: "documentation",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Bài toán" },
    { id: "problem", labelVi: "Vì sao khó" },
    { id: "mechanism", labelVi: "Cách perceptron làm" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ─────────────────────────────────────────────────────────────
   DỮ LIỆU — hai ảnh chữ số 28×28 (0 và 1) dạng mảng boolean
   Mỗi phần tử 1 = pixel đen, 0 = pixel trắng.
   ───────────────────────────────────────────────────────────── */

const GRID_SIZE = 28;

type Grid = number[][]; // 28x28 of 0/1

function emptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function stampGrid(strokes: [number, number][]): Grid {
  const g = emptyGrid();
  strokes.forEach(([r, c]) => {
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) g[r][c] = 1;
  });
  return g;
}

/* Chữ số '0' — một vòng oval */
const DIGIT_ZERO_STROKES: [number, number][] = [
  // Đỉnh trên
  [5, 11], [5, 12], [5, 13], [5, 14], [5, 15], [5, 16],
  [6, 10], [6, 11], [6, 16], [6, 17],
  [7, 9], [7, 10], [7, 17], [7, 18],
  // Hai cạnh bên
  [8, 8], [8, 9], [8, 18], [8, 19],
  [9, 8], [9, 19],
  [10, 7], [10, 8], [10, 19], [10, 20],
  [11, 7], [11, 20],
  [12, 7], [12, 20],
  [13, 7], [13, 20],
  [14, 7], [14, 20],
  [15, 7], [15, 20],
  [16, 7], [16, 20],
  [17, 7], [17, 8], [17, 19], [17, 20],
  [18, 8], [18, 9], [18, 18], [18, 19],
  [19, 9], [19, 10], [19, 17], [19, 18],
  // Đáy
  [20, 10], [20, 11], [20, 16], [20, 17],
  [21, 11], [21, 12], [21, 13], [21, 14], [21, 15], [21, 16],
];

/* Chữ số '1' — một đường dọc có mũ và chân đế */
const DIGIT_ONE_STROKES: [number, number][] = [
  // Mũ
  [5, 13], [5, 14],
  [6, 12], [6, 13], [6, 14],
  [7, 11], [7, 12], [7, 14],
  [8, 10], [8, 11], [8, 14],
  // Thân dọc
  [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14],
  [15, 14], [16, 14], [17, 14], [18, 14], [19, 14], [20, 14],
  // Chân đế
  [21, 11], [21, 12], [21, 13], [21, 14], [21, 15], [21, 16], [21, 17],
  [22, 11], [22, 17],
];

const ZERO_GRID = stampGrid(DIGIT_ZERO_STROKES);
const ONE_GRID = stampGrid(DIGIT_ONE_STROKES);

/* ─────────────────────────────────────────────────────────────
   TRỌNG SỐ PERCEPTRON
   Giả lập trọng số "học" được sau khi train trên nhiều ảnh 0 và 1.
   - Các cột ở giữa (col ~14) có trọng số dương cao → gợi ý "1".
   - Các pixel ở rìa oval (góc trên/dưới, rìa trái/phải) trọng số âm → gợi ý "0".
   Cộng với bias nhỏ, tổng < 0 = "0", tổng > 0 = "1".
   ───────────────────────────────────────────────────────────── */

function buildTrainedWeights(): number[][] {
  const w: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  // Dương mạnh cho cột giữa (đặc trưng của '1')
  for (let r = 5; r < 23; r++) {
    w[r][14] = 1.4;
    w[r][13] = 0.8;
    w[r][15] = 0.8;
  }
  // Dương nhẹ cho mũ & chân đế của '1'
  [
    [5, 13],
    [5, 14],
    [6, 12],
    [6, 13],
    [7, 11],
    [8, 10],
    [21, 11],
    [21, 17],
    [22, 11],
    [22, 17],
  ].forEach(([r, c]) => {
    w[r][c] += 0.6;
  });
  // Âm mạnh cho rìa oval (đặc trưng của '0')
  DIGIT_ZERO_STROKES.forEach(([r, c]) => {
    w[r][c] -= 1.2;
  });
  // Tăng trọng số âm trên các cạnh xa đường dọc (chống '1' hoặc chống background nhiễu)
  for (let r = 7; r < 20; r++) {
    w[r][8] -= 0.4;
    w[r][20] -= 0.4;
  }
  return w;
}

const TRAINED_WEIGHTS = buildTrainedWeights();
const BIAS = -1;

function weightedSum(grid: Grid, weights: number[][], bias: number): number {
  let s = bias;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      s += grid[r][c] * weights[r][c];
    }
  }
  return s;
}

/* ─────────────────────────────────────────────────────────────
   KHU VỰC TƯƠNG TÁC 1: Pixel viewer — toggle để thay đổi dự đoán
   ───────────────────────────────────────────────────────────── */

type DigitPreset = "zero" | "one" | "blank" | "confused";

const CONFUSED_STROKES: [number, number][] = [
  // Một chữ số "mơ hồ" — vừa có vòng vừa có đường thẳng
  [7, 13], [7, 14], [8, 12], [8, 13], [8, 14], [8, 15],
  [9, 12], [9, 15], [10, 12], [10, 15], [11, 12], [11, 15],
  [12, 13], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14],
  [17, 14], [18, 14], [19, 14],
];

const PRESETS: Record<DigitPreset, Grid> = {
  zero: ZERO_GRID,
  one: ONE_GRID,
  blank: emptyGrid(),
  confused: stampGrid(CONFUSED_STROKES),
};

function PixelViewer() {
  const [preset, setPreset] = useState<DigitPreset>("one");
  const [grid, setGrid] = useState<Grid>(ONE_GRID);
  const [showWeights, setShowWeights] = useState(false);

  const rawSum = useMemo(() => weightedSum(grid, TRAINED_WEIGHTS, BIAS), [grid]);
  const prediction: 0 | 1 = rawSum > 0 ? 1 : 0;

  // Confidence — dùng |rawSum| đã được scale nhẹ để tránh số quá to
  const confidence = Math.min(1, Math.abs(rawSum) / 12);
  const activePixels = useMemo(
    () => grid.flat().filter((v) => v === 1).length,
    [grid]
  );

  const togglePixel = useCallback((r: number, c: number) => {
    setGrid((prev) => {
      const next = prev.map((row, i) =>
        i === r ? row.map((v, j) => (j === c ? (v ? 0 : 1) : v)) : row
      );
      return next;
    });
    setPreset("blank");
  }, []);

  const applyPreset = useCallback((p: DigitPreset) => {
    setPreset(p);
    setGrid(PRESETS[p].map((row) => [...row]));
  }, []);

  // Chuẩn hoá trọng số để tô heatmap
  const weightStats = useMemo(() => {
    let maxAbs = 0.001;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (Math.abs(TRAINED_WEIGHTS[r][c]) > maxAbs)
          maxAbs = Math.abs(TRAINED_WEIGHTS[r][c]);
      }
    }
    return { maxAbs };
  }, []);

  const weightToColor = (w: number) => {
    if (Math.abs(w) < 0.05) return "rgba(148,163,184,0.15)";
    const norm = Math.min(1, Math.abs(w) / weightStats.maxAbs);
    if (w > 0) {
      return `rgba(239, 68, 68, ${0.15 + norm * 0.6})`;
    }
    return `rgba(59, 130, 246, ${0.15 + norm * 0.6})`;
  };

  const pixelColor = (r: number, c: number, v: number) => {
    if (showWeights) return weightToColor(TRAINED_WEIGHTS[r][c]);
    return v ? "#0f172a" : "#f8fafc";
  };

  return (
    <div className="rounded-2xl border-2 border-accent/30 bg-accent-light p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
          <Grid3X3 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            Lưới 28×28 — tô pixel, xem dự đoán đổi
          </p>
          <p className="text-xs text-muted leading-snug">
            Nhấn vào từng ô để bật/tắt pixel. Perceptron tính lại và đưa ra
            phán quyết &ldquo;0&rdquo; hoặc &ldquo;1&rdquo; ngay lập tức.
          </p>
        </div>
      </div>

      {/* Hàng chọn preset */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-tertiary uppercase tracking-wider mr-1">
          Bắt đầu với
        </span>
        {(
          [
            { key: "one" as const, label: "Chữ 1", color: "bg-rose-500" },
            { key: "zero" as const, label: "Chữ 0", color: "bg-sky-500" },
            { key: "confused" as const, label: "Hỗn hợp", color: "bg-amber-500" },
            { key: "blank" as const, label: "Trống", color: "bg-slate-400" },
          ]
        ).map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => applyPreset(p.key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              preset === p.key
                ? `${p.color} text-white`
                : "border border-border bg-card text-muted hover:text-foreground"
            }`}
          >
            <ImageIcon size={11} />
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowWeights((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            showWeights
              ? "bg-purple-500 text-white"
              : "border border-border bg-card text-muted hover:text-foreground"
          }`}
        >
          <Palette size={11} />
          {showWeights ? "Đang xem trọng số" : "Xem trọng số"}
        </button>
        <button
          type="button"
          onClick={() => applyPreset("blank")}
          className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium text-muted hover:text-foreground"
        >
          <RotateCcw size={11} />
          Xoá hết
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Lưới 28×28 */}
        <div className="md:col-span-2">
          <div
            className="grid bg-border rounded-lg overflow-hidden border border-border mx-auto"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: "min(100%, 448px)",
              aspectRatio: "1 / 1",
              gap: "1px",
            }}
          >
            {grid.map((row, r) =>
              row.map((v, c) => (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  aria-label={`Pixel hàng ${r + 1} cột ${c + 1}`}
                  onClick={() => togglePixel(r, c)}
                  className="transition-colors"
                  style={{
                    backgroundColor: pixelColor(r, c, v),
                    outline:
                      showWeights && v
                        ? "2px solid rgba(34,197,94,0.6)"
                        : undefined,
                    outlineOffset: -1,
                  }}
                />
              ))
            )}
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted">
            {showWeights ? (
              <>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ backgroundColor: "rgba(239,68,68,0.7)" }}
                  />
                  Trọng số dương (gợi ý &ldquo;1&rdquo;)
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ backgroundColor: "rgba(59,130,246,0.7)" }}
                  />
                  Trọng số âm (gợi ý &ldquo;0&rdquo;)
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded outline outline-2 outline-emerald-500/60" />
                  Pixel đang bật
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-slate-900" />
                  Pixel đen (1)
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-slate-50 border border-border" />
                  Pixel trắng (0)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bảng dự đoán */}
        <div className="space-y-3">
          <div className="rounded-xl border-2 bg-card p-4 text-center"
               style={{ borderColor: prediction === 1 ? "#ef4444" : "#3b82f6" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tertiary mb-1">
              Perceptron nói
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={prediction}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="text-5xl font-black tabular-nums"
                style={{ color: prediction === 1 ? "#ef4444" : "#3b82f6" }}
              >
                {prediction}
              </motion.div>
            </AnimatePresence>
            <p className="text-[11px] text-muted mt-1">
              {prediction === 1 ? "Đây là chữ số 1" : "Đây là chữ số 0"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-tertiary">
                Tổng có trọng số
              </span>
              <span
                className="font-mono text-sm font-bold tabular-nums"
                style={{ color: rawSum > 0 ? "#ef4444" : "#3b82f6" }}
              >
                {rawSum.toFixed(2)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface overflow-hidden relative">
              <div
                className="absolute top-0 bottom-0"
                style={{
                  left: "50%",
                  width: `${confidence * 50}%`,
                  backgroundColor: prediction === 1 ? "#ef4444" : "#3b82f6",
                  transform: prediction === 0 ? "translateX(-100%)" : undefined,
                }}
              />
              <div className="absolute top-0 bottom-0 border-r border-border" style={{ left: "50%" }} />
            </div>
            <p className="text-[11px] text-muted leading-snug">
              Lớn hơn 0 → chọn 1. Nhỏ hơn 0 → chọn 0. Càng xa 0, perceptron càng &ldquo;tự tin&rdquo;.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface/50 p-3 text-[11px] text-muted space-y-1">
            <div className="flex items-center justify-between">
              <span>Pixel đang bật</span>
              <span className="font-mono text-foreground tabular-nums">{activePixels}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tổng pixel</span>
              <span className="font-mono text-foreground tabular-nums">{GRID_SIZE * GRID_SIZE}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Bias (ngưỡng)</span>
              <span className="font-mono text-foreground tabular-nums">{BIAS.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <Callout variant="tip" title="Mẹo trải nghiệm">
        Bấm &ldquo;Xem trọng số&rdquo; để thấy bản đồ nhiệt: đỏ là pixel mà khi bật lên sẽ đẩy
        perceptron về phía &ldquo;1&rdquo;, xanh là pixel đẩy về &ldquo;0&rdquo;. Đây chính là
        thứ perceptron &ldquo;học được&rdquo; sau khi xem hàng nghìn ảnh.
      </Callout>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   KHU VỰC TƯƠNG TÁC 2: 4 bước biến ảnh thành con số duy nhất
   ───────────────────────────────────────────────────────────── */

function PipelineDemo() {
  return (
    <StepReveal
      labels={[
        "Nhìn",
        "Duỗi phẳng",
        "Cộng trọng số",
        "Ngưỡng",
      ]}
    >
      {[
        <div
          key="s1"
          className="rounded-lg border border-border bg-surface/60 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Eye size={16} className="text-accent" />
            Bước 1: Ảnh 28×28 = 784 ô pixel
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Mọi bức ảnh đen–trắng trong MNIST là một lưới 28 hàng × 28 cột.
            Mỗi ô là một con số: 0 nếu trắng, 1 nếu đen (thật ra là thang xám
            0–255, ta đơn giản hoá thành nhị phân).
          </p>
          <svg viewBox="0 0 320 140" className="w-full max-w-sm mx-auto">
            <rect x={10} y={10} width={120} height={120} fill="none" stroke="currentColor" className="text-border" />
            <text x={70} y={72} textAnchor="middle" fontSize={22} fontWeight={700} fill="currentColor" className="text-foreground">
              1
            </text>
            <text x={70} y={145} textAnchor="middle" fontSize={11} fill="currentColor" className="text-muted">
              Ảnh 28×28
            </text>
            <line x1={130} y1={70} x2={180} y2={70} stroke="currentColor" className="text-muted" strokeWidth={1.5} markerEnd="url(#arrow)" />
            <defs>
              <marker id="arrow" markerWidth={10} markerHeight={10} refX={6} refY={3} orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="currentColor" className="text-muted" />
              </marker>
            </defs>
            {/* Lưới số 0/1 nhỏ */}
            {[0, 1, 2, 3, 4].map((i) =>
              [0, 1, 2, 3, 4].map((j) => (
                <text
                  key={`${i}-${j}`}
                  x={195 + j * 22}
                  y={28 + i * 20}
                  fontSize={10}
                  fill={i === 2 && j === 2 ? "#ef4444" : "currentColor"}
                  className="text-muted"
                  fontWeight={i === 2 && j === 2 ? 700 : 400}
                >
                  {i === 2 && j === 2 ? 1 : 0}
                </text>
              ))
            )}
            <text x={248} y={135} textAnchor="middle" fontSize={10} fill="currentColor" className="text-muted">
              Ma trận pixel
            </text>
          </svg>
        </div>,

        <div
          key="s2"
          className="rounded-lg border border-border bg-surface/60 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Layers size={16} className="text-accent" />
            Bước 2: Duỗi phẳng thành vector 784 chiều
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Perceptron không biết khái niệm &ldquo;hàng&rdquo; và &ldquo;cột&rdquo;. Nó chỉ nhận
            một dãy số. Ta xếp lần lượt 28 hàng nối đuôi nhau, được vector dài 28 × 28 = <strong>784 số</strong>:
            x₁, x₂, ..., x₇₈₄.
          </p>
          <svg viewBox="0 0 400 100" className="w-full max-w-md mx-auto">
            <rect x={10} y={20} width={80} height={60} fill="none" stroke="currentColor" className="text-border" />
            <text x={50} y={55} textAnchor="middle" fontSize={14} fontWeight={700} fill="currentColor" className="text-foreground">
              28×28
            </text>
            <line x1={95} y1={50} x2={120} y2={50} stroke="currentColor" className="text-muted" strokeWidth={1.5} markerEnd="url(#arrow2)" />
            <defs>
              <marker id="arrow2" markerWidth={10} markerHeight={10} refX={6} refY={3} orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="currentColor" className="text-muted" />
              </marker>
            </defs>
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={i}
                x={125 + i * 18}
                y={40}
                width={16}
                height={20}
                fill={[0, 3, 6, 9].includes(i) ? "#0f172a" : "#f8fafc"}
                stroke="currentColor"
                className="text-border"
                strokeWidth={0.5}
              />
            ))}
            <text x={125} y={75} fontSize={9} fill="currentColor" className="text-muted">
              x₁
            </text>
            <text x={341} y={75} fontSize={9} fill="currentColor" className="text-muted">
              x₇₈₄
            </text>
            <text x={220} y={30} textAnchor="middle" fontSize={10} fill="currentColor" className="text-muted">
              Vector 784 chiều
            </text>
          </svg>
        </div>,

        <div
          key="s3"
          className="rounded-lg border border-border bg-surface/60 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Zap size={16} className="text-accent" />
            Bước 3: Nhân với 784 trọng số rồi cộng lại
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Perceptron có <strong>một trọng số cho mỗi pixel</strong>. Sau khi học, pixel ở
            những vị trí &ldquo;có dấu hiệu của 1&rdquo; (cột giữa) sẽ có trọng số dương, pixel
            ở những vị trí &ldquo;có dấu hiệu của 0&rdquo; (rìa oval) có trọng số âm. Tổng có
            trọng số là một con số duy nhất: <em>điểm bỏ phiếu</em>.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-left bg-surface">
                  <th className="py-1.5 px-2 border-b border-border">Pixel</th>
                  <th className="py-1.5 px-2 border-b border-border">Giá trị xᵢ</th>
                  <th className="py-1.5 px-2 border-b border-border">Trọng số wᵢ</th>
                  <th className="py-1.5 px-2 border-b border-border">xᵢ × wᵢ</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { p: "cột giữa (14, 11)", x: 1, w: 1.4, note: "đẩy về 1" },
                  { p: "rìa trái (11, 7)", x: 0, w: -1.2, note: "tắt → 0" },
                  { p: "cột giữa (14, 14)", x: 1, w: 1.4, note: "đẩy về 1" },
                  { p: "góc trên (5, 12)", x: 0, w: -1.0, note: "tắt → 0" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-mono tabular-nums text-muted">{row.p}</td>
                    <td className="py-1.5 px-2 font-mono tabular-nums">{row.x}</td>
                    <td
                      className="py-1.5 px-2 font-mono tabular-nums font-bold"
                      style={{ color: row.w > 0 ? "#ef4444" : "#3b82f6" }}
                    >
                      {row.w > 0 ? "+" : ""}
                      {row.w.toFixed(1)}
                    </td>
                    <td className="py-1.5 px-2 font-mono tabular-nums">
                      {(row.x * row.w).toFixed(1)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-accent/10">
                  <td colSpan={3} className="py-1.5 px-2 font-semibold text-right">
                    Sau khi cộng hết 784 dòng + bias:
                  </td>
                  <td className="py-1.5 px-2 font-mono tabular-nums font-bold text-accent">
                    z = ?
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>,

        <div
          key="s4"
          className="rounded-lg border border-border bg-surface/60 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target size={16} className="text-accent" />
            Bước 4: So với 0 — &ldquo;1&rdquo; hay &ldquo;0&rdquo;?
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đây là bước quyết định. Perceptron chỉ biết một câu hỏi: <em>tổng vừa tính lớn hơn 0 hay không?</em>
            Không có &ldquo;80% tự tin&rdquo;, không có &ldquo;có thể&rdquo; — chỉ có hai khả năng.
          </p>
          <svg viewBox="0 0 360 140" className="w-full max-w-md mx-auto">
            <line x1={30} y1={70} x2={330} y2={70} stroke="currentColor" className="text-muted" strokeWidth={1} />
            <line x1={180} y1={20} x2={180} y2={120} stroke="currentColor" className="text-muted" strokeWidth={1} strokeDasharray="3 3" />
            <text x={180} y={18} textAnchor="middle" fontSize={10} fill="currentColor" className="text-muted">
              0
            </text>

            {/* Ví dụ 3 giá trị */}
            <circle cx={80} cy={70} r={8} fill="#3b82f6" />
            <text x={80} y={90} textAnchor="middle" fontSize={10} fill="#3b82f6" fontWeight={700}>
              z = −5
            </text>
            <text x={80} y={104} textAnchor="middle" fontSize={9} fill="currentColor" className="text-muted">
              → đoán 0
            </text>

            <circle cx={180} cy={70} r={8} fill="#94a3b8" />
            <text x={180} y={90} textAnchor="middle" fontSize={10} fill="currentColor" className="text-muted" fontWeight={700}>
              z = 0
            </text>
            <text x={180} y={104} textAnchor="middle" fontSize={9} fill="currentColor" className="text-muted">
              → biên
            </text>

            <circle cx={280} cy={70} r={8} fill="#ef4444" />
            <text x={280} y={90} textAnchor="middle" fontSize={10} fill="#ef4444" fontWeight={700}>
              z = +4
            </text>
            <text x={280} y={104} textAnchor="middle" fontSize={9} fill="currentColor" className="text-muted">
              → đoán 1
            </text>
          </svg>
          <p className="text-xs text-muted italic">
            Trên bức ảnh bạn vừa tô, perceptron chạy đúng đường này — 784 phép nhân, một phép cộng, một phép so sánh với 0.
          </p>
        </div>,
      ]}
    </StepReveal>
  );
}

/* ─────────────────────────────────────────────────────────────
   KHU VỰC TƯƠNG TÁC 3: Vì sao cần mạng sâu cho ảnh thật
   ───────────────────────────────────────────────────────────── */

const COMPARISON_CASES = [
  {
    key: "clean",
    title: "Chữ 1 thẳng, viết đúng giữa",
    pctPerceptron: 99,
    pctDeep: 99.9,
    note: "Mẫu gần giống dữ liệu huấn luyện — một perceptron cũng xử lý được.",
    color: "#22c55e",
  },
  {
    key: "rotate",
    title: "Chữ 1 bị nghiêng 20°",
    pctPerceptron: 62,
    pctDeep: 99.3,
    note: "Pixel ở giữa không còn hoạt động như mong đợi. Trọng số cũ không khớp.",
    color: "#f59e0b",
  },
  {
    key: "shift",
    title: "Chữ 1 bị dịch sang bên phải 5 pixel",
    pctPerceptron: 48,
    pctDeep: 99.5,
    note: "Perceptron phụ thuộc chặt vị trí — pixel dịch đi là lẫn ngay.",
    color: "#f97316",
  },
  {
    key: "thick",
    title: "Chữ 1 viết rất đậm, dày gấp đôi",
    pctPerceptron: 71,
    pctDeep: 99.0,
    note: "Thêm pixel bật = thêm trọng số cộng dồn, dễ vượt ngưỡng của cả lớp khác.",
    color: "#f59e0b",
  },
  {
    key: "nine",
    title: "Thêm phân biệt: 0 vs 1 vs 2 vs ... vs 9",
    pctPerceptron: 35,
    pctDeep: 99.2,
    note: "Perceptron nhị phân không xử lý được 10 lớp; cần nhiều nơ-ron + softmax.",
    color: "#ef4444",
  },
] as const;

function ComparisonTable() {
  const [pick, setPick] = useState<(typeof COMPARISON_CASES)[number]["key"]>("clean");
  const active = COMPARISON_CASES.find((c) => c.key === pick) ?? COMPARISON_CASES[0];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500 text-white">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Khi perceptron đuối sức</p>
          <p className="text-xs text-muted leading-snug">
            Bấm vào từng kịch bản để so sánh độ chính xác của một perceptron đơn và một mạng sâu
            (CNN nhỏ).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {COMPARISON_CASES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setPick(c.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              pick === c.key
                ? "bg-accent text-white"
                : "border border-border bg-card text-muted hover:text-foreground"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Perceptron */}
        <div
          className="rounded-xl border-2 p-4 space-y-2"
          style={{ borderColor: active.color }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">
              Perceptron đơn
            </span>
            <span className="font-mono text-xl font-bold tabular-nums" style={{ color: active.color }}>
              {active.pctPerceptron}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <motion.div
              key={active.key + "-p"}
              initial={{ width: 0 }}
              animate={{ width: `${active.pctPerceptron}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="h-full"
              style={{ backgroundColor: active.color }}
            />
          </div>
          <p className="text-[11px] text-muted leading-snug">{active.note}</p>
        </div>

        {/* Mạng sâu */}
        <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Mạng sâu (CNN nhỏ)
            </span>
            <span className="font-mono text-xl font-bold tabular-nums text-emerald-600">
              {active.pctDeep}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <motion.div
              key={active.key + "-d"}
              initial={{ width: 0 }}
              animate={{ width: `${active.pctDeep}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="h-full bg-emerald-500"
            />
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-snug">
            Nhiều lớp + convolution = tự học đặc trưng bất biến với dịch chuyển / xoay / co giãn.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   QUIZ — kiểm tra nhanh sau khi trải nghiệm
   ───────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Ảnh 28×28 pixel được đưa vào perceptron dưới dạng gì?",
    options: [
      "Một hình vuông giữ nguyên hai chiều",
      "Một vector dài 784 số (28 × 28 được duỗi phẳng)",
      "Một chuỗi ký tự mô tả hình",
      "Một ma trận 28×28 đưa từng cột một vào nơ-ron",
    ],
    correct: 1,
    explanation:
      "Perceptron chỉ nhận một dãy số phẳng. Quá trình 'duỗi phẳng' nối 28 hàng × 28 cột thành vector 784 chiều. Mỗi số được nhân với một trọng số riêng.",
  },
  {
    question:
      "Sau khi huấn luyện để phân biệt 0 vs 1, 'bản đồ trọng số' có đặc điểm gì?",
    options: [
      "Tất cả trọng số gần bằng 0 — vì ảnh phần lớn là trắng",
      "Cột giữa có trọng số dương (đặc trưng của 1), rìa oval có trọng số âm (đặc trưng của 0)",
      "Trọng số ngẫu nhiên như lúc khởi tạo",
      "Chỉ có 1 trọng số khác 0, tất cả còn lại đều bằng 0",
    ],
    correct: 1,
    explanation:
      "Perceptron học được rằng những pixel ở vị trí hay sáng trong '1' nên có trọng số dương, còn những pixel đặc trưng của '0' (rìa oval) nên có trọng số âm. Đây chính là những gì bạn thấy khi bật 'Xem trọng số'.",
  },
  {
    question:
      "Với bài phân loại nhị phân 0-vs-1 trên MNIST, một perceptron đơn đạt quanh bao nhiêu phần trăm chính xác?",
    options: [
      "50% — gần như đoán mò",
      "75%",
      "Khoảng 99% — gần tối đa",
      "100% — mọi ảnh đều đúng",
    ],
    correct: 2,
    explanation:
      "Bài 0-vs-1 gần như phân tách tuyến tính, nên một perceptron đủ để đạt gần 99%. Nhưng với đủ 10 lớp chữ số (0–9) thì perceptron chỉ đạt ~88%; CNN sâu đạt 99%+.",
  },
  {
    question:
      "Tại sao một perceptron không xử lý tốt ảnh bị dịch chuyển vài pixel sang phải?",
    options: [
      "Perceptron không biết nhận diện chữ bị nghiêng",
      "Mỗi trọng số gắn cứng với một vị trí pixel cụ thể — dịch ảnh là phá vỡ mối liên hệ đó",
      "Vì perceptron không có đủ dữ liệu",
      "Vì hàm bước không đo được khoảng cách",
    ],
    correct: 1,
    explanation:
      "Perceptron coi mỗi vị trí pixel là một đầu vào riêng biệt. Nếu chữ số dịch sang phải 5 pixel, pixel quan trọng giờ nằm ở cột khác — trọng số cũ không phát hiện. CNN giải bài này bằng cách trượt cùng bộ trọng số qua mọi vị trí (convolution).",
  },
  {
    type: "fill-blank",
    question:
      "Perceptron tính: z = x₁·w₁ + x₂·w₂ + ... + x₇₈₄·w₇₈₄ + b. Nếu z > 0, output là {blank}; ngược lại output là 0.",
    blanks: [{ answer: "1", accept: ["một", "one"] }],
    explanation:
      "Hàm bước: z > 0 → 1, z ≤ 0 → 0. Đây là bước biến một phép cộng liên tục thành câu trả lời nhị phân. Mạng sâu thay hàm bước bằng sigmoid / ReLU để có đạo hàm.",
  },
];

/* ─────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ───────────────────────────────────────────────────────────── */

export default function PerceptronInImageClassification() {
  return (
    <ApplicationLayout metadata={metadata} parentTitleVi="Perceptron">
      {/* ━━━ HERO ━━━ */}
      <ApplicationHero parentTitleVi="Perceptron" topicSlug={metadata.slug}>
        <p>
          Thập niên 1990, phòng thí nghiệm của Yann LeCun tại AT&T Bell Labs
          công bố <strong>bộ dữ liệu MNIST</strong>: 70.000 ảnh chữ số viết tay
          28×28 pixel. Bộ dữ liệu nhỏ bé này lại trở thành &ldquo;phòng tập
          gym&rdquo; đầu tiên cho mọi mô hình thị giác máy tính.
        </p>
        <p>
          Bài toán đầu bài: <em>cho một ảnh 28×28, nhận diện đó là chữ số
          &ldquo;0&rdquo; hay chữ số &ldquo;1&rdquo;</em>. Nghe đơn giản đến
          mức mọi người hỏi: một perceptron đơn — <TopicLink slug="perceptron">
          chính là viên gạch mà bạn vừa học
          </TopicLink> — có đủ không? Câu trả lời rất đáng ngạc nhiên: cho bài
          toán 0 vs 1, một perceptron đạt quanh <strong>99%</strong> chính xác
          trên dữ liệu gọn gàng. Nhưng chỉ cần xoay ảnh 20°, đưa vào 10 chữ số
          thay vì 2, hoặc nét viết đậm hơn — perceptron đuối sức ngay.
        </p>
        <p>
          Phần dưới sẽ cho bạn <strong>tô thử một lưới 28×28</strong>, xem
          &ldquo;bản đồ trọng số&rdquo; mà perceptron đã học, và hiểu vì sao
          ngành ảnh phải rẽ sang mạng sâu.
        </p>
      </ApplicationHero>

      {/* ━━━ PROBLEM ━━━ */}
      <ApplicationProblem topicSlug={metadata.slug}>
        <p>
          Trước những năm 1990, máy nhận chữ viết tay phải được lập trình bằng
          các quy tắc hình học: &ldquo;nếu có một đường thẳng dọc ở cột giữa
          thì đó là chữ 1&rdquo;. Cách này sụp đổ ngay khi gặp người viết khác
          tay, xoay nhẹ, hoặc nét đứt. Các hệ thống phân loại thư tự động của
          bưu điện Mỹ vì thế phải dựa vào nhân công đọc mã vùng từng lá thư.
        </p>
        <p>
          Cơ quan Bưu chính Hoa Kỳ và AT&T đặt một câu hỏi kỹ thuật: có mô
          hình nào <em>tự học</em> nhận dạng chữ số từ hàng chục nghìn ví dụ?
          Perceptron — ý tưởng đã có từ 1958 — được kéo ra khỏi &ldquo;mùa
          đông AI&rdquo; và chạy thử trên MNIST như một mô hình chuẩn đối
          chứng (baseline).
        </p>

        <div className="not-prose my-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-card p-4 space-y-1.5 border-l-4 border-l-sky-500">
            <p className="text-sm font-bold text-foreground">784 đầu vào</p>
            <p className="text-xs text-muted leading-snug">
              Mỗi ảnh 28×28 duỗi phẳng thành 784 số. Perceptron cần đúng 784
              trọng số — không nhiều hơn, không ít hơn.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-1.5 border-l-4 border-l-amber-500">
            <p className="text-sm font-bold text-foreground">1 đầu ra</p>
            <p className="text-xs text-muted leading-snug">
              Chỉ có hai câu trả lời: &ldquo;0&rdquo; hoặc &ldquo;1&rdquo;.
              Đây là bài toán phân loại nhị phân — vừa vặn với hàm bước của
              perceptron.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-1.5 border-l-4 border-l-rose-500">
            <p className="text-sm font-bold text-foreground">Dữ liệu 60.000 ảnh</p>
            <p className="text-xs text-muted leading-snug">
              Đủ để luật học Rosenblatt hội tụ trong vài chục lần quét, mỗi
              lần chỉnh từng trọng số một chút.
            </p>
          </div>
        </div>
      </ApplicationProblem>

      {/* ━━━ MECHANISM ━━━ */}
      <ApplicationMechanism parentTitleVi="Perceptron" topicSlug={metadata.slug}>
        <Beat step={1}>
          <p>
            <strong>Đưa ảnh thành vector 784 số.</strong> Ảnh được chuyển về
            xám, co về kích thước 28×28, rồi duỗi phẳng thành một dãy 784 giá
            trị x₁, x₂, ..., x₇₈₄. Mỗi số đại diện độ sáng của một ô pixel.
            Perceptron không nhìn &ldquo;bức tranh&rdquo; — nó nhìn một danh
            sách dài.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Khởi tạo 784 trọng số ngẫu nhiên.</strong> Perceptron bắt
            đầu mỗi trọng số bằng một số ngẫu nhiên nhỏ. Ở lúc này, trọng số
            chưa nói được gì — bấm nút &ldquo;predict&rdquo; chỉ cho ra một
            câu trả lời tuỳ tiện.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Duyệt qua tập huấn luyện, sửa trọng số khi sai.</strong>{" "}
            Với mỗi ảnh (có nhãn đúng), perceptron tính tổng có trọng số, đưa
            ra dự đoán. Nếu sai, áp dụng luật Rosenblatt:{" "}
            <code className="text-xs">wᵢ ← wᵢ + η · (target − output) · xᵢ</code>.
            Nói nôm na: những pixel đã bật nhưng đẩy câu trả lời về sai hướng
            sẽ bị trừ trọng số.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Hội tụ sau vài chục vòng.</strong> Rosenblatt chứng minh
            (1958): nếu dữ liệu phân tách tuyến tính, luật học này{" "}
            <em>chắc chắn hội tụ</em> sau một số hữu hạn bước. MNIST 0-vs-1
            về cơ bản là phân tách tuyến tính — nên vài chục lần quét là đủ.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Dùng perceptron đã học.</strong> Với mỗi ảnh mới, chạy đúng
            một lần phép tính 784 nhân + 1 cộng + 1 so sánh. Trên phần cứng
            thập niên 1960, việc này mất vài mili-giây. Trên điện thoại hiện
            nay, gần như tức thời.
          </p>
        </Beat>

        {/* REVEAL 1: Pixel viewer */}
        <li className="mt-8">
          <PixelViewer />
        </li>

        {/* DEEPEN: Pipeline 4 bước */}
        <li className="mt-6">
          <LessonSection label="Nhìn kỹ đường đi của một ảnh" step={1}>
            <p className="text-sm text-muted mb-3 leading-relaxed">
              Bốn bước dưới đây là <em>chính xác</em> những gì perceptron làm
              trên bức ảnh bạn vừa tô. Bấm &ldquo;Tiếp tục&rdquo; để mở từng
              bước.
            </p>
            <PipelineDemo />
          </LessonSection>
        </li>
      </ApplicationMechanism>

      {/* ━━━ METRICS ━━━ */}
      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug={metadata.slug}
      >
        <Metric
          value="Perceptron 1 lớp trên MNIST đạt ~88% chính xác trên toàn bộ 10 lớp chữ số (0–9)"
          sourceRef={4}
        />
        <Metric
          value="Bài toán nhị phân 0-vs-1 dễ hơn: perceptron đạt quanh 99% — gần tối đa có thể"
          sourceRef={2}
        />
        <Metric
          value="Mạng CNN nhỏ (2 lớp tích chập) của LeCun năm 1998 đạt 99.2% trên 10 lớp — gấp nhiều lần perceptron"
          sourceRef={1}
        />
      </ApplicationMetrics>

      {/* ━━━ REVEAL 2 & CHALLENGE (xen giữa Metrics và Counterfactual) ━━━ */}
      <section className="mb-10">
        <LessonSection label="Khi nào một perceptron không còn đủ?" step={2}>
          <p className="text-sm text-muted mb-3 leading-relaxed">
            Với bài 0-vs-1 gọn gàng, perceptron gần như hoàn hảo. Nhưng chỉ cần
            thay đổi nhỏ trong dữ liệu là nó gãy. Bấm từng kịch bản dưới đây.
          </p>
          <ComparisonTable />
        </LessonSection>
      </section>

      <section className="mb-10">
        <LessonSection label="Thử thách hiểu" step={3}>
          <InlineChallenge
            question="Vì sao một perceptron lại gặp khó khăn khi ảnh chữ số bị dịch chuyển vài pixel sang phải?"
            options={[
              "Vì perceptron không biết nhân — nó chỉ cộng được",
              "Vì mỗi trọng số gắn cứng với một vị trí pixel cụ thể; dịch ảnh là phá vỡ mối liên hệ đó",
              "Vì perceptron cần nhiều dữ liệu hơn",
              "Vì hàm bước không xử lý được số lớn",
            ]}
            correct={1}
            explanation="Perceptron học một trọng số cho mỗi pixel ở mỗi vị trí. Nếu chữ số dịch sang phải, pixel quan trọng giờ nằm ở cột khác — trọng số cũ không phát hiện ra. CNN giải bài này bằng convolution: cùng một bộ trọng số được trượt trên mọi vị trí, nên đặc trưng 'đường dọc' được nhận ra dù nó ở đâu."
          />

          <div className="mt-4">
            <InlineChallenge
              question="Vì sao mạng sâu (deep nets) vượt xa một perceptron trên bài toán ảnh thực tế?"
              options={[
                "Vì mạng sâu có nhiều GPU hơn",
                "Vì mạng sâu xếp nhiều lớp trọng số — mỗi lớp học một kiểu đặc trưng: cạnh → hình dạng → chữ cái. Một perceptron chỉ có một lớp đơn.",
                "Vì perceptron chỉ làm được khi ảnh là vuông",
                "Vì mạng sâu dùng hàm bước thay vì hàm kích hoạt",
              ]}
              correct={1}
              explanation="Ảnh thật có cấu trúc phân cấp: pixel → cạnh → hình dạng → bộ phận → vật thể. Một perceptron chỉ có một lớp cộng có trọng số — chỉ phân biệt được những gì 'tuyến tính'. Mạng sâu xếp lớp để từng lớp học một mức trừu tượng cao hơn. Thêm vào convolution giúp các đặc trưng độc lập với vị trí."
            />
          </div>
        </LessonSection>
      </section>

      {/* ━━━ COUNTERFACTUAL ━━━ */}
      <ApplicationCounterfactual
        parentTitleVi="Perceptron"
        topicSlug={metadata.slug}
      >
        <p>
          Nếu Rosenblatt không chứng minh được rằng một perceptron có thể tự
          học nhận diện chữ số, ngành thị giác máy tính có thể đã không ra
          đời theo con đường &ldquo;học từ dữ liệu&rdquo;. Mọi hệ thống OCR
          (đọc chữ), nhận diện khuôn mặt, xe tự lái hôm nay đều bắt nguồn từ
          ý tưởng đơn giản mà bạn vừa tự tay thử: <strong>cho máy xem hàng
          nghìn ảnh có nhãn, để nó tự điều chỉnh trọng số</strong>.
        </p>
        <p>
          Cùng lúc đó, giới hạn của perceptron (không xử lý được XOR, không
          bất biến với xoay / dịch) là cú hích đẩy ngành AI sang{" "}
          <TopicLink slug="mlp">mạng nhiều lớp (MLP)</TopicLink>,{" "}
          <TopicLink slug="cnn">mạng tích chập (CNN)</TopicLink>, và hàng loạt
          kiến trúc sâu. MNIST vẫn là benchmark đầu tiên mọi sinh viên ML thử
          — vì nó nhỏ đủ để chạy trong vài giây, nhưng đủ phức tạp để lộ ra
          hạn chế của mô hình đơn giản.
        </p>
      </ApplicationCounterfactual>

      {/* ━━━ TÓM TẮT ━━━ */}
      <section className="mb-10">
        <MiniSummary
          title="4 điều cần nhớ về perceptron trên ảnh"
          points={[
            "Ảnh 28×28 duỗi phẳng thành 784 số; perceptron có đúng 784 trọng số.",
            "Sau khi học, 'bản đồ trọng số' cho thấy những vị trí pixel quan trọng để phân biệt hai lớp.",
            "Bài 0-vs-1 đạt ~99% — một perceptron đủ cho dữ liệu gọn gàng, phân tách tuyến tính.",
            "Ảnh xoay, dịch, đậm khác hoặc bài 10 lớp → perceptron gãy; phải dùng mạng sâu (MLP, CNN).",
          ]}
        />

        <div className="mt-4">
          <Callout variant="insight" title="Từ một nơ-ron tới mạng sâu">
            Viên gạch <TopicLink slug="perceptron">perceptron</TopicLink> bạn vừa học là nguyên
            thuỷ của mọi mạng nơ-ron hiện đại. Xếp chúng thành lớp, thay hàm bước bằng hàm kích
            hoạt trơn, dùng gradient descent — bạn có{" "}
            <TopicLink slug="mlp">MLP</TopicLink>. Thêm convolution để xử lý ảnh bất biến vị
            trí — bạn có <TopicLink slug="cnn">CNN</TopicLink>. Mỗi bước là một mở rộng tự
            nhiên từ nền móng này.
          </Callout>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted">
          <Sparkles size={12} className="text-accent" />
          <span>
            Bạn đã thấy perceptron làm việc với ảnh. Giờ bạn có thể trở lại lý thuyết để nắm chắc
            từng bước bên trong, hoặc đi tiếp đến MLP để xem điều gì xảy ra khi xếp nhiều nơ-ron
            thành lớp.
          </span>
          <ArrowRight size={12} />
          <AlertTriangle size={12} />
        </div>

        <div className="mt-8">
          <QuizSection questions={quizQuestions} />
        </div>
      </section>
    </ApplicationLayout>
  );
}
