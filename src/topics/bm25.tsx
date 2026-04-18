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
  slug: "bm25",
  title: "BM25",
  titleVi: "BM25 - Xếp hạng từ khoá kinh điển",
  description:
    "Thuật toán xếp hạng văn bản dựa trên tần suất từ khóa, là nền tảng của các công cụ tìm kiếm truyền thống.",
  category: "search-retrieval",
  tags: ["bm25", "ranking", "information-retrieval", "tf-idf"],
  difficulty: "intermediate",
  relatedSlugs: ["semantic-search", "hybrid-search", "re-ranking"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
   Tiny in-file corpus để demo BM25 tương tác. Chúng ta dùng
   3 tài liệu tiếng Việt về chủ đề khác nhau — cố tình có chênh
   lệch về độ dài để người học thấy tác dụng của length norm.
   ──────────────────────────────────────────────────────────── */
type Doc = {
  id: string;
  title: string;
  tokens: string[];
};

const DOCS: Doc[] = [
  {
    id: "D1",
    title: "D1 — Tin ngắn (22 từ)",
    tokens:
      "luật lao động việt nam quy định rõ quyền lợi người lao động về lương thưởng và nghỉ phép hằng năm".split(" "),
  },
  {
    id: "D2",
    title: "D2 — Bài báo dài (52 từ)",
    tokens:
      "bộ luật lao động mới ban hành đã cập nhật nhiều điều khoản trong đó có quy định về lương tối thiểu vùng và thời giờ làm việc người lao động được bảo đảm quyền nghỉ ngơi thời gian nghỉ phép và chế độ bảo hiểm cùng các quyền lợi khác theo đúng luật"
        .split(" "),
  },
  {
    id: "D3",
    title: "D3 — Bài lạc đề (18 từ)",
    tokens:
      "luật giao thông đường bộ quy định rõ tốc độ tối đa của ô tô xe máy trên cao tốc".split(" "),
  },
];

const AVGDL = DOCS.reduce((acc, d) => acc + d.tokens.length, 0) / DOCS.length;
const N_DOCS = DOCS.length;

/* Chỉ gợi ý các query có sẵn — user có thể gõ tự do. */
const PRESET_QUERIES: string[] = [
  "luật lao động",
  "quyền người lao động",
  "nghỉ phép",
  "giao thông",
];

function termFrequency(term: string, doc: Doc): number {
  return doc.tokens.reduce((acc, t) => (t === term ? acc + 1 : acc), 0);
}

function docFrequency(term: string, corpus: Doc[]): number {
  return corpus.reduce((acc, d) => (d.tokens.includes(term) ? acc + 1 : acc), 0);
}

function idf(term: string, corpus: Doc[]): number {
  const df = docFrequency(term, corpus);
  // công thức IDF của BM25 (Okapi): ln( (N - df + 0.5) / (df + 0.5) + 1 )
  return Math.log((N_DOCS - df + 0.5) / (df + 0.5) + 1);
}

function bm25TermScore(
  term: string,
  doc: Doc,
  k1: number,
  b: number,
): { tf: number; idfValue: number; contribution: number } {
  const tf = termFrequency(term, doc);
  const idfValue = idf(term, DOCS);
  const denom = tf + k1 * (1 - b + (b * doc.tokens.length) / AVGDL);
  const contribution = tf === 0 ? 0 : idfValue * ((tf * (k1 + 1)) / denom);
  return { tf, idfValue, contribution };
}

function tfidfTermScore(term: string, doc: Doc): { tf: number; idfValue: number; contribution: number } {
  const tf = termFrequency(term, doc);
  // TF-IDF dạng chuẩn (log TF + IDF giống BM25 để so sánh công bằng)
  const idfValue = idf(term, DOCS);
  const contribution = tf === 0 ? 0 : (1 + Math.log(tf)) * idfValue;
  return { tf, idfValue, contribution };
}

const TERM_COLOR_PALETTE = [
  "text-blue-400",
  "text-purple-400",
  "text-amber-400",
  "text-emerald-400",
  "text-pink-400",
];

export default function BM25Topic() {
  const [query, setQuery] = useState<string>("luật lao động");
  const [k1, setK1] = useState<number>(1.5);
  const [b, setB] = useState<number>(0.75);
  const [expandedDoc, setExpandedDoc] = useState<string | null>("D1");

  const queryTerms = useMemo(
    () =>
      query
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [query],
  );

  const termColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    queryTerms.forEach((term, idx) => {
      map[term] = TERM_COLOR_PALETTE[idx % TERM_COLOR_PALETTE.length];
    });
    return map;
  }, [queryTerms]);

  const scoredDocs = useMemo(() => {
    return DOCS.map((doc) => {
      const perTerm = queryTerms.map((term) => ({
        term,
        ...bm25TermScore(term, doc, k1, b),
      }));
      const perTermTfidf = queryTerms.map((term) => ({
        term,
        ...tfidfTermScore(term, doc),
      }));
      const bm25Total = perTerm.reduce((acc, x) => acc + x.contribution, 0);
      const tfidfTotal = perTermTfidf.reduce((acc, x) => acc + x.contribution, 0);
      return { doc, perTerm, perTermTfidf, bm25Total, tfidfTotal };
    });
  }, [queryTerms, k1, b]);

  const maxBm25 = Math.max(...scoredDocs.map((s) => s.bm25Total), 0.01);
  const maxTfidf = Math.max(...scoredDocs.map((s) => s.tfidfTotal), 0.01);

  const rankedByBm25 = useMemo(
    () => [...scoredDocs].sort((a, b) => b.bm25Total - a.bm25Total),
    [scoredDocs],
  );
  const rankedByTfidf = useMemo(
    () => [...scoredDocs].sort((a, b) => b.tfidfTotal - a.tfidfTotal),
    [scoredDocs],
  );

  const resetParams = useCallback(() => {
    setK1(1.5);
    setB(0.75);
  }, []);

  const handleQueryPreset = useCallback((q: string) => {
    setQuery(q);
  }, []);

  const quizQuestions: QuizQuestion[] = useMemo(
    () => [
      {
        question: "BM25 cải tiến gì so với TF-IDF?",
        options: [
          "BM25 dùng deep learning thay vì đếm từ",
          "BM25 có bão hoà tần suất (từ lặp 10 lần không gấp đôi 5 lần) + chuẩn hoá theo độ dài",
          "BM25 hiểu ngữ nghĩa câu hỏi",
          "BM25 nhanh hơn TF-IDF 100 lần",
        ],
        correct: 1,
        explanation:
          "TF tuyến tính: từ lặp 10 lần = 2x điểm so với 5 lần. BM25 bão hoà: 10 lần chỉ hơn 5 lần một chút. Thêm chuẩn hoá theo độ dài tài liệu để công bằng.",
      },
      {
        question: "Parameter b = 0.75 trong BM25 kiểm soát gì?",
        options: [
          "Tốc độ tìm kiếm",
          "Mức phạt theo độ dài tài liệu: b=1 phạt nặng tài liệu dài, b=0 bỏ qua",
          "Số kết quả trả về",
          "Ngưỡng confidence",
        ],
        correct: 1,
        explanation:
          "b kiểm soát length normalization. b=1: tài liệu dài gấp đôi trung bình bị phạt nặng (vì nhiều từ hơn tự nhiên chứa query terms). b=0: bỏ qua độ dài. Mặc định b=0.75 là cân bằng tốt.",
      },
      {
        question: "Tại sao BM25 vẫn quan trọng dù đã có semantic search?",
        options: [
          "BM25 miễn phí còn semantic search tốn tiền",
          "BM25 giỏi khớp chính xác tên riêng, mã sản phẩm, thuật ngữ — nơi semantic search yếu",
          "BM25 luôn chính xác hơn",
          "BM25 không cần GPU",
        ],
        correct: 1,
        explanation:
          "Tìm 'iPhone 16 Pro Max': BM25 khớp chính xác từng từ. Semantic search có thể trả về 'Samsung Galaxy' vì 'điện thoại cao cấp' gần nhau về nghĩa. BM25 + Semantic = Hybrid Search!",
      },
      {
        question: "Parameter k1 trong BM25 kiểm soát gì?",
        options: [
          "Mức độ bão hoà của TF: k1 cao → TF gần tuyến tính; k1 thấp → bão hoà nhanh",
          "Số lượng document trong index",
          "Cutoff để filter stopword",
          "Ngưỡng để hiển thị kết quả",
        ],
        correct: 0,
        explanation:
          "k1 = 0 → BM25 chỉ dùng IDF (không quan tâm tần suất). k1 = ∞ → TF tuyến tính. Mặc định k1 = 1.2 đến 2.0. Tuỳ corpus, bạn có thể tune: corpus spam-heavy cần k1 thấp (tránh keyword stuffing), corpus cần k1 cao khi TF thực sự mang tín hiệu.",
      },
      {
        question: "IDF trong BM25 khác với IDF cổ điển thế nào?",
        options: [
          "Giống hệt nhau",
          "BM25 dùng ln((N - df + 0.5)/(df + 0.5) + 1) — tránh giá trị âm và ổn định hơn khi df lớn",
          "BM25 không dùng IDF",
          "BM25 dùng TF thay IDF",
        ],
        correct: 1,
        explanation:
          "IDF cổ điển ln(N/df) có thể âm khi df > N/2. BM25 Okapi dùng công thức Robertson-Spärck-Jones với +0.5 smoothing và +1 bên ngoài ln để đảm bảo kết quả không âm, ổn định với df cao.",
      },
      {
        question: "Khi nào BM25 FAIL — không tìm được document đúng?",
        options: [
          "Khi user viết đồng nghĩa hoặc paraphrase (hỏi 'thú cưng' nhưng doc viết 'chó mèo')",
          "Khi doc quá ngắn",
          "Khi có nhiều stopword",
          "Khi dùng tiếng Anh",
        ],
        correct: 0,
        explanation:
          "BM25 là lexical matching — chỉ khớp chính xác. Không hiểu đồng nghĩa, viết tắt, ngữ cảnh, đa ngôn ngữ. Đây là lý do tồn tại Semantic Search (vector embedding) và Hybrid Search.",
      },
      {
        question: "Hybrid Search kết hợp BM25 với cái gì, và vì sao?",
        options: [
          "BM25 + vector search, vì BM25 giỏi exact match còn vector giỏi semantic",
          "BM25 + PageRank",
          "BM25 + rule engine",
          "BM25 + fuzzy matching",
        ],
        correct: 0,
        explanation:
          "Hybrid Search dùng RRF (Reciprocal Rank Fusion) hoặc linear combination để hợp nhất 2 bảng xếp hạng. BM25 bắt tên riêng, code, số hiệu; vector bắt ý nghĩa. Kết quả tốt hơn cả hai đứng riêng 5-15%.",
      },
      {
        type: "fill-blank",
        question:
          "BM25 kết hợp 2 thành phần chính: {blank} đo tần suất từ trong tài liệu, còn {blank} đo độ hiếm của từ trên toàn bộ corpus.",
        blanks: [
          { answer: "TF", accept: ["term frequency", "tần suất từ"] },
          { answer: "IDF", accept: ["inverse document frequency", "độ hiếm"] },
        ],
        explanation:
          "TF (Term Frequency) đếm tần suất từ trong một tài liệu — nhưng bão hoà để tránh thiên vị. IDF (Inverse Document Frequency) nâng điểm cho từ hiếm, hạ điểm cho từ phổ biến như 'và', 'là'. BM25 = TF x IDF + chuẩn hoá độ dài.",
      },
      {
        question:
          "Bão hoà TF (saturation) trong BM25 có nghĩa là gì, và tại sao có lợi?",
        options: [
          "TF luôn giảm dần theo thời gian",
          "Từ lặp thêm 1 lần khi đã có nhiều lần sẽ đóng góp ít hơn 1 lần đầu — chống keyword stuffing và phản ánh thực tế ngôn ngữ",
          "TF bị cắt tuyệt đối sau 10 lần",
          "TF được chia cho số từ trong tài liệu",
        ],
        correct: 1,
        explanation:
          "Hàm tf·(k1+1)/(tf + k1·…) là một đường cong tiệm cận — TF=1 đóng góp nhiều nhất, TF=2 chỉ hơn TF=1 một chút, TF=10 gần bằng TF=20. Lý do: sau khi đã biết chủ đề tài liệu, việc gặp lại cùng từ không mang thêm thông tin nhiều. Đây là insight key của Robertson, giúp BM25 vượt TF-IDF.",
      },
      {
        question:
          "Với query 2 từ và một doc chứa cả hai từ nhưng cách xa nhau 500 từ, BM25 tính điểm thế nào?",
        options: [
          "Phạt nặng vì 2 từ xa nhau",
          "Cộng độc lập điểm từng từ — BM25 không quan tâm vị trí/khoảng cách giữa các từ trong query",
          "Chỉ tính từ đầu tiên",
          "Trả về 0",
        ],
        correct: 1,
        explanation:
          "BM25 là bag-of-words: mỗi từ trong query được tính điểm độc lập rồi cộng lại. Không xét proximity (khoảng cách). Nếu cần tìm cụm chính xác, bạn cần phrase query hoặc variants như BM25+proximity bonus (Lucene có span query). Đây cũng là hạn chế mà vector/semantic search khắc phục.",
      },
    ],
    [],
  );

  return (
    <>
      <LessonSection step={1} totalSteps={8} label="Dự đoán">
        <PredictionGate
          question="Bạn tìm 'luật lao động 2025' trên VnExpress. Bài nào nên xếp trên? Bài A nhắc 'luật lao động' 5 lần (200 từ) hay bài B nhắc 3 lần (5000 từ)?"
          options={[
            "Bài B vì dài hơn, chắc chi tiết hơn",
            "Bài A vì mật độ từ khoá cao hơn (5 lần trong 200 từ vs 3 lần trong 5000 từ)",
            "Cả hai ngang nhau",
          ]}
          correct={1}
          explanation="BM25 xét 3 yếu tố: tần suất từ (TF), độ hiếm của từ (IDF), và chuẩn hoá theo độ dài. Bài A có mật độ cao hơn (2.5% vs 0.06%) nên xếp trên!"
        >

      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Dưới đây là <strong className="text-foreground">BM25 calculator</strong>{" "}thật: 3 tài liệu,
          một query, và hai slider kiểm soát <LaTeX>{"k_1"}</LaTeX> (bão hoà TF) và <LaTeX>{"b"}</LaTeX>{" "}
          (chuẩn hoá độ dài). Các con số được tính trực tiếp trong trình duyệt — bạn có thể kiểm chứng
          bằng công thức ở phần Lý thuyết.
        </p>
        <VisualizationSection>
          <div className="space-y-5">
            {/* Query */}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-2">1. Nhập truy vấn</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-blue-500 focus:outline-none"
                  placeholder="luật lao động"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESET_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQueryPreset(q)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      q === query
                        ? "border-blue-500 bg-blue-500/15 text-blue-300"
                        : "border-border bg-card text-muted hover:border-blue-500/40"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-muted">Terms:</span>
                {queryTerms.length === 0 && <span className="text-muted italic">(trống)</span>}
                {queryTerms.map((t) => (
                  <span key={t} className={`font-mono font-semibold ${termColorMap[t]}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted">2. Tune parameters</p>
                <button
                  onClick={resetParams}
                  className="rounded border border-border bg-card px-2 py-1 text-[11px] text-muted hover:text-foreground"
                >
                  ↻ Về mặc định
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex items-baseline justify-between">
                    <label className="text-sm font-semibold text-amber-400">
                      <LaTeX>{"k_1"}</LaTeX> = {k1.toFixed(2)}
                    </label>
                    <span className="text-[10px] text-muted">bão hoà TF (1.2–2.0)</span>
                  </div>
                  <input
                    type="range"
                    min={1.2}
                    max={2.0}
                    step={0.05}
                    value={k1}
                    onChange={(e) => setK1(parseFloat(e.target.value))}
                    className="mt-2 w-full accent-amber-500"
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    k₁ cao → từ lặp vẫn tăng điểm. k₁ thấp → bão hoà sớm, 3 lần gần = 10 lần.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex items-baseline justify-between">
                    <label className="text-sm font-semibold text-emerald-400">
                      <LaTeX>{"b"}</LaTeX> = {b.toFixed(2)}
                    </label>
                    <span className="text-[10px] text-muted">length norm (0–1)</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={b}
                    onChange={(e) => setB(parseFloat(e.target.value))}
                    className="mt-2 w-full accent-emerald-500"
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    b=1 phạt doc dài nặng. b=0 bỏ qua độ dài. Mặc định 0.75 cân bằng tốt.
                  </p>
                </div>
              </div>
              <div className="mt-2 rounded bg-background/40 p-2 text-[11px] text-muted">
                Corpus: <strong>N = {N_DOCS}</strong> docs,{" "}
                <strong>avgdl = {AVGDL.toFixed(1)}</strong> tokens/doc
              </div>
            </div>

            {/* Docs + scores */}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-2">
                3. Điểm BM25 của từng document (live)
              </p>
              <div className="space-y-3">
                {scoredDocs.map(({ doc, perTerm, bm25Total }) => {
                  const isExpanded = expandedDoc === doc.id;
                  const barPct = Math.min(100, (bm25Total / maxBm25) * 100);
                  return (
                    <div key={doc.id} className="rounded-xl border border-border bg-background/50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-background/80 px-2 py-0.5 text-[10px] font-bold text-foreground">
                              {doc.id}
                            </span>
                            <span className="text-xs text-muted">
                              {doc.tokens.length} tokens · |D|/avgdl ={" "}
                              {(doc.tokens.length / AVGDL).toFixed(2)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed">
                            {doc.tokens.map((t, i) => {
                              const match = termColorMap[t];
                              return (
                                <span
                                  key={i}
                                  className={
                                    match
                                      ? `${match} bg-background/60 px-1 rounded font-semibold`
                                      : "text-muted"
                                  }
                                >
                                  {t}{" "}
                                </span>
                              );
                            })}
                          </p>
                        </div>
                        <div className="w-32 shrink-0 text-right">
                          <p className="font-mono text-lg font-bold text-blue-400">
                            {bm25Total.toFixed(3)}
                          </p>
                          <p className="text-[10px] text-muted">BM25 score</p>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-background">
                            <motion.div
                              className="h-full bg-blue-500"
                              animate={{ width: `${barPct}%` }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                        className="mt-2 text-[11px] text-muted hover:text-foreground"
                      >
                        {isExpanded ? "▾ Ẩn breakdown" : "▸ Xem breakdown theo term"}
                      </button>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2 overflow-hidden rounded-lg border border-border bg-background p-2"
                        >
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="border-b border-border text-left text-muted">
                                <th className="py-1 pr-2">Term</th>
                                <th className="py-1 pr-2">TF</th>
                                <th className="py-1 pr-2">IDF</th>
                                <th className="py-1 pr-2">contribution</th>
                              </tr>
                            </thead>
                            <tbody>
                              {perTerm.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-2 text-center text-muted">
                                    Chưa có term nào
                                  </td>
                                </tr>
                              ) : (
                                perTerm.map((row) => (
                                  <tr key={row.term} className="border-b border-border/50">
                                    <td className={`py-1 pr-2 font-mono ${termColorMap[row.term]}`}>
                                      {row.term}
                                    </td>
                                    <td className="py-1 pr-2 font-mono text-amber-400">{row.tf}</td>
                                    <td className="py-1 pr-2 font-mono text-purple-400">
                                      {row.idfValue.toFixed(3)}
                                    </td>
                                    <td className="py-1 pr-2 font-mono text-blue-400">
                                      {row.contribution.toFixed(3)}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={3} className="py-1 pr-2 text-right text-muted">
                                  Tổng BM25:
                                </td>
                                <td className="py-1 pr-2 font-mono font-bold text-blue-400">
                                  {bm25Total.toFixed(3)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison: BM25 vs TF-IDF ranking */}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-2">
                4. So sánh với TF-IDF (không có bão hoà, không có length norm)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
                  <p className="text-xs font-bold uppercase text-blue-400">Xếp hạng BM25</p>
                  <ol className="mt-2 space-y-1.5">
                    {rankedByBm25.map((entry, idx) => (
                      <li
                        key={entry.doc.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="w-5 shrink-0 text-center font-mono text-muted">
                          #{idx + 1}
                        </span>
                        <span className="rounded bg-background/70 px-1.5 py-0.5 font-mono">
                          {entry.doc.id}
                        </span>
                        <span className="flex-1 h-1.5 overflow-hidden rounded-full bg-background">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${(entry.bm25Total / maxBm25) * 100}%` }}
                          />
                        </span>
                        <span className="font-mono text-blue-400 w-14 text-right">
                          {entry.bm25Total.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-3">
                  <p className="text-xs font-bold uppercase text-pink-400">Xếp hạng TF-IDF</p>
                  <ol className="mt-2 space-y-1.5">
                    {rankedByTfidf.map((entry, idx) => (
                      <li
                        key={entry.doc.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="w-5 shrink-0 text-center font-mono text-muted">
                          #{idx + 1}
                        </span>
                        <span className="rounded bg-background/70 px-1.5 py-0.5 font-mono">
                          {entry.doc.id}
                        </span>
                        <span className="flex-1 h-1.5 overflow-hidden rounded-full bg-background">
                          <div
                            className="h-full bg-pink-500"
                            style={{ width: `${(entry.tfidfTotal / maxTfidf) * 100}%` }}
                          />
                        </span>
                        <span className="font-mono text-pink-400 w-14 text-right">
                          {entry.tfidfTotal.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted leading-relaxed">
                Hãy thử kéo <LaTeX>{"b"}</LaTeX> về 0 — length norm tắt, điểm của <code>D2</code>{" "}
                (doc dài) sẽ tăng. Kéo <LaTeX>{"k_1"}</LaTeX> về 1.2 — bão hoà mạnh, từ lặp nhiều lần
                không còn được cộng nhiều. BM25 = TF-IDF &quot;biết điều chỉnh&quot;.
              </p>
            </div>

            <ProgressSteps current={4} total={4} labels={["Query", "Tune", "Score", "Compare"]} />
          </div>
        </VisualizationSection>
      </LessonSection>

      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            BM25 giống <strong>chấm bài thi tự luận</strong>: đếm số lần nhắc đến chủ đề (TF), coi trọng
            thuật ngữ chuyên ngành hơn từ phổ biến (IDF), và không thiên vị bài dài (length norm). Là hậu
            duệ trực tiếp của <TopicLink slug="tf-idf">TF-IDF</TopicLink>, BM25 vẫn là{" "}
            <strong>baseline cực mạnh</strong>{" "}mà nhiều hệ thống{" "}
            <TopicLink slug="semantic-search">semantic search</TopicLink>{" "}hiện đại cũng khó thắng ở bài
            toán khớp chính xác, nên cả hai thường được kết hợp trong{" "}
            <TopicLink slug="hybrid-search">hybrid search</TopicLink>.
          </p>
          <p className="mt-3">
            Điểm &quot;aha&quot;: <LaTeX>{"k_1"}</LaTeX> không phải con số ma thuật — nó là cách bạn nói
            với hệ thống &quot;tôi muốn nhấn mạnh từ lặp nhiều lần bao nhiêu&quot;. <LaTeX>{"b"}</LaTeX>{" "}
            cũng vậy — &quot;tôi muốn phạt doc dài bao nhiêu&quot;. Hai núm vặn, hai câu hỏi ngôn ngữ
            tự nhiên, một công thức đẹp.
          </p>
        </AhaMoment>
      </LessonSection>

      <LessonSection step={4} totalSteps={8} label="Thử thách">
        <InlineChallenge
          question="Người dùng tìm 'thú cưng đáng yêu' nhưng tài liệu viết 'chó mèo dễ thương'. BM25 tìm được không?"
          options={[
            "Được, BM25 hiểu đồng nghĩa",
            "KHÔNG, BM25 chỉ khớp chính xác từ — 'thú cưng' != 'chó mèo', 'đáng yêu' != 'dễ thương'",
            "Được nếu tăng k1 lên cao",
          ]}
          correct={1}
          explanation="BM25 là lexical search — chỉ khớp chính xác chuỗi ký tự. Không hiểu đồng nghĩa, viết tắt, hay ngữ cảnh. Đây là lý do cần Semantic Search bổ sung, tạo thành Hybrid Search!"
        />

        <div className="mt-5">
          <InlineChallenge
            question="Bạn tune BM25 cho corpus sản phẩm e-commerce với mô tả dài 200-2000 từ. Seller hay nhồi keyword ('áo thun áo thun áo thun...'). Nên chỉnh k1 và b thế nào?"
            options={[
              "Tăng k1 (cho phép TF lớn) và tăng b (phạt mạnh doc dài)",
              "Giảm k1 (bão hoà sớm, chống keyword stuffing) và giảm b nhẹ (không phạt quá mức vì mô tả dài có lý do)",
              "Giữ mặc định k1=1.5, b=0.75 — không bao giờ cần tune",
              "Đặt k1=0 và b=1 để chỉ xét IDF",
            ]}
            correct={1}
            explanation="Khi có keyword stuffing, bạn muốn TF bão hoà nhanh → giảm k1 xuống 1.0-1.2. Nếu doc dài có lý do chính đáng (mô tả chi tiết sản phẩm), giảm b xuống 0.5-0.6 để không phạt quá mức. Luôn A/B test trên queries thật."
          />
        </div>
      </LessonSection>

      <LessonSection step={5} totalSteps={8} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>BM25</strong>{" "}(Best Matching 25) là thuật toán xếp hạng kinh điển trong Information
            Retrieval, nền tảng của Elasticsearch, Solr, Lucene, OpenSearch và nhiều search engine. Được
            Stephen Robertson và Karen Spärck Jones phát triển ở Cambridge từ những năm 1970-1990, BM25
            đến nay vẫn là <em>strong baseline</em> mà mọi retrieval system mới đều phải so sánh.
          </p>

          <p>
            <strong>Công thức BM25 đầy đủ:</strong>
          </p>
          <LaTeX block>
            {"\\text{score}(D, Q) = \\sum_{i=1}^{n} \\text{IDF}(q_i) \\cdot \\frac{f(q_i, D) \\cdot (k_1 + 1)}{f(q_i, D) + k_1 \\cdot \\left(1 - b + b \\cdot \\frac{|D|}{\\text{avgdl}}\\right)}"}
          </LaTeX>

          <p>
            <strong>Công thức IDF (Okapi variant):</strong>
          </p>
          <LaTeX block>
            {"\\text{IDF}(q_i) = \\ln\\left(\\frac{N - n(q_i) + 0.5}{n(q_i) + 0.5} + 1\\right)"}
          </LaTeX>

          <p className="text-sm text-muted leading-relaxed">
            Trong đó: <LaTeX>{"f(q_i, D)"}</LaTeX> = tần suất từ <LaTeX>{"q_i"}</LaTeX> trong tài liệu{" "}
            <LaTeX>{"D"}</LaTeX>; <LaTeX>{"n(q_i)"}</LaTeX> = số tài liệu chứa{" "}
            <LaTeX>{"q_i"}</LaTeX>; <LaTeX>{"N"}</LaTeX> = tổng số tài liệu;{" "}
            <LaTeX>{"|D|"}</LaTeX> = độ dài tài liệu; <LaTeX>{"\\text{avgdl}"}</LaTeX> = độ dài trung
            bình. <LaTeX>{"k_1"}</LaTeX> thường trong khoảng 1.2-2.0; <LaTeX>{"b"}</LaTeX> trong khoảng
            0-1, mặc định 0.75.
          </p>

          <p>
            <strong>Hiểu từng phần của công thức:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              Tử số <LaTeX>{"f(q_i, D) \\cdot (k_1 + 1)"}</LaTeX>: tăng tuyến tính theo TF, nhân với hằng
              số để scale.
            </li>
            <li>
              Mẫu số <LaTeX>{"f(q_i, D) + k_1 \\cdot (1 - b + b \\cdot |D|/\\text{avgdl})"}</LaTeX>: khi
              TF tăng, mẫu cũng tăng → phần TF bão hoà. <LaTeX>{"|D|/\\text{avgdl}"}</LaTeX> đưa thông
              tin độ dài vào, nhân với <LaTeX>{"b"}</LaTeX> để kiểm soát mức ảnh hưởng.
            </li>
            <li>
              Khi <LaTeX>{"b = 0"}</LaTeX>: length không ảnh hưởng → giống Robertson-TF cổ điển.
            </li>
            <li>
              Khi <LaTeX>{"b = 1"}</LaTeX>: length phạt tối đa, doc dài gấp đôi trung bình bị phạt nặng.
            </li>
            <li>
              Khi <LaTeX>{"k_1 \\to \\infty"}</LaTeX>: TF gần tuyến tính, giống TF-IDF cổ điển.
            </li>
            <li>
              Khi <LaTeX>{"k_1 = 0"}</LaTeX>: chỉ dùng IDF (có hay không có từ, không quan tâm tần suất).
            </li>
          </ul>

          <Callout variant="insight" title="BM25 vs TF-IDF: khác biệt then chốt">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>TF-IDF:</strong>{" "}TF tuyến tính (10 lần = 2x 5 lần). Không chuẩn hoá độ dài.
                Đơn giản nhưng thiên vị doc dài.
              </li>
              <li>
                <strong>BM25:</strong>{" "}TF bão hoà (10 lần chỉ hơn 5 lần chút). Chuẩn hoá theo{" "}
                <LaTeX>{"|D|/\\text{avgdl}"}</LaTeX>. Parameter <LaTeX>{"k_1"}</LaTeX>,{" "}
                <LaTeX>{"b"}</LaTeX> tune được cho từng corpus.
              </li>
              <li>
                Trong hầu hết benchmark (TREC, BEIR), BM25 thắng TF-IDF 5-20% về nDCG và MRR.
              </li>
            </ul>
          </Callout>

          <p className="mt-4">
            <strong>So sánh chi tiết TF-IDF vs BM25 — bảng cheat sheet:</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-2 pr-3">Tiêu chí</th>
                  <th className="py-2 pr-3">TF-IDF (cổ điển)</th>
                  <th className="py-2 pr-3">BM25 (Okapi)</th>
                </tr>
              </thead>
              <tbody className="text-foreground/90">
                <tr className="border-b border-border/40">
                  <td className="py-2 pr-3 font-semibold">Công thức TF</td>
                  <td className="py-2 pr-3"><LaTeX>{"1 + \\log(\\text{tf})"}</LaTeX> hoặc <LaTeX>{"\\text{tf}"}</LaTeX></td>
                  <td className="py-2 pr-3"><LaTeX>{"\\frac{\\text{tf} \\cdot (k_1+1)}{\\text{tf} + k_1(\\dots)}"}</LaTeX></td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="py-2 pr-3 font-semibold">Bão hoà TF</td>
                  <td className="py-2 pr-3">Không (hoặc log rất nhẹ)</td>
                  <td className="py-2 pr-3">Có — kiểm soát bằng <LaTeX>{"k_1"}</LaTeX></td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="py-2 pr-3 font-semibold">Length norm</td>
                  <td className="py-2 pr-3">Không, hoặc cosine sau chuẩn hoá</td>
                  <td className="py-2 pr-3">Có — kiểm soát bằng <LaTeX>{"b"}</LaTeX></td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="py-2 pr-3 font-semibold">IDF smoothing</td>
                  <td className="py-2 pr-3">Không — <LaTeX>{"\\log(N/\\text{df})"}</LaTeX> có thể âm</td>
                  <td className="py-2 pr-3">Có — <LaTeX>{"+0.5"}</LaTeX> smoothing Robertson-SJ</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="py-2 pr-3 font-semibold">Parameters tune</td>
                  <td className="py-2 pr-3">0 (không có)</td>
                  <td className="py-2 pr-3">2 (<LaTeX>{"k_1, b"}</LaTeX>) — tune được</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="py-2 pr-3 font-semibold">Probabilistic foundation</td>
                  <td className="py-2 pr-3">Heuristic</td>
                  <td className="py-2 pr-3">Có — Probabilistic Relevance Model</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold">Benchmark wins</td>
                  <td className="py-2 pr-3">Baseline cũ</td>
                  <td className="py-2 pr-3">+5-20% nDCG@10 trên TREC/BEIR</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm leading-relaxed">
            Một cách đơn giản để nhớ: <strong>BM25 = TF-IDF sau khi đi học về xác suất</strong>. Robertson
            và nhóm Cambridge đã chính thức hoá TF-IDF trong khung Probabilistic Relevance Framework, và
            mỗi &quot;hack&quot; của BM25 (saturation, length norm, IDF smoothing) đều có giải thích toán
            học — không phải magic number.
          </p>

          <Callout variant="insight" title="Saturation effect: vì sao từ lặp 20 lần ≠ 20x điểm">
            <p>
              Đây là insight trung tâm của BM25. Hàm TF của BM25 là:
            </p>
            <LaTeX block>
              {"\\text{tf-score}(f) = \\frac{f \\cdot (k_1 + 1)}{f + k_1}"}
            </LaTeX>
            <p className="mt-2 text-sm">
              Khi <LaTeX>{"f = 1"}</LaTeX>: tf-score = <LaTeX>{"(k_1+1)/(1+k_1)"}</LaTeX> ≈ 1. Khi{" "}
              <LaTeX>{"f \\to \\infty"}</LaTeX>: tf-score → <LaTeX>{"k_1 + 1"}</LaTeX> (giá trị cận trên).
              Với <LaTeX>{"k_1 = 1.2"}</LaTeX>, điểm tối đa là 2.2 — từ xuất hiện 1000 lần cũng không vượt
              được con số này.
            </p>
            <p className="mt-2 text-sm">
              <strong>Ý nghĩa thực tế:</strong> một seller viết &quot;iPhone iPhone iPhone ... (x100)&quot;
              trong mô tả sản phẩm không thể &quot;game&quot; BM25 để lên top. TF đầu tiên quan trọng nhất,
              các lần lặp sau gần như không thêm giá trị. Đây là phiên bản IR của định luật hiệu dụng biên
              giảm dần (diminishing returns) trong kinh tế học.
            </p>
            <p className="mt-2 text-sm">
              So sánh với TF-IDF cổ điển: nếu dùng raw TF, doc lặp từ 100 lần có điểm gấp 100 doc lặp 1 lần —
              cực dễ bị thao túng. Log TF (1 + log f) đỡ hơn nhưng vẫn không có cận trên. BM25 là thuật
              toán duy nhất trong họ có cận trên rõ ràng.
            </p>
          </Callout>

          <Callout variant="info" title="BM25F: mở rộng cho document có nhiều field">
            <p>
              BM25F (F = Field) cho phép gán trọng số cho từng field: title, body, tags. Ví dụ tìm
              &quot;iPhone&quot;, match trong <code>title</code> quan trọng hơn match trong{" "}
              <code>body</code>. Elasticsearch hỗ trợ qua <code>multi_match</code> với boost — nội bộ
              vẫn là BM25F.
            </p>
            <p className="mt-2 text-xs">
              Công thức: score = Σ (IDF × saturated_TF), trong đó saturated_TF tổng hợp TF từ tất cả
              field với weight riêng cho từng field trước khi bão hoà — không bão hoà từng field riêng.
            </p>
          </Callout>

          <Callout variant="tip" title="Khi nào tune k1, b — và khi nào để mặc định">
            <p>
              Với đa số corpus tiếng Anh/Việt trung bình, <LaTeX>{"k_1 = 1.2-1.5"}</LaTeX> và{" "}
              <LaTeX>{"b = 0.75"}</LaTeX> là giá trị tốt. Tune khi: (1) bạn có tập query-relevance labels
              để đo, (2) corpus có đặc điểm đặc biệt (rất dài, rất ngắn, spammy, multilingual), (3) bạn
              dùng grid search trên validation set.
            </p>
          </Callout>

          <Callout variant="warning" title="BM25 không hiểu ngữ nghĩa">
            <p>
              Đây là hạn chế cốt lõi của BM25: là thuật toán <em>lexical</em>, chỉ khớp chuỗi ký tự.
              Không hiểu từ đồng nghĩa (&quot;xe hơi&quot; vs &quot;ô tô&quot;), viết tắt (&quot;BĐS&quot;
              vs &quot;bất động sản&quot;), paraphrase, ngữ cảnh, hay ngôn ngữ khác. Cách khắc phục: (a)
              query expansion, (b) semantic search bổ sung (hybrid), (c) stemming + lemmatization.
            </p>
          </Callout>

          <CodeBlock language="python" title="BM25 với rank_bm25 — ví dụ đầy đủ">
{`from rank_bm25 import BM25Okapi
import numpy as np

# 1. Tokenize corpus — quan trọng: lowercase, loại stopwords nếu cần
corpus_raw = [
    "Luật lao động Việt Nam quy định quyền người lao động.",
    "Bộ luật lao động mới đã cập nhật điều khoản lương tối thiểu vùng.",
    "Luật lao động bảo vệ quyền lợi chính đáng của người lao động.",
    "Luật giao thông đường bộ quy định về tốc độ tối đa.",
    "Quyền và nghĩa vụ người lao động theo quy định của pháp luật.",
]
corpus = [doc.lower().split() for doc in corpus_raw]

# 2. Tạo BM25 index
#    rank_bm25 mặc định: k1=1.5, b=0.75, epsilon=0.25
bm25 = BM25Okapi(corpus, k1=1.5, b=0.75)

# 3. Tìm kiếm
query = "quyền người lao động".lower().split()
scores = bm25.get_scores(query)
print("Raw scores:", scores)
# → [array of 5 floats]

# 4. Top-K kết quả
top_k = 3
top_indices = np.argsort(scores)[::-1][:top_k]
for rank, idx in enumerate(top_indices, 1):
    print(f"#{rank} score={scores[idx]:.3f} → {corpus_raw[idx]}")

# 5. Nếu cần xếp hạng doc mới không có trong index:
new_docs = [
    "Quy định pháp luật bảo vệ quyền người lao động.".lower().split(),
    "Cách nấu phở bò theo công thức truyền thống.".lower().split(),
]
new_scores = bm25.get_batch_scores(query, new_docs)
# Chú ý: get_batch_scores reuse IDF từ index gốc.
# Muốn IDF tính lại với corpus mới → tạo BM25Okapi mới.

# 6. Variant BM25L (cho doc rất dài/ngắn)
from rank_bm25 import BM25L
bm25_l = BM25L(corpus, k1=1.5, b=0.75, delta=0.5)
# BM25L thêm parameter delta để tránh over-penalize doc dài.

# 7. Variant BM25Plus (Lv & Zhai 2011)
from rank_bm25 import BM25Plus
bm25_plus = BM25Plus(corpus, k1=1.5, b=0.75, delta=1.0)
# BM25Plus sửa lỗi "unfair" với doc dài ở TF thấp.`}
          </CodeBlock>

          <CodeBlock language="python" title="BM25 trong Elasticsearch + Hybrid Search với embedding">
{`# Elasticsearch dùng BM25 làm default similarity từ ES 5.0+
# Mọi query "match" chạy BM25 dưới nền.

from elasticsearch import Elasticsearch
es = Elasticsearch("http://localhost:9200")

# 1. Tạo index với custom BM25 params
es.indices.create(
    index="vnexpress",
    body={
        "settings": {
            "index": {
                "similarity": {
                    "custom_bm25": {
                        "type": "BM25",
                        "k1": 1.2,   # bão hoà TF
                        "b": 0.75,   # length norm
                    }
                }
            }
        },
        "mappings": {
            "properties": {
                "title": {
                    "type": "text",
                    "similarity": "custom_bm25",
                    "analyzer": "vietnamese",
                },
                "body": {
                    "type": "text",
                    "similarity": "custom_bm25",
                    "analyzer": "vietnamese",
                },
                "embedding": {
                    "type": "dense_vector",
                    "dims": 768,
                    "index": True,
                    "similarity": "cosine",
                },
            }
        },
    },
)

# 2. Hybrid Search: BM25 + vector với RRF
def hybrid_search(query_text: str, query_embedding: list[float], k: int = 10):
    response = es.search(
        index="vnexpress",
        body={
            "size": k,
            "query": {
                "bool": {
                    "should": [
                        # BM25 branch
                        {
                            "multi_match": {
                                "query": query_text,
                                "fields": ["title^3", "body"],  # title boost 3x
                                "type": "best_fields",
                            }
                        },
                        # Vector branch
                        {
                            "knn": {
                                "field": "embedding",
                                "query_vector": query_embedding,
                                "k": k * 2,
                                "num_candidates": 200,
                            }
                        },
                    ]
                }
            },
        },
    )
    return response["hits"]["hits"]

# 3. Reciprocal Rank Fusion (RRF) nếu muốn fuse thủ công
def rrf_fuse(bm25_results, vector_results, k: int = 60):
    """
    RRF score(d) = Σ 1/(k + rank_i(d))
    Ít sensitive với raw score scale → tốt cho hybrid.
    """
    scores = {}
    for rank, hit in enumerate(bm25_results):
        doc_id = hit["_id"]
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    for rank, hit in enumerate(vector_results):
        doc_id = hit["_id"]
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    return sorted(scores.items(), key=lambda x: -x[1])`}
          </CodeBlock>

          <CollapsibleDetail title="Các variant của BM25 — và khi nào dùng cái nào">
            <p className="text-sm leading-relaxed">
              BM25 có nhiều họ hàng đã được đề xuất để khắc phục các khiếm khuyết nhỏ. Biết chúng giúp bạn
              chọn đúng cho use case:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                <strong>BM25 Okapi:</strong>{" "}phiên bản gốc, mặc định của Elasticsearch/Lucene.
              </li>
              <li>
                <strong>BM25L (Lv &amp; Zhai 2011):</strong>{" "}thêm hằng số <LaTeX>{"\\delta"}</LaTeX> để
                tránh phạt quá mức doc dài. Dùng khi corpus có phân phối độ dài rất lệch.
              </li>
              <li>
                <strong>BM25+:</strong>{" "}thêm <LaTeX>{"\\delta"}</LaTeX> vào phần TF để sửa lỗi
                &quot;unfair&quot; với doc dài tại TF thấp.
              </li>
              <li>
                <strong>BM25F:</strong>{" "}mở rộng cho doc có nhiều field với weight khác nhau.
              </li>
              <li>
                <strong>BM25T:</strong>{" "}dùng <em>term-specific</em> <LaTeX>{"k_1"}</LaTeX> — mỗi từ có{" "}
                <LaTeX>{"k_1"}</LaTeX> riêng, tune từ data.
              </li>
              <li>
                <strong>BM25-adpt:</strong>{" "}adaptive k1 theo document length — hiếm khi cần trong thực
                tế.
              </li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed">
              Thực tế: 95% use case dùng BM25 Okapi mặc định là đủ tốt. Chỉ nghĩ đến variant khác khi bạn
              đã có evaluation pipeline chặt chẽ và thấy BM25 baseline fail ở pattern cụ thể.
            </p>

            <p className="mt-3 text-sm font-semibold text-foreground">
              Chi tiết về BM25F (multi-field scoring):
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              Document thực tế hầu như không bao giờ là &quot;một khối văn bản đồng nhất&quot;. Bài báo có{" "}
              <code>title</code>, <code>body</code>, <code>tags</code>, <code>author</code>; sản phẩm có{" "}
              <code>name</code>, <code>description</code>, <code>specs</code>, <code>reviews</code>. Mỗi
              field có độ dài khác nhau, mức độ quan trọng khác nhau. Nếu dùng BM25 phẳng (ghép tất cả
              thành một chuỗi), match trong <code>title</code> bị &quot;pha loãng&quot; bởi{" "}
              <code>body</code> dài.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              <strong>Công thức BM25F (đơn giản hoá):</strong>
            </p>
            <LaTeX block>
              {"\\tilde{f}(q, D) = \\sum_{c \\in \\text{fields}} w_c \\cdot \\frac{f(q, D_c)}{1 - b_c + b_c \\cdot |D_c|/\\text{avgdl}_c}"}
            </LaTeX>
            <LaTeX block>
              {"\\text{BM25F}(q, D) = \\sum_{q_i \\in Q} \\text{IDF}(q_i) \\cdot \\frac{\\tilde{f}(q_i, D) \\cdot (k_1+1)}{\\tilde{f}(q_i, D) + k_1}"}
            </LaTeX>
            <p className="mt-2 text-sm leading-relaxed">
              Điểm quan trọng: <em>length normalization và weighting xảy ra TRƯỚC bão hoà</em>. Nếu bão hoà
              từng field riêng rồi cộng, match 5 lần ở title sẽ không khác 1 lần ở title + 4 lần ở body —
              sai. BM25F gộp &quot;pseudo-TF&quot; có trọng số trước, rồi mới bão hoà một lần.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              <strong>Tune trong thực tế:</strong> title thường có{" "}
              <LaTeX>{"w_c = 3-5"}</LaTeX>, body <LaTeX>{"w_c = 1"}</LaTeX>, tags <LaTeX>{"w_c = 2"}</LaTeX>.
              Elasticsearch expose qua <code>multi_match</code> với <code>fields: [&quot;title^3&quot;, &quot;body&quot;]</code>{" "}
              — số sau <code>^</code> là boost tương đương <LaTeX>{"w_c"}</LaTeX>.
            </p>

            <p className="mt-3 text-sm font-semibold text-foreground">
              Chi tiết về BM25+ (Lv &amp; Zhai 2011):
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              Quan sát của Lv &amp; Zhai: BM25 Okapi phạt <em>quá mức</em> các doc dài có TF thấp. Ví dụ
              một bài luận 2000 từ có 1 lần nhắc &quot;BM25&quot; vẫn có thể relevant cao, nhưng BM25
              chuẩn cho điểm gần như 0. Họ đề xuất thêm hằng số <LaTeX>{"\\delta"}</LaTeX> (thường ~1.0):
            </p>
            <LaTeX block>
              {"\\text{BM25+}(q_i, D) = \\text{IDF}(q_i) \\cdot \\left[\\frac{f(q_i, D) \\cdot (k_1+1)}{f(q_i, D) + k_1(1 - b + b|D|/\\text{avgdl})} + \\delta\\right]"}
            </LaTeX>
            <p className="mt-2 text-sm leading-relaxed">
              <LaTeX>{"\\delta"}</LaTeX> là một &quot;hằng số công bằng&quot; đảm bảo doc chứa từ query
              luôn có điểm tối thiểu dương. Trên TREC robust track, BM25+ cho +2-3% MAP vs BM25 — không
              khổng lồ nhưng ổn định.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              <strong>Khi nào dùng BM25+?</strong> Corpus có doc rất dài (&gt;5000 từ) và bạn muốn recall
              cao hơn — news articles, research papers, legal documents. Với e-commerce descriptions
              ngắn, BM25+ không khác biệt rõ.
            </p>

            <p className="mt-3 text-sm font-semibold text-foreground">
              Chi tiết về BM25L (Lv &amp; Zhai 2011):
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              BM25L thay biến &quot;TF chuẩn hoá độ dài&quot; bằng một biến có shift <LaTeX>{"\\delta"}</LaTeX>{" "}
              để giảm phạt doc dài ở TF cao. Khác với BM25+ (shift điểm cuối), BM25L shift biến trung
              gian trong công thức TF. Hiệu quả tương tự, khác nhau ở chỗ curve nào bị ảnh hưởng nhiều
              hơn. Thực tế: chọn BM25+ vì đơn giản hơn, dễ implement.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="BM25 với proximity / phrase matching — mở rộng bag-of-words">
            <p className="text-sm leading-relaxed">
              BM25 gốc là bag-of-words: &quot;machine learning&quot; khớp với doc chứa &quot;machine&quot;{" "}
              ở đầu và &quot;learning&quot; ở cuối (cách 500 từ) y như với doc có hai từ đó cạnh nhau.
              Thực tế proximity mang tín hiệu relevance mạnh. Các mở rộng:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                <strong>Phrase query:</strong> đóng query trong dấu nháy <code>&quot;machine learning&quot;</code>{" "}
                → chỉ match khi hai từ liền kề. Lucene dùng positional inverted index.
              </li>
              <li>
                <strong>Sloppy phrase:</strong> cho phép khoảng cách <LaTeX>{"\\leq k"}</LaTeX> từ giữa hai
                term. Elasticsearch: <code>match_phrase</code> với <code>slop: 3</code>.
              </li>
              <li>
                <strong>BM25 + proximity bonus:</strong> cộng một bonus vào điểm BM25 nếu các query term
                xuất hiện gần nhau. Công thức: <LaTeX>{"\\text{score} = \\text{BM25}(Q, D) + \\lambda \\cdot \\text{prox}(Q, D)"}</LaTeX>,
                thường <LaTeX>{"\\lambda = 0.1-0.3"}</LaTeX>.
              </li>
              <li>
                <strong>Span queries (Lucene):</strong> specify pattern phức tạp (A gần B, không có C ở
                giữa). Dùng cho legal search, biomedical.
              </li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed">
              Đánh đổi: proximity tính toán chậm hơn (cần positional postings), index lớn hơn 2-3 lần. Với
              corpus &lt;10M docs, chấp nhận được; với web-scale thì phải cân nhắc.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Tokenization tiếng Việt cho BM25: vấn đề và giải pháp">
            <p className="text-sm leading-relaxed">
              BM25 phụ thuộc cực lớn vào tokenizer. Tiếng Việt có đặc điểm: dấu cách giữa tiếng
              (&quot;lao động&quot; là 1 khái niệm nhưng 2 token nếu tách theo space). Nếu tokenize sai,
              BM25 không khớp được.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              <strong>Các lựa chọn:</strong>
            </p>
            <ul className="mt-1 list-disc list-inside space-y-1 pl-2 text-sm">
              <li>
                <strong>Whitespace tokenize:</strong>{" "}đơn giản nhưng &quot;lao động&quot; thành 2 token
                — query &quot;luật lao động&quot; vẫn match nhưng không &quot;hiểu&quot; cụm.
              </li>
              <li>
                <strong>Word segmentation (underthesea, pyvi):</strong>{" "}tách theo ranh giới từ tiếng
                Việt thực — &quot;lao_động&quot; thành 1 token. Match chính xác hơn.
              </li>
              <li>
                <strong>Character n-gram:</strong>{" "}fallback khi không có tokenizer — bắt được cả từ
                viết sai chính tả.
              </li>
              <li>
                <strong>Elasticsearch analyzer:</strong>{" "}dùng <code>vi_analyzer</code> hoặc plugin{" "}
                <code>elasticsearch-analysis-vietnamese</code>.
              </li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed">
              Lời khuyên: luôn đo tokenization quality trước khi tune BM25. Một tokenizer tốt thường cải
              thiện nDCG hơn nhiều so với tune k1/b.
            </p>
          </CollapsibleDetail>

          <p className="mt-5">
            <strong>BM25 trong thực tế production:</strong>{" "}không phải ai cũng viết BM25 từ đầu. Các hệ
            thống phổ biến:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Elasticsearch / OpenSearch:</strong>{" "}default similarity, tune qua settings.
            </li>
            <li>
              <strong>Lucene / Solr:</strong>{" "}cùng nhân, API thấp hơn.
            </li>
            <li>
              <strong>Tantivy (Rust):</strong>{" "}nhân tìm kiếm nhanh hơn Lucene ~2x, cũng BM25 default.
            </li>
            <li>
              <strong>MeiliSearch / Typesense:</strong>{" "}BM25 kết hợp typo tolerance.
            </li>
            <li>
              <strong>rank_bm25 (Python):</strong>{" "}thư viện nhẹ cho prototype/research.
            </li>
            <li>
              <strong>BM25S (Python, 2024):</strong>{" "}implementation với sparse matrix, nhanh hơn
              rank_bm25 10-100x, phù hợp corpus lớn.
            </li>
            <li>
              <strong>Vespa / Qdrant / Weaviate:</strong>{" "}vector DB hiện đại cũng tích hợp BM25 để làm
              hybrid search.
            </li>
          </ul>

          <Callout variant="tip" title="Performance: BM25 có thể cực nhanh">
            <p>
              Với inverted index (posting lists theo term), BM25 ranking cho 1 query trên 1 triệu docs
              thường &lt; 10ms. Nhanh hơn vector search hàng chục lần ở dimension cao. Đây là lý do BM25
              thường là <em>first stage</em> trong pipeline &quot;retrieve then re-rank&quot;: BM25 lọc
              top-1000 nhanh, rồi re-ranker (cross-encoder) chấm lại top-1000 chậm hơn.
            </p>
          </Callout>

          <CodeBlock language="python" title="BM25S — implementation cực nhanh với sparse matrix (2024)">
{`# BM25S (Lu 2024) — reimagine BM25 dùng scipy.sparse
# GitHub: xhluca/bm25s — nhanh hơn rank_bm25 10-100x trên corpus lớn.
# Ý tưởng chính: precompute IDF × (k1+1) / (TF + k1·len-norm) dưới dạng
# sparse CSR matrix, query thành nhân vector sparse—sparse (cực nhanh).

import bm25s
import Stemmer  # optional — giảm số token độc nhất

# 1. Dataset
corpus = [
    "Luật lao động Việt Nam quy định quyền người lao động",
    "Bộ luật lao động mới cập nhật lương tối thiểu vùng",
    "Luật giao thông quy định tốc độ tối đa ô tô xe máy",
    "Quyền và nghĩa vụ người lao động theo pháp luật Việt Nam",
    "Hướng dẫn cách nấu phở bò truyền thống Hà Nội",
]

# 2. Tokenize với optional stemmer (tiếng Anh). Tiếng Việt: custom tokenizer.
stemmer = Stemmer.Stemmer("english")  # None cho tiếng Việt
corpus_tokens = bm25s.tokenize(corpus, stopwords="en", stemmer=stemmer)

# 3. Index — tạo sparse matrix, tính sẵn IDF
retriever = bm25s.BM25(k1=1.5, b=0.75)
retriever.index(corpus_tokens)

# 4. Query — nhanh hơn rank_bm25 ở batch mode
query = "quyền người lao động"
query_tokens = bm25s.tokenize(query, stemmer=stemmer)

# Top-K với scores
results, scores = retriever.retrieve(query_tokens, k=3)
for i, (idx, score) in enumerate(zip(results[0], scores[0])):
    print(f"#{i+1} score={score:.3f} → {corpus[idx]}")

# 5. Save / Load index — chỉ một thư mục sparse files
retriever.save("bm25s_index")
retriever = bm25s.BM25.load("bm25s_index")

# 6. Batch query — nhanh nhất khi bạn có 1000+ queries
queries = ["lương tối thiểu", "phở bò", "giao thông đường bộ"]
query_tokens_batch = bm25s.tokenize(queries, stemmer=stemmer)
results_batch, scores_batch = retriever.retrieve(query_tokens_batch, k=2)

# So sánh benchmark (từ paper BM25S):
# | Library    | 1M docs, 1k queries | speedup |
# | rank_bm25  | 120s                | 1x      |
# | BM25S      | 1.3s                | ~90x    |
# | PISA (C++) | 0.8s                | ~150x   |
#
# BM25S cân bằng tốt giữa ease-of-use (pure Python) và speed.`}
          </CodeBlock>

          <Callout variant="warning" title="Cảnh giác: BM25 có thể bị 'game' bởi adversarial content">
            <p>
              Tuy bão hoà TF chống keyword stuffing ngây thơ, nhưng vẫn có chiến thuật tấn công BM25:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li>
                <strong>Title stuffing:</strong> nhồi keyword vào title (BM25F boost title cao) — doc có
                thể lên top dù body lạc đề.
              </li>
              <li>
                <strong>Rare term injection:</strong> chèn từ hiếm nhưng bất ngờ xuất hiện trong query —
                IDF cao của từ hiếm boost điểm mạnh.
              </li>
              <li>
                <strong>Synonym farming:</strong> viết nhiều biến thể cùng nghĩa để tránh saturation —
                &quot;xe hơi, ô tô, auto, automobile&quot; cùng một doc.
              </li>
              <li>
                <strong>Cloaking:</strong> hiển thị văn bản khác nhau cho crawler và user.
              </li>
            </ul>
            <p className="mt-2 text-sm">
              Các search engine lớn đối phó bằng: (1) signal thứ cấp — PageRank, click-through rate,
              freshness, (2) spam classifier trước retrieval, (3) diversification trong ranking, (4)
              re-ranking với model học từ feedback.
            </p>
          </Callout>

          <Callout variant="info" title="BM25 vs BM25F vs BM25+ — decision tree thực chiến">
            <p className="text-sm">
              <strong>Dùng BM25 Okapi</strong> khi: doc là một khối text (news body, blog post), độ dài
              tương đối đồng đều, không cần tune field-level. Đây là default 95% use case.
            </p>
            <p className="mt-2 text-sm">
              <strong>Dùng BM25F</strong> khi: doc có structured fields với mức quan trọng khác nhau
              (e-commerce product với title/desc/tags, support ticket với subject/body/labels, academic
              paper với title/abstract/body). Boost field quan trọng lên 2-5x.
            </p>
            <p className="mt-2 text-sm">
              <strong>Dùng BM25+</strong> khi: corpus có doc rất dài (legal, scientific, news) và bạn
              quan sát thấy recall thấp ở doc dài — BM25+ shift điểm tối thiểu lên để không &quot;bỏ
              sót&quot; doc dài có TF thấp.
            </p>
            <p className="mt-2 text-sm">
              <strong>Dùng hybrid (BM25 + vector)</strong> khi: user query đa dạng (exact terms lẫn
              paraphrase), corpus có nội dung rich semantic (customer support, knowledge base). RRF fuse
              là cách đơn giản nhất, không cần retrain.
            </p>
          </Callout>

          <p className="mt-4 text-xs text-muted leading-relaxed">
            Lịch sử ngắn: BM25 là kết tinh từ dòng nghiên cứu Probabilistic Retrieval Model của Stephen
            Robertson, Karen Spärck Jones và team Cambridge/City University. &quot;BM&quot; là viết tắt
            của &quot;Best Matching&quot; — số 25 là phiên bản thứ 25 trong chuỗi thử nghiệm. Phiên bản
            này &quot;may mắn&quot; vừa đơn giản, vừa robust, vừa có parameter tune được → trở thành
            chuẩn de-facto trong 30 năm.
          </p>
          <p className="mt-2 text-xs text-muted leading-relaxed">
            Bài học: đôi khi thuật toán tốt nhất không phải thuật toán mới nhất. BM25 vẫn là{" "}
            <em>strong baseline</em> mà LLM-era retrieval vẫn phải kính nể. Học BM25 kỹ là đầu tư có lãi
            suốt sự nghiệp.
          </p>
        </ExplanationSection>
      </LessonSection>

      <LessonSection step={6} totalSteps={8} label="Tóm tắt">
        <MiniSummary
          points={[
            "BM25 = TF (tần suất, bão hoà) × IDF (độ hiếm) × Length Normalization (chuẩn hoá độ dài).",
            "Parameter k1 kiểm soát bão hoà TF (1.2-2.0), b kiểm soát phạt theo độ dài (0-1, mặc định 0.75).",
            "IDF của BM25 dùng công thức Okapi ln((N-df+0.5)/(df+0.5)+1) — an toàn với df lớn, không âm.",
            "Giỏi khớp chính xác: tên riêng, mã sản phẩm, thuật ngữ. Yếu: đồng nghĩa, paraphrase, ngữ cảnh.",
            "Vẫn là baseline mạnh, kết hợp semantic search trong Hybrid Search là chuẩn hiện đại.",
            "Biến thể (BM25F, BM25L, BM25+, BM25T) giải quyết case đặc biệt; mặc định BM25 Okapi đủ tốt cho 95% tình huống.",
          ]}
        />
      </LessonSection>

      <LessonSection step={7} totalSteps={8} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
