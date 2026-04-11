"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "tlm",
  title: "Trustworthy Language Models",
  titleVi: "Mô hình ngôn ngữ đáng tin cậy",
  description:
    "Kỹ thuật đo lường và cải thiện độ tin cậy của mô hình ngôn ngữ, bao gồm tự đánh giá điểm tin cậy cho từng phản hồi.",
  category: "multimodal",
  tags: ["trustworthy", "confidence", "reliability", "calibration"],
  difficulty: "advanced",
  relatedSlugs: ["alignment", "explainability", "guardrails"],
  vizType: "interactive",
};

const EXAMPLES = [
  { query: "2 + 2 = ?", answer: "4", confidence: 0.99, correct: true },
  { query: "Thủ đô Việt Nam?", answer: "Hà Nội", confidence: 0.98, correct: true },
  { query: "Tổng thống Mỹ năm 2030?", answer: "Chưa biết", confidence: 0.35, correct: true },
  { query: "Phản ứng hoá học phức tạp...", answer: "H2SO4 + NaOH → ...", confidence: 0.72, correct: false },
];

export default function TLMTopic() {
  const [selectedEx, setSelectedEx] = useState(0);
  const ex = EXAMPLES[selectedEx];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn hỏi đường một người lạ. Người <strong>đáng tin cậy</strong>
          sẽ nói: &quot;Tôi chắc chắn 95% — rẽ trái ở ngã tư thứ hai.&quot; Còn nếu không chắc,
          họ sẽ thành thật: &quot;Tôi không rõ lắm, chỉ khoảng 30% đúng — bạn nên hỏi người khác.&quot;
        </p>
        <p>
          <strong>TLM</strong> hoạt động tương tự — mô hình không chỉ trả lời mà còn
          <strong> tự đánh giá mức độ tin cậy</strong> của câu trả lời. Điểm tin cậy cao
          nghĩa là mô hình &quot;chắc chắn&quot;, điểm thấp nghĩa là nên kiểm chứng lại.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((e, i) => (
              <button
                key={i}
                onClick={() => setSelectedEx(i)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  selectedEx === i
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {e.query.length > 20 ? e.query.slice(0, 20) + "..." : e.query}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 180" className="w-full max-w-2xl mx-auto">
            {/* Confidence bar */}
            <text x={20} y={30} fill="#94a3b8" fontSize={12}>Điểm tin cậy:</text>
            <rect x={20} y={40} width={500} height={30} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <rect
              x={20}
              y={40}
              width={500 * ex.confidence}
              height={30}
              rx={6}
              fill={ex.confidence > 0.7 ? "#22c55e" : ex.confidence > 0.4 ? "#f59e0b" : "#ef4444"}
            />
            <text x={530} y={61} fill="white" fontSize={14} fontWeight="bold">
              {(ex.confidence * 100).toFixed(0)}%
            </text>

            {/* Details */}
            <text x={20} y={100} fill="#94a3b8" fontSize={11}>Câu hỏi: {ex.query}</text>
            <text x={20} y={120} fill="#e2e8f0" fontSize={11}>Trả lời: {ex.answer}</text>
            <text x={20} y={145} fill={ex.correct ? "#22c55e" : "#ef4444"} fontSize={11} fontWeight="bold">
              {ex.correct ? "✓ Câu trả lời chính xác" : "✗ Câu trả lời sai — Cần kiểm chứng"}
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Trustworthy Language Models (TLM)</strong> là cách tiếp cận giúp mô hình
          ngôn ngữ trở nên <strong>đáng tin cậy hơn</strong> bằng cách bổ sung
          <strong> điểm tin cậy</strong> (confidence score) cho mỗi phản hồi.
        </p>
        <p>Ba trụ cột của TLM:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Hiệu chuẩn (Calibration):</strong> Đảm bảo điểm tin cậy phản ánh đúng
            xác suất câu trả lời chính xác — không quá tự tin cũng không quá e ngại.
          </li>
          <li>
            <strong>Tự đánh giá:</strong> Mô hình tự phân tích mức độ chắc chắn dựa trên
            kiến thức đã học và độ phức tạp của câu hỏi.
          </li>
          <li>
            <strong>Từ chối khi không chắc:</strong> Khi điểm tin cậy thấp, mô hình nên
            thông báo thay vì bịa câu trả lời sai.
          </li>
        </ol>
        <p>
          TLM đặc biệt quan trọng trong các ứng dụng đòi hỏi độ chính xác cao như
          <strong> y tế</strong>, <strong>pháp luật</strong> và <strong>tài chính</strong>,
          nơi câu trả lời sai có thể gây hậu quả nghiêm trọng.
        </p>
      </ExplanationSection>
    </>
  );
}
