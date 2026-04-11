"use client";
import { useMemo } from "react";
import { PredictionGate, LessonSection, AhaMoment, InlineChallenge, MiniSummary, Callout, CodeBlock, LaTeX } from "@/components/interactive";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

export const metadata: TopicMeta = { slug: "ai-in-education", title: "AI in Education", titleVi: "AI trong Giao duc", description: "Ung dung AI trong ca nhan hoa hoc tap, cham bai tu dong va tro ly giang day thong minh", category: "applied-ai", tags: ["personalization", "tutoring", "assessment"], difficulty: "beginner", relatedSlugs: ["llm-overview", "rag", "recommendation-systems"], vizType: "interactive" };

const TOTAL_STEPS = 7;
export default function AIInEducationTopic() {
  const quizQuestions: QuizQuestion[] = useMemo(() => [
    { question: "AI Tutor ca nhan hoa hoc tap bang cach nao?", options: ["Day giong nhau cho tat ca", "Do luong trinh do hoc sinh (diagnostic) → dieu chinh noi dung (adaptive) → giai thich theo phong cach hoc → practice theo diem yeu", "Chi cham diem"], correct: 1, explanation: "Knowledge tracing: AI biet hoc sinh BIET GI va CHUA BIET GI (nhu game RPG skill tree). Bai tap adaptive: biet yeu toan → cho nhieu bai toan. Giai thich: hoc sinh thich vi du → cho nhieu vi du. Toc do: nhanh → tang kho. Cham → giang lai. Giong gia su rieng 1-1!" },
    { question: "LLM (ChatGPT/Claude) thay doi giao duc the nao?", options: ["Thay the giao vien", "LLM la 'gia su 24/7': giai thich bat ky cau hoi, bat ky luc nao, bat ky cach nao. Nhung can huong dan su dung dung de tranh dependency va plagiarism", "Khong anh huong"], correct: 1, explanation: "LLM: (1) Giai thich khai niem bang nhieu cach (vi du, bang so sanh, hinh anh), (2) Tra loi cau hoi 24/7, (3) Kiem tra hieu biet (Socratic method), (4) Dich/tom tat tai lieu. Nhung: can day hoc sinh DUNG dung (khong copy), VERIFY (AI co the sai), va phat trien TU DUY (khong dependency)." },
    { question: "Auto-grading essay bang AI co van de gi?", options: ["Cham chinh xac 100%", "AI khac co the bi hack (writing to please AI), co the bias, va kho danh gia sang tao/tu duy phan bien", "Khong co van de"], correct: 1, explanation: "Van de: (1) Students hoc cach viet 'AI-friendly' thay vi tot that, (2) AI bias: uu tien van phong tay Au, (3) Kho danh gia: tu duy phan bien, sang tao, argument moi la. Giai phap: AI cham draft + giao vien review final, AI nhu assistant khong phai judge." },
  ], []);

  return (
    <><LessonSection step={1} totalSteps={TOTAL_STEPS} label="Du doan">
      <PredictionGate question="Lop hoc 40 hoc sinh: 10 gioi, 20 trung binh, 10 yeu. Giao vien day chung 1 bai. Hoc sinh gioi chan, hoc sinh yeu khong hieu. Giai phap?" options={["Chia lop nho hon", "AI Tutor ca nhan hoa: moi hoc sinh co 'lo trinh rieng' dua tren trinh do, toc do, phong cach hoc", "Day cham hon cho tat ca"]} correct={1} explanation="AI Tutor = gia su rieng cho TUNG hoc sinh: (1) Diagnostic: biet em gioi/yeu o dau, (2) Adaptive: noi dung thay doi theo trinh do, (3) Pace: nhanh cho em gioi, cham va giai thich ky cho em yeu. Giong Brilliant.org, Khan Academy, Duolingo — nhung cho MOI mon hoc!">

      <LessonSection step={2} totalSteps={TOTAL_STEPS} label="Khoanh khac Aha"><AhaMoment><p>Truoc AI: 1 giao vien / 40 hoc sinh = khong the ca nhan hoa. Voi AI: <strong>moi hoc sinh co 1 gia su rieng 24/7</strong>{" "}— biet em gioi/yeu o dau, giai thich theo cach em hieu, cho bai tap vua suc. Day la <strong>dan chu hoa giao duc</strong>: hoc sinh nong thon Viet Nam co the hoc voi AI tutor tot nhu hoc sinh Sai Gon!</p></AhaMoment></LessonSection>

      <LessonSection step={3} totalSteps={TOTAL_STEPS} label="Thu thach"><InlineChallenge question="Hoc sinh dung ChatGPT lam bai tap ve nha. Bai nop dung 100% nhung hoc sinh KHONG HIEU. Giao vien nen lam gi?" options={["Cam dung AI", "Day cach DUNG DUNG: dung AI de HIEU (hoi giai thich, check hieu biet), khong phai de COPY. Thay doi format bai tap (oral, project, in-class)", "Bo bai tap ve nha"]} correct={1} explanation="Cam AI = khong thuc te va khong chuan bi hoc sinh cho tuong lai. Giai phap: (1) Day 'AI literacy': dung AI nhu tool, khong nhu crutch, (2) Bai tap yeu cau giai thich tu duy (oral defense), (3) In-class assessments, (4) Project-based learning. Giong may tinh: khong cam, ma day dung!" /></LessonSection>

      <LessonSection step={4} totalSteps={TOTAL_STEPS} label="Ly thuyet"><ExplanationSection>
        <p><strong>AI in Education</strong>{" "}ca nhan hoa hoc tap, tro ly giang day, va cham bai tu dong — dan chu hoa giao duc.</p>
        <p><strong>4 ung dung chinh:</strong></p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
          <li><strong>Adaptive Learning:</strong>{" "}Knowledge tracing → adaptive content (Brilliant, Khan Academy, Duolingo)</li>
          <li><strong>AI Tutoring:</strong>{" "}LLM giai thich 24/7, Socratic method, multi-modal (text + hinh + video)</li>
          <li><strong>Auto Assessment:</strong>{" "}Cham bai tu dong (code, toan, essay draft). AI assist, khong thay the giao vien</li>
          <li><strong>Content Generation:</strong>{" "}Tao bai tap, de thi, flashcards tu dong theo trinh do</li>
        </ul>
        <Callout variant="tip" title="Knowledge Tracing">Bayesian Knowledge Tracing (BKT): model xac suat hoc sinh DA BIET concept X hay chua dua tren lich su tra loi. P(known|correct answers) tang dan. Khi P lớn hơn 0.95 → mastered, chuyen concept moi. Day la co che dang sau Duolingo, Khan Academy.</Callout>
        <LaTeX block>{"P(L_t | \\text{evidence}) = \\frac{P(\\text{evidence} | L_t) \\cdot P(L_t)}{P(\\text{evidence})} \\quad \\text{(Bayesian Knowledge Tracing)}"}</LaTeX>
        <Callout variant="info" title="EdTech Viet Nam">Mien phi: app nay (ai-edu)! Thuong mai: ELSA (phat am tieng Anh — startup VN #1 EdTech), Vuihoc, Topica. Co hoi lon: 25 trieu hoc sinh VN can ca nhan hoa. AI + tieng Viet = thi truong chua duoc khai thac nhieu.</Callout>
      </ExplanationSection></LessonSection>

      <LessonSection step={5} totalSteps={TOTAL_STEPS} label="Tom tat"><MiniSummary points={["AI Tutor ca nhan hoa: diagnostic → adaptive content → pace rieng → 'gia su 24/7' cho moi hoc sinh.", "LLM (ChatGPT/Claude) = 'gia su' giai thich bat ky gi, bat ky luc nao. Can day dung dung.", "Knowledge Tracing: model biet hoc sinh DA BIET gi → cho bai tap VUA SUC.", "Auto-grading: tot cho code/toan, can than cho essay (bias, hack, creativity).", "Dan chu hoa giao duc: hoc sinh nong thon VN co the hoc voi AI tutor tot nhu hoc sinh thanh pho."]} /></LessonSection>
      <LessonSection step={6} totalSteps={TOTAL_STEPS} label="Kiem tra"><QuizSection questions={quizQuestions} /></LessonSection>
      </PredictionGate></LessonSection>
    </>
  );
}
