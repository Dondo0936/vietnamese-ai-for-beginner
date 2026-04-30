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

/* ─────────────────────────────────────────────────────────────
   METADATA — GloVe topic
   Giữ nguyên slug, chỉ mở rộng mô tả học thuật cho phần tóm tắt
   ───────────────────────────────────────────────────────────── */
export const metadata: TopicMeta = {
  slug: "glove",
  title: "GloVe",
  titleVi: "GloVe - Biểu diễn vector toàn cục",
  description:
    "Phương pháp học biểu diễn từ dựa trên ma trận đồng xuất hiện toàn cục, kết hợp ưu điểm của phương pháp toàn cục và cục bộ.",
  category: "nlp",
  tags: ["nlp", "representation-learning", "embedding"],
  difficulty: "intermediate",
  relatedSlugs: ["word2vec", "word-embeddings", "bag-of-words"],
  vizType: "interactive",
};

/* ─────────────────────────────────────────────────────────────
   CONSTANTS — Bộ dữ liệu tiếng Việt 10×10
   Ý tưởng: chọn 10 từ phổ biến thuộc 3 cụm ngữ nghĩa:
     • Ẩm thực miền Bắc: phở, bún, chả, ngon
     • Địa danh / giao thông: Hà Nội, xe máy, đường phố
     • Cảm xúc / đánh giá: tuyệt, thích, đông
   Ma trận X_ij mô phỏng số lần đồng xuất hiện trong cửa sổ ±5 từ
   trên một corpus tiếng Việt ~10M tokens (mô phỏng, không phải số thật).
   ───────────────────────────────────────────────────────────── */
const TOTAL_STEPS = 10;

const WORDS = [
  "phở",         // 0  — món ăn
  "bún",         // 1  — món ăn
  "chả",         // 2  — món ăn (đi với bún)
  "ngon",        // 3  — tính từ đánh giá món ăn
  "Hà Nội",      // 4  — địa danh
  "xe máy",      // 5  — phương tiện
  "đường phố",   // 6  — địa điểm đô thị
  "tuyệt",       // 7  — tính từ cảm xúc
  "thích",       // 8  — động từ cảm xúc
  "đông",        // 9  — tính từ mật độ
] as const;

// Ma trận đồng xuất hiện đối xứng — X[i][j] = X[j][i]
// Đường chéo = 0 (không tính từ với chính nó)
const COOC: number[][] = [
  // phở  bún  chả  ngon HN   xe   đg   tuyệt thích đông
  [   0,  12,   9,  18,  14,   2,   3,   8,  10,   5], // phở
  [  12,   0,  22,  16,  11,   1,   2,   6,   9,   4], // bún
  [   9,  22,   0,  13,   7,   0,   1,   5,   6,   2], // chả
  [  18,  16,  13,   0,   9,   0,   2,  20,  24,   3], // ngon
  [  14,  11,   7,   9,   0,  19,  21,  11,   7,  23], // Hà Nội
  [   2,   1,   0,   0,  19,   0,  25,   3,   4,  18], // xe máy
  [   3,   2,   1,   2,  21,  25,   0,   5,   3,  27], // đường phố
  [   8,   6,   5,  20,  11,   3,   5,   0,  22,   4], // tuyệt
  [  10,   9,   6,  24,   7,   4,   3,  22,   0,   2], // thích
  [   5,   4,   2,   3,  23,  18,  27,   4,   2,   0], // đông
];

// Màu cụm ngữ nghĩa — hiển thị embedding 2D
const CLUSTER = [0, 0, 0, 0, 1, 1, 1, 2, 2, 1];
const CLUSTER_COLOR = ["#f59e0b", "#3b82f6", "#ef4444"];
const CLUSTER_NAME = ["Ẩm thực", "Đô thị / Giao thông", "Cảm xúc"];

// Embedding 2D mô phỏng — kết quả sau khi GloVe hội tụ
// (thực tế vector có 50-300 chiều, đây là phép chiếu PCA/t-SNE giả)
const EMBED_2D: [number, number][] = [
  [ 0.82, -0.41], // phở
  [ 0.75, -0.52], // bún
  [ 0.68, -0.58], // chả
  [ 0.91,  0.12], // ngon (nằm giữa ẩm thực & cảm xúc vì đi với cả hai)
  [-0.35, -0.18], // Hà Nội
  [-0.78,  0.21], // xe máy
  [-0.85,  0.08], // đường phố
  [ 0.45,  0.72], // tuyệt
  [ 0.58,  0.68], // thích
  [-0.62,  0.35], // đông
];

// Các query analogy để so sánh GloVe vs Word2Vec
interface AnalogyResult {
  query: string;
  expected: string;
  gloveResult: string;
  gloveScore: number;
  w2vResult: string;
  w2vScore: number;
  note: string;
}

const ANALOGY_QUERIES: AnalogyResult[] = [
  {
    query: "vua − đàn ông + phụ nữ",
    expected: "hoàng hậu",
    gloveResult: "hoàng hậu",
    gloveScore: 0.78,
    w2vResult: "hoàng hậu",
    w2vScore: 0.76,
    note: "Cả hai đều bắt được quan hệ giới tính.",
  },
  {
    query: "Paris − Pháp + Việt Nam",
    expected: "Hà Nội",
    gloveResult: "Hà Nội",
    gloveScore: 0.81,
    w2vResult: "Hà Nội",
    w2vScore: 0.74,
    note: "GloVe nhỉnh hơn nhờ thống kê toàn cục về địa danh.",
  },
  {
    query: "phở − bún + xôi",
    expected: "gà / thịt",
    gloveResult: "xôi gà",
    gloveScore: 0.69,
    w2vResult: "xôi đỗ",
    w2vScore: 0.65,
    note: "Cả hai đều hiểu phở-bún là cặp món nước.",
  },
  {
    query: "lớn − to + nhỏ",
    expected: "bé",
    gloveResult: "bé",
    gloveScore: 0.84,
    w2vResult: "bé",
    w2vScore: 0.82,
    note: "Quan hệ phản nghĩa — cả hai đều vững.",
  },
  {
    query: "đi − chạy + bay",
    expected: "bay lượn / cất cánh",
    gloveResult: "cất cánh",
    gloveScore: 0.71,
    w2vResult: "vỗ cánh",
    w2vScore: 0.62,
    note: "GloVe tận dụng thống kê toàn cục động từ chuyển động.",
  },
];

// Điểm dữ liệu của hàm f(x) để vẽ đường cong weighted cost
// f(x) = (x/xmax)^alpha nếu x < xmax, ngược lại = 1
const X_MAX = 100;
const ALPHA = 0.75;
function weightFn(x: number): number {
  if (x <= 0) return 0;
  if (x >= X_MAX) return 1;
  return Math.pow(x / X_MAX, ALPHA);
}

/* ─────────────────────────────────────────────────────────────
   QUIZ — 8 câu đa dạng mức độ
   ───────────────────────────────────────────────────────────── */
const QUIZ: QuizQuestion[] = [
  {
    question: "GloVe khác Word2Vec ở điểm cốt lõi nào?",
    options: [
      "GloVe dùng neural network sâu hơn",
      "GloVe dùng thống kê đồng xuất hiện TOÀN CỤC, Word2Vec dùng cửa sổ CỤC BỘ",
      "GloVe chỉ dùng cho tiếng Anh",
      "GloVe không tạo word embeddings",
    ],
    correct: 1,
    explanation:
      "Word2Vec nhìn từng cửa sổ cục bộ (local). GloVe xây ma trận đồng xuất hiện toàn cục (global) rồi phân tích — kết hợp ưu điểm cả hai trường phái.",
  },
  {
    question:
      "Trong ma trận đồng xuất hiện 10×10 của chúng ta, giá trị X(bún, chả) = 22 có nghĩa gì?",
    options: [
      "'Bún' và 'chả' giống nhau 22%",
      "'Bún' và 'chả' xuất hiện gần nhau 22 lần trong toàn bộ corpus",
      "'Bún' có 22 biến thể",
      "'Chả' xuất hiện 22 lần trong dữ liệu",
    ],
    correct: 1,
    explanation:
      "Ma trận X_ij đếm số lần hai từ xuất hiện cùng cửa sổ trên TOÀN BỘ corpus. 22 là giá trị cao — phản ánh 'bún chả' là cụm từ cực kỳ phổ biến trong tiếng Việt.",
  },
  {
    question: "GloVe tối ưu hàm mất mát nào?",
    options: [
      "Cross-entropy loss trên xác suất từ tiếp theo",
      "Tích vô hướng vector ≈ logarithm số lần đồng xuất hiện",
      "Mean squared error trên xác suất phân loại",
      "Contrastive loss kiểu SimCLR",
    ],
    correct: 1,
    explanation:
      "GloVe muốn: w_i · w_j + b_i + b_j ≈ log(X_ij). Nếu bún và chả đồng xuất hiện nhiều (X=22), tích vô hướng vector của chúng phải lớn → vector gần nhau trong không gian.",
  },
  {
    type: "fill-blank",
    question:
      "GloVe học embedding bằng cách phân tích ma trận {blank} (co-occurrence) trên toàn bộ corpus, tận dụng thống kê {blank} thay vì chỉ nhìn cửa sổ cục bộ như Word2Vec.",
    blanks: [
      { answer: "đồng xuất hiện", accept: ["co-occurrence", "cooccurrence", "đồng xuất hiện"] },
      { answer: "toàn cục", accept: ["global", "toàn cục", "global co-occurrence"] },
    ],
    explanation:
      "GloVe = Global Vectors. Bước 1: đếm X_ij trên toàn corpus. Bước 2: tối ưu để w_i · w_j ≈ log(X_ij). Nhờ thống kê toàn cục, GloVe ổn định hơn và dễ song song hóa.",
  },
  {
    question:
      "Hàm trọng số f(X_ij) trong cost function của GloVe có tác dụng gì?",
    options: [
      "Tăng tốc gradient descent",
      "Giảm ảnh hưởng của cặp từ đồng xuất hiện quá ít (nhiễu) VÀ giới hạn ảnh hưởng của cặp xuất hiện quá nhiều (như 'the', 'của')",
      "Chuẩn hoá vector về độ dài 1",
      "Chọn ngẫu nhiên cặp từ để train",
    ],
    correct: 1,
    explanation:
      "f(x) = (x/xmax)^α nếu x<xmax, ngược lại = 1. Cặp xuất hiện ít được đánh trọng số nhỏ (thống kê không đáng tin), cặp xuất hiện rất nhiều bị capped ở 1 (tránh 'the' thống trị loss).",
  },
  {
    question:
      "Trong mô hình GloVe, mỗi từ i có HAI vector: w_i (center) và ~w_i (context). Vì sao?",
    options: [
      "Để tăng số tham số cho oai",
      "Ma trận đồng xuất hiện không đối xứng trong thực tế (window trái khác window phải), nên cần 2 vector; khi dùng, thường cộng w + ~w",
      "Để tương thích với GPU",
      "Để chống overfitting",
    ],
    correct: 1,
    explanation:
      "Về lý thuyết X đối xứng, nhưng khi train ta khởi tạo 2 vector độc lập và cộng chúng lại sau cùng. Kỹ thuật này giúp giảm overfitting và được Pennington et al. 2014 chứng minh cải thiện ~0.5% trên analogy task.",
  },
  {
    question:
      "Cho vector('Hà Nội') − vector('Việt Nam') + vector('Pháp') ≈ ?",
    options: [
      "vector('Paris') — GloVe bắt được quan hệ thủ đô",
      "vector('phở')",
      "vector trung bình của corpus",
      "Không xác định",
    ],
    correct: 0,
    explanation:
      "Analogy capital−country là ví dụ kinh điển. GloVe học được mối quan hệ tuyến tính giữa thủ đô và quốc gia, vì chúng đồng xuất hiện theo pattern giống nhau trên toàn cục.",
  },
  {
    question:
      "Hạn chế lớn nhất của GloVe (so với BERT, GPT) là gì?",
    options: [
      "Chậm hơn BERT khi inference",
      "Mỗi từ chỉ có DUY NHẤT một vector — không phân biệt được 'đá' (stone) vs 'đá' (kick) trong các ngữ cảnh khác nhau",
      "Không hỗ trợ tiếng Việt",
      "Không chạy trên GPU",
    ],
    correct: 1,
    explanation:
      "GloVe là static embedding: 1 từ = 1 vector bất kể ngữ cảnh. BERT/GPT là contextual — 'đá' trong 'cục đá' và 'đá bóng' có vector khác nhau. Đây là lý do NLP hiện đại chuyển sang contextual.",
  },
];

/* ─────────────────────────────────────────────────────────────
   HELPER — Tính cosine similarity để hiển thị live
   ───────────────────────────────────────────────────────────── */
function cosine(a: [number, number], b: [number, number]): number {
  const dot = a[0] * b[0] + a[1] * b[1];
  const na = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  const nb = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
  if (na === 0 || nb === 0) return 0;
  return dot / (na * nb);
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
export default function GloveTopic() {
  // State: ô đang hover trong ma trận đồng xuất hiện
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);

  // State: từ được chọn để xem vector embedding
  const [selectedWord, setSelectedWord] = useState<number>(0);

  // State: bước mô phỏng matrix factorization (0-4)
  const [factorStep, setFactorStep] = useState<number>(0);

  // State: index của analogy query đang xem (0-4)
  const [analogyIdx, setAnalogyIdx] = useState<number>(0);

  // State: giá trị x để highlight trên đường cong f(x)
  const [fxHover, setFxHover] = useState<number>(30);

  /* ── Tính max value của ma trận để scale màu ── */
  const maxVal = useMemo(() => {
    let m = 0;
    for (const row of COOC) {
      for (const v of row) {
        if (v > m) m = v;
      }
    }
    return m;
  }, []);

  /* ── Top-3 từ gần nhất với từ được chọn (theo cosine similarity) ── */
  const nearestNeighbors = useMemo(() => {
    const target = EMBED_2D[selectedWord];
    const scores = EMBED_2D.map((v, i) => ({
      idx: i,
      word: WORDS[i],
      sim: i === selectedWord ? -1 : cosine(target, v),
    }));
    scores.sort((a, b) => b.sim - a.sim);
    return scores.slice(0, 3);
  }, [selectedWord]);

  /* ── Sample dataset points cho đường cong f(x) ── */
  const fxPoints = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let x = 0; x <= 150; x += 2) {
      pts.push({ x, y: weightFn(x) });
    }
    return pts;
  }, []);

  /* ── Callback: reset tất cả về mặc định ── */
  const resetExplorer = useCallback(() => {
    setSelectedWord(0);
    setFactorStep(0);
    setAnalogyIdx(0);
    setFxHover(30);
    setHoveredCell(null);
  }, []);

  const currentAnalogy = ANALOGY_QUERIES[analogyIdx];

  return (
    <>
      {/* ─────────────────────────────────────────────────
          STEP 1 — PredictionGate: khởi động trực giác
          ───────────────────────────────────────────────── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Nếu đếm tất cả sách & bài báo tiếng Việt, cặp từ nào sẽ xuất hiện CÙNG NHAU nhiều nhất?`}
          options={[
            '"phở" và "xe máy"',
            '"bún" và "chả"',
            '"đường phố" và "tuyệt"',
          ]}
          correct={1}
          explanation={`"Bún chả" là món ăn nổi tiếng — hai từ này gần như luôn đi cùng nhau trong văn bản ẩm thực! GloVe dựa trên chính ý tưởng này: đếm tần suất ĐI CÙNG NHAU của mọi cặp từ trên toàn bộ dữ liệu, rồi dùng thống kê đó để tạo word embeddings. "Bún chả" sẽ có similarity cực cao trong không gian vector.`}
        />
        <div className="mt-4">
          <ProgressSteps
            current={1}
            total={TOTAL_STEPS}
            labels={[
              "Đoán trước",
              "Ma trận 10×10",
              "A-ha",
              "Thử nhanh",
              "Phân tích",
              "Hàm f(x)",
              "Analogy",
              "Lý thuyết",
              "Tóm tắt",
              "Kiểm tra",
            ]}
          />
        </div>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 2 — Visualization chính: ma trận 10×10
                    + matrix factorization X ≈ W × W^T
          ───────────────────────────────────────────────── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Đây là trái tim của GloVe: ma trận đồng xuất hiện{" "}
          <LaTeX>{`X \\in \\mathbb{R}^{V \\times V}`}</LaTeX>{" "}
          với 10 từ tiếng Việt. Mỗi ô <LaTeX>{`X_{ij}`}</LaTeX> là số lần từ i và
          j xuất hiện gần nhau (cửa sổ ±5). Di chuột qua ô để xem chi tiết, và kéo
          thanh trượt để xem quá trình phân tích ma trận{" "}
          <LaTeX>{`X \\approx W \\cdot \\tilde{W}^{\\top}`}</LaTeX>.
        </p>

        <VisualizationSection>
          <div className="space-y-6">
            {/* ── Bảng chọn từ để highlight hàng/cột ── */}
            <div className="flex flex-wrap gap-2 justify-center">
              {WORDS.map((w, i) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSelectedWord(i)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedWord === i
                      ? "bg-accent text-white shadow"
                      : "bg-surface text-muted hover:bg-surface/70"
                  }`}
                  style={
                    selectedWord === i
                      ? { backgroundColor: CLUSTER_COLOR[CLUSTER[i]] }
                      : undefined
                  }
                >
                  {w}
                </button>
              ))}
            </div>

            {/* ── Ma trận 10×10 ── */}
            <div className="overflow-x-auto">
              <table className="mx-auto border-separate border-spacing-0.5">
                <thead>
                  <tr>
                    <th className="px-1.5 py-1"></th>
                    {WORDS.map((w, ci) => (
                      <th
                        key={w}
                        className={`px-1.5 py-1 text-[10px] font-bold text-center whitespace-nowrap ${
                          ci === selectedWord ? "text-accent" : "text-muted"
                        }`}
                        style={{ minWidth: "44px" }}
                      >
                        {w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WORDS.map((rowWord, ri) => (
                    <tr key={rowWord}>
                      <td
                        className={`px-1.5 py-1 text-[10px] font-bold text-right whitespace-nowrap ${
                          ri === selectedWord ? "text-accent" : "text-muted"
                        }`}
                      >
                        {rowWord}
                      </td>
                      {COOC[ri].map((val, ci) => {
                        const isHovered =
                          hoveredCell &&
                          hoveredCell[0] === ri &&
                          hoveredCell[1] === ci;
                        const isHighlightedRow = ri === selectedWord;
                        const isHighlightedCol = ci === selectedWord;
                        const isDiag = ri === ci;
                        const intensity = val / maxVal;
                        return (
                          <td key={ci} className="p-0">
                            <button
                              type="button"
                              onMouseEnter={() => setHoveredCell([ri, ci])}
                              onMouseLeave={() => setHoveredCell(null)}
                              onClick={() => setSelectedWord(ri)}
                              className={`w-11 h-9 rounded flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${
                                isDiag
                                  ? "bg-surface text-muted"
                                  : isHovered
                                  ? "ring-2 ring-accent scale-110 z-10 relative"
                                  : isHighlightedRow || isHighlightedCol
                                  ? "ring-1 ring-accent/50"
                                  : ""
                              }`}
                              style={
                                isDiag
                                  ? {}
                                  : {
                                      backgroundColor: `rgba(99, 102, 241, ${
                                        0.08 + intensity * 0.72
                                      })`,
                                      color: val > 10 ? "white" : "#64748b",
                                    }
                              }
                            >
                              {isDiag ? "—" : val}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Hover info ── */}
            <div className="rounded-lg bg-background/50 border border-border p-4 text-center min-h-[56px]">
              {hoveredCell && hoveredCell[0] !== hoveredCell[1] ? (
                <p className="text-sm text-foreground">
                  <strong className="text-accent">
                    {WORDS[hoveredCell[0]]}
                  </strong>{" "}
                  và{" "}
                  <strong className="text-accent">
                    {WORDS[hoveredCell[1]]}
                  </strong>{" "}
                  đồng xuất hiện{" "}
                  <strong className="text-accent">
                    {COOC[hoveredCell[0]][hoveredCell[1]]}
                  </strong>{" "}
                  lần →{" "}
                  <LaTeX>{`\\log(X_{ij}) = ${Math.log(
                    COOC[hoveredCell[0]][hoveredCell[1]] + 1
                  ).toFixed(2)}`}</LaTeX>
                  .{" "}
                  {COOC[hoveredCell[0]][hoveredCell[1]] >= 15
                    ? "Rất thường gặp!"
                    : COOC[hoveredCell[0]][hoveredCell[1]] >= 8
                    ? "Khá thường gặp."
                    : COOC[hoveredCell[0]][hoveredCell[1]] <= 2
                    ? "Hiếm khi đi cùng."
                    : "Thỉnh thoảng đi cùng."}
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Di chuột qua ô để xem{" "}
                  <LaTeX>{`X_{ij}`}</LaTeX> và{" "}
                  <LaTeX>{`\\log X_{ij}`}</LaTeX> — giá trị mà GloVe muốn khớp.
                </p>
              )}
            </div>

            {/* ── Matrix factorization — thanh trượt 5 bước ── */}
            <div className="rounded-lg border border-border bg-background/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Phân tích ma trận: <LaTeX>{`X \\approx W \\cdot \\tilde{W}^{\\top}`}</LaTeX>
                </p>
                <span className="text-xs text-accent font-bold">
                  Bước {factorStep + 1}/5
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={factorStep}
                onChange={(e) => setFactorStep(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="grid grid-cols-3 gap-3 items-center">
                {/* Ma trận X (gọn) */}
                <div className="text-center">
                  <p className="text-xs text-muted mb-1">
                    <LaTeX>{`X_{10 \\times 10}`}</LaTeX>
                  </p>
                  <div className="inline-grid grid-cols-10 gap-0.5 p-1 rounded bg-surface">
                    {COOC.flat().map((v, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-sm"
                        style={{
                          backgroundColor: `rgba(99,102,241,${
                            0.1 + (v / maxVal) * 0.8
                          })`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted mt-1">100 giá trị</p>
                </div>

                {/* Mũi tên + công thức */}
                <div className="text-center">
                  <motion.div
                    key={factorStep}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-2"
                  >
                    <p className="text-2xl text-accent">≈</p>
                    <p className="text-[11px] text-foreground font-semibold">
                      {factorStep === 0 && "Khởi tạo ngẫu nhiên W"}
                      {factorStep === 1 && "Tính gradient"}
                      {factorStep === 2 && "Cập nhật W"}
                      {factorStep === 3 && "Lặp 50 epoch"}
                      {factorStep === 4 && "Hội tụ!"}
                    </p>
                    <p className="text-[10px] text-muted">
                      Loss: {(2.1 - factorStep * 0.48).toFixed(2)}
                    </p>
                  </motion.div>
                </div>

                {/* Ma trận W (d chiều) */}
                <div className="text-center">
                  <p className="text-xs text-muted mb-1">
                    <LaTeX>{`W_{10 \\times d}`}</LaTeX>
                  </p>
                  <div
                    className="inline-grid gap-0.5 p-1 rounded bg-surface"
                    style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
                  >
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-sm"
                        initial={false}
                        animate={{
                          backgroundColor: `rgba(${245 - factorStep * 30},${
                            158 + factorStep * 10
                          },${11 + factorStep * 40},${
                            0.15 + factorStep * 0.15
                          })`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted mt-1">
                    d=4 chiều (rút gọn)
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted text-center">
                Mục tiêu: tìm <LaTeX>{`W`}</LaTeX> và{" "}
                <LaTeX>{`\\tilde{W}`}</LaTeX> sao cho{" "}
                <LaTeX>{`W \\cdot \\tilde{W}^{\\top}`}</LaTeX> khớp với{" "}
                <LaTeX>{`\\log X`}</LaTeX> (có trọng số f).
              </p>
            </div>

            {/* ── Vector embedding 2D của từ được chọn ── */}
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                Embedding 2D (phép chiếu mô phỏng) —{" "}
                <span className="text-accent">{WORDS[selectedWord]}</span>
              </p>
              <div className="relative w-full aspect-square max-w-sm mx-auto rounded bg-surface/40 border border-border">
                {/* Trục */}
                <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />

                {/* Các điểm */}
                {EMBED_2D.map((v, i) => {
                  const cx = 50 + v[0] * 45;
                  const cy = 50 - v[1] * 45;
                  const isSelected = i === selectedWord;
                  const isNeighbor = nearestNeighbors.some((n) => n.idx === i);
                  return (
                    <motion.div
                      key={i}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                      style={{ left: `${cx}%`, top: `${cy}%` }}
                      initial={false}
                      animate={{ scale: isSelected ? 1.3 : 1 }}
                    >
                      <div
                        className={`rounded-full ${
                          isSelected
                            ? "w-3.5 h-3.5 ring-2 ring-accent"
                            : isNeighbor
                            ? "w-2.5 h-2.5"
                            : "w-2 h-2"
                        }`}
                        style={{ backgroundColor: CLUSTER_COLOR[CLUSTER[i]] }}
                      />
                      <span
                        className={`text-[9px] mt-0.5 font-medium whitespace-nowrap ${
                          isSelected
                            ? "text-accent font-bold"
                            : isNeighbor
                            ? "text-foreground"
                            : "text-muted"
                        }`}
                      >
                        {WORDS[i]}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Nearest neighbors */}
              <div className="mt-3">
                <p className="text-xs text-muted mb-2">
                  Top 3 từ gần <strong>{WORDS[selectedWord]}</strong>:
                </p>
                <div className="space-y-1.5">
                  {nearestNeighbors.map((n) => (
                    <div key={n.idx} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: CLUSTER_COLOR[CLUSTER[n.idx]],
                        }}
                      />
                      <span className="text-xs font-medium text-foreground flex-1">
                        {n.word}
                      </span>
                      <div className="w-24 h-1.5 rounded-full bg-surface overflow-hidden">
                        <motion.div
                          className="h-full bg-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, n.sim) * 100}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <span className="text-[10px] text-muted w-10 text-right">
                        {n.sim.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-3 justify-center text-[10px] text-muted">
                {CLUSTER_NAME.map((name, i) => (
                  <div key={name} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CLUSTER_COLOR[i] }}
                    />
                    {name}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Key insight boxes ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-center">
                <p className="text-xs text-green-500 font-semibold">
                  Đồng xuất hiện cao
                </p>
                <p className="text-sm text-foreground mt-1">
                  bún + chả ={" "}
                  <strong className="text-green-500">22</strong>
                </p>
                <p className="text-xs text-muted">
                  → <LaTeX>{`\\log 22 \\approx 3.09`}</LaTeX> → vector rất gần
                </p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-center">
                <p className="text-xs text-red-500 font-semibold">
                  Đồng xuất hiện thấp
                </p>
                <p className="text-sm text-foreground mt-1">
                  chả + xe máy ={" "}
                  <strong className="text-red-500">0</strong>
                </p>
                <p className="text-xs text-muted">
                  → <LaTeX>{`\\log 0 = -\\infty`}</LaTeX> → bỏ qua (f=0)
                </p>
              </div>
            </div>

            {/* ── Reset button ── */}
            <div className="text-center">
              <button
                type="button"
                onClick={resetExplorer}
                className="text-xs text-muted hover:text-accent underline underline-offset-2 transition-colors"
              >
                Khôi phục trạng thái ban đầu
              </button>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 3 — AhaMoment
          ───────────────────────────────────────────────── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>GloVe</strong> = Global Vectors. Nó xây bảng thống kê{" "}
            {'"ai đi cùng ai"'} trên TOÀN BỘ dữ liệu (100 ô cho 10 từ, hàng trăm
            triệu ô cho từ vựng thật), rồi tìm vector sao cho{" "}
            <LaTeX>{`\\mathbf{w}_i \\cdot \\tilde{\\mathbf{w}}_j \\approx \\log X_{ij}`}</LaTeX>
            .
          </p>
          <p className="text-sm text-muted mt-1">
            Giống thám tử: Word2Vec theo dõi từng cuộc gặp riêng lẻ (mỗi cửa sổ
            là một "lần quan sát"), GloVe lập bảng tổng hợp{" "}
            {'"ai gặp ai bao nhiêu lần trong cả năm"'} rồi phân tích mối quan hệ
            một cách tổng thể — nhanh hơn, ổn định hơn, dễ song song hơn.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 4 — InlineChallenge #1
          ───────────────────────────────────────────────── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Trong ma trận 10×10, X(bún, chả) = 22 nhưng X(bún, xe máy) = 1. GloVe sẽ tạo embeddings thế nào?"
          options={[
            "vector('bún') và vector('chả') gần nhau; vector('bún') và vector('xe máy') xa nhau",
            "Tất cả vector bằng nhau vì đều là từ tiếng Việt",
            "Không thể xác định nếu không biết tần suất từ đơn",
          ]}
          correct={0}
          explanation="GloVe muốn: w_bún · w_chả ≈ log(22) = 3.09 (lớn) và w_bún · w_xe_máy ≈ log(1) = 0 (nhỏ). Kết quả: bún gần chả trong không gian vector, xa xe máy. Đây chính là cách ngữ nghĩa được 'mã hoá' từ thống kê."
        />
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 5 — So sánh GloVe vs Word2Vec qua analogy
          ───────────────────────────────────────────────── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="So sánh">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Một trong những test kinh điển cho word embeddings là{" "}
          <strong>analogy query</strong>: cho 3 từ A, B, C, tìm D sao cho "A với
          B như C với D". Biểu diễn vector:{" "}
          <LaTeX>{`\\mathbf{v}_D \\approx \\mathbf{v}_A - \\mathbf{v}_B + \\mathbf{v}_C`}</LaTeX>
          . Hãy so sánh GloVe và Word2Vec trên 5 query tiếng Việt:
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            {/* Selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {ANALOGY_QUERIES.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAnalogyIdx(i)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    analogyIdx === i
                      ? "bg-accent text-white"
                      : "bg-surface text-muted hover:bg-surface/70"
                  }`}
                >
                  Query {i + 1}
                </button>
              ))}
            </div>

            {/* Query display */}
            <motion.div
              key={analogyIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-background/40 p-4 text-center"
            >
              <p className="text-xs text-muted uppercase tracking-wide mb-1">
                Query
              </p>
              <p className="text-lg font-bold text-foreground">
                <LaTeX>{currentAnalogy.query.replace(/−/g, " - ")}</LaTeX>
              </p>
              <p className="text-xs text-muted mt-1">
                Kỳ vọng:{" "}
                <span className="text-accent font-semibold">
                  {currentAnalogy.expected}
                </span>
              </p>
            </motion.div>

            {/* So sánh kết quả */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                <p className="text-xs font-bold text-purple-400 uppercase mb-2">
                  GloVe (toàn cục)
                </p>
                <p className="text-lg font-bold text-foreground">
                  {currentAnalogy.gloveResult}
                </p>
                <div className="mt-2 h-2 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    key={analogyIdx}
                    className="h-full bg-purple-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentAnalogy.gloveScore * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-[11px] text-muted mt-1">
                  cosine = {currentAnalogy.gloveScore.toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-2">
                  Word2Vec (cục bộ)
                </p>
                <p className="text-lg font-bold text-foreground">
                  {currentAnalogy.w2vResult}
                </p>
                <div className="mt-2 h-2 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    key={analogyIdx}
                    className="h-full bg-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentAnalogy.w2vScore * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
                <p className="text-[11px] text-muted mt-1">
                  cosine = {currentAnalogy.w2vScore.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted italic text-center">
              {currentAnalogy.note}
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 6 — Weighted cost function f(x)
          ───────────────────────────────────────────────── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Hàm trọng số">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Nếu chỉ optimize{" "}
          <LaTeX>{`(\\mathbf{w}_i \\cdot \\tilde{\\mathbf{w}}_j - \\log X_{ij})^2`}</LaTeX>
          , hai vấn đề sẽ xảy ra:{" "}
          <strong>(1)</strong> cặp từ xuất hiện quá ít (nhiễu) có thể phá vỡ
          model, <strong>(2)</strong> cặp quá nhiều (như "của", "là") sẽ chi
          phối toàn bộ loss. Giải pháp: thêm trọng số{" "}
          <LaTeX>{`f(X_{ij})`}</LaTeX>.
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 text-center">
                Đường cong f(x) — Weighting function
              </p>
              <p className="text-center mb-3">
                <LaTeX block>{`f(x) = \\begin{cases} (x/x_{\\max})^{\\alpha} & \\text{nếu } x < x_{\\max} \\\\ 1 & \\text{nếu } x \\geq x_{\\max} \\end{cases}`}</LaTeX>
              </p>

              {/* SVG plot */}
              <div className="relative w-full max-w-lg mx-auto">
                <svg viewBox="0 0 300 160" className="w-full h-auto">
                  {/* Axes */}
                  <line
                    x1={30}
                    y1={140}
                    x2={290}
                    y2={140}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth={1}
                  />
                  <line
                    x1={30}
                    y1={20}
                    x2={30}
                    y2={140}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth={1}
                  />

                  {/* Grid */}
                  {[0.25, 0.5, 0.75, 1].map((t) => (
                    <line
                      key={t}
                      x1={30}
                      y1={140 - t * 120}
                      x2={290}
                      y2={140 - t * 120}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth={0.5}
                      strokeDasharray="2 2"
                      opacity={0.4}
                    />
                  ))}

                  {/* xmax line */}
                  <line
                    x1={30 + (X_MAX / 150) * 260}
                    y1={20}
                    x2={30 + (X_MAX / 150) * 260}
                    y2={140}
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    opacity={0.6}
                  />
                  <text
                    x={30 + (X_MAX / 150) * 260}
                    y={14}
                    textAnchor="middle"
                    className="fill-red-400 text-[9px] font-semibold"
                  >
                    x_max = 100
                  </text>

                  {/* Curve */}
                  <polyline
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    points={fxPoints
                      .map(
                        (p) =>
                          `${30 + (p.x / 150) * 260},${140 - p.y * 120}`
                      )
                      .join(" ")}
                  />

                  {/* Hover marker */}
                  <circle
                    cx={30 + (fxHover / 150) * 260}
                    cy={140 - weightFn(fxHover) * 120}
                    r={4}
                    fill="#a78bfa"
                    stroke="white"
                    strokeWidth={1.5}
                  />

                  {/* Labels */}
                  <text
                    x={160}
                    y={156}
                    textAnchor="middle"
                    className="fill-current text-muted text-[10px]"
                  >
                    x (số lần đồng xuất hiện)
                  </text>
                  <text
                    x={8}
                    y={80}
                    textAnchor="middle"
                    transform="rotate(-90 8 80)"
                    className="fill-current text-muted text-[10px]"
                  >
                    f(x)
                  </text>
                  <text
                    x={26}
                    y={140}
                    textAnchor="end"
                    className="fill-current text-muted text-[9px]"
                  >
                    0
                  </text>
                  <text
                    x={26}
                    y={24}
                    textAnchor="end"
                    className="fill-current text-muted text-[9px]"
                  >
                    1
                  </text>
                </svg>
              </div>

              {/* Slider */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted">
                  <span>
                    x = <strong className="text-accent">{fxHover}</strong>
                  </span>
                  <span>
                    f(x) ={" "}
                    <strong className="text-accent">
                      {weightFn(fxHover).toFixed(3)}
                    </strong>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={150}
                  step={1}
                  value={fxHover}
                  onChange={(e) => setFxHover(parseInt(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <p className="text-xs text-muted text-center mt-3">
                {fxHover < 5
                  ? "Cặp hiếm gặp → trọng số rất nhỏ (thống kê không đáng tin)."
                  : fxHover < X_MAX
                  ? "Cặp trung bình → trọng số tăng dần theo công thức power."
                  : "Cặp xuất hiện nhiều → trọng số bão hoà ở 1 (không thống trị loss)."}
              </p>
            </div>

            <CollapsibleDetail title="Vì sao chọn α = 0.75 và x_max = 100?">
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  Pennington et al. (2014) thử nghiệm trên corpus Wikipedia
                  +Gigaword (6B tokens) và phát hiện:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>α = 0.75</strong> cho kết quả analogy tốt nhất
                    (vượt α=1.0 khoảng 2-3%). Giá trị này giống exponent trong
                    negative sampling của Word2Vec (không ngẫu nhiên!).
                  </li>
                  <li>
                    <strong>x_max = 100</strong> đủ lớn để các cặp phổ biến
                    không bị cắt đầu, nhưng đủ nhỏ để cặp như "the of" (xuất
                    hiện hàng triệu lần) không phá vỡ training.
                  </li>
                  <li>
                    Model khá robust với các giá trị gần đó: α ∈ [0.65, 0.8],
                    x_max ∈ [50, 200] đều cho kết quả tương đương.
                  </li>
                </ul>
              </div>
            </CollapsibleDetail>

            <CollapsibleDetail title="Tại sao dùng log(X_ij) chứ không phải X_ij?">
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  Mục tiêu của GloVe là mã hoá <strong>tỷ số xác suất</strong>{" "}
                  đồng xuất hiện, không phải giá trị tuyệt đối:
                </p>
                <LaTeX block>{`\\frac{P_{ik}}{P_{jk}} = \\frac{X_{ik}/X_i}{X_{jk}/X_j}`}</LaTeX>
                <p>
                  Pennington et al. chứng minh rằng nếu ta muốn{" "}
                  <LaTeX>{`F(\\mathbf{w}_i - \\mathbf{w}_j, \\tilde{\\mathbf{w}}_k) = P_{ik}/P_{jk}`}</LaTeX>
                  , và yêu cầu F là homomorphism, thì nghiệm duy nhất là F = exp. Lấy log
                  hai vế → tích vô hướng bằng log của ratio → sau khi đơn giản hoá:{" "}
                  <LaTeX>{`\\mathbf{w}_i^{\\top} \\tilde{\\mathbf{w}}_k = \\log X_{ik} - \\log X_i`}</LaTeX>
                  . Phần <LaTeX>{`\\log X_i`}</LaTeX> được hấp thụ vào bias term. Kết quả cuối cùng:{" "}
                  <LaTeX>{`\\mathbf{w}_i^{\\top} \\tilde{\\mathbf{w}}_j + b_i + \\tilde{b}_j = \\log X_{ij}`}</LaTeX>
                  . Đây là lý do tại sao log là lựa chọn tự nhiên — không phải ad hoc!
                </p>
              </div>
            </CollapsibleDetail>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 7 — InlineChallenge #2
          ───────────────────────────────────────────────── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Thử thách nâng cao">
        <InlineChallenge
          question="Một corpus có X(của, là) = 2,000,000 (cực phổ biến) và X(phở, ngon) = 80. Hàm f với x_max = 100 xử lý ra sao?"
          options={[
            "f(2,000,000) = 1, f(80) ≈ (80/100)^0.75 ≈ 0.84 — cả hai đều được tính gần như bằng nhau",
            "f(2,000,000) = 2000, f(80) = 80 — cặp phổ biến thống trị loss",
            "f(2,000,000) = 0, f(80) = 0 — bỏ qua cả hai",
          ]}
          correct={0}
          explanation="Đây chính là lý do f bão hoà ở x_max: cặp 'của là' không còn chi phối gradient dù xuất hiện 2 triệu lần. Cặp 'phở ngon' (80 lần) vẫn được đánh trọng số đầy đủ (0.84). Nhờ vậy GloVe học được quan hệ ngữ nghĩa thay vì chỉ memorize stop words."
        />
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 8 — Explanation đầy đủ
          ───────────────────────────────────────────────── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>GloVe</strong> (Global Vectors for Word Representation,
            Pennington, Socher & Manning, Stanford 2014) kết hợp hai trường phái
            lớn: phân tích ma trận toàn cục (LSA, HAL) và học cửa sổ cục bộ
            (như <TopicLink slug="word2vec">Word2Vec</TopicLink>). Cả hai đều
            cho ra <TopicLink slug="word-embeddings">word embeddings</TopicLink>{" "}
            chất lượng cao, nhưng GloVe có điểm tựa toán học rõ ràng hơn: bắt đầu
            từ ratio của xác suất đồng xuất hiện và dẫn tới một objective có thể
            chứng minh được.
          </p>

          <Callout variant="insight" title="Hàm mất mát GloVe (đầy đủ)">
            <p>
              Công thức hoàn chỉnh mà bạn sẽ thấy trong paper gốc:
            </p>
            <LaTeX block>{`J = \\sum_{i,j=1}^{V} f(X_{ij}) \\left( \\mathbf{w}_i^{\\top} \\tilde{\\mathbf{w}}_j + b_i + \\tilde{b}_j - \\log X_{ij} \\right)^2`}</LaTeX>
            <p className="mt-2 text-sm">
              Trong đó <LaTeX>{`X_{ij}`}</LaTeX> là số lần từ i, j đồng xuất
              hiện, <LaTeX>{`f(X_{ij})`}</LaTeX> là trọng số, và{" "}
              <LaTeX>{`b_i, \\tilde{b}_j`}</LaTeX> là bias giúp hấp thụ tần suất
              marginal của từng từ. V là kích thước từ vựng (thường 400K).
            </p>
          </Callout>

          <Callout variant="info" title="Hàm trọng số f(x) — ba tính chất bắt buộc">
            <LaTeX block>{`f(x) = \\begin{cases} (x/x_{\\max})^{\\alpha} & \\text{nếu } x < x_{\\max} \\\\ 1 & \\text{nếu } x \\geq x_{\\max} \\end{cases}`}</LaTeX>
            <ol className="list-decimal pl-5 space-y-1 text-sm mt-2">
              <li>
                <strong>f(0) = 0</strong> — bỏ qua cặp không đồng xuất hiện
                (tránh log 0).
              </li>
              <li>
                <strong>Không giảm</strong> — cặp thường gặp không bị đánh trọng
                số nhỏ hơn cặp hiếm.
              </li>
              <li>
                <strong>Bão hoà</strong> — cặp cực phổ biến ("của", "là") không
                chi phối gradient.
              </li>
            </ol>
          </Callout>

          <Callout variant="tip" title="Khi nào dùng GloVe vs Word2Vec?">
            <p>
              <strong>GloVe:</strong> Dữ liệu lớn (6B+ tokens), cần embeddings
              ổn định, có sẵn pre-trained (glove.6B, glove.42B, glove.840B), dễ
              song song hoá trên cluster. <strong>Word2Vec:</strong> Dữ liệu
              nhỏ-vừa, cần huấn luyện tuỳ chỉnh, dùng Skip-gram cho từ hiếm.
              Thực tế: kết quả hai model rất gần nhau trên các benchmark — chọn
              cái nào tiện hơn cho pipeline của bạn.
            </p>
          </Callout>

          <Callout variant="warning" title="Hạn chế chung của static embeddings">
            <p>
              Cả GloVe lẫn Word2Vec đều là <strong>static</strong>: một từ chỉ
              có MỘT vector bất kể ngữ cảnh. "Con đá" và "đá bóng" — từ "đá" có
              nghĩa hoàn toàn khác — nhưng GloVe không phân biệt được. Đây là
              động lực chính để ngành NLP chuyển sang{" "}
              <strong>contextual embeddings</strong>: ELMo (2018), BERT (2018),
              GPT-2 (2019). Mỗi lần gặp "đá" trong ngữ cảnh mới, model tạo một
              vector mới.
            </p>
          </Callout>

          <CodeBlock language="python" title="glove_gensim_demo.py">
{`"""
Huấn luyện GloVe với Gensim trên corpus tiếng Việt.
Yêu cầu: pip install glove_python_binary gensim scikit-learn
"""
from glove import Corpus, Glove
from gensim.utils import simple_preprocess
import numpy as np

# ─── 1. Chuẩn bị corpus ───
# Mỗi câu là một list tokens
corpus_text = [
    "phở Hà Nội rất ngon và nổi tiếng",
    "bún chả là món đặc sản của Hà Nội",
    "xe máy chạy khắp đường phố Hà Nội",
    "tôi thích phở bò ngon tuyệt",
    # ... hàng triệu câu khác
]
sentences = [simple_preprocess(s) for s in corpus_text]

# ─── 2. Xây ma trận đồng xuất hiện ───
corpus = Corpus()
corpus.fit(sentences, window=10)   # cửa sổ ±10
print(f"Vocabulary size: {len(corpus.dictionary)}")
print(f"Non-zero entries: {corpus.matrix.nnz}")

# ─── 3. Huấn luyện GloVe ───
glove = Glove(
    no_components=100,      # vector 100 chiều
    learning_rate=0.05,
    alpha=0.75,             # exponent của f(x)
    max_count=100,          # x_max
)
glove.fit(
    corpus.matrix,
    epochs=30,
    no_threads=8,           # parallel
    verbose=True,
)
glove.add_dictionary(corpus.dictionary)

# ─── 4. Truy vấn ───
print(glove.most_similar("phở", number=5))
# → [('bún', 0.82), ('chả', 0.76), ('ngon', 0.71), ...]

# ─── 5. Analogy: vua - đàn_ông + phụ_nữ ≈ ? ───
def analogy(a, b, c, model, topn=3):
    va = model.word_vectors[model.dictionary[a]]
    vb = model.word_vectors[model.dictionary[b]]
    vc = model.word_vectors[model.dictionary[c]]
    target = va - vb + vc
    # cosine similarity với tất cả từ
    norms = np.linalg.norm(model.word_vectors, axis=1)
    sims = model.word_vectors @ target / (norms * np.linalg.norm(target) + 1e-8)
    # loại 3 từ đầu vào
    for w in (a, b, c):
        sims[model.dictionary[w]] = -1
    top = np.argsort(-sims)[:topn]
    inv_dict = {v: k for k, v in model.dictionary.items()}
    return [(inv_dict[i], sims[i]) for i in top]

print(analogy("vua", "đàn_ông", "phụ_nữ", glove))
# → [('hoàng_hậu', 0.78), ('nữ_hoàng', 0.71), ...]

# ─── 6. Lưu model ───
glove.save("vi_glove_100d.model")`}
          </CodeBlock>

          <CodeBlock language="python" title="load_pretrained_glove.py">
{`"""
Sử dụng GloVe pre-trained (tải từ nlp.stanford.edu/projects/glove)
"""
import numpy as np

# ─── Tải glove.6B.100d.txt (822 MB, 400K từ tiếng Anh) ───
embeddings = {}
with open("glove.6B.100d.txt", "r", encoding="utf-8") as f:
    for line in f:
        values = line.split()
        word = values[0]
        vec = np.array(values[1:], dtype=np.float32)
        embeddings[word] = vec

print(f"Loaded {len(embeddings)} word vectors, dim={len(next(iter(embeddings.values())))}")

# ─── Cosine similarity ───
def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)

# ─── So sánh các cặp nổi tiếng ───
print(cosine_sim(embeddings["king"], embeddings["queen"]))    # 0.75 — rất gần
print(cosine_sim(embeddings["king"], embeddings["man"]))      # 0.53 — gần
print(cosine_sim(embeddings["king"], embeddings["car"]))      # 0.15 — xa

# ─── Analogy kinh điển ───
target = embeddings["king"] - embeddings["man"] + embeddings["woman"]
# Tìm từ gần target nhất (trừ 3 từ đầu vào)
best = ("", -1)
for w, v in embeddings.items():
    if w in {"king", "man", "woman"}:
        continue
    s = cosine_sim(target, v)
    if s > best[1]:
        best = (w, s)
print(best)  # ('queen', 0.71)

# ─── Analogy địa danh ───
target = embeddings["paris"] - embeddings["france"] + embeddings["vietnam"]
# → "hanoi" (cosine ≈ 0.67)`}
          </CodeBlock>
        </ExplanationSection>
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 9 — MiniSummary (6 điểm)
          ───────────────────────────────────────────────── */}
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về GloVe"
          points={[
            "GloVe xây ma trận đồng xuất hiện TOÀN CỤC X_ij — đếm số lần mọi cặp từ đi cùng nhau trên toàn corpus (không chỉ window cục bộ).",
            "Mục tiêu cốt lõi: w_i · ~w_j + b_i + ~b_j ≈ log(X_ij) — tích vô hướng vector xấp xỉ log đồng xuất hiện, có trọng số f(X_ij).",
            "Hàm f(x) = (x/x_max)^α (α=0.75, x_max=100) bão hoà ở 1 — giảm ảnh hưởng cặp hiếm (nhiễu) và cặp quá phổ biến ('của', 'là').",
            "Kết hợp ưu điểm LSA (toàn cục) + Word2Vec (cục bộ) → embeddings ổn định, song song hoá dễ, kết quả analogy mạnh.",
            "Pre-trained GloVe Stanford: glove.6B (400K từ, 50-300d), glove.42B (1.9M từ), glove.840B (2.2M từ) — tải miễn phí.",
            "Hạn chế: mỗi từ chỉ có 1 vector cố định (không phân biệt nghĩa theo ngữ cảnh) → BERT/GPT giải quyết bằng contextual embeddings.",
          ]}
        />
      </LessonSection>

      {/* ─────────────────────────────────────────────────
          STEP 10 — Quiz (8 câu)
          ───────────────────────────────────────────────── */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
