"use client";

import { useState, useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "ensemble-methods", title: "Ensemble Methods", titleVi: "Phương pháp kết hợp — Đồng tay vỗ nên kêu", description: "Kỹ thuật kết hợp nhiều mô hình yếu lại thành một mô hình mạnh hơn bất kỳ thành viên đơn lẻ nào.", category: "foundations", tags: ["ensemble", "bagging", "boosting", "stacking"], difficulty: "intermediate", relatedSlugs: ["random-forests", "gradient-boosting", "decision-trees"], vizType: "interactive" };

const METHODS = [
  { name: "Bagging", desc: "Train nhiều model song song trên subsets data, average kết quả", example: "Random Forest", accuracy: 88 },
  { name: "Boosting", desc: "Train tuần tự, model sau focus vào lỗi của model trước", example: "XGBoost, LightGBM", accuracy: 92 },
  { name: "Stacking", desc: "Model meta-learner học cách kết hợp output của nhiều models", example: "Stacked Generalization", accuracy: 93 },
];

const TOTAL_STEPS = 7;

export default function EnsembleMethodsTopic() {
  const [activeMethod, setActiveMethod] = useState(1);
  const method = METHODS[activeMethod];

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Bagging giảm gì: bias hay variance?", options: ["Bias", "VARIANCE — train nhiều models trên random subsets, average giảm variance (overfitting)", "Cả hai"], correct: 1, explanation: "Bagging: mỗi model overfit theo cách khác nhau (random subset). Average nhiều models → random errors triệt tiêu nhau → variance giảm. Bias không đổi vì mỗi model cùng độ phức tạp. Random Forest = Bagging + Decision Trees." },
    { question: "Boosting giảm gì: bias hay variance?", options: ["BIAS — mỗi model mới focus vào lỗi còn lại, dần giảm bias", "Variance", "Không giảm gì"], correct: 0, explanation: "Boosting: model 1 sai ở đâu → model 2 focus vào đó → model 3 focus vào lỗi còn lại... Dần dần giảm bias (underfitting). Nhưng quá nhiều rounds → overfit (tăng variance). Cần early stopping!" },
    { question: "Tại sao XGBoost thắng hầu hết cuộc thi Kaggle cho tabular data?", options: ["Vì nó mới nhất", "Kết hợp boosting mạnh (giảm bias) + regularization (kiểm soát variance) + xử lý missing values + parallel", "Vì nó dùng deep learning"], correct: 1, explanation: "XGBoost: gradient boosting + L1/L2 regularization + tree pruning + built-in cross-validation + missing value handling + parallel training. Trên tabular data, XGBoost/LightGBM vẫn thắng deep learning trong đa số trường hợp!" },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate question="Bạn hỏi 100 người dự đoán thời tiết ngày mai. Mỗi người đúng 70%. Nếu lấy đa số phiếu (majority voting), độ chính xác sẽ thế nào?" options={["Vẫn 70%", "Cao hơn nhiều — ~97% vì lỗi của từng người triệt tiêu nhau khi kết hợp", "Thấp hơn vì nhiều ý kiến"]} correct={1} explanation="Đúng! Luật số lớn: nếu mỗi người đúng > 50% và SAI ĐỘC LẬP, majority voting tăng accuracy theo cấp số nhân. 100 người x 70% → ~97%. Đây chính là nguyên lý Ensemble: kết hợp nhiều model yếu thành model mạnh!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">So sánh <strong className="text-foreground">3 phương pháp ensemble</strong>.</p>
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

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment><p>Bagging giảm <strong>variance</strong>{" "}(nhiều model random → average triệt tiêu noise). Boosting giảm <strong>bias</strong>{" "}(mỗi model focus vào lỗi còn lại). Stacking <strong>kết hợp tốt nhất của cả hai</strong>{" "}— meta-learner học cách trọng số tối ưu. Đây là lý do ensemble LUÔN mạnh hơn single model!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge question="Model A accuracy 85%, Model B 82%, Model C 80%. Ensemble (voting) có thể đạt bao nhiêu?" options={["85% (bằng model tốt nhất)", "87-90% — ensemble thường tốt hơn model tốt nhất 2-5% vì lỗi khác nhau triệt tiêu", "100% nếu kết hợp đủ nhiều"]} correct={1} explanation="Ensemble hiệu quả khi models SAI Ở NHỮNG CHỖ KHÁC NHAU (diverse). Nếu 3 models đều sai cùng chỗ → ensemble cũng sai. A sai chỗ X, B sai chỗ Y, C sai chỗ Z → majority voting đúng cho X, Y, Z. Key: diversity > individual accuracy!" />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Ensemble Methods</strong>{" "}kết hợp nhiều models thành 1 model mạnh hơn — nguyên lý cơ bản nhất để tăng accuracy.</p>
          <p><strong>Bagging (Bootstrap Aggregating):</strong></p>
          <LaTeX block>{"\\hat{f}_{\\text{bag}}(x) = \\frac{1}{B} \\sum_{b=1}^{B} f_b(x) \\quad \\text{(average B models train trên bootstrap samples)}"}</LaTeX>
          <p><strong>Boosting:</strong></p>
          <LaTeX block>{"\\hat{f}_{\\text{boost}}(x) = \\sum_{m=1}^{M} \\alpha_m f_m(x) \\quad \\text{(weighted sum, model sau focus lỗi model trước)}"}</LaTeX>
          <Callout variant="tip" title="XGBoost/LightGBM vẫn thắng Deep Learning cho tabular data">Trên Kaggle tabular competitions, XGBoost/LightGBM thắng deep learning trong 80%+ trường hợp. Deep learning cần nhiều data + tốt cho unstructured (ảnh, text). Tabular: tree-based ensembles vẫn là vua.</Callout>
          <CodeBlock language="python" title="Ensemble với scikit-learn">{`from sklearn.ensemble import (
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
# Thường tốt hơn bất kỳ model đơn lẻ nào 2-5%`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={["Ensemble kết hợp nhiều model yếu → model mạnh. 'Đồng tay vỗ nên kêu.'", "Bagging (Random Forest): giảm variance. Boosting (XGBoost): giảm bias. Stacking: kết hợp cả hai.", "Hiệu quả khi models DIVERSE — sai ở những chỗ khác nhau → triệt tiêu lỗi.", "XGBoost/LightGBM vẫn thắng deep learning cho tabular data (80%+ Kaggle competitions).", "Key: diversity > individual accuracy. 3 models 80% diverse > 3 models 90% giống nhau."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
