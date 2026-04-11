"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
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
  slug: "hallucination",
  title: "AI Hallucination",
  titleVi: "Ảo giác của AI",
  description:
    "Hiện tượng mô hình ngôn ngữ tạo ra thông tin nghe hợp lý nhưng thực tế sai hoặc bịa đặt.",
  category: "llm-concepts",
  tags: ["hallucination", "reliability", "safety", "llm"],
  difficulty: "beginner",
  relatedSlugs: ["rag", "chain-of-thought", "temperature", "prompt-engineering"],
  vizType: "interactive",
};

// ─── Dữ liệu: 6 phát biểu — mix thật/giả ───
// Mỗi câu được thiết kế để TEST khả năng phát hiện ảo giác
const STATEMENTS = [
  {
    text: "Nước sôi ở 100°C tại áp suất tiêu chuẩn (1 atm).",
    isHallucination: false,
    category: "Khoa học",
    explanation: "Đúng sự thật. Đây là kiến thức vật lý cơ bản đã được kiểm chứng hàng trăm năm.",
  },
  {
    text: "Albert Einstein phát minh ra bóng đèn điện vào năm 1879.",
    isHallucination: true,
    category: "Lịch sử",
    explanation: "SAI! Thomas Edison được công nhận phát minh bóng đèn thực dụng (1879), không phải Einstein. AI trộn lẫn các nhà khoa học nổi tiếng — đây là dạng ảo giác rất phổ biến.",
  },
  {
    text: "Nghiên cứu của GS. Trần Đại Nghĩa (ĐH Bách Khoa, 2024) chứng minh GPT-5 đạt IQ 140.",
    isHallucination: true,
    category: "Trích dẫn",
    explanation: "HOÀN TOÀN BỊA ĐẶT! AI tạo tên giáo sư, trường, năm, và kết quả nghiên cứu không có thật. Đây là dạng ảo giác nguy hiểm nhất vì nghe rất học thuật và thuyết phục.",
  },
  {
    text: "Sông Mekong chảy qua 6 quốc gia, bắt nguồn từ cao nguyên Tây Tạng.",
    isHallucination: false,
    category: "Địa lý",
    explanation: "Đúng. Sông Mekong chảy qua Trung Quốc, Myanmar, Lào, Thái Lan, Campuchia, và Việt Nam.",
  },
  {
    text: "Việt Nam giành huy chương vàng Olympic Toán lần đầu tiên vào năm 1969.",
    isHallucination: true,
    category: "Lịch sử VN",
    explanation: "SAI! Việt Nam tham dự IMO lần đầu năm 1974 và giành HCV đầu tiên năm 1975 (Hoàng Lê Minh). AI bịa năm 1969 — sai nhưng nghe hợp lý vì gần thời điểm thật.",
  },
  {
    text: "Python được tạo bởi Guido van Rossum và phát hành lần đầu năm 1991.",
    isHallucination: false,
    category: "Công nghệ",
    explanation: "Đúng sự thật. Python 0.9.0 được Guido van Rossum phát hành tháng 2/1991.",
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    question: "Tại sao LLM tạo ra ảo giác thay vì nói 'tôi không biết'?",
    options: [
      "Vì LLM cố tình lừa dối người dùng",
      "Vì LLM dự đoán từ 'nghe hợp lý nhất', không kiểm tra sự thật",
      "Vì LLM không đủ thông minh",
      "Vì LLM chỉ hoạt động tốt với tiếng Anh",
    ],
    correct: 1,
    explanation: "LLM tối ưu cho xác suất cao nhất, không cho sự thật. Nó chọn từ 'nghe hợp lý' dựa trên pattern, không kiểm tra thông tin có đúng không.",
  },
  {
    question: "Kỹ thuật nào giúp giảm ảo giác hiệu quả nhất?",
    options: [
      "Tăng temperature để AI sáng tạo hơn",
      "Dùng RAG — cho AI tra cứu tài liệu thật trước khi trả lời",
      "Hỏi AI nhiều lần cho đến khi đúng",
      "Dùng model nhỏ hơn",
    ],
    correct: 1,
    explanation: "RAG (Retrieval-Augmented Generation) neo câu trả lời vào nguồn thật, giảm đáng kể ảo giác. Tăng temperature ngược lại làm TĂNG ảo giác!",
  },
  {
    question: "Dạng ảo giác nào nguy hiểm nhất trong thực tế?",
    options: [
      "Sai ngày tháng nhỏ",
      "Tạo trích dẫn học thuật giả — tên giáo sư, bài báo, kết quả không tồn tại",
      "Sai tên thủ đô",
      "Viết code có lỗi cú pháp",
    ],
    correct: 1,
    explanation: "Trích dẫn giả cực kỳ nguy hiểm vì người đọc tin tưởng 'nguồn uy tín'. Luật sư, sinh viên, nhà nghiên cứu đã gặp rắc rối nghiêm trọng vì trích dẫn AI bịa.",
  },
];

export default function HallucinationTopic() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userGuess, setUserGuess] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = STATEMENTS[currentIdx];
  const isCorrect = userGuess === current.isHallucination;

  const handleGuess = useCallback((guess: boolean) => {
    if (userGuess !== null) return;
    setUserGuess(guess);
    if (guess === current.isHallucination) {
      setScore(s => s + 1);
    }
  }, [userGuess, current.isHallucination]);

  const handleNext = useCallback(() => {
    if (currentIdx < STATEMENTS.length - 1) {
      setCurrentIdx(i => i + 1);
      setUserGuess(null);
    } else {
      setFinished(true);
    }
  }, [currentIdx]);

  const handleReset = useCallback(() => {
    setCurrentIdx(0);
    setUserGuess(null);
    setScore(0);
    setFinished(false);
  }, []);

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <LessonSection step={1} totalSteps={6} label="Thử đoán">
      <PredictionGate
        question="AI nói: 'Theo nghiên cứu của ĐH Stanford năm 2024, uống 3 ly cà phê mỗi ngày giúp tăng IQ 15 điểm.' Bạn tin không?"
        options={[
          "Tin — nghe có lý, Stanford là trường uy tín",
          "Không tin — nghe quá tốt để là thật, cần kiểm chứng",
          "Tin một phần — cà phê có lợi nhưng 15 IQ thì hơi quá",
        ]}
        correct={1}
        explanation="Câu này HOÀN TOÀN DO AI BỊA! Không có nghiên cứu nào như vậy. AI tạo ra trường uy tín (Stanford), năm cụ thể (2024), con số chính xác (15 IQ) — tất cả đều giả nhưng nghe rất thuyết phục. Đây gọi là Hallucination — ảo giác của AI."
      >
        <p className="text-sm text-muted mt-4">
          Bạn có thể phát hiện thêm bao nhiêu ảo giác? Hãy thử với 6 phát biểu dưới đây.
        </p>
      </PredictionGate>

            </LessonSection>

{/* ━━━ KHÁM PHÁ — Trò chơi phát hiện ảo giác ━━━ */}
      <LessonSection step={2} totalSteps={6} label="Khám phá">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Phát hiện ảo giác AI
        </h3>
        <p className="text-sm text-muted mb-4">
          AI nói 6 câu. Bạn phân biệt: thật hay ảo giác (bịa đặt)?
        </p>

        {!finished ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tiến trình */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  {STATEMENTS.map((_, i) => (
                    <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${
                      i < currentIdx ? "bg-accent" : i === currentIdx ? "bg-accent/50" : "bg-surface"
                    }`} />
                  ))}
                </div>
                <span className="text-xs text-muted">
                  Điểm: {score}/{currentIdx + (userGuess !== null ? 1 : 0)}
                </span>
              </div>

              {/* Phát biểu của AI */}
              <div className="rounded-lg border border-border bg-surface p-5 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-card border border-border px-2 py-0.5 text-[10px] font-medium text-tertiary">
                    {current.category}
                  </span>
                  <span className="text-[10px] text-tertiary">
                    Câu {currentIdx + 1}/{STATEMENTS.length}
                  </span>
                </div>
                <p className="text-base text-foreground leading-relaxed">
                  &quot;{current.text}&quot;
                </p>
              </div>

              {/* Nút đoán */}
              {userGuess === null ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleGuess(false)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/15 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400 transition-all hover:bg-green-100 dark:hover:bg-green-900/25"
                  >
                    <CheckCircle2 size={16} />
                    Sự thật
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGuess(true)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/15 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 transition-all hover:bg-red-100 dark:hover:bg-red-900/25"
                  >
                    <ShieldAlert size={16} />
                    Ảo giác
                  </button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className={`rounded-lg border p-4 ${
                    isCorrect
                      ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/15"
                      : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/15"
                  }`}>
                    <p className={`text-sm font-semibold mb-1 ${
                      isCorrect
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}>
                      {isCorrect ? "Chính xác!" : "Sai rồi!"}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {current.explanation}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark transition-colors"
                  >
                    {currentIdx < STATEMENTS.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="text-4xl font-bold text-accent mb-2">
              {score}/{STATEMENTS.length}
            </div>
            <p className="text-sm text-muted mb-4">
              {score === 6
                ? "Xuất sắc! Bạn phát hiện ảo giác rất giỏi — luôn giữ thói quen này!"
                : score >= 4
                ? "Khá tốt! Nhưng nhớ: ảo giác AI nguy hiểm vì nó nghe RẤT thuyết phục."
                : "Cẩn thận! Ảo giác AI rất khó phát hiện. Luôn kiểm chứng thông tin quan trọng."}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Chơi lại
            </button>
          </motion.div>
        )}
      </VisualizationSection>

            </LessonSection>

{/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={6} label="Khám phá">
      <AhaMoment>
        AI không <em>cố tình</em>{" "}nói dối — nó chỉ chọn từ &quot;nghe hợp lý nhất&quot; dựa trên
        xác suất. Khi không chắc, thay vì nói &quot;tôi không biết&quot;, nó tự tin tạo ra
        câu trả lời nghe hoàn hảo nhưng hoàn toàn bịa đặt. Đó là <strong>Hallucination</strong>{" "}— ảo giác của AI.
      </AhaMoment>

            </LessonSection>

{/* ━━━ THỬ THÁCH ━━━ */}
      <LessonSection step={4} totalSteps={6} label="Thử thách">
      <InlineChallenge
        question="Bạn dùng AI để viết bài nghiên cứu. AI trích dẫn: 'Theo Smith et al. (2023), Nature, vol. 612, pp. 45-52.' Bước tiếp theo đúng nhất là gì?"
        options={[
          "Dùng luôn — AI đã cho đầy đủ chi tiết",
          "Google tên bài báo để kiểm tra nó có tồn tại không",
          "Thay bằng trích dẫn của AI khác cho chắc",
          "Bỏ trích dẫn đi, không cần thiết",
        ]}
        correct={1}
        explanation="Luôn kiểm chứng trích dẫn! AI tạo trích dẫn giả với format hoàn hảo (tên, tạp chí, số trang) nhưng bài báo có thể không tồn tại. Nhiều luật sư và sinh viên đã gặp rắc rối nghiêm trọng vì dùng trích dẫn AI bịa."
      />

            </LessonSection>

{/* ━━━ GIẢI THÍCH ━━━ */}
      <LessonSection step={5} totalSteps={6} label="Giải thích">
      <ExplanationSection>
        <p>
          <strong>Hallucination</strong>{" "}(ảo giác) xảy ra vì LLM tối ưu cho
          xác suất, không cho sự thật. Nó chọn từ tiếp theo sao cho
          &quot;nghe tự nhiên nhất&quot; — không kiểm tra xem thông tin có đúng không.
        </p>

        <Callout variant="warning" title="Tại sao AI không nói 'tôi không biết'?">
          Trong dữ liệu huấn luyện, câu trả lời tự tin luôn nhiều hơn câu trả lời
          &quot;tôi không biết&quot;. AI học pattern: câu hỏi → câu trả lời chi tiết.
          Nó không có cơ chế nội tại để phân biệt &quot;tôi biết&quot; và &quot;tôi đoán&quot;.
        </Callout>

        <p><strong>3 dạng ảo giác phổ biến:</strong></p>
        <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
          <li>
            <strong>Bịa đặt sự kiện:</strong>{" "}Tạo ngày tháng, số liệu, sự kiện không có thật
            nhưng rất cụ thể (ví dụ: &quot;năm 1969&quot; thay vì &quot;năm 1975&quot;)
          </li>
          <li>
            <strong>Trích dẫn giả:</strong>{" "}Tạo tên tác giả, tạp chí, số trang hoàn chỉnh
            cho nghiên cứu không tồn tại — dạng nguy hiểm nhất
          </li>
          <li>
            <strong>Suy luận sai:</strong>{" "}Kết hợp thông tin đúng nhưng suy ra kết luận sai
            (ví dụ: A liên quan B, B liên quan C → A gây ra C)
          </li>
        </ul>

        <Callout variant="tip" title="5 cách giảm ảo giác">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li><strong>RAG:</strong>{" "}Cho AI tra cứu tài liệu thật trước khi trả lời</li>
            <li><strong>Hạ temperature:</strong>{" "}Giảm tính ngẫu nhiên, AI chọn từ an toàn hơn</li>
            <li><strong>Yêu cầu trích dẫn:</strong>{" "}&quot;Trả lời và chỉ rõ nguồn tham khảo&quot;</li>
            <li><strong>Chain-of-Thought:</strong>{" "}Buộc AI giải thích từng bước suy luận</li>
            <li><strong>Kiểm chứng:</strong>{" "}Luôn fact-check thông tin quan trọng bằng nguồn khác</li>
          </ol>
        </Callout>

        <CodeBlock language="python" title="detect_hallucination.py">{`# Yêu cầu AI tự đánh giá mức độ tự tin
prompt = """Trả lời câu hỏi sau.
Nếu không chắc chắn, nói rõ mức độ tự tin.

Câu hỏi: Ai phát minh ra bóng đèn?

Format trả lời:
- Câu trả lời: ...
- Mức tự tin: Cao / Trung bình / Thấp
- Nguồn: (nếu biết)"""

# Kết hợp RAG để giảm ảo giác
from langchain.chains import RetrievalQA
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever()
)`}</CodeBlock>
      </ExplanationSection>

            </LessonSection>

{/* ━━━ TÓM TẮT ━━━ */}
      <LessonSection step={6} totalSteps={6} label="Tổng kết">
      <MiniSummary
        points={[
          "Hallucination = AI tạo thông tin nghe hợp lý nhưng sai hoặc bịa đặt, vì nó tối ưu cho xác suất chứ không cho sự thật",
          "Nguy hiểm nhất: trích dẫn giả — AI tạo tên giáo sư, bài báo, số liệu hoàn chỉnh nhưng không tồn tại",
          "AI không cố tình lừa — nó thiếu cơ chế phân biệt 'tôi biết' và 'tôi đoán'",
          "Giảm ảo giác: dùng RAG, hạ temperature, yêu cầu nguồn, và LUÔN kiểm chứng thông tin quan trọng",
        ]}
      />

      {/* ━━━ KIỂM TRA ━━━ */}
      <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
