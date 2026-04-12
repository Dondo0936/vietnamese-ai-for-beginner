"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
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
  description: "Vẽ đường thẳng tốt nhất qua các điểm dữ liệu để dự đoán giá trị liên tục",
  category: "classic-ml",
  tags: ["regression", "supervised-learning", "fundamentals"],
  difficulty: "beginner",
  relatedSlugs: ["polynomial-regression", "logistic-regression", "gradient-descent"],
  vizType: "interactive",
};

/* ── Utilities ── */
type Pt = { x: number; y: number };

function fitLine(points: Pt[]) {
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
  return points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0) / points.length;
}

const INITIAL_POINTS: Pt[] = [
  { x: 50, y: 270 }, { x: 100, y: 235 }, { x: 150, y: 210 },
  { x: 200, y: 175 }, { x: 270, y: 145 }, { x: 320, y: 115 },
  { x: 400, y: 80 },
];

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function LinearRegressionTopic() {
  const [points, setPoints] = useState<Pt[]>(INITIAL_POINTS);
  const [dragging, setDragging] = useState<number | null>(null);
  const [showErrors, setShowErrors] = useState(true);

  const { slope, intercept } = useMemo(() => fitLine(points), [points]);
  const lineY = useCallback((x: number) => slope * x + intercept, [slope, intercept]);
  const currentMSE = useMemo(() => mse(points, slope, intercept), [points, slope, intercept]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging !== null) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (500 / rect.width);
    const y = (e.clientY - rect.top) * (320 / rect.height);
    setPoints((prev) => [...prev, { x, y }]);
  }, [dragging]);

  const handlePointerDown = (idx: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragging(idx);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging === null) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = Math.max(0, Math.min(500, (e.clientX - rect.left) * (500 / rect.width)));
    const y = Math.max(0, Math.min(320, (e.clientY - rect.top) * (320 / rect.height)));
    setPoints((prev) => prev.map((p, i) => (i === dragging ? { x, y } : p)));
  }, [dragging]);

  const handlePointerUp = useCallback(() => setDragging(null), []);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Hồi quy tuyến tính tối thiểu hoá đại lượng nào?",
      options: [
        "Tổng khoảng cách tuyệt đối từ điểm đến đường thẳng",
        "Tổng bình phương sai số (SSE) giữa giá trị thực và dự đoán",
        "Số điểm nằm xa đường thẳng nhất",
      ],
      correct: 1,
      explanation: "Phương pháp bình phương tối thiểu (OLS) tìm đường thẳng sao cho tổng bình phương khoảng cách dọc từ mỗi điểm đến đường thẳng là nhỏ nhất.",
    },
    {
      question: "Nếu tất cả điểm dữ liệu nằm chính xác trên một đường thẳng, MSE bằng bao nhiêu?",
      options: ["1", "0", "Không xác định"],
      correct: 1,
      explanation: "Khi mọi điểm nằm trên đường hồi quy, sai số tại mỗi điểm bằng 0, nên MSE = 0. Đây là trường hợp khớp hoàn hảo.",
    },
    {
      type: "fill-blank",
      question: "Công thức hồi quy tuyến tính một biến là ŷ = {blank}x + {blank}, trong đó tham số đầu tiên là hệ số góc và tham số thứ hai là hệ số chặn.",
      blanks: [
        { answer: "w1", accept: ["w_1", "w", "slope", "a"] },
        { answer: "w0", accept: ["w_0", "b", "intercept", "bias"] },
      ],
      explanation: "ŷ = w1·x + w0 là dạng chuẩn của hồi quy tuyến tính một biến. w1 (hệ số góc) cho biết: khi x tăng 1 đơn vị, ŷ thay đổi bao nhiêu. w0 (hệ số chặn) là giá trị dự đoán khi x = 0.",
    },
    {
      question: "Khi nào hồi quy tuyến tính KHÔNG phù hợp?",
      options: [
        "Khi dữ liệu có quan hệ tuyến tính rõ ràng",
        "Khi dữ liệu có dạng đường cong (phi tuyến)",
        "Khi có nhiều điểm dữ liệu",
      ],
      correct: 1,
      explanation: "Hồi quy tuyến tính chỉ tìm đường thẳng. Nếu dữ liệu có dạng đường cong, cần dùng hồi quy đa thức hoặc mô hình phức tạp hơn.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn bán phở. Nhà hàng ghi lại: ngày nóng 35°C bán 80 tô, ngày mát 25°C bán 120 tô, ngày lạnh 18°C bán 150 tô. Ngày mai dự báo 30°C — bạn nấu bao nhiêu tô?"
          options={["Khoảng 100 tô — nội suy giữa các điểm đã biết", "150 tô — chuẩn bị nhiều cho chắc", "Không đoán được — cần thêm dữ liệu"]}
          correct={0}
          explanation="Bạn vừa tự làm hồi quy tuyến tính trong đầu! Nối các điểm (nhiệt độ, số tô) thành đường thẳng, rồi dóng từ 30°C lên để đọc kết quả."
        >

      {/* STEP 2: BRIDGE + INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Bạn vừa nội suy bằng mắt — bây giờ hãy tự tay kéo các điểm dữ liệu và xem máy tính tìm đường thẳng &quot;tốt nhất&quot; như thế nào.
          <strong className="text-foreground">{" "}Nhấp để thêm điểm, kéo để di chuyển.</strong>
        </p>

        <VisualizationSection>
          <div className="space-y-3">
            <svg
              viewBox="0 0 500 320"
              className="w-full cursor-crosshair rounded-lg border border-border bg-background touch-none"
              onClick={handleCanvasClick}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* Grid */}
              {[0, 80, 160, 240, 320].map((y) => (
                <line key={`gy-${y}`} x1={0} y1={y} x2={500} y2={y} stroke="currentColor" className="text-border" strokeWidth={0.5} />
              ))}
              {[0, 100, 200, 300, 400, 500].map((x) => (
                <line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={320} stroke="currentColor" className="text-border" strokeWidth={0.5} />
              ))}

              {/* Regression line */}
              <motion.line
                x1={0} y1={lineY(0)} x2={500} y2={lineY(500)}
                stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="8 4"
                animate={{ y1: lineY(0), y2: lineY(500) }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
              />

              {/* Error lines */}
              <AnimatePresence>
                {showErrors && points.map((p, i) => (
                  <motion.line
                    key={`err-${i}`}
                    x1={p.x} y1={p.y} x2={p.x} y2={lineY(p.x)}
                    stroke="#ef4444" strokeWidth={1.5} opacity={0.5}
                    initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
                  />
                ))}
              </AnimatePresence>

              {/* Error squares (visual) */}
              <AnimatePresence>
                {showErrors && points.map((p, i) => {
                  const err = Math.abs(p.y - lineY(p.x));
                  if (err < 3) return null;
                  const size = Math.min(err, 40);
                  const yStart = Math.min(p.y, lineY(p.x));
                  return (
                    <motion.rect
                      key={`sq-${i}`}
                      x={p.x} y={yStart} width={size} height={size}
                      fill="#ef4444" opacity={0.07}
                      initial={{ opacity: 0 }} animate={{ opacity: 0.07 }} exit={{ opacity: 0 }}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Data points */}
              {points.map((p, i) => (
                <motion.circle
                  key={`pt-${i}`} cx={p.x} cy={p.y} r={6}
                  fill="#f97316" stroke="#fff" strokeWidth={2}
                  className="cursor-grab"
                  animate={{ cx: p.x, cy: p.y }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  onPointerDown={handlePointerDown(i)}
                />
              ))}

              {/* Formula overlay */}
              <text x={10} y={20} fontSize={12} fill="#3b82f6" fontWeight={600}>
                y = {slope.toFixed(2)}x + {intercept.toFixed(0)}
              </text>
              <text x={10} y={38} fontSize={11} fill="currentColor" className="text-muted">
                MSE = {currentMSE.toFixed(1)}
              </text>
            </svg>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowErrors((v) => !v)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                {showErrors ? "Ẩn sai số" : "Hiện sai số"}
              </button>
              <button
                onClick={() => setPoints(INITIAL_POINTS)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Đặt lại
              </button>
              <span className="ml-auto text-xs text-muted">
                {points.length} điểm
              </span>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA MOMENT */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Bạn vừa thấy <strong>Hồi quy tuyến tính</strong>{" "}
            hoạt động — máy tính tìm đường thẳng sao cho các ô vuông đỏ (bình phương sai số) có tổng diện tích nhỏ nhất. Kéo một điểm ra xa để thấy MSE tăng vọt!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: INLINE CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn thêm một điểm rất xa (outlier) vào dữ liệu. Chuyện gì xảy ra với đường hồi quy?"
          options={[
            "Đường thẳng không thay đổi vì outlier bị bỏ qua",
            "Đường thẳng bị kéo lệch về phía outlier",
            "Thuật toán báo lỗi và dừng lại",
          ]}
          correct={1}
          explanation="Vì MSE dùng bình phương sai số, outlier có sai số rất lớn → bình phương càng lớn → đường hồi quy bị kéo về phía nó. Đây là nhược điểm lớn của hồi quy tuyến tính!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Hồi quy tuyến tính</strong>{" "}
            tìm hàm tuyến tính khớp dữ liệu tốt nhất theo phương pháp bình phương tối thiểu (OLS):
          </p>

          <LaTeX block>{"\\hat{y} = w_1 x + w_0"}</LaTeX>

          <p>
            Mục tiêu là tối thiểu hoá{" "}
            <strong>Mean Squared Error (MSE)</strong>{" "}
            — đây là một{" "}
            <TopicLink slug="loss-functions">hàm mất mát</TopicLink>{" "}
            phổ biến nhất cho bài toán hồi quy:
          </p>

          <LaTeX block>{"\\text{MSE} = \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2"}</LaTeX>

          <p>
            Với dữ liệu 1 biến, công thức nghiệm tối ưu cho hệ số:
          </p>

          <LaTeX block>{"w_1 = \\frac{n\\sum x_i y_i - \\sum x_i \\sum y_i}{n\\sum x_i^2 - (\\sum x_i)^2}, \\quad w_0 = \\bar{y} - w_1 \\bar{x}"}</LaTeX>

          <p>
            Trong thực tế, thay vì tìm nghiệm trực tiếp, người ta thường dùng{" "}
            <TopicLink slug="gradient-descent">gradient descent</TopicLink>{" "}
            để tối ưu dần dần — đặc biệt khi dữ liệu quá lớn để nghịch ma trận.
          </p>

          <Callout variant="tip" title="Tương tự đời thật">
            Giống như bạn bán phở và quan sát: nhiệt độ tăng → số tô giảm. Hồi quy tuyến tính giúp bạn đo chính xác mối quan hệ đó — cứ mỗi độ C tăng thêm, bán ít hơn bao nhiêu tô.
          </Callout>

          <p>
            Với nhiều biến (multiple features), mô hình mở rộng thành:
          </p>

          <LaTeX block>{"\\hat{y} = w_0 + w_1 x_1 + w_2 x_2 + \\cdots + w_d x_d = \\mathbf{w}^T \\mathbf{x}"}</LaTeX>

          <p>
            Và nghiệm OLS dạng ma trận:
          </p>

          <LaTeX block>{"\\mathbf{w} = (\\mathbf{X}^T \\mathbf{X})^{-1} \\mathbf{X}^T \\mathbf{y}"}</LaTeX>

          <CodeBlock language="python" title="Hồi quy tuyến tính với scikit-learn">
{`from sklearn.linear_model import LinearRegression
import numpy as np

# Dữ liệu: diện tích (m²) → giá nhà (tỷ VNĐ)
X = np.array([[30], [50], [70], [90], [120]])
y = np.array([1.2, 2.0, 2.8, 3.5, 4.5])

model = LinearRegression()
model.fit(X, y)

print(f"Hệ số góc (w1): {model.coef_[0]:.4f}")
print(f"Hệ số chặn (w0): {model.intercept_:.4f}")
print(f"Dự đoán nhà 80m²: {model.predict([[80]])[0]:.2f} tỷ")`}
          </CodeBlock>

          <Callout variant="warning" title="Hạn chế cần biết">
            Hồi quy tuyến tính nhạy cảm với outlier (điểm ngoại lai) và chỉ nắm bắt được quan hệ tuyến tính. Dữ liệu cong → cần hồi quy đa thức hoặc mô hình phức tạp hơn. Cũng cần chú ý đến{" "}
            <TopicLink slug="bias-variance">đánh đổi bias-variance</TopicLink>{" "}
            và nguy cơ{" "}
            <TopicLink slug="overfitting-underfitting">overfitting/underfitting</TopicLink>{" "}
            khi thêm nhiều features.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Hồi quy tuyến tính tìm đường thẳng y = wx + b tối thiểu hoá tổng bình phương sai số.",
          "MSE đo chất lượng khớp — càng nhỏ, đường thẳng càng sát dữ liệu.",
          "Nhạy cảm với outlier vì dùng bình phương → sai số lớn bị phóng đại.",
          "Mở rộng được cho nhiều biến — gọi là Multiple Linear Regression.",
          "Là nền tảng cho mọi thuật toán ML phức tạp hơn — phải nắm vững trước!",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
