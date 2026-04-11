"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  slug: "word-embeddings",
  title: "Word Embeddings",
  titleVi: "Word Embeddings - Biểu diễn từ dạng vector",
  description:
    "Phương pháp chuyển đổi từ ngữ thành vector số trong không gian nhiều chiều, nắm bắt được quan hệ ngữ nghĩa.",
  category: "nlp",
  tags: ["nlp", "representation-learning", "semantics"],
  difficulty: "intermediate",
  relatedSlugs: ["word2vec", "glove", "bag-of-words"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

interface WordPoint {
  word: string;
  x: number;
  y: number;
  color: string;
  cluster: string;
}

const WORDS: WordPoint[] = [
  // Ẩm thực Việt Nam
  { word: "phở", x: 420, y: 80, color: "#ef4444", cluster: "Ẩm thực" },
  { word: "bún chả", x: 460, y: 110, color: "#ef4444", cluster: "Ẩm thực" },
  { word: "bánh mì", x: 400, y: 130, color: "#ef4444", cluster: "Ẩm thực" },
  { word: "cơm tấm", x: 450, y: 150, color: "#ef4444", cluster: "Ẩm thực" },
  // Phương tiện
  { word: "xe máy", x: 100, y: 280, color: "#f59e0b", cluster: "Phương tiện" },
  { word: "Grab", x: 140, y: 310, color: "#f59e0b", cluster: "Phương tiện" },
  { word: "ô tô", x: 80, y: 330, color: "#f59e0b", cluster: "Phương tiện" },
  // Hoàng gia
  { word: "vua", x: 280, y: 80, color: "#3b82f6", cluster: "Hoàng gia" },
  { word: "hoàng hậu", x: 330, y: 120, color: "#ec4899", cluster: "Hoàng gia" },
  { word: "đàn ông", x: 160, y: 100, color: "#3b82f6", cluster: "Con người" },
  { word: "phụ nữ", x: 210, y: 140, color: "#ec4899", cluster: "Con người" },
  // Thành phố
  { word: "Hà Nội", x: 350, y: 280, color: "#22c55e", cluster: "Thành phố" },
  { word: "Sài Gòn", x: 400, y: 310, color: "#22c55e", cluster: "Thành phố" },
  { word: "Đà Nẵng", x: 370, y: 340, color: "#22c55e", cluster: "Thành phố" },
];

const ANALOGIES = [
  { question: "vua - đàn ông + phụ nữ = ?", answer: "hoàng hậu", from: "vua", remove: "đàn ông", add: "phụ nữ" },
  { question: "Hà Nội - phở + cơm tấm = ?", answer: "Sài Gòn", from: "Hà Nội", remove: "phở", add: "cơm tấm" },
  { question: "Grab - xe máy + ô tô = ?", answer: "taxi (gần ô tô)", from: "Grab", remove: "xe máy", add: "ô tô" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Tại sao 'phở' và 'bún chả' nằm gần nhau trong không gian vector?",
    options: [
      "Vì chúng có cùng số ký tự",
      "Vì chúng xuất hiện trong ngữ cảnh tương tự (đều là món ăn Việt Nam)",
      "Vì được lập trình thủ công",
      "Vì chúng bắt đầu bằng cùng chữ cái",
    ],
    correct: 1,
    explanation:
      "Word embeddings học từ dữ liệu: 'phở' và 'bún chả' thường xuất hiện cùng ngữ cảnh (món ăn, ngon, Việt Nam...) nên vector của chúng gần nhau.",
  },
  {
    question: "Phép tính 'vua - đàn ông + phụ nữ ≈ hoàng hậu' chứng minh điều gì?",
    options: [
      "Máy tính giỏi toán",
      "Word embeddings nắm bắt được quan hệ ngữ nghĩa giữa các từ",
      "Vua và hoàng hậu là từ đồng nghĩa",
      "Phép cộng vector luôn cho kết quả đúng",
    ],
    correct: 1,
    explanation:
      "Vector(vua) - Vector(đàn ông) = khái niệm 'hoàng gia'. Cộng Vector(phụ nữ) = hoàng gia + nữ = hoàng hậu. Embeddings mã hóa quan hệ ngữ nghĩa!",
  },
  {
    question: "Word Embeddings có ưu điểm gì so với BoW và TF-IDF?",
    options: [
      "Nhanh hơn",
      "Hiểu được ngữ nghĩa — từ tương tự có vector gần nhau",
      "Dùng ít bộ nhớ hơn",
      "Không cần dữ liệu huấn luyện",
    ],
    correct: 1,
    explanation:
      "BoW/TF-IDF coi mỗi từ là độc lập. Word Embeddings hiểu 'phở' gần 'bún chả' (cùng ẩm thực) nhưng xa 'xe máy' (khác ngữ nghĩa).",
  },
];

/* ── Main Component ── */
export default function WordEmbeddingsTopic() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [analogyIdx, setAnalogyIdx] = useState(0);

  const clusters = useMemo(() => {
    const map = new Map<string, WordPoint[]>();
    for (const w of WORDS) {
      const arr = map.get(w.cluster) || [];
      arr.push(w);
      map.set(w.cluster, arr);
    }
    return map;
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Trong "bản đồ từ ngữ", từ nào sẽ nằm GẦN "phở" nhất?`}
          options={['"xe máy"', '"bún chả"', '"toán học"']}
          correct={1}
          explanation={`"Phở" và "bún chả" đều là món ăn Việt Nam — chúng xuất hiện trong ngữ cảnh giống nhau (nhà hàng, ngon, Hà Nội...). Word Embeddings biến từ thành TỌA ĐỘ trên bản đồ — từ có nghĩa gần thì nằm gần nhau!`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Viz ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Bản đồ bên dưới cho thấy các từ trong không gian 2D. Di chuột qua từng từ để xem — bạn sẽ thấy {'"phở"'} nằm gần {'"bún chả"'}, và {'"xe máy"'} nằm gần {'"Grab"'}!
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            <svg viewBox="0 0 550 380" className="w-full max-w-2xl mx-auto">
              {/* Axes */}
              <line x1="30" y1="370" x2="540" y2="370" stroke="#334155" strokeWidth="1" />
              <line x1="30" y1="10" x2="30" y2="370" stroke="#334155" strokeWidth="1" />
              <text x="285" y="395" textAnchor="middle" fill="#64748b" fontSize="10">Chiều 1</text>
              <text x="8" y="190" textAnchor="middle" fill="#64748b" fontSize="10" transform="rotate(-90,8,190)">Chiều 2</text>

              {/* Cluster labels */}
              {Array.from(clusters.entries()).map(([name, points]) => {
                const avgX = points.reduce((s, p) => s + p.x, 0) / points.length;
                const avgY = points.reduce((s, p) => s + p.y, 0) / points.length;
                return (
                  <text key={name} x={avgX} y={avgY - 25} textAnchor="middle" fill="#475569" fontSize="9" fontStyle="italic">
                    {name}
                  </text>
                );
              })}

              {/* Cluster circles */}
              {Array.from(clusters.entries()).map(([name, points]) => {
                const avgX = points.reduce((s, p) => s + p.x, 0) / points.length;
                const avgY = points.reduce((s, p) => s + p.y, 0) / points.length;
                const radius = Math.max(...points.map((p) => Math.sqrt((p.x - avgX) ** 2 + (p.y - avgY) ** 2))) + 30;
                return (
                  <circle key={`cluster-${name}`} cx={avgX} cy={avgY} r={radius}
                    fill={points[0].color} opacity={0.05} stroke={points[0].color}
                    strokeWidth={1} strokeDasharray="4,4" />
                );
              })}

              {/* Words as dots */}
              {WORDS.map((item) => (
                <g key={item.word}
                  onMouseEnter={() => setHovered(item.word)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}>
                  <circle cx={item.x} cy={item.y}
                    r={hovered === item.word ? 8 : 5}
                    fill={item.color}
                    opacity={hovered && hovered !== item.word ? 0.3 : 1} />
                  <text x={item.x} y={item.y - 12} textAnchor="middle"
                    fill={hovered === item.word ? "#e2e8f0" : "#94a3b8"}
                    fontSize={hovered === item.word ? 12 : 10}
                    fontWeight={hovered === item.word ? "bold" : "normal"}>
                    {item.word}
                  </text>
                </g>
              ))}

              {/* Analogy arrow: vua → hoàng hậu */}
              <defs>
                <marker id="arrowhead-we" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
                </marker>
              </defs>
              <line x1="280" y1="80" x2="325" y2="118" stroke="#f59e0b" strokeWidth="1.5"
                strokeDasharray="4,3" markerEnd="url(#arrowhead-we)" />
            </svg>

            {/* Analogy playground */}
            <div className="rounded-lg bg-background/50 border border-border p-4 space-y-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                Phép tính vector nổi tiếng
              </p>
              <div className="flex flex-wrap gap-2">
                {ANALOGIES.map((a, i) => (
                  <button key={i} type="button" onClick={() => setAnalogyIdx(i)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      analogyIdx === i
                        ? "bg-accent text-white"
                        : "bg-card border border-border text-muted hover:text-foreground"
                    }`}>
                    {a.question}
                  </button>
                ))}
              </div>
              <div className="text-center py-2">
                <p className="text-sm text-foreground">
                  <strong className="text-blue-500">{ANALOGIES[analogyIdx].from}</strong>
                  {" "}-{" "}
                  <strong className="text-red-500">{ANALOGIES[analogyIdx].remove}</strong>
                  {" "}+{" "}
                  <strong className="text-green-500">{ANALOGIES[analogyIdx].add}</strong>
                  {" "}={" "}
                  <strong className="text-accent">{ANALOGIES[analogyIdx].answer}</strong>
                </p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Word Embeddings</strong>{" "}
            biến mỗi từ thành tọa độ trong không gian nhiều chiều. Từ có nghĩa gần thì nằm gần nhau, và phép tính vector thể hiện quan hệ ngữ nghĩa!
          </p>
          <p className="text-sm text-muted mt-1">
            Giống bản đồ Việt Nam: Hà Nội gần Hải Phòng (cùng miền Bắc), xa Sài Gòn (miền Nam). Khoảng cách trên bản đồ phản ánh mối quan hệ thực tế!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Nếu vector('Hà Nội') - vector('phở') + vector('cơm tấm'), kết quả sẽ gần vector nào nhất?"
          options={[
            "vector('phở') — vì phở là đặc sản",
            "vector('Sài Gòn') — vì cơm tấm là đặc sản Sài Gòn",
            "vector('xe máy') — vì Sài Gòn nhiều xe máy",
          ]}
          correct={1}
          explanation="Hà Nội - phở = khái niệm 'thành phố'. Cộng cơm tấm = thành phố + đặc sản cơm tấm = Sài Gòn! Embeddings mã hóa cả quan hệ địa lý-ẩm thực."
        />
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Word Embeddings</strong>{" "}
            biểu diễn từ dưới dạng vector số thực trong không gian liên tục (thường 100-300 chiều). Khác hoàn toàn với BoW/TF-IDF, embeddings nắm bắt được quan hệ ngữ nghĩa.
          </p>

          <Callout variant="insight" title="Tại sao embeddings hoạt động?">
            <p>Dựa trên giả thuyết phân phối (distributional hypothesis):</p>
            <LaTeX display>{`\\text{"Từ ngữ được hiểu qua bạn đồng hành của chúng"}`}</LaTeX>
            <p className="mt-2 text-sm">
              Từ xuất hiện trong ngữ cảnh giống nhau → vector gần nhau. {'"Phở"'} và {'"bún chả"'} đều hay đi cùng {'"ngon"'}, {'"Việt Nam"'}, {'"ăn"'} → nằm gần nhau.
            </p>
          </Callout>

          <Callout variant="info" title="Đo khoảng cách giữa các từ">
            <div className="space-y-2">
              <p>Cosine similarity đo góc giữa 2 vector (từ -1 đến 1):</p>
              <LaTeX display>{`\\text{cosine}(\\mathbf{u}, \\mathbf{v}) = \\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\|\\mathbf{u}\\| \\|\\mathbf{v}\\|}`}</LaTeX>
              <p className="text-sm">
                cosine({'"phở"'}, {'"bún chả"'}) = 0.85 (rất gần). cosine({'"phở"'}, {'"xe máy"'}) = 0.12 (rất xa).
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="word_embeddings_demo.py">
{`import gensim.downloader as api

# Tải word embeddings pre-trained
model = api.load("word2vec-google-news-300")

# Tìm từ gần nhất
similar = model.most_similar("Vietnam")
print(similar[:3])
# [('Viet_Nam', 0.72), ('Cambodia', 0.68), ('Laos', 0.65)]

# Phép tính vector nổi tiếng
result = model.most_similar(
    positive=["king", "woman"],
    negative=["man"]
)
print(result[0])  # ('queen', 0.71)

# Đo cosine similarity
print(model.similarity("pho", "noodle"))  # 0.45
print(model.similarity("pho", "car"))     # 0.08`}
          </CodeBlock>

          <Callout variant="tip" title="Embeddings cho tiếng Việt">
            <p>
              <strong>PhoBERT</strong>{" "}
              (VinAI) cung cấp embeddings chất lượng cao cho tiếng Việt.{" "}
              <strong>fastText</strong>{" "}
              cũng có pre-trained vectors cho tiếng Việt. Các mô hình này hiểu {'"phở"'} gần {'"bún chả"'} tốt hơn mô hình tiếng Anh.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 6: Comparison ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="So sánh phương pháp">
        <div className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            Hãy so sánh 3 cách biểu diễn từ mà bạn đã học:
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { name: "BoW / TF-IDF", dim: "Rất lớn (~100K)", semantic: "Không", sparse: "Thưa (sparse)", color: "#ef4444" },
              { name: "Word2Vec / GloVe", dim: "Nhỏ (100-300)", semantic: "Có", sparse: "Dày (dense)", color: "#22c55e" },
              { name: "BERT / GPT", dim: "Lớn (768-1024)", semantic: "Có + ngữ cảnh", sparse: "Dày (dense)", color: "#3b82f6" },
            ].map((m) => (
              <div key={m.name} className="rounded-xl border p-4 space-y-2" style={{ borderColor: m.color + "60" }}>
                <p className="font-semibold text-sm" style={{ color: m.color }}>{m.name}</p>
                <p className="text-xs text-muted">Số chiều: <strong className="text-foreground">{m.dim}</strong></p>
                <p className="text-xs text-muted">Ngữ nghĩa: <strong className="text-foreground">{m.semantic}</strong></p>
                <p className="text-xs text-muted">Dạng: <strong className="text-foreground">{m.sparse}</strong></p>
              </div>
            ))}
          </div>
        </div>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Word Embeddings"
          points={[
            "Embeddings biến từ thành vector dense (100-300 chiều) — nắm bắt ngữ nghĩa.",
            "Từ tương tự nằm gần nhau: 'phở' gần 'bún chả', xa 'xe máy'.",
            "Phép tính vector có ý nghĩa: vua - đàn ông + phụ nữ ≈ hoàng hậu.",
            "Cosine similarity đo mức tương đồng giữa hai từ (từ -1 đến 1).",
            "Nền tảng cho mọi mô hình NLP hiện đại: Word2Vec → GloVe → BERT → GPT.",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
