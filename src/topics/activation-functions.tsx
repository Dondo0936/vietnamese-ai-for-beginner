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
  slug: "activation-functions",
  title: "Activation Functions",
  titleVi: "Hàm kích hoạt",
  description:
    "Các hàm phi tuyến giúp mạng nơ-ron học được các mối quan hệ phức tạp trong dữ liệu.",
  category: "neural-fundamentals",
  tags: ["neural-network", "fundamentals", "math"],
  difficulty: "beginner",
  relatedSlugs: ["perceptron", "mlp", "vanishing-exploding-gradients"],
  vizType: "interactive",
};

/* ============================================================
 * MATH / PLOTTING CONSTANTS
 * ============================================================ */
const SVG_W = 480;
const SVG_H = 300;
const PAD = 40;
const X_RANGE = 6; // -6 to 6

const MINI_W = 220;
const MINI_H = 140;
const MINI_PAD = 24;

type ActivationName =
  | "sigmoid"
  | "tanh"
  | "relu"
  | "leaky-relu"
  | "elu"
  | "gelu";

interface ActivationDef {
  fn: (x: number) => number;
  deriv: (x: number) => number;
  color: string;
  label: string;
  formula: string;
  range: string;
  year: string;
  note: string;
}

/* ------------------------------------------------------------
 *  Approximation of GELU (tanh approximation from Hendrycks & Gimpel, 2016)
 * ------------------------------------------------------------ */
function geluFn(x: number): number {
  const k = Math.sqrt(2 / Math.PI);
  return 0.5 * x * (1 + Math.tanh(k * (x + 0.044715 * Math.pow(x, 3))));
}

function geluDeriv(x: number): number {
  // Numerical approximation using a small step
  const h = 1e-4;
  return (geluFn(x + h) - geluFn(x - h)) / (2 * h);
}

const ACTIVATIONS: Record<ActivationName, ActivationDef> = {
  sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-x)),
    deriv: (x) => {
      const s = 1 / (1 + Math.exp(-x));
      return s * (1 - s);
    },
    color: "#3b82f6",
    label: "Sigmoid",
    formula: "\\sigma(x) = \\frac{1}{1 + e^{-x}}",
    range: "(0, 1)",
    year: "~1960s",
    note: "Gốc từ perceptron + hồi quy logistic. Mềm, nhưng bão hoà.",
  },
  tanh: {
    fn: (x) => Math.tanh(x),
    deriv: (x) => 1 - Math.tanh(x) ** 2,
    color: "#f59e0b",
    label: "Tanh",
    formula: "\\tanh(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}",
    range: "(-1, 1)",
    year: "~1990s",
    note: "Đối xứng quanh 0 — gradient tốt hơn sigmoid một chút.",
  },
  relu: {
    fn: (x) => Math.max(0, x),
    deriv: (x) => (x > 0 ? 1 : 0),
    color: "#22c55e",
    label: "ReLU",
    formula: "\\text{ReLU}(x) = \\max(0, x)",
    range: "[0, +∞)",
    year: "2010 / 2012",
    note: "Cú hích của deep learning hiện đại (AlexNet, 2012).",
  },
  "leaky-relu": {
    fn: (x) => (x > 0 ? x : 0.01 * x),
    deriv: (x) => (x > 0 ? 1 : 0.01),
    color: "#ef4444",
    label: "Leaky ReLU",
    formula:
      "f(x) = \\begin{cases} x & x > 0 \\\\ 0.01x & x \\leq 0 \\end{cases}",
    range: "(-∞, +∞)",
    year: "2013",
    note: "Cho vùng âm một chút gradient — chống dying ReLU.",
  },
  elu: {
    fn: (x) => (x > 0 ? x : 1.0 * (Math.exp(x) - 1)),
    deriv: (x) => (x > 0 ? 1 : Math.exp(x)),
    color: "#8b5cf6",
    label: "ELU",
    formula:
      "f(x) = \\begin{cases} x & x > 0 \\\\ \\alpha(e^x - 1) & x \\leq 0 \\end{cases}",
    range: "(-α, +∞)",
    year: "2015",
    note: "Mượt ở vùng âm — trung bình gần 0, học nhanh hơn.",
  },
  gelu: {
    fn: geluFn,
    deriv: geluDeriv,
    color: "#06b6d4",
    label: "GELU",
    formula:
      "\\text{GELU}(x) = x \\cdot \\Phi(x) \\approx 0.5x\\left(1 + \\tanh\\!\\left[\\sqrt{\\tfrac{2}{\\pi}}(x + 0.044715 x^3)\\right]\\right)",
    range: "≈ (-0.17, +∞)",
    year: "2016",
    note: "Mặc định của Transformer (BERT, GPT-2). Mượt, xác suất hoá.",
  },
};

const ALL_ACTIVATIONS: ActivationName[] = [
  "sigmoid",
  "tanh",
  "relu",
  "leaky-relu",
  "elu",
  "gelu",
];

/* ------------------------------------------------------------
 *  Coordinate helpers for the big chart
 * ------------------------------------------------------------ */
function dataToSvgX(x: number, width: number = SVG_W, pad: number = PAD): number {
  return pad + ((x + X_RANGE) / (2 * X_RANGE)) * (width - 2 * pad);
}

function dataToSvgY(
  y: number,
  yMin: number,
  yMax: number,
  height: number = SVG_H,
  pad: number = PAD,
): number {
  return height - pad - ((y - yMin) / (yMax - yMin)) * (height - 2 * pad);
}

/* ------------------------------------------------------------
 *  Build polyline points for a function over the default x-range
 * ------------------------------------------------------------ */
function buildPolyline(
  fn: (x: number) => number,
  yMin: number,
  yMax: number,
  width: number,
  height: number,
  pad: number,
): string {
  const pts: string[] = [];
  const samples = 200;
  for (let i = 0; i <= samples; i++) {
    const x = -X_RANGE + (i / samples) * 2 * X_RANGE;
    const raw = fn(x);
    const clamped = Math.max(yMin, Math.min(yMax, raw));
    pts.push(
      `${dataToSvgX(x, width, pad)},${dataToSvgY(clamped, yMin, yMax, height, pad)}`,
    );
  }
  return pts.join(" ");
}

/* ============================================================
 *  Main component
 * ============================================================ */
export default function ActivationFunctionsTopic() {
  /* ---------- Interactive state ---------- */
  const [selected, setSelected] = useState<ActivationName>("relu");
  const [inputVal, setInputVal] = useState(1.5);
  const [showDeriv, setShowDeriv] = useState(false);
  const [chainInputs] = useState<[number, number, number]>([2.0, -1.0, 0.5]);
  const [compareInput, setCompareInput] = useState(0.8);
  const [sharedSweep, setSharedSweep] = useState(0.0);
  const [dyingSteps, setDyingSteps] = useState(4);

  const act = ACTIVATIONS[selected];
  const outputVal = act.fn(inputVal);
  const derivVal = act.deriv(inputVal);

  /* ---------- Y-range depends on selection ---------- */
  const yRange = useMemo((): [number, number] => {
    if (selected === "relu" || selected === "leaky-relu" || selected === "elu") {
      return [-1.5, 5];
    }
    if (selected === "gelu") return [-1, 5];
    return [-1.5, 1.5];
  }, [selected]);

  /* ---------- Big curve for the main explorer ---------- */
  const curvePoints = useMemo(
    () => buildPolyline(act.fn, yRange[0], yRange[1], SVG_W, SVG_H, PAD),
    [act, yRange],
  );

  const derivPoints = useMemo(
    () => buildPolyline(act.deriv, yRange[0], yRange[1], SVG_W, SVG_H, PAD),
    [act, yRange],
  );

  /* ---------- Sigmoid chain: vanishing gradient demo ---------- */
  const chainResults = useMemo(() => {
    const results: number[][] = [];
    for (const inp of chainInputs) {
      const chain: number[] = [inp];
      let val = inp;
      for (let i = 0; i < 8; i++) {
        val = ACTIVATIONS.sigmoid.fn(val);
        chain.push(val);
      }
      results.push(chain);
    }
    return results;
  }, [chainInputs]);

  /* ---------- Dying ReLU: trọng số âm dần tiến về 0 ---------- */
  const dyingReluTrace = useMemo(() => {
    // Simulate a neuron with initial weights producing negative input,
    // gradient-updated over `dyingSteps` epochs.
    const trace: { epoch: number; preAct: number; out: number; grad: number }[] =
      [];
    let w = -1.2; // pre-activation weight (already negative)
    for (let t = 0; t < dyingSteps; t++) {
      const preAct = w;
      const out = Math.max(0, preAct); // ReLU
      const grad = preAct > 0 ? 1 : 0;
      trace.push({ epoch: t, preAct, out, grad });
      // If gradient is 0 → weight never updates; else we would move it.
      // We intentionally show the stuck dynamic.
      w = preAct; // không cập nhật
    }
    return trace;
  }, [dyingSteps]);

  /* ---------- Comparison: 6 activations sharing the same input ---------- */
  const compareRows = useMemo(() => {
    return ALL_ACTIVATIONS.map((name) => {
      const d = ACTIVATIONS[name];
      return {
        name,
        label: d.label,
        color: d.color,
        out: d.fn(compareInput),
        grad: d.deriv(compareInput),
      };
    });
  }, [compareInput]);

  /* ---------- Sweep bar used by "shared sweep" UI ---------- */
  const sweepValues = useMemo(() => {
    return ALL_ACTIVATIONS.map((name) => {
      const d = ACTIVATIONS[name];
      return { name, label: d.label, color: d.color, val: d.fn(sharedSweep) };
    });
  }, [sharedSweep]);

  /* ---------- Callback for resetting the explorer ---------- */
  const resetExplorer = useCallback(() => {
    setSelected("relu");
    setInputVal(1.5);
    setShowDeriv(false);
  }, []);

  /* ============================================================
   *  Quiz — 8 questions, mix of MCQ and fill-in-the-blank
   * ============================================================ */
  const quizQuestions: QuizQuestion[] = [
    {
      question:
        "Tại sao ReLU là lựa chọn mặc định cho lớp ẩn trong hầu hết mạng nơ-ron hiện đại?",
      options: [
        "Vì ReLU cho đầu ra trong khoảng (0,1) như xác suất",
        "Vì ReLU tính nhanh (chỉ so sánh với 0) và gradient không bị triệt tiêu ở vùng dương",
        "Vì ReLU là hàm kích hoạt duy nhất có đạo hàm",
        "Vì ReLU phù hợp cho lớp đầu ra",
      ],
      correct: 1,
      explanation:
        "ReLU chỉ cần phép so sánh max(0,x), cực kỳ nhanh. Gradient ở vùng dương luôn bằng 1, tránh triệt tiêu gradient — vấn đề nghiêm trọng của sigmoid/tanh.",
    },
    {
      question: "'Dying ReLU' xảy ra khi nào?",
      options: [
        "Khi đầu vào luôn dương",
        "Khi learning rate quá nhỏ",
        "Khi nơ-ron luôn nhận đầu vào âm, gradient = 0, nơ-ron không bao giờ cập nhật",
        "Khi dùng quá nhiều lớp",
      ],
      correct: 2,
      explanation:
        "Nếu đầu vào luôn âm, ReLU trả về 0 và gradient cũng bằng 0. Nơ-ron 'chết' vĩnh viễn. Leaky ReLU giải quyết bằng cách cho gradient nhỏ (0.01) ở vùng âm.",
    },
    {
      question: "Khi nào dùng sigmoid ở lớp đầu ra?",
      options: [
        "Luôn luôn — sigmoid là tốt nhất",
        "Bài toán phân loại nhị phân (xác suất 0-1)",
        "Bài toán hồi quy liên tục",
        "Bài toán phân loại đa lớp",
      ],
      correct: 1,
      explanation:
        "Sigmoid nén đầu ra về (0,1) — hoàn hảo cho xác suất nhị phân. Phân loại đa lớp dùng softmax, hồi quy dùng tuyến tính (không kích hoạt).",
    },
    {
      type: "fill-blank",
      question:
        "ReLU(x) = max(0, x). Khi x = −4, ReLU trả về {blank}, và gradient tại điểm đó bằng {blank}.",
      blanks: [
        { answer: "0", accept: ["0.0"] },
        { answer: "0", accept: ["0.0"] },
      ],
      explanation:
        "Khi đầu vào âm, ReLU trả về 0 và đạo hàm bằng 0. Nếu nơ-ron luôn nhận đầu vào âm, gradient sẽ luôn bằng 0 → trọng số không bao giờ cập nhật. Đây là hiện tượng 'dying ReLU' và là lý do Leaky ReLU ra đời.",
    },
    {
      question:
        "Trong một Transformer hiện đại (GPT-2, BERT), hàm kích hoạt nào được dùng trong các khối feed-forward?",
      options: [
        "Sigmoid — tương thích với attention",
        "Tanh — vì đầu ra nằm trong (-1, 1)",
        "GELU — mượt, xác suất hoá, hội tụ tốt hơn ReLU trên dữ liệu ngôn ngữ",
        "Softmax — chuẩn hoá ở mỗi lớp ẩn",
      ],
      correct: 2,
      explanation:
        "GELU (Gaussian Error Linear Unit) là lựa chọn mặc định trong BERT, GPT-2 và nhiều Transformer hiện đại. Nó hoạt động giống ReLU ở vùng dương, nhưng mượt hơn quanh 0 và cho gradient nhỏ (khác 0) ở vùng âm gần 0 — giúp hội tụ tốt hơn.",
    },
    {
      type: "fill-blank",
      question:
        "Đạo hàm cực đại của sigmoid đạt tại x = 0 và bằng {blank}. Điều này giải thích vì sao xếp chồng nhiều lớp sigmoid sẽ làm gradient {blank} dần.",
      blanks: [
        { answer: "0.25", accept: ["1/4", "0.250"] },
        { answer: "triệt tiêu", accept: ["vanish", "biến mất", "nhỏ", "giảm"] },
      ],
      explanation:
        "σ'(x) = σ(x)(1−σ(x)), cực đại tại σ(0) = 0.5 → σ'(0) = 0.25. Khi nhân gradient qua 10 lớp sigmoid, ta có (0.25)^10 ≈ 10^-6 — gradient triệt tiêu, mạng sâu không học được.",
    },
    {
      question:
        "Bạn nhìn thấy mạng ReLU với 30% nơ-ron luôn cho đầu ra 0. Cách xử lý nào KHÔNG hợp lý?",
      options: [
        "Chuyển sang Leaky ReLU hoặc ELU — cho vùng âm một chút gradient",
        "Giảm learning rate để tránh đẩy pre-activation sang vùng âm quá mạnh",
        "Kiểm tra khởi tạo trọng số (He init) thay vì Xavier",
        "Tăng learning rate lên gấp 10 lần để 'kích hoạt' các nơ-ron chết",
      ],
      correct: 3,
      explanation:
        "Tăng learning rate thường làm tình hình tệ hơn: một bước lớn có thể đẩy pre-activation sâu vào vùng âm, khiến càng nhiều nơ-ron chết. Ba phương án còn lại đều là giải pháp được khuyến nghị.",
    },
    {
      question:
        "Đặt một lớp tuyến tính (không có activation) ở đầu ra cho mô hình hồi quy giá nhà. Tại sao đây là lựa chọn đúng?",
      options: [
        "Vì tuyến tính luôn nhanh hơn phi tuyến",
        "Vì đầu ra cần nằm trong (-∞, +∞) — giá nhà có thể là bất kỳ số thực dương nào",
        "Vì ReLU không có đạo hàm tại 0",
        "Vì softmax không dùng được cho đầu ra duy nhất",
      ],
      correct: 1,
      explanation:
        "Hồi quy cần đầu ra liên tục không giới hạn. Sigmoid (0,1) hay softmax không phù hợp. Cách chuẩn: không thêm activation ở lớp cuối của mô hình hồi quy, hoặc dùng softplus nếu cần bắt buộc dương.",
    },
  ];

  /* ============================================================
   *  RENDER
   * ============================================================ */
  return (
    <>
      {/* =====================================================
       *  STEP 1: PREDICTION GATE
       * ===================================================== */}
      <LessonSection step={1} totalSteps={10} label="Dự đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={10}
            labels={[
              "Dự đoán",
              "Khám phá",
              "So sánh 6 hàm",
              "Aha",
              "Dying ReLU",
              "Vanishing gradient",
              "Thử thách",
              "Giải thích",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Nếu xếp chồng 100 lớp tuyến tính (chỉ nhân ma trận, không có gì khác), kết quả sẽ tương đương với bao nhiêu lớp?"
          options={[
            "100 lớp — mỗi lớp đều đóng góp",
            "50 lớp — giảm một nửa",
            "1 lớp duy nhất — tất cả rút gọn thành một phép nhân",
            "0 lớp — kết quả luôn bằng 0",
          ]}
          correct={2}
          explanation="Nhân nhiều ma trận vẫn cho một ma trận: W₁ × W₂ × ... × W₁₀₀ = W_tổng. Không có phi tuyến, 100 lớp = 1 lớp! Đây là lý do hàm kích hoạt tồn tại."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Hàm kích hoạt chính là thành phần phá vỡ tính tuyến tính. Hãy{" "}
            <strong className="text-foreground">kéo thanh trượt</strong> để cảm
            nhận từng hàm biến đổi tín hiệu như thế nào.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* =====================================================
       *  STEP 2: INTERACTIVE EXPLORER (một hàm, chi tiết)
       * ===================================================== */}
      <LessonSection step={2} totalSteps={10} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <div className="space-y-4">
            {/* Function selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {ALL_ACTIVATIONS.map((name) => (
                <button
                  key={name}
                  onClick={() => setSelected(name)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    selected === name
                      ? "text-white shadow-md"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={
                    selected === name
                      ? { backgroundColor: ACTIVATIONS[name].color }
                      : {}
                  }
                >
                  {ACTIVATIONS[name].label}
                </button>
              ))}
            </div>

            {/* Toggle derivative + reset */}
            <div className="flex flex-wrap justify-center gap-5">
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDeriv}
                  onChange={(e) => setShowDeriv(e.target.checked)}
                  className="accent-accent"
                />
                Hiện đạo hàm (gradient)
              </label>
              <button
                onClick={resetExplorer}
                className="text-xs text-muted hover:text-foreground underline-offset-2 hover:underline"
              >
                Đặt lại
              </button>
            </div>

            {/* SVG Graph */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-xl mx-auto"
            >
              {/* Axes */}
              <line
                x1={PAD}
                y1={dataToSvgY(0, yRange[0], yRange[1])}
                x2={SVG_W - PAD}
                y2={dataToSvgY(0, yRange[0], yRange[1])}
                stroke="#334155"
                strokeWidth="1"
              />
              <line
                x1={dataToSvgX(0)}
                y1={PAD}
                x2={dataToSvgX(0)}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={SVG_W - PAD + 5}
                y={dataToSvgY(0, yRange[0], yRange[1]) - 5}
                fill="#64748b"
                fontSize="11"
              >
                x
              </text>
              <text
                x={dataToSvgX(0) + 5}
                y={PAD - 5}
                fill="#64748b"
                fontSize="11"
              >
                y
              </text>

              {/* Tick marks */}
              {[-4, -2, 2, 4].map((v) => (
                <g key={`tx-${v}`}>
                  <line
                    x1={dataToSvgX(v)}
                    y1={dataToSvgY(0, yRange[0], yRange[1]) - 3}
                    x2={dataToSvgX(v)}
                    y2={dataToSvgY(0, yRange[0], yRange[1]) + 3}
                    stroke="#475569"
                    strokeWidth="1"
                  />
                  <text
                    x={dataToSvgX(v)}
                    y={dataToSvgY(0, yRange[0], yRange[1]) + 16}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                  >
                    {v}
                  </text>
                </g>
              ))}

              {/* Derivative curve (behind main curve) */}
              {showDeriv && (
                <polyline
                  points={derivPoints}
                  fill="none"
                  stroke={act.color}
                  strokeWidth="2"
                  strokeDasharray="6,4"
                  opacity={0.5}
                />
              )}

              {/* Main curve */}
              <polyline
                points={curvePoints}
                fill="none"
                stroke={act.color}
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Input marker */}
              <motion.circle
                cx={dataToSvgX(inputVal)}
                cy={dataToSvgY(
                  Math.max(yRange[0], Math.min(yRange[1], outputVal)),
                  yRange[0],
                  yRange[1],
                )}
                r="7"
                fill={act.color}
                stroke="white"
                strokeWidth="2"
                initial={false}
                animate={{
                  cx: dataToSvgX(inputVal),
                  cy: dataToSvgY(
                    Math.max(yRange[0], Math.min(yRange[1], outputVal)),
                    yRange[0],
                    yRange[1],
                  ),
                }}
                transition={{ type: "spring", stiffness: 150, damping: 15 }}
              />

              {/* Value label */}
              <motion.text
                x={dataToSvgX(inputVal)}
                y={
                  dataToSvgY(
                    Math.max(yRange[0], Math.min(yRange[1], outputVal)),
                    yRange[0],
                    yRange[1],
                  ) - 14
                }
                textAnchor="middle"
                fill={act.color}
                fontSize="11"
                fontWeight="bold"
                initial={false}
                animate={{ x: dataToSvgX(inputVal) }}
              >
                f({inputVal.toFixed(1)}) = {outputVal.toFixed(3)}
              </motion.text>

              {/* Dashed vertical line from curve down to x-axis */}
              <line
                x1={dataToSvgX(inputVal)}
                y1={dataToSvgY(
                  Math.max(yRange[0], Math.min(yRange[1], outputVal)),
                  yRange[0],
                  yRange[1],
                )}
                x2={dataToSvgX(inputVal)}
                y2={dataToSvgY(0, yRange[0], yRange[1])}
                stroke={act.color}
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity={0.4}
              />
            </svg>

            {/* Slider */}
            <div className="space-y-2 max-w-md mx-auto">
              <label className="text-sm font-medium text-muted">
                Đầu vào x ={" "}
                <strong className="text-foreground">
                  {inputVal.toFixed(1)}
                </strong>
                {" → "}
                f(x) ={" "}
                <strong style={{ color: act.color }}>
                  {outputVal.toFixed(4)}
                </strong>
                {showDeriv && (
                  <>
                    {" | "}
                    f&apos;(x) ={" "}
                    <strong className="text-foreground/70">
                      {derivVal.toFixed(4)}
                    </strong>
                  </>
                )}
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={inputVal}
                onChange={(e) => setInputVal(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            {/* Info card */}
            <div className="rounded-lg bg-background/50 border border-border p-4 text-sm text-foreground/80 space-y-1">
              <p>
                <strong style={{ color: act.color }}>{act.label}:</strong>{" "}
                Khoảng giá trị: {act.range} · Xuất hiện: {act.year}
              </p>
              <p className="text-xs text-muted">{act.note}</p>
              <LaTeX block>{act.formula}</LaTeX>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* =====================================================
       *  STEP 3: SIDE-BY-SIDE COMPARISON OF 6 ACTIVATIONS
       * ===================================================== */}
      <LessonSection step={3} totalSteps={10} label="So sánh 6 hàm">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            So sánh 6 hàm kích hoạt song song
          </h3>
          <p className="text-sm text-muted mb-4">
            Cùng một đầu vào x đi qua cả 6 hàm — kéo thanh trượt để thấy chúng
            phản ứng khác nhau như thế nào. Đường liền là f(x), đường nét đứt là
            đạo hàm f&apos;(x).
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ALL_ACTIVATIONS.map((name) => {
              const d = ACTIVATIONS[name];
              const localY: [number, number] =
                name === "relu" ||
                name === "leaky-relu" ||
                name === "elu" ||
                name === "gelu"
                  ? [-1.5, 5]
                  : [-1.5, 1.5];
              const curve = buildPolyline(
                d.fn,
                localY[0],
                localY[1],
                MINI_W,
                MINI_H,
                MINI_PAD,
              );
              const deriv = buildPolyline(
                d.deriv,
                localY[0],
                localY[1],
                MINI_W,
                MINI_H,
                MINI_PAD,
              );
              const markerY = dataToSvgY(
                Math.max(localY[0], Math.min(localY[1], d.fn(sharedSweep))),
                localY[0],
                localY[1],
                MINI_H,
                MINI_PAD,
              );
              return (
                <div
                  key={name}
                  className="rounded-lg border border-border bg-background/40 p-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: d.color }}
                    >
                      {d.label}
                    </span>
                    <span className="text-[10px] text-muted">{d.year}</span>
                  </div>
                  <svg
                    viewBox={`0 0 ${MINI_W} ${MINI_H}`}
                    className="w-full h-auto"
                  >
                    {/* axes */}
                    <line
                      x1={MINI_PAD}
                      y1={dataToSvgY(
                        0,
                        localY[0],
                        localY[1],
                        MINI_H,
                        MINI_PAD,
                      )}
                      x2={MINI_W - MINI_PAD}
                      y2={dataToSvgY(
                        0,
                        localY[0],
                        localY[1],
                        MINI_H,
                        MINI_PAD,
                      )}
                      stroke="#334155"
                      strokeWidth="0.5"
                    />
                    <line
                      x1={dataToSvgX(0, MINI_W, MINI_PAD)}
                      y1={MINI_PAD}
                      x2={dataToSvgX(0, MINI_W, MINI_PAD)}
                      y2={MINI_H - MINI_PAD}
                      stroke="#334155"
                      strokeWidth="0.5"
                    />
                    {/* derivative */}
                    <polyline
                      points={deriv}
                      fill="none"
                      stroke={d.color}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity={0.45}
                    />
                    {/* main */}
                    <polyline
                      points={curve}
                      fill="none"
                      stroke={d.color}
                      strokeWidth="2"
                    />
                    {/* shared sweep marker */}
                    <circle
                      cx={dataToSvgX(sharedSweep, MINI_W, MINI_PAD)}
                      cy={markerY}
                      r={3.5}
                      fill={d.color}
                      stroke="white"
                      strokeWidth="1"
                    />
                  </svg>
                  <p className="text-[10px] text-center text-muted mt-1">
                    f({sharedSweep.toFixed(1)}) = {d.fn(sharedSweep).toFixed(3)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="space-y-1 max-w-md mx-auto mt-5">
            <label className="text-sm text-muted">
              Đầu vào chung x ={" "}
              <strong className="text-foreground">
                {sharedSweep.toFixed(1)}
              </strong>
            </label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.1"
              value={sharedSweep}
              onChange={(e) => setSharedSweep(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          {/* Bar-chart view of outputs at this x */}
          <div className="mt-6">
            <p className="text-sm text-muted mb-2">
              Giá trị đầu ra của từng hàm tại x = {sharedSweep.toFixed(1)}:
            </p>
            <div className="space-y-2">
              {sweepValues.map((v) => {
                const mag = Math.min(1, Math.abs(v.val) / 3);
                const widthPct = (mag * 100).toFixed(1);
                const positive = v.val >= 0;
                return (
                  <div key={v.name} className="flex items-center gap-2">
                    <span className="text-xs w-20 text-right text-muted">
                      {v.label}
                    </span>
                    <div className="flex-1 h-4 bg-surface/50 rounded-sm relative">
                      <div
                        className="absolute top-0 bottom-0 rounded-sm"
                        style={{
                          backgroundColor: v.color,
                          left: positive ? "50%" : `${50 - mag * 50}%`,
                          width: `${widthPct}%`,
                          opacity: 0.85,
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 border-l border-border/60"
                        style={{ left: "50%" }}
                      />
                    </div>
                    <span
                      className="text-xs w-16 text-left font-mono"
                      style={{ color: v.color }}
                    >
                      {v.val.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </VisualizationSection>

        <Callout variant="insight" title="Quan sát">
          Khi x &lt; 0: Sigmoid vẫn cho giá trị dương nhỏ (0.3–0.5), ReLU trả
          thẳng 0, Leaky/ELU/GELU cho giá trị âm nhỏ. Khi x &gt; 0: tất cả đều
          &quot;đi lên&quot;, nhưng tanh bão hoà ở 1, ReLU/ELU/GELU tăng tuyến
          tính. Đây là lý do vì sao chọn đúng hàm kích hoạt lại quan trọng cho
          hội tụ của mạng.
        </Callout>
      </LessonSection>

      {/* =====================================================
       *  STEP 4: AHA MOMENT
       * ===================================================== */}
      <LessonSection step={4} totalSteps={10} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Hàm kích hoạt</strong> là &quot;công tắc&quot; của nơ-ron —
            nó quyết định tín hiệu có được chuyển tiếp hay không, và chuyển bao
            nhiêu. Trong <TopicLink slug="perceptron">perceptron</TopicLink> cổ
            điển dùng hàm bước đơn giản; mạng hiện đại dùng ReLU hoặc GELU để
            gradient có thể lan truyền qua hàng trăm lớp mà không bị triệt tiêu
            hay bùng nổ.
          </p>
          <p className="mt-3">
            Điểm then chốt: <em>chính đạo hàm của hàm kích hoạt</em> mới là thứ
            quyết định mạng có học được hay không —{" "}
            <TopicLink slug="backpropagation">backpropagation</TopicLink> nhân
            đạo hàm này qua hàng chục lớp; nếu nó quá nhỏ, gradient biến mất; nếu
            quá lớn, gradient bùng nổ.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* =====================================================
       *  STEP 5: DYING RELU VISUALIZATION
       * ===================================================== */}
      <LessonSection step={5} totalSteps={10} label="Dying ReLU">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Dying ReLU — Nơ-ron chết vĩnh viễn
          </h3>
          <p className="text-sm text-muted mb-4">
            Khi pre-activation (z = Wx + b) luôn âm, ReLU trả về 0 và gradient
            cũng bằng 0. Không có gradient → không cập nhật trọng số → nơ-ron
            đứng im mãi mãi. Trượt để xem trạng thái sau mỗi epoch.
          </p>

          <div className="space-y-3 max-w-md mx-auto">
            <label className="text-sm text-muted">
              Số epoch quan sát:{" "}
              <strong className="text-foreground">{dyingSteps}</strong>
            </label>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={dyingSteps}
              onChange={(e) => setDyingSteps(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-foreground font-semibold">
                    Epoch
                  </th>
                  <th className="text-left py-2 pr-3 text-foreground font-semibold">
                    Pre-activation z
                  </th>
                  <th className="text-left py-2 pr-3 text-foreground font-semibold">
                    ReLU(z)
                  </th>
                  <th className="text-left py-2 pr-3 text-foreground font-semibold">
                    ∂/∂z
                  </th>
                  <th className="text-left py-2 text-foreground font-semibold">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {dyingReluTrace.map((row) => (
                  <tr key={row.epoch} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium text-foreground">
                      {row.epoch}
                    </td>
                    <td className="py-2 pr-3 font-mono text-red-400">
                      {row.preAct.toFixed(3)}
                    </td>
                    <td className="py-2 pr-3 font-mono">
                      {row.out.toFixed(3)}
                    </td>
                    <td className="py-2 pr-3 font-mono">
                      {row.grad.toFixed(3)}
                    </td>
                    <td className="py-2 text-xs">
                      {row.grad === 0 ? (
                        <span className="text-red-400">chết — không học</span>
                      ) : (
                        <span className="text-green-400">đang học</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-center text-red-400 mt-3">
            Gradient luôn bằng 0 → trọng số không đổi → nơ-ron chết cho mọi epoch
            tiếp theo. Không có cách nào &quot;hồi sinh&quot; nó bằng cùng dữ
            liệu đó nữa.
          </p>

          <Callout variant="tip" title="Cách tránh dying ReLU">
            1) <strong>He initialization</strong> thay vì Xavier để pre-activation
            lệch dương nhiều hơn. 2) Hạ learning rate (hạn chế cập nhật mạnh đẩy
            z sang vùng âm). 3) Chuyển sang <strong>Leaky ReLU / ELU / GELU</strong>
             — các biến thể cho gradient khác 0 ở vùng âm.
          </Callout>
        </VisualizationSection>
      </LessonSection>

      {/* =====================================================
       *  STEP 6: VANISHING GRADIENT VIA STACKED SIGMOIDS
       * ===================================================== */}
      <LessonSection step={6} totalSteps={10} label="Vanishing gradient">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          Đây là lý do sigmoid gặp vấn đề ở lớp ẩn. Khi tín hiệu đi qua sigmoid
          nhiều lần, nó bị &quot;nén&quot; dần về 0.5 — gradient gần bằng 0, mạng
          không thể học!
        </p>
        <div className="space-y-3">
          <p className="text-xs text-center text-muted">
            Xem giá trị thay đổi khi đi qua sigmoid 8 lần liên tiếp
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-foreground font-semibold">
                    Đầu vào
                  </th>
                  {Array.from({ length: 9 }, (_, i) => (
                    <th
                      key={i}
                      className="py-2 px-2 text-foreground font-semibold text-center"
                    >
                      {i === 0 ? "x" : `σ×${i}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chainResults.map((chain, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium text-foreground">
                      x = {chainInputs[idx]}
                    </td>
                    {chain.map((val, i) => {
                      const opacity = 1 - (i / chain.length) * 0.6;
                      const isConverging =
                        i > 0 && Math.abs(val - 0.5) < 0.01;
                      return (
                        <td
                          key={i}
                          className="py-2 px-2 text-center"
                          style={{
                            color: isConverging ? "#ef4444" : "#3b82f6",
                            opacity,
                          }}
                        >
                          {val.toFixed(3)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-center text-red-400">
            Mọi giá trị đều hội tụ về 0.5 — gradient gần bằng 0! Đây là vấn đề
            &quot;triệt tiêu gradient&quot; (
            <TopicLink slug="vanishing-exploding-gradients">
              vanishing gradient
            </TopicLink>
            ).
          </p>

          <div className="rounded-lg border border-border bg-background/40 p-4 mt-4 text-sm text-foreground/80">
            <p className="font-semibold mb-2">Phép tính nhanh:</p>
            <p>
              σ&apos;(x) đạt cực đại 0.25 tại x = 0. Khi backprop qua 10 lớp
              sigmoid, gradient bị nhân với <LaTeX>{`0.25^{10} \\approx 10^{-6}`}</LaTeX>.
              Mạng sâu hơn 10 lớp dùng sigmoid gần như không huấn luyện được.
              ReLU khắc phục: gradient là 1 ở vùng dương, không bị nén.
            </p>
          </div>
        </div>
      </LessonSection>

      {/* =====================================================
       *  STEP 7: INLINE CHALLENGES (2)
       * ===================================================== */}
      <LessonSection step={7} totalSteps={10} label="Thử thách">
        <div className="space-y-5">
          <InlineChallenge
            question="Nơ-ron dùng ReLU luôn nhận đầu vào âm (ví dụ: z = -3). Điều gì xảy ra?"
            options={[
              "Đầu ra = -3 và gradient = 1 — học bình thường",
              "Đầu ra = 0 và gradient = 0 — nơ-ron 'chết' vĩnh viễn",
              "Đầu ra = 0.5 — ReLU trung bình hóa",
            ]}
            correct={1}
            explanation="ReLU(x<0) = 0 và gradient = 0. Nơ-ron không bao giờ cập nhật được trọng số nữa — gọi là 'dying ReLU'. Leaky ReLU giải quyết bằng f(x) = 0.01x khi x < 0."
          />

          <InlineChallenge
            question="Bạn đang huấn luyện một LSTM để sinh văn bản. Lớp cổng (gate) nào bên trong LSTM dùng sigmoid, và vì sao?"
            options={[
              "Input/Forget/Output gate — vì cần giá trị 0–1 để kiểm soát bao nhiêu thông tin được giữ lại",
              "Chỉ forget gate — các gate khác dùng tanh",
              "Không gate nào — LSTM chỉ dùng ReLU cho tốc độ",
            ]}
            correct={0}
            explanation="Ba cổng (input, forget, output) của LSTM đều cần giá trị nằm trong (0,1) để đóng vai trò 'van' — sigmoid là lựa chọn tự nhiên. Candidate state dùng tanh để giữ giá trị trong (-1, 1), còn ReLU không phù hợp vì cần đầu ra bị giới hạn."
          />
        </div>

        {/* Compare-at-x gadget embedded in the challenge area */}
        <div className="mt-8 rounded-lg border border-border bg-background/40 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Bảng so sánh tức thời (cùng một x)
          </h4>
          <p className="text-xs text-muted mb-3">
            Kéo để đổi x, xem output và gradient của cả 6 hàm cùng lúc.
          </p>
          <input
            type="range"
            min={-4}
            max={4}
            step={0.1}
            value={compareInput}
            onChange={(e) => setCompareInput(parseFloat(e.target.value))}
            className="w-full accent-accent mb-3"
          />
          <p className="text-xs text-muted mb-2">
            x = <strong className="text-foreground">{compareInput.toFixed(2)}</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-foreground font-semibold">
                    Hàm
                  </th>
                  <th className="text-left py-2 pr-3 text-foreground font-semibold">
                    f(x)
                  </th>
                  <th className="text-left py-2 text-foreground font-semibold">
                    f&apos;(x)
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r) => (
                  <tr key={r.name} className="border-b border-border/50">
                    <td
                      className="py-2 pr-3 font-semibold"
                      style={{ color: r.color }}
                    >
                      {r.label}
                    </td>
                    <td className="py-2 pr-3 font-mono">{r.out.toFixed(4)}</td>
                    <td className="py-2 font-mono text-foreground/70">
                      {r.grad.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </LessonSection>

      {/* =====================================================
       *  STEP 8: EXPLANATION / DEEP DIVE
       * ===================================================== */}
      <LessonSection step={8} totalSteps={10} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Hàm kích hoạt (Activation Function)</strong> thêm tính phi
            tuyến vào mạng. Không có nó, dù mạng bao nhiêu lớp cũng chỉ tương
            đương một phép biến đổi tuyến tính. Trong quá trình{" "}
            <TopicLink slug="backpropagation">lan truyền ngược</TopicLink>, đạo
            hàm của hàm kích hoạt đóng vai trò then chốt trong việc truyền
            gradient qua các lớp.
          </p>

          <p>
            <strong>Bảng so sánh hàm kích hoạt phổ biến:</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Hàm
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Khoảng
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">
                    Dùng ở
                  </th>
                  <th className="text-left py-2 font-semibold text-foreground">
                    Nhược điểm
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">ReLU</td>
                  <td className="py-2 pr-3">[0, +∞)</td>
                  <td className="py-2 pr-3">Lớp ẩn (mặc định CNN)</td>
                  <td className="py-2">Dying neuron</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Leaky ReLU</td>
                  <td className="py-2 pr-3">(-∞, +∞)</td>
                  <td className="py-2 pr-3">Lớp ẩn</td>
                  <td className="py-2">Hệ số alpha cần chọn</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">ELU</td>
                  <td className="py-2 pr-3">(-α, +∞)</td>
                  <td className="py-2 pr-3">Lớp ẩn, muốn mean ≈ 0</td>
                  <td className="py-2">Tốn e^x ở vùng âm</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">GELU</td>
                  <td className="py-2 pr-3">≈(-0.17, +∞)</td>
                  <td className="py-2 pr-3">Transformer (BERT, GPT)</td>
                  <td className="py-2">Đắt hơn ReLU</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Sigmoid</td>
                  <td className="py-2 pr-3">(0, 1)</td>
                  <td className="py-2 pr-3">Đầu ra nhị phân, LSTM gate</td>
                  <td className="py-2">Triệt tiêu gradient</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Tanh</td>
                  <td className="py-2 pr-3">(-1, 1)</td>
                  <td className="py-2 pr-3">RNN, LSTM candidate</td>
                  <td className="py-2">Triệt tiêu gradient</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">Softmax</td>
                  <td className="py-2 pr-3">(0, 1), tổng = 1</td>
                  <td className="py-2 pr-3">Đầu ra đa lớp</td>
                  <td className="py-2">Chỉ dùng ở lớp cuối</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="tip" title="Quy tắc chọn hàm kích hoạt">
            Lớp ẩn của CNN/MLP: bắt đầu với <strong>ReLU</strong>. Lớp ẩn của
            Transformer: <strong>GELU</strong>. Đầu ra nhị phân:{" "}
            <strong>sigmoid</strong>. Đầu ra đa lớp: <strong>softmax</strong>.
            Hồi quy: <strong>không kích hoạt</strong> (tuyến tính). RNN/LSTM:{" "}
            <strong>tanh</strong> cho candidate state, <strong>sigmoid</strong>{" "}
            cho gates.
          </Callout>

          <CodeBlock language="python" title="activation_demo.py">
{`import torch
import torch.nn.functional as F

x = torch.tensor([-2.0, -1.0, 0.0, 1.0, 2.0])

print(F.relu(x))         # [0, 0, 0, 1, 2]
print(torch.sigmoid(x))  # [0.12, 0.27, 0.50, 0.73, 0.88]
print(torch.tanh(x))     # [-0.96, -0.76, 0.00, 0.76, 0.96]
print(F.leaky_relu(x, 0.01))  # [-0.02, -0.01, 0, 1, 2]
print(F.elu(x, 1.0))     # [-0.865, -0.632, 0, 1, 2]
print(F.gelu(x))         # [-0.045, -0.159, 0, 0.841, 1.955]

# Trong mạng nơ-ron:
model = torch.nn.Sequential(
    torch.nn.Linear(784, 256),
    torch.nn.ReLU(),          # hàm kích hoạt sau mỗi lớp ẩn
    torch.nn.Linear(256, 10),
    # Không cần Softmax ở đây — CrossEntropyLoss tự xử lý log-softmax
)
criterion = torch.nn.CrossEntropyLoss()`}
          </CodeBlock>

          <Callout variant="insight" title="GELU — xu hướng mới">
            GELU (Gaussian Error Linear Unit) kết hợp ưu điểm của ReLU và
            sigmoid, được dùng trong GPT và BERT. Thay vì cắt cứng tại 0 như
            ReLU, GELU &quot;mềm mại&quot; hơn: các giá trị gần 0 được cho qua
            một phần, theo xác suất từ phân phối Gaussian. Công thức đầy đủ:
            GELU(x) = x · Φ(x), với Φ là CDF của N(0, 1).
          </Callout>

          <CodeBlock language="python" title="from_scratch_activations.py">
{`import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def sigmoid_grad(x):
    s = sigmoid(x)
    return s * (1 - s)

def relu(x):
    return np.maximum(0, x)

def relu_grad(x):
    return (x > 0).astype(float)

def leaky_relu(x, alpha=0.01):
    return np.where(x > 0, x, alpha * x)

def leaky_relu_grad(x, alpha=0.01):
    return np.where(x > 0, 1.0, alpha)

def elu(x, alpha=1.0):
    return np.where(x > 0, x, alpha * (np.exp(x) - 1))

def elu_grad(x, alpha=1.0):
    return np.where(x > 0, 1.0, alpha * np.exp(x))

def gelu(x):
    # Hendrycks-Gimpel tanh approximation
    return 0.5 * x * (1 + np.tanh(
        np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)
    ))

# So sánh 6 hàm trên cùng đầu vào
xs = np.linspace(-3, 3, 7)
for name, fn in [("sigmoid", sigmoid), ("relu", relu),
                 ("leaky", leaky_relu), ("elu", elu),
                 ("gelu", gelu), ("tanh", np.tanh)]:
    print(name, np.round(fn(xs), 3))`}
          </CodeBlock>

          <Callout variant="warning" title="Cạm bẫy khi triển khai">
            Đừng thêm softmax trong model + CrossEntropyLoss trong PyTorch — loss
            đã bao gồm log-softmax, thêm lần nữa sẽ làm gradient sai. Cũng không
            cần kích hoạt cuối cùng cho mô hình hồi quy — giữ tuyến tính để đầu
            ra không bị giới hạn.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* =====================================================
       *  STEP 9: HISTORY + PITFALLS (collapsible details)
       * ===================================================== */}
      <LessonSection step={9} totalSteps={10} label="Lịch sử & Cạm bẫy">
        <div className="space-y-3">
          <CollapsibleDetail title="Lịch sử ngắn gọn: từ Rosenblatt (1958) đến GELU (2016)">
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                <strong>1958 — Perceptron của Rosenblatt.</strong> Frank
                Rosenblatt đề xuất mô hình perceptron dùng{" "}
                <em>hàm bước (Heaviside step)</em> làm activation: f(x) = 1 nếu
                x ≥ 0, ngược lại 0. Mô hình này không thể huấn luyện bằng
                gradient descent vì đạo hàm bằng 0 gần như mọi nơi. Perceptron
                học bằng một quy tắc cập nhật riêng, và chỉ giải được các bài
                toán phân tách tuyến tính — hạn chế được Minsky &amp; Papert
                chứng minh năm 1969.
              </p>
              <p>
                <strong>1986 — Backprop &amp; sigmoid.</strong> Rumelhart,
                Hinton &amp; Williams phổ biến thuật toán{" "}
                <TopicLink slug="backpropagation">
                  lan truyền ngược
                </TopicLink>
                , đòi hỏi activation phải khả vi. Sigmoid trở thành lựa chọn
                chuẩn vì vừa trơn, vừa có đạo hàm đẹp (σ&apos; = σ(1-σ)). Tanh
                xuất hiện không lâu sau — đối xứng quanh 0 giúp mean của lớp ẩn
                gần 0, tốc độ hội tụ tốt hơn sigmoid một chút.
              </p>
              <p>
                <strong>2010 — ReLU được Nair &amp; Hinton giới thiệu lại.</strong>{" "}
                Trong bài báo về Restricted Boltzmann Machines, họ chứng minh
                rectified linear units (hàm đã có từ thập niên 1970 trong
                neuroscience) học tốt hơn sigmoid cho mạng sâu.
              </p>
              <p>
                <strong>2012 — AlexNet (Krizhevsky, Sutskever, Hinton).</strong>{" "}
                Chiến thắng cuộc thi ImageNet bằng mạng CNN 8 lớp dùng ReLU. Đây
                là khoảnh khắc deep learning hiện đại ra đời. Tác giả viết rõ:
                &quot;ReLU làm cho mạng sâu hội tụ nhanh hơn 6 lần so với
                tanh.&quot;
              </p>
              <p>
                <strong>2013 — Leaky ReLU.</strong> Maas, Hannun &amp; Ng đề xuất
                cho vùng âm một độ dốc nhỏ α = 0.01 để tránh dying neuron.
              </p>
              <p>
                <strong>2015 — ELU.</strong> Clevert và cộng sự đưa ra
                Exponential Linear Unit — mượt ở vùng âm, trung bình gần 0, hội
                tụ nhanh hơn ReLU trên một số bài toán.
              </p>
              <p>
                <strong>2016 — GELU.</strong> Hendrycks &amp; Gimpel đưa ra GELU
                (Gaussian Error Linear Unit) — hiện là mặc định trong BERT (2018)
                và GPT-2/3 (2019–2020). Sau đó xuất hiện thêm <em>Swish</em> của
                Google (x · sigmoid(βx), 2017) và <em>Mish</em> (Misra, 2019).
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Cạm bẫy phổ biến khi triển khai activation">
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                <strong>1. Softmax + CrossEntropyLoss trùng nhau.</strong> Trong
                PyTorch, <code>CrossEntropyLoss</code> đã áp dụng log-softmax
                bên trong. Nếu bạn cũng đặt <code>Softmax()</code> ở lớp cuối
                của model, loss sẽ tính log-softmax HAI lần → gradient sai, mất
                ổn định số học. Giải pháp: bỏ softmax khỏi model, để loss lo.
              </p>
              <p>
                <strong>2. Đặt ReLU ở lớp đầu ra hồi quy.</strong> Nếu target có
                thể âm (ví dụ change-in-price), ReLU sẽ cắt mất toàn bộ phần âm
                — model không bao giờ dự đoán đúng. Dùng tuyến tính (không
                activation) cho hồi quy.
              </p>
              <p>
                <strong>3. Sigmoid ở lớp ẩn của mạng sâu.</strong> 10 lớp
                sigmoid = gradient giảm (0.25)^10 ≈ 10^-6. Mạng cơ bản không học
                được. Ngoại lệ: LSTM/GRU cố tình dùng sigmoid cho cổng vì cần
                giá trị trong (0,1).
              </p>
              <p>
                <strong>4. Quên Batch/Layer Normalization.</strong> ReLU/GELU
                hoạt động tốt khi pre-activation có phân phối tương đối chuẩn.
                Nếu không có{" "}
                <TopicLink slug="batch-normalization">BatchNorm</TopicLink> hoặc
                LayerNorm, các activation ở sâu có thể bị lệch mạnh — tăng rủi
                ro dying ReLU hoặc saturation.
              </p>
              <p>
                <strong>5. Khởi tạo không khớp với activation.</strong>{" "}
                <em>He init</em> thiết kế cho ReLU (nhân với √(2/n_in)), còn{" "}
                <em>Xavier/Glorot init</em> cho tanh/sigmoid (√(1/n_in)). Dùng
                sai loại khởi tạo sẽ khiến mạng khó hội tụ — một trong những lỗi
                hay gặp nhất của người mới.
              </p>
              <p>
                <strong>6. So sánh activation bằng 1 run duy nhất.</strong> Hãy
                chạy ít nhất 3–5 seed khác nhau. Chênh lệch giữa ReLU, GELU,
                Swish trên cùng bài toán thường nhỏ và nằm trong dao động seed.
              </p>
            </div>
          </CollapsibleDetail>
        </div>
      </LessonSection>

      {/* =====================================================
       *  STEP 10: SUMMARY + QUIZ
       * ===================================================== */}
      <LessonSection step={10} totalSteps={10} label="Tóm tắt & Kiểm tra">
        <MiniSummary
          title="Hàm kích hoạt — Điểm chốt"
          points={[
            "Hàm kích hoạt thêm tính phi tuyến — nền tảng của mọi kiến trúc mạng nơ-ron hiện đại. Không có nó, một mạng bao nhiêu lớp cũng chỉ tương đương một phép biến đổi tuyến tính.",
            "ReLU là mặc định cho CNN/MLP: nhanh, gradient ổn định ở vùng dương, nhưng có thể gây dying neuron. GELU là mặc định cho Transformer.",
            "Sigmoid (0-1) cho đầu ra nhị phân và LSTM gate; Softmax cho phân loại đa lớp; Tanh cho RNN candidate state.",
            "Triệt tiêu gradient: sigmoid/tanh nén gradient về ~0 ở vùng bão hoà — trong mạng sâu, điều này nhân qua nhiều lớp thành số cực nhỏ, không học được.",
            "Dying ReLU: khi pre-activation luôn âm, gradient bằng 0 và trọng số không cập nhật. Giải pháp: Leaky ReLU, ELU, He init, learning rate nhỏ.",
            "Lịch sử: từ step của Rosenblatt (1958) → sigmoid (1986) → ReLU của AlexNet (2012) → GELU của BERT/GPT (2016+). Mỗi bước nhảy tương ứng với một thế hệ mô hình mới.",
          ]}
        />

        <div className="mt-6">
          <QuizSection questions={quizQuestions} />
        </div>
      </LessonSection>
    </>
  );
}
