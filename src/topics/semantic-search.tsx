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
  slug: "semantic-search",
  title: "Semantic Search",
  titleVi: "Tìm kiếm ngữ nghĩa",
  description:
    "Tìm kiếm dựa trên ý nghĩa nội dung thay vì khớp từ khóa, sử dụng vector nhúng.",
  category: "search-retrieval",
  tags: ["semantic", "search", "embedding", "nlp"],
  difficulty: "intermediate",
  relatedSlugs: ["bm25", "hybrid-search", "embedding-model"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
interface Doc { text: string; keywords: string[]; semantic: string[] }

const DOCUMENTS: Doc[] = [
  { text: "Phở bò Hà Nội ninh xương 12 tiếng", keywords: ["phở", "bò", "hà nội"], semantic: ["ẩm thực", "món ăn", "truyền thống"] },
  { text: "Bún chả được CNN bình chọn ngon nhất", keywords: ["bún chả", "CNN", "ngon"], semantic: ["ẩm thực", "món ăn", "nổi tiếng"] },
  { text: "Xe điện VinFast xuất khẩu sang Mỹ", keywords: ["xe điện", "vinfast", "xuất khẩu"], semantic: ["ô tô", "công nghệ", "thương mại"] },
  { text: "Bảo vệ môi trường biển Việt Nam", keywords: ["bảo vệ", "môi trường", "biển"], semantic: ["tự nhiên", "sinh thái", "đại dương"] },
];

const QUERIES: Record<string, { lexical: number[]; semantic: number[] }> = {
  "đặc sản ẩm thực Việt Nam": { lexical: [], semantic: [0, 1] },
  "ô nhiễm đại dương": { lexical: [], semantic: [3] },
  "món ăn đường phố nổi tiếng": { lexical: [], semantic: [0, 1] },
  "phương tiện giao thông xanh": { lexical: [], semantic: [2] },
};

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao semantic search tìm được 'Phở bò Hà Nội' khi tìm 'đặc sản ẩm thực'?",
    options: [
      "Vì 'phở' chứa trong từ 'đặc sản'",
      "Vì embedding của 'phở bò' và 'đặc sản ẩm thực' có vector GẦN NHAU trong không gian ngữ nghĩa",
      "Vì BM25 khớp từ 'Hà Nội'",
      "Vì database có tag 'ẩm thực'",
    ],
    correct: 1,
    explanation: "Embedding model biến 'phở bò' và 'đặc sản ẩm thực' thành vector gần nhau vì cùng thuộc miền ẩm thực Việt Nam. Không cần từ nào giống nhau -- chỉ cần NGHĨA gần!",
  },
  {
    question: "Bi-encoder khác Cross-encoder thế nào?",
    options: [
      "Bi-encoder chỉ dùng cho ảnh",
      "Bi-encoder encode query và doc RIÊNG RẼ (nhanh), Cross-encoder encode CÙNG LÚC (chính xác hơn)",
      "Cross-encoder nhanh hơn Bi-encoder",
      "Không có sự khác biệt",
    ],
    correct: 1,
    explanation: "Bi-encoder: embed query và doc riêng -> so sánh vector. Nhanh (precompute doc vectors). Cross-encoder: concat(query, doc) -> 1 score. Chậm hơn 100x nhưng chính xác hơn (dùng cho re-ranking).",
  },
  {
    question: "Semantic search yếu ở bài toán nào?",
    options: [
      "Tìm đồng nghĩa và paraphrase",
      "Khớp chính xác mã sản phẩm 'SKU-12345' hoặc tên riêng hiếm",
      "Tìm tài liệu liên quan đến câu hỏi",
      "Tìm kiếm đa ngôn ngữ",
    ],
    correct: 1,
    explanation: "Embedding model ánh xạ 'SKU-12345' thành vector chung chung, không nắm bắt tính chính xác ký tự. BM25 khớp chính xác 'SKU-12345' tốt hơn nhiều. Đây là lý do cần Hybrid Search!",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function SemanticSearchTopic() {
  const [selectedQuery, setSelectedQuery] = useState("đặc sản ẩm thực Việt Nam");
  const [mode, setMode] = useState<"lexical" | "semantic">("lexical");

  const results = useMemo(() => {
    const q = QUERIES[selectedQuery];
    return mode === "lexical" ? q.lexical : q.semantic;
  }, [selectedQuery, mode]);

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn tìm 'đặc sản ẩm thực Việt Nam' trên VnExpress. Bài viết về 'Phở bò Hà Nội' không chứa từ 'đặc sản' hay 'ẩm thực'. BM25 tìm được không?"
          options={[
            "Được, BM25 hiểu ngữ cảnh",
            "KHÔNG -- BM25 chỉ khớp từ. Cần Semantic Search để hiểu 'phở' liên quan đến 'ẩm thực'",
            "Được nếu bài viết đủ dài",
          ]}
          correct={1}
          explanation="BM25 khớp chính xác từ. 'Phở' != 'ẩm thực'. Semantic Search chuyển cả 2 thành vector, nhận ra 'phở bò' GẦN 'đặc sản ẩm thực' trong không gian ngữ nghĩa!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            <div className="flex gap-2">
              {(["lexical", "semantic"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    mode === m ? "text-white" : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                  style={mode === m ? { backgroundColor: m === "lexical" ? "#ef4444" : "#3b82f6" } : {}}>
                  {m === "lexical" ? "Tìm kiếm từ khoá (BM25)" : "Tìm kiếm ngữ nghĩa"}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Chọn câu truy vấn:</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(QUERIES).map((q) => (
                  <button key={q} type="button" onClick={() => setSelectedQuery(q)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedQuery === q ? "bg-accent text-white" : "bg-card border border-border text-muted hover:text-foreground"
                    }`}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <svg viewBox="0 0 600 230" className="w-full max-w-2xl mx-auto">
              <text x="300" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="bold">
                Truy vấn: {selectedQuery}
              </text>
              {DOCUMENTS.map((doc, i) => {
                const isMatch = results.includes(i);
                const y = 40 + i * 46;
                return (
                  <g key={i}>
                    <rect x="30" y={y} width="540" height="38" rx="8"
                      fill={isMatch ? (mode === "lexical" ? "#7f1d1d" : "#1e3a5f") : "#1e293b"}
                      stroke={isMatch ? (mode === "lexical" ? "#ef4444" : "#3b82f6") : "#334155"}
                      strokeWidth={isMatch ? 2 : 1} />
                    <text x="50" y={y + 23} fill={isMatch ? "#e2e8f0" : "#64748b"} fontSize="11">
                      {doc.text}
                    </text>
                    {isMatch && (
                      <text x="545" y={y + 24} textAnchor="end" fill="#22c55e" fontSize="10" fontWeight="bold">
                        Khớp
                      </text>
                    )}
                  </g>
                );
              })}
              {results.length === 0 && (
                <text x="300" y="140" textAnchor="middle" fill="#ef4444" fontSize="12">
                  Không tìm thấy kết quả!
                </text>
              )}
            </svg>

            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm text-muted">
                {mode === "lexical"
                  ? results.length === 0
                    ? "BM25: KHÔNG khớp -- không có từ nào trong query xuất hiện trong tài liệu."
                    : `BM25: ${results.length} kết quả dựa trên khớp chính xác từ.`
                  : `Semantic Search: ${results.length} kết quả dựa trên ý nghĩa, dù không có từ nào giống!`}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Semantic Search giống <strong>hỏi thủ thư thông minh</strong>: bạn nói <strong>'đặc sản ẩm thực'</strong>,
            thủ thư hiểu ý và mang đến sách về phở, bún chả -- dù bìa sách không có chữ 'đặc sản'.
            BM25 giống <strong>máy quét barcode</strong>: chỉ tìm đúng mã, không hiểu nghĩa.
            Mỗi cách có thế mạnh riêng!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Bạn tìm 'iPhone 16 Pro Max'. Semantic search trả về 'Samsung Galaxy S25 Ultra' (gần về nghĩa 'điện thoại cao cấp'). Đây có phải kết quả tốt?"
          options={[
            "Tốt -- cùng loại điện thoại cao cấp",
            "KHÔNG tốt -- người dùng muốn chính xác 'iPhone 16 Pro Max', cần BM25 khớp exact",
            "Tuỳ thuộc ngữ cảnh",
          ]}
          correct={1}
          explanation="Semantic search hiểu 'nghĩa' nhưng thiếu 'chính xác'. 'iPhone 16 Pro Max' là tên riêng cụ thể, cần exact match. Đây là lý do Hybrid Search (BM25 + Semantic) tốt hơn dùng riêng lẻ!"
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Semantic Search</strong>{" "}tìm kiếm dựa trên ý nghĩa nội dung thay vì khớp từ khoá.
            Sử dụng embedding model chuyển text thành vector, rồi tìm vector gần nhất.
          </p>

          <p><strong>Pipeline:</strong></p>
          <LaTeX block>{"\\text{query} \\xrightarrow{\\text{embed}} \\mathbf{q} \\in \\mathbb{R}^d, \\quad \\text{doc}_i \\xrightarrow{\\text{embed}} \\mathbf{d}_i \\in \\mathbb{R}^d"}</LaTeX>
          <LaTeX block>{"\\text{score}(q, d_i) = \\text{sim}(\\mathbf{q}, \\mathbf{d}_i) = \\frac{\\mathbf{q} \\cdot \\mathbf{d}_i}{\\|\\mathbf{q}\\| \\|\\mathbf{d}_i\\|}"}</LaTeX>

          <Callout variant="insight" title="Bi-Encoder vs Cross-Encoder">
            <div className="space-y-2 text-sm">
              <p><strong>Bi-Encoder:</strong>{" "}Encode query và doc RIÊNG RẼ. Precompute doc vectors. So sánh cosine. Nhanh (ms). Dùng cho first-stage retrieval.</p>
              <p><strong>Cross-Encoder:</strong>{" "}Concat(query, doc) -> Transformer -> 1 score. Chính xác hơn nhưng O(N). Dùng cho re-ranking (stage 2).</p>
            </div>
          </Callout>

          <Callout variant="warning" title="Embedding Models phổ biến">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>OpenAI text-embedding-3-small/large:</strong>{" "}Mạnh, dễ dùng qua API</li>
              <li><strong>Cohere embed-v3:</strong>{" "}Hỗ trợ 100+ ngôn ngữ, compressed embeddings</li>
              <li><strong>sentence-transformers (all-MiniLM-L6-v2):</strong>{" "}Open-source, nhẹ, chạy local</li>
              <li><strong>bge-m3:</strong>{" "}Open-source, đa ngôn ngữ, hỗ trợ tiếng Việt tốt</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Semantic Search với sentence-transformers">
{`from sentence_transformers import SentenceTransformer
import numpy as np

# Load model (hỗ trợ tiếng Việt)
model = SentenceTransformer("BAAI/bge-m3")

# Embed tài liệu
docs = [
    "Phở bò Hà Nội ninh xương 12 tiếng",
    "Bún chả được CNN bình chọn ngon nhất",
    "Xe điện VinFast xuất khẩu sang Mỹ",
    "Bảo vệ môi trường biển Việt Nam",
]
doc_embeddings = model.encode(docs, normalize_embeddings=True)

# Embed query
query = "đặc sản ẩm thực Việt Nam nổi tiếng"
query_embedding = model.encode(query, normalize_embeddings=True)

# Cosine similarity (đã normalize -> dot product)
scores = doc_embeddings @ query_embedding
ranked = np.argsort(-scores)

for idx in ranked[:3]:
    print(f"Score {scores[idx]:.3f}: {docs[idx]}")
# Output: Phở bò... (0.82), Bún chả... (0.79), ...
# Dù không có từ 'đặc sản' hay 'ẩm thực' trong tài liệu!`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Semantic Search tìm theo NGHĨA: embed query + doc thành vector, tìm vector gần nhất",
          "Bi-Encoder: nhanh, precompute (first-stage). Cross-Encoder: chính xác, chậm (re-ranking)",
          "Giỏi đồng nghĩa, paraphrase, đa ngôn ngữ. Yếu: exact match tên riêng, mã sản phẩm",
          "bge-m3, text-embedding-3, all-MiniLM-L6-v2 là các embedding model phổ biến",
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
