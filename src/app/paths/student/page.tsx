"use client";

import { GraduationCap } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import LearningObjectivesModal from "@/components/paths/LearningObjectivesModal";
import type { PathObjectives } from "@/components/paths/LearningObjectivesModal";
import { getPathStages } from "@/lib/paths";

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

export default function StudentPathPage() {
  return (
    <LearningPathPage
      pathId="student"
      nameVi="Học sinh · Sinh viên"
      descriptionVi="Nền tảng AI/ML từ con số 0 — toán, thuật toán cổ điển, mạng nơ-ron cơ bản"
      icon={GraduationCap}
      stages={getPathStages("student")}
      headerExtra={<LearningObjectivesModal objectives={pathObjectives} />}
      extras={{
        eyebrowVi: "Lộ trình cho người bắt đầu từ số 0",
        editor: {
          name: "Dondo",
          role: "Biên tập chính · udemi.tech",
          initials: "DD",
        },
        faq: [
          {
            q: "Tôi chưa biết lập trình. Học được không?",
            a: "Được. Lộ trình này có dạy Python cơ bản ở chương 'Kỹ năng thực hành'. Trước đó, bạn chỉ cần làm quen với khái niệm. Không viết code nào trong 3 chương đầu.",
          },
          {
            q: "Mất bao lâu để hoàn thành?",
            a: "Ước tính ~60 giờ tổng. Nếu học 30 phút/ngày, bạn hoàn thành sau ~4 tháng. Nếu dồn cuối tuần 2 giờ/tuần, khoảng 7 tháng.",
          },
          {
            q: "Sau khi xong lộ trình này, tôi nên học gì?",
            a: "Lộ trình AI Engineer là bước tiếp theo tự nhiên. Nó giả định bạn đã nắm toán và ML cơ bản từ đây.",
          },
          {
            q: "Có thể học offline không?",
            a: "Mỗi bài có thể đọc được khi mạng chậm vì nội dung text-first. Tiến độ đồng bộ ẩn danh trên trình duyệt bạn đang dùng.",
          },
        ],
      }}
    />
  );
}
