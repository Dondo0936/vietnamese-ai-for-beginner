"use client";

import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX, TopicLink } from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "data-preprocessing", title: "Data Preprocessing", titleVi: "Tiền xử lý dữ liệu — Rửa rau trước khi nấu", description: "Các bước làm sạch, chuẩn hoá và biến đổi dữ liệu thô trước khi đưa vào mô hình máy học.", category: "foundations", tags: ["preprocessing", "cleaning", "normalization", "data"], difficulty: "beginner", relatedSlugs: ["feature-engineering", "train-val-test", "data-pipelines"], vizType: "interactive" };

const TOTAL_STEPS = 7;

export default function DataPreprocessingTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "Missing values: khi nào dùng mean imputation, khi nào drop?", options: ["Luôn dùng mean", "Mean cho missing < 5% random. Drop row khi > 30% missing. Domain-specific imputation cho y tế/tài chính", "Luôn drop rows có missing"], correct: 1, explanation: "< 5% missing random → mean/median imputation ok. 5-30% → advanced imputation (KNN, MICE). > 30% → drop column (không đủ thông tin). Y tế: missing lab result ≠ random (bệnh nhân không xét nghiệm = có lý do) → cần domain knowledge!" },
    { question: "Tại sao cần normalize/standardize features?", options: ["Để data đẹp hơn", "Features có scale khác nhau (tuổi: 0-100, lương: 0-1B) → gradient descent và distance-based models bị bias bởi feature lớn", "Chỉ cần cho deep learning"], correct: 1, explanation: "KNN: khoảng cách bị dominated bởi feature có range lớn (lương 1B > tuổi 100 → KNN chỉ nhìn lương). Gradient descent: features lớn → gradients lớn → học không ổn định. StandardScaler (mean=0, std=1) cân bằng mọi feature. Tree-based models không cần vì chỉ nhìn rankings." },
    { question: "Feature 'quận_huyện' có 700 giá trị. One-hot encoding tạo 700 columns. Vấn đề?", options: ["Không vấn đề", "Curse of dimensionality: 700 sparse columns. Dùng target encoding (thay category bằng mean(target)) hoặc embedding", "Chỉ dùng khi data > 1M rows"], correct: 1, explanation: "One-hot 700 categories = 700 sparse columns (hầu hết là 0). Overfit + chậm. Target encoding: thay 'Hoàn Kiếm' bằng mean(giá_nhà) của Hoàn Kiếm = 8.5 tỷ → 1 column, giữ thông tin. Hoặc: embedding (learned representation) cho deep learning." },
    { type: "fill-blank", question: "StandardScaler biến đổi feature x thành z = (x − {blank}) / σ, đảm bảo dữ liệu có trung bình bằng 0 và độ lệch chuẩn bằng 1.", blanks: [{ answer: "μ", accept: ["mean", "trung bình", "mu"] }], explanation: "StandardScaler trừ mean (μ) và chia độ lệch chuẩn (σ): z = (x − μ) / σ. Sau khi scale, mọi feature có phân phối chuẩn hóa với mean=0 và std=1, giúp gradient descent và các thuật toán dựa trên khoảng cách hoạt động công bằng giữa các features." },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate question="Data giá nhà Hà Nội: 15% missing diện tích, 'tuổi' có giá trị -5 (vô nghĩa), 'giá' có outlier 500 tỷ (lỗi nhập). Model accuracy chỉ 55%. Tại sao?" options={["Model quá đơn giản", "Data bẩn → 'garbage in, garbage out'. Cần tiền xử lý: xử lý missing, loại outliers, sửa errors TRƯỚC khi train", "Cần nhiều data hơn"]} correct={1} explanation="Garbage in, garbage out! Missing values → model confuse. Outlier 500 tỷ → kéo mean, skew distribution. Tuổi -5 → vô nghĩa. Preprocessing là BƯỚC ĐẦU TIÊN và QUAN TRỌNG NHẤT. Giống rửa rau trước khi nấu — rau bẩn thì món ăn hay cũng tệ!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 120" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">Pipeline tiền xử lý dữ liệu</text>
              {["Missing Values", "Outliers", "Encoding", "Scaling", "Feature Select"].map((step, i) => {
                const x = 20 + i * 118;
                const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6"];
                return (<g key={i}><rect x={x} y={30} width={105} height={40} rx={8} fill={colors[i]} opacity={0.8} /><text x={x + 52} y={55} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">{step}</text>{i < 4 && <text x={x + 112} y={52} fill="#94a3b8" fontSize={14}>→</text>}</g>);
              })}
              <text x={300} y={95} textAnchor="middle" fill="#94a3b8" fontSize={9}>Mỗi bước quan trọng — bỏ sót 1 bước → model tệ</text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment><p>80% thời gian ML là <strong>xử lý dữ liệu</strong>, chỉ 20% là train model. Data sạch + model đơn giản &gt; Data bẩn + model phức tạp. <strong>Rửa rau trước khi nấu</strong>{" "}— đặt món ăn ngon từ bước chuẩn bị nguyên liệu!</p></AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge question="Feature 'thu nhập' (VND): range 5 triệu - 500 triệu. Feature 'tuổi': range 18-65. Dùng KNN. Kết quả bị dominated bởi thu nhập. Fix?" options={["Dùng model khác", "StandardScaler: chuyển cả hai về mean=0, std=1. Sau đó KNN nhìn cả tuổi và thu nhập công bằng", "Bỏ feature thu nhập"]} correct={1} explanation="Không scale: khoảng cách KNN = sqrt((500M-5M)^2 + (65-18)^2) ≈ sqrt((495M)^2 + 47^2) ≈ 495M. Tuổi bị ignore hoàn toàn! Sau StandardScaler: cả hai features ở scale tương tự → KNN xem xét cả hai công bằng." />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p><strong>Data Preprocessing</strong>{" "}là các bước làm sạch và chuẩn bị dữ liệu trước khi train model — bước quan trọng nhất của ML pipeline.
          Bước tiếp theo sau preprocessing thường là <TopicLink slug="feature-engineering">feature engineering</TopicLink> để tạo thêm đặc trưng có ý nghĩa, và sau đó chia dữ liệu bằng <TopicLink slug="train-val-test">train/val/test split</TopicLink>.</p>
          <p><strong>5 bước chính:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Missing values:</strong>{" "}Mean/median imputation, KNN imputation, drop</li>
            <li><strong>Outliers:</strong>{" "}IQR method, Z-score, domain knowledge</li>
            <li><strong>Encoding:</strong>{" "}One-hot (ít categories), Target encoding (nhiều categories), Ordinal</li>
            <li><strong>Scaling:</strong>{" "}StandardScaler (mean=0, std=1), MinMaxScaler (0-1)</li>
            <li><strong>Feature selection:</strong>{" "}Loại features noise, giảm dimensionality</li>
          </ul>
          <LaTeX block>{"\\text{Z-score: } z = \\frac{x - \\mu}{\\sigma} \\quad |z| > 3 \\rightarrow \\text{outlier}"}</LaTeX>
          <LaTeX block>{"\\text{IQR method: } [Q_1 - 1.5 \\cdot \\text{IQR}, Q_3 + 1.5 \\cdot \\text{IQR}]"}</LaTeX>
          <Callout variant="warning" title="Data Leakage">QUAN TRỌNG: fit scaler/imputer CHỈ trên train set! Đừng fit trên toàn bộ data (bao gồm test) → thông tin test 'rò rỉ' vào train → kết quả giả tạo. Xem thêm về <TopicLink slug="python-for-ml">Python cho ML</TopicLink> để dùng sklearn Pipeline tránh data leakage tự động.</Callout>
          <CodeBlock language="python" title="Pipeline tiền xử lý đúng cách">{`from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

# Định nghĩa pipeline — KHÔNG leak data
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

# fit CHỈ trên train, transform val/test
preprocessor.fit(X_train)           # Học từ train
X_train_clean = preprocessor.transform(X_train)
X_val_clean = preprocessor.transform(X_val)    # Không fit!
X_test_clean = preprocessor.transform(X_test)  # Không fit!`}</CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={["Preprocessing = 80% thời gian ML. 'Garbage in, garbage out' — data sạch là nền tảng.", "5 bước: Missing values → Outliers → Encoding → Scaling → Feature Selection.", "KHÔNG fit scaler/imputer trên test data — data leakage làm kết quả giả tạo.", "StandardScaler cho gradient-based models và KNN. Tree-based models không cần scaling.", "Dùng sklearn Pipeline để tự động hoá và tránh data leakage."]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
