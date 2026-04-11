"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "vlm",
  title: "Vision-Language Models",
  titleVi: "Mô hình Ngôn ngữ — Thị giác",
  description:
    "Mô hình AI có khả năng hiểu đồng thời cả hình ảnh và văn bản, cho phép hỏi đáp về nội dung hình ảnh.",
  category: "multimodal",
  tags: ["vision", "language", "multimodal", "image-understanding"],
  difficulty: "intermediate",
  relatedSlugs: ["clip", "unified-multimodal", "text-to-image"],
  vizType: "interactive",
};

const TASKS = [
  { id: "caption", label: "Mô tả ảnh", input: "🖼️ Ảnh bãi biển", output: "Bãi biển xanh với hàng dừa, nắng chiều vàng rực" },
  { id: "vqa", label: "Hỏi đáp hình ảnh", input: "🖼️ + 'Có mấy người?'", output: "Có 3 người đang tắm biển" },
  { id: "ocr", label: "Đọc chữ trong ảnh", input: "🖼️ Biển hiệu", output: "'Phở Hà Nội — Mở cửa 6h-22h'" },
  { id: "reasoning", label: "Suy luận hình ảnh", input: "🖼️ Biểu đồ", output: "Doanh thu quý 3 tăng 25% so với quý 2" },
];

export default function VLMTopic() {
  const [activeTask, setActiveTask] = useState("caption");
  const task = TASKS.find((t) => t.id === activeTask)!;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn có một người bạn <strong>vừa giỏi nhìn vừa giỏi nói</strong>.
          Khi bạn đưa cho họ một bức ảnh, họ không chỉ nhìn thấy mà còn có thể
          <strong> mô tả</strong> chi tiết, <strong>trả lời câu hỏi</strong> về nội dung,
          thậm chí <strong>suy luận</strong> từ những gì nhìn thấy.
        </p>
        <p>
          Vision-Language Models (VLM) chính là &quot;người bạn&quot; đó —
          kết hợp &quot;đôi mắt&quot; (bộ xử lý hình ảnh) với &quot;bộ não ngôn ngữ&quot; (LLM)
          để hiểu cả thế giới thị giác lẫn ngôn ngữ.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {TASKS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTask(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTask === t.id
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 200" className="w-full max-w-2xl mx-auto">
            {/* Input */}
            <rect x={20} y={60} width={150} height={60} rx={10} fill="#3b82f6" />
            <text x={95} y={85} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Đầu vào</text>
            <text x={95} y={102} textAnchor="middle" fill="#bfdbfe" fontSize={9}>{task.input}</text>

            {/* VLM */}
            <line x1={170} y1={90} x2={220} y2={90} stroke="#475569" strokeWidth={2} />
            <rect x={220} y={50} width={160} height={80} rx={12} fill="#1e293b" stroke="#8b5cf6" strokeWidth={2} />
            <text x={300} y={80} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">VLM</text>
            <text x={300} y={100} textAnchor="middle" fill="#94a3b8" fontSize={9}>Bộ xử lý hình ảnh + LLM</text>

            {/* Output */}
            <line x1={380} y1={90} x2={430} y2={90} stroke="#475569" strokeWidth={2} />
            <rect x={430} y={55} width={150} height={70} rx={10} fill="#22c55e" />
            <text x={505} y={80} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Đầu ra</text>
            <text x={505} y={100} textAnchor="middle" fill="#bbf7d0" fontSize={8}>
              {task.output.length > 30 ? task.output.slice(0, 30) + "..." : task.output}
            </text>
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              <strong>Kết quả:</strong> {task.output}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Vision-Language Models (VLM)</strong> là mô hình AI kết hợp khả năng hiểu
          hình ảnh và ngôn ngữ tự nhiên. Chúng có thể nhận đầu vào là hình ảnh (hoặc video)
          kèm văn bản, rồi tạo ra phản hồi bằng ngôn ngữ tự nhiên.
        </p>
        <p>Kiến trúc VLM thường gồm 3 phần:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Bộ mã hoá hình ảnh (Vision Encoder):</strong> Trích xuất đặc trưng từ ảnh (thường là ViT).</li>
          <li><strong>Tầng kết nối (Projection Layer):</strong> Chuyển đổi đặc trưng ảnh sang không gian ngôn ngữ.</li>
          <li><strong>Mô hình ngôn ngữ (LLM):</strong> Xử lý kết hợp thông tin ảnh và văn bản để tạo phản hồi.</li>
        </ol>
        <p>
          Các VLM nổi bật gồm <strong>GPT-4V</strong>, <strong>Claude 3</strong>,
          <strong> Gemini</strong> và <strong>LLaVA</strong>. Ứng dụng trải rộng từ
          hỗ trợ người khiếm thị đến phân tích tài liệu y khoa.
        </p>
      </ExplanationSection>
    </>
  );
}
