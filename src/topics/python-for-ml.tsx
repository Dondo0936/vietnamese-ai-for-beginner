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
  TabView,
  TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "python-for-ml",
  title: "Python for Machine Learning",
  titleVi: "Python cho Machine Learning",
  description:
    "Cơ bản NumPy, Pandas, và Matplotlib — ba công cụ không thể thiếu khi làm ML.",
  category: "foundations",
  tags: ["python", "numpy", "pandas", "matplotlib", "tools"],
  difficulty: "beginner",
  relatedSlugs: [
    "data-preprocessing",
    "feature-engineering",
    "jupyter-colab-workflow",
  ],
  vizType: "interactive",
};

const TOTAL_STEPS = 8;

export default function PythonForMlTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question:
          "numpy.array([1, 2, 3]).shape trả về kết quả gì?",
        options: [
          "(1, 3) — ma trận 1 hàng 3 cột",
          "(3,) — tuple 1 chiều với 3 phần tử",
          "3 — số nguyên",
          "[3] — danh sách",
        ],
        correct: 1,
        explanation:
          "shape trả về tuple mô tả kích thước mảng. Mảng 1 chiều có 3 phần tử → (3,). Ma trận 2D thì mới có dạng (rows, cols). Dấu phẩy sau 3 là dấu hiệu của tuple 1 phần tử — không phải lỗi chính tả!",
      },
      {
        question:
          "Hoàn thành đoạn code: `df = pd.read_csv(___); df.___()` để đọc file và xem 5 dòng đầu.",
        options: [
          '"data.csv", "head"',
          '"data.csv", "show"',
          '"data.csv", "first"',
          '"data.csv", "print"',
        ],
        correct: 0,
        explanation:
          'pd.read_csv("data.csv") đọc file CSV thành DataFrame. df.head() hiển thị 5 dòng đầu (mặc định). df.head(10) hiển thị 10 dòng. Không có method .show() hay .first() trong Pandas.',
      },
      {
        question:
          "Điểm khác biệt quan trọng nhất giữa Python list và NumPy array là gì?",
        options: [
          "NumPy array có thể chứa nhiều kiểu dữ liệu, list thì không",
          "NumPy array thực hiện phép tính theo từng phần tử (vectorized), list phải dùng vòng lặp",
          "List nhanh hơn NumPy array cho mọi phép tính",
          "NumPy array chỉ dùng được cho số nguyên",
        ],
        correct: 1,
        explanation:
          "[1,2,3] * 2 trong Python list cho [1,2,3,1,2,3] (lặp lại). np.array([1,2,3]) * 2 cho [2,4,6] (nhân từng phần tử). NumPy tính toán bằng C bên dưới → nhanh hơn 100x so với Python loop. List lưu object references, array lưu giá trị số liên tiếp trong bộ nhớ.",
      },
      {
        question:
          'Pandas DataFrame giống "{blank}" trong Excel. Điền vào chỗ trống.',
        options: [
          "công thức (formula)",
          "bảng tính (worksheet/sheet)",
          "ô tính (cell)",
          "biểu đồ (chart)",
        ],
        correct: 1,
        explanation:
          "DataFrame là bảng dữ liệu 2 chiều với hàng và cột có tên — giống hệt một sheet trong Excel. Series tương đương một cột. read_csv() giống mở file Excel. groupby() giống PivotTable. Điểm khác biệt: DataFrame xử lý hàng triệu dòng mà Excel không thể.",
      },
      {
        question:
          "Thư viện nào dùng để vẽ biểu đồ trong Python?",
        options: [
          "NumPy — vì có hàm np.plot()",
          "Pandas — vì DataFrame có method .plot()",
          "Matplotlib — thư viện visualisation chuyên dụng, nền tảng của hầu hết các thư viện vẽ khác",
          "SciPy — vì xử lý số liệu khoa học",
        ],
        correct: 2,
        explanation:
          "Matplotlib là thư viện vẽ biểu đồ chính. Pandas .plot() thực ra gọi Matplotlib bên dưới. Seaborn cũng xây trên Matplotlib. NumPy không có chức năng vẽ. Bộ ba quyền lực: NumPy (tính toán) + Pandas (bảng dữ liệu) + Matplotlib (visualisation).",
      },
    ],
    []
  );

  return (
    <>
      {/* Bước 1 — Hook / Dự đoán */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn có bảng điểm 1000 học sinh với 10 cột. Muốn tính điểm trung bình từng môn, lọc học sinh giỏi (trung bình ≥ 8.0), rồi vẽ biểu đồ phân phối điểm. Công cụ nào phù hợp nhất?"
          options={[
            "Excel — quen thuộc, dễ dùng, đủ dùng cho 1000 dòng",
            "Python thuần (for loops) — tự viết hàm tính toán, linh hoạt tuyệt đối",
            "NumPy + Pandas + Matplotlib — bộ ba chuyên dụng cho dữ liệu",
          ]}
          correct={2}
          explanation="NumPy+Pandas+Matplotlib xử lý 1000 dòng trong mili-giây, scale lên 10 triệu dòng vẫn ổn. Excel bị giới hạn 1M dòng và khó tự động hoá. Python thuần chạy được nhưng chậm hơn 100x so với NumPy vì phải dùng vòng lặp. Ba thư viện này là bộ công cụ tiêu chuẩn của mọi Data Scientist và ML Engineer."
        >
          <p className="text-sm text-muted mt-2">
            Hãy tiếp tục để khám phá lý do tại sao bộ ba này lại mạnh đến vậy.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* Bước 2 — Giới thiệu ba thư viện qua TabView */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection>
          <TabView
            tabs={[
              {
                label: "NumPy",
                content: (
                  <div className="space-y-3">
                    <p className="text-sm text-muted">
                      <strong>NumPy</strong>{" "}
                      cung cấp mảng N chiều (ndarray) với phép tính vectorized — không cần vòng lặp, tốc độ ngang C.
                    </p>
                    <CodeBlock language="python" title="NumPy — array operations">
{`import numpy as np

# Tạo array
a = np.array([1, 2, 3, 4, 5])
b = np.array([10, 20, 30, 40, 50])

# Shape và kiểu dữ liệu
print(a.shape)   # (5,)
print(a.dtype)   # int64

# Phép tính vectorized — không cần for loop!
print(a + b)     # [11 22 33 44 55]
print(a * 2)     # [ 2  4  6  8 10]
print(a ** 2)    # [ 1  4  9 16 25]
print(np.sqrt(a))  # [1.  1.41 1.73 2.  2.24]

# Thống kê nhanh
print(np.mean(a))   # 3.0
print(np.std(a))    # 1.41
print(np.max(a))    # 5

# Ma trận 2D
M = np.array([[1, 2], [3, 4]])
print(M.shape)      # (2, 2)
print(M.T)          # transpose: [[1 3] [2 4]]
print(np.dot(M, M)) # nhân ma trận`}
                    </CodeBlock>
                    <Callout variant="tip" title="Vectorization = tốc độ">
                      NumPy tính toán bằng C bên dưới. Cộng 10 triệu số: NumPy mất 10ms, Python for-loop mất 1000ms. Đây là lý do tại sao mọi thư viện ML (TensorFlow, PyTorch, scikit-learn) đều xây trên NumPy.
                    </Callout>
                  </div>
                ),
              },
              {
                label: "Pandas",
                content: (
                  <div className="space-y-3">
                    <p className="text-sm text-muted">
                      <strong>Pandas</strong>{" "}
                      cung cấp DataFrame — bảng dữ liệu 2 chiều với tên cột và hàng, xây trên nền NumPy.
                    </p>
                    <CodeBlock language="python" title="Pandas — DataFrame operations">
{`import pandas as pd

# Tạo DataFrame
df = pd.DataFrame({
    "ten":     ["An", "Bình", "Chi", "Dung"],
    "toan":    [8.5, 7.0, 9.0, 6.5],
    "van":     [7.0, 8.5, 8.0, 9.0],
    "anh":     [9.0, 7.5, 8.5, 7.0],
})

# Khám phá dữ liệu
print(df.head())      # 5 dòng đầu
print(df.shape)       # (4, 4)
print(df.info())      # kiểu dữ liệu mỗi cột
print(df.describe())  # thống kê mô tả (mean, std, min, max...)

# Tạo cột mới — vectorized!
df["trung_binh"] = (df["toan"] + df["van"] + df["anh"]) / 3

# Lọc học sinh giỏi (trung bình ≥ 8.0)
gioi = df[df["trung_binh"] >= 8.0]
print(gioi[["ten", "trung_binh"]])

# Groupby — tính trung bình theo nhóm
# df.groupby("lop")["toan"].mean()

# Đọc CSV
# df = pd.read_csv("diem_hoc_sinh.csv")`}
                    </CodeBlock>
                  </div>
                ),
              },
              {
                label: "Matplotlib",
                content: (
                  <div className="space-y-3">
                    <p className="text-sm text-muted">
                      <strong>Matplotlib</strong>{" "}
                      là thư viện vẽ biểu đồ nền tảng của Python. Pandas .plot() và Seaborn đều dùng Matplotlib bên dưới.
                    </p>
                    <CodeBlock language="python" title="Matplotlib — biểu đồ cơ bản">
{`import matplotlib.pyplot as plt
import numpy as np

# --- Line plot: theo dõi loss khi training ---
epochs = np.arange(1, 11)
loss   = [0.9, 0.7, 0.55, 0.42, 0.33, 0.27, 0.22, 0.18, 0.15, 0.13]

plt.figure(figsize=(8, 4))
plt.plot(epochs, loss, marker="o", color="steelblue", label="Train Loss")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.title("Training Loss theo Epoch")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

# --- Histogram: phân phối điểm học sinh ---
diem = np.random.normal(loc=7.5, scale=1.2, size=1000)

plt.figure(figsize=(8, 4))
plt.hist(diem, bins=20, color="coral", edgecolor="white", alpha=0.8)
plt.xlabel("Điểm")
plt.ylabel("Số học sinh")
plt.title("Phân phối điểm — 1000 học sinh")
plt.axvline(diem.mean(), color="navy", linestyle="--", label=f"Trung bình: {diem.mean():.1f}")
plt.legend()
plt.show()`}
                    </CodeBlock>
                  </div>
                ),
              },
            ]}
          />
        </VisualizationSection>
      </LessonSection>

      {/* Bước 3 — So sánh Python loop vs NumPy */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Tốc độ">
        <ExplanationSection>
          <p>
            Cùng một bài toán — tính bình phương của 10 triệu số — Python loop và NumPy cho kết quả giống hệt nhau nhưng tốc độ chênh lệch gần 200 lần:
          </p>
          <CodeBlock language="python" title="Python loop vs NumPy — cùng kết quả, khác tốc độ">
{`import numpy as np
import time

N = 10_000_000  # 10 triệu phần tử

# --- Cách 1: Python for-loop ---
data_list = list(range(N))

start = time.time()
result_loop = [x ** 2 for x in data_list]  # List comprehension
elapsed_loop = time.time() - start
print(f"Python loop : {elapsed_loop:.2f}s")  # ~2.0s

# --- Cách 2: NumPy vectorized ---
data_array = np.arange(N)

start = time.time()
result_numpy = data_array ** 2  # Một dòng! Tính bằng C bên dưới
elapsed_numpy = time.time() - start
print(f"NumPy       : {elapsed_numpy:.3f}s")  # ~0.01s

print(f"NumPy nhanh hơn {elapsed_loop / elapsed_numpy:.0f}x!")`}
          </CodeBlock>
          <Callout variant="insight" title="Tại sao NumPy nhanh?">
            Python là ngôn ngữ thông dịch — mỗi phép tính trong vòng lặp đều phải qua Python interpreter (chậm). NumPy lưu dữ liệu dạng contiguous C array trong RAM và gọi hàm C/Fortran đã biên dịch sẵn — không có Python overhead. Đây là kỹ thuật gọi là <strong>vectorization</strong>.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* Bước 4 — InlineChallenge */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="np.array([1, 2, 3]) * 2 cho kết quả gì? (Gợi ý: so sánh với [1, 2, 3] * 2 trong Python list)"
          options={[
            "[1, 2, 3, 1, 2, 3] — lặp lại array 2 lần, giống Python list",
            "[2, 4, 6] — nhân từng phần tử với 2 (element-wise)",
            "[[2, 4, 6], [2, 4, 6]] — tạo ma trận 2 hàng",
            "Lỗi TypeError — không thể nhân array với số nguyên",
          ]}
          correct={1}
          explanation="NumPy * là phép nhân element-wise: mỗi phần tử nhân với 2 → [2, 4, 6]. Trong Python list, [1,2,3] * 2 = [1,2,3,1,2,3] (lặp lại). Đây là sự khác biệt quan trọng nhất! NumPy broadcasting còn mạnh hơn: np.array([[1,2],[3,4]]) * 2 nhân từng phần tử của ma trận."
        />
      </LessonSection>

      {/* Bước 5 — ExplanationSection */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            Ba thư viện NumPy, Pandas, Matplotlib tạo nên bộ công cụ cơ bản không thể thiếu trong mọi dự án ML. Mỗi thư viện giải quyết một tầng khác nhau của quy trình làm việc với dữ liệu.
          </p>

          <p>
            <strong>NumPy — Nền tảng tính toán số học:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>ndarray:</strong>{" "}
              mảng N chiều thuần nhất, lưu liên tiếp trong RAM
            </li>
            <li>
              <strong>Broadcasting:</strong>{" "}
              phép tính giữa array có shape khác nhau (a + 5 cộng 5 vào mọi phần tử)
            </li>
            <li>
              <strong>Vectorization:</strong>{" "}
              thay for-loop bằng phép tính trên toàn array — nhanh hơn 100–200x
            </li>
            <li>
              <strong>Indexing nâng cao:</strong>{" "}
              a[a &gt; 5] lấy tất cả phần tử lớn hơn 5 (boolean mask)
            </li>
          </ul>

          <p>
            <strong>Pandas — Bảng dữ liệu có cấu trúc:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Series:</strong>{" "}
              mảng 1 chiều có nhãn — một cột trong bảng
            </li>
            <li>
              <strong>DataFrame:</strong>{" "}
              bảng 2 chiều, hàng và cột đều có tên
            </li>
            <li>
              <strong>read_csv / read_excel:</strong>{" "}
              đọc dữ liệu từ file vào DataFrame chỉ 1 dòng code
            </li>
            <li>
              <strong>head / describe / info:</strong>{" "}
              ba lệnh đầu tiên luôn chạy khi nhận dataset mới
            </li>
            <li>
              <strong>groupby:</strong>{" "}
              tương đương PivotTable trong Excel — nhóm và tổng hợp
            </li>
          </ul>

          <p>
            <strong>Matplotlib — Visualisation:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>plt.plot:</strong>{" "}
              đường line — theo dõi loss, accuracy qua các epoch
            </li>
            <li>
              <strong>plt.scatter:</strong>{" "}
              điểm phân tán — xem quan hệ giữa 2 biến
            </li>
            <li>
              <strong>plt.hist:</strong>{" "}
              histogram — phân phối của một biến số
            </li>
            <li>
              <strong>plt.show:</strong>{" "}
              hiển thị biểu đồ (cuối cùng luôn gọi cái này)
            </li>
          </ul>

          <CodeBlock language="python" title="Mini pipeline: load CSV → khám phá → vẽ biểu đồ">
{`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# 1. Load dữ liệu
df = pd.read_csv("diem_hoc_sinh.csv")

# 2. Khám phá cơ bản — 3 lệnh đầu tiên với dataset mới
print(df.head())        # xem vài dòng đầu
print(df.info())        # kiểu dữ liệu, missing values
print(df.describe())    # mean, std, min, max, quartiles

# 3. Làm sạch sơ bộ
df = df.dropna()        # xoá hàng có missing values
df["trung_binh"] = df[["toan", "van", "anh"]].mean(axis=1)

# 4. Lọc học sinh giỏi
gioi = df[df["trung_binh"] >= 8.0]
print(f"Số học sinh giỏi: {len(gioi)}/{len(df)}")

# 5. Visualisation
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

axes[0].hist(df["trung_binh"], bins=15, color="steelblue", edgecolor="white")
axes[0].set_title("Phân phối điểm trung bình")
axes[0].set_xlabel("Điểm")
axes[0].set_ylabel("Số học sinh")

axes[1].scatter(df["toan"], df["van"], alpha=0.5, color="coral")
axes[1].set_title("Điểm Toán vs Văn")
axes[1].set_xlabel("Điểm Toán")
axes[1].set_ylabel("Điểm Văn")

plt.tight_layout()
plt.show()`}
          </CodeBlock>

          <Callout variant="tip" title="Xem tiếp">
            Sau khi nắm ba thư viện này, bước tiếp theo là{" "}
            <TopicLink slug="data-preprocessing">Tiền xử lý dữ liệu</TopicLink>
            {" "}(xử lý missing values, encoding, scaling) và{" "}
            <TopicLink slug="feature-engineering">Kỹ thuật đặc trưng</TopicLink>
            {" "}(tạo features có ý nghĩa cho model).
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* Bước 6 — AhaMoment */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>NumPy</strong>{" "}nhanh hơn Python loop 100x vì tính toán bằng C bên dưới.{" "}
            <strong>Pandas</strong>{" "}xây trên NumPy — mọi cột trong DataFrame là một NumPy array.{" "}
            <strong>Matplotlib</strong>{" "}vẽ kết quả. Ba thứ này tạo thành{" "}
            <strong>bộ ba quyền lực của ML</strong>
            {" "}— không có chúng, hầu hết các thư viện ML hiện đại (scikit-learn, TensorFlow, PyTorch) đều không tồn tại!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* Bước 7 — MiniSummary */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          points={[
            "NumPy: ndarray + vectorization = tính toán số học nhanh 100x so với Python loop.",
            "Pandas: DataFrame = bảng dữ liệu 2 chiều. Ba lệnh đầu tiên: head(), info(), describe().",
            "Matplotlib: plt.plot / scatter / hist + plt.show() = biểu đồ cơ bản đủ dùng.",
            "Pandas xây trên NumPy. Mọi cột DataFrame là NumPy array — hiểu NumPy là hiểu nền tảng.",
            "Mini pipeline: read_csv → head/describe → dropna → tính toán → visualise.",
          ]}
        />
      </LessonSection>

      {/* Bước 8 — QuizSection */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
