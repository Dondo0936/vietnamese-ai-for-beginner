"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "long-context",
  title: "Long Context",
  titleVi: "Ngữ cảnh dài — AI đọc cả cuốn sách",
  description:
    "Khả năng mô hình xử lý hàng trăm nghìn đến hàng triệu token trong một lần, cho phép phân tích tài liệu dài.",
  category: "emerging",
  tags: ["long-context", "context-window", "retrieval", "attention"],
  difficulty: "intermediate",
  relatedSlugs: ["state-space-models", "reasoning-models", "inference-optimization"],
  vizType: "interactive",
};

const MODELS = [
  { name: "GPT-3.5 (2023)", context: 4096, pages: 5 },
  { name: "GPT-4 (2023)", context: 128000, pages: 160 },
  { name: "Claude 3 (2024)", context: 200000, pages: 250 },
  { name: "Gemini 1.5 (2024)", context: 1000000, pages: 1250 },
  { name: "Claude (2025)", context: 1000000, pages: 1250 },
];

export default function LongContextTopic() {
  const [selectedModel, setSelectedModel] = useState(2);
  const model = MODELS[selectedModel];
  const maxCtx = MODELS[MODELS.length - 1].context;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng sự khác biệt giữa <strong>đọc một tờ ghi chú</strong>
          và <strong>đọc cả một cuốn tiểu thuyết</strong> rồi trả lời câu hỏi.
          Với tờ ghi chú, bạn nhớ mọi thứ. Nhưng với cuốn sách dày, bạn cần
          khả năng <strong>nhớ từ chương 1 đến chương cuối</strong>.
        </p>
        <p>
          LLM cũ chỉ &quot;nhớ&quot; được vài trang — giống đọc tờ ghi chú.
          <strong> Long Context</strong> cho phép AI &quot;đọc&quot; hàng nghìn trang
          trong một lần, hiểu mối liên hệ xuyên suốt toàn bộ tài liệu.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {MODELS.map((m, i) => (
              <button
                key={i}
                onClick={() => setSelectedModel(i)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  selectedModel === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 150" className="w-full max-w-2xl mx-auto">
            <text x={20} y={30} fill="#94a3b8" fontSize={11}>Cửa sổ ngữ cảnh:</text>
            <rect x={20} y={40} width={500} height={30} rx={6} fill="#1e293b" />
            <rect
              x={20}
              y={40}
              width={Math.max(5, 500 * (model.context / maxCtx))}
              height={30}
              rx={6}
              fill="#3b82f6"
            />
            <text x={530} y={60} fill="white" fontSize={11} fontWeight="bold">
              {model.context.toLocaleString()} token
            </text>

            <text x={20} y={100} fill="#94a3b8" fontSize={11}>
              Tương đương khoảng <tspan fill="white" fontWeight="bold">{model.pages}</tspan> trang sách
            </text>
            <text x={20} y={125} fill="#94a3b8" fontSize={10}>
              {model.context >= 200000
                ? "Có thể đọc cả cuốn sách trong một lần!"
                : model.context >= 100000
                  ? "Đọc được nhiều chương sách cùng lúc"
                  : "Chỉ đọc được vài trang"}
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Long Context</strong> (Ngữ cảnh dài) là khả năng mô hình ngôn ngữ xử lý
          hàng trăm nghìn đến hàng triệu token trong một lần truy vấn, cho phép phân tích
          tài liệu dài mà không cần chia nhỏ.
        </p>
        <p>Thách thức kỹ thuật và giải pháp:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Chi phí attention O(n^2):</strong> Giải quyết bằng Ring Attention, Flash Attention, hoặc kiến trúc SSM.</li>
          <li><strong>Vấn đề &quot;lost in the middle&quot;:</strong> Mô hình quên thông tin ở giữa tài liệu dài. Cải thiện bằng kỹ thuật huấn luyện đặc biệt.</li>
          <li><strong>Bộ nhớ GPU:</strong> KV cache rất lớn. Giải pháp: nén KV cache, offloading, hoặc kiến trúc hybrid.</li>
        </ol>
        <p>
          Ứng dụng: phân tích hợp đồng pháp lý, tóm tắt sách, review code toàn bộ dự án,
          và hỏi đáp trên kho tài liệu lớn mà không cần RAG.
        </p>
      </ExplanationSection>
    </>
  );
}
