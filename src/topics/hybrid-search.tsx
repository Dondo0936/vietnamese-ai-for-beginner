"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
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

/* ── data ─────────────────────────────────────────────────── */
interface SearchResult { doc: string; bm25Score: number; semanticScore: number }

const RESULTS: SearchResult[] = [
  { doc: "Luật lao động Việt Nam 2025 quy định quyền người lao động", bm25Score: 0.9, semanticScore: 0.7 },
  { doc: "Quyền lợi và nghĩa vụ của người đi làm theo pháp luật", bm25Score: 0.2, semanticScore: 0.95 },
  { doc: "Bộ luật lao động sửa đổi bổ sung các điều khoản mới", bm25Score: 0.8, semanticScore: 0.5 },
  { doc: "Bảo vệ sức khoẻ tinh thần người đi làm tại doanh nghiệp", bm25Score: 0.1, semanticScore: 0.85 },
  { doc: "Hợp đồng lao động và các loại hợp đồng phổ biến", bm25Score: 0.6, semanticScore: 0.6 },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao Hybrid Search tốt hơn dùng riêng BM25 hoặc Semantic Search?",
    options: [
      "Hybrid Search nhanh hơn cả 2",
      "BM25 giỏi exact match, Semantic giỏi ngữ nghĩa -- kết hợp bổ sung điểm yếu của nhau",
      "Hybrid Search không cần embedding model",
      "Hybrid Search tự động chọn phương pháp tốt hơn",
    ],
    correct: 1,
    explanation: "BM25 tìm 'luật lao động' (exact match). Semantic tìm 'quyền lợi người đi làm' (đồng nghĩa). Hybrid kết hợp cả 2 -> không bỏ lỡ kết quả nào!",
  },
  {
    question: "Reciprocal Rank Fusion (RRF) hoạt động thế nào?",
    options: [
      "Cộng trực tiếp điểm BM25 và semantic",
      "Dùng thứ hạng (rank) thay vì điểm số: RRF = 1/(k+rank). Kết hợp rank từ nhiều nguồn",
      "Chỉ lấy kết quả xuất hiện ở cả 2 nguồn",
      "Lấy kết quả từ nguồn có điểm cao hơn",
    ],
    correct: 1,
    explanation: "RRF dùng RANK không dùng SCORE: RRF_score = sum(1/(k + rank_i)). Lợi thế: không cần normalize score giữa 2 nguồn khác nhau. k=60 là mặc định phổ biến.",
  },
  {
    question: "Khi nào nên tăng trọng số alpha về phía BM25 (giảm semantic)?",
    options: [
      "Khi người dùng tìm thông tin chung chung",
      "Khi query chứa tên riêng, mã số, thuật ngữ chuyên ngành cần khớp chính xác",
      "Khi database có ít tài liệu",
      "Khi embedding model chưa được huấn luyện",
    ],
    correct: 1,
    explanation: "Tìm 'Điều 128 Bộ luật Lao động': BM25 khớp chính xác 'Điều 128'. Semantic có thể trả về điều khoản khác có nghĩa tương tự. Tăng BM25 weight khi cần exact match!",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function HybridSearchTopic() {
  const [alpha, setAlpha] = useState(0.5);

  const ranked = useMemo(() => {
    return [...RESULTS]
      .map((r) => ({ ...r, hybridScore: alpha * r.semanticScore + (1 - alpha) * r.bm25Score }))
      .sort((a, b) => b.hybridScore - a.hybridScore);
  }, [alpha]);

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Tìm 'quyền người lao động' trên chatbot pháp luật. BM25 tìm được bài có đúng từ 'lao động'. Semantic tìm được bài về 'quyền lợi người đi làm' (đồng nghĩa). Lấy kết quả từ đâu?"
          options={[
            "Chỉ BM25 vì chính xác hơn",
            "Chỉ Semantic vì hiểu ngữ nghĩa",
            "KẾT HỢP cả 2 -- BM25 cho exact match, Semantic cho đồng nghĩa",
          ]}
          correct={2}
          explanation="Hybrid Search kết hợp sức mạnh cả 2: BM25 không bỏ lỡ exact match, Semantic không bỏ lỡ đồng nghĩa. Kết quả: coverage rộng nhất, ranking tốt nhất!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">
                Trọng số alpha = {alpha.toFixed(2)} (0 = chỉ BM25, 1 = chỉ Semantic)
              </label>
              <input type="range" min="0" max="1" step="0.05" value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))} className="w-full accent-accent" />
              <div className="flex justify-between text-xs text-muted">
                <span>BM25 (Từ khoá)</span>
                <span>Semantic (Ngữ nghĩa)</span>
              </div>
            </div>

            <svg viewBox="0 0 600 290" className="w-full max-w-2xl mx-auto">
              <text x="300" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="bold">
                Xếp hạng kết hợp (Query: quyền người lao động)
              </text>
              {ranked.map((r, i) => {
                const y = 35 + i * 50;
                const barWidth = r.hybridScore * 280;
                const bm25Width = r.bm25Score * 280;
                const semWidth = r.semanticScore * 280;
                return (
                  <g key={i}>
                    <text x="10" y={y + 12} fill="#e2e8f0" fontSize="9">
                      {i + 1}. {r.doc.length > 50 ? r.doc.slice(0, 50) + "..." : r.doc}
                    </text>
                    <rect x="10" y={y + 17} width={bm25Width} height="5" rx="2" fill="#ef4444" opacity={0.4} />
                    <rect x="10" y={y + 24} width={semWidth} height="5" rx="2" fill="#3b82f6" opacity={0.4} />
                    <rect x="10" y={y + 31} width={barWidth} height="7" rx="3" fill="#22c55e" />
                    <text x={barWidth + 18} y={y + 39} fill="#22c55e" fontSize="9" fontWeight="bold">
                      {r.hybridScore.toFixed(2)}
                    </text>
                  </g>
                );
              })}
              <rect x="350" y="272" width="10" height="5" rx="2" fill="#ef4444" opacity={0.6} />
              <text x="365" y="278" fill="#94a3b8" fontSize="8">BM25</text>
              <rect x="420" y="272" width="10" height="5" rx="2" fill="#3b82f6" opacity={0.6} />
              <text x="435" y="278" fill="#94a3b8" fontSize="8">Semantic</text>
              <rect x="500" y="271" width="10" height="7" rx="2" fill="#22c55e" />
              <text x="515" y="279" fill="#94a3b8" fontSize="8">Hybrid</text>
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                <strong className="text-foreground">hybrid = {alpha.toFixed(2)} x semantic + {(1 - alpha).toFixed(2)} x BM25</strong>
              </p>
              <p className="text-xs text-muted mt-1">
                Kéo thanh trượt: alpha = 0 chỉ dùng BM25, alpha = 1 chỉ dùng Semantic.
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Hybrid Search giống <strong>hỏi 2 chuyên gia</strong>: chuyên gia A (BM25) đọc chính xác từng chữ,
            chuyên gia B (Semantic) hiểu ý nghĩa sâu xa. Kết hợp ý kiến cả 2 bằng trọng số alpha.
            <strong>{" "}Đây là tiêu chuẩn trong mọi hệ thống RAG hiện đại!</strong>
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="BM25 cho score 0-10, Semantic cho score 0-1. Cộng trực tiếp thì BM25 luôn thắng vì scale lớn hơn. Cách nào công bằng?"
          options={[
            "Chia BM25 cho 10 để cùng scale",
            "Dùng Reciprocal Rank Fusion (RRF): kết hợp theo RANK (thứ hạng) thay vì score (điểm số)",
            "Chỉ dùng Semantic vì score đẹp hơn",
          ]}
          correct={1}
          explanation="RRF: RRF_score = 1/(k + rank_bm25) + 1/(k + rank_semantic). Dùng thứ hạng thay vì điểm số -> không cần normalize. Đơn giản, robust, hiệu quả. k=60 là mặc định phổ biến."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Hybrid Search</strong>{" "}kết hợp sức mạnh của BM25 (exact match) và Semantic Search
            (understanding) để đạt kết quả tốt nhất.
          </p>

          <p><strong>Convex Combination (trộn theo trọng số):</strong></p>
          <LaTeX block>{"\\text{score}_{hybrid} = \\alpha \\cdot \\text{score}_{semantic} + (1 - \\alpha) \\cdot \\text{score}_{BM25}"}</LaTeX>

          <p><strong>Reciprocal Rank Fusion (RRF):</strong></p>
          <LaTeX block>{"\\text{RRF}(d) = \\sum_{r \\in R} \\frac{1}{k + r(d)}"}</LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"r(d)"}</LaTeX> = thứ hạng tài liệu d trong danh sách r. k = 60 (constant). Dùng rank thay vì score -> không cần normalize.
          </p>

          <Callout variant="insight" title="3 cách kết hợp phổ biến">
            <div className="space-y-2 text-sm">
              <p><strong>Convex Combination:</strong>{" "}alpha x semantic + (1-alpha) x BM25. Cần normalize score.</p>
              <p><strong>RRF:</strong>{" "}Dùng rank, không cần normalize. Robust, đơn giản. Mặc định trong nhiều system.</p>
              <p><strong>Learned Fusion:</strong>{" "}Huấn luyện mô hình nhỏ để học trọng số tối ưu từ dữ liệu. Tốt nhất nhưng cần labeled data.</p>
            </div>
          </Callout>

          <Callout variant="warning" title="Hybrid Search trong hệ sinh thái">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Elasticsearch 8+:</strong>{" "}knn + query = hybrid search built-in</li>
              <li><strong>Weaviate:</strong>{" "}Hybrid search với BM25 + vector search, alpha tuning</li>
              <li><strong>Pinecone:</strong>{" "}Sparse-dense vectors cho hybrid</li>
              <li><strong>Qdrant:</strong>{" "}Fusion + re-ranking trong 1 query</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Hybrid Search với Weaviate">
{`import weaviate

client = weaviate.connect_to_local()
collection = client.collections.get("VnExpressArticles")

# Hybrid Search: BM25 + Vector, alpha = 0.5
response = collection.query.hybrid(
    query="quyền người lao động Việt Nam",
    alpha=0.5,  # 0 = BM25 only, 1 = vector only
    limit=5,
    return_metadata=weaviate.classes.query.MetadataQuery(
        score=True, explain_score=True
    ),
)

for obj in response.objects:
    print(f"Score: {obj.metadata.score:.3f}")
    print(f"  {obj.properties['title']}")
    print(f"  Explain: {obj.metadata.explain_score}")

# RRF thủ công
def rrf_fusion(bm25_results, semantic_results, k=60):
    scores = {}
    for rank, doc_id in enumerate(bm25_results):
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    for rank, doc_id in enumerate(semantic_results):
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    return sorted(scores.items(), key=lambda x: -x[1])`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Hybrid Search = BM25 (exact match) + Semantic (ngữ nghĩa): bổ sung điểm yếu của nhau",
          "Convex Combination: alpha x semantic + (1-alpha) x BM25. RRF: dùng rank, không cần normalize",
          "alpha gần 0 = thiên BM25 (exact match). alpha gần 1 = thiên semantic (ngữ nghĩa)",
          "Tiêu chuẩn trong RAG hiện đại. Weaviate, Elasticsearch 8+, Pinecone đều hỗ trợ built-in",
        ]} />
      </LessonSection>

      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
