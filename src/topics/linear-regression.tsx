"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingDown,
  Sparkles,
  Target,
  Ruler,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  Wand2,
} from "lucide-react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CollapsibleDetail,
  LaTeX,
  TopicLink,
  StepReveal,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "linear-regression",
  title: "Linear Regression",
  titleVi: "Hồi quy tuyến tính",
  description:
    "Làm sao vẽ một đường thẳng 'hợp nhất' qua một đám điểm dữ liệu? Bạn thử trước bằng mắt, rồi so với cách máy tính tìm đường tối ưu.",
  category: "classic-ml",
  tags: ["regression", "supervised-learning", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["polynomial-regression", "logistic-regression", "gradient-descent"],
  vizType: "interactive",
};

/* ═══════════════════════════════════════════════════════════════════
   TIỆN ÍCH — tính đường hồi quy và MSE
   ═══════════════════════════════════════════════════════════════════ */

type Pt = { x: number; y: number };

function fitLineOLS(points: Pt[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 160 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function mse(points: Pt[], slope: number, intercept: number) {
  if (points.length === 0) return 0;
  return (
    points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0) /
    points.length
  );
}

const INITIAL_POINTS: Pt[] = [
  { x: 50, y: 270 },
  { x: 100, y: 235 },
  { x: 150, y: 210 },
  { x: 200, y: 175 },
  { x: 270, y: 145 },
  { x: 320, y: 115 },
  { x: 400, y: 80 },
];

/* ═══════════════════════════════════════════════════════════════════
   QUIZ
   ═══════════════════════════════════════════════════════════════════ */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Hồi quy tuyến tính tìm một đường thẳng sao cho điều gì là nhỏ nhất?",
    options: [
      "Tổng khoảng cách tuyệt đối từ từng điểm đến đường thẳng",
      "Tổng bình phương sai số giữa giá trị thực và giá trị dự đoán (MSE)",
      "Số điểm nằm trên đường thẳng",
      "Độ dốc của đường thẳng",
    ],
    correct: 1,
    explanation:
      "Phương pháp bình phương tối thiểu (OLS) chọn đường thẳng sao cho tổng (giá trị thực − giá trị dự đoán)² nhỏ nhất. Bình phương giúp máy 'phạt nặng' các điểm nằm xa đường.",
  },
  {
    question:
      "Nếu mọi điểm dữ liệu nằm đúng trên đường hồi quy thì MSE bằng bao nhiêu?",
    options: [
      "1, vì đường khớp hoàn hảo",
      "0, vì không có sai số nào",
      "Không xác định",
      "Phụ thuộc vào độ dốc đường",
    ],
    correct: 1,
    explanation:
      "MSE = trung bình của các bình phương sai số. Khi mọi điểm trùng đường, mỗi sai số = 0 nên MSE = 0. Trường hợp này ít gặp trong thực tế vì dữ liệu luôn có nhiễu.",
  },
  {
    type: "fill-blank",
    question:
      "Công thức đường thẳng dự đoán: ŷ = {blank} · x + {blank}. Tham số đầu là độ dốc, tham số sau là điểm chặn trục y.",
    blanks: [
      { answer: "w1", accept: ["w_1", "a", "m", "slope", "w"] },
      { answer: "w0", accept: ["w_0", "b", "c", "intercept", "bias"] },
    ],
    explanation:
      "ŷ = w1·x + w0 là dạng chuẩn. w1 cho biết x tăng 1 đơn vị thì ŷ tăng bao nhiêu; w0 là giá trị ŷ khi x = 0.",
  },
  {
    question:
      "Bạn kéo một điểm xa hẳn đám đông (ngoại lai). Đường hồi quy phản ứng thế nào?",
    options: [
      "Không đổi vì thuật toán bỏ qua điểm lạ",
      "Bị kéo lệch về phía điểm đó, đôi khi rất mạnh",
      "Báo lỗi và dừng lại",
      "Cong lên theo điểm đó",
    ],
    correct: 1,
    explanation:
      "Vì MSE dùng bình phương, một điểm sai số lớn sẽ đóng góp rất nhiều vào tổng loss. Đường thẳng sẽ dịch chuyển để giảm sai số đó, dẫn tới đường bị &ldquo;kéo&rdquo;. Đây là lý do hồi quy tuyến tính nhạy cảm với outlier.",
  },
  {
    question:
      "Với dữ liệu 1 biến, khi bạn tăng độ dốc (slope) nhưng giữ nguyên điểm chặn, điều gì xảy ra?",
    options: [
      "Đường thẳng dịch lên cùng lúc",
      "Đường thẳng xoay quanh điểm chặn ở trục y",
      "Đường thẳng song song với trục x",
      "Không có gì thay đổi",
    ],
    correct: 1,
    explanation:
      "Điểm chặn (intercept) là nơi đường cắt trục y khi x=0. Thay đổi slope = xoay đường thẳng quanh điểm chặn ấy. Thay đổi intercept mới làm đường &ldquo;dịch&rdquo; lên/xuống song song.",
  },
  {
    question:
      "Khi nào hồi quy tuyến tính KHÔNG phù hợp?",
    options: [
      "Khi có 1000 điểm dữ liệu",
      "Khi quan hệ giữa x và y rõ ràng theo đường cong, không phải đường thẳng",
      "Khi dữ liệu được đo bằng cm chứ không phải m",
      "Khi bạn không có máy tính",
    ],
    correct: 1,
    explanation:
      "Hồi quy tuyến tính chỉ tìm đường thẳng. Nếu dữ liệu có dạng đường cong rõ (như parabol), cần hồi quy đa thức hoặc mô hình phức tạp hơn.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   DRAGGABLE SCATTER — giữ SVG gốc, mở rộng với chế độ người dùng
   tự chỉnh độ dốc / điểm chặn
   ═══════════════════════════════════════════════════════════════════ */

function ScatterPlayground() {
  const [points, setPoints] = useState<Pt[]>(INITIAL_POINTS);
  const [dragging, setDragging] = useState<number | null>(null);
  const [showErrors, setShowErrors] = useState(true);
  const [showOptimal, setShowOptimal] = useState(false);

  // Đường thẳng do người dùng chỉnh
  const [userSlope, setUserSlope] = useState(-0.3);
  const [userIntercept, setUserIntercept] = useState(250);

  // Đường tối ưu (OLS)
  const { slope: optSlope, intercept: optIntercept } = useMemo(
    () => fitLineOLS(points),
    [points]
  );

  const userLineY = useCallback(
    (x: number) => userSlope * x + userIntercept,
    [userSlope, userIntercept]
  );
  const optLineY = useCallback(
    (x: number) => optSlope * x + optIntercept,
    [optSlope, optIntercept]
  );

  const userMSE = useMemo(
    () => mse(points, userSlope, userIntercept),
    [points, userSlope, userIntercept]
  );
  const optMSE = useMemo(
    () => mse(points, optSlope, optIntercept),
    [points, optSlope, optIntercept]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (dragging !== null) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (500 / rect.width);
      const y = (e.clientY - rect.top) * (320 / rect.height);
      if (x < 10 || x > 490 || y < 10 || y > 310) return;
      setPoints((prev) => [...prev, { x, y }]);
    },
    [dragging]
  );

  const handlePointerDown = (idx: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragging(idx);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (dragging === null) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(500, (e.clientX - rect.left) * (500 / rect.width))
      );
      const y = Math.max(
        0,
        Math.min(320, (e.clientY - rect.top) * (320 / rect.height))
      );
      setPoints((prev) =>
        prev.map((p, i) => (i === dragging ? { x, y } : p))
      );
    },
    [dragging]
  );

  const handlePointerUp = useCallback(() => setDragging(null), []);

  const applyOptimal = useCallback(() => {
    setUserSlope(optSlope);
    setUserIntercept(optIntercept);
  }, [optSlope, optIntercept]);

  const resetAll = useCallback(() => {
    setPoints(INITIAL_POINTS);
    setUserSlope(-0.3);
    setUserIntercept(250);
    setShowOptimal(false);
  }, []);

  const comparison = useMemo(() => {
    if (!showOptimal) return null;
    const diff = userMSE - optMSE;
    if (Math.abs(diff) < 0.5) {
      return { tone: "match" as const, text: "Bạn đã gần như trùng với đường tối ưu!" };
    }
    if (diff > 0) {
      return {
        tone: "above" as const,
        text: `Đường của máy nhỏ hơn ${diff.toFixed(1)} đơn vị bình phương. Có thể bạn sẽ thấy khác biệt rõ ở vài điểm xa đường.`,
      };
    }
    return {
      tone: "below" as const,
      text: "Lạ thật — trong trường hợp này MSE của bạn còn thấp hơn? Kiểm tra lại cách bạn di chuyển điểm.",
    };
  }, [userMSE, optMSE, showOptimal]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted leading-relaxed">
        Đây là bàn làm việc của bạn. <strong>Kéo thanh trượt</strong> để chỉnh độ dốc và điểm chặn —
        thử vẽ một đường mà bạn thấy &ldquo;hợp&rdquo; với đám điểm. Khi đã ưng ý, bật{" "}
        <em>Đường tối ưu</em> để so với cách máy tìm.
      </p>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <svg
          viewBox="0 0 500 320"
          className="w-full cursor-crosshair rounded-lg border border-border bg-background"
          style={{ touchAction: dragging !== null ? "none" : "auto" }}
          role="img"
          aria-label={`Biểu đồ hồi quy tương tác: ${points.length} điểm. MSE bạn ${userMSE.toFixed(1)}, MSE tối ưu ${optMSE.toFixed(1)}.`}
          onClick={handleCanvasClick}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Lưới */}
          {[0, 80, 160, 240, 320].map((y) => (
            <line
              key={`gy-${y}`}
              x1={0}
              y1={y}
              x2={500}
              y2={y}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.5}
              opacity={0.6}
            />
          ))}
          {[0, 100, 200, 300, 400, 500].map((x) => (
            <line
              key={`gx-${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={320}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.5}
              opacity={0.6}
            />
          ))}

          {/* Đường tối ưu (xanh lá) */}
          <AnimatePresence>
            {showOptimal && (
              <motion.line
                key="opt-line"
                x1={0}
                y1={optLineY(0)}
                x2={500}
                y2={optLineY(500)}
                stroke="#10b981"
                strokeWidth={2.5}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  y1: optLineY(0),
                  y2: optLineY(500),
                }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
              />
            )}
          </AnimatePresence>

          {/* Đường của người dùng (xanh dương, nét đứt) */}
          <motion.line
            x1={0}
            y1={userLineY(0)}
            x2={500}
            y2={userLineY(500)}
            stroke="#3b82f6"
            strokeWidth={2.5}
            strokeDasharray="8 4"
            animate={{ y1: userLineY(0), y2: userLineY(500) }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          />

          {/* Sai số dọc (residuals) tính theo đường người dùng */}
          <AnimatePresence>
            {showErrors &&
              points.map((p, i) => (
                <motion.line
                  key={`err-${i}`}
                  x1={p.x}
                  y1={p.y}
                  x2={p.x}
                  y2={userLineY(p.x)}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  opacity={0.55}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.55 }}
                  exit={{ opacity: 0 }}
                />
              ))}
          </AnimatePresence>

          {/* Hình vuông biểu thị bình phương sai số */}
          <AnimatePresence>
            {showErrors &&
              points.map((p, i) => {
                const err = Math.abs(p.y - userLineY(p.x));
                if (err < 3) return null;
                const size = Math.min(err, 40);
                const yStart = Math.min(p.y, userLineY(p.x));
                return (
                  <motion.rect
                    key={`sq-${i}`}
                    x={p.x}
                    y={yStart}
                    width={size}
                    height={size}
                    fill="#ef4444"
                    opacity={0.08}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.08 }}
                    exit={{ opacity: 0 }}
                  />
                );
              })}
          </AnimatePresence>

          {/* Điểm dữ liệu */}
          {points.map((p, i) => (
            <motion.circle
              key={`pt-${i}`}
              cx={p.x}
              cy={p.y}
              r={6}
              fill="#f97316"
              stroke="#fff"
              strokeWidth={2}
              className="cursor-grab"
              animate={{ cx: p.x, cy: p.y }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onPointerDown={handlePointerDown(i)}
            />
          ))}

          {/* Nhãn */}
          <text x={10} y={20} fontSize={11} fill="#3b82f6" fontWeight={700}>
            Bạn: y = {userSlope.toFixed(2)}x + {userIntercept.toFixed(0)}
          </text>
          {showOptimal && (
            <text x={10} y={36} fontSize={11} fill="#10b981" fontWeight={700}>
              Tối ưu: y = {optSlope.toFixed(2)}x + {optIntercept.toFixed(0)}
            </text>
          )}
        </svg>

        {/* Thanh trượt slope / intercept */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-foreground">Độ dốc (slope)</span>
              <span className="font-mono text-accent tabular-nums">
                {userSlope.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={userSlope}
              onChange={(e) => setUserSlope(parseFloat(e.target.value))}
              aria-label="Slope"
              className="w-full h-2 accent-accent"
            />
            <div className="flex justify-between text-[10px] text-tertiary">
              <span>−1 (giảm mạnh)</span>
              <span>0 (ngang)</span>
              <span>+1 (tăng mạnh)</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-foreground">Điểm chặn (intercept)</span>
              <span className="font-mono text-accent tabular-nums">
                {userIntercept.toFixed(0)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={320}
              step={1}
              value={userIntercept}
              onChange={(e) => setUserIntercept(parseFloat(e.target.value))}
              aria-label="Intercept"
              className="w-full h-2 accent-accent"
            />
            <div className="flex justify-between text-[10px] text-tertiary">
              <span>0 (trên cao)</span>
              <span>160 (giữa)</span>
              <span>320 (dưới đáy)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOptimal((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              showOptimal
                ? "bg-emerald-500 text-white"
                : "bg-card border border-border text-muted hover:text-foreground"
            }`}
          >
            <Wand2 size={12} />
            {showOptimal ? "Ẩn đường tối ưu" : "Hiện đường tối ưu"}
          </button>
          <button
            type="button"
            onClick={applyOptimal}
            disabled={!showOptimal}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground disabled:opacity-40"
          >
            Khớp bạn vào đường tối ưu
          </button>
          <button
            type="button"
            onClick={() => setShowErrors((v) => !v)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            {showErrors ? "Ẩn sai số" : "Hiện sai số"}
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            <RotateCcw size={11} />
            Đặt lại
          </button>
          <span className="ml-auto text-xs text-muted tabular-nums">{points.length} điểm</span>
        </div>

        {/* Thẻ so sánh MSE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border-2 border-blue-400/60 bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
              <Target size={16} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold">
                MSE của bạn
              </div>
              <div className="text-lg font-mono font-bold text-blue-800 dark:text-blue-200 tabular-nums">
                {userMSE.toFixed(1)}
              </div>
            </div>
          </div>
          <div
            className={`rounded-lg border-2 ${
              showOptimal
                ? "border-emerald-400/60 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-border bg-surface/40 opacity-60"
            } p-3 flex items-center gap-3`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                showOptimal ? "bg-emerald-500" : "bg-border"
              } text-white`}
            >
              <TrendingDown size={16} />
            </div>
            <div>
              <div
                className={`text-[10px] uppercase tracking-wide font-semibold ${
                  showOptimal
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-tertiary"
                }`}
              >
                MSE tối ưu (máy)
              </div>
              <div
                className={`text-lg font-mono font-bold tabular-nums ${
                  showOptimal
                    ? "text-emerald-800 dark:text-emerald-200"
                    : "text-muted"
                }`}
              >
                {showOptimal ? optMSE.toFixed(1) : "—"}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {comparison && (
            <motion.div
              key={comparison.tone}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-lg border p-3 text-xs leading-relaxed ${
                comparison.tone === "match"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-700"
                  : "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-700"
              }`}
            >
              {comparison.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DEEPEN — StepReveal: tính residual, rồi tổng SSR, rồi tìm min
   ═══════════════════════════════════════════════════════════════════ */

function ResidualBreakdown() {
  // Một điểm ví dụ: x = 100, y_thực = 235. Giả sử đường bạn có y = −0.5x + 300
  // → y_dự đoán = 250. Residual = 235 − 250 = −15.
  const examplePoints: Pt[] = [
    { x: 50, y: 275 },
    { x: 100, y: 235 },
    { x: 150, y: 220 },
    { x: 200, y: 190 },
    { x: 270, y: 160 },
  ];
  const demoSlope = -0.5;
  const demoIntercept = 300;

  const predictions = examplePoints.map((p) => ({
    ...p,
    yHat: demoSlope * p.x + demoIntercept,
  }));
  const residuals = predictions.map((p) => p.y - p.yHat);
  const sumSquared = residuals.reduce((s, r) => s + r * r, 0);

  return (
    <StepReveal
      labels={[
        "Bước 1: Sai số một điểm",
        "Bước 2: Bình phương tất cả sai số",
        "Bước 3: Tìm đường cho tổng nhỏ nhất",
      ]}
    >
      {[
        <div key="step1" className="rounded-lg border border-border bg-surface/60 p-4 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Lấy một điểm cụ thể: <strong>x = 100</strong>, giá trị thực{" "}
            <strong>y = 235</strong>. Đường thẳng giả định y = −0.5·x + 300 dự đoán{" "}
            <strong>ŷ = 250</strong>. <em>Sai số</em> (residual) = y − ŷ = 235 − 250 ={" "}
            <strong className="text-rose-500">−15</strong>. Dấu âm nghĩa là đường dự đoán
            cao hơn giá trị thực.
          </p>
          <svg viewBox="0 0 320 180" className="w-full max-w-sm mx-auto">
            <line x1={20} y1={160} x2={300} y2={160} stroke="currentColor" className="text-muted" strokeWidth={1} />
            <line x1={20} y1={20} x2={20} y2={160} stroke="currentColor" className="text-muted" strokeWidth={1} />
            {/* Đường thẳng */}
            <line x1={20} y1={40} x2={300} y2={120} stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 4" />
            {/* Điểm thực */}
            <circle cx={130} cy={90} r={7} fill="#f97316" stroke="#fff" strokeWidth={2} />
            <text x={140} y={85} fontSize={11} fill="currentColor" className="text-foreground" fontWeight={600}>
              thực y = 235
            </text>
            {/* Điểm dự đoán trên đường */}
            <circle cx={130} cy={68} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
            <text x={140} y={65} fontSize={11} fill="#3b82f6" fontWeight={600}>
              dự đoán ŷ = 250
            </text>
            {/* Residual line */}
            <line x1={130} y1={68} x2={130} y2={90} stroke="#ef4444" strokeWidth={2.5} />
            <text x={85} y={82} fontSize={11} fill="#ef4444" fontWeight={700}>
              −15
            </text>
          </svg>
        </div>,
        <div key="step2" className="rounded-lg border border-border bg-surface/60 p-4 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Có nhiều điểm thì làm sao? Bình phương từng sai số rồi cộng lại. Bình phương giúp hai
            việc: (1) bỏ dấu âm — âm hay dương đều đáng lo như nhau; (2){" "}
            <em>phạt nặng các sai số lớn</em> — một sai số gấp đôi thì đóng góp gấp bốn.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-left bg-surface">
                  <th className="py-1.5 px-2 border-b border-border">x</th>
                  <th className="py-1.5 px-2 border-b border-border">y thực</th>
                  <th className="py-1.5 px-2 border-b border-border">ŷ dự đoán</th>
                  <th className="py-1.5 px-2 border-b border-border">Sai số</th>
                  <th className="py-1.5 px-2 border-b border-border">Bình phương</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-mono tabular-nums">{p.x}</td>
                    <td className="py-1.5 px-2 font-mono tabular-nums">{p.y.toFixed(0)}</td>
                    <td className="py-1.5 px-2 font-mono tabular-nums text-blue-600 dark:text-blue-400">
                      {p.yHat.toFixed(0)}
                    </td>
                    <td className="py-1.5 px-2 font-mono tabular-nums text-rose-500">
                      {residuals[i].toFixed(0)}
                    </td>
                    <td className="py-1.5 px-2 font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                      {(residuals[i] ** 2).toFixed(0)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-amber-50 dark:bg-amber-900/20">
                  <td colSpan={4} className="py-1.5 px-2 font-semibold text-right">
                    Tổng bình phương sai số (SSR):
                  </td>
                  <td className="py-1.5 px-2 font-mono tabular-nums font-bold text-amber-700 dark:text-amber-300">
                    {sumSquared.toFixed(0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>,
        <div key="step3" className="rounded-lg border border-border bg-surface/60 p-4 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Mỗi đường thẳng khác nhau cho một tổng bình phương sai số khác nhau.{" "}
            <strong>Hồi quy tuyến tính</strong> chính là <em>đi tìm một đường thẳng duy nhất</em>{" "}
            mà tổng ấy nhỏ nhất. Toán giúp chúng ta giải bài này mà không phải thử từng đường.
          </p>
          <svg viewBox="0 0 320 180" className="w-full max-w-sm mx-auto">
            {/* Parabol mô phỏng loss function */}
            <path
              d="M 20 160 Q 160 −40, 300 160"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={2}
            />
            <line x1={20} y1={160} x2={300} y2={160} stroke="currentColor" className="text-muted" strokeWidth={1} />
            {/* Điểm cực tiểu */}
            <circle cx={160} cy={40} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />
            <text x={160} y={28} textAnchor="middle" fontSize={11} fill="#10b981" fontWeight={700}>
              đây! min
            </text>
            <text x={160} y={175} textAnchor="middle" fontSize={11} fill="currentColor" className="text-muted">
              độ dốc đường thẳng
            </text>
            <text x={15} y={105} textAnchor="middle" fontSize={11} fill="currentColor" className="text-muted" transform="rotate(-90 15 105)">
              tổng sai số bình phương
            </text>
          </svg>
          <p className="text-xs text-muted leading-relaxed">
            Đồ thị hình parabol: trục ngang là các độ dốc có thể của đường thẳng, trục dọc là tổng
            sai số bình phương. Máy tìm đáy parabol ấy — chính là bộ (slope, intercept) tối ưu.
          </p>
        </div>,
      ]}
    </StepReveal>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function LinearRegressionTopic() {
  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn bán phở. Nhật ký cả tuần cho thấy: trời 35°C bán 80 tô, trời 25°C bán 120 tô, trời 18°C bán 150 tô. Ngày mai dự báo 30°C — bạn nấu bao nhiêu?"
          options={[
            "Khoảng 100 tô — nội suy giữa các mốc đã biết",
            "150 tô cho chắc, thừa thì bán sau",
            "Không đoán được — cần thêm dữ liệu",
            "Ngẫu nhiên, vì thời tiết không ảnh hưởng gì",
          ]}
          correct={0}
          explanation="Bạn vừa tự làm hồi quy tuyến tính trong đầu! Trong đầu bạn đã vẽ một đường nối các cặp (nhiệt độ, số tô) rồi chiếu 30°C lên đường đó. Hôm nay bạn sẽ chính thức 'thấy' cái đường ấy."
        >
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Hãy tưởng tượng bạn đang đứng trước một đám chấm dữ liệu bừa bộn trên giấy. Câu hỏi
            triệu đô: <strong>làm sao vẽ một đường thẳng &ldquo;hợp nhất&rdquo; đi qua tất cả?</strong>{" "}
            Bạn thử bằng mắt trước, rồi so với cách thuật toán giải.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Ẩn dụ">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Ruler size={18} className="text-accent" />
            Hồi quy tuyến tính = tìm quy luật &ldquo;mỗi lần tăng X thì Y thay đổi bao nhiêu&rdquo;
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đi ăn cưới, bạn để ý: quãng đường càng xa, tiền xăng càng nhiều. Mỗi km thêm bao nhiêu
            tiền? Đây là <strong>quy luật tuyến tính</strong> — khi một thứ tăng, thứ kia tăng (hoặc
            giảm) theo một nhịp cố định. Hồi quy tuyến tính là công cụ máy dùng để{" "}
            <em>tự học ra con số nhịp đó</em> từ dữ liệu quan sát.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border-l-4 border-l-sky-400 bg-sky-50 dark:bg-sky-900/20 p-3 space-y-1">
              <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">Bia hơi Tạ Hiện</p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Nhiệt độ càng cao → bán càng chạy. Biến cảm giác thành một công thức đo được.
              </p>
            </div>
            <div className="rounded-xl border-l-4 border-l-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-1">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Phòng trọ HUST</p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Diện tích tăng → giá tăng. Máy học được &ldquo;mỗi m² đắt thêm bao tiền&rdquo;.
              </p>
            </div>
            <div className="rounded-xl border-l-4 border-l-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Điểm thi đại học</p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                Giờ học thêm tăng → điểm kỳ vọng tăng. Nhịp cụ thể là bao nhiêu? Hồi quy trả lời.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TRỰC QUAN HOÁ TƯƠNG TÁC ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <ScatterPlayground />
          <div className="mt-5">
            <Callout variant="insight" title="Điều quan trọng cần tự thấy">
              Chỉ có một bộ (slope, intercept) <strong>duy nhất</strong> làm MSE nhỏ nhất. Bạn có
              thể lầm tưởng mình đã chọn &ldquo;đường đẹp&rdquo;, nhưng khi bật đường tối ưu lên,
              máy thường tìm được đường khác cho MSE thấp hơn. Hoàn toàn bình thường — máy không
              giỏi hơn bạn, nó chỉ có thể tính chính xác hàng trăm lần mỗi giây.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          Hồi quy tuyến tính <strong>không phải phép màu</strong>. Nó chỉ là bài toán đơn giản:
          &ldquo;tìm cặp (slope, intercept) làm tổng bình phương sai số nhỏ nhất&rdquo;.
          <br />
          <br />
          Bạn có thể thử bằng tay cho 5 điểm. Máy làm được chuyện đó cho 5 <em>triệu</em> điểm trong
          tích tắc. Chấm hết.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — DEEPEN ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Đi sâu">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
          <Lightbulb size={18} className="text-accent" />
          Máy tìm đường tối ưu như thế nào? — 3 bước
        </h3>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Đừng lo công thức. Chỉ cần nắm ý tưởng: tính sai số từng điểm → bình phương rồi cộng lại
          → tìm đường làm tổng nhỏ nhất. Bấm <em>Tiếp tục</em> để xem từng bước.
        </p>
        <ResidualBreakdown />
      </LessonSection>

      {/* ━━━ BƯỚC 6 — CHALLENGE ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Sau khi fit, bạn nhận được MSE = 0 trên tập huấn luyện. Điều này có nghĩa là gì?"
          options={[
            "Đường hồi quy hoàn hảo với đúng tập dữ liệu huấn luyện — MỌI điểm nằm đúng trên đường",
            "Mô hình sai, không bao giờ đạt được như thế",
            "Chỉ có một cách — đó là đường thẳng bằng trục x",
            "MSE không thể bằng 0",
          ]}
          correct={0}
          explanation="MSE = 0 nghĩa là mỗi giá trị thực đều bằng giá trị dự đoán → mọi điểm nằm đúng trên đường. Nhưng đây cũng là dấu hiệu nguy hiểm trong thực tế: có thể bạn đang overfit (quá khớp với dữ liệu huấn luyện), và mô hình sẽ đoán tệ với dữ liệu mới."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Bạn fit đường hồi quy cho giá nhà: y = 0.04·(diện tích) + 0.2 (đơn vị tỷ VNĐ, m²). Một căn 100m² thực tế bán 5 tỷ. Sai số (residual) của điểm này?"
            options={[
              "+0.8 tỷ — mô hình đoán thấp hơn giá thực",
              "−0.8 tỷ — mô hình đoán cao hơn giá thực",
              "4.2 tỷ — đây chính là giá dự đoán",
              "Không tính được vì thiếu thông tin",
            ]}
            correct={0}
            explanation="ŷ = 0.04 × 100 + 0.2 = 4.2 tỷ. Residual = y − ŷ = 5 − 4.2 = +0.8 tỷ. Dương nghĩa là mô hình ước lượng thấp hơn giá thực. Nếu thấy nhiều residual cùng dương, quan hệ thực có thể không còn tuyến tính nữa — cần thử mô hình khác."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — EXPLAIN (tối đa 3 LaTeX) ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            <strong>Hồi quy tuyến tính</strong> tìm đường thẳng &ldquo;hợp nhất&rdquo; với dữ liệu
            bằng phương pháp <em>bình phương tối thiểu</em> (OLS — Ordinary Least Squares). Hãy đọc
            ba công thức sau theo kiểu &ldquo;tóm tắt bằng ký hiệu&rdquo; — phần giải thích nằm ngay
            dưới mỗi công thức, bằng tiếng Việt.
          </p>

          {/* Công thức 1 — phương trình đường thẳng */}
          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            1. Phương trình đường thẳng
          </h4>
          <LaTeX block>{"\\hat{y} = w_1 \\cdot x + w_0"}</LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc: <em>giá trị dự đoán bằng độ dốc nhân với đầu vào cộng điểm chặn</em>. w₁ nói{" "}
            &ldquo;x tăng 1 đơn vị thì ŷ tăng bao nhiêu&rdquo;. w₀ là giá trị ŷ khi x = 0 — nơi đường
            cắt trục y. Toàn bộ bài toán hồi quy là tìm đúng cặp (w₁, w₀).
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <p className="text-xs text-muted mb-2 font-semibold uppercase tracking-wide">
              Hình hoá bằng đường đồ thị
            </p>
            <svg viewBox="0 0 320 180" className="w-full max-w-sm mx-auto">
              <line x1={30} y1={150} x2={300} y2={150} stroke="currentColor" className="text-muted" strokeWidth={1} />
              <line x1={30} y1={20} x2={30} y2={150} stroke="currentColor" className="text-muted" strokeWidth={1} />
              <line x1={30} y1={120} x2={300} y2={40} stroke="#3b82f6" strokeWidth={2.5} />
              {/* điểm chặn */}
              <circle cx={30} cy={120} r={4} fill="#10b981" />
              <text x={36} y={135} fontSize={11} fill="#10b981" fontWeight={600}>
                w₀ (điểm chặn)
              </text>
              {/* độ dốc */}
              <line x1={150} y1={90} x2={200} y2={90} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" />
              <line x1={200} y1={90} x2={200} y2={70} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" />
              <text x={210} y={85} fontSize={11} fill="#f59e0b" fontWeight={600}>
                w₁ = độ dốc
              </text>
              <text x={120} y={20} fontSize={11} fill="#3b82f6" fontWeight={600}>
                ŷ = w₁·x + w₀
              </text>
            </svg>
          </div>

          {/* Công thức 2 — MSE */}
          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            2. Thước đo chất lượng — MSE (Mean Squared Error)
          </h4>
          <LaTeX block>{"\\text{MSE} = \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2"}</LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc: <em>với mỗi điểm, lấy sai số (thực − dự đoán), bình phương, rồi lấy trung bình
            toàn bộ</em>. Bình phương làm hai việc: bỏ dấu âm (sai trên hay sai dưới đều là sai) và
            phạt nặng các sai số lớn. MSE càng nhỏ, đường càng sát dữ liệu.
          </p>

          <Callout variant="tip" title="Vì sao KHÔNG dùng trung bình sai số thuần?">
            Vì các sai số âm và dương sẽ triệt tiêu lẫn nhau, cho ra kết quả gần 0 ngay cả khi
            đường rất tệ. Bình phương giữ mọi sai số dương để chúng cộng dồn lại đúng cách.
          </Callout>

          {/* Công thức 3 — OLS closed form */}
          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            3. Lời giải đóng — cách máy tìm (w₀, w₁) không cần đoán
          </h4>
          <LaTeX block>{"w_1 = \\frac{n\\sum x_i y_i - \\sum x_i \\sum y_i}{n\\sum x_i^2 - (\\sum x_i)^2}, \\quad w_0 = \\bar{y} - w_1 \\bar{x}"}</LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc: <em>nhìn qua cho biết có lời giải &ldquo;cắm cốc&rdquo;, không phải lo</em>. Đây
            chính là lý do bạn không phải thử hàng triệu đường — máy tính được (w₁, w₀) tối ưu
            bằng đúng hai phép tổng (Σxy, Σx, Σy, Σx²). Với dữ liệu hàng tỷ mẫu, người ta dùng{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink> thay vì công thức đóng,
            nhưng ý tưởng vẫn là: đi tìm đáy parabol của hàm MSE.
          </p>

          <Callout variant="insight" title="Tổng hợp trong một câu">
            Hồi quy tuyến tính = chọn đường ŷ = w₁·x + w₀ sao cho MSE (trung bình bình phương sai
            số) nhỏ nhất. Có công thức đóng cho trường hợp một biến, có gradient descent cho trường
            hợp triệu biến. Kết quả: một đường thẳng cho bạn nội suy và một cặp (w₁, w₀) để hiểu
            &ldquo;khi x tăng 1, y tăng bao nhiêu&rdquo;.
          </Callout>

          <CollapsibleDetail title="Vì sao đây là mô hình ML đầu tiên mọi người học?">
            <p className="text-sm leading-relaxed">
              Vì nó là mô hình <strong>đơn giản nhất</strong> đủ tốt cho rất nhiều bài toán thực.
              Nó huấn luyện cực nhanh (dưới 1 giây cho triệu mẫu), dễ giải thích (một con số cho
              mỗi feature), ổn định (cùng dữ liệu → cùng kết quả) và đạt chuẩn pháp lý cho các
              ngành cần minh bạch (ngân hàng, bảo hiểm, y tế).
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Có đáng để học sâu hơn không?">
            <p className="text-sm leading-relaxed">
              Rất đáng. Khi bạn học mạng nơ-ron sau này, tầng cuối cùng của mạng rất hay là một{" "}
              &ldquo;linear layer&rdquo; — chính là hồi quy tuyến tính trá hình. Nắm chắc ý tưởng
              này là nắm chắc nền tảng cho gần như mọi mô hình ML hiện đại.
            </p>
          </CollapsibleDetail>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Nhiều biến thì sao? — từ đường thẳng thành &ldquo;siêu phẳng&rdquo;
          </h4>
          <p className="leading-relaxed">
            Khi bạn có nhiều đặc trưng (diện tích, số phòng, tuổi nhà, hướng), công thức mở rộng
            thành: ŷ = w₀ + w₁·x₁ + w₂·x₂ + ... + w_d·x_d. Tưởng tượng thay vì một đường thẳng, bạn
            có một <em>mặt phẳng</em> nhiều chiều đi qua đám điểm dữ liệu. Ý tưởng không đổi: tìm bộ
            (w₀, w₁, ..., w_d) làm tổng bình phương sai số nhỏ nhất.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-2">
              Mỗi hệ số nói lên điều gì?
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                  w_diện_tích = 0.04
                </span>
                <span className="text-foreground/85">
                  Căn thêm 1 m² thì giá tăng 0.04 tỷ VNĐ (40 triệu), giữ các biến khác không đổi.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                  w_phòng_ngủ = 0.3
                </span>
                <span className="text-foreground/85">
                  Thêm một phòng ngủ thì giá tăng 0.3 tỷ, giữ các biến khác không đổi.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                  w_tuổi_nhà = −0.03
                </span>
                <span className="text-foreground/85">
                  Căn già thêm 1 năm thì giá giảm 0.03 tỷ. Dấu âm = &ldquo;tăng biến này, giảm biến kia&rdquo;.
                </span>
              </div>
            </div>
          </div>

          <Callout variant="warning" title="Một cái bẫy khi so hệ số">
            Nếu bạn thấy w_phòng_ngủ = 0.3 to hơn w_diện_tích = 0.04, đừng vội kết luận &ldquo;thêm
            phòng quan trọng hơn thêm diện tích&rdquo;. Các hệ số phụ thuộc{" "}
            <em>đơn vị đo</em> — phòng đếm bằng số nguyên, diện tích đếm bằng m². Để so công bằng,
            người ta chuẩn hoá (standardize) các biến về cùng thang trước khi so sánh.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Bốn bước kinh điển khi triển khai hồi quy
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-sm pl-1">
            <li className="leading-relaxed">
              <strong>Thu thập & làm sạch dữ liệu.</strong> Loại bỏ mẫu thiếu thông tin, kiểm tra
              ngoại lai rõ ràng. Dữ liệu bẩn = mô hình bẩn, bất kể thuật toán giỏi đến đâu.
            </li>
            <li className="leading-relaxed">
              <strong>Chia tập huấn luyện &amp; kiểm tra (train / test).</strong> Thường 70 / 30
              hoặc 80 / 20. Tập kiểm tra không được dùng để huấn luyện, chỉ dùng để đo mô hình sẽ
              hoạt động thế nào với dữ liệu thật sau này.
            </li>
            <li className="leading-relaxed">
              <strong>Fit mô hình trên tập huấn luyện.</strong> Máy tính (w₀, w₁, ..., w_d) tối ưu
              bằng công thức đóng hoặc gradient descent.
            </li>
            <li className="leading-relaxed">
              <strong>Đánh giá trên tập kiểm tra.</strong> Nếu MSE trên train rất nhỏ mà trên test
              lại lớn — dấu hiệu overfitting: mô hình đã học thuộc thay vì học quy luật.
            </li>
          </ol>

          <Callout variant="tip" title="Vì sao hồi quy tuyến tính luôn là 'baseline'">
            Dù bạn định dùng mô hình phức tạp nào (random forest, mạng nơ-ron...), người ta vẫn{" "}
            <strong>luôn fit hồi quy tuyến tính trước</strong>. Nó cho bạn một &ldquo;đường mốc&rdquo;
            (baseline): nếu mô hình phức tạp không vượt baseline bao nhiêu, có thể bài toán đơn giản
            hơn bạn tưởng, và việc tốn GPU để chạy mô hình phức tạp là lãng phí.
          </Callout>

          <CollapsibleDetail title="Regularization — khi hồi quy cần 'dây cương'">
            <p className="text-sm leading-relaxed mb-2">
              Khi có nhiều biến mà dữ liệu ít, hồi quy dễ overfit. Hai mở rộng quan trọng là{" "}
              <strong>Ridge</strong> (thêm phạt L2: tổng bình phương các hệ số không được quá lớn)
              và <strong>Lasso</strong> (thêm phạt L1: một số hệ số bị ép về 0, tự động chọn biến
              quan trọng).
            </p>
            <p className="text-sm leading-relaxed">
              Ý tưởng chung: không chỉ yêu cầu MSE nhỏ, mà còn yêu cầu mô hình &ldquo;đơn giản&rdquo;.
              Đơn giản đồng nghĩa khái quát tốt hơn với dữ liệu mới. Xem{" "}
              <TopicLink slug="overfitting-underfitting">overfitting &amp; underfitting</TopicLink>
              {" "}để đi sâu.
            </p>
          </CollapsibleDetail>

          <p className="leading-relaxed mt-4">
            Hồi quy tuyến tính cũng có hạn chế: nó chỉ vẽ được <em>đường thẳng</em>. Nếu dữ liệu
            thực sự có dạng cong, bạn cần{" "}
            <TopicLink slug="polynomial-regression">hồi quy đa thức</TopicLink>. Nếu đầu ra là xác
            suất 0–1, bạn cần{" "}
            <TopicLink slug="logistic-regression">hồi quy logistic</TopicLink>. Nếu có quá nhiều
            biến, người ta thêm regularization để tránh overfit.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt & kiểm tra">
        <MiniSummary
          title="5 điều cần nhớ về hồi quy tuyến tính"
          points={[
            "Mục tiêu: tìm đường thẳng ŷ = w₁·x + w₀ khớp nhất với dữ liệu.",
            "Thước đo: MSE — trung bình bình phương sai số. Nhỏ hơn = đường sát hơn.",
            "Có công thức đóng: máy tính (w₁, w₀) tối ưu ngay lập tức với dữ liệu nhỏ; với dữ liệu lớn dùng gradient descent.",
            "Nhạy cảm với ngoại lai: một điểm lệch xa có thể kéo cả đường.",
            "Chỉ bắt được quan hệ đường thẳng. Dữ liệu cong → cần mô hình khác.",
          ]}
        />

        <div className="mt-6">
          <Callout variant="tip" title="Bài ứng dụng liên quan">
            Muốn xem hồi quy tuyến tính giải bài toán định giá nhà ở Việt Nam? Đọc tiếp:{" "}
            <TopicLink slug="linear-regression-in-housing">
              Hồi quy tuyến tính trong giá nhà
            </TopicLink>{" "}
            — nơi bạn kéo thanh diện tích, số phòng, vùng và thấy giá cập nhật theo công thức vừa
            học.
          </Callout>
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-muted">
          <Sparkles size={12} />
          <span>Bạn đã hoàn thành bài. Trước khi chuyển, kiểm tra nhanh hiểu biết của mình.</span>
          <ArrowRight size={12} />
        </div>

        <div className="mt-4">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
