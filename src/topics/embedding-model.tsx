"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "embedding-model",
  title: "Embedding Model",
  titleVi: "Mô hình nhúng văn bản",
  description:
    "Mô hình chuyển văn bản thành vector số học, cho phép máy tính hiểu và so sánh ý nghĩa ngữ nghĩa.",
  category: "llm-concepts",
  tags: ["embedding", "vector", "nlp", "representation"],
  difficulty: "intermediate",
  relatedSlugs: ["vector-databases", "semantic-search", "self-attention"],
  vizType: "interactive",
};

const EXAMPLES = [
  { text: "Tôi thích ăn phở", vector: [0.82, 0.15, 0.03], category: "Ẩm thực" },
  { text: "Bún bò Huế rất ngon", vector: [0.78, 0.20, 0.02], category: "Ẩm thực" },
  { text: "Mèo thích ngủ", vector: [0.10, 0.85, 0.05], category: "Động vật" },
  { text: "Chó là bạn thân", vector: [0.12, 0.82, 0.06], category: "Động vật" },
  { text: "Python dễ học", vector: [0.05, 0.08, 0.87], category: "Công nghệ" },
  { text: "JavaScript phổ biến", vector: [0.07, 0.06, 0.87], category: "Công nghệ" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Ẩm thực": "#ef4444",
  "Động vật": "#3b82f6",
  "Công nghệ": "#22c55e",
};

export default function EmbeddingModelTopic() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [inputText, setInputText] = useState("Tôi thích ăn phở");

  const selectedExample = EXAMPLES[selectedIdx];

  // Simple similarity calculation
  const similarities = EXAMPLES.map((ex, i) => {
    if (i === selectedIdx) return { idx: i, sim: 1.0 };
    const dot = ex.vector.reduce((sum, v, j) => sum + v * selectedExample.vector[j], 0);
    const magA = Math.sqrt(ex.vector.reduce((sum, v) => sum + v * v, 0));
    const magB = Math.sqrt(selectedExample.vector.reduce((sum, v) => sum + v * v, 0));
    return { idx: i, sim: dot / (magA * magB) };
  }).sort((a, b) => b.sim - a.sim);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn là <strong>nhân viên thư viện</strong> cần phân loại sách.
          Bạn không đọc từng từ, mà gán cho mỗi cuốn sách một{" "}
          <strong>tọa độ trong không gian 3D</strong>:
        </p>
        <p>
          Trục X = &quot;mức độ liên quan đến ẩm thực&quot;, trục Y = &quot;liên quan
          đến động vật&quot;, trục Z = &quot;liên quan đến công nghệ&quot;. Sách về phở
          sẽ có X cao, sách về mèo có Y cao.
        </p>
        <p>
          Mô hình nhúng làm điều tương tự: chuyển văn bản thành <strong>vector tọa độ</strong>,
          nơi các văn bản cùng chủ đề nằm gần nhau trong không gian!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Chọn văn bản để nhúng:</label>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedIdx(i); setInputText(ex.text); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedIdx === i
                      ? "text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={selectedIdx === i ? { backgroundColor: CATEGORY_COLORS[ex.category] } : {}}
                >
                  {ex.text}
                </button>
              ))}
            </div>
          </div>

          {/* Transformation visualization */}
          <svg viewBox="0 0 700 200" className="w-full max-w-3xl mx-auto">
            {/* Input text */}
            <rect x="20" y="60" width="200" height="80" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <text x="120" y="85" textAnchor="middle" fill="#94a3b8" fontSize="9">Văn bản đầu vào</text>
            <text x="120" y="108" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">
              &quot;{inputText.slice(0, 20)}&quot;
            </text>
            <text x="120" y="128" textAnchor="middle" fill="#64748b" fontSize="8">
              (Ngôn ngữ con người)
            </text>

            {/* Arrow */}
            <line x1="220" y1="100" x2="280" y2="100" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow-emb)" />

            {/* Embedding model */}
            <rect x="280" y="50" width="140" height="100" rx="12" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
            <text x="350" y="85" textAnchor="middle" fill="#8b5cf6" fontSize="10" fontWeight="bold">
              Mô hình nhúng
            </text>
            <text x="350" y="102" textAnchor="middle" fill="#64748b" fontSize="8">
              Embedding Model
            </text>
            <text x="350" y="120" textAnchor="middle" fill="#a78bfa" fontSize="8">
              (Transformer)
            </text>

            {/* Arrow */}
            <line x1="420" y1="100" x2="480" y2="100" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow-emb)" />

            {/* Output vector */}
            <rect x="480" y="50" width="200" height="100" rx="10" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
            <text x="580" y="75" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold">
              Vector nhúng
            </text>
            <text x="580" y="100" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontFamily="monospace">
              [{selectedExample.vector.join(", ")}]
            </text>
            <text x="580" y="120" textAnchor="middle" fill="#64748b" fontSize="8">
              (Ngôn ngữ máy tính)
            </text>
            <text x="580" y="138" textAnchor="middle" fill={CATEGORY_COLORS[selectedExample.category]} fontSize="8">
              Nhóm: {selectedExample.category}
            </text>

            <defs>
              <marker id="arrow-emb" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
              </marker>
            </defs>
          </svg>

          {/* Similarity results */}
          <div className="rounded-lg bg-background/50 border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Độ tương tự cosine với &quot;{selectedExample.text}&quot;:
            </p>
            {similarities.map((s) => {
              const ex = EXAMPLES[s.idx];
              return (
                <div key={s.idx} className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[ex.category] }} />
                  <span className="text-xs text-muted flex-1">{ex.text}</span>
                  <div className="w-24 h-2 rounded-full bg-card overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.sim * 100}%`, backgroundColor: CATEGORY_COLORS[ex.category] }} />
                  </div>
                  <span className="text-xs font-mono text-muted w-12 text-right">
                    {s.sim.toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Mô hình nhúng</strong> (Embedding Model) chuyển đổi văn bản thành
          vector số học trong không gian nhiều chiều, sao cho các văn bản có ý nghĩa
          tương tự nằm gần nhau.
        </p>
        <p>Cách embedding hoạt động:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Tokenization:</strong> Văn bản được chia thành các token (từ hoặc subword).
          </li>
          <li>
            <strong>Mã hóa:</strong> Transformer xử lý chuỗi token và tạo ra biểu diễn
            vector cho từng token.
          </li>
          <li>
            <strong>Gộp (Pooling):</strong> Các vector token được gộp lại (trung bình hoặc
            CLS token) thành một vector duy nhất cho cả câu.
          </li>
        </ol>
        <p>
          Các mô hình nhúng phổ biến: <strong>OpenAI text-embedding-3</strong>,{" "}
          <strong>Cohere Embed v3</strong>, <strong>BGE</strong>,{" "}
          <strong>E5</strong>. Embedding là nền tảng cho tìm kiếm ngữ nghĩa,
          phân loại văn bản và hệ thống RAG.
        </p>
      </ExplanationSection>
    </>
  );
}
