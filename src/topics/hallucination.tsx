"use client";

import { useState } from "react";
import AnalogyCard from "@/components/topic/AnalogyCard";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = {
  slug: "hallucination",
  title: "Hallucination",
  titleVi: "Ảo giác của AI",
  description:
    "Hiện tượng mô hình ngôn ngữ tạo ra thông tin nghe hợp lý nhưng thực tế sai hoặc bịa đặt.",
  category: "llm-concepts",
  tags: ["hallucination", "reliability", "safety", "llm"],
  difficulty: "beginner",
  relatedSlugs: ["rag", "chain-of-thought", "temperature"],
  vizType: "interactive",
};

interface QuizItem {
  statement: string;
  isHallucination: boolean;
  explanation: string;
}

const QUIZ: QuizItem[] = [
  {
    statement: "Nước sôi ở 100 độ C ở áp suất tiêu chuẩn.",
    isHallucination: false,
    explanation: "Đây là sự thật khoa học đã được kiểm chứng.",
  },
  {
    statement: "Albert Einstein phát minh ra bóng đèn vào năm 1879.",
    isHallucination: true,
    explanation: "Thomas Edison thường được công nhận phát minh bóng đèn thực dụng (1879), không phải Einstein. AI đã trộn lẫn các nhà khoa học nổi tiếng.",
  },
  {
    statement: "Python là ngôn ngữ lập trình thông dịch (interpreted).",
    isHallucination: false,
    explanation: "Đúng. Python là ngôn ngữ lập trình thông dịch phổ biến.",
  },
  {
    statement: "Sông Amazon dài 12.500 km, là sông dài nhất vũ trụ.",
    isHallucination: true,
    explanation: "Sông Amazon dài khoảng 6.400 km. AI đã bịa số liệu và thêm 'vũ trụ' vô nghĩa nhưng nghe tự tin.",
  },
  {
    statement: "Nghiên cứu của Giáo sư Nguyễn Văn A tại ĐH Oxford năm 2023 chứng minh AI có thể đọc suy nghĩ.",
    isHallucination: true,
    explanation: "Đây là trích dẫn hoàn toàn bịa đặt. AI thường tạo ra nguồn tham khảo giả nhưng nghe rất thuyết phục.",
  },
];

export default function HallucinationTopic() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (guess: boolean) => {
    const correct = guess === QUIZ[currentQ].isHallucination;
    if (correct) setScore((s) => s + 1);
    setAnswered(guess);
  };

  const handleNext = () => {
    if (currentQ < QUIZ.length - 1) {
      setCurrentQ((q) => q + 1);
      setAnswered(null);
    } else {
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setCurrentQ(0);
    setAnswered(null);
    setScore(0);
    setShowResult(false);
  };

  return (
    <>
      <AnalogyCard>
        <p>
          Hãy tưởng tượng bạn hỏi đường một người <strong>rất tự tin nhưng không
          biết đường</strong>. Thay vì nói &quot;Tôi không biết&quot;, họ tự tin chỉ
          một hướng bất kỳ và nói <strong>rất mạch lạc</strong>.
        </p>
        <p>
          Bạn tin vì họ nói có vẻ <strong>rành rẽ và thuyết phục</strong>. Nhưng thực
          tế, họ hoàn toàn bịa đặt! Đó chính là <strong>ảo giác</strong> của AI.
        </p>
        <p>
          LLM đôi khi tạo ra thông tin <strong>nghe rất hợp lý</strong> nhưng hoàn
          toàn sai sự thật, đặc biệt khi gặp câu hỏi ngoài phạm vi kiến thức.
        </p>
      </AnalogyCard>

      <VisualizationSection>
        <div className="space-y-6">
          {!showResult ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted">
                  Câu hỏi {currentQ + 1}/{QUIZ.length}
                </p>
                <p className="text-sm font-medium text-green-500">
                  Điểm: {score}/{currentQ + (answered !== null ? 1 : 0)}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-background/50 p-4">
                <p className="text-sm font-medium text-foreground mb-1">
                  AI nói:
                </p>
                <p className="text-base text-foreground italic">
                  &quot;{QUIZ[currentQ].statement}&quot;
                </p>
              </div>

              {answered === null ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAnswer(true)}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Ảo giác (Sai sự thật)
                  </button>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                  >
                    Chính xác (Đúng sự thật)
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`rounded-lg border p-3 ${
                    answered === QUIZ[currentQ].isHallucination
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-red-500/50 bg-red-500/10"
                  }`}>
                    <p className={`text-sm font-semibold ${
                      answered === QUIZ[currentQ].isHallucination ? "text-green-400" : "text-red-400"
                    }`}>
                      {answered === QUIZ[currentQ].isHallucination ? "Chính xác!" : "Sai rồi!"}
                    </p>
                    <p className="text-xs text-muted mt-1">{QUIZ[currentQ].explanation}</p>
                  </div>
                  <button
                    onClick={handleNext}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
                  >
                    {currentQ < QUIZ.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto">
                <circle cx="100" cy="100" r="90" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <text x="100" y="90" textAnchor="middle" fill="#e2e8f0" fontSize="36" fontWeight="bold">
                  {score}/{QUIZ.length}
                </text>
                <text x="100" y="120" textAnchor="middle" fill="#94a3b8" fontSize="14">
                  Đúng
                </text>
              </svg>
              <p className="text-sm text-muted">
                {score === QUIZ.length
                  ? "Tuyệt vời! Bạn nhận diện ảo giác rất giỏi!"
                  : score >= 3
                    ? "Khá tốt! Bạn có khả năng phát hiện ảo giác AI."
                    : "Hãy cẩn thận hơn! Ảo giác AI rất khó phát hiện."}
              </p>
              <button
                onClick={handleReset}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
              >
                Chơi lại
              </button>
            </div>
          )}
        </div>
      </VisualizationSection>

      <ExplanationSection>
        <p>
          <strong>Ảo giác (Hallucination)</strong> là hiện tượng mô hình ngôn ngữ tạo
          ra thông tin có vẻ hợp lý và tự tin nhưng thực tế sai hoặc hoàn toàn bịa đặt.
        </p>
        <p>Các loại ảo giác phổ biến:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>
            <strong>Bịa đặt sự kiện:</strong> Tạo ra ngày tháng, số liệu, sự kiện
            không có thật nhưng nghe rất thuyết phục.
          </li>
          <li>
            <strong>Trích dẫn giả:</strong> Tạo ra tên tác giả, bài báo, nghiên cứu
            không tồn tại với đầy đủ chi tiết.
          </li>
          <li>
            <strong>Suy luận sai:</strong> Kết hợp các thông tin đúng nhưng suy ra
            kết luận sai lệch.
          </li>
        </ol>
        <p>
          Cách giảm ảo giác: sử dụng <strong>RAG</strong> để neo câu trả lời vào nguồn
          thực, yêu cầu <strong>trích dẫn nguồn</strong>, hạ{" "}
          <strong>temperature</strong> để giảm tính sáng tạo, và luôn{" "}
          <strong>kiểm chứng</strong> thông tin quan trọng.
        </p>
      </ExplanationSection>
    </>
  );
}
