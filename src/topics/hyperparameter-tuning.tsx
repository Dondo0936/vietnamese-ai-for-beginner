"use client";

import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "hyperparameter-tuning", title: "Hyperparameter Tuning", titleVi: "Tinh chinh sieu tham so — Tim cong thuc vang", description: "Qua trinh tim kiem bo sieu tham so toi uu (learning rate, batch size, layers...) de mo hinh dat hieu suat cao nhat.", category: "foundations", tags: ["hyperparameter", "tuning", "optimization", "grid-search"], difficulty: "intermediate", relatedSlugs: ["learning-rate", "train-val-test", "overfitting-underfitting"], vizType: "interactive" };

const TOTAL_STEPS = 7;

export default function HyperparameterTuningTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Hyperparameter khac parameter (weights) the nao?", options: ["Giong nhau", "Hyperparameters dat TRUOC training (lr, layers, batch_size). Parameters (weights) duoc HOC trong training", "Hyperparameters luon lon hon"], correct: 1, explanation: "Parameters: weights, biases — model tu hoc tu data (gradient descent). Hyperparameters: learning rate, so layers, dropout rate — NGUOI DAT truoc training. Hyperparameter tuning = tim bo config tot nhat de model hoc hieu qua nhat." },
    { question: "Grid Search vs Random Search: cai nao tot hon?", options: ["Grid Search vi thu tat ca combinations", "Random Search — tim tot hon voi cung budget vi khong bi ket o grid, explore nhieu gia tri hon", "Giong nhau"], correct: 1, explanation: "Grid search: thu 10x10=100 combinations co dinh. Random search: thu 100 random combinations. Voi cung budget, random 'kham pha' nhieu gia tri hon (nhat la khi chi 1-2 hyperparams thuc su quan trong). Bergstra & Bengio (2012) chung minh random tot hon grid!" },
    { question: "Bayesian Optimization uu viet hon random search the nao?", options: ["Nhanh hon vi dung GPU", "Dung surrogate model (GP) de DU DOAN vung nao co the cho ket qua tot → tim thong minh hon, can it trials hon", "Khong uu viet hon"], correct: 1, explanation: "Bayesian Opt: dung Gaussian Process lam surrogate model. Sau moi trial, update GP → du doan vung nao hua hen → chon trial tiep theo thong minh (acquisition function). 3-5x hieu qua hon random search cho cung budget." },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate question="Ban train model: learning_rate=0.1 → accuracy 70%, lr=0.01 → 85%, lr=0.001 → 80%. Co 10 hyperparams khac can tune. Thu moi combination mat 1 gio. Cach nao tim bo toi uu?" options={["Thu tat ca combinations (Grid Search) — nhung 10^10 combinations?!", "Dung Bayesian Optimization: thong minh du doan vung nao hua hen → tim toi uu voi 50-100 trials", "Random chon va hy vong"]} correct={1} explanation="Grid search: 10 gia tri x 10 hyperparams = 10 ty combinations — bat kha thi! Random search: tot hon nhung van 'mu'. Bayesian Opt: dung GP model du doan vung nao tot → chi can 50-100 trials thay vi hang ngan. Giong GPS thay vi thu moi con duong!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 150" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">3 chien luoc Hyperparameter Tuning</text>
              {[
                { name: "Grid Search", trials: "10^N (het)", efficiency: 20, color: "#ef4444" },
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

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment><p>Bayesian Optimization giong <strong>GPS thong minh</strong>{" "}— moi lan thu xong, no <strong>hoc</strong>{" "}va <strong>du doan</strong>{" "}vung nao co the cho ket qua tot hon. Tim toi uu voi 50 trials thay vi 10.000 trials random. <strong>Optuna</strong>{" "}la tool mien phi tot nhat cho Bayesian HP tuning!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge question="Ban co budget 100 GPU-hours cho HP tuning. Moi trial mat 1 gio. 5 hyperparameters can tune. Grid search can 10^5 = 100K trials. Random can ~300. Bayesian?" options={["100 trials (1 per GPU-hour)", "30-50 trials — Bayesian Opt hieu qua hon 3-5x random, tim toi uu voi 30-50 trials", "Van can 100K trials"]} correct={1} explanation="Bayesian Opt: 30-50 trials thuong du de tim near-optimal. Budget 100 GPU-hours: chay 50 trials, con 50 hours cho re-training final model. Hieu qua hon random 3-5x, hon grid vo han lan. Tools: Optuna, W&B Sweeps, Ray Tune." />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p><strong>Hyperparameter Tuning</strong>{" "}tim bo sieu tham so (learning rate, batch size, regularization...) toi uu cho model.</p>
          <p><strong>Bayesian Optimization:</strong></p>
          <LaTeX block>{"x_{\\text{next}} = \\arg\\max_x \\alpha(x | \\mathcal{D}_{1:t}) \\quad \\text{(acquisition function: Expected Improvement)}"}</LaTeX>
          <LaTeX block>{"\\text{EI}(x) = \\mathbb{E}[\\max(f(x) - f^*, 0)] \\quad \\text{(chon x co ky vong cai thien lon nhat)}"}</LaTeX>
          <Callout variant="tip" title="Hyperparams quan trong nhat">Learning rate: quan trong nhat (ảnh huong 10x). Batch size: anh huong generalization. Regularization (dropout, weight decay): kiem soat overfitting. So layers/hidden units: capacity. Tune theo thu tu quan trong!</Callout>
          <CodeBlock language="python" title="Bayesian HP Tuning voi Optuna">{`import optuna
from sklearn.ensemble import GradientBoostingClassifier

def objective(trial):
    # Optuna de xuat hyperparameters thong minh
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
# Thuong tim near-optimal trong 30-50 trials`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={["Hyperparameters (lr, batch_size) dat TRUOC training. Parameters (weights) duoc HOC trong training.", "Grid Search: bat kha thi cho nhieu HPs. Random: tot hon 3x. Bayesian Opt: tot hon 3-5x random.", "Bayesian Opt dung surrogate model du doan vung hua hen → tim toi uu voi 30-50 trials.", "Tue tu quan trong: learning rate > regularization > batch size > architecture.", "Tools: Optuna (free, tot nhat), W&B Sweeps, Ray Tune."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
