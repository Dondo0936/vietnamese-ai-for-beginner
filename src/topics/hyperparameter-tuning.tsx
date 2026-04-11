"use client";

import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "hyperparameter-tuning", title: "Hyperparameter Tuning", titleVi: "Tinh chỉnh siêu tham số — Tìm công thức vàng", description: "Quá trình tìm kiếm bộ siêu tham số tối ưu (learning rate, batch size, layers...) để mô hình đạt hiệu suất cao nhất.", category: "foundations", tags: ["hyperparameter", "tuning", "optimization", "grid-search"], difficulty: "intermediate", relatedSlugs: ["learning-rate", "train-val-test", "overfitting-underfitting"], vizType: "interactive" };

const TOTAL_STEPS = 7;

export default function HyperparameterTuningTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Hyperparameter khác parameter (weights) thế nào?", options: ["Giống nhau", "Hyperparameters đặt TRƯỚC training (lr, layers, batch_size). Parameters (weights) được HỌC trong training", "Hyperparameters luôn lớn hơn"], correct: 1, explanation: "Parameters: weights, biases — model tự học từ data (gradient descent). Hyperparameters: learning rate, số layers, dropout rate — NGƯỜI ĐẶT trước training. Hyperparameter tuning = tìm bộ config tốt nhất để model học hiệu quả nhất." },
    { question: "Grid Search vs Random Search: cái nào tốt hơn?", options: ["Grid Search vì thử tất cả combinations", "Random Search — tìm tốt hơn với cùng budget vì không bị kẹt ở grid, explore nhiều giá trị hơn", "Giống nhau"], correct: 1, explanation: "Grid search: thử 10x10=100 combinations cố định. Random search: thử 100 random combinations. Với cùng budget, random 'khám phá' nhiều giá trị hơn (nhất là khi chỉ 1-2 hyperparams thực sự quan trọng). Bergstra & Bengio (2012) chứng minh random tốt hơn grid!" },
    { question: "Bayesian Optimization ưu việt hơn random search thế nào?", options: ["Nhanh hơn vì dùng GPU", "Dùng surrogate model (GP) để DỰ ĐOÁN vùng nào có thể cho kết quả tốt → tìm thông minh hơn, cần ít trials hơn", "Không ưu việt hơn"], correct: 1, explanation: "Bayesian Opt: dùng Gaussian Process làm surrogate model. Sau mỗi trial, update GP → dự đoán vùng nào hứa hẹn → chọn trial tiếp theo thông minh (acquisition function). 3-5x hiệu quả hơn random search cho cùng budget." },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate question="Bạn train model: learning_rate=0.1 → accuracy 70%, lr=0.01 → 85%, lr=0.001 → 80%. Có 10 hyperparams khác cần tune. Thử mỗi combination mất 1 giờ. Cách nào tìm bộ tối ưu?" options={["Thử tất cả combinations (Grid Search) — nhưng 10^10 combinations?!", "Dùng Bayesian Optimization: thông minh dự đoán vùng nào hứa hẹn → tìm tối ưu với 50-100 trials", "Random chọn và hy vọng"]} correct={1} explanation="Grid search: 10 giá trị x 10 hyperparams = 10 tỷ combinations — bất khả thi! Random search: tốt hơn nhưng vẫn 'mù'. Bayesian Opt: dùng GP model dự đoán vùng nào tốt → chỉ cần 50-100 trials thay vì hàng nghìn. Giống GPS thay vì thử mọi con đường!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 150" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">3 chiến lược Hyperparameter Tuning</text>
              {[
                { name: "Grid Search", trials: "10^N (hết)", efficiency: 20, color: "#ef4444" },
                { name: "Random Search", trials: "~100", efficiency: 55, color: "#f59e0b" },
                { name: "Bayesian Opt", trials: "~30-50", efficiency: 90, color: "#22c55e" },
              ].map((s, i) => {
                const y = 30 + i * 38;
                return (<g key={i}><text x={15} y={y + 16} fill="#94a3b8" fontSize={9}>{s.name}</text><rect x={140} y={y} width={350} height={24} rx={3} fill="#1e293b" /><rect x={140} y={y} width={350 * s.efficiency / 100} height={24} rx={3} fill={s.color} /><text x={145 + 350 * s.efficiency / 100} y={y + 16} fill="white" fontSize={9} fontWeight="bold">{s.efficiency}%</text><text x={520} y={y + 16} fill="#94a3b8" fontSize={7}>{s.trials} trials</text></g>);
              })}
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment><p>Bayesian Optimization giống <strong>GPS thông minh</strong>{" "}— mỗi lần thử xong, nó <strong>học</strong>{" "}và <strong>dự đoán</strong>{" "}vùng nào có thể cho kết quả tốt hơn. Tìm tối ưu với 50 trials thay vì 10.000 trials random. <strong>Optuna</strong>{" "}là tool miễn phí tốt nhất cho Bayesian HP tuning!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge question="Bạn có budget 100 GPU-hours cho HP tuning. Mỗi trial mất 1 giờ. 5 hyperparameters cần tune. Grid search cần 10^5 = 100K trials. Random cần ~300. Bayesian?" options={["100 trials (1 per GPU-hour)", "30-50 trials — Bayesian Opt hiệu quả hơn 3-5x random, tìm tối ưu với 30-50 trials", "Vẫn cần 100K trials"]} correct={1} explanation="Bayesian Opt: 30-50 trials thường đủ để tìm near-optimal. Budget 100 GPU-hours: chạy 50 trials, còn 50 hours cho re-training final model. Hiệu quả hơn random 3-5x, hơn grid vô hạn lần. Tools: Optuna, W&B Sweeps, Ray Tune." />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Hyperparameter Tuning</strong>{" "}tìm bộ siêu tham số (learning rate, batch size, regularization...) tối ưu cho model.</p>
          <p><strong>Bayesian Optimization:</strong></p>
          <LaTeX block>{"x_{\\text{next}} = \\arg\\max_x \\alpha(x | \\mathcal{D}_{1:t}) \\quad \\text{(acquisition function: Expected Improvement)}"}</LaTeX>
          <LaTeX block>{"\\text{EI}(x) = \\mathbb{E}[\\max(f(x) - f^*, 0)] \\quad \\text{(chọn x có kỳ vọng cải thiện lớn nhất)}"}</LaTeX>
          <Callout variant="tip" title="Hyperparams quan trọng nhất">Learning rate: quan trọng nhất (ảnh hưởng 10x). Batch size: ảnh hưởng generalization. Regularization (dropout, weight decay): kiểm soát overfitting. Số layers/hidden units: capacity. Tune theo thứ tự quan trọng!</Callout>
          <CodeBlock language="python" title="Bayesian HP Tuning với Optuna">{`import optuna
from sklearn.ensemble import GradientBoostingClassifier

def objective(trial):
    # Optuna đề xuất hyperparameters thông minh
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 50, 500),
        "max_depth": trial.suggest_int("max_depth", 3, 10),
        "learning_rate": trial.suggest_float("lr", 0.01, 0.3, log=True),
        "subsample": trial.suggest_float("subsample", 0.5, 1.0),
        "min_samples_leaf": trial.suggest_int("min_leaf", 1, 20),
    }
    model = GradientBoostingClassifier(**params)
    model.fit(X_train, y_train)
    return model.score(X_val, y_val)

# Bayesian Optimization: 50 trials
study = optuna.create_study(direction="maximize")
study.optimize(objective, n_trials=50)

print(f"Best accuracy: {study.best_value:.3f}")
print(f"Best params: {study.best_params}")
# Thường tìm near-optimal trong 30-50 trials`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={["Hyperparameters (lr, batch_size) đặt TRƯỚC training. Parameters (weights) được HỌC trong training.", "Grid Search: bất khả thi cho nhiều HPs. Random: tốt hơn 3x. Bayesian Opt: tốt hơn 3-5x random.", "Bayesian Opt dùng surrogate model dự đoán vùng hứa hẹn → tìm tối ưu với 30-50 trials.", "Thứ tự quan trọng: learning rate > regularization > batch size > architecture.", "Tools: Optuna (free, tốt nhất), W&B Sweeps, Ray Tune."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
