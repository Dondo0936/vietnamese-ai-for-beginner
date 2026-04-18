"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  LessonSection,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  TopicLink,
  CollapsibleDetail,
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
    "Tìm kiếm dựa trên ý nghĩa nội dung thay vì khớp từ khoá, sử dụng vector nhúng.",
  category: "search-retrieval",
  tags: ["semantic", "search", "embedding", "nlp"],
  difficulty: "intermediate",
  relatedSlugs: ["bm25", "hybrid-search", "embedding-model"],
  vizType: "interactive",
};

/* ──────────────────────────────────────────────────────────────
 *  DỮ LIỆU MINH HOẠ — KHO TÀI LIỆU
 *
 *  Bộ 8 tài liệu ngắn, gồm ba cụm chủ đề chính:
 *    • xe đạp thể thao / địa hình        (id 0..3)
 *    • thiết bị leo núi, dã ngoại        (id 4..5)
 *    • sản phẩm không liên quan          (id 6..7)
 *
 *  Mỗi tài liệu có:
 *    - text: nội dung hiển thị
 *    - embed: vector 2 chiều giả lập (đủ để vẽ trên scatter 2D)
 *    - bm25Tokens: danh sách từ được BM25 &quot;nhìn thấy&quot;
 *      (sau khi tokenize thô + bỏ dấu, không bao gồm stopword)
 *  Các giá trị được chọn thủ công sao cho:
 *    - Query &quot;xe đạp leo núi&quot; gần (cosine cao) với các tài
 *      liệu nói về mountain bike / xe địa hình, bất kể từ khoá
 *      trùng hay không.
 *    - BM25 (khớp từ) chỉ đánh trúng khi có từ &quot;xe&quot;, &quot;đạp&quot;
 *      hoặc &quot;leo&quot;, &quot;núi&quot; xuất hiện trong văn bản.
 * ────────────────────────────────────────────────────────────── */

interface Doc {
  id: number;
  text: string;
  embed: [number, number];
  bm25Tokens: string[];
}

const DOCS: Doc[] = [
  {
    id: 0,
    text: "Xe đạp leo núi Giant Talon 29 inch, giảm xóc trước",
    embed: [0.82, 0.58],
    bm25Tokens: ["xe", "đạp", "leo", "núi", "giant", "talon", "29", "inch", "giảm", "xóc", "trước"],
  },
  {
    id: 1,
    text: "Mountain bike Trek Marlin 7 cho đường mòn off-road",
    embed: [0.78, 0.62],
    bm25Tokens: ["mountain", "bike", "trek", "marlin", "7", "đường", "mòn", "off", "road"],
  },
  {
    id: 2,
    text: "Xe đạp địa hình full suspension cho tay đua chuyên nghiệp",
    embed: [0.80, 0.55],
    bm25Tokens: ["xe", "đạp", "địa", "hình", "full", "suspension", "tay", "đua", "chuyên", "nghiệp"],
  },
  {
    id: 3,
    text: "Xe dap dia hinh Asama giảm giá cuối năm",
    embed: [0.75, 0.60],
    bm25Tokens: ["xe", "dap", "dia", "hinh", "asama", "giảm", "giá", "cuối", "năm"],
  },
  {
    id: 4,
    text: "Giày leo núi Salomon chống trượt, đế Vibram",
    embed: [0.58, 0.78],
    bm25Tokens: ["giày", "leo", "núi", "salomon", "chống", "trượt", "đế", "vibram"],
  },
  {
    id: 5,
    text: "Balô dã ngoại Deuter 30L phù hợp trekking đường dài",
    embed: [0.52, 0.70],
    bm25Tokens: ["balô", "dã", "ngoại", "deuter", "30l", "phù", "hợp", "trekking", "đường", "dài"],
  },
  {
    id: 6,
    text: "Máy pha cà phê Delonghi La Specialista Arte",
    embed: [-0.72, 0.30],
    bm25Tokens: ["máy", "pha", "cà", "phê", "delonghi", "la", "specialista", "arte"],
  },
  {
    id: 7,
    text: "Tai nghe không dây Sony WH-1000XM5 chống ồn",
    embed: [-0.60, -0.55],
    bm25Tokens: ["tai", "nghe", "không", "dây", "sony", "wh", "1000xm5", "chống", "ồn"],
  },
];

/**
 * Bộ 4 câu truy vấn chuẩn bị sẵn, mỗi truy vấn đi kèm:
 *   - tokens: cho BM25
 *   - embed: cho semantic search (vector 2D)
 */
const QUERIES: Record<
  string,
  { tokens: string[]; embed: [number, number] }
> = {
  "xe đạp leo núi": {
    tokens: ["xe", "đạp", "leo", "núi"],
    embed: [0.78, 0.60],
  },
  "mountain bike chuyên nghiệp": {
    tokens: ["mountain", "bike", "chuyên", "nghiệp"],
    embed: [0.80, 0.56],
  },
  "giày trekking đường dài": {
    tokens: ["giày", "trekking", "đường", "dài"],
    embed: [0.56, 0.74],
  },
  "thiết bị pha cà phê espresso": {
    tokens: ["thiết", "bị", "pha", "cà", "phê", "espresso"],
    embed: [-0.70, 0.28],
  },
};

/* ──────────────────────────────────────────────────────────────
 *  CÔNG CỤ TÍNH TOÁN
 * ────────────────────────────────────────────────────────────── */

function norm(v: [number, number]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function cosine(a: [number, number], b: [number, number]): number {
  const n = norm(a) * norm(b);
  if (n === 0) return 0;
  return (a[0] * b[0] + a[1] * b[1]) / n;
}

/**
 * BM25 rất đơn giản: chấm điểm = số token truy vấn khớp với
 * tokens của tài liệu. Không dùng IDF/TF đầy đủ vì chúng ta chỉ
 * cần minh hoạ &quot;khớp hay không khớp&quot;. Điểm 0 → không trả về.
 */
function bm25Score(qTokens: string[], dTokens: string[]): number {
  let s = 0;
  for (const t of qTokens) if (dTokens.includes(t)) s += 1;
  return s;
}

function topK<T>(arr: T[], k: number, score: (t: T) => number): T[] {
  return [...arr].sort((a, b) => score(b) - score(a)).slice(0, k);
}

/* ──────────────────────────────────────────────────────────────
 *  BỘ CÂU HỎI QUIZ (8 câu)
 * ────────────────────────────────────────────────────────────── */

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Tại sao semantic search tìm được 'Mountain bike Trek Marlin' khi truy vấn 'xe đạp leo núi'?",
    options: [
      "Vì BM25 khớp được từ 'bike' với 'đạp'",
      "Vì embedding model chiếu 'xe đạp leo núi' và 'mountain bike' về các vector rất gần nhau trong không gian ngữ nghĩa",
      "Vì database có tag 'bike' trùng tag 'đạp'",
      "Vì có stemming tiếng Anh-Việt",
    ],
    correct: 1,
    explanation:
      "Embedding được huấn luyện để các cụm từ đồng nghĩa/cùng chủ đề có vector gần nhau — không cần ký tự trùng. 'xe đạp leo núi' và 'mountain bike' nằm cùng cụm &quot;xe địa hình&quot;, cosine similarity cao.",
  },
  {
    question: "Điểm khác cốt lõi giữa BM25 và semantic search là gì?",
    options: [
      "BM25 chạy trên GPU, semantic search chạy trên CPU",
      "BM25 cho điểm theo mức độ khớp token (sparse), semantic search cho điểm theo khoảng cách giữa vector dense",
      "BM25 luôn chính xác hơn",
      "Semantic search không dùng từ khoá",
    ],
    correct: 1,
    explanation:
      "BM25 = hàm điểm sparse dựa trên TF-IDF (có thêm độ dài tài liệu). Semantic search = dense retrieval: chiếu query + doc thành vector, xếp hạng theo cosine/dot-product. Hai phép đo bổ sung cho nhau trong hybrid search.",
  },
  {
    question: "Vì sao người ta thường dùng cosine thay vì Euclidean để xếp hạng embedding?",
    options: [
      "Cosine nhanh hơn Euclidean",
      "Cosine chỉ phụ thuộc vào GÓC giữa hai vector, không bị ảnh hưởng bởi độ dài/norm — phù hợp với embedding ngôn ngữ",
      "Euclidean không định nghĩa trong không gian cao chiều",
      "Cosine luôn trả về số nguyên",
    ],
    correct: 1,
    explanation:
      "Các embedding ngôn ngữ thường được huấn luyện sao cho hướng của vector mang nghĩa. Nếu đã L2-normalize (‖v‖=1) thì cosine = dot product, đây là phép tính phổ biến nhất trong vector database.",
  },
  {
    type: "code",
    question:
      "Viết code tính cosine similarity giữa query và từng tài liệu. Các vector đã được L2-normalize.",
    codeTemplate:
      "q = model.encode(query, normalize_embeddings=True)\nd = model.encode(docs, normalize_embeddings=True)\nscores = d @ ___\ntop = np.argsort(-___)[:5]",
    language: "python",
    blanks: [
      { answer: "q", accept: ["q.T"] },
      { answer: "scores", accept: [] },
    ],
    explanation:
      "Khi đã normalize, cosine similarity = dot product. Nhân ma trận doc với vector query một lần là xong. argsort(-scores) cho index giảm dần, [:5] lấy top-5.",
  },
  {
    question:
      "Semantic search YẾU ở bài toán nào sau đây?",
    options: [
      "Tìm đồng nghĩa giữa các ngôn ngữ khác nhau",
      "Tìm tài liệu paraphrase câu hỏi",
      "Tìm chính xác mã sản phẩm 'SKU-12345' hoặc tên model hiếm chỉ xuất hiện vài lần",
      "Xếp hạng theo độ liên quan chủ đề",
    ],
    correct: 2,
    explanation:
      "Embedding model coi 'SKU-12345' như một token chung chung, khó giữ ký tự chính xác. BM25 khớp exact tốt hơn nhiều. Đây là lý do hybrid search (BM25 + semantic) thường đánh bại mỗi phương pháp riêng lẻ.",
  },
  {
    question:
      "Bi-encoder khác cross-encoder thế nào trong pipeline retrieval?",
    options: [
      "Bi-encoder chỉ dùng cho ảnh, cross-encoder cho văn bản",
      "Bi-encoder encode query và doc RIÊNG RẼ (có thể precompute, nhanh), cross-encoder encode CÙNG LÚC (không precompute, chính xác hơn — dùng để re-rank)",
      "Cross-encoder nhanh hơn bi-encoder",
      "Chúng giống nhau, chỉ khác tên gọi",
    ],
    correct: 1,
    explanation:
      "Pipeline điển hình: bi-encoder lấy top-100 ứng viên từ vector DB, sau đó cross-encoder chấm lại top-100 đó để chọn top-10 cuối. Cross-encoder đắt O(N) nhưng chính xác — không thể dùng để quét toàn bộ corpus.",
  },
  {
    type: "fill-blank",
    question:
      "Semantic search dùng một {blank} để chuyển câu hỏi và tài liệu thành vector, rồi xếp hạng bằng {blank} — đo góc giữa hai vector, bằng 1 khi cùng hướng.",
    blanks: [
      {
        answer: "embedding model",
        accept: ["embedding", "mô hình embedding", "bi-encoder"],
      },
      {
        answer: "cosine similarity",
        accept: ["cosine", "độ tương tự cosine", "cosine sim"],
      },
    ],
    explanation:
      "Embedding model (hoặc bi-encoder) sinh vector dense; cosine similarity = (q·d) / (‖q‖‖d‖). Khi vector đã chuẩn hoá, cosine bằng dot product — đây là phép tính được mọi vector database tăng tốc.",
  },
  {
    question:
      "Trong một hệ thống bán lẻ, bạn nên chọn kiến trúc tìm kiếm nào?",
    options: [
      "Chỉ BM25 cho đơn giản",
      "Chỉ semantic search vì hiện đại hơn",
      "Hybrid: BM25 (khớp mã sản phẩm, tên model) + semantic (đồng nghĩa, mô tả công dụng), sau đó re-rank bằng cross-encoder",
      "Không cần tìm kiếm, chỉ dùng filter",
    ],
    correct: 2,
    explanation:
      "Sản phẩm vừa có mã chính xác (SKU, model number) vừa có mô tả công dụng tự nhiên. Hybrid tận dụng cả hai: BM25 cho 'chính xác', semantic cho 'liên quan', cross-encoder tinh chỉnh lại top-K.",
  },
];

/* ──────────────────────────────────────────────────────────────
 *  THÀNH PHẦN CHÍNH
 * ────────────────────────────────────────────────────────────── */

export default function SemanticSearchTopic() {
  const [selectedQuery, setSelectedQuery] = useState("xe đạp leo núi");
  const [mode, setMode] = useState<"keyword" | "semantic">("semantic");
  const [k, setK] = useState(3);

  const q = QUERIES[selectedQuery];

  /** Điểm BM25 & danh sách top-k của keyword search */
  const bm25Results = useMemo(() => {
    return DOCS.map((d) => ({ doc: d, score: bm25Score(q.tokens, d.bm25Tokens) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }, [q, k]);

  /** Cosine & top-k của semantic search */
  const semanticResults = useMemo(() => {
    const scored = DOCS.map((d) => ({
      doc: d,
      score: cosine(q.embed, d.embed),
    }));
    return topK(scored, k, (r) => r.score);
  }, [q, k]);

  const activeResults = mode === "keyword" ? bm25Results : semanticResults;

  /** Map từ doc id → rank (để vẽ nổi bật trên scatter) */
  const rankById = useMemo(() => {
    const m = new Map<number, number>();
    activeResults.forEach((r, idx) => m.set(r.doc.id, idx + 1));
    return m;
  }, [activeResults]);

  /** Biến tọa độ (2D embedding) thành pixel để vẽ scatter */
  const toPx = useCallback((v: [number, number]): [number, number] => {
    // Phạm vi [-1, 1] → [40, 460] × [40, 260]
    const x = 40 + ((v[0] + 1) / 2) * 420;
    const y = 300 - (40 + ((v[1] + 1) / 2) * 260);
    return [x, y];
  }, []);

  const [qx, qy] = toPx(q.embed);

  const TOTAL_STEPS = 8;

  return (
    <>
      {/* ═════ 1. DỰ ĐOÁN ═════ */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn gõ 'xe đạp leo núi' lên một website bán hàng. Có một sản phẩm tên 'Mountain bike Trek Marlin' — KHÔNG chứa bất kỳ từ nào trong truy vấn của bạn. Theo bạn, BM25 (khớp từ khoá) có trả về sản phẩm này không?"
          options={[
            "Có — BM25 hiểu ngữ cảnh",
            "KHÔNG — BM25 chỉ khớp token, không có từ nào trùng thì điểm = 0",
            "Có nếu sản phẩm phổ biến",
          ]}
          correct={1}
          explanation="BM25 cho điểm dựa trên TF-IDF của các token khớp. 'xe', 'đạp', 'leo', 'núi' đều không xuất hiện trong 'Mountain bike Trek Marlin' → điểm 0 → không trả về. Semantic search giải quyết chính xác khoảng trống này: nó so sánh Ý NGHĨA (vector) chứ không phải ký tự."
        />

        <p className="mt-3 text-sm text-muted leading-relaxed">
          Ở phần tiếp, bạn sẽ chuyển qua lại giữa hai chế độ và thấy rõ hiện
          tượng &quot;vocabulary mismatch&quot; — vấn đề cốt lõi mà semantic
          search được sinh ra để giải quyết.
        </p>
      </LessonSection>

      {/* ═════ 2. ẨN DỤ ═════ */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Ẩn dụ">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Tưởng tượng bạn vào một hiệu sách lớn.
          </p>
          <ul className="text-sm text-foreground/90 leading-relaxed space-y-1.5 pl-5 list-disc">
            <li>
              <strong>BM25</strong> là nhân viên mới: bạn phải nói đúng tên sách
              in trên bìa, nếu không anh ta đứng yên.
            </li>
            <li>
              <strong>Semantic search</strong> là người thủ thư lâu năm: bạn nói
              &quot;một quyển về xe đạp đi đường rừng&quot;, cô ấy lập tức chạy
              đến kệ &quot;mountain bike&quot; và &quot;xe đạp địa hình&quot;
              — dù từ bạn dùng không hề có trên bìa.
            </li>
            <li>
              <strong>Hybrid</strong> là cả hai nhân viên làm việc cùng: người
              thủ thư tìm theo ý, người mới xác nhận đúng đầu sách.
            </li>
          </ul>
          <p className="text-sm text-muted leading-relaxed">
            Điểm mấu chốt: &quot;ý nghĩa&quot; của câu hỏi sống trong một{" "}
            <strong>không gian vector</strong>. Hai câu có nghĩa gần nhau → hai
            điểm gần nhau. Chúng ta sẽ &quot;nhìn thấy&quot; không gian đó ngay
            dưới đây.
          </p>
        </div>
      </LessonSection>

      {/* ═════ 3. VISUALIZATION CHÍNH ═════ */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          {/* ──── Thanh điều khiển ──── */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border bg-background p-1">
              {(
                [
                  { id: "keyword" as const, label: "BM25 (keyword)" },
                  { id: "semantic" as const, label: "Semantic" },
                ]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    mode === m.id
                      ? m.id === "keyword"
                        ? "bg-red-500 text-white"
                        : "bg-blue-500 text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <label className="ml-2 flex items-center gap-2 text-xs text-muted">
              top-k:
              <select
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* ──── Lựa chọn truy vấn ──── */}
          <div className="mb-4 space-y-1.5">
            <p className="text-xs text-muted">Chọn truy vấn:</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(QUERIES).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedQuery(q)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedQuery === q
                      ? "bg-accent text-white"
                      : "border border-border bg-card text-muted hover:text-foreground"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* ──── Scatter 2D không gian nhúng ──── */}
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="mb-2 text-xs font-semibold text-foreground">
              Không gian nhúng 2D (đã chiếu giảm chiều từ embedding thực tế)
            </p>
            <svg viewBox="0 0 500 320" className="w-full">
              {/* Trục */}
              <line x1={40} y1={300} x2={460} y2={300} stroke="currentColor" strokeOpacity={0.15} />
              <line x1={40} y1={40} x2={40} y2={300} stroke="currentColor" strokeOpacity={0.15} />
              <text x={250} y={315} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.6}>
                trục ngữ nghĩa 1 (xe / phương tiện ↔ đồ uống / âm thanh)
              </text>
              <text
                x={15}
                y={170}
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                opacity={0.6}
                transform="rotate(-90 15 170)"
              >
                trục ngữ nghĩa 2 (địa hình / leo núi ↔ khác)
              </text>

              {/* Vùng hình tròn mờ quanh query = &quot;vùng cosine cao&quot; */}
              {mode === "semantic" && (
                <circle
                  cx={qx}
                  cy={qy}
                  r={90}
                  fill="#3b82f6"
                  opacity={0.08}
                  stroke="#3b82f6"
                  strokeOpacity={0.3}
                  strokeDasharray="4 3"
                />
              )}

              {/* Các doc */}
              {DOCS.map((d) => {
                const [x, y] = toPx(d.embed);
                const rank = rankById.get(d.id);
                const isTop = rank !== undefined;
                const sim =
                  mode === "semantic"
                    ? cosine(q.embed, d.embed)
                    : bm25Score(q.tokens, d.bm25Tokens) /
                      Math.max(1, q.tokens.length);
                return (
                  <g key={d.id}>
                    {/* Đường nối từ query tới doc (chỉ khi ở semantic mode) */}
                    {mode === "semantic" && (
                      <line
                        x1={qx}
                        y1={qy}
                        x2={x}
                        y2={y}
                        stroke="#3b82f6"
                        strokeWidth={sim * 3}
                        opacity={sim * 0.9}
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isTop ? 10 : 6}
                      fill={
                        isTop
                          ? mode === "semantic"
                            ? "#3b82f6"
                            : "#ef4444"
                          : "#64748b"
                      }
                      opacity={isTop ? 1 : 0.55}
                      stroke={isTop ? "white" : "none"}
                      strokeWidth={isTop ? 1.5 : 0}
                    />
                    {isTop && (
                      <text
                        x={x}
                        y={y + 3}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight={700}
                        fill="white"
                      >
                        {rank}
                      </text>
                    )}
                    <text
                      x={x}
                      y={y - 14}
                      textAnchor="middle"
                      fontSize={9}
                      fill="currentColor"
                      opacity={isTop ? 0.95 : 0.55}
                    >
                      {d.text.slice(0, 24)}
                      {d.text.length > 24 ? "…" : ""}
                    </text>
                  </g>
                );
              })}

              {/* Query point */}
              <motion.circle
                cx={qx}
                cy={qy}
                r={12}
                fill="#f59e0b"
                stroke="white"
                strokeWidth={2}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <text
                x={qx}
                y={qy - 18}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill="#f59e0b"
              >
                query
              </text>
            </svg>
            <p className="mt-2 text-[11px] text-muted">
              Chấm cam = vector truy vấn. Chấm số = top-{k} kết quả. Ở chế độ
              semantic, đường nối dày = cosine cao. Ở chế độ BM25, chỉ các tài
              liệu có token khớp mới sáng lên.
            </p>
          </div>

          {/* ──── Bảng kết quả ──── */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Bảng so sánh chi tiết */}
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                Kết quả chế độ hiện tại ({mode === "semantic" ? "Semantic" : "BM25"})
              </p>
              {activeResults.length === 0 ? (
                <p className="text-sm text-red-500">
                  Không có tài liệu nào khớp từ khoá — đây chính là &quot;vocabulary
                  mismatch&quot;.
                </p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {activeResults.map((r, i) => (
                    <li
                      key={r.doc.id}
                      className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-2"
                    >
                      <span
                        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{
                          backgroundColor:
                            mode === "semantic" ? "#3b82f6" : "#ef4444",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{r.doc.text}</p>
                        <p className="text-[11px] text-muted">
                          {mode === "semantic"
                            ? `cosine = ${r.score.toFixed(3)}`
                            : `BM25 ~ ${r.score} token khớp`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Bảng kết quả của chế độ còn lại để so sánh */}
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                So sánh: {mode === "semantic" ? "BM25 sẽ trả về" : "Semantic sẽ trả về"}
              </p>
              {(mode === "semantic" ? bm25Results : semanticResults).length === 0 ? (
                <p className="text-sm text-red-500">
                  BM25 không tìm được gì — minh chứng rõ cho ưu thế của semantic
                  search khi truy vấn và tài liệu dùng từ vựng khác nhau.
                </p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {(mode === "semantic" ? bm25Results : semanticResults).map(
                    (r, i) => (
                      <li
                        key={r.doc.id}
                        className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-2 opacity-80"
                      >
                        <span
                          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{
                            backgroundColor:
                              mode === "semantic" ? "#ef4444" : "#3b82f6",
                          }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{r.doc.text}</p>
                          <p className="text-[11px] text-muted">
                            {mode === "semantic"
                              ? `${r.score} token khớp`
                              : `cosine = ${r.score.toFixed(3)}`}
                          </p>
                        </div>
                      </li>
                    ),
                  )}
                </ol>
              )}
            </div>
          </div>

          {/* ──── Bảng điểm chi tiết cho mọi tài liệu ──── */}
          <div className="mt-4 rounded-xl border border-border bg-background/60 p-3">
            <p className="mb-2 text-xs font-semibold text-foreground">
              Điểm chi tiết cho TOÀN BỘ {DOCS.length} tài liệu
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted">
                    <th className="text-left">#</th>
                    <th className="text-left">Tài liệu</th>
                    <th className="text-right">BM25</th>
                    <th className="text-right">cosine</th>
                    <th className="text-left">Diễn giải</th>
                  </tr>
                </thead>
                <tbody>
                  {DOCS.map((d) => {
                    const b = bm25Score(q.tokens, d.bm25Tokens);
                    const c = cosine(q.embed, d.embed);
                    return (
                      <tr key={d.id} className="border-t border-border/40">
                        <td className="py-1">{d.id}</td>
                        <td className="py-1">{d.text}</td>
                        <td className="py-1 text-right font-mono">{b}</td>
                        <td className="py-1 text-right font-mono">
                          {c.toFixed(3)}
                        </td>
                        <td className="py-1 text-muted">
                          {c > 0.85 && b === 0
                            ? "semantic trúng, BM25 trượt"
                            : b > 0 && c > 0.85
                              ? "cả hai đều trúng"
                              : b === 0 && c < 0
                                ? "ngoài chủ đề"
                                : b > 0 && c < 0.5
                                  ? "BM25 nhiễu"
                                  : "trung lập"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </VisualizationSection>

        <p className="mt-3 text-sm text-muted leading-relaxed">
          Chú ý trường hợp &quot;Mountain bike Trek Marlin&quot;: cosine gần
          với query &quot;xe đạp leo núi&quot; nhưng BM25 = 0. Đó là ví dụ
          giáo khoa cho &quot;vocabulary mismatch&quot;.
        </p>
      </LessonSection>

      {/* ═════ 4. AHA MOMENT ═════ */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            Semantic search giống <strong>hỏi thủ thư thông minh</strong>: bạn
            nói &quot;xe đạp leo núi&quot;, thủ thư đem về cả &quot;mountain
            bike&quot; lẫn &quot;xe đạp địa hình&quot; — dù bìa sách không có
            chữ nào của bạn. BM25 giống <strong>máy quét barcode</strong>: chỉ
            tìm đúng chuỗi ký tự, không hiểu nghĩa. Mỗi phương pháp có điểm
            mạnh riêng, và{" "}
            <TopicLink slug="hybrid-search">hybrid search</TopicLink> là cách
            ghép thế mạnh đó lại.
          </p>
          <p className="text-sm text-muted mt-1">
            Ý tưởng cốt lõi: &quot;ý nghĩa&quot; của văn bản có thể được <em>hình
            học hoá</em> thành một điểm trong không gian vector. Gần nhau =
            nghĩa gần nhau. Đây là nền móng cho{" "}
            <TopicLink slug="vector-databases">vector database</TopicLink> và{" "}
            <TopicLink slug="rag">RAG</TopicLink>.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ═════ 5. INLINE CHALLENGES (2) ═════ */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Bạn tìm 'iPhone 16 Pro Max'. Semantic search trả về 'Samsung Galaxy S25 Ultra' vì cùng là 'điện thoại flagship'. Đây có phải kết quả tốt không?"
          options={[
            "Tốt — cùng loại điện thoại cao cấp",
            "KHÔNG tốt — người dùng gõ tên sản phẩm CỤ THỂ, cần BM25 khớp chính xác",
            "Tuỳ ngữ cảnh",
          ]}
          correct={1}
          explanation="Truy vấn là tên model cụ thể, người dùng kỳ vọng exact match. Đây là ví dụ cho thấy semantic search hiểu 'nghĩa chung' nhưng mất 'nghĩa riêng' của tên riêng. Hybrid search + filter exact-match giải quyết đúng lớp lỗi này."
        />

        <div className="h-3" />

        <InlineChallenge
          question="Bạn có 10 triệu tài liệu. Dùng cross-encoder chấm điểm từng cặp (query, doc) có khả thi không?"
          options={[
            "Có — cross-encoder rất nhanh",
            "KHÔNG — cross-encoder phải forward một Transformer cho MỖI cặp, O(N). Phải dùng bi-encoder để lấy top-K ứng viên, rồi cross-encoder tinh chỉnh top-K đó",
            "Có nếu dùng GPU đủ lớn",
          ]}
          correct={1}
          explanation="Cross-encoder ~ 10ms / cặp. 10 triệu cặp = 100.000 giây cho MỘT truy vấn. Kiến trúc chuẩn: bi-encoder quét toàn bộ (dùng ANN index như HNSW, nhanh dưới 50ms) → lấy top-100 → cross-encoder chấm lại top-100 → top-10 cuối."
        />
      </LessonSection>

      {/* ═════ 6. EXPLANATION SECTION ═════ */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Giải thích chi tiết">
        <ExplanationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground">Định nghĩa</h3>
          <p>
            <strong>Semantic Search</strong> là tìm kiếm dựa trên{" "}
            <em>biểu diễn nghĩa</em> thay vì khớp ký tự. Một{" "}
            <TopicLink slug="embedding-model">embedding model</TopicLink> chuyển
            mọi văn bản (truy vấn và tài liệu) thành vector dày d-chiều, xếp
            hạng theo độ tương đồng cosine/dot-product, và trả về top-k.
          </p>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Pipeline tổng quát
          </h3>
          <LaTeX block>
            {String.raw`\text{query} \xrightarrow{\text{encoder}} \mathbf{q} \in \mathbb{R}^{d}, \qquad \text{doc}_i \xrightarrow{\text{encoder}} \mathbf{d}_i \in \mathbb{R}^{d}`}
          </LaTeX>
          <LaTeX block>
            {String.raw`\mathrm{score}(q, d_i) \;=\; \mathrm{cos}(\mathbf{q}, \mathbf{d}_i) \;=\; \frac{\mathbf{q} \cdot \mathbf{d}_i}{\|\mathbf{q}\|\, \|\mathbf{d}_i\|}`}
          </LaTeX>
          <p className="text-sm text-muted">
            Khi vector đã L2-normalize (<LaTeX>{String.raw`\|\mathbf{v}\| = 1`}</LaTeX>),
            cosine bằng dot product, giúp các vector database tăng tốc bằng
            ANN (HNSW, IVF, ScaNN).
          </p>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Công thức đối chiếu: BM25
          </h3>
          <LaTeX block>
            {String.raw`\mathrm{BM25}(q, d) \;=\; \sum_{t \in q} \mathrm{IDF}(t)\, \frac{f(t, d)\,(k_1 + 1)}{f(t, d) + k_1 \left(1 - b + b\,\tfrac{|d|}{\bar{L}}\right)}`}
          </LaTeX>
          <p className="text-sm text-muted">
            BM25 hoàn toàn dựa vào &quot;token chung&quot;. Hai câu cùng nghĩa
            nhưng khác từ → điểm 0. Semantic search sinh ra chính để khắc phục
            giới hạn này.
          </p>

          <Callout variant="insight" title="Bi-encoder vs Cross-encoder">
            <p>
              <strong>Bi-encoder</strong> encode query và doc RIÊNG RẼ, cho ra
              hai vector; doc vectors có thể <em>precompute</em> và lưu trong
              vector DB. Tốc độ: hàng chục ms cho hàng triệu doc. Dùng ở
              first-stage retrieval.
            </p>
            <p className="mt-1">
              <strong>Cross-encoder</strong> nối query + doc và đưa vào một
              Transformer duy nhất, cho ra 1 score quan hệ. Chính xác hơn, đặc
              biệt cho các truy vấn mờ, nhưng không precompute được. Dùng ở
              re-ranking stage 2 để gọt top-K.
            </p>
          </Callout>

          <Callout variant="info" title="Các embedding model phổ biến">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>OpenAI text-embedding-3-small / large:</strong> API
                tiện, chất lượng tốt, hỗ trợ đa ngôn ngữ.
              </li>
              <li>
                <strong>Cohere embed-v3:</strong> hơn 100 ngôn ngữ, có
                &quot;compressed embeddings&quot; tiết kiệm bộ nhớ.
              </li>
              <li>
                <strong>sentence-transformers (MiniLM, MPNet):</strong> open
                source, chạy local, phù hợp POC.
              </li>
              <li>
                <strong>BGE-m3 (BAAI):</strong> open source đa ngôn ngữ, hỗ trợ
                tiếng Việt rất tốt, đồng thời trả về cả dense + sparse +
                multi-vector.
              </li>
              <li>
                <strong>E5 / GTE:</strong> các dòng mạnh cho retrieval thuần
                text, giá miễn phí (Apache/MIT).
              </li>
            </ul>
          </Callout>

          <Callout variant="warning" title="Cạm bẫy: chuẩn hoá và chiều vector">
            <p>
              Nếu <strong>không L2-normalize</strong>, cosine và dot-product
              cho kết quả khác nhau. Hầu hết embedding model khuyến nghị
              normalize trước khi index. Ngoài ra, đổi chiều embedding
              (truncate từ 1536 xuống 512 với OpenAI) sẽ tạo vector khác hẳn —
              nhất quán là điều sống còn.
            </p>
          </Callout>

          <Callout variant="tip" title="Khi nào KHÔNG cần semantic search?">
            <p>
              - Truy vấn luôn là mã sản phẩm / ID / tên model chính xác.
              <br />
              - Corpus nhỏ (&lt; vài nghìn doc) và user hài lòng với BM25.
              <br />
              - Ngân sách inference thấp & latency yêu cầu &lt; 10ms trên CPU
              cũ.
            </p>
            <p className="mt-1">
              Đa số sản phẩm sẽ đến một lúc cần semantic search hoặc ít nhất là
              hybrid — hãy kiến trúc sẵn &quot;chuẩn hoá corpus&quot; và
              &quot;nơi nhúng vector&quot;, đừng chốt cứng BM25 quá sớm.
            </p>
          </Callout>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Code mẫu: semantic search end-to-end với sentence-transformers
          </h3>
          <CodeBlock language="python" title="semantic_search.py">
            {`from sentence_transformers import SentenceTransformer
import numpy as np

# BGE-M3: open-source, hỗ trợ tiếng Việt rất tốt
model = SentenceTransformer("BAAI/bge-m3")

docs = [
    "Xe đạp leo núi Giant Talon 29 inch, giảm xóc trước",
    "Mountain bike Trek Marlin 7 cho đường mòn off-road",
    "Xe đạp địa hình full suspension cho tay đua chuyên nghiệp",
    "Xe dap dia hinh Asama giảm giá cuối năm",
    "Giày leo núi Salomon chống trượt, đế Vibram",
    "Balô dã ngoại Deuter 30L phù hợp trekking đường dài",
    "Máy pha cà phê Delonghi La Specialista Arte",
    "Tai nghe không dây Sony WH-1000XM5 chống ồn",
]

# Embed toàn bộ tài liệu MỘT LẦN, lưu lại
doc_vecs = model.encode(docs, normalize_embeddings=True)  # (N, 1024)

def search(query: str, k: int = 3):
    q = model.encode(query, normalize_embeddings=True)     # (1024,)
    # Đã normalize → cosine = dot product
    scores = doc_vecs @ q                                  # (N,)
    topk = np.argsort(-scores)[:k]
    return [(docs[i], float(scores[i])) for i in topk]

for text, sc in search("xe đạp leo núi", k=3):
    print(f"{sc:.3f}  {text}")

# Kết quả điển hình:
#   0.83  Xe đạp leo núi Giant Talon 29 inch, giảm xóc trước
#   0.79  Mountain bike Trek Marlin 7 cho đường mòn off-road
#   0.77  Xe đạp địa hình full suspension cho tay đua chuyên nghiệp
# Tài liệu #6, #7 (cà phê, tai nghe) có điểm âm / gần 0.`}
          </CodeBlock>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Code mẫu: hybrid search (BM25 + semantic) với re-rank
          </h3>
          <CodeBlock language="python" title="hybrid_search.py">
            {`from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer, CrossEncoder
import numpy as np

# --- Stage 0: chuẩn bị ---
bi  = SentenceTransformer("BAAI/bge-m3")
rer = CrossEncoder("BAAI/bge-reranker-v2-m3")

tokenized = [d.lower().split() for d in docs]
bm25 = BM25Okapi(tokenized)
doc_vecs = bi.encode(docs, normalize_embeddings=True)

def hybrid(query: str, k_first=50, k_final=10, alpha=0.5):
    # --- Stage 1: BM25 ---
    bm25_scores = np.array(bm25.get_scores(query.lower().split()))
    bm25_scores = bm25_scores / (bm25_scores.max() + 1e-9)

    # --- Stage 1: semantic ---
    q = bi.encode(query, normalize_embeddings=True)
    sem_scores = doc_vecs @ q

    # --- kết hợp (weighted sum hoặc RRF) ---
    fused = alpha * sem_scores + (1 - alpha) * bm25_scores
    candidates = np.argsort(-fused)[:k_first]

    # --- Stage 2: cross-encoder re-rank ---
    pairs = [(query, docs[i]) for i in candidates]
    rer_scores = rer.predict(pairs)
    order = np.argsort(-rer_scores)[:k_final]
    return [docs[candidates[i]] for i in order]

print(hybrid("xe đạp leo núi"))`}
          </CodeBlock>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Ứng dụng thực tế
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>
              <strong>RAG cho chatbot / trợ lý.</strong> Bước retrieve trong{" "}
              <TopicLink slug="rag">RAG</TopicLink> gần như luôn là semantic
              search hoặc hybrid — đưa đúng đoạn tài liệu vào prompt.
            </li>
            <li>
              <strong>Tìm kiếm trong doanh nghiệp.</strong> Confluence, Notion,
              Slack dùng semantic để trả kết quả ngay cả khi user dùng từ khác
              tác giả.
            </li>
            <li>
              <strong>Thương mại điện tử.</strong> &quot;Quà cho bạn gái thích
              cắm trại&quot; → semantic bắt khái niệm, BM25 khớp brand/SKU;
              hybrid cho CTR tốt nhất.
            </li>
            <li>
              <strong>Tìm kiếm đa ngôn ngữ.</strong> Query tiếng Việt → tài
              liệu tiếng Anh vẫn trả về đúng, nhờ embedding đa ngữ (BGE-M3,
              multilingual E5).
            </li>
            <li>
              <strong>Hỗ trợ pháp lý / y tế.</strong> Một câu hỏi của bệnh
              nhân được ánh xạ tới thuật ngữ chuyên môn tương ứng, dù từ ngữ
              thông thường hoàn toàn khác.
            </li>
            <li>
              <strong>Phát hiện trùng lặp & gần trùng.</strong> Semantic giúp
              tìm bài trùng ý (plagiarism, dedup tin tức) tốt hơn nhiều so với
              khớp từ.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Cạm bẫy thường gặp
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>
              <strong>Mismatch embedding model.</strong> Index doc bằng model
              A, query bằng model B → khoảng cách vô nghĩa. Luôn dùng cùng một
              model, cùng cấu hình normalize.
            </li>
            <li>
              <strong>Bỏ qua chunking.</strong> Nhét cả PDF 50 trang vào một
              vector → &quot;trung bình ý&quot;, độ chính xác tụt. Chunking
              hợp lý (500-1000 token, overlap 10-20%) là bắt buộc. Xem{" "}
              <TopicLink slug="chunking">chunking</TopicLink>.
            </li>
            <li>
              <strong>Quên metadata filter.</strong> Semantic có thể trả về tài
              liệu &quot;hết hạn&quot;, &quot;private&quot;, &quot;ngôn ngữ
              sai&quot;. Hãy filter trước/sau ANN search.
            </li>
            <li>
              <strong>Tin cosine tuyệt đối.</strong> 0.80 không nghĩa là
              &quot;rất giống&quot; theo chuẩn con người — phân phối điểm phụ
              thuộc từng model. Tốt nhất là calibrate trên tập đánh giá.
            </li>
            <li>
              <strong>Không dùng hybrid khi cần.</strong> Nhiều domain có tên
              riêng, mã số → chỉ dùng semantic sẽ miss. Kết hợp BM25 hầu như
              miễn phí.
            </li>
            <li>
              <strong>Bỏ qua re-ranking.</strong> Top-10 của bi-encoder gần
              đúng, cross-encoder gọt tiếp thường tăng MRR/nDCG 5-15 điểm.
            </li>
          </ul>

          <CollapsibleDetail title="Tại sao cosine, chứ không phải Euclidean?">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Hai vector embedding có thể khác nhau về độ dài (‖v‖) vì phụ
              thuộc độ dài văn bản, số lần xuất hiện từ, v.v. Euclidean đo cả
              hướng lẫn độ dài — không ổn định khi người dùng gõ câu ngắn/dài.
              Cosine chỉ nhìn GÓC giữa hai vector, ổn định hơn cho ngôn ngữ.
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed mt-2">
              Khi đã L2-normalize, ta có:
            </p>
            <LaTeX block>
              {String.raw`\|\mathbf{a} - \mathbf{b}\|^{2} = 2 - 2\, \mathbf{a} \cdot \mathbf{b} = 2 - 2\,\cos(\mathbf{a}, \mathbf{b})`}
            </LaTeX>
            <p className="text-sm text-foreground/90 leading-relaxed">
              Nghĩa là khoảng cách Euclidean và cosine xếp hạng <em>tương
              đương</em> sau normalize. Vì vậy đa số vector database hỗ trợ cả
              hai, và metric &quot;inner product trên vector normalized&quot;
              là mặc định.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="Cross-encoder: cấu trúc bên trong & vì sao chính xác hơn">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Bi-encoder encode query và doc độc lập, chỉ &quot;gặp nhau&quot;
              ở bước tính cosine — nghĩa là attention trong hai mô hình không
              thấy nhau. Cross-encoder nối câu:
            </p>
            <LaTeX block>
              {String.raw`\text{input} = [\mathrm{CLS}] \; q_1 \dots q_m \; [\mathrm{SEP}] \; d_1 \dots d_n \; [\mathrm{SEP}]`}
            </LaTeX>
            <p className="text-sm text-foreground/90 leading-relaxed">
              Mọi token của query có thể attend đến mọi token của doc (qua các
              lớp self-attention sâu), nên mô hình có thể trả lời &quot;từ
              &lsquo;đạp&rsquo; của query có khớp với cụm danh từ nào trong
              doc?&quot;. Output CLS đi qua một head nhỏ → 1 score. Chính vì
              attention &quot;chéo&quot; này mà cross-encoder đắt: mỗi cặp
              (query, doc) phải forward riêng.
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed mt-2">
              Đó cũng là lý do kiến trúc hai-tầng chuẩn: bi-encoder chạy trên
              TOÀN BỘ corpus (nhanh), cross-encoder chỉ chạy trên top-50/100
              (chính xác). Hybrid + re-rank là công thức không thể thiếu của
              hệ thống retrieval hiện đại.
            </p>
          </CollapsibleDetail>

          <CollapsibleDetail title="ANN vs exact search — đánh đổi thực tế">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Tính cosine exact với N doc là O(N·d). Với N = 100 triệu, d =
              1024 thì mỗi truy vấn phải duyệt 10^11 phép nhân — không khả
              thi. Các cấu trúc ANN (Approximate Nearest Neighbour) như HNSW,
              IVF+PQ, ScaNN đánh đổi một ít precision để có tốc độ sub-linear.
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed mt-2">
              HNSW (Hierarchical Navigable Small World) là đồ thị nhiều tầng:
              mỗi query đi &quot;từ xa đến gần&quot; qua các tầng, tìm láng
              giềng trong O(log N). Recall thường 95-99% với vài tham số tinh
              chỉnh. IVF+PQ tiết kiệm bộ nhớ bằng cách lượng tử hoá vector.
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed mt-2">
              Quy tắc ngón tay cái: dưới 1 triệu vector — exact brute force
              trên GPU là ổn; trên 10 triệu — bắt buộc ANN. Xem{" "}
              <TopicLink slug="faiss">FAISS</TopicLink> và{" "}
              <TopicLink slug="vector-databases">vector databases</TopicLink>.
            </p>
          </CollapsibleDetail>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Đánh giá một hệ retrieval: các chỉ số cần biết
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>
              <strong>Recall@k</strong> — trong top-k trả về có bao nhiêu % là
              tài liệu liên quan (so với ground truth). Đo khả năng
              &quot;không miss&quot;.
            </li>
            <li>
              <strong>Precision@k</strong> — trong top-k có bao nhiêu % thực
              sự liên quan. Đo &quot;không nhiễu&quot;.
            </li>
            <li>
              <strong>MRR (Mean Reciprocal Rank)</strong> — trung bình 1/rank
              của kết quả đúng đầu tiên. Phù hợp khi chỉ cần một câu trả lời
              đúng.
            </li>
            <li>
              <strong>nDCG@k</strong> — điểm có trọng số theo vị trí, thưởng
              nhiều hơn cho kết quả đúng ở thứ hạng cao. Chuẩn mực cho tìm
              kiếm web.
            </li>
            <li>
              <strong>Latency p50/p95/p99</strong> — không chỉ tốc độ trung
              bình, cần nhìn đuôi: p99 dưới 300ms thường là yêu cầu cho trải
              nghiệm tìm kiếm chấp nhận được.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Chi phí vận hành: nhớ kiểm tra trước khi scale
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>
              <strong>Bộ nhớ.</strong> 10M vector × 1024 chiều × float32 = 40
              GB. Có thể giảm bằng product quantization (PQ) xuống còn ~2-4 GB
              với ít mất precision.
            </li>
            <li>
              <strong>Inference.</strong> Embedding model API (OpenAI, Cohere)
              tính theo token; chạy local (BGE-M3 trên GPU) là miễn phí nhưng
              cần 12-16 GB VRAM.
            </li>
            <li>
              <strong>Re-indexing.</strong> Đổi embedding model = re-embed toàn
              bộ corpus. Hãy version hoá index và có kế hoạch migrate.
            </li>
            <li>
              <strong>Cập nhật nóng.</strong> Khi tài liệu thay đổi, cần xoá &amp;
              thêm lại trong vector DB. Đa số ANN index hỗ trợ upsert nhưng có
              giới hạn về tần suất.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-5">
            Thuật ngữ liên quan
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <TopicLink slug="bm25">BM25</TopicLink> — nền tảng sparse
              retrieval, bổ trợ cho semantic trong hybrid.
            </li>
            <li>
              <TopicLink slug="embedding-model">Embedding model</TopicLink> —
              bộ não của semantic search, quyết định chất lượng vector.
            </li>
            <li>
              <TopicLink slug="vector-databases">Vector databases</TopicLink> —
              nơi lưu và truy vấn vector ở quy mô lớn (pgvector, Qdrant,
              Pinecone, Milvus, Weaviate).
            </li>
            <li>
              <TopicLink slug="hybrid-search">Hybrid search</TopicLink> — công
              thức ghép BM25 + semantic + re-rank.
            </li>
            <li>
              <TopicLink slug="re-ranking">Re-ranking</TopicLink> — stage 2
              với cross-encoder để cải thiện chất lượng top-K.
            </li>
            <li>
              <TopicLink slug="chunking">Chunking</TopicLink> — cách cắt tài
              liệu dài thành đoạn trước khi embed.
            </li>
            <li>
              <TopicLink slug="rag">RAG</TopicLink> — ứng dụng cờ hiệu: dùng
              semantic search để đưa tri thức vào prompt.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ═════ 7. MINI SUMMARY ═════ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Semantic Search"
          points={[
            "Semantic search tìm theo NGHĨA: chiếu query + doc thành vector dense, xếp hạng theo cosine / dot-product.",
            "Vượt qua vocabulary mismatch của BM25 — 'xe đạp leo núi' vẫn tìm ra 'mountain bike', 'xe dap dia hinh'.",
            "Pipeline chuẩn: bi-encoder lấy top-K nhanh (ANN) → cross-encoder re-rank để tinh chỉnh chất lượng.",
            "Kém ở exact match (mã sản phẩm, tên riêng hiếm) → hybrid với BM25 hầu như luôn tốt hơn.",
            "Luôn dùng cùng embedding model + cùng normalize cho index và query. Chunking đúng cách là bắt buộc với tài liệu dài.",
            "Là bước retrieve cốt lõi của RAG, tìm kiếm doanh nghiệp, thương mại điện tử đa ngôn ngữ và phát hiện trùng lặp.",
          ]}
        />
      </LessonSection>

      {/* ═════ 8. QUIZ ═════ */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  PHỤ LỤC: ghi chú cho tác giả
 *
 *  1. Bộ 8 tài liệu + 4 truy vấn được tuyển chọn thủ công để minh
 *     hoạ rõ 3 tình huống: (a) cả BM25 và semantic đều trúng, (b)
 *     chỉ semantic trúng (vocabulary mismatch), (c) cả hai đều
 *     miss (tài liệu ngoài chủ đề).
 *
 *  2. Vector embed là 2-D để vẽ scatter — trong thực tế embedding
 *     có 384-1536 chiều. Khi chuyển sang 3D/4D cho lớp nâng cao,
 *     chỉ cần cập nhật &quot;toPx&quot; và các phép cosine.
 *
 *  3. BM25 ở đây là phiên bản đơn giản hoá: chấm = số token khớp.
 *     Bản đầy đủ (có TF-IDF, độ dài tài liệu) nằm trong bài{" "}
 *     &quot;BM25&quot; — ở đây mục tiêu chính là tương phản với
 *     semantic, không phải mô phỏng hoàn chỉnh BM25.
 *
 *  4. Component không fetch API; toàn bộ tính toán nằm trong
 *     useMemo, đủ nhanh với N = 8. Với N lớn hơn, chuyển sang
 *     fetch top-K từ server (FAISS, pgvector, Qdrant…).
 * ────────────────────────────────────────────────────────────── */

export const __internals = { cosine, bm25Score };
