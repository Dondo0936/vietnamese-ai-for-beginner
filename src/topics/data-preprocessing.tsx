"use client";

import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "data-preprocessing", title: "Data Preprocessing", titleVi: "Tien xu ly du lieu — Rua rau truoc khi nau", description: "Cac buoc lam sach, chuan hoa va bien doi du lieu tho truoc khi dua vao mo hinh may hoc.", category: "foundations", tags: ["preprocessing", "cleaning", "normalization", "data"], difficulty: "beginner", relatedSlugs: ["feature-engineering", "train-val-test", "data-pipelines"], vizType: "interactive" };

const TOTAL_STEPS = 7;

export default function DataPreprocessingTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Missing values: khi nao dung mean imputation, khi nao drop?", options: ["Luon dung mean", "Mean cho missing < 5% random. Drop row khi > 30% missing. Domain-specific imputation cho y te/tai chinh", "Luon drop rows co missing"], correct: 1, explanation: "< 5% missing random → mean/median imputation ok. 5-30% → advanced imputation (KNN, MICE). > 30% → drop column (khong du thong tin). Y te: missing lab result ≠ random (benh nhan khong xet nghiem = co ly do) → can domain knowledge!" },
    { question: "Tai sao can normalize/standardize features?", options: ["De data dep hon", "Features co scale khac nhau (tuoi: 0-100, luong: 0-1B) → gradient descent va distance-based models bi bias boi feature lon", "Chi can cho deep learning"], correct: 1, explanation: "KNN: khoang cach bi dominated boi feature co range lon (luong 1B > tuoi 100 → KNN chi nhin luong). Gradient descent: features lon → gradients lon → hoc khong on dinh. StandardScaler (mean=0, std=1) can bang moi feature. Tree-based models khong can vi chi nhin rankings." },
    { question: "Feature 'quan_huyen' co 700 gia tri. One-hot encoding tao 700 columns. Van de?", options: ["Khong van de", "Curse of dimensionality: 700 sparse columns. Dung target encoding (thay category bang mean(target)) hoac embedding", "Chi dung khi data > 1M rows"], correct: 1, explanation: "One-hot 700 categories = 700 sparse columns (hau het la 0). Overfit + cham. Target encoding: thay 'Hoan Kiem' bang mean(gia_nha) cua Hoan Kiem = 8.5 ty → 1 column, giu thong tin. Hoac: embedding (learned representation) cho deep learning." },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
        <PredictionGate question="Data gia nha Ha Noi: 15% missing dien tich, 'tuoi' co gia tri -5 (vo nghia), 'gia' co outlier 500 ty (loi nhap). Model accuracy chi 55%. Tai sao?" options={["Model qua don gian", "Data ban → 'garbage in, garbage out'. Can tien xu ly: xu ly missing, loai outliers, sua errors TRUOC khi train", "Can nhieu data hon"]} correct={1} explanation="Garbage in, garbage out! Missing values → model confuse. Outlier 500 ty → keo mean, skew distribution. Tuoi -5 → vo nghia. Preprocessing la BUOC DAU TIEN va QUAN TRONG NHAT. Giong rua rau truoc khi nau — rau ban thi mon an hay cung te!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Kham pha">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 120" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">Pipeline tien xu ly du lieu</text>
              {["Missing Values", "Outliers", "Encoding", "Scaling", "Feature Select"].map((step, i) => {
                const x = 20 + i * 118;
                const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6"];
                return (<g key={i}><rect x={x} y={30} width={105} height={40} rx={8} fill={colors[i]} opacity={0.8} /><text x={x + 52} y={55} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">{step}</text>{i < 4 && <text x={x + 112} y={52} fill="#94a3b8" fontSize={14}>→</text>}</g>);
              })}
              <text x={300} y={95} textAnchor="middle" fill="#94a3b8" fontSize={9}>Moi buoc quan trong — bo sot 1 buoc → model te</text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha">
        <AhaMoment><p>80% thoi gian ML la <strong>xu ly du lieu</strong>, chi 20% la train model. Data sach + model don gian &gt; Data ban + model phuc tap. <strong>Rua rau truoc khi nau</strong>{" "}— dat mon an ngon tu buoc chuan bi nguyen lieu!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thu thach">
        <InlineChallenge question="Feature 'thu nhap' (VND): range 5 trieu - 500 trieu. Feature 'tuoi': range 18-65. Dung KNN. Ket qua bi dominated boi thu nhap. Fix?" options={["Dung model khac", "StandardScaler: chuyen ca hai ve mean=0, std=1. Sau do KNN nhin ca tuoi va thu nhap cong bang", "Bo feature thu nhap"]} correct={1} explanation="Khong scale: khoang cach KNN = sqrt((500M-5M)^2 + (65-18)^2) ≈ sqrt((495M)^2 + 47^2) ≈ 495M. Tuoi bi ignore hoan toan! Sau StandardScaler: ca hai features o scale tuong tu → KNN xem xet ca hai cong bang." />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Ly thuyet">
        <ExplanationSection>
          <p><strong>Data Preprocessing</strong>{" "}la cac buoc lam sach va chuan bi du lieu truoc khi train model — buoc quan trong nhat cua ML pipeline.</p>
          <p><strong>5 buoc chinh:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Missing values:</strong>{" "}Mean/median imputation, KNN imputation, drop</li>
            <li><strong>Outliers:</strong>{" "}IQR method, Z-score, domain knowledge</li>
            <li><strong>Encoding:</strong>{" "}One-hot (it categories), Target encoding (nhieu categories), Ordinal</li>
            <li><strong>Scaling:</strong>{" "}StandardScaler (mean=0, std=1), MinMaxScaler (0-1)</li>
            <li><strong>Feature selection:</strong>{" "}Loai features noise, giam dimensionality</li>
          </ul>
          <LaTeX block>{"\\text{Z-score: } z = \\frac{x - \\mu}{\\sigma} \\quad |z| > 3 \\rightarrow \\text{outlier}"}</LaTeX>
          <LaTeX block>{"\\text{IQR method: } [Q_1 - 1.5 \\cdot \\text{IQR}, Q_3 + 1.5 \\cdot \\text{IQR}]"}</LaTeX>
          <Callout variant="warning" title="Data Leakage">QUAN TRONG: fit scaler/imputer CHI tren train set! Dung fit tren toan bo data (bao gom test) → thong tin test 'ro ri' vao train → ket qua gia tao.</Callout>
          <CodeBlock language="python" title="Pipeline tien xu ly dung cach">{`from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

# Dinh nghia pipeline — KHONG leak data
numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore")),
])

preprocessor = ColumnTransformer([
    ("num", numeric_pipeline, ["tuoi", "dien_tich", "thu_nhap"]),
    ("cat", categorical_pipeline, ["quan", "loai_nha"]),
])

# fit CHI tren train, transform val/test
preprocessor.fit(X_train)           # Hoc tu train
X_train_clean = preprocessor.transform(X_train)
X_val_clean = preprocessor.transform(X_val)    # Khong fit!
X_test_clean = preprocessor.transform(X_test)  # Khong fit!`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tom tat">
        <MiniSummary points={["Preprocessing = 80% thoi gian ML. 'Garbage in, garbage out' — data sach la nen tang.", "5 buoc: Missing values → Outliers → Encoding → Scaling → Feature Selection.", "KHONG fit scaler/imputer tren test data — data leakage lam ket qua gia tao.", "StandardScaler cho gradient-based models va KNN. Tree-based models khong can scaling.", "Dung sklearn Pipeline de tu dong hoa va tranh data leakage."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
