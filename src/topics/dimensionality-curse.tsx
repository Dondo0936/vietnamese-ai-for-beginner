"use client";

import { useState, useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "dimensionality-curse", title: "Curse of Dimensionality", titleVi: "Lời nguyền chiều cao — Khi nhiều hơn lại tệ hơn", description: "Hiện tượng hiệu suất mô hình giảm khi số chiều đặc trưng tăng quá nhiều so với lượng dữ liệu có sẵn.", category: "foundations", tags: ["dimensionality", "curse", "features", "overfitting"], difficulty: "intermediate", relatedSlugs: ["pca", "feature-engineering", "overfitting-underfitting"], vizType: "interactive" };

const TOTAL_STEPS = 7;

export default function DimensionalityCurseTopic() {
  const [dims, setDims] = useState(2);
  const volumeRatio = Math.pow(0.9, dims);
  const dataNeeded = Math.pow(10, Math.min(dims, 6));

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Tại sao tăng số features không luôn tốt hơn?", options: ["Luôn tốt hơn vì có nhiều thông tin", "Nhiều features + ít data → model overfit vì không gian quá rộng, data quá thưa (sparse)", "Chỉ xấu khi features bị trùng"], correct: 1, explanation: "10 features, 100 samples: mỗi vùng có ~10 samples → model học được patterns. 1000 features, 100 samples: không gian 1000 chiều, mỗi vùng có ~0.0001 samples → model 'nhìn thấy' noise, không thấy pattern → overfit!" },
    { question: "PCA giải quyết curse of dimensionality bằng cách nào?", options: ["Xoá random features", "Tìm hướng CÓ NHIỀU VARIANCE NHẤT, chiếu data lên hướng đó → giảm chiều giữ thông tin quan trọng", "Tăng số data points"], correct: 1, explanation: "PCA: tìm eigenvectors của covariance matrix → hướng có nhiều variance nhất. 100 features có thể nằm trên 10 principal components (90% variance). Giảm từ 100 → 10 chiều mà giữ 90% thông tin. Data ít sparse hơn → model học tốt hơn." },
    { question: "Rule of thumb: cần bao nhiêu samples cho mỗi feature?", options: ["1 sample/feature là đủ", "10-20 samples/feature là tối thiểu để model học được patterns", "1000 samples/feature"], correct: 1, explanation: "10 features → cần 100-200 samples. 1000 features → cần 10K-20K samples. Nếu không đủ: (1) Giảm features (feature selection, PCA), (2) Tăng data (augmentation, synthetic), (3) Dùng model đơn giản (ít params hơn)." },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate question="Bạn có 100 samples, 5 features → model accuracy 90%. Tăng lên 500 features (giữ 100 samples) → accuracy bao nhiêu?" options={["95% — nhiều features = nhiều thông tin", "60-70% — quá nhiều features + ít data → overfit, curse of dimensionality", "Vẫn 90%"]} correct={1} explanation="Curse of dimensionality! 500 features, 100 samples → không gian 500 chiều nhưng chỉ có 100 điểm → data cực kỳ thưa (sparse). Model tìm thấy 'patterns' giả (noise) → overfit. Giống tìm người trong sa mạc: nhiều chiều hơn = sa mạc rộng hơn = khó tìm hơn!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">Kéo thanh trượt <strong className="text-foreground">số chiều</strong>{" "}để xem data cần thiết tăng bao nhiêu.</p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Số chiều: {dims}</label>
              <input type="range" min={1} max={20} value={dims} onChange={(e) => setDims(parseInt(e.target.value))} className="w-full accent-accent" />
            </div>
            <svg viewBox="0 0 600 120" className="w-full max-w-2xl mx-auto">
              <text x={15} y={30} fill="#94a3b8" fontSize={9}>Data density</text>
              <rect x={110} y={16} width={400} height={20} rx={4} fill="#1e293b" />
              <rect x={110} y={16} width={400 * volumeRatio} height={20} rx={4} fill={volumeRatio > 0.3 ? "#22c55e" : volumeRatio > 0.1 ? "#f59e0b" : "#ef4444"} />
              <text x={515} y={30} fill="#94a3b8" fontSize={8}>{(volumeRatio * 100).toFixed(1)}%</text>
              <text x={15} y={65} fill="#94a3b8" fontSize={9}>Data needed</text>
              <rect x={110} y={51} width={400} height={20} rx={4} fill="#1e293b" />
              <rect x={110} y={51} width={Math.min(400, 400 * Math.log10(dataNeeded) / 6)} height={20} rx={4} fill="#3b82f6" />
              <text x={515} y={65} fill="#94a3b8" fontSize={8}>{dataNeeded >= 1e6 ? "1M+" : dataNeeded.toLocaleString()}</text>
              <text x={300} y={100} textAnchor="middle" fill="#64748b" fontSize={9}>{dims} chiều: data density giảm {(100 - volumeRatio * 100).toFixed(0)}%, cần ~{dataNeeded >= 1e6 ? "1M+" : dataNeeded.toLocaleString()} samples</text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment><p>Thêm 1 chiều = <strong>nhân</strong>{" "}không gian, không phải cộng! 10 chiều → không gian lớn gấp 10^10 so với 1 chiều. Cùng lượng data trở nên <strong>cực kỳ thưa</strong>{" "}— giống 100 người trong sa mạc Sahara thay vì trong phòng học. Model không tìm được pattern vì không đủ 'hàng xóm'!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge question="Dataset Shopee: 10K users, 50 features → accuracy 85%. Team thêm 200 features từ click behavior → 250 features. Accuracy giảm xuống 72%. Fix thế nào?" options={["Tăng model complexity", "Feature selection (chọn 30-50 features tốt nhất) hoặc PCA (giảm 250 → 50 chiều) → accuracy về 85%+", "Xoá hết features mới"]} correct={1} explanation="250 features / 10K samples = 1:40 ratio (cần 1:10-20 tối thiểu). Giải pháp: (1) Feature importance → chọn top 50, (2) PCA → 50 components giữ 95% variance, (3) L1 regularization (Lasso) tự động zero out features không quan trọng." />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Curse of Dimensionality</strong>{" "}là hiện tượng: tăng số chiều → data thưa (sparse) → model không học được patterns, overfit trên noise.</p>
          <LaTeX block>{"\\text{Volume ratio} = \\left(\\frac{r}{R}\\right)^d \\xrightarrow{d \\to \\infty} 0 \\quad \\text{(hầu hết data nằm ở 'vỏ', không ở 'lõi')}"}</LaTeX>
          <LaTeX block>{"\\text{Data needed} \\approx n^d \\quad \\text{(tăng luỹ thừa theo số chiều!)}"}</LaTeX>
          <p><strong>Giải pháp:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Feature Selection:</strong>{" "}Chọn features quan trọng nhất (mutual information, L1 penalty)</li>
            <li><strong>PCA:</strong>{" "}Giảm chiều giữ variance. 100 features → 10 components</li>
            <li><strong>Regularization:</strong>{" "}L1 (Lasso) tự động loại features, L2 (Ridge) giảm overfitting</li>
            <li><strong>Tăng data:</strong>{" "}Augmentation, synthetic data để 'lấp đầy' không gian</li>
          </ul>
          <CodeBlock language="python" title="Giảm chiều với PCA">{`from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, mutual_info_classif

# PCA: 250 features → 50 components (giữ 95% variance)
pca = PCA(n_components=0.95)  # Giữ 95% variance
X_reduced = pca.fit_transform(X_train)
print(f"250 features → {pca.n_components_} components")

# Feature Selection: chọn 50 features tốt nhất
selector = SelectKBest(mutual_info_classif, k=50)
X_selected = selector.fit_transform(X_train, y_train)

# So sánh
# Raw 250 features: accuracy 72% (overfit)
# PCA 50 components: accuracy 86%
# Top 50 features: accuracy 87%`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={["Curse of dimensionality: nhiều features + ít data → sparse → overfit → accuracy GIẢM.", "Thêm 1 chiều = NHÂN không gian (luỹ thừa). 10 chiều cần 10^10 data points để 'lấp đầy'.", "Rule of thumb: 10-20 samples per feature. 100 features → cần 1K-2K samples tối thiểu.", "Giải pháp: Feature Selection, PCA, Regularization (L1/L2), tăng data.", "Deep learning ít bị curse hơn vì học representation tự động — nhưng vẫn cần đủ data cho số params."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
