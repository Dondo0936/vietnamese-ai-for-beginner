"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "prompt-engineering",
  title: "Prompt Engineering",
  titleVi: "Kỹ thuật viết prompt",
  description:
    "Nghệ thuật thiết kế prompt hiệu quả để hướng dẫn mô hình ngôn ngữ lớn cho ra kết quả mong muốn.",
  category: "llm-concepts",
  tags: ["prompt", "llm", "few-shot", "instruction"],
  difficulty: "beginner",
  relatedSlugs: ["chain-of-thought", "in-context-learning", "temperature"],
  vizType: "interactive",
};

const TEMPLATES = [
  {
    name: "Zero-shot",
    prompt: "Phân loại cảm xúc của câu sau: 'Món ăn ngon tuyệt vời!'",
    response: "Tích cực",
    quality: 0.7,
  },
  {
    name: "Few-shot",
    prompt:
      "Phân loại cảm xúc:\n'Tuyệt vời' -> Tích cực\n'Tệ quá' -> Tiêu cực\n'Món ăn ngon tuyệt vời!' ->",
    response: "Tích cực",
    quality: 0.9,
  },
  {
    name: "Chain-of-Thought",
    prompt:
      "Phân loại cảm xúc. Hãy suy nghĩ từng bước:\n1. Xác định từ khóa cảm xúc\n2. Đánh giá ngữ cảnh\n'Món ăn ngon tuyệt vời!' ->",
    response:
      "1. Từ khóa: 'ngon', 'tuyệt vời' -> tích cực\n2. Ngữ cảnh: khen món ăn\n-> Tích cực",
    quality: 0.95,
  },
  {
    name: "Persona",
    prompt:
      "Bạn là chuyên gia ẩm thực. Hãy phân loại cảm xúc: 'Món ăn ngon tuyệt vời!'",
    response:
      "Với tư cách chuyên gia ẩm thực, đây rõ ràng là phản hồi Tích cực, thể hiện sự hài lòng cao.",
    quality: 0.85,
  },
];

export default function PromptEngineeringTopic() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = TEMPLATES[selectedIdx];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang nhờ một <strong>đầu bếp tài năng</strong> nấu
          món ăn. Nếu bạn chỉ nói &quot;nấu gì đó ngon&quot;, kết quả sẽ rất
          khó đoán.
        </p>
        <p>
          Nhưng nếu bạn nói: &quot;Hãy nấu phở bò, dùng xương hầm 8 tiếng,
          thêm hồi và quế, phục vụ cho 4 người&quot; &mdash; kết quả sẽ{" "}
          <strong>chính xác hơn nhiều</strong>!
        </p>
        <p>
          Prompt Engineering chính là nghệ thuật <strong>ra chỉ dẫn rõ ràng</strong>{" "}
          cho AI. Prompt càng chi tiết và có cấu trúc, câu trả lời càng tốt!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Template selector */}
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedIdx === i
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Prompt display */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-blue-500/30 bg-background/50 p-4">
              <p className="text-sm font-semibold text-blue-400 mb-2">Prompt</p>
              <pre className="text-xs text-muted whitespace-pre-wrap font-mono">
                {selected.prompt}
              </pre>
            </div>
            <div className="rounded-lg border border-green-500/30 bg-background/50 p-4">
              <p className="text-sm font-semibold text-green-400 mb-2">Phản hồi</p>
              <pre className="text-xs text-muted whitespace-pre-wrap font-mono">
                {selected.response}
              </pre>
            </div>
          </div>

          {/* Quality bar */}
          <svg viewBox="0 0 500 80" className="w-full max-w-xl mx-auto">
            <text x="250" y="18" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              Chất lượng kết quả
            </text>
            <rect x="50" y="30" width="400" height="20" rx="10" fill="#1e293b" />
            <rect x="50" y="30" width={selected.quality * 400} height="20" rx="10"
              fill={selected.quality > 0.85 ? "#22c55e" : selected.quality > 0.7 ? "#f59e0b" : "#ef4444"} />
            <text x={50 + selected.quality * 400 + 10} y="45" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              {(selected.quality * 100).toFixed(0)}%
            </text>

            {TEMPLATES.map((t, i) => (
              <g key={i} onClick={() => setSelectedIdx(i)} className="cursor-pointer">
                <circle cx={50 + t.quality * 400} cy="65" r="4"
                  fill={selectedIdx === i ? "#22c55e" : "#475569"} />
                <text x={50 + t.quality * 400} y="78" textAnchor="middle"
                  fill={selectedIdx === i ? "#22c55e" : "#64748b"} fontSize="7">
                  {t.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Prompt Engineering</strong> là kỹ năng thiết kế và tối ưu hóa các chỉ
          dẫn (prompt) để mô hình ngôn ngữ lớn (LLM) cho ra kết quả chính xác và hữu
          ích nhất.
        </p>
        <p>Các kỹ thuật prompt phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Zero-shot:</strong> Hỏi trực tiếp không có ví dụ. Đơn giản nhưng
            kết quả có thể không ổn định.
          </li>
          <li>
            <strong>Few-shot:</strong> Cung cấp một vài ví dụ mẫu trước câu hỏi. Giúp
            mô hình hiểu định dạng và phong cách mong muốn.
          </li>
          <li>
            <strong>Chain-of-Thought:</strong> Yêu cầu mô hình suy nghĩ từng bước. Cải
            thiện đáng kể khả năng lập luận logic.
          </li>
          <li>
            <strong>Persona / Role:</strong> Gán vai trò cụ thể cho mô hình, giúp câu
            trả lời phù hợp với chuyên môn yêu cầu.
          </li>
        </ol>
        <p>
          Prompt Engineering là kỹ năng nền tảng cho bất kỳ ai làm việc với LLM. Một
          prompt tốt có thể thay đổi hoàn toàn chất lượng đầu ra mà không cần thay
          đổi mô hình.
        </p>
      </ExplanationSection>
    </>
  );
}
