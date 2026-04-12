"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, TopicLink,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "sentiment-analysis",
  title: "Sentiment Analysis",
  titleVi: "Phân tích cảm xúc văn bản",
  description:
    "Tác vụ xác định cảm xúc (tích cực, tiêu cực, trung tính) được thể hiện trong văn bản.",
  category: "nlp",
  tags: ["nlp", "classification", "opinion-mining"],
  difficulty: "beginner",
  relatedSlugs: ["text-classification", "bert", "bag-of-words"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const SHOPEE_REVIEWS = [
  { text: "Sản phẩm rất tốt, giao hàng nhanh, đóng gói cẩn thận!", label: "positive", stars: 5 },
  { text: "Hàng đúng mô tả, chất lượng ổn so với giá tiền", label: "neutral", stars: 3 },
  { text: "Giao hàng chậm, sản phẩm bị lỗi, không hài lòng", label: "negative", stars: 1 },
  { text: "Phở này ngon tuyệt vời, sẽ mua lại lần nữa!", label: "positive", stars: 5 },
  { text: "Không đáng tiền, chất lượng kém, bán hàng gian dối", label: "negative", stars: 1 },
];

const POSITIVE_WORDS = ["tốt", "ngon", "nhanh", "cẩn thận", "tuyệt", "vời", "hài lòng", "đúng", "ổn"];
const NEGATIVE_WORDS = ["chậm", "lỗi", "kém", "gian", "dối", "không"];

const COLORS = { positive: "#22c55e", negative: "#ef4444", neutral: "#f59e0b" };
const LABELS: Record<string, string> = { positive: "Tích cực", negative: "Tiêu cực", neutral: "Trung tính" };

const QUIZ: QuizQuestion[] = [
  {
    question: `"Sản phẩm không tệ lắm" — cảm xúc là gì?`,
    options: [
      "Tiêu cực — vì có từ 'tệ'",
      "Tích cực nhẹ — 'không tệ' = phủ định của tiêu cực = tích cực",
      "Trung tính",
      "Không xác định được",
    ],
    correct: 1,
    explanation:
      "Đây là phủ định của tiêu cực (negation): 'không' + 'tệ' = 'ổn'. Lexicon-based sẽ sai (đếm 'không' + 'tệ' = tiêu cực), nhưng BERT hiểu ngữ cảnh → phân tích đúng!",
  },
  {
    question: "Aspect-based Sentiment Analysis khác gì phân tích cảm xúc thường?",
    options: [
      "Nhanh hơn",
      "Phân tích cảm xúc cho TỪNG KHÍA CẠNH riêng biệt (đồ ăn, dịch vụ, giá cả...)",
      "Chỉ phân loại nhị phân",
      "Không dùng deep learning",
    ],
    correct: 1,
    explanation:
      "'Đồ ăn ngon nhưng phục vụ chậm' → Ẩm thực: TÍCH CỰC, Dịch vụ: TIÊU CỰC. Aspect-based phân tích từng khía cạnh riêng — hữu ích cho quản lý nhà hàng, e-commerce!",
  },
  {
    question: "Review trên Shopee: 'Haha shop này bán hàng giả chất lượng cao quá' — mỉa mai (sarcasm). Phương pháp nào xử lý tốt?",
    options: [
      "Đếm từ tích cực/tiêu cực (lexicon)",
      "Deep learning (BERT/PhoBERT) vì hiểu ngữ cảnh và mỉa mai",
      "TF-IDF + SVM",
      "Bag of Words",
    ],
    correct: 1,
    explanation:
      "Mỉa mai rất khó cho lexicon (thấy 'chất lượng cao' = tích cực). BERT hiểu ngữ cảnh: 'hàng giả' + 'chất lượng cao' = mỉa mai → tiêu cực. Vẫn là thách thức lớn!",
  },
  {
    type: "fill-blank",
    question: "Phân tích cảm xúc cơ bản gán văn bản vào ba nhãn chính: {blank}, {blank} và trung tính.",
    blanks: [
      { answer: "tích cực", accept: ["positive", "tich cuc"] },
      { answer: "tiêu cực", accept: ["negative", "tieu cuc"] },
    ],
    explanation: "Phân loại 3 lớp: tích cực (positive) / tiêu cực (negative) / trung tính (neutral). Mô hình phức tạp hơn có thể phân loại nhiều mức (5 sao Shopee) hoặc phân tích cảm xúc theo khía cạnh (aspect-based: đồ ăn ngon nhưng phục vụ chậm).",
  },
];

/* ── Main Component ── */
export default function SentimentAnalysisTopic() {
  const [text, setText] = useState("Phở Hà Nội rất ngon, dịch vụ tuyệt vời!");
  const [reviewIdx, setReviewIdx] = useState(0);

  const analysis = useMemo(() => {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);
    let pos = 0;
    let neg = 0;
    const highlights: { word: string; type: "pos" | "neg" | "none" }[] = [];

    for (const w of words) {
      const isPos = POSITIVE_WORDS.some((pw) => w.includes(pw));
      const isNeg = NEGATIVE_WORDS.some((nw) => w.includes(nw));
      if (isPos) { pos++; highlights.push({ word: w, type: "pos" }); }
      else if (isNeg) { neg++; highlights.push({ word: w, type: "neg" }); }
      else { highlights.push({ word: w, type: "none" }); }
    }

    const total = pos + neg || 1;
    const score = (pos - neg) / total;
    const sentiment = score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral";
    return { pos, neg, score, sentiment, highlights };
  }, [text]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Review Shopee: "Giao hàng nhanh, sản phẩm tốt nhưng đóng gói hơi sơ sài". Cảm xúc tổng thể?`}
          options={["Hoàn toàn tích cực", "Tích cực pha lẫn tiêu cực (mixed)", "Hoàn toàn tiêu cực"]}
          correct={1}
          explanation={`"Giao hàng nhanh, sản phẩm tốt" = tích cực, "đóng gói hơi sơ sài" = tiêu cực nhẹ. Tổng thể: MIXED! Phân tích cảm xúc phải xử lý cả trường hợp phức tạp thế này — không chỉ đếm từ tích cực/tiêu cực.`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Analyzer ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Nhập review tiếng Việt bên dưới — thuật toán sẽ {'"đọc vị"'} cảm xúc bằng cách đếm từ tích cực/tiêu cực (phương pháp lexicon đơn giản).
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            <textarea
              value={text}
              onChange={handleTextChange}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none resize-none"
              placeholder="Nhập review tiếng Việt..."
            />

            {/* Highlighted words */}
            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-sm leading-relaxed">
                {analysis.highlights.map((h, i) => (
                  <span key={i} className={`${
                    h.type === "pos" ? "text-green-500 font-bold underline" :
                    h.type === "neg" ? "text-red-500 font-bold underline" :
                    "text-foreground"
                  }`}>
                    {h.word}{" "}
                  </span>
                ))}
              </p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-green-500">Tích cực: {analysis.pos}</span>
                <span className="text-red-500">Tiêu cực: {analysis.neg}</span>
              </div>
            </div>

            {/* Sentiment meter */}
            <div className="space-y-2">
              <div className="h-6 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
                <motion.div
                  className="absolute top-0 w-4 h-6 rounded-full bg-white border-2 border-gray-800"
                  animate={{ left: `${(analysis.score + 1) / 2 * 100}%` }}
                  transition={{ duration: 0.5, type: "spring" }}
                  style={{ transform: "translateX(-50%)" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Tiêu cực</span>
                <span>Trung tính</span>
                <span>Tích cực</span>
              </div>
            </div>

            {/* Result */}
            <div className="rounded-xl border-2 p-4 text-center"
              style={{ borderColor: COLORS[analysis.sentiment as keyof typeof COLORS], backgroundColor: COLORS[analysis.sentiment as keyof typeof COLORS] + "10" }}>
              <p className="text-lg font-bold" style={{ color: COLORS[analysis.sentiment as keyof typeof COLORS] }}>
                {LABELS[analysis.sentiment]}
              </p>
              <p className="text-sm text-muted">
                Điểm: {analysis.score.toFixed(2)} (từ -1.0 đến +1.0)
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Phân tích cảm xúc</strong>{" "}
            tự động xác định thái độ trong văn bản. Phương pháp đơn giản đếm từ tích cực/tiêu cực, nhưng mô hình hiện đại (BERT) hiểu ngữ cảnh, phủ định, và cả mỉa mai!
          </p>
          <p className="text-sm text-muted mt-1">
            Giống cách bạn đọc review Shopee: liếc qua là biết khách hài lòng hay không. Máy tính làm điều này cho hàng triệu review mỗi ngày!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: Shopee Reviews ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ví dụ thực tế">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Xem 5 review Shopee mẫu — mỗi review được phân loại tự động. Nhấn vào review để xem chi tiết.
        </p>

        <VisualizationSection>
          <div className="space-y-3">
            {SHOPEE_REVIEWS.map((review, i) => (
              <button key={i} type="button" onClick={() => setReviewIdx(i)}
                className={`w-full text-left rounded-lg border p-3 transition-all ${
                  reviewIdx === i ? "ring-2 ring-accent" : ""
                }`}
                style={{ borderColor: COLORS[review.label as keyof typeof COLORS] + "40" }}>
                <div className="flex items-start gap-3">
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <span key={s} className={`text-xs ${s < review.stars ? "text-yellow-500" : "text-surface"}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-foreground flex-1">{review.text}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ color: COLORS[review.label as keyof typeof COLORS], backgroundColor: COLORS[review.label as keyof typeof COLORS] + "15" }}>
                    {LABELS[review.label]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 5: InlineChallenge ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question={`Review: "Phở không ngon lắm" — phương pháp đếm từ (lexicon) sẽ phân loại thế nào?`}
          options={[
            "Tiêu cực — đúng, vì 'không ngon'",
            "Tích cực sai — vì lexicon thấy 'ngon' (tích cực) mà bỏ qua 'không'",
            "Trung tính",
          ]}
          correct={1}
          explanation={`Lexicon đếm từ riêng lẻ: "ngon" = tích cực → kết luận sai! Không hiểu "không ngon" = phủ định. Đây là lý do cần BERT — hiểu ngữ cảnh, phủ định, và mỉa mai.`}
        />
      </LessonSection>

      {/* ── Step 6: Explanation ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Sentiment Analysis</strong>{" "}
            xác định thái độ, ý kiến trong văn bản — là một dạng chuyên biệt của <TopicLink slug="text-classification">text classification</TopicLink>. Từ đếm từ đơn giản đến deep learning hiểu ngữ cảnh phức tạp.
          </p>

          <Callout variant="insight" title="Ba cấp độ phân tích">
            <div className="space-y-2">
              <p>
                <strong>1. Document-level:</strong>{" "}
                Cảm xúc toàn bộ review → 1-5 sao
              </p>
              <p>
                <strong>2. Sentence-level:</strong>{" "}
                Cảm xúc từng câu → {'"Đồ ăn ngon"'} (tích cực) + {'"phục vụ chậm"'} (tiêu cực)
              </p>
              <p>
                <strong>3. Aspect-based:</strong>{" "}
                Cảm xúc cho từng khía cạnh → Ẩm thực: ★★★★★, Dịch vụ: ★★☆☆☆
              </p>
            </div>
          </Callout>

          <Callout variant="info" title="Phương pháp từ đơn giản → phức tạp">
            <div className="space-y-2">
              <p>
                <strong>Lexicon-based:</strong>{" "}
                Đếm từ tích cực/tiêu cực. Nhanh, đơn giản, nhưng không hiểu ngữ cảnh.
              </p>
              <p>
                <strong>ML truyền thống:</strong>{" "}
                BoW/TF-IDF + SVM/Naive Bayes. Tốt hơn lexicon.
              </p>
              <p>
                <strong>Deep Learning:</strong>{" "}
                <TopicLink slug="bert">BERT</TopicLink>/PhoBERT fine-tuned. Hiểu ngữ cảnh, phủ định, mỉa mai → SOTA.
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="sentiment_shopee.py">
{`from transformers import pipeline

# Phân tích cảm xúc tiếng Việt
classifier = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-xlm-roberta-base-sentiment"
)

# Review Shopee
reviews = [
    "Sản phẩm rất tốt, giao hàng nhanh!",
    "Hàng đúng mô tả, chất lượng ổn",
    "Giao hàng chậm, sản phẩm bị lỗi",
    "Phở không ngon lắm",  # phủ định!
]

for review in reviews:
    result = classifier(review)[0]
    print(f"  {review}")
    print(f"  → {result['label']} ({result['score']:.2%})")
    print()
# "Sản phẩm rất tốt..." → POSITIVE (97.2%)
# "Hàng đúng mô tả..."  → NEUTRAL (68.5%)
# "Giao hàng chậm..."    → NEGATIVE (94.8%)
# "Phở không ngon lắm"   → NEGATIVE (82.3%)`}
          </CodeBlock>

          <Callout variant="tip" title="Thách thức với tiếng Việt">
            <p>
              Tiếng Việt có nhiều cách diễn đạt gián tiếp: {'"cũng được"'} (trung tính), {'"không phải là không tốt"'} (tích cực nhẹ, hai lần phủ định). Mỉa mai trên Shopee: {'"5 sao cho ship chậm"'}. PhoBERT xử lý tốt hơn lexicon nhưng mỉa mai vẫn là thách thức!
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Sentiment Analysis"
          points={[
            "Phân tích cảm xúc: xác định thái độ tích cực/tiêu cực/trung tính trong văn bản.",
            "3 cấp độ: document-level, sentence-level, aspect-based (chi tiết từng khía cạnh).",
            "Lexicon đếm từ → đơn giản nhưng không hiểu ngữ cảnh ('không ngon' sẽ sai).",
            "BERT/PhoBERT → SOTA: hiểu phủ định, ngữ cảnh, mỉa mai.",
            "Ứng dụng: phân tích review Shopee/Tiki, giám sát thương hiệu, chăm sóc khách hàng.",
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
