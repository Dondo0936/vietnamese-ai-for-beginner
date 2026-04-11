"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "alignment",
  title: "AI Alignment",
  titleVi: "Căn chỉnh AI — Dạy AI hiểu con người",
  description:
    "Quá trình đảm bảo mô hình AI hành động đúng theo ý định, giá trị và mong muốn của con người.",
  category: "ai-safety",
  tags: ["alignment", "rlhf", "values", "safety"],
  difficulty: "intermediate",
  relatedSlugs: ["constitutional-ai", "guardrails", "red-teaming"],
  vizType: "static",
};

export default function AlignmentTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn thuê một <strong>robot quản gia</strong> siêu thông minh.
          Bạn bảo: &quot;Giữ nhà sạch sẽ!&quot; — robot ném hết đồ đạc ra ngoài vì nhà
          sẽ sạch nhất khi không có gì. Kết quả đúng theo <em>chữ</em> nhưng sai theo
          <em> ý</em> của bạn.
        </p>
        <p>
          <strong>Alignment</strong> (Căn chỉnh) là quá trình dạy AI không chỉ làm theo
          <em> lệnh cụ thể</em> mà còn hiểu <strong>ý định sâu xa</strong> và
          <strong> giá trị</strong> của con người — giống như dạy quản gia hiểu &quot;sạch sẽ&quot;
          nghĩa là gọn gàng chứ không phải vứt hết đồ.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            {/* Three stages */}
            {[
              { label: "Huấn luyện trước", desc: "Học từ dữ liệu internet", y: 30, color: "#3b82f6" },
              { label: "SFT — Tinh chỉnh có giám sát", desc: "Học từ ví dụ do con người viết", y: 110, color: "#f59e0b" },
              { label: "RLHF — Học từ phản hồi người", desc: "Tối ưu theo sở thích con người", y: 190, color: "#22c55e" },
            ].map((stage, i) => (
              <g key={i}>
                <rect x={100} y={stage.y} width={400} height={55} rx={10} fill="#1e293b" stroke={stage.color} strokeWidth={2} />
                <text x={300} y={stage.y + 25} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                  {stage.label}
                </text>
                <text x={300} y={stage.y + 43} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                  {stage.desc}
                </text>
                {i < 2 && (
                  <line x1={300} y1={stage.y + 55} x2={300} y2={stage.y + 80} stroke="#475569" strokeWidth={2} markerEnd="url(#align-arrow)" />
                )}
              </g>
            ))}

            {/* Result */}
            <text x={300} y={268} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              Từ &quot;biết nhiều&quot; → &quot;biết trả lời tốt&quot; → &quot;biết trả lời đúng ý người&quot;
            </text>
            <defs>
              <marker id="align-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#475569" />
              </marker>
            </defs>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>AI Alignment</strong> (Căn chỉnh AI) là lĩnh vực nghiên cứu đảm bảo mô hình AI
          hoạt động phù hợp với ý định, giá trị và mong muốn của con người.
        </p>
        <p>Quy trình căn chỉnh phổ biến nhất hiện nay gồm 3 giai đoạn:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Pre-training:</strong> Mô hình học kiến thức từ kho dữ liệu khổng lồ.
            Biết nhiều nhưng chưa biết cách trả lời phù hợp.
          </li>
          <li>
            <strong>SFT (Supervised Fine-Tuning):</strong> Tinh chỉnh với các ví dụ hỏi-đáp
            chất lượng cao do con người viết. Học cách trả lời đúng định dạng.
          </li>
          <li>
            <strong>RLHF (Reinforcement Learning from Human Feedback):</strong> Tối ưu hoá
            dựa trên đánh giá của con người — phản hồi nào tốt hơn, an toàn hơn.
          </li>
        </ol>
        <p>
          Các thách thức lớn gồm <strong>specification gaming</strong> (AI tìm lỗ hổng),
          <strong> reward hacking</strong> (tối ưu chỉ số sai), và
          <strong> scalable oversight</strong> (giám sát khi AI vượt trội con người).
        </p>
      </ExplanationSection>
    </>
  );
}
