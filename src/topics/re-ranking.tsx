"use client";

import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "re-ranking",
  title: "Re-ranking",
  titleVi: "Re-ranking - Xếp hạng lại kết quả",
  description:
    "Giai đoạn thứ hai trong pipeline tìm kiếm, sử dụng mô hình mạnh hơn để xếp hạng lại kết quả ban đầu.",
  category: "search-retrieval",
  tags: ["re-ranking", "cross-encoder", "retrieval", "pipeline"],
  difficulty: "intermediate",
  relatedSlugs: ["semantic-search", "hybrid-search", "rag"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao không dùng Cross-Encoder cho toàn bộ 10 triệu tài liệu?",
    options: [
      "Cross-Encoder không chính xác cho tập lớn",
      "Cross-Encoder xử lý 1 cặp (query, doc) mỗi lần -- 10M cặp quá chậm (hàng giờ)",
      "Cross-Encoder chỉ hoạt động với tiếng Anh",
      "Cross-Encoder cần GPU đắt tiền",
    ],
    correct: 1,
    explanation: "Cross-Encoder: O(N) -- mỗi tài liệu cần 1 forward pass qua Transformer. 10M docs x 10ms = 28 giờ! Nên chỉ dùng cho top-100 từ stage 1: 100 x 10ms = 1 giây.",
  },
  {
    question: "Re-ranking có thể thay đổi thứ tự kết quả từ stage 1 thế nào?",
    options: [
      "Chỉ loại bỏ kết quả, không thay đổi thứ tự",
      "Doc xếp hạng 5 ở stage 1 có thể lên hạng 1 sau re-ranking vì Cross-Encoder chính xác hơn",
      "Thứ tự luôn giữ nguyên",
      "Re-ranking chỉ thêm kết quả mới",
    ],
    correct: 1,
    explanation: "Bi-Encoder (stage 1) encode riêng query và doc → bỏ lỡ sự tương tác chi tiết. Cross-Encoder encode CÙNG LÚC → nắm bắt sự liên quan chính xác hơn. Thứ tự có thể thay đổi hoàn toàn!",
  },
  {
    question: "Cohere Rerank API nhận input gì và trả output gì?",
    options: [
      "Input: vector embedding. Output: vector mới",
      "Input: query + danh sách documents. Output: relevance score cho mỗi document",
      "Input: 1 document. Output: summary",
      "Input: 2 queries. Output: similarity score",
    ],
    correct: 1,
    explanation: "Rerank API nhận (query, [doc1, doc2, ...]) và trả relevance score cho mỗi doc. Đơn giản: 1 API call, không cần quản lý model. Sort theo score giảm dần = kết quả re-ranked!",
  },
  {
    type: "fill-blank",
    question: "Kiến trúc dùng cho re-ranking là {blank}, encode query và doc cùng lúc. Vì tốn kém, nó chỉ chấm {blank} tài liệu do stage 1 trả về (thường 50-100) thay vì cả corpus.",
    blanks: [
      { answer: "cross-encoder", accept: ["cross encoder", "CrossEncoder", "cross-encoder Transformer"] },
      { answer: "top-k", accept: ["top k", "top-K", "top K", "top-n", "top n"] },
    ],
    explanation: "Cross-encoder đưa [CLS] q [SEP] d [SEP] qua Transformer, nắm bắt tương tác chi tiết giữa query và document nên chính xác hơn bi-encoder. Nhưng O(N) per query, vì vậy chỉ chạy trên top-K (50-100) từ stage 1 để giữ độ trễ dưới 1 giây.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function ReRankingTopic() {
  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Chatbot pháp luật tìm 'quyền lao động'. Stage 1 (BM25 + Semantic) trả về 50 tài liệu. Nhưng tài liệu xếp hạng 1 chứa 'lao động' nhiều lần mà không thực sự trả lời câu hỏi. Cần làm gì?"
          options={[
            "Thay đổi query thành câu dài hơn",
            "Dùng mô hình mạnh hơn (Cross-Encoder) để đánh giá lại 50 tài liệu và xếp hạng lại",
            "Bỏ BM25, chỉ dùng Semantic",
          ]}
          correct={1}
          explanation="Re-ranking! Cross-Encoder xem xét CHI TIẾT sự tương tác giữa query và mỗi doc (không phải so sánh vector). Tài liệu thực sự trả lời câu hỏi sẽ lên hạng 1!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <svg viewBox="0 0 700 320" className="w-full max-w-3xl mx-auto">
              {/* Stage 1 */}
              <rect x="20" y="30" width="190" height="260" rx="12" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="115" y="55" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold">Stage 1: Retrieval</text>
              <text x="115" y="70" textAnchor="middle" fill="#64748b" fontSize="9">(Bi-Encoder / BM25)</text>
              <text x="115" y="85" textAnchor="middle" fill="#64748b" fontSize="8">10M docs → top 50</text>

              {["Tài liệu A (0.85)", "Tài liệu B (0.78)", "Tài liệu C (0.72)", "Tài liệu D (0.65)", "Tài liệu E (0.60)"].map((d, i) => (
                <g key={i}>
                  <rect x="30" y={95 + i * 36} width="170" height="28" rx="6" fill="#334155" stroke="#475569" strokeWidth="1" />
                  <text x="115" y={113 + i * 36} textAnchor="middle" fill="#94a3b8" fontSize="9">{d}</text>
                </g>
              ))}

              <line x1="210" y1="165" x2="270" y2="165" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow-rr2)" />
              <text x="240" y="155" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="bold">Top-50</text>

              {/* Stage 2 */}
              <rect x="270" y="50" width="190" height="220" rx="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="365" y="75" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">Stage 2: Re-ranking</text>
              <text x="365" y="90" textAnchor="middle" fill="#64748b" fontSize="9">(Cross-Encoder)</text>

              {[
                { d: "Q + A → 0.92", c: "#22c55e" },
                { d: "Q + B → 0.45", c: "#94a3b8" },
                { d: "Q + C → 0.88", c: "#22c55e" },
                { d: "Q + D → 0.31", c: "#64748b" },
                { d: "Q + E → 0.76", c: "#94a3b8" },
              ].map((item, i) => (
                <g key={i}>
                  <rect x="280" y={100 + i * 30} width="170" height="24" rx="5" fill="#334155" />
                  <text x="365" y={116 + i * 30} textAnchor="middle" fill={item.c} fontSize="9">{item.d}</text>
                </g>
              ))}

              <line x1="460" y1="165" x2="510" y2="165" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow-rr2)" />

              {/* Final */}
              <rect x="510" y="60" width="170" height="200" rx="12" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
              <text x="595" y="85" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold">Kết quả cuối</text>

              {[
                { d: "1. Tài liệu A (0.92)", c: "#22c55e" },
                { d: "2. Tài liệu C (0.88)", c: "#22c55e" },
                { d: "3. Tài liệu E (0.76)", c: "#94a3b8" },
                { d: "4. Tài liệu B (0.45)", c: "#64748b" },
                { d: "5. Tài liệu D (0.31)", c: "#64748b" },
              ].map((item, i) => (
                <text key={i} x="595" y={110 + i * 28} textAnchor="middle" fill={item.c} fontSize="9">{item.d}</text>
              ))}

              <text x="595" y="255" textAnchor="middle" fill="#64748b" fontSize="8">
                B: 2nd → 4th, C: 3rd → 2nd
              </text>

              <defs>
                <marker id="arrow-rr2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                </marker>
              </defs>
            </svg>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-background/50 border border-blue-500/30 p-3">
                <p className="text-sm font-semibold text-blue-400">Bi-Encoder (Stage 1)</p>
                <p className="text-xs text-muted">Encode query và doc RIÊNG RẼ. So sánh vector. Nhanh (ms). 10M → top 50.</p>
              </div>
              <div className="rounded-lg bg-background/50 border border-yellow-500/30 p-3">
                <p className="text-sm font-semibold text-yellow-400">Cross-Encoder (Stage 2)</p>
                <p className="text-xs text-muted">Encode CÙNG LÚC (query, doc). Chính xác hơn nhiều. Chậm (10ms/cặp). Top 50 → re-rank.</p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Re-ranking giống <strong>cuộc thi tài năng 2 vòng</strong>: Vòng sơ loại (stage 1) lọc nhanh 1000 thí sinh
            xuống 50. Vòng chung kết (stage 2) giám khảo chính <strong>đánh giá kỹ</strong>{" "}từng người trong 50 thí sinh.
            Kết quả: thí sinh thực sự giỏi nhất lên top, dù vòng sơ loại xếp hạng khác!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Stage 1 trả về top-20. Re-ranker chấm xong, tài liệu tốt nhất đứng hạng 18. Nếu stage 1 chỉ trả top-10, re-ranker có tìm được tài liệu đó không?"
          options={[
            "Có, re-ranker tìm thêm trong toàn bộ database",
            "KHÔNG -- re-ranker chỉ xếp hạng lại những gì stage 1 đưa cho. Top-K stage 1 quá nhỏ = mất kết quả tốt!",
            "Re-ranker tự động mở rộng top-K",
          ]}
          correct={1}
          explanation="Re-ranker KHÔNG tìm kiếm mới -- chỉ xếp hạng lại! Nếu stage 1 bỏ lỡ tài liệu tốt, re-ranker cũng không cứu được. Top-K stage 1 quá nhỏ = recall thấp. Thường top-50 đến top-100."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Re-ranking</strong>{" "}sắp xếp lại kết quả từ stage 1 (thường là <TopicLink slug="semantic-search">semantic search</TopicLink> hoặc <TopicLink slug="hybrid-search">hybrid search</TopicLink>) bằng mô hình mạnh hơn (Cross-Encoder),
            đưa kết quả liên quan nhất lên đầu — là bước chuẩn trong mọi pipeline <TopicLink slug="rag">RAG</TopicLink> chất lượng cao.
          </p>

          <p><strong>Cross-Encoder scoring:</strong></p>
          <LaTeX block>{"\\text{score}(q, d) = \\text{CrossEncoder}([\\text{CLS}] \\; q \\; [\\text{SEP}] \\; d \\; [\\text{SEP}])"}</LaTeX>
          <p className="text-sm text-muted">
            Query và document được concat và xử lý CÙNG LÚC qua Transformer. Mỗi token query attend đến mỗi token document
            -- nắm bắt sự tương tác chi tiết mà Bi-Encoder bỏ lỡ.
          </p>

          <Callout variant="insight" title="Bi-Encoder vs Cross-Encoder">
            <div className="space-y-2 text-sm">
              <p><strong>Bi-Encoder:</strong>{" "}Encode riêng. Precompute doc vectors. Cosine similarity. O(1) per query-doc pair (sau precompute). Dùng cho retrieval.</p>
              <p><strong>Cross-Encoder:</strong>{" "}Encode cùng. 1 forward pass per pair. Chính xác hơn nhiều. O(N) per query. Dùng cho re-ranking top-K.</p>
            </div>
          </Callout>

          <Callout variant="warning" title="Mô hình Re-ranking phổ biến">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Cohere Rerank:</strong>{" "}API đơn giản nhất, hỗ trợ 100+ ngôn ngữ (tiếng Việt)</li>
              <li><strong>bge-reranker-v2-m3:</strong>{" "}Open-source, đa ngôn ngữ, mạnh</li>
              <li><strong>ms-marco-MiniLM:</strong>{" "}Nhẹ, nhanh, tốt cho tiếng Anh</li>
              <li><strong>Jina Reranker:</strong>{" "}Open-source, hỗ trợ cross-lingual</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Re-ranking với Cohere và sentence-transformers">
{`# Cách 1: Cohere Rerank API (đơn giản nhất)
import cohere

co = cohere.Client("your-api-key")

results = co.rerank(
    query="quyền lao động Việt Nam",
    documents=[
        "Luật lao động quy định quyền người lao động",
        "Giá vàng hôm nay tăng mạnh",
        "Quyền lợi và nghĩa vụ người đi làm",
        "Bộ luật lao động sửa đổi bổ sung",
    ],
    model="rerank-v3.5",
    top_n=3,
)
for r in results.results:
    print(f"Score {r.relevance_score:.3f}: {r.document.text}")

# Cách 2: Cross-Encoder local (open-source)
from sentence_transformers import CrossEncoder

model = CrossEncoder("BAAI/bge-reranker-v2-m3")

pairs = [
    ("quyền lao động", "Luật lao động quy định quyền"),
    ("quyền lao động", "Giá vàng hôm nay tăng"),
    ("quyền lao động", "Quyền lợi người đi làm"),
]
scores = model.predict(pairs)
# scores: [0.92, 0.03, 0.88]
# Sort theo score → kết quả re-ranked`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Re-ranking = Stage 2: dùng Cross-Encoder xếp hạng lại top-K từ stage 1 (retrieval)",
          "Cross-Encoder encode (query, doc) CÙNG LÚC -- chính xác hơn Bi-Encoder nhưng chậm hơn 100x",
          "Re-ranker KHÔNG tìm kiếm mới -- chỉ xếp hạng lại. Top-K stage 1 quá nhỏ = mất kết quả tốt",
          "Cohere Rerank (API) hoặc bge-reranker (open-source) là lựa chọn phổ biến",
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
