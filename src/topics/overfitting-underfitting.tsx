"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "overfitting-underfitting",
  title: "Overfitting & Underfitting",
  titleVi: "Quá khớp & Chưa khớp",
  description:
    "Hai vấn đề đối lập khi huấn luyện mô hình: học quá ít hoặc học quá nhiều từ dữ liệu.",
  category: "neural-fundamentals",
  tags: ["training", "generalization", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["regularization", "epochs-batches", "loss-functions"],
  vizType: "interactive",
};

/* ---------- data & helpers ---------- */
const DATA_POINTS = [
  { x: 0.5, y: 1.2 },
  { x: 1.0, y: 2.1 },
  { x: 1.5, y: 2.5 },
  { x: 2.0, y: 2.0 },
  { x: 2.5, y: 1.5 },
  { x: 3.0, y: 1.8 },
  { x: 3.5, y: 2.8 },
  { x: 4.0, y: 3.5 },
  { x: 4.5, y: 3.2 },
  { x: 5.0, y: 2.0 },
  { x: 5.5, y: 1.4 },
  { x: 6.0, y: 1.9 },
];

// Test points (slightly offset from training data)
const TEST_POINTS = [
  { x: 0.8, y: 1.6 },
  { x: 1.8, y: 2.3 },
  { x: 2.8, y: 1.6 },
  { x: 3.3, y: 2.4 },
  { x: 4.3, y: 3.4 },
  { x: 5.3, y: 1.7 },
];

const SVG_W = 480;
const SVG_H = 260;
const PAD = 38;

function toX(v: number) {
  return PAD + ((v - 0) / 7) * (SVG_W - 2 * PAD);
}
function toY(v: number) {
  return SVG_H - PAD - ((v - 0) / 5) * (SVG_H - 2 * PAD);
}

/* ---------- main component ---------- */
export default function OverfittingUnderfittingTopic() {
  const [complexity, setComplexity] = useState(3);
  const [showTestData, setShowTestData] = useState(false);
  const [epoch, setEpoch] = useState(50); // for training curves

  // Generate fit curve
  const fittingCurve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * 7;
      let y: number;
      if (complexity <= 1) {
        // Underfit: straight line
        y = 1.5 + 0.15 * x;
      } else if (complexity <= 4) {
        // Good fit: smooth curve
        const t = complexity / 4;
        y = 1.0 + 1.5 * Math.sin(x * 0.8) * t + 0.3 * x * t;
      } else {
        // Overfit: wild oscillations
        const wave =
          Math.sin(x * complexity * 0.6) * (complexity * 0.18);
        const base = 1.0 + 1.5 * Math.sin(x * 0.8) + 0.3 * x * 0.7;
        y = base + wave;
      }
      y = Math.max(0.2, Math.min(4.8, y));
      pts.push(`${toX(x)},${toY(y)}`);
    }
    return pts.join(" ");
  }, [complexity]);

  // Compute train/test errors
  const errors = useMemo(() => {
    const predict = (x: number): number => {
      if (complexity <= 1) return 1.5 + 0.15 * x;
      if (complexity <= 4) {
        const t = complexity / 4;
        return 1.0 + 1.5 * Math.sin(x * 0.8) * t + 0.3 * x * t;
      }
      const wave =
        Math.sin(x * complexity * 0.6) * (complexity * 0.18);
      const base = 1.0 + 1.5 * Math.sin(x * 0.8) + 0.3 * x * 0.7;
      return base + wave;
    };

    const trainErr =
      DATA_POINTS.reduce(
        (sum, p) => sum + (predict(p.x) - p.y) ** 2,
        0
      ) / DATA_POINTS.length;
    const testErr =
      TEST_POINTS.reduce(
        (sum, p) => sum + (predict(p.x) - p.y) ** 2,
        0
      ) / TEST_POINTS.length;

    return { train: trainErr, test: testErr };
  }, [complexity]);

  // Status
  const status = useMemo(() => {
    if (complexity <= 1)
      return {
        text: "Chưa khớp (Underfitting)",
        color: "#3b82f6",
        desc: "Mô hình quá đơn giản — không nắm được pattern trong dữ liệu",
      };
    if (complexity <= 4)
      return {
        text: "Khớp tốt (Good Fit)",
        color: "#22c55e",
        desc: "Mô hình vừa phức tạp vừa đủ — nắm pattern mà không thuộc lòng nhiễu",
      };
    return {
      text: "Quá khớp (Overfitting)",
      color: "#ef4444",
      desc: "Mô hình quá phức tạp — 'thuộc lòng' cả nhiễu trong dữ liệu huấn luyện",
    };
  }, [complexity]);

  // Training curves data
  const trainingCurves = useMemo(() => {
    const trainLoss: number[] = [];
    const valLoss: number[] = [];
    for (let e = 0; e <= 100; e++) {
      // Train loss always decreases
      trainLoss.push(2.5 * Math.exp(-e / 15) + 0.1);
      // Val loss: depends on when overfitting starts
      if (e < 30) {
        valLoss.push(2.8 * Math.exp(-e / 18) + 0.15);
      } else {
        const base = 2.8 * Math.exp(-30 / 18) + 0.15;
        valLoss.push(base + (e - 30) * 0.012);
      }
    }
    return { trainLoss, valLoss };
  }, []);

  /* Quiz */
  const quizQuestions: QuizQuestion[] = [
    {
      question:
        "Train loss = 0.01, Validation loss = 2.5. Mô hình đang gặp vấn đề gì?",
      options: [
        "Underfitting — mô hình quá đơn giản",
        "Overfitting — mô hình thuộc lòng dữ liệu train nhưng kém trên dữ liệu mới",
        "Good fit — loss train thấp là tốt",
        "Không đủ thông tin để kết luận",
      ],
      correct: 1,
      explanation:
        "Khoảng cách lớn giữa train loss (0.01) và val loss (2.5) là dấu hiệu rõ ràng của overfitting. Mô hình 'thuộc lòng' train data nhưng không tổng quát hóa được.",
    },
    {
      question:
        "Cách nào KHÔNG giúp giảm overfitting?",
      options: [
        "Thêm Dropout",
        "Tăng số lượng dữ liệu huấn luyện",
        "Tăng số lớp và nơ-ron trong mạng",
        "Dùng Early Stopping",
      ],
      correct: 2,
      explanation:
        "Tăng kích thước mạng = tăng độ phức tạp = dễ overfit hơn! Dropout, thêm dữ liệu, early stopping đều GIẢM overfitting.",
    },
    {
      question: "Early stopping dừng huấn luyện khi nào?",
      options: [
        "Khi train loss = 0",
        "Khi validation loss bắt đầu tăng trở lại sau khi giảm",
        "Sau đúng 100 epoch",
        "Khi learning rate quá nhỏ",
      ],
      correct: 1,
      explanation:
        "Validation loss giảm → mô hình đang học tốt. Khi val loss tăng lại → bắt đầu overfit. Early stopping lưu mô hình tốt nhất và dừng, tránh overfit.",
    },
    {
      type: "fill-blank",
      question: "Nếu train loss = 0.05 và val loss = 0.06, khoảng cách nhỏ và cả hai đều cao, mô hình đang bị {blank}. Nếu train loss = 0.01 nhưng val loss = 1.8, mô hình đang bị {blank}.",
      blanks: [
        { answer: "underfitting", accept: ["chưa khớp", "underfit"] },
        { answer: "overfitting", accept: ["quá khớp", "overfit"] },
      ],
      explanation: "Underfitting: cả hai loss cao, khoảng cách nhỏ — mô hình chưa học đủ. Overfitting: train loss thấp nhưng val loss cao — mô hình học thuộc train data nhưng không generalize được.",
    },
  ];

  return (
    <>
      {/* ===== STEP 1: PREDICTION GATE ===== */}
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn ôn thi bằng cách học thuộc lòng 100 bài tập mẫu (kể cả đáp án sai trong sách). Vào phòng thi gặp đề mới, kết quả sẽ thế nào?"
          options={[
            "Điểm cao — vì đã thuộc nhiều bài",
            "Điểm thấp — vì chỉ thuộc bài cũ, không hiểu bản chất để giải bài mới",
            "Điểm trung bình — thuộc lòng vẫn có ích",
            "Không ảnh hưởng",
          ]}
          correct={1}
          explanation="Thuộc lòng mà không hiểu = Overfitting! Mô hình 'thuộc' dữ liệu huấn luyện (kể cả nhiễu) nhưng thất bại trên dữ liệu mới. Giống sinh viên học vẹt vậy."
        >
          <p className="mt-4 text-sm text-muted leading-relaxed">
            Bây giờ hãy <strong className="text-foreground">kéo thanh phức tạp</strong>{" "}
            để xem mô hình đơn giản (underfitting) vs phức tạp (overfitting)
            khác nhau thế nào khi gặp dữ liệu mới.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ===== STEP 2: INTERACTIVE FIT EXPLORER ===== */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            {/* Complexity slider */}
            <div className="space-y-2 max-w-lg mx-auto">
              <label className="text-sm font-medium text-muted">
                Độ phức tạp mô hình:{" "}
                <strong className="text-foreground">{complexity}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={complexity}
                onChange={(e) =>
                  setComplexity(parseInt(e.target.value))
                }
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted">
                <span>Đơn giản (Underfit)</span>
                <span>Vừa phải</span>
                <span>Phức tạp (Overfit)</span>
              </div>
            </div>

            {/* Show test data toggle */}
            <div className="flex justify-center">
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTestData}
                  onChange={(e) => setShowTestData(e.target.checked)}
                  className="accent-accent"
                />
                Hiện dữ liệu test (dữ liệu mới, chưa từng thấy)
              </label>
            </div>

            {/* Status */}
            <div
              className="rounded-lg p-3 text-center"
              style={{
                color: status.color,
                backgroundColor: `${status.color}15`,
                border: `1px solid ${status.color}40`,
              }}
            >
              <p className="text-sm font-semibold">{status.text}</p>
              <p className="text-xs opacity-80 mt-1">{status.desc}</p>
            </div>

            {/* Graph */}
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-xl mx-auto"
            >
              {/* Axes */}
              <line
                x1={PAD}
                y1={SVG_H - PAD}
                x2={SVG_W - PAD}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />
              <line
                x1={PAD}
                y1={PAD}
                x2={PAD}
                y2={SVG_H - PAD}
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Fitting curve */}
              <polyline
                points={fittingCurve}
                fill="none"
                stroke={status.color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Training data (orange) */}
              {DATA_POINTS.map((p, i) => (
                <circle
                  key={`train-${i}`}
                  cx={toX(p.x)}
                  cy={toY(p.y)}
                  r="5"
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth="1.5"
                />
              ))}

              {/* Test data (cyan, shown conditionally) */}
              {showTestData &&
                TEST_POINTS.map((p, i) => (
                  <g key={`test-${i}`}>
                    <circle
                      cx={toX(p.x)}
                      cy={toY(p.y)}
                      r="5"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                    />
                    <circle
                      cx={toX(p.x)}
                      cy={toY(p.y)}
                      r="2"
                      fill="#06b6d4"
                    />
                  </g>
                ))}

              {/* Legend */}
              <circle cx={PAD + 10} cy={15} r="4" fill="#f59e0b" />
              <text x={PAD + 20} y={19} fill="#f59e0b" fontSize="9">
                Train
              </text>
              {showTestData && (
                <>
                  <circle
                    cx={PAD + 70}
                    cy={15}
                    r="4"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                  <text
                    x={PAD + 80}
                    y={19}
                    fill="#06b6d4"
                    fontSize="9"
                  >
                    Test
                  </text>
                </>
              )}
            </svg>

            {/* Error comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
                <p className="text-xs text-muted mb-1">
                  Lỗi trên dữ liệu train
                </p>
                <p
                  className="text-xl font-bold"
                  style={{ color: status.color }}
                >
                  {errors.train.toFixed(3)}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
                <p className="text-xs text-muted mb-1">
                  Lỗi trên dữ liệu test
                </p>
                <p
                  className="text-xl font-bold"
                  style={{
                    color:
                      errors.test > errors.train * 2
                        ? "#ef4444"
                        : status.color,
                  }}
                >
                  {errors.test.toFixed(3)}
                </p>
                {errors.test > errors.train * 2 && (
                  <p className="text-[10px] text-red-400 mt-1">
                    Test error &gt;&gt; Train error = overfitting!
                  </p>
                )}
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 3: AHA MOMENT ===== */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Mục tiêu cuối cùng không phải loss thấp trên dữ liệu train</strong>{" "}
            — mà là hoạt động tốt trên dữ liệu <em>chưa từng thấy</em>. Overfit = điểm
            cao bài tập về nhà nhưng thi rớt. Good fit = hiểu bản chất, thi đạt điểm cao.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ===== STEP 4: TRAINING CURVES ===== */}
      <LessonSection step={4} totalSteps={8} label="Đường cong huấn luyện">
        <VisualizationSection>
          <div className="space-y-3">
            <p className="text-sm text-center text-muted">
              Đường cong loss theo epoch — dấu hiệu nhận biết overfitting kinh điển
            </p>

            <svg
              viewBox={`0 0 ${SVG_W} 200`}
              className="w-full max-w-xl mx-auto"
            >
              {/* Axes */}
              <line
                x1={PAD}
                y1={170}
                x2={SVG_W - PAD}
                y2={170}
                stroke="#334155"
                strokeWidth="1"
              />
              <line
                x1={PAD}
                y1={20}
                x2={PAD}
                y2={170}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={SVG_W / 2}
                y={192}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
              >
                Epoch
              </text>
              <text
                x={12}
                y={95}
                fill="#64748b"
                fontSize="10"
                transform="rotate(-90, 12, 95)"
              >
                Loss
              </text>

              {/* Epoch marker line */}
              <line
                x1={PAD + (epoch / 100) * (SVG_W - 2 * PAD)}
                y1={20}
                x2={PAD + (epoch / 100) * (SVG_W - 2 * PAD)}
                y2={170}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity={0.6}
              />

              {/* Early stopping line */}
              <line
                x1={PAD + (30 / 100) * (SVG_W - 2 * PAD)}
                y1={20}
                x2={PAD + (30 / 100) * (SVG_W - 2 * PAD)}
                y2={170}
                stroke="#22c55e"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity={0.4}
              />
              <text
                x={PAD + (30 / 100) * (SVG_W - 2 * PAD)}
                y={15}
                textAnchor="middle"
                fill="#22c55e"
                fontSize="8"
              >
                Early Stop
              </text>

              {/* Train loss curve */}
              <polyline
                points={trainingCurves.trainLoss
                  .slice(0, epoch + 1)
                  .map(
                    (l, i) =>
                      `${PAD + (i / 100) * (SVG_W - 2 * PAD)},${170 - (l / 3) * 150}`
                  )
                  .join(" ")}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />

              {/* Val loss curve */}
              <polyline
                points={trainingCurves.valLoss
                  .slice(0, epoch + 1)
                  .map(
                    (l, i) =>
                      `${PAD + (i / 100) * (SVG_W - 2 * PAD)},${170 - (l / 3) * 150}`
                  )
                  .join(" ")}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="6,3"
              />

              {/* Legend */}
              <line x1={PAD + 5} y1={25} x2={PAD + 25} y2={25} stroke="#3b82f6" strokeWidth="2" />
              <text x={PAD + 30} y={29} fill="#3b82f6" fontSize="9">
                Train loss
              </text>
              <line
                x1={PAD + 105}
                y1={25}
                x2={PAD + 125}
                y2={25}
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="4,2"
              />
              <text x={PAD + 130} y={29} fill="#ef4444" fontSize="9">
                Val loss
              </text>
            </svg>

            {/* Epoch slider */}
            <div className="space-y-1 max-w-lg mx-auto">
              <label className="text-sm font-medium text-muted">
                Epoch:{" "}
                <strong className="text-foreground">{epoch}</strong>
                {epoch > 30 && (
                  <span className="text-red-400 text-xs ml-2">
                    Val loss đang tăng → overfitting!
                  </span>
                )}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={epoch}
                onChange={(e) => setEpoch(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ===== STEP 5: INLINE CHALLENGE ===== */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Mô hình có train loss giảm đều nhưng val loss tăng từ epoch 30. Bạn nên dùng epoch bao nhiêu?"
          options={[
            "100 — train càng lâu càng tốt",
            "30 — dừng tại điểm val loss thấp nhất (early stopping)",
            "50 — lấy trung bình giữa train và val",
          ]}
          correct={1}
          explanation="Early stopping: lưu mô hình tại epoch có val loss thấp nhất (epoch 30). Sau đó mô hình bắt đầu overfit — train tiếp chỉ làm tệ hơn trên dữ liệu mới."
        />
      </LessonSection>

      {/* ===== STEP 6: EXPLANATION ===== */}
      <LessonSection step={6} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Overfitting</strong> và <strong>Underfitting</strong>{" "}
            là hai mặt của cùng một đồng xu:{" "}
            <TopicLink slug="bias-variance"><strong>bias-variance tradeoff</strong></TopicLink>.
          </p>

          <LaTeX block>
            {"\\text{Tổng lỗi} = \\text{Bias}^2 + \\text{Variance} + \\text{Noise}"}
          </LaTeX>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground" />
                  <th className="text-left py-2 pr-3 font-semibold text-blue-400">
                    Underfitting
                  </th>
                  <th className="text-left py-2 pr-3 font-semibold text-green-400">
                    Good Fit
                  </th>
                  <th className="text-left py-2 font-semibold text-red-400">
                    Overfitting
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Train error</td>
                  <td className="py-2 pr-3">Cao</td>
                  <td className="py-2 pr-3">Thấp</td>
                  <td className="py-2">Rất thấp</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Test error</td>
                  <td className="py-2 pr-3">Cao</td>
                  <td className="py-2 pr-3">Thấp</td>
                  <td className="py-2">Cao</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium">Bias</td>
                  <td className="py-2 pr-3">Cao</td>
                  <td className="py-2 pr-3">Vừa</td>
                  <td className="py-2">Thấp</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">Variance</td>
                  <td className="py-2 pr-3">Thấp</td>
                  <td className="py-2 pr-3">Vừa</td>
                  <td className="py-2">Cao</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <strong>Cách khắc phục:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Underfitting:</strong>{" "}
              Tăng kích thước mạng, thêm lớp/nơ-ron, huấn luyện lâu hơn, giảm regularization.
            </li>
            <li>
              <strong>Overfitting:</strong>{" "}
              Thêm dữ liệu, dùng Dropout/L2, early stopping, data augmentation, giảm kích thước mạng.
              Phân tách đúng cách bằng <TopicLink slug="train-val-test">train/validation/test split</TopicLink>{" "}để phát hiện sớm.
            </li>
          </ul>

          <Callout variant="tip" title="Quy trình thực tế">
            1. Bắt đầu với mô hình đủ lớn để overfit (train loss gần 0).{"\n"}
            2. Sau đó dùng <TopicLink slug="regularization">regularization</TopicLink>{" "}để giảm overfit.{"\n"}
            3. Nếu vẫn overfit → thêm dữ liệu hoặc data augmentation.{"\n"}
            4. Đánh giá bằng <TopicLink slug="cross-validation">cross-validation</TopicLink>{" "}để ước lượng hiệu suất ổn định.{"\n"}
            Đừng bao giờ bắt đầu với mô hình quá nhỏ — underfitting khó sửa hơn overfitting!
          </Callout>

          <CodeBlock language="python" title="early_stopping.py">
{`best_val_loss = float('inf')
patience = 10
wait = 0

for epoch in range(1000):
    train_loss = train_one_epoch(model, train_loader)
    val_loss = evaluate(model, val_loader)

    if val_loss < best_val_loss:
        best_val_loss = val_loss
        torch.save(model.state_dict(), 'best_model.pt')
        wait = 0  # reset patience
    else:
        wait += 1
        if wait >= patience:
            print(f"Early stop at epoch {epoch}")
            break

# Load mô hình tốt nhất (không phải mô hình cuối!)
model.load_state_dict(torch.load('best_model.pt'))`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ===== STEP 7: MINI SUMMARY ===== */}
      <LessonSection step={7} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          title="Overfitting & Underfitting — Điểm chốt"
          points={[
            "Underfitting: mô hình quá đơn giản → train error cao, test error cao. Cần mạng lớn hơn hoặc train lâu hơn.",
            "Overfitting: mô hình 'thuộc lòng' dữ liệu → train error thấp nhưng test error cao. Cần regularization.",
            "Dấu hiệu rõ nhất: val loss tăng lại sau khi giảm = bắt đầu overfit.",
            "Early stopping: lưu mô hình tại val loss thấp nhất — kỹ thuật đơn giản nhất chống overfitting.",
            "Quy trình: bắt đầu overfit (mạng lớn) → sau đó giảm overfit (regularization, thêm dữ liệu).",
          ]}
        />
      </LessonSection>

      {/* ===== STEP 8: QUIZ ===== */}
      <LessonSection step={8} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
