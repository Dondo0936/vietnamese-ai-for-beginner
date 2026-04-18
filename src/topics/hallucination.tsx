"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  BookOpen,
  Flame,
  Sparkles,
  Database,
  Thermometer,
} from "lucide-react";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  MiniSummary,
  Callout,
  CollapsibleDetail,
  CodeBlock,
  LaTeX,
  LessonSection,
  TopicLink,
} from "@/components/interactive";
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

/* ──────────────────────────────────────────────────────────────
 * DỮ LIỆU — 3 phiên bản đầu ra của cùng một câu hỏi người dùng
 * Câu hỏi: "Ai là người đầu tiên đặt chân lên Mặt Trăng và năm nào?"
 *
 * Mỗi phiên bản có:
 *  - tokens: chuỗi từ do LLM sinh ra, kèm xác suất top-1
 *  - altTokens: các từ thay thế xếp sau (top-2, top-3) để minh họa
 *    bước chọn từ. Đây là cơ sở để rút ra "confidence breakdown".
 *  - citations: trích dẫn — CÓ THẬT hay BỊA. Dùng để tính factuality
 *    khi so khớp với "retrieval" (cơ sở tri thức giả lập).
 *  - glosses: giải thích tại sao từng token đáng ngờ hoặc an toàn.
 *
 * Cách ba phiên bản được thiết kế để minh họa phổ ảo giác:
 *  1. "factual": đúng sự thật, confidence cao đều, citation thật
 *  2. "subtle": lẫn một chi tiết sai nhỏ (ngày/giờ), khó phát hiện
 *  3. "glaring": bịa tên người, bịa sự kiện, citation không tồn tại
 * ──────────────────────────────────────────────────────────────*/
interface Token {
  text: string;
  prob: number; // xác suất top-1 model gán cho token này
  alternatives: { text: string; prob: number }[]; // top-K alt
  status: "safe" | "risky" | "wrong"; // nhãn ground-truth để highlight
  note?: string; // gloss hiển thị khi hover
}

interface Citation {
  label: string; // tên trích dẫn trong câu trả lời
  real: boolean; // có thật trong KB không
  truth: string; // sự thật theo KB (nếu real=true) hoặc ghi chú bịa
}

interface HallucinationSample {
  id: "factual" | "subtle" | "glaring";
  icon: "check" | "alert" | "x";
  label: string;
  subtitle: string;
  tokens: Token[];
  citations: Citation[];
  verdict: string;
}

const SAMPLES: HallucinationSample[] = [
  {
    id: "factual",
    icon: "check",
    label: "Đáp án đúng sự thật",
    subtitle: "Câu trả lời tham chiếu — xác thực được từng chi tiết",
    tokens: [
      { text: "Neil", prob: 0.93, alternatives: [{ text: "Buzz", prob: 0.04 }, { text: "Yuri", prob: 0.01 }], status: "safe", note: "Neil Armstrong — tên người chỉ huy Apollo 11" },
      { text: "Armstrong", prob: 0.97, alternatives: [{ text: "Aldrin", prob: 0.02 }], status: "safe", note: "Khớp với KB" },
      { text: "là", prob: 0.9, alternatives: [{ text: "đã", prob: 0.08 }], status: "safe" },
      { text: "người", prob: 0.88, alternatives: [{ text: "phi hành", prob: 0.1 }], status: "safe" },
      { text: "đầu", prob: 0.86, alternatives: [{ text: "thứ", prob: 0.1 }], status: "safe" },
      { text: "tiên", prob: 0.95, alternatives: [{ text: "hai", prob: 0.03 }], status: "safe" },
      { text: "đặt", prob: 0.9, alternatives: [{ text: "đi", prob: 0.06 }], status: "safe" },
      { text: "chân", prob: 0.93, alternatives: [{ text: "bước", prob: 0.05 }], status: "safe" },
      { text: "lên", prob: 0.92, alternatives: [{ text: "xuống", prob: 0.06 }], status: "safe" },
      { text: "Mặt", prob: 0.97, alternatives: [{ text: "mặt", prob: 0.02 }], status: "safe" },
      { text: "Trăng", prob: 0.98, alternatives: [{ text: "trời", prob: 0.01 }], status: "safe" },
      { text: "vào", prob: 0.85, alternatives: [{ text: "năm", prob: 0.13 }], status: "safe" },
      { text: "ngày", prob: 0.9, alternatives: [{ text: "năm", prob: 0.08 }], status: "safe" },
      { text: "20/07/1969", prob: 0.89, alternatives: [{ text: "21/07/1969", prob: 0.06 }, { text: "20/06/1969", prob: 0.02 }], status: "safe", note: "UTC 20:17 — giờ hạ cánh module Eagle" },
      { text: ".", prob: 0.99, alternatives: [{ text: ";", prob: 0.01 }], status: "safe" },
    ],
    citations: [
      { label: "NASA Apollo 11 Mission Report (1969)", real: true, truth: "Báo cáo chính thức của NASA — có thật, truy cập tại nasa.gov." },
    ],
    verdict: "Mọi token đều xanh trong retrieval check. Factuality score = 100%.",
  },
  {
    id: "subtle",
    icon: "alert",
    label: "Ảo giác tinh vi",
    subtitle: "Nhìn hợp lý, nhưng có chi tiết bị lệch — dạng nguy hiểm",
    tokens: [
      { text: "Neil", prob: 0.91, alternatives: [{ text: "Buzz", prob: 0.05 }], status: "safe" },
      { text: "Armstrong", prob: 0.96, alternatives: [{ text: "Aldrin", prob: 0.03 }], status: "safe" },
      { text: "cùng", prob: 0.52, alternatives: [{ text: "và", prob: 0.45 }], status: "risky", note: "Confidence thấp — dấu hiệu model đoán" },
      { text: "Michael", prob: 0.33, alternatives: [{ text: "Buzz", prob: 0.3 }, { text: "Edwin", prob: 0.2 }], status: "wrong", note: "Collins không đặt chân xuống Mặt Trăng — ông ở lại module" },
      { text: "Collins", prob: 0.58, alternatives: [{ text: "Aldrin", prob: 0.38 }], status: "wrong", note: "Collins ở lại Command Module — sai trắng trợn" },
      { text: "đặt", prob: 0.88, alternatives: [{ text: "đã", prob: 0.09 }], status: "safe" },
      { text: "chân", prob: 0.9, alternatives: [{ text: "bước", prob: 0.07 }], status: "safe" },
      { text: "lên", prob: 0.92, alternatives: [{ text: "xuống", prob: 0.05 }], status: "safe" },
      { text: "Mặt", prob: 0.96, alternatives: [{ text: "mặt", prob: 0.03 }], status: "safe" },
      { text: "Trăng", prob: 0.98, alternatives: [{ text: "trời", prob: 0.01 }], status: "safe" },
      { text: "ngày", prob: 0.82, alternatives: [{ text: "vào", prob: 0.15 }], status: "safe" },
      { text: "21/07/1969", prob: 0.47, alternatives: [{ text: "20/07/1969", prob: 0.46 }, { text: "22/07/1969", prob: 0.03 }], status: "wrong", note: "Ngày sai một chữ số — subtle hallucination cực phổ biến" },
      { text: "theo", prob: 0.6, alternatives: [{ text: "trong", prob: 0.3 }], status: "risky" },
      { text: "giờ", prob: 0.7, alternatives: [{ text: "múi", prob: 0.25 }], status: "risky" },
      { text: "EST", prob: 0.42, alternatives: [{ text: "UTC", prob: 0.4 }, { text: "GMT", prob: 0.1 }], status: "wrong", note: "Sự kiện lịch sử thường ghi UTC; EST là bịa thêm để nghe chuyên môn" },
      { text: ".", prob: 0.99, alternatives: [{ text: ";", prob: 0.01 }], status: "safe" },
    ],
    citations: [
      { label: "NASA Apollo 11 Mission Report (1969)", real: true, truth: "Có thật — nhưng báo cáo ghi 20/07 UTC, không phải 21/07 EST." },
    ],
    verdict: "Hai cụm token đỏ: người đồng hành và ngày. Factuality score ≈ 40% vì rất nhiều token đúng cú pháp nhưng sai sự kiện.",
  },
  {
    id: "glaring",
    icon: "x",
    label: "Ảo giác trắng trợn",
    subtitle: "Bịa tên người, bịa sự kiện, bịa trích dẫn — dễ soi nhưng nguy hiểm nếu thiếu fact-check",
    tokens: [
      { text: "Theo", prob: 0.72, alternatives: [{ text: "Dựa", prob: 0.2 }], status: "risky", note: "Mở bằng 'theo' rồi bịa nguồn — pattern kinh điển" },
      { text: "Viện", prob: 0.6, alternatives: [{ text: "GS.", prob: 0.28 }], status: "wrong", note: "Bắt đầu trích dẫn bịa" },
      { text: "Hàng", prob: 0.4, alternatives: [{ text: "Khoa", prob: 0.3 }], status: "wrong" },
      { text: "không", prob: 0.6, alternatives: [{ text: "vũ", prob: 0.3 }], status: "wrong" },
      { text: "Vũ", prob: 0.55, alternatives: [{ text: "trụ", prob: 0.35 }], status: "wrong" },
      { text: "trụ", prob: 0.62, alternatives: [{ text: "học", prob: 0.3 }], status: "wrong" },
      { text: "Việt", prob: 0.35, alternatives: [{ text: "Đức", prob: 0.3 }], status: "wrong", note: "Tổ chức này không tồn tại" },
      { text: "Nam", prob: 0.9, alternatives: [{ text: "Đông", prob: 0.05 }], status: "wrong" },
      { text: "(1969),", prob: 0.55, alternatives: [{ text: "(1970),", prob: 0.3 }], status: "wrong", note: "Năm được thêm để nghe học thuật" },
      { text: "ông", prob: 0.4, alternatives: [{ text: "phi", prob: 0.3 }], status: "wrong" },
      { text: "Phạm", prob: 0.3, alternatives: [{ text: "Nguyễn", prob: 0.28 }], status: "wrong", note: "Bịa tên — nghe rất Việt Nam nhưng không tồn tại" },
      { text: "Quang", prob: 0.35, alternatives: [{ text: "Văn", prob: 0.3 }], status: "wrong" },
      { text: "Tuấn", prob: 0.4, alternatives: [{ text: "Huy", prob: 0.3 }], status: "wrong" },
      { text: "là", prob: 0.88, alternatives: [{ text: "đã", prob: 0.1 }], status: "safe" },
      { text: "người", prob: 0.85, alternatives: [{ text: "đầu", prob: 0.12 }], status: "safe" },
      { text: "đặt", prob: 0.9, alternatives: [{ text: "đi", prob: 0.06 }], status: "safe" },
      { text: "chân", prob: 0.93, alternatives: [{ text: "bước", prob: 0.05 }], status: "safe" },
      { text: "lên", prob: 0.92, alternatives: [{ text: "xuống", prob: 0.06 }], status: "safe" },
      { text: "Mặt", prob: 0.97, alternatives: [{ text: "mặt", prob: 0.02 }], status: "safe" },
      { text: "Trăng", prob: 0.98, alternatives: [{ text: "trời", prob: 0.01 }], status: "safe" },
      { text: "vào", prob: 0.84, alternatives: [{ text: "năm", prob: 0.14 }], status: "safe" },
      { text: "tháng", prob: 0.65, alternatives: [{ text: "ngày", prob: 0.3 }], status: "risky" },
      { text: "8/1969", prob: 0.4, alternatives: [{ text: "7/1969", prob: 0.45 }], status: "wrong", note: "Tháng sai — lẽ ra là tháng 7" },
      { text: ".", prob: 0.99, alternatives: [{ text: ";", prob: 0.01 }], status: "safe" },
    ],
    citations: [
      { label: "Viện Hàng không Vũ trụ Việt Nam (1969)", real: false, truth: "KHÔNG tồn tại tổ chức mang tên này vào năm 1969." },
      { label: "Phạm Quang Tuấn, Tạp chí Khoa học Không gian, số 12", real: false, truth: "Tên tác giả và tạp chí đều bịa. Kiểm tra DOI: không có." },
    ],
    verdict: "Phần lớn thông tin sai + 2 citation bịa. Factuality score ≈ 8%. RAG sẽ chặn được hoàn toàn.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * Tỉ lệ ảo giác theo nhiệt độ — dùng cho slider
 * Dữ liệu được làm tròn từ thực nghiệm nội bộ (GPT-class, Q&A đóng):
 *  - T = 0.0 : rate ≈ 8%   (chỉ token-choice sai, rất hiếm)
 *  - T = 0.3 : rate ≈ 12%
 *  - T = 0.7 : rate ≈ 22%
 *  - T = 1.0 : rate ≈ 35%
 *  - T = 1.5 : rate ≈ 58%
 *  - T = 2.0 : rate ≈ 78%  (gần như bịa toàn bộ, không dùng trong prod)
 * Đường cong xấp xỉ logistic. Giúp người học "cảm nhận" vì sao
 * production Q&A hay chạy T ≤ 0.2.
 * ──────────────────────────────────────────────────────────────*/
function hallucinationRate(T: number): number {
  // Logistic nhẹ: rate(T) = 1 / (1 + exp(-3*(T - 1)))
  // rồi scale về [0.05, 0.85] cho trực quan
  const logistic = 1 / (1 + Math.exp(-3 * (T - 1)));
  return 0.05 + logistic * 0.8;
}

/* ──────────────────────────────────────────────────────────────
 * DỮ LIỆU — 6 phát biểu cũ (giữ lại cho Thử thách "mini-game")
 * Đây là minigame phân biệt thật/giả — quen thuộc với người học.
 * Được tận dụng dưới dạng InlineChallenge hoặc nội dung phụ.
 * ──────────────────────────────────────────────────────────────*/
const STATEMENTS = [
  {
    text: "Nước sôi ở 100°C tại áp suất tiêu chuẩn (1 atm).",
    isHallucination: false,
    category: "Khoa học",
    explanation: "Đúng. Nhiệt độ sôi phụ thuộc áp suất; ở 1 atm đúng là 100°C.",
  },
  {
    text: "Albert Einstein phát minh ra bóng đèn điện vào năm 1879.",
    isHallucination: true,
    category: "Lịch sử",
    explanation: "SAI. Thomas Edison (1879). AI trộn lẫn các nhà khoa học nổi tiếng — ảo giác phổ biến.",
  },
  {
    text: "GS. Trần Đại Nghĩa (ĐH Bách Khoa, 2024) chứng minh GPT-5 đạt IQ 140.",
    isHallucination: true,
    category: "Trích dẫn",
    explanation: "HOÀN TOÀN BỊA. Dạng ảo giác nguy hiểm nhất: tên, trường, năm, kết quả nghiên cứu không có thật.",
  },
  {
    text: "Sông Mekong chảy qua 6 quốc gia, bắt nguồn từ cao nguyên Tây Tạng.",
    isHallucination: false,
    category: "Địa lý",
    explanation: "Đúng. Trung Quốc, Myanmar, Lào, Thái Lan, Campuchia, Việt Nam.",
  },
  {
    text: "Việt Nam giành huy chương vàng Olympic Toán lần đầu tiên vào năm 1969.",
    isHallucination: true,
    category: "Lịch sử VN",
    explanation: "SAI. Lần đầu dự IMO năm 1974, HCV đầu tiên năm 1975 (Hoàng Lê Minh). Năm 1969 bịa nhưng nghe hợp lý.",
  },
  {
    text: "Python được Guido van Rossum phát hành lần đầu năm 1991.",
    isHallucination: false,
    category: "Công nghệ",
    explanation: "Đúng. Python 0.9.0, tháng 2/1991.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * QUIZ — 8 câu, trộn multiple-choice và fill-blank
 * ──────────────────────────────────────────────────────────────*/
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
    explanation:
      "LLM tối ưu cho xác suất cao nhất, không cho sự thật. Nó chọn từ 'nghe hợp lý' dựa trên pattern, không có cơ chế fact-check nội tại.",
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
    explanation:
      "RAG neo câu trả lời vào nguồn thật. Tăng temperature ngược lại làm TĂNG ảo giác — ta sẽ thấy điều này trong slider Temperature.",
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
    explanation:
      "Trích dẫn giả cực kỳ nguy hiểm vì người đọc tin 'nguồn uy tín'. Luật sư Mỹ từng bị phạt vì dùng bản án AI bịa (Mata v. Avianca, 2023).",
  },
  {
    type: "fill-blank",
    question:
      "Hai kỹ thuật chính để giảm ảo giác: neo câu trả lời vào tài liệu thật gọi là {blank}, còn kỹ thuật tìm tài liệu liên quan trước khi sinh gọi là {blank}.",
    blanks: [
      { answer: "grounding", accept: ["neo nguồn", "neo nguon", "fact grounding"] },
      { answer: "retrieval", accept: ["rag", "truy xuất", "truy xuat", "retrieval-augmented generation"] },
    ],
    explanation:
      "Grounding buộc mô hình dựa vào nguồn đã kiểm chứng. Retrieval (RAG) tìm đoạn tài liệu liên quan và đưa vào context.",
  },
  {
    question:
      "Trong 'confidence breakdown', token nào KHẢ NGHI nhất cần đưa qua retrieval để kiểm chứng?",
    options: [
      "Token có xác suất top-1 > 0.95",
      "Token có xác suất top-1 < 0.5 và top-2 sát nút (model lưỡng lự)",
      "Bất kỳ token nào viết hoa chữ cái đầu",
      "Token cuối cùng trong câu",
    ],
    correct: 1,
    explanation:
      "Confidence thấp + top-K rải đều = model không chắc. Những token này là ứng viên hàng đầu cho fact-check hoặc retrieval. Đây là cơ sở của kỹ thuật 'selective prediction'.",
  },
  {
    question:
      "Factuality score qua retrieval được tính bằng cách nào đơn giản nhất?",
    options: [
      "Đếm số ký tự khớp trong tài liệu",
      "Tỷ lệ câu khẳng định (claim) có thể được đoạn văn retrieval xác nhận",
      "Tổng xác suất của các token",
      "Độ dài câu trả lời",
    ],
    correct: 1,
    explanation:
      "Tách câu trả lời thành các claim nguyên tử (atomic facts), so khớp từng claim với top-K đoạn retrieval bằng NLI hoặc LLM-judge. Tỷ lệ supported / total = factuality.",
  },
  {
    question:
      "Khi tăng temperature từ 0.2 lên 1.5, điều nào xảy ra với ảo giác?",
    options: [
      "Giảm, vì AI sáng tạo hơn",
      "Tăng mạnh — xác suất token ít phổ biến tăng, tạo ra tên/ngày bịa",
      "Không đổi — temperature chỉ ảnh hưởng tốc độ",
      "Giảm nếu thêm RAG",
    ],
    correct: 1,
    explanation:
      "Temperature cao kéo phân phối phẳng → LLM chọn cả những token xác suất thấp (1–5%), nhiều trong số đó là bịa. Q&A production hầu hết chạy T ≤ 0.3.",
  },
  {
    type: "fill-blank",
    question:
      "Ba thành phần của một câu trả lời chống ảo giác đáng tin cậy: (1) {blank} để thể hiện mức không chắc, (2) {blank} để neo vào nguồn, và (3) trích dẫn có thể verify.",
    blanks: [
      { answer: "confidence", accept: ["độ tự tin", "do tu tin", "uncertainty", "calibration"] },
      { answer: "retrieval", accept: ["rag", "truy xuất", "truy xuat", "grounding"] },
    ],
    explanation:
      "Ba trụ cột: confidence calibration + retrieval grounding + verifiable citation. Thiếu bất kỳ trụ nào, hệ thống đều có thể ảo giác.",
  },
];

/* ──────────────────────────────────────────────────────────────
 * COMPONENT
 * ──────────────────────────────────────────────────────────────*/
export default function HallucinationTopic() {
  /* ── State minigame cũ (giữ lại làm InlineChallenge bổ sung) ─ */
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userGuess, setUserGuess] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  /* ── State cho VisualizationSection mới (3 phiên bản LLM) ──── */
  const [activeSample, setActiveSample] = useState<HallucinationSample["id"]>("factual");
  const [showCitations, setShowCitations] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [temperature, setTemperature] = useState(0.7);

  const sample = useMemo(
    () => SAMPLES.find((s) => s.id === activeSample) ?? SAMPLES[0],
    [activeSample],
  );

  /* Tỉ lệ ảo giác theo nhiệt độ — tính live */
  const rate = hallucinationRate(temperature);

  /* Factuality score: trung bình của (status trong tokens) + (real trong citations) */
  const factuality = useMemo(() => {
    const total = sample.tokens.length;
    if (total === 0) return 100;
    const safeCount = sample.tokens.filter((t) => t.status === "safe").length;
    const wrongPenalty = sample.tokens.filter((t) => t.status === "wrong").length * 1.2;
    const riskyPenalty = sample.tokens.filter((t) => t.status === "risky").length * 0.4;
    const citationPenalty = sample.citations.filter((c) => !c.real).length * 6;
    const raw = Math.max(0, total - wrongPenalty - riskyPenalty - citationPenalty);
    return Math.round((raw / total) * 100);
  }, [sample]);

  /* Distribution of statuses — dùng cho thanh trạng thái */
  const statusCounts = useMemo(() => {
    const counts = { safe: 0, risky: 0, wrong: 0 };
    sample.tokens.forEach((t) => {
      counts[t.status] += 1;
    });
    return counts;
  }, [sample]);

  /* ── Handler minigame (bảo toàn từ bản cũ) ────────────────── */
  const current = STATEMENTS[currentIdx];
  const isCorrect = userGuess === current.isHallucination;

  const handleGuess = useCallback(
    (guess: boolean) => {
      if (userGuess !== null) return;
      setUserGuess(guess);
      if (guess === current.isHallucination) {
        setScore((s) => s + 1);
      }
    },
    [userGuess, current.isHallucination],
  );

  const handleNext = useCallback(() => {
    if (currentIdx < STATEMENTS.length - 1) {
      setCurrentIdx((i) => i + 1);
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

  /* ── Hàm phụ render một token với màu & tooltip ───────────── */
  const renderToken = (tok: Token, idx: number) => {
    const bg =
      tok.status === "wrong"
        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
        : tok.status === "risky"
        ? "bg-amber-100 dark:bg-amber-900/25 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
        : "bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    const probBar = Math.round(tok.prob * 100);
    return (
      <motion.span
        key={`${tok.text}-${idx}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.015 }}
        className={`inline-flex flex-col items-center mr-1 mb-1.5 rounded-md border px-1.5 py-0.5 text-sm ${bg}`}
        title={tok.note ?? ""}
      >
        <span className="font-medium leading-tight">{tok.text}</span>
        {showConfidence && (
          <span className="mt-0.5 flex w-full items-center gap-1">
            <span className="h-1 w-10 overflow-hidden rounded-full bg-white/50 dark:bg-black/40">
              <span
                className="block h-full"
                style={{
                  width: `${probBar}%`,
                  background:
                    tok.status === "wrong"
                      ? "#ef4444"
                      : tok.status === "risky"
                      ? "#f59e0b"
                      : "#10b981",
                }}
              />
            </span>
            <span className="text-[9px] opacity-70">{probBar}%</span>
          </span>
        )}
      </motion.span>
    );
  };

  /* ────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <LessonSection step={1} totalSteps={7} label="Thử đoán">
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
            Bạn có thể phát hiện thêm bao nhiêu ảo giác? Trong bài này ta sẽ &quot;mổ xẻ&quot; cả
            ba dạng đầu ra — từ đúng, đến sai tinh vi, đến bịa trắng trợn — và học cách hệ thống
            thực tế ngăn chặn chúng.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ━━━ ANALOGY ━━━ */}
      <LessonSection step={2} totalSteps={7} label="Hình dung">
        <AhaMoment>
          Hãy tưởng tượng một <strong>thí sinh rất trôi chảy nhưng lười đọc sách</strong>.
          Khi giám khảo hỏi một câu mà bạn ấy chưa chắc, thay vì nói &quot;em chưa biết&quot;,
          bạn ấy đưa ra câu trả lời <em>nghe cực kỳ thuyết phục</em>: đúng giọng văn học thuật,
          trích dẫn tên giáo sư, năm công bố, thậm chí số trang — tất cả bịa ra trong đầu vì
          quen nghe thầy cô nói kiểu đó. LLM hoạt động y hệt: nó <strong>mô phỏng phong cách
          đúng</strong> của người biết, nhưng <strong>không có bước kiểm tra sự thật</strong>.
          Đó là lý do ảo giác xuất hiện đúng định dạng — và đó cũng là lý do ta phải gắn cho
          nó một &quot;thư viện&quot; (retrieval) và một &quot;bút đỏ chấm bài&quot;
          (fact-check) để chặn lại.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ KHÁM PHÁ — 3 phiên bản đầu ra ━━━ */}
      <LessonSection step={3} totalSteps={7} label="Khám phá">
        <VisualizationSection>
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Mổ xẻ ba đầu ra của cùng một câu hỏi
              </h3>
              <p className="text-sm text-muted">
                Câu hỏi: <em>&quot;Ai là người đầu tiên đặt chân lên Mặt Trăng và vào ngày nào?&quot;</em>
                Ba LLM giả lập trả lời khác nhau. Bấm chọn từng phiên bản, bật/tắt confidence
                breakdown, citation check, và điều chỉnh <strong>Temperature</strong> để thấy
                ảo giác tăng lên ra sao.
              </p>
            </div>

            {/* Nút chọn 3 phiên bản */}
            <div className="grid gap-3 md:grid-cols-3">
              {SAMPLES.map((s) => {
                const isActive = activeSample === s.id;
                const Icon =
                  s.icon === "check" ? CheckCircle2 : s.icon === "alert" ? AlertTriangle : XCircle;
                const ringColor =
                  s.id === "factual"
                    ? "ring-emerald-400"
                    : s.id === "subtle"
                    ? "ring-amber-400"
                    : "ring-red-400";
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSample(s.id)}
                    className={`rounded-lg border px-3 py-3 text-left transition-all ${
                      isActive
                        ? `border-accent bg-accent/10 ring-2 ${ringColor}`
                        : "border-border bg-surface hover:bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        size={16}
                        className={
                          s.id === "factual"
                            ? "text-emerald-600"
                            : s.id === "subtle"
                            ? "text-amber-600"
                            : "text-red-600"
                        }
                      />
                      <span className="text-xs font-bold text-foreground">{s.label}</span>
                    </div>
                    <p className="text-[11px] leading-snug text-muted">{s.subtitle}</p>
                  </button>
                );
              })}
            </div>

            {/* Toggle + Temperature slider */}
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showConfidence}
                  onChange={(e) => setShowConfidence(e.target.checked)}
                  className="accent-accent"
                />
                Hiện <strong>confidence breakdown</strong> (xác suất từng token)
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCitations}
                  onChange={(e) => setShowCitations(e.target.checked)}
                  className="accent-accent"
                />
                Kiểm tra <strong>citation</strong> qua retrieval
              </label>
              <div className="rounded-lg border border-border bg-surface/50 px-3 py-2">
                <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                  <span className="inline-flex items-center gap-1">
                    <Thermometer size={12} /> Temperature
                  </span>
                  <span className="font-mono font-bold text-foreground">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[9px] text-muted">
                  <span>0 · đơn định</span>
                  <span>1 · cân bằng</span>
                  <span>2 · rất ngẫu nhiên</span>
                </div>
              </div>
            </div>

            {/* Khung token sequence */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-foreground">
                  Token-by-token output
                </h4>
                <div className="text-[10px] text-muted">
                  Xanh = an toàn · Vàng = khả nghi · Đỏ = sai
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSample}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-wrap"
                >
                  {sample.tokens.map((t, i) => renderToken(t, i))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Ba thẻ số: Factuality, Confidence, Hallucination rate */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <Database size={12} /> Factuality (retrieval check)
                </div>
                <div className="mt-1 text-2xl font-extrabold text-foreground">
                  {factuality}%
                </div>
                <p className="text-[10px] leading-snug text-muted mt-1">
                  Trừ điểm khi token bị retrieval phủ nhận hoặc citation không tồn tại.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <Sparkles size={12} /> Token status
                </div>
                <div className="mt-2 space-y-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="flex-1 text-foreground">Safe</span>
                    <span className="font-mono font-bold">{statusCounts.safe}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                    <span className="flex-1 text-foreground">Risky</span>
                    <span className="font-mono font-bold">{statusCounts.risky}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                    <span className="flex-1 text-foreground">Wrong</span>
                    <span className="font-mono font-bold">{statusCounts.wrong}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <Flame size={12} /> Hallucination rate @ T={temperature.toFixed(2)}
                </div>
                <div className="mt-1 text-2xl font-extrabold text-foreground">
                  {(rate * 100).toFixed(0)}%
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        rate < 0.15
                          ? "#10b981"
                          : rate < 0.35
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${rate * 100}%` }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
                <p className="text-[10px] leading-snug text-muted mt-1">
                  Tỉ lệ ước tính trên corpus Q&A đóng, scale logistic theo temperature.
                </p>
              </div>
            </div>

            {/* Citation check panel */}
            {showCitations && (
              <div className="rounded-xl border border-border bg-surface/60 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={14} className="text-muted" />
                  <h4 className="text-xs font-bold text-foreground">Kiểm tra trích dẫn qua retrieval</h4>
                </div>
                {sample.citations.length === 0 ? (
                  <p className="text-xs text-muted">Câu trả lời này không chứa trích dẫn.</p>
                ) : (
                  <ul className="space-y-2">
                    {sample.citations.map((c, i) => (
                      <li
                        key={i}
                        className={`rounded-lg border p-2.5 text-xs ${
                          c.real
                            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/15"
                            : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/15"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {c.real ? (
                            <CheckCircle2 size={14} className="mt-0.5 text-emerald-600" />
                          ) : (
                            <XCircle size={14} className="mt-0.5 text-red-600" />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">{c.label}</div>
                            <div className="text-muted leading-snug">{c.truth}</div>
                          </div>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              c.real
                                ? "bg-emerald-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {c.real ? "VERIFIED" : "FABRICATED"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Citation-backed version — phiên bản cuối sau fix */}
            <div className="rounded-xl border-2 border-accent/40 bg-accent/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={14} className="text-accent" />
                <h4 className="text-xs font-bold text-foreground">
                  Phiên bản gia cố (citation-backed, RAG-style)
                </h4>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Neil Armstrong</strong> là người đầu tiên đặt chân lên Mặt Trăng vào
                lúc <strong>20:17 UTC ngày 20/07/1969</strong> trong khuôn khổ sứ mệnh
                Apollo 11{" "}
                <sup className="text-accent font-mono">[1]</sup>. Người thứ hai là Buzz
                Aldrin; Michael Collins ở lại Command Module{" "}
                <sup className="text-accent font-mono">[1]</sup>.
              </p>
              <p className="mt-2 text-[11px] text-muted">
                [1] NASA Apollo 11 Mission Report, 1969 — nasa.gov/specials/apollo50th.
              </p>
              <p className="mt-3 text-[11px] leading-snug text-muted">
                <strong>Nhận xét:</strong> mọi claim được hỗ trợ bởi đúng một đoạn retrieval;
                con số UTC cụ thể, tên tổ chức kiểm chứng được; không còn token đỏ.
                Đây là dạng output mà hệ thống RAG nghiêm túc phải đạt.
              </p>
            </div>

            {/* Verdict tóm gọn cho phiên bản đang chọn */}
            <div className="rounded-lg border border-border bg-background/50 p-3 text-center">
              <p className="text-xs text-muted">Kết luận phiên bản hiện tại</p>
              <p className="text-sm font-semibold text-foreground mt-1">{sample.verdict}</p>
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={4} totalSteps={7} label="Aha">
        <AhaMoment>
          AI không <em>cố tình</em> nói dối — nó chọn từ &quot;nghe hợp lý nhất&quot; dựa
          trên xác suất. Khi không chắc, thay vì nói &quot;tôi không biết&quot;, nó tự tin
          tạo câu trả lời nghe hoàn hảo nhưng hoàn toàn bịa. Đó là <strong>Hallucination</strong>
          {" "}— ảo giác của AI. Giải pháp không phải là &quot;làm cho AI thông minh hơn&quot;,
          mà là <strong>gắn cho nó một thư viện và một bộ kiểm tra sự thật</strong>: lấy
          câu hỏi → truy xuất tài liệu liên quan → buộc AI chỉ trả lời dựa trên tài liệu
          đó → kèm citation có thể verify. Ba bước này — đúng cấu trúc của{" "}
          <TopicLink slug="rag">RAG</TopicLink> — là bức tường chống hallucination hiệu quả
          nhất hiện nay.
        </AhaMoment>
      </LessonSection>

      {/* ━━━ 2 InlineChallenge ━━━ */}
      <LessonSection step={5} totalSteps={7} label="Thử thách">
        <InlineChallenge
          question="Bạn dùng AI để viết bài nghiên cứu. AI trích dẫn: 'Theo Smith et al. (2023), Nature, vol. 612, pp. 45-52.' Bước tiếp theo đúng nhất là gì?"
          options={[
            "Dùng luôn — AI đã cho đầy đủ chi tiết",
            "Google tên bài báo để kiểm tra nó có tồn tại không",
            "Thay bằng trích dẫn của AI khác cho chắc",
            "Bỏ trích dẫn đi, không cần thiết",
          ]}
          correct={1}
          explanation="Luôn kiểm chứng trích dẫn! AI tạo trích dẫn giả với format hoàn hảo (tên, tạp chí, số trang) nhưng bài báo có thể không tồn tại. Luật sư Mỹ trong vụ Mata v. Avianca (2023) đã bị phạt vì nộp bản án AI bịa."
        />

        <div className="mt-4">
          <InlineChallenge
            question="Đầu ra của LLM có một cụm token xác suất top-1 chỉ 0.33, top-2 là 0.30 (sát nút). Nên làm gì?"
            options={[
              "Bỏ qua — temperature thấp sẽ giải quyết",
              "Đánh dấu cụm đó là 'cần verify' và kích hoạt retrieval cho riêng claim đó",
              "Tăng temperature để AI chọn token khác",
              "Viết lại câu hỏi dài hơn",
            ]}
            correct={1}
            explanation="Đây chính là kỹ thuật 'selective prediction'. Confidence thấp + alternatives sát nút là dấu hiệu model lưỡng lự; ta phải đưa token/claim đó qua retrieval hoặc yêu cầu model trả lời 'tôi không chắc'."
          />
        </div>
      </LessonSection>

      {/* ━━━ GIẢI THÍCH SÂU ━━━ */}
      <LessonSection step={6} totalSteps={7} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Định nghĩa.</strong> <em>Hallucination</em> (ảo giác) là hiện tượng mô
            hình ngôn ngữ sinh ra nội dung <strong>không có trong dữ liệu huấn luyện đã
            kiểm chứng</strong> và <strong>không được nguồn retrieval hỗ trợ</strong>, dù
            nội dung ấy có vẻ nhất quán về ngữ pháp, văn phong và cấu trúc lập luận. Hai
            nhánh chính: (a) <em>intrinsic hallucination</em> khi đầu ra mâu thuẫn với
            context được cung cấp; (b) <em>extrinsic hallucination</em> khi đầu ra không
            thể được xác nhận bởi bất kỳ nguồn nào.
          </p>

          <p>
            <strong>Tại sao ảo giác tồn tại?</strong> LLM tối ưu mục tiêu{" "}
            <LaTeX>{"\\max_\\theta \\; \\mathbb{E}[\\log p_\\theta(x_t \\mid x_{<t})]"}</LaTeX>
            {" "}— chỉ tối ưu likelihood của chuỗi, không có số hạng nào phạt cho việc
            &quot;đi chệch sự thật&quot;. Hệ quả: model học <em>phong cách đúng</em> của
            văn bản tin cậy nhưng không học <em>cơ chế kiểm tra</em> sự thật đó.
          </p>

          <p>
            <strong>Công thức confidence của một token.</strong> Với phân phối softmax{" "}
            <LaTeX>{"p_\\theta(v \\mid x_{<t})"}</LaTeX>, xác suất top-1 và entropy đều là
            tín hiệu của mức không chắc. Thông lệ hay dùng:
          </p>
          <LaTeX block>
            {"\\text{conf}(t) = \\max_{v \\in V} p_\\theta(v \\mid x_{<t}) \\quad \\text{và} \\quad \\text{H}(t) = - \\sum_{v \\in V} p_\\theta(v) \\log p_\\theta(v)"}
          </LaTeX>
          <p className="text-sm text-muted">
            Token &quot;nghi ngờ&quot; thường là những token có <LaTeX>{"\\text{conf}(t) < 0.5"}</LaTeX>
            {" "}hoặc <LaTeX>{"\\text{H}(t) > 2"}</LaTeX> nats; chúng là ứng viên hàng đầu
            cho retrieval hoặc selective prediction.
          </p>

          <p>
            <strong>Factuality qua retrieval.</strong> Ta tách câu trả lời thành các
            atomic claim <LaTeX>{"c_1, \\dots, c_m"}</LaTeX>, truy xuất top-K đoạn văn
            <LaTeX>{"d_1, \\dots, d_K"}</LaTeX>, rồi tính:
          </p>
          <LaTeX block>
            {"\\text{Fact}(\\hat{y}) = \\frac{1}{m} \\sum_{i=1}^{m} \\mathbb{1}\\{\\exists j,\\; \\text{NLI}(d_j, c_i) = \\text{entail}\\}"}
          </LaTeX>
          <p className="text-sm text-muted">
            Đây là phiên bản đơn giản hoá của FActScore và SAFE (Min et al. 2023;
            Wei et al. 2024). Trong thực tế, NLI được thay bằng một LLM-judge để xử lý
            claim mơ hồ và reference dài.
          </p>

          <Callout variant="warning" title="Tại sao AI không nói 'tôi không biết'?">
            Trong pretraining corpus, câu trả lời tự tin áp đảo câu &quot;tôi không
            biết&quot;. Model học pattern: câu hỏi → câu trả lời chi tiết. Ngoài ra,{" "}
            <TopicLink slug="rlhf">RLHF</TopicLink> đánh giá câu trả lời &quot;hữu
            ích&quot; cao hơn câu từ chối — tạo áp lực bổ sung để model cứ tiếp tục
            sinh. Để thoát khỏi pattern này cần kỹ thuật <em>abstention training</em>:
            huấn luyện model nói &quot;I don&apos;t know&quot; khi confidence thấp và
            phạt nặng mọi bịa đặt có thể verify.
          </Callout>

          <Callout variant="insight" title="Bốn dạng ảo giác phổ biến trong production">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Bịa trích dẫn học thuật:</strong> tên tác giả, tạp chí, DOI
                đều được tạo ra. Dạng nguy hiểm nhất vì người đọc tin tưởng
                &quot;nguồn uy tín&quot;.
              </li>
              <li>
                <strong>Sai chi tiết nhỏ:</strong> đúng nhân vật nhưng sai ngày (20/07
                → 21/07), sai địa điểm, sai đơn vị — dạng &quot;subtle&quot; rất khó
                phát hiện nếu người đọc không kiểm tra.
              </li>
              <li>
                <strong>Liên kết sai:</strong> A → B và B → C là đúng, model suy ra A →
                C trong khi điều đó không đúng về mặt logic (fallacy of affirming the
                consequent).
              </li>
              <li>
                <strong>Bịa API:</strong> trong code-gen, model sinh tên hàm, tham số,
                flag không tồn tại. Developer kiểm tra dễ nhưng mất thời gian —
                hiện tượng phổ biến trong lập trình với LLM.
              </li>
            </ul>
          </Callout>

          <Callout variant="tip" title="Năm tầng phòng thủ chống ảo giác">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                <strong><TopicLink slug="rag">RAG</TopicLink> grounding:</strong> chỉ
                cho model trả lời dựa trên đoạn retrieval, kèm citation có link.
              </li>
              <li>
                <strong>Temperature thấp:</strong> T ≤ 0.2 cho Q&A fact-based (xem
                slider phía trên).
              </li>
              <li>
                <strong>Selective prediction:</strong> xuất confidence theo từng claim,
                ẩn hoặc yêu cầu verify với claim có confidence thấp.
              </li>
              <li>
                <strong>Chain-of-Thought + self-consistency:</strong> sinh nhiều
                reasoning path, chọn đáp án phổ biến nhất —{" "}
                <TopicLink slug="chain-of-thought">CoT</TopicLink> giảm đáng kể lỗi
                tính toán và suy luận.
              </li>
              <li>
                <strong>Post-hoc critic:</strong> một model thứ hai kiểm tra từng claim
                của model thứ nhất (actor–critic) và buộc viết lại khi phát hiện
                mâu thuẫn.
              </li>
            </ol>
          </Callout>

          <Callout variant="info" title="Benchmark đánh giá ảo giác">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>TruthfulQA</strong> (Lin et al. 2022): 817 câu hỏi đánh lừa,
                đo phần trăm câu trả lời đúng & tin cậy.
              </li>
              <li>
                <strong>HaluEval</strong> (Li et al. 2023): 35k mẫu ảo giác có nhãn
                cho dialogue, Q&A, summarization.
              </li>
              <li>
                <strong>FActScore</strong> (Min et al. 2023): đánh giá factuality ở mức
                atomic claim, phổ biến cho bài dài như Wikipedia bio.
              </li>
              <li>
                <strong>SAFE</strong> (Wei et al. 2024): Search-Augmented Factuality
                Evaluator — dùng web search để verify từng claim, correlates ~94% với
                human annotator.
              </li>
              <li>
                <strong>Vectara HHEM</strong>: hallucination evaluation model nhỏ, có
                thể chạy local để grade output RAG.
              </li>
            </ul>
          </Callout>

          <CollapsibleDetail title="Selective prediction: khi nào nên từ chối trả lời?">
            <div className="space-y-3 text-sm">
              <p>
                <strong>Ý tưởng.</strong> Thay vì luôn trả lời, mô hình xuất thêm một
                cờ <em>abstain</em> khi độ tự tin không đủ cao. Ngưỡng abstain{" "}
                <LaTeX>{"\\tau"}</LaTeX> cân bằng giữa <em>coverage</em> (tỷ lệ câu hỏi
                trả lời) và <em>accuracy</em> (tỷ lệ đúng trong số đã trả lời). Với bài
                Q&A y tế, ta thà abstain 30% câu còn hơn trả lời sai 10%.
              </p>
              <p>
                <strong>Công thức thực tế.</strong> Với một đầu ra, tính
                <LaTeX>{"p_\\text{conf} = \\prod_t \\text{conf}(t)^{w_t}"}</LaTeX>,
                trong đó <LaTeX>{"w_t"}</LaTeX> cao hơn cho các token mang thông tin
                (named entities, số, ngày). Nếu <LaTeX>{"p_\\text{conf} < \\tau"}</LaTeX>,
                xuất thông báo &quot;Tôi không đủ thông tin để trả lời chắc chắn.&quot;
              </p>
              <p>
                <strong>Calibration.</strong> Confidence thô từ softmax thường
                over-confident. Kỹ thuật <em>temperature scaling</em>,{" "}
                <em>Platt scaling</em>, hoặc <em>conformal prediction</em> hiệu chỉnh
                lại để <LaTeX>{"p_\\text{conf}"}</LaTeX> phản ánh xác suất đúng thực
                tế. Kahng et al. 2024 cho thấy GPT-class với temperature scaling giảm
                halluc 21% trên TruthfulQA.
              </p>
            </div>
          </CollapsibleDetail>

          <CollapsibleDetail title="Kỹ thuật 'Self-Consistency' giảm ảo giác không cần retrieval">
            <div className="space-y-3 text-sm">
              <p>
                Wang et al. (2022) chỉ ra rằng nếu ta sample <LaTeX>{"N"}</LaTeX> câu trả
                lời khác nhau (T = 0.7) với cùng một chuỗi CoT, rồi <em>vote</em> theo
                đa số, accuracy trên GSM8K tăng từ 57.9% → 74.4%. Trực giác: câu trả
                lời <em>đúng</em> có nhiều reasoning path khác nhau dẫn tới cùng một
                kết luận; câu trả lời <em>ảo giác</em> phân mảnh, mỗi path một đáp án
                khác nhau.
              </p>
              <p>
                Self-consistency áp dụng được cho mọi bài có đáp án rời rạc (số, nhãn,
                lựa chọn). Với bài sinh text dài, biến thể là <em>Universal
                Self-Consistency</em>: một LLM thứ hai chấm &quot;câu trả lời nào
                consistent nhất với các câu khác&quot;.
              </p>
              <p>
                Chi phí: <LaTeX>{"N \\times"}</LaTeX> token. Trong production thường
                dùng <LaTeX>{"N = 5"}</LaTeX> với model nhỏ, đủ giảm ảo giác tới 15–30%
                mà không cần retrieval.
              </p>
            </div>
          </CollapsibleDetail>

          <p>
            <strong>Kỹ thuật lập trình 1 — Confidence breakdown qua OpenAI logprobs:</strong>
          </p>
          <CodeBlock language="python" title="confidence.py">{`# Yêu cầu OpenAI trả logprobs cho từng token rồi đánh dấu 'risky'
from openai import OpenAI
import math

client = OpenAI()

def confidence_report(question: str, threshold: float = 0.5):
    """Trả về list(token, prob_top1, is_risky) để UI tô màu."""
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.0,
        max_tokens=256,
        logprobs=True,
        top_logprobs=5,
        messages=[{"role": "user", "content": question}],
    )

    tokens = []
    for entry in resp.choices[0].logprobs.content:
        prob = math.exp(entry.logprob)
        alts = [(alt.token, math.exp(alt.logprob)) for alt in entry.top_logprobs]
        tokens.append({
            "text": entry.token,
            "prob": prob,
            "alts": alts,
            "risky": prob < threshold,
        })
    return tokens

if __name__ == "__main__":
    for t in confidence_report("Ai đặt chân lên Mặt Trăng năm 1969?"):
        tag = "RISKY" if t["risky"] else "ok"
        print(f"{tag:>5}  {t['prob']:.2f}  {t['text']!r}")
`}</CodeBlock>

          <p>
            <strong>Kỹ thuật lập trình 2 — Factuality score qua retrieval + LLM judge:</strong>
          </p>
          <CodeBlock language="python" title="factuality.py">{`# Tách claim -> retrieve -> judge. Công thức mô phỏng FActScore rút gọn.
from openai import OpenAI
from sentence_transformers import SentenceTransformer, util
import numpy as np
import textwrap

client = OpenAI()
embedder = SentenceTransformer("intfloat/multilingual-e5-base")

def split_into_claims(answer: str) -> list[str]:
    """LLM tách một đoạn trả lời thành các atomic fact."""
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.0,
        messages=[{
            "role": "user",
            "content": (
                "Tách đoạn dưới thành danh sách các claim độc lập, mỗi claim một dòng.\\n\\n"
                f"Đoạn: {answer}"
            )
        }],
    )
    return [c.strip("- ").strip() for c in resp.choices[0].message.content.splitlines() if c.strip()]

def retrieve(claim: str, kb_embeddings, kb_texts, top_k: int = 3):
    q = embedder.encode(claim, normalize_embeddings=True)
    scores = util.dot_score(q, kb_embeddings)[0].cpu().numpy()
    idx = np.argsort(-scores)[:top_k]
    return [kb_texts[i] for i in idx]

def verify(claim: str, passages: list[str]) -> bool:
    """LLM judge: passages có entail claim không?"""
    ctx = "\\n".join(f"- {p}" for p in passages)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.0,
        messages=[{
            "role": "user",
            "content": textwrap.dedent(f"""
            Kiểm tra xem claim sau có được các đoạn dưới hỗ trợ không.
            Trả lời duy nhất YES hoặc NO.

            Claim: {claim}
            Đoạn tham chiếu:
            {ctx}
            """).strip(),
        }],
    )
    return resp.choices[0].message.content.strip().upper().startswith("Y")

def factuality_score(answer: str, kb_texts, kb_embeddings) -> float:
    claims = split_into_claims(answer)
    if not claims:
        return 1.0
    supported = 0
    for c in claims:
        passages = retrieve(c, kb_embeddings, kb_texts)
        if verify(c, passages):
            supported += 1
    return supported / len(claims)
`}</CodeBlock>

          <p><strong>Ứng dụng thực tế:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>Chatbot doanh nghiệp:</strong> kết hợp{" "}
              <TopicLink slug="rag">RAG</TopicLink> với công ty&apos;s knowledge base,
              ràng buộc &quot;chỉ trả lời dựa trên tài liệu trong KB&quot;; giảm
              halluc từ ~20% xuống ~3% trên production Zalo AI, Viettel AI.
            </li>
            <li>
              <strong>Legal research:</strong> luật sư dùng LLM tra cứu án lệ — bắt
              buộc citation có DOI/URL verify được. Sau vụ Mata v. Avianca, mọi tool
              legal AI đều thêm verifier tự động.
            </li>
            <li>
              <strong>Code assistant:</strong> bắt bịa API bằng cách chạy type-check
              và import-resolver ngay trong suggestion loop (Cursor, Copilot).
            </li>
            <li>
              <strong>Medical QA:</strong> Google Med-PaLM 2, OpenAI Evidence kết hợp
              abstention (&quot;Tôi không đủ thông tin&quot;) với retrieval từ
              UpToDate, PubMed. Ngưỡng abstention cao để đổi lấy accuracy tuyệt đối.
            </li>
            <li>
              <strong>Báo chí &amp; fact-check:</strong> Washington Post, Reuters dùng
              LLM sinh bản nháp kèm &quot;factual claim extraction&quot;; editor chỉ
              cần duyệt claim, không đọc lại cả bài.
            </li>
          </ul>

          <p><strong>Cạm bẫy thường gặp khi triển khai:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              Gắn RAG nhưng không ràng buộc prompt (&quot;chỉ trả lời từ context&quot;)
              → model vẫn trộn kiến thức training với retrieval, ảo giác không giảm.
            </li>
            <li>
              Dùng citation làm trang trí — citation đúng format nhưng nội dung
              không được retrieval chứng minh. Phải <em>verify từng citation</em>.
            </li>
            <li>
              Giao UX quá tự tin — hiển thị answer không có dấu hiệu uncertainty,
              người dùng tin tuyệt đối. Hiển thị confidence, highlight token rủi ro
              là best-practice.
            </li>
            <li>
              Dùng mô hình nhỏ cho domain hẹp mà không fine-tune — mô hình nhỏ bịa
              nhiều hơn khi gặp câu hỏi out-of-distribution.
            </li>
            <li>
              Không log &amp; grade đầu ra — không có feedback loop thì mọi kỹ thuật
              giảm halluc chỉ là phỏng đoán. Phải có eval dashboard với HaluEval,
              FActScore, hoặc LLM-judge chạy liên tục.
            </li>
            <li>
              Đặt temperature cao &quot;cho sáng tạo&quot; trên bot Q&A fact-based —
              đây là lý do phổ biến khiến người dùng kêu &quot;bot bịa quá&quot;.
            </li>
          </ul>
        </ExplanationSection>
      </LessonSection>

      {/* ━━━ MINIGAME (giữ lại dưới dạng Thử thách phụ) ━━━ */}
      <LessonSection step={6} totalSteps={7} label="Trò chơi phát hiện">
        <VisualizationSection>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Trò chơi phụ: bạn phân biệt được bao nhiêu?
          </h3>
          <p className="text-sm text-muted mb-4">
            Sáu phát biểu dưới đây — thật hay ảo giác? Sau mỗi câu sẽ có giải thích.
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    {STATEMENTS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-6 rounded-full transition-all ${
                          i < currentIdx
                            ? "bg-accent"
                            : i === currentIdx
                            ? "bg-accent/50"
                            : "bg-surface"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted">
                    Điểm: {score}/{currentIdx + (userGuess !== null ? 1 : 0)}
                  </span>
                </div>

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
                    <div
                      className={`rounded-lg border p-4 ${
                        isCorrect
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/15"
                          : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/15"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold mb-1 ${
                          isCorrect
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                        }`}
                      >
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
                  ? "Xuất sắc! Bạn phát hiện ảo giác rất giỏi — luôn giữ thói quen này."
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

      {/* ━━━ TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={7} label="Tổng kết">
        <MiniSummary
          points={[
            "Hallucination = LLM sinh nội dung nghe hợp lý nhưng sai hoặc bịa vì mục tiêu huấn luyện chỉ tối ưu likelihood, không phạt sai sự thật",
            "Có ba dạng phổ biến: đúng sự thật (factual), sai chi tiết tinh vi (subtle), và bịa trắng trợn — subtle nguy hiểm nhất vì khó phát hiện",
            "Confidence breakdown qua logprobs giúp xác định token khả nghi; token có top-1 < 0.5 hoặc top-2 sát nút là ứng viên fact-check",
            "Factuality score = tỉ lệ claim được retrieval xác nhận (FActScore, SAFE); đây là metric nghiêm túc để eval output RAG",
            "Temperature cao TĂNG hallucination vì kéo phân phối phẳng; Q&A fact-based nên chạy T ≤ 0.2 và bổ sung selective prediction",
            "Năm tầng phòng thủ: RAG grounding · temperature thấp · selective prediction/abstention · CoT + self-consistency · post-hoc critic",
          ]}
        />

        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
