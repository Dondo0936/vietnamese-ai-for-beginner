"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "constitutional-ai",
  title: "Constitutional AI",
  titleVi: "AI Hiến pháp — Tự kiểm duyệt theo nguyên tắc",
  description:
    "Phương pháp huấn luyện AI tự đánh giá và sửa đổi phản hồi dựa trên một bộ nguyên tắc đạo đức rõ ràng.",
  category: "ai-safety",
  tags: ["constitutional-ai", "self-critique", "principles", "anthropic"],
  difficulty: "advanced",
  relatedSlugs: ["alignment", "guardrails", "red-teaming"],
  vizType: "static",
};

export default function ConstitutionalAITopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng một quốc gia có <strong>hiến pháp</strong> — bộ luật tối cao mà mọi
          quyết định phải tuân theo. Khi quan toà xử án, họ không chỉ dùng trực giác mà
          <strong> đối chiếu với hiến pháp</strong> để đảm bảo phán quyết công bằng.
        </p>
        <p>
          <strong>Constitutional AI</strong> trang bị cho mô hình một &quot;bộ hiến pháp&quot;
          — danh sách nguyên tắc đạo đức. Mỗi khi tạo phản hồi, AI tự hỏi:
          &quot;Câu trả lời này có vi phạm nguyên tắc nào không?&quot; và tự sửa nếu cần.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
            {/* Step 1 */}
            <rect x={20} y={20} width={560} height={55} rx={10} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />
            <text x={300} y={42} textAnchor="middle" fill="#3b82f6" fontSize={11} fontWeight="bold">
              Bước 1: Tạo phản hồi ban đầu
            </text>
            <text x={300} y={60} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              AI tạo câu trả lời chưa qua kiểm duyệt
            </text>

            <line x1={300} y1={75} x2={300} y2={100} stroke="#475569" strokeWidth={2} />

            {/* Step 2 */}
            <rect x={20} y={100} width={560} height={55} rx={10} fill="#1e293b" stroke="#f59e0b" strokeWidth={2} />
            <text x={300} y={122} textAnchor="middle" fill="#f59e0b" fontSize={11} fontWeight="bold">
              Bước 2: Tự phê bình theo nguyên tắc
            </text>
            <text x={300} y={140} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              AI đối chiếu với bộ nguyên tắc: &quot;Có hại không? Có thiên kiến không? Có đúng không?&quot;
            </text>

            <line x1={300} y1={155} x2={300} y2={180} stroke="#475569" strokeWidth={2} />

            {/* Step 3 */}
            <rect x={20} y={180} width={560} height={55} rx={10} fill="#1e293b" stroke="#22c55e" strokeWidth={2} />
            <text x={300} y={202} textAnchor="middle" fill="#22c55e" fontSize={11} fontWeight="bold">
              Bước 3: Sửa đổi và cải thiện
            </text>
            <text x={300} y={220} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              AI viết lại phản hồi phù hợp hơn với các nguyên tắc đạo đức
            </text>

            {/* Principles sidebar */}
            <rect x={420} y={265} width={160} height={45} rx={6} fill="#8b5cf6" opacity={0.8} />
            <text x={500} y={283} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">Bộ nguyên tắc</text>
            <text x={500} y={300} textAnchor="middle" fill="#e2e8f0" fontSize={8}>An toàn, Trung thực, Hữu ích</text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Constitutional AI (CAI)</strong> là phương pháp do Anthropic phát triển,
          giúp mô hình AI tự kiểm duyệt phản hồi dựa trên một bộ nguyên tắc đạo đức
          (&quot;hiến pháp&quot;) được định nghĩa trước.
        </p>
        <p>Quy trình CAI gồm hai giai đoạn:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Phê bình & sửa đổi (Critique & Revision):</strong> AI tạo phản hồi,
            tự phê bình theo nguyên tắc, rồi viết lại phiên bản cải thiện. Quá trình này
            tạo ra dữ liệu huấn luyện chất lượng.
          </li>
          <li>
            <strong>Học tăng cường từ phản hồi AI (RLAIF):</strong> Thay vì dùng con người
            đánh giá (RLHF), CAI sử dụng chính AI để đánh giá phản hồi nào tốt hơn theo
            bộ nguyên tắc.
          </li>
        </ol>
        <p>
          Ưu điểm lớn nhất: <strong>giảm phụ thuộc vào nhân công</strong> đánh giá,
          đồng thời <strong>minh bạch hơn</strong> vì các nguyên tắc được ghi rõ.
          Đây là nền tảng cho cách Anthropic huấn luyện Claude.
        </p>
      </ExplanationSection>
    </>
  );
}
