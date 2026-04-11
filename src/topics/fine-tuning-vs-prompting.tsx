"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "fine-tuning-vs-prompting",
  title: "Fine-tuning vs Prompting",
  titleVi: "So sánh Fine-tuning và Prompting",
  description:
    "Phân tích khi nào nên tinh chỉnh mô hình và khi nào chỉ cần kỹ thuật prompt là đủ.",
  category: "llm-concepts",
  tags: ["fine-tuning", "prompting", "comparison", "strategy"],
  difficulty: "intermediate",
  relatedSlugs: ["prompt-engineering", "fine-tuning", "lora"],
  vizType: "static",
};

export default function FineTuningVsPromptingTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn cần một <strong>phiên dịch viên</strong>:
        </p>
        <p>
          <strong>Prompting</strong> giống như thuê phiên dịch giỏi và đưa cho họ
          một <strong>bản hướng dẫn chi tiết</strong> trước cuộc họp: &quot;Dùng
          giọng trang trọng, dịch thuật ngữ y khoa, luôn gọi bác sĩ bằng
          &apos;Giáo sư&apos;&quot;. Nhanh, rẻ, linh hoạt.
        </p>
        <p>
          <strong>Fine-tuning</strong> giống như gửi phiên dịch đi{" "}
          <strong>học chuyên ngành y khoa 6 tháng</strong>. Tốn thời gian và tiền
          bạc, nhưng sau đó họ tự biết dùng thuật ngữ đúng mà không cần nhắc!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 700 420" className="w-full max-w-3xl mx-auto">
            <text x="350" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              Prompting vs Fine-tuning
            </text>

            {/* Prompting side */}
            <rect x="20" y="45" width="310" height="355" rx="12" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="175" y="72" textAnchor="middle" fill="#3b82f6" fontSize="13" fontWeight="bold">
              Prompting
            </text>

            {[
              { label: "Chi phí", value: "Thấp (API call)", icon: "$", color: "#22c55e" },
              { label: "Thời gian", value: "Vài phút", icon: "T", color: "#22c55e" },
              { label: "Dữ liệu", value: "Không cần", icon: "D", color: "#22c55e" },
              { label: "Linh hoạt", value: "Rất cao", icon: "L", color: "#22c55e" },
              { label: "Chuyên biệt", value: "Trung bình", icon: "C", color: "#f59e0b" },
              { label: "Bảo mật", value: "Dữ liệu gửi API", icon: "B", color: "#ef4444" },
            ].map((item, i) => (
              <g key={i}>
                <circle cx="50" cy={100 + i * 48} r="12" fill={item.color} opacity={0.2} />
                <text x="50" y={104 + i * 48} textAnchor="middle" fill={item.color} fontSize="9" fontWeight="bold">
                  {item.icon}
                </text>
                <text x="72" y={98 + i * 48} fill="#e2e8f0" fontSize="10" fontWeight="bold">
                  {item.label}
                </text>
                <text x="72" y={112 + i * 48} fill="#94a3b8" fontSize="9">
                  {item.value}
                </text>
              </g>
            ))}

            {/* VS */}
            <circle cx="350" cy="222" r="22" fill="#475569" />
            <text x="350" y="227" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              VS
            </text>

            {/* Fine-tuning side */}
            <rect x="370" y="45" width="310" height="355" rx="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="525" y="72" textAnchor="middle" fill="#f59e0b" fontSize="13" fontWeight="bold">
              Fine-tuning
            </text>

            {[
              { label: "Chi phí", value: "Cao (GPU + dữ liệu)", icon: "$", color: "#ef4444" },
              { label: "Thời gian", value: "Vài giờ - vài ngày", icon: "T", color: "#ef4444" },
              { label: "Dữ liệu", value: "Cần 100-10K+ mẫu", icon: "D", color: "#f59e0b" },
              { label: "Linh hoạt", value: "Thấp (cố định)", icon: "L", color: "#ef4444" },
              { label: "Chuyên biệt", value: "Rất cao", icon: "C", color: "#22c55e" },
              { label: "Bảo mật", value: "Dữ liệu nội bộ", icon: "B", color: "#22c55e" },
            ].map((item, i) => (
              <g key={i}>
                <circle cx="400" cy={100 + i * 48} r="12" fill={item.color} opacity={0.2} />
                <text x="400" y={104 + i * 48} textAnchor="middle" fill={item.color} fontSize="9" fontWeight="bold">
                  {item.icon}
                </text>
                <text x="422" y={98 + i * 48} fill="#e2e8f0" fontSize="10" fontWeight="bold">
                  {item.label}
                </text>
                <text x="422" y={112 + i * 48} fill="#94a3b8" fontSize="9">
                  {item.value}
                </text>
              </g>
            ))}
          </svg>

          {/* Decision guide */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-background/50 border border-blue-500/30 p-3">
              <p className="text-sm font-semibold text-blue-400">Dùng Prompting khi:</p>
              <ul className="text-xs text-muted space-y-1 mt-1 list-disc list-inside">
                <li>Bài toán đa dạng, thay đổi thường xuyên</li>
                <li>Không có dữ liệu huấn luyện</li>
                <li>Cần kết quả nhanh, ngân sách thấp</li>
                <li>Thử nghiệm ý tưởng mới</li>
              </ul>
            </div>
            <div className="rounded-lg bg-background/50 border border-yellow-500/30 p-3">
              <p className="text-sm font-semibold text-yellow-400">Dùng Fine-tuning khi:</p>
              <ul className="text-xs text-muted space-y-1 mt-1 list-disc list-inside">
                <li>Cần chuyên biệt hóa cao cho một lĩnh vực</li>
                <li>Có dữ liệu chất lượng và nhất quán</li>
                <li>Yêu cầu bảo mật dữ liệu nội bộ</li>
                <li>Giảm chi phí API dài hạn</li>
              </ul>
            </div>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          Khi xây dựng ứng dụng AI, một quyết định quan trọng là chọn giữa{" "}
          <strong>Prompting</strong> (kỹ thuật viết prompt) và{" "}
          <strong>Fine-tuning</strong> (tinh chỉnh mô hình).
        </p>
        <p>So sánh chi tiết:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Prompting:</strong> Không thay đổi trọng số mô hình. Chỉ điều chỉnh
            cách đặt câu hỏi, cung cấp ví dụ, và hướng dẫn trong ngữ cảnh.
          </li>
          <li>
            <strong>Fine-tuning:</strong> Cập nhật trọng số mô hình trên tập dữ liệu
            chuyên biệt. Mô hình &quot;ghi nhớ&quot; kiến thức và phong cách mới.
          </li>
        </ol>
        <p>
          Chiến lược tối ưu thường là: <strong>bắt đầu bằng prompting</strong>, đo lường
          hiệu suất, và chỉ fine-tune khi prompting không đạt yêu cầu. Nhiều bài toán
          thực tế có thể giải quyết tốt chỉ bằng prompt engineering kết hợp RAG.
        </p>
      </ExplanationSection>
    </>
  );
}
