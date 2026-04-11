"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "memory-systems",
  title: "Memory Systems",
  titleVi: "Hệ thống bộ nhớ — Trí nhớ của AI Agent",
  description:
    "Các cơ chế lưu trữ thông tin giúp AI Agent nhớ bối cảnh, kinh nghiệm và kiến thức qua nhiều phiên làm việc.",
  category: "ai-agents",
  tags: ["memory", "agent", "context", "vector-store"],
  difficulty: "intermediate",
  relatedSlugs: ["agent-architecture", "planning", "multi-agent"],
  vizType: "interactive",
};

const MEMORY_TYPES = [
  {
    id: "short",
    label: "Bộ nhớ ngắn hạn",
    color: "#3b82f6",
    items: ["Hội thoại hiện tại", "Ngữ cảnh gần đây", "Biến tạm thời"],
    analogy: "Như bảng trắng — ghi nhanh rồi xóa",
  },
  {
    id: "long",
    label: "Bộ nhớ dài hạn",
    color: "#8b5cf6",
    items: ["Vector database", "Tóm tắt cuộc trò chuyện cũ", "Sở thích người dùng"],
    analogy: "Như nhật ký — lưu lại mãi mãi",
  },
  {
    id: "episodic",
    label: "Bộ nhớ sự kiện",
    color: "#22c55e",
    items: ["Kinh nghiệm quá khứ", "Thành công / thất bại", "Kịch bản tương tự"],
    analogy: "Như album ảnh — nhớ từng trải nghiệm",
  },
];

export default function MemorySystemsTopic() {
  const [activeType, setActiveType] = useState("short");
  const active = MEMORY_TYPES.find((m) => m.id === activeType)!;

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng AI Agent như một <strong>đầu bếp trong nhà hàng</strong>.
          Bếp trưởng cần ba loại &quot;trí nhớ&quot;:
        </p>
        <p>
          <strong>Bộ nhớ ngắn hạn:</strong> Nhớ món đang nấu (đang xào rau, lửa đang to).
          <strong> Bộ nhớ dài hạn:</strong> Nhớ công thức nấu ăn đã học.
          <strong> Bộ nhớ sự kiện:</strong> Nhớ lần trước nêm quá mặn để lần này giảm muối.
        </p>
        <p>
          Thiếu bất kỳ loại nào, bếp trưởng cũng không thể nấu ngon!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {MEMORY_TYPES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveType(m.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeType === m.id
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
            {/* Central brain */}
            <circle cx={300} cy={110} r={40} fill="#1e293b" stroke={active.color} strokeWidth={3} />
            <text x={300} y={106} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
              AI Agent
            </text>
            <text x={300} y={122} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              Bộ não
            </text>

            {/* Memory items */}
            {active.items.map((item, i) => {
              const angle = -Math.PI / 2 + (i * Math.PI) / (active.items.length - 1 || 1);
              const rx = 180;
              const ry = 80;
              const cx = 300 + rx * Math.cos(angle);
              const cy = 110 + ry * Math.sin(angle);
              return (
                <g key={i}>
                  <line x1={300} y1={110} x2={cx} y2={cy} stroke={active.color} strokeWidth={1.5} opacity={0.5} />
                  <rect x={cx - 70} y={cy - 14} width={140} height={28} rx={6} fill={active.color} opacity={0.85} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
                    {item}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted italic">{active.analogy}</p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Hệ thống bộ nhớ</strong> giúp AI Agent duy trì thông tin qua các lần tương tác,
          khắc phục giới hạn cửa sổ ngữ cảnh của LLM.
        </p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Bộ nhớ ngắn hạn:</strong> Chính là cửa sổ ngữ cảnh (context window) của LLM.
            Chứa hội thoại hiện tại và các bước trung gian. Bị giới hạn về kích thước.
          </li>
          <li>
            <strong>Bộ nhớ dài hạn:</strong> Sử dụng cơ sở dữ liệu vector để lưu trữ
            và truy xuất thông tin từ các phiên trước. Có thể mở rộng vô hạn.
          </li>
          <li>
            <strong>Bộ nhớ sự kiện:</strong> Lưu lại các trải nghiệm cụ thể — thành công
            hay thất bại — để Agent học từ kinh nghiệm.
          </li>
        </ol>
        <p>
          Kỹ thuật phổ biến bao gồm <strong>RAG</strong> (Retrieval-Augmented Generation),
          <strong> tóm tắt hội thoại</strong>, và <strong>embedding lưu trữ</strong> trong
          vector database như Pinecone hay Chroma.
        </p>
      </ExplanationSection>
    </>
  );
}
