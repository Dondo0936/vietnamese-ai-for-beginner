"use client";

import { useState, useMemo, useCallback } from "react";
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
  slug: "text-classification",
  title: "Text Classification",
  titleVi: "Phân loại văn bản",
  description:
    "Tác vụ gán nhãn danh mục cho văn bản, ứng dụng trong lọc thư rác, phân loại tin tức và phân tích ý kiến.",
  category: "nlp",
  tags: ["nlp", "classification", "supervised-learning"],
  difficulty: "beginner",
  relatedSlugs: ["sentiment-analysis", "bag-of-words", "bert"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

interface ClassifyExample {
  text: string;
  trueLabel: string;
  confidence: number;
  probabilities: { label: string; prob: number; color: string }[];
}

const EXAMPLES: ClassifyExample[] = [
  {
    text: "Quang Hải ghi bàn thắng tuyệt đẹp vào lưới đối phương trong trận chung kết",
    trueLabel: "Thể thao",
    confidence: 0.94,
    probabilities: [
      { label: "Thể thao", prob: 0.94, color: "#3b82f6" },
      { label: "Giải trí", prob: 0.03, color: "#f59e0b" },
      { label: "Kinh tế", prob: 0.02, color: "#22c55e" },
      { label: "Công nghệ", prob: 0.01, color: "#8b5cf6" },
    ],
  },
  {
    text: "VinAI ra mắt mô hình AI mới, cạnh tranh với các hãng công nghệ lớn thế giới",
    trueLabel: "Công nghệ",
    confidence: 0.91,
    probabilities: [
      { label: "Công nghệ", prob: 0.91, color: "#8b5cf6" },
      { label: "Kinh tế", prob: 0.05, color: "#22c55e" },
      { label: "Giải trí", prob: 0.03, color: "#f59e0b" },
      { label: "Thể thao", prob: 0.01, color: "#3b82f6" },
    ],
  },
  {
    text: "Chỉ số VN-Index tăng mạnh, nhà đầu tư kỳ vọng thị trường phục hồi",
    trueLabel: "Kinh tế",
    confidence: 0.96,
    probabilities: [
      { label: "Kinh tế", prob: 0.96, color: "#22c55e" },
      { label: "Công nghệ", prob: 0.02, color: "#8b5cf6" },
      { label: "Thể thao", prob: 0.01, color: "#3b82f6" },
      { label: "Giải trí", prob: 0.01, color: "#f59e0b" },
    ],
  },
  {
    text: "Sơn Tùng MTP phát hành MV mới, đạt triệu view sau 24 giờ",
    trueLabel: "Giải trí",
    confidence: 0.89,
    probabilities: [
      { label: "Giải trí", prob: 0.89, color: "#f59e0b" },
      { label: "Công nghệ", prob: 0.06, color: "#8b5cf6" },
      { label: "Thể thao", prob: 0.03, color: "#3b82f6" },
      { label: "Kinh tế", prob: 0.02, color: "#22c55e" },
    ],
  },
];

const CATEGORIES = [
  { name: "Thể thao", keywords: "bóng đá, giải đấu, ghi bàn", icon: "★", color: "#3b82f6" },
  { name: "Kinh tế", keywords: "chứng khoán, VN-Index, GDP", icon: "◆", color: "#22c55e" },
  { name: "Công nghệ", keywords: "AI, smartphone, phần mềm", icon: "●", color: "#8b5cf6" },
  { name: "Giải trí", keywords: "phim, ca sĩ, MV, concert", icon: "▲", color: "#f59e0b" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Phân loại văn bản khác phân tích cảm xúc ở điểm nào?",
    options: [
      "Không khác nhau",
      "Text classification gán BẤT KỲ nhãn nào (thể thao, kinh tế...), sentiment chỉ gán tích cực/tiêu cực",
      "Sentiment analysis khó hơn",
      "Text classification không dùng deep learning",
    ],
    correct: 1,
    explanation:
      "Sentiment analysis là MỘT DẠNG text classification (nhãn = cảm xúc). Text classification tổng quát hơn: nhãn có thể là chủ đề, ý định, ngôn ngữ, spam/không spam...",
  },
  {
    question: "Email: 'Bạn đã trúng 1 tỷ đồng! Click link để nhận.' Thuộc nhãn nào?",
    options: [
      "Kinh tế",
      "Spam — phân loại spam là ứng dụng kinh điển của text classification",
      "Giải trí",
      "Công nghệ",
    ],
    correct: 1,
    explanation:
      "Lọc spam là ứng dụng ĐẦU TIÊN và phổ biến nhất của text classification. Gmail dùng mô hình phân loại để lọc hàng tỷ email spam mỗi ngày!",
  },
  {
    question: "Phương pháp nào cho kết quả phân loại tốt nhất hiện nay?",
    options: [
      "Bag of Words + Naive Bayes",
      "TF-IDF + SVM",
      "Fine-tuned BERT/PhoBERT — mô hình Transformer pre-trained",
      "Regular expressions",
    ],
    correct: 2,
    explanation:
      "Fine-tuned BERT/PhoBERT đạt SOTA cho hầu hết tác vụ phân loại. Pre-training giúp mô hình hiểu ngữ cảnh, fine-tuning chỉ cần ít dữ liệu labeled!",
  },
];

/* ── Main Component ── */
export default function TextClassificationTopic() {
  const [exampleIdx, setExampleIdx] = useState(0);

  const example = EXAMPLES[exampleIdx];

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Tiêu đề VnExpress: "Quang Hải ghi bàn thắng tuyệt đẹp trong trận chung kết". Thuộc chuyên mục nào?`}
          options={["Kinh tế", "Thể thao", "Giải trí"]}
          correct={1}
          explanation={`Bạn nhận ra "ghi bàn", "trận chung kết" → Thể thao! Não bạn phân loại bằng cách tìm từ khóa đặc trưng. Máy tính làm tương tự: Text Classification đọc văn bản và gán nhãn danh mục tự động.`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Classifier ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Nhấn vào từng bài tin tức bên dưới để xem mô hình phân loại. Biểu đồ xác suất cho thấy mô hình {'"tự tin"'} đến mức nào với mỗi nhãn.
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Example selector */}
            <div className="space-y-2">
              {EXAMPLES.map((ex, i) => (
                <button key={i} type="button" onClick={() => setExampleIdx(i)}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    exampleIdx === i ? "ring-2 ring-accent border-accent" : "border-border hover:border-accent/50"
                  }`}>
                  <p className="text-sm text-foreground">{ex.text}</p>
                </button>
              ))}
            </div>

            {/* Classification result */}
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Kết quả phân loại</p>
                <span className="text-sm font-bold text-accent">{example.trueLabel}</span>
              </div>

              {/* Probability bars */}
              {example.probabilities.map((p) => (
                <div key={p.label} className="flex items-center gap-3">
                  <span className="w-20 text-right text-xs font-medium text-foreground">{p.label}</span>
                  <div className="flex-1 h-5 rounded-full bg-surface overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: p.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${p.prob * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-bold" style={{ color: p.color }}>
                    {(p.prob * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((cat) => (
                <div key={cat.name} className="rounded-lg border p-3 text-center space-y-1"
                  style={{ borderColor: cat.color + "40" }}>
                  <p className="text-lg" style={{ color: cat.color }}>{cat.icon}</p>
                  <p className="text-xs font-semibold" style={{ color: cat.color }}>{cat.name}</p>
                  <p className="text-[10px] text-muted">{cat.keywords}</p>
                </div>
              ))}
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Text Classification</strong>{" "}
            gán nhãn cho văn bản: chủ đề tin tức, spam/không spam, ý định người dùng... Đây là t��c vụ NLP cơ bản nhất và ứng dụng rộng rãi nhất!
          </p>
          <p className="text-sm text-muted mt-1">
            Giống nhân viên bưu điện phân loại thư: đọc nội dung → bỏ vào ngăn đúng. Gmail phân loại hàng tỷ email, VnExpress tự gán chuyên mục cho bài viết.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: InlineChallenge ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Chatbot Shopee nhận tin nhắn: 'Tôi muốn đổi trả sản phẩm bị lỗi'. Phân loại ý định (intent) là gì?"
          options={[
            "Hỏi thông tin sản phẩm",
            "Yêu cầu đổi trả (return request) — intent classification ứng dụng trong chatbot",
            "Khiếu nại",
          ]}
          correct={1}
          explanation="Intent classification = phân loại ý định: 'đổi trả sản phẩm bị lỗi' → intent = return_request. Chatbot tự động chuyển đến bộ phận đổi trả! Đây là ứng dụng text classification trong customer service."
        />
      </LessonSection>

      {/* ── Step 5: Pipeline ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Pipeline phân loại">
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            Pipeline phân loại văn bản từ đơn giản → phức tạp:
          </p>
          {[
            { step: "1. Thu thập dữ liệu", desc: "Review Shopee, tin VnExpress, email... + nhãn", icon: "1", color: "#3b82f6" },
            { step: "2. Tiền xử lý", desc: "Tách từ, loại stopword, chuẩn hóa", icon: "2", color: "#8b5cf6" },
            { step: "3. Trích đặc trưng", desc: "BoW → TF-IDF → BERT embeddings", icon: "3", color: "#ec4899" },
            { step: "4. Huấn luyện", desc: "Naive Bayes → SVM → Fine-tune BERT", icon: "4", color: "#f59e0b" },
            { step: "5. Dự đoán", desc: "Input → Mô hình → Nhãn + xác suất", icon: "5", color: "#22c55e" },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: item.color }}>
                {item.icon}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: item.color }}>{item.step}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Text Classification</strong>{" "}
            là tác vụ gán nhãn danh mục cho văn bản — cơ bản nhất và ứng dụng rộng nhất trong NLP.
          </p>

          <Callout variant="insight" title="Softmax — đầu ra phân loại">
            <p>Mô hình tính xác suất cho mỗi nhãn bằng softmax:</p>
            <LaTeX display>{`P(y = k | x) = \\frac{\\exp(\\mathbf{w}_k^{\\top} \\mathbf{h} + b_k)}{\\sum_{j=1}^{K} \\exp(\\mathbf{w}_j^{\\top} \\mathbf{h} + b_j)}`}</LaTeX>
            <p className="mt-2 text-sm">
              Với <LaTeX>{`\\mathbf{h}`}</LaTeX>{" "}
              = biểu diễn văn b��n (từ BERT/BoW), K = số nhãn. Chọn nhãn có xác suất cao nhất.
            </p>
          </Callout>

          <Callout variant="info" title="Các dạng phân loại">
            <div className="space-y-2">
              <p><strong>Nhị phân (Binary):</strong>{" "}Spam / Không spam, Toxic / Safe</p>
              <p><strong>Đa lớp (Multi-class):</strong>{" "}Thể thao / Kinh tế / Công nghệ / Giải trí</p>
              <p><strong>Đa nhãn (Multi-label):</strong>{" "}Bài viết vừa Thể thao VÀ Kinh tế (chuyển nhượng cầu thủ)</p>
              <p><strong>Intent (ý định):</strong>{" "}Chatbot: đặt hàng / hỏi info / khiếu nại / chào hỏi</p>
            </div>
          </Callout>

          <CodeBlock language="python" title="text_classification.py">
{`from transformers import pipeline

# Phân loại tin tức tiếng Việt
classifier = pipeline(
    "zero-shot-classification",
    model="joeddav/xlm-roberta-large-xnli"
)

text = "Quang Hải ghi bàn tuyệt đẹp trong trận chung kết"
labels = ["Thể thao", "Kinh tế", "Công nghệ", "Giải trí"]

result = classifier(text, labels)
for label, score in zip(result["labels"], result["scores"]):
    print(f"  {label:>10}: {score:.2%}")
# Thể thao: 94.2%
# Giải trí:  3.1%
# Kinh tế:   1.8%
# Công nghệ:  0.9%

# Fine-tune PhoBERT cho phân loại tiếng Việt
# → Độ chính xác > 95% trên dữ liệu VnExpress`}
          </CodeBlock>

          <Callout variant="tip" title="Zero-shot Classification">
            <p>
              Mô hình lớn (XLM-RoBERTa, GPT) có thể phân loại mà KHÔNG cần dữ li���u huấn luyện cho nhãn cụ thể! Chỉ cần mô tả nhãn bằng ngôn ngữ tự nhiên. Hữu ích khi nhãn mới xuất hiện liên tục.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Text Classification"
          points={[
            "Text Classification = gán nhãn cho văn bản: chủ đề, spam, ý định, cảm xúc...",
            "Nhị phân (2 nhãn), đa lớp (nhiều nhãn chọn 1), đa nhãn (nhiều nhãn chọn nhiều).",
            "Pipeline: tiền xử lý → trích đặc trưng (BoW/TF-IDF/BERT) → mô hình → softmax.",
            "Fine-tuned BERT/PhoBERT đạt SOTA. Zero-shot classification không cần dữ liệu labeled.",
            "Ứng dụng: lọc spam Gmail, phân loại tin VnExpress, intent chatbot Shopee.",
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
