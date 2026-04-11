"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "test-time-compute",
  title: "Test-Time Compute",
  titleVi: "Tính toán lúc suy luận — Nghĩ thêm khi cần",
  description:
    "Chiến lược sử dụng nhiều tài nguyên tính toán hơn tại thời điểm suy luận để cải thiện chất lượng câu trả lời.",
  category: "emerging",
  tags: ["test-time", "compute", "scaling", "inference"],
  difficulty: "advanced",
  relatedSlugs: ["reasoning-models", "inference-optimization", "cost-optimization"],
  vizType: "interactive",
};

const STRATEGIES = [
  { id: "beam", label: "Beam Search", desc: "Thử nhiều nhánh đáp án, chọn nhánh tốt nhất", compute: 3 },
  { id: "majority", label: "Bình chọn đa số", desc: "Tạo nhiều câu trả lời, chọn đáp án phổ biến nhất", compute: 5 },
  { id: "refinement", label: "Tinh chỉnh lặp", desc: "Tạo bản nháp → phê bình → sửa → lặp lại", compute: 8 },
  { id: "search", label: "Tìm kiếm cây", desc: "Khám phá cây suy luận, tỉa nhánh kém, đi sâu nhánh tốt", compute: 10 },
];

export default function TestTimeComputeTopic() {
  const [activeStrategy, setActiveStrategy] = useState("beam");
  const strategy = STRATEGIES.find((s) => s.id === activeStrategy)!;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn thi đấu cờ vua. Với <strong>3 phút</strong>, bạn đi nước hiển
          nhiên nhất. Với <strong>30 phút</strong>, bạn tính toán sâu hơn, xem xét nhiều
          phương án, phát hiện bẫy đối thủ.
        </p>
        <p>
          <strong>Test-Time Compute</strong> cho phép AI &quot;suy nghĩ lâu hơn&quot; khi gặp
          bài toán khó — giống như cho thêm thời gian suy nghĩ trong thi cờ.
          Câu hỏi dễ → trả lời nhanh. Câu hỏi khó → &quot;xin thêm thời gian&quot; để
          đạt kết quả tốt hơn.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStrategy(s.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeStrategy === s.id ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 150" className="w-full max-w-2xl mx-auto">
            <text x={20} y={30} fill="#94a3b8" fontSize={11}>Tài nguyên tính toán:</text>
            <rect x={20} y={40} width={500} height={30} rx={6} fill="#1e293b" />
            <rect x={20} y={40} width={500 * (strategy.compute / 10)} height={30} rx={6} fill="#3b82f6" />
            <text x={25 + 500 * (strategy.compute / 10)} y={60} fill="white" fontSize={11} fontWeight="bold">
              {strategy.compute}x
            </text>

            <text x={20} y={100} fill="#94a3b8" fontSize={11}>Chiến lược:</text>
            <text x={20} y={120} fill="#e2e8f0" fontSize={12}>{strategy.desc}</text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Test-Time Compute</strong> (Tính toán tại thời điểm suy luận) là paradigm mới
          cho phép mô hình AI sử dụng nhiều tài nguyên hơn khi trả lời câu hỏi khó, thay vì
          luôn dùng cùng một lượng tính toán cho mọi câu hỏi.
        </p>
        <p>Bốn chiến lược phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Beam Search mở rộng:</strong> Tạo nhiều nhánh đáp án song song, chọn nhánh có xác suất cao nhất.</li>
          <li><strong>Majority Voting:</strong> Tạo N câu trả lời độc lập, chọn đáp án xuất hiện nhiều nhất.</li>
          <li><strong>Iterative Refinement:</strong> Tạo → phê bình → sửa, lặp lại nhiều vòng.</li>
          <li><strong>Tree Search:</strong> Khám phá không gian suy luận như cây, tỉa nhánh kém, đi sâu nhánh hứa hẹn.</li>
        </ol>
        <p>
          Nghiên cứu cho thấy tăng tính toán tại thời điểm suy luận có thể
          <strong> cải thiện hiệu suất</strong> tương đương với việc tăng kích thước mô hình
          gấp nhiều lần — nhưng linh hoạt hơn và chỉ tốn chi phí khi cần.
        </p>
      </ExplanationSection>
    </>
  );
}
