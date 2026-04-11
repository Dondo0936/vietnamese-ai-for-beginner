"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "self-attention",
  title: "Self-Attention",
  titleVi: "Tự chú ý",
  description: "Cơ chế cho phép mỗi vị trí trong chuỗi chú ý đến mọi vị trí khác",
  category: "dl-architectures",
  tags: ["attention", "transformer", "fundamentals"],
  difficulty: "intermediate",
  relatedSlugs: ["transformer", "multi-head-attention", "positional-encoding"],
  vizType: "interactive",
};

const tokens = ["Con", "mèo", "ngồi", "trên", "bàn"];

const attentionWeights: number[][] = [
  [0.40, 0.25, 0.15, 0.10, 0.10],
  [0.15, 0.35, 0.10, 0.10, 0.30],
  [0.10, 0.30, 0.25, 0.20, 0.15],
  [0.08, 0.12, 0.15, 0.35, 0.30],
  [0.05, 0.35, 0.10, 0.20, 0.30],
];

export default function SelfAttentionTopic() {
  const [selectedToken, setSelectedToken] = useState(1);

  const weights = attentionWeights[selectedToken];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang đọc câu &quot;Con <strong>mèo</strong> ngồi trên
          <strong> bàn</strong>&quot;. Khi bộ não bạn xử lý từ &quot;bàn&quot;, nó tự động
          chú ý nhiều hơn đến &quot;mèo&quot; và &quot;ngồi&quot; (vì chúng liên quan ngữ
          nghĩa), ít chú ý hơn đến &quot;con&quot; hay &quot;trên&quot;.
        </p>
        <p>
          <strong>Self-Attention</strong> mô phỏng điều này: mỗi từ tính <strong>trọng số
          chú ý</strong> với mọi từ khác, rồi kết hợp thông tin theo trọng số đó.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào một từ để xem nó &quot;chú ý&quot; đến các từ khác với trọng số bao nhiêu.
          Đường càng đậm/dày = chú ý càng nhiều.
        </p>
        <svg
          viewBox="0 0 500 280"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Title */}
          <text x={250} y={20} fontSize={12} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
            Attention Heatmap: &quot;{tokens[selectedToken]}&quot; chú ý đến...
          </text>

          {/* Token row (query) */}
          {tokens.map((token, i) => {
            const x = 60 + i * 85;
            const isSelected = i === selectedToken;
            return (
              <g key={`top-${i}`} className="cursor-pointer" onClick={() => setSelectedToken(i)}>
                <rect x={x - 30} y={35} width={60} height={28} rx={8}
                  fill={isSelected ? "#f97316" : "#3b82f6"}
                  opacity={isSelected ? 0.3 : 0.1}
                  stroke={isSelected ? "#f97316" : "#3b82f6"}
                  strokeWidth={isSelected ? 2.5 : 1} />
                <text x={x} y={54} fontSize={13} fill={isSelected ? "#f97316" : "#3b82f6"}
                  textAnchor="middle" fontWeight={isSelected ? 700 : 400}>
                  {token}
                </text>
              </g>
            );
          })}

          {/* Attention bars */}
          {tokens.map((token, i) => {
            const x = 60 + i * 85;
            const w = weights[i];
            const barH = w * 120;
            return (
              <g key={`bar-${i}`}>
                {/* Connection line from selected to this */}
                <line
                  x1={60 + selectedToken * 85} y1={63}
                  x2={x} y2={95}
                  stroke="#f97316"
                  strokeWidth={w * 8}
                  opacity={w * 1.2}
                />
                {/* Bar */}
                <rect x={x - 22} y={100 + (120 - barH)} width={44} height={barH} rx={6}
                  fill="#f97316" opacity={0.2 + w * 0.5} />
                {/* Weight value */}
                <text x={x} y={95 + (120 - barH)} fontSize={11} fill="#f97316"
                  textAnchor="middle" fontWeight={600}>
                  {(w * 100).toFixed(0)}%
                </text>
                {/* Token label below bar */}
                <text x={x} y={235} fontSize={12} fill="currentColor" className="text-foreground"
                  textAnchor="middle">
                  {token}
                </text>
              </g>
            );
          })}

          {/* Formula */}
          <text x={250} y={265} fontSize={10} fill="#8b5cf6" textAnchor="middle" fontWeight={600}>
            Attention(Q, K, V) = softmax(QK&sup1;/&radic;d) &middot; V
          </text>
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Self-Attention</strong> cho phép mỗi vị trí trong chuỗi &quot;hỏi&quot;
          mọi vị trí khác. Mỗi token tạo 3 vector: <strong>Query</strong> (tôi tìm gì?),
          <strong> Key</strong> (tôi chứa gì?), <strong>Value</strong> (nội dung của tôi).
        </p>
        <p>
          Trọng số attention được tính bằng <strong>tích vô hướng</strong> giữa Query và
          Key, chia cho &radic;d (để ổn định gradient), rồi đưa qua <strong>softmax</strong>
          để chuẩn hóa. Output là tổng có trọng số của các Value.
        </p>
        <p>
          Ưu điểm so với RNN: <strong>song song hóa hoàn toàn</strong>, nắm bắt quan hệ
          xa O(1) thay vì O(n). Độ phức tạp: O(n&sup2;) với n là độ dài chuỗi &mdash; đây
          là nút thắt cổ chai cho chuỗi rất dài.
        </p>
      </ExplanationSection>
    </>
  );
}
