"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "unified-multimodal",
  title: "Unified Multimodal Models",
  titleVi: "Mô hình đa phương thức thống nhất",
  description:
    "Mô hình AI duy nhất có thể hiểu và sinh ra nhiều loại dữ liệu: văn bản, ảnh, âm thanh, video trong cùng một kiến trúc.",
  category: "multimodal",
  tags: ["unified", "multimodal", "any-to-any"],
  difficulty: "advanced",
  relatedSlugs: ["vlm", "clip", "text-to-image", "tts"],
  vizType: "static",
};

export default function UnifiedMultimodalTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng sự khác biệt giữa một <strong>đội ngũ phiên dịch</strong>
          (mỗi người dịch một ngôn ngữ) và một <strong>phiên dịch viên đa ngôn ngữ</strong>
          thông thạo tất cả các ngôn ngữ.
        </p>
        <p>
          Mô hình đa phương thức trước đây giống đội phiên dịch — cần nhiều module riêng biệt
          cho ảnh, văn bản, âm thanh. Mô hình thống nhất giống phiên dịch viên đa ngôn ngữ —
          <strong> một bộ não duy nhất</strong> hiểu và tạo ra tất cả các loại dữ liệu,
          chuyển đổi tự nhiên giữa chúng.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
            {/* Central unified model */}
            <circle cx={300} cy={150} r={55} fill="#1e293b" stroke="#3b82f6" strokeWidth={3} />
            <text x={300} y={143} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">Mô hình</text>
            <text x={300} y={160} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">Thống nhất</text>

            {/* Modalities around */}
            {[
              { label: "Văn bản", color: "#3b82f6", angle: -90 },
              { label: "Hình ảnh", color: "#22c55e", angle: -30 },
              { label: "Âm thanh", color: "#f59e0b", angle: 30 },
              { label: "Video", color: "#ef4444", angle: 90 },
              { label: "Mã nguồn", color: "#8b5cf6", angle: 150 },
              { label: "3D", color: "#06b6d4", angle: 210 },
            ].map((m, i) => {
              const rad = (m.angle * Math.PI) / 180;
              const x = 300 + 130 * Math.cos(rad);
              const y = 150 + 130 * Math.sin(rad);
              return (
                <g key={i}>
                  <line x1={300} y1={150} x2={x} y2={y} stroke={m.color} strokeWidth={2} opacity={0.5} />
                  <circle cx={x} cy={y} r={28} fill={m.color} opacity={0.85} />
                  <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Mô hình đa phương thức thống nhất</strong> là thế hệ AI mới có khả năng
          xử lý và sinh ra nhiều loại dữ liệu (văn bản, ảnh, âm thanh, video) trong
          <strong> một kiến trúc duy nhất</strong>, thay vì ghép nối nhiều mô hình chuyên biệt.
        </p>
        <p>Ưu điểm so với mô hình đa phương thức ghép nối:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Hiểu sâu hơn:</strong> Mối liên hệ giữa các loại dữ liệu được học trực tiếp, không qua trung gian.</li>
          <li><strong>Chuyển đổi linh hoạt:</strong> Có thể chuyển bất kỳ loại đầu vào nào sang bất kỳ loại đầu ra nào (any-to-any).</li>
          <li><strong>Hiệu quả hơn:</strong> Chia sẻ tham số giữa các phương thức giúp giảm kích thước mô hình.</li>
        </ol>
        <p>
          Các mô hình tiêu biểu: <strong>Gemini</strong> (Google), <strong>GPT-4o</strong> (OpenAI),
          và <strong>Chameleon</strong> (Meta). Xu hướng này hướng tới AI thông minh tổng quát (AGI)
          có thể tương tác với thế giới qua nhiều giác quan như con người.
        </p>
      </ExplanationSection>
    </>
  );
}
