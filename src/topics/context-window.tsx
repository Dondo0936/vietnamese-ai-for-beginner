"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PredictionGate,
  AhaMoment,
  InlineChallenge,
  Callout,
  CollapsibleDetail,
  MiniSummary,
  CodeBlock,
  LessonSection,
  LaTeX,
  TopicLink,
  ProgressSteps,
} from "@/components/interactive";
import VisualizationSection from "@/components/topic/VisualizationSection";
import ExplanationSection from "@/components/topic/ExplanationSection";
import QuizSection from "@/components/topic/QuizSection";
import type { QuizQuestion } from "@/components/topic/QuizSection";
import type { TopicMeta } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────
// METADATA — giữ nguyên để registry không phải thay đổi
// ─────────────────────────────────────────────────────────────────────
export const metadata: TopicMeta = {
  slug: "context-window",
  title: "Context Window",
  titleVi: "Cửa sổ ngữ cảnh",
  description:
    "Giới hạn số lượng token mà mô hình có thể xử lý cùng lúc — ảnh hưởng đến khả năng hiểu và nhớ ngữ cảnh.",
  category: "llm-concepts",
  tags: ["context-window", "tokens", "attention", "llm"],
  difficulty: "beginner",
  relatedSlugs: ["self-attention", "multi-head-attention", "llm-overview", "tokenization"],
  vizType: "interactive",
};

// ─────────────────────────────────────────────────────────────────────
// DATA — Hội thoại 10 lượt. Mỗi lượt ≈ 150 token.
// Đây là dữ liệu gốc cho Token Budget Tracker ở VisualizationSection.
// ─────────────────────────────────────────────────────────────────────
type Turn = {
  id: number;
  role: "user" | "ai";
  topic: string;
  text: string;
  tokens: number;
  pinned?: boolean; // Tin nhắn được "ghim" (system prompt hoặc thông tin quan trọng)
};

const CONVERSATION: Turn[] = [
  {
    id: 1,
    role: "user",
    topic: "Giới thiệu bản thân",
    text:
      "Chào bạn, tôi tên là Minh, sinh năm 1998, sống ở Đà Nẵng. Tôi đang làm kỹ sư phần mềm ở một công ty start-up địa phương về thương mại điện tử.",
    tokens: 148,
    pinned: true,
  },
  {
    id: 2,
    role: "ai",
    topic: "Chào mừng & hỏi thêm",
    text:
      "Rất vui được gặp bạn, Minh! Đà Nẵng có biển Mỹ Khê và cầu Rồng rất đẹp. Start-up thương mại điện tử ở đó thường tập trung vào thị trường miền Trung. Bạn đang phụ trách mảng front-end hay back-end?",
    tokens: 152,
  },
  {
    id: 3,
    role: "user",
    topic: "Bối cảnh công việc",
    text:
      "Tôi làm back-end với Python và PostgreSQL. Gần đây team tôi bắt đầu tích hợp một chatbot LLM vào hệ thống CSKH. Tôi được giao nhiệm vụ đọc tài liệu và chọn mô hình phù hợp.",
    tokens: 149,
  },
  {
    id: 4,
    role: "ai",
    topic: "Định hướng LLM",
    text:
      "Hay đấy! Với chatbot CSKH, ba yếu tố cần cân nhắc là: độ trễ (latency), chi phí mỗi phiên, và độ dài ngữ cảnh. Nếu khách hàng hay quay lại hỏi tiếp tục đơn hàng cũ, cần context window đủ lớn để giữ lịch sử.",
    tokens: 155,
  },
  {
    id: 5,
    role: "user",
    topic: "Câu hỏi kỹ thuật",
    text:
      "Tôi vừa đọc xong tài liệu của Claude và GPT-4. Mọi người nói context window 200K là quá đủ, nhưng tôi vẫn chưa hiểu thực sự con số đó nghĩa là gì. 200K token là bao nhiêu câu?",
    tokens: 151,
  },
  {
    id: 6,
    role: "ai",
    topic: "Giải thích token",
    text:
      "200.000 token tiếng Anh tương đương khoảng 150.000 từ, hoặc 300–320 trang sách in. Tiếng Việt tốn nhiều token hơn vì dấu, nên chỉ còn khoảng 80.000–100.000 từ. Đủ để đọc một cuốn tiểu thuyết vừa trong một lần.",
    tokens: 153,
  },
  {
    id: 7,
    role: "user",
    topic: "Câu chuyện phụ",
    text:
      "Tuần trước tôi có đi ăn mì Quảng ở quán Bà Mua gần bãi biển, rồi ghé Bà Nà Hills chụp Cầu Vàng. Thời tiết hơi nắng nhưng không khí trên đỉnh mát. Bạn có biết Bà Nà trước đây là khu nghỉ dưỡng của người Pháp không?",
    tokens: 150,
  },
  {
    id: 8,
    role: "ai",
    topic: "Phản hồi chuyện phụ",
    text:
      "Vâng, Bà Nà được xây dựng từ năm 1919 dưới thời Pháp thuộc để phục vụ quan chức nghỉ dưỡng mùa hè. Sau 1945 nó bị bỏ hoang, đến năm 2009 Sun Group khôi phục và biến thành khu du lịch như ngày nay.",
    tokens: 152,
  },
  {
    id: 9,
    role: "user",
    topic: "Quay lại chủ đề gốc",
    text:
      "Tạm dừng chuyện du lịch. Quay lại bài toán chọn LLM cho CSKH: tôi nên bắt đầu từ context window bao nhiêu để vừa đủ cho hội thoại trung bình 20 lượt mỗi phiên, vừa tiết kiệm chi phí cho công ty?",
    tokens: 154,
  },
  {
    id: 10,
    role: "user",
    topic: "Câu hỏi kiểm tra trí nhớ",
    text:
      "Trước khi bạn trả lời, cho tôi kiểm tra nhé: bạn còn nhớ tôi tên gì, sống ở đâu, và làm back-end bằng ngôn ngữ gì không?",
    tokens: 147,
  },
];

const TOTAL_TOKENS = CONVERSATION.reduce((s, t) => s + t.tokens, 0);

// ─────────────────────────────────────────────────────────────────────
// DATA — Các mức context window phổ biến. Mỗi mốc đại diện cho một model.
// ─────────────────────────────────────────────────────────────────────
type Budget = {
  label: string;
  tokens: number;
  color: string;
  pages: number;
  example: string;
};

const BUDGETS: Budget[] = [
  { label: "4K", tokens: 4_000, color: "#EF4444", pages: 6, example: "GPT-3.5 bản đầu" },
  { label: "32K", tokens: 32_000, color: "#F97316", pages: 50, example: "GPT-4 bản 32K" },
  { label: "128K", tokens: 128_000, color: "#F59E0B", pages: 200, example: "GPT-4 Turbo" },
  { label: "200K", tokens: 200_000, color: "#8B5CF6", pages: 310, example: "Claude 3.5 / 4" },
  { label: "1M", tokens: 1_000_000, color: "#3B82F6", pages: 1550, example: "Gemini 1.5 Pro" },
];

// Cho benchmark "Needle in a Haystack"
// Mỗi ô đại diện cho một đoạn văn bản, đánh dấu vị trí mà "kim" (thông tin mục tiêu) được chèn vào.
type NIAHCell = {
  depth: number; // 0 → 100, vị trí tương đối trong context
  ctx: number; // độ dài context thực nghiệm
  score: number; // 0 → 1, tỷ lệ truy xuất thành công
};

// Tạo ma trận NIAH có tính "giống thật": score cao ở đầu/cuối, tụt ở giữa với context dài.
function buildNIAHMatrix(): NIAHCell[] {
  const ctxs = [4_000, 16_000, 32_000, 64_000, 128_000, 200_000, 500_000, 1_000_000];
  const depths = [0, 14, 28, 42, 57, 71, 85, 100];
  const out: NIAHCell[] = [];
  ctxs.forEach((ctx) => {
    depths.forEach((depth) => {
      const normCtx = Math.log10(ctx) / Math.log10(1_000_000);
      const middleBias = 1 - Math.exp(-Math.pow((depth - 50) / 25, 2));
      const edgeBoost = depth <= 10 || depth >= 90 ? 0.18 : 0;
      // score tụt khi ctx tăng và depth ở giữa
      let score = 1 - normCtx * middleBias * 0.65 + edgeBoost;
      score = Math.max(0.35, Math.min(1, score));
      out.push({ ctx, depth, score });
    });
  });
  return out;
}

const NIAH_MATRIX = buildNIAHMatrix();
const NIAH_CTXS = Array.from(new Set(NIAH_MATRIX.map((c) => c.ctx))).sort((a, b) => a - b);
const NIAH_DEPTHS = Array.from(new Set(NIAH_MATRIX.map((c) => c.depth))).sort((a, b) => a - b);

// ─────────────────────────────────────────────────────────────────────
// QUIZ — 8 câu theo yêu cầu
// ─────────────────────────────────────────────────────────────────────
const quizQuestions: QuizQuestion[] = [
  {
    question: "Context window 128K token tương đương khoảng bao nhiêu trang sách tiếng Anh?",
    options: [
      "Khoảng 10 trang",
      "Khoảng 200 trang (một tiểu thuyết ngắn)",
      "Khoảng 1.000 trang",
      "Khoảng 10.000 trang",
    ],
    correct: 1,
    explanation:
      "1 token ≈ 0.75 từ tiếng Anh → 128.000 token ≈ 96.000 từ ≈ 200 trang. Đủ đọc xong một cuốn tiểu thuyết ngắn trong một prompt duy nhất.",
  },
  {
    question: "Tại sao context window lớn lại tốn nhiều tài nguyên hơn?",
    options: [
      "Vì model phải download thêm dữ liệu",
      "Vì self-attention có độ phức tạp O(n²) — gấp đôi context = gấp 4 lần tính toán",
      "Vì ổ cứng cần thêm dung lượng",
      "Vì AI phải đọc nhanh hơn",
    ],
    correct: 1,
    explanation:
      "Self-attention so sánh MỌI token với MỌI token khác → O(n²). Context 200K đắt hơn context 100K khoảng 4 lần về tính toán. Đó là lý do API tính phí theo token.",
  },
  {
    question: "Prompt dài 100K token, yêu cầu output 50K token. Context window tối thiểu là bao nhiêu?",
    options: [
      "100K (chỉ cần prompt)",
      "50K (chỉ cần output)",
      "150K (cả prompt lẫn output cùng ở trong context)",
      "200K (cần dư để an toàn)",
    ],
    correct: 2,
    explanation:
      "Context window chứa CẢ prompt lẫn output. 100K + 50K = 150K tối thiểu. Nếu context chỉ 128K → không đủ chỗ cho output!",
  },
  {
    type: "fill-blank",
    question:
      "Context window đo bằng số {blank}. Chi phí attention tăng theo O(n^{blank}), nên gấp đôi context thì tính toán tăng gấp {blank} lần.",
    blanks: [
      { answer: "token", accept: ["tokens", "Token", "Tokens"] },
      { answer: "2", accept: ["²", "hai"] },
      { answer: "4", accept: ["bốn", "four"] },
    ],
    explanation:
      "Context window tính bằng số token. Self-attention có độ phức tạp O(n²), nên gấp đôi số token khiến chi phí attention tăng 4 lần — đây là lý do context dài rất tốn bộ nhớ và tính toán.",
  },
  {
    question:
      "Benchmark 'Needle in a Haystack' (NIAH) dùng để đo điều gì về context window?",
    options: [
      "Tốc độ inference tính theo token mỗi giây",
      "Khả năng truy xuất chính xác một thông tin được chèn ở vị trí bất kỳ trong context dài",
      "Số lượng tham số của mô hình",
      "Chi phí API mỗi triệu token",
    ],
    correct: 1,
    explanation:
      "NIAH chèn một 'kim' (fact) vào một 'đống rơm' (đoạn văn rất dài), rồi hỏi model về kim đó. Kết quả cho thấy model có thực sự đọc & nhớ được mọi vị trí hay chỉ tập trung vào đầu/cuối.",
  },
  {
    question:
      "Vì sao trong NIAH, các model thường tụt điểm ở vùng giữa context hơn là đầu hoặc cuối?",
    options: [
      "Vì vùng giữa thường chứa nhiều nhiễu hơn",
      "Vì hiện tượng 'lost in the middle' — attention phân bố lệch về hai đầu của chuỗi",
      "Vì tokenizer hoạt động kém ở giữa",
      "Vì GPU không đủ bộ nhớ để lưu vùng giữa",
    ],
    correct: 1,
    explanation:
      "Hiện tượng 'lost in the middle' (Liu et al., 2023): model học được bias từ dữ liệu huấn luyện, thường chú ý nhiều hơn vào token đầu/cuối chuỗi. Vùng giữa bị bỏ quên dù vẫn nằm trong context window.",
  },
  {
    question:
      "Một hội thoại 10 lượt, mỗi lượt ~150 token. Model context 1.200 token có thể giữ toàn bộ hội thoại không?",
    options: [
      "Có, 10 × 150 = 1.500 vẫn nhỏ hơn 1.200",
      "Không, 10 × 150 = 1.500 > 1.200 → lượt đầu sẽ bị cắt",
      "Có, nếu bật streaming",
      "Có, nếu tắt system prompt",
    ],
    correct: 1,
    explanation:
      "10 × 150 = 1.500 token, vượt 1.200. Thông thường lượt đầu tiên (cũ nhất) sẽ bị đẩy ra khỏi cửa sổ để nhường chỗ cho token mới — model sẽ 'quên' phần đầu hội thoại.",
  },
  {
    question:
      "Chiến lược nào giúp giữ context dài mà không cần tăng context window của model?",
    options: [
      "Gọi API nhiều lần với prompt giống nhau",
      "Tóm tắt phần cũ rồi chèn tóm tắt vào prompt mới (rolling summary) hoặc dùng RAG",
      "Giảm nhiệt độ (temperature) xuống 0",
      "Đổi sang tokenizer khác",
    ],
    correct: 1,
    explanation:
      "Rolling summary và RAG là hai cách phổ biến: tóm tắt nén các lượt cũ thành vài dòng, hoặc lưu trữ ngoài và chỉ truy xuất khi cần. Cả hai đều giữ 'trí nhớ' dài hơn context window vật lý.",
  },
  {
    question:
      "Trong thử nghiệm NIAH, điểm trung bình ở context 1M thường thấp hơn ở 128K khoảng bao nhiêu?",
    options: [
      "Không khác biệt — 1M nhớ y hệt 128K",
      "Thấp hơn vài phần trăm, và tụt mạnh nhất ở vùng depth 30–70%",
      "Thấp hơn chính xác 50%",
      "Cao hơn vì context dài cho nhiều thông tin hơn",
    ],
    correct: 1,
    explanation:
      "Các model Claude / GPT / Gemini 2024–2025 đều cho thấy NIAH score giảm vài chục phần trăm ở 1M so với 128K, đặc biệt tụt mạnh ở vùng giữa. Context 'có thể chứa' không đồng nghĩa với 'có thể truy xuất tốt'.",
  },
  {
    type: "fill-blank",
    question:
      "Hiện tượng model 'quên' thông tin ở vùng giữa context dài được gọi là {blank} in the {blank}. Nó xuất hiện vì attention học được bias lệch về hai {blank} của chuỗi.",
    blanks: [
      { answer: "lost", accept: ["Lost", "LOST"] },
      { answer: "middle", accept: ["Middle", "giữa"] },
      { answer: "đầu", accept: ["đầu cuối", "edges", "ends"] },
    ],
    explanation:
      "'Lost in the Middle' (Liu et al., 2023) là bias phổ biến trong hầu hết LLM. Attention chú ý nhiều hơn vào token đầu và cuối — vùng giữa bị mất điểm dù vẫn nằm trong context window.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────
export default function ContextWindowTopic() {
  // State — ngân sách token người dùng chọn
  const [budgetIdx, setBudgetIdx] = useState<number>(0); // bắt đầu ở 4K
  const [includeSystemOverhead, setIncludeSystemOverhead] = useState(true);
  const [niahCtxIdx, setNiahCtxIdx] = useState(4); // 128K mặc định

  const budget = BUDGETS[budgetIdx];

  // Tính toán ngân sách — quét từ lượt cuối về đầu, tích luỹ token.
  // Lượt nào vượt ngân sách → bị cắt khỏi context.
  const SYSTEM_OVERHEAD = 220; // token cho system prompt cố định
  const budgetInfo = useMemo(() => {
    const cap = budget.tokens - (includeSystemOverhead ? SYSTEM_OVERHEAD : 0);
    let used = 0;
    const fits: boolean[] = new Array(CONVERSATION.length).fill(false);
    // Ghim các tin nhắn pinned trước
    CONVERSATION.forEach((t, i) => {
      if (t.pinned && used + t.tokens <= cap) {
        used += t.tokens;
        fits[i] = true;
      }
    });
    // Sau đó lấp từ lượt mới nhất về cũ
    for (let i = CONVERSATION.length - 1; i >= 0; i--) {
      if (fits[i]) continue; // đã ghim
      if (used + CONVERSATION[i].tokens <= cap) {
        used += CONVERSATION[i].tokens;
        fits[i] = true;
      }
    }
    const dropped = fits.filter((f) => !f).length;
    const pctUsed = Math.min(100, (used / budget.tokens) * 100);
    return { cap, used, fits, dropped, pctUsed };
  }, [budget.tokens, includeSystemOverhead]);

  // Tổng token "đã cộng dồn" tính từ lượt 1 đến i — dùng để vẽ thước đo
  const cumulative = useMemo(() => {
    const out: number[] = [];
    let s = 0;
    CONVERSATION.forEach((t) => {
      s += t.tokens;
      out.push(s);
    });
    return out;
  }, []);

  // NIAH — lấy cột ứng với ctx đang chọn
  const selectedNiahCtx = NIAH_CTXS[niahCtxIdx];
  const niahColumn = useMemo(
    () => NIAH_MATRIX.filter((c) => c.ctx === selectedNiahCtx),
    [selectedNiahCtx]
  );
  const niahAvg = useMemo(
    () =>
      niahColumn.reduce((s, c) => s + c.score, 0) / Math.max(1, niahColumn.length),
    [niahColumn]
  );

  // Giả lập phản hồi của AI khi ngân sách đổi
  const aiReply = useMemo(() => {
    const firstTurnFits = budgetInfo.fits[0];
    if (firstTurnFits) {
      return "Vâng, tôi vẫn nhớ: bạn tên Minh, sống ở Đà Nẵng, và làm back-end bằng Python. Về chiến lược chọn LLM...";
    }
    return "Xin lỗi, tôi không tìm thấy thông tin đó trong cuộc trò chuyện. Bạn có thể nhắc lại tên và nơi sống không?";
  }, [budgetInfo.fits]);

  // Xử lý thanh trượt — chuyển đổi giữa 5 mốc ngân sách
  const onBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBudgetIdx(parseInt(e.target.value, 10));
  }, []);

  const onNiahChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNiahCtxIdx(parseInt(e.target.value, 10));
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 1 — HOOK: dự đoán */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={1} totalSteps={9} label="Thử đoán">
        <div className="mb-3">
          <ProgressSteps
            current={1}
            total={9}
            labels={[
              "Dự đoán",
              "Ngân sách token",
              "Aha",
              "So sánh model",
              "Needle-in-a-Haystack",
              "Thử thách A",
              "Thử thách B",
              "Giải thích",
              "Tóm tắt & kiểm tra",
            ]}
          />
        </div>

        <PredictionGate
          question="Bạn trò chuyện với AI 10 lượt (tổng ~1.500 token). Rồi hỏi lại thông tin ở lượt đầu tiên. Điều gì quyết định AI có nhớ hay không?"
          options={[
            "AI luôn nhớ mọi thứ bạn từng nói, không quan trọng độ dài",
            "Tùy kích thước context window — nếu ngân sách token đủ lớn thì nhớ, ngắn thì quên",
            "AI chỉ nhớ khi bạn dùng tính năng trả phí",
            "Chỉ nhớ nếu bạn chủ động nói 'hãy nhớ điều này'",
          ]}
          correct={1}
          explanation="Context window là bộ nhớ ngắn hạn: nếu tổng token của hội thoại vượt ngân sách, lượt cũ nhất bị đẩy ra và model không còn 'thấy' chúng. Mọi kỹ thuật giữ trí nhớ dài hơn (rolling summary, RAG…) đều xoay quanh ràng buộc này."
        >
          <p className="text-sm text-muted mt-4">
            Hãy tự mình điều chỉnh ngân sách token và quan sát lượt nào còn ở trong cửa sổ, lượt
            nào bị cắt.
          </p>
        </PredictionGate>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 2 — VISUALIZATION: Token Budget Tracker (yêu cầu chính) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={2} totalSteps={9} label="Ngân sách token">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Token Budget Tracker — 10 lượt hội thoại, ~150 token / lượt
          </h3>
          <p className="text-sm text-muted mb-4">
            Kéo thanh trượt để đổi kích thước context (4K → 1M). Lượt nào không vừa ngân sách sẽ
            bị cắt khỏi cửa sổ — AI sẽ &quot;quên&quot; nội dung đó.
          </p>

          {/* Thanh trượt ngân sách */}
          <div className="mb-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Context size</span>
              <span
                className="text-sm font-bold"
                style={{ color: budget.color }}
              >
                {budget.label} token · {budget.example}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={BUDGETS.length - 1}
              step={1}
              value={budgetIdx}
              onChange={onBudgetChange}
              className="w-full h-2 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              aria-label="Context window budget"
            />
            <div className="mt-1 flex justify-between text-[10px] text-tertiary">
              {BUDGETS.map((b) => (
                <span key={b.label}>{b.label}</span>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 text-muted">
                <input
                  type="checkbox"
                  checked={includeSystemOverhead}
                  onChange={(e) => setIncludeSystemOverhead(e.target.checked)}
                  className="accent-accent"
                />
                Tính cả system prompt (~220 token)
              </label>
              <span className="text-muted">
                Đã dùng:{" "}
                <strong className="text-foreground">{budgetInfo.used.toLocaleString()}</strong>{" "}
                / {budget.tokens.toLocaleString()} ({budgetInfo.pctUsed.toFixed(1)}%)
              </span>
            </div>

            {/* Thanh tiến trình token */}
            <div className="mt-2 h-3 w-full rounded-full bg-surface overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: budget.color }}
                initial={{ width: 0 }}
                animate={{ width: `${budgetInfo.pctUsed}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Cảnh báo lượt bị cắt */}
          {budgetInfo.dropped > 0 && (
            <div className="mb-3 rounded-lg border border-amber-400/50 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              ⚠ {budgetInfo.dropped} / {CONVERSATION.length} lượt đã bị cắt khỏi context —
              AI không còn &quot;thấy&quot; nội dung đó.
            </div>
          )}

          {/* Danh sách hội thoại */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {CONVERSATION.map((turn, i) => {
                const fits = budgetInfo.fits[i];
                const cum = cumulative[i];
                const cumPct = Math.min(100, (cum / budget.tokens) * 100);
                return (
                  <motion.div
                    key={turn.id}
                    className={`px-4 py-3 flex gap-3 transition-all ${
                      fits ? "" : "opacity-30"
                    }`}
                    animate={{ opacity: fits ? 1 : 0.28 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* avatar vai trò */}
                    <span
                      className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        turn.role === "user"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      }`}
                      aria-hidden
                    >
                      {turn.role === "user" ? "B" : "AI"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase tracking-wide text-tertiary">
                          #{turn.id} · {turn.topic}
                        </span>
                        {turn.pinned && (
                          <span className="text-[10px] rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 font-medium">
                            PINNED
                          </span>
                        )}
                        <span className="ml-auto text-[10px] text-tertiary">
                          {turn.tokens} token · cộng dồn {cum.toLocaleString()}
                        </span>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          fits
                            ? "text-foreground"
                            : "text-tertiary line-through decoration-tertiary/40"
                        }`}
                      >
                        {turn.text}
                      </p>

                      {/* thanh cộng dồn nhỏ */}
                      <div className="mt-1.5 h-1 w-full rounded-full bg-surface overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${cumPct}%`,
                            background: fits ? budget.color : "#999",
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Phản hồi của AI cho câu hỏi cuối */}
              <div className="px-4 py-3 flex gap-3 bg-surface">
                <span
                  className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  aria-hidden
                >
                  AI
                </span>
                <p
                  className={`text-sm leading-relaxed font-medium ${
                    budgetInfo.fits[0]
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {aiReply}
                </p>
              </div>
            </div>
          </div>

          {/* Chú thích ngân sách */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted">
            <div>
              <span className="block font-semibold text-foreground">Tổng hội thoại</span>
              {TOTAL_TOKENS.toLocaleString()} token
            </div>
            <div>
              <span className="block font-semibold text-foreground">Ngân sách</span>
              {budget.tokens.toLocaleString()} token
            </div>
            <div>
              <span className="block font-semibold text-foreground">Còn lại</span>
              {Math.max(0, budget.tokens - budgetInfo.used).toLocaleString()} token
            </div>
            <div>
              <span className="block font-semibold text-foreground">Ước tính trang</span>
              {budget.pages} trang
            </div>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 3 — AHA */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={3} totalSteps={9} label="Khoảnh khắc Aha">
        <AhaMoment>
          <strong>Context window</strong> là &quot;bộ nhớ ngắn hạn&quot; của LLM — một ngân sách
          token cứng. Mỗi lượt bạn thêm vào đều tiêu tốn ngân sách, và khi đầy, lượt cũ nhất bị
          đẩy ra. AI không &quot;quên từ từ&quot; như người — nó mất hoàn toàn, như thể tin nhắn
          kia chưa bao giờ tồn tại.
        </AhaMoment>

        <Callout variant="tip" title="Tư duy như một kế toán token">
          Trước khi gọi LLM, hãy tính trước tổng token: system prompt + lịch sử hội thoại +
          tài liệu đính kèm + ngân sách cho output. Tổng phải nhỏ hơn context window. Nhiều lỗi
          production thực chất chỉ là &quot;ngân sách bị âm&quot;.
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 4 — So sánh context window các model */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={4} totalSteps={9} label="So sánh model">
        <h3 className="text-base font-semibold text-foreground mb-3">
          So sánh các mốc context phổ biến
        </h3>
        <p className="text-sm text-muted mb-3">
          Mỗi thanh là một mốc ngân sách điển hình. Lưu ý thang đo là log: từ 4K lên 1M là chênh
          <strong> 250 lần</strong>.
        </p>

        <div className="space-y-3">
          {BUDGETS.map((b) => {
            // Thang log để không áp đảo
            const logMax = Math.log10(BUDGETS[BUDGETS.length - 1].tokens);
            const logCur = Math.log10(b.tokens);
            const widthPct = Math.max(4, (logCur / logMax) * 100);
            return (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {b.label} · {b.example}
                  </span>
                  <span className="text-xs text-muted">
                    {b.tokens.toLocaleString()} token ≈ {b.pages} trang
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: b.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Callout variant="info" title="1 token là gì?">
          1 token ≈ 3/4 từ tiếng Anh, hoặc ≈ 1/2 từ tiếng Việt (tiếng Việt tốn nhiều token hơn vì
          dấu). &quot;Xin chào&quot; = 2–4 token tùy tokenizer. Context window gồm CẢ prompt
          (input) VÀ response (output).
        </Callout>

        <Callout variant="warning" title="Cẩn thận: 200K không có nghĩa là 'vô hạn'">
          Chi phí API scale tuyến tính theo input tokens. Prompt 200K + output 4K ở mức giá hiện
          tại có thể lên tới vài cent mỗi cuộc gọi. Nhân với 1 triệu user, ngân sách tháng có thể
          gấp trăm lần so với prompt 10K.
        </Callout>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 5 — NIAH: Needle in a Haystack visualization */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={5} totalSteps={9} label="Needle-in-a-Haystack">
        <VisualizationSection topicSlug={metadata.slug}>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Benchmark Needle-in-a-Haystack — AI nhớ đến đâu trong context dài?
          </h3>
          <p className="text-sm text-muted mb-4">
            Chọn độ dài context. Bảng màu bên dưới hiển thị tỷ lệ truy xuất thành công khi &quot;kim
            sự thật&quot; được chèn ở từng độ sâu (0% = đầu, 100% = cuối).
          </p>

          {/* Slider chọn ctx */}
          <div className="mb-3 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={NIAH_CTXS.length - 1}
              step={1}
              value={niahCtxIdx}
              onChange={onNiahChange}
              className="flex-1 h-2 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
              aria-label="Needle in a Haystack context length"
            />
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
              {selectedNiahCtx >= 1_000_000
                ? `${(selectedNiahCtx / 1_000_000).toFixed(0)}M`
                : `${(selectedNiahCtx / 1_000).toFixed(0)}K`}
            </span>
          </div>

          {/* Heat map — cột đang chọn ở giữa, các cột khác mờ đi */}
          <div className="rounded-xl border border-border bg-background/50 p-3 overflow-x-auto">
            <div className="inline-grid gap-1"
              style={{
                gridTemplateColumns: `auto repeat(${NIAH_CTXS.length}, 44px)`,
                gridTemplateRows: `auto repeat(${NIAH_DEPTHS.length}, 26px)`,
              }}
            >
              <div />
              {NIAH_CTXS.map((c) => (
                <div
                  key={`h-${c}`}
                  className={`text-[10px] text-center font-medium ${
                    c === selectedNiahCtx ? "text-foreground" : "text-tertiary"
                  }`}
                >
                  {c >= 1_000_000 ? `${c / 1_000_000}M` : `${c / 1_000}K`}
                </div>
              ))}
              {NIAH_DEPTHS.map((d) => (
                <React.Fragment key={`r-${d}`}>
                  <div className="text-[10px] text-tertiary text-right pr-1 leading-6">
                    {d}%
                  </div>
                  {NIAH_CTXS.map((c) => {
                    const cell = NIAH_MATRIX.find(
                      (x) => x.ctx === c && x.depth === d
                    );
                    const score = cell?.score ?? 0;
                    const active = c === selectedNiahCtx;
                    // Hue từ đỏ (0) → xanh (1)
                    const hue = Math.round(score * 130);
                    return (
                      <div
                        key={`cell-${c}-${d}`}
                        className="rounded flex items-center justify-center text-[9px] font-medium"
                        style={{
                          background: `hsl(${hue}, 70%, ${30 + score * 20}%)`,
                          opacity: active ? 1 : 0.35,
                          color: "white",
                          outline: active ? "1.5px solid #fff" : "none",
                        }}
                        title={`ctx=${c}, depth=${d}%, score=${(score * 100).toFixed(0)}%`}
                      >
                        {(score * 100).toFixed(0)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-border bg-background/50 p-3 text-xs text-muted">
            <div className="flex items-center justify-between">
              <span>Điểm trung bình ở context hiện tại:</span>
              <strong
                className="text-foreground"
                style={{ color: `hsl(${Math.round(niahAvg * 130)}, 70%, 50%)` }}
              >
                {(niahAvg * 100).toFixed(0)} / 100
              </strong>
            </div>
            <p className="mt-1 leading-relaxed">
              Lưu ý: điểm thường tụt ở vùng <strong>giữa</strong> (depth 30–70%) khi context dài —
              hiện tượng được gọi là &quot;lost in the middle&quot;. Model học được bias từ dữ
              liệu huấn luyện, thường chú ý hơn vào phần đầu và phần cuối chuỗi.
            </p>
          </div>
        </VisualizationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 6 — THỬ THÁCH 1 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={6} totalSteps={9} label="Thử thách A">
        <InlineChallenge
          question="Bạn muốn AI tóm tắt một cuốn sách 500 trang tiếng Anh (≈ 125K từ ≈ 165K token). Model nào ĐỦ context window để đọc trong một lần?"
          options={[
            "GPT-3.5 (4K token ≈ 6 trang)",
            "GPT-4 Turbo 128K (200 trang) — phải chia nhỏ",
            "Claude 3.5 200K (310 trang) hoặc Gemini 1.5 1M",
            "Không model nào đủ — phải dùng database",
          ]}
          correct={2}
          explanation="165K token > 128K nên GPT-4 Turbo phải chia nhỏ. Claude 200K vừa đủ 1 lần (còn ~35K cho output). Gemini 1.5 với 1M token thừa sức đọc nguyên cuốn trong một prompt duy nhất."
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 7 — THỬ THÁCH 2 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={7} totalSteps={9} label="Thử thách B">
        <InlineChallenge
          question="Chatbot CSKH của bạn chạy 24/7, mỗi phiên trung bình 20 lượt ~150 token = 3K token. Nhưng vài phiên lên tới 120 lượt. Context window nào hợp lý NHẤT?"
          options={[
            "4K — đủ cho trường hợp trung bình, tiết kiệm nhất",
            "32K — vừa dư cho 120 lượt (~18K), chừa ngân sách cho system prompt và RAG",
            "1M — cho chắc, không bao giờ thiếu",
            "Không quan trọng, chọn model rẻ nhất",
          ]}
          correct={1}
          explanation="4K quá sát: phiên dài sẽ mất lịch sử. 1M lãng phí tiền (giá scale theo token đầu vào). 32K là 'vừa đủ dư' — 120 lượt ~18K, cộng system prompt 2K, tài liệu RAG 5K, output 3K → tổng ~28K < 32K. Thiết kế theo P99 chứ không theo trung bình."
        />
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 8 — GIẢI THÍCH CHI TIẾT */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={8} totalSteps={9} label="Giải thích">
        <ExplanationSection>
          <p>
            <strong>Context window</strong> (cửa sổ ngữ cảnh) là số lượng token tối đa mà LLM có
            thể xử lý trong một lần suy luận, bao gồm <em>cả input lẫn output</em>. Số lượng
            token đến từ{" "}
            <TopicLink slug="tokenization">tokenization</TopicLink>, còn chi phí bộ nhớ đến từ{" "}
            <TopicLink slug="kv-cache">KV cache</TopicLink> — yếu tố giới hạn thực tế khi triển
            khai. Các kỹ thuật kéo dài cửa sổ thêm nữa được trình bày trong{" "}
            <TopicLink slug="long-context">long context</TopicLink>.
          </p>

          <Callout variant="warning" title="Vì sao context dài = tốn tiền?">
            Self-attention (
            <TopicLink slug="self-attention">chi tiết</TopicLink>) so sánh MỌI token với MỌI
            token khác, tạo ra độ phức tạp:
            <LaTeX block>{"O(n^2 \\cdot d)"}</LaTeX>
            Gấp đôi context (n) → gấp 4 lần tính toán và bộ nhớ. Đó là lý do API tính phí theo
            token và context dài đắt hơn nhiều.
          </Callout>

          <p>
            <strong>Khi context window không đủ:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>Chia nhỏ (chunking):</strong> chia tài liệu dài thành nhiều phần, xử lý từng
              phần rồi gộp kết quả.
            </li>
            <li>
              <strong>RAG:</strong> lưu tri thức ra kho vector, mỗi lần hỏi chỉ truy xuất vài
              đoạn liên quan nhất.
            </li>
            <li>
              <strong>Rolling summary:</strong> sau mỗi k lượt, tóm tắt các lượt cũ thành vài
              câu; chèn tóm tắt + các lượt gần nhất vào context.
            </li>
            <li>
              <strong>Memory external:</strong> lưu facts quan trọng (tên, preferences) vào
              database; chỉ tải lại khi cần.
            </li>
          </ul>

          <p>
            <strong>Kỹ thuật mở rộng context ở tầng model:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
              <strong>RoPE (Rotary Position Embedding):</strong> mã hóa vị trí xoay vòng, dễ
              extrapolate ra độ dài lớn hơn so với training.
            </li>
            <li>
              <strong>Sliding Window Attention:</strong> mỗi token chỉ attend vào một cửa sổ cục
              bộ — giảm O(n²) về O(n · w).
            </li>
            <li>
              <strong>Ring Attention / Sequence Parallel:</strong> phân tán context qua nhiều GPU,
              mỗi GPU xử lý một phần, trao đổi K/V qua mạng.
            </li>
            <li>
              <strong>Flash Attention 2:</strong> không giảm O(n²) nhưng tối ưu bộ nhớ và băng
              thông, cho phép chạy context dài trên cùng một card.
            </li>
          </ul>

          <CodeBlock language="python" title="context_budget.py">
{`"""Ước tính ngân sách token trước khi gọi LLM."""
from anthropic import Anthropic

client = Anthropic()

# Giả sử bạn đang dùng Claude với context 200.000 token.
CONTEXT_LIMIT = 200_000
SYSTEM_PROMPT = """Bạn là trợ lý CSKH cho một shop thời trang..."""
RAG_CHUNKS = ["... đoạn 1 ...", "... đoạn 2 ..."]  # truy xuất từ vector DB
HISTORY = [("user", "..."), ("assistant", "...")]  # hội thoại rolling

def estimate_tokens(text: str) -> int:
    """Tokenizer tiếng Việt tốn ~2× so với tiếng Anh."""
    return max(1, len(text) // 2)

def pack_context(system, rag, history, output_reserve=4_000):
    budget = CONTEXT_LIMIT - output_reserve
    used = estimate_tokens(system)
    used += sum(estimate_tokens(c) for c in rag)
    # Giữ lượt mới nhất trước; cắt từ cũ nhất nếu vượt ngân sách.
    kept = []
    for role, text in reversed(history):
        t = estimate_tokens(text)
        if used + t > budget:
            break
        used += t
        kept.append((role, text))
    return list(reversed(kept)), used

packed, used = pack_context(SYSTEM_PROMPT, RAG_CHUNKS, HISTORY)
print(f"Đã gói {len(packed)} lượt, tổng {used:,} token / {CONTEXT_LIMIT:,}.")

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4_000,
    system=SYSTEM_PROMPT,
    messages=[
        {"role": r, "content": t} for r, t in packed
    ],
)
print("Input tokens (thực tế):", response.usage.input_tokens)
print("Output tokens:", response.usage.output_tokens)`}
          </CodeBlock>

          <Callout variant="insight" title="Quy tắc &quot;70% input, 30% output&quot;">
            Một heuristic tốt: không bao giờ ăn quá 70% context cho input. Luôn để lại ~30% cho
            output và an toàn. Ví dụ context 200K → giới hạn input ~140K, chừa 60K cho response
            và dự phòng nếu user gửi file dài bất ngờ.
          </Callout>

          <CodeBlock language="python" title="rolling_summary.py">
{`"""Rolling summary: nén lịch sử khi sắp hết ngân sách."""
from anthropic import Anthropic

client = Anthropic()
SUMMARY_TRIGGER = 0.7   # khi dùng >70% ngân sách
KEEP_LAST_TURNS = 6     # luôn giữ nguyên 6 lượt gần nhất

def summarize_old_turns(old_turns: list[dict]) -> str:
    """Gọi LLM nén nhóm lượt cũ thành một đoạn tóm tắt ngắn."""
    prompt = "Hãy tóm tắt cuộc trò chuyện sau trong 4-5 câu, "
    prompt += "giữ lại tên, số liệu, mục tiêu và quyết định:\\n\\n"
    for t in old_turns:
        prompt += f"{t['role']}: {t['content']}\\n"
    r = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )
    return r.content[0].text

def maybe_compress(history: list[dict], context_limit: int) -> list[dict]:
    est = sum(len(t["content"]) // 2 for t in history)
    if est < context_limit * SUMMARY_TRIGGER:
        return history
    # Tách: đầu = tóm tắt cũ, đuôi = nguyên bản
    old = history[:-KEEP_LAST_TURNS]
    recent = history[-KEEP_LAST_TURNS:]
    summary = summarize_old_turns(old)
    return [{"role": "system", "content": f"[Tóm tắt quá khứ]: {summary}"}] + recent`}
          </CodeBlock>

          <CollapsibleDetail title="Vì sao không chỉ đơn giản 'tăng context window lên 10 lần'?">
            <p>
              Tăng context gấp 10 nghe dễ, nhưng có bốn ràng buộc thực tế:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-sm mt-2">
              <li>
                <strong>Tính toán:</strong> O(n²) trong attention, nên context gấp 10 = compute
                gấp 100. Cần GPU/TPU mạnh hơn nhiều.
              </li>
              <li>
                <strong>Bộ nhớ KV cache:</strong> mỗi token cần lưu key và value của mỗi layer.
                Context 1M trên model 80B có thể cần hàng trăm GB VRAM chỉ cho cache.
              </li>
              <li>
                <strong>Dữ liệu huấn luyện:</strong> model chỉ giỏi với độ dài nó từng thấy khi
                pre-train. Mở rộng cần fine-tune với long sequences — rất đắt.
              </li>
              <li>
                <strong>Hiệu quả thực:</strong> như NIAH cho thấy, chất lượng truy xuất tụt ở
                context dài. 1M token mà không nhớ gì ở giữa thì không khác 100K.
              </li>
            </ol>
          </CollapsibleDetail>

          <CollapsibleDetail title="Vì sao tiếng Việt tốn nhiều token hơn tiếng Anh?">
            <p>
              Tokenizer (BPE/SentencePiece) học từ corpus chủ yếu tiếng Anh. Các cụm ký tự
              tiếng Anh (như &quot;the&quot;, &quot;ing&quot;, &quot;tion&quot;) được gộp thành 1 token. Tiếng Việt có dấu
              (á, ầ, ơ, ệ…) và ít xuất hiện trong training corpus → tokenizer tách nhỏ thành
              nhiều byte.
            </p>
            <p className="mt-2">
              Thực tế: một câu tiếng Việt 10 chữ thường chiếm ~18–25 token, trong khi tiếng Anh
              chỉ ~12–15 token cho nội dung tương đương. Tokenizer riêng cho tiếng Việt (như
              PhoBERT) đóng gói hiệu quả hơn, nhưng các LLM đa ngôn ngữ phổ thông vẫn dùng
              tokenizer chung, nên giá API tiếng Việt thường cao hơn.
            </p>
            <p className="mt-2">
              Hệ quả: khi thiết kế prompt tiếng Việt, ngân sách context thực dụng chỉ còn khoảng
              50–60% so với con số ghi trên nhãn. Ví dụ Claude 200K ≈ 100K token &quot;hiệu quả&quot;
              cho tiếng Việt — vẫn khổng lồ, nhưng không còn gấp 3 tiếng Anh như quảng cáo.
            </p>
          </CollapsibleDetail>

          <p className="mt-4">
            <strong>Ngân sách context trong thực tế production:</strong> bạn không bao giờ dùng
            hết 100% ngân sách. Cần trừ chỗ cho: system prompt (200–2.000 token), few-shot
            examples (500–5.000 token), RAG chunks (1.000–20.000 token), lịch sử hội thoại, và
            output. Với Claude 200K, một chatbot sản xuất điển hình tiêu thụ:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>System prompt: ~1.500 token (đặt persona, quy tắc, định dạng trả lời)</li>
            <li>Few-shot examples: ~3.000 token (3–5 ví dụ mẫu)</li>
            <li>RAG top-k: ~8.000 token (5 chunks × 1.600 token)</li>
            <li>Lịch sử hội thoại: ~10.000 token (rolling window 30 lượt)</li>
            <li>Output reserve: ~4.000 token</li>
            <li>Dự phòng (file đính kèm, user paste dài): ~20.000 token</li>
          </ul>
          <p className="mt-2">
            Tổng: ~46.500 token &quot;base&quot;, còn 153.500 token để linh hoạt. Nếu user dán
            một hợp đồng 80K token vào, vẫn còn 73K — vẫn an toàn. Nhưng nếu user dán 2 hợp
            đồng? Bạn phải quyết định: cắt bớt lịch sử? Cắt bớt RAG? Từ chối request? Đây là
            bài toán &quot;context scheduler&quot; mà các agent nghiêm túc đều phải giải.
          </p>

          <CodeBlock language="python" title="context_scheduler.py">
{`"""Lập lịch context: quyết định gì được giữ, gì bị cắt khi ngân sách căng."""
from dataclasses import dataclass
from typing import Literal

@dataclass
class ContextItem:
    kind: Literal["system", "fewshot", "rag", "history", "attachment"]
    content: str
    tokens: int
    priority: int  # 0 = thấp nhất, 100 = bắt buộc giữ
    recency: int   # 0 = cũ nhất, cao = mới nhất

def schedule(items: list[ContextItem], budget: int) -> list[ContextItem]:
    """Giữ item theo priority giảm dần; nếu bằng priority thì lấy recency cao hơn."""
    sorted_items = sorted(
        items,
        key=lambda x: (-x.priority, -x.recency, x.tokens),
    )
    kept, used = [], 0
    for it in sorted_items:
        if it.priority >= 90 and used + it.tokens > budget:
            # Bắt buộc giữ nhưng không có chỗ → báo động
            raise RuntimeError(
                f"Không thể giữ item bắt buộc '{it.kind}' "
                f"(thiếu {used + it.tokens - budget} token)."
            )
        if used + it.tokens <= budget:
            used += it.tokens
            kept.append(it)
    # Sắp xếp lại theo thứ tự thời gian gốc để prompt đọc tự nhiên
    return sorted(kept, key=lambda x: x.recency)

# Ví dụ: system và RAG là bắt buộc, history có thể cắt bớt.
items = [
    ContextItem("system", "...", 1_500, priority=100, recency=0),
    ContextItem("rag",    "...", 8_000, priority=95,  recency=5),
    ContextItem("fewshot","...", 3_000, priority=70,  recency=1),
    # 30 lượt history, mỗi lượt 300 token
    *[ContextItem("history", f"turn-{i}", 300, priority=50, recency=10+i)
      for i in range(30)],
    ContextItem("attachment","...", 80_000, priority=85, recency=40),
]
packed = schedule(items, budget=180_000)`}
          </CodeBlock>

          <Callout variant="tip" title="Ưu tiên đúng là cả nghệ thuật">
            Nhiều team đặt priority cho mọi thứ bằng 100 (&quot;tất cả đều quan trọng&quot;). Khi ngân
            sách căng, scheduler sẽ fail hoặc cắt ngẫu nhiên. Hãy thực sự quyết định:
            system &gt; quy tắc an toàn &gt; instruction hiện tại &gt; attachment người dùng &gt;
            RAG &gt; history gần &gt; few-shot &gt; history cũ. Khi căng, cắt từ cuối danh sách.
          </Callout>

          <CodeBlock language="python" title="niah_benchmark.py">
{`"""Needle-in-a-Haystack: đo khả năng truy xuất fact ở mọi độ sâu context."""
import random
from anthropic import Anthropic

client = Anthropic()
NEEDLE = "Mã bí mật của ngày hôm nay là CHANH-MUOI-42."
QUESTION = "Mã bí mật của ngày hôm nay là gì?"

def build_haystack(context_tokens: int, depth_pct: float) -> str:
    """Chèn 'kim' vào vị trí depth_pct (0.0 = đầu, 1.0 = cuối) của một
    đống văn bản dài khoảng context_tokens token."""
    # Ước lượng thô: 1 token ≈ 4 ký tự tiếng Anh
    target_chars = context_tokens * 4
    filler = ("Đây là đoạn văn nền, không chứa thông tin quan trọng. " * 200)
    while len(filler) < target_chars:
        filler = filler + filler
    filler = filler[:target_chars]
    cut = int(len(filler) * depth_pct)
    return filler[:cut] + "\\n\\n" + NEEDLE + "\\n\\n" + filler[cut:]

def run_niah(ctxs=(4_000, 16_000, 64_000, 200_000),
             depths=(0.0, 0.25, 0.5, 0.75, 1.0), trials=3):
    results = {}
    for ctx in ctxs:
        for depth in depths:
            hits = 0
            for _ in range(trials):
                haystack = build_haystack(ctx, depth)
                r = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=80,
                    messages=[{
                        "role": "user",
                        "content": f"{haystack}\\n\\n{QUESTION}",
                    }],
                )
                if "CHANH-MUOI-42" in r.content[0].text:
                    hits += 1
            results[(ctx, depth)] = hits / trials
    return results

scores = run_niah()
for (ctx, depth), score in sorted(scores.items()):
    print(f"ctx={ctx:>7}  depth={depth:.2f}  score={score:.2f}")`}
          </CodeBlock>

          <CollapsibleDetail title="Các biến thể nâng cao của Needle-in-a-Haystack">
            <p>
              NIAH gốc chỉ chèn một fact đơn giản. Các benchmark phức tạp hơn được thiết kế để
              đánh giá các khía cạnh trí nhớ khác nhau của context dài:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li>
                <strong>Multi-needle NIAH:</strong> chèn 2–10 kim ở các độ sâu khác nhau, hỏi
                cả nhóm. Đòi hỏi model theo dõi nhiều fact cùng lúc, không chỉ một.
              </li>
              <li>
                <strong>RULER:</strong> bộ benchmark của NVIDIA gồm 13 task tổng hợp —
                multi-hop tracing, variable tracking, aggregation — cho thấy hầu hết model
                &quot;200K&quot; chỉ thực sự dùng được ~32K hiệu quả.
              </li>
              <li>
                <strong>LongBench / InfiniteBench:</strong> task thực (tóm tắt sách, QA trên
                báo cáo tài chính, code search). Khác NIAH ở chỗ câu trả lời không nằm
                nguyên văn — cần suy luận trên tài liệu dài.
              </li>
              <li>
                <strong>Passkey Retrieval:</strong> phiên bản đơn giản nhất — chèn dãy số
                ngẫu nhiên vào giữa filler, hỏi model đọc lại. Dùng để stress-test positional
                encoding khi extrapolate ra độ dài chưa từng train.
              </li>
            </ul>
            <p className="mt-2">
              Kết luận của cộng đồng nghiên cứu (Hsieh et al. 2024, An et al. 2024): con số
              context trên nhãn là <em>giới hạn vật lý</em>, không phải <em>giới hạn hữu
              ích</em>. Khi thiết kế hệ thống production, hãy tự chạy NIAH (hoặc RULER) với
              phân phối dữ liệu thực của mình — đừng tin tưởng mù quáng vào con số nhà
              cung cấp công bố.
            </p>
          </CollapsibleDetail>

          <CodeBlock language="python" title="multi_needle_eval.py">
{`"""Multi-needle: chèn nhiều fact, đánh giá khả năng giữ cùng lúc."""
from anthropic import Anthropic

client = Anthropic()
NEEDLES = [
    ("Tên công ty: Kim Cương Xanh", "Tên công ty trong tài liệu là gì?"),
    ("Mã số thuế: 0108-723-551",    "Mã số thuế là gì?"),
    ("Doanh thu Q3: 4,2 tỷ VND",    "Doanh thu Q3 là bao nhiêu?"),
    ("Số nhân viên: 137",           "Công ty có bao nhiêu nhân viên?"),
]

def embed_at_depths(filler: str, needles, depths):
    """Chèn mỗi needle ở một độ sâu khác nhau."""
    out = filler
    for (text, _), d in zip(needles, depths):
        cut = int(len(out) * d)
        out = out[:cut] + "\\n" + text + "\\n" + out[cut:]
    return out

def score(doc: str) -> float:
    """Hỏi tất cả câu hỏi trong 1 prompt, đếm số câu đúng."""
    questions = "\\n".join(f"- {q}" for _, q in NEEDLES)
    r = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=400,
        messages=[{"role": "user", "content":
            f"{doc}\\n\\nTrả lời tất cả câu hỏi:\\n{questions}"}],
    )
    answer = r.content[0].text
    return sum(1 for (needle, _) in NEEDLES if needle.split(":")[1].strip() in answer) / len(NEEDLES)`}
          </CodeBlock>

          <CollapsibleDetail title="Sample efficiency: gấp context window không làm model 'thông minh hơn' theo nghĩa thuần túy">
            <p>
              Một hiểu lầm phổ biến: cho model thấy nhiều hơn → nó trả lời thông minh hơn. Thực
              tế, context lớn chỉ giúp khi câu trả lời đúng <em>nằm trong</em> context. Nếu câu
              hỏi đòi hỏi suy luận nhiều bước, model còn phải tự suy luận bất kể context dài
              bao nhiêu.
            </p>
            <p className="mt-2">
              Một nghiên cứu của Anthropic 2024 cho thấy: với câu hỏi dạng multi-hop reasoning,
              việc tăng context từ 8K lên 100K chỉ cải thiện độ chính xác ~3%, trong khi tăng
              chi phí 12 lần. Ngược lại, với câu hỏi retrieval thuần (tìm fact trong tài liệu),
              context lớn giúp tăng độ chính xác từ 60% lên 95%.
            </p>
            <p className="mt-2">
              Bài học: chọn context window theo <strong>loại task</strong>. Retrieval-heavy →
              context lớn đáng tiền. Reasoning-heavy → context vừa đủ, đầu tư vào chain-of-
              thought và tool use sẽ hiệu quả hơn.
            </p>
          </CollapsibleDetail>
        </ExplanationSection>
      </LessonSection>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 9 — SUMMARY & QUIZ */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <LessonSection step={9} totalSteps={9} label="Tổng kết">
        <MiniSummary
          title="6 điều cần nhớ về Context Window"
          points={[
            "Context window là ngân sách token cứng: input + output phải cùng nằm trong ngân sách này.",
            "Chi phí attention scale theo O(n²) — gấp đôi context = gấp 4 lần tính toán và bộ nhớ.",
            "Lượt vượt ngân sách bị cắt hoàn toàn, không phải 'quên từ từ' như người.",
            "Benchmark NIAH đo khả năng truy xuất ở mọi độ sâu; chất lượng thường tụt ở vùng giữa context dài ('lost in the middle').",
            "Kỹ thuật mở rộng trí nhớ mà không tăng context: rolling summary, RAG, external memory, chunking.",
            "Quy tắc an toàn: input ≤ 70% context, chừa 30% cho output và dự phòng; thiết kế theo P99 chứ không theo trung bình.",
          ]}
        />

        <QuizSection questions={quizQuestions} />
      </LessonSection>
    </>
  );
}
