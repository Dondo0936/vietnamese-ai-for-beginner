"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "kv-cache",
  title: "KV Cache",
  titleVi: "Bộ nhớ đệm KV",
  description:
    "Kỹ thuật lưu trữ key-value đã tính để tránh tính lại khi sinh token mới, tăng tốc suy luận",
  category: "llm-concepts",
  tags: ["inference", "caching", "key-value"],
  difficulty: "intermediate",
  relatedSlugs: ["self-attention", "inference-optimization", "context-window"],
  vizType: "interactive",
};

const TOKENS = ["Hà", "Nội", "là", "thủ", "đô", "của", "Việt", "Nam"];

export default function KVCacheTopic() {
  const [step, setStep] = useState(3);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang viết một bài luận dài. Mỗi khi viết một từ mới,
          bạn cần <strong>đọc lại toàn bộ bài</strong> từ đầu để quyết định từ tiếp theo.
          Rất lãng phí!
        </p>
        <p>
          KV Cache giống như việc bạn <strong>ghi chú tóm tắt</strong> sau mỗi đoạn.
          Khi viết từ mới, bạn chỉ cần đọc ghi chú (cache) thay vì đọc lại toàn bộ.
          Thời gian tiết kiệm <strong>rất đáng kể</strong> khi bài dài hàng ngàn từ!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-muted">Bước sinh token:</span>
            <input
              type="range"
              min={1}
              max={TOKENS.length}
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              className="w-48"
            />
            <span className="text-sm font-semibold text-foreground">{step}/{TOKENS.length}</span>
          </div>

          <svg viewBox="0 0 600 320" className="w-full max-w-2xl mx-auto">
            {/* Token sequence */}
            <text x={10} y={20} fontSize={12} fill="#64748b">Chuỗi token:</text>
            {TOKENS.slice(0, step).map((token, i) => {
              const x = 10 + i * 68;
              const isNew = i === step - 1;
              return (
                <g key={i}>
                  <rect
                    x={x} y={28}
                    width={62} height={30}
                    fill={isNew ? "#14b8a6" : "#3b82f6"}
                    rx={4} opacity={0.8}
                  />
                  <text x={x + 31} y={48} textAnchor="middle" fontSize={12} fill="white" fontWeight="bold">
                    {token}
                  </text>
                </g>
              );
            })}

            {/* KV Cache visualization */}
            <text x={10} y={90} fontSize={12} fill="#64748b">KV Cache (đã lưu):</text>
            <rect x={10} y={98} width={step > 1 ? (step - 1) * 68 - 6 : 0} height={70} fill="#dbeafe" rx={6} stroke="#93c5fd" strokeDasharray="4 2" />

            {TOKENS.slice(0, step - 1).map((token, i) => {
              const x = 18 + i * 65;
              return (
                <g key={`cache-${i}`}>
                  <rect x={x} y={106} width={55} height={22} fill="#3b82f6" rx={3} opacity={0.5} />
                  <text x={x + 27} y={121} textAnchor="middle" fontSize={9} fill="white">K: {token}</text>
                  <rect x={x} y={134} width={55} height={22} fill="#8b5cf6" rx={3} opacity={0.5} />
                  <text x={x + 27} y={149} textAnchor="middle" fontSize={9} fill="white">V: {token}</text>
                </g>
              );
            })}

            {/* New token computation */}
            <text x={10} y={200} fontSize={12} fill="#64748b">Token mới cần tính:</text>
            <rect x={10} y={208} width={80} height={50} fill="#14b8a6" rx={6} opacity={0.8} />
            <text x={50} y={228} textAnchor="middle" fontSize={10} fill="white">Q: {TOKENS[step - 1]}</text>
            <text x={50} y={245} textAnchor="middle" fontSize={10} fill="white">K: {TOKENS[step - 1]}</text>

            {/* Arrow showing attention */}
            <text x={110} y={238} fontSize={11} fill="#0f172a">→ Attention với cache →</text>

            {/* Result */}
            <rect x={320} y={208} width={260} height={50} fill="#f0fdf4" rx={6} stroke="#86efac" />
            <text x={450} y={230} textAnchor="middle" fontSize={11} fill="#166534">
              Chỉ tính attention cho 1 token mới
            </text>
            <text x={450} y={248} textAnchor="middle" fontSize={10} fill="#166534">
              Dùng lại K,V cũ từ cache
            </text>

            {/* Comparison */}
            <rect x={10} y={280} width={280} height={30} fill="#fee2e2" rx={4} />
            <text x={150} y={300} textAnchor="middle" fontSize={11} fill="#991b1b">
              Không cache: tính lại {step} token × {step} attention = O(N²)
            </text>
            <rect x={310} y={280} width={280} height={30} fill="#dcfce7" rx={4} />
            <text x={450} y={300} textAnchor="middle" fontSize={11} fill="#166534">
              Có cache: chỉ tính 1 token × {step} attention = O(N)
            </text>
          </svg>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>KV Cache</strong> là kỹ thuật tối ưu quan trọng nhất trong suy luận LLM,
          giúp giảm độ phức tạp tính toán từ O(N²) xuống O(N) cho mỗi token mới.
        </p>
        <p>Cách hoạt động:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Bước đầu tiên (prefill):</strong> Tính Q, K, V cho tất cả token trong prompt. Lưu K và V vào cache.</li>
          <li><strong>Các bước tiếp theo (decode):</strong> Chỉ tính Q cho token mới. Dùng lại K, V đã cache. Append K, V mới vào cache.</li>
          <li><strong>Kết quả:</strong> Mỗi bước decode chỉ cần tính attention giữa 1 query mới và N key-value đã lưu, thay vì tính lại toàn bộ N×N.</li>
        </ol>
        <p>Thách thức của KV Cache:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Bộ nhớ:</strong> Cache tăng tuyến tính theo chiều dài chuỗi. Với context 128K token, cache chiếm hàng GB bộ nhớ GPU.</li>
          <li><strong>Giải pháp:</strong> Multi-Query Attention (MQA), Grouped-Query Attention (GQA) chia sẻ K,V giữa nhiều head để giảm kích thước cache.</li>
          <li><strong>PagedAttention:</strong> Quản lý bộ nhớ cache như trang bộ nhớ ảo, giảm lãng phí do phân mảnh.</li>
        </ul>
      </ExplanationSection>
    </>
  );
}
