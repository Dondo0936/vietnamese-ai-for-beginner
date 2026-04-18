"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  slug: "naive-bayes",
  title: "Naive Bayes",
  titleVi: "Bayes ngây thơ",
  description: "Thuật toán phân loại dựa trên định lý Bayes với giả định các đặc trưng độc lập",
  category: "classic-ml",
  tags: ["classification", "probability", "supervised-learning"],
  difficulty: "beginner",
  relatedSlugs: ["logistic-regression", "decision-trees", "confusion-matrix"],
  vizType: "interactive",
};

/* ── Spam classifier simulation ── */
interface Word {
  text: string;
  pSpam: number;
  pHam: number;
}

const WORDS: Word[] = [
  { text: "khuyến mãi", pSpam: 0.80, pHam: 0.08 },
  { text: "miễn phí", pSpam: 0.75, pHam: 0.05 },
  { text: "trúng thưởng", pSpam: 0.90, pHam: 0.02 },
  { text: "họp", pSpam: 0.05, pHam: 0.60 },
  { text: "báo cáo", pSpam: 0.08, pHam: 0.55 },
  { text: "deadline", pSpam: 0.03, pHam: 0.50 },
  { text: "click ngay", pSpam: 0.85, pHam: 0.03 },
  { text: "dự án", pSpam: 0.04, pHam: 0.45 },
];

function classify(selectedWords: string[], pSpamPrior: number) {
  const pHamPrior = 1 - pSpamPrior;
  let logSpam = Math.log(pSpamPrior);
  let logHam = Math.log(pHamPrior);

  for (const w of WORDS) {
    if (selectedWords.includes(w.text)) {
      logSpam += Math.log(w.pSpam);
      logHam += Math.log(w.pHam);
    } else {
      logSpam += Math.log(1 - w.pSpam);
      logHam += Math.log(1 - w.pHam);
    }
  }

  /* Convert log probabilities to probabilities */
  const maxLog = Math.max(logSpam, logHam);
  const pSpamUnnorm = Math.exp(logSpam - maxLog);
  const pHamUnnorm = Math.exp(logHam - maxLog);
  const total = pSpamUnnorm + pHamUnnorm;

  return {
    pSpam: pSpamUnnorm / total,
    pHam: pHamUnnorm / total,
    prediction: pSpamUnnorm > pHamUnnorm ? "SPAM" : "HAM",
  };
}

const TOTAL_STEPS = 7;

/* ═══════════════ MAIN ═══════════════ */
export default function NaiveBayesTopic() {
  const [selectedWords, setSelectedWords] = useState<string[]>(["khuyến mãi", "miễn phí"]);
  const [pSpamPrior, setPSpamPrior] = useState(0.3);

  const toggleWord = useCallback((word: string) => {
    setSelectedWords((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  }, []);

  const result = useMemo(() => classify(selectedWords, pSpamPrior), [selectedWords, pSpamPrior]);

  const quizQuestions: QuizQuestion[] = useMemo(() => [
    {
      question: "Tại sao gọi là 'Ngây thơ' (Naive)?",
      options: [
        "Vì thuật toán quá đơn giản, không mạnh",
        "Vì giả định các features ĐỘC LẬP có điều kiện — thực tế thường sai nhưng vẫn hoạt động tốt",
        "Vì chỉ dùng cho bài toán đơn giản",
      ],
      correct: 1,
      explanation: "'Khuyến mãi' và 'miễn phí' rõ ràng KHÔNG độc lập (spam thường dùng cả hai). Nhưng Naive Bayes giả định chúng độc lập → tính nhanh hơn rất nhiều. Kết quả vẫn tốt đáng ngạc nhiên!",
    },
    {
      question: "Naive Bayes có ưu điểm gì so với logistic regression?",
      options: [
        "Luôn chính xác hơn",
        "Cực nhanh, ít cần dữ liệu, xử lý tốt chiều cao (text: ngàn features)",
        "Không cần train",
      ],
      correct: 1,
      explanation: "Chỉ cần đếm tần suất → O(n·d) train. Với text classification (TF-IDF: hàng ngàn từ), Naive Bayes nhanh hơn logistic regression nhiều lần mà accuracy gần tương đương.",
    },
    {
      question: "Email chứa từ 'khuyến mãi' nhưng không có trong dữ liệu huấn luyện. P(khuyến mãi|Spam) = 0. Chuyện gì xảy ra?",
      options: [
        "Không ảnh hưởng — bỏ qua từ đó",
        "Toàn bộ tích = 0 → xác suất spam = 0 dù có bao nhiêu bằng chứng khác! Cần Laplace smoothing.",
        "Thuật toán báo lỗi",
      ],
      correct: 1,
      explanation: "Nhân chuỗi xác suất → 1 giá trị = 0 → tích = 0! Laplace smoothing thêm +α (thường α=1) vào mọi đếm → không bao giờ = 0. scikit-learn mặc định đã bật smoothing.",
    },
    {
      type: "fill-blank",
      question: "Trong Naive Bayes, thay vì nhân trực tiếp các xác suất nhỏ (dễ gây underflow), người ta dùng {blank} của xác suất để chuyển phép nhân thành phép {blank}.",
      blanks: [
        { answer: "logarithm", accept: ["log", "log xác suất", "logarit"] },
        { answer: "cộng", accept: ["tính tổng", "sum", "cộng dồn"] },
      ],
      explanation: "Nhân nhiều số rất nhỏ (ví dụ: 0.001 × 0.002 × ... × 0.0005) nhanh chóng tiến về 0 — gọi là underflow số học. Dùng log: log(a·b) = log(a) + log(b). Thay vì nhân, cộng các log xác suất → kết quả ổn định, rồi so sánh giá trị log lớn nhất.",
    },
  ], []);

  return (
    <>
      {/* STEP 1: PREDICTION GATE */}
      <LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
        <PredictionGate
          question="Bạn nhận email có từ 'khuyến mãi' và 'miễn phí'. Não bạn tự động nghĩ: spam! Nhưng bạn dựa vào gì? Kinh nghiệm: email trước đó có những từ này thường là spam."
          options={[
            "Đếm số từ spam vs không spam → từ nào xuất hiện nhiều ở spam → email này spam",
            "Dùng neural network phức tạp",
            "Ngẫu nhiên — không thể phân biệt",
          ]}
          correct={0}
          explanation="Bạn vừa dùng Naive Bayes trong đầu! Mỗi từ có xác suất xuất hiện ở spam vs ham. Nhân tất cả lại → xác suất email là spam. Đơn giản mà cực kỳ hiệu quả!"
        >

      {/* STEP 2: INTERACTIVE SPAM CLASSIFIER */}
      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khám phá">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Chọn các từ xuất hiện trong email. <strong className="text-foreground">Naive Bayes</strong>{" "}
          nhân xác suất từng từ để tính P(Spam) và P(Ham). Thử tạo email spam và email bình thường!
        </p>

        <VisualizationSection>
          <div className="space-y-4">
            {/* Word selector */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WORDS.map((w) => {
                const isSelected = selectedWords.includes(w.text);
                const isSpammy = w.pSpam > w.pHam;
                return (
                  <button
                    key={w.text}
                    onClick={() => toggleWord(w.text)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                      isSelected
                        ? isSpammy
                          ? "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
                          : "border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                        : "border-border text-muted hover:border-accent/50"
                    }`}
                  >
                    {isSelected ? "✓ " : ""}{w.text}
                    <div className="mt-1 text-[9px] opacity-70">
                      S: {(w.pSpam * 100).toFixed(0)}% | H: {(w.pHam * 100).toFixed(0)}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Prior slider — base rate of spam before seeing words */}
            <div className="space-y-1 max-w-md mx-auto">
              <label className="text-xs font-medium text-muted flex justify-between">
                <span>Tỉ lệ spam cơ sở (prior)</span>
                <strong className="text-foreground">{(pSpamPrior * 100).toFixed(0)}%</strong>
              </label>
              <input
                type="range" min={0.05} max={0.95} step={0.05}
                value={pSpamPrior}
                onChange={(e) => setPSpamPrior(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
              <p className="text-[10px] text-muted">Kéo để xem prior mạnh lật được bằng chứng từ từ khoá thế nào.</p>
            </div>

            {/* Probability flow diagram */}
            <svg viewBox="0 0 500 200" className="w-full rounded-lg border border-border bg-background"
              role="img"
              aria-label={`Naive Bayes: prior P(Spam)=${(pSpamPrior*100).toFixed(0)}%, ${selectedWords.length} từ được chọn, dự đoán ${result.prediction} với ${(Math.max(result.pSpam, result.pHam)*100).toFixed(1)}% tin cậy.`}>
              <title>Prior {(pSpamPrior*100).toFixed(0)}% · {selectedWords.length} từ · {result.prediction} {(Math.max(result.pSpam, result.pHam)*100).toFixed(1)}%</title>
              {/* Prior */}
              <text x={250} y={20} fontSize={11} fill="currentColor" className="text-foreground" textAnchor="middle" fontWeight={600}>
                Prior: P(Spam) = {(pSpamPrior * 100).toFixed(0)}% | P(Ham) = {((1 - pSpamPrior) * 100).toFixed(0)}%
              </text>

              {/* Selected words */}
              <text x={250} y={45} fontSize={10} fill="currentColor" className="text-muted" textAnchor="middle">
                Từ: {selectedWords.length > 0 ? selectedWords.join(" + ") : "(chưa chọn)"}
              </text>

              {/* Multiplication arrows */}
              <line x1={250} y1={52} x2={250} y2={70} stroke="#888" strokeWidth={1.5} />
              <text x={250} y={80} fontSize={9} fill="#8b5cf6" textAnchor="middle" fontWeight={600}>
                Nhân P(từ|lớp) cho từng từ
              </text>

              {/* Result bars */}
              <g transform="translate(50, 100)">
                {/* Spam bar */}
                <rect x={0} y={0} width={400} height={30} rx={6} fill="#ef4444" opacity={0.08} />
                <motion.rect
                  x={0} y={0} height={30} rx={6} fill="#ef4444" opacity={0.25}
                  animate={{ width: result.pSpam * 400 }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                />
                <text x={5} y={20} fontSize={11} fill="#ef4444" fontWeight={600}>
                  SPAM: {(result.pSpam * 100).toFixed(1)}%
                </text>
              </g>

              <g transform="translate(50, 140)">
                {/* Ham bar */}
                <rect x={0} y={0} width={400} height={30} rx={6} fill="#22c55e" opacity={0.08} />
                <motion.rect
                  x={0} y={0} height={30} rx={6} fill="#22c55e" opacity={0.25}
                  animate={{ width: result.pHam * 400 }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                />
                <text x={5} y={20} fontSize={11} fill="#22c55e" fontWeight={600}>
                  HAM: {(result.pHam * 100).toFixed(1)}%
                </text>
              </g>

              {/* Prediction label */}
              <text x={460} y={145} fontSize={14}
                fill={result.prediction === "SPAM" ? "#ef4444" : "#22c55e"}
                fontWeight={700} textAnchor="middle">
                {result.prediction}
              </text>
            </svg>

            <p className="text-xs text-muted">
              S = P(từ|Spam), H = P(từ|Ham). Thử chọn toàn từ spam (&quot;khuyến mãi&quot;, &quot;miễn phí&quot;, &quot;trúng thưởng&quot;) rồi toàn từ ham (&quot;họp&quot;, &quot;báo cáo&quot;, &quot;deadline&quot;).
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* STEP 3: AHA */}
      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha">
        <AhaMoment>
          <p>
            <strong>Naive Bayes</strong>{" "}
            = định lý Bayes + giả định độc lập. Mỗi từ &quot;bỏ phiếu&quot; cho spam/ham dựa trên xác suất → nhân tất cả lại → phân loại. Đơn giản, nhanh, và bất ngờ chính xác!
          </p>
        </AhaMoment>
      </LessonSection>

      {/* STEP 4: CHALLENGE */}
      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Thử thách">
        <InlineChallenge
          question="Email có từ 'khuyến mãi' (P=0.8|Spam) và 'báo cáo' (P=0.55|Ham). Naive Bayes nói gì?"
          options={[
            "Chắc chắn spam vì 'khuyến mãi' rất spam",
            "Tuỳ: phải nhân TẤT CẢ xác suất từ + prior. 1 từ spam + 1 từ ham → kết quả không rõ ràng",
            "Chắc chắn ham vì 'báo cáo' rất ham",
          ]}
          correct={1}
          explanation="Naive Bayes nhân TẤT CẢ xác suất — 1 từ không quyết định. P(Spam|email) ∝ P(Spam) × P(khuyến mãi|Spam) × P(báo cáo|Spam). Phải tính cả hai lớp rồi so sánh!"
        />
      </LessonSection>

      {/* STEP 5: EXPLANATION */}
      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Lý thuyết">
        <ExplanationSection>
          <p>
            <strong>Naive Bayes</strong>{" "}
            dựa trên <strong>định lý Bayes</strong> từ{" "}
            <TopicLink slug="probability-statistics">lý thuyết xác suất thống kê</TopicLink>
            {" "}và là một thuật toán{" "}
            <TopicLink slug="supervised-unsupervised-rl">học có giám sát</TopicLink>:
          </p>

          <LaTeX block>{"P(c|\\mathbf{x}) = \\frac{P(\\mathbf{x}|c) \\cdot P(c)}{P(\\mathbf{x})}"}</LaTeX>

          <p>
            Giả định &quot;ngây thơ&quot;: các features độc lập có điều kiện khi biết lớp:
          </p>

          <LaTeX block>{"P(\\mathbf{x}|c) = \\prod_{i=1}^{d} P(x_i|c)"}</LaTeX>

          <p>Kết hợp lại (bỏ mẫu số vì cùng cho mọi lớp):</p>

          <LaTeX block>{"\\hat{c} = \\arg\\max_c \\; P(c) \\prod_{i=1}^{d} P(x_i|c)"}</LaTeX>

          <p>Thực tế dùng <strong>log</strong>{" "}để tránh underflow (nhân nhiều số nhỏ → 0):</p>

          <LaTeX block>{"\\hat{c} = \\arg\\max_c \\; \\log P(c) + \\sum_{i=1}^{d} \\log P(x_i|c)"}</LaTeX>

          <p><strong>Ba biến thể:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li><strong>Gaussian NB:</strong>{" "}Features liên tục → P(x|c) dùng phân phối Gaussian</li>
            <li><strong>Multinomial NB:</strong>{" "}Features đếm (word counts) → phổ biến cho text</li>
            <li><strong>Bernoulli NB:</strong>{" "}Features nhị phân (có/không có từ)</li>
          </ul>

          <Callout variant="tip" title="Laplace Smoothing">
            Nếu từ &quot;blockchain&quot; chưa bao giờ xuất hiện ở spam: P(blockchain|Spam) = 0 → tích = 0! Thêm <LaTeX>{"\\alpha"}</LaTeX> (thường = 1) vào mọi đếm:
            <br />
            <LaTeX>{"P(x_i|c) = \\frac{\\text{count}(x_i, c) + \\alpha}{\\text{count}(c) + \\alpha \\cdot |V|}"}</LaTeX>
          </Callout>

          <CodeBlock language="python" title="Naive Bayes với scikit-learn">
{`from sklearn.naive_bayes import MultinomialNB, GaussianNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import cross_val_score

# Text classification (spam filter)
emails = [
    "khuyến mãi miễn phí click ngay",
    "họp dự án deadline báo cáo",
    "trúng thưởng iPhone miễn phí",
    "meeting team báo cáo tuần",
    "khuyến mãi sốc giảm 90%",
    "review code sprint planning",
]
labels = [1, 0, 1, 0, 1, 0]  # 1 = spam, 0 = ham

tfidf = TfidfVectorizer()
X = tfidf.fit_transform(emails)

model = MultinomialNB(alpha=1.0)  # Laplace smoothing
model.fit(X, labels)

# Test
test = tfidf.transform(["khuyến mãi họp dự án"])
print(f"Xác suất spam: {model.predict_proba(test)[0][1]:.1%}")

# Dữ liệu số: dùng GaussianNB
from sklearn.datasets import load_iris
X_iris, y_iris = load_iris(return_X_y=True)
gnb = GaussianNB()
print(f"Iris accuracy: {cross_val_score(gnb, X_iris, y_iris, cv=5).mean():.1%}")`}
          </CodeBlock>

          <Callout variant="warning" title="Khi nào Naive Bayes kém?">
            Khi features rất phụ thuộc nhau (ví dụ: diện tích nhà và số phòng). Giả định độc lập sai → xác suất sai → phân loại kém. Lúc này{" "}
            <TopicLink slug="logistic-regression">hồi quy logistic</TopicLink>{" "}
            hoặc SVM thường tốt hơn.
          </Callout>
        </ExplanationSection>
      </LessonSection>

      {/* STEP 6: SUMMARY */}
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Tóm tắt">
        <MiniSummary points={[
          "Naive Bayes = định lý Bayes + giả định features độc lập → nhân xác suất từng feature riêng lẻ.",
          "Cực nhanh O(n·d), ít cần dữ liệu, xử lý tốt chiều cao → lý tưởng cho text classification.",
          "Laplace smoothing chống xác suất = 0 khi gặp feature mới chưa thấy.",
          "3 biến thể: Gaussian (số liên tục), Multinomial (đếm), Bernoulli (nhị phân).",
          "Giả định độc lập thường sai nhưng vẫn hoạt động tốt — 'ngây thơ' mà hiệu quả!",
        ]} />
      </LessonSection>

      {/* STEP 7: QUIZ */}
      <LessonSection step={7} totalSteps={TOTAL_STEPS} label="Kiểm tra">
        <QuizSection questions={quizQuestions} />
      </LessonSection>

        </PredictionGate>
      </LessonSection>
    </>
  );
}
