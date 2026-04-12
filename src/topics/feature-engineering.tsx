"use client";

import { useMemo } from "react";
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
  slug: "feature-engineering",
  title: "Feature Engineering",
  titleVi: "Kỹ thuật đặc trưng — Nghệ thuật chọn nguyên liệu",
  description:
    "Quá trình tạo, chọn lọc và biến đổi các đặc trưng đầu vào để mô hình máy học dễ học và dự đoán chính xác hơn.",
  category: "foundations",
  tags: ["features", "engineering", "transformation", "selection"],
  difficulty: "beginner",
  relatedSlugs: ["data-preprocessing", "dimensionality-curse", "train-val-test"],
  vizType: "interactive",
};

const TOTAL_STEPS = 7;

export default function FeatureEngineeringTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao feature engineering quan trọng hơn chọn algorithm?",
      options: [
        "Không đúng — algorithm quan trọng hơn",
        "Features tốt giúp MODEL ĐƠN GIẢN cũng dự đoán tốt. Features tệ thì model phức tạp cũng không cứu được",
        "Feature engineering nhanh hơn training",
      ],
      correct: 1,
      explanation: "'Garbage features in, garbage predictions out.' Linear regression với features tốt thường thắng deep learning với features tệ. Andrew Ng: '80% thời gian ML là feature engineering.' Features là NGUYÊN LIỆU — nguyên liệu tươi thì món ăn ngon, dù bếp giỏi nào.",
    },
    {
      question: "Dự đoán giá nhà tại Hà Nội. Feature 'số nhà' (ví dụ: 42) có hữu ích không?",
      options: [
        "Có — số nhà ảnh hưởng giá",
        "KHÔNG — số nhà là ID, không có quan hệ với giá. Thêm feature noise → model overfit",
        "Tuỳ thuộc model",
      ],
      correct: 1,
      explanation: "Số nhà là identifier, không phải feature có ý nghĩa. Nhà số 42 không đắt hơn nhà số 41. Thêm features vô nghĩa → model học noise → overfit. Features tốt: diện tích, số phòng, khoảng cách Metro, quận/huyện. Chọn features = loại bỏ nhiễu!",
    },
    {
      question: "Feature 'ngày sinh' của user có giúp dự đoán sở thích âm nhạc không? Nên xử lý thế nào?",
      options: [
        "Dùng trực tiếp ngày sinh làm feature",
        "Tạo features mới: tuổi (2025 - năm_sinh), thế_hệ (Gen Z/Millennial/Gen X), tháng_sinh (zodiac effect)",
        "Bỏ đi vì ngày sinh không liên quan",
      ],
      correct: 1,
      explanation: "Ngày sinh raw không hữu ích (30/05/1995 ≠ pattern). Nhưng FEATURES ĐƯỢC TẠO TỪ ngày sinh rất hữu ích: tuổi (30) → Gen Z, thế_hệ → correlated với sở thích nhạc. Đây là core của feature engineering: biến đổi raw data thành features có ý nghĩa!",
    },
    {
      type: "fill-blank",
      question: "Interaction feature kết hợp hai features để tạo thông tin mới. Ví dụ: diện_tích × số_tầng tạo ra feature '{blank}' thể hiện tổng diện tích sử dụng của ngôi nhà.",
      blanks: [{ answer: "tổng_diện_tích_sàn", accept: ["tổng diện tích sàn", "total_floor_area", "diện tích sàn", "floor_area"] }],
      explanation: "Interaction features (đặc trưng tương tác) kết hợp hai hoặc nhiều features thô để tạo ra đặc trưng mới có ý nghĩa mà model khó tự học. diện_tích × số_tầng = tổng_diện_tích_sàn, một chỉ số phản ánh tốt hơn quy mô thực tế của bất động sản.",
    },
  ], []);

  return (
    <>
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn dự đoán giá nhà ở Hà Nội. Data có: diện tích, số phòng, năm xây, địa chỉ text ('42 Lý Thường Kiệt, Hoàn Kiếm'). Model accuracy chỉ 60%. Thiếu gì?"
          options={[
            "Cần model phức tạp hơn (deep learning)",
            "Cần feature engineering: từ địa chỉ text → extract quận/huyện, khoảng cách trung tâm, gần Metro? → accuracy tăng 85%+",
            "Cần nhiều data hơn",
          ]}
          correct={1}
          explanation="Địa chỉ text '42 Lý Thường Kiệt' model không hiểu. Feature engineering: extract 'Hoàn Kiếm' (quận), tính khoảng cách Hồ Gươm (2km), gần Metro (500m), mặt phố (có). Features này CÓ Ý NGHĨA → model hiểu 'nhà ở trung tâm, gần Metro = đắt'. Accuracy tăng 25%+!"
        >

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <svg viewBox="0 0 600 160" className="w-full max-w-2xl mx-auto">
              <text x={300} y={16} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold">
                Raw Data → Feature Engineering → Model Input
              </text>
              {/* Raw data */}
              <rect x={20} y={30} width={160} height={90} rx={8} fill="#1e293b" stroke="#ef4444" strokeWidth={1.5} />
              <text x={100} y={50} textAnchor="middle" fill="#ef4444" fontSize={9} fontWeight="bold">Raw Data</text>
              <text x={100} y={68} textAnchor="middle" fill="#94a3b8" fontSize={7}>ngày_sinh: 30/05/1995</text>
              <text x={100} y={82} textAnchor="middle" fill="#94a3b8" fontSize={7}>địa_chỉ: 42 Lý Thường Kiệt</text>
              <text x={100} y={96} textAnchor="middle" fill="#94a3b8" fontSize={7}>giá: 5.2 tỷ VND</text>

              <text x={235} y={75} fill="#f59e0b" fontSize={20}>→</text>

              {/* Engineered features */}
              <rect x={260} y={30} width={160} height={90} rx={8} fill="#1e293b" stroke="#22c55e" strokeWidth={1.5} />
              <text x={340} y={50} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight="bold">Engineered</text>
              <text x={340} y={68} textAnchor="middle" fill="#94a3b8" fontSize={7}>tuổi: 30, thế_hệ: GenZ</text>
              <text x={340} y={82} textAnchor="middle" fill="#94a3b8" fontSize={7}>quận: Hoàn Kiếm, gần_metro: 1</text>
              <text x={340} y={96} textAnchor="middle" fill="#94a3b8" fontSize={7}>log_giá: 22.37</text>

              <text x={475} y={75} fill="#f59e0b" fontSize={20}>→</text>

              <rect x={500} y={50} width={80} height={40} rx={8} fill="#3b82f6" />
              <text x={540} y={75} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Model</text>

              <text x={300} y={145} textAnchor="middle" fill="#64748b" fontSize={9}>
                Features tốt = model đơn giản cũng chính xác. Features tệ = model phức tạp cũng tệ.
              </text>
            </svg>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Feature Engineering giống <strong>chọn nguyên liệu nấu ăn</strong>.
            Nguyên liệu tươi, chất lượng → món ăn ngon dù bếp bình thường.
            Nguyên liệu tệ → món ăn tệ dù bếp giỏi. <strong>80% thời gian ML là feature engineering</strong>{" "}
            — không phải training model! Features tốt cũng giúp tránh <TopicLink slug="overfitting-underfitting">overfitting</TopicLink> bằng cách loại bỏ noise.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Dự đoán khách hàng Shopee có mua hàng trong 7 ngày tới không. Feature nào HỮU ÍCH NHẤT?"
          options={[
            "User ID (mã khách hàng)",
            "số_ngày_từ_lần_mua_cuối, tần_suất_mua_30_ngày, giá_trung_bình_đơn, số_sản_phẩm_trong_giỏ",
            "màu_avatar (màu hình đại diện)",
          ]}
          correct={1}
          explanation="User ID là identifier (không có pattern). Màu avatar không liên quan. Nhưng: số_ngày_từ_lần_mua_cuối (recency), tần_suất_mua (frequency), giá_trung_bình (monetary) = RFM features — kinh điển trong e-commerce. số_sản_phẩm_trong_giỏ = intent signal mạnh!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Feature Engineering</strong>{" "}
            là quá trình biến đổi raw data thành features có ý nghĩa giúp model học hiệu quả hơn.
            Thường được thực hiện sau bước <TopicLink slug="data-preprocessing">tiền xử lý dữ liệu</TopicLink> và trước khi đưa vào model.
            Features tốt giúp cân bằng <TopicLink slug="bias-variance">bias-variance tradeoff</TopicLink> — không quá đơn giản (high bias) cũng không quá phức tạp (high variance).
          </p>
          <p><strong>5 kỹ thuật chính:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Tạo feature mới:</strong>{" "}ngày_sinh → tuổi, thế_hệ. địa_chỉ → quận, khoảng_cách</li>
            <li><strong>Encoding:</strong>{" "}Categorical → one-hot, target encoding. Text → TF-IDF, embeddings</li>
            <li><strong>Scaling:</strong>{" "}StandardScaler (mean=0, std=1), MinMaxScaler (0-1)</li>
            <li><strong>Feature selection:</strong>{" "}Loại features vô nghĩa, giảm chiều, giảm overfitting</li>
            <li><strong>Interaction features:</strong>{" "}diện_tích x số_tầng = tổng_diện_tích_sàn</li>
          </ul>

          <LaTeX block>{"\\text{StandardScaler: } x' = \\frac{x - \\mu}{\\sigma} \\quad \\text{MinMax: } x' = \\frac{x - x_{\\min}}{x_{\\max} - x_{\\min}}"}</LaTeX>

          <Callout variant="tip" title="Target Encoding">
            Categorical feature có nhiều giá trị (1000 quận/huyện) → one-hot tạo 1000 cột (quá nhiều!). Target encoding: thay mỗi category bằng mean(target) của category đó. Ví dụ: Hoàn Kiếm → mean(giá) = 8.5 tỷ. Giảm chiều + giữ thông tin!
            Kỹ thuật này đặc biệt hữu ích khi kết hợp với <TopicLink slug="linear-regression">hồi quy tuyến tính</TopicLink> — một trong những model được hưởng lợi nhiều nhất từ feature engineering tốt.
          </Callout>

          <CodeBlock language="python" title="Feature Engineering cho dự đoán giá nhà">
{`import pandas as pd
from sklearn.preprocessing import StandardScaler

# Raw data
df = pd.DataFrame({
    "dia_chi": ["42 Ly Thuong Kiet, Hoan Kiem", ...],
    "dien_tich": [65, 120, 45, ...],
    "nam_xay": [2015, 2020, 2008, ...],
})

# Feature Engineering
df["quan"] = df["dia_chi"].apply(extract_district)  # Text → category
df["tuoi_nha"] = 2025 - df["nam_xay"]  # Derived feature
df["gan_metro"] = df["dia_chi"].apply(check_near_metro)  # Binary
df["khoang_cach_tt"] = df["dia_chi"].apply(calc_distance_center)  # km
df["gia_per_m2"] = df["gia"] / df["dien_tich"]  # Interaction

# Scaling
scaler = StandardScaler()
numeric_cols = ["dien_tich", "tuoi_nha", "khoang_cach_tt"]
df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

# Feature selection: loại features tương quan cao
# cor_matrix = df.corr()
# Drop features có correlation > 0.95

# Accuracy: 60% (raw) → 85% (engineered features)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Feature engineering biến đổi raw data thành features có ý nghĩa — 80% thời gian ML.",
          "5 kỹ thuật: tạo feature mới, encoding, scaling, selection, interaction features.",
          "Features tốt + model đơn giản > Features tệ + model phức tạp. 'Nguyên liệu quyết định món ăn.'",
          "Loại features vô nghĩa (ID, noise) giảm overfitting. Thêm features có ý nghĩa tăng accuracy.",
          "Xu hướng: deep learning tự học features (end-to-end), nhưng tabular data vẫn cần manual engineering.",
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
