"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { PredictionGate, AhaMoment, InlineChallenge, Callout, CollapsibleDetail,
  MiniSummary, CodeBlock, LessonSection, LaTeX, TopicLink, ProgressSteps } from "@/components/interactive";
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

/* ──────────────────────────────────────────────────────────────
 * DỮ LIỆU — Truy vấn thực tế tiếng Việt: "cách luộc gà"
 * Mỗi tài liệu được gán hai điểm: BM25 (lexical overlap) và
 * Dense embedding cosine similarity (ngữ nghĩa). Chúng ta cố ý
 * thiết kế để có tài liệu "chỉ BM25 cao", "chỉ Dense cao", và
 * tài liệu "cao cả hai" — phản ánh đúng pattern của truy xuất
 * thực tế trên Google, Shopee hay chatbot nấu ăn.
 * ──────────────────────────────────────────────────────────────*/
interface SearchDoc {
  id: string;
  title: string;
  snippet: string;
  bm25: number;      // raw BM25 score, khoảng 0..10
  dense: number;     // cosine similarity, khoảng 0..1
  source: string;
}

const QUERY = "cách luộc gà";
const QUERY_TOKENS = ["cách", "luộc", "gà"];

const CORPUS: SearchDoc[] = [
  {
    id: "d1",
    title: "Cách luộc gà cúng vàng ươm không nứt da",
    snippet: "Hướng dẫn luộc gà cho ngày rằm: chọn gà ta, xát muối, luộc lửa nhỏ 30 phút rồi ngâm nước đá...",
    bm25: 9.4,
    dense: 0.91,
    source: "cookpad.vn",
  },
  {
    id: "d2",
    title: "Bí quyết hầm gà ác với thuốc bắc bổ dưỡng",
    snippet: "Gà ác hầm cùng kỳ tử, táo đỏ, hạt sen — món ăn tẩm bổ cho phụ nữ sau sinh và người mới ốm dậy...",
    bm25: 1.2,
    dense: 0.78,
    source: "vnexpress.net",
  },
  {
    id: "d3",
    title: "Luộc gà bao nhiêu phút thì chín tới",
    snippet: "Gà 1.5kg luộc khoảng 25 phút kể từ khi nước sôi, sau đó tắt bếp ngâm thêm 10 phút cho thịt ngọt...",
    bm25: 7.8,
    dense: 0.84,
    source: "monngonmoingay.com",
  },
  {
    id: "d4",
    title: "Mẹo chọn gà ta ngon cho mâm cỗ Tết",
    snippet: "Gà mái tơ khoảng 1.4kg, chân vàng, mào đỏ tươi, lông mượt là loại dùng cho mâm cỗ cúng truyền thống...",
    bm25: 0.6,
    dense: 0.72,
    source: "dantri.com.vn",
  },
  {
    id: "d5",
    title: "Cách pha nước chấm gà luộc ngon đúng điệu",
    snippet: "Muối tiêu chanh, nước mắm gừng ớt, tương ớt Mường Khương — ba loại nước chấm ăn kèm gà luộc miền Bắc...",
    bm25: 6.1,
    dense: 0.65,
    source: "cooky.vn",
  },
  {
    id: "d6",
    title: "Kỹ thuật chần gia cầm giữ da giòn",
    snippet: "Quy trình chần nhanh ở 95°C trong 2 phút rồi shock nhiệt ở 0°C giúp collagen co lại, da giòn căng bóng...",
    bm25: 0.2,
    dense: 0.81,
    source: "foodlab.edu.vn",
  },
  {
    id: "d7",
    title: "Luộc gà bằng nồi cơm điện cho sinh viên",
    snippet: "Chỉ cần nồi cơm điện 1.8L, một con gà nhỏ và vài lát gừng — hướng dẫn từng bước cho người mới...",
    bm25: 5.9,
    dense: 0.88,
    source: "webtretho.com",
  },
  {
    id: "d8",
    title: "Tại sao nước luộc gà nhà hàng trong vắt",
    snippet: "Bí quyết hớt bọt liên tục ở 5 phút đầu và duy trì lửa liu riu giúp broth trong, không đục, không tanh...",
    bm25: 4.2,
    dense: 0.79,
    source: "amthucsaigon.vn",
  },
  {
    id: "d9",
    title: "Công thức gà nướng mật ong kiểu Mỹ",
    snippet: "Marinate gà qua đêm với honey, soy sauce, garlic rồi nướng ở 180°C trong 45 phút, phết sauce 3 lần...",
    bm25: 0.1,
    dense: 0.34,
    source: "tastyasia.com",
  },
  {
    id: "d10",
    title: "Cách làm gà hấp lá chanh miền Tây",
    snippet: "Gà làm sạch, ướp hành tím, sả, lá chanh rồi hấp cách thủy 40 phút, chấm muối tiêu chanh...",
    bm25: 3.0,
    dense: 0.82,
    source: "miền-tây-ẩm-thực.vn",
  },
];

/* ──────────────────────────────────────────────────────────────
 * Hàm phụ trợ — chuẩn hoá, xếp hạng, Reciprocal Rank Fusion
 * ──────────────────────────────────────────────────────────────*/
function minMaxNormalize(scores: number[]): number[] {
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  if (max - min < 1e-9) return scores.map(() => 0);
  return scores.map((s) => (s - min) / (max - min));
}

function rankOf(list: { id: string }[]): Record<string, number> {
  const r: Record<string, number> = {};
  list.forEach((d, i) => { r[d.id] = i + 1; });
  return r;
}

/* ──────────────────────────────────────────────────────────────
 * QUIZ — 8 câu hỏi, trộn multiple-choice và fill-blank
 * ──────────────────────────────────────────────────────────────*/
const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao Hybrid Search thường vượt trội so với dùng riêng BM25 hoặc Dense retrieval?",
    options: [
      "Vì Hybrid Search đơn giản là nhanh hơn cả hai",
      "BM25 giỏi exact match (tên riêng, mã số), Dense giỏi ngữ nghĩa (đồng nghĩa, paraphrase) — kết hợp bổ sung điểm yếu",
      "Hybrid Search không cần embedding model nên rẻ hơn",
      "Hybrid Search tự động chọn đúng phương pháp mạnh hơn tại runtime",
    ],
    correct: 1,
    explanation: "BM25 bắt chính xác token hiếm như 'Điều 128' hay 'XK-2024-A9'. Dense bắt đồng nghĩa: 'cách luộc gà' vs 'công thức nấu gia cầm'. Hybrid không bỏ lỡ cả hai loại.",
  },
  {
    question: "Reciprocal Rank Fusion (RRF) hoạt động theo nguyên lý nào?",
    options: [
      "Cộng trực tiếp điểm BM25 và điểm cosine, chuẩn hoá rồi sắp xếp",
      "Dùng thứ hạng (rank) thay vì điểm: RRF(d) = Σ 1/(k + rank_i(d)) — không cần normalize score",
      "Chỉ giữ những tài liệu xuất hiện ở cả hai danh sách",
      "Lấy điểm lớn nhất của tài liệu từ hai nguồn",
    ],
    correct: 1,
    explanation: "RRF dùng RANK không dùng SCORE. k = 60 là hằng số Cormack 2009 đề xuất. Ưu điểm cực lớn: không cần lo khác đơn vị (BM25 là logarit, cosine là [0,1]).",
  },
  {
    question: "Khi nào nên đặt α (weight của dense) gần 0 trong convex combination?",
    options: [
      "Khi truy vấn hỏi chung chung, không có từ khoá cụ thể",
      "Khi truy vấn chứa tên riêng, mã sản phẩm, tên luật, token hiếm cần khớp chính xác",
      "Khi corpus có ít hơn 1000 tài liệu",
      "Khi embedding model chưa tinh chỉnh xong",
    ],
    correct: 1,
    explanation: "Truy vấn 'iPhone 15 Pro Max 256GB màu xanh titan' — BM25 khớp đúng SKU. Dense có thể lạc về 'điện thoại cao cấp chống nước'. Cần α nhỏ, nghiêng BM25.",
  },
  {
    type: "fill-blank",
    question: "Hybrid retrieval gồm nhánh lexical dùng {blank} cho exact match, và nhánh {blank} dùng embedding vector cho ngữ nghĩa. Hai danh sách hợp nhất bằng RRF hoặc convex combination.",
    blanks: [
      { answer: "BM25", accept: ["bm25", "okapi bm25", "Okapi BM25", "sparse"] },
      { answer: "dense", accept: ["semantic", "ngữ nghĩa", "vector", "dense retrieval"] },
    ],
    explanation: "BM25 là thuật toán sparse cổ điển dựa trên TF-IDF có điều chỉnh bão hoà. Dense dùng mô hình như E5, bge-m3, Vietnamese-SBERT. Cặp đôi kinh điển trong mọi RAG pipeline.",
  },
  {
    question: "Với query 'cách luộc gà', tài liệu 'Kỹ thuật chần gia cầm' có BM25 rất thấp nhưng dense cao. Hybrid search sẽ xử lý thế nào?",
    options: [
      "Loại bỏ vì BM25 quá thấp",
      "Đưa lên top vì dense cao là đủ",
      "Giữ lại nhờ nhánh dense, có thể lọt top-K dù lexical overlap thấp — đây chính là ưu điểm chính của hybrid",
      "Cần người dùng chỉnh tay weight mới hiển thị",
    ],
    correct: 2,
    explanation: "'Chần gia cầm' ≈ 'luộc gà' ở mức ngữ nghĩa. Dense encoder học được điều này từ corpus lớn. Pure BM25 sẽ bỏ sót, pure dense có thể nhiễu — hybrid là sweet spot.",
  },
  {
    question: "Khi nào convex combination KHÔNG hoạt động tốt nếu không chuẩn hoá score?",
    options: [
      "Khi BM25 = 10.0 còn cosine = 0.85 — hai thang đo lệch nhau, BM25 sẽ luôn áp đảo",
      "Khi số lượng tài liệu quá nhỏ",
      "Khi người dùng gõ tiếng Anh",
      "Khi chỉ có một nhánh retrieval",
    ],
    correct: 0,
    explanation: "BM25 có range tự do [0, +∞) còn cosine là [-1, 1] hoặc [0, 1]. Phải min-max hoặc z-score trước khi cộng. RRF tránh được vấn đề này vì dùng rank thay score.",
  },
  {
    question: "Tham số k trong công thức RRF = Σ 1/(k + rank) có ý nghĩa gì?",
    options: [
      "Số lượng nguồn truy xuất",
      "Số tài liệu tối đa trả về",
      "Hằng số làm mượt (smoothing) — giảm ảnh hưởng của top-1, thường k = 60",
      "Trọng số của nhánh BM25",
    ],
    correct: 2,
    explanation: "k lớn → phân bố RRF phẳng, tài liệu rank thấp vẫn đóng góp đáng kể. k nhỏ → ưu tiên top-1 tuyệt đối. Cormack et al. (2009) thực nghiệm k = 60 là điểm ngọt.",
  },
  {
    type: "fill-blank",
    question: "Trên Elasticsearch 8+, một truy vấn hybrid điển hình sẽ gồm khối {blank} cho lexical và khối {blank} cho vector, rồi fuse bằng rrf.",
    blanks: [
      { answer: "query", accept: ["query", "match", "bool"] },
      { answer: "knn", accept: ["knn", "kNN", "vector"] },
    ],
    explanation: "Elasticsearch cho phép gửi một request duy nhất chứa `query` (BM25) và `knn` (HNSW). Backend tự chạy song song rồi fuse. Chi tiết trong CodeBlock phía dưới.",
  },
  {
    question: "Bạn cần recall top-10 tài liệu sau fuse. Nên lấy bao nhiêu candidate từ mỗi nhánh trước khi RRF?",
    options: [
      "Top-10 mỗi nhánh là đủ, tiết kiệm tài nguyên",
      "Top-50 đến top-100 mỗi nhánh — để tài liệu tốt ở rank 20 của một nhánh vẫn có cơ hội lên sau fuse",
      "Top-1000 để tuyệt đối an toàn",
      "Chỉ lấy từ nhánh mạnh hơn",
    ],
    correct: 1,
    explanation: "Nếu một tài liệu đứng rank 3 ở BM25 nhưng rank 22 ở dense, chỉ lấy top-10 sẽ mất nó. Top-50→top-100 là sweet spot: đủ rộng để fuse tốt, không quá nặng cho cross-encoder re-rank ở bước sau.",
  },
  {
    question: "Reranker 'relative score' (Weaviate RELATIVE_SCORE) khác với RRF ở điểm cốt lõi nào?",
    options: [
      "Relative score dùng rank, RRF dùng score",
      "RRF dùng rank không cần normalize; relative score dùng score sau khi normalize về [0,1] theo min-max trong danh sách — nhạy với phân phối score hơn nhưng giữ được thông tin về khoảng cách",
      "Hai cái hoàn toàn giống nhau, chỉ khác tên",
      "Relative score chỉ chạy được trên Weaviate Cloud",
    ],
    correct: 1,
    explanation: "RELATIVE_SCORE của Weaviate: score_norm = (score - min) / (max - min) từng nhánh rồi weighted sum theo alpha. Giữ 'gap' giữa top-1 và top-2 — nếu BM25 chênh lớn, top-1 thực sự nổi trội. RRF xoá sạch thông tin này, chỉ quan tâm rank. Chọn cái nào tuỳ domain: document có gap lớn chọn relative score, domain phẳng chọn RRF.",
  },
  {
    question: "Cross-encoder re-ranking bị gọi là 'monolithic' — ý nghĩa là gì?",
    options: [
      "Nó chạy trên một GPU duy nhất",
      "Nó encode đồng thời query và document qua cùng một forward pass (concatenate) nên bắt được late interaction — đắt hơn bi-encoder nhưng chính xác hơn nhiều",
      "Nó chỉ dùng một model duy nhất cho mọi domain",
      "Nó không cần tokenizer",
    ],
    correct: 1,
    explanation: "Bi-encoder (dense retriever): encode query và doc độc lập → cosine. Nhanh, có thể index trước. Cross-encoder: [CLS] query [SEP] doc [SEP] đi cùng qua model → điểm relevance. Chậm (O(K) forward pass), không index được, nhưng NDCG vượt trội. Đó là lý do pipeline gồm bi-encoder cho recall + cross-encoder cho precision ở top-K.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * COMPONENT
 * ──────────────────────────────────────────────────────────────*/
export default function HybridSearchTopic() {
  // α = trọng số cho nhánh dense trong convex combination
  const [alpha, setAlpha] = useState(0.5);
  // k trong công thức RRF
  const [rrfK, setRrfK] = useState(60);
  // Chế độ hiển thị cột fuse: "convex" hoặc "rrf"
  const [fuseMode, setFuseMode] = useState<"convex" | "rrf">("rrf");
  // Tài liệu đang được chọn để xem chi tiết
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  /* ────── Tính danh sách BM25 (sort giảm dần theo bm25) ────── */
  const bm25Ranked = useMemo(() => {
    return [...CORPUS].sort((a, b) => b.bm25 - a.bm25);
  }, []);

  /* ────── Tính danh sách Dense (sort giảm dần theo dense) ───── */
  const denseRanked = useMemo(() => {
    return [...CORPUS].sort((a, b) => b.dense - a.dense);
  }, []);

  /* ────── Chuẩn hoá để dùng cho convex combination ─────────── */
  const normBm25 = useMemo(() => {
    const vals = CORPUS.map((d) => d.bm25);
    const norm = minMaxNormalize(vals);
    const map: Record<string, number> = {};
    CORPUS.forEach((d, i) => { map[d.id] = norm[i]; });
    return map;
  }, []);

  const normDense = useMemo(() => {
    const vals = CORPUS.map((d) => d.dense);
    const norm = minMaxNormalize(vals);
    const map: Record<string, number> = {};
    CORPUS.forEach((d, i) => { map[d.id] = norm[i]; });
    return map;
  }, []);

  /* ────── Fuse theo convex: α·dense + (1-α)·bm25 ──────────── */
  const convexFused = useMemo(() => {
    return [...CORPUS]
      .map((d) => ({
        ...d,
        fused: alpha * normDense[d.id] + (1 - alpha) * normBm25[d.id],
      }))
      .sort((a, b) => b.fused - a.fused);
  }, [alpha, normBm25, normDense]);

  /* ────── Fuse theo RRF với k do người dùng điều chỉnh ─────── */
  const rrfFused = useMemo(() => {
    const bmRank = rankOf(bm25Ranked);
    const deRank = rankOf(denseRanked);
    return [...CORPUS]
      .map((d) => ({
        ...d,
        fused: 1 / (rrfK + bmRank[d.id]) + 1 / (rrfK + deRank[d.id]),
      }))
      .sort((a, b) => b.fused - a.fused);
  }, [bm25Ranked, denseRanked, rrfK]);

  /* ────── Danh sách hiển thị ở cột fuse ───────────────────── */
  const fusedRanked = fuseMode === "convex" ? convexFused : rrfFused;

  /* ────── Handler ─────────────────────────────────────────── */
  const onAlphaChange = useCallback((v: number) => {
    setAlpha(v);
    // Tự chuyển sang convex khi kéo α — dùng để minh hoạ trực quan
    setFuseMode("convex");
  }, []);

  const onKChange = useCallback((v: number) => {
    setRrfK(v);
    setFuseMode("rrf");
  }, []);

  /* ────── Hàm render một hàng trong cột kết quả ─────────────
   * Mỗi hàng hiển thị rank, tiêu đề ngắn, và score dạng bar.
   * Click để chọn tài liệu và xem chi tiết ở panel dưới.
   * ─────────────────────────────────────────────────────────*/
  const renderRow = (
    d: SearchDoc & { fused?: number },
    index: number,
    scoreKey: "bm25" | "dense" | "fused",
    accent: string,
  ) => {
    const score =
      scoreKey === "bm25" ? d.bm25 : scoreKey === "dense" ? d.dense : (d.fused ?? 0);
    const maxScore =
      scoreKey === "bm25" ? 10 : scoreKey === "dense" ? 1 : fuseMode === "convex" ? 1 : 0.05;
    const pct = Math.min(100, (score / maxScore) * 100);
    const isActive = activeDoc === d.id;

    return (
      <motion.button
        key={d.id}
        type="button"
        onClick={() => setActiveDoc(isActive ? null : d.id)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: index * 0.03 }}
        className={`w-full text-left rounded-lg border px-3 py-2 transition-all ${
          isActive
            ? "border-accent bg-accent/10"
            : "border-border bg-card hover:border-accent/50 hover:bg-surface"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-muted">
            {index + 1}
          </span>
          <span className="flex-1 truncate text-xs font-medium text-foreground">
            {d.title}
          </span>
          <span className="text-[10px] font-bold" style={{ color: accent }}>
            {scoreKey === "fused" && fuseMode === "rrf"
              ? score.toFixed(4)
              : score.toFixed(2)}
          </span>
        </div>
        <div className="mt-1.5 h-1 w-full rounded-full bg-surface overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: accent }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </motion.button>
    );
  };

  return (
    <>
      <LessonSection step={1} totalSteps={9} label="Dự đoán">
        <PredictionGate
          question="Bạn xây chatbot nấu ăn tiếng Việt. Người dùng gõ 'cách luộc gà'. BM25 tìm được bài có đúng ba từ 'cách', 'luộc', 'gà'. Dense retrieval tìm được bài 'Kỹ thuật chần gia cầm giữ da giòn' (đồng nghĩa). Lấy kết quả từ đâu?"
          options={[
            "Chỉ BM25 — đảm bảo kết quả chứa đúng từ người dùng gõ",
            "Chỉ Dense — luôn hiểu ngữ nghĩa tốt hơn",
            "KẾT HỢP cả hai — BM25 không bỏ lỡ exact match, Dense không bỏ lỡ đồng nghĩa",
          ]}
          correct={2}
          explanation="Hybrid Search là tiêu chuẩn vàng trong RAG hiện đại. Không có nhánh nào hoàn hảo: BM25 mù trước đồng nghĩa, dense dễ nhiễu với token hiếm. Hợp nhất bằng RRF là cách robust nhất."
        >

      <LessonSection step={2} totalSteps={9} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-6">
            {/* Query bar */}
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Truy vấn
                </span>
                <span className="font-mono text-sm font-bold text-accent">
                  "{QUERY}"
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                {QUERY_TOKENS.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-border bg-card px-2 py-0.5 font-mono"
                  >
                    {t}
                  </span>
                ))}
                <span className="text-muted/70">— token được tách ra cho nhánh BM25</span>
              </div>
            </div>

            {/* Hai điều khiển song song */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Slider α cho convex */}
              <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Convex α = {alpha.toFixed(2)}
                  </label>
                  <button
                    type="button"
                    onClick={() => setFuseMode("convex")}
                    className={`text-[10px] rounded px-2 py-0.5 ${
                      fuseMode === "convex"
                        ? "bg-accent text-white"
                        : "bg-card text-muted border border-border"
                    }`}
                  >
                    áp dụng
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={alpha}
                  onChange={(e) => onAlphaChange(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-muted">
                  <span>α = 0 · chỉ BM25</span>
                  <span>α = 1 · chỉ Dense</span>
                </div>
                <p className="text-[11px] leading-snug text-muted">
                  fused = α · dense_norm + (1 − α) · bm25_norm. Cần chuẩn hoá min-max trước để hai thang đo không lệch.
                </p>
              </div>

              {/* Slider k cho RRF */}
              <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    RRF k = {rrfK}
                  </label>
                  <button
                    type="button"
                    onClick={() => setFuseMode("rrf")}
                    className={`text-[10px] rounded px-2 py-0.5 ${
                      fuseMode === "rrf"
                        ? "bg-accent text-white"
                        : "bg-card text-muted border border-border"
                    }`}
                  >
                    áp dụng
                  </button>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  step="1"
                  value={rrfK}
                  onChange={(e) => onKChange(parseInt(e.target.value, 10))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-muted">
                  <span>k nhỏ · ưu ái top-1</span>
                  <span>k lớn · phân bố phẳng</span>
                </div>
                <p className="text-[11px] leading-snug text-muted">
                  RRF(d) = 1/(k + rank_BM25) + 1/(k + rank_Dense). Không cần chuẩn hoá vì dùng rank.
                </p>
              </div>
            </div>

            {/* 3 cột: BM25, Dense, Fused */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">
                    <span
                      className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                      style={{ backgroundColor: "#ef4444" }}
                    />
                    BM25 (Sparse)
                  </h4>
                  <span className="text-[10px] text-muted">Top 10</span>
                </div>
                <div className="space-y-1.5">
                  {bm25Ranked.map((d, i) => renderRow(d, i, "bm25", "#ef4444"))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">
                    <span
                      className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                      style={{ backgroundColor: "#3b82f6" }}
                    />
                    Dense (Embedding)
                  </h4>
                  <span className="text-[10px] text-muted">Top 10</span>
                </div>
                <div className="space-y-1.5">
                  {denseRanked.map((d, i) => renderRow(d, i, "dense", "#3b82f6"))}
                </div>
              </div>

              <div className="rounded-xl border-2 border-accent/40 bg-accent/5 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">
                    <span
                      className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                      style={{ backgroundColor: "#22c55e" }}
                    />
                    Fused ({fuseMode === "rrf" ? "RRF" : "Convex"})
                  </h4>
                  <span className="text-[10px] font-bold text-accent">HYBRID</span>
                </div>
                <div className="space-y-1.5">
                  {fusedRanked.map((d, i) => renderRow(d, i, "fused", "#22c55e"))}
                </div>
              </div>
            </div>

            {/* Chi tiết tài liệu đang được chọn */}
            {activeDoc && (() => {
              const doc = CORPUS.find((x) => x.id === activeDoc);
              if (!doc) return null;
              const bmRank = bm25Ranked.findIndex((x) => x.id === doc.id) + 1;
              const deRank = denseRanked.findIndex((x) => x.id === doc.id) + 1;
              const fuRank = fusedRanked.findIndex((x) => x.id === doc.id) + 1;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-accent/40 bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono text-muted">{doc.source}</div>
                      <h5 className="text-sm font-bold text-foreground">{doc.title}</h5>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveDoc(null)}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      đóng
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{doc.snippet}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-surface/60 p-2">
                      <div className="text-[10px] text-muted">BM25</div>
                      <div className="text-sm font-bold" style={{ color: "#ef4444" }}>
                        #{bmRank} · {doc.bm25.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded bg-surface/60 p-2">
                      <div className="text-[10px] text-muted">Dense</div>
                      <div className="text-sm font-bold" style={{ color: "#3b82f6" }}>
                        #{deRank} · {doc.dense.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded bg-surface/60 p-2">
                      <div className="text-[10px] text-muted">Fused</div>
                      <div className="text-sm font-bold" style={{ color: "#22c55e" }}>
                        #{fuRank}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Công thức tổng kết */}
            <div className="rounded-lg border border-border bg-background/50 p-4 space-y-2">
              <p className="text-center text-sm text-foreground">
                <strong>Công thức đang hoạt động:</strong>
              </p>
              {fuseMode === "convex" ? (
                <LaTeX block>
                  {`\\text{fused}(d) = ${alpha.toFixed(2)} \\cdot \\tilde{s}_{\\text{dense}}(d) + ${(1 - alpha).toFixed(2)} \\cdot \\tilde{s}_{\\text{BM25}}(d)`}
                </LaTeX>
              ) : (
                <LaTeX block>
                  {`\\text{RRF}(d) = \\frac{1}{${rrfK} + r_{\\text{BM25}}(d)} + \\frac{1}{${rrfK} + r_{\\text{Dense}}(d)}`}
                </LaTeX>
              )}
              <p className="text-center text-[11px] text-muted">
                Kéo các slider phía trên để thấy ranking cột thứ ba thay đổi real-time.
              </p>
            </div>

            {/* So sánh sparse-only / dense-only / hybrid trên toy metric */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h5 className="mb-3 text-xs font-bold text-foreground">
                So sánh tóm tắt (trên toy corpus này, gold = d1, d3, d7)
              </h5>
              <div className="space-y-2">
                {[
                  { name: "BM25 only", precision: 2 / 3, note: "Bỏ lỡ d6 (đồng nghĩa)", color: "#ef4444" },
                  { name: "Dense only", precision: 2 / 3, note: "Kéo d2 (hầm) lên vì cùng semantic", color: "#3b82f6" },
                  { name: "Hybrid RRF", precision: 3 / 3, note: "Bắt đủ cả ba tài liệu vàng", color: "#22c55e" },
                ].map((row) => (
                  <div key={row.name} className="flex items-center gap-3 text-xs">
                    <span className="w-24 shrink-0 font-semibold" style={{ color: row.color }}>
                      {row.name}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.precision * 100}%`, backgroundColor: row.color }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-muted">
                      {(row.precision * 100).toFixed(0)}%
                    </span>
                    <span className="w-48 truncate text-muted">{row.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={9} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Hybrid Search giống như <strong>hỏi hai chuyên gia bổ sung nhau</strong>: chuyên gia A (BM25)
            đọc thuộc lòng từng con chữ — tuyệt vời cho tên riêng, mã SKU, số điều luật; chuyên gia B
            (Dense) hiểu ý định sâu xa — bắt được "chần gia cầm" khi người dùng gõ "luộc gà". Fuse hai
            danh sách bằng RRF không tốn chi phí, không cần normalize, và
            <strong>{" "}thắng consistently trên mọi benchmark MTEB, BEIR, MS MARCO so với từng nhánh riêng lẻ</strong>.
            Đây là lý do mọi hệ thống RAG nghiêm túc năm 2025 đều dùng hybrid ngay từ ngày đầu.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={9} label="Thử thách 1">
        <InlineChallenge
          question="BM25 trả score 0–10, Dense trả cosine 0–1. Bạn cộng thẳng hai số và sort. Chuyện gì xảy ra?"
          options={[
            "Ổn, miễn là cả hai đều dương",
            "BM25 sẽ luôn áp đảo vì thang lớn hơn — tài liệu top chỉ còn phản ánh BM25, nhánh dense bị vô hiệu",
            "Kết quả nhanh hơn vì không cần phép chia",
          ]}
          correct={1}
          explanation="Phải min-max hoặc z-score trước khi cộng. Hoặc dùng RRF — ăn đứt vì dùng rank, không quan tâm scale gốc. Đây là bài học đau thương của nhiều team triển khai hybrid lần đầu."
        />
      </LessonSection>

      <LessonSection step={5} totalSteps={9} label="Thử thách 2">
        <InlineChallenge
          question="Truy vấn: 'CCCD/CMND eKYC Vietcombank điều 27'. Nên nghiêng weight về nhánh nào?"
          options={[
            "Dense — vì LLM hiểu ngữ nghĩa tốt hơn mọi từ",
            "BM25 — vì truy vấn đầy token hiếm, exact match đáng giá hơn ngữ nghĩa",
            "Luôn để α = 0.5 cho an toàn",
          ]}
          correct={1}
          explanation="'CCCD', 'Vietcombank', 'điều 27' là token hiếm, cao IDF. Dense có thể trả về các bài gần gần như 'xác thực khách hàng ngân hàng nói chung'. BM25 sẽ khớp chính xác. Nhiều pipeline chạy 'query classifier' để quyết định α động."
        />
      </LessonSection>

      <LessonSection step={6} totalSteps={9} label="Giải thích sâu">
        <ExplanationSection>
          <p>
            <strong>Hybrid Search</strong>{" "}là pipeline truy xuất kết hợp nhánh
            <TopicLink slug="bm25">BM25</TopicLink> (sparse, lexical) và
            <TopicLink slug="semantic-search">semantic search</TopicLink> (dense, vector).
            Nó thường được nối tiếp bởi bước <TopicLink slug="re-ranking">re-ranking</TopicLink> (cross-encoder)
            để tinh chỉnh top-K cuối cùng trước khi đưa vào LLM.
          </p>

          <p><strong>1. Convex Combination (weighted sum):</strong></p>
          <LaTeX block>
            {"s_{\\text{hybrid}}(d, q) = \\alpha \\cdot \\tilde{s}_{\\text{dense}}(d, q) + (1 - \\alpha) \\cdot \\tilde{s}_{\\text{BM25}}(d, q)"}
          </LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"\\tilde{s}"}</LaTeX> là score đã được chuẩn hoá min-max hoặc z-score. α thường
            nằm trong [0.3, 0.7] tuỳ domain: domain pháp luật nghiêng BM25 (α thấp), domain
            chat tư vấn nghiêng dense (α cao).
          </p>

          <p><strong>2. Reciprocal Rank Fusion (Cormack et al., 2009):</strong></p>
          <LaTeX block>
            {"\\text{RRF}(d) = \\sum_{r \\in R} \\frac{1}{k + r(d)}"}
          </LaTeX>
          <p className="text-sm text-muted">
            <LaTeX>{"R"}</LaTeX> là tập các danh sách rank (BM25, dense, có thể thêm nhánh khác như
            SPLADE, ColBERT). <LaTeX>{"r(d)"}</LaTeX> là vị trí của <LaTeX>{"d"}</LaTeX> trong danh
            sách. k = 60 là mặc định phổ biến. Ưu điểm then chốt: <strong>không cần normalize</strong>,
            thêm nhánh thứ 3, thứ 4 chỉ là cộng thêm một số hạng.
          </p>

          <Callout variant="insight" title="Mổ xẻ từng thành phần của công thức RRF">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Vì sao dùng 1/(k + rank) mà không phải 1/rank?</strong> Nếu đặt
                <LaTeX>{" f(r) = 1/r "}</LaTeX>, tài liệu rank #1 đóng góp 1.0 còn rank
                #2 chỉ 0.5 — chênh lệch quá lớn. Một tài liệu chỉ cần &quot;thắng sít sao&quot;
                ở một nhánh cũng đủ áp đảo. Thêm hằng số k vào mẫu làm mịn đường cong:
                với k = 60, rank #1 đóng góp 1/61 ≈ 0.0164, rank #2 đóng góp 1/62 ≈ 0.0161,
                cách nhau 0.0003. Tài liệu xuất hiện đều ở cả hai nhánh sẽ thắng tài liệu
                chỉ top-1 ở một nhánh.
              </p>
              <p>
                <strong>Vì sao đúng là k = 60?</strong> Cormack, Clarke &amp; Buettcher
                (2009, SIGIR) quét k ∈ {"{"}10, 20, ..., 100{"}"} trên TREC Ad-Hoc, Blog
                và thấy k = 60 cho MAP tối ưu. Con số này trở thành quy ước công nghiệp.
                Trong thực tế, k trong [40, 80] đều gần tương đương; chỉnh k không quan
                trọng bằng chỉnh chất lượng hai nhánh đầu vào.
              </p>
              <p>
                <strong>Tại sao RRF &quot;miễn nhiễm&quot; với scale?</strong> Bất kỳ
                phép biến đổi đơn điệu nào <LaTeX>{"\\phi"}</LaTeX> trên score cũng giữ
                nguyên rank: <LaTeX>{"s_1 > s_2 \\Leftrightarrow \\phi(s_1) > \\phi(s_2)"}</LaTeX>.
                Vì RRF chỉ đọc rank, thay BM25 × 1000 hay log(BM25) đều không đổi output.
                Với convex, mọi biến đổi đều thay đổi phân phối → phải normalize.
              </p>
              <p>
                <strong>Mở rộng sang N nhánh.</strong> Công thức tổng quát là{" "}
                <LaTeX>{"\\text{RRF}(d) = \\sum_{i=1}^{N} w_i \\cdot \\frac{1}{k + r_i(d)}"}</LaTeX>
                . Với <LaTeX>{"w_i = 1"}</LaTeX> ta có RRF thuần; có thể đặt{" "}
                <LaTeX>{"w_i"}</LaTeX> khác để &quot;tin&quot; nhánh chất lượng cao hơn
                (ví dụ SPLADE cao hơn BM25). Khi N tăng, RRF càng ổn định — đây là lý
                do Vespa, Vald cho phép 4–5 nhánh fuse.
              </p>
            </div>
          </Callout>

          <Callout variant="warning" title="Biến thể RRF bạn cần biết">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Weighted RRF:</strong> <LaTeX>{"\\sum w_i/(k + r_i)"}</LaTeX>,
                dùng khi biết trước nhánh nào mạnh. Meta AI, Cohere dùng weight động
                từ router LLM.
              </li>
              <li>
                <strong>Distribution-based fusion (DBF):</strong> thay 1/(k+r) bằng
                1/(k + r^p). p &gt; 1 làm đuôi rank phạt nặng hơn; p &lt; 1 làm đuôi
                mượt hơn.
              </li>
              <li>
                <strong>Truncated RRF:</strong> chỉ tính top-N mỗi nhánh, các tài liệu
                ngoài top-N đóng góp 0. Giảm nhiễu từ &quot;long tail&quot; irrelevant.
              </li>
              <li>
                <strong>Probabilistic RRF:</strong> xem 1/(k+r) như một probability mass,
                normalize để tổng = 1, rồi cộng như xác suất. Dễ diễn giải bằng ngôn
                ngữ Bayesian.
              </li>
            </ul>
          </Callout>

          <Callout variant="info" title="Khi RRF KHÔNG tốt bằng convex">
            <p className="text-sm">
              RRF mất thông tin khoảng cách: nếu BM25 top-1 = 50 và top-2 = 2 (top-1
              áp đảo tuyệt đối), RRF vẫn cho top-2 điểm gần top-1. Trong các bài
              factual retrieval (câu hỏi có một đáp án duy nhất), gap score lớn là
              tín hiệu mạnh → convex ăn RRF 2–4% NDCG. Nhưng trong open-domain
              question answering, nhiều đáp án cùng tốt, RRF lại thắng vì stable hơn.
              Lựa chọn nên dựa trên bài toán, không phải công thức.
            </p>
          </Callout>

          <Callout variant="insight" title="3 họ phương pháp fuse phổ biến">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Convex Combination:</strong>{" "}Đơn giản, có một hyperparameter α. Yếu điểm: nhạy với
                phân phối score, phải chuẩn hoá kỹ. Phù hợp khi team đã có pipeline normalize ổn định.
              </p>
              <p>
                <strong>RRF:</strong>{" "}Dùng rank, không cần normalize, hyperparameter k dễ tune (thường để 60).
                Phù hợp production — đây là mặc định của Elasticsearch 8.9+, Weaviate, Vespa.
              </p>
              <p>
                <strong>Learned Fusion:</strong>{" "}Huấn luyện một mô hình nhỏ (LightGBM, tiny MLP) nhận
                score hai nhánh + query features để học trọng số tối ưu. Tốt nhất khi có click data hoặc
                relevance judgements — xem bài của Uber Eats, Spotify, Amazon.
              </p>
            </div>
          </Callout>

          <Callout variant="warning" title="Các lỗi triển khai hybrid thường gặp">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Quên chuẩn hoá BM25 và cosine trước convex → nhánh scale lớn áp đảo, dense gần như vô dụng</li>
              <li>Dùng cùng một HNSW index cho cả hai nhánh → sparse không dùng được HNSW, phải có inverted index</li>
              <li>Lấy top-10 mỗi nhánh rồi fuse → nếu tài liệu tốt nằm ở rank 15 của nhánh kia thì bị rớt, nên lấy top-100 rồi fuse xuống top-10</li>
              <li>Đặt α cố định cho mọi query — query-dependent fusion bằng LLM classifier thường tăng 3–8% NDCG</li>
              <li>Bỏ qua bước re-ranking — hybrid chỉ là <em>recall</em>, cross-encoder mới cho <em>precision</em></li>
            </ul>
          </Callout>

          <Callout variant="info" title="Hybrid trong hệ sinh thái năm 2025">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Elasticsearch 8.9+:</strong>{" "}Native RRF trong một request duy nhất</li>
              <li><strong>Weaviate:</strong>{" "}Hybrid API với param <code>alpha</code>, fusion_type = "ranked" (RRF) hoặc "relative_score"</li>
              <li><strong>Qdrant 1.10+:</strong>{" "}Query API hỗ trợ sparse + dense + fusion trong một payload</li>
              <li><strong>Pinecone:</strong>{" "}Sparse-dense vectors qua SPLADE</li>
              <li><strong>pgvector + pg_trgm:</strong>{" "}Tự triển khai trong PostgreSQL, kiểm soát 100%</li>
              <li><strong>Vespa:</strong>{" "}Ranking expressions linh hoạt, nested rank profiles — lựa chọn của Spotify, Yahoo</li>
            </ul>
          </Callout>

          <Callout variant="tip" title="Khi nào KHÔNG cần hybrid?">
            <p className="text-sm">
              Nếu corpus nhỏ (&lt; 10k), query ngắn không có token hiếm, và bạn đã có cross-encoder
              re-ranker mạnh, pure dense có thể đủ. Với corpus công khai lớn (Wikipedia, web crawl),
              pure BM25 + cross-encoder cũng xuất sắc (xem ColBERTv2, monoT5). Hybrid tỏa sáng nhất
              khi corpus chứa hỗn hợp nội dung đa dạng và query chứa cả tên riêng lẫn câu tự nhiên — đây
              chính là trường hợp mọi chatbot doanh nghiệp.
            </p>
          </Callout>

          <CollapsibleDetail title="Chi tiết toán học của chuẩn hoá min-max vs z-score">
            <div className="space-y-3 text-sm">
              <p>
                <strong>Min-max normalization:</strong>
              </p>
              <LaTeX block>{"\\tilde{s}(d) = \\frac{s(d) - \\min_i s(d_i)}{\\max_i s(d_i) - \\min_i s(d_i)}"}</LaTeX>
              <p className="text-muted">
                Đưa mọi score về [0, 1]. Nhược điểm: nhạy với outlier. Một tài liệu BM25 cực cao có thể
                kéo tất cả các tài liệu còn lại về sát 0.
              </p>
              <p>
                <strong>Z-score normalization:</strong>
              </p>
              <LaTeX block>{"\\tilde{s}(d) = \\frac{s(d) - \\mu}{\\sigma}"}</LaTeX>
              <p className="text-muted">
                Trung bình 0, độ lệch chuẩn 1. Robust hơn min-max khi có outlier. Nhược điểm: có thể cho
                score âm, phải cộng thêm hằng số nếu sau đó cần score dương.
              </p>
              <p>
                <strong>Sigmoid normalization:</strong>
              </p>
              <LaTeX block>{"\\tilde{s}(d) = \\sigma(s(d) / T)"}</LaTeX>
              <p className="text-muted">
                Hàm sigmoid với nhiệt độ T. Mềm hơn min-max ở đuôi phân phối. Phổ biến trong các hệ thống
                học sâu khi cần differentiability.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chứng minh tính ổn định của RRF với outlier">
            <div className="space-y-3 text-sm">
              <p>
                Giả sử nhánh BM25 có một tài liệu điểm bất thường cao (outlier). Trong convex combination,
                outlier này sẽ chi phối toàn bộ fusion — các tài liệu khác gần như không đóng góp. Nhưng
                trong RRF, <em>chỉ rank mới quan trọng</em>. Outlier có BM25 = 1000 hay BM25 = 10 đều dẫn
                đến cùng một rank #1, đóng góp 1/(k + 1) như nhau.
              </p>
              <p>
                Đây là lý do Cormack et al. (2009) chứng minh thực nghiệm RRF robust hơn CombSUM và
                CombMNZ trên TREC Legal, Blog, Web. Tính chất này cực kỳ giá trị trong production khi
                distribution của score có thể drift theo thời gian.
              </p>
              <p>
                Nhược điểm đối ngẫu: RRF "mất thông tin" khi score gap giữa top-1 và top-2 khổng lồ. Một
                tài liệu BM25 = 100 và top-2 = 10 trong convex sẽ cách nhau 10 đơn vị, trong RRF chỉ cách
                1/(k+1) − 1/(k+2). Nếu gap score là tín hiệu quan trọng của relevance, convex có thể tốt hơn.
              </p>
            </div>
          </CollapsibleDetail>

          <p><strong>Đánh giá hybrid trên dữ liệu tiếng Việt:</strong></p>
          <p className="text-sm">
            Trên tập Vietnamese MS MARCO dịch máy (được cộng đồng VinAI công bố) và trên tập
            <em>zalo-ai-challenge 2021 legal retrieval</em>, pure BM25 đạt NDCG@10 ≈ 0.42, pure
            multilingual-e5-base đạt 0.51, còn hybrid RRF (k = 60) đạt 0.58. Re-rank bằng
            bge-reranker-v2-m3 đẩy lên 0.64. Cải thiện 22% NDCG chỉ bằng việc ghép thêm BM25 và
            một cross-encoder nhẹ — đây là lý do không team nghiêm túc nào xây RAG tiếng Việt mà
            bỏ qua hybrid.
          </p>

          <Callout variant="tip" title="Quy tắc ngón tay cái khi chọn α ban đầu">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>α = 0.3</strong>{" "}— domain pháp luật, y tế, tài chính (nhiều token chuyên ngành, code SKU, số điều khoản)</li>
              <li><strong>α = 0.5</strong>{" "}— domain chung, tin tức, blog, ecommerce đa dạng</li>
              <li><strong>α = 0.7</strong>{" "}— chatbot tư vấn, hỏi đáp tự nhiên, FAQ ngữ nghĩa</li>
              <li><strong>α ∈ [0.4, 0.6]</strong>{" "}— điểm mặc định an toàn nếu chưa có click data</li>
            </ul>
            <p className="text-sm mt-2">
              Sau khi có ít nhất 1000 click labels, hãy grid-search α ∈ {"{"} 0.1, 0.2, ..., 0.9 {"}"} trên
              NDCG@10 hoặc MRR@10 để chốt giá trị tối ưu theo từng phân khúc query.
            </p>
          </Callout>

          <CollapsibleDetail title="So sánh với SPLADE và ColBERT — hai đối thủ của Hybrid truyền thống">
            <div className="space-y-3 text-sm">
              <p>
                <strong>SPLADE</strong>{" "}(Sparse Lexical AnD Expansion) sinh sparse vector từ BERT,
                mỗi chiều là một token trong vocabulary. Nó "học BM25" bằng gradient descent: query
                "cách luộc gà" không chỉ kích hoạt các token lexical mà còn expand sang các từ ngữ
                nghĩa gần ("chần", "trụng", "gia cầm"). Trên BEIR, SPLADE một mình đã đánh bại BM25
                và gần tiệm cận dense retrieval. Có thể thay thế nhánh BM25 trong hybrid để tạo
                "hybrid nặng hơn" (SPLADE + dense + RRF).
              </p>
              <p>
                <strong>ColBERT</strong>{" "}(Contextualized Late Interaction over BERT) lưu vector cho
                mỗi token thay vì một vector cho cả passage. Match bằng MaxSim giữa mọi cặp token
                query/passage. Rất mạnh nhưng index lớn gấp 20 lần dense đơn thuần. Thường dùng ở
                bước re-rank chứ không phải recall. ColBERTv2 với residual compression đã giảm index
                còn 3x dense.
              </p>
              <p>
                <strong>Khi nào dùng gì:</strong>{" "}Với budget index rẻ, stick với BM25 + dense + RRF.
                Với budget vừa, SPLADE + dense + RRF. Với budget không giới hạn và cần SOTA precision,
                BM25 + dense + RRF rồi ColBERTv2 re-rank top-100.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Cài đặt chi tiết 5 reranker phổ biến — so sánh điểm mạnh/yếu">
            <div className="space-y-3 text-sm">
              <p>
                <strong>1. MS MARCO MiniLM (cross-encoder/ms-marco-MiniLM-L-6-v2).</strong>
                {" "}22M params, chạy được trên CPU cho top-20 candidate. Encode
                [CLS] query [SEP] doc [SEP], lấy logit của [CLS] qua một linear head
                làm relevance score. Fine-tuned từ MS MARCO với pairwise ranking loss.
                Ưu điểm: cực nhẹ, latency ~5ms/candidate trên GPU T4. Nhược: yếu với
                non-English, không hiểu domain chuyên biệt (luật, y).
              </p>
              <p>
                <strong>2. BGE Reranker v2-m3 (BAAI/bge-reranker-v2-m3).</strong>
                {" "}568M params, multilingual 100+ ngôn ngữ. Kiến trúc XLM-RoBERTa
                large được fine-tune trên dữ liệu pairwise đa ngôn ngữ bao gồm
                tiếng Việt. Đây là reranker được khuyến nghị cho RAG tiếng Việt hiện
                nay: trên zalo-legal-retrieval, bge-reranker-v2-m3 cho NDCG@10 = 0.71
                so với MiniLM = 0.58. Latency ~25ms/candidate trên A10G, ~80ms trên
                T4. Có bản int8 quantized giảm 50% memory.
              </p>
              <p>
                <strong>3. Cohere Rerank 3.</strong> Managed API, multilingual, window
                dài 4096 tokens. Tính phí $2/1k search. Ưu điểm: không cần tự host,
                chất lượng SOTA trên BEIR. Nhược: phụ thuộc provider, latency mạng
                50–150ms. Phù hợp MVP hoặc team không có MLOps.
              </p>
              <p>
                <strong>4. ColBERTv2 (stanford-futuredata/ColBERTv2).</strong> Late
                interaction: lưu embedding cho mỗi token trong passage, match bằng
                MaxSim. Không phải cross-encoder thuần nhưng mạnh hơn bi-encoder nhiều.
                Index 3–5x dense thông thường nhưng latency re-rank chỉ ~3ms/candidate
                trên GPU. Phù hợp khi index size không bị giới hạn. PLAID engine tối
                ưu thêm bằng product quantization.
              </p>
              <p>
                <strong>5. monoT5 (castorini/monot5-base-msmarco-10k).</strong> Đặt
                bài toán re-ranking như text-generation: input =
                &quot;Query: ... Document: ... Relevant:&quot;, output = &quot;true&quot;
                hoặc &quot;false&quot;. Dùng logit của token &quot;true&quot; làm score.
                220M params, chất lượng giữa MiniLM và BGE, training đơn giản vì chỉ
                cần pair (q, d, label). Ít phổ biến hơn nhưng dễ fine-tune trên domain
                nhỏ.
              </p>
              <p>
                <strong>Quy tắc chọn:</strong> Web/ecommerce đa ngôn ngữ → BGE v2-m3.
                English-only và budget hẹp → MiniLM. MVP/prototype → Cohere. Corpus
                cực lớn, cần SOTA precision → ColBERTv2. Domain rất đặc thù (pháp
                luật, y) → fine-tune monoT5 hoặc BGE trên ~5k pair nội bộ.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Cài đặt Weaviate RELATIVE_SCORE fusion — khác RRF thế nào">
            <div className="space-y-3 text-sm">
              <p>
                Weaviate cung cấp hai fusion strategy: <code>RANKED</code> (RRF) và
                <code>RELATIVE_SCORE</code>. RELATIVE_SCORE hoạt động như sau:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>
                  Từ mỗi nhánh (BM25, vector), lấy <em>raw score</em> của top-N.
                </li>
                <li>
                  Áp min-max normalization trong từng nhánh:{" "}
                  <LaTeX>{"s'_i = (s_i - s_{min}) / (s_{max} - s_{min})"}</LaTeX>, đưa
                  về [0, 1].
                </li>
                <li>
                  Tài liệu không xuất hiện trong một nhánh được gán score normalized = 0
                  ở nhánh đó.
                </li>
                <li>
                  Weighted sum với alpha: <LaTeX>{"s = \\alpha \\cdot s'_\\text{vector} + (1-\\alpha) \\cdot s'_\\text{BM25}"}</LaTeX>.
                </li>
              </ol>
              <p>
                <strong>Khác RRF:</strong> RELATIVE_SCORE giữ &quot;khoảng cách&quot;
                — nếu BM25 top-1 cách top-2 một khoảng cực lớn, top-1 vẫn áp đảo sau
                normalize. RRF xoá sạch thông tin này, chỉ quan tâm rank.
              </p>
              <p>
                <strong>Bài test Weaviate official:</strong> Trên MS MARCO Dev, hai
                fusion gần tương đương (NDCG@10 chênh &lt; 0.01). Trên NQ-open, RELATIVE
                cao hơn 0.015. Trên TREC-COVID, RRF cao hơn 0.02. Kết luận của Weaviate
                team: &quot;mặc định RELATIVE cho tiếng tự nhiên, mặc định RRF cho
                factoid&quot;. Nhưng difference nhỏ, hãy A/B test trên query log thật
                của bạn.
              </p>
              <p>
                <strong>Ghi nhớ quan trọng:</strong> Weaviate tính alpha = 0 là pure
                BM25, alpha = 1 là pure vector — ngược với một số hệ khác (ví dụ
                Vespa). Luôn đọc doc trước khi chuyển provider.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Cài đặt Qdrant Query API fusion — sparse + dense trong một payload">
            <div className="space-y-3 text-sm">
              <p>
                Từ Qdrant 1.10, Query API hỗ trợ fusion trực tiếp trong client. Ví dụ
                payload REST:
              </p>
              <CodeBlock language="json" title="POST /collections/recipes/points/query">
{`{
  "prefetch": [
    {
      "query": {
        "text": "cách luộc gà",
        "model": "Qdrant/bm25"
      },
      "using": "bm25_vector",
      "limit": 100
    },
    {
      "query": [0.12, 0.03, -0.88, ...],
      "using": "dense_vector",
      "limit": 100
    }
  ],
  "query": { "fusion": "rrf" },
  "limit": 10,
  "with_payload": true
}`}
              </CodeBlock>
              <p>
                Qdrant hỗ trợ <code>fusion: rrf</code> và <code>fusion: dbsf</code>
                (Distribution-Based Score Fusion — normalize score theo phân phối rồi
                cộng). <code>dbsf</code> giống RELATIVE nhưng dùng z-score thay vì
                min-max; tốt hơn khi có outlier.
              </p>
              <p>
                <strong>Thủ thuật performance:</strong> Qdrant lưu sparse và dense
                trong hai named vectors cùng collection. Cùng một point có cả
                <code>bm25_vector</code> và <code>dense_vector</code>, index riêng
                (inverted index cho sparse, HNSW cho dense). Query fan-out nội bộ,
                latency p95 thường &lt; 60ms trên 10M điểm với 4 vCPU.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Query-dependent fusion: LLM chọn α theo từng truy vấn">
            <div className="space-y-3 text-sm">
              <p>
                Một α cố định không tối ưu cho mọi query. Kỹ thuật hiện đại: dùng một LLM nhỏ (hoặc
                classifier trên Transformer embedding) để phân loại query vào các nhóm lexical-heavy,
                semantic-heavy, hoặc balanced, rồi chọn α tương ứng.
              </p>
              <p>
                <strong>Ví dụ router đơn giản bằng GPT-4o-mini với prompt caching:</strong> input là
                query, output là một trong {"{"} "LEXICAL" (α = 0.2), "BALANCED" (α = 0.5), "SEMANTIC"
                (α = 0.8) {"}"}. Prompt có ví dụ few-shot, cache prefix cố định. Latency thêm ~60ms
                per query nhưng cải thiện 3–8% NDCG trên query log Zalo AI.
              </p>
              <p>
                <strong>Rule-based fallback:</strong>{" "}Nếu query chứa tỷ lệ token không thuộc
                vocabulary phổ thông ({'>'}30% là tên riêng, số, mã), tự động chọn LEXICAL. Nếu query
                là câu hỏi WH tự nhiên dài {'>'}10 từ, chọn SEMANTIC. Nếu không có tín hiệu rõ, dùng
                BALANCED.
              </p>
            </div>
          </CollapsibleDetail>

          <p><strong>Triển khai Elasticsearch 8.9+ native RRF:</strong></p>
          <CodeBlock language="json" title="POST /cooking-recipes/_search — hybrid BM25 + kNN với RRF">
{`{
  "retriever": {
    "rrf": {
      "retrievers": [
        {
          "standard": {
            "query": {
              "bool": {
                "must": [
                  { "match": { "title": "cách luộc gà" } },
                  { "match": { "body":  "cách luộc gà" } }
                ]
              }
            }
          }
        },
        {
          "knn": {
            "field": "embedding",
            "query_vector_builder": {
              "text_embedding": {
                "model_id": "multilingual-e5-base",
                "model_text": "cách luộc gà"
              }
            },
            "k": 50,
            "num_candidates": 100
          }
        }
      ],
      "rank_window_size": 100,
      "rank_constant": 60
    }
  },
  "size": 10,
  "_source": ["title", "url", "snippet"]
}

// ─── Python client ──────────────────────────────────────────
from elasticsearch import Elasticsearch

es = Elasticsearch("https://search.example.com:9200")

def hybrid_search(query: str, size: int = 10):
    body = {
        "retriever": {
            "rrf": {
                "retrievers": [
                    {
                        "standard": {
                            "query": {
                                "multi_match": {
                                    "query": query,
                                    "fields": ["title^2", "body"],
                                    "type": "best_fields"
                                }
                            }
                        }
                    },
                    {
                        "knn": {
                            "field": "embedding",
                            "query_vector_builder": {
                                "text_embedding": {
                                    "model_id": "multilingual-e5-base",
                                    "model_text": query
                                }
                            },
                            "k": 50,
                            "num_candidates": 100
                        }
                    }
                ],
                "rank_window_size": 100,
                "rank_constant": 60
            }
        },
        "size": size
    }
    return es.search(index="cooking-recipes", body=body)

for hit in hybrid_search("cách luộc gà")["hits"]["hits"]:
    print(f"#{hit['_rank']:<3}  {hit['_source']['title']}")
`}
          </CodeBlock>

          <p><strong>Triển khai thuần Python với Weaviate + RRF thủ công:</strong></p>
          <CodeBlock language="python" title="Hybrid search với Weaviate + cross-encoder re-ranking">
{`import weaviate
from sentence_transformers import CrossEncoder

client = weaviate.connect_to_local()
recipes = client.collections.get("VnRecipes")

# ── Nhánh 1: hybrid sẵn có của Weaviate (BM25 + Vector) ─────
def weaviate_hybrid(query: str, alpha: float = 0.5, limit: int = 50):
    response = recipes.query.hybrid(
        query=query,
        alpha=alpha,                       # 0 = BM25 only, 1 = vector only
        fusion_type=weaviate.classes.query.HybridFusion.RELATIVE_SCORE,
        limit=limit,
        return_metadata=weaviate.classes.query.MetadataQuery(
            score=True, explain_score=True
        ),
    )
    return response.objects

# ── Nhánh 2: RRF thủ công khi muốn thêm nhánh thứ ba ────────
def rrf_fusion(rankings: list[list[str]], k: int = 60) -> dict[str, float]:
    scores = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(ranking):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)
    return dict(sorted(scores.items(), key=lambda x: -x[1]))

# ── Nhánh 3: cross-encoder re-ranking trên top-K ──────────────
reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")

def rerank(query: str, candidates: list[dict], top_k: int = 10):
    pairs = [(query, c["content"]) for c in candidates]
    scores = reranker.predict(pairs, batch_size=32)
    for c, s in zip(candidates, scores):
        c["rerank_score"] = float(s)
    return sorted(candidates, key=lambda x: -x["rerank_score"])[:top_k]

# ── Pipeline hoàn chỉnh ─────────────────────────────────────
def search_pipeline(query: str, top_k: int = 10):
    # Recall rộng với hybrid
    candidates = weaviate_hybrid(query, alpha=0.5, limit=100)
    docs = [{
        "id": c.uuid,
        "content": c.properties["body"],
        "title": c.properties["title"],
        "score_hybrid": c.metadata.score,
    } for c in candidates]

    # Precision với cross-encoder
    return rerank(query, docs, top_k=top_k)

if __name__ == "__main__":
    results = search_pipeline("cách luộc gà cúng không nứt da")
    for i, r in enumerate(results, 1):
        print(f"#{i:<3}  {r['rerank_score']:.3f}  {r['title']}")
`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={7} totalSteps={9} label="Tóm tắt">
        <MiniSummary points={[
          "Hybrid Search = nhánh BM25 (sparse, exact match) + nhánh Dense (embedding, ngữ nghĩa) — bổ sung điểm yếu của nhau",
          "Convex combination: α · dense_norm + (1-α) · bm25_norm, cần chuẩn hoá min-max hoặc z-score trước để hai thang đo không lệch",
          "RRF = 1/(k + rank_BM25) + 1/(k + rank_Dense), k = 60 mặc định — dùng rank nên không cần normalize, robust với outlier",
          "α gần 0 nghiêng BM25 (tên riêng, mã SKU, điều luật). α gần 1 nghiêng dense (câu hỏi tự nhiên, đồng nghĩa)",
          "Luôn lấy top-100 từ mỗi nhánh rồi fuse xuống top-10; sau đó re-rank bằng cross-encoder để đạt precision tối đa",
          "Elasticsearch 8.9+, Weaviate, Qdrant, Vespa đều hỗ trợ RRF native — hybrid là tiêu chuẩn RAG năm 2025",
        ]} />
      </LessonSection>

      <LessonSection step={8} totalSteps={9} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>

      <LessonSection step={9} totalSteps={9} label="Tiến độ">
        <ProgressSteps
          current={9}
          total={9}
          labels={[
            "Dự đoán",
            "Khám phá",
            "Aha",
            "Thử thách 1",
            "Thử thách 2",
            "Giải thích",
            "Tóm tắt",
            "Kiểm tra",
            "Hoàn thành",
          ]}
        />
      </LessonSection>
        </PredictionGate>
      </LessonSection>
    </>
  );
}
