"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "clip",
  title: "CLIP",
  titleVi: "CLIP — Kết nối hình ảnh và ngôn ngữ",
  description:
    "Mô hình học cách liên kết hình ảnh và văn bản trong cùng một không gian vector, cho phép tìm kiếm ảnh bằng ngôn ngữ tự nhiên.",
  category: "multimodal",
  tags: ["clip", "contrastive-learning", "image-text", "embedding"],
  difficulty: "intermediate",
  relatedSlugs: ["vlm", "text-to-image", "unified-multimodal"],
  vizType: "interactive",
};

const PAIRS = [
  { image: "Ảnh chú mèo", text: "Một chú mèo dễ thương", score: 0.92 },
  { image: "Ảnh chú mèo", text: "Chiếc xe thể thao", score: 0.08 },
  { image: "Ảnh bãi biển", text: "Biển xanh cát trắng", score: 0.88 },
  { image: "Ảnh bãi biển", text: "Thành phố về đêm", score: 0.12 },
];

export default function CLIPTopic() {
  const [selectedPair, setSelectedPair] = useState(0);
  const pair = PAIRS[selectedPair];

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn chơi trò <strong>&quot;ghép đôi&quot;</strong> ở trường mẫu giáo.
          Bạn có một bên là <strong>các bức ảnh</strong> (mèo, chó, xe, hoa...) và bên kia
          là <strong>các thẻ mô tả</strong> (&quot;động vật dễ thương&quot;, &quot;phương tiện giao thông&quot;...).
        </p>
        <p>
          CLIP học cách ghép đôi bằng cách xem <strong>hàng triệu cặp ảnh-mô tả</strong>
          trên internet, từ đó hiểu rằng ảnh chú mèo nên &quot;gần&quot; với mô tả
          &quot;động vật dễ thương&quot; và &quot;xa&quot; mô tả &quot;phương tiện giao thông&quot;
          trong không gian ý nghĩa.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PAIRS.map((p, i) => (
              <button
                key={i}
                onClick={() => setSelectedPair(i)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  selectedPair === i
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {p.image} + &quot;{p.text}&quot;
              </button>
            ))}
          </div>
          <svg viewBox="0 0 600 220" className="w-full max-w-2xl mx-auto">
            {/* Image encoder */}
            <rect x={30} y={50} width={130} height={50} rx={10} fill="#3b82f6" />
            <text x={95} y={70} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Bộ mã hoá ảnh</text>
            <text x={95} y={86} textAnchor="middle" fill="#bfdbfe" fontSize={9}>{pair.image}</text>

            {/* Text encoder */}
            <rect x={30} y={130} width={130} height={50} rx={10} fill="#22c55e" />
            <text x={95} y={150} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Bộ mã hoá văn bản</text>
            <text x={95} y={166} textAnchor="middle" fill="#bbf7d0" fontSize={8}>&quot;{pair.text}&quot;</text>

            {/* Arrows to embedding space */}
            <line x1={160} y1={75} x2={280} y2={115} stroke="#3b82f6" strokeWidth={2} />
            <line x1={160} y1={155} x2={280} y2={115} stroke="#22c55e" strokeWidth={2} />

            {/* Shared space */}
            <circle cx={350} cy={115} r={60} fill="none" stroke="#475569" strokeWidth={2} strokeDasharray="6,3" />
            <text x={350} y={90} textAnchor="middle" fill="#94a3b8" fontSize={9}>Không gian chung</text>

            {/* Similarity score */}
            <rect x={450} y={90} width={120} height={50} rx={10} fill={pair.score > 0.5 ? "#22c55e" : "#ef4444"} />
            <text x={510} y={112} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">Độ tương đồng</text>
            <text x={510} y={130} textAnchor="middle" fill="white" fontSize={16} fontWeight="bold">
              {(pair.score * 100).toFixed(0)}%
            </text>
          </svg>
          <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
            <p className="text-sm text-muted">
              {pair.score > 0.5
                ? "Ảnh và mô tả có ý nghĩa tương đồng cao — CLIP đặt chúng gần nhau!"
                : "Ảnh và mô tả không liên quan — CLIP đặt chúng xa nhau!"}
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>CLIP</strong> (Contrastive Language-Image Pre-training) là mô hình của OpenAI
          học cách liên kết hình ảnh và văn bản trong cùng một không gian vector thông qua
          <strong> học tương phản</strong> (contrastive learning).
        </p>
        <p>CLIP hoạt động theo nguyên lý:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li><strong>Mã hoá song song:</strong> Ảnh qua Vision Transformer, văn bản qua Text Transformer.</li>
          <li><strong>Chiếu vào không gian chung:</strong> Cả hai vector được chiếu vào cùng một không gian.</li>
          <li><strong>Học tương phản:</strong> Kéo cặp ảnh-mô tả đúng lại gần, đẩy cặp sai ra xa.</li>
        </ol>
        <p>
          CLIP là nền tảng cho nhiều ứng dụng: <strong>tìm kiếm ảnh bằng văn bản</strong>,
          <strong> phân loại zero-shot</strong>, và là thành phần cốt lõi của
          <strong> Stable Diffusion</strong> và các mô hình text-to-image khác.
        </p>
      </ExplanationSection>
    </>
  );
}
