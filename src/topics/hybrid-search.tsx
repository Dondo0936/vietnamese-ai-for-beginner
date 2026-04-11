"use client";

import { useState, useMemo } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "hybrid-search",
  title: "Hybrid Search",
  titleVi: "Tìm kiếm kết hợp",
  description:
    "Kết hợp tìm kiếm từ khóa (BM25) và ngữ nghĩa (vector) để đạt kết quả tốt nhất.",
  category: "search-retrieval",
  tags: ["hybrid", "search", "bm25", "semantic"],
  difficulty: "intermediate",
  relatedSlugs: ["bm25", "semantic-search", "re-ranking"],
  vizType: "interactive",
};

interface SearchResult {
  doc: string;
  bm25Score: number;
  semanticScore: number;
}

const RESULTS: SearchResult[] = [
  { doc: "Hướng dẫn huấn luyện chó con", bm25Score: 0.9, semanticScore: 0.7 },
  { doc: "Cách chăm sóc thú cưng tại nhà", bm25Score: 0.2, semanticScore: 0.95 },
  { doc: "Chó Golden Retriever giá bao nhiêu", bm25Score: 0.8, semanticScore: 0.5 },
  { doc: "Bí quyết nuôi mèo khỏe mạnh", bm25Score: 0.1, semanticScore: 0.85 },
  { doc: "Thú cưng và sức khỏe tinh thần", bm25Score: 0.3, semanticScore: 0.6 },
];

export default function HybridSearchTopic() {
  const [alpha, setAlpha] = useState(0.5);

  const ranked = useMemo(() => {
    return [...RESULTS]
      .map((r) => ({
        ...r,
        hybridScore: alpha * r.semanticScore + (1 - alpha) * r.bm25Score,
      }))
      .sort((a, b) => b.hybridScore - a.hybridScore);
  }, [alpha]);

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn đang tìm nhà hàng ngon. Bạn có hai nguồn đánh giá:
        </p>
        <p>
          <strong>Bạn A</strong> chỉ xem tên món trong thực đơn (giống <strong>BM25</strong>
          &mdash; tìm từ khóa). <strong>Bạn B</strong> đã ăn thử và hiểu phong cách nấu
          (giống <strong>Semantic Search</strong> &mdash; hiểu ý nghĩa).
        </p>
        <p>
          Hybrid Search giống như bạn <strong>kết hợp ý kiến cả hai</strong>: vừa xem
          thực đơn khớp không, vừa nghe đánh giá phong cách. Bạn điều chỉnh{" "}
          <strong>mức tin tưởng</strong> mỗi người qua thanh trượt &alpha;!
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {/* Alpha slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">
              Trọng số &alpha; = {alpha.toFixed(2)} &nbsp;
              <span className="text-xs">
                (0 = chỉ BM25, 1 = chỉ Semantic)
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>BM25 (Từ khóa)</span>
              <span>Semantic (Ngữ nghĩa)</span>
            </div>
          </div>

          {/* Visual bars */}
          <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
            <text x="300" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="bold">
              Xếp hạng kết hợp (Hybrid Score)
            </text>

            {ranked.map((r, i) => {
              const y = 40 + i * 52;
              const barWidth = r.hybridScore * 280;
              const bm25Width = r.bm25Score * 280;
              const semWidth = r.semanticScore * 280;
              return (
                <g key={i}>
                  {/* Doc label */}
                  <text x="10" y={y + 15} fill="#e2e8f0" fontSize="10">
                    {i + 1}. {r.doc}
                  </text>
                  {/* BM25 bar */}
                  <rect x="10" y={y + 22} width={bm25Width} height="6" rx="3" fill="#ef4444" opacity={0.4} />
                  {/* Semantic bar */}
                  <rect x="10" y={y + 30} width={semWidth} height="6" rx="3" fill="#3b82f6" opacity={0.4} />
                  {/* Hybrid bar */}
                  <rect x="10" y={y + 38} width={barWidth} height="8" rx="4" fill="#22c55e" />
                  {/* Score */}
                  <text x={barWidth + 18} y={y + 47} fill="#22c55e" fontSize="9" fontWeight="bold">
                    {r.hybridScore.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            <rect x="400" y="280" width="10" height="6" rx="2" fill="#ef4444" opacity={0.6} />
            <text x="415" y="286" fill="#94a3b8" fontSize="8">BM25</text>
            <rect x="460" y="280" width="10" height="6" rx="2" fill="#3b82f6" opacity={0.6} />
            <text x="475" y="286" fill="#94a3b8" fontSize="8">Semantic</text>
            <rect x="530" y="280" width="10" height="8" rx="2" fill="#22c55e" />
            <text x="545" y="288" fill="#94a3b8" fontSize="8">Hybrid</text>
          </svg>

          <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
            <p className="text-sm text-muted">
              Công thức: <strong className="text-foreground">hybrid = &alpha; &times; semantic + (1 - &alpha;) &times; BM25</strong>
            </p>
            <p className="text-xs text-muted mt-1">
              Khi &alpha; = {alpha.toFixed(2)}: trọng số semantic = {(alpha * 100).toFixed(0)}%, BM25 = {((1 - alpha) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Hybrid Search</strong> kết hợp sức mạnh của cả hai phương pháp tìm kiếm:
          tìm kiếm từ khóa (BM25) và tìm kiếm ngữ nghĩa (Semantic Search).
        </p>
        <p>Tại sao cần kết hợp?</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>BM25 giỏi:</strong> Tìm chính xác tên riêng, mã sản phẩm, thuật ngữ
            chuyên ngành &mdash; những thứ cần khớp đúng từ.
          </li>
          <li>
            <strong>Semantic Search giỏi:</strong> Hiểu ngữ cảnh, đồng nghĩa, và ý định
            người dùng dù dùng từ khác nhau.
          </li>
          <li>
            <strong>Kết hợp:</strong> Sử dụng trọng số &alpha; để cân bằng hai nguồn điểm.
            Tùy bài toán mà điều chỉnh &alpha; cho phù hợp.
          </li>
        </ol>
        <p>
          Các kỹ thuật kết hợp phổ biến bao gồm <strong>Reciprocal Rank Fusion (RRF)</strong>,{" "}
          <strong>Convex Combination</strong> và <strong>Learned Fusion</strong>. Hybrid Search
          là tiêu chuẩn trong các hệ thống RAG hiện đại.
        </p>
      </ExplanationSection>
    </>
  );
}
