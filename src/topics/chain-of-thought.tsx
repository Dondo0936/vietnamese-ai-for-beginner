"use client";

import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "chain-of-thought",
  title: "Chain-of-Thought",
  titleVi: "Chain-of-Thought - Chuỗi suy luận",
  description:
    "Kỹ thuật yêu cầu mô hình trình bày quá trình suy nghĩ từng bước để cải thiện khả năng lập luận.",
  category: "llm-concepts",
  tags: ["reasoning", "prompt", "cot", "llm"],
  difficulty: "beginner",
  relatedSlugs: ["prompt-engineering", "in-context-learning", "llm-overview"],
  vizType: "static",
};

export default function ChainOfThoughtTopic() {
  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>giáo viên toán</strong>. Khi học sinh giải bài,
          bạn không chỉ muốn xem đáp án cuối cùng &mdash; bạn muốn xem{" "}
          <strong>cả bài giải từng bước</strong>.
        </p>
        <p>
          Nếu học sinh viết &quot;Đáp án: 42&quot;, bạn không biết họ có hiểu không.
          Nhưng nếu họ viết: &quot;Bước 1: tìm x... Bước 2: thế vào... Bước 3:
          tính ra 42&quot; &mdash; bạn thấy rõ <strong>quá trình tư duy</strong>.
        </p>
        <p>
          Chain-of-Thought buộc AI cũng phải &quot;trình bày bài giải&quot; như vậy,
          giúp AI suy luận chính xác hơn và người dùng dễ kiểm tra hơn!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <svg viewBox="0 0 700 420" className="w-full max-w-3xl mx-auto">
            <text x="350" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold">
              So sánh: Không CoT vs Có CoT
            </text>

            {/* Without CoT */}
            <rect x="20" y="45" width="310" height="360" rx="12" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="175" y="70" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
              Không có Chain-of-Thought
            </text>

            <rect x="35" y="85" width="280" height="45" rx="8" fill="#334155" />
            <text x="175" y="105" textAnchor="middle" fill="#94a3b8" fontSize="9">
              Hỏi: Một cửa hàng có 23 quả táo.
            </text>
            <text x="175" y="118" textAnchor="middle" fill="#94a3b8" fontSize="9">
              Bán 7 quả, nhập thêm 15 quả. Hỏi còn bao nhiêu?
            </text>

            <text x="175" y="155" textAnchor="middle" fill="#64748b" fontSize="10">...</text>

            <rect x="35" y="170" width="280" height="35" rx="8" fill="#7f1d1d" />
            <text x="175" y="192" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="bold">
              Trả lời: 35 quả
            </text>

            <text x="175" y="230" textAnchor="middle" fill="#ef4444" fontSize="10">
              Sai! Không thấy quá trình suy nghĩ
            </text>

            <rect x="35" y="250" width="280" height="40" rx="8" fill="#334155" />
            <text x="175" y="267" textAnchor="middle" fill="#64748b" fontSize="9">
              Mô hình nhảy thẳng đến đáp án
            </text>
            <text x="175" y="280" textAnchor="middle" fill="#64748b" fontSize="9">
              mà không suy luận qua các bước
            </text>

            {/* With CoT */}
            <rect x="370" y="45" width="310" height="360" rx="12" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
            <text x="525" y="70" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">
              Có Chain-of-Thought
            </text>

            <rect x="385" y="85" width="280" height="45" rx="8" fill="#334155" />
            <text x="525" y="105" textAnchor="middle" fill="#94a3b8" fontSize="9">
              Hỏi: Suy nghĩ từng bước. Một cửa hàng có
            </text>
            <text x="525" y="118" textAnchor="middle" fill="#94a3b8" fontSize="9">
              23 quả táo. Bán 7, nhập 15. Còn bao nhiêu?
            </text>

            {/* Steps */}
            {[
              { text: "Bước 1: Ban đầu có 23 quả táo", y: 148, color: "#3b82f6" },
              { text: "Bước 2: Bán 7 quả: 23 - 7 = 16 quả", y: 183, color: "#f59e0b" },
              { text: "Bước 3: Nhập thêm 15: 16 + 15 = 31 quả", y: 218, color: "#8b5cf6" },
            ].map((step, i) => (
              <g key={i}>
                <rect x="385" y={step.y} width="280" height="28" rx="6"
                  fill={step.color} opacity={0.15} stroke={step.color} strokeWidth="1" />
                <text x="525" y={step.y + 18} textAnchor="middle" fill={step.color} fontSize="9">
                  {step.text}
                </text>
                {i < 2 && (
                  <line x1="525" y1={step.y + 28} x2="525" y2={step.y + 35}
                    stroke="#475569" strokeWidth="1.5" markerEnd="url(#arrow-cot)" />
                )}
              </g>
            ))}

            <rect x="385" y="260" width="280" height="35" rx="8" fill="#14532d" />
            <text x="525" y="282" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="bold">
              Trả lời: 31 quả (Đúng!)
            </text>

            <text x="525" y="320" textAnchor="middle" fill="#22c55e" fontSize="10">
              Đúng! Quá trình suy luận rõ ràng
            </text>

            <rect x="385" y="340" width="280" height="40" rx="8" fill="#334155" />
            <text x="525" y="357" textAnchor="middle" fill="#64748b" fontSize="9">
              Mô hình giải thích từng bước,
            </text>
            <text x="525" y="370" textAnchor="middle" fill="#64748b" fontSize="9">
              dễ kiểm tra và phát hiện lỗi
            </text>

            <defs>
              <marker id="arrow-cot" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#475569" />
              </marker>
            </defs>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Chain-of-Thought (CoT)</strong> là kỹ thuật prompt yêu cầu mô hình
          ngôn ngữ trình bày quá trình suy nghĩ từng bước trước khi đưa ra đáp án cuối
          cùng, thay vì nhảy thẳng đến kết luận.
        </p>
        <p>Các biến thể của CoT:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Few-shot CoT:</strong> Cung cấp ví dụ có lời giải từng bước trong
            prompt. Mô hình sẽ bắt chước phong cách suy luận.
          </li>
          <li>
            <strong>Zero-shot CoT:</strong> Chỉ cần thêm câu &quot;Hãy suy nghĩ từng
            bước&quot; (&quot;Let&apos;s think step by step&quot;) vào cuối prompt.
          </li>
          <li>
            <strong>Self-Consistency:</strong> Sinh nhiều chuỗi suy luận rồi chọn đáp
            án xuất hiện nhiều nhất, tăng độ tin cậy.
          </li>
        </ol>
        <p>
          CoT đặc biệt hiệu quả cho các bài toán đòi hỏi <strong>lập luận logic</strong>,{" "}
          <strong>tính toán nhiều bước</strong> và <strong>suy luận nhân quả</strong>.
          Nghiên cứu cho thấy CoT cải thiện đáng kể hiệu suất trên các benchmark toán
          học và lập luận.
        </p>
      </ExplanationSection>
    </>
  );
}
