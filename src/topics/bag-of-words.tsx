"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

/* ───────────────────────────────────────────────────────────────────────────
 * METADATA — giữ nguyên để hệ thống đề xuất & sitemap nhận diện đúng topic
 * ───────────────────────────────────────────────────────────────────────── */

export const metadata: TopicMeta = {
  slug: "bag-of-words",
  title: "Bag of Words",
  titleVi: "Bag of Words - Túi từ",
  description:
    "Phương pháp biểu diễn văn bản đơn giản bằng cách đếm tần suất xuất hiện của mỗi từ, bỏ qua thứ tự — nền tảng của mọi kỹ thuật NLP cổ điển.",
  category: "nlp",
  tags: ["nlp", "text-representation", "feature-extraction", "sparse-vector"],
  difficulty: "beginner",
  relatedSlugs: [
    "tokenization",
    "tf-idf",
    "word-embeddings",
    "vector-databases",
    "text-classification",
  ],
  vizType: "interactive",
};

/* ───── DỮ LIỆU MẪU — 3 tài liệu tiếng Việt thuộc 3 chủ đề khác nhau ─────
 * D1: review quán phở · D2: review giao hàng · D3: review tệ (negation)
 * Mỗi tài liệu 10-12 token, có từ chung giữa D1-D2 để cosine > 0.
 * ─────────────────────────────────────────────────────────────────────── */

const SAMPLE_DOCS: {
  id: string;
  label: string;
  text: string;
  topic: string;
}[] = [
  {
    id: "D1",
    label: "Review quán phở",
    topic: "Ẩm thực",
    text: "phở ngon tuyệt vời phở rất ngon quán đẹp phục vụ nhanh",
  },
  {
    id: "D2",
    label: "Review giao hàng",
    topic: "Mua sắm",
    text: "giao hàng nhanh sản phẩm tốt đóng gói đẹp rất hài lòng",
  },
  {
    id: "D3",
    label: "Review tệ",
    topic: "Khiếu nại",
    text: "dở tệ không ngon dịch vụ tệ phục vụ chậm không hài lòng",
  },
];

// Query mặc định để tính cosine similarity với 3 docs trên.
// Người dùng có thể gõ lại trong input.
const DEFAULT_QUERY = "phở ngon phục vụ nhanh";

/* ───── HÀM TOÁN HỌC — tokenize / build vocab / vectorize / cosine ───── */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function buildVocabulary(docs: string[]): string[] {
  const set = new Set<string>();
  for (const d of docs) {
    for (const t of tokenize(d)) set.add(t);
  }
  return Array.from(set).sort();
}

function vectorize(text: string, vocab: string[]): number[] {
  const counts: Record<string, number> = {};
  for (const t of tokenize(text)) counts[t] = (counts[t] || 0) + 1;
  return vocab.map((w) => counts[w] || 0);
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s;
}

function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

function cosineSim(a: number[], b: number[]): number {
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return 0;
  return dot(a, b) / (na * nb);
}

// Jaccard — chỉ để hiển thị trong callout "so sánh các độ đo khác"
function jaccardSim(a: number[], b: number[]): number {
  let inter = 0;
  let uni = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] > 0 || b[i] > 0) uni += 1;
    if (a[i] > 0 && b[i] > 0) inter += 1;
  }
  return uni === 0 ? 0 : inter / uni;
}

/* ───────────────────────────────────────────────────────────────────────────
 * QUIZ — 8 câu, mix trắc nghiệm và fill-blank
 * ───────────────────────────────────────────────────────────────────────── */

const QUIZ: QuizQuestion[] = [
  {
    question:
      "Hai câu 'Tôi yêu mèo' và 'Mèo yêu tôi' có vector Bag of Words giống nhau không?",
    options: [
      "Khác nhau hoàn toàn",
      "Giống nhau hoàn toàn — BoW bỏ qua thứ tự từ",
      "Giống một phần",
      "Không thể so sánh",
    ],
    correct: 1,
    explanation:
      "BoW chỉ đếm tần suất, không quan tâm thứ tự. Cả hai câu đều có: tôi=1, yêu=1, mèo=1 → vector giống hệt nhau. Đây vừa là ưu điểm (đơn giản) vừa là nhược điểm (mất ngữ cảnh) của BoW.",
  },
  {
    question: "Nhược điểm lớn nhất của Bag of Words là gì?",
    options: [
      "Chạy quá chậm",
      "Mất thông tin về thứ tự từ và ngữ nghĩa",
      "Không đếm được từ",
      "Chỉ dùng cho tiếng Anh",
    ],
    correct: 1,
    explanation:
      "BoW bỏ qua thứ tự từ nên 'Phim hay' và 'Hay phim' có vector giống nhau, và không hiểu 'không tốt' là tiêu cực. Giải pháp: N-gram, word embeddings, hoặc transformer-based encoder.",
  },
  {
    question:
      "Với 3 tài liệu và từ vựng gồm 1000 từ, mỗi vector BoW có bao nhiêu chiều?",
    options: ["3", "1000", "3000", "Tùy tài liệu"],
    correct: 1,
    explanation:
      "Vector BoW luôn có chiều bằng kích thước từ vựng V = 1000. Mỗi vị trí đếm số lần từ đó xuất hiện trong tài liệu. Ma trận dữ liệu có kích thước 3 × 1000, hầu hết là số 0 (sparse).",
  },
  {
    type: "fill-blank",
    question:
      "Vector BoW thường rất {blank} (sparse) vì mỗi tài liệu chỉ chứa một phần nhỏ của toàn bộ từ vựng.",
    blanks: [{ answer: "thưa", accept: ["thưa", "sparse", "rỗng"] }],
    explanation:
      "Một bài báo ~500 từ nhưng từ vựng có thể chứa 50.000+ từ tiếng Việt. Nên vector có ~500 số khác 0 và 49.500 số 0 → rất thưa. Ta dùng định dạng sparse matrix (CSR/COO) để tiết kiệm bộ nhớ hàng nghìn lần.",
  },
  {
    question:
      "Khi so sánh độ tương đồng giữa hai vector BoW, ta thường dùng độ đo nào?",
    options: [
      "Độ đo Euclidean",
      "Cosine similarity — tỉ số góc giữa hai vector",
      "Manhattan distance",
      "Jaccard similarity",
    ],
    correct: 1,
    explanation:
      "Cosine similarity cos(θ) = (A·B)/(||A||·||B||) không bị ảnh hưởng bởi độ dài tài liệu — tài liệu dài và ngắn cùng chủ đề vẫn có cosine cao. Euclidean sẽ ưu ái tài liệu ngắn (vector nhỏ).",
  },
  {
    question:
      "Câu 'Tôi không thích phim này' được BoW xếp vào nhóm tích cực hay tiêu cực (nếu huấn luyện với từ 'thích' = tích cực)?",
    options: [
      "Tiêu cực — mô hình nhìn thấy 'không'",
      "Tích cực — BoW bỏ mất ngữ cảnh 'không thích', chỉ thấy 'thích'",
      "Trung tính",
      "Phụ thuộc vào mô hình",
    ],
    correct: 1,
    explanation:
      "BoW đếm từ riêng lẻ, không nhìn thứ tự. Nó thấy 'thích' và 'phim' → ngả về tích cực. Để khắc phục: dùng bigram ('không_thích') hoặc chuyển sang embeddings + transformer để nắm được negation.",
  },
  {
    type: "fill-blank",
    question:
      "Trong sklearn, lớp CountVectorizer chuyển danh sách văn bản thành ma trận BoW. Để cũng bắt được cụm 2 từ liên tiếp, ta đặt tham số ngram_range={blank}.",
    blanks: [
      { answer: "(1,2)", accept: ["(1,2)", "(1, 2)", "1,2", "bigram"] },
    ],
    explanation:
      "ngram_range=(1,2) sinh ra cả unigram và bigram. Nó giúp 'không tốt' trở thành một feature riêng thay vì tách thành 'không' + 'tốt'. Đổi lại, kích thước từ vựng tăng mạnh.",
  },
  {
    question:
      "Cải tiến phổ biến nhất của BoW là TF-IDF. Điểm khác biệt chính là gì?",
    options: [
      "TF-IDF đếm ký tự thay vì từ",
      "TF-IDF giảm trọng số cho từ xuất hiện ở nhiều tài liệu (ít thông tin) và tăng trọng số cho từ đặc trưng",
      "TF-IDF không dùng từ vựng",
      "TF-IDF chạy nhanh hơn",
    ],
    correct: 1,
    explanation:
      "TF-IDF = term frequency × inverse document frequency. Từ phổ biến như 'là', 'của' xuất hiện ở mọi tài liệu → IDF nhỏ → trọng số thấp. Từ hiếm như 'quantum' chỉ có trong vài tài liệu → IDF lớn → trọng số cao. Kết quả: vector có tính phân biệt cao hơn nhiều.",
  },
];

/* ───── COMPONENT PHỤ — Bar chart 24 chiều cho vector BoW ───── */

interface SparseBarsProps {
  vocab: string[];
  vector: number[];
  color: string;
  highlight?: Set<number>;
}

function SparseBars({ vocab, vector, color, highlight }: SparseBarsProps) {
  const maxCount = Math.max(...vector, 1);
  return (
    <div className="grid grid-cols-8 sm:grid-cols-12 gap-0.5">
      {vector.map((v, i) => {
        const barH = v === 0 ? 4 : 8 + (v / maxCount) * 32;
        const isHighlight = highlight?.has(i);
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1"
            title={`${vocab[i]} = ${v}`}
          >
            <div
              className="w-full rounded-sm transition-all"
              style={{
                height: `${barH}px`,
                backgroundColor: v === 0 ? "rgba(148,163,184,0.25)" : color,
                outline: isHighlight ? "2px solid var(--accent)" : "none",
              }}
            />
            <span
              className="text-[8px] font-mono truncate w-full text-center"
              style={{
                color:
                  v === 0 ? "var(--text-tertiary)" : "var(--text-secondary)",
              }}
            >
              {vocab[i].length > 5 ? `${vocab[i].slice(0, 5)}…` : vocab[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ───── COMPONENT PHỤ — Ma trận cosine 3x3 (màu đậm theo giá trị) ───── */

interface CosineMatrixProps {
  labels: string[];
  matrix: number[][];
}

function CosineMatrix({ labels, matrix }: CosineMatrixProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr>
            <th className="p-1" />
            {labels.map((l) => (
              <th key={l} className="p-1 text-[10px] text-muted font-semibold">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="p-1 text-[10px] text-muted font-semibold text-right">
                {labels[i]}
              </td>
              {row.map((v, j) => {
                const alpha = Math.max(0.08, Math.min(1, v));
                const isDiag = i === j;
                return (
                  <td
                    key={j}
                    className="p-1 text-center border border-border/40"
                    style={{
                      backgroundColor: isDiag
                        ? "rgba(16,185,129,0.35)"
                        : `rgba(59,130,246,${alpha})`,
                      color: v > 0.5 ? "white" : "var(--text-primary)",
                    }}
                  >
                    {v.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 * COMPONENT CHÍNH
 * ───────────────────────────────────────────────────────────────────────── */

export default function BagOfWordsTopic() {
  // Giai đoạn xây dựng vocabulary: ẩn ban đầu, người dùng bấm nút thì hiện
  const [vocabBuilt, setVocabBuilt] = useState(false);

  // Tài liệu query — người dùng có thể gõ để so sánh với corpus
  const [query, setQuery] = useState(DEFAULT_QUERY);

  // Tài liệu được chọn để highlight
  const [focusDoc, setFocusDoc] = useState<number | null>(null);

  // Có bật bigram không? (demo ngram_range = (1,2))
  const [useBigram, setUseBigram] = useState(false);

  // Có chuẩn hoá L2 vector trước khi vẽ/so sánh không?
  // Hiển thị chuẩn hoá sẽ cho thấy norm = 1 ⇒ dot = cosine.
  const [normalize, setNormalize] = useState(false);

  // ─── Tính vocabulary ─────────────────────────────────────────────────
  const vocab = useMemo(() => {
    const base = buildVocabulary(SAMPLE_DOCS.map((d) => d.text));
    if (!useBigram) return base;
    // Sinh bigram đơn giản để demo ngram_range = (1,2)
    const bigrams: string[] = [];
    for (const d of SAMPLE_DOCS) {
      const toks = tokenize(d.text);
      for (let i = 0; i < toks.length - 1; i += 1) {
        bigrams.push(`${toks[i]}_${toks[i + 1]}`);
      }
    }
    return Array.from(new Set([...base, ...bigrams])).sort();
  }, [useBigram]);

  // Giới hạn hiển thị 24 chiều — chọn theo tổng tần suất
  const displayedVocab = useMemo(() => {
    const totals = vocab.map((w) => {
      let s = 0;
      for (const d of SAMPLE_DOCS) {
        for (const t of tokenize(d.text)) if (t === w) s += 1;
      }
      return { w, s };
    });
    totals.sort((a, b) => b.s - a.s);
    return totals.slice(0, 24).map((t) => t.w);
  }, [vocab]);

  // Vector của từng document (chỉ theo displayedVocab để vẽ 24 chiều)
  const docVectors = useMemo(
    () => SAMPLE_DOCS.map((d) => vectorize(d.text, displayedVocab)),
    [displayedVocab]
  );

  // Vector của query
  const queryVector = useMemo(
    () => vectorize(query, displayedVocab),
    [query, displayedVocab]
  );

  // Full vector (để tính cosine chính xác)
  const fullDocVectors = useMemo(
    () => SAMPLE_DOCS.map((d) => vectorize(d.text, vocab)),
    [vocab]
  );
  const fullQueryVector = useMemo(
    () => vectorize(query, vocab),
    [query, vocab]
  );

  // Nếu bật normalize, chuẩn hoá L2 — khi đó dot = cosine
  const displayDocVectors = useMemo(() => {
    if (!normalize) return docVectors;
    return docVectors.map((v) => {
      const n = norm(v);
      return n === 0 ? v : v.map((x) => Number((x / n).toFixed(3)));
    });
  }, [docVectors, normalize]);

  const similarities = useMemo(
    () => fullDocVectors.map((v) => cosineSim(fullQueryVector, v)),
    [fullDocVectors, fullQueryVector]
  );

  // Ma trận cosine giữa 3 document (để demo "similarity matrix" trong corpus)
  const cosineMatrix = useMemo(() => {
    const n = fullDocVectors.length;
    const m: number[][] = [];
    for (let i = 0; i < n; i += 1) {
      m.push([]);
      for (let j = 0; j < n; j += 1) {
        m[i].push(cosineSim(fullDocVectors[i], fullDocVectors[j]));
      }
    }
    return m;
  }, [fullDocVectors]);

  // Ma trận Jaccard song song để so sánh với cosine
  const jaccardMatrix = useMemo(() => {
    const n = fullDocVectors.length;
    const m: number[][] = [];
    for (let i = 0; i < n; i += 1) {
      m.push([]);
      for (let j = 0; j < n; j += 1) {
        m[i].push(jaccardSim(fullDocVectors[i], fullDocVectors[j]));
      }
    }
    return m;
  }, [fullDocVectors]);

  const bestMatch = similarities.indexOf(Math.max(...similarities));

  // Từ nào của query xuất hiện trong vocab — để highlight
  const queryHighlight = useMemo(() => {
    const set = new Set<number>();
    queryVector.forEach((v, i) => {
      if (v > 0) set.add(i);
    });
    return set;
  }, [queryVector]);

  // Danh sách token của query bị OOV (không có trong vocab) — để cảnh báo
  const oovTokens = useMemo(() => {
    const vocabSet = new Set(vocab);
    return tokenize(query).filter((t) => !vocabSet.has(t));
  }, [query, vocab]);

  // Thống kê
  const stats = useMemo(() => {
    const totalTokens = SAMPLE_DOCS.reduce(
      (s, d) => s + tokenize(d.text).length,
      0
    );
    const uniqueTokens = vocab.length;
    const sparsity = (() => {
      let zeros = 0;
      let total = 0;
      for (const v of fullDocVectors) {
        for (const x of v) {
          total += 1;
          if (x === 0) zeros += 1;
        }
      }
      return total === 0 ? 0 : zeros / total;
    })();
    return { totalTokens, uniqueTokens, sparsity };
  }, [vocab, fullDocVectors]);

  const handleBuildVocab = useCallback(() => {
    setVocabBuilt(true);
  }, []);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  const handleResetDemo = useCallback(() => {
    setVocabBuilt(false);
    setQuery(DEFAULT_QUERY);
    setFocusDoc(null);
    setUseBigram(false);
    setNormalize(false);
  }, []);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 1: HOOK — PredictionGate
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={8} label="Thử đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={8}
            labels={[
              "Thử đoán",
              "Khám phá",
              "A-ha",
              "Đi sâu",
              "Thử thách",
              "Giải thích",
              "Tổng kết",
              "Kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question={`Hai câu "Tôi yêu mèo" và "Mèo yêu tôi" — nếu máy tính CHỈ ĐẾM TỪ (bỏ qua thứ tự), chúng có vector giống hay khác nhau?`}
          options={["Khác nhau", "Giống nhau", "Không thể xác định"]}
          correct={1}
          explanation={`Cả hai câu đều chứa: "tôi" = 1 lần, "yêu" = 1 lần, "mèo" = 1 lần. Nếu chỉ đếm tần suất mà bỏ qua thứ tự, chúng hoàn toàn giống nhau! Đây chính là ý tưởng cốt lõi (và cả hạn chế) của Bag of Words — đổ từ vào "túi", xóc lên, đếm.`}
        >
          <p className="text-sm text-muted mt-4">
            Bây giờ hãy xem máy tính biến 3 tài liệu tiếng Việt thành vector số
            như thế nào — và tại sao cách biểu diễn đơn giản này lại thay đổi
            cả lĩnh vực NLP.
          </p>
        </PredictionGate>

        {/* Ẩn dụ ngắn để đặt tên "túi" — giúp người học nhớ lâu hơn */}
        <Callout variant="info" title="Ẩn dụ: cái túi của đầu bếp">
          <p>
            Tưởng tượng bạn đưa đầu bếp một cái <strong>túi</strong> chứa nguyên
            liệu: 2 củ hành, 5 lát thịt bò, 3 cọng rau thơm, 1 nắm bánh phở. Đầu
            bếp biết đây là nguyên liệu nấu phở — nhưng không biết thứ tự cho
            vào nồi, không biết ai nên xào trước, ai luộc sau. Biểu diễn Bag of
            Words y hệt: bạn có <em>danh sách đếm</em> các từ, đủ để đoán chủ
            đề, nhưng không đủ để hiểu ngữ nghĩa trọn vẹn.
          </p>
        </Callout>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 2: VISUALIZATION — Vocabulary builder + vector + cosine matrix
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={8} label="Khám phá">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Vocabulary Builder — Biến văn bản thành vector
          </h3>
          <p className="text-sm text-muted mb-4">
            3 tài liệu mẫu tiếng Việt bên dưới. Bấm <em>Xây dựng từ vựng</em>{" "}
            để thấy BoW hoạt động từng bước: tokenize → build vocab → vector
            hóa → so sánh cosine matrix giữa 3 tài liệu.
          </p>

          {/* ─── 3 sample documents ─── */}
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            {SAMPLE_DOCS.map((d, i) => (
              <motion.button
                key={d.id}
                type="button"
                onClick={() => setFocusDoc(focusDoc === i ? null : i)}
                whileHover={{ scale: 1.01 }}
                className={`text-left rounded-xl border p-3 transition-colors ${
                  focusDoc === i
                    ? "border-accent bg-accent-light"
                    : "border-border bg-card hover:border-accent/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                    {d.id} · {d.label}
                  </span>
                  <span className="text-[9px] text-tertiary">{d.topic}</span>
                </div>
                <p className="text-sm text-foreground italic leading-relaxed">
                  &ldquo;{d.text}&rdquo;
                </p>
                <p className="text-[10px] text-muted mt-1">
                  {tokenize(d.text).length} token
                </p>
              </motion.button>
            ))}
          </div>

          {/* ─── Build vocab button ─── */}
          {!vocabBuilt && (
            <div className="flex justify-center mb-4">
              <motion.button
                type="button"
                onClick={handleBuildVocab}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:bg-accent-dark transition-colors"
              >
                Xây dựng từ vựng V từ 3 tài liệu
              </motion.button>
            </div>
          )}

          {/* ─── Vocabulary display ─── */}
          <AnimatePresence>
            {vocabBuilt && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Vocab pills */}
                <div className="rounded-xl border border-border bg-card/50 p-3">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                      Từ vựng V ({vocab.length} từ duy nhất)
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-[11px] text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useBigram}
                          onChange={(e) => setUseBigram(e.target.checked)}
                          className="accent-accent"
                        />
                        + Bigram (ngram_range=1,2)
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={normalize}
                          onChange={(e) => setNormalize(e.target.checked)}
                          className="accent-accent"
                        />
                        L2 normalize
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {vocab.slice(0, 40).map((w, i) => (
                      <motion.span
                        key={w}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.015 }}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-mono ${
                          w.includes("_")
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-300/60"
                            : "bg-accent-light text-accent border border-accent/30"
                        }`}
                      >
                        {w}
                      </motion.span>
                    ))}
                    {vocab.length > 40 && (
                      <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] text-tertiary">
                        +{vocab.length - 40} nữa
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-card/50 border border-border p-2 text-center">
                    <p className="text-[10px] text-muted uppercase tracking-wide">
                      Tổng token
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {stats.totalTokens}
                    </p>
                  </div>
                  <div className="rounded-lg bg-card/50 border border-border p-2 text-center">
                    <p className="text-[10px] text-muted uppercase tracking-wide">
                      |V|
                    </p>
                    <p className="text-sm font-bold text-accent">
                      {stats.uniqueTokens}
                    </p>
                  </div>
                  <div className="rounded-lg bg-card/50 border border-border p-2 text-center">
                    <p className="text-[10px] text-muted uppercase tracking-wide">
                      Sparsity
                    </p>
                    <p className="text-sm font-bold text-amber-600">
                      {(stats.sparsity * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Doc vectors */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                    Mỗi tài liệu → vector 24 chiều (top 24 từ theo tần suất)
                    {normalize && " · đã chuẩn hoá L2"}
                  </p>
                  {SAMPLE_DOCS.map((d, i) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.12 }}
                      className={`rounded-xl border p-3 ${
                        focusDoc === i
                          ? "border-accent bg-accent-light/40"
                          : "border-border bg-card/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-accent">
                          {d.id} — {d.label}
                        </span>
                        <span className="text-[10px] font-mono text-muted">
                          dim = {docVectors[i].length}, non-zero ={" "}
                          {docVectors[i].filter((v) => v > 0).length}
                        </span>
                      </div>
                      <SparseBars
                        vocab={displayedVocab}
                        vector={displayDocVectors[i]}
                        color={
                          i === 0
                            ? "#10b981"
                            : i === 1
                              ? "#3b82f6"
                              : "#ef4444"
                        }
                      />
                      <div className="mt-2 font-mono text-[10px] text-muted overflow-x-auto whitespace-nowrap">
                        [{displayDocVectors[i].join(", ")}]
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Cosine similarity matrix — visualises full pairwise sim */}
                <div className="rounded-xl border border-border bg-card/50 p-3">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                    Ma trận cosine giữa 3 tài liệu
                  </p>
                  <CosineMatrix
                    labels={SAMPLE_DOCS.map((d) => d.id)}
                    matrix={cosineMatrix}
                  />
                  <p className="text-[10px] text-tertiary mt-2">
                    Đường chéo = 1 (mỗi tài liệu giống chính nó). Ô ngoài đường
                    chéo càng đậm ⇒ hai tài liệu càng giống nhau. Với demo này,
                    D1 và D2 chia sẻ từ &quot;nhanh&quot;, &quot;đẹp&quot;,
                    &quot;rất&quot; nên cosine &gt; 0 dù khác chủ đề.
                  </p>
                </div>

                {/* Jaccard matrix đặt cạnh — so sánh song song */}
                <details className="rounded-xl border border-border bg-card/30 p-3">
                  <summary className="text-xs font-semibold text-muted uppercase tracking-wide cursor-pointer">
                    Bonus — ma trận Jaccard (so sánh song song)
                  </summary>
                  <div className="mt-2">
                    <CosineMatrix
                      labels={SAMPLE_DOCS.map((d) => d.id)}
                      matrix={jaccardMatrix}
                    />
                    <p className="text-[10px] text-tertiary mt-2">
                      Jaccard = |A ∩ B| / |A ∪ B| — chỉ đếm sự có mặt/vắng mặt
                      của từ, bỏ qua tần suất. Với tài liệu ngắn hai độ đo cho
                      kết quả tương tự; với tài liệu dài cosine nhạy hơn với
                      tần suất lặp.
                    </p>
                  </div>
                </details>

                {/* Query box */}
                <div className="rounded-xl border border-accent/40 bg-accent-light/20 p-4">
                  <label className="text-xs font-semibold text-accent uppercase tracking-wide mb-2 block">
                    Nhập query (ngôn ngữ Việt) để tìm tài liệu tương đồng nhất
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                    placeholder="Ví dụ: phở ngon phục vụ nhanh"
                  />
                  {oovTokens.length > 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
                      ⚠ Token ngoài từ vựng (OOV):{" "}
                      <span className="font-mono">
                        {oovTokens.join(", ")}
                      </span>{" "}
                      — BoW sẽ bỏ qua các token này.
                    </p>
                  )}
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-1">
                      Query vector (highlight = từ trùng vocab)
                    </p>
                    <SparseBars
                      vocab={displayedVocab}
                      vector={queryVector}
                      color="#f59e0b"
                      highlight={queryHighlight}
                    />
                  </div>
                </div>

                {/* Cosine similarity ranking */}
                <div className="rounded-xl border border-border bg-card/50 p-3">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                    Cosine similarity — độ tương đồng query ↔ doc
                  </p>
                  <div className="space-y-2">
                    {SAMPLE_DOCS.map((d, i) => {
                      const sim = similarities[i];
                      const isBest = i === bestMatch && sim > 0;
                      return (
                        <div
                          key={d.id}
                          className={`flex items-center gap-3 rounded-lg p-2 ${
                            isBest
                              ? "bg-green-50 dark:bg-green-900/20 border border-green-300/60"
                              : ""
                          }`}
                        >
                          <span className="text-xs font-bold w-20 truncate">
                            {d.id} — {d.label}
                          </span>
                          <div className="flex-1 h-4 rounded-full bg-surface overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(0, sim) * 100}%` }}
                              transition={{ duration: 0.6 }}
                              className={`h-full rounded-full ${
                                isBest ? "bg-green-500" : "bg-accent"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-xs font-mono w-14 text-right ${
                              isBest
                                ? "text-green-600 dark:text-green-400 font-bold"
                                : "text-accent"
                            }`}
                          >
                            {sim.toFixed(3)}
                          </span>
                          {isBest && (
                            <span className="text-[10px] text-green-600 font-bold">
                              ★ match
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-tertiary mt-3">
                    Cosine = (A · B) / (‖A‖ · ‖B‖). Gần 1 ≈ giống nhau; gần 0 ≈
                    không liên quan; âm = ngược chiều (hiếm với BoW vì giá trị
                    ≥ 0).
                  </p>
                </div>

                {/* Limitations callout */}
                <div className="rounded-xl border-l-4 border-l-red-400 bg-red-50 dark:bg-red-900/20 p-3 text-sm">
                  <p className="font-semibold text-red-700 dark:text-red-300 mb-1">
                    Hạn chế bạn có thể thấy ngay:
                  </p>
                  <ul className="list-disc pl-5 text-red-700 dark:text-red-300 space-y-0.5 text-[13px]">
                    <li>
                      <strong>Không có thứ tự:</strong> đổi chỗ các từ trong
                      query → vector không đổi. Thử gõ &quot;nhanh phục vụ phở
                      ngon&quot; — cosine giữ nguyên.
                    </li>
                    <li>
                      <strong>Không có nghĩa:</strong> &quot;phở&quot; và
                      &quot;bún&quot; ở 2 vị trí khác nhau trong vector, hoàn
                      toàn &quot;xa lạ&quot; với nhau, dù đều là món ăn.
                    </li>
                    <li>
                      <strong>Sparsity:</strong> chỉ 3 tài liệu nhỏ đã có ~{" "}
                      {(stats.sparsity * 100).toFixed(0)}% số 0. Với corpus
                      thật (triệu tài liệu) con số này &gt; 99.9%.
                    </li>
                    <li>
                      <strong>Negation:</strong> D3 có từ &quot;ngon&quot;
                      nhưng trong ngữ cảnh &quot;không ngon&quot; — BoW không
                      nhìn thấy chữ &quot;không&quot; đứng trước.
                    </li>
                  </ul>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    className="text-[11px] text-muted hover:text-accent underline"
                  >
                    ↻ Reset demo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </VisualizationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 3: AHA MOMENT
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={8} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Bag of Words</strong> biến văn bản thành vector số bằng
            cách <em>đếm tần suất từ</em> — đơn giản đến kinh ngạc, nhưng đủ
            mạnh để spam filter, phân loại tin tức, và phát hiện sentiment
            trong hàng thập kỷ trước khi deep learning xuất hiện.
          </p>
          <p className="text-sm text-muted mt-2">
            Giống như xáo trộn nguyên liệu nấu phở trong một cái túi: bạn biết
            có bao nhiêu miếng thịt, hành, bánh phở — nhưng không biết thứ tự
            cho vào nồi. Đủ để nhận ra là phở, không đủ để nấu ngon.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 4: ĐI SÂU
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={8} label="Đi sâu">
        <h3 className="text-base font-semibold text-foreground mb-2">
          Công thức & quy trình
        </h3>
        <p className="text-sm text-muted mb-4">
          Cho một corpus D = {"{"}d₁, d₂, …, d_N{"}"} gồm N tài liệu, Bag of
          Words biểu diễn mỗi tài liệu d thành một vector đếm theo công thức:
        </p>

        <LaTeX block>
          {
            "\\mathbf{d} = [\\,c(w_1, d),\\ c(w_2, d),\\ \\ldots,\\ c(w_V, d)\\,]"
          }
        </LaTeX>

        <p className="text-sm text-muted mb-4">
          Trong đó V = |vocab| và c(wᵢ, d) là số lần từ wᵢ xuất hiện trong d.
          Toàn bộ corpus tạo thành một ma trận X ∈ ℝ^(N × V), thường rất thưa
          (&gt; 99% số 0).
        </p>

        <Callout variant="insight" title="Quy trình 4 bước">
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <strong>Tokenize:</strong> chia văn bản thành từ (với tiếng Việt
              thường dùng underthesea, VnCoreNLP, hoặc PyVi để tách từ ghép).
            </li>
            <li>
              <strong>Build vocabulary:</strong> duyệt toàn bộ corpus, thu thập
              danh sách từ duy nhất. Có thể lọc stopword, từ &lt; 2 lần xuất
              hiện, v.v.
            </li>
            <li>
              <strong>Vectorize:</strong> với mỗi tài liệu, đếm số lần mỗi từ
              trong vocab xuất hiện → vector V chiều.
            </li>
            <li>
              <strong>So sánh:</strong> dùng cosine similarity, Euclidean
              distance hoặc đưa vào classifier (Naive Bayes, Logistic
              Regression, SVM).
            </li>
          </ol>
        </Callout>

        <CollapsibleDetail title="Cosine similarity — vì sao là 'đúng' metric cho BoW?">
          <div className="space-y-3 text-sm text-muted">
            <p>
              Hai vector BoW cùng chủ đề nhưng khác độ dài (ví dụ một tweet 10
              từ và một bài báo 500 từ cùng nói về bóng đá) có <em>norm</em>{" "}
              rất khác nhau. Euclidean distance sẽ nói chúng xa nhau vì kích
              thước khác biệt. Cosine thì <em>chỉ quan tâm góc giữa hai
              vector</em>, không quan tâm độ dài:
            </p>
            <LaTeX block>
              {
                "\\cos(\\theta) = \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\| \\, \\|\\mathbf{B}\\|}"
              }
            </LaTeX>
            <p>
              Kết quả trong khoảng [-1, 1] (với BoW thực tế là [0, 1] vì không
              có giá trị âm). cos = 1 → cùng hướng (rất giống nhau). cos = 0 →
              vuông góc (không chia sẻ từ chung nào). Đây là lý do mọi hệ
              thống tìm kiếm truyền thống (Lucene, Elasticsearch) dùng cosine
              làm baseline scoring.
            </p>
            <p>
              Có một bonus hay: sau khi <strong>chuẩn hóa L2</strong> (chia
              vector cho norm của nó), tích vô hướng giữa 2 vector chuẩn hóa{" "}
              <em>chính là</em> cosine của chúng. Nên nhiều vector DB chỉ lưu
              vector đã normalize và tính dot product — rất nhanh.
            </p>
            <p>
              Ứng dụng thực tế: bật checkbox <em>L2 normalize</em> phía trên để
              thấy vector sau chuẩn hoá có các số ≤ 1, và cosine giữa 2 vector
              chuẩn hoá bằng đúng tích vô hướng (không cần chia norm nữa).
            </p>
          </div>
        </CollapsibleDetail>

        <div className="h-4" />

        <CollapsibleDetail title="Vì sao ma trận BoW lại 'thưa kinh khủng' (sparse)">
          <div className="space-y-3 text-sm text-muted">
            <p>
              Trong một corpus tiếng Việt thực (Wikipedia, báo, review Shopee)
              từ vựng có thể &gt; 200.000 từ sau khi chuẩn hóa, nhưng một bài
              báo 1000 từ chỉ chứa ~300-500 từ duy nhất. Tỉ lệ không-zero ~
              0.1-0.25%. Nếu lưu ma trận dày (dense) thì N × V = 1 triệu tài
              liệu × 200.000 chiều = 200 tỷ số float — khoảng 800 GB bộ nhớ.
              Không khả thi!
            </p>
            <p>
              Giải pháp: lưu ở dạng <strong>sparse matrix</strong> (scipy
              CSR/CSC/COO) — chỉ lưu các cặp (hàng, cột, giá trị) khác 0. Cùng
              corpus trên chỉ tốn &lt; 5 GB. Các phép toán (dot product, cosine)
              cũng có phiên bản sparse đặc biệt (BLAS-1 spmv) chạy rất nhanh.
            </p>
            <p>
              Đây là lý do sklearn.feature_extraction.text.CountVectorizer trả
              về scipy.sparse.csr_matrix theo mặc định — đừng gọi .toarray()
              nếu không thực sự cần.
            </p>
            <p>
              Mẹo debug: nếu lỡ gọi <code>X.toarray()</code> trên ma trận lớn
              và Python đứng im, hãy <kbd>Ctrl+C</kbd> ngay — khả năng cao là
              đang cấp phát hàng chục GB RAM. Luôn kiểm tra{" "}
              <code>X.shape</code> và <code>X.nnz</code> trước khi dense-hoá.
            </p>
          </div>
        </CollapsibleDetail>

        <div className="h-4" />

        <Callout variant="tip" title="Mẹo tiền xử lý tiếng Việt">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Tách từ ghép (<em>word segmentation</em>): &quot;học sinh&quot;
              phải là 1 token chứ không phải 2. Dùng{" "}
              <code>underthesea.word_tokenize</code>.
            </li>
            <li>
              Chuẩn hóa dấu: Unicode tổ hợp (&quot;hò&quot;) vs dựng sẵn
              (&quot;hò&quot;) có cùng hình thức nhưng khác byte → cần NFC.
            </li>
            <li>
              Lowercase tất cả (hoặc không, tùy task). Loại stopword tiếng
              Việt (&quot;là&quot;, &quot;của&quot;, &quot;và&quot;, …) nếu
              task không phụ thuộc.
            </li>
            <li>
              Xem xét lemmatization — nhưng tiếng Việt gần như không biến âm
              nên ít cần thiết, khác với tiếng Anh.
            </li>
          </ul>
        </Callout>

        <div className="h-4" />

        <Callout variant="warning" title="Ba hạn chế kinh điển của BoW">
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <strong>Mất thứ tự:</strong> &quot;phim này không hay&quot; và
              &quot;phim này hay không?&quot; có cùng vector → không phân biệt
              được negation và câu hỏi.
            </li>
            <li>
              <strong>Không ngữ nghĩa:</strong> &quot;phở&quot; và
              &quot;bún&quot; là từ rời rạc, cosine = 0 dù cùng là món ăn.
              Cần word embeddings (word2vec, GloVe) hay mô hình ngôn ngữ để
              có &quot;gần nghĩa&quot;.
            </li>
            <li>
              <strong>Out-of-vocabulary (OOV):</strong> từ mới chưa thấy trong
              tập huấn luyện sẽ bị bỏ qua hoàn toàn → mô hình thiếu thông tin
              quan trọng.
            </li>
          </ol>
        </Callout>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 5: THỬ THÁCH — 2 InlineChallenge
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={8} label="Thử thách">
        <div className="space-y-5">
          <InlineChallenge
            question={`"Phim này không hay" — BoW xếp câu này vào nhóm tích cực hay tiêu cực nếu mô hình được huấn luyện rằng "hay" = tích cực? (Gợi ý: BoW đếm từ riêng lẻ)`}
            options={[
              "Tiêu cực — vì có từ 'không'",
              "Tích cực — vì BoW thấy từ 'hay' (tích cực) mà bỏ qua ngữ cảnh 'không hay'",
              "Trung tính",
            ]}
            correct={1}
            explanation="BoW đếm từ riêng lẻ: 'hay' ở bất cứ đâu đều được cộng điểm tích cực. Nó không hiểu 'không hay' = tiêu cực vì đã bỏ mất thứ tự từ. Đây là nhược điểm lớn nhất của BoW — giải pháp: dùng bigram (ngram_range=(1,2)) hoặc chuyển sang embeddings + transformer."
          />

          <InlineChallenge
            question="Bạn có corpus 100.000 tài liệu, từ vựng sau lọc là 50.000. Ma trận BoW dense (không sparse) cần bao nhiêu bộ nhớ (giả sử float32 = 4 byte)?"
            options={["~20 MB", "~200 MB", "~20 GB", "~2 TB"]}
            correct={2}
            explanation="100.000 × 50.000 × 4 byte = 20 × 10⁹ byte = 20 GB. Thực tế > 99% là số 0 nên lưu sparse chỉ tốn vài trăm MB. Đây là lý do không bao giờ gọi .toarray() trên ma trận BoW lớn!"
          />
        </div>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 6: GIẢI THÍCH + CODE
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={8} label="Giải thích">
        <ExplanationSection>
          <h3 className="text-lg font-semibold text-foreground">
            Định nghĩa và lịch sử: từ Harris đến sklearn
          </h3>
          <p>
            <strong>Bag of Words (BoW)</strong> là phương pháp biểu diễn văn
            bản dưới dạng vector đếm tần suất của từng từ trong một từ vựng
            cố định V, bỏ qua hoàn toàn thứ tự xuất hiện. Đây là <em>baseline
            điển hình</em> và đồng thời là &quot;cánh cửa&quot; đưa văn bản
            vào thế giới toán học của Machine Learning.
          </p>
          <p>
            Ý tưởng &quot;bag of words&quot; bắt nguồn từ bài báo{" "}
            <em>Distributional Structure</em> (1954) của nhà ngôn ngữ học{" "}
            <strong>Zellig Harris</strong>, với nguyên lý{" "}
            <em>&quot;các từ xuất hiện trong bối cảnh tương tự nhau có xu
            hướng cùng nghĩa&quot;</em>. Đến thập niên 1970, BoW trở thành mô
            hình chuẩn trong{" "}
            <strong>Information Retrieval</strong> — hệ thống tìm kiếm SMART
            của Gerard Salton (1971) và sau đó TF-IDF (Spärck Jones, 1972) là
            các cột mốc lớn.
          </p>
          <p>
            Ngày nay, mỗi khi bạn gọi{" "}
            <code>sklearn.feature_extraction.text.CountVectorizer</code>, bạn
            đang dùng thuật toán này gần như nguyên vẹn sau 70 năm. Dù các mô
            hình transformer đã vượt xa, BoW vẫn là baseline bắt buộc và cực
            kỳ cạnh tranh trong nhiều bài toán phân loại văn bản.
          </p>

          <Callout variant="insight" title="Vì sao BoW vẫn sống khỏe?">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Rất nhanh</strong>: tokenize + count = O(tổng số
                token). So với BERT thì nhanh hơn 10.000 lần.
              </li>
              <li>
                <strong>Không cần GPU</strong>: huấn luyện logistic regression
                trên vector BoW chạy trong vài giây trên CPU.
              </li>
              <li>
                <strong>Dễ diễn giải</strong>: mỗi feature = 1 từ cụ thể. Nhìn
                trọng số là biết model đang dựa vào từ nào để quyết định —
                điều mà BERT không làm được.
              </li>
              <li>
                <strong>Đủ tốt cho nhiều bài toán</strong>: spam filter, phân
                loại tin tức, phát hiện ngôn từ thù hằn — BoW + logistic
                regression cho kết quả 85-95% accuracy.
              </li>
            </ul>
          </Callout>

          <h3 className="text-lg font-semibold text-foreground">
            Công thức toán học
          </h3>
          <p>
            Cho từ vựng{" "}
            <LaTeX>{"V = \\{w_1, w_2, \\ldots, w_{|V|}\\}"}</LaTeX>, mỗi tài
            liệu d được biểu diễn bằng vector:
          </p>
          <LaTeX block>
            {
              "\\mathbf{d} = \\big[\\,c(w_1, d),\\ c(w_2, d),\\ \\ldots,\\ c(w_{|V|}, d)\\,\\big] \\in \\mathbb{R}^{|V|}"
            }
          </LaTeX>
          <p>
            Trong đó <LaTeX>{"c(w_i, d)"}</LaTeX> là số lần từ{" "}
            <LaTeX>{"w_i"}</LaTeX> xuất hiện trong d. Độ tương đồng giữa hai
            tài liệu dùng cosine:
          </p>
          <LaTeX block>
            {
              "\\text{sim}(\\mathbf{d}_1, \\mathbf{d}_2) = \\frac{\\mathbf{d}_1 \\cdot \\mathbf{d}_2}{\\|\\mathbf{d}_1\\|_2 \\, \\|\\mathbf{d}_2\\|_2}"
            }
          </LaTeX>

          <Callout variant="info" title="Quy trình BoW chi tiết">
            <div className="space-y-2">
              <p>
                <strong>Bước 1 — Tokenize:</strong> chia văn bản thành từ.
                Tiếng Anh split theo space là đủ; tiếng Việt cần tách từ ghép
                (&quot;học sinh&quot;, &quot;xe máy&quot;).
              </p>
              <p>
                <strong>Bước 2 — Build vocabulary:</strong> V = tập hợp tất cả
                từ duy nhất trong corpus. Có thể áp dụng{" "}
                <code>min_df=2</code> (loại từ xuất hiện &lt; 2 tài liệu),{" "}
                <code>max_df=0.95</code> (loại từ xuất hiện &gt; 95% tài liệu
                — quá phổ biến, không thông tin).
              </p>
              <p>
                <strong>Bước 3 — Vectorize:</strong> với mỗi tài liệu, đếm số
                lần mỗi từ trong V xuất hiện. Kết quả là ma trận thưa N × |V|.
              </p>
              <p>
                <strong>Bước 4 — Model:</strong> đưa ma trận vào classifier
                (Logistic Regression, Naive Bayes, SVM). Không cần feature
                engineering thêm — BoW đã là feature.
              </p>
            </div>
          </Callout>

          <h3 className="text-lg font-semibold text-foreground">
            Cài đặt với scikit-learn (CodeBlock #1)
          </h3>
          <p>
            Đây là ví dụ đầy đủ: đọc corpus tiếng Việt, xây BoW, so sánh cosine
            similarity giữa query và 3 tài liệu.
          </p>

          <CodeBlock
            language="python"
            title="bow_sklearn.py"
          >{`from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Corpus tiếng Việt (3 tài liệu)
docs = [
    "phở ngon tuyệt vời phở rất ngon quán đẹp phục vụ nhanh",
    "giao hàng nhanh sản phẩm tốt đóng gói đẹp rất hài lòng",
    "dở tệ không ngon dịch vụ tệ phục vụ chậm không hài lòng",
]

# CountVectorizer xây BoW
vectorizer = CountVectorizer(
    lowercase=True,
    token_pattern=r"\\S+",   # tiếng Việt đã tokenize sẵn
    min_df=1,
    # ngram_range=(1, 2),   # bật bigram để bắt 'không_tốt'
)
X = vectorizer.fit_transform(docs)   # sparse matrix (3, |V|)

print("Kích thước vocab:", len(vectorizer.vocabulary_))
print("Shape:", X.shape, "| Sparsity:", 1 - X.nnz / np.prod(X.shape))

vocab = vectorizer.get_feature_names_out()
print("Vocab đầu:", vocab[:15])
print(X.toarray()[:, :15])

# Query & cosine similarity
query = "phở ngon phục vụ nhanh"
q_vec = vectorizer.transform([query])
sims = cosine_similarity(q_vec, X).flatten()
ranking = np.argsort(sims)[::-1]

print("\\n=== Xếp hạng ===")
for rank, idx in enumerate(ranking, 1):
    print(f"#{rank}  sim={sims[idx]:.3f}  ← {docs[idx]}")

# Thử với bigram để bắt 'không tốt'
bigram_vec = CountVectorizer(token_pattern=r"\\S+", ngram_range=(1, 2))
X_bigram = bigram_vec.fit_transform(docs)
print("\\n|V| với bigram:", X_bigram.shape[1])`}</CodeBlock>

          <p>
            Chạy đoạn code trên bạn sẽ thấy: query &quot;phở ngon phục vụ
            nhanh&quot; tương đồng cao nhất với D1 (review quán phở) như kỳ
            vọng. Nhưng D3 (review tệ, cũng có &quot;phục vụ&quot;) vẫn có
            cosine &gt; 0 vì chia sẻ một vài từ chung — đó là hạn chế kinh
            điển của BoW không hiểu ngữ nghĩa.
          </p>

          <h3 className="text-lg font-semibold text-foreground">
            Cài đặt tay không thư viện (CodeBlock #2)
          </h3>
          <p>
            Để chắc rằng mình hiểu từng bước, sau đây là cài đặt thuần Python
            — chính là thuật toán mà demo phía trên đang chạy. Độ phức tạp
            O(N · L) với L là độ dài trung bình của mỗi tài liệu.
          </p>

          <CodeBlock
            language="python"
            title="bow_from_scratch.py"
          >{`from collections import Counter
from math import sqrt

def tokenize(text): return text.lower().strip().split()

def build_vocab(docs):
    vocab = set()
    for d in docs: vocab.update(tokenize(d))
    return sorted(vocab)

def vectorize(text, vocab):
    counts = Counter(tokenize(text))
    return [counts[w] for w in vocab]

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = sqrt(sum(x * x for x in a))
    nb = sqrt(sum(y * y for y in b))
    return 0.0 if na * nb == 0 else dot / (na * nb)

docs = [
    "phở ngon tuyệt vời phở rất ngon quán đẹp phục vụ nhanh",
    "giao hàng nhanh sản phẩm tốt đóng gói đẹp rất hài lòng",
    "dở tệ không ngon dịch vụ tệ phục vụ chậm không hài lòng",
]
vocab = build_vocab(docs)
X = [vectorize(d, vocab) for d in docs]
qv = vectorize("phở ngon phục vụ nhanh", vocab)

for i, row in enumerate(X, 1):
    print(f"D{i}: cos={cosine(qv, row):.3f}")

# Ma trận cosine NxN giữa các document
print("\\nCosine matrix:")
for i, a in enumerate(X, 1):
    print(f"D{i}: {[f'{cosine(a, b):.2f}' for b in X]}")`}</CodeBlock>

          <p>
            Trên corpus này sklearn và cài tay cho kết quả giống nhau (vì
            tokenizer đơn giản). Khi chuyển sang corpus thật, sklearn thắng
            nhờ sparse matrix và tối ưu C-level — nhưng cài tay dạy bạn cách
            debug từng bước.
          </p>

          <Callout variant="tip" title="Khi nào dùng BoW và khi nào bỏ qua?">
            <p className="mb-2">
              <strong>Dùng BoW khi:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Corpus nhỏ-vừa (&lt; 1 triệu tài liệu), task đơn giản.</li>
              <li>Cần baseline nhanh để benchmark so với mô hình phức tạp.</li>
              <li>
                Cần model nhẹ, triển khai trên edge / mobile không có GPU.
              </li>
              <li>
                Cần diễn giải được feature — ví dụ trong domain y tế, tài
                chính.
              </li>
            </ul>
            <p className="mt-3 mb-2">
              <strong>Bỏ qua BoW khi:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>
                Task cần hiểu ngữ cảnh / thứ tự: dịch máy, QA, sentiment phức
                tạp.
              </li>
              <li>
                Có nhiều dữ liệu và GPU — nên dùng BERT/transformer để đạt
                SOTA.
              </li>
              <li>
                Dữ liệu đa ngôn ngữ hoặc có từ mới — embeddings xử lý OOV tốt
                hơn.
              </li>
            </ul>
          </Callout>

          <Callout variant="warning" title="Bẫy thường gặp khi dùng BoW">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Quên lowercase:</strong> &quot;Phở&quot; và
                &quot;phở&quot; trở thành 2 feature khác nhau, vocab phình gấp
                đôi.
              </li>
              <li>
                <strong>Không fit_transform trên train, transform trên
                test:</strong>{" "}
                nếu <code>fit</code> cả test → vocab có từ chỉ xuất hiện ở
                test → data leakage kinh điển.
              </li>
              <li>
                <strong>Tách từ sai với tiếng Việt:</strong> &quot;học
                sinh&quot; bị tách làm 2 — &quot;học&quot; và
                &quot;sinh&quot; — mất toàn bộ nghĩa từ ghép.
              </li>
              <li>
                <strong>Không kiểm tra sparsity:</strong> nếu &lt; 90% có nghĩa
                là vocab quá nhỏ hoặc data quá đặc — nên điều tra.
              </li>
            </ul>
          </Callout>

          <h3 className="text-lg font-semibold text-foreground">
            Ứng dụng thực tế
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Spam filter:</strong> Naive Bayes + BoW vẫn là backend
              chuẩn của nhiều hệ thống email filter — nhanh, rẻ, đủ tốt.
            </li>
            <li>
              <strong>Phân loại tin tức:</strong> Logistic Regression + BoW
              với bigram thường đạt 85-92% macro-F1 trên tiếng Việt 5 chủ đề.
            </li>
            <li>
              <strong>Phát hiện ngôn từ thù hằn (hate speech):</strong> TF-IDF
              + SVM vẫn là baseline cứng cho bài toán này ở Kaggle.
            </li>
            <li>
              <strong>Information Retrieval:</strong> Elasticsearch, Solr,
              Lucene đều dùng BoW + BM25 (một biến thể TF-IDF) để tính điểm.
            </li>
            <li>
              <strong>Feature extraction cho topic modeling:</strong> LDA
              (Latent Dirichlet Allocation) chạy trực tiếp trên ma trận BoW.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground">
            Những sai lầm điển hình (pitfalls)
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Dùng <code>MultinomialNB</code> trên BoW có giá trị âm — Naive
              Bayes yêu cầu counts ≥ 0.
            </li>
            <li>
              Bỏ stopword quá tay trong sentiment analysis — &quot;không&quot;
              là stopword nhưng cực kỳ quan trọng cho phủ định.
            </li>
            <li>
              Để <code>max_features</code> quá nhỏ với corpus lớn — mất hết
              từ có ý nghĩa.
            </li>
            <li>
              So sánh model có vocab khác nhau bằng chỉ số tuyệt đối — cosine
              chỉ có ý nghĩa khi vocab giống nhau.
            </li>
            <li>
              Quên <code>dtype=np.float32</code>: mặc định sklearn trả
              float64, tăng 2× bộ nhớ.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground">
            Từ BoW đến các mô hình hiện đại
          </h3>
          <p>
            BoW là tổ tiên của một cây phả hệ dài:{" "}
            <TopicLink slug="tf-idf">TF-IDF</TopicLink> (giảm trọng số từ phổ
            biến) →{" "}
            <TopicLink slug="word-embeddings">Word Embeddings</TopicLink>{" "}
            (word2vec, GloVe — từ thành vector dày có nghĩa) →{" "}
            <TopicLink slug="attention-mechanism">Attention</TopicLink> →{" "}
            <TopicLink slug="transformer">Transformer</TopicLink> → BERT, GPT.
            Mỗi bước tiến đều giải quyết một hạn chế của BoW: TF-IDF giảm
            trọng số từ phổ biến, embeddings thêm ngữ nghĩa, transformer thêm
            ngữ cảnh và thứ tự.
          </p>
          <p>
            Dù vậy, BoW vẫn xứng đáng là &quot;bài học đầu tiên&quot; của NLP:
            nó dạy bạn tư duy biến văn bản thành số, tư duy vector hóa, tư duy
            sparse matrix, và tư duy similarity. Mọi mô hình hiện đại đều kế
            thừa các ý tưởng này — chỉ là đổi cách đếm (count → embed → attend)
            và đổi không gian (sparse V-chiều → dense 768-chiều).
          </p>
        </ExplanationSection>
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 7: TÓM TẮT — 6 điểm
          ══════════════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={8} label="Tổng kết">
        <MiniSummary
          title="Ghi nhớ về Bag of Words"
          points={[
            "BoW biến văn bản thành vector bằng cách ĐẾM TẦN SUẤT từ — bỏ hoàn toàn thứ tự (vì thế gọi là 'túi').",
            "Mỗi vector BoW có chiều = |V| (kích thước từ vựng) và thường rất thưa (sparse) — > 99% số 0 trong thực tế.",
            "Cosine similarity là metric chuẩn: cos(θ) = (A·B)/(‖A‖·‖B‖) — không bị ảnh hưởng bởi độ dài tài liệu.",
            "Ưu điểm: đơn giản, nhanh, diễn giải được — vẫn là baseline cạnh tranh cho phân loại văn bản (spam, sentiment).",
            "Nhược điểm kinh điển: mất thứ tự ('không hay' ≈ 'hay không'), không ngữ nghĩa ('phở' xa 'bún'), vấn đề OOV với từ mới.",
            "TF-IDF cải thiện BoW bằng cách giảm trọng số từ phổ biến; word embeddings và transformer là những bước tiến xa hơn.",
          ]}
        />
      </LessonSection>

      {/* ══════════════════════════════════════════════════════════════════
          BƯỚC 8: QUIZ
          ══════════════════════════════════════════════════════════════════ */}
      <QuizSection questions={QUIZ} />
    </>
  );
}
