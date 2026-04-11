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
  titleVi: "ROC & AUC — Đo khả năng phân biệt",
  description:
    "Đường cong ROC và diện tích AUC đo lường khả năng mô hình phân biệt lớp dương và lớp âm ở mọi ngưỡng quyết định.",
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
      question: "AUC = 0.5 có nghĩa là gì?",
      options: [
        "Model tốt — đúng 50% trường hợp",
        "Model KHÔNG HƠN đoán ngẫu nhiên — đường ROC nằm trên đường chéo, không có khả năng phân biệt",
        "Model hoàn hảo cho binary classification",
      ],
      correct: 1,
      explanation: "AUC 0.5 = đường ROC trùng với đường chéo (random classifier). Model không phân biệt được positive và negative tốt hơn tung đồng xu. AUC 1.0 = hoàn hảo. AUC < 0.5 = tệ hơn random (đảo nhãn nhãn!). AUC 0.7-0.8 = khá. AUC > 0.9 = tốt.",
    },
    {
      question: "Tại sao AUC tốt hơn accuracy cho imbalanced data?",
      options: [
        "AUC nhanh hơn tính",
        "Accuracy bị misleading khi data mất cân bằng (99% class A → predict A luôn = 99% accuracy). AUC đánh giá khả năng PHÂN BIỆT giữa classes, không phụ thuộc tỷ lệ",
        "AUC luôn lớn hơn accuracy",
      ],
      correct: 1,
      explanation: "Phát hiện gian lận (1% fraud): model predict 'không gian lận' cho tất cả → 99% accuracy nhưng KHÔNG phát hiện bất kỳ fraud nào! AUC = 0.5 (random). AUC đo: với MỌI threshold, model phân biệt fraud vs legit tốt thế nào — không bị tỷ lệ ảnh hưởng.",
    },
    {
      question: "ROC curve nằm ở phía trên-trái là tốt hay xấu?",
      options: [
        "Tốt — TPR cao (bắt nhiều positive) và FPR thấp (ít false alarm) = phân biệt giỏi",
        "Xấu — model quá tự tin",
        "Không liên quan đến chất lượng",
      ],
      correct: 0,
      explanation: "Góc trên-trái: TPR=1, FPR=0 = hoàn hảo (bắt hết positive, không false alarm nào). Đường ROC càng gần góc này → AUC càng gần 1.0 → model phân biệt càng tốt. Đường chéo (TPR=FPR) = random = AUC 0.5.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Model phát hiện gian lận ngân hàng: 10.000 giao dịch, 100 gian lận (1%). Model predict 'không gian lận' cho TẤT CẢ → accuracy 99%. Model này tốt không?"
          options={[
            "Tốt — 99% accuracy rất cao",
            "TỆ — 99% accuracy là giả tạo, model không phát hiện BẤT KỲ gian lận nào. Cần metric khác: ROC-AUC",
            "Trung bình — cần cải thiện thêm",
          ]}
          correct={1}
          explanation="Accuracy bị 'lừa' bởi imbalanced data! 99% accuracy nhưng 0% fraud detected = vô dụng. ROC-AUC đo khả năng phân biệt THỰC SỰ giữa fraud và legit tại MỌI ngưỡng. Model này có AUC = 0.5 (random) dù accuracy 99%."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo <strong className="text-foreground">ngưỡng quyết định</strong>{" "}
          để xem TPR và FPR thay đổi — tạo ra đường cong ROC.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Ngưỡng: {threshold}%</label>
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

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            ROC cho thấy: <strong>tăng ngưỡng</strong>{" "}→ ít false alarm (FPR giảm) nhưng cũng bỏ sót (TPR giảm).
            <strong>{" "}Giảm ngưỡng</strong>{" "}→ bắt nhiều hơn (TPR tăng) nhưng nhiều false alarm (FPR tăng).
            AUC đo: <strong>với MỌI ngưỡng, model phân biệt giỏi thế nào</strong>{" "}
            — không phụ thuộc việc chọn ngưỡng cụ thể!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Hai model phát hiện ung thư: Model A (AUC=0.95), Model B (AUC=0.85). Nhưng Model B có recall=0.98 tại threshold 0.3. Chọn model nào cho screening?"
          options={[
            "Model A vì AUC cao hơn",
            "Model B vì recall 0.98: trong y tế, BỎ SÓT (false negative) nguy hiểm hơn BÁO ĐỘNG GIẢ (false positive). AUC cao nhưng recall thấp = bỏ sót bệnh nhân",
            "Dùng cả hai",
          ]}
          correct={1}
          explanation="AUC đo overall, nhưng trong y tế: false negative (bỏ sót ung thư) = nguy hiểm. Model B với recall 0.98 chỉ bỏ sót 2% bệnh nhân. Model A AUC cao hơn nhưng tại threshold cụ thể, recall có thể thấp hơn. CONTEXT quyết định metric nào quan trọng — không có metric 'tốt nhất' cho mọi bài toán."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>ROC (Receiver Operating Characteristic)</strong>{" "}
            và <strong>AUC (Area Under Curve)</strong>{" "}
            đo khả năng mô hình phân biệt class dương và class âm tại mọi ngưỡng quyết định.
          </p>
          <p><strong>Hai metric trên ROC:</strong></p>
          <LaTeX block>{"\\text{TPR (Sensitivity)} = \\frac{TP}{TP + FN} \\quad \\text{FPR} = \\frac{FP}{FP + TN}"}</LaTeX>
          <LaTeX block>{"\\text{AUC} = \\int_0^1 \\text{TPR}(\\text{FPR}) \\, d(\\text{FPR}) = P(\\text{score}_{\\text{pos}} > \\text{score}_{\\text{neg}})"}</LaTeX>

          <p>AUC = xác suất model cho điểm cao hơn cho positive so với negative.</p>

          <Callout variant="tip" title="Điều kiện dùng AUC">
            AUC tốt cho: binary classification, so sánh models, imbalanced data. KHÔNG tốt cho: multi-class (dùng macro-average), khi cần tìm threshold cụ thể (dùng Precision-Recall curve), ranking tasks (dùng NDCG).
          </Callout>

          <CodeBlock language="python" title="Tính ROC-AUC với scikit-learn">
{`from sklearn.metrics import roc_auc_score, roc_curve
import matplotlib.pyplot as plt

# y_true: labels thật (0/1)
# y_scores: xác suất dự đoán (0.0 - 1.0)
auc = roc_auc_score(y_true, y_scores)
print(f"AUC: {auc:.3f}")

# Vẽ ROC curve
fpr, tpr, thresholds = roc_curve(y_true, y_scores)
plt.plot(fpr, tpr, label=f"Model (AUC={auc:.2f})")
plt.plot([0, 1], [0, 1], "k--", label="Random (AUC=0.5)")
plt.xlabel("FPR (False Positive Rate)")
plt.ylabel("TPR (True Positive Rate)")
plt.title("ROC Curve - Phát hiện gian lận")
plt.legend()

# Tìm ngưỡng tối ưu (Youden's J)
j_scores = tpr - fpr
best_idx = j_scores.argmax()
best_threshold = thresholds[best_idx]
print(f"Optimal threshold: {best_threshold:.3f}")
print(f"TPR={tpr[best_idx]:.3f}, FPR={fpr[best_idx]:.3f}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "ROC curve: TPR vs FPR tại mọi ngưỡng. AUC = diện tích dưới ROC = khả năng phân biệt tổng thể.",
          "AUC 0.5 = random, 0.7-0.8 = khá, 0.8-0.9 = tốt, > 0.9 = xuất sắc.",
          "AUC không bị ảnh hưởng bởi imbalanced data — tốt hơn accuracy cho fraud detection, medical diagnosis.",
          "AUC đo overall ranking. Cho bài toán cụ thể, cần xem Precision-Recall và chọn threshold phù hợp.",
          "Context quyết định: y tế ưu tiên recall (không bỏ sót), spam filter ưu tiên precision (không ăn nhầm).",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
