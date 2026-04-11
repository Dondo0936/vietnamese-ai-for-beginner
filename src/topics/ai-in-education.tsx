"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "ai-in-education", title: "AI in Education", titleVi: "AI trong Giáo dục", description: "Ứng dụng AI trong cá nhân hoá học tập, chấm bài tự động và trợ lý giảng dạy thông minh", category: "applied-ai", tags: ["personalization", "tutoring", "assessment"], difficulty: "beginner", relatedSlugs: ["llm-overview", "rag", "recommendation-systems"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function AIInEducationTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "AI Tutor cá nhân hoá học tập bằng cách nào?", options: ["Dạy giống nhau cho tất cả", "Đo lường trình độ học sinh (diagnostic) → điều chỉnh nội dung (adaptive) → giải thích theo phong cách học → practice theo điểm yếu", "Chỉ chấm điểm"], correct: 1, explanation: "Knowledge tracing: AI biết học sinh BIẾT GÌ và CHƯA BIẾT GÌ (như game RPG skill tree). Bài tập adaptive: biết yếu toán → cho nhiều bài toán. Giải thích: học sinh thích ví dụ → cho nhiều ví dụ. Tốc độ: nhanh → tăng khó. Chậm → giảng lại. Giống gia sư riêng 1-1!" },
    { question: "LLM (ChatGPT/Claude) thay đổi giáo dục thế nào?", options: ["Thay thế giáo viên", "LLM là 'gia sư 24/7': giải thích bất kỳ câu hỏi, bất kỳ lúc nào, bất kỳ cách nào. Nhưng cần hướng dẫn sử dụng đúng để tránh dependency và plagiarism", "Không ảnh hưởng"], correct: 1, explanation: "LLM: (1) Giải thích khái niệm bằng nhiều cách (ví dụ, bảng so sánh, hình ảnh), (2) Trả lời câu hỏi 24/7, (3) Kiểm tra hiểu biết (Socratic method), (4) Dịch/tóm tắt tài liệu. Nhưng: cần dạy học sinh ĐÚNG dùng (không copy), VERIFY (AI có thể sai), và phát triển TƯ DUY (không dependency)." },
    { question: "Auto-grading essay bằng AI có vấn đề gì?", options: ["Chấm chính xác 100%", "AI khác có thể bị hack (writing to please AI), có thể bias, và khó đánh giá sáng tạo/tư duy phản biện", "Không có vấn đề"], correct: 1, explanation: "Vấn đề: (1) Students học cách viết 'AI-friendly' thay vì tốt thật, (2) AI bias: ưu tiên văn phong tây Âu, (3) Khó đánh giá: tư duy phản biện, sáng tạo, argument mới lạ. Giải pháp: AI chấm draft + giáo viên review final, AI như assistant không phải judge." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Dự đoán">
      <PredictionGate question="Lớp học 40 học sinh: 10 giỏi, 20 trung bình, 10 yếu. Giáo viên dạy chung 1 bài. Học sinh giỏi chán, học sinh yếu không hiểu. Giải pháp?" options={["Chia lớp nhỏ hơn", "AI Tutor cá nhân hoá: mỗi học sinh có 'lộ trình riêng' dựa trên trình độ, tốc độ, phong cách học", "Dạy chậm hơn cho tất cả"]} correct={1} explanation="AI Tutor = gia sư riêng cho TỪNG học sinh: (1) Diagnostic: biết em giỏi/yếu ở đâu, (2) Adaptive: nội dung thay đổi theo trình độ, (3) Pace: nhanh cho em giỏi, chậm và giải thích kỹ cho em yếu. Giống Brilliant.org, Khan Academy, Duolingo — nhưng cho MỌI môn học!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoảnh khắc Aha"><AhaMoment><p>Trước AI: 1 giáo viên / 40 học sinh = không thể cá nhân hoá. Với AI: <strong>mỗi học sinh có 1 gia sư riêng 24/7</strong>{" "}— biết em giỏi/yếu ở đâu, giải thích theo cách em hiểu, cho bài tập vừa sức. Đây là <strong>dân chủ hoá giáo dục</strong>: học sinh nông thôn Việt Nam có thể học với AI tutor tốt như học sinh Sài Gòn!</p></AhaMoment></LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thử thách"><InlineChallenge question="Học sinh dùng ChatGPT làm bài tập về nhà. Bài nộp đúng 100% nhưng học sinh KHÔNG HIỂU. Giáo viên nên làm gì?" options={["Cấm dùng AI", "Dạy cách DÙNG ĐÚNG: dùng AI để HIỂU (hỏi giải thích, check hiểu biết), không phải để COPY. Thay đổi format bài tập (oral, project, in-class)", "Bỏ bài tập về nhà"]} correct={1} explanation="Cấm AI = không thực tế và không chuẩn bị học sinh cho tương lai. Giải pháp: (1) Dạy 'AI literacy': dùng AI như tool, không như crutch, (2) Bài tập yêu cầu giải thích tư duy (oral defense), (3) In-class assessments, (4) Project-based learning. Giống máy tính: không cấm, mà dạy dùng!" /></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Lý thuyết"><ExplanationSection>
        <p><strong>AI in Education</strong>{" "}cá nhân hoá học tập, trợ lý giảng dạy, và chấm bài tự động — dân chủ hoá giáo dục.</p>
        <p><strong>4 ứng dụng chính:</strong></p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
          <li><strong>Adaptive Learning:</strong>{" "}Knowledge tracing → adaptive content (Brilliant, Khan Academy, Duolingo)</li>
          <li><strong>AI Tutoring:</strong>{" "}LLM giải thích 24/7, Socratic method, multi-modal (text + hình + video)</li>
          <li><strong>Auto Assessment:</strong>{" "}Chấm bài tự động (code, toán, essay draft). AI assist, không thay thế giáo viên</li>
          <li><strong>Content Generation:</strong>{" "}Tạo bài tập, đề thi, flashcards tự động theo trình độ</li>
        </ul>
        <Callout variant="tip" title="Knowledge Tracing">Bayesian Knowledge Tracing (BKT): model xác suất học sinh ĐÃ BIẾT concept X hay chưa dựa trên lịch sử trả lời. P(known|correct answers) tăng dần. Khi P lớn hơn 0.95 → mastered, chuyển concept mới. Đây là cơ chế đằng sau Duolingo, Khan Academy.</Callout>
        <LaTeX block>{"P(L_t | \\text{evidence}) = \\frac{P(\\text{evidence} | L_t) \\cdot P(L_t)}{P(\\text{evidence})} \\quad \\text{(Bayesian Knowledge Tracing)}"}</LaTeX>
        <Callout variant="info" title="EdTech Việt Nam">Miễn phí: app này (ai-edu)! Thương mại: ELSA (phát âm tiếng Anh — startup VN #1 EdTech), Vuihoc, Topica. Cơ hội lớn: 25 triệu học sinh VN cần cá nhân hoá. AI + tiếng Việt = thị trường chưa được khai thác nhiều.</Callout>
      </ExplanationSection></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tóm tắt"><MiniSummary points={["AI Tutor cá nhân hoá: diagnostic → adaptive content → pace riêng → 'gia sư 24/7' cho mỗi học sinh.", "LLM (ChatGPT/Claude) = 'gia sư' giải thích bất kỳ gì, bất kỳ lúc nào. Cần dạy dùng đúng.", "Knowledge Tracing: model biết học sinh ĐÃ BIẾT gì → cho bài tập VỪA SỨC.", "Auto-grading: tốt cho code/toán, cẩn thận cho essay (bias, hack, creativity).", "Dân chủ hoá giáo dục: học sinh nông thôn VN có thể học với AI tutor tốt như học sinh thành phố."]} /></LessonSection>
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiểm tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
