"use client";

import { GraduationCap } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import LearningObjectivesModal from "@/components/paths/LearningObjectivesModal";
import type { Stage } from "@/components/paths/LearningPathPage";
import type { PathObjectives } from "@/components/paths/LearningObjectivesModal";

const pathObjectives: PathObjectives = {
  audience:
    "Học sinh THPT, sinh viên năm nhất, hoặc bất kỳ ai muốn bắt đầu học AI/ML từ con số 0. Không yêu cầu kinh nghiệm lập trình hay toán cao cấp.",
  prerequisites:
    "Toán phổ thông cơ bản (đại số, hàm số). Biết dùng máy tính và trình duyệt web. Không cần biết lập trình — sẽ học trong lộ trình.",
  stageObjectives: [
    {
      stage: "Giới thiệu",
      objectives: [
        "Hiểu Machine Learning là gì và khác gì lập trình truyền thống",
        "Biết ML giải quyết những bài toán nào trong thực tế",
      ],
    },
    {
      stage: "Nền tảng toán",
      objectives: [
        "Nắm đại số tuyến tính cơ bản: vector, ma trận, phép nhân",
        "Hiểu xác suất và thống kê cần thiết cho ML",
        "Biết đạo hàm và ý nghĩa trong tối ưu hoá",
      ],
    },
    {
      stage: "ML cơ bản",
      objectives: [
        "Phân biệt supervised, unsupervised, và reinforcement learning",
        "Xây dựng mô hình hồi quy và phân loại đầu tiên",
        "Hiểu bias-variance tradeoff và overfitting",
        "Đánh giá mô hình bằng confusion matrix và cross-validation",
      ],
    },
    {
      stage: "Mạng nơ-ron",
      objectives: [
        "Hiểu kiến trúc mạng nơ-ron từ perceptron đến MLP",
        "Nắm forward propagation và backpropagation",
        "Biết gradient descent và cách chọn hàm mất mát",
      ],
    },
    {
      stage: "Kỹ năng thực hành",
      objectives: [
        "Sử dụng Python, NumPy, Pandas cho ML",
        "Tiền xử lý dữ liệu và trích xuất đặc trưng",
        "Chọn mô hình phù hợp cho bài toán cụ thể",
        "Hoàn thành một dự án ML end-to-end",
      ],
    },
  ],
  outcomes: [
    "Hiểu nền tảng toán và lý thuyết cần thiết cho Machine Learning",
    "Xây dựng và đánh giá được mô hình ML cơ bản",
    "Biết dùng Python và các thư viện ML phổ biến",
    "Hoàn thành dự án ML từ dữ liệu thô đến kết quả",
    "Sẵn sàng chuyển sang lộ trình AI Engineer",
  ],
  estimatedTime: [
    { stage: "Giới thiệu", hours: 1 },
    { stage: "Nền tảng toán", hours: 8 },
    { stage: "ML cơ bản", hours: 20 },
    { stage: "Mạng nơ-ron", hours: 15 },
    { stage: "Kỹ năng thực hành", hours: 16 },
  ],
  nextPath: { slug: "ai-engineer", label: "AI Engineer" },
};

const stages: Stage[] = [
  {
    title: "Giới thiệu",
    slugs: ["what-is-ml"],
  },
  {
    title: "Nền tảng toán",
    slugs: [
      "linear-algebra-for-ml",
      "probability-statistics",
      "calculus-for-backprop",
    ],
  },
  {
    title: "ML cơ bản",
    slugs: [
      "supervised-unsupervised-rl",
      "linear-regression",
      "logistic-regression",
      "information-theory",
      "decision-trees",
      "knn",
      "naive-bayes",
      "k-means",
      "confusion-matrix",
      "bias-variance",
      "overfitting-underfitting",
      "cross-validation",
      "train-val-test",
    ],
  },
  {
    title: "Mạng nơ-ron",
    slugs: [
      "neural-network-overview",
      "perceptron",
      "mlp",
      "activation-functions",
      "forward-propagation",
      "backpropagation",
      "gradient-descent",
      "loss-functions",
      "epochs-batches",
    ],
  },
  {
    title: "Kỹ năng thực hành",
    slugs: [
      "data-preprocessing",
      "feature-engineering",
      "python-for-ml",
      "model-evaluation-selection",
      "jupyter-colab-workflow",
      "end-to-end-ml-project",
    ],
  },
];

export default function StudentPathPage() {
  return (
    <LearningPathPage
      pathId="student"
      nameVi="Học sinh · Sinh viên"
      descriptionVi="Nền tảng AI/ML từ con số 0 — toán, thuật toán cổ điển, mạng nơ-ron cơ bản"
      icon={GraduationCap}
      stages={stages}
      headerExtra={<LearningObjectivesModal objectives={pathObjectives} />}
    />
  );
}
