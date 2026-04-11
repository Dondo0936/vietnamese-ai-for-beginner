"use client";

import { useState, useMemo } from "react";
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
  slug: "roc-auc",
  title: "ROC & AUC",
  titleVi: "ROC & AUC — Do kha nang phan biet",
  description:
    "Duong cong ROC va dien tich AUC do luong kha nang mo hinh phan biet lop duong va lop am o moi nguong quyet dinh.",
  category: "foundations",
  tags: ["roc", "auc", "classification", "metrics"],
  difficulty: "intermediate",
  relatedSlugs: ["confusion-matrix", "logistic-regression", "bias-variance"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

export default function RocAucTopic() {
  const [threshold, setThreshold] = useState(50);
  const tpr = Math.min(1, (100 - threshold) / 60 + 0.2);
  const fpr = Math.max(0, Math.min(1, (100 - threshold) / 150));

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "AUC = 0.5 co nghia la gi?",
      options: [
        "Model tot — dung 50% truong hop",
        "Model KHONG HON doan ngau nhien — duong ROC nam tren duong cheo, khong co kha nang phan biet",
        "Model hoan hao cho binary classification",
      ],
      correct: 1,
      explanation: "AUC 0.5 = duong ROC trung voi duong cheo (random classifier). Model khong phan biet duoc positive va negative tot hon tung dong xu. AUC 1.0 = hoan hao. AUC < 0.5 = te hon random (dao nhan nhan!). AUC 0.7-0.8 = kha. AUC > 0.9 = tot.",
    },
    {
      question: "Tai sao AUC tot hon accuracy cho imbalanced data?",
      options: [
        "AUC nhanh hon tinh",
        "Accuracy bi misleading khi data mat can bang (99% class A → predict A luon = 99% accuracy). AUC danh gia kha nang PHAN BIET giua classes, khong phu thuoc ty le",
        "AUC luon lon hon accuracy",
      ],
      correct: 1,
      explanation: "Phat hien gian lan (1% fraud): model predict 'khong gian lan' cho tat ca → 99% accuracy nhung KHONG phat hien bat ky fraud nao! AUC = 0.5 (random). AUC do: voi MOI threshold, model phan biet fraud vs legit tot the nao — khong bi ty le anh huong.",
    },
    {
      question: "ROC curve nam o phia tren-trai la tot hay xau?",
      options: [
        "Tot — TPR cao (bat nhieu positive) va FPR thap (it false alarm) = phan biet gioi",
        "Xau — model qua tu tin",
        "Khong lien quan den chat luong",
      ],
      correct: 0,
      explanation: "Goc tren-trai: TPR=1, FPR=0 = hoan hao (bat het positive, khong false alarm nao). Duong ROC cang gan goc nay → AUC cang gan 1.0 → model phan biet cang tot. Duong cheo (TPR=FPR) = random = AUC 0.5.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate
          question="Model phat hien gian lan ngan hang: 10.000 giao dich, 100 gian lan (1%). Model predict 'khong gian lan' cho TAT CA → accuracy 99%. Model nay tot khong?"
          options={[
            "Tot — 99% accuracy rat cao",
            "TE — 99% accuracy la gia tao, model khong phat hien BAT KY gian lan nao. Can metric khac: ROC-AUC",
            "Trung binh — can cai thien them",
          ]}
          correct={1}
          explanation="Accuracy bi 'lua' boi imbalanced data! 99% accuracy nhung 0% fraud detected = vo dung. ROC-AUC do kha nang phan biet THUC SU giua fraud va legit tai MOI nguong. Model nay co AUC = 0.5 (random) du accuracy 99%."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Keo <strong className="text-foreground">nguong quyet dinh</strong>{" "}
          de xem TPR va FPR thay doi — tao ra duong cong ROC.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Nguong: {threshold}%</label>
              <input type="range" min={5} max={95} value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full accent-accent" />
            </div>
            <svg viewBox="0 0 600 250" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">ROC Curve</text>
              {/* Axes */}
              <line x1={80} y1={30} x2={80} y2={210} stroke="#475569" strokeWidth={1} />
              <line x1={80} y1={210} x2={520} y2={210} stroke="#475569" strokeWidth={1} />
              <text x={40} y={120} fill="#94a3b8" fontSize={8} transform="rotate(-90, 40, 120)">TPR (Sensitivity)</text>
              <text x={300} y={235} textAnchor="middle" fill="#94a3b8" fontSize={8}>FPR (1 - Specificity)</text>

              {/* Diagonal (random) */}
              <line x1={80} y1={210} x2={520} y2={30} stroke="#475569" strokeWidth={1} strokeDasharray="4,3" />
              <text x={330} y={100} fill="#64748b" fontSize={7} transform="rotate(-38, 330, 100)">Random (AUC=0.5)</text>

              {/* ROC curve (simplified) */}
              <path d="M 80 210 Q 120 60, 300 45 Q 450 38, 520 30" fill="none" stroke="#3b82f6" strokeWidth={2} />

              {/* Current point */}
              <circle cx={80 + fpr * 440} cy={210 - tpr * 180} r={6} fill="#ef4444" stroke="white" strokeWidth={2} />
              <text x={85 + fpr * 440} y={205 - tpr * 180} fill="#ef4444" fontSize={8}>
                TPR={tpr.toFixed(2)}, FPR={fpr.toFixed(2)}
              </text>

              {/* AUC shading */}
              <path d="M 80 210 Q 120 60, 300 45 Q 450 38, 520 30 L 520 210 Z" fill="#3b82f6" opacity={0.1} />
              <text x={300} y={160} textAnchor="middle" fill="#3b82f6" fontSize={12} fontWeight="bold">AUC ≈ 0.87</text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment>
          <p>
            ROC cho thay: <strong>tang nguong</strong>{" "}→ it false alarm (FPR giam) nhung cung bo sot (TPR giam).
            <strong>{" "}Giam nguong</strong>{" "}→ bat nhieu hon (TPR tang) nhung nhieu false alarm (FPR tang).
            AUC do: <strong>voi MOI nguong, model phan biet gioi the nao</strong>{" "}
            — khong phu thuoc viec chon nguong cu the!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge
          question="Hai model phat hien ung thu: Model A (AUC=0.95), Model B (AUC=0.85). Nhung Model B co recall=0.98 tai threshold 0.3. Chon model nao cho screening?"
          options={[
            "Model A vi AUC cao hon",
            "Model B vi recall 0.98: trong y te, BO SOT (false negative) nguy hiem hon BAO DONG GIA (false positive). AUC cao nhung recall thap = bo sot benh nhan",
            "Dung ca hai",
          ]}
          correct={1}
          explanation="AUC do overall, nhung trong y te: false negative (bo sot ung thu) = nguy hiem. Model B voi recall 0.98 chi bo sot 2% benh nhan. Model A AUC cao hon nhung tai threshold cu the, recall co the thap hon. CONTEXT quyet dinh metric nao quan trong — khong co metric 'tot nhat' cho moi bai toan."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p>
            <strong>ROC (Receiver Operating Characteristic)</strong>{" "}
            va <strong>AUC (Area Under Curve)</strong>{" "}
            do kha nang mo hinh phan biet class duong va class am tai moi nguong quyet dinh.
          </p>
          <p><strong>Hai metric tren ROC:</strong></p>
          <LaTeX block>{"\\text{TPR (Sensitivity)} = \\frac{TP}{TP + FN} \\quad \\text{FPR} = \\frac{FP}{FP + TN}"}</LaTeX>
          <LaTeX block>{"\\text{AUC} = \\int_0^1 \\text{TPR}(\\text{FPR}) \\, d(\\text{FPR}) = P(\\text{score}_{\\text{pos}} > \\text{score}_{\\text{neg}})"}</LaTeX>

          <p>AUC = xac suat model cho diem cao hon cho positive so voi negative.</p>

          <Callout variant="tip" title="Dieu kien dung AUC">
            AUC tot cho: binary classification, so sanh models, imbalanced data. KHONG tot cho: multi-class (dung macro-average), khi can tim threshold cu the (dung Precision-Recall curve), ranking tasks (dung NDCG).
          </Callout>

          <CodeBlock language="python" title="Tinh ROC-AUC voi scikit-learn">
{`from sklearn.metrics import roc_auc_score, roc_curve
import matplotlib.pyplot as plt

# y_true: labels that (0/1)
# y_scores: xac suat du doan (0.0 - 1.0)
auc = roc_auc_score(y_true, y_scores)
print(f"AUC: {auc:.3f}")

# Ve ROC curve
fpr, tpr, thresholds = roc_curve(y_true, y_scores)
plt.plot(fpr, tpr, label=f"Model (AUC={auc:.2f})")
plt.plot([0, 1], [0, 1], "k--", label="Random (AUC=0.5)")
plt.xlabel("FPR (False Positive Rate)")
plt.ylabel("TPR (True Positive Rate)")
plt.title("ROC Curve - Phat hien gian lan")
plt.legend()

# Tim nguong toi uu (Youden's J)
j_scores = tpr - fpr
best_idx = j_scores.argmax()
best_threshold = thresholds[best_idx]
print(f"Optimal threshold: {best_threshold:.3f}")
print(f"TPR={tpr[best_idx]:.3f}, FPR={fpr[best_idx]:.3f}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={[
          "ROC curve: TPR vs FPR tai moi nguong. AUC = dien tich duoi ROC = kha nang phan biet tong the.",
          "AUC 0.5 = random, 0.7-0.8 = kha, 0.8-0.9 = tot, > 0.9 = xuat sac.",
          "AUC khong bi anh huong boi imbalanced data — tot hon accuracy cho fraud detection, medical diagnosis.",
          "AUC do overall ranking. Cho bai toan cu the, can xem Precision-Recall va chon threshold phu hop.",
          "Context quyet dinh: y te uu tien recall (khong bo sot), spam filter uu tien precision (khong an nham).",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
