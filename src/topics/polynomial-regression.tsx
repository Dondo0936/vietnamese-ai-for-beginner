"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, SliderGroup,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "polynomial-regression",
  title: "Polynomial Regression",
  titleVi: "Hồi quy đa thức",
  description: "Mở rộng hồi quy tuyến tính bằng cách dùng đường cong bậc cao để khớp dữ liệu phức tạp hơn",
  category: "classic-ml",
  tags: ["regression", "supervised-learning", "overfitting"],
  difficulty: "beginner",
  relatedSlugs: ["linear-regression", "bias-variance", "cross-validation"],
  vizType: "interactive",
};

/* ── Data & fitting ── */
type Pt = { x: number; y: number };

const DATA: Pt[] = [
  { x: 30, y: 250 }, { x: 80, y: 175 }, { x: 130, y: 115 },
  { x: 200, y: 85 },  { x: 260, y: 100 }, { x: 320, y: 155 },
  { x: 400, y: 245 }, { x: 450, y: 275 },
];

/* Simple polynomial regression via normal equations on normalised x */
function polyCoeffs(pts: Pt[], degree: number): number[] {
  const n = pts.length;
  const xs = pts.map((p) => p.x / 500);
  const ys = pts.map((p) => p.y);

  /* Build Vandermonde matrix X and solve X^T X c = X^T y via simple Gaussian elimination */
  const d = degree + 1;
  const XtX: number[][] = Array.from({ length: d }, () => Array(d).fill(0));
  const Xty: number[] = Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      const xj = Math.pow(xs[i], j);
      Xty[j] += xj * ys[i];
      for (let k = 0; k < d; k++) {
        XtX[j][k] += xj * Math.pow(xs[i], k);
      }
    }
  }

  /* Gaussian elimination */
  const A = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < d; col++) {
    let max = col;
    for (let row = col + 1; row < d; row++) if (Math.abs(A[row][col]) > Math.abs(A[max][col])) max = row;
    [A[col], A[max]] = [A[max], A[col]];
    if (Math.abs(A[col][col]) < 1e-12) continue;
    for (let row = col + 1; row < d; row++) {
      const f = A[row][col] / A[col][col];
      for (let j = col; j <= d; j++) A[row][j] -= f * A[col][j];
    }
  }
  const c = Array(d).fill(0);
  for (let i = d - 1; i >= 0; i--) {
    c[i] = A[i][d];
    for (let j = i + 1; j < d; j++) c[i] -= A[i][j] * c[j];
    c[i] /= A[i][i] || 1;
  }
  return c;
}

function evalPoly(coeffs: number[], xRaw: number) {
  const xn = xRaw / 500;
  return coeffs.reduce((s, c, i) => s + c * Math.pow(xn, i), 0);
}

function curvePath(coeffs: number[]): string {
  const steps = 120;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const x = (i / steps) * 500;
    const y = Math.max(-20, Math.min(340, evalPoly(coeffs, x)));
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function computeMSE(pts: Pt[], coeffs: number[]) {
  return pts.reduce((s, p) => s + (p.y - evalPoly(coeffs, p.x)) ** 2, 0) / pts.length;
}

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function PolynomialRegressionTopic() {
  const [degree, setDegree] = useState(2);
  const [userPoints, setUserPoints] = useState<Pt[]>(DATA);

  const coeffs = useMemo(() => polyCoeffs(userPoints, degree), [userPoints, degree]);
  const path = useMemo(() => curvePath(coeffs), [coeffs]);
  const currentMSE = useMemo(() => computeMSE(userPoints, coeffs), [userPoints, coeffs]);

  /* For comparison: train vs "test" MSE */
  const coeffsLow = useMemo(() => polyCoeffs(userPoints, 1), [userPoints]);
  const coeffsHigh = useMemo(() => polyCoeffs(userPoints, 7), [userPoints]);
  const mseLow = useMemo(() => computeMSE(userPoints, coeffsLow), [userPoints, coeffsLow]);
  const mseHigh = useMemo(() => computeMSE(userPoints, coeffsHigh), [userPoints, coeffsHigh]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (500 / rect.width);
    const y = (e.clientY - rect.top) * (320 / rect.height);
    setUserPoints((prev) => [...prev, { x, y }]);
  }, []);

  const degreeLabel = degree === 1 ? "Bậc 1 — đường thẳng"
    : degree <= 3 ? `Bậc ${degree} — vừa phải`
    : degree <= 5 ? `Bậc ${degree} — phức tạp`
    : `Bậc ${degree} — quá khớp!`;

  const degreeColor = degree <= 3 ? "#3b82f6" : degree <= 5 ? "#f59e0b" : "#ef4444";

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Khi tăng bậc đa thức, training error (sai số trên tập huấn luyện) thường thay đổi thế nào?",
      options: ["Tăng dần", "Giảm dần (có thể về 0)", "Không thay đổi"],
      correct: 1,
      explanation: "Bậc cao hơn = mô hình linh hoạt hơn → khớp dữ liệu huấn luyện tốt hơn. Bậc >= n-1 (n = số điểm) có thể khớp hoàn hảo mọi điểm, MSE = 0.",
    },
    {
      question: "Mô hình bậc 20 khớp hoàn hảo 10 điểm huấn luyện. Dự đoán trên dữ liệu mới có tốt không?",
      options: ["Rất tốt vì training error = 0", "Thường rất tệ — đây là overfitting", "Tuỳ vào dữ liệu"],
      correct: 1,
      explanation: "Training error = 0 không có nghĩa mô hình tốt! Bậc quá cao học thuộc noise thay vì pattern thật → dự đoán tệ trên dữ liệu mới. Đây chính là overfitting.",
    },
    {
      question: "Cách nào giúp chọn bậc đa thức phù hợp?",
      options: ["Luôn chọn bậc cao nhất có thể", "Dùng cross-validation để so sánh các bậc", "Chọn bậc = số điểm dữ liệu"],
      correct: 1,
      explanation: "Cross-validation chia dữ liệu thành train/test nhiều lần → đánh giá sai số thật sự trên dữ liệu mới → chọn bậc cho validation error thấp nhất.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Doanh thu quán cà phê theo tháng: Tháng 1 thấp, tháng 6 cao nhất, tháng 12 lại thấp. Bạn muốn dự đoán doanh thu tháng 8. Dùng đường thẳng có ổn không?"
          options={[
            "Dùng đường thẳng được — cứ nối hai điểm đầu cuối",
            "Không — dữ liệu cong như parabol, cần đường cong",
            "Cần mô hình AI phức tạp, đường cong đơn giản không đủ",
          ]}
          correct={1}
          explanation="Doanh thu lên rồi xuống — hình parabol! Đường thẳng sẽ bỏ lỡ đỉnh tháng 6. Đây chính là lúc cần hồi quy đa thức."
        >

      {/* STEP 2: INTERACTIVE VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo thanh trượt bậc đa thức từ 1 đến 7. Quan sát đường cong thay đổi — và chú ý khi nào nó bắt đầu &quot;ngoằn ngoèo&quot; vô lý.
          <strong className="text-foreground">{" "}Nhấp vào canvas để thêm điểm.</strong>
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg
              viewBox="0 0 500 320"
              className="w-full cursor-crosshair rounded-lg border border-border bg-background"
              onClick={handleCanvasClick}
            >
              {/* Grid */}
              {[0, 80, 160, 240, 320].map((y) => (
                <line key={`g-${y}`} x1={0} y1={y} x2={500} y2={y} stroke="currentColor" className="text-border" strokeWidth={0.5} />
              ))}

              {/* Curve */}
              <motion.path
                d={path} fill="none" stroke={degreeColor} strokeWidth={2.5}
                initial={false}
                animate={{ d: path }}
                transition={{ duration: 0.3 }}
              />

              {/* Data points */}
              {userPoints.map((p, i) => (
                <circle key={`p-${i}`} cx={p.x} cy={p.y} r={5} fill="#f97316" stroke="#fff" strokeWidth={2} />
              ))}

              {/* Labels */}
              <text x={10} y={20} fontSize={12} fill={degreeColor} fontWeight={600}>
                {degreeLabel}
              </text>
              <text x={10} y={38} fontSize={11} fill="currentColor" className="text-muted">
                MSE = {currentMSE.toFixed(1)}
              </text>
            </svg>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-foreground whitespace-nowrap">Bậc đa thức:</label>
              <input
                type="range" min={1} max={7} value={degree}
                onChange={(e) => setDegree(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="w-8 text-center text-sm font-bold" style={{ color: degreeColor }}>{degree}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setUserPoints(DATA)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Đặt lại
              </button>
              <span className="ml-auto text-xs text-muted">{userPoints.length} điểm</span>
            </div>

            {/* Quick MSE comparison */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-border p-2">
                <div className="font-bold text-blue-500">Bậc 1</div>
                <div className="text-muted">MSE = {mseLow.toFixed(0)}</div>
              </div>
              <div className="rounded-lg border border-border p-2" style={{ borderColor: degreeColor }}>
                <div className="font-bold" style={{ color: degreeColor }}>Bậc {degree}</div>
                <div className="text-muted">MSE = {currentMSE.toFixed(0)}</div>
              </div>
              <div className="rounded-lg border border-border p-2">
                <div className="font-bold text-red-500">Bậc 7</div>
                <div className="text-muted">MSE = {mseHigh.toFixed(0)}</div>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Hồi quy đa thức</strong>{" "}
            nới lỏng ràng buộc đường thẳng — cho phép đường cong uốn lượn. Nhưng bạn vừa thấy: bậc quá cao thì đường cong ngoằn ngoèo qua từng điểm — nó &quot;học thuộc&quot; thay vì &quot;hiểu&quot; dữ liệu!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Bạn có 8 điểm dữ liệu và dùng đa thức bậc 7 (7 = n-1). Điều gì xảy ra?"
          options={[
            "Đường cong mượt, dự đoán tốt",
            "Đường cong đi qua MỌI điểm, MSE = 0 nhưng dự đoán tệ ở giữa",
            "Thuật toán không giải được",
          ]}
          correct={1}
          explanation="Đa thức bậc n-1 luôn khớp hoàn hảo n điểm (nội suy Lagrange). Training MSE = 0 nhưng giữa các điểm, đường cong dao động mạnh — đây là overfitting điển hình!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Hồi quy đa thức</strong>{" "}
            mở rộng hồi quy tuyến tính bằng cách thêm các luỹ thừa của x:
          </p>

          <LaTeX block>{"\\hat{y} = w_0 + w_1 x + w_2 x^2 + \\cdots + w_d x^d"}</LaTeX>

          <p>
            Đây thực chất vẫn là hồi quy tuyến tính — tuyến tính theo <strong>tham số</strong>{" "}
            w, chỉ phi tuyến theo x. Ta tạo feature mới <LaTeX>{"x^2, x^3, \\ldots"}</LaTeX> rồi áp dụng OLS bình thường.
          </p>

          <Callout variant="tip" title="Ví dụ thực tế: giá xe máy cũ">
            Giá xe Honda Wave theo tuổi xe: năm đầu mất giá nhanh, rồi chậm dần, rồi gần như không đổi. Đường thẳng không mô tả được — đa thức bậc 2-3 khớp tốt hơn nhiều.
          </Callout>

          <p>
            <strong>Vấn đề overfitting:</strong>{" "}
            Bậc cao → mô hình linh hoạt quá → học thuộc noise. Giải pháp:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li><strong>Cross-validation:</strong>{" "}Chọn bậc cho validation error thấp nhất.</li>
            <li><strong>Regularization (Ridge/Lasso):</strong>{" "}Phạt hệ số lớn để đường cong mượt hơn.</li>
          </ul>

          <LaTeX block>{"\\text{Ridge: } \\min_w \\sum (y_i - \\hat{y}_i)^2 + \\lambda \\sum w_j^2"}</LaTeX>

          <CodeBlock language="python" title="Hồi quy đa thức với scikit-learn">
{`from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.pipeline import make_pipeline
import numpy as np

X = np.array([1, 2, 3, 4, 5, 6]).reshape(-1, 1)
y = np.array([2.5, 3.8, 7.0, 8.2, 6.5, 4.0])

# Đa thức bậc 2 (phù hợp)
model_2 = make_pipeline(PolynomialFeatures(2), LinearRegression())
model_2.fit(X, y)
print(f"Bậc 2 - R²: {model_2.score(X, y):.3f}")

# Đa thức bậc 5 + Ridge (tránh overfitting)
model_5 = make_pipeline(PolynomialFeatures(5), Ridge(alpha=1.0))
model_5.fit(X, y)
print(f"Bậc 5 Ridge - R²: {model_5.score(X, y):.3f}")`}
          </CodeBlock>

          <Callout variant="warning" title="Bias-Variance tradeoff">
            Bậc thấp = bias cao (underfitting). Bậc cao = variance cao (overfitting). Mục tiêu là tìm &quot;điểm ngọt&quot; ở giữa — đủ phức tạp để nắm pattern, đủ đơn giản để không học noise.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Hồi quy đa thức thêm x², x³, ... vào hồi quy tuyến tính để khớp dữ liệu phi tuyến.",
          "Training MSE luôn giảm khi tăng bậc — nhưng đừng bị lừa! MSE trên dữ liệu mới mới quan trọng.",
          "Bậc quá cao → overfitting: đường cong ngoằn ngoèo, học thuộc noise thay vì pattern.",
          "Cross-validation giúp chọn bậc tối ưu, Regularization (Ridge/Lasso) giúp kiểm soát overfitting.",
          "Ví dụ thực tế: giá xe cũ, doanh thu theo mùa, tốc độ tăng trưởng — dữ liệu cong cần đa thức.",
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
