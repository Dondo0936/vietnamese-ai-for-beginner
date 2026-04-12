"use client";

import { useMemo } from "react";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  TopicLink,
  BuildUp,
  StepReveal,
  Reorderable,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "end-to-end-ml-project",
  title: "End-to-End ML Project",
  titleVi: "Dự án ML từ A đến Z",
  description:
    "Capstone — hoàn thành dự án ML hoàn chỉnh: thu thập dữ liệu → tiền xử lý → huấn luyện → đánh giá → diễn giải kết quả.",
  category: "foundations",
  tags: ["project", "pipeline", "end-to-end", "capstone"],
  difficulty: "beginner",
  relatedSlugs: [
    "data-preprocessing",
    "feature-engineering",
    "model-evaluation-selection",
    "python-for-ml",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

export default function EndToEndMlProjectTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "Bước đầu tiên trong bất kỳ dự án ML nào là gì?",
        options: [
          "Huấn luyện mô hình ngay với dữ liệu có sẵn",
          "Tìm thuật toán phức tạp nhất phù hợp với bài toán",
          "Khám phá và phân tích dữ liệu (EDA) để hiểu dữ liệu trước khi xây mô hình",
          "Triển khai hạ tầng cloud để xử lý dữ liệu lớn",
        ],
        correct: 2,
        explanation:
          "EDA (Exploratory Data Analysis) là bước đầu tiên bắt buộc. Không hiểu dữ liệu → chọn sai tiền xử lý, sai thuật toán, sai cách đánh giá. 'Nhìn dữ liệu trước khi cho máy học' — câu thần chú của mọi ML engineer giỏi.",
      },
      {
        question:
          "Trước khi train model, phải chia dữ liệu thành _______ và _______.",
        options: [
          "validation và production",
          "train và test",
          "input và output",
          "numeric và categorical",
        ],
        correct: 1,
        explanation:
          "Phải chia train/test trước khi làm bất cứ điều gì với dữ liệu. Train set để học, test set để đánh giá khách quan. Nếu dùng test set trong quá trình phát triển → data leakage → kết quả ảo.",
      },
      {
        question:
          "Tại sao KHÔNG nên train và đánh giá mô hình trên cùng một tập dữ liệu?",
        options: [
          "Vì máy tính tốn nhiều tài nguyên hơn khi dùng cùng tập",
          "Vì mô hình sẽ 'thuộc lòng' dữ liệu train — cho điểm cao giả tạo nhưng dự đoán kém trên dữ liệu mới (overfitting)",
          "Vì sklearn không hỗ trợ cách này",
          "Vì quy trình ML yêu cầu tập riêng biệt theo convention",
        ],
        correct: 1,
        explanation:
          "Mô hình học từ train set → nó 'nhớ' các pattern, kể cả noise. Đánh giá trên cùng train set → điểm ảo cao. Đánh giá trên test set (chưa thấy bao giờ) → phản ánh khả năng thực sự trên dữ liệu mới ngoài thực tế.",
      },
      {
        question:
          "Hoàn thành dòng code sau:\nX_train, X_test, y_train, y_test = ___(___, ___, test_size=0.2)",
        options: [
          "split_data(X, y, test_size=0.2)",
          "train_test_split(X, y, test_size=0.2)",
          "divide_dataset(X, y, test_size=0.2)",
          "random_split(X, y, test_size=0.2)",
        ],
        correct: 1,
        explanation:
          "train_test_split là hàm của sklearn.model_selection. test_size=0.2 nghĩa là 20% dữ liệu dùng để test, 80% để train. Luôn đặt random_state để kết quả reproducible: train_test_split(X, y, test_size=0.2, random_state=42).",
      },
      {
        question:
          "Bạn xây mô hình dự đoán giá nhà TP.HCM. LinearRegression cho MAE = 500 triệu, R² = 0.72. Bước tiếp theo hợp lý nhất là gì?",
        options: [
          "Triển khai ngay vì R² = 0.72 là đủ tốt",
          "Thay ngay bằng deep learning vì model hiện tại quá đơn giản",
          "Thử feature engineering (thêm giá/m², khoảng cách trung tâm) và so sánh kết quả trước khi quyết định",
          "Thu thập thêm 1 triệu điểm dữ liệu rồi mới thử tiếp",
        ],
        correct: 2,
        explanation:
          "Feature engineering thường cải thiện nhiều hơn thay đổi thuật toán. Thêm 'giá/m²', 'khoảng cách trung tâm', 'gần Metro' → model đơn giản cũng có thể đạt R² > 0.85. Chỉ sau khi đã tối ưu features mà vẫn chưa đủ tốt mới nghĩ đến model phức tạp hơn.",
      },
    ],
    []
  );

  return (
    <>
      {/* BƯỚC 1 — HOOK / DỰ ĐOÁN */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn có dữ liệu 5.000 căn nhà TP.HCM với các thông tin: diện tích, quận, số phòng ngủ, giá bán. Bước đầu tiên bạn sẽ làm gì?"
          options={[
            "Train model ngay — dữ liệu đã đủ để bắt đầu",
            "Khám phá dữ liệu trước (EDA) — kiểm tra phân phối, missing values, outliers",
            "Tìm thuật toán tốt nhất rồi mới nhìn vào dữ liệu",
          ]}
          correct={1}
          explanation="EDA (Exploratory Data Analysis) luôn là bước đầu tiên! Dữ liệu 5.000 căn nhà chắc chắn có missing values, outliers (nhập sai giá), và phân phối lệch. Train ngay mà không khám phá → 'garbage in, garbage out'. EDA giúp bạn hiểu dữ liệu trước khi quyết định cách xử lý."
        >
        {/* BƯỚC 2 — PIPELINE ML QUA BUILDUP */}
        <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Pipeline ML">
          <VisualizationSection>
            <p className="text-sm text-muted mb-4">
              Một dự án ML hoàn chỉnh có 5 giai đoạn — nhấn{" "}
              <strong>Thêm</strong> để khám phá từng bước.
            </p>
            <BuildUp
              labels={[
                "Giai đoạn 1",
                "Giai đoạn 2",
                "Giai đoạn 3",
                "Giai đoạn 4",
                "Giai đoạn 5",
              ]}
              addLabel="Bước tiếp theo"
            >
              <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3">
                <p className="text-sm font-semibold text-blue-400">
                  📊 Thu thập &amp; Khám phá dữ liệu (EDA)
                </p>
                <p className="mt-1 text-xs text-muted">
                  Đọc dữ liệu, kiểm tra thống kê mô tả, phát hiện missing values và outliers.
                </p>
              </div>
              <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3">
                <p className="text-sm font-semibold text-yellow-400">
                  🧹 Tiền xử lý (Cleaning &amp; Encoding)
                </p>
                <p className="mt-1 text-xs text-muted">
                  Xử lý missing values, encode categorical (quận → số), scale features.
                </p>
              </div>
              <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-3">
                <p className="text-sm font-semibold text-purple-400">
                  🤖 Huấn luyện mô hình
                </p>
                <p className="mt-1 text-xs text-muted">
                  Chia train/test, thử LinearRegression và DecisionTreeRegressor.
                </p>
              </div>
              <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3">
                <p className="text-sm font-semibold text-green-400">
                  📈 Đánh giá kết quả
                </p>
                <p className="mt-1 text-xs text-muted">
                  Tính MAE, R² — so sánh các mô hình để chọn mô hình tốt nhất.
                </p>
              </div>
              <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-3">
                <p className="text-sm font-semibold text-orange-400">
                  🚀 Cải thiện &amp; Triển khai
                </p>
                <p className="mt-1 text-xs text-muted">
                  Feature engineering, hyperparameter tuning, rồi đưa vào production.
                </p>
              </div>
            </BuildUp>
          </VisualizationSection>
        </LessonSection>

        {/* BƯỚC 3 — CODE TỪNG GIAI ĐOẠN QUA STEPREVEAL */}
        <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Code thực tế">
          <StepReveal
            labels={[
              "Giai đoạn 1: EDA",
              "Giai đoạn 2: Tiền xử lý",
              "Giai đoạn 3: Huấn luyện",
              "Giai đoạn 4: Đánh giá",
              "Giai đoạn 5: Cải thiện",
            ]}
          >
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Bắt đầu bằng cách đọc dữ liệu và khám phá tổng quan.
              </p>
              <CodeBlock language="python" title="Giai đoạn 1 — Thu thập & Khám phá (EDA)">
                {`import pandas as pd
import matplotlib.pyplot as plt

# Đọc dữ liệu
df = pd.read_csv("houses_hcmc.csv")

# Thống kê mô tả
print(df.describe())
print(df.info())

# Kiểm tra missing values
print(df.isnull().sum())

# Phân phối biến mục tiêu
df["gia"].hist(bins=50)
plt.title("Phân phối giá nhà TP.HCM")
plt.xlabel("Giá (tỷ VND)")
plt.show()`}
              </CodeBlock>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Làm sạch dữ liệu và chuyển đổi các biến phân loại.
              </p>
              <CodeBlock language="python" title="Giai đoạn 2 — Tiền xử lý">
                {`from sklearn.preprocessing import StandardScaler, LabelEncoder

# Xử lý missing values
df["dien_tich"].fillna(df["dien_tich"].median(), inplace=True)
df["so_phong"].fillna(df["so_phong"].mode()[0], inplace=True)

# Encode categorical: quận → số nguyên
le = LabelEncoder()
df["quan_encoded"] = le.fit_transform(df["quan"])

# Scale features số
scaler = StandardScaler()
features = ["dien_tich", "so_phong", "quan_encoded"]
X = df[features]
y = df["gia"]

X_scaled = scaler.fit_transform(X)`}
              </CodeBlock>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Chia dữ liệu và thử nghiệm hai mô hình khác nhau.
              </p>
              <CodeBlock language="python" title="Giai đoạn 3 — Huấn luyện mô hình">
                {`from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor

# Chia train/test (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

# Thử hai mô hình
lr = LinearRegression()
lr.fit(X_train, y_train)

dt = DecisionTreeRegressor(max_depth=5, random_state=42)
dt.fit(X_train, y_train)`}
              </CodeBlock>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted">
                So sánh hai mô hình bằng MAE và R² trên tập test.
              </p>
              <CodeBlock language="python" title="Giai đoạn 4 — Đánh giá kết quả">
                {`from sklearn.metrics import mean_absolute_error, r2_score

for name, model in [("Linear Regression", lr), ("Decision Tree", dt)]:
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print(f"{name}:")
    print(f"  MAE = {mae:.2f} tỷ VND")
    print(f"  R²  = {r2:.3f}")
    print()

# Kết quả ví dụ:
# Linear Regression: MAE = 0.52 tỷ, R² = 0.71
# Decision Tree:     MAE = 0.48 tỷ, R² = 0.74`}
              </CodeBlock>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Thêm feature mới và đánh giá lại — thường cải thiện nhiều hơn đổi thuật toán.
              </p>
              <CodeBlock language="python" title="Giai đoạn 5 — Feature Engineering & Cải thiện">
                {`# Thêm feature: giá/m² (interaction feature)
df["gia_per_m2"] = df["gia"] / df["dien_tich"]

# Thêm feature: khoảng cách trung tâm (nếu có tọa độ)
# df["dist_center"] = haversine(df["lat"], df["lon"], center_lat, center_lon)

# Cập nhật features và retrain
features_v2 = ["dien_tich", "so_phong", "quan_encoded", "gia_per_m2"]
X_v2 = df[features_v2]
X_v2_scaled = scaler.fit_transform(X_v2)

X_train2, X_test2, y_train2, y_test2 = train_test_split(
    X_v2_scaled, y, test_size=0.2, random_state=42
)

lr_v2 = LinearRegression().fit(X_train2, y_train2)
y_pred2 = lr_v2.predict(X_test2)
print(f"Linear Regression v2: R² = {r2_score(y_test2, y_pred2):.3f}")
# Linear Regression v2: R² = 0.83  ← cải thiện nhờ feature mới!`}
              </CodeBlock>
            </div>
          </StepReveal>
        </LessonSection>

        {/* BƯỚC 4 — SẮP XẾP THỨ TỰ PIPELINE */}
        <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thách thức">
          <p className="text-sm text-muted mb-3">
            Kéo thả để sắp xếp các bước của pipeline ML theo đúng thứ tự.
          </p>
          <Reorderable
            items={[
              "Tiền xử lý dữ liệu",
              "Khám phá dữ liệu (EDA)",
              "Đánh giá kết quả",
              "Huấn luyện mô hình",
              "Thu thập dữ liệu",
            ]}
            correctOrder={[4, 1, 0, 3, 2]}
            instruction="Sắp xếp đúng thứ tự: từ bước đầu tiên đến bước cuối cùng trong một dự án ML."
          />
        </LessonSection>

        {/* BƯỚC 5 — GIẢI THÍCH SÂU */}
        <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
          <ExplanationSection>
            <p>
              <strong>Dự án ML từ A đến Z</strong>{" "}
              là quy trình có hệ thống từ raw data đến mô hình hoạt động được — mỗi bước
              đều ảnh hưởng trực tiếp đến chất lượng kết quả cuối cùng.
            </p>

            <p>
              <strong>Ba sai lầm phổ biến nhất của người mới:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                <strong>Bỏ qua EDA:</strong>{" "}
                Train ngay mà không kiểm tra dữ liệu → không phát hiện missing values, outliers, hay
                phân phối lệch — model sẽ học noise thay vì pattern thực.
              </li>
              <li>
                <strong>Không chia train/test:</strong>{" "}
                Đánh giá trên cùng dữ liệu đã train → điểm số ảo cao, nhưng khi gặp dữ liệu mới
                thì dự đoán kém.
              </li>
              <li>
                <strong>Train trên tập test:</strong>{" "}
                Fit scaler/imputer trên toàn bộ data (bao gồm test) → data leakage → kết quả
                không phản ánh thực tế.
              </li>
            </ul>

            <Callout variant="tip" title="Nguyên tắc vàng — EDA trước">
              Luôn dành ít nhất 30 phút khám phá dữ liệu trước khi viết bất kỳ dòng code
              train nào. &ldquo;Nhìn dữ liệu trước khi cho máy học&rdquo; — câu thần chú của
              mọi ML engineer giàu kinh nghiệm.
            </Callout>

            <p>
              <strong>Feature engineering thường cải thiện model nhiều hơn đổi thuật toán.</strong>{" "}
              Trong ví dụ giá nhà TP.HCM, thêm feature &ldquo;giá/m²&rdquo; đẩy R² từ 0.71 lên
              0.83 — trong khi đổi từ Linear sang Decision Tree chỉ cải thiện từ 0.71 lên 0.74.
              Hãy tối ưu features trước khi nghĩ đến model phức tạp hơn.
            </p>

            <p>
              <strong>Tài nguyên liên quan:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                <TopicLink slug="data-preprocessing">Tiền xử lý dữ liệu</TopicLink>
                {" "}— missing values, scaling, encoding chi tiết
              </li>
              <li>
                <TopicLink slug="feature-engineering">Feature Engineering</TopicLink>
                {" "}— kỹ thuật tạo và chọn lọc đặc trưng
              </li>
              <li>
                <TopicLink slug="model-evaluation-selection">Đánh giá &amp; Chọn mô hình</TopicLink>
                {" "}— MAE, R², cross-validation, model selection
              </li>
              <li>
                <TopicLink slug="cross-validation">Cross-Validation</TopicLink>
                {" "}— đánh giá robust hơn train/test split đơn giản
              </li>
              <li>
                <TopicLink slug="python-for-ml">Python cho ML</TopicLink>
                {" "}— pandas, sklearn, matplotlib nền tảng
              </li>
            </ul>
          </ExplanationSection>
        </LessonSection>

        {/* BƯỚC 6 — THÁCH THỨC NHỎ */}
        <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiểm tra nhanh">
          <InlineChallenge
            question="Sau khi train mô hình dự đoán giá nhà TP.HCM, bạn tính R² = 0.98 trên tập train nhưng chỉ 0.52 trên tập test. Vấn đề là gì và cần làm gì?"
            options={[
              "R² = 0.98 là tốt — cứ dùng tập train để đánh giá là được",
              "Mô hình bị overfitting — học thuộc lòng train set thay vì pattern thực. Cần regularization, thêm data, hoặc giảm độ phức tạp mô hình",
              "Tập test quá nhỏ — tăng test_size lên 0.5 là xong",
              "Đây là kết quả bình thường trong ML — không cần lo",
            ]}
            correct={1}
            explanation="R² = 0.98 trên train nhưng 0.52 trên test là dấu hiệu overfitting kinh điển. Model 'thuộc lòng' train data (kể cả noise) thay vì học pattern tổng quát. Giải pháp: thêm regularization (Ridge/Lasso), giảm max_depth (Decision Tree), thu thập thêm data, hoặc cross-validation để phát hiện sớm."
          />
        </LessonSection>

        {/* BƯỚC 7 — AHA + TÓM TẮT */}
        <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
          <AhaMoment>
            <strong>80% thời gian ML thực tế là xử lý dữ liệu</strong>,{" "}
            chỉ 20% là huấn luyện model. Dữ liệu tốt với model đơn giản thường{" "}
            <strong>thắng</strong> dữ liệu tệ với model phức tạp.{" "}
            Đừng đuổi theo thuật toán fancy — hãy đầu tư thời gian vào hiểu và làm sạch dữ liệu!
          </AhaMoment>
          <MiniSummary
            points={[
              "Pipeline ML hoàn chỉnh: Thu thập → EDA → Tiền xử lý → Huấn luyện → Đánh giá → Cải thiện.",
              "EDA luôn là bước đầu tiên — không bao giờ train ngay mà không khám phá dữ liệu.",
              "Chia train/test trước mọi thao tác — tránh data leakage và đánh giá ảo.",
              "Feature engineering cải thiện model nhiều hơn đổi thuật toán — tối ưu features trước.",
              "80% thời gian là xử lý dữ liệu — đây là công việc thực tế của ML engineer.",
            ]}
          />
        </LessonSection>

        {/* BƯỚC 8 — QUIZ */}
        <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
          <QuizSection questions={quizQuestions} />
        </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
