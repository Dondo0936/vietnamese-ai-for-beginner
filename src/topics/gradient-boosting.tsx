"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "gradient-boosting",
  title: "Gradient Boosting",
  titleVi: "Tăng cường gradient",
  description: "Xây dựng mô hình mạnh bằng cách nối tiếp các mô hình yếu, mỗi mô hình sửa sai cho mô hình trước",
  category: "classic-ml",
  tags: ["ensemble", "boosting", "supervised-learning"],
  difficulty: "intermediate",
  relatedSlugs: ["decision-trees", "random-forests", "bias-variance"],
  vizType: "interactive",
};

/* ── Boosting simulation ── */
const TRUE_VALUES = [200, 120, 250, 80, 180, 150, 220];
const LABELS = ["HN", "SG", "ĐN", "HP", "CT", "BĐ", "HUẾ"];

/* Each round adds corrections that shrink residuals */
const CORRECTIONS = [
  [0, 0, 0, 0, 0, 0, 0],         // round 0: just the base mean
  [12, -22, 34, -38, 5, -10, 22], // round 1: first learner
  [8, -12, 16, -18, 3, -6, 12],   // round 2
  [5, -7, 9, -10, 2, -4, 7],      // round 3
  [3, -4, 5, -6, 1, -2, 4],       // round 4
  [2, -2, 3, -3, 1, -1, 2],       // round 5
];

const BASE = Math.round(TRUE_VALUES.reduce((a, b) => a + b, 0) / TRUE_VALUES.length);

function getPredictions(round: number): number[] {
  const preds = TRUE_VALUES.map(() => BASE);
  for (let r = 1; r <= Math.min(round, CORRECTIONS.length - 1); r++) {
    preds.forEach((_, i) => { preds[i] += CORRECTIONS[r][i]; });
  }
  return preds;
}

function getResiduals(preds: number[]): number[] {
  return TRUE_VALUES.map((v, i) => v - preds[i]);
}

function computeMSE(preds: number[]): number {
  return preds.reduce((s, p, i) => s + (TRUE_VALUES[i] - p) ** 2, 0) / preds.length;
}

const TOTAL_STEPS = 7;
const MAX_ROUND = CORRECTIONS.length - 1;

/* ═══════════════ MAIN ═══════════════ */
export default function GradientBoostingTopic() {
  const [round, setRound] = useState(0);

  const predictions = useMemo(() => getPredictions(round), [round]);
  const residuals = useMemo(() => getResiduals(predictions), [predictions]);
  const mse = useMemo(() => computeMSE(predictions), [predictions]);

  /* MSE history for chart */
  const mseHistory = useMemo(() =>
    Array.from({ length: MAX_ROUND + 1 }, (_, r) => computeMSE(getPredictions(r))),
  []);

  const maxVal = 280;
  const maxMSE = mseHistory[0];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Gradient Boosting và Random Forest khác nhau cơ bản ở đâu?",
      options: [
        "Random Forest dùng cây, Gradient Boosting dùng neural network",
        "Random Forest xây song song (bagging), Gradient Boosting xây nối tiếp (boosting)",
        "Gradient Boosting luôn chậm hơn Random Forest",
      ],
      correct: 1,
      explanation: "Random Forest: xây T cây độc lập → bỏ phiếu (giảm variance). Gradient Boosting: xây cây nối tiếp, mỗi cây sửa sai cho cây trước (giảm bias).",
    },
    {
      question: "Learning rate (tốc độ học) trong Gradient Boosting có tác dụng gì?",
      options: [
        "Tăng tốc độ chạy thuật toán",
        "Kiểm soát mức đóng góp của mỗi cây mới — nhỏ = học chậm nhưng ổn định",
        "Xác định số features mỗi cây xem xét",
      ],
      correct: 1,
      explanation: "Learning rate η nhân với dự đoán mỗi cây mới: F_m = F_{m-1} + η·h_m. η nhỏ (0.01-0.1) → cần nhiều cây hơn nhưng generalize tốt hơn. Đây là tradeoff phổ biến.",
    },
    {
      question: "XGBoost, LightGBM, CatBoost đều là dạng Gradient Boosting. Ưu thế chính của chúng là gì?",
      options: [
        "Chạy được trên GPU nên nhanh hơn",
        "Tối ưu hiệu suất: histogram binning, leaf-wise growth, xử lý missing values tự động",
        "Không cần tune hyperparameter",
      ],
      correct: 1,
      explanation: "Các thư viện này cải tiến tốc độ (histogram, parallel) và chất lượng (regularization, auto missing values). LightGBM đặc biệt nhanh nhờ leaf-wise + GOSS.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn dự đoán giá nhà sai 30%. Một bạn khác chỉ nhìn phần sai 30% đó và sửa — còn sai 15%. Bạn thứ ba sửa tiếp phần 15% còn lại. Mỗi lần sửa, sai số thế nào?"
          options={[
            "Sai số giảm dần mỗi lần sửa — tiến gần đáp án đúng",
            "Sai số không đổi — mỗi người sửa nhưng tạo lỗi mới",
            "Sai số tăng — quá nhiều người sửa gây nhầm lẫn",
          ]}
          correct={0}
          explanation="Sai số giảm dần! Mỗi người tập trung sửa phần sai còn lại. Đó là ý tưởng Gradient Boosting: mỗi mô hình nhỏ chỉ học RESIDUAL (phần chưa đúng) của tổ hợp trước."
        >

      {/* STEP 2: INTERACTIVE BOOSTING VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Nhấn <strong className="text-foreground">&quot;Vòng tiếp&quot;</strong>{" "}
          để thêm một mô hình nhỏ sửa sai. Quan sát thanh cam (dự đoán) tiến gần thanh xanh (thực tế) qua mỗi vòng.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            {/* Main bar chart */}
            <svg viewBox="0 0 500 320" className="w-full rounded-lg border border-border bg-background">
              {LABELS.map((label, i) => {
                const x = 35 + i * 65;
                const trueH = (TRUE_VALUES[i] / 300) * maxVal;
                const predH = (predictions[i] / 300) * maxVal;
                const residH = Math.abs(residuals[i]) / 300 * maxVal;
                return (
                  <g key={label}>
                    {/* True value bar */}
                    <motion.rect
                      x={x - 14} y={maxVal - trueH + 15} width={13} height={trueH}
                      fill="#3b82f6" opacity={0.25} rx={2}
                    />
                    {/* Prediction bar */}
                    <motion.rect
                      x={x + 1} y={maxVal - predH + 15} width={13} height={predH}
                      fill="#f97316" rx={2}
                      animate={{ y: maxVal - predH + 15, height: predH }}
                      transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    />
                    {/* Residual arrow */}
                    {Math.abs(residuals[i]) > 5 && (
                      <motion.line
                        x1={x + 7} y1={maxVal - predH + 15}
                        x2={x + 7} y2={maxVal - trueH + 15}
                        stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2"
                        initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
                      />
                    )}
                    {/* City label */}
                    <text x={x} y={310} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Legend */}
              <rect x={370} y={6} width={10} height={10} fill="#3b82f6" opacity={0.3} rx={1} />
              <text x={384} y={15} fontSize={9} fill="currentColor" className="text-muted">Thực tế</text>
              <rect x={370} y={20} width={10} height={10} fill="#f97316" rx={1} />
              <text x={384} y={29} fontSize={9} fill="currentColor" className="text-muted">Dự đoán</text>
              <line x1={370} y1={40} x2={380} y2={40} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2" />
              <text x={384} y={43} fontSize={9} fill="currentColor" className="text-muted">Residual</text>

              {/* Round & MSE */}
              <text x={15} y={18} fontSize={13} fill="#f97316" fontWeight={700}>
                Vòng {round}/{MAX_ROUND}
              </text>
              <text x={15} y={35} fontSize={11} fill="currentColor" className="text-muted">
                MSE = {mse.toFixed(0)}
              </text>
            </svg>

            {/* MSE trend mini chart */}
            <div className="rounded-lg border border-border p-3 bg-card">
              <p className="text-xs font-medium text-muted mb-2">Sai số (MSE) qua từng vòng:</p>
              <svg viewBox="0 0 300 60" className="w-full">
                {mseHistory.map((m, r) => {
                  const x = 10 + r * 50;
                  const h = (m / maxMSE) * 45;
                  const isCurrent = r === round;
                  return (
                    <g key={r}>
                      <rect x={x} y={55 - h} width={30} height={h} rx={3}
                        fill={isCurrent ? "#f97316" : "#e2e8f0"} opacity={isCurrent ? 1 : 0.5} />
                      <text x={x + 15} y={55 - h - 3} fontSize={7} fill={isCurrent ? "#f97316" : "#999"} textAnchor="middle" fontWeight={isCurrent ? 700 : 400}>
                        {m.toFixed(0)}
                      </text>
                      <text x={x + 15} y={60} fontSize={7} fill="currentColor" className="text-muted" textAnchor="middle">
                        R{r}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setRound(Math.max(0, round - 1))}
                disabled={round === 0}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-30"
              >
                Lùi lại
              </button>
              <button
                onClick={() => setRound(Math.min(MAX_ROUND, round + 1))}
                disabled={round === MAX_ROUND}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                Vòng tiếp
              </button>
              <button
                onClick={() => setRound(0)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Đặt lại
              </button>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Gradient Boosting</strong>{" "}
            xây mô hình NỐI TIẾP — mỗi mô hình nhỏ chỉ học phần sai (residual) của tổ hợp trước. Tên &quot;Gradient&quot; vì residual chính là gradient âm của hàm loss!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Gradient Boosting với 1000 cây, learning rate = 1.0. Chuyện gì xảy ra?"
          options={[
            "Mô hình cực kỳ chính xác vì có nhiều cây",
            "Mỗi cây đóng góp quá mạnh → overfitting nghiêm trọng",
            "Không khác gì learning rate = 0.1",
          ]}
          correct={1}
          explanation="Learning rate = 1.0 → mỗi cây đóng góp 100% dự đoán → các cây sau cố sửa quá mạnh → học thuộc noise. Thực tế dùng η = 0.01-0.1 và nhiều cây hơn — chậm nhưng ổn định."
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Gradient Boosting</strong>{" "}
            xây mô hình dạng cộng dồn (additive):
          </p>

          <LaTeX block>{"F_m(x) = F_{m-1}(x) + \\eta \\cdot h_m(x)"}</LaTeX>

          <p>
            Trong đó <LaTeX>{"h_m"}</LaTeX> là cây nhỏ (weak learner) huấn luyện để dự đoán <strong>residual</strong>{" "}(phần sai còn lại):
          </p>

          <LaTeX block>{"r_i^{(m)} = y_i - F_{m-1}(x_i) = -\\frac{\\partial L(y_i, F_{m-1}(x_i))}{\\partial F_{m-1}(x_i)}"}</LaTeX>

          <p>
            Residual chính là <strong>gradient âm</strong>{" "}
            của hàm loss — vì vậy gọi là &quot;Gradient&quot; Boosting. <LaTeX>{"\\eta"}</LaTeX> là learning rate kiểm soát tốc độ học.
          </p>

          <Callout variant="tip" title="Ví dụ thực tế: dự đoán giá nhà Hà Nội">
            Vòng 0: Dự đoán giá trung bình = 3 tỷ cho mọi nhà.{"\n"}
            Vòng 1: Cây 1 học residual → nhà quận 1 thường +2 tỷ, ngoại thành -1.5 tỷ.{"\n"}
            Vòng 2: Cây 2 sửa tiếp → nhà có thang máy +0.5 tỷ.{"\n"}
            Mỗi vòng tinh chỉnh thêm — giống thợ chỉnh đồng hồ từ thô đến tinh.
          </Callout>

          <p><strong>Ba thư viện phổ biến:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>XGBoost:</strong>{" "}Regularization mạnh, xử lý missing values, đa nền tảng</li>
            <li><strong>LightGBM:</strong>{" "}Nhanh nhất — histogram binning, leaf-wise growth, GOSS</li>
            <li><strong>CatBoost:</strong>{" "}Xử lý categorical features tốt nhất, ordered boosting giảm overfitting</li>
          </ul>

          <CodeBlock language="python" title="Gradient Boosting với XGBoost & LightGBM">
{`import xgboost as xgb
import lightgbm as lgb
from sklearn.datasets import load_boston
from sklearn.model_selection import cross_val_score

X, y = load_boston(return_X_y=True)

# XGBoost
xgb_model = xgb.XGBRegressor(
    n_estimators=200,
    learning_rate=0.1,     # η = 0.1
    max_depth=4,
    subsample=0.8,         # Dùng 80% dữ liệu mỗi cây
    random_state=42,
)
xgb_score = cross_val_score(xgb_model, X, y, cv=5, scoring="r2")
print(f"XGBoost R²: {xgb_score.mean():.3f}")

# LightGBM
lgb_model = lgb.LGBMRegressor(
    n_estimators=200,
    learning_rate=0.1,
    num_leaves=31,         # Leaf-wise (không max_depth)
    random_state=42,
)
lgb_score = cross_val_score(lgb_model, X, y, cv=5, scoring="r2")
print(f"LightGBM R²: {lgb_score.mean():.3f}")`}
          </CodeBlock>

          <Callout variant="warning" title="Overfitting risk">
            Gradient Boosting mạnh nhưng dễ overfit! Phải tune: learning_rate (nhỏ), n_estimators (dùng early stopping), max_depth (nông: 3-6), subsample (&lt; 1.0).
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Gradient Boosting xây cây NỐI TIẾP — mỗi cây sửa residual (sai số) của tổ hợp trước.",
          "Learning rate η kiểm soát đóng góp mỗi cây: nhỏ → chậm nhưng ổn định, lớn → nhanh nhưng dễ overfit.",
          "Residual = gradient âm của loss function → tên gọi 'Gradient' Boosting.",
          "XGBoost, LightGBM, CatBoost — vua của dữ liệu bảng trên Kaggle.",
          "Random Forest (song song, ổn định) vs Gradient Boosting (nối tiếp, chính xác hơn nhưng cần tune).",
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
