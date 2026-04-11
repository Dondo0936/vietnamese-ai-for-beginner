"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "reasoning-models",
  title: "Reasoning Models",
  titleVi: "Mô hình suy luận — AI biết nghĩ sâu",
  description:
    "Thế hệ mô hình AI mới có khả năng suy luận từng bước, giải quyết các bài toán phức tạp đòi hỏi logic và tư duy.",
  category: "emerging",
  tags: ["reasoning", "o1", "chain-of-thought", "thinking"],
  difficulty: "advanced",
  relatedSlugs: ["test-time-compute", "long-context", "planning"],
  vizType: "interactive",
};

const COMPARISON = [
  { mode: "Trả lời nhanh", steps: 1, quality: 60, time: "0.5s", desc: "Trả lời ngay không suy nghĩ" },
  { mode: "Suy luận nhẹ", steps: 3, quality: 80, time: "2s", desc: "Nghĩ vài bước trước khi trả lời" },
  { mode: "Suy luận sâu", steps: 8, quality: 95, time: "15s", desc: "Phân tích kỹ, kiểm tra logic từng bước" },
];

export default function ReasoningModelsTopic() {
  const [mode, setMode] = useState(1);
  const item = COMPARISON[mode];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng sự khác biệt giữa <strong>trả lời bài thi trắc nghiệm</strong>
          và <strong>giải bài toán tự luận</strong>. Trắc nghiệm: nhìn đáp án, chọn ngay.
          Tự luận: phải <em>suy nghĩ từng bước</em>, viết lời giải chi tiết.
        </p>
        <p>
          LLM thông thường giống trả lời trắc nghiệm — phản ứng nhanh nhưng dễ sai.
          <strong> Mô hình suy luận</strong> giống giải tự luận — chậm hơn nhưng
          <strong> phân tích kỹ</strong>, <strong>kiểm tra logic</strong>, và đạt độ chính xác
          cao hơn nhiều trên các bài toán phức tạp.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex gap-3 justify-center">
            {COMPARISON.map((c, i) => (
              <button
                key={i}
                onClick={() => setMode(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {c.mode}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
            {/* Quality bar */}
            <text x={20} y={40} fill="#94a3b8" fontSize={11}>Chất lượng</text>
            <rect x={120} y={25} width={400} height={24} rx={4} fill="#1e293b" />
            <rect x={120} y={25} width={400 * (item.quality / 100)} height={24} rx={4} fill="#22c55e" />
            <text x={125 + 400 * (item.quality / 100)} y={42} fill="white" fontSize={11} fontWeight="bold">{item.quality}%</text>

            {/* Steps bar */}
            <text x={20} y={80} fill="#94a3b8" fontSize={11}>Số bước suy luận</text>
            <rect x={120} y={65} width={400} height={24} rx={4} fill="#1e293b" />
            <rect x={120} y={65} width={400 * (item.steps / 10)} height={24} rx={4} fill="#3b82f6" />
            <text x={125 + 400 * (item.steps / 10)} y={82} fill="white" fontSize={11} fontWeight="bold">{item.steps}</text>

            {/* Time */}
            <text x={20} y={120} fill="#94a3b8" fontSize={11}>Thời gian</text>
            <rect x={120} y={105} width={400} height={24} rx={4} fill="#1e293b" />
            <text x={130} y={122} fill="#f59e0b" fontSize={11} fontWeight="bold">{item.time}</text>

            <text x={300} y={160} textAnchor="middle" fill="#94a3b8" fontSize={10}>{item.desc}</text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Mô hình suy luận (Reasoning Models)</strong> như o1, o3 của OpenAI và Claude
          đại diện cho bước nhảy mới: AI không chỉ &quot;trả lời&quot; mà thực sự
          <strong> suy nghĩ</strong> trước khi đưa ra câu trả lời.
        </p>
        <p>Đặc điểm chính:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Chain-of-Thought nội bộ:</strong> Mô hình tạo chuỗi lý luận dài trước khi trả lời, thường ẩn khỏi người dùng.</li>
          <li><strong>Tự kiểm tra:</strong> Mô hình đánh giá lại các bước suy luận, phát hiện lỗi logic và tự sửa.</li>
          <li><strong>Đánh đổi thời gian lấy chất lượng:</strong> Nghĩ lâu hơn → câu trả lời chính xác hơn.</li>
        </ol>
        <p>
          Mô hình suy luận vượt trội trong <strong>toán học</strong>, <strong>lập trình</strong>,
          <strong> khoa học</strong>, và các bài toán logic. Tuy nhiên, chúng tốn nhiều tài nguyên hơn
          và không phải lúc nào cũng cần thiết cho câu hỏi đơn giản.
        </p>
      </ExplanationSection>
    </>
  );
}
