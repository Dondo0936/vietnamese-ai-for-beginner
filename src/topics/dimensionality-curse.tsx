"use client";

import { useState, useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "dimensionality-curse", title: "Curse of Dimensionality", titleVi: "Loi nguyen chieu cao — Khi nhieu hon lai te hon", description: "Hien tuong hieu suat mo hinh giam khi so chieu dac trung tang qua nhieu so voi luong du lieu co san.", category: "foundations", tags: ["dimensionality", "curse", "features", "overfitting"], difficulty: "intermediate", relatedSlugs: ["pca", "feature-engineering", "overfitting-underfitting"], vizType: "interactive" };

const TOTAL_STEPS = 7;

export default function DimensionalityCurseTopic() {
  const [dims, setDims] = useState(2);
  const volumeRatio = Math.pow(0.9, dims);
  const dataNeeded = Math.pow(10, Math.min(dims, 6));

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Tai sao tang so features khong luon tot hon?", options: ["Luon tot hon vi co nhieu thong tin", "Nhieu features + it data → model overfit vi khong gian qua rong, data qua thua (sparse)", "Chi xau khi features bi trung"], correct: 1, explanation: "10 features, 100 samples: moi vung co ~10 samples → model hoc duoc patterns. 1000 features, 100 samples: khong gian 1000 chieu, moi vung co ~0.0001 samples → model 'nhin thay' noise, khong thay pattern → overfit!" },
    { question: "PCA giai quyet curse of dimensionality bang cach nao?", options: ["Xoa random features", "Tim huong CO NHIEU VARIANCE NHAT, chieu data len huong do → giam chieu giu thong tin quan trong", "Tang so data points"], correct: 1, explanation: "PCA: tim eigenvectors cua covariance matrix → huong co nhieu variance nhat. 100 features co the nam tren 10 principal components (90% variance). Giam tu 100 → 10 chieu ma giu 90% thong tin. Data it sparse hon → model hoc tot hon." },
    { question: "Rule of thumb: can bao nhieu samples cho moi feature?", options: ["1 sample/feature la du", "10-20 samples/feature la toi thieu de model hoc duoc patterns", "1000 samples/feature"], correct: 1, explanation: "10 features → can 100-200 samples. 1000 features → can 10K-20K samples. Neu khong du: (1) Giam features (feature selection, PCA), (2) Tang data (augmentation, synthetic), (3) Dung model don gian (ít params hon)." },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate question="Ban co 100 samples, 5 features → model accuracy 90%. Tang len 500 features (giu 100 samples) → accuracy bao nhieu?" options={["95% — nhieu features = nhieu thong tin", "60-70% — qua nhieu features + it data → overfit, curse of dimensionality", "Van 90%"]} correct={1} explanation="Curse of dimensionality! 500 features, 100 samples → khong gian 500 chieu nhung chi co 100 diem → data cuc ky thua (sparse). Model tim thay 'patterns' gia (noise) → overfit. Giong tim nguoi trong sa mac: nhieu chieu hon = sa mac rong hon = kho tim hon!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <p className="mb-4 text-sm text-muted leading-relaxed">Keo thanh truot <strong className="text-foreground">so chieu</strong>{" "}de xem data can thiet tang bao nhieu.</p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">So chieu: {dims}</label>
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
              <text x={300} y={100} textAnchor="middle" fill="#64748b" fontSize={9}>{dims} chieu: data density giam {(100 - volumeRatio * 100).toFixed(0)}%, can ~{dataNeeded >= 1e6 ? "1M+" : dataNeeded.toLocaleString()} samples</text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment><p>Them 1 chieu = <strong>nhân</strong>{" "}khong gian, khong phai cong! 10 chieu → khong gian lon gap 10^10 so voi 1 chieu. Cung luong data tro nen <strong>cuc ky thua</strong>{" "}— giong 100 nguoi trong sa mac Sahara thay vi trong phong hoc. Model khong tim duoc pattern vi khong du 'hang xom'!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge question="Dataset Shopee: 10K users, 50 features → accuracy 85%. Team them 200 features tu click behavior → 250 features. Accuracy giam xuong 72%. Fix the nao?" options={["Tang model complexity", "Feature selection (chon 30-50 features tot nhat) hoac PCA (giam 250 → 50 chieu) → accuracy ve 85%+", "Xoa het features moi"]} correct={1} explanation="250 features / 10K samples = 1:40 ratio (can 1:10-20 toi thieu). Giai phap: (1) Feature importance → chon top 50, (2) PCA → 50 components giu 95% variance, (3) L1 regularization (Lasso) tu dong zero out features khong quan trong." />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p><strong>Curse of Dimensionality</strong>{" "}la hien tuong: tang so chieu → data thua (sparse) → model khong hoc duoc patterns, overfit tren noise.</p>
          <LaTeX block>{"\\text{Volume ratio} = \\left(\\frac{r}{R}\\right)^d \\xrightarrow{d \\to \\infty} 0 \\quad \\text{(hau het data nam o 'vo', khong o 'loi')}"}</LaTeX>
          <LaTeX block>{"\\text{Data needed} \\approx n^d \\quad \\text{(tang luy thua theo so chieu!)}"}</LaTeX>
          <p><strong>Giai phap:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Feature Selection:</strong>{" "}Chon features quan trong nhat (mutual information, L1 penalty)</li>
            <li><strong>PCA:</strong>{" "}Giam chieu giu variance. 100 features → 10 components</li>
            <li><strong>Regularization:</strong>{" "}L1 (Lasso) tu dong loai features, L2 (Ridge) giam overfitting</li>
            <li><strong>Tang data:</strong>{" "}Augmentation, synthetic data de 'lap day' khong gian</li>
          </ul>
          <CodeBlock language="python" title="Giam chieu voi PCA">{`from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, mutual_info_classif

# PCA: 250 features → 50 components (giu 95% variance)
pca = PCA(n_components=0.95)  # Giu 95% variance
X_reduced = pca.fit_transform(X_train)
print(f"250 features → {pca.n_components_} components")

# Feature Selection: chon 50 features tot nhat
selector = SelectKBest(mutual_info_classif, k=50)
X_selected = selector.fit_transform(X_train, y_train)

# So sanh
# Raw 250 features: accuracy 72% (overfit)
# PCA 50 components: accuracy 86%
# Top 50 features: accuracy 87%`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={["Curse of dimensionality: nhieu features + it data → sparse → overfit → accuracy GIAM.", "Them 1 chieu = NHAN khong gian (luy thua). 10 chieu can 10^10 data points de 'lap day'.", "Rule of thumb: 10-20 samples per feature. 100 features → can 1K-2K samples toi thieu.", "Giai phap: Feature Selection, PCA, Regularization (L1/L2), tang data.", "Deep learning it bi curse hon vi hoc representation tu dong — nhung van can du data cho so params."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
