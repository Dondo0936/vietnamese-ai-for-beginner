"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, CollapsibleDetail, LaTeX, TopicLink,
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
const TOTAL_STEPS = 10;

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
  {
    type: "fill-blank",
    question: "Word embeddings là một dạng {blank} (biểu diễn phân tán) của từ, trong đó các từ có ngữ nghĩa tương đồng sẽ có vector gần nhau — đây chính là cách nắm bắt {blank} giữa các từ.",
    blanks: [
      { answer: "distributed representation", accept: ["biểu diễn phân tán", "distributed"] },
      { answer: "semantic similarity", accept: ["ngữ nghĩa", "tương đồng ngữ nghĩa", "độ tương đồng ngữ nghĩa"] },
    ],
    explanation: "Distributed representation nghĩa là thông tin về một từ được trải đều trên nhiều chiều của vector, không tập trung ở một vị trí. Các từ có ngữ cảnh tương tự sẽ có vector gần nhau, cho phép đo semantic similarity bằng cosine.",
  },
  {
    question: "Vector('phở') và vector('bún chả') có cosine = 0.85. Vector('phở') và vector('xe máy') có cosine = 0.12. Có thể kết luận gì?",
    options: [
      "'Phở' và 'xe máy' không tồn tại trong vocabulary",
      "'Phở' gần 'bún chả' hơn nhiều so với 'xe máy' — đúng với kỳ vọng ngữ nghĩa (cùng là món ăn)",
      "Cosine 0.85 nghĩa là hai từ là đồng nghĩa hoàn toàn",
      "Không có ý nghĩa vì cosine không đo được tiếng Việt",
    ],
    correct: 1,
    explanation: "Cosine đo độ tương đồng ngữ nghĩa — giá trị càng cao càng gần. 0.85 là rất cao (gần = đồng ngữ cảnh), 0.12 là gần như không liên quan. Nhưng đồng nghĩa hoàn toàn yêu cầu cosine ≈ 1.0 và cần bối cảnh khớp hoàn toàn.",
  },
  {
    question: "Bạn huấn luyện Word2Vec trên một corpus chỉ có 1.000 câu. Kết quả embedding có vấn đề gì?",
    options: [
      "Quá lớn để chạy",
      "Quá ít dữ liệu — embedding không học được pattern tổng quát, từ hiếm bị sai hoàn toàn. Word2Vec thường cần ít nhất hàng triệu đến hàng tỷ token.",
      "Cho kết quả hoàn hảo vì dữ liệu sạch",
      "Chỉ hoạt động với tiếng Anh",
    ],
    correct: 1,
    explanation: "Word embeddings học từ đồng xuất hiện (co-occurrence). Với chỉ 1.000 câu, hầu hết từ xuất hiện <10 lần — thống kê quá thưa để học ngữ nghĩa đáng tin cậy. Pre-trained models (GloVe, fastText, PhoBERT) được train trên hàng tỷ token chính vì lý do này.",
  },
  {
    question: "Word embeddings (Word2Vec/GloVe) gán MỘT vector cố định cho mỗi từ. Hạn chế lớn nhất là gì?",
    options: [
      "Chúng quá lớn để lưu",
      "Không xử lý được đa nghĩa (polysemy): 'đá' trong 'đá bóng' và 'hòn đá' chia sẻ CÙNG vector, dù nghĩa khác hẳn",
      "Chỉ hoạt động với tiếng Anh",
      "Mất ngữ nghĩa khi nhân với ma trận",
    ],
    correct: 1,
    explanation: "Vấn đề polysemy là lý do ra đời contextual embeddings (ELMo → BERT → GPT). Trong BERT, 'đá' trong 'đá bóng' có vector KHÁC 'đá' trong 'hòn đá' vì embedding phụ thuộc vào toàn bộ câu. Đây là bước tiến từ Word2Vec → Transformer.",
  },
  {
    type: "fill-blank",
    question: "Khoảng cách {blank} đo góc giữa hai vector (giá trị từ -1 đến 1). Đối với embeddings, giá trị {blank} nghĩa là hai từ có ngữ nghĩa gần nhau.",
    blanks: [
      { answer: "cosine", accept: ["cos", "cosine similarity", "cô-sin"] },
      { answer: "gần 1", accept: ["cao", "lớn", "gần +1", "~1"] },
    ],
    explanation: "Cosine similarity không quan tâm độ dài vector, chỉ đo hướng — phù hợp với embeddings chuẩn hoá. cosine = 1 là cùng hướng (đồng nghĩa), cosine = 0 là vuông góc (không liên quan), cosine = -1 là ngược hướng (trái nghĩa, hiếm gặp).",
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

        <div className="mt-6 space-y-3 text-sm leading-relaxed">
          <p>
            <strong>Liên tưởng 1 — Cách bạn sắp xếp kệ sách:</strong>{" "}
            Khi bạn sắp kệ sách ở nhà, bạn đặt sách cùng chủ đề gần nhau:
            tiểu thuyết gần tiểu thuyết, sách kỹ thuật gần sách kỹ thuật. Bạn
            không cần ai bảo — bạn &quot;cảm&quot; được từ nội dung. Word
            embedding là bản đồ tự sắp xếp như vậy cho từ ngữ: &quot;phở&quot;
            gần &quot;bún chả&quot;, không phải vì ai dán nhãn, mà vì chúng
            cùng xuất hiện trong các ngữ cảnh về ẩm thực.
          </p>
          <p>
            <strong>Liên tưởng 2 — Map định vị Sài Gòn:</strong>{" "}
            Trên bản đồ Sài Gòn, Bến Thành gần phố Tây (Phạm Ngũ Lão), xa quận
            9. Bạn đo khoảng cách bằng km. Trong word embedding, mỗi từ là
            một toạ độ trong không gian 300 chiều. Bạn đo &quot;độ giống
            nghĩa&quot; bằng cosine similarity giữa hai vector.
          </p>
          <p>
            <strong>Liên tưởng 3 — &quot;Vua - đàn ông + phụ nữ =
            hoàng hậu&quot;:</strong>{" "}
            Đây là đẳng thức kinh điển thể hiện word embedding không chỉ là
            &quot;gần/xa&quot; — nó còn biểu diễn được các mối quan hệ trừu
            tượng như &quot;giới tính&quot;, &quot;số ít/số nhiều&quot;,
            &quot;thủ đô-quốc gia&quot;, &quot;nguyên thể-quá khứ&quot;.
            Việc này gần như phép thuật khi công bố (Mikolov, 2013).
          </p>
          <p>
            <strong>Liên tưởng 4 — Tìm kiếm ngữ nghĩa trên Shopee:</strong>{" "}
            Khi bạn gõ &quot;quần jean&quot;, Shopee cũng hiện &quot;quần
            bò&quot;, &quot;quần tây&quot; — dù bạn không gõ. Đằng sau hậu
            trường là embedding: các từ này có vector gần nhau. Đây là một
            trong những ứng dụng công nghiệp sớm nhất của word embedding.
          </p>
        </div>
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

      {/* ── Step 2.5: Interpretation & bias ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Đọc hiểu embedding">
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            <strong>Tại sao việc đo &quot;gần&quot; trong embedding khác với
            khoảng cách Euclid thông thường?</strong>{" "}
            Trong word embedding, độ dài vector phụ thuộc vào tần suất từ
            xuất hiện. Nếu dùng Euclid, từ hiếm sẽ &quot;xa&quot; tất cả vì
            norm nhỏ. Cosine similarity bỏ qua độ dài, chỉ đo hướng — phù
            hợp hơn cho đo độ tương đồng ngữ nghĩa.
          </p>

          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-semibold text-foreground mb-2">
              Bảng ví dụ cosine similarity thực tế (embedding tiếng Việt):
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Cặp từ</th>
                  <th className="text-right py-2">Cosine</th>
                  <th className="text-left py-2 pl-4">Diễn giải</th>
                </tr>
              </thead>
              <tbody className="text-muted">
                <tr className="border-b border-border/50">
                  <td className="py-2">phở — bún chả</td>
                  <td className="text-right py-2 font-mono">0.86</td>
                  <td className="pl-4 py-2">Cùng chủ đề ẩm thực</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">Hà Nội — Sài Gòn</td>
                  <td className="text-right py-2 font-mono">0.79</td>
                  <td className="pl-4 py-2">Đều là thành phố lớn</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">vui — hạnh phúc</td>
                  <td className="text-right py-2 font-mono">0.72</td>
                  <td className="pl-4 py-2">Cảm xúc tích cực</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">phở — máy tính</td>
                  <td className="text-right py-2 font-mono">0.11</td>
                  <td className="pl-4 py-2">Khác chủ đề hoàn toàn</td>
                </tr>
                <tr>
                  <td className="py-2">vui — buồn</td>
                  <td className="text-right py-2 font-mono">0.42</td>
                  <td className="pl-4 py-2">
                    Trái nghĩa nhưng cùng domain cảm xúc &rArr; cosine vừa
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout variant="warning" title="Cạm bẫy: gần không có nghĩa là đồng nghĩa">
            Một điểm thường nhầm: &quot;vui&quot; và &quot;buồn&quot; có
            cosine khá cao (0.42) mặc dù trái nghĩa. Lý do: chúng xuất hiện
            trong cùng ngữ cảnh (câu về cảm xúc). Word embedding chỉ nắm bắt
            <em>similarity of context</em>, không phải <em>semantic
            equivalence</em>. Cần cẩn thận khi dùng cho các task đòi hỏi
            phân biệt đối lập (sentiment, logic).
          </Callout>
        </div>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
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
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
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

        <div className="mt-6">
          <InlineChallenge
            question={`Từ "đá" có thể là động từ ("đá bóng") hoặc danh từ ("hòn đá"). Word2Vec gán MỘT vector duy nhất cho "đá". Điều gì xảy ra?`}
            options={[
              "Vector 'đá' sẽ rất chính xác — tách biệt hai nghĩa hoàn hảo",
              "Vector 'đá' là trung bình của cả hai nghĩa → gần 'bóng' một chút VÀ gần 'hòn' một chút, nhưng không nghĩa nào rõ ràng",
              "Word2Vec sẽ báo lỗi và từ chối huấn luyện",
              "Vector 'đá' bằng 0",
            ]}
            correct={1}
            explanation={`Đây là vấn đề polysemy (đa nghĩa) của embeddings cố định. Vector 'đá' là hỗn hợp của mọi ngữ cảnh mà 'đá' xuất hiện. Giải pháp: BERT và các contextual embeddings gán vector KHÁC NHAU tuỳ theo câu chứa "đá" — đây là lý do NLP hiện đại đã chuyển sang Transformer.`}
          />
        </div>

        <div className="mt-6">
          <InlineChallenge
            question="Bạn xây hệ thống tìm kiếm bán hàng tiếng Việt. User gõ 'áo khoác ấm'. Hệ thống truyền thống (BoW) không tìm được sản phẩm 'jacket mùa đông'. Dùng word embedding giải quyết thế nào?"
            options={[
              "Chuyển chữ hoa thành chữ thường rồi tìm",
              "Embedding biểu diễn 'áo khoác' và 'jacket' làm vector GẦN nhau; 'ấm' và 'mùa đông' cũng gần nhau → semantic search tìm được sản phẩm có nội dung gần ý người dùng",
              "Tăng từ khoá cho database",
              "Dùng regex chính xác",
            ]}
            correct={1}
            explanation="Đây là nền tảng của semantic search hiện đại. Encode truy vấn và sản phẩm thành vector, rồi so cosine. Tiki, Lazada, Shopee đều đã chuyển từ BoW thuần sang retrieval dựa trên embedding (BGE, E5, GTE cho tiếng Anh; pho-w2v, vietnamese-bi-encoder cho tiếng Việt)."
          />
        </div>
      </LessonSection>

      {/* ── Step 5: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Word Embeddings</strong>{" "}
            biểu diễn từ dưới dạng vector số thực trong không gian liên tục (thường 100-300 chiều). Các mô hình kinh điển như{" "}
            <TopicLink slug="word2vec">Word2Vec</TopicLink>{" "}và{" "}
            <TopicLink slug="glove">GloVe</TopicLink>{" "}đã mở đường, và ngày nay các{" "}
            <TopicLink slug="embedding-model">embedding model</TopicLink>{" "}hiện đại học được ngữ nghĩa theo ngữ cảnh.
          </p>

          <Callout variant="insight" title="Tại sao embeddings hoạt động?">
            <p>Dựa trên giả thuyết phân phối (distributional hypothesis):</p>
            <LaTeX block>{`\\text{"Từ ngữ được hiểu qua bạn đồng hành của chúng"}`}</LaTeX>
            <p className="mt-2 text-sm">
              Từ xuất hiện trong ngữ cảnh giống nhau → vector gần nhau. {'"Phở"'} và {'"bún chả"'} đều hay đi cùng {'"ngon"'}, {'"Việt Nam"'}, {'"ăn"'} → nằm gần nhau.
            </p>
          </Callout>

          <Callout variant="info" title="Đo khoảng cách giữa các từ">
            <div className="space-y-2">
              <p>Cosine similarity đo góc giữa 2 vector (từ -1 đến 1):</p>
              <LaTeX block>{`\\text{cosine}(\\mathbf{u}, \\mathbf{v}) = \\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\|\\mathbf{u}\\| \\|\\mathbf{v}\\|}`}</LaTeX>
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

          <CodeBlock language="python" title="Huấn luyện Word2Vec từ corpus tiếng Việt">
{`import gensim
from gensim.models import Word2Vec
from pyvi import ViTokenizer

# 1. Chuẩn bị corpus — list câu, mỗi câu là list từ (đã tokenize)
raw_sentences = [
    "Tôi ăn phở mỗi sáng ở Hà Nội",
    "Bún chả là đặc sản Hà Nội nổi tiếng",
    "Cơm tấm thơm ngon đậm chất Sài Gòn",
    "Grab là ứng dụng xe ôm phổ biến tại Việt Nam",
    # ... cần vài triệu câu để có embedding tốt
]
# Tách từ tiếng Việt (ViTokenizer nối 'Hà_Nội' thành 1 token)
sentences = [ViTokenizer.tokenize(s).split() for s in raw_sentences]

# 2. Huấn luyện Word2Vec (skip-gram)
model = Word2Vec(
    sentences=sentences,
    vector_size=100,      # Số chiều embedding
    window=5,             # Cửa sổ ngữ cảnh
    min_count=2,          # Bỏ qua từ xuất hiện < 2 lần
    sg=1,                 # 1 = skip-gram, 0 = CBOW
    workers=4,
    epochs=10,
)

# 3. Khám phá không gian vector
print(model.wv.most_similar("phở", topn=3))
# [('bún_chả', 0.85), ('cơm_tấm', 0.79), ('bánh_mì', 0.72)]

# 4. Phép toán vector — king-queen trên tiếng Việt
result = model.wv.most_similar(
    positive=["Sài_Gòn", "phở"],
    negative=["Hà_Nội"],
)
print(result[0])  # Gần 'cơm_tấm' — đặc sản Sài Gòn`}
          </CodeBlock>

          <CollapsibleDetail title="Skip-gram vs CBOW (cơ chế huấn luyện Word2Vec)">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Word2Vec (Mikolov, 2013) có hai biến thể huấn luyện với logic
                ngược nhau:
              </p>
              <p>
                <strong>CBOW (Continuous Bag of Words):</strong> dùng ngữ
                cảnh (các từ xung quanh) để dự đoán từ trung tâm. Ví dụ
                từ[&quot;Tôi&quot;, &quot;ăn&quot;, &quot;ở&quot;, &quot;Hà Nội&quot;] → dự đoán{" "}
                <em>&quot;phở&quot;</em>. Nhanh, phù hợp corpus lớn, từ phổ biến.
              </p>
              <p>
                <strong>Skip-gram:</strong> ngược lại — dùng từ trung tâm
                để dự đoán các từ ngữ cảnh. Từ <em>&quot;phở&quot;</em> → dự đoán{" "}
                [&quot;Tôi&quot;, &quot;ăn&quot;, &quot;ở&quot;, &quot;Hà Nội&quot;]. Chậm hơn nhưng tốt hơn cho
                từ hiếm.
              </p>
              <p>
                <strong>Negative sampling:</strong> kỹ thuật tăng tốc —
                thay vì softmax trên toàn bộ vocabulary (triệu từ), chỉ cập
                nhật với vài từ &quot;giả&quot; (negative samples). Giảm chi phí từ
                O(V) xuống O(k) với k = 5-20.
              </p>
              <p className="text-muted">
                Kết quả thực nghiệm: skip-gram + negative sampling thường
                cho embedding tốt nhất cho NLP hiện đại (trước khi
                Transformer thay thế).
              </p>
            </div>
          </CollapsibleDetail>

          <Callout variant="warning" title="Embeddings có bias — cẩn trọng khi triển khai">
            Word embeddings phản ánh bias trong corpus huấn luyện. Ví dụ
            nổi tiếng: <code>vector(&quot;lập trình viên&quot;) − vector(&quot;đàn ông&quot;) +
            vector(&quot;phụ nữ&quot;)</code> có thể cho ra{" "}
            <em>&quot;nội trợ&quot;</em> thay vì &quot;lập trình viên&quot; — vì corpus
            chứa thiên kiến giới. Khi triển khai cho hệ thống tuyển dụng,
            tín dụng, tư pháp, bạn BẮT BUỘC phải kiểm tra và giảm thiểu
            bias (debias techniques).
          </Callout>

          <CollapsibleDetail title="Từ Word2Vec đến sentence embedding & modern embedding model (nâng cao)">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Word embedding chỉ là bước khởi đầu. Trong các hệ thống NLP
                hiện đại, chúng ta thường cần vector cho cả câu hoặc đoạn văn,
                không phải từng từ:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong>Sentence-BERT (SBERT, 2019):</strong>{" "}
                  fine-tune BERT với contrastive loss để vector câu trở nên có
                  ý nghĩa khi đo cosine. Đây là bước nhảy từ word-level sang
                  sentence-level.
                </li>
                <li>
                  <strong>E5, BGE, GTE (2023-2024):</strong>{" "}
                  các embedding model hiện đại train trên hàng tỷ cặp câu
                  (query-passage), tối ưu cho retrieval. Là xương sống của{" "}
                  <TopicLink slug="rag">RAG</TopicLink>.
                </li>
                <li>
                  <strong>Cross-encoder vs Bi-encoder:</strong>{" "}
                  Bi-encoder (như SBERT) encode câu độc lập → nhanh nhưng
                  accuracy thấp hơn. Cross-encoder encode cặp câu cùng lúc →
                  chính xác hơn nhưng chậm. Pattern thực tế: bi-encoder cho
                  retrieval, cross-encoder cho reranking.
                </li>
                <li>
                  <strong>OpenAI text-embedding-3, Cohere Embed v3:</strong>{" "}
                  dịch vụ API cho embedding chất lượng cao, hỗ trợ tiếng
                  Việt. Nhược điểm: chi phí + vendor lock-in.
                </li>
              </ul>
              <p>
                Trong tiếng Việt, các lựa chọn phổ biến cho semantic search:{" "}
                <code>vinai/phobert-base</code> (với mean pooling),{" "}
                <code>bkai-foundation-models/vietnamese-bi-encoder</code>
                (train riêng cho retrieval), hoặc OpenAI API nếu quy mô nhỏ.
              </p>
            </div>
          </CollapsibleDetail>

          <CodeBlock language="python" title="Semantic search tiếng Việt bằng sentence embedding">
{`from sentence_transformers import SentenceTransformer, util
import torch

# Load model tiếng Việt
model = SentenceTransformer(
    "bkai-foundation-models/vietnamese-bi-encoder"
)

# Cơ sở dữ liệu sản phẩm của shop thời trang
products = [
    "Áo khoác dạ nam ấm mùa đông",
    "Giày sneaker thể thao chạy bộ",
    "Quần jean slim nam basic",
    "Áo thun polo cổ trụ nam",
    "Jacket nỉ trơn đi chơi lạnh",
]
prod_emb = model.encode(products, convert_to_tensor=True)

# User gõ truy vấn
query = "áo ấm cho mùa lạnh"
q_emb = model.encode(query, convert_to_tensor=True)

# Tìm top-3 sản phẩm gần nghĩa nhất
scores = util.cos_sim(q_emb, prod_emb)[0]
top3 = torch.topk(scores, 3)
for score, idx in zip(top3.values, top3.indices):
    print(f"{score:.3f} - {products[idx]}")
# 0.872 - Jacket nỉ trơn đi chơi lạnh
# 0.845 - Áo khoác dạ nam ấm mùa đông
# 0.412 - Áo thun polo cổ trụ nam`}
          </CodeBlock>

          <Callout variant="insight" title="Word embedding vẫn chưa chết">
            Mặc dù BERT/GPT đã thay thế Word2Vec cho hầu hết task hiện đại,
            word embedding cổ điển vẫn hữu ích: (1) lightweight — chạy được
            trên CPU cho edge device; (2) giải thích tốt — vẫn là ví dụ số 1
            cho sinh viên học NLP; (3) nền tảng toán học cho các embedding
            hiện đại (cùng dùng cosine, cùng triết lý distributional). Đừng
            nhảy thẳng sang Transformer mà bỏ qua nền móng này.
          </Callout>

          <p>
            <strong>So sánh các thuật toán embedding kinh điển:</strong>
          </p>

          <ul className="list-disc list-inside space-y-2 pl-2 text-sm leading-relaxed">
            <li>
              <strong>Word2Vec (Mikolov, 2013):</strong>{" "}
              predict context từ center word (skip-gram) hoặc ngược lại (CBOW).
              Đơn giản, nhanh, nhưng không tận dụng được thống kê toàn cục.
            </li>
            <li>
              <strong>GloVe (Pennington, 2014):</strong>{" "}
              kết hợp matrix factorization với local context. Thường cho kết
              quả tương đương Word2Vec nhưng hội tụ nhanh hơn trên corpus lớn.
            </li>
            <li>
              <strong>fastText (Bojanowski, 2017):</strong>{" "}
              dùng n-gram ký tự — xử lý được từ hiếm và OOV. Hoạt động tốt
              với các ngôn ngữ có hình thái phong phú (morphology-rich
              languages).
            </li>
            <li>
              <strong>ELMo (Peters, 2018):</strong>{" "}
              lần đầu cung cấp contextual embedding bằng bi-LSTM. Đã giải
              quyết một phần vấn đề polysemy.
            </li>
            <li>
              <strong>BERT (Devlin, 2018):</strong>{" "}
              contextual embedding dùng Transformer — chuẩn vàng cho NLP
              hiện đại.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 5.5: Production usage ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Embedding trong production">
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            <strong>Quy trình chuẩn cho semantic search tiếng Việt:</strong>
          </p>

          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              <strong>Preprocessing:</strong>{" "}
              làm sạch văn bản (bỏ HTML, emoji dư thừa, normalize dấu), chia
              câu dài thành đoạn 200-300 token để tôn trọng giới hạn context
              của embedding model.
            </li>
            <li>
              <strong>Chọn model:</strong>{" "}
              cho tiếng Việt, cân nhắc PhoBERT-based bi-encoder (chạy local,
              free) hay OpenAI API (chất lượng cao, trả phí). Với dataset
              1M+ chunk, cân bằng tốt nhất là model open source chạy trên GPU
              của bạn.
            </li>
            <li>
              <strong>Encode &amp; index:</strong>{" "}
              chạy batch encode, lưu vector vào vector database (Qdrant,
              Milvus, pgvector Supabase). Cần approximate nearest neighbor
              (HNSW) để scale.
            </li>
            <li>
              <strong>Retrieval + rerank:</strong>{" "}
              bi-encoder lấy top-50, sau đó cross-encoder rerank xuống top-5.
              Cross-encoder (như BKAI vietnamese-rerank) cho độ chính xác cao
              hơn.
            </li>
            <li>
              <strong>Monitor drift:</strong>{" "}
              theo dõi phân phối truy vấn theo thời gian. Nếu user bắt đầu
              hỏi về chủ đề mới (ví dụ COVID xuất hiện 2020), bạn có thể cần
              retrain/fine-tune embedding trên dữ liệu mới.
            </li>
          </ol>

          <div className="mt-4 rounded-xl border border-border bg-surface p-4">
            <p className="font-semibold text-foreground mb-2">
              Câu chuyện thực tế: knowledge base CSKH Viettel
            </p>
            <p className="text-muted">
              Giả sử đội CSKH có 50.000 câu hỏi thường gặp về gói cước, dịch
              vụ, khuyến mãi. Cách cũ (BoW + TF-IDF) bắt keyword chính xác
              nhưng hỏng khi user dùng synonym (&quot;5G&quot; vs &quot;mạng
              nhanh&quot;, &quot;gói cước&quot; vs &quot;data&quot;). Sau khi
              chuyển sang bi-encoder tiếng Việt, recall@5 tăng từ 62% lên
              89%, user resolution rate tăng 20%. Đầu tư: 1 tuần kỹ sư và GPU
              T4 giá rẻ.
            </p>
          </div>

          <Callout variant="tip" title="Lời khuyên cho team nhỏ">
            Nếu bạn chỉ có &lt;10K documents và không có GPU, đừng tự host.
            Dùng OpenAI text-embedding-3-small qua API — chi phí rất thấp
            (&lt;$5 cho 1M token), chất lượng cao, không phải quản lý
            infra. Chỉ self-host khi số lượng query/ngày hoặc data
            sensitivity biện minh được thời gian kỹ sư bỏ ra.
          </Callout>
        </div>
      </LessonSection>

      {/* ── Step 6: Comparison ── */}
      <LessonSection step={8} totalSteps={TOTAL_STEPS} label="So sánh phương pháp">
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
      <LessonSection step={9} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Word Embeddings"
          points={[
            "Embeddings biến từ thành vector dense (100-300 chiều) — nắm bắt ngữ nghĩa.",
            "Từ tương tự nằm gần nhau: 'phở' gần 'bún chả', xa 'xe máy'.",
            "Phép tính vector có ý nghĩa: vua - đàn ông + phụ nữ ≈ hoàng hậu.",
            "Cosine similarity đo mức tương đồng giữa hai từ (từ -1 đến 1).",
            "Nền tảng cho mọi mô hình NLP hiện đại: Word2Vec → GloVe → BERT → GPT.",
            "Hạn chế: không xử lý đa nghĩa (polysemy) và thừa kế bias từ corpus — cần debias khi triển khai.",
          ]}
        />
      </LessonSection>

      {/* ── Step 8: Quiz ── */}
      <LessonSection step={10} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={QUIZ} />
      </LessonSection>
    </>
  );
}
