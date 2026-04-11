"use client";

import { useState, useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "ensemble-methods", title: "Ensemble Methods", titleVi: "Phuong phap ket hop — Dong tay vo nen keu", description: "Ky thuat ket hop nhieu mo hinh yeu lai thanh mot mo hinh manh hon bat ky thanh vien don le nao.", category: "foundations", tags: ["ensemble", "bagging", "boosting", "stacking"], difficulty: "intermediate", relatedSlugs: ["random-forests", "gradient-boosting", "decision-trees"], vizType: "interactive" };

const METHODS = [
  { name: "Bagging", desc: "Train nhieu model song song tren subsets data, average ket qua", example: "Random Forest", accuracy: 88 },
  { name: "Boosting", desc: "Train tuan tu, model sau focus vao loi cua model truoc", example: "XGBoost, LightGBM", accuracy: 92 },
  { name: "Stacking", desc: "Model meta-learner hoc cach ket hop output cua nhieu models", example: "Stacked Generalization", accuracy: 93 },
];

const TOTAL_STEPS = 7;

export default function EnsembleMethodsTopic() {
  const [activeMethod, setActiveMethod] = useState(1);
  const method = METHODS[activeMethod];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Bagging giam gi: bias hay variance?", options: ["Bias", "VARIANCE — train nhieu models tren random subsets, average giam variance (overfitting)", "Ca hai"], correct: 1, explanation: "Bagging: moi model overfit theo cach khac nhau (random subset). Average nhieu models → random errors triet tieu nhau → variance giam. Bias khong doi vi moi model cung do phuc tap. Random Forest = Bagging + Decision Trees." },
    { question: "Boosting giam gi: bias hay variance?", options: ["BIAS — moi model moi focus vao loi con lai, dan giam bias", "Variance", "Khong giam gi"], correct: 0, explanation: "Boosting: model 1 sai o dau → model 2 focus vao do → model 3 focus vao loi con lai... Dan dan giam bias (underfitting). Nhung qua nhieu rounds → overfit (tang variance). Can early stopping!" },
    { question: "Tai sao XGBoost thang hau het cuoc thi Kaggle cho tabular data?", options: ["Vi no moi nhat", "Ket hop boosting manh (giam bias) + regularization (kiem soat variance) + xu ly missing values + parallel", "Vi no dung deep learning"], correct: 1, explanation: "XGBoost: gradient boosting + L1/L2 regularization + tree pruning + built-in cross-validation + missing value handling + parallel training. Tren tabular data, XGBoost/LightGBM van thang deep learning trong da so truong hop!" },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate question="Ban hoi 100 nguoi du doan thoi tiet ngay mai. Moi nguoi dung 70%. Neu lay da so phieu (majority voting), do chinh xac se the nao?" options={["Van 70%", "Cao hon nhieu — ~97% vi loi cua tung nguoi triet tieu nhau khi ket hop", "Thap hon vi nhieu y kien"]} correct={1} explanation="Dung! Luat so lon: neu moi nguoi dung > 50% va SAI DOC LAP, majority voting tang accuracy theo cap so nhan. 100 nguoi x 70% → ~97%. Day chinh la nguyen ly Ensemble: ket hop nhieu model yeu thanh model manh!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">So sanh <strong className="text-foreground">3 phuong phap ensemble</strong>.</p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              {METHODS.map((m, i) => (<button key={i} onClick={() => setActiveMethod(i)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeMethod === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"}`}>{m.name}</button>))}
            </div>
            <svg viewBox="0 0 600 120" className="w-full max-w-2xl mx-auto">
              {METHODS.map((m, i) => {
                const y = 10 + i * 35;
                const isActive = i === activeMethod;
                return (<g key={i}><text x={15} y={y + 16} fill={isActive ? "#e2e8f0" : "#64748b"} fontSize={9} fontWeight={isActive ? "bold" : "normal"}>{m.name}</text><rect x={110} y={y} width={380} height={24} rx={3} fill="#1e293b" /><rect x={110} y={y} width={380 * m.accuracy / 100} height={24} rx={3} fill={isActive ? "#22c55e" : "#475569"} opacity={isActive ? 1 : 0.3} /><text x={115 + 380 * m.accuracy / 100} y={y + 16} fill="white" fontSize={9} fontWeight="bold">{m.accuracy}%</text><text x={530} y={y + 16} fill="#94a3b8" fontSize={7}>{m.example}</text></g>);
              })}
            </svg>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-sm font-semibold">{method.name}</p>
              <p className="text-xs text-muted mt-1">{method.desc}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment><p>Bagging giam <strong>variance</strong>{" "}(nhieu model random → average triet tieu noise). Boosting giam <strong>bias</strong>{" "}(moi model focus vao loi con lai). Stacking <strong>ket hop tot nhat cua ca hai</strong>{" "}— meta-learner hoc cach trong so toi uu. Day la ly do ensemble LUON manh hon single model!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge question="Model A accuracy 85%, Model B 82%, Model C 80%. Ensemble (voting) co the dat bao nhieu?" options={["85% (bang model tot nhat)", "87-90% — ensemble thuong tot hon model tot nhat 2-5% vi loi khac nhau triet tieu", "100% neu ket hop du nhieu"]} correct={1} explanation="Ensemble hieu qua khi models SAI O NHUNG CHO KHAC NHAU (diverse). Neu 3 models deu sai cung cho → ensemble cung sai. A sai cho X, B sai cho Y, C sai cho Z → majority voting dung cho X, Y, Z. Key: diversity > individual accuracy!" />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p><strong>Ensemble Methods</strong>{" "}ket hop nhieu models thanh 1 model manh hon — nguyen ly co ban nhat de tang accuracy.</p>
          <p><strong>Bagging (Bootstrap Aggregating):</strong></p>
          <LaTeX block>{"\\hat{f}_{\\text{bag}}(x) = \\frac{1}{B} \\sum_{b=1}^{B} f_b(x) \\quad \\text{(average B models train tren bootstrap samples)}"}</LaTeX>
          <p><strong>Boosting:</strong></p>
          <LaTeX block>{"\\hat{f}_{\\text{boost}}(x) = \\sum_{m=1}^{M} \\alpha_m f_m(x) \\quad \\text{(weighted sum, model sau focus loi model truoc)}"}</LaTeX>
          <Callout variant="tip" title="XGBoost/LightGBM van thang Deep Learning cho tabular data">Tren Kaggle tabular competitions, XGBoost/LightGBM thang deep learning trong 80%+ truong hop. Deep learning can nhieu data + tot cho unstructured (anh, text). Tabular: tree-based ensembles van la vua.</Callout>
          <CodeBlock language="python" title="Ensemble voi scikit-learn">{`from sklearn.ensemble import (
    RandomForestClassifier,    # Bagging
    GradientBoostingClassifier, # Boosting
    VotingClassifier,          # Simple ensemble
    StackingClassifier,        # Stacking
)
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

# Bagging: Random Forest
rf = RandomForestClassifier(n_estimators=100, max_depth=10)

# Boosting: Gradient Boosting
gb = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1)

# Stacking: combine RF + GB + SVM, meta-learner = LogisticRegression
stack = StackingClassifier(
    estimators=[("rf", rf), ("gb", gb), ("svm", SVC(probability=True))],
    final_estimator=LogisticRegression(),
    cv=5,
)
stack.fit(X_train, y_train)
print(f"Stacking accuracy: {stack.score(X_test, y_test):.3f}")
# Thuong tot hon bat ky model don le nao 2-5%`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={["Ensemble ket hop nhieu model yeu → model manh. 'Dong tay vo nen keu.'", "Bagging (Random Forest): giam variance. Boosting (XGBoost): giam bias. Stacking: ket hop ca hai.", "Hieu qua khi models DIVERSE — sai o nhung cho khac nhau → triet tieu loi.", "XGBoost/LightGBM van thang deep learning cho tabular data (80%+ Kaggle competitions).", "Key: diversity > individual accuracy. 3 models 80% diverse > 3 models 90% giong nhau."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
