"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CodeBlock,
  LaTeX,
  LessonSection,} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "embedding-model",
  title: "Embedding Models",
  titleVi: "Mô hình nhúng văn bản",
  description:
    "Mô hình chuyển văn bản thành vector số học, cho phép máy tính hiểu và so sánh ý nghĩa ngữ nghĩa.",
  category: "llm-concepts",
  tags: ["embedding", "vector", "nlp", "representation"],
  difficulty: "intermediate",
  relatedSlugs: ["vector-databases", "semantic-search", "self-attention", "word-embeddings"],
  vizType: "interactive",
};

// ─── Các câu ví dụ với tọa độ 2D giả lập ───
const SENTENCES = [
  { text: "Phở bò Hà Nội rất ngon", x: 80, y: 60, color: "#0D9488", group: "Ẩm thực" },
  { text: "Bún chả là đặc sản Hà Nội", x: 110, y: 80, color: "#0D9488", group: "Ẩm thực" },
  { text: "Cơm tấm Sài Gòn nổi tiếng", x: 90, y: 100, color: "#0D9488", group: "Ẩm thực" },
  { text: "Python là ngôn ngữ lập trình", x: 300, y: 70, color: "#2563EB", group: "Công nghệ" },
  { text: "JavaScript dùng cho web", x: 320, y: 90, color: "#2563EB", group: "Công nghệ" },
  { text: "AI đang thay đổi thế giới", x: 280, y: 110, color: "#2563EB", group: "Công nghệ" },
  { text: "Mèo thích ngủ trên sofa", x: 190, y: 250, color: "#D97706", group: "Động vật" },
  { text: "Chó là bạn thân của người", x: 210, y: 270, color: "#D97706", group: "Động vật" },
];

// ─── Cosine similarity giả lập ───
const SIMILARITY_PAIRS = [
  { a: "Phở bò Hà Nội rất ngon", b: "Bún chả là đặc sản Hà Nội", score: 0.92 },
  { a: "Phở bò Hà Nội rất ngon", b: "Python là ngôn ngữ lập trình", score: 0.12 },
  { a: "Mèo thích ngủ trên sofa", b: "Chó là bạn thân của người", score: 0.78 },
  { a: "AI đang thay đổi thế giới", b: "Python là ngôn ngữ lập trình", score: 0.65 },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Embedding chuyển 'Phở ngon' thành vector [0.82, 0.15, 0.03]. Số này đại diện cho gì?",
    options: [
      "Mã ASCII của các ký tự",
      "Vị trí trong không gian ngữ nghĩa — mỗi chiều đại diện một khía cạnh ý nghĩa",
      "Số từ trong câu",
      "Điểm đánh giá chất lượng câu",
    ],
    correct: 1,
    explanation: "Mỗi số trong vector là một tọa độ trong không gian ngữ nghĩa nhiều chiều. Câu có nghĩa gần nhau → vector gần nhau. 'Phở ngon' và 'Bún chả tuyệt vời' sẽ có vector gần nhau hơn 'Python dễ học'.",
  },
  {
    question: "Cosine similarity giữa hai vector embedding = 0.95. Hai câu này có quan hệ gì?",
    options: [
      "Hoàn toàn không liên quan",
      "Có nghĩa rất giống nhau",
      "Đối nghĩa nhau",
      "Cùng độ dài câu",
    ],
    correct: 1,
    explanation: "Cosine similarity 0.95 (gần 1) = rất giống về nghĩa. 0 = không liên quan. -1 = đối nghĩa (hiếm trong thực tế). Đây là cách search engine ngữ nghĩa hoạt động!",
  },
  {
    question: "Embedding model thường tạo vector có bao nhiêu chiều?",
    options: [
      "2-3 chiều (dễ hình dung)",
      "768 – 3072 chiều (rất nhiều chiều)",
      "Đúng 1 chiều (một số duy nhất)",
      "Tùy độ dài câu (mỗi từ 1 chiều)",
    ],
    correct: 1,
    explanation: "Embedding model thực tế: 768 chiều (BERT), 1536 chiều (OpenAI ada-002), 3072 chiều (text-embedding-3-large). Nhiều chiều = nắm bắt nhiều sắc thái ý nghĩa hơn.",
  },
];

export default function EmbeddingModelTopic() {
  const [selectedPair, setSelectedPair] = useState(0);
  const [hoveredSentence, setHoveredSentence] = useState<number | null>(null);

  const pair = SIMILARITY_PAIRS[selectedPair];

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <LessonSection step={1} totalSteps={5} label="Thử đoán">
      <LessonSection step={1} totalSteps={5} label="Thử đoán">
      <PredictionGate
        question="Máy tính chỉ hiểu số. Làm sao để nó biết 'Phở ngon' và 'Bún chả tuyệt vời' có nghĩa GIỐNG nhau, trong khi 'Phở ngon' và 'Python dễ học' thì KHÁC nhau?"
        options={[
          "So sánh từng chữ cái — giống chữ = giống nghĩa",
          "Chuyển mỗi câu thành một dãy số (vector), câu giống nghĩa → vector gần nhau",
          "Dịch sang tiếng Anh rồi so sánh",
        ]}
        correct={1}
        explanation="Đúng! Embedding model chuyển text thành vector số. Câu giống nghĩa → vector gần nhau trong 'không gian ngữ nghĩa'. Đây là nền tảng cho tìm kiếm ngữ nghĩa, RAG, và mọi ứng dụng AI hiểu ngôn ngữ."
      >
        <p className="text-sm text-muted mt-4">
          Hãy xem các câu tiếng Việt trông như thế nào trong &quot;không gian nghĩa&quot;.
        </p>
      </PredictionGate>

            </LessonSection>

      </LessonSection>

{/* ━━━ KHÁM PHÁ — Bản đồ ngữ nghĩa ━━━ */}
      <LessonSection step={2} totalSteps={5} label="Khám phá">
      <LessonSection step={2} totalSteps={5} label="Khám phá">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Bản đồ ngữ nghĩa — Câu giống nghĩa ở gần nhau
        </h3>
        <p className="text-sm text-muted mb-4">
          Mỗi chấm là một câu. Câu cùng chủ đề nằm gần nhau. Di chuột để xem nội dung.
        </p>

        <svg viewBox="0 0 400 320" className="w-full max-w-md mx-auto">
          {/* Grid nhẹ */}
          {[0, 100, 200, 300, 400].map(x => (
            <line key={`v${x}`} x1={x} y1={0} x2={x} y2={320} stroke="var(--border)" strokeWidth={0.5} opacity={0.3} />
          ))}
          {[0, 80, 160, 240, 320].map(y => (
            <line key={`h${y}`} x1={0} y1={y} x2={400} y2={y} stroke="var(--border)" strokeWidth={0.5} opacity={0.3} />
          ))}

          {/* Vùng nhóm */}
          <ellipse cx={93} cy={80} rx={55} ry={40} fill={SENTENCES[0].color} opacity={0.08} />
          <text x={93} y={135} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">Ẩm thực</text>

          <ellipse cx={300} cy={90} rx={55} ry={40} fill={SENTENCES[3].color} opacity={0.08} />
          <text x={300} y={145} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">Công nghệ</text>

          <ellipse cx={200} cy={260} rx={45} ry={30} fill={SENTENCES[6].color} opacity={0.08} />
          <text x={200} y={300} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">Động vật</text>

          {/* Điểm câu */}
          {SENTENCES.map((s, i) => (
            <g key={i}
              onMouseEnter={() => setHoveredSentence(i)}
              onMouseLeave={() => setHoveredSentence(null)}
              className="cursor-pointer"
            >
              <motion.circle
                cx={s.x} cy={s.y} r={hoveredSentence === i ? 8 : 5}
                fill={s.color}
                stroke="var(--bg-card)"
                strokeWidth={2}
                animate={{ r: hoveredSentence === i ? 8 : 5 }}
                transition={{ duration: 0.15 }}
              />
              {hoveredSentence === i && (
                <g>
                  <rect x={s.x - 80} y={s.y - 28} width={160} height={22} rx={4}
                    fill="var(--bg-card)" stroke="var(--border)" strokeWidth={1} />
                  <text x={s.x} y={s.y - 13} textAnchor="middle" fontSize={8}
                    fill="var(--text-primary)">
                    {s.text}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>

        {/* Similarity calculator */}
        <div className="mt-4">
          <span className="text-xs font-medium text-muted block mb-2">So sánh similarity:</span>
          <div className="flex flex-wrap gap-2 mb-3">
            {SIMILARITY_PAIRS.map((p, i) => (
              <button key={i} type="button"
                onClick={() => setSelectedPair(i)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
                  selectedPair === i ? "bg-accent text-white" : "bg-surface text-muted hover:text-foreground"
                }`}>
                Cặp {i + 1}
              </button>
            ))}
          </div>
          <div className="rounded-lg bg-surface p-3 space-y-1">
            <p className="text-xs text-foreground">A: &quot;{pair.a}&quot;</p>
            <p className="text-xs text-foreground">B: &quot;{pair.b}&quot;</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted">Cosine similarity:</span>
              <span className={`text-sm font-bold ${pair.score > 0.7 ? "text-green-600 dark:text-green-400" : pair.score > 0.3 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                {pair.score.toFixed(2)}
              </span>
              <div className="flex-1 h-2 rounded-full bg-card overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${pair.score * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>
      </VisualizationSection>

            </LessonSection>

      </LessonSection>

{/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={5} label="Khám phá">
      <LessonSection step={3} totalSteps={5} label="Khám phá">
      <AhaMoment>
        <strong>Embedding model</strong>{" "}chuyển text thành vector trong không gian nhiều chiều.
        Câu giống nghĩa → vector gần nhau → cosine similarity cao.
        Đây là nền tảng cho <em>semantic search</em>, <em>RAG</em>, và mọi ứng dụng AI hiểu ngôn ngữ.
      </AhaMoment>

            </LessonSection>

      </LessonSection>

{/* ━━━ THỬ THÁCH ━━━ */}
      <LessonSection step={4} totalSteps={5} label="Thử thách">
      <LessonSection step={4} totalSteps={5} label="Thử thách">
      <InlineChallenge
        question="'Phở bò Hà Nội' và 'Beef pho from Hanoi' — cosine similarity sẽ như thế nào?"
        options={[
          "Rất thấp (< 0.3) — vì khác ngôn ngữ hoàn toàn",
          "Rất cao (> 0.8) — vì cùng nghĩa, embedding model hiểu ngữ nghĩa không phụ thuộc ngôn ngữ",
          "Đúng 0 — vì không có chữ nào giống nhau",
          "Không so sánh được — cần cùng ngôn ngữ",
        ]}
        correct={1}
        explanation="Multilingual embedding models (ví dụ: Cohere multilingual, BGE-M3) hiểu ngữ nghĩa XUYÊN ngôn ngữ. 'Phở bò Hà Nội' và 'Beef pho from Hanoi' sẽ có vector rất gần nhau dù khác ngôn ngữ!"
      />

            </LessonSection>

      </LessonSection>

{/* ━━━ GIẢI THÍCH ━━━ */}
      <LessonSection step={5} totalSteps={5} label="Giải thích">
      <LessonSection step={5} totalSteps={5} label="Giải thích">
      <ExplanationSection>
        <p>
          <strong>Embedding model</strong>{" "}chuyển đổi text (từ, câu, đoạn văn) thành vector
          số trong không gian nhiều chiều. Mỗi chiều đại diện một khía cạnh ý nghĩa.
        </p>

        <Callout variant="insight" title="Cosine Similarity">
          <p className="text-sm">
            Đo góc giữa hai vector. Góc nhỏ (cùng hướng) = giống nghĩa. Góc vuông = không liên quan.
          </p>
          <LaTeX block>{"\\cos(\\theta) = \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\| \\|\\mathbf{B}\\|}"}</LaTeX>
          <p className="text-sm mt-1">Giá trị: -1 (đối nghĩa) → 0 (không liên quan) → 1 (đồng nghĩa)</p>
        </Callout>

        <p><strong>Các embedding model phổ biến:</strong></p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-muted font-medium">Model</th>
                <th className="text-left py-2 pr-3 text-muted font-medium">Chiều</th>
                <th className="text-left py-2 text-muted font-medium">Đặc điểm</th>
              </tr>
            </thead>
            <tbody className="text-foreground/80">
              <tr className="border-b border-border">
                <td className="py-2 pr-3 font-medium">text-embedding-3-large</td>
                <td className="py-2 pr-3">3072</td>
                <td className="py-2">OpenAI, đa ngôn ngữ, chất lượng cao</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-3 font-medium">BGE-M3</td>
                <td className="py-2 pr-3">1024</td>
                <td className="py-2">Open-source, đa ngôn ngữ, hỗ trợ tiếng Việt tốt</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-3 font-medium">voyage-3</td>
                <td className="py-2 pr-3">1024</td>
                <td className="py-2">Voyage AI, tối ưu cho RAG</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-medium">Cohere embed-v3</td>
                <td className="py-2 pr-3">1024</td>
                <td className="py-2">100+ ngôn ngữ, tốt cho tiếng Việt</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CodeBlock language="python" title="embedding_example.py">{`from openai import OpenAI
import numpy as np

client = OpenAI()

# Tạo embedding cho 2 câu
texts = ["Phở bò Hà Nội", "Beef pho from Hanoi"]
response = client.embeddings.create(
    model="text-embedding-3-small",
    input=texts
)

vec_a = np.array(response.data[0].embedding)
vec_b = np.array(response.data[1].embedding)

# Cosine similarity
similarity = np.dot(vec_a, vec_b) / (
    np.linalg.norm(vec_a) * np.linalg.norm(vec_b)
)
print(f"Similarity: {similarity:.4f}")
# → ~0.89 (rất giống dù khác ngôn ngữ!)`}</CodeBlock>
      </ExplanationSection>

      <MiniSummary
        points={[
          "Embedding model chuyển text → vector số trong không gian nhiều chiều (768-3072 chiều)",
          "Câu giống nghĩa → vector gần nhau → cosine similarity cao (gần 1)",
          "Nền tảng cho semantic search, RAG, phân loại, clustering, recommendation",
          "Model đa ngôn ngữ hiểu nghĩa xuyên ngôn ngữ: 'Phở bò' ≈ 'Beef pho' trong không gian vector",
        ]}
      />

      <QuizSection questions={quizQuestions} />
      </LessonSection>
      </LessonSection>
    </>
  );
}
