"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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

// ─── Câu chuyện cuộc hội thoại bị quên ───
const CONVERSATION = [
  { role: "user" as const, text: "Tên tôi là Minh. Tôi sống ở Đà Nẵng." },
  { role: "ai" as const, text: "Xin chào Minh! Đà Nẵng là thành phố rất đẹp." },
  { role: "user" as const, text: "Tôi thích ăn mì Quảng." },
  { role: "ai" as const, text: "Mì Quảng là đặc sản nổi tiếng của Đà Nẵng!" },
  { role: "user" as const, text: "Tôi đang tìm việc làm về AI." },
  { role: "ai" as const, text: "AI đang phát triển mạnh. Bạn có kinh nghiệm gì?" },
  { role: "user" as const, text: "Tôi biết Python và đã học PyTorch 6 tháng." },
  { role: "ai" as const, text: "Tuyệt! PyTorch rất phổ biến cho deep learning." },
  { role: "user" as const, text: "Quay lại chủ đề đầu — tôi tên gì và sống ở đâu?" },
];

const AI_RESPONSES: Record<string, string> = {
  small: "Hmm, tôi không chắc. Bạn có thể nhắc lại không? (Context quá ngắn — AI đã 'quên' phần đầu!)",
  large: "Bạn tên Minh và sống ở Đà Nẵng! (Context đủ dài — AI nhớ toàn bộ hội thoại.)",
};

// ─── So sánh context window các model ───
const MODELS = [
  { name: "GPT-3.5", tokens: 4096, pages: 6, color: "#EF4444" },
  { name: "GPT-4 Turbo", tokens: 128000, pages: 200, color: "#F59E0B" },
  { name: "Claude 3.5", tokens: 200000, pages: 310, color: "#8B5CF6" },
  { name: "Gemini 1.5", tokens: 1000000, pages: 1550, color: "#3B82F6" },
  { name: "Claude 4", tokens: 200000, pages: 310, color: "#0D9488" },
];

const maxTokens = Math.max(...MODELS.map(m => m.tokens));

const quizQuestions: QuizQuestion[] = [
  {
    question: "Context window 128K token tương đương khoảng bao nhiêu trang sách?",
    options: [
      "Khoảng 10 trang",
      "Khoảng 200 trang (một cuốn tiểu thuyết ngắn)",
      "Khoảng 1.000 trang",
      "Khoảng 10.000 trang",
    ],
    correct: 1,
    explanation: "1 token ≈ 0.75 từ tiếng Anh. 128K token ≈ 96.000 từ ≈ 200 trang. Đủ để đọc một cuốn tiểu thuyết ngắn trong 1 lần.",
  },
  {
    question: "Tại sao context window lớn hơn lại tốn nhiều tài nguyên hơn?",
    options: [
      "Vì model phải download thêm dữ liệu",
      "Vì self-attention có độ phức tạp O(n²) — gấp đôi context = gấp 4 lần tính toán",
      "Vì cần thêm ổ cứng",
      "Vì AI phải đọc nhanh hơn",
    ],
    correct: 1,
    explanation: "Self-attention so sánh MỌI token với MỌI token khác → O(n²). Context 200K đắt gấp 4 lần context 100K. Đó là lý do API tính phí theo token.",
  },
  {
    question: "Prompt dài 100K token + output 50K token. Context window cần tối thiểu bao nhiêu?",
    options: [
      "100K (chỉ cần prompt)",
      "50K (chỉ cần output)",
      "150K (prompt + output cùng nằm trong context)",
      "200K (cần dư để an toàn)",
    ],
    correct: 2,
    explanation: "Context window chứa CẢ prompt lẫn output. 100K + 50K = 150K token tối thiểu. Nếu context window chỉ 128K → không đủ!",
  },
];

export default function ContextWindowTopic() {
  const [windowSize, setWindowSize] = useState(4);

  // Tính xem AI "thấy" bao nhiêu tin nhắn
  // Mỗi tin nhắn ~10-15 token, windowSize đại diện cho số tin nhắn AI thấy
  const visibleMessages = CONVERSATION.slice(
    Math.max(0, CONVERSATION.length - windowSize),
    CONVERSATION.length
  );
  const hiddenCount = CONVERSATION.length - visibleMessages.length;
  const canRemember = windowSize >= CONVERSATION.length;

  return (
    <>
      {/* ━━━ HOOK ━━━ */}
      <LessonSection step={1} totalSteps={7} label="Thử đoán">
      <LessonSection step={1} totalSteps={7} label="Thử đoán">
      <PredictionGate
        question="Bạn nói chuyện với AI: 'Tên tôi là Minh, sống ở Đà Nẵng.' Sau 8 tin nhắn về chủ đề khác, bạn hỏi: 'Tên tôi là gì?' AI sẽ trả lời sao?"
        options={[
          "AI luôn nhớ mọi thứ — trả lời 'Minh' ngay",
          "Tùy vào context window — nếu đủ dài thì nhớ, ngắn thì quên",
          "AI không bao giờ nhớ tên — cần database riêng",
        ]}
        correct={1}
        explanation="Tùy context window! Nếu toàn bộ hội thoại nằm trong 'cửa sổ', AI nhớ tên bạn. Nếu cửa sổ quá ngắn, tin nhắn đầu tiên đã bị 'rơi ra ngoài' và AI hoàn toàn quên."
      >
        <p className="text-sm text-muted mt-4">
          Hãy tự mình điều chỉnh kích thước cửa sổ và xem AI nhớ hay quên.
        </p>
      </PredictionGate>

            </LessonSection>

      </LessonSection>

{/* ━━━ KHÁM PHÁ — Hội thoại bị cắt ━━━ */}
      <LessonSection step={2} totalSteps={7} label="Khám phá">
      <LessonSection step={2} totalSteps={7} label="Khám phá">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Khi context window quá ngắn — AI quên
        </h3>
        <p className="text-sm text-muted mb-4">
          Kéo thanh trượt để thay đổi kích thước cửa sổ. Xem AI &quot;thấy&quot;{" "}bao nhiêu tin nhắn.
        </p>

        {/* Thanh trượt */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">Cửa sổ ngữ cảnh</span>
            <span className="text-sm font-bold text-accent">{windowSize} tin nhắn</span>
          </div>
          <input
            type="range"
            min={2}
            max={CONVERSATION.length}
            step={1}
            value={windowSize}
            onChange={e => setWindowSize(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-surface accent-accent cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-tertiary">Ngắn (quên nhiều)</span>
            <span className="text-[10px] text-tertiary">Dài (nhớ hết)</span>
          </div>
        </div>

        {/* Hội thoại */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Tin nhắn bị ẩn */}
          {hiddenCount > 0 && (
            <div className="px-4 py-2 bg-surface text-center">
              <span className="text-xs text-tertiary">
                ⚠ {hiddenCount} tin nhắn đã rơi ra ngoài cửa sổ — AI không thể thấy
              </span>
            </div>
          )}

          {/* Tất cả tin nhắn */}
          <div className="divide-y divide-border">
            {CONVERSATION.map((msg, i) => {
              const isVisible = i >= CONVERSATION.length - windowSize;
              return (
                <motion.div
                  key={i}
                  className={`px-4 py-3 flex gap-3 transition-all ${
                    isVisible ? "" : "opacity-20"
                  }`}
                  animate={{ opacity: isVisible ? 1 : 0.15 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    msg.role === "user"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  }`}>
                    {msg.role === "user" ? "B" : "AI"}
                  </span>
                  <p className={`text-sm leading-relaxed ${isVisible ? "text-foreground" : "text-tertiary line-through"}`}>
                    {msg.text}
                  </p>
                </motion.div>
              );
            })}

            {/* Câu trả lời của AI */}
            <div className="px-4 py-3 flex gap-3 bg-surface">
              <span className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                AI
              </span>
              <p className={`text-sm leading-relaxed font-medium ${
                canRemember
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              }`}>
                {canRemember ? AI_RESPONSES.large : AI_RESPONSES.small}
              </p>
            </div>
          </div>
        </div>
      </VisualizationSection>

            </LessonSection>

      </LessonSection>

{/* ━━━ AHA MOMENT ━━━ */}
      <LessonSection step={3} totalSteps={7} label="Khám phá">
      <LessonSection step={3} totalSteps={7} label="Khám phá">
      <AhaMoment>
        <strong>Context window</strong>{" "}là &quot;bộ nhớ ngắn hạn&quot; của LLM —
        giới hạn bao nhiêu text nó có thể &quot;nhìn thấy&quot; cùng lúc.
        Mọi thứ ngoài cửa sổ bị xóa hoàn toàn — AI không biết nó từng tồn tại!
      </AhaMoment>

            </LessonSection>

      </LessonSection>

{/* ━━━ ĐI SÂU — So sánh context window các model ━━━ */}
      <LessonSection step={4} totalSteps={7} label="Đi sâu">
      <LessonSection step={4} totalSteps={7} label="Đi sâu">
      <VisualizationSection>
        <h3 className="text-base font-semibold text-foreground mb-3">
          So sánh context window các model
        </h3>

        <div className="space-y-3">
          {MODELS.map(model => {
            const widthPct = Math.max(2, (model.tokens / maxTokens) * 100);
            return (
              <div key={model.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{model.name}</span>
                  <span className="text-xs text-muted">
                    {model.tokens >= 1000000
                      ? `${(model.tokens / 1000000).toFixed(0)}M`
                      : `${(model.tokens / 1000).toFixed(0)}K`}{" "}
                    token ≈ {model.pages} trang
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: model.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Callout variant="info" title="Token là gì?">
          1 token ≈ 3/4 từ tiếng Anh, hoặc ≈ 1/2 từ tiếng Việt (vì dấu tiếng Việt tốn thêm
          token). &quot;Xin chào&quot; = 2-4 token tùy model. Context window bao gồm
          cả prompt (đầu vào) VÀ response (đầu ra).
        </Callout>
      </VisualizationSection>

            </LessonSection>

      </LessonSection>

{/* ━━━ THỬ THÁCH ━━━ */}
      <LessonSection step={5} totalSteps={7} label="Thử thách">
      <LessonSection step={5} totalSteps={7} label="Thử thách">
      <InlineChallenge
        question="Bạn muốn AI tóm tắt một cuốn sách 500 trang. Model nào đủ context window?"
        options={[
          "GPT-3.5 (4K token ≈ 6 trang)",
          "GPT-4 Turbo (128K token ≈ 200 trang) — chia thành 3 phần",
          "Gemini 1.5 (1M token ≈ 1550 trang) — đọc nguyên cuốn",
          "Không model nào đủ — phải dùng database",
        ]}
        correct={2}
        explanation="Gemini 1.5 Pro với 1M context có thể đọc nguyên cuốn sách 500 trang trong một lần! GPT-4 Turbo (128K) cần chia thành 3 phần. GPT-3.5 (4K) chỉ đọc được ~6 trang — gần như vô dụng cho task này."
      />

            </LessonSection>

      </LessonSection>

{/* ━━━ GIẢI THÍCH ━━━ */}
      <LessonSection step={6} totalSteps={7} label="Giải thích">
      <LessonSection step={6} totalSteps={7} label="Giải thích">
      <ExplanationSection>
        <p>
          <strong>Context window</strong>{" "}(cửa sổ ngữ cảnh) là số lượng token tối đa mà LLM
          có thể xử lý trong một lần suy luận, bao gồm cả đầu vào và đầu ra.
        </p>

        <Callout variant="warning" title="Tại sao context lớn = tốn nhiều tiền?">
          Self-attention so sánh MỌI token với MỌI token khác, tạo ra độ phức tạp:
          <LaTeX block>{"O(n^2 \\cdot d)"}</LaTeX>
          Gấp đôi context (n) → gấp 4 lần tính toán và bộ nhớ. Đó là lý do API tính phí theo token
          và context dài đắt hơn nhiều.
        </Callout>

        <p><strong>Khi context window không đủ:</strong></p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
          <li>
            <strong>Chia nhỏ (chunking):</strong>{" "}Chia document dài thành nhiều phần, xử lý từng phần
          </li>
          <li>
            <strong>RAG:</strong>{" "}Chỉ truy xuất phần liên quan thay vì nhồi toàn bộ document
          </li>
          <li>
            <strong>Summarize → feed:</strong>{" "}Tóm tắt phần trước, đưa tóm tắt + phần mới vào context
          </li>
        </ul>

        <p><strong>Kỹ thuật mở rộng context:</strong></p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
          <li>
            <strong>RoPE (Rotary Position Embedding):</strong>{" "}Mã hóa vị trí linh hoạt, dễ extrapolate
          </li>
          <li>
            <strong>Sliding Window Attention:</strong>{" "}Mỗi token chỉ attend trong một cửa sổ cục bộ
          </li>
          <li>
            <strong>Ring Attention:</strong>{" "}Phân tán context qua nhiều GPU, mỗi GPU xử lý một phần
          </li>
        </ul>

        <CodeBlock language="python" title="context_management.py">{`from anthropic import Anthropic
client = Anthropic()

# Kiểm tra context đã dùng
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1000,
    messages=[
        {"role": "user", "content": "Tóm tắt nội dung này..."},
    ]
)

# response.usage cho biết token đã dùng
print(f"Input tokens: {response.usage.input_tokens}")
print(f"Output tokens: {response.usage.output_tokens}")
# Tổng phải < context window (200K cho Claude)`}</CodeBlock>
      </ExplanationSection>

            </LessonSection>

      </LessonSection>

{/* ━━━ TÓM TẮT ━━━ */}
      <LessonSection step={7} totalSteps={7} label="Tổng kết">
      <LessonSection step={7} totalSteps={7} label="Tổng kết">
      <MiniSummary
        points={[
          "Context window = 'bộ nhớ ngắn hạn' của LLM — giới hạn bao nhiêu token model có thể xử lý cùng lúc",
          "Bao gồm cả prompt (đầu vào) VÀ response (đầu ra) — phải cộng cả hai",
          "Chi phí tính toán tăng theo O(n²) — gấp đôi context = gấp 4 lần chi phí",
          "Khi context không đủ: dùng chunking, RAG, hoặc tóm tắt phần trước",
          "Xu hướng: GPT-3.5 (4K) → GPT-4 (128K) → Claude (200K) → Gemini (1M+) — ngày càng lớn",
        ]}
      />

      {/* ━━━ KIỂM TRA ━━━ */}
      <QuizSection questions={quizQuestions} />
      </LessonSection>
      </LessonSection>
    </>
  );
}
