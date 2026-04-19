"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Gauge,
  Layers,
  RotateCcw,
  Lightbulb,
  Flame,
  Snowflake,
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
  TabView,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "loss-functions",
  title: "Loss Functions",
  titleVi: "Hàm mất mát — Điểm số của mô hình",
  description:
    "Loss là 'điểm số' của mô hình — càng thấp càng tốt. Chọn sai loss đồng nghĩa mô hình học sai mục tiêu. Kéo điểm dự đoán và thấy MSE, MAE, cross-entropy phản ứng rất khác nhau.",
  category: "neural-fundamentals",
  tags: ["training", "optimization", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: [
    "gradient-descent",
    "backpropagation",
    "forward-propagation",
  ],
  vizType: "interactive",
};

/* ══════════════════════════════════════════════════════════════════
   HELPERS — CÁC HÀM MẤT MÁT CƠ BẢN
   ══════════════════════════════════════════════════════════════════ */

type LossKey = "mse" | "mae" | "huber" | "ce";

interface Point {
  id: number;
  x: number;
  actual: number;
  predicted: number;
}

function mseSample(predicted: number, actual: number): number {
  return (predicted - actual) ** 2;
}

function maeSample(predicted: number, actual: number): number {
  return Math.abs(predicted - actual);
}

function huberSample(predicted: number, actual: number, delta = 30): number {
  const diff = Math.abs(predicted - actual);
  if (diff <= delta) return 0.5 * diff * diff;
  return delta * (diff - 0.5 * delta);
}

function bceSample(predicted: number, actual: number): number {
  const p = Math.max(0.001, Math.min(0.999, predicted));
  return -(actual * Math.log(p) + (1 - actual) * Math.log(1 - p));
}

function averageLoss(
  points: Point[],
  kind: LossKey,
  delta = 30,
): number {
  if (points.length === 0) return 0;
  const sum = points.reduce((acc, p) => {
    if (kind === "mse") return acc + mseSample(p.predicted, p.actual);
    if (kind === "mae") return acc + maeSample(p.predicted, p.actual);
    if (kind === "huber") return acc + huberSample(p.predicted, p.actual, delta);
    return acc + mseSample(p.predicted, p.actual);
  }, 0);
  return sum / points.length;
}

/* ══════════════════════════════════════════════════════════════════
   DỮ LIỆU MẶC ĐỊNH — 7 điểm (giá nhà / nhiệt độ tuỳ vocab)
   ══════════════════════════════════════════════════════════════════ */

const INITIAL_POINTS: Point[] = [
  { id: 0, x: 60, actual: 210, predicted: 200 },
  { id: 1, x: 120, actual: 185, predicted: 180 },
  { id: 2, x: 180, actual: 170, predicted: 165 },
  { id: 3, x: 240, actual: 155, predicted: 150 },
  { id: 4, x: 300, actual: 140, predicted: 135 },
  { id: 5, x: 360, actual: 120, predicted: 120 },
  { id: 6, x: 420, actual: 100, predicted: 105 },
];

const SVG_W = 480;
const SVG_H = 260;
const MARGIN = 30;

/* ══════════════════════════════════════════════════════════════════
   SCATTER — Kéo từng điểm "dự đoán" để thấy loss thay đổi
   ══════════════════════════════════════════════════════════════════ */

function LossScatter({ lossKey }: { lossKey: LossKey }) {
  const [points, setPoints] = useState<Point[]>(INITIAL_POINTS);
  const [dragId, setDragId] = useState<number | null>(null);

  const perPointLoss = useMemo(() => {
    return points.map((p) => {
      if (lossKey === "mse") return mseSample(p.predicted, p.actual);
      if (lossKey === "mae") return maeSample(p.predicted, p.actual);
      if (lossKey === "huber") return huberSample(p.predicted, p.actual);
      return mseSample(p.predicted, p.actual);
    });
  }, [points, lossKey]);

  const totalLoss = useMemo(
    () => averageLoss(points, lossKey),
    [points, lossKey],
  );

  const maxPerPoint = Math.max(...perPointLoss, 1);

  const handlePointerDown = (id: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragId(id);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (dragId === null) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const y = Math.max(
        MARGIN,
        Math.min(
          SVG_H - MARGIN,
          (e.clientY - rect.top) * (SVG_H / rect.height),
        ),
      );
      setPoints((prev) =>
        prev.map((p) => (p.id === dragId ? { ...p, predicted: y } : p)),
      );
    },
    [dragId],
  );

  const handlePointerUp = useCallback(() => setDragId(null), []);

  const resetAll = useCallback(() => {
    setPoints(INITIAL_POINTS);
  }, []);

  const addOutlier = useCallback(() => {
    setPoints((prev) => {
      const copy = prev.map((p) => ({ ...p }));
      copy[3] = { ...copy[3], actual: 30 };
      return copy;
    });
  }, []);

  const lossLabel =
    lossKey === "mse"
      ? "MSE (bình phương trung bình)"
      : lossKey === "mae"
        ? "MAE (trị tuyệt đối trung bình)"
        : "Huber (hỗn hợp)";

  const lossColor =
    lossKey === "mse"
      ? "#3b82f6"
      : lossKey === "mae"
        ? "#22c55e"
        : "#8b5cf6";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted leading-relaxed">
        Mỗi chấm cam là <strong>giá trị thực</strong>. Mỗi chấm xanh là{" "}
        <strong>dự đoán của mô hình</strong>.{" "}
        <em>Kéo chấm xanh lên xuống</em> để thấy từng loại hàm mất mát &ldquo;la&rdquo; to
        nhỏ khác nhau.
      </p>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full cursor-crosshair rounded-lg border border-border bg-background touch-none"
          role="img"
          aria-label={`Biểu đồ loss với ${points.length} điểm. Tổng ${lossLabel}: ${totalLoss.toFixed(1)}.`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Lưới ngang */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = MARGIN + frac * (SVG_H - 2 * MARGIN);
            return (
              <line
                key={`gy-${frac}`}
                x1={MARGIN}
                y1={y}
                x2={SVG_W - MARGIN}
                y2={y}
                stroke="var(--border)"
                strokeWidth={0.5}
                opacity={0.5}
                strokeDasharray="3,3"
              />
            );
          })}

          {/* Thanh lỗi nối giá trị thực với dự đoán */}
          {points.map((p, idx) => {
            const contribution = perPointLoss[idx] / maxPerPoint;
            const strokeW = 1 + contribution * 4;
            return (
              <motion.line
                key={`err-${p.id}`}
                x1={p.x}
                y1={p.actual}
                x2={p.x}
                y2={p.predicted}
                stroke={lossColor}
                strokeWidth={strokeW}
                opacity={0.45}
                animate={{ y2: p.predicted }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
              />
            );
          })}

          {/* Giá trị thực — chấm cam */}
          {points.map((p) => (
            <circle
              key={`actual-${p.id}`}
              cx={p.x}
              cy={p.actual}
              r={6}
              fill="#f97316"
              stroke="#fff"
              strokeWidth={2}
            />
          ))}

          {/* Dự đoán — chấm màu theo loss, có thể kéo */}
          {points.map((p, idx) => {
            const contribution = perPointLoss[idx] / maxPerPoint;
            const radius = 6 + contribution * 3;
            return (
              <motion.circle
                key={`pred-${p.id}`}
                cx={p.x}
                cy={p.predicted}
                r={radius}
                fill={lossColor}
                stroke="#fff"
                strokeWidth={2}
                className="cursor-grab"
                animate={{ cy: p.predicted }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                onPointerDown={handlePointerDown(p.id)}
              />
            );
          })}

          {/* Chú thích */}
          <g>
            <circle cx={40} cy={20} r={5} fill="#f97316" />
            <text
              x={52}
              y={24}
              fontSize={10}
              fill="var(--text-primary)"
              fontWeight={600}
            >
              Thực tế
            </text>
            <circle cx={120} cy={20} r={5} fill={lossColor} />
            <text
              x={132}
              y={24}
              fontSize={10}
              fill="var(--text-primary)"
              fontWeight={600}
            >
              Dự đoán (kéo được)
            </text>
          </g>
        </svg>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: lossColor + "22",
              color: lossColor,
            }}
          >
            {lossLabel}: {totalLoss.toFixed(1)}
          </div>
          <button
            type="button"
            onClick={addOutlier}
            className="flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-700 px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40"
          >
            <AlertTriangle size={11} />
            Đẩy một điểm thành ngoại lai
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            <RotateCcw size={11} />
            Đặt lại
          </button>
          <span className="ml-auto text-xs text-muted tabular-nums">
            {points.length} điểm
          </span>
        </div>

        {/* Thanh đóng góp từng điểm */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-tertiary mb-2">
            Mỗi điểm đóng góp bao nhiêu vào tổng loss?
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {perPointLoss.map((loss, i) => {
              const height = Math.min(1, loss / maxPerPoint);
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1"
                  title={`Điểm ${i + 1}: đóng góp ${loss.toFixed(1)}`}
                >
                  <div className="relative h-14 w-full rounded-sm bg-surface overflow-hidden">
                    <motion.div
                      className="absolute bottom-0 left-0 right-0"
                      style={{ backgroundColor: lossColor }}
                      animate={{ height: `${Math.max(4, height * 100)}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 160,
                        damping: 22,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-tertiary tabular-nums">
                    #{i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BCE VISUAL — trục xác suất dự đoán, nhãn thực y = 0 hoặc y = 1
   ══════════════════════════════════════════════════════════════════ */

function CrossEntropyExplorer() {
  const [prediction, setPrediction] = useState(0.7);
  const [target, setTarget] = useState<0 | 1>(1);

  const currentLoss = bceSample(prediction, target);

  const curve = useMemo(() => {
    const pts: string[] = [];
    const width = 360;
    const height = 160;
    for (let i = 1; i < 100; i++) {
      const p = i / 100;
      const l = bceSample(p, target);
      const cappedLoss = Math.min(l, 4.6);
      const x = 20 + ((p - 0.005) / 0.99) * width;
      const y = 20 + (1 - cappedLoss / 4.6) * height;
      pts.push(`${x},${y}`);
    }
    return pts.join(" ");
  }, [target]);

  const markerX = 20 + prediction * 360;
  const markerY =
    20 + (1 - Math.min(currentLoss, 4.6) / 4.6) * 160;

  const tone =
    currentLoss < 0.3
      ? { label: "Loss rất thấp — dự đoán tốt", color: "#10b981" }
      : currentLoss < 1.2
        ? { label: "Loss vừa — còn phải học thêm", color: "#f59e0b" }
        : { label: "Loss rất cao — phạt nặng vì tự tin sai", color: "#ef4444" };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted leading-relaxed">
        Trong phân loại, mô hình không đoán một con số, mà đoán một{" "}
        <strong>xác suất</strong> (ví dụ &ldquo;email này là spam với xác suất
        0.82&rdquo;). Cross-Entropy phạt <em>rất nặng</em> khi mô hình tự tin nhưng
        sai. Hãy kéo xác suất dự đoán và đảo nhãn thực để cảm nhận.
      </p>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {/* Toggle nhãn thực */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-tertiary uppercase tracking-wide">
            Nhãn thực (y)
          </span>
          {([1, 0] as const).map((t) => {
            const active = t === target;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTarget(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border ${
                  active
                    ? "bg-accent text-white border-transparent"
                    : "border-border bg-card text-muted hover:text-foreground"
                }`}
              >
                {t === 1 ? "y = 1 — là spam" : "y = 0 — không phải spam"}
              </button>
            );
          })}
        </div>

        {/* Biểu đồ */}
        <svg viewBox="0 0 400 200" className="w-full">
          {/* Trục */}
          <line
            x1={20}
            y1={180}
            x2={380}
            y2={180}
            stroke="var(--border)"
            strokeWidth={1}
          />
          <line
            x1={20}
            y1={20}
            x2={20}
            y2={180}
            stroke="var(--border)"
            strokeWidth={1}
          />
          {/* Lưới */}
          {[0.25, 0.5, 0.75].map((frac) => {
            const y = 20 + (1 - frac) * 160;
            return (
              <line
                key={`g-${frac}`}
                x1={20}
                y1={y}
                x2={380}
                y2={y}
                stroke="var(--border)"
                strokeWidth={0.5}
                strokeDasharray="3,3"
                opacity={0.5}
              />
            );
          })}

          {/* Đường cong loss */}
          <polyline
            points={curve}
            fill="none"
            stroke={tone.color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Con trỏ dự đoán */}
          <motion.line
            x1={markerX}
            y1={20}
            x2={markerX}
            y2={180}
            stroke={tone.color}
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.5}
            animate={{ x1: markerX, x2: markerX }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
          />
          <motion.circle
            cx={markerX}
            cy={markerY}
            r={6}
            fill={tone.color}
            stroke="#fff"
            strokeWidth={2}
            animate={{ cx: markerX, cy: markerY }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
          />

          {/* Nhãn trục */}
          <text
            x={200}
            y={196}
            fontSize={10}
            fill="var(--text-secondary)"
            textAnchor="middle"
          >
            Xác suất dự đoán (ŷ): 0 ← → 1
          </text>
          <text
            x={14}
            y={100}
            fontSize={10}
            fill="var(--text-secondary)"
            textAnchor="middle"
            transform="rotate(-90 14 100)"
          >
            Cross-Entropy
          </text>

          {/* Nhãn giá trị hiện tại */}
          <text
            x={markerX}
            y={16}
            fontSize={10}
            fill={tone.color}
            textAnchor="middle"
            fontWeight={700}
          >
            ŷ = {prediction.toFixed(2)} · loss = {currentLoss.toFixed(2)}
          </text>
        </svg>

        {/* Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-foreground">
              Xác suất dự đoán ŷ
            </span>
            <span
              className="font-mono tabular-nums px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: tone.color + "22",
                color: tone.color,
              }}
            >
              {prediction.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.01}
            max={0.99}
            step={0.01}
            value={prediction}
            onChange={(e) => setPrediction(parseFloat(e.target.value))}
            aria-label="Xác suất dự đoán"
            className="w-full h-2 accent-accent"
          />
          <div className="flex justify-between text-[10px] text-tertiary mt-0.5">
            <span>gần 0 — chắc không spam</span>
            <span>0.5 — không chắc</span>
            <span>gần 1 — chắc là spam</span>
          </div>
          <p
            className="mt-2 text-xs italic text-center"
            style={{ color: tone.color }}
          >
            {tone.label}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   QUIZ
   ══════════════════════════════════════════════════════════════════ */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Mô hình dự đoán xác suất spam = 0.99 nhưng email thực tế KHÔNG phải spam (y = 0). Cross-Entropy sẽ thế nào?",
    options: [
      "Rất thấp — dự đoán gần 1 nên tốt",
      "Rất cao — mô hình &ldquo;tự tin sai&rdquo; nên CE phạt cực nặng",
      "Bằng 0 — CE chỉ xem đúng sai",
      "Âm — loss không bao giờ âm",
    ],
    correct: 1,
    explanation:
      "CE = −log(1 − 0.99) = −log(0.01) ≈ 4.6 — loss cực cao! Cross-Entropy phạt mô hình nặng nhất khi nó tự tin nhưng sai. Đây chính là cơ chế giúp CE hiệu quả hơn MSE trong phân loại.",
  },
  {
    question:
      "Dữ liệu giá nhà có vài căn biệt thự 100 tỷ (ngoại lai). Chọn MSE sẽ xảy ra gì?",
    options: [
      "Mô hình dự đoán chính xác hơn nhờ dữ liệu phong phú",
      "MSE phạt bình phương nên biệt thự 100 tỷ kéo cả đường fit bị lệch về phía outlier",
      "Không ảnh hưởng — MSE tự động bỏ qua outlier",
      "MSE biến mất khi có outlier",
    ],
    correct: 1,
    explanation:
      "MSE bình phương sai lệch: một điểm lệch 100 đơn vị đóng góp 10.000 vào loss, bóp méo cả mô hình. MAE hoặc Huber Loss (hỗn hợp MSE + MAE) robust hơn với outlier.",
  },
  {
    question:
      "Bài toán phân loại ảnh 10 loài động vật. Loss phù hợp nhất là gì?",
    options: [
      "Binary Cross-Entropy — vì có nhãn",
      "MSE — vì output là số",
      "Categorical Cross-Entropy (Softmax + CE) — cho phân loại nhiều lớp",
      "Hinge Loss — chỉ cho hồi quy",
    ],
    correct: 2,
    explanation:
      "Nhiều lớp cần Categorical Cross-Entropy kết hợp Softmax. Binary CE chỉ cho 2 lớp, MSE/MAE dùng cho hồi quy, Hinge thường dùng cho SVM (phân loại biên cứng), không phải hồi quy.",
  },
  {
    type: "fill-blank",
    question:
      "Cross-Entropy phân loại nhị phân: L = −[y · log(ŷ) + (1 − y) · log(1 − {blank})]. Số hạng này phạt khi y = 0 mà ŷ lại gần 1.",
    blanks: [{ answer: "ŷ", accept: ["y_hat", "pred", "p", "yhat"] }],
    explanation:
      "Khi y = 0, phần đầu biến mất, chỉ còn −log(1 − ŷ). Nếu ŷ → 0 (đúng) loss nhỏ; nếu ŷ → 1 (sai và tự tin) log(1 − ŷ) → −∞, loss bùng nổ. Đây là đặc trưng chính khiến CE &ldquo;la to&rdquo; khi mô hình chủ quan sai.",
  },
  {
    question:
      "Bạn đang huấn luyện mô hình xếp hạng (ranking) kết quả tìm kiếm. Loss nào phù hợp?",
    options: [
      "MSE — xếp hạng là dự đoán số",
      "Hinge Loss hoặc Pairwise Ranking Loss — phạt khi đôi cặp bị sắp sai thứ tự",
      "MAE — vì dữ liệu có outlier",
      "BCE — vì có nhãn 0/1",
    ],
    correct: 1,
    explanation:
      "Xếp hạng không cần giá trị dự đoán khớp con số thực, mà cần thứ tự đúng. Hinge Loss hoặc Pairwise Ranking phạt mỗi lần cặp (A, B) bị xếp sai thứ tự, phù hợp với bản chất bài toán.",
  },
  {
    question:
      "Loss function thể hiện điều gì cho thuật toán huấn luyện?",
    options: [
      "Tốc độ học của mô hình",
      "Số tham số của mô hình",
      "Điểm số &ldquo;mô hình đang sai bao nhiêu&rdquo;, để gradient biết hướng điều chỉnh",
      "Kích thước dữ liệu",
    ],
    correct: 2,
    explanation:
      "Loss là &ldquo;điểm số&rdquo; duy nhất mà gradient descent cần để biết phải giảm giá trị nào, theo hướng nào. Không có loss, thuật toán không có thước đo để cải thiện.",
  },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */

export default function LossFunctionsTopic() {
  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <PredictionGate
          question="Bạn bắn cung, mũi tên cách tâm 50 cm. Huấn luyện viên muốn bạn tiến bộ nhanh — nên phạt thế nào?"
          options={[
            "Phạt bằng khoảng cách: 50 điểm",
            "Phạt bằng bình phương khoảng cách: 2.500 điểm — càng xa, phạt càng nặng lên nhanh",
            "Phạt đúng 1 điểm nếu trượt, 0 nếu trúng",
            "Không phạt — chỉ khen khi trúng tâm",
          ]}
          correct={1}
          explanation="Phạt bình phương khoảng cách (MSE) khiến bạn ưu tiên sửa những cú bắn lệch xa trước — vì sai 50 cm bị 2.500 điểm, còn sai 5 cm chỉ 25 điểm. Đây chính là cách loss function 'nói chuyện' với mô hình: càng sai, càng đau, càng phải sửa."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            <strong>Loss</strong> là &ldquo;điểm số&rdquo; của mô hình — càng thấp càng tốt.
            Nhưng chọn sai loss đồng nghĩa mô hình sẽ học <em>sai mục tiêu</em>. Hôm nay
            bạn sẽ <strong>kéo từng điểm dự đoán</strong> và thấy MSE, MAE, Huber,
            Cross-Entropy phản ứng rất khác nhau cùng một dữ liệu.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — ẨN DỤ ━━━ */}
      <LessonSection step={2} totalSteps={8} label="Hiểu bằng hình ảnh">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Gauge size={20} className="text-accent" /> Loss giống &ldquo;kim la
            bàn&rdquo; trên đường học
          </h3>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Tưởng tượng mô hình đang đi tìm đáp án trong sương mù. Nó không nhìn
            thấy gì cả — chỉ nghe một <strong>tiếng la</strong> sau mỗi bước đi.
            Tiếng la đó là loss. Loss lớn = &ldquo;đi sai đường!&rdquo;. Loss nhỏ =
            &ldquo;đang đúng hướng&rdquo;. Gradient descent chỉ việc{" "}
            <em>đi theo tiếng la nhỏ dần</em>.
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Nhưng &ldquo;la&rdquo; có nhiều kiểu. Một giáo viên khó tính phạt 5 điểm
            cho mỗi lỗi. Một giáo viên gắt gao nhân đôi hình phạt khi bạn sai
            nặng. Một giáo viên công tâm ngó lơ vài outlier. Chọn{" "}
            <strong>kiểu giáo viên</strong> tức là chọn loss function.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Target size={16} />
                <span className="text-sm font-semibold">MSE — Hồi quy</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Phạt bình phương. Sai 2 lần → đau 4 lần. Dành cho số liên tục: giá
                nhà, nhiệt độ, doanh thu.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck size={16} />
                <span className="text-sm font-semibold">MAE — Robust</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Phạt trị tuyệt đối. Sai 2 lần → đau 2 lần. Không bị outlier kéo
                lệch: thời gian giao hàng, ETA taxi.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Flame size={16} />
                <span className="text-sm font-semibold">CE — Phân loại</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Phạt theo logarit. Tự tin đúng → loss 0. Tự tin sai → loss bùng
                nổ. Dành cho spam/không spam, chó/mèo, nhãn ảnh.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — REVEAL / TƯƠNG TÁC CHÍNH ━━━ */}
      <LessonSection step={3} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <p className="text-sm text-muted mb-3 leading-relaxed">
            Bấm một tab để đổi loss function. Trong mỗi tab, <strong>kéo chấm
            xanh (dự đoán) lên xuống</strong> và quan sát: cùng một dữ liệu nhưng
            cách mỗi loss &ldquo;tính điểm&rdquo; khác hẳn nhau.
          </p>

          <TabView
            tabs={[
              {
                label: "MSE",
                content: (
                  <div className="space-y-4">
                    <Callout variant="info" title="MSE — Mean Squared Error">
                      Bình phương mỗi sai lệch rồi lấy trung bình. Hậu quả:{" "}
                      <strong>một điểm lệch xa đóng góp rất nhiều</strong> vào
                      tổng loss. Hãy kéo một chấm xanh ra thật xa chấm cam, xem
                      cột đóng góp đội lên như thế nào.
                    </Callout>
                    <LossScatter lossKey="mse" />
                    <Callout variant="warning" title="Điểm yếu">
                      Thử bấm &ldquo;Đẩy một điểm thành ngoại lai&rdquo;. Tổng MSE tăng đột
                      biến do điểm #4 đóng góp quá nhiều — mô hình huấn luyện
                      với MSE sẽ &ldquo;bị thu hút&rdquo; bởi điểm đó.
                    </Callout>
                  </div>
                ),
              },
              {
                label: "MAE",
                content: (
                  <div className="space-y-4">
                    <Callout variant="info" title="MAE — Mean Absolute Error">
                      Lấy trị tuyệt đối mỗi sai lệch, không bình phương.
                      Hậu quả: <strong>một điểm lệch xa không còn quá ghê gớm</strong>.
                      So với MSE, MAE &ldquo;bình tĩnh&rdquo; hơn với outlier.
                    </Callout>
                    <LossScatter lossKey="mae" />
                    <Callout variant="tip" title="Điểm mạnh">
                      Thử đẩy một điểm thành ngoại lai. Tổng MAE tăng nhẹ hơn
                      nhiều so với MSE — đây chính là lý do Shopee dùng MAE để
                      dự đoán thời gian giao hàng: vài gói bị kẹt không nên kéo
                      cả hệ thống đoán chậm cho mọi người.
                    </Callout>
                  </div>
                ),
              },
              {
                label: "Huber",
                content: (
                  <div className="space-y-4">
                    <Callout variant="info" title="Huber — Hỗn hợp MSE + MAE">
                      Khi sai lệch nhỏ (≤ δ) &rArr; hành xử như MSE (học nhanh,
                      mượt). Khi sai lệch lớn &rArr; chuyển sang MAE (không bị
                      outlier kéo). Huber là &ldquo;đứa con lai&rdquo; mạnh nhất của hai
                      loss hồi quy phổ biến.
                    </Callout>
                    <LossScatter lossKey="huber" />
                    <Callout variant="tip" title="Khi nào dùng Huber?">
                      Khi bạn muốn tốc độ học mượt của MSE ở vùng gần, nhưng cần
                      robust với outlier. Computer vision hay dùng Smooth L1
                      (một biến thể của Huber) để huấn luyện mô hình phát hiện
                      vật thể.
                    </Callout>
                  </div>
                ),
              },
              {
                label: "Cross-Entropy",
                content: (
                  <div className="space-y-4">
                    <Callout
                      variant="info"
                      title="Binary Cross-Entropy — Phạt tự tin sai"
                    >
                      Phân loại không đoán một con số, mà đoán một{" "}
                      <strong>xác suất</strong>. CE phạt theo logarit, nghĩa là
                      khi mô hình càng tự tin nhưng càng sai, loss càng bùng
                      nổ.
                    </Callout>
                    <CrossEntropyExplorer />
                    <Callout variant="tip" title="Vì sao không dùng MSE cho phân loại?">
                      MSE có đạo hàm rất nhỏ khi đầu ra sigmoid gần 0 hoặc 1 →
                      mô hình học chậm. CE có đạo hàm mạnh mẽ ở vùng đó → học
                      nhanh. Vì thế CE + Softmax là combo mặc định cho mọi bài
                      toán phân loại hiện đại.
                    </Callout>
                  </div>
                ),
              },
            ]}
          />

          <div className="mt-5">
            <Callout variant="insight" title="Tự rút ra">
              Cùng một bộ điểm, cùng cách dự đoán — nhưng <strong>loss khác
              nhau thì mô hình sẽ học theo hướng khác nhau</strong>. MSE dồn sức
              &ldquo;kéo&rdquo; các điểm xa, MAE &ldquo;bình đẳng&rdquo; với mọi điểm,
              Huber dung hoà, CE chỉ quan tâm xác suất đúng. Chọn loss = chọn
              ưu tiên của mô hình.
            </Callout>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — AHA ━━━ */}
      <LessonSection step={4} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Loss không phải &ldquo;một công thức toán&rdquo;. Nó là <strong>định nghĩa
            của cái đúng</strong> mà bạn dạy cho mô hình.
          </p>
          <p className="mt-3">
            Dạy bằng MSE — mô hình sẽ tránh mọi sai số lớn bằng mọi giá.
            Dạy bằng MAE — mô hình sẽ không hoảng lên vì vài outlier.
            Dạy bằng CE — mô hình sẽ rất thận trọng trước khi &ldquo;chắc chắn&rdquo;.
            Đổi loss = đổi <em>giáo viên</em>, mô hình sẽ ra <em>tính cách</em> khác.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — DEEPEN ━━━ */}
      <LessonSection step={5} totalSteps={8} label="Đi sâu">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
          <Layers size={18} className="text-accent" /> Khi nào dùng loss nào?
        </h3>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          Có một phản xạ đơn giản mà kỹ sư ML kinh nghiệm áp dụng hằng ngày.
          Bấm <em>Tiếp tục</em> để lần lượt xem bốn trường hợp quan trọng
          nhất.
        </p>

        <StepReveal
          labels={[
            "1. MSE — Hồi quy dữ liệu sạch",
            "2. Cross-Entropy — Phân loại",
            "3. Huber — Hồi quy có outlier",
            "4. Hinge — Phân loại biên cứng (SVM)",
          ]}
        >
          {[
            <div
              key="s1"
              className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-2"
            >
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                <Target size={14} /> MSE cho hồi quy dữ liệu &ldquo;đẹp&rdquo;
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Khi đầu ra là một con số liên tục (giá nhà, doanh thu, nhiệt
                độ) và dữ liệu không nhiều outlier. MSE cho gradient mượt,
                học nhanh, dễ tối ưu.
              </p>
              <p className="text-xs text-muted leading-relaxed">
                <strong>Ví dụ thực tế:</strong> mô hình dự đoán giá nhà trên
                Batdongsan.com, nhiệt độ ngày mai, lượng khách đặt bàn — dữ
                liệu &ldquo;sạch sẽ&rdquo;, không có siêu biệt thự làm rối.
              </p>
            </div>,
            <div
              key="s2"
              className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2"
            >
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-sm">
                <Flame size={14} /> Cross-Entropy cho phân loại
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Khi đầu ra là một nhãn (spam/không spam, chó/mèo/chim, hành
                động người dùng). CE ép mô hình học xác suất đúng, phạt nặng
                tự tin sai, phối hợp mượt với Softmax.
              </p>
              <p className="text-xs text-muted leading-relaxed">
                <strong>Ví dụ thực tế:</strong> Gmail chặn spam, YouTube nhận
                diện nội dung vi phạm, Tiki gợi ý nhãn ngành hàng cho sản
                phẩm mới.
              </p>
            </div>,
            <div
              key="s3"
              className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-4 space-y-2"
            >
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-semibold text-sm">
                <ShieldCheck size={14} /> Huber cho hồi quy có outlier
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Khi dữ liệu &ldquo;bẩn&rdquo;: có vài giá trị ngoại lệ rất lớn mà
                bạn không muốn bỏ đi nhưng cũng không muốn chúng chi phối mô
                hình. Huber hành xử như MSE ở vùng nhỏ (học nhanh) và MAE ở
                vùng lớn (robust).
              </p>
              <p className="text-xs text-muted leading-relaxed">
                <strong>Ví dụ thực tế:</strong> Grab dự đoán thời gian giao
                hàng — phần lớn đơn 20–40 phút nhưng thỉnh thoảng một đơn 3
                tiếng vì kẹt xe. Huber giữ mô hình ổn định.
              </p>
            </div>,
            <div
              key="s4"
              className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 space-y-2"
            >
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold text-sm">
                <Snowflake size={14} /> Hinge Loss cho SVM
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Khi bạn cần một <em>biên quyết định rõ ràng</em> giữa hai lớp
                — không cần xác suất, chỉ cần đúng/sai với khoảng cách an
                toàn. Hinge không phạt khi dự đoán đã &ldquo;đủ chắc chắn đúng&rdquo;,
                chỉ phạt khi quá gần biên hoặc sai.
              </p>
              <p className="text-xs text-muted leading-relaxed">
                <strong>Ví dụ thực tế:</strong> SVM phân loại ung thư từ xét
                nghiệm, nhận diện kí tự số viết tay MNIST thời trước deep
                learning. Hiện nay hinge ít dùng độc lập nhưng vẫn xuất hiện
                trong ranking và recommendation.
              </p>
            </div>,
          ]}
        </StepReveal>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — CHALLENGE ━━━ */}
      <LessonSection step={6} totalSteps={8} label="Thử thách">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          Trước khi đi tiếp, hãy thử ba tình huống thực tế. Chọn loss bạn
          thấy hợp nhất.
        </p>
        <div className="space-y-4">
          <InlineChallenge
            question="Bài toán: dự đoán giá căn hộ tại Hà Nội, dữ liệu có vài biệt thự 100 tỷ (ngoại lai). Chọn loss nào?"
            options={[
              "MSE — đơn giản, đủ dùng",
              "Binary Cross-Entropy — vì có nhãn giá",
              "Huber Loss — robust với ngoại lai, mượt với giá trị thường",
              "Hinge Loss — vì cần biên rõ ràng",
            ]}
            correct={2}
            explanation="Dữ liệu có ngoại lai: MSE sẽ bị kéo lệch, CE không phù hợp cho hồi quy, Hinge cho phân loại. Huber là lựa chọn chuẩn — hành xử như MSE ở vùng gần, MAE ở vùng xa, không để biệt thự 100 tỷ bóp méo mô hình."
          />
          <InlineChallenge
            question="Bài toán: phân loại ảnh chó / mèo (2 lớp). Chọn loss nào?"
            options={[
              "MSE — vì đơn giản",
              "Binary Cross-Entropy — chuẩn cho 2 lớp, có xác suất",
              "MAE — robust",
              "Categorical Cross-Entropy — cho nhiều lớp",
            ]}
            correct={1}
            explanation="2 lớp = Binary Cross-Entropy. CE phạt nặng khi mô hình tự tin sai, giúp sigmoid học nhanh. Nếu đổi sang 10 lớp (ảnh ImageNet chẳng hạn) thì mới dùng Categorical Cross-Entropy + Softmax."
          />
          <InlineChallenge
            question="Bài toán: hệ thống xếp hạng kết quả tìm kiếm Tiki — item nào liên quan hơn thì xếp trước. Chọn loss nào?"
            options={[
              "MSE giữa điểm dự đoán và điểm đánh giá",
              "Cross-Entropy cho từng item",
              "Pairwise Ranking Loss (Hinge-style) — phạt mỗi khi cặp (A, B) bị xếp sai thứ tự",
              "Huber Loss — dữ liệu có outlier",
            ]}
            correct={2}
            explanation="Xếp hạng không cần giá trị dự đoán khớp con số — chỉ cần THỨ TỰ đúng. Pairwise Ranking Loss phạt mỗi cặp bị sắp sai. Đây là loss chuẩn trong search, recommendation, ads ranking."
          />
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 7 — EXPLAIN (tối đa 3 LaTeX) ━━━ */}
      <LessonSection step={7} totalSteps={8} label="Giải thích">
        <ExplanationSection topicSlug={metadata.slug}>
          <p className="leading-relaxed">
            Ba công thức dưới đây là ba &ldquo;tiếng la&rdquo; phổ biến nhất. Mỗi
            công thức đi kèm một hình minh hoạ và một câu giải thích bằng tiếng
            Việt. Bạn không cần thuộc — chỉ cần{" "}
            <em>đọc được &ldquo;đại ý&rdquo;</em> để chọn loss đúng khi gặp bài toán
            mới.
          </p>

          {/* Công thức 1 — MSE */}
          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            1. MSE — Bình phương trung bình sai số
          </h4>
          <LaTeX block>
            {"\\text{MSE} = \\frac{1}{N} \\sum_{i=1}^{N} (y_i - \\hat{y}_i)^2"}
          </LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc: <em>với mỗi điểm, lấy sai số (thực − dự đoán), bình phương,
            rồi lấy trung bình</em>. Bình phương làm hai việc quan trọng: (1) bỏ
            dấu — sai trên hay sai dưới đều đáng lo; (2) phạt nặng sai số lớn.
            Nếu bạn đã học{" "}
            <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink>,
            đây chính là loss mà OLS tối thiểu hoá.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-2">
              Trực quan: bình phương biến sai số thành &ldquo;hình vuông&rdquo;
            </p>
            <svg viewBox="0 0 360 180" className="w-full max-w-md mx-auto">
              <line
                x1={20}
                y1={160}
                x2={340}
                y2={160}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <line
                x1={20}
                y1={20}
                x2={20}
                y2={160}
                stroke="var(--border)"
                strokeWidth={1}
              />
              {/* Đường thẳng (dự đoán) */}
              <line
                x1={20}
                y1={40}
                x2={340}
                y2={130}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="6,4"
              />
              {/* Các điểm thực + hình vuông sai số */}
              {[
                { x: 80, actualY: 90, predY: 57 },
                { x: 160, actualY: 110, predY: 80 },
                { x: 240, actualY: 95, predY: 102 },
              ].map((p, i) => {
                const err = Math.abs(p.actualY - p.predY);
                const yStart = Math.min(p.actualY, p.predY);
                return (
                  <g key={i}>
                    <rect
                      x={p.x}
                      y={yStart}
                      width={err}
                      height={err}
                      fill="#3b82f6"
                      opacity={0.18}
                    />
                    <circle
                      cx={p.x}
                      cy={p.actualY}
                      r={4}
                      fill="#f97316"
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={p.x}
                      cy={p.predY}
                      r={3}
                      fill="#3b82f6"
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  </g>
                );
              })}
              <text
                x={180}
                y={14}
                fontSize={10}
                fill="var(--text-secondary)"
                textAnchor="middle"
              >
                MSE = tổng diện tích các hình vuông / N
              </text>
            </svg>
          </div>

          {/* Công thức 2 — MAE */}
          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            2. MAE — Trị tuyệt đối trung bình sai số
          </h4>
          <LaTeX block>
            {"\\text{MAE} = \\frac{1}{N} \\sum_{i=1}^{N} |y_i - \\hat{y}_i|"}
          </LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc: <em>với mỗi điểm, lấy trị tuyệt đối sai số, rồi lấy trung
            bình</em>. Không có bình phương nên mỗi điểm đóng góp tỉ lệ thuận
            với sai lệch — không có &ldquo;hình vuông&rdquo; làm hình phạt bùng nổ. Vì
            thế MAE <strong>robust</strong> với ngoại lai.
          </p>

          <div className="rounded-xl border border-border bg-surface/40 p-4 my-3">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-2">
              Trực quan: MAE đo &ldquo;chiều dài&rdquo;, MSE đo &ldquo;diện tích&rdquo;
            </p>
            <svg viewBox="0 0 360 130" className="w-full max-w-md mx-auto">
              <line x1={20} y1={110} x2={340} y2={110} stroke="var(--border)" strokeWidth={1} />
              {/* MAE — bên trái: đoạn thẳng đậm */}
              <line x1={100} y1={30} x2={100} y2={110} stroke="#22c55e" strokeWidth={5} />
              <circle cx={100} cy={30} r={5} fill="#f97316" />
              <circle cx={100} cy={110} r={5} fill="#22c55e" />
              <text x={100} y={124} fontSize={11} fill="#22c55e" textAnchor="middle" fontWeight={600}>MAE = chiều dài</text>
              {/* MSE — bên phải: hình vuông */}
              <rect x={240} y={30} width={80} height={80} fill="#3b82f6" opacity={0.22} />
              <line x1={240} y1={30} x2={240} y2={110} stroke="#3b82f6" strokeWidth={2} />
              <circle cx={240} cy={30} r={5} fill="#f97316" />
              <circle cx={240} cy={110} r={5} fill="#3b82f6" />
              <text x={280} y={124} fontSize={11} fill="#3b82f6" textAnchor="middle" fontWeight={600}>MSE = diện tích</text>
            </svg>
          </div>

          {/* Công thức 3 — Cross-Entropy */}
          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">
            3. Binary Cross-Entropy — Phạt &ldquo;tự tin sai&rdquo;
          </h4>
          <LaTeX block>
            {"\\text{BCE} = -\\big[y \\log(\\hat{y}) + (1 - y) \\log(1 - \\hat{y})\\big]"}
          </LaTeX>
          <p className="text-sm text-foreground/85 leading-relaxed">
            Đọc: <em>nếu nhãn thực y = 1, loss = −log(ŷ). Nếu y = 0, loss =
            −log(1 − ŷ)</em>. Khi mô hình đoán đúng và tự tin (ŷ gần nhãn
            thực), −log(số gần 1) ≈ 0 → loss thấp. Khi mô hình đoán sai và tự
            tin (ŷ ngược với nhãn thực), −log(số gần 0) → ∞ → loss bùng nổ.
            Đây là cơ chế &ldquo;phạt tự tin sai&rdquo; mà MSE không có.
          </p>

          <Callout
            variant="tip"
            title="Vì sao CE dùng logarit mà không dùng (y − ŷ)²?"
          >
            Với xác suất gần biên (ŷ gần 0 hoặc 1), đạo hàm của MSE rất nhỏ —
            mô hình học chậm. Đạo hàm của CE khi đó vẫn mạnh → tín hiệu
            gradient rõ ràng → học nhanh. Nhờ vậy{" "}
            <strong>Softmax + Cross-Entropy</strong> trở thành tổ hợp chuẩn
            của mọi mạng phân loại hiện đại, từ ResNet đến GPT.
          </Callout>

          <Callout variant="warning" title="Bẫy hay gặp">
            MAE có đạo hàm không xác định tại 0 — thực tế hay dùng{" "}
            <em>Smooth L1</em> (một biến thể của Huber) thay thế. Cross-Entropy
            cần &ldquo;clamp&rdquo; ŷ tránh log(0) = −∞, nên các thư viện như PyTorch
            mặc định dùng{" "}
            <code className="bg-surface px-1.5 py-0.5 rounded text-xs font-mono">
              BCEWithLogitsLoss
            </code>{" "}
            gộp sigmoid + log tính ổn định.
          </Callout>

          <h4 className="text-sm font-semibold text-foreground mt-6 mb-2">
            Bảng so sánh nhanh
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left py-2 px-3 font-semibold text-foreground">
                    Loss
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">
                    Bài toán
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">
                    Điểm mạnh
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">
                    Ví dụ Việt Nam
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/85">
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-blue-500">MSE</td>
                  <td className="py-2 px-3">Hồi quy</td>
                  <td className="py-2 px-3">
                    Phạt nặng sai số lớn, học nhanh
                  </td>
                  <td className="py-2 px-3">
                    Dự đoán giá vàng, nhiệt độ Đà Lạt
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-emerald-500">
                    MAE
                  </td>
                  <td className="py-2 px-3">Hồi quy có outlier</td>
                  <td className="py-2 px-3">Robust, không bị kéo lệch</td>
                  <td className="py-2 px-3">
                    Shopee ước lượng thời gian giao hàng
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-violet-500">
                    Huber
                  </td>
                  <td className="py-2 px-3">Hồi quy cân bằng</td>
                  <td className="py-2 px-3">MSE + MAE, mượt và robust</td>
                  <td className="py-2 px-3">
                    Grab dự đoán ETA chuyến xe
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-amber-500">
                    Binary CE
                  </td>
                  <td className="py-2 px-3">Phân loại 2 lớp</td>
                  <td className="py-2 px-3">Phạt nặng tự tin sai</td>
                  <td className="py-2 px-3">
                    Gmail chặn thư rác tiếng Việt
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-purple-500">
                    Categorical CE
                  </td>
                  <td className="py-2 px-3">Phân loại N lớp</td>
                  <td className="py-2 px-3">Softmax + log phối hợp mượt</td>
                  <td className="py-2 px-3">
                    Zalo gán nhãn chủ đề bài viết
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-rose-500">
                    Hinge / Pairwise
                  </td>
                  <td className="py-2 px-3">SVM, Ranking</td>
                  <td className="py-2 px-3">
                    Biên cứng, tập trung vào mẫu khó
                  </td>
                  <td className="py-2 px-3">
                    Tiki xếp hạng kết quả tìm kiếm
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout
            variant="insight"
            title="Một câu để gói cả bài"
          >
            Loss là <strong>mục tiêu duy nhất</strong> mà thuật toán huấn luyện
            được phép nhìn thấy. Đổi loss = đổi mục tiêu. Chọn loss đúng quan
            trọng hơn chọn mô hình đúng — sai loss thì mô hình càng mạnh càng
            đi sai xa.
          </Callout>

          <CollapsibleDetail title="Tại sao không gộp vài loss lại rồi cộng?">
            <p className="text-sm leading-relaxed">
              Thực tế người ta <strong>có</strong> gộp, gọi là{" "}
              <em>multi-task loss</em>. Ví dụ: một mô hình tự lái xe vừa học
              phân loại biển báo (CE) vừa học ước lượng khoảng cách (MSE).
              Loss tổng = α · CE + β · MSE, với α và β là hệ số cân bằng hai
              mục tiêu. Tuy nhiên cân bằng này rất nhạy — chọn α/β sai thì mô
              hình sẽ ưu tiên một mục tiêu và bỏ rơi mục tiêu kia. Nên mới có
              cả một hướng nghiên cứu &ldquo;loss balancing&rdquo; riêng.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Loss vs. Metric — khác nhau thế nào?">
            <p className="text-sm leading-relaxed">
              <strong>Loss</strong> là thứ mô hình tối thiểu hoá — phải khả
              vi (có đạo hàm) để gradient descent hoạt động. <strong>Metric</strong>{" "}
              là thước đo bạn báo cáo cho người khác — có thể là accuracy, F1,
              RMSE, MAPE, AUC... Metric không cần khả vi. Ví dụ bạn huấn luyện
              phân loại với Cross-Entropy (loss) nhưng báo cáo Accuracy
              (metric) cho sếp. Accuracy có đạo hàm 0 ở hầu khắp nơi nên không
              thể làm loss, nhưng rất dễ hiểu nên phù hợp để báo cáo.
            </p>
          </CollapsibleDetail>

          <p className="leading-relaxed mt-4">
            Loss đi tay trong tay với{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink> —
            loss cho biết &ldquo;đang sai bao nhiêu&rdquo;, gradient cho biết &ldquo;phải đi
            theo hướng nào để sai ít hơn&rdquo;. Không có loss thì gradient
            descent không có thứ để tối thiểu hoá; không có gradient descent
            thì loss chỉ là một con số vô nghĩa.{" "}
            <TopicLink slug="backpropagation">Backpropagation</TopicLink> sau
            đó đưa gradient của loss về từng tham số trong mạng. Ba khái niệm
            làm thành &ldquo;bộ ba huấn luyện&rdquo; của mọi mô hình hiện đại.
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 8 — TÓM TẮT + QUIZ ━━━ */}
      <LessonSection step={8} totalSteps={8} label="Tóm tắt & kiểm tra">
        <MiniSummary
          title="5 điều cần nhớ về hàm mất mát"
          points={[
            "Loss là 'điểm số' của mô hình — càng thấp càng tốt. Chọn sai loss = mô hình học sai mục tiêu.",
            "Hồi quy dữ liệu sạch → MSE. Hồi quy có outlier → MAE hoặc Huber. Phân loại → Cross-Entropy. Xếp hạng → Hinge / Pairwise.",
            "MSE phạt bình phương: một outlier đóng góp rất nhiều. MAE phạt tuyến tính: outlier không thống trị được.",
            "Cross-Entropy phạt 'tự tin sai' bằng logarit — đạo hàm vẫn mạnh khi sigmoid ở biên, nên học nhanh hơn MSE trong phân loại.",
            "Loss phải khả vi để gradient descent hoạt động. Metric (accuracy, F1...) là thứ bạn báo cáo, không phải thứ mô hình tối thiểu hoá.",
          ]}
        />

        <div className="mt-6">
          <Callout
            variant="tip"
            title="Liên kết với các bài khác"
          >
            Loss là thứ mà{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink>{" "}
            tối thiểu hoá. Đạo hàm của loss lan qua mạng nhờ{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink>. Nếu
            bạn đã học{" "}
            <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink>
            , MSE ở đây chính là hàm mục tiêu mà OLS giải được dưới dạng đóng.
          </Callout>
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-muted">
          <Sparkles size={12} />
          <span>
            Bạn đã hoàn thành bài. Kiểm tra nhanh xem mình đã &ldquo;đoán&rdquo; đúng
            loss cho mọi tình huống chưa.
          </span>
          <Lightbulb size={12} />
        </div>

        <div className="mt-4">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
