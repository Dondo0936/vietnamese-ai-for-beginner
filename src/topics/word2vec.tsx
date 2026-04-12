"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, ToggleCompare, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "word2vec",
  title: "Word2Vec",
  titleVi: "Word2Vec - Từ thành vector",
  description:
    "Mô hình học biểu diễn từ bằng cách dự đoán từ dựa trên ngữ cảnh xung quanh, sử dụng cửa sổ trượt.",
  category: "nlp",
  tags: ["nlp", "representation-learning", "embedding"],
  difficulty: "intermediate",
  relatedSlugs: ["word-embeddings", "glove", "tokenization"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const SENTENCE = ["Tôi", "thích", "ăn", "phở", "Hà", "Nội", "vào", "buổi", "sáng"];
const SENTENCE_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#ef4444", "#f59e0b", "#f59e0b", "#06b6d4", "#ec4899", "#ec4899"];

const QUIZ: QuizQuestion[] = [
  {
    question: "Skip-gram và CBOW khác nhau ở điểm nào?",
    options: [
      "Skip-gram nhanh hơn CBOW",
      "Skip-gram dự đoán ngữ cảnh từ từ trung tâm, CBOW dự đoán từ trung tâm từ ngữ cảnh",
      "Skip-gram chỉ dùng cho tiếng Anh",
      "CBOW dùng Transformer, Skip-gram dùng RNN",
    ],
    correct: 1,
    explanation:
      "Skip-gram: cho từ 'phở' → đoán 'ăn', 'Hà', 'Nội'. CBOW: cho 'ăn', 'Hà', 'Nội' → đoán 'phở'. Ngược nhau!",
  },
  {
    question: "Tăng kích thước cửa sổ (window size) từ 2 lên 10 sẽ ảnh hưởng thế nào?",
    options: [
      "Mô hình chạy nhanh hơn",
      "Nắm bắt quan hệ ngữ nghĩa xa hơn (đồng nghĩa), nhưng mất chi tiết cú pháp",
      "Không ảnh hưởng gì",
      "Giảm chất lượng embeddings",
    ],
    correct: 1,
    explanation:
      "Cửa sổ nhỏ (2-3) nắm bắt cú pháp (danh từ-động từ). Cửa sổ lớn (5-10) nắm bắt ngữ nghĩa (đồng nghĩa, cùng chủ đề).",
  },
  {
    question: "Tại sao Word2Vec dùng Negative Sampling thay vì tính softmax đầy đủ?",
    options: [
      "Vì softmax chính xác hơn",
      "Vì softmax trên từ vựng lớn (hàng triệu từ) quá chậm — Negative Sampling chỉ cần vài từ âm tính",
      "Vì Negative Sampling cho embeddings tốt hơn",
      "Vì Word2Vec không dùng neural network",
    ],
    correct: 1,
    explanation:
      "Softmax cần tính xác suất cho TẤT CẢ từ trong từ vựng (O(V) rất lớn). Negative Sampling chỉ cần phân biệt từ đúng với k từ ngẫu nhiên → nhanh hơn rất nhiều!",
  },
  {
    type: "fill-blank",
    question: "Word2Vec có hai kiến trúc chính: {blank} dự đoán từ trung tâm dựa vào các từ ngữ cảnh xung quanh, còn {blank} làm ngược lại — dự đoán ngữ cảnh từ một từ trung tâm cho trước.",
    blanks: [
      { answer: "CBOW", accept: ["cbow", "Continuous Bag of Words"] },
      { answer: "Skip-gram", accept: ["skip-gram", "skipgram", "Skip Gram"] },
    ],
    explanation: "CBOW (Continuous Bag of Words) nhận nhiều từ ngữ cảnh và dự đoán 1 từ trung tâm — nhanh, phù hợp tập lớn. Skip-gram nhận 1 từ trung tâm và dự đoán nhiều từ ngữ cảnh — chậm hơn nhưng tốt với từ hiếm và tập nhỏ.",
  },
];

/* ── Main Component ── */
export default function Word2VecTopic() {
  const [centerIdx, setCenterIdx] = useState(3); // "phở"
  const [windowSize, setWindowSize] = useState(2);

  const contextStart = Math.max(0, centerIdx - windowSize);
  const contextEnd = Math.min(SENTENCE.length - 1, centerIdx + windowSize);

  const contextWords = useMemo(() => {
    const words: string[] = [];
    for (let i = contextStart; i <= contextEnd; i++) {
      if (i !== centerIdx) words.push(SENTENCE[i]);
    }
    return words;
  }, [centerIdx, windowSize, contextStart, contextEnd]);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Câu "Tôi thích ăn ___ Hà Nội vào buổi sáng". Dựa vào các từ xung quanh, từ nào điền vào chỗ trống?`}
          options={['"xe máy"', '"phở"', '"toán"']}
          correct={1}
          explanation={`Bạn vừa dùng các từ xung quanh ("ăn", "Hà Nội", "buổi sáng") để đoán từ ở giữa! Word2Vec học chính xác theo cách này — nó hiểu nghĩa từ bằng cách nhìn "hàng xóm" của từ đó.`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Window ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Word2Vec dùng cửa sổ trượt (sliding window) để xác định {'"hàng xóm"'} của mỗi từ. Nhấn vào từ bất kỳ và kéo thanh trượt để thay đổi kích thước cửa sổ!
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted">
                Kích thước cửa sổ: <span className="text-accent font-bold">{windowSize}</span> từ mỗi bên
              </label>
              <input
                type="range" min="1" max="4" step="1" value={windowSize}
                onChange={(e) => setWindowSize(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            {/* Word display */}
            <div className="flex flex-wrap gap-2 justify-center">
              {SENTENCE.map((word, i) => {
                const isCenter = i === centerIdx;
                const isContext = i >= contextStart && i <= contextEnd && !isCenter;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCenterIdx(i)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                      isCenter
                        ? "bg-red-500 text-white ring-2 ring-red-300 scale-110"
                        : isContext
                        ? "bg-blue-500 text-white ring-2 ring-blue-300"
                        : "bg-card border border-border text-muted"
                    }`}
                  >
                    {word}
                    {isCenter && <span className="block text-[10px] opacity-80">trung tâm</span>}
                    {isContext && <span className="block text-[10px] opacity-80">ngữ cảnh</span>}
                  </button>
                );
              })}
            </div>

            {/* Skip-gram vs CBOW */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Skip-gram</p>
                <p className="text-sm text-foreground">
                  Cho <strong className="text-red-500">{SENTENCE[centerIdx]}</strong> → dự đoán:{" "}
                  {contextWords.map((w, i) => (
                    <span key={i}>
                      <strong className="text-blue-500">{w}</strong>
                      {i < contextWords.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
                <p className="text-xs text-muted">Từ trung tâm → dự đoán ngữ cảnh</p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">CBOW</p>
                <p className="text-sm text-foreground">
                  Cho{" "}
                  {contextWords.map((w, i) => (
                    <span key={i}>
                      <strong className="text-blue-500">{w}</strong>
                      {i < contextWords.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  {" "}→ dự đoán:{" "}
                  <strong className="text-red-500">{SENTENCE[centerIdx]}</strong>
                </p>
                <p className="text-xs text-muted">Ngữ cảnh → dự đoán từ trung tâm</p>
              </div>
            </div>

            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                Cửa sổ = <strong className="text-accent">{windowSize}</strong>: nhìn {windowSize} từ mỗi bên.{" "}
                {windowSize <= 2 ? "Cửa sổ nhỏ → nắm bắt cú pháp." : "Cửa sổ lớn → nắm bắt ngữ nghĩa."}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Word2Vec</strong>{" "}
            học nghĩa từ bằng cách dự đoán {'"hàng xóm"'} — giống câu nói {'"Hãy cho tôi biết bạn chơi với ai, tôi sẽ nói bạn là ai"'}!
          </p>
          <p className="text-sm text-muted mt-1">
            Skip-gram: cho 1 từ, đoán ngữ cảnh. CBOW: cho ngữ cảnh, đoán 1 từ. Cả hai đều tạo ra word embeddings chất lượng — chỉ khác hướng dự đoán.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Từ 'phở' và 'bún chả' có vector gần nhau vì Word2Vec thấy chúng xuất hiện với ngữ cảnh giống nhau. Nhưng 'phở' và 'pizza' thì sao?"
          options={[
            "Rất xa nhau — vì khác ngôn ngữ",
            "Gần nhau vừa phải — vì đều là MÓN ĂN, dù khác nhau",
            "Giống hệt — vì đều là đồ ăn",
          ]}
          correct={1}
          explanation="'Phở' và 'pizza' đều xuất hiện cùng 'ăn', 'ngon', 'nhà hàng' → gần nhau ở chiều 'ẩm thực'. Nhưng khác nhau ở chiều 'văn hóa' (Việt vs Ý). Embeddings nắm bắt CẢ HAI khía cạnh!"
        />
      </LessonSection>

      {/* ── Step 5: Skip-gram vs CBOW Deep Dive ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="So sánh kiến trúc">
        <ToggleCompare
          labelA="Skip-gram"
          labelB="CBOW"
          description="Hai kiến trúc của Word2Vec — cùng mục tiêu (tạo embeddings), khác cách huấn luyện."
          childA={
            <div className="space-y-3 p-3">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="rounded-lg bg-red-500 text-white px-3 py-1.5 font-bold">phở</span>
                <span className="text-muted">→</span>
                <div className="rounded-lg bg-surface border border-border p-2">
                  <p className="text-xs text-muted">Neural Network</p>
                </div>
                <span className="text-muted">→</span>
                <div className="space-y-1">
                  <span className="block rounded bg-blue-500 text-white px-2 py-0.5 text-xs font-bold">ăn</span>
                  <span className="block rounded bg-blue-500 text-white px-2 py-0.5 text-xs font-bold">Hà</span>
                  <span className="block rounded bg-blue-500 text-white px-2 py-0.5 text-xs font-bold">Nội</span>
                </div>
              </div>
              <p className="text-xs text-muted text-center">Tốt với từ hiếm. Tập dữ liệu nhỏ → chọn Skip-gram.</p>
            </div>
          }
          childB={
            <div className="space-y-3 p-3">
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className="space-y-1">
                  <span className="block rounded bg-blue-500 text-white px-2 py-0.5 text-xs font-bold">ăn</span>
                  <span className="block rounded bg-blue-500 text-white px-2 py-0.5 text-xs font-bold">Hà</span>
                  <span className="block rounded bg-blue-500 text-white px-2 py-0.5 text-xs font-bold">Nội</span>
                </div>
                <span className="text-muted">→</span>
                <div className="rounded-lg bg-surface border border-border p-2">
                  <p className="text-xs text-muted">Neural Network</p>
                </div>
                <span className="text-muted">→</span>
                <span className="rounded-lg bg-red-500 text-white px-3 py-1.5 font-bold">phở</span>
              </div>
              <p className="text-xs text-muted text-center">Nhanh hơn. Tập dữ liệu lớn → chọn CBOW.</p>
            </div>
          }
        />
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Word2Vec</strong>{" "}
            (Mikolov et al., Google 2013) là mô hình neural network nông (shallow) học{" "}
            <TopicLink slug="word-embeddings">word embeddings</TopicLink>{" "}từ dữ liệu văn bản lớn, là đối thủ trực tiếp với{" "}
            <TopicLink slug="glove">GloVe</TopicLink>{" "}ở cùng thế hệ.
          </p>

          <Callout variant="insight" title="Mục tiêu huấn luyện">
            <div className="space-y-3">
              <p className="font-medium">Skip-gram tối đa hóa xác suất ngữ cảnh cho trước từ trung tâm:</p>
              <LaTeX block>{`\\max \\frac{1}{T} \\sum_{t=1}^{T} \\sum_{-c \\leq j \\leq c, j \\neq 0} \\log P(w_{t+j} | w_t)`}</LaTeX>
              <p className="text-sm">
                Với T = tổng số từ, c = kích thước cửa sổ. Xác suất tính bằng softmax:
              </p>
              <LaTeX block>{`P(w_O | w_I) = \\frac{\\exp(\\mathbf{v'}_{w_O}^{\\top} \\mathbf{v}_{w_I})}{\\sum_{w=1}^{V} \\exp(\\mathbf{v'}_w^{\\top} \\mathbf{v}_{w_I})}`}</LaTeX>
            </div>
          </Callout>

          <Callout variant="info" title="Negative Sampling — mẹo tăng tốc">
            <p>
              Tính softmax trên cả từ vựng V (hàng triệu từ) quá chậm. Negative Sampling chỉ cần phân biệt từ đúng với k từ {'"nhiễu"'} ngẫu nhiên:
            </p>
            <LaTeX block>{`\\log \\sigma(\\mathbf{v'}_{w_O}^{\\top} \\mathbf{v}_{w_I}) + \\sum_{i=1}^{k} \\mathbb{E}_{w_i \\sim P_n(w)} \\left[ \\log \\sigma(-\\mathbf{v'}_{w_i}^{\\top} \\mathbf{v}_{w_I}) \\right]`}</LaTeX>
            <p className="mt-2 text-sm">
              Thường k = 5-20 cho tập nhỏ, k = 2-5 cho tập lớn. Nhanh hơn softmax đầy đủ hàng trăm lần!
            </p>
          </Callout>

          <CodeBlock language="python" title="word2vec_demo.py">
{`from gensim.models import Word2Vec

# Dữ liệu tiếng Việt
sentences = [
    ["tôi", "thích", "ăn", "phở", "Hà", "Nội"],
    ["phở", "bò", "rất", "ngon"],
    ["bún", "chả", "là", "món", "ăn", "Hà", "Nội"],
    ["tôi", "thích", "ăn", "bún", "chả"],
    ["Grab", "là", "ứng", "dụng", "gọi", "xe", "máy"],
]

# Huấn luyện Word2Vec Skip-gram
model = Word2Vec(
    sentences,
    vector_size=100,  # Số chiều embedding
    window=3,         # Cửa sổ ngữ cảnh
    min_count=1,      # Tần suất tối thiểu
    sg=1,             # 1 = Skip-gram, 0 = CBOW
    epochs=100,
)

# Tìm từ tương tự
print(model.wv.most_similar("phở", topn=3))
# [('bún', 0.92), ('ngon', 0.85), ('ăn', 0.83)]

# Vector của từ
print(f"Vector 'phở': {model.wv['phở'][:5]}...")
# Vector 'phở': [0.12, -0.34, 0.56, 0.01, -0.78]...`}
          </CodeBlock>

          <Callout variant="tip" title="Word2Vec cho tiếng Việt">
            <p>
              Tiếng Việt cần tách từ trước khi huấn luyện Word2Vec (vì {'"Việt Nam"'} = 1 từ, không phải 2). Dùng <strong>VnCoreNLP</strong>{" "}
              hoặc <strong>underthesea</strong>{" "}
              để tách từ. Pre-trained vectors tiếng Việt có sẵn tại github.com/vietnlp.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Word2Vec"
          points={[
            "Word2Vec học embeddings bằng cách dự đoán từ dựa trên ngữ cảnh (cửa sổ trượt).",
            "Skip-gram: từ trung tâm → đoán ngữ cảnh. CBOW: ngữ cảnh → đoán từ trung tâm.",
            "Cửa sổ nhỏ (2-3) → cú pháp. Cửa sổ lớn (5-10) → ngữ nghĩa.",
            "Negative Sampling thay thế softmax đầy đủ → huấn luyện nhanh hơn hàng trăm lần.",
            "Tạo ra embeddings chất lượng: vua - đàn ông + phụ nữ ≈ hoàng hậu.",
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
