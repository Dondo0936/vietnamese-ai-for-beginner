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
  slug: "cross-validation",
  title: "Cross-Validation",
  titleVi: "Kiểm chứng chéo",
  description: "Kỹ thuật đánh giá mô hình bằng cách chia dữ liệu thành nhiều fold để huấn luyện và kiểm tra",
  category: "classic-ml",
  tags: ["evaluation", "model-selection", "theory"],
  difficulty: "beginner",
  relatedSlugs: ["bias-variance", "confusion-matrix", "polynomial-regression"],
  vizType: "interactive",
};

/* ── K-fold simulation ── */
const FOLD_COLORS = ["#3b82f6", "#f97316", "#22c55e", "#8b5cf6", "#ef4444"];

/* Simulated scores for different K values */
function getScores(k: number): number[] {
  const baseScores: Record<number, number[]> = {
    3: [0.83, 0.87, 0.85],
    5: [0.85, 0.88, 0.82, 0.90, 0.86],
    7: [0.84, 0.87, 0.83, 0.89, 0.86, 0.88, 0.85],
    10: [0.85, 0.87, 0.82, 0.90, 0.86, 0.84, 0.89, 0.83, 0.88, 0.85],
  };
  return baseScores[k] || baseScores[5];
}

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function CrossValidationTopic() {
  const [k, setK] = useState(5);
  const [activeFold, setActiveFold] = useState(0);

  const scores = useMemo(() => getScores(k), [k]);
  const avgScore = useMemo(() => scores.reduce((a, b) => a + b, 0) / scores.length, [scores]);
  const stdScore = useMemo(() => {
    const mean = avgScore;
    return Math.sqrt(scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length);
  }, [scores, avgScore]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao cross-validation tốt hơn chia train/test một lần?",
      options: [
        "Cross-validation chạy nhanh hơn",
        "Mỗi điểm dữ liệu đều được dùng để test đúng 1 lần → ước lượng ổn định hơn, ít phụ thuộc vào cách chia",
        "Cross-validation luôn cho accuracy cao hơn",
      ],
      correct: 1,
      explanation: "Chia 1 lần → kết quả phụ thuộc vào 'may rủi' của lần chia đó. Cross-validation thử K lần chia khác nhau → trung bình ổn định hơn. Mọi mẫu đều được test → tận dụng tối đa dữ liệu.",
    },
    {
      question: "K=5 hay K=10 tốt hơn?",
      options: [
        "K=10 luôn tốt hơn vì test nhiều hơn",
        "Tuỳ: K=5 nhanh hơn, K=10 ước lượng tốt hơn nhưng chậm gấp đôi. K=5 là mặc định phổ biến.",
        "K=5 luôn tốt hơn vì tập train lớn hơn",
      ],
      correct: 1,
      explanation: "K lớn → mỗi fold nhỏ hơn → variance ước lượng cao hơn (nhạy hơn). K nhỏ → tập train nhỏ hơn → bias cao hơn. K=5 hoặc 10 cân bằng tốt. Thực tế thường dùng K=5.",
    },
    {
      question: "Dữ liệu chuỗi thời gian (giá Bitcoin theo ngày). Dùng K-Fold bình thường được không?",
      options: [
        "Được — K-Fold hoạt động với mọi dữ liệu",
        "KHÔNG — data leakage! Phải dùng Time Series Split (chỉ train trên quá khứ, test trên tương lai)",
        "Được nếu shuffle dữ liệu trước",
      ],
      correct: 1,
      explanation: "K-Fold xáo trộn → dữ liệu tương lai lọt vào training set → mô hình 'nhìn trước' được → accuracy ảo! Time Series Split luôn train trên quá khứ, test trên tương lai → thực tế hơn.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn ôn thi bằng 1 bộ đề duy nhất, đạt 9 điểm. Bạn có chắc mình giỏi thật không? Hay chỉ tình cờ hợp đề?"
          options={[
            "Chắc chắn giỏi — 9 điểm là 9 điểm",
            "Chưa chắc — nên làm 5 bộ đề khác nhau rồi tính trung bình mới biết thực lực",
            "Không quan trọng — chỉ cần qua điểm liệt",
          ]}
          correct={1}
          explanation="1 đề có thể 'may' hoặc 'xui'. 5 đề cho trung bình ổn định hơn — đó là cross-validation! Thay vì đánh giá model trên 1 tập test duy nhất, ta chia dữ liệu thành K phần và test K lần."
        >

      {/* STEP 2: INTERACTIVE K-FOLD VIZ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Nhấp vào từng <strong className="text-foreground">fold (lượt)</strong>{" "}
          để xem phần nào train (xám), phần nào test (màu). Thay đổi K bằng nút bên dưới.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 500 300" className="w-full rounded-lg border border-border bg-background">
              <text x={250} y={20} fontSize={12} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
                {k}-Fold Cross Validation
              </text>

              {/* Fold rows */}
              {scores.map((score, fold) => {
                const y = 35 + fold * (220 / k);
                const isActive = fold === activeFold;
                const blockW = Math.min(65, 380 / k - 4);

                return (
                  <g
                    key={fold}
                    className="cursor-pointer"
                    onClick={() => setActiveFold(fold)}
                  >
                    <motion.g animate={{ opacity: isActive ? 1 : 0.45 }}>
                      {/* Fold label */}
                      <text x={12} y={y + 15} fontSize={10} fill="currentColor" className="text-muted"
                        fontWeight={isActive ? 700 : 400}>
                        F{fold + 1}
                      </text>

                      {/* Data blocks */}
                      {Array.from({ length: k }, (_, block) => {
                        const bx = 35 + block * (blockW + 3);
                        const isTest = block === fold;
                        const color = FOLD_COLORS[fold % FOLD_COLORS.length];
                        return (
                          <g key={block}>
                            <motion.rect
                              x={bx} y={y} width={blockW} height={22} rx={4}
                              fill={isTest ? color : "#666"}
                              opacity={isTest ? 0.7 : 0.12}
                              stroke={isTest ? color : "transparent"}
                              strokeWidth={isTest ? 2 : 0}
                              animate={{ opacity: isTest ? (isActive ? 0.8 : 0.5) : (isActive ? 0.15 : 0.08) }}
                            />
                            <text x={bx + blockW / 2} y={y + 14} fontSize={8}
                              fill={isTest ? "#fff" : "#888"} textAnchor="middle" fontWeight={isTest ? 600 : 400}>
                              {isTest ? "Test" : "Train"}
                            </text>
                          </g>
                        );
                      })}

                      {/* Score */}
                      <text x={40 + k * (blockW + 3)} y={y + 15} fontSize={11}
                        fill={FOLD_COLORS[fold % FOLD_COLORS.length]} fontWeight={600}>
                        {(score * 100).toFixed(0)}%
                      </text>
                    </motion.g>
                  </g>
                );
              })}

              {/* Divider */}
              <line x1={35} y1={35 + scores.length * (220 / k) + 5}
                x2={460} y2={35 + scores.length * (220 / k) + 5}
                stroke="currentColor" className="text-border" strokeWidth={1} />

              {/* Average score */}
              <text x={250} y={280} fontSize={13} fill="#22c55e" textAnchor="middle" fontWeight={700}>
                Trung bình: {(avgScore * 100).toFixed(1)}% (± {(stdScore * 100).toFixed(1)}%)
              </text>
            </svg>

            {/* K selector */}
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-muted font-medium">K =</span>
              {[3, 5, 7, 10].map((kv) => (
                <button key={kv}
                  onClick={() => { setK(kv); setActiveFold(0); }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    k === kv ? "bg-accent text-white" : "border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {kv}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted text-center">
              K lớn → mỗi fold nhỏ hơn nhưng tập train lớn hơn. Thử K=3 vs K=10!
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>K-Fold Cross-Validation</strong>{" "}
            = luân phiên K lần: mỗi lần 1 phần test, còn lại train. Mọi mẫu đều được test đúng 1 lần → ước lượng ổn định hơn chia 1 lần!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Cross-validation 5-fold cho scores: [95%, 50%, 93%, 48%, 94%]. Trung bình 76%. Có vấn đề gì?"
          options={[
            "Không vấn đề — 76% là điểm thực tế",
            "Variance quá cao (scores dao động mạnh) — có thể dữ liệu không đồng đều hoặc data leakage",
            "Cần tăng K lên 10 để sửa",
          ]}
          correct={1}
          explanation="Scores dao động 48-95% → mô hình không ổn định! Có thể: (1) dữ liệu phân bố không đều giữa các fold → dùng Stratified K-Fold, (2) data leakage, (3) mô hình quá nhạy. Trung bình che giấu vấn đề — luôn xem std!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>K-Fold Cross-Validation</strong>{" "}
            chia dữ liệu thành K phần bằng nhau. Mỗi lượt: 1 phần test, K-1 phần train:
          </p>

          <LaTeX block>{"\\text{CV Score} = \\frac{1}{K}\\sum_{k=1}^{K} \\text{Score}_k"}</LaTeX>

          <p><strong>Các biến thể:</strong></p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
            <li>
              <strong>Stratified K-Fold:</strong>{" "}
              Giữ tỷ lệ lớp bằng nhau trong mỗi fold. BẮT BUỘC cho classification với dữ liệu mất cân bằng.
            </li>
            <li>
              <strong>Leave-One-Out (LOO):</strong>{" "}
              K = n (mỗi fold chỉ 1 mẫu test). Variance cao, chậm, nhưng bias thấp nhất.
            </li>
            <li>
              <strong>Time Series Split:</strong>{" "}
              Fold 1: train [1-2], test [3]. Fold 2: train [1-3], test [4]. Luôn train trước, test sau.
            </li>
            <li>
              <strong>Repeated K-Fold:</strong>{" "}
              Chạy K-Fold nhiều lần (mỗi lần shuffle khác) → ổn định hơn.
            </li>
          </ul>

          <Callout variant="tip" title="Cross-validation + Grid Search">
            Kết hợp CV với grid search để chọn hyperparameter tối ưu. Ví dụ: thử max_depth = [3, 5, 7, 10] × C = [0.1, 1, 10] → chọn tổ hợp có CV score cao nhất.
          </Callout>

          <CodeBlock language="python" title="Cross-Validation với scikit-learn">
{`from sklearn.model_selection import (
    cross_val_score, StratifiedKFold, TimeSeriesSplit,
    GridSearchCV,
)
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)

# 1. Simple K-Fold
scores = cross_val_score(
    RandomForestClassifier(random_state=42),
    X, y, cv=5, scoring="accuracy",
)
print(f"5-Fold: {scores.mean():.1%} ± {scores.std():.1%}")

# 2. Stratified K-Fold (giữ tỷ lệ lớp)
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores_strat = cross_val_score(
    RandomForestClassifier(random_state=42),
    X, y, cv=skf, scoring="accuracy",
)
print(f"Stratified: {scores_strat.mean():.1%} ± {scores_strat.std():.1%}")

# 3. Grid Search + CV
param_grid = {"max_depth": [3, 5, 7], "n_estimators": [50, 100, 200]}
grid = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid, cv=5, scoring="accuracy",
)
grid.fit(X, y)
print(f"Best params: {grid.best_params_}")
print(f"Best CV score: {grid.best_score_:.1%}")`}
          </CodeBlock>

          <Callout variant="warning" title="Data Leakage nguy hiểm!">
            KHÔNG được fit scaler/feature selection trên TOÀN BỘ dữ liệu trước khi CV! Phải đặt trong Pipeline để mỗi fold fit riêng. Nếu không → thông tin từ test lọt vào train → accuracy ảo.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "K-Fold CV: chia K phần, luân phiên test → mỗi mẫu test đúng 1 lần → ổn định hơn chia 1 lần.",
          "K=5 hoặc 10 phổ biến. Stratified K-Fold cho classification, Time Series Split cho dữ liệu thời gian.",
          "Xem cả mean VÀ std — std cao = mô hình không ổn định hoặc dữ liệu có vấn đề.",
          "GridSearchCV = grid search + CV: tìm hyperparameter tối ưu một cách đáng tin cậy.",
          "CẢNH BÁO: fit scaler/encoder TRONG pipeline, không trước CV → tránh data leakage!",
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
