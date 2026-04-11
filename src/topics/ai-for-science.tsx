"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-for-science",
  title: "AI for Science",
  titleVi: "AI cho Khoa học — Phòng thí nghiệm ảo",
  description:
    "Ứng dụng AI để đẩy nhanh khám phá khoa học, từ dự đoán cấu trúc protein đến thiết kế vật liệu mới.",
  category: "emerging",
  tags: ["science", "protein", "drug-discovery", "materials"],
  difficulty: "advanced",
  relatedSlugs: ["world-models", "reasoning-models", "synthetic-data"],
  vizType: "static",
};

export default function AIForScienceTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng để tìm ra <strong>một loại thuốc mới</strong>, các nhà khoa học
          phải thử nghiệm <strong>hàng triệu hợp chất hoá học</strong> — mỗi thử nghiệm
          tốn hàng tháng và hàng triệu đô-la.
        </p>
        <p>
          AI giống như có một <strong>&quot;phòng thí nghiệm ảo&quot;</strong> khổng lồ —
          có thể <strong>mô phỏng hàng triệu thí nghiệm trong vài giờ</strong>, loại bỏ
          ứng cử viên kém, chỉ để lại những hợp chất hứa hẹn nhất cho thử nghiệm thật.
          AlphaFold đã làm được điều tưởng chừng không thể: dự đoán cấu trúc protein
          chỉ trong vài phút thay vì vài năm.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <svg viewBox="0 0 600 280" className="w-full max-w-2xl mx-auto">
            <text x={300} y={20} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
              Lĩnh vực AI cho Khoa học
            </text>
            {[
              { label: "Sinh học & Y dược", items: ["Dự đoán cấu trúc protein", "Thiết kế thuốc mới", "Phân tích gene"], color: "#22c55e", x: 150 },
              { label: "Vật lý & Vật liệu", items: ["Mô phỏng phân tử", "Thiết kế vật liệu", "Dự báo thời tiết"], color: "#3b82f6", x: 450 },
              { label: "Hoá học", items: ["Tổng hợp hoá chất", "Phản ứng hoá học", "Xúc tác mới"], color: "#f59e0b", x: 150 },
              { label: "Toán & Thiên văn", items: ["Chứng minh toán học", "Phát hiện thiên thể", "Mô phỏng vũ trụ"], color: "#8b5cf6", x: 450 },
            ].map((field, i) => {
              const y = 40 + Math.floor(i / 2) * 120;
              return (
                <g key={i}>
                  <rect x={field.x - 120} y={y} width={240} height={95} rx={10} fill="#1e293b" stroke={field.color} strokeWidth={2} />
                  <text x={field.x} y={y + 22} textAnchor="middle" fill={field.color} fontSize={11} fontWeight="bold">
                    {field.label}
                  </text>
                  {field.items.map((item, j) => (
                    <text key={j} x={field.x} y={y + 42 + j * 18} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                      {item}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>AI for Science</strong> (AI cho Khoa học) là lĩnh vực ứng dụng AI
          để đẩy nhanh quá trình khám phá và nghiên cứu khoa học, từ sinh học phân tử
          đến vật lý thiên văn.
        </p>
        <p>Các đột phá tiêu biểu:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>AlphaFold (DeepMind):</strong> Dự đoán cấu trúc 3D của hầu hết protein đã biết — bài toán 50 năm được giải trong vài giờ.</li>
          <li><strong>Thiết kế thuốc:</strong> AI sàng lọc hàng triệu phân tử ứng cử viên, rút ngắn thời gian phát triển thuốc từ 10 năm xuống vài năm.</li>
          <li><strong>Dự báo thời tiết:</strong> Mô hình AI (GraphCast, Pangu-Weather) dự báo chính xác hơn mô hình vật lý truyền thống.</li>
          <li><strong>Vật liệu mới:</strong> AI khám phá vật liệu có tính chất mong muốn mà không cần tổng hợp thử nghiệm hàng nghìn mẫu.</li>
        </ol>
        <p>
          AI for Science được dự đoán sẽ tạo ra <strong>cuộc cách mạng khoa học</strong> mới,
          nơi AI không thay thế nhà khoa học mà trở thành <strong>trợ lý nghiên cứu</strong>
          cực kỳ mạnh mẽ.
        </p>
      </ExplanationSection>
    </>
  );
}
