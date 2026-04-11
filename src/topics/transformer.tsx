"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "transformer",
  title: "Transformer",
  titleVi: "Kiến trúc Transformer",
  description: "Kiến trúc nền tảng của mọi LLM hiện đại, dùng self-attention thay vì hồi quy",
  category: "dl-architectures",
  tags: ["attention", "nlp", "architecture"],
  difficulty: "intermediate",
  relatedSlugs: ["self-attention", "multi-head-attention", "positional-encoding"],
  vizType: "interactive",
};

const tokens = ["Trí", "tuệ", "nhân", "tạo"];

const layerNames = [
  "Input Embedding",
  "Positional Encoding",
  "Multi-Head Attention",
  "Add & Norm",
  "Feed Forward",
  "Add & Norm",
  "Output",
];

const layerColors = [
  "#3b82f6", "#8b5cf6", "#f97316", "#22c55e", "#ef4444", "#22c55e", "#ec4899",
];

export default function TransformerTopic() {
  const [activeToken, setActiveToken] = useState(0);
  const [activeLayer, setActiveLayer] = useState(-1);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng một <strong>phòng họp</strong> nơi mỗi từ trong câu là một
          người. Thay vì nói lần lượt (như RNN), tất cả mọi người nói <strong>cùng lúc</strong>
          và mỗi người có thể <strong>chú ý</strong> (attend) đến bất kỳ ai khác.
        </p>
        <p>
          Từ &quot;Tôi&quot; có thể hỏi &quot;thích&quot; ở xa: &quot;Bạn liên quan đến tôi
          thế nào?&quot; Đây là <strong>self-attention</strong> &mdash; cốt lõi của
          Transformer, cho phép xử lý <strong>song song</strong> và nắm bắt quan hệ xa.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <p className="mb-3 text-sm text-muted">
          Nhấp vào token để chọn, di chuột vào lớp để xem mô tả. Token đi qua tất cả
          các lớp từ dưới lên trên.
        </p>
        <svg
          viewBox="0 0 500 320"
          className="w-full rounded-lg border border-border bg-background"
        >
          {/* Input tokens */}
          {tokens.map((token, i) => {
            const x = 80 + i * 90;
            const isActive = i === activeToken;
            return (
              <g key={i} className="cursor-pointer" onClick={() => setActiveToken(i)}>
                <rect x={x - 25} y={285} width={50} height={25} rx={6}
                  fill="#3b82f6" opacity={isActive ? 0.3 : 0.1}
                  stroke="#3b82f6" strokeWidth={isActive ? 2.5 : 1} />
                <text x={x} y={302} fontSize={12} fill="#3b82f6" textAnchor="middle" fontWeight={isActive ? 700 : 400}>
                  {token}
                </text>
                {/* Vertical line through layers */}
                <line x1={x} y1={285} x2={x} y2={20}
                  stroke={isActive ? "#f59e0b" : "#666"}
                  strokeWidth={isActive ? 2 : 0.5}
                  opacity={isActive ? 0.6 : 0.15}
                  strokeDasharray={isActive ? "0" : "3 3"} />
              </g>
            );
          })}

          {/* Layers */}
          {layerNames.map((name, li) => {
            const y = 255 - li * 36;
            const isActive = li === activeLayer;
            return (
              <g
                key={li}
                className="cursor-pointer"
                onMouseEnter={() => setActiveLayer(li)}
                onMouseLeave={() => setActiveLayer(-1)}
              >
                <rect x={350} y={y - 12} width={140} height={24} rx={6}
                  fill={layerColors[li]} opacity={isActive ? 0.25 : 0.1}
                  stroke={layerColors[li]} strokeWidth={isActive ? 2 : 1} />
                <text x={420} y={y + 4} fontSize={10} fill={layerColors[li]} textAnchor="middle" fontWeight={600}>
                  {name}
                </text>

                {/* Horizontal line connecting tokens at this layer */}
                <line x1={55} y1={y} x2={345} y2={y}
                  stroke={layerColors[li]} strokeWidth={0.5} opacity={0.2} />
              </g>
            );
          })}

          {/* Attention connections for active token at MHA layer */}
          {tokens.map((_, i) => {
            if (i === activeToken) return null;
            const x1 = 80 + activeToken * 90;
            const x2 = 80 + i * 90;
            const y = 255 - 2 * 36;
            const opacity = 0.15 + Math.random() * 0.3;
            return (
              <line key={`att-${i}`}
                x1={x1} y1={y} x2={x2} y2={y}
                stroke="#f97316" strokeWidth={2 + opacity * 3}
                opacity={opacity} />
            );
          })}
        </svg>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Transformer</strong> (2017) là kiến trúc cách mạng đã thay thế RNN/LSTM.
          Ý tưởng chính: dùng <strong>self-attention</strong> để mỗi token &quot;nhìn&quot;
          mọi token khác <strong>song song</strong>, không cần xử lý tuần tự.
        </p>
        <p>
          Cấu trúc gồm: <strong>Input Embedding</strong> + <strong>Positional Encoding</strong>
          (thêm thông tin vị trí), rồi xếp chồng N lớp, mỗi lớp có <strong>Multi-Head
          Attention</strong> + <strong>Feed-Forward Network</strong> + <strong>Residual
          Connection</strong> + <strong>Layer Norm</strong>.
        </p>
        <p>
          Transformer là nền tảng của: <strong>GPT</strong> (decoder-only), <strong>BERT</strong>
          (encoder-only), <strong>T5</strong> (encoder-decoder). Ngoài NLP, còn dùng cho
          vision (ViT), protein (AlphaFold), âm thanh (Whisper), và multi-modal.
        </p>
      </ExplanationSection>
    </>
  );
}
