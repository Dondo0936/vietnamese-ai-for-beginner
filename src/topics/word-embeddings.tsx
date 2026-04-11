"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "word-embeddings",
  title: "Word Embeddings",
  titleVi: "Word Embeddings - Biểu diễn từ dạng vector",
  description:
    "Phương pháp chuyển đổi từ ngữ thành vector số trong không gian nhiều chiều, nắm bắt được quan hệ ngữ nghĩa.",
  category: "nlp",
  tags: ["nlp", "representation-learning", "semantics"],
  difficulty: "intermediate",
  relatedSlugs: ["word2vec", "glove", "bag-of-words"],
  vizType: "interactive",
};

const WORDS = [
  { word: "vua", x: 320, y: 80, color: "#3b82f6" },
  { word: "hoàng hậu", x: 380, y: 120, color: "#ec4899" },
  { word: "hoàng tử", x: 300, y: 140, color: "#3b82f6" },
  { word: "công chúa", x: 360, y: 180, color: "#ec4899" },
  { word: "đàn ông", x: 120, y: 100, color: "#3b82f6" },
  { word: "phụ nữ", x: 180, y: 140, color: "#ec4899" },
  { word: "chó", x: 450, y: 280, color: "#22c55e" },
  { word: "mèo", x: 480, y: 310, color: "#22c55e" },
  { word: "cá", x: 520, y: 340, color: "#22c55e" },
  { word: "xe hơi", x: 80, y: 300, color: "#f59e0b" },
  { word: "xe máy", x: 120, y: 330, color: "#f59e0b" },
  { word: "xe đạp", x: 100, y: 360, color: "#f59e0b" },
];

export default function WordEmbeddingsTopic() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng mỗi từ là một <strong>ngôi nhà trên bản đồ</strong>.
          Những ngôi nhà gần nhau thuộc cùng một khu phố — tương tự như các từ
          có nghĩa giống nhau sẽ <strong>nằm gần nhau</strong> trong không gian
          vector.
        </p>
        <p>
          Ví dụ: &quot;vua&quot; và &quot;hoàng hậu&quot; nằm cùng khu phố &quot;hoàng gia&quot;, còn
          &quot;chó&quot; và &quot;mèo&quot; nằm ở khu phố &quot;động vật&quot;. Khoảng cách giữa
          &quot;vua&quot; và &quot;hoàng hậu&quot; tương tự khoảng cách giữa &quot;đàn ông&quot; và
          &quot;phụ nữ&quot;!
        </p>
        <p>
          Word Embedding biến mỗi từ thành <strong>tọa độ trên bản đồ</strong>{" "}
          để máy tính có thể tính toán quan hệ giữa các từ.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          <p className="text-sm text-muted text-center">
            Di chuột qua các từ để xem vị trí — từ gần nhau có nghĩa tương đồng
          </p>

          <svg viewBox="0 0 600 400" className="w-full max-w-2xl mx-auto">
            {/* Axes */}
            <line x1="30" y1="390" x2="590" y2="390" stroke="#334155" strokeWidth="1" />
            <line x1="30" y1="10" x2="30" y2="390" stroke="#334155" strokeWidth="1" />
            <text x="310" y="410" textAnchor="middle" fill="#64748b" fontSize="11">
              Chiều 1
            </text>
            <text x="10" y="200" textAnchor="middle" fill="#64748b" fontSize="11" transform="rotate(-90,10,200)">
              Chiều 2
            </text>

            {/* Cluster labels */}
            <text x="340" y="60" fill="#475569" fontSize="10" fontStyle="italic">Hoàng gia</text>
            <text x="130" y="80" fill="#475569" fontSize="10" fontStyle="italic">Con người</text>
            <text x="460" y="260" fill="#475569" fontSize="10" fontStyle="italic">Động vật</text>
            <text x="60" y="280" fill="#475569" fontSize="10" fontStyle="italic">Phương tiện</text>

            {/* Words as dots */}
            {WORDS.map((item) => (
              <g
                key={item.word}
                onMouseEnter={() => setHovered(item.word)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={item.x}
                  cy={item.y}
                  r={hovered === item.word ? 8 : 5}
                  fill={item.color}
                  opacity={hovered && hovered !== item.word ? 0.3 : 1}
                />
                <text
                  x={item.x}
                  y={item.y - 12}
                  textAnchor="middle"
                  fill={hovered === item.word ? "#e2e8f0" : "#94a3b8"}
                  fontSize={hovered === item.word ? 13 : 11}
                  fontWeight={hovered === item.word ? "bold" : "normal"}
                >
                  {item.word}
                </text>
              </g>
            ))}

            {/* Analogy arrow: king - man + woman = queen */}
            <defs>
              <marker id="arrowhead-we" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
              </marker>
            </defs>
            <line x1="320" y1="80" x2="375" y2="118" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrowhead-we)" />
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Phép tính nổi tiếng: <strong>vua</strong> - <strong>đàn ông</strong>{" "}
              + <strong>phụ nữ</strong> ≈ <strong className="text-accent">hoàng hậu</strong>
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Word Embeddings</strong> là phương pháp biểu diễn từ ngữ dưới
          dạng vector số thực trong không gian liên tục nhiều chiều (thường
          100-300 chiều). Khác với Bag of Words, phương pháp này nắm bắt được
          quan hệ ngữ nghĩa giữa các từ.
        </p>
        <p>Các đặc điểm quan trọng:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Từ tương tự nằm gần nhau:</strong> Khoảng cách cosine giữa
            các vector phản ánh mức độ tương đồng ngữ nghĩa.
          </li>
          <li>
            <strong>Phép tính vector có ý nghĩa:</strong> Các phép cộng, trừ
            vector thể hiện quan hệ ngữ nghĩa (ví dụ: vua - đàn ông + phụ nữ
            ≈ hoàng hậu).
          </li>
          <li>
            <strong>Học từ dữ liệu:</strong> Embedding được huấn luyện trên
            lượng lớn văn bản, tự động phát hiện các mẫu ngữ nghĩa.
          </li>
        </ol>
        <p>
          Các phương pháp phổ biến gồm <strong>Word2Vec</strong>,{" "}
          <strong>GloVe</strong>, và <strong>FastText</strong>. Word Embeddings
          là nền tảng cho các mô hình NLP hiện đại như BERT và GPT.
        </p>
      </ExplanationSection>
    </>
  );
}
