"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
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

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: TopicMeta = {
  slug: "embedding-model",
  title: "Embedding Models",
  titleVi: "Mô hình nhúng văn bản",
  description:
    "Mô hình chuyển văn bản thành vector số học, cho phép máy tính hiểu và so sánh ý nghĩa ngữ nghĩa.",
  category: "llm-concepts",
  tags: ["embedding", "vector", "nlp", "representation"],
  difficulty: "intermediate",
  relatedSlugs: [
    "vector-databases",
    "semantic-search",
    "self-attention",
    "word-embeddings",
  ],
  vizType: "interactive",
};

// ─────────────────────────────────────────────────────────────────────────────
// DỮ LIỆU NHÚNG 2D GIẢ LẬP
// 20 từ tiếng Việt được chiếu xuống 2D (toạ độ đã chuẩn hoá 0-400, 0-320)
// Các cụm: quyền lực, động vật, màu sắc, công nghệ, cảm xúc
// ─────────────────────────────────────────────────────────────────────────────

type WordPoint = {
  id: string;
  word: string;
  x: number;
  y: number;
  group: "quyền-lực" | "động-vật" | "màu-sắc" | "công-nghệ" | "cảm-xúc";
  color: string;
  note?: string;
};

const WORDS: WordPoint[] = [
  // Cụm quyền lực — xuất hiện cùng ngữ cảnh triều đình, chính trị
  { id: "w1", word: "vua", x: 78, y: 58, group: "quyền-lực", color: "#7C3AED", note: "Chức danh tối cao thời phong kiến" },
  { id: "w2", word: "hoàng đế", x: 92, y: 66, group: "quyền-lực", color: "#7C3AED", note: "Đồng nghĩa với vua, cấp bậc cao hơn" },
  { id: "w3", word: "nữ hoàng", x: 70, y: 84, group: "quyền-lực", color: "#7C3AED", note: "Vua nữ — cùng ngữ nghĩa, giới tính khác" },
  { id: "w4", word: "thủ tướng", x: 110, y: 54, group: "quyền-lực", color: "#7C3AED", note: "Chức danh chính trị hiện đại, gần 'vua' về trục quyền lực" },

  // Cụm động vật nuôi
  { id: "w5", word: "mèo", x: 188, y: 248, group: "động-vật", color: "#D97706", note: "Vật nuôi phổ biến" },
  { id: "w6", word: "chó", x: 202, y: 262, group: "động-vật", color: "#D97706", note: "Vật nuôi phổ biến, gần 'mèo'" },
  { id: "w7", word: "thú cưng", x: 195, y: 232, group: "động-vật", color: "#D97706", note: "Từ khái quát — trung tâm cụm" },
  { id: "w8", word: "cún con", x: 214, y: 278, group: "động-vật", color: "#D97706", note: "Con của 'chó' — rất gần" },

  // Cụm màu sắc
  { id: "w9", word: "xanh", x: 300, y: 220, group: "màu-sắc", color: "#0D9488", note: "Màu sắc cơ bản" },
  { id: "w10", word: "đỏ", x: 316, y: 234, group: "màu-sắc", color: "#0D9488", note: "Màu sắc cơ bản" },
  { id: "w11", word: "vàng", x: 310, y: 252, group: "màu-sắc", color: "#0D9488", note: "Màu sắc cơ bản" },
  { id: "w12", word: "tím", x: 292, y: 240, group: "màu-sắc", color: "#0D9488", note: "Màu sắc cơ bản" },

  // Cụm công nghệ
  { id: "w13", word: "máy tính", x: 304, y: 76, group: "công-nghệ", color: "#2563EB", note: "Thiết bị điện tử" },
  { id: "w14", word: "điện thoại", x: 322, y: 90, group: "công-nghệ", color: "#2563EB", note: "Thiết bị di động" },
  { id: "w15", word: "phần mềm", x: 288, y: 108, group: "công-nghệ", color: "#2563EB", note: "Sản phẩm kỹ thuật số" },
  { id: "w16", word: "internet", x: 318, y: 112, group: "công-nghệ", color: "#2563EB", note: "Mạng toàn cầu" },

  // Cụm cảm xúc
  { id: "w17", word: "vui", x: 80, y: 200, group: "cảm-xúc", color: "#DC2626", note: "Cảm xúc tích cực" },
  { id: "w18", word: "buồn", x: 64, y: 218, group: "cảm-xúc", color: "#DC2626", note: "Cảm xúc tiêu cực — đối nghĩa với 'vui'" },
  { id: "w19", word: "hạnh phúc", x: 100, y: 188, group: "cảm-xúc", color: "#DC2626", note: "Cảm xúc tích cực mạnh, gần 'vui'" },
  { id: "w20", word: "giận", x: 54, y: 232, group: "cảm-xúc", color: "#DC2626", note: "Cảm xúc tiêu cực, gần 'buồn'" },
];

// Tính khoảng cách Euclid 2D giữa hai điểm (giả lập cho việc tìm nearest neighbor)
function euclid(a: WordPoint, b: WordPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Cosine similarity giả lập — suy từ khoảng cách 2D (gần → similarity cao)
function fakeCosine(a: WordPoint, b: WordPoint): number {
  const d = euclid(a, b);
  // Map d ∈ [0, ~450] → similarity ∈ [1.0, 0.05]
  const sim = Math.max(0.05, 1 - d / 450);
  return Math.round(sim * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// SO SÁNH MODEL: OpenAI text-embedding-3 vs sentence-transformers (multilingual)
// Dữ liệu ma trận cosine giả lập — thể hiện cùng cặp từ cho ra similarity khác nhau
// tuỳ model (model đa ngôn ngữ tốt hơn với tiếng Việt)
// ─────────────────────────────────────────────────────────────────────────────

const HEATMAP_WORDS = ["vua", "hoàng đế", "mèo", "chó", "xanh", "đỏ"] as const;

// Ma trận 6x6 — cosine similarity giả lập cho OpenAI text-embedding-3-small
const OPENAI_MATRIX: number[][] = [
  [1.00, 0.89, 0.12, 0.14, 0.09, 0.11],
  [0.89, 1.00, 0.11, 0.13, 0.08, 0.10],
  [0.12, 0.11, 1.00, 0.82, 0.18, 0.19],
  [0.14, 0.13, 0.82, 1.00, 0.20, 0.21],
  [0.09, 0.08, 0.18, 0.20, 1.00, 0.74],
  [0.11, 0.10, 0.19, 0.21, 0.74, 1.00],
];

// Ma trận 6x6 — cosine similarity giả lập cho sentence-transformers multilingual
// Model đa ngôn ngữ bắt được liên kết giữa "vua" và "hoàng đế" mạnh hơn một chút
const ST_MATRIX: number[][] = [
  [1.00, 0.93, 0.15, 0.16, 0.11, 0.12],
  [0.93, 1.00, 0.14, 0.15, 0.10, 0.11],
  [0.15, 0.14, 1.00, 0.85, 0.21, 0.22],
  [0.16, 0.15, 0.85, 1.00, 0.23, 0.24],
  [0.11, 0.10, 0.21, 0.23, 1.00, 0.79],
  [0.12, 0.11, 0.22, 0.24, 0.79, 1.00],
];

// Hàm lấy màu heatmap dựa trên giá trị similarity (0-1)
function heatColor(v: number): string {
  // Gradient từ xám (0) → xanh lá nhạt (0.5) → xanh lá đậm (1.0)
  if (v < 0.2) return "rgba(148, 163, 184, 0.25)";
  if (v < 0.4) return "rgba(16, 185, 129, 0.25)";
  if (v < 0.6) return "rgba(16, 185, 129, 0.45)";
  if (v < 0.8) return "rgba(16, 185, 129, 0.65)";
  return "rgba(16, 185, 129, 0.85)";
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ — 8 CÂU
// ─────────────────────────────────────────────────────────────────────────────

const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Embedding chuyển 'Phở ngon' thành vector [0.82, 0.15, 0.03, ...]. Các số này đại diện cho gì?",
    options: [
      "Mã ASCII của các ký tự trong câu",
      "Vị trí trong không gian ngữ nghĩa — mỗi chiều đại diện một khía cạnh ý nghĩa",
      "Số lần xuất hiện của từng từ",
      "Điểm đánh giá độ hay của câu",
    ],
    correct: 1,
    explanation:
      "Mỗi số trong vector là một toạ độ trong không gian ngữ nghĩa nhiều chiều (thường 768–3072 chiều). Câu có nghĩa gần nhau → vector gần nhau. 'Phở ngon' và 'Bún chả tuyệt vời' sẽ có vector gần nhau hơn 'Python dễ học' rất nhiều.",
  },
  {
    question:
      "Cosine similarity giữa hai vector embedding = 0.95. Hai câu này có quan hệ gì?",
    options: [
      "Hoàn toàn không liên quan",
      "Có nghĩa rất giống nhau",
      "Đối nghĩa nhau",
      "Cùng độ dài câu",
    ],
    correct: 1,
    explanation:
      "Cosine similarity 0.95 (gần 1) = rất giống về nghĩa. 0 = không liên quan. -1 = đối nghĩa (hiếm trong embedding hiện đại vì không gian bị bias về phía dương). Đây là cách search engine ngữ nghĩa hoạt động!",
  },
  {
    question: "Embedding model hiện đại thường tạo vector có bao nhiêu chiều?",
    options: [
      "2-3 chiều (dễ hình dung)",
      "768 – 3072 chiều",
      "Đúng 1 chiều (một số duy nhất)",
      "Tuỳ độ dài câu (mỗi từ 1 chiều)",
    ],
    correct: 1,
    explanation:
      "Embedding model thực tế: 384 chiều (all-MiniLM-L6-v2), 768 chiều (BERT-base), 1024 chiều (BGE-M3), 1536 chiều (OpenAI ada-002), 3072 chiều (text-embedding-3-large). Nhiều chiều = nắm bắt nhiều sắc thái ý nghĩa hơn, nhưng cũng tốn storage và compute hơn.",
  },
  {
    question:
      "Tại sao embedding model đa ngôn ngữ có thể so sánh 'Phở bò Hà Nội' với 'Beef pho from Hanoi' và ra similarity > 0.8?",
    options: [
      "Model dịch ngầm sang tiếng Anh rồi so sánh từng chữ",
      "Model học trên dữ liệu song ngữ và align không gian vector giữa các ngôn ngữ — câu cùng nghĩa → vector gần nhau bất kể ngôn ngữ",
      "Model đếm số ký tự Unicode trùng nhau",
      "Model dùng Google Translate làm bước tiền xử lý",
    ],
    correct: 1,
    explanation:
      "Multilingual embedding (Cohere multilingual, BGE-M3, LaBSE, E5-multilingual) được train trên cặp câu song ngữ. Nhờ vậy không gian vector của các ngôn ngữ được 'align' lại — câu cùng nghĩa rơi vào vùng gần nhau dù khác ngôn ngữ hoàn toàn.",
  },
  {
    question:
      "Bạn muốn so sánh độ giống nhau giữa hai vector embedding. Dùng metric nào là chuẩn mực?",
    options: [
      "Euclidean distance",
      "Cosine similarity",
      "Manhattan distance",
      "Hamming distance",
    ],
    correct: 1,
    explanation:
      "Cosine similarity là chuẩn mực cho embedding vì nó đo góc giữa hai vector, bỏ qua độ dài. Nhiều model được train để vector có norm gần 1 → cosine ≈ dot product. Euclidean cũng hoạt động nếu vector đã normalize, nhưng cosine là mặc định trong hầu hết vector database.",
  },
  {
    type: "fill-blank",
    question:
      "Embedding model chuyển văn bản thành một {blank} số học nằm trong không gian nhiều {blank}, nơi câu giống nghĩa sẽ ở gần nhau.",
    blanks: [
      { answer: "vector", accept: ["vectơ", "véc-tơ"] },
      { answer: "chiều", accept: ["dimension", "chieu"] },
    ],
    explanation:
      "Embedding = vector số trong không gian nhiều chiều (thường 384–3072 chiều). Mỗi chiều nắm bắt một khía cạnh ngữ nghĩa; câu có nghĩa gần nhau → vector gần nhau (đo bằng cosine similarity).",
  },
  {
    question:
      "Trong RAG pipeline, embedding model được dùng ở đâu?",
    options: [
      "Chỉ ở bước sinh câu trả lời cuối cùng",
      "Ở bước biến document và query thành vector để tìm document gần nhất trong vector database",
      "Chỉ ở bước tokenize",
      "Không dùng — RAG chỉ dùng keyword search",
    ],
    correct: 1,
    explanation:
      "RAG (Retrieval Augmented Generation) chạy: (1) Chunk document → embedding → lưu trong vector DB. (2) Query → embedding → tìm top-K document gần nhất (bằng cosine). (3) Đưa document + query vào LLM để sinh câu trả lời. Embedding model là trái tim của bước retrieval.",
  },
  {
    question:
      "Bạn train classifier phân loại email spam/ham dùng embedding làm feature. Một cách tiếp cận tốt là gì?",
    options: [
      "Chỉ dùng độ dài email làm feature",
      "Tạo embedding cho toàn bộ email, rồi train logistic regression hoặc SVM trên vector đó",
      "Dùng cosine similarity giữa embedding và từ 'spam' làm feature duy nhất",
      "Bỏ embedding, chỉ đếm số từ viết hoa",
    ],
    correct: 1,
    explanation:
      "Embedding biến email (chuỗi variable-length) thành vector fixed-length → đầu vào hoàn hảo cho classifier cổ điển. Logistic regression hoặc SVM trên embedding thường đạt accuracy cao hơn nhiều so với TF-IDF, đặc biệt với dữ liệu ít (< 10k samples). Đây là pattern 'feature extractor' kinh điển.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CHÍNH
// ─────────────────────────────────────────────────────────────────────────────

export default function EmbeddingModelTopic() {
  const [query, setQuery] = useState<string>("vua");
  const [hovered, setHovered] = useState<string | null>(null);
  const [model, setModel] = useState<"openai" | "st">("openai");
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);

  // Tính 5 từ gần nhất với query (trừ chính nó)
  const nearestNeighbors = useMemo(() => {
    const q = WORDS.find((w) => w.word.toLowerCase() === query.toLowerCase());
    if (!q) return [];
    return WORDS.filter((w) => w.id !== q.id)
      .map((w) => ({ word: w, sim: fakeCosine(q, w) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 5);
  }, [query]);

  const queryPoint = useMemo(
    () => WORDS.find((w) => w.word.toLowerCase() === query.toLowerCase()) ?? null,
    [query]
  );

  const matrix = model === "openai" ? OPENAI_MATRIX : ST_MATRIX;

  const handleWordClick = useCallback((word: string) => {
    setQuery(word);
  }, []);

  return (
    <>
      {/* ━━━ BƯỚC 1 — HOOK / DỰ ĐOÁN ━━━ */}
      <LessonSection step={1} totalSteps={6} label="Thử đoán">
        <div className="mb-4">
          <ProgressSteps
            current={1}
            total={6}
            labels={[
              "Thử đoán",
              "Bản đồ ngữ nghĩa",
              "Tìm láng giềng",
              "So sánh model",
              "Aha & thách thức",
              "Giải thích & Quiz",
            ]}
          />
        </div>

        <PredictionGate
          question="Máy tính chỉ hiểu số. Làm sao để nó biết 'vua' và 'hoàng đế' có nghĩa GIỐNG nhau, trong khi 'vua' và 'mèo' thì KHÁC nhau?"
          options={[
            "So sánh từng chữ cái — giống chữ = giống nghĩa",
            "Chuyển mỗi từ thành một dãy số (vector), từ giống nghĩa → vector gần nhau",
            "Dịch sang tiếng Anh rồi so sánh",
          ]}
          correct={1}
          explanation="Đúng! Embedding model chuyển text thành vector số. Từ giống nghĩa → vector gần nhau trong 'không gian ngữ nghĩa'. Đây là nền tảng cho tìm kiếm ngữ nghĩa, RAG, và mọi ứng dụng AI hiểu ngôn ngữ."
        >
          <p className="text-sm text-muted mt-4">
            Hãy xem 20 từ tiếng Việt trông như thế nào trong &quot;bản đồ
            ngữ nghĩa&quot;. Các từ cùng chủ đề sẽ tự động tụ lại thành cụm.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ BƯỚC 2 — BẢN ĐỒ 2D 20 TỪ ━━━ */}
      <LessonSection step={2} totalSteps={6} label="Bản đồ ngữ nghĩa">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Không gian embedding 2D — 20 từ tiếng Việt
          </h3>
          <p className="text-sm text-muted mb-4">
            Mỗi chấm là một từ được chiếu xuống 2D bằng t-SNE. Các từ cùng
            chủ đề (quyền lực, động vật, màu sắc, công nghệ, cảm xúc) tự động
            tụ lại thành cụm. Di chuột để xem chi tiết. Nhấn vào một từ để
            đặt nó làm query.
          </p>

          <svg
            viewBox="0 0 400 320"
            className="w-full max-w-2xl mx-auto rounded-lg border border-border bg-card/30"
            role="img"
            aria-label="Bản đồ embedding 2D của 20 từ tiếng Việt"
          >
            {/* Grid nền */}
            {[0, 50, 100, 150, 200, 250, 300, 350, 400].map((x) => (
              <line
                key={`v${x}`}
                x1={x}
                y1={0}
                x2={x}
                y2={320}
                stroke="var(--border)"
                strokeWidth={0.5}
                opacity={0.25}
              />
            ))}
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((y) => (
              <line
                key={`h${y}`}
                x1={0}
                y1={y}
                x2={400}
                y2={y}
                stroke="var(--border)"
                strokeWidth={0.5}
                opacity={0.25}
              />
            ))}

            {/* Vùng cụm — ellipse mờ */}
            <ellipse cx={88} cy={66} rx={50} ry={26} fill="#7C3AED" opacity={0.08} />
            <text x={88} y={36} textAnchor="middle" fontSize={11} fill="#7C3AED" fontWeight={600}>
              Quyền lực
            </text>

            <ellipse cx={200} cy={255} rx={40} ry={30} fill="#D97706" opacity={0.08} />
            <text x={200} y={298} textAnchor="middle" fontSize={11} fill="#D97706" fontWeight={600}>
              Động vật
            </text>

            <ellipse cx={305} cy={237} rx={28} ry={22} fill="#0D9488" opacity={0.08} />
            <text x={305} y={272} textAnchor="middle" fontSize={11} fill="#0D9488" fontWeight={600}>
              Màu sắc
            </text>

            <ellipse cx={308} cy={97} rx={30} ry={24} fill="#2563EB" opacity={0.08} />
            <text x={308} y={135} textAnchor="middle" fontSize={11} fill="#2563EB" fontWeight={600}>
              Công nghệ
            </text>

            <ellipse cx={75} cy={210} rx={42} ry={28} fill="#DC2626" opacity={0.08} />
            <text x={75} y={250} textAnchor="middle" fontSize={11} fill="#DC2626" fontWeight={600}>
              Cảm xúc
            </text>

            {/* Đường nối query đến 3 láng giềng gần nhất */}
            {queryPoint &&
              nearestNeighbors.slice(0, 3).map((nb, i) => (
                <line
                  key={`nn-${i}`}
                  x1={queryPoint.x}
                  y1={queryPoint.y}
                  x2={nb.word.x}
                  y2={nb.word.y}
                  stroke="var(--accent)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  opacity={0.55}
                />
              ))}

            {/* Các điểm từ */}
            {WORDS.map((w) => {
              const isHovered = hovered === w.id;
              const isQuery = queryPoint?.id === w.id;
              const isNeighbor = nearestNeighbors.some((nb) => nb.word.id === w.id);
              const r = isQuery ? 9 : isHovered ? 8 : isNeighbor ? 6.5 : 5;

              return (
                <g
                  key={w.id}
                  onMouseEnter={() => setHovered(w.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleWordClick(w.word)}
                  className="cursor-pointer"
                >
                  <motion.circle
                    cx={w.x}
                    cy={w.y}
                    r={r}
                    fill={w.color}
                    stroke={isQuery ? "var(--accent)" : "var(--bg-card)"}
                    strokeWidth={isQuery ? 3 : 2}
                    animate={{ r }}
                    transition={{ duration: 0.15 }}
                  />
                  <text
                    x={w.x}
                    y={w.y - r - 4}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--text-secondary)"
                    className="pointer-events-none select-none"
                  >
                    {w.word}
                  </text>

                  {isHovered && w.note && (
                    <g className="pointer-events-none">
                      <rect
                        x={w.x - 90}
                        y={w.y + r + 4}
                        width={180}
                        height={30}
                        rx={4}
                        fill="var(--bg-card)"
                        stroke="var(--border)"
                        strokeWidth={1}
                      />
                      <text
                        x={w.x}
                        y={w.y + r + 18}
                        textAnchor="middle"
                        fontSize={11}
                        fill="var(--text-primary)"
                      >
                        {w.note.slice(0, 40)}
                      </text>
                      <text
                        x={w.x}
                        y={w.y + r + 28}
                        textAnchor="middle"
                        fontSize={11}
                        fill="var(--text-tertiary)"
                      >
                        {w.note.length > 40 ? w.note.slice(40, 80) : ""}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Chú thích cụm */}
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <LegendDot color="#7C3AED" label="Quyền lực" />
            <LegendDot color="#D97706" label="Động vật" />
            <LegendDot color="#0D9488" label="Màu sắc" />
            <LegendDot color="#2563EB" label="Công nghệ" />
            <LegendDot color="#DC2626" label="Cảm xúc" />
          </div>

          <p className="mt-3 text-xs text-muted">
            Chú ý: &quot;vua&quot; và &quot;hoàng đế&quot; nằm sát nhau,
            &quot;mèo&quot; và &quot;chó&quot; cũng sát nhau. Đây không phải
            là &quot;tô màu&quot; thủ công — embedding model học vị trí này
            từ hàng tỷ câu văn trên Internet.
          </p>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 3 — TÌM LÁNG GIỀNG ━━━ */}
      <LessonSection step={3} totalSteps={6} label="Tìm láng giềng">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Nearest neighbor — 5 từ gần nhất với query
          </h3>
          <p className="text-sm text-muted mb-4">
            Gõ một từ bất kỳ trong danh sách để xem 5 từ gần nghĩa nhất trong
            không gian embedding.
          </p>

          <div className="flex items-center gap-2 mb-4">
            <label
              htmlFor="query-input"
              className="text-xs font-medium text-muted"
            >
              Query:
            </label>
            <input
              id="query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              list="word-suggestions"
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="vd: vua, mèo, xanh..."
            />
            <datalist id="word-suggestions">
              {WORDS.map((w) => (
                <option key={w.id} value={w.word} />
              ))}
            </datalist>
          </div>

          {/* Các nút shortcut */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {["vua", "mèo", "xanh", "máy tính", "vui"].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setQuery(w)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  query === w
                    ? "bg-accent text-white"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Kết quả */}
          {queryPoint ? (
            <div className="rounded-lg border border-border bg-card/40 p-4">
              <p className="text-xs text-muted mb-3">
                5 từ gần nhất với{" "}
                <strong className="text-foreground">
                  &quot;{queryPoint.word}&quot;
                </strong>
                :
              </p>

              <div className="space-y-2">
                {nearestNeighbors.map((nb, i) => (
                  <motion.div
                    key={nb.word.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-5 text-xs text-muted">#{i + 1}</span>
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: nb.word.color }}
                    />
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {nb.word.word}
                    </span>
                    <span className="w-10 text-right text-xs tabular-nums text-muted">
                      {nb.sim.toFixed(2)}
                    </span>
                    <div className="h-2 w-24 rounded-full bg-surface overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: nb.word.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${nb.sim * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <p className="mt-4 text-xs text-muted">
                Các từ cùng cụm với &quot;{queryPoint.word}&quot; sẽ có
                similarity cao (&gt; 0.7). Các từ khác cụm sẽ có similarity
                thấp (&lt; 0.3). Đây chính là cơ sở của semantic search.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface/40 p-4 text-center text-sm text-muted">
              Từ &quot;{query}&quot; không có trong danh sách 20 từ mẫu. Thử
              gõ: vua, mèo, xanh, máy tính, vui...
            </div>
          )}
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 4 — SO SÁNH MODEL (HEATMAP) ━━━ */}
      <LessonSection step={4} totalSteps={6} label="So sánh model">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Heatmap cosine similarity — hai embedding model
          </h3>
          <p className="text-sm text-muted mb-4">
            Cùng 6 từ tiếng Việt, hai model cho ra ma trận similarity hơi
            khác nhau. Chuyển qua lại để thấy model đa ngôn ngữ (Sentence
            Transformers) bắt liên kết ngữ nghĩa mạnh hơn một chút so với
            OpenAI text-embedding-3-small (chủ yếu train trên tiếng Anh).
          </p>

          <div className="mb-4 inline-flex rounded-lg border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setModel("openai")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                model === "openai"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              OpenAI text-embedding-3-small
            </button>
            <button
              type="button"
              onClick={() => setModel("st")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                model === "st"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Sentence-Transformers (multilingual)
            </button>
          </div>

          {/* Heatmap SVG */}
          <div className="overflow-x-auto">
            <svg
              viewBox="0 0 420 360"
              className="w-full max-w-md mx-auto"
              role="img"
              aria-label="Ma trận cosine similarity"
            >
              {/* Hàng tiêu đề (cột) */}
              {HEATMAP_WORDS.map((w, i) => (
                <text
                  key={`col-${i}`}
                  x={90 + i * 50 + 25}
                  y={45}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                  fontWeight={500}
                >
                  {w}
                </text>
              ))}

              {/* Cột tiêu đề (hàng) */}
              {HEATMAP_WORDS.map((w, i) => (
                <text
                  key={`row-${i}`}
                  x={82}
                  y={65 + i * 50 + 30}
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--text-secondary)"
                  fontWeight={500}
                >
                  {w}
                </text>
              ))}

              {/* Ô heatmap */}
              {matrix.map((row, i) =>
                row.map((v, j) => {
                  const isHover = hoverCell?.[0] === i && hoverCell?.[1] === j;
                  return (
                    <g
                      key={`c-${i}-${j}`}
                      onMouseEnter={() => setHoverCell([i, j])}
                      onMouseLeave={() => setHoverCell(null)}
                    >
                      <rect
                        x={90 + j * 50}
                        y={65 + i * 50}
                        width={48}
                        height={48}
                        rx={4}
                        fill={heatColor(v)}
                        stroke={isHover ? "var(--accent)" : "var(--border)"}
                        strokeWidth={isHover ? 2 : 0.5}
                      />
                      <text
                        x={90 + j * 50 + 24}
                        y={65 + i * 50 + 30}
                        textAnchor="middle"
                        fontSize={11}
                        fill={v > 0.5 ? "#ffffff" : "var(--text-secondary)"}
                        fontWeight={v > 0.8 ? 700 : 500}
                      >
                        {v.toFixed(2)}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* Chú thích thang màu */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
            <span>Thấp</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
              <div
                key={v}
                className="h-4 w-8 rounded"
                style={{ backgroundColor: heatColor(v) }}
                aria-hidden
              />
            ))}
            <span>Cao</span>
          </div>

          {hoverCell && (
            <div className="mt-3 rounded-lg bg-surface p-3 text-xs text-foreground">
              <strong>
                &quot;{HEATMAP_WORDS[hoverCell[0]]}&quot; ↔ &quot;
                {HEATMAP_WORDS[hoverCell[1]]}&quot;
              </strong>{" "}
              — similarity = {matrix[hoverCell[0]][hoverCell[1]].toFixed(2)}.
              {hoverCell[0] === hoverCell[1] &&
                " (Đường chéo luôn = 1.00 vì đo với chính nó.)"}
            </div>
          )}

          <div className="mt-4 rounded-lg border border-dashed border-border bg-surface/40 p-3">
            <p className="text-xs text-muted leading-relaxed">
              <strong className="text-foreground">Nhận xét:</strong> Cả hai
              model đều bắt đúng các cặp gần nghĩa (vua–hoàng đế, mèo–chó,
              xanh–đỏ). Model đa ngôn ngữ (Sentence-Transformers)
              có similarity cao hơn một chút ở các cặp đồng nghĩa vì được
              train đặc biệt trên dữ liệu đa ngôn ngữ. Trong thực tế,
              benchmark MTEB (Massive Text Embedding Benchmark) là nơi so
              sánh các model công bằng trên nhiều task.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ BƯỚC 5 — AHA + THÁCH THỨC ━━━ */}
      <LessonSection step={5} totalSteps={6} label="Aha & thách thức">
        <AhaMoment>
          <strong>Embedding model</strong> chuyển text thành vector trong
          không gian nhiều chiều. Từ/câu giống nghĩa → vector gần nhau →
          cosine similarity cao. Đây là nền tảng cho{" "}
          <TopicLink slug="semantic-search">tìm kiếm ngữ nghĩa</TopicLink>,
          lưu trữ trong{" "}
          <TopicLink slug="vector-databases">vector database</TopicLink>, và
          kế thừa từ ý tưởng{" "}
          <TopicLink slug="word-embeddings">word embeddings</TopicLink> cổ
          điển. Điều kỳ diệu: model chưa bao giờ được dạy rõ &quot;vua và
          hoàng đế là đồng nghĩa&quot; — nó tự học từ việc thấy chúng xuất
          hiện trong các ngữ cảnh tương tự.
        </AhaMoment>

        <div className="mt-6 space-y-4">
          <InlineChallenge
            question="'Phở bò Hà Nội' và 'Beef pho from Hanoi' — cosine similarity sẽ như thế nào với một embedding model đa ngôn ngữ?"
            options={[
              "Rất thấp (< 0.3) — vì khác ngôn ngữ hoàn toàn",
              "Rất cao (> 0.8) — vì cùng nghĩa, embedding model đa ngôn ngữ hiểu ngữ nghĩa không phụ thuộc ngôn ngữ",
              "Đúng 0 — vì không có chữ nào giống nhau",
              "Không so sánh được — cần cùng ngôn ngữ",
            ]}
            correct={1}
            explanation="Multilingual embedding models (Cohere multilingual, BGE-M3, LaBSE, E5-multilingual) hiểu ngữ nghĩa XUYÊN ngôn ngữ. 'Phở bò Hà Nội' và 'Beef pho from Hanoi' sẽ có vector rất gần nhau dù khác ngôn ngữ. Đây là lợi thế lớn khi xây hệ thống search hoặc RAG cho người dùng đa ngôn ngữ."
          />

          <InlineChallenge
            question="Bạn có 1 triệu document và muốn tìm document gần nhất với mỗi query. So sánh cosine với TẤT CẢ 1 triệu mỗi lần query thì quá chậm. Giải pháp đúng là gì?"
            options={[
              "Bỏ embedding, chuyển sang keyword search",
              "Dùng vector database với thuật toán ANN (Approximate Nearest Neighbor) như HNSW — trả kết quả gần đúng nhưng nhanh hơn 100-1000 lần",
              "Tính trước cosine của MỌI cặp có thể có rồi lưu lại",
              "Chỉ so sánh với 100 document đầu tiên cho nhanh",
            ]}
            correct={1}
            explanation="Vector database (Pinecone, Weaviate, Qdrant, Milvus, pgvector) dùng thuật toán ANN như HNSW hoặc IVF để tìm top-K nearest neighbors trong O(log N) thay vì O(N). Trade-off là recall không phải 100% nhưng thường > 95% với tham số đúng. Đây là bước bắt buộc để scale semantic search lên hàng triệu vector."
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Callout variant="tip" title="Normalize vector trước khi so sánh">
            Nhiều model (OpenAI text-embedding-3) trả vector đã normalize
            (norm = 1). Khi đó cosine similarity = dot product, tính cực
            nhanh. Nếu không chắc, hãy gọi{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-xs">
              v / np.linalg.norm(v)
            </code>{" "}
            trước.
          </Callout>

          <Callout
            variant="warning"
            title="Đừng trộn embedding từ nhiều model"
          >
            Mỗi model có không gian vector riêng — không so sánh được
            embedding của OpenAI với embedding của BGE-M3 trực tiếp. Nếu đổi
            model, phải re-embed toàn bộ corpus.
          </Callout>

          <Callout variant="insight" title="Chunk size quan trọng hơn model">
            Trong RAG, chọn chunk size hợp lý (300-500 token) thường cải
            thiện chất lượng nhiều hơn đổi model. Document quá dài → vector
            bị &quot;loãng&quot;, không còn đại diện cho bất kỳ khái niệm cụ
            thể nào.
          </Callout>

          <Callout variant="info" title="MTEB leaderboard">
            Để chọn model, vào{" "}
            <a
              href="https://huggingface.co/spaces/mteb/leaderboard"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              MTEB leaderboard
            </a>{" "}
            trên HuggingFace — bảng xếp hạng embedding model trên 50+ task.
            Lọc theo ngôn ngữ, kích thước, task type.
          </Callout>
        </div>
      </LessonSection>

      {/* ━━━ BƯỚC 6 — GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={6} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Embedding model</strong> chuyển đổi text (từ, câu, đoạn
            văn) thành vector số trong không gian nhiều chiều (thường 384–
            3072 chiều). Mỗi chiều đại diện một khía cạnh ý nghĩa mà model
            đã học từ hàng tỷ câu văn trên Internet.
          </p>

          <p>
            Bản chất toán học: embedding là một hàm{" "}
            <LaTeX>{"f: \\text{text} \\to \\mathbb{R}^d"}</LaTeX>, với{" "}
            <LaTeX>{"d"}</LaTeX> là số chiều (384, 768, 1024, 1536, 3072
            tuỳ model). Hàm <LaTeX>{"f"}</LaTeX> được học sao cho text
            giống nghĩa → vector gần nhau theo metric cosine.
          </p>

          <Callout variant="insight" title="Công thức Cosine Similarity">
            <p className="text-sm">
              Đo góc giữa hai vector. Góc nhỏ (cùng hướng) = giống nghĩa.
              Góc vuông = không liên quan. Góc 180° = đối nghĩa (hiếm trong
              thực tế).
            </p>
            <LaTeX block>
              {
                "\\cos(\\theta) = \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\| \\cdot \\|\\mathbf{B}\\|} = \\frac{\\sum_{i=1}^{d} A_i B_i}{\\sqrt{\\sum_{i=1}^{d} A_i^2} \\cdot \\sqrt{\\sum_{i=1}^{d} B_i^2}}"
              }
            </LaTeX>
            <p className="text-sm mt-1">
              Giá trị: -1 (đối nghĩa) → 0 (không liên quan) → 1 (đồng
              nghĩa). Với vector đã normalize (norm = 1), cosine ={" "}
              <LaTeX>{"\\mathbf{A} \\cdot \\mathbf{B}"}</LaTeX> — tính
              cực nhanh.
            </p>
          </Callout>

          <p>
            <strong>Các embedding model phổ biến năm 2025:</strong>
          </p>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-muted font-medium">
                    Model
                  </th>
                  <th className="text-left py-2 pr-3 text-muted font-medium">
                    Nhà cung cấp
                  </th>
                  <th className="text-left py-2 pr-3 text-muted font-medium">
                    Chiều
                  </th>
                  <th className="text-left py-2 text-muted font-medium">
                    Đặc điểm
                  </th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border">
                  <td className="py-2 pr-3 font-medium">
                    text-embedding-3-large
                  </td>
                  <td className="py-2 pr-3">OpenAI</td>
                  <td className="py-2 pr-3">3072</td>
                  <td className="py-2">
                    Chất lượng cao, Matryoshka (truncate xuống 256/512/1024)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-3 font-medium">
                    text-embedding-3-small
                  </td>
                  <td className="py-2 pr-3">OpenAI</td>
                  <td className="py-2 pr-3">1536</td>
                  <td className="py-2">
                    Rẻ hơn 5x so với -large, đủ tốt cho hầu hết use case
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-3 font-medium">BGE-M3</td>
                  <td className="py-2 pr-3">BAAI (open-source)</td>
                  <td className="py-2 pr-3">1024</td>
                  <td className="py-2">
                    Đa ngôn ngữ, dense + sparse + multi-vector, hỗ trợ
                    tiếng Việt tốt
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-3 font-medium">voyage-3-large</td>
                  <td className="py-2 pr-3">Voyage AI</td>
                  <td className="py-2 pr-3">1024</td>
                  <td className="py-2">Tối ưu cho RAG, top MTEB</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-3 font-medium">Cohere embed-v3</td>
                  <td className="py-2 pr-3">Cohere</td>
                  <td className="py-2 pr-3">1024</td>
                  <td className="py-2">100+ ngôn ngữ, tốt cho tiếng Việt</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-3 font-medium">
                    all-MiniLM-L6-v2
                  </td>
                  <td className="py-2 pr-3">
                    Sentence-Transformers (OSS)
                  </td>
                  <td className="py-2 pr-3">384</td>
                  <td className="py-2">
                    Nhẹ, chạy local trên CPU, tiếng Anh
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">E5-mistral-7b</td>
                  <td className="py-2 pr-3">Microsoft (OSS)</td>
                  <td className="py-2 pr-3">4096</td>
                  <td className="py-2">
                    SOTA open-source, dùng Mistral làm backbone
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock language="python" title="openai_embeddings.py — gọi API OpenAI và tính similarity">
{`"""
Ví dụ: gọi API OpenAI để tạo embedding cho nhiều câu,
sau đó tính cosine similarity giữa các cặp.

Cài đặt:
    pip install openai numpy

Cần OPENAI_API_KEY trong biến môi trường.
"""

from openai import OpenAI
import numpy as np

client = OpenAI()

# 1) Chuẩn bị danh sách câu (nhiều ngôn ngữ để test multilingual)
texts = [
    "Phở bò Hà Nội rất ngon",         # 0
    "Bún chả là đặc sản Hà Nội",       # 1
    "Beef pho from Hanoi is delicious",# 2 — tiếng Anh
    "Python là ngôn ngữ lập trình",    # 3
    "JavaScript dùng để lập trình web",# 4
    "Mèo thích ngủ trên sofa",         # 5
    "Chó là bạn thân của con người",   # 6
]

# 2) Gọi API batch — tạo tất cả embedding trong 1 request (rẻ & nhanh)
response = client.embeddings.create(
    model="text-embedding-3-small",   # 1536 chiều
    input=texts,
    encoding_format="float",          # mặc định
)

# response.data[i].embedding là list[float] có 1536 phần tử
vectors = np.array([d.embedding for d in response.data])
print("Shape của ma trận embedding:", vectors.shape)
# → (7, 1536)

# 3) Cosine similarity giữa hai vector
def cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# 4) In ma trận similarity 7x7
print("\\n=== Cosine Similarity Matrix ===")
print(" " * 32 + "  ".join(f"{i:4d}" for i in range(len(texts))))
for i, ti in enumerate(texts):
    row = []
    for j, tj in enumerate(texts):
        row.append(f"{cosine(vectors[i], vectors[j]):.2f}")
    short = (ti[:28] + "..") if len(ti) > 28 else ti.ljust(30)
    print(f"{i} {short}  " + "  ".join(row))

# Kết quả kỳ vọng:
# - (0, 1) cao (~0.65): 2 câu ẩm thực Hà Nội
# - (0, 2) cao (~0.80): cùng nghĩa dù khác ngôn ngữ (đa ngôn ngữ!)
# - (3, 4) cao (~0.70): 2 câu về lập trình
# - (5, 6) cao (~0.70): 2 câu về vật nuôi
# - (0, 3) thấp (~0.10): ẩm thực vs lập trình

# 5) Tìm nearest neighbor cho query
query = "Tôi muốn ăn món Hà Nội"
query_vec = np.array(
    client.embeddings.create(
        model="text-embedding-3-small",
        input=[query],
    ).data[0].embedding
)

sims = [cosine(query_vec, v) for v in vectors]
ranked = sorted(enumerate(sims), key=lambda x: -x[1])

print(f"\\nTop-3 gần nhất với: '{query}'")
for rank, (idx, sim) in enumerate(ranked[:3], 1):
    print(f"  {rank}. [{sim:.3f}] {texts[idx]}")

# Dự kiến top-1 là "Phở bò Hà Nội rất ngon" hoặc "Bún chả là đặc sản Hà Nội"
# → đây chính là cơ sở cho semantic search.`}
          </CodeBlock>

          <CodeBlock
            language="python"
            title="sentence_transformers_local.py — chạy embedding LOCAL không cần API"
          >
{`"""
Chạy embedding hoàn toàn local bằng sentence-transformers.
Không tốn tiền API, không phụ thuộc Internet, dùng được cho
dữ liệu nhạy cảm (y tế, nội bộ doanh nghiệp).

Cài đặt:
    pip install sentence-transformers

Model nhỏ (all-MiniLM-L6-v2) chỉ ~80 MB, chạy được trên CPU.
"""

from sentence_transformers import SentenceTransformer
import numpy as np

# Model đa ngôn ngữ, hỗ trợ tiếng Việt tốt
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# 1) Encode corpus — 1 lần, lưu ra disk, sau đó dùng lại
corpus = [
    "Phở bò Hà Nội rất ngon",
    "Bún chả là đặc sản Hà Nội",
    "Beef pho from Hanoi is delicious",
    "Python là ngôn ngữ lập trình",
    "JavaScript dùng để lập trình web",
    "Mèo thích ngủ trên sofa",
    "Chó là bạn thân của con người",
]

corpus_embeddings = model.encode(
    corpus,
    normalize_embeddings=True,   # QUAN TRỌNG: normalize để cosine = dot product
    batch_size=32,
    show_progress_bar=True,
)
# Shape: (7, 384)

# 2) Query → encode → tìm top-K gần nhất
query = "Tôi muốn ăn món Hà Nội"
query_embedding = model.encode([query], normalize_embeddings=True)[0]

# Dot product (vì đã normalize)
similarities = corpus_embeddings @ query_embedding  # shape (7,)
top_k_idx = np.argsort(-similarities)[:3]

print(f"Query: '{query}'")
for rank, idx in enumerate(top_k_idx, 1):
    print(f"  #{rank}  [{similarities[idx]:.3f}]  {corpus[idx]}")

# 3) Lưu corpus embeddings ra disk — reload nhanh cho lần sau
np.save("corpus_embeddings.npy", corpus_embeddings)
# Lần sau:
#   corpus_embeddings = np.load("corpus_embeddings.npy")

# 4) Semantic similarity giữa 2 câu bất kỳ
from sentence_transformers.util import cos_sim
sim = cos_sim(corpus_embeddings[0], corpus_embeddings[2])
print(f"\\n'{corpus[0]}' vs '{corpus[2]}' → {sim.item():.3f}")
# → ~0.82: cùng nghĩa dù khác ngôn ngữ (Việt vs Anh)

# 5) Benchmark tốc độ (trên CPU M1 MacBook):
#    - OpenAI API: ~200ms/request + chi phí
#    - sentence-transformers local: ~20ms/câu, miễn phí
#    → Production thường dùng LOCAL cho throughput cao.`}
          </CodeBlock>

          <CollapsibleDetail title="Chi tiết kỹ thuật — Embedding được tạo ra thế nào?">
            <div className="space-y-3 text-sm">
              <p>
                <strong>Bản chất:</strong> Embedding model hầu hết là một
                Transformer encoder (ví dụ BERT, RoBERTa, hoặc LLM
                fine-tuned). Quy trình:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>
                  <strong>Tokenize</strong> văn bản thành các token
                  (subword). Câu &quot;Phở ngon&quot; có thể thành{" "}
                  <code>[&quot;Ph&quot;, &quot;ở&quot;, &quot;ngon&quot;]</code>
                  .
                </li>
                <li>
                  <strong>Embed từng token</strong> thành vector (lookup
                  trong embedding table), cộng với positional encoding.
                </li>
                <li>
                  Cho qua nhiều lớp <strong>Transformer encoder</strong> —
                  self-attention làm mỗi token &quot;nhìn&quot; các token
                  khác để cập nhật representation.
                </li>
                <li>
                  <strong>Pooling</strong>: gộp tất cả token vector thành
                  một vector duy nhất — thường dùng[CLS] token hoặc mean
                  pooling (trung bình cộng).
                </li>
                <li>
                  <strong>Normalize</strong> (optional): chia cho norm →
                  vector nằm trên hypersphere đơn vị.
                </li>
              </ol>

              <p className="mt-2">
                <strong>Training objective:</strong> Contrastive learning.
                Cho cặp câu đồng nghĩa (anchor, positive) và câu không liên
                quan (negatives). Loss hàm kéo anchor gần positive, đẩy xa
                negatives:
              </p>
              <LaTeX block>
                {
                  "\\mathcal{L} = -\\log \\frac{\\exp(\\text{sim}(a, p) / \\tau)}{\\exp(\\text{sim}(a, p) / \\tau) + \\sum_{n} \\exp(\\text{sim}(a, n) / \\tau)}"
                }
              </LaTeX>
              <p>
                với <LaTeX>{"\\tau"}</LaTeX> là nhiệt độ (thường 0.05), và
                hard negatives được chọn từ cùng batch (in-batch
                negatives).
              </p>

              <p className="mt-2">
                <strong>Dữ liệu training:</strong> Hàng chục đến hàng trăm
                triệu cặp từ Common Crawl, Wikipedia, Reddit, MS MARCO, và
                các bộ paraphrase như PAWS, SNLI.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Chi tiết kỹ thuật — Khi nào dùng cross-encoder thay vì bi-encoder?">
            <div className="space-y-3 text-sm">
              <p>
                Có hai kiến trúc chính:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>
                  <strong>Bi-encoder (embedding model):</strong> Mỗi câu
                  được encode độc lập → vector. So sánh bằng cosine.{" "}
                  <em>Nhanh, scalable</em>. Dùng cho retrieval (tìm top-K
                  từ hàng triệu document).
                </li>
                <li>
                  <strong>Cross-encoder (reranker):</strong> Hai câu được
                  đưa CÙNG LÚC vào model (concat với [SEP]), model output
                  score 0-1. <em>Chính xác hơn, nhưng chậm</em>. Không thể
                  pre-compute.
                </li>
              </ul>

              <p>
                <strong>Pipeline RAG tối ưu</strong>: bi-encoder + reranker:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>
                  Bi-encoder (embedding) tìm top-100 document từ 1 triệu
                  document (bằng ANN) — nhanh.
                </li>
                <li>
                  Cross-encoder (reranker như{" "}
                  <code>bge-reranker-v2-m3</code>,{" "}
                  <code>cohere-rerank-v3</code>) rerank lại top-100 → lấy
                  top-5. Chậm hơn nhưng chỉ chạy trên 100 document.
                </li>
                <li>LLM sinh câu trả lời dựa trên top-5.</li>
              </ol>

              <p>
                Kết quả: <strong>chất lượng tăng 10-20% nDCG</strong> so
                với chỉ dùng bi-encoder, mà vẫn giữ được throughput cao.
              </p>
            </div>
          </CollapsibleDetail>

          <p>
            <strong>Ứng dụng thực tế của embedding model:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Semantic search:</strong> thay keyword search bằng
              tìm theo nghĩa. Người dùng gõ &quot;cách nấu phở&quot; → tìm
              được document &quot;recipe for Vietnamese soup&quot;.
            </li>
            <li>
              <strong>RAG:</strong>{" "}
              <TopicLink slug="rag">Retrieval Augmented Generation</TopicLink>{" "}
              — LLM lấy context từ vector DB để trả lời câu hỏi chính xác.
            </li>
            <li>
              <strong>Recommendation:</strong> embed user behavior và item
              → tìm item gần nhất trong không gian vector.
            </li>
            <li>
              <strong>Clustering:</strong> gom document thành chủ đề tự
              động bằng K-means trên embedding.
            </li>
            <li>
              <strong>Classification:</strong> embedding làm feature
              extractor cho classifier cổ điển (logistic regression, SVM).
            </li>
            <li>
              <strong>Anomaly detection:</strong> document có embedding xa
              cụm chính → bất thường.
            </li>
            <li>
              <strong>Zero-shot classification:</strong> so sánh document
              với embedding của nhãn (&quot;tích cực&quot;, &quot;tiêu
              cực&quot;) → chọn nhãn gần nhất.
            </li>
          </ul>

          <p>
            <strong>Đọc thêm:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <TopicLink slug="vector-databases">Vector Databases</TopicLink>{" "}
              — cách lưu và query hàng triệu vector với ANN.
            </li>
            <li>
              <TopicLink slug="semantic-search">Semantic Search</TopicLink>{" "}
              — xây search engine dựa trên embedding.
            </li>
            <li>
              <TopicLink slug="word-embeddings">Word Embeddings</TopicLink>{" "}
              — tiền thân: Word2Vec, GloVe, FastText.
            </li>
            <li>
              <TopicLink slug="self-attention">Self-Attention</TopicLink>{" "}
              — cơ chế cốt lõi giúp Transformer tạo ra embedding tốt.
            </li>
            <li>
              <TopicLink slug="rag">RAG</TopicLink> — ứng dụng số 1 của
              embedding trong kỷ nguyên LLM.
            </li>
          </ul>
        </ExplanationSection>

        <MiniSummary
          points={[
            "Embedding model chuyển text → vector số trong không gian nhiều chiều (384–3072 chiều).",
            "Câu/từ giống nghĩa → vector gần nhau → cosine similarity cao (gần 1).",
            "Model đa ngôn ngữ (BGE-M3, Cohere, multilingual sentence-transformers) hiểu ngữ nghĩa xuyên ngôn ngữ.",
            "Cosine similarity là metric chuẩn; với vector đã normalize, cosine = dot product (rất nhanh).",
            "Nền tảng cho semantic search, RAG, classification, clustering, recommendation.",
            "Với 1M+ vector, dùng vector database với ANN (HNSW, IVF) thay vì so sánh brute-force.",
          ]}
        />

        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT PHỤ — LegendDot
// ─────────────────────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-muted">{label}</span>
    </span>
  );
}
