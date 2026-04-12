"use client";

import { Briefcase } from "lucide-react";
import LearningPathPage from "@/components/paths/LearningPathPage";
import LearningObjectivesModal from "@/components/paths/LearningObjectivesModal";
import type { Stage } from "@/components/paths/LearningPathPage";
import type { PathObjectives } from "@/components/paths/LearningObjectivesModal";

const pathObjectives: PathObjectives = {
  audience:
    "Nhân viên văn phòng, quản lý, và bất kỳ ai muốn sử dụng AI hiệu quả trong công việc hàng ngày. Không cần biết lập trình hay kiến thức kỹ thuật.",
  prerequisites:
    "Biết sử dụng máy tính và trình duyệt web. Có email và tài khoản công việc. Không cần kiến thức toán hay lập trình.",
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
  ],
  estimatedTime: [
    { stage: "Bắt đầu với AI", hours: 6 },
    { stage: "Ứng dụng thực tế", hours: 8 },
    { stage: "An toàn & Đạo đức", hours: 4 },
    { stage: "Ứng dụng ngành", hours: 6 },
  ],
  nextPath: { slug: "ai-engineer", label: "AI Engineer" },
};

const stages: Stage[] = [
  {
    title: "Bắt đầu với AI",
    slugs: [
      "getting-started-with-ai",
      "llm-overview",
      "prompt-engineering",
      "chain-of-thought",
      "in-context-learning",
      "temperature",
      "hallucination",
      "context-window",
    ],
  },
  {
    title: "Ứng dụng thực tế",
    slugs: [
      "rag",
      "semantic-search",
      "ai-coding-assistants",
      "agentic-workflows",
      "ai-for-writing",
      "ai-for-data-analysis",
      "ai-privacy-security",
      "ai-tool-evaluation",
    ],
  },
  {
    title: "An toàn & Đạo đức",
    slugs: ["bias-fairness", "ai-governance", "guardrails", "explainability"],
  },
  {
    title: "Ứng dụng ngành",
    slugs: [
      "ai-in-finance",
      "ai-in-healthcare",
      "ai-in-education",
      "ai-in-agriculture",
      "recommendation-systems",
      "sentiment-analysis",
      "text-classification",
    ],
  },
];

export default function OfficePathPage() {
  return (
    <LearningPathPage
      pathId="office"
      nameVi="Nhân viên văn phòng"
      descriptionVi="Hiểu AI để ứng dụng trong công việc — prompt, ứng dụng thực tế, an toàn AI"
      icon={Briefcase}
      stages={stages}
      headerExtra={<LearningObjectivesModal objectives={pathObjectives} />}
    />
  );
}
