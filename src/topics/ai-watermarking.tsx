"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "ai-watermarking",
  title: "AI Watermarking",
  titleVi: "Đánh dấu nội dung AI",
  description:
    "Kỹ thuật nhúng dấu hiệu ẩn vào nội dung do AI tạo ra để xác minh nguồn gốc",
  category: "ai-safety",
  tags: ["watermark", "detection", "provenance"],
  difficulty: "intermediate",
  relatedSlugs: ["guardrails", "ai-governance", "text-to-image"],
  vizType: "interactive",
};

const WORDS_GREEN = ["vinh", "biển", "đẹp", "tuyệt", "xanh"];
const WORDS_RED = ["bãi", "vịnh", "nổi", "tiếng", "mát"];

export default function AIWatermarkingTopic() {
  const [showWatermark, setShowWatermark] = useState(false);

  const sentence = [
    { word: "Vịnh", list: "red" },
    { word: "Hạ", list: "green" },
    { word: "Long", list: "green" },
    { word: "là", list: "green" },
    { word: "một", list: "red" },
    { word: "kỳ", list: "green" },
    { word: "quan", list: "green" },
    { word: "thiên", list: "green" },
    { word: "nhiên", list: "green" },
    { word: "tuyệt", list: "green" },
    { word: "đẹp", list: "green" },
  ];

  const greenCount = sentence.filter((w) => w.list === "green").length;
  const greenRatio = greenCount / sentence.length;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là một nghệ sĩ ký tên lên tranh. Nhưng thay vì ký hiệu rõ ràng,
          bạn giấu <strong>chữ ký ẩn</strong> vào trong hoạ tiết — mắt thường không thấy,
          nhưng khi quét bằng thiết bị đặc biệt thì hiện ra.
        </p>
        <p>
          AI Watermarking cũng vậy: khi LLM sinh văn bản, nó <strong>ưu tiên chọn từ</strong> từ
          một danh sách &quot;xanh&quot; bí mật. Văn bản đọc bình thường, nhưng khi phân tích thống kê,
          tỷ lệ từ &quot;xanh&quot; cao bất thường — chứng tỏ <strong>do AI viết</strong>.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex justify-center">
            <button
              onClick={() => setShowWatermark(!showWatermark)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                showWatermark
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              {showWatermark ? "Ẩn watermark" : "Hiện watermark ẩn"}
            </button>
          </div>

          <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
            {/* Generated text */}
            <text x={300} y={25} textAnchor="middle" fontSize={13} fill="#64748b">
              Văn bản do AI tạo ra:
            </text>

            {/* Word display */}
            {sentence.map((w, i) => {
              const x = 30 + (i % 6) * 95;
              const y = 45 + Math.floor(i / 6) * 45;
              return (
                <g key={i}>
                  <rect
                    x={x} y={y}
                    width={85} height={32}
                    fill={showWatermark ? (w.list === "green" ? "#dcfce7" : "#fee2e2") : "#f1f5f9"}
                    rx={5}
                    stroke={showWatermark ? (w.list === "green" ? "#22c55e" : "#ef4444") : "#e2e8f0"}
                    strokeWidth={showWatermark ? 2 : 1}
                  />
                  <text x={x + 42} y={y + 20} textAnchor="middle" fontSize={12} fill="#0f172a" fontWeight="bold">
                    {w.word}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            {showWatermark && (
              <g transform="translate(30, 155)">
                <rect x={0} y={0} width={15} height={15} fill="#dcfce7" stroke="#22c55e" rx={2} />
                <text x={20} y={12} fontSize={11} fill="#166534">Danh sách &quot;xanh&quot; (green list)</text>
                <rect x={200} y={0} width={15} height={15} fill="#fee2e2" stroke="#ef4444" rx={2} />
                <text x={220} y={12} fontSize={11} fill="#991b1b">Danh sách &quot;đỏ&quot; (red list)</text>
              </g>
            )}

            {/* Statistics */}
            <g transform="translate(30, 190)">
              <rect x={0} y={0} width={540} height={95} fill="#f8fafc" rx={8} stroke="#e2e8f0" />
              <text x={270} y={22} textAnchor="middle" fontSize={12} fill="#64748b" fontWeight="bold">
                Phân tích thống kê
              </text>

              {/* Green ratio bar */}
              <rect x={20} y={35} width={500} height={20} fill="#fee2e2" rx={4} />
              <rect x={20} y={35} width={500 * greenRatio} height={20} fill="#22c55e" rx={4} />
              <text x={270} y={50} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">
                Tỷ lệ green: {Math.round(greenRatio * 100)}%
              </text>

              <text x={270} y={78} textAnchor="middle" fontSize={11} fill={greenRatio > 0.6 ? "#166534" : "#64748b"} fontWeight="bold">
                {greenRatio > 0.6
                  ? "⚡ Tỷ lệ green cao bất thường → Có watermark (do AI viết)"
                  : "Tỷ lệ bình thường → Khó xác định"}
              </text>
            </g>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>AI Watermarking</strong> là kỹ thuật nhúng dấu hiệu ẩn vào nội dung do AI tạo ra,
          cho phép phát hiện nguồn gốc mà không ảnh hưởng đến chất lượng nội dung.
        </p>
        <p>Cách hoạt động (phương pháp Kirchenbauer et al.):</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Chia từ vựng:</strong> Dùng hash của token trước để chia từ vựng thành danh sách &quot;xanh&quot; và &quot;đỏ&quot; ngẫu nhiên.</li>
          <li><strong>Thiên vị khi sinh:</strong> Cộng thêm điểm (logit bias) cho các token trong danh sách xanh, khiến AI ưu tiên chọn từ xanh.</li>
          <li><strong>Phát hiện:</strong> Kiểm tra tỷ lệ token xanh. Nếu cao hơn đáng kể so với ngẫu nhiên (50%) → có watermark.</li>
        </ol>
        <p>Thách thức:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Paraphrase:</strong> Viết lại câu có thể phá huỷ watermark.</li>
          <li><strong>Chất lượng:</strong> Thiên vị quá mạnh làm giảm chất lượng văn bản.</li>
          <li><strong>Đa ngôn ngữ:</strong> Tiếng Việt có ít token hơn tiếng Anh trong từ vựng, ảnh hưởng đến độ mạnh watermark.</li>
          <li><strong>Ảnh:</strong> Watermark cho ảnh AI (Stable Diffusion, DALL-E) nhúng vào tần số không gian, bền hơn với thay đổi.</li>
        </ul>
      </ExplanationSection>
    </>
  );
}
