"use client";

import { Briefcase } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import LearningObjectivesModal from "@/components/paths/LearningObjectivesModal";
import type { PathObjectives } from "@/components/paths/LearningObjectivesModal";
import { getPathStages } from "@/lib/paths";

const pathObjectives: PathObjectives = {
  audience:
    "Nhân viên văn phòng, quản lý, giáo viên, marketer, luật sư, nhà báo — bất kỳ ai không lập trình mà muốn biến AI thành trợ lý làm việc hàng ngày. Không cần kiến thức kỹ thuật.",
  prerequisites:
    "Biết sử dụng máy tính và trình duyệt web. Có email và tài khoản công việc. Không cần kiến thức toán hay lập trình. Nếu sau này muốn chuyển sang xây dựng hệ thống AI, bạn sẽ cần học thêm Python, toán nền tảng và ML cơ bản theo lộ trình Học sinh · Sinh viên — lộ trình Office không dẫn thẳng sang AI Engineer.",
  stageObjectives: [
    {
      stage: "Bắt đầu với AI",
      objectives: [
        "Bắt đầu sử dụng AI tool trong 5 phút đầu tiên",
        "Hiểu LLM hoạt động thế nào ở mức tổng quan",
        "Viết prompt hiệu quả để nhận kết quả chất lượng",
        "Biết giới hạn và rủi ro của AI (hallucination, context window)",
      ],
    },
    {
      stage: "Ứng dụng thực tế",
      objectives: [
        "Dùng AI để viết email, báo cáo, bài thuyết trình",
        "Phân tích dữ liệu spreadsheet và tạo biểu đồ với AI",
        "Hiểu RAG và cách AI tìm kiếm thông tin",
        "So sánh và chọn đúng AI tool cho nhu cầu công việc",
      ],
    },
    {
      stage: "An toàn & Đạo đức",
      objectives: [
        "Biết những gì KHÔNG NÊN đưa vào AI tool",
        "Hiểu bias trong AI và cách phát hiện",
        "Nắm quy định AI governance trong doanh nghiệp",
      ],
    },
    {
      stage: "Ứng dụng ngành",
      objectives: [
        "Hiểu AI đang thay đổi ngành tài chính, y tế, giáo dục, nông nghiệp",
        "Biết cách ứng dụng recommendation systems và sentiment analysis",
        "Xác định cơ hội AI phù hợp cho lĩnh vực của mình",
      ],
    },
  ],
  outcomes: [
    "Sử dụng AI tool tự tin trong công việc hàng ngày",
    "Viết prompt hiệu quả cho nhiều loại tác vụ",
    "Biết bảo vệ dữ liệu cá nhân và công ty khi dùng AI",
    "Đánh giá và chọn đúng AI tool cho nhu cầu cụ thể",
    "Hiểu AI đang thay đổi ngành nghề của mình",
    "Nếu muốn bước tiếp sang xây dựng AI, biết chính xác khoảng cách kỹ năng mình cần lấp (Python + toán + ML cơ bản qua lộ trình Học sinh · Sinh viên)",
  ],
  estimatedTime: [
    { stage: "Bắt đầu với AI", hours: 6 },
    { stage: "Ứng dụng thực tế", hours: 8 },
    { stage: "An toàn & Đạo đức", hours: 4 },
    { stage: "Ứng dụng ngành", hours: 6 },
  ],
  nextPath: { slug: "student", label: "Học sinh · Sinh viên (để bắt đầu xây dựng AI)" },
};

export default function OfficePathPage() {
  return (
    <LearningPathPage
      pathId="office"
      nameVi="Nhân viên văn phòng"
      descriptionVi="Hiểu AI để ứng dụng trong công việc — prompt, ứng dụng thực tế, an toàn AI"
      icon={Briefcase}
      stages={getPathStages("office")}
      headerExtra={<LearningObjectivesModal objectives={pathObjectives} />}
      extras={{
        eyebrowVi: "Lộ trình cho người không code",
        editor: {
          name: "Dondo",
          role: "Biên tập chính · udemi.tech",
          initials: "DD",
        },
        faq: [
          {
            q: "Tôi không biết code. Học được không?",
            a: "Được. Lộ trình này không yêu cầu viết code, chỉ có prompt mẫu, ví dụ trong trình duyệt, và ẩn dụ đời thường.",
          },
          {
            q: "Mất bao lâu để hoàn thành?",
            a: "Trung bình 5–6 tuần nếu học 30 phút/ngày. Nếu học dồn cuối tuần, khoảng 8 tuần.",
          },
          {
            q: "AI có thay thế công việc của tôi không?",
            a: "Lộ trình không hứa hẹn. Nó giúp bạn hiểu AI làm được gì, không làm được gì, và dùng nó như công cụ hỗ trợ, không phải thay thế.",
          },
          {
            q: "Chứng chỉ có dùng được trên LinkedIn/CV không?",
            a: "Được. Hoàn thành 100% là mở khoá nút 'Nhận chứng chỉ'. Chứng chỉ ký số bằng Ed25519, có URL xác thực công khai và nút 'Add to LinkedIn' tự điền vào hồ sơ. Không thay thế chứng chỉ AWS/Google, nhưng cho thấy bạn nghiêm túc với chủ đề.",
          },
        ],
      }}
    />
  );
}
