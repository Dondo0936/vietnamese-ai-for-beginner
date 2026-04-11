"use client";

import { useState, useMemo } from "react";
import {
  PredictionGate, LessonSection, AhaMoment, InlineChallenge,
  MiniSummary, Callout, CodeBlock, LaTeX, SliderGroup,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "tf-idf",
  title: "TF-IDF",
  titleVi: "TF-IDF - Tần suất từ nghịch đảo tần suất tài liệu",
  description:
    "Phương pháp đánh giá mức độ quan trọng của một từ trong tài liệu so với toàn bộ tập dữ liệu.",
  category: "nlp",
  tags: ["nlp", "text-representation", "information-retrieval"],
  difficulty: "beginner",
  relatedSlugs: ["bag-of-words", "tokenization", "text-classification"],
  vizType: "interactive",
};

/* ── Constants ── */
const TOTAL_STEPS = 8;

const DOCS = [
  { id: 1, text: "Phở Hà Nội ngon nổi tiếng", topic: "Ẩm thực" },
  { id: 2, text: "Bún chả Hà Nội là món ngon", topic: "Ẩm thực" },
  { id: 3, text: "Hà Nội là thủ đô Việt Nam", topic: "Địa lý" },
  { id: 4, text: "Grab là ứng dụng gọi xe phổ biến", topic: "Công nghệ" },
];

const DEMO_WORDS = [
  { word: "Hà Nội", tf: 1, df: 3, color: "#f59e0b" },
  { word: "ngon", tf: 1, df: 2, color: "#22c55e" },
  { word: "phở", tf: 1, df: 1, color: "#3b82f6" },
  { word: "là", tf: 1, df: 3, color: "#ef4444" },
  { word: "Grab", tf: 1, df: 1, color: "#8b5cf6" },
];

const QUIZ: QuizQuestion[] = [
  {
    question: "Từ 'là' xuất hiện trong 3/4 tài liệu. TF-IDF của nó sẽ như thế nào?",
    options: [
      "Rất cao vì xuất hiện nhiều",
      "Thấp vì IDF nhỏ — từ quá phổ biến không giúp phân biệt tài liệu",
      "Trung bình",
      "Bằng 0",
    ],
    correct: 1,
    explanation:
      "IDF = log(4/3) = 0.29 rất thấp. TF-IDF = TF x IDF cũng thấp. Từ phổ biến như 'là', 'và', 'của' bị IDF 'phạt' nặng!",
  },
  {
    question: "Tại sao TF-IDF tốt hơn Bag of Words cho việc tìm kiếm thông tin?",
    options: [
      "TF-IDF nhanh hơn",
      "TF-IDF giảm trọng số từ phổ biến và tăng trọng số từ đặc trưng",
      "TF-IDF hiểu ngữ nghĩa",
      "TF-IDF bảo toàn thứ tự từ",
    ],
    correct: 1,
    explanation:
      "TF-IDF giảm trọng số từ phổ biến (và, là, của) và tăng trọng số từ đặc trưng (phở, Grab), giúp phân biệt tài liệu tốt hơn BoW.",
  },
  {
    question: "Một từ có TF=5 và xuất hiện trong TẤT CẢ tài liệu. TF-IDF bằng bao nhiêu?",
    options: ["5", "0", "Rất lớn", "Âm"],
    correct: 1,
    explanation:
      "IDF = log(N/N) = log(1) = 0. Do đó TF-IDF = TF x 0 = 0. Từ xuất hiện ở mọi tài liệu hoàn toàn vô dụng cho việc phân biệt!",
  },
];

/* ── Main Component ── */
export default function TfIdfTopic() {
  const [tf, setTf] = useState(5);
  const [totalDocs, setTotalDocs] = useState(100);
  const [df, setDf] = useState(10);

  const idf = useMemo(() => Math.log(totalDocs / (df || 1)), [totalDocs, df]);
  const tfidf = useMemo(() => tf * idf, [tf, idf]);

  // Demo TF-IDF scores for the docs
  const demoScores = useMemo(() => {
    const N = DOCS.length;
    return DEMO_WORDS.map((w) => ({
      ...w,
      idf: Math.log(N / w.df),
      tfidf: w.tf * Math.log(N / w.df),
    }));
  }, []);

  return (
    <>
      {/* ── Step 1: PredictionGate ── */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Thử thách">
        <PredictionGate
          question={`Trong 4 bài viết về Hà Nội, từ nào giúp bạn nhận ra bài viết NÀO nói về ẩm thực: "Hà Nội", "phở", hay "là"?`}
          options={['"Hà Nội" — vì liên quan đến Hà Nội', '"phở" — vì chỉ bài ẩm thực mới có', '"là" — vì xuất hiện nhiều']}
          correct={1}
          explanation={`"Hà Nội" xuất hiện ở nhiều bài → không đặc biệt. "là" xuất hiện khắp nơi → vô dụng. Nhưng "phở" chỉ có trong bài ẩm thực → rất ĐẶC TRƯNG! TF-IDF chính là cách đo mức độ "đặc trưng" này.`}
        />
      </LessonSection>

      {/* ── Step 2: Interactive Demo ── */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Bạn vừa phát hiện nguyên tắc cốt lõi: từ hiếm thì quý! Bây giờ hãy xem TF-IDF tính điểm cho từng từ trong ví dụ thực tế.
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            {/* Document list */}
            <div className="space-y-2">
              {DOCS.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg bg-background/50 border border-border px-3 py-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                    {doc.id}
                  </span>
                  <p className="text-sm text-foreground flex-1">{doc.text}</p>
                  <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded">{doc.topic}</span>
                </div>
              ))}
            </div>

            {/* TF-IDF scores visualization */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                Điểm TF-IDF (N = {DOCS.length} tài liệu)
              </p>
              {demoScores.map((w) => (
                <div key={w.word} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{w.word}</span>
                    <span className="text-xs text-muted">
                      TF={w.tf} x IDF=log({DOCS.length}/{w.df})={w.idf.toFixed(2)} ={" "}
                      <span className="font-bold" style={{ color: w.color }}>{w.tfidf.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(w.tfidf / Math.max(...demoScores.map((s) => s.tfidf))) * 100}%`,
                        backgroundColor: w.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                <strong className="text-accent">phở</strong>{" "}
                và <strong className="text-purple-500">Grab</strong>{" "}
                có TF-IDF cao nhất vì chỉ xuất hiện trong 1 tài liệu — rất đặc trưng!
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 3: AhaMoment ── */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc A-ha">
        <AhaMoment>
          <p>
            <strong>TF-IDF</strong>{" "}
            = Tần suất từ (TF) x Nghịch đảo tần suất tài liệu (IDF). Từ xuất hiện nhiều trong 1 tài liệu NHƯNG hiếm trong toàn bộ tập dữ liệu sẽ có điểm cao nhất!
          </p>
          <p className="text-sm text-muted mt-1">
            Giống như ở chợ Bến Thành: nếu tất cả quầy đều bán nước → nước không đặc biệt. Nhưng quầy duy nhất bán phở → phở là {'"đặc sản"'} của quầy đó!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* ── Step 4: Interactive Calculator ── */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử nghiệm">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Kéo thanh trượt bên dưới để hiểu mối quan hệ giữa TF, DF và TF-IDF. Thử tăng DF lên thật cao — chuyện gì xảy ra?
        </p>

        <VisualizationSection>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">
                  TF (Tần suất từ): <span className="text-accent font-bold">{tf}</span>
                </label>
                <input
                  type="range" min="1" max="20" step="1" value={tf}
                  onChange={(e) => setTf(parseInt(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">
                  N (Tổng tài liệu): <span className="text-accent font-bold">{totalDocs}</span>
                </label>
                <input
                  type="range" min="10" max="1000" step="10" value={totalDocs}
                  onChange={(e) => setTotalDocs(parseInt(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted">
                  DF (Số tài liệu chứa từ): <span className="text-accent font-bold">{Math.min(df, totalDocs)}</span>
                </label>
                <input
                  type="range" min="1" max={totalDocs} step="1"
                  value={Math.min(df, totalDocs)}
                  onChange={(e) => setDf(parseInt(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>

            {/* Formula visualization */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="rounded-xl border-2 border-blue-500 bg-blue-500/10 px-4 py-3 text-center">
                <p className="text-xs text-blue-400">TF</p>
                <p className="text-2xl font-bold text-blue-500">{tf}</p>
              </div>
              <span className="text-2xl text-muted font-bold">&times;</span>
              <div className="rounded-xl border-2 border-purple-500 bg-purple-500/10 px-4 py-3 text-center">
                <p className="text-xs text-purple-400">IDF = log(N/DF)</p>
                <p className="text-2xl font-bold text-purple-500">{idf.toFixed(2)}</p>
              </div>
              <span className="text-2xl text-muted font-bold">=</span>
              <div className={`rounded-xl border-2 px-4 py-3 text-center ${
                tfidf > 10 ? "border-green-500 bg-green-500/10" : tfidf > 5 ? "border-yellow-500 bg-yellow-500/10" : "border-red-500 bg-red-500/10"
              }`}>
                <p className="text-xs text-muted">TF-IDF</p>
                <p className={`text-2xl font-bold ${
                  tfidf > 10 ? "text-green-500" : tfidf > 5 ? "text-yellow-500" : "text-red-500"
                }`}>
                  {tfidf.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-background/50 border border-border p-4 text-center">
              <p className="text-sm text-muted">
                {tfidf > 10
                  ? "Rất quan trọng! Từ này đặc trưng cho tài liệu."
                  : tfidf > 5
                  ? "Quan trọng vừa phải."
                  : df >= totalDocs
                  ? "TF-IDF = 0! Từ xuất hiện ở MỌI tài liệu → hoàn toàn vô dụng."
                  : "Ít quan trọng — từ này quá phổ biến."}
              </p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ── Step 5: InlineChallenge ── */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Thử thách nhanh">
        <InlineChallenge
          question="Bạn tìm kiếm 'phở bò Hà Nội' trên Google. Từ nào trong query có trọng số TF-IDF cao nhất khi so sánh giữa các trang web?"
          options={[
            "'Hà Nội' — vì rất nhiều trang web nhắc đến",
            "'phở bò' — vì ít trang web có từ này hơn, nên nó đặc trưng hơn",
            "Tất cả từ đều quan trọng như nhau",
          ]}
          correct={1}
          explanation="'Hà Nội' xuất hiện ở hàng triệu trang → IDF thấp. 'Phở bò' hiếm hơn → IDF cao → TF-IDF cao hơn. Google Search Engine thực sự dùng nguyên lý tương tự TF-IDF!"
        />
      </LessonSection>

      {/* ── Step 6: Explanation with LaTeX ── */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>TF-IDF</strong>{" "}
            (Term Frequency - Inverse Document Frequency) đánh giá mức độ quan trọng của từ bằng cách kết hợp hai yếu tố: tần suất cục bộ (trong tài liệu) và độ hiếm toàn cục (trong tập dữ liệu).
          </p>

          <Callout variant="insight" title="Công thức TF-IDF">
            <div className="space-y-3">
              <div>
                <p className="font-medium mb-1">Term Frequency (tần suất từ):</p>
                <LaTeX display>{`\\text{TF}(t, d) = \\frac{\\text{số lần từ } t \\text{ xuất hiện trong } d}{\\text{tổng số từ trong } d}`}</LaTeX>
              </div>
              <div>
                <p className="font-medium mb-1">Inverse Document Frequency (nghịch đảo tần suất tài liệu):</p>
                <LaTeX display>{`\\text{IDF}(t) = \\log\\frac{N}{\\text{DF}(t)}`}</LaTeX>
              </div>
              <div>
                <p className="font-medium mb-1">Kết hợp:</p>
                <LaTeX display>{`\\text{TF-IDF}(t, d) = \\text{TF}(t, d) \\times \\text{IDF}(t)`}</LaTeX>
              </div>
            </div>
          </Callout>

          <Callout variant="info" title="Ứng dụng thực tế">
            <div className="space-y-2">
              <p>
                <strong>Google Search:</strong>{" "}
                TF-IDF là nền tảng ban đầu của search engine — xếp hạng trang web theo từ khóa tìm kiếm.
              </p>
              <p>
                <strong>Shopee/Tiki:</strong>{" "}
                Tìm kiếm sản phẩm dùng TF-IDF để match query với mô tả sản phẩm.
              </p>
              <p>
                <strong>Trích xuất từ khóa:</strong>{" "}
                Từ có TF-IDF cao nhất trong tài liệu chính là từ khóa đặc trưng.
              </p>
            </div>
          </Callout>

          <CodeBlock language="python" title="tfidf_demo.py">
{`from sklearn.feature_extraction.text import TfidfVectorizer

# Đánh giá sản phẩm trên Shopee
reviews = [
    "Phở ngon tuyệt vời phở rất ngon",
    "Giao hàng nhanh sản phẩm tốt",
    "Dở tệ không ngon dịch vụ tệ",
]

tfidf = TfidfVectorizer()
X = tfidf.fit_transform(reviews)

# Từ khóa đặc trưng cho mỗi review
for i, review in enumerate(reviews):
    scores = zip(tfidf.get_feature_names_out(), X[i].toarray()[0])
    top = sorted(scores, key=lambda x: x[1], reverse=True)[:3]
    print(f"Review {i+1}: {[(w, f'{s:.2f}') for w, s in top]}")
# Review 1: [('phở', 0.63), ('ngon', 0.44), ('vời', 0.32)]
# Review 2: [('nhanh', 0.45), ('hàng', 0.45), ('giao', 0.45)]
# Review 3: [('tệ', 0.56), ('dở', 0.33), ('dịch', 0.33)]`}
          </CodeBlock>

          <Callout variant="tip" title="TF-IDF vs BoW vs Embeddings">
            <p>
              <strong>BoW:</strong>{" "}
              Chỉ đếm tần suất → từ phổ biến {'"là", "và"'} bị đánh giá cao sai.
              <strong>{" "}TF-IDF:</strong>{" "}
              Giảm trọng số từ phổ biến → tốt hơn BoW.
              <strong>{" "}Word Embeddings:</strong>{" "}
              Hiểu ngữ nghĩa → tốt nhất nhưng phức tạp hơn.
            </p>
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* ── Step 7: MiniSummary ── */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary
          title="Ghi nhớ về TF-IDF"
          points={[
            "TF-IDF = TF x IDF — kết hợp tần suất cục bộ và độ hiếm toàn cục.",
            "Từ phổ biến (là, và, của) có IDF thấp → TF-IDF thấp → bị 'phạt'.",
            "Từ đặc trưng (phở, Grab) có IDF cao → TF-IDF cao → được 'thưởng'.",
            "Ứng dụng: search engine, trích xuất từ khóa, phân loại văn bản.",
            "Hạn chế: vẫn không hiểu ngữ nghĩa — Word Embeddings giải quyết điều này.",
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
