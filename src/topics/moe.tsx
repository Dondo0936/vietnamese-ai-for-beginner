"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "moe",
  title: "Mixture of Experts",
  titleVi: "Hỗn hợp chuyên gia — Chia để trị",
  description:
    "Kiến trúc mô hình sử dụng nhiều mạng con chuyên biệt (chuyên gia), chỉ kích hoạt một vài chuyên gia cho mỗi đầu vào.",
  category: "emerging",
  tags: ["moe", "sparse", "experts", "efficiency"],
  difficulty: "advanced",
  relatedSlugs: ["reasoning-models", "small-language-models", "inference-optimization"],
  vizType: "interactive",
};

const EXPERTS = [
  { id: 0, label: "Toán học", color: "#3b82f6" },
  { id: 1, label: "Ngôn ngữ", color: "#22c55e" },
  { id: 2, label: "Lập trình", color: "#f59e0b" },
  { id: 3, label: "Khoa học", color: "#8b5cf6" },
  { id: 4, label: "Lịch sử", color: "#ef4444" },
  { id: 5, label: "Sáng tạo", color: "#06b6d4" },
];

const QUERIES = [
  { text: "Giải phương trình x²=4", active: [0, 3] },
  { text: "Viết bài thơ về mùa thu", active: [1, 5] },
  { text: "Code hàm sắp xếp", active: [2, 0] },
];

export default function MoETopic() {
  const [queryIdx, setQueryIdx] = useState(0);
  const query = QUERIES[queryIdx];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng một <strong>bệnh viện đa khoa</strong>. Khi bệnh nhân đến,
          <strong> lễ tân</strong> (router/gating network) xác định triệu chứng và chuyển đến
          đúng <strong>bác sĩ chuyên khoa</strong> (expert) — tim mạch, da liễu, hay thần kinh.
        </p>
        <p>
          Không phải mọi bác sĩ đều khám mọi bệnh nhân — chỉ <strong>2-3 chuyên gia
          phù hợp nhất</strong> được kích hoạt. Nhờ vậy, bệnh viện có thể có
          <strong> hàng trăm bác sĩ</strong> (tham số lớn) nhưng mỗi lần khám chỉ tốn
          chi phí của vài bác sĩ (tính toán ít).
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUERIES.map((q, i) => (
              <button
                key={i}
                onClick={() => setQueryIdx(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  queryIdx === i ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {q.text.length > 20 ? q.text.slice(0, 20) + "..." : q.text}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
            {/* Router */}
            <rect x={230} y={10} width={140} height={35} rx={8} fill="#f59e0b" />
            <text x={300} y={33} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">Router (Gating)</text>

            {/* Experts */}
            {EXPERTS.map((e, i) => {
              const x = 50 + i * 100;
              const isActive = query.active.includes(e.id);
              return (
                <g key={i}>
                  <line x1={300} y1={45} x2={x} y2={80} stroke={isActive ? e.color : "#475569"} strokeWidth={isActive ? 3 : 1} opacity={isActive ? 1 : 0.3} />
                  <rect
                    x={x - 40}
                    y={80}
                    width={80}
                    height={40}
                    rx={8}
                    fill={isActive ? e.color : "#1e293b"}
                    stroke={e.color}
                    strokeWidth={isActive ? 2 : 1}
                    opacity={isActive ? 1 : 0.3}
                  />
                  <text x={x} y={105} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">{e.label}</text>
                </g>
              );
            })}

            {/* Info */}
            <text x={300} y={155} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              Chỉ {query.active.length}/{EXPERTS.length} chuyên gia được kích hoạt
            </text>
            <text x={300} y={175} textAnchor="middle" fill="#e2e8f0" fontSize={11}>
              Câu hỏi: &quot;{query.text}&quot;
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Mixture of Experts (MoE)</strong> là kiến trúc mô hình sử dụng nhiều mạng
          con chuyên biệt (gọi là &quot;chuyên gia&quot;), nhưng chỉ kích hoạt một vài chuyên gia
          cho mỗi đầu vào. Điều này cho phép mô hình có <strong>rất nhiều tham số</strong>
          (kiến thức rộng) nhưng <strong>chi phí tính toán thấp</strong> (chỉ dùng một phần).
        </p>
        <p>Cấu trúc MoE:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Router/Gating Network:</strong> Mạng nhỏ quyết định chuyên gia nào được kích hoạt cho mỗi token.</li>
          <li><strong>Expert Networks:</strong> Các mạng FFN chuyên biệt, mỗi mạng giỏi một lĩnh vực.</li>
          <li><strong>Top-K Selection:</strong> Thường chỉ chọn 2 trong số hàng chục chuyên gia cho mỗi token.</li>
        </ol>
        <p>
          Ví dụ: <strong>Mixtral 8x7B</strong> có 47B tham số tổng nhưng chỉ kích hoạt 13B
          mỗi lần suy luận. <strong>GPT-4</strong> cũng được cho là sử dụng kiến trúc MoE.
        </p>
      </ExplanationSection>
    </>
  );
}
