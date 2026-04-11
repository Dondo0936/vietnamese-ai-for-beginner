"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, ToggleCompare,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "bag-of-words",
  title: "Bag of Words",
  titleVi: "Bag of Words - Túi từ",
  description:
    "Phương pháp biểu diễn văn bản đơn giản bằng cách đếm tần suất xuất hiện của mỗi từ, bỏ qua thứ tự.",
  category: "nlp",
  tags: ["nlp", "text-representation", "feature-extraction"],
  difficulty: "beginner",
  relatedSlugs: ["tokenization", "tf-idf", "word-embeddings"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const SAMPLE_REVIEWS = [
  "Phở ngon tuyệt vời phở rất ngon",
  "Giao hàng nhanh sản phẩm tốt rất hài lòng",
  "Dở tệ không ngon dịch vụ tệ",
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Hai câu 'Tôi yêu mèo' và 'Mèo yêu tôi' có vector Bag of Words giống nhau không?",
    options: [
      "Khác nhau hoàn toàn",
      "Giống nhau hoàn toàn — BoW bỏ qua thứ tự từ",
      "Giống một phần",
      "Không thể so sánh",
    ],
    correct: 1,
    explanation:
      "BoW chỉ đếm tần suất, không quan tâm thứ tự. Cả hai câu đều có: tôi=1, yêu=1, mèo=1 → vector giống hệt nhau!",
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
      "BoW bỏ qua thứ tự từ nên 'Phim hay' và 'Hay phim' giống nhau, và không hiểu 'không tốt' là tiêu cực.",
  },
  {
    question: "Với 3 tài liệu và từ vựng gồm 1000 từ, mỗi vector BoW có bao nhiêu chiều?",
    options: ["3", "1000", "3000", "Tùy tài liệu"],
    correct: 1,
    explanation:
      "Vector BoW luôn có chiều bằng kích thước từ vựng (1000). Mỗi vị trí đếm số lần từ đó xuất hiện trong tài liệu.",
  },
];

/* ── Main Component ── */
export default function BagOfWordsTopic() {
  const [text, setText] = useState("tôi yêu phở tôi yêu bún chả phở ngon");
  const [selectedReview, setSelectedReview] = useState(0);

  const wordCounts = useMemo(() => {
    const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
    const counts: Record<string, number> = {};
    for (const w of words) {
      counts[w] = (counts[w] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [text]);

  const maxCount = Math.max(...wordCounts.map(([, c]) => c), 1);

  // Review comparison
  const reviewAnalysis = useMemo(() => {
    const allWords = new Set<string>();
    const vectors = SAMPLE_REVIEWS.map((r) => {
      const words = r.toLowerCase().split(/\s+/);
      const counts: Record<string, number> = {};
      for (const w of words) {
        counts[w] = (counts[w] || 0) + 1;
        allWords.add(w);
      }
      return counts;
    });
    return { allWords: Array.from(allWords).sort(), vectors };
  }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Hai câu "Tôi yêu mèo" và "Mèo yêu tôi" — nếu chỉ đếm từ (không xét thứ tự), chúng giống hay khác nhau?`}
          options={["Khác nhau", "Giống nhau", "Không thể xác định"]}
          correct={1}
          explanation={`Cả hai câu đều chứa: "tôi" = 1 lần, "yêu" = 1 lần, "mèo" = 1 lần. Nếu CHỈ ĐẾM từ mà bỏ qua thứ tự, chúng hoàn toàn giống nhau! Đây chính là ý tưởng của Bag of Words — đổ từ vào "túi", xóc lên, đếm.`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Viz ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Bạn vừa thấy: Bag of Words biến câu thành bảng đếm tần suất. Hãy thử nhập câu tiếng Việt bên dưới và xem máy tính {'"đổ từ vào túi"'} như thế nào!
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">
                Nhập câu tiếng Việt
              </label>
              <input
                type="text"
                value={text}
                onChange={handleTextChange}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                placeholder="Ví dụ: tôi yêu phở tôi yêu bún chả"
              />
            </div>

            {/* Bar chart */}
            <div className="space-y-2">
              {wordCounts.map(([word, count]) => (
                <div key={word} className="flex items-center gap-3">
                  <span className="w-20 text-right text-sm font-medium text-foreground truncate">{word}</span>
                  <div className="flex-1 h-6 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-bold text-accent">{count}</span>
                </div>
              ))}
            </div>

            {/* Vector representation */}
            <div className="rounded-lg bg-background/50 border border-border p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Vector BoW
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-sm text-muted">[</span>
                {wordCounts.map(([word, count], i) => (
                  <span key={word} className="text-sm">
                    <span className="text-accent font-bold">{count}</span>
                    <span className="text-muted text-xs">({word})</span>
                    {i < wordCounts.length - 1 && <span className="text-muted">,{" "}</span>}
                  </span>
                ))}
                <span className="text-sm text-muted">]</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <div className="rounded-lg bg-background/50 border border-border px-4 py-2 text-center">
                <p className="text-xs text-muted">Tổng từ</p>
                <p className="text-lg font-bold text-foreground">
                  {wordCounts.reduce((s, [, c]) => s + c, 0)}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 border border-border px-4 py-2 text-center">
                <p className="text-xs text-muted">Từ vựng (duy nhất)</p>
                <p className="text-lg font-bold text-accent">{wordCounts.length}</p>
              </div>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>Bag of Words</strong>{" "}
            biến văn bản thành vector số bằng cách đếm tần suất từ — giống như đổ từ vào túi rồi đếm. Đơn giản nhưng bỏ mất thông tin thứ tự!
          </p>
          <p className="text-sm text-muted mt-1">
            Giống như xáo trộn nguyên liệu nấu phở trong túi: bạn biết có bao nhiêu miếng thịt, hành, nhưng không biết thứ tự cho vào nồi.
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: ToggleCompare ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="So sánh thực tế">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Hãy xem BoW hoạt động thực tế với đánh giá Shopee. Mỗi đánh giá trở thành 1 hàng trong bảng — đây chính là cách máy tính {'"đọc"'} review!
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SAMPLE_REVIEWS.map((review, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedReview(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedReview === i
                      ? "bg-accent text-white"
                      : "bg-card border border-border text-muted hover:text-foreground"
                  }`}
                >
                  Review {i + 1}
                </button>
              ))}
            </div>

            <div className="rounded-lg bg-background/50 border border-border p-3">
              <p className="text-sm text-foreground italic">
                &ldquo;{SAMPLE_REVIEWS[selectedReview]}&rdquo;
              </p>
            </div>

            {/* BoW table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1 px-2 text-muted font-medium">Từ</th>
                    {reviewAnalysis.allWords.slice(0, 10).map((w) => (
                      <th key={w} className="text-center py-1 px-1 text-accent font-medium">{w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_REVIEWS.map((_, ri) => (
                    <tr
                      key={ri}
                      className={`border-b border-border ${ri === selectedReview ? "bg-accent/10" : ""}`}
                    >
                      <td className="py-1 px-2 text-muted font-medium">Doc {ri + 1}</td>
                      {reviewAnalysis.allWords.slice(0, 10).map((w) => (
                        <td key={w} className="text-center py-1 px-1">
                          <span className={reviewAnalysis.vectors[ri][w] ? "text-accent font-bold" : "text-muted"}>
                            {reviewAnalysis.vectors[ri][w] || 0}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 5: InlineChallenge ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question={`"Phim này không hay" — BoW xếp câu này vào nhóm tích cực hay tiêu cực? (Gợi ý: BoW đếm từ riêng lẻ)`}
          options={[
            "Tiêu cực — vì có từ 'không'",
            "Tích cực — vì BoW thấy từ 'hay' (tích cực) mà bỏ qua ngữ cảnh 'không hay'",
            "Trung tính",
          ]}
          correct={1}
          explanation="BoW đếm từ riêng lẻ: 'hay' = tích cực. Nó không hiểu 'không hay' = tiêu cực vì đã bỏ mất thứ tự từ! Đây là nhược điểm lớn nhất của BoW."
        />
      </LessonSection>

      {/* ── Step 6: Explanation with LaTeX ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Bag of Words (BoW)</strong>{" "}
            là một trong những phương pháp biểu diễn văn bản đơn giản nhất trong NLP. Mỗi tài liệu được biến thành vector đếm tần suất từ.
          </p>

          <Callout variant="insight" title="Công thức BoW">
            <p>Cho từ vựng gồm V từ duy nhất, mỗi tài liệu d được biểu diễn bằng vector:</p>
            <LaTeX display>{`\\mathbf{d} = [c(w_1, d),\\ c(w_2, d),\\ \\ldots,\\ c(w_V, d)]`}</LaTeX>
            <p className="mt-2 text-sm">
              Trong đó <LaTeX>{`c(w_i, d)`}</LaTeX>{" "}
              là số lần từ <LaTeX>{`w_i`}</LaTeX>{" "}
              xuất hiện trong tài liệu d. Vector có V chiều — thường rất thưa (sparse) vì hầu hết giá trị = 0.
            </p>
          </Callout>

          <Callout variant="info" title="Quy trình BoW">
            <div className="space-y-2">
              <p>
                <strong>Bước 1:</strong>{" "}
                Xây dựng từ vựng V = tập hợp tất cả từ duy nhất trong toàn bộ dữ liệu.
              </p>
              <p>
                <strong>Bước 2:</strong>{" "}
                Với mỗi tài liệu, đếm số lần mỗi từ trong V xuất hiện.
              </p>
              <p>
                <strong>Bước 3:</strong>{" "}
                Tạo vector có chiều |V|, mỗi vị trí là tần suất của từ tương ứng.
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="bow_demo.py">
{`from sklearn.feature_extraction.text import CountVectorizer

# Đánh giá Shopee tiếng Việt
reviews = [
    "Phở ngon tuyệt vời phở rất ngon",
    "Giao hàng nhanh sản phẩm tốt",
    "Dở tệ không ngon dịch vụ tệ",
]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(reviews)

print("Từ vựng:", vectorizer.get_feature_names_out())
# ['dở', 'dịch', 'giao', 'hàng', 'không', 'ngon', ...]

print("Ma trận BoW:")
print(X.toarray())
# [[0, 0, 0, 0, 0, 2, 1, 0, 0, 1, 0, 1, 1],
#  [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0],
#  [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 2, 1]]`}
          </CodeBlock>

          <Callout variant="tip" title="Khi nào dùng BoW?">
            <p>
              BoW vẫn hiệu quả cho phân loại văn bản đơn giản (spam/không spam), đặc biệt khi dữ liệu ít và cần mô hình nhẹ. Nhưng cho tác vụ cần hiểu ngữ nghĩa, hãy dùng TF-IDF hoặc word embeddings.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về Bag of Words"
          points={[
            "BoW biến văn bản thành vector bằng cách ĐẾM TẦN SUẤT từ — bỏ qua thứ tự.",
            "Vector BoW có chiều = kích thước từ vựng V, thường rất thưa (sparse).",
            "Ưu điểm: đơn giản, nhanh, hiệu quả cho phân loại cơ bản (spam, chủ đề).",
            "Nhược điểm: mất thứ tự từ ('không tốt' = 'tốt không'), vector thưa, không hiểu ngữ nghĩa.",
            "TF-IDF cải tiến BoW bằng cách giảm trọng số từ phổ biến — bước tiến tiếp theo!",
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
