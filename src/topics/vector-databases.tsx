"use client";

import { useState, useMemo } from "react";
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
  slug: "vector-databases",
  title: "Vector Databases",
  titleVi: "Cơ sở dữ liệu vector",
  description:
    "Hệ thống lưu trữ và truy vấn dữ liệu dưới dạng vector nhúng, cho phép tìm kiếm theo ngữ nghĩa.",
  category: "search-retrieval",
  tags: ["vector", "database", "embedding", "similarity"],
  difficulty: "intermediate",
  relatedSlugs: ["faiss", "semantic-search", "embedding-model"],
  vizType: "interactive",
};

/* ── data ─────────────────────────────────────────────────── */
const POINTS = [
  { x: 120, y: 80, label: "Phở bò", color: "#3b82f6", group: "food" },
  { x: 150, y: 100, label: "Bún chả", color: "#3b82f6", group: "food" },
  { x: 130, y: 60, label: "Bánh mì", color: "#3b82f6", group: "food" },
  { x: 350, y: 300, label: "Xe máy", color: "#ef4444", group: "vehicle" },
  { x: 380, y: 280, label: "Ô tô", color: "#ef4444", group: "vehicle" },
  { x: 330, y: 320, label: "Xe đạp", color: "#ef4444", group: "vehicle" },
  { x: 250, y: 180, label: "Nấu ăn", color: "#f59e0b", group: "both" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Vector database khác SQL database truyền thống ở điểm nào?",
    options: [
      "Vector DB lưu trữ ít dữ liệu hơn",
      "Vector DB tìm kiếm theo TƯƠNG TỰ ngữ nghĩa thay vì khớp chính xác (exact match)",
      "Vector DB chỉ dùng cho ảnh",
      "Vector DB không cần index",
    ],
    correct: 1,
    explanation: "SQL: WHERE name = 'phở' (khớp chính xác). Vector DB: tìm 'món ăn Việt Nam nóng' -> trả về phở, bún, miến dù không có từ nào khớp. Tìm kiếm theo NGHĨA, không theo CHỮ!",
  },
  {
    question: "HNSW (Hierarchical Navigable Small World) index hoạt động thế nào?",
    options: [
      "Duyệt tuần tự tất cả vector",
      "Xây đồ thị phân tầng: nhảy nhanh ở tầng trên, tìm chính xác ở tầng dưới",
      "Chia vector thành cụm cố định",
      "Sắp xếp vector theo thứ tự tăng dần",
    ],
    correct: 1,
    explanation: "HNSW giống GPS: tầng trên có ít node, nhảy xa (tìm vùng gần đúng). Tầng dưới có nhiều node, nhảy ngắn (tinh chỉnh). Kết quả: O(log N) thay vì O(N) cho nearest neighbor!",
  },
  {
    question: "Cosine similarity đo gì giữa 2 vector?",
    options: [
      "Khoảng cách Euclidean giữa 2 điểm",
      "Góc giữa 2 vector -- vector cùng hướng = similarity 1.0",
      "Tổng các thành phần của vector",
      "Chiều dài (magnitude) của vector",
    ],
    correct: 1,
    explanation: "Cosine similarity = cos(theta) giữa 2 vector. Bằng 1 nếu cùng hướng (rất giống), 0 nếu vuông góc, -1 nếu ngược hướng. Không phụ thuộc độ dài vector!",
  },
  {
    type: "fill-blank",
    question: "Trên tập tỷ vector, brute-force quá chậm nên vector DB dùng thuật toán {blank} (Approximate Nearest Neighbor). Phổ biến nhất là {blank}, xây đồ thị phân tầng cho tìm kiếm O(log N).",
    blanks: [
      { answer: "ANN", accept: ["Approximate Nearest Neighbor", "approximate nearest neighbor"] },
      { answer: "HNSW", accept: ["Hierarchical Navigable Small World", "hnsw"] },
    ],
    explanation: "ANN chấp nhận giảm chút recall (95-99%) để tăng tốc hàng nghìn lần. HNSW (Hierarchical Navigable Small World) xây đồ thị nhiều tầng: tầng cao nhảy xa, tầng thấp tinh chỉnh — nhanh và chính xác, được Pinecone, Qdrant, Weaviate dùng mặc định.",
  },
];

/* ── component ────────────────────────────────────────────── */
export default function VectorDatabasesTopic() {
  const [queryIdx, setQueryIdx] = useState<number | null>(null);

  const distances = useMemo(() => {
    if (queryIdx === null) return [];
    const qp = POINTS[queryIdx];
    return POINTS.map((p, i) => ({
      idx: i, dist: i === queryIdx ? 0 : Math.round(Math.sqrt((p.x - qp.x) ** 2 + (p.y - qp.y) ** 2)),
    }))
      .filter((d) => d.idx !== queryIdx)
      .sort((a, b) => a.dist - b.dist);
  }, [queryIdx]);

  const topK = distances.slice(0, 3);

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn gõ 'món ăn nóng buổi sáng' trên ứng dụng đặt đồ ăn. Database có 'phở bò', 'bún chả', 'kem dâu'. SQL truyền thống tìm WHERE name LIKE '%nóng%' -- không khớp gì! Làm sao tìm đúng?"
          options={[
            "Thêm nhiều keyword hơn vào câu tìm kiếm",
            "Dùng vector database: chuyển câu hỏi và menu thành vector, tìm vector GẦN NHẤT",
            "Duyệt toàn bộ menu bằng tay",
          ]}
          correct={1}
          explanation="Vector database chuyển mọi thứ thành vector số. 'Món ăn nóng buổi sáng' và 'Phở bò' có vector GẦN NHAU vì cùng ngữ nghĩa, dù không có từ nào giống nhau!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Nhấp vào một điểm để tìm 3 điểm gần nhất (nearest neighbors). Đồ ăn gần nhau, xe gần nhau!
            </p>
            <svg viewBox="0 0 500 400" className="w-full max-w-2xl mx-auto bg-background/30 rounded-lg">
              {[0, 100, 200, 300, 400].map((v) => (
                <g key={v}>
                  <line x1={v} y1="0" x2={v} y2="400" stroke="#334155" strokeWidth="0.5" />
                  <line x1="0" y1={v} x2="500" y2={v} stroke="#334155" strokeWidth="0.5" />
                </g>
              ))}
              {queryIdx !== null && topK.map((d) => (
                <line key={d.idx}
                  x1={POINTS[queryIdx].x} y1={POINTS[queryIdx].y}
                  x2={POINTS[d.idx].x} y2={POINTS[d.idx].y}
                  stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,3" opacity={0.7} />
              ))}
              {POINTS.map((p, i) => {
                const isQuery = queryIdx === i;
                const isNearest = topK.some((d) => d.idx === i);
                return (
                  <g key={i} onClick={() => setQueryIdx(i)} className="cursor-pointer">
                    <circle cx={p.x} cy={p.y}
                      r={isQuery ? 16 : isNearest ? 13 : 10}
                      fill={isQuery ? "#22c55e" : p.color}
                      stroke={isNearest ? "#22c55e" : "none"}
                      strokeWidth={isNearest ? 2.5 : 0}
                      opacity={queryIdx !== null && !isQuery && !isNearest ? 0.35 : 1} />
                    <text x={p.x} y={p.y - 16} textAnchor="middle"
                      fill={isQuery ? "#22c55e" : "#94a3b8"} fontSize="10"
                      fontWeight={isQuery ? "bold" : "normal"}>
                      {p.label}
                    </text>
                  </g>
                );
              })}
              <circle cx="420" cy="20" r="6" fill="#3b82f6" />
              <text x="432" y="24" fill="#94a3b8" fontSize="9">Đồ ăn</text>
              <circle cx="420" cy="40" r="6" fill="#ef4444" />
              <text x="432" y="44" fill="#94a3b8" fontSize="9">Phương tiện</text>
            </svg>

            {queryIdx !== null && (
              <div className="rounded-lg bg-background/50 border border-border p-4">
                <p className="text-sm font-medium text-green-500 mb-2">
                  Truy vấn: {POINTS[queryIdx].label} -- Top 3 gần nhất:
                </p>
                {topK.map((d, i) => (
                  <p key={i} className="text-sm text-muted">
                    {i + 1}. {POINTS[d.idx].label} (khoảng cách: {d.dist})
                  </p>
                ))}
              </div>
            )}
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Vector database giống <strong>thư viện xếp sách theo nội dung</strong>{" "}thay vì alphabet.
            Sách về phở nằm gần sách về bún chả (cùng món ăn Việt), xa sách về xe máy. Khi bạn hỏi
            <strong>{" "}đồ ăn sáng Hà Nội</strong>, thủ thư đi đến <strong>khu vực ẩm thực</strong> và lấy
            sách gần nhất. Tìm kiếm theo <strong>nghĩa</strong>, không theo chữ!
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Vector database có 1 tỷ vector. Tìm nearest neighbor bằng brute-force (so sánh từng vector) mất 10 giây. Làm sao giảm xuống 10ms?"
          options={[
            "Dùng GPU mạnh hơn",
            "Dùng index ANN (Approximate Nearest Neighbor) như HNSW hoặc IVF -- đổi chút chính xác lấy tốc độ",
            "Giảm kích thước database",
          ]}
          correct={1}
          explanation="ANN index (HNSW, IVF) không so sánh toàn bộ mà 'nhảy thông minh' qua đồ thị hoặc chỉ tìm trong cụm gần nhất. Recall 95-99% nhưng nhanh gấp 1000x! Trade-off hoàn hảo."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Vector Database</strong>{" "}là hệ thống lưu trữ chuyên biệt cho dữ liệu dạng vector nhúng sinh ra từ <TopicLink slug="embedding-model">embedding model</TopicLink>,
            hỗ trợ <TopicLink slug="semantic-search">semantic search</TopicLink> (similarity search) trên quy mô lớn. Một thư viện tiêu biểu là <TopicLink slug="faiss">FAISS</TopicLink>.
          </p>

          <p><strong>Cosine Similarity</strong>{" "}-- phép đo phổ biến nhất:</p>
          <LaTeX block>{"\\text{sim}(\\mathbf{a}, \\mathbf{b}) = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{\\|\\mathbf{a}\\| \\|\\mathbf{b}\\|} = \\cos(\\theta)"}</LaTeX>

          <Callout variant="insight" title="Các thuật toán index (ANN)">
            <div className="space-y-2 text-sm">
              <p><strong>Flat (Brute-force):</strong>{" "}So sánh tất cả. Chính xác 100% nhưng O(N). Chỉ dùng cho dataset nhỏ.</p>
              <p><strong>IVF (Inverted File):</strong>{" "}Phân cụm K-means, chỉ tìm trong cụm gần nhất. O(N/K).</p>
              <p><strong>HNSW (Hierarchical NSW):</strong>{" "}Đồ thị phân tầng, O(log N). Nhanh nhất cho recall cao.</p>
              <p><strong>PQ (Product Quantization):</strong>{" "}Nén vector, giảm bộ nhớ 10-100x. Kết hợp với IVF/HNSW.</p>
            </div>
          </Callout>

          <Callout variant="warning" title="Hệ sinh thái Vector Database">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Pinecone:</strong>{" "}Managed, serverless, dễ dùng nhất. Phổ biến cho startup.</li>
              <li><strong>Weaviate:</strong>{" "}Open-source, hỗ trợ hybrid search (vector + keyword).</li>
              <li><strong>Milvus:</strong>{" "}Open-source, scale lên tỷ vector. Dùng nhiều trong enterprise.</li>
              <li><strong>Chroma:</strong>{" "}Nhẹ, dễ tích hợp, phổ biến cho prototype và RAG.</li>
              <li><strong>Qdrant:</strong>{" "}Rust-based, hiệu suất cao, filtering mạnh.</li>
              <li><strong>pgvector:</strong>{" "}Extension cho PostgreSQL -- dùng DB có sẵn!</li>
            </ul>
          </Callout>

          <CodeBlock language="python" title="Vector DB với Chroma (phổ biến cho RAG)">
{`import chromadb
from chromadb.utils import embedding_functions

# Tạo client và collection
client = chromadb.Client()
ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)
collection = client.create_collection(
    name="vnexpress_articles",
    embedding_function=ef,
)

# Thêm tài liệu (tự động embed)
collection.add(
    documents=[
        "Phở Hà Nội truyền thống ninh xương bò 12 tiếng",
        "Giá vàng hôm nay tăng 500 nghìn đồng/lượng",
        "Đội tuyển Việt Nam thắng 2-0 trong vòng loại",
        "Bún chả Hà Nội được CNN bình chọn top món ngon",
    ],
    ids=["doc1", "doc2", "doc3", "doc4"],
    metadatas=[
        {"category": "food"}, {"category": "finance"},
        {"category": "sport"}, {"category": "food"},
    ],
)

# Tìm kiếm theo ngữ nghĩa
results = collection.query(
    query_texts=["món ăn sáng nổi tiếng Việt Nam"],
    n_results=2,
)
# Trả về: "Phở Hà Nội..." và "Bún chả Hà Nội..."
# Dù không có từ "sáng" hay "nổi tiếng" trong tài liệu!`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary points={[
          "Vector DB lưu embedding và tìm kiếm theo NGỮ NGHĨA (similarity) thay vì khớp chính xác",
          "ANN index (HNSW, IVF, PQ) giúp tìm kiếm nhanh trên tỷ vector: đổi chút chính xác lấy tốc độ",
          "Cosine similarity đo góc giữa 2 vector: cùng hướng = giống nhau",
          "Chroma, Pinecone, Weaviate là các lựa chọn phổ biến; pgvector cho PostgreSQL có sẵn",
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
