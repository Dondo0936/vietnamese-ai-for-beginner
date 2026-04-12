"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "train-val-test",
  title: "Train / Validation / Test Split",
  titleVi: "Chia dữ liệu — Học, Kiểm tra, Thi thật",
  description:
    "Phương pháp chia dữ liệu thành ba tập riêng biệt để huấn luyện, điều chỉnh và đánh giá mô hình một cách khách quan.",
  category: "foundations",
  tags: ["train", "validation", "test", "split"],
  difficulty: "beginner",
  relatedSlugs: ["cross-validation", "overfitting-underfitting", "bias-variance"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

export default function TrainValTestTopic() {
  const [trainPct, setTrainPct] = useState(70);
  const valPct = 15;
  const testPct = 100 - trainPct - valPct;

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao KHÔNG được dùng test set để chọn model hay tune hyperparameters?",
      options: [
        "Test set quá nhỏ",
        "Nếu dùng test set để quyết định → model được 'tối ưu' cho test set → không còn khách quan, đánh giá giả tạo",
        "Test set không có labels",
      ],
      correct: 1,
      explanation: "Test set là 'đề thi cuối kỳ' — chỉ được mở 1 LẦN để đánh giá cuối cùng. Nếu 'luyện đề thi' trên test set → điểm cao nhưng không phản ánh năng lực thật. Validation set là 'đề kiểm tra giữa kỳ' — dùng để tune, không phải để đánh giá cuối.",
    },
    {
      question: "Data có 1000 mẫu. Chia 70/15/15. Có vấn đề gì không?",
      options: [
        "Không vấn đề gì",
        "Có thể: 150 test samples ít quá để đánh giá đáng tin cậy. Cần cross-validation hoặc stratified split",
        "Cần chia 50/25/25",
      ],
      correct: 1,
      explanation: "1000 mẫu là ít. 150 test samples → confidence interval rộng. Giải pháp: (1) K-fold cross-validation (dùng tất cả data cho train VÀ evaluate), (2) Stratified split (đảm bảo tỷ lệ classes đều), (3) Nếu có thể: thu thập thêm data.",
    },
    {
      question: "Model accuracy: Train=99%, Val=75%, Test=73%. Vấn đề gì?",
      options: [
        "Model tốt — 99% accuracy",
        "OVERFITTING: model học thuộc train set (99%) nhưng không generalize (75% val, 73% test). Gap 24% quá lớn",
        "Test set quá khó",
      ],
      correct: 1,
      explanation: "Train-Val gap = 99-75 = 24% → overfitting nghiêm trọng. Model 'học thuộc' train set thay vì học patterns chung. Giải pháp: regularization, dropout, tăng data, giảm model complexity, early stopping. Val ≈ Test (75 vs 73) cho thấy val set đại diện tốt.",
    },
    {
      type: "fill-blank",
      question: "Trong quy trình ML, ta fit (huấn luyện) StandardScaler CHỈ trên tập {blank}, sau đó chỉ dùng transform (không fit lại) trên tập {blank} và tập {blank} để tránh data leakage.",
      blanks: [
        { answer: "train", accept: ["training", "tập train", "tập huấn luyện"] },
        { answer: "validation", accept: ["val", "tập val", "tập validation"] },
        { answer: "test", accept: ["tập test", "tập kiểm tra"] },
      ],
      explanation: "Data leakage xảy ra khi thông tin từ val/test 'rò rỉ' vào quá trình huấn luyện. Fit scaler trên TOÀN BỘ data trước khi split là lỗi phổ biến — scaler sẽ 'biết' phân phối của test set, làm kết quả đánh giá không còn khách quan.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn ôn thi đại học. Giáo viên cho 100 đề. Bạn làm cả 100 đề để luyện, rồi dùng chính những đề đó để chấm điểm mình. Điểm rất cao. Nhưng đi thi thật lại trượt. Tại sao?"
          options={[
            "Đề thi thật khó hơn đề ôn",
            "Bạn đã 'học thuộc' đáp án của 100 đề → điểm cao giả tạo. Cần giữ riêng vài đề CHƯA LÀM để kiểm tra năng lực thật",
            "Bạn không ôn đủ",
          ]}
          correct={1}
          explanation="Đúng! Giống ML: nếu dùng TẤT CẢ data để train → model 'học thuộc' → accuracy cao trên train data nhưng tệ trên data mới. Cần giữ riêng: validation set (đề kiểm tra giữa kỳ) và test set (đề thi cuối kỳ — chỉ làm 1 lần)."
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Kéo thanh trượt để điều chỉnh <strong className="text-foreground">tỷ lệ chia dữ liệu</strong>.
        </p>
        <VisualizationSection>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Train: {trainPct}%</label>
              <input type="range" min={50} max={85} value={trainPct} onChange={(e) => setTrainPct(parseInt(e.target.value))} className="w-full accent-accent" />
            </div>
            <svg viewBox="0 0 600 100" className="w-full max-w-2xl mx-auto">
              <rect x={20} y={20} width={560 * trainPct / 100} height={40} rx={6} fill="#3b82f6" />
              <text x={20 + 560 * trainPct / 200} y={44} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                Train {trainPct}%
              </text>

              <rect x={20 + 560 * trainPct / 100} y={20} width={560 * valPct / 100} height={40} rx={0} fill="#f59e0b" />
              <text x={20 + 560 * (trainPct + valPct / 2) / 100} y={44} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                Val {valPct}%
              </text>

              <rect x={20 + 560 * (trainPct + valPct) / 100} y={20} width={560 * testPct / 100} height={40} rx={6} fill="#22c55e" />
              <text x={20 + 560 * (trainPct + valPct + testPct / 2) / 100} y={44} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                Test {testPct}%
              </text>

              <text x={300} y={85} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                Train: học | Val: điều chỉnh hyperparams | Test: đánh giá cuối cùng (chỉ 1 lần!)
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Train set = <strong>sách giáo khoa</strong>{" "}(học từ đây).
            Validation set = <strong>đề kiểm tra giữa kỳ</strong>{" "}(điều chỉnh cách học).
            Test set = <strong>đề thi cuối kỳ</strong>{" "}(chỉ làm 1 lần — đánh giá năng lực thật).
            Nếu &quot;luyện đề thi&quot; trên test set → điểm cao nhưng <strong>không phản ánh năng lực thật!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Dataset có 10.000 mẫu: 9500 class A, 500 class B (mất cân bằng 19:1). Random split 70/15/15. Có vấn đề gì?"
          options={[
            "Không vấn đề",
            "Test set 1500 mẫu có thể chỉ có 75 class B (5%) — quá ít để đánh giá đáng tin cậy. Cần STRATIFIED split giữ tỷ lệ classes",
            "Cần chia 50/25/25",
          ]}
          correct={1}
          explanation="Random split có thể cho test set với rất ít class B (hoặc quá nhiều). Stratified split: đảm bảo TỪNG TẬP đều có tỷ lệ 19:1 giống tổng thể. Train: 6650 A + 350 B. Val: 1425 A + 75 B. Test: 1425 A + 75 B. Mỗi tập đại diện cho distribution gốc!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Train/Validation/Test Split</strong>{" "}
            chia dữ liệu thành 3 tập để đảm bảo đánh giá model khách quan — cơ bản nhất của ML methodology.
            Khi dữ liệu ít, nên thay thế bằng{" "}
            <TopicLink slug="cross-validation">K-Fold Cross-Validation</TopicLink>{" "}
            để tận dụng tối đa dữ liệu mà vẫn đánh giá được{" "}
            <TopicLink slug="overfitting-underfitting">overfitting</TopicLink>.
          </p>
          <p><strong>3 tập và mục đích:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Train (60-80%):</strong>{" "}Model học patterns từ đây. Update weights</li>
            <li><strong>Validation (10-20%):</strong>{" "}Tune hyperparameters, chọn model, early stopping</li>
            <li><strong>Test (10-20%):</strong>{" "}Đánh giá cuối cùng. CHỈ DÙNG 1 LẦN. Không được dùng để quyết định bất kỳ gì</li>
          </ul>

          <LaTeX block>{"\\text{Generalization Error} = \\text{Test Error} \\approx \\mathbb{E}[\\mathcal{L}(f(x), y)] \\text{ trên data chưa thấy}"}</LaTeX>

          <Callout variant="warning" title="Data Leakage">
            Lỗi phổ biến: <TopicLink slug="data-preprocessing">feature engineering</TopicLink>{" "}TRƯỚC khi split → thông tin từ test 'rò rỉ' vào train (ví dụ: StandardScaler fit trên TOÀN BỘ data). ĐÚNG: split trước → fit scaler trên train → transform val/test bằng scaler của train.
          </Callout>

          <CodeBlock language="python" title="Chia dữ liệu đúng cách">
{`from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Bước 1: Split TRƯỚC mọi thứ khác
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.15, stratify=y, random_state=42
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.176, stratify=y_temp, random_state=42
    # 0.176 of 85% ≈ 15% of total
)

# Bước 2: Fit scaler CHỈ trên train
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)   # fit + transform
X_val = scaler.transform(X_val)           # chỉ transform (không fit!)
X_test = scaler.transform(X_test)         # chỉ transform

# Bước 3: Train + tune trên train/val
model.fit(X_train, y_train)
val_score = model.score(X_val, y_val)  # Dùng để tune

# Bước 4: Đánh giá cuối cùng trên test (CHỈ 1 LẦN)
test_score = model.score(X_test, y_test)
print(f"Final test accuracy: {test_score:.3f}")`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Train (học), Validation (kiểm tra giữa kỳ), Test (thi cuối kỳ — chỉ 1 lần).",
          "KHÔNG dùng test set để tune hay chọn model — sẽ mất tính khách quan.",
          "Stratified split giữ tỷ lệ classes đều ở mỗi tập — quan trọng cho data mất cân bằng.",
          "Data leakage: SPLIT TRƯỚC, fit scaler/encoder CHỈ trên train, transform val/test.",
          "Data ít? Dùng K-fold cross-validation — mỗi fold lần lượt làm validation.",
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
